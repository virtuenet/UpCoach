/**
 * Security Event Aggregator
 * Phase 13 Week 1
 *
 * Real-time security event aggregation from WAF, IDS, audit logs,
 * with event correlation, severity scoring, and SIEM export
 */

import EventEmitter from 'events';
import crypto from 'crypto';

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  source: 'waf' | 'ids' | 'audit' | 'ddos' | 'system';
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
  ip: string;
  details: Record<string, any>;
  tags: string[];
  fingerprint: string; // For deduplication
}

export interface CorrelatedEvent {
  id: string;
  events: SecurityEvent[];
  firstSeen: Date;
  lastSeen: Date;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  pattern: string;
  affectedUsers: string[];
  affectedIPs: string[];
}

export interface AggregatorStats {
  totalEvents: number;
  eventsLast24Hours: number;
  correlatedEvents: number;
  duplicatesFiltered: number;
  exportedToSIEM: number;
}

export class SecurityEventAggregator extends EventEmitter {
  private events: SecurityEvent[] = [];
  private correlatedEvents: Map<string, CorrelatedEvent> = new Map();
  private eventFingerprints: Set<string> = new Set();
  private stats: AggregatorStats;
  private readonly MAX_EVENTS = 100000;
  private readonly CORRELATION_WINDOW = 300000; // 5 minutes

  constructor() {
    super();

    this.stats = {
      totalEvents: 0,
      eventsLast24Hours: 0,
      correlatedEvents: 0,
      duplicatesFiltered: 0,
      exportedToSIEM: 0
    };

    this.startEventCleanup();
  }

