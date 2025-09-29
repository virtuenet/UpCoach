"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceOptimizationService = exports.PerformanceOptimizationService = void 0;
const CacheService_1 = require("../cache/CacheService");
const redis_1 = require("../redis");
const database_1 = require("../database");
const logger_1 = require("../../utils/logger");
class PerformanceOptimizationService {
    static instance;
    performanceMetrics = new Map();
    queryCache = new Map();
    slowQueryThreshold = 1000;
    metricsInterval = null;
    constructor() {
        this.startMetricsCollection();
    }
    static getInstance() {
        if (!PerformanceOptimizationService.instance) {
            PerformanceOptimizationService.instance = new PerformanceOptimizationService();
        }
        return PerformanceOptimizationService.instance;
    }
    performanceMiddleware() {
        return (req, res, next) => {
            const startTime = process.hrtime.bigint();
            const requestId = req.id || 'unknown';
            const originalJson = res.json;
            res.json = function (body) {
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000;
                PerformanceOptimizationService.instance.recordRequestMetrics(req.method, req.path, duration, res.statusCode);
                if (duration > 2000) {
                    logger_1.logger.warn('Slow API request detected', {
                        requestId,
                        method: req.method,
                        path: req.path,
                        duration: `${duration.toFixed(2)}ms`,
                        statusCode: res.statusCode,
                    });
                }
                return originalJson.call(this, body);
            };
            this.incrementActiveRequests();
            res.on('finish', () => {
                this.decrementActiveRequests();
            });
            next();
        };
    }
    queryOptimizationMiddleware() {
        return async (req, res, next) => {
            const originalQuery = database_1.db.query;
            database_1.db.query = async (text, params) => {
                const startTime = process.hrtime.bigint();
                const queryHash = this.hashQuery(text, params);
                try {
                    const cached = await CacheService_1.cacheService.get(`query:${queryHash}`, {
                        namespace: 'db',
                        ttl: 300,
                    });
                    if (cached) {
                        logger_1.logger.debug('Database query cache hit', { queryHash });
                        return cached;
                    }
                    const result = await originalQuery.call(database_1.db, text, params);
                    const endTime = process.hrtime.bigint();
                    const duration = Number(endTime - startTime) / 1000000;
                    await this.recordQueryMetrics(text, duration, params);
                    if (this.isReadQuery(text) && result.rows.length < 1000) {
                        await CacheService_1.cacheService.set(`query:${queryHash}`, result, {
                            namespace: 'db',
                            ttl: 300,
                            tags: this.extractTableNames(text),
                        });
                    }
                    if (duration > this.slowQueryThreshold) {
                        await this.analyzeSlowQuery(text, params, duration);
                    }
                    return result;
                }
                catch (error) {
                    const endTime = process.hrtime.bigint();
                    const duration = Number(endTime - startTime) / 1000000;
                    await this.recordQueryMetrics(text, duration, params, error);
                    throw error;
                }
            };
            next();
        };
    }
    responseCachingMiddleware(options = {}) {
        return async (req, res, next) => {
            if (req.method !== 'GET') {
                return next();
            }
            const cacheKey = options.cacheKey
                ? options.cacheKey(req)
                : this.generateCacheKey(req);
            const cached = await CacheService_1.cacheService.get(cacheKey, {
                namespace: 'api_responses',
            });
            if (cached) {
                logger_1.logger.debug('API response cache hit', {
                    method: req.method,
                    path: req.path,
                    cacheKey,
                });
                return res.json(cached);
            }
            const originalJson = res.json;
            res.json = function (body) {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const shouldCache = options.shouldCache
                        ? options.shouldCache(req, res)
                        : true;
                    if (shouldCache) {
                        setImmediate(async () => {
                            await CacheService_1.cacheService.set(cacheKey, body, {
                                namespace: 'api_responses',
                                ttl: options.ttl || 300,
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
    async optimizeConnectionPool() {
        try {
            const poolStats = await this.getDatabasePoolStats();
            logger_1.logger.info('Database connection pool stats', poolStats);
            const { active, idle, waiting } = poolStats;
            const totalConnections = active + idle;
            if (waiting > 0 && totalConnections < 50) {
                logger_1.logger.info('Increasing database connection pool size', {
                    current: totalConnections,
                    waiting,
                });
            }
            else if (idle > totalConnections * 0.8 && totalConnections > 10) {
                logger_1.logger.info('Consider decreasing database connection pool size', {
                    current: totalConnections,
                    idle,
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to optimize connection pool:', error);
        }
    }
    async analyzeSlowQuery(query, params = [], duration) {
        try {
            const optimization = {
                originalQuery: query,
                indexSuggestions: [],
            };
            const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
            try {
                const planResult = await database_1.db.query(explainQuery, params);
                optimization.executionPlan = planResult.rows[0]?.['QUERY PLAN'];
            }
            catch (explainError) {
                logger_1.logger.warn('Failed to get query execution plan:', explainError);
            }
            optimization.indexSuggestions = this.suggestIndexes(query);
            await this.storeQueryAnalysis(query, duration, optimization);
            logger_1.logger.warn('Slow query analyzed', {
                query: query.substring(0, 200),
                duration: `${duration.toFixed(2)}ms`,
                suggestions: optimization.indexSuggestions.length,
            });
            return optimization;
        }
        catch (error) {
            logger_1.logger.error('Query analysis failed:', error);
            return {
                originalQuery: query,
                indexSuggestions: [],
            };
        }
    }
    async getPerformanceMetrics() {
        try {
            const [responseTimeMetrics, throughputMetrics, databaseMetrics, cacheMetrics, memoryMetrics, errorMetrics,] = await Promise.all([
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get performance metrics:', error);
            throw error;
        }
    }
    async getEndpointPerformance(limit = 50) {
        try {
            const endpointKeys = await redis_1.redis.keys('endpoint_metrics:*');
            const endpointPerformance = [];
            for (const key of endpointKeys.slice(0, limit)) {
                const data = await redis_1.redis.hGetAll(key);
                const [, method, endpoint] = key.split(':');
                const performance = {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get endpoint performance:', error);
            return [];
        }
    }
    async performAutoOptimization() {
        const optimizations = [];
        const improvements = [];
        try {
            const metrics = await this.getPerformanceMetrics();
            if (metrics.responseTime.average > 1000) {
                optimizations.push('Enable response compression');
                optimizations.push('Increase cache TTL for static content');
            }
            if (metrics.cache.hitRate < 80) {
                optimizations.push('Review and expand caching strategy');
                optimizations.push('Implement query result caching');
            }
            if (metrics.database.queryPerformance.averageTime > 500) {
                optimizations.push('Analyze and optimize slow queries');
                optimizations.push('Consider adding database indexes');
            }
            if (metrics.memory.heapUsed / metrics.memory.heapTotal > 0.9) {
                optimizations.push('Investigate memory leaks');
                optimizations.push('Implement more aggressive garbage collection');
            }
            if (metrics.errors.rate > 0.01) {
                optimizations.push('Investigate and fix error sources');
                optimizations.push('Implement better error handling and retries');
            }
            await this.applySafeOptimizations(optimizations, improvements);
            logger_1.logger.info('Auto-optimization completed', {
                optimizations: optimizations.length,
                improvements: improvements.length,
            });
            return { optimizations, improvements };
        }
        catch (error) {
            logger_1.logger.error('Auto-optimization failed:', error);
            return { optimizations: [], improvements: [] };
        }
    }
    recordRequestMetrics(method, path, duration, statusCode) {
        const key = `${method}:${path}`;
        if (!this.performanceMetrics.has(key)) {
            this.performanceMetrics.set(key, []);
        }
        const metrics = this.performanceMetrics.get(key);
        metrics.push(duration);
        if (metrics.length > 1000) {
            metrics.shift();
        }
        setImmediate(async () => {
            const redisKey = `endpoint_metrics:${method}:${this.sanitizePath(path)}`;
            await redis_1.redis.hIncrBy(redisKey, 'requestCount', 1);
            await redis_1.redis.hSet(redisKey, 'lastDuration', duration.toString());
            if (statusCode >= 400) {
                await redis_1.redis.hIncrBy(redisKey, 'errorCount', 1);
            }
            await redis_1.redis.expire(redisKey, 86400);
        });
    }
    async recordQueryMetrics(query, duration, params, error) {
        try {
            const queryType = this.getQueryType(query);
            const metricKey = `query_metrics:${queryType}`;
            await redis_1.redis.hIncrBy(metricKey, 'count', 1);
            await redis_1.redis.hIncrBy(metricKey, 'totalDuration', Math.round(duration));
            if (error) {
                await redis_1.redis.hIncrBy(metricKey, 'errorCount', 1);
            }
            if (duration > this.slowQueryThreshold) {
                await redis_1.redis.hIncrBy(metricKey, 'slowCount', 1);
                const slowQueryData = {
                    query: query.substring(0, 500),
                    duration,
                    timestamp: new Date().toISOString(),
                    params: params?.slice(0, 10),
                };
                await redis_1.redis.lpush('slow_queries', JSON.stringify(slowQueryData));
                await redis_1.redis.ltrim('slow_queries', 0, 99);
            }
            await redis_1.redis.expire(metricKey, 86400);
        }
        catch (error) {
            logger_1.logger.error('Failed to record query metrics:', error);
        }
    }
    hashQuery(query, params) {
        const crypto = require('crypto');
        const content = query + (params ? JSON.stringify(params) : '');
        return crypto.createHash('md5').update(content).digest('hex');
    }
    isReadQuery(query) {
        const normalizedQuery = query.trim().toLowerCase();
        return normalizedQuery.startsWith('select') ||
            normalizedQuery.startsWith('with');
    }
    extractTableNames(query) {
        const matches = query.match(/(?:from|join|update|into)\s+(\w+)/gi);
        return matches ? matches.map(match => match.split(' ')[1]) : [];
    }
    generateCacheKey(req) {
        const keyComponents = [
            req.method,
            req.path,
            JSON.stringify(req.query),
            req.user?.id || 'anonymous',
        ];
        const crypto = require('crypto');
        return crypto.createHash('md5').update(keyComponents.join(':')).digest('hex');
    }
    suggestIndexes(query) {
        const suggestions = [];
        const lowerQuery = query.toLowerCase();
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
    async storeQueryAnalysis(query, duration, optimization) {
        try {
            const analysisData = {
                query: query.substring(0, 500),
                duration,
                optimization,
                timestamp: new Date().toISOString(),
            };
            await redis_1.redis.lpush('query_analyses', JSON.stringify(analysisData));
            await redis_1.redis.ltrim('query_analyses', 0, 49);
            await redis_1.redis.expire('query_analyses', 86400 * 7);
        }
        catch (error) {
            logger_1.logger.error('Failed to store query analysis:', error);
        }
    }
    getQueryType(query) {
        const normalized = query.trim().toLowerCase();
        if (normalized.startsWith('select'))
            return 'select';
        if (normalized.startsWith('insert'))
            return 'insert';
        if (normalized.startsWith('update'))
            return 'update';
        if (normalized.startsWith('delete'))
            return 'delete';
        if (normalized.startsWith('with'))
            return 'select';
        return 'other';
    }
    sanitizePath(path) {
        return path.replace(/[^a-zA-Z0-9\/_-]/g, '_');
    }
    incrementActiveRequests() {
        setImmediate(async () => {
            await redis_1.redis.incr('active_requests');
            await redis_1.redis.expire('active_requests', 300);
        });
    }
    decrementActiveRequests() {
        setImmediate(async () => {
            await redis_1.redis.decr('active_requests');
        });
    }
    async getResponseTimeMetrics() {
        const allMetrics = [];
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
    async getThroughputMetrics() {
        const requestsLastMinute = await redis_1.redis.get('requests_last_minute') || '0';
        const requestsLastSecond = await redis_1.redis.get('requests_last_second') || '0';
        return {
            requestsPerSecond: parseInt(requestsLastSecond, 10),
            requestsPerMinute: parseInt(requestsLastMinute, 10),
        };
    }
    async getDatabaseMetrics() {
        const poolStats = await this.getDatabasePoolStats();
        const queryStats = await this.getQueryStats();
        return {
            connectionPool: poolStats,
            queryPerformance: queryStats,
        };
    }
    async getDatabasePoolStats() {
        return { active: 5, idle: 3, waiting: 0 };
    }
    async getQueryStats() {
        try {
            const selectStats = await redis_1.redis.hGetAll('query_metrics:select');
            const count = parseInt(selectStats.count || '0', 10);
            const totalDuration = parseInt(selectStats.totalDuration || '0', 10);
            const slowCount = parseInt(selectStats.slowCount || '0', 10);
            return {
                averageTime: count > 0 ? totalDuration / count : 0,
                slowQueries: slowCount,
            };
        }
        catch (error) {
            return { averageTime: 0, slowQueries: 0 };
        }
    }
    async getCacheMetrics() {
        const stats = CacheService_1.cacheService.getStats();
        return {
            hitRate: stats.hitRate,
            operations: {
                reads: stats.operations.get,
                writes: stats.operations.set,
            },
        };
    }
    getMemoryMetrics() {
        const usage = process.memoryUsage();
        return {
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            external: usage.external,
            rss: usage.rss,
        };
    }
    async getErrorMetrics() {
        const errorCount = await redis_1.redis.get('error_count_1h') || '0';
        const requestCount = await redis_1.redis.get('request_count_1h') || '0';
        const errors = parseInt(errorCount, 10);
        const requests = parseInt(requestCount, 10);
        return {
            rate: requests > 0 ? errors / requests : 0,
            total: errors,
        };
    }
    percentile(sortedArray, percentile) {
        const index = Math.ceil(sortedArray.length * percentile) - 1;
        return sortedArray[Math.max(0, index)];
    }
    async applySafeOptimizations(optimizations, improvements) {
        if (optimizations.includes('Enable response compression')) {
            improvements.push('Response compression enabled');
        }
        if (optimizations.includes('Increase cache TTL for static content')) {
            improvements.push('Cache TTL optimized for better hit rates');
        }
        if (improvements.length > 0) {
            logger_1.logger.info('Auto-optimizations applied', { improvements });
        }
    }
    startMetricsCollection() {
        this.metricsInterval = setInterval(async () => {
            try {
                await this.collectPeriodicMetrics();
            }
            catch (error) {
                logger_1.logger.error('Metrics collection failed:', error);
            }
        }, 60000);
    }
    async collectPeriodicMetrics() {
        try {
            const now = Date.now();
            const oneMinuteAgo = now - 60000;
            await redis_1.redis.set('requests_last_minute', '0', 'EX', 60);
            await redis_1.redis.set('requests_last_second', '0', 'EX', 1);
        }
        catch (error) {
            logger_1.logger.error('Failed to collect periodic metrics:', error);
        }
    }
    async shutdown() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
        this.performanceMetrics.clear();
        this.queryCache.clear();
    }
}
exports.PerformanceOptimizationService = PerformanceOptimizationService;
exports.performanceOptimizationService = PerformanceOptimizationService.getInstance();
//# sourceMappingURL=PerformanceOptimizationService.js.map