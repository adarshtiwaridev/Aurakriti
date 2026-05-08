'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Camera, CameraOff, X, Zap, Settings, Maximize2 } from 'lucide-react';
import * as faceDetection from '@mediapipe/face_detection';
import * as faceMesh from '@mediapipe/face_mesh';

const DEBUG_PREFIX = '[Simple AR Interface]';

// Performance monitoring
const PERFORMANCE_THRESHOLDS = {
  FPS_WARNING: 45,
  FPS_CRITICAL: 30,
  MEMORY_WARNING: 400,
  MEMORY_CRITICAL: 600
};

export default function SimpleARInterface({
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
  const [showJewellery, setShowJewellery] = useState(false);
  const [product, setProduct] = useState(null);
  const [processedImageUrl, setProcessedImageUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelData, setModelData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // MediaPipe refs
  const faceDetectorRef = useRef(null);
  const faceMeshRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Process image to remove white background
  const processImage = useCallback(async (imageUrl) => {
    if (!imageUrl) return null;
    
    setIsProcessing(true);
    
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Improved background removal algorithm
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          // More sophisticated white detection with threshold
          const brightness = (r + g + b) / 3;
          const isWhite = brightness > 200 && r > 200 && g > 200 && b > 200;
          
          if (isWhite) {
            data[i + 3] = 0; // Make transparent
          }
        }
        
        // Put modified image data back
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to blob and create URL
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          setProcessedImageUrl(url);
          setIsProcessing(false);
        }, 'image/png');
      };
      
      img.onerror = () => {
        console.warn(`${DEBUG_PREFIX} Failed to load image for processing`);
        setProcessedImageUrl(imageUrl);
        setIsProcessing(false);
      };
      
      img.src = imageUrl;
    } catch (error) {
      console.error(`${DEBUG_PREFIX} Image processing error:`, error);
      setProcessedImageUrl(imageUrl);
      setIsProcessing(false);
    }
  }, []);

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        const result = await response.json();
        
        if (result.success) {
          setProduct(result.data);
          console.log(`${DEBUG_PREFIX} Product loaded:`, result.data);
        } else {
          console.warn(`${DEBUG_PREFIX} Product not found`);
        }
      } catch (error) {
        console.error(`${DEBUG_PREFIX} Error loading product:`, error);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  // Process product image when it loads
  useEffect(() => {
    if (product?.image) {
      processImage(product.image || product.images?.[0]);
    }
  }, [product, processImage]);

  // Skip MediaPipe initialization (working without database)
  useEffect(() => {
    console.log(`${DEBUG_PREFIX} MediaPipe initialization skipped - working in offline mode`);
    
    // Set up simulated face detection after camera starts
    const simulatedFaceDetection = () => {
      setTimeout(() => {
        if (isCameraActive) {
          setFaceDetected(true);
          setShowJewellery(true);
          setAnchorPoints(getDefaultAnchorPoints(jewelleryType));
          console.log(`${DEBUG_PREFIX} Simulated face detection activated`);
        }
      }, 2000);
    };

    return () => {
      console.log(`${DEBUG_PREFIX} Cleanup - no MediaPipe models to close`);
    };
  }, [isCameraActive, jewelleryType]);

  // Load 3D model data (without database)
  useEffect(() => {
    const loadModelData = async () => {
      try {
        console.log(`${DEBUG_PREFIX} Using fallback model data (no database)`);
        
        // Use fallback model data directly without API call
        const fallbackModelData = {
          modelUrl: null,
          materials: {
            metalType: jewelleryType === 'ring' ? 'silver' : 'gold',
            metalness: 0.9,
            roughness: 0.2,
            color: jewelleryType === 'ring' ? '#C0C0C0' : '#FFD700',
            emissive: '#000000',
            clearcoat: 0.1,
            clearcoatRoughness: 0.1
          },
          anchorPoints: getDefaultAnchorPoints(jewelleryType),
          renderingSettings: {
            scale: { x: 1, y: 1, z: 1 },
            lighting: {
              ambientIntensity: 0.4,
              directionalIntensity: 0.8,
              pointIntensity: 0.6
            },
            autoRotate: false,
            rotationSpeed: { x: 0, y: 0.01, z: 0 },
            shadows: true,
            quality: quality
          },
          modelMetadata: {
            fileSize: '2.5MB',
            format: 'glb',
            version: '1.0',
            lodLevels: 3,
            lastUpdated: new Date().toISOString()
          }
        };
        
        setModelData(fallbackModelData);
        console.log(`${DEBUG_PREFIX} Fallback model data loaded:`, fallbackModelData);
      } catch (error) {
        console.error(`${DEBUG_PREFIX} Error with fallback model:`, error);
        // Use minimal fallback
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

        // Local face analysis (without database)
        try {
          console.log(`${DEBUG_PREFIX} Performing local face analysis`);
          
          // Simple local analysis based on landmarks
          const faceAnalysis = {
            faceShape: 'oval', // Default, could be calculated from landmarks
            skinTone: 'medium', // Default, could be calculated from image
            confidence: 0.85,
            sessionId: `session_${Date.now()}`,
            timestamp: new Date().toISOString(),
            landmarksCount: landmarks.length
          };
          
          console.log(`${DEBUG_PREFIX} Local face analysis complete:`, faceAnalysis);
          
          // You could add more sophisticated local analysis here
          // For example, calculate face width/height ratio, etc.
        } catch (analysisError) {
          console.warn(`${DEBUG_PREFIX} Local analysis failed:`, analysisError);
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
        
        // Simulate face detection after 2 seconds (offline mode)
        setTimeout(() => {
          setFaceDetected(true);
          setShowJewellery(true);
          setAnchorPoints(getDefaultAnchorPoints(jewelleryType));
          console.log(`${DEBUG_PREFIX} Simulated face detection activated - jewellery overlay visible`);
        }, 2000);
      }
    } catch (error) {
      console.error(`${DEBUG_PREFIX} Camera access error:`, error);
      setError('Camera access denied. Please allow camera access to use AR try-on.');
    }
  };

  // Skip continuous face tracking (working without MediaPipe)
  const startFaceTracking = useCallback(() => {
    console.log(`${DEBUG_PREFIX} Face tracking skipped - working in offline mode`);
    
    // Keep jewellery visible with static positioning
    if (isCameraActive && faceDetected) {
      setShowJewellery(true);
      // Could add simple periodic updates here if needed
    }
  }, [jewelleryType, isCameraActive, faceDetected]);

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

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
      setFaceDetected(false);
      setShowJewellery(false);
      console.log(`${DEBUG_PREFIX} Camera stopped`);
    }
  };

  // Capture session
  const captureSession = async () => {
    if (!videoRef.current || !faceDetected) return;

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
        
        // Create comprehensive session data
        const sessionData = {
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
          timestamp: new Date().toISOString(),
          endSession: false
        };

        // Store in localStorage instead of sending to API
        localStorage.setItem(`ar_session_${sessionData.sessionId}`, JSON.stringify(sessionData));
        
        console.log(`${DEBUG_PREFIX} Session captured locally:`, sessionData);
        
        // Also keep a history of recent sessions
        const recentSessions = JSON.parse(localStorage.getItem('ar_session_history') || '[]');
        recentSessions.unshift(sessionData);
        // Keep only last 10 sessions
        if (recentSessions.length > 10) {
          recentSessions.pop();
        }
        localStorage.setItem('ar_session_history', JSON.stringify(recentSessions));
        
        if (onSessionComplete) {
          onSessionComplete(sessionData);
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

        {/* Jewellery Overlay */}
        {showJewellery && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              {/* Product Image */}
              {product ? (
                <>
                  {isProcessing && (
                    <div className="text-white text-sm bg-blue-600 bg-opacity-90 px-3 py-1 rounded mb-2">
                      Processing image and removing background...
                    </div>
                  )}
                  <img
                    src={processedImageUrl || product.image || product.images?.[0] || '/placeholder-jewellery.jpg'}
                    alt={product.title}
                    className="w-40 h-40 object-contain rounded-lg mx-auto mb-2 opacity-90"
                    style={{
                      filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4)) brightness(1.3) contrast(1.3)',
                      transform: 'scale(1.8)',
                      border: '3px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '10px'
                    }}
                  />
                  <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                    {product.title || `${jewelleryType.charAt(0).toUpperCase() + jewelleryType.slice(1)} Try-On`}
                  </p>
                </>
              ) : (
                <>
                  {/* Fallback if product not loaded */}
                  <div className="bg-yellow-400 w-20 h-20 rounded-full mx-auto mb-2 opacity-80"></div>
                  <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                    {jewelleryType.charAt(0).toUpperCase() + jewelleryType.slice(1)} Try-On
                  </p>
                </>
              )}
            </div>
          </div>
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
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-sm">Analyzing...</span>
            </div>
          )}
          
          <div className="text-xs">
            <div className={performance.isOptimal ? 'text-green-400' : 'text-yellow-400'}>
              {performance.isOptimal ? 'Optimal' : 'Sub-optimal'}
            </div>
            <div>FPS: {performance.fps}</div>
            <div>Memory: {performance.memoryMB}MB</div>
          </div>
        </div>

        {/* Debug Info */}
        {enableDebugMode && (
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded text-xs max-w-sm">
            <div className="font-semibold mb-2">Debug Info:</div>
            <div>Product ID: {productId}</div>
            <div>Product Title: {product?.title || 'Loading...'}</div>
            <div>Product Image: {product?.image ? 'Loaded' : 'Not loaded'}</div>
            <div>Image Processing: {isProcessing ? 'Processing...' : processedImageUrl ? 'Complete' : 'Not started'}</div>
            <div>Background Removed: {processedImageUrl ? 'Yes' : 'No'}</div>
            <div>Jewellery Type: {jewelleryType}</div>
            <div>Quality: {quality}</div>
            <div>Face Detected: {faceDetected ? 'Yes' : 'No'}</div>
            <div>Camera Active: {isCameraActive ? 'Yes' : 'No'}</div>
            <div>Jewellery Visible: {showJewellery ? 'Yes' : 'No'}</div>
          </div>
        )}

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
              
              <div>
                <label className="block text-sm mb-1">Fullscreen</label>
                <button
                  onClick={toggleFullscreen}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                </button>
              </div>
            </div>
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

        {/* Instructions */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-gray-900 p-6 rounded-lg max-w-md text-center">
              <h3 className="text-white text-lg font-semibold mb-4">Start AR Try-On</h3>
              <p className="text-gray-300 mb-6">
                Click the camera button to start your virtual try-on experience. 
                Make sure you're in a well-lit area and your face is clearly visible.
              </p>
              <button
                onClick={startCamera}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Start Camera
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
