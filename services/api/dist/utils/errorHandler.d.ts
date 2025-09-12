import { Response } from 'express';
export declare class UserFriendlyError extends Error {
    userMessage: string;
    technicalMessage: string;
    statusCode: number;
    actionRequired?: string | undefined;
    retryable: boolean;
    helpUrl?: string | undefined;
    constructor(userMessage: string, technicalMessage: string, statusCode?: number, actionRequired?: string | undefined, retryable?: boolean, helpUrl?: string | undefined);
}
export declare function isError(error: unknown): error is Error;
export declare function hasMessage(error: unknown): error is {
    message: string;
};
export declare function hasStatusCode(error: unknown): error is {
    statusCode: number;
};
export declare function handleError(error: unknown): UserFriendlyError;
export declare function handleControllerError(error: unknown, res: Response, context: string): void;
export declare function getErrorMessage(error: unknown): string;
export declare function getErrorStatusCode(error: unknown): number;
//# sourceMappingURL=errorHandler.d.ts.map