"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeaders = securityHeaders;
exports.customSecurityHeaders = customSecurityHeaders;
exports.secureCors = secureCors;
exports.requestId = requestId;
exports.securityMonitoring = securityMonitoring;
exports.applySecurityMiddleware = applySecurityMiddleware;
const tslib_1 = require("tslib");
const helmet_1 = tslib_1.__importDefault(require("helmet"));
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
        process.env.FRONTEND_URL || 'http://localhost:8005',
        process.env.ADMIN_URL || 'http://localhost:8006',
        process.env.CMS_URL || 'http://localhost:8007',
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
class AdvancedThreatDetector {
    static SQL_INJECTION_PATTERNS = [
        {
            pattern: /\b(union|union\s+all)\s+(select|distinct)\b/gi,
            type: 'sqli',
            confidence: 0.95,
            name: 'UNION_SELECT'
        },
        {
            pattern: /\bunion\s*(?:\/\*.*?\*\/)?\s*select\b/gi,
            type: 'sqli',
            confidence: 0.90,
            name: 'UNION_SELECT_OBFUSCATED'
        },
        {
            pattern: /\b(?:select|insert|update|delete|drop|create|alter|exec|execute)\s+.*\s+union\b/gi,
            type: 'sqli',
            confidence: 0.85,
            name: 'NESTED_UNION'
        },
        {
            pattern: /\b(and|or)\s+(\d+\s*=\s*\d+|'[^']*'\s*=\s*'[^']*')(\s*(--|#|;)|$)/gi,
            type: 'sqli',
            confidence: 0.80,
            name: 'BOOLEAN_BLIND'
        },
        {
            pattern: /\b(and|or)\s+\d+\s*(>|<|>=|<=|=|<>)\s*\d+/gi,
            type: 'sqli',
            confidence: 0.75,
            name: 'BOOLEAN_COMPARISON'
        },
        {
            pattern: /\b(sleep|pg_sleep|waitfor\s+delay|benchmark)\s*\(/gi,
            type: 'sqli',
            confidence: 0.90,
            name: 'TIME_BASED_BLIND'
        },
        {
            pattern: /\bif\s*\(.+,\s*(sleep|benchmark|pg_sleep)\s*\(/gi,
            type: 'sqli',
            confidence: 0.85,
            name: 'CONDITIONAL_TIME_BASED'
        },
        {
            pattern: /\b(extractvalue|updatexml|xpath|exp|pow|floor|rand|count)\s*\(/gi,
            type: 'sqli',
            confidence: 0.70,
            name: 'ERROR_BASED_MYSQL'
        },
        {
            pattern: /\b(cast|convert|try_cast)\s*\(.+\s+as\s+(int|numeric|decimal)\s*\)/gi,
            type: 'sqli',
            confidence: 0.75,
            name: 'ERROR_BASED_CAST'
        },
        {
            pattern: /\b(load_file|into\s+outfile|into\s+dumpfile)\s*\(/gi,
            type: 'sqli',
            confidence: 0.95,
            name: 'FILE_OPERATIONS'
        },
        {
            pattern: /\b(exec|execute|sp_executesql|xp_cmdshell)\s*\(/gi,
            type: 'sqli',
            confidence: 0.90,
            name: 'COMMAND_EXECUTION'
        },
        {
            pattern: /(%[0-9a-fA-F]{2}){4,}/g,
            type: 'sqli',
            confidence: 0.60,
            name: 'URL_ENCODED_PAYLOAD'
        },
        {
            pattern: /\b(select|union|insert|update|delete|drop|create|alter)\s*\/\*.*?\*\/\s*(select|from|where|union|password)/gi,
            type: 'sqli',
            confidence: 0.80,
            name: 'COMMENT_OBFUSCATED'
        },
        {
            pattern: /\b(select|insert|update|delete)\s+.+\s+from\s*\(.+\s+(select|union)\s+.+\)/gi,
            type: 'sqli',
            confidence: 0.85,
            name: 'SUBQUERY_INJECTION'
        },
        {
            pattern: /\bexists\s*\(\s*select\b/gi,
            type: 'sqli',
            confidence: 0.80,
            name: 'EXISTS_SUBQUERY'
        },
        {
            pattern: /;\s*(select|insert|update|delete|drop|create|alter)\s+/gi,
            type: 'sqli',
            confidence: 0.90,
            name: 'MULTI_STATEMENT'
        },
        {
            pattern: /(select.*from|insert.*into|delete.*from|update.*set)\s+/gi,
            type: 'sqli',
            confidence: 0.65,
            name: 'BASIC_SQL_KEYWORDS'
        },
        {
            pattern: /(<script|javascript:|onerror=|onload=|onclick=|onmouseover=)/gi,
            type: 'xss',
            confidence: 0.85,
            name: 'XSS_PATTERNS'
        },
        {
            pattern: /(\.\.[\\/]){2,}/g,
            type: 'path_traversal',
            confidence: 0.90,
            name: 'PATH_TRAVERSAL'
        },
        {
            pattern: /%00|%0d|%0a/gi,
            type: 'null_byte',
            confidence: 0.85,
            name: 'NULL_BYTE_INJECTION'
        }
    ];
    static detectThreats(value) {
        const startTime = process.hrtime.bigint();
        const results = [];
        const decodedValue = this.decodeValue(value);
        for (const { pattern, type, confidence, name } of this.SQL_INJECTION_PATTERNS) {
            const testValues = [value, decodedValue].filter((v, i, arr) => arr.indexOf(v) === i);
            for (const testValue of testValues) {
                const matches = testValue.match(pattern);
                if (matches) {
                    results.push({
                        isSuspicious: true,
                        threatType: type,
                        confidence,
                        pattern: name
                    });
                    if (confidence >= 0.85) {
                        break;
                    }
                }
            }
        }
        const endTime = process.hrtime.bigint();
        const processingTime = Number(endTime - startTime) / 1000000;
        if (processingTime > 5) {
            logger_1.logger.warn('SQL injection detection exceeded performance threshold', {
                processingTime: `${processingTime.toFixed(2)}ms`,
                valueLength: value.length,
                resultCount: results.length
            });
        }
        return results;
    }
    static decodeValue(value) {
        try {
            let decoded = decodeURIComponent(value);
            decoded = decoded
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#x27;/g, "'")
                .replace(/&#x2F;/g, '/');
            return decoded;
        }
        catch {
            return value;
        }
    }
}
function securityMonitoring() {
    return (req, _res, next) => {
        const startTime = process.hrtime.bigint();
        const securityEvents = [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/reset-password',
            '/api/admin',
            '/api/financial',
            '/api/v2/auth/google',
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
        const valuesToCheck = [
            req.url,
            JSON.stringify(req.body || {}),
            JSON.stringify(req.query || {}),
            req.headers['user-agent'] || '',
            req.headers['referer'] || '',
        ];
        let highestThreat = null;
        const allThreats = [];
        for (const value of valuesToCheck) {
            const threats = AdvancedThreatDetector.detectThreats(value);
            allThreats.push(...threats);
            for (const threat of threats) {
                if (!highestThreat || threat.confidence > highestThreat.confidence) {
                    highestThreat = threat;
                }
            }
        }
        if (highestThreat && highestThreat.confidence >= 0.85) {
            const endTime = process.hrtime.bigint();
            const processingTime = Number(endTime - startTime) / 1000000;
            logger_1.logger.error('High-confidence security threat detected', {
                event: 'security_threat_critical',
                path: req.path,
                method: req.method,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                requestId: req.id,
                userId: req.user?.id,
                threatType: highestThreat.threatType,
                confidence: highestThreat.confidence,
                pattern: highestThreat.pattern,
                processingTime: `${processingTime.toFixed(2)}ms`,
                threatCount: allThreats.length,
                payloadIndicators: {
                    urlLength: req.url.length,
                    bodySize: JSON.stringify(req.body || {}).length,
                    hasQueryParams: Object.keys(req.query || {}).length > 0
                }
            });
        }
        else if (highestThreat && highestThreat.confidence >= 0.70) {
            logger_1.logger.warn('Potential security threat detected', {
                event: 'security_threat_medium',
                path: req.path,
                method: req.method,
                ip: req.ip,
                requestId: req.id,
                threatType: highestThreat.threatType,
                confidence: highestThreat.confidence,
                pattern: highestThreat.pattern,
                threatCount: allThreats.length
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
