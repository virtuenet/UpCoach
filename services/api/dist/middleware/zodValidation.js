"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPublicApiValidation = exports.createAuthValidation = exports.validateHeaders = exports.validateParams = exports.validateQuery = exports.validateBody = void 0;
exports.getValidationMetrics = getValidationMetrics;
exports.resetValidationMetrics = resetValidationMetrics;
exports.validate = validate;
exports.validateMultiple = validateMultiple;
exports.validateAsync = validateAsync;
exports.validateConditional = validateConditional;
exports.createValidator = createValidator;
exports.sanitizeAndValidate = sanitizeAndValidate;
exports.createValidatedEndpoint = createValidatedEndpoint;
const zod_1 = require("zod");
const lru_cache_1 = require("lru-cache");
const crypto_1 = __importDefault(require("crypto"));
const async_mutex_1 = require("async-mutex");
const logger_1 = require("../utils/logger");
const sanitization_1 = require("../utils/sanitization");
const rateLimiter_1 = require("./rateLimiter");
// Validation result cache configuration with memory limits
const validationCache = new lru_cache_1.LRUCache({
    max: 1000, // Maximum number of cached validations
    maxSize: 50 * 1024 * 1024, // 50MB memory limit
    sizeCalculation: value => {
        // Estimate memory size of cached object
        try {
            return JSON.stringify(value).length;
        }
        catch {
            return 1024; // Default 1KB if stringify fails
        }
    },
    ttl: 1000 * 60 * 5, // 5 minute TTL
    updateAgeOnGet: true,
    updateAgeOnHas: false,
    dispose: (value, key, reason) => {
        if (reason === 'evict' || reason === 'delete') {
            cacheStats.evictions++;
        }
    },
});
// Cache statistics
const cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
};
// Mutex for thread-safe metrics updates
const metricsMutex = new async_mutex_1.Mutex();
// Performance metrics tracking
const validationMetrics = {
    totalValidations: 0,
    successfulValidations: 0,
    failedValidations: 0,
    totalDuration: 0,
    slowValidations: 0, // Validations taking > 100ms
    cacheHits: 0,
    cacheMisses: 0,
    schemaMetrics: new Map(),
};
// Helper to generate cache key
function generateCacheKey(schema, data, schemaName) {
    const dataHash = crypto_1.default.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    return `${schemaName}_${dataHash}`;
}
// Export metrics for monitoring
function getValidationMetrics() {
    const schemas = Array.from(validationMetrics.schemaMetrics.entries()).map(([name, metrics]) => ({
        schema: name,
        ...metrics,
        avgDuration: metrics.count > 0 ? metrics.totalDuration / metrics.count : 0,
    }));
    return {
        ...validationMetrics,
        avgDuration: validationMetrics.totalValidations > 0
            ? validationMetrics.totalDuration / validationMetrics.totalValidations
            : 0,
        successRate: validationMetrics.totalValidations > 0
            ? (validationMetrics.successfulValidations / validationMetrics.totalValidations) * 100
            : 0,
        cacheHitRate: validationMetrics.cacheHits + validationMetrics.cacheMisses > 0
            ? (validationMetrics.cacheHits /
                (validationMetrics.cacheHits + validationMetrics.cacheMisses)) *
                100
            : 0,
        cacheStats: {
            size: validationCache.size,
            ...cacheStats,
        },
        schemas,
    };
}
// Reset metrics (useful for testing)
function resetValidationMetrics() {
    validationMetrics.totalValidations = 0;
    validationMetrics.successfulValidations = 0;
    validationMetrics.failedValidations = 0;
    validationMetrics.totalDuration = 0;
    validationMetrics.slowValidations = 0;
    validationMetrics.cacheHits = 0;
    validationMetrics.cacheMisses = 0;
    validationMetrics.schemaMetrics.clear();
    validationCache.clear();
    cacheStats.hits = 0;
    cacheStats.misses = 0;
    cacheStats.evictions = 0;
}
/**
 * Format Zod errors for API response
 */
function formatZodError(error) {
    return error.errors.map(err => {
        const field = err.path.join('.');
        return {
            field: field || 'unknown',
            message: err.message,
            code: err.code,
        };
    });
}
/**
 * Create validation middleware for a specific source
 */
