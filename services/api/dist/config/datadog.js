"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.datadogService = exports.DataDogService = void 0;
const dd_trace_1 = __importDefault(require("dd-trace"));
const node_dogstatsd_1 = require("node-dogstatsd");
const winston_1 = __importDefault(require("winston"));
class DataDogService {
    static instance;
    config;
    statsD;
    logger;
    metricsBuffer = new Map();
    flushInterval = null;
    constructor() {
        this.config = {
            enabled: process.env.DD_ENABLED === 'true',
            apiKey: process.env.DD_API_KEY || '',
            appKey: process.env.DD_APP_KEY || '',
            service: process.env.DD_SERVICE || 'upcoach-api',
            env: process.env.DD_ENV || process.env.NODE_ENV || 'development',
            version: process.env.DD_VERSION || process.env.APP_VERSION || '1.0.0',
            hostname: process.env.DD_AGENT_HOST || 'localhost',
            port: parseInt(process.env.DD_AGENT_PORT || '8125'),
            logLevel: process.env.DD_LOG_LEVEL || 'info',
            runtimeMetrics: process.env.DD_RUNTIME_METRICS === 'true',
            profiling: process.env.DD_PROFILING_ENABLED === 'true',
        };
        // Initialize StatsD client
        this.statsD = new node_dogstatsd_1.StatsD({
            host: this.config.hostname,
            port: this.config.port,
            prefix: `${this.config.service}.`,
            globalTags: [
                `env:${this.config.env}`,
                `version:${this.config.version}`,
                `service:${this.config.service}`,
            ],
        });
        // Initialize logger
        this.logger = winston_1.default.createLogger({
            level: this.config.logLevel,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
            defaultMeta: {
                service: this.config.service,
                env: this.config.env,
                version: this.config.version,
            },
            transports: [
                new winston_1.default.transports.Console({
                    format: winston_1.default.format.simple(),
                }),
            ],
        });
    }
    static getInstance() {
        if (!DataDogService.instance) {
            DataDogService.instance = new DataDogService();
        }
        return DataDogService.instance;
    }
    initialize() {
        if (!this.config.enabled) {
            console.log('DataDog is disabled');
            return;
        }
        // Initialize APM tracer
        dd_trace_1.default.init({
            enabled: this.config.enabled,
            service: this.config.service,
            env: this.config.env,
            version: this.config.version,
            hostname: this.config.hostname,
            port: 8126, // APM port
            logInjection: true,
            analytics: true,
            runtimeMetrics: this.config.runtimeMetrics,
            profiling: this.config.profiling,
            // Sampling rules
            samplingRules: [
                { service: this.config.service, name: 'health.check', sampleRate: 0.01 },
                { service: this.config.service, name: 'api.auth.*', sampleRate: 0.5 },
                { service: this.config.service, name: 'api.financial.*', sampleRate: 0.5 },
                { service: this.config.service, sampleRate: 0.1 },
            ],
            // Tags for all spans
            tags: {
                'service.name': this.config.service,
                'deployment.environment': this.config.env,
                'version': this.config.version,
            },
        });
        // Start metrics flush interval
        this.startMetricsFlush();
        // Log system metrics periodically
        this.startSystemMetrics();
        console.log('DataDog APM and metrics initialized');
    }
    // Metrics methods
    increment(metric, value = 1, tags) {
        if (!this.config.enabled)
            return;
        this.statsD.increment(metric, value, tags);
    }
    decrement(metric, value = 1, tags) {
        if (!this.config.enabled)
            return;
        this.statsD.decrement(metric, value, tags);
    }
    gauge(metric, value, tags) {
        if (!this.config.enabled)
            return;
        this.statsD.gauge(metric, value, tags);
    }
    histogram(metric, value, tags) {
        if (!this.config.enabled)
            return;
        this.statsD.histogram(metric, value, tags);
    }
    timing(metric, duration, tags) {
        if (!this.config.enabled)
            return;
        this.statsD.timing(metric, duration, tags);
    }
    distribution(metric, value, tags) {
        if (!this.config.enabled)
            return;
        this.statsD.distribution(metric, value, tags);
    }
    // Helper method to track async operations
    async trackTiming(metric, operation, tags) {
        const startTime = Date.now();
        try {
            const result = await operation();
            this.timing(metric, Date.now() - startTime, [...(tags || []), 'status:success']);
            return result;
        }
        catch (error) {
            this.timing(metric, Date.now() - startTime, [...(tags || []), 'status:error']);
            throw error;
        }
    }
    // Business metrics
    trackUserAction(action, userId, metadata) {
        this.increment('user.action', 1, [
            `action:${action}`,
            `user_id:${userId}`,
        ]);
        if (metadata) {
            this.logger.info('User action tracked', {
                action,
                userId,
                metadata,
            });
        }
    }
    trackRevenue(amount, currency, type) {
        this.histogram('revenue.amount', amount, [
            `currency:${currency}`,
            `type:${type}`,
        ]);
        this.increment('revenue.transaction', 1, [
            `currency:${currency}`,
            `type:${type}`,
        ]);
    }
    trackApiCall(endpoint, method, statusCode, duration) {
        const tags = [
            `endpoint:${endpoint}`,
            `method:${method}`,
            `status:${statusCode}`,
            `status_category:${Math.floor(statusCode / 100)}xx`,
        ];
        this.timing('api.request.duration', duration, tags);
        this.increment('api.request.count', 1, tags);
        if (statusCode >= 400) {
            this.increment('api.request.error', 1, tags);
        }
    }
    trackDatabaseQuery(operation, table, duration, success) {
        const tags = [
            `operation:${operation}`,
            `table:${table}`,
            `status:${success ? 'success' : 'error'}`,
        ];
        this.timing('db.query.duration', duration, tags);
        this.increment('db.query.count', 1, tags);
        if (!success) {
            this.increment('db.query.error', 1, tags);
        }
    }
    trackCacheOperation(operation, hit, duration) {
        const tags = [
            `operation:${operation}`,
            `hit:${hit}`,
        ];
        this.timing('cache.operation.duration', duration, tags);
        this.increment('cache.operation.count', 1, tags);
        if (hit) {
            this.increment('cache.hit', 1, tags);
        }
        else {
            this.increment('cache.miss', 1, tags);
        }
    }
    trackQueueMetrics(queueName, size, processingTime) {
        this.gauge('queue.size', size, [`queue:${queueName}`]);
        if (processingTime !== undefined) {
            this.timing('queue.processing_time', processingTime, [`queue:${queueName}`]);
        }
    }
    // Performance metrics
    trackMemoryUsage() {
        const memUsage = process.memoryUsage();
        this.gauge('memory.rss', memUsage.rss);
        this.gauge('memory.heap_total', memUsage.heapTotal);
        this.gauge('memory.heap_used', memUsage.heapUsed);
        this.gauge('memory.external', memUsage.external);
        this.gauge('memory.array_buffers', memUsage.arrayBuffers);
    }
    trackCPUUsage() {
        const cpuUsage = process.cpuUsage();
        this.gauge('cpu.user', cpuUsage.user);
        this.gauge('cpu.system', cpuUsage.system);
    }
    trackEventLoopLag(lag) {
        this.histogram('event_loop.lag', lag);
    }
    // Custom events
    logEvent(title, text, alertType = 'info', tags) {
        if (!this.config.enabled)
            return;
        // Send event to DataDog
        this.statsD.event(title, text, {
            alert_type: alertType,
            tags,
        }, (error) => {
            if (error) {
                console.error('Failed to send event to DataDog:', error);
            }
        });
    }
    // Aggregated metrics
    addToBuffer(metric, value) {
        if (!this.metricsBuffer.has(metric)) {
            this.metricsBuffer.set(metric, []);
        }
        this.metricsBuffer.get(metric).push(value);
    }
    flushBufferedMetrics() {
        this.metricsBuffer.forEach((values, metric) => {
            if (values.length > 0) {
                const sum = values.reduce((a, b) => a + b, 0);
                const avg = sum / values.length;
                const min = Math.min(...values);
                const max = Math.max(...values);
                this.gauge(`${metric}.avg`, avg);
                this.gauge(`${metric}.min`, min);
                this.gauge(`${metric}.max`, max);
                this.gauge(`${metric}.count`, values.length);
            }
        });
        this.metricsBuffer.clear();
    }
    startMetricsFlush() {
        this.flushInterval = setInterval(() => {
            this.flushBufferedMetrics();
        }, 10000); // Flush every 10 seconds
    }
    startSystemMetrics() {
        setInterval(() => {
            this.trackMemoryUsage();
            this.trackCPUUsage();
            // Track active connections
            const server = global.__server;
            if (server) {
                server.getConnections((err, count) => {
                    if (!err) {
                        this.gauge('connections.active', count);
                    }
                });
            }
        }, 30000); // Every 30 seconds
    }
    // APM Tracing helpers
    createSpan(name, options) {
        if (!this.config.enabled)
            return null;
        return dd_trace_1.default.startSpan(name, options);
    }
    wrapAsync(name, fn, options) {
        if (!this.config.enabled)
            return fn();
        return dd_trace_1.default.trace(name, options, async (span) => {
            try {
                const result = await fn();
                span.setTag('status', 'success');
                return result;
            }
            catch (error) {
                span.setTag('status', 'error');
                span.setTag('error', true);
                span.setTag('error.message', error.message);
                throw error;
            }
        });
    }
    // Cleanup
    async close() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        this.flushBufferedMetrics();
        return new Promise((resolve) => {
            this.statsD.close((error) => {
                if (error) {
                    console.error('Error closing StatsD client:', error);
                }
                resolve();
            });
        });
    }
}
exports.DataDogService = DataDogService;
// Export singleton instance
exports.datadogService = DataDogService.getInstance();
//# sourceMappingURL=datadog.js.map