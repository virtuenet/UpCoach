"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
class RateLimiter {
    requests = new Map();
    options;
    constructor(options) {
        this.options = options;
    }
    async limit(identifier) {
        const now = Date.now();
        const windowStart = now - this.options.windowMs;
        const existingRequests = this.requests.get(identifier) || [];
        const validRequests = existingRequests.filter(req => req.timestamp > windowStart);
        const allowed = validRequests.length < this.options.maxRequests;
        if (allowed) {
            validRequests.push({ timestamp: now });
            this.requests.set(identifier, validRequests);
        }
        const remaining = Math.max(0, this.options.maxRequests - validRequests.length);
        const resetTime = validRequests.length > 0 ?
            validRequests[0].timestamp + this.options.windowMs :
            now + this.options.windowMs;
        return { allowed, remaining, resetTime };
    }
    async recordSuccess(identifier) {
        if (this.options.skipSuccessfulRequests) {
            this.removeLatestRequest(identifier);
        }
        else {
            this.markLatestRequest(identifier, true);
        }
    }
    async recordFailure(identifier) {
        if (this.options.skipFailedRequests) {
            this.removeLatestRequest(identifier);
        }
        else {
            this.markLatestRequest(identifier, false);
        }
    }
    removeLatestRequest(identifier) {
        const requests = this.requests.get(identifier);
        if (requests && requests.length > 0) {
            requests.pop();
            this.requests.set(identifier, requests);
        }
    }
    markLatestRequest(identifier, success) {
        const requests = this.requests.get(identifier);
        if (requests && requests.length > 0) {
            requests[requests.length - 1].success = success;
        }
    }
    reset(identifier) {
        if (identifier) {
            this.requests.delete(identifier);
        }
        else {
            this.requests.clear();
        }
    }
    cleanup() {
        const now = Date.now();
        const windowStart = now - this.options.windowMs;
        for (const [identifier, requests] of this.requests.entries()) {
            const validRequests = requests.filter(req => req.timestamp > windowStart);
            if (validRequests.length === 0) {
                this.requests.delete(identifier);
            }
            else {
                this.requests.set(identifier, validRequests);
            }
        }
    }
}
exports.RateLimiter = RateLimiter;
exports.default = RateLimiter;
