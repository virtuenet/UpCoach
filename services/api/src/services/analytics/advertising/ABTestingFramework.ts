/**
 * A/B Testing Framework for Content and Campaign Optimization
 *
 * Provides comprehensive A/B testing capabilities for:
 * - Content variations (headlines, copy, images)
 * - Campaign settings (targeting, bidding, budgets)
 * - Landing page optimization
 * - Creative testing
 * - Statistical significance calculation
 */

import { EventEmitter } from 'events';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { Logger } from 'winston';
import * as stats from 'simple-statistics';
import crypto from 'crypto';

export interface ABTest {
  testId: string;
  name: string;
  description: string;
  type: 'content' | 'campaign' | 'creative' | 'landing_page' | 'audience';
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  startDate: Date;
  endDate?: Date;
  variants: TestVariant[];
  metrics: TestMetric[];
  configuration: TestConfiguration;
  results?: TestResults;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestVariant {
  variantId: string;
  name: string;
  description: string;
  isControl: boolean;
  trafficAllocation: number; // Percentage of traffic (0-100)
  configuration: Record<string, any>;
  status: 'active' | 'paused' | 'stopped';
}

export interface TestMetric {
  name: string;
  type: 'primary' | 'secondary' | 'guardrail';
  aggregation: 'sum' | 'average' | 'count' | 'conversion_rate';
  successCriteria?: {
    direction: 'increase' | 'decrease';
    threshold: number; // Percentage change required
    confidenceLevel: number; // Statistical confidence (e.g., 0.95)
  };
}

export interface TestConfiguration {
  minimumSampleSize: number;
  minimumDuration: number; // Days
  maximumDuration: number; // Days
  statisticalMethod: 'frequentist' | 'bayesian';
  multipleTestingCorrection: boolean;
  segmentation?: {
    enabled: boolean;
    dimensions: string[];
  };
  earlyStoppingRules?: {
    enabled: boolean;
    checkInterval: number; // Hours
    futilityBoundary: number;
    efficacyBoundary: number;
  };
}

export interface TestResults {
  winner?: string; // Variant ID
  confidence: number;
  pValue?: number;
  effectSize: number;
  variantResults: Map<string, VariantResult>;
  segments?: Map<string, SegmentResult>;
  recommendation: string;
}

export interface VariantResult {
  variantId: string;
  sampleSize: number;
  metrics: Map<string, MetricResult>;
  conversionRate?: number;
  averageValue?: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface MetricResult {
  value: number;
  standardError: number;
  zscore?: number;
  pValue?: number;
  improvement?: number; // Percentage vs control
  significant: boolean;
}

export interface SegmentResult {
  segmentName: string;
  segmentCriteria: Record<string, any>;
  winner?: string;
  variantResults: Map<string, VariantResult>;
}

export class ABTestingFramework extends EventEmitter {
  private logger: Logger;
  private db: Pool;
  private redis: Redis;
  private activeTests: Map<string, ABTest>;
  private testScheduler?: NodeJS.Timer;

  constructor(logger: Logger, db: Pool, redis: Redis) {
    super();
    this.logger = logger;
    this.db = db;
    this.redis = redis;
    this.activeTests = new Map();

    this.loadActiveTests();
  }

  /**
   * Load active tests from database
   */
  private async loadActiveTests(): Promise<void> {
    try {
      const query = `
        SELECT * FROM ab_tests
        WHERE status IN ('running', 'paused')
      `;

      const result = await this.db.query(query);

      for (const row of result.rows) {
        const test = await this.hydrateTest(row);
        this.activeTests.set(test.testId, test);
      }

      this.logger.info(`Loaded ${this.activeTests.size} active A/B tests`);
    } catch (error) {
      this.logger.error('Failed to load active tests', error);
    }
  }

