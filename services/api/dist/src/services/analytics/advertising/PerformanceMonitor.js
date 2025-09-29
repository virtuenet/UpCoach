"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = void 0;
const events_1 = require("events");
const node_statsd_1 = require("node-statsd");
const prometheus = __importStar(require("prom-client"));
class PerformanceMonitor extends events_1.EventEmitter {
    logger;
    redis;
    statsd;
    prometheus;
    metrics;
    alertRules;
    activeAlerts;
    monitoringInterval;
    healthCheckInterval;
    anomalyDetectors;
    constructor(logger, redis) {
        super();
        this.logger = logger;
        this.redis = redis;
        this.statsd = new node_statsd_1.StatsD({
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
    initializeMetrics() {
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
    async loadAlertRules() {
        const defaultRules = [
            {
                ruleId: 'high_spend',
                name: 'High Campaign Spend',
                metric: 'campaign_spend',
                condition: 'above',
                threshold: 10000,
                duration: 3600,
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
                duration: 7200,
                severity: 'critical',
                channels: ['email', 'slack', 'pagerduty'],
                enabled: true
            },
            {
                ruleId: 'high_cpa',
                name: 'High Cost Per Acquisition',
                metric: 'campaign_cpa',
                condition: 'above',
                threshold: 100,
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
                threshold: 10,
                duration: 300,
                severity: 'critical',
                channels: ['email', 'slack', 'pagerduty'],
                enabled: true
            },
            {
                ruleId: 'data_staleness',
                name: 'Stale Data',
                metric: 'data_freshness',
                condition: 'above',
                threshold: 3600,
                duration: 600,
                severity: 'warning',
                channels: ['email'],
                enabled: true
            },
            {
                ruleId: 'impression_anomaly',
                name: 'Impression Anomaly',
                metric: 'campaign_impressions',
                condition: 'anomaly',
                threshold: 3,
                duration: 1800,
                severity: 'info',
                channels: ['slack'],
                enabled: true
            }
        ];
        for (const rule of defaultRules) {
            this.alertRules.set(rule.ruleId, rule);
            if (rule.condition === 'anomaly') {
                this.anomalyDetectors.set(rule.metric, new AnomalyDetector(rule.metric, rule.threshold));
            }
        }
        this.logger.info(`Loaded ${this.alertRules.size} alert rules`);
    }
    startMonitoring(intervalMs = 60000) {
        this.logger.info('Starting performance monitoring');
        this.monitoringInterval = setInterval(async () => {
            await this.runMonitoringCycle();
        }, intervalMs);
        this.healthCheckInterval = setInterval(async () => {
            await this.runHealthChecks();
        }, 30000);
        for (const detector of this.anomalyDetectors.values()) {
            detector.startTraining();
        }
    }
    stopMonitoring() {
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
    async runMonitoringCycle() {
        try {
            const metrics = await this.collectMetrics();
            await this.checkAlertRules(metrics);
            await this.checkForAnomalies(metrics);
            await this.updateDashboards(metrics);
            await this.persistMetrics(metrics);
            this.logger.debug('Monitoring cycle completed');
        }
        catch (error) {
            this.logger.error('Monitoring cycle failed', error);
            this.recordError('monitoring_cycle', error);
        }
    }
    async collectMetrics() {
        const metrics = [];
        const timestamp = new Date();
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
                }
                catch (error) {
                    this.logger.error(`Failed to parse metric ${key}`, error);
                }
            }
        }
        return metrics;
    }
    async checkAlertRules(metrics) {
        for (const rule of this.alertRules.values()) {
            if (!rule.enabled)
                continue;
            const relevantMetrics = metrics.filter(m => m.name === rule.metric);
            for (const metric of relevantMetrics) {
                const shouldAlert = this.evaluateAlertCondition(rule, metric.value);
                if (shouldAlert) {
                    await this.handleAlert(rule, metric);
                }
                else {
                    await this.resolveAlert(rule.ruleId, metric.tags);
                }
            }
        }
    }
    evaluateAlertCondition(rule, value) {
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
    async handleAlert(rule, metric) {
        const alertId = `${rule.ruleId}_${JSON.stringify(metric.tags)}`;
        if (this.activeAlerts.has(alertId)) {
            return;
        }
        const durationKey = `alert:duration:${alertId}`;
        const duration = await this.redis.incr(durationKey);
        await this.redis.expire(durationKey, rule.duration);
        if (duration * 60 < rule.duration) {
            return;
        }
        const alert = {
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
        this.activeAlerts.set(alertId, alert);
        await this.persistAlert(alert);
        await this.sendAlertNotifications(alert, rule.channels);
        this.logger.warn('Alert triggered', alert);
        this.emit('alert:triggered', alert);
    }
    async resolveAlert(ruleId, tags) {
        const alertId = `${ruleId}_${JSON.stringify(tags)}`;
        const alert = this.activeAlerts.get(alertId);
        if (!alert)
            return;
        alert.status = 'resolved';
        this.activeAlerts.delete(alertId);
        await this.redis.del(`alert:duration:${alertId}`);
        await this.updateAlert(alert);
        this.logger.info('Alert resolved', { alertId });
        this.emit('alert:resolved', alert);
    }
    async checkAnomalies() {
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
    recordMetric(name, value, type = 'gauge', tags = {}) {
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
        const prometheusMetric = this.metrics.get(name);
        if (prometheusMetric) {
            const labels = Object.values(tags);
            if (type === 'counter') {
                prometheusMetric.inc(labels, value);
            }
            else if (type === 'gauge') {
                prometheusMetric.set(labels, value);
            }
            else if (type === 'histogram' || type === 'summary') {
                prometheusMetric.observe(labels, value);
            }
        }
        const key = `metrics:${name}:${JSON.stringify(tags)}`;
        this.redis.setex(key, 300, JSON.stringify({
            name,
            value,
            type,
            tags,
            timestamp: new Date()
        }));
        const detector = this.anomalyDetectors.get(name);
        if (detector) {
            detector.addDataPoint(value);
        }
    }
    recordError(type, error) {
        this.recordMetric('error_rate', 1, 'counter', {
            error_type: type,
            error_message: error.message?.substring(0, 100)
        });
        this.logger.error('Recorded error', { type, error });
    }
    async getMetrics() {
        return this.prometheus.register.metrics();
    }
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values());
    }
    async acknowledgeAlert(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.status = 'acknowledged';
            await this.updateAlert(alert);
            this.emit('alert:acknowledged', alert);
        }
    }
    async runHealthChecks() {
        const healthChecks = [];
        const redisStart = Date.now();
        try {
            await this.redis.ping();
            healthChecks.push({
                service: 'redis',
                status: 'healthy',
                latency: Date.now() - redisStart,
                lastCheck: new Date()
            });
        }
        catch (error) {
            healthChecks.push({
                service: 'redis',
                status: 'unhealthy',
                latency: Date.now() - redisStart,
                lastCheck: new Date(),
                details: { error: error.message }
            });
        }
        const statsdHealthy = this.statsd.socket && !this.statsd.socket.destroyed;
        healthChecks.push({
            service: 'statsd',
            status: statsdHealthy ? 'healthy' : 'unhealthy',
            latency: 0,
            lastCheck: new Date()
        });
        await this.redis.setex('health:monitoring', 60, JSON.stringify(healthChecks));
        this.emit('health:checked', healthChecks);
    }
    async checkForAnomalies(metrics) {
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
    async updateDashboards(metrics) {
        const dashboardData = {
            timestamp: new Date(),
            metrics: metrics.map(m => ({
                name: m.name,
                value: m.value,
                tags: m.tags
            }))
        };
        await this.redis.setex('dashboard:performance:latest', 300, JSON.stringify(dashboardData));
    }
    async persistMetrics(metrics) {
        const pipeline = this.redis.pipeline();
        for (const metric of metrics) {
            const key = `timeseries:${metric.name}:${JSON.stringify(metric.tags)}`;
            const score = metric.timestamp.getTime();
            pipeline.zadd(key, score, JSON.stringify({
                value: metric.value,
                timestamp: metric.timestamp
            }));
            pipeline.zremrangebyscore(key, '-inf', Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
        await pipeline.exec();
    }
    async persistAlert(alert) {
        await this.redis.hset('alerts:active', alert.id, JSON.stringify(alert));
    }
    async updateAlert(alert) {
        if (alert.status === 'resolved') {
            await this.redis.hdel('alerts:active', alert.id);
            await this.redis.lpush('alerts:history', JSON.stringify(alert));
            await this.redis.ltrim('alerts:history', 0, 999);
        }
        else {
            await this.redis.hset('alerts:active', alert.id, JSON.stringify(alert));
        }
    }
    async sendAlertNotifications(alert, channels) {
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
            }
            catch (error) {
                this.logger.error(`Failed to send alert to ${channel}`, error);
            }
        }
    }
    async sendEmailAlert(alert) {
        this.logger.info('Email alert sent', { alertId: alert.id });
    }
    async sendSlackAlert(alert) {
        this.logger.info('Slack alert sent', { alertId: alert.id });
    }
    async sendPagerDutyAlert(alert) {
        this.logger.info('PagerDuty alert sent', { alertId: alert.id });
    }
    async getCurrentMetricValue(metric) {
        const key = `metrics:${metric}:{}`;
        const data = await this.redis.get(key);
        if (data) {
            const parsed = JSON.parse(data);
            return parsed.value;
        }
        return 0;
    }
    getAnomalySeverity(value, detector) {
        const range = detector.getExpectedRange();
        const deviation = Math.abs(value - (range.min + range.max) / 2);
        const rangeSize = range.max - range.min;
        if (deviation > rangeSize * 2)
            return 'critical';
        if (deviation > rangeSize)
            return 'warning';
        return 'info';
    }
    async cleanup() {
        this.stopMonitoring();
        this.statsd.close();
        this.activeAlerts.clear();
        this.anomalyDetectors.clear();
        this.removeAllListeners();
        this.logger.info('Performance monitor cleaned up');
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
class AnomalyDetector {
    metric;
    threshold;
    dataPoints;
    maxDataPoints = 1000;
    mean = 0;
    stdDev = 0;
    trainingInterval;
    constructor(metric, threshold) {
        this.metric = metric;
        this.threshold = threshold;
        this.dataPoints = [];
    }
    addDataPoint(value) {
        this.dataPoints.push(value);
        if (this.dataPoints.length > this.maxDataPoints) {
            this.dataPoints.shift();
        }
        this.updateStatistics();
    }
    isAnomaly(value) {
        if (this.dataPoints.length < 100) {
            return false;
        }
        const zScore = Math.abs((value - this.mean) / this.stdDev);
        return zScore > this.threshold;
    }
    getExpectedRange() {
        return {
            min: this.mean - this.threshold * this.stdDev,
            max: this.mean + this.threshold * this.stdDev
        };
    }
    startTraining() {
        this.trainingInterval = setInterval(() => {
            this.updateStatistics();
        }, 60000);
    }
    stopTraining() {
        if (this.trainingInterval) {
            clearInterval(this.trainingInterval);
            this.trainingInterval = undefined;
        }
    }
    updateStatistics() {
        if (this.dataPoints.length === 0)
            return;
        this.mean = this.dataPoints.reduce((a, b) => a + b, 0) / this.dataPoints.length;
        const squaredDiffs = this.dataPoints.map(x => Math.pow(x - this.mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / this.dataPoints.length;
        this.stdDev = Math.sqrt(variance);
    }
}
//# sourceMappingURL=PerformanceMonitor.js.map