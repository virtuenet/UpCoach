import { Request, Response, NextFunction } from 'express';

import { adaptiveLearning } from '../../services/ai/AdaptiveLearning';
import { conversationalAI } from '../../services/ai/ConversationalAI';
import { insightGenerator } from '../../services/ai/InsightGenerator';
import { predictiveAnalytics } from '../../services/ai/PredictiveAnalytics';
import { recommendationEngine } from '../../services/ai/RecommendationEngine';
import { voiceAI } from '../../services/ai/VoiceAI';
import { enhancedAIService } from '../../services/ai/EnhancedAIService';
import { personalizationEngine } from '../../services/ai/PersonalizationEngine';
import { analyticsEngine } from '../../services/ai/AnalyticsEngine';
import { hybridDecisionEngine } from '../../services/ai/HybridDecisionEngine';
import { AIInteraction } from '../../models/AIInteraction';

// Type assertion for model static methods
type ModelStatic = typeof AIInteraction & {
  create: (values: unknown) => Promise<AIInteraction>;
  findByPk: (id: unknown) => Promise<AIInteraction | null>;
  findAll: (options?: unknown) => Promise<AIInteraction[]>;
  findOne: (options?: unknown) => Promise<AIInteraction | null>;
};
import { logger } from '../../utils/logger';

export class AIController {
  constructor() {
    // Bind all methods to preserve `this` context when passed to Express routes
    this.getRecommendations = this.getRecommendations.bind(this);
    this.getOptimalTiming = this.getOptimalTiming.bind(this);
    this.getAdaptiveSchedule = this.getAdaptiveSchedule.bind(this);
    this.processMessage = this.processMessage.bind(this);
    this.generateSmartResponse = this.generateSmartResponse.bind(this);
    this.createLearningPath = this.createLearningPath.bind(this);
    this.getLearningPaths = this.getLearningPaths.bind(this);
    this.trackLearningProgress = this.trackLearningProgress.bind(this);
    this.getNextModule = this.getNextModule.bind(this);
    this.analyzeVoice = this.analyzeVoice.bind(this);
    this.getVoiceCoaching = this.getVoiceCoaching.bind(this);
    this.getVoiceInsights = this.getVoiceInsights.bind(this);
    this.compareVoiceSessions = this.compareVoiceSessions.bind(this);
    this.getActiveInsights = this.getActiveInsights.bind(this);
    this.dismissInsight = this.dismissInsight.bind(this);
    this.getInsightReport = this.getInsightReport.bind(this);
    this.predictGoalCompletion = this.predictGoalCompletion.bind(this);
    this.getBehaviorPatterns = this.getBehaviorPatterns.bind(this);
    this.getEngagementMetrics = this.getEngagementMetrics.bind(this);
    this.getPredictions = this.getPredictions.bind(this);
    this.getSuccessFactors = this.getSuccessFactors.bind(this);
    this.getInterventionPlan = this.getInterventionPlan.bind(this);
    this.getCoachingStrategy = this.getCoachingStrategy.bind(this);
    this.getPersonalizedContent = this.getPersonalizedContent.bind(this);
    this.updatePersonalization = this.updatePersonalization.bind(this);
    this.getPersonalizationPreferences = this.getPersonalizationPreferences.bind(this);
    this.hybridGenerate = this.hybridGenerate.bind(this);
    this.getRoutingDecision = this.getRoutingDecision.bind(this);
    this.trackAnalyticsEvent = this.trackAnalyticsEvent.bind(this);
  }

