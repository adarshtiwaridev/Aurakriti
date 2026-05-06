import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import * as faceDetection from '@mediapipe/face_detection';
import * as faceMesh from '@mediapipe/face_mesh';
import * as tf from '@tensorflow/tfjs';
import { createCanvas } from 'canvas';

const DEBUG_PREFIX = '[AR Face Detection API]';

// Initialize MediaPipe models
const faceDetectionOptions = {
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
  },
};

const faceMeshOptions = {
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
  },
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
};

// Performance monitoring
let modelLoadTime = null;
const startTime = Date.now();

function analyzeFaceShape(landmarks) {
  if (!landmarks || landmarks.length === 0) return null;
  
  // Enhanced face shape analysis with multiple measurements
  const jawline = landmarks.slice(0, 17);
  const eyebrows = landmarks.slice(70, 86);
  const nose = landmarks.slice(1, 5);
  const cheeks = [landmarks[50], landmarks[280], landmarks[234], landmarks[454]];
  const chin = landmarks[152];
  const forehead = [landmarks[9], landmarks[10]];
  
  // Calculate comprehensive face proportions
  const faceWidth = Math.abs(landmarks[234].x - landmarks[454].x); // Cheek width
  const faceHeight = Math.abs(landmarks[10].y - landmarks[152].y); // Forehead to chin
  const jawlineWidth = Math.abs(landmarks[172].x - landmarks[398].x); // Jaw width
  const foreheadWidth = Math.abs(landmarks[70].x - landmarks[300].x); // Forehead width
  const cheekboneWidth = Math.abs(cheeks[0].x - cheeks[1].x);
  
  const widthToHeightRatio = faceWidth / faceHeight;
  const foreheadToJawRatio = foreheadWidth / jawlineWidth;
  const jawToCheekboneRatio = jawlineWidth / cheekboneWidth;
  
  // Calculate face angles for more accurate shape detection
  const jawAngle = Math.atan2(jawline[16].y - jawline[0].y, jawline[16].x - jawline[0].x);
  const cheekProminence = Math.abs(cheeks[0].y - cheeks[2].y);
  
  // Enhanced face shape determination with confidence scoring
  const shapeScores = {
    round: 0,
    oval: 0,
    square: 0,
    heart: 0,
    diamond: 0,
    oblong: 0
  };
  
  // Score based on proportions
  if (widthToHeightRatio > 0.9) shapeScores.round += 2;
  if (widthToHeightRatio > 0.85) shapeScores.square += 2;
  if (widthToHeightRatio < 0.8) shapeScores.oval += 2;
  if (widthToHeightRatio < 0.7) shapeScores.oblong += 2;
  
  if (foreheadToJawRatio > 0.9) shapeScores.round += 2;
  if (foreheadToJawRatio > 0.95) shapeScores.oval += 2;
  if (foreheadToJawRatio < 0.9) shapeScores.square += 2;
  if (foreheadToJawRatio > 1.1) shapeScores.heart += 2;
  
  if (jawToCheekboneRatio > 0.9) shapeScores.round += 1;
  if (jawToCheekboneRatio < 0.85) shapeScores.heart += 1;
  
  if (Math.abs(jawAngle) < 0.1) shapeScores.oval += 1;
  if (cheekProminence < 5) shapeScores.round += 1;
  
  // Find shape with highest score
  const bestShape = Object.keys(shapeScores).reduce((a, b) => 
    shapeScores[a] > shapeScores[b] ? a : b
  );
  
  const confidence = shapeScores[bestShape] / 6; // Normalize to 0-1
  
  return {
    shape: bestShape,
    confidence: Math.min(confidence, 1),
    scores: shapeScores,
    measurements: {
      widthToHeightRatio,
      foreheadToJawRatio,
      jawToCheekboneRatio,
      faceWidth,
      faceHeight
    }
  };
}

