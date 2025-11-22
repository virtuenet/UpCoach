import { Router, Request, Response } from 'express';
import { dashboardSSEService } from '../../services/sse/DashboardSSEService';
import { dashboardWebSocketService } from '../../services/websocket/DashboardWebSocketService';
import { authMiddleware } from '../../middleware/auth';
import { roleMiddleware } from '../../middleware/role';
import { rateLimiterFlexible } from '../../middleware/rateLimiter';
import { logger } from '../../utils/logger';
import { ApiError } from '../../utils/apiError';
import { redis } from '../../services/redis';
import { db } from '../../services/database';

const router = Router();

// Rate limiting for real-time endpoints
const realtimeRateLimit = rateLimiterFlexible({
  keyName: 'realtime_dashboard',
  pointsToConsume: 1,
  durationSec: 60,
  blockDurationSec: 60,
  maxConsecutiveFailsByUsernameAndIP: 5,
});

/**
 * SSE endpoint for real-time dashboard updates
 * GET /api/dashboard/realtime/sse
 */
router.get('/sse',
  realtimeRateLimit,
  async (req: Request, res: Response) => {
    try {
      await dashboardSSEService.handleConnection(req, res);
    } catch (error) {
      logger.error('SSE connection error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to establish SSE connection' });
      }
    }
  }
);

/**
 * WebSocket endpoint information
 * GET /api/dashboard/realtime/websocket-info
 */
router.get('/websocket-info',
  authMiddleware,
  roleMiddleware(['admin', 'super_admin', 'manager']),
  realtimeRateLimit,
  async (req: Request, res: Response) => {
    try {
      const stats = dashboardWebSocketService.getStats();

      res.json({
        success: true,
        data: {
          websocketEndpoint: `//${req.get('host')}/socket.io`,
          connectionInfo: {
            transports: ['websocket', 'polling'],
            auth: {
              required: true,
              method: 'JWT Bearer Token',
              location: 'auth.token parameter',
            },
            events: {
              server_to_client: [
                'dashboard_data',
                'analytics_update',
                'user_activity',
                'system_alert',
                'pong',
              ],
              client_to_server: [
                'activity',
                'subscribe',
                'ping',
                'filter_change',
              ],
            },
          },
          currentStats: stats,
        },
      });
    } catch (error) {
      logger.error('Error getting WebSocket info:', error);
      throw new ApiError(500, 'Failed to get WebSocket information');
    }
  }
);

/**
 * SSE client management endpoints
 */

/**
 * Handle SSE pong responses
 * POST /api/dashboard/realtime/sse/pong
 */
