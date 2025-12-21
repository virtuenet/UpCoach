/**
 * Alerting Service
 *
 * Real-time alerting system for monitoring critical events,
 * threshold breaches, and system health issues.
 */

import { EventEmitter } from 'events';

// Alert severity
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

// Alert status
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'silenced';

// Alert channel
export type AlertChannel = 'email' | 'slack' | 'pagerduty' | 'webhook' | 'sms';

// Alert rule condition
export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'contains';
  threshold: number | string;
  window: number; // in seconds
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count' | 'p95' | 'p99';
}

// Alert rule
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: AlertSeverity;
  conditions: AlertCondition[];
  channels: AlertChannel[];
  cooldown: number; // in seconds
  tags: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

// Alert instance
export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  context: Record<string, unknown>;
  triggeredAt: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  resolvedAt?: number;
  resolvedBy?: string;
  silencedUntil?: number;
  notificationsSent: AlertNotification[];
}

// Alert notification
export interface AlertNotification {
  channel: AlertChannel;
  sentAt: number;
  success: boolean;
  error?: string;
}

// Alerting config
export interface AlertingConfig {
  enabled: boolean;
  defaultCooldown: number;
  maxActiveAlerts: number;
  retentionDays: number;
  channels: {
    [key in AlertChannel]?: ChannelConfig;
  };
}

// Channel config
export interface ChannelConfig {
  enabled: boolean;
  config: Record<string, unknown>;
}

// Alert statistics
export interface AlertStats {
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  silenced: number;
  bySeverity: Record<AlertSeverity, number>;
  avgResolutionTime: number;
  topRules: Array<{ ruleId: string; ruleName: string; count: number }>;
}

export class AlertingService extends EventEmitter {
  private config: AlertingConfig;
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private lastTriggered: Map<string, number> = new Map();
  private metricValues: Map<string, { timestamp: number; value: number }[]> = new Map();

  constructor(config?: Partial<AlertingConfig>) {
    super();
    this.config = {
      enabled: true,
      defaultCooldown: 300, // 5 minutes
      maxActiveAlerts: 1000,
      retentionDays: 30,
      channels: {},
      ...config,
    };

    this.registerDefaultRules();
  }

