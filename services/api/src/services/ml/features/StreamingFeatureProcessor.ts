/**
 * Streaming Feature Processor
 * Real-time feature computation and streaming for live inference
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import { FeatureStore, FeatureValue, FeatureVector } from '../FeatureStore';
import { FeatureEngineeringPipeline } from './FeatureEngineeringPipeline';

// ==================== Type Definitions ====================

export interface StreamingConfig {
  windowSizeMs: number;
  slideIntervalMs: number;
  maxBufferSize: number;
  flushIntervalMs: number;
  enableAggregations: boolean;
  aggregationTypes: AggregationType[];
}

export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'stddev' | 'percentile';

export interface StreamEvent {
  eventId: string;
  entityId: string;
  entityType: 'user' | 'coach' | 'session' | 'goal';
  eventType: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

export interface AggregatedFeature {
  name: string;
  value: number;
  windowStart: Date;
  windowEnd: Date;
  eventCount: number;
}

export interface FeatureWindow {
  entityId: string;
  windowStart: Date;
  windowEnd: Date;
  events: StreamEvent[];
  aggregations: Map<string, AggregatedFeature>;
}

export interface StreamingStats {
  eventsProcessed: number;
  eventsDropped: number;
  windowsCreated: number;
  aggregationsComputed: number;
  avgProcessingTimeMs: number;
  bufferUtilization: number;
}

export interface FeatureStreamSubscription {
  id: string;
  entityId: string;
  features: string[];
  callback: (vector: FeatureVector) => void;
  filters?: StreamEventFilter;
}

export interface StreamEventFilter {
  eventTypes?: string[];
  minTimestamp?: Date;
  maxTimestamp?: Date;
}

// ==================== Streaming Feature Processor ====================

export class StreamingFeatureProcessor extends EventEmitter {
  private config: StreamingConfig;
  private featureStore: FeatureStore;
  private pipeline: FeatureEngineeringPipeline;
  private eventBuffer: Map<string, StreamEvent[]> = new Map();
  private windows: Map<string, FeatureWindow> = new Map();
  private subscriptions: Map<string, FeatureStreamSubscription> = new Map();
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private stats: StreamingStats;
  private isRunning: boolean = false;

  constructor(
    featureStore: FeatureStore,
    pipeline: FeatureEngineeringPipeline,
    config?: Partial<StreamingConfig>
  ) {
    super();
    this.featureStore = featureStore;
    this.pipeline = pipeline;
    this.config = {
      windowSizeMs: 60000, // 1 minute windows
      slideIntervalMs: 10000, // Slide every 10 seconds
      maxBufferSize: 10000,
      flushIntervalMs: 5000,
      enableAggregations: true,
      aggregationTypes: ['count', 'sum', 'avg', 'min', 'max'],
      ...config,
    };
    this.stats = {
      eventsProcessed: 0,
      eventsDropped: 0,
      windowsCreated: 0,
      aggregationsComputed: 0,
      avgProcessingTimeMs: 0,
      bufferUtilization: 0,
    };
  }

  /**
   * Start the streaming processor
   */
  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.flushTimer = setInterval(
      () => this.flushWindows(),
      this.config.flushIntervalMs
    );

    logger.info('Streaming feature processor started');
    this.emit('processor:started');
  }

  /**
   * Stop the streaming processor
   */
  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush
    this.flushWindows();

    logger.info('Streaming feature processor stopped');
    this.emit('processor:stopped');
  }

  /**
   * Process a streaming event
   */
  public async processEvent(event: StreamEvent): Promise<void> {
    const startTime = Date.now();

    try {
      // Check buffer capacity
      const totalBufferSize = this.getTotalBufferSize();
      if (totalBufferSize >= this.config.maxBufferSize) {
        this.stats.eventsDropped++;
        this.emit('event:dropped', { eventId: event.eventId, reason: 'buffer_full' });
        return;
      }

      // Add to buffer
      if (!this.eventBuffer.has(event.entityId)) {
        this.eventBuffer.set(event.entityId, []);
      }
      this.eventBuffer.get(event.entityId)!.push(event);

      // Update or create window
      this.updateWindow(event);

      // Process real-time feature updates
      await this.processRealTimeFeatures(event);

      // Notify subscribers
      await this.notifySubscribers(event.entityId);

      this.stats.eventsProcessed++;
      this.updateProcessingTime(Date.now() - startTime);

      this.emit('event:processed', {
        eventId: event.eventId,
        entityId: event.entityId,
        latencyMs: Date.now() - startTime,
      });
    } catch (error) {
      logger.error('Failed to process streaming event', { error, eventId: event.eventId });
      this.emit('event:error', { eventId: event.eventId, error });
    }
  }

  /**
   * Process batch of events
   */
  public async processBatch(events: StreamEvent[]): Promise<void> {
    for (const event of events) {
      await this.processEvent(event);
    }
  }

  /**
   * Update the sliding window for an entity
   */
  private updateWindow(event: StreamEvent): void {
    const windowKey = this.getWindowKey(event.entityId);
    let window = this.windows.get(windowKey);

    const now = new Date();
    const windowStart = new Date(now.getTime() - this.config.windowSizeMs);

    if (!window) {
      window = {
        entityId: event.entityId,
        windowStart,
        windowEnd: now,
        events: [],
        aggregations: new Map(),
      };
      this.windows.set(windowKey, window);
      this.stats.windowsCreated++;
    }

    // Add event to window
    window.events.push(event);
    window.windowEnd = now;

    // Remove old events outside the window
    window.events = window.events.filter(
      (e) => e.timestamp >= windowStart
    );

    // Update aggregations
    if (this.config.enableAggregations) {
      this.updateAggregations(window);
    }
  }

  /**
   * Update window aggregations
   */
  private updateAggregations(window: FeatureWindow): void {
    const eventsByType = new Map<string, StreamEvent[]>();

    for (const event of window.events) {
      if (!eventsByType.has(event.eventType)) {
        eventsByType.set(event.eventType, []);
      }
      eventsByType.get(event.eventType)!.push(event);
    }

    for (const [eventType, events] of eventsByType) {
      for (const aggType of this.config.aggregationTypes) {
        const aggKey = `${eventType}_${aggType}`;
        const value = this.computeAggregation(events, aggType);

        window.aggregations.set(aggKey, {
          name: aggKey,
          value,
          windowStart: window.windowStart,
          windowEnd: window.windowEnd,
          eventCount: events.length,
        });

        this.stats.aggregationsComputed++;
      }
    }
  }

  /**
   * Compute aggregation value
   */
  private computeAggregation(events: StreamEvent[], aggType: AggregationType): number {
    if (events.length === 0) return 0;

    const values = events
      .map((e) => e.data.value as number)
      .filter((v) => typeof v === 'number');

    if (values.length === 0) {
      // Fall back to event count for non-numeric data
      return aggType === 'count' ? events.length : 0;
    }

    switch (aggType) {
      case 'count':
        return events.length;
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'stddev':
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
      case 'percentile':
        const sorted = [...values].sort((a, b) => a - b);
        const p95Index = Math.floor(sorted.length * 0.95);
        return sorted[p95Index] || 0;
      default:
        return 0;
    }
  }

  /**
   * Process real-time feature updates
   */
  private async processRealTimeFeatures(event: StreamEvent): Promise<void> {
    // Map event types to feature updates
    const featureUpdates: Record<string, unknown> = {};

    switch (event.eventType) {
      case 'session_start':
        featureUpdates.user_session_count_7d = await this.incrementCounter(
          event.entityId,
          'session_count',
          1,
          7 * 24 * 60 * 60 * 1000
        );
        break;

      case 'ai_chat':
        featureUpdates.user_ai_chat_count_7d = await this.incrementCounter(
          event.entityId,
          'ai_chat_count',
          1,
          7 * 24 * 60 * 60 * 1000
        );
        break;

      case 'goal_update':
        const progress = event.data.progress as number;
        if (progress !== undefined) {
          featureUpdates.goal_progress_velocity = this.calculateVelocity(
            event.entityId,
            progress
          );
        }
        break;

      case 'habit_completed':
        featureUpdates.user_habit_completion_rate_7d = await this.updateRollingRate(
          event.entityId,
          'habit_completions',
          1,
          7 * 24 * 60 * 60 * 1000
        );
        break;

      case 'login':
        featureUpdates.user_login_frequency_7d = await this.incrementCounter(
          event.entityId,
          'login_count',
          1,
          7 * 24 * 60 * 60 * 1000
        );
        featureUpdates.user_days_since_last_session = 0;
        break;

      case 'ai_rating':
        const rating = event.data.rating as number;
        if (rating !== undefined) {
          featureUpdates.user_ai_satisfaction_score = await this.updateRollingAverage(
            event.entityId,
            'ai_ratings',
            rating
          );
        }
        break;

      case 'notification_click':
        featureUpdates.user_notification_response_rate = await this.updateRollingRate(
          event.entityId,
          'notification_clicks',
          1,
          7 * 24 * 60 * 60 * 1000
        );
        break;
    }

    // Store updated features
    if (Object.keys(featureUpdates).length > 0) {
      await this.featureStore.setFeatureValues(
        event.entityId,
        featureUpdates
      );
    }
  }

  /**
   * Increment a counter with time decay
   */
  private async incrementCounter(
    entityId: string,
    counterKey: string,
    increment: number,
    windowMs: number
  ): Promise<number> {
    const key = `${entityId}:${counterKey}`;
    const buffer = this.eventBuffer.get(entityId) || [];

    const windowStart = Date.now() - windowMs;
    const recentEvents = buffer.filter(
      (e) => e.timestamp.getTime() >= windowStart
    );

    return recentEvents.length + increment;
  }

  /**
   * Update rolling average
   */
  private async updateRollingAverage(
    entityId: string,
    metricKey: string,
    newValue: number,
    maxSamples: number = 100
  ): Promise<number> {
    const key = `${entityId}:${metricKey}`;
    const window = this.windows.get(this.getWindowKey(entityId));

    if (!window) return newValue;

    const values = window.events
      .filter((e) => e.data[metricKey] !== undefined)
      .map((e) => e.data[metricKey] as number)
      .slice(-maxSamples);

    values.push(newValue);
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Update rolling rate (successes / attempts)
   */
  private async updateRollingRate(
    entityId: string,
    successKey: string,
    success: number,
    windowMs: number
  ): Promise<number> {
    const buffer = this.eventBuffer.get(entityId) || [];
    const windowStart = Date.now() - windowMs;

    const windowEvents = buffer.filter(
      (e) => e.timestamp.getTime() >= windowStart
    );

    const successes = windowEvents.filter((e) => e.data[successKey]).length + success;
    const attempts = windowEvents.length + 1;

    return attempts > 0 ? successes / attempts : 0;
  }

  /**
   * Calculate velocity
   */
  private calculateVelocity(entityId: string, currentProgress: number): number {
    const window = this.windows.get(this.getWindowKey(entityId));
    if (!window || window.events.length < 2) return 0;

    const progressEvents = window.events
      .filter((e) => e.data.progress !== undefined)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (progressEvents.length < 2) return 0;

    const first = progressEvents[0];
    const last = progressEvents[progressEvents.length - 1];

    const progressDelta = currentProgress - (first.data.progress as number);
    const timeDeltaHours =
      (last.timestamp.getTime() - first.timestamp.getTime()) / (1000 * 60 * 60);

    return timeDeltaHours > 0 ? progressDelta / timeDeltaHours : 0;
  }

  /**
   * Subscribe to feature updates for an entity
   */
  public subscribe(subscription: Omit<FeatureStreamSubscription, 'id'>): string {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.subscriptions.set(id, { ...subscription, id });
    logger.info(`New subscription: ${id} for entity ${subscription.entityId}`);
    return id;
  }

  /**
   * Unsubscribe from feature updates
   */
  public unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
    logger.info(`Unsubscribed: ${subscriptionId}`);
  }

  /**
   * Notify subscribers of feature updates
   */
  private async notifySubscribers(entityId: string): Promise<void> {
    for (const sub of this.subscriptions.values()) {
      if (sub.entityId === entityId) {
        try {
          const vector = await this.featureStore.getFeatures(entityId, sub.features);
          sub.callback(vector);
        } catch (error) {
          logger.error(`Failed to notify subscriber ${sub.id}`, { error });
        }
      }
    }
  }

  /**
   * Flush windows and persist aggregations
   */
  private async flushWindows(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.config.windowSizeMs;

    for (const [key, window] of this.windows) {
      // Persist aggregations to feature store
      const aggregatedFeatures: Record<string, unknown> = {};
      for (const [name, agg] of window.aggregations) {
        aggregatedFeatures[`streaming_${name}`] = agg.value;
      }

      if (Object.keys(aggregatedFeatures).length > 0) {
        await this.featureStore.setFeatureValues(
          window.entityId,
          aggregatedFeatures
        );
      }

      // Remove old events
      window.events = window.events.filter(
        (e) => e.timestamp.getTime() >= windowStart
      );

      // Clean up empty windows
      if (window.events.length === 0) {
        this.windows.delete(key);
      }
    }

    // Clean up old buffers
    for (const [entityId, events] of this.eventBuffer) {
      const recentEvents = events.filter(
        (e) => e.timestamp.getTime() >= windowStart
      );
      if (recentEvents.length === 0) {
        this.eventBuffer.delete(entityId);
      } else {
        this.eventBuffer.set(entityId, recentEvents);
      }
    }

    this.updateBufferUtilization();
    this.emit('windows:flushed', { windowCount: this.windows.size });
  }

  /**
   * Get window key for entity
   */
  private getWindowKey(entityId: string): string {
    return `window:${entityId}`;
  }

  /**
   * Get total buffer size
   */
  private getTotalBufferSize(): number {
    let total = 0;
    for (const events of this.eventBuffer.values()) {
      total += events.length;
    }
    return total;
  }

  /**
   * Update processing time stats
   */
  private updateProcessingTime(latencyMs: number): void {
    const n = this.stats.eventsProcessed;
    this.stats.avgProcessingTimeMs =
      ((n - 1) * this.stats.avgProcessingTimeMs + latencyMs) / n;
  }

  /**
   * Update buffer utilization stats
   */
  private updateBufferUtilization(): void {
    this.stats.bufferUtilization =
      this.getTotalBufferSize() / this.config.maxBufferSize;
  }

  /**
   * Get current window for entity
   */
  public getWindow(entityId: string): FeatureWindow | null {
    return this.windows.get(this.getWindowKey(entityId)) || null;
  }

  /**
   * Get all aggregations for entity
   */
  public getAggregations(entityId: string): AggregatedFeature[] {
    const window = this.getWindow(entityId);
    if (!window) return [];
    return Array.from(window.aggregations.values());
  }

  /**
   * Get processor statistics
   */
  public getStats(): StreamingStats {
    this.updateBufferUtilization();
    return { ...this.stats };
  }

  /**
   * Check if processor is running
   */
  public isActive(): boolean {
    return this.isRunning;
  }
}

// Export factory function
export const createStreamingFeatureProcessor = (
  featureStore: FeatureStore,
  pipeline: FeatureEngineeringPipeline,
  config?: Partial<StreamingConfig>
): StreamingFeatureProcessor => {
  return new StreamingFeatureProcessor(featureStore, pipeline, config);
};
