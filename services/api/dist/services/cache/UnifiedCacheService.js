"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedCacheService = void 0;
exports.getCacheService = getCacheService;
const tslib_1 = require("tslib");
const crypto_1 = require("crypto");
const util_1 = require("util");
const zlib = tslib_1.__importStar(require("zlib"));
const ioredis_1 = tslib_1.__importDefault(require("ioredis"));
const lru_cache_1 = require("lru-cache");
const logger_1 = require("../../utils/logger");
const gzip = (0, util_1.promisify)(zlib.gzip);
const gunzip = (0, util_1.promisify)(zlib.gunzip);
class UnifiedCacheService {
    redis = null;
    inMemoryCache;
    stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        hitRate: 0,
        memoryHits: 0,
        memoryMisses: 0,
        compressionRatio: 1,
    };
    defaultTTL;
    maxRetries;
    compressionThreshold;
    memoryMaxSize;
    defaultPrefix;
    cleanupInterval = null;
    tagIndex = new Map();
    constructor(options = {}) {
        this.defaultTTL = options.defaultTTL || 3600;
        this.maxRetries = options.maxRetries || 3;
        this.compressionThreshold = options.compressionThreshold || 1024;
        this.memoryMaxSize = options.memoryMaxSize || 1000;
        this.defaultPrefix = options.defaultPrefix || 'cache:';
        this.inMemoryCache = new lru_cache_1.LRUCache({
            max: this.memoryMaxSize,
            maxSize: this.memoryMaxSize * 1000,
            ttl: this.defaultTTL * 1000,
            updateAgeOnGet: true,
            updateAgeOnHas: true,
            sizeCalculation: (value) => {
                try {
                    const size = JSON.stringify(value.value).length;
                    return Math.ceil(size / 100);
                }
                catch {
                    return 1;
                }
            },
            dispose: (value, key) => {
                logger_1.logger.debug('LRU cache evicted key', { key });
            },
        });
        this.initializeRedis(options.redisUrl);
        this.startMemoryCleanup();
    }
    initializeRedis(redisUrl) {
        try {
            this.redis = new ioredis_1.default(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
                maxRetriesPerRequest: this.maxRetries,
                enableReadyCheck: true,
                enableOfflineQueue: true,
                retryStrategy: times => {
                    if (times > this.maxRetries) {
                        logger_1.logger.warn('Redis connection failed, falling back to in-memory cache');
                        this.redis = null;
                        return null;
                    }
                    return Math.min(times * 100, 3000);
                },
            });
            this.redis.on('connect', () => {
                logger_1.logger.info('Unified cache service connected to Redis');
            });
            this.redis.on('error', err => {
                logger_1.logger.error('Redis cache error:', err);
            });
            this.redis.on('close', () => {
                logger_1.logger.warn('Redis connection closed, using in-memory cache');
            });
        }
        catch (error) {
            logger_1.logger.warn('Redis initialization failed, using in-memory cache only', error);
            this.redis = null;
        }
    }
    generateKey(key, namespace, prefix) {
        const finalPrefix = prefix || namespace || this.defaultPrefix;
        if (key.length > 250) {
            const hash = (0, crypto_1.createHash)('sha256').update(key).digest('hex');
            return `${finalPrefix}${hash}`;
        }
        return `${finalPrefix}${key}`;
    }
    async compressValue(value) {
        if (value.length > this.compressionThreshold) {
            try {
                const compressed = await gzip(value);
                this.updateCompressionRatio(value.length, compressed.length);
                return compressed;
            }
            catch (error) {
                logger_1.logger.warn('Compression failed, storing uncompressed', error);
                return value;
            }
        }
        return value;
    }
    async decompressValue(value) {
        if (Buffer.isBuffer(value)) {
            try {
                const decompressed = await gunzip(value);
                return decompressed.toString();
            }
            catch (error) {
                logger_1.logger.warn('Decompression failed', error);
                return value.toString();
            }
        }
        return value;
    }
    updateCompressionRatio(original, compressed) {
        const ratio = compressed / original;
        this.stats.compressionRatio = this.stats.compressionRatio * 0.9 + ratio * 0.1;
    }
    updateHitRate() {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
    }
    cleanupMemoryCache() {
        if (typeof this.inMemoryCache.purgeStale === 'function') {
            this.inMemoryCache.purgeStale();
        }
        const stats = {
            size: this.inMemoryCache.size,
            calculatedSize: this.inMemoryCache.calculatedSize || this.inMemoryCache.size,
            hitRate: this.stats.hits > 0
                ? this.stats.memoryHits / (this.stats.memoryHits + this.stats.memoryMisses)
                : 0,
        };
        if (this.inMemoryCache.size > this.memoryMaxSize * 0.9) {
            logger_1.logger.warn('Memory cache approaching size limit', stats);
        }
    }
    startMemoryCleanup() {
        this.cleanupInterval = setInterval(() => {
            this.cleanupMemoryCache();
            if (this.stats.hits + this.stats.misses > 0) {
                this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
                logger_1.logger.info('Cache statistics', {
                    ...this.stats,
                    memoryCacheSize: this.inMemoryCache.size,
                });
            }
        }, 60000);
    }
    async get(key, options) {
        const cacheKey = this.generateKey(key, options?.namespace, options?.prefix);
        if (this.redis) {
            try {
                const cached = await this.redis.get(cacheKey);
                if (cached) {
                    this.stats.hits++;
                    this.updateHitRate();
                    const decompressed = await this.decompressValue(cached);
                    return JSON.parse(decompressed);
                }
            }
            catch (error) {
                logger_1.logger.warn('Redis get failed, trying memory cache', error);
            }
        }
        if (options?.fallbackToMemory !== false) {
            const memoryCached = this.inMemoryCache.get(cacheKey);
            if (memoryCached && memoryCached.expiry > Date.now()) {
                this.stats.memoryHits++;
                this.updateHitRate();
                if (memoryCached.compressed) {
                    const decompressed = await this.decompressValue(memoryCached.value);
                    return JSON.parse(decompressed);
                }
                return memoryCached.value;
            }
            this.stats.memoryMisses++;
        }
        this.stats.misses++;
        this.updateHitRate();
        return null;
    }
    async set(key, value, options) {
        const cacheKey = this.generateKey(key, options?.namespace, options?.prefix);
        const ttl = options?.ttl || this.defaultTTL;
        const stringValue = JSON.stringify(value);
        this.stats.sets++;
        const finalValue = options?.compress !== false ? await this.compressValue(stringValue) : stringValue;
        const isCompressed = Buffer.isBuffer(finalValue);
        if (this.redis) {
            try {
                if (isCompressed) {
                    await this.redis.setex(cacheKey, ttl, finalValue);
                }
                else {
                    await this.redis.setex(cacheKey, ttl, finalValue);
                }
                if (options?.tags && options.tags.length > 0) {
                    await this.addToTags(cacheKey, options.tags);
                }
            }
            catch (error) {
                logger_1.logger.warn('Redis set failed, using memory cache', error);
            }
        }
        if (!this.redis || options?.fallbackToMemory !== false) {
            this.inMemoryCache.set(cacheKey, {
                value: isCompressed ? finalValue : value,
                expiry: Date.now() + ttl * 1000,
                compressed: isCompressed,
            });
            if (this.inMemoryCache.size > this.memoryMaxSize) {
                this.cleanupMemoryCache();
            }
        }
    }
    async del(key, options) {
        const cacheKey = this.generateKey(key, options?.namespace, options?.prefix);
        this.stats.deletes++;
        if (this.redis) {
            try {
                await this.redis.del(cacheKey);
            }
            catch (error) {
                logger_1.logger.warn('Redis delete failed', error);
            }
        }
        if (this.inMemoryCache.has(cacheKey)) {
            this.inMemoryCache.delete(cacheKey);
        }
    }
    async invalidate(pattern, namespace) {
        const prefix = namespace || this.defaultPrefix;
        const fullPattern = `${prefix}${pattern}`;
        let invalidatedCount = 0;
        if (this.redis) {
            try {
                const keys = await this.redis.keys(fullPattern);
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                    invalidatedCount += keys.length;
                }
            }
            catch (error) {
                logger_1.logger.warn('Redis invalidate failed', error);
            }
        }
        const memoryKeys = Array.from(this.inMemoryCache.keys()).filter(k => k.match(new RegExp(fullPattern.replace(/\*/g, '.*'))));
        memoryKeys.forEach(key => {
            if (this.inMemoryCache.has(key)) {
                this.inMemoryCache.delete(key);
            }
        });
        invalidatedCount += memoryKeys.length;
        logger_1.logger.info(`Invalidated ${invalidatedCount} cache keys matching pattern: ${pattern}`);
        return invalidatedCount;
    }
    async invalidateByTags(tags) {
        let invalidatedCount = 0;
        for (const tag of tags) {
            const keys = this.tagIndex.get(tag);
            if (keys) {
                for (const key of keys) {
                    await this.del(key);
                    invalidatedCount++;
                }
                this.tagIndex.delete(tag);
            }
        }
        return invalidatedCount;
    }
    async addToTags(key, tags) {
        for (const tag of tags) {
            if (!this.tagIndex.has(tag)) {
                this.tagIndex.set(tag, new Set());
            }
            this.tagIndex.get(tag).add(key);
        }
    }
    async exists(key, options) {
        const cacheKey = this.generateKey(key, options?.namespace, options?.prefix);
        if (this.redis) {
            try {
                const exists = await this.redis.exists(cacheKey);
                if (exists === 1)
                    return true;
            }
            catch (error) {
                logger_1.logger.warn('Redis exists check failed', error);
            }
        }
        const memoryCached = this.inMemoryCache.get(cacheKey);
        return !!(memoryCached && memoryCached.expiry > Date.now());
    }
    async ttl(key, options) {
        const cacheKey = this.generateKey(key, options?.namespace, options?.prefix);
        if (this.redis) {
            try {
                return await this.redis.ttl(cacheKey);
            }
            catch (error) {
                logger_1.logger.warn('Redis TTL check failed', error);
            }
        }
        const memoryCached = this.inMemoryCache.get(cacheKey);
        if (memoryCached && memoryCached.expiry > Date.now()) {
            return Math.floor((memoryCached.expiry - Date.now()) / 1000);
        }
        return -1;
    }
    async flush() {
        if (this.redis) {
            try {
                await this.redis.flushdb();
            }
            catch (error) {
                logger_1.logger.warn('Redis flush failed', error);
            }
        }
        this.inMemoryCache.clear();
        this.tagIndex.clear();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            hitRate: 0,
            memoryHits: 0,
            memoryMisses: 0,
            compressionRatio: 1,
        };
    }
    getStats() {
        return { ...this.stats };
    }
    async disconnect() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        if (this.redis) {
            await this.redis.quit();
            this.redis = null;
        }
        this.inMemoryCache.clear();
        this.tagIndex.clear();
    }
    async getOrSet(key, factory, options) {
        const cached = await this.get(key, options);
        if (cached !== null) {
            return cached;
        }
        const value = await factory();
        await this.set(key, value, options);
        return value;
    }
    async getCachedResponse(key, factory, options) {
        return this.getOrSet(key, factory, { ...options, compress: true });
    }
}
exports.UnifiedCacheService = UnifiedCacheService;
let instance = null;
function getCacheService() {
    if (!instance) {
        instance = new UnifiedCacheService();
    }
    return instance;
}
exports.default = UnifiedCacheService;
