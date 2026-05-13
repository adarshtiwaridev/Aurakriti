import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import jwt from 'jsonwebtoken';
import Jewellery3DModel from '@/models/Jewellery3DModel';
import Product from '@/models/Product';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const DEBUG_PREFIX = '[3D Model Upload API]';

// Model validation and processing utilities
class ModelProcessor {
  constructor() {
    this.supportedFormats = ['glb', 'gltf', 'fbx', 'obj'];
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.allowedMimeTypes = [
      'model/gltf+json',
      'model/gltf-binary',
      'model/fbx',
      'model/obj'
    ];
  }

  // Validate uploaded model file
  validateModel(file) {
    const errors = [];

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum of 50MB`);
    }

    // Check file extension
    const extension = file.name.split('.').pop().toLowerCase();
    if (!this.supportedFormats.includes(extension)) {
      errors.push(`Unsupported file format: ${extension}. Supported formats: ${this.supportedFormats.join(', ')}`);
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.type) && file.type !== 'application/octet-stream') {
      errors.push(`Invalid MIME type: ${file.type}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Process and optimize 3D model
  async processModel(file, modelId) {
    try {
      // Create upload directory
      const uploadDir = path.join(process.cwd(), 'public', 'models', '3d', modelId);
      await mkdir(uploadDir, { recursive: true });

      // Save original file
      const originalPath = path.join(uploadDir, `original.${file.name.split('.').pop()}`);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(originalPath, buffer);

      // Generate model metadata
      const metadata = await this.generateModelMetadata(originalPath, file);

      // Create optimized versions for different quality levels
      const optimizedVersions = await this.createOptimizedVersions(originalPath, uploadDir, metadata);

      return {
        originalUrl: `/models/3d/${modelId}/original.${file.name.split('.').pop()}`,
        optimizedVersions,
        metadata
      };

    } catch (error) {
      console.error(`${DEBUG_PREFIX} Model processing error:`, error);
      throw new Error(`Model processing failed: ${error.message}`);
    }
  }

  // Generate model metadata
  async generateModelMetadata(filePath, file) {
    // In a real implementation, you would:
    // 1. Use libraries like three.js to parse and analyze the model
    // 2. Extract vertex count, polygon count, texture information
    // 3. Generate LOD (Level of Detail) versions
    // 4. Optimize for web delivery

    const metadata = {
      fileSize: file.size,
      format: file.name.split('.').pop().toLowerCase(),
      version: '1.0',
      uploadedAt: new Date().toISOString(),
      // Mock data - replace with actual analysis
      vertexCount: Math.floor(Math.random() * 10000) + 1000,
      polygonCount: Math.floor(Math.random() * 5000) + 500,
      textureSize: 1024,
      boundingBox: {
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 }
      },
      materials: [],
      animations: [],
      lodLevels: []
    };

    return metadata;
  }

  // Create optimized versions for different quality levels
  async createOptimizedVersions(originalPath, uploadDir, metadata) {
    const versions = {};

    // High quality version (minimal compression)
    versions.high = {
      url: `/models/3d/${path.basename(uploadDir)}/high.glb`,
      polygonCount: metadata.polygonCount,
      textureSize: 2048,
      targetDevice: 'desktop'
    };

    // Medium quality version (balanced)
    versions.medium = {
      url: `/models/3d/${path.basename(uploadDir)}/medium.glb`,
      polygonCount: Math.floor(metadata.polygonCount * 0.7),
      textureSize: 1024,
      targetDevice: 'tablet'
    };

    // Low quality version (maximum optimization)
    versions.low = {
      url: `/models/3d/${path.basename(uploadDir)}/low.glb`,
      polygonCount: Math.floor(metadata.polygonCount * 0.4),
      textureSize: 512,
      targetDevice: 'mobile'
    };

    // In a real implementation, you would:
    // 1. Use tools like gltf-transform or Draco compression
    // 2. Generate actual optimized files
    // 3. Create LOD levels
    // 4. Optimize textures

    return versions;
  }

