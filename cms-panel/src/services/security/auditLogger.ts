/**
 * Audit Logger Service
 * Comprehensive security event logging and monitoring
 */

import { logger } from '../../utils/logger';

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  TWO_FACTOR_ENABLED = '2FA_ENABLED',
  TWO_FACTOR_DISABLED = '2FA_DISABLED',
  TWO_FACTOR_FAILURE = '2FA_FAILURE',

  // Authorization events
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  ROLE_CHANGE = 'ROLE_CHANGE',

  // Data access events
  DATA_VIEW = 'DATA_VIEW',
  DATA_CREATE = 'DATA_CREATE',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',

  // Security events
  SECURITY_ALERT = 'SECURITY_ALERT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT = 'INVALID_INPUT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  CSRF_FAILURE = 'CSRF_FAILURE',

  // File operations
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
  FILE_DELETE = 'FILE_DELETE',
  FILE_VALIDATION_FAILURE = 'FILE_VALIDATION_FAILURE',

  // Configuration changes
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  SYSTEM_SETTING_CHANGE = 'SYSTEM_SETTING_CHANGE',

  // Error events
  APPLICATION_ERROR = 'APPLICATION_ERROR',
  API_ERROR = 'API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

export enum AuditEventSeverity {
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AuditEvent {
  id?: string;
  timestamp: Date;
  type: AuditEventType;
  severity: AuditEventSeverity;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  resource?: string;
  resourceId?: string;
  action: string;
  result: 'SUCCESS' | 'FAILURE';
  details?: Record<string, any>;
  metadata?: Record<string, any>;
  errorMessage?: string;
  stackTrace?: string;
}

interface AuditStorage {
  store(event: AuditEvent): Promise<void>;
  query(filters: Partial<AuditEvent>): Promise<AuditEvent[]>;
  count(filters: Partial<AuditEvent>): Promise<number>;
  cleanup(olderThan: Date): Promise<number>;
}

class InMemoryAuditStorage implements AuditStorage {
  private events: AuditEvent[] = [];
  private maxEvents = 10000;

