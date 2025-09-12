"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNonce = generateNonce;
exports.nonceMiddleware = nonceMiddleware;
exports.generateCSPWithNonce = generateCSPWithNonce;
exports.enhancedSecurityHeaders = enhancedSecurityHeaders;
const crypto_1 = __importDefault(require("crypto"));
function generateNonce() {
    return crypto_1.default.randomBytes(16).toString('base64');
}
function nonceMiddleware(req, _res, next) {
    const nonce = generateNonce();
    req.nonce = nonce;
    _res.locals.nonce = nonce;
    next();
}
function generateCSPWithNonce(nonce, isDevelopment = false) {
    const directives = [
        `default-src 'self'`,
        `script-src 'nonce-${nonce}' 'strict-dynamic' https: ${isDevelopment ? "'unsafe-eval'" : ''}`,
        `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com https://cdn.jsdelivr.net`,
        `font-src 'self' https://fonts.gstatic.com data:`,
        `img-src 'self' data: blob: https:`,
        `connect-src 'self' https://api.openai.com https://api.stripe.com wss: ${process.env.FRONTEND_URL || 'http://localhost:3000'} ${process.env.ADMIN_URL || 'http://localhost:8006'}`,
        `media-src 'self'`,
        `object-src 'none'`,
        `child-src 'self' blob:`,
        `worker-src 'self' blob:`,
        `frame-src 'self' https://js.stripe.com`,
        `form-action 'self'`,
        `frame-ancestors 'none'`,
        `base-uri 'self'`,
        `manifest-src 'self'`,
        `upgrade-insecure-requests`,
    ];
    return directives.join('; ');
}
function enhancedSecurityHeaders(isDevelopment = false) {
    return (req, _res, next) => {
        const nonce = req.nonce || generateNonce();
        req.nonce = nonce;
        _res.locals.nonce = nonce;
        const cspHeader = generateCSPWithNonce(nonce, isDevelopment);
        _res.setHeader('Content-Security-Policy', cspHeader);
        _res.setHeader('X-Content-Type-Options', 'nosniff');
        _res.setHeader('X-Frame-Options', 'DENY');
        _res.setHeader('X-XSS-Protection', '1; mode=block');
        _res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        _res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        if (!isDevelopment) {
            _res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }
        next();
    };
}
//# sourceMappingURL=securityNonce.js.map