import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
declare global {
    namespace Express {
        interface Request {
            id?: string;
            rawBody?: Buffer;
        }
    }
}
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const errorMiddleware: (error: Error | ApiError, req: Request, res: Response, _next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map