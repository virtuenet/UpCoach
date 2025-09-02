/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per fingerprint (IP + user agent)
 */
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Moderate rate limiter for password reset endpoints
 * 3 requests per hour per IP
 */
export declare const passwordResetLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Strict rate limiter for file uploads
 * 10 uploads per hour per IP
 */
export declare const uploadLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Rate limiter for webhook endpoints
 * 1000 requests per minute (for external services)
 */
export declare const webhookLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Flexible rate limiter for public API endpoints
 * 30 requests per minute per IP
 */
export declare const publicApiLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Create a custom rate limiter with specific configuration
 */
export declare function createRateLimiter(options: {
    windowMs: number;
    max: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
    useFingerprint?: boolean;
}): import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map