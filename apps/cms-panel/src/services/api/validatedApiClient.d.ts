/**
 * Validated API Client
 * Wraps API client with automatic input validation and sanitization
 */
import { ZodSchema } from 'zod';
export interface RequestConfig {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data?: any;
    params?: any;
    headers?: Record<string, string>;
    validation?: {
        data?: ZodSchema;
        params?: ZodSchema;
        response?: ZodSchema;
    };
}
declare class ValidatedApiClient {
    private static instance;
    private constructor();
    static getInstance(): ValidatedApiClient;
    /**
     * Make validated API request
     */
    request<T = any>(config: RequestConfig): Promise<T>;
    /**
     * GET request with validation
     */
    get<T = any>(url: string, params?: any, validation?: {
        params?: ZodSchema;
        response?: ZodSchema;
    }): Promise<T>;
    /**
     * POST request with validation
     */
    post<T = any>(url: string, data?: any, validation?: {
        data?: ZodSchema;
        response?: ZodSchema;
    }): Promise<T>;
    /**
     * PUT request with validation
     */
    put<T = any>(url: string, data?: any, validation?: {
        data?: ZodSchema;
        response?: ZodSchema;
    }): Promise<T>;
    /**
     * PATCH request with validation
     */
    patch<T = any>(url: string, data?: any, validation?: {
        data?: ZodSchema;
        response?: ZodSchema;
    }): Promise<T>;
    /**
     * DELETE request with validation
     */
    delete<T = any>(url: string, params?: any, validation?: {
        params?: ZodSchema;
        response?: ZodSchema;
    }): Promise<T>;
    /**
     * Create paginated request helper
     */
    paginated<T = any>(url: string, params: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        [key: string]: any;
    }, validation?: {
        params?: ZodSchema;
        response?: ZodSchema;
    }): Promise<{
        data: T[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * File upload with validation
     */
    uploadFile(url: string, file: File, additionalData?: any): Promise<any>;
    /**
     * Batch requests with validation
     */
    batch<T = any>(requests: RequestConfig[]): Promise<T[]>;
    /**
     * Retry failed requests with exponential backoff
     */
    withRetry<T = any>(config: RequestConfig, maxRetries?: number, delay?: number): Promise<T>;
}
export declare const validatedApi: ValidatedApiClient;
export declare const api: {
    users: {
        list: (params?: any) => Promise<{
            data: any[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        }>;
        get: (id: string) => Promise<any>;
        create: (data: any) => Promise<any>;
        update: (id: string, data: any) => Promise<any>;
        delete: (id: string) => Promise<any>;
    };
    content: {
        list: (params?: any) => Promise<{
            data: any[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        }>;
        get: (id: string) => Promise<any>;
        create: (data: any) => Promise<any>;
        update: (id: string, data: any) => Promise<any>;
        delete: (id: string) => Promise<any>;
        publish: (id: string) => Promise<any>;
        unpublish: (id: string) => Promise<any>;
    };
    media: {
        list: (params?: any) => Promise<{
            data: any[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        }>;
        upload: (file: File, metadata?: any) => Promise<any>;
        delete: (id: string) => Promise<any>;
    };
    settings: {
        get: (key: string) => Promise<any>;
        update: (key: string, value: any) => Promise<any>;
    };
    analytics: {
        overview: (params?: any) => Promise<any>;
        content: (params?: any) => Promise<any>;
        users: (params?: any) => Promise<any>;
    };
};
export {};
//# sourceMappingURL=validatedApiClient.d.ts.map