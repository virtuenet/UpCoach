import * as Sentry from '@sentry/node';
import { createProfilingIntegration } from '@sentry/profiling-node';
import { StatsD } from 'node-dogstatsd';
import { performance, PerformanceObserver } from 'perf_hooks';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { performanceCacheService } from '../cache/PerformanceCacheService';

/**
 * Performance metric types
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  timestamp: number;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

/**
 * Profiling session data
 */
export interface ProfilingSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metrics: PerformanceMetric[];
  traces: unknown[];
  memoryUsage: NodeJS.MemoryUsage[];
  cpuUsage: NodeJS.CpuUsage[];
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  duration?: number; // milliseconds to wait before alerting
  channels: ('email' | 'slack' | 'sentry' | 'datadog')[];
}

/**
 * Performance thresholds
 */
export interface PerformanceThresholds {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  errorRate: number;
  databaseQueryTime: number;
  cacheHitRate: number;
}

/**
 * Comprehensive performance profiler and monitoring service
 */
export class PerformanceProfiler extends EventEmitter {
  private static instance: PerformanceProfiler;
  private dogstatsd?: StatsD;
  private performanceObserver?: PerformanceObserver;
  private activeSessions: Map<string, ProfilingSession> = new Map();
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: AlertConfig[] = [];
  private isEnabled: boolean = true;

  // Performance thresholds
  private thresholds: PerformanceThresholds = {
    responseTime: 1000,      // 1 second
    memoryUsage: 512 * 1024 * 1024,  // 512MB
    cpuUsage: 80,           // 80%
    errorRate: 5,           // 5%
    databaseQueryTime: 500,  // 500ms
    cacheHitRate: 90        // 90%
  };

  // Metric aggregation windows
  private readonly windows = {
    realtime: 60000,     // 1 minute
    short: 300000,       // 5 minutes
    medium: 1800000,     // 30 minutes
    long: 3600000        // 1 hour
  };

  private constructor() {
    super();
    this.initializeMonitoring();
  }

  public static getInstance(): PerformanceProfiler {
    if (!PerformanceProfiler.instance) {
      PerformanceProfiler.instance = new PerformanceProfiler();
    }
    return PerformanceProfiler.instance;
  }

  /**
   * Initialize monitoring services
   */
  private initializeMonitoring(): void {
    this.setupSentry();
    this.setupDataDog();
    this.setupPerformanceObserver();
    this.setupMemoryMonitoring();
    this.setupCpuMonitoring();
    this.setupAutomaticProfiling();
  }

