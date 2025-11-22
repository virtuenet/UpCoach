/**
 * Audit Logger Service
 * Comprehensive security event logging and monitoring
 */
export declare enum AuditEventType {
    LOGIN_SUCCESS = "LOGIN_SUCCESS",
    LOGIN_FAILURE = "LOGIN_FAILURE",
    LOGOUT = "LOGOUT",
    PASSWORD_CHANGE = "PASSWORD_CHANGE",
    PASSWORD_RESET = "PASSWORD_RESET",
    TWO_FACTOR_ENABLED = "2FA_ENABLED",
    TWO_FACTOR_DISABLED = "2FA_DISABLED",
    TWO_FACTOR_FAILURE = "2FA_FAILURE",
    ACCESS_GRANTED = "ACCESS_GRANTED",
    ACCESS_DENIED = "ACCESS_DENIED",
    PERMISSION_CHANGE = "PERMISSION_CHANGE",
    ROLE_CHANGE = "ROLE_CHANGE",
    DATA_VIEW = "DATA_VIEW",
    DATA_CREATE = "DATA_CREATE",
    DATA_UPDATE = "DATA_UPDATE",
    DATA_DELETE = "DATA_DELETE",
    DATA_EXPORT = "DATA_EXPORT",
    DATA_IMPORT = "DATA_IMPORT",
    SECURITY_ALERT = "SECURITY_ALERT",
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    INVALID_INPUT = "INVALID_INPUT",
    SQL_INJECTION_ATTEMPT = "SQL_INJECTION_ATTEMPT",
    XSS_ATTEMPT = "XSS_ATTEMPT",
    CSRF_FAILURE = "CSRF_FAILURE",
    FILE_UPLOAD = "FILE_UPLOAD",
    FILE_DOWNLOAD = "FILE_DOWNLOAD",
    FILE_DELETE = "FILE_DELETE",
    FILE_VALIDATION_FAILURE = "FILE_VALIDATION_FAILURE",
    CONFIG_CHANGE = "CONFIG_CHANGE",
    SYSTEM_SETTING_CHANGE = "SYSTEM_SETTING_CHANGE",
    APPLICATION_ERROR = "APPLICATION_ERROR",
    API_ERROR = "API_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR"
}
export declare enum AuditEventSeverity {
    INFO = "INFO",
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
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
declare class AuditLoggerService {
    private static instance;
    private storage;
    private severityThresholds;
    private alertHandlers;
    private retentionDays;
    private cleanupInterval;
    private constructor();
    static getInstance(): AuditLoggerService;
    /**
     * Initialize default severity thresholds
     */
    private initializeSeverityThresholds;
    /**
     * Log audit event
     */
    logEvent(type: AuditEventType, action: string, result: 'SUCCESS' | 'FAILURE', context?: {
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
    }): Promise<void>;
    /**
     * Log to standard logger
     */
    private logToStandardLogger;
    /**
     * Trigger alerts for high severity events
     */
    private triggerAlerts;
    /**
     * Send critical alert
     */
    private sendCriticalAlert;
    /**
     * Check for suspicious patterns
     */
    private checkForPatterns;
    /**
     * Query audit logs
     */
    queryLogs(filters: Partial<AuditEvent>, options?: {
        limit?: number;
        offset?: number;
        sortBy?: keyof AuditEvent;
        sortOrder?: 'ASC' | 'DESC';
    }): Promise<AuditEvent[]>;
    /**
     * Get statistics
     */
    getStatistics(timeRange?: {
        start: Date;
        end: Date;
    }): Promise<{
        totalEvents: number;
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
        byResult: Record<string, number>;
        topUsers: Array<{
            userId: string;
            count: number;
        }>;
        topResources: Array<{
            resource: string;
            count: number;
        }>;
    }>;
    /**
     * Register alert handler
     */
    registerAlertHandler(severity: AuditEventSeverity, handler: (event: AuditEvent) => void): () => void;
    /**
     * Set custom storage backend
     */
    setStorage(storage: AuditStorage): void;
    /**
     * Set retention period
     */
    setRetentionDays(days: number): void;
    /**
     * Cleanup old events
     */
    private cleanup;
    /**
     * Start cleanup task
     */
    private startCleanupTask;
    /**
     * Stop cleanup task
     */
    stopCleanupTask(): void;
    /**
     * Express middleware
     */
    middleware(): (req: any, res: any, next: any) => Promise<void>;
}
export declare const auditLogger: AuditLoggerService;
export declare const logSecurityEvent: (action: string, result: "SUCCESS" | "FAILURE", context?: any) => Promise<void>;
export declare const logDataAccess: (action: string, resource: string, resourceId?: string, context?: any) => Promise<void>;
export declare const logAuthEvent: (type: "LOGIN" | "LOGOUT" | "FAILURE", userId?: string, context?: any) => Promise<void>;
export {};
//# sourceMappingURL=auditLogger.d.ts.map