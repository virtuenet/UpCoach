/**
 * Rate Limiting Service
 * Implements multiple rate limiting strategies to prevent abuse
 */
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: any) => string;
    handler?: (req: any, res: any) => void;
    onLimitReached?: (key: string) => void;
}
export interface RateLimitRule {
    name: string;
    path?: string | RegExp;
    method?: string | string[];
    config: RateLimitConfig;
}
interface RequestRecord {
    count: number;
    firstRequest: number;
    lastRequest: number;
    blocked: boolean;
    violations: number;
}
declare class RateLimiterService {
    private static instance;
    private stores;
    private rules;
    private blacklist;
    private whitelist;
    private cleanupTimer;
    private readonly CLEANUP_INTERVAL;
    private readonly BLACKLIST_THRESHOLD;
    private readonly BLACKLIST_DURATION;
    private constructor();
    static getInstance(): RateLimiterService;
    /**
     * Setup default rate limiting rules
     */
    private setupDefaultRules;
    /**
     * Add a rate limiting rule
     */
    addRule(rule: RateLimitRule): void;
    /**
     * Check if request should be rate limited
     */
    checkLimit(identifier: string, ruleName?: string, path?: string, method?: string): Promise<{
        allowed: boolean;
        retryAfter?: number;
        reason?: string;
    }>;
    /**
     * Check limit for a specific rule
     */
    private checkRuleLimit;
    /**
     * Find applicable rules for a request
     */
    private findApplicableRules;
    /**
     * Track violations and potentially blacklist
     */
    private trackViolation;
    /**
     * Cleanup old records
     */
    private cleanup;
    /**
     * Add to whitelist
     */
    addToWhitelist(identifier: string): void;
    /**
     * Remove from whitelist
     */
    removeFromWhitelist(identifier: string): void;
    /**
     * Add to blacklist
     */
    addToBlacklist(identifier: string, duration?: number): void;
    /**
     * Remove from blacklist
     */
    removeFromBlacklist(identifier: string): void;
    /**
     * Get current limits for an identifier
     */
    getLimits(identifier: string): Map<string, RequestRecord>;
    /**
     * Reset limits for an identifier
     */
    resetLimits(identifier: string, ruleName?: string): void;
    /**
     * Express middleware
     */
    middleware(ruleName?: string): (req: any, res: any, next: any) => Promise<any>;
    /**
     * Get identifier from request
     */
    private getIdentifier;
    /**
     * Get statistics
     */
    getStatistics(): {
        rules: number;
        activeRecords: number;
        blacklisted: number;
        whitelisted: number;
    };
}
export declare const rateLimiter: RateLimiterService;
export declare const authRateLimit: (req: any, res: any, next: any) => Promise<any>;
export declare const apiRateLimit: (req: any, res: any, next: any) => Promise<any>;
export declare const uploadRateLimit: (req: any, res: any, next: any) => Promise<any>;
export {};
//# sourceMappingURL=rateLimiter.d.ts.map