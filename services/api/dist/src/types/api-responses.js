"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseBuilder = void 0;
exports.isSuccessResponse = isSuccessResponse;
exports.isErrorResponse = isErrorResponse;
exports.isPaginatedResponse = isPaginatedResponse;
class ResponseBuilder {
    static success(data, message) {
        return {
            success: true,
            data,
            message,
            timestamp: new Date().toISOString(),
        };
    }
    static error(error, code, accessibleMessage, userAction) {
        const errorMessage = error?.message || error.toString();
        return {
            success: false,
            error: errorMessage,
            accessibleError: accessibleMessage || `Error: ${errorMessage}. ${userAction || 'Please try again.'}`,
            code,
            timestamp: new Date().toISOString(),
            semanticType: 'server-error',
            severity: 'medium',
            userAction: userAction || 'Please try again or contact support if the issue persists',
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
    static validation(errors, accessibleSummary) {
        const enhancedErrors = errors.map(err => ({
            ...err,
            accessibleMessage: err.accessibleMessage ||
                `${err.field} field has an error: ${err.message}`,
            severity: err.severity || 'error',
        }));
        const defaultSummary = `Form validation failed with ${errors.length} error${errors.length > 1 ? 's' : ''}. Please correct the highlighted fields.`;
        return {
            success: false,
            error: 'VALIDATION_ERROR',
            accessibleError: accessibleSummary || defaultSummary,
            errors: enhancedErrors,
            semanticType: 'client-error',
            userAction: 'Please correct the errors shown and submit again',
        };
    }
}
exports.ResponseBuilder = ResponseBuilder;
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