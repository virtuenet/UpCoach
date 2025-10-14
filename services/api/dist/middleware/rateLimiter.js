"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.threatDetectionMiddleware = exports.distributedRateLimiter = exports.intelligentRateLimiter = exports.publicApiLimiter = exports.webhookLimiter = exports.uploadLimiter = exports.passwordResetLimiter = exports.authLimiter = exports.apiLimiter = void 0;
exports.createRateLimiter = createRateLimiter;
const tslib_1 = require("tslib");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const express_rate_limit_1 = tslib_1.__importDefault(require("express-rate-limit"));
const logger_1 = require("../utils/logger");
const redis_1 = require("../services/redis");
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, _res) => {
        logger_1.logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            method: req.method,
        });
        _res.status(429).json({
            success: false,
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
        });
    },
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: req => generateRequestFingerprint(req),
    handler: (req, _res) => {
        logger_1.logger.error('Auth rate limit exceeded', {
            ip: req.ip,
            fingerprint: generateRequestFingerprint(req).substring(0, 10),
            path: req.path,
            body: { email: req.body?.email },
            userAgent: req.get('user-agent'),
        });
        _res.status(429).json({
            success: false,
            error: 'Too many authentication attempts',
            message: 'Account temporarily locked. Please try again in 15 minutes.',
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
});
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Upload limit exceeded, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
exports.webhookLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 1000,
    message: 'Webhook rate limit exceeded',
    standardHeaders: true,
    legacyHeaders: false,
});
exports.publicApiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 30,
    message: 'API rate limit exceeded, please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
});
function generateRequestFingerprint(req) {
    const components = [
        req.ip || 'unknown',
        req.get('user-agent') || 'no-agent',
        req.get('accept-language') || 'no-lang',
        req.get('accept-encoding') || '',
        req.get('sec-ch-ua') || '',
    ];
    return crypto_1.default.createHash('sha256').update(components.join('|')).digest('hex');
}
function createRateLimiter(options) {
    return (0, express_rate_limit_1.default)({
        windowMs: options.windowMs,
        max: options.max,
        message: options.message || 'Rate limit exceeded',
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: options.useFingerprint ? req => generateRequestFingerprint(req) : undefined,
        handler: (req, _res) => {
            logger_1.logger.warn('Custom rate limit exceeded', {
                ip: req.ip,
                fingerprint: options.useFingerprint
                    ? generateRequestFingerprint(req).substring(0, 10)
                    : undefined,
                path: req.path,
                limit: options.max,
                window: options.windowMs,
            });
            _res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                message: options.message || 'Please try again later.',
            });
        },
    });
}
async function getUserTrustScore(req) {
    const userId = req.user?.id;
    if (!userId) {
        return 0.3;
    }
    try {
        const trustScore = await redis_1.redis.get(`trust:${userId}`);
        if (trustScore) {
            return parseFloat(trustScore);
        }
        const violations = await redis_1.redis.get(`violations:${req.ip}`) || '0';
        const successfulRequests = await redis_1.redis.get(`success:${userId}`) || '1';
        const violationPenalty = Math.min(parseInt(violations) * 0.1, 0.7);
        const successBonus = Math.min(parseInt(successfulRequests) * 0.01, 0.4);
        const baseTrust = 0.5;
        const score = Math.max(0.1, Math.min(1, baseTrust + successBonus - violationPenalty));
        await redis_1.redis.setEx(`trust:${userId}`, 3600, score.toString());
        return score;
    }
    catch (error) {
        logger_1.logger.error('Error calculating user trust score:', error);
        return 0.3;
    }
}
exports.intelligentRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: async (req) => {
        const userTrust = await getUserTrustScore(req);
        return Math.floor(50 + (userTrust * 150));
    },
    keyGenerator: (req) => {
        const userId = req.user?.id || 'anonymous';
        return `${req.ip}:${userId}:${req.path}`;
    },
    handler: async (req, res) => {
        try {
            const violationsKey = `violations:${req.ip}`;
            const violations = await redis_1.redis.get(violationsKey);
            const violationCount = violations ? parseInt(violations) + 1 : 1;
            await redis_1.redis.setEx(violationsKey, 86400, violationCount.toString());
            const delay = Math.min(violationCount * 1000, 5000);
            const trustScore = await getUserTrustScore(req);
            setTimeout(() => {
                res.status(429).json({
                    success: false,
                    error: 'Rate limit exceeded',
                    message: 'Too many requests. Please slow down.',
                    retryAfter: Math.ceil(delay / 1000),
                    trustScore: trustScore || 'unknown',
                });
            }, delay);
        }
        catch (error) {
            res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                message: 'Too many requests. Please try again later.',
            });
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const distributedRateLimiter = async (req, res, next) => {
    try {
        const currentMinute = Math.floor(Date.now() / 60000);
        const key = `rate:${req.ip}:${currentMinute}`;
        const requests = await redis_1.redis.incr(key);
        await redis_1.redis.expire(key, 60);
        if (requests > 100) {
            res.status(429).json({
                success: false,
                error: 'Distributed rate limit exceeded',
                message: 'Too many requests per minute',
                requestCount: requests,
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Distributed rate limiter error:', error);
        next();
    }
};
exports.distributedRateLimiter = distributedRateLimiter;
const threatDetectionMiddleware = async (req, res, next) => {
    try {
        const suspiciousPatterns = [
            /union.*select/i,
            /<script/i,
            /javascript:/i,
            /onerror=/i,
            /onload=/i,
            /eval\(/i,
            /base64/i,
        ];
        const requestData = JSON.stringify(req.body) + req.url + (req.get('user-agent') || '');
        const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(requestData));
        if (hasSuspiciousPattern) {
            logger_1.logger.error('Suspicious request pattern detected', {
                ip: req.ip,
                path: req.path,
                userAgent: req.get('user-agent'),
                body: req.body,
            });
            const violationsKey = `violations:${req.ip}`;
            const violations = await redis_1.redis.get(violationsKey);
            const violationCount = violations ? parseInt(violations) + 5 : 5;
            await redis_1.redis.setEx(violationsKey, 86400, violationCount.toString());
            res.status(400).json({
                success: false,
                error: 'Invalid request pattern detected',
                message: 'Request blocked by security filter',
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Threat detection middleware error:', error);
        next();
    }
};
exports.threatDetectionMiddleware = threatDetectionMiddleware;
