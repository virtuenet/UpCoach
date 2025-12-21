/**
 * Audit Logger Service
 *
 * Immutable audit logging for compliance, security events,
 * and system changes with tamper detection.
 */

import { createHash } from 'crypto';
import { EventEmitter } from 'events';

// Audit event types
export type AuditEventType =
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.password_change'
  | 'user.profile_update'
  | 'user.delete'
  | 'user.role_change'
  | 'data.create'
  | 'data.read'
  | 'data.update'
  | 'data.delete'
  | 'data.export'
  | 'admin.config_change'
  | 'admin.user_action'
  | 'admin.system_change'
  | 'security.access_denied'
  | 'security.suspicious_activity'
  | 'security.rate_limit'
  | 'payment.transaction'
  | 'payment.refund'
  | 'payment.subscription_change'
  | 'api.key_created'
  | 'api.key_revoked'
  | 'system.startup'
  | 'system.shutdown'
  | 'system.error';

// Audit event
export interface AuditEvent {
  id: string;
  timestamp: string;
  type: AuditEventType;
  actor: {
    type: 'user' | 'system' | 'admin' | 'api';
    id: string;
    email?: string;
    ip?: string;
    userAgent?: string;
  };
  target?: {
    type: string;
    id: string;
    name?: string;
  };
  action: string;
  outcome: 'success' | 'failure' | 'partial';
  details: Record<string, unknown>;
  metadata: {
    requestId?: string;
    sessionId?: string;
    tenantId?: string;
    environment: string;
    version: string;
  };
  hash: string;
  previousHash: string | null;
}

// Audit config
export interface AuditConfig {
  enabled: boolean;
  serviceName: string;
  environment: string;
  version: string;
  retentionDays: number;
  sensitiveFields: string[];
  hashAlgorithm: 'sha256' | 'sha512';
  maxEvents: number;
}

// Audit statistics
export interface AuditStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByOutcome: Record<string, number>;
  eventsByActor: Record<string, number>;
  recentEvents: number;
  oldestEvent?: string;
  newestEvent?: string;
}

export class AuditLogger extends EventEmitter {
  private config: AuditConfig;
  private events: AuditEvent[] = [];
  private lastHash: string | null = null;

  constructor(config?: Partial<AuditConfig>) {
    super();
    this.config = {
      enabled: true,
      serviceName: 'upcoach-api',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      retentionDays: 90,
      sensitiveFields: [
        'password',
        'token',
        'secret',
        'apiKey',
        'creditCard',
        'ssn',
        'authorization',
      ],
      hashAlgorithm: 'sha256',
      maxEvents: 100000,
      ...config,
    };
  }

  /**
   * Log an audit event
   */
  log(params: {
    type: AuditEventType;
    actor: AuditEvent['actor'];
    action: string;
    outcome: AuditEvent['outcome'];
    target?: AuditEvent['target'];
    details?: Record<string, unknown>;
    requestId?: string;
    sessionId?: string;
    tenantId?: string;
  }): string {
    if (!this.config.enabled) return '';

    const id = this.generateId();
    const timestamp = new Date().toISOString();

    // Sanitize details
    const sanitizedDetails = this.sanitize(params.details || {});

    const event: Omit<AuditEvent, 'hash' | 'previousHash'> = {
      id,
      timestamp,
      type: params.type,
      actor: params.actor,
      target: params.target,
      action: params.action,
      outcome: params.outcome,
      details: sanitizedDetails,
      metadata: {
        requestId: params.requestId,
        sessionId: params.sessionId,
        tenantId: params.tenantId,
        environment: this.config.environment,
        version: this.config.version,
      },
    };

    // Calculate hash chain
    const previousHash = this.lastHash;
    const hash = this.calculateHash(event, previousHash);

    const fullEvent: AuditEvent = {
      ...event,
      hash,
      previousHash,
    };

    this.lastHash = hash;
    this.events.push(fullEvent);

    // Cleanup old events
    this.cleanup();

    // Emit event
    this.emit('audit', fullEvent);

    // Log security events
    if (params.type.startsWith('security.')) {
      this.emit('security', fullEvent);
    }

    return id;
  }

