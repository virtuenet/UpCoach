/**
 * ML Routes
 * API endpoints for machine learning features and model management
 * @version 1.0.0
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

// Services
import PredictiveCoachingEngine from '../services/ml/PredictiveCoachingEngine';
import MLModelMonitoringService from '../services/ml/MLModelMonitoringService';
import RealTimeInsightsGenerator from '../services/ml/RealTimeInsightsGenerator';

const router = Router();

// ==================== Predictive Coaching ====================

/**
 * POST /api/ml/predict/goal-success
 * Predict goal success probability
 */
router.post(
  '/predict/goal-success',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 30 }),
  [
    body('goalId').isUUID(),
    body('userId').isUUID(),
    body('timeframe').optional().isInt({ min: 1, max: 365 }),
  ],
  async (req, res) => {
    try {
      const { goalId, userId, timeframe } = req.body;

      const prediction = await PredictiveCoachingEngine.predictGoalSuccess(
        goalId,
        userId,
        timeframe
      );

      res.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate goal prediction',
      });
    }
  }
);

/**
 * POST /api/ml/predict/behavior
 * Predict behavior patterns
 */
router.post(
  '/predict/behavior',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 30 }),
  [
    body('userId').isUUID(),
    body('timeframe').optional().isInt({ min: 1, max: 30 }),
  ],
  async (req, res) => {
    try {
      const { userId, timeframe } = req.body;

      const predictions = await PredictiveCoachingEngine.predictBehaviorPatterns(
        userId,
        timeframe
      );

      res.status(200).json({
        success: true,
        data: predictions,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to predict behavior patterns',
      });
    }
  }
);

/**
 * POST /api/ml/predict/engagement
 * Predict engagement levels
 */
router.post(
  '/predict/engagement',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 30 }),
  [
    body('userId').isUUID(),
    body('period').optional().isIn(['day', 'week', 'month']),
  ],
  async (req, res) => {
    try {
      const { userId, period } = req.body;

      const prediction = await PredictiveCoachingEngine.predictEngagement(
        userId,
        period
      );

      res.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to predict engagement',
      });
    }
  }
);

/**
 * POST /api/ml/optimize/coaching-path
 * Optimize coaching path for user
 */
router.post(
  '/optimize/coaching-path',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 20 }),
  [
    body('userId').isUUID(),
    body('goals').isArray(),
    body('goals.*').isUUID(),
    body('constraints.timeAvailable').isInt({ min: 0 }),
    body('constraints.resources').optional().isArray(),
    body('constraints.preferences').optional().isObject(),
  ],
  async (req, res) => {
    try {
      const { userId, goals, constraints } = req.body;

      const optimization = await PredictiveCoachingEngine.optimizeCoachingPath(
        userId,
        goals,
        constraints
      );

      res.status(200).json({
        success: true,
        data: optimization,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to optimize coaching path',
      });
    }
  }
);

// ==================== Model Monitoring ====================

/**
 * POST /api/ml/models/register
 * Register a model for monitoring
 */
router.post(
  '/models/register',
  authenticate,
  authorize(['admin']),
  rateLimiter({ windowMs: 60000, max: 10 }),
  [
    body('modelId').isString(),
    body('modelName').isString(),
    body('version').isString(),
    body('config').optional().isObject(),
  ],
  async (req, res) => {
    try {
      const { modelId, modelName, version, config } = req.body;

      await MLModelMonitoringService.registerModel(
        modelId,
        modelName,
        version,
        config
      );

      res.status(201).json({
        success: true,
        message: 'Model registered successfully',
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to register model',
      });
    }
  }
);

/**
 * POST /api/ml/models/:modelId/record
 * Record prediction for monitoring
 */
router.post(
  '/models/:modelId/record',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 1000 }),
  [
    param('modelId').isString(),
    body('prediction').exists(),
    body('actual').optional(),
    body('features').optional(),
    body('metadata').optional().isObject(),
  ],
  async (req, res) => {
    try {
      const { modelId } = req.params;
      const { prediction, actual, features, metadata } = req.body;

      await MLModelMonitoringService.recordPrediction(
        modelId,
        prediction,
        actual,
        features,
        metadata
      );

      res.status(200).json({
        success: true,
        message: 'Prediction recorded',
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to record prediction',
      });
    }
  }
);

/**
 * GET /api/ml/models/:modelId/metrics
 * Get model metrics
 */
router.get(
  '/models/:modelId/metrics',
  authenticate,
  authorize(['admin', 'analyst']),
  rateLimiter({ windowMs: 60000, max: 30 }),
  [
    param('modelId').isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  async (req, res) => {
    try {
      const { modelId } = req.params;
      const { startDate, endDate } = req.query;

      const timeRange = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      } : undefined;

      const metrics = await MLModelMonitoringService.getModelMetrics(
        modelId,
        timeRange
      );

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get model metrics',
      });
    }
  }
);

