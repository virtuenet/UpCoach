/**
 * Real-time Prediction Service
 * Sub-100ms prediction latency for critical operations
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { redis } from '../redis';
import { eventBus, Event, EventCategory } from '../events';
import {
  churnPredictor,
  coachPerformancePredictor,
  sessionOutcomePredictor,
  goalCompletionPredictor,
  engagementOptimizer,
} from '../ml/predictions';

// ==================== Types ====================

export type PredictionType =
  | 'churn'
  | 'coach_match'
  | 'session_outcome'
  | 'goal_completion'
  | 'engagement';

export type PredictionPriority = 'low' | 'normal' | 'high' | 'critical';

export interface PredictionRequest {
  id: string;
  type: PredictionType;
  userId: string;
  input: unknown;
  priority: PredictionPriority;
  requestedAt: Date;
  timeout?: number;
  metadata?: Record<string, unknown>;
}

export interface PredictionResult {
  requestId: string;
  type: PredictionType;
  userId: string;
  prediction: unknown;
  confidence: number;
  latencyMs: number;
  fromCache: boolean;
  timestamp: Date;
  expiresAt?: Date;
}

export interface BatchPredictionRequest {
  id: string;
  requests: PredictionRequest[];
  priority: PredictionPriority;
  requestedAt: Date;
}

export interface BatchPredictionResult {
  batchId: string;
  results: PredictionResult[];
  totalLatencyMs: number;
  successCount: number;
  failureCount: number;
  timestamp: Date;
}

export interface PredictionSubscription {
  id: string;
  userId: string;
  types: PredictionType[];
  callback: (result: PredictionResult) => void;
  createdAt: Date;
}

export interface RealtimePredictionStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorCount: number;
  activeSubscriptions: number;
  queueLength: number;
}

// ==================== Real-time Prediction Service ====================

export class RealtimePredictionService extends EventEmitter {
  private subscriptions: Map<string, PredictionSubscription> = new Map();
  private userSubscriptions: Map<string, Set<string>> = new Map();
  private requestQueue: PredictionRequest[] = [];
  private isProcessing = false;
  private stats: RealtimePredictionStats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageLatencyMs: 0,
    p95LatencyMs: 0,
    p99LatencyMs: 0,
    errorCount: 0,
    activeSubscriptions: 0,
    queueLength: 0,
  };
  private latencyMeasurements: number[] = [];

  private readonly config = {
    cachePrefix: 'upcoach:predictions:',
    defaultCacheTtl: 300, // 5 minutes
    criticalCacheTtl: 60, // 1 minute for critical predictions
    maxQueueSize: 1000,
    batchSize: 50,
    processingIntervalMs: 10,
    timeoutMs: 5000,
    warmupModelTypes: ['churn', 'session_outcome'] as PredictionType[],
    latencyWindowSize: 1000,
  };

  constructor() {
    super();
    this.setMaxListeners(100);
    this.startProcessing();
  }

  /**
   * Make a real-time prediction
   */
  async predict(
    type: PredictionType,
    userId: string,
    input: unknown,
    options: {
      priority?: PredictionPriority;
      timeout?: number;
      skipCache?: boolean;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<PredictionResult> {
    const startTime = Date.now();
    const requestId = uuidv4();
    const priority = options.priority || 'normal';

    this.stats.totalRequests++;

    try {
      // Check cache first (unless skipCache is true)
      if (!options.skipCache) {
        const cached = await this.getFromCache(type, userId, input);
        if (cached) {
          this.stats.cacheHits++;
          this.recordLatency(Date.now() - startTime);

          const result: PredictionResult = {
            requestId,
            type,
            userId,
            prediction: cached.prediction,
            confidence: cached.confidence,
            latencyMs: Date.now() - startTime,
            fromCache: true,
            timestamp: new Date(),
            expiresAt: cached.expiresAt,
          };

          this.notifySubscribers(result);
          return result;
        }
      }

      this.stats.cacheMisses++;

      // Make prediction
      const prediction = await this.executePrediction(type, userId, input, options.timeout);

      const latencyMs = Date.now() - startTime;
      this.recordLatency(latencyMs);

      const result: PredictionResult = {
        requestId,
        type,
        userId,
        prediction: prediction.result,
        confidence: prediction.confidence,
        latencyMs,
        fromCache: false,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + this.getCacheTtl(priority) * 1000),
      };

      // Cache result
      await this.cacheResult(type, userId, input, result);

      // Notify subscribers
      this.notifySubscribers(result);

      // Publish event
      await this.publishPredictionEvent(result);

      return result;
    } catch (error) {
      this.stats.errorCount++;
      logger.error('Prediction error:', { type, userId, error });
      throw error;
    }
  }

  /**
   * Batch prediction for multiple users/inputs
   */
  async batchPredict(
    requests: Array<{
      type: PredictionType;
      userId: string;
      input: unknown;
    }>,
    options: {
      priority?: PredictionPriority;
      timeout?: number;
    } = {}
  ): Promise<BatchPredictionResult> {
    const batchId = uuidv4();
    const startTime = Date.now();
    const results: PredictionResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Process in parallel with concurrency limit
    const concurrency = 10;
    const chunks: Array<typeof requests> = [];

    for (let i = 0; i < requests.length; i += concurrency) {
      chunks.push(requests.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(
        chunk.map(req =>
          this.predict(req.type, req.userId, req.input, options)
        )
      );

      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          successCount++;
        } else {
          failureCount++;
        }
      }
    }

    return {
      batchId,
      results,
      totalLatencyMs: Date.now() - startTime,
      successCount,
      failureCount,
      timestamp: new Date(),
    };
  }

  /**
   * Execute actual prediction
   */
  private async executePrediction(
    type: PredictionType,
    userId: string,
    input: unknown,
    timeout?: number
  ): Promise<{ result: unknown; confidence: number }> {
    const timeoutMs = timeout || this.config.timeoutMs;

    const predictionPromise = (async () => {
      switch (type) {
        case 'churn':
          const churnResult = await churnPredictor.predict(input as Parameters<typeof churnPredictor.predict>[0]);
          return {
            result: churnResult,
            confidence: churnResult.probability,
          };

        case 'coach_match':
          const { client, coaches, limit } = input as {
            client: unknown;
            coaches: unknown[];
            limit?: number;
          };
          const matches = coachPerformancePredictor.findBestMatches(
            coaches as Parameters<typeof coachPerformancePredictor.findBestMatches>[0],
            client as Parameters<typeof coachPerformancePredictor.findBestMatches>[1],
            limit || 5
          );
          return {
            result: matches,
            confidence: matches.length > 0 ? matches[0].compatibilityScore : 0,
          };

        case 'session_outcome':
          const sessionResult = sessionOutcomePredictor.predict(
            input as Parameters<typeof sessionOutcomePredictor.predict>[0]
          );
          return {
            result: sessionResult,
            confidence: sessionResult.predictedSuccessScore,
          };

        case 'goal_completion':
          const goalResult = await goalCompletionPredictor.predict(
            input as Parameters<typeof goalCompletionPredictor.predict>[0]
          );
          return {
            result: goalResult,
            confidence: goalResult.probability,
          };

        case 'engagement':
          const engagementResult = await engagementOptimizer.optimize(
            input as Parameters<typeof engagementOptimizer.optimize>[0]
          );
          return {
            result: engagementResult,
            confidence: engagementResult.overallScore,
          };

        default:
          throw new Error(`Unknown prediction type: ${type}`);
      }
    })();

    // Apply timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Prediction timeout')), timeoutMs);
    });

    return Promise.race([predictionPromise, timeoutPromise]);
  }

  /**
   * Subscribe to predictions for a user
   */
  subscribe(
    userId: string,
    types: PredictionType[],
    callback: (result: PredictionResult) => void
  ): string {
    const subscriptionId = uuidv4();

    const subscription: PredictionSubscription = {
      id: subscriptionId,
      userId,
      types,
      callback,
      createdAt: new Date(),
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Track user subscriptions
    if (!this.userSubscriptions.has(userId)) {
      this.userSubscriptions.set(userId, new Set());
    }
    this.userSubscriptions.get(userId)!.add(subscriptionId);

    this.stats.activeSubscriptions = this.subscriptions.size;

    logger.debug('Prediction subscription created', { subscriptionId, userId, types });

    return subscriptionId;
  }

  /**
   * Unsubscribe from predictions
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);

    if (!subscription) return false;

    this.subscriptions.delete(subscriptionId);

    // Clean up user tracking
    const userSubs = this.userSubscriptions.get(subscription.userId);
    if (userSubs) {
      userSubs.delete(subscriptionId);
      if (userSubs.size === 0) {
        this.userSubscriptions.delete(subscription.userId);
      }
    }

    this.stats.activeSubscriptions = this.subscriptions.size;

    return true;
  }

  /**
   * Notify subscribers of prediction result
   */
  private notifySubscribers(result: PredictionResult): void {
    const userSubs = this.userSubscriptions.get(result.userId);

    if (!userSubs) return;

    for (const subscriptionId of userSubs) {
      const subscription = this.subscriptions.get(subscriptionId);
      if (subscription && subscription.types.includes(result.type)) {
        try {
          subscription.callback(result);
        } catch (error) {
          logger.error('Subscription callback error:', { subscriptionId, error });
        }
      }
    }

    this.emit('prediction', result);
  }

  /**
   * Get cached prediction
   */
  private async getFromCache(
    type: PredictionType,
    userId: string,
    input: unknown
  ): Promise<{ prediction: unknown; confidence: number; expiresAt: Date } | null> {
    try {
      const cacheKey = this.getCacheKey(type, userId, input);
      const cached = await redis.get(cacheKey);

      if (!cached) return null;

      const data = JSON.parse(cached);
      return {
        prediction: data.prediction,
        confidence: data.confidence,
        expiresAt: new Date(data.expiresAt),
      };
    } catch (error) {
      logger.error('Cache read error:', error);
      return null;
    }
  }

  /**
   * Cache prediction result
   */
  private async cacheResult(
    type: PredictionType,
    userId: string,
    input: unknown,
    result: PredictionResult
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(type, userId, input);
      const ttl = this.getCacheTtl(result.confidence > 0.9 ? 'high' : 'normal');

      await redis.setEx(
        cacheKey,
        ttl,
        JSON.stringify({
          prediction: result.prediction,
          confidence: result.confidence,
          expiresAt: result.expiresAt,
          cachedAt: new Date(),
        })
      );
    } catch (error) {
      logger.error('Cache write error:', error);
    }
  }

  /**
   * Get cache key
   */
  private getCacheKey(type: PredictionType, userId: string, input: unknown): string {
    const inputHash = this.hashInput(input);
    return `${this.config.cachePrefix}${type}:${userId}:${inputHash}`;
  }

  /**
   * Hash input for cache key
   */
  private hashInput(input: unknown): string {
    const str = JSON.stringify(input);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cache TTL based on priority
   */
  private getCacheTtl(priority: PredictionPriority): number {
    switch (priority) {
      case 'critical':
        return this.config.criticalCacheTtl;
      case 'high':
        return Math.floor(this.config.defaultCacheTtl / 2);
      default:
        return this.config.defaultCacheTtl;
    }
  }

  /**
   * Publish prediction event
   */
  private async publishPredictionEvent(result: PredictionResult): Promise<void> {
    try {
      await eventBus.publish(
        `prediction.${result.type}`,
        'prediction' as EventCategory,
        {
          requestId: result.requestId,
          userId: result.userId,
          type: result.type,
          confidence: result.confidence,
          latencyMs: result.latencyMs,
          fromCache: result.fromCache,
        },
        {
          priority: result.confidence > 0.8 ? 'high' : 'normal',
        }
      );
    } catch (error) {
      logger.error('Failed to publish prediction event:', error);
    }
  }

  /**
   * Queue prediction for async processing
   */
  queuePrediction(request: PredictionRequest): void {
    if (this.requestQueue.length >= this.config.maxQueueSize) {
      throw new Error('Prediction queue full');
    }

    // Priority queue - insert based on priority
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    const insertIndex = this.requestQueue.findIndex(
      r => priorityOrder[r.priority] > priorityOrder[request.priority]
    );

    if (insertIndex === -1) {
      this.requestQueue.push(request);
    } else {
      this.requestQueue.splice(insertIndex, 0, request);
    }

    this.stats.queueLength = this.requestQueue.length;
  }

  /**
   * Start queue processing
   */
  private startProcessing(): void {
    setInterval(async () => {
      if (this.isProcessing || this.requestQueue.length === 0) return;

      this.isProcessing = true;

      try {
        const batch = this.requestQueue.splice(0, this.config.batchSize);
        this.stats.queueLength = this.requestQueue.length;

        await Promise.all(
          batch.map(async request => {
            try {
              await this.predict(
                request.type,
                request.userId,
                request.input,
                {
                  priority: request.priority,
                  timeout: request.timeout,
                  metadata: request.metadata,
                }
              );
            } catch (error) {
              logger.error('Queue processing error:', { requestId: request.id, error });
            }
          })
        );
      } finally {
        this.isProcessing = false;
      }
    }, this.config.processingIntervalMs);
  }

  /**
   * Warm up models for faster predictions
   */
  async warmup(): Promise<void> {
    logger.info('Warming up prediction models...');

    for (const type of this.config.warmupModelTypes) {
      try {
        // Make a dummy prediction to warm up the model
        await this.predict(
          type,
          'warmup-user',
          this.getWarmupInput(type),
          { skipCache: true, priority: 'low' }
        );
        logger.debug(`Model ${type} warmed up`);
      } catch (error) {
        logger.error(`Failed to warm up model ${type}:`, error);
      }
    }

    logger.info('Model warmup complete');
  }

  /**
   * Get warmup input for model type
   */
  private getWarmupInput(type: PredictionType): unknown {
    switch (type) {
      case 'churn':
        return {
          userId: 'warmup',
          subscriptionStatus: 'active',
          daysSinceLastActivity: 1,
          sessionsThisWeek: 3,
          goalsCompleted: 2,
        };
      case 'session_outcome':
        return {
          sessionId: 'warmup',
          coachId: 'warmup-coach',
          clientId: 'warmup-client',
          scheduledTime: new Date(),
          sessionType: 'regular',
        };
      default:
        return {};
    }
  }

  /**
   * Invalidate cache for user
   */
  async invalidateCache(userId: string, type?: PredictionType): Promise<number> {
    try {
      const pattern = type
        ? `${this.config.cachePrefix}${type}:${userId}:*`
        : `${this.config.cachePrefix}*:${userId}:*`;

      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        for (const key of keys) {
          await redis.del(key);
        }
      }

      logger.debug('Cache invalidated', { userId, type, count: keys.length });
      return keys.length;
    } catch (error) {
      logger.error('Cache invalidation error:', error);
      return 0;
    }
  }

  /**
   * Record latency measurement
   */
  private recordLatency(latencyMs: number): void {
    this.latencyMeasurements.push(latencyMs);

    if (this.latencyMeasurements.length > this.config.latencyWindowSize) {
      this.latencyMeasurements.shift();
    }

    this.updateLatencyStats();
  }

  /**
   * Update latency statistics
   */
  private updateLatencyStats(): void {
    if (this.latencyMeasurements.length === 0) return;

    const sorted = [...this.latencyMeasurements].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    this.stats.averageLatencyMs = sum / sorted.length;
    this.stats.p95LatencyMs = sorted[Math.floor(sorted.length * 0.95)] || 0;
    this.stats.p99LatencyMs = sorted[Math.floor(sorted.length * 0.99)] || 0;
  }

  /**
   * Get statistics
   */
  getStats(): RealtimePredictionStats {
    return { ...this.stats };
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    return total > 0 ? this.stats.cacheHits / total : 0;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    latency: number;
    cacheConnected: boolean;
  }> {
    const startTime = Date.now();

    try {
      // Test cache connection
      await redis.ping();

      return {
        healthy: true,
        latency: Date.now() - startTime,
        cacheConnected: true,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        cacheConnected: false,
      };
    }
  }
}

// ==================== Singleton Instance ====================

let realtimePredictionInstance: RealtimePredictionService | null = null;

export const realtimePredictionService = (() => {
  if (!realtimePredictionInstance) {
    realtimePredictionInstance = new RealtimePredictionService();
  }
  return realtimePredictionInstance;
})();

export const createRealtimePredictionService = (): RealtimePredictionService => {
  return new RealtimePredictionService();
};

export default RealtimePredictionService;
