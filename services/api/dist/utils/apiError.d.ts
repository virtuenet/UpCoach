export declare class ApiError extends Error {
    readonly statusCode: number;
    readonly details?: any;
    readonly isOperational: boolean;
    constructor(statusCode: number, message: string, details?: any, isOperational?: boolean);
    static badRequest(message?: string, details?: any): ApiError;
    static unauthorized(message?: string, details?: any): ApiError;
    static forbidden(message?: string, details?: any): ApiError;
    static notFound(message?: string, details?: any): ApiError;
    static conflict(message?: string, details?: any): ApiError;
    static unprocessableEntity(message?: string, details?: any): ApiError;
    static tooManyRequests(message?: string, details?: any): ApiError;
    static internal(message?: string, details?: any): ApiError;
    static notImplemented(message?: string, details?: any): ApiError;
    static serviceUnavailable(message?: string, details?: any): ApiError;
    toJSON(): {
        error: string;
        statusCode: number;
        message: string;
        details: any;
        isOperational: boolean;
    };
}
//# sourceMappingURL=apiError.d.ts.map