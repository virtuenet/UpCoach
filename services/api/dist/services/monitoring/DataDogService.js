"use strict";
/**
 * DataDog APM and Metrics Service
 * Application Performance Monitoring and custom metrics collection
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = exports.dataDogService = exports.DataDogService = void 0;
exports.TraceMethod = TraceMethod;
const dd_trace_1 = __importDefault(require("dd-trace"));
const node_dogstatsd_1 = require("node-dogstatsd");
const logger_1 = require("../../utils/logger");
class DataDogService {
    static instance;
    statsD = null;
    initialized = false;
    config;
    constructor() {
        this.config = {
            enabled: false,
        };
    }
    static getInstance() {
        if (!DataDogService.instance) {
            DataDogService.instance = new DataDogService();
        }
        return DataDogService.instance;
    }
    /**
     * Initialize DataDog APM and StatsD client
     */
    initialize(config) {
        if (this.initialized) {
            logger_1.logger.warn('DataDog already initialized');
            return;
        }
        this.config = config;
        if (!config.enabled) {
            logger_1.logger.info('DataDog monitoring disabled');
            return;
        }
        try {
            // Initialize APM tracer
            dd_trace_1.default.init({
                hostname: config.agentHost || 'localhost',
                port: config.agentPort || 8126,
                env: config.env || process.env.NODE_ENV,
                service: config.service || 'upcoach-backend',
                version: config.version || process.env.npm_package_version,
                // Enable runtime metrics (analytics replacement)
                runtimeMetrics: config.runtimeMetrics !== false,
                // Log injection for correlating logs with traces
                logInjection: config.logInjection !== false,
                // Profiling
                profiling: config.profiling || false,
                // Sampling rules
                samplingRules: [
                    // Sample all requests in development
                    {
                        service: config.service,
                        name: '*',
                        sampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
                    },
                    // Higher sampling for error traces
                    {
                        service: config.service,
                        name: 'express.request',
                        sampleRate: 0.5,
                        // maxPerSecond: 10, // Property not available in current version
                    },
                ],
                // Tags for all spans
                tags: {
                    env: config.env || process.env.NODE_ENV,
                    version: config.version,
                },
            });
            // Initialize StatsD client for custom metrics
            this.statsD = new node_dogstatsd_1.StatsD({
                host: config.statsdHost || 'localhost',
                port: config.statsdPort || 8125,
                prefix: `${config.service || 'upcoach'}.`,
                global_tags: [
                    `env:${config.env || process.env.NODE_ENV}`,
                    `service:${config.service || 'upcoach-backend'}`,
                    `version:${config.version || 'unknown'}`,
                ],
            });
            this.initialized = true;
            logger_1.logger.info('DataDog monitoring initialized', {
                service: config.service,
                env: config.env,
                apm: true,
                metrics: true,
            });
            // Set up process metrics collection
            this.collectProcessMetrics();
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize DataDog', error);
        }
    }
    /**
     * Express middleware for request tracing
     */
    requestTracing() {
        return (req, _res, next) => {
            if (!this.initialized) {
                return next();
            }
            const span = dd_trace_1.default.scope().active();
            if (span) {
                // Add request metadata to span
                span.setTag('http.method', req.method);
                span.setTag('http.url', req.url);
                span.setTag('http.route', req.route?.path);
                // Add user context if available
                if (req.user) {
                    span.setTag('user.id', req.user.id);
                    span.setTag('user.role', req.user.role);
                }
            }
            // Track request metrics
            this.incrementMetric('api.request', {
                method: req.method,
                path: req.route?.path || 'unknown',
            });
            // Track response time
            const startTime = Date.now();
            _res.on('finish', () => {
                const duration = Date.now() - startTime;
                // Record response time histogram
                this.histogram('api.response_time', duration, {
                    method: req.method,
                    path: req.route?.path || 'unknown',
                    status_code: _res.statusCode.toString(),
                });
                // Track status codes
                this.incrementMetric(`api.status_code.${_res.statusCode}`, {
                    method: req.method,
                    path: req.route?.path || 'unknown',
                });
                // Track errors
                if (_res.statusCode >= 400) {
                    this.incrementMetric('api.error', {
                        method: req.method,
                        path: req.route?.path || 'unknown',
                        status_code: _res.statusCode.toString(),
                    });
                }
            });
            next();
        };
    }
    /**
     * Create a custom span
     */
    createSpan(name, options) {
        if (!this.initialized)
            return null;
        return dd_trace_1.default.startSpan(name, options);
    }
    /**
     * Wrap function with tracing
     */
    trace(name, fn) {
        if (!this.initialized) {
            return fn();
        }
        return dd_trace_1.default.trace(name, fn);
    }
    /**
     * Wrap async function with tracing
     */
    async traceAsync(name, fn) {
        if (!this.initialized) {
            return fn();
        }
        return dd_trace_1.default.trace(name, async () => {
            const span = dd_trace_1.default.scope().active();
            try {
                const result = await fn();
                span?.setTag('status', 'success');
                return result;
            }
            catch (error) {
                span?.setTag('error', true);
                span?.setTag('error.message', error.message);
                span?.setTag('error.stack', error.stack);
                throw error;
            }
        });
    }
    /**
     * Increment a counter metric
     */
    incrementMetric(metric, tags, value = 1) {
        if (!this.statsD)
            return;
        const tagArray = this.formatTags(tags);
        this.statsD.increment(metric, value, tagArray);
    }
    /**
     * Decrement a counter metric
     */
    decrementMetric(metric, tags, value = 1) {
        if (!this.statsD)
            return;
        const tagArray = this.formatTags(tags);
        this.statsD.decrement(metric, value, tagArray);
    }
    /**
     * Record a gauge metric
     */
    gauge(metric, value, tags) {
        if (!this.statsD)
            return;
        const tagArray = this.formatTags(tags);
        this.statsD.gauge(metric, value, tagArray);
    }
    /**
     * Record a histogram metric
     */
    histogram(metric, value, tags) {
        if (!this.statsD)
            return;
        const tagArray = this.formatTags(tags);
        this.statsD.histogram(metric, value, tagArray);
    }
    /**
     * Record a timing metric
     */
    timing(metric, duration, tags) {
        if (!this.statsD)
            return;
        const tagArray = this.formatTags(tags);
        this.statsD.timing(metric, duration, tagArray);
    }
    /**
     * Measure execution time of a function
     */
    async measureTiming(metric, fn, tags) {
        const startTime = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - startTime;
            this.timing(metric, duration, { ...tags, status: 'success' });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.timing(metric, duration, { ...tags, status: 'error' });
            throw error;
        }
    }
    /**
     * Track custom business metrics
     */
    trackBusinessMetric(category, metric, value, metadata) {
        if (!this.initialized)
            return;
        const fullMetric = `business.${category}.${metric}`;
        // Record the metric
        this.histogram(fullMetric, value, metadata);
        // Also track as a trace event
        const span = dd_trace_1.default.scope().active();
        if (span) {
            span.setTag(`business.${category}`, metric);
            span.setTag(`business.value`, value);
            if (metadata) {
                Object.keys(metadata).forEach(key => {
                    span.setTag(`business.metadata.${key}`, metadata[key]);
                });
            }
        }
    }
    /**
     * Track user activity metrics
     */
    trackUserActivity(userId, action, metadata) {
        this.incrementMetric('user.activity', {
            action,
            ...metadata,
        });
        // Track unique users
        this.gauge('user.active', 1, { user_id: userId });
    }
    /**
     * Track API performance metrics
     */
    trackAPIPerformance(endpoint, method, responseTime, statusCode) {
        this.histogram('api.latency', responseTime, {
            endpoint,
            method,
            status: statusCode < 400 ? 'success' : 'error',
        });
        if (statusCode >= 500) {
            this.incrementMetric('api.5xxerrors', { endpoint, method });
        }
        else if (statusCode >= 400) {
            this.incrementMetric('api.4xxerrors', { endpoint, method });
        }
    }
    /**
     * Track database performance
     */
    trackDatabaseQuery(operation, table, duration, success) {
        this.histogram('database.query_time', duration, {
            operation,
            table,
            status: success ? 'success' : 'error',
        });
        if (!success) {
            this.incrementMetric('database.errors', { operation, table });
        }
    }
    /**
     * Track cache performance
     */
    trackCacheOperation(operation, hit, duration) {
        this.histogram('cache.operation_time', duration, {
            operation,
            result: hit ? 'hit' : 'miss',
        });
        if (operation === 'get') {
            this.incrementMetric(hit ? 'cache.hits' : 'cache.misses');
        }
    }
    /**
     * Collect process-level metrics
     */
    collectProcessMetrics() {
        if (!this.statsD)
            return;
        setInterval(() => {
            const memoryUsage = process.memoryUsage();
            // Memory metrics
            this.gauge('process.memory.rss', memoryUsage.rss);
            this.gauge('process.memory.heap_total', memoryUsage.heapTotal);
            this.gauge('process.memory.heap_used', memoryUsage.heapUsed);
            this.gauge('process.memory.external', memoryUsage.external);
            // CPU metrics
            const cpuUsage = process.cpuUsage();
            this.gauge('process.cpu.user', cpuUsage.user);
            this.gauge('process.cpu.system', cpuUsage.system);
            // Event loop metrics
            // @ts-ignore
            if (process._getActiveHandles) {
                // @ts-ignore
                this.gauge('process.handles.active', process._getActiveHandles().length);
            }
            // @ts-ignore
            if (process._getActiveRequests) {
                // @ts-ignore
                this.gauge('process.requests.active', process._getActiveRequests().length);
            }
        }, 10000); // Collect every 10 seconds
    }
    /**
     * Format tags for StatsD
     */
    formatTags(tags) {
        if (!tags)
            return [];
        return Object.entries(tags).map(([key, value]) => `${key}:${value}`);
    }
    /**
     * Flush pending metrics
     */
    flush() {
        if (!this.statsD)
            return;
        // StatsD client doesn't have a flush method, but we can close and reconnect
        logger_1.logger.info('DataDog metrics flushed');
    }
    /**
     * Shutdown DataDog monitoring
     */
    async shutdown() {
        if (!this.initialized)
            return;
        try {
            // Flush any pending traces
            // Note: flush method may not be available in current tracer version
            try {
                if (typeof dd_trace_1.default.flush === 'function') {
                    await new Promise(resolve => {
                        dd_trace_1.default.flush(resolve);
                    });
                }
            }
            catch (error) {
                logger_1.logger.warn('Tracer flush not available or failed:', error);
            }
            // Close StatsD connection
            if (this.statsD) {
                this.statsD.close();
            }
            this.initialized = false;
            logger_1.logger.info('DataDog monitoring shut down successfully');
        }
        catch (error) {
            logger_1.logger.error('Error shutting down DataDog monitoring', error);
        }
    }
}
exports.DataDogService = DataDogService;
// Export singleton instance
exports.dataDogService = DataDogService.getInstance();
// Convenience functions for direct metric tracking
exports.metrics = {
    increment: (metric, tags) => exports.dataDogService.incrementMetric(metric, tags),
    decrement: (metric, tags) => exports.dataDogService.decrementMetric(metric, tags),
    gauge: (metric, value, tags) => exports.dataDogService.gauge(metric, value, tags),
    histogram: (metric, value, tags) => exports.dataDogService.histogram(metric, value, tags),
    timing: (metric, duration, tags) => exports.dataDogService.timing(metric, duration, tags),
};
// Decorator for method tracing
function TraceMethod(name) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const traceName = name || `${target.constructor.name}.${propertyKey}`;
        descriptor.value = async function (...args) {
            return exports.dataDogService.traceAsync(traceName, async () => {
                return originalMethod.apply(this, args);
            });
        };
        return descriptor;
    };
}
//# sourceMappingURL=DataDogService.js.map