  /**
   * Log user login
   */
  logLogin(params: {
    userId: string;
    email: string;
    ip: string;
    userAgent?: string;
    success: boolean;
    failureReason?: string;
    requestId?: string;
  }): string {
    return this.log({
      type: 'user.login',
      actor: {
        type: 'user',
        id: params.userId,
        email: params.email,
        ip: params.ip,
        userAgent: params.userAgent,
      },
      action: 'User login attempt',
      outcome: params.success ? 'success' : 'failure',
      details: {
        failureReason: params.failureReason,
      },
      requestId: params.requestId,
    });
  }

  /**
   * Log data access
   */
  logDataAccess(params: {
    actorId: string;
    actorEmail?: string;
    resourceType: string;
    resourceId: string;
    resourceName?: string;
    action: 'create' | 'read' | 'update' | 'delete';
    success: boolean;
    changes?: Record<string, unknown>;
    requestId?: string;
  }): string {
    const eventType = `data.${params.action}` as AuditEventType;

    return this.log({
      type: eventType,
      actor: {
        type: 'user',
        id: params.actorId,
        email: params.actorEmail,
      },
      target: {
        type: params.resourceType,
        id: params.resourceId,
        name: params.resourceName,
      },
      action: `${params.action} ${params.resourceType}`,
      outcome: params.success ? 'success' : 'failure',
      details: {
        changes: params.changes,
      },
      requestId: params.requestId,
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(params: {
    type: 'access_denied' | 'suspicious_activity' | 'rate_limit';
    actorId?: string;
    ip: string;
    userAgent?: string;
    details: Record<string, unknown>;
    requestId?: string;
  }): string {
    const eventType = `security.${params.type}` as AuditEventType;

    return this.log({
      type: eventType,
      actor: {
        type: params.actorId ? 'user' : 'system',
        id: params.actorId || 'anonymous',
        ip: params.ip,
        userAgent: params.userAgent,
      },
      action: `Security event: ${params.type}`,
      outcome: 'failure',
      details: params.details,
      requestId: params.requestId,
    });
  }

  /**
   * Log admin action
   */
  logAdminAction(params: {
    adminId: string;
    adminEmail: string;
    action: string;
    targetType?: string;
    targetId?: string;
    changes?: Record<string, unknown>;
    requestId?: string;
  }): string {
    return this.log({
      type: 'admin.user_action',
      actor: {
        type: 'admin',
        id: params.adminId,
        email: params.adminEmail,
      },
      target: params.targetType
        ? {
            type: params.targetType,
            id: params.targetId || 'unknown',
          }
        : undefined,
      action: params.action,
      outcome: 'success',
      details: {
        changes: params.changes,
      },
      requestId: params.requestId,
    });
  }

  /**
   * Log payment event
   */
  logPaymentEvent(params: {
    type: 'transaction' | 'refund' | 'subscription_change';
    userId: string;
    amount?: number;
    currency?: string;
    transactionId?: string;
    subscriptionId?: string;
    details: Record<string, unknown>;
    success: boolean;
    requestId?: string;
  }): string {
    const eventType = `payment.${params.type}` as AuditEventType;

    return this.log({
      type: eventType,
      actor: {
        type: 'user',
        id: params.userId,
      },
      target: params.transactionId
        ? {
            type: 'transaction',
            id: params.transactionId,
          }
        : params.subscriptionId
          ? {
              type: 'subscription',
              id: params.subscriptionId,
            }
          : undefined,
      action: `Payment ${params.type}`,
      outcome: params.success ? 'success' : 'failure',
      details: {
        amount: params.amount,
        currency: params.currency,
        ...params.details,
      },
      requestId: params.requestId,
    });
  }

  /**
   * Get events
   */
  getEvents(options?: {
    type?: AuditEventType;
    actorId?: string;
    targetId?: string;
    outcome?: AuditEvent['outcome'];
    startTime?: string;
    endTime?: string;
    limit?: number;
    offset?: number;
  }): AuditEvent[] {
    let events = [...this.events];

    if (options?.type) {
      events = events.filter((e) => e.type === options.type);
    }

    if (options?.actorId) {
      events = events.filter((e) => e.actor.id === options.actorId);
    }

    if (options?.targetId) {
      events = events.filter((e) => e.target?.id === options.targetId);
    }

    if (options?.outcome) {
      events = events.filter((e) => e.outcome === options.outcome);
    }

    if (options?.startTime) {
      events = events.filter((e) => e.timestamp >= options.startTime!);
    }

    if (options?.endTime) {
      events = events.filter((e) => e.timestamp <= options.endTime!);
    }

    // Sort by timestamp descending
    events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    if (options?.offset) {
      events = events.slice(options.offset);
    }

    if (options?.limit) {
      events = events.slice(0, options.limit);
    }

    return events;
  }

  /**
   * Get event by ID
   */
  getEvent(id: string): AuditEvent | null {
    return this.events.find((e) => e.id === id) || null;
  }

  /**
   * Verify integrity of audit chain
   */
  verifyIntegrity(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    let previousHash: string | null = null;

    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];

      // Verify previous hash link
      if (event.previousHash !== previousHash) {
        errors.push(`Event ${event.id}: Previous hash mismatch at index ${i}`);
      }

      // Verify event hash
      const { hash, previousHash: _, ...eventData } = event;
      const expectedHash = this.calculateHash(eventData, event.previousHash);

      if (event.hash !== expectedHash) {
        errors.push(`Event ${event.id}: Hash mismatch - possible tampering detected`);
      }

      previousHash = event.hash;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get statistics
   */
  getStats(): AuditStats {
    const eventsByType: Record<string, number> = {};
    const eventsByOutcome: Record<string, number> = {};
    const eventsByActor: Record<string, number> = {};

    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    let recentEvents = 0;

    for (const event of this.events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsByOutcome[event.outcome] = (eventsByOutcome[event.outcome] || 0) + 1;
      eventsByActor[event.actor.type] = (eventsByActor[event.actor.type] || 0) + 1;

      if (event.timestamp >= oneDayAgo) {
        recentEvents++;
      }
    }

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsByOutcome,
      eventsByActor,
      recentEvents,
      oldestEvent: this.events[0]?.timestamp,
      newestEvent: this.events[this.events.length - 1]?.timestamp,
    };
  }

  /**
   * Export events
   */
  export(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'id',
        'timestamp',
        'type',
        'actor_type',
        'actor_id',
        'action',
        'outcome',
        'target_type',
        'target_id',
      ];
      const rows = this.events.map((e) => [
        e.id,
        e.timestamp,
        e.type,
        e.actor.type,
        e.actor.id,
        e.action,
        e.outcome,
        e.target?.type || '',
        e.target?.id || '',
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Sanitize sensitive data
   */
  private sanitize(data: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      if (this.config.sensitiveFields.some((f) => lowerKey.includes(f.toLowerCase()))) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = this.sanitize(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Calculate hash
   */
  private calculateHash(event: unknown, previousHash: string | null): string {
    const data = JSON.stringify({ event, previousHash });
    return createHash(this.config.hashAlgorithm).update(data).digest('hex');
  }

  /**
   * Cleanup old events
   */
  private cleanup(): void {
    const cutoff = new Date(
      Date.now() - this.config.retentionDays * 86400000
    ).toISOString();

    while (this.events.length > 0 && this.events[0].timestamp < cutoff) {
      this.events.shift();
    }

    while (this.events.length > this.config.maxEvents) {
      this.events.shift();
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `audit_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let auditLogger: AuditLogger | null = null;

export function getAuditLogger(): AuditLogger {
  if (!auditLogger) {
    auditLogger = new AuditLogger();
  }
  return auditLogger;
}

export default AuditLogger;
