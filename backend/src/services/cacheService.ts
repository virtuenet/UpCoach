// Advanced Caching Service with Redis
import Redis from 'ioredis'
import { createHash } from 'crypto'
import { logger } from '../utils/logger'

interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
  compress?: boolean // Compress large values
  namespace?: string // Cache namespace
}

interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  hitRate: number
}

class CacheService {
  private redis: Redis
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
  }
  private defaultTTL = 3600 // 1 hour
  private maxRetries = 3

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times) => {
        if (times > this.maxRetries) {
          logger.error('Redis connection failed after maximum retries')
          return null
        }
        return Math.min(times * 50, 2000)
      },
    })

    this.redis.on('error', (err) => {
      logger.error('Redis error:', err)
    })

    this.redis.on('connect', () => {
      logger.info('Redis connected successfully')
    })

    // Start stats reporting
    this.startStatsReporting()
  }

  // Generate cache key
  private generateKey(key: string, namespace?: string): string {
    const prefix = namespace || 'cache'
    return `${prefix}:${key}`
  }

  // Hash complex keys
  private hashKey(data: any): string {
    const hash = createHash('sha256')
    hash.update(JSON.stringify(data))
    return hash.digest('hex')
  }

  // Get value from cache
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(key, options?.namespace)
      const value = await this.redis.get(cacheKey)

      if (value === null) {
        this.stats.misses++
        this.updateHitRate()
        return null
      }

      this.stats.hits++
      this.updateHitRate()

      // Decompress if needed
      if (options?.compress) {
        return this.decompress(value)
      }

      return JSON.parse(value)
    } catch (error) {
      logger.error('Cache get error:', error)
      return null
    }
  }

  // Set value in cache
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, options?.namespace)
      const ttl = options?.ttl || this.defaultTTL

      let serializedValue = JSON.stringify(value)

      // Compress if needed
      if (options?.compress) {
        serializedValue = await this.compress(serializedValue)
      }

      // Set with expiration
      await this.redis.setex(cacheKey, ttl, serializedValue)

      // Handle tags
      if (options?.tags && options.tags.length > 0) {
        await this.addToTags(cacheKey, options.tags)
      }

      this.stats.sets++
      return true
    } catch (error) {
      logger.error('Cache set error:', error)
      return false
    }
  }

  // Delete from cache
  async delete(key: string, namespace?: string): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, namespace)
      const result = await this.redis.del(cacheKey)
      this.stats.deletes++
      return result === 1
    } catch (error) {
      logger.error('Cache delete error:', error)
      return false
    }
  }

  // Delete by pattern
  async deletePattern(pattern: string, namespace?: string): Promise<number> {
    try {
      const searchPattern = this.generateKey(pattern, namespace)
      const keys = await this.redis.keys(searchPattern)
      
      if (keys.length === 0) {
        return 0
      }

      const result = await this.redis.del(...keys)
      this.stats.deletes += result
      return result
    } catch (error) {
      logger.error('Cache delete pattern error:', error)
      return 0
    }
  }

  // Invalidate by tags
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      const keysToDelete: string[] = []

      for (const tag of tags) {
        const tagKey = `tags:${tag}`
        const keys = await this.redis.smembers(tagKey)
        keysToDelete.push(...keys)
        await this.redis.del(tagKey)
      }

      if (keysToDelete.length === 0) {
        return 0
      }

      const uniqueKeys = [...new Set(keysToDelete)]
      const result = await this.redis.del(...uniqueKeys)
      this.stats.deletes += result
      return result
    } catch (error) {
      logger.error('Cache invalidate by tags error:', error)
      return 0
    }
  }

  // Remember function - cache function results
  async remember<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options)
    if (cached !== null) {
      return cached
    }

    // Execute function and cache result
    const result = await fn()
    await this.set(key, result, options)
    return result
  }

  // Cache decorator for methods
  cacheMethod(options?: CacheOptions) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value

      descriptor.value = async function (...args: any[]) {
        const key = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`
        const hashedKey = this.hashKey({ class: target.constructor.name, method: propertyName, args })

        return await this.remember(
          hashedKey,
          () => originalMethod.apply(this, args),
          options
        )
      }

      return descriptor
    }
  }

  // Warm up cache
  async warmUp(data: Record<string, any>, options?: CacheOptions): Promise<void> {
    const promises = Object.entries(data).map(([key, value]) =>
      this.set(key, value, options)
    )
    await Promise.all(promises)
    logger.info(`Cache warmed up with ${Object.keys(data).length} entries`)
  }

  // Clear all cache
  async flush(): Promise<void> {
    try {
      await this.redis.flushdb()
      logger.info('Cache flushed successfully')
    } catch (error) {
      logger.error('Cache flush error:', error)
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats }
  }

  // Reset statistics
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
    }
  }

  // Private helper methods
  private async addToTags(key: string, tags: string[]): Promise<void> {
    const promises = tags.map(tag => {
      const tagKey = `tags:${tag}`
      return this.redis.sadd(tagKey, key)
    })
    await Promise.all(promises)
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    if (total > 0) {
      this.stats.hitRate = (this.stats.hits / total) * 100
    }
  }

  private async compress(data: string): Promise<string> {
    // Implement compression logic (e.g., using zlib)
    // For now, return as-is
    return data
  }

  private decompress(data: string): any {
    // Implement decompression logic
    // For now, parse as-is
    return JSON.parse(data)
  }

  private startStatsReporting(): void {
    setInterval(() => {
      if (this.stats.hits + this.stats.misses > 0) {
        logger.info('Cache stats:', this.stats)
      }
    }, 60000) // Report every minute
  }

  // Cache strategies
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    return this.remember(key, fn, options)
  }

  // Stale-while-revalidate pattern
  async staleWhileRevalidate<T>(
    key: string,
    fn: () => Promise<T>,
    staleTime: number,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<{ data: T; timestamp: number }>(key, options)

    if (cached) {
      const age = Date.now() - cached.timestamp
      
      // Return cached data immediately
      if (age < staleTime * 1000) {
        return cached.data
      }

      // Return stale data but refresh in background
      this.refreshInBackground(key, fn, options)
      return cached.data
    }

    // No cache, fetch and store
    const data = await fn()
    await this.set(key, { data, timestamp: Date.now() }, options)
    return data
  }

  private async refreshInBackground<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<void> {
    try {
      const data = await fn()
      await this.set(key, { data, timestamp: Date.now() }, options)
    } catch (error) {
      logger.error('Background refresh error:', error)
    }
  }

  // Circuit breaker pattern for cache
  async withCircuitBreaker<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions & { maxFailures?: number; resetTimeout?: number }
  ): Promise<T | null> {
    const maxFailures = options?.maxFailures || 5
    const resetTimeout = options?.resetTimeout || 60000 // 1 minute

    const failureKey = `circuit:${key}`
    const failures = parseInt(await this.redis.get(failureKey) || '0')

    if (failures >= maxFailures) {
      logger.warn(`Circuit breaker open for key: ${key}`)
      return null
    }

    try {
      const result = await this.remember(key, fn, options)
      await this.redis.del(failureKey) // Reset on success
      return result
    } catch (error) {
      await this.redis.incr(failureKey)
      await this.redis.expire(failureKey, resetTimeout / 1000)
      throw error
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService()

// Export cache decorator
export const cache = (options?: CacheOptions) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const key = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`
      const hashedKey = cacheService['hashKey']({ 
        class: target.constructor.name, 
        method: propertyName, 
        args 
      })

      return await cacheService.remember(
        hashedKey,
        () => originalMethod.apply(this, args),
        options
      )
    }

    return descriptor
  }
}

// Export cache utilities
export const clearCache = () => cacheService.flush()
export const getCacheStats = () => cacheService.getStats()
export const invalidateTags = (tags: string[]) => cacheService.invalidateByTags(tags)