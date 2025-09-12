/**
 * @upcoach/utils
 * Shared utility functions
 */
/**
 * Deep clone an object
 */
declare function deepClone<T>(obj: T): T;
/**
 * Deep merge objects
 */
declare function deepMerge<T extends Record<string, any>>(...objects: Partial<T>[]): T;
/**
 * Sleep/delay function
 */
declare const sleep: (ms: number) => Promise<void>;
/**
 * Retry function with exponential backoff
 */
declare function retry<T>(fn: () => Promise<T>, options?: {
    retries?: number;
    delay?: number;
    maxDelay?: number;
    factor?: number;
    onRetry?: (error: Error, attempt: number) => void;
}): Promise<T>;
/**
 * Memoize function
 */
declare function memoize<T extends (...args: any[]) => any>(fn: T, getKey?: (...args: Parameters<T>) => string): T;
/**
 * Rate limiter
 */
declare class RateLimiter {
    private maxConcurrent;
    private interval;
    private queue;
    private running;
    constructor(maxConcurrent: number, interval: number);
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private waitForSlot;
    private processQueue;
}
/**
 * Create a singleton instance
 */
declare function singleton<T>(factory: () => T): () => T;
/**
 * Parse JSON safely
 */
declare function safeJsonParse<T = any>(json: string, fallback?: T): T | undefined;
/**
 * Environment variable getter with type safety
 */
declare function getEnv(key: string, defaultValue?: string): string;
/**
 * Check if running in browser
 */
declare const isBrowser: boolean;
/**
 * Check if running in production
 */
declare const isProduction: boolean;
/**
 * Check if running in development
 */
declare const isDevelopment: boolean;
/**
 * Check if running in test
 */
declare const isTest: boolean;

export { RateLimiter, deepClone, deepMerge, getEnv, isBrowser, isDevelopment, isProduction, isTest, memoize, retry, safeJsonParse, singleton, sleep };
