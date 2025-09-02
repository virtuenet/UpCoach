/**
 * API Response type definitions
 */
import { BaseUser, TimestampedModel, IdentifiableModel } from './common';
export interface SuccessResponse<T = any> {
    success: true;
    data: T;
    message?: string;
    timestamp?: string;
}
export interface ErrorResponse {
    success: false;
    error: string;
    message?: string;
    code?: string;
    details?: any;
    timestamp?: string;
}
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
export interface PaginationMeta {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface PaginatedApiResponse<T> {
    success: true;
    data: T[];
    meta: PaginationMeta;
    message?: string;
}
export interface LoginResponse {
    user: BaseUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface RegisterResponse {
    user: BaseUser;
    message: string;
    requiresVerification?: boolean;
}
export interface TokenRefreshResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface CreateResponse<T = any> extends TimestampedModel, IdentifiableModel {
    data: T;
    message: string;
}
export interface UpdateResponse<T = any> {
    data: T;
    message: string;
    updatedFields?: string[];
}
export interface DeleteResponse {
    success: true;
    message: string;
    id: string | number;
}
export interface BulkOperationResponse {
    success: true;
    processed: number;
    failed: number;
    errors?: Array<{
        id: string | number;
        error: string;
    }>;
}
export interface UploadResponse {
    url: string;
    filename: string;
    size: number;
    mimetype: string;
    id?: string;
}
export interface MultiUploadResponse {
    files: UploadResponse[];
    totalSize: number;
    message: string;
}
export interface AnalyticsResponse {
    metrics: Record<string, number>;
    trends: Array<{
        date: string;
        value: number;
    }>;
    period: {
        start: string;
        end: string;
    };
}
export interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
    timestamp: string;
    services: Record<string, {
        status: 'up' | 'down';
        latency?: number;
        error?: string;
    }>;
}
export interface ValidationErrorResponse {
    success: false;
    error: 'VALIDATION_ERROR';
    errors: Array<{
        field: string;
        message: string;
        value?: any;
    }>;
}
export interface WebSocketMessage<T = any> {
    type: string;
    payload: T;
    timestamp: string;
    id?: string;
}
export interface WebSocketError {
    type: 'error';
    error: string;
    code?: string;
    timestamp: string;
}
export declare class ResponseBuilder {
    static success<T>(data: T, message?: string): SuccessResponse<T>;
    static error(error: string | Error, code?: string): ErrorResponse;
    static paginated<T>(data: T[], page: number, pageSize: number, total: number): PaginatedApiResponse<T>;
    static validation(errors: ValidationErrorResponse['errors']): ValidationErrorResponse;
}
export declare function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T>;
export declare function isErrorResponse(response: ApiResponse): response is ErrorResponse;
export declare function isPaginatedResponse<T>(response: any): response is PaginatedApiResponse<T>;
//# sourceMappingURL=api-responses.d.ts.map