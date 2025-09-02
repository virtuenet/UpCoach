/**
 * Circuit Breaker pattern implementation for AI services
 * Prevents cascading failures and provides graceful degradation
 */
export declare enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetTimeout: number;
    monitoringPeriod: number;
    halfOpenRetries: number;
}
export declare class CircuitBreaker {
    private options;
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime;
    private monitoringStart;
    private halfOpenAttempts;
    constructor(options?: CircuitBreakerOptions);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    private shouldAttemptReset;
    private reset;
    getState(): CircuitState;
    getStats(): {
        state: CircuitState;
        failureCount: number;
        successCount: number;
        lastFailureTime: number;
    };
}
//# sourceMappingURL=CircuitBreaker.d.ts.map