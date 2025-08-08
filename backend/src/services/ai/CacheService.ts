/**
 * Caching service for AI responses to improve performance and reduce costs
 */

import crypto from 'crypto';
import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string;
  compress?: boolean;
}

export class CacheService {
  private redis: Redis | null = null;
  private inMemoryCache: Map<string, { value: any; expiry: number }> = new Map();
  private readonly defaultTTL = 300; // 5 minutes

  constructor() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times: number) => {
          if (times > 3) {
            // Fall back to in-memory cache after 3 retries
            console.warn('Redis connection failed, using in-memory cache');
            return null;
          }
          return Math.min(times * 100, 3000);
        }
      });

      this.redis.on('error', (err) => {
        console.error('Redis error:', err);
        // Continue with in-memory cache
      });
    } catch (error) {
      console.warn('Redis initialization failed, using in-memory cache');
    }
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const cacheKey = this.generateKey(key, options?.namespace);

    // Try Redis first
    if (this.redis) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        console.error('Redis get error:', error);
      }
    }

    // Fall back to in-memory cache
    const inMemory = this.inMemoryCache.get(cacheKey);
    if (inMemory && inMemory.expiry > Date.now()) {
      return inMemory.value;
    }

    // Clean up expired entry
    if (inMemory) {
      this.inMemoryCache.delete(cacheKey);
    }

    return null;
  }

  async set<T>(
    key: string,
    value: T,
    options?: CacheOptions
  ): Promise<void> {
    const cacheKey = this.generateKey(key, options?.namespace);
    const ttl = options?.ttl || this.defaultTTL;
    const serialized = JSON.stringify(value);

    // Try Redis first
    if (this.redis) {
      try {
        await this.redis.set(cacheKey, serialized, 'EX', ttl);
      } catch (error) {
        console.error('Redis set error:', error);
      }
    }

    // Always set in-memory cache as backup
    this.inMemoryCache.set(cacheKey, {
      value,
      expiry: Date.now() + (ttl * 1000)
    });

    // Cleanup old entries periodically
    this.cleanupInMemoryCache();
  }

  async delete(key: string, options?: CacheOptions): Promise<void> {
    const cacheKey = this.generateKey(key, options?.namespace);

    if (this.redis) {
      try {
        await this.redis.del(cacheKey);
      } catch (error) {
        console.error('Redis delete error:', error);
      }
    }

    this.inMemoryCache.delete(cacheKey);
  }

  async clear(namespace?: string): Promise<void> {
    if (namespace) {
      const pattern = `${namespace}:*`;
      
      if (this.redis) {
        try {
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        } catch (error) {
          console.error('Redis clear error:', error);
        }
      }

      // Clear in-memory cache for namespace
      for (const key of this.inMemoryCache.keys()) {
        if (key.startsWith(`${namespace}:`)) {
          this.inMemoryCache.delete(key);
        }
      }
    } else {
      // Clear all
      if (this.redis) {
        try {
          await this.redis.flushdb();
        } catch (error) {
          console.error('Redis flush error:', error);
        }
      }
      this.inMemoryCache.clear();
    }
  }

  /**
   * Cache wrapper for async functions
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Check cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, options);
    return result;
  }

  /**
   * Generate cache key with namespace
   */
  private generateKey(key: string, namespace?: string): string {
    const prefix = namespace || 'ai-cache';
    return `${prefix}:${key}`;
  }

  /**
   * Create cache key from function arguments
   */
  static createKey(...args: any[]): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(args));
    return hash.digest('hex');
  }

  /**
   * Cleanup expired entries from in-memory cache
   */
  private cleanupInMemoryCache(): void {
    if (this.inMemoryCache.size > 1000) {
      const now = Date.now();
      for (const [key, entry] of this.inMemoryCache.entries()) {
        if (entry.expiry <= now) {
          this.inMemoryCache.delete(key);
        }
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    inMemorySize: number;
    redisConnected: boolean;
  } {
    return {
      inMemorySize: this.inMemoryCache.size,
      redisConnected: this.redis?.status === 'ready'
    };
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
    this.inMemoryCache.clear();
  }
}

// Singleton instance
export const cache = new CacheService();