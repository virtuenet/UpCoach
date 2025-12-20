/**
 * Real-time API Routes
 *
 * REST endpoints for real-time features including:
 * - Predictions (on-demand and batch)
 * - Engagement monitoring
 * - AI streaming (SSE)
 * - Safety detection and management
 * - Real-time metrics
 */

import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';

import { authMiddleware, requireRole } from '../middleware/auth';
import { tenantContextMiddleware } from '../middleware/tenantContext';
import { validateRequest } from '../middleware/validateRequest';
import {
  realtimePredictionService,
  liveEngagementMonitor,
  streamingAIService,
  realtimeSafetyDetection,
  eventBus,
  eventStore,
} from '../services/realtime';
import logger from '../utils/logger';

const router = Router();

// ============================================================================
// Prediction Endpoints
// ============================================================================

/**
 * POST /api/realtime/predictions
 * Request a real-time prediction
 */
router.post(
  '/predictions',
  authMiddleware,
  tenantContextMiddleware,
  [
    body('type')
      .isIn(['churn', 'engagement', 'goal_completion', 'session_outcome', 'next_action'])
      .withMessage('Invalid prediction type'),
    body('input').optional().isObject().withMessage('Input must be an object'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { type, input } = req.body;

      const result = await realtimePredictionService.predict(type, userId, input || {});

      res.json({
        success: true,
        data: result,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Prediction error: ${error}`);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Prediction failed',
      });
    }
  }
);

/**
 * POST /api/realtime/predictions/batch
 * Request batch predictions
 */
router.post(
  '/predictions/batch',
  authMiddleware,
  tenantContextMiddleware,
  [
    body('requests')
      .isArray({ min: 1, max: 10 })
      .withMessage('Must provide 1-10 prediction requests'),
    body('requests.*.type')
      .isIn(['churn', 'engagement', 'goal_completion', 'session_outcome', 'next_action'])
      .withMessage('Invalid prediction type'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { requests } = req.body;

      const batchRequests = requests.map((r: any) => ({
        type: r.type,
        userId,
        input: r.input || {},
      }));

      const result = await realtimePredictionService.batchPredict(batchRequests);

      res.json({
        success: true,
        data: result,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Batch prediction error: ${error}`);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Batch prediction failed',
      });
    }
  }
);

/**
 * GET /api/realtime/predictions/stats
 * Get prediction service statistics (admin only)
 */
router.get(
  '/predictions/stats',
  authMiddleware,
  requireRole(['admin', 'super_admin']),
  async (_req: Request, res: Response) => {
    try {
      const stats = realtimePredictionService.getStats();

      res.json({
        success: true,
        data: stats,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Prediction stats error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get prediction stats',
      });
    }
  }
);

// ============================================================================
// Engagement Monitoring Endpoints
// ============================================================================

/**
 * GET /api/realtime/engagement/metrics
 * Get current engagement metrics (admin only)
 */
router.get(
  '/engagement/metrics',
  authMiddleware,
  requireRole(['admin', 'super_admin']),
  async (_req: Request, res: Response) => {
    try {
      const metrics = liveEngagementMonitor.getCurrentMetrics();
      const activeUsers = liveEngagementMonitor.getActiveUsers();
      const activeSessions = liveEngagementMonitor.getActiveSessions();

      res.json({
        success: true,
        data: {
          metrics,
          activeUserCount: activeUsers.length,
          activeSessionCount: activeSessions.length,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Engagement metrics error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get engagement metrics',
      });
    }
  }
);

/**
 * GET /api/realtime/engagement/users
 * Get active users list (admin only)
 */
router.get(
  '/engagement/users',
  authMiddleware,
  requireRole(['admin', 'super_admin']),
  [
    query('status')
      .optional()
      .isIn(['active', 'idle', 'away', 'offline'])
      .withMessage('Invalid status'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { status, limit = 50 } = req.query;

      let users = liveEngagementMonitor.getActiveUsers(status as any);
      users = users.slice(0, Number(limit));

      res.json({
        success: true,
        data: users,
        count: users.length,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Active users error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get active users',
      });
    }
  }
);

/**
 * GET /api/realtime/engagement/churn-alerts
 * Get churn risk alerts (admin only)
 */
router.get(
  '/engagement/churn-alerts',
  authMiddleware,
  requireRole(['admin', 'super_admin']),
  [query('includeAcknowledged').optional().isBoolean().toBoolean()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const includeAcknowledged = req.query.includeAcknowledged === true;
      const alerts = liveEngagementMonitor.getChurnAlerts(includeAcknowledged);

      res.json({
        success: true,
        data: alerts,
        count: alerts.length,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Churn alerts error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get churn alerts',
      });
    }
  }
);

/**
 * POST /api/realtime/engagement/churn-alerts/:id/acknowledge
 * Acknowledge a churn alert (admin only)
 */
