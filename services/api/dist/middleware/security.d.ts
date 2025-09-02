import { Request, Response, NextFunction } from 'express';
/**
 * Security headers middleware
 */
export declare function securityHeaders(): (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
/**
 * Additional custom security headers
 */
export declare function customSecurityHeaders(): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * CORS configuration with security in mind
 */
export declare function secureCors(): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Request ID middleware for tracking
 */
export declare function requestId(): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Security monitoring middleware
 */
export declare function securityMonitoring(): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Apply all security middleware
 */
export declare function applySecurityMiddleware(app: any): void;
//# sourceMappingURL=security.d.ts.map