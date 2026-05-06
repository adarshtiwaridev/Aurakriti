import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TryOnSession from '@/models/TryOnSession';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const DEBUG_PREFIX = '[AI Style Analysis API]';

// Style analysis algorithms
class StyleAnalysisEngine {
  constructor() {
    this.faceShapeProfiles = {
      oval: {
        recommendedStyles: ['classic', 'elegant', 'versatile'],
        recommendedMetals: ['gold', 'white_gold', 'platinum'],
        recommendedGemstones: ['diamond', 'pearl'],
        avoidStyles: ['oversized', 'geometric'],
        styleTips: [
          'Balanced proportions work well with most jewellery styles',
          'Both delicate and statement pieces complement your face shape',
          'Consider layering necklaces for added dimension'
        ]
      },
      round: {
        recommendedStyles: ['angular', 'geometric', 'structured'],
        recommendedMetals: ['white_gold', 'platinum', 'silver'],
        recommendedGemstones: ['diamond', 'sapphire'],
        avoidStyles: ['delicate', 'tiny'],
        styleTips: [
          'Angular designs help elongate your face',
          'Statement pieces work better than delicate ones',
          'Consider longer necklaces to create vertical lines'
        ]
      },
      square: {
        recommendedStyles: ['curved', 'rounded', 'soft'],
        recommendedMetals: ['rose_gold', 'yellow_gold'],
        recommendedGemstones: ['emerald', 'ruby'],
        avoidStyles: ['sharp', 'angular'],
        styleTips: [
          'Soft, curved designs complement your strong jawline',
          'Round or oval shapes soften facial angles',
          'Consider drop earrings to soften your features'
        ]
      },
      heart: {
        recommendedStyles: ['delicate', 'feminine', 'romantic'],
        recommendedMetals: ['rose_gold', 'pink_gold'],
        recommendedGemstones: ['ruby', 'pink_sapphire'],
        avoidStyles: ['heavy', 'masculine'],
        styleTips: [
          'Delicate pieces enhance your romantic features',
          'Heart-shaped or curved designs work well',
          'Consider shorter necklaces that sit above the collarbone'
        ]
      },
      diamond: {
        recommendedStyles: ['balanced', 'symmetrical', 'elegant'],
        recommendedMetals: ['platinum', 'white_gold'],
        recommendedGemstones: ['diamond', 'aquamarine'],
        avoidStyles: ['asymmetrical', 'overly dramatic'],
        styleTips: [
          'Symmetrical designs enhance your balanced features',
          'Classic styles work particularly well',
          'Consider proportionate pieces that don\'t overwhelm'
        ]
      },
      oblong: {
        recommendedStyles: ['horizontal', 'wide', 'statement'],
        recommendedMetals: ['gold', 'two-tone'],
        recommendedGemstones: ['emerald', 'topaz'],
        avoidStyles: ['long', 'vertical'],
        styleTips: [
          'Wide or horizontal designs add width to your face',
          'Statement pieces help balance your proportions',
          'Consider chandelier or cluster earrings'
        ]
      }
    };

    this.skinToneProfiles = {
      very_fair: {
        recommendedMetals: ['white_gold', 'platinum', 'silver'],
        recommendedGemstones: ['diamond', 'blue_sapphire', 'aquamarine'],
        avoidColors: ['bronze', 'copper'],
        styleTips: [
          'Cool-toned metals complement your fair complexion',
          'White and clear gemstones provide beautiful contrast',
          'Consider delicate designs that won\'t overwhelm'
        ]
      },
      fair: {
        recommendedMetals: ['yellow_gold', 'rose_gold', 'white_gold'],
        recommendedGemstones: ['diamond', 'ruby', 'sapphire'],
        avoidColors: ['heavy_bronze'],
        styleTips: [
          'You can wear most metals successfully',
          'Both warm and cool tones work well',
          'Consider versatile pieces for different occasions'
        ]
      },
      medium: {
        recommendedMetals: ['gold', 'rose_gold', 'platinum'],
        recommendedGemstones: ['emerald', 'ruby', 'diamond'],
        avoidColors: [],
        styleTips: [
          'Most metals and gemstones complement your skin tone',
          'You have great versatility in styling',
          'Consider both classic and trendy pieces'
        ]
      },
      olive: {
        recommendedMetals: ['yellow_gold', 'rose_gold'],
        recommendedGemstones: ['emerald', 'peridot', 'citrine'],
        avoidColors: ['silver', 'white_gold'],
        styleTips: [
          'Warm-toned gold metals enhance your olive complexion',
          'Green and warm-colored gemstones work beautifully',
          'Consider rich, saturated colors'
        ]
      },
      brown: {
        recommendedMetals: ['yellow_gold', 'bronze', 'copper'],
        recommendedGemstones: ['ruby', 'garnet', 'citrine'],
        avoidColors: ['silver', 'platinum'],
        styleTips: [
          'Warm metals provide beautiful contrast',
          'Rich, warm gemstones complement your skin tone',
          'Consider bold, statement pieces'
        ]
      },
      dark: {
        recommendedMetals: ['yellow_gold', 'bronze'],
        recommendedGemstones: ['ruby', 'emerald', 'sapphire'],
        avoidColors: ['silver', 'white_platinum'],
        styleTips: [
          'Rich, warm metals create stunning contrast',
          'Vibrant colored gemstones pop against your skin',
          'Consider bold, dramatic designs'
        ]
      }
    };
  }

