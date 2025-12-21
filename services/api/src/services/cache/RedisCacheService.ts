/**
 * Redis Cache Service
 *
 * Centralized caching layer with connection management, TTL strategies,
 * and intelligent cache operations for the UpCoach platform.
 */

import Redis from 'ioredis';

// Cache configuration
export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  maxRetries?: number;
  retryDelay?: number;
  enableReadyCheck?: boolean;
  lazyConnect?: boolean;
}

// Cache entry with metadata
export interface CacheEntry<T> {
  data: T;
  createdAt: number;
  expiresAt: number | null;
  version: number;
  tags: string[];
}

// Cache statistics
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
  keyCount: number;
  avgTtl: number;
  operations: {
    gets: number;
    sets: number;
    deletes: number;
    expires: number;
  };
}

// TTL presets for common use cases
export const TTL_PRESETS = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
  WEEK: 604800, // 7 days
  MONTH: 2592000, // 30 days
} as const;

// Cache key namespaces
export const CACHE_NAMESPACES = {
  USER: 'user',
  SESSION: 'session',
  ANALYTICS: 'analytics',
  RECOMMENDATIONS: 'recommendations',
  CONTENT: 'content',
  COACH: 'coach',
  HABITS: 'habits',
  GOALS: 'goals',
  QUERY: 'query',
  API_RESPONSE: 'api_response',
} as const;

