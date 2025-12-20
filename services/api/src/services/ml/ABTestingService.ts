/**
 * A/B Testing Service
 * Experiment management for ML model variants
 * Provides traffic splitting, metrics collection, and statistical analysis
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

// ==================== Type Definitions ====================

export interface ExperimentConfig {
  name: string;
  description: string;
  hypothesis: string;
  owner: string;
  modelId?: string;
  variants: VariantConfig[];
  targetMetrics: MetricConfig[];
  guardrailMetrics?: MetricConfig[];
  trafficAllocation: number;
  targetSampleSize?: number;
  minimumDetectableEffect?: number;
  confidenceLevel?: number;
  maxDuration?: number;
  tags?: string[];
}

export interface VariantConfig {
  name: string;
  description: string;
  trafficWeight: number;
  modelVersionId?: string;
  config?: Record<string, unknown>;
  isControl?: boolean;
}

export interface MetricConfig {
  name: string;
  type: MetricType;
  aggregation: AggregationType;
  minValue?: number;
  maxValue?: number;
  higherIsBetter: boolean;
}

export type MetricType = 'count' | 'sum' | 'average' | 'ratio' | 'percentile' | 'conversion';
export type AggregationType = 'sum' | 'mean' | 'median' | 'p95' | 'p99';

export interface Experiment {
  id: string;
  config: ExperimentConfig;
  status: ExperimentStatus;
  startDate?: Date;
  endDate?: Date;
  actualEndDate?: Date;
  winnerVariant?: string;
  conclusion?: string;
  createdAt: Date;
  updatedAt: Date;
  assignments: Map<string, string>;
  metrics: Map<string, VariantMetrics>;
}

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';

export interface VariantMetrics {
  variantName: string;
  sampleSize: number;
  conversions: number;
  metrics: Record<string, MetricData>;
}

export interface MetricData {
  sum: number;
  count: number;
  mean: number;
  variance: number;
  min: number;
  max: number;
  values: number[];
}

export interface Variant {
  name: string;
  weight: number;
}

export interface ExperimentResults {
  experimentId: string;
  experimentName: string;
  status: ExperimentStatus;
  duration: { days: number; hours: number };
  variants: VariantResult[];
  winner?: WinnerInfo;
  recommendations: string[];
  nextSteps: string[];
}

export interface VariantResult {
  name: string;
  isControl: boolean;
  sampleSize: number;
  metrics: Record<string, {
    value: number;
    improvement?: number;
    significant?: boolean;
    pValue?: number;
    confidenceInterval?: { lower: number; upper: number };
  }>;
}

export interface WinnerInfo {
  variant: string;
  confidence: number;
  improvement: number;
  metric: string;
}

export interface StatisticalSignificance {
  experimentId: string;
  metric: string;
  controlVariant: string;
  treatmentVariant: string;
  controlMean: number;
  treatmentMean: number;
  difference: number;
  percentChange: number;
  pValue: number;
  zScore: number;
  significant: boolean;
  confidenceInterval: { lower: number; upper: number };
  requiredSampleSize: number;
  currentPower: number;
}

export interface PowerAnalysis {
  minimumSampleSize: number;
  expectedDuration: number;
  currentPower: number;
  recommendedDuration?: number;
}

// ==================== A/B Testing Service ====================

export class ABTestingService extends EventEmitter {
  private experiments: Map<string, Experiment> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map();

  private readonly defaultConfidence = 0.95;
  private readonly defaultMinSampleSize = 100;

  constructor() {
    super();
  }

  // ==================== Experiment Management ====================

  /**
   * Create a new experiment
   */
  public createExperiment(config: ExperimentConfig): Experiment {
    this.validateExperimentConfig(config);

    const id = this.generateExperimentId();

    // Ensure weights sum to 100
    const totalWeight = config.variants.reduce((sum, v) => sum + v.trafficWeight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`Variant weights must sum to 100, got ${totalWeight}`);
    }

    // Ensure at least one control
    if (!config.variants.some((v) => v.isControl)) {
      config.variants[0].isControl = true;
    }

    const experiment: Experiment = {
      id,
      config,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      assignments: new Map(),
      metrics: new Map(),
    };

    // Initialize metrics for each variant
    for (const variant of config.variants) {
      experiment.metrics.set(variant.name, {
        variantName: variant.name,
        sampleSize: 0,
        conversions: 0,
        metrics: {},
      });
    }

    this.experiments.set(id, experiment);
    this.emit('experiment:created', { experimentId: id, name: config.name });
    logger.info(`Created experiment: ${config.name} (${id})`);

    return experiment;
  }

  /**
   * Start an experiment
   */
  public startExperiment(experimentId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== 'draft' && experiment.status !== 'paused') {
      throw new Error(`Cannot start experiment in ${experiment.status} status`);
    }

    experiment.status = 'running';
    experiment.startDate = experiment.startDate || new Date();
    experiment.updatedAt = new Date();

    if (experiment.config.maxDuration) {
      experiment.endDate = new Date(
        experiment.startDate.getTime() + experiment.config.maxDuration * 24 * 60 * 60 * 1000
      );
    }

    this.emit('experiment:started', { experimentId });
    logger.info(`Started experiment: ${experiment.config.name}`);
  }

  /**
   * Pause an experiment
   */
  public pauseExperiment(experimentId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== 'running') {
      throw new Error(`Cannot pause experiment in ${experiment.status} status`);
    }

    experiment.status = 'paused';
    experiment.updatedAt = new Date();

    this.emit('experiment:paused', { experimentId });
    logger.info(`Paused experiment: ${experiment.config.name}`);
  }

  /**
   * Cancel an experiment
   */
  public cancelExperiment(experimentId: string, reason: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    experiment.status = 'cancelled';
    experiment.conclusion = `Cancelled: ${reason}`;
    experiment.actualEndDate = new Date();
    experiment.updatedAt = new Date();

    this.emit('experiment:cancelled', { experimentId, reason });
    logger.info(`Cancelled experiment: ${experiment.config.name}`);
  }

  /**
   * Complete an experiment
   */
  public completeExperiment(experimentId: string, winnerVariant?: string, conclusion?: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    experiment.status = 'completed';
    experiment.winnerVariant = winnerVariant;
    experiment.conclusion = conclusion || 'Experiment completed';
    experiment.actualEndDate = new Date();
    experiment.updatedAt = new Date();

    this.emit('experiment:completed', { experimentId, winnerVariant });
    logger.info(`Completed experiment: ${experiment.config.name}, winner: ${winnerVariant || 'none'}`);
  }

  /**
   * Get experiment by ID
   */
  public getExperiment(experimentId: string): Experiment | null {
    return this.experiments.get(experimentId) || null;
  }

  /**
   * List all experiments
   */
  public listExperiments(options?: {
    status?: ExperimentStatus;
    modelId?: string;
    owner?: string;
  }): Experiment[] {
    let experiments = Array.from(this.experiments.values());

    if (options?.status) {
      experiments = experiments.filter((e) => e.status === options.status);
    }

    if (options?.modelId) {
      experiments = experiments.filter((e) => e.config.modelId === options.modelId);
    }

    if (options?.owner) {
      experiments = experiments.filter((e) => e.config.owner === options.owner);
    }

    return experiments;
  }

  // ==================== Traffic Assignment ====================

  /**
   * Assign a user to a variant
   */
  public assignVariant(userId: string, experimentId: string): Variant {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== 'running') {
      throw new Error(`Experiment ${experimentId} is not running`);
    }

    // Check for existing assignment
    const existingAssignment = experiment.assignments.get(userId);
    if (existingAssignment) {
      const variant = experiment.config.variants.find((v) => v.name === existingAssignment);
      return { name: existingAssignment, weight: variant?.trafficWeight || 0 };
    }

    // Check if user should be in experiment (based on traffic allocation)
    if (!this.shouldIncludeUser(userId, experiment.config.trafficAllocation)) {
      // Return control variant for excluded users
      const control = experiment.config.variants.find((v) => v.isControl) || experiment.config.variants[0];
      return { name: control.name, weight: control.trafficWeight };
    }

    // Assign variant based on weights
    const variant = this.selectVariant(userId, experiment.config.variants);
    experiment.assignments.set(userId, variant.name);

    // Update sample size
    const variantMetrics = experiment.metrics.get(variant.name);
    if (variantMetrics) {
      variantMetrics.sampleSize++;
    }

    // Store in user assignments for quick lookup
    let userExperiments = this.userAssignments.get(userId);
    if (!userExperiments) {
      userExperiments = new Map();
      this.userAssignments.set(userId, userExperiments);
    }
    userExperiments.set(experimentId, variant.name);

    this.emit('variant:assigned', { userId, experimentId, variant: variant.name });

    return variant;
  }

  /**
   * Get user's variant for an experiment
   */
  public getUserVariant(userId: string, experimentId: string): string | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    return experiment.assignments.get(userId) || null;
  }

  /**
   * Get all experiment assignments for a user
   */
  public getUserAssignments(userId: string): Map<string, string> {
    return this.userAssignments.get(userId) || new Map();
  }

  /**
   * Determine if user should be included in experiment
   */
  private shouldIncludeUser(userId: string, trafficAllocation: number): boolean {
    const hash = this.hashUserId(userId);
    return (hash % 100) < trafficAllocation;
  }

  /**
   * Select variant based on weights
   */
  private selectVariant(userId: string, variants: VariantConfig[]): Variant {
    const hash = this.hashUserId(userId + '_variant');
    const roll = hash % 100;

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.trafficWeight;
      if (roll < cumulative) {
        return { name: variant.name, weight: variant.trafficWeight };
      }
    }

    // Fallback to last variant
    const last = variants[variants.length - 1];
    return { name: last.name, weight: last.trafficWeight };
  }

  /**
   * Hash user ID to number
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // ==================== Metrics Collection ====================

  /**
   * Record a conversion event
   */
  public recordConversion(
    userId: string,
    experimentId: string,
    metricName: string,
    value: number = 1
  ): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') return;

    const variant = experiment.assignments.get(userId);
    if (!variant) return;

    const variantMetrics = experiment.metrics.get(variant);
    if (!variantMetrics) return;

    // Initialize metric if needed
    if (!variantMetrics.metrics[metricName]) {
      variantMetrics.metrics[metricName] = {
        sum: 0,
        count: 0,
        mean: 0,
        variance: 0,
        min: Infinity,
        max: -Infinity,
        values: [],
      };
    }

    const metric = variantMetrics.metrics[metricName];
    metric.values.push(value);
    metric.sum += value;
    metric.count++;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);

    // Update running mean and variance (Welford's algorithm)
    const oldMean = metric.mean;
    metric.mean = metric.sum / metric.count;
    metric.variance = metric.variance + (value - oldMean) * (value - metric.mean);

    // Update conversions if this is a conversion metric
    const metricConfig = experiment.config.targetMetrics.find((m) => m.name === metricName);
    if (metricConfig?.type === 'conversion' && value > 0) {
      variantMetrics.conversions++;
    }

    this.emit('metric:recorded', { userId, experimentId, metricName, value, variant });
  }

  /**
   * Record multiple metrics at once
   */
  public recordMetrics(
    userId: string,
    experimentId: string,
    metrics: Record<string, number>
  ): void {
    for (const [metricName, value] of Object.entries(metrics)) {
      this.recordConversion(userId, experimentId, metricName, value);
    }
  }

  // ==================== Statistical Analysis ====================

  /**
   * Analyze experiment results
   */
  public analyzeResults(experimentId: string): ExperimentResults {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const controlVariant = experiment.config.variants.find((v) => v.isControl);
    if (!controlVariant) {
      throw new Error('No control variant defined');
    }

    const duration = this.calculateDuration(experiment);
    const variantResults: VariantResult[] = [];
    let potentialWinner: WinnerInfo | undefined;

    for (const variant of experiment.config.variants) {
      const variantMetrics = experiment.metrics.get(variant.name);
      if (!variantMetrics) continue;

      const metricsResult: VariantResult['metrics'] = {};

      for (const metricConfig of experiment.config.targetMetrics) {
        const metricData = variantMetrics.metrics[metricConfig.name];
        if (!metricData) {
          metricsResult[metricConfig.name] = { value: 0 };
          continue;
        }

        const value = metricConfig.type === 'conversion'
          ? variantMetrics.sampleSize > 0
            ? variantMetrics.conversions / variantMetrics.sampleSize
            : 0
          : metricData.mean;

        const result: VariantResult['metrics'][string] = { value };

        // Calculate improvement vs control
        if (!variant.isControl) {
          const controlMetrics = experiment.metrics.get(controlVariant.name);
          const controlData = controlMetrics?.metrics[metricConfig.name];
          if (controlData && controlData.count > 0) {
            const controlValue = metricConfig.type === 'conversion'
              ? controlMetrics!.sampleSize > 0
                ? controlMetrics!.conversions / controlMetrics!.sampleSize
                : 0
              : controlData.mean;

            if (controlValue !== 0) {
              result.improvement = ((value - controlValue) / controlValue) * 100;
            }

            // Calculate significance
            const significance = this.calculateSignificance(
              experimentId,
              metricConfig.name,
              controlVariant.name,
              variant.name
            );

            result.significant = significance.significant;
            result.pValue = significance.pValue;
            result.confidenceInterval = significance.confidenceInterval;

            // Check for winner
            if (
              significance.significant &&
              ((metricConfig.higherIsBetter && result.improvement! > 0) ||
                (!metricConfig.higherIsBetter && result.improvement! < 0))
            ) {
              if (
                !potentialWinner ||
                Math.abs(result.improvement!) > Math.abs(potentialWinner.improvement)
              ) {
                potentialWinner = {
                  variant: variant.name,
                  confidence: 1 - significance.pValue,
                  improvement: result.improvement!,
                  metric: metricConfig.name,
                };
              }
            }
          }
        }

        metricsResult[metricConfig.name] = result;
      }

      variantResults.push({
        name: variant.name,
        isControl: variant.isControl || false,
        sampleSize: variantMetrics.sampleSize,
        metrics: metricsResult,
      });
    }

    const recommendations = this.generateRecommendations(experiment, variantResults, potentialWinner);
    const nextSteps = this.generateNextSteps(experiment, potentialWinner);

    return {
      experimentId,
      experimentName: experiment.config.name,
      status: experiment.status,
      duration,
      variants: variantResults,
      winner: potentialWinner,
      recommendations,
      nextSteps,
    };
  }

  /**
   * Calculate statistical significance between two variants
   */
  public calculateSignificance(
    experimentId: string,
    metricName: string,
    controlVariant: string,
    treatmentVariant: string
  ): StatisticalSignificance {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const controlMetrics = experiment.metrics.get(controlVariant);
    const treatmentMetrics = experiment.metrics.get(treatmentVariant);

    if (!controlMetrics || !treatmentMetrics) {
      throw new Error('Variant metrics not found');
    }

    const controlData = controlMetrics.metrics[metricName];
    const treatmentData = treatmentMetrics.metrics[metricName];

    // Default result for insufficient data
    const defaultResult: StatisticalSignificance = {
      experimentId,
      metric: metricName,
      controlVariant,
      treatmentVariant,
      controlMean: 0,
      treatmentMean: 0,
      difference: 0,
      percentChange: 0,
      pValue: 1,
      zScore: 0,
      significant: false,
      confidenceInterval: { lower: 0, upper: 0 },
      requiredSampleSize: this.defaultMinSampleSize,
      currentPower: 0,
    };

    if (!controlData || !treatmentData || controlData.count < 2 || treatmentData.count < 2) {
      return defaultResult;
    }

    const controlMean = controlData.mean;
    const treatmentMean = treatmentData.mean;
    const controlStd = Math.sqrt(controlData.variance / (controlData.count - 1));
    const treatmentStd = Math.sqrt(treatmentData.variance / (treatmentData.count - 1));

    // Welch's t-test
    const difference = treatmentMean - controlMean;
    const pooledVariance =
      (controlStd * controlStd) / controlData.count +
      (treatmentStd * treatmentStd) / treatmentData.count;
    const standardError = Math.sqrt(pooledVariance);

    const zScore = standardError > 0 ? difference / standardError : 0;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    const confidenceLevel = experiment.config.confidenceLevel || this.defaultConfidence;
    const zCritical = this.inverseNormalCDF(1 - (1 - confidenceLevel) / 2);
    const marginOfError = zCritical * standardError;

    const significant = pValue < (1 - confidenceLevel);
    const percentChange = controlMean !== 0 ? (difference / controlMean) * 100 : 0;

    // Power calculation
    const mde = experiment.config.minimumDetectableEffect || 0.05;
    const requiredSampleSize = this.calculateRequiredSampleSize(
      controlMean,
      controlStd,
      mde,
      confidenceLevel
    );

    const currentPower = this.calculatePower(
      controlData.count,
      treatmentData.count,
      difference,
      standardError
    );

    return {
      experimentId,
      metric: metricName,
      controlVariant,
      treatmentVariant,
      controlMean,
      treatmentMean,
      difference,
      percentChange,
      pValue,
      zScore,
      significant,
      confidenceInterval: {
        lower: difference - marginOfError,
        upper: difference + marginOfError,
      },
      requiredSampleSize,
      currentPower,
    };
  }

  /**
   * Perform power analysis
   */
  public powerAnalysis(experimentId: string): PowerAnalysis {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const controlVariant = experiment.config.variants.find((v) => v.isControl);
    if (!controlVariant) {
      throw new Error('No control variant defined');
    }

    const controlMetrics = experiment.metrics.get(controlVariant.name);
    const primaryMetric = experiment.config.targetMetrics[0];

    if (!controlMetrics || !primaryMetric) {
      return {
        minimumSampleSize: this.defaultMinSampleSize,
        expectedDuration: 14,
        currentPower: 0,
      };
    }

    const metricData = controlMetrics.metrics[primaryMetric.name];
    if (!metricData || metricData.count < 2) {
      return {
        minimumSampleSize: this.defaultMinSampleSize,
        expectedDuration: 14,
        currentPower: 0,
      };
    }

    const std = Math.sqrt(metricData.variance / (metricData.count - 1));
    const mde = experiment.config.minimumDetectableEffect || 0.05;
    const confidenceLevel = experiment.config.confidenceLevel || this.defaultConfidence;

    const minimumSampleSize = this.calculateRequiredSampleSize(
      metricData.mean,
      std,
      mde,
      confidenceLevel
    );

    // Estimate duration based on current enrollment rate
    const duration = this.calculateDuration(experiment);
    const daysElapsed = duration.days + duration.hours / 24;
    const currentSampleSize = controlMetrics.sampleSize;
    const enrollmentRate = daysElapsed > 0 ? currentSampleSize / daysElapsed : 10; // Default 10/day

    const expectedDuration = enrollmentRate > 0
      ? Math.ceil((minimumSampleSize * experiment.config.variants.length) / enrollmentRate)
      : 30;

    const currentPower = this.calculatePower(
      controlMetrics.sampleSize,
      controlMetrics.sampleSize,
      metricData.mean * mde,
      std / Math.sqrt(controlMetrics.sampleSize)
    );

    return {
      minimumSampleSize,
      expectedDuration,
      currentPower,
      recommendedDuration: currentPower < 0.8 ? expectedDuration : undefined,
    };
  }

  // ==================== Winner Graduation ====================

  /**
   * Graduate the winning variant to production
   */
  public graduateWinner(experimentId: string, winningVariant: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const variant = experiment.config.variants.find((v) => v.name === winningVariant);
    if (!variant) {
      throw new Error(`Variant ${winningVariant} not found in experiment`);
    }

    // Complete the experiment
    this.completeExperiment(
      experimentId,
      winningVariant,
      `Graduated ${winningVariant} to production`
    );

    this.emit('winner:graduated', {
      experimentId,
      variant: winningVariant,
      modelVersionId: variant.modelVersionId,
    });

    logger.info(`Graduated winner ${winningVariant} from experiment ${experimentId}`);
  }

  // ==================== Helper Methods ====================

  private validateExperimentConfig(config: ExperimentConfig): void {
    if (!config.name || config.name.trim() === '') {
      throw new Error('Experiment name is required');
    }

    if (!config.variants || config.variants.length < 2) {
      throw new Error('At least 2 variants are required');
    }

    if (!config.targetMetrics || config.targetMetrics.length === 0) {
      throw new Error('At least 1 target metric is required');
    }

    if (config.trafficAllocation < 0 || config.trafficAllocation > 100) {
      throw new Error('Traffic allocation must be between 0 and 100');
    }
  }

  private generateExperimentId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private calculateDuration(experiment: Experiment): { days: number; hours: number } {
    const startDate = experiment.startDate || experiment.createdAt;
    const endDate = experiment.actualEndDate || new Date();
    const durationMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    return {
      days: Math.floor(hours / 24),
      hours: hours % 24,
    };
  }

  private normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  private inverseNormalCDF(p: number): number {
    // Approximation using rational function
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p === 0.5) return 0;

    const a = [
      -3.969683028665376e1,
      2.209460984245205e2,
      -2.759285104469687e2,
      1.383577518672690e2,
      -3.066479806614716e1,
      2.506628277459239e0,
    ];

    const b = [
      -5.447609879822406e1,
      1.615858368580409e2,
      -1.556989798598866e2,
      6.680131188771972e1,
      -1.328068155288572e1,
    ];

    const c = [
      -7.784894002430293e-3,
      -3.223964580411365e-1,
      -2.400758277161838,
      -2.549732539343734,
      4.374664141464968,
      2.938163982698783,
    ];

    const d = [
      7.784695709041462e-3,
      3.224671290700398e-1,
      2.445134137142996,
      3.754408661907416,
    ];

    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    let q: number, r: number;

    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (
        (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
      );
    } else if (p <= pHigh) {
      q = p - 0.5;
      r = q * q;
      return (
        ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
      );
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return (
        -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
      );
    }
  }

  private calculateRequiredSampleSize(
    baseline: number,
    std: number,
    mde: number,
    confidenceLevel: number
  ): number {
    const alpha = 1 - confidenceLevel;
    const beta = 0.2; // 80% power
    const zAlpha = this.inverseNormalCDF(1 - alpha / 2);
    const zBeta = this.inverseNormalCDF(1 - beta);

    const effectSize = baseline * mde;
    if (effectSize === 0) return this.defaultMinSampleSize;

    const n = 2 * Math.pow((zAlpha + zBeta) * std / effectSize, 2);
    return Math.max(Math.ceil(n), this.defaultMinSampleSize);
  }

  private calculatePower(
    n1: number,
    n2: number,
    effect: number,
    standardError: number
  ): number {
    if (standardError === 0 || n1 < 2 || n2 < 2) return 0;

    const zAlpha = 1.96; // 95% confidence
    const nonCentrality = Math.abs(effect) / standardError;
    const zBeta = nonCentrality - zAlpha;

    return this.normalCDF(zBeta);
  }

  private generateRecommendations(
    experiment: Experiment,
    results: VariantResult[],
    winner?: WinnerInfo
  ): string[] {
    const recommendations: string[] = [];

    // Check sample size
    const targetSample = experiment.config.targetSampleSize || 1000;
    const minSample = Math.min(...results.map((r) => r.sampleSize));

    if (minSample < targetSample * 0.5) {
      recommendations.push(
        `Sample size is below target (${minSample} vs ${targetSample}). Consider extending the experiment.`
      );
    }

    // Check for winner
    if (winner) {
      recommendations.push(
        `${winner.variant} shows ${Math.abs(winner.improvement).toFixed(1)}% ` +
        `${winner.improvement > 0 ? 'improvement' : 'decline'} in ${winner.metric} ` +
        `with ${(winner.confidence * 100).toFixed(1)}% confidence.`
      );
    } else {
      recommendations.push('No statistically significant winner detected yet.');
    }

    // Check guardrail metrics
    if (experiment.config.guardrailMetrics) {
      for (const guardrail of experiment.config.guardrailMetrics) {
        for (const result of results) {
          const metric = result.metrics[guardrail.name];
          if (metric && guardrail.minValue !== undefined && metric.value < guardrail.minValue) {
            recommendations.push(
              `⚠️ Guardrail alert: ${result.name} has ${guardrail.name} below minimum (${metric.value.toFixed(3)} < ${guardrail.minValue})`
            );
          }
        }
      }
    }

    return recommendations;
  }

  private generateNextSteps(experiment: Experiment, winner?: WinnerInfo): string[] {
    const nextSteps: string[] = [];

    if (experiment.status === 'running') {
      if (winner && winner.confidence > 0.95) {
        nextSteps.push(`Consider graduating ${winner.variant} to production.`);
        nextSteps.push('Run final data quality checks before graduation.');
      } else {
        nextSteps.push('Continue running experiment to gather more data.');
        nextSteps.push('Monitor guardrail metrics for any concerning trends.');
      }
    } else if (experiment.status === 'completed') {
      if (winner) {
        nextSteps.push(`Deploy ${winner.variant} to production.`);
        nextSteps.push('Document learnings and update best practices.');
      }
      nextSteps.push('Archive experiment data for future reference.');
    }

    return nextSteps;
  }

  /**
   * Get service statistics
   */
  public getStats(): ABTestingStats {
    let runningExperiments = 0;
    let totalAssignments = 0;

    for (const exp of this.experiments.values()) {
      if (exp.status === 'running') runningExperiments++;
      totalAssignments += exp.assignments.size;
    }

    return {
      totalExperiments: this.experiments.size,
      runningExperiments,
      completedExperiments: Array.from(this.experiments.values()).filter(
        (e) => e.status === 'completed'
      ).length,
      totalAssignments,
      uniqueUsers: this.userAssignments.size,
    };
  }
}

// ==================== Additional Types ====================

export interface ABTestingStats {
  totalExperiments: number;
  runningExperiments: number;
  completedExperiments: number;
  totalAssignments: number;
  uniqueUsers: number;
}

// Export singleton instance
export const abTestingService = new ABTestingService();

// Export factory function
export const createABTestingService = (): ABTestingService => {
  return new ABTestingService();
};
