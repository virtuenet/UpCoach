import Redis from 'ioredis';
import { logger } from '../../utils/logger';

/**
 * High-Performance Redis Caching Service
 * Implements multiple caching strategies for optimal performance
 */
export class PerformanceCacheService {
  private redis: Redis;
  private subscriber: Redis;
  private publisher: Redis;
  private isConnected: boolean = false;

  // Cache configuration
  private readonly cacheConfig = {
    // Default TTL values (in seconds)
    defaultTTL: 3600,        // 1 hour
    shortTTL: 300,           // 5 minutes
    mediumTTL: 1800,         // 30 minutes
    longTTL: 86400,          // 24 hours

    // Key prefixes for organization
    keyPrefixes: {
      user: 'user:',
      session: 'session:',
      api: 'api:',
      content: 'content:',
      analytics: 'analytics:',
      auth: 'auth:',
      realtime: 'realtime:',
      ml: 'ml:'
    },

    // Cache strategies
    strategies: {
      writeThrough: 'write-through',
      writeBack: 'write-back',
      writeAround: 'write-around',
      readThrough: 'read-through',
      cacheAside: 'cache-aside'
    }
  };

  constructor() {
    this.initializeRedis();
  }

  /**
   * Initialize Redis connections with performance optimization
   */
  private initializeRedis(): void {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    // Performance-optimized Redis configuration
    const redisOptions = {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      connectTimeout: 10000,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,

      // Connection pool configuration
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,

      // Performance settings
      compression: 'gzip',
      db: 0,

      // Cluster configuration if needed
      enableReadyCheck: true,
      maxRetriesPerRequest: null,
    };

    try {
      // Main Redis connection for read/write operations
      this.redis = new Redis(redisUrl, redisOptions);

      // Separate connections for pub/sub to avoid blocking
      this.subscriber = new Redis(redisUrl, redisOptions);
      this.publisher = new Redis(redisUrl, redisOptions);

      this.setupEventHandlers();
      this.setupHealthChecking();

    } catch (error) {
      logger.error('Failed to initialize Redis', error);
      throw error;
    }
  }

