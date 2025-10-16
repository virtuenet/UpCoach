"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfilerUtils = exports.performanceProfiler = exports.PerformanceProfiler = void 0;
const tslib_1 = require("tslib");
const Sentry = tslib_1.__importStar(require("@sentry/node"));
const profiling_node_1 = require("@sentry/profiling-node");
const node_dogstatsd_1 = require("node-dogstatsd");
const perf_hooks_1 = require("perf_hooks");
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const PerformanceCacheService_1 = require("../cache/PerformanceCacheService");
class PerformanceProfiler extends events_1.EventEmitter {
    static instance;
    dogstatsd;
    performanceObserver;
    activeSessions = new Map();
    metrics = new Map();
    alerts = [];
    isEnabled = true;
    thresholds = {
        responseTime: 1000,
        memoryUsage: 512 * 1024 * 1024,
        cpuUsage: 80,
        errorRate: 5,
        databaseQueryTime: 500,
        cacheHitRate: 90
    };
    windows = {
        realtime: 60000,
        short: 300000,
        medium: 1800000,
        long: 3600000
    };
    constructor() {
        super();
        this.initializeMonitoring();
    }
    static getInstance() {
        if (!PerformanceProfiler.instance) {
            PerformanceProfiler.instance = new PerformanceProfiler();
        }
        return PerformanceProfiler.instance;
    }
    initializeMonitoring() {
        this.setupSentry();
        this.setupDataDog();
        this.setupPerformanceObserver();
        this.setupMemoryMonitoring();
        this.setupCpuMonitoring();
        this.setupAutomaticProfiling();
    }
    setupSentry() {
        if (!process.env.SENTRY_DSN) {
            logger_1.logger.warn('Sentry DSN not configured');
            return;
        }
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
            profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
            integrations: [
                (0, profiling_node_1.createProfilingIntegration)(),
                Sentry.httpIntegration({ tracing: true }),
                Sentry.expressIntegration({ router: true }),
                Sentry.postgresIntegration(),
                Sentry.redisIntegration()
            ],
            beforeSend: (event) => {
                if (process.env.NODE_ENV === 'development' && event.level === 'warning') {
                    return null;
                }
                return event;
            }
        });
        logger_1.logger.info('Sentry monitoring initialized');
    }
    setupDataDog() {
        if (!process.env.DATADOG_API_KEY) {
            logger_1.logger.warn('DataDog API key not configured');
            return;
        }
        this.dogstatsd = new node_dogstatsd_1.StatsD({
            host: process.env.DATADOG_HOST || 'localhost',
            port: parseInt(process.env.DATADOG_PORT || '8125'),
            globalTags: {
                service: 'upcoach-api',
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development'
            }
        });
        logger_1.logger.info('DataDog monitoring initialized');
    }
    setupPerformanceObserver() {
        this.performanceObserver = new perf_hooks_1.PerformanceObserver((list) => {
            const entries = list.getEntries();
            for (const entry of entries) {
                this.recordMetric({
                    name: `performance.${entry.entryType}.${entry.name}`,
                    value: entry.duration,
                    unit: 'ms',
                    timestamp: Date.now(),
                    tags: {
                        entryType: entry.entryType,
                        name: entry.name
                    },
                    metadata: entry
                });
            }
        });
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    }
    setupMemoryMonitoring() {
        setInterval(() => {
            const memUsage = process.memoryUsage();
            this.recordMetric({
                name: 'memory.rss',
                value: memUsage.rss,
                unit: 'bytes',
                timestamp: Date.now()
            });
            this.recordMetric({
                name: 'memory.heapUsed',
                value: memUsage.heapUsed,
                unit: 'bytes',
                timestamp: Date.now()
            });
            this.recordMetric({
                name: 'memory.heapTotal',
                value: memUsage.heapTotal,
                unit: 'bytes',
                timestamp: Date.now()
            });
            this.recordMetric({
                name: 'memory.external',
                value: memUsage.external,
                unit: 'bytes',
                timestamp: Date.now()
            });
            if (memUsage.heapUsed > this.thresholds.memoryUsage) {
                this.triggerAlert('memory.heapUsed', memUsage.heapUsed);
            }
        }, 30000);
    }
    setupCpuMonitoring() {
        let lastCpuUsage = process.cpuUsage();
        setInterval(() => {
            const currentCpuUsage = process.cpuUsage(lastCpuUsage);
            const cpuPercent = (currentCpuUsage.user + currentCpuUsage.system) / 1000000 * 100 / 30;
            this.recordMetric({
                name: 'cpu.usage',
                value: cpuPercent,
                unit: 'percent',
                timestamp: Date.now()
            });
            if (cpuPercent > this.thresholds.cpuUsage) {
                this.triggerAlert('cpu.usage', cpuPercent);
            }
            lastCpuUsage = process.cpuUsage();
        }, 30000);
    }
    setupAutomaticProfiling() {
        this.on('slowRequest', (data) => {
            this.startProfiling(`slow_request_${data.url}`, {
                url: data.url,
                method: data.method,
                duration: data.duration
            });
        });
        this.on('memorySpike', (data) => {
            this.startProfiling(`memory_spike_${Date.now()}`, {
                memoryUsage: data.memoryUsage,
                threshold: this.thresholds.memoryUsage
            });
        });
    }
    startProfiling(sessionId, metadata) {
        const session = {
            sessionId,
            startTime: Date.now(),
            metrics: [],
            traces: [],
            memoryUsage: [],
            cpuUsage: []
        };
        this.activeSessions.set(sessionId, session);
        perf_hooks_1.performance.mark(`profile_start_${sessionId}`);
        if (typeof Sentry.startTransaction === 'function') {
            const transaction = Sentry.startTransaction({
                name: `profile_${sessionId}`,
                op: 'profiling',
                data: metadata
            });
            session.traces.push(transaction);
        }
        logger_1.logger.info('Profiling session started', { sessionId, metadata });
        return sessionId;
    }
    stopProfiling(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            logger_1.logger.warn('Profiling session not found', { sessionId });
            return null;
        }
        session.endTime = Date.now();
        session.duration = session.endTime - session.startTime;
        perf_hooks_1.performance.mark(`profile_end_${sessionId}`);
        perf_hooks_1.performance.measure(`profile_${sessionId}`, `profile_start_${sessionId}`, `profile_end_${sessionId}`);
        session.traces.forEach(trace => {
            if (trace && typeof trace.finish === 'function') {
                trace.finish();
            }
        });
        this.activeSessions.delete(sessionId);
        this.storeProfilingSession(session);
        logger_1.logger.info('Profiling session completed', {
            sessionId,
            duration: session.duration,
            metricsCount: session.metrics.length
        });
        return session;
    }
    recordMetric(metric) {
        if (!this.isEnabled)
            return;
        if (!this.metrics.has(metric.name)) {
            this.metrics.set(metric.name, []);
        }
        const metricHistory = this.metrics.get(metric.name);
        metricHistory.push(metric);
        const cutoff = Date.now() - this.windows.long;
        this.metrics.set(metric.name, metricHistory.filter(m => m.timestamp > cutoff));
        for (const session of this.activeSessions.values()) {
            session.metrics.push(metric);
        }
        if (this.dogstatsd) {
            const tags = metric.tags ? Object.entries(metric.tags).map(([k, v]) => `${k}:${v}`) : [];
            switch (metric.unit) {
                case 'ms':
                    this.dogstatsd.timing(metric.name, metric.value, tags);
                    break;
                case 'count':
                    this.dogstatsd.increment(metric.name, metric.value, tags);
                    break;
                case 'bytes':
                case 'percent':
                    this.dogstatsd.gauge(metric.name, metric.value, tags);
                    break;
            }
        }
        this.cacheMetric(metric);
        this.checkAlerts(metric);
        this.emit('metric', metric);
    }
    async measureAsync(name, fn, tags) {
        const startTime = perf_hooks_1.performance.now();
        const startMark = `${name}_start_${Date.now()}`;
        perf_hooks_1.performance.mark(startMark);
        try {
            const result = await fn();
            const duration = perf_hooks_1.performance.now() - startTime;
            this.recordMetric({
                name: `function.${name}`,
                value: duration,
                unit: 'ms',
                timestamp: Date.now(),
                tags: { ...tags, status: 'success' }
            });
            return result;
        }
        catch (error) {
            const duration = perf_hooks_1.performance.now() - startTime;
            this.recordMetric({
                name: `function.${name}`,
                value: duration,
                unit: 'ms',
                timestamp: Date.now(),
                tags: { ...tags, status: 'error' }
            });
            throw error;
        }
        finally {
            perf_hooks_1.performance.clearMarks(startMark);
        }
    }
    measureSync(name, fn, tags) {
        const startTime = perf_hooks_1.performance.now();
        try {
            const result = fn();
            const duration = perf_hooks_1.performance.now() - startTime;
            this.recordMetric({
                name: `function.${name}`,
                value: duration,
                unit: 'ms',
                timestamp: Date.now(),
                tags: { ...tags, status: 'success' }
            });
            return result;
        }
        catch (error) {
            const duration = perf_hooks_1.performance.now() - startTime;
            this.recordMetric({
                name: `function.${name}`,
                value: duration,
                unit: 'ms',
                timestamp: Date.now(),
                tags: { ...tags, status: 'error' }
            });
            throw error;
        }
    }
    getMetrics(metricName, timeWindow = 'medium') {
        const cutoff = Date.now() - this.windows[timeWindow];
        if (metricName) {
            const metrics = this.metrics.get(metricName) || [];
            return metrics.filter(m => m.timestamp > cutoff);
        }
        const allMetrics = [];
        for (const metrics of this.metrics.values()) {
            allMetrics.push(...metrics.filter(m => m.timestamp > cutoff));
        }
        return allMetrics.sort((a, b) => a.timestamp - b.timestamp);
    }
    getAggregatedMetrics(metricName, timeWindow = 'medium') {
        const metrics = this.getMetrics(metricName, timeWindow);
        if (metrics.length === 0) {
            return { avg: 0, min: 0, max: 0, count: 0, p50: 0, p95: 0, p99: 0 };
        }
        const values = metrics.map(m => m.value).sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        return {
            avg: sum / values.length,
            min: values[0],
            max: values[values.length - 1],
            count: values.length,
            p50: values[Math.floor(values.length * 0.5)],
            p95: values[Math.floor(values.length * 0.95)],
            p99: values[Math.floor(values.length * 0.99)]
        };
    }
    addAlert(config) {
        this.alerts.push(config);
        logger_1.logger.info('Performance alert added', config);
    }
    checkAlerts(metric) {
        for (const alert of this.alerts) {
            if (alert.metric === metric.name) {
                let triggered = false;
                switch (alert.operator) {
                    case 'gt':
                        triggered = metric.value > alert.threshold;
                        break;
                    case 'gte':
                        triggered = metric.value >= alert.threshold;
                        break;
                    case 'lt':
                        triggered = metric.value < alert.threshold;
                        break;
                    case 'lte':
                        triggered = metric.value <= alert.threshold;
                        break;
                    case 'eq':
                        triggered = metric.value === alert.threshold;
                        break;
                }
                if (triggered) {
                    this.triggerAlert(metric.name, metric.value, alert);
                }
            }
        }
    }
    triggerAlert(metricName, value, config) {
        const alertData = {
            metric: metricName,
            value,
            threshold: config?.threshold,
            timestamp: Date.now()
        };
        logger_1.logger.warn('Performance alert triggered', alertData);
        Sentry.captureMessage(`Performance Alert: ${metricName}`, {
            level: 'warning',
            extra: alertData
        });
        this.emit('alert', alertData);
    }
    async storeProfilingSession(session) {
        try {
            await PerformanceCacheService_1.performanceCacheService.set(`profiling_session:${session.sessionId}`, session, 3600);
        }
        catch (error) {
            logger_1.logger.error('Failed to store profiling session', error);
        }
    }
    async cacheMetric(metric) {
        try {
            const key = `metric:${metric.name}:${Math.floor(metric.timestamp / 60000)}`;
            await PerformanceCacheService_1.performanceCacheService.set(key, metric, 3600);
        }
        catch (error) {
        }
    }
    generateReport(timeWindow = 'medium') {
        const metrics = this.getMetrics(undefined, timeWindow);
        const metricNames = Array.from(new Set(metrics.map(m => m.name)));
        const report = {
            timeWindow,
            periodStart: Date.now() - this.windows[timeWindow],
            periodEnd: Date.now(),
            summary: {
                totalMetrics: metrics.length,
                uniqueMetrics: metricNames.length,
                averageResponseTime: 0,
                errorRate: 0,
                memoryUsage: 0,
                cpuUsage: 0
            },
            metrics: {},
            alerts: this.alerts.length,
            activeSessions: this.activeSessions.size
        };
        for (const metricName of metricNames) {
            report.metrics[metricName] = this.getAggregatedMetrics(metricName, timeWindow);
        }
        if (report.metrics['api.response_time']) {
            report.summary.averageResponseTime = report.metrics['api.response_time'].avg;
        }
        return report;
    }
    setEnabled(enabled) {
        this.isEnabled = enabled;
        logger_1.logger.info(`Performance profiling ${enabled ? 'enabled' : 'disabled'}`);
    }
    cleanup() {
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        if (this.dogstatsd) {
            this.dogstatsd.close();
        }
        this.activeSessions.clear();
        this.metrics.clear();
        logger_1.logger.info('Performance profiler cleaned up');
    }
}
exports.PerformanceProfiler = PerformanceProfiler;
exports.performanceProfiler = PerformanceProfiler.getInstance();
exports.ProfilerUtils = {
    profile: (name) => {
        return (target, propertyKey, descriptor) => {
            const originalMethod = descriptor.value;
            const methodName = name || `${target.constructor.name}.${propertyKey}`;
            descriptor.value = async function (...args) {
                return exports.performanceProfiler.measureAsync(methodName, () => originalMethod.apply(this, args));
            };
            return descriptor;
        };
    },
    expressMiddleware: () => {
        return (req, res, next) => {
            const startTime = Date.now();
            const routeName = `${req.method} ${req.route?.path || req.path}`;
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                exports.performanceProfiler.recordMetric({
                    name: 'api.response_time',
                    value: duration,
                    unit: 'ms',
                    timestamp: Date.now(),
                    tags: {
                        method: req.method,
                        route: req.route?.path || req.path,
                        status: res.statusCode.toString()
                    }
                });
                if (duration > exports.performanceProfiler['thresholds'].responseTime) {
                    exports.performanceProfiler.emit('slowRequest', {
                        url: req.url,
                        method: req.method,
                        duration
                    });
                }
            });
            next();
        };
    }
};
exports.default = PerformanceProfiler;