  /**
   * Ingest security event
   */
  async ingestEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'fingerprint'>): Promise<SecurityEvent> {
    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      fingerprint: this.generateFingerprint(event),
      ...event
    };

    // Check for duplicate (within 1 minute)
    if (this.isDuplicate(securityEvent)) {
      this.stats.duplicatesFiltered++;
      return securityEvent;
    }

    this.events.push(securityEvent);
    this.eventFingerprints.add(securityEvent.fingerprint);
    this.stats.totalEvents++;

    // Limit event history
    if (this.events.length > this.MAX_EVENTS) {
      const removed = this.events.shift();
      if (removed) {
        this.eventFingerprints.delete(removed.fingerprint);
      }
    }

    // Correlate with recent events
    await this.correlateEvent(securityEvent);

    // Emit event
    this.emit('event:ingested', securityEvent);

    // Critical events trigger immediate alerts
    if (securityEvent.severity === 'critical') {
      this.emit('event:critical', securityEvent);
    }

    return securityEvent;
  }

  /**
   * Correlate event with recent events
   */
  private async correlateEvent(event: SecurityEvent): Promise<void> {
    const correlationKey = this.getCorrelationKey(event);
    const now = Date.now();

    let correlated = this.correlatedEvents.get(correlationKey);

    if (correlated) {
      // Check if within correlation window
      if (now - correlated.lastSeen.getTime() < this.CORRELATION_WINDOW) {
        correlated.events.push(event);
        correlated.lastSeen = new Date();
        correlated.count++;

        if (event.user?.id && !correlated.affectedUsers.includes(event.user.id)) {
          correlated.affectedUsers.push(event.user.id);
        }

        if (!correlated.affectedIPs.includes(event.ip)) {
          correlated.affectedIPs.push(event.ip);
        }

        // Update severity to highest
        if (this.getSeverityWeight(event.severity) > this.getSeverityWeight(correlated.severity)) {
          correlated.severity = event.severity;
        }

        this.emit('event:correlated', correlated);
      } else {
        // Window expired, create new correlation
        this.correlatedEvents.delete(correlationKey);
        this.createCorrelation(event, correlationKey);
      }
    } else {
      this.createCorrelation(event, correlationKey);
    }
  }

  /**
   * Create new correlation
   */
  private createCorrelation(event: SecurityEvent, correlationKey: string): void {
    const correlated: CorrelatedEvent = {
      id: this.generateEventId(),
      events: [event],
      firstSeen: new Date(),
      lastSeen: new Date(),
      count: 1,
      severity: event.severity,
      pattern: correlationKey,
      affectedUsers: event.user?.id ? [event.user.id] : [],
      affectedIPs: [event.ip]
    };

    this.correlatedEvents.set(correlationKey, correlated);
    this.stats.correlatedEvents++;
  }

  /**
   * Get correlation key for event
   */
  private getCorrelationKey(event: SecurityEvent): string {
    // Correlate by: source + type + (ip OR userId)
    const identifier = event.user?.id || event.ip;
    return `${event.source}:${event.type}:${identifier}`;
  }

  /**
   * Check if event is duplicate
   */
  private isDuplicate(event: SecurityEvent): boolean {
    return this.eventFingerprints.has(event.fingerprint);
  }

  /**
   * Generate event fingerprint for deduplication
   */
  private generateFingerprint(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'fingerprint'>): string {
    const data = JSON.stringify({
      source: event.source,
      type: event.type,
      ip: event.ip,
      userId: event.user?.id,
      // Include partial details to avoid exact duplicates
      detailsHash: crypto.createHash('md5').update(JSON.stringify(event.details)).digest('hex').substring(0, 8)
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Get severity weight for comparison
   */
  private getSeverityWeight(severity: SecurityEvent['severity']): number {
    const weights = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
    return weights[severity];
  }

  /**
   * Get events
   */
  getEvents(filter?: {
    source?: SecurityEvent['source'];
    severity?: SecurityEvent['severity'];
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }): SecurityEvent[] {
    let filtered = [...this.events];

    if (filter?.source) {
      filtered = filtered.filter(e => e.source === filter.source);
    }

    if (filter?.severity) {
      filtered = filtered.filter(e => e.severity === filter.severity);
    }

    if (filter?.startTime) {
      filtered = filtered.filter(e => e.timestamp >= filter.startTime!);
    }

    if (filter?.endTime) {
      filtered = filtered.filter(e => e.timestamp <= filter.endTime!);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  /**
   * Get correlated events
   */
  getCorrelatedEvents(minCount: number = 2): CorrelatedEvent[] {
    return Array.from(this.correlatedEvents.values())
      .filter(c => c.count >= minCount)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get events by IP
   */
  getEventsByIP(ip: string, limit: number = 100): SecurityEvent[] {
    return this.events
      .filter(e => e.ip === ip)
      .slice(-limit);
  }

  /**
   * Get events by user
   */
  getEventsByUser(userId: string, limit: number = 100): SecurityEvent[] {
    return this.events
      .filter(e => e.user?.id === userId)
      .slice(-limit);
  }

  /**
   * Export to SIEM (JSON format)
   */
  exportToSIEM(format: 'json' | 'cef' = 'json'): any[] {
    const exports = this.events.map(event => {
      if (format === 'json') {
        return {
          '@timestamp': event.timestamp.toISOString(),
          event_id: event.id,
          source: event.source,
          type: event.type,
          severity: event.severity,
          user: event.user,
          source_ip: event.ip,
          details: event.details,
          tags: event.tags
        };
      }

      // CEF format for Splunk, ArcSight, etc.
      return this.toCEF(event);
    });

    this.stats.exportedToSIEM += exports.length;
    return exports;
  }

  /**
   * Convert to CEF (Common Event Format)
   */
  private toCEF(event: SecurityEvent): string {
    const severity = this.getSeverityWeight(event.severity);

    return [
      'CEF:0',
      'UpCoach',
      'Security',
      '1.0',
      event.type,
      event.type.replace(/-/g, ' '),
      severity.toString(),
      `src=${event.ip}`,
      event.user ? `suser=${event.user.id}` : '',
      `msg=${JSON.stringify(event.details)}`
    ].filter(Boolean).join('|');
  }

  /**
   * Get statistics
   */
  getStats(): AggregatorStats {
    // Update last 24 hours count
    const yesterday = new Date(Date.now() - 86400000);
    this.stats.eventsLast24Hours = this.events.filter(
      e => e.timestamp >= yesterday
    ).length;

    return { ...this.stats };
  }

  /**
   * Clear old events (cleanup)
   */
  private clearOldEvents(): void {
    const cutoffTime = new Date(Date.now() - 604800000); // 7 days
    const originalLength = this.events.length;

    this.events = this.events.filter(e => e.timestamp >= cutoffTime);

    const removed = originalLength - this.events.length;
    if (removed > 0) {
      console.log(`Cleared ${removed} old security events`);
    }

    // Clear old correlations
    const now = Date.now();
    for (const [key, correlated] of this.correlatedEvents) {
      if (now - correlated.lastSeen.getTime() > this.CORRELATION_WINDOW * 2) {
        this.correlatedEvents.delete(key);
      }
    }
  }

  /**
   * Start periodic event cleanup
   */
  private startEventCleanup(): void {
    setInterval(() => {
      this.clearOldEvents();
    }, 3600000); // Every hour
  }
}

/**
 * Singleton Security Event Aggregator
 */
export class SecurityEventManager {
  private static instance: SecurityEventAggregator;

  static initialize(): void {
    if (this.instance) {
      throw new Error('Security event aggregator already initialized');
    }
    this.instance = new SecurityEventAggregator();
  }

  static getInstance(): SecurityEventAggregator {
    if (!this.instance) {
      throw new Error('Security event aggregator not initialized');
    }
    return this.instance;
  }
}
