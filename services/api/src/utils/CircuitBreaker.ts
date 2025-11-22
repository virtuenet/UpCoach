/**
 * Circuit Breaker Pattern Implementation
 * Provides fault tolerance for external service calls
 */

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod?: number;
  expectedErrors?: Array<new (...args: unknown[]) => Error>;
}

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

interface CircuitMetrics {
  failures: number;
  successes: number;
  requests: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private metrics: CircuitMetrics = {
    failures: 0,
    successes: 0,
    requests: 0
  };
  private options: Required<CircuitBreakerOptions>;
  private nextAttempt: number = 0;

  constructor(options: CircuitBreakerOptions) {
    this.options = {
      monitoringPeriod: 60000, // 1 minute default
      expectedErrors: [],
      ...options
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.nextAttempt <= Date.now()) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      this.metrics.requests++;
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.metrics.failures = 0;
    this.metrics.successes++;
    this.metrics.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
    }
  }

  private onFailure(error: unknown): void {
    this.metrics.failures++;
    this.metrics.lastFailureTime = Date.now();

    const isExpectedError = this.options.expectedErrors.some(
      ErrorClass => error instanceof ErrorClass
    );

    if (!isExpectedError && this.metrics.failures >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getMetrics(): Readonly<CircuitMetrics> {
    return { ...this.metrics };
  }

  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }

  isClosed(): boolean {
    return this.state === CircuitState.CLOSED;
  }

  isHalfOpen(): boolean {
    return this.state === CircuitState.HALF_OPEN;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.metrics = {
      failures: 0,
      successes: 0,
      requests: 0
    };
    this.nextAttempt = 0;
  }

  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.options.resetTimeout;
  }

  forceClose(): void {
    this.state = CircuitState.CLOSED;
    this.nextAttempt = 0;
  }

  // Get failure rate as a percentage
  getFailureRate(): number {
    if (this.metrics.requests === 0) return 0;
    return (this.metrics.failures / this.metrics.requests) * 100;
  }

  // Get success rate as a percentage
  getSuccessRate(): number {
    if (this.metrics.requests === 0) return 0;
    return (this.metrics.successes / this.metrics.requests) * 100;
  }
}

export default CircuitBreaker;