function validate(schema, source = 'body', options = {}) {
    const { stripUnknown = true, abortEarly = false, message = 'Validation failed', statusCode = 400, logErrors = true, } = options;
    // Generate schema identifier for metrics
    const schemaName = schema.description || `${source}_schema`;
    return async (req, res, next) => {
        const startTime = Date.now();
        try {
            // Get data from the specified source
            const data = req[source];
            // Check cache for validation result (only for GET requests with query params)
            let validatedData;
            let cacheHit = false;
            const cacheKey = generateCacheKey(schema, data, schemaName);
            if (req.method === 'GET' && source === 'query') {
                const cached = validationCache.get(cacheKey);
                if (cached) {
                    validatedData = cached.result;
                    cacheHit = true;
                    validationMetrics.cacheHits++;
                    cacheStats.hits++;
                }
                else {
                    validationMetrics.cacheMisses++;
                    cacheStats.misses++;
                }
            }
            // If not cached, perform validation
            if (!cacheHit) {
                validatedData = await schema.parseAsync(data);
                // Cache successful validation (only for GET requests)
                if (req.method === 'GET' && source === 'query') {
                    validationCache.set(cacheKey, {
                        result: validatedData,
                        timestamp: Date.now(),
                    });
                }
            }
            // Replace the original data with validated data
            req[source] = validatedData;
            // Track successful validation metrics with mutex for thread safety
            const duration = Date.now() - startTime;
            await metricsMutex.runExclusive(async () => {
                validationMetrics.totalValidations++;
                validationMetrics.successfulValidations++;
                validationMetrics.totalDuration += duration;
                if (duration > 100) {
                    validationMetrics.slowValidations++;
                }
                // Update schema-specific metrics
                const schemaMetric = validationMetrics.schemaMetrics.get(schemaName) || {
                    count: 0,
                    totalDuration: 0,
                    failures: 0,
                };
                schemaMetric.count++;
                schemaMetric.totalDuration += duration;
                validationMetrics.schemaMetrics.set(schemaName, schemaMetric);
            });
            if (duration > 100) {
                logger_1.logger.warn('Slow validation detected', {
                    schema: schemaName,
                    duration,
                    path: req.path,
                });
            }
            next();
        }
        catch (error) {
            const duration = Date.now() - startTime;
            // Track failed validation metrics with mutex for thread safety
            await metricsMutex.runExclusive(async () => {
                validationMetrics.totalValidations++;
                validationMetrics.failedValidations++;
                validationMetrics.totalDuration += duration;
                // Update schema-specific metrics
                const schemaMetric = validationMetrics.schemaMetrics.get(schemaName) || {
                    count: 0,
                    totalDuration: 0,
                    failures: 0,
                };
                schemaMetric.count++;
                schemaMetric.totalDuration += duration;
                schemaMetric.failures++;
                validationMetrics.schemaMetrics.set(schemaName, schemaMetric);
            });
            if (error instanceof zod_1.ZodError) {
                const errors = formatZodError(error);
                if (logErrors) {
                    logger_1.logger.warn('Validation error', {
                        source,
                        path: req.path,
                        method: req.method,
                        errors,
                        ip: req.ip,
                        duration,
                    });
                }
                res.status(statusCode).json({
                    success: false,
                    error: message,
                    errors,
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            // Handle unexpected errors
            logger_1.logger.error('Unexpected validation error', error);
            res.status(500).json({
                success: false,
                error: 'Internal validation error',
            });
        }
    };
}
/**
 * Validate multiple sources at once
 */
function validateMultiple(validations) {
    return async (req, res, next) => {
        const allErrors = [];
        for (const validation of validations) {
            try {
                const data = req[validation.source];
                const validatedData = await validation.schema.parseAsync(data);
                req[validation.source] = validatedData;
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    allErrors.push({
                        source: validation.source,
                        errors: formatZodError(error),
                    });
                }
            }
        }
        if (allErrors.length > 0) {
            const statusCode = validations[0]?.options?.statusCode ?? 400;
            logger_1.logger.warn('Multiple validation errors', {
                path: req.path,
                method: req.method,
                errors: allErrors,
            });
            res.status(statusCode).json({
                success: false,
                error: 'Validation failed',
                validationErrors: allErrors,
                timestamp: new Date().toISOString(),
            });
            return;
        }
        next();
    };
}
/**
 * Shorthand validators for common sources
 */
const validateBody = (schema, options) => validate(schema, 'body', options);
exports.validateBody = validateBody;
const validateQuery = (schema, options) => validate(schema, 'query', options);
exports.validateQuery = validateQuery;
const validateParams = (schema, options) => validate(schema, 'params', options);
exports.validateParams = validateParams;
const validateHeaders = (schema, options) => validate(schema, 'headers', options);
exports.validateHeaders = validateHeaders;
/**
 * Async validation with custom logic
 */
function validateAsync(schema, customValidator) {
    return async (req, res, next) => {
        try {
            // First, validate with Zod
            const validatedData = await schema.parseAsync(req.body);
            // Then, run custom validation if provided
            if (customValidator) {
                const customResult = await customValidator(validatedData);
                if (customResult === false) {
                    res.status(400).json({
                        success: false,
                        error: 'Custom validation failed',
                    });
                    return;
                }
                if (typeof customResult === 'object' && customResult.error) {
                    res.status(400).json({
                        success: false,
                        error: customResult.error,
                    });
                    return;
                }
            }
            req.body = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = formatZodError(error);
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    errors,
                });
                return;
            }
            logger_1.logger.error('Validation error', error);
            res.status(500).json({
                success: false,
                error: 'Internal validation error',
            });
        }
    };
}
/**
 * Conditional validation based on request context
 */
