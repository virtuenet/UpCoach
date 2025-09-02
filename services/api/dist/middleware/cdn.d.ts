import { Request, Response, NextFunction } from 'express';
export declare const cdnMiddleware: (req: Request, _res: Response, next: NextFunction) => void;
export declare const staticCacheMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const imageOptimizationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const preloadMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const serviceWorkerMiddleware: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=cdn.d.ts.map