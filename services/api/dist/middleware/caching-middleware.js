"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonCacheMiddleware = void 0;
exports.cacheMiddleware = cacheMiddleware;
exports.invalidateCache = invalidateCache;
exports.warmCache = warmCache;
exports.cacheStatus = cacheStatus;
exports.conditionalCache = conditionalCache;
exports.cacheBasedRateLimit = cacheBasedRateLimit;
const crypto_1 = require("crypto");
const PerformanceCacheService_1 = require("../services/cache/PerformanceCacheService");
const logger_1 = require("../utils/logger");
function generateCacheKey(req, customKey) {
    if (typeof customKey === 'function') {
        return customKey(req);
    }
    if (typeof customKey === 'string') {
        return customKey;
    }
    const method = req.method;
    const path = req.route?.path || req.path;
    const query = JSON.stringify(req.query);
    const body = req.method === 'POST' || req.method === 'PUT' ? JSON.stringify(req.body) : '';
    const userId = req.user?.id || 'anonymous';
    const keyData = `${method}:${path}:${query}:${body}:${userId}`;
    const hash = (0, crypto_1.createHash)('md5').update(keyData).digest('hex');
    return PerformanceCacheService_1.CacheKeys.apiResponse(path, hash);
}
function shouldCache(req, res, config) {
    if (config.skipCache) {
        return false;
    }
    if (config.condition && !config.condition(req, res)) {
        return false;
    }
    if (req.method !== 'GET') {
        return false;
    }
    if (req.headers.authorization && !config.key) {
        logger_1.logger.debug('Skipping cache for authenticated request without explicit key');
        return false;
    }
    return true;
}
function extractVaryData(req, varyBy) {
    if (!varyBy || varyBy.length === 0) {
        return '';
    }
    const varyData = {};
    for (const field of varyBy) {
        switch (field.toLowerCase()) {
            case 'user-agent':
                varyData['user-agent'] = req.get('user-agent');
                break;
            case 'accept-language':
                varyData['accept-language'] = req.get('accept-language');
                break;
            case 'authorization':
                varyData['authorized'] = !!req.headers.authorization;
                break;
            case 'user-id':
                varyData['user-id'] = req.user?.id;
                break;
            default:
                varyData[field] = req.get(field) || req.body?.[field] || req.query?.[field];
        }
    }
    return JSON.stringify(varyData);
}
function cacheMiddleware(config = {}) {
    return async (req, res, next) => {
        if (process.env.NODE_ENV === 'development' && !process.env.ENABLE_DEV_CACHE) {
            return next();
        }
        try {
            if (!shouldCache(req, res, config)) {
                return next();
            }
            let cacheKey = generateCacheKey(req, config.key);
            if (config.varyBy) {
                const varyData = extractVaryData(req, config.varyBy);
                const varyHash = (0, crypto_1.createHash)('md5').update(varyData).digest('hex');
                cacheKey += `:vary:${varyHash}`;
            }
            const cachedResponse = await PerformanceCacheService_1.performanceCacheService.get(cacheKey);
            if (cachedResponse) {
                logger_1.logger.debug('Cache hit', { key: cacheKey, path: req.path });
                res.set({
                    'X-Cache': 'HIT',
                    'X-Cache-Key': cacheKey.substring(0, 32) + '...',
                    'Cache-Control': `public, max-age=${config.ttl || PerformanceCacheService_1.CacheTTL.DEFAULT}`
                });
                return res.status(cachedResponse.statusCode || 200).json(cachedResponse.data);
            }
            logger_1.logger.debug('Cache miss', { key: cacheKey, path: req.path });
            const originalSend = res.send;
            const originalJson = res.json;
            let responseData;
            let statusCode = 200;
            res.json = function (data) {
                responseData = data;
                statusCode = res.statusCode;
                return originalJson.call(this, data);
            };
            res.send = function (data) {
                if (!responseData) {
                    responseData = data;
                    statusCode = res.statusCode;
                }
                return originalSend.call(this, data);
            };
            res.on('finish', async () => {
                try {
                    if (statusCode >= 200 && statusCode < 300 && responseData) {
                        const cacheData = {
                            data: responseData,
                            statusCode,
                            timestamp: Date.now(),
                            headers: res.getHeaders()
                        };
                        const ttl = config.ttl || PerformanceCacheService_1.CacheTTL.DEFAULT;
                        await PerformanceCacheService_1.performanceCacheService.set(cacheKey, cacheData, ttl);
                        if (config.tags && config.tags.length > 0) {
                            for (const tag of config.tags) {
                                const tagKey = `cache:tag:${tag}`;
                                await PerformanceCacheService_1.performanceCacheService.sadd(tagKey, [cacheKey], ttl);
                            }
                        }
                        logger_1.logger.debug('Response cached', {
                            key: cacheKey,
                            path: req.path,
                            statusCode,
                            ttl
                        });
                    }
                }
                catch (error) {
                    logger_1.logger.error('Error caching response', { key: cacheKey, error });
                }
            });
            res.set({
                'X-Cache': 'MISS',
                'X-Cache-Key': cacheKey.substring(0, 32) + '...'
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Cache middleware error', error);
            next();
        }
    };
}
function invalidateCache(patterns) {
    return async (req, res, next) => {
        try {
            const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
            res.on('finish', async () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        let totalInvalidated = 0;
                        for (const pattern of patternsArray) {
                            const resolvedPattern = pattern
                                .replace('{{userId}}', req.user?.id || '*')
                                .replace('{{id}}', req.params.id || '*')
                                .replace('{{route}}', req.route?.path || req.path);
                            const invalidated = await PerformanceCacheService_1.performanceCacheService.invalidatePattern(resolvedPattern);
                            totalInvalidated += invalidated;
                        }
                        if (totalInvalidated > 0) {
                            logger_1.logger.info('Cache invalidated', {
                                patterns: patternsArray,
                                invalidated: totalInvalidated,
                                path: req.path,
                                method: req.method
                            });
                        }
                    }
                    catch (error) {
                        logger_1.logger.error('Cache invalidation error', error);
                    }
                }
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Cache invalidation middleware error', error);
            next();
        }
    };
}
function warmCache(warmupConfig) {
    return async (req, res, next) => {
        try {
            if (warmupConfig.condition && !warmupConfig.condition(req)) {
                return next();
            }
            setImmediate(async () => {
                try {
                    const data = await warmupConfig.handler(req);
                    const ttl = warmupConfig.ttl || PerformanceCacheService_1.CacheTTL.DEFAULT;
                    await PerformanceCacheService_1.performanceCacheService.set(warmupConfig.key, data, ttl);
                    logger_1.logger.debug('Cache warmed', {
                        key: warmupConfig.key,
                        ttl,
                        path: req.path
                    });
                }
                catch (error) {
                    logger_1.logger.error('Cache warming error', { key: warmupConfig.key, error });
                }
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Cache warming middleware error', error);
            next();
        }
    };
}
function cacheStatus() {
    return async (req, res, next) => {
        if (req.path === '/cache/status' && req.method === 'GET') {
            try {
                const stats = await PerformanceCacheService_1.performanceCacheService.getCacheStats();
                return res.json({
                    cache: stats,
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                return res.status(500).json({
                    error: 'Failed to get cache status',
                    details: error.message
                });
            }
        }
        next();
    };
}
function conditionalCache(config) {
    return (req, res, next) => {
        let selectedConfig;
        if (req.user) {
            if (req.user.isPremium && config.premium) {
                selectedConfig = config.premium;
            }
            else if (config.authenticated) {
                selectedConfig = config.authenticated;
            }
            else {
                return next();
            }
        }
        else {
            selectedConfig = config.anonymous || {};
        }
        return cacheMiddleware(selectedConfig)(req, res, next);
    };
}
function cacheBasedRateLimit(config) {
    return async (req, res, next) => {
        try {
            const key = config.keyGenerator ?
                config.keyGenerator(req) :
                `rate_limit:${req.ip}:${req.path}`;
            const currentCount = await PerformanceCacheService_1.performanceCacheService.increment(key, 1, Math.ceil(config.windowMs / 1000));
            const remaining = Math.max(0, config.maxRequests - currentCount);
            res.set({
                'X-RateLimit-Limit': config.maxRequests.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString()
            });
            if (currentCount > config.maxRequests) {
                return res.status(429).json({
                    error: 'Too many requests',
                    retryAfter: Math.ceil(config.windowMs / 1000)
                });
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Rate limiting error', error);
            next();
        }
    };
}
exports.commonCacheMiddleware = {
    publicContent: cacheMiddleware({
        ttl: PerformanceCacheService_1.CacheTTL.CONTENT,
        varyBy: ['accept-language'],
        tags: ['content']
    }),
    userSpecific: cacheMiddleware({
        ttl: PerformanceCacheService_1.CacheTTL.SHORT,
        varyBy: ['user-id'],
        condition: (req) => !!req.user
    }),
    analytics: cacheMiddleware({
        ttl: PerformanceCacheService_1.CacheTTL.ANALYTICS,
        tags: ['analytics']
    }),
    mlResults: cacheMiddleware({
        ttl: PerformanceCacheService_1.CacheTTL.ML,
        tags: ['ml', 'predictions']
    }),
    noCache: (req, res, next) => {
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });
        next();
    }
};
