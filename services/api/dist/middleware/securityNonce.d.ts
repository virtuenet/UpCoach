import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            nonce?: string;
        }
    }
}
/**
 * Generate a nonce for CSP
 */
export declare function generateNonce(): string;
/**
 * Middleware to add nonce to request and response locals
 */
export declare function nonceMiddleware(req: Request, _res: Response, next: NextFunction): void;
/**
 * Generate CSP header with nonce
 */
export declare function generateCSPWithNonce(nonce: string, isDevelopment?: boolean): string;
/**
 * Enhanced security headers middleware with nonce-based CSP
 */
export declare function enhancedSecurityHeaders(isDevelopment?: boolean): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=securityNonce.d.ts.map