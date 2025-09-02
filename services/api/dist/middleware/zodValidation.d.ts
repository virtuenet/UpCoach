import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
export declare function getValidationMetrics(): {
    avgDuration: number;
    successRate: number;
    cacheHitRate: number;
    cacheStats: {
        hits: number;
        misses: number;
        evictions: number;
        size: number;
    };
    schemas: {
        avgDuration: number;
        count: number;
        totalDuration: number;
        failures: number;
        schema: string;
    }[];
    totalValidations: number;
    successfulValidations: number;
    failedValidations: number;
    totalDuration: number;
    slowValidations: number;
    cacheHits: number;
    cacheMisses: number;
    schemaMetrics: Map<string, {
        count: number;
        totalDuration: number;
        failures: number;
        avgDuration?: number;
    }>;
};
export declare function resetValidationMetrics(): void;
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
 * Create validation middleware for a specific source
 */
export declare function validate(schema: ZodSchema, source?: ValidationSource, options?: ValidationOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Validate multiple sources at once
 */
export declare function validateMultiple(validations: Array<{
    schema: ZodSchema;
    source: ValidationSource;
    options?: ValidationOptions;
}>): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Shorthand validators for common sources
 */
export declare const validateBody: (schema: ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateQuery: (schema: ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateParams: (schema: ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateHeaders: (schema: ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Async validation with custom logic
 */
export declare function validateAsync<T>(schema: ZodSchema<T>, customValidator?: (data: T) => Promise<boolean | {
    error: string;
}>): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Conditional validation based on request context
 */
export declare function validateConditional(condition: (req: Request) => boolean, schema: ZodSchema, source?: ValidationSource, options?: ValidationOptions): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Create a validation schema that can be reused
 */
export declare function createValidator<T extends ZodSchema>(schema: T): {
    body: (options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    query: (options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    params: (options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    headers: (options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    validate: (source: ValidationSource, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
/**
 * Sanitize and validate input to prevent XSS
 * Uses DOMPurify for robust HTML sanitization
 */
export declare function sanitizeAndValidate(schema: ZodSchema): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Create validated and rate-limited endpoint
 * Returns array of middleware to apply in order
 */
export declare function createValidatedEndpoint(schema: ZodSchema, source?: ValidationSource, options?: ValidationOptions & {
    rateLimit?: {
        windowMs?: number;
        max?: number;
    };
}): any[];
/**
 * Pre-configured validation with rate limiting for auth endpoints
 */
export declare const createAuthValidation: (schema: ZodSchema) => any[];
/**
 * Pre-configured validation with rate limiting for public API endpoints
 */
export declare const createPublicApiValidation: (schema: ZodSchema, source?: ValidationSource) => any[];
export * from '../validation/schemas/auth.schema';
export * from '../validation/schemas/coach.schema';
export * from '../validation/schemas/common.schema';
//# sourceMappingURL=zodValidation.d.ts.map