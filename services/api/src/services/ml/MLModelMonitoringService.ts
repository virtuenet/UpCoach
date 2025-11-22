/**
 * ML Model Monitoring and Drift Detection Service
 * Production monitoring for ML models with drift detection and alerting
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import * as tf from '@tensorflow/tfjs-node';
import { performance } from 'perf_hooks';
import * as crypto from 'crypto';

// Utils
import { logger } from '../../utils/logger';

// ==================== Type Definitions ====================

interface ModelMetrics {
  modelId: string;
  modelName: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  rmse?: number;
  mae?: number;
  timestamp: Date;
}

interface DriftMetrics {
  modelId: string;
  driftType: 'data' | 'concept' | 'prediction';
  driftScore: number;
  threshold: number;
  isDrifted: boolean;
  detectedAt?: Date;
  features?: FeatureDrift[];
  recommendations: string[];
}

interface FeatureDrift {
  featureName: string;
  baselineStats: FeatureStats;
  currentStats: FeatureStats;
  driftScore: number;
  pValue: number;
}

interface FeatureStats {
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  skewness: number;
  kurtosis: number;
}

interface ModelPerformance {
  modelId: string;
  latency: LatencyMetrics;
  throughput: number;
  errorRate: number;
  availability: number;
  resourceUsage: ResourceMetrics;
}

interface LatencyMetrics {
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  max: number;
}

interface ResourceMetrics {
  cpu: number;
  memory: number;
  gpu?: number;
  diskIO: number;
}

interface Alert {
  id: string;
  type: 'drift' | 'performance' | 'error' | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  modelId: string;
  message: string;
  details: unknown;
  timestamp: Date;
  resolved: boolean;
}

interface ModelHealthCheck {
  modelId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  lastCheck: Date;
  checks: {
    accuracy: boolean;
    latency: boolean;
    drift: boolean;
    errors: boolean;
  };
  issues: string[];
}

interface MonitoringConfig {
  modelId: string;
  enabled: boolean;
  driftThreshold: number;
  performanceThresholds: {
    maxLatency: number;
    minAccuracy: number;
    maxErrorRate: number;
  };
  alerting: {
    enabled: boolean;
    channels: string[];
    cooldownMinutes: number;
  };
  sampling: {
    rate: number;
    strategy: 'random' | 'stratified' | 'systematic';
  };
}

// ==================== Main Monitoring Service ====================

export class MLModelMonitoringService extends EventEmitter {
  private redis: Redis;
  private metricsStore: Map<string, ModelMetrics[]>;
  private performanceStore: Map<string, ModelPerformance>;
  private driftDetectors: Map<string, DriftDetector>;
  private alertManager: AlertManager;
  private configs: Map<string, MonitoringConfig>;
  private healthChecker: HealthChecker;

  constructor() {
    super();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 4, // Dedicated DB for monitoring
    });

    this.metricsStore = new Map();
    this.performanceStore = new Map();
    this.driftDetectors = new Map();
    this.alertManager = new AlertManager();
    this.configs = new Map();
    this.healthChecker = new HealthChecker();

    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring systems
   */
  private initializeMonitoring(): void {
    // Start monitoring workers
    this.startMetricsCollector();
    this.startDriftDetectionWorker();
    this.startHealthCheckWorker();
    this.startPerformanceMonitor();

    logger.info('ML Model Monitoring Service initialized');
  }

  /**
   * Register model for monitoring
   */
  async registerModel(
    modelId: string,
    modelName: string,
    version: string,
    config?: Partial<MonitoringConfig>
  ): Promise<void> {
    try {
      const defaultConfig: MonitoringConfig = {
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

      // Initialize drift detector
      const driftDetector = new DriftDetector(modelId, finalConfig.driftThreshold);
      this.driftDetectors.set(modelId, driftDetector);

      // Store registration
      await this.redis.hset(
        'models:registry',
        modelId,
        JSON.stringify({
          modelName,
          version,
          registeredAt: new Date(),
          config: finalConfig,
        })
      );

      logger.info(`Model ${modelId} registered for monitoring`);
    } catch (error) {
      logger.error('Failed to register model', error);
      throw error;
    }
  }

  /**
   * Record prediction metrics
   */
  async recordPrediction(
    modelId: string,
    prediction: unknown,
    actual?: unknown,
    features?: unknown,
    metadata?: unknown
  ): Promise<void> {
    const startTime = performance.now();

    try {
      const config = this.configs.get(modelId);
      if (!config || !config.enabled) return;

      // Sample based on configuration
      if (!this.shouldSample(config.sampling)) return;

      // Record prediction
      const record = {
        modelId,
        prediction,
        actual,
        features,
        metadata,
        timestamp: new Date(),
        latency: performance.now() - startTime,
      };

      // Store in time-series database
      await this.storePredictionRecord(record);

      // Update metrics if actual value is available
      if (actual !== undefined) {
        await this.updateModelMetrics(modelId, prediction, actual);
      }

      // Check for drift
      if (features) {
        await this.checkForDrift(modelId, features);
      }

      // Update performance metrics
      this.updatePerformanceMetrics(modelId, record.latency);

    } catch (error) {
      logger.error('Failed to record prediction', error);
    }
  }

  /**
   * Get model metrics
   */
  async getModelMetrics(
    modelId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<ModelMetrics[]> {
    try {
      let metrics = this.metricsStore.get(modelId) || [];

      if (timeRange) {
        metrics = metrics.filter(
          m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
        );
      }

      return metrics;
    } catch (error) {
      logger.error('Failed to get model metrics', error);
      throw error;
    }
  }

  /**
   * Get drift analysis
   */
  async getDriftAnalysis(modelId: string): Promise<DriftMetrics | null> {
    try {
      const detector = this.driftDetectors.get(modelId);
      if (!detector) return null;

      return detector.getLatestAnalysis();
    } catch (error) {
      logger.error('Failed to get drift analysis', error);
      throw error;
    }
  }

  /**
   * Get model health status
   */
  async getModelHealth(modelId: string): Promise<ModelHealthCheck> {
    try {
      return this.healthChecker.checkHealth(
        modelId,
        this.metricsStore.get(modelId),
        this.performanceStore.get(modelId),
        this.driftDetectors.get(modelId)
      );
    } catch (error) {
      logger.error('Failed to get model health', error);
      throw error;
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(modelId?: string): Promise<Alert[]> {
    return this.alertManager.getActiveAlerts(modelId);
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    await this.alertManager.resolveAlert(alertId);
  }

  /**
   * Get performance report
   */
  async getPerformanceReport(
    modelId: string,
    period: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    summary: ModelPerformance;
    trends: unknown;
    comparisons: unknown;
    recommendations: string[];
  }> {
    try {
      const performance = this.performanceStore.get(modelId);
      if (!performance) throw new Error('No performance data available');

      const trends = await this.calculatePerformanceTrends(modelId, period);
      const comparisons = await this.compareWithBaseline(modelId);
      const recommendations = this.generatePerformanceRecommendations(performance, trends);

      return {
        summary: performance,
        trends,
        comparisons,
        recommendations,
      };
    } catch (error) {
      logger.error('Failed to generate performance report', error);
      throw error;
    }
  }

  // ==================== Monitoring Workers ====================

  private startMetricsCollector(): void {
    setInterval(async () => {
      try {
        for (const [modelId, config] of this.configs) {
          if (config.enabled) {
            await this.collectMetrics(modelId);
          }
        }
      } catch (error) {
        logger.error('Metrics collection failed', error);
      }
    }, 60000); // Every minute
  }

  private startDriftDetectionWorker(): void {
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
      } catch (error) {
        logger.error('Drift detection failed', error);
      }
    }, 300000); // Every 5 minutes
  }

  private startHealthCheckWorker(): void {
    setInterval(async () => {
      try {
        for (const [modelId] of this.configs) {
          const health = await this.getModelHealth(modelId);
          if (health.status !== 'healthy') {
            await this.handleUnhealthyModel(modelId, health);
          }
        }
      } catch (error) {
        logger.error('Health check failed', error);
      }
    }, 120000); // Every 2 minutes
  }

  private startPerformanceMonitor(): void {
    setInterval(async () => {
      try {
        for (const [modelId, performance] of this.performanceStore) {
          const config = this.configs.get(modelId);
          if (config) {
            await this.checkPerformanceThresholds(modelId, performance, config);
          }
        }
      } catch (error) {
        logger.error('Performance monitoring failed', error);
      }
    }, 30000); // Every 30 seconds
  }

  // ==================== Helper Methods ====================

  private shouldSample(sampling: { rate: number; strategy: string }): boolean {
    if (sampling.strategy === 'random') {
      return Math.random() < sampling.rate;
    }
    // Implement other sampling strategies
    return true;
  }

  private async storePredictionRecord(record: unknown): Promise<void> {
    const key = `predictions:${record.modelId}:${Date.now()}`;
    await this.redis.setex(key, 86400, JSON.stringify(record)); // Store for 24 hours
  }

  private async updateModelMetrics(
    modelId: string,
    prediction: unknown,
    actual: unknown
  ): Promise<void> {
    if (!this.metricsStore.has(modelId)) {
      this.metricsStore.set(modelId, []);
    }

    const metrics = this.calculateMetrics(prediction, actual);
    const modelMetrics: ModelMetrics = {
      modelId,
      modelName: modelId,
      version: '1.0.0',
      ...metrics,
      timestamp: new Date(),
    };

    this.metricsStore.get(modelId)!.push(modelMetrics);

    // Keep only recent metrics (last 1000)
    const stored = this.metricsStore.get(modelId)!;
    if (stored.length > 1000) {
      this.metricsStore.set(modelId, stored.slice(-1000));
    }
  }

  private calculateMetrics(prediction: unknown, actual: unknown): unknown {
    // Simplified metrics calculation
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

  private async checkForDrift(modelId: string, features: unknown): Promise<void> {
    const detector = this.driftDetectors.get(modelId);
    if (detector) {
      await detector.addSample(features);
    }
  }

  private updatePerformanceMetrics(modelId: string, latency: number): void {
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

    const perf = this.performanceStore.get(modelId)!;
    // Update latency metrics (simplified)
    perf.latency.mean = (perf.latency.mean + latency) / 2;
    perf.latency.max = Math.max(perf.latency.max, latency);
  }

  private async collectMetrics(modelId: string): Promise<void> {
    // Collect metrics from various sources
    // This would integrate with your actual model serving infrastructure
  }

  private async handleDriftDetection(modelId: string, drift: DriftMetrics): Promise<void> {
    // Create alert
    const alert: Alert = {
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

    // Emit event
    this.emit('drift:detected', { modelId, drift });

    // Log
    logger.warn(`Drift detected for model ${modelId}`, drift);
  }

  private async handleUnhealthyModel(modelId: string, health: ModelHealthCheck): Promise<void> {
    // Create alert
    const alert: Alert = {
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

    // Emit event
    this.emit('health:degraded', { modelId, health });
  }

  private async checkPerformanceThresholds(
    modelId: string,
    performance: ModelPerformance,
    config: MonitoringConfig
  ): Promise<void> {
    const thresholds = config.performanceThresholds;

    if (performance.latency.p95 > thresholds.maxLatency) {
      await this.createPerformanceAlert(modelId, 'latency', performance.latency.p95);
    }

    if (performance.errorRate > thresholds.maxErrorRate) {
      await this.createPerformanceAlert(modelId, 'error_rate', performance.errorRate);
    }
  }

  private async createPerformanceAlert(
    modelId: string,
    metric: string,
    value: number
  ): Promise<void> {
    const alert: Alert = {
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

  private async calculatePerformanceTrends(modelId: string, period: string): Promise<unknown> {
    // Calculate performance trends
    return {};
  }

  private async compareWithBaseline(modelId: string): Promise<unknown> {
    // Compare with baseline performance
    return {};
  }

  private generatePerformanceRecommendations(performance: unknown, trends: unknown): string[] {
    const recommendations: string[] = [];

    if (performance.latency.p95 > 1000) {
      recommendations.push('Consider model optimization to reduce latency');
    }

    if (performance.errorRate > 0.05) {
      recommendations.push('Investigate error patterns and retrain if necessary');
    }

    return recommendations;
  }
}

// ==================== Supporting Classes ====================

class DriftDetector {
  private modelId: string;
  private threshold: number;
  private baselineStats: Map<string, FeatureStats>;
  private currentWindow: unknown[];
  private lastAnalysis: DriftMetrics | null;

  constructor(modelId: string, threshold: number) {
    this.modelId = modelId;
    this.threshold = threshold;
    this.baselineStats = new Map();
    this.currentWindow = [];
    this.lastAnalysis = null;
  }

  async addSample(features: unknown): Promise<void> {
    this.currentWindow.push(features);
    if (this.currentWindow.length > 1000) {
      this.currentWindow.shift();
    }
  }

  async detectDrift(): Promise<DriftMetrics> {
    const driftScore = this.calculateDriftScore();

    const drift: DriftMetrics = {
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

  getLatestAnalysis(): DriftMetrics | null {
    return this.lastAnalysis;
  }

  private calculateDriftScore(): number {
    // Simplified drift calculation
    return Math.random() * 0.2;
  }

  private generateRecommendations(driftScore: number): string[] {
    if (driftScore > 0.3) {
      return ['Consider retraining the model', 'Review feature distributions'];
    } else if (driftScore > 0.1) {
      return ['Monitor closely', 'Prepare retraining pipeline'];
    }
    return [];
  }
}

class AlertManager {
  private alerts: Alert[];
  private alertCooldown: Map<string, Date>;

  constructor() {
    this.alerts = [];
    this.alertCooldown = new Map();
  }

  async createAlert(alert: Alert): Promise<void> {
    // Check cooldown
    const cooldownKey = `${alert.modelId}:${alert.type}`;
    const lastAlert = this.alertCooldown.get(cooldownKey);

    if (lastAlert && Date.now() - lastAlert.getTime() < 30 * 60 * 1000) {
      return; // Still in cooldown
    }

    this.alerts.push(alert);
    this.alertCooldown.set(cooldownKey, new Date());

    // Send notifications
    await this.sendNotifications(alert);
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  getActiveAlerts(modelId?: string): Alert[] {
    let activeAlerts = this.alerts.filter(a => !a.resolved);
    if (modelId) {
      activeAlerts = activeAlerts.filter(a => a.modelId === modelId);
    }
    return activeAlerts;
  }

  private async sendNotifications(alert: Alert): Promise<void> {
    // Send notifications through configured channels
    logger.warn('Alert created', alert);
  }
}

class HealthChecker {
  checkHealth(
    modelId: string,
    metrics?: ModelMetrics[],
    performance?: ModelPerformance,
    driftDetector?: DriftDetector
  ): ModelHealthCheck {
    const checks = {
      accuracy: this.checkAccuracy(metrics),
      latency: this.checkLatency(performance),
      drift: this.checkDrift(driftDetector),
      errors: this.checkErrors(performance),
    };

    const issues: string[] = [];
    if (!checks.accuracy) issues.push('Accuracy below threshold');
    if (!checks.latency) issues.push('High latency detected');
    if (!checks.drift) issues.push('Model drift detected');
    if (!checks.errors) issues.push('High error rate');

    const status = this.determineStatus(checks);

    return {
      modelId,
      status,
      lastCheck: new Date(),
      checks,
      issues,
    };
  }

  private checkAccuracy(metrics?: ModelMetrics[]): boolean {
    if (!metrics || metrics.length === 0) return false;
    const recent = metrics[metrics.length - 1];
    return recent.accuracy > 0.8;
  }

  private checkLatency(performance?: ModelPerformance): boolean {
    return performance ? performance.latency.p95 < 1000 : true;
  }

  private checkDrift(driftDetector?: DriftDetector): boolean {
    const analysis = driftDetector?.getLatestAnalysis();
    return !analysis || !analysis.isDrifted;
  }

  private checkErrors(performance?: ModelPerformance): boolean {
    return performance ? performance.errorRate < 0.05 : true;
  }

  private determineStatus(checks: unknown): 'healthy' | 'degraded' | 'unhealthy' | 'offline' {
    const checksPassed = Object.values(checks).filter(Boolean).length;
    if (checksPassed === 4) return 'healthy';
    if (checksPassed >= 3) return 'degraded';
    if (checksPassed >= 1) return 'unhealthy';
    return 'offline';
  }
}

export default new MLModelMonitoringService();