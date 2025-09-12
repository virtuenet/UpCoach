"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryMechanism = void 0;
exports.setupRetry = setupRetry;
exports.createRetryableClient = createRetryableClient;
const axios_1 = __importDefault(require("axios"));
const axios_retry_1 = __importStar(require("axios-retry"));
const logger_1 = require("../utils/logger");
function setupRetry(client, options = {}) {
    const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000, shouldRetry, ...axiosRetryOptions } = options;
    (0, axios_retry_1.default)(client, {
        retries: maxRetries,
        retryDelay: retryCount => {
            const delay = Math.min(baseDelay * Math.pow(2, retryCount - 1), maxDelay);
            const jitter = delay * 0.1 * Math.random();
            return delay + jitter;
        },
        retryCondition: error => {
            if (shouldRetry) {
                return shouldRetry(error);
            }
            return ((0, axios_retry_1.isNetworkOrIdempotentRequestError)(error) ||
                error.response?.status === 429 ||
                error.response?.status === 503 ||
                error.response?.status === 504);
        },
        onRetry: (retryCount, error, requestConfig) => {
            logger_1.logger.info(`Retry attempt ${retryCount} for ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
        },
        ...axiosRetryOptions,
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
//# sourceMappingURL=retry.js.map