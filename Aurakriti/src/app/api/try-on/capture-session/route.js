import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import jwt from 'jsonwebtoken';
import TryOnSession from '@/models/TryOnSession';
import User from '@/models/User';
import { v4 as uuidv4 } from 'uuid';

const DEBUG_PREFIX = '[AR Session Capture API]';

// Session data processing utilities
class SessionProcessor {
  constructor() {
    this.sessionMetrics = {
      avgDuration: 0,
      totalSessions: 0,
      completionRate: 0,
      popularProducts: [],
      popularJewelleryTypes: [],
      userSatisfaction: 0
    };
  }

  // Process captured images
  async processCapturedImages(images, sessionId) {
    const processedImages = [];
    
    for (const image of images) {
      try {
        // Validate image data
        if (!image.data || !image.format) {
          console.warn(`${DEBUG_PREFIX} Invalid image data provided`);
          continue;
        }

        // In a real implementation, you would:
        // 1. Upload to Cloudinary or similar service
        // 2. Apply image optimization
        // 3. Generate thumbnails
        // 4. Store metadata
        
        const processedImage = {
          originalName: image.name || `capture_${Date.now()}`,
          format: image.format,
          size: image.size || 0,
          timestamp: new Date().toISOString(),
          sessionId: sessionId,
          url: `https://res.cloudinary.com/demo/image/capture/${sessionId}_${Date.now()}.jpg`, // Mock URL
          thumbnailUrl: `https://res.cloudinary.com/demo/image/capture/thumbnail_${sessionId}_${Date.now()}.jpg`, // Mock URL
          metadata: {
            deviceInfo: image.deviceInfo || {},
            cameraSettings: image.cameraSettings || {},
            faceData: image.faceData || {},
            anchorPoints: image.anchorPoints || {}
          }
        };

        processedImages.push(processedImage);
      } catch (error) {
        console.error(`${DEBUG_PREFIX} Error processing image:`, error);
      }
    }

    return processedImages;
  }

  // Calculate session metrics
  calculateSessionMetrics(sessionData) {
    const metrics = {
      duration: sessionData.tryOnDuration || 0,
      interactionCount: sessionData.interactionEvents?.length || 0,
      imageCount: sessionData.capturedImages?.length || 0,
      quality: this.calculateQualityScore(sessionData),
      engagement: this.calculateEngagementScore(sessionData)
    };

    return metrics;
  }

  // Calculate quality score based on session data
  calculateQualityScore(sessionData) {
    let score = 50; // Base score

    // Face detection quality
    if (sessionData.facialFeatures?.confidence) {
      score += sessionData.facialFeatures.confidence * 30;
    }

    // Session duration
    if (sessionData.tryOnDuration) {
      if (sessionData.tryOnDuration > 30) score += 10; // Good duration
      if (sessionData.tryOnDuration > 60) score += 10; // Excellent duration
    }

    // Image captures
    if (sessionData.capturedImages?.length > 0) {
      score += Math.min(sessionData.capturedImages.length * 5, 20);
    }

    // User feedback
    if (sessionData.userRating) {
      score += sessionData.userRating * 10;
    }

    return Math.min(score, 100);
  }

  // Calculate engagement score
  calculateEngagementScore(sessionData) {
    let score = 0;

    // Interaction events
    if (sessionData.interactionEvents) {
      score += sessionData.interactionEvents.length * 2;
    }

    // Model interactions
    if (sessionData.modelInteractions) {
      score += Object.values(sessionData.modelInteractions).reduce((sum, count) => sum + count, 0);
    }

    // Time spent actively interacting
    if (sessionData.activeInteractionTime) {
      score += Math.min(sessionData.activeInteractionTime / 10, 20);
    }

    return Math.min(score, 100);
  }

  // Generate session insights
  generateInsights(sessionData, userHistory = []) {
    const insights = {
      performance: {
        quality: this.calculateQualityScore(sessionData),
        engagement: this.calculateEngagementScore(sessionData),
        efficiency: this.calculateEfficiencyScore(sessionData)
      },
      behavior: {
        preferredJewelleryTypes: this.getPreferredJewelleryTypes(userHistory),
        averageSessionDuration: this.getAverageSessionDuration(userHistory),
        completionRate: this.getCompletionRate(userHistory),
        improvementSuggestions: this.generateImprovementSuggestions(sessionData, userHistory)
      },
      technical: {
        devicePerformance: sessionData.deviceInfo?.performance || {},
        cameraQuality: this.assessCameraQuality(sessionData),
        networkLatency: sessionData.networkMetrics?.latency || 0
      }
    };

    return insights;
  }

