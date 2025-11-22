import { Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';

import KpiTracker from '../models/analytics/KpiTracker';
import UserAnalytics from '../models/analytics/UserAnalytics';
import CoachMemory from '../models/coaching/CoachMemory';
import CoachIntelligenceService from '../services/coaching/CoachIntelligenceService';
import { coachIntelligenceService } from '../services/coaching/CoachIntelligenceServiceEnhanced';
import { missedSessionsCalculator } from '../services/coaching/MissedSessionsCalculator';
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
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : 'Internal server error',
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
        mood: (mood as string) || 'neutral',
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
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : 'Internal server error',
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
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : 'Internal server error',
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
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : 'Internal server error',
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
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : 'Internal server error',
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
        sortOrder = 'DESC',
      } = req.query;

      const offset = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

      const whereClause: unknown = { userId };

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
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : 'Internal server error',
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
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : 'Internal server error',
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

      const whereClause: unknown = { userId };

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
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'DESC'],
        ],
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
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : 'Internal server error',
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
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : 'Internal server error',
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

      const whereClause: unknown = {};

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
        averageEngagement:
          analytics.reduce((sum, a) => sum + a.engagementMetrics.participationScore, 0) /
          analytics.length,
        averageGoalCompletion:
          analytics.reduce((sum, a) => sum + a.coachingMetrics.goalCompletionRate, 0) /
          analytics.length,
        averageSatisfaction:
          analytics.reduce((sum, a) => sum + a.kpiMetrics.userSatisfactionScore, 0) /
          analytics.length,
        churnRisk: analytics.filter(a => a.kpiMetrics.churnRisk > 0.7).length,
        topStrengthAreas: this.aggregateStringArrays(
          analytics.map(a => a.aiInsights.strengthAreas)
        ),
        topImprovementAreas: this.aggregateStringArrays(
          analytics.map(a => a.aiInsights.improvementAreas)
        ),
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
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : 'Internal server error',
      });
    }
  }

  // ============= Enhanced Coach Intelligence Methods =============

  /**
   * Calculate engagement score for user
   * GET /api/coach-intelligence/engagement/:userId
   */
  async getEngagementScore(req: Request, _res: Response): Promise<void> {
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
      const engagementMetrics = await coachIntelligenceService.calculateEngagementScore(userId);

      _res.status(200).json({
        success: true,
        message: 'Engagement score calculated successfully',
        data: {
          engagementMetrics,
          riskAssessment: {
            level: engagementMetrics.churnRisk > 0.7 ? 'high' :
                   engagementMetrics.churnRisk > 0.4 ? 'medium' : 'low',
            recommendations: engagementMetrics.churnRisk > 0.5 ? [
              'Schedule immediate check-in',
              'Review engagement patterns',
              'Adjust coaching frequency'
            ] : [
              'Continue current approach',
              'Monitor for changes'
            ]
          }
        }
      });
    } catch (error) {
      logger.error('Error calculating engagement score:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to calculate engagement score',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Calculate missed sessions for user
   * GET /api/coach-intelligence/missed-sessions/:userId
   */
  async getMissedSessions(req: Request, _res: Response): Promise<void> {
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
      const missedSessionsData = await missedSessionsCalculator.calculateMissedSessions(userId);

      _res.status(200).json({
        success: true,
        message: 'Missed sessions data retrieved successfully',
        data: {
          missedSessions: missedSessionsData,
          actionRequired: missedSessionsData.riskLevel === 'high' || missedSessionsData.riskLevel === 'critical',
          urgencyLevel: missedSessionsData.riskLevel,
          nextActions: missedSessionsData.recommendations.slice(0, 3)
        }
      });
    } catch (error) {
      logger.error('Error retrieving missed sessions data:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to retrieve missed sessions data',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Get missed sessions analytics for admin panel
   * GET /api/coach-intelligence/missed-sessions/analytics
   */
  async getMissedSessionsAnalytics(req: Request, _res: Response): Promise<void> {
    try {
      const analytics = await missedSessionsCalculator.getMissedSessionsAnalytics();

      _res.status(200).json({
        success: true,
        message: 'Missed sessions analytics retrieved successfully',
        data: {
          analytics,
          generatedAt: new Date(),
          alerts: {
            highRiskUsers: analytics.summary.highRiskUsers,
            totalMissedSessions: analytics.summary.totalMissedSessions,
            averageMissedSessions: analytics.summary.averageMissedSessions
          }
        }
      });
    } catch (error) {
      logger.error('Error retrieving missed sessions analytics:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to retrieve missed sessions analytics',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Predict users at risk of missing sessions
   * GET /api/coach-intelligence/predict-at-risk-users
   */
  async predictAtRiskUsers(req: Request, _res: Response): Promise<void> {
    try {
      const atRiskUsers = await missedSessionsCalculator.predictAtRiskUsers();

      _res.status(200).json({
        success: true,
        message: 'At-risk users prediction completed',
        data: {
          atRiskUsers: atRiskUsers.slice(0, 20), // Top 20 at-risk users
          totalAtRisk: atRiskUsers.length,
          criticalUsers: atRiskUsers.filter(u => u.riskScore > 0.8).length,
          interventionRequired: atRiskUsers.filter(u => u.riskScore > 0.7).length
        }
      });
    } catch (error) {
      logger.error('Error predicting at-risk users:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to predict at-risk users',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Set user session expectations
   * POST /api/coach-intelligence/session-expectations/:userId
   */
  async setSessionExpectations(req: Request, _res: Response): Promise<void> {
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
      const { expectedSessionsPerWeek, preferredDays, preferredTimes, customSchedule } = req.body;

      await missedSessionsCalculator.setUserSessionExpectation(userId, {
        userId,
        expectedSessionsPerWeek,
        preferredDays,
        preferredTimes,
        customSchedule
      });

      _res.status(200).json({
        success: true,
        message: 'Session expectations set successfully',
        data: {
          userId,
          expectedSessionsPerWeek,
          preferredDays,
          preferredTimes
        }
      });
    } catch (error) {
      logger.error('Error setting session expectations:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to set session expectations',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Track custom KPI
   * POST /api/coach-intelligence/track-kpi/:userId
   */
  async trackCustomKPI(req: Request, _res: Response): Promise<void> {
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
      const { kpiName, value, metadata } = req.body;

      const customKPI = await coachIntelligenceService.trackCustomKPI(
        userId,
        kpiName,
        value,
        metadata
      );

      _res.status(201).json({
        success: true,
        message: 'Custom KPI tracked successfully',
        data: {
          customKPI,
          trendAnalysis: {
            direction: customKPI.trend,
            forecast: customKPI.forecast,
            achievement: `${Math.round(customKPI.achievement)}%`
          },
          nextSteps: customKPI.insights.slice(0, 3)
        }
      });
    } catch (error) {
      logger.error('Error tracking custom KPI:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to track custom KPI',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Generate KPI report
   * GET /api/coach-intelligence/kpi-report/:userId
   */
  async generateKPIReport(req: Request, _res: Response): Promise<void> {
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
      const { period = 'month' } = req.query;

      const kpiReport = await coachIntelligenceService.generateKPIReport(
        userId,
        period as 'week' | 'month' | 'quarter'
      );

      _res.status(200).json({
        success: true,
        message: 'KPI report generated successfully',
        data: {
          report: kpiReport,
          executiveSummary: {
            overallPerformance: `${Math.round(kpiReport.performanceScore * 100)}%`,
            topPerformer: kpiReport.kpis.length > 0 ? kpiReport.kpis[0].name : 'N/A',
            priorityActions: kpiReport.recommendations.slice(0, 3),
            riskAreas: kpiReport.kpis.filter(k => k.trend === 'down').length
          }
        }
      });
    } catch (error) {
      logger.error('Error generating KPI report:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to generate KPI report',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Predict user success
   * GET /api/coach-intelligence/predict-success/:userId
   */
  async predictUserSuccess(req: Request, _res: Response): Promise<void> {
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
      const { goalId } = req.query;

      const prediction = await coachIntelligenceService.predictUserSuccess(
        userId,
        goalId as string
      );

      _res.status(200).json({
        success: true,
        message: 'Success prediction completed',
        data: {
          prediction,
          summary: {
            successLikelihood: `${Math.round(prediction.successProbability * 100)}%`,
            confidenceLevel: `${Math.round(prediction.confidenceLevel * 100)}%`,
            estimatedDays: Math.round(prediction.timeToGoal),
            riskFactorCount: prediction.riskFactors.length,
            successFactorCount: prediction.successFactors.length
          },
          actionPlan: prediction.recommendedActions.slice(0, 5)
        }
      });
    } catch (error) {
      logger.error('Error predicting user success:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to predict user success',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Generate behavior insights
   * GET /api/coach-intelligence/behavior-insights/:userId
   */
  async getBehaviorInsights(req: Request, _res: Response): Promise<void> {
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
      const behaviorInsights = await coachIntelligenceService.generateBehaviorInsights(userId);

      _res.status(200).json({
        success: true,
        message: 'Behavior insights generated successfully',
        data: {
          insights: behaviorInsights,
          summary: {
            totalPatterns: behaviorInsights.length,
            positivePatterns: behaviorInsights.filter(i => i.impact === 'positive').length,
            areasForImprovement: behaviorInsights.filter(i => i.impact === 'negative').length,
            keyRecommendations: behaviorInsights.flatMap(i => i.recommendations).slice(0, 5)
          }
        }
      });
    } catch (error) {
      logger.error('Error generating behavior insights:', error);
      _res.status(500).json({
        success: false,
        message: 'Failed to generate behavior insights',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
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
    body('conversationContent')
      .isString()
      .isLength({ min: 10 })
      .withMessage('Conversation content must be at least 10 characters'),
    body('sessionDuration')
      .isInt({ min: 1 })
      .withMessage('Session duration must be a positive integer'),
    body('userFeedback.rating')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Rating must be between 1 and 10'),
  ],

  getRelevantMemories: [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ],

  getCoachingRecommendations: [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    query('avatarId').optional().isUUID().withMessage('Avatar ID must be valid UUID'),
  ],

  getWeeklyReport: [param('userId').isUUID().withMessage('Valid user ID is required')],

  getUserAnalytics: [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    query('periodType')
      .optional()
      .isIn(['daily', 'weekly', 'monthly', 'quarterly'])
      .withMessage('Invalid period type'),
  ],

  getUserMemories: [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],

  createKpiTracker: [
    body('userId').isUUID().withMessage('Valid user ID is required'),
    body('type')
      .isIn(['kpi', 'okr', 'personal_goal', 'team_goal'])
      .withMessage('Invalid tracker type'),
    body('title')
      .isString()
      .isLength({ min: 3, max: 200 })
      .withMessage('Title must be between 3 and 200 characters'),
    body('description')
      .isString()
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters'),
    body('category')
      .isIn([
        'financial',
        'professional',
        'personal',
        'health',
        'relationships',
        'skills',
        'custom',
      ])
      .withMessage('Invalid category'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid priority'),
  ],

  getUserKpiTrackers: [param('userId').isUUID().withMessage('Valid user ID is required')],

  updateKpiProgress: [
    param('id').isUUID().withMessage('Valid KPI tracker ID is required'),
    body('value').isNumeric().withMessage('Progress value must be numeric'),
    body('note').optional().isString().withMessage('Note must be a string'),
    body('context').optional().isString().withMessage('Context must be a string'),
  ],

  // Enhanced Coach Intelligence Validation
  getEngagementScore: [param('userId').isUUID().withMessage('Valid user ID is required')],

  getMissedSessions: [param('userId').isUUID().withMessage('Valid user ID is required')],

  setSessionExpectations: [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    body('expectedSessionsPerWeek')
      .isInt({ min: 1, max: 21 })
      .withMessage('Expected sessions per week must be between 1 and 21'),
    body('preferredDays')
      .isArray()
      .withMessage('Preferred days must be an array'),
    body('preferredTimes')
      .isArray()
      .withMessage('Preferred times must be an array'),
  ],

  trackCustomKPI: [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    body('kpiName')
      .isString()
      .isLength({ min: 3, max: 100 })
      .withMessage('KPI name must be between 3 and 100 characters'),
    body('value').isNumeric().withMessage('KPI value must be numeric'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  ],

  generateKPIReport: [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    query('period')
      .optional()
      .isIn(['week', 'month', 'quarter'])
      .withMessage('Period must be week, month, or quarter'),
  ],

  predictUserSuccess: [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    query('goalId').optional().isUUID().withMessage('Goal ID must be a valid UUID'),
  ],

  getBehaviorInsights: [param('userId').isUUID().withMessage('Valid user ID is required')],
};

export default CoachIntelligenceController;