  /**
   * Setup Redis event handlers for monitoring
   */
  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis connection error', error);
    });

    this.redis.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', (time) => {
      logger.info(`Redis reconnecting in ${time}ms`);
    });
  }

  /**
   * Setup periodic health checking
   */
  private setupHealthChecking(): void {
    setInterval(async () => {
      try {
        await this.redis.ping();
        if (!this.isConnected) {
          this.isConnected = true;
          logger.info('Redis connection restored');
        }
      } catch (error) {
        if (this.isConnected) {
          this.isConnected = false;
          logger.error('Redis health check failed', error);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Cache-aside pattern implementation
   */
  async get<T>(key: string, fallback?: () => Promise<T>, ttl?: number): Promise<T | null> {
    try {
      const cachedValue = await this.redis.get(key);

      if (cachedValue !== null) {
        // Cache hit - track metrics
        this.trackCacheMetrics('hit', key);
        return JSON.parse(cachedValue);
      }

      // Cache miss
      this.trackCacheMetrics('miss', key);

      // If fallback provided, execute and cache result
      if (fallback) {
        const value = await fallback();
        await this.set(key, value, ttl);
        return value;
      }

      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error });

      // Fallback to direct data source on cache error
      if (fallback) {
        return await fallback();
      }
      return null;
    }
  }

  /**
   * Set cache value with TTL
   */
  async set(key: string, value: unknown, ttl?: number): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      const cacheTimeout = ttl || this.cacheConfig.defaultTTL;

      await this.redis.setex(key, cacheTimeout, serializedValue);
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error });
      return false;
    }
  }

  /**
   * Multi-get operation for bulk cache retrieval
   */
  async mget<T>(keys: string[]): Promise<Map<string, T>> {
    try {
      const values = await this.redis.mget(...keys);
      const resultMap = new Map<string, T>();

      keys.forEach((key, index) => {
        const value = values[index];
        if (value !== null) {
          try {
            resultMap.set(key, JSON.parse(value));
            this.trackCacheMetrics('hit', key);
          } catch (parseError) {
            logger.error('Cache parse error', { key, parseError });
            this.trackCacheMetrics('miss', key);
          }
        } else {
          this.trackCacheMetrics('miss', key);
        }
      });

      return resultMap;
    } catch (error) {
      logger.error('Cache mget error', { keys, error });
      return new Map();
    }
  }

  /**
   * Multi-set operation for bulk cache writing
   */
  async mset(data: Map<string, any>, ttl?: number): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();
      const cacheTimeout = ttl || this.cacheConfig.defaultTTL;

      for (const [key, value] of data.entries()) {
        const serializedValue = JSON.stringify(value);
        pipeline.setex(key, cacheTimeout, serializedValue);
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error', { keys: Array.from(data.keys()), error });
      return false;
    }
  }

  /**
   * Delete cache entries
   */
  async del(keys: string | string[]): Promise<number> {
    try {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      return await this.redis.del(...keysArray);
    } catch (error) {
      logger.error('Cache del error', { keys, error });
      return 0;
    }
  }

  /**
   * Pattern-based cache invalidation
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        return await this.redis.del(...keys);
      }
      return 0;
    } catch (error) {
      logger.error('Cache pattern invalidation error', { pattern, error });
      return 0;
    }
  }

  /**
   * Increment counter with TTL
   */
  async increment(key: string, by: number = 1, ttl?: number): Promise<number> {
    try {
      const pipeline = this.redis.pipeline();
      pipeline.incrby(key, by);

      if (ttl) {
        pipeline.expire(key, ttl);
      }

      const results = await pipeline.exec();
      return results?.[0]?.[1] as number || 0;
    } catch (error) {
      logger.error('Cache increment error', { key, error });
      return 0;
    }
  }

  /**
   * Set operations for cache tags and relationships
   */
  async sadd(key: string, members: string[], ttl?: number): Promise<number> {
    try {
      const pipeline = this.redis.pipeline();
      pipeline.sadd(key, ...members);

      if (ttl) {
        pipeline.expire(key, ttl);
      }

      const results = await pipeline.exec();
      return results?.[0]?.[1] as number || 0;
    } catch (error) {
      logger.error('Cache sadd error', { key, error });
      return 0;
    }
  }

  /**
   * Hash operations for structured cache data
   */
  async hmset(key: string, data: Record<string, any>, ttl?: number): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();

      // Convert values to strings for Redis
      const redisData: Record<string, string> = {};
      for (const [field, value] of Object.entries(data)) {
        redisData[field] = typeof value === 'string' ? value : JSON.stringify(value);
      }

      pipeline.hmset(key, redisData);

      if (ttl) {
        pipeline.expire(key, ttl);
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache hmset error', { key, error });
      return false;
    }
  }

  /**
   * Specialized caching methods for different data types
   */

  // User session caching
  async cacheUserSession(userId: string, sessionData: unknown, ttl: number = 3600): Promise<boolean> {
    const key = `${this.cacheConfig.keyPrefixes.session}${userId}`;
    return await this.set(key, sessionData, ttl);
  }

  async getUserSession(userId: string): Promise<unknown> {
    const key = `${this.cacheConfig.keyPrefixes.session}${userId}`;
    return await this.get(key);
  }

  // API response caching
  async cacheApiResponse(endpoint: string, params: string, response: unknown, ttl: number = 300): Promise<boolean> {
    const key = `${this.cacheConfig.keyPrefixes.api}${endpoint}:${params}`;
    return await this.set(key, response, ttl);
  }

  async getApiResponse(endpoint: string, params: string): Promise<unknown> {
    const key = `${this.cacheConfig.keyPrefixes.api}${endpoint}:${params}`;
    return await this.get(key);
  }

  // Content caching with tags
  async cacheContent(contentId: string, content: unknown, tags: string[] = [], ttl: number = 1800): Promise<boolean> {
    const contentKey = `${this.cacheConfig.keyPrefixes.content}${contentId}`;
    const success = await this.set(contentKey, content, ttl);

    // Cache content tags for invalidation
    if (success && tags.length > 0) {
      for (const tag of tags) {
        const tagKey = `${this.cacheConfig.keyPrefixes.content}tag:${tag}`;
        await this.sadd(tagKey, [contentId], ttl);
      }
    }

    return success;
  }

  // Invalidate content by tags
  async invalidateContentByTags(tags: string[]): Promise<number> {
    let totalInvalidated = 0;

    for (const tag of tags) {
      const tagKey = `${this.cacheConfig.keyPrefixes.content}tag:${tag}`;
      const contentIds = await this.redis.smembers(tagKey);

      if (contentIds.length > 0) {
        const contentKeys = contentIds.map(id => `${this.cacheConfig.keyPrefixes.content}${id}`);
        totalInvalidated += await this.del([...contentKeys, tagKey]);
      }
    }

    return totalInvalidated;
  }

  // Analytics data caching
  async cacheAnalytics(metric: string, timeframe: string, data: unknown, ttl: number = 900): Promise<boolean> {
    const key = `${this.cacheConfig.keyPrefixes.analytics}${metric}:${timeframe}`;
    return await this.set(key, data, ttl);
  }

  // ML model results caching
  async cacheMlResult(modelName: string, inputHash: string, result: unknown, ttl: number = 3600): Promise<boolean> {
    const key = `${this.cacheConfig.keyPrefixes.ml}${modelName}:${inputHash}`;
    return await this.set(key, result, ttl);
  }

  /**
   * Cache warming strategies
   */
  async warmupCache(warmupData: Array<{ key: string; value: unknown; ttl?: number }>): Promise<void> {
    logger.info('Starting cache warmup');

    try {
      const pipeline = this.redis.pipeline();

      for (const item of warmupData) {
        const serializedValue = JSON.stringify(item.value);
        const ttl = item.ttl || this.cacheConfig.defaultTTL;
        pipeline.setex(item.key, ttl, serializedValue);
      }

      await pipeline.exec();
      logger.info(`Cache warmup completed: ${warmupData.length} items`);
    } catch (error) {
      logger.error('Cache warmup failed', error);
    }
  }

  /**
   * Performance monitoring and metrics
   */
  private trackCacheMetrics(operation: 'hit' | 'miss', key: string): void {
    // Implementation would integrate with your metrics collection system
    // For now, we'll use logger for tracking
    logger.debug('Cache operation', {
      operation,
      key: key.substring(0, 50) + '...',
      timestamp: Date.now()
    });
  }

  async getCacheStats(): Promise<unknown> {
    try {
      const info = await this.redis.info('memory,stats');
      const keyspace = await this.redis.info('keyspace');

      return {
        connected: this.isConnected,
        memory_usage: this.parseRedisInfo(info, 'used_memory_human'),
        keyspace_hits: this.parseRedisInfo(info, 'keyspace_hits'),
        keyspace_misses: this.parseRedisInfo(info, 'keyspace_misses'),
        total_keys: this.parseRedisInfo(keyspace, 'keys'),
        expires: this.parseRedisInfo(keyspace, 'expires'),
        avg_ttl: this.parseRedisInfo(keyspace, 'avg_ttl')
      };
    } catch (error) {
      logger.error('Failed to get cache stats', error);
      return { connected: false, error: error.message };
    }
  }

  private parseRedisInfo(info: string, key: string): string | number {
    const lines = info.split('\r\n');
    for (const line of lines) {
      if (line.startsWith(key + ':')) {
        const value = line.split(':')[1];
        return isNaN(Number(value)) ? value : Number(value);
      }
    }
    return 'N/A';
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down cache service');

    try {
      await Promise.all([
        this.redis.quit(),
        this.subscriber.quit(),
        this.publisher.quit()
      ]);

      logger.info('Cache service shutdown completed');
    } catch (error) {
      logger.error('Error during cache service shutdown', error);
    }
  }
}

// Export singleton instance
export const performanceCacheService = new PerformanceCacheService();

// Export cache key builders for consistency
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userSession: (userId: string) => `session:${userId}`,
  apiResponse: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
  content: (id: string) => `content:${id}`,
  contentTag: (tag: string) => `content:tag:${tag}`,
  analytics: (metric: string, timeframe: string) => `analytics:${metric}:${timeframe}`,
  ml: (model: string, hash: string) => `ml:${model}:${hash}`,
  auth: (token: string) => `auth:${token}`,
  realtime: (channel: string) => `realtime:${channel}`
};

// Export TTL constants
export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  DEFAULT: 3600,   // 1 hour
  LONG: 86400,     // 24 hours
  SESSION: 7200,   // 2 hours
  API: 300,        // 5 minutes
  CONTENT: 1800,   // 30 minutes
  ML: 3600,        // 1 hour
  ANALYTICS: 900   // 15 minutes
};