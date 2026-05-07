const mongoose = require('mongoose');

const Jewellery3DModelSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },
  modelUrl: {
    type: String, // Cloudinary URL for .glb/.gltf file
    required: true
  },
  textureUrls: [{
    type: String, // Cloudinary URLs for textures
    required: false
  }],
  jewelleryType: {
    type: String,
    enum: ['earring', 'necklace', 'bracelet', 'ring'],
    required: true
  },
  anchorPoints: {
    // Different anchor points for different jewellery types
    earrings: {
      leftEar: {
        x: Number,
        y: Number,
        z: Number,
        rotation: {
          x: Number,
          y: Number,
          z: Number
        }
      },
      rightEar: {
        x: Number,
        y: Number,
        z: Number,
        rotation: {
          x: Number,
          y: Number,
          z: Number
        }
      }
    },
    necklaces: {
      neckBase: {
        x: Number,
        y: Number,
        z: Number,
        rotation: {
          x: Number,
          y: Number,
          z: Number
        }
      }
    },
    bracelets: {
      wrist: {
        x: Number,
        y: Number,
        z: Number,
        rotation: {
          x: Number,
          y: Number,
          z: Number
        }
      }
    },
    rings: {
      finger: {
        x: Number,
        y: Number,
        z: Number,
        rotation: {
          x: Number,
          y: Number,
          z: Number
        }
      }
    }
  },
  materials: {
    metalType: {
      type: String,
      enum: ['gold', 'silver', 'platinum', 'rose_gold', 'white_gold', 'bronze'],
      required: true
    },
    gemstoneType: {
      type: String,
      enum: ['diamond', 'ruby', 'emerald', 'sapphire', 'pearl', 'none'],
      default: 'none'
    },
    metalness: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.9
    },
    roughness: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.2
    },
    reflectivity: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8
    },
    emissive: {
      type: String, // Hex color code
      default: '#000000'
    },
    clearcoat: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.1
    },
    clearcoatRoughness: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.1
    }
  },
  renderingSettings: {
    autoRotate: {
      type: Boolean,
      default: false
    },
    rotationSpeed: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0.01 },
      z: { type: Number, default: 0 }
    },
    scale: {
      x: { type: Number, default: 1 },
      y: { type: Number, default: 1 },
      z: { type: Number, default: 1 }
    },
    lighting: {
      ambientIntensity: {
        type: Number,
        default: 0.4
      },
      directionalIntensity: {
        type: Number,
        default: 0.8
      },
      pointIntensity: {
        type: Number,
        default: 0.6
      },
      shadowIntensity: {
        type: Number,
        default: 0.3
      }
    },
    shadows: {
      enabled: { type: Boolean, default: true },
      shadowMapSize: { type: Number, default: 2048 }
    },
    quality: {
      type: String,
      enum: ['low', 'medium', 'high', 'ultra'],
      default: 'high'
    },
    performance: {
      lodLevels: [{
        distance: Number,
        modelUrl: String
      }],
      maxDrawDistance: {
        type: Number,
        default: 1000
      }
    }
  },
  metadata: {
    fileSize: Number, // in bytes
    vertexCount: Number,
    polygonCount: Number,
    textureSize: Number, // in pixels
    format: {
      type: String,
      enum: ['glb', 'gltf', 'fbx', 'obj'],
      required: true
    },
    version: String,
    author: String,
    license: String,
    tags: [String]
  },
  priority: {
    type: Number,
    default: 0 // Higher numbers = higher priority in loading
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
Jewellery3DModelSchema.index({ productId: 1 });
Jewellery3DModelSchema.index({ jewelleryType: 1 });
Jewellery3DModelSchema.index({ 'materials.metalType': 1 });
Jewellery3DModelSchema.index({ isActive: 1, priority: -1 });
Jewellery3DModelSchema.index({ 'renderingSettings.quality': 1 });

// Virtual for getting anchor points by jewellery type
Jewellery3DModelSchema.virtual('getAnchorPoints').get(function() {
  return (jewelleryType, position = 'default') => {
    const anchors = this.anchorPoints[jewelleryType];
    if (!anchors) return null;
    
    if (jewelleryType === 'earrings') {
      return position === 'left' ? anchors.leftEar : anchors.rightEar;
    } else if (jewelleryType === 'bracelets') {
      return anchors.wrist;
    } else if (jewelleryType === 'rings') {
      return anchors.finger;
    } else {
      return anchors.neckBase || anchors;
    }
  };
});

// Static methods
Jewellery3DModelSchema.statics.findByProduct = function(productId) {
  return this.findOne({ productId, isActive: true });
};

Jewellery3DModelSchema.statics.findByMetalType = function(metalType) {
  return this.find({ 'materials.metalType': metalType, isActive: true });
};

Jewellery3DModelSchema.statics.getOptimizedModels = function(quality = 'high') {
  return this.find({ 
    'renderingSettings.quality': { $gte: quality }, 
    isActive: true 
  }).sort({ priority: -1 });
};

// Pre-save middleware to validate anchor points
Jewellery3DModelSchema.pre('save', function(next) {
  const requiredFields = ['x', 'y', 'z'];
  
  // Validate that at least one anchor point is properly defined
  const hasValidAnchor = Object.values(this.anchorPoints).some(anchorGroup => {
    if (typeof anchorGroup === 'object' && anchorGroup !== null) {
      return Object.values(anchorGroup).some(anchor => {
        return anchor && requiredFields.every(field => anchor[field] !== undefined);
      });
    }
    return false;
  });
  
  if (!hasValidAnchor) {
    return next(new Error('At least one valid anchor point must be defined'));
  }
  
  next();
});

module.exports = mongoose.models.Jewellery3DModel || mongoose.model('Jewellery3DModel', Jewellery3DModelSchema);
