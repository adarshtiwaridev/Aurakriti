import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TryOnSession from '@/models/TryOnSession';
import Jewellery3DModel from '@/models/Jewellery3DModel';
import Product from '@/models/Product';
import jwt from 'jsonwebtoken';

const DEBUG_PREFIX = '[AI Recommendations API]';

// Recommendation engine
class RecommendationEngine {
  constructor() {
    this.weights = {
      userHistory: 0.4,
      styleCompatibility: 0.3,
      popularity: 0.2,
      trending: 0.1
    };
    
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  // Generate personalized recommendations
  async generateRecommendations(userId, options = {}) {
    const {
      limit = 20,
      includeSimilar = true,
      includeTrending = true,
      faceShape,
      skinTone,
      occasion = 'casual',
      priceRange,
      categories
    } = options;

    const cacheKey = `${userId}_${JSON.stringify(options)}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.recommendations;
      }
    }

    try {
      await connectDB();

      // Get user's try-on history
      const userHistory = await TryOnSession.find({ userId })
        .sort({ timestamp: -1 })
        .limit(50)
        .populate('productId', 'title price category images');

      // Get user preferences
      const userPreferences = this.analyzeUserPreferences(userHistory);
      
      // Get all available products with 3D models
      const availableProducts = await this.getAvailableProducts(categories, priceRange);
      
      // Score products based on multiple factors
      const scoredProducts = await this.scoreProducts(
        availableProducts,
        userPreferences,
        faceShape,
        skinTone,
        occasion,
        userHistory
      );

      // Sort by score and apply diversity
      const recommendations = this.applyDiversityAndRanking(scoredProducts, limit);

      // Add similar and trending products if requested
      let finalRecommendations = [...recommendations];
      
      if (includeSimilar && recommendations.length > 0) {
        const similarProducts = await this.getSimilarProducts(recommendations[0].productId, 5);
        finalRecommendations = [...finalRecommendations, ...similarProducts];
      }

      if (includeTrending) {
        const trendingProducts = await this.getTrendingProducts(5);
        finalRecommendations = [...finalRecommendations, ...trendingProducts];
      }

      // Cache results
      this.cache.set(cacheKey, {
        recommendations: finalRecommendations.slice(0, limit),
        timestamp: Date.now()
      });

      return finalRecommendations.slice(0, limit);

    } catch (error) {
      console.error(`${DEBUG_PREFIX} Error generating recommendations:`, error);
      return [];
    }
  }

  // Analyze user preferences from history
  analyzeUserPreferences(userHistory) {
    const preferences = {
      jewelleryTypes: {},
      categories: {},
      priceRange: { min: Infinity, max: 0 },
      materials: {},
      styles: {},
      averageRating: 0,
      sessionDuration: 0,
      interactionFrequency: 0
    };

    if (userHistory.length === 0) return preferences;

    let totalRating = 0;
    let totalDuration = 0;
    let ratingCount = 0;

    userHistory.forEach(session => {
      // Jewellery type preferences
      if (session.jewelleryType) {
        preferences.jewelleryTypes[session.jewelleryType] = 
          (preferences.jewelleryTypes[session.jewelleryType] || 0) + 1;
      }

      // Category preferences
      if (session.productId?.category) {
        preferences.categories[session.productId.category] = 
          (preferences.categories[session.productId.category] || 0) + 1;
      }

      // Price range preferences
      if (session.productId?.price) {
        preferences.priceRange.min = Math.min(preferences.priceRange.min, session.productId.price);
        preferences.priceRange.max = Math.max(preferences.priceRange.max, session.productId.price);
      }

      // Rating and duration
      if (session.userRating) {
        totalRating += session.userRating;
        ratingCount++;
      }
      
      if (session.tryOnDuration) {
        totalDuration += session.tryOnDuration;
      }
    });

    // Calculate averages
    preferences.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
    preferences.sessionDuration = totalDuration / userHistory.length;
    preferences.interactionFrequency = userHistory.length;

    // Normalize preferences
    Object.keys(preferences.jewelleryTypes).forEach(type => {
      preferences.jewelleryTypes[type] /= userHistory.length;
    });

    Object.keys(preferences.categories).forEach(category => {
      preferences.categories[category] /= userHistory.length;
    });

    return preferences;
  }

  // Get available products with 3D models
  async getAvailableProducts(categories, priceRange) {
    const query = { isActive: true };
    
    if (categories && categories.length > 0) {
      query.category = { $in: categories };
    }

    if (priceRange) {
      query.price = {};
      if (priceRange.min) query.price.$gte = priceRange.min;
      if (priceRange.max) query.price.$lte = priceRange.max;
    }

    const products = await Product.find(query)
      .select('_id title price category images description tags')
      .lean();

    // Filter products that have 3D models
    const productsWithModels = [];
    for (const product of products) {
      const model = await Jewellery3DModel.findByProduct(product._id);
      if (model && model.isActive) {
        productsWithModels.push({
          ...product,
          modelData: model
        });
      }
    }

    return productsWithModels;
  }

  // Score products based on multiple factors
  async scoreProducts(products, userPreferences, faceShape, skinTone, occasion, userHistory) {
    const scoredProducts = [];

    for (const product of products) {
      let score = 0;
      const factors = {};

      // 1. User history score (40% weight)
      const historyScore = this.calculateHistoryScore(product, userPreferences);
      factors.history = historyScore;
      score += historyScore * this.weights.userHistory;

      // 2. Style compatibility score (30% weight)
      const styleScore = this.calculateStyleScore(
        product, 
        faceShape, 
        skinTone, 
        occasion
      );
      factors.style = styleScore;
      score += styleScore * this.weights.styleCompatibility;

      // 3. Popularity score (20% weight)
      const popularityScore = await this.calculatePopularityScore(product._id);
      factors.popularity = popularityScore;
      score += popularityScore * this.weights.popularity;

      // 4. Trending score (10% weight)
      const trendingScore = await this.calculateTrendingScore(product._id);
      factors.trending = trendingScore;
      score += trendingScore * this.weights.trending;

      scoredProducts.push({
        ...product,
        recommendationScore: score,
        factors,
        reasoning: this.generateReasoning(factors, product)
      });
    }

    return scoredProducts;
  }

  // Calculate history-based score
  calculateHistoryScore(product, userPreferences) {
    let score = 0;

    // Category preference
    if (userPreferences.categories[product.category]) {
      score += userPreferences.categories[product.category] * 50;
    }

    // Price range preference
    if (product.price >= userPreferences.priceRange.min && 
        product.price <= userPreferences.priceRange.max) {
      score += 25;
    }

    // Jewellery type preference (if available from model)
    if (product.modelData?.jewelleryType && 
        userPreferences.jewelleryTypes[product.modelData.jewelleryType]) {
      score += userPreferences.jewelleryTypes[product.modelData.jewelleryType] * 25;
    }

    return Math.min(score, 100);
  }

  // Calculate style compatibility score
  calculateStyleScore(product, faceShape, skinTone, occasion) {
    let score = 50; // Base score

    if (!faceShape && !skinTone) return score;

    // Face shape compatibility
    if (faceShape && product.modelData) {
      const faceShapeCompatibility = this.getFaceShapeCompatibility(
        faceShape, 
        product.modelData.jewelleryType
      );
      score += faceShapeCompatibility * 25;
    }

    // Skin tone compatibility
    if (skinTone && product.modelData?.materials?.metalType) {
      const skinToneCompatibility = this.getSkinToneCompatibility(
        skinTone, 
        product.modelData.materials.metalType
      );
      score += skinToneCompatibility * 25;
    }

    // Occasion appropriateness
    if (occasion) {
      const occasionScore = this.getOccasionScore(
        product.category, 
        occasion
      );
      score += occasionScore * 20;
    }

    return Math.min(score, 100);
  }

  // Get face shape compatibility
  getFaceShapeCompatibility(faceShape, jewelleryType) {
    const compatibility = {
      oval: {
        earring: 0.9, necklace: 0.9, bracelet: 0.8, ring: 0.8
      },
      round: {
        earring: 0.7, necklace: 0.8, bracelet: 0.7, ring: 0.7
      },
      square: {
        earring: 0.6, necklace: 0.7, bracelet: 0.8, ring: 0.8
      },
      heart: {
        earring: 0.9, necklace: 0.8, bracelet: 0.7, ring: 0.7
      },
      diamond: {
        earring: 0.8, necklace: 0.9, bracelet: 0.8, ring: 0.8
      },
      oblong: {
        earring: 0.7, necklace: 0.6, bracelet: 0.8, ring: 0.8
      }
    };

    return compatibility[faceShape]?.[jewelleryType] || 0.5;
  }

  // Get skin tone compatibility
  getSkinToneCompatibility(skinTone, metalType) {
    const compatibility = {
      very_fair: {
        gold: 0.6, silver: 0.9, platinum: 0.9, rose_gold: 0.7, white_gold: 0.9
      },
      fair: {
        gold: 0.8, silver: 0.8, platinum: 0.8, rose_gold: 0.9, white_gold: 0.8
      },
      medium: {
        gold: 0.9, silver: 0.7, platinum: 0.7, rose_gold: 0.8, white_gold: 0.7
      },
      olive: {
        gold: 0.9, silver: 0.6, platinum: 0.6, rose_gold: 0.8, white_gold: 0.6
      },
      brown: {
        gold: 0.9, silver: 0.5, platinum: 0.5, rose_gold: 0.9, white_gold: 0.5
      },
      dark: {
        gold: 0.9, silver: 0.4, platinum: 0.4, rose_gold: 0.8, white_gold: 0.4
      }
    };

    return compatibility[skinTone]?.[metalType] || 0.5;
  }

  // Get occasion appropriateness score
  getOccasionScore(category, occasion) {
    const occasionScores = {
      casual: {
        earrings: 0.9, necklaces: 0.8, bracelets: 0.9, rings: 0.8
      },
      formal: {
        earrings: 0.8, necklaces: 0.9, bracelets: 0.7, rings: 0.9
      },
      business: {
        earrings: 0.7, necklaces: 0.8, bracelets: 0.8, rings: 0.8
      },
      party: {
        earrings: 0.9, necklaces: 0.8, bracelets: 0.9, rings: 0.7
      },
      romantic: {
        earrings: 0.8, necklaces: 0.9, bracelets: 0.7, rings: 0.9
      }
    };

    // Map category to jewellery type
    const categoryToType = {
      'earrings': 'earrings',
      'necklaces': 'necklaces',
      'bracelets': 'bracelets',
      'rings': 'rings'
    };

    const jewelleryType = categoryToType[category];
    return occasionScores[occasion]?.[jewelleryType] || 0.5;
  }

  // Calculate popularity score
  async calculatePopularityScore(productId) {
    try {
      const stats = await TryOnSession.getProductStats(productId);
      
      if (!stats.length) return 0;

      const productStats = stats[0];
      
      // Normalize popularity score
      let score = 0;
      
      // Total sessions (max 40 points)
      score += Math.min(productStats.totalSessions * 2, 40);
      
      // Average rating (max 30 points)
      if (productStats.avgRating) {
        score += productStats.avgRating * 6;
      }
      
      // Average duration (max 30 points)
      if (productStats.avgDuration) {
        score += Math.min(productStats.avgDuration / 2, 30);
      }

      return Math.min(score, 100);

    } catch (error) {
      console.error(`${DEBUG_PREFIX} Error calculating popularity:`, error);
      return 0;
    }
  }

  // Calculate trending score
  async calculateTrendingScore(productId) {
    try {
      // Get recent sessions (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const recentSessions = await TryOnSession.countDocuments({
        productId,
        timestamp: { $gte: sevenDaysAgo }
      });

      // Get total sessions for comparison
      const totalSessions = await TryOnSession.countDocuments({ productId });

      if (totalSessions === 0) return 0;

      // Calculate trend ratio
      const trendRatio = recentSessions / totalSessions;
      
      // Convert to score (recent activity gets higher score)
      return Math.min(trendRatio * 200, 100);

    } catch (error) {
      console.error(`${DEBUG_PREFIX} Error calculating trending:`, error);
      return 0;
    }
  }

  // Apply diversity and ranking
  applyDiversityAndRanking(scoredProducts, limit) {
    // Sort by score
    scoredProducts.sort((a, b) => b.recommendationScore - a.recommendationScore);

    // Apply diversity: ensure we don't get too many similar items
    const diverseProducts = [];
    const usedCategories = new Set();
    const usedTypes = new Set();

    for (const product of scoredProducts) {
      const category = product.category;
      const type = product.modelData?.jewelleryType;

      // Limit category and type diversity
      if (diverseProducts.length < limit) {
        if (!usedCategories.has(category) || usedCategories.size < 3) {
          if (!usedTypes.has(type) || usedTypes.size < 3) {
            diverseProducts.push(product);
            usedCategories.add(category);
            usedTypes.add(type);
          }
        }
      }
    }

    return diverseProducts.slice(0, limit);
  }

  // Generate reasoning for recommendations
  generateReasoning(factors, product) {
    const reasons = [];

    if (factors.history > 70) {
      reasons.push('Based on your previous preferences');
    }

    if (factors.style > 70) {
      reasons.push('Matches your style profile');
    }

    if (factors.popularity > 70) {
      reasons.push('Popular among users');
    }

    if (factors.trending > 70) {
      reasons.push('Currently trending');
    }

    return reasons.length > 0 ? reasons : ['Recommended for you'];
  }

  // Get similar products
  async getSimilarProducts(productId, limit = 5) {
    try {
      const product = await Product.findById(productId);
      if (!product) return [];

      // Find products in same category
      const similar = await Product.find({
        _id: { $ne: productId },
        category: product.category
      })
      .limit(limit)
      .select('_id title price category images')
      .lean();

      // Filter by 3D model availability
      const similarWithModels = [];
      for (const item of similar) {
        const model = await Jewellery3DModel.findByProduct(item._id);
        if (model && model.isActive) {
          similarWithModels.push({
            ...item,
            modelData: model,
            recommendationScore: 0.7, // Lower score for similar items
            reasoning: ['Similar to items you viewed']
          });
        }
      }

      return similarWithModels;

    } catch (error) {
      console.error(`${DEBUG_PREFIX} Error getting similar products:`, error);
      return [];
    }
  }

  // Get trending products
  async getTrendingProducts(limit = 5) {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Get products with most recent activity
      const trending = await TryOnSession.aggregate([
        { $match: { timestamp: { $gte: sevenDaysAgo } } },
        { $group: { _id: '$productId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      const productIds = trending.map(t => t._id);
      
      const products = await Product.find({ _id: { $in: productIds } })
        .select('_id title price category images')
        .lean();

      // Add 3D model data
      const trendingWithModels = [];
      for (const product of products) {
        const model = await Jewellery3DModel.findByProduct(product._id);
        if (model && model.isActive) {
          trendingWithModels.push({
            ...product,
            modelData: model,
            recommendationScore: 0.8,
            reasoning: ['Currently trending']
          });
        }
      }

      return trendingWithModels;

    } catch (error) {
      console.error(`${DEBUG_PREFIX} Error getting trending products:`, error);
      return [];
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log(`${DEBUG_PREFIX} Recommendation cache cleared`);
  }
}

// Initialize recommendation engine
const recommendationEngine = new RecommendationEngine();

export async function POST(request) {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  try {
    // Parse request body
    const body = await request.json();
    const {
      userId,
      faceShape,
      skinTone,
      occasion = 'casual',
      limit = 20,
      includeSimilar = true,
      includeTrending = true,
      priceRange,
      categories
    } = body;

    // Authentication (optional for anonymous recommendations)
    const token = request.cookies?.get('ecocommerce_auth')?.value;
    let decoded = null;
    
    if (token) {
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`${DEBUG_PREFIX} User authenticated:`, decoded.email);
      } catch (error) {
        console.log(`${DEBUG_PREFIX} Invalid token, proceeding with anonymous recommendations:`, error.message);
      }
    }

    // Generate recommendations
    const recommendations = await recommendationEngine.generateRecommendations(
      decoded?.userId || userId,
      {
        limit,
        includeSimilar,
        includeTrending,
        faceShape,
        skinTone,
        occasion,
        priceRange,
        categories
      }
    );

    console.log(`${DEBUG_PREFIX} Recommendations generated`, {
      requestId,
      userId: decoded?.userId,
      count: recommendations.length,
      faceShape,
      skinTone,
      occasion
    });

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        metadata: {
          count: recommendations.length,
          userId: decoded?.userId,
          parameters: {
            faceShape,
            skinTone,
            occasion,
            limit,
            includeSimilar,
            includeTrending
          },
          generatedAt: new Date().toISOString()
        }
      },
      debugRequestId: requestId
    });

  } catch (error) {
    console.error(`${DEBUG_PREFIX} Error generating recommendations`, {
      requestId,
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { 
        success: false, 
        message: 'Recommendation generation failed',
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
    message: 'AI Recommendations API',
    version: '1.0',
    supportedFaceShapes: ['oval', 'round', 'square', 'heart', 'diamond', 'oblong'],
    supportedSkinTones: ['very_fair', 'fair', 'medium', 'olive', 'brown', 'dark'],
    supportedOccasions: ['casual', 'formal', 'business', 'party', 'romantic'],
    features: {
      personalizedRecommendations: true,
      styleCompatibility: true,
      popularityScoring: true,
      trendingAnalysis: true,
      diversityAlgorithm: true,
      caching: true,
      reasoning: true
    },
    algorithms: {
      scoring: 'Multi-factor weighted scoring',
      diversity: 'Category and type diversity',
      trending: 'Recent activity analysis',
      popularity: 'Historical performance metrics',
      styleMatching: 'Face shape and skin tone compatibility'
    },
    weights: recommendationEngine.weights
  });
}
