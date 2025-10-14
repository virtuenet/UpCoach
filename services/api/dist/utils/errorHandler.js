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
function isError(error) {
    return error instanceof Error;
}
function hasMessage(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string');
}
function hasStatusCode(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        typeof error.statusCode === 'number');
}
function handleError(error) {
    if (error instanceof UserFriendlyError) {
        return error;
    }
    if (isError(error)) {
        return new UserFriendlyError('Something went wrong. Please try again.', error.message, 500, 'Refresh the page or contact support if the problem persists', true);
    }
    if (hasMessage(error)) {
        return new UserFriendlyError('An error occurred while processing your request.', error.message, 500, 'Please try again', true);
    }
    return new UserFriendlyError('An unexpected error occurred', String(error), 500, 'Please refresh the page and try again', false);
}
function handleControllerError(error, res, context) {
    const userFriendlyError = handleError(error);
    logger_1.logger.error(`${context}: ${userFriendlyError.technicalMessage}`, {
        context,
        statusCode: userFriendlyError.statusCode,
        error: error instanceof Error ? error.stack : error,
    });
    const response = {
        success: false,
        error: {
            message: userFriendlyError.userMessage,
            statusCode: userFriendlyError.statusCode,
            timestamp: new Date().toISOString(),
            retryable: userFriendlyError.retryable,
        },
    };
    if (userFriendlyError.actionRequired) {
        response.error.action = userFriendlyError.actionRequired;
    }
    if (userFriendlyError.helpUrl) {
        response.error.helpUrl = userFriendlyError.helpUrl;
    }
    if (process.env.NODE_ENV === 'development') {
        response.error.technical = {
            message: userFriendlyError.technicalMessage,
            context,
            stack: error instanceof Error ? error.stack : undefined,
        };
    }
    res.status(userFriendlyError.statusCode).json(response);
}
function getErrorMessage(error) {
    if (isError(error)) {
        return error.message;
    }
    if (hasMessage(error)) {
        return error.message;
    }
    return String(error);
}
function getErrorStatusCode(error) {
    if (hasStatusCode(error)) {
        return error.statusCode;
    }
    if (error instanceof UserFriendlyError) {
        return error.statusCode;
    }
    return 500;
}