  // Get preferred jewellery types from history
  getPreferredJewelleryTypes(userHistory) {
    const typeCounts = {};
    
    userHistory.forEach(session => {
      if (session.jewelleryType) {
        typeCounts[session.jewelleryType] = (typeCounts[session.jewelleryType] || 0) + 1;
      }
    });

    return Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => ({ type, count }));
  }

  // Calculate average session duration
  getAverageSessionDuration(userHistory) {
    const durations = userHistory
      .filter(session => session.tryOnDuration)
      .map(session => session.tryOnDuration);

    if (durations.length === 0) return 0;

    const total = durations.reduce((sum, duration) => sum + duration, 0);
    return Math.round(total / durations.length);
  }

  // Calculate completion rate
  getCompletionRate(userHistory) {
    const completedSessions = userHistory.filter(session => session.endedAt).length;
    const totalSessions = userHistory.length;
    
    return totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  }

  // Calculate efficiency score
  calculateEfficiencyScore(sessionData) {
    let score = 50;

    // Time to first interaction
    if (sessionData.firstInteractionTime) {
      const timeToFirstInteraction = sessionData.firstInteractionTime - sessionData.timestamp;
      if (timeToFirstInteraction < 5000) score += 25; // Quick start
      else if (timeToFirstInteraction < 10000) score += 15; // Good start
    }

    // Error rate
    if (sessionData.errorCount !== undefined) {
      score -= Math.min(sessionData.errorCount * 5, 20);
    }

    // Help requests
    if (sessionData.helpRequests === 0) score += 10; // No help needed

    return Math.max(score, 0);
  }

  // Assess camera quality
  assessCameraQuality(sessionData) {
    const quality = {
      resolution: sessionData.deviceInfo?.cameraCapabilities?.videoWidth ? 
        `${sessionData.deviceInfo.cameraCapabilities.videoWidth}x${sessionData.deviceInfo.cameraCapabilities.videoHeight}` : 
        'unknown',
      frameRate: sessionData.deviceInfo?.cameraCapabilities?.frameRate || 'unknown',
      lighting: this.assessLightingQuality(sessionData.capturedImages),
      stability: this.assessCameraStability(sessionData.interactionEvents)
    };

    return quality;
  }

  // Assess lighting quality from captured images
  assessLightingQuality(capturedImages) {
    if (!capturedImages || capturedImages.length === 0) return 'unknown';

    // Simple brightness assessment (in real implementation, use image analysis)
    const avgBrightness = 50; // Mock value
    if (avgBrightness > 70) return 'excellent';
    if (avgBrightness > 50) return 'good';
    if (avgBrightness > 30) return 'fair';
    return 'poor';
  }

  // Assess camera stability
  assessCameraStability(interactionEvents) {
    if (!interactionEvents || interactionEvents.length === 0) return 'unknown';

    // Check for excessive movement or jitter
    const movementEvents = interactionEvents.filter(event => event.type === 'movement');
    const stabilityScore = Math.max(0, 100 - (movementEvents.length * 5));

    if (stabilityScore > 80) return 'excellent';
    if (stabilityScore > 60) return 'good';
    if (stabilityScore > 40) return 'fair';
    return 'poor';
  }

  // Generate improvement suggestions
  generateImprovementSuggestions(sessionData, userHistory) {
    const suggestions = [];

    // Based on session duration
    if (sessionData.tryOnDuration < 30) {
      suggestions.push({
        type: 'engagement',
        message: 'Try spending more time exploring different angles and lighting',
        priority: 'medium'
      });
    }

    // Based on interaction count
    if (sessionData.interactionEvents?.length < 5) {
      suggestions.push({
        type: 'interaction',
        message: 'Experiment with rotating and scaling the jewellery for better visualization',
        priority: 'low'
      });
    }

    // Based on user history patterns
    const avgDuration = this.getAverageSessionDuration(userHistory);
    if (sessionData.tryOnDuration < avgDuration * 0.5) {
      suggestions.push({
        type: 'consistency',
        message: 'Your sessions are shorter than usual. Consider taking more time to explore',
        priority: 'medium'
      });
    }

    return suggestions;
  }
}

// Initialize session processor
const sessionProcessor = new SessionProcessor();

export async function POST(request) {
const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
try {
  // Parse request body
  const body = await request.json();
  const { 
    sessionId, 
    capturedImages, 
    interactionEvents, 
    userRating, 
    userFeedback,
    jewelleryType,
    facialFeatures,
    anchorPoints,
    deviceInfo,
    performance,
    endSession = false
  } = body;
export async function GET(request) {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    // Connect to database
    await connectDB();

    if (sessionId) {
      // Get specific session with full processing
      const session = await TryOnSession.findOne({ sessionId })
        .populate('productId', 'title price images category');

      if (!session) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Session not found' 
          },
          { status: 404 }
        );
      }

      // Generate insights for this session
      const userHistory = userId ? 
        await TryOnSession.find({ userId })
          .sort({ timestamp: -1 })
          .limit(20) : [];

      const insights = sessionProcessor.generateInsights(session, userHistory);

      return NextResponse.json({
        success: true,
        data: {
          session,
          insights,
          debugRequestId: requestId
      requestId,
      userId: decoded.userId,
      sessionCount: sessions.length,
      totalCount,
      page,
      limit
    });
    
    return NextResponse.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      },
      debugRequestId: requestId
    });
    
  } catch (error) {
    console.error(`${DEBUG_PREFIX} Error retrieving session history`, {
      requestId,
      error: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve session history',
        error: error.message,
        debugRequestId: requestId 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing sessionId parameter',
          debugRequestId: requestId
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    const deletedSession = await TryOnSession.findOneAndDelete({ sessionId });

    if (!deletedSession) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Session not found',
          debugRequestId: requestId
        },
        { status: 404 }
      );
    }

    console.log(`${DEBUG_PREFIX} Session deleted successfully`, {
      requestId,
      sessionId,
      userId: deletedSession.userId
    });

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
      debugRequestId: requestId
    });

  } catch (error) {
    console.error(`${DEBUG_PREFIX} Error deleting session:`, {
      requestId,
      error: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete session',
        error: error.message,
        debugRequestId: requestId
      },
      { status: 500 }
    );
  }
}
