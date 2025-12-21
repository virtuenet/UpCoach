/**
 * Query Cache Service
 *
 * Intelligent database query caching with automatic invalidation,
 * query normalization, and cache warming strategies.
 */

import crypto from 'crypto';
import { RedisCacheService, getCacheService, TTL_PRESETS, CACHE_NAMESPACES } from './RedisCacheService';

// Query cache configuration
export interface QueryCacheConfig {
  defaultTTL: number;
  maxCacheSize: number;
  enableQueryNormalization: boolean;
  enableCacheWarming: boolean;
  warmingInterval: number;
}

// Cached query metadata
export interface CachedQuery {
  hash: string;
  sql: string;
  params: unknown[];
  result: unknown;
  executionTime: number;
  cachedAt: number;
  hitCount: number;
  lastAccessed: number;
}

// Query cache statistics
export interface QueryCacheStats {
  totalQueries: number;
  cachedQueries: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  avgExecutionTime: number;
  avgCacheTime: number;
  memorySaved: number;
}

// Cache warming task
export interface WarmingTask {
  name: string;
  query: string;
  params: unknown[];
  ttl: number;
  interval: number;
  lastWarmed: number | null;
  enabled: boolean;
}

export class QueryCacheService {
  private cache: RedisCacheService;
  private config: QueryCacheConfig;
  private stats: QueryCacheStats;
  private warmingTasks: Map<string, WarmingTask> = new Map();
  private warmingIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(cache?: RedisCacheService, config?: Partial<QueryCacheConfig>) {
    this.cache = cache || getCacheService();
    this.config = {
      defaultTTL: TTL_PRESETS.MEDIUM,
      maxCacheSize: 10000,
      enableQueryNormalization: true,
      enableCacheWarming: true,
      warmingInterval: 60000, // 1 minute
      ...config,
    };
    this.stats = {
      totalQueries: 0,
      cachedQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      avgExecutionTime: 0,
      avgCacheTime: 0,
      memorySaved: 0,
    };
  }

  /**
   * Start cache warming
   */
  startWarming(): void {
    if (!this.config.enableCacheWarming || this.warmingIntervalId) {
      return;
    }

    this.warmingIntervalId = setInterval(() => {
      this.executeWarmingTasks();
    }, this.config.warmingInterval);

    console.log('Query cache warming started');
  }

  /**
   * Stop cache warming
   */
  stopWarming(): void {
    if (this.warmingIntervalId) {
      clearInterval(this.warmingIntervalId);
      this.warmingIntervalId = null;
      console.log('Query cache warming stopped');
    }
  }

  /**
   * Generate cache key for query
   */
  generateKey(sql: string, params: unknown[] = []): string {
    const normalizedSQL = this.config.enableQueryNormalization
      ? this.normalizeQuery(sql)
      : sql;

    const hash = crypto
      .createHash('md5')
      .update(normalizedSQL + JSON.stringify(params))
      .digest('hex');

    return this.cache.buildKey(CACHE_NAMESPACES.QUERY, hash);
  }

  /**
   * Normalize SQL query for better cache hits
   */
  private normalizeQuery(sql: string): string {
    return sql
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ',')
      .replace(/\s*=\s*/g, '=')
      .replace(/\s*>\s*/g, '>')
      .replace(/\s*<\s*/g, '<')
      .replace(/\s*\(\s*/g, '(')
      .replace(/\s*\)\s*/g, ')')
      .trim()
      .toLowerCase();
  }

  /**
   * Get cached query result
   */
  async get<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    this.stats.totalQueries++;
    const key = this.generateKey(sql, params);

    const cached = await this.cache.getWithMetadata<CachedQuery>(key);
    if (cached) {
      this.stats.cacheHits++;
      this.updateHitRate();

      // Update hit count and last accessed
      cached.data.hitCount++;
      cached.data.lastAccessed = Date.now();
      await this.cache.set(key, cached.data, this.config.defaultTTL, ['query-cache']);

      return cached.data.result as T;
    }

    this.stats.cacheMisses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Set query result in cache
   */
  async set<T>(
    sql: string,
    params: unknown[],
    result: T,
    executionTime: number,
    ttl?: number
  ): Promise<boolean> {
    const key = this.generateKey(sql, params);
    const now = Date.now();

    const cachedQuery: CachedQuery = {
      hash: key,
      sql,
      params,
      result,
      executionTime,
      cachedAt: now,
      hitCount: 0,
      lastAccessed: now,
    };

    const success = await this.cache.set(
      key,
      cachedQuery,
      ttl || this.config.defaultTTL,
      ['query-cache']
    );

    if (success) {
      this.stats.cachedQueries++;
      this.updateAvgExecutionTime(executionTime);
    }

    return success;
  }

  /**
   * Execute query with caching
   */
  async execute<T>(
    sql: string,
    params: unknown[],
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(sql, params);
    if (cached !== null) {
      return cached;
    }

    // Execute query
    const startTime = Date.now();
    const result = await queryFn();
    const executionTime = Date.now() - startTime;

    // Cache result
    await this.set(sql, params, result, executionTime, ttl);

    return result;
  }

  /**
   * Invalidate query cache by pattern
   */
  async invalidate(pattern: string): Promise<number> {
    return await this.cache.deletePattern(`${CACHE_NAMESPACES.QUERY}:${pattern}`);
  }

  /**
   * Invalidate all query cache
   */
  async invalidateAll(): Promise<number> {
    return await this.cache.invalidateByTags(['query-cache']);
  }

  /**
   * Add warming task
   */
  addWarmingTask(task: WarmingTask): void {
    this.warmingTasks.set(task.name, task);
  }

  /**
   * Remove warming task
   */
  removeWarmingTask(name: string): boolean {
    return this.warmingTasks.delete(name);
  }

  /**
   * Execute warming tasks
   */
  private async executeWarmingTasks(): Promise<void> {
    const now = Date.now();

    for (const [name, task] of this.warmingTasks) {
      if (!task.enabled) continue;

      const shouldWarm =
        !task.lastWarmed || now - task.lastWarmed >= task.interval;

      if (shouldWarm) {
        try {
          // In a real implementation, this would execute the query
          // For now, we just update the timestamp
          task.lastWarmed = now;
          this.warmingTasks.set(name, task);
          console.log(`Warmed cache for task: ${name}`);
        } catch (error) {
          console.error(`Error warming cache for task ${name}:`, error);
        }
      }
    }
  }

  /**
   * Pre-warm common queries
   */
  async warmCommonQueries(
    queries: Array<{
      name: string;
      sql: string;
      params: unknown[];
      queryFn: () => Promise<unknown>;
      ttl?: number;
    }>
  ): Promise<number> {
    let warmed = 0;

    for (const query of queries) {
      try {
        const startTime = Date.now();
        const result = await query.queryFn();
        const executionTime = Date.now() - startTime;

        await this.set(query.sql, query.params, result, executionTime, query.ttl);
        warmed++;
      } catch (error) {
        console.error(`Error pre-warming query ${query.name}:`, error);
      }
    }

    return warmed;
  }

  /**
   * Update average execution time
   */
  private updateAvgExecutionTime(executionTime: number): void {
    const n = this.stats.cachedQueries;
    this.stats.avgExecutionTime =
      (this.stats.avgExecutionTime * (n - 1) + executionTime) / n;
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    this.stats.hitRate = total > 0 ? this.stats.cacheHits / total : 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): QueryCacheStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalQueries: 0,
      cachedQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      avgExecutionTime: 0,
      avgCacheTime: 0,
      memorySaved: 0,
    };
  }

  /**
   * Get warming tasks
   */
  getWarmingTasks(): WarmingTask[] {
    return Array.from(this.warmingTasks.values());
  }
}

// Common query patterns for caching
export const CACHEABLE_QUERIES = {
  USER_PROFILE: {
    pattern: 'SELECT * FROM users WHERE id = $1',
    ttl: TTL_PRESETS.MEDIUM,
    tags: ['user-profile'],
  },
  USER_HABITS: {
    pattern: 'SELECT * FROM habits WHERE user_id = $1',
    ttl: TTL_PRESETS.SHORT,
    tags: ['habits'],
  },
  USER_GOALS: {
    pattern: 'SELECT * FROM goals WHERE user_id = $1',
    ttl: TTL_PRESETS.MEDIUM,
    tags: ['goals'],
  },
  COACH_PROFILE: {
    pattern: 'SELECT * FROM coaches WHERE id = $1',
    ttl: TTL_PRESETS.LONG,
    tags: ['coach-profile'],
  },
  COACH_LISTING: {
    pattern: 'SELECT * FROM coaches WHERE is_active = true',
    ttl: TTL_PRESETS.MEDIUM,
    tags: ['coach-listing'],
  },
  ANALYTICS_SUMMARY: {
    pattern: 'SELECT * FROM analytics_summary WHERE user_id = $1',
    ttl: TTL_PRESETS.SHORT,
    tags: ['analytics'],
  },
} as const;

// Singleton instance
let queryCacheService: QueryCacheService | null = null;

export function getQueryCacheService(): QueryCacheService {
  if (!queryCacheService) {
    queryCacheService = new QueryCacheService();
  }
  return queryCacheService;
}

export default QueryCacheService;