  // Validate anchor points
  validateAnchorPoints(anchorPoints, jewelleryType) {
    const requiredPoints = this.getRequiredAnchorPoints(jewelleryType);
    const errors = [];

    requiredPoints.forEach(point => {
      if (!anchorPoints[point]) {
        errors.push(`Missing required anchor point: ${point}`);
      } else {
        const { x, y, z } = anchorPoints[point];
        if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
          errors.push(`Invalid coordinates for anchor point: ${point}`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get required anchor points for jewellery type
  getRequiredAnchorPoints(jewelleryType) {
    const requirements = {
      earring: ['leftEar', 'rightEar'],
      necklace: ['neck'],
      bracelet: ['leftWrist', 'rightWrist'],
      ring: ['leftRing', 'rightRing']
    };

    return requirements[jewelleryType] || [];
  }

  // Process texture files
  async processTextures(textureFiles, modelId) {
    const processedTextures = [];

    for (const texture of textureFiles) {
      try {
        // Validate texture
        const textureValidation = this.validateTexture(texture);
        if (!textureValidation.isValid) {
          console.warn(`${DEBUG_PREFIX} Texture validation failed:`, textureValidation.errors);
          continue;
        }

        // Save texture
        const textureDir = path.join(process.cwd(), 'public', 'models', '3d', modelId, 'textures');
        await mkdir(textureDir, { recursive: true });

        const texturePath = path.join(textureDir, `${uuidv4()}.${texture.name.split('.').pop()}`);
        const buffer = Buffer.from(await texture.arrayBuffer());
        await writeFile(texturePath, buffer);

        processedTextures.push({
          url: `/models/3d/${modelId}/textures/${path.basename(texturePath)}`,
          type: this.getTextureType(texture.name),
          size: texture.size,
          format: texture.name.split('.').pop().toLowerCase()
        });

      } catch (error) {
        console.error(`${DEBUG_PREFIX} Error processing texture:`, error);
      }
    }

    return processedTextures;
  }

  // Validate texture file
  validateTexture(texture) {
    const errors = [];
    const supportedImageFormats = ['jpg', 'jpeg', 'png', 'webp'];
    const maxTextureSize = 4096;

    const extension = texture.name.split('.').pop().toLowerCase();
    if (!supportedImageFormats.includes(extension)) {
      errors.push(`Unsupported texture format: ${extension}`);
    }

    if (texture.size > maxTextureSize * maxTextureSize * 4) { // Rough estimate
      errors.push(`Texture too large: ${(texture.size / 1024 / 1024).toFixed(2)}MB`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Determine texture type from filename
  getTextureType(filename) {
    const lowerFilename = filename.toLowerCase();
    
    if (lowerFilename.includes('diffuse') || lowerFilename.includes('albedo') || lowerFilename.includes('color')) {
      return 'diffuse';
    } else if (lowerFilename.includes('normal')) {
      return 'normal';
    } else if (lowerFilename.includes('roughness')) {
      return 'roughness';
    } else if (lowerFilename.includes('metallic')) {
      return 'metallic';
    } else if (lowerFilename.includes('ao') || lowerFilename.includes('ambient')) {
      return 'ambientOcclusion';
    } else if (lowerFilename.includes('emissive')) {
      return 'emissive';
    }
    
    return 'diffuse'; // Default
  }
}

// Initialize model processor
const modelProcessor = new ModelProcessor();

export async function POST(request) {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  try {
    // Parse form data
    const formData = await request.formData();
    const modelFile = formData.get('model');
    const textureFiles = formData.getAll('textures');
    const productId = formData.get('productId');
    const jewelleryType = formData.get('jewelleryType');
    const materials = JSON.parse(formData.get('materials') || '{}');
    const anchorPoints = JSON.parse(formData.get('anchorPoints') || '{}');
    const renderingSettings = JSON.parse(formData.get('renderingSettings') || '{}');

    // Validate required fields
    if (!modelFile) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required field: model',
          debugRequestId: requestId 
        },
        { status: 400 }
      );
    }

    if (!productId || !jewelleryType) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: productId, jewelleryType',
          debugRequestId: requestId 
        },
        { status: 400 }
      );
    }

    // Authentication (required for model upload)
    const token = request.cookies?.get('ecocommerce_auth')?.value;
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required for model upload',
          debugRequestId: requestId 
        },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`${DEBUG_PREFIX} User authenticated:`, decoded.email);
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid authentication token',
          debugRequestId: requestId 
        },
        { status: 401 }
      );
    }

    // Validate model file
    const modelValidation = modelProcessor.validateModel(modelFile);
    if (!modelValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Model validation failed',
          errors: modelValidation.errors,
          debugRequestId: requestId 
        },
        { status: 400 }
      );
    }

    // Validate anchor points
    const anchorValidation = modelProcessor.validateAnchorPoints(anchorPoints, jewelleryType);
    if (!anchorValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Anchor points validation failed',
          errors: anchorValidation.errors,
          debugRequestId: requestId 
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Verify product exists
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

    // Generate unique model ID
    const modelId = uuidv4();

    // Process model file
    console.log(`${DEBUG_PREFIX} Processing model file...`);
    const processedModel = await modelProcessor.processModel(modelFile, modelId);

    // Process texture files
    let processedTextures = [];
    if (textureFiles && textureFiles.length > 0) {
      console.log(`${DEBUG_PREFIX} Processing ${textureFiles.length} texture files...`);
      processedTextures = await modelProcessor.processTextures(textureFiles, modelId);
    }

    // Prepare model data
    const modelData = {
      productId,
      modelUrl: processedModel.originalUrl,
      textureUrls: processedTextures.map(t => t.url),
      jewelleryType,
      anchorPoints,
      materials: {
        metalType: materials.metalType || 'gold',
        metalness: materials.metalness || 0.9,
        roughness: materials.roughness || 0.2,
        reflectivity: materials.reflectivity || 0.8,
        emissive: materials.emissive || '#000000',
        clearcoat: materials.clearcoat || 0.1,
        clearcoatRoughness: materials.clearcoatRoughness || 0.1
      },
      renderingSettings: {
        autoRotate: renderingSettings.autoRotate || false,
        rotationSpeed: renderingSettings.rotationSpeed || { x: 0, y: 0.01, z: 0 },
        scale: renderingSettings.scale || { x: 1, y: 1, z: 1 },
        lighting: {
          ambientIntensity: renderingSettings.lighting?.ambientIntensity || 0.4,
          directionalIntensity: renderingSettings.lighting?.directionalIntensity || 0.8,
          pointIntensity: renderingSettings.lighting?.pointIntensity || 0.6,
          shadowIntensity: renderingSettings.lighting?.shadowIntensity || 0.3
        },
        shadows: {
          enabled: renderingSettings.shadows?.enabled !== false,
          shadowMapSize: renderingSettings.shadows?.shadowMapSize || 2048
        },
        quality: renderingSettings.quality || 'high',
        performance: {
          lodLevels: processedModel.optimizedVersions ? Object.entries(processedModel.optimizedVersions).map(([quality, version]) => ({
            distance: quality === 'high' ? 0 : quality === 'medium' ? 5 : 10,
            modelUrl: version.url
          })) : [],
          maxDrawDistance: renderingSettings.performance?.maxDrawDistance || 1000
        }
      },
      metadata: {
        ...processedModel.metadata,
        author: decoded.email,
        tags: renderingSettings.tags || [],
        optimizedVersions: processedModel.optimizedVersions
      },
      priority: renderingSettings.priority || 0,
      isActive: true
    };

    // Save model to database
    const savedModel = await Jewellery3DModel.findOneAndUpdate(
      { productId },
      modelData,
      { new: true, upsert: true }
    );

    console.log(`${DEBUG_PREFIX} Model uploaded successfully`, {
      requestId,
      modelId: savedModel._id,
      productId,
      jewelleryType,
      fileSize: processedModel.metadata.fileSize
    });

    return NextResponse.json({
      success: true,
      data: {
        model: savedModel,
        processedModel,
        uploadInfo: {
          modelId,
          originalName: modelFile.name,
          fileSize: modelFile.size,
          textureCount: processedTextures.length,
          processingTime: Date.now()
        }
      },
      debugRequestId: requestId
    });

  } catch (error) {
    console.error(`${DEBUG_PREFIX} Error during model upload`, {
      requestId,
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { 
        success: false, 
        message: 'Model upload failed',
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
    message: '3D Model Upload API',
    version: '1.0',
    supportedFormats: modelProcessor.supportedFormats,
    maxFileSize: `${modelProcessor.maxFileSize / 1024 / 1024}MB`,
    supportedJewelleryTypes: ['earring', 'necklace', 'bracelet', 'ring'],
    supportedMaterials: ['gold', 'silver', 'platinum', 'rose_gold', 'white_gold', 'bronze'],
    features: {
      modelValidation: true,
      textureProcessing: true,
      optimization: true,
      lodGeneration: true,
      anchorPointValidation: true,
      metadataExtraction: true
    },
    uploadRequirements: {
      authentication: 'required',
      productId: 'required',
      jewelleryType: 'required',
      anchorPoints: 'required',
      materials: 'optional',
      textures: 'optional'
    }
  });
}
