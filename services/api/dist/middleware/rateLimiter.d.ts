/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export declare const apiLimiter: any;
/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per fingerprint (IP + user agent)
 */
export declare const authLimiter: any;
/**
 * Moderate rate limiter for password reset endpoints
 * 3 requests per hour per IP
 */
export declare const passwordResetLimiter: any;
/**
 * Strict rate limiter for file uploads
 * 10 uploads per hour per IP
 */
export declare const uploadLimiter: any;
/**
 * Rate limiter for webhook endpoints
 * 1000 requests per minute (for external services)
 */
export declare const webhookLimiter: any;
/**
 * Flexible rate limiter for public API endpoints
 * 30 requests per minute per IP
 */
export declare const publicApiLimiter: any;
/**
 * Create a custom rate limiter with specific configuration
 */
export declare function createRateLimiter(options: {
    windowMs: number;
    max: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
    useFingerprint?: boolean;
}): any;
//# sourceMappingURL=rateLimiter.d.ts.map