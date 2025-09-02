import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            startTime?: number;
            metrics?: {
                route?: string;
                statusCode?: number;
            };
        }
    }
}
export declare const performanceMiddleware: (req: Request, _res: Response, next: NextFunction) => void;
export declare const trackDatabaseQuery: (operation: string, table: string, duration: number) => void;
export declare const trackCacheHit: (cacheType: string) => void;
export declare const trackCacheMiss: (cacheType: string) => void;
export declare const metricsHandler: (req: Request, res: Response) => Promise<void>;
export declare const healthCheckHandler: (req: Request, _res: Response) => void;
export declare const readyCheckHandler: (req: Request, _res: Response) => Promise<void>;
//# sourceMappingURL=performance.d.ts.map