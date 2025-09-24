"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.threatDetectionMiddleware = exports.distributedRateLimiter = exports.intelligentRateLimiter = exports.publicApiLimiter = exports.webhookLimiter = exports.uploadLimiter = exports.passwordResetLimiter = exports.authLimiter = exports.apiLimiter = void 0;
exports.createRateLimiter = createRateLimiter;
exports.clearRateLimit = clearRateLimit;
const crypto_1 = __importDefault(require("crypto"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = __importDefault(require("rate-limit-redis"));
const logger_1 = require("../utils/logger");
const redis_1 = require("../services/redis");
function generateSecureFingerprint(req) {
    const secret = process.env.FINGERPRINT_SECRET || 'default-fingerprint-secret-change-me';
    const components = [
        req.ip || 'unknown',
        req.get('user-agent') || 'no-agent',
        req.get('accept-language') || 'no-lang',
        req.get('accept-encoding') || 'no-encoding',
        req.get('sec-ch-ua') || 'no-ch-ua',
        req.get('sec-ch-ua-platform') || 'no-platform',
        req.socket.getPeerCertificate?.()?.fingerprint || 'no-tls',
    ];
    return crypto_1.default
        .createHmac('sha256', secret)
        .update(components.join('|'))
        .digest('hex');
}
function createRedisStore(windowMs) {
    return new rate_limit_redis_1.default({
        client: redis_1.redis,
        sendCommand: (...args) => redis_1.redis.sendCommand(args),
        windowMs,
        prefix: 'rl:',
    });
}
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore(15 * 60 * 1000),
    keyGenerator: (req) => req.ip || 'unknown',
    handler: (req, res) => {
        logger_1.logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            method: req.method,
            userAgent: req.get('user-agent'),
        });
        res.status(429).json({
            success: false,
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: res.getHeader('Retry-After'),
        });
    },
    skip: (req) => {
        return req.path === '/health';
    },
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore(15 * 60 * 1000),
    keyGenerator: (req) => generateSecureFingerprint(req),
    handler: async (req, res) => {
        const fingerprint = generateSecureFingerprint(req);
        await trackViolation(req.ip || 'unknown', 'auth_rate_limit');
        logger_1.logger.error('Auth rate limit exceeded', {
            ip: req.ip,
            fingerprint: fingerprint.substring(0, 10),
            path: req.path,
            email: req.body?.email,
            userAgent: req.get('user-agent'),
        });
        res.status(429).json({
            success: false,
            error: 'Too many authentication attempts',
            message: 'Account temporarily locked. Please try again in 15 minutes.',
            retryAfter: res.getHeader('Retry-After'),
        });
    },
});
exports.passwordResetLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 3,
    skipSuccessfulRequests: false,
    message: 'Too many password reset requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore(60 * 60 * 1000),
    keyGenerator: (req) => {
        const email = req.body?.email || req.ip || 'unknown';
        return crypto_1.default.createHash('sha256').update(email.toLowerCase()).digest('hex');
    },
});
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Upload limit exceeded, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore(60 * 60 * 1000),
});
exports.webhookLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 1000,
    message: 'Webhook rate limit exceeded',
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore(60 * 1000),
});
exports.publicApiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 30,
    message: 'API rate limit exceeded, please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore(60 * 1000),
});
async function trackViolation(identifier, violationType) {
    try {
        const key = `violations:${identifier}:${violationType}`;
        const count = await redis_1.redis.incr(key);
        if (count === 1) {
            await redis_1.redis.expire(key, 86400);
        }
        if (count >= 10) {
            logger_1.logger.error('High violation count detected', {
                identifier,
                violationType,
                count,
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Error tracking violation:', error);
    }
}
const intelligentRateLimiter = (options) => {
    const baseLimit = options?.baseLimit || 50;
    const windowMs = options?.windowMs || 15 * 60 * 1000;
    return (0, express_rate_limit_1.default)({
        windowMs,
        max: async (req) => {
            const trustScore = await getUserTrustScore(req);
            return Math.floor(baseLimit + (trustScore * 150));
        },
        keyGenerator: (req) => {
            const userId = req.user?.id || 'anonymous';
            return `${req.ip}:${userId}:${req.path}`;
        },
        store: createRedisStore(windowMs),
        handler: async (req, res) => {
            await trackViolation(req.ip || 'unknown', 'intelligent_rate_limit');
            const trustScore = await getUserTrustScore(req);
            res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                message: 'Too many requests. Please slow down.',
                trustScore: Math.round(trustScore * 100) / 100,
                retryAfter: res.getHeader('Retry-After'),
            });
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};
exports.intelligentRateLimiter = intelligentRateLimiter;
async function getUserTrustScore(req) {
    const userId = req.user?.id;
    const identifier = userId || req.ip || 'unknown';
    try {
        const cachedScore = await redis_1.redis.get(`trust:${identifier}`);
        if (cachedScore) {
            return parseFloat(cachedScore);
        }
        const [violations, successes] = await Promise.all([
            redis_1.redis.get(`violations:${identifier}:total`) || '0',
            redis_1.redis.get(`success:${identifier}`) || '0',
        ]);
        const violationCount = parseInt(String(violations));
        const successCount = parseInt(String(successes));
        const baseTrust = 0.5;
        const violationPenalty = Math.min(violationCount * 0.05, 0.4);
        const successBonus = Math.min(successCount * 0.001, 0.4);
        const score = Math.max(0.1, Math.min(1, baseTrust + successBonus - violationPenalty));
        await redis_1.redis.setEx(`trust:${identifier}`, 3600, score.toString());
        return score;
    }
    catch (error) {
        logger_1.logger.error('Error calculating user trust score:', error);
        return 0.3;
    }
}
const distributedRateLimiter = (options = {}) => {
    const windowMs = options.windowMs || 60000;
    const maxRequests = options.maxRequests || 100;
    const keyPrefix = options.keyPrefix || 'dist';
    return async (req, res, next) => {
        try {
            const window = Math.floor(Date.now() / windowMs);
            const identifier = req.ip || 'unknown';
            const key = `${keyPrefix}:${identifier}:${window}`;
            const pipeline = redis_1.redis.pipeline();
            pipeline.incr(key);
            pipeline.expire(key, Math.ceil(windowMs / 1000));
            const results = await pipeline.exec();
            if (!results || results.length < 1) {
                return next();
            }
            const [[incrErr, requestCount]] = results;
            if (incrErr) {
                logger_1.logger.error('Distributed rate limiter error:', incrErr);
                return next();
            }
            if (requestCount > maxRequests) {
                await trackViolation(identifier, 'distributed_rate_limit');
                res.setHeader('X-RateLimit-Limit', String(maxRequests));
                res.setHeader('X-RateLimit-Remaining', '0');
                res.setHeader('X-RateLimit-Reset', String(new Date((window + 1) * windowMs).toISOString()));
                return res.status(429).json({
                    success: false,
                    error: 'Rate limit exceeded',
                    message: `Too many requests. Limit: ${maxRequests} per ${windowMs / 1000} seconds`,
                });
            }
            res.setHeader('X-RateLimit-Limit', String(maxRequests));
            res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - requestCount)));
            res.setHeader('X-RateLimit-Reset', String(new Date((window + 1) * windowMs).toISOString()));
            next();
        }
        catch (error) {
            logger_1.logger.error('Distributed rate limiter error:', error);
            next();
        }
    };
};
exports.distributedRateLimiter = distributedRateLimiter;
const threatDetectionMiddleware = async (req, res, next) => {
    try {
        const suspiciousPatterns = [
            /union\s+select/i,
            /select\s+.*\s+from\s+information_schema/i,
            /<script[^>]*>/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /eval\s*\(/i,
            /base64_decode/i,
            /\.\.\//g,
            /etc\/passwd/i,
            /cmd\.exe/i,
            /powershell/i,
            /%00/g,
            /\x00/g,
        ];
        const requestData = [
            JSON.stringify(req.body),
            req.url,
            decodeURIComponent(req.url),
            req.get('user-agent') || '',
            JSON.stringify(req.headers),
        ].join(' ');
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(requestData)) {
                await trackViolation(req.ip || 'unknown', 'suspicious_pattern');
                logger_1.logger.error('Suspicious request pattern detected', {
                    ip: req.ip,
                    path: req.path,
                    pattern: pattern.source,
                    userAgent: req.get('user-agent'),
                    body: req.body,
                });
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request',
                    message: 'Request blocked by security filter',
                });
            }
        }
        const contentLength = parseInt(req.get('content-length') || '0');
        if (contentLength > 10 * 1024 * 1024) {
            await trackViolation(req.ip || 'unknown', 'oversized_request');
            return res.status(413).json({
                success: false,
                error: 'Payload too large',
                message: 'Request size exceeds limit',
            });
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Threat detection middleware error:', error);
        next();
    }
};
exports.threatDetectionMiddleware = threatDetectionMiddleware;
function createRateLimiter(options) {
    return (0, express_rate_limit_1.default)({
        windowMs: options.windowMs,
        max: options.max,
        message: options.message || 'Rate limit exceeded',
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        standardHeaders: true,
        legacyHeaders: false,
        store: createRedisStore(options.windowMs),
        keyGenerator: options.useFingerprint
            ? (req) => generateSecureFingerprint(req)
            : (req) => `${options.keyPrefix || 'custom'}:${req.ip || 'unknown'}`,
        handler: async (req, res) => {
            const identifier = options.useFingerprint
                ? generateSecureFingerprint(req).substring(0, 10)
                : req.ip || 'unknown';
            await trackViolation(identifier, 'custom_rate_limit');
            logger_1.logger.warn('Custom rate limit exceeded', {
                ip: req.ip,
                fingerprint: options.useFingerprint ? identifier : undefined,
                path: req.path,
                limit: options.max,
                window: options.windowMs,
            });
            res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                message: options.message || 'Please try again later.',
                retryAfter: res.getHeader('Retry-After'),
            });
        },
    });
}
async function clearRateLimit(identifier, limiterType = 'api') {
    try {
        const pattern = `rl:${limiterType}:${identifier}*`;
        const keys = await redis_1.redis.keys(pattern);
        if (keys.length > 0) {
            await redis_1.redis.del(...keys);
            logger_1.logger.info(`Cleared rate limits for ${identifier} (${limiterType})`);
        }
    }
    catch (error) {
        logger_1.logger.error('Error clearing rate limit:', error);
    }
}
//# sourceMappingURL=rateLimiter-secure.js.map