  /**
   * Create a new A/B test
   */
  public async createTest(testConfig: Partial<ABTest>): Promise<ABTest> {
    try {
      const testId = this.generateTestId();

      const test: ABTest = {
        testId,
        name: testConfig.name!,
        description: testConfig.description!,
        type: testConfig.type!,
        status: 'draft',
        startDate: testConfig.startDate || new Date(),
        endDate: testConfig.endDate,
        variants: testConfig.variants || [],
        metrics: testConfig.metrics || [],
        configuration: testConfig.configuration || this.getDefaultConfiguration(),
        createdBy: testConfig.createdBy!,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate test configuration
      this.validateTest(test);

      // Store in database
      await this.persistTest(test);

      this.logger.info(`Created A/B test: ${testId}`);
      this.emit('test:created', test);

      return test;
    } catch (error) {
      this.logger.error('Failed to create A/B test', error);
      throw error;
    }
  }

  /**
   * Start an A/B test
   */
  public async startTest(testId: string): Promise<void> {
    try {
      const test = await this.getTest(testId);

      if (test.status !== 'draft' && test.status !== 'paused') {
        throw new Error(`Test ${testId} cannot be started from status ${test.status}`);
      }

      // Validate minimum requirements
      await this.validateTestRequirements(test);

      // Update status
      test.status = 'running';
      test.startDate = new Date();
      await this.updateTest(test);

      // Add to active tests
      this.activeTests.set(testId, test);

      // Initialize tracking
      await this.initializeTestTracking(test);

      this.logger.info(`Started A/B test: ${testId}`);
      this.emit('test:started', test);
    } catch (error) {
      this.logger.error(`Failed to start test ${testId}`, error);
      throw error;
    }
  }

  /**
   * Stop an A/B test
   */
  public async stopTest(testId: string, reason?: string): Promise<TestResults> {
    try {
      const test = this.activeTests.get(testId);

      if (!test || test.status !== 'running') {
        throw new Error(`Test ${testId} is not running`);
      }

      // Calculate final results
      const results = await this.calculateTestResults(test);

      // Update test
      test.status = 'completed';
      test.endDate = new Date();
      test.results = results;
      await this.updateTest(test);

      // Remove from active tests
      this.activeTests.delete(testId);

      this.logger.info(`Stopped A/B test: ${testId}`, { reason, results });
      this.emit('test:stopped', { test, results, reason });

      return results;
    } catch (error) {
      this.logger.error(`Failed to stop test ${testId}`, error);
      throw error;
    }
  }

  /**
   * Pause an A/B test
   */
  public async pauseTest(testId: string): Promise<void> {
    try {
      const test = this.activeTests.get(testId);

      if (!test || test.status !== 'running') {
        throw new Error(`Test ${testId} is not running`);
      }

      test.status = 'paused';
      await this.updateTest(test);

      this.logger.info(`Paused A/B test: ${testId}`);
      this.emit('test:paused', test);
    } catch (error) {
      this.logger.error(`Failed to pause test ${testId}`, error);
      throw error;
    }
  }

  /**
   * Track conversion for a test
   */
  public async trackConversion(
    testId: string,
    variantId: string,
    userId: string,
    value?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const test = this.activeTests.get(testId);

      if (!test || test.status !== 'running') {
        this.logger.debug(`Test ${testId} not active, skipping conversion`);
        return;
      }

      // Check if user is already assigned to a variant
      const assignedVariant = await this.getUserVariant(testId, userId);

      if (assignedVariant && assignedVariant !== variantId) {
        this.logger.warn(`User ${userId} assigned to different variant`);
        return;
      }

      // Record conversion
      await this.recordConversion(testId, variantId, userId, value, metadata);

      // Check for early stopping conditions
      if (test.configuration.earlyStoppingRules?.enabled) {
        await this.checkEarlyStoppingConditions(test);
      }

      this.emit('conversion:tracked', {
        testId,
        variantId,
        userId,
        value,
        metadata
      });
    } catch (error) {
      this.logger.error('Failed to track conversion', error);
    }
  }