router.post(
  '/engagement/churn-alerts/:id/acknowledge',
  authMiddleware,
  requireRole(['admin', 'super_admin']),
  [param('id').isUUID().withMessage('Invalid alert ID')],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user?.id;

      const success = liveEngagementMonitor.acknowledgeAlert(id, adminId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found',
        });
      }

      res.json({
        success: true,
        message: 'Alert acknowledged',
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Acknowledge alert error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to acknowledge alert',
      });
    }
  }
);

// ============================================================================
// AI Streaming Endpoints
// ============================================================================

/**
 * POST /api/realtime/stream/start
 * Start an AI streaming session
 */
router.post(
  '/stream/start',
  authMiddleware,
  tenantContextMiddleware,
  [
    body('prompt').isString().notEmpty().withMessage('Prompt is required'),
    body('options').optional().isObject().withMessage('Options must be an object'),
    body('options.provider')
      .optional()
      .isIn(['openai', 'claude', 'local', 'hybrid'])
      .withMessage('Invalid provider'),
    body('options.maxTokens').optional().isInt({ min: 1, max: 4096 }).toInt(),
    body('options.temperature').optional().isFloat({ min: 0, max: 2 }),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { prompt, options } = req.body;

      const streamId = await streamingAIService.createStream({
        userId,
        prompt,
        options,
      });

      res.json({
        success: true,
        data: {
          streamId,
          sseEndpoint: `/api/realtime/stream/${streamId}/events`,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Stream start error: ${error}`);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start stream',
      });
    }
  }
);

/**
 * GET /api/realtime/stream/:streamId/events
 * SSE endpoint for streaming AI responses
 */
router.get(
  '/stream/:streamId/events',
  authMiddleware,
  [param('streamId').isUUID().withMessage('Invalid stream ID')],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { streamId } = req.params;

      // Verify stream ownership
      const stream = streamingAIService.getStream(streamId);
      const userId = (req as any).user?.id;

      if (!stream) {
        return res.status(404).json({
          success: false,
          error: 'Stream not found',
        });
      }

      if (stream.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      // Start SSE streaming
      await streamingAIService.streamToSSE(streamId, res);
    } catch (error) {
      logger.error(`[RealtimeAPI] Stream events error: ${error}`);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Streaming failed',
      });
    }
  }
);

/**
 * POST /api/realtime/stream/:streamId/cancel
 * Cancel an active stream
 */
router.post(
  '/stream/:streamId/cancel',
  authMiddleware,
  [param('streamId').isUUID().withMessage('Invalid stream ID')],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { streamId } = req.params;
      const userId = (req as any).user?.id;

      // Verify ownership
      const stream = streamingAIService.getStream(streamId);
      if (!stream || stream.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Stream not found',
        });
      }

      const cancelled = await streamingAIService.cancelStream(streamId, 'User cancelled');

      res.json({
        success: cancelled,
        message: cancelled ? 'Stream cancelled' : 'Failed to cancel stream',
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Stream cancel error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel stream',
      });
    }
  }
);

/**
 * GET /api/realtime/stream/stats
 * Get streaming service statistics (admin only)
 */
router.get(
  '/stream/stats',
  authMiddleware,
  requireRole(['admin', 'super_admin']),
  async (_req: Request, res: Response) => {
    try {
      const stats = streamingAIService.getStats();

      res.json({
        success: true,
        data: stats,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Stream stats error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get stream stats',
      });
    }
  }
);

// ============================================================================
// Safety Detection Endpoints
// ============================================================================

/**
 * POST /api/realtime/safety/check
 * Perform safety check on content
 */
router.post(
  '/safety/check',
  authMiddleware,
  tenantContextMiddleware,
  [
    body('content').isString().notEmpty().withMessage('Content is required'),
    body('contentId').optional().isString(),
    body('source')
      .optional()
      .isIn(['user_message', 'ai_response', 'coach_message', 'system_generated']),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { content, contentId, source } = req.body;

      const result = await realtimeSafetyDetection.checkContent({
        contentId: contentId || `check-${Date.now()}`,
        userId,
        content,
        source: source || 'user_message',
      });

      res.json({
        success: true,
        data: result,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Safety check error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Safety check failed',
      });
    }
  }
);

/**
 * GET /api/realtime/safety/detections
 * Get safety detections (admin only)
 */
router.get(
  '/safety/detections',
  authMiddleware,
  requireRole(['admin', 'super_admin']),
  [
    query('userId').optional().isUUID(),
    query('category').optional().isString(),
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('reviewed').optional().isBoolean().toBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { userId, reviewed, limit = 50 } = req.query;

      let detections;
      if (userId) {
        detections = realtimeSafetyDetection.getUserDetections(userId as string, {
          limit: Number(limit),
        });
      } else if (reviewed === false) {
        detections = realtimeSafetyDetection.getUnreviewedDetections(Number(limit));
      } else {
        detections = realtimeSafetyDetection.getUnreviewedDetections(Number(limit));
      }

      res.json({
        success: true,
        data: detections,
        count: detections.length,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Get detections error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get detections',
      });
    }
  }
);

/**
 * POST /api/realtime/safety/detections/:id/review
 * Review a safety detection (admin only)
 */
router.post(
  '/safety/detections/:id/review',
  authMiddleware,
  requireRole(['admin', 'super_admin']),
  [
    param('id').isUUID().withMessage('Invalid detection ID'),
    body('outcome')
      .isIn(['confirmed', 'false_positive', 'adjusted'])
      .withMessage('Invalid outcome'),
    body('notes').optional().isString(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { outcome, notes } = req.body;
      const reviewerId = (req as any).user?.id;

      const success = await realtimeSafetyDetection.reviewDetection(
        id,
        reviewerId,
        outcome,
        notes
      );

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Detection not found',
        });
      }

      res.json({
        success: true,
        message: 'Detection reviewed',
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Review detection error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to review detection',
      });
    }
  }
);

/**
 * GET /api/realtime/safety/escalations
 * Get open safety escalations (admin only)
 */
router.get(
  '/safety/escalations',
  authMiddleware,
  requireRole(['admin', 'super_admin']),
  async (_req: Request, res: Response) => {
    try {
      const escalations = realtimeSafetyDetection.getOpenEscalations();

      res.json({
        success: true,
        data: escalations,
        count: escalations.length,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Get escalations error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get escalations',
      });
    }
  }
);

/**
 * POST /api/realtime/safety/escalations/:id/resolve
 * Resolve a safety escalation (admin only)
 */
router.post(
  '/safety/escalations/:id/resolve',
  authMiddleware,
  requireRole(['admin', 'super_admin']),
  [
    param('id').isUUID().withMessage('Invalid escalation ID'),
    body('resolution').isString().notEmpty().withMessage('Resolution is required'),
    body('dismiss').optional().isBoolean(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { resolution, dismiss = false } = req.body;

      const success = await realtimeSafetyDetection.resolveEscalation(id, resolution, dismiss);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Escalation not found',
        });
      }

      res.json({
        success: true,
        message: 'Escalation resolved',
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Resolve escalation error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to resolve escalation',
      });
    }
  }
);

/**
 * GET /api/realtime/safety/stats
 * Get safety detection statistics (admin only)
 */
router.get(
  '/safety/stats',
  authMiddleware,
  requireRole(['admin', 'super_admin']),
  async (_req: Request, res: Response) => {
    try {
      const stats = realtimeSafetyDetection.getStats();

      res.json({
        success: true,
        data: stats,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Safety stats error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get safety stats',
      });
    }
  }
);

/**
 * GET /api/realtime/safety/rules
 * Get safety rules (admin only)
 */
router.get(
  '/safety/rules',
  authMiddleware,
  requireRole(['admin', 'super_admin']),
  async (_req: Request, res: Response) => {
    try {
      const rules = realtimeSafetyDetection.getRules();

      // Sanitize regex patterns for JSON
      const sanitizedRules = rules.map(rule => ({
        ...rule,
        patterns: rule.patterns.map(p => p.source),
      }));

      res.json({
        success: true,
        data: sanitizedRules,
        count: rules.length,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Get rules error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get safety rules',
      });
    }
  }
);

// ============================================================================
// Event System Endpoints
// ============================================================================

/**
 * GET /api/realtime/events/stats
 * Get event bus statistics (admin only)
 */
router.get(
  '/events/stats',
  authMiddleware,
  requireRole(['admin', 'super_admin']),
  async (_req: Request, res: Response) => {
    try {
      const busStats = eventBus.getStats();
      const storeStats = eventStore.getStats();

      res.json({
        success: true,
        data: {
          eventBus: busStats,
          eventStore: storeStats,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Event stats error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get event stats',
      });
    }
  }
);

/**
 * GET /api/realtime/events/dead-letter
 * Get dead letter queue events (admin only)
 */
router.get(
  '/events/dead-letter',
  authMiddleware,
  requireRole(['admin', 'super_admin']),
  async (_req: Request, res: Response) => {
    try {
      const deadLetters = eventBus.getDeadLetterQueue();

      res.json({
        success: true,
        data: deadLetters,
        count: deadLetters.length,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error(`[RealtimeAPI] Dead letter error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get dead letter queue',
      });
    }
  }
);

// ============================================================================
// Health Check
// ============================================================================

/**
 * GET /api/realtime/health
 * Health check for real-time services
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const predictionStats = realtimePredictionService.getStats();
    const streamStats = streamingAIService.getStats();
    const safetyStats = realtimeSafetyDetection.getStats();
    const engagementMetrics = liveEngagementMonitor.getCurrentMetrics();

    res.json({
      success: true,
      status: 'healthy',
      services: {
        predictions: {
          status: 'up',
          modelsCached: predictionStats.modelsCached,
        },
        streaming: {
          status: 'up',
          activeStreams: streamStats.activeStreams,
        },
        safety: {
          status: 'up',
          totalChecks: safetyStats.totalChecks,
        },
        engagement: {
          status: 'up',
          activeUsers: engagementMetrics.activeUsers,
        },
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: Date.now(),
    });
  }
});

export default router;
