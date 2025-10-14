"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = exports.dataDogService = exports.DataDogService = void 0;
exports.TraceMethod = TraceMethod;
const tslib_1 = require("tslib");
const dd_trace_1 = tslib_1.__importDefault(require("dd-trace"));
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
            dd_trace_1.default.init({
                hostname: config.agentHost || 'localhost',
                port: config.agentPort || 8126,
                env: config.env || process.env.NODE_ENV,
                service: config.service || 'upcoach-backend',
                version: config.version || process.env.npm_package_version,
                runtimeMetrics: config.runtimeMetrics !== false,
                logInjection: config.logInjection !== false,
                profiling: config.profiling || false,
                samplingRules: [
                    {
                        service: config.service,
                        name: '*',
                        sampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
                    },
                    {
                        service: config.service,
                        name: 'express.request',
                        sampleRate: 0.5,
                    },
                ],
                tags: {
                    env: config.env || process.env.NODE_ENV,
                    version: config.version,
                },
            });
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
            this.collectProcessMetrics();
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize DataDog', error);
        }
    }
    requestTracing() {
        return (req, _res, next) => {
            if (!this.initialized) {
                return next();
            }
            const span = dd_trace_1.default.scope().active();
            if (span) {
                span.setTag('http.method', req.method);
                span.setTag('http.url', req.url);
                span.setTag('http.route', req.route?.path);
                if (req.user) {
                    span.setTag('user.id', req.user.id);
                    span.setTag('user.role', req.user.role);
                }
            }
            this.incrementMetric('api.request', {
                method: req.method,
                path: req.route?.path || 'unknown',
            });
            const startTime = Date.now();
            _res.on('finish', () => {
                const duration = Date.now() - startTime;
                this.histogram('api.response_time', duration, {
                    method: req.method,
                    path: req.route?.path || 'unknown',
                    status_code: _res.statusCode.toString(),
                });
                this.incrementMetric(`api.status_code.${_res.statusCode}`, {
                    method: req.method,
                    path: req.route?.path || 'unknown',
                });
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
    createSpan(name, options) {
        if (!this.initialized)
            return null;
        return dd_trace_1.default.startSpan(name, options);
    }
    trace(name, fn) {
        if (!this.initialized) {
            return fn();
        }
        return dd_trace_1.default.trace(name, fn);
    }
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
    incrementMetric(metric, valueOrTags, tags) {
        if (!this.statsD)
            return;
        let value = 1;
        let finalTags;
        if (typeof valueOrTags === 'number') {
            value = valueOrTags;
            finalTags = tags;
        }
        else {
            finalTags = valueOrTags;
        }
        const tagArray = this.formatTags(finalTags);
        this.statsD.increment(metric, value, tagArray);
    }
    decrementMetric(metric, valueOrTags, tags) {
        if (!this.statsD)
            return;
        let value = 1;
        let finalTags;
        if (typeof valueOrTags === 'number') {
            value = valueOrTags;
            finalTags = tags;
        }
        else {
            finalTags = valueOrTags;
        }
        const tagArray = this.formatTags(finalTags);
        this.statsD.decrement(metric, value, tagArray);
    }
    gauge(metric, value, tags) {
        if (!this.statsD)
            return;
        const tagArray = this.formatTags(tags);
        this.statsD.gauge(metric, value, tagArray);
    }
    histogram(metric, value, tags) {
        if (!this.statsD)
            return;
        const tagArray = this.formatTags(tags);
        this.statsD.histogram(metric, value, tagArray);
    }
    timing(metric, duration, tags) {
        if (!this.statsD)
            return;
        const tagArray = this.formatTags(tags);
        this.statsD.timing(metric, duration, tagArray);
    }
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
    trackBusinessMetric(category, metric, value, metadata) {
        if (!this.initialized)
            return;
        const fullMetric = `business.${category}.${metric}`;
        this.histogram(fullMetric, value, metadata);
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
    trackUserActivity(userId, action, metadata) {
        this.incrementMetric('user.activity', {
            action,
            ...metadata,
        });
        this.gauge('user.active', 1, { user_id: userId });
    }
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
    trackCacheOperation(operation, hit, duration) {
        this.histogram('cache.operation_time', duration, {
            operation,
            result: hit ? 'hit' : 'miss',
        });
        if (operation === 'get') {
            this.incrementMetric(hit ? 'cache.hits' : 'cache.misses');
        }
    }
    collectProcessMetrics() {
        if (!this.statsD)
            return;
        setInterval(() => {
            const memoryUsage = process.memoryUsage();
            this.gauge('process.memory.rss', memoryUsage.rss);
            this.gauge('process.memory.heap_total', memoryUsage.heapTotal);
            this.gauge('process.memory.heap_used', memoryUsage.heapUsed);
            this.gauge('process.memory.external', memoryUsage.external);
            const cpuUsage = process.cpuUsage();
            this.gauge('process.cpu.user', cpuUsage.user);
            this.gauge('process.cpu.system', cpuUsage.system);
            if (process._getActiveHandles) {
                this.gauge('process.handles.active', process._getActiveHandles().length);
            }
            if (process._getActiveRequests) {
                this.gauge('process.requests.active', process._getActiveRequests().length);
            }
        }, 10000);
    }
    formatTags(tags) {
        if (!tags)
            return [];
        return Object.entries(tags).map(([key, value]) => `${key}:${value}`);
    }
    flush() {
        if (!this.statsD)
            return;
        logger_1.logger.info('DataDog metrics flushed');
    }
    async shutdown() {
        if (!this.initialized)
            return;
        try {
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
exports.dataDogService = DataDogService.getInstance();
exports.metrics = {
    increment: (metric, tags) => exports.dataDogService.incrementMetric(metric, tags),
    decrement: (metric, tags) => exports.dataDogService.decrementMetric(metric, tags),
    gauge: (metric, value, tags) => exports.dataDogService.gauge(metric, value, tags),
    histogram: (metric, value, tags) => exports.dataDogService.histogram(metric, value, tags),
    timing: (metric, duration, tags) => exports.dataDogService.timing(metric, duration, tags),
};
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
