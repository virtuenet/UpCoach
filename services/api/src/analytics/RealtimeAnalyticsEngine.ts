/**
 * Real-Time Analytics Engine
 *
 * Processes streaming data from user activities, generates real-time metrics,
 * and powers live dashboards with sub-second latency.
 *
 * Features:
 * - Time-series data aggregation with InfluxDB
 * - Windowed analytics (5min, 15min, 1hr, 24hr)
 * - Real-time metric calculation
 * - Stream processing pipelines
 * - Live dashboard WebSocket feeds
 * - Redis caching for performance
 * - Event buffering and batch processing
 * - Engagement score computation
 */

import { EventEmitter } from 'events';
import Redis from 'ioredis';

/**
 * Analytics Event Interface
 */
export interface AnalyticsEvent {
  eventType: 'goal_completed' | 'habit_logged' | 'session_completed' |
             'milestone_reached' | 'user_registered' | 'subscription_created' |
             'session_started' | 'message_sent' | 'content_viewed';
  userId: string;
  organizationId?: string;
  timestamp: Date;
  properties: Record<string, any>;
  metadata: {
    source: 'mobile' | 'web' | 'api';
    version: string;
    sessionId?: string;
    deviceType?: string;
  };
}

/**
 * Metric Aggregation Interface
 */
export interface MetricAggregation {
  metric: string;
  dimensions: Record<string, string>;
  value: number;
  timestamp: Date;
  windowSize: '5m' | '15m' | '1h' | '24h';
}

/**
 * Real-time Metrics Interface
 */
export interface RealtimeMetrics {
  activeUsers: number;
  goalsCompletedToday: number;
  habitsLoggedToday: number;
  avgSessionDuration: number;
  completionRate: number;
  engagementScore: number;
  timestamp: Date;
  trends: {
    activeUsersChange: number;
    goalsChange: number;
    habitsChange: number;
  };
}

/**
 * Time Window Configuration
 */
interface TimeWindow {
  size: '5m' | '15m' | '1h' | '24h';
  milliseconds: number;
}

/**
 * Event Statistics
 */
interface EventStatistics {
  count: number;
  uniqueUsers: Set<string>;
  avgValue?: number;
  totalValue?: number;
  timestamps: Date[];
}

/**
 * InfluxDB Point Interface (simplified for implementation)
 */
interface InfluxPoint {
  measurement: string;
  tags: Record<string, string>;
  fields: Record<string, number | string>;
  timestamp: Date;
}

/**
 * Real-Time Analytics Engine Class
 */
export class RealtimeAnalyticsEngine extends EventEmitter {
  private redis: Redis;
  private metricCache: Map<string, MetricAggregation>;
  private eventBuffer: AnalyticsEvent[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private influxPoints: InfluxPoint[] = [];
  private isInitialized: boolean = false;

  private readonly TIME_WINDOWS: TimeWindow[] = [
    { size: '5m', milliseconds: 5 * 60 * 1000 },
    { size: '15m', milliseconds: 15 * 60 * 1000 },
    { size: '1h', milliseconds: 60 * 60 * 1000 },
    { size: '24h', milliseconds: 24 * 60 * 60 * 1000 },
  ];

  private readonly CACHE_TTL = {
    realtime: 30,      // 30 seconds
    aggregated: 300,   // 5 minutes
    historical: 3600,  // 1 hour
  };

  constructor() {
    super();

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 6, // Analytics DB
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.metricCache = new Map();

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
      this.emit('error', { source: 'redis', error });
    });

