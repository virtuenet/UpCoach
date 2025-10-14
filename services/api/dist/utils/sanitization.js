"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeString = sanitizeString;
exports.sanitizeRichText = sanitizeRichText;
exports.sanitizeObject = sanitizeObject;
exports.sanitizeSqlPattern = sanitizeSqlPattern;
exports.sanitizeFilename = sanitizeFilename;
exports.sanitizeUrl = sanitizeUrl;
exports.detectMaliciousPatterns = detectMaliciousPatterns;
exports.createSanitizationReport = createSanitizationReport;
const tslib_1 = require("tslib");
const isomorphic_dompurify_1 = tslib_1.__importDefault(require("isomorphic-dompurify"));
const logger_1 = require("./logger");
const DOMPurify = isomorphic_dompurify_1.default;
const STRICT_CONFIG = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    FORCE_BODY: true,
    SANITIZE_DOM: true,
    IN_PLACE: false,
};
const MODERATE_CONFIG = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'span'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};
function sanitizeString(input, logSuspicious = true) {
    if (typeof input !== 'string') {
        return input;
    }
    const originalLength = input.length;
    const sanitized = DOMPurify.sanitize(input, STRICT_CONFIG);
    if (logSuspicious && sanitized.length !== originalLength) {
        logger_1.logger.warn('Potential XSS attempt detected and sanitized', {
            originalLength,
            sanitizedLength: sanitized.length,
            sample: input.substring(0, 100),
        });
    }
    return sanitized.trim();
}
function sanitizeRichText(input) {
    if (typeof input !== 'string') {
        return input;
    }
    return DOMPurify.sanitize(input, MODERATE_CONFIG).trim();
}
function sanitizeObject(obj, strict = true) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (obj instanceof Date || obj instanceof RegExp || obj instanceof Buffer) {
        return obj;
    }
    if (typeof obj === 'function') {
        logger_1.logger.warn('Function detected in sanitization - potential security risk', {
            stack: new Error().stack?.split('\n').slice(0, 5),
        });
        return undefined;
    }
    if (typeof obj === 'string') {
        return (strict ? sanitizeString(obj, false) : sanitizeRichText(obj));
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item, strict));
    }
    if (typeof obj === 'object' && obj !== null) {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                logger_1.logger.warn('Potential prototype pollution attempt detected', {
                    key,
                    ip: global.currentRequestIp,
                });
                continue;
            }
            if (key === 'password' ||
                key === 'token' ||
                key === 'hash' ||
                key === 'secret' ||
                key === 'apiKey') {
                sanitized[key] = value;
            }
            else {
                sanitized[key] = sanitizeObject(value, strict);
            }
        }
        return sanitized;
    }
    return obj;
}
function sanitizeSqlPattern(input) {
    if (typeof input !== 'string') {
        return '';
    }
    logger_1.logger.warn('sanitizeSqlPattern used - consider using parameterized queries instead', {
        caller: new Error().stack?.split('\n')[2],
    });
    return input
        .replace(/[%_]/g, '\\$&')
        .replace(/'/g, "''")
        .trim();
}
function sanitizeFilename(filename) {
    if (typeof filename !== 'string') {
        return 'unnamed';
    }
    return filename
        .replace(/\.\./g, '')
        .replace(/[\/\\]/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 255);
}
function sanitizeUrl(url) {
    if (typeof url !== 'string') {
        return null;
    }
    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            logger_1.logger.warn('Invalid URL protocol attempted', { url, protocol: parsed.protocol });
            return null;
        }
        if (url.toLowerCase().includes('javascript:') || url.toLowerCase().includes('data:')) {
            logger_1.logger.warn('Potential XSS URL attempted', { url: url.substring(0, 100) });
            return null;
        }
        return parsed.toString();
    }
    catch (error) {
        return null;
    }
}
function detectMaliciousPatterns(input) {
    const patterns = [];
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(input)) {
        patterns.push('script_tag');
    }
    if (/on\w+\s*=/gi.test(input)) {
        patterns.push('event_handler');
    }
    if (/javascript:/gi.test(input)) {
        patterns.push('javascript_protocol');
    }
    if (/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b.*\b(FROM|INTO|WHERE)\b)/gi.test(input)) {
        patterns.push('sql_injection');
    }
    if (/[;&|`$()]/.test(input)) {
        patterns.push('command_injection');
    }
    return {
        isSuspicious: patterns.length > 0,
        patterns,
    };
}
function createSanitizationReport(original, sanitized) {
    const startTime = Date.now();
    const fieldsModified = [];
    const suspiciousPatterns = [];
    let originalSize = 0;
    let sanitizedSize = 0;
    try {
        originalSize = JSON.stringify(original).length;
        sanitizedSize = JSON.stringify(sanitized).length;
    }
    catch {
        originalSize = Object.keys(original || {}).length * 50;
        sanitizedSize = Object.keys(sanitized || {}).length * 50;
    }
    function compareObjects(orig, san, path = '') {
        if (typeof orig === 'string' && typeof san === 'string' && orig !== san) {
            fieldsModified.push(path || 'root');
            const detection = detectMaliciousPatterns(orig);
            if (detection.isSuspicious) {
                suspiciousPatterns.push(...detection.patterns);
            }
        }
        else if (typeof orig === 'object' && orig !== null) {
            for (const key in orig) {
                if (orig.hasOwnProperty(key)) {
                    compareObjects(orig[key], san[key], path ? `${path}.${key}` : key);
                }
            }
        }
    }
    compareObjects(original, sanitized);
    return {
        modified: fieldsModified.length > 0,
        fieldsModified: [...new Set(fieldsModified)],
        suspiciousPatterns: [...new Set(suspiciousPatterns)],
        processingTime: Date.now() - startTime,
        originalSize,
        sanitizedSize,
    };
}
exports.default = {
    sanitizeString,
    sanitizeRichText,
    sanitizeObject,
    sanitizeSqlPattern,
    sanitizeFilename,
    sanitizeUrl,
    detectMaliciousPatterns,
    createSanitizationReport,
};
