/**
 * Analytics Dashboard Controller
 * Comprehensive analytics dashboard API endpoints
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';

// Services
import AnalyticsPipelineService from '../services/analytics/AnalyticsPipelineService';
import UserBehaviorAnalyticsService from '../services/analytics/UserBehaviorAnalyticsService';
import RealTimeInsightsGenerator from '../services/ml/RealTimeInsightsGenerator';
import PredictiveCoachingEngine from '../services/ml/PredictiveCoachingEngine';
import { CoachIntelligenceMLServiceComplete } from '../services/coaching/CoachIntelligenceMLServiceComplete';

// Database models
import UserAnalytics from '../models/analytics/UserAnalytics';
import KpiTracker from '../models/analytics/KpiTracker';
import CoachMemory from '../models/coaching/CoachMemory';

// Utils
import { logger } from '../utils/logger';
import { CustomError } from '../utils/errors';

// ==================== Type Definitions ====================

interface DashboardMetrics {
  overview: OverviewMetrics;
  performance: PerformanceMetrics;
  engagement: EngagementMetrics;
  behavioral: BehavioralMetrics;
  predictions: PredictionMetrics;
  insights: InsightMetrics;
}

interface OverviewMetrics {
  totalUsers: number;
  activeUsers: number;
  avgEngagement: number;
  avgProgress: number;
  totalGoals: number;
  completedGoals: number;
  overallHealth: number;
}

interface PerformanceMetrics {
  kpiAchievement: number;
  goalSuccessRate: number;
  avgCompletionTime: number;
  performanceTrend: string;
  topPerformers: unknown[];
  improvementRate: number;
}

interface EngagementMetrics {
  dau: number;
  wau: number;
  mau: number;
  retention: {
    day1: number;
    day7: number;
    day30: number;
  };
  sessionMetrics: {
    avgDuration: number;
    avgFrequency: number;
    totalSessions: number;
  };
  engagementDistribution: unknown;
}

interface BehavioralMetrics {
  patterns: unknown[];
  segments: unknown[];
  journeys: unknown[];
  anomalies: unknown[];
}

interface PredictionMetrics {
  churnRisk: {
    high: number;
    medium: number;
    low: number;
  };
  goalSuccess: {
    onTrack: number;
    atRisk: number;
    failing: number;
  };
  engagementForecast: unknown;
}

interface InsightMetrics {
  totalInsights: number;
  actionableInsights: number;
  criticalInsights: number;
  insightCategories: Record<string, number>;
  insightTrends: unknown[];
}

// ==================== Controller Class ====================

export class AnalyticsDashboardController {
  private mlService: CoachIntelligenceMLServiceComplete;

  constructor() {
    this.mlService = new CoachIntelligenceMLServiceComplete();
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { organizationId, timeframe = '30d' } = req.query;
      const userId = req.user?.id;

      // Check permissions
      if (organizationId && !this.hasOrganizationAccess(userId, organizationId as string)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Fetch all metrics in parallel
      const [overview, performance, engagement, behavioral, predictions, insights] = await Promise.all([
        this.getOverviewMetrics(organizationId as string, timeframe as string),
        this.getPerformanceMetrics(organizationId as string, timeframe as string),
        this.getEngagementMetrics(organizationId as string, timeframe as string),
        this.getBehavioralMetrics(organizationId as string, timeframe as string),
        this.getPredictionMetrics(organizationId as string),
        this.getInsightMetrics(organizationId as string, timeframe as string),
      ]);

      const dashboardMetrics: DashboardMetrics = {
        overview,
        performance,
        engagement,
        behavioral,
        predictions,
        insights,
      };

      return res.status(200).json({
        success: true,
        data: dashboardMetrics,
        timeframe,
        generatedAt: new Date(),
      });
    } catch (error) {
      logger.error('Failed to get dashboard metrics', error);
      return res.status(500).json({
        error: 'Failed to retrieve dashboard metrics',
      });
    }
  }

  /**
   * Get user-specific analytics
   */
  async getUserAnalytics(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { timeframe = '30d', includeComparisons = true } = req.query;

      // Verify access
      if (!this.canAccessUserAnalytics(req.user?.id, userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Fetch user analytics
      const analytics = await AnalyticsPipelineService.calculateAggregatedMetrics(
        userId,
        timeframe as string
      );

      // Add predictions if requested
      let predictions = null;
      if (req.query.includePredictions === 'true') {
        predictions = await this.getUserPredictions(userId);
      }

      // Add insights if requested
      let insights = null;
      if (req.query.includeInsights === 'true') {
        insights = await RealTimeInsightsGenerator.generateInsights({
          userId,
          timeframe: timeframe as string,
          maxInsights: 10,
        });
      }

      // Add comparisons if requested
      let comparisons = null;
      if (includeComparisons) {
        comparisons = await this.getUserComparisons(userId);
      }

      return res.status(200).json({
        success: true,
        data: {
          analytics,
          predictions,
          insights,
          comparisons,
        },
        userId,
        timeframe,
      });
    } catch (error) {
      logger.error('Failed to get user analytics', error);
      return res.status(500).json({
        error: 'Failed to retrieve user analytics',
      });
    }
  }

  /**
   * Get behavior patterns analysis
   */
  async getBehaviorPatterns(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const {
        timeframe = '30',
        patternTypes,
        minConfidence = '0.7'
      } = req.query;

      // Verify access
      if (!this.canAccessUserAnalytics(req.user?.id, userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Analyze behavior patterns
      const patterns = await UserBehaviorAnalyticsService.analyzeBehaviorPatterns(userId, {
        timeframe: parseInt(timeframe as string),
        patternTypes: patternTypes ? (patternTypes as string).split(',') as unknown : undefined,
        minConfidence: parseFloat(minConfidence as string),
      });

      return res.status(200).json({
        success: true,
        data: patterns,
        count: patterns.length,
      });
    } catch (error) {
      logger.error('Failed to get behavior patterns', error);
      return res.status(500).json({
        error: 'Failed to analyze behavior patterns',
      });
    }
  }

  /**
   * Get real-time insights
   */
  async getRealTimeInsights(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const {
        timeframe = '7d',
        categories,
        minImportance = '0.5',
        maxInsights = '20'
      } = req.query;

      // Verify access
      if (!this.canAccessUserAnalytics(req.user?.id, userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Generate insights
      const insights = await RealTimeInsightsGenerator.generateInsights({
        userId,
        timeframe: timeframe as string,
        focus: categories ? (categories as string).split(',') : undefined,
        minImportance: parseFloat(minImportance as string),
        maxInsights: parseInt(maxInsights as string),
      });

      return res.status(200).json({
        success: true,
        data: insights,
        count: insights.length,
      });
    } catch (error) {
      logger.error('Failed to get real-time insights', error);
      return res.status(500).json({
        error: 'Failed to generate insights',
      });
    }
  }

  /**
   * Get predictive analytics
   */
  async getPredictiveAnalytics(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { predictionTypes = 'all' } = req.query;

      // Verify access
      if (!this.canAccessUserAnalytics(req.user?.id, userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const predictions: unknown = {};

      // Normalize predictionTypes to array
      const normalizedTypes = Array.isArray(predictionTypes) ? predictionTypes :
                             typeof predictionTypes === 'string' ? [predictionTypes] : ['all'];

      // Goal success predictions
      if (normalizedTypes.includes('all') || normalizedTypes.includes('goals')) {
        const goals = await this.getUserGoals(userId);
        predictions.goalSuccess = await Promise.all(
          goals.map(goal =>
            PredictiveCoachingEngine.predictGoalSuccess(goal.id, userId)
          )
        );
      }

      // Engagement predictions
      if (normalizedTypes.includes('all') || normalizedTypes.includes('engagement')) {
        predictions.engagement = await PredictiveCoachingEngine.predictEngagement(userId);
      }

      // Behavior predictions
      if (normalizedTypes.includes('all') || normalizedTypes.includes('behavior')) {
        predictions.behavior = await PredictiveCoachingEngine.predictBehaviorPatterns(userId);
      }

      // Churn risk
      if (normalizedTypes.includes('all') || normalizedTypes.includes('churn')) {
        predictions.churn = await UserBehaviorAnalyticsService.predictChurnRisk(userId);
      }

      return res.status(200).json({
        success: true,
        data: predictions,
        userId,
        generatedAt: new Date(),
      });
    } catch (error) {
      logger.error('Failed to get predictive analytics', error);
      return res.status(500).json({
        error: 'Failed to generate predictions',
      });
    }
  }

  /**
   * Get cohort analysis
   */
  async getCohortAnalysis(req: Request, res: Response): Promise<Response> {
    try {
      const { startDate, endDate, criteria } = req.body;

      // Verify admin access
      if (!this.isAdmin(req.user?.id)) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Perform cohort analysis
      const analysis = await UserBehaviorAnalyticsService.analyzeCohort({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        criteria: criteria || {},
      });

      return res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      logger.error('Failed to perform cohort analysis', error);
      return res.status(500).json({
        error: 'Failed to analyze cohort',
      });
    }
  }

  /**
   * Get user segments
   */
  async getUserSegments(req: Request, res: Response): Promise<Response> {
    try {
      const {
        method = 'behavioral',
        numSegments = '5',
        features
      } = req.query;

      // Verify admin access
      if (!this.isAdmin(req.user?.id)) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Perform segmentation
      const segments = await UserBehaviorAnalyticsService.segmentUsers({
        method: method as unknown,
        features: features ? (features as string).split(',') : undefined,
        numSegments: parseInt(numSegments as string),
      });

      return res.status(200).json({
        success: true,
        data: segments,
        count: segments.length,
      });
    } catch (error) {
      logger.error('Failed to get user segments', error);
      return res.status(500).json({
        error: 'Failed to segment users',
      });
    }
  }

  /**
   * Get anomaly detection results
   */
  async getAnomalyDetection(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const {
        sensitivity = '0.8',
        lookbackDays = '30',
        metrics
      } = req.query;

      // Verify access
      if (!this.canAccessUserAnalytics(req.user?.id, userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Detect anomalies
      const anomalies = await UserBehaviorAnalyticsService.detectAnomalies(userId, {
        sensitivity: parseFloat(sensitivity as string),
        lookbackDays: parseInt(lookbackDays as string),
        metrics: metrics ? (metrics as string).split(',') : undefined,
      });

      return res.status(200).json({
        success: true,
        data: anomalies,
      });
    } catch (error) {
      logger.error('Failed to detect anomalies', error);
      return res.status(500).json({
        error: 'Failed to detect anomalies',
      });
    }
  }

  /**
   * Get user journey mapping
   */
  async getUserJourney(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;

      // Verify access
      if (!this.canAccessUserAnalytics(req.user?.id, userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Map user journey
      const journey = await UserBehaviorAnalyticsService.mapUserJourney(userId);

      return res.status(200).json({
        success: true,
        data: journey,
      });
    } catch (error) {
      logger.error('Failed to map user journey', error);
      return res.status(500).json({
        error: 'Failed to map journey',
      });
    }
  }

  /**
   * Get comparative insights
   */
  async getComparativeInsights(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { comparisonGroup = 'peers' } = req.query;

      // Verify access
      if (!this.canAccessUserAnalytics(req.user?.id, userId)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Generate comparative insights
      const insights = await RealTimeInsightsGenerator.generateComparativeInsights(
        userId,
        comparisonGroup as unknown
      );

      return res.status(200).json({
        success: true,
        data: insights,
      });
    } catch (error) {
      logger.error('Failed to get comparative insights', error);
      return res.status(500).json({
        error: 'Failed to generate comparative insights',
      });
    }
  }

  /**
   * Stream real-time analytics
   */
  async streamAnalytics(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;

    // Verify access
    if (!this.canAccessUserAnalytics(req.user?.id, userId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    try {
      // Stream analytics events
      for await (const event of AnalyticsPipelineService.streamAnalytics(userId, {
        realtime: true,
      })) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (error) {
      logger.error('Error streaming analytics', error);
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
    }
  }

  // ==================== Helper Methods ====================

  private async getOverviewMetrics(organizationId: string, timeframe: string): Promise<OverviewMetrics> {
    // Implementation would fetch actual metrics
    return {
      totalUsers: 1000,
      activeUsers: 750,
      avgEngagement: 78.5,
      avgProgress: 65.3,
      totalGoals: 5000,
      completedGoals: 2150,
      overallHealth: 82.1,
    };
  }

  private async getPerformanceMetrics(organizationId: string, timeframe: string): Promise<PerformanceMetrics> {
    return {
      kpiAchievement: 75.5,
      goalSuccessRate: 68.2,
      avgCompletionTime: 28.5,
      performanceTrend: 'improving',
      topPerformers: [],
      improvementRate: 15.3,
    };
  }

  private async getEngagementMetrics(organizationId: string, timeframe: string): Promise<EngagementMetrics> {
    return {
      dau: 450,
      wau: 650,
      mau: 750,
      retention: {
        day1: 95,
        day7: 75,
        day30: 60,
      },
      sessionMetrics: {
        avgDuration: 25.5,
        avgFrequency: 3.2,
        totalSessions: 15000,
      },
      engagementDistribution: {},
    };
  }

  private async getBehavioralMetrics(organizationId: string, timeframe: string): Promise<BehavioralMetrics> {
    return {
      patterns: [],
      segments: [],
      journeys: [],
      anomalies: [],
    };
  }

  private async getPredictionMetrics(organizationId: string): Promise<PredictionMetrics> {
    return {
      churnRisk: {
        high: 5,
        medium: 15,
        low: 80,
      },
      goalSuccess: {
        onTrack: 70,
        atRisk: 20,
        failing: 10,
      },
      engagementForecast: {},
    };
  }

  private async getInsightMetrics(organizationId: string, timeframe: string): Promise<InsightMetrics> {
    return {
      totalInsights: 250,
      actionableInsights: 180,
      criticalInsights: 15,
      insightCategories: {
        performance: 80,
        engagement: 60,
        goal: 70,
        habit: 40,
      },
      insightTrends: [],
    };
  }

  private async getUserPredictions(userId: string): Promise<unknown> {
    return {
      goalSuccess: 0.75,
      engagementTrend: 'stable',
      churnRisk: 0.15,
    };
  }

  private async getUserComparisons(userId: string): Promise<unknown> {
    return {
      percentile: 75,
      peerAverage: 65,
      topPerformerAverage: 85,
    };
  }

  private async getUserGoals(userId: string): Promise<any[]> {
    return [];
  }

  private hasOrganizationAccess(userId: string, organizationId: string): boolean {
    // Check if user has access to organization data
    return true; // Simplified for now
  }

  private canAccessUserAnalytics(requesterId: string, targetUserId: string): boolean {
    // Check if requester can access target user's analytics
    return requesterId === targetUserId || this.isAdmin(requesterId);
  }

  private isAdmin(userId: string): boolean {
    // Check if user is admin
    return false; // Simplified for now
  }
}

export default new AnalyticsDashboardController();