/**
 * GET /api/ml/models/:modelId/drift
 * Get drift analysis for model
 */
router.get(
  '/models/:modelId/drift',
  authenticate,
  authorize(['admin', 'analyst']),
  rateLimiter({ windowMs: 60000, max: 30 }),
  [param('modelId').isString()],
  async (req, res) => {
    try {
      const { modelId } = req.params;

      const drift = await MLModelMonitoringService.getDriftAnalysis(modelId);

      res.status(200).json({
        success: true,
        data: drift,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get drift analysis',
      });
    }
  }
);

/**
 * GET /api/ml/models/:modelId/health
 * Get model health status
 */
router.get(
  '/models/:modelId/health',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 60 }),
  [param('modelId').isString()],
  async (req, res) => {
    try {
      const { modelId } = req.params;

      const health = await MLModelMonitoringService.getModelHealth(modelId);

      res.status(200).json({
        success: true,
        data: health,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get model health',
      });
    }
  }
);

/**
 * GET /api/ml/models/:modelId/performance
 * Get performance report for model
 */
router.get(
  '/models/:modelId/performance',
  authenticate,
  authorize(['admin', 'analyst']),
  rateLimiter({ windowMs: 60000, max: 30 }),
  [
    param('modelId').isString(),
    query('period').optional().isIn(['hour', 'day', 'week', 'month']),
  ],
  async (req, res) => {
    try {
      const { modelId } = req.params;
      const { period } = req.query;

      const report = await MLModelMonitoringService.getPerformanceReport(
        modelId,
        period as unknown
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get performance report',
      });
    }
  }
);

// ==================== Alerts ====================

/**
 * GET /api/ml/alerts
 * Get active ML alerts
 */
router.get(
  '/alerts',
  authenticate,
  authorize(['admin']),
  rateLimiter({ windowMs: 60000, max: 30 }),
  [query('modelId').optional().isString()],
  async (req, res) => {
    try {
      const { modelId } = req.query;

      const alerts = await MLModelMonitoringService.getActiveAlerts(
        modelId as string
      );

      res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get alerts',
      });
    }
  }
);

/**
 * POST /api/ml/alerts/:alertId/resolve
 * Resolve an alert
 */
router.post(
  '/alerts/:alertId/resolve',
  authenticate,
  authorize(['admin']),
  rateLimiter({ windowMs: 60000, max: 30 }),
  [param('alertId').isUUID()],
  async (req, res) => {
    try {
      const { alertId } = req.params;

      await MLModelMonitoringService.resolveAlert(alertId);

      res.status(200).json({
        success: true,
        message: 'Alert resolved',
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to resolve alert',
      });
    }
  }
);

// ==================== Insights Generation ====================

/**
 * POST /api/ml/insights/generate
 * Generate insights for user
 */
router.post(
  '/insights/generate',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 60 }),
  [
    body('userId').isUUID(),
    body('timeframe').optional().isString(),
    body('focus').optional().isArray(),
    body('excludeTypes').optional().isArray(),
    body('minImportance').optional().isFloat({ min: 0, max: 1 }),
    body('maxInsights').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res) => {
    try {
      const context = req.body;

      const insights = await RealTimeInsightsGenerator.generateInsights(context);

      res.status(200).json({
        success: true,
        data: insights,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate insights',
      });
    }
  }
);

/**
 * POST /api/ml/insights/contextual
 * Generate contextual insight
 */
router.post(
  '/insights/contextual',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 60 }),
  [
    body('userId').isUUID(),
    body('context.currentActivity').optional().isString(),
    body('context.recentActions').optional().isArray(),
    body('context.mood').optional().isString(),
    body('context.timeOfDay').optional().isString(),
  ],
  async (req, res) => {
    try {
      const { userId, context } = req.body;

      const insight = await RealTimeInsightsGenerator.generateContextualInsight(
        userId,
        context
      );

      res.status(200).json({
        success: true,
        data: insight,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate contextual insight',
      });
    }
  }
);

/**
 * POST /api/ml/insights/predictive
 * Generate predictive insights
 */
router.post(
  '/insights/predictive',
  authenticate,
  rateLimiter({ windowMs: 60000, max: 30 }),
  [body('userId').isUUID()],
  async (req, res) => {
    try {
      const { userId } = req.body;

      const insights = await RealTimeInsightsGenerator.generatePredictiveInsights(userId);

      res.status(200).json({
        success: true,
        data: insights,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate predictive insights',
      });
    }
  }
);

export default router;