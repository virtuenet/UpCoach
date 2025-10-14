"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.asyncHandler = void 0;
const tslib_1 = require("tslib");
const zod_1 = require("zod");
const crypto = tslib_1.__importStar(require("crypto"));
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const isProduction = process.env.NODE_ENV === 'production';
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
    const getAccessibleErrorMessage = (statusCode, message, details) => {
        let accessibleMessage = `Error ${statusCode}: ${message}.`;
        if (details?.errors && Array.isArray(details.errors)) {
            const fieldErrors = details.errors.map((err) => {
                if (err.field && err.message) {
                    return `${err.field}: ${err.message}`;
                }
                return err.message || 'Unknown error';
            }).join(', ');
            accessibleMessage += ` Validation errors: ${fieldErrors}.`;
        }
        return accessibleMessage;
    };
    const response = {
        success: false,
        error: message,
        accessibleError: getAccessibleErrorMessage(statusCode, message, details),
        ...(details && { details }),
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        semanticType: statusCode >= 500 ? 'server-error' :
            (statusCode >= 400 ? 'client-error' : 'information'),
        severity: statusCode >= 500 ? 'high' : statusCode >= 400 ? 'medium' : 'low',
        userAction: statusCode === 401 ? 'Please sign in again' :
            statusCode === 403 ? 'You do not have permission for this action' :
                statusCode === 404 ? 'The requested resource was not found' :
                    statusCode >= 500 ? 'Please try again later' :
                        statusCode >= 400 ? 'Please check your input and try again' : null,
    };
    if (req.id) {
        response.requestId = req.id;
    }
    if (!isProduction) {
        response.stack = error.stack;
        response.originalError = {
            name: error.name,
            message: error.message,
        };
    }
    else {
        response.correlationId = crypto.randomBytes(8).toString('hex');
        response.supportMessage = 'If this error persists, please contact support with the correlation ID.';
    }
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
    });
    res.status(statusCode).json(response);
};
exports.errorMiddleware = errorMiddleware;
function classifyError(error) {
    if (error.name.includes('Sequelize'))
        return 'database';
    if (error.name.includes('JWT') || error.name.includes('Token'))
        return 'authentication';
    if (error.name.includes('Validation'))
        return 'validation';
    if (error.name.includes('Multer'))
        return 'file_upload';
    if (error.message.includes('prompt injection'))
        return 'security_prompt_injection';
    if (error.message.includes('rate limit'))
        return 'rate_limiting';
    if (error.message.includes('timeout'))
        return 'timeout';
    return 'unknown';
}
function determineSeverity(statusCode) {
    if (statusCode >= 500)
        return 'critical';
    if (statusCode === 429 || statusCode === 403)
        return 'high';
    if (statusCode === 401 || statusCode === 404)
        return 'medium';
    return 'low';
}
function isPotentialSecurityThreat(error, req) {
    const threatIndicators = [
        error.message.includes('prompt injection'),
        error.message.includes('cannot be processed'),
        error.message.includes('SQL') && error.message.includes('syntax'),
        req.originalUrl.includes('..'),
        req.originalUrl.includes('%2e%2e'),
        req.originalUrl.includes('<script>'),
        req.originalUrl.includes('javascript:'),
        !req.get('User-Agent') || req.get('User-Agent')?.includes('bot'),
        JSON.stringify(req.body || {}).length > 100000,
    ];
    return threatIndicators.some(indicator => indicator);
}
