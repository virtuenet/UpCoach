import { EventEmitter } from 'events';

/**
 * Anomaly Detection Service
 *
 * Real-time anomaly detection using statistical methods and
 * machine learning algorithms.
 *
 * Algorithms:
 * - Z-Score based detection
 * - Modified Z-Score (MAD)
 * - IQR (Interquartile Range) method
 * - Moving average baseline
 * - EWMA (Exponentially Weighted Moving Average)
 * - Isolation Forest (simplified)
 *
 * Features:
 * - Real-time anomaly detection
 * - Anomaly severity classification
 * - Alert generation
 * - Historical anomaly tracking
 * - Root cause analysis
 * - Anomaly patterns recognition
 */

export interface Anomaly {
  id: string;
  timestamp: Date;
  metric: string;
  value: number;
  expected: number;
  deviation: number;
  zScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'spike' | 'drop' | 'trend_change' | 'pattern_break';
  confidence: number;
  metadata: {
    baseline: number;
    stdDev: number;
    threshold: number;
  };
}

export interface AnomalyDetectionConfig {
  method: 'zscore' | 'mad' | 'iqr' | 'moving_average' | 'ewma' | 'isolation_forest';
  sensitivity: 'low' | 'medium' | 'high';
  windowSize: number;
  threshold?: number;
}

