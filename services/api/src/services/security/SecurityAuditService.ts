/**
 * Security Audit Service
 *
 * Comprehensive security auditing and logging including:
 * - Security event logging
 * - Access control auditing
 * - Configuration change tracking
 * - Compliance audit trails
 * - Security metrics collection
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// Audit Event Types
export type AuditEventType =
  // Authentication events
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'auth.mfa.enabled'
  | 'auth.mfa.disabled'
  | 'auth.mfa.challenge'
  | 'auth.password.change'
  | 'auth.password.reset'
  | 'auth.session.created'
  | 'auth.session.expired'
  | 'auth.session.revoked'
  // Authorization events
  | 'authz.access.granted'
  | 'authz.access.denied'
  | 'authz.role.assigned'
  | 'authz.role.revoked'
  | 'authz.permission.granted'
  | 'authz.permission.revoked'
  // Data access events
  | 'data.read'
  | 'data.create'
  | 'data.update'
  | 'data.delete'
  | 'data.export'
  | 'data.import'
  // Security events
  | 'security.threat.detected'
  | 'security.threat.mitigated'
  | 'security.ip.blocked'
  | 'security.ip.unblocked'
  | 'security.rate.limited'
  | 'security.encryption.key.rotated'
  // Configuration events
  | 'config.security.changed'
  | 'config.user.changed'
  | 'config.system.changed'
  // Compliance events
  | 'compliance.dsar.received'
  | 'compliance.dsar.completed'
  | 'compliance.consent.granted'
  | 'compliance.consent.withdrawn'
  | 'compliance.breach.detected'
  | 'compliance.breach.reported';

// Audit Severity
export type AuditSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

// Audit Event
export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  actor: AuditActor;
  target?: AuditTarget;
  action: string;
  outcome: 'success' | 'failure' | 'error' | 'denied';
  details: Record<string, any>;
  context: AuditContext;
  hash?: string; // For integrity verification
}

// Audit Actor
export interface AuditActor {
  type: 'user' | 'system' | 'service' | 'api_key' | 'anonymous';
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
}

// Audit Target
export interface AuditTarget {
  type: string;
  id?: string;
  name?: string;
  attributes?: Record<string, any>;
}

// Audit Context
export interface AuditContext {
  requestId?: string;
  correlationId?: string;
  environment: string;
  service: string;
  version: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  device?: {
    type?: string;
    os?: string;
    browser?: string;
  };
}

// Audit Query
export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: AuditEventType[];
  severities?: AuditSeverity[];
  actorId?: string;
  actorType?: AuditActor['type'];
  targetType?: string;
  targetId?: string;
  outcome?: AuditEvent['outcome'];
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

// Audit Report
export interface AuditReport {
  id: string;
  name: string;
  description: string;
  period: { start: Date; end: Date };
  generatedAt: Date;
  summary: {
    totalEvents: number;
    byEventType: Record<string, number>;
    bySeverity: Record<AuditSeverity, number>;
    byOutcome: Record<string, number>;
    uniqueActors: number;
    criticalEvents: number;
  };
  highlights: AuditEvent[];
  recommendations: string[];
}

// Audit Stats
export interface AuditStats {
  totalEvents: number;
  eventsToday: number;
  eventsThisWeek: number;
  bySeverity: Record<AuditSeverity, number>;
  byEventType: Record<string, number>;
  topActors: Array<{ actorId: string; count: number }>;
  topTargets: Array<{ targetType: string; count: number }>;
  failureRate: number;
}

// Retention Policy
export interface RetentionPolicy {
  eventType: AuditEventType | '*';
  retentionDays: number;
  archiveEnabled: boolean;
  compressAfterDays: number;
}

// Config
export interface SecurityAuditConfig {
  enabled: boolean;
  environment: string;
  serviceName: string;
  serviceVersion: string;
  hashAlgorithm: 'sha256' | 'sha384' | 'sha512';
  retentionPolicies: RetentionPolicy[];
  realTimeAlerts: boolean;
  alertSeverityThreshold: AuditSeverity;
}

/**
 * Security Audit Service
 */
