import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes((req as any).user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).user) {
    throw new UnauthorizedError('Authentication required');
  }

  if ((req as any).user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }

  next();
}