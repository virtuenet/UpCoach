/**
 * Analytics API Routes
 *
 * Comprehensive analytics endpoints for coaches, admins, and platform analytics
 */

import { Router, Request, Response } from 'express';
import {
  CoachAnalyticsService,
  RevenueAnalyticsService,
  EngagementMetricsService,
  AnalyticsPeriod,
} from '../services/analytics';

const router = Router();

// Initialize services
const coachAnalytics = new CoachAnalyticsService();
const revenueAnalytics = new RevenueAnalyticsService();
const engagementMetrics = new EngagementMetricsService();

// ============================================================================
// Coach Analytics Routes
// ============================================================================

/**
 * GET /api/analytics/coach/:coachId/performance
 * Get coach performance metrics
 */
router.get('/coach/:coachId/performance', async (req: Request, res: Response) => {
  try {
    const { coachId } = req.params;
    const period = (req.query.period as AnalyticsPeriod) || 'month';

    const metrics = await coachAnalytics.getPerformanceMetrics(coachId, period);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error fetching coach performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch coach performance metrics',
    });
  }
});

/**
 * GET /api/analytics/coach/:coachId/clients
 * Get client progress overview for a coach
 */
router.get('/coach/:coachId/clients', async (req: Request, res: Response) => {
  try {
    const { coachId } = req.params;
    const { limit, sortBy, filterEngagement } = req.query;

    const clients = await coachAnalytics.getClientProgressOverview(coachId, {
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as 'progress' | 'engagement' | 'risk' | 'recent',
      filterEngagement: filterEngagement as 'high' | 'medium' | 'low' | 'at_risk',
    });

    res.json({
      success: true,
      data: clients,
    });
  } catch (error) {
    console.error('Error fetching client progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client progress overview',
    });
  }
});

/**
 * GET /api/analytics/coach/:coachId/at-risk-clients
 * Get at-risk clients for a coach
 */
router.get('/coach/:coachId/at-risk-clients', async (req: Request, res: Response) => {
  try {
    const { coachId } = req.params;

    const clients = await coachAnalytics.getAtRiskClients(coachId);

    res.json({
      success: true,
      data: clients,
    });
  } catch (error) {
    console.error('Error fetching at-risk clients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch at-risk clients',
    });
  }
});

/**
 * GET /api/analytics/coach/:coachId/sessions
 * Get session analytics for a coach
 */
router.get('/coach/:coachId/sessions', async (req: Request, res: Response) => {
  try {
    const { coachId } = req.params;
    const period = (req.query.period as AnalyticsPeriod) || 'month';

    const sessions = await coachAnalytics.getSessionAnalytics(coachId, period);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Error fetching session analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session analytics',
    });
  }
});

/**
 * GET /api/analytics/coach/:coachId/trends
 * Get performance trends for a coach
 */
router.get('/coach/:coachId/trends', async (req: Request, res: Response) => {
  try {
    const { coachId } = req.params;
    const period = (req.query.period as AnalyticsPeriod) || 'month';
    const metrics = (req.query.metrics as string)?.split(',') || [
      'sessions',
      'revenue',
      'rating',
      'clients',
    ];

    const trends = await coachAnalytics.getPerformanceTrends(
      coachId,
      period,
      metrics as ('sessions' | 'revenue' | 'rating' | 'clients' | 'engagement')[]
    );

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('Error fetching performance trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance trends',
    });
  }
});

/**
 * GET /api/analytics/coach/:coachId/benchmarks
 * Get coach benchmarks compared to platform averages
 */
router.get('/coach/:coachId/benchmarks', async (req: Request, res: Response) => {
  try {
    const { coachId } = req.params;

    const benchmarks = await coachAnalytics.getCoachBenchmarks(coachId);

    res.json({
      success: true,
      data: benchmarks,
    });
  } catch (error) {
    console.error('Error fetching coach benchmarks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch coach benchmarks',
    });
  }
});

/**
 * GET /api/analytics/coach/:coachId/dashboard
 * Get complete dashboard summary for a coach
 */
router.get('/coach/:coachId/dashboard', async (req: Request, res: Response) => {
  try {
    const { coachId } = req.params;
    const period = (req.query.period as AnalyticsPeriod) || 'month';

    const dashboard = await coachAnalytics.getDashboardSummary(coachId, period);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard summary',
    });
  }
});

// ============================================================================
// Revenue Analytics Routes (Admin)
// ============================================================================

/**
 * GET /api/analytics/revenue/metrics
 * Get revenue metrics
 */
router.get('/revenue/metrics', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as AnalyticsPeriod) || 'month';

    const metrics = await revenueAnalytics.getRevenueMetrics(period);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue metrics',
    });
  }
});

/**
 * GET /api/analytics/revenue/subscriptions
 * Get subscription metrics
 */
router.get('/revenue/subscriptions', async (req: Request, res: Response) => {
  try {
    const metrics = await revenueAnalytics.getSubscriptionMetrics();

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error fetching subscription metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription metrics',
    });
  }
});

/**
 * GET /api/analytics/revenue/trends
 * Get revenue trends
 */
