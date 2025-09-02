/**
 * Retry configuration using axios-retry
 * Replaces custom RetryMechanism implementation
 */
import { AxiosInstance } from 'axios';
import { IAxiosRetryConfig } from 'axios-retry';
export interface RetryOptions extends IAxiosRetryConfig {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: any) => boolean;
}
/**
 * Setup retry logic for an axios instance
 */
export declare function setupRetry(client: AxiosInstance, options?: RetryOptions): void;
/**
 * Create axios instance with retry enabled
 */
export declare function createRetryableClient(baseURL: string, retryOptions?: RetryOptions): AxiosInstance;
/**
 * Wrapper for backward compatibility with custom RetryMechanism
 */
export declare class RetryMechanism {
    private client;
    constructor(options?: RetryOptions);
    execute<T>(fn: () => Promise<T>, options?: {
        maxRetries?: number;
        onRetry?: (error: any, attempt: number) => void;
    }): Promise<T>;
}
declare const _default: {
    setupRetry: typeof setupRetry;
    createRetryableClient: typeof createRetryableClient;
    RetryMechanism: typeof RetryMechanism;
};
export default _default;
//# sourceMappingURL=retry.d.ts.map