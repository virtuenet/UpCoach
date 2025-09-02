import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { LRUCache } from 'lru-cache';
import crypto from 'crypto';
import { Mutex } from 'async-mutex';
import { logger } from '../utils/logger';
import { sanitizeObject } from '../utils/sanitization';
import { createRateLimiter } from './rateLimiter';

// Validation result cache configuration with memory limits
const validationCache = new LRUCache<
  string,
  {
    result: any;
    timestamp: number;
  }
>({
  max: 1000, // Maximum number of cached validations
  maxSize: 50 * 1024 * 1024, // 50MB memory limit
  sizeCalculation: value => {
    // Estimate memory size of cached object
    try {
      return JSON.stringify(value).length;
    } catch {
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
const metricsMutex = new Mutex();

// Performance metrics tracking
const validationMetrics = {
  totalValidations: 0,
  successfulValidations: 0,
  failedValidations: 0,
  totalDuration: 0,
  slowValidations: 0, // Validations taking > 100ms
  cacheHits: 0,
  cacheMisses: 0,
  schemaMetrics: new Map<
    string,
    {
      count: number;
      totalDuration: number;
      failures: number;
      avgDuration?: number;
    }
  >(),
};

// Helper to generate cache key
function generateCacheKey(schema: ZodSchema, data: any, schemaName: string): string {
  const dataHash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  return `${schemaName}_${dataHash}`;
}

// Export metrics for monitoring
export function getValidationMetrics() {
  const schemas = Array.from(validationMetrics.schemaMetrics.entries()).map(([name, metrics]) => ({
    schema: name,
    ...metrics,
    avgDuration: metrics.count > 0 ? metrics.totalDuration / metrics.count : 0,
  }));

  return {
    ...validationMetrics,
    avgDuration:
      validationMetrics.totalValidations > 0
        ? validationMetrics.totalDuration / validationMetrics.totalValidations
        : 0,
    successRate:
      validationMetrics.totalValidations > 0
        ? (validationMetrics.successfulValidations / validationMetrics.totalValidations) * 100
        : 0,
    cacheHitRate:
      validationMetrics.cacheHits + validationMetrics.cacheMisses > 0
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
export function resetValidationMetrics() {
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
 * Validation source types
 */
type ValidationSource = 'body' | 'query' | 'params' | 'headers' | 'cookies';

/**
 * Validation options
 */
interface ValidationOptions {
  /**
   * Whether to strip unknown keys from the validated data
   * @default true
   */
  stripUnknown?: boolean;

  /**
   * Whether to abort early on first error
   * @default false
   */
  abortEarly?: boolean;

  /**
   * Custom error message
   */
  message?: string;

  /**
   * HTTP status code for validation errors
   * @default 400
   */
  statusCode?: number;

  /**
   * Whether to log validation errors
   * @default true
   */
  logErrors?: boolean;

  /**
   * Rate limiting configuration
   */
  rateLimit?: {
    windowMs?: number;
    max?: number;
  };
}

/**
 * Format Zod errors for API response
 */
function formatZodError(error: ZodError): Array<{ field: string; message: string; code?: string }> {
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
export function validate(
  schema: ZodSchema,
  source: ValidationSource = 'body',
  options: ValidationOptions = {}
) {
  const {
    stripUnknown = true,
    abortEarly = false,
    message = 'Validation failed',
    statusCode = 400,
    logErrors = true,
  } = options;

  // Generate schema identifier for metrics
  const schemaName = schema.description || `${source}_schema`;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
        } else {
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
      (req as any)[source] = validatedData;

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
        logger.warn('Slow validation detected', {
          schema: schemaName,
          duration,
          path: req.path,
        });
      }

      next();
    } catch (error) {
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

      if (error instanceof ZodError) {
        const errors = formatZodError(error);

        if (logErrors) {
          logger.warn('Validation error', {
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
      logger.error('Unexpected validation error', error);
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
export function validateMultiple(
  validations: Array<{
    schema: ZodSchema;
    source: ValidationSource;
    options?: ValidationOptions;
  }>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const allErrors: Array<{ source: ValidationSource; errors: Array<any> }> = [];

    for (const validation of validations) {
      try {
        const data = req[validation.source];
        const validatedData = await validation.schema.parseAsync(data);

        (req as any)[validation.source] = validatedData;
      } catch (error) {
        if (error instanceof ZodError) {
          allErrors.push({
            source: validation.source,
            errors: formatZodError(error),
          });
        }
      }
    }

    if (allErrors.length > 0) {
      const statusCode = validations[0]?.options?.statusCode ?? 400;

      logger.warn('Multiple validation errors', {
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
export const validateBody = (schema: ZodSchema, options?: ValidationOptions) =>
  validate(schema, 'body', options);

export const validateQuery = (schema: ZodSchema, options?: ValidationOptions) =>
  validate(schema, 'query', options);

export const validateParams = (schema: ZodSchema, options?: ValidationOptions) =>
  validate(schema, 'params', options);

export const validateHeaders = (schema: ZodSchema, options?: ValidationOptions) =>
  validate(schema, 'headers', options);

/**
 * Async validation with custom logic
 */
export function validateAsync<T>(
  schema: ZodSchema<T>,
  customValidator?: (data: T) => Promise<boolean | { error: string }>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodError(error);

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors,
        });
        return;
      }

      logger.error('Validation error', error);
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
export function validateConditional(
  condition: (req: Request) => boolean,
  schema: ZodSchema,
  source: ValidationSource = 'body',
  options?: ValidationOptions
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (condition(req)) {
      validate(schema, source, options)(req, res, next);
    } else {
      next();
    }
  };
}

/**
 * Create a validation schema that can be reused
 */
export function createValidator<T extends ZodSchema>(schema: T) {
  return {
    body: (options?: ValidationOptions) => validateBody(schema, options),
    query: (options?: ValidationOptions) => validateQuery(schema, options),
    params: (options?: ValidationOptions) => validateParams(schema, options),
    headers: (options?: ValidationOptions) => validateHeaders(schema, options),
    validate: (source: ValidationSource, options?: ValidationOptions) =>
      validate(schema, source, options),
  };
}

/**
 * Sanitize and validate input to prevent XSS
 * Uses DOMPurify for robust HTML sanitization
 */
export function sanitizeAndValidate(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Use DOMPurify-based sanitization for robust XSS prevention
      req.body = sanitizeObject(req.body, true);

      // Validate with Zod
      const validatedData = await schema.parseAsync(req.body);
      req.body = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
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
export function createValidatedEndpoint(
  schema: ZodSchema,
  source: ValidationSource = 'body',
  options: ValidationOptions & {
    rateLimit?: { windowMs?: number; max?: number };
  } = {}
) {
  const middlewares: Array<any> = [];

  // Add rate limiting if configured
  if (options.rateLimit) {
    const rateLimiter = createRateLimiter({
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
export const createAuthValidation = (schema: ZodSchema) => {
  return createValidatedEndpoint(schema, 'body', {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts
    },
    logErrors: true,
    message: 'Invalid authentication data',
  });
};

/**
 * Pre-configured validation with rate limiting for public API endpoints
 */
export const createPublicApiValidation = (schema: ZodSchema, source: ValidationSource = 'body') => {
  return createValidatedEndpoint(schema, source, {
    rateLimit: {
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 requests
    },
    logErrors: true,
  });
};

// Export all schemas for easy access
export * from '../validation/schemas/auth.schema';
export * from '../validation/schemas/coach.schema';
export * from '../validation/schemas/common.schema';
