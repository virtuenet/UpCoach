import { Pool } from 'pg';
import { logger } from '../../utils/logger';

/**
 * Data Drift Detector
 *
 * Detects distribution shifts in features using statistical tests
 * Implements PSI, KS test, and KL divergence
 */

export interface FeatureDistribution {
  featureName: string;
  mean: number;
  std: number;
  min: number;
  max: number;
  percentiles: Record<number, number>;
  histogram: { bin: number; count: number }[];
}

export class DriftDetectorService {
  private db: Pool;
  private baselineDistributions: Map<string, FeatureDistribution> = new Map();

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Calculate Population Stability Index (PSI)
   *
   * PSI < 0.1: No significant change
   * 0.1 <= PSI < 0.2: Moderate change
   * PSI >= 0.2: Significant change (drift detected)
   */
  calculatePSI(
    baseline: number[],
    current: number[],
    numBins: number = 10
  ): number {
    const baselineBins = this.createBins(baseline, numBins);
    const currentBins = this.createBins(current, numBins);

    let psi = 0;

    for (let i = 0; i < numBins; i++) {
      const baselinePercent = baselineBins[i] / baseline.length;
      const currentPercent = currentBins[i] / current.length;

      // Add small epsilon to avoid division by zero
      const epsilon = 0.0001;
      const adjustedBaseline = baselinePercent + epsilon;
      const adjustedCurrent = currentPercent + epsilon;

      psi += (adjustedCurrent - adjustedBaseline) * Math.log(adjustedCurrent / adjustedBaseline);
    }

    return psi;
  }

  /**
   * Calculate Kolmogorov-Smirnov (KS) statistic
   *
   * KS measures max distance between CDFs
   * KS > 0.3 typically indicates drift
   */
  calculateKS(baseline: number[], current: number[]): {
    statistic: number;
    pValue: number;
  } {
    const sortedBaseline = [...baseline].sort((a, b) => a - b);
    const sortedCurrent = [...current].sort((a, b) => a - b);

    const n1 = sortedBaseline.length;
    const n2 = sortedCurrent.length;

    let i = 0;
    let j = 0;
    let maxD = 0;

    while (i < n1 && j < n2) {
      const cdf1 = (i + 1) / n1;
      const cdf2 = (j + 1) / n2;

      const d = Math.abs(cdf1 - cdf2);
      maxD = Math.max(maxD, d);

      if (sortedBaseline[i] < sortedCurrent[j]) {
        i++;
      } else {
        j++;
      }
    }

    // Simplified p-value calculation (approximation)
    const n = Math.sqrt((n1 * n2) / (n1 + n2));
    const lambda = maxD * n;
    const pValue = Math.exp(-2 * lambda * lambda);

    return {
      statistic: maxD,
      pValue,
    };
  }

  /**
   * Calculate KL Divergence
   *
   * Measures how one distribution differs from another
   * Higher values indicate more drift
   */
  calculateKLDivergence(baseline: number[], current: number[], numBins: number = 10): number {
    const baselineBins = this.createBins(baseline, numBins);
    const currentBins = this.createBins(current, numBins);

    let kl = 0;
    const epsilon = 0.0001;

    for (let i = 0; i < numBins; i++) {
      const p = (baselineBins[i] / baseline.length) + epsilon;
      const q = (currentBins[i] / current.length) + epsilon;

      kl += p * Math.log(p / q);
    }

    return kl;
  }