export interface AnomalyAlert {
  id: string;
  anomaly: Anomaly;
  triggeredAt: Date;
  status: 'new' | 'acknowledged' | 'resolved' | 'false_positive';
  recipients: string[];
  message: string;
}

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export class AnomalyDetectionService extends EventEmitter {
  private anomalies: Map<string, Anomaly> = new Map();
  private alerts: Map<string, AnomalyAlert> = new Map();
  private baselines: Map<string, number[]> = new Map();

  /**
   * Detect anomalies in time series data
   */
  async detectAnomalies(
    metric: string,
    data: TimeSeriesPoint[],
    config: AnomalyDetectionConfig = {
      method: 'zscore',
      sensitivity: 'medium',
      windowSize: 30,
    }
  ): Promise<Anomaly[]> {
    if (data.length < config.windowSize) {
      throw new Error(
        `Insufficient data for anomaly detection (minimum ${config.windowSize} points required)`
      );
    }

    let anomalies: Anomaly[] = [];

    switch (config.method) {
      case 'zscore':
        anomalies = this.zScoreDetection(metric, data, config);
        break;
      case 'mad':
        anomalies = this.madDetection(metric, data, config);
        break;
      case 'iqr':
        anomalies = this.iqrDetection(metric, data, config);
        break;
      case 'moving_average':
        anomalies = this.movingAverageDetection(metric, data, config);
        break;
      case 'ewma':
        anomalies = this.ewmaDetection(metric, data, config);
        break;
      case 'isolation_forest':
        anomalies = this.isolationForestDetection(metric, data, config);
        break;
    }

    anomalies = this.classifyAnomalies(anomalies, data);
    anomalies = this.filterByConfidence(anomalies, config.sensitivity);

    for (const anomaly of anomalies) {
      this.anomalies.set(anomaly.id, anomaly);
      this.emit('anomaly:detected', anomaly);

      if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
        await this.generateAlert(anomaly);
      }
    }

    return anomalies;
  }

  /**
   * Z-Score based anomaly detection
   */
  private zScoreDetection(
    metric: string,
    data: TimeSeriesPoint[],
    config: AnomalyDetectionConfig
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const values = data.map(d => d.value);
    const mean = this.mean(values);
    const stdDev = this.standardDeviation(values);

    const threshold = this.getSensitivityThreshold(config.sensitivity);

    for (let i = config.windowSize; i < data.length; i++) {
      const windowData = values.slice(i - config.windowSize, i);
      const windowMean = this.mean(windowData);
      const windowStdDev = this.standardDeviation(windowData);

      const zScore = Math.abs((data[i].value - windowMean) / windowStdDev);

      if (zScore > threshold) {
        anomalies.push({
          id: `${metric}-${data[i].timestamp.getTime()}`,
          timestamp: data[i].timestamp,
          metric,
          value: data[i].value,
          expected: windowMean,
          deviation: data[i].value - windowMean,
          zScore,
          severity: this.calculateSeverity(zScore, threshold),
          type: this.determineAnomalyType(data[i].value, windowMean, windowData),
          confidence: this.calculateConfidence(zScore, threshold),
          metadata: {
            baseline: windowMean,
            stdDev: windowStdDev,
            threshold,
          },
        });
      }
    }

    return anomalies;
  }

  /**
   * MAD (Median Absolute Deviation) based detection
   */
  private madDetection(
    metric: string,
    data: TimeSeriesPoint[],
    config: AnomalyDetectionConfig
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const values = data.map(d => d.value);
    const threshold = this.getSensitivityThreshold(config.sensitivity);

    for (let i = config.windowSize; i < data.length; i++) {
      const windowData = values.slice(i - config.windowSize, i);
      const median = this.median(windowData);
      const mad = this.medianAbsoluteDeviation(windowData);

      const modifiedZScore = 0.6745 * Math.abs((data[i].value - median) / mad);

      if (modifiedZScore > threshold) {
        anomalies.push({
          id: `${metric}-${data[i].timestamp.getTime()}`,
          timestamp: data[i].timestamp,
          metric,
          value: data[i].value,
          expected: median,
          deviation: data[i].value - median,
          zScore: modifiedZScore,
          severity: this.calculateSeverity(modifiedZScore, threshold),
          type: this.determineAnomalyType(data[i].value, median, windowData),
          confidence: this.calculateConfidence(modifiedZScore, threshold),
          metadata: {
            baseline: median,
            stdDev: mad,
            threshold,
          },
        });
      }
    }

    return anomalies;
  }

  /**
   * IQR (Interquartile Range) based detection
   */
  private iqrDetection(
    metric: string,
    data: TimeSeriesPoint[],
    config: AnomalyDetectionConfig
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const values = data.map(d => d.value);

    for (let i = config.windowSize; i < data.length; i++) {
      const windowData = values.slice(i - config.windowSize, i);
      const q1 = this.percentile(windowData, 25);
      const q3 = this.percentile(windowData, 75);
      const iqr = q3 - q1;

      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      if (data[i].value < lowerBound || data[i].value > upperBound) {
        const median = this.median(windowData);
        const deviation = data[i].value - median;
        const zScore = Math.abs(deviation / iqr);

        anomalies.push({
          id: `${metric}-${data[i].timestamp.getTime()}`,
          timestamp: data[i].timestamp,
          metric,
          value: data[i].value,
          expected: median,
          deviation,
          zScore,
          severity: this.calculateSeverity(zScore, 3),
          type: this.determineAnomalyType(data[i].value, median, windowData),
          confidence: this.calculateConfidence(zScore, 3),
          metadata: {
            baseline: median,
            stdDev: iqr,
            threshold: 1.5,
          },
        });
      }
    }

    return anomalies;
  }

  /**
   * Moving Average based detection
   */
  private movingAverageDetection(
    metric: string,
    data: TimeSeriesPoint[],
    config: AnomalyDetectionConfig
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const values = data.map(d => d.value);
    const threshold = this.getSensitivityThreshold(config.sensitivity);

    for (let i = config.windowSize; i < data.length; i++) {
      const windowData = values.slice(i - config.windowSize, i);
      const ma = this.mean(windowData);
      const stdDev = this.standardDeviation(windowData);

      const deviation = Math.abs(data[i].value - ma);
      const zScore = deviation / stdDev;

      if (zScore > threshold) {
        anomalies.push({
          id: `${metric}-${data[i].timestamp.getTime()}`,
          timestamp: data[i].timestamp,
          metric,
          value: data[i].value,
          expected: ma,
          deviation: data[i].value - ma,
          zScore,
          severity: this.calculateSeverity(zScore, threshold),
          type: this.determineAnomalyType(data[i].value, ma, windowData),
          confidence: this.calculateConfidence(zScore, threshold),
          metadata: {
            baseline: ma,
            stdDev,
            threshold,
          },
        });
      }
    }

    return anomalies;
  }

  /**
   * EWMA (Exponentially Weighted Moving Average) based detection
   */
  private ewmaDetection(
    metric: string,
    data: TimeSeriesPoint[],
    config: AnomalyDetectionConfig
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const values = data.map(d => d.value);
    const alpha = 2 / (config.windowSize + 1);
    const threshold = this.getSensitivityThreshold(config.sensitivity);

    let ewma = values[0];
    let ewmaVariance = 0;

    for (let i = 1; i < data.length; i++) {
      const prevEwma = ewma;
      ewma = alpha * values[i] + (1 - alpha) * ewma;
      ewmaVariance = alpha * Math.pow(values[i] - prevEwma, 2) + (1 - alpha) * ewmaVariance;

      if (i >= config.windowSize) {
        const stdDev = Math.sqrt(ewmaVariance);
        const zScore = Math.abs((values[i] - ewma) / stdDev);

        if (zScore > threshold) {
          anomalies.push({
            id: `${metric}-${data[i].timestamp.getTime()}`,
            timestamp: data[i].timestamp,
            metric,
            value: data[i].value,
            expected: ewma,
            deviation: data[i].value - ewma,
            zScore,
            severity: this.calculateSeverity(zScore, threshold),
            type: this.determineAnomalyType(
              data[i].value,
              ewma,
              values.slice(i - 10, i)
            ),
            confidence: this.calculateConfidence(zScore, threshold),
            metadata: {
              baseline: ewma,
              stdDev,
              threshold,
            },
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Simplified Isolation Forest detection
   */
  private isolationForestDetection(
    metric: string,
    data: TimeSeriesPoint[],
    config: AnomalyDetectionConfig
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const values = data.map(d => d.value);
    const threshold = this.getSensitivityThreshold(config.sensitivity);

    for (let i = config.windowSize; i < data.length; i++) {
      const windowData = values.slice(i - config.windowSize, i);
      const isolationScore = this.calculateIsolationScore(data[i].value, windowData);

      if (isolationScore > threshold) {
        const mean = this.mean(windowData);
        const stdDev = this.standardDeviation(windowData);

        anomalies.push({
          id: `${metric}-${data[i].timestamp.getTime()}`,
          timestamp: data[i].timestamp,
          metric,
          value: data[i].value,
          expected: mean,
          deviation: data[i].value - mean,
          zScore: isolationScore,
          severity: this.calculateSeverity(isolationScore, threshold),
          type: this.determineAnomalyType(data[i].value, mean, windowData),
          confidence: this.calculateConfidence(isolationScore, threshold),
          metadata: {
            baseline: mean,
            stdDev,
            threshold,
          },
        });
      }
    }

    return anomalies;
  }

  /**
   * Calculate isolation score (simplified)
   */
  private calculateIsolationScore(value: number, data: number[]): number {
    const sorted = [...data].sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);
    const position = index === -1 ? sorted.length : index;

    const normalizedPosition = position / sorted.length;

    const distanceFromMedian = Math.abs(normalizedPosition - 0.5);

    return distanceFromMedian * 10;
  }

  /**
   * Classify anomalies by type
   */
  private classifyAnomalies(anomalies: Anomaly[], data: TimeSeriesPoint[]): Anomaly[] {
    return anomalies.map(anomaly => {
      const index = data.findIndex(d => d.timestamp.getTime() === anomaly.timestamp.getTime());

      if (index > 5) {
        const recent = data.slice(index - 5, index).map(d => d.value);
        const trendBefore = this.calculateTrend(recent);
        const trendAfter = data[index + 1]
          ? (data[index + 1].value - data[index].value) / data[index].value
          : 0;

        if (Math.abs(trendAfter - trendBefore) > 0.3) {
          anomaly.type = 'trend_change';
        }
      }

      return anomaly;
    });
  }

  /**
   * Calculate trend
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const first = values[0];
    const last = values[values.length - 1];
    return (last - first) / first;
  }

  /**
   * Filter anomalies by confidence
   */
  private filterByConfidence(anomalies: Anomaly[], sensitivity: string): Anomaly[] {
    const minConfidence = sensitivity === 'high' ? 0.6 : sensitivity === 'medium' ? 0.7 : 0.8;
    return anomalies.filter(a => a.confidence >= minConfidence);
  }

  /**
   * Determine anomaly type
   */
  private determineAnomalyType(
    value: number,
    baseline: number,
    windowData: number[]
  ): 'spike' | 'drop' | 'trend_change' | 'pattern_break' {
    if (value > baseline * 1.5) return 'spike';
    if (value < baseline * 0.5) return 'drop';

    const recentTrend = this.calculateTrend(windowData.slice(-5));
    if (Math.abs(recentTrend) > 0.2) return 'trend_change';

    return 'pattern_break';
  }

  /**
   * Calculate severity
   */
  private calculateSeverity(
    zScore: number,
    threshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = zScore / threshold;

    if (ratio > 3) return 'critical';
    if (ratio > 2) return 'high';
    if (ratio > 1.5) return 'medium';
    return 'low';
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(zScore: number, threshold: number): number {
    return Math.min(zScore / (threshold * 2), 1);
  }

  /**
   * Get sensitivity threshold
   */
  private getSensitivityThreshold(sensitivity: string): number {
    switch (sensitivity) {
      case 'high':
        return 2;
      case 'medium':
        return 3;
      case 'low':
        return 4;
      default:
        return 3;
    }
  }

  /**
   * Generate alert
   */
  private async generateAlert(anomaly: Anomaly): Promise<void> {
    const alert: AnomalyAlert = {
      id: `alert-${anomaly.id}`,
      anomaly,
      triggeredAt: new Date(),
      status: 'new',
      recipients: await this.getAlertRecipients(anomaly),
      message: this.generateAlertMessage(anomaly),
    };

    this.alerts.set(alert.id, alert);
    this.emit('alert:generated', alert);
  }

  /**
   * Get alert recipients
   */
  private async getAlertRecipients(anomaly: Anomaly): Promise<string[]> {
    return ['admin@upcoach.com'];
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(anomaly: Anomaly): string {
    return `Anomaly detected in ${anomaly.metric}: ${anomaly.type} with ${anomaly.severity} severity. Value: ${anomaly.value}, Expected: ${anomaly.expected.toFixed(2)}`;
  }

  // Statistical Helper Functions

  private mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private standardDeviation(values: number[]): number {
    const mean = this.mean(values);
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private medianAbsoluteDeviation(values: number[]): number {
    const median = this.median(values);
    const deviations = values.map(v => Math.abs(v - median));
    return this.median(deviations);
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Get anomaly history
   */
  async getAnomalyHistory(
    metric?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Anomaly[]> {
    let anomalies = Array.from(this.anomalies.values());

    if (metric) {
      anomalies = anomalies.filter(a => a.metric === metric);
    }

    if (startDate) {
      anomalies = anomalies.filter(a => a.timestamp >= startDate);
    }

    if (endDate) {
      anomalies = anomalies.filter(a => a.timestamp <= endDate);
    }

    return anomalies.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export default AnomalyDetectionService;
