/**
 * Metrics Collector Service
 *
 * Centralized metrics collection with Prometheus-compatible format,
 * custom business metrics, and real-time aggregation.
 */

import { EventEmitter } from 'events';

// Metric types
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

// Metric labels
export type Labels = Record<string, string>;

// Counter metric
export interface CounterMetric {
  type: 'counter';
  name: string;
  help: string;
  value: number;
  labels: Labels;
  createdAt: number;
  updatedAt: number;
}

// Gauge metric
export interface GaugeMetric {
  type: 'gauge';
  name: string;
  help: string;
  value: number;
  labels: Labels;
  createdAt: number;
  updatedAt: number;
}

// Histogram metric
export interface HistogramMetric {
  type: 'histogram';
  name: string;
  help: string;
  labels: Labels;
  buckets: Map<number, number>;
  sum: number;
  count: number;
  createdAt: number;
  updatedAt: number;
}

// Summary metric
export interface SummaryMetric {
  type: 'summary';
  name: string;
  help: string;
  labels: Labels;
  values: number[];
  quantiles: Map<number, number>;
  sum: number;
  count: number;
  maxAge: number;
  createdAt: number;
  updatedAt: number;
}

// Unified metric type
export type Metric = CounterMetric | GaugeMetric | HistogramMetric | SummaryMetric;

// Metric definition
export interface MetricDefinition {
  name: string;
  type: MetricType;
  help: string;
  labelNames?: string[];
  buckets?: number[]; // For histograms
  quantiles?: number[]; // For summaries
  maxAge?: number; // For summaries (in seconds)
}

// Metrics config
export interface MetricsConfig {
  prefix: string;
  defaultLabels: Labels;
  collectDefaultMetrics: boolean;
  defaultMetricsInterval: number;
  maxSummaryValues: number;
  histogramBuckets: number[];
  summaryQuantiles: number[];
}

// Metrics snapshot
export interface MetricsSnapshot {
  timestamp: number;
  metrics: Metric[];
  prometheus: string;
}

// Business metrics
export interface BusinessMetrics {
  users: {
    active: number;
    registered: number;
    premium: number;
  };
  sessions: {
    total: number;
    completed: number;
    avgDuration: number;
  };
  habits: {
    created: number;
    completed: number;
    completionRate: number;
  };
  goals: {
    created: number;
    achieved: number;
    achievementRate: number;
  };
  coaching: {
    sessionsToday: number;
    revenue: number;
    avgRating: number;
  };
}

