import { Request, Response, NextFunction } from 'express';
import { AsyncRequestHandler } from '../types/express-extended';
export declare function asyncHandler<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(handler: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery>): (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => void;
export declare function errorWrapper(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>): (req: Request, res: Response, _next: NextFunction) => Promise<void>;
export declare function attachResponseHelpers(req: Request, res: Response, next: NextFunction): void;
export declare function validateParams(params: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function validateBody(fields: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=express-helpers.d.ts.map