  async store(event: AuditEvent): Promise<void> {
    this.events.push({
      ...event,
      id: this.generateId(),
    });

    // Prevent memory overflow
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  async query(filters: Partial<AuditEvent>): Promise<AuditEvent[]> {
    return this.events.filter(event => {
      for (const [key, value] of Object.entries(filters)) {
        if (event[key as keyof AuditEvent] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  async count(filters: Partial<AuditEvent>): Promise<number> {
    const results = await this.query(filters);
    return results.length;
  }

  async cleanup(olderThan: Date): Promise<number> {
    const before = this.events.length;
    this.events = this.events.filter(e => e.timestamp > olderThan);
    return before - this.events.length;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

class AuditLoggerService {
  private static instance: AuditLoggerService;
  private storage: AuditStorage;
  private severityThresholds: Map<AuditEventType, AuditEventSeverity>;
  private alertHandlers: Map<AuditEventSeverity, Array<(event: AuditEvent) => void>>;
  private retentionDays = 90;
  private cleanupInterval: any = null;

  private constructor() {
    this.storage = new InMemoryAuditStorage();
    this.severityThresholds = this.initializeSeverityThresholds();
    this.alertHandlers = new Map();

    // Start cleanup task
    this.startCleanupTask();
  }

  static getInstance(): AuditLoggerService {
    if (!AuditLoggerService.instance) {
      AuditLoggerService.instance = new AuditLoggerService();
    }
    return AuditLoggerService.instance;
  }

  /**
   * Initialize default severity thresholds
   */
  private initializeSeverityThresholds(): Map<AuditEventType, AuditEventSeverity> {
    const thresholds = new Map<AuditEventType, AuditEventSeverity>();

    // Authentication events
    thresholds.set(AuditEventType.LOGIN_SUCCESS, AuditEventSeverity.INFO);
    thresholds.set(AuditEventType.LOGIN_FAILURE, AuditEventSeverity.MEDIUM);
    thresholds.set(AuditEventType.PASSWORD_RESET, AuditEventSeverity.MEDIUM);

    // Security events
    thresholds.set(AuditEventType.SECURITY_ALERT, AuditEventSeverity.HIGH);
    thresholds.set(AuditEventType.SQL_INJECTION_ATTEMPT, AuditEventSeverity.CRITICAL);
    thresholds.set(AuditEventType.XSS_ATTEMPT, AuditEventSeverity.HIGH);
    thresholds.set(AuditEventType.SUSPICIOUS_ACTIVITY, AuditEventSeverity.HIGH);

    // Data operations
    thresholds.set(AuditEventType.DATA_DELETE, AuditEventSeverity.MEDIUM);
    thresholds.set(AuditEventType.DATA_EXPORT, AuditEventSeverity.MEDIUM);

    // Access control
    thresholds.set(AuditEventType.ACCESS_DENIED, AuditEventSeverity.MEDIUM);
    thresholds.set(AuditEventType.PERMISSION_CHANGE, AuditEventSeverity.HIGH);

    return thresholds;
  }

  /**
   * Log audit event
   */
  async logEvent(
    type: AuditEventType,
    action: string,
    result: 'SUCCESS' | 'FAILURE',
    context?: {
      userId?: string;
      userEmail?: string;
      userRole?: string;
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      resource?: string;
      resourceId?: string;
      details?: Record<string, any>;
      errorMessage?: string;
      stackTrace?: string;
    }
  ): Promise<void> {
    const severity = this.severityThresholds.get(type) || AuditEventSeverity.INFO;

    const event: AuditEvent = {
      timestamp: new Date(),
      type,
      severity,
      action,
      result,
      ...context,
      metadata: {
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
        environment: import.meta.env.MODE || 'production',
        version: import.meta.env.VITE_APP_VERSION || 'unknown',
      },
    };

    // Store event
    try {
      await this.storage.store(event);

      // Log to standard logger based on severity
      this.logToStandardLogger(event);

      // Trigger alerts if necessary
      this.triggerAlerts(event);

      // Check for patterns
      await this.checkForPatterns(event);
    } catch (error) {
      logger.error('Failed to log audit event', error);
    }
  }

  /**
   * Log to standard logger
   */
  private logToStandardLogger(event: AuditEvent): void {
    const message = `[AUDIT] ${event.type}: ${event.action}`;
    const context = {
      userId: event.userId,
      resource: event.resource,
      result: event.result,
      details: event.details,
    };

    switch (event.severity) {
      case AuditEventSeverity.CRITICAL:
      case AuditEventSeverity.HIGH:
        logger.error(message, context);
        break;
      case AuditEventSeverity.MEDIUM:
        logger.warn(message, context);
        break;
      default:
        logger.info(message, context);
    }
  }

  /**
   * Trigger alerts for high severity events
   */
  private triggerAlerts(event: AuditEvent): void {
    const handlers = this.alertHandlers.get(event.severity);

    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          logger.error('Alert handler error', error);
        }
      });
    }

    // Auto-alert for critical events
    if (event.severity === AuditEventSeverity.CRITICAL) {
      this.sendCriticalAlert(event);
    }
  }

  /**
   * Send critical alert
   */
  private sendCriticalAlert(event: AuditEvent): void {
    logger.error('CRITICAL SECURITY EVENT', {
      type: event.type,
      action: event.action,
      userId: event.userId,
      ipAddress: event.ipAddress,
      details: event.details,
    });

    // In production, this would send to external monitoring
    // For example: Sentry, PagerDuty, Slack, etc.
  }

  /**
   * Check for suspicious patterns
   */
  private async checkForPatterns(event: AuditEvent): Promise<void> {
    // Check for brute force attempts
    if (event.type === AuditEventType.LOGIN_FAILURE && event.ipAddress) {
      const recentFailures = await this.storage.query({
        type: AuditEventType.LOGIN_FAILURE,
        ipAddress: event.ipAddress,
        result: 'FAILURE',
      });

      const recentCount = recentFailures.filter(e => {
        const minutesAgo = (Date.now() - e.timestamp.getTime()) / 60000;
        return minutesAgo < 15;
      }).length;

      if (recentCount >= 5) {
        await this.logEvent(
          AuditEventType.SUSPICIOUS_ACTIVITY,
          'Possible brute force attack detected',
          'FAILURE',
          {
            ipAddress: event.ipAddress,
            details: {
              failureCount: recentCount,
              timeWindow: '15 minutes',
            },
          }
        );
      }
    }

    // Check for rapid data access
    if (event.type === AuditEventType.DATA_VIEW && event.userId) {
      const recentViews = await this.storage.query({
        type: AuditEventType.DATA_VIEW,
        userId: event.userId,
      });

      const recentCount = recentViews.filter(e => {
        const secondsAgo = (Date.now() - e.timestamp.getTime()) / 1000;
        return secondsAgo < 60;
      }).length;

      if (recentCount >= 100) {
        await this.logEvent(
          AuditEventType.SUSPICIOUS_ACTIVITY,
          'Rapid data access detected',
          'SUCCESS',
          {
            userId: event.userId,
            details: {
              accessCount: recentCount,
              timeWindow: '60 seconds',
            },
          }
        );
      }
    }
  }

  /**
   * Query audit logs
   */
  async queryLogs(
    filters: Partial<AuditEvent>,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: keyof AuditEvent;
      sortOrder?: 'ASC' | 'DESC';
    }
  ): Promise<AuditEvent[]> {
    let events = await this.storage.query(filters);

    // Sort
    if (options?.sortBy) {
      events.sort((a, b) => {
        const aVal = a[options.sortBy!];
        const bVal = b[options.sortBy!];

        if (aVal < bVal) return options.sortOrder === 'ASC' ? -1 : 1;
        if (aVal > bVal) return options.sortOrder === 'ASC' ? 1 : -1;
        return 0;
      });
    }

    // Pagination
    if (options?.offset !== undefined || options?.limit !== undefined) {
      const start = options.offset || 0;
      const end = options.limit ? start + options.limit : undefined;
      events = events.slice(start, end);
    }

    return events;
  }

  /**
   * Get statistics
   */
  async getStatistics(timeRange?: { start: Date; end: Date }): Promise<{
    totalEvents: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byResult: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
    topResources: Array<{ resource: string; count: number }>;
  }> {
    const allEvents = await this.storage.query({});

    const filteredEvents = timeRange
      ? allEvents.filter(e => e.timestamp >= timeRange.start && e.timestamp <= timeRange.end)
      : allEvents;

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byResult: Record<string, number> = {};
    const userCounts: Map<string, number> = new Map();
    const resourceCounts: Map<string, number> = new Map();

    for (const event of filteredEvents) {
      // By type
      byType[event.type] = (byType[event.type] || 0) + 1;

      // By severity
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;

      // By result
      byResult[event.result] = (byResult[event.result] || 0) + 1;

      // User counts
      if (event.userId) {
        userCounts.set(event.userId, (userCounts.get(event.userId) || 0) + 1);
      }

      // Resource counts
      if (event.resource) {
        resourceCounts.set(event.resource, (resourceCounts.get(event.resource) || 0) + 1);
      }
    }

    // Top users
    const topUsers = Array.from(userCounts.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top resources
    const topResources = Array.from(resourceCounts.entries())
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: filteredEvents.length,
      byType,
      bySeverity,
      byResult,
      topUsers,
      topResources,
    };
  }

  /**
   * Register alert handler
   */
  registerAlertHandler(
    severity: AuditEventSeverity,
    handler: (event: AuditEvent) => void
  ): () => void {
    if (!this.alertHandlers.has(severity)) {
      this.alertHandlers.set(severity, []);
    }

    this.alertHandlers.get(severity)!.push(handler);

    // Return unregister function
    return () => {
      const handlers = this.alertHandlers.get(severity);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Set custom storage backend
   */
  setStorage(storage: AuditStorage): void {
    this.storage = storage;
  }

  /**
   * Set retention period
   */
  setRetentionDays(days: number): void {
    this.retentionDays = days;
  }

  /**
   * Cleanup old events
   */
  private async cleanup(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    const deleted = await this.storage.cleanup(cutoffDate);

    if (deleted > 0) {
      logger.info(`Cleaned up ${deleted} old audit events`);
    }
  }

  /**
   * Start cleanup task
   */
  private startCleanupTask(): void {
    // Run cleanup daily
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup().catch(error => {
          logger.error('Audit cleanup error', error);
        });
      },
      24 * 60 * 60 * 1000
    );
  }

  /**
   * Stop cleanup task
   */
  stopCleanupTask(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Express middleware
   */
  middleware() {
    return async (req: any, res: any, next: any) => {
      // Log request
      const startTime = Date.now();

      // Capture original methods
      const originalSend = res.send;
      const originalJson = res.json;
      const originalEnd = res.end;

      // Override response methods to log result
      const logResponse = async (body?: any) => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        const success = statusCode >= 200 && statusCode < 400;

        // Determine event type based on request
        let eventType = AuditEventType.ACCESS_GRANTED;
        if (statusCode === 401 || statusCode === 403) {
          eventType = AuditEventType.ACCESS_DENIED;
        } else if (statusCode >= 500) {
          eventType = AuditEventType.APPLICATION_ERROR;
        }

        await this.logEvent(
          eventType,
          `${req.method} ${req.path}`,
          success ? 'SUCCESS' : 'FAILURE',
          {
            userId: req.user?.id,
            userEmail: req.user?.email,
            userRole: req.user?.role,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            sessionId: req.sessionID,
            resource: req.path,
            details: {
              method: req.method,
              statusCode,
              duration,
              query: req.query,
              params: req.params,
            },
          }
        );
      };

      res.send = function (body: any) {
        logResponse(body);
        return originalSend.call(this, body);
      };

      res.json = function (body: any) {
        logResponse(body);
        return originalJson.call(this, body);
      };

      res.end = function (...args: any[]) {
        logResponse();
        return originalEnd.apply(this, args);
      };

      next();
    };
  }
}

// Export singleton instance
export const auditLogger = AuditLoggerService.getInstance();

// Export convenience functions
export const logSecurityEvent = (action: string, result: 'SUCCESS' | 'FAILURE', context?: any) =>
  auditLogger.logEvent(AuditEventType.SECURITY_ALERT, action, result, context);

export const logDataAccess = (
  action: string,
  resource: string,
  resourceId?: string,
  context?: any
) =>
  auditLogger.logEvent(AuditEventType.DATA_VIEW, action, 'SUCCESS', {
    resource,
    resourceId,
    ...context,
  });

export const logAuthEvent = (
  type: 'LOGIN' | 'LOGOUT' | 'FAILURE',
  userId?: string,
  context?: any
) => {
  const eventType =
    type === 'LOGIN'
      ? AuditEventType.LOGIN_SUCCESS
      : type === 'LOGOUT'
        ? AuditEventType.LOGOUT
        : AuditEventType.LOGIN_FAILURE;

  return auditLogger.logEvent(
    eventType,
    type.toLowerCase(),
    type === 'FAILURE' ? 'FAILURE' : 'SUCCESS',
    { userId, ...context }
  );
};
