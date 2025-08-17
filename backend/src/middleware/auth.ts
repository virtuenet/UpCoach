import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { redis } from '../services/redis';
import { ApiError } from '../utils/apiError';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

// Export AuthenticatedRequest interface
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Authentication middleware
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }
    
    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        error: 'Token has been revoked',
      });
      return;
    }
    
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    // Validate token structure
    if (!decoded.id || !decoded.email || !decoded.role) {
      res.status(401).json({
        success: false,
        error: 'Invalid token structure',
      });
      return;
    }
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
      return;
    }
    
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};

/**
 * Admin authorization middleware
 */
export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
    return;
  }
  
  next();
};

/**
 * Optional auth middleware
 */
export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // Check if token is blacklisted
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (!isBlacklisted) {
        const decoded = jwt.verify(token, config.jwt.secret) as any;
        
        // Validate token structure
        if (decoded.id && decoded.email && decoded.role) {
          req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
          };
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without auth if token is invalid
    logger.debug('Optional auth: Invalid token provided', error);
    next();
  }
};

export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Access token required',
      });
      return;
    }

    const userRole = req.user.role || 'user';
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required role: ${allowedRoles.join(' or ')}`,
      });
      return;
    }

    next();
  };
};

// Alias for requireRole
export const authorizeRoles = requireRole;

export const requireOwnership = (resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Access token required',
        });
        return;
      }

      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;

      // Admin users can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if the resource belongs to the user
      // This would need to be customized based on the specific resource
      // For now, we'll assume the resource has a userId field
      const ownership = await checkResourceOwnership(resourceId, userId);
      
      if (!ownership) {
        res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own resources',
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Ownership middleware error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to verify resource ownership',
      });
    }
  };
};

// Helper function to check resource ownership
async function checkResourceOwnership(resourceId: string, userId: string): Promise<boolean> {
  try {
    // We'll need to implement proper resource checking based on the actual resource type
    // This would typically involve database queries specific to each resource
    
    // Check if the resource belongs to the user
    // This assumes resources have a userId field or similar ownership indicator
    // You'll need to customize this based on your actual resource types
    
    // Example implementation for user-owned resources:
    // For user-specific resources, check if the resourceId matches userId
    if (resourceId === userId) {
      return true;
    }
    
    // For other resources, you might need to query the database
    // This is a generic check that should be customized per resource type
    // For example:
    // - For goals: SELECT * FROM goals WHERE id = resourceId AND user_id = userId
    // - For sessions: SELECT * FROM sessions WHERE id = resourceId AND coach_id = userId
    
    // Since we don't know the resource type from just the ID,
    // this needs to be implemented based on your routing patterns
    // For now, return false to be secure by default
    logger.warn(`Resource ownership check not fully implemented for resource: ${resourceId}, user: ${userId}`);
    return false;
  } catch (error) {
    logger.error('Error checking resource ownership:', error);
    return false;
  }
}

export const generateTokens = (userId: string): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as any
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn } as any
  );

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as any;
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return { userId: decoded.userId };
  } catch (error) {
    throw new ApiError(401, 'Invalid refresh token');
  }
};

export const blacklistToken = async (token: string): Promise<void> => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return;
    }

    const expiryTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const ttl = Math.max(0, Math.floor((expiryTime - currentTime) / 1000));

    if (ttl > 0) {
      await redis.setEx(`blacklist:${token}`, ttl, 'true');
    }
  } catch (error) {
    logger.error('Error blacklisting token:', error);
  }
};

// Export aliases for common middleware names
export const authenticate = authMiddleware;
export const authorize = adminMiddleware;
export const authenticateToken = authMiddleware; 