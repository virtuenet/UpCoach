/**
 * Traffic Splitter Service
 *
 * Manages traffic routing for A/B testing, multi-armed bandits,
 * and experiment-based model selection.
 *
 * Features:
 * - A/B testing between model versions
 * - Multi-armed bandit for adaptive allocation
 * - Sticky session support
 * - Experiment lifecycle management
 * - Statistical significance testing
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// Types
export type ExperimentType = 'ab_test' | 'multi_armed_bandit' | 'multi_variant';
export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'stopped';
export type AllocationStrategy = 'random' | 'sticky' | 'weighted' | 'epsilon_greedy' | 'ucb';

export interface ExperimentConfig {
  id?: string;
  name: string;
  description?: string;
  modelId: string;
  type: ExperimentType;
  variants: VariantConfig[];
  allocationStrategy: AllocationStrategy;
  targetMetric: string;
  minimumSampleSize: number;
  maxDuration: number; // days
  stickyKey?: string; // field to use for sticky sessions
  confidenceLevel?: number; // default 0.95
}

export interface VariantConfig {
  id: string;
  name: string;
  modelVersion: string;
  trafficWeight: number; // 0-100
  isControl: boolean;
}

export interface Experiment {
  id: string;
  config: ExperimentConfig;
  status: ExperimentStatus;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  variants: VariantState[];
  stickyAssignments: Map<string, string>;
  results?: ExperimentResults;
}

export interface VariantState {
  id: string;
  config: VariantConfig;
  impressions: number;
  conversions: number;
  totalMetricValue: number;
  metricValues: number[];
  conversionRate: number;
  meanMetricValue: number;
  variance: number;
  confidenceInterval: [number, number];
  allocatedWeight: number; // current weight (may differ from config for bandits)
}

export interface ExperimentResults {
  analysisDate: Date;
  totalSamples: number;
  winner?: string;
  winnerConfidence: number;
  statisticallySignificant: boolean;
  pValue: number;
  effectSize: number;
  variantResults: VariantResult[];
  recommendation: string;
}

export interface VariantResult {
  variantId: string;
  name: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
  meanMetric: number;
  variance: number;
  confidenceInterval: [number, number];
  relativeImprovement?: number; // vs control
}

export interface TrafficDecision {
  variantId: string;
  modelVersion: string;
  experimentId: string;
  isSticky: boolean;
  reason: string;
}

export interface SplitterStats {
  activeExperiments: number;
  completedExperiments: number;
  totalAssignments: number;
  totalConversions: number;
  avgExperimentDuration: number;
}

/**
 * Traffic Splitter Service
 */
export class TrafficSplitter extends EventEmitter {
  private experiments: Map<string, Experiment> = new Map();
  private modelExperiments: Map<string, Set<string>> = new Map();
  private banditState: Map<string, BanditState> = new Map();

  private isRunning = false;
  private updateInterval: NodeJS.Timeout | null = null;

  // Statistics
  private totalAssignments = 0;
  private totalConversions = 0;

  // Configuration
  private readonly config = {
    updateIntervalMs: 60000,
    minSamplesForSignificance: 100,
    defaultConfidenceLevel: 0.95,
    epsilonGreedyEpsilon: 0.1,
    ucbExplorationFactor: 2,
    maxMetricHistory: 10000,
  };

  constructor() {
    super();
  }

