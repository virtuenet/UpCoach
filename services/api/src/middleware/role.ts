/**
 * Role-based access control middleware
 * Placeholder implementation for role checking
 */

import { Request, Response, NextFunction } from 'express';

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireCoach = requireRole(['coach', 'admin']);
export const requireUser = requireRole(['user', 'coach', 'admin']);

export default { requireRole, requireAdmin, requireCoach, requireUser };