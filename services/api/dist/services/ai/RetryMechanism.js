"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retry = exports.RetryMechanism = void 0;
class RetryMechanism {
    defaultOptions = {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        factor: 2,
        onRetry: () => { },
    };
    async execute(operation, options) {
        const config = { ...this.defaultOptions, ...options };
        let lastError;
        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (attempt === config.maxRetries) {
                    throw lastError;
                }
                if (!this.isRetryableError(lastError)) {
                    throw lastError;
                }
                const delay = this.calculateDelay(attempt, config);
                config.onRetry(lastError, attempt + 1);
                await this.sleep(delay);
            }
        }
        throw lastError;
    }
    isRetryableError(error) {
        if (error.message.includes('ECONNREFUSED') ||
            error.message.includes('ETIMEDOUT') ||
            error.message.includes('ENOTFOUND')) {
            return true;
        }
        const retryableStatusCodes = [429, 500, 502, 503, 504];
        if ('status' in error && typeof error.status === 'number') {
            return retryableStatusCodes.includes(error.status);
        }
        if (error.message.toLowerCase().includes('rate limit')) {
            return true;
        }
        if (error.message.toLowerCase().includes('temporary') ||
            error.message.toLowerCase().includes('timeout')) {
            return true;
        }
        return false;
    }
    calculateDelay(attempt, config) {
        const exponentialDelay = config.initialDelay * Math.pow(config.factor, attempt);
        const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5);
        return Math.min(jitteredDelay, config.maxDelay);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    wrap(fn, options) {
        return (async (...args) => {
            return this.execute(() => fn(...args), options);
        });
    }
}
exports.RetryMechanism = RetryMechanism;
exports.retry = new RetryMechanism();
