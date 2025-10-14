"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
exports.Cached = Cached;
const logger_1 = require("../../utils/logger");
const ioredis_1 = require("ioredis");
class CacheService {
    memoryCache;
    redis = null;
    config;
    stats;
    isRedisAvailable = false;
    constructor(config = {}) {
        this.config = {
            defaultTTL: 600,
            maxKeySize: 250,
            maxValueSize: 1024 * 1024,
            ...config,
        };
        this.memoryCache = new Map();
        this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0 };
        this.initializeRedis();
    }
    async initializeRedis() {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            this.redis = new ioredis_1.Redis(redisUrl, {
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3,
                lazyConnect: true,
            });
            this.redis.on('connect', () => {
                this.isRedisAvailable = true;
                logger_1.logger.info('Cache service connected to Redis');
            });
            this.redis.on('error', (error) => {
                this.isRedisAvailable = false;
                this.stats.errors++;
                logger_1.logger.warn('Redis connection error, falling back to memory cache:', error);
            });
            await this.redis.ping();
            this.isRedisAvailable = true;
        }
        catch (error) {
            this.isRedisAvailable = false;
            logger_1.logger.warn('Redis not available, using memory cache only:', error);
        }
    }
    async get(key, options = {}) {
        try {
            const fullKey = this.buildKey(key, options.prefix);
            if (this.isRedisAvailable && this.redis) {
                try {
                    const value = await this.redis.get(fullKey);
                    if (value !== null) {
                        this.stats.hits++;
                        return options.serialize !== false ? JSON.parse(value) : value;
                    }
                }
                catch (error) {
                    this.stats.errors++;
                    logger_1.logger.warn('Redis get error, trying memory cache:', error);
                }
            }
            const cached = this.memoryCache.get(fullKey);
            if (cached && cached.expires > Date.now()) {
                this.stats.hits++;
                return cached.value;
            }
            if (cached && cached.expires <= Date.now()) {
                this.memoryCache.delete(fullKey);
            }
            this.stats.misses++;
            return null;
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Cache get error:', error);
            return null;
        }
    }
    async set(key, value, options = {}) {
        try {
            const fullKey = this.buildKey(key, options.prefix);
            const ttl = options.ttl || this.config.defaultTTL;
            const serializedValue = options.serialize !== false ? JSON.stringify(value) : value;
            if (fullKey.length > this.config.maxKeySize) {
                logger_1.logger.warn('Cache key too large:', fullKey.length);
                return false;
            }
            if (serializedValue.length > this.config.maxValueSize) {
                logger_1.logger.warn('Cache value too large:', serializedValue.length);
                return false;
            }
            let success = false;
            if (this.isRedisAvailable && this.redis) {
                try {
                    await this.redis.setex(fullKey, ttl, serializedValue);
                    success = true;
                }
                catch (error) {
                    this.stats.errors++;
                    logger_1.logger.warn('Redis set error, using memory cache:', error);
                }
            }
            const expires = Date.now() + (ttl * 1000);
            this.memoryCache.set(fullKey, {
                value: options.serialize !== false ? value : serializedValue,
                expires,
                size: serializedValue.length,
            });
            this.cleanupMemoryCache();
            this.stats.sets++;
            return success || true;
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Cache set error:', error);
            return false;
        }
    }
    async delete(key, options = {}) {
        try {
            const fullKey = this.buildKey(key, options.prefix);
            let success = false;
            if (this.isRedisAvailable && this.redis) {
                try {
                    const result = await this.redis.del(fullKey);
                    success = result > 0;
                }
                catch (error) {
                    this.stats.errors++;
                    logger_1.logger.warn('Redis delete error:', error);
                }
            }
            const memSuccess = this.memoryCache.delete(fullKey);
            this.stats.deletes++;
            return success || memSuccess;
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Cache delete error:', error);
            return false;
        }
    }
    async getOrSet(key, computeFn, options = {}) {
        const cached = await this.get(key, options);
        if (cached !== null) {
            return cached;
        }
        const value = await computeFn();
        await this.set(key, value, options);
        return value;
    }
    async clearPattern(pattern) {
        let cleared = 0;
        try {
            if (this.isRedisAvailable && this.redis) {
                const keys = await this.redis.keys(pattern);
                if (keys.length > 0) {
                    cleared += await this.redis.del(...keys);
                }
            }
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            for (const [key] of this.memoryCache) {
                if (regex.test(key)) {
                    this.memoryCache.delete(key);
                    cleared++;
                }
            }
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Cache clear pattern error:', error);
        }
        return cleared;
    }
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
        const memoryUsage = Array.from(this.memoryCache.values()).reduce((sum, item) => sum + item.size, 0);
        return {
            ...this.stats,
            hitRate: Math.round(hitRate * 100) / 100,
            memoryUsage,
        };
    }
    async healthCheck() {
        const memoryHealthy = this.memoryCache.size < 10000;
        let redisHealthy = false;
        if (this.redis) {
            try {
                await this.redis.ping();
                redisHealthy = true;
            }
            catch {
                redisHealthy = false;
            }
        }
        const status = redisHealthy && memoryHealthy ? 'healthy' :
            memoryHealthy ? 'degraded' : 'unhealthy';
        return {
            status,
            redis: redisHealthy,
            memory: memoryHealthy,
            stats: this.getStats(),
        };
    }
    buildKey(key, prefix) {
        const parts = ['upcoach', 'ai'];
        if (prefix)
            parts.push(prefix);
        parts.push(key);
        return parts.join(':');
    }
    cleanupMemoryCache() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, item] of this.memoryCache) {
            if (item.expires <= now) {
                this.memoryCache.delete(key);
                cleaned++;
            }
        }
        if (this.memoryCache.size > 1000) {
            const entries = Array.from(this.memoryCache.entries()).sort((a, b) => a[1].expires - b[1].expires);
            const toRemove = entries.slice(0, entries.length - 800);
            toRemove.forEach(([key]) => this.memoryCache.delete(key));
            cleaned += toRemove.length;
        }
        if (cleaned > 0) {
            logger_1.logger.debug(`Cleaned up ${cleaned} expired cache entries`);
        }
    }
}
exports.CacheService = CacheService;
exports.cacheService = new CacheService({
    defaultTTL: 600,
    maxKeySize: 250,
    maxValueSize: 1024 * 1024,
});
function Cached(options = {}) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = async function (...args) {
            const keyPrefix = options.keyPrefix || `${target.constructor.name}:${propertyName}`;
            const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;
            return await exports.cacheService.getOrSet(cacheKey, () => method.apply(this, args), options);
        };
        return descriptor;
    };
}
