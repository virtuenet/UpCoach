/**
 * Analytics Routes
 * API endpoints for analytics and ML features
 * @version 1.0.0
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

// Controllers
import AnalyticsDashboardController from '../controllers/AnalyticsDashboardController';

const router = Router();

// ==================== Dashboard Endpoints ====================

/**
 * GET /api/analytics/dashboard
 * Get comprehensive dashboard metrics
 */
router.get(
  '/dashboard',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 30 }),
  [
    query('organizationId').optional().isUUID(),
    query('timeframe').optional().isIn(['1d', '7d', '30d', '90d', '1y']),
  ],
  AnalyticsDashboardController.getDashboardMetrics
);

// ==================== User Analytics ====================

/**
 * GET /api/analytics/users/:userId
 * Get user-specific analytics
 */
router.get(
  '/users/:userId',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 60 }),
  [
    param('userId').isUUID(),
    query('timeframe').optional().isIn(['1d', '7d', '30d', '90d']),
    query('includeComparisons').optional().isBoolean(),
    query('includePredictions').optional().isBoolean(),
    query('includeInsights').optional().isBoolean(),
  ],
  AnalyticsDashboardController.getUserAnalytics
);

/**
 * GET /api/analytics/users/:userId/behavior
 * Get behavior patterns analysis
 */
router.get(
  '/users/:userId/behavior',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 30 }),
  [
    param('userId').isUUID(),
    query('timeframe').optional().isNumeric(),
    query('patternTypes').optional().isString(),
    query('minConfidence').optional().isFloat({ min: 0, max: 1 }),
  ],
  AnalyticsDashboardController.getBehaviorPatterns
);

/**
 * GET /api/analytics/users/:userId/journey
 * Get user journey mapping
 */
router.get(
  '/users/:userId/journey',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 30 }),
  [param('userId').isUUID()],
  AnalyticsDashboardController.getUserJourney
);

/**
 * GET /api/analytics/users/:userId/anomalies
 * Detect anomalies in user behavior
 */
router.get(
  '/users/:userId/anomalies',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 20 }),
  [
    param('userId').isUUID(),
    query('sensitivity').optional().isFloat({ min: 0, max: 1 }),
    query('lookbackDays').optional().isInt({ min: 1, max: 90 }),
    query('metrics').optional().isString(),
  ],
  AnalyticsDashboardController.getAnomalyDetection
);

// ==================== Insights ====================

/**
 * GET /api/analytics/users/:userId/insights
 * Get real-time insights for user
 */
router.get(
  '/users/:userId/insights',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 60 }),
  [
    param('userId').isUUID(),
    query('timeframe').optional().isString(),
    query('categories').optional().isString(),
    query('minImportance').optional().isFloat({ min: 0, max: 1 }),
    query('maxInsights').optional().isInt({ min: 1, max: 100 }),
  ],
  AnalyticsDashboardController.getRealTimeInsights
);

/**
 * GET /api/analytics/users/:userId/insights/comparative
 * Get comparative insights
 */
router.get(
  '/users/:userId/insights/comparative',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 30 }),
  [
    param('userId').isUUID(),
    query('comparisonGroup').optional().isIn(['peers', 'top_performers', 'similar_goals']),
  ],
  AnalyticsDashboardController.getComparativeInsights
);

// ==================== Predictions ====================

/**
 * GET /api/analytics/users/:userId/predictions
 * Get predictive analytics for user
 */
router.get(
  '/users/:userId/predictions',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 30 }),
  [
    param('userId').isUUID(),
    query('predictionTypes').optional().isString(),
  ],
  AnalyticsDashboardController.getPredictiveAnalytics
);

// ==================== Cohort Analysis ====================

/**
 * POST /api/analytics/cohorts/analyze
 * Perform cohort analysis
 */
router.post(
  '/cohorts/analyze',
  authenticate,
  authorize(['admin', 'analyst']),
  rateLimiter({ windowMs: 60000, max: 10 }),
  [
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('criteria').optional().isObject(),
  ],
  AnalyticsDashboardController.getCohortAnalysis
);

// ==================== Segmentation ====================

/**
 * GET /api/analytics/segments
 * Get user segments
 */
router.get(
  '/segments',
  authenticate,
  authorize(['admin', 'analyst']),
  rateLimiter({ windowMs: 60000, max: 20 }),
  [
    query('method').optional().isIn(['behavioral', 'kmeans', 'hierarchical', 'dbscan']),
    query('numSegments').optional().isInt({ min: 2, max: 20 }),
    query('features').optional().isString(),
  ],
  AnalyticsDashboardController.getUserSegments
);

// ==================== Real-time Streaming ====================

/**
 * GET /api/analytics/users/:userId/stream
 * Stream real-time analytics (SSE)
 */
router.get(
  '/users/:userId/stream',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 5 }),
  [param('userId').isUUID()],
  AnalyticsDashboardController.streamAnalytics
);

export default router;