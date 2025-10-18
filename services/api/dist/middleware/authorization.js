"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFinancialContext = exports.rateLimitSensitiveOperations = exports.requireResourceOwnership = exports.requireAutomationAccess = exports.requireReportSendAccess = exports.requireDeleteAccess = exports.requireFinancialModifyAccess = exports.requireFinancialAccess = exports.requireRole = void 0;
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            const user = req.user;
            if (!user || !user.id || !user.role) {
                logSecurityEvent(req, 'MISSING_USER_CONTEXT');
                throw new apiError_1.ApiError(401, 'Authentication required');
            }
            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
            if (!roles.includes(user.role)) {
                logSecurityEvent(req, 'INSUFFICIENT_ROLE_PERMISSIONS', {
                    requiredRoles: roles,
                    userRole: user.role
                });
                throw new apiError_1.ApiError(403, 'Insufficient permissions');
            }
            next();
        }
        catch (error) {
            if (error instanceof apiError_1.ApiError) {
                res.status(error.statusCode).json({
                    error: error.message,
                    code: 'AUTHORIZATION_FAILED'
                });
            }
            else {
                res.status(500).json({
                    error: 'Authorization check failed',
                    code: 'AUTHORIZATION_ERROR'
                });
            }
        }
    };
};
exports.requireRole = requireRole;
const requireFinancialAccess = () => {
    return (0, exports.requireRole)(['admin', 'super_admin', 'financial_analyst', 'manager']);
};
exports.requireFinancialAccess = requireFinancialAccess;
const requireFinancialModifyAccess = () => {
    return (0, exports.requireRole)(['admin', 'super_admin', 'financial_analyst']);
};
exports.requireFinancialModifyAccess = requireFinancialModifyAccess;
const requireDeleteAccess = () => {
    return (0, exports.requireRole)(['admin', 'super_admin']);
};
exports.requireDeleteAccess = requireDeleteAccess;
const requireReportSendAccess = () => {
    return (0, exports.requireRole)(['admin', 'super_admin', 'financial_analyst', 'manager']);
};
exports.requireReportSendAccess = requireReportSendAccess;
const requireAutomationAccess = () => {
    return (0, exports.requireRole)(['admin', 'super_admin', 'financial_analyst']);
};
exports.requireAutomationAccess = requireAutomationAccess;
const requireResourceOwnership = (resourceUserIdField = 'userId') => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user || !user.id) {
                throw new apiError_1.ApiError(401, 'Authentication required');
            }
            if (['admin', 'super_admin'].includes(user.role)) {
                return next();
            }
            const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];
            if (!resourceUserId) {
                throw new apiError_1.ApiError(400, 'Resource ownership cannot be determined');
            }
            if (resourceUserId !== user.id) {
                logSecurityEvent(req, 'UNAUTHORIZED_RESOURCE_ACCESS', {
                    resourceUserId,
                    requestingUserId: user.id
                });
                throw new apiError_1.ApiError(403, 'Access denied: You can only access your own resources');
            }
            next();
        }
        catch (error) {
            if (error instanceof apiError_1.ApiError) {
                res.status(error.statusCode).json({
                    error: error.message,
                    code: 'RESOURCE_ACCESS_DENIED'
                });
            }
            else {
                res.status(500).json({
                    error: 'Resource ownership check failed',
                    code: 'OWNERSHIP_CHECK_ERROR'
                });
            }
        }
    };
};
exports.requireResourceOwnership = requireResourceOwnership;
function logSecurityEvent(req, event, details = {}) {
    logger_1.logger.warn(`Security Event: ${event}`, {
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
const rateLimitSensitiveOperations = () => {
    const attempts = new Map();
    const MAX_ATTEMPTS = 10;
    const WINDOW_MS = 15 * 60 * 1000;
    return (req, res, next) => {
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
exports.rateLimitSensitiveOperations = rateLimitSensitiveOperations;
const validateFinancialContext = () => {
    return (req, res, next) => {
        try {
            const user = req.user;
            if (!user || !user.id || !user.role) {
                throw new apiError_1.ApiError(401, 'Valid user context required for financial operations');
            }
            const validRoles = ['admin', 'super_admin', 'financial_analyst', 'manager', 'user'];
            if (!validRoles.includes(user.role)) {
                logSecurityEvent(req, 'INVALID_ROLE_FOR_FINANCIAL_OPS', { role: user.role });
                throw new apiError_1.ApiError(403, 'Invalid role for financial operations');
            }
            res.on('finish', () => {
                if (res.statusCode < 400) {
                    logger_1.logger.info('Financial operation completed', {
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
        }
        catch (error) {
            if (error instanceof apiError_1.ApiError) {
                res.status(error.statusCode).json({
                    error: error.message,
                    code: 'FINANCIAL_CONTEXT_INVALID'
                });
            }
            else {
                res.status(500).json({
                    error: 'Financial context validation failed',
                    code: 'CONTEXT_VALIDATION_ERROR'
                });
            }
        }
    };
};
exports.validateFinancialContext = validateFinancialContext;
