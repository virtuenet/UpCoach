/**
 * Retry configuration using axios-retry
 * Replaces custom RetryMechanism implementation
 */

import axios, { AxiosInstance } from 'axios';
import axiosRetry, { IAxiosRetryConfig } from 'axios-retry';

export interface RetryOptions extends IAxiosRetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: any) => boolean;
}

/**
 * Setup retry logic for an axios instance
 */
export function setupRetry(
  client: AxiosInstance,
  options: RetryOptions = {}
): void {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry,
    ...axiosRetryOptions
  } = options;

  axiosRetry(client, {
    retries: maxRetries,
    retryDelay: (retryCount) => {
      // Exponential backoff with jitter
      const delay = Math.min(baseDelay * Math.pow(2, retryCount - 1), maxDelay);
      const jitter = delay * 0.1 * Math.random();
      return delay + jitter;
    },
    retryCondition: (error) => {
      // Custom retry condition
      if (shouldRetry) {
        return shouldRetry(error);
      }

      // Default conditions
      return (
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        error.response?.status === 429 || // Rate limit
        error.response?.status === 503 || // Service unavailable
        error.response?.status === 504    // Gateway timeout
      );
    },
    onRetry: (retryCount, error, requestConfig) => {
      console.log(
        `Retry attempt ${retryCount} for ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`
      );
    },
    ...axiosRetryOptions,
  });
}

/**
 * Create axios instance with retry enabled
 */
export function createRetryableClient(
  baseURL: string,
  retryOptions?: RetryOptions
): AxiosInstance {
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
      onRetry?: (error: any, attempt: number) => void;
    }
  ): Promise<T> {
    // For non-axios operations, fall back to simple retry
    let lastError: any;
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