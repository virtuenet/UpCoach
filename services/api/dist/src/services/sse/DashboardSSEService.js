"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardSSEService = exports.DashboardSSEService = void 0;
const logger_1 = require("../../utils/logger");
const redis_1 = require("../redis");
const database_1 = require("../database");
const auth_1 = require("../../middleware/auth");
class DashboardSSEService {
    static instance;
    clients = new Map();
    heartbeatInterval = null;
    metricsInterval = null;
    HEARTBEAT_INTERVAL = 30000;
    METRICS_INTERVAL = 5000;
    CLIENT_TIMEOUT = 60000;
    MAX_CLIENTS_PER_USER = 3;
    constructor() {
        this.startHeartbeat();
        this.startMetricsBroadcast();
    }
    static getInstance() {
        if (!DashboardSSEService.instance) {
            DashboardSSEService.instance = new DashboardSSEService();
        }
        return DashboardSSEService.instance;
    }
    async handleConnection(req, res) {
        try {
            const authResult = await this.authenticateRequest(req);
            if (!authResult.success) {
                res.status(401).json({ error: authResult.error });
                return;
            }
            const { user } = authResult;
            const userConnections = Array.from(this.clients.values())
                .filter(client => client.userId === user.id);
            if (userConnections.length >= this.MAX_CLIENTS_PER_USER) {
                res.status(429).json({ error: 'Maximum connections exceeded' });
                return;
            }
            const allowedOrigins = [
                'http://localhost:1006',
                'http://localhost:1007',
                'http://localhost:1005',
                'https://admin.upcoach.ai',
                'https://cms.upcoach.ai',
                'https://upcoach.ai',
            ];
            const origin = req.headers.origin;
            const allowedOrigin = allowedOrigins.includes(origin || '') ? origin : allowedOrigins[0];
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': allowedOrigin,
                'Access-Control-Allow-Headers': 'Cache-Control, Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
                'X-Accel-Buffering': 'no',
            });
            const clientId = this.generateClientId();
            const client = {
                id: clientId,
                userId: user.id,
                userRole: user.role,
                response: res,
                permissions: await this.getUserPermissions(user.id, user.role),
                lastPing: new Date(),
                filters: this.parseFilters(req.query.filters),
                connectionTime: new Date(),
            };
            this.clients.set(clientId, client);
            this.sendToClient(client, {
                event: 'connected',
                data: {
                    clientId,
                    serverTime: new Date().toISOString(),
                    permissions: client.permissions,
                },
            });
            await this.sendInitialData(client);
            req.on('close', () => {
                this.handleDisconnection(clientId, 'client_disconnect');
            });
            req.on('aborted', () => {
                this.handleDisconnection(clientId, 'client_aborted');
            });
            await this.logConnectionEvent(user.id, 'sse_connected', {
                clientId,
                userAgent: req.headers['user-agent'],
                ip: req.ip,
            });
            logger_1.logger.info('SSE client connected', {
                clientId,
                userId: user.id,
                role: user.role,
                totalClients: this.clients.size,
            });
        }
        catch (error) {
            logger_1.logger.error('Error handling SSE connection:', error);
            res.status(500).json({ error: 'Connection failed' });
        }
    }
    async authenticateRequest(req) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '') ||
                req.query.token;
            if (!token) {
                return { success: false, error: 'Authentication token required' };
            }
            const decoded = (0, auth_1.verifyJWT)(token);
            if (!decoded) {
                return { success: false, error: 'Invalid authentication token' };
            }
            const hasPermission = await this.checkDashboardPermissions(decoded.userId, decoded.role);
            if (!hasPermission) {
                return { success: false, error: 'Insufficient permissions' };
            }
            const user = await this.getUserDetails(decoded.userId);
            if (!user || user.status !== 'active') {
                return { success: false, error: 'User not found or inactive' };
            }
            return {
                success: true,
                user: {
                    id: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('SSE authentication error:', error);
            return { success: false, error: 'Authentication failed' };
        }
    }
    sendToClient(client, message) {
        try {
            let output = '';
            if (message.id) {
                output += `id: ${message.id}\n`;
            }
            if (message.event) {
                output += `event: ${message.event}\n`;
            }
            if (message.retry) {
                output += `retry: ${message.retry}\n`;
            }
            const data = typeof message.data === 'string'
                ? message.data
                : JSON.stringify(message.data);
            data.split('\n').forEach(line => {
                output += `data: ${line}\n`;
            });
            output += '\n';
            return client.response.write(output);
        }
        catch (error) {
            logger_1.logger.error('Error sending message to SSE client:', error);
            this.handleDisconnection(client.id, 'send_error');
            return false;
        }
    }
    async broadcastToRole(message, requiredRole, requiredPermission) {
        const clients = Array.from(this.clients.values()).filter(client => {
            if (requiredRole && client.userRole !== requiredRole) {
                return false;
            }
            if (requiredPermission && !client.permissions.includes(requiredPermission) && !client.permissions.includes('*')) {
                return false;
            }
            return true;
        });
        const failures = [];
        for (const client of clients) {
            const success = this.sendToClient(client, message);
            if (!success) {
                failures.push(client.id);
            }
        }
        for (const clientId of failures) {
            this.handleDisconnection(clientId, 'broadcast_failure');
        }
        logger_1.logger.debug('SSE broadcast completed', {
            targetClients: clients.length,
            failures: failures.length,
            event: message.event,
        });
    }
    async broadcastAnalyticsUpdate(data) {
        await this.broadcastToRole({
            event: 'analytics_update',
            data: {
                ...data,
                timestamp: new Date().toISOString(),
            },
        }, undefined, 'analytics:read');
    }
    async broadcastUserActivity(data) {
        await this.broadcastToRole({
            event: 'user_activity',
            data: {
                ...data,
                timestamp: new Date().toISOString(),
            },
        }, undefined, 'users:manage');
    }
    async broadcastSystemAlert(alert) {
        await this.broadcastToRole({
            event: 'system_alert',
            data: {
                ...alert,
                timestamp: new Date().toISOString(),
            },
        }, 'admin');
    }
    async sendInitialData(client) {
        try {
            const dashboardData = await this.getDashboardData(client);
            this.sendToClient(client, {
                event: 'initial_data',
                data: dashboardData,
            });
            await this.sendRecentUpdates(client);
        }
        catch (error) {
            logger_1.logger.error('Error sending initial SSE data:', error);
            this.sendToClient(client, {
                event: 'error',
                data: { message: 'Failed to load initial data' },
            });
        }
    }
    async sendRecentUpdates(client) {
        try {
            if (client.permissions.includes('analytics:read') || client.permissions.includes('*')) {
                const recentAnalytics = await redis_1.redis.lrange('recent_updates:analytics', 0, 9);
                for (const update of recentAnalytics) {
                    this.sendToClient(client, {
                        event: 'recent_update',
                        data: JSON.parse(update),
                    });
                }
            }
            if (client.permissions.includes('users:manage') || client.permissions.includes('*')) {
                const recentActivity = await redis_1.redis.lrange('recent_updates:user_activity', 0, 9);
                for (const activity of recentActivity) {
                    this.sendToClient(client, {
                        event: 'recent_activity',
                        data: JSON.parse(activity),
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error sending recent updates:', error);
        }
    }
    handleDisconnection(clientId, reason) {
        try {
            const client = this.clients.get(clientId);
            if (client) {
                this.logConnectionEvent(client.userId, 'sse_disconnected', {
                    clientId,
                    reason,
                    duration: Date.now() - client.connectionTime.getTime(),
                });
                if (!client.response.headersSent) {
                    client.response.end();
                }
                this.clients.delete(clientId);
                logger_1.logger.info('SSE client disconnected', {
                    clientId,
                    userId: client.userId,
                    reason,
                    duration: `${Date.now() - client.connectionTime.getTime()}ms`,
                    remainingClients: this.clients.size,
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error handling SSE disconnection:', error);
        }
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            const now = new Date();
            const timeoutClients = [];
            for (const [clientId, client] of this.clients.entries()) {
                const pingSuccess = this.sendToClient(client, {
                    event: 'ping',
                    data: { timestamp: now.toISOString() },
                });
                if (!pingSuccess) {
                    timeoutClients.push(clientId);
                    continue;
                }
                const timeSinceLastPing = now.getTime() - client.lastPing.getTime();
                if (timeSinceLastPing > this.CLIENT_TIMEOUT) {
                    timeoutClients.push(clientId);
                }
            }
            for (const clientId of timeoutClients) {
                this.handleDisconnection(clientId, 'timeout');
            }
            if (timeoutClients.length > 0) {
                logger_1.logger.debug('Cleaned up timed out SSE clients', {
                    count: timeoutClients.length,
                    remaining: this.clients.size,
                });
            }
        }, this.HEARTBEAT_INTERVAL);
        logger_1.logger.info('SSE heartbeat started', {
            interval: this.HEARTBEAT_INTERVAL,
        });
    }
    startMetricsBroadcast() {
        this.metricsInterval = setInterval(async () => {
            try {
                const metrics = await this.getCurrentMetrics();
                await this.broadcastAnalyticsUpdate({
                    type: 'metrics_update',
                    data: metrics,
                });
            }
            catch (error) {
                logger_1.logger.error('Error in SSE metrics broadcast:', error);
            }
        }, this.METRICS_INTERVAL);
        logger_1.logger.info('SSE metrics broadcast started', {
            interval: this.METRICS_INTERVAL,
        });
    }
    handlePong(clientId) {
        const client = this.clients.get(clientId);
        if (client) {
            client.lastPing = new Date();
        }
    }
    updateClientFilters(clientId, filters) {
        const client = this.clients.get(clientId);
        if (client) {
            client.filters = { ...client.filters, ...filters };
            logger_1.logger.debug('Updated SSE client filters', {
                clientId,
                filters: client.filters,
            });
        }
    }
    generateClientId() {
        return `sse_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    parseFilters(filtersString) {
        if (!filtersString)
            return {};
        try {
            return JSON.parse(filtersString);
        }
        catch {
            return {};
        }
    }
    async checkDashboardPermissions(userId, role) {
        const allowedRoles = ['admin', 'super_admin', 'manager'];
        return allowedRoles.includes(role);
    }
    async getUserDetails(userId) {
        try {
            const result = await database_1.db.query('SELECT id, email, role, status FROM users WHERE id = $1', [userId]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.logger.error('Error getting user details:', error);
            return null;
        }
    }
    async getUserPermissions(userId, role) {
        const rolePermissions = {
            super_admin: ['*'],
            admin: ['analytics:read', 'users:manage', 'system:monitor'],
            manager: ['analytics:read', 'users:read'],
        };
        return rolePermissions[role] || [];
    }
    async getDashboardData(client) {
        const data = {};
        if (client.permissions.includes('analytics:read') || client.permissions.includes('*')) {
            data.metrics = await this.getCurrentMetrics();
        }
        if (client.permissions.includes('users:manage') || client.permissions.includes('*')) {
            data.recentActivity = await this.getRecentUserActivity();
        }
        return data;
    }
    async getCurrentMetrics() {
        try {
            const [activeUsers, goalCompletions, systemHealth] = await Promise.all([
                this.getActiveUsersCount(),
                this.getTodayGoalCompletions(),
                this.getSystemHealth(),
            ]);
            return {
                activeUsers,
                goalCompletions,
                systemHealth,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting current metrics:', error);
            return {
                activeUsers: 0,
                goalCompletions: 0,
                systemHealth: { status: 'unknown' },
                timestamp: new Date().toISOString(),
            };
        }
    }
    async getActiveUsersCount() {
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
    async getTodayGoalCompletions() {
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
    async getSystemHealth() {
        try {
            const responseTime = await redis_1.redis.get('metrics:avg_response_time');
            const errorRate = await redis_1.redis.get('metrics:error_rate_1h');
            return {
                status: parseFloat(errorRate || '0') > 0.05 ? 'degraded' : 'healthy',
                responseTime: parseFloat(responseTime || '0'),
                uptime: process.uptime(),
                errorRate: parseFloat(errorRate || '0'),
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting system health:', error);
            return {
                status: 'unknown',
                responseTime: 0,
                uptime: 0,
                errorRate: 0,
            };
        }
    }
    async getRecentUserActivity() {
        try {
            const result = await database_1.db.query(`
        SELECT u.name, u.email, s.last_activity, s.action
        FROM user_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.last_activity > NOW() - INTERVAL '1 hour'
        ORDER BY s.last_activity DESC
        LIMIT 20
      `);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('Error getting recent user activity:', error);
            return [];
        }
    }
    async logConnectionEvent(userId, event, metadata) {
        try {
            await database_1.db.query(`
        INSERT INTO websocket_events (user_id, event_type, metadata, created_at)
        VALUES ($1, $2, $3, NOW())
      `, [userId, event, JSON.stringify(metadata)]);
        }
        catch (error) {
            logger_1.logger.error('Error logging connection event:', error);
        }
    }
    getStats() {
        const clientsByRole = {};
        const clientsByPermissions = {};
        for (const client of this.clients.values()) {
            clientsByRole[client.userRole] = (clientsByRole[client.userRole] || 0) + 1;
            client.permissions.forEach(permission => {
                clientsByPermissions[permission] = (clientsByPermissions[permission] || 0) + 1;
            });
        }
        return {
            connectedClients: this.clients.size,
            clientsByRole,
            clientsByPermissions,
            isHeartbeatActive: !!this.heartbeatInterval,
            isMetricsBroadcastActive: !!this.metricsInterval,
            lastUpdate: new Date().toISOString(),
        };
    }
    async shutdown() {
        try {
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
                this.heartbeatInterval = null;
            }
            if (this.metricsInterval) {
                clearInterval(this.metricsInterval);
                this.metricsInterval = null;
            }
            for (const [clientId, client] of this.clients.entries()) {
                this.sendToClient(client, {
                    event: 'server_shutdown',
                    data: { message: 'Server is shutting down' },
                });
                client.response.end();
            }
            this.clients.clear();
            logger_1.logger.info('Dashboard SSE service shut down successfully');
        }
        catch (error) {
            logger_1.logger.error('Error shutting down Dashboard SSE service:', error);
        }
    }
}
exports.DashboardSSEService = DashboardSSEService;
exports.dashboardSSEService = DashboardSSEService.getInstance();
//# sourceMappingURL=DashboardSSEService.js.map