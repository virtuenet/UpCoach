import { Request, Response, NextFunction } from 'express';
import { Registry, Counter, Gauge, Histogram, Summary, collectDefaultMetrics } from 'prom-client';
import StatsD from 'node-statsd';
import { CloudWatch } from 'aws-sdk';
import { BufferedMetricsLogger } from 'datadog-metrics';
import { EventEmitter } from 'events';

interface MetricLabel {
  [key: string]: string | number;
}

interface HistogramBuckets {
  buckets?: number[];
  percentiles?: number[];
}

interface MetricConfig {
  name: string;
  help: string;
  labelNames?: string[];
  buckets?: number[];
  percentiles?: number[];
}

interface SLIConfig {
  name: string;
  target: number;
  errorBudget: number;
  window: number;
}

interface AlertThreshold {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
  duration: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface MetricAggregation {
  sum: number;
  avg: number;
  min: number;
  max: number;
  count: number;
}

interface BusinessMetrics {
  signups: number;
  conversions: number;
  revenue: number;
  activeUsers: number;
  retention: number;
}

interface InfrastructureMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  connections: number;
}

export class MetricsCollector extends EventEmitter {
  private registry: Registry;
  private statsD: StatsD;
  private cloudWatch: CloudWatch;
  private datadog: BufferedMetricsLogger;

  // HTTP Metrics
  private httpRequestsTotal: Counter;
  private httpRequestDuration: Histogram;
  private httpResponseSize: Histogram;
  private httpRequestsInProgress: Gauge;

  // Database Metrics
  private dbQueriesTotal: Counter;
  private dbQueryDuration: Histogram;
  private dbConnectionPoolSize: Gauge;
  private dbConnectionPoolUsed: Gauge;

  // Cache Metrics
  private cacheHitsTotal: Counter;
  private cacheMissesTotal: Counter;
  private cacheEvictionsTotal: Counter;
  private cacheSizeBytes: Gauge;

  // Queue Metrics
  private queueDepth: Gauge;
  private queueProcessingDuration: Histogram;
  private queueDeadLettersTotal: Counter;

  // Business Metrics
  private userSignupsTotal: Counter;
  private goalCompletionsTotal: Counter;
  private revenueDollars: Counter;
  private activeUsersGauge: Gauge;

  // Error Metrics
  private errorsTotal: Counter;
  private unhandledExceptionsTotal: Counter;

  // Custom metrics storage
  private customCounters: Map<string, Counter>;
  private customGauges: Map<string, Gauge>;
  private customHistograms: Map<string, Histogram>;
  private customSummaries: Map<string, Summary>;

  // SLI/SLO tracking
  private sliMetrics: Map<string, { success: number; total: number; budget: number }>;
  private alertThresholds: Map<string, AlertThreshold>;

  // Metric aggregations
  private aggregations: Map<string, MetricAggregation>;

