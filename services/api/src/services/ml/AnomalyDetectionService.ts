/**
 * Anomaly Detection Service
 * Unified service for detecting anomalies in coaching metrics
 * Supports multiple algorithms: Z-Score, IQR, and Isolation Forest
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import {
  ZScoreDetector,
  IQRDetector,
  IsolationForestDetector,
  createZScoreDetector,
  createIQRDetector,
  createIsolationForestDetector,
  ZScoreResult,
  IQRResult,
  IsolationForestResult,
} from './algorithms';

// ==================== Type Definitions ====================

export type AnomalyType =
  | 'session_no_show_spike'
  | 'engagement_drop'
  | 'payment_failure_rate'
  | 'coach_rating_anomaly'
  | 'ai_response_quality_drop'
  | 'goal_completion_anomaly'
  | 'churn_spike'
  | 'unusual_activity'
  | 'metric_deviation';

export type DetectionAlgorithm = 'zscore' | 'iqr' | 'isolation_forest' | 'ensemble';

export interface AnomalyAlert {
  id: string;
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  value: number;
  expectedRange: {
    lower: number;
    upper: number;
  };
  deviation: number;
  timestamp: Date;
  context: Record<string, unknown>;
  algorithm: DetectionAlgorithm;
  confidence: number;
  recommendation?: string;
}

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface MetricDefinition {
  name: string;
  type: AnomalyType;
  algorithm: DetectionAlgorithm;
  threshold?: number;
  windowSize?: number;
  minDataPoints?: number;
  criticalThreshold?: number;
}

export interface DetectionResult {
  metric: string;
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  algorithm: DetectionAlgorithm;
  score: number;
  details: ZScoreResult | IQRResult | IsolationForestResult | EnsembleResult;
}

interface EnsembleResult {
  zScore?: ZScoreResult;
  iqr?: IQRResult;
  isolationForest?: IsolationForestResult;
  votingResult: {
    agreementCount: number;
    algorithms: string[];
  };
}

export interface AnomalyDetectionConfig {
  enableRealTimeDetection: boolean;
  alertThreshold: 'low' | 'medium' | 'high';
  maxAlertsPerHour: number;
  retentionDays: number;
  enableEnsemble: boolean;
  ensembleMinAgreement: number; // Minimum algorithms that must agree
}

// ==================== Anomaly Detection Service ====================

export class AnomalyDetectionService extends EventEmitter {
  private config: AnomalyDetectionConfig;
  private zScoreDetector: ZScoreDetector;
  private iqrDetector: IQRDetector;
  private isolationForest: IsolationForestDetector;
  private alertHistory: Map<string, AnomalyAlert[]> = new Map();
  private metricHistories: Map<string, number[]> = new Map();
  private alertCount: number = 0;
  private lastAlertReset: Date = new Date();

  // Default metric definitions for coaching platform
  private readonly metricDefinitions: MetricDefinition[] = [
    {
      name: 'session_no_show_rate',
      type: 'session_no_show_spike',
      algorithm: 'zscore',
      threshold: 2.5,
      windowSize: 30,
      criticalThreshold: 4.0,
    },
    {
      name: 'daily_engagement_score',
      type: 'engagement_drop',
      algorithm: 'iqr',
      minDataPoints: 14,
    },
    {
      name: 'payment_failure_rate',
      type: 'payment_failure_rate',
      algorithm: 'zscore',
      threshold: 3.0,
      criticalThreshold: 4.5,
    },
    {
      name: 'coach_average_rating',
      type: 'coach_rating_anomaly',
      algorithm: 'ensemble',
      threshold: 2.0,
    },
    {
      name: 'ai_response_latency',
      type: 'ai_response_quality_drop',
      algorithm: 'zscore',
      threshold: 3.0,
    },
    {
      name: 'goal_completion_rate',
      type: 'goal_completion_anomaly',
      algorithm: 'iqr',
    },
    {
      name: 'daily_churn_count',
      type: 'churn_spike',
      algorithm: 'zscore',
      threshold: 2.5,
      criticalThreshold: 3.5,
    },
    {
      name: 'user_activity_score',
      type: 'unusual_activity',
      algorithm: 'isolation_forest',
    },
  ];

  constructor(config: Partial<AnomalyDetectionConfig> = {}) {
    super();

    this.config = {
      enableRealTimeDetection: config.enableRealTimeDetection ?? true,
      alertThreshold: config.alertThreshold ?? 'medium',
      maxAlertsPerHour: config.maxAlertsPerHour ?? 100,
      retentionDays: config.retentionDays ?? 30,
      enableEnsemble: config.enableEnsemble ?? true,
      ensembleMinAgreement: config.ensembleMinAgreement ?? 2,
    };

    // Initialize detectors
    this.zScoreDetector = createZScoreDetector({ threshold: 3.0, minSampleSize: 20 });
    this.iqrDetector = createIQRDetector({ multiplier: 1.5, minSampleSize: 10 });
    this.isolationForest = createIsolationForestDetector({
      numTrees: 50,
      sampleSize: 128,
      threshold: 0.6,
    });

    logger.info('[AnomalyDetectionService] Initialized with config:', this.config);
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add data point to metric history
   */
  public recordMetricValue(metricName: string, value: number): void {
    let history = this.metricHistories.get(metricName);
    if (!history) {
      history = [];
      this.metricHistories.set(metricName, history);
    }

    history.push(value);

    // Trim history based on retention
    const maxPoints = this.config.retentionDays * 24; // Assuming hourly data
    if (history.length > maxPoints) {
      history.splice(0, history.length - maxPoints);
    }

    // Real-time detection if enabled
    if (this.config.enableRealTimeDetection) {
      this.detectForMetric(metricName, value);
    }
  }

  /**
   * Detect anomalies for a specific metric
   */
  private detectForMetric(metricName: string, currentValue: number): DetectionResult | null {
    const definition = this.metricDefinitions.find(m => m.name === metricName);
    const history = this.metricHistories.get(metricName) || [];

    if (!definition || history.length < (definition.minDataPoints || 10)) {
      return null;
    }

    const historicalData = history.slice(0, -1); // Exclude current value

    let result: DetectionResult;

    switch (definition.algorithm) {
      case 'zscore':
        result = this.detectWithZScore(metricName, currentValue, historicalData, definition);
        break;
      case 'iqr':
        result = this.detectWithIQR(metricName, currentValue, historicalData, definition);
        break;
      case 'isolation_forest':
        result = this.detectWithIsolationForest(metricName, currentValue, historicalData, definition);
        break;
      case 'ensemble':
        result = this.detectWithEnsemble(metricName, currentValue, historicalData, definition);
        break;
      default:
        result = this.detectWithZScore(metricName, currentValue, historicalData, definition);
    }

    if (result.isAnomaly) {
      this.createAlert(definition, result, currentValue);
    }

    return result;
  }

  /**
   * Z-Score based detection
   */
  private detectWithZScore(
    metricName: string,
    value: number,
    history: number[],
    definition: MetricDefinition
  ): DetectionResult {
    const detector = createZScoreDetector({
      threshold: definition.threshold || 3.0,
      minSampleSize: definition.minDataPoints || 20,
    });

    const zResult = detector.detectSingle(value, history);

    return {
      metric: metricName,
      isAnomaly: zResult.isAnomaly,
      severity: this.mapSeverity(zResult.severity, definition, Math.abs(zResult.zScore)),
      algorithm: 'zscore',
      score: Math.abs(zResult.zScore),
      details: zResult,
    };
  }

  /**
   * IQR based detection
   */
  private detectWithIQR(
    metricName: string,
    value: number,
    history: number[],
    definition: MetricDefinition
  ): DetectionResult {
    const iqrResult = this.iqrDetector.detectSingle(value, history);

    if (!iqrResult) {
      return {
        metric: metricName,
        isAnomaly: false,
        severity: 'low',
        algorithm: 'iqr',
        score: 0,
        details: {
          value,
          quartile: 'Q2',
          isAnomaly: false,
          severity: 'low',
          lowerBound: value,
          upperBound: value,
          iqr: 0,
        },
      };
    }

    // Calculate normalized score based on distance from bounds
    const distanceFromBound = iqrResult.isAnomaly
      ? value < iqrResult.lowerBound
        ? iqrResult.lowerBound - value
        : value - iqrResult.upperBound
      : 0;
    const normalizedScore = iqrResult.iqr > 0 ? distanceFromBound / iqrResult.iqr : 0;

    return {
      metric: metricName,
      isAnomaly: iqrResult.isAnomaly,
      severity: iqrResult.severity,
      algorithm: 'iqr',
      score: normalizedScore,
      details: iqrResult,
    };
  }

  /**
   * Isolation Forest based detection
   */
  private detectWithIsolationForest(
    metricName: string,
    value: number,
    history: number[],
    definition: MetricDefinition
  ): DetectionResult {
    // Convert 1D data to 2D for Isolation Forest
    const data2D = history.map((v, i) => [v, i / history.length]);
    const point2D = [value, 1];

    // Fit if not already fitted or if data has changed significantly
    if (!this.isolationForest.fitted || history.length > 100) {
      this.isolationForest.fit(data2D);
    }

    const ifResult = this.isolationForest.detectSingle(point2D);

    return {
      metric: metricName,
      isAnomaly: ifResult.isAnomaly,
      severity: ifResult.severity,
      algorithm: 'isolation_forest',
      score: ifResult.anomalyScore,
      details: ifResult,
    };
  }

  /**
   * Ensemble detection using multiple algorithms
   */
  private detectWithEnsemble(
    metricName: string,
    value: number,
    history: number[],
    definition: MetricDefinition
  ): DetectionResult {
    const zScoreResult = this.detectWithZScore(metricName, value, history, definition);
    const iqrResult = this.detectWithIQR(metricName, value, history, definition);
    const ifResult = this.detectWithIsolationForest(metricName, value, history, definition);

    // Count how many algorithms detect an anomaly
    const algorithms: { name: string; detected: boolean; severity: string }[] = [
      { name: 'zscore', detected: zScoreResult.isAnomaly, severity: zScoreResult.severity },
      { name: 'iqr', detected: iqrResult.isAnomaly, severity: iqrResult.severity },
      { name: 'isolation_forest', detected: ifResult.isAnomaly, severity: ifResult.severity },
    ];

    const agreementCount = algorithms.filter(a => a.detected).length;
    const isAnomaly = agreementCount >= this.config.ensembleMinAgreement;

    // Determine severity based on voting
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (isAnomaly) {
      const severities = algorithms.filter(a => a.detected).map(a => a.severity);
      if (severities.includes('high') || agreementCount === 3) {
        severity = agreementCount === 3 ? 'critical' : 'high';
      } else if (severities.includes('medium')) {
        severity = 'medium';
      }
    }

    // Calculate combined score
    const avgScore = (zScoreResult.score + iqrResult.score + ifResult.score) / 3;

    const ensembleDetails: EnsembleResult = {
      zScore: zScoreResult.details as ZScoreResult,
      iqr: iqrResult.details as IQRResult,
      isolationForest: ifResult.details as IsolationForestResult,
      votingResult: {
        agreementCount,
        algorithms: algorithms.filter(a => a.detected).map(a => a.name),
      },
    };

    return {
      metric: metricName,
      isAnomaly,
      severity,
      algorithm: 'ensemble',
      score: avgScore,
      details: ensembleDetails,
    };
  }

  /**
   * Map severity with critical threshold consideration
   */
  private mapSeverity(
    baseSeverity: 'low' | 'medium' | 'high',
    definition: MetricDefinition,
    score: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (definition.criticalThreshold && score >= definition.criticalThreshold) {
      return 'critical';
    }
    return baseSeverity;
  }

  /**
   * Create and emit an alert
   */
  private createAlert(
    definition: MetricDefinition,
    result: DetectionResult,
    value: number
  ): void {
    // Rate limiting
    this.checkAlertRateLimit();
    if (this.alertCount >= this.config.maxAlertsPerHour) {
      logger.warn('[AnomalyDetectionService] Alert rate limit reached');
      return;
    }

    // Filter by threshold
    if (!this.meetsAlertThreshold(result.severity)) {
      return;
    }

    const history = this.metricHistories.get(definition.name) || [];
    const mean = history.length > 0
      ? history.reduce((a, b) => a + b, 0) / history.length
      : value;
    const stdDev = history.length > 1
      ? Math.sqrt(history.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (history.length - 1))
      : 0;

    const alert: AnomalyAlert = {
      id: this.generateAlertId(),
      type: definition.type,
      severity: result.severity,
      metric: definition.name,
      value,
      expectedRange: {
        lower: mean - 2 * stdDev,
        upper: mean + 2 * stdDev,
      },
      deviation: stdDev > 0 ? (value - mean) / stdDev : 0,
      timestamp: new Date(),
      context: {
        historyLength: history.length,
        algorithm: result.algorithm,
        score: result.score,
      },
      algorithm: result.algorithm,
      confidence: this.calculateConfidence(result),
      recommendation: this.generateRecommendation(definition.type, result.severity),
    };

    // Store alert
    let alerts = this.alertHistory.get(definition.name) || [];
    alerts.push(alert);

    // Trim old alerts
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    alerts = alerts.filter(a => a.timestamp > cutoffDate);
    this.alertHistory.set(definition.name, alerts);

    this.alertCount++;

    // Emit event
    this.emit('anomaly_detected', alert);

    logger.warn('[AnomalyDetectionService] Anomaly detected:', {
      metric: alert.metric,
      type: alert.type,
      severity: alert.severity,
      value: alert.value,
    });
  }

  /**
   * Check and reset alert rate limit
   */
  private checkAlertRateLimit(): void {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    if (this.lastAlertReset < hourAgo) {
      this.alertCount = 0;
      this.lastAlertReset = now;
    }
  }

  /**
   * Check if severity meets alert threshold
   */
  private meetsAlertThreshold(severity: 'low' | 'medium' | 'high' | 'critical'): boolean {
    const severityLevels = { low: 0, medium: 1, high: 2, critical: 3 };
    return severityLevels[severity] >= severityLevels[this.config.alertThreshold];
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(result: DetectionResult): number {
    if (result.algorithm === 'ensemble') {
      const details = result.details as EnsembleResult;
      return (details.votingResult.agreementCount / 3) * 100;
    }

    // For single algorithm, use score to derive confidence
    const score = result.score;
    if (score >= 4) return 95;
    if (score >= 3) return 85;
    if (score >= 2) return 70;
    return 50;
  }

  /**
   * Generate recommendation based on anomaly type
   */
  private generateRecommendation(type: AnomalyType, severity: string): string {
    const recommendations: Record<AnomalyType, string> = {
      session_no_show_spike: 'Review no-show patterns and consider sending reminder notifications',
      engagement_drop: 'Analyze user activity and consider re-engagement campaigns',
      payment_failure_rate: 'Check payment gateway status and review failed transaction logs',
      coach_rating_anomaly: 'Review recent coach feedback and identify potential issues',
      ai_response_quality_drop: 'Monitor AI service latency and check API quotas',
      goal_completion_anomaly: 'Analyze goal difficulty settings and user progress patterns',
      churn_spike: 'Initiate retention analysis and consider proactive outreach',
      unusual_activity: 'Review user activity logs for potential security concerns',
      metric_deviation: 'Investigate root cause of metric deviation',
    };

    return recommendations[type] || 'Review the metric and investigate the root cause';
  }

  // ==================== Public API ====================

  /**
   * Detect anomalies in time series data
   */
  public detectInTimeSeries(
    metricName: string,
    data: TimeSeriesDataPoint[],
    algorithm: DetectionAlgorithm = 'ensemble'
  ): DetectionResult[] {
    const results: DetectionResult[] = [];
    const values = data.map(d => d.value);

    // Clear and repopulate history
    this.metricHistories.set(metricName, []);

    for (let i = 0; i < data.length; i++) {
      this.recordMetricValue(metricName, data[i].value);

      if (i >= 10) {
        // Need minimum history
        const result = this.detectForMetric(metricName, data[i].value);
        if (result) {
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * Detect single value against historical data
   */
  public detect(
    metricName: string,
    value: number,
    historicalData?: number[]
  ): DetectionResult | null {
    if (historicalData) {
      this.metricHistories.set(metricName, historicalData);
    }

    return this.detectForMetric(metricName, value);
  }

  /**
   * Batch detection for multiple metrics
   */
  public detectBatch(
    metrics: Array<{ name: string; value: number; history?: number[] }>
  ): Map<string, DetectionResult> {
    const results = new Map<string, DetectionResult>();

    for (const metric of metrics) {
      if (metric.history) {
        this.metricHistories.set(metric.name, metric.history);
      }

      const result = this.detectForMetric(metric.name, metric.value);
      if (result) {
        results.set(metric.name, result);
      }
    }

    return results;
  }

  /**
   * Get recent alerts for a metric
   */
  public getRecentAlerts(metricName?: string, limit: number = 50): AnomalyAlert[] {
    if (metricName) {
      return (this.alertHistory.get(metricName) || []).slice(-limit);
    }

    // Combine all alerts and sort by timestamp
    const allAlerts: AnomalyAlert[] = [];
    for (const alerts of this.alertHistory.values()) {
      allAlerts.push(...alerts);
    }

    return allAlerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get metric statistics
   */
  public getMetricStats(metricName: string): {
    count: number;
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    anomalyCount: number;
  } | null {
    const history = this.metricHistories.get(metricName);
    if (!history || history.length === 0) {
      return null;
    }

    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const stdDev = Math.sqrt(
      history.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (history.length - 1)
    );

    const alerts = this.alertHistory.get(metricName) || [];

    return {
      count: history.length,
      mean,
      stdDev,
      min: Math.min(...history),
      max: Math.max(...history),
      anomalyCount: alerts.length,
    };
  }

  /**
   * Register a custom metric definition
   */
  public registerMetric(definition: MetricDefinition): void {
    const existingIndex = this.metricDefinitions.findIndex(m => m.name === definition.name);
    if (existingIndex >= 0) {
      this.metricDefinitions[existingIndex] = definition;
    } else {
      this.metricDefinitions.push(definition);
    }
    logger.info(`[AnomalyDetectionService] Registered metric: ${definition.name}`);
  }

  /**
   * Get all registered metrics
   */
  public getRegisteredMetrics(): MetricDefinition[] {
    return [...this.metricDefinitions];
  }

  /**
   * Clear history for a metric
   */
  public clearMetricHistory(metricName: string): void {
    this.metricHistories.delete(metricName);
    this.alertHistory.delete(metricName);
  }

  /**
   * Clear all histories
   */
  public reset(): void {
    this.metricHistories.clear();
    this.alertHistory.clear();
    this.alertCount = 0;
  }
}

// Export singleton instance
export const anomalyDetectionService = new AnomalyDetectionService();

// Export factory function
export const createAnomalyDetectionService = (
  config?: Partial<AnomalyDetectionConfig>
): AnomalyDetectionService => {
  return new AnomalyDetectionService(config);
};
