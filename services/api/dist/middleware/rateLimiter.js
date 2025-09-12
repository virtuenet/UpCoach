"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicApiLimiter = exports.webhookLimiter = exports.uploadLimiter = exports.passwordResetLimiter = exports.authLimiter = exports.apiLimiter = void 0;
exports.createRateLimiter = createRateLimiter;
const crypto_1 = __importDefault(require("crypto"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("../utils/logger");
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
//# sourceMappingURL=rateLimiter.js.map