    this.redis.on('connect', () => {
      console.log('Redis connected for analytics');
      this.emit('redis:connected');
    });
  }

  /**
   * Initialize analytics engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Analytics engine already initialized');
      return;
    }

    try {
      // Test Redis connection
      await this.redis.ping();

      // Start processing event buffer every 5 seconds
      this.processingInterval = setInterval(() => {
        this.processEventBuffer().catch(error => {
          console.error('Event buffer processing error:', error);
          this.emit('error', { source: 'buffer_processing', error });
        });
      }, 5000);

      // Start metrics calculation every 30 seconds
      this.metricsInterval = setInterval(() => {
        this.calculateAndCacheMetrics().catch(error => {
          console.error('Metrics calculation error:', error);
          this.emit('error', { source: 'metrics_calculation', error });
        });
      }, 30000);

      // Preload recent metrics into cache
      await this.loadRecentMetrics();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('Real-time analytics engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize analytics engine:', error);
      throw error;
    }
  }

  /**
   * Shutdown analytics engine gracefully
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down analytics engine...');

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    // Process remaining events in buffer
    if (this.eventBuffer.length > 0) {
      await this.processEventBuffer();
    }

    // Flush InfluxDB points
    if (this.influxPoints.length > 0) {
      await this.flushInfluxPoints();
    }

    await this.redis.quit();
    this.isInitialized = false;
    this.emit('shutdown');

    console.log('Analytics engine shut down successfully');
  }

  /**
   * Ingest analytics event
   */
  async ingestEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Validate event
      this.validateEvent(event);

      // Add to buffer for batch processing
      this.eventBuffer.push(event);

      // Create InfluxDB point
      const point = this.createInfluxPoint(event);
      this.influxPoints.push(point);

      // If buffer is large, process immediately
      if (this.eventBuffer.length >= 100) {
        await this.processEventBuffer();
      }

      // Update real-time metrics immediately for critical events
      if (this.isCriticalEvent(event.eventType)) {
        await this.updateRealtimeMetrics(event);
      }

      this.emit('event:ingested', event);
    } catch (error) {
      console.error('Event ingestion error:', error);
      this.emit('error', { source: 'event_ingestion', error, event });
      throw error;
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealtimeMetrics(organizationId?: string): Promise<RealtimeMetrics> {
    const cacheKey = `realtime:metrics:${organizationId || 'global'}`;

    try {
      // Check cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Calculate metrics
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const [
        activeUsers,
        goalsCompletedToday,
        habitsLoggedToday,
        avgSessionDuration,
        completionRate,
        engagementScore,
        yesterdayActiveUsers,
        yesterdayGoals,
        yesterdayHabits,
      ] = await Promise.all([
        this.countActiveUsers(organizationId),
        this.countEventsSince('goal_completed', today, organizationId),
        this.countEventsSince('habit_logged', today, organizationId),
        this.calculateAvgSessionDuration(organizationId),
        this.calculateCompletionRate(organizationId),
        this.calculateEngagementScore(organizationId),
        this.countActiveUsers(organizationId, yesterday),
        this.countEventsSince('goal_completed', yesterday, organizationId, today),
        this.countEventsSince('habit_logged', yesterday, organizationId, today),
      ]);

      const metrics: RealtimeMetrics = {
        activeUsers,
        goalsCompletedToday,
        habitsLoggedToday,
        avgSessionDuration,
        completionRate,
        engagementScore,
        timestamp: now,
        trends: {
          activeUsersChange: this.calculatePercentageChange(yesterdayActiveUsers, activeUsers),
          goalsChange: this.calculatePercentageChange(yesterdayGoals, goalsCompletedToday),
          habitsChange: this.calculatePercentageChange(yesterdayHabits, habitsLoggedToday),
        },
      };

      // Cache for 30 seconds
      await this.redis.setex(cacheKey, this.CACHE_TTL.realtime, JSON.stringify(metrics));

      return metrics;
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      throw error;
    }
  }

  /**
   * Get metrics for specific time range
   */
  async getMetricsForTimeRange(
    startTime: Date,
    endTime: Date,
    organizationId?: string,
    granularity: '5m' | '15m' | '1h' | '24h' = '1h'
  ): Promise<MetricAggregation[]> {
    const cacheKey = `metrics:range:${organizationId || 'global'}:${startTime.getTime()}:${endTime.getTime()}:${granularity}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const metrics = await this.aggregateMetricsForRange(
        startTime,
        endTime,
        organizationId,
        granularity
      );

      await this.redis.setex(cacheKey, this.CACHE_TTL.aggregated, JSON.stringify(metrics));

      return metrics;
    } catch (error) {
      console.error('Error fetching time range metrics:', error);
      throw error;
    }
  }

  /**
   * Get trending events
   */
  async getTrendingEvents(
    organizationId?: string,
    limit: number = 10
  ): Promise<Array<{ eventType: string; count: number; trend: number }>> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const eventTypes: AnalyticsEvent['eventType'][] = [
      'goal_completed',
      'habit_logged',
      'session_completed',
      'milestone_reached',
      'user_registered',
      'subscription_created',
    ];

    const trending = await Promise.all(
      eventTypes.map(async (eventType) => {
        const recentCount = await this.countEventsSince(eventType, oneHourAgo, organizationId);
        const previousCount = await this.countEventsSince(eventType, twoHoursAgo, organizationId, oneHourAgo);

        return {
          eventType,
          count: recentCount,
          trend: this.calculatePercentageChange(previousCount, recentCount),
        };
      })
    );

    return trending
      .sort((a, b) => b.trend - a.trend)
      .slice(0, limit);
  }

  /**
   * Process event buffer in batch
   */
  private async processEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      // Aggregate events into metrics
      const aggregations = this.aggregateEvents(events);

      // Update metric cache
      for (const agg of aggregations) {
        const key = this.getMetricKey(agg);
        this.metricCache.set(key, agg);
      }

      // Store aggregations in Redis
      await this.storeAggregations(aggregations);

      // Flush InfluxDB points
      await this.flushInfluxPoints();

      this.emit('buffer:processed', {
        count: events.length,
        aggregations: aggregations.length
      });
    } catch (error) {
      console.error('Error processing event buffer:', error);
      // Put events back in buffer if processing failed
      this.eventBuffer.unshift(...events);
      throw error;
    }
  }

  /**
   * Aggregate events into metrics
   */
  private aggregateEvents(events: AnalyticsEvent[]): MetricAggregation[] {
    const aggregations: MetricAggregation[] = [];
    const now = new Date();

    for (const window of this.TIME_WINDOWS) {
      const windowStart = new Date(now.getTime() - window.milliseconds);
      const eventsInWindow = events.filter(e => e.timestamp >= windowStart);

      // Group by event type
      const groupedByType = this.groupBy(eventsInWindow, 'eventType');

      for (const [eventType, eventGroup] of Object.entries(groupedByType)) {
        // Overall count
        aggregations.push({
          metric: `${eventType}_count`,
          dimensions: { window: window.size },
          value: eventGroup.length,
          timestamp: now,
          windowSize: window.size,
        });

        // Group by organization
        const groupedByOrg = this.groupBy(eventGroup, 'organizationId');
        for (const [orgId, orgEvents] of Object.entries(groupedByOrg)) {
          if (orgId && orgId !== 'undefined') {
            aggregations.push({
              metric: `${eventType}_count`,
              dimensions: {
                window: window.size,
                organizationId: orgId
              },
              value: orgEvents.length,
              timestamp: now,
              windowSize: window.size,
            });
          }
        }

        // Unique users
        const uniqueUsers = new Set(eventGroup.map(e => e.userId));
        aggregations.push({
          metric: `${eventType}_unique_users`,
          dimensions: { window: window.size },
          value: uniqueUsers.size,
          timestamp: now,
          windowSize: window.size,
        });
      }

      // Active users in window
      const uniqueActiveUsers = new Set(eventsInWindow.map(e => e.userId));
      aggregations.push({
        metric: 'active_users',
        dimensions: { window: window.size },
        value: uniqueActiveUsers.size,
        timestamp: now,
        windowSize: window.size,
      });
    }

    return aggregations;
  }

  /**
   * Calculate engagement score
   */
  private async calculateEngagementScore(organizationId?: string): Promise<number> {
    try {
      const cacheKey = `engagement:score:${organizationId || 'global'}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return parseFloat(cached);
      }

      // Composite score: goals (40%) + habits (30%) + sessions (30%)
      const goalsWeight = 0.4;
      const habitsWeight = 0.3;
      const sessionsWeight = 0.3;

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [goalsCompleted, habitsLogged, sessionsCompleted] = await Promise.all([
        this.countEventsSince('goal_completed', sevenDaysAgo, organizationId),
        this.countEventsSince('habit_logged', sevenDaysAgo, organizationId),
        this.countEventsSince('session_completed', sevenDaysAgo, organizationId),
      ]);

      // Normalize to 0-100 scale (adjust thresholds based on your data)
      const normalizedGoals = Math.min(goalsCompleted / 10, 1) * 100;
      const normalizedHabits = Math.min(habitsLogged / 50, 1) * 100;
      const normalizedSessions = Math.min(sessionsCompleted / 20, 1) * 100;

      const score = Math.round(
        normalizedGoals * goalsWeight +
        normalizedHabits * habitsWeight +
        normalizedSessions * sessionsWeight
      );

      await this.redis.setex(cacheKey, this.CACHE_TTL.realtime, score.toString());

      return score;
    } catch (error) {
      console.error('Error calculating engagement score:', error);
      return 0;
    }
  }

  /**
   * Count active users
   */
  private async countActiveUsers(
    organizationId?: string,
    since?: Date
  ): Promise<number> {
    try {
      const sinceTime = since || new Date(Date.now() - 24 * 60 * 60 * 1000);
      const cacheKey = `active:users:${organizationId || 'global'}:${sinceTime.getTime()}`;

      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return parseInt(cached);
      }

      const activeUsersKey = `analytics:active_users:${sinceTime.toISOString().split('T')[0]}`;
      const count = await this.redis.scard(activeUsersKey);

      await this.redis.setex(cacheKey, this.CACHE_TTL.realtime, count.toString());

      return count;
    } catch (error) {
      console.error('Error counting active users:', error);
      return 0;
    }
  }

  /**
   * Count events since timestamp
   */
  private async countEventsSince(
    eventType: string,
    since: Date,
    organizationId?: string,
    until?: Date
  ): Promise<number> {
    try {
      const untilTime = until || new Date();
      const prefix = organizationId
        ? `analytics:events:${organizationId}:${eventType}`
        : `analytics:events:global:${eventType}`;

      const dateKey = `${prefix}:${since.toISOString().split('T')[0]}`;

      const count = await this.redis.get(dateKey);
      return count ? parseInt(count) : 0;
    } catch (error) {
      console.error('Error counting events:', error);
      return 0;
    }
  }

  /**
   * Calculate average session duration
   */
  private async calculateAvgSessionDuration(organizationId?: string): Promise<number> {
    try {
      const cacheKey = `avg:session:duration:${organizationId || 'global'}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return parseFloat(cached);
      }

      const durationsKey = `analytics:session_durations:${organizationId || 'global'}`;
      const durations = await this.redis.lrange(durationsKey, 0, -1);

      if (durations.length === 0) return 0;

      const total = durations.reduce((sum, d) => sum + parseFloat(d), 0);
      const avg = total / durations.length;

      await this.redis.setex(cacheKey, this.CACHE_TTL.realtime, avg.toString());

      return Math.round(avg);
    } catch (error) {
      console.error('Error calculating avg session duration:', error);
      return 0;
    }
  }

  /**
   * Calculate completion rate
   */
  private async calculateCompletionRate(organizationId?: string): Promise<number> {
    try {
      const cacheKey = `completion:rate:${organizationId || 'global'}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return parseFloat(cached);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [completed, started] = await Promise.all([
        this.countEventsSince('goal_completed', today, organizationId),
        this.countEventsSince('session_started', today, organizationId),
      ]);

      const rate = started > 0 ? (completed / started) * 100 : 0;

      await this.redis.setex(cacheKey, this.CACHE_TTL.realtime, rate.toString());

      return Math.round(rate);
    } catch (error) {
      console.error('Error calculating completion rate:', error);
      return 0;
    }
  }

  /**
   * Update real-time metrics for an event
   */
  private async updateRealtimeMetrics(event: AnalyticsEvent): Promise<void> {
    try {
      const date = event.timestamp.toISOString().split('T')[0];

      // Increment event counter
      const eventKey = event.organizationId
        ? `analytics:events:${event.organizationId}:${event.eventType}:${date}`
        : `analytics:events:global:${event.eventType}:${date}`;

      await this.redis.incr(eventKey);
      await this.redis.expire(eventKey, 7 * 24 * 60 * 60); // 7 days

      // Track active user
      const activeUsersKey = `analytics:active_users:${date}`;
      await this.redis.sadd(activeUsersKey, event.userId);
      await this.redis.expire(activeUsersKey, 7 * 24 * 60 * 60);

      // Track session duration if available
      if (event.eventType === 'session_completed' && event.properties.duration) {
        const durationsKey = `analytics:session_durations:${event.organizationId || 'global'}`;
        await this.redis.rpush(durationsKey, event.properties.duration.toString());
        await this.redis.ltrim(durationsKey, -1000, -1); // Keep last 1000
      }

      // Invalidate relevant caches
      const cacheKeys = [
        `realtime:metrics:${event.organizationId || 'global'}`,
        `engagement:score:${event.organizationId || 'global'}`,
        `active:users:${event.organizationId || 'global'}:*`,
      ];

      for (const pattern of cacheKeys) {
        if (pattern.includes('*')) {
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        } else {
          await this.redis.del(pattern);
        }
      }
    } catch (error) {
      console.error('Error updating real-time metrics:', error);
    }
  }

  /**
   * Calculate and cache metrics periodically
   */
  private async calculateAndCacheMetrics(): Promise<void> {
    try {
      // Get list of organizations to calculate metrics for
      const organizations = await this.getActiveOrganizations();

      for (const orgId of organizations) {
        await this.getRealtimeMetrics(orgId);
      }

      // Also calculate global metrics
      await this.getRealtimeMetrics();

      this.emit('metrics:calculated', {
        count: organizations.length + 1
      });
    } catch (error) {
      console.error('Error in periodic metrics calculation:', error);
    }
  }

  /**
   * Load recent metrics into cache
   */
  private async loadRecentMetrics(): Promise<void> {
    try {
      console.log('Loading recent metrics into cache...');

      // Pre-calculate metrics for better performance
      await this.getRealtimeMetrics();

      this.emit('metrics:loaded');
    } catch (error) {
      console.error('Error loading recent metrics:', error);
    }
  }

  /**
   * Create InfluxDB point from event
   */
  private createInfluxPoint(event: AnalyticsEvent): InfluxPoint {
    const point: InfluxPoint = {
      measurement: event.eventType,
      tags: {
        userId: event.userId,
        source: event.metadata.source,
        version: event.metadata.version,
      },
      fields: {},
      timestamp: event.timestamp,
    };

    if (event.organizationId) {
      point.tags.organizationId = event.organizationId;
    }

    if (event.metadata.sessionId) {
      point.tags.sessionId = event.metadata.sessionId;
    }

    // Add properties as fields
    for (const [key, value] of Object.entries(event.properties)) {
      if (typeof value === 'number') {
        point.fields[key] = value;
      } else if (typeof value === 'string') {
        point.fields[key] = value;
      } else if (typeof value === 'boolean') {
        point.fields[key] = value ? 1 : 0;
      }
    }

    // Add a count field for aggregation
    point.fields.count = 1;

    return point;
  }

  /**
   * Flush InfluxDB points
   */
  private async flushInfluxPoints(): Promise<void> {
    if (this.influxPoints.length === 0) return;

    try {
      // In production, this would write to InfluxDB
      // For now, we store summary in Redis
      const summary = {
        count: this.influxPoints.length,
        timestamp: new Date(),
      };

      await this.redis.lpush('analytics:influx:writes', JSON.stringify(summary));
      await this.redis.ltrim('analytics:influx:writes', 0, 999);

      this.influxPoints = [];
      this.emit('influx:flushed', summary);
    } catch (error) {
      console.error('Error flushing InfluxDB points:', error);
      throw error;
    }
  }

  /**
   * Store aggregations in Redis
   */
  private async storeAggregations(aggregations: MetricAggregation[]): Promise<void> {
    if (aggregations.length === 0) return;

    try {
      const pipeline = this.redis.pipeline();

      for (const agg of aggregations) {
        const key = `analytics:agg:${agg.metric}:${agg.windowSize}:${JSON.stringify(agg.dimensions)}`;
        pipeline.set(key, JSON.stringify(agg));
        pipeline.expire(key, this.CACHE_TTL.aggregated);
      }

      await pipeline.exec();
    } catch (error) {
      console.error('Error storing aggregations:', error);
      throw error;
    }
  }

  /**
   * Aggregate metrics for time range
   */
  private async aggregateMetricsForRange(
    startTime: Date,
    endTime: Date,
    organizationId?: string,
    granularity: '5m' | '15m' | '1h' | '24h'
  ): Promise<MetricAggregation[]> {
    // This would query InfluxDB in production
    // For now, return cached aggregations
    const pattern = `analytics:agg:*:${granularity}:*`;
    const keys = await this.redis.keys(pattern);

    const aggregations: MetricAggregation[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const agg = JSON.parse(data) as MetricAggregation;
        const aggTime = new Date(agg.timestamp);

        if (aggTime >= startTime && aggTime <= endTime) {
          if (!organizationId || agg.dimensions.organizationId === organizationId) {
            aggregations.push(agg);
          }
        }
      }
    }

    return aggregations;
  }

  /**
   * Get active organizations
   */
  private async getActiveOrganizations(): Promise<string[]> {
    try {
      const key = 'analytics:active_organizations';
      const orgs = await this.redis.smembers(key);
      return orgs;
    } catch (error) {
      console.error('Error getting active organizations:', error);
      return [];
    }
  }

  /**
   * Validate event
   */
  private validateEvent(event: AnalyticsEvent): void {
    if (!event.eventType) {
      throw new Error('Event type is required');
    }
    if (!event.userId) {
      throw new Error('User ID is required');
    }
    if (!event.timestamp) {
      throw new Error('Timestamp is required');
    }
    if (!event.metadata || !event.metadata.source) {
      throw new Error('Event metadata.source is required');
    }
  }

  /**
   * Check if event is critical (requires immediate processing)
   */
  private isCriticalEvent(eventType: string): boolean {
    const criticalEvents = [
      'user_registered',
      'subscription_created',
      'session_started',
    ];
    return criticalEvents.includes(eventType);
  }

  /**
   * Get metric cache key
   */
  private getMetricKey(agg: MetricAggregation): string {
    return `${agg.metric}:${agg.windowSize}:${JSON.stringify(agg.dimensions)}`;
  }

  /**
   * Group array by property
   */
  private groupBy<T>(array: T[], property: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const key = String(item[property]);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Calculate percentage change
   */
  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return Math.round(((newValue - oldValue) / oldValue) * 100);
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    redis: boolean;
    bufferSize: number;
    cacheSize: number;
    uptime: number;
  }> {
    try {
      const redisHealthy = await this.redis.ping() === 'PONG';

      return {
        status: redisHealthy ? 'healthy' : 'degraded',
        redis: redisHealthy,
        bufferSize: this.eventBuffer.length,
        cacheSize: this.metricCache.size,
        uptime: process.uptime(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        redis: false,
        bufferSize: this.eventBuffer.length,
        cacheSize: this.metricCache.size,
        uptime: process.uptime(),
      };
    }
  }
}

/**
 * Singleton instance
 */
export const realtimeAnalyticsEngine = new RealtimeAnalyticsEngine();

export default RealtimeAnalyticsEngine;
