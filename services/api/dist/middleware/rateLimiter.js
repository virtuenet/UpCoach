"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicApiLimiter = exports.webhookLimiter = exports.uploadLimiter = exports.passwordResetLimiter = exports.authLimiter = exports.apiLimiter = void 0;
exports.createRateLimiter = createRateLimiter;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
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
/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per fingerprint (IP + user agent)
 */
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each fingerprint to 5 requests per windowMs
    skipSuccessfulRequests: true, // Don't count successful requests
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Use fingerprinting for better bot detection
    keyGenerator: req => generateRequestFingerprint(req),
    handler: (req, _res) => {
        logger_1.logger.error('Auth rate limit exceeded', {
            ip: req.ip,
            fingerprint: generateRequestFingerprint(req).substring(0, 10),
            path: req.path,
            body: { email: req.body?.email }, // Log email for security monitoring
            userAgent: req.get('user-agent'),
        });
        _res.status(429).json({
            success: false,
            error: 'Too many authentication attempts',
            message: 'Account temporarily locked. Please try again in 15 minutes.',
        });
    },
});
/**
 * Moderate rate limiter for password reset endpoints
 * 3 requests per hour per IP
 */
exports.passwordResetLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    skipSuccessfulRequests: false,
    message: 'Too many password reset requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Strict rate limiter for file uploads
 * 10 uploads per hour per IP
 */
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Upload limit exceeded, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Rate limiter for webhook endpoints
 * 1000 requests per minute (for external services)
 */
exports.webhookLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 1000,
    message: 'Webhook rate limit exceeded',
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Flexible rate limiter for public API endpoints
 * 30 requests per minute per IP
 */
exports.publicApiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: 'API rate limit exceeded, please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Generate request fingerprint for better rate limiting
 * Combines IP with user agent and other factors
 */
function generateRequestFingerprint(req) {
    const components = [
        req.ip || 'unknown',
        req.get('user-agent') || 'no-agent',
        req.get('accept-language') || 'no-lang',
        // Add more entropy from headers that are hard to spoof
        req.get('accept-encoding') || '',
        req.get('sec-ch-ua') || '', // Browser client hints
    ];
    // Create hash of combined components
    return crypto_1.default.createHash('sha256').update(components.join('|')).digest('hex');
}
/**
 * Create a custom rate limiter with specific configuration
 */
function createRateLimiter(options) {
    return (0, express_rate_limit_1.default)({
        windowMs: options.windowMs,
        max: options.max,
        message: options.message || 'Rate limit exceeded',
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        standardHeaders: true,
        legacyHeaders: false,
        // Use fingerprint if enabled, otherwise use IP
        keyGenerator: options.useFingerprint ? req => generateRequestFingerprint(req) : undefined, // Uses default IP-based key
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