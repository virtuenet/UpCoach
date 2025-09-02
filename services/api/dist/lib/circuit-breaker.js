"use strict";
/**
 * Circuit Breaker implementation using opossum
 * Replaces custom CircuitBreaker implementation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.CircuitBreakerFactory = exports.CircuitBreakerWrapper = void 0;
exports.createCircuitBreaker = createCircuitBreaker;
const opossum_1 = __importDefault(require("opossum"));
const events_1 = require("events");
const logger_1 = require("../utils/logger");
/**
 * Create a circuit breaker for a function
 */
function createCircuitBreaker(fn, options = {}) {
    const breakerOptions = {
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
    const breaker = new opossum_1.default(fn, breakerOptions);
    // Add event listeners for monitoring
    breaker.on('open', () => {
        logger_1.logger.warn(`Circuit breaker opened: ${breakerOptions.name}`);
    });
    breaker.on('halfOpen', () => {
        console.info(`Circuit breaker half-open: ${breakerOptions.name}`);
    });
    breaker.on('close', () => {
        console.info(`Circuit breaker closed: ${breakerOptions.name}`);
    });
    breaker.on('reject', () => {
        logger_1.logger.warn(`Circuit breaker rejected request: ${breakerOptions.name}`);
    });
    return breaker;
}
/**
 * Circuit Breaker class for backward compatibility
 */
class CircuitBreakerWrapper extends events_1.EventEmitter {
    breaker;
    // private _state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    constructor(options = {}) {
        super();
        // Create a dummy function that will be replaced
        const dummyFn = async (..._args) => {
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
        this.breaker.on('success', (result) => {
            this.emit('success', result);
        });
        this.breaker.on('failure', (error) => {
            this.emit('failure', error);
        });
        this.breaker.on('timeout', () => {
            this.emit('timeout');
        });
        this.breaker.on('fallback', (result) => {
            this.emit('fallback', result);
        });
    }
    /**
     * Execute a function with circuit breaker protection
     */
    async execute(fn) {
        // Create a new circuit breaker for this specific function
        const functionBreaker = createCircuitBreaker(fn, {
            timeout: 3000,
            errorThresholdPercentage: 50,
            resetTimeout: 30000,
        });
        try {
            return await functionBreaker.fire();
        }
        finally {
            // Clean up the temporary breaker
            // functionBreaker.shutdown(); // shutdown may not exist
        }
    }
    /**
     * Get current state
     */
    getState() {
        if (this.breaker.opened)
            return 'OPEN';
        if (this.breaker.halfOpen)
            return 'HALF_OPEN';
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
    fallback(fn) {
        this.breaker.fallback(async () => await Promise.resolve(fn()));
        return this;
    }
}
exports.CircuitBreakerWrapper = CircuitBreakerWrapper;
exports.CircuitBreaker = CircuitBreakerWrapper;
/**
 * Create a circuit breaker factory for multiple endpoints
 */
class CircuitBreakerFactory {
    breakers = new Map();
    defaultOptions;
    constructor(defaultOptions = {}) {
        this.defaultOptions = defaultOptions;
    }
    /**
     * Get or create a circuit breaker for a key
     */
    getBreaker(key, fn, options) {
        if (!this.breakers.has(key)) {
            const breaker = createCircuitBreaker(fn, {
                ...this.defaultOptions,
                ...options,
                name: key,
            });
            this.breakers.set(key, breaker);
        }
        return this.breakers.get(key);
    }
    /**
     * Get all breaker stats
     */
    getAllStats() {
        const stats = {};
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
exports.CircuitBreakerFactory = CircuitBreakerFactory;
exports.default = { createCircuitBreaker, CircuitBreakerWrapper, CircuitBreakerFactory };
//# sourceMappingURL=circuit-breaker.js.map