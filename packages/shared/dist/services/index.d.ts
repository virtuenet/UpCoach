import { AxiosError, AxiosInstance } from 'axios';

/**
 * Unified API Client Factory
 * Creates configured axios instances for admin and CMS panels
 */

interface ApiClientConfig {
    baseURL: string;
    timeout?: number;
    withCredentials?: boolean;
    getAuthToken?: () => string | null;
    getCSRFToken?: () => Promise<string | null>;
    skipCSRF?: boolean;
    onUnauthorized?: () => void;
    onError?: (error: AxiosError) => void;
}
interface ApiClient extends AxiosInstance {
    setAuthToken: (token: string | null) => void;
}
/**
 * Create a configured API client instance
 */
declare function createApiClient(config: ApiClientConfig): ApiClient;
/**
 * Helper function to handle API errors consistently
 */
declare function handleApiError(error: any): {
    message: string;
    code?: string;
    details?: any;
};
/**
 * Create a retry wrapper for API calls
 */
declare function withRetry<T>(apiCall: () => Promise<T>, options?: {
    maxRetries?: number;
    delay?: number;
    shouldRetry?: (error: any) => boolean;
}): Promise<T>;
/**
 * Create request/response transformers
 */
declare const transformers: {
    snakeToCamel: (data: any) => any;
    camelToSnake: (data: any) => any;
};

export { type ApiClient, type ApiClientConfig, createApiClient, handleApiError, transformers, withRetry };
