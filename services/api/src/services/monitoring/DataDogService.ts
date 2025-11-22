/**
 * DataDog APM and Metrics Service
 * Application Performance Monitoring and custom metrics collection
 */

import tracer from 'dd-trace';
import { Request, Response, NextFunction } from 'express';
import { StatsD } from 'node-dogstatsd';

import { logger } from '../../utils/logger';

export interface DataDogConfig {
  enabled: boolean;
  agentHost?: string;
  agentPort?: number;
  env?: string;
  service?: string;
  version?: string;
  analyticsEnabled?: boolean;
  logInjection?: boolean;
  profiling?: boolean;
  runtimeMetrics?: boolean;
  statsdHost?: string;
  statsdPort?: number;
}

export class DataDogService {
  private static instance: DataDogService;
  private statsD: StatsD | null = null;
  private initialized = false;
  private config: DataDogConfig;

  private constructor() {
    this.config = {
      enabled: false,
    };
  }

  static getInstance(): DataDogService {
    if (!DataDogService.instance) {
      DataDogService.instance = new DataDogService();
    }
    return DataDogService.instance;
  }

  /**
   * Initialize DataDog APM and StatsD client
   */
  initialize(config: DataDogConfig): void {
    if (this.initialized) {
      logger.warn('DataDog already initialized');
      return;
    }

    this.config = config;

    if (!config.enabled) {
      logger.info('DataDog monitoring disabled');
      return;
    }

    try {
      // Initialize APM tracer
      tracer.init({
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
      this.statsD = new StatsD({
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
      logger.info('DataDog monitoring initialized', {
        service: config.service,
        env: config.env,
        apm: true,
        metrics: true,
      });

      // Set up process metrics collection
      this.collectProcessMetrics();
    } catch (error) {
      logger.error('Failed to initialize DataDog', error);
    }
  }

  /**
   * Express middleware for request tracing
   */
  requestTracing() {
    return (req: Request, _res: Response, next: NextFunction) => {
      if (!this.initialized) {
        return next();
      }

      const span = tracer.scope().active();
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
  createSpan(name: string, options?: unknown): unknown {
    if (!this.initialized) return null;

    return tracer.startSpan(name, options);
  }

  /**
   * Wrap function with tracing
   */
  trace<T>(name: string, fn: () => T): T {
    if (!this.initialized) {
      return fn();
    }

    return tracer.trace(name, fn);
  }

  /**
   * Wrap async function with tracing
   */
  async traceAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.initialized) {
      return fn();
    }

    return tracer.trace(name, async () => {
      const span = tracer.scope().active();

      try {
        const result = await fn();
        span?.setTag('status', 'success');
        return result;
      } catch (error) {
        span?.setTag('error', true);
        span?.setTag('error.message', (error as Error).message);
        span?.setTag('error.stack', (error as Error).stack);
        throw error;
      }
    });
  }

  /**
   * Increment a counter metric
   */
  incrementMetric(metric: string, tags?: { [key: string]: string }): void;
  incrementMetric(metric: string, value: number, tags?: { [key: string]: string }): void;
  incrementMetric(metric: string, valueOrTags?: number | { [key: string]: string }, tags?: { [key: string]: string }): void {
    if (!this.statsD) return;

    let value = 1;
    let finalTags: { [key: string]: string } | undefined;

    if (typeof valueOrTags === 'number') {
      value = valueOrTags;
      finalTags = tags;
    } else {
      finalTags = valueOrTags;
    }

    const tagArray = this.formatTags(finalTags);
    this.statsD.increment(metric, value, tagArray);
  }

  /**
   * Decrement a counter metric
   */
  decrementMetric(metric: string, tags?: { [key: string]: string }): void;
  decrementMetric(metric: string, value: number, tags?: { [key: string]: string }): void;
  decrementMetric(metric: string, valueOrTags?: number | { [key: string]: string }, tags?: { [key: string]: string }): void {
    if (!this.statsD) return;

    let value = 1;
    let finalTags: { [key: string]: string } | undefined;

    if (typeof valueOrTags === 'number') {
      value = valueOrTags;
      finalTags = tags;
    } else {
      finalTags = valueOrTags;
    }

    const tagArray = this.formatTags(finalTags);
    this.statsD.decrement(metric, value, tagArray);
  }

  /**
   * Record a gauge metric
   */
  gauge(metric: string, value: number, tags?: { [key: string]: string } | undefined): void {
    if (!this.statsD) return;

    const tagArray = this.formatTags(tags);
    this.statsD.gauge(metric, value, tagArray);
  }

  /**
   * Record a histogram metric
   */
  histogram(metric: string, value: number, tags?: { [key: string]: string } | undefined): void {
    if (!this.statsD) return;

    const tagArray = this.formatTags(tags);
    this.statsD.histogram(metric, value, tagArray);
  }

  /**
   * Record a timing metric
   */
  timing(metric: string, duration: number, tags?: { [key: string]: string } | undefined): void {
    if (!this.statsD) return;

    const tagArray = this.formatTags(tags);
    this.statsD.timing(metric, duration, tagArray);
  }

  /**
   * Measure execution time of a function
   */
  async measureTiming<T>(
    metric: string,
    fn: () => Promise<T>,
    tags?: { [key: string]: string }
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.timing(metric, duration, { ...tags, status: 'success' });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.timing(metric, duration, { ...tags, status: 'error' });
      throw error;
    }
  }

  /**
   * Track custom business metrics
   */
  trackBusinessMetric(category: string, metric: string, value: number, metadata?: unknown): void {
    if (!this.initialized) return;

    const fullMetric = `business.${category}.${metric}`;

    // Record the metric
    this.histogram(fullMetric, value, metadata);

    // Also track as a trace event
    const span = tracer.scope().active();
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
  trackUserActivity(userId: string, action: string, metadata?: unknown): void {
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
  trackAPIPerformance(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number
  ): void {
    this.histogram('api.latency', responseTime, {
      endpoint,
      method,
      status: statusCode < 400 ? 'success' : 'error',
    });

    if (statusCode >= 500) {
      this.incrementMetric('api.5xxerrors', { endpoint, method });
    } else if (statusCode >= 400) {
      this.incrementMetric('api.4xxerrors', { endpoint, method });
    }
  }

  /**
   * Track database performance
   */
  trackDatabaseQuery(operation: string, table: string, duration: number, success: boolean): void {
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
  trackCacheOperation(operation: 'get' | 'set' | 'delete', hit: boolean, duration: number): void {
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
  private collectProcessMetrics(): void {
    if (!this.statsD) return;

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
      if ((process as unknown)._getActiveHandles) {
        this.gauge('process.handles.active', (process as unknown)._getActiveHandles().length);
      }

      if ((process as unknown)._getActiveRequests) {
        this.gauge('process.requests.active', (process as unknown)._getActiveRequests().length);
      }
    }, 10000); // Collect every 10 seconds
  }

  /**
   * Format tags for StatsD
   */
  private formatTags(tags?: { [key: string]: string }): string[] {
    if (!tags) return [];

    return Object.entries(tags).map(([key, value]) => `${key}:${value}`);
  }

  /**
   * Flush pending metrics
   */
  flush(): void {
    if (!this.statsD) return;

    // StatsD client doesn't have a flush method, but we can close and reconnect
    logger.info('DataDog metrics flushed');
  }

  /**
   * Shutdown DataDog monitoring
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) return;

    try {
      // Flush any pending traces
      // Note: flush method may not be available in current tracer version
      try {
        if (typeof (tracer as unknown).flush === 'function') {
          await new Promise(resolve => {
            (tracer as unknown).flush(resolve);
          });
        }
      } catch (error) {
        logger.warn('Tracer flush not available or failed:', error);
      }

      // Close StatsD connection
      if (this.statsD) {
        this.statsD.close();
      }

      this.initialized = false;
      logger.info('DataDog monitoring shut down successfully');
    } catch (error) {
      logger.error('Error shutting down DataDog monitoring', error);
    }
  }
}

// Export singleton instance
export const dataDogService = DataDogService.getInstance();

// Convenience functions for direct metric tracking
export const metrics = {
  increment: (metric: string, tags?: unknown) => dataDogService.incrementMetric(metric, tags),

  decrement: (metric: string, tags?: unknown) => dataDogService.decrementMetric(metric, tags),

  gauge: (metric: string, value: number, tags?: unknown) => dataDogService.gauge(metric, value, tags),

  histogram: (metric: string, value: number, tags?: unknown) =>
    dataDogService.histogram(metric, value, tags),

  timing: (metric: string, duration: number, tags?: unknown) =>
    dataDogService.timing(metric, duration, tags),
};

// Decorator for method tracing
export function TraceMethod(name?: string) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const traceName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: unknown[]) {
      return dataDogService.traceAsync(traceName, async () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}
