"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardWebSocketService = exports.DashboardWebSocketService = void 0;
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const logger_1 = require("../../utils/logger");
const redis_1 = require("../redis");
const database_1 = require("../database");
const apiError_1 = require("../../utils/apiError");
const auth_1 = require("../../middleware/auth");
const environment_1 = require("../../config/environment");
class DashboardWebSocketService {
    static instance;
    io = null;
    connectedClients = new Map();
    metricsUpdateInterval = null;
    METRICS_UPDATE_INTERVAL = 5000;
    MAX_CONNECTIONS_PER_USER = 3;
    constructor() {
        this.setupRedisAdapter();
    }
    static getInstance() {
        if (!DashboardWebSocketService.instance) {
            DashboardWebSocketService.instance = new DashboardWebSocketService();
        }
        return DashboardWebSocketService.instance;
    }
    async initialize(httpServer) {
        try {
            this.io = new socket_io_1.Server(httpServer, {
                cors: {
                    origin: environment_1.config.corsOrigins,
                    methods: ['GET', 'POST'],
                    credentials: true,
                },
                transports: ['websocket', 'polling'],
                pingTimeout: 60000,
                pingInterval: 25000,
                maxHttpBufferSize: 1e6,
                allowEIO3: true,
                connectTimeout: 45000,
                serveClient: false,
                allowRequest: this.authenticateConnection.bind(this),
            });
            await this.setupRedisAdapter();
            this.io.use(this.authenticationMiddleware.bind(this));
            this.setupConnectionHandlers();
            this.startMetricsBroadcasting();
            logger_1.logger.info('Dashboard WebSocket service initialized successfully', {
                transports: ['websocket', 'polling'],
                corsOrigins: environment_1.config.corsOrigins,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Dashboard WebSocket service:', error);
            throw new apiError_1.ApiError(500, 'Failed to initialize real-time service');
        }
    }
    async setupRedisAdapter() {
        if (!this.io)
            return;
        try {
            const pubClient = redis_1.redis.duplicate();
            const subClient = redis_1.redis.duplicate();
            this.io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
            logger_1.logger.info('Redis adapter configured for WebSocket clustering');
        }
        catch (error) {
            logger_1.logger.warn('Failed to set up Redis adapter, using memory adapter:', error);
        }
    }
    async authenticateConnection(req, callback) {
        try {
            const token = req.handshake?.auth?.token || req.handshake?.query?.token;
            if (!token) {
                callback('Authentication token required', false);
                return;
            }
            const decoded = (0, auth_1.verifyJWT)(token);
            if (!decoded) {
                callback('Invalid authentication token', false);
                return;
            }
            const hasPermission = await this.checkDashboardPermissions(decoded.userId, decoded.role);
            if (!hasPermission) {
                callback('Insufficient permissions for dashboard access', false);
                return;
            }
            const userConnections = Array.from(this.connectedClients.values())
                .filter(client => client.userId === decoded.userId);
            if (userConnections.length >= this.MAX_CONNECTIONS_PER_USER) {
                callback('Maximum connections exceeded for user', false);
                return;
            }
            req.user = decoded;
            callback(null, true);
        }
        catch (error) {
            logger_1.logger.error('WebSocket authentication error:', error);
            callback('Authentication failed', false);
        }
    }
    async authenticationMiddleware(socket, next) {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;
            if (!token) {
                return next(new Error('Authentication token required'));
            }
            const decoded = (0, auth_1.verifyJWT)(token);
            if (!decoded) {
                return next(new Error('Invalid authentication token'));
            }
            const user = await this.getUserDetails(decoded.userId);
            if (!user || user.status !== 'active') {
                return next(new Error('User not found or inactive'));
            }
            socket.user = {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                permissions: await this.getUserPermissions(decoded.userId, decoded.role),
            };
            next();
        }
        catch (error) {
            logger_1.logger.error('Socket authentication middleware error:', error);
            next(new Error('Authentication failed'));
        }
    }
    setupConnectionHandlers() {
        if (!this.io)
            return;
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }
    async handleConnection(socket) {
        try {
            const user = socket.user;
            const clientInfo = {
                userId: user.id,
                userRole: user.role,
                connectionTime: new Date(),
                lastActivity: new Date(),
                permissions: user.permissions,
                socketId: socket.id,
            };
            this.connectedClients.set(socket.id, clientInfo);
            await this.joinRooms(socket, user);
            await this.sendInitialDashboardData(socket, user);
            this.setupSocketEventHandlers(socket);
            await this.logConnectionEvent(user.id, 'connected', {
                socketId: socket.id,
                userAgent: socket.handshake.headers['user-agent'],
                ip: socket.handshake.address,
            });
            logger_1.logger.info('Dashboard client connected', {
                userId: user.id,
                role: user.role,
                socketId: socket.id,
                totalConnections: this.connectedClients.size,
            });
        }
        catch (error) {
            logger_1.logger.error('Error handling WebSocket connection:', error);
            socket.disconnect();
        }
    }
    setupSocketEventHandlers(socket) {
        socket.on('disconnect', (reason) => {
            this.handleDisconnection(socket, reason);
        });
        socket.on('activity', (data) => {
            this.handleUserActivity(socket, data);
        });
        socket.on('subscribe', (data) => {
            this.handleSubscription(socket, data.streams);
        });
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now() });
            this.updateClientActivity(socket.id);
        });
        socket.on('filter_change', (data) => {
            this.handleFilterChange(socket, data);
        });
    }
    async handleDisconnection(socket, reason) {
        try {
            const client = this.connectedClients.get(socket.id);
            if (client) {
                await this.logConnectionEvent(client.userId, 'disconnected', {
                    reason,
                    duration: Date.now() - client.connectionTime.getTime(),
                });
                this.connectedClients.delete(socket.id);
                logger_1.logger.info('Dashboard client disconnected', {
                    userId: client.userId,
                    socketId: socket.id,
                    reason,
                    duration: `${Date.now() - client.connectionTime.getTime()}ms`,
                    remainingConnections: this.connectedClients.size,
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error handling WebSocket disconnection:', error);
        }
    }
    async joinRooms(socket, user) {
        const rooms = ['dashboard'];
        if (user.role === 'admin' || user.role === 'super_admin') {
            rooms.push('admin_dashboard', 'system_alerts');
        }
        if (user.permissions.includes('analytics:read')) {
            rooms.push('analytics_updates');
        }
        if (user.permissions.includes('users:manage')) {
            rooms.push('user_activity');
        }
        for (const room of rooms) {
            socket.join(room);
        }
        logger_1.logger.debug('Client joined rooms', {
            userId: user.id,
            rooms,
            socketId: socket.id,
        });
    }
    async sendInitialDashboardData(socket, user) {
        try {
            const dashboardData = await this.getDashboardData(user);
            socket.emit('dashboard_data', {
                type: 'initial_load',
                data: dashboardData,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Error sending initial dashboard data:', error);
            socket.emit('error', { message: 'Failed to load dashboard data' });
        }
    }
    async broadcastAnalyticsUpdate(update) {
        if (!this.io)
            return;
        try {
            let room = 'analytics_updates';
            if (update.type === 'system_health') {
                room = 'admin_dashboard';
            }
            this.io.to(room).emit('analytics_update', {
                ...update,
                serverTimestamp: new Date().toISOString(),
            });
            await this.storeRecentUpdate(update);
            logger_1.logger.debug('Analytics update broadcasted', {
                type: update.type,
                room,
                connectedClients: this.connectedClients.size,
            });
        }
        catch (error) {
            logger_1.logger.error('Error broadcasting analytics update:', error);
        }
    }
    async sendUserActivityUpdate(userId, activity) {
        if (!this.io)
            return;
        try {
            this.io.to('user_activity').emit('user_activity', {
                ...activity,
                serverTimestamp: new Date().toISOString(),
            });
            await this.updateActiveUserMetrics();
        }
        catch (error) {
            logger_1.logger.error('Error sending user activity update:', error);
        }
    }
    async broadcastSystemAlert(alert) {
        if (!this.io)
            return;
        try {
            this.io.to('system_alerts').emit('system_alert', {
                ...alert,
                serverTimestamp: new Date().toISOString(),
            });
            if (alert.level === 'critical' || alert.level === 'error') {
                await this.storeSystemAlert(alert);
            }
            logger_1.logger.info('System alert broadcasted', {
                level: alert.level,
                source: alert.source,
                message: alert.message,
            });
        }
        catch (error) {
            logger_1.logger.error('Error broadcasting system alert:', error);
        }
    }
    startMetricsBroadcasting() {
        this.metricsUpdateInterval = setInterval(async () => {
            try {
                const metrics = await this.getCurrentMetrics();
                await this.broadcastAnalyticsUpdate({
                    type: 'system_health',
                    data: metrics,
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                logger_1.logger.error('Error in metrics broadcasting:', error);
            }
        }, this.METRICS_UPDATE_INTERVAL);
        logger_1.logger.info('Metrics broadcasting started', {
            interval: this.METRICS_UPDATE_INTERVAL,
        });
    }
    async getCurrentMetrics() {
        try {
            const [activeUsers, goalCompletions, systemHealth, revenue] = await Promise.all([
                this.getActiveUsersCount(),
                this.getTodayGoalCompletions(),
                this.getSystemHealth(),
                this.getRevenueMetrics(),
            ]);
            return {
                activeUsers,
                goalCompletions,
                systemHealth,
                revenue,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting current metrics:', error);
            throw error;
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
            const responseTimeResult = await redis_1.redis.get('metrics:avg_response_time');
            const responseTime = responseTimeResult ? parseFloat(responseTimeResult) : 0;
            const errorRateResult = await redis_1.redis.get('metrics:error_rate_1h');
            const errorRate = errorRateResult ? parseFloat(errorRateResult) : 0;
            const uptime = process.uptime();
            const status = errorRate > 0.05 ? 'degraded' : 'healthy';
            return {
                status,
                responseTime,
                uptime,
                errorRate,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting system health:', error);
            return {
                status: 'down',
                responseTime: 0,
                uptime: 0,
                errorRate: 1,
            };
        }
    }
    async getRevenueMetrics() {
        try {
            const [todayResult, monthResult] = await Promise.all([
                database_1.db.query(`
          SELECT COALESCE(SUM(amount), 0) as total
          FROM payments
          WHERE DATE(created_at) = CURRENT_DATE
          AND status = 'completed'
        `),
                database_1.db.query(`
          SELECT COALESCE(SUM(amount), 0) as total
          FROM payments
          WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
          AND status = 'completed'
        `)
            ]);
            const today = parseFloat(todayResult.rows[0]?.total || '0');
            const thisMonth = parseFloat(monthResult.rows[0]?.total || '0');
            const growth = thisMonth > 0 ? ((today * 30) / thisMonth - 1) * 100 : 0;
            return {
                today,
                thisMonth,
                growth,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting revenue metrics:', error);
            return {
                today: 0,
                thisMonth: 0,
                growth: 0,
            };
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
    async getDashboardData(user) {
        const data = {};
        if (user.permissions.includes('analytics:read') || user.permissions.includes('*')) {
            data.metrics = await this.getCurrentMetrics();
        }
        if (user.permissions.includes('users:manage') || user.permissions.includes('*')) {
            data.recentActivity = await this.getRecentUserActivity();
        }
        return data;
    }
    async getRecentUserActivity() {
        try {
            const result = await database_1.db.query(`
        SELECT u.name, u.email, s.last_activity, s.action
        FROM user_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.last_activity > NOW() - INTERVAL '1 hour'
        ORDER BY s.last_activity DESC
        LIMIT 50
      `);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('Error getting recent user activity:', error);
            return [];
        }
    }
    updateClientActivity(socketId) {
        const client = this.connectedClients.get(socketId);
        if (client) {
            client.lastActivity = new Date();
        }
    }
    async handleUserActivity(socket, data) {
        this.updateClientActivity(socket.id);
        logger_1.logger.debug('User activity received', {
            userId: socket.user.id,
            activity: data,
        });
    }
    async handleSubscription(socket, streams) {
        for (const stream of streams) {
            if (this.isValidStream(stream)) {
                socket.join(stream);
            }
        }
    }
    async handleFilterChange(socket, data) {
        logger_1.logger.debug('Filter change received', {
            userId: socket.user.id,
            filters: data,
        });
    }
    isValidStream(stream) {
        const validStreams = [
            'analytics_updates',
            'user_activity',
            'system_alerts',
            'admin_dashboard',
        ];
        return validStreams.includes(stream);
    }
    async storeRecentUpdate(update) {
        try {
            const key = `recent_updates:${update.type}`;
            await redis_1.redis.lpush(key, JSON.stringify(update));
            await redis_1.redis.ltrim(key, 0, 99);
            await redis_1.redis.expire(key, 3600);
        }
        catch (error) {
            logger_1.logger.error('Error storing recent update:', error);
        }
    }
    async updateActiveUserMetrics() {
        try {
            const count = await this.getActiveUsersCount();
            await redis_1.redis.set('metrics:active_users', count, 'EX', 300);
        }
        catch (error) {
            logger_1.logger.error('Error updating active user metrics:', error);
        }
    }
    async storeSystemAlert(alert) {
        try {
            await database_1.db.query(`
        INSERT INTO system_alerts (id, level, message, source, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [alert.id, alert.level, alert.message, alert.source, JSON.stringify(alert.metadata)]);
        }
        catch (error) {
            logger_1.logger.error('Error storing system alert:', error);
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
    async shutdown() {
        try {
            if (this.metricsUpdateInterval) {
                clearInterval(this.metricsUpdateInterval);
            }
            if (this.io) {
                this.io.close();
            }
            this.connectedClients.clear();
            logger_1.logger.info('Dashboard WebSocket service shut down successfully');
        }
        catch (error) {
            logger_1.logger.error('Error shutting down Dashboard WebSocket service:', error);
        }
    }
    getStats() {
        return {
            connectedClients: this.connectedClients.size,
            clientsByRole: this.getClientsByRole(),
            uptime: this.metricsUpdateInterval ? 'active' : 'inactive',
            lastBroadcast: new Date().toISOString(),
        };
    }
    getClientsByRole() {
        const roles = {};
        for (const client of this.connectedClients.values()) {
            roles[client.userRole] = (roles[client.userRole] || 0) + 1;
        }
        return roles;
    }
}
exports.DashboardWebSocketService = DashboardWebSocketService;
exports.dashboardWebSocketService = DashboardWebSocketService.getInstance();
//# sourceMappingURL=DashboardWebSocketService.js.map