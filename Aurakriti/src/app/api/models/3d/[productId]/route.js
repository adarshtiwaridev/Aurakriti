import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Jewellery3DModel from '@/models/Jewellery3DModel';
import Product from '@/models/Product';
import jwt from 'jsonwebtoken';

const DEBUG_PREFIX = '[3D Model Serving API]';

// Model serving utilities
class ModelServer {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.compressionEnabled = true;
    this.cdnBaseUrl = process.env.CDN_BASE_URL || '';
  }

  // Get model with caching
  async getModel(productId, quality = 'high', includeMetadata = false) {
    const cacheKey = `${productId}_${quality}_${includeMetadata}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Connect to database
      await connectDB();

      // Find model
      let model = await Jewellery3DModel.findByProduct(productId);
      
      if (!model) {
        return {
          success: false,
          error: 'Model not found',
          alternatives: await this.getAlternativeModels(productId)
        };
      }

      // Populate product info
      model = await Jewellery3DModel.findById(model._id)
        .populate('productId', 'title price images category description');

      if (!model.isActive) {
        return {
          success: false,
          error: 'Model is inactive'
        };
      }

      // Prepare response based on quality
      const response = await this.prepareModelResponse(model, quality, includeMetadata);

      // Cache the response
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });

      return response;

    } catch (error) {
      console.error(`${DEBUG_PREFIX} Error getting model:`, error);
      return {
        success: false,
        error: 'Failed to retrieve model'
      };
    }
  }

  // Prepare model response based on quality
  async prepareModelResponse(model, quality, includeMetadata) {
    const response = {
      success: true,
      data: {
        productId: model.productId._id,
        productInfo: {
          title: model.productId.title,
          price: model.productId.price,
          category: model.productId.category,
          images: model.productId.images
        },
        jewelleryType: model.jewelleryType,
        modelUrl: this.getModelUrl(model, quality),
        textureUrls: model.textureUrls,
        materials: model.materials,
        anchorPoints: model.anchorPoints,
        renderingSettings: this.getOptimizedRenderingSettings(model.renderingSettings, quality),
        priority: model.priority
      }
    };

    // Include metadata if requested
    if (includeMetadata) {
      response.data.metadata = model.metadata;
      response.data.performance = model.renderingSettings.performance;
    }

    return response;
  }

  // Get appropriate model URL based on quality
  getModelUrl(model, quality) {
    // Check for optimized versions
    if (model.metadata?.optimizedVersions?.[quality]) {
      const optimizedUrl = model.metadata.optimizedVersions[quality].url;
      return this.cdnBaseUrl + optimizedUrl;
    }

    // Fallback to original model
    return this.cdnBaseUrl + model.modelUrl;
  }

  // Get optimized rendering settings
  getOptimizedRenderingSettings(settings, quality) {
    const optimized = { ...settings };

    switch (quality) {
      case 'low':
        optimized.lighting = {
          ...optimized.lighting,
          ambientIntensity: Math.min(optimized.lighting.ambientIntensity * 0.7, 0.3),
          directionalIntensity: Math.min(optimized.lighting.directionalIntensity * 0.7, 0.5),
          pointIntensity: Math.min(optimized.lighting.pointIntensity * 0.7, 0.4)
        };
        optimized.shadows = {
          ...optimized.shadows,
          enabled: false,
          shadowMapSize: 512
        };
        break;

      case 'medium':
        optimized.lighting = {
          ...optimized.lighting,
          ambientIntensity: optimized.lighting.ambientIntensity * 0.85,
          directionalIntensity: optimized.lighting.directionalIntensity * 0.85,
          pointIntensity: optimized.lighting.pointIntensity * 0.85
        };
        optimized.shadows = {
          ...optimized.shadows,
          shadowMapSize: 1024
        };
        break;

      case 'high':
      default:
        // Use original settings
        break;
    }

    return optimized;
  }

  // Get alternative models when requested model is not found
  async getAlternativeModels(productId) {
    try {
      const product = await Product.findById(productId);
      if (!product) return [];

      // Find similar products in the same category
      const alternatives = await Product.find({
        category: product.category,
        _id: { $ne: productId }
      })
      .limit(5)
      .select('_id title price images category');

      // Check which alternatives have 3D models
      const modelsWithAlternatives = [];
      for (const alt of alternatives) {
        const model = await Jewellery3DModel.findByProduct(alt._id);
        if (model && model.isActive) {
          modelsWithAlternatives.push({
            productId: alt._id,
            title: alt.title,
            price: alt.price,
            images: alt.images,
            category: alt.category
          });
        }
      }

      return modelsWithAlternatives;

    } catch (error) {
      console.error(`${DEBUG_PREFIX} Error getting alternatives:`, error);
      return [];
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log(`${DEBUG_PREFIX} Cache cleared`);
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Initialize model server
const modelServer = new ModelServer();

export async function GET(request, { params }) {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { productId } = await params;
  
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const quality = searchParams.get('quality') || 'high';
    const includeMetadata = searchParams.get('metadata') === 'true';

    // Authentication (optional for model access)
    const token = request.cookies?.get('ecocommerce_auth')?.value;
    let decoded = null;
    
    if (token) {
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`${DEBUG_PREFIX} User authenticated:`, decoded.email);
      } catch (error) {
        console.log(`${DEBUG_PREFIX} Invalid token, proceeding without auth:`, error.message);
      }
    }

    // Get model using enhanced server
    const response = await modelServer.getModel(productId, quality, includeMetadata);
    // Get product information
    const product = await Product.findById(productId)
      .select('title category price images')
      .lean();

    console.log(`${DEBUG_PREFIX} 3D model retrieved`, {
      requestId,
      productId,
      jewelleryType: model3D.jewelleryType,
      hasModel: !!model3D.modelUrl
    });

    return NextResponse.json({
      success: true,
      data: {
        productId,
        modelUrl: model3D.modelUrl,
        textureUrls: model3D.textureUrls || [],
        jewelleryType: model3D.jewelleryType,
        anchorPoints: model3D.anchorPoints,
        materials: model3D.materials,
        renderingSettings: model3D.renderingSettings,
        product: product || {
          title: 'Unknown Product',
          category: model3D.jewelleryType,
          price: 0,
          images: []
        }
      },
      debugRequestId: requestId
    });

  } catch (error) {
    console.error(`${DEBUG_PREFIX} Error retrieving 3D model`, {
      requestId,
      productId,
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve 3D model',
        error: error.message,
        debugRequestId: requestId 
      },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { productId } = params;

  console.log(`${DEBUG_PREFIX} 3D model upload request`, {
    requestId,
    productId
  });

  try {
    // Parse request body
    const body = await request.json();
    const {
      modelUrl,
      textureUrls,
      jewelleryType,
      anchorPoints,
      materials,
      renderingSettings,
      modelMetadata
    } = body;

    // Validate required fields
    if (!modelUrl || !jewelleryType || !materials) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: modelUrl, jewelleryType, materials',
          debugRequestId: requestId 
        },
        { status: 400 }
      );
    }

    // Validate jewellery type
    const validTypes = ['earring', 'necklace', 'bracelet', 'ring'];
    if (!validTypes.includes(jewelleryType)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid jewellery type. Must be one of: ' + validTypes.join(', '),
          debugRequestId: requestId 
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Product not found',
          debugRequestId: requestId 
        },
        { status: 404 }
      );
    }

    // Create or update 3D model
    const model3D = await Jewellery3DModel.findOneAndUpdate(
      { productId },
      {
        productId,
        modelUrl,
        textureUrls: textureUrls || [],
        jewelleryType,
        anchorPoints: anchorPoints || {},
        materials,
        renderingSettings: renderingSettings || {},
        modelMetadata: modelMetadata || {},
        isActive: true
      },
      { upsert: true, new: true }
    );

    console.log(`${DEBUG_PREFIX} 3D model saved`, {
      requestId,
      productId,
      modelId: model3D._id,
      jewelleryType
    });

    return NextResponse.json({
      success: true,
      data: {
        modelId: model3D._id,
        productId,
        jewelleryType,
        modelUrl,
        message: '3D model saved successfully'
      },
      debugRequestId: requestId
    });

  } catch (error) {
    console.error(`${DEBUG_PREFIX} Error saving 3D model`, {
      requestId,
      productId,
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to save 3D model',
        error: error.message,
        debugRequestId: requestId 
      },
      { status: 500 }
    );
  }
}
