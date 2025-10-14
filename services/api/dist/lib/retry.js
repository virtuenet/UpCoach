"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryMechanism = void 0;
exports.setupRetry = setupRetry;
exports.createRetryableClient = createRetryableClient;
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const logger_1 = require("../utils/logger");
function isNetworkOrIdempotentRequestError(error) {
    return !error.response ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT' ||
        (error.response?.status >= 500 && error.response?.status < 600);
}
function setupRetry(client, options = {}) {
    const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000, shouldRetry, } = options;
    client.interceptors.response.use((response) => response, async (error) => {
        const config = error.config;
        if (!config || config.__retryCount >= maxRetries) {
            return Promise.reject(error);
        }
        config.__retryCount = config.__retryCount || 0;
        const shouldRetryError = shouldRetry ?
            shouldRetry(error) :
            (isNetworkOrIdempotentRequestError(error) ||
                error.response?.status === 429 ||
                error.response?.status === 503 ||
                error.response?.status === 504);
        if (!shouldRetryError) {
            return Promise.reject(error);
        }
        config.__retryCount++;
        const delay = Math.min(baseDelay * Math.pow(2, config.__retryCount - 1), maxDelay);
        const jitter = delay * 0.1 * Math.random();
        logger_1.logger.info(`Retry attempt ${config.__retryCount} for ${config.method?.toUpperCase()} ${config.url}`);
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
        return client(config);
    });
}
function createRetryableClient(baseURL, retryOptions) {
    const client = axios_1.default.create({
        baseURL,
        timeout: 30000,
    });
    setupRetry(client, retryOptions);
    return client;
}
class RetryMechanism {
    client;
    constructor(options = {}) {
        this.client = axios_1.default.create();
        setupRetry(this.client, options);
    }
    async execute(fn, options) {
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
