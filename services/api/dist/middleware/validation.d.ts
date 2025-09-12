import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';
export declare const validateRequest: (req: Request, res: Response, next: NextFunction) => void;
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => void;
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
export declare const sanitizeInput: (fields: string[]) => ValidationChain[];
export declare const preventSQLInjection: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateFileUpload: (allowedTypes?: string[], maxSize?: number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validate: (...validations: ValidationChain[]) => (((req: Request, res: Response, next: NextFunction) => void) | ValidationChain)[];
//# sourceMappingURL=validation.d.ts.map