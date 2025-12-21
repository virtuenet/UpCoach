/**
 * Error Reporter Service
 *
 * Centralized error reporting with context enrichment,
 * error aggregation, and integration with external services.
 */

import { EventEmitter } from 'events';

// Error severity levels
export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

// Error categories
export type ErrorCategory =
  | 'system'
  | 'database'
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'business_logic'
  | 'external_service'
  | 'unknown';

// Error context
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
  environment: string;
  service: string;
  version: string;
  tags: Record<string, string>;
  extra: Record<string, unknown>;
}

// Reported error
export interface ReportedError {
  id: string;
  timestamp: number;
  severity: ErrorSeverity;
  category: ErrorCategory;
  error: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  context: ErrorContext;
  fingerprint: string;
  occurrences: number;
  firstSeen: number;
  lastSeen: number;
  resolved: boolean;
}

// Error group (aggregated)
export interface ErrorGroup {
  fingerprint: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  occurrences: number;
  firstSeen: number;
  lastSeen: number;
  affectedUsers: Set<string>;
  sampleError: ReportedError;
  resolved: boolean;
}

// Error reporter config
export interface ErrorReporterConfig {
  enabled: boolean;
  environment: string;
  service: string;
  version: string;
  maxErrors: number;
  maxGroups: number;
  sampleRate: number;
  captureUnhandled: boolean;
  captureConsoleErrors: boolean;
  filterPatterns: RegExp[];
  sensitiveFields: string[];
}

