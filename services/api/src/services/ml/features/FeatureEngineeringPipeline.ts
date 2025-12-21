/**
 * Feature Engineering Pipeline
 * Orchestrates feature computation, transformation, and materialization
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import { FeatureStore, FeatureDefinition, FeatureVector, FeatureValue } from '../FeatureStore';
import { allAdvancedFeatures, advancedFeatureGroups } from './AdvancedFeatureDefinitions';

// ==================== Type Definitions ====================

export interface PipelineConfig {
  batchSize: number;
  parallelism: number;
  retryAttempts: number;
  timeoutMs: number;
  enableCaching: boolean;
  cacheMaxAge: number;
}

export interface FeatureTransformConfig {
  name: string;
  inputFeatures: string[];
  outputFeature: string;
  transformType: TransformType;
  parameters: Record<string, unknown>;
}

export type TransformType =
  | 'normalize'
  | 'standardize'
  | 'log'
  | 'binning'
  | 'one_hot'
  | 'embedding_lookup'
  | 'time_decay'
  | 'moving_average'
  | 'lag'
  | 'ratio'
  | 'custom';

export interface ComputationResult {
  entityId: string;
  features: Record<string, unknown>;
  computedAt: Date;
  latencyMs: number;
  errors: ComputationError[];
}

export interface ComputationError {
  featureName: string;
  errorType: 'missing_input' | 'computation_failed' | 'validation_failed' | 'timeout';
  message: string;
}

export interface PipelineStats {
  totalComputations: number;
  successfulComputations: number;
  failedComputations: number;
  avgLatencyMs: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface FeatureComputationContext {
  entityId: string;
  entityType: 'user' | 'coach' | 'session' | 'goal';
  timestamp: Date;
  rawData: Record<string, unknown>;
  existingFeatures: Record<string, unknown>;
}

// ==================== Feature Transformers ====================

export class FeatureTransformers {
  /**
   * Normalize values to 0-1 range
   */
  static normalize(
    value: number,
    min: number,
    max: number
  ): number {
    if (max === min) return 0.5;
    return (value - min) / (max - min);
  }

  /**
   * Standardize to z-score
   */
  static standardize(
    value: number,
    mean: number,
    std: number
  ): number {
    if (std === 0) return 0;
    return (value - mean) / std;
  }

  /**
   * Log transform
   */
  static logTransform(value: number, offset: number = 1): number {
    return Math.log(value + offset);
  }

  /**
   * Binning (discretization)
   */
  static bin(
    value: number,
    bins: number[],
    labels?: string[]
  ): number | string {
    for (let i = 0; i < bins.length - 1; i++) {
      if (value >= bins[i] && value < bins[i + 1]) {
        return labels ? labels[i] : i;
      }
    }
    return labels ? labels[labels.length - 1] : bins.length - 1;
  }

  /**
   * One-hot encoding
   */
  static oneHot(
    value: string | number,
    categories: (string | number)[]
  ): number[] {
    return categories.map(cat => cat === value ? 1 : 0);
  }

  /**
   * Time decay weighting
   */
  static timeDecay(
    value: number,
    age: number,
    halfLife: number
  ): number {
    const decayFactor = Math.pow(0.5, age / halfLife);
    return value * decayFactor;
  }

  /**
   * Moving average
   */
  static movingAverage(values: number[], window: number): number {
    if (values.length === 0) return 0;
    const slice = values.slice(-window);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }

  /**
   * Exponential moving average
   */
  static exponentialMovingAverage(
    values: number[],
    alpha: number
  ): number {
    if (values.length === 0) return 0;
    let ema = values[0];
    for (let i = 1; i < values.length; i++) {
      ema = alpha * values[i] + (1 - alpha) * ema;
    }
    return ema;
  }

  /**
   * Lag feature
   */
  static lag(values: number[], periods: number): number | null {
    if (values.length <= periods) return null;
    return values[values.length - 1 - periods];
  }

  /**
   * Ratio calculation
   */
  static ratio(numerator: number, denominator: number, defaultValue: number = 0): number {
    if (denominator === 0) return defaultValue;
    return numerator / denominator;
  }

  /**
   * Clip values to range
   */
  static clip(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Compute percentile
   */
  static percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  }
}

