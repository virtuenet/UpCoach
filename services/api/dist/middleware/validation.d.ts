import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';
/**
 * Validation middleware to check express-validator results
 */
export declare const validateRequest: (req: Request, res: Response, next: NextFunction) => void;
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Common validation chains for reuse across the application
 */
export declare const validators: {
    id: ValidationChain;
    uuid: ValidationChain;
    pagination: ValidationChain[];
    search: ValidationChain;
    dateRange: ValidationChain[];
    email: ValidationChain;
    password: ValidationChain;
    strongPassword: ValidationChain;
    username: ValidationChain;
    phone: ValidationChain;
    url: ValidationChain;
    amount: ValidationChain;
    percentage: ValidationChain;
};
/**
 * Sanitize input fields to prevent XSS attacks
 */
export declare const sanitizeInput: (fields: string[]) => ValidationChain[];
/**
 * Validate request against SQL injection patterns
 */
export declare const preventSQLInjection: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate file upload
 */
export declare const validateFileUpload: (allowedTypes?: string[], maxSize?: number) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Combine multiple validation chains with error handling
 */
export declare const validate: (...validations: ValidationChain[]) => (((req: Request, res: Response, next: NextFunction) => void) | ValidationChain)[];
//# sourceMappingURL=validation.d.ts.map