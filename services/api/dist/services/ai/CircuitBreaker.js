"use strict";
/**
 * Circuit Breaker pattern implementation for AI services
 * Prevents cascading failures and provides graceful degradation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.CircuitState = void 0;
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
class CircuitBreaker {
    options;
    state = CircuitState.CLOSED;
    failureCount = 0;
    successCount = 0;
    lastFailureTime = null;
    monitoringStart = Date.now();
    halfOpenAttempts = 0;
    constructor(options = {
        failureThreshold: 5,
        resetTimeout: 60000, // 1 minute
        monitoringPeriod: 60000, // 1 minute
        halfOpenRetries: 3,
    }) {
        this.options = options;
    }
    async execute(operation) {
        if (this.state === CircuitState.OPEN) {
            if (this.shouldAttemptReset()) {
                this.state = CircuitState.HALF_OPEN;
                this.halfOpenAttempts = 0;
            }
            else {
                throw new Error('Circuit breaker is open - service unavailable');
            }
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failureCount = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.options.halfOpenRetries) {
                this.state = CircuitState.CLOSED;
                this.reset();
            }
        }
    }
    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
            this.halfOpenAttempts = 0;
        }
        else if (this.failureCount >= this.options.failureThreshold) {
            this.state = CircuitState.OPEN;
        }
    }
    shouldAttemptReset() {
        return (this.lastFailureTime !== null &&
            Date.now() - this.lastFailureTime >= this.options.resetTimeout);
    }
    reset() {
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.monitoringStart = Date.now();
    }
    getState() {
        return this.state;
    }
    getStats() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime,
        };
    }
}
exports.CircuitBreaker = CircuitBreaker;
//# sourceMappingURL=CircuitBreaker.js.map