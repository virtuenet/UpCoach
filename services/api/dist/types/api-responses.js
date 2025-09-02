"use strict";
/**
 * API Response type definitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseBuilder = void 0;
exports.isSuccessResponse = isSuccessResponse;
exports.isErrorResponse = isErrorResponse;
exports.isPaginatedResponse = isPaginatedResponse;
// Response builder utilities
class ResponseBuilder {
    static success(data, message) {
        return {
            success: true,
            data,
            message,
            timestamp: new Date().toISOString(),
        };
    }
    static error(error, code) {
        return {
            success: false,
            error: error?.message || error.toString(),
            code,
            timestamp: new Date().toISOString(),
        };
    }
    static paginated(data, page, pageSize, total) {
        const totalPages = Math.ceil(total / pageSize);
        return {
            success: true,
            data,
            meta: {
                page,
                pageSize,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }
    static validation(errors) {
        return {
            success: false,
            error: 'VALIDATION_ERROR',
            errors,
        };
    }
}
exports.ResponseBuilder = ResponseBuilder;
// Type guards
function isSuccessResponse(response) {
    return response.success === true;
}
function isErrorResponse(response) {
    return response.success === false;
}
function isPaginatedResponse(response) {
    return (response.success === true &&
        'meta' in response &&
        'data' in response &&
        Array.isArray(response.data));
}
//# sourceMappingURL=api-responses.js.map