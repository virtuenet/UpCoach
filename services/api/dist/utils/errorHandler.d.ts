import { Response } from 'express';
/**
 * User-friendly error class with actionable information
 */
export declare class UserFriendlyError extends Error {
    userMessage: string;
    technicalMessage: string;
    statusCode: number;
    actionRequired?: string;
    retryable: boolean;
    helpUrl?: string;
    constructor(userMessage: string, technicalMessage: string, statusCode?: number, actionRequired?: string, retryable?: boolean, helpUrl?: string);
}
/**
 * Type guard to check if error is an Error instance
 */
export declare function isError(error: unknown): error is Error;
/**
 * Type guard to check if error has a message property
 */
export declare function hasMessage(error: unknown): error is {
    message: string;
};
/**
 * Type guard to check if error has a statusCode property
 */
export declare function hasStatusCode(error: unknown): error is {
    statusCode: number;
};
/**
 * Convert unknown error to UserFriendlyError
 */
export declare function handleError(error: unknown): UserFriendlyError;
/**
 * Handle controller errors consistently
 */
export declare function handleControllerError(error: unknown, res: Response, context: string): void;
/**
 * Extract error message safely
 */
export declare function getErrorMessage(error: unknown): string;
/**
 * Extract status code safely
 */
export declare function getErrorStatusCode(error: unknown): number;
//# sourceMappingURL=errorHandler.d.ts.map