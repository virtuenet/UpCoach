"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.asyncHandler = void 0;
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const zod_1 = require("zod");
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const errorMiddleware = (error, req, res, _next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let details = undefined;
    // Handle different error types
    if (error instanceof apiError_1.ApiError) {
        statusCode = error.statusCode;
        message = error.message;
        details = error.details;
    }
    else if (error instanceof zod_1.ZodError) {
        statusCode = 400;
        message = 'Validation Error';
        details = {
            errors: error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code,
            })),
        };
    }
    else if (error.name === 'SequelizeValidationError') {
        statusCode = 400;
        message = 'Database validation error';
        details = {
            errors: error.errors?.map(err => ({
                field: err.path,
                message: err.message,
                value: err.value,
            })),
        };
    }
    else if (error.name === 'SequelizeUniqueConstraintError') {
        statusCode = 409;
        message = 'Resource already exists';
        const sequelizeError = error;
        details = {
            fields: Object.keys(sequelizeError.fields || {}),
        };
    }
    else if (error.name === 'SequelizeForeignKeyConstraintError') {
        statusCode = 400;
        message = 'Invalid reference to related resource';
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    else if (error.name === 'MulterError') {
        statusCode = 400;
        if (error.code === 'LIMIT_FILE_SIZE') {
            message = 'File too large';
        }
        else if (error.code === 'LIMIT_FILE_COUNT') {
            message = 'Too many files';
        }
        else {
            message = 'File upload error';
        }
    }
    // Log error details
    const errorLog = {
        requestId: req.id,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
        },
        request: {
            method: req.method,
            url: req.originalUrl,
            headers: req.headers,
            body: req.method !== 'GET' ? req.body : undefined,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        },
        statusCode,
        timestamp: new Date().toISOString(),
    };
    if (statusCode >= 500) {
        logger_1.logger.error('Server error:', errorLog);
    }
    else if (statusCode >= 400) {
        logger_1.logger.warn('Client error:', errorLog);
    }
    // Send error response
    const response = {
        success: false,
        error: message,
        ...(details && { details }),
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
    };
    // Include request ID for debugging
    if (req.id) {
        response.requestId = req.id;
    }
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }
    res.status(statusCode).json(response);
};
exports.errorMiddleware = errorMiddleware;
//# sourceMappingURL=errorHandler.js.map