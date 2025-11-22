import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server as HttpServer } from 'http';
import { logger } from '../../utils/logger';
import { redis } from '../redis';
import { db } from '../database';
import { ApiError } from '../../utils/apiError';
import { verifyJWT } from '../../middleware/auth';
import { config } from '../../config/environment';

interface AnalyticsUpdate {
  type: 'user_activity' | 'goal_completion' | 'system_health' | 'revenue_update';
  data: unknown;
  timestamp: string;
  metadata?: unknown;
}

interface UserActivity {
  userId: string;
  action: string;
  details: unknown;
  timestamp: string;
}

interface SystemAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: string;
  timestamp: string;
  metadata?: unknown;
}

interface DashboardMetrics {
  activeUsers: number;
  goalCompletions: number;
  systemHealth: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    uptime: number;
    errorRate: number;
  };
  revenue: {
    today: number;
    thisMonth: number;
    growth: number;
  };
}

interface ConnectedClient {
  userId: string;
  userRole: string;
  connectionTime: Date;
  lastActivity: Date;
  permissions: string[];
  socketId: string;
}

export class DashboardWebSocketService {
  private static instance: DashboardWebSocketService;
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, ConnectedClient> = new Map();
  private metricsUpdateInterval: NodeJS.Timeout | null = null;
  private readonly METRICS_UPDATE_INTERVAL = 5000; // 5 seconds
  private readonly MAX_CONNECTIONS_PER_USER = 3;

  constructor() {
    // Initialize Redis adapter for clustering support
    this.setupRedisAdapter();
  }

  static getInstance(): DashboardWebSocketService {
    if (!DashboardWebSocketService.instance) {
      DashboardWebSocketService.instance = new DashboardWebSocketService();
    }
    return DashboardWebSocketService.instance;
  }

  /**
   * Initialize WebSocket server with security and performance optimizations
   */
  async initialize(httpServer: HttpServer): Promise<void> {
    try {
      this.io = new SocketIOServer(httpServer, {
        cors: {
          origin: config.corsOrigins,
          methods: ['GET', 'POST'],
          credentials: true,
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
        maxHttpBufferSize: 1e6, // 1MB
        allowEIO3: true,
        connectTimeout: 45000,
        // Enhanced security
        serveClient: false,
        allowRequest: this.authenticateConnection.bind(this),
      });

      // Set up Redis adapter for horizontal scaling
      await this.setupRedisAdapter();

      // Set up authentication middleware
      this.io.use(this.authenticationMiddleware.bind(this));

      // Set up connection handlers
      this.setupConnectionHandlers();

      // Start metrics broadcasting
      this.startMetricsBroadcasting();

      logger.info('Dashboard WebSocket service initialized successfully', {
        transports: ['websocket', 'polling'],
        corsOrigins: config.corsOrigins,
      });

    } catch (error) {
      logger.error('Failed to initialize Dashboard WebSocket service:', error);
      throw new ApiError(500, 'Failed to initialize real-time service');
    }
  }

  /**
   * Set up Redis adapter for clustering and persistence
   */
  private async setupRedisAdapter(): Promise<void> {
    if (!this.io) return;

    try {
      const pubClient = redis.duplicate();
      const subClient = redis.duplicate();

      this.io.adapter(createAdapter(pubClient, subClient));

      logger.info('Redis adapter configured for WebSocket clustering');
    } catch (error) {
      logger.warn('Failed to set up Redis adapter, using memory adapter:', error);
    }
  }

  /**
   * Pre-connection authentication
   */
  private async authenticateConnection(req: unknown, callback: Function): Promise<void> {
    try {
      const token = req.handshake?.auth?.token || req.handshake?.query?.token;

      if (!token) {
        callback('Authentication token required', false);
        return;
      }

      // Verify JWT token
      const decoded = verifyJWT(token);
      if (!decoded) {
        callback('Invalid authentication token', false);
        return;
      }

      // Check user permissions for dashboard access
      const hasPermission = await this.checkDashboardPermissions(decoded.userId, decoded.role);
      if (!hasPermission) {
        callback('Insufficient permissions for dashboard access', false);
        return;
      }

      // Rate limiting: Check connection count per user
      const userConnections = Array.from(this.connectedClients.values())
        .filter(client => client.userId === decoded.userId);

      if (userConnections.length >= this.MAX_CONNECTIONS_PER_USER) {
        callback('Maximum connections exceeded for user', false);
        return;
      }

      // Attach user info to request
      req.user = decoded;
      callback(null, true);

    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      callback('Authentication failed', false);
    }
  }

  /**
   * Socket.IO authentication middleware
   */
  private async authenticationMiddleware(socket: unknown, next: Function): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyJWT(token);
      if (!decoded) {
        return next(new Error('Invalid authentication token'));
      }

      // Verify user exists and is active
      const user = await this.getUserDetails(decoded.userId);
      if (!user || user.status !== 'active') {
        return next(new Error('User not found or inactive'));
      }

      // Attach user info to socket
      socket.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        permissions: await this.getUserPermissions(decoded.userId, decoded.role),
      };