  constructor(config: {
    statsd?: { host: string; port: number; prefix?: string };
    cloudwatch?: { region: string; namespace: string };
    datadog?: { apiKey: string; host?: string; prefix?: string };
    enableDefaultMetrics?: boolean;
  }) {
    super();

    this.registry = new Registry();

    // Initialize StatsD client
    if (config.statsd) {
      this.statsD = new StatsD({
        host: config.statsd.host,
        port: config.statsd.port,
        prefix: config.statsd.prefix || 'upcoach.',
        cacheDns: true,
        mock: false,
      });
    } else {
      this.statsD = new StatsD({ mock: true });
    }

    // Initialize CloudWatch client
    if (config.cloudwatch) {
      this.cloudWatch = new CloudWatch({
        region: config.cloudwatch.region,
      });
    } else {
      this.cloudWatch = null as any;
    }

    // Initialize Datadog client
    if (config.datadog) {
      this.datadog = new BufferedMetricsLogger({
        apiKey: config.datadog.apiKey,
        host: config.datadog.host || 'api.datadoghq.com',
        prefix: config.datadog.prefix || 'upcoach.',
        flushIntervalSeconds: 15,
      });
    } else {
      this.datadog = null as any;
    }

    // Initialize custom metrics storage
    this.customCounters = new Map();
    this.customGauges = new Map();
    this.customHistograms = new Map();
    this.customSummaries = new Map();

    // Initialize SLI/SLO tracking
    this.sliMetrics = new Map();
    this.alertThresholds = new Map();
    this.aggregations = new Map();

    // Initialize HTTP metrics
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.httpResponseSize = new Histogram({
      name: 'http_response_size_bytes',
      help: 'HTTP response size in bytes',
      labelNames: ['method', 'path', 'status'],
      buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
      registers: [this.registry],
    });

    this.httpRequestsInProgress = new Gauge({
      name: 'http_requests_in_progress',
      help: 'Number of HTTP requests currently in progress',
      labelNames: ['method', 'path'],
      registers: [this.registry],
    });

    // Initialize Database metrics
    this.dbQueriesTotal = new Counter({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table', 'status'],
      registers: [this.registry],
    });

    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });

    this.dbConnectionPoolSize = new Gauge({
      name: 'db_connection_pool_size',
      help: 'Total size of database connection pool',
      registers: [this.registry],
    });

    this.dbConnectionPoolUsed = new Gauge({
      name: 'db_connection_pool_used',
      help: 'Number of database connections currently in use',
      registers: [this.registry],
    });

    // Initialize Cache metrics
    this.cacheHitsTotal = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache', 'key_pattern'],
      registers: [this.registry],
    });

    this.cacheMissesTotal = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache', 'key_pattern'],
      registers: [this.registry],
    });

    this.cacheEvictionsTotal = new Counter({
      name: 'cache_evictions_total',
      help: 'Total number of cache evictions',
      labelNames: ['cache', 'reason'],
      registers: [this.registry],
    });

    this.cacheSizeBytes = new Gauge({
      name: 'cache_size_bytes',
      help: 'Current size of cache in bytes',
      labelNames: ['cache'],
      registers: [this.registry],
    });

    // Initialize Queue metrics
    this.queueDepth = new Gauge({
      name: 'queue_depth',
      help: 'Current depth of message queue',
      labelNames: ['queue'],
      registers: [this.registry],
    });

    this.queueProcessingDuration = new Histogram({
      name: 'queue_processing_duration_seconds',
      help: 'Queue message processing duration in seconds',
      labelNames: ['queue', 'status'],
      buckets: [0.1, 0.5, 1, 2.5, 5, 10, 30, 60, 120, 300],
      registers: [this.registry],
    });

    this.queueDeadLettersTotal = new Counter({
      name: 'queue_dead_letters_total',
      help: 'Total number of messages sent to dead letter queue',
      labelNames: ['queue', 'reason'],
      registers: [this.registry],
    });

    // Initialize Business metrics
    this.userSignupsTotal = new Counter({
      name: 'user_signups_total',
      help: 'Total number of user signups',
      labelNames: ['source', 'plan'],
      registers: [this.registry],
    });

    this.goalCompletionsTotal = new Counter({
      name: 'goal_completions_total',
      help: 'Total number of goal completions',
      labelNames: ['goal_type', 'user_tier'],
      registers: [this.registry],
    });

    this.revenueDollars = new Counter({
      name: 'revenue_dollars_total',
      help: 'Total revenue in dollars',
      labelNames: ['product', 'plan'],
      registers: [this.registry],
    });

    this.activeUsersGauge = new Gauge({
      name: 'active_users',
      help: 'Number of currently active users',
      labelNames: ['timeframe'],
      registers: [this.registry],
    });

    // Initialize Error metrics
    this.errorsTotal = new Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'severity', 'component'],
      registers: [this.registry],
    });

    this.unhandledExceptionsTotal = new Counter({
      name: 'unhandled_exceptions_total',
      help: 'Total number of unhandled exceptions',
      labelNames: ['type'],
      registers: [this.registry],
    });

    // Enable default Node.js metrics if configured
    if (config.enableDefaultMetrics !== false) {
      collectDefaultMetrics({ register: this.registry, prefix: 'nodejs_' });
    }

    // Set up periodic metric exports
    this.setupPeriodicExports();
  }

  private setupPeriodicExports(): void {
    // Export to CloudWatch every 60 seconds
    if (this.cloudWatch) {
      setInterval(() => {
        this.exportToCloudWatch().catch((error) => {
          console.error('Failed to export metrics to CloudWatch:', error);
        });
      }, 60000);
    }

    // Flush Datadog metrics buffer
    if (this.datadog) {
      setInterval(() => {
        try {
          this.datadog.flush();
        } catch (error) {
          console.error('Failed to flush Datadog metrics:', error);
        }
      }, 15000);
    }
  }

  public httpMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const start = Date.now();
      const path = this.normalizePath(req.path);
      const method = req.method;

      // Increment in-progress requests
      this.httpRequestsInProgress.inc({ method, path });

      // Capture response
      const originalSend = res.send.bind(res);
      res.send = (body: any): Response => {
        const duration = (Date.now() - start) / 1000;
        const status = res.statusCode.toString();
        const size = Buffer.byteLength(JSON.stringify(body));

        // Record metrics
        this.httpRequestsTotal.inc({ method, path, status });
        this.httpRequestDuration.observe({ method, path, status }, duration);
        this.httpResponseSize.observe({ method, path, status }, size);
        this.httpRequestsInProgress.dec({ method, path });

        // Export to StatsD
        this.statsD.increment(`http.requests.${method}.${status}`);
        this.statsD.timing(`http.duration.${method}`, duration * 1000);
        this.statsD.histogram(`http.size.${method}`, size);

        // Export to Datadog
        if (this.datadog) {
          this.datadog.increment(`http.requests`, 1, [`method:${method}`, `status:${status}`, `path:${path}`]);
          this.datadog.histogram(`http.duration`, duration, [`method:${method}`, `path:${path}`]);
        }

        // Emit event for alerting
        this.emit('http_request', { method, path, status, duration, size });

        return originalSend(body);
      };

      next();
    };
  }

  private normalizePath(path: string): string {
    // Replace UUIDs with :id
    return path.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
               .replace(/\/\d+/g, '/:id');
  }

  public recordDatabaseQuery(
    operation: string,
    table: string,
    duration: number,
    success: boolean
  ): void {
    const status = success ? 'success' : 'error';

    this.dbQueriesTotal.inc({ operation, table, status });
    this.dbQueryDuration.observe({ operation, table }, duration);

    this.statsD.increment(`db.queries.${operation}.${status}`);
    this.statsD.timing(`db.duration.${operation}`, duration * 1000);

    if (this.datadog) {
      this.datadog.increment('db.queries', 1, [`operation:${operation}`, `table:${table}`, `status:${status}`]);
      this.datadog.histogram('db.duration', duration, [`operation:${operation}`, `table:${table}`]);
    }

    this.emit('db_query', { operation, table, duration, success });
  }

  public updateDatabaseConnectionPool(total: number, used: number): void {
    this.dbConnectionPoolSize.set(total);
    this.dbConnectionPoolUsed.set(used);

    this.statsD.gauge('db.pool.total', total);
    this.statsD.gauge('db.pool.used', used);

    if (this.datadog) {
      this.datadog.gauge('db.pool.total', total);
      this.datadog.gauge('db.pool.used', used);
    }

    // Alert if connection pool is nearly exhausted
    const utilizationPercent = (used / total) * 100;
    if (utilizationPercent > 90) {
      this.emit('alert', {
        metric: 'db.pool.utilization',
        value: utilizationPercent,
        severity: 'high',
        message: `Database connection pool is ${utilizationPercent.toFixed(1)}% utilized`,
      });
    }
  }

  public recordCacheOperation(
    cache: string,
    operation: 'hit' | 'miss' | 'eviction',
    keyPattern: string = 'unknown'
  ): void {
    switch (operation) {
      case 'hit':
        this.cacheHitsTotal.inc({ cache, key_pattern: keyPattern });
        this.statsD.increment(`cache.hits.${cache}`);
        if (this.datadog) {
          this.datadog.increment('cache.hits', 1, [`cache:${cache}`, `pattern:${keyPattern}`]);
        }
        break;
      case 'miss':
        this.cacheMissesTotal.inc({ cache, key_pattern: keyPattern });
        this.statsD.increment(`cache.misses.${cache}`);
        if (this.datadog) {
          this.datadog.increment('cache.misses', 1, [`cache:${cache}`, `pattern:${keyPattern}`]);
        }
        break;
      case 'eviction':
        this.cacheEvictionsTotal.inc({ cache, reason: 'capacity' });
        this.statsD.increment(`cache.evictions.${cache}`);
        if (this.datadog) {
          this.datadog.increment('cache.evictions', 1, [`cache:${cache}`]);
        }
        break;
    }

    this.emit('cache_operation', { cache, operation, keyPattern });
  }

  public updateCacheSize(cache: string, sizeBytes: number): void {
    this.cacheSizeBytes.set({ cache }, sizeBytes);
    this.statsD.gauge(`cache.size.${cache}`, sizeBytes);

    if (this.datadog) {
      this.datadog.gauge('cache.size', sizeBytes, [`cache:${cache}`]);
    }
  }

  public updateQueueDepth(queue: string, depth: number): void {
    this.queueDepth.set({ queue }, depth);
    this.statsD.gauge(`queue.depth.${queue}`, depth);

    if (this.datadog) {
      this.datadog.gauge('queue.depth', depth, [`queue:${queue}`]);
    }

    // Alert if queue depth is too high
    if (depth > 1000) {
      this.emit('alert', {
        metric: 'queue.depth',
        value: depth,
        severity: depth > 5000 ? 'critical' : 'high',
        message: `Queue ${queue} depth is ${depth}`,
      });
    }
  }

  public recordQueueProcessing(
    queue: string,
    duration: number,
    success: boolean
  ): void {
    const status = success ? 'success' : 'error';

    this.queueProcessingDuration.observe({ queue, status }, duration);
    this.statsD.timing(`queue.processing.${queue}`, duration * 1000);

    if (this.datadog) {
      this.datadog.histogram('queue.processing', duration, [`queue:${queue}`, `status:${status}`]);
    }

    this.emit('queue_processing', { queue, duration, success });
  }

  public recordDeadLetter(queue: string, reason: string): void {
    this.queueDeadLettersTotal.inc({ queue, reason });
    this.statsD.increment(`queue.dead_letters.${queue}`);

    if (this.datadog) {
      this.datadog.increment('queue.dead_letters', 1, [`queue:${queue}`, `reason:${reason}`]);
    }

    this.emit('dead_letter', { queue, reason });
  }

  public recordUserSignup(source: string, plan: string): void {
    this.userSignupsTotal.inc({ source, plan });
    this.statsD.increment('business.signups');

    if (this.datadog) {
      this.datadog.increment('business.signups', 1, [`source:${source}`, `plan:${plan}`]);
    }

    this.emit('user_signup', { source, plan });
  }

  public recordGoalCompletion(goalType: string, userTier: string): void {
    this.goalCompletionsTotal.inc({ goal_type: goalType, user_tier: userTier });
    this.statsD.increment('business.goal_completions');

    if (this.datadog) {
      this.datadog.increment('business.goal_completions', 1, [`type:${goalType}`, `tier:${userTier}`]);
    }

    this.emit('goal_completion', { goalType, userTier });
  }

  public recordRevenue(product: string, plan: string, amount: number): void {
    this.revenueDollars.inc({ product, plan }, amount);
    this.statsD.increment('business.revenue', amount);

    if (this.datadog) {
      this.datadog.increment('business.revenue', amount, [`product:${product}`, `plan:${plan}`]);
    }

    this.emit('revenue', { product, plan, amount });
  }

  public updateActiveUsers(timeframe: 'dau' | 'mau' | 'wau', count: number): void {
    this.activeUsersGauge.set({ timeframe }, count);
    this.statsD.gauge(`business.active_users.${timeframe}`, count);

    if (this.datadog) {
      this.datadog.gauge('business.active_users', count, [`timeframe:${timeframe}`]);
    }
  }

  public recordError(type: string, severity: string, component: string): void {
    this.errorsTotal.inc({ type, severity, component });
    this.statsD.increment(`errors.${severity}.${type}`);

    if (this.datadog) {
      this.datadog.increment('errors', 1, [`type:${type}`, `severity:${severity}`, `component:${component}`]);
    }

    this.emit('error', { type, severity, component });

    // Alert on critical errors
    if (severity === 'critical') {
      this.emit('alert', {
        metric: 'errors.critical',
        value: 1,
        severity: 'critical',
        message: `Critical error in ${component}: ${type}`,
      });
    }
  }

  public recordUnhandledException(type: string): void {
    this.unhandledExceptionsTotal.inc({ type });
    this.statsD.increment('errors.unhandled');

    if (this.datadog) {
      this.datadog.increment('errors.unhandled', 1, [`type:${type}`]);
    }

    this.emit('alert', {
      metric: 'errors.unhandled',
      value: 1,
      severity: 'critical',
      message: `Unhandled exception: ${type}`,
    });
  }

  public createCounter(config: MetricConfig): void {
    const counter = new Counter({
      name: config.name,
      help: config.help,
      labelNames: config.labelNames || [],
      registers: [this.registry],
    });

    this.customCounters.set(config.name, counter);
  }

  public incrementCounter(name: string, labels: MetricLabel = {}, value: number = 1): void {
    const counter = this.customCounters.get(name);
    if (counter) {
      counter.inc(labels, value);

      this.statsD.increment(`custom.${name}`, value);

      if (this.datadog) {
        const tags = Object.entries(labels).map(([k, v]) => `${k}:${v}`);
        this.datadog.increment(`custom.${name}`, value, tags);
      }
    }
  }

  public createGauge(config: MetricConfig): void {
    const gauge = new Gauge({
      name: config.name,
      help: config.help,
      labelNames: config.labelNames || [],
      registers: [this.registry],
    });

    this.customGauges.set(config.name, gauge);
  }

  public setGauge(name: string, labels: MetricLabel = {}, value: number): void {
    const gauge = this.customGauges.get(name);
    if (gauge) {
      gauge.set(labels, value);

      this.statsD.gauge(`custom.${name}`, value);

      if (this.datadog) {
        const tags = Object.entries(labels).map(([k, v]) => `${k}:${v}`);
        this.datadog.gauge(`custom.${name}`, value, tags);
      }
    }
  }

  public incrementGauge(name: string, labels: MetricLabel = {}, value: number = 1): void {
    const gauge = this.customGauges.get(name);
    if (gauge) {
      gauge.inc(labels, value);
    }
  }

  public decrementGauge(name: string, labels: MetricLabel = {}, value: number = 1): void {
    const gauge = this.customGauges.get(name);
    if (gauge) {
      gauge.dec(labels, value);
    }
  }

  public createHistogram(config: MetricConfig): void {
    const histogram = new Histogram({
      name: config.name,
      help: config.help,
      labelNames: config.labelNames || [],
      buckets: config.buckets || [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.customHistograms.set(config.name, histogram);
  }

  public observeHistogram(name: string, labels: MetricLabel = {}, value: number): void {
    const histogram = this.customHistograms.get(name);
    if (histogram) {
      histogram.observe(labels, value);

      this.statsD.histogram(`custom.${name}`, value);

      if (this.datadog) {
        const tags = Object.entries(labels).map(([k, v]) => `${k}:${v}`);
        this.datadog.histogram(`custom.${name}`, value, tags);
      }
    }
  }

  public createSummary(config: MetricConfig): void {
    const summary = new Summary({
      name: config.name,
      help: config.help,
      labelNames: config.labelNames || [],
      percentiles: config.percentiles || [0.5, 0.9, 0.95, 0.99],
      registers: [this.registry],
    });

    this.customSummaries.set(config.name, summary);
  }

  public observeSummary(name: string, labels: MetricLabel = {}, value: number): void {
    const summary = this.customSummaries.get(name);
    if (summary) {
      summary.observe(labels, value);
    }
  }

  public configureSLI(config: SLIConfig): void {
    this.sliMetrics.set(config.name, {
      success: 0,
      total: 0,
      budget: config.errorBudget,
    });

    // Create custom gauge for SLI
    this.createGauge({
      name: `sli_${config.name}`,
      help: `Service Level Indicator for ${config.name}`,
      labelNames: ['window'],
    });

    // Create custom gauge for error budget
    this.createGauge({
      name: `slo_error_budget_${config.name}`,
      help: `Error budget remaining for ${config.name}`,
      labelNames: ['window'],
    });
  }

  public recordSLI(name: string, success: boolean): void {
    const sli = this.sliMetrics.get(name);
    if (sli) {
      sli.total++;
      if (success) {
        sli.success++;
      }

      const currentSLI = sli.success / sli.total;
      const errorRate = 1 - currentSLI;
      const budgetUsed = errorRate / (1 - sli.budget);
      const budgetRemaining = Math.max(0, 1 - budgetUsed);

      this.setGauge(`sli_${name}`, { window: '30d' }, currentSLI);
      this.setGauge(`slo_error_budget_${name}`, { window: '30d' }, budgetRemaining);

      // Alert if SLI drops below target or budget is exhausted
      if (currentSLI < sli.budget) {
        this.emit('alert', {
          metric: `sli.${name}`,
          value: currentSLI,
          severity: 'high',
          message: `SLI for ${name} is ${(currentSLI * 100).toFixed(2)}%, below target of ${(sli.budget * 100).toFixed(2)}%`,
        });
      }

      if (budgetRemaining < 0.1) {
        this.emit('alert', {
          metric: `slo.error_budget.${name}`,
          value: budgetRemaining,
          severity: budgetRemaining < 0.05 ? 'critical' : 'high',
          message: `Error budget for ${name} is ${(budgetRemaining * 100).toFixed(2)}% remaining`,
        });
      }
    }
  }

  public configureAlertThreshold(threshold: AlertThreshold): void {
    this.alertThresholds.set(threshold.metric, threshold);
  }

  public checkAlertThresholds(metric: string, value: number): void {
    const threshold = this.alertThresholds.get(metric);
    if (!threshold) return;

    let triggered = false;

    switch (threshold.operator) {
      case '>':
        triggered = value > threshold.value;
        break;
      case '<':
        triggered = value < threshold.value;
        break;
      case '>=':
        triggered = value >= threshold.value;
        break;
      case '<=':
        triggered = value <= threshold.value;
        break;
      case '==':
        triggered = value === threshold.value;
        break;
      case '!=':
        triggered = value !== threshold.value;
        break;
    }

    if (triggered) {
      this.emit('alert', {
        metric,
        value,
        severity: threshold.severity,
        message: `Metric ${metric} is ${value}, threshold is ${threshold.operator} ${threshold.value}`,
      });
    }
  }

  public aggregateMetric(name: string, values: number[]): MetricAggregation {
    if (values.length === 0) {
      return { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const count = values.length;

    const aggregation = { sum, avg, min, max, count };
    this.aggregations.set(name, aggregation);

    return aggregation;
  }

  public getAggregation(name: string): MetricAggregation | undefined {
    return this.aggregations.get(name);
  }

  public async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  public getRegistry(): Registry {
    return this.registry;
  }

  private async exportToCloudWatch(): Promise<void> {
    if (!this.cloudWatch) return;

    try {
      const metrics = await this.registry.getMetricsAsJSON();
      const metricData: CloudWatch.MetricDatum[] = [];

      for (const metric of metrics) {
        if (metric.type === 'counter' || metric.type === 'gauge') {
          for (const value of metric.values) {
            const dimensions: CloudWatch.Dimensions = [];

            if (value.labels) {
              for (const [key, val] of Object.entries(value.labels)) {
                dimensions.push({
                  Name: key,
                  Value: String(val),
                });
              }
            }

            metricData.push({
              MetricName: metric.name,
              Value: value.value,
              Timestamp: new Date(),
              Dimensions: dimensions.length > 0 ? dimensions : undefined,
              Unit: 'None',
            });
          }
        }
      }

      if (metricData.length > 0) {
        // CloudWatch allows max 20 metrics per request
        for (let i = 0; i < metricData.length; i += 20) {
          const batch = metricData.slice(i, i + 20);

          await this.cloudWatch.putMetricData({
            Namespace: 'UpCoach',
            MetricData: batch,
          }).promise();
        }
      }
    } catch (error) {
      console.error('Error exporting to CloudWatch:', error);
      throw error;
    }
  }

  public recordInfrastructureMetrics(metrics: InfrastructureMetrics): void {
    this.createGauge({
      name: 'infrastructure_cpu_percent',
      help: 'CPU utilization percentage',
    });
    this.setGauge('infrastructure_cpu_percent', {}, metrics.cpu);

    this.createGauge({
      name: 'infrastructure_memory_bytes',
      help: 'Memory usage in bytes',
    });
    this.setGauge('infrastructure_memory_bytes', {}, metrics.memory);

    this.createGauge({
      name: 'infrastructure_disk_bytes',
      help: 'Disk usage in bytes',
    });
    this.setGauge('infrastructure_disk_bytes', {}, metrics.disk);

    this.createGauge({
      name: 'infrastructure_network_bytes',
      help: 'Network usage in bytes',
    });
    this.setGauge('infrastructure_network_bytes', {}, metrics.network);

    this.createGauge({
      name: 'infrastructure_connections',
      help: 'Number of active connections',
    });
    this.setGauge('infrastructure_connections', {}, metrics.connections);

    // Send to StatsD
    this.statsD.gauge('infrastructure.cpu', metrics.cpu);
    this.statsD.gauge('infrastructure.memory', metrics.memory);
    this.statsD.gauge('infrastructure.disk', metrics.disk);
    this.statsD.gauge('infrastructure.network', metrics.network);
    this.statsD.gauge('infrastructure.connections', metrics.connections);

    // Send to Datadog
    if (this.datadog) {
      this.datadog.gauge('infrastructure.cpu', metrics.cpu);
      this.datadog.gauge('infrastructure.memory', metrics.memory);
      this.datadog.gauge('infrastructure.disk', metrics.disk);
      this.datadog.gauge('infrastructure.network', metrics.network);
      this.datadog.gauge('infrastructure.connections', metrics.connections);
    }

    // Check thresholds
    if (metrics.cpu > 80) {
      this.emit('alert', {
        metric: 'infrastructure.cpu',
        value: metrics.cpu,
        severity: metrics.cpu > 90 ? 'critical' : 'high',
        message: `CPU utilization is ${metrics.cpu.toFixed(1)}%`,
      });
    }

    if (metrics.memory > 0.9 * 8589934592) { // 90% of 8GB
      this.emit('alert', {
        metric: 'infrastructure.memory',
        value: metrics.memory,
        severity: 'high',
        message: `Memory usage is ${(metrics.memory / 1073741824).toFixed(2)}GB`,
      });
    }
  }

  public getBusinessMetrics(): BusinessMetrics {
    const userSignups = this.customCounters.get('user_signups_total');
    const goalCompletions = this.customCounters.get('goal_completions_total');
    const revenue = this.customCounters.get('revenue_dollars_total');
    const activeUsers = this.customGauges.get('active_users');

    return {
      signups: 0, // Would aggregate from counter
      conversions: 0, // Would aggregate from counter
      revenue: 0, // Would aggregate from counter
      activeUsers: 0, // Would get from gauge
      retention: 0, // Would calculate from historical data
    };
  }

  public reset(): void {
    this.registry.clear();
    this.customCounters.clear();
    this.customGauges.clear();
    this.customHistograms.clear();
    this.customSummaries.clear();
    this.sliMetrics.clear();
    this.alertThresholds.clear();
    this.aggregations.clear();
  }

  public close(): void {
    if (this.statsD) {
      this.statsD.close();
    }

    if (this.datadog) {
      this.datadog.flush();
    }

    this.removeAllListeners();
  }
}

export default MetricsCollector;
