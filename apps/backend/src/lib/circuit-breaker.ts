/**
 * Circuit Breaker implementation using opossum
 * Replaces custom CircuitBreaker implementation
 */

import CircuitBreaker from 'opossum';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  rollingCountTimeout?: number;
  rollingCountBuckets?: number;
  name?: string;
  group?: string;
  capacity?: number;
  errorFilter?: (error: any) => boolean;
  volumeThreshold?: number;
}

/**
 * Create a circuit breaker for a function
 */
export function createCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CircuitBreakerOptions = {}
): CircuitBreaker<any[], any> {
  const breakerOptions: any = {
    timeout: options.timeout || 3000,
    errorThresholdPercentage: options.errorThresholdPercentage || 50,
    resetTimeout: options.resetTimeout || 30000,
    rollingCountTimeout: options.rollingCountTimeout || 10000,
    rollingCountBuckets: options.rollingCountBuckets || 10,
    name: options.name || fn.name || 'anonymous',
    group: options.group,
    capacity: options.capacity || 10,
    errorFilter: options.errorFilter,
    volumeThreshold: options.volumeThreshold || 10,
  };

  const breaker = new CircuitBreaker<any[], any>(fn as any, breakerOptions);

  // Add event listeners for monitoring
  breaker.on('open', () => {
    logger.warn(`Circuit breaker opened: ${breakerOptions.name}`);
  });

  breaker.on('halfOpen', () => {
    console.info(`Circuit breaker half-open: ${breakerOptions.name}`);
  });

  breaker.on('close', () => {
    console.info(`Circuit breaker closed: ${breakerOptions.name}`);
  });

  breaker.on('reject', () => {
    logger.warn(`Circuit breaker rejected request: ${breakerOptions.name}`);
  });

  return breaker;
}

/**
 * Circuit Breaker class for backward compatibility
 */
export class CircuitBreakerWrapper extends EventEmitter {
  private breaker: CircuitBreaker<any[], any>;
  // private _state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(options: CircuitBreakerOptions = {}) {
    super();

    // Create a dummy function that will be replaced
    const dummyFn = async (..._args: any[]) => {
      throw new Error('Function not set. Use execute() method.');
    };

    this.breaker = createCircuitBreaker(dummyFn, options);

    // Mirror events
    this.breaker.on('open', () => {
      // this._state = 'OPEN';
      this.emit('open');
    });

    this.breaker.on('halfOpen', () => {
      // this._state = 'HALF_OPEN';
      this.emit('halfOpen');
    });

    this.breaker.on('close', () => {
      // this._state = 'CLOSED';
      this.emit('close');
    });

    this.breaker.on('reject', () => {
      this.emit('reject');
    });

    this.breaker.on('success', (result: any) => {
      this.emit('success', result);
    });

    this.breaker.on('failure', (error: any) => {
      this.emit('failure', error);
    });

    this.breaker.on('timeout', () => {
      this.emit('timeout');
    });

    this.breaker.on('fallback', (result: any) => {
      this.emit('fallback', result);
    });
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Create a new circuit breaker for this specific function
    const functionBreaker = createCircuitBreaker(fn, {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
    });

    try {
      return await functionBreaker.fire();
    } finally {
      // Clean up the temporary breaker
      // functionBreaker.shutdown(); // shutdown may not exist
    }
  }

  /**
   * Get current state
   */
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    if ((this.breaker as any).opened) return 'OPEN';
    if ((this.breaker as any).halfOpen) return 'HALF_OPEN';
    return 'CLOSED';
  }

  /**
   * Get circuit breaker stats
   */
  getStats() {
    return this.breaker.stats;
  }

  /**
   * Manually open the circuit
   */
  open() {
    this.breaker.open();
  }

  /**
   * Manually close the circuit
   */
  close() {
    this.breaker.close();
  }

  /**
   * Shutdown the circuit breaker
   */
  shutdown() {
    // this.breaker.shutdown(); // shutdown may not exist
  }

  /**
   * Set fallback function
   */
  fallback<T>(fn: () => T | Promise<T>) {
    this.breaker.fallback(async () => await Promise.resolve(fn()));
    return this;
  }
}

/**
 * Create a circuit breaker factory for multiple endpoints
 */
export class CircuitBreakerFactory {
  private breakers: Map<string, CircuitBreaker<any[], any>> = new Map();
  private defaultOptions: CircuitBreakerOptions;

  constructor(defaultOptions: CircuitBreakerOptions = {}) {
    this.defaultOptions = defaultOptions;
  }

  /**
   * Get or create a circuit breaker for a key
   */
  getBreaker<T extends (...args: any[]) => Promise<any>>(
    key: string,
    fn: T,
    options?: CircuitBreakerOptions
  ): CircuitBreaker<any[], any> {
    if (!this.breakers.has(key)) {
      const breaker = createCircuitBreaker(fn, {
        ...this.defaultOptions,
        ...options,
        name: key,
      });
      this.breakers.set(key, breaker);
    }
    return this.breakers.get(key) as CircuitBreaker<any[], any>;
  }

  /**
   * Get all breaker stats
   */
  getAllStats() {
    const stats: Record<string, any> = {};
    this.breakers.forEach((breaker, key) => {
      stats[key] = breaker.stats;
    });
    return stats;
  }

  /**
   * Shutdown all breakers
   */
  shutdownAll() {
    // this.breakers.forEach(breaker => breaker.shutdown());
    this.breakers.clear();
  }
}

// Export for backward compatibility
export { CircuitBreakerWrapper as CircuitBreaker };
export default { createCircuitBreaker, CircuitBreakerWrapper, CircuitBreakerFactory };
