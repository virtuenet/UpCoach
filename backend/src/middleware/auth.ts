import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { redis } from '../services/redis';
import { ApiError } from '../utils/apiError';
import { UserService } from '../services/userService';

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
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
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
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    }
    
    next();
  } catch (error) {
    // Continue without auth if token is invalid
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
  // This would be implemented based on your specific data model
  // You might need to query different tables based on the resource type
  // For now, we'll return true as a placeholder
  return true;
}

export const generateTokens = (userId: string): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
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