router.get('/revenue/trends', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as AnalyticsPeriod) || 'month';

    const trends = await revenueAnalytics.getRevenueTrends(period);

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue trends',
    });
  }
});

/**
 * GET /api/analytics/revenue/by-source
 * Get revenue breakdown by source
 */
router.get('/revenue/by-source', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as AnalyticsPeriod) || 'month';

    const breakdown = await revenueAnalytics.getRevenueBySource(period);

    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    console.error('Error fetching revenue by source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue by source',
    });
  }
});

/**
 * GET /api/analytics/revenue/transactions
 * Get recent transactions
 */
router.get('/revenue/transactions', async (req: Request, res: Response) => {
  try {
    const { limit, offset, type, status } = req.query;

    const transactions = await revenueAnalytics.getTransactions({
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      type: type as 'subscription' | 'session' | 'package' | 'refund',
      status: status as 'pending' | 'completed' | 'failed' | 'refunded',
    });

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions',
    });
  }
});

/**
 * GET /api/analytics/revenue/payouts
 * Get payout history
 */
router.get('/revenue/payouts', async (req: Request, res: Response) => {
  try {
    const { coachId, limit, offset, status } = req.query;

    const payouts = await revenueAnalytics.getPayouts({
      coachId: coachId as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      status: status as 'pending' | 'processing' | 'completed' | 'failed',
    });

    res.json({
      success: true,
      data: payouts,
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payouts',
    });
  }
});

/**
 * GET /api/analytics/revenue/forecast
 * Get revenue forecast
 */
router.get('/revenue/forecast', async (req: Request, res: Response) => {
  try {
    const months = req.query.months ? parseInt(req.query.months as string) : 3;

    const forecast = await revenueAnalytics.getRevenueForecast(months);

    res.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    console.error('Error fetching revenue forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue forecast',
    });
  }
});

/**
 * GET /api/analytics/revenue/summary
 * Get complete financial summary
 */
router.get('/revenue/summary', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as AnalyticsPeriod) || 'month';

    const summary = await revenueAnalytics.getFinancialSummary(period);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch financial summary',
    });
  }
});

// ============================================================================
// Engagement Metrics Routes
// ============================================================================

/**
 * GET /api/analytics/engagement/user/:userId
 * Get user engagement metrics
 */
router.get('/engagement/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const period = (req.query.period as AnalyticsPeriod) || 'month';

    const metrics = await engagementMetrics.getUserEngagementMetrics(userId, period);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error fetching user engagement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user engagement metrics',
    });
  }
});

/**
 * GET /api/analytics/engagement/platform
 * Get platform engagement overview
 */
router.get('/engagement/platform', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as AnalyticsPeriod) || 'month';

    const overview = await engagementMetrics.getPlatformEngagementOverview(period);

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error('Error fetching platform engagement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform engagement overview',
    });
  }
});

/**
 * GET /api/analytics/engagement/trends
 * Get engagement trends
 */
router.get('/engagement/trends', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as AnalyticsPeriod) || 'month';

    const trends = await engagementMetrics.getEngagementTrends(period);

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('Error fetching engagement trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engagement trends',
    });
  }
});

/**
 * GET /api/analytics/engagement/cohorts
 * Get cohort analysis
 */
router.get('/engagement/cohorts', async (req: Request, res: Response) => {
  try {
    const months = req.query.months ? parseInt(req.query.months as string) : 6;

    const cohorts = await engagementMetrics.getCohortAnalysis(months);

    res.json({
      success: true,
      data: cohorts,
    });
  } catch (error) {
    console.error('Error fetching cohort analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cohort analysis',
    });
  }
});

/**
 * GET /api/analytics/engagement/segments
 * Get user segments
 */
router.get('/engagement/segments', async (req: Request, res: Response) => {
  try {
    const segments = await engagementMetrics.getUserSegments();

    res.json({
      success: true,
      data: segments,
    });
  } catch (error) {
    console.error('Error fetching user segments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user segments',
    });
  }
});

/**
 * GET /api/analytics/engagement/heatmap
 * Get engagement heatmap data
 */
router.get('/engagement/heatmap', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as AnalyticsPeriod) || 'month';

    const heatmap = await engagementMetrics.getEngagementHeatmap(period);

    res.json({
      success: true,
      data: heatmap,
    });
  } catch (error) {
    console.error('Error fetching engagement heatmap:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engagement heatmap',
    });
  }
});

/**
 * GET /api/analytics/engagement/features
 * Get feature usage breakdown
 */
router.get('/engagement/features', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as AnalyticsPeriod) || 'month';

    const features = await engagementMetrics.getFeatureUsageBreakdown(period);

    res.json({
      success: true,
      data: features,
    });
  } catch (error) {
    console.error('Error fetching feature usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature usage breakdown',
    });
  }
});

/**
 * GET /api/analytics/engagement/insights
 * Get engagement insights and recommendations
 */
router.get('/engagement/insights', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as AnalyticsPeriod) || 'month';

    const insights = await engagementMetrics.getEngagementInsights(period);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Error fetching engagement insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engagement insights',
    });
  }
});

export default router;
