"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DashboardSSEService_1 = require("../../services/sse/DashboardSSEService");
const DashboardWebSocketService_1 = require("../../services/websocket/DashboardWebSocketService");
const auth_1 = require("../../middleware/auth");
const role_1 = require("../../middleware/role");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const logger_1 = require("../../utils/logger");
const apiError_1 = require("../../utils/apiError");
const redis_1 = require("../../services/redis");
const database_1 = require("../../services/database");
const router = (0, express_1.Router)();
const realtimeRateLimit = (0, rateLimiter_1.rateLimiterFlexible)({
    keyName: 'realtime_dashboard',
    pointsToConsume: 1,
    durationSec: 60,
    blockDurationSec: 60,
    maxConsecutiveFailsByUsernameAndIP: 5,
});
router.get('/sse', realtimeRateLimit, async (req, res) => {
    try {
        await DashboardSSEService_1.dashboardSSEService.handleConnection(req, res);
    }
    catch (error) {
        logger_1.logger.error('SSE connection error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to establish SSE connection' });
        }
    }
});
router.get('/websocket-info', auth_1.authMiddleware, (0, role_1.roleMiddleware)(['admin', 'super_admin', 'manager']), realtimeRateLimit, async (req, res) => {
    try {
        const stats = DashboardWebSocketService_1.dashboardWebSocketService.getStats();
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
    }
    catch (error) {
        logger_1.logger.error('Error getting WebSocket info:', error);
        throw new apiError_1.ApiError(500, 'Failed to get WebSocket information');
    }
});
router.post('/sse/pong', auth_1.authMiddleware, realtimeRateLimit, async (req, res) => {
    try {
        const { clientId } = req.body;
        if (!clientId) {
            throw new apiError_1.ApiError(400, 'Client ID required');
        }
        DashboardSSEService_1.dashboardSSEService.handlePong(clientId);
        res.json({
            success: true,
            message: 'Pong received',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('SSE pong error:', error);
        throw new apiError_1.ApiError(500, 'Failed to handle pong');
    }
});
router.post('/sse/filters', auth_1.authMiddleware, realtimeRateLimit, async (req, res) => {
    try {
        const { clientId, filters } = req.body;
        if (!clientId) {
            throw new apiError_1.ApiError(400, 'Client ID required');
        }
        if (!filters || typeof filters !== 'object') {
            throw new apiError_1.ApiError(400, 'Valid filters object required');
        }
        DashboardSSEService_1.dashboardSSEService.updateClientFilters(clientId, filters);
        res.json({
            success: true,
            message: 'Filters updated successfully',
            filters,
        });
    }
    catch (error) {
        logger_1.logger.error('SSE filter update error:', error);
        throw new apiError_1.ApiError(500, 'Failed to update filters');
    }
});
router.post('/broadcast/analytics', auth_1.authMiddleware, (0, role_1.roleMiddleware)(['admin', 'super_admin']), realtimeRateLimit, async (req, res) => {
    try {
        const { type, data, metadata } = req.body;
        if (!type || !data) {
            throw new apiError_1.ApiError(400, 'Type and data are required');
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
        await Promise.all([
            DashboardWebSocketService_1.dashboardWebSocketService.broadcastAnalyticsUpdate(analyticsUpdate),
            DashboardSSEService_1.dashboardSSEService.broadcastAnalyticsUpdate(analyticsUpdate),
        ]);
        await redis_1.redis.lpush(`recent_updates:${type}`, JSON.stringify(analyticsUpdate));
        await redis_1.redis.ltrim(`recent_updates:${type}`, 0, 99);
        await redis_1.redis.expire(`recent_updates:${type}`, 3600);
        res.json({
            success: true,
            message: 'Analytics update broadcasted successfully',
            update: analyticsUpdate,
        });
    }
    catch (error) {
        logger_1.logger.error('Manual analytics broadcast error:', error);
        throw new apiError_1.ApiError(500, 'Failed to broadcast analytics update');
    }
});
router.post('/broadcast/user-activity', auth_1.authMiddleware, (0, role_1.roleMiddleware)(['admin', 'super_admin']), realtimeRateLimit, async (req, res) => {
    try {
        const { userId, action, details } = req.body;
        if (!userId || !action) {
            throw new apiError_1.ApiError(400, 'User ID and action are required');
        }
        const userActivity = {
            userId,
            action,
            details: details || {},
            timestamp: new Date().toISOString(),
            triggeredBy: req.user?.id,
        };
        await Promise.all([
            DashboardWebSocketService_1.dashboardWebSocketService.sendUserActivityUpdate(userId, userActivity),
            DashboardSSEService_1.dashboardSSEService.broadcastUserActivity(userActivity),
        ]);
        await redis_1.redis.lpush('recent_updates:user_activity', JSON.stringify(userActivity));
        await redis_1.redis.ltrim('recent_updates:user_activity', 0, 99);
        await redis_1.redis.expire('recent_updates:user_activity', 3600);
        res.json({
            success: true,
            message: 'User activity broadcasted successfully',
            activity: userActivity,
        });
    }
    catch (error) {
        logger_1.logger.error('Manual user activity broadcast error:', error);
        throw new apiError_1.ApiError(500, 'Failed to broadcast user activity');
    }
});
router.post('/broadcast/system-alert', auth_1.authMiddleware, (0, role_1.roleMiddleware)(['admin', 'super_admin']), realtimeRateLimit, async (req, res) => {
    try {
        const { level, message, source, metadata } = req.body;
        if (!level || !message || !source) {
            throw new apiError_1.ApiError(400, 'Level, message, and source are required');
        }
        if (!['info', 'warning', 'error', 'critical'].includes(level)) {
            throw new apiError_1.ApiError(400, 'Invalid alert level');
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
        await Promise.all([
            DashboardWebSocketService_1.dashboardWebSocketService.broadcastSystemAlert(systemAlert),
            DashboardSSEService_1.dashboardSSEService.broadcastSystemAlert(systemAlert),
        ]);
        if (level === 'critical' || level === 'error') {
            await database_1.db.query(`
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
    }
    catch (error) {
        logger_1.logger.error('Manual system alert broadcast error:', error);
        throw new apiError_1.ApiError(500, 'Failed to broadcast system alert');
    }
});
router.get('/status', auth_1.authMiddleware, (0, role_1.roleMiddleware)(['admin', 'super_admin']), realtimeRateLimit, async (req, res) => {
    try {
        const [websocketStats, sseStats] = await Promise.all([
            DashboardWebSocketService_1.dashboardWebSocketService.getStats(),
            DashboardSSEService_1.dashboardSSEService.getStats(),
        ]);
        const redisHealth = await redis_1.redis.ping().then(() => true).catch(() => false);
        const dbHealth = await database_1.db.query('SELECT 1').then(() => true).catch(() => false);
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
    }
    catch (error) {
        logger_1.logger.error('Error getting real-time service status:', error);
        throw new apiError_1.ApiError(500, 'Failed to get service status');
    }
});
router.get('/metrics', auth_1.authMiddleware, (0, role_1.roleMiddleware)(['admin', 'super_admin', 'manager']), realtimeRateLimit, async (req, res) => {
    try {
        const [activeUsers, goalCompletions, systemHealth] = await Promise.all([
            getActiveUsersCount(),
            getTodayGoalCompletions(),
            getSystemHealth(),
        ]);
        const recentUpdates = await Promise.all([
            redis_1.redis.lrange('recent_updates:analytics', 0, 4).then(updates => updates.map(update => JSON.parse(update))),
            redis_1.redis.lrange('recent_updates:user_activity', 0, 9).then(activities => activities.map(activity => JSON.parse(activity))),
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
                    websocket: DashboardWebSocketService_1.dashboardWebSocketService.getStats().connectedClients,
                    sse: DashboardSSEService_1.dashboardSSEService.getStats().connectedClients,
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting real-time metrics:', error);
        throw new apiError_1.ApiError(500, 'Failed to get metrics');
    }
});
router.post('/test', auth_1.authMiddleware, (0, role_1.roleMiddleware)(['admin', 'super_admin']), realtimeRateLimit, async (req, res) => {
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
        await Promise.all([
            DashboardWebSocketService_1.dashboardWebSocketService.broadcastAnalyticsUpdate(testMessage),
            DashboardSSEService_1.dashboardSSEService.broadcastAnalyticsUpdate(testMessage),
        ]);
        res.json({
            success: true,
            message: 'Test message broadcasted successfully',
            testMessage,
        });
    }
    catch (error) {
        logger_1.logger.error('Real-time connectivity test error:', error);
        throw new apiError_1.ApiError(500, 'Failed to run connectivity test');
    }
});
async function getActiveUsersCount() {
    try {
        const result = await database_1.db.query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_sessions
      WHERE last_activity > NOW() - INTERVAL '15 minutes'
    `);
        return result.rows[0]?.count || 0;
    }
    catch (error) {
        logger_1.logger.error('Error getting active users count:', error);
        return 0;
    }
}
async function getTodayGoalCompletions() {
    try {
        const result = await database_1.db.query(`
      SELECT COUNT(*) as count
      FROM goal_completions
      WHERE DATE(completed_at) = CURRENT_DATE
    `);
        return result.rows[0]?.count || 0;
    }
    catch (error) {
        logger_1.logger.error('Error getting goal completions:', error);
        return 0;
    }
}
async function getSystemHealth() {
    try {
        const responseTime = await redis_1.redis.get('metrics:avg_response_time');
        const errorRate = await redis_1.redis.get('metrics:error_rate_1h');
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
    }
    catch (error) {
        logger_1.logger.error('Error getting system health:', error);
        return {
            status: 'unknown',
            responseTime: 0,
            uptime: 0,
            errorRate: 0,
            memory: { used: 0, total: 0 },
        };
    }
}
exports.default = router;
