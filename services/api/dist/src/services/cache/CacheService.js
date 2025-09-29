"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const redis_1 = require("../redis");
const logger_1 = require("../../utils/logger");
const environment_1 = require("../../config/environment");
class CacheService {
    static instance;
    stats = {
        hits: 0,
        misses: 0,
        hitRate: 0,
        operations: { get: 0, set: 0, delete: 0, invalidate: 0 },
        memory: { used: 0, peak: 0 },
    };
    DEFAULT_TTL = 3600;
    MAX_KEY_LENGTH = 250;
    MAX_VALUE_SIZE = 1024 * 1024;
    COMPRESSION_THRESHOLD = 1024;
    constructor() {
        this.startStatsCollection();
    }
    static getInstance() {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }
    async get(key, options = {}) {
        try {
            const startTime = process.hrtime.bigint();
            this.stats.operations.get++;
            const cacheKey = this.buildKey(key, options.namespace);
            this.validateKey(cacheKey);
            const result = await redis_1.redis.get(cacheKey);
            if (result === null) {
                this.stats.misses++;
                this.updateHitRate();
                return null;
            }
            const entry = JSON.parse(result);
            let value = entry.value;
            if (entry.compressed) {
                value = await this.decompress(value);
            }
            if (options.serialize !== false && typeof value === 'string') {
                try {
                    value = JSON.parse(value);
                }
                catch {
                }
            }
            this.stats.hits++;
            this.updateHitRate();
            const endTime = process.hrtime.bigint();
            const duration = Number(endTime - startTime) / 1000000;
            logger_1.logger.debug('Cache hit', {
                key: cacheKey,
                size: entry.size,
                compressed: entry.compressed,
                duration: `${duration.toFixed(2)}ms`,
            });
            return value;
        }
        catch (error) {
            logger_1.logger.error('Cache get error:', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    async set(key, value, options = {}) {
        try {
            const startTime = process.hrtime.bigint();
            this.stats.operations.set++;
            const cacheKey = this.buildKey(key, options.namespace);
            this.validateKey(cacheKey);
            let serializedValue = value;
            if (options.serialize !== false && typeof value === 'object') {
                serializedValue = JSON.stringify(value);
            }
            const valueSize = Buffer.byteLength(serializedValue, 'utf8');
            if (valueSize > this.MAX_VALUE_SIZE) {
                logger_1.logger.warn('Cache value too large, skipping', {
                    key: cacheKey,
                    size: valueSize,
                    maxSize: this.MAX_VALUE_SIZE,
                });
                return false;
            }
            let finalValue = serializedValue;
            let compressed = false;
            if (options.compress !== false && valueSize > this.COMPRESSION_THRESHOLD) {
                finalValue = await this.compress(serializedValue);
                compressed = true;
            }
            const entry = {
                value: finalValue,
                ttl: options.ttl || this.DEFAULT_TTL,
                createdAt: Date.now(),
                tags: options.tags,
                compressed,
                size: valueSize,
            };
            const ttl = options.ttl || this.DEFAULT_TTL;
            await redis_1.redis.setEx(cacheKey, ttl, JSON.stringify(entry));
            if (options.tags && options.tags.length > 0) {
                await this.addToTagIndex(cacheKey, options.tags, ttl);
            }
            const endTime = process.hrtime.bigint();
            const duration = Number(endTime - startTime) / 1000000;
            logger_1.logger.debug('Cache set', {
                key: cacheKey,
                size: valueSize,
                compressed,
                ttl,
                duration: `${duration.toFixed(2)}ms`,
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Cache set error:', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    async delete(key, options = {}) {
        try {
            this.stats.operations.delete++;
            const cacheKey = this.buildKey(key, options.namespace);
            const result = await redis_1.redis.del(cacheKey);
            logger_1.logger.debug('Cache delete', { key: cacheKey, found: result > 0 });
            return result > 0;
        }
        catch (error) {
            logger_1.logger.error('Cache delete error:', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    async exists(key, options = {}) {
        try {
            const cacheKey = this.buildKey(key, options.namespace);
            const result = await redis_1.redis.exists(cacheKey);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error('Cache exists error:', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    async increment(key, amount = 1, options = {}) {
        try {
            const cacheKey = this.buildKey(key, options.namespace);
            const result = await redis_1.redis.incrBy(cacheKey, amount);
            if (result === amount) {
                const ttl = options.ttl || this.DEFAULT_TTL;
                await redis_1.redis.expire(cacheKey, ttl);
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error('Cache increment error:', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return 0;
        }
    }
    async getMultiple(keys, options = {}) {
        try {
            const cacheKeys = keys.map(key => this.buildKey(key, options.namespace));
            const results = await redis_1.redis.mGet(cacheKeys);
            const resultMap = new Map();
            for (let i = 0; i < keys.length; i++) {
                const originalKey = keys[i];
                const result = results[i];
                if (result === null) {
                    resultMap.set(originalKey, null);
                    this.stats.misses++;
                }
                else {
                    try {
                        const entry = JSON.parse(result);
                        let value = entry.value;
                        if (entry.compressed) {
                            value = await this.decompress(value);
                        }
                        if (typeof value === 'string') {
                            try {
                                value = JSON.parse(value);
                            }
                            catch {
                            }
                        }
                        resultMap.set(originalKey, value);
                        this.stats.hits++;
                    }
                    catch (parseError) {
                        logger_1.logger.error('Cache entry parse error:', {
                            key: originalKey,
                            error: parseError instanceof Error ? parseError.message : 'Unknown error',
                        });
                        resultMap.set(originalKey, null);
                        this.stats.misses++;
                    }
                }
            }
            this.updateHitRate();
            return resultMap;
        }
        catch (error) {
            logger_1.logger.error('Cache getMultiple error:', {
                keys,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return new Map(keys.map(key => [key, null]));
        }
    }
    async setMultiple(entries) {
        try {
            const results = await Promise.all(entries.map(entry => this.set(entry.key, entry.value, entry.options || {})));
            return results;
        }
        catch (error) {
            logger_1.logger.error('Cache setMultiple error:', {
                entryCount: entries.length,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return entries.map(() => false);
        }
    }
    async invalidateByTags(tags) {
        try {
            this.stats.operations.invalidate++;
            let totalDeleted = 0;
            for (const tag of tags) {
                const tagKey = this.buildTagKey(tag);
                const keys = await redis_1.redis.sMembers(tagKey);
                if (keys.length > 0) {
                    const deleted = await redis_1.redis.del(...keys);
                    totalDeleted += deleted;
                    await redis_1.redis.del(tagKey);
                }
            }
            logger_1.logger.info('Cache invalidation by tags', {
                tags,
                keysDeleted: totalDeleted,
            });
            return totalDeleted;
        }
        catch (error) {
            logger_1.logger.error('Cache invalidateByTags error:', {
                tags,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return 0;
        }
    }
    async clearNamespace(namespace) {
        try {
            const pattern = this.buildKey('*', namespace);
            const keys = await redis_1.redis.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }
            const deleted = await redis_1.redis.del(...keys);
            logger_1.logger.info('Cache namespace cleared', {
                namespace,
                keysDeleted: deleted,
            });
            return deleted;
        }
        catch (error) {
            logger_1.logger.error('Cache clearNamespace error:', {
                namespace,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return 0;
        }
    }
    async getOrSet(key, factory, options = {}) {
        try {
            const cached = await this.get(key, options);
            if (cached !== null) {
                return cached;
            }
            const value = await factory();
            await this.set(key, value, options);
            return value;
        }
        catch (error) {
            logger_1.logger.error('Cache getOrSet error:', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            try {
                return await factory();
            }
            catch (factoryError) {
                throw factoryError;
            }
        }
    }
    async warmCache(key, factory, options = {}) {
        const warmupThreshold = options.warmupThreshold || 0.2;
        try {
            const cacheKey = this.buildKey(key, options.namespace);
            const result = await redis_1.redis.get(cacheKey);
            if (result !== null) {
                const entry = JSON.parse(result);
                const age = Date.now() - entry.createdAt;
                const remainingLife = (entry.ttl * 1000) - age;
                const shouldWarm = remainingLife < (entry.ttl * 1000 * warmupThreshold);
                if (shouldWarm) {
                    setImmediate(async () => {
                        try {
                            const newValue = await factory();
                            await this.set(key, newValue, options);
                            logger_1.logger.debug('Cache warmed', { key: cacheKey });
                        }
                        catch (error) {
                            logger_1.logger.error('Cache warming failed:', {
                                key: cacheKey,
                                error: error instanceof Error ? error.message : 'Unknown error',
                            });
                        }
                    });
                }
                return this.get(key, options);
            }
            return this.getOrSet(key, factory, options);
        }
        catch (error) {
            logger_1.logger.error('Cache warmCache error:', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return factory();
        }
    }
    getStats() {
        return { ...this.stats };
    }
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            hitRate: 0,
            operations: { get: 0, set: 0, delete: 0, invalidate: 0 },
            memory: { used: 0, peak: 0 },
        };
    }
    async healthCheck() {
        try {
            const startTime = process.hrtime.bigint();
            const testKey = 'health_check_' + Date.now();
            await this.set(testKey, 'test', { ttl: 60 });
            const retrieved = await this.get(testKey);
            await this.delete(testKey);
            const endTime = process.hrtime.bigint();
            const latency = Number(endTime - startTime) / 1000000;
            const memoryInfo = await redis_1.redis.info('memory');
            return {
                status: retrieved === 'test' ? 'healthy' : 'unhealthy',
                latency,
                memory: this.parseRedisMemoryInfo(memoryInfo),
                stats: this.getStats(),
            };
        }
        catch (error) {
            logger_1.logger.error('Cache health check failed:', error);
            return {
                status: 'unhealthy',
                latency: -1,
                memory: {},
                stats: this.getStats(),
            };
        }
    }
    buildKey(key, namespace) {
        const prefix = environment_1.config.cache?.prefix || 'upcoach';
        const parts = [prefix];
        if (namespace) {
            parts.push(namespace);
        }
        parts.push(key);
        return parts.join(':');
    }
    buildTagKey(tag) {
        return this.buildKey(`tag:${tag}`, 'tags');
    }
    validateKey(key) {
        if (key.length > this.MAX_KEY_LENGTH) {
            throw new Error(`Cache key too long: ${key.length} > ${this.MAX_KEY_LENGTH}`);
        }
        if (key.includes(' ')) {
            throw new Error('Cache key cannot contain spaces');
        }
    }
    async addToTagIndex(key, tags, ttl) {
        try {
            const pipeline = redis_1.redis.multi();
            for (const tag of tags) {
                const tagKey = this.buildTagKey(tag);
                pipeline.sAdd(tagKey, key);
                pipeline.expire(tagKey, ttl + 60);
            }
            await pipeline.exec();
        }
        catch (error) {
            logger_1.logger.error('Failed to add to tag index:', error);
        }
    }
    async compress(value) {
        try {
            const zlib = require('zlib');
            const compressed = zlib.gzipSync(Buffer.from(value));
            return compressed.toString('base64');
        }
        catch (error) {
            logger_1.logger.error('Compression failed:', error);
            return value;
        }
    }
    async decompress(value) {
        try {
            const zlib = require('zlib');
            const buffer = Buffer.from(value, 'base64');
            const decompressed = zlib.gunzipSync(buffer);
            return decompressed.toString();
        }
        catch (error) {
            logger_1.logger.error('Decompression failed:', error);
            return value;
        }
    }
    updateHitRate() {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    }
    startStatsCollection() {
        setInterval(async () => {
            try {
                const memoryInfo = await redis_1.redis.info('memory');
                const parsed = this.parseRedisMemoryInfo(memoryInfo);
                this.stats.memory.used = parsed.used_memory || 0;
                this.stats.memory.peak = Math.max(this.stats.memory.peak, this.stats.memory.used);
            }
            catch (error) {
                logger_1.logger.debug('Failed to collect cache memory stats:', error);
            }
        }, 30000);
    }
    parseRedisMemoryInfo(info) {
        const lines = info.split('\r\n');
        const memory = {};
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                if (key.startsWith('used_memory')) {
                    memory[key] = parseInt(value, 10);
                }
            }
        }
        return memory;
    }
}
exports.CacheService = CacheService;
exports.cacheService = CacheService.getInstance();
//# sourceMappingURL=CacheService.js.map