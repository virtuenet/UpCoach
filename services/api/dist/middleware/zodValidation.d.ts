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
        size: any;
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
type ValidationSource = 'body' | 'query' | 'params' | 'headers' | 'cookies';
interface ValidationOptions {
    stripUnknown?: boolean;
    abortEarly?: boolean;
    message?: string;
    statusCode?: number;
    logErrors?: boolean;
    rateLimit?: {
        windowMs?: number;
        max?: number;
    };
}
export declare function validate(schema: ZodSchema, source?: ValidationSource, options?: ValidationOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function validateMultiple(validations: Array<{
    schema: ZodSchema;
    source: ValidationSource;
    options?: ValidationOptions;
}>): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateBody: (schema: ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateQuery: (schema: ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateParams: (schema: ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateHeaders: (schema: ZodSchema, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function validateAsync<T>(schema: ZodSchema<T>, customValidator?: (data: T) => Promise<boolean | {
    error: string;
}>): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function validateConditional(condition: (req: Request) => boolean, schema: ZodSchema, source?: ValidationSource, options?: ValidationOptions): (req: Request, res: Response, next: NextFunction) => void;
export declare function createValidator<T extends ZodSchema>(schema: T): {
    body: (options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    query: (options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    params: (options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    headers: (options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    validate: (source: ValidationSource, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
export declare function sanitizeAndValidate(schema: ZodSchema): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function createValidatedEndpoint(schema: ZodSchema, source?: ValidationSource, options?: ValidationOptions & {
    rateLimit?: {
        windowMs?: number;
        max?: number;
    };
}): any[];
export declare const createAuthValidation: (schema: ZodSchema) => any[];
export declare const createPublicApiValidation: (schema: ZodSchema, source?: ValidationSource) => any[];
export * from '../validation/schemas/auth.schema';
export * from '../validation/schemas/coach.schema';
export * from '../validation/schemas/common.schema';
//# sourceMappingURL=zodValidation.d.ts.map