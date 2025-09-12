import { Request, Response, NextFunction } from 'express';
export declare function securityHeaders(): (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export declare function customSecurityHeaders(): (req: Request, _res: Response, next: NextFunction) => void;
export declare function secureCors(): (req: Request, _res: Response, next: NextFunction) => void;
export declare function requestId(): (req: Request, _res: Response, next: NextFunction) => void;
export declare function securityMonitoring(): (req: Request, _res: Response, next: NextFunction) => void;
export declare function applySecurityMiddleware(app: any): void;
//# sourceMappingURL=security.d.ts.map