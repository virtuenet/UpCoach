/**
 * Event Bus Service
 * Redis Pub/Sub based event distribution for real-time features
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { createClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { config } from '../../config/environment';

// ==================== Types ====================

export type EventPriority = 'low' | 'normal' | 'high' | 'critical';

export type EventCategory =
  | 'prediction'
  | 'engagement'
  | 'safety'
  | 'session'
  | 'coaching'
  | 'system'
  | 'ai'
  | 'analytics'
  | 'notification'
  | 'user';

export interface Event<T = unknown> {
  id: string;
  type: string;
  category: EventCategory;
  payload: T;
  metadata: EventMetadata;
  timestamp: Date;
  version: string;
}

export interface EventMetadata {
  source: string;
  correlationId?: string;
  causationId?: string;
  userId?: string;
  tenantId?: string;
  priority: EventPriority;
  ttl?: number; // Time to live in seconds
  retryCount?: number;
  maxRetries?: number;
  tags?: string[];
}

export interface EventHandler<T = unknown> {
  (event: Event<T>): Promise<void> | void;
}

export interface EventSubscription {
  id: string;
  pattern: string;
  handler: EventHandler;
  options: SubscriptionOptions;
  createdAt: Date;
}

export interface SubscriptionOptions {
  priority?: EventPriority;
  category?: EventCategory;
  filter?: (event: Event) => boolean;
  maxConcurrent?: number;
  timeout?: number;
  retryOnError?: boolean;
}

export interface PublishOptions {
  priority?: EventPriority;
  ttl?: number;
  correlationId?: string;
  causationId?: string;
  delay?: number; // Delay in milliseconds
  tags?: string[];
}

export interface EventBusStats {
  totalPublished: number;
  totalConsumed: number;
  activeSubscriptions: number;
  pendingEvents: number;
  errorCount: number;
  averageLatencyMs: number;
  throughputPerSecond: number;
}

export interface DeadLetterEvent {
  event: Event;
  error: string;
  failedAt: Date;
  retryCount: number;
  originalChannel: string;
}

// ==================== Event Bus Implementation ====================

export class EventBus extends EventEmitter {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private channelHandlers: Map<string, Set<string>> = new Map();
  private deadLetterQueue: DeadLetterEvent[] = [];
  private stats: EventBusStats = {
    totalPublished: 0,
    totalConsumed: 0,
    activeSubscriptions: 0,
    pendingEvents: 0,
    errorCount: 0,
    averageLatencyMs: 0,
    throughputPerSecond: 0,
  };
  private latencyMeasurements: number[] = [];
  private lastThroughputCheck = Date.now();
  private messagesInWindow = 0;
  private isConnected = false;
  private reconnecting = false;

  private readonly config = {
    maxDeadLetterQueueSize: 1000,
    defaultTtl: 3600, // 1 hour
    maxRetries: 3,
    retryDelay: 1000,
    latencyWindowSize: 100,
    throughputWindowMs: 1000,
    channelPrefix: 'upcoach:events:',
    deadLetterChannel: 'upcoach:events:dlq',
  };

  constructor() {
    super();
    this.setMaxListeners(100);
    this.initializeRedisClients();
  }

  /**
   * Initialize Redis clients for pub/sub
   */
  private initializeRedisClients(): void {
    const redisUrl = config.redisUrl || 'redis://localhost:6379';

    this.publisher = createClient({ url: redisUrl });
    this.subscriber = createClient({ url: redisUrl });

    // Setup event handlers for both clients
    this.setupClientEvents(this.publisher, 'publisher');
    this.setupClientEvents(this.subscriber, 'subscriber');
  }

  /**
   * Setup Redis client event handlers
   */
  private setupClientEvents(client: RedisClientType, name: string): void {
    client.on('connect', () => {
      logger.info(`EventBus ${name} connected to Redis`);
    });

    client.on('ready', () => {
      logger.info(`EventBus ${name} ready`);
      this.isConnected = true;
      this.reconnecting = false;
      this.emit('connected');
    });

    client.on('error', (err) => {
      logger.error(`EventBus ${name} error:`, err);
      this.stats.errorCount++;
      this.emit('error', err);
    });

    client.on('end', () => {
      logger.info(`EventBus ${name} disconnected`);
      this.isConnected = false;
      this.emit('disconnected');
    });

    client.on('reconnecting', () => {
      if (!this.reconnecting) {
        this.reconnecting = true;
        logger.info(`EventBus ${name} reconnecting...`);
      }
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      await Promise.all([
        this.publisher.connect(),
        this.subscriber.connect(),
      ]);
      logger.info('EventBus connected successfully');
    } catch (error) {
      logger.error('Failed to connect EventBus:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      // Unsubscribe from all channels
      for (const [pattern] of this.channelHandlers) {
        await this.subscriber.pUnsubscribe(pattern);
      }

      await Promise.all([
        this.publisher.quit(),
        this.subscriber.quit(),
      ]);

      this.subscriptions.clear();
      this.channelHandlers.clear();
      this.isConnected = false;

      logger.info('EventBus disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting EventBus:', error);
      throw error;
    }
  }

  /**
   * Publish an event
   */
  async publish<T>(
    type: string,
    category: EventCategory,
    payload: T,
    options: PublishOptions = {}
  ): Promise<string> {
    const startTime = Date.now();

    const event: Event<T> = {
      id: uuidv4(),
      type,
      category,
      payload,
      metadata: {
        source: 'upcoach-api',
        priority: options.priority || 'normal',
        correlationId: options.correlationId,
        causationId: options.causationId,
        ttl: options.ttl || this.config.defaultTtl,
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        tags: options.tags,
      },
      timestamp: new Date(),
      version: '1.0.0',
    };

    try {
      const channel = this.getChannel(type, category);
      const serialized = JSON.stringify(event);

      // Handle delayed events
      if (options.delay && options.delay > 0) {
        setTimeout(async () => {
          await this.publishToChannel(channel, serialized);
        }, options.delay);
      } else {
        await this.publishToChannel(channel, serialized);
      }

      // Update stats
      this.stats.totalPublished++;
      this.messagesInWindow++;
      this.recordLatency(Date.now() - startTime);

      // Emit local event
      this.emit('published', event);
      this.emit(`event:${type}`, event);

      logger.debug('Event published', {
        eventId: event.id,
        type,
        category,
        channel,
      });

      return event.id;
    } catch (error) {
      logger.error('Failed to publish event:', { type, category, error });
      this.stats.errorCount++;
      throw error;
    }
  }

  /**
   * Publish to Redis channel
   */
  private async publishToChannel(channel: string, message: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('EventBus not connected');
    }
    await this.publisher.publish(channel, message);
  }

  /**
   * Subscribe to events
   */
  async subscribe<T = unknown>(
    pattern: string,
    handler: EventHandler<T>,
    options: SubscriptionOptions = {}
  ): Promise<string> {
    const subscriptionId = uuidv4();

    const subscription: EventSubscription = {
      id: subscriptionId,
      pattern,
      handler: handler as EventHandler,
      options,
      createdAt: new Date(),
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Build channel pattern
    const channelPattern = this.buildChannelPattern(pattern, options);

    // Track handlers for this channel
    if (!this.channelHandlers.has(channelPattern)) {
      this.channelHandlers.set(channelPattern, new Set());

      // Subscribe to Redis pattern
      await this.subscriber.pSubscribe(channelPattern, async (message, channel) => {
        await this.handleMessage(message, channel);
      });
    }

    this.channelHandlers.get(channelPattern)!.add(subscriptionId);
    this.stats.activeSubscriptions = this.subscriptions.size;

    logger.info('Subscribed to events', {
      subscriptionId,
      pattern,
      channelPattern,
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribe(subscriptionId: string): Promise<boolean> {
    const subscription = this.subscriptions.get(subscriptionId);

    if (!subscription) {
      return false;
    }

    this.subscriptions.delete(subscriptionId);

    // Find and clean up channel handlers
    for (const [pattern, handlers] of this.channelHandlers) {
      if (handlers.has(subscriptionId)) {
        handlers.delete(subscriptionId);

        // If no more handlers for this pattern, unsubscribe from Redis
        if (handlers.size === 0) {
          await this.subscriber.pUnsubscribe(pattern);
          this.channelHandlers.delete(pattern);
        }
        break;
      }
    }

    this.stats.activeSubscriptions = this.subscriptions.size;

    logger.info('Unsubscribed from events', { subscriptionId });

    return true;
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(message: string, channel: string): Promise<void> {
    const startTime = Date.now();

    try {
      const event: Event = JSON.parse(message);
      event.timestamp = new Date(event.timestamp);

      // Find matching subscriptions
      const matchingSubscriptions = this.findMatchingSubscriptions(event, channel);

      // Process event through each matching handler
      await Promise.all(
        matchingSubscriptions.map(async (subscription) => {
          try {
            await this.executeHandler(subscription, event);
          } catch (error) {
            await this.handleHandlerError(subscription, event, error);
          }
        })
      );

      this.stats.totalConsumed++;
      this.recordLatency(Date.now() - startTime);

      this.emit('consumed', event);
    } catch (error) {
      logger.error('Error handling message:', { channel, error });
      this.stats.errorCount++;
    }
  }

  /**
   * Find subscriptions matching an event
   */
  private findMatchingSubscriptions(event: Event, channel: string): EventSubscription[] {
    const matching: EventSubscription[] = [];

    for (const [pattern, handlers] of this.channelHandlers) {
      if (this.matchPattern(channel, pattern)) {
        for (const subscriptionId of handlers) {
          const subscription = this.subscriptions.get(subscriptionId);
          if (subscription && this.filterEvent(event, subscription.options)) {
            matching.push(subscription);
          }
        }
      }
    }

    return matching;
  }

  /**
   * Match channel against pattern
   */
  private matchPattern(channel: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*/g, '[^:]*')
      .replace(/\?/g, '.');
    return new RegExp(`^${regexPattern}$`).test(channel);
  }

  /**
   * Filter event based on subscription options
   */
  private filterEvent(event: Event, options: SubscriptionOptions): boolean {
    if (options.priority && event.metadata.priority !== options.priority) {
      return false;
    }

    if (options.category && event.category !== options.category) {
      return false;
    }

    if (options.filter && !options.filter(event)) {
      return false;
    }

    return true;
  }

  /**
   * Execute handler with timeout
   */
  private async executeHandler(
    subscription: EventSubscription,
    event: Event
  ): Promise<void> {
    const timeout = subscription.options.timeout || 30000;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Handler timeout')), timeout);
    });

    await Promise.race([
      subscription.handler(event),
      timeoutPromise,
    ]);
  }

  /**
   * Handle handler errors
   */
  private async handleHandlerError(
    subscription: EventSubscription,
    event: Event,
    error: unknown
  ): Promise<void> {
    logger.error('Event handler error:', {
      subscriptionId: subscription.id,
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : String(error),
    });

    this.stats.errorCount++;

    // Retry logic
    if (subscription.options.retryOnError &&
        event.metadata.retryCount! < event.metadata.maxRetries!) {
      event.metadata.retryCount = (event.metadata.retryCount || 0) + 1;

      const delay = this.config.retryDelay * Math.pow(2, event.metadata.retryCount - 1);

      setTimeout(async () => {
        try {
          await subscription.handler(event);
        } catch (retryError) {
          await this.handleHandlerError(subscription, event, retryError);
        }
      }, delay);
    } else {
      // Send to dead letter queue
      await this.sendToDeadLetterQueue(event, error, subscription.pattern);
    }
  }

  /**
   * Send event to dead letter queue
   */
  private async sendToDeadLetterQueue(
    event: Event,
    error: unknown,
    originalChannel: string
  ): Promise<void> {
    const deadLetterEvent: DeadLetterEvent = {
      event,
      error: error instanceof Error ? error.message : String(error),
      failedAt: new Date(),
      retryCount: event.metadata.retryCount || 0,
      originalChannel,
    };

    this.deadLetterQueue.push(deadLetterEvent);

    // Trim queue if too large
    if (this.deadLetterQueue.length > this.config.maxDeadLetterQueueSize) {
      this.deadLetterQueue.shift();
    }

    // Publish to DLQ channel
    try {
      await this.publisher.publish(
        this.config.deadLetterChannel,
        JSON.stringify(deadLetterEvent)
      );
    } catch (err) {
      logger.error('Failed to publish to DLQ:', err);
    }

    this.emit('deadLetter', deadLetterEvent);
  }

  /**
   * Get channel name for event
   */
  private getChannel(type: string, category: EventCategory): string {
    return `${this.config.channelPrefix}${category}:${type}`;
  }

  /**
   * Build channel pattern for subscription
   */
  private buildChannelPattern(pattern: string, options: SubscriptionOptions): string {
    let channelPattern = `${this.config.channelPrefix}`;

    if (options.category) {
      channelPattern += `${options.category}:`;
    } else {
      channelPattern += '*:';
    }

    channelPattern += pattern;

    return channelPattern;
  }

  /**
   * Record latency measurement
   */
  private recordLatency(latencyMs: number): void {
    this.latencyMeasurements.push(latencyMs);

    if (this.latencyMeasurements.length > this.config.latencyWindowSize) {
      this.latencyMeasurements.shift();
    }

    // Update average latency
    const sum = this.latencyMeasurements.reduce((a, b) => a + b, 0);
    this.stats.averageLatencyMs = sum / this.latencyMeasurements.length;

    // Update throughput
    const now = Date.now();
    if (now - this.lastThroughputCheck >= this.config.throughputWindowMs) {
      this.stats.throughputPerSecond =
        (this.messagesInWindow * 1000) / (now - this.lastThroughputCheck);
      this.messagesInWindow = 0;
      this.lastThroughputCheck = now;
    }
  }

  /**
   * Get statistics
   */
  getStats(): EventBusStats {
    return { ...this.stats };
  }

  /**
   * Get dead letter queue
   */
  getDeadLetterQueue(): DeadLetterEvent[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Retry dead letter event
   */
  async retryDeadLetterEvent(index: number): Promise<boolean> {
    const deadLetterEvent = this.deadLetterQueue[index];

    if (!deadLetterEvent) {
      return false;
    }

    try {
      // Reset retry count
      deadLetterEvent.event.metadata.retryCount = 0;

      // Republish event
      await this.publishToChannel(
        deadLetterEvent.originalChannel,
        JSON.stringify(deadLetterEvent.event)
      );

      // Remove from DLQ
      this.deadLetterQueue.splice(index, 1);

      return true;
    } catch (error) {
      logger.error('Failed to retry dead letter event:', error);
      return false;
    }
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
  }

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Get active subscriptions
   */
  getSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values());
  }
}

// ==================== Singleton Instance ====================

let eventBusInstance: EventBus | null = null;

export const eventBus = (() => {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus();
  }
  return eventBusInstance;
})();

export const createEventBus = (): EventBus => {
  return new EventBus();
};

export default EventBus;
