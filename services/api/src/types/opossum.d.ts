declare module 'opossum' {
  interface CircuitBreakerOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    rollingCountTimeout?: number;
    rollingCountBuckets?: number;
    name?: string;
    group?: string;
    rollingPercentilesEnabled?: boolean;
    capacity?: number;
    errorFilter?: (error: unknown) => boolean;
    enabled?: boolean;
  }

  class CircuitBreaker<TI extends unknown[], TR> {
    constructor(action: (...args: TI) => Promise<TR>, options?: CircuitBreakerOptions);
    fire(...args: TI): Promise<TR>;
    fallback(fallbackFunction: (...args: TI) => Promise<TR>): this;
    on(event: string, handler: Function): this;
    open(): void;
    close(): void;
    halfOpen(): void;
    stats: unknown;
    enabled: boolean;
    name: string;
    group: string;
    isOpen(): boolean;
  }

  export = CircuitBreaker;
}
