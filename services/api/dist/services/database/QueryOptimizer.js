"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryOptimizer = void 0;
const sequelize_1 = require("sequelize");
const perf_hooks_1 = require("perf_hooks");
const logger_1 = require("../../utils/logger");
const UnifiedCacheService_1 = require("../cache/UnifiedCacheService");
const performance_1 = require("../../middleware/performance");
class QueryOptimizer {
    sequelize;
    slowQueryThreshold = 100; // ms
    queryCache = new Map();
    cacheTimeout = 60000; // 1 minute
    constructor(sequelize) {
        this.sequelize = sequelize;
        this.setupQueryLogging();
    }
    setupQueryLogging() {
        // Log slow queries
        this.sequelize.options.logging = (sql, timing) => {
            if (timing && timing > this.slowQueryThreshold) {
                logger_1.logger.warn('Slow query detected', {
                    sql: sql.substring(0, 500),
                    duration: `${timing}ms`,
                });
            }
        };
        // Benchmark mode for development
        if (process.env.NODE_ENV === 'development') {
            this.sequelize.options.benchmark = true;
        }
    }
    // Execute query with caching and monitoring
    async executeQuery(sql, options = {}) {
        const startTime = perf_hooks_1.performance.now();
        const cacheKey = options.cacheKey || this.generateCacheKey(sql, options.replacements);
        // Check cache first
        if (options.cache !== false) {
            const cached = await this.getFromCache(cacheKey);
            if (cached) {
                return {
                    result: cached,
                    stats: {
                        executionTime: perf_hooks_1.performance.now() - startTime,
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
                type: options.type || sequelize_1.QueryTypes.SELECT,
                transaction: options.transaction,
                raw: true,
            });
            const executionTime = perf_hooks_1.performance.now() - startTime;
            // Track performance
            (0, performance_1.trackDatabaseQuery)(options.type || 'SELECT', this.extractTableName(sql), executionTime);
            // Cache result if enabled
            if (options.cache !== false && options.type === sequelize_1.QueryTypes.SELECT) {
                await this.setCache(cacheKey, result, options.cacheTTL);
            }
            return {
                result: result,
                stats: {
                    executionTime,
                    rowsAffected: Array.isArray(result) ? result.length : 1,
                    cached: false,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Query execution error', {
                sql: sql.substring(0, 500),
                error: error.message,
            });
            throw error;
        }
    }
    // Batch query execution for better performance
    async executeBatch(queries) {
        const transaction = await this.sequelize.transaction();
        try {
            const results = await Promise.all(queries.map(query => this.executeQuery(query.sql, {
                ...query,
                transaction,
                cache: false,
            }).then(({ result }) => result)));
            await transaction.commit();
            return results;
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    // Analyze query performance
    async analyzeQuery(sql, replacements) {
        try {
            const explainSql = `EXPLAIN (ANALYZE, BUFFERS) ${sql}`;
            const result = await this.sequelize.query(explainSql, {
                replacements,
                type: sequelize_1.QueryTypes.SELECT,
                raw: true,
            });
            return this.parseExplainOutput(result);
        }
        catch (error) {
            logger_1.logger.error('Query analysis failed', { error: error.message });
            return [];
        }
    }
    // Optimize common query patterns
    optimizeQuery(sql) {
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
        const pool = this.sequelize.connectionManager.pool;
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
            logger_1.logger.info('Connection pool optimized', config);
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
                    type: sequelize_1.QueryTypes.RAW,
                });
                // Update table statistics
                await this.sequelize.query(`ANALYZE ${table}`, {
                    type: sequelize_1.QueryTypes.RAW,
                });
                logger_1.logger.info(`Maintenance completed for table: ${table}`);
            }
            catch (error) {
                logger_1.logger.error(`Maintenance failed for table: ${table}`, error);
            }
        }
    }
    // Monitor and log query patterns
    async getQueryStats() {
        const stats = await this.sequelize.query(`
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
    `, {
            type: sequelize_1.QueryTypes.SELECT,
        });
        return stats;
    }
    // Cache helpers
    generateCacheKey(sql, replacements) {
        const normalizedSql = sql.replace(/\s+/g, ' ').trim();
        const replacementsKey = replacements ? JSON.stringify(replacements) : '';
        return `query:${Buffer.from(normalizedSql + replacementsKey)
            .toString('base64')
            .substring(0, 64)}`;
    }
    async getFromCache(key) {
        // Check memory cache first
        const memCached = this.queryCache.get(key);
        if (memCached && Date.now() - memCached.timestamp < this.cacheTimeout) {
            return memCached.result;
        }
        // Check Redis cache
        const cached = await (0, UnifiedCacheService_1.getCacheService)().get(key, { prefix: 'query:' });
        if (cached) {
            // Update memory cache
            this.queryCache.set(key, { result: cached, timestamp: Date.now() });
        }
        return cached;
    }
    async setCache(key, value, ttl) {
        // Set in memory cache
        this.queryCache.set(key, { result: value, timestamp: Date.now() });
        // Cleanup old entries
        if (this.queryCache.size > 1000) {
            const oldestKey = Array.from(this.queryCache.entries()).sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
            this.queryCache.delete(oldestKey);
        }
        // Set in Redis cache
        await (0, UnifiedCacheService_1.getCacheService)().set(key, value, {
            prefix: 'query:',
            ttl: ttl || 300, // 5 minutes default
        });
    }
    extractTableName(sql) {
        const match = sql.match(/FROM\s+(\w+)/i);
        return match ? match[1] : 'unknown';
    }
    parseExplainOutput(output) {
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
    preparedStatements = new Map();
    prepareCriticalQueries() {
        // Prepare frequently used queries
        this.preparedStatements.set('getUserById', `
      SELECT u.*, 
        COUNT(DISTINCT g.id) as goal_count,
        COUNT(DISTINCT t.id) as task_count
      FROM users u
      LEFT JOIN goals g ON g.user_id = u.id AND g.status = 'active'
      LEFT JOIN tasks t ON t.user_id = u.id AND t.status IN ('pending', 'in_progress')
      WHERE u.id = $1
      GROUP BY u.id
    `);
        this.preparedStatements.set('getActiveGoals', `
      SELECT g.*,
        COUNT(t.id) as task_count,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
      FROM goals g
      LEFT JOIN tasks t ON t.goal_id = g.id
      WHERE g.user_id = $1 AND g.status = 'active'
      GROUP BY g.id
      ORDER BY g.target_date ASC
    `);
        this.preparedStatements.set('getDashboardStats', `
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
    `);
    }
    async executePrepared(name, params) {
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
exports.QueryOptimizer = QueryOptimizer;
//# sourceMappingURL=QueryOptimizer.js.map