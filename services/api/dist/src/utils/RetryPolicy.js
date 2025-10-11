"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryPolicy = exports.RetryStrategy = void 0;
var RetryStrategy;
(function (RetryStrategy) {
    RetryStrategy["FIXED_DELAY"] = "fixed";
    RetryStrategy["EXPONENTIAL_BACKOFF"] = "exponential";
    RetryStrategy["LINEAR_BACKOFF"] = "linear";
    RetryStrategy["FIBONACCI_BACKOFF"] = "fibonacci";
})(RetryStrategy || (exports.RetryStrategy = RetryStrategy = {}));
class RetryPolicy {
    options;
    constructor(options) {
        this.options = {
            maxDelayMs: 60000,
            backoffMultiplier: 2,
            jitterMs: 0,
            retryCondition: () => true,
            onRetry: () => { },
            ...options
        };
    }
    async execute(operation, strategy = RetryStrategy.EXPONENTIAL_BACKOFF) {
        const startTime = Date.now();
        let lastError;
        let attempt = 0;
        while (attempt < this.options.maxAttempts) {
            attempt++;
            try {
                const result = await operation();
                return {
                    result,
                    attempts: attempt,
                    totalTime: Date.now() - startTime
                };
            }
            catch (error) {
                lastError = error;
                if (!this.options.retryCondition(error, attempt)) {
                    throw error;
                }
                if (attempt >= this.options.maxAttempts) {
                    throw error;
                }
                await this.options.onRetry(error, attempt);
                const delay = this.calculateDelay(attempt, strategy);
                if (delay > 0) {
                    await this.sleep(delay);
                }
            }
        }
        throw lastError;
    }
    calculateDelay(attempt, strategy) {
        let delay;
        switch (strategy) {
            case RetryStrategy.FIXED_DELAY:
                delay = this.options.baseDelayMs;
                break;
            case RetryStrategy.LINEAR_BACKOFF:
                delay = this.options.baseDelayMs * attempt;
                break;
            case RetryStrategy.FIBONACCI_BACKOFF:
                delay = this.options.baseDelayMs * this.fibonacci(attempt);
                break;
            case RetryStrategy.EXPONENTIAL_BACKOFF:
            default:
                delay = this.options.baseDelayMs * Math.pow(this.options.backoffMultiplier, attempt - 1);
                break;
        }
        delay = Math.min(delay, this.options.maxDelayMs);
        if (this.options.jitterMs > 0) {
            const jitter = Math.random() * this.options.jitterMs;
            delay += jitter;
        }
        return Math.round(delay);
    }
    fibonacci(n) {
        if (n <= 1)
            return 1;
        if (n <= 2)
            return 1;
        let prev = 1;
        let curr = 1;
        for (let i = 3; i <= n; i++) {
            const next = prev + curr;
            prev = curr;
            curr = next;
        }
        return curr;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    static forNetworkRequests() {
        return new RetryPolicy({
            maxAttempts: 3,
            baseDelayMs: 1000,
            maxDelayMs: 10000,
            backoffMultiplier: 2,
            jitterMs: 500,
            retryCondition: (error) => {
                return error.code === 'ECONNABORTED' ||
                    error.code === 'ETIMEDOUT' ||
                    error.code === 'ENOTFOUND' ||
                    error.code === 'ECONNRESET' ||
                    (error.response && error.response.status >= 500);
            }
        });
    }
    static forDatabaseOperations() {
        return new RetryPolicy({
            maxAttempts: 5,
            baseDelayMs: 100,
            maxDelayMs: 5000,
            backoffMultiplier: 1.5,
            jitterMs: 100,
            retryCondition: (error) => {
                const message = error.message?.toLowerCase() || '';
                return message.includes('connection') ||
                    message.includes('timeout') ||
                    message.includes('deadlock') ||
                    message.includes('lock wait timeout');
            }
        });
    }
    static forExternalAPI() {
        return new RetryPolicy({
            maxAttempts: 4,
            baseDelayMs: 2000,
            maxDelayMs: 30000,
            backoffMultiplier: 2,
            jitterMs: 1000,
            retryCondition: (error, attempt) => {
                if (error.response && error.response.status >= 400 && error.response.status < 500) {
                    return error.response.status === 429;
                }
                return !error.response || error.response.status >= 500;
            }
        });
    }
    static forFileOperations() {
        return new RetryPolicy({
            maxAttempts: 3,
            baseDelayMs: 500,
            maxDelayMs: 5000,
            backoffMultiplier: 2,
            retryCondition: (error) => {
                const code = error.code || '';
                return code === 'EBUSY' ||
                    code === 'EAGAIN' ||
                    code === 'EMFILE' ||
                    code === 'ENFILE' ||
                    code === 'ENOTEMPTY';
            }
        });
    }
}
exports.RetryPolicy = RetryPolicy;
exports.default = RetryPolicy;
//# sourceMappingURL=RetryPolicy.js.map