"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = exports.authorize = exports.authenticate = exports.blacklistToken = exports.verifyRefreshToken = exports.generateTokens = exports.requireOwnership = exports.authorizeRoles = exports.requireRole = exports.optionalAuthMiddleware = exports.adminMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
const redis_1 = require("../services/redis");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const authMiddleware = async (req, _res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            _res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }
        const isBlacklisted = await redis_1.redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
            _res.status(401).json({
                success: false,
                error: 'Token has been revoked',
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, environment_1.config.jwt.secret);
        if (!decoded.id || !decoded.email || !decoded.role) {
            _res.status(401).json({
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
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            _res.status(401).json({
                success: false,
                error: 'Token has expired',
                code: 'TOKEN_EXPIRED',
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            _res.status(401).json({
                success: false,
                error: 'Invalid token',
                code: 'INVALID_TOKEN',
            });
            return;
        }
        logger_1.logger.error('Auth middleware error:', error);
        _res.status(500).json({
            success: false,
            error: 'Authentication error',
        });
    }
};
exports.authMiddleware = authMiddleware;
const adminMiddleware = (req, _res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        _res.status(403).json({
            success: false,
            error: 'Admin access required',
        });
        return;
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
const optionalAuthMiddleware = async (req, _res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            const isBlacklisted = await redis_1.redis.get(`blacklist:${token}`);
            if (!isBlacklisted) {
                const decoded = jsonwebtoken_1.default.verify(token, environment_1.config.jwt.secret);
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
    }
    catch (error) {
        logger_1.logger.debug('Optional auth: Invalid token provided', error);
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const requireRole = (roles) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return (req, _res, next) => {
        if (!req.user) {
            _res.status(401).json({
                error: 'Authentication required',
                message: 'Access token required',
            });
            return;
        }
        const userRole = req.user.role || 'user';
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
exports.requireRole = requireRole;
exports.authorizeRoles = exports.requireRole;
const requireOwnership = (resourceIdParam = 'id') => {
    return async (req, _res, next) => {
        try {
            if (!req.user) {
                _res.status(401).json({
                    error: 'Authentication required',
                    message: 'Access token required',
                });
                return;
            }
            const resourceId = req.params[resourceIdParam];
            const userId = req.user.id;
            if (req.user.role === 'admin') {
                return next();
            }
            const ownership = await checkResourceOwnership(resourceId, userId);
            if (!ownership) {
                _res.status(403).json({
                    error: 'Access denied',
                    message: 'You can only access your own resources',
                });
                return;
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Ownership middleware error:', error);
            _res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to verify resource ownership',
            });
        }
    };
};
exports.requireOwnership = requireOwnership;
async function checkResourceOwnership(resourceId, userId) {
    try {
        if (resourceId === userId) {
            return true;
        }
        logger_1.logger.warn(`Resource ownership check not fully implemented for resource: ${resourceId}, user: ${userId}`);
        return false;
    }
    catch (error) {
        logger_1.logger.error('Error checking resource ownership:', error);
        return false;
    }
}
const generateTokens = (userId) => {
    const accessToken = jsonwebtoken_1.default.sign({ userId, type: 'access' }, environment_1.config.jwt.secret, {
        expiresIn: environment_1.config.jwt.expiresIn,
    });
    const refreshToken = jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, environment_1.config.jwt.refreshSecret, {
        expiresIn: environment_1.config.jwt.refreshExpiresIn,
    });
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const verifyRefreshToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, environment_1.config.jwt.refreshSecret);
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        return { userId: decoded.userId };
    }
    catch (error) {
        throw new apiError_1.ApiError(401, 'Invalid refresh token');
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
const blacklistToken = async (token) => {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded || !decoded.exp) {
            return;
        }
        const expiryTime = decoded.exp * 1000;
        const currentTime = Date.now();
        const ttl = Math.max(0, Math.floor((expiryTime - currentTime) / 1000));
        if (ttl > 0) {
            await redis_1.redis.setEx(`blacklist:${token}`, ttl, 'true');
        }
    }
    catch (error) {
        logger_1.logger.error('Error blacklisting token:', error);
    }
};
exports.blacklistToken = blacklistToken;
exports.authenticate = exports.authMiddleware;
exports.authorize = exports.adminMiddleware;
exports.authenticateToken = exports.authMiddleware;
//# sourceMappingURL=auth.js.map