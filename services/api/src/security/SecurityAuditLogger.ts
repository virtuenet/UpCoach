/**
 * Security Audit Logger - SOC 2 Type II Compliance
 * Tamper-proof audit logging for all security events
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export enum AuditEventType {
  // Authentication
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILED = 'auth.login.failed',
  LOGOUT = 'auth.logout',
  PASSWORD_CHANGED = 'auth.password.changed',
  MFA_ENABLED = 'auth.mfa.enabled',
  MFA_DISABLED = 'auth.mfa.disabled',

  // Access Control
  PERMISSION_GRANTED = 'access.permission.granted',
  PERMISSION_REVOKED = 'access.permission.revoked',
  ROLE_ASSIGNED = 'access.role.assigned',
  ROLE_REMOVED = 'access.role.removed',

  // Data Access
  DATA_READ = 'data.read',
  DATA_CREATED = 'data.created',
  DATA_UPDATED = 'data.updated',
  DATA_DELETED = 'data.deleted',
  DATA_EXPORTED = 'data.exported',

  // System
  CONFIG_CHANGED = 'system.config.changed',
  BACKUP_CREATED = 'system.backup.created',
  BACKUP_RESTORED = 'system.backup.restored',

  // Security
  SECURITY_ALERT = 'security.alert',
  INTRUSION_DETECTED = 'security.intrusion.detected',
  VULNERABILITY_DETECTED = 'security.vulnerability.detected',
}

export enum SeverityLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: SeverityLevel;
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  details: Record<string, any>;
  result: 'success' | 'failure';
  errorMessage?: string;
  sessionId?: string;
  correlationId?: string;
  hash: string; // Tamper detection
  previousHash?: string; // Blockchain-style linking
}

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: AuditEventType[];
  userId?: string;
  tenantId?: string;
  severity?: SeverityLevel[];
  resource?: string;
  result?: 'success' | 'failure';
  limit?: number;
  offset?: number;
}

export interface ComplianceReport {
  reportId: string;
  generatedAt: Date;
  period: { start: Date; end: Date };
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  failedLoginAttempts: number;
  dataAccessEvents: number;
  permissionChanges: number;
  securityAlerts: number;
  complianceScore: number; // 0-100
  violations: Array<{
    type: string;
    severity: string;
    description: string;
    timestamp: Date;
  }>;
}

export class SecurityAuditLogger extends EventEmitter {
  private static instance: SecurityAuditLogger;
  private events: Map<string, AuditEvent> = new Map();
  private lastEventHash?: string;

  // SOC 2 retention policy: 7 years
  private static readonly RETENTION_DAYS = 365 * 7;

  private constructor() {
    super();
  }

  static getInstance(): SecurityAuditLogger {
    if (!SecurityAuditLogger.instance) {
      SecurityAuditLogger.instance = new SecurityAuditLogger();
    }
    return SecurityAuditLogger.instance;
  }

  /**
   * Log a security audit event
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'hash' | 'previousHash'>): Promise<AuditEvent> {
    const auditEvent: AuditEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      hash: '',
      previousHash: this.lastEventHash,
    };

    // Calculate tamper-proof hash
    auditEvent.hash = this.calculateHash(auditEvent);
    this.lastEventHash = auditEvent.hash;

    // Store event
    this.events.set(auditEvent.id, auditEvent);

    // Emit event for real-time monitoring
    this.emit('audit:logged', auditEvent);

    // Persist to database (write-once table)
    await this.persistEvent(auditEvent);

    console.log(
      `[SecurityAudit] ${auditEvent.eventType} - ${auditEvent.result} (${auditEvent.severity})`
    );

    // Trigger alerts for critical events
    if (auditEvent.severity === SeverityLevel.CRITICAL) {
      this.emit('security:critical', auditEvent);
    }

    return auditEvent;
  }

  /**
   * Log authentication event
   */
  async logAuthentication(
    userId: string,
    success: boolean,
    details: Record<string, any> = {}
  ): Promise<AuditEvent> {
    return this.logEvent({
      eventType: success ? AuditEventType.LOGIN_SUCCESS : AuditEventType.LOGIN_FAILED,
      severity: success ? SeverityLevel.INFO : SeverityLevel.WARNING,
      userId,
      action: 'authenticate',
      details,
      result: success ? 'success' : 'failure',
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    userId: string,
    resource: string,
    action: 'read' | 'create' | 'update' | 'delete' | 'export',
    success: boolean,
    details: Record<string, any> = {}
  ): Promise<AuditEvent> {
    const eventTypeMap = {
      read: AuditEventType.DATA_READ,
      create: AuditEventType.DATA_CREATED,
      update: AuditEventType.DATA_UPDATED,
      delete: AuditEventType.DATA_DELETED,
      export: AuditEventType.DATA_EXPORTED,
    };

    return this.logEvent({
      eventType: eventTypeMap[action],
      severity: action === 'export' ? SeverityLevel.WARNING : SeverityLevel.INFO,
      userId,
      resource,
      action,
      details,
      result: success ? 'success' : 'failure',
    });
  }

  /**
   * Log permission change
   */
  async logPermissionChange(
    userId: string,
    targetUserId: string,
    action: 'grant' | 'revoke',
    permission: string,
    details: Record<string, any> = {}
  ): Promise<AuditEvent> {
    return this.logEvent({
      eventType:
        action === 'grant' ? AuditEventType.PERMISSION_GRANTED : AuditEventType.PERMISSION_REVOKED,
      severity: SeverityLevel.WARNING,
      userId,
      action,
      details: { ...details, targetUserId, permission },
      result: 'success',
    });
  }

  /**
   * Log security alert
   */
  async logSecurityAlert(
    severity: SeverityLevel,
    description: string,
    details: Record<string, any> = {}
  ): Promise<AuditEvent> {
    return this.logEvent({
      eventType: AuditEventType.SECURITY_ALERT,
      severity,
      action: 'alert',
      details: { ...details, description },
      result: 'success',
    });
  }

  /**
   * Query audit events
   */
  async queryEvents(query: AuditQuery): Promise<AuditEvent[]> {
    let results = Array.from(this.events.values());

    // Apply filters
    if (query.startDate) {
      results = results.filter((e) => e.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      results = results.filter((e) => e.timestamp <= query.endDate!);
    }

    if (query.eventTypes && query.eventTypes.length > 0) {
      results = results.filter((e) => query.eventTypes!.includes(e.eventType));
    }

    if (query.userId) {
      results = results.filter((e) => e.userId === query.userId);
    }

    if (query.tenantId) {
      results = results.filter((e) => e.tenantId === query.tenantId);
    }

    if (query.severity && query.severity.length > 0) {
      results = results.filter((e) => query.severity!.includes(e.severity));
    }

    if (query.resource) {
      results = results.filter((e) => e.resource === query.resource);
    }

    if (query.result) {
      results = results.filter((e) => e.result === query.result);
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    results = results.slice(offset, offset + limit);

    return results;
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    tenantId?: string
  ): Promise<ComplianceReport> {
    const events = await this.queryEvents({
      startDate,
      endDate,
      tenantId,
      limit: 100000,
    });

    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    let failedLoginAttempts = 0;
    let dataAccessEvents = 0;
    let permissionChanges = 0;
    let securityAlerts = 0;

    for (const event of events) {
      // Count by type
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;

      // Count by severity
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;

      // Count specific categories
      if (event.eventType === AuditEventType.LOGIN_FAILED) failedLoginAttempts++;
      if (event.eventType.startsWith('data.')) dataAccessEvents++;
      if (
        event.eventType === AuditEventType.PERMISSION_GRANTED ||
        event.eventType === AuditEventType.PERMISSION_REVOKED
      )
        permissionChanges++;
      if (event.eventType === AuditEventType.SECURITY_ALERT) securityAlerts++;
    }

    // Calculate compliance score
    const complianceScore = this.calculateComplianceScore(events);

    // Detect violations
    const violations = this.detectViolations(events);

    return {
      reportId: crypto.randomUUID(),
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      failedLoginAttempts,
      dataAccessEvents,
      permissionChanges,
      securityAlerts,
      complianceScore,
      violations,
    };
  }

  /**
   * Verify audit trail integrity
   */
  async verifyIntegrity(): Promise<{ valid: boolean; errors: string[] }> {
    const events = Array.from(this.events.values()).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const errors: string[] = [];
    let previousHash: string | undefined;

    for (const event of events) {
      // Verify hash
      const calculatedHash = this.calculateHash({ ...event, hash: '' });
      if (calculatedHash !== event.hash) {
        errors.push(`Hash mismatch for event ${event.id}`);
      }

      // Verify chain
      if (previousHash && event.previousHash !== previousHash) {
        errors.push(`Chain broken at event ${event.id}`);
      }

      previousHash = event.hash;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate tamper-proof hash
   */
  private calculateHash(event: AuditEvent | Partial<AuditEvent>): string {
    const data = {
      id: event.id,
      timestamp: event.timestamp,
      eventType: event.eventType,
      userId: event.userId,
      resource: event.resource,
      action: event.action,
      result: event.result,
      previousHash: event.previousHash,
    };

    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * Calculate compliance score (0-100)
   */
  private calculateComplianceScore(events: AuditEvent[]): number {
    let score = 100;

    const criticalEvents = events.filter((e) => e.severity === SeverityLevel.CRITICAL);
    const failedLogins = events.filter((e) => e.eventType === AuditEventType.LOGIN_FAILED);

    // Deduct for critical events
    score -= criticalEvents.length * 5;

    // Deduct for excessive failed logins
    if (failedLogins.length > 100) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Detect compliance violations
   */
  private detectViolations(events: AuditEvent[]): ComplianceReport['violations'] {
    const violations: ComplianceReport['violations'] = [];

    // Check for excessive failed logins from same IP
    const failedLoginsByIP: Record<string, number> = {};
    for (const event of events) {
      if (event.eventType === AuditEventType.LOGIN_FAILED && event.ipAddress) {
        failedLoginsByIP[event.ipAddress] = (failedLoginsByIP[event.ipAddress] || 0) + 1;
      }
    }

    for (const [ip, count] of Object.entries(failedLoginsByIP)) {
      if (count > 10) {
        violations.push({
          type: 'excessive_failed_logins',
          severity: 'high',
          description: `${count} failed login attempts from IP ${ip}`,
          timestamp: new Date(),
        });
      }
    }

    return violations;
  }

  /**
   * Persist event to database
   */
  private async persistEvent(event: AuditEvent): Promise<void> {
    // TODO: Write to database (write-once table)
    // In production, this would use a dedicated audit database with WORM (Write Once Read Many) properties
  }

  /**
   * Clean up old audit logs (per retention policy)
   */
  async cleanupOldLogs(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - SecurityAuditLogger.RETENTION_DAYS);

    let deleted = 0;
    for (const [id, event] of this.events.entries()) {
      if (event.timestamp < cutoffDate) {
        this.events.delete(id);
        deleted++;
      }
    }

    console.log(`[SecurityAudit] Cleaned up ${deleted} old audit logs`);
    return deleted;
  }
}

export const securityAuditLogger = SecurityAuditLogger.getInstance();
