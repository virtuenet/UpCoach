/**
 * Client-side Rate Limiter
 * Prevents abuse by limiting requests per time window
 */
interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    identifier?: string;
}
declare class RateLimiter {
    private limits;
    private cleanupInterval;
    constructor();
    /**
     * Check if a request is allowed under rate limiting rules
     */
    checkLimit(config: RateLimitConfig): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
        retryAfter?: number;
    }>;
    /**
     * Reset limits for a specific identifier
     */
    reset(identifier?: string): void;
    /**
     * Clean up expired entries
     */
    private cleanup;
    /**
     * Destroy the rate limiter and clear intervals
     */
    destroy(): void;
}
export declare const rateLimiter: RateLimiter;
/**
 * Rate limit configurations for different operations
 */
export declare const RATE_LIMITS: {
    LOGIN: {
        maxRequests: number;
        windowMs: number;
        identifier: string;
    };
    REGISTER: {
        maxRequests: number;
        windowMs: number;
        identifier: string;
    };
    PASSWORD_RESET: {
        maxRequests: number;
        windowMs: number;
        identifier: string;
    };
    CONTENT_CREATE: {
        maxRequests: number;
        windowMs: number;
        identifier: string;
    };
    CONTENT_UPDATE: {
        maxRequests: number;
        windowMs: number;
        identifier: string;
    };
    CONTENT_DELETE: {
        maxRequests: number;
        windowMs: number;
        identifier: string;
    };
    MEDIA_UPLOAD: {
        maxRequests: number;
        windowMs: number;
        identifier: string;
    };
    SEARCH: {
        maxRequests: number;
        windowMs: number;
        identifier: string;
    };
    API_READ: {
        maxRequests: number;
        windowMs: number;
        identifier: string;
    };
    ADMIN_ACTION: {
        maxRequests: number;
        windowMs: number;
        identifier: string;
    };
};
/**
 * Rate limiting middleware for API calls
 */
export declare function withRateLimit<T>(operation: () => Promise<T>, config: RateLimitConfig): Promise<T>;
export declare function useRateLimit(config: RateLimitConfig): {
    isLimited: boolean;
    remaining: number;
    retryAfter: number;
    checkLimit: () => Promise<boolean>;
    reset: () => void;
};
/**
 * Progressive delay for failed attempts (exponential backoff)
 */
export declare class ProgressiveDelay {
    private attempts;
    private baseDelay;
    private maxDelay;
    private factor;
    constructor(baseDelay?: number, maxDelay?: number, factor?: number);
    getDelay(identifier: string): number;
    recordAttempt(identifier: string): void;
    reset(identifier: string): void;
    resetAll(): void;
}
export {};
//# sourceMappingURL=rateLimiter.d.ts.map