"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfProtection = csrfProtection;
exports.csrfToken = csrfToken;
exports.configureCsrf = configureCsrf;
exports.validateCsrfToken = validateCsrfToken;
const crypto_1 = __importDefault(require("crypto"));
const redis_1 = require("../services/redis");
const logger_1 = require("../utils/logger");
function generateCsrfToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
function hashToken(token, secret) {
    return crypto_1.default.createHmac('sha256', secret).update(token).digest('hex');
}
function verifyToken(token, hash, secret) {
    const expectedHash = hashToken(token, secret);
    return crypto_1.default.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
}
function csrfProtection(options = {}) {
    const { secret = process.env.CSRF_SECRET || crypto_1.default.randomBytes(32).toString('hex'), tokenExpiry = 3600, cookieName = 'csrf-token', headerName = 'x-csrf-token', methods = ['POST', 'PUT', 'DELETE', 'PATCH'], excludePaths = ['/api/auth/login', '/api/auth/register', '/api/financial/webhook/stripe'], doubleSubmit = false, } = options;
    return async (req, _res, next) => {
        if (excludePaths.some(path => req.path.startsWith(path))) {
            return next();
        }
        if (!methods.includes(req.method)) {
            return next();
        }
        if (req.headers.authorization && req.user) {
            return next();
        }
        try {
            if (doubleSubmit) {
                const cookieToken = req.cookies[cookieName];
                const headerToken = req.headers[headerName] || req.body._csrf;
                if (!cookieToken || !headerToken) {
                    logger_1.logger.warn('CSRF token missing', {
                        path: req.path,
                        hasCookie: !!cookieToken,
                        hasHeader: !!headerToken,
                    });
                    return _res.status(403).json({
                        error: 'CSRF token missing',
                        code: 'CSRF_TOKEN_MISSING',
                    });
                }
                if (!crypto_1.default.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
                    logger_1.logger.warn('CSRF token mismatch', { path: req.path });
                    return _res.status(403).json({
                        error: 'Invalid CSRF token',
                        code: 'CSRF_TOKEN_INVALID',
                    });
                }
            }
            else {
                const sessionId = req.session?.id || req.cookies['session-id'];
                if (!sessionId) {
                    logger_1.logger.warn('No session for CSRF validation', { path: req.path });
                    return _res.status(403).json({
                        error: 'Session required',
                        code: 'SESSION_REQUIRED',
                    });
                }
                const providedToken = req.headers[headerName] || req.body._csrf || req.query._csrf;
                if (!providedToken) {
                    logger_1.logger.warn('CSRF token not provided', { path: req.path });
                    return _res.status(403).json({
                        error: 'CSRF token required',
                        code: 'CSRF_TOKEN_REQUIRED',
                    });
                }
                const storedTokenKey = `csrf:${sessionId}`;
                const storedToken = await redis_1.redis.get(storedTokenKey);
                if (!storedToken) {
                    logger_1.logger.warn('CSRF token not found in storage', { path: req.path });
                    return _res.status(403).json({
                        error: 'CSRF token expired or not found',
                        code: 'CSRF_TOKEN_EXPIRED',
                    });
                }
                const [_token, hash] = storedToken.split(':');
                if (!verifyToken(providedToken, hash, secret)) {
                    logger_1.logger.warn('CSRF token verification failed', { path: req.path });
                    return _res.status(403).json({
                        error: 'Invalid CSRF token',
                        code: 'CSRF_TOKEN_INVALID',
                    });
                }
                const newToken = generateCsrfToken();
                const newHash = hashToken(newToken, secret);
                await redis_1.redis.setEx(storedTokenKey, tokenExpiry, `${newToken}:${newHash}`);
                _res.setHeader('X-CSRF-Token', newToken);
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('CSRF protection error', { error });
            _res.status(500).json({
                error: 'CSRF validation error',
                code: 'CSRF_ERROR',
            });
        }
    };
}
function csrfToken(options = {}) {
    const { secret = process.env.CSRF_SECRET || crypto_1.default.randomBytes(32).toString('hex'), tokenExpiry = 3600, cookieName = 'csrf-token', doubleSubmit = false, } = options;
    return async (req, _res, next) => {
        req.csrfToken = async () => {
            if (doubleSubmit) {
                const token = generateCsrfToken();
                _res.cookie(cookieName, token, {
                    httpOnly: false,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: tokenExpiry * 1000,
                });
                return token;
            }
            else {
                const sessionId = req.session?.id || req.cookies['session-id'];
                if (!sessionId) {
                    throw new Error('Session required for CSRF token generation');
                }
                const token = generateCsrfToken();
                const hash = hashToken(token, secret);
                const key = `csrf:${sessionId}`;
                await redis_1.redis.setEx(key, tokenExpiry, `${token}:${hash}`);
                return token;
            }
        };
        if (req.method === 'GET') {
            try {
                _res.locals.csrfToken = await req.csrfToken();
            }
            catch (error) {
                logger_1.logger.debug('Could not generate CSRF token', { error });
            }
        }
        next();
    };
}
function configureCsrf(app) {
    app.use(csrfToken({
        doubleSubmit: process.env.CSRF_DOUBLE_SUBMIT === 'true',
        tokenExpiry: parseInt(process.env.CSRF_TOKEN_EXPIRY || '3600', 10),
    }));
    app.use(csrfProtection({
        doubleSubmit: process.env.CSRF_DOUBLE_SUBMIT === 'true',
        excludePaths: [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/refresh',
            '/api/financial/webhook/stripe',
            '/api/webhooks',
            '/health',
            '/metrics',
        ],
    }));
}
async function validateCsrfToken(token, sessionId, secret = process.env.CSRF_SECRET || '') {
    try {
        const key = `csrf:${sessionId}`;
        const stored = await redis_1.redis.get(key);
        if (!stored) {
            return false;
        }
        const [, hash] = stored.split(':');
        return verifyToken(token, hash, secret);
    }
    catch (error) {
        logger_1.logger.error('CSRF token validation error', { error });
        return false;
    }
}
//# sourceMappingURL=csrf.js.map