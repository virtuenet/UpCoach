/**
 * Retry Policy Utility
 * Configurable retry strategies for different scenarios
 */

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitterMs?: number;
  retryCondition?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number) => void | Promise<void>;
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
  totalTime: number;
}

export enum RetryStrategy {
  FIXED_DELAY = 'fixed',
  EXPONENTIAL_BACKOFF = 'exponential',
  LINEAR_BACKOFF = 'linear',
  FIBONACCI_BACKOFF = 'fibonacci'
}

export class RetryPolicy {
  private options: Required<RetryOptions>;

  constructor(options: RetryOptions) {
    this.options = {
      maxDelayMs: 60000, // 1 minute default
      backoffMultiplier: 2,
      jitterMs: 0,
      retryCondition: () => true,
      onRetry: () => {},
      ...options
    };
  }

  async execute<T>(
    operation: () => Promise<T>,
    strategy: RetryStrategy = RetryStrategy.EXPONENTIAL_BACKOFF
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: unknown;
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
      } catch (error) {
        lastError = error;

        // Check if we should retry this error
        if (!this.options.retryCondition(error, attempt)) {
          throw error;
        }

        // If this was the last attempt, throw the error
        if (attempt >= this.options.maxAttempts) {
          throw error;
        }

        // Call onRetry callback
        await this.options.onRetry(error, attempt);

        // Calculate delay and wait
        const delay = this.calculateDelay(attempt, strategy);
        if (delay > 0) {
          await this.sleep(delay);
        }
      }
    }

    // This should never be reached, but just in case
    throw lastError;
  }

  private calculateDelay(attempt: number, strategy: RetryStrategy): number {
    let delay: number;

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

    // Apply maximum delay limit
    delay = Math.min(delay, this.options.maxDelayMs);

    // Add jitter to prevent thundering herd
    if (this.options.jitterMs > 0) {
      const jitter = Math.random() * this.options.jitterMs;
      delay += jitter;
    }

    return Math.round(delay);
  }

  private fibonacci(n: number): number {
    if (n <= 1) return 1;
    if (n <= 2) return 1;

    let prev = 1;
    let curr = 1;

    for (let i = 3; i <= n; i++) {
      const next = prev + curr;
      prev = curr;
      curr = next;
    }

    return curr;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Pre-configured retry policies for common scenarios
  static forNetworkRequests(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      jitterMs: 500,
      retryCondition: (error) => {
        // Retry on network errors or 5xx status codes
        return error.code === 'ECONNABORTED' ||
               error.code === 'ETIMEDOUT' ||
               error.code === 'ENOTFOUND' ||
               error.code === 'ECONNRESET' ||
               (error.response && error.response.status >= 500);
      }
    });
  }

  static forDatabaseOperations(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 5,
      baseDelayMs: 100,
      maxDelayMs: 5000,
      backoffMultiplier: 1.5,
      jitterMs: 100,
      retryCondition: (error) => {
        // Retry on connection errors, timeouts, or deadlocks
        const message = error.message?.toLowerCase() || '';
        return message.includes('connection') ||
               message.includes('timeout') ||
               message.includes('deadlock') ||
               message.includes('lock wait timeout');
      }
    });
  }

  static forExternalAPI(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 4,
      baseDelayMs: 2000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      jitterMs: 1000,
      retryCondition: (error, attempt) => {
        // Don't retry client errors (4xx) except 429 (rate limit)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          return error.response.status === 429;
        }
        // Retry server errors (5xx) and network errors
        return !error.response || error.response.status >= 500;
      }
    });
  }

  static forFileOperations(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 3,
      baseDelayMs: 500,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
      retryCondition: (error) => {
        const code = error.code || '';
        // Retry on file system temporary errors
        return code === 'EBUSY' ||
               code === 'EAGAIN' ||
               code === 'EMFILE' ||
               code === 'ENFILE' ||
               code === 'ENOTEMPTY';
      }
    });
  }
}

export default RetryPolicy;