  // Analyze user style preferences from session history
  async analyzeUserPreferences(userId) {
    try {
      const sessions = await TryOnSession.find({ userId })
        .sort({ timestamp: -1 })
        .limit(20)
        .populate('productId', 'title category price images');

      if (!sessions || sessions.length === 0) {
        return {
          preferredCategories: [],
          preferredMetals: [],
          preferredStyles: [],
          priceRange: { min: 0, max: 0 },
          sessionCount: 0
        };
      }

      // Extract preferences from session data
      const categories = {};
      const metals = {};
      const styles = {};
      const prices = [];

      sessions.forEach(session => {
        if (session.productId) {
          // Category preferences
          const category = session.productId.category;
          categories[category] = (categories[category] || 0) + 1;

          // Price preferences
          if (session.productId.price) {
            prices.push(session.productId.price);
          }

          // Style preferences (if available from facial features)
          if (session.facialFeatures?.faceShape) {
            const shapeProfile = this.faceShapeProfiles[session.facialFeatures.faceShape];
            if (shapeProfile) {
              shapeProfile.recommendedStyles.forEach(style => {
                styles[style] = (styles[style] || 0) + 1;
              });
            }
          }
        }
      });

      // Calculate price range
      const sortedPrices = prices.sort((a, b) => a - b);
      const priceRange = {
        min: sortedPrices[0] || 0,
        max: sortedPrices[sortedPrices.length - 1] || 0,
        average: sortedPrices.length > 0 ? sortedPrices.reduce((a, b) => a + b, 0) / sortedPrices.length : 0
      };

      return {
        preferredCategories: Object.entries(categories)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([category]) => category),
        preferredMetals: Object.entries(metals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([metal]) => metal),
        preferredStyles: Object.entries(styles)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([style]) => style),
        priceRange,
        sessionCount: sessions.length
      };

    } catch (error) {
      console.error(`${DEBUG_PREFIX} Error analyzing user preferences:`, error);
      return null;
    }
  }

  // Generate personalized recommendations
  generateRecommendations(faceShape, skinTone, userPreferences, occasion = 'casual') {
    const recommendations = {
      faceShape: null,
      skinTone: null,
      personalized: [],
      occasion: {},
      confidence: 0
    };

    // Face shape recommendations
    const faceShapeProfile = this.faceShapeProfiles[faceShape];
    if (faceShapeProfile) {
      recommendations.faceShape = {
        shape: faceShape,
        recommendedStyles: faceShapeProfile.recommendedStyles,
        recommendedMetals: faceShapeProfile.recommendedMetals,
        recommendedGemstones: faceShapeProfile.recommendedGemstones,
        avoidStyles: faceShapeProfile.avoidStyles,
        styleTips: faceShapeProfile.styleTips
      };
    }

    // Skin tone recommendations
    const skinToneProfile = this.skinToneProfiles[skinTone];
    if (skinToneProfile) {
      recommendations.skinTone = {
        tone: skinTone,
        recommendedMetals: skinToneProfile.recommendedMetals,
        recommendedGemstones: skinToneProfile.recommendedGemstones,
        avoidColors: skinToneProfile.avoidColors,
        styleTips: skinToneProfile.styleTips
      };
    }

    // Combine recommendations
    const allRecommendedStyles = new Set([
      ...(recommendations.faceShape?.recommendedStyles || []),
      ...(recommendations.skinTone?.recommendedMetals || [])
    ]);

    const allRecommendedMetals = new Set([
      ...(recommendations.faceShape?.recommendedMetals || []),
      ...(recommendations.skinTone?.recommendedMetals || [])
    ]);

    const allRecommendedGemstones = new Set([
      ...(recommendations.faceShape?.recommendedGemstones || []),
      ...(recommendations.skinTone?.recommendedGemstones || [])
    ]);

    // Personalize based on user preferences
    if (userPreferences) {
      recommendations.personalized = this.personalizeRecommendations(
        Array.from(allRecommendedStyles),
        Array.from(allRecommendedMetals),
        Array.from(allRecommendedGemstones),
        userPreferences
      );
    }

    // Occasion-specific recommendations
    recommendations.occasion = this.getOccasionRecommendations(occasion, faceShape, skinTone);

    // Calculate confidence score
    recommendations.confidence = this.calculateRecommendationConfidence(
      faceShapeProfile,
      skinToneProfile,
      userPreferences
    );

    return recommendations;
  }

  // Personalize recommendations based on user history
  personalizeRecommendations(styles, metals, gemstones, userPreferences) {
    const personalized = [];

    // Boost scores for items matching user preferences
    const styleScores = {};
    const metalScores = {};
    const gemstoneScores = {};

    // Score based on user preferences
    userPreferences.preferredStyles.forEach(style => {
      styleScores[style] = (styleScores[style] || 0) + 2;
    });

    userPreferences.preferredMetals.forEach(metal => {
      metalScores[metal] = (metalScores[metal] || 0) + 2;
    });

    // Sort and return top recommendations
    const scoredStyles = styles.map(style => ({
      item: style,
      score: styleScores[style] || 0
    })).sort((a, b) => b.score - a.score);

    const scoredMetals = metals.map(metal => ({
      item: metal,
      score: metalScores[metal] || 0
    })).sort((a, b) => b.score - a.score);

    return {
      styles: scoredStyles.slice(0, 5).map(item => item.item),
      metals: scoredMetals.slice(0, 3).map(item => item.item),
      gemstones: gemstones.slice(0, 5)
    };
  }

  // Get occasion-specific recommendations
  getOccasionRecommendations(occasion, faceShape, skinTone) {
    const occasionProfiles = {
      casual: {
        description: 'Everyday wear, comfortable and versatile',
        styles: ['classic', 'minimal', 'versatile'],
        metals: ['white_gold', 'silver', 'platinum'],
        tips: ['Choose pieces that transition from day to night']
      },
      formal: {
        description: 'Elegant and sophisticated for special occasions',
        styles: ['elegant', 'classic', 'statement'],
        metals: ['platinum', 'white_gold', 'yellow_gold'],
        tips: ['Invest in timeless pieces that make a statement']
      },
      business: {
        description: 'Professional and polished for work environment',
        styles: ['classic', 'understated', 'elegant'],
        metals: ['platinum', 'white_gold', 'silver'],
        tips: ['Choose subtle pieces that enhance professionalism']
      },
      party: {
        description: 'Bold and eye-catching for celebrations',
        styles: ['statement', 'dramatic', 'trendy'],
        metals: ['yellow_gold', 'rose_gold'],
        tips: ['Don\'t be afraid to stand out with bold pieces']
      },
      romantic: {
        description: 'Soft and feminine for romantic occasions',
        styles: ['delicate', 'feminine', 'heart-shaped'],
        metals: ['rose_gold', 'pink_gold'],
        tips: ['Choose pieces that express romance and elegance']
      }
    };

    return occasionProfiles[occasion] || occasionProfiles.casual;
  }

  // Calculate recommendation confidence
  calculateRecommendationConfidence(faceShapeProfile, skinToneProfile, userPreferences) {
    let confidence = 0.5; // Base confidence

    // Boost confidence if we have good face/skin data
    if (faceShapeProfile) confidence += 0.2;
    if (skinToneProfile) confidence += 0.2;

    // Boost confidence if we have user preferences
    if (userPreferences && userPreferences.sessionCount > 5) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }
}

