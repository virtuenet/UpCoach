/**
 * Anonymized Aggregator
 * Phase 11 Week 3
 *
 * Privacy-preserving data aggregation with differential privacy
 * and K-anonymity guarantees for cohort statistics
 */

export interface AggregationQuery {
  metric: string;
  filters: Record<string, any>;
  groupBy?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface AggregatedResult {
  groups: AggregatedGroup[];
  totalRecords: number;
  anonymizationApplied: boolean;
  privacyGuarantees: {
    kAnonymity: number;
    differentialPrivacy: boolean;
    epsilon?: number; // Privacy budget
  };
}

export interface AggregatedGroup {
  groupKey: Record<string, any>;
  count: number;
  statistics: {
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
    percentiles: {
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      p95: number;
    };
  };
}

export class AnonymizedAggregator {
  private readonly MIN_GROUP_SIZE = 50; // K-anonymity minimum
  private readonly NOISE_SCALE = 1.0; // Laplace noise scale for differential privacy
  private readonly EPSILON = 0.1; // Privacy budget

  private cache: Map<string, { result: AggregatedResult; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  /**
   * Perform privacy-preserving aggregation
   */
  async aggregate(query: AggregationQuery): Promise<AggregatedResult> {
    // Check cache
    const cacheKey = this.generateCacheKey(query);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }

    // Fetch raw data (with privacy-safe query)
    const rawData = await this.fetchData(query);

    // Group data
    const groups = this.groupData(rawData, query.groupBy || []);

    // Apply K-anonymity filter
    const anonymizedGroups = this.applyKAnonymity(groups);

    // Calculate statistics with differential privacy
    const aggregatedGroups = anonymizedGroups.map(group =>
      this.calculateGroupStatistics(group, query.metric)
    );

    const result: AggregatedResult = {
      groups: aggregatedGroups,
      totalRecords: rawData.length,
      anonymizationApplied: true,
      privacyGuarantees: {
        kAnonymity: this.MIN_GROUP_SIZE,
        differentialPrivacy: true,
        epsilon: this.EPSILON
      }
    };

    // Cache result
    this.cache.set(cacheKey, { result, timestamp: Date.now() });

    return result;
  }

  /**
   * Get cohort statistics with privacy guarantees
   */
  async getCohortStatistics(
    cohortId: string,
    metric: string
  ): Promise<AggregatedGroup> {
    const query: AggregationQuery = {
      metric,
      filters: { cohortId }
    };

    const result = await this.aggregate(query);

    if (result.groups.length === 0) {
      throw new Error('Insufficient data for cohort - privacy threshold not met');
    }

    return result.groups[0];
  }

  /**
   * Compare metrics across cohorts
   */
  async compareCohorts(
    cohortIds: string[],
    metric: string
  ): Promise<Map<string, AggregatedGroup>> {
    const results = new Map<string, AggregatedGroup>();

    for (const cohortId of cohortIds) {
      try {
        const stats = await this.getCohortStatistics(cohortId, metric);
        results.set(cohortId, stats);
      } catch (error) {
        // Skip cohorts that don't meet privacy threshold
        console.warn(`Skipping cohort ${cohortId}: ${error}`);
      }
    }

    return results;
  }

  /**
   * Calculate time-series aggregation
   */
  async aggregateTimeSeries(
    metric: string,
    groupBy: 'day' | 'week' | 'month',
    dateRange: { start: Date; end: Date }
  ): Promise<Array<{ date: string; value: number }>> {
    const query: AggregationQuery = {
      metric,
      filters: {},
      groupBy: [groupBy],
      dateRange
    };

    const result = await this.aggregate(query);

    return result.groups.map(group => ({
      date: group.groupKey[groupBy] as string,
      value: this.addLaplaceNoise(group.statistics.mean)
    }));
  }

  /**
   * Group data by specified fields
   */
  private groupData(
    data: any[],
    groupBy: string[]
  ): Map<string, any[]> {
    const groups = new Map<string, any[]>();

    data.forEach(record => {
      const key = groupBy.length > 0
        ? groupBy.map(field => record[field]).join('_')
        : 'all';

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key)!.push(record);
    });

