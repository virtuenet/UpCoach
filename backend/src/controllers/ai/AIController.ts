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
  async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || req.params.userId;
      const { types, limit } = req.query;
      
      const recommendations = await recommendationEngine.generateRecommendations(
        userId,
        types ? (types as string).split(',') : undefined,
        limit ? parseInt(limit as string) : 5
      );
      
      res.json({
        success: true,
        recommendations,
        generatedAt: new Date()
      });
    } catch (error) {
      logger.error('Error getting recommendations:', error);
      next(error);
    }
  }

  async getOptimalTiming(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { activityType } = req.params;
      
      const timing = await recommendationEngine.getOptimalTiming(userId, activityType);
      
      res.json({
        success: true,
        timing
      });
    } catch (error) {
      logger.error('Error getting optimal timing:', error);
      next(error);
    }
  }

  async getAdaptiveSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { date } = req.query;
      
      const schedule = await recommendationEngine.generateAdaptiveSchedule(
        userId,
        date ? new Date(date as string) : new Date()
      );
      
      res.json({
        success: true,
        schedule
      });
    } catch (error) {
      logger.error('Error generating adaptive schedule:', error);
      next(error);
    }
  }

  // Conversational AI
  async processMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { message, conversationId, context } = req.body;
      
      const result = await conversationalAI.processConversation(
        userId,
        message,
        conversationId,
        context
      );
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error('Error processing conversation:', error);
      next(error);
    }
  }

  async generateSmartResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { message, options } = req.body;
      
      const response = await conversationalAI.generateSmartResponse(
        userId,
        message,
        options
      );
      
      res.json({
        success: true,
        response
      });
    } catch (error) {
      logger.error('Error generating smart response:', error);
      next(error);
    }
  }

  // Predictive Analytics
  async getPredictions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || req.params.userId;
      
      const [successPrediction, churnRisk, behaviorPatterns] = await Promise.all([
        predictiveAnalytics.predictUserSuccess(userId),
        predictiveAnalytics.predictChurnRisk(userId),
        predictiveAnalytics.analyzeBehaviorPatterns(userId)
      ]);
      
      res.json({
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

  async predictGoalCompletion(req: Request, res: Response, next: NextFunction) {
    try {
      const { goalId } = req.params;
      
      const prediction = await predictiveAnalytics.predictGoalCompletion(goalId);
      
      res.json({
        success: true,
        prediction
      });
    } catch (error) {
      logger.error('Error predicting goal completion:', error);
      next(error);
    }
  }

  async getInterventionPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { riskType } = req.params;
      
      const plan = await predictiveAnalytics.generateInterventionPlan(
        userId,
        riskType as any
      );
      
      res.json({
        success: true,
        interventionPlan: plan
      });
    } catch (error) {
      logger.error('Error generating intervention plan:', error);
      next(error);
    }
  }

  // Adaptive Learning
  async createLearningPath(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { goalId, options } = req.body;
      
      const path = await adaptiveLearning.createPersonalizedLearningPath(
        userId,
        goalId,
        options
      );
      
      res.json({
        success: true,
        learningPath: path
      });
    } catch (error) {
      logger.error('Error creating learning path:', error);
      next(error);
    }
  }

  async getLearningPaths(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      
      const paths = await adaptiveLearning.getLearningPaths(userId);
      
      res.json({
        success: true,
        learningPaths: paths
      });
    } catch (error) {
      logger.error('Error getting learning paths:', error);
      next(error);
    }
  }

  async trackLearningProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { pathId, moduleId } = req.params;
      const { progress } = req.body;
      
      await adaptiveLearning.trackLearningProgress(
        userId,
        pathId,
        moduleId,
        progress
      );
      
      res.json({
        success: true,
        message: 'Progress tracked successfully'
      });
    } catch (error) {
      logger.error('Error tracking learning progress:', error);
      next(error);
    }
  }

  async getNextModule(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { pathId } = req.params;
      
      const module = await adaptiveLearning.getRecommendedNextModule(userId, pathId);
      
      res.json({
        success: true,
        nextModule: module
      });
    } catch (error) {
      logger.error('Error getting next module:', error);
      next(error);
    }
  }

  // Voice AI
  async analyzeVoice(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const audioBuffer = req.file?.buffer;
      
      if (!audioBuffer) {
        return res.status(400).json({ error: 'Audio file required' });
      }
      
      const { sessionType, previousContext } = req.body;
      
      const analysis = await voiceAI.analyzeVoice(
        userId,
        audioBuffer,
        { sessionType, previousContext }
      );
      
      res.json({
        success: true,
        analysis
      });
    } catch (error) {
      logger.error('Error analyzing voice:', error);
      next(error);
    }
  }

  async getVoiceCoaching(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { voiceAnalysis, options } = req.body;
      
      const coaching = await voiceAI.generateVoiceCoaching(
        userId,
        voiceAnalysis,
        options
      );
      
      res.json({
        success: true,
        coaching
      });
    } catch (error) {
      logger.error('Error generating voice coaching:', error);
      next(error);
    }
  }

  async getVoiceInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { days } = req.query;
      
      const insights = await voiceAI.getVoiceInsightSummary(
        userId,
        days ? parseInt(days as string) : 30
      );
      
      res.json({
        success: true,
        insights
      });
    } catch (error) {
      logger.error('Error getting voice insights:', error);
      next(error);
    }
  }

  async compareVoiceSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { sessionId1, sessionId2 } = req.params;
      
      const comparison = await voiceAI.compareVoiceSessions(
        userId,
        sessionId1,
        sessionId2
      );
      
      res.json({
        success: true,
        comparison
      });
    } catch (error) {
      logger.error('Error comparing voice sessions:', error);
      next(error);
    }
  }

  // Insights
  async getInsightReport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || req.params.userId;
      const { days, startDate, endDate } = req.query;
      
      const report = await insightGenerator.generateInsightReport(
        userId,
        {
          days: days ? parseInt(days as string) : undefined,
          start: startDate ? new Date(startDate as string) : undefined,
          end: endDate ? new Date(endDate as string) : undefined
        }
      );
      
      res.json({
        success: true,
        report
      });
    } catch (error) {
      logger.error('Error generating insight report:', error);
      next(error);
    }
  }

  async getActiveInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      
      const insights = await insightGenerator.getActiveInsights(userId);
      
      res.json({
        success: true,
        insights
      });
    } catch (error) {
      logger.error('Error getting active insights:', error);
      next(error);
    }
  }

  async dismissInsight(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { insightId } = req.params;
      
      await insightGenerator.dismissInsight(userId, insightId);
      
      res.json({
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