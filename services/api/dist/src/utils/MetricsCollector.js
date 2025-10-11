"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
class MetricsCollector {
    metrics = new Map();
    startTimes = new Map();
    increment(name, value = 1, tags) {
        this.addMetric(name, {
            value,
            count: value,
            timestamp: Date.now(),
            tags
        });
    }
    decrement(name, value = 1, tags) {
        this.increment(name, -value, tags);
    }
    gauge(name, value, tags) {
        this.addMetric(name, {
            value,
            gauge: value,
            timestamp: Date.now(),
            tags
        });
    }
    timing(name, duration, tags) {
        this.addMetric(name, {
            value: duration,
            duration,
            timestamp: Date.now(),
            tags
        });
    }
    startTimer(name) {
        const timerId = `${name}_${Date.now()}_${Math.random()}`;
        this.startTimes.set(timerId, Date.now());
        return timerId;
    }
    endTimer(timerId, tags) {
        const startTime = this.startTimes.get(timerId);
        if (!startTime) {
            throw new Error(`Timer ${timerId} not found`);
        }
        const duration = Date.now() - startTime;
        this.startTimes.delete(timerId);
        const name = timerId.split('_')[0];
        this.timing(name, duration, tags);
        return duration;
    }
    histogram(name, value, tags) {
        const existing = this.metrics.get(name) || [];
        const lastHistogram = existing[existing.length - 1];
        if (lastHistogram && Date.now() - lastHistogram.timestamp < 60000) {
            lastHistogram.values.push(value);
            this.updateHistogramBuckets(lastHistogram, value);
        }
        else {
            const buckets = this.createHistogramBuckets();
            this.updateHistogramBuckets({ buckets }, value);
            this.addMetric(name, {
                value,
                values: [value],
                buckets,
                timestamp: Date.now(),
                tags
            });
        }
    }
    createHistogramBuckets() {
        return {
            '0.1': 0,
            '0.5': 0,
            '1': 0,
            '5': 0,
            '10': 0,
            '25': 0,
            '50': 0,
            '100': 0,
            '250': 0,
            '500': 0,
            '1000': 0,
            '+Inf': 0
        };
    }
    updateHistogramBuckets(histogram, value) {
        const buckets = ['0.1', '0.5', '1', '5', '10', '25', '50', '100', '250', '500', '1000'];
        for (const bucket of buckets) {
            if (value <= parseFloat(bucket)) {
                histogram.buckets[bucket]++;
            }
        }
        histogram.buckets['+Inf']++;
    }
    addMetric(name, metric) {
        const existing = this.metrics.get(name) || [];
        existing.push(metric);
        if (existing.length > 1000) {
            existing.shift();
        }
        this.metrics.set(name, existing);
    }
    getMetrics(name) {
        return this.metrics.get(name) || [];
    }
    getAllMetricNames() {
        return Array.from(this.metrics.keys());
    }
    getSnapshot() {
        const snapshot = {
            counters: {},
            gauges: {},
            timings: {},
            histograms: {},
            timestamp: Date.now()
        };
        for (const [name, metrics] of this.metrics.entries()) {
            const latestMetric = metrics[metrics.length - 1];
            if ('count' in latestMetric) {
                snapshot.counters[name] = metrics;
            }
            else if ('gauge' in latestMetric) {
                snapshot.gauges[name] = metrics;
            }
            else if ('duration' in latestMetric) {
                snapshot.timings[name] = metrics;
            }
            else if ('values' in latestMetric) {
                snapshot.histograms[name] = metrics;
            }
        }
        return snapshot;
    }
    cleanup(maxAge = 3600000) {
        const cutoff = Date.now() - maxAge;
        for (const [name, metrics] of this.metrics.entries()) {
            const filtered = metrics.filter(metric => metric.timestamp > cutoff);
            if (filtered.length === 0) {
                this.metrics.delete(name);
            }
            else {
                this.metrics.set(name, filtered);
            }
        }
    }
    reset() {
        this.metrics.clear();
        this.startTimes.clear();
    }
    exportPrometheus() {
        const lines = [];
        for (const [name, metrics] of this.metrics.entries()) {
            const latestMetric = metrics[metrics.length - 1];
            if ('count' in latestMetric) {
                lines.push(`# TYPE ${name} counter`);
                lines.push(`${name} ${latestMetric.count}`);
            }
            else if ('gauge' in latestMetric) {
                lines.push(`# TYPE ${name} gauge`);
                lines.push(`${name} ${latestMetric.gauge}`);
            }
            else if ('duration' in latestMetric) {
                const durations = metrics.map(m => m.duration);
                const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
                lines.push(`# TYPE ${name} summary`);
                lines.push(`${name} ${avg}`);
            }
        }
        return lines.join('\n');
    }
}
exports.MetricsCollector = MetricsCollector;
exports.default = MetricsCollector;
//# sourceMappingURL=MetricsCollector.js.map