  /**
   * Create histogram bins
   */
  private createBins(data: number[], numBins: number): number[] {
    if (data.length === 0) {
      return new Array(numBins).fill(0);
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / numBins;

    const bins = new Array(numBins).fill(0);

    for (const value of data) {
      let binIndex = Math.floor((value - min) / binWidth);
      if (binIndex >= numBins) {
        binIndex = numBins - 1;
      }
      bins[binIndex]++;
    }

    return bins;
  }

  /**
   * Store baseline distribution
   */
  async storeBaseline(
    modelName: string,
    featureName: string,
    data: number[]
  ): Promise<void> {
    const distribution = this.calculateDistribution(featureName, data);

    const query = `
      INSERT INTO ml_baseline_distributions (
        model_name,
        feature_name,
        mean,
        std,
        min,
        max,
        percentiles,
        histogram,
        sample_size,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (model_name, feature_name)
      DO UPDATE SET
        mean = EXCLUDED.mean,
        std = EXCLUDED.std,
        min = EXCLUDED.min,
        max = EXCLUDED.max,
        percentiles = EXCLUDED.percentiles,
        histogram = EXCLUDED.histogram,
        sample_size = EXCLUDED.sample_size,
        updated_at = NOW()
    `;

    await this.db.query(query, [
      modelName,
      featureName,
      distribution.mean,
      distribution.std,
      distribution.min,
      distribution.max,
      JSON.stringify(distribution.percentiles),
      JSON.stringify(distribution.histogram),
      data.length,
    ]);

    this.baselineDistributions.set(
      `${modelName}:${featureName}`,
      distribution
    );

    logger.info('Baseline distribution stored', {
      modelName,
      featureName,
      sampleSize: data.length,
    });
  }

  /**
   * Detect drift for a feature
   */
  async detectDrift(
    modelName: string,
    featureName: string,
    currentData: number[]
  ): Promise<{
    isDrifted: boolean;
    psi: number;
    ksStatistic: number;
    pValue: number;
    klDivergence: number;
  }> {
    // Get baseline data
    const baseline = await this.getBaseline(modelName, featureName);

    if (!baseline) {
      logger.warn('No baseline found for feature, skipping drift detection', {
        modelName,
        featureName,
      });
      return {
        isDrifted: false,
        psi: 0,
        ksStatistic: 0,
        pValue: 1,
        klDivergence: 0,
      };
    }

    // Calculate drift metrics
    const psi = this.calculatePSI(baseline, currentData);
    const ks = this.calculateKS(baseline, currentData);
    const klDivergence = this.calculateKLDivergence(baseline, currentData);

    // Determine if drift detected
    const isDrifted = psi >= 0.2 || ks.statistic >= 0.3;

    logger.info('Drift detection completed', {
      modelName,
      featureName,
      psi,
      ksStatistic: ks.statistic,
      isDrifted,
    });

    return {
      isDrifted,
      psi,
      ksStatistic: ks.statistic,
      pValue: ks.pValue,
      klDivergence,
    };
  }

  /**
   * Get baseline data
   */
  private async getBaseline(modelName: string, featureName: string): Promise<number[] | null> {
    // Check cache
    const cacheKey = `${modelName}:${featureName}`;
    const cached = this.baselineDistributions.get(cacheKey);

    if (cached) {
      // Reconstruct data from histogram (approximation)
      return this.reconstructFromHistogram(cached.histogram);
    }

    // Load from database
    const query = `
      SELECT histogram
      FROM ml_baseline_distributions
      WHERE model_name = $1 AND feature_name = $2
    `;

    const result = await this.db.query(query, [modelName, featureName]);

    if (result.rows.length === 0) {
      return null;
    }

    const histogram = result.rows[0].histogram;
    return this.reconstructFromHistogram(histogram);
  }

  /**
   * Calculate feature distribution statistics
   */
  private calculateDistribution(featureName: string, data: number[]): FeatureDistribution {
    const sorted = [...data].sort((a, b) => a - b);

    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const std = Math.sqrt(variance);

    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    const percentiles: Record<number, number> = {};
    [10, 25, 50, 75, 90, 95, 99].forEach(p => {
      const index = Math.floor((p / 100) * sorted.length);
      percentiles[p] = sorted[index];
    });

    const histogram = this.createBins(data, 10).map((count, bin) => ({
      bin,
      count,
    }));

    return {
      featureName,
      mean,
      std,
      min,
      max,
      percentiles,
      histogram,
    };
  }

  /**
   * Reconstruct data from histogram (approximation)
   */
  private reconstructFromHistogram(histogram: { bin: number; count: number }[]): number[] {
    const data: number[] = [];

    histogram.forEach(({ bin, count }) => {
      // Use bin midpoint as representative value
      for (let i = 0; i < count; i++) {
        data.push(bin);
      }
    });

    return data;
  }

  /**
   * Detect drift for all features
   */
  async detectAllDrift(
    modelName: string,
    currentFeatures: Record<string, number[]>
  ): Promise<Map<string, {
    isDrifted: boolean;
    psi: number;
    ksStatistic: number;
    pValue: number;
    klDivergence: number;
  }>> {
    const results = new Map();

    for (const [featureName, data] of Object.entries(currentFeatures)) {
      const drift = await this.detectDrift(modelName, featureName, data);
      results.set(featureName, drift);
    }

    return results;
  }
}
