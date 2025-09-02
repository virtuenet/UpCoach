/**
 * Express middleware helper utilities
 */
import { Request, Response, NextFunction } from 'express';
import { AsyncRequestHandler } from '../types/express-extended';
/**
 * Wrapper for async route handlers to properly catch errors
 */
export declare function asyncHandler<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(handler: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery>): (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => void;
/**
 * Standard error handler wrapper
 */
export declare function errorWrapper(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>): (req: Request, res: Response, _next: NextFunction) => Promise<void>;
/**
 * Response helper methods
 */
export declare function attachResponseHelpers(req: Request, res: Response, next: NextFunction): void;
/**
 * Validate request parameters
 */
export declare function validateParams(params: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
/**
 * Validate request body
 */
export declare function validateBody(fields: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=express-helpers.d.ts.map