function estimateSkinTone(rgbValues) {
  if (!rgbValues || rgbValues.length === 0) return null;
  
  // Enhanced skin tone analysis using HSV color space
  const avgR = rgbValues.reduce((sum, val) => sum + val.r, 0) / rgbValues.length;
  const avgG = rgbValues.reduce((sum, val) => sum + val.g, 0) / rgbValues.length;
  const avgB = rgbValues.reduce((sum, val) => sum + val.b, 0) / rgbValues.length;
  
  // Convert RGB to HSV for better skin tone classification
  const max = Math.max(avgR, avgG, avgB);
  const min = Math.min(avgR, avgG, avgB);
  const delta = max - min;
  
  let hue = 0;
  if (delta !== 0) {
    if (max === avgR) {
      hue = ((avgG - avgB) / delta) % 6;
    } else if (max === avgG) {
      hue = (avgB - avgR) / delta + 2;
    } else {
      hue = (avgR - avgG) / delta + 4;
    }
  }
  
  const saturation = max === 0 ? 0 : delta / max;
  const value = max / 255;
  
  // Enhanced skin tone classification with confidence
  let skinTone = null;
  let confidence = 0;
  
  if (value < 0.3) {
    skinTone = 'dark';
    confidence = 0.9;
  } else if (value < 0.5) {
    skinTone = saturation > 0.3 ? 'brown' : 'olive';
    confidence = 0.8;
  } else if (value < 0.7) {
    skinTone = saturation > 0.3 ? 'medium' : 'fair';
    confidence = 0.8;
  } else {
    skinTone = 'very_fair';
    confidence = 0.7;
  }
  
  // Adjust confidence based on hue (skin tones have specific hue ranges)
  if (hue >= 0 && hue <= 1.5) { // Red range
    confidence += 0.1;
  }
  
  return {
    tone: skinTone,
    confidence: Math.min(confidence, 1),
    hsv: {
      hue: hue * 60, // Convert to degrees
      saturation: saturation,
      value: value
    },
    rgb: {
      r: Math.round(avgR),
      g: Math.round(avgG),
      b: Math.round(avgB)
    }
  };
}

function calculateAnchorPoints(landmarks, jewelleryType) {
  if (!landmarks || landmarks.length === 0) return null;
  
  const anchorPoints = {};
  const faceWidth = Math.abs(landmarks[234].x - landmarks[454].x);
  const faceHeight = Math.abs(landmarks[10].y - landmarks[152].y);
  
  switch (jewelleryType) {
    case 'earring':
      // Enhanced ear positioning with better anatomical accuracy
      const earHeightRatio = 0.6; // Position at 60% of face height
      const earOffset = faceWidth * 0.15; // 15% offset from face edge
      
      anchorPoints.leftEar = {
        x: landmarks[234].x - earOffset, // Left of left cheek
        y: landmarks[10].y + (faceHeight * earHeightRatio), // Ear level
        z: 0,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      };
      
      anchorPoints.rightEar = {
        x: landmarks[454].x + earOffset, // Right of right cheek
        y: landmarks[10].y + (faceHeight * earHeightRatio),
        z: 0,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      };
      break;
      
    case 'necklace':
      // Enhanced necklace positioning with collar bone consideration
      const neckDrop = faceHeight * 0.15; // 15% below chin
      const necklaceWidth = faceWidth * 0.8; // 80% of face width
      
      anchorPoints.neck = {
        x: landmarks[152].x, // Chin center
        y: landmarks[152].y + neckDrop,
        z: 0,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { 
          x: necklaceWidth / 100, 
          y: necklaceWidth / 100, 
          z: 1 
        }
      };
      break;
      
    case 'bracelet':
      // Enhanced wrist positioning with scaling based on face size
      const wristScale = faceWidth * 0.25; // Scale based on face width
      const wristDrop = faceHeight * 2.5; // Position well below face
      
      anchorPoints.leftWrist = {
        x: landmarks[234].x - faceWidth * 1.2, // Left of face
        y: landmarks[152].y + wristDrop,
        z: 0,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { 
          x: wristScale / 50, 
          y: wristScale / 50, 
          z: 1 
        }
      };
      
      anchorPoints.rightWrist = {
        x: landmarks[454].x + faceWidth * 1.2, // Right of face
        y: landmarks[152].y + wristDrop,
        z: 0,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { 
          x: wristScale / 50, 
          y: wristScale / 50, 
          z: 1 
        }
      };
      break;
      
    case 'ring':
      // Enhanced finger positioning with proportional scaling
      const fingerScale = Math.abs(landmarks[70].x - landmarks[300].x) * 0.12;
      const fingerDrop = faceHeight * 1.8; // Position below face
      
      anchorPoints.leftRing = {
        x: landmarks[70].x - faceWidth * 0.4, // Left side
        y: landmarks[152].y + fingerDrop,
        z: 0,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { 
          x: fingerScale / 40, 
          y: fingerScale / 40, 
          z: 1 
        }
      };
      
      anchorPoints.rightRing = {
        x: landmarks[300].x + faceWidth * 0.4, // Right side
        y: landmarks[152].y + fingerDrop,
        z: 0,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { 
          x: fingerScale / 40, 
          y: fingerScale / 40, 
          z: 1 
        }
      };
      break;
  }
  
  return anchorPoints;
}

