"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeaders = securityHeaders;
exports.customSecurityHeaders = customSecurityHeaders;
exports.secureCors = secureCors;
exports.requestId = requestId;
exports.securityMonitoring = securityMonitoring;
exports.applySecurityMiddleware = applySecurityMiddleware;
const helmet_1 = __importDefault(require("helmet"));
const logger_1 = require("../utils/logger");
const cspConfig = {
    defaultSrc: ["'self'"],
    scriptSrc: [
        "'self'",
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
        'https://www.google-analytics.com',
        'https://www.googletagmanager.com',
    ],
    styleSrc: [
        "'self'",
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net',
    ],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
    imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
    connectSrc: [
        "'self'",
        'https://api.openai.com',
        'https://api.stripe.com',
        'wss:',
        process.env.FRONTEND_URL || 'http://localhost:3000',
        process.env.ADMIN_URL || 'http://localhost:8006',
    ],
    mediaSrc: ["'self'"],
    objectSrc: ["'none'"],
    childSrc: ["'self'", 'blob:'],
    workerSrc: ["'self'", 'blob:'],
    frameSrc: ["'self'", 'https://js.stripe.com'],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    manifestSrc: ["'self'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : undefined,
};
function securityHeaders() {
    return (0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: cspConfig,
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
        frameguard: {
            action: 'deny',
        },
        noSniff: true,
        xssFilter: true,
        referrerPolicy: {
            policy: 'strict-origin-when-cross-origin',
        },
        permittedCrossDomainPolicies: {
            permittedPolicies: 'none',
        },
        dnsPrefetchControl: {
            allow: false,
        },
        ieNoOpen: true,
        hidePoweredBy: true,
    });
}
function customSecurityHeaders() {
    return (req, _res, next) => {
        _res.setHeader('Permissions-Policy', [
            'accelerometer=()',
            'ambient-light-sensor=()',
            'autoplay=()',
            'battery=()',
            'camera=()',
            'cross-origin-isolated=()',
            'display-capture=()',
            'document-domain=()',
            'encrypted-media=()',
            'execution-while-not-rendered=()',
            'execution-while-out-of-viewport=()',
            'fullscreen=(self)',
            'geolocation=()',
            'gyroscope=()',
            'keyboard-map=()',
            'magnetometer=()',
            'microphone=()',
            'midi=()',
            'navigation-override=()',
            'payment=()',
            'picture-in-picture=()',
            'publickey-credentials-get=()',
            'screen-wake-lock=()',
            'sync-xhr=()',
            'usb=()',
            'web-share=()',
            'xr-spatial-tracking=()',
        ].join(', '));
        if (req.path === '/api/auth/logout') {
            _res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
        }
        if (req.path.includes('/api/') && !req.path.includes('/public')) {
            _res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            _res.setHeader('Pragma', 'no-cache');
            _res.setHeader('Expires', '0');
            _res.setHeader('Surrogate-Control', 'no-store');
        }
        _res.setHeader('X-Download-Options', 'noopen');
        _res.setHeader('X-DNS-Prefetch-Control', 'off');
        if (process.env.NODE_ENV === 'production') {
            _res.setHeader('Expect-CT', 'max-age=86400, enforce');
        }
        next();
    };
}
function secureCors() {
    const allowedOrigins = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(origin => origin);
    if (allowedOrigins.length === 0) {
        allowedOrigins.push(process.env.FRONTEND_URL || 'http://localhost:3000', process.env.ADMIN_URL || 'http://localhost:8006', process.env.CMS_URL || 'http://localhost:8007');
    }
    return (req, _res, next) => {
        const origin = req.headers.origin;
        if (origin && allowedOrigins.includes(origin)) {
            _res.setHeader('Access-Control-Allow-Origin', origin);
            _res.setHeader('Access-Control-Allow-Credentials', 'true');
            _res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
            _res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
            _res.setHeader('Access-Control-Max-Age', '86400');
            _res.setHeader('Access-Control-Expose-Headers', 'X-CSRF-Token, X-Request-Id');
        }
        if (req.method === 'OPTIONS') {
            _res.sendStatus(204);
            return;
        }
        next();
    };
}
function requestId() {
    return (req, _res, next) => {
        const id = req.headers['x-request-id'] ||
            req.headers['x-correlation-id'] ||
            `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        req.id = id;
        _res.setHeader('X-Request-Id', id);
        next();
    };
}
function securityMonitoring() {
    return (req, _res, next) => {
        const securityEvents = [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/reset-password',
            '/api/admin',
            '/api/financial',
        ];
        if (securityEvents.some(path => req.path.startsWith(path))) {
            logger_1.logger.info('Security event', {
                event: 'security_action',
                path: req.path,
                method: req.method,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                requestId: req.id,
                userId: req.user?.id,
            });
        }
        const suspiciousPatterns = [
            /(<script|javascript:|onerror=|onload=)/i,
            /(union.*select|select.*from|insert.*into|delete.*from)/i,
            /(\.\.\/?){2,}/,
            /%00|%0d|%0a/i,
        ];
        const checkSuspicious = (value) => {
            return suspiciousPatterns.some(pattern => pattern.test(value));
        };
        const url = req.url;
        const body = JSON.stringify(req.body || {});
        if (checkSuspicious(url) || checkSuspicious(body)) {
            logger_1.logger.warn('Suspicious request detected', {
                event: 'suspicious_request',
                path: req.path,
                method: req.method,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                requestId: req.id,
            });
        }
        next();
    };
}
function applySecurityMiddleware(app) {
    app.use(requestId());
    app.use(securityHeaders());
    app.use(customSecurityHeaders());
    app.use(secureCors());
    app.use(securityMonitoring());
    logger_1.logger.info('Security middleware applied successfully');
}
//# sourceMappingURL=security.js.map