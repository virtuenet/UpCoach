/**
 * Redis Cache Service
 * Phase 12 Week 1
 *
 * High-performance caching layer with TTL management, pattern-based invalidation,
 * and graceful degradation when Redis is unavailable
 */

import Redis, { RedisOptions } from 'ioredis';
import EventEmitter from 'events';

export interface CacheConfig extends RedisOptions {
  keyPrefix?: string;
  defaultTTL?: number; // seconds
  enableCompression?: boolean;
  compressionThreshold?: number; // bytes
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  avgGetTime: number; // ms
  avgSetTime: number; // ms
  totalKeys: number;
  memoryUsed: number; // bytes
}

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export class RedisCache extends EventEmitter {
  private client: Redis;
  private isConnected: boolean = false;
  private stats: CacheStats;
  private getTimes: number[] = [];
  private setTimes: number[] = [];
  private readonly MAX_TIME_SAMPLES = 100;
  private readonly DEFAULT_TTL = 300; // 5 minutes

  constructor(private config: CacheConfig) {
    super();

    this.client = new Redis({
      ...config,
      keyPrefix: config.keyPrefix || 'upcoach:',
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableOfflineQueue: false,
      lazyConnect: true
    });

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
      avgGetTime: 0,
      avgSetTime: 0,
      totalKeys: 0,
      memoryUsed: 0
    };

    this.setupEventListeners();
  }

  /**
   * Connect to Redis server
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.isConnected = true;
      this.emit('cache:connected');
    } catch (error) {
      this.isConnected = false;
      this.emit('cache:connection_error', error);
      throw error;
    }
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const startTime = Date.now();

    try {
      if (!this.isConnected) {
        this.stats.misses++;
        return null;
      }

      const value = await this.client.get(key);
      const getTime = Date.now() - startTime;
      this.trackGetTime(getTime);

      if (value === null) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      this.stats.hits++;
      this.updateHitRate();

      return this.deserialize<T>(value);
    } catch (error) {
      this.emit('cache:get_error', { key, error });
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T = any>(
    key: string,
    value: T,
    ttl?: number
  ): Promise<boolean> {
    const startTime = Date.now();

    try {
      if (!this.isConnected) {
        return false;
      }

      const serialized = this.serialize(value);
      const effectiveTTL = ttl || this.config.defaultTTL || this.DEFAULT_TTL;

      await this.client.setex(key, effectiveTTL, serialized);

      const setTime = Date.now() - startTime;
      this.trackSetTime(setTime);
      this.stats.sets++;

      this.emit('cache:set', { key, ttl: effectiveTTL });
      return true;
    } catch (error) {
      this.emit('cache:set_error', { key, error });
      return false;
    }
  }

  /**
   * Delete single key
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.del(key);
      this.stats.deletes++;

      if (result > 0) {
        this.emit('cache:delete', { key });
        return true;
      }

      return false;
    } catch (error) {
      this.emit('cache:delete_error', { key, error });
      return false;
    }
  }

  /**
   * Delete keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const stream = this.client.scanStream({
        match: pattern,
        count: 100
      });

      let deletedCount = 0;
      const pipeline = this.client.pipeline();

      stream.on('data', (keys: string[]) => {
        keys.forEach(key => {
          pipeline.del(key);
          deletedCount++;
        });
      });

      await new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      if (deletedCount > 0) {
        await pipeline.exec();
        this.stats.deletes += deletedCount;
        this.emit('cache:pattern_delete', { pattern, count: deletedCount });
      }

      return deletedCount;
    } catch (error) {
      this.emit('cache:pattern_delete_error', { pattern, error });
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.emit('cache:exists_error', { key, error });
      return false;
    }
  }

  /**
   * Get remaining TTL for key
   */
  async ttl(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return -1;
      }

      const ttl = await this.client.ttl(key);
      return ttl;
    } catch (error) {
      this.emit('cache:ttl_error', { key, error });
      return -1;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget<T = any>(keys: string[]): Promise<Array<T | null>> {
    try {
      if (!this.isConnected || keys.length === 0) {
        return keys.map(() => null);
      }

      const values = await this.client.mget(...keys);

      return values.map(value => {
        if (value === null) {
          this.stats.misses++;
          return null;
        }

        this.stats.hits++;
        return this.deserialize<T>(value);
      });
    } catch (error) {
      this.emit('cache:mget_error', { keys, error });
      return keys.map(() => null);
    } finally {
      this.updateHitRate();
    }
  }

  /**
   * Set multiple keys at once
   */
  async mset(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
    try {
      if (!this.isConnected || entries.length === 0) {
        return false;
      }

      const pipeline = this.client.pipeline();

      entries.forEach(({ key, value, ttl }) => {
        const serialized = this.serialize(value);
        const effectiveTTL = ttl || this.config.defaultTTL || this.DEFAULT_TTL;
        pipeline.setex(key, effectiveTTL, serialized);
      });

      await pipeline.exec();
      this.stats.sets += entries.length;

      this.emit('cache:mset', { count: entries.length });
      return true;
    } catch (error) {
      this.emit('cache:mset_error', { error });
      return false;
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, by: number = 1): Promise<number> {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const result = await this.client.incrby(key, by);
      return result;
    } catch (error) {
      this.emit('cache:increment_error', { key, error });
      return 0;
    }
  }

  /**
   * Set with expiration only if key doesn't exist
   */
  async setNX(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const serialized = this.serialize(value);
      const effectiveTTL = ttl || this.config.defaultTTL || this.DEFAULT_TTL;

      const result = await this.client.set(key, serialized, 'EX', effectiveTTL, 'NX');
      return result === 'OK';
    } catch (error) {
      this.emit('cache:setnx_error', { key, error });
      return false;
    }
  }

  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.isConnected) {
        return [];
      }

      const keys: string[] = [];
      const stream = this.client.scanStream({
        match: pattern,
        count: 100
      });

      stream.on('data', (resultKeys: string[]) => {
        keys.push(...resultKeys);
      });

      await new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      return keys;
    } catch (error) {
      this.emit('cache:keys_error', { pattern, error });
      return [];
    }
  }

  /**
   * Flush all keys in database
   */
  async flush(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      await this.client.flushdb();
      this.emit('cache:flushed');
      return true;
    } catch (error) {
      this.emit('cache:flush_error', { error });
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      if (this.isConnected) {
        const info = await this.client.info('stats');
        const keyspaceInfo = await this.client.info('keyspace');

        // Parse keyspace_hits and keyspace_misses from info
        const hitsMatch = info.match(/keyspace_hits:(\d+)/);
        const missesMatch = info.match(/keyspace_misses:(\d+)/);

        if (hitsMatch) this.stats.hits = parseInt(hitsMatch[1], 10);
        if (missesMatch) this.stats.misses = parseInt(missesMatch[1], 10);

        // Parse total keys
        const keysMatch = keyspaceInfo.match(/keys=(\d+)/);
        if (keysMatch) this.stats.totalKeys = parseInt(keysMatch[1], 10);

        // Get memory usage
        const memoryInfo = await this.client.info('memory');
        const memoryMatch = memoryInfo.match(/used_memory:(\d+)/);
        if (memoryMatch) this.stats.memoryUsed = parseInt(memoryMatch[1], 10);
      }

      this.stats.avgGetTime = this.calculateAverageTime(this.getTimes);
      this.stats.avgSetTime = this.calculateAverageTime(this.setTimes);

      return { ...this.stats };
    } catch (error) {
      this.emit('cache:stats_error', { error });
      return { ...this.stats };
    }
  }

  /**
   * Ping Redis server
   */
  async ping(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      this.emit('cache:disconnected');
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.client.on('connect', () => {
      this.isConnected = true;
      this.emit('cache:connected');
    });

    this.client.on('ready', () => {
      this.emit('cache:ready');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      this.emit('cache:error', err);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      this.emit('cache:closed');
    });

    this.client.on('reconnecting', () => {
      this.emit('cache:reconnecting');
    });
  }

  /**
   * Serialize value for storage
   */
  private serialize(value: any): string {
    return JSON.stringify(value);
  }

  /**
   * Deserialize value from storage
   */
  private deserialize<T>(value: string): T {
    return JSON.parse(value) as T;
  }

  /**
   * Track get operation time
   */
  private trackGetTime(time: number): void {
    this.getTimes.push(time);
    if (this.getTimes.length > this.MAX_TIME_SAMPLES) {
      this.getTimes.shift();
    }
  }

  /**
   * Track set operation time
   */
  private trackSetTime(time: number): void {
    this.setTimes.push(time);
    if (this.setTimes.length > this.MAX_TIME_SAMPLES) {
      this.setTimes.shift();
    }
  }

  /**
   * Calculate average time from samples
   */
  private calculateAverageTime(times: number[]): number {
    if (times.length === 0) return 0;
    const sum = times.reduce((a, b) => a + b, 0);
    return Math.round((sum / times.length) * 100) / 100;
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0
      ? Math.round((this.stats.hits / total) * 10000) / 100
      : 0;
  }
}

/**
 * Singleton cache manager
 */
export class CacheManager {
  private static instance: RedisCache;

  static initialize(config: CacheConfig): void {
    if (this.instance) {
      throw new Error('Cache already initialized');
    }

    this.instance = new RedisCache(config);
  }

  static getInstance(): RedisCache {
    if (!this.instance) {
      throw new Error('Cache not initialized. Call CacheManager.initialize() first');
    }

    return this.instance;
  }

  static async close(): Promise<void> {
    if (this.instance) {
      await this.instance.disconnect();
    }
  }
}
