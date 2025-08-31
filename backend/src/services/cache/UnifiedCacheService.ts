/**
 * Unified Cache Service - Consolidates all caching functionality
 * Combines features from cacheService.ts, ai/CacheService.ts, and cache/CacheService.ts
 */

import Redis from 'ioredis';
import { createHash } from 'crypto';
import { logger } from '../../utils/logger';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { LRUCache } from 'lru-cache';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  compress?: boolean; // Compress large values
  namespace?: string; // Cache namespace
  prefix?: string; // Key prefix (alias for namespace)
  fallbackToMemory?: boolean; // Use in-memory cache if Redis fails
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  memoryHits: number;
  memoryMisses: number;
  compressionRatio: number;
}

interface MemoryCacheEntry {
  value: any;
  expiry: number;
  compressed: boolean;
}

export class UnifiedCacheService {
  private redis: Redis | null = null;
  private inMemoryCache: LRUCache<string, MemoryCacheEntry>;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
    memoryHits: 0,
    memoryMisses: 0,
    compressionRatio: 1,
  };

  private readonly defaultTTL: number;
  private readonly maxRetries: number;
  private readonly compressionThreshold: number;
  private readonly memoryMaxSize: number;
  private readonly defaultPrefix: string;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private tagIndex: Map<string, Set<string>> = new Map();

  constructor(
    options: {
      defaultTTL?: number;
      maxRetries?: number;
      compressionThreshold?: number;
      memoryMaxSize?: number;
      defaultPrefix?: string;
      redisUrl?: string;
    } = {}
  ) {
    this.defaultTTL = options.defaultTTL || 3600; // 1 hour
    this.maxRetries = options.maxRetries || 3;
    this.compressionThreshold = options.compressionThreshold || 1024; // 1KB
    this.memoryMaxSize = options.memoryMaxSize || 1000; // Max entries in memory
    this.defaultPrefix = options.defaultPrefix || 'cache:';

    // Initialize LRU cache with automatic eviction
    this.inMemoryCache = new LRUCache<string, MemoryCacheEntry>({
      max: this.memoryMaxSize,
      maxSize: this.memoryMaxSize * 1000, // Set maxSize when using sizeCalculation
      ttl: this.defaultTTL * 1000, // Convert to milliseconds
      updateAgeOnGet: true,
      updateAgeOnHas: true,
      // Calculate size based on serialized value
      sizeCalculation: (value: MemoryCacheEntry) => {
        try {
          const size = JSON.stringify(value.value).length;
          return Math.ceil(size / 100); // Rough size estimate
        } catch {
          return 1;
        }
      },
      // Dispose callback for cleanup
      dispose: (value: MemoryCacheEntry, key: string) => {
        logger.debug('LRU cache evicted key', { key });
      },
    });

    this.initializeRedis(options.redisUrl);
    this.startMemoryCleanup();
  }

  private initializeRedis(redisUrl?: string): void {
    try {
      this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: this.maxRetries,
        enableReadyCheck: true,
        enableOfflineQueue: true,
        retryStrategy: times => {
          if (times > this.maxRetries) {
            logger.warn('Redis connection failed, falling back to in-memory cache');
            this.redis = null;
            return null;
          }
          return Math.min(times * 100, 3000);
        },
      });

      this.redis.on('connect', () => {
        logger.info('Unified cache service connected to Redis');
      });

      this.redis.on('error', err => {
        logger.error('Redis cache error:', err);
        // Continue with in-memory fallback
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed, using in-memory cache');
      });
    } catch (error) {
      logger.warn('Redis initialization failed, using in-memory cache only', error);
      this.redis = null;
    }
  }

  private generateKey(key: string, namespace?: string, prefix?: string): string {
    const finalPrefix = prefix || namespace || this.defaultPrefix;

    // If key is already long/complex, hash it for consistency
    if (key.length > 250) {
      const hash = createHash('sha256').update(key).digest('hex');
      return `${finalPrefix}${hash}`;
    }

    return `${finalPrefix}${key}`;
  }

  private async compressValue(value: string): Promise<Buffer | string> {
    if (value.length > this.compressionThreshold) {
      try {
        const compressed = await gzip(value);
        this.updateCompressionRatio(value.length, compressed.length);
        return compressed;
      } catch (error) {
        logger.warn('Compression failed, storing uncompressed', error);
        return value;
      }
    }
    return value;
  }

  private async decompressValue(value: Buffer | string): Promise<string> {
    if (Buffer.isBuffer(value)) {
      try {
        const decompressed = await gunzip(value);
        return decompressed.toString();
      } catch (error) {
        logger.warn('Decompression failed', error);
        return value.toString();
      }
    }
    return value;
  }

  private updateCompressionRatio(original: number, compressed: number): void {
    const ratio = compressed / original;
    this.stats.compressionRatio = this.stats.compressionRatio * 0.9 + ratio * 0.1; // Exponential moving average
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private cleanupMemoryCache(): void {
    // LRU cache handles its own cleanup and eviction
    // This method now just prunes expired entries
    this.inMemoryCache.purgeStale();

    // Log cache statistics
    const stats = {
      size: this.inMemoryCache.size,
      calculatedSize: this.inMemoryCache.calculatedSize,
      hitRate:
        this.stats.hits > 0
          ? this.stats.memoryHits / (this.stats.memoryHits + this.stats.memoryMisses)
          : 0,
    };

    if (this.inMemoryCache.size > this.memoryMaxSize * 0.9) {
      logger.warn('Memory cache approaching size limit', stats);
    }
  }

  private startMemoryCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupMemoryCache();
      // Also report cache statistics periodically
      if (this.stats.hits + this.stats.misses > 0) {
        this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
        logger.info('Cache statistics', {
          ...this.stats,
          memoryCacheSize: this.inMemoryCache.size,
        });
      }
    }, 60000); // Clean up and report every minute
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const cacheKey = this.generateKey(key, options?.namespace, options?.prefix);

    // Try Redis first if available
    if (this.redis) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          this.stats.hits++;
          this.updateHitRate();

          const decompressed = await this.decompressValue(cached);
          return JSON.parse(decompressed);
        }
      } catch (error) {
        logger.warn('Redis get failed, trying memory cache', error);
      }
    }

    // Fallback to in-memory cache
    if (options?.fallbackToMemory !== false) {
      const memoryCached = this.inMemoryCache.get(cacheKey);
      if (memoryCached && memoryCached.expiry > Date.now()) {
        this.stats.memoryHits++;
        this.updateHitRate();

        if (memoryCached.compressed) {
          const decompressed = await this.decompressValue(memoryCached.value);
          return JSON.parse(decompressed);
        }
        return memoryCached.value;
      }
      this.stats.memoryMisses++;
    }

    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    const cacheKey = this.generateKey(key, options?.namespace, options?.prefix);
    const ttl = options?.ttl || this.defaultTTL;
    const stringValue = JSON.stringify(value);

    this.stats.sets++;

    // Handle compression
    const finalValue =
      options?.compress !== false ? await this.compressValue(stringValue) : stringValue;

    const isCompressed = Buffer.isBuffer(finalValue);

    // Try Redis first
    if (this.redis) {
      try {
        if (isCompressed) {
          await this.redis.setex(cacheKey, ttl, finalValue);
        } else {
          await this.redis.setex(cacheKey, ttl, finalValue);
        }

        // Handle tags for invalidation
        if (options?.tags && options.tags.length > 0) {
          await this.addToTags(cacheKey, options.tags);
        }
      } catch (error) {
        logger.warn('Redis set failed, using memory cache', error);
      }
    }

    // Also set in memory cache if Redis failed or as backup
    if (!this.redis || options?.fallbackToMemory !== false) {
      this.inMemoryCache.set(cacheKey, {
        value: isCompressed ? finalValue : value,
        expiry: Date.now() + ttl * 1000,
        compressed: isCompressed,
      });

      // Maintain memory cache size limit
      if (this.inMemoryCache.size > this.memoryMaxSize) {
        this.cleanupMemoryCache();
      }
    }
  }

  async del(key: string, options?: CacheOptions): Promise<void> {
    const cacheKey = this.generateKey(key, options?.namespace, options?.prefix);

    this.stats.deletes++;

    // Delete from Redis
    if (this.redis) {
      try {
        await this.redis.del(cacheKey);
      } catch (error) {
        logger.warn('Redis delete failed', error);
      }
    }

    // Delete from memory cache
    this.inMemoryCache.delete(cacheKey);
  }

  async invalidate(pattern: string, namespace?: string): Promise<number> {
    const prefix = namespace || this.defaultPrefix;
    const fullPattern = `${prefix}${pattern}`;
    let invalidatedCount = 0;

    // Invalidate in Redis
    if (this.redis) {
      try {
        const keys = await this.redis.keys(fullPattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          invalidatedCount += keys.length;
        }
      } catch (error) {
        logger.warn('Redis invalidate failed', error);
      }
    }

    // Invalidate in memory cache
    const memoryKeys = Array.from(this.inMemoryCache.keys()).filter(k =>
      k.match(new RegExp(fullPattern.replace(/\*/g, '.*')))
    );
    memoryKeys.forEach(key => this.inMemoryCache.delete(key));
    invalidatedCount += memoryKeys.length;

    logger.info(`Invalidated ${invalidatedCount} cache keys matching pattern: ${pattern}`);
    return invalidatedCount;
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    let invalidatedCount = 0;

    for (const tag of tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        for (const key of keys) {
          await this.del(key);
          invalidatedCount++;
        }
        this.tagIndex.delete(tag);
      }
    }

    return invalidatedCount;
  }

  private async addToTags(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    const cacheKey = this.generateKey(key, options?.namespace, options?.prefix);

    // Check Redis first
    if (this.redis) {
      try {
        const exists = await this.redis.exists(cacheKey);
        if (exists === 1) return true;
      } catch (error) {
        logger.warn('Redis exists check failed', error);
      }
    }

    // Check memory cache
    const memoryCached = this.inMemoryCache.get(cacheKey);
    return !!(memoryCached && memoryCached.expiry > Date.now());
  }

  async ttl(key: string, options?: CacheOptions): Promise<number> {
    const cacheKey = this.generateKey(key, options?.namespace, options?.prefix);

    // Check Redis first
    if (this.redis) {
      try {
        return await this.redis.ttl(cacheKey);
      } catch (error) {
        logger.warn('Redis TTL check failed', error);
      }
    }

    // Check memory cache
    const memoryCached = this.inMemoryCache.get(cacheKey);
    if (memoryCached && memoryCached.expiry > Date.now()) {
      return Math.floor((memoryCached.expiry - Date.now()) / 1000);
    }

    return -1;
  }

  async flush(): Promise<void> {
    // Flush Redis
    if (this.redis) {
      try {
        await this.redis.flushdb();
      } catch (error) {
        logger.warn('Redis flush failed', error);
      }
    }

    // Clear memory cache
    this.inMemoryCache.clear();
    this.tagIndex.clear();

    // Reset stats
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
      memoryHits: 0,
      memoryMisses: 0,
      compressionRatio: 1,
    };
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  async disconnect(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }

    this.inMemoryCache.clear();
    this.tagIndex.clear();
  }

  // Compatibility methods for easy migration
  async getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  // AI-specific compatibility method
  async getCachedResponse<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    return this.getOrSet(key, factory, { ...options, compress: true });
  }
}

// Singleton instance for backward compatibility
let instance: UnifiedCacheService | null = null;

export function getCacheService(): UnifiedCacheService {
  if (!instance) {
    instance = new UnifiedCacheService();
  }
  return instance;
}

export default UnifiedCacheService;
