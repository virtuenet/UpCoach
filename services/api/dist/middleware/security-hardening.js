"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityMiddlewareStack = exports.contentLengthLimit = exports.requestTimeout = exports.ipFilter = exports.securityLogger = exports.sanitizeRequest = exports.corsConfig = exports.apiRateLimit = exports.authRateLimit = exports.generalRateLimit = exports.createRateLimiter = exports.securityHeaders = void 0;
const tslib_1 = require("tslib");
const helmet_1 = tslib_1.__importDefault(require("helmet"));
const express_rate_limit_1 = tslib_1.__importDefault(require("express-rate-limit"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const logger_1 = require("../utils/logger");
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://checkout.stripe.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: [
                "'self'",
                "https://api.stripe.com",
                "https://api.openai.com",
                "https://api.anthropic.com",
                "wss://upcoach.ai"
            ],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
        reportOnly: process.env.NODE_ENV === 'development'
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    permittedCrossDomainPolicies: false,
    hidePoweredBy: true,
    ieNoOpen: true,
    dnsPrefetchControl: { allow: false }
});
const createRateLimiter = (options) => {
    return (0, express_rate_limit_1.default)({
        windowMs: options.windowMs,
        max: options.max,
        message: {
            error: options.message || 'Too many requests, please try again later',
            retryAfter: Math.ceil(options.windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        skipFailedRequests: options.skipFailedRequests || false,
        keyGenerator: (req) => {
            const ip = req.ip || req.connection.remoteAddress || 'unknown';
            const userAgent = req.get('User-Agent') || 'unknown';
            return `${ip}-${Buffer.from(userAgent).toString('base64').slice(0, 10)}`;
        },
        skip: (req) => {
            if (process.env.NODE_ENV === 'development') {
                const trustedIPs = ['127.0.0.1', '::1', 'localhost'];
                return trustedIPs.includes(req.ip);
            }
            return false;
        },
        onLimitReached: (req) => {
            logger_1.logger.warn('Rate limit exceeded', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path,
                method: req.method
            });
        }
    });
};
exports.createRateLimiter = createRateLimiter;
exports.generalRateLimit = (0, exports.createRateLimiter)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later'
});
exports.authRateLimit = (0, exports.createRateLimiter)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts, please try again later',
    skipSuccessfulRequests: true
});
exports.apiRateLimit = (0, exports.createRateLimiter)({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: 'API rate limit exceeded, please slow down'
});
exports.corsConfig = (0, cors_1.default)({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'https://upcoach.ai',
            'https://www.upcoach.ai',
            'https://admin.upcoach.ai',
            'https://cms.upcoach.ai',
            'https://app.upcoach.ai'
        ];
        if (process.env.NODE_ENV === 'development') {
            allowedOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:1005', 'http://localhost:1006', 'http://localhost:1007');
        }
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            logger_1.logger.warn('CORS violation attempted', { origin });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-CSRF-Token'
    ]
});
const sanitizeRequest = (req, res, next) => {
    const sanitizeString = (str) => {
        return str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/onload=/gi, '')
            .replace(/onerror=/gi, '')
            .trim();
    };
    const sanitizeObject = (obj) => {
        if (typeof obj === 'string') {
            return sanitizeString(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }
        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = sanitizeObject(value);
            }
            return sanitized;
        }
        return obj;
    };
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
};
exports.sanitizeRequest = sanitizeRequest;
const securityLogger = (req, res, next) => {
    const startTime = Date.now();
    const securityInfo = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString(),
        headers: {
            origin: req.get('Origin'),
            referer: req.get('Referer'),
            host: req.get('Host'),
            contentType: req.get('Content-Type')
        }
    };
    const suspiciousPatterns = [
        /\b(union|select|insert|delete|drop|create|alter)\s+/i,
        /<script|javascript:|vbscript:|onload=|onerror=/i,
        /\.\.\//g,
        /\${.*}/g,
        /eval\s*\(/i,
    ];
    const requestString = JSON.stringify(req.body) + req.url + JSON.stringify(req.query);
    const suspiciousDetected = suspiciousPatterns.some(pattern => pattern.test(requestString));
    if (suspiciousDetected) {
        logger_1.logger.warn('Suspicious request detected', {
            ...securityInfo,
            body: req.body,
            query: req.query,
            params: req.params
        });
    }
    const originalEnd = res.end;
    res.end = function (...args) {
        const duration = Date.now() - startTime;
        if (res.statusCode >= 400 || suspiciousDetected) {
            logger_1.logger.info('Request completed', {
                ...securityInfo,
                statusCode: res.statusCode,
                duration,
                suspicious: suspiciousDetected
            });
        }
        originalEnd.apply(this, args);
    };
    next();
};
exports.securityLogger = securityLogger;
const ipFilter = (req, res, next) => {
    const clientIP = req.ip;
    const blockedIPs = process.env.BLOCKED_IPS?.split(',') || [];
    const allowedIPs = process.env.ALLOWED_IPS?.split(',') || [];
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
        logger_1.logger.warn('IP not in allowlist', { ip: clientIP });
        return res.status(403).json({ error: 'Access denied' });
    }
    if (blockedIPs.includes(clientIP)) {
        logger_1.logger.warn('Blocked IP attempted access', { ip: clientIP });
        return res.status(403).json({ error: 'Access denied' });
    }
    next();
};
exports.ipFilter = ipFilter;
const requestTimeout = (timeoutMs = 30000) => {
    return (req, res, next) => {
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                logger_1.logger.warn('Request timeout', {
                    method: req.method,
                    path: req.path,
                    ip: req.ip,
                    timeout: timeoutMs
                });
                res.status(408).json({ error: 'Request timeout' });
            }
        }, timeoutMs);
        res.on('finish', () => {
            clearTimeout(timeout);
        });
        next();
    };
};
exports.requestTimeout = requestTimeout;
const contentLengthLimit = (maxSize = 10 * 1024 * 1024) => {
    return (req, res, next) => {
        const contentLength = parseInt(req.get('Content-Length') || '0');
        if (contentLength > maxSize) {
            logger_1.logger.warn('Request exceeds content length limit', {
                contentLength,
                maxSize,
                ip: req.ip,
                path: req.path
            });
            return res.status(413).json({ error: 'Payload too large' });
        }
        next();
    };
};
exports.contentLengthLimit = contentLengthLimit;
exports.securityMiddlewareStack = [
    exports.securityHeaders,
    exports.corsConfig,
    exports.generalRateLimit,
    exports.ipFilter,
    (0, exports.requestTimeout)(),
    (0, exports.contentLengthLimit)(),
    exports.sanitizeRequest,
    exports.securityLogger
];
exports.default = {
    securityHeaders: exports.securityHeaders,
    generalRateLimit: exports.generalRateLimit,
    authRateLimit: exports.authRateLimit,
    apiRateLimit: exports.apiRateLimit,
    corsConfig: exports.corsConfig,
    sanitizeRequest: exports.sanitizeRequest,
    securityLogger: exports.securityLogger,
    ipFilter: exports.ipFilter,
    requestTimeout: exports.requestTimeout,
    contentLengthLimit: exports.contentLengthLimit,
    securityMiddlewareStack: exports.securityMiddlewareStack
};
