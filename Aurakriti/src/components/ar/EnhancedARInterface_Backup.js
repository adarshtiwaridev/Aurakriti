'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Camera, CameraOff, X, Zap, Settings, Maximize2 } from 'lucide-react';
import AR3DRenderer from './AR3DRenderer';
import * as faceDetection from '@mediapipe/face_detection';
import * as faceMesh from '@mediapipe/face_mesh';

const DEBUG_PREFIX = '[Enhanced AR Interface]';

// Performance monitoring
const PERFORMANCE_THRESHOLDS = {
  FPS_WARNING: 45,
  FPS_CRITICAL: 30,
  MEMORY_WARNING: 400,
  MEMORY_CRITICAL: 600
};

export default function EnhancedARInterface({
  productId,
  jewelleryType,
  onClose,
  onSessionComplete,
  onPerformanceUpdate,
  quality = 'high',
  enableDebugMode = false
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [faceData, setFaceData] = useState(null);
  const [modelData, setModelData] = useState(null);
  const [anchorPoints, setAnchorPoints] = useState(null);
  const [performance, setPerformance] = useState({
    fps: 0,
    memoryMB: 0,
    isOptimal: true
  });
  
  const [settings, setSettings] = useState({
    autoRotate: false,
    showDebugInfo: enableDebugMode,
    performanceMode: quality,
    lightingQuality: 'high',
    enableShadows: true
  });

  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const faceDetectorRef = useRef(null);
  const faceMeshRef = useRef(null);

  // Initialize MediaPipe models
  useEffect(() => {
    const initializeModels = async () => {
      try {
        // Face Detection
        const faceDetectionOptions = {
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
          },
        };
        
        faceDetectorRef.current = new faceDetection.FaceDetection(faceDetectionOptions);
        faceDetectorRef.current.setOptions({
          model: 'short',
          minDetectionConfidence: 0.5
        });

        // Face Mesh
        const faceMeshOptions = {
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          },
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        };
        
        faceMeshRef.current = new faceMesh.FaceMesh(faceMeshOptions);
        
        console.log(`${DEBUG_PREFIX} MediaPipe models initialized`);
      } catch (error) {
        console.error(`${DEBUG_PREFIX} Failed to initialize models:`, error);
        setError('Failed to initialize AR models');
      }
    };

    initializeModels();
  }, []);

  // Load 3D model data
  useEffect(() => {
    const loadModelData = async () => {
      try {
        const response = await fetch(`/api/models/3d/${productId}`);
        if (response.ok) {
          const data = await response.json();
          setModelData(data.data);
          console.log(`${DEBUG_PREFIX} 3D model loaded:`, data.data);
        } else {
          console.warn(`${DEBUG_PREFIX} No 3D model found, using fallback`);
          setModelData({
            modelUrl: null,
            materials: {
              metalType: 'gold',
              metalness: 0.9,
              roughness: 0.2,
              reflectivity: 0.8
            },
            isActive: true
          });
        }
      } catch (error) {
        console.error(`${DEBUG_PREFIX} Error loading model:`, error);
        setError('Failed to load 3D model');
      }
    };

    if (productId) {
      loadModelData();
    }
  }, [productId]);

  // Face detection and analysis
  const analyzeFace = useCallback(async () => {
    if (!videoRef.current || !faceMeshRef.current) return;

    setIsAnalyzing(true);
    const startTime = performance.now();

    try {
      // Create off-screen canvas for image processing
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);

      // Run face mesh detection
      const results = await new Promise((resolve) => {
        faceMeshRef.current.onResults(resolve);
        faceMeshRef.current.send({ image: canvas });
      });

      const landmarks = results.multiFaceLandmarks?.[0];
      
      if (landmarks && landmarks.length > 0) {
        // Send to analysis API
        const analysisResponse = await fetch('/api/try-on/analyze-face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            landmarks: landmarks,
            jewelleryType,
            sessionId: `session_${Date.now()}`
          })
        });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          setFaceData(analysisData.data.facialFeatures);
          setAnchorPoints(analysisData.data.anchorPoints);
          
          console.log(`${DEBUG_PREFIX} Face analysis completed:`, {
            faceShape: analysisData.data.facialFeatures.faceShape,
            skinTone: analysisData.data.facialFeatures.skinTone,
            confidence: analysisData.data.facialFeatures.confidence
          });
        }
      } else {
        console.warn(`${DEBUG_PREFIX} No face detected`);
        setFaceData(null);
        setAnchorPoints(null);
      }

      const processingTime = performance.now() - startTime;
      console.log(`${DEBUG_PREFIX} Face analysis took ${processingTime.toFixed(2)}ms`);

    } catch (error) {
      console.error(`${DEBUG_PREFIX} Face analysis error:`, error);
      setError('Face analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [jewelleryType]);

  // Continuous face tracking
  const startFaceTracking = useCallback(() => {
    if (!videoRef.current || !faceMeshRef.current || !isCameraActive) return;

    const track = async () => {
      if (!videoRef.current || !isCameraActive) return;

      try {
        // Create off-screen canvas for image processing
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);

        await new Promise((resolve) => {
          faceMeshRef.current.onResults((results) => {
            const landmarks = results.multiFaceLandmarks?.[0];
            
            if (landmarks && landmarks.length > 0) {
              // Update anchor points in real-time
              const updatedAnchorPoints = calculateAnchorPoints(landmarks, jewelleryType);
              setAnchorPoints(updatedAnchorPoints);
            }
            
            resolve();
          });
          
          faceMeshRef.current.send({ image: canvas });
        });

        animationFrameRef.current = requestAnimationFrame(track);
      } catch (error) {
        console.error(`${DEBUG_PREFIX} Tracking error:`, error);
      }
    };

    track();
  }, [jewelleryType, isCameraActive]);

  // Calculate anchor points (client-side version)
  const calculateAnchorPoints = (landmarks, type) => {
    if (!landmarks || landmarks.length === 0) return null;

    const faceWidth = Math.abs(landmarks[234].x - landmarks[454].x);
    const faceHeight = Math.abs(landmarks[10].y - landmarks[152].y);

    const points = {};
    
    switch (type) {
      case 'earring':
        const earHeightRatio = 0.6;
        const earOffset = faceWidth * 0.15;
        
        points.leftEar = {
          x: landmarks[234].x - earOffset,
          y: landmarks[10].y + (faceHeight * earHeightRatio),
          z: 0,
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        };
        
        points.rightEar = {
          x: landmarks[454].x + earOffset,
          y: landmarks[10].y + (faceHeight * earHeightRatio),
          z: 0,
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        };
        break;
        
      case 'necklace':
        const neckDrop = faceHeight * 0.15;
        points.neck = {
          x: landmarks[152].x,
          y: landmarks[152].y + neckDrop,
          z: 0,
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        };
        break;
        
      default:
        break;
    }

    return points;
  };

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        
        // Start face tracking after camera is ready
        videoRef.current.onloadedmetadata = () => {
          setTimeout(() => {
            analyzeFace();
            startFaceTracking();
          }, 1000);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied or not available');
    } finally {
      setIsLoading(false);
    }
  }, [analyzeFace, startFaceTracking]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsCameraActive(false);
    setFaceData(null);
    setAnchorPoints(null);
  }, []);

  // Handle performance updates from 3D renderer
  const handlePerformanceUpdate = useCallback((perfData) => {
    setPerformance(perfData);
    onPerformanceUpdate?.(perfData);
    
    // Auto-adjust quality based on performance
    if (perfData.fps < PERFORMANCE_THRESHOLDS.FPS_WARNING && settings.performanceMode !== 'low') {
      setSettings(prev => ({ ...prev, performanceMode: 'medium' }));
      console.warn(`${DEBUG_PREFIX} Performance warning: switching to medium quality`);
    }
    
    if (perfData.fps < PERFORMANCE_THRESHOLDS.FPS_CRITICAL && settings.performanceMode !== 'low') {
      setSettings(prev => ({ ...prev, performanceMode: 'low' }));
      console.warn(`${DEBUG_PREFIX} Performance critical: switching to low quality`);
    }
  }, [onPerformanceUpdate, settings.performanceMode]);

  // Memoize 3D renderer props
  const rendererProps = useMemo(() => ({
    modelUrl: modelData?.modelUrl,
    materials: modelData?.materials,
    anchorPoints: anchorPoints,
    isVisible: isCameraActive && anchorPoints !== null,
    onModelLoad: (data) => {
      console.log(`${DEBUG_PREFIX} 3D model loaded:`, data.stats);
    },
    onPerformanceUpdate: handlePerformanceUpdate,
    performanceMode: settings.performanceMode,
    autoRotate: settings.autoRotate,
    lightingSettings: {
      ambientIntensity: settings.lightingQuality === 'high' ? 0.4 : 0.3,
      directionalIntensity: settings.lightingQuality === 'high' ? 0.8 : 0.6,
      pointIntensity: settings.lightingQuality === 'high' ? 0.6 : 0.4,
      shadows: {
        enabled: settings.enableShadows,
        shadowMapSize: settings.performanceMode === 'high' ? 2048 : 1024
      }
    }
  }), [modelData, anchorPoints, isCameraActive, handlePerformanceUpdate, settings]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-white text-lg font-semibold">AR Virtual Try-On</h2>
          
          {/* Status indicators */}
          <div className="flex items-center gap-2">
            {isCameraActive && (
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            )}
            {isAnalyzing && (
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Settings button */}
          <button
            onClick={() => setSettings(prev => ({ ...prev, showDebugInfo: !prev.showDebugInfo }))}
            className="p-2 text-white hover:bg-white hover:bg-opacity-10 rounded"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-10 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 relative">
        {/* Camera view */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            isCameraActive ? 'block' : 'hidden'
          }`}
          style={{ transform: 'scaleX(-1)' }} // Mirror effect
        />
        
        {/* 3D renderer overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <AR3DRenderer {...rendererProps} />
        </div>

        {/* Debug info overlay */}
        {settings.showDebugInfo && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded text-xs font-mono max-w-sm">
            <div className="mb-2 font-bold">DEBUG INFO</div>
            <div>Camera: {isCameraActive ? 'ON' : 'OFF'}</div>
            <div>Analyzing: {isAnalyzing ? 'YES' : 'NO'}</div>
            <div>FPS: {performance.fps}</div>
            <div>Memory: {performance.memoryMB}MB</div>
            <div>Quality: {settings.performanceMode}</div>
            
            {faceData && (
              <>
                <div className="mt-2 pt-2 border-t border-gray-600">
                  <div>Face Shape: {faceData.faceShape}</div>
                  <div>Skin Tone: {faceData.skinTone}</div>
                  <div>Confidence: {(faceData.confidence * 100).toFixed(1)}%</div>
                </div>
              </>
            )}
            
            {anchorPoints && (
              <div className="mt-2 pt-2 border-t border-gray-600">
                <div>Jewellery: {jewelleryType}</div>
                <div>Anchor Points: {Object.keys(anchorPoints).length}</div>
              </div>
            )}
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Starting camera...</p>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <p className="text-red-600 text-center mb-4">{error}</p>
              <div className="flex gap-2">
                <button
                  onClick={startCamera}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Retry
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="flex justify-center items-center gap-4">
          {/* Camera toggle */}
          <button
            onClick={isCameraActive ? stopCamera : startCamera}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-4 rounded-full transition-colors"
          >
            {isCameraActive ? (
              <CameraOff className="w-6 h-6" />
            ) : (
              <Camera className="w-6 h-6" />
            )}
          </button>

          {/* Quality controls */}
          <div className="flex items-center gap-2 bg-white bg-opacity-10 rounded px-3 py-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <select
              value={settings.performanceMode}
              onChange={(e) => setSettings(prev => ({ ...prev, performanceMode: e.target.value }))}
              className="bg-transparent text-white text-sm border-none outline-none"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Auto-rotate toggle */}
          <button
            onClick={() => setSettings(prev => ({ ...prev, autoRotate: !prev.autoRotate }))}
            className={`p-3 rounded ${
              settings.autoRotate 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-600 text-white'
            }`}
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