  /**
   * Setup Sentry for error tracking and performance monitoring
   */
  private setupSentry(): void {
    if (!process.env.SENTRY_DSN) {
      logger.warn('Sentry DSN not configured');
      return;
    }

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
      integrations: [
        createProfilingIntegration(),
        Sentry.httpIntegration({ tracing: true }),
        Sentry.expressIntegration({ router: true }),
        Sentry.postgresIntegration(),
        Sentry.redisIntegration()
      ],
      beforeSend: (event) => {
        // Filter out non-critical errors in development
        if (process.env.NODE_ENV === 'development' && event.level === 'warning') {
          return null;
        }
        return event;
      }
    });

    logger.info('Sentry monitoring initialized');
  }

  /**
   * Setup DataDog StatsD client
   */
  private setupDataDog(): void {
    if (!process.env.DATADOG_API_KEY) {
      logger.warn('DataDog API key not configured');
      return;
    }

    this.dogstatsd = new StatsD({
      host: process.env.DATADOG_HOST || 'localhost',
      port: parseInt(process.env.DATADOG_PORT || '8125'),
      globalTags: {
        service: 'upcoach-api',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    });

    logger.info('DataDog monitoring initialized');
  }

  /**
   * Setup Node.js Performance Observer
   */
  private setupPerformanceObserver(): void {
    this.performanceObserver = new PerformanceObserver((list) => {
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

  /**
   * Setup memory monitoring
   */
  private setupMemoryMonitoring(): void {
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

      // Check memory threshold
      if (memUsage.heapUsed > this.thresholds.memoryUsage) {
        this.triggerAlert('memory.heapUsed', memUsage.heapUsed);
      }

    }, 30000); // Every 30 seconds
  }

  /**
   * Setup CPU monitoring
   */
  private setupCpuMonitoring(): void {
    let lastCpuUsage = process.cpuUsage();

    setInterval(() => {
      const currentCpuUsage = process.cpuUsage(lastCpuUsage);
      const cpuPercent = (currentCpuUsage.user + currentCpuUsage.system) / 1000000 * 100 / 30; // 30 second interval

      this.recordMetric({
        name: 'cpu.usage',
        value: cpuPercent,
        unit: 'percent',
        timestamp: Date.now()
      });

      // Check CPU threshold
      if (cpuPercent > this.thresholds.cpuUsage) {
        this.triggerAlert('cpu.usage', cpuPercent);
      }

      lastCpuUsage = process.cpuUsage();
    }, 30000);
  }

  /**
   * Setup automatic profiling for slow operations
   */
  private setupAutomaticProfiling(): void {
    // Auto-profile slow HTTP requests
    this.on('slowRequest', (data) => {
      this.startProfiling(`slow_request_${data.url}`, {
        url: data.url,
        method: data.method,
        duration: data.duration
      });
    });

    // Auto-profile memory spikes
    this.on('memorySpike', (data) => {
      this.startProfiling(`memory_spike_${Date.now()}`, {
        memoryUsage: data.memoryUsage,
        threshold: this.thresholds.memoryUsage
      });
    });
  }

  /**
   * Start a new profiling session
   */
  public startProfiling(sessionId: string, metadata?: unknown): string {
    const session: ProfilingSession = {
      sessionId,
      startTime: Date.now(),
      metrics: [],
      traces: [],
      memoryUsage: [],
      cpuUsage: []
    };

    this.activeSessions.set(sessionId, session);

    // Start performance mark
    performance.mark(`profile_start_${sessionId}`);

    // Start Sentry transaction if available
    if (typeof Sentry.startTransaction === 'function') {
      const transaction = Sentry.startTransaction({
        name: `profile_${sessionId}`,
        op: 'profiling',
        data: metadata
      });

      session.traces.push(transaction);
    }

    logger.info('Profiling session started', { sessionId, metadata });

    return sessionId;
  }

  /**
   * Stop profiling session
   */
  public stopProfiling(sessionId: string): ProfilingSession | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      logger.warn('Profiling session not found', { sessionId });
      return null;
    }

    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;

    // End performance mark
    performance.mark(`profile_end_${sessionId}`);
    performance.measure(`profile_${sessionId}`, `profile_start_${sessionId}`, `profile_end_${sessionId}`);

    // End Sentry transactions
    session.traces.forEach(trace => {
      if (trace && typeof trace.finish === 'function') {
        trace.finish();
      }
    });

    this.activeSessions.delete(sessionId);

    // Store session data
    this.storeProfilingSession(session);

    logger.info('Profiling session completed', {
      sessionId,
      duration: session.duration,
      metricsCount: session.metrics.length
    });

    return session;
  }

  /**
   * Record a performance metric
   */
  public recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    // Store in local metrics cache
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }

    const metricHistory = this.metrics.get(metric.name)!;
    metricHistory.push(metric);

    // Keep only recent metrics (last hour)
    const cutoff = Date.now() - this.windows.long;
    this.metrics.set(metric.name, metricHistory.filter(m => m.timestamp > cutoff));

    // Add to active profiling sessions
    for (const session of this.activeSessions.values()) {
      session.metrics.push(metric);
    }

    // Send to DataDog if available
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

    // Cache metric for API access
    this.cacheMetric(metric);

    // Check alerts
    this.checkAlerts(metric);

    // Emit event for real-time monitoring
    this.emit('metric', metric);
  }

  /**
   * Measure function execution time
   */
  public async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const startTime = performance.now();
    const startMark = `${name}_start_${Date.now()}`;

    performance.mark(startMark);

    try {
      const result = await fn();
      const duration = performance.now() - startTime;

      this.recordMetric({
        name: `function.${name}`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { ...tags, status: 'success' }
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.recordMetric({
        name: `function.${name}`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { ...tags, status: 'error' }
      });

      throw error;
    } finally {
      performance.clearMarks(startMark);
    }
  }

  /**
   * Measure synchronous function execution
   */
  public measureSync<T>(
    name: string,
    fn: () => T,
    tags?: Record<string, string>
  ): T {
    const startTime = performance.now();

    try {
      const result = fn();
      const duration = performance.now() - startTime;

      this.recordMetric({
        name: `function.${name}`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { ...tags, status: 'success' }
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

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

  /**
   * Get performance metrics for a time window
   */
  public getMetrics(
    metricName?: string,
    timeWindow: keyof typeof this.windows = 'medium'
  ): PerformanceMetric[] {
    const cutoff = Date.now() - this.windows[timeWindow];

    if (metricName) {
      const metrics = this.metrics.get(metricName) || [];
      return metrics.filter(m => m.timestamp > cutoff);
    }

    const allMetrics: PerformanceMetric[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics.filter(m => m.timestamp > cutoff));
    }

    return allMetrics.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get aggregated metrics
   */
  public getAggregatedMetrics(
    metricName: string,
    timeWindow: keyof typeof this.windows = 'medium'
  ): {
    avg: number;
    min: number;
    max: number;
    count: number;
    p50: number;
    p95: number;
    p99: number;
  } {
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

  /**
   * Add performance alert
   */
  public addAlert(config: AlertConfig): void {
    this.alerts.push(config);
    logger.info('Performance alert added', config);
  }

  /**
   * Check alerts for a metric
   */
  private checkAlerts(metric: PerformanceMetric): void {
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

  /**
   * Trigger performance alert
   */
  private triggerAlert(metricName: string, value: number, config?: AlertConfig): void {
    const alertData = {
      metric: metricName,
      value,
      threshold: config?.threshold,
      timestamp: Date.now()
    };

    logger.warn('Performance alert triggered', alertData);

    // Send to Sentry
    Sentry.captureMessage(`Performance Alert: ${metricName}`, {
      level: 'warning',
      extra: alertData
    });

    // Emit alert event
    this.emit('alert', alertData);
  }

  /**
   * Store profiling session data
   */
  private async storeProfilingSession(session: ProfilingSession): Promise<void> {
    try {
      await performanceCacheService.set(
        `profiling_session:${session.sessionId}`,
        session,
        3600 // 1 hour
      );
    } catch (error) {
      logger.error('Failed to store profiling session', error);
    }
  }

  /**
   * Cache metric for API access
   */
  private async cacheMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const key = `metric:${metric.name}:${Math.floor(metric.timestamp / 60000)}`; // 1-minute buckets
      await performanceCacheService.set(key, metric, 3600); // 1 hour
    } catch (error) {
      // Silently fail metric caching
    }
  }

  /**
   * Generate performance report
   */
  public generateReport(timeWindow: keyof typeof this.windows = 'medium'): unknown {
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
      metrics: {} as Record<string, any>,
      alerts: this.alerts.length,
      activeSessions: this.activeSessions.size
    };

    // Calculate aggregated metrics for each metric name
    for (const metricName of metricNames) {
      report.metrics[metricName] = this.getAggregatedMetrics(metricName, timeWindow);
    }

    // Calculate summary statistics
    if (report.metrics['api.response_time']) {
      report.summary.averageResponseTime = report.metrics['api.response_time'].avg;
    }

    return report;
  }

  /**
   * Enable/disable profiling
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    logger.info(`Performance profiling ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    if (this.dogstatsd) {
      this.dogstatsd.close();
    }

    this.activeSessions.clear();
    this.metrics.clear();

    logger.info('Performance profiler cleaned up');
  }
}

// Export singleton instance
export const performanceProfiler = PerformanceProfiler.getInstance();

// Export utility functions
export const ProfilerUtils = {
  // Create a profiling decorator
  profile: (name?: string) => {
    return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      const methodName = name || `${target.constructor.name}.${propertyKey}`;

      descriptor.value = async function (...args: unknown[]) {
        return performanceProfiler.measureAsync(methodName, () => originalMethod.apply(this, args));
      };

      return descriptor;
    };
  },

  // Middleware for Express.js route profiling
  expressMiddleware: () => {
    return (req: unknown, res: unknown, next: unknown) => {
      const startTime = Date.now();
      const routeName = `${req.method} ${req.route?.path || req.path}`;

      res.on('finish', () => {
        const duration = Date.now() - startTime;

        performanceProfiler.recordMetric({
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

        // Trigger slow request profiling
        if (duration > performanceProfiler['thresholds'].responseTime) {
          performanceProfiler.emit('slowRequest', {
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

export default PerformanceProfiler;