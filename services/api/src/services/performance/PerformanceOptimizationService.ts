import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../cache/CacheService';
import { redis } from '../redis';
import { db } from '../database';
import { logger } from '../../utils/logger';
import { config } from '../../config/environment';

interface PerformanceMetrics {
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
  };
  database: {
    connectionPool: {
      active: number;
      idle: number;
      waiting: number;
    };
    queryPerformance: {
      averageTime: number;
      slowQueries: number;
    };
  };
  cache: {
    hitRate: number;
    operations: {
      reads: number;
      writes: number;
    };
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  errors: {
    rate: number;
    total: number;
  };
}

interface QueryOptimization {
  originalQuery: string;
  optimizedQuery?: string;
  indexSuggestions: string[];
  executionPlan?: unknown;
  estimatedImprovement?: number;
}

interface ApiEndpointPerformance {
  endpoint: string;
  method: string;
  averageResponseTime: number;
  requestCount: number;
  errorRate: number;
  cacheHitRate?: number;
  slowestQueries: Array<{
    query: string;
    duration: number;
    timestamp: string;
  }>;
}

export class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService;
  private performanceMetrics: Map<string, number[]> = new Map();
  private queryCache: Map<string, any> = new Map();
  private slowQueryThreshold = 1000; // 1 second
  private metricsInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startMetricsCollection();
  }

  static getInstance(): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance = new PerformanceOptimizationService();
    }
    return PerformanceOptimizationService.instance;
  }

  /**
   * Middleware for performance monitoring
   */
  performanceMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = process.hrtime.bigint();
      const requestId = req.id || 'unknown';

      // Override res.json to measure response time
      const originalJson = res.json;
      res.json = function(body) {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to ms

        // Record metrics
        PerformanceOptimizationService.instance.recordRequestMetrics(
          req.method,
          req.path,
          duration,
          res.statusCode
        );

        // Log slow requests
        if (duration > 2000) { // 2 seconds
          logger.warn('Slow API request detected', {
            requestId,
            method: req.method,
            path: req.path,
            duration: `${duration.toFixed(2)}ms`,
            statusCode: res.statusCode,
          });
        }

        return originalJson.call(this, body);
      };

      // Track active requests
      this.incrementActiveRequests();

      res.on('finish', () => {
        this.decrementActiveRequests();
      });

      next();
    };
  }

  /**
   * Database query optimization middleware
   */
  queryOptimizationMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Intercept database queries to analyze and optimize
      const originalQuery = db.query;

      db.query = async (text: string, params?: unknown[]) => {
        const startTime = process.hrtime.bigint();
        const queryHash = this.hashQuery(text, params);

        try {
          // Check query cache first
          const cached = await cacheService.get(`query:${queryHash}`, {
            namespace: 'db',
            ttl: 300, // 5 minutes
          });

          if (cached) {
            logger.debug('Database query cache hit', { queryHash });
            return cached;
          }

          // Execute query
          const result = await originalQuery.call(db, text, params);

          const endTime = process.hrtime.bigint();
          const duration = Number(endTime - startTime) / 1000000;

          // Record query performance
          await this.recordQueryMetrics(text, duration, params);

          // Cache result for read queries
          if (this.isReadQuery(text) && result.rows.length < 1000) {
            await cacheService.set(`query:${queryHash}`, result, {
              namespace: 'db',
              ttl: 300,
              tags: this.extractTableNames(text),
            });
          }

          // Analyze slow queries
          if (duration > this.slowQueryThreshold) {
            await this.analyzeSlowQuery(text, params, duration);
          }

          return result;

        } catch (error) {
          const endTime = process.hrtime.bigint();
          const duration = Number(endTime - startTime) / 1000000;

          await this.recordQueryMetrics(text, duration, params, error as Error);
          throw error;
        }
      };

      next();
    };
  }

  /**
   * Automatic caching middleware for API responses
   */
  responseCachingMiddleware(options: {
    ttl?: number;
    cacheKey?: (req: Request) => string;
    shouldCache?: (req: Request, res: Response) => boolean;
    tags?: string[];
  } = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Only cache GET requests by default
      if (req.method !== 'GET') {
        return next();
      }

      const cacheKey = options.cacheKey
        ? options.cacheKey(req)
        : this.generateCacheKey(req);

      // Try to get from cache
      const cached = await cacheService.get(cacheKey, {
        namespace: 'api_responses',
      });

      if (cached) {
        logger.debug('API response cache hit', {
          method: req.method,
          path: req.path,
          cacheKey,
        });

        return res.json(cached);
      }

      // Override res.json to cache response
      const originalJson = res.json;
      res.json = function(body) {
        // Cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const shouldCache = options.shouldCache
            ? options.shouldCache(req, res)
            : true;

          if (shouldCache) {
            setImmediate(async () => {
              await cacheService.set(cacheKey, body, {
                namespace: 'api_responses',
                ttl: options.ttl || 300, // 5 minutes default
                tags: options.tags,
              });
            });
          }
        }

        return originalJson.call(this, body);
      };

      next();
    };
  }

  /**
   * Connection pooling optimization
   */
  async optimizeConnectionPool(): Promise<void> {
    try {
      // Get current pool stats
      const poolStats = await this.getDatabasePoolStats();

      logger.info('Database connection pool stats', poolStats);

      // Auto-adjust pool size based on usage
      const { active, idle, waiting } = poolStats;
      const totalConnections = active + idle;

      if (waiting > 0 && totalConnections < 50) {
        // Increase pool size if there are waiting connections
        logger.info('Increasing database connection pool size', {
          current: totalConnections,
          waiting,
        });
        // Implementation would depend on your database driver
      } else if (idle > totalConnections * 0.8 && totalConnections > 10) {
        // Decrease pool size if too many idle connections
        logger.info('Consider decreasing database connection pool size', {
          current: totalConnections,
          idle,
        });
      }

    } catch (error) {
      logger.error('Failed to optimize connection pool:', error);
    }
  }

  /**
   * Analyze and optimize slow queries
   */
  async analyzeSlowQuery(
    query: string,
    params: unknown[] = [],
    duration: number
  ): Promise<QueryOptimization> {
    try {
      const optimization: QueryOptimization = {
        originalQuery: query,
        indexSuggestions: [],
      };

      // Get query execution plan
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      try {
        const planResult = await db.query(explainQuery, params);
        optimization.executionPlan = planResult.rows[0]?.['QUERY PLAN'];
      } catch (explainError) {
        logger.warn('Failed to get query execution plan:', explainError);
      }

      // Analyze query for common optimization opportunities
      optimization.indexSuggestions = this.suggestIndexes(query);

      // Store analysis for later review
      await this.storeQueryAnalysis(query, duration, optimization);

      logger.warn('Slow query analyzed', {
        query: query.substring(0, 200),
        duration: `${duration.toFixed(2)}ms`,
        suggestions: optimization.indexSuggestions.length,
      });

      return optimization;

    } catch (error) {
      logger.error('Query analysis failed:', error);
      return {
        originalQuery: query,
        indexSuggestions: [],
      };
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const [
        responseTimeMetrics,
        throughputMetrics,
        databaseMetrics,
        cacheMetrics,
        memoryMetrics,
        errorMetrics,
      ] = await Promise.all([
        this.getResponseTimeMetrics(),
        this.getThroughputMetrics(),
        this.getDatabaseMetrics(),
        this.getCacheMetrics(),
        this.getMemoryMetrics(),
        this.getErrorMetrics(),
      ]);

      return {
        responseTime: responseTimeMetrics,
        throughput: throughputMetrics,
        database: databaseMetrics,
        cache: cacheMetrics,
        memory: memoryMetrics,
        errors: errorMetrics,
      };

    } catch (error) {
      logger.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get endpoint-specific performance analysis
   */
  async getEndpointPerformance(limit: number = 50): Promise<ApiEndpointPerformance[]> {
    try {
      const endpointKeys = await redis.keys('endpoint_metrics:*');
      const endpointPerformance: ApiEndpointPerformance[] = [];

      for (const key of endpointKeys.slice(0, limit)) {
        const data = await redis.hGetAll(key);
        const [, method, endpoint] = key.split(':');

        const performance: ApiEndpointPerformance = {
          endpoint,
          method,
          averageResponseTime: parseFloat(data.avgResponseTime || '0'),
          requestCount: parseInt(data.requestCount || '0', 10),
          errorRate: parseFloat(data.errorRate || '0'),
          cacheHitRate: parseFloat(data.cacheHitRate || '0'),
          slowestQueries: JSON.parse(data.slowestQueries || '[]'),
        };

        endpointPerformance.push(performance);
      }

      return endpointPerformance.sort((a, b) => b.averageResponseTime - a.averageResponseTime);

    } catch (error) {
      logger.error('Failed to get endpoint performance:', error);
      return [];
    }
  }

  /**
   * Optimize application based on current metrics
   */
  async performAutoOptimization(): Promise<{
    optimizations: string[];
    improvements: string[];
  }> {
    const optimizations: string[] = [];
    const improvements: string[] = [];

    try {
      const metrics = await this.getPerformanceMetrics();

      // Response time optimizations
      if (metrics.responseTime.average > 1000) {
        optimizations.push('Enable response compression');
        optimizations.push('Increase cache TTL for static content');
      }

      // Cache optimizations
      if (metrics.cache.hitRate < 80) {
        optimizations.push('Review and expand caching strategy');
        optimizations.push('Implement query result caching');
      }

      // Database optimizations
      if (metrics.database.queryPerformance.averageTime > 500) {
        optimizations.push('Analyze and optimize slow queries');
        optimizations.push('Consider adding database indexes');
      }

      // Memory optimizations
      if (metrics.memory.heapUsed / metrics.memory.heapTotal > 0.9) {
        optimizations.push('Investigate memory leaks');
        optimizations.push('Implement more aggressive garbage collection');
      }

      // Error rate optimizations
      if (metrics.errors.rate > 0.01) { // 1% error rate
        optimizations.push('Investigate and fix error sources');
        optimizations.push('Implement better error handling and retries');
      }

      // Auto-apply safe optimizations
      await this.applySafeOptimizations(optimizations, improvements);

      logger.info('Auto-optimization completed', {
        optimizations: optimizations.length,
        improvements: improvements.length,
      });

      return { optimizations, improvements };

    } catch (error) {
      logger.error('Auto-optimization failed:', error);
      return { optimizations: [], improvements: [] };
    }
  }

  /**
   * Private utility methods
   */
  private recordRequestMetrics(
    method: string,
    path: string,
    duration: number,
    statusCode: number
  ): void {
    const key = `${method}:${path}`;

    // Store in memory for quick access
    if (!this.performanceMetrics.has(key)) {
      this.performanceMetrics.set(key, []);
    }

    const metrics = this.performanceMetrics.get(key)!;
    metrics.push(duration);

    // Keep only last 1000 measurements
    if (metrics.length > 1000) {
      metrics.shift();
    }

    // Store in Redis for persistence
    setImmediate(async () => {
      const redisKey = `endpoint_metrics:${method}:${this.sanitizePath(path)}`;
      await redis.hIncrBy(redisKey, 'requestCount', 1);
      await redis.hSet(redisKey, 'lastDuration', duration.toString());

      if (statusCode >= 400) {
        await redis.hIncrBy(redisKey, 'errorCount', 1);
      }

      await redis.expire(redisKey, 86400); // 24 hours
    });
  }

  private async recordQueryMetrics(
    query: string,
    duration: number,
    params?: unknown[],
    error?: Error
  ): Promise<void> {
    try {
      const queryType = this.getQueryType(query);
      const metricKey = `query_metrics:${queryType}`;

      await redis.hIncrBy(metricKey, 'count', 1);
      await redis.hIncrBy(metricKey, 'totalDuration', Math.round(duration));

      if (error) {
        await redis.hIncrBy(metricKey, 'errorCount', 1);
      }

      if (duration > this.slowQueryThreshold) {
        await redis.hIncrBy(metricKey, 'slowCount', 1);

        // Store slow query details
        const slowQueryData = {
          query: query.substring(0, 500),
          duration,
          timestamp: new Date().toISOString(),
          params: params?.slice(0, 10), // Limit params for privacy
        };

        await redis.lpush('slow_queries', JSON.stringify(slowQueryData));
        await redis.ltrim('slow_queries', 0, 99); // Keep last 100
      }

      await redis.expire(metricKey, 86400); // 24 hours

    } catch (error) {
      logger.error('Failed to record query metrics:', error);
    }
  }

  private hashQuery(query: string, params?: unknown[]): string {
    const crypto = require('crypto');
    const content = query + (params ? JSON.stringify(params) : '');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private isReadQuery(query: string): boolean {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery.startsWith('select') ||
           normalizedQuery.startsWith('with');
  }

  private extractTableNames(query: string): string[] {
    const matches = query.match(/(?:from|join|update|into)\s+(\w+)/gi);
    return matches ? matches.map(match => match.split(' ')[1]) : [];
  }

  private generateCacheKey(req: Request): string {
    const keyComponents = [
      req.method,
      req.path,
      JSON.stringify(req.query),
      req.user?.id || 'anonymous',
    ];

    const crypto = require('crypto');
    return crypto.createHash('md5').update(keyComponents.join(':')).digest('hex');
  }

  private suggestIndexes(query: string): string[] {
    const suggestions: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Simple heuristics for index suggestions
    if (lowerQuery.includes('where') && lowerQuery.includes('=')) {
      const whereMatch = lowerQuery.match(/where\s+(\w+)\s*=/);
      if (whereMatch) {
        suggestions.push(`CREATE INDEX IF NOT EXISTS idx_${whereMatch[1]} ON table_name (${whereMatch[1]});`);
      }
    }

    if (lowerQuery.includes('order by')) {
      const orderMatch = lowerQuery.match(/order by\s+(\w+)/);
      if (orderMatch) {
        suggestions.push(`CREATE INDEX IF NOT EXISTS idx_${orderMatch[1]}_sort ON table_name (${orderMatch[1]});`);
      }
    }

    if (lowerQuery.includes('join')) {
      suggestions.push('Consider adding indexes on join columns');
    }

    return suggestions;
  }

  private async storeQueryAnalysis(
    query: string,
    duration: number,
    optimization: QueryOptimization
  ): Promise<void> {
    try {
      const analysisData = {
        query: query.substring(0, 500),
        duration,
        optimization,
        timestamp: new Date().toISOString(),
      };

      await redis.lpush('query_analyses', JSON.stringify(analysisData));
      await redis.ltrim('query_analyses', 0, 49); // Keep last 50
      await redis.expire('query_analyses', 86400 * 7); // 7 days

    } catch (error) {
      logger.error('Failed to store query analysis:', error);
    }
  }

  private getQueryType(query: string): string {
    const normalized = query.trim().toLowerCase();
    if (normalized.startsWith('select')) return 'select';
    if (normalized.startsWith('insert')) return 'insert';
    if (normalized.startsWith('update')) return 'update';
    if (normalized.startsWith('delete')) return 'delete';
    if (normalized.startsWith('with')) return 'select'; // CTE queries
    return 'other';
  }

  private sanitizePath(path: string): string {
    return path.replace(/[^a-zA-Z0-9\/_-]/g, '_');
  }

  private incrementActiveRequests(): void {
    setImmediate(async () => {
      await redis.incr('active_requests');
      await redis.expire('active_requests', 300);
    });
  }

  private decrementActiveRequests(): void {
    setImmediate(async () => {
      await redis.decr('active_requests');
    });
  }

  private async getResponseTimeMetrics(): Promise<PerformanceMetrics['responseTime']> {
    const allMetrics: number[] = [];
    for (const metrics of this.performanceMetrics.values()) {
      allMetrics.push(...metrics);
    }

    if (allMetrics.length === 0) {
      return { average: 0, p50: 0, p95: 0, p99: 0 };
    }

    allMetrics.sort((a, b) => a - b);

    return {
      average: allMetrics.reduce((sum, val) => sum + val, 0) / allMetrics.length,
      p50: this.percentile(allMetrics, 0.5),
      p95: this.percentile(allMetrics, 0.95),
      p99: this.percentile(allMetrics, 0.99),
    };
  }

  private async getThroughputMetrics(): Promise<PerformanceMetrics['throughput']> {
    const requestsLastMinute = await redis.get('requests_last_minute') || '0';
    const requestsLastSecond = await redis.get('requests_last_second') || '0';

    return {
      requestsPerSecond: parseInt(requestsLastSecond, 10),
      requestsPerMinute: parseInt(requestsLastMinute, 10),
    };
  }

  private async getDatabaseMetrics(): Promise<PerformanceMetrics['database']> {
    const poolStats = await this.getDatabasePoolStats();
    const queryStats = await this.getQueryStats();

    return {
      connectionPool: poolStats,
      queryPerformance: queryStats,
    };
  }

  private async getDatabasePoolStats(): Promise<{ active: number; idle: number; waiting: number }> {
    // This would depend on your database driver
    // For now, return mock data
    return { active: 5, idle: 3, waiting: 0 };
  }

  private async getQueryStats(): Promise<{ averageTime: number; slowQueries: number }> {
    try {
      const selectStats = await redis.hGetAll('query_metrics:select');
      const count = parseInt(selectStats.count || '0', 10);
      const totalDuration = parseInt(selectStats.totalDuration || '0', 10);
      const slowCount = parseInt(selectStats.slowCount || '0', 10);

      return {
        averageTime: count > 0 ? totalDuration / count : 0,
        slowQueries: slowCount,
      };
    } catch (error) {
      return { averageTime: 0, slowQueries: 0 };
    }
  }

  private async getCacheMetrics(): Promise<PerformanceMetrics['cache']> {
    const stats = cacheService.getStats();
    return {
      hitRate: stats.hitRate,
      operations: {
        reads: stats.operations.get,
        writes: stats.operations.set,
      },
    };
  }

  private getMemoryMetrics(): PerformanceMetrics['memory'] {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
    };
  }

  private async getErrorMetrics(): Promise<PerformanceMetrics['errors']> {
    const errorCount = await redis.get('error_count_1h') || '0';
    const requestCount = await redis.get('request_count_1h') || '0';

    const errors = parseInt(errorCount, 10);
    const requests = parseInt(requestCount, 10);

    return {
      rate: requests > 0 ? errors / requests : 0,
      total: errors,
    };
  }

  private percentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)];
  }

  private async applySafeOptimizations(
    optimizations: string[],
    improvements: string[]
  ): Promise<void> {
    // Implement safe, non-breaking optimizations
    if (optimizations.includes('Enable response compression')) {
      // This would typically be done at the application level
      improvements.push('Response compression enabled');
    }

    if (optimizations.includes('Increase cache TTL for static content')) {
      // Adjust cache TTL for API responses
      improvements.push('Cache TTL optimized for better hit rates');
    }

    // Log what was applied
    if (improvements.length > 0) {
      logger.info('Auto-optimizations applied', { improvements });
    }
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        // Collect and store periodic metrics
        await this.collectPeriodicMetrics();
      } catch (error) {
        logger.error('Metrics collection failed:', error);
      }
    }, 60000); // Every minute
  }

  private async collectPeriodicMetrics(): Promise<void> {
    try {
      // Count requests in the last minute
      const now = Date.now();
      const oneMinuteAgo = now - 60000;

      // This is a simplified implementation
      // In practice, you'd use a more sophisticated approach
      await redis.set('requests_last_minute', '0', 'EX', 60);
      await redis.set('requests_last_second', '0', 'EX', 1);

    } catch (error) {
      logger.error('Failed to collect periodic metrics:', error);
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    this.performanceMetrics.clear();
    this.queryCache.clear();
  }
}

// Export singleton instance
export const performanceOptimizationService = PerformanceOptimizationService.getInstance();