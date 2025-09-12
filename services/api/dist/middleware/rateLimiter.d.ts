export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const passwordResetLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const uploadLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const webhookLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const publicApiLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare function createRateLimiter(options: {
    windowMs: number;
    max: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
    useFingerprint?: boolean;
}): import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map