  /**
   * Get variant assignment for a user
   */
  public async assignUserToVariant(
    testId: string,
    userId: string,
    context?: Record<string, any>
  ): Promise<string | null> {
    try {
      const test = this.activeTests.get(testId);

      if (!test || test.status !== 'running') {
        return null;
      }

      // Check existing assignment
      let variantId = await this.getUserVariant(testId, userId);

      if (!variantId) {
        // Assign user to variant based on traffic allocation
        variantId = this.selectVariant(test, userId);
        await this.assignVariant(testId, userId, variantId, context);
      }

      return variantId;
    } catch (error) {
      this.logger.error('Failed to assign user to variant', error);
      return null;
    }
  }

  /**
   * Calculate test results
   */
  public async calculateTestResults(test: ABTest): Promise<TestResults> {
    try {
      const variantResults = new Map<string, VariantResult>();
      const controlVariant = test.variants.find(v => v.isControl);

      if (!controlVariant) {
        throw new Error('No control variant found');
      }

      // Fetch data for each variant
      for (const variant of test.variants) {
        const data = await this.fetchVariantData(test.testId, variant.variantId);
        const result = this.calculateVariantMetrics(data, test.metrics);
        variantResults.set(variant.variantId, result);
      }

      // Perform statistical analysis
      const analysis = this.performStatisticalAnalysis(
        variantResults,
        controlVariant.variantId,
        test.configuration
      );

      // Calculate segments if enabled
      let segments;
      if (test.configuration.segmentation?.enabled) {
        segments = await this.calculateSegmentResults(
          test,
          variantResults
        );
      }

      return {
        winner: analysis.winner,
        confidence: analysis.confidence,
        pValue: analysis.pValue,
        effectSize: analysis.effectSize,
        variantResults,
        segments,
        recommendation: this.generateRecommendation(analysis, test)
      };
    } catch (error) {
      this.logger.error('Failed to calculate test results', error);
      throw error;
    }
  }

  /**
   * Perform statistical analysis
   */
  private performStatisticalAnalysis(
    variantResults: Map<string, VariantResult>,
    controlId: string,
    config: TestConfiguration
  ): unknown {
    const control = variantResults.get(controlId)!;
    let winner: string | undefined;
    let maxImprovement = 0;
    let confidence = 0;
    let overallPValue = 1;

    for (const [variantId, variant] of variantResults) {
      if (variantId === controlId) continue;

      // Calculate statistical significance
      const comparison = this.compareVariants(control, variant, config);

      if (comparison.significant && comparison.improvement > maxImprovement) {
        winner = variantId;
        maxImprovement = comparison.improvement;
        confidence = comparison.confidence;
        overallPValue = comparison.pValue;
      }
    }

    // Apply multiple testing correction if enabled
    if (config.multipleTestingCorrection && variantResults.size > 2) {
      overallPValue = this.bonferroniCorrection(
        overallPValue,
        variantResults.size - 1
      );
    }

    return {
      winner,
      confidence,
      pValue: overallPValue,
      effectSize: this.calculateEffectSize(control, variantResults.get(winner!) || control)
    };
  }

  /**
   * Compare two variants
   */
  private compareVariants(
    control: VariantResult,
    treatment: VariantResult,
    config: TestConfiguration
  ): unknown {
    if (config.statisticalMethod === 'bayesian') {
      return this.bayesianComparison(control, treatment, config);
    } else {
      return this.frequentistComparison(control, treatment, config);
    }
  }

  /**
   * Frequentist statistical comparison
   */
  private frequentistComparison(
    control: VariantResult,
    treatment: VariantResult,
    config: TestConfiguration
  ): unknown {
    // Use appropriate test based on metric type
    const controlRate = control.conversionRate || 0;
    const treatmentRate = treatment.conversionRate || 0;
    const controlN = control.sampleSize;
    const treatmentN = treatment.sampleSize;

    // Z-test for proportions
    const pooledRate = (controlRate * controlN + treatmentRate * treatmentN) /
                      (controlN + treatmentN);
    const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1/controlN + 1/treatmentN));
    const z = (treatmentRate - controlRate) / se;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

