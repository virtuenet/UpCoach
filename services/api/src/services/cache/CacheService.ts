import { redis } from '../redis';
import { logger } from '../../utils/logger';
import { config } from '../../config/environment';
import * as crypto from 'crypto';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  compress?: boolean; // Enable compression for large values
  namespace?: string; // Namespace for key isolation
  serialize?: boolean; // Auto-serialize objects
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  operations: {
    get: number;
    set: number;
    delete: number;
    invalidate: number;
  };
  memory: {
    used: number;
    peak: number;
  };
}

interface CacheEntry {
  value: unknown;
  ttl: number;
  createdAt: number;
  tags?: string[];
  compressed?: boolean;
  size: number;
}

export class CacheService {
  private static instance: CacheService;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    operations: { get: 0, set: 0, delete: 0, invalidate: 0 },
    memory: { used: 0, peak: 0 },
  };
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly MAX_KEY_LENGTH = 250;
  private readonly MAX_VALUE_SIZE = 1024 * 1024; // 1MB
  private readonly COMPRESSION_THRESHOLD = 1024; // 1KB

  private constructor() {
    this.startStatsCollection();
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string, options: Omit<CacheOptions, 'ttl'> = {}): Promise<T | null> {
    try {
      const startTime = process.hrtime.bigint();
      this.stats.operations.get++;

      const cacheKey = this.buildKey(key, options.namespace);
      this.validateKey(cacheKey);

      const result = await redis.get(cacheKey);

      if (result === null) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      // Parse the cache entry
      const entry: CacheEntry = JSON.parse(result);

      // Decompress if needed
      let value = entry.value;
      if (entry.compressed) {
        value = await this.decompress(value);
      }

      // Deserialize if needed
      if (options.serialize !== false && typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch {
          // Value was not JSON, keep as string
        }
      }

      this.stats.hits++;
      this.updateHitRate();

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to ms

      logger.debug('Cache hit', {
        key: cacheKey,
        size: entry.size,
        compressed: entry.compressed,
        duration: `${duration.toFixed(2)}ms`,
      });

      return value;

    } catch (error) {
      logger.error('Cache get error:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: unknown, options: CacheOptions = {}): Promise<boolean> {
    try {
      const startTime = process.hrtime.bigint();
      this.stats.operations.set++;

      const cacheKey = this.buildKey(key, options.namespace);
      this.validateKey(cacheKey);

      // Serialize value if needed
      let serializedValue = value;
      if (options.serialize !== false && typeof value === 'object') {
        serializedValue = JSON.stringify(value);
      }

      // Calculate size
      const valueSize = Buffer.byteLength(serializedValue, 'utf8');
      if (valueSize > this.MAX_VALUE_SIZE) {
        logger.warn('Cache value too large, skipping', {
          key: cacheKey,
          size: valueSize,
          maxSize: this.MAX_VALUE_SIZE,
        });
        return false;
      }

      // Compress if needed
      let finalValue = serializedValue;
      let compressed = false;
      if (options.compress !== false && valueSize > this.COMPRESSION_THRESHOLD) {
        finalValue = await this.compress(serializedValue);
        compressed = true;
      }

      // Create cache entry
      const entry: CacheEntry = {
        value: finalValue,
        ttl: options.ttl || this.DEFAULT_TTL,
        createdAt: Date.now(),
        tags: options.tags,
        compressed,
        size: valueSize,
      };

      // Set in Redis
      const ttl = options.ttl || this.DEFAULT_TTL;
      await redis.setEx(cacheKey, ttl, JSON.stringify(entry));

      // Add to tag index if tags are provided
      if (options.tags && options.tags.length > 0) {
        await this.addToTagIndex(cacheKey, options.tags, ttl);
      }

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      logger.debug('Cache set', {
        key: cacheKey,
        size: valueSize,
        compressed,
        ttl,
        duration: `${duration.toFixed(2)}ms`,
      });

      return true;

    } catch (error) {
      logger.error('Cache set error:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, options: { namespace?: string } = {}): Promise<boolean> {
    try {
      this.stats.operations.delete++;

      const cacheKey = this.buildKey(key, options.namespace);
      const result = await redis.del(cacheKey);

      logger.debug('Cache delete', { key: cacheKey, found: result > 0 });

      return result > 0;

    } catch (error) {
      logger.error('Cache delete error:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string, options: { namespace?: string } = {}): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(key, options.namespace);
      const result = await redis.exists(cacheKey);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Increment a numeric value in cache
   */
  async increment(key: string, amount: number = 1, options: CacheOptions = {}): Promise<number> {
    try {
      const cacheKey = this.buildKey(key, options.namespace);
      const result = await redis.incrBy(cacheKey, amount);

      // Set TTL if this is a new key
      if (result === amount) {
        const ttl = options.ttl || this.DEFAULT_TTL;
        await redis.expire(cacheKey, ttl);
      }

      return result;

    } catch (error) {
      logger.error('Cache increment error:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * Get multiple values from cache
   */
  async getMultiple<T = any>(keys: string[], options: { namespace?: string } = {}): Promise<Map<string, T | null>> {
    try {
      const cacheKeys = keys.map(key => this.buildKey(key, options.namespace));
      const results = await redis.mGet(cacheKeys);

      const resultMap = new Map<string, T | null>();

      for (let i = 0; i < keys.length; i++) {
        const originalKey = keys[i];
        const result = results[i];

        if (result === null) {
          resultMap.set(originalKey, null);
          this.stats.misses++;
        } else {
          try {
            const entry: CacheEntry = JSON.parse(result);
            let value = entry.value;

            if (entry.compressed) {
              value = await this.decompress(value);
            }

            if (typeof value === 'string') {
              try {
                value = JSON.parse(value);
              } catch {
                // Keep as string
              }
            }

            resultMap.set(originalKey, value);
            this.stats.hits++;
          } catch (parseError) {
            logger.error('Cache entry parse error:', {
              key: originalKey,
              error: parseError instanceof Error ? parseError.message : 'Unknown error',
            });
            resultMap.set(originalKey, null);
            this.stats.misses++;
          }
        }
      }

      this.updateHitRate();
      return resultMap;

    } catch (error) {
      logger.error('Cache getMultiple error:', {
        keys,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return new Map(keys.map(key => [key, null]));
    }
  }

  /**
   * Set multiple values in cache
   */
  async setMultiple(entries: Array<{ key: string; value: unknown; options?: CacheOptions }>): Promise<boolean[]> {
    try {
      const results = await Promise.all(
        entries.map(entry => this.set(entry.key, entry.value, entry.options || {}))
      );
      return results;
    } catch (error) {
      logger.error('Cache setMultiple error:', {
        entryCount: entries.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return entries.map(() => false);
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      this.stats.operations.invalidate++;

      let totalDeleted = 0;

      for (const tag of tags) {
        const tagKey = this.buildTagKey(tag);
        const keys = await redis.sMembers(tagKey);

        if (keys.length > 0) {
          const deleted = await redis.del(...keys);
          totalDeleted += deleted;

          // Clean up the tag index
          await redis.del(tagKey);
        }
      }

      logger.info('Cache invalidation by tags', {
        tags,
        keysDeleted: totalDeleted,
      });

      return totalDeleted;

    } catch (error) {
      logger.error('Cache invalidateByTags error:', {
        tags,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * Clear entire cache namespace
   */
  async clearNamespace(namespace: string): Promise<number> {
    try {
      const pattern = this.buildKey('*', namespace);
      const keys = await redis.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      const deleted = await redis.del(...keys);

      logger.info('Cache namespace cleared', {
        namespace,
        keysDeleted: deleted,
      });

      return deleted;

    } catch (error) {
      logger.error('Cache clearNamespace error:', {
        namespace,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T = any>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key, options);
      if (cached !== null) {
        return cached;
      }

      // Generate value using factory function
      const value = await factory();

      // Store in cache
      await this.set(key, value, options);

      return value;

    } catch (error) {
      logger.error('Cache getOrSet error:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // If caching fails, still try to return the generated value
      try {
        return await factory();
      } catch (factoryError) {
        throw factoryError;
      }
    }
  }

  /**
   * Warming cache with background refresh
   */
  async warmCache<T = any>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions & { warmupThreshold?: number } = {}
  ): Promise<T> {
    const warmupThreshold = options.warmupThreshold || 0.2; // Refresh when 20% of TTL remains

    try {
      const cacheKey = this.buildKey(key, options.namespace);
      const result = await redis.get(cacheKey);

      if (result !== null) {
        const entry: CacheEntry = JSON.parse(result);
        const age = Date.now() - entry.createdAt;
        const remainingLife = (entry.ttl * 1000) - age;
        const shouldWarm = remainingLife < (entry.ttl * 1000 * warmupThreshold);

        if (shouldWarm) {
          // Asynchronously refresh the cache
          setImmediate(async () => {
            try {
              const newValue = await factory();
              await this.set(key, newValue, options);
              logger.debug('Cache warmed', { key: cacheKey });
            } catch (error) {
              logger.error('Cache warming failed:', {
                key: cacheKey,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          });
        }

        // Return current cached value
        return this.get<T>(key, options) as Promise<T>;
      }

      // Cache miss, get and set
      return this.getOrSet(key, factory, options);

    } catch (error) {
      logger.error('Cache warmCache error:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return factory();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      operations: { get: 0, set: 0, delete: 0, invalidate: 0 },
      memory: { used: 0, peak: 0 },
    };
  }

  /**
   * Health check for cache service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    memory: unknown;
    stats: CacheStats;
  }> {
    try {
      const startTime = process.hrtime.bigint();

      // Test basic operations
      const testKey = 'health_check_' + Date.now();
      await this.set(testKey, 'test', { ttl: 60 });
      const retrieved = await this.get(testKey);
      await this.delete(testKey);

      const endTime = process.hrtime.bigint();
      const latency = Number(endTime - startTime) / 1000000; // Convert to ms

      // Get Redis memory info
      const memoryInfo = await redis.info('memory');

      return {
        status: retrieved === 'test' ? 'healthy' : 'unhealthy',
        latency,
        memory: this.parseRedisMemoryInfo(memoryInfo),
        stats: this.getStats(),
      };

    } catch (error) {
      logger.error('Cache health check failed:', error);
      return {
        status: 'unhealthy',
        latency: -1,
        memory: {},
        stats: this.getStats(),
      };
    }
  }

  /**
   * Private utility methods
   */
  private buildKey(key: string, namespace?: string): string {
    const prefix = config.cache?.prefix || 'upcoach';
    const parts = [prefix];

    if (namespace) {
      parts.push(namespace);
    }

    parts.push(key);
    return parts.join(':');
  }

  private buildTagKey(tag: string): string {
    return this.buildKey(`tag:${tag}`, 'tags');
  }

  private validateKey(key: string): void {
    if (key.length > this.MAX_KEY_LENGTH) {
      throw new Error(`Cache key too long: ${key.length} > ${this.MAX_KEY_LENGTH}`);
    }

    if (key.includes(' ')) {
      throw new Error('Cache key cannot contain spaces');
    }
  }

  private async addToTagIndex(key: string, tags: string[], ttl: number): Promise<void> {
    try {
      const pipeline = redis.multi();

      for (const tag of tags) {
        const tagKey = this.buildTagKey(tag);
        pipeline.sAdd(tagKey, key);
        pipeline.expire(tagKey, ttl + 60); // Tag index expires slightly later
      }

      await pipeline.exec();
    } catch (error) {
      logger.error('Failed to add to tag index:', error);
    }
  }

  private async compress(value: string): Promise<string> {
    try {
      const zlib = require('zlib');
      const compressed = zlib.gzipSync(Buffer.from(value));
      return compressed.toString('base64');
    } catch (error) {
      logger.error('Compression failed:', error);
      return value;
    }
  }

  private async decompress(value: string): Promise<string> {
    try {
      const zlib = require('zlib');
      const buffer = Buffer.from(value, 'base64');
      const decompressed = zlib.gunzipSync(buffer);
      return decompressed.toString();
    } catch (error) {
      logger.error('Decompression failed:', error);
      return value;
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private startStatsCollection(): void {
    setInterval(async () => {
      try {
        const memoryInfo = await redis.info('memory');
        const parsed = this.parseRedisMemoryInfo(memoryInfo);
        this.stats.memory.used = parsed.used_memory || 0;
        this.stats.memory.peak = Math.max(this.stats.memory.peak, this.stats.memory.used);
      } catch (error) {
        logger.debug('Failed to collect cache memory stats:', error);
      }
    }, 30000); // Every 30 seconds
  }

  private parseRedisMemoryInfo(info: string): unknown {
    const lines = info.split('\r\n');
    const memory: unknown = {};

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (key.startsWith('used_memory')) {
          memory[key] = parseInt(value, 10);
        }
      }
    }

    return memory;
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();