export async function POST(request) {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  console.log(`${DEBUG_PREFIX} Face analysis request received`, { requestId });
  
  try {
    // Parse request body
    const body = await request.json();
    const { landmarks, jewelleryType, rgbValues } = body;
    
    if (!landmarks || !jewelleryType) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: landmarks and jewelleryType',
          debugRequestId: requestId 
        },
        { status: 400 }
      );
    }
    
    // Authentication is optional for face detection
    const token = request.cookies?.get('ecocommerce_auth')?.value;
    let decoded = null;
    
    if (token) {
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`${DEBUG_PREFIX} User authenticated:`, decoded.email);
      } catch (error) {
        console.log(`${DEBUG_PREFIX} Invalid token, proceeding without auth:`, error.message);
      }
    } else {
      console.log(`${DEBUG_PREFIX} Proceeding without authentication`);
    }
    
    // Connect to database
    await connectDB();
    
    let user = null;
    if (decoded) {
      user = await User.findById(decoded.userId).select('_id email');
      if (!user) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'User not found',
            debugRequestId: requestId 
          },
          { status: 404 }
        );
      }
    }
    
    // Analyze facial features with enhanced methods
    const faceShapeAnalysis = analyzeFaceShape(landmarks);
    const skinToneAnalysis = rgbValues ? estimateSkinTone(rgbValues) : null;
    const anchorPoints = calculateAnchorPoints(landmarks, jewelleryType);
    
    // Prepare comprehensive analysis result
    const analysisResult = {
      userId: decoded?.userId || null,
      facialFeatures: {
        faceShape: faceShapeAnalysis?.shape,
        faceShapeConfidence: faceShapeAnalysis?.confidence,
        faceShapeScores: faceShapeAnalysis?.scores,
        faceMeasurements: faceShapeAnalysis?.measurements,
        skinTone: skinToneAnalysis?.tone,
        skinToneConfidence: skinToneAnalysis?.confidence,
        skinToneHSV: skinToneAnalysis?.hsv,
        skinToneRGB: skinToneAnalysis?.rgb,
        landmarks: landmarks.slice(0, 468), // Store all MediaPipe landmarks
        confidence: Math.max(faceShapeAnalysis?.confidence || 0, skinToneAnalysis?.confidence || 0)
      },
      anchorPoints,
      jewelleryType,
      performance: {
        processingTime: Date.now() - startTime,
        modelLoadTime: modelLoadTime,
        faceCount: 1,
        landmarkCount: landmarks.length,
        apiVersion: '2.0'
      },
      timestamp: new Date().toISOString()
    };
    
    console.log(`${DEBUG_PREFIX} Face analysis completed`, {
      requestId,
      userId: decoded.userId,
      faceShape,
      skinTone,
      jewelleryType
    });
    
    return NextResponse.json({
      success: true,
      data: analysisResult,
      debugRequestId: requestId
    });
    
  } catch (error) {
    console.error(`${DEBUG_PREFIX} Error during face analysis`, {
      requestId,
      error: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Face analysis failed',
        error: error.message,
        debugRequestId: requestId 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Enhanced Face Analysis API v2.0',
    version: '2.0',
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: '10MB',
    supportedJewelleryTypes: ['earring', 'necklace', 'bracelet', 'ring'],
    faceShapes: ['oval', 'round', 'square', 'heart', 'diamond', 'oblong'],
    skinTones: ['very_fair', 'fair', 'medium', 'olive', 'brown', 'dark'],
    features: {
      faceShapeAnalysis: true,
      skinToneAnalysis: true,
      anchorPointCalculation: true,
      confidenceScoring: true,
      performanceMonitoring: true,
      enhancedMeasurements: true
    },
    performance: {
      targetProcessingTime: '<100ms',
      supportedLandmarks: 468,
      confidenceThreshold: 0.5
    },
    technologies: {
      faceDetection: 'MediaPipe Face Detection',
      faceMesh: 'MediaPipe Face Mesh',
      imageProcessing: 'Canvas API',
      colorSpace: 'HSV + RGB',
      algorithms: ['Proportional Analysis', 'Geometric Calculations', 'Statistical Scoring']
    }
  });
}
