"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheTTL = exports.CacheKeys = exports.performanceCacheService = exports.PerformanceCacheService = void 0;
const tslib_1 = require("tslib");
const ioredis_1 = tslib_1.__importDefault(require("ioredis"));
const logger_1 = require("../../utils/logger");
class PerformanceCacheService {
    redis;
    subscriber;
    publisher;
    isConnected = false;
    cacheConfig = {
        defaultTTL: 3600,
        shortTTL: 300,
        mediumTTL: 1800,
        longTTL: 86400,
        keyPrefixes: {
            user: 'user:',
            session: 'session:',
            api: 'api:',
            content: 'content:',
            analytics: 'analytics:',
            auth: 'auth:',
            realtime: 'realtime:',
            ml: 'ml:'
        },
        strategies: {
            writeThrough: 'write-through',
            writeBack: 'write-back',
            writeAround: 'write-around',
            readThrough: 'read-through',
            cacheAside: 'cache-aside'
        }
    };
    constructor() {
        this.initializeRedis();
    }
    initializeRedis() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const redisOptions = {
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            enableOfflineQueue: false,
            connectTimeout: 10000,
            lazyConnect: true,
            keepAlive: 30000,
            family: 4,
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            enableOfflineQueue: false,
            compression: 'gzip',
            db: 0,
            enableReadyCheck: true,
            maxRetriesPerRequest: null,
        };
        try {
            this.redis = new ioredis_1.default(redisUrl, redisOptions);
            this.subscriber = new ioredis_1.default(redisUrl, redisOptions);
            this.publisher = new ioredis_1.default(redisUrl, redisOptions);
            this.setupEventHandlers();
            this.setupHealthChecking();
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Redis', error);
            throw error;
        }
    }
    setupEventHandlers() {
        this.redis.on('connect', () => {
            this.isConnected = true;
            logger_1.logger.info('Redis connected successfully');
        });
        this.redis.on('error', (error) => {
            this.isConnected = false;
            logger_1.logger.error('Redis connection error', error);
        });
        this.redis.on('close', () => {
            this.isConnected = false;
            logger_1.logger.warn('Redis connection closed');
        });
        this.redis.on('reconnecting', (time) => {
            logger_1.logger.info(`Redis reconnecting in ${time}ms`);
        });
    }
    setupHealthChecking() {
        setInterval(async () => {
            try {
                await this.redis.ping();
                if (!this.isConnected) {
                    this.isConnected = true;
                    logger_1.logger.info('Redis connection restored');
                }
            }
            catch (error) {
                if (this.isConnected) {
                    this.isConnected = false;
                    logger_1.logger.error('Redis health check failed', error);
                }
            }
        }, 30000);
    }
    async get(key, fallback, ttl) {
        try {
            const cachedValue = await this.redis.get(key);
            if (cachedValue !== null) {
                this.trackCacheMetrics('hit', key);
                return JSON.parse(cachedValue);
            }
            this.trackCacheMetrics('miss', key);
            if (fallback) {
                const value = await fallback();
                await this.set(key, value, ttl);
                return value;
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Cache get error', { key, error });
            if (fallback) {
                return await fallback();
            }
            return null;
        }
    }
    async set(key, value, ttl) {
        try {
            const serializedValue = JSON.stringify(value);
            const cacheTimeout = ttl || this.cacheConfig.defaultTTL;
            await this.redis.setex(key, cacheTimeout, serializedValue);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Cache set error', { key, error });
            return false;
        }
    }
    async mget(keys) {
        try {
            const values = await this.redis.mget(...keys);
            const resultMap = new Map();
            keys.forEach((key, index) => {
                const value = values[index];
                if (value !== null) {
                    try {
                        resultMap.set(key, JSON.parse(value));
                        this.trackCacheMetrics('hit', key);
                    }
                    catch (parseError) {
                        logger_1.logger.error('Cache parse error', { key, parseError });
                        this.trackCacheMetrics('miss', key);
                    }
                }
                else {
                    this.trackCacheMetrics('miss', key);
                }
            });
            return resultMap;
        }
        catch (error) {
            logger_1.logger.error('Cache mget error', { keys, error });
            return new Map();
        }
    }
    async mset(data, ttl) {
        try {
            const pipeline = this.redis.pipeline();
            const cacheTimeout = ttl || this.cacheConfig.defaultTTL;
            for (const [key, value] of data.entries()) {
                const serializedValue = JSON.stringify(value);
                pipeline.setex(key, cacheTimeout, serializedValue);
            }
            await pipeline.exec();
            return true;
        }
        catch (error) {
            logger_1.logger.error('Cache mset error', { keys: Array.from(data.keys()), error });
            return false;
        }
    }
    async del(keys) {
        try {
            const keysArray = Array.isArray(keys) ? keys : [keys];
            return await this.redis.del(...keysArray);
        }
        catch (error) {
            logger_1.logger.error('Cache del error', { keys, error });
            return 0;
        }
    }
    async invalidatePattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                return await this.redis.del(...keys);
            }
            return 0;
        }
        catch (error) {
            logger_1.logger.error('Cache pattern invalidation error', { pattern, error });
            return 0;
        }
    }
    async increment(key, by = 1, ttl) {
        try {
            const pipeline = this.redis.pipeline();
            pipeline.incrby(key, by);
            if (ttl) {
                pipeline.expire(key, ttl);
            }
            const results = await pipeline.exec();
            return results?.[0]?.[1] || 0;
        }
        catch (error) {
            logger_1.logger.error('Cache increment error', { key, error });
            return 0;
        }
    }
    async sadd(key, members, ttl) {
        try {
            const pipeline = this.redis.pipeline();
            pipeline.sadd(key, ...members);
            if (ttl) {
                pipeline.expire(key, ttl);
            }
            const results = await pipeline.exec();
            return results?.[0]?.[1] || 0;
        }
        catch (error) {
            logger_1.logger.error('Cache sadd error', { key, error });
            return 0;
        }
    }
    async hmset(key, data, ttl) {
        try {
            const pipeline = this.redis.pipeline();
            const redisData = {};
            for (const [field, value] of Object.entries(data)) {
                redisData[field] = typeof value === 'string' ? value : JSON.stringify(value);
            }
            pipeline.hmset(key, redisData);
            if (ttl) {
                pipeline.expire(key, ttl);
            }
            await pipeline.exec();
            return true;
        }
        catch (error) {
            logger_1.logger.error('Cache hmset error', { key, error });
            return false;
        }
    }
    async cacheUserSession(userId, sessionData, ttl = 3600) {
        const key = `${this.cacheConfig.keyPrefixes.session}${userId}`;
        return await this.set(key, sessionData, ttl);
    }
    async getUserSession(userId) {
        const key = `${this.cacheConfig.keyPrefixes.session}${userId}`;
        return await this.get(key);
    }
    async cacheApiResponse(endpoint, params, response, ttl = 300) {
        const key = `${this.cacheConfig.keyPrefixes.api}${endpoint}:${params}`;
        return await this.set(key, response, ttl);
    }
    async getApiResponse(endpoint, params) {
        const key = `${this.cacheConfig.keyPrefixes.api}${endpoint}:${params}`;
        return await this.get(key);
    }
    async cacheContent(contentId, content, tags = [], ttl = 1800) {
        const contentKey = `${this.cacheConfig.keyPrefixes.content}${contentId}`;
        const success = await this.set(contentKey, content, ttl);
        if (success && tags.length > 0) {
            for (const tag of tags) {
                const tagKey = `${this.cacheConfig.keyPrefixes.content}tag:${tag}`;
                await this.sadd(tagKey, [contentId], ttl);
            }
        }
        return success;
    }
    async invalidateContentByTags(tags) {
        let totalInvalidated = 0;
        for (const tag of tags) {
            const tagKey = `${this.cacheConfig.keyPrefixes.content}tag:${tag}`;
            const contentIds = await this.redis.smembers(tagKey);
            if (contentIds.length > 0) {
                const contentKeys = contentIds.map(id => `${this.cacheConfig.keyPrefixes.content}${id}`);
                totalInvalidated += await this.del([...contentKeys, tagKey]);
            }
        }
        return totalInvalidated;
    }
    async cacheAnalytics(metric, timeframe, data, ttl = 900) {
        const key = `${this.cacheConfig.keyPrefixes.analytics}${metric}:${timeframe}`;
        return await this.set(key, data, ttl);
    }
    async cacheMlResult(modelName, inputHash, result, ttl = 3600) {
        const key = `${this.cacheConfig.keyPrefixes.ml}${modelName}:${inputHash}`;
        return await this.set(key, result, ttl);
    }
    async warmupCache(warmupData) {
        logger_1.logger.info('Starting cache warmup');
        try {
            const pipeline = this.redis.pipeline();
            for (const item of warmupData) {
                const serializedValue = JSON.stringify(item.value);
                const ttl = item.ttl || this.cacheConfig.defaultTTL;
                pipeline.setex(item.key, ttl, serializedValue);
            }
            await pipeline.exec();
            logger_1.logger.info(`Cache warmup completed: ${warmupData.length} items`);
        }
        catch (error) {
            logger_1.logger.error('Cache warmup failed', error);
        }
    }
    trackCacheMetrics(operation, key) {
        logger_1.logger.debug('Cache operation', {
            operation,
            key: key.substring(0, 50) + '...',
            timestamp: Date.now()
        });
    }
    async getCacheStats() {
        try {
            const info = await this.redis.info('memory,stats');
            const keyspace = await this.redis.info('keyspace');
            return {
                connected: this.isConnected,
                memory_usage: this.parseRedisInfo(info, 'used_memory_human'),
                keyspace_hits: this.parseRedisInfo(info, 'keyspace_hits'),
                keyspace_misses: this.parseRedisInfo(info, 'keyspace_misses'),
                total_keys: this.parseRedisInfo(keyspace, 'keys'),
                expires: this.parseRedisInfo(keyspace, 'expires'),
                avg_ttl: this.parseRedisInfo(keyspace, 'avg_ttl')
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get cache stats', error);
            return { connected: false, error: error.message };
        }
    }
    parseRedisInfo(info, key) {
        const lines = info.split('\r\n');
        for (const line of lines) {
            if (line.startsWith(key + ':')) {
                const value = line.split(':')[1];
                return isNaN(Number(value)) ? value : Number(value);
            }
        }
        return 'N/A';
    }
    async shutdown() {
        logger_1.logger.info('Shutting down cache service');
        try {
            await Promise.all([
                this.redis.quit(),
                this.subscriber.quit(),
                this.publisher.quit()
            ]);
            logger_1.logger.info('Cache service shutdown completed');
        }
        catch (error) {
            logger_1.logger.error('Error during cache service shutdown', error);
        }
    }
}
exports.PerformanceCacheService = PerformanceCacheService;
exports.performanceCacheService = new PerformanceCacheService();
exports.CacheKeys = {
    user: (id) => `user:${id}`,
    userSession: (userId) => `session:${userId}`,
    apiResponse: (endpoint, params) => `api:${endpoint}:${params}`,
    content: (id) => `content:${id}`,
    contentTag: (tag) => `content:tag:${tag}`,
    analytics: (metric, timeframe) => `analytics:${metric}:${timeframe}`,
    ml: (model, hash) => `ml:${model}:${hash}`,
    auth: (token) => `auth:${token}`,
    realtime: (channel) => `realtime:${channel}`
};
exports.CacheTTL = {
    SHORT: 300,
    MEDIUM: 1800,
    DEFAULT: 3600,
    LONG: 86400,
    SESSION: 7200,
    API: 300,
    CONTENT: 1800,
    ML: 3600,
    ANALYTICS: 900
};