  // Recommendations
  async getRecommendations(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '' || req.params.userId;
      const { types, limit } = req.query;

      const recommendations = await recommendationEngine.generateRecommendations(
        userId,
        types ? (types as string).split(',') : undefined,
        limit ? parseInt(limit as string) : 5
      );

      _res.json({
        success: true,
        recommendations,
        generatedAt: new Date(),
      });
    } catch (error) {
      logger.error('Error getting recommendations:', error);
      next(error);
    }
  }

  async getOptimalTiming(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const { activityType } = req.params;

      const timing = await recommendationEngine.getOptimalTiming(userId, activityType);

      _res.json({
        success: true,
        timing,
      });
    } catch (error) {
      logger.error('Error getting optimal timing:', error);
      next(error);
    }
  }

  async getAdaptiveSchedule(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const { date } = req.query;

      const schedule = await recommendationEngine.generateAdaptiveSchedule(
        userId,
        date ? new Date(date as string) : new Date()
      );

      _res.json({
        success: true,
        schedule,
      });
    } catch (error) {
      logger.error('Error generating adaptive schedule:', error);
      next(error);
    }
  }

  // Conversational AI
  async processMessage(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const { message, conversationId, context } = req.body;

      const result = await conversationalAI.processConversation(
        userId,
        message,
        conversationId,
        context
      );

      _res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error('Error processing conversation:', error);
      next(error);
    }
  }

  async generateSmartResponse(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const { message, options } = req.body;

      const response = await conversationalAI.generateSmartResponse(userId, message, options);

      _res.json({
        success: true,
        response,
      });
    } catch (error) {
      logger.error('Error generating smart response:', error);
      next(error);
    }
  }

  // Predictive Analytics
  async getPredictions(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '' || req.params.userId;

      const [successPrediction, churnRisk, behaviorPatterns] = await Promise.all([
        predictiveAnalytics.predictUserSuccess(userId),
        predictiveAnalytics.predictChurnRisk(userId),
        predictiveAnalytics.analyzeBehaviorPatterns(userId),
      ]);

      _res.json({
        success: true,
        predictions: {
          success: successPrediction,
          churnRisk,
          behaviorPatterns,
        },
      });
    } catch (error) {
      logger.error('Error getting predictions:', error);
      next(error);
    }
  }

  async predictGoalCompletion(req: Request, _res: Response, next: NextFunction) {
    try {
      const { goalId } = req.params;

      const prediction = await predictiveAnalytics.predictGoalCompletion(goalId);

      _res.json({
        success: true,
        prediction,
      });
    } catch (error) {
      logger.error('Error predicting goal completion:', error);
      next(error);
    }
  }

  async getInterventionPlan(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const { riskType } = req.params;

      const plan = await predictiveAnalytics.generateInterventionPlan(userId, riskType as unknown);

      _res.json({
        success: true,
        interventionPlan: plan,
      });
    } catch (error) {
      logger.error('Error generating intervention plan:', error);
      next(error);
    }
  }

  // Adaptive Learning
  async createLearningPath(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const { goalId, options } = req.body;

      const path = await adaptiveLearning.createPersonalizedLearningPath(userId, goalId, options);

      _res.json({
        success: true,
        learningPath: path,
      });
    } catch (error) {
      logger.error('Error creating learning path:', error);
      next(error);
    }
  }

  async getLearningPaths(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';

      const paths = await adaptiveLearning.getLearningPaths(userId);

      _res.json({
        success: true,
        learningPaths: paths,
      });
    } catch (error) {
      logger.error('Error getting learning paths:', error);
      next(error);
    }
  }

  async trackLearningProgress(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const { pathId, moduleId } = req.params;
      const { progress } = req.body;

      await adaptiveLearning.trackLearningProgress(userId, pathId, moduleId, progress);

      _res.json({
        success: true,
        message: 'Progress tracked successfully',
      });
    } catch (error) {
      logger.error('Error tracking learning progress:', error);
      next(error);
    }
  }

  async getNextModule(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const { pathId } = req.params;

      const module = await adaptiveLearning.getRecommendedNextModule(userId, pathId);

      _res.json({
        success: true,
        nextModule: module,
      });
    } catch (error) {
      logger.error('Error getting next module:', error);
      next(error);
    }
  }

  // Voice AI
  async analyzeVoice(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const audioBuffer = req.file?.buffer;

      if (!audioBuffer) {
        return _res.status(400).json({ error: 'Audio file required' });
      }

      const { sessionType, previousContext } = req.body;

      const analysis = await voiceAI.analyzeVoice(userId, audioBuffer, {
        sessionType,
        previousContext,
      });

      _res.json({
        success: true,
        analysis,
      });
    } catch (error) {
      logger.error('Error analyzing voice:', error);
      next(error);
    }
  }

  async getVoiceCoaching(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const { voiceAnalysis, options } = req.body;

      const coaching = await voiceAI.generateVoiceCoaching(userId, voiceAnalysis, options);

      _res.json({
        success: true,
        coaching,
      });
    } catch (error) {
      logger.error('Error generating voice coaching:', error);
      next(error);
    }
  }

  async getVoiceInsights(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const { days } = req.query;

      const insights = await voiceAI.getVoiceInsightSummary(
        userId,
        days ? parseInt(days as string) : 30
      );

      _res.json({
        success: true,
        insights,
      });
    } catch (error) {
      logger.error('Error getting voice insights:', error);
      next(error);
    }
  }

  async compareVoiceSessions(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const { sessionId1, sessionId2 } = req.params;

      const comparison = await voiceAI.compareVoiceSessions(userId, sessionId1, sessionId2);

      _res.json({
        success: true,
        comparison,
      });
    } catch (error) {
      logger.error('Error comparing voice sessions:', error);
      next(error);
    }
  }

  // Insights
  async getInsightReport(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '' || req.params.userId;
      const { days, startDate, endDate } = req.query;

      const report = await insightGenerator.generateInsightReport(userId, {
        days: days ? parseInt(days as string) : undefined,
        start: startDate ? new Date(startDate as string) : undefined,
        end: endDate ? new Date(endDate as string) : undefined,
      });

      _res.json({
        success: true,
        report,
      });
    } catch (error) {
      logger.error('Error generating insight report:', error);
      next(error);
    }
  }

  async getActiveInsights(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';

      const insights = await insightGenerator.getActiveInsights(userId);

      _res.json({
        success: true,
        insights,
      });
    } catch (error) {
      logger.error('Error getting active insights:', error);
      next(error);
    }
  }

  async dismissInsight(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const { insightId } = req.params;

      await insightGenerator.dismissInsight(userId, insightId);

      _res.json({
        success: true,
        message: 'Insight dismissed successfully',
      });
    } catch (error) {
      logger.error('Error dismissing insight:', error);
      next(error);
    }
  }

  // Hybrid AI Methods
  async hybridGenerate(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { messages, options = {} } = req.body;

      const startTime = Date.now();

      // Use enhanced AI service with hybrid processing
      const result = await enhancedAIService.generateHybridResponse(messages, {
        ...options,
        routingContext: {
          userId,
          requestType: 'conversation',
          priority: options.priority || 'normal',
        },
      });

      const processingTime = Date.now() - startTime;

      // Record interaction
      if (userId) {
        await (AIInteraction as unknown).create({
          userId,
          type: 'conversation',
          model: result.response.model,
          tokensUsed: result.response.usage.totalTokens,
          responseTime: processingTime / 1000,
          requestData: { messages, options },
          responseData: { content: result.response.content },
          metadata: {
            provider: result.metrics.provider,
            fallbackOccurred: result.metrics.fallbackOccurred,
            routingDecisionTime: result.metrics.routingDecisionTime,
            qualityScore: result.metrics.qualityScore,
          },
        });
      }

      _res.json({
        success: true,
        response: result.response,
        metrics: result.metrics,
        processingTime,
      });
    } catch (error) {
      logger.error('Error in hybrid generation:', error);
      next(error);
    }
  }

  async getRoutingDecision(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { messages, options = {} } = req.body;

      const decision = await hybridDecisionEngine.routeRequest(messages, options, {
        userId,
        requestType: 'query',
      });

      _res.json({
        success: true,
        decision,
      });
    } catch (error) {
      logger.error('Error getting routing decision:', error);
      next(error);
    }
  }

  // Personalization Methods
  async getPersonalizationPreferences(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';

      const preferences = await personalizationEngine.getUserPreferences(userId);

      _res.json({
        success: true,
        preferences,
      });
    } catch (error) {
      logger.error('Error getting personalization preferences:', error);
      next(error);
    }
  }

  async updatePersonalization(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const { preferences, behavior, context } = req.body;

      await personalizationEngine.updateUserProfile(userId, {
        preferences,
        behavior,
        context,
      });

      _res.json({
        success: true,
        message: 'Personalization updated successfully',
      });
    } catch (error) {
      logger.error('Error updating personalization:', error);
      next(error);
    }
  }

  async getPersonalizedContent(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const { contentType, limit = 10 } = req.query;

      const recommendations = await personalizationEngine.getPersonalizedContent(
        userId,
        contentType as string,
        parseInt(limit as string)
      );

      _res.json({
        success: true,
        recommendations,
      });
    } catch (error) {
      logger.error('Error getting personalized content:', error);
      next(error);
    }
  }

  async getCoachingStrategy(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';

      const strategy = await personalizationEngine.generateCoachingStrategy(userId);

      _res.json({
        success: true,
        strategy,
      });
    } catch (error) {
      logger.error('Error getting coaching strategy:', error);
      next(error);
    }
  }

  // Advanced Analytics Methods
  async getBehaviorPatterns(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const { days = 30 } = req.query;

      const patterns = await analyticsEngine.analyzeBehaviorPatterns(
        userId,
        parseInt(days as string)
      );

      _res.json({
        success: true,
        patterns,
      });
    } catch (error) {
      logger.error('Error getting behavior patterns:', error);
      next(error);
    }
  }

  async getEngagementMetrics(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const { startDate, endDate } = req.query;

      const metrics = await analyticsEngine.getEngagementMetrics(userId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      _res.json({
        success: true,
        metrics,
      });
    } catch (error) {
      logger.error('Error getting engagement metrics:', error);
      next(error);
    }
  }

  async getSuccessFactors(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';

      const factors = await analyticsEngine.identifySuccessFactors(userId);

      _res.json({
        success: true,
        factors,
      });
    } catch (error) {
      logger.error('Error getting success factors:', error);
      next(error);
    }
  }

  async trackAnalyticsEvent(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const { eventType, eventData, metadata } = req.body;

      await analyticsEngine.trackEvent(userId, {
        type: eventType,
        data: eventData,
        metadata,
        timestamp: new Date(),
      });

      _res.json({
        success: true,
        message: 'Event tracked successfully',
      });
    } catch (error) {
      logger.error('Error tracking analytics event:', error);
      next(error);
    }
  }
}

// Lazy instantiation to allow Jest mocks to be applied before instantiation
let _aiController: AIController | null = null;

export const aiController = new Proxy({} as AIController, {
  get(_target, prop) {
    if (!_aiController) {
      _aiController = new AIController();
    }
    const value = (_aiController as any)[prop];
    return typeof value === 'function' ? value.bind(_aiController) : value;
  },
});
