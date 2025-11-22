import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

/**
 * Authorization middleware for role-based access control
 */

export interface AuthorizedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email?: string;
    organizationId?: string;
  };
}

/**
 * Check if user has required role(s)
 */
export const requireRole = (allowedRoles: string | string[]) => {
  return (req: AuthorizedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user || !user.id || !user.role) {
        logSecurityEvent(req, 'MISSING_USER_CONTEXT');
        throw new ApiError(401, 'Authentication required');
      }

      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!roles.includes(user.role)) {
        logSecurityEvent(req, 'INSUFFICIENT_ROLE_PERMISSIONS', {
          requiredRoles: roles,
          userRole: user.role
        });
        throw new ApiError(403, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: 'AUTHORIZATION_FAILED'
        });
      } else {
        res.status(500).json({
          error: 'Authorization check failed',
          code: 'AUTHORIZATION_ERROR'
        });
      }
    }
  };
};

/**
 * Check if user can access financial data
 */
export const requireFinancialAccess = () => {
  return requireRole(['admin', 'super_admin', 'financial_analyst', 'manager']);
};

/**
 * Check if user can modify financial data
 */
export const requireFinancialModifyAccess = () => {
  return requireRole(['admin', 'super_admin', 'financial_analyst']);
};

/**
 * Check if user can delete sensitive data
 */
export const requireDeleteAccess = () => {
  return requireRole(['admin', 'super_admin']);
};

/**
 * Check if user can send reports
 */
export const requireReportSendAccess = () => {
  return requireRole(['admin', 'super_admin', 'financial_analyst', 'manager']);
};

/**
 * Check if user can trigger automation
 */
export const requireAutomationAccess = () => {
  return requireRole(['admin', 'super_admin', 'financial_analyst']);
};

/**
 * Custom authorization check based on resource ownership
 */
export const requireResourceOwnership = (resourceUserIdField: string = 'userId') => {
  return async (req: AuthorizedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;

      if (!user || !user.id) {
        throw new ApiError(401, 'Authentication required');
      }

      // Admin can access all resources
      if (['admin', 'super_admin'].includes(user.role)) {
        return next();
      }

      // Extract resource user ID from request body or params
      const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];

      if (!resourceUserId) {
        throw new ApiError(400, 'Resource ownership cannot be determined');
      }

      if (resourceUserId !== user.id) {
        logSecurityEvent(req, 'UNAUTHORIZED_RESOURCE_ACCESS', {
          resourceUserId,
          requestingUserId: user.id
        });
        throw new ApiError(403, 'Access denied: You can only access your own resources');
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: 'RESOURCE_ACCESS_DENIED'
        });
      } else {
        res.status(500).json({
          error: 'Resource ownership check failed',
          code: 'OWNERSHIP_CHECK_ERROR'
        });
      }
    }
  };
};

/**
 * Log security events for audit purposes
 */
function logSecurityEvent(req: AuthorizedRequest, event: string, details: Record<string, any> = {}): void {
  logger.warn(`Security Event: ${event}`, {
    event,
    userId: req.user?.id,
    userRole: req.user?.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    url: req.originalUrl,
    method: req.method,
    ...details
  });
}

/**
 * Rate limiting for sensitive operations
 */
export const rateLimitSensitiveOperations = () => {
  const attempts = new Map<string, { count: number; resetTime: number }>();
  const MAX_ATTEMPTS = 10;
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  return (req: AuthorizedRequest, res: Response, next: NextFunction): void => {
    const userId = req.user?.id;

    if (!userId) {
      return next();
    }

    const now = Date.now();
    const userAttempts = attempts.get(userId);

    if (!userAttempts || now > userAttempts.resetTime) {
      attempts.set(userId, { count: 1, resetTime: now + WINDOW_MS });
      return next();
    }

    if (userAttempts.count >= MAX_ATTEMPTS) {
      logSecurityEvent(req, 'RATE_LIMIT_EXCEEDED', {
        attempts: userAttempts.count,
        windowMs: WINDOW_MS
      });

      res.status(429).json({
        error: 'Too many sensitive operations. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfter: Math.ceil((userAttempts.resetTime - now) / 1000)
      });
      return;
    }

    userAttempts.count++;
    next();
  };
};

/**
 * Validate request context for financial operations
 */
export const validateFinancialContext = () => {
  return (req: AuthorizedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user || !user.id || !user.role) {
        throw new ApiError(401, 'Valid user context required for financial operations');
      }

      // Check if user role is valid for financial operations
      const validRoles = ['admin', 'super_admin', 'financial_analyst', 'manager', 'user'];
      if (!validRoles.includes(user.role)) {
        logSecurityEvent(req, 'INVALID_ROLE_FOR_FINANCIAL_OPS', { role: user.role });
        throw new ApiError(403, 'Invalid role for financial operations');
      }

      // Add audit trail for financial operations
      res.on('finish', () => {
        if (res.statusCode < 400) {
          logger.info('Financial operation completed', {
            userId: user.id,
            userRole: user.role,
            operation: `${req.method} ${req.route?.path || req.path}`,
            statusCode: res.statusCode,
            timestamp: new Date().toISOString(),
            event: 'FINANCIAL_OPERATION_COMPLETED'
          });
        }
      });

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: 'FINANCIAL_CONTEXT_INVALID'
        });
      } else {
        res.status(500).json({
          error: 'Financial context validation failed',
          code: 'CONTEXT_VALIDATION_ERROR'
        });
      }
    }
  };
};