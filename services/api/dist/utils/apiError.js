"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    statusCode;
    details;
    isOperational;
    constructor(statusCode, message, details, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = isOperational;
        // Maintain proper stack trace
        Error.captureStackTrace(this, this.constructor);
    }
    static badRequest(message = 'Bad Request', details) {
        return new ApiError(400, message, details);
    }
    static unauthorized(message = 'Unauthorized', details) {
        return new ApiError(401, message, details);
    }
    static forbidden(message = 'Forbidden', details) {
        return new ApiError(403, message, details);
    }
    static notFound(message = 'Not Found', details) {
        return new ApiError(404, message, details);
    }
    static conflict(message = 'Conflict', details) {
        return new ApiError(409, message, details);
    }
    static unprocessableEntity(message = 'Unprocessable Entity', details) {
        return new ApiError(422, message, details);
    }
    static tooManyRequests(message = 'Too Many Requests', details) {
        return new ApiError(429, message, details);
    }
    static internal(message = 'Internal Server Error', details) {
        return new ApiError(500, message, details);
    }
    static notImplemented(message = 'Not Implemented', details) {
        return new ApiError(501, message, details);
    }
    static serviceUnavailable(message = 'Service Unavailable', details) {
        return new ApiError(503, message, details);
    }
    toJSON() {
        return {
            error: this.constructor.name,
            statusCode: this.statusCode,
            message: this.message,
            details: this.details,
            isOperational: this.isOperational,
        };
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=apiError.js.map