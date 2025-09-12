import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            nonce?: string;
        }
    }
}
export declare function generateNonce(): string;
export declare function nonceMiddleware(req: Request, _res: Response, next: NextFunction): void;
export declare function generateCSPWithNonce(nonce: string, isDevelopment?: boolean): string;
export declare function enhancedSecurityHeaders(isDevelopment?: boolean): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=securityNonce.d.ts.map