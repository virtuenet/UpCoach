/**
 * Intelligence API Routes
 * Endpoints for AI Phase A services:
 * - Anomaly Detection
 * - Natural Language Queries
 * @version 1.0.0
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import { createRateLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';
import {
  anomalyDetectionService,
  AnomalyType,
  DetectionAlgorithm,
  TimeSeriesDataPoint,
} from '../services/ml/AnomalyDetectionService';
import { explanationEngine } from '../services/ml/ExplanationEngine';
import { nlQueryService, NLQuery } from '../services/ai/NLQueryService';
import { queryToSQLTranslator } from '../services/ai/QueryToSQLTranslator';

const router = Router();

// Rate limiters
const anomalyRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many anomaly detection requests',
});

const queryRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50,
  message: 'Too many query requests',
});

// ==================== Anomaly Detection Routes ====================

/**
 * @route GET /api/intelligence/anomalies
 * @desc Get recent anomaly alerts
 * @access Admin
 */
router.get(
  '/anomalies',
  authenticate,
  requireRole(['admin', 'super_admin']),
  anomalyRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { metric, limit = 50 } = req.query;

      const alerts = anomalyDetectionService.getRecentAlerts(
        metric as string | undefined,
        Number(limit)
      );

      res.json({
        success: true,
        data: {
          alerts,
          count: alerts.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/intelligence/anomalies/detect
 * @desc Detect anomalies in provided data
 * @access Admin
 */
router.post(
  '/anomalies/detect',
  authenticate,
  requireRole(['admin', 'super_admin']),
  anomalyRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { metric, value, historicalData, algorithm } = req.body;

      if (!metric || value === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: metric, value',
        });
      }

      const result = anomalyDetectionService.detect(
        metric,
        value,
        historicalData
      );

      if (!result) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient data for detection',
        });
      }

      // Get explanation if anomaly detected
      let explanation = null;
      if (result.isAnomaly) {
        const alerts = anomalyDetectionService.getRecentAlerts(metric, 1);
        if (alerts.length > 0) {
          explanation = explanationEngine.explainAnomaly(alerts[0], historicalData);
        }
      }

      res.json({
        success: true,
        data: {
          result,
          explanation,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/intelligence/anomalies/detect-timeseries
 * @desc Detect anomalies in time series data
 * @access Admin
 */
router.post(
  '/anomalies/detect-timeseries',
  authenticate,
  requireRole(['admin', 'super_admin']),
  anomalyRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { metric, data, algorithm = 'ensemble' } = req.body;

      if (!metric || !Array.isArray(data)) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: metric, data (array)',
        });
      }

      // Convert to TimeSeriesDataPoint format
      const timeSeriesData: TimeSeriesDataPoint[] = data.map((point: { timestamp: string; value: number }) => ({
        timestamp: new Date(point.timestamp),
        value: point.value,
      }));

      const results = anomalyDetectionService.detectInTimeSeries(
        metric,
        timeSeriesData,
        algorithm as DetectionAlgorithm
      );

      const anomalies = results.filter(r => r.isAnomaly);

      res.json({
        success: true,
        data: {
          totalPoints: data.length,
          anomalyCount: anomalies.length,
          anomalyRate: (anomalies.length / data.length * 100).toFixed(2) + '%',
          anomalies: anomalies.slice(0, 20), // Limit response size
          summary: {
            severityDistribution: {
              low: anomalies.filter(a => a.severity === 'low').length,
              medium: anomalies.filter(a => a.severity === 'medium').length,
              high: anomalies.filter(a => a.severity === 'high').length,
              critical: anomalies.filter(a => a.severity === 'critical').length,
            },
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/intelligence/anomalies/record
 * @desc Record a metric value for ongoing monitoring
 * @access Admin, System
 */
router.post(
  '/anomalies/record',
  authenticate,
  requireRole(['admin', 'super_admin', 'system']),
  anomalyRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { metric, value } = req.body;

      if (!metric || value === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: metric, value',
        });
      }

      anomalyDetectionService.recordMetricValue(metric, value);

      res.json({
        success: true,
        message: 'Metric recorded successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/intelligence/anomalies/stats/:metric
 * @desc Get statistics for a metric
 * @access Admin
 */
router.get(
  '/anomalies/stats/:metric',
  authenticate,
  requireRole(['admin', 'super_admin']),
  anomalyRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { metric } = req.params;

      const stats = anomalyDetectionService.getMetricStats(metric);

      if (!stats) {
        return res.status(404).json({
          success: false,
          error: 'No data found for metric',
        });
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/intelligence/anomalies/metrics
 * @desc Get all registered metrics
 * @access Admin
 */
router.get(
  '/anomalies/metrics',
  authenticate,
  requireRole(['admin', 'super_admin']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const metrics = anomalyDetectionService.getRegisteredMetrics();

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/intelligence/anomalies/metrics
 * @desc Register a custom metric
 * @access Super Admin
 */
router.post(
  '/anomalies/metrics',
  authenticate,
  requireRole(['super_admin']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, type, algorithm, threshold, windowSize, minDataPoints, criticalThreshold } = req.body;

      if (!name || !type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, type',
        });
      }

      anomalyDetectionService.registerMetric({
        name,
        type: type as AnomalyType,
        algorithm: algorithm || 'zscore',
        threshold,
        windowSize,
        minDataPoints,
        criticalThreshold,
      });

      res.json({
        success: true,
        message: 'Metric registered successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Natural Language Query Routes ====================

/**
 * @route POST /api/intelligence/query
 * @desc Parse and execute a natural language query
 * @access Admin
 */
router.post(
  '/query',
  authenticate,
  requireRole(['admin', 'super_admin', 'analyst']),
  queryRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query, language = 'en', context } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: query',
        });
      }

      const nlQuery: NLQuery = {
        text: query,
        language,
        context,
      };

      const structuredQuery = await nlQueryService.parse(nlQuery);

      // Generate SQL (for reference, not execution)
      const sqlResult = queryToSQLTranslator.translate(structuredQuery, 'analytics');

      // Generate explanation
      const explanation = nlQueryService.explain(structuredQuery);
      const suggestions = nlQueryService.suggestFollowups(structuredQuery);

      res.json({
        success: true,
        data: {
          structuredQuery,
          sql: sqlResult.isValid ? sqlResult.sql : null,
          sqlParams: sqlResult.isValid ? sqlResult.params : null,
          explanation,
          suggestions,
          validation: {
            isValid: sqlResult.isValid,
            errors: sqlResult.validationErrors,
            complexity: sqlResult.estimatedComplexity,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/intelligence/query/validate
 * @desc Validate a natural language query without execution
 * @access Admin
 */
router.post(
  '/query/validate',
  authenticate,
  requireRole(['admin', 'super_admin', 'analyst']),
  queryRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query, table = 'analytics' } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: query',
        });
      }

      const nlQuery: NLQuery = { text: query };
      const structuredQuery = await nlQueryService.parse(nlQuery);
      const sqlResult = queryToSQLTranslator.translate(structuredQuery, table);

      res.json({
        success: true,
        data: {
          isValid: sqlResult.isValid,
          confidence: structuredQuery.confidence,
          intent: structuredQuery.intent,
          entities: structuredQuery.entities,
          validationErrors: sqlResult.validationErrors,
          estimatedComplexity: sqlResult.estimatedComplexity,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/intelligence/query/schemas
 * @desc Get available query schemas
 * @access Admin
 */
router.get(
  '/query/schemas',
  authenticate,
  requireRole(['admin', 'super_admin', 'analyst']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schemas = queryToSQLTranslator.getSchemas();

      const schemaList = Array.from(schemas.entries()).map(([name, schema]) => ({
        name,
        columns: schema.columns.map(c => ({
          name: c.name,
          type: c.type,
          filterable: c.isFilterable,
          selectable: c.isSelectable,
        })),
        allowedJoins: schema.allowedJoins?.map(j => j.table) || [],
      }));

      res.json({
        success: true,
        data: schemaList,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/intelligence/query/explain
 * @desc Get detailed explanation of a query
 * @access Admin
 */
router.post(
  '/query/explain',
  authenticate,
  requireRole(['admin', 'super_admin', 'analyst']),
  queryRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: query',
        });
      }

      const nlQuery: NLQuery = { text: query };
      const structuredQuery = await nlQueryService.parse(nlQuery);

      const explanation = nlQueryService.explain(structuredQuery);
      const suggestions = nlQueryService.suggestFollowups(structuredQuery);

      res.json({
        success: true,
        data: {
          explanation,
          suggestions,
          parsedQuery: {
            intent: structuredQuery.intent,
            entities: structuredQuery.entities,
            timeRange: {
              start: structuredQuery.timeRange.start.toISOString(),
              end: structuredQuery.timeRange.end.toISOString(),
              granularity: structuredQuery.timeRange.granularity,
              relative: structuredQuery.timeRange.relative,
            },
            aggregations: structuredQuery.aggregations,
            filters: structuredQuery.filters,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Health Check ====================

/**
 * @route GET /api/intelligence/health
 * @desc Check intelligence services health
 * @access Public
 */
router.get('/health', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    services: {
      anomalyDetection: 'operational',
      naturalLanguageQuery: 'operational',
      explanationEngine: 'operational',
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
