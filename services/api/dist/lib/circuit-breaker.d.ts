import CircuitBreaker from 'opossum';
import { EventEmitter } from 'events';
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
export declare function createCircuitBreaker<T extends (...args: any[]) => Promise<any>>(fn: T, options?: CircuitBreakerOptions): CircuitBreaker<any[], any>;
export declare class CircuitBreakerWrapper extends EventEmitter {
    private breaker;
    constructor(options?: CircuitBreakerOptions);
    execute<T>(fn: () => Promise<T>): Promise<T>;
    getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    getStats(): any;
    open(): void;
    close(): void;
    shutdown(): void;
    fallback<T>(fn: () => T | Promise<T>): this;
}
export declare class CircuitBreakerFactory {
    private breakers;
    private defaultOptions;
    constructor(defaultOptions?: CircuitBreakerOptions);
    getBreaker<T extends (...args: any[]) => Promise<any>>(key: string, fn: T, options?: CircuitBreakerOptions): CircuitBreaker<any[], any>;
    getAllStats(): Record<string, any>;
    shutdownAll(): void;
}
export { CircuitBreakerWrapper as CircuitBreaker };
declare const _default: {
    createCircuitBreaker: typeof createCircuitBreaker;
    CircuitBreakerWrapper: typeof CircuitBreakerWrapper;
    CircuitBreakerFactory: typeof CircuitBreakerFactory;
};
export default _default;
//# sourceMappingURL=circuit-breaker.d.ts.map