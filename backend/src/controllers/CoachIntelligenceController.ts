import { Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import CoachIntelligenceService from '../services/coaching/CoachIntelligenceService';
import CoachMemory from '../models/coaching/CoachMemory';
import UserAnalytics from '../models/analytics/UserAnalytics';
import KpiTracker from '../models/analytics/KpiTracker';
import { logger } from '../utils/logger';

/**
 * Coach Intelligence Controller
 * Handles API endpoints for memory tracking, analytics, and intelligent coaching features
 */

export class CoachIntelligenceController {
  private coachIntelligenceService: CoachIntelligenceService;

  constructor() {
    this.coachIntelligenceService = new CoachIntelligenceService();
  }

  /**
   * Process and store a coaching session
   * POST /api/coach-intelligence/sessions
   */
  async processSession(req: Request, _res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        _res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const {
        userId,
        avatarId,
        sessionId,
        currentTopic,
        userMood,
        conversationHistory,
        goals,
        conversationContent,
        sessionDuration,
        userFeedback,
      } = req.body;

      const context = {
        userId,
        avatarId,
        sessionId,
        currentTopic,
        userMood,
        conversationHistory,
        goals,
      };

      const memory = await this.coachIntelligenceService.processCoachingSession(
        context,
        conversationContent,
        sessionDuration,
        userFeedback
      );

      _res.status(201).json({
        success: true,
        message: 'Coaching session processed successfully',
        data: {
          memoryId: memory.id,
          insights: memory.insightsGenerated,
          importance: memory.importance,
          relevanceScore: memory.relevanceScore,
        },
      });
    } catch (error) {
      logger.error('Error processing coaching session:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to process coaching session',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error',
      });
    }
  }

  /**
   * Get relevant memories for current context
   * GET /api/coach-intelligence/memories/relevant
   */
  async getRelevantMemories(req: Request, _res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        _res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const { userId } = req.params;
      const { topics, mood, recentGoals, limit = 10 } = req.query;

      const currentContext = {
        topics: topics ? (topics as string).split(',') : [],
        mood: mood as string || 'neutral',
        recentGoals: recentGoals ? (recentGoals as string).split(',') : [],
      };

      const memories = await this.coachIntelligenceService.getRelevantMemories(
        userId,
        currentContext,
        parseInt(limit as string, 10)
      );

      _res.status(200).json({
        success: true,
        message: 'Relevant memories retrieved successfully',
        data: {
          memories: memories.map(memory => ({
            id: memory.id,
            memoryType: memory.memoryType,
            summary: memory.summary,
            tags: memory.tags,
            emotionalContext: memory.emotionalContext,
            coachingContext: memory.coachingContext,
            conversationDate: memory.conversationDate,
            importance: memory.importance,
            relevanceScore: memory.relevanceScore,
            accessCount: memory.accessCount,
          })),
          totalCount: memories.length,
          contextUsed: currentContext,
        },
      });
    } catch (error) {
      logger.error('Error retrieving relevant memories:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to retrieve relevant memories',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error',
      });
    }
  }

  /**
   * Get coaching recommendations
   * GET /api/coach-intelligence/recommendations/:userId
   */
  async getCoachingRecommendations(req: Request, _res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        _res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const { userId } = req.params;
      const { avatarId } = req.query;

      const recommendations = await this.coachIntelligenceService.generateCoachingRecommendations(
        userId,
        avatarId as string
      );

      _res.status(200).json({
        success: true,
        message: 'Coaching recommendations generated successfully',
        data: {
          recommendations,
          generatedAt: new Date(),
          totalRecommendations: recommendations.length,
        },
      });
    } catch (error) {
      logger.error('Error generating coaching recommendations:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to generate coaching recommendations',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error',
      });
    }
  }

  /**
   * Generate weekly report
   * GET /api/coach-intelligence/reports/weekly/:userId
   */
  async getWeeklyReport(req: Request, _res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        _res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const { userId } = req.params;

      const report = await this.coachIntelligenceService.generateWeeklyReport(userId);

      _res.status(200).json({
        success: true,
        message: 'Weekly report generated successfully',
        data: report,
      });
    } catch (error) {
      logger.error('Error generating weekly report:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to generate weekly report',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error',
      });
    }
  }

  /**
   * Get user analytics
   * GET /api/coach-intelligence/analytics/:userId
   */
  async getUserAnalytics(req: Request, _res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        _res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const { userId } = req.params;
      const { periodType = 'weekly' } = req.query;

      const analytics = await this.coachIntelligenceService.calculateUserAnalytics(
        userId,
        periodType as 'daily' | 'weekly' | 'monthly' | 'quarterly'
      );

      _res.status(200).json({
        success: true,
        message: 'User analytics retrieved successfully',
        data: {
          analytics,
          overallHealthScore: analytics.getOverallHealthScore(),
          trendingDirection: analytics.getTrendingDirection(),
          isAtRisk: analytics.isAtRisk(),
          recommendations: analytics.getPersonalizedRecommendations(),
        },
      });
    } catch (error) {
      logger.error('Error retrieving user analytics:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to retrieve user analytics',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error',
      });
    }
  }

  /**
   * Get all memories for a user
   * GET /api/coach-intelligence/memories/:userId
   */
  async getUserMemories(req: Request, _res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        _res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const { userId } = req.params;
      const { 
        memoryType, 
        tags, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 20,
        sortBy = 'conversationDate',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

      const whereClause: any = { userId };

      if (memoryType) {
        whereClause.memoryType = memoryType;
      }

      if (tags) {
        whereClause.tags = {
          $overlap: (tags as string).split(','),
        };
      }

      if (startDate || endDate) {
        whereClause.conversationDate = {};
        if (startDate) {
          whereClause.conversationDate.$gte = new Date(startDate as string);
        }
        if (endDate) {
          whereClause.conversationDate.$lte = new Date(endDate as string);
        }
      }

      const { count, rows: memories } = await CoachMemory.findAndCountAll({
        where: whereClause,
        order: [[sortBy as string, sortOrder as string]],
        limit: parseInt(limit as string, 10),
        offset,
      });

      _res.status(200).json({
        success: true,
        message: 'User memories retrieved successfully',
        data: {
          memories: memories.map(memory => ({
            id: memory.id,
            memoryType: memory.memoryType,
            summary: memory.summary,
            tags: memory.tags,
            emotionalContext: memory.emotionalContext,
            coachingContext: memory.coachingContext,
            conversationDate: memory.conversationDate,
            importance: memory.importance,
            relevanceScore: memory.relevanceScore,
            accessCount: memory.accessCount,
            isRelevant: memory.isRelevant(),
          })),
          pagination: {
            page: parseInt(page as string, 10),
            limit: parseInt(limit as string, 10),
            totalItems: count,
            totalPages: Math.ceil(count / parseInt(limit as string, 10)),
          },
        },
      });
    } catch (error) {
      logger.error('Error retrieving user memories:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to retrieve user memories',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error',
      });
    }
  }

  /**
   * Create a new KPI/Goal tracker
   * POST /api/coach-intelligence/kpi-trackers
   */
  async createKpiTracker(req: Request, _res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        _res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const kpiTracker = await KpiTracker.create(req.body);

      _res.status(201).json({
        success: true,
        message: 'KPI tracker created successfully',
        data: {
          kpiTracker,
          overallProgress: kpiTracker.calculateOverallProgress(),
          isAtRisk: kpiTracker.isAtRisk(),
          nextMilestone: kpiTracker.getNextMilestone(),
        },
      });
    } catch (error) {
      logger.error('Error creating KPI tracker:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to create KPI tracker',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error',
      });
    }
  }

  /**
   * Get KPI trackers for a user
   * GET /api/coach-intelligence/kpi-trackers/:userId
   */
  async getUserKpiTrackers(req: Request, _res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        _res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const { userId } = req.params;
      const { status, category, type } = req.query;

      const whereClause: any = { userId };

      if (status) {
        whereClause.status = status;
      }
      if (category) {
        whereClause.category = category;
      }
      if (type) {
        whereClause.type = type;
      }

      const kpiTrackers = await KpiTracker.findAll({
        where: whereClause,
        order: [['priority', 'DESC'], ['createdAt', 'DESC']],
      });

      const trackersWithAnalytics = kpiTrackers.map(tracker => ({
        ...tracker.toJSON(),
        overallProgress: tracker.calculateOverallProgress(),
        isAtRisk: tracker.isAtRisk(),
        velocityScore: tracker.calculateVelocityScore(),
        nextMilestone: tracker.getNextMilestone(),
        overdueActionItems: tracker.getOverdueActionItems(),
      }));

      _res.status(200).json({
        success: true,
        message: 'KPI trackers retrieved successfully',
        data: {
          kpiTrackers: trackersWithAnalytics,
          summary: {
            total: kpiTrackers.length,
            inProgress: kpiTrackers.filter(t => t.status === 'in_progress').length,
            atRisk: kpiTrackers.filter(t => t.isAtRisk()).length,
            completed: kpiTrackers.filter(t => t.status === 'completed').length,
          },
        },
      });
    } catch (error) {
      logger.error('Error retrieving KPI trackers:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to retrieve KPI trackers',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error',
      });
    }
  }

  /**
   * Update KPI tracker progress
   * PATCH /api/coach-intelligence/kpi-trackers/:id/progress
   */
  async updateKpiProgress(req: Request, _res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        _res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const { value, note, context } = req.body;

      const kpiTracker = await KpiTracker.findByPk(id);

      if (!kpiTracker) {
        _res.status(404).json({
          success: false,
          message: 'KPI tracker not found',
        });
        return;
      }

      // Add performance data
      kpiTracker.addPerformanceData(value, note, context);
      await kpiTracker.save();

      _res.status(200).json({
        success: true,
        message: 'KPI progress updated successfully',
        data: {
          kpiTracker,
          overallProgress: kpiTracker.calculateOverallProgress(),
          velocityScore: kpiTracker.calculateVelocityScore(),
          isAtRisk: kpiTracker.isAtRisk(),
        },
      });
    } catch (error) {
      logger.error('Error updating KPI progress:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to update KPI progress',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error',
      });
    }
  }

  /**
   * Get cohort analytics (for admin panel)
   * GET /api/coach-intelligence/cohort-analytics
   */
  async getCohortAnalytics(req: Request, _res: Response): Promise<void> {
    try {
      const { cohortId, periodType = 'weekly' } = req.query;

      let whereClause: any = {};

      if (cohortId) {
        whereClause['$UserAnalytics.benchmarkData.cohortId$'] = cohortId;
      }

      const analytics = await UserAnalytics.findAll({
        where: {
          periodType: periodType as string,
          calculatedAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
          ...whereClause,
        },
        order: [['calculatedAt', 'DESC']],
      });

      // Calculate cohort-level metrics
      const cohortMetrics = {
        totalUsers: analytics.length,
        averageEngagement: analytics.reduce((sum, a) => sum + a.engagementMetrics.participationScore, 0) / analytics.length,
        averageGoalCompletion: analytics.reduce((sum, a) => sum + a.coachingMetrics.goalCompletionRate, 0) / analytics.length,
        averageSatisfaction: analytics.reduce((sum, a) => sum + a.kpiMetrics.userSatisfactionScore, 0) / analytics.length,
        churnRisk: analytics.filter(a => a.kpiMetrics.churnRisk > 0.7).length,
        topStrengthAreas: this.aggregateStringArrays(analytics.map(a => a.aiInsights.strengthAreas)),
        topImprovementAreas: this.aggregateStringArrays(analytics.map(a => a.aiInsights.improvementAreas)),
      };

      _res.status(200).json({
        success: true,
        message: 'Cohort analytics retrieved successfully',
        data: {
          cohortMetrics,
          individualAnalytics: analytics,
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error retrieving cohort analytics:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to retrieve cohort analytics',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error',
      });
    }
  }

  /**
   * Helper method to aggregate string arrays and find most common items
   */
  private aggregateStringArrays(arrays: string[][]): { item: string; count: number }[] {
    const counts: { [key: string]: number } = {};
    
    arrays.flat().forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

// Validation middleware
export const coachIntelligenceValidation = {
  processSession: [
    body('userId').isUUID().withMessage('Valid user ID is required'),
    body('avatarId').isUUID().withMessage('Valid avatar ID is required'),
    body('sessionId').isUUID().withMessage('Valid session ID is required'),
    body('currentTopic').isString().withMessage('Current topic is required'),
    body('userMood').isString().withMessage('User mood is required'),
    body('conversationContent').isString().isLength({ min: 10 }).withMessage('Conversation content must be at least 10 characters'),
    body('sessionDuration').isInt({ min: 1 }).withMessage('Session duration must be a positive integer'),
    body('userFeedback.rating').optional().isInt({ min: 1, max: 10 }).withMessage('Rating must be between 1 and 10'),
  ],

  getRelevantMemories: [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  ],

  getCoachingRecommendations: [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    query('avatarId').optional().isUUID().withMessage('Avatar ID must be valid UUID'),
  ],

  getWeeklyReport: [
    param('userId').isUUID().withMessage('Valid user ID is required'),
  ],

  getUserAnalytics: [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    query('periodType').optional().isIn(['daily', 'weekly', 'monthly', 'quarterly']).withMessage('Invalid period type'),
  ],

  getUserMemories: [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],

  createKpiTracker: [
    body('userId').isUUID().withMessage('Valid user ID is required'),
    body('type').isIn(['kpi', 'okr', 'personal_goal', 'team_goal']).withMessage('Invalid tracker type'),
    body('title').isString().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    body('description').isString().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('category').isIn(['financial', 'professional', 'personal', 'health', 'relationships', 'skills', 'custom']).withMessage('Invalid category'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  ],

  getUserKpiTrackers: [
    param('userId').isUUID().withMessage('Valid user ID is required'),
  ],

  updateKpiProgress: [
    param('id').isUUID().withMessage('Valid KPI tracker ID is required'),
    body('value').isNumeric().withMessage('Progress value must be numeric'),
    body('note').optional().isString().withMessage('Note must be a string'),
    body('context').optional().isString().withMessage('Context must be a string'),
  ],
};

export default CoachIntelligenceController; 