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
const crypto_1 = __importDefault(require("crypto"));
const async_mutex_1 = require("async-mutex");
const lru_cache_1 = require("lru-cache");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const sanitization_1 = require("../utils/sanitization");
const rateLimiter_1 = require("./rateLimiter");
const validationCache = new lru_cache_1.LRUCache({
    max: 1000,
    maxSize: 50 * 1024 * 1024,
    sizeCalculation: value => {
        try {
            return JSON.stringify(value).length;
        }
        catch {
            return 1024;
        }
    },
    ttl: 1000 * 60 * 5,
    updateAgeOnGet: true,
    updateAgeOnHas: false,
    dispose: (value, key, reason) => {
        if (reason === 'evict' || reason === 'delete') {
            cacheStats.evictions++;
        }
    },
});
const cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
};
const metricsMutex = new async_mutex_1.Mutex();
const validationMetrics = {
    totalValidations: 0,
    successfulValidations: 0,
    failedValidations: 0,
    totalDuration: 0,
    slowValidations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    schemaMetrics: new Map(),
};
function generateCacheKey(schema, data, schemaName) {
    const dataHash = crypto_1.default.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    return `${schemaName}_${dataHash}`;
}
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
function validate(schema, source = 'body', options = {}) {
    const { stripUnknown = true, abortEarly = false, message = 'Validation failed', statusCode = 400, logErrors = true, } = options;
    const schemaName = schema.description || `${source}_schema`;
    return async (req, res, next) => {
        const startTime = Date.now();
        try {
            const data = req[source];
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
            if (!cacheHit) {
                validatedData = await schema.parseAsync(data);
                if (req.method === 'GET' && source === 'query') {
                    validationCache.set(cacheKey, {
                        result: validatedData,
                        timestamp: Date.now(),
                    });
                }
            }
            req[source] = validatedData;
            const duration = Date.now() - startTime;
            await metricsMutex.runExclusive(async () => {
                validationMetrics.totalValidations++;
                validationMetrics.successfulValidations++;
                validationMetrics.totalDuration += duration;
                if (duration > 100) {
                    validationMetrics.slowValidations++;
                }
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
            await metricsMutex.runExclusive(async () => {
                validationMetrics.totalValidations++;
                validationMetrics.failedValidations++;
                validationMetrics.totalDuration += duration;
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
            logger_1.logger.error('Unexpected validation error', error);
            res.status(500).json({
                success: false,
                error: 'Internal validation error',
            });
        }
    };
}
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
const validateBody = (schema, options) => validate(schema, 'body', options);
exports.validateBody = validateBody;
const validateQuery = (schema, options) => validate(schema, 'query', options);
exports.validateQuery = validateQuery;
const validateParams = (schema, options) => validate(schema, 'params', options);
exports.validateParams = validateParams;
const validateHeaders = (schema, options) => validate(schema, 'headers', options);
exports.validateHeaders = validateHeaders;
function validateAsync(schema, customValidator) {
    return async (req, res, next) => {
        try {
            const validatedData = await schema.parseAsync(req.body);
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
function createValidator(schema) {
    return {
        body: (options) => (0, exports.validateBody)(schema, options),
        query: (options) => (0, exports.validateQuery)(schema, options),
        params: (options) => (0, exports.validateParams)(schema, options),
        headers: (options) => (0, exports.validateHeaders)(schema, options),
        validate: (source, options) => validate(schema, source, options),
    };
}
function sanitizeAndValidate(schema) {
    return async (req, res, next) => {
        try {
            req.body = (0, sanitization_1.sanitizeObject)(req.body, true);
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
function createValidatedEndpoint(schema, source = 'body', options = {}) {
    const middlewares = [];
    if (options.rateLimit) {
        const rateLimiter = (0, rateLimiter_1.createRateLimiter)({
            windowMs: options.rateLimit.windowMs || 15 * 60 * 1000,
            max: options.rateLimit.max || 100,
            message: 'Too many validation attempts, please try again later.',
            skipSuccessfulRequests: false,
        });
        middlewares.push(rateLimiter);
    }
    middlewares.push(validate(schema, source, options));
    return middlewares;
}
const createAuthValidation = (schema) => {
    return createValidatedEndpoint(schema, 'body', {
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 5,
        },
        logErrors: true,
        message: 'Invalid authentication data',
    });
};
exports.createAuthValidation = createAuthValidation;
const createPublicApiValidation = (schema, source = 'body') => {
    return createValidatedEndpoint(schema, source, {
        rateLimit: {
            windowMs: 60 * 1000,
            max: 30,
        },
        logErrors: true,
    });
};
exports.createPublicApiValidation = createPublicApiValidation;
__exportStar(require("../validation/schemas/auth.schema"), exports);
__exportStar(require("../validation/schemas/coach.schema"), exports);
__exportStar(require("../validation/schemas/common.schema"), exports);
//# sourceMappingURL=zodValidation.js.map