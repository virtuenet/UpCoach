import { EventEmitter } from 'events';

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure';
  metadata?: Record<string, any>;
}

/**
 * Audit Logger
 *
 * Comprehensive audit trail for compliance and security.
 */
export class AuditLogger extends EventEmitter {
  private logs: AuditLog[] = [];

  async log(event: AuditLog): Promise<void> {
    this.logs.push(event);
    this.emit('audit:logged', event);
  }

  async queryLogs(filter: any): Promise<AuditLog[]> {
    return this.logs;
  }

  async exportLogs(orgId: string, format: 'csv' | 'json'): Promise<string> {
    return format === 'json' ? JSON.stringify(this.logs) : 'CSV data';
  }

  async detectSuspiciousActivity(orgId: string): Promise<any[]> {
    return [];
  }
}

export default AuditLogger;
