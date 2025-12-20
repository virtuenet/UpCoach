/**
 * IQR (Interquartile Range) Anomaly Detector
 * Non-parametric outlier detection using quartiles
 * More robust to non-normal distributions than Z-score
 * @version 1.0.0
 */

import { logger } from '../../../utils/logger';

export interface IQRResult {
  value: number;
  quartile: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'lower_outlier' | 'upper_outlier';
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  lowerBound: number;
  upperBound: number;
  iqr: number;
}

export interface IQRConfig {
  multiplier: number;       // Default: 1.5 (standard), 3.0 (extreme outliers)
  minSampleSize: number;    // Minimum samples needed
  inclusiveQuartiles: boolean; // Include boundary values in quartiles
}

export interface IQRStatistics {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
  lowerExtremeBound: number;
  upperExtremeBound: number;
}

export class IQRDetector {
  private config: IQRConfig;

  constructor(config: Partial<IQRConfig> = {}) {
    this.config = {
      multiplier: config.multiplier ?? 1.5,
      minSampleSize: config.minSampleSize ?? 4,
      inclusiveQuartiles: config.inclusiveQuartiles ?? true,
    };
  }

  /**
   * Calculate quartile value at a given percentile
   */
  private calculateQuartile(sortedData: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedData.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sortedData[lower];
    }

    // Linear interpolation
    const fraction = index - lower;
    return sortedData[lower] + fraction * (sortedData[upper] - sortedData[lower]);
  }

  /**
   * Calculate full IQR statistics for a dataset
   */
  public calculateStatistics(data: number[]): IQRStatistics | null {
    if (data.length < this.config.minSampleSize) {
      logger.warn(`[IQRDetector] Insufficient data: ${data.length} < ${this.config.minSampleSize}`);
      return null;
    }

    const sorted = [...data].sort((a, b) => a - b);

    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const q1 = this.calculateQuartile(sorted, 25);
    const median = this.calculateQuartile(sorted, 50);
    const q3 = this.calculateQuartile(sorted, 75);
    const iqr = q3 - q1;

    // Standard bounds (1.5 * IQR)
    const lowerBound = q1 - this.config.multiplier * iqr;
    const upperBound = q3 + this.config.multiplier * iqr;

    // Extreme bounds (3 * IQR)
    const lowerExtremeBound = q1 - 3 * iqr;
    const upperExtremeBound = q3 + 3 * iqr;

    return {
      min,
      q1,
      median,
      q3,
      max,
      iqr,
      lowerBound,
      upperBound,
      lowerExtremeBound,
      upperExtremeBound,
    };
  }

  /**
   * Determine severity based on how far outside bounds the value is
   */
  private determineSeverity(value: number, stats: IQRStatistics): 'low' | 'medium' | 'high' {
    if (value < stats.lowerExtremeBound || value > stats.upperExtremeBound) {
      return 'high';
    }
    if (value < stats.lowerBound || value > stats.upperBound) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Determine which quartile a value falls into
   */
  private determineQuartile(
    value: number,
    stats: IQRStatistics
  ): 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'lower_outlier' | 'upper_outlier' {
    if (value < stats.lowerBound) return 'lower_outlier';
    if (value > stats.upperBound) return 'upper_outlier';
    if (value <= stats.q1) return 'Q1';
    if (value <= stats.median) return 'Q2';
    if (value <= stats.q3) return 'Q3';
    return 'Q4';
  }

  /**
   * Detect if a single value is an anomaly given historical data
   */
  public detectSingle(value: number, historicalData: number[]): IQRResult | null {
    const stats = this.calculateStatistics(historicalData);

    if (!stats) {
      return null;
    }

    const isAnomaly = value < stats.lowerBound || value > stats.upperBound;
    const quartile = this.determineQuartile(value, stats);

    return {
      value,
      quartile,
      isAnomaly,
      severity: this.determineSeverity(value, stats),
      lowerBound: stats.lowerBound,
      upperBound: stats.upperBound,
      iqr: stats.iqr,
    };
  }

  /**
   * Detect anomalies in a batch of values
   */
  public detectBatch(data: number[]): IQRResult[] {
    const stats = this.calculateStatistics(data);

    if (!stats) {
      return data.map(value => ({
        value,
        quartile: 'Q2' as const,
        isAnomaly: false,
        severity: 'low' as const,
        lowerBound: value,
        upperBound: value,
        iqr: 0,
      }));
    }

    return data.map(value => {
      const isAnomaly = value < stats.lowerBound || value > stats.upperBound;
      return {
        value,
        quartile: this.determineQuartile(value, stats),
        isAnomaly,
        severity: this.determineSeverity(value, stats),
        lowerBound: stats.lowerBound,
        upperBound: stats.upperBound,
        iqr: stats.iqr,
      };
    });
  }

  /**
   * Get outlier indices from a dataset
   */
  public getOutlierIndices(data: number[]): { lower: number[]; upper: number[] } {
    const stats = this.calculateStatistics(data);

    if (!stats) {
      return { lower: [], upper: [] };
    }

    const lower: number[] = [];
    const upper: number[] = [];

    data.forEach((value, index) => {
      if (value < stats.lowerBound) {
        lower.push(index);
      } else if (value > stats.upperBound) {
        upper.push(index);
      }
    });

    return { lower, upper };
  }

  /**
   * Remove outliers from dataset (returns cleaned data)
   */
  public removeOutliers(data: number[]): number[] {
    const stats = this.calculateStatistics(data);

    if (!stats) {
      return [...data];
    }

    return data.filter(value => value >= stats.lowerBound && value <= stats.upperBound);
  }

  /**
   * Winsorize data (cap outliers to bounds instead of removing)
   */
  public winsorize(data: number[]): number[] {
    const stats = this.calculateStatistics(data);

    if (!stats) {
      return [...data];
    }

    return data.map(value => {
      if (value < stats.lowerBound) return stats.lowerBound;
      if (value > stats.upperBound) return stats.upperBound;
      return value;
    });
  }

  /**
   * Calculate skewness using quartiles (Bowley skewness)
   */
  public calculateSkewness(data: number[]): number | null {
    const stats = this.calculateStatistics(data);

    if (!stats || stats.iqr === 0) {
      return null;
    }

    // Bowley (quartile) skewness coefficient
    return (stats.q3 + stats.q1 - 2 * stats.median) / stats.iqr;
  }
}

export const createIQRDetector = (config?: Partial<IQRConfig>): IQRDetector => {
  return new IQRDetector(config);
};