  /**
   * Register default alerting rules
   */
  private registerDefaultRules(): void {
    // High error rate
    this.addRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      description: 'Error rate exceeds 5% over 5 minutes',
      enabled: true,
      severity: 'high',
      conditions: [
        {
          metric: 'http.error_rate',
          operator: 'gt',
          threshold: 0.05,
          window: 300,
          aggregation: 'avg',
        },
      ],
      channels: ['slack', 'email'],
      cooldown: 600,
      tags: { category: 'availability' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // High latency
    this.addRule({
      id: 'high-latency',
      name: 'High API Latency',
      description: 'P95 latency exceeds 2 seconds',
      enabled: true,
      severity: 'medium',
      conditions: [
        {
          metric: 'http.latency',
          operator: 'gt',
          threshold: 2000,
          window: 300,
          aggregation: 'p95',
        },
      ],
      channels: ['slack'],
      cooldown: 300,
      tags: { category: 'performance' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Database connection pool exhausted
    this.addRule({
      id: 'db-pool-exhausted',
      name: 'Database Pool Exhausted',
      description: 'Database connection pool utilization exceeds 90%',
      enabled: true,
      severity: 'critical',
      conditions: [
        {
          metric: 'db.pool_utilization',
          operator: 'gt',
          threshold: 0.9,
          window: 60,
          aggregation: 'avg',
        },
      ],
      channels: ['slack', 'pagerduty'],
      cooldown: 300,
      tags: { category: 'database' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Memory usage high
    this.addRule({
      id: 'high-memory',
      name: 'High Memory Usage',
      description: 'Memory usage exceeds 85%',
      enabled: true,
      severity: 'high',
      conditions: [
        {
          metric: 'system.memory_usage',
          operator: 'gt',
          threshold: 0.85,
          window: 120,
          aggregation: 'avg',
        },
      ],
      channels: ['slack'],
      cooldown: 600,
      tags: { category: 'infrastructure' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // AI service errors
    this.addRule({
      id: 'ai-service-errors',
      name: 'AI Service Errors',
      description: 'AI service error count exceeds 10 in 5 minutes',
      enabled: true,
      severity: 'high',
      conditions: [
        {
          metric: 'ai.errors',
          operator: 'gt',
          threshold: 10,
          window: 300,
          aggregation: 'count',
        },
      ],
      channels: ['slack', 'email'],
      cooldown: 600,
      tags: { category: 'ai' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  /**
   * Add an alerting rule
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    this.emit('rule:added', rule);
  }

  /**
   * Update a rule
   */
  updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    const updated = { ...rule, ...updates, updatedAt: Date.now() };
    this.rules.set(ruleId, updated);
    this.emit('rule:updated', updated);
    return true;
  }

  /**
   * Delete a rule
   */
  deleteRule(ruleId: string): boolean {
    const result = this.rules.delete(ruleId);
    if (result) {
      this.emit('rule:deleted', ruleId);
    }
    return result;
  }

  /**
   * Get all rules
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): AlertRule | null {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Record a metric value
   */
  recordMetric(metric: string, value: number): void {
    if (!this.metricValues.has(metric)) {
      this.metricValues.set(metric, []);
    }

    const values = this.metricValues.get(metric)!;
    values.push({ timestamp: Date.now(), value });

    // Keep only last hour of data
    const cutoff = Date.now() - 3600000;
    while (values.length > 0 && values[0].timestamp < cutoff) {
      values.shift();
    }

    // Check rules
    this.checkRulesForMetric(metric);
  }

  /**
   * Check rules for a specific metric
   */
  private checkRulesForMetric(metric: string): void {
    if (!this.config.enabled) return;

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const matchingConditions = rule.conditions.filter((c) => c.metric === metric);
      if (matchingConditions.length === 0) continue;

      // Check cooldown
      const lastTriggered = this.lastTriggered.get(rule.id) || 0;
      if (Date.now() - lastTriggered < rule.cooldown * 1000) continue;

      // Check all conditions
      const allConditionsMet = rule.conditions.every((condition) =>
        this.evaluateCondition(condition)
      );

      if (allConditionsMet) {
        this.triggerAlert(rule);
      }
    }
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(condition: AlertCondition): boolean {
    const values = this.metricValues.get(condition.metric) || [];
    const cutoff = Date.now() - condition.window * 1000;
    const windowValues = values
      .filter((v) => v.timestamp >= cutoff)
      .map((v) => v.value);

    if (windowValues.length === 0) return false;

    const aggregatedValue = this.aggregate(windowValues, condition.aggregation || 'avg');
    const threshold = typeof condition.threshold === 'number' ? condition.threshold : parseFloat(condition.threshold);

    switch (condition.operator) {
      case 'gt':
        return aggregatedValue > threshold;
      case 'gte':
        return aggregatedValue >= threshold;
      case 'lt':
        return aggregatedValue < threshold;
      case 'lte':
        return aggregatedValue <= threshold;
      case 'eq':
        return aggregatedValue === threshold;
      case 'neq':
        return aggregatedValue !== threshold;
      default:
        return false;
    }
  }

  /**
   * Aggregate values
   */
  private aggregate(values: number[], aggregation: string): number {
    if (values.length === 0) return 0;

    switch (aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      case 'p95':
        return this.percentile(values, 0.95);
      case 'p99':
        return this.percentile(values, 0.99);
      case 'avg':
      default:
        return values.reduce((a, b) => a + b, 0) / values.length;
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(p * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: AlertRule): Promise<void> {
    const alertId = this.generateId();

    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      status: 'active',
      title: rule.name,
      message: rule.description,
      context: {
        conditions: rule.conditions,
        tags: rule.tags,
      },
      triggeredAt: Date.now(),
      notificationsSent: [],
    };

    this.alerts.set(alertId, alert);
    this.lastTriggered.set(rule.id, Date.now());

    // Send notifications
    await this.sendNotifications(alert, rule.channels);

    // Emit event
    this.emit('alert:triggered', alert);

    // Limit active alerts
    this.cleanupOldAlerts();

    console.log(`Alert triggered: ${rule.name} (${alertId})`);
  }

  /**
   * Send notifications to channels
   */
  private async sendNotifications(alert: Alert, channels: AlertChannel[]): Promise<void> {
    for (const channel of channels) {
      const channelConfig = this.config.channels[channel];
      if (!channelConfig?.enabled) continue;

      const notification: AlertNotification = {
        channel,
        sentAt: Date.now(),
        success: false,
      };

      try {
        await this.sendToChannel(channel, alert);
        notification.success = true;
      } catch (error) {
        notification.error = (error as Error).message;
      }

      alert.notificationsSent.push(notification);
    }
  }

  /**
   * Send to specific channel
   */
  private async sendToChannel(channel: AlertChannel, alert: Alert): Promise<void> {
    // In production, would integrate with actual notification services
    console.log(`[${channel.toUpperCase()}] Alert: ${alert.title} - ${alert.message}`);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== 'active') return false;

    alert.status = 'acknowledged';
    alert.acknowledgedAt = Date.now();
    alert.acknowledgedBy = userId;

    this.emit('alert:acknowledged', alert);
    return true;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, userId?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status === 'resolved') return false;

    alert.status = 'resolved';
    alert.resolvedAt = Date.now();
    alert.resolvedBy = userId;

    this.emit('alert:resolved', alert);
    return true;
  }

  /**
   * Silence an alert
   */
  silenceAlert(alertId: string, until: number): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'silenced';
    alert.silencedUntil = until;

    this.emit('alert:silenced', alert);
    return true;
  }

  /**
   * Get alerts
   */
  getAlerts(options?: {
    status?: AlertStatus;
    severity?: AlertSeverity;
    ruleId?: string;
    limit?: number;
  }): Alert[] {
    let alerts = Array.from(this.alerts.values());

    if (options?.status) {
      alerts = alerts.filter((a) => a.status === options.status);
    }

    if (options?.severity) {
      alerts = alerts.filter((a) => a.severity === options.severity);
    }

    if (options?.ruleId) {
      alerts = alerts.filter((a) => a.ruleId === options.ruleId);
    }

    // Sort by triggered time descending
    alerts.sort((a, b) => b.triggeredAt - a.triggeredAt);

    if (options?.limit) {
      alerts = alerts.slice(0, options.limit);
    }

    return alerts;
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): Alert | null {
    return this.alerts.get(alertId) || null;
  }

  /**
   * Get alert statistics
   */
  getStats(): AlertStats {
    const alerts = Array.from(this.alerts.values());

    const bySeverity: Record<AlertSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    const ruleCounts = new Map<string, { name: string; count: number }>();

    for (const alert of alerts) {
      bySeverity[alert.severity]++;

      if (alert.resolvedAt && alert.triggeredAt) {
        totalResolutionTime += alert.resolvedAt - alert.triggeredAt;
        resolvedCount++;
      }

      const ruleCount = ruleCounts.get(alert.ruleId) || { name: alert.ruleName, count: 0 };
      ruleCount.count++;
      ruleCounts.set(alert.ruleId, ruleCount);
    }

    const topRules = Array.from(ruleCounts.entries())
      .map(([ruleId, { name, count }]) => ({ ruleId, ruleName: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: alerts.length,
      active: alerts.filter((a) => a.status === 'active').length,
      acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
      resolved: alerts.filter((a) => a.status === 'resolved').length,
      silenced: alerts.filter((a) => a.status === 'silenced').length,
      bySeverity,
      avgResolutionTime: resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0,
      topRules,
    };
  }

  /**
   * Cleanup old alerts
   */
  private cleanupOldAlerts(): void {
    const cutoff = Date.now() - this.config.retentionDays * 86400000;

    for (const [id, alert] of this.alerts) {
      if (alert.status === 'resolved' && alert.resolvedAt && alert.resolvedAt < cutoff) {
        this.alerts.delete(id);
      }
    }

    // Also limit total active alerts
    if (this.alerts.size > this.config.maxActiveAlerts) {
      const sorted = Array.from(this.alerts.entries())
        .filter(([, a]) => a.status === 'resolved')
        .sort((a, b) => a[1].triggeredAt - b[1].triggeredAt);

      while (this.alerts.size > this.config.maxActiveAlerts && sorted.length > 0) {
        const [id] = sorted.shift()!;
        this.alerts.delete(id);
      }
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `alert_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let alertingService: AlertingService | null = null;

export function getAlertingService(): AlertingService {
  if (!alertingService) {
    alertingService = new AlertingService();
  }
  return alertingService;
}

export default AlertingService;
