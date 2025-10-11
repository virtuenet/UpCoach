/**
 * Metrics Collector Utility
 * Basic metrics collection and reporting
 */

interface MetricValue {
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface TimingMetric extends MetricValue {
  duration: number;
}

interface CounterMetric extends MetricValue {
  count: number;
}

interface GaugeMetric extends MetricValue {
  gauge: number;
}

interface HistogramMetric extends MetricValue {
  values: number[];
  buckets: Record<string, number>;
}

type Metric = TimingMetric | CounterMetric | GaugeMetric | HistogramMetric;

interface MetricsSnapshot {
  counters: Record<string, CounterMetric[]>;
  gauges: Record<string, GaugeMetric[]>;
  timings: Record<string, TimingMetric[]>;
  histograms: Record<string, HistogramMetric[]>;
  timestamp: number;
}

export class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  // Counter methods
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.addMetric(name, {
      value,
      count: value,
      timestamp: Date.now(),
      tags
    } as CounterMetric);
  }

  decrement(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.increment(name, -value, tags);
  }

  // Gauge methods
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.addMetric(name, {
      value,
      gauge: value,
      timestamp: Date.now(),
      tags
    } as GaugeMetric);
  }

  // Timing methods
  timing(name: string, duration: number, tags?: Record<string, string>): void {
    this.addMetric(name, {
      value: duration,
      duration,
      timestamp: Date.now(),
      tags
    } as TimingMetric);
  }

  startTimer(name: string): string {
    const timerId = `${name}_${Date.now()}_${Math.random()}`;
    this.startTimes.set(timerId, Date.now());
    return timerId;
  }

  endTimer(timerId: string, tags?: Record<string, string>): number {
    const startTime = this.startTimes.get(timerId);
    if (!startTime) {
      throw new Error(`Timer ${timerId} not found`);
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(timerId);

    // Extract name from timer ID
    const name = timerId.split('_')[0];
    this.timing(name, duration, tags);

    return duration;
  }

  // Histogram methods
  histogram(name: string, value: number, tags?: Record<string, string>): void {
    const existing = this.metrics.get(name) || [];
    const lastHistogram = existing[existing.length - 1] as HistogramMetric;

    if (lastHistogram && Date.now() - lastHistogram.timestamp < 60000) {
      // Add to existing histogram if within the last minute
      lastHistogram.values.push(value);
      this.updateHistogramBuckets(lastHistogram, value);
    } else {
      // Create new histogram
      const buckets = this.createHistogramBuckets();
      this.updateHistogramBuckets({ buckets } as HistogramMetric, value);

      this.addMetric(name, {
        value,
        values: [value],
        buckets,
        timestamp: Date.now(),
        tags
      } as HistogramMetric);
    }
  }

  private createHistogramBuckets(): Record<string, number> {
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

  private updateHistogramBuckets(histogram: HistogramMetric, value: number): void {
    const buckets = ['0.1', '0.5', '1', '5', '10', '25', '50', '100', '250', '500', '1000'];

    for (const bucket of buckets) {
      if (value <= parseFloat(bucket)) {
        histogram.buckets[bucket]++;
      }
    }
    histogram.buckets['+Inf']++;
  }

  private addMetric(name: string, metric: Metric): void {
    const existing = this.metrics.get(name) || [];
    existing.push(metric);

    // Keep only last 1000 metrics per name to prevent memory leaks
    if (existing.length > 1000) {
      existing.shift();
    }

    this.metrics.set(name, existing);
  }

  // Query methods
  getMetrics(name: string): Metric[] {
    return this.metrics.get(name) || [];
  }

  getAllMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  getSnapshot(): MetricsSnapshot {
    const snapshot: MetricsSnapshot = {
      counters: {},
      gauges: {},
      timings: {},
      histograms: {},
      timestamp: Date.now()
    };

    for (const [name, metrics] of this.metrics.entries()) {
      const latestMetric = metrics[metrics.length - 1];

      if ('count' in latestMetric) {
        snapshot.counters[name] = metrics as CounterMetric[];
      } else if ('gauge' in latestMetric) {
        snapshot.gauges[name] = metrics as GaugeMetric[];
      } else if ('duration' in latestMetric) {
        snapshot.timings[name] = metrics as TimingMetric[];
      } else if ('values' in latestMetric) {
        snapshot.histograms[name] = metrics as HistogramMetric[];
      }
    }

    return snapshot;
  }

  // Cleanup old metrics
  cleanup(maxAge: number = 3600000): void { // Default 1 hour
    const cutoff = Date.now() - maxAge;

    for (const [name, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(metric => metric.timestamp > cutoff);

      if (filtered.length === 0) {
        this.metrics.delete(name);
      } else {
        this.metrics.set(name, filtered);
      }
    }
  }

  // Reset all metrics
  reset(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }

  // Export metrics in Prometheus format (basic implementation)
  exportPrometheus(): string {
    const lines: string[] = [];

    for (const [name, metrics] of this.metrics.entries()) {
      const latestMetric = metrics[metrics.length - 1];

      if ('count' in latestMetric) {
        lines.push(`# TYPE ${name} counter`);
        lines.push(`${name} ${latestMetric.count}`);
      } else if ('gauge' in latestMetric) {
        lines.push(`# TYPE ${name} gauge`);
        lines.push(`${name} ${latestMetric.gauge}`);
      } else if ('duration' in latestMetric) {
        const durations = (metrics as TimingMetric[]).map(m => m.duration);
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        lines.push(`# TYPE ${name} summary`);
        lines.push(`${name} ${avg}`);
      }
    }

    return lines.join('\n');
  }
}

export default MetricsCollector;