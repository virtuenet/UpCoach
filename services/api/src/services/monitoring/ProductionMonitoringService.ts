/**
 * Production Monitoring Service
 *
 * Comprehensive monitoring for ML models in production:
 * - Real-time performance metrics
 * - Model drift detection
 * - Error tracking and alerting
 * - SLA monitoring
 * - Resource utilization tracking
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface MonitoredModel {
  modelId: string;
  version: string;
  deployedAt: Date;
  environment: string;
  endpoint: string;
  slaConfig: SLAConfig;
  alertRules: AlertRule[];
  isActive: boolean;
}

export interface SLAConfig {
  maxLatencyP50Ms: number;
  maxLatencyP95Ms: number;
  maxLatencyP99Ms: number;
  minSuccessRate: number;
  maxErrorRate: number;
  minThroughput: number;
  maxConcurrentRequests: number;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number;
  severity: AlertSeverity;
  cooldownMinutes: number;
  isEnabled: boolean;
}

export interface MetricPoint {
  timestamp: Date;
  value: number;
  labels: Record<string, string>;
}

export interface ModelMetrics {
  modelId: string;
  version: string;
  timestamp: Date;
  requestCount: number;
  successCount: number;
  errorCount: number;
  latencyMs: LatencyMetrics;
  throughput: number;
  concurrentRequests: number;
  memoryUsageMB: number;
  cpuUsagePercent: number;
  gpuUsagePercent?: number;
  inputFeatureStats: FeatureStats[];
  outputDistribution: OutputDistribution;
  driftScore?: number;
}

export interface LatencyMetrics {
  min: number;
  max: number;
  mean: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  stdDev: number;
}

export interface FeatureStats {
  name: string;
  mean: number;
  std: number;
  min: number;
  max: number;
  nullCount: number;
  distributionHash: string;
}

export interface OutputDistribution {
  type: 'classification' | 'regression' | 'other';
  classDistribution?: Record<string, number>;
  regressionStats?: {
    mean: number;
    std: number;
    min: number;
    max: number;
  };
}

export interface Alert {
  id: string;
  ruleId: string;
  modelId: string;
  version: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  metricValue: number;
  threshold: number;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  metadata: Record<string, unknown>;
}

export interface DriftReport {
  modelId: string;
  version: string;
  timestamp: Date;
  overallDriftScore: number;
  featureDrift: FeatureDrift[];
  outputDrift: OutputDrift;
  isSignificant: boolean;
  recommendations: string[];
}

export interface FeatureDrift {
  featureName: string;
  driftScore: number;
  baselineStats: FeatureStats;
  currentStats: FeatureStats;
  pValue?: number;
  isSignificant: boolean;
}

export interface OutputDrift {
  driftScore: number;
  baselineDistribution: OutputDistribution;
  currentDistribution: OutputDistribution;
  isSignificant: boolean;
}

export interface SLAReport {
  modelId: string;
  version: string;
  period: { start: Date; end: Date };
  slaConfig: SLAConfig;
  compliance: SLACompliance;
  violations: SLAViolation[];
  uptime: number;
}

export interface SLACompliance {
  latencyP50Compliant: boolean;
  latencyP95Compliant: boolean;
  latencyP99Compliant: boolean;
  successRateCompliant: boolean;
  errorRateCompliant: boolean;
  throughputCompliant: boolean;
  overallCompliant: boolean;
}

export interface SLAViolation {
  timestamp: Date;
  metric: string;
  expected: number;
  actual: number;
  duration: number;
}

export interface MonitoringStats {
  totalModels: number;
  activeModels: number;
  totalAlerts: number;
  activeAlerts: number;
  alertsBySeverity: Record<AlertSeverity, number>;
  avgLatencyMs: number;
  avgSuccessRate: number;
  overallHealth: 'healthy' | 'degraded' | 'critical';
}

// ============================================================================
// Production Monitoring Service
// ============================================================================

export class ProductionMonitoringService extends EventEmitter {
  private monitoredModels: Map<string, MonitoredModel> = new Map();
  private metricsHistory: Map<string, ModelMetrics[]> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private alertCooldowns: Map<string, Date> = new Map();
  private baselineMetrics: Map<string, ModelMetrics> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly maxHistorySize = 1440; // 24 hours at 1-minute intervals

  constructor() {
    super();
  }

  // ============================================================================
  // Model Registration
  // ============================================================================

  registerModel(config: {
    modelId: string;
    version: string;
    environment: string;
    endpoint: string;
    slaConfig?: Partial<SLAConfig>;
    alertRules?: Partial<AlertRule>[];
  }): MonitoredModel {
    const modelKey = `${config.modelId}:${config.version}`;

    const defaultSLA: SLAConfig = {
      maxLatencyP50Ms: 50,
      maxLatencyP95Ms: 100,
      maxLatencyP99Ms: 200,
      minSuccessRate: 99.5,
      maxErrorRate: 0.5,
      minThroughput: 100,
      maxConcurrentRequests: 1000,
    };

    const model: MonitoredModel = {
      modelId: config.modelId,
      version: config.version,
      deployedAt: new Date(),
      environment: config.environment,
      endpoint: config.endpoint,
      slaConfig: { ...defaultSLA, ...config.slaConfig },
      alertRules: this.createDefaultAlertRules(config.alertRules),
      isActive: true,
    };

    this.monitoredModels.set(modelKey, model);
    this.metricsHistory.set(modelKey, []);
    this.emit('modelRegistered', model);

    return model;
  }

  private createDefaultAlertRules(customRules?: Partial<AlertRule>[]): AlertRule[] {
    const defaultRules: AlertRule[] = [
      {
        id: uuidv4(),
        name: 'High Latency P95',
        metric: 'latency_p95',
        condition: 'gt',
        threshold: 100,
        duration: 60,
        severity: 'warning',
        cooldownMinutes: 5,
        isEnabled: true,
      },
      {
        id: uuidv4(),
        name: 'Critical Latency P99',
        metric: 'latency_p99',
        condition: 'gt',
        threshold: 200,
        duration: 30,
        severity: 'error',
        cooldownMinutes: 5,
        isEnabled: true,
      },
      {
        id: uuidv4(),
        name: 'Low Success Rate',
        metric: 'success_rate',
        condition: 'lt',
        threshold: 99.5,
        duration: 60,
        severity: 'error',
        cooldownMinutes: 5,
        isEnabled: true,
      },
      {
        id: uuidv4(),
        name: 'High Error Rate',
        metric: 'error_rate',
        condition: 'gt',
        threshold: 1,
        duration: 60,
        severity: 'critical',
        cooldownMinutes: 5,
        isEnabled: true,
      },
      {
        id: uuidv4(),
        name: 'Model Drift Detected',
        metric: 'drift_score',
        condition: 'gt',
        threshold: 0.3,
        duration: 300,
        severity: 'warning',
        cooldownMinutes: 60,
        isEnabled: true,
      },
    ];

    if (customRules) {
      for (const custom of customRules) {
        const existingIndex = defaultRules.findIndex(r => r.metric === custom.metric);
        if (existingIndex >= 0) {
          defaultRules[existingIndex] = { ...defaultRules[existingIndex], ...custom };
        } else if (custom.name && custom.metric && custom.threshold !== undefined) {
          defaultRules.push({
            id: uuidv4(),
            name: custom.name,
            metric: custom.metric,
            condition: custom.condition || 'gt',
            threshold: custom.threshold,
            duration: custom.duration || 60,
            severity: custom.severity || 'warning',
            cooldownMinutes: custom.cooldownMinutes || 5,
            isEnabled: custom.isEnabled ?? true,
          });
        }
      }
    }

    return defaultRules;
  }

  unregisterModel(modelId: string, version: string): boolean {
    const modelKey = `${modelId}:${version}`;
    const deleted = this.monitoredModels.delete(modelKey);
    if (deleted) {
      this.metricsHistory.delete(modelKey);
      this.baselineMetrics.delete(modelKey);
      this.emit('modelUnregistered', { modelId, version });
    }
    return deleted;
  }

  // ============================================================================
  // Metrics Recording
  // ============================================================================

  recordMetrics(metrics: ModelMetrics): void {
    const modelKey = `${metrics.modelId}:${metrics.version}`;
    const model = this.monitoredModels.get(modelKey);

    if (!model || !model.isActive) {
      return;
    }

    // Add to history
    const history = this.metricsHistory.get(modelKey) || [];
    history.push(metrics);

    // Trim history if too large
    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    this.metricsHistory.set(modelKey, history);

    // Check alert rules
    this.evaluateAlertRules(model, metrics);

    // Check for drift
    if (this.baselineMetrics.has(modelKey)) {
      const driftScore = this.calculateDrift(modelKey, metrics);
      if (driftScore > 0.3) {
        this.emit('driftDetected', { modelId: metrics.modelId, version: metrics.version, driftScore });
      }
    }

    this.emit('metricsRecorded', metrics);
  }

  recordPrediction(modelId: string, version: string, result: {
    success: boolean;
    latencyMs: number;
    inputFeatures?: Record<string, number>;
    output?: unknown;
    error?: string;
  }): void {
    const modelKey = `${modelId}:${version}`;
    const history = this.metricsHistory.get(modelKey) || [];

    // Create or update current metrics window
    let currentMetrics = history[history.length - 1];
    const now = new Date();

    if (!currentMetrics || now.getTime() - currentMetrics.timestamp.getTime() > 60000) {
      currentMetrics = this.createEmptyMetrics(modelId, version);
      history.push(currentMetrics);
      this.metricsHistory.set(modelKey, history);
    }

    // Update metrics
    currentMetrics.requestCount++;
    if (result.success) {
      currentMetrics.successCount++;
    } else {
      currentMetrics.errorCount++;
    }

    // Update latency (simplified - real implementation would use reservoir sampling)
    this.updateLatencyMetrics(currentMetrics.latencyMs, result.latencyMs);

    this.emit('predictionRecorded', { modelId, version, ...result });
  }

  private createEmptyMetrics(modelId: string, version: string): ModelMetrics {
    return {
      modelId,
      version,
      timestamp: new Date(),
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      latencyMs: {
        min: Infinity,
        max: 0,
        mean: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        stdDev: 0,
      },
      throughput: 0,
      concurrentRequests: 0,
      memoryUsageMB: 0,
      cpuUsagePercent: 0,
      inputFeatureStats: [],
      outputDistribution: { type: 'other' },
    };
  }

  private updateLatencyMetrics(metrics: LatencyMetrics, newLatency: number): void {
    if (newLatency < metrics.min) metrics.min = newLatency;
    if (newLatency > metrics.max) metrics.max = newLatency;

    // Exponential moving average for mean
    if (metrics.mean === 0) {
      metrics.mean = newLatency;
    } else {
      metrics.mean = metrics.mean * 0.9 + newLatency * 0.1;
    }

    // Simplified percentile estimation
    metrics.p50 = metrics.mean;
    metrics.p90 = metrics.mean * 1.5;
    metrics.p95 = metrics.mean * 1.8;
    metrics.p99 = metrics.mean * 2.5;
  }

  // ============================================================================
  // Alert Management
  // ============================================================================

  private evaluateAlertRules(model: MonitoredModel, metrics: ModelMetrics): void {
    for (const rule of model.alertRules) {
      if (!rule.isEnabled) continue;

      const metricValue = this.getMetricValue(metrics, rule.metric);
      if (metricValue === null) continue;

      const isViolation = this.checkCondition(metricValue, rule.condition, rule.threshold);

      if (isViolation) {
        const cooldownKey = `${model.modelId}:${model.version}:${rule.id}`;
        const lastAlert = this.alertCooldowns.get(cooldownKey);
        const now = new Date();

        if (!lastAlert || now.getTime() - lastAlert.getTime() > rule.cooldownMinutes * 60000) {
          this.createAlert(model, rule, metricValue);
          this.alertCooldowns.set(cooldownKey, now);
        }
      }
    }
  }

  private getMetricValue(metrics: ModelMetrics, metricName: string): number | null {
    switch (metricName) {
      case 'latency_p50':
        return metrics.latencyMs.p50;
      case 'latency_p95':
        return metrics.latencyMs.p95;
      case 'latency_p99':
        return metrics.latencyMs.p99;
      case 'success_rate':
        return metrics.requestCount > 0
          ? (metrics.successCount / metrics.requestCount) * 100
          : 100;
      case 'error_rate':
        return metrics.requestCount > 0
          ? (metrics.errorCount / metrics.requestCount) * 100
          : 0;
      case 'throughput':
        return metrics.throughput;
      case 'drift_score':
        return metrics.driftScore || 0;
      case 'memory_usage':
        return metrics.memoryUsageMB;
      case 'cpu_usage':
        return metrics.cpuUsagePercent;
      default:
        return null;
    }
  }

  private checkCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'gte':
        return value >= threshold;
      case 'lte':
        return value <= threshold;
      case 'eq':
        return value === threshold;
      default:
        return false;
    }
  }

  private createAlert(model: MonitoredModel, rule: AlertRule, metricValue: number): Alert {
    const alert: Alert = {
      id: uuidv4(),
      ruleId: rule.id,
      modelId: model.modelId,
      version: model.version,
      severity: rule.severity,
      status: 'active',
      title: rule.name,
      message: `${rule.name}: ${rule.metric} is ${metricValue.toFixed(2)} (threshold: ${rule.threshold})`,
      metricValue,
      threshold: rule.threshold,
      createdAt: new Date(),
      metadata: {
        environment: model.environment,
        endpoint: model.endpoint,
      },
    };

    this.alerts.set(alert.id, alert);
    this.emit('alertCreated', alert);

    return alert;
  }

  acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== 'active') {
      return false;
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;

    this.emit('alertAcknowledged', alert);
    return true;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status === 'resolved') {
      return false;
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();

    this.emit('alertResolved', alert);
    return true;
  }

  getActiveAlerts(modelId?: string): Alert[] {
    let alerts = Array.from(this.alerts.values()).filter(a => a.status === 'active');

    if (modelId) {
      alerts = alerts.filter(a => a.modelId === modelId);
    }

    return alerts.sort((a, b) => {
      const severityOrder: Record<AlertSeverity, number> = {
        critical: 0,
        error: 1,
        warning: 2,
        info: 3,
      };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  // ============================================================================
  // Drift Detection
  // ============================================================================

  setBaseline(modelId: string, version: string, metrics?: ModelMetrics): void {
    const modelKey = `${modelId}:${version}`;

    if (metrics) {
      this.baselineMetrics.set(modelKey, metrics);
    } else {
      // Use first metrics as baseline
      const history = this.metricsHistory.get(modelKey);
      if (history && history.length > 0) {
        this.baselineMetrics.set(modelKey, history[0]);
      }
    }

    this.emit('baselineSet', { modelId, version });
  }

  private calculateDrift(modelKey: string, currentMetrics: ModelMetrics): number {
    const baseline = this.baselineMetrics.get(modelKey);
    if (!baseline) return 0;

    let totalDrift = 0;
    let featureCount = 0;

    // Compare feature distributions
    for (const currentFeature of currentMetrics.inputFeatureStats) {
      const baselineFeature = baseline.inputFeatureStats.find(f => f.name === currentFeature.name);
      if (baselineFeature) {
        const meanDrift = Math.abs(currentFeature.mean - baselineFeature.mean) / (baselineFeature.std || 1);
        const stdDrift = Math.abs(currentFeature.std - baselineFeature.std) / (baselineFeature.std || 1);
        totalDrift += (meanDrift + stdDrift) / 2;
        featureCount++;
      }
    }

    return featureCount > 0 ? totalDrift / featureCount : 0;
  }

  generateDriftReport(modelId: string, version: string): DriftReport | null {
    const modelKey = `${modelId}:${version}`;
    const baseline = this.baselineMetrics.get(modelKey);
    const history = this.metricsHistory.get(modelKey);

    if (!baseline || !history || history.length === 0) {
      return null;
    }

    const current = history[history.length - 1];
    const featureDrift: FeatureDrift[] = [];

    for (const currentFeature of current.inputFeatureStats) {
      const baselineFeature = baseline.inputFeatureStats.find(f => f.name === currentFeature.name);
      if (baselineFeature) {
        const driftScore = Math.abs(currentFeature.mean - baselineFeature.mean) / (baselineFeature.std || 1);
        featureDrift.push({
          featureName: currentFeature.name,
          driftScore,
          baselineStats: baselineFeature,
          currentStats: currentFeature,
          isSignificant: driftScore > 0.5,
        });
      }
    }

    const overallDriftScore = featureDrift.reduce((sum, f) => sum + f.driftScore, 0) / (featureDrift.length || 1);

    return {
      modelId,
      version,
      timestamp: new Date(),
      overallDriftScore,
      featureDrift,
      outputDrift: {
        driftScore: 0,
        baselineDistribution: baseline.outputDistribution,
        currentDistribution: current.outputDistribution,
        isSignificant: false,
      },
      isSignificant: overallDriftScore > 0.3,
      recommendations: overallDriftScore > 0.3
        ? ['Consider retraining the model with recent data', 'Review feature engineering pipeline']
        : [],
    };
  }

  // ============================================================================
  // SLA Monitoring
  // ============================================================================

  generateSLAReport(modelId: string, version: string, periodHours: number = 24): SLAReport | null {
    const modelKey = `${modelId}:${version}`;
    const model = this.monitoredModels.get(modelKey);
    const history = this.metricsHistory.get(modelKey);

    if (!model || !history || history.length === 0) {
      return null;
    }

    const now = new Date();
    const periodStart = new Date(now.getTime() - periodHours * 3600000);
    const periodMetrics = history.filter(m => m.timestamp >= periodStart);

    if (periodMetrics.length === 0) {
      return null;
    }

    const sla = model.slaConfig;
    const violations: SLAViolation[] = [];

    // Calculate aggregated metrics
    const avgLatencyP50 = periodMetrics.reduce((sum, m) => sum + m.latencyMs.p50, 0) / periodMetrics.length;
    const avgLatencyP95 = periodMetrics.reduce((sum, m) => sum + m.latencyMs.p95, 0) / periodMetrics.length;
    const avgLatencyP99 = periodMetrics.reduce((sum, m) => sum + m.latencyMs.p99, 0) / periodMetrics.length;
    const totalRequests = periodMetrics.reduce((sum, m) => sum + m.requestCount, 0);
    const totalErrors = periodMetrics.reduce((sum, m) => sum + m.errorCount, 0);
    const successRate = totalRequests > 0 ? ((totalRequests - totalErrors) / totalRequests) * 100 : 100;
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    const avgThroughput = periodMetrics.reduce((sum, m) => sum + m.throughput, 0) / periodMetrics.length;

    // Check compliance
    const compliance: SLACompliance = {
      latencyP50Compliant: avgLatencyP50 <= sla.maxLatencyP50Ms,
      latencyP95Compliant: avgLatencyP95 <= sla.maxLatencyP95Ms,
      latencyP99Compliant: avgLatencyP99 <= sla.maxLatencyP99Ms,
      successRateCompliant: successRate >= sla.minSuccessRate,
      errorRateCompliant: errorRate <= sla.maxErrorRate,
      throughputCompliant: avgThroughput >= sla.minThroughput,
      overallCompliant: false,
    };

    compliance.overallCompliant = Object.values(compliance).filter(v => typeof v === 'boolean').every(v => v);

    // Record violations
    for (const m of periodMetrics) {
      if (m.latencyMs.p95 > sla.maxLatencyP95Ms) {
        violations.push({
          timestamp: m.timestamp,
          metric: 'latency_p95',
          expected: sla.maxLatencyP95Ms,
          actual: m.latencyMs.p95,
          duration: 60,
        });
      }
    }

    // Calculate uptime
    const uptimeMinutes = periodMetrics.filter(m =>
      m.requestCount > 0 && (m.successCount / m.requestCount) * 100 >= sla.minSuccessRate
    ).length;
    const uptime = (uptimeMinutes / periodMetrics.length) * 100;

    return {
      modelId,
      version,
      period: { start: periodStart, end: now },
      slaConfig: sla,
      compliance,
      violations,
      uptime,
    };
  }

  // ============================================================================
  // Health & Statistics
  // ============================================================================

  getModelHealth(modelId: string, version: string): 'healthy' | 'degraded' | 'critical' | 'unknown' {
    const modelKey = `${modelId}:${version}`;
    const history = this.metricsHistory.get(modelKey);

    if (!history || history.length === 0) {
      return 'unknown';
    }

    const recent = history.slice(-5);
    const activeAlerts = this.getActiveAlerts(modelId);

    if (activeAlerts.some(a => a.severity === 'critical')) {
      return 'critical';
    }

    if (activeAlerts.some(a => a.severity === 'error')) {
      return 'degraded';
    }

    const avgSuccessRate = recent.reduce((sum, m) =>
      sum + (m.requestCount > 0 ? m.successCount / m.requestCount : 1), 0
    ) / recent.length;

    if (avgSuccessRate < 0.95) {
      return 'degraded';
    }

    return 'healthy';
  }

  getStats(): MonitoringStats {
    const models = Array.from(this.monitoredModels.values());
    const alerts = Array.from(this.alerts.values());
    const activeAlerts = alerts.filter(a => a.status === 'active');

    let totalLatency = 0;
    let totalSuccessRate = 0;
    let modelCount = 0;

    for (const model of models) {
      const modelKey = `${model.modelId}:${model.version}`;
      const history = this.metricsHistory.get(modelKey);
      if (history && history.length > 0) {
        const recent = history[history.length - 1];
        totalLatency += recent.latencyMs.mean;
        totalSuccessRate += recent.requestCount > 0
          ? (recent.successCount / recent.requestCount) * 100
          : 100;
        modelCount++;
      }
    }

    const alertsBySeverity: Record<AlertSeverity, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };

    for (const alert of activeAlerts) {
      alertsBySeverity[alert.severity]++;
    }

    let overallHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (alertsBySeverity.critical > 0) {
      overallHealth = 'critical';
    } else if (alertsBySeverity.error > 0) {
      overallHealth = 'degraded';
    }

    return {
      totalModels: models.length,
      activeModels: models.filter(m => m.isActive).length,
      totalAlerts: alerts.length,
      activeAlerts: activeAlerts.length,
      alertsBySeverity,
      avgLatencyMs: modelCount > 0 ? totalLatency / modelCount : 0,
      avgSuccessRate: modelCount > 0 ? totalSuccessRate / modelCount : 100,
      overallHealth,
    };
  }

  getMetricsHistory(modelId: string, version: string, hours: number = 1): ModelMetrics[] {
    const modelKey = `${modelId}:${version}`;
    const history = this.metricsHistory.get(modelKey) || [];
    const cutoff = new Date(Date.now() - hours * 3600000);
    return history.filter(m => m.timestamp >= cutoff);
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      return;
    }

    this.monitoringInterval = setInterval(() => {
      this.runHealthChecks();
    }, intervalMs);

    this.emit('monitoringStarted', { intervalMs });
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.emit('monitoringStopped');
    }
  }

  private runHealthChecks(): void {
    for (const [modelKey, model] of this.monitoredModels) {
      if (!model.isActive) continue;

      const health = this.getModelHealth(model.modelId, model.version);
      this.emit('healthCheckCompleted', { modelKey, health });
    }
  }

  reset(): void {
    this.stopMonitoring();
    this.monitoredModels.clear();
    this.metricsHistory.clear();
    this.alerts.clear();
    this.alertCooldowns.clear();
    this.baselineMetrics.clear();
    this.emit('reset');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const productionMonitoringService = new ProductionMonitoringService();
export default productionMonitoringService;