    const improvement = ((treatmentRate - controlRate) / controlRate) * 100;
    const significant = pValue < (1 - (config.successCriteria?.confidenceLevel || 0.95));

    return {
      improvement,
      pValue,
      zScore: z,
      significant,
      confidence: 1 - pValue
    };
  }

  /**
   * Bayesian statistical comparison
   */
  private bayesianComparison(
    control: VariantResult,
    treatment: VariantResult,
    config: TestConfiguration
  ): unknown {
    // Use Beta distribution for conversion rates
    const controlAlpha = (control.conversionRate || 0) * control.sampleSize + 1;
    const controlBeta = (1 - (control.conversionRate || 0)) * control.sampleSize + 1;

    const treatmentAlpha = (treatment.conversionRate || 0) * treatment.sampleSize + 1;
    const treatmentBeta = (1 - (treatment.conversionRate || 0)) * treatment.sampleSize + 1;

    // Monte Carlo simulation for probability of improvement
    const simulations = 10000;
    let wins = 0;

    for (let i = 0; i < simulations; i++) {
      const controlSample = this.betaRandom(controlAlpha, controlBeta);
      const treatmentSample = this.betaRandom(treatmentAlpha, treatmentBeta);
      if (treatmentSample > controlSample) wins++;
    }

    const probabilityOfImprovement = wins / simulations;
    const improvement = ((treatment.conversionRate || 0) - (control.conversionRate || 0)) /
                       (control.conversionRate || 1) * 100;

    return {
      improvement,
      probabilityOfImprovement,
      significant: probabilityOfImprovement > (config.successCriteria?.confidenceLevel || 0.95),
      confidence: probabilityOfImprovement
    };
  }

  /**
   * Calculate effect size (Cohen's d)
   */
  private calculateEffectSize(control: VariantResult, treatment: VariantResult): number {
    const controlMean = control.averageValue || control.conversionRate || 0;
    const treatmentMean = treatment.averageValue || treatment.conversionRate || 0;

    // Pooled standard deviation
    const controlVar = this.calculateVariance(control);
    const treatmentVar = this.calculateVariance(treatment);
    const pooledSD = Math.sqrt(
      ((control.sampleSize - 1) * controlVar + (treatment.sampleSize - 1) * treatmentVar) /
      (control.sampleSize + treatment.sampleSize - 2)
    );

    return (treatmentMean - controlMean) / pooledSD;
  }

