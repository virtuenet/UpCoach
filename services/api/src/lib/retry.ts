/**
 * Retry configuration utility
 * Simple retry mechanism without external dependencies
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: unknown) => boolean;
}

function isNetworkOrIdempotentRequestError(error: AxiosError): boolean {
  return !error.response ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    (error.response?.status >= 500 && error.response?.status < 600);
}

/**
 * Setup retry logic for an axios instance
 */
export function setupRetry(client: AxiosInstance, options: RetryOptions = {}): void {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry,
  } = options;

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as unknown;

      if (!config || config.__retryCount >= maxRetries) {
        return Promise.reject(error);
      }

      config.__retryCount = config.__retryCount || 0;

      // Check if we should retry
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

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, config.__retryCount - 1), maxDelay);
      const jitter = delay * 0.1 * Math.random();

      logger.info(
        `Retry attempt ${config.__retryCount} for ${config.method?.toUpperCase()} ${config.url}`
      );

      await new Promise(resolve => setTimeout(resolve, delay + jitter));

      return client(config);
    }
  );
}

/**
 * Create axios instance with retry enabled
 */
export function createRetryableClient(baseURL: string, retryOptions?: RetryOptions): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 30000,
  });

  setupRetry(client, retryOptions);

  return client;
}

/**
 * Wrapper for backward compatibility with custom RetryMechanism
 */
export class RetryMechanism {
  private client: AxiosInstance;

  constructor(options: RetryOptions = {}) {
    this.client = axios.create();
    setupRetry(this.client, options);
  }

  async execute<T>(
    fn: () => Promise<T>,
    options?: {
      maxRetries?: number;
      onRetry?: (error: unknown, attempt: number) => void;
    }
  ): Promise<T> {
    // For non-axios operations, fall back to simple retry
    let lastError: unknown;
    const maxAttempts = (options?.maxRetries || 3) + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
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

export default { setupRetry, createRetryableClient, RetryMechanism };
