import { performance } from 'perf_hooks';

import { Sequelize, QueryTypes, Transaction } from 'sequelize';

import { trackDatabaseQuery } from '../../middleware/performance';
import { logger } from '../../utils/logger';
import { getCacheService } from '../cache/UnifiedCacheService';

interface QueryPlan {
  query: string;
  cost: number;
  rows: number;
  width: number;
  actualTime: number;
}

interface QueryStats {
  executionTime: number;
  rowsAffected: number;
  cached: boolean;
  queryPlan?: QueryPlan;
}

export class QueryOptimizer {
  private sequelize: Sequelize;
  private slowQueryThreshold = 100; // ms
  private queryCache = new Map<string, { result: unknown; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
    this.setupQueryLogging();
  }

  private setupQueryLogging() {
    // Log slow queries
    (this.sequelize as unknown).options.logging = (sql: string, timing?: number) => {
      if (timing && timing > this.slowQueryThreshold) {
        logger.warn('Slow query detected', {
          sql: sql.substring(0, 500),
          duration: `${timing}ms`,
        });
      }
    };

    // Benchmark mode for development
    if (process.env.NODE_ENV === 'development') {
      (this.sequelize as unknown).options.benchmark = true;
    }
  }

  // Execute query with caching and monitoring
  async executeQuery<T extends object = any>(
    sql: string,
    options: {
      replacements?: unknown;
      type?: QueryTypes;
      transaction?: Transaction;
      cache?: boolean;
      cacheKey?: string;
      cacheTTL?: number;
    } = {}
  ): Promise<{ result: T; stats: QueryStats }> {
    const startTime = performance.now();
    const cacheKey = options.cacheKey || this.generateCacheKey(sql, options.replacements);

    // Check cache first
    if (options.cache !== false) {
      const cached = await this.getFromCache<T>(cacheKey);
      if (cached) {
        return {
          result: cached,
          stats: {
            executionTime: performance.now() - startTime,
            rowsAffected: Array.isArray(cached) ? cached.length : 1,
            cached: true,
          },
        };
      }
    }

    try {
      // Execute query
      const [result] = await this.sequelize.query(sql, {
        replacements: options.replacements,
        type: options.type || QueryTypes.SELECT,
        transaction: options.transaction,
        raw: true,
      });

      const executionTime = performance.now() - startTime;

      // Track performance
      trackDatabaseQuery(options.type || 'SELECT', this.extractTableName(sql), executionTime);

      // Cache result if enabled
      if (options.cache !== false && options.type === QueryTypes.SELECT) {
        await this.setCache(cacheKey, result, options.cacheTTL);
      }

      return {
        result: result as T,
        stats: {
          executionTime,
          rowsAffected: Array.isArray(result) ? result.length : 1,
          cached: false,
        },
      };
    } catch (error) {
      logger.error('Query execution error', {
        sql: sql.substring(0, 500),
        error: error.message,
      });
      throw error;
    }
  }