// Initialize style analysis engine
const styleEngine = new StyleAnalysisEngine();

export async function POST(request) {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  try {
    // Parse request body
    const body = await request.json();
    const { faceShape, skinTone, userId, occasion = 'casual' } = body;

    if (!faceShape && !skinTone) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: faceShape or skinTone',
          debugRequestId: requestId 
        },
        { status: 400 }
      );
    }

    // Authentication (optional)
    const token = request.cookies?.get('ecocommerce_auth')?.value;
    let decoded = null;
    
    if (token) {
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        console.log(`${DEBUG_PREFIX} Invalid token, proceeding without user preferences:`, error.message);
      }
    }

    // Connect to database
    await connectDB();

    // Get user preferences if authenticated
    let userPreferences = null;
    if (decoded) {
      userPreferences = await styleEngine.analyzeUserPreferences(decoded.userId);
    }

    // Generate recommendations
    const recommendations = styleEngine.generateRecommendations(
      faceShape,
      skinTone,
      userPreferences,
      occasion
    );

    console.log(`${DEBUG_PREFIX} Style analysis completed`, {
      requestId,
      userId: decoded?.userId,
      faceShape,
      skinTone,
      confidence: recommendations.confidence
    });

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        userPreferences,
        analysis: {
          faceShape,
          skinTone,
          occasion,
          timestamp: new Date().toISOString()
        }
      },
      debugRequestId: requestId
    });

  } catch (error) {
    console.error(`${DEBUG_PREFIX} Error during style analysis`, {
      requestId,
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { 
        success: false, 
        message: 'Style analysis failed',
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
    message: 'AI Style Analysis API',
    version: '1.0',
    supportedFaceShapes: Object.keys(styleEngine.faceShapeProfiles),
    supportedSkinTones: Object.keys(styleEngine.skinToneProfiles),
    supportedOccasions: ['casual', 'formal', 'business', 'party', 'romantic'],
    features: {
      faceShapeAnalysis: true,
      skinToneAnalysis: true,
      userPreferenceLearning: true,
      personalizedRecommendations: true,
      occasionSpecificAdvice: true,
      confidenceScoring: true
    },
    algorithms: {
      styleAnalysis: 'Profile-based matching',
      preferenceLearning: 'Historical analysis',
      personalization: 'Collaborative filtering',
      confidenceCalculation: 'Multi-factor scoring'
    }
  });
}
