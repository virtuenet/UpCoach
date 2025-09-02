"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserFriendlyError = void 0;
exports.isError = isError;
exports.hasMessage = hasMessage;
exports.hasStatusCode = hasStatusCode;
exports.handleError = handleError;
exports.handleControllerError = handleControllerError;
exports.getErrorMessage = getErrorMessage;
exports.getErrorStatusCode = getErrorStatusCode;
const logger_1 = require("./logger");
/**
 * User-friendly error class with actionable information
 */
class UserFriendlyError extends Error {
    userMessage;
    technicalMessage;
    statusCode;
    actionRequired;
    retryable;
    helpUrl;
    constructor(userMessage, technicalMessage, statusCode = 500, actionRequired, retryable = false, helpUrl) {
        super(technicalMessage);
        this.userMessage = userMessage;
        this.technicalMessage = technicalMessage;
        this.statusCode = statusCode;
        this.actionRequired = actionRequired;
        this.retryable = retryable;
        this.helpUrl = helpUrl;
        this.name = 'UserFriendlyError';
    }
}
exports.UserFriendlyError = UserFriendlyError;
/**
 * Type guard to check if error is an Error instance
 */
function isError(error) {
    return error instanceof Error;
}
/**
 * Type guard to check if error has a message property
 */
function hasMessage(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string');
}
/**
 * Type guard to check if error has a statusCode property
 */
function hasStatusCode(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        typeof error.statusCode === 'number');
}
/**
 * Convert unknown error to UserFriendlyError
 */
function handleError(error) {
    // If it's already a UserFriendlyError, return it
    if (error instanceof UserFriendlyError) {
        return error;
    }
    // If it's a standard Error
    if (isError(error)) {
        return new UserFriendlyError('Something went wrong. Please try again.', error.message, 500, 'Refresh the page or contact support if the problem persists', true);
    }
    // If it has a message property
    if (hasMessage(error)) {
        return new UserFriendlyError('An error occurred while processing your request.', error.message, 500, 'Please try again', true);
    }
    // For unknown errors
    return new UserFriendlyError('An unexpected error occurred', String(error), 500, 'Please refresh the page and try again', false);
}
/**
 * Handle controller errors consistently
 */
function handleControllerError(error, res, context) {
    const userFriendlyError = handleError(error);
    // Log the technical details
    logger_1.logger.error(`${context}: ${userFriendlyError.technicalMessage}`, {
        context,
        statusCode: userFriendlyError.statusCode,
        error: error instanceof Error ? error.stack : error,
    });
    // Prepare response
    const response = {
        success: false,
        error: {
            message: userFriendlyError.userMessage,
            statusCode: userFriendlyError.statusCode,
            timestamp: new Date().toISOString(),
            retryable: userFriendlyError.retryable,
        },
    };
    // Add action and help URL if available
    if (userFriendlyError.actionRequired) {
        response.error.action = userFriendlyError.actionRequired;
    }
    if (userFriendlyError.helpUrl) {
        response.error.helpUrl = userFriendlyError.helpUrl;
    }
    // In development, include technical details
    if (process.env.NODE_ENV === 'development') {
        response.error.technical = {
            message: userFriendlyError.technicalMessage,
            context,
            stack: error instanceof Error ? error.stack : undefined,
        };
    }
    res.status(userFriendlyError.statusCode).json(response);
}
/**
 * Extract error message safely
 */
function getErrorMessage(error) {
    if (isError(error)) {
        return error.message;
    }
    if (hasMessage(error)) {
        return error.message;
    }
    return String(error);
}
/**
 * Extract status code safely
 */
function getErrorStatusCode(error) {
    if (hasStatusCode(error)) {
        return error.statusCode;
    }
    if (error instanceof UserFriendlyError) {
        return error.statusCode;
    }
    return 500;
}
//# sourceMappingURL=errorHandler.js.map