/**
 * Z-Score Anomaly Detector
 * Statistical outlier detection using standard deviation
 * @version 1.0.0
 */

import { logger } from '../../../utils/logger';

export interface ZScoreResult {
  value: number;
  zScore: number;
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  percentile: number;
}

export interface ZScoreConfig {
  threshold: number;        // Default: 3.0 (3 standard deviations)
  minSampleSize: number;    // Minimum samples needed for reliable detection
  windowSize?: number;      // For rolling z-score calculation
}

export class ZScoreDetector {
  private config: ZScoreConfig;
  private dataBuffer: number[] = [];

  constructor(config: Partial<ZScoreConfig> = {}) {
    this.config = {
      threshold: config.threshold ?? 3.0,
      minSampleSize: config.minSampleSize ?? 30,
      windowSize: config.windowSize,
    };
  }

  /**
   * Calculate mean of an array
   */
  private calculateMean(data: number[]): number {
    if (data.length === 0) return 0;
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(data: number[], mean: number): number {
    if (data.length < 2) return 0;
    const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (data.length - 1);
    return Math.sqrt(variance);
  }

  /**
   * Calculate Z-score for a single value
   */
  public calculateZScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  }

  /**
   * Convert z-score to approximate percentile using standard normal distribution
   */
  private zScoreToPercentile(zScore: number): number {
    // Approximate using error function
    const sign = zScore < 0 ? -1 : 1;
    const absZ = Math.abs(zScore);

    // Approximation of the cumulative distribution function
    const t = 1 / (1 + 0.2316419 * absZ);
    const d = 0.3989423 * Math.exp(-absZ * absZ / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return sign === 1 ? (1 - p) * 100 : p * 100;
  }

  /**
   * Determine severity based on z-score magnitude
   */
  private determineSeverity(zScore: number): 'low' | 'medium' | 'high' {
    const absZ = Math.abs(zScore);
    if (absZ >= 4) return 'high';
    if (absZ >= 3.5) return 'medium';
    return 'low';
  }

  /**
   * Detect if a single value is an anomaly given historical data
   */
  public detectSingle(value: number, historicalData: number[]): ZScoreResult {
    if (historicalData.length < this.config.minSampleSize) {
      logger.warn(`[ZScoreDetector] Insufficient data: ${historicalData.length} < ${this.config.minSampleSize}`);
      return {
        value,
        zScore: 0,
        isAnomaly: false,
        severity: 'low',
        percentile: 50,
      };
    }

    const mean = this.calculateMean(historicalData);
    const stdDev = this.calculateStdDev(historicalData, mean);
    const zScore = this.calculateZScore(value, mean, stdDev);
    const isAnomaly = Math.abs(zScore) > this.config.threshold;

    return {
      value,
      zScore,
      isAnomaly,
      severity: this.determineSeverity(zScore),
      percentile: this.zScoreToPercentile(zScore),
    };
  }

  /**
   * Detect anomalies in a batch of values
   */
  public detectBatch(data: number[]): ZScoreResult[] {
    if (data.length < this.config.minSampleSize) {
      logger.warn(`[ZScoreDetector] Insufficient data for batch detection`);
      return data.map(value => ({
        value,
        zScore: 0,
        isAnomaly: false,
        severity: 'low' as const,
        percentile: 50,
      }));
    }

    const mean = this.calculateMean(data);
    const stdDev = this.calculateStdDev(data, mean);

    return data.map(value => {
      const zScore = this.calculateZScore(value, mean, stdDev);
      return {
        value,
        zScore,
        isAnomaly: Math.abs(zScore) > this.config.threshold,
        severity: this.determineSeverity(zScore),
        percentile: this.zScoreToPercentile(zScore),
      };
    });
  }

  /**
   * Rolling z-score detection for streaming data
   */
  public detectRolling(value: number): ZScoreResult {
    this.dataBuffer.push(value);

    // Maintain window size
    if (this.config.windowSize && this.dataBuffer.length > this.config.windowSize) {
      this.dataBuffer.shift();
    }

    // Use all buffered data excluding the current value for reference
    const historicalData = this.dataBuffer.slice(0, -1);
    return this.detectSingle(value, historicalData);
  }

  /**
   * Modified Z-score using median (more robust to outliers)
   */
  public detectWithMedian(value: number, historicalData: number[]): ZScoreResult {
    if (historicalData.length < this.config.minSampleSize) {
      return {
        value,
        zScore: 0,
        isAnomaly: false,
        severity: 'low',
        percentile: 50,
      };
    }

    // Calculate median
    const sorted = [...historicalData].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    // Calculate MAD (Median Absolute Deviation)
    const absoluteDeviations = historicalData.map(x => Math.abs(x - median));
    const sortedDeviations = absoluteDeviations.sort((a, b) => a - b);
    const mad = sortedDeviations.length % 2 === 0
      ? (sortedDeviations[sortedDeviations.length / 2 - 1] + sortedDeviations[sortedDeviations.length / 2]) / 2
      : sortedDeviations[Math.floor(sortedDeviations.length / 2)];

    // Modified z-score (using 0.6745 as consistency constant for normal distribution)
    const modifiedZScore = mad === 0 ? 0 : 0.6745 * (value - median) / mad;
    const isAnomaly = Math.abs(modifiedZScore) > this.config.threshold;

    return {
      value,
      zScore: modifiedZScore,
      isAnomaly,
      severity: this.determineSeverity(modifiedZScore),
      percentile: this.zScoreToPercentile(modifiedZScore),
    };
  }

  /**
   * Reset the data buffer for rolling detection
   */
  public reset(): void {
    this.dataBuffer = [];
  }

  /**
   * Get current buffer size
   */
  public getBufferSize(): number {
    return this.dataBuffer.length;
  }
}

export const createZScoreDetector = (config?: Partial<ZScoreConfig>): ZScoreDetector => {
  return new ZScoreDetector(config);
};
