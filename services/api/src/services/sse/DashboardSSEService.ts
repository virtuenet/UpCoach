import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { redis } from '../redis';
import { db } from '../database';
import { ApiError } from '../../utils/apiError';
import { verifyJWT } from '../../middleware/auth';

interface SSEClient {
  id: string;
  userId: string;
  userRole: string;
  response: Response;
  permissions: string[];
  lastPing: Date;
  filters: Record<string, any>;
  connectionTime: Date;
}

interface SSEMessage {
  id?: string;
  event?: string;
  data: unknown;
  retry?: number;
}

export class DashboardSSEService {
  private static instance: DashboardSSEService;
  private clients: Map<string, SSEClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly METRICS_INTERVAL = 5000; // 5 seconds
  private readonly CLIENT_TIMEOUT = 60000; // 60 seconds
  private readonly MAX_CLIENTS_PER_USER = 3;

  private constructor() {
    this.startHeartbeat();
    this.startMetricsBroadcast();
  }

  static getInstance(): DashboardSSEService {
    if (!DashboardSSEService.instance) {
      DashboardSSEService.instance = new DashboardSSEService();
    }
    return DashboardSSEService.instance;
  }

  /**
   * Handle new SSE connection
   */
  async handleConnection(req: Request, res: Response): Promise<void> {
    try {
      // Authenticate the request
      const authResult = await this.authenticateRequest(req);
      if (!authResult.success) {
        res.status(401).json({ error: authResult.error });
        return;
      }

      const { user } = authResult;

      // Check connection limits
      const userConnections = Array.from(this.clients.values())
        .filter(client => client.userId === user.id);

      if (userConnections.length >= this.MAX_CLIENTS_PER_USER) {
        res.status(429).json({ error: 'Maximum connections exceeded' });
        return;
      }

      // Set up SSE headers with secure CORS
      const allowedOrigins = [
        'http://localhost:1006', // Admin panel dev
        'http://localhost:1007', // CMS panel dev
        'http://localhost:1005', // Landing page dev
        'https://admin.upcoach.ai', // Production admin
        'https://cms.upcoach.ai', // Production CMS
        'https://upcoach.ai', // Production landing
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
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      });

      // Generate unique client ID
      const clientId = this.generateClientId();

      // Create client object
      const client: SSEClient = {
        id: clientId,
        userId: user.id,
        userRole: user.role,
        response: res,
        permissions: await this.getUserPermissions(user.id, user.role),
        lastPing: new Date(),
        filters: this.parseFilters(req.query.filters as string),
        connectionTime: new Date(),
      };

      // Store client
      this.clients.set(clientId, client);

      // Send initial connection message
      this.sendToClient(client, {
        event: 'connected',
        data: {
          clientId,
          serverTime: new Date().toISOString(),
          permissions: client.permissions,
        },
      });

      // Send initial dashboard data
      await this.sendInitialData(client);

      // Handle client disconnect
      req.on('close', () => {
        this.handleDisconnection(clientId, 'client_disconnect');
      });

      req.on('aborted', () => {
        this.handleDisconnection(clientId, 'client_aborted');
      });

      // Log connection
      await this.logConnectionEvent(user.id, 'sse_connected', {
        clientId,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });

      logger.info('SSE client connected', {
        clientId,
        userId: user.id,
        role: user.role,
        totalClients: this.clients.size,
      });

    } catch (error) {
      logger.error('Error handling SSE connection:', error);
      res.status(500).json({ error: 'Connection failed' });
    }
  }

  /**
   * Authenticate SSE request
   */
  private async authenticateRequest(req: Request): Promise<{
    success: boolean;
    user?: unknown;
    error?: string;
  }> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') ||
                   req.query.token as string;

      if (!token) {
        return { success: false, error: 'Authentication token required' };
      }

      const decoded = verifyJWT(token);
      if (!decoded) {
        return { success: false, error: 'Invalid authentication token' };
      }

      // Check dashboard permissions
      const hasPermission = await this.checkDashboardPermissions(decoded.userId, decoded.role);
      if (!hasPermission) {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Get user details
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

    } catch (error) {
      logger.error('SSE authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(client: SSEClient, message: SSEMessage): boolean {
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

      // Handle multi-line data
      data.split('\n').forEach(line => {
        output += `data: ${line}\n`;
      });

      output += '\n';

      return client.response.write(output);
    } catch (error) {
      logger.error('Error sending message to SSE client:', error);
      this.handleDisconnection(client.id, 'send_error');
      return false;
    }
  }

  /**
   * Broadcast message to all clients in a specific role/permission group
   */
  async broadcastToRole(message: SSEMessage, requiredRole?: string, requiredPermission?: string): Promise<void> {
    const clients = Array.from(this.clients.values()).filter(client => {
      if (requiredRole && client.userRole !== requiredRole) {
        return false;
      }

      if (requiredPermission && !client.permissions.includes(requiredPermission) && !client.permissions.includes('*')) {
        return false;
      }

      return true;
    });

    const failures: string[] = [];

    for (const client of clients) {
      const success = this.sendToClient(client, message);
      if (!success) {
        failures.push(client.id);
      }
    }

    // Clean up failed clients
    for (const clientId of failures) {
      this.handleDisconnection(clientId, 'broadcast_failure');
    }

    logger.debug('SSE broadcast completed', {
      targetClients: clients.length,
      failures: failures.length,
      event: message.event,
    });
  }

  /**
   * Send dashboard analytics update
   */
  async broadcastAnalyticsUpdate(data: unknown): Promise<void> {
    await this.broadcastToRole({
      event: 'analytics_update',
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
    }, undefined, 'analytics:read');
  }

  /**
   * Send user activity update
   */
  async broadcastUserActivity(data: unknown): Promise<void> {
    await this.broadcastToRole({
      event: 'user_activity',
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
    }, undefined, 'users:manage');
  }

  /**
   * Send system alert
   */
  async broadcastSystemAlert(alert: unknown): Promise<void> {
    await this.broadcastToRole({
      event: 'system_alert',
      data: {
        ...alert,
        timestamp: new Date().toISOString(),
      },
    }, 'admin');
  }

  /**
   * Send initial dashboard data to new client
   */
  private async sendInitialData(client: SSEClient): Promise<void> {
    try {
      const dashboardData = await this.getDashboardData(client);

      this.sendToClient(client, {
        event: 'initial_data',
        data: dashboardData,
      });

      // Send recent updates from cache
      await this.sendRecentUpdates(client);

    } catch (error) {
      logger.error('Error sending initial SSE data:', error);
      this.sendToClient(client, {
        event: 'error',
        data: { message: 'Failed to load initial data' },
      });
    }
  }

  /**
   * Send recent updates from Redis cache
   */
  private async sendRecentUpdates(client: SSEClient): Promise<void> {
    try {
      if (client.permissions.includes('analytics:read') || client.permissions.includes('*')) {
        const recentAnalytics = await redis.lrange('recent_updates:analytics', 0, 9);
        for (const update of recentAnalytics) {
          this.sendToClient(client, {
            event: 'recent_update',
            data: JSON.parse(update),
          });
        }
      }

      if (client.permissions.includes('users:manage') || client.permissions.includes('*')) {
        const recentActivity = await redis.lrange('recent_updates:user_activity', 0, 9);
        for (const activity of recentActivity) {
          this.sendToClient(client, {
            event: 'recent_activity',
            data: JSON.parse(activity),
          });
        }
      }
    } catch (error) {
      logger.error('Error sending recent updates:', error);
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(clientId: string, reason: string): void {
    try {
      const client = this.clients.get(clientId);
      if (client) {
        // Log disconnection
        this.logConnectionEvent(client.userId, 'sse_disconnected', {
          clientId,
          reason,
          duration: Date.now() - client.connectionTime.getTime(),
        });

        // Close response if still open
        if (!client.response.headersSent) {
          client.response.end();
        }

        this.clients.delete(clientId);

        logger.info('SSE client disconnected', {
          clientId,
          userId: client.userId,
          reason,
          duration: `${Date.now() - client.connectionTime.getTime()}ms`,
          remainingClients: this.clients.size,
        });
      }
    } catch (error) {
      logger.error('Error handling SSE disconnection:', error);
    }
  }

  /**
   * Start heartbeat to detect dead connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const timeoutClients: string[] = [];

      for (const [clientId, client] of this.clients.entries()) {
        // Send ping
        const pingSuccess = this.sendToClient(client, {
          event: 'ping',
          data: { timestamp: now.toISOString() },
        });

        if (!pingSuccess) {
          timeoutClients.push(clientId);
          continue;
        }

        // Check for timeout
        const timeSinceLastPing = now.getTime() - client.lastPing.getTime();
        if (timeSinceLastPing > this.CLIENT_TIMEOUT) {
          timeoutClients.push(clientId);
        }
      }

      // Clean up timed out clients
      for (const clientId of timeoutClients) {
        this.handleDisconnection(clientId, 'timeout');
      }

      if (timeoutClients.length > 0) {
        logger.debug('Cleaned up timed out SSE clients', {
          count: timeoutClients.length,
          remaining: this.clients.size,
        });
      }

    }, this.HEARTBEAT_INTERVAL);

    logger.info('SSE heartbeat started', {
      interval: this.HEARTBEAT_INTERVAL,
    });
  }

  /**
   * Start periodic metrics broadcast
   */
  private startMetricsBroadcast(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.getCurrentMetrics();
        await this.broadcastAnalyticsUpdate({
          type: 'metrics_update',
          data: metrics,
        });
      } catch (error) {
        logger.error('Error in SSE metrics broadcast:', error);
      }
    }, this.METRICS_INTERVAL);

    logger.info('SSE metrics broadcast started', {
      interval: this.METRICS_INTERVAL,
    });
  }

  /**
   * Handle client pong response
   */
  handlePong(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastPing = new Date();
    }
  }

  /**
   * Update client filters
   */
  updateClientFilters(clientId: string, filters: Record<string, any>): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.filters = { ...client.filters, ...filters };
      logger.debug('Updated SSE client filters', {
        clientId,
        filters: client.filters,
      });
    }
  }

  /**
   * Utility methods
   */
  private generateClientId(): string {
    return `sse_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private parseFilters(filtersString?: string): Record<string, any> {
    if (!filtersString) return {};

    try {
      return JSON.parse(filtersString);
    } catch {
      return {};
    }
  }

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
    const rolePermissions: Record<string, string[]> = {
      super_admin: ['*'],
      admin: ['analytics:read', 'users:manage', 'system:monitor'],
      manager: ['analytics:read', 'users:read'],
    };

    return rolePermissions[role] || [];
  }

  private async getDashboardData(client: SSEClient): Promise<unknown> {
    const data: unknown = {};

    if (client.permissions.includes('analytics:read') || client.permissions.includes('*')) {
      data.metrics = await this.getCurrentMetrics();
    }

    if (client.permissions.includes('users:manage') || client.permissions.includes('*')) {
      data.recentActivity = await this.getRecentUserActivity();
    }

    return data;
  }

  private async getCurrentMetrics(): Promise<unknown> {
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
    } catch (error) {
      logger.error('Error getting current metrics:', error);
      return {
        activeUsers: 0,
        goalCompletions: 0,
        systemHealth: { status: 'unknown' },
        timestamp: new Date().toISOString(),
      };
    }
  }

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

  private async getSystemHealth(): Promise<unknown> {
    try {
      const responseTime = await redis.get('metrics:avg_response_time');
      const errorRate = await redis.get('metrics:error_rate_1h');

      return {
        status: parseFloat(errorRate || '0') > 0.05 ? 'degraded' : 'healthy',
        responseTime: parseFloat(responseTime || '0'),
        uptime: process.uptime(),
        errorRate: parseFloat(errorRate || '0'),
      };
    } catch (error) {
      logger.error('Error getting system health:', error);
      return {
        status: 'unknown',
        responseTime: 0,
        uptime: 0,
        errorRate: 0,
      };
    }
  }

  private async getRecentUserActivity(): Promise<any[]> {
    try {
      const result = await db.query(`
        SELECT u.name, u.email, s.last_activity, s.action
        FROM user_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.last_activity > NOW() - INTERVAL '1 hour'
        ORDER BY s.last_activity DESC
        LIMIT 20
      `);
      return result.rows;
    } catch (error) {
      logger.error('Error getting recent user activity:', error);
      return [];
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
   * Get service statistics
   */
  getStats(): unknown {
    const clientsByRole: Record<string, number> = {};
    const clientsByPermissions: Record<string, number> = {};

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

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    try {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = null;
      }

      // Close all client connections
      for (const [clientId, client] of this.clients.entries()) {
        this.sendToClient(client, {
          event: 'server_shutdown',
          data: { message: 'Server is shutting down' },
        });
        client.response.end();
      }

      this.clients.clear();

      logger.info('Dashboard SSE service shut down successfully');
    } catch (error) {
      logger.error('Error shutting down Dashboard SSE service:', error);
    }
  }
}

// Export singleton instance
export const dashboardSSEService = DashboardSSEService.getInstance();