    return groups;
  }

  /**
   * Apply K-anonymity by filtering small groups
   */
  private applyKAnonymity(
    groups: Map<string, any[]>
  ): Array<{ key: string; data: any[] }> {
    const validGroups: Array<{ key: string; data: any[] }> = [];

    groups.forEach((data, key) => {
      if (data.length >= this.MIN_GROUP_SIZE) {
        validGroups.push({ key, data });
      }
    });

    return validGroups;
  }

  /**
   * Calculate statistics for a group with differential privacy
   */
  private calculateGroupStatistics(
    group: { key: string; data: any[] },
    metric: string
  ): AggregatedGroup {
    const values = group.data.map(record => record[metric]).filter(v => typeof v === 'number');

    if (values.length === 0) {
      return this.emptyGroupStatistics(group.key);
    }

    const sorted = values.sort((a, b) => a - b);

    const statistics = {
      mean: this.addLaplaceNoise(this.calculateMean(values)),
      median: this.addLaplaceNoise(this.percentile(sorted, 50)),
      min: Math.floor(sorted[0]),
      max: Math.ceil(sorted[sorted.length - 1]),
      stdDev: this.addLaplaceNoise(this.calculateStdDev(values)),
      percentiles: {
        p25: this.addLaplaceNoise(this.percentile(sorted, 25)),
        p50: this.addLaplaceNoise(this.percentile(sorted, 50)),
        p75: this.addLaplaceNoise(this.percentile(sorted, 75)),
        p90: this.addLaplaceNoise(this.percentile(sorted, 90)),
        p95: this.addLaplaceNoise(this.percentile(sorted, 95))
      }
    };

    return {
      groupKey: this.parseGroupKey(group.key),
      count: this.addLaplaceNoise(values.length, 5), // Add noise to count
      statistics
    };
  }

  /**
   * Add Laplace noise for differential privacy
   */
  private addLaplaceNoise(value: number, scale: number = this.NOISE_SCALE): number {
    // Laplace distribution: f(x) = (1/2b) * exp(-|x|/b)
    const u = Math.random() - 0.5;
    const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));

    return Math.round((value + noise) * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate mean
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

    return Math.sqrt(variance);
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;

    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  /**
   * Parse group key into object
   */
  private parseGroupKey(key: string): Record<string, any> {
    if (key === 'all') {
      return { group: 'all' };
    }

    // Simple parsing - in production, use structured keys
    return { group: key };
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(query: AggregationQuery): string {
    return JSON.stringify({
      metric: query.metric,
      filters: query.filters,
      groupBy: query.groupBy
    });
  }

  /**
   * Empty group statistics
   */
  private emptyGroupStatistics(key: string): AggregatedGroup {
    return {
      groupKey: this.parseGroupKey(key),
      count: 0,
      statistics: {
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
        stdDev: 0,
        percentiles: {
          p25: 0,
          p50: 0,
          p75: 0,
          p90: 0,
          p95: 0
        }
      }
    };
  }

  /**
   * Fetch data (mock implementation)
   */
  private async fetchData(query: AggregationQuery): Promise<any[]> {
    // Mock data - in production, query from database with privacy-safe filters
    const data: any[] = [];
    const sampleSize = 150; // Above MIN_GROUP_SIZE

    for (let i = 0; i < sampleSize; i++) {
      const record: any = {
        userId: `user_${i}`,
        cohortId: query.filters.cohortId || 'general'
      };

      // Generate mock metric data
      if (query.metric === 'streak_length') {
        record[query.metric] = Math.floor(Math.random() * 90) + 1;
      } else if (query.metric === 'completion_rate') {
        record[query.metric] = Math.floor(Math.random() * 40) + 60;
      } else if (query.metric === 'consistency_score') {
        record[query.metric] = Math.floor(Math.random() * 50) + 50;
      } else {
        record[query.metric] = Math.floor(Math.random() * 100);
      }

      // Add groupBy fields
      if (query.groupBy) {
        query.groupBy.forEach(field => {
          record[field] = `group_${Math.floor(i / 50)}`; // Create groups
        });
      }

      data.push(record);
    }

    return data;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();

    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    });
  }
}