export class RedisCacheService {
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private stats: CacheStats;
  private keyPrefix: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  constructor(private config: CacheConfig) {
    this.keyPrefix = config.keyPrefix || 'upcoach:';
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      memoryUsage: 0,
      keyCount: 0,
      avgTtl: 0,
      operations: {
        gets: 0,
        sets: 0,
        deletes: 0,
        expires: 0,
      },
    };
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      this.client = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db || 0,
        keyPrefix: this.keyPrefix,
        maxRetriesPerRequest: this.config.maxRetries || 3,
        retryStrategy: (times) => {
          if (times > this.maxReconnectAttempts) {
            console.error('Redis: Max reconnection attempts reached');
            return null;
          }
          const delay = Math.min(times * (this.config.retryDelay || 100), 3000);
          return delay;
        },
        enableReadyCheck: this.config.enableReadyCheck ?? true,
        lazyConnect: this.config.lazyConnect ?? false,
      });

      this.client.on('connect', () => {
        console.log('Redis: Connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.client.on('error', (error) => {
        console.error('Redis error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('Redis: Connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        this.reconnectAttempts++;
        console.log(`Redis: Reconnecting (attempt ${this.reconnectAttempts})`);
      });

      // Wait for connection
      await this.client.ping();
      this.isConnected = true;
    } catch (error) {
      console.error('Redis connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Build cache key with namespace
   */
  buildKey(namespace: string, ...parts: string[]): string {
    return [namespace, ...parts].join(':');
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      this.stats.operations.gets++;
      const data = await this.client!.get(key);

      if (data === null) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      this.stats.hits++;
      this.updateHitRate();

      const entry: CacheEntry<T> = JSON.parse(data);
      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Get value with metadata
   */
  async getWithMetadata<T>(key: string): Promise<CacheEntry<T> | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      this.stats.operations.gets++;
      const data = await this.client!.get(key);

      if (data === null) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      this.stats.hits++;
      this.updateHitRate();

      return JSON.parse(data);
    } catch (error) {
      console.error('Cache getWithMetadata error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    tags: string[] = []
  ): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      this.stats.operations.sets++;
      const now = Date.now();

      const entry: CacheEntry<T> = {
        data: value,
        createdAt: now,
        expiresAt: ttlSeconds ? now + ttlSeconds * 1000 : null,
        version: 1,
        tags,
      };

      const serialized = JSON.stringify(entry);

      if (ttlSeconds) {
        await this.client!.setex(key, ttlSeconds, serialized);
      } else {
        await this.client!.set(key, serialized);
      }

      // Store tag associations for invalidation
      if (tags.length > 0) {
        await this.addTagAssociations(key, tags, ttlSeconds);
      }

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Set value only if not exists
   */
  async setNX<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    tags: string[] = []
  ): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const now = Date.now();
      const entry: CacheEntry<T> = {
        data: value,
        createdAt: now,
        expiresAt: ttlSeconds ? now + ttlSeconds * 1000 : null,
        version: 1,
        tags,
      };

      const serialized = JSON.stringify(entry);
      const result = await this.client!.setnx(key, serialized);

      if (result === 1 && ttlSeconds) {
        await this.client!.expire(key, ttlSeconds);
      }

      return result === 1;
    } catch (error) {
      console.error('Cache setNX error:', error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      this.stats.operations.deletes++;
      const result = await this.client!.del(key);
      return result > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys
   */
  async deleteMany(keys: string[]): Promise<number> {
    if (!this.isReady() || keys.length === 0) {
      return 0;
    }

    try {
      this.stats.operations.deletes += keys.length;
      return await this.client!.del(...keys);
    } catch (error) {
      console.error('Cache deleteMany error:', error);
      return 0;
    }
  }

  /**
   * Delete keys by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isReady()) {
      return 0;
    }

    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      // Remove prefix from keys as ioredis adds it
      const unprefixedKeys = keys.map((k) =>
        k.startsWith(this.keyPrefix) ? k.slice(this.keyPrefix.length) : k
      );

      return await this.deleteMany(unprefixedKeys);
    } catch (error) {
      console.error('Cache deletePattern error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Get TTL of key
   */
  async getTTL(key: string): Promise<number> {
    if (!this.isReady()) {
      return -2;
    }

    try {
      return await this.client!.ttl(key);
    } catch (error) {
      console.error('Cache getTTL error:', error);
      return -2;
    }
  }

  /**
   * Extend TTL of key
   */
  async extendTTL(key: string, additionalSeconds: number): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const currentTTL = await this.getTTL(key);
      if (currentTTL < 0) {
        return false;
      }

      const newTTL = currentTTL + additionalSeconds;
      const result = await this.client!.expire(key, newTTL);
      return result === 1;
    } catch (error) {
      console.error('Cache extendTTL error:', error);
      return false;
    }
  }

  /**
   * Get or set with callback
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds?: number,
    tags: string[] = []
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    await this.set(key, data, ttlSeconds, tags);
    return data;
  }

  /**
   * Increment counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    if (!this.isReady()) {
      return 0;
    }

    try {
      if (amount === 1) {
        return await this.client!.incr(key);
      }
      return await this.client!.incrby(key, amount);
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  /**
   * Decrement counter
   */
  async decrement(key: string, amount: number = 1): Promise<number> {
    if (!this.isReady()) {
      return 0;
    }

    try {
      if (amount === 1) {
        return await this.client!.decr(key);
      }
      return await this.client!.decrby(key, amount);
    } catch (error) {
      console.error('Cache decrement error:', error);
      return 0;
    }
  }

  /**
   * Add to set
   */
  async addToSet(key: string, ...members: string[]): Promise<number> {
    if (!this.isReady()) {
      return 0;
    }

    try {
      return await this.client!.sadd(key, ...members);
    } catch (error) {
      console.error('Cache addToSet error:', error);
      return 0;
    }
  }

  /**
   * Get set members
   */
  async getSetMembers(key: string): Promise<string[]> {
    if (!this.isReady()) {
      return [];
    }

    try {
      return await this.client!.smembers(key);
    } catch (error) {
      console.error('Cache getSetMembers error:', error);
      return [];
    }
  }

  /**
   * Add tag associations for cache invalidation
   */
  private async addTagAssociations(
    key: string,
    tags: string[],
    ttlSeconds?: number
  ): Promise<void> {
    const pipeline = this.client!.pipeline();

    for (const tag of tags) {
      const tagKey = this.buildKey('tags', tag);
      pipeline.sadd(tagKey, key);
      if (ttlSeconds) {
        pipeline.expire(tagKey, ttlSeconds + 60); // Extra minute buffer
      }
    }

    await pipeline.exec();
  }

  /**
   * Invalidate by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    if (!this.isReady() || tags.length === 0) {
      return 0;
    }

    try {
      let totalDeleted = 0;

      for (const tag of tags) {
        const tagKey = this.buildKey('tags', tag);
        const keys = await this.getSetMembers(tagKey);

        if (keys.length > 0) {
          totalDeleted += await this.deleteMany(keys);
          await this.delete(tagKey);
        }
      }

      return totalDeleted;
    } catch (error) {
      console.error('Cache invalidateByTags error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    if (!this.isReady()) {
      return this.stats;
    }

    try {
      const info = await this.client!.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      if (memoryMatch) {
        this.stats.memoryUsage = parseInt(memoryMatch[1], 10);
      }

      const dbSize = await this.client!.dbsize();
      this.stats.keyCount = dbSize;

      return { ...this.stats };
    } catch (error) {
      console.error('Cache getStats error:', error);
      return this.stats;
    }
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Flush all keys (use with caution)
   */
  async flush(): Promise<void> {
    if (!this.isReady()) {
      return;
    }

    try {
      await this.client!.flushdb();
      console.log('Redis: Database flushed');
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latency: number }> {
    if (!this.isReady()) {
      return { healthy: false, latency: -1 };
    }

    try {
      const start = Date.now();
      await this.client!.ping();
      const latency = Date.now() - start;

      return { healthy: true, latency };
    } catch (error) {
      return { healthy: false, latency: -1 };
    }
  }
}

// Singleton instance
let cacheService: RedisCacheService | null = null;

export function getCacheService(): RedisCacheService {
  if (!cacheService) {
    cacheService = new RedisCacheService({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      keyPrefix: 'upcoach:',
    });
  }
  return cacheService;
}

export default RedisCacheService;