function validateConditional(condition, schema, source = 'body', options) {
    return (req, res, next) => {
        if (condition(req)) {
            validate(schema, source, options)(req, res, next);
        }
        else {
            next();
        }
    };
}
/**
 * Create a validation schema that can be reused
 */
function createValidator(schema) {
    return {
        body: (options) => (0, exports.validateBody)(schema, options),
        query: (options) => (0, exports.validateQuery)(schema, options),
        params: (options) => (0, exports.validateParams)(schema, options),
        headers: (options) => (0, exports.validateHeaders)(schema, options),
        validate: (source, options) => validate(schema, source, options),
    };
}
/**
 * Sanitize and validate input to prevent XSS
 * Uses DOMPurify for robust HTML sanitization
 */
function sanitizeAndValidate(schema) {
    return async (req, res, next) => {
        try {
            // Use DOMPurify-based sanitization for robust XSS prevention
            req.body = (0, sanitization_1.sanitizeObject)(req.body, true);
            // Validate with Zod
            const validatedData = await schema.parseAsync(req.body);
            req.body = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = formatZodError(error);
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    errors,
                });
                return;
            }
            next(error);
        }
    };
}
/**
 * Create validated and rate-limited endpoint
 * Returns array of middleware to apply in order
 */
function createValidatedEndpoint(schema, source = 'body', options = {}) {
    const middlewares = [];
    // Add rate limiting if configured
    if (options.rateLimit) {
        const rateLimiter = (0, rateLimiter_1.createRateLimiter)({
            windowMs: options.rateLimit.windowMs || 15 * 60 * 1000, // 15 minutes default
            max: options.rateLimit.max || 100,
            message: 'Too many validation attempts, please try again later.',
            skipSuccessfulRequests: false,
        });
        middlewares.push(rateLimiter);
    }
    // Add validation
    middlewares.push(validate(schema, source, options));
    return middlewares;
}
/**
 * Pre-configured validation with rate limiting for auth endpoints
 */
const createAuthValidation = (schema) => {
    return createValidatedEndpoint(schema, 'body', {
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // 5 attempts
        },
        logErrors: true,
        message: 'Invalid authentication data',
    });
};
exports.createAuthValidation = createAuthValidation;
/**
 * Pre-configured validation with rate limiting for public API endpoints
 */
const createPublicApiValidation = (schema, source = 'body') => {
    return createValidatedEndpoint(schema, source, {
        rateLimit: {
            windowMs: 60 * 1000, // 1 minute
            max: 30, // 30 requests
        },
        logErrors: true,
    });
};
exports.createPublicApiValidation = createPublicApiValidation;
// Export all schemas for easy access
__exportStar(require("../validation/schemas/auth.schema"), exports);
__exportStar(require("../validation/schemas/coach.schema"), exports);
__exportStar(require("../validation/schemas/common.schema"), exports);
//# sourceMappingURL=zodValidation.js.map