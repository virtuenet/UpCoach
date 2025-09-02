import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
            };
        }
    }
}
export interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role: string;
    };
}
/**
 * Authentication middleware
 */
export declare const authMiddleware: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
/**
 * Admin authorization middleware
 */
export declare const adminMiddleware: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Optional auth middleware
 */
export declare const optionalAuthMiddleware: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (roles: string | string[]) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const authorizeRoles: (roles: string | string[]) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const requireOwnership: (resourceIdParam?: string) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const generateTokens: (userId: string) => {
    accessToken: string;
    refreshToken: string;
};
export declare const verifyRefreshToken: (token: string) => {
    userId: string;
};
export declare const blacklistToken: (token: string) => Promise<void>;
export declare const authenticate: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (req: Request, _res: Response, next: NextFunction) => void;
export declare const authenticateToken: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map