export class SecurityAuditService extends EventEmitter {
  private static instance: SecurityAuditService;
  private config: SecurityAuditConfig;

  // In-memory storage (replace with database in production)
  private events: Map<string, AuditEvent> = new Map();
  private reports: Map<string, AuditReport> = new Map();

  // Severity weights for scoring
  private readonly severityWeights: Record<AuditSeverity, number> = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
    info: 0,
  };

  // Default retention policies
  private readonly defaultRetentionPolicies: RetentionPolicy[] = [
    { eventType: '*', retentionDays: 365, archiveEnabled: true, compressAfterDays: 90 },
    { eventType: 'auth.login.success', retentionDays: 90, archiveEnabled: true, compressAfterDays: 30 },
    { eventType: 'auth.login.failure', retentionDays: 180, archiveEnabled: true, compressAfterDays: 60 },
    { eventType: 'security.threat.detected', retentionDays: 730, archiveEnabled: true, compressAfterDays: 180 },
    { eventType: 'compliance.breach.detected', retentionDays: 2555, archiveEnabled: true, compressAfterDays: 365 },
  ];

  private constructor(config?: Partial<SecurityAuditConfig>) {
    super();
    this.config = {
      enabled: true,
      environment: process.env.NODE_ENV || 'development',
      serviceName: 'upcoach-api',
      serviceVersion: '1.0.0',
      hashAlgorithm: 'sha256',
      retentionPolicies: this.defaultRetentionPolicies,
      realTimeAlerts: true,
      alertSeverityThreshold: 'high',
      ...config,
    };

    this.startRetentionTask();
    console.log('SecurityAuditService initialized');
  }

  static getInstance(config?: Partial<SecurityAuditConfig>): SecurityAuditService {
    if (!SecurityAuditService.instance) {
      SecurityAuditService.instance = new SecurityAuditService(config);
    }
    return SecurityAuditService.instance;
  }

  // ==================== Event Logging ====================

  /**
   * Log an audit event
   */
  async log(
    eventType: AuditEventType,
    options: {
      actor: Partial<AuditActor>;
      target?: Partial<AuditTarget>;
      action: string;
      outcome: AuditEvent['outcome'];
      details?: Record<string, any>;
      severity?: AuditSeverity;
      context?: Partial<AuditContext>;
    }
  ): Promise<AuditEvent> {
    if (!this.config.enabled) {
      return {} as AuditEvent;
    }

    const id = this.generateEventId();
    const timestamp = new Date();

    const event: AuditEvent = {
      id,
      timestamp,
      eventType,
      severity: options.severity || this.inferSeverity(eventType, options.outcome),
      actor: {
        type: options.actor.type || 'anonymous',
        ...options.actor,
      },
      target: options.target
        ? {
            type: options.target.type || 'unknown',
            ...options.target,
          }
        : undefined,
      action: options.action,
      outcome: options.outcome,
      details: options.details || {},
      context: {
        environment: this.config.environment,
        service: this.config.serviceName,
        version: this.config.serviceVersion,
        ...options.context,
      },
    };

    // Generate integrity hash
    event.hash = this.generateEventHash(event);

    // Store event
    this.events.set(id, event);

    // Emit for real-time processing
    this.emit('event:logged', { event });

    // Check for alerts
    if (this.config.realTimeAlerts && this.shouldAlert(event)) {
      this.emit('alert:triggered', { event });
    }

    return event;
  }

  /**
   * Log authentication event
   */
  async logAuth(
    subType: 'login.success' | 'login.failure' | 'logout' | 'mfa.enabled' | 'mfa.disabled' | 'password.change' | 'password.reset',
    actor: Partial<AuditActor>,
    details?: Record<string, any>
  ): Promise<AuditEvent> {
    const eventType = `auth.${subType}` as AuditEventType;
    const outcome = subType.includes('failure') ? 'failure' : 'success';

    return this.log(eventType, {
      actor,
      action: this.formatAction(subType),
      outcome,
      details,
    });
  }

  /**
   * Log authorization event
   */
  async logAuthz(
    subType: 'access.granted' | 'access.denied' | 'role.assigned' | 'role.revoked' | 'permission.granted' | 'permission.revoked',
    actor: Partial<AuditActor>,
    target: Partial<AuditTarget>,
    details?: Record<string, any>
  ): Promise<AuditEvent> {
    const eventType = `authz.${subType}` as AuditEventType;
    const outcome = subType.includes('denied') ? 'denied' : 'success';

    return this.log(eventType, {
      actor,
      target,
      action: this.formatAction(subType),
      outcome,
      details,
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    operation: 'read' | 'create' | 'update' | 'delete' | 'export' | 'import',
    actor: Partial<AuditActor>,
    target: Partial<AuditTarget>,
    details?: Record<string, any>
  ): Promise<AuditEvent> {
    const eventType = `data.${operation}` as AuditEventType;

    return this.log(eventType, {
      actor,
      target,
      action: `${operation.charAt(0).toUpperCase() + operation.slice(1)} ${target.type || 'data'}`,
      outcome: 'success',
      details,
    });
  }

  /**
   * Log security event
   */
  async logSecurity(
    subType: 'threat.detected' | 'threat.mitigated' | 'ip.blocked' | 'ip.unblocked' | 'rate.limited' | 'encryption.key.rotated',
    actor: Partial<AuditActor>,
    details: Record<string, any>
  ): Promise<AuditEvent> {
    const eventType = `security.${subType}` as AuditEventType;

    return this.log(eventType, {
      actor,
      action: this.formatAction(subType),
      outcome: 'success',
      details,
      severity: subType.includes('threat') ? 'high' : 'medium',
    });
  }

  /**
   * Log compliance event
   */
  async logCompliance(
    subType: 'dsar.received' | 'dsar.completed' | 'consent.granted' | 'consent.withdrawn' | 'breach.detected' | 'breach.reported',
    actor: Partial<AuditActor>,
    target: Partial<AuditTarget>,
    details?: Record<string, any>
  ): Promise<AuditEvent> {
    const eventType = `compliance.${subType}` as AuditEventType;

    return this.log(eventType, {
      actor,
      target,
      action: this.formatAction(subType),
      outcome: 'success',
      details,
      severity: subType.includes('breach') ? 'critical' : 'medium',
    });
  }

  // ==================== Querying ====================

  /**
   * Query audit events
   */
  async query(query: AuditQuery): Promise<{ events: AuditEvent[]; total: number }> {
    let events = Array.from(this.events.values());

    // Apply filters
    if (query.startDate) {
      events = events.filter((e) => e.timestamp >= query.startDate!);
    }
    if (query.endDate) {
      events = events.filter((e) => e.timestamp <= query.endDate!);
    }
    if (query.eventTypes && query.eventTypes.length > 0) {
      events = events.filter((e) => query.eventTypes!.includes(e.eventType));
    }
    if (query.severities && query.severities.length > 0) {
      events = events.filter((e) => query.severities!.includes(e.severity));
    }
    if (query.actorId) {
      events = events.filter((e) => e.actor.id === query.actorId);
    }
    if (query.actorType) {
      events = events.filter((e) => e.actor.type === query.actorType);
    }
    if (query.targetType) {
      events = events.filter((e) => e.target?.type === query.targetType);
    }
    if (query.targetId) {
      events = events.filter((e) => e.target?.id === query.targetId);
    }
    if (query.outcome) {
      events = events.filter((e) => e.outcome === query.outcome);
    }
    if (query.searchTerm) {
      const term = query.searchTerm.toLowerCase();
      events = events.filter(
        (e) =>
          e.action.toLowerCase().includes(term) ||
          e.actor.name?.toLowerCase().includes(term) ||
          e.actor.email?.toLowerCase().includes(term) ||
          e.target?.name?.toLowerCase().includes(term)
      );
    }

    // Sort by timestamp descending
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = events.length;

    // Apply pagination
    if (query.offset) {
      events = events.slice(query.offset);
    }
    if (query.limit) {
      events = events.slice(0, query.limit);
    }

    return { events, total };
  }

  /**
   * Get event by ID
   */
  getEvent(id: string): AuditEvent | undefined {
    return this.events.get(id);
  }

  /**
   * Verify event integrity
   */
  verifyEventIntegrity(event: AuditEvent): boolean {
    if (!event.hash) return false;
    const computedHash = this.generateEventHash({ ...event, hash: undefined });
    return computedHash === event.hash;
  }

  // ==================== Reporting ====================

  /**
   * Generate audit report
   */
  async generateReport(
    name: string,
    period: { start: Date; end: Date }
  ): Promise<AuditReport> {
    const { events } = await this.query({
      startDate: period.start,
      endDate: period.end,
    });

    const byEventType = events.reduce(
      (acc, e) => {
        acc[e.eventType] = (acc[e.eventType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const bySeverity = events.reduce(
      (acc, e) => {
        acc[e.severity] = (acc[e.severity] || 0) + 1;
        return acc;
      },
      {} as Record<AuditSeverity, number>
    );

    const byOutcome = events.reduce(
      (acc, e) => {
        acc[e.outcome] = (acc[e.outcome] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const uniqueActors = new Set(events.map((e) => e.actor.id).filter(Boolean)).size;
    const criticalEvents = events.filter((e) => e.severity === 'critical');

    const recommendations: string[] = [];

    // Generate recommendations based on findings
    if (criticalEvents.length > 0) {
      recommendations.push(`Investigate ${criticalEvents.length} critical security events`);
    }

    const failedLogins = events.filter((e) => e.eventType === 'auth.login.failure').length;
    if (failedLogins > 100) {
      recommendations.push('High volume of failed login attempts detected - review authentication security');
    }

    const accessDenied = events.filter((e) => e.outcome === 'denied').length;
    if (accessDenied > 50) {
      recommendations.push('Significant access denials - review RBAC configuration');
    }

    const report: AuditReport = {
      id: `RPT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      name,
      description: `Security audit report for ${period.start.toISOString().split('T')[0]} to ${period.end.toISOString().split('T')[0]}`,
      period,
      generatedAt: new Date(),
      summary: {
        totalEvents: events.length,
        byEventType,
        bySeverity,
        byOutcome,
        uniqueActors,
        criticalEvents: criticalEvents.length,
      },
      highlights: criticalEvents.slice(0, 10),
      recommendations,
    };

    this.reports.set(report.id, report);

    return report;
  }

  /**
   * Get statistics
   */
  getStats(): AuditStats {
    const events = Array.from(this.events.values());
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const eventsToday = events.filter((e) => e.timestamp >= todayStart).length;
    const eventsThisWeek = events.filter((e) => e.timestamp >= weekStart).length;

    const bySeverity = events.reduce(
      (acc, e) => {
        acc[e.severity] = (acc[e.severity] || 0) + 1;
        return acc;
      },
      {} as Record<AuditSeverity, number>
    );

    const byEventType = events.reduce(
      (acc, e) => {
        acc[e.eventType] = (acc[e.eventType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Top actors
    const actorCounts = events.reduce(
      (acc, e) => {
        if (e.actor.id) {
          acc[e.actor.id] = (acc[e.actor.id] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const topActors = Object.entries(actorCounts)
      .map(([actorId, count]) => ({ actorId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top targets
    const targetCounts = events.reduce(
      (acc, e) => {
        if (e.target?.type) {
          acc[e.target.type] = (acc[e.target.type] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const topTargets = Object.entries(targetCounts)
      .map(([targetType, count]) => ({ targetType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Failure rate
    const failures = events.filter((e) => e.outcome === 'failure' || e.outcome === 'error').length;
    const failureRate = events.length > 0 ? failures / events.length : 0;

    return {
      totalEvents: events.length,
      eventsToday,
      eventsThisWeek,
      bySeverity,
      byEventType,
      topActors,
      topTargets,
      failureRate,
    };
  }

  // ==================== Export ====================

  /**
   * Export events to JSON
   */
  async exportToJSON(query: AuditQuery): Promise<string> {
    const { events } = await this.query(query);
    return JSON.stringify(events, null, 2);
  }

  /**
   * Export events to CSV
   */
  async exportToCSV(query: AuditQuery): Promise<string> {
    const { events } = await this.query(query);

    const headers = ['id', 'timestamp', 'eventType', 'severity', 'actorType', 'actorId', 'actorName', 'action', 'outcome', 'targetType', 'targetId'];

    const rows = events.map((e) => [
      e.id,
      e.timestamp.toISOString(),
      e.eventType,
      e.severity,
      e.actor.type,
      e.actor.id || '',
      e.actor.name || '',
      e.action,
      e.outcome,
      e.target?.type || '',
      e.target?.id || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    return csvContent;
  }

  // ==================== Helpers ====================

  private generateEventId(): string {
    return `AUD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  private generateEventHash(event: AuditEvent): string {
    const data = JSON.stringify({
      id: event.id,
      timestamp: event.timestamp.toISOString(),
      eventType: event.eventType,
      actor: event.actor,
      target: event.target,
      action: event.action,
      outcome: event.outcome,
    });

    return crypto.createHash(this.config.hashAlgorithm).update(data).digest('hex');
  }

  private inferSeverity(eventType: AuditEventType, outcome: AuditEvent['outcome']): AuditSeverity {
    // Critical events
    if (eventType.includes('breach') || eventType.includes('threat.detected')) {
      return 'critical';
    }

    // High severity
    if (eventType.includes('ip.blocked') || eventType.includes('access.denied') || eventType.includes('login.failure')) {
      return outcome === 'failure' || outcome === 'denied' ? 'high' : 'medium';
    }

    // Medium severity
    if (eventType.includes('security') || eventType.includes('password') || eventType.includes('mfa')) {
      return 'medium';
    }

    // Low severity
    if (eventType.includes('data.read') || eventType.includes('login.success')) {
      return 'low';
    }

    return 'info';
  }

  private formatAction(subType: string): string {
    return subType
      .split('.')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private shouldAlert(event: AuditEvent): boolean {
    const severityThreshold = this.severityWeights[this.config.alertSeverityThreshold];
    const eventSeverity = this.severityWeights[event.severity];
    return eventSeverity >= severityThreshold;
  }

  private startRetentionTask(): void {
    // Run retention cleanup daily
    setInterval(() => {
      this.applyRetentionPolicies();
    }, 24 * 60 * 60 * 1000);
  }

  private applyRetentionPolicies(): void {
    const now = new Date();

    for (const [id, event] of this.events) {
      const policy = this.config.retentionPolicies.find(
        (p) => p.eventType === event.eventType || p.eventType === '*'
      );

      if (policy) {
        const retentionDate = new Date(event.timestamp);
        retentionDate.setDate(retentionDate.getDate() + policy.retentionDays);

        if (now > retentionDate) {
          if (policy.archiveEnabled) {
            // Archive event (in production, move to cold storage)
            this.emit('event:archived', { event });
          }
          this.events.delete(id);
        }
      }
    }
  }
}

// Singleton getter
export function getSecurityAuditService(
  config?: Partial<SecurityAuditConfig>
): SecurityAuditService {
  return SecurityAuditService.getInstance(config);
}
