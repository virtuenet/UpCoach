/**
 * Client-side Rate Limiter
 * Prevents abuse by limiting requests per time window
 */
class RateLimiter {
    constructor() {
        this.limits = new Map();
        this.cleanupInterval = null;
        // Clean up expired entries every minute
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
    /**
     * Check if a request is allowed under rate limiting rules
     */
    async checkLimit(config) {
        const key = config.identifier || 'default';
        const now = Date.now();
        let entry = this.limits.get(key);
        // Create new entry or reset if window expired
        if (!entry || now > entry.resetTime) {
            entry = {
                count: 0,
                resetTime: now + config.windowMs,
            };
            this.limits.set(key, entry);
        }
        // Check if limit exceeded
        if (entry.count >= config.maxRequests) {
            const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.resetTime,
                retryAfter,
            };
        }
        // Increment counter
        entry.count++;
        return {
            allowed: true,
            remaining: config.maxRequests - entry.count,
            resetTime: entry.resetTime,
        };
    }
    /**
     * Reset limits for a specific identifier
     */
    reset(identifier) {
        const key = identifier || 'default';
        this.limits.delete(key);
    }
    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.limits.entries()) {
            if (now > entry.resetTime) {
                this.limits.delete(key);
            }
        }
    }
    /**
     * Destroy the rate limiter and clear intervals
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.limits.clear();
    }
}
// Create singleton instance
export const rateLimiter = new RateLimiter();
/**
 * Rate limit configurations for different operations
 */
export const RATE_LIMITS = {
    // Authentication endpoints
    LOGIN: {
        maxRequests: 5,
        windowMs: 15 * 60 * 1000, // 5 attempts per 15 minutes
        identifier: 'auth:login',
    },
    REGISTER: {
        maxRequests: 3,
        windowMs: 60 * 60 * 1000, // 3 attempts per hour
        identifier: 'auth:register',
    },
    PASSWORD_RESET: {
        maxRequests: 3,
        windowMs: 60 * 60 * 1000, // 3 attempts per hour
        identifier: 'auth:password-reset',
    },
    // Content operations
    CONTENT_CREATE: {
        maxRequests: 10,
        windowMs: 60 * 1000, // 10 creates per minute
        identifier: 'content:create',
    },
    CONTENT_UPDATE: {
        maxRequests: 30,
        windowMs: 60 * 1000, // 30 updates per minute
        identifier: 'content:update',
    },
    CONTENT_DELETE: {
        maxRequests: 5,
        windowMs: 60 * 1000, // 5 deletes per minute
        identifier: 'content:delete',
    },
    // Media operations
    MEDIA_UPLOAD: {
        maxRequests: 10,
        windowMs: 5 * 60 * 1000, // 10 uploads per 5 minutes
        identifier: 'media:upload',
    },
    // Search and read operations
    SEARCH: {
        maxRequests: 30,
        windowMs: 60 * 1000, // 30 searches per minute
        identifier: 'search',
    },
    API_READ: {
        maxRequests: 100,
        windowMs: 60 * 1000, // 100 reads per minute
        identifier: 'api:read',
    },
    // Admin operations
    ADMIN_ACTION: {
        maxRequests: 20,
        windowMs: 60 * 1000, // 20 admin actions per minute
        identifier: 'admin:action',
    },
};
/**
 * Rate limiting middleware for API calls
 */
export async function withRateLimit(operation, config) {
    const result = await rateLimiter.checkLimit(config);
    if (!result.allowed) {
        const error = new Error(`Rate limit exceeded. Try again in ${result.retryAfter} seconds.`);
        error.code = 'RATE_LIMIT_EXCEEDED';
        error.retryAfter = result.retryAfter;
        error.resetTime = result.resetTime;
        throw error;
    }
    return operation();
}
/**
 * React hook for rate limiting
 */
import { useState, useCallback, useEffect } from 'react';
export function useRateLimit(config) {
    const [isLimited, setIsLimited] = useState(false);
    const [remaining, setRemaining] = useState(config.maxRequests);
    const [retryAfter, setRetryAfter] = useState(0);
    const checkLimit = useCallback(async () => {
        const result = await rateLimiter.checkLimit(config);
        setIsLimited(!result.allowed);
        setRemaining(result.remaining);
        setRetryAfter(result.retryAfter || 0);
        return result.allowed;
    }, [config]);
    const reset = useCallback(() => {
        rateLimiter.reset(config.identifier);
        setIsLimited(false);
        setRemaining(config.maxRequests);
        setRetryAfter(0);
    }, [config]);
    // Auto-reset when retry time expires
    useEffect(() => {
        if (retryAfter > 0) {
            const timeout = setTimeout(() => {
                setIsLimited(false);
                setRetryAfter(0);
                setRemaining(config.maxRequests);
            }, retryAfter * 1000);
            return () => clearTimeout(timeout);
        }
    }, [retryAfter, config.maxRequests]);
    return {
        isLimited,
        remaining,
        retryAfter,
        checkLimit,
        reset,
    };
}
/**
 * Progressive delay for failed attempts (exponential backoff)
 */
export class ProgressiveDelay {
    constructor(baseDelay = 1000, maxDelay = 30000, factor = 2) {
        this.attempts = new Map();
        this.baseDelay = baseDelay;
        this.maxDelay = maxDelay;
        this.factor = factor;
    }
    getDelay(identifier) {
        const attempts = this.attempts.get(identifier) || 0;
        const delay = Math.min(this.baseDelay * Math.pow(this.factor, attempts), this.maxDelay);
        return delay;
    }
    recordAttempt(identifier) {
        const attempts = this.attempts.get(identifier) || 0;
        this.attempts.set(identifier, attempts + 1);
    }
    reset(identifier) {
        this.attempts.delete(identifier);
    }
    resetAll() {
        this.attempts.clear();
    }
}
//# sourceMappingURL=rateLimiter.js.map