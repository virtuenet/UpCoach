import { Request, Response, NextFunction } from 'express';
import { recommendationEngine } from '../../services/ai/RecommendationEngine';
import { conversationalAI } from '../../services/ai/ConversationalAI';
import { predictiveAnalytics } from '../../services/ai/PredictiveAnalytics';
import { adaptiveLearning } from '../../services/ai/AdaptiveLearning';
import { voiceAI } from '../../services/ai/VoiceAI';
import { insightGenerator } from '../../services/ai/InsightGenerator';
import { logger } from '../../utils/logger';

export class AIController {
  // Recommendations
  async getRecommendations(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "" || req.params.userId;
      const { types, limit } = req.query;
      
      const recommendations = await recommendationEngine.generateRecommendations(
        userId,
        types ? (types as string).split(',') : undefined,
        limit ? parseInt(limit as string) : 5
      );
      
      _res.json({
        success: true,
        recommendations,
        generatedAt: new Date()
      });
    } catch (error) {
      logger.error('Error getting recommendations:', error);
      next(error);
    }
  }

  async getOptimalTiming(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "";
      const { activityType } = req.params;
      
      const timing = await recommendationEngine.getOptimalTiming(userId, activityType);
      
      _res.json({
        success: true,
        timing
      });
    } catch (error) {
      logger.error('Error getting optimal timing:', error);
      next(error);
    }
  }

  async getAdaptiveSchedule(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "";
      const { date } = req.query;
      
      const schedule = await recommendationEngine.generateAdaptiveSchedule(
        userId,
        date ? new Date(date as string) : new Date()
      );
      
      _res.json({
        success: true,
        schedule
      });
    } catch (error) {
      logger.error('Error generating adaptive schedule:', error);
      next(error);
    }
  }

  // Conversational AI
  async processMessage(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "";
      const { message, conversationId, context } = req.body;
      
      const result = await conversationalAI.processConversation(
        userId,
        message,
        conversationId,
        context
      );
      
      _res.json({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error('Error processing conversation:', error);
      next(error);
    }
  }

  async generateSmartResponse(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "";
      const { message, options } = req.body;
      
      const response = await conversationalAI.generateSmartResponse(
        userId,
        message,
        options
      );
      
      _res.json({
        success: true,
        response
      });
    } catch (error) {
      logger.error('Error generating smart response:', error);
      next(error);
    }
  }

  // Predictive Analytics
  async getPredictions(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "" || req.params.userId;
      
      const [successPrediction, churnRisk, behaviorPatterns] = await Promise.all([
        predictiveAnalytics.predictUserSuccess(userId),
        predictiveAnalytics.predictChurnRisk(userId),
        predictiveAnalytics.analyzeBehaviorPatterns(userId)
      ]);
      
      _res.json({
        success: true,
        predictions: {
          success: successPrediction,
          churnRisk,
          behaviorPatterns
        }
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
        prediction
      });
    } catch (error) {
      logger.error('Error predicting goal completion:', error);
      next(error);
    }
  }

  async getInterventionPlan(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "";
      const { riskType } = req.params;
      
      const plan = await predictiveAnalytics.generateInterventionPlan(
        userId,
        riskType as any
      );
      
      _res.json({
        success: true,
        interventionPlan: plan
      });
    } catch (error) {
      logger.error('Error generating intervention plan:', error);
      next(error);
    }
  }

  // Adaptive Learning
  async createLearningPath(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "";
      const { goalId, options } = req.body;
      
      const path = await adaptiveLearning.createPersonalizedLearningPath(
        userId,
        goalId,
        options
      );
      
      _res.json({
        success: true,
        learningPath: path
      });
    } catch (error) {
      logger.error('Error creating learning path:', error);
      next(error);
    }
  }

  async getLearningPaths(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "";
      
      const paths = await adaptiveLearning.getLearningPaths(userId);
      
      _res.json({
        success: true,
        learningPaths: paths
      });
    } catch (error) {
      logger.error('Error getting learning paths:', error);
      next(error);
    }
  }

  async trackLearningProgress(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "";
      const { pathId, moduleId } = req.params;
      const { progress } = req.body;
      
      await adaptiveLearning.trackLearningProgress(
        userId,
        pathId,
        moduleId,
        progress
      );
      
      _res.json({
        success: true,
        message: 'Progress tracked successfully'
      });
    } catch (error) {
      logger.error('Error tracking learning progress:', error);
      next(error);
    }
  }

  async getNextModule(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "";
      const { pathId } = req.params;
      
      const module = await adaptiveLearning.getRecommendedNextModule(userId, pathId);
      
      _res.json({
        success: true,
        nextModule: module
      });
    } catch (error) {
      logger.error('Error getting next module:', error);
      next(error);
    }
  }

  // Voice AI
  async analyzeVoice(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "";
      const audioBuffer = req.file?.buffer;
      
      if (!audioBuffer) {
        return _res.status(400).json({ error: 'Audio file required' });
      }
      
      const { sessionType, previousContext } = req.body;
      
      const analysis = await voiceAI.analyzeVoice(
        userId,
        audioBuffer,
        { sessionType, previousContext }
      );
      
      _res.json({
        success: true,
        analysis
      });
    } catch (error) {
      logger.error('Error analyzing voice:', error);
      next(error);
    }
  }

  async getVoiceCoaching(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "";
      const { voiceAnalysis, options } = req.body;
      
      const coaching = await voiceAI.generateVoiceCoaching(
        userId,
        voiceAnalysis,
        options
      );
      
      _res.json({
        success: true,
        coaching
      });
    } catch (error) {
      logger.error('Error generating voice coaching:', error);
      next(error);
    }
  }

  async getVoiceInsights(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "";
      const { days } = req.query;
      
      const insights = await voiceAI.getVoiceInsightSummary(
        userId,
        days ? parseInt(days as string) : 30
      );
      
      _res.json({
        success: true,
        insights
      });
    } catch (error) {
      logger.error('Error getting voice insights:', error);
      next(error);
    }
  }

  async compareVoiceSessions(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "";
      const { sessionId1, sessionId2 } = req.params;
      
      const comparison = await voiceAI.compareVoiceSessions(
        userId,
        sessionId1,
        sessionId2
      );
      
      _res.json({
        success: true,
        comparison
      });
    } catch (error) {
      logger.error('Error comparing voice sessions:', error);
      next(error);
    }
  }

  // Insights
  async getInsightReport(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "" || req.params.userId;
      const { days, startDate, endDate } = req.query;
      
      const report = await insightGenerator.generateInsightReport(
        userId,
        {
          days: days ? parseInt(days as string) : undefined,
          start: startDate ? new Date(startDate as string) : undefined,
          end: endDate ? new Date(endDate as string) : undefined
        }
      );
      
      _res.json({
        success: true,
        report
      });
    } catch (error) {
      logger.error('Error generating insight report:', error);
      next(error);
    }
  }

  async getActiveInsights(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "";
      
      const insights = await insightGenerator.getActiveInsights(userId);
      
      _res.json({
        success: true,
        insights
      });
    } catch (error) {
      logger.error('Error getting active insights:', error);
      next(error);
    }
  }

  async dismissInsight(req: Request, _res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || "";
      const { insightId } = req.params;
      
      await insightGenerator.dismissInsight(userId, insightId);
      
      _res.json({
        success: true,
        message: 'Insight dismissed successfully'
      });
    } catch (error) {
      logger.error('Error dismissing insight:', error);
      next(error);
    }
  }
}

export const aiController = new AIController();