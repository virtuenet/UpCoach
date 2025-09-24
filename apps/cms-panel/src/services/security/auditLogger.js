/**
 * Audit Logger Service
 * Comprehensive security event logging and monitoring
 */
import { logger } from '../../utils/logger';
export var AuditEventType;
(function (AuditEventType) {
    // Authentication events
    AuditEventType["LOGIN_SUCCESS"] = "LOGIN_SUCCESS";
    AuditEventType["LOGIN_FAILURE"] = "LOGIN_FAILURE";
    AuditEventType["LOGOUT"] = "LOGOUT";
    AuditEventType["PASSWORD_CHANGE"] = "PASSWORD_CHANGE";
    AuditEventType["PASSWORD_RESET"] = "PASSWORD_RESET";
    AuditEventType["TWO_FACTOR_ENABLED"] = "2FA_ENABLED";
    AuditEventType["TWO_FACTOR_DISABLED"] = "2FA_DISABLED";
    AuditEventType["TWO_FACTOR_FAILURE"] = "2FA_FAILURE";
    // Authorization events
    AuditEventType["ACCESS_GRANTED"] = "ACCESS_GRANTED";
    AuditEventType["ACCESS_DENIED"] = "ACCESS_DENIED";
    AuditEventType["PERMISSION_CHANGE"] = "PERMISSION_CHANGE";
    AuditEventType["ROLE_CHANGE"] = "ROLE_CHANGE";
    // Data access events
    AuditEventType["DATA_VIEW"] = "DATA_VIEW";
    AuditEventType["DATA_CREATE"] = "DATA_CREATE";
    AuditEventType["DATA_UPDATE"] = "DATA_UPDATE";
    AuditEventType["DATA_DELETE"] = "DATA_DELETE";
    AuditEventType["DATA_EXPORT"] = "DATA_EXPORT";
    AuditEventType["DATA_IMPORT"] = "DATA_IMPORT";
    // Security events
    AuditEventType["SECURITY_ALERT"] = "SECURITY_ALERT";
    AuditEventType["SUSPICIOUS_ACTIVITY"] = "SUSPICIOUS_ACTIVITY";
    AuditEventType["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    AuditEventType["INVALID_INPUT"] = "INVALID_INPUT";
    AuditEventType["SQL_INJECTION_ATTEMPT"] = "SQL_INJECTION_ATTEMPT";
    AuditEventType["XSS_ATTEMPT"] = "XSS_ATTEMPT";
    AuditEventType["CSRF_FAILURE"] = "CSRF_FAILURE";
    // File operations
    AuditEventType["FILE_UPLOAD"] = "FILE_UPLOAD";
    AuditEventType["FILE_DOWNLOAD"] = "FILE_DOWNLOAD";
    AuditEventType["FILE_DELETE"] = "FILE_DELETE";
    AuditEventType["FILE_VALIDATION_FAILURE"] = "FILE_VALIDATION_FAILURE";
    // Configuration changes
    AuditEventType["CONFIG_CHANGE"] = "CONFIG_CHANGE";
    AuditEventType["SYSTEM_SETTING_CHANGE"] = "SYSTEM_SETTING_CHANGE";
    // Error events
    AuditEventType["APPLICATION_ERROR"] = "APPLICATION_ERROR";
    AuditEventType["API_ERROR"] = "API_ERROR";
    AuditEventType["DATABASE_ERROR"] = "DATABASE_ERROR";
})(AuditEventType || (AuditEventType = {}));
export var AuditEventSeverity;
(function (AuditEventSeverity) {
    AuditEventSeverity["INFO"] = "INFO";
    AuditEventSeverity["LOW"] = "LOW";
    AuditEventSeverity["MEDIUM"] = "MEDIUM";
    AuditEventSeverity["HIGH"] = "HIGH";
    AuditEventSeverity["CRITICAL"] = "CRITICAL";
})(AuditEventSeverity || (AuditEventSeverity = {}));
class InMemoryAuditStorage {
    constructor() {
        this.events = [];
        this.maxEvents = 10000;
    }
    async store(event) {
        this.events.push({
            ...event,
            id: this.generateId(),
        });
        // Prevent memory overflow
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }
    }
    async query(filters) {
        return this.events.filter(event => {
            for (const [key, value] of Object.entries(filters)) {
                if (event[key] !== value) {
                    return false;
                }
            }
            return true;
        });
    }
    async count(filters) {
        const results = await this.query(filters);
        return results.length;
    }
    async cleanup(olderThan) {
        const before = this.events.length;
        this.events = this.events.filter(e => e.timestamp > olderThan);
        return before - this.events.length;
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}
class AuditLoggerService {
    constructor() {
        this.retentionDays = 90;
        this.cleanupInterval = null;
        this.storage = new InMemoryAuditStorage();
        this.severityThresholds = this.initializeSeverityThresholds();
        this.alertHandlers = new Map();
        // Start cleanup task
        this.startCleanupTask();
    }
    static getInstance() {
        if (!AuditLoggerService.instance) {
            AuditLoggerService.instance = new AuditLoggerService();
        }
        return AuditLoggerService.instance;
    }
    /**
     * Initialize default severity thresholds
     */
    initializeSeverityThresholds() {
        const thresholds = new Map();
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
    async logEvent(type, action, result, context) {
        const severity = this.severityThresholds.get(type) || AuditEventSeverity.INFO;
        const event = {
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
        }
        catch (error) {
            logger.error('Failed to log audit event', error);
        }
    }
    /**
     * Log to standard logger
     */
    logToStandardLogger(event) {
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
    triggerAlerts(event) {
        const handlers = this.alertHandlers.get(event.severity);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(event);
                }
                catch (error) {
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
    sendCriticalAlert(event) {
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
    async checkForPatterns(event) {
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
                await this.logEvent(AuditEventType.SUSPICIOUS_ACTIVITY, 'Possible brute force attack detected', 'FAILURE', {
                    ipAddress: event.ipAddress,
                    details: {
                        failureCount: recentCount,
                        timeWindow: '15 minutes',
                    },
                });
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
                await this.logEvent(AuditEventType.SUSPICIOUS_ACTIVITY, 'Rapid data access detected', 'SUCCESS', {
                    userId: event.userId,
                    details: {
                        accessCount: recentCount,
                        timeWindow: '60 seconds',
                    },
                });
            }
        }
    }
    /**
     * Query audit logs
     */
    async queryLogs(filters, options) {
        let events = await this.storage.query(filters);
        // Sort
        if (options?.sortBy) {
            events.sort((a, b) => {
                const aVal = a[options.sortBy];
                const bVal = b[options.sortBy];
                if (aVal && bVal && aVal < bVal)
                    return options.sortOrder === 'ASC' ? -1 : 1;
                if (aVal && bVal && aVal > bVal)
                    return options.sortOrder === 'ASC' ? 1 : -1;
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
    async getStatistics(timeRange) {
        const allEvents = await this.storage.query({});
        const filteredEvents = timeRange
            ? allEvents.filter(e => e.timestamp >= timeRange.start && e.timestamp <= timeRange.end)
            : allEvents;
        const byType = {};
        const bySeverity = {};
        const byResult = {};
        const userCounts = new Map();
        const resourceCounts = new Map();
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
    registerAlertHandler(severity, handler) {
        if (!this.alertHandlers.has(severity)) {
            this.alertHandlers.set(severity, []);
        }
        this.alertHandlers.get(severity).push(handler);
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
    setStorage(storage) {
        this.storage = storage;
    }
    /**
     * Set retention period
     */
    setRetentionDays(days) {
        this.retentionDays = days;
    }
    /**
     * Cleanup old events
     */
    async cleanup() {
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
    startCleanupTask() {
        // Run cleanup daily
        this.cleanupInterval = setInterval(() => {
            this.cleanup().catch(error => {
                logger.error('Audit cleanup error', error);
            });
        }, 24 * 60 * 60 * 1000);
    }
    /**
     * Stop cleanup task
     */
    stopCleanupTask() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
    /**
     * Express middleware
     */
    middleware() {
        return async (req, res, next) => {
            // Log request
            const startTime = Date.now();
            // Capture original methods
            const originalSend = res.send;
            const originalJson = res.json;
            const originalEnd = res.end;
            // Override response methods to log result
            const logResponse = async (_body) => {
                const duration = Date.now() - startTime;
                const statusCode = res.statusCode;
                const success = statusCode >= 200 && statusCode < 400;
                // Determine event type based on request
                let eventType = AuditEventType.ACCESS_GRANTED;
                if (statusCode === 401 || statusCode === 403) {
                    eventType = AuditEventType.ACCESS_DENIED;
                }
                else if (statusCode >= 500) {
                    eventType = AuditEventType.APPLICATION_ERROR;
                }
                await this.logEvent(eventType, `${req.method} ${req.path}`, success ? 'SUCCESS' : 'FAILURE', {
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
                });
            };
            res.send = function (body) {
                logResponse(body);
                return originalSend.call(this, body);
            };
            res.json = function (body) {
                logResponse(body);
                return originalJson.call(this, body);
            };
            res.end = function (...args) {
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
export const logSecurityEvent = (action, result, context) => auditLogger.logEvent(AuditEventType.SECURITY_ALERT, action, result, context);
export const logDataAccess = (action, resource, resourceId, context) => auditLogger.logEvent(AuditEventType.DATA_VIEW, action, 'SUCCESS', {
    resource,
    resourceId,
    ...context,
});
export const logAuthEvent = (type, userId, context) => {
    const eventType = type === 'LOGIN'
        ? AuditEventType.LOGIN_SUCCESS
        : type === 'LOGOUT'
            ? AuditEventType.LOGOUT
            : AuditEventType.LOGIN_FAILURE;
    return auditLogger.logEvent(eventType, type.toLowerCase(), type === 'FAILURE' ? 'FAILURE' : 'SUCCESS', { userId, ...context });
};
//# sourceMappingURL=auditLogger.js.map