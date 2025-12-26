import { logger } from '../../utils/logger';

/**
 * Retry Policy
 *
 * Implements retry logic with exponential backoff:
 * - Configurable max retries
 * - Exponential backoff with jitter
 * - Retry on transient failures
 * - Circuit breaker pattern
 * - Retry budget tracking
 *
 * Strategies:
 * - Fixed delay: 1s, 1s, 1s, ...
 * - Linear backoff: 1s, 2s, 3s, ...
 * - Exponential backoff: 1s, 2s, 4s, 8s, ...
 * - Exponential backoff with jitter: randomized delays
 */

export type RetryStrategy = 'fixed' | 'linear' | 'exponential' | 'exponential-jitter';

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
  strategy?: RetryStrategy;
  retryableErrors?: string[];
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDelay: number;
}

export class RetryPolicy {
  private defaultConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    strategy: 'exponential-jitter',
    retryableErrors: [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EAI_AGAIN',
      'ECONNRESET',
    ],
  };

  /**
   * Execute function with retry logic
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries?: number,
    initialDelay?: number,
    strategy?: RetryStrategy
  ): Promise<T> {
    const config = {
      ...this.defaultConfig,
      maxRetries: maxRetries ?? this.defaultConfig.maxRetries,
      initialDelay: initialDelay ?? this.defaultConfig.initialDelay,
      strategy: strategy ?? this.defaultConfig.strategy,
    };

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= config.maxRetries!) {
      try {
        const result = await fn();

        if (attempt > 0) {
          logger.info('Retry succeeded', {
            attempt,
            totalAttempts: attempt + 1,
          });
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        attempt++;

        // Check if error is retryable
        if (!this.isRetryableError(lastError, config.retryableErrors!)) {
          logger.error('Non-retryable error encountered', {
            error: lastError.message,
            attempt,
          });
          throw lastError;
        }

        if (attempt <= config.maxRetries!) {
          const delay = this.calculateDelay(
            attempt,
            config.initialDelay!,
            config.maxDelay!,
            config.strategy!
          );

          logger.warn('Retry attempt', {
            attempt,
            maxRetries: config.maxRetries,
            delayMs: delay,
            error: lastError.message,
          });

          await this.sleep(delay);
        }
      }
    }

    logger.error('Max retries exceeded', {
      maxRetries: config.maxRetries,
      error: lastError?.message,
    });

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Execute with detailed result tracking
   */
  async executeWithResult<T>(
    fn: () => Promise<T>,
    config?: RetryConfig
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.defaultConfig, ...config };
    let lastError: Error | null = null;
    let attempt = 0;
    let totalDelay = 0;

    while (attempt <= finalConfig.maxRetries!) {
      try {
        const result = await fn();
        return {
          success: true,
          result,
          attempts: attempt + 1,
          totalDelay,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        attempt++;

        if (!this.isRetryableError(lastError, finalConfig.retryableErrors!)) {
          return {
            success: false,
            error: lastError,
            attempts: attempt,
            totalDelay,
          };
        }

        if (attempt <= finalConfig.maxRetries!) {
          const delay = this.calculateDelay(
            attempt,
            finalConfig.initialDelay!,
            finalConfig.maxDelay!,
            finalConfig.strategy!
          );
          totalDelay += delay;
          await this.sleep(delay);
        }
      }
    }

    return {
      success: false,
      error: lastError || new Error('Max retries exceeded'),
      attempts: attempt,
      totalDelay,
    };
  }

  /**
   * Circuit breaker pattern
   */
  createCircuitBreaker<T>(
    fn: () => Promise<T>,
    failureThreshold: number = 5,
    resetTimeout: number = 60000
  ) {
    let failureCount = 0;
    let lastFailureTime = 0;
    let state: 'closed' | 'open' | 'half-open' = 'closed';

    return async (): Promise<T> => {
      const now = Date.now();

      // Reset circuit breaker after timeout
      if (state === 'open' && now - lastFailureTime > resetTimeout) {
        logger.info('Circuit breaker entering half-open state');
        state = 'half-open';
        failureCount = 0;
      }

      // Reject if circuit is open
      if (state === 'open') {
        throw new Error('Circuit breaker is open');
      }

      try {
        const result = await fn();

        // Success - close circuit
        if (state === 'half-open') {
          logger.info('Circuit breaker closing');
          state = 'closed';
        }
        failureCount = 0;

        return result;
      } catch (error) {
        failureCount++;
        lastFailureTime = now;

        // Open circuit if threshold exceeded
        if (failureCount >= failureThreshold) {
          logger.warn('Circuit breaker opening', {
            failureCount,
            threshold: failureThreshold,
          });
          state = 'open';
        }

        throw error;
      }
    };
  }

  /**
   * Retry budget pattern (limit retries within time window)
   */
  createRetryBudget(maxRetriesPerMinute: number = 10) {
    const retryTimestamps: number[] = [];

    return {
      canRetry: (): boolean => {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // Remove timestamps older than 1 minute
        while (retryTimestamps.length > 0 && retryTimestamps[0] < oneMinuteAgo) {
          retryTimestamps.shift();
        }

        return retryTimestamps.length < maxRetriesPerMinute;
      },
      recordRetry: (): void => {
        retryTimestamps.push(Date.now());
      },
    };
  }

  /**
   * Private helper methods
   */

  private calculateDelay(
    attempt: number,
    initialDelay: number,
    maxDelay: number,
    strategy: RetryStrategy
  ): number {
    let delay: number;

    switch (strategy) {
      case 'fixed':
        delay = initialDelay;
        break;

      case 'linear':
        delay = initialDelay * attempt;
        break;

      case 'exponential':
        delay = initialDelay * Math.pow(2, attempt - 1);
        break;

      case 'exponential-jitter':
        const exponential = initialDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * exponential * 0.1; // 10% jitter
        delay = exponential + jitter;
        break;

      default:
        delay = initialDelay;
    }

    // Cap at max delay
    return Math.min(delay, maxDelay);
  }

  private isRetryableError(error: Error, retryableErrors: string[]): boolean {
    // Check error code
    const errorCode = (error as any).code;
    if (errorCode && retryableErrors.includes(errorCode)) {
      return true;
    }

    // Check HTTP status codes (5xx = server errors)
    const statusCode = (error as any).response?.status;
    if (statusCode && statusCode >= 500 && statusCode < 600) {
      return true;
    }

    // Check for specific error messages
    const message = error.message.toLowerCase();
    const retryableMessages = [
      'timeout',
      'timed out',
      'connection refused',
      'network error',
      'socket hang up',
      'econnreset',
      'enotfound',
      'eai_again',
    ];

    return retryableMessages.some((msg) => message.includes(msg));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
