"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.CircuitBreakerFactory = exports.CircuitBreakerWrapper = void 0;
exports.createCircuitBreaker = createCircuitBreaker;
const tslib_1 = require("tslib");
const events_1 = require("events");
const opossum_1 = tslib_1.__importDefault(require("opossum"));
const logger_1 = require("../utils/logger");
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
    breaker.on('open', () => {
        logger_1.logger.warn(`Circuit breaker opened: ${breakerOptions.name}`);
    });
    breaker.on('halfOpen', () => {
        if (process.env.NODE_ENV === 'development') {
            console.info(`Circuit breaker half-open: ${breakerOptions.name}`);
        }
    });
    breaker.on('close', () => {
        if (process.env.NODE_ENV === 'development') {
            console.info(`Circuit breaker closed: ${breakerOptions.name}`);
        }
    });
    breaker.on('reject', () => {
        logger_1.logger.warn(`Circuit breaker rejected request: ${breakerOptions.name}`);
    });
    return breaker;
}
class CircuitBreakerWrapper extends events_1.EventEmitter {
    breaker;
    constructor(options = {}) {
        super();
        const dummyFn = async (..._args) => {
            throw new Error('Function not set. Use execute() method.');
        };
        this.breaker = createCircuitBreaker(dummyFn, options);
        this.breaker.on('open', () => {
            this.emit('open');
        });
        this.breaker.on('halfOpen', () => {
            this.emit('halfOpen');
        });
        this.breaker.on('close', () => {
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
    async execute(fn) {
        const functionBreaker = createCircuitBreaker(fn, {
            timeout: 3000,
            errorThresholdPercentage: 50,
            resetTimeout: 30000,
        });
        try {
            return await functionBreaker.fire();
        }
        finally {
        }
    }
    getState() {
        if (this.breaker.opened)
            return 'OPEN';
        if (this.breaker.halfOpen)
            return 'HALF_OPEN';
        return 'CLOSED';
    }
    getStats() {
        return this.breaker.stats;
    }
    open() {
        this.breaker.open();
    }
    close() {
        this.breaker.close();
    }
    shutdown() {
    }
    fallback(fn) {
        this.breaker.fallback(async () => await Promise.resolve(fn()));
        return this;
    }
}
exports.CircuitBreakerWrapper = CircuitBreakerWrapper;
exports.CircuitBreaker = CircuitBreakerWrapper;
class CircuitBreakerFactory {
    breakers = new Map();
    defaultOptions;
    constructor(defaultOptions = {}) {
        this.defaultOptions = defaultOptions;
    }
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
    getAllStats() {
        const stats = {};
        this.breakers.forEach((breaker, key) => {
            stats[key] = breaker.stats;
        });
        return stats;
    }
    shutdownAll() {
        this.breakers.clear();
    }
}
exports.CircuitBreakerFactory = CircuitBreakerFactory;
exports.default = { createCircuitBreaker, CircuitBreakerWrapper, CircuitBreakerFactory };
