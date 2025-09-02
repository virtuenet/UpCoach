/**
 * Circuit Breaker implementation using opossum
 * Replaces custom CircuitBreaker implementation
 */
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
/**
 * Create a circuit breaker for a function
 */
export declare function createCircuitBreaker<T extends (...args: any[]) => Promise<any>>(fn: T, options?: CircuitBreakerOptions): CircuitBreaker<any[], any>;
/**
 * Circuit Breaker class for backward compatibility
 */
export declare class CircuitBreakerWrapper extends EventEmitter {
    private breaker;
    constructor(options?: CircuitBreakerOptions);
    /**
     * Execute a function with circuit breaker protection
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Get current state
     */
    getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    /**
     * Get circuit breaker stats
     */
    getStats(): any;
    /**
     * Manually open the circuit
     */
    open(): void;
    /**
     * Manually close the circuit
     */
    close(): void;
    /**
     * Shutdown the circuit breaker
     */
    shutdown(): void;
    /**
     * Set fallback function
     */
    fallback<T>(fn: () => T | Promise<T>): this;
}
/**
 * Create a circuit breaker factory for multiple endpoints
 */
export declare class CircuitBreakerFactory {
    private breakers;
    private defaultOptions;
    constructor(defaultOptions?: CircuitBreakerOptions);
    /**
     * Get or create a circuit breaker for a key
     */
    getBreaker<T extends (...args: any[]) => Promise<any>>(key: string, fn: T, options?: CircuitBreakerOptions): CircuitBreaker<any[], any>;
    /**
     * Get all breaker stats
     */
    getAllStats(): Record<string, any>;
    /**
     * Shutdown all breakers
     */
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