// Error stats
export interface ErrorStats {
  total: number;
  bySeverity: Record<ErrorSeverity, number>;
  byCategory: Record<ErrorCategory, number>;
  topErrors: Array<{
    fingerprint: string;
    message: string;
    count: number;
  }>;
  errorRate: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export class ErrorReporter extends EventEmitter {
  private config: ErrorReporterConfig;
  private errors: Map<string, ReportedError> = new Map();
  private groups: Map<string, ErrorGroup> = new Map();
  private recentErrors: string[] = [];
  private errorCounts: { timestamp: number; count: number }[] = [];

  constructor(config?: Partial<ErrorReporterConfig>) {
    super();
    this.config = {
      enabled: true,
      environment: process.env.NODE_ENV || 'development',
      service: 'upcoach-api',
      version: process.env.npm_package_version || '1.0.0',
      maxErrors: 10000,
      maxGroups: 1000,
      sampleRate: 1.0,
      captureUnhandled: true,
      captureConsoleErrors: false,
      filterPatterns: [],
      sensitiveFields: ['password', 'token', 'secret', 'authorization', 'cookie', 'apiKey'],
      ...config,
    };

    if (this.config.captureUnhandled) {
      this.setupUnhandledCapture();
    }
  }

  /**
   * Setup unhandled error capture
   */
  private setupUnhandledCapture(): void {
    process.on('uncaughtException', (error: Error) => {
      this.report(error, {
        severity: 'critical',
        category: 'system',
        tags: { uncaught: 'true' },
      });
    });

    process.on('unhandledRejection', (reason: unknown) => {
      const error =
        reason instanceof Error
          ? reason
          : new Error(String(reason));

      this.report(error, {
        severity: 'error',
        category: 'system',
        tags: { unhandledRejection: 'true' },
      });
    });
  }

  /**
   * Report an error
   */
  report(
    error: Error,
    options?: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      userId?: string;
      sessionId?: string;
      requestId?: string;
      traceId?: string;
      tags?: Record<string, string>;
      extra?: Record<string, unknown>;
    }
  ): string | null {
    if (!this.config.enabled) return null;

    // Apply sampling
    if (Math.random() > this.config.sampleRate) return null;

    // Check filter patterns
    for (const pattern of this.config.filterPatterns) {
      if (pattern.test(error.message)) return null;
    }

    const id = this.generateId();
    const timestamp = Date.now();
    const fingerprint = this.generateFingerprint(error);
    const severity = options?.severity || this.inferSeverity(error);
    const category = options?.category || this.inferCategory(error);

    // Sanitize extra data
    const sanitizedExtra = this.sanitize(options?.extra || {});

    const context: ErrorContext = {
      userId: options?.userId,
      sessionId: options?.sessionId,
      requestId: options?.requestId,
      traceId: options?.traceId,
      environment: this.config.environment,
      service: this.config.service,
      version: this.config.version,
      tags: options?.tags || {},
      extra: sanitizedExtra,
    };

    const reportedError: ReportedError = {
      id,
      timestamp,
      severity,
      category,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as NodeJS.ErrnoException).code,
      },
      context,
      fingerprint,
      occurrences: 1,
      firstSeen: timestamp,
      lastSeen: timestamp,
      resolved: false,
    };

    // Store error
    this.storeError(reportedError);

    // Update error group
    this.updateGroup(reportedError);

    // Track error count
    this.trackErrorCount();

    // Emit events
    this.emit('error', reportedError);

    if (severity === 'critical') {
      this.emit('critical', reportedError);
    }

    return id;
  }

  /**
   * Store error with limit
   */
  private storeError(error: ReportedError): void {
    this.errors.set(error.id, error);
    this.recentErrors.push(error.id);

    // Remove old errors if over limit
    while (this.errors.size > this.config.maxErrors) {
      const oldestId = this.recentErrors.shift();
      if (oldestId) {
        this.errors.delete(oldestId);
      }
    }
  }

  /**
   * Update error group
   */
  private updateGroup(error: ReportedError): void {
    let group = this.groups.get(error.fingerprint);

    if (group) {
      group.occurrences++;
      group.lastSeen = error.timestamp;
      if (error.context.userId) {
        group.affectedUsers.add(error.context.userId);
      }
      if (error.severity === 'critical' && group.severity !== 'critical') {
        group.severity = 'critical';
      }
    } else {
      group = {
        fingerprint: error.fingerprint,
        category: error.category,
        severity: error.severity,
        message: error.error.message,
        occurrences: 1,
        firstSeen: error.timestamp,
        lastSeen: error.timestamp,
        affectedUsers: new Set(error.context.userId ? [error.context.userId] : []),
        sampleError: error,
        resolved: false,
      };
      this.groups.set(error.fingerprint, group);

      // Emit new error type event
      this.emit('new-error-type', group);
    }

    // Limit groups
    if (this.groups.size > this.config.maxGroups) {
      // Remove oldest resolved groups first
      const sorted = Array.from(this.groups.entries())
        .filter(([, g]) => g.resolved)
        .sort((a, b) => a[1].lastSeen - b[1].lastSeen);

      for (const [key] of sorted.slice(0, sorted.length - this.config.maxGroups / 2)) {
        this.groups.delete(key);
      }
    }
  }

  /**
   * Track error count for rate calculation
   */
  private trackErrorCount(): void {
    const now = Date.now();
    const minute = Math.floor(now / 60000) * 60000;

    const existing = this.errorCounts.find((c) => c.timestamp === minute);
    if (existing) {
      existing.count++;
    } else {
      this.errorCounts.push({ timestamp: minute, count: 1 });
    }

    // Keep last hour of counts
    const oneHourAgo = now - 3600000;
    this.errorCounts = this.errorCounts.filter((c) => c.timestamp > oneHourAgo);
  }

  /**
   * Generate error fingerprint
   */
  private generateFingerprint(error: Error): string {
    // Use error name, message pattern, and stack location
    const messageParts = error.message
      .replace(/[0-9]+/g, 'N') // Normalize numbers
      .replace(/["'][^"']*["']/g, 'S') // Normalize strings
      .substring(0, 100);

    const stackLine = error.stack?.split('\n')[1]?.trim() || '';
    const locationMatch = stackLine.match(/at\s+(\S+)/);
    const location = locationMatch ? locationMatch[1] : 'unknown';

    return `${error.name}:${messageParts}:${location}`
      .replace(/[^a-zA-Z0-9:_-]/g, '_')
      .substring(0, 200);
  }

  /**
   * Infer severity from error
   */
  private inferSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();

    if (
      message.includes('fatal') ||
      message.includes('critical') ||
      message.includes('crash') ||
      error.name === 'FatalError'
    ) {
      return 'critical';
    }

    if (
      message.includes('warning') ||
      message.includes('deprecated') ||
      error.name === 'Warning'
    ) {
      return 'warning';
    }

    return 'error';
  }

  /**
   * Infer category from error
   */
  private inferCategory(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (
      message.includes('database') ||
      message.includes('query') ||
      message.includes('sql') ||
      name.includes('sequelize') ||
      name.includes('prisma')
    ) {
      return 'database';
    }

    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('socket') ||
      name.includes('fetch')
    ) {
      return 'network';
    }

    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required') ||
      name.includes('validation')
    ) {
      return 'validation';
    }

    if (
      message.includes('unauthorized') ||
      message.includes('unauthenticated') ||
      message.includes('login') ||
      name.includes('auth')
    ) {
      return 'authentication';
    }

    if (
      message.includes('forbidden') ||
      message.includes('permission') ||
      message.includes('access denied')
    ) {
      return 'authorization';
    }

    if (
      message.includes('api') ||
      message.includes('service') ||
      message.includes('external')
    ) {
      return 'external_service';
    }

    return 'unknown';
  }

  /**
   * Sanitize data by removing sensitive fields
   */
  private sanitize(data: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      if (this.config.sensitiveFields.some((f) => lowerKey.includes(f.toLowerCase()))) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.sanitize(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `err_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error by ID
   */
  getError(id: string): ReportedError | null {
    return this.errors.get(id) || null;
  }

  /**
   * Get error group by fingerprint
   */
  getGroup(fingerprint: string): ErrorGroup | null {
    return this.groups.get(fingerprint) || null;
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): ReportedError[] {
    return this.recentErrors
      .slice(-limit)
      .reverse()
      .map((id) => this.errors.get(id))
      .filter((e): e is ReportedError => e !== undefined);
  }

  /**
   * Get error groups
   */
  getGroups(options?: {
    resolved?: boolean;
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    limit?: number;
  }): ErrorGroup[] {
    let groups = Array.from(this.groups.values());

    if (options?.resolved !== undefined) {
      groups = groups.filter((g) => g.resolved === options.resolved);
    }

    if (options?.severity) {
      groups = groups.filter((g) => g.severity === options.severity);
    }

    if (options?.category) {
      groups = groups.filter((g) => g.category === options.category);
    }

    // Sort by occurrence count
    groups.sort((a, b) => b.occurrences - a.occurrences);

    return groups.slice(0, options?.limit || 100);
  }

  /**
   * Get error statistics
   */
  getStats(): ErrorStats {
    const bySeverity: Record<ErrorSeverity, number> = {
      critical: 0,
      error: 0,
      warning: 0,
      info: 0,
    };

    const byCategory: Partial<Record<ErrorCategory, number>> = {};

    for (const error of this.errors.values()) {
      bySeverity[error.severity]++;
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
    }

    // Calculate error rate (errors per minute over last hour)
    const totalErrors = this.errorCounts.reduce((sum, c) => sum + c.count, 0);
    const errorRate = this.errorCounts.length > 0 ? totalErrors / this.errorCounts.length : 0;

    // Calculate trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (this.errorCounts.length >= 2) {
      const recent = this.errorCounts.slice(-5);
      const older = this.errorCounts.slice(-10, -5);

      const recentAvg = recent.reduce((s, c) => s + c.count, 0) / recent.length || 0;
      const olderAvg = older.reduce((s, c) => s + c.count, 0) / older.length || 0;

      if (recentAvg > olderAvg * 1.2) {
        trend = 'increasing';
      } else if (recentAvg < olderAvg * 0.8) {
        trend = 'decreasing';
      }
    }

    // Top errors
    const topErrors = Array.from(this.groups.values())
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 10)
      .map((g) => ({
        fingerprint: g.fingerprint,
        message: g.message.substring(0, 100),
        count: g.occurrences,
      }));

    return {
      total: this.errors.size,
      bySeverity,
      byCategory: byCategory as Record<ErrorCategory, number>,
      topErrors,
      errorRate,
      trend,
    };
  }

  /**
   * Resolve error group
   */
  resolveGroup(fingerprint: string): boolean {
    const group = this.groups.get(fingerprint);
    if (!group) return false;

    group.resolved = true;
    this.emit('resolved', group);
    return true;
  }

  /**
   * Unresolve error group
   */
  unresolveGroup(fingerprint: string): boolean {
    const group = this.groups.get(fingerprint);
    if (!group) return false;

    group.resolved = false;
    return true;
  }

  /**
   * Clear all errors
   */
  clear(): void {
    this.errors.clear();
    this.groups.clear();
    this.recentErrors = [];
    this.errorCounts = [];
  }

  /**
   * Add filter pattern
   */
  addFilterPattern(pattern: RegExp): void {
    this.config.filterPatterns.push(pattern);
  }

  /**
   * Remove filter pattern
   */
  removeFilterPattern(pattern: RegExp): void {
    const index = this.config.filterPatterns.indexOf(pattern);
    if (index > -1) {
      this.config.filterPatterns.splice(index, 1);
    }
  }
}

// Singleton instance
let errorReporter: ErrorReporter | null = null;

export function getErrorReporter(): ErrorReporter {
  if (!errorReporter) {
    errorReporter = new ErrorReporter();
  }
  return errorReporter;
}

export default ErrorReporter;
