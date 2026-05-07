const mongoose = require('mongoose');

const TryOnSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for anonymous users
  },
  sessionId: {
    type: String,
    unique: true,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  capturedImages: [{
    type: String, // Cloudinary URLs
    required: false
  }],
  facialFeatures: {
    faceShape: {
      type: String,
      enum: ['oval', 'round', 'square', 'heart', 'diamond', 'oblong'],
      required: false
    },
    skinTone: {
      type: String,
      enum: ['very_fair', 'fair', 'medium', 'olive', 'brown', 'dark'],
      required: false
    },
    landmarks: {
      type: mongoose.Schema.Types.Mixed, // Store MediaPipe landmark coordinates
      required: false
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: false
    }
  },
  tryOnDuration: {
    type: Number, // Duration in seconds
    required: false
  },
  userRating: {
    type: Number,
    min: 1,
    max: 5,
    required: false
  },
  userFeedback: {
    type: String,
    maxlength: 500,
    required: false
  },
  deviceInfo: {
    userAgent: String,
    platform: String,
    screenResolution: String,
    cameraCapabilities: mongoose.Schema.Types.Mixed
  },
  performance: {
    fps: Number,
    memoryUsage: Number,
    loadTime: Number
  },
  jewelleryType: {
    type: String,
    enum: ['earring', 'necklace', 'bracelet', 'ring'],
    required: true
  },
  anchorPoints: {
    type: mongoose.Schema.Types.Mixed, // Store calculated anchor points
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
TryOnSessionSchema.index({ userId: 1, timestamp: -1 });
TryOnSessionSchema.index({ productId: 1, timestamp: -1 });
TryOnSessionSchema.index({ sessionId: 1 });
TryOnSessionSchema.index({ 'facialFeatures.faceShape': 1 });

// Virtual for session duration
TryOnSessionSchema.virtual('sessionDuration').get(function() {
  const end = this.endedAt || new Date();
  return Math.round((end - this.timestamp) / 1000); // Return seconds
});

// Static methods
TryOnSessionSchema.statics.getUserSessions = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('productId', 'title price images category');
};

TryOnSessionSchema.statics.getProductStats = function(productId) {
  return this.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$productId',
        totalSessions: { $sum: 1 },
        avgRating: { $avg: '$userRating' },
        avgDuration: { $avg: '$tryOnDuration' },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        totalSessions: 1,
        avgRating: { $round: ['$avgRating', 2] },
        avgDuration: { $round: ['$avgDuration', 0] },
        uniqueUserCount: { $size: '$uniqueUsers' }
      }
    }
  ]);
};

module.exports = mongoose.models.TryOnSession || mongoose.model('TryOnSession', TryOnSessionSchema);
