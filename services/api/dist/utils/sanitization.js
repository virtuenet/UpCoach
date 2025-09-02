"use strict";
/**
 * Sanitization utilities using DOMPurify for XSS prevention
 * Provides secure HTML sanitization for user inputs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeString = sanitizeString;
exports.sanitizeRichText = sanitizeRichText;
exports.sanitizeObject = sanitizeObject;
exports.sanitizeSqlPattern = sanitizeSqlPattern;
exports.sanitizeFilename = sanitizeFilename;
exports.sanitizeUrl = sanitizeUrl;
exports.detectMaliciousPatterns = detectMaliciousPatterns;
exports.createSanitizationReport = createSanitizationReport;
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
const logger_1 = require("./logger");
// Initialize DOMPurify
const DOMPurify = isomorphic_dompurify_1.default;
/**
 * Strict sanitization configuration for API inputs
 * Removes all HTML tags and attributes
 */
const STRICT_CONFIG = {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    FORCE_BODY: true,
    SANITIZE_DOM: true,
    IN_PLACE: false,
};
/**
 * Moderate sanitization for content that may contain formatting
 * Allows basic text formatting tags
 */
const MODERATE_CONFIG = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'span'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};
/**
 * Sanitize a string input - removes all HTML
 */
function sanitizeString(input, logSuspicious = true) {
    if (typeof input !== 'string') {
        return input;
    }
    const originalLength = input.length;
    const sanitized = DOMPurify.sanitize(input, STRICT_CONFIG);
    // Log if content was modified (potential XSS attempt)
    if (logSuspicious && sanitized.length !== originalLength) {
        logger_1.logger.warn('Potential XSS attempt detected and sanitized', {
            originalLength,
            sanitizedLength: sanitized.length,
            sample: input.substring(0, 100), // Log first 100 chars only
        });
    }
    return sanitized.trim();
}
/**
 * Sanitize string with moderate settings (allows some formatting)
 */
function sanitizeRichText(input) {
    if (typeof input !== 'string') {
        return input;
    }
    return DOMPurify.sanitize(input, MODERATE_CONFIG).trim();
}
/**
 * Recursively sanitize an object's string values
 */
function sanitizeObject(obj, strict = true) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    // Handle special object types
    if (obj instanceof Date || obj instanceof RegExp || obj instanceof Buffer) {
        return obj;
    }
    // Functions shouldn't be in data objects - log and remove
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
            // Protect against prototype pollution
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                logger_1.logger.warn('Potential prototype pollution attempt detected', {
                    key,
                    ip: global.currentRequestIp,
                });
                continue;
            }
            // Skip certain fields that shouldn't be sanitized
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
/**
 * Sanitize SQL-like patterns in strings
 * Note: Parameterized queries should be used instead when possible
 */
function sanitizeSqlPattern(input) {
    if (typeof input !== 'string') {
        return '';
    }
    // Log warning about using this function
    logger_1.logger.warn('sanitizeSqlPattern used - consider using parameterized queries instead', {
        caller: new Error().stack?.split('\n')[2],
    });
    // Only escape SQL wildcards for LIKE queries and quotes
    // Don't remove keywords as they might be legitimate search terms
    return input
        .replace(/[%_]/g, '\\$&') // Escape LIKE wildcards
        .replace(/'/g, "''") // Escape single quotes (SQL standard)
        .trim();
}
/**
 * Sanitize filename to prevent path traversal attacks
 */
function sanitizeFilename(filename) {
    if (typeof filename !== 'string') {
        return 'unnamed';
    }
    // Remove path traversal attempts and special characters
    return filename
        .replace(/\.\./g, '') // Remove ..
        .replace(/[\/\\]/g, '_') // Replace slashes
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Keep only safe characters
        .substring(0, 255); // Limit length
}
/**
 * Validate and sanitize URL
 */
function sanitizeUrl(url) {
    if (typeof url !== 'string') {
        return null;
    }
    try {
        const parsed = new URL(url);
        // Only allow http(s) protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            logger_1.logger.warn('Invalid URL protocol attempted', { url, protocol: parsed.protocol });
            return null;
        }
        // Prevent javascript: and data: URLs
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
/**
 * Check if input contains potentially malicious patterns
 */
function detectMaliciousPatterns(input) {
    const patterns = [];
    // Check for script tags
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(input)) {
        patterns.push('script_tag');
    }
    // Check for event handlers
    if (/on\w+\s*=/gi.test(input)) {
        patterns.push('event_handler');
    }
    // Check for javascript: protocol
    if (/javascript:/gi.test(input)) {
        patterns.push('javascript_protocol');
    }
    // Check for SQL injection patterns
    if (/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b.*\b(FROM|INTO|WHERE)\b)/gi.test(input)) {
        patterns.push('sql_injection');
    }
    // Check for command injection patterns
    if (/[;&|`$()]/.test(input)) {
        patterns.push('command_injection');
    }
    return {
        isSuspicious: patterns.length > 0,
        patterns,
    };
}
/**
 * Create a sanitization report for logging
 */
function createSanitizationReport(original, sanitized) {
    const startTime = Date.now();
    const fieldsModified = [];
    const suspiciousPatterns = [];
    // Calculate data sizes
    let originalSize = 0;
    let sanitizedSize = 0;
    try {
        originalSize = JSON.stringify(original).length;
        sanitizedSize = JSON.stringify(sanitized).length;
    }
    catch {
        // If stringify fails, estimate based on object keys
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
        fieldsModified: [...new Set(fieldsModified)], // Remove duplicates
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
//# sourceMappingURL=sanitization.js.map