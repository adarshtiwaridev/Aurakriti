'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, CameraOff, X } from 'lucide-react';
import { getProduct } from '@/services/productService';

export default function MinimalARInterface({ 
  productId, 
  jewelleryType, 
  onClose 
}) {
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const streamRef = useRef(null);

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;
      
      try {
        const data = await getProduct(productId);
        setProduct(data);
        console.log('📦 Product loaded:', data.title);
        console.log('📦 Product images:', data.images);
      } catch (err) {
        console.error('❌ Error loading product:', err);
      }
    };

    loadProduct();
  }, [productId]);

  const startCamera = useCallback(async () => {
    try {
      console.log('🎥 Starting camera...');
      setIsLoading(true);
      setError(null);

      // Set camera active immediately for UI feedback
      setIsCameraActive(true);
      console.log('✅ Camera set to active immediately');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      console.log('📹 Camera stream obtained:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        console.log('✅ Video stream attached');
      }
    } catch (err) {
      console.error('❌ Camera error:', err);
      setError('Camera access denied or not available');
      setIsCameraActive(false); // Reset on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white/10 backdrop-blur-sm">
        <h2 className="text-white text-lg font-semibold">Virtual Try-On</h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-gray-900">
        {isCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-12 h-12 text-gray-600" />
              </div>
              <p className="text-gray-400 mb-4">Click the camera button to start</p>
            </div>
          </div>
        )}

        {/* Always Visible Test Overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
          {/* Always visible status */}
          <div className="absolute top-4 left-4 bg-blue-500 text-white p-4 rounded text-sm">
            STATUS: {isCameraActive ? 'CAMERA ON' : 'CAMERA OFF'}<br/>
            PRODUCT: {product?.title || 'Loading...'}<br/>
            TYPE: {jewelleryType}<br/>
            TIME: {new Date().toLocaleTimeString()}
          </div>
          
          {/* Camera-specific overlay */}
          {isCameraActive && (
            <div style={{ backgroundColor: 'rgba(255,0,0,0.2)' }}>
              {/* Big Red Test Box */}
              <div className="absolute top-4 right-4 w-32 h-32 bg-red-500 border-4 border-white">
                <p className="text-white text-center mt-4">ACTIVE</p>
              </div>
              
              {/* Product Jewellery */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                {product?.images && product.images.length > 0 ? (
                  <>
                    <div className="relative w-48 h-48">
                      <canvas 
                        ref={(canvas) => {
                          if (canvas && product?.images?.[0]) {
                            const ctx = canvas.getContext('2d');
                            const img = new Image();
                            img.crossOrigin = 'anonymous';
                            
                            img.onload = () => {
                              canvas.width = 192;
                              canvas.height = 192;
                              
                              // Draw image
                              ctx.drawImage(img, 0, 0, 192, 192);
                              
                              // Get image data
                              const imageData = ctx.getImageData(0, 0, 192, 192);
                              const data = imageData.data;
                              
                              // Remove white background
                              for (let i = 0; i < data.length; i += 4) {
                                const r = data[i];
                                const g = data[i + 1];
                                const b = data[i + 2];
                                
                                // Check if pixel is white or very light
                                const brightness = (r + g + b) / 3;
                                if (brightness > 220) {
                                  // Make transparent
                                  data[i + 3] = 0;
                                } else {
                                  // Enhance product colors
                                  data[i] = Math.min(255, r * 1.2);
                                  data[i + 1] = Math.min(255, g * 1.2);
                                  data[i + 2] = Math.min(255, b * 1.2);
                                }
                              }
                              
                              // Put modified data back
                              ctx.putImageData(imageData, 0, 0);
                              
                              // Add golden glow
                              ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
                              ctx.shadowBlur = 20;
                              ctx.drawImage(canvas, 0, 0);
                            };
                            
                            img.src = product.images[0];
                          }
                        }}
                        className="w-48 h-48"
                        style={{
                          transform: 'scale(1.5)',
                          filter: 'drop-shadow(0 0 30px rgba(255,215,0,1))'
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-bold">
                      {product.title}
                    </div>
                  </>
                ) : (
                  <div className="w-48 h-48 bg-yellow-400 rounded-full border-4 border-black flex items-center justify-center">
                    <p className="text-black text-center font-bold text-sm">
                      {product ? 'NO IMG' : 'LOADING'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Bottom Status */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-8 py-4 rounded">
                AR OVERLAY ACTIVE
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <p className="text-red-600 text-center">{error}</p>
              <button
                onClick={startCamera}
                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Starting camera...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-white/10 backdrop-blur-sm">
        <div className="flex justify-center gap-4">
          {/* Test Button */}
          <button
            onClick={() => {
              console.log('🔘 Test button clicked, current state:', isCameraActive);
              setIsCameraActive(!isCameraActive);
              console.log('🔘 State toggled to:', !isCameraActive);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Test Toggle
          </button>
          
          {/* Camera Button */}
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
        </div>
      </div>
    </div>
  );
}
