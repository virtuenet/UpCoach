/**
 * Retry mechanism for AI service calls with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

export class RetryMechanism {
  private readonly defaultOptions: Required<RetryOptions> = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    factor: 2,
    onRetry: () => {},
  };

  async execute<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T> {
    const config = { ...this.defaultOptions, ...options };
    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === config.maxRetries) {
          throw lastError;
        }

        // Check if error is retryable
        if (!this.isRetryableError(lastError)) {
          throw lastError;
        }

        const delay = this.calculateDelay(attempt, config);
        config.onRetry(lastError, attempt + 1);

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private isRetryableError(error: Error): boolean {
    // Network errors
    if (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND')
    ) {
      return true;
    }

    // HTTP status codes that are retryable
    const retryableStatusCodes = [429, 500, 502, 503, 504];
    if ('status' in error && typeof error.status === 'number') {
      return retryableStatusCodes.includes(error.status);
    }

    // Rate limiting errors
    if (error.message.toLowerCase().includes('rate limit')) {
      return true;
    }

    // Temporary failures
    if (
      error.message.toLowerCase().includes('temporary') ||
      error.message.toLowerCase().includes('timeout')
    ) {
      return true;
    }

    return false;
  }

  private calculateDelay(attempt: number, config: Required<RetryOptions>): number {
    const exponentialDelay = config.initialDelay * Math.pow(config.factor, attempt);
    const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add jitter
    return Math.min(jitteredDelay, config.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a retryable version of an async function
   */
  wrap<T extends (...args: unknown[]) => Promise<unknown>>(fn: T, options?: RetryOptions): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return this.execute(() => fn(...args), options);
    }) as T;
  }
}

// Singleton instance
export const retry = new RetryMechanism();
