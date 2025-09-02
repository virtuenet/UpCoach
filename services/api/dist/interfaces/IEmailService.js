"use strict";
/**
 * Email service interfaces and types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExponentialBackoffRetryStrategy = void 0;
/**
 * Default retry strategy implementation
 */
class ExponentialBackoffRetryStrategy {
    maxRetries;
    retryDelay;
    backoffMultiplier;
    maxDelay;
    constructor(maxRetries = 3, retryDelay = 1000, backoffMultiplier = 2, maxDelay = 30000) {
        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;
        this.backoffMultiplier = backoffMultiplier;
        this.maxDelay = maxDelay;
    }
    getDelay(attempt) {
        const delay = this.retryDelay * Math.pow(this.backoffMultiplier, attempt - 1);
        return Math.min(delay, this.maxDelay);
    }
    shouldRetry(error, attempt) {
        if (attempt >= this.maxRetries)
            return false;
        // Don't retry for permanent failures
        const permanentErrors = ['InvalidEmailAddress', 'Unsubscribed', 'Bounced', 'Complained'];
        return !permanentErrors.some(e => error.message.includes(e));
    }
}
exports.ExponentialBackoffRetryStrategy = ExponentialBackoffRetryStrategy;
//# sourceMappingURL=IEmailService.js.map