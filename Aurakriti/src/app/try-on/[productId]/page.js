'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SimpleARInterface from '@/components/ar/SimpleARInterface';
import { ArrowLeft, Sparkles, Camera } from 'lucide-react';
import { getProduct } from '@/services/productService';

export default function TryOnPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId;
  
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTryOn, setShowTryOn] = useState(false);
  const [jewelleryType, setJewelleryType] = useState('earring');

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await getProduct(productId);
        setProduct(data);
        
        // Determine jewellery type from product category
        const category = data.category?.toLowerCase();
        if (category.includes('earring')) setJewelleryType('earring');
        else if (category.includes('necklace')) setJewelleryType('necklace');
        else if (category.includes('bracelet')) setJewelleryType('bracelet');
        else if (category.includes('ring')) setJewelleryType('ring');
      } catch (err) {
        console.error('[TryOn] Product fetch error:', err);
        setError(err.message || 'Product not found');
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const handleSessionComplete = (sessionData) => {
    console.log('Try-on session completed:', sessionData);
    // Could redirect to order page or show success message
    router.push(`/products/${productId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {!showTryOn ? (
        // Product preview screen
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <div className="bg-black/80 backdrop-blur-sm p-4 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="text-white hover:text-gray-300 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-white font-semibold">Virtual Try-On</h1>
            <div className="w-8"></div>
          </div>

          {/* Product Info */}
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-md w-full text-center">
              {/* Product Image */}
              <div className="mb-8">
                <img
                  src={product.image || product.images?.[0] || '/placeholder-jewellery.jpg'}
                  alt={product.title}
                  className="w-48 h-48 object-cover rounded-2xl mx-auto mb-4"
                />
                <h2 className="text-2xl font-bold text-white mb-2">{product.title}</h2>
                <p className="text-gray-400 mb-4">{product.category}</p>
                <p className="text-3xl font-bold text-yellow-400 mb-6">
                  Rs {Number(product.price || 0).toLocaleString('en-IN')}
                </p>
              </div>

              {/* Try-On Features */}
              <div className="bg-gray-900 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-semibold text-white">AR Virtual Try-On</h3>
                </div>
                <p className="text-gray-300 mb-6">
                  See how this jewellery looks on you in real-time using your camera. 
                  Our AI will analyze your features and position the piece perfectly.
                </p>
                
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <Camera className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">Real-time camera preview</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-300">AI-powered positioning</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-400 rounded-full"></div>
                    <span className="text-gray-300">Capture & share results</span>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-4 mb-8">
                <p className="text-yellow-400 text-sm">
                  <strong>Requirements:</strong> Camera access, modern browser, good lighting
                </p>
              </div>

              {/* Start Button */}
              <button
                onClick={() => setShowTryOn(true)}
                className="w-full bg-linear-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold py-4 px-8 rounded-2xl transition-all transform hover:scale-105"
              >
                Start Virtual Try-On
              </button>
            </div>
          </div>
        </div>
      ) : (
        // AR Try-On Interface
        <SimpleARInterface
          productId={productId}
          jewelleryType={jewelleryType}
          onClose={() => setShowTryOn(false)}
          onSessionComplete={(sessionData) => {
            console.log('AR session completed:', sessionData);
            // Could redirect to order page or show success message
            router.push(`/products/${productId}`);
          }}
          quality="high"
          enableDebugMode={false}
        />
      )}
    </div>
  );
}
