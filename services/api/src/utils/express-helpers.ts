/**
 * Express middleware helper utilities
 */

import { Request, Response, NextFunction } from 'express';
import { AsyncRequestHandler } from '../types/express-extended';
import { logger } from './logger';

/**
 * Wrapper for async route handlers to properly catch errors
 */
export function asyncHandler<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
  handler: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery>
) {
  return (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

/**
 * Standard error handler wrapper
 */
export function errorWrapper(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return async (req: Request, res: Response, _next: NextFunction) => {
    try {
      await handler(req, res, _next);
    } catch (error) {
      logger.error('Route handler error:', error);
      _next(error);
    }
  };
}

/**
 * Response helper methods
 */
export function attachResponseHelpers(req: Request, res: Response, next: NextFunction) {
  res.success = function (data?: any, message?: string) {
    return this.json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    });
  };

  res.error = function (error: string | Error, statusCode: number = 500) {
    return this.status(statusCode).json({
      success: false,
      error: (error as Error)?.message || error.toString(),
      timestamp: new Date().toISOString(),
    });
  };

  res.paginated = function <T>(items: T[], total: number, page: number, pageSize: number) {
    const totalPages = Math.ceil(total / pageSize);
    return this.json({
      success: true,
      data: items,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  };

  next();
}

/**
 * Validate request parameters
 */
export function validateParams(params: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = params.filter(param => !req.params[param]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required parameters: ${missing.join(', ')}`,
      });
    }
    next();
  };
}

/**
 * Validate request body
 */
export function validateBody(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = fields.filter(field => !req.body[field]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`,
      });
    }
    next();
  };
}