  /**
   * Check early stopping conditions
   */
  private async checkEarlyStoppingConditions(test: ABTest): Promise<void> {
    if (!test.configuration.earlyStoppingRules?.enabled) return;

    const results = await this.calculateTestResults(test);

    // Check futility boundary (stop if unlikely to find effect)
    if (results.confidence < test.configuration.earlyStoppingRules.futilityBoundary) {
      await this.stopTest(test.testId, 'Futility boundary reached');
      return;
    }

    // Check efficacy boundary (stop if clear winner)
    if (results.confidence > test.configuration.earlyStoppingRules.efficacyBoundary) {
      await this.stopTest(test.testId, 'Efficacy boundary reached');
      return;
    }

    // Check minimum duration
    const duration = (Date.now() - test.startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (duration >= test.configuration.maximumDuration) {
      await this.stopTest(test.testId, 'Maximum duration reached');
    }
  }

  /**
   * Helper methods
   */

  private generateTestId(): string {
    return `test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  private getDefaultConfiguration(): TestConfiguration {
    return {
      minimumSampleSize: 1000,
      minimumDuration: 7,
      maximumDuration: 30,
      statisticalMethod: 'frequentist',
      multipleTestingCorrection: true,
      segmentation: {
        enabled: false,
        dimensions: []
      },
      earlyStoppingRules: {
        enabled: true,
        checkInterval: 24,
        futilityBoundary: 0.1,
        efficacyBoundary: 0.99
      }
    };
  }

  private validateTest(test: ABTest): void {
    // Validate variants
    if (test.variants.length < 2) {
      throw new Error('Test must have at least 2 variants');
    }

    const hasControl = test.variants.some(v => v.isControl);
    if (!hasControl) {
      throw new Error('Test must have exactly one control variant');
    }

    // Validate traffic allocation
    const totalAllocation = test.variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Traffic allocation must sum to 100%');
    }

    // Validate metrics
    if (test.metrics.length === 0) {
      throw new Error('Test must have at least one metric');
    }

    const primaryMetrics = test.metrics.filter(m => m.type === 'primary');
    if (primaryMetrics.length !== 1) {
      throw new Error('Test must have exactly one primary metric');
    }
  }

  private async validateTestRequirements(test: ABTest): Promise<void> {
    // Check for sufficient traffic
    const estimatedTraffic = await this.estimateTraffic(test);
    const requiredSampleSize = test.configuration.minimumSampleSize * test.variants.length;

    if (estimatedTraffic < requiredSampleSize) {
      throw new Error(
        `Insufficient traffic. Need ${requiredSampleSize}, estimated ${estimatedTraffic}`
      );
    }
  }

  private async estimateTraffic(test: ABTest): Promise<number> {
    // Estimate based on historical data
    const query = `
      SELECT AVG(daily_traffic) as avg_traffic
      FROM traffic_stats
      WHERE type = $1
        AND date >= CURRENT_DATE - INTERVAL '30 days'
    `;

    const result = await this.db.query(query, [test.type]);
    return result.rows[0]?.avg_traffic || 0;
  }

  private selectVariant(test: ABTest, userId: string): string {
    // Deterministic assignment based on user ID
    const hash = crypto.createHash('md5')
      .update(`${test.testId}:${userId}`)
      .digest('hex');
    const bucket = parseInt(hash.substring(0, 8), 16) % 100;

    let cumulative = 0;
    for (const variant of test.variants) {
      cumulative += variant.trafficAllocation;
      if (bucket < cumulative) {
        return variant.variantId;
      }
    }

    return test.variants[test.variants.length - 1].variantId;
  }

  private async getUserVariant(testId: string, userId: string): Promise<string | null> {
    const key = `abtest:${testId}:user:${userId}`;
    return await this.redis.get(key);
  }

  private async assignVariant(
    testId: string,
    userId: string,
    variantId: string,
    context?: Record<string, any>
  ): Promise<void> {
    // Store in Redis with TTL
    const key = `abtest:${testId}:user:${userId}`;
    await this.redis.setex(key, 86400 * 30, variantId); // 30 days TTL

    // Record assignment in database
    await this.db.query(`
      INSERT INTO ab_test_assignments
      (test_id, user_id, variant_id, assigned_at, context)
      VALUES ($1, $2, $3, NOW(), $4)
    `, [testId, userId, variantId, JSON.stringify(context)]);
  }

  private async recordConversion(
    testId: string,
    variantId: string,
    userId: string,
    value?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.db.query(`
      INSERT INTO ab_test_conversions
      (test_id, variant_id, user_id, value, metadata, converted_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [testId, variantId, userId, value, JSON.stringify(metadata)]);

    // Update cache
    const key = `abtest:${testId}:variant:${variantId}:conversions`;
    await this.redis.incr(key);
  }

  private async fetchVariantData(testId: string, variantId: string): Promise<unknown> {
    const query = `
      SELECT
        COUNT(DISTINCT a.user_id) as sample_size,
        COUNT(DISTINCT c.user_id) as conversions,
        AVG(c.value) as avg_value,
        STDDEV(c.value) as std_value
      FROM ab_test_assignments a
      LEFT JOIN ab_test_conversions c
        ON a.test_id = c.test_id
        AND a.user_id = c.user_id
        AND a.variant_id = c.variant_id
      WHERE a.test_id = $1 AND a.variant_id = $2
    `;

    const result = await this.db.query(query, [testId, variantId]);
    return result.rows[0];
  }

  private calculateVariantMetrics(data: unknown, metrics: TestMetric[]): VariantResult {
    const conversionRate = data.conversions / data.sample_size;
    const se = Math.sqrt(conversionRate * (1 - conversionRate) / data.sample_size);

    return {
      variantId: data.variant_id,
      sampleSize: data.sample_size,
      metrics: new Map(),
      conversionRate,
      averageValue: data.avg_value,
      confidenceInterval: {
        lower: conversionRate - 1.96 * se,
        upper: conversionRate + 1.96 * se
      }
    };
  }

  private async calculateSegmentResults(
    test: ABTest,
    overallResults: Map<string, VariantResult>
  ): Promise<Map<string, SegmentResult>> {
    const segments = new Map<string, SegmentResult>();

    if (!test.configuration.segmentation?.dimensions) {
      return segments;
    }

    for (const dimension of test.configuration.segmentation.dimensions) {
      const segmentData = await this.fetchSegmentData(test.testId, dimension);

      for (const [segmentValue, data] of segmentData) {
        const variantResults = new Map<string, VariantResult>();

        for (const variant of test.variants) {
          const result = this.calculateVariantMetrics(
            data[variant.variantId],
            test.metrics
          );
          variantResults.set(variant.variantId, result);
        }

        segments.set(`${dimension}:${segmentValue}`, {
          segmentName: `${dimension}:${segmentValue}`,
          segmentCriteria: { [dimension]: segmentValue },
          variantResults
        });
      }
    }

    return segments;
  }

  private async fetchSegmentData(testId: string, dimension: string): Promise<Map<string, any>> {
    // Fetch segmented data from database
    const query = `
      SELECT
        a.variant_id,
        a.context->>'${dimension}' as segment_value,
        COUNT(DISTINCT a.user_id) as sample_size,
        COUNT(DISTINCT c.user_id) as conversions,
        AVG(c.value) as avg_value
      FROM ab_test_assignments a
      LEFT JOIN ab_test_conversions c
        ON a.test_id = c.test_id
        AND a.user_id = c.user_id
        AND a.variant_id = c.variant_id
      WHERE a.test_id = $1
      GROUP BY a.variant_id, segment_value
    `;

    const result = await this.db.query(query, [testId]);
    const segmentMap = new Map<string, any>();

    for (const row of result.rows) {
      if (!segmentMap.has(row.segment_value)) {
        segmentMap.set(row.segment_value, {});
      }
      segmentMap.get(row.segment_value)[row.variant_id] = row;
    }

    return segmentMap;
  }

  private generateRecommendation(analysis: unknown, test: ABTest): string {
    if (!analysis.winner) {
      return 'No significant difference found between variants. Consider running the test longer or increasing sample size.';
    }

    const winner = test.variants.find(v => v.variantId === analysis.winner);
    const improvement = Math.round(analysis.effectSize * 100);

    return `Variant "${winner?.name}" is the winner with ${analysis.confidence * 100}% confidence. ` +
           `Expected improvement: ${improvement}%. ` +
           `Recommend implementing this variant for all users.`;
  }

  // Statistical helper functions
  private normalCDF(z: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    return 0.5 * (1.0 + sign * y);
  }

  private betaRandom(alpha: number, beta: number): number {
    // Generate random sample from Beta distribution
    const gammaAlpha = this.gammaRandom(alpha, 1);
    const gammaBeta = this.gammaRandom(beta, 1);
    return gammaAlpha / (gammaAlpha + gammaBeta);
  }

  private gammaRandom(shape: number, scale: number): number {
    // Marsaglia and Tsang method
    if (shape < 1) {
      return this.gammaRandom(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1/3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x, v;
      do {
        x = this.normalRandom();
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = Math.random();

      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v * scale;
      }

      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  private normalRandom(): number {
    // Box-Muller transform
    const u = 1 - Math.random();
    const v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  private bonferroniCorrection(pValue: number, numComparisons: number): number {
    return Math.min(pValue * numComparisons, 1);
  }

  private calculateVariance(result: VariantResult): number {
    const mean = result.averageValue || result.conversionRate || 0;
    // For binomial proportion
    if (result.conversionRate !== undefined) {
      return result.conversionRate * (1 - result.conversionRate);
    }
    // For continuous variable (would need actual data points for accurate variance)
    return mean * 0.5; // Simplified assumption
  }

  // Database operations
  private async hydrateTest(row: unknown): Promise<ABTest> {
    return {
      testId: row.test_id,
      name: row.name,
      description: row.description,
      type: row.type,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      variants: JSON.parse(row.variants),
      metrics: JSON.parse(row.metrics),
      configuration: JSON.parse(row.configuration),
      results: row.results ? JSON.parse(row.results) : undefined,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private async persistTest(test: ABTest): Promise<void> {
    await this.db.query(`
      INSERT INTO ab_tests (
        test_id, name, description, type, status,
        start_date, end_date, variants, metrics,
        configuration, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      test.testId,
      test.name,
      test.description,
      test.type,
      test.status,
      test.startDate,
      test.endDate,
      JSON.stringify(test.variants),
      JSON.stringify(test.metrics),
      JSON.stringify(test.configuration),
      test.createdBy,
      test.createdAt,
      test.updatedAt
    ]);
  }

  private async updateTest(test: ABTest): Promise<void> {
    test.updatedAt = new Date();

    await this.db.query(`
      UPDATE ab_tests SET
        status = $2,
        start_date = $3,
        end_date = $4,
        variants = $5,
        results = $6,
        updated_at = $7
      WHERE test_id = $1
    `, [
      test.testId,
      test.status,
      test.startDate,
      test.endDate,
      JSON.stringify(test.variants),
      test.results ? JSON.stringify(test.results) : null,
      test.updatedAt
    ]);
  }

  private async initializeTestTracking(test: ABTest): Promise<void> {
    // Set up Redis keys for real-time tracking
    for (const variant of test.variants) {
      const keys = [
        `abtest:${test.testId}:variant:${variant.variantId}:views`,
        `abtest:${test.testId}:variant:${variant.variantId}:conversions`
      ];

      for (const key of keys) {
        await this.redis.set(key, 0);
      }
    }
  }

  private async getTest(testId: string): Promise<ABTest> {
    const result = await this.db.query(
      'SELECT * FROM ab_tests WHERE test_id = $1',
      [testId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Test ${testId} not found`);
    }

    return this.hydrateTest(result.rows[0]);
  }

  /**
   * Start scheduler for periodic tasks
   */
  public startScheduler(): void {
    this.testScheduler = setInterval(async () => {
      for (const test of this.activeTests.values()) {
        if (test.configuration.earlyStoppingRules?.enabled) {
          await this.checkEarlyStoppingConditions(test);
        }

        // Check maximum duration
        const duration = (Date.now() - test.startDate.getTime()) / (1000 * 60 * 60 * 24);
        if (duration >= test.configuration.maximumDuration) {
          await this.stopTest(test.testId, 'Maximum duration reached');
        }
      }
    }, 3600000); // Check every hour
  }

  /**
   * Stop scheduler
   */
  public stopScheduler(): void {
    if (this.testScheduler) {
      clearInterval(this.testScheduler);
      this.testScheduler = undefined;
    }
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    this.stopScheduler();
    this.activeTests.clear();
    this.removeAllListeners();
    this.logger.info('A/B testing framework cleaned up');
  }
}