router.post('/sse/pong',
  authMiddleware,
  realtimeRateLimit,
  async (req: Request, res: Response) => {
    try {
      const { clientId } = req.body;

      if (!clientId) {
        throw new ApiError(400, 'Client ID required');
      }

      dashboardSSEService.handlePong(clientId);

      res.json({
        success: true,
        message: 'Pong received',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('SSE pong error:', error);
      throw new ApiError(500, 'Failed to handle pong');
    }
  }
);

/**
 * Update SSE client filters
 * POST /api/dashboard/realtime/sse/filters
 */
router.post('/sse/filters',
  authMiddleware,
  realtimeRateLimit,
  async (req: Request, res: Response) => {
    try {
      const { clientId, filters } = req.body;

      if (!clientId) {
        throw new ApiError(400, 'Client ID required');
      }

      if (!filters || typeof filters !== 'object') {
        throw new ApiError(400, 'Valid filters object required');
      }

      dashboardSSEService.updateClientFilters(clientId, filters);

      res.json({
        success: true,
        message: 'Filters updated successfully',
        filters,
      });
    } catch (error) {
      logger.error('SSE filter update error:', error);
      throw new ApiError(500, 'Failed to update filters');
    }
  }
);

/**
 * Manual broadcast endpoints for testing and integration
 */

/**
 * Manually trigger analytics update broadcast
 * POST /api/dashboard/realtime/broadcast/analytics
 */
router.post('/broadcast/analytics',
  authMiddleware,
  roleMiddleware(['admin', 'super_admin']),
  realtimeRateLimit,
  async (req: Request, res: Response) => {
    try {
      const { type, data, metadata } = req.body;

      if (!type || !data) {
        throw new ApiError(400, 'Type and data are required');
      }

      const analyticsUpdate = {
        type,
        data,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          triggeredBy: req.user?.id,
          manual: true,
        },
      };

      // Broadcast via both WebSocket and SSE
      await Promise.all([
        dashboardWebSocketService.broadcastAnalyticsUpdate(analyticsUpdate),
        dashboardSSEService.broadcastAnalyticsUpdate(analyticsUpdate),
      ]);

      // Store in Redis for recent updates
      await redis.lpush(
        `recent_updates:${type}`,
        JSON.stringify(analyticsUpdate)
      );
      await redis.ltrim(`recent_updates:${type}`, 0, 99);
      await redis.expire(`recent_updates:${type}`, 3600);

      res.json({
        success: true,
        message: 'Analytics update broadcasted successfully',
        update: analyticsUpdate,
      });
    } catch (error) {
      logger.error('Manual analytics broadcast error:', error);
      throw new ApiError(500, 'Failed to broadcast analytics update');
    }
  }
);

/**
 * Manually trigger user activity broadcast
 * POST /api/dashboard/realtime/broadcast/user-activity
 */
router.post('/broadcast/user-activity',
  authMiddleware,
  roleMiddleware(['admin', 'super_admin']),
  realtimeRateLimit,
  async (req: Request, res: Response) => {
    try {
      const { userId, action, details } = req.body;

      if (!userId || !action) {
        throw new ApiError(400, 'User ID and action are required');
      }

      const userActivity = {
        userId,
        action,
        details: details || {},
        timestamp: new Date().toISOString(),
        triggeredBy: req.user?.id,
      };

      // Broadcast via both WebSocket and SSE
      await Promise.all([
        dashboardWebSocketService.sendUserActivityUpdate(userId, userActivity),
        dashboardSSEService.broadcastUserActivity(userActivity),
      ]);

      // Store in Redis
      await redis.lpush(
        'recent_updates:user_activity',
        JSON.stringify(userActivity)
      );
      await redis.ltrim('recent_updates:user_activity', 0, 99);
      await redis.expire('recent_updates:user_activity', 3600);

      res.json({
        success: true,
        message: 'User activity broadcasted successfully',
        activity: userActivity,
      });
    } catch (error) {
      logger.error('Manual user activity broadcast error:', error);
      throw new ApiError(500, 'Failed to broadcast user activity');
    }
  }
);

/**
 * Manually trigger system alert broadcast
 * POST /api/dashboard/realtime/broadcast/system-alert
 */
router.post('/broadcast/system-alert',
  authMiddleware,
  roleMiddleware(['admin', 'super_admin']),
  realtimeRateLimit,
  async (req: Request, res: Response) => {
    try {
      const { level, message, source, metadata } = req.body;

      if (!level || !message || !source) {
        throw new ApiError(400, 'Level, message, and source are required');
      }

      if (!['info', 'warning', 'error', 'critical'].includes(level)) {
        throw new ApiError(400, 'Invalid alert level');
      }

      const systemAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        level,
        message,
        source,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          triggeredBy: req.user?.id,
          manual: true,
        },
      };

      // Broadcast via both WebSocket and SSE
      await Promise.all([
        dashboardWebSocketService.broadcastSystemAlert(systemAlert),
        dashboardSSEService.broadcastSystemAlert(systemAlert),
      ]);

      // Store critical alerts in database
      if (level === 'critical' || level === 'error') {
        await db.query(`
          INSERT INTO system_alerts (id, level, message, source, metadata, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, [
          systemAlert.id,
          systemAlert.level,
          systemAlert.message,
          systemAlert.source,
          JSON.stringify(systemAlert.metadata),
        ]);
      }

      res.json({
        success: true,
        message: 'System alert broadcasted successfully',
        alert: systemAlert,
      });
    } catch (error) {
      logger.error('Manual system alert broadcast error:', error);
      throw new ApiError(500, 'Failed to broadcast system alert');
    }
  }
);

/**
 * Service status and statistics endpoints
 */

/**
 * Get real-time service status
 * GET /api/dashboard/realtime/status
 */
router.get('/status',
  authMiddleware,
  roleMiddleware(['admin', 'super_admin']),
  realtimeRateLimit,
  async (req: Request, res: Response) => {
    try {
      const [websocketStats, sseStats] = await Promise.all([
        dashboardWebSocketService.getStats(),
        dashboardSSEService.getStats(),
      ]);

      const redisHealth = await redis.ping().then(() => true).catch(() => false);
      const dbHealth = await db.query('SELECT 1').then(() => true).catch(() => false);

      res.json({
        success: true,
        data: {
          status: 'operational',
          services: {
            websocket: {
              ...websocketStats,
              status: 'active',
            },
            sse: {
              ...sseStats,
              status: 'active',
            },
            redis: {
              status: redisHealth ? 'healthy' : 'unhealthy',
            },
            database: {
              status: dbHealth ? 'healthy' : 'unhealthy',
            },
          },
          totalConnections: websocketStats.connectedClients + sseStats.connectedClients,
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting real-time service status:', error);
      throw new ApiError(500, 'Failed to get service status');
    }
  }
);

/**
 * Get real-time metrics
 * GET /api/dashboard/realtime/metrics
 */
router.get('/metrics',
  authMiddleware,
  roleMiddleware(['admin', 'super_admin', 'manager']),
  realtimeRateLimit,
  async (req: Request, res: Response) => {
    try {
      // Get current metrics
      const [activeUsers, goalCompletions, systemHealth] = await Promise.all([
        getActiveUsersCount(),
        getTodayGoalCompletions(),
        getSystemHealth(),
      ]);

      // Get recent updates from Redis
      const recentUpdates = await Promise.all([
        redis.lrange('recent_updates:analytics', 0, 4).then(updates =>
          updates.map(update => JSON.parse(update))
        ),
        redis.lrange('recent_updates:user_activity', 0, 9).then(activities =>
          activities.map(activity => JSON.parse(activity))
        ),
      ]);

      res.json({
        success: true,
        data: {
          current: {
            activeUsers,
            goalCompletions,
            systemHealth,
            timestamp: new Date().toISOString(),
          },
          recent: {
            analytics: recentUpdates[0],
            userActivity: recentUpdates[1],
          },
          connections: {
            websocket: dashboardWebSocketService.getStats().connectedClients,
            sse: dashboardSSEService.getStats().connectedClients,
          },
        },
      });
    } catch (error) {
      logger.error('Error getting real-time metrics:', error);
      throw new ApiError(500, 'Failed to get metrics');
    }
  }
);

/**
 * Test real-time connectivity
 * POST /api/dashboard/realtime/test
 */
router.post('/test',
  authMiddleware,
  roleMiddleware(['admin', 'super_admin']),
  realtimeRateLimit,
  async (req: Request, res: Response) => {
    try {
      const testMessage = {
        type: 'connectivity_test',
        data: {
          message: 'This is a test message from the real-time API',
          testId: `test_${Date.now()}`,
          initiatedBy: req.user?.id,
        },
        timestamp: new Date().toISOString(),
      };

      // Broadcast test message via both services
      await Promise.all([
        dashboardWebSocketService.broadcastAnalyticsUpdate(testMessage),
        dashboardSSEService.broadcastAnalyticsUpdate(testMessage),
      ]);

      res.json({
        success: true,
        message: 'Test message broadcasted successfully',
        testMessage,
      });
    } catch (error) {
      logger.error('Real-time connectivity test error:', error);
      throw new ApiError(500, 'Failed to run connectivity test');
    }
  }
);

// Helper functions
async function getActiveUsersCount(): Promise<number> {
  try {
    const result = await db.query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_sessions
      WHERE last_activity > NOW() - INTERVAL '15 minutes'
    `);
    return result.rows[0]?.count || 0;
  } catch (error) {
    logger.error('Error getting active users count:', error);
    return 0;
  }
}

async function getTodayGoalCompletions(): Promise<number> {
  try {
    const result = await db.query(`
      SELECT COUNT(*) as count
      FROM goal_completions
      WHERE DATE(completed_at) = CURRENT_DATE
    `);
    return result.rows[0]?.count || 0;
  } catch (error) {
    logger.error('Error getting goal completions:', error);
    return 0;
  }
}

async function getSystemHealth(): Promise<unknown> {
  try {
    const responseTime = await redis.get('metrics:avg_response_time');
    const errorRate = await redis.get('metrics:error_rate_1h');

    return {
      status: parseFloat(errorRate || '0') > 0.05 ? 'degraded' : 'healthy',
      responseTime: parseFloat(responseTime || '0'),
      uptime: process.uptime(),
      errorRate: parseFloat(errorRate || '0'),
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024,
      },
    };
  } catch (error) {
    logger.error('Error getting system health:', error);
    return {
      status: 'unknown',
      responseTime: 0,
      uptime: 0,
      errorRate: 0,
      memory: { used: 0, total: 0 },
    };
  }
}

export default router;