  /**
   * Start the traffic splitter service
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;

    // Start update loop for bandits
    this.updateInterval = setInterval(
      () => this.updateBanditWeights(),
      this.config.updateIntervalMs
    );

    this.emit('started');
    console.log('[TrafficSplitter] Service started');
  }

  /**
   * Stop the traffic splitter service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.emit('stopped');
    console.log('[TrafficSplitter] Service stopped');
  }

  /**
   * Create a new experiment
   */
  createExperiment(config: ExperimentConfig): Experiment {
    const id = config.id || `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Validate config
    if (config.variants.length < 2) {
      throw new Error('Experiment must have at least 2 variants');
    }

    const totalWeight = config.variants.reduce((sum, v) => sum + v.trafficWeight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error('Variant weights must sum to 100');
    }

    const hasControl = config.variants.some(v => v.isControl);
    if (!hasControl) {
      throw new Error('Experiment must have a control variant');
    }

    const variants: VariantState[] = config.variants.map(v => ({
      id: v.id,
      config: v,
      impressions: 0,
      conversions: 0,
      totalMetricValue: 0,
      metricValues: [],
      conversionRate: 0,
      meanMetricValue: 0,
      variance: 0,
      confidenceInterval: [0, 0],
      allocatedWeight: v.trafficWeight,
    }));

    const experiment: Experiment = {
      id,
      config,
      status: 'draft',
      createdAt: new Date(),
      variants,
      stickyAssignments: new Map(),
    };

    this.experiments.set(id, experiment);

    // Index by model
    let modelExps = this.modelExperiments.get(config.modelId);
    if (!modelExps) {
      modelExps = new Set();
      this.modelExperiments.set(config.modelId, modelExps);
    }
    modelExps.add(id);

    this.emit('experimentCreated', experiment);
    console.log(`[TrafficSplitter] Created experiment ${id}: ${config.name}`);

    return experiment;
  }

  /**
   * Start an experiment
   */
  startExperiment(experimentId: string): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'draft') return false;

    experiment.status = 'running';
    experiment.startedAt = new Date();

    // Initialize bandit state if needed
    if (experiment.config.type === 'multi_armed_bandit') {
      this.initializeBandit(experimentId, experiment);
    }

    this.emit('experimentStarted', experiment);
    console.log(`[TrafficSplitter] Started experiment ${experimentId}`);

    return true;
  }

  /**
   * Stop an experiment
   */
  stopExperiment(experimentId: string, reason?: string): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') return false;

    experiment.status = 'stopped';
    experiment.endedAt = new Date();

    // Calculate final results
    experiment.results = this.calculateResults(experiment);

    this.emit('experimentStopped', { experiment, reason });
    console.log(`[TrafficSplitter] Stopped experiment ${experimentId}: ${reason || 'Manual stop'}`);

    return true;
  }

  /**
   * Complete an experiment (with winner)
   */
  completeExperiment(experimentId: string): ExperimentResults | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') return null;

    const results = this.calculateResults(experiment);
    experiment.results = results;
    experiment.status = 'completed';
    experiment.endedAt = new Date();

    this.emit('experimentCompleted', { experiment, results });
    console.log(`[TrafficSplitter] Completed experiment ${experimentId}`);

    return results;
  }

  /**
   * Route a request to a variant
   */
  routeRequest(modelId: string, sessionKey?: string): TrafficDecision | null {
    // Find running experiment for this model
    const modelExps = this.modelExperiments.get(modelId);
    if (!modelExps || modelExps.size === 0) return null;

    const experiment = Array.from(modelExps)
      .map(id => this.experiments.get(id))
      .find(exp => exp && exp.status === 'running');

    if (!experiment) return null;

    // Check for sticky assignment
    if (sessionKey && experiment.config.allocationStrategy === 'sticky') {
      const existingVariant = experiment.stickyAssignments.get(sessionKey);
      if (existingVariant) {
        const variant = experiment.variants.find(v => v.id === existingVariant);
        if (variant) {
          return {
            variantId: variant.id,
            modelVersion: variant.config.modelVersion,
            experimentId: experiment.id,
            isSticky: true,
            reason: 'Sticky session assignment',
          };
        }
      }
    }

    // Select variant based on strategy
    let selectedVariant: VariantState;

    switch (experiment.config.allocationStrategy) {
      case 'epsilon_greedy':
        selectedVariant = this.selectEpsilonGreedy(experiment);
        break;
      case 'ucb':
        selectedVariant = this.selectUCB(experiment);
        break;
      case 'weighted':
      case 'random':
      case 'sticky':
      default:
        selectedVariant = this.selectWeighted(experiment);
    }

    // Record sticky assignment
    if (sessionKey && experiment.config.allocationStrategy === 'sticky') {
      experiment.stickyAssignments.set(sessionKey, selectedVariant.id);
    }

    // Record impression
    selectedVariant.impressions++;
    this.totalAssignments++;

    return {
      variantId: selectedVariant.id,
      modelVersion: selectedVariant.config.modelVersion,
      experimentId: experiment.id,
      isSticky: false,
      reason: `Selected via ${experiment.config.allocationStrategy}`,
    };
  }

  /**
   * Record a conversion for an experiment
   */
  recordConversion(
    experimentId: string,
    variantId: string,
    metricValue?: number
  ): boolean {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') return false;

    const variant = experiment.variants.find(v => v.id === variantId);
    if (!variant) return false;

    variant.conversions++;
    this.totalConversions++;

    if (metricValue !== undefined) {
      variant.totalMetricValue += metricValue;
      variant.metricValues.push(metricValue);

      // Trim history
      if (variant.metricValues.length > this.config.maxMetricHistory) {
        const removed = variant.metricValues.shift()!;
        variant.totalMetricValue -= removed;
      }
    }

    // Update statistics
    this.updateVariantStats(variant);

    // Check for auto-completion
    if (this.shouldAutoComplete(experiment)) {
      this.completeExperiment(experimentId);
    }

    return true;
  }

  /**
   * Get experiment by ID
   */
  getExperiment(experimentId: string): Experiment | undefined {
    return this.experiments.get(experimentId);
  }

  /**
   * Get experiments for a model
   */
  getModelExperiments(modelId: string): Experiment[] {
    const expIds = this.modelExperiments.get(modelId);
    if (!expIds) return [];

    return Array.from(expIds)
      .map(id => this.experiments.get(id))
      .filter((exp): exp is Experiment => exp !== undefined);
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Get running experiments
   */
  getRunningExperiments(): Experiment[] {
    return Array.from(this.experiments.values())
      .filter(exp => exp.status === 'running');
  }

  /**
   * Get experiment results
   */
  getResults(experimentId: string): ExperimentResults | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    if (experiment.results) return experiment.results;

    // Calculate current results
    return this.calculateResults(experiment);
  }

  /**
   * Get service statistics
   */
  getStats(): SplitterStats {
    const experiments = Array.from(this.experiments.values());
    const completed = experiments.filter(exp =>
      exp.status === 'completed' || exp.status === 'stopped'
    );

    const durations = completed
      .filter(exp => exp.startedAt && exp.endedAt)
      .map(exp => exp.endedAt!.getTime() - exp.startedAt!.getTime());

    return {
      activeExperiments: experiments.filter(exp => exp.status === 'running').length,
      completedExperiments: completed.length,
      totalAssignments: this.totalAssignments,
      totalConversions: this.totalConversions,
      avgExperimentDuration: durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length / (1000 * 60 * 60 * 24)
        : 0,
    };
  }

  // Private methods

  private selectWeighted(experiment: Experiment): VariantState {
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.allocatedWeight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of experiment.variants) {
      random -= variant.allocatedWeight;
      if (random <= 0) return variant;
    }

    return experiment.variants[0];
  }

  private selectEpsilonGreedy(experiment: Experiment): VariantState {
    const epsilon = this.config.epsilonGreedyEpsilon;

    if (Math.random() < epsilon) {
      // Explore: random selection
      const index = Math.floor(Math.random() * experiment.variants.length);
      return experiment.variants[index];
    }

    // Exploit: select best performer
    return experiment.variants.reduce((best, current) => {
      const currentCR = current.impressions > 0 ? current.conversionRate : 0;
      const bestCR = best.impressions > 0 ? best.conversionRate : 0;
      return currentCR > bestCR ? current : best;
    });
  }

  private selectUCB(experiment: Experiment): VariantState {
    const totalImpressions = experiment.variants.reduce((sum, v) => sum + v.impressions, 0);

    if (totalImpressions === 0) {
      // Initial exploration: select randomly
      const index = Math.floor(Math.random() * experiment.variants.length);
      return experiment.variants[index];
    }

    // Calculate UCB score for each variant
    let bestVariant = experiment.variants[0];
    let bestScore = -Infinity;

    for (const variant of experiment.variants) {
      if (variant.impressions === 0) {
        // Always try unexplored variants
        return variant;
      }

      const exploitation = variant.conversionRate;
      const exploration = Math.sqrt(
        (this.config.ucbExplorationFactor * Math.log(totalImpressions)) / variant.impressions
      );
      const score = exploitation + exploration;

      if (score > bestScore) {
        bestScore = score;
        bestVariant = variant;
      }
    }

    return bestVariant;
  }

  private initializeBandit(experimentId: string, experiment: Experiment): void {
    const state: BanditState = {
      experimentId,
      arms: experiment.variants.map(v => ({
        variantId: v.id,
        pulls: 0,
        rewards: 0,
        mean: 0,
        variance: 0,
      })),
      totalPulls: 0,
    };

    this.banditState.set(experimentId, state);
  }

  private updateBanditWeights(): void {
    for (const experiment of this.experiments.values()) {
      if (experiment.status !== 'running') continue;
      if (experiment.config.type !== 'multi_armed_bandit') continue;

      const state = this.banditState.get(experiment.id);
      if (!state) continue;

      // Update weights based on performance
      const totalRewards = state.arms.reduce((sum, arm) => sum + arm.rewards, 0);
      if (totalRewards === 0) continue;

      for (const arm of state.arms) {
        const variant = experiment.variants.find(v => v.id === arm.variantId);
        if (!variant) continue;

        // Update allocated weight based on Thompson Sampling or simple proportional
        const performance = arm.mean || 0.01;
        const totalPerformance = state.arms.reduce((sum, a) => sum + (a.mean || 0.01), 0);

        variant.allocatedWeight = (performance / totalPerformance) * 100;
      }
    }
  }

  private updateVariantStats(variant: VariantState): void {
    variant.conversionRate = variant.impressions > 0
      ? variant.conversions / variant.impressions
      : 0;

    variant.meanMetricValue = variant.metricValues.length > 0
      ? variant.totalMetricValue / variant.metricValues.length
      : 0;

    // Calculate variance
    if (variant.metricValues.length > 1) {
      const mean = variant.meanMetricValue;
      const squaredDiffs = variant.metricValues.map(v => Math.pow(v - mean, 2));
      variant.variance = squaredDiffs.reduce((a, b) => a + b, 0) / (variant.metricValues.length - 1);
    }

    // Calculate confidence interval (95%)
    if (variant.impressions >= 30) {
      const se = Math.sqrt(variant.variance / variant.impressions);
      const z = 1.96; // 95% confidence
      variant.confidenceInterval = [
        variant.conversionRate - z * se,
        variant.conversionRate + z * se,
      ];
    }
  }

  private shouldAutoComplete(experiment: Experiment): boolean {
    // Check if we have enough samples
    const totalSamples = experiment.variants.reduce((sum, v) => sum + v.impressions, 0);
    if (totalSamples < experiment.config.minimumSampleSize) return false;

    // Check statistical significance
    const results = this.calculateResults(experiment);
    return results.statisticallySignificant;
  }

  private calculateResults(experiment: Experiment): ExperimentResults {
    const control = experiment.variants.find(v => v.config.isControl);
    if (!control) {
      return this.createEmptyResults(experiment);
    }

    const variantResults: VariantResult[] = experiment.variants.map(v => {
      const relativeImprovement = control.conversionRate > 0
        ? ((v.conversionRate - control.conversionRate) / control.conversionRate) * 100
        : 0;

      return {
        variantId: v.id,
        name: v.config.name,
        impressions: v.impressions,
        conversions: v.conversions,
        conversionRate: v.conversionRate,
        meanMetric: v.meanMetricValue,
        variance: v.variance,
        confidenceInterval: v.confidenceInterval,
        relativeImprovement: v.config.isControl ? undefined : relativeImprovement,
      };
    });

    // Find winner
    const nonControlVariants = variantResults.filter(v =>
      !experiment.variants.find(ev => ev.id === v.variantId)?.config.isControl
    );

    let winner: string | undefined;
    let winnerConfidence = 0;
    let bestImprovement = 0;

    for (const variant of nonControlVariants) {
      if ((variant.relativeImprovement || 0) > bestImprovement) {
        bestImprovement = variant.relativeImprovement || 0;
        winner = variant.variantId;
      }
    }

    // Calculate p-value using two-proportion z-test
    const { pValue, significantWinner } = this.calculateSignificance(control, experiment.variants);

    if (significantWinner) {
      winner = significantWinner;
      winnerConfidence = 1 - pValue;
    }

    const totalSamples = experiment.variants.reduce((sum, v) => sum + v.impressions, 0);

    return {
      analysisDate: new Date(),
      totalSamples,
      winner,
      winnerConfidence,
      statisticallySignificant: pValue < (1 - (experiment.config.confidenceLevel || this.config.defaultConfidenceLevel)),
      pValue,
      effectSize: bestImprovement / 100,
      variantResults,
      recommendation: this.generateRecommendation(winner, pValue, totalSamples, experiment.config.minimumSampleSize),
    };
  }

  private calculateSignificance(
    control: VariantState,
    variants: VariantState[]
  ): { pValue: number; significantWinner?: string } {
    let lowestPValue = 1;
    let significantWinner: string | undefined;

    for (const variant of variants) {
      if (variant.config.isControl) continue;
      if (variant.impressions < 30 || control.impressions < 30) continue;

      // Two-proportion z-test
      const p1 = control.conversionRate;
      const p2 = variant.conversionRate;
      const n1 = control.impressions;
      const n2 = variant.impressions;

      const pooledP = (control.conversions + variant.conversions) / (n1 + n2);
      const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));

      if (se === 0) continue;

      const z = Math.abs(p2 - p1) / se;
      const pValue = 2 * (1 - this.normalCDF(z)); // Two-tailed

      if (pValue < lowestPValue) {
        lowestPValue = pValue;
        if (p2 > p1) {
          significantWinner = variant.id;
        }
      }
    }

    return { pValue: lowestPValue, significantWinner };
  }

  private normalCDF(z: number): number {
    // Approximation of normal CDF
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    const absZ = Math.abs(z) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * absZ);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);

    return 0.5 * (1.0 + sign * y);
  }

  private generateRecommendation(
    winner: string | undefined,
    pValue: number,
    totalSamples: number,
    minSamples: number
  ): string {
    if (totalSamples < minSamples) {
      return `Need more data. Currently ${totalSamples}/${minSamples} samples collected.`;
    }

    if (pValue < 0.01 && winner) {
      return `Strong evidence for variant ${winner}. Consider deploying.`;
    }

    if (pValue < 0.05 && winner) {
      return `Moderate evidence for variant ${winner}. Consider collecting more data.`;
    }

    if (pValue < 0.1) {
      return 'Weak evidence of difference. Continue running experiment.';
    }

    return 'No significant difference detected. Consider stopping experiment.';
  }

  private createEmptyResults(experiment: Experiment): ExperimentResults {
    return {
      analysisDate: new Date(),
      totalSamples: 0,
      winnerConfidence: 0,
      statisticallySignificant: false,
      pValue: 1,
      effectSize: 0,
      variantResults: [],
      recommendation: 'No control variant found. Cannot analyze results.',
    };
  }
}

interface BanditState {
  experimentId: string;
  arms: BanditArm[];
  totalPulls: number;
}

interface BanditArm {
  variantId: string;
  pulls: number;
  rewards: number;
  mean: number;
  variance: number;
}

// Singleton instance
export const trafficSplitter = new TrafficSplitter();

// Factory function
export function createTrafficSplitter(): TrafficSplitter {
  return new TrafficSplitter();
}
