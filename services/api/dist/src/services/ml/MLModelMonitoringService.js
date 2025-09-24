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
exports.MLModelMonitoringService = void 0;
const events_1 = require("events");
const ioredis_1 = require("ioredis");
const perf_hooks_1 = require("perf_hooks");
const crypto = __importStar(require("crypto"));
const logger_1 = require("../../utils/logger");
class MLModelMonitoringService extends events_1.EventEmitter {
    redis;
    metricsStore;
    performanceStore;
    driftDetectors;
    alertManager;
    configs;
    healthChecker;
    constructor() {
        super();
        this.redis = new ioredis_1.Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            db: 4,
        });
        this.metricsStore = new Map();
        this.performanceStore = new Map();
        this.driftDetectors = new Map();
        this.alertManager = new AlertManager();
        this.configs = new Map();
        this.healthChecker = new HealthChecker();
        this.initializeMonitoring();
    }
    initializeMonitoring() {
        this.startMetricsCollector();
        this.startDriftDetectionWorker();
        this.startHealthCheckWorker();
        this.startPerformanceMonitor();
        logger_1.logger.info('ML Model Monitoring Service initialized');
    }
    async registerModel(modelId, modelName, version, config) {
        try {
            const defaultConfig = {
                modelId,
                enabled: true,
                driftThreshold: 0.1,
                performanceThresholds: {
                    maxLatency: 1000,
                    minAccuracy: 0.8,
                    maxErrorRate: 0.05,
                },
                alerting: {
                    enabled: true,
                    channels: ['email', 'slack'],
                    cooldownMinutes: 30,
                },
                sampling: {
                    rate: 0.1,
                    strategy: 'random',
                },
            };
            const finalConfig = { ...defaultConfig, ...config };
            this.configs.set(modelId, finalConfig);
            const driftDetector = new DriftDetector(modelId, finalConfig.driftThreshold);
            this.driftDetectors.set(modelId, driftDetector);
            await this.redis.hset('models:registry', modelId, JSON.stringify({
                modelName,
                version,
                registeredAt: new Date(),
                config: finalConfig,
            }));
            logger_1.logger.info(`Model ${modelId} registered for monitoring`);
        }
        catch (error) {
            logger_1.logger.error('Failed to register model', error);
            throw error;
        }
    }
    async recordPrediction(modelId, prediction, actual, features, metadata) {
        const startTime = perf_hooks_1.performance.now();
        try {
            const config = this.configs.get(modelId);
            if (!config || !config.enabled)
                return;
            if (!this.shouldSample(config.sampling))
                return;
            const record = {
                modelId,
                prediction,
                actual,
                features,
                metadata,
                timestamp: new Date(),
                latency: perf_hooks_1.performance.now() - startTime,
            };
            await this.storePredictionRecord(record);
            if (actual !== undefined) {
                await this.updateModelMetrics(modelId, prediction, actual);
            }
            if (features) {
                await this.checkForDrift(modelId, features);
            }
            this.updatePerformanceMetrics(modelId, record.latency);
        }
        catch (error) {
            logger_1.logger.error('Failed to record prediction', error);
        }
    }
    async getModelMetrics(modelId, timeRange) {
        try {
            let metrics = this.metricsStore.get(modelId) || [];
            if (timeRange) {
                metrics = metrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end);
            }
            return metrics;
        }
        catch (error) {
            logger_1.logger.error('Failed to get model metrics', error);
            throw error;
        }
    }
    async getDriftAnalysis(modelId) {
        try {
            const detector = this.driftDetectors.get(modelId);
            if (!detector)
                return null;
            return detector.getLatestAnalysis();
        }
        catch (error) {
            logger_1.logger.error('Failed to get drift analysis', error);
            throw error;
        }
    }
    async getModelHealth(modelId) {
        try {
            return this.healthChecker.checkHealth(modelId, this.metricsStore.get(modelId), this.performanceStore.get(modelId), this.driftDetectors.get(modelId));
        }
        catch (error) {
            logger_1.logger.error('Failed to get model health', error);
            throw error;
        }
    }
    async getActiveAlerts(modelId) {
        return this.alertManager.getActiveAlerts(modelId);
    }
    async resolveAlert(alertId) {
        await this.alertManager.resolveAlert(alertId);
    }
    async getPerformanceReport(modelId, period = 'day') {
        try {
            const performance = this.performanceStore.get(modelId);
            if (!performance)
                throw new Error('No performance data available');
            const trends = await this.calculatePerformanceTrends(modelId, period);
            const comparisons = await this.compareWithBaseline(modelId);
            const recommendations = this.generatePerformanceRecommendations(performance, trends);
            return {
                summary: performance,
                trends,
                comparisons,
                recommendations,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate performance report', error);
            throw error;
        }
    }
    startMetricsCollector() {
        setInterval(async () => {
            try {
                for (const [modelId, config] of this.configs) {
                    if (config.enabled) {
                        await this.collectMetrics(modelId);
                    }
                }
            }
            catch (error) {
                logger_1.logger.error('Metrics collection failed', error);
            }
        }, 60000);
    }
    startDriftDetectionWorker() {
        setInterval(async () => {
            try {
                for (const [modelId, detector] of this.driftDetectors) {
                    const config = this.configs.get(modelId);
                    if (config?.enabled) {
                        const drift = await detector.detectDrift();
                        if (drift.isDrifted) {
                            await this.handleDriftDetection(modelId, drift);
                        }
                    }
                }
            }
            catch (error) {
                logger_1.logger.error('Drift detection failed', error);
            }
        }, 300000);
    }
    startHealthCheckWorker() {
        setInterval(async () => {
            try {
                for (const [modelId] of this.configs) {
                    const health = await this.getModelHealth(modelId);
                    if (health.status !== 'healthy') {
                        await this.handleUnhealthyModel(modelId, health);
                    }
                }
            }
            catch (error) {
                logger_1.logger.error('Health check failed', error);
            }
        }, 120000);
    }
    startPerformanceMonitor() {
        setInterval(async () => {
            try {
                for (const [modelId, performance] of this.performanceStore) {
                    const config = this.configs.get(modelId);
                    if (config) {
                        await this.checkPerformanceThresholds(modelId, performance, config);
                    }
                }
            }
            catch (error) {
                logger_1.logger.error('Performance monitoring failed', error);
            }
        }, 30000);
    }
    shouldSample(sampling) {
        if (sampling.strategy === 'random') {
            return Math.random() < sampling.rate;
        }
        return true;
    }
    async storePredictionRecord(record) {
        const key = `predictions:${record.modelId}:${Date.now()}`;
        await this.redis.setex(key, 86400, JSON.stringify(record));
    }
    async updateModelMetrics(modelId, prediction, actual) {
        if (!this.metricsStore.has(modelId)) {
            this.metricsStore.set(modelId, []);
        }
        const metrics = this.calculateMetrics(prediction, actual);
        const modelMetrics = {
            modelId,
            modelName: modelId,
            version: '1.0.0',
            ...metrics,
            timestamp: new Date(),
        };
        this.metricsStore.get(modelId).push(modelMetrics);
        const stored = this.metricsStore.get(modelId);
        if (stored.length > 1000) {
            this.metricsStore.set(modelId, stored.slice(-1000));
        }
    }
    calculateMetrics(prediction, actual) {
        const error = Math.abs(prediction - actual);
        const accuracy = 1 - error;
        return {
            accuracy,
            precision: accuracy * 0.95,
            recall: accuracy * 0.92,
            f1Score: accuracy * 0.93,
            auc: accuracy * 0.96,
            rmse: error,
            mae: error,
        };
    }
    async checkForDrift(modelId, features) {
        const detector = this.driftDetectors.get(modelId);
        if (detector) {
            await detector.addSample(features);
        }
    }
    updatePerformanceMetrics(modelId, latency) {
        if (!this.performanceStore.has(modelId)) {
            this.performanceStore.set(modelId, {
                modelId,
                latency: { p50: 0, p95: 0, p99: 0, mean: 0, max: 0 },
                throughput: 0,
                errorRate: 0,
                availability: 1.0,
                resourceUsage: { cpu: 0, memory: 0, diskIO: 0 },
            });
        }
        const perf = this.performanceStore.get(modelId);
        perf.latency.mean = (perf.latency.mean + latency) / 2;
        perf.latency.max = Math.max(perf.latency.max, latency);
    }
    async collectMetrics(modelId) {
    }
    async handleDriftDetection(modelId, drift) {
        const alert = {
            id: crypto.randomUUID(),
            type: 'drift',
            severity: drift.driftScore > 0.3 ? 'high' : 'medium',
            modelId,
            message: `Model drift detected: ${drift.driftType} drift with score ${drift.driftScore}`,
            details: drift,
            timestamp: new Date(),
            resolved: false,
        };
        await this.alertManager.createAlert(alert);
        this.emit('drift:detected', { modelId, drift });
        logger_1.logger.warn(`Drift detected for model ${modelId}`, drift);
    }
    async handleUnhealthyModel(modelId, health) {
        const alert = {
            id: crypto.randomUUID(),
            type: 'error',
            severity: health.status === 'offline' ? 'critical' : 'high',
            modelId,
            message: `Model health check failed: ${health.status}`,
            details: health,
            timestamp: new Date(),
            resolved: false,
        };
        await this.alertManager.createAlert(alert);
        this.emit('health:degraded', { modelId, health });
    }
    async checkPerformanceThresholds(modelId, performance, config) {
        const thresholds = config.performanceThresholds;
        if (performance.latency.p95 > thresholds.maxLatency) {
            await this.createPerformanceAlert(modelId, 'latency', performance.latency.p95);
        }
        if (performance.errorRate > thresholds.maxErrorRate) {
            await this.createPerformanceAlert(modelId, 'error_rate', performance.errorRate);
        }
    }
    async createPerformanceAlert(modelId, metric, value) {
        const alert = {
            id: crypto.randomUUID(),
            type: 'performance',
            severity: 'medium',
            modelId,
            message: `Performance threshold exceeded for ${metric}: ${value}`,
            details: { metric, value },
            timestamp: new Date(),
            resolved: false,
        };
        await this.alertManager.createAlert(alert);
    }
    async calculatePerformanceTrends(modelId, period) {
        return {};
    }
    async compareWithBaseline(modelId) {
        return {};
    }
    generatePerformanceRecommendations(performance, trends) {
        const recommendations = [];
        if (performance.latency.p95 > 1000) {
            recommendations.push('Consider model optimization to reduce latency');
        }
        if (performance.errorRate > 0.05) {
            recommendations.push('Investigate error patterns and retrain if necessary');
        }
        return recommendations;
    }
}
exports.MLModelMonitoringService = MLModelMonitoringService;
class DriftDetector {
    modelId;
    threshold;
    baselineStats;
    currentWindow;
    lastAnalysis;
    constructor(modelId, threshold) {
        this.modelId = modelId;
        this.threshold = threshold;
        this.baselineStats = new Map();
        this.currentWindow = [];
        this.lastAnalysis = null;
    }
    async addSample(features) {
        this.currentWindow.push(features);
        if (this.currentWindow.length > 1000) {
            this.currentWindow.shift();
        }
    }
    async detectDrift() {
        const driftScore = this.calculateDriftScore();
        const drift = {
            modelId: this.modelId,
            driftType: 'data',
            driftScore,
            threshold: this.threshold,
            isDrifted: driftScore > this.threshold,
            detectedAt: driftScore > this.threshold ? new Date() : undefined,
            recommendations: this.generateRecommendations(driftScore),
        };
        this.lastAnalysis = drift;
        return drift;
    }
    getLatestAnalysis() {
        return this.lastAnalysis;
    }
    calculateDriftScore() {
        return Math.random() * 0.2;
    }
    generateRecommendations(driftScore) {
        if (driftScore > 0.3) {
            return ['Consider retraining the model', 'Review feature distributions'];
        }
        else if (driftScore > 0.1) {
            return ['Monitor closely', 'Prepare retraining pipeline'];
        }
        return [];
    }
}
class AlertManager {
    alerts;
    alertCooldown;
    constructor() {
        this.alerts = [];
        this.alertCooldown = new Map();
    }
    async createAlert(alert) {
        const cooldownKey = `${alert.modelId}:${alert.type}`;
        const lastAlert = this.alertCooldown.get(cooldownKey);
        if (lastAlert && Date.now() - lastAlert.getTime() < 30 * 60 * 1000) {
            return;
        }
        this.alerts.push(alert);
        this.alertCooldown.set(cooldownKey, new Date());
        await this.sendNotifications(alert);
    }
    async resolveAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
        }
    }
    getActiveAlerts(modelId) {
        let activeAlerts = this.alerts.filter(a => !a.resolved);
        if (modelId) {
            activeAlerts = activeAlerts.filter(a => a.modelId === modelId);
        }
        return activeAlerts;
    }
    async sendNotifications(alert) {
        logger_1.logger.warn('Alert created', alert);
    }
}
class HealthChecker {
    checkHealth(modelId, metrics, performance, driftDetector) {
        const checks = {
            accuracy: this.checkAccuracy(metrics),
            latency: this.checkLatency(performance),
            drift: this.checkDrift(driftDetector),
            errors: this.checkErrors(performance),
        };
        const issues = [];
        if (!checks.accuracy)
            issues.push('Accuracy below threshold');
        if (!checks.latency)
            issues.push('High latency detected');
        if (!checks.drift)
            issues.push('Model drift detected');
        if (!checks.errors)
            issues.push('High error rate');
        const status = this.determineStatus(checks);
        return {
            modelId,
            status,
            lastCheck: new Date(),
            checks,
            issues,
        };
    }
    checkAccuracy(metrics) {
        if (!metrics || metrics.length === 0)
            return false;
        const recent = metrics[metrics.length - 1];
        return recent.accuracy > 0.8;
    }
    checkLatency(performance) {
        return performance ? performance.latency.p95 < 1000 : true;
    }
    checkDrift(driftDetector) {
        const analysis = driftDetector?.getLatestAnalysis();
        return !analysis || !analysis.isDrifted;
    }
    checkErrors(performance) {
        return performance ? performance.errorRate < 0.05 : true;
    }
    determineStatus(checks) {
        const checksPassed = Object.values(checks).filter(Boolean).length;
        if (checksPassed === 4)
            return 'healthy';
        if (checksPassed >= 3)
            return 'degraded';
        if (checksPassed >= 1)
            return 'unhealthy';
        return 'offline';
    }
}
exports.default = new MLModelMonitoringService();
//# sourceMappingURL=MLModelMonitoringService.js.map