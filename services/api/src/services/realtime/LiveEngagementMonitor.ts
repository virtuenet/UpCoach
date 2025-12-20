/**
 * Live Engagement Monitor
 * Real-time dashboard for admin/coaches to monitor user activity
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { redis } from '../redis';
import { eventBus, EventCategory } from '../events';

// ==================== Types ====================

export type UserStatus = 'online' | 'idle' | 'in_session' | 'offline';

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export type ActivityType =
  | 'login'
  | 'logout'
  | 'session_start'
  | 'session_end'
  | 'goal_update'
  | 'message_sent'
  | 'reflection_completed'
  | 'assessment_completed'
  | 'page_view'
  | 'app_open'
  | 'app_close';

export interface UserActivity {
  id: string;
  userId: string;
  type: ActivityType;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface ActiveUser {
  userId: string;
  userName?: string;
  status: UserStatus;
  lastActivity: Date;
  currentPage?: string;
  sessionId?: string;
  deviceType?: 'mobile' | 'web' | 'desktop';
  location?: {
    country?: string;
    city?: string;
  };
  engagementScore?: number;
}

export interface LiveSession {
  sessionId: string;
  coachId: string;
  clientId: string;
  coachName?: string;
  clientName?: string;
  status: SessionStatus;
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number; // in minutes
  sessionType: string;
}

export interface EngagementMetrics {
  timestamp: Date;
  activeUsers: number;
  activeSessions: number;
  messagesLastHour: number;
  goalsUpdatedToday: number;
  churnRiskAlerts: number;
  newUsersToday: number;
  averageSessionDuration: number;
  peakConcurrentUsers: number;
  currentlyActiveCoaches: number;
}

export interface ChurnRiskAlert {
  id: string;
  userId: string;
  userName?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  reasons: string[];
  detectedAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
}

export interface EngagementSubscriber {
  id: string;
  type: 'metrics' | 'users' | 'sessions' | 'alerts' | 'all';
  callback: (data: unknown) => void;
  filters?: {
    userId?: string;
    coachId?: string;
    sessionType?: string;
  };
  createdAt: Date;
}

export interface LiveEngagementStats {
  subscriberCount: number;
  activeUsersTracked: number;
  activeSessionsTracked: number;
  alertsActive: number;
  metricsUpdatedAt: Date;
}

// ==================== Live Engagement Monitor ====================

export class LiveEngagementMonitor extends EventEmitter {
  private subscribers: Map<string, EngagementSubscriber> = new Map();
  private activeUsers: Map<string, ActiveUser> = new Map();
  private activeSessions: Map<string, LiveSession> = new Map();
  private churnAlerts: Map<string, ChurnRiskAlert> = new Map();
  private currentMetrics: EngagementMetrics;
  private metricsHistory: EngagementMetrics[] = [];
  private isRunning = false;
  private updateInterval: NodeJS.Timeout | null = null;

  private readonly config = {
    redisPrefix: 'upcoach:engagement:',
    userIdleTimeout: 5 * 60 * 1000, // 5 minutes
    userOfflineTimeout: 15 * 60 * 1000, // 15 minutes
    metricsUpdateInterval: 10000, // 10 seconds
    metricsHistoryLimit: 360, // 1 hour of data
    maxActiveUsers: 10000,
    alertRetentionHours: 24,
  };

  constructor() {
    super();
    this.setMaxListeners(100);
    this.currentMetrics = this.createEmptyMetrics();
  }

  /**
   * Start monitoring
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;

    // Load initial data from Redis
    await this.loadFromRedis();

    // Start metrics update loop
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
    }, this.config.metricsUpdateInterval);

    // Subscribe to events
    await this.subscribeToEvents();

    logger.info('LiveEngagementMonitor started');
    this.emit('started');
  }

  /**
   * Stop monitoring
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Save state to Redis
    await this.saveToRedis();

    logger.info('LiveEngagementMonitor stopped');
    this.emit('stopped');
  }

  /**
   * Track user activity
   */
  async trackActivity(activity: Omit<UserActivity, 'id'>): Promise<void> {
    const activityRecord: UserActivity = {
      ...activity,
      id: uuidv4(),
      timestamp: new Date(),
    };

    // Update active user
    await this.updateActiveUser(activity.userId, activity.type, activity.metadata);

    // Persist activity
    await this.persistActivity(activityRecord);

    // Notify subscribers
    this.notifySubscribers('activity', activityRecord);

    // Emit event
    this.emit('activity', activityRecord);

    // Publish to event bus
    await eventBus.publish(
      'engagement.activity',
      'engagement' as EventCategory,
      activityRecord,
      { priority: 'normal' }
    );
  }

  /**
   * Update active user status
   */
  private async updateActiveUser(
    userId: string,
    activityType: ActivityType,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    let user = this.activeUsers.get(userId);

    if (!user) {
      user = {
        userId,
        status: 'online',
        lastActivity: new Date(),
      };
      this.activeUsers.set(userId, user);
    }

    user.lastActivity = new Date();

    // Update status based on activity type
    switch (activityType) {
      case 'login':
      case 'app_open':
        user.status = 'online';
        break;
      case 'logout':
      case 'app_close':
        user.status = 'offline';
        break;
      case 'session_start':
        user.status = 'in_session';
        user.sessionId = metadata?.sessionId as string;
        break;
      case 'session_end':
        user.status = 'online';
        user.sessionId = undefined;
        break;
      case 'page_view':
        user.currentPage = metadata?.page as string;
        break;
    }

    if (metadata?.deviceType) {
      user.deviceType = metadata.deviceType as ActiveUser['deviceType'];
    }

    if (metadata?.userName) {
      user.userName = metadata.userName as string;
    }

    // Persist to Redis
    await redis.hSet(
      `${this.config.redisPrefix}users`,
      userId,
      JSON.stringify(user)
    );
  }

  /**
   * Update session status
   */
  async updateSession(session: LiveSession): Promise<void> {
    this.activeSessions.set(session.sessionId, session);

    // Persist to Redis
    await redis.hSet(
      `${this.config.redisPrefix}sessions`,
      session.sessionId,
      JSON.stringify(session)
    );

    // Notify subscribers
    this.notifySubscribers('sessions', session);

    // Emit event
    this.emit('sessionUpdate', session);
  }

  /**
   * Add churn risk alert
   */
  async addChurnAlert(alert: Omit<ChurnRiskAlert, 'id' | 'detectedAt' | 'acknowledged'>): Promise<string> {
    const alertId = uuidv4();

    const fullAlert: ChurnRiskAlert = {
      ...alert,
      id: alertId,
      detectedAt: new Date(),
      acknowledged: false,
    };

    this.churnAlerts.set(alertId, fullAlert);

    // Persist to Redis
    await redis.hSet(
      `${this.config.redisPrefix}alerts`,
      alertId,
      JSON.stringify(fullAlert)
    );

    // Notify subscribers
    this.notifySubscribers('alerts', fullAlert);

    // Emit event
    this.emit('churnAlert', fullAlert);

    // Publish to event bus
    await eventBus.publish(
      'engagement.churn_alert',
      'engagement' as EventCategory,
      fullAlert,
      { priority: fullAlert.riskLevel === 'critical' ? 'critical' : 'high' }
    );

    logger.info('Churn alert created', { alertId, userId: alert.userId, riskLevel: alert.riskLevel });

    return alertId;
  }

  /**
   * Acknowledge churn alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.churnAlerts.get(alertId);

    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;

    // Update Redis
    await redis.hSet(
      `${this.config.redisPrefix}alerts`,
      alertId,
      JSON.stringify(alert)
    );

    this.notifySubscribers('alerts', alert);

    return true;
  }

  /**
   * Subscribe to engagement updates
   */
  subscribe(
    type: EngagementSubscriber['type'],
    callback: (data: unknown) => void,
    filters?: EngagementSubscriber['filters']
  ): string {
    const subscriberId = uuidv4();

    const subscriber: EngagementSubscriber = {
      id: subscriberId,
      type,
      callback,
      filters,
      createdAt: new Date(),
    };

    this.subscribers.set(subscriberId, subscriber);

    // Send current state
    this.sendInitialState(subscriber);

    logger.debug('Engagement subscriber added', { subscriberId, type });

    return subscriberId;
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(subscriberId: string): boolean {
    return this.subscribers.delete(subscriberId);
  }

  /**
   * Send initial state to new subscriber
   */
  private sendInitialState(subscriber: EngagementSubscriber): void {
    if (subscriber.type === 'metrics' || subscriber.type === 'all') {
      subscriber.callback({ type: 'metrics', data: this.currentMetrics });
    }

    if (subscriber.type === 'users' || subscriber.type === 'all') {
      const users = this.getFilteredUsers(subscriber.filters);
      subscriber.callback({ type: 'users', data: users });
    }

    if (subscriber.type === 'sessions' || subscriber.type === 'all') {
      const sessions = this.getFilteredSessions(subscriber.filters);
      subscriber.callback({ type: 'sessions', data: sessions });
    }

    if (subscriber.type === 'alerts' || subscriber.type === 'all') {
      const alerts = Array.from(this.churnAlerts.values()).filter(a => !a.acknowledged);
      subscriber.callback({ type: 'alerts', data: alerts });
    }
  }

  /**
   * Notify subscribers
   */
  private notifySubscribers(
    type: 'metrics' | 'users' | 'sessions' | 'alerts' | 'activity',
    data: unknown
  ): void {
    for (const subscriber of this.subscribers.values()) {
      if (subscriber.type === type || subscriber.type === 'all') {
        try {
          subscriber.callback({ type, data });
        } catch (error) {
          logger.error('Subscriber callback error:', { subscriberId: subscriber.id, error });
        }
      }
    }
  }

  /**
   * Get filtered users
   */
  private getFilteredUsers(filters?: EngagementSubscriber['filters']): ActiveUser[] {
    let users = Array.from(this.activeUsers.values());

    if (filters?.userId) {
      users = users.filter(u => u.userId === filters.userId);
    }

    return users;
  }

  /**
   * Get filtered sessions
   */
  private getFilteredSessions(filters?: EngagementSubscriber['filters']): LiveSession[] {
    let sessions = Array.from(this.activeSessions.values());

    if (filters?.coachId) {
      sessions = sessions.filter(s => s.coachId === filters.coachId);
    }

    if (filters?.sessionType) {
      sessions = sessions.filter(s => s.sessionType === filters.sessionType);
    }

    return sessions;
  }

  /**
   * Update metrics
   */
  private async updateMetrics(): Promise<void> {
    const now = new Date();

    // Clean up stale users
    await this.cleanupStaleUsers();

    // Calculate metrics
    const activeUsers = Array.from(this.activeUsers.values()).filter(
      u => u.status !== 'offline'
    ).length;

    const activeSessions = Array.from(this.activeSessions.values()).filter(
      s => s.status === 'in_progress'
    ).length;

    const activeCoaches = new Set(
      Array.from(this.activeSessions.values())
        .filter(s => s.status === 'in_progress')
        .map(s => s.coachId)
    ).size;

    const churnRiskAlerts = Array.from(this.churnAlerts.values()).filter(
      a => !a.acknowledged
    ).length;

    // Update current metrics
    this.currentMetrics = {
      timestamp: now,
      activeUsers,
      activeSessions,
      messagesLastHour: await this.getMessagesLastHour(),
      goalsUpdatedToday: await this.getGoalsUpdatedToday(),
      churnRiskAlerts,
      newUsersToday: await this.getNewUsersToday(),
      averageSessionDuration: this.calculateAverageSessionDuration(),
      peakConcurrentUsers: Math.max(this.currentMetrics.peakConcurrentUsers, activeUsers),
      currentlyActiveCoaches: activeCoaches,
    };

    // Add to history
    this.metricsHistory.push({ ...this.currentMetrics });
    if (this.metricsHistory.length > this.config.metricsHistoryLimit) {
      this.metricsHistory.shift();
    }

    // Notify subscribers
    this.notifySubscribers('metrics', this.currentMetrics);

    // Emit event
    this.emit('metricsUpdate', this.currentMetrics);
  }

  /**
   * Clean up stale users
   */
  private async cleanupStaleUsers(): Promise<void> {
    const now = Date.now();

    for (const [userId, user] of this.activeUsers) {
      const lastActivityTime = new Date(user.lastActivity).getTime();
      const timeSinceActivity = now - lastActivityTime;

      if (timeSinceActivity > this.config.userOfflineTimeout) {
        user.status = 'offline';
      } else if (timeSinceActivity > this.config.userIdleTimeout && user.status === 'online') {
        user.status = 'idle';
      }
    }
  }

  /**
   * Calculate average session duration
   */
  private calculateAverageSessionDuration(): number {
    const completedSessions = Array.from(this.activeSessions.values()).filter(
      s => s.status === 'completed' && s.duration
    );

    if (completedSessions.length === 0) return 0;

    const totalDuration = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    return totalDuration / completedSessions.length;
  }

  /**
   * Get messages sent in last hour (placeholder)
   */
  private async getMessagesLastHour(): Promise<number> {
    try {
      const count = await redis.get(`${this.config.redisPrefix}messages:hourly`);
      return count ? parseInt(count, 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get goals updated today (placeholder)
   */
  private async getGoalsUpdatedToday(): Promise<number> {
    try {
      const count = await redis.get(`${this.config.redisPrefix}goals:daily`);
      return count ? parseInt(count, 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get new users today (placeholder)
   */
  private async getNewUsersToday(): Promise<number> {
    try {
      const count = await redis.get(`${this.config.redisPrefix}users:new:daily`);
      return count ? parseInt(count, 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Persist activity
   */
  private async persistActivity(activity: UserActivity): Promise<void> {
    try {
      // Add to activity list (keep last 1000)
      await redis.lPush(
        `${this.config.redisPrefix}activity:${activity.userId}`,
        JSON.stringify(activity)
      );
      await redis.lTrim(
        `${this.config.redisPrefix}activity:${activity.userId}`,
        0,
        999
      );

      // Increment counters
      if (activity.type === 'message_sent') {
        await redis.incr(`${this.config.redisPrefix}messages:hourly`);
      }

      if (activity.type === 'goal_update') {
        await redis.incr(`${this.config.redisPrefix}goals:daily`);
      }
    } catch (error) {
      logger.error('Failed to persist activity:', error);
    }
  }

  /**
   * Load state from Redis
   */
  private async loadFromRedis(): Promise<void> {
    try {
      // Load active users
      const users = await redis.hGetAll(`${this.config.redisPrefix}users`);
      for (const [userId, userData] of Object.entries(users)) {
        const user = JSON.parse(userData) as ActiveUser;
        user.lastActivity = new Date(user.lastActivity);
        this.activeUsers.set(userId, user);
      }

      // Load sessions
      const sessions = await redis.hGetAll(`${this.config.redisPrefix}sessions`);
      for (const [sessionId, sessionData] of Object.entries(sessions)) {
        const session = JSON.parse(sessionData) as LiveSession;
        session.scheduledAt = new Date(session.scheduledAt);
        if (session.startedAt) session.startedAt = new Date(session.startedAt);
        if (session.endedAt) session.endedAt = new Date(session.endedAt);
        this.activeSessions.set(sessionId, session);
      }

      // Load alerts
      const alerts = await redis.hGetAll(`${this.config.redisPrefix}alerts`);
      for (const [alertId, alertData] of Object.entries(alerts)) {
        const alert = JSON.parse(alertData) as ChurnRiskAlert;
        alert.detectedAt = new Date(alert.detectedAt);
        this.churnAlerts.set(alertId, alert);
      }

      logger.info('Loaded engagement state from Redis', {
        users: this.activeUsers.size,
        sessions: this.activeSessions.size,
        alerts: this.churnAlerts.size,
      });
    } catch (error) {
      logger.error('Failed to load from Redis:', error);
    }
  }

  /**
   * Save state to Redis
   */
  private async saveToRedis(): Promise<void> {
    try {
      // Save is done incrementally, but we can force a full save here if needed
      logger.info('Engagement state saved to Redis');
    } catch (error) {
      logger.error('Failed to save to Redis:', error);
    }
  }

  /**
   * Subscribe to relevant events
   */
  private async subscribeToEvents(): Promise<void> {
    // Subscribe to prediction events for churn alerts
    await eventBus.subscribe(
      'prediction.churn',
      async (event) => {
        const payload = event.payload as {
          userId: string;
          prediction: { probability: number; riskFactors: string[] };
        };

        if (payload.prediction.probability > 0.7) {
          await this.addChurnAlert({
            userId: payload.userId,
            riskLevel: payload.prediction.probability > 0.9 ? 'critical' :
                       payload.prediction.probability > 0.8 ? 'high' : 'medium',
            riskScore: payload.prediction.probability,
            reasons: payload.prediction.riskFactors,
          });
        }
      },
      { category: 'prediction' }
    );
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): EngagementMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit?: number): EngagementMetrics[] {
    const history = [...this.metricsHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get active users
   */
  getActiveUsers(status?: UserStatus): ActiveUser[] {
    let users = Array.from(this.activeUsers.values());

    if (status) {
      users = users.filter(u => u.status === status);
    }

    return users;
  }

  /**
   * Get active sessions
   */
  getActiveSessions(status?: SessionStatus): LiveSession[] {
    let sessions = Array.from(this.activeSessions.values());

    if (status) {
      sessions = sessions.filter(s => s.status === status);
    }

    return sessions;
  }

  /**
   * Get churn alerts
   */
  getChurnAlerts(includeAcknowledged = false): ChurnRiskAlert[] {
    let alerts = Array.from(this.churnAlerts.values());

    if (!includeAcknowledged) {
      alerts = alerts.filter(a => !a.acknowledged);
    }

    return alerts.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Get statistics
   */
  getStats(): LiveEngagementStats {
    return {
      subscriberCount: this.subscribers.size,
      activeUsersTracked: this.activeUsers.size,
      activeSessionsTracked: this.activeSessions.size,
      alertsActive: Array.from(this.churnAlerts.values()).filter(a => !a.acknowledged).length,
      metricsUpdatedAt: this.currentMetrics.timestamp,
    };
  }

  /**
   * Create empty metrics
   */
  private createEmptyMetrics(): EngagementMetrics {
    return {
      timestamp: new Date(),
      activeUsers: 0,
      activeSessions: 0,
      messagesLastHour: 0,
      goalsUpdatedToday: 0,
      churnRiskAlerts: 0,
      newUsersToday: 0,
      averageSessionDuration: 0,
      peakConcurrentUsers: 0,
      currentlyActiveCoaches: 0,
    };
  }

  /**
   * Check if running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

// ==================== Singleton Instance ====================

let liveEngagementInstance: LiveEngagementMonitor | null = null;

export const liveEngagementMonitor = (() => {
  if (!liveEngagementInstance) {
    liveEngagementInstance = new LiveEngagementMonitor();
  }
  return liveEngagementInstance;
})();

export const createLiveEngagementMonitor = (): LiveEngagementMonitor => {
  return new LiveEngagementMonitor();
};

export default LiveEngagementMonitor;
