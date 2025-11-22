/**
 * Extended Express type definitions
 */

import { Request, Response, NextFunction } from 'express';

import { BaseUser, SessionData, UploadedFile } from './common';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: BaseUser;
      session?: SessionData;
      files?: UploadedFile[] | { [fieldname: string]: UploadedFile[] };
      file?: UploadedFile;
      csrfToken?: () => string;
      id?: string;
      correlationId?: string;
      startTime?: number;
    }

    interface Response {
      success: (data?: unknown, message?: string) => void;
      error: (error: string | Error, statusCode?: number) => void;
      paginated: <T>(items: T[], total: number, page: number, pageSize: number) => void;
    }
  }
}

// Custom request handler types
export type AsyncRequestHandler<P = any, ResBody = any, ReqBody = any, ReqQuery = any> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<void | Response<ResBody>>;

export type SyncRequestHandler<P = any, ResBody = any, ReqBody = any, ReqQuery = any> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction
) => void | Response<ResBody>;

// Middleware types
export type ErrorHandlerMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

export type AuthenticatedRequest<P = any, ResBody = any, ReqBody = any, ReqQuery = any> = Request<
  P,
  ResBody,
  ReqBody,
  ReqQuery
> & {
  user: BaseUser;
};

// Route parameter types
export interface IdParam {
  id: string;
}

export interface SlugParam {
  slug: string;
}

// Common request body types
export interface LoginBody {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterBody {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface UpdatePasswordBody {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenBody {
  refreshToken: string;
}

// Helper type for route handlers
export type RouteHandler<Params = any, ResBody = any, ReqBody = any, ReqQuery = any> =
  | AsyncRequestHandler<Params, ResBody, ReqBody, ReqQuery>
  | SyncRequestHandler<Params, ResBody, ReqBody, ReqQuery>;

// Type guard for authenticated requests
export function isAuthenticated<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
  req: Request<P, ResBody, ReqBody, ReqQuery>
): req is AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery> {
  return req.user !== undefined && req.user !== null;
}

// Export for convenience
export { Request, Response, NextFunction } from 'express';
