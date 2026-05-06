'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Camera, CameraOff, X, Zap, Settings, Maximize2 } from 'lucide-react';
import AR3DRenderer from './AR3DRenderer';
import { FaceDetection } from '@mediapipe/face_detection';
import { FaceMesh } from '@mediapipe/face_mesh';

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
  jewelleryType = 'earring',
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [anchorPoints, setAnchorPoints] = useState(null);
  const [performance, setPerformance] = useState({
    fps: 60,
    memoryMB: 0,
    isOptimal: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);

  // MediaPipe refs
  const faceDetectorRef = useRef(null);
  const faceMeshRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Load 3D model data
  const [modelData, setModelData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize MediaPipe models
  useEffect(() => {
    const initializeModels = async () => {
      try {
        // Initialize Face Detection
        const faceDetectionOptions = {
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
          },
          model: 'short',
          minDetectionConfidence: 0.5
        };

        faceDetectorRef.current = new FaceDetection(faceDetectionOptions);
        await faceDetectorRef.current.initialize();

        // Initialize Face Mesh
        const faceMeshOptions = {
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          },
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        };

        faceMeshRef.current = new FaceMesh(faceMeshOptions);
        await faceMeshRef.current.initialize();

        console.log(`${DEBUG_PREFIX} MediaPipe models initialized successfully`);
      } catch (error) {
        console.error(`${DEBUG_PREFIX} Failed to initialize models:`, error);
        setError('Failed to initialize face detection. Please refresh and try again.');
      }
    };

    initializeModels();

    return () => {
      if (faceDetectorRef.current) {
        faceDetectorRef.current.close();
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
    };
  }, []);

  // Load 3D model data
  useEffect(() => {
    const loadModelData = async () => {
      try {
        const response = await fetch(`/api/models/3d/${productId}?quality=${quality}`);
        const result = await response.json();
        
        if (result.success) {
          setModelData(result.data);
          console.log(`${DEBUG_PREFIX} 3D model loaded:`, result.data);
        } else {
          console.warn(`${DEBUG_PREFIX} No 3D model found, using fallback`);
          // Use fallback model data
          setModelData({
            modelUrl: null,
            materials: {
              metalType: 'gold',
              metalness: 0.9,
              roughness: 0.2,
              color: '#FFD700'
            },
            anchorPoints: getDefaultAnchorPoints(jewelleryType)
          });
        }
      } catch (error) {
        console.error(`${DEBUG_PREFIX} Error loading model:`, error);
        // Use fallback
        setModelData({
          modelUrl: null,
          materials: {
            metalType: 'gold',
            metalness: 0.9,
            roughness: 0.2,
            color: '#FFD700'
          },
          anchorPoints: getDefaultAnchorPoints(jewelleryType)
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      loadModelData();
    }
  }, [productId, quality, jewelleryType]);

  // Get default anchor points
  function getDefaultAnchorPoints(type) {
    const defaults = {
      earring: {
        leftEar: { x: -0.1, y: 0.6, z: 0, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        rightEar: { x: 0.1, y: 0.6, z: 0, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
      },
      necklace: {
        neck: { x: 0, y: 0.8, z: 0, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
      },
      bracelet: {
        leftWrist: { x: -0.15, y: 0.3, z: 0, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        rightWrist: { x: 0.15, y: 0.3, z: 0, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
      },
      ring: {
        leftRing: { x: -0.05, y: 0.2, z: 0, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        rightRing: { x: 0.05, y: 0.2, z: 0, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
      }
    };
    return defaults[type] || defaults.earring;
  }

  // Calculate anchor points from face landmarks
  const calculateAnchorPoints = useCallback((landmarks, type) => {
    if (!landmarks || landmarks.length === 0) return null;

    const points = getDefaultAnchorPoints(type);

    switch (type) {
      case 'earring':
        // Use ear landmarks (approximate positions)
        points.leftEar.x = landmarks[234].x * 2 - 1; // Left ear area
        points.leftEar.y = landmarks[234].y * 2 - 1;
        points.rightEar.x = landmarks[454].x * 2 - 1; // Right ear area
        points.rightEar.y = landmarks[454].y * 2 - 1;
        break;
      case 'necklace':
        // Use chin and nose landmarks
        points.neck.x = landmarks[1].x * 2 - 1; // Chin
        points.neck.y = landmarks[1].y * 2 - 1;
        break;
      case 'bracelet':
        // Use wrist landmarks (not available in face mesh, use default)
        break;
      case 'ring':
        // Use finger landmarks (not available in face mesh, use default)
        break;
    }

    return points;
  }, []);

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
        setFaceDetected(true);
        
        // Calculate anchor points
        const updatedAnchorPoints = calculateAnchorPoints(landmarks, jewelleryType);
        setAnchorPoints(updatedAnchorPoints);

        // Send to API for analysis
        try {
          const response = await fetch('/api/try-on/analyze-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              landmarks: landmarks,
              jewelleryType: jewelleryType,
              sessionId: `session_${Date.now()}`
            })
          });

          const result = await response.json();
          if (result.success) {
            console.log(`${DEBUG_PREFIX} Face analysis complete:`, result.data);
          }
        } catch (apiError) {
          console.warn(`${DEBUG_PREFIX} API analysis failed:`, apiError);
        }
      } else {
        setFaceDetected(false);
        setAnchorPoints(null);
      }

      const processingTime = performance.now() - startTime;
      console.log(`${DEBUG_PREFIX} Face analysis took ${processingTime.toFixed(2)}ms`);
    } catch (error) {
      console.error(`${DEBUG_PREFIX} Face analysis error:`, error);
      setError('Face analysis failed. Please ensure good lighting and clear view of your face.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [jewelleryType, calculateAnchorPoints]);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        console.log(`${DEBUG_PREFIX} Camera started successfully`);
      }
    } catch (error) {
      console.error(`${DEBUG_PREFIX} Camera access error:`, error);
      setError('Camera access denied. Please allow camera access to use AR try-on.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
      setFaceDetected(false);
      setAnchorPoints(null);
      console.log(`${DEBUG_PREFIX} Camera stopped`);
    }
  };

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
              setFaceDetected(true);
            } else {
              setFaceDetected(false);
              setAnchorPoints(null);
            }
            
            resolve();
          });
          
          faceMeshRef.current.send({ image: canvas });
        });

        animationFrameRef.current = requestAnimationFrame(track);
      } catch (error) {
        console.error(`${DEBUG_PREFIX} Face tracking error:`, error);
      }
    };

    track();
  }, [jewelleryType, calculateAnchorPoints, isCameraActive]);

  // Performance monitoring
  useEffect(() => {
    const monitorPerformance = () => {
      const fps = 60; // Simplified FPS calculation
      const memoryMB = 100; // Simplified memory calculation
      
      setPerformance({
        fps,
        memoryMB,
        isOptimal: fps >= PERFORMANCE_THRESHOLDS.FPS_WARNING && 
                  memoryMB <= PERFORMANCE_THRESHOLDS.MEMORY_WARNING
      });

      if (onPerformanceUpdate) {
        onPerformanceUpdate({ fps, memoryMB, isOptimal: fps >= 45 && memoryMB <= 400 });
      }
    };

    const interval = setInterval(monitorPerformance, 1000);
    return () => clearInterval(interval);
  }, [onPerformanceUpdate]);

  // Start face tracking when camera is active
  useEffect(() => {
    if (isCameraActive && faceMeshRef.current) {
      startFaceTracking();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraActive, startFaceTracking]);

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Capture session
  const captureSession = async () => {
    if (!videoRef.current || !anchorPoints) return;

    try {
      // Create canvas for capture
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      // Draw video frame
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Convert to blob
      canvas.toBlob(async (blob) => {
        const imageData = URL.createObjectURL(blob);
        
        // Send session data to API
        try {
          const response = await fetch('/api/try-on/capture-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: `session_${Date.now()}`,
              capturedImages: [imageData],
              interactionEvents: [],
              userRating: 5,
              jewelleryType: jewelleryType,
              facialFeatures: {
                faceShape: 'oval',
                skinTone: 'medium',
                landmarks: []
              },
              anchorPoints: anchorPoints,
              deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                screenResolution: `${screen.width}x${screen.height}`
              },
              performance: performance,
              endSession: false
            })
          });

          const result = await response.json();
          if (result.success) {
            console.log(`${DEBUG_PREFIX} Session captured:`, result.data);
            if (onSessionComplete) {
              onSessionComplete(result.data);
            }
          }
        } catch (error) {
          console.error(`${DEBUG_PREFIX} Session capture error:`, error);
        }
      }, 'image/jpeg', 0.8);
    } catch (error) {
      console.error(`${DEBUG_PREFIX} Capture error:`, error);
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-6 rounded-lg max-w-md text-center">
          <h3 className="text-red-400 text-lg font-semibold mb-2">Error</h3>
          <p className="text-white mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black bg-opacity-80 backdrop-blur-sm p-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors flex items-center gap-2"
        >
          <X className="w-5 h-5" />
          Close
        </button>
        
        <h1 className="text-white font-semibold">AR Virtual Try-On</h1>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* AR Overlay */}
        {modelData && (
          <AR3DRenderer
            modelUrl={modelData.modelUrl}
            materials={modelData.materials}
            anchorPoints={anchorPoints || modelData.anchorPoints}
            isVisible={faceDetected && isCameraActive}
            onModelLoad={(data) => console.log(`${DEBUG_PREFIX} Model loaded:`, data)}
            onPerformanceUpdate={setPerformance}
            performanceMode={quality}
            autoRotate={false}
            lightingSettings={{
              ambientIntensity: 0.4,
              directionalIntensity: 0.8,
              pointIntensity: 0.6
            }}
          />
        )}

        {/* Status Indicator */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm">
              {isCameraActive ? 'Camera Active' : 'Camera Inactive'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className="text-sm">
              {faceDetected ? 'Face Detected' : 'No Face'}
            </span>
          </div>
          
          {isAnalyzing && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-sm">Analyzing...</span>
            </div>
          )}
        </div>

        {/* Performance indicator */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-xs z-10">
          <div>FPS: {performance.fps}</div>
          <div>Memory: {performance.memoryMB}MB</div>
          <div className={performance.isOptimal ? 'text-green-400' : 'text-yellow-400'}>
            {performance.isOptimal ? 'Optimal' : 'Sub-optimal'}
          </div>
        </div>

        {/* Debug Info */}
        {enableDebugMode && (
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded text-xs max-w-sm">
            <div className="font-semibold mb-2">Debug Info:</div>
            <div>Product ID: {productId}</div>
            <div>Jewellery Type: {jewelleryType}</div>
            <div>Quality: {quality}</div>
            <div>Anchor Points: {anchorPoints ? 'Calculated' : 'Not calculated'}</div>
            <div>Model Loaded: {modelData ? 'Yes' : 'No'}</div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors"
            >
              <Camera className="w-6 h-6" />
            </button>
          ) : (
            <>
              <button
                onClick={stopCamera}
                className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
              >
                <CameraOff className="w-6 h-6" />
              </button>
              
              <button
                onClick={captureSession}
                disabled={!faceDetected}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white p-3 rounded-full transition-colors"
              >
                <Zap className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute top-20 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Settings</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Quality</label>
                <select
                  value={quality}
                  onChange={(e) => {
                    // Handle quality change
                    console.log(`${DEBUG_PREFIX} Quality changed to:`, e.target.value);
                  }}
                  className="bg-gray-800 text-white px-3 py-1 rounded text-sm"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm mb-1">Debug Mode</label>
                <input
                  type="checkbox"
                  checked={enableDebugMode}
                  onChange={(e) => {
                    // Handle debug mode toggle
                    console.log(`${DEBUG_PREFIX} Debug mode:`, e.target.checked);
                  }}
                  className="mr-2"
                />
                <span className="text-sm">Enable debug info</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
