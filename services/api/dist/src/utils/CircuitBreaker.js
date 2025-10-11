"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = void 0;
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (CircuitState = {}));
class CircuitBreaker {
    state = CircuitState.CLOSED;
    metrics = {
        failures: 0,
        successes: 0,
        requests: 0
    };
    options;
    nextAttempt = 0;
    constructor(options) {
        this.options = {
            monitoringPeriod: 60000,
            expectedErrors: [],
            ...options
        };
    }
    async execute(operation) {
        if (this.state === CircuitState.OPEN) {
            if (this.nextAttempt <= Date.now()) {
                this.state = CircuitState.HALF_OPEN;
            }
            else {
                throw new Error('Circuit breaker is OPEN');
            }
        }
        try {
            this.metrics.requests++;
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure(error);
            throw error;
        }
    }
    onSuccess() {
        this.metrics.failures = 0;
        this.metrics.successes++;
        this.metrics.lastSuccessTime = Date.now();
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.CLOSED;
        }
    }
    onFailure(error) {
        this.metrics.failures++;
        this.metrics.lastFailureTime = Date.now();
        const isExpectedError = this.options.expectedErrors.some(ErrorClass => error instanceof ErrorClass);
        if (!isExpectedError && this.metrics.failures >= this.options.failureThreshold) {
            this.state = CircuitState.OPEN;
            this.nextAttempt = Date.now() + this.options.resetTimeout;
        }
    }
    getState() {
        return this.state;
    }
    getMetrics() {
        return { ...this.metrics };
    }
    isOpen() {
        return this.state === CircuitState.OPEN;
    }
    isClosed() {
        return this.state === CircuitState.CLOSED;
    }
    isHalfOpen() {
        return this.state === CircuitState.HALF_OPEN;
    }
    reset() {
        this.state = CircuitState.CLOSED;
        this.metrics = {
            failures: 0,
            successes: 0,
            requests: 0
        };
        this.nextAttempt = 0;
    }
    forceOpen() {
        this.state = CircuitState.OPEN;
        this.nextAttempt = Date.now() + this.options.resetTimeout;
    }
    forceClose() {
        this.state = CircuitState.CLOSED;
        this.nextAttempt = 0;
    }
    getFailureRate() {
        if (this.metrics.requests === 0)
            return 0;
        return (this.metrics.failures / this.metrics.requests) * 100;
    }
    getSuccessRate() {
        if (this.metrics.requests === 0)
            return 0;
        return (this.metrics.successes / this.metrics.requests) * 100;
    }
}
exports.CircuitBreaker = CircuitBreaker;
exports.default = CircuitBreaker;
//# sourceMappingURL=CircuitBreaker.js.map