      next();
    } catch (error) {
      logger.error('Socket authentication middleware error:', error);
      next(new Error('Authentication failed'));
    }
  }

  /**
   * Set up connection event handlers
   */
  private setupConnectionHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new client connections
   */
  private async handleConnection(socket: unknown): Promise<void> {
    try {
      const user = socket.user;
      const clientInfo: ConnectedClient = {
        userId: user.id,
        userRole: user.role,
        connectionTime: new Date(),
        lastActivity: new Date(),
        permissions: user.permissions,
        socketId: socket.id,
      };

      this.connectedClients.set(socket.id, clientInfo);

      // Join appropriate rooms based on permissions
      await this.joinRooms(socket, user);

      // Send initial dashboard data
      await this.sendInitialDashboardData(socket, user);

      // Set up event handlers
      this.setupSocketEventHandlers(socket);

      // Log connection
      await this.logConnectionEvent(user.id, 'connected', {
        socketId: socket.id,
        userAgent: socket.handshake.headers['user-agent'],
        ip: socket.handshake.address,
      });

      logger.info('Dashboard client connected', {
        userId: user.id,
        role: user.role,
        socketId: socket.id,
        totalConnections: this.connectedClients.size,
      });

    } catch (error) {
      logger.error('Error handling WebSocket connection:', error);
      socket.disconnect();
    }
  }

  /**
   * Set up event handlers for individual sockets
   */
  private setupSocketEventHandlers(socket: unknown): void {
    // Handle disconnection
    socket.on('disconnect', (reason: string) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle activity updates
    socket.on('activity', (data: unknown) => {
      this.handleUserActivity(socket, data);
    });

    // Handle subscription to specific data streams
    socket.on('subscribe', (data: { streams: string[] }) => {
      this.handleSubscription(socket, data.streams);
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
      this.updateClientActivity(socket.id);
    });

    // Handle dashboard filter changes
    socket.on('filter_change', (data: unknown) => {
      this.handleFilterChange(socket, data);
    });
  }

  /**
   * Handle client disconnection
   */
  private async handleDisconnection(socket: unknown, reason: string): Promise<void> {
    try {
      const client = this.connectedClients.get(socket.id);
      if (client) {
        // Log disconnection
        await this.logConnectionEvent(client.userId, 'disconnected', {
          reason,
          duration: Date.now() - client.connectionTime.getTime(),
        });

        this.connectedClients.delete(socket.id);

        logger.info('Dashboard client disconnected', {
          userId: client.userId,
          socketId: socket.id,
          reason,
          duration: `${Date.now() - client.connectionTime.getTime()}ms`,
          remainingConnections: this.connectedClients.size,
        });
      }
    } catch (error) {
      logger.error('Error handling WebSocket disconnection:', error);
    }
  }

  /**
   * Join appropriate rooms based on user permissions
   */
  private async joinRooms(socket: unknown, user: unknown): Promise<void> {
    const rooms = ['dashboard']; // Base dashboard room

    // Add role-specific rooms
    if (user.role === 'admin' || user.role === 'super_admin') {
      rooms.push('admin_dashboard', 'system_alerts');
    }

    if (user.permissions.includes('analytics:read')) {
      rooms.push('analytics_updates');
    }

    if (user.permissions.includes('users:manage')) {
      rooms.push('user_activity');
    }

    // Join all rooms
    for (const room of rooms) {
      socket.join(room);
    }

    logger.debug('Client joined rooms', {
      userId: user.id,
      rooms,
      socketId: socket.id,
    });
  }

  /**
   * Send initial dashboard data to newly connected client
   */
  private async sendInitialDashboardData(socket: unknown, user: unknown): Promise<void> {
    try {
      const dashboardData = await this.getDashboardData(user);
      socket.emit('dashboard_data', {
        type: 'initial_load',
        data: dashboardData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error sending initial dashboard data:', error);
      socket.emit('error', { message: 'Failed to load dashboard data' });
    }
  }

  /**
   * Broadcast analytics update to relevant clients
   */
  async broadcastAnalyticsUpdate(update: AnalyticsUpdate): Promise<void> {
    if (!this.io) return;

    try {
      // Determine which room to broadcast to
      let room = 'analytics_updates';

      if (update.type === 'system_health') {
        room = 'admin_dashboard';
      }

      this.io.to(room).emit('analytics_update', {
        ...update,
        serverTimestamp: new Date().toISOString(),
      });

      // Store update in Redis for late-joining clients
      await this.storeRecentUpdate(update);

      logger.debug('Analytics update broadcasted', {
        type: update.type,
        room,
        connectedClients: this.connectedClients.size,
      });

    } catch (error) {
      logger.error('Error broadcasting analytics update:', error);
    }
  }

  /**
   * Send user activity update to dashboard
   */
  async sendUserActivityUpdate(userId: string, activity: UserActivity): Promise<void> {
    if (!this.io) return;

    try {
      this.io.to('user_activity').emit('user_activity', {
        ...activity,
        serverTimestamp: new Date().toISOString(),
      });

      // Update real-time metrics
      await this.updateActiveUserMetrics();

    } catch (error) {
      logger.error('Error sending user activity update:', error);
    }
  }

  /**
   * Broadcast system alert to administrators
   */
  async broadcastSystemAlert(alert: SystemAlert): Promise<void> {
    if (!this.io) return;

    try {
      this.io.to('system_alerts').emit('system_alert', {
        ...alert,
        serverTimestamp: new Date().toISOString(),
      });

      // Store critical alerts in database
      if (alert.level === 'critical' || alert.level === 'error') {
        await this.storeSystemAlert(alert);
      }

      logger.info('System alert broadcasted', {
        level: alert.level,
        source: alert.source,
        message: alert.message,
      });

    } catch (error) {
      logger.error('Error broadcasting system alert:', error);
    }
  }

  /**
   * Start periodic metrics broadcasting
   */
  private startMetricsBroadcasting(): void {
    this.metricsUpdateInterval = setInterval(async () => {
      try {
        const metrics = await this.getCurrentMetrics();
        await this.broadcastAnalyticsUpdate({
          type: 'system_health',
          data: metrics,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Error in metrics broadcasting:', error);
      }
    }, this.METRICS_UPDATE_INTERVAL);

    logger.info('Metrics broadcasting started', {
      interval: this.METRICS_UPDATE_INTERVAL,
    });
  }

  /**
   * Get current dashboard metrics
   */
  private async getCurrentMetrics(): Promise<DashboardMetrics> {
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
    } catch (error) {
      logger.error('Error getting current metrics:', error);
      throw error;
    }
  }

  /**
   * Helper methods for metrics gathering
   */
  private async getActiveUsersCount(): Promise<number> {
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

  private async getTodayGoalCompletions(): Promise<number> {
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

  private async getSystemHealth(): Promise<DashboardMetrics['systemHealth']> {
    try {
      // Get average response time from recent requests
      const responseTimeResult = await redis.get('metrics:avg_response_time');
      const responseTime = responseTimeResult ? parseFloat(responseTimeResult) : 0;

      // Get error rate from last hour
      const errorRateResult = await redis.get('metrics:error_rate_1h');
      const errorRate = errorRateResult ? parseFloat(errorRateResult) : 0;

      const uptime = process.uptime();
      const status = errorRate > 0.05 ? 'degraded' : 'healthy';

      return {
        status,
        responseTime,
        uptime,
        errorRate,
      };
    } catch (error) {
      logger.error('Error getting system health:', error);
      return {
        status: 'down',
        responseTime: 0,
        uptime: 0,
        errorRate: 1,
      };
    }
  }

  private async getRevenueMetrics(): Promise<DashboardMetrics['revenue']> {
    try {
      const [todayResult, monthResult] = await Promise.all([
        db.query(`
          SELECT COALESCE(SUM(amount), 0) as total
          FROM payments
          WHERE DATE(created_at) = CURRENT_DATE
          AND status = 'completed'
        `),
        db.query(`
          SELECT COALESCE(SUM(amount), 0) as total
          FROM payments
          WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
          AND status = 'completed'
        `)
      ]);

      const today = parseFloat(todayResult.rows[0]?.total || '0');
      const thisMonth = parseFloat(monthResult.rows[0]?.total || '0');

      // Calculate growth (simplified - could be more sophisticated)
      const growth = thisMonth > 0 ? ((today * 30) / thisMonth - 1) * 100 : 0;

      return {
        today,
        thisMonth,
        growth,
      };
    } catch (error) {
      logger.error('Error getting revenue metrics:', error);
      return {
        today: 0,
        thisMonth: 0,
        growth: 0,
      };
    }
  }

  /**
   * Utility methods
   */
  private async checkDashboardPermissions(userId: string, role: string): Promise<boolean> {
    const allowedRoles = ['admin', 'super_admin', 'manager'];
    return allowedRoles.includes(role);
  }

  private async getUserDetails(userId: string): Promise<unknown> {
    try {
      const result = await db.query(
        'SELECT id, email, role, status FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting user details:', error);
      return null;
    }
  }

  private async getUserPermissions(userId: string, role: string): Promise<string[]> {
    // Simplified permission system - could be more complex
    const rolePermissions: Record<string, string[]> = {
      super_admin: ['*'],
      admin: ['analytics:read', 'users:manage', 'system:monitor'],
      manager: ['analytics:read', 'users:read'],
    };

    return rolePermissions[role] || [];
  }

  private async getDashboardData(user: unknown): Promise<unknown> {
    // Return dashboard data based on user permissions
    const data: unknown = {};

    if (user.permissions.includes('analytics:read') || user.permissions.includes('*')) {
      data.metrics = await this.getCurrentMetrics();
    }

    if (user.permissions.includes('users:manage') || user.permissions.includes('*')) {
      data.recentActivity = await this.getRecentUserActivity();
    }

    return data;
  }

  private async getRecentUserActivity(): Promise<any[]> {
    try {
      const result = await db.query(`
        SELECT u.name, u.email, s.last_activity, s.action
        FROM user_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.last_activity > NOW() - INTERVAL '1 hour'
        ORDER BY s.last_activity DESC
        LIMIT 50
      `);
      return result.rows;
    } catch (error) {
      logger.error('Error getting recent user activity:', error);
      return [];
    }
  }

  private updateClientActivity(socketId: string): void {
    const client = this.connectedClients.get(socketId);
    if (client) {
      client.lastActivity = new Date();
    }
  }

  private async handleUserActivity(socket: unknown, data: unknown): Promise<void> {
    this.updateClientActivity(socket.id);
    // Process user activity data
    logger.debug('User activity received', {
      userId: socket.user.id,
      activity: data,
    });
  }

  private async handleSubscription(socket: unknown, streams: string[]): Promise<void> {
    // Handle subscription to specific data streams
    for (const stream of streams) {
      if (this.isValidStream(stream)) {
        socket.join(stream);
      }
    }
  }

  private async handleFilterChange(socket: unknown, data: unknown): Promise<void> {
    // Handle dashboard filter changes
    logger.debug('Filter change received', {
      userId: socket.user.id,
      filters: data,
    });
  }

  private isValidStream(stream: string): boolean {
    const validStreams = [
      'analytics_updates',
      'user_activity',
      'system_alerts',
      'admin_dashboard',
    ];
    return validStreams.includes(stream);
  }

  private async storeRecentUpdate(update: AnalyticsUpdate): Promise<void> {
    try {
      const key = `recent_updates:${update.type}`;
      await redis.lpush(key, JSON.stringify(update));
      await redis.ltrim(key, 0, 99); // Keep last 100 updates
      await redis.expire(key, 3600); // 1 hour TTL
    } catch (error) {
      logger.error('Error storing recent update:', error);
    }
  }

  private async updateActiveUserMetrics(): Promise<void> {
    try {
      const count = await this.getActiveUsersCount();
      await redis.set('metrics:active_users', count, 'EX', 300); // 5 minute TTL
    } catch (error) {
      logger.error('Error updating active user metrics:', error);
    }
  }

  private async storeSystemAlert(alert: SystemAlert): Promise<void> {
    try {
      await db.query(`
        INSERT INTO system_alerts (id, level, message, source, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [alert.id, alert.level, alert.message, alert.source, JSON.stringify(alert.metadata)]);
    } catch (error) {
      logger.error('Error storing system alert:', error);
    }
  }

  private async logConnectionEvent(userId: string, event: string, metadata: unknown): Promise<void> {
    try {
      await db.query(`
        INSERT INTO websocket_events (user_id, event_type, metadata, created_at)
        VALUES ($1, $2, $3, NOW())
      `, [userId, event, JSON.stringify(metadata)]);
    } catch (error) {
      logger.error('Error logging connection event:', error);
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    try {
      if (this.metricsUpdateInterval) {
        clearInterval(this.metricsUpdateInterval);
      }

      if (this.io) {
        this.io.close();
      }

      this.connectedClients.clear();

      logger.info('Dashboard WebSocket service shut down successfully');
    } catch (error) {
      logger.error('Error shutting down Dashboard WebSocket service:', error);
    }
  }

  /**
   * Get service statistics
   */
  getStats(): unknown {
    return {
      connectedClients: this.connectedClients.size,
      clientsByRole: this.getClientsByRole(),
      uptime: this.metricsUpdateInterval ? 'active' : 'inactive',
      lastBroadcast: new Date().toISOString(),
    };
  }

  private getClientsByRole(): Record<string, number> {
    const roles: Record<string, number> = {};
    for (const client of this.connectedClients.values()) {
      roles[client.userRole] = (roles[client.userRole] || 0) + 1;
    }
    return roles;
  }
}

// Export singleton instance
export const dashboardWebSocketService = DashboardWebSocketService.getInstance();