/**
 * Contextual Multi-Armed Bandit
 * Adaptive personalization with exploration-exploitation balance
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

// ==================== Type Definitions ====================

export interface BanditConfig {
  explorationRate: number; // Epsilon for epsilon-greedy
  ucbConstant: number; // Constant for UCB
  thompsonSamples: number; // Samples for Thompson Sampling
  decayRate: number; // Decay for time-weighted rewards
  minPulls: number; // Minimum pulls before considering arm
  windowSize: number; // Sliding window for reward tracking
}

export type BanditAlgorithm = 'epsilon_greedy' | 'ucb' | 'thompson_sampling' | 'exp3';

export interface Arm {
  id: string;
  name: string;
  features: Record<string, number>;
  metadata?: Record<string, unknown>;
}

export interface ArmStats {
  armId: string;
  pulls: number;
  totalReward: number;
  avgReward: number;
  variance: number;
  lastPulled: Date;
  recentRewards: number[];
}

export interface Context {
  userId: string;
  features: Record<string, number>;
  timestamp: Date;
  sessionId?: string;
}

export interface Decision {
  armId: string;
  score: number;
  algorithm: BanditAlgorithm;
  explorationMode: boolean;
  context: Context;
}

export interface RewardFeedback {
  armId: string;
  reward: number; // 0 to 1
  context: Context;
  latencyMs?: number;
}

export interface BanditMetrics {
  totalPulls: number;
  totalReward: number;
  avgReward: number;
  explorationRate: number;
  regret: number;
  armStats: Map<string, ArmStats>;
}

// ==================== Contextual Bandit ====================

export class ContextualBandit extends EventEmitter {
  private config: BanditConfig;
  private algorithm: BanditAlgorithm;
  private arms: Map<string, Arm> = new Map();
  private armStats: Map<string, ArmStats> = new Map();
  private contextualWeights: Map<string, number[]> = new Map(); // Arm -> weight vector
  private totalPulls: number = 0;
  private totalReward: number = 0;
  private regret: number = 0;

  constructor(
    algorithm: BanditAlgorithm = 'thompson_sampling',
    config?: Partial<BanditConfig>
  ) {
    super();
    this.algorithm = algorithm;
    this.config = {
      explorationRate: 0.1,
      ucbConstant: 2.0,
      thompsonSamples: 1000,
      decayRate: 0.01,
      minPulls: 5,
      windowSize: 100,
      ...config,
    };
  }

  /**
   * Register an arm (action/option)
   */
  public registerArm(arm: Arm): void {
    this.arms.set(arm.id, arm);

    // Initialize stats
    this.armStats.set(arm.id, {
      armId: arm.id,
      pulls: 0,
      totalReward: 0,
      avgReward: 0.5, // Optimistic initialization
      variance: 0.25,
      lastPulled: new Date(),
      recentRewards: [],
    });

    // Initialize contextual weights (random)
    const featureCount = Object.keys(arm.features).length + 10; // Extra for context features
    this.contextualWeights.set(
      arm.id,
      Array.from({ length: featureCount }, () => Math.random() - 0.5)
    );

    logger.info(`Registered arm: ${arm.id} (${arm.name})`);
  }

  /**
   * Remove an arm
   */
  public removeArm(armId: string): void {
    this.arms.delete(armId);
    this.armStats.delete(armId);
    this.contextualWeights.delete(armId);
  }

  /**
   * Select the best arm given context
   */
  public selectArm(context: Context): Decision {
    if (this.arms.size === 0) {
      throw new Error('No arms registered');
    }

    let selectedArmId: string;
    let score: number;
    let explorationMode = false;

    switch (this.algorithm) {
      case 'epsilon_greedy':
        ({ armId: selectedArmId, score, explorationMode } = this.epsilonGreedy(context));
        break;
      case 'ucb':
        ({ armId: selectedArmId, score } = this.ucb(context));
        break;
      case 'thompson_sampling':
        ({ armId: selectedArmId, score } = this.thompsonSampling(context));
        break;
      case 'exp3':
        ({ armId: selectedArmId, score } = this.exp3(context));
        break;
      default:
        throw new Error(`Unknown algorithm: ${this.algorithm}`);
    }

    const decision: Decision = {
      armId: selectedArmId,
      score,
      algorithm: this.algorithm,
      explorationMode,
      context,
    };

    this.emit('arm:selected', decision);
    return decision;
  }

  /**
   * Select top K arms
   */
  public selectTopArms(context: Context, k: number): Decision[] {
    const scores = this.calculateAllScores(context);

    // Sort by score
    const sorted = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, k);

    return sorted.map(([armId, score]) => ({
      armId,
      score,
      algorithm: this.algorithm,
      explorationMode: false,
      context,
    }));
  }

  /**
   * Report reward feedback
   */
  public reportReward(feedback: RewardFeedback): void {
    const stats = this.armStats.get(feedback.armId);
    if (!stats) {
      logger.warn(`Unknown arm: ${feedback.armId}`);
      return;
    }

    // Update stats
    stats.pulls++;
    stats.totalReward += feedback.reward;
    stats.avgReward = stats.totalReward / stats.pulls;
    stats.lastPulled = new Date();

    // Update recent rewards
    stats.recentRewards.push(feedback.reward);
    if (stats.recentRewards.length > this.config.windowSize) {
      stats.recentRewards.shift();
    }

    // Update variance
    if (stats.pulls > 1) {
      const mean = stats.avgReward;
      const variance =
        stats.recentRewards.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
        stats.recentRewards.length;
      stats.variance = variance;
    }

    // Update contextual weights (linear regression update)
    this.updateContextualWeights(feedback);

    // Update global stats
    this.totalPulls++;
    this.totalReward += feedback.reward;

    // Update regret (difference from optimal)
    const optimalReward = this.getOptimalReward();
    this.regret += optimalReward - feedback.reward;

    this.emit('reward:reported', { feedback, stats: { ...stats } });
  }

  /**
   * Get metrics
   */
  public getMetrics(): BanditMetrics {
    return {
      totalPulls: this.totalPulls,
      totalReward: this.totalReward,
      avgReward: this.totalPulls > 0 ? this.totalReward / this.totalPulls : 0,
      explorationRate: this.config.explorationRate,
      regret: this.regret,
      armStats: new Map(this.armStats),
    };
  }

  /**
   * Get arm statistics
   */
  public getArmStats(armId: string): ArmStats | null {
    return this.armStats.get(armId) || null;
  }

  /**
   * Get all arm IDs sorted by performance
   */
  public getRankedArms(): string[] {
    return Array.from(this.armStats.entries())
      .sort((a, b) => b[1].avgReward - a[1].avgReward)
      .map(([id]) => id);
  }

  /**
   * Adjust exploration rate
   */
  public setExplorationRate(rate: number): void {
    this.config.explorationRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * Decay exploration rate
   */
  public decayExploration(): void {
    this.config.explorationRate *= 1 - this.config.decayRate;
    this.config.explorationRate = Math.max(0.01, this.config.explorationRate);
  }

  // ==================== Algorithm Implementations ====================

  private epsilonGreedy(context: Context): {
    armId: string;
    score: number;
    explorationMode: boolean;
  } {
    // Exploration
    if (Math.random() < this.config.explorationRate) {
      const arms = Array.from(this.arms.keys());
      const armId = arms[Math.floor(Math.random() * arms.length)];
      return { armId, score: 0.5, explorationMode: true };
    }

    // Exploitation - select arm with highest expected reward
    const scores = this.calculateAllScores(context);
    let bestArmId = '';
    let bestScore = -Infinity;

    for (const [armId, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestArmId = armId;
      }
    }

    return { armId: bestArmId, score: bestScore, explorationMode: false };
  }

  private ucb(context: Context): { armId: string; score: number } {
    const scores = new Map<string, number>();

    for (const [armId, stats] of this.armStats) {
      // If arm hasn't been pulled enough, prioritize it
      if (stats.pulls < this.config.minPulls) {
        scores.set(armId, Infinity);
        continue;
      }

      // UCB formula: avg_reward + c * sqrt(ln(total_pulls) / arm_pulls)
      const explorationBonus =
        this.config.ucbConstant *
        Math.sqrt(Math.log(this.totalPulls + 1) / stats.pulls);

      const expectedReward = this.calculateExpectedReward(armId, context);
      scores.set(armId, expectedReward + explorationBonus);
    }

    let bestArmId = '';
    let bestScore = -Infinity;

    for (const [armId, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestArmId = armId;
      }
    }

    return { armId: bestArmId, score: bestScore };
  }

  private thompsonSampling(context: Context): { armId: string; score: number } {
    const samples = new Map<string, number>();

    for (const [armId, stats] of this.armStats) {
      // Beta distribution parameters
      const alpha = stats.totalReward + 1;
      const beta = stats.pulls - stats.totalReward + 1;

      // Sample from Beta distribution
      const sample = this.sampleBeta(alpha, beta);

      // Adjust with contextual features
      const contextualBonus = this.calculateContextualScore(armId, context) * 0.2;

      samples.set(armId, sample + contextualBonus);
    }

    let bestArmId = '';
    let bestScore = -Infinity;

    for (const [armId, score] of samples) {
      if (score > bestScore) {
        bestScore = score;
        bestArmId = armId;
      }
    }

    return { armId: bestArmId, score: bestScore };
  }

  private exp3(context: Context): { armId: string; score: number } {
    // EXP3 algorithm for adversarial bandits
    const gamma = this.config.explorationRate;
    const k = this.arms.size;

    // Calculate weights
    const weights = new Map<string, number>();
    let totalWeight = 0;

    for (const [armId, stats] of this.armStats) {
      const weight = Math.exp(
        (gamma * stats.totalReward) / (k * Math.max(stats.pulls, 1))
      );
      weights.set(armId, weight);
      totalWeight += weight;
    }

    // Calculate probabilities
    const probabilities = new Map<string, number>();
    for (const [armId, weight] of weights) {
      const prob = (1 - gamma) * (weight / totalWeight) + gamma / k;
      probabilities.set(armId, prob);
    }

    // Sample according to probabilities
    const random = Math.random();
    let cumulative = 0;

    for (const [armId, prob] of probabilities) {
      cumulative += prob;
      if (random <= cumulative) {
        return { armId, score: prob };
      }
    }

    // Fallback
    const firstArm = Array.from(this.arms.keys())[0];
    return { armId: firstArm, score: 0.5 };
  }

  // ==================== Helper Methods ====================

  private calculateAllScores(context: Context): Map<string, number> {
    const scores = new Map<string, number>();

    for (const armId of this.arms.keys()) {
      scores.set(armId, this.calculateExpectedReward(armId, context));
    }

    return scores;
  }

  private calculateExpectedReward(armId: string, context: Context): number {
    const stats = this.armStats.get(armId);
    if (!stats || stats.pulls < this.config.minPulls) {
      return 0.5; // Prior
    }

    // Base expected reward
    let expected = stats.avgReward;

    // Add contextual adjustment
    const contextualScore = this.calculateContextualScore(armId, context);
    expected = 0.7 * expected + 0.3 * contextualScore;

    return expected;
  }

  private calculateContextualScore(armId: string, context: Context): number {
    const weights = this.contextualWeights.get(armId);
    if (!weights) return 0.5;

    const arm = this.arms.get(armId);
    if (!arm) return 0.5;

    // Combine arm features with context features
    const features: number[] = [];

    // Add arm features
    for (const value of Object.values(arm.features)) {
      features.push(value);
    }

    // Add context features
    for (const value of Object.values(context.features)) {
      features.push(value);
    }

    // Dot product with weights
    let score = 0;
    for (let i = 0; i < Math.min(features.length, weights.length); i++) {
      score += features[i] * weights[i];
    }

    // Sigmoid activation
    return 1 / (1 + Math.exp(-score));
  }

  private updateContextualWeights(feedback: RewardFeedback): void {
    const weights = this.contextualWeights.get(feedback.armId);
    if (!weights) return;

    const arm = this.arms.get(feedback.armId);
    if (!arm) return;

    // Get features
    const features: number[] = [];
    for (const value of Object.values(arm.features)) {
      features.push(value);
    }
    for (const value of Object.values(feedback.context.features)) {
      features.push(value);
    }

    // Simple stochastic gradient descent update
    const predicted = this.calculateContextualScore(feedback.armId, feedback.context);
    const error = feedback.reward - predicted;
    const learningRate = 0.01;

    for (let i = 0; i < Math.min(features.length, weights.length); i++) {
      weights[i] += learningRate * error * features[i];
    }
  }

  private sampleBeta(alpha: number, beta: number): number {
    // Approximate Beta sampling using Gamma distributions
    const gammaAlpha = this.sampleGamma(alpha);
    const gammaBeta = this.sampleGamma(beta);
    return gammaAlpha / (gammaAlpha + gammaBeta);
  }

  private sampleGamma(shape: number): number {
    // Marsaglia and Tsang's method for Gamma distribution
    if (shape < 1) {
      return this.sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x: number;
      let v: number;

      do {
        x = this.normalRandom();
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = Math.random();

      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v;
      }

      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v;
      }
    }
  }

  private normalRandom(): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private getOptimalReward(): number {
    // Find the best performing arm's average reward
    let maxReward = 0;
    for (const stats of this.armStats.values()) {
      if (stats.avgReward > maxReward) {
        maxReward = stats.avgReward;
      }
    }
    return maxReward;
  }
}

// Export factory function
export const createContextualBandit = (
  algorithm?: BanditAlgorithm,
  config?: Partial<BanditConfig>
): ContextualBandit => {
  return new ContextualBandit(algorithm, config);
};
