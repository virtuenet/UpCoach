"use strict";
/**
 * Retry configuration using axios-retry
 * Replaces custom RetryMechanism implementation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryMechanism = void 0;
exports.setupRetry = setupRetry;
exports.createRetryableClient = createRetryableClient;
const axios_1 = __importDefault(require("axios"));
const axios_retry_1 = __importDefault(require("axios-retry"));
const logger_1 = require("../utils/logger");
/**
 * Setup retry logic for an axios instance
 */
function setupRetry(client, options = {}) {
    const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000, shouldRetry, ...axiosRetryOptions } = options;
    (0, axios_retry_1.default)(client, {
        retries: maxRetries,
        retryDelay: retryCount => {
            // Exponential backoff with jitter
            const delay = Math.min(baseDelay * Math.pow(2, retryCount - 1), maxDelay);
            const jitter = delay * 0.1 * Math.random();
            return delay + jitter;
        },
        retryCondition: error => {
            // Custom retry condition
            if (shouldRetry) {
                return shouldRetry(error);
            }
            // Default conditions
            return (axios_retry_1.default.isNetworkOrIdempotentRequestError(error) ||
                error.response?.status === 429 || // Rate limit
                error.response?.status === 503 || // Service unavailable
                error.response?.status === 504 // Gateway timeout
            );
        },
        onRetry: (retryCount, error, requestConfig) => {
            logger_1.logger.info(`Retry attempt ${retryCount} for ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
        },
        ...axiosRetryOptions,
    });
}
/**
 * Create axios instance with retry enabled
 */
function createRetryableClient(baseURL, retryOptions) {
    const client = axios_1.default.create({
        baseURL,
        timeout: 30000,
    });
    setupRetry(client, retryOptions);
    return client;
}
/**
 * Wrapper for backward compatibility with custom RetryMechanism
 */
class RetryMechanism {
    client;
    constructor(options = {}) {
        this.client = axios_1.default.create();
        setupRetry(this.client, options);
    }
    async execute(fn, options) {
        // For non-axios operations, fall back to simple retry
        let lastError;
        const maxAttempts = (options?.maxRetries || 3) + 1;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (attempt < maxAttempts) {
                    if (options?.onRetry) {
                        options.onRetry(error, attempt);
                    }
                    // Exponential backoff
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    }
}
exports.RetryMechanism = RetryMechanism;
exports.default = { setupRetry, createRetryableClient, RetryMechanism };
//# sourceMappingURL=retry.js.map