  // Batch query execution for better performance
  async executeBatch<T extends object = any>(
    queries: Array<{
      sql: string;
      replacements?: unknown;
      type?: QueryTypes;
    }>
  ): Promise<T[]> {
    const transaction = await this.sequelize.transaction();

    try {
      const results = await Promise.all(
        queries.map(query =>
          this.executeQuery<T>(query.sql, {
            ...query,
            transaction,
            cache: false,
          }).then(({ result }) => result)
        )
      );

      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Analyze query performance
  async analyzeQuery(sql: string, replacements?: unknown): Promise<QueryPlan[]> {
    try {
      const explainSql = `EXPLAIN (ANALYZE, BUFFERS) ${sql}`;
      const result = await this.sequelize.query(explainSql, {
        replacements,
        type: QueryTypes.SELECT,
        raw: true,
      });

      return this.parseExplainOutput(result);
    } catch (error) {
      logger.error('Query analysis failed', { error: error.message });
      return [];
    }
  }

  // Optimize common query patterns
  optimizeQuery(sql: string): string {
    let optimized = sql;

    // Add LIMIT if not present for SELECT queries
    if (optimized.match(/^SELECT/i) && !optimized.match(/LIMIT/i)) {
      optimized += ' LIMIT 1000';
    }

    // Use EXISTS instead of IN for subqueries
    optimized = optimized.replace(/WHERE\s+(\w+)\s+IN\s*\(SELECT/gi, 'WHERE EXISTS (SELECT 1 FROM');

    // Add index hints for known slow queries
    const indexHints = {
      users: 'idx_users_email',
      goals: 'idx_goals_user_status_date',
      tasks: 'idx_tasks_user_status',
    };

    for (const [table, index] of Object.entries(indexHints)) {
      if (optimized.includes(`FROM ${table}`) && !optimized.includes('USE INDEX')) {
        optimized = optimized.replace(`FROM ${table}`, `FROM ${table} USE INDEX (${index})`);
      }
    }

    return optimized;
  }

  // Connection pool optimization
  async optimizeConnectionPool() {
    const pool = (this.sequelize.connectionManager as unknown).pool;

    if (pool) {
      const config = {
        max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 20,
        min: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN) : 5,
        idle: 10000,
        acquire: 30000,
        evict: 1000,
      };

      // Update pool configuration
      Object.assign(pool, config);

      logger.info('Connection pool optimized', config);
    }
  }

  // Vacuum and analyze tables for better performance
  async maintainDatabase() {
    const tables = [
      'users',
      'goals',
      'tasks',
      'habits',
      'mood_entries',
      'messages',
      'ai_interactions',
      'content_articles',
    ];

    for (const table of tables) {
      try {
        // Vacuum table to reclaim space
        await this.sequelize.query(`VACUUM ANALYZE ${table}`, {
          type: QueryTypes.RAW,
        });

        // Update table statistics
        await this.sequelize.query(`ANALYZE ${table}`, {
          type: QueryTypes.RAW,
        });

        logger.info(`Maintenance completed for table: ${table}`);
      } catch (error) {
        logger.error(`Maintenance failed for table: ${table}`, error);
      }
    }
  }

  // Monitor and log query patterns
  async getQueryStats(): Promise<unknown> {
    const stats = await this.sequelize.query(
      `
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        min_time,
        max_time,
        stddev_time
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_time DESC
      LIMIT 20
    `,
      {
        type: QueryTypes.SELECT,
      }
    );

    return stats;
  }

  // Cache helpers
  private generateCacheKey(sql: string, replacements?: unknown): string {
    const normalizedSql = sql.replace(/\s+/g, ' ').trim();
    const replacementsKey = replacements ? JSON.stringify(replacements) : '';
    return `query:${Buffer.from(normalizedSql + replacementsKey)
      .toString('base64')
      .substring(0, 64)}`;
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memCached = this.queryCache.get(key);
    if (memCached && Date.now() - memCached.timestamp < this.cacheTimeout) {
      return memCached.result;
    }

    // Check Redis cache
    const cached = await getCacheService().get<T>(key, { prefix: 'query:' });
    if (cached) {
      // Update memory cache
      this.queryCache.set(key, { result: cached, timestamp: Date.now() });
    }

    return cached;
  }

  private async setCache(key: string, value: unknown, ttl?: number): Promise<void> {
    // Set in memory cache
    this.queryCache.set(key, { result: value, timestamp: Date.now() });

    // Cleanup old entries
    if (this.queryCache.size > 1000) {
      const oldestKey = Array.from(this.queryCache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      )[0][0];
      this.queryCache.delete(oldestKey);
    }

    // Set in Redis cache
    await getCacheService().set(key, value, {
      prefix: 'query:',
      ttl: ttl || 300, // 5 minutes default
    });
  }

  private extractTableName(sql: string): string {
    const match = sql.match(/FROM\s+(\w+)/i);
    return match ? match[1] : 'unknown';
  }

  private parseExplainOutput(output: unknown[]): QueryPlan[] {
    // Parse PostgreSQL EXPLAIN output
    return output.map(row => {
      const plan = row['QUERY PLAN'] || '';
      const costMatch = plan.match(/cost=(\d+\.\d+)\.\.(\d+\.\d+)/);
      const rowsMatch = plan.match(/rows=(\d+)/);
      const widthMatch = plan.match(/width=(\d+)/);
      const timeMatch = plan.match(/actual time=(\d+\.\d+)\.\.(\d+\.\d+)/);

      return {
        query: plan,
        cost: costMatch ? parseFloat(costMatch[2]) : 0,
        rows: rowsMatch ? parseInt(rowsMatch[1]) : 0,
        width: widthMatch ? parseInt(widthMatch[1]) : 0,
        actualTime: timeMatch ? parseFloat(timeMatch[2]) : 0,
      };
    });
  }

  // Prepared statements for common queries
  private preparedStatements = new Map<string, string>();

  prepareCriticalQueries() {
    // Prepare frequently used queries
    this.preparedStatements.set(
      'getUserById',
      `
      SELECT u.*, 
        COUNT(DISTINCT g.id) as goal_count,
        COUNT(DISTINCT t.id) as task_count
      FROM users u
      LEFT JOIN goals g ON g.user_id = u.id AND g.status = 'active'
      LEFT JOIN tasks t ON t.user_id = u.id AND t.status IN ('pending', 'in_progress')
      WHERE u.id = $1
      GROUP BY u.id
    `
    );

    this.preparedStatements.set(
      'getActiveGoals',
      `
      SELECT g.*,
        COUNT(t.id) as task_count,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
      FROM goals g
      LEFT JOIN tasks t ON t.goal_id = g.id
      WHERE g.user_id = $1 AND g.status = 'active'
      GROUP BY g.id
      ORDER BY g.target_date ASC
    `
    );

    this.preparedStatements.set(
      'getDashboardStats',
      `
      WITH user_stats AS (
        SELECT 
          COUNT(DISTINCT CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN id END) as new_users,
          COUNT(DISTINCT CASE WHEN last_login > NOW() - INTERVAL '1 day' THEN id END) as active_users,
          COUNT(*) as total_users
        FROM users
      ),
      goal_stats AS (
        SELECT
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_goals,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_goals
        FROM goals
      ),
      task_stats AS (
        SELECT
          COUNT(CASE WHEN status = 'completed' AND completed_at > NOW() - INTERVAL '7 days' THEN 1 END) as tasks_completed_week
        FROM tasks
      )
      SELECT * FROM user_stats, goal_stats, task_stats
    `
    );
  }

  async executePrepared(name: string, params: unknown[]): Promise<unknown> {
    const sql = this.preparedStatements.get(name);
    if (!sql) {
      throw new Error(`Prepared statement '${name}' not found`);
    }

    const { result } = await this.executeQuery(sql, {
      replacements: params,
      cache: true,
      cacheKey: `prepared:${name}:${JSON.stringify(params)}`,
    });

    return result;
  }
}