// ==================== Feature Engineering Pipeline ====================

export class FeatureEngineeringPipeline extends EventEmitter {
  private featureStore: FeatureStore;
  private config: PipelineConfig;
  private transforms: Map<string, FeatureTransformConfig> = new Map();
  private cache: Map<string, { value: unknown; timestamp: number }> = new Map();
  private stats: PipelineStats;
  private featureComputeFunctions: Map<string, (ctx: FeatureComputationContext) => Promise<unknown>>;

  constructor(featureStore: FeatureStore, config?: Partial<PipelineConfig>) {
    super();
    this.featureStore = featureStore;
    this.config = {
      batchSize: 100,
      parallelism: 4,
      retryAttempts: 3,
      timeoutMs: 30000,
      enableCaching: true,
      cacheMaxAge: 300000, // 5 minutes
      ...config,
    };
    this.stats = {
      totalComputations: 0,
      successfulComputations: 0,
      failedComputations: 0,
      avgLatencyMs: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
    this.featureComputeFunctions = new Map();

    this.initializeAdvancedFeatures();
    this.registerComputeFunctions();
  }

  /**
   * Initialize advanced features in the feature store
   */
  private initializeAdvancedFeatures(): void {
    for (const feature of allAdvancedFeatures) {
      try {
        this.featureStore.registerFeature(feature);
      } catch {
        // Feature may already exist
        logger.debug(`Feature ${feature.name} already registered`);
      }
    }
    logger.info(`Initialized ${allAdvancedFeatures.length} advanced features`);
  }

  /**
   * Register feature computation functions
   */
  private registerComputeFunctions(): void {
    // User behavior features
    this.featureComputeFunctions.set('user_engagement_score', async (ctx) => {
      const { sessions = 0, logins = 0, aiChats = 0, goalUpdates = 0 } = ctx.rawData as Record<string, number>;
      return (sessions * 0.3 + logins * 0.2 + aiChats * 0.25 + goalUpdates * 0.25) * 10;
    });

    this.featureComputeFunctions.set('user_session_consistency_7d', async (ctx) => {
      const dailySessions = ctx.rawData.dailySessions as number[] || [];
      if (dailySessions.length < 2) return 0;
      const mean = dailySessions.reduce((a, b) => a + b, 0) / dailySessions.length;
      const variance = dailySessions.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / dailySessions.length;
      return Math.sqrt(variance);
    });

    this.featureComputeFunctions.set('user_peak_activity_hour', async (ctx) => {
      const activityByHour = ctx.rawData.activityByHour as number[] || new Array(24).fill(0);
      return activityByHour.indexOf(Math.max(...activityByHour));
    });

    this.featureComputeFunctions.set('user_weekend_activity_ratio', async (ctx) => {
      const weekendCount = (ctx.rawData.weekendActivities as number) || 0;
      const weekdayCount = (ctx.rawData.weekdayActivities as number) || 1;
      return FeatureTransformers.ratio(weekendCount, weekdayCount);
    });

    this.featureComputeFunctions.set('user_feature_breadth_score', async (ctx) => {
      const featuresUsed = (ctx.rawData.distinctFeaturesUsed as number) || 0;
      const totalFeatures = 20; // Total available features
      return FeatureTransformers.ratio(featuresUsed, totalFeatures);
    });

    // AI interaction features
    this.featureComputeFunctions.set('user_ai_satisfaction_score', async (ctx) => {
      const ratings = ctx.rawData.aiRatings as number[] || [];
      if (ratings.length === 0) return 0;
      return ratings.reduce((a, b) => a + b, 0) / ratings.length;
    });

    this.featureComputeFunctions.set('user_ai_conversation_depth', async (ctx) => {
      const messagesPerConversation = ctx.rawData.messagesPerConversation as number[] || [];
      if (messagesPerConversation.length === 0) return 0;
      return messagesPerConversation.reduce((a, b) => a + b, 0) / messagesPerConversation.length;
    });

    this.featureComputeFunctions.set('user_ai_topic_diversity', async (ctx) => {
      return (ctx.rawData.distinctTopics as number) || 0;
    });

    this.featureComputeFunctions.set('user_ai_followup_rate', async (ctx) => {
      const followed = (ctx.rawData.suggestionsFollowed as number) || 0;
      const given = (ctx.rawData.suggestionsGiven as number) || 1;
      return FeatureTransformers.ratio(followed, given);
    });

    // Churn prediction features
    this.featureComputeFunctions.set('user_churn_risk_score', async (ctx) => {
      // Composite churn risk based on multiple factors
      const daysSinceLastSession = (ctx.rawData.daysSinceLastSession as number) || 0;
      const engagementTrend = (ctx.rawData.engagementTrend as number) || 0;
      const paymentIssues = (ctx.rawData.hasPaymentIssue as boolean) ? 1 : 0;
      const supportTickets = (ctx.rawData.supportTickets30d as number) || 0;

      // Weighted scoring (simplified churn model)
      let riskScore = 0;
      riskScore += Math.min(daysSinceLastSession / 30, 1) * 0.3;
      riskScore += (engagementTrend < 0 ? Math.abs(engagementTrend) : 0) * 0.25;
      riskScore += paymentIssues * 0.25;
      riskScore += Math.min(supportTickets / 5, 1) * 0.2;

      return FeatureTransformers.clip(riskScore, 0, 1);
    });

    this.featureComputeFunctions.set('user_engagement_trend_14d', async (ctx) => {
      const dailyEngagement = ctx.rawData.dailyEngagement14d as number[] || [];
      if (dailyEngagement.length < 2) return 0;
      // Linear regression slope
      const n = dailyEngagement.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = dailyEngagement.reduce((a, b) => a + b, 0);
      const sumXY = dailyEngagement.reduce((acc, y, x) => acc + x * y, 0);
      const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      return slope;
    });

    this.featureComputeFunctions.set('user_inactivity_periods_30d', async (ctx) => {
      return (ctx.rawData.inactivityPeriods as number) || 0;
    });

    // Goal progress features
    this.featureComputeFunctions.set('user_active_goals_count', async (ctx) => {
      return (ctx.rawData.activeGoals as number) || 0;
    });

    this.featureComputeFunctions.set('user_goal_success_rate_all_time', async (ctx) => {
      const completed = (ctx.rawData.completedGoals as number) || 0;
      const total = (ctx.rawData.totalGoals as number) || 1;
      return FeatureTransformers.ratio(completed, total);
    });

    this.featureComputeFunctions.set('user_avg_goal_duration_days', async (ctx) => {
      const durations = ctx.rawData.goalDurations as number[] || [];
      if (durations.length === 0) return 0;
      return durations.reduce((a, b) => a + b, 0) / durations.length;
    });

    this.featureComputeFunctions.set('goal_at_risk_score', async (ctx) => {
      const daysRemaining = (ctx.rawData.daysRemaining as number) || 30;
      const currentProgress = (ctx.rawData.currentProgress as number) || 0;
      const expectedProgress = (ctx.rawData.expectedProgress as number) || 0.5;

      if (daysRemaining <= 0) return currentProgress < 1 ? 1 : 0;
      const progressGap = expectedProgress - currentProgress;
      const timeRisk = daysRemaining < 7 ? 0.3 : 0;
      return FeatureTransformers.clip(progressGap + timeRisk, 0, 1);
    });

    this.featureComputeFunctions.set('goal_momentum_score', async (ctx) => {
      const recentVelocity = (ctx.rawData.recentVelocity as number) || 0;
      const expectedVelocity = (ctx.rawData.expectedVelocity as number) || 1;
      return FeatureTransformers.ratio(recentVelocity, expectedVelocity, 0);
    });

    // Session features
    this.featureComputeFunctions.set('session_sentiment_trajectory', async (ctx) => {
      const startSentiment = (ctx.rawData.startSentiment as number) || 0;
      const endSentiment = (ctx.rawData.endSentiment as number) || 0;
      return endSentiment - startSentiment;
    });

    this.featureComputeFunctions.set('session_action_items_count', async (ctx) => {
      return (ctx.rawData.actionItems as number) || 0;
    });

    this.featureComputeFunctions.set('session_client_talk_ratio', async (ctx) => {
      const clientTime = (ctx.rawData.clientSpeakingTime as number) || 0;
      const coachTime = (ctx.rawData.coachSpeakingTime as number) || 1;
      return FeatureTransformers.ratio(clientTime, coachTime);
    });

    // Content personalization features
    this.featureComputeFunctions.set('user_content_complexity_preference', async (ctx) => {
      const complexities = ctx.rawData.completedContentComplexities as number[] || [];
      if (complexities.length === 0) return 3; // Default medium
      return complexities.reduce((a, b) => a + b, 0) / complexities.length;
    });

    this.featureComputeFunctions.set('user_notification_response_rate', async (ctx) => {
      const clicks = (ctx.rawData.notificationClicks as number) || 0;
      const sent = (ctx.rawData.notificationsSent as number) || 1;
      return FeatureTransformers.ratio(clicks, sent);
    });

    this.featureComputeFunctions.set('user_optimal_notification_time', async (ctx) => {
      const responsesByHour = ctx.rawData.notificationResponsesByHour as number[] || new Array(24).fill(0);
      return responsesByHour.indexOf(Math.max(...responsesByHour));
    });

    // Social features
    this.featureComputeFunctions.set('user_community_engagement_score', async (ctx) => {
      const posts = (ctx.rawData.forumPosts as number) || 0;
      const comments = (ctx.rawData.forumComments as number) || 0;
      const reactions = (ctx.rawData.reactions as number) || 0;
      const shares = (ctx.rawData.shares as number) || 0;
      return (posts * 0.4 + comments * 0.3 + reactions * 0.2 + shares * 0.1) / 10;
    });

    this.featureComputeFunctions.set('user_challenge_participation_rate', async (ctx) => {
      const joined = (ctx.rawData.challengesJoined as number) || 0;
      const available = (ctx.rawData.challengesAvailable as number) || 1;
      return FeatureTransformers.ratio(joined, available);
    });

    logger.info(`Registered ${this.featureComputeFunctions.size} feature computation functions`);
  }

  /**
   * Compute features for an entity
   */
  public async computeFeatures(
    entityId: string,
    entityType: 'user' | 'coach' | 'session' | 'goal',
    rawData: Record<string, unknown>,
    featureNames?: string[]
  ): Promise<ComputationResult> {
    const startTime = Date.now();
    const errors: ComputationError[] = [];
    const features: Record<string, unknown> = {};

    const targetFeatures = featureNames || Array.from(this.featureComputeFunctions.keys());

    // Get existing features
    const existingFeatureVector = await this.featureStore.getFeatures(
      entityId,
      targetFeatures
    );
    const existingFeatures: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(existingFeatureVector.features)) {
      if (!value.isNull) {
        existingFeatures[name] = value.value;
      }
    }

    const ctx: FeatureComputationContext = {
      entityId,
      entityType,
      timestamp: new Date(),
      rawData,
      existingFeatures,
    };

    // Compute each feature
    for (const featureName of targetFeatures) {
      try {
        // Check cache
        if (this.config.enableCaching) {
          const cacheKey = `${entityId}:${featureName}`;
          const cached = this.cache.get(cacheKey);
          if (cached && Date.now() - cached.timestamp < this.config.cacheMaxAge) {
            features[featureName] = cached.value;
            this.stats.cacheHits++;
            continue;
          }
          this.stats.cacheMisses++;
        }

        const computeFn = this.featureComputeFunctions.get(featureName);
        if (computeFn) {
          const value = await computeFn(ctx);
          features[featureName] = value;

          // Update cache
          if (this.config.enableCaching) {
            this.cache.set(`${entityId}:${featureName}`, {
              value,
              timestamp: Date.now(),
            });
          }
        }
      } catch (error) {
        errors.push({
          featureName,
          errorType: 'computation_failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const latencyMs = Date.now() - startTime;
    this.updateStats(errors.length === 0, latencyMs);

    // Store computed features
    await this.featureStore.setFeatureValues(entityId, features);

    this.emit('computation:completed', {
      entityId,
      featureCount: Object.keys(features).length,
      errorCount: errors.length,
      latencyMs,
    });

    return {
      entityId,
      features,
      computedAt: new Date(),
      latencyMs,
      errors,
    };
  }

  /**
   * Compute features for multiple entities in batch
   */
  public async computeBatchFeatures(
    entities: Array<{
      entityId: string;
      entityType: 'user' | 'coach' | 'session' | 'goal';
      rawData: Record<string, unknown>;
    }>,
    featureNames?: string[]
  ): Promise<ComputationResult[]> {
    const results: ComputationResult[] = [];
    const batchSize = this.config.batchSize;

    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);
      const batchPromises = batch.map((entity) =>
        this.computeFeatures(
          entity.entityId,
          entity.entityType,
          entity.rawData,
          featureNames
        )
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Register a custom transform
   */
  public registerTransform(config: FeatureTransformConfig): void {
    this.transforms.set(config.name, config);
    logger.info(`Registered transform: ${config.name}`);
  }

  /**
   * Apply transform to feature values
   */
  public applyTransform(
    transformName: string,
    values: Record<string, unknown>
  ): unknown {
    const config = this.transforms.get(transformName);
    if (!config) {
      throw new Error(`Transform ${transformName} not found`);
    }

    const inputValues = config.inputFeatures.map((f) => values[f] as number);

    switch (config.transformType) {
      case 'normalize':
        const min = config.parameters.min as number;
        const max = config.parameters.max as number;
        return FeatureTransformers.normalize(inputValues[0], min, max);

      case 'standardize':
        const mean = config.parameters.mean as number;
        const std = config.parameters.std as number;
        return FeatureTransformers.standardize(inputValues[0], mean, std);

      case 'log':
        const offset = (config.parameters.offset as number) || 1;
        return FeatureTransformers.logTransform(inputValues[0], offset);

      case 'binning':
        const bins = config.parameters.bins as number[];
        const labels = config.parameters.labels as string[] | undefined;
        return FeatureTransformers.bin(inputValues[0], bins, labels);

      case 'ratio':
        return FeatureTransformers.ratio(inputValues[0], inputValues[1]);

      case 'moving_average':
        const window = config.parameters.window as number;
        return FeatureTransformers.movingAverage(inputValues, window);

      default:
        throw new Error(`Transform type ${config.transformType} not implemented`);
    }
  }

  /**
   * Update pipeline statistics
   */
  private updateStats(success: boolean, latencyMs: number): void {
    this.stats.totalComputations++;
    if (success) {
      this.stats.successfulComputations++;
    } else {
      this.stats.failedComputations++;
    }

    // Running average of latency
    const n = this.stats.totalComputations;
    this.stats.avgLatencyMs =
      ((n - 1) * this.stats.avgLatencyMs + latencyMs) / n;
  }

  /**
   * Get pipeline statistics
   */
  public getStats(): PipelineStats {
    return { ...this.stats };
  }

  /**
   * Clear the feature cache
   */
  public clearCache(): void {
    this.cache.clear();
    logger.info('Feature cache cleared');
  }

  /**
   * Get registered transforms
   */
  public getTransforms(): FeatureTransformConfig[] {
    return Array.from(this.transforms.values());
  }
}

// Export singleton factory
export const createFeatureEngineeringPipeline = (
  featureStore: FeatureStore,
  config?: Partial<PipelineConfig>
): FeatureEngineeringPipeline => {
  return new FeatureEngineeringPipeline(featureStore, config);
};
