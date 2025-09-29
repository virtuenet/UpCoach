import { Request, Response, NextFunction } from 'express';
import { sign, verify, decode, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import * as crypto from 'crypto';

import { config } from '../config/environment';
import { redis } from '../services/redis';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
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

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  fingerprint?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/**
 * Generate request fingerprint for token binding
 */
function generateUserFingerprint(req: Request): string {
  const components = [
    req.ip,
    req.headers['user-agent'],
    req.headers['accept-language'],
    req.headers['accept-encoding'],
  ].join('|');
  
  return crypto.createHash('sha256').update(components).digest('hex').substring(0, 32);
}

/**
 * Authentication middleware
 */
export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      _res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      _res.status(401).json({
        success: false,
        error: 'Token has been revoked',
      });
      return;
    }

    // Enhanced JWT verification with algorithm specification and issuer validation
    const decoded = verify(token, config.jwt.secret, {
      algorithms: ['HS256'], // Prevent algorithm confusion attacks
      issuer: 'upcoach-api',
      audience: 'upcoach-client',
      clockTolerance: 30, // 30 second tolerance for time skew
      ignoreExpiration: false,
      ignoreNotBefore: false,
    }) as JWTPayload;

    // Validate token structure
    if (!decoded.id || !decoded.email || !decoded.role) {
      _res.status(401).json({
        success: false,
        error: 'Invalid token structure',
      });
      return;
    }

    // Token binding validation - prevent token theft
    if (decoded.fingerprint) {
      const currentFingerprint = generateUserFingerprint(req);
      if (decoded.fingerprint !== currentFingerprint) {
        logger.warn('Token binding validation failed', { 
          userId: decoded.id, 
          expected: decoded.fingerprint,
          actual: currentFingerprint,
          ip: req.ip
        });
        _res.status(401).json({
          success: false,
          error: 'Token binding validation failed',
          code: 'TOKEN_BINDING_MISMATCH',
        });
        return;
      }
    }

    (req as any).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      _res.status(401).json({
        success: false,
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    if (error instanceof JsonWebTokenError) {
      _res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    logger.error('Auth middleware error:', error);
    _res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};

/**
 * Admin authorization middleware
 */
export const adminMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!(req as any).user || (req as any).user.role !== 'admin') {
    _res.status(403).json({
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
        const decoded = verify(token, config.jwt.secret, {
          algorithms: ['HS256'],
          issuer: 'upcoach-api',
          audience: 'upcoach-client',
        }) as JWTPayload;

        // Validate token structure
        if (decoded.id && decoded.email && decoded.role) {
          (req as any).user = {
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

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!(req as any).user) {
      _res.status(401).json({
        error: 'Authentication required',
        message: 'Access token required',
      });
      return;
    }

    const userRole = (req as any).user.role || 'user';
    if (!allowedRoles.includes(userRole)) {
      _res.status(403).json({
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
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!(req as any).user) {
        _res.status(401).json({
          error: 'Authentication required',
          message: 'Access token required',
        });
        return;
      }

      const resourceId = req.params[resourceIdParam];
      const userId = (req as any).user.id;

      // Admin users can access any resource
      if ((req as any).user.role === 'admin') {
        return next();
      }

      // Check if the resource belongs to the user
      // This would need to be customized based on the specific resource
      // For now, we'll assume the resource has a userId field
      const ownership = await checkResourceOwnership(resourceId, userId);

      if (!ownership) {
        _res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own resources',
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Ownership middleware error:', error);
      _res.status(500).json({
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
    logger.warn(
      `Resource ownership check not fully implemented for resource: ${resourceId}, user: ${userId}`
    );
    return false;
  } catch (error) {
    logger.error('Error checking resource ownership:', error);
    return false;
  }
}

export const generateTokens = (
  userId: string, 
  email: string, 
  role: string, 
  req?: Request
): { accessToken: string; refreshToken: string } => {
  const payload: JWTPayload = {
    id: userId,
    email,
    role,
    ...(req ? { fingerprint: generateUserFingerprint(req) } : {}),
  };

  const accessToken = sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: 'upcoach-api',
    audience: 'upcoach-client',
    algorithm: 'HS256',
  } as any);

  const refreshToken = sign(
    { userId, type: 'refresh' }, 
    config.jwt.refreshSecret, 
    {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: 'upcoach-api',
      audience: 'upcoach-client',
      algorithm: 'HS256',
    } as any
  );

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    const decoded = verify(token, config.jwt.refreshSecret, {
      algorithms: ['HS256'],
      issuer: 'upcoach-api',
      audience: 'upcoach-client',
    }) as any;

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
    const decoded = decode(token) as any;
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

/**
 * JWT verification function for WebSocket authentication
 */
export const verifyJWT = (token: string): JWTPayload | null => {
  try {
    return verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
      issuer: 'upcoach-api',
      audience: 'upcoach-client',
      clockTolerance: 30,
      ignoreExpiration: false,
      ignoreNotBefore: false,
    }) as JWTPayload;
  } catch (error) {
    logger.debug('JWT verification failed:', error);
    return null;
  }
};

// Export aliases for common middleware names
export const authenticate = authMiddleware;
export const authorize = adminMiddleware;
export const authenticateToken = authMiddleware;
