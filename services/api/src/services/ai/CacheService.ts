import { logger } from '../../utils/logger';
import { Redis } from 'ioredis';

interface CacheConfig {
  defaultTTL: number; // seconds
  maxKeySize: number;
  maxValueSize: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  serialize?: boolean; // Whether to JSON.stringify the value
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

/**
 * High-performance caching service for AI operations
 * Supports both in-memory and Redis caching with intelligent fallback
 */
export class CacheService {
  private memoryCache: Map<string, { value: unknown; expires: number; size: number }>;
  private redis: Redis | null = null;
  private config: CacheConfig;
  private stats: CacheStats;
  private isRedisAvailable: boolean = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 600, // 10 minutes
      maxKeySize: 250,
      maxValueSize: 1024 * 1024, // 1MB
      ...config,
    };

    this.memoryCache = new Map();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0 };

    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      } as unknown);

      this.redis.on('connect', () => {
        this.isRedisAvailable = true;
        logger.info('Cache service connected to Redis');
      });

      this.redis.on('error', (error) => {
        this.isRedisAvailable = false;
        this.stats.errors++;
        logger.warn('Redis connection error, falling back to memory cache:', error);
      });

      // Test connection
      await this.redis.ping();
      this.isRedisAvailable = true;
    } catch (error) {
      this.isRedisAvailable = false;
      logger.warn('Redis not available, using memory cache only:', error);
    }
  }

  /**
   * Get value from cache with intelligent fallback
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      
      // Try Redis first if available
      if (this.isRedisAvailable && this.redis) {
        try {
          const value = await this.redis.get(fullKey);
          if (value !== null) {
            this.stats.hits++;
            return options.serialize !== false ? JSON.parse(value) as T : (value as unknown as T);
          }
        } catch (error) {
          this.stats.errors++;
          logger.warn('Redis get error, trying memory cache:', error);
        }
      }

      // Fallback to memory cache
      const cached = this.memoryCache.get(fullKey);
      if (cached && cached.expires > Date.now()) {
        this.stats.hits++;
        return cached.value;
      }

      // Clean up expired memory cache entry
      if (cached && cached.expires <= Date.now()) {
        this.memoryCache.delete(fullKey);
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache with intelligent distribution
   */
  async set(key: string, value: unknown, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      const ttl = options.ttl || this.config.defaultTTL;
      const serializedValue = options.serialize !== false ? JSON.stringify(value) : value;
      
      // Validate sizes
      if (fullKey.length > this.config.maxKeySize) {
        logger.warn('Cache key too large:', fullKey.length);
        return false;
      }

      if (serializedValue.length > this.config.maxValueSize) {
        logger.warn('Cache value too large:', serializedValue.length);
        return false;
      }

      let success = false;

      // Try Redis first if available
      if (this.isRedisAvailable && this.redis) {
        try {
          await this.redis.setex(fullKey, ttl, serializedValue);
          success = true;
        } catch (error) {
          this.stats.errors++;
          logger.warn('Redis set error, using memory cache:', error);
        }
      }

      // Also store in memory cache for faster access
      const expires = Date.now() + (ttl * 1000);
      this.memoryCache.set(fullKey, {
        value: options.serialize !== false ? value : serializedValue,
        expires,
        size: serializedValue.length,
      });

      // Cleanup memory cache if it gets too large
      this.cleanupMemoryCache();

      this.stats.sets++;
      return success || true; // Return true if at least memory cache succeeded
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete from cache
   */
  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      let success = false;

      // Delete from Redis
      if (this.isRedisAvailable && this.redis) {
        try {
          const result = await this.redis.del(fullKey);
          success = result > 0;
        } catch (error) {
          this.stats.errors++;
          logger.warn('Redis delete error:', error);
        }
      }

      // Delete from memory cache
      const memSuccess = this.memoryCache.delete(fullKey);
      
      this.stats.deletes++;
      return success || memSuccess;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Get or compute value with caching
   */
  async getOrSet<T>(
    key: string,
    computeFn: () => Promise<T> | T,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const value = await computeFn();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Clear specific pattern of keys
   */
  async clearPattern(pattern: string): Promise<number> {
    let cleared = 0;

    try {
      // Clear from Redis
      if (this.isRedisAvailable && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          cleared += await this.redis.del(...keys);
        }
      }

      // Clear from memory cache
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      for (const [key] of this.memoryCache) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
          cleared++;
        }
      }
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache clear pattern error:', error);
    }

    return cleared;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number; memoryUsage: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    const memoryUsage = Array.from(this.memoryCache.values()).reduce(
      (sum, item) => sum + item.size,
      0
    );

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage,
    };
  }

  /**
   * Health check for cache service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    redis: boolean;
    memory: boolean;
    stats: ReturnType<CacheService['getStats']>;
  }> {
    const memoryHealthy = this.memoryCache.size < 10000; // Reasonable limit
    let redisHealthy = false;

    if (this.redis) {
      try {
        await this.redis.ping();
        redisHealthy = true;
      } catch {
        redisHealthy = false;
      }
    }

    const status = 
      redisHealthy && memoryHealthy ? 'healthy' :
      memoryHealthy ? 'degraded' : 'unhealthy';

    return {
      status,
      redis: redisHealthy,
      memory: memoryHealthy,
      stats: this.getStats(),
    };
  }

  private buildKey(key: string, prefix?: string): string {
    const parts = ['upcoach', 'ai'];
    if (prefix) parts.push(prefix);
    parts.push(key);
    return parts.join(':');
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    let cleaned = 0;

    // Remove expired entries
    for (const [key, item] of this.memoryCache) {
      if (item.expires <= now) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    // If cache is still too large, remove oldest entries
    if (this.memoryCache.size > 1000) {
      const entries = Array.from(this.memoryCache.entries()).sort(
        (a, b) => a[1].expires - b[1].expires
      );
      
      const toRemove = entries.slice(0, entries.length - 800);
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
      cleaned += toRemove.length;
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired cache entries`);
    }
  }
}

// Singleton instance for application-wide use
export const cacheService = new CacheService({
  defaultTTL: 600, // 10 minutes
  maxKeySize: 250,
  maxValueSize: 1024 * 1024, // 1MB
});

/**
 * Cache decorator for methods
 */
export function Cached(options: CacheOptions & { keyPrefix?: string } = {}) {
  return function (target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: unknown[]) {
      const keyPrefix = options.keyPrefix || `${target.constructor.name}:${propertyName}`;
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;
      
      return await cacheService.getOrSet(
        cacheKey,
        () => method.apply(this, args),
        options
      );
    };
    
    return descriptor;
  };
}