import Redis from 'ioredis';
import { logger } from '../../utils/logger';

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

export class CacheService {
  private redis: Redis;
  private defaultTTL = 3600; // 1 hour
  private prefix = 'cache:';

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
    });

    this.redis.on('connect', () => {
      logger.info('Redis cache connected');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis cache error:', error);
    });
  }

  private getKey(key: string, prefix?: string): string {
    return `${prefix || this.prefix}${key}`;
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const fullKey = this.getKey(key, options?.prefix);
      const data = await this.redis.get(fullKey);
      
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    try {
      const fullKey = this.getKey(key, options?.prefix);
      const ttl = options?.ttl || this.defaultTTL;
      
      await this.redis.setex(fullKey, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async del(key: string, options?: CacheOptions): Promise<void> {
    try {
      const fullKey = this.getKey(key, options?.prefix);
      await this.redis.del(fullKey);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.prefix}${pattern}`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      logger.error('Cache invalidate error:', error);
    }
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.getKey(key, options?.prefix);
      const exists = await this.redis.exists(fullKey);
      return exists === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  async ttl(key: string, options?: CacheOptions): Promise<number> {
    try {
      const fullKey = this.getKey(key, options?.prefix);
      return await this.redis.ttl(fullKey);
    } catch (error) {
      logger.error('Cache TTL error:', error);
      return -1;
    }
  }

  async flush(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.prefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info(`Flushed ${keys.length} cache keys`);
      }
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  }

  // Decorator for caching method results
  cache(options?: CacheOptions) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
        
        // Try to get from cache
        const cached = await this.get(cacheKey, options);
        if (cached !== null) {
          logger.debug(`Cache hit for ${cacheKey}`);
          return cached;
        }

        // Execute original method
        const result = await originalMethod.apply(this, args);
        
        // Store in cache
        await this.set(cacheKey, result, options);
        logger.debug(`Cache set for ${cacheKey}`);
        
        return result;
      }.bind(this);

      return descriptor;
    };
  }

  // Get or set pattern
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, options);
    return value;
  }

  // Batch operations
  async mget<T>(keys: string[], options?: CacheOptions): Promise<(T | null)[]> {
    try {
      const fullKeys = keys.map(key => this.getKey(key, options?.prefix));
      const values = await this.redis.mget(...fullKeys);
      
      return values.map(value => {
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      });
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset(items: { key: string; value: any }[], options?: CacheOptions): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      const ttl = options?.ttl || this.defaultTTL;
      
      items.forEach(({ key, value }) => {
        const fullKey = this.getKey(key, options?.prefix);
        pipeline.setex(fullKey, ttl, JSON.stringify(value));
      });
      
      await pipeline.exec();
    } catch (error) {
      logger.error('Cache mset error:', error);
    }
  }
}

export const cacheService = new CacheService();