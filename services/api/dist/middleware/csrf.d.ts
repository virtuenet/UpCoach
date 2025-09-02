import { Request, Response, NextFunction } from 'express';
interface CsrfOptions {
    /**
     * Secret key for token generation
     */
    secret?: string;
    /**
     * Token expiry time in seconds (default: 3600 = 1 hour)
     */
    tokenExpiry?: number;
    /**
     * Cookie name for storing CSRF token
     */
    cookieName?: string;
    /**
     * Header name for CSRF token
     */
    headerName?: string;
    /**
     * Methods to protect
     */
    methods?: string[];
    /**
     * Paths to exclude from CSRF protection
     */
    excludePaths?: string[];
    /**
     * Use double submit cookie pattern
     */
    doubleSubmit?: boolean;
}
/**
 * CSRF Protection Middleware
 * Implements both Synchronizer Token Pattern and Double Submit Cookie Pattern
 */
export declare function csrfProtection(options?: CsrfOptions): (req: Request, _res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Middleware to generate and attach CSRF token
 */
export declare function csrfToken(options?: CsrfOptions): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
/**
 * Express middleware configuration for CSRF protection
 */
export declare function configureCsrf(app: any): void;
/**
 * Utility to validate CSRF token manually
 */
export declare function validateCsrfToken(token: string, sessionId: string, secret?: string): Promise<boolean>;
export {};
//# sourceMappingURL=csrf.d.ts.map