export class MetricsCollector extends EventEmitter {
  private config: MetricsConfig;
  private metrics: Map<string, Metric> = new Map();
  private definitions: Map<string, MetricDefinition> = new Map();
  private collectInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config?: Partial<MetricsConfig>) {
    super();
    this.config = {
      prefix: 'upcoach_',
      defaultLabels: {
        service: 'api',
        environment: process.env.NODE_ENV || 'development',
      },
      collectDefaultMetrics: true,
      defaultMetricsInterval: 10000,
      maxSummaryValues: 1000,
      histogramBuckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60],
      summaryQuantiles: [0.5, 0.9, 0.95, 0.99],
      ...config,
    };

    this.initializeDefaultMetrics();
  }

  /**
   * Initialize default metrics
   */
  private initializeDefaultMetrics(): void {
    // HTTP metrics
    this.defineMetric({
      name: 'http_requests_total',
      type: 'counter',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
    });

    this.defineMetric({
      name: 'http_request_duration_seconds',
      type: 'histogram',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path'],
      buckets: this.config.histogramBuckets,
    });

    this.defineMetric({
      name: 'http_request_size_bytes',
      type: 'histogram',
      help: 'HTTP request size in bytes',
      labelNames: ['method', 'path'],
      buckets: [100, 1000, 10000, 100000, 1000000],
    });

    this.defineMetric({
      name: 'http_response_size_bytes',
      type: 'histogram',
      help: 'HTTP response size in bytes',
      labelNames: ['method', 'path'],
      buckets: [100, 1000, 10000, 100000, 1000000],
    });

    // Database metrics
    this.defineMetric({
      name: 'db_queries_total',
      type: 'counter',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table'],
    });

    this.defineMetric({
      name: 'db_query_duration_seconds',
      type: 'histogram',
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
    });

    this.defineMetric({
      name: 'db_connections_active',
      type: 'gauge',
      help: 'Number of active database connections',
    });

    this.defineMetric({
      name: 'db_connections_idle',
      type: 'gauge',
      help: 'Number of idle database connections',
    });

    // Cache metrics
    this.defineMetric({
      name: 'cache_hits_total',
      type: 'counter',
      help: 'Total number of cache hits',
      labelNames: ['cache'],
    });

    this.defineMetric({
      name: 'cache_misses_total',
      type: 'counter',
      help: 'Total number of cache misses',
      labelNames: ['cache'],
    });

    this.defineMetric({
      name: 'cache_operations_duration_seconds',
      type: 'histogram',
      help: 'Cache operation duration in seconds',
      labelNames: ['cache', 'operation'],
      buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1],
    });

    // AI/ML metrics
    this.defineMetric({
      name: 'ai_inference_total',
      type: 'counter',
      help: 'Total AI inference requests',
      labelNames: ['model', 'type'],
    });

    this.defineMetric({
      name: 'ai_inference_duration_seconds',
      type: 'histogram',
      help: 'AI inference duration in seconds',
      labelNames: ['model', 'type'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    });

    this.defineMetric({
      name: 'ai_tokens_used_total',
      type: 'counter',
      help: 'Total AI tokens used',
      labelNames: ['model', 'type'],
    });

    // WebSocket metrics
    this.defineMetric({
      name: 'websocket_connections_active',
      type: 'gauge',
      help: 'Active WebSocket connections',
    });

    this.defineMetric({
      name: 'websocket_messages_total',
      type: 'counter',
      help: 'Total WebSocket messages',
      labelNames: ['direction', 'type'],
    });

    // Business metrics
    this.defineMetric({
      name: 'users_active',
      type: 'gauge',
      help: 'Number of active users',
    });

    this.defineMetric({
      name: 'sessions_completed_total',
      type: 'counter',
      help: 'Total completed coaching sessions',
    });

    this.defineMetric({
      name: 'habits_completed_total',
      type: 'counter',
      help: 'Total completed habits',
    });

    this.defineMetric({
      name: 'goals_achieved_total',
      type: 'counter',
      help: 'Total achieved goals',
    });

    this.defineMetric({
      name: 'revenue_total',
      type: 'counter',
      help: 'Total revenue in cents',
      labelNames: ['type'],
    });

    // System metrics
    this.defineMetric({
      name: 'nodejs_heap_size_bytes',
      type: 'gauge',
      help: 'Node.js heap size in bytes',
      labelNames: ['type'],
    });

    this.defineMetric({
      name: 'nodejs_external_memory_bytes',
      type: 'gauge',
      help: 'Node.js external memory in bytes',
    });

    this.defineMetric({
      name: 'nodejs_active_handles',
      type: 'gauge',
      help: 'Number of active handles',
    });

    this.defineMetric({
      name: 'nodejs_active_requests',
      type: 'gauge',
      help: 'Number of active requests',
    });
  }

  /**
   * Start collection
   */
  start(): void {
    if (this.config.collectDefaultMetrics) {
      this.collectInterval = setInterval(() => {
        this.collectSystemMetrics();
      }, this.config.defaultMetricsInterval);
    }
  }

  /**
   * Stop collection
   */
  stop(): void {
    if (this.collectInterval) {
      clearInterval(this.collectInterval);
      this.collectInterval = null;
    }
  }

  /**
   * Define a metric
   */
  defineMetric(definition: MetricDefinition): void {
    const fullName = this.config.prefix + definition.name;
    this.definitions.set(fullName, { ...definition, name: fullName });
  }

  /**
   * Get metric key
   */
  private getMetricKey(name: string, labels: Labels): string {
    const fullName = this.config.prefix + name;
    const labelStr = Object.entries({ ...this.config.defaultLabels, ...labels })
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${fullName}{${labelStr}}`;
  }

  /**
   * Increment a counter
   */
  incCounter(name: string, value: number = 1, labels: Labels = {}): void {
    const key = this.getMetricKey(name, labels);
    const existing = this.metrics.get(key);

    if (existing && existing.type === 'counter') {
      existing.value += value;
      existing.updatedAt = Date.now();
    } else {
      const fullName = this.config.prefix + name;
      const definition = this.definitions.get(fullName);
      this.metrics.set(key, {
        type: 'counter',
        name: fullName,
        help: definition?.help || '',
        value,
        labels: { ...this.config.defaultLabels, ...labels },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    this.emit('metric', { type: 'counter', name, value, labels });
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, labels: Labels = {}): void {
    const key = this.getMetricKey(name, labels);
    const fullName = this.config.prefix + name;
    const definition = this.definitions.get(fullName);

    this.metrics.set(key, {
      type: 'gauge',
      name: fullName,
      help: definition?.help || '',
      value,
      labels: { ...this.config.defaultLabels, ...labels },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    this.emit('metric', { type: 'gauge', name, value, labels });
  }

  /**
   * Increment a gauge
   */
  incGauge(name: string, value: number = 1, labels: Labels = {}): void {
    const key = this.getMetricKey(name, labels);
    const existing = this.metrics.get(key);

    if (existing && existing.type === 'gauge') {
      existing.value += value;
      existing.updatedAt = Date.now();
    } else {
      this.setGauge(name, value, labels);
    }
  }

  /**
   * Decrement a gauge
   */
  decGauge(name: string, value: number = 1, labels: Labels = {}): void {
    this.incGauge(name, -value, labels);
  }

  /**
   * Observe a histogram value
   */
  observeHistogram(name: string, value: number, labels: Labels = {}): void {
    const key = this.getMetricKey(name, labels);
    const existing = this.metrics.get(key);
    const fullName = this.config.prefix + name;
    const definition = this.definitions.get(fullName);
    const buckets = definition?.buckets || this.config.histogramBuckets;

    if (existing && existing.type === 'histogram') {
      existing.sum += value;
      existing.count++;
      for (const bucket of buckets) {
        if (value <= bucket) {
          existing.buckets.set(bucket, (existing.buckets.get(bucket) || 0) + 1);
        }
      }
      existing.updatedAt = Date.now();
    } else {
      const bucketMap = new Map<number, number>();
      for (const bucket of buckets) {
        bucketMap.set(bucket, value <= bucket ? 1 : 0);
      }

      this.metrics.set(key, {
        type: 'histogram',
        name: fullName,
        help: definition?.help || '',
        labels: { ...this.config.defaultLabels, ...labels },
        buckets: bucketMap,
        sum: value,
        count: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    this.emit('metric', { type: 'histogram', name, value, labels });
  }

  /**
   * Observe a summary value
   */
  observeSummary(name: string, value: number, labels: Labels = {}): void {
    const key = this.getMetricKey(name, labels);
    const existing = this.metrics.get(key);
    const fullName = this.config.prefix + name;
    const definition = this.definitions.get(fullName);

    if (existing && existing.type === 'summary') {
      existing.values.push(value);
      if (existing.values.length > this.config.maxSummaryValues) {
        existing.values.shift();
      }
      existing.sum += value;
      existing.count++;
      this.updateQuantiles(existing);
      existing.updatedAt = Date.now();
    } else {
      const summary: SummaryMetric = {
        type: 'summary',
        name: fullName,
        help: definition?.help || '',
        labels: { ...this.config.defaultLabels, ...labels },
        values: [value],
        quantiles: new Map(),
        sum: value,
        count: 1,
        maxAge: definition?.maxAge || 600,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.updateQuantiles(summary);
      this.metrics.set(key, summary);
    }

    this.emit('metric', { type: 'summary', name, value, labels });
  }

  /**
   * Update quantiles for summary
   */
  private updateQuantiles(summary: SummaryMetric): void {
    const sorted = [...summary.values].sort((a, b) => a - b);
    const quantiles = this.config.summaryQuantiles;

    for (const q of quantiles) {
      const index = Math.ceil(q * sorted.length) - 1;
      summary.quantiles.set(q, sorted[Math.max(0, index)]);
    }
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    const memUsage = process.memoryUsage();

    this.setGauge('nodejs_heap_size_bytes', memUsage.heapTotal, { type: 'total' });
    this.setGauge('nodejs_heap_size_bytes', memUsage.heapUsed, { type: 'used' });
    this.setGauge('nodejs_external_memory_bytes', memUsage.external);

    // @ts-expect-error - _getActiveHandles is internal
    const handles = process._getActiveHandles?.()?.length || 0;
    // @ts-expect-error - _getActiveRequests is internal
    const requests = process._getActiveRequests?.()?.length || 0;

    this.setGauge('nodejs_active_handles', handles);
    this.setGauge('nodejs_active_requests', requests);
  }

  /**
   * Get metrics snapshot
   */
  getSnapshot(): MetricsSnapshot {
    const metrics = Array.from(this.metrics.values());
    return {
      timestamp: Date.now(),
      metrics,
      prometheus: this.toPrometheusFormat(metrics),
    };
  }

  /**
   * Convert to Prometheus format
   */
  toPrometheusFormat(metrics?: Metric[]): string {
    const metricsList = metrics || Array.from(this.metrics.values());
    const lines: string[] = [];
    const processedNames = new Set<string>();

    for (const metric of metricsList) {
      // Add HELP and TYPE only once per metric name
      if (!processedNames.has(metric.name)) {
        lines.push(`# HELP ${metric.name} ${metric.help}`);
        lines.push(`# TYPE ${metric.name} ${metric.type}`);
        processedNames.add(metric.name);
      }

      const labelStr = Object.entries(metric.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');

      switch (metric.type) {
        case 'counter':
        case 'gauge':
          lines.push(`${metric.name}{${labelStr}} ${metric.value}`);
          break;

        case 'histogram':
          for (const [le, count] of metric.buckets) {
            lines.push(`${metric.name}_bucket{${labelStr},le="${le}"} ${count}`);
          }
          lines.push(`${metric.name}_bucket{${labelStr},le="+Inf"} ${metric.count}`);
          lines.push(`${metric.name}_sum{${labelStr}} ${metric.sum}`);
          lines.push(`${metric.name}_count{${labelStr}} ${metric.count}`);
          break;

        case 'summary':
          for (const [q, v] of metric.quantiles) {
            lines.push(`${metric.name}{${labelStr},quantile="${q}"} ${v}`);
          }
          lines.push(`${metric.name}_sum{${labelStr}} ${metric.sum}`);
          lines.push(`${metric.name}_count{${labelStr}} ${metric.count}`);
          break;
      }
    }

    return lines.join('\n');
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Metric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get metric by name
   */
  getMetric(name: string, labels: Labels = {}): Metric | null {
    const key = this.getMetricKey(name, labels);
    return this.metrics.get(key) || null;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
  }

  /**
   * Reset specific metric
   */
  resetMetric(name: string, labels: Labels = {}): void {
    const key = this.getMetricKey(name, labels);
    this.metrics.delete(key);
  }

  /**
   * Record HTTP request
   */
  recordHttpRequest(
    method: string,
    path: string,
    status: number,
    duration: number,
    requestSize: number,
    responseSize: number
  ): void {
    this.incCounter('http_requests_total', 1, { method, path, status: status.toString() });
    this.observeHistogram('http_request_duration_seconds', duration / 1000, { method, path });
    this.observeHistogram('http_request_size_bytes', requestSize, { method, path });
    this.observeHistogram('http_response_size_bytes', responseSize, { method, path });
  }

  /**
   * Record database query
   */
  recordDbQuery(operation: string, table: string, duration: number): void {
    this.incCounter('db_queries_total', 1, { operation, table });
    this.observeHistogram('db_query_duration_seconds', duration / 1000, { operation, table });
  }

  /**
   * Record cache operation
   */
  recordCacheOperation(
    cache: string,
    operation: string,
    hit: boolean,
    duration: number
  ): void {
    if (hit) {
      this.incCounter('cache_hits_total', 1, { cache });
    } else {
      this.incCounter('cache_misses_total', 1, { cache });
    }
    this.observeHistogram('cache_operations_duration_seconds', duration / 1000, { cache, operation });
  }

  /**
   * Record AI inference
   */
  recordAIInference(
    model: string,
    type: string,
    duration: number,
    tokensUsed: number
  ): void {
    this.incCounter('ai_inference_total', 1, { model, type });
    this.observeHistogram('ai_inference_duration_seconds', duration / 1000, { model, type });
    this.incCounter('ai_tokens_used_total', tokensUsed, { model, type });
  }

  /**
   * Update business metrics
   */
  updateBusinessMetrics(metrics: Partial<BusinessMetrics>): void {
    if (metrics.users) {
      this.setGauge('users_active', metrics.users.active);
    }
    if (metrics.sessions?.completed) {
      this.incCounter('sessions_completed_total', metrics.sessions.completed);
    }
    if (metrics.habits?.completed) {
      this.incCounter('habits_completed_total', metrics.habits.completed);
    }
    if (metrics.goals?.achieved) {
      this.incCounter('goals_achieved_total', metrics.goals.achieved);
    }
    if (metrics.coaching?.revenue) {
      this.incCounter('revenue_total', metrics.coaching.revenue, { type: 'coaching' });
    }
  }
}

// Singleton instance
let metricsCollector: MetricsCollector | null = null;

export function getMetricsCollector(): MetricsCollector {
  if (!metricsCollector) {
    metricsCollector = new MetricsCollector();
    metricsCollector.start();
  }
  return metricsCollector;
}

export default MetricsCollector;
