/**
import { format, formatDistanceToNow, parseISO } from "date-fns";
 * Input Validation Service
 * Comprehensive validation for all API inputs with sanitization
 */
import { z, ZodSchema } from 'zod';
export declare const commonSchemas: {
    uuid: z.ZodString;
    objectId: z.ZodString;
    numericId: z.ZodNumber;
    email: z.ZodString;
    password: z.ZodString;
    username: z.ZodString;
    phone: z.ZodString;
    url: z.ZodString;
    date: z.ZodString;
    dateOnly: z.ZodString;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodString;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    searchQuery: z.ZodEffects<z.ZodString, string, string>;
};
export declare const contentSchemas: {
    title: z.ZodEffects<z.ZodString, any, string>;
    description: z.ZodEffects<z.ZodString, any, string>;
    content: z.ZodEffects<z.ZodString, any, string>;
    slug: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
};
export declare const fileSchemas: {
    fileName: z.ZodString;
    fileType: z.ZodEnum<["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain", "text/csv"]>;
    fileSize: z.ZodNumber;
};
export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    errors?: ValidationError[];
}
export interface ValidationError {
    path: string;
    message: string;
}
declare class InputValidationService {
    private static instance;
    private customSchemas;
    private constructor();
    static getInstance(): InputValidationService;
    /**
     * Register custom validation schema
     */
    registerSchema(name: string, schema: ZodSchema): void;
    /**
     * Validate input against schema
     */
    validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T>;
    /**
     * Validate using registered schema
     */
    validateWithSchema<T>(schemaName: string, data: unknown): ValidationResult<T>;
    /**
     * Sanitize HTML content
     */
    sanitizeHTML(html: string, options?: {
        allowedTags?: string[];
        allowedAttributes?: string[];
        allowedSchemes?: string[];
    }): string;
    /**
     * Sanitize plain text (remove all HTML)
     */
    sanitizeText(text: string): string;
    /**
     * Sanitize JSON
     */
    sanitizeJSON<T>(json: any, maxDepth?: number): T | null;
    /**
     * Calculate JSON depth
     */
    private getJSONDepth;
    /**
     * Validate file upload
     */
    validateFileUpload(file: {
        name: string;
        type: string;
        size: number;
    }): ValidationResult<any>;
    /**
     * Validate pagination parameters
     */
    validatePagination(params: any): ValidationResult<{
        page: number;
        limit: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }>;
    /**
     * Escape SQL identifiers
     */
    escapeSQL(value: string): string;
    /**
     * Validate and sanitize SQL ORDER BY clause
     */
    validateOrderBy(field: string, allowedFields: string[]): string | null;
    /**
     * Check for common injection patterns
     */
    detectInjection(input: string): {
        safe: boolean;
        type?: string;
        reason?: string;
    };
    /**
     * Create validation middleware for Express
     */
    middleware(schema: ZodSchema): (req: any, res: any, next: any) => Promise<any>;
}
export declare const inputValidator: InputValidationService;
export declare const validationMiddleware: {
    pagination: (req: any, res: any, next: any) => Promise<any>;
    id: (req: any, res: any, next: any) => Promise<any>;
    search: (req: any, res: any, next: any) => Promise<any>;
};
export { z } from 'zod';
//# sourceMappingURL=inputValidator.d.ts.map