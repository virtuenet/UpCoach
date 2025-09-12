export interface RetryOptions {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    onRetry?: (error: Error, attempt: number) => void;
}
export declare class RetryMechanism {
    private readonly defaultOptions;
    execute<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T>;
    private isRetryableError;
    private calculateDelay;
    private sleep;
    wrap<T extends (...args: any[]) => Promise<any>>(fn: T, options?: RetryOptions): T;
}
export declare const retry: RetryMechanism;
//# sourceMappingURL=RetryMechanism.d.ts.map