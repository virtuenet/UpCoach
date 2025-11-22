/**
 * Performance Monitoring and Alerting System
 *
 * Monitors advertising campaign performance and system health
 * Features:
 * - Real-time metric monitoring
 * - Anomaly detection
 * - Alert management
 * - Performance optimization recommendations
 * - System health tracking
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { Logger } from 'winston';
import { StatsD } from 'node-statsd';
import * as prometheus from 'prom-client';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
  type: 'gauge' | 'counter' | 'histogram' | 'summary';
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  title: string;
  message: string;
  metric: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  status: 'active' | 'resolved' | 'acknowledged';
  metadata: Record<string, any>;
}

export interface AlertRule {
  ruleId: string;
  name: string;
  metric: string;
  condition: 'above' | 'below' | 'equals' | 'anomaly';
  threshold: number;
  duration: number; // Seconds the condition must be true
  severity: 'critical' | 'warning' | 'info';
  channels: string[]; // Notification channels
  enabled: boolean;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  lastCheck: Date;
  details?: Record<string, any>;
}

export class PerformanceMonitor extends EventEmitter {
  private logger: Logger;
  private redis: Redis;
  private statsd: StatsD;
  private prometheus: typeof prometheus;
  private metrics: Map<string, any>;
  private alertRules: Map<string, AlertRule>;
  private activeAlerts: Map<string, Alert>;
  private monitoringInterval?: NodeJS.Timer;
  private healthCheckInterval?: NodeJS.Timer;
  private anomalyDetectors: Map<string, AnomalyDetector>;

  constructor(logger: Logger, redis: Redis) {
    super();
    this.logger = logger;
    this.redis = redis;
    this.statsd = new StatsD({
      host: process.env.STATSD_HOST || 'localhost',
      port: parseInt(process.env.STATSD_PORT || '8125'),
      prefix: 'upcoach.ads.'
    });
    this.prometheus = prometheus;
    this.metrics = new Map();
    this.alertRules = new Map();
    this.activeAlerts = new Map();
    this.anomalyDetectors = new Map();

    this.initializeMetrics();
    this.loadAlertRules();
  }

  /**
   * Initialize Prometheus metrics
   */
  private initializeMetrics(): void {
    // Campaign performance metrics
    this.metrics.set('campaign_impressions', new this.prometheus.Counter({
      name: 'ads_campaign_impressions_total',
      help: 'Total number of impressions',
      labelNames: ['platform', 'campaign_id']
    }));

    this.metrics.set('campaign_clicks', new this.prometheus.Counter({
      name: 'ads_campaign_clicks_total',
      help: 'Total number of clicks',
      labelNames: ['platform', 'campaign_id']
    }));

    this.metrics.set('campaign_spend', new this.prometheus.Gauge({
      name: 'ads_campaign_spend_dollars',
      help: 'Campaign spend in dollars',
      labelNames: ['platform', 'campaign_id']
    }));

    this.metrics.set('campaign_conversions', new this.prometheus.Counter({
      name: 'ads_campaign_conversions_total',
      help: 'Total number of conversions',
      labelNames: ['platform', 'campaign_id']
    }));

    this.metrics.set('campaign_roas', new this.prometheus.Gauge({
      name: 'ads_campaign_roas',
      help: 'Return on ad spend',
      labelNames: ['platform', 'campaign_id']
    }));

    // System metrics
    this.metrics.set('api_latency', new this.prometheus.Histogram({
      name: 'ads_api_latency_seconds',
      help: 'API request latency',
      labelNames: ['platform', 'endpoint'],
      buckets: [0.1, 0.5, 1, 2, 5, 10]
    }));

    this.metrics.set('sync_duration', new this.prometheus.Histogram({
      name: 'ads_sync_duration_seconds',
      help: 'Data sync duration',
      labelNames: ['platform'],
      buckets: [1, 5, 10, 30, 60, 120]
    }));

    this.metrics.set('error_rate', new this.prometheus.Counter({
      name: 'ads_errors_total',
      help: 'Total number of errors',
      labelNames: ['platform', 'error_type']
    }));

    // Data quality metrics
    this.metrics.set('data_freshness', new this.prometheus.Gauge({
      name: 'ads_data_freshness_seconds',
      help: 'Time since last data update',
      labelNames: ['platform']
    }));

    this.metrics.set('data_completeness', new this.prometheus.Gauge({
      name: 'ads_data_completeness_ratio',
      help: 'Ratio of complete data records',
      labelNames: ['platform']
    }));

    // Register metrics
    this.prometheus.register.registerMetric(this.metrics.get('campaign_impressions'));
    this.prometheus.register.registerMetric(this.metrics.get('campaign_clicks'));
    this.prometheus.register.registerMetric(this.metrics.get('campaign_spend'));
    this.prometheus.register.registerMetric(this.metrics.get('campaign_conversions'));
    this.prometheus.register.registerMetric(this.metrics.get('campaign_roas'));
    this.prometheus.register.registerMetric(this.metrics.get('api_latency'));
    this.prometheus.register.registerMetric(this.metrics.get('sync_duration'));
    this.prometheus.register.registerMetric(this.metrics.get('error_rate'));
    this.prometheus.register.registerMetric(this.metrics.get('data_freshness'));
    this.prometheus.register.registerMetric(this.metrics.get('data_completeness'));

    this.logger.info('Performance metrics initialized');
  }

  /**
   * Load alert rules from configuration
   */
  private async loadAlertRules(): Promise<void> {
    // Default alert rules
    const defaultRules: AlertRule[] = [
      {
        ruleId: 'high_spend',
        name: 'High Campaign Spend',
        metric: 'campaign_spend',
        condition: 'above',
        threshold: 10000, // $10,000
        duration: 3600, // 1 hour
        severity: 'warning',
        channels: ['email', 'slack'],
        enabled: true
      },
      {
        ruleId: 'low_roas',
        name: 'Low ROAS',
        metric: 'campaign_roas',
        condition: 'below',
        threshold: 1.5,
        duration: 7200, // 2 hours
        severity: 'critical',
        channels: ['email', 'slack', 'pagerduty'],
        enabled: true
      },
      {
        ruleId: 'high_cpa',
        name: 'High Cost Per Acquisition',
        metric: 'campaign_cpa',
        condition: 'above',
        threshold: 100, // $100
        duration: 3600,
        severity: 'warning',
        channels: ['email'],
        enabled: true
      },
      {
        ruleId: 'api_errors',
        name: 'High API Error Rate',
        metric: 'error_rate',
        condition: 'above',
        threshold: 10, // 10 errors per minute
        duration: 300, // 5 minutes
        severity: 'critical',
        channels: ['email', 'slack', 'pagerduty'],
        enabled: true
      },
      {
        ruleId: 'data_staleness',
        name: 'Stale Data',
        metric: 'data_freshness',
        condition: 'above',
        threshold: 3600, // 1 hour
        duration: 600, // 10 minutes
        severity: 'warning',
        channels: ['email'],
        enabled: true
      },
      {
        ruleId: 'impression_anomaly',
        name: 'Impression Anomaly',
        metric: 'campaign_impressions',
        condition: 'anomaly',
        threshold: 3, // 3 standard deviations
        duration: 1800, // 30 minutes
        severity: 'info',
        channels: ['slack'],
        enabled: true
      }
    ];

    for (const rule of defaultRules) {
      this.alertRules.set(rule.ruleId, rule);

      // Initialize anomaly detector if needed
      if (rule.condition === 'anomaly') {
        this.anomalyDetectors.set(rule.metric, new AnomalyDetector(
          rule.metric,
          rule.threshold
        ));
      }
    }

    this.logger.info(`Loaded ${this.alertRules.size} alert rules`);
  }

  /**
   * Start monitoring
   */
  public startMonitoring(intervalMs: number = 60000): void {
    this.logger.info('Starting performance monitoring');

    this.monitoringInterval = setInterval(async () => {
      await this.runMonitoringCycle();
    }, intervalMs);

    this.healthCheckInterval = setInterval(async () => {
      await this.runHealthChecks();
    }, 30000); // Health checks every 30 seconds

    // Start anomaly detection training
    for (const detector of this.anomalyDetectors.values()) {
      detector.startTraining();
    }
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    for (const detector of this.anomalyDetectors.values()) {
      detector.stopTraining();
    }

    this.logger.info('Performance monitoring stopped');
  }

  /**
   * Run monitoring cycle
   */
  private async runMonitoringCycle(): Promise<void> {
    try {
      // Collect current metrics
      const metrics = await this.collectMetrics();

      // Check alert rules
      await this.checkAlertRules(metrics);

      // Check for anomalies
      await this.checkForAnomalies(metrics);

      // Update dashboards
      await this.updateDashboards(metrics);

      // Send to time-series database
      await this.persistMetrics(metrics);

      this.logger.debug('Monitoring cycle completed');
    } catch (error) {
      this.logger.error('Monitoring cycle failed', error);
      this.recordError('monitoring_cycle', error);
    }
  }

  /**
   * Collect current metrics
   */
  private async collectMetrics(): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];
    const timestamp = new Date();

    // Collect from Redis
    const keys = await this.redis.keys('metrics:*');

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          metrics.push({
            name: parsed.name,
            value: parsed.value,
            timestamp,
            tags: parsed.tags || {},
            type: parsed.type || 'gauge'
          });
        } catch (error) {
          this.logger.error(`Failed to parse metric ${key}`, error);
        }
      }
    }

    return metrics;
  }

  /**
   * Check alert rules against current metrics
   */
  private async checkAlertRules(metrics: PerformanceMetric[]): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      const relevantMetrics = metrics.filter(m => m.name === rule.metric);

      for (const metric of relevantMetrics) {
        const shouldAlert = this.evaluateAlertCondition(rule, metric.value);

        if (shouldAlert) {
          await this.handleAlert(rule, metric);
        } else {
          await this.resolveAlert(rule.ruleId, metric.tags);
        }
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateAlertCondition(rule: AlertRule, value: number): boolean {
    switch (rule.condition) {
      case 'above':
        return value > rule.threshold;
      case 'below':
        return value < rule.threshold;
      case 'equals':
        return Math.abs(value - rule.threshold) < 0.001;
      case 'anomaly':
        const detector = this.anomalyDetectors.get(rule.metric);
        return detector ? detector.isAnomaly(value) : false;
      default:
        return false;
    }
  }

  /**
   * Handle alert trigger
   */
  private async handleAlert(rule: AlertRule, metric: PerformanceMetric): Promise<void> {
    const alertId = `${rule.ruleId}_${JSON.stringify(metric.tags)}`;

    // Check if alert is already active
    if (this.activeAlerts.has(alertId)) {
      return;
    }

    // Check duration requirement
    const durationKey = `alert:duration:${alertId}`;
    const duration = await this.redis.incr(durationKey);
    await this.redis.expire(durationKey, rule.duration);

    if (duration * 60 < rule.duration) {
      // Duration requirement not met yet
      return;
    }

    // Create alert
    const alert: Alert = {
      id: alertId,
      severity: rule.severity,
      type: rule.name,
      title: `${rule.name} Alert`,
      message: `${rule.metric} is ${rule.condition} threshold: ${metric.value} (threshold: ${rule.threshold})`,
      metric: rule.metric,
      threshold: rule.threshold,
      currentValue: metric.value,
      timestamp: new Date(),
      status: 'active',
      metadata: {
        tags: metric.tags,
        rule: rule.ruleId
      }
    };

    // Store alert
    this.activeAlerts.set(alertId, alert);
    await this.persistAlert(alert);

    // Send notifications
    await this.sendAlertNotifications(alert, rule.channels);

    this.logger.warn('Alert triggered', alert);
    this.emit('alert:triggered', alert);
  }

  /**
   * Resolve an alert
   */
  private async resolveAlert(ruleId: string, tags: Record<string, string>): Promise<void> {
    const alertId = `${ruleId}_${JSON.stringify(tags)}`;
    const alert = this.activeAlerts.get(alertId);

    if (!alert) return;

    alert.status = 'resolved';
    this.activeAlerts.delete(alertId);

    // Clear duration tracking
    await this.redis.del(`alert:duration:${alertId}`);

    // Update persisted alert
    await this.updateAlert(alert);

    this.logger.info('Alert resolved', { alertId });
    this.emit('alert:resolved', alert);
  }

  /**
   * Check for anomalies
   */
  public async checkAnomalies(): Promise<any[]> {
    const anomalies = [];

    for (const [metric, detector] of this.anomalyDetectors) {
      const currentValue = await this.getCurrentMetricValue(metric);

      if (detector.isAnomaly(currentValue)) {
        anomalies.push({
          id: `anomaly_${metric}_${Date.now()}`,
          metric,
          value: currentValue,
          expectedRange: detector.getExpectedRange(),
          severity: this.getAnomalySeverity(currentValue, detector),
          timestamp: new Date(),
          type: 'anomaly',
          message: `Unusual ${metric} detected: ${currentValue}`
        });
      }
    }

    return anomalies;
  }

  /**
   * Record a metric value
   */
  public recordMetric(
    name: string,
    value: number,
    type: PerformanceMetric['type'] = 'gauge',
    tags: Record<string, string> = {}
  ): void {
    // Send to StatsD
    switch (type) {
      case 'counter':
        this.statsd.increment(name, value, tags);
        break;
      case 'gauge':
        this.statsd.gauge(name, value, tags);
        break;
      case 'histogram':
        this.statsd.histogram(name, value, tags);
        break;
      case 'summary':
        this.statsd.timing(name, value, tags);
        break;
    }

    // Update Prometheus metric
    const prometheusMetric = this.metrics.get(name);
    if (prometheusMetric) {
      const labels = Object.values(tags);
      if (type === 'counter') {
        prometheusMetric.inc(labels, value);
      } else if (type === 'gauge') {
        prometheusMetric.set(labels, value);
      } else if (type === 'histogram' || type === 'summary') {
        prometheusMetric.observe(labels, value);
      }
    }

    // Store in Redis for real-time access
    const key = `metrics:${name}:${JSON.stringify(tags)}`;
    this.redis.setex(key, 300, JSON.stringify({
      name,
      value,
      type,
      tags,
      timestamp: new Date()
    }));

    // Feed to anomaly detector if exists
    const detector = this.anomalyDetectors.get(name);
    if (detector) {
      detector.addDataPoint(value);
    }
  }

  /**
   * Record an error
   */
  public recordError(type: string, error: unknown): void {
    this.recordMetric('error_rate', 1, 'counter', {
      error_type: type,
      error_message: error.message?.substring(0, 100)
    });

    this.logger.error('Recorded error', { type, error });
  }

  /**
   * Get metrics for export
   */
  public async getMetrics(): Promise<string> {
    return this.prometheus.register.metrics();
  }

  /**
   * Get current alerts
   */
  public getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Acknowledge an alert
   */
  public async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);

    if (alert) {
      alert.status = 'acknowledged';
      await this.updateAlert(alert);
      this.emit('alert:acknowledged', alert);
    }
  }

  /**
   * Run health checks
   */
  private async runHealthChecks(): Promise<void> {
    const healthChecks: HealthCheck[] = [];

    // Check Redis connection
    const redisStart = Date.now();
    try {
      await this.redis.ping();
      healthChecks.push({
        service: 'redis',
        status: 'healthy',
        latency: Date.now() - redisStart,
        lastCheck: new Date()
      });
    } catch (error) {
      healthChecks.push({
        service: 'redis',
        status: 'unhealthy',
        latency: Date.now() - redisStart,
        lastCheck: new Date(),
        details: { error: error.message }
      });
    }

    // Check StatsD connection
    const statsdHealthy = this.statsd.socket && !this.statsd.socket.destroyed;
    healthChecks.push({
      service: 'statsd',
      status: statsdHealthy ? 'healthy' : 'unhealthy',
      latency: 0,
      lastCheck: new Date()
    });

    // Store health status
    await this.redis.setex(
      'health:monitoring',
      60,
      JSON.stringify(healthChecks)
    );

    // Emit health status
    this.emit('health:checked', healthChecks);
  }

  /**
   * Helper methods
   */

  private async checkForAnomalies(metrics: PerformanceMetric[]): Promise<void> {
    for (const metric of metrics) {
      const detector = this.anomalyDetectors.get(metric.name);

      if (detector && detector.isAnomaly(metric.value)) {
        this.emit('anomaly:detected', {
          metric: metric.name,
          value: metric.value,
          expectedRange: detector.getExpectedRange(),
          timestamp: metric.timestamp,
          tags: metric.tags
        });
      }
    }
  }

  private async updateDashboards(metrics: PerformanceMetric[]): Promise<void> {
    // Aggregate metrics for dashboard
    const dashboardData = {
      timestamp: new Date(),
      metrics: metrics.map(m => ({
        name: m.name,
        value: m.value,
        tags: m.tags
      }))
    };

    await this.redis.setex(
      'dashboard:performance:latest',
      300,
      JSON.stringify(dashboardData)
    );
  }

  private async persistMetrics(metrics: PerformanceMetric[]): Promise<void> {
    // Store in time-series format
    const pipeline = this.redis.pipeline();

    for (const metric of metrics) {
      const key = `timeseries:${metric.name}:${JSON.stringify(metric.tags)}`;
      const score = metric.timestamp.getTime();
      pipeline.zadd(key, score, JSON.stringify({
        value: metric.value,
        timestamp: metric.timestamp
      }));

      // Expire old data (keep 30 days)
      pipeline.zremrangebyscore(
        key,
        '-inf',
        Date.now() - 30 * 24 * 60 * 60 * 1000
      );
    }

    await pipeline.exec();
  }

  private async persistAlert(alert: Alert): Promise<void> {
    await this.redis.hset(
      'alerts:active',
      alert.id,
      JSON.stringify(alert)
    );
  }

  private async updateAlert(alert: Alert): Promise<void> {
    if (alert.status === 'resolved') {
      await this.redis.hdel('alerts:active', alert.id);
      await this.redis.lpush(
        'alerts:history',
        JSON.stringify(alert)
      );
      await this.redis.ltrim('alerts:history', 0, 999); // Keep last 1000
    } else {
      await this.redis.hset(
        'alerts:active',
        alert.id,
        JSON.stringify(alert)
      );
    }
  }

  private async sendAlertNotifications(
    alert: Alert,
    channels: string[]
  ): Promise<void> {
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailAlert(alert);
            break;
          case 'slack':
            await this.sendSlackAlert(alert);
            break;
          case 'pagerduty':
            await this.sendPagerDutyAlert(alert);
            break;
          default:
            this.logger.warn(`Unknown notification channel: ${channel}`);
        }
      } catch (error) {
        this.logger.error(`Failed to send alert to ${channel}`, error);
      }
    }
  }

  private async sendEmailAlert(alert: Alert): Promise<void> {
    // Implement email notification
    this.logger.info('Email alert sent', { alertId: alert.id });
  }

  private async sendSlackAlert(alert: Alert): Promise<void> {
    // Implement Slack notification
    this.logger.info('Slack alert sent', { alertId: alert.id });
  }

  private async sendPagerDutyAlert(alert: Alert): Promise<void> {
    // Implement PagerDuty notification
    this.logger.info('PagerDuty alert sent', { alertId: alert.id });
  }

  private async getCurrentMetricValue(metric: string): Promise<number> {
    const key = `metrics:${metric}:{}`;
    const data = await this.redis.get(key);

    if (data) {
      const parsed = JSON.parse(data);
      return parsed.value;
    }

    return 0;
  }

  private getAnomalySeverity(value: number, detector: AnomalyDetector): string {
    const range = detector.getExpectedRange();
    const deviation = Math.abs(value - (range.min + range.max) / 2);
    const rangeSize = range.max - range.min;

    if (deviation > rangeSize * 2) return 'critical';
    if (deviation > rangeSize) return 'warning';
    return 'info';
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    this.stopMonitoring();
    this.statsd.close();
    this.activeAlerts.clear();
    this.anomalyDetectors.clear();
    this.removeAllListeners();
    this.logger.info('Performance monitor cleaned up');
  }
}

/**
 * Anomaly detector using statistical methods
 */
class AnomalyDetector {
  private metric: string;
  private threshold: number;
  private dataPoints: number[];
  private maxDataPoints: number = 1000;
  private mean: number = 0;
  private stdDev: number = 0;
  private trainingInterval?: NodeJS.Timer;

  constructor(metric: string, threshold: number) {
    this.metric = metric;
    this.threshold = threshold;
    this.dataPoints = [];
  }

  public addDataPoint(value: number): void {
    this.dataPoints.push(value);

    if (this.dataPoints.length > this.maxDataPoints) {
      this.dataPoints.shift();
    }

    this.updateStatistics();
  }

  public isAnomaly(value: number): boolean {
    if (this.dataPoints.length < 100) {
      return false; // Not enough data for reliable detection
    }

    const zScore = Math.abs((value - this.mean) / this.stdDev);
    return zScore > this.threshold;
  }

  public getExpectedRange(): { min: number; max: number } {
    return {
      min: this.mean - this.threshold * this.stdDev,
      max: this.mean + this.threshold * this.stdDev
    };
  }

  public startTraining(): void {
    this.trainingInterval = setInterval(() => {
      this.updateStatistics();
    }, 60000); // Update statistics every minute
  }

  public stopTraining(): void {
    if (this.trainingInterval) {
      clearInterval(this.trainingInterval);
      this.trainingInterval = undefined;
    }
  }

  private updateStatistics(): void {
    if (this.dataPoints.length === 0) return;

    // Calculate mean
    this.mean = this.dataPoints.reduce((a, b) => a + b, 0) / this.dataPoints.length;

    // Calculate standard deviation
    const squaredDiffs = this.dataPoints.map(x => Math.pow(x - this.mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / this.dataPoints.length;
    this.stdDev = Math.sqrt(variance);
  }
}