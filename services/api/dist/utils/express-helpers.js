"use strict";
/**
 * Express middleware helper utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
exports.errorWrapper = errorWrapper;
exports.attachResponseHelpers = attachResponseHelpers;
exports.validateParams = validateParams;
exports.validateBody = validateBody;
const logger_1 = require("./logger");
/**
 * Wrapper for async route handlers to properly catch errors
 */
function asyncHandler(handler) {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}
/**
 * Standard error handler wrapper
 */
function errorWrapper(handler) {
    return async (req, res, _next) => {
        try {
            await handler(req, res, _next);
        }
        catch (error) {
            logger_1.logger.error('Route handler error:', error);
            _next(error);
        }
    };
}
/**
 * Response helper methods
 */
function attachResponseHelpers(req, res, next) {
    res.success = function (data, message) {
        return this.json({
            success: true,
            data,
            message,
            timestamp: new Date().toISOString(),
        });
    };
    res.error = function (error, statusCode = 500) {
        return this.status(statusCode).json({
            success: false,
            error: error?.message || error.toString(),
            timestamp: new Date().toISOString(),
        });
    };
    res.paginated = function (items, total, page, pageSize) {
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
function validateParams(params) {
    return (req, res, next) => {
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
function validateBody(fields) {
    return (req, res, next) => {
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
//# sourceMappingURL=express-helpers.js.map