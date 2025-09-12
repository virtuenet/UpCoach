"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMiddleware = exports.measure = exports.performanceMonitor = void 0;
const events_1 = require("events");
const os = __importStar(require("os"));
const perf_hooks_1 = require("perf_hooks");
const logger_1 = require("../utils/logger");
class PerformanceMonitor extends events_1.EventEmitter {
    metrics = new Map();
    requestMetrics = [];
    alertRules = [];
    samplingRate = 1;
    maxMetricsAge = 3600000;
    cleanupInterval;
    metricsBuffer = [];
    bufferFlushInterval = 5000;
    constructor() {
        super();
        this.setupCleanup();
        this.setupMetricsFlush();
        this.setupDefaultAlerts();
    }
    async measure(name, fn, tags) {
        const start = perf_hooks_1.performance.now();
        try {
            const result = await fn();
            const duration = perf_hooks_1.performance.now() - start;
            this.recordMetric({
                name,
                value: duration,
                unit: 'ms',
                timestamp: new Date(),
                tags,
            });
            return result;
        }
        catch (error) {
            const duration = perf_hooks_1.performance.now() - start;
            this.recordMetric({
                name: `${name}error`,
                value: duration,
                unit: 'ms',
                timestamp: new Date(),
                tags: { ...tags, error: 'true' },
            });
            throw error;
        }
    }
    measureMethod(name, tags) {
        return (target, propertyName, descriptor) => {
            const originalMethod = descriptor.value;
            const metricName = name || `${target.constructor.name}.${propertyName}`;
            descriptor.value = async function (...args) {
                return await exports.performanceMonitor.measure(metricName, () => originalMethod.apply(this, args), tags);
            };
            return descriptor;
        };
    }
    recordMetric(metric) {
        if (Math.random() > this.samplingRate) {
            return;
        }
        this.metricsBuffer.push(metric);
        this.checkAlerts(metric);
        this.emit('metric', metric);
    }
    recordRequest(metrics) {
        this.requestMetrics.push(metrics);
        const cutoff = Date.now() - this.maxMetricsAge;
        this.requestMetrics = this.requestMetrics.filter(m => m.timestamp.getTime() > cutoff);
        this.recordMetric({
            name: 'request_duration',
            value: metrics.duration,
            unit: 'ms',
            timestamp: metrics.timestamp,
            tags: {
                url: metrics.url,
                method: metrics.method,
                statusCode: metrics.statusCode.toString(),
            },
        });
        if (metrics.duration > 1000) {
            logger_1.logger.warn('Slow request detected:', {
                url: metrics.url,
                duration: metrics.duration,
            });
        }
    }
    getAggregatedMetrics(name, period = 60000) {
        const metrics = this.metrics.get(name) || [];
        const cutoff = Date.now() - period;
        const recentMetrics = metrics.filter(m => m.timestamp.getTime() > cutoff);
        if (recentMetrics.length === 0) {
            return null;
        }
        const values = recentMetrics.map(m => m.value);
        return {
            count: values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            p50: this.percentile(values, 50),
            p95: this.percentile(values, 95),
            p99: this.percentile(values, 99),
        };
    }
    getSystemMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        return {
            memory: {
                rss: memUsage.rss / 1024 / 1024,
                heapTotal: memUsage.heapTotal / 1024 / 1024,
                heapUsed: memUsage.heapUsed / 1024 / 1024,
                external: memUsage.external / 1024 / 1024,
            },
            cpu: {
                user: cpuUsage.user / 1000000,
                system: cpuUsage.system / 1000000,
            },
            system: {
                loadAvg: os.loadavg(),
                uptime: os.uptime(),
                freeMem: os.freemem() / 1024 / 1024,
                totalMem: os.totalmem() / 1024 / 1024,
            },
        };
    }
    getRequestStats(period = 60000) {
        const cutoff = Date.now() - period;
        const recentRequests = this.requestMetrics.filter(m => m.timestamp.getTime() > cutoff);
        if (recentRequests.length === 0) {
            return null;
        }
        const durations = recentRequests.map(r => r.duration);
        const statusCodes = recentRequests.reduce((acc, r) => {
            const key = `${Math.floor(r.statusCode / 100)}xx`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        return {
            total: recentRequests.length,
            rps: recentRequests.length / (period / 1000),
            avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations),
            p50Duration: this.percentile(durations, 50),
            p95Duration: this.percentile(durations, 95),
            p99Duration: this.percentile(durations, 99),
            statusCodes,
        };
    }
    addAlertRule(rule) {
        this.alertRules.push(rule);
    }
    setSamplingRate(rate) {
        this.samplingRate = Math.max(0, Math.min(1, rate));
    }
    middleware() {
        return (req, res, next) => {
            const start = perf_hooks_1.performance.now();
            const startCpu = process.cpuUsage();
            const originalEnd = res.end;
            res.end = (...args) => {
                const duration = perf_hooks_1.performance.now() - start;
                const endCpu = process.cpuUsage(startCpu);
                this.recordRequest({
                    url: req.path || req.url,
                    method: req.method,
                    statusCode: res.statusCode,
                    duration,
                    timestamp: new Date(),
                    memoryUsage: process.memoryUsage(),
                    cpuUsage: endCpu,
                });
                originalEnd.apply(res, args);
            };
            next();
        };
    }
    generateReport() {
        const report = {
            timestamp: new Date(),
            system: this.getSystemMetrics(),
            requests: this.getRequestStats(),
            metrics: {},
        };
        for (const [name, _metrics] of this.metrics.entries()) {
            report.metrics[name] = this.getAggregatedMetrics(name);
        }
        return report;
    }
    getPrometheusMetrics() {
        const lines = [];
        const timestamp = Date.now();
        const system = this.getSystemMetrics();
        lines.push(`# HELP node_memory_heap_used_bytes Process heap memory used`);
        lines.push(`# TYPE node_memory_heap_used_bytes gauge`);
        lines.push(`node_memory_heap_used_bytes ${system.memory.heapUsed * 1024 * 1024} ${timestamp}`);
        const requests = this.getRequestStats();
        if (requests) {
            lines.push(`# HELP http_request_duration_seconds Request duration`);
            lines.push(`# TYPE http_request_duration_seconds histogram`);
            lines.push(`http_request_duration_seconds_sum ${(requests.avgDuration * requests.total) / 1000}`);
            lines.push(`http_request_duration_seconds_count ${requests.total}`);
        }
        for (const [name, _metrics] of this.metrics.entries()) {
            const agg = this.getAggregatedMetrics(name);
            if (agg) {
                const metricName = name.replace(/[^a-zA-Z0-9_]/g, '_');
                lines.push(`# HELP ${metricName} Custom metric`);
                lines.push(`# TYPE ${metricName} summary`);
                lines.push(`${metricName}_sum ${agg.avg * agg.count}`);
                lines.push(`${metricName}_count ${agg.count}`);
                lines.push(`${metricName}{quantile="0.5"} ${agg.p50}`);
                lines.push(`${metricName}{quantile="0.95"} ${agg.p95}`);
                lines.push(`${metricName}{quantile="0.99"} ${agg.p99}`);
            }
        }
        return lines.join('\n');
    }
    percentile(values, p) {
        if (values.length === 0)
            return 0;
        const sorted = values.sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }
    checkAlerts(metric) {
        for (const rule of this.alertRules) {
            if (rule.metric !== metric.name)
                continue;
            let triggered = false;
            switch (rule.operator) {
                case '>':
                    triggered = metric.value > rule.threshold;
                    break;
                case '<':
                    triggered = metric.value < rule.threshold;
                    break;
                case '>=':
                    triggered = metric.value >= rule.threshold;
                    break;
                case '<=':
                    triggered = metric.value <= rule.threshold;
                    break;
                case '==':
                    triggered = metric.value === rule.threshold;
                    break;
            }
            if (triggered) {
                rule.action(metric);
                this.emit('alert', { rule, metric });
            }
        }
    }
    setupCleanup() {
        this.cleanupInterval = setInterval(() => {
            const cutoff = Date.now() - this.maxMetricsAge;
            for (const [name, metrics] of this.metrics.entries()) {
                const filtered = metrics.filter(m => m.timestamp.getTime() > cutoff);
                if (filtered.length > 0) {
                    this.metrics.set(name, filtered);
                }
                else {
                    this.metrics.delete(name);
                }
            }
            this.requestMetrics = this.requestMetrics.filter(m => m.timestamp.getTime() > cutoff);
        }, 60000);
    }
    setupMetricsFlush() {
        setInterval(() => {
            if (this.metricsBuffer.length === 0)
                return;
            for (const metric of this.metricsBuffer) {
                const existing = this.metrics.get(metric.name) || [];
                existing.push(metric);
                this.metrics.set(metric.name, existing);
            }
            this.metricsBuffer = [];
        }, this.bufferFlushInterval);
    }
    setupDefaultAlerts() {
        this.addAlertRule({
            name: 'high_memory',
            metric: 'memory_usage',
            threshold: 500,
            operator: '>',
            action: metric => {
                logger_1.logger.error('High memory usage detected:', metric);
            },
        });
        this.addAlertRule({
            name: 'slow_request',
            metric: 'request_duration',
            threshold: 5000,
            operator: '>',
            action: metric => {
                logger_1.logger.warn('Slow request detected:', metric);
            },
        });
    }
    destroy() {
        clearInterval(this.cleanupInterval);
        this.removeAllListeners();
    }
}
exports.performanceMonitor = new PerformanceMonitor();
const measure = (name, tags) => {
    return exports.performanceMonitor.measureMethod(name, tags);
};
exports.measure = measure;
const performanceMiddleware = () => exports.performanceMonitor.middleware();
exports.performanceMiddleware = performanceMiddleware;
//# sourceMappingURL=performanceMonitor.js.map