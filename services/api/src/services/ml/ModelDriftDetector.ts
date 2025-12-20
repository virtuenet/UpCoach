/**
 * Model Drift Detector
 * Detects data drift, concept drift, and model performance degradation
 * Provides alerts and retraining recommendations
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

// ==================== Type Definitions ====================

export interface FeatureData {
  timestamp: Date;
  features: Record<string, number>;
}

export interface Prediction {
  id: string;
  timestamp: Date;
  features: Record<string, number>;
  prediction: number | string;
  confidence?: number;
}

export interface Actual {
  predictionId: string;
  timestamp: Date;
  actual: number | string;
}

export interface DriftReport {
  modelId: string;
  analysisTimestamp: Date;
  dataWindow: { start: Date; end: Date };
  overallDriftScore: number;
  driftDetected: boolean;
  featureDrifts: FeatureDriftResult[];
  summary: string;
  recommendations: string[];
}

export interface FeatureDriftResult {
  feature: string;
  driftScore: number;
  driftType: DriftType;
  baselineStats: DistributionStats;
  currentStats: DistributionStats;
  significant: boolean;
  pValue?: number;
}

export type DriftType = 'none' | 'gradual' | 'sudden' | 'recurring' | 'incremental';

export interface DistributionStats {
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  q25: number;
  q75: number;
  sampleSize: number;
}

export interface ConceptDriftReport {
  modelId: string;
  analysisTimestamp: Date;
  dataWindow: { start: Date; end: Date };
  driftDetected: boolean;
  driftScore: number;
  performanceChange: PerformanceChange;
  driftPattern: DriftPattern;
  affectedSegments: string[];
  summary: string;
  recommendations: string[];
}

export interface PerformanceChange {
  baselineMetrics: PerformanceMetrics;
  currentMetrics: PerformanceMetrics;
  degradation: Record<string, number>;
}

export interface PerformanceMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  auc?: number;
  rmse?: number;
  mae?: number;
}

export interface DriftPattern {
  type: 'sudden' | 'gradual' | 'incremental' | 'recurring' | 'none';
  confidence: number;
  changePoint?: Date;
  trendDirection?: 'improving' | 'degrading' | 'stable';
}

export interface AccuracyTrend {
  modelId: string;
  window: TimeWindow;
  dataPoints: AccuracyDataPoint[];
  trend: 'improving' | 'stable' | 'degrading';
  trendSlope: number;
  forecast: AccuracyDataPoint[];
}

export interface AccuracyDataPoint {
  timestamp: Date;
  accuracy: number;
  sampleSize: number;
}

export interface TimeWindow {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week';
}

export interface DriftThreshold {
  dataDriftScore: number;
  conceptDriftScore: number;
  performanceDegradation: number;
  featureDriftScore: number;
}

export interface DriftAlert {
  id: string;
  modelId: string;
  alertType: 'data_drift' | 'concept_drift' | 'performance_degradation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  threshold: number;
  message: string;
  affectedFeatures?: string[];
  detectedAt: Date;
  acknowledged: boolean;
}

export interface RetrainingRecommendation {
  modelId: string;
  shouldRetrain: boolean;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  suggestedActions: RetrainingSuggestion[];
  estimatedImpact: string;
  analysisDetails: {
    dataDriftScore: number;
    conceptDriftScore: number;
    performanceDegradation: number;
    daysSinceLastTraining: number;
  };
}

export interface RetrainingSuggestion {
  action: string;
  priority: number;
  estimatedEffort: string;
  expectedImprovement: string;
}

export interface PRCurve {
  modelId: string;
  window: TimeWindow;
  points: PRPoint[];
  auc: number;
  optimalThreshold: number;
}

export interface PRPoint {
  threshold: number;
  precision: number;
  recall: number;
  f1Score: number;
}

// ==================== Model Drift Detector ====================

export class ModelDriftDetector extends EventEmitter {
  private baselineData: Map<string, FeatureData[]> = new Map();
  private currentData: Map<string, FeatureData[]> = new Map();
  private predictions: Map<string, Prediction[]> = new Map();
  private actuals: Map<string, Actual[]> = new Map();
  private thresholds: Map<string, DriftThreshold> = new Map();
  private alerts: DriftAlert[] = [];
  private lastTrainingDates: Map<string, Date> = new Map();

  private readonly defaultThreshold: DriftThreshold = {
    dataDriftScore: 0.15,
    conceptDriftScore: 0.2,
    performanceDegradation: 0.1,
    featureDriftScore: 0.2,
  };

  constructor() {
    super();
  }

  // ==================== Data Drift Detection ====================

  /**
   * Detect data drift in feature distributions
   */
  public detectDataDrift(modelId: string, recentData: FeatureData[]): DriftReport {
    const baseline = this.baselineData.get(modelId) || [];

    if (baseline.length === 0) {
      // Set this data as baseline if none exists
      this.baselineData.set(modelId, recentData);
      return this.createNoDriftReport(modelId, recentData);
    }

    const featureDrifts: FeatureDriftResult[] = [];
    const features = this.extractFeatureNames(recentData);

    for (const feature of features) {
      const baselineValues = baseline.map((d) => d.features[feature]).filter((v) => v !== undefined);
      const currentValues = recentData.map((d) => d.features[feature]).filter((v) => v !== undefined);

      if (baselineValues.length > 0 && currentValues.length > 0) {
        const driftResult = this.calculateFeatureDrift(feature, baselineValues, currentValues);
        featureDrifts.push(driftResult);
      }
    }

    // Calculate overall drift score
    const significantDrifts = featureDrifts.filter((d) => d.significant);
    const overallDriftScore =
      featureDrifts.length > 0
        ? featureDrifts.reduce((sum, d) => sum + d.driftScore, 0) / featureDrifts.length
        : 0;

    const threshold = this.thresholds.get(modelId) || this.defaultThreshold;
    const driftDetected = overallDriftScore > threshold.dataDriftScore;

    const report: DriftReport = {
      modelId,
      analysisTimestamp: new Date(),
      dataWindow: {
        start: recentData[0]?.timestamp || new Date(),
        end: recentData[recentData.length - 1]?.timestamp || new Date(),
      },
      overallDriftScore,
      driftDetected,
      featureDrifts,
      summary: this.generateDataDriftSummary(significantDrifts, overallDriftScore, driftDetected),
      recommendations: this.generateDataDriftRecommendations(significantDrifts, driftDetected),
    };

    // Generate alert if drift detected
    if (driftDetected) {
      this.createAlert(modelId, 'data_drift', overallDriftScore, threshold.dataDriftScore, significantDrifts.map((d) => d.feature));
    }

    // Update current data for future comparisons
    this.currentData.set(modelId, recentData);

    this.emit('drift:data_analyzed', { modelId, report });
    return report;
  }

  /**
   * Calculate drift for a single feature using KL Divergence and statistical tests
   */
  private calculateFeatureDrift(
    feature: string,
    baselineValues: number[],
    currentValues: number[]
  ): FeatureDriftResult {
    const baselineStats = this.calculateDistributionStats(baselineValues);
    const currentStats = this.calculateDistributionStats(currentValues);

    // Calculate Population Stability Index (PSI)
    const psi = this.calculatePSI(baselineValues, currentValues);

    // Calculate Kolmogorov-Smirnov statistic
    const ksStatistic = this.calculateKSStatistic(baselineValues, currentValues);

    // Combined drift score
    const driftScore = (psi + ksStatistic) / 2;

    // Determine drift type based on patterns
    const driftType = this.determineDriftType(baselineStats, currentStats, driftScore);

    return {
      feature,
      driftScore,
      driftType,
      baselineStats,
      currentStats,
      significant: driftScore > (this.defaultThreshold.featureDriftScore),
      pValue: 1 - ksStatistic, // Approximate p-value
    };
  }

  /**
   * Calculate Population Stability Index
   */
  private calculatePSI(baseline: number[], current: number[]): number {
    const bins = 10;
    const allValues = [...baseline, ...current];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const binWidth = (max - min) / bins || 1;

    const baselineHist = new Array(bins).fill(0);
    const currentHist = new Array(bins).fill(0);

    for (const v of baseline) {
      const bin = Math.min(Math.floor((v - min) / binWidth), bins - 1);
      baselineHist[bin]++;
    }

    for (const v of current) {
      const bin = Math.min(Math.floor((v - min) / binWidth), bins - 1);
      currentHist[bin]++;
    }

    // Normalize and add small constant to avoid log(0)
    const epsilon = 0.0001;
    let psi = 0;

    for (let i = 0; i < bins; i++) {
      const baselinePct = baselineHist[i] / baseline.length + epsilon;
      const currentPct = currentHist[i] / current.length + epsilon;
      psi += (currentPct - baselinePct) * Math.log(currentPct / baselinePct);
    }

    return Math.abs(psi);
  }

  /**
   * Calculate Kolmogorov-Smirnov statistic
   */
  private calculateKSStatistic(baseline: number[], current: number[]): number {
    const sortedBaseline = [...baseline].sort((a, b) => a - b);
    const sortedCurrent = [...current].sort((a, b) => a - b);

    const allValues = [...new Set([...sortedBaseline, ...sortedCurrent])].sort((a, b) => a - b);

    let maxDiff = 0;

    for (const value of allValues) {
      const baselineCDF = sortedBaseline.filter((v) => v <= value).length / baseline.length;
      const currentCDF = sortedCurrent.filter((v) => v <= value).length / current.length;
      const diff = Math.abs(baselineCDF - currentCDF);
      maxDiff = Math.max(maxDiff, diff);
    }

    return maxDiff;
  }

  // ==================== Concept Drift Detection ====================

  /**
   * Detect concept drift by comparing prediction performance over time
   */
  public detectConceptDrift(
    modelId: string,
    predictions: Prediction[],
    actuals: Actual[]
  ): ConceptDriftReport {
    // Store predictions and actuals
    this.predictions.set(modelId, predictions);
    this.actuals.set(modelId, actuals);

    // Match predictions with actuals
    const matched = this.matchPredictionsWithActuals(predictions, actuals);

    if (matched.length < 10) {
      return this.createNoConceptDriftReport(modelId);
    }

    // Split into time windows
    const midpoint = Math.floor(matched.length / 2);
    const baselineMatched = matched.slice(0, midpoint);
    const currentMatched = matched.slice(midpoint);

    // Calculate performance metrics for each window
    const baselineMetrics = this.calculatePerformanceMetrics(baselineMatched);
    const currentMetrics = this.calculatePerformanceMetrics(currentMatched);

    // Calculate degradation
    const degradation = this.calculateDegradation(baselineMetrics, currentMetrics);

    // Determine drift pattern
    const driftPattern = this.analyzeDriftPattern(matched);

    // Calculate overall drift score
    const avgDegradation = Object.values(degradation).reduce((a, b) => a + b, 0) / Object.values(degradation).length;
    const driftScore = Math.abs(avgDegradation);

    const threshold = this.thresholds.get(modelId) || this.defaultThreshold;
    const driftDetected = driftScore > threshold.conceptDriftScore;

    const report: ConceptDriftReport = {
      modelId,
      analysisTimestamp: new Date(),
      dataWindow: {
        start: matched[0]?.timestamp || new Date(),
        end: matched[matched.length - 1]?.timestamp || new Date(),
      },
      driftDetected,
      driftScore,
      performanceChange: {
        baselineMetrics,
        currentMetrics,
        degradation,
      },
      driftPattern,
      affectedSegments: this.identifyAffectedSegments(matched),
      summary: this.generateConceptDriftSummary(driftScore, driftPattern, degradation),
      recommendations: this.generateConceptDriftRecommendations(driftPattern, degradation),
    };

    if (driftDetected) {
      this.createAlert(modelId, 'concept_drift', driftScore, threshold.conceptDriftScore);
    }

    this.emit('drift:concept_analyzed', { modelId, report });
    return report;
  }

  /**
   * Match predictions with actual outcomes
   */
  private matchPredictionsWithActuals(
    predictions: Prediction[],
    actuals: Actual[]
  ): Array<{ prediction: Prediction; actual: Actual; timestamp: Date }> {
    const actualsMap = new Map<string, Actual>();
    for (const actual of actuals) {
      actualsMap.set(actual.predictionId, actual);
    }

    const matched: Array<{ prediction: Prediction; actual: Actual; timestamp: Date }> = [];

    for (const prediction of predictions) {
      const actual = actualsMap.get(prediction.id);
      if (actual) {
        matched.push({
          prediction,
          actual,
          timestamp: prediction.timestamp,
        });
      }
    }

    return matched.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Calculate performance metrics from matched predictions
   */
  private calculatePerformanceMetrics(
    matched: Array<{ prediction: Prediction; actual: Actual }>
  ): PerformanceMetrics {
    if (matched.length === 0) {
      return {};
    }

    // Detect if classification or regression
    const isClassification = matched.every(
      (m) => typeof m.prediction.prediction === 'string' || Number.isInteger(m.prediction.prediction)
    );

    if (isClassification) {
      let correct = 0;
      let truePositives = 0;
      let falsePositives = 0;
      let falseNegatives = 0;

      for (const { prediction, actual } of matched) {
        const pred = String(prediction.prediction);
        const act = String(actual.actual);

        if (pred === act) correct++;

        // Binary classification metrics (assuming positive class is '1' or 'true')
        const isPositivePred = pred === '1' || pred === 'true';
        const isPositiveActual = act === '1' || act === 'true';

        if (isPositivePred && isPositiveActual) truePositives++;
        if (isPositivePred && !isPositiveActual) falsePositives++;
        if (!isPositivePred && isPositiveActual) falseNegatives++;
      }

      const accuracy = correct / matched.length;
      const precision = truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;
      const recall = truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 0;
      const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

      return { accuracy, precision, recall, f1Score };
    } else {
      // Regression metrics
      let sumSquaredError = 0;
      let sumAbsoluteError = 0;

      for (const { prediction, actual } of matched) {
        const pred = Number(prediction.prediction);
        const act = Number(actual.actual);
        const error = pred - act;
        sumSquaredError += error * error;
        sumAbsoluteError += Math.abs(error);
      }

      const rmse = Math.sqrt(sumSquaredError / matched.length);
      const mae = sumAbsoluteError / matched.length;

      return { rmse, mae };
    }
  }

  /**
   * Calculate degradation between baseline and current metrics
   */
  private calculateDegradation(
    baseline: PerformanceMetrics,
    current: PerformanceMetrics
  ): Record<string, number> {
    const degradation: Record<string, number> = {};

    const higherIsBetter = ['accuracy', 'precision', 'recall', 'f1Score', 'auc'];
    const lowerIsBetter = ['rmse', 'mae'];

    for (const [metric, baselineValue] of Object.entries(baseline)) {
      const currentValue = (current as Record<string, number>)[metric];
      if (currentValue === undefined || baselineValue === undefined) continue;

      if (higherIsBetter.includes(metric)) {
        degradation[metric] = baselineValue - currentValue;
      } else if (lowerIsBetter.includes(metric)) {
        degradation[metric] = currentValue - baselineValue;
      }
    }

    return degradation;
  }

  /**
   * Analyze drift pattern over time
   */
  private analyzeDriftPattern(
    matched: Array<{ prediction: Prediction; actual: Actual; timestamp: Date }>
  ): DriftPattern {
    if (matched.length < 20) {
      return { type: 'none', confidence: 0 };
    }

    // Calculate rolling accuracy
    const windowSize = Math.min(20, Math.floor(matched.length / 5));
    const rollingAccuracy: number[] = [];

    for (let i = windowSize; i <= matched.length; i++) {
      const window = matched.slice(i - windowSize, i);
      const correct = window.filter((m) => m.prediction.prediction === m.actual.actual).length;
      rollingAccuracy.push(correct / windowSize);
    }

    // Analyze the trend
    const trend = this.calculateTrend(rollingAccuracy);
    const variance = this.calculateVariance(rollingAccuracy);

    // Detect sudden changes
    const changePoints = this.detectChangePoints(rollingAccuracy);

    if (changePoints.length > 0) {
      return {
        type: 'sudden',
        confidence: 0.8,
        changePoint: matched[changePoints[0] + windowSize]?.timestamp,
        trendDirection: trend < -0.01 ? 'degrading' : trend > 0.01 ? 'improving' : 'stable',
      };
    }

    if (Math.abs(trend) > 0.02) {
      return {
        type: 'gradual',
        confidence: 0.7,
        trendDirection: trend < 0 ? 'degrading' : 'improving',
      };
    }

    if (variance > 0.1) {
      return {
        type: 'recurring',
        confidence: 0.6,
        trendDirection: 'stable',
      };
    }

    return { type: 'none', confidence: 0.9, trendDirection: 'stable' };
  }

  // ==================== Performance Monitoring ====================

  /**
   * Track accuracy over a time window
   */
  public trackAccuracy(modelId: string, window: TimeWindow): AccuracyTrend {
    const predictions = this.predictions.get(modelId) || [];
    const actuals = this.actuals.get(modelId) || [];

    const matched = this.matchPredictionsWithActuals(predictions, actuals);

    // Filter by window
    const windowedMatched = matched.filter(
      (m) => m.timestamp >= window.start && m.timestamp <= window.end
    );

    // Group by granularity
    const groups = this.groupByGranularity(windowedMatched, window.granularity);

    const dataPoints: AccuracyDataPoint[] = [];

    for (const [timestamp, items] of groups.entries()) {
      const correct = items.filter((m) => m.prediction.prediction === m.actual.actual).length;
      dataPoints.push({
        timestamp: new Date(timestamp),
        accuracy: correct / items.length,
        sampleSize: items.length,
      });
    }

    // Calculate trend
    const accuracies = dataPoints.map((d) => d.accuracy);
    const trendSlope = this.calculateTrend(accuracies);

    // Simple forecast (linear extrapolation)
    const forecast = this.forecastAccuracy(dataPoints, 5);

    return {
      modelId,
      window,
      dataPoints,
      trend: trendSlope < -0.01 ? 'degrading' : trendSlope > 0.01 ? 'improving' : 'stable',
      trendSlope,
      forecast,
    };
  }

  /**
   * Calculate precision-recall curve
   */
  public trackPrecisionRecall(modelId: string, window: TimeWindow): PRCurve {
    const predictions = this.predictions.get(modelId) || [];
    const actuals = this.actuals.get(modelId) || [];

    const matched = this.matchPredictionsWithActuals(predictions, actuals).filter(
      (m) => m.timestamp >= window.start && m.timestamp <= window.end
    );

    const thresholds = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    const points: PRPoint[] = [];
    let bestF1 = 0;
    let optimalThreshold = 0.5;

    for (const threshold of thresholds) {
      let truePositives = 0;
      let falsePositives = 0;
      let falseNegatives = 0;

      for (const { prediction, actual } of matched) {
        const conf = prediction.confidence || 0.5;
        const pred = conf >= threshold;
        const act = actual.actual === '1' || actual.actual === 'true' || actual.actual === 1;

        if (pred && act) truePositives++;
        if (pred && !act) falsePositives++;
        if (!pred && act) falseNegatives++;
      }

      const precision = truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;
      const recall = truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 0;
      const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

      if (f1Score > bestF1) {
        bestF1 = f1Score;
        optimalThreshold = threshold;
      }

      points.push({ threshold, precision, recall, f1Score });
    }

    // Calculate AUC (trapezoidal rule)
    let auc = 0;
    for (let i = 1; i < points.length; i++) {
      const width = points[i].recall - points[i - 1].recall;
      const height = (points[i].precision + points[i - 1].precision) / 2;
      auc += Math.abs(width * height);
    }

    return { modelId, window, points, auc, optimalThreshold };
  }

  // ==================== Alerting ====================

  /**
   * Set drift threshold for a model
   */
  public setDriftThreshold(modelId: string, threshold: DriftThreshold): void {
    this.thresholds.set(modelId, threshold);
    logger.info(`Set drift thresholds for model ${modelId}`);
  }

  /**
   * Get drift alerts for a model
   */
  public getDriftAlerts(modelId?: string): DriftAlert[] {
    if (modelId) {
      return this.alerts.filter((a) => a.modelId === modelId);
    }
    return [...this.alerts];
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alert:acknowledged', { alertId });
    }
  }

  /**
   * Create a drift alert
   */
  private createAlert(
    modelId: string,
    alertType: DriftAlert['alertType'],
    score: number,
    threshold: number,
    affectedFeatures?: string[]
  ): void {
    const severity = this.determineSeverity(score, threshold);

    const alert: DriftAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      modelId,
      alertType,
      severity,
      score,
      threshold,
      message: this.generateAlertMessage(alertType, score, severity),
      affectedFeatures,
      detectedAt: new Date(),
      acknowledged: false,
    };

    this.alerts.push(alert);
    this.emit('alert:created', alert);
    logger.warn(`Drift alert created for model ${modelId}: ${alert.message}`);
  }

  // ==================== Retraining Recommendations ====================

  /**
   * Determine if model should be retrained
   */
  public shouldRetrain(modelId: string): RetrainingRecommendation {
    const dataDrift = this.getLatestDataDriftScore(modelId);
    const conceptDrift = this.getLatestConceptDriftScore(modelId);
    const performanceDeg = this.getPerformanceDegradation(modelId);
    const daysSinceTraining = this.getDaysSinceLastTraining(modelId);

    const reasons: string[] = [];
    const suggestions: RetrainingSuggestion[] = [];

    const threshold = this.thresholds.get(modelId) || this.defaultThreshold;

    // Check data drift
    if (dataDrift > threshold.dataDriftScore) {
      reasons.push(`Data drift detected (score: ${dataDrift.toFixed(3)})`);
      suggestions.push({
        action: 'Update training data with recent samples',
        priority: 1,
        estimatedEffort: 'Medium',
        expectedImprovement: '5-15% accuracy improvement',
      });
    }

    // Check concept drift
    if (conceptDrift > threshold.conceptDriftScore) {
      reasons.push(`Concept drift detected (score: ${conceptDrift.toFixed(3)})`);
      suggestions.push({
        action: 'Retrain with recent labeled data',
        priority: 1,
        estimatedEffort: 'High',
        expectedImprovement: '10-20% accuracy improvement',
      });
    }

    // Check performance degradation
    if (performanceDeg > threshold.performanceDegradation) {
      reasons.push(`Performance degradation of ${(performanceDeg * 100).toFixed(1)}%`);
      suggestions.push({
        action: 'Review feature engineering and model architecture',
        priority: 2,
        estimatedEffort: 'Medium-High',
        expectedImprovement: 'Restore baseline performance',
      });
    }

    // Check training staleness
    if (daysSinceTraining > 90) {
      reasons.push(`Model not retrained in ${daysSinceTraining} days`);
      suggestions.push({
        action: 'Schedule regular retraining pipeline',
        priority: 3,
        estimatedEffort: 'Low',
        expectedImprovement: 'Maintain model freshness',
      });
    }

    const shouldRetrain = reasons.length > 0;
    const urgency = this.determineRetrainingUrgency(reasons, dataDrift, conceptDrift, performanceDeg);

    return {
      modelId,
      shouldRetrain,
      urgency,
      reasons,
      suggestedActions: suggestions.sort((a, b) => a.priority - b.priority),
      estimatedImpact: this.estimateRetrainingImpact(shouldRetrain, urgency),
      analysisDetails: {
        dataDriftScore: dataDrift,
        conceptDriftScore: conceptDrift,
        performanceDegradation: performanceDeg,
        daysSinceLastTraining: daysSinceTraining,
      },
    };
  }

  // ==================== Baseline Management ====================

  /**
   * Set baseline data for drift comparison
   */
  public setBaseline(modelId: string, data: FeatureData[]): void {
    this.baselineData.set(modelId, data);
    logger.info(`Set baseline data for model ${modelId}: ${data.length} samples`);
  }

  /**
   * Record last training date
   */
  public recordTrainingDate(modelId: string, date: Date): void {
    this.lastTrainingDates.set(modelId, date);
  }

  // ==================== Helper Methods ====================

  private calculateDistributionStats(values: number[]): DistributionStats {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
    const std = Math.sqrt(variance);

    return {
      mean,
      std,
      min: sorted[0],
      max: sorted[n - 1],
      median: sorted[Math.floor(n / 2)],
      q25: sorted[Math.floor(n * 0.25)],
      q75: sorted[Math.floor(n * 0.75)],
      sampleSize: n,
    };
  }

  private determineDriftType(
    baseline: DistributionStats,
    current: DistributionStats,
    score: number
  ): DriftType {
    if (score < 0.05) return 'none';

    const meanShift = Math.abs(current.mean - baseline.mean) / (baseline.std || 1);
    const stdChange = Math.abs(current.std - baseline.std) / (baseline.std || 1);

    if (meanShift > 2) return 'sudden';
    if (stdChange > 1) return 'incremental';
    if (score > 0.1) return 'gradual';

    return 'none';
  }

  private extractFeatureNames(data: FeatureData[]): string[] {
    const features = new Set<string>();
    for (const d of data) {
      for (const key of Object.keys(d.features)) {
        features.add(key);
      }
    }
    return Array.from(features);
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    return denominator !== 0 ? numerator / denominator : 0;
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  }

  private detectChangePoints(values: number[]): number[] {
    const changePoints: number[] = [];
    const windowSize = Math.min(10, Math.floor(values.length / 4));

    for (let i = windowSize; i < values.length - windowSize; i++) {
      const leftMean = values.slice(i - windowSize, i).reduce((a, b) => a + b, 0) / windowSize;
      const rightMean = values.slice(i, i + windowSize).reduce((a, b) => a + b, 0) / windowSize;

      if (Math.abs(rightMean - leftMean) > 0.15) {
        changePoints.push(i);
      }
    }

    return changePoints;
  }

  private identifyAffectedSegments(
    matched: Array<{ prediction: Prediction; actual: Actual }>
  ): string[] {
    // Simplified segment analysis
    const segments: string[] = [];

    // Check time-based segments
    const hourlyAccuracy = new Map<number, { correct: number; total: number }>();

    for (const { prediction, actual } of matched) {
      const hour = prediction.timestamp.getHours();
      const current = hourlyAccuracy.get(hour) || { correct: 0, total: 0 };
      current.total++;
      if (prediction.prediction === actual.actual) current.correct++;
      hourlyAccuracy.set(hour, current);
    }

    for (const [hour, stats] of hourlyAccuracy.entries()) {
      const accuracy = stats.correct / stats.total;
      if (accuracy < 0.7) {
        segments.push(`Hour ${hour} (${(accuracy * 100).toFixed(1)}% accuracy)`);
      }
    }

    return segments;
  }

  private groupByGranularity(
    data: Array<{ timestamp: Date }>,
    granularity: 'hour' | 'day' | 'week'
  ): Map<number, Array<{ prediction: Prediction; actual: Actual }>> {
    const groups = new Map<number, Array<{ prediction: Prediction; actual: Actual }>>();

    for (const item of data as Array<{ prediction: Prediction; actual: Actual; timestamp: Date }>) {
      let key: number;
      const ts = item.timestamp;

      switch (granularity) {
        case 'hour':
          key = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate(), ts.getHours()).getTime();
          break;
        case 'day':
          key = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate()).getTime();
          break;
        case 'week':
          const weekStart = new Date(ts);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).getTime();
          break;
      }

      const group = groups.get(key) || [];
      group.push(item);
      groups.set(key, group);
    }

    return groups;
  }

  private forecastAccuracy(dataPoints: AccuracyDataPoint[], periods: number): AccuracyDataPoint[] {
    if (dataPoints.length < 2) return [];

    const accuracies = dataPoints.map((d) => d.accuracy);
    const trend = this.calculateTrend(accuracies);
    const lastAccuracy = accuracies[accuracies.length - 1];
    const lastTimestamp = dataPoints[dataPoints.length - 1].timestamp;

    const forecast: AccuracyDataPoint[] = [];
    const interval = dataPoints.length > 1
      ? dataPoints[1].timestamp.getTime() - dataPoints[0].timestamp.getTime()
      : 86400000; // Default to 1 day

    for (let i = 1; i <= periods; i++) {
      const forecastedAccuracy = Math.max(0, Math.min(1, lastAccuracy + trend * i));
      forecast.push({
        timestamp: new Date(lastTimestamp.getTime() + interval * i),
        accuracy: forecastedAccuracy,
        sampleSize: 0, // Forecasted
      });
    }

    return forecast;
  }

  private determineSeverity(score: number, threshold: number): DriftAlert['severity'] {
    const ratio = score / threshold;
    if (ratio >= 3) return 'critical';
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  private generateAlertMessage(
    alertType: DriftAlert['alertType'],
    score: number,
    severity: DriftAlert['severity']
  ): string {
    const typeMessages: Record<DriftAlert['alertType'], string> = {
      data_drift: `Data drift detected with score ${score.toFixed(3)}`,
      concept_drift: `Concept drift detected with score ${score.toFixed(3)}`,
      performance_degradation: `Performance degradation of ${(score * 100).toFixed(1)}%`,
    };

    return `${severity.toUpperCase()}: ${typeMessages[alertType]}`;
  }

  private getLatestDataDriftScore(modelId: string): number {
    // Return cached or compute from latest data
    return 0.1; // Placeholder
  }

  private getLatestConceptDriftScore(modelId: string): number {
    return 0.15; // Placeholder
  }

  private getPerformanceDegradation(modelId: string): number {
    return 0.05; // Placeholder
  }

  private getDaysSinceLastTraining(modelId: string): number {
    const lastTraining = this.lastTrainingDates.get(modelId);
    if (!lastTraining) return 365;
    return Math.floor((Date.now() - lastTraining.getTime()) / (1000 * 60 * 60 * 24));
  }

  private determineRetrainingUrgency(
    reasons: string[],
    dataDrift: number,
    conceptDrift: number,
    performanceDeg: number
  ): RetrainingRecommendation['urgency'] {
    if (conceptDrift > 0.5 || performanceDeg > 0.25) return 'critical';
    if (conceptDrift > 0.3 || performanceDeg > 0.15) return 'high';
    if (reasons.length > 1) return 'medium';
    return 'low';
  }

  private estimateRetrainingImpact(shouldRetrain: boolean, urgency: RetrainingRecommendation['urgency']): string {
    if (!shouldRetrain) {
      return 'No significant impact expected. Model performing within acceptable parameters.';
    }

    switch (urgency) {
      case 'critical':
        return 'Critical: Retraining expected to restore 15-25% accuracy and prevent further degradation.';
      case 'high':
        return 'High: Retraining expected to improve accuracy by 10-15% and address drift issues.';
      case 'medium':
        return 'Medium: Retraining expected to provide 5-10% improvement and prevent future drift.';
      case 'low':
        return 'Low: Retraining may provide marginal improvements. Consider scheduling for next maintenance window.';
    }
  }

  private createNoDriftReport(modelId: string, data: FeatureData[]): DriftReport {
    return {
      modelId,
      analysisTimestamp: new Date(),
      dataWindow: {
        start: data[0]?.timestamp || new Date(),
        end: data[data.length - 1]?.timestamp || new Date(),
      },
      overallDriftScore: 0,
      driftDetected: false,
      featureDrifts: [],
      summary: 'No baseline data available. Current data has been set as baseline for future comparisons.',
      recommendations: ['Continue collecting data for future drift analysis.'],
    };
  }

  private createNoConceptDriftReport(modelId: string): ConceptDriftReport {
    return {
      modelId,
      analysisTimestamp: new Date(),
      dataWindow: { start: new Date(), end: new Date() },
      driftDetected: false,
      driftScore: 0,
      performanceChange: {
        baselineMetrics: {},
        currentMetrics: {},
        degradation: {},
      },
      driftPattern: { type: 'none', confidence: 0 },
      affectedSegments: [],
      summary: 'Insufficient data for concept drift analysis. Need at least 10 matched predictions.',
      recommendations: ['Collect more labeled data for drift analysis.'],
    };
  }

  private generateDataDriftSummary(
    significantDrifts: FeatureDriftResult[],
    overallScore: number,
    detected: boolean
  ): string {
    if (!detected) {
      return `No significant data drift detected. Overall drift score: ${overallScore.toFixed(3)}.`;
    }

    return `Data drift detected with overall score ${overallScore.toFixed(3)}. ` +
      `${significantDrifts.length} feature(s) showing significant drift: ` +
      `${significantDrifts.map((d) => d.feature).join(', ')}.`;
  }

  private generateDataDriftRecommendations(
    significantDrifts: FeatureDriftResult[],
    detected: boolean
  ): string[] {
    if (!detected) {
      return ['Continue monitoring feature distributions.'];
    }

    const recommendations = [
      'Investigate root cause of feature distribution changes.',
      'Validate data pipeline for potential issues.',
      'Consider updating training data with recent samples.',
    ];

    if (significantDrifts.length > 3) {
      recommendations.push('Multiple features drifting may indicate systemic changes. Review data sources.');
    }

    return recommendations;
  }

  private generateConceptDriftSummary(
    score: number,
    pattern: DriftPattern,
    degradation: Record<string, number>
  ): string {
    if (pattern.type === 'none') {
      return 'No concept drift detected. Model performance stable.';
    }

    const degradedMetrics = Object.entries(degradation)
      .filter(([, v]) => v > 0.01)
      .map(([k, v]) => `${k}: -${(v * 100).toFixed(1)}%`);

    return `${pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)} concept drift detected ` +
      `(score: ${score.toFixed(3)}). ${degradedMetrics.length > 0 ? `Affected metrics: ${degradedMetrics.join(', ')}` : ''}`;
  }

  private generateConceptDriftRecommendations(
    pattern: DriftPattern,
    degradation: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    switch (pattern.type) {
      case 'sudden':
        recommendations.push('Investigate recent events or changes that may have caused sudden drift.');
        recommendations.push('Consider immediate retraining with post-drift data.');
        break;
      case 'gradual':
        recommendations.push('Schedule retraining with updated data reflecting current patterns.');
        recommendations.push('Implement continuous learning if feasible.');
        break;
      case 'recurring':
        recommendations.push('Analyze cyclical patterns in the data.');
        recommendations.push('Consider time-aware features or separate models for different periods.');
        break;
    }

    if (Object.values(degradation).some((v) => v > 0.1)) {
      recommendations.push('Significant performance degradation detected. Prioritize model update.');
    }

    return recommendations;
  }
}

// Export singleton instance
export const modelDriftDetector = new ModelDriftDetector();

// Export factory function
export const createModelDriftDetector = (): ModelDriftDetector => {
  return new ModelDriftDetector();
};
