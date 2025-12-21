/**
 * Application Performance Monitoring Service
 *
 * Comprehensive APM for tracking application performance,
 * distributed tracing, and real-time metrics collection.
 */

import { EventEmitter } from 'events';

// Transaction types
export type TransactionType =
  | 'http-request'
  | 'database-query'
  | 'cache-operation'
  | 'external-api'
  | 'background-job'
  | 'websocket'
  | 'ai-inference';

// Transaction status
export type TransactionStatus = 'ok' | 'error' | 'timeout' | 'cancelled';

// Transaction context
export interface TransactionContext {
  id: string;
  traceId: string;
  parentId: string | null;
  name: string;
  type: TransactionType;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: TransactionStatus;
  tags: Record<string, string | number | boolean>;
  spans: Span[];
  error?: ErrorInfo;
  metrics: TransactionMetrics;
}

// Span for sub-operations
export interface Span {
  id: string;
  parentId: string | null;
  name: string;
  type: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: TransactionStatus;
  tags: Record<string, string | number | boolean>;
  data?: Record<string, unknown>;
}

// Error info
export interface ErrorInfo {
  type: string;
  message: string;
  stack?: string;
  code?: string;
  metadata?: Record<string, unknown>;
}

// Transaction metrics
export interface TransactionMetrics {
  memoryUsageBefore: number;
  memoryUsageAfter?: number;
  memoryDelta?: number;
  cpuTimeBefore: number;
  cpuTimeAfter?: number;
  cpuDelta?: number;
  dbQueryCount: number;
  dbQueryTime: number;
  cacheHits: number;
  cacheMisses: number;
  externalCalls: number;
  externalCallTime: number;
}

// APM configuration
export interface APMConfig {
  enabled: boolean;
  serviceName: string;
  environment: string;
  sampleRate: number;
  slowThreshold: number;
  errorThreshold: number;
  metricsInterval: number;
  maxTransactions: number;
  enableProfiling: boolean;
  enableDistributedTracing: boolean;
}

// Performance bucket
export interface PerformanceBucket {
  name: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  errorCount: number;
  errorRate: number;
  throughput: number;
  lastUpdated: number;
}

// System metrics
export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    user: number;
    system: number;
    idle: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    rss: number;
  };
  eventLoop: {
    latency: number;
    utilization: number;
  };
  gc?: {
    collections: number;
    pauseTime: number;
    reclaimedBytes: number;
  };
}

// APM snapshot
export interface APMSnapshot {
  timestamp: number;
  serviceName: string;
  environment: string;
  uptime: number;
  transactions: {
    total: number;
    successful: number;
    failed: number;
    avgDuration: number;
  };
  performance: Record<string, PerformanceBucket>;
  system: SystemMetrics;
  activeTransactions: number;
  slowTransactions: number;
  errorTransactions: number;
}

export class APMService extends EventEmitter {
  private config: APMConfig;
  private activeTransactions: Map<string, TransactionContext> = new Map();
  private completedTransactions: TransactionContext[] = [];
  private performanceBuckets: Map<string, PerformanceBucket> = new Map();
  private systemMetrics: SystemMetrics[] = [];
  private startTime: number;
  private metricsInterval: ReturnType<typeof setInterval> | null = null;
  private transactionCounts = {
    total: 0,
    successful: 0,
    failed: 0,
    slow: 0,
  };

  constructor(config?: Partial<APMConfig>) {
    super();
    this.config = {
      enabled: true,
      serviceName: 'upcoach-api',
      environment: process.env.NODE_ENV || 'development',
      sampleRate: 1.0,
      slowThreshold: 1000,
      errorThreshold: 0.05,
      metricsInterval: 10000,
      maxTransactions: 10000,
      enableProfiling: false,
      enableDistributedTracing: true,
      ...config,
    };
    this.startTime = Date.now();
  }

  /**
   * Initialize APM
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) return;

    // Start metrics collection
    this.startMetricsCollection();

    console.log(`APM initialized for ${this.config.serviceName} in ${this.config.environment}`);
  }

  /**
   * Shutdown APM
   */
  async shutdown(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    // Flush remaining transactions
    await this.flush();

    console.log('APM shutdown complete');
  }

  /**
   * Start a transaction
   */
  startTransaction(
    name: string,
    type: TransactionType,
    options?: {
      traceId?: string;
      parentId?: string;
      tags?: Record<string, string | number | boolean>;
    }
  ): string {
    if (!this.config.enabled) return '';

    // Apply sampling
    if (Math.random() > this.config.sampleRate) {
      return '';
    }

    const id = this.generateId();
    const traceId = options?.traceId || this.generateId();
    const now = Date.now();

    const transaction: TransactionContext = {
      id,
      traceId,
      parentId: options?.parentId || null,
      name,
      type,
      startTime: now,
      status: 'ok',
      tags: {
        service: this.config.serviceName,
        environment: this.config.environment,
        ...options?.tags,
      },
      spans: [],
      metrics: {
        memoryUsageBefore: process.memoryUsage().heapUsed,
        cpuTimeBefore: process.cpuUsage().user,
        dbQueryCount: 0,
        dbQueryTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
        externalCalls: 0,
        externalCallTime: 0,
      },
    };

    this.activeTransactions.set(id, transaction);
    this.transactionCounts.total++;

    this.emit('transaction:start', transaction);

    return id;
  }

  /**
   * End a transaction
   */
  endTransaction(
    transactionId: string,
    options?: {
      status?: TransactionStatus;
      error?: ErrorInfo;
      tags?: Record<string, string | number | boolean>;
    }
  ): void {
    if (!this.config.enabled || !transactionId) return;

    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) return;

    const now = Date.now();
    transaction.endTime = now;
    transaction.duration = now - transaction.startTime;
    transaction.status = options?.status || 'ok';

    if (options?.error) {
      transaction.error = options.error;
      transaction.status = 'error';
      this.transactionCounts.failed++;
    } else {
      this.transactionCounts.successful++;
    }

    if (options?.tags) {
      transaction.tags = { ...transaction.tags, ...options.tags };
    }

    // Calculate memory and CPU delta
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    transaction.metrics.memoryUsageAfter = memUsage.heapUsed;
    transaction.metrics.memoryDelta = memUsage.heapUsed - transaction.metrics.memoryUsageBefore;
    transaction.metrics.cpuTimeAfter = cpuUsage.user;
    transaction.metrics.cpuDelta = cpuUsage.user - transaction.metrics.cpuTimeBefore;

    // Track slow transactions
    if (transaction.duration > this.config.slowThreshold) {
      this.transactionCounts.slow++;
      this.emit('transaction:slow', transaction);
    }

    // Update performance bucket
    this.updatePerformanceBucket(transaction);

    // Move to completed
    this.activeTransactions.delete(transactionId);
    this.completedTransactions.push(transaction);

    // Limit completed transactions
    if (this.completedTransactions.length > this.config.maxTransactions) {
      this.completedTransactions = this.completedTransactions.slice(-this.config.maxTransactions / 2);
    }

    this.emit('transaction:end', transaction);
  }

  /**
   * Start a span within a transaction
   */
  startSpan(
    transactionId: string,
    name: string,
    type: string,
    options?: {
      parentSpanId?: string;
      tags?: Record<string, string | number | boolean>;
    }
  ): string {
    if (!this.config.enabled || !transactionId) return '';

    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) return '';

    const id = this.generateId();
    const span: Span = {
      id,
      parentId: options?.parentSpanId || transaction.id,
      name,
      type,
      startTime: Date.now(),
      status: 'ok',
      tags: options?.tags || {},
    };

    transaction.spans.push(span);
    return id;
  }

  /**
   * End a span
   */
  endSpan(
    transactionId: string,
    spanId: string,
    options?: {
      status?: TransactionStatus;
      data?: Record<string, unknown>;
      tags?: Record<string, string | number | boolean>;
    }
  ): void {
    if (!this.config.enabled || !transactionId || !spanId) return;

    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) return;

    const span = transaction.spans.find((s) => s.id === spanId);
    if (!span) return;

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = options?.status || 'ok';

    if (options?.data) {
      span.data = options.data;
    }

    if (options?.tags) {
      span.tags = { ...span.tags, ...options.tags };
    }

    // Update transaction metrics based on span type
    switch (span.type) {
      case 'database':
        transaction.metrics.dbQueryCount++;
        transaction.metrics.dbQueryTime += span.duration;
        break;
      case 'cache':
        if (span.data?.hit) {
          transaction.metrics.cacheHits++;
        } else {
          transaction.metrics.cacheMisses++;
        }
        break;
      case 'external':
        transaction.metrics.externalCalls++;
        transaction.metrics.externalCallTime += span.duration;
        break;
    }
  }

  /**
   * Record an error
   */
  recordError(
    transactionId: string,
    error: Error,
    options?: {
      code?: string;
      metadata?: Record<string, unknown>;
    }
  ): void {
    if (!this.config.enabled || !transactionId) return;

    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) return;

    transaction.error = {
      type: error.name,
      message: error.message,
      stack: error.stack,
      code: options?.code,
      metadata: options?.metadata,
    };

    this.emit('error', { transaction, error: transaction.error });
  }

  /**
   * Add tags to transaction
   */
  addTags(
    transactionId: string,
    tags: Record<string, string | number | boolean>
  ): void {
    if (!this.config.enabled || !transactionId) return;

    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) return;

    transaction.tags = { ...transaction.tags, ...tags };
  }

  /**
   * Update performance bucket
   */
  private updatePerformanceBucket(transaction: TransactionContext): void {
    const bucketName = `${transaction.type}:${transaction.name}`;
    let bucket = this.performanceBuckets.get(bucketName);

    if (!bucket) {
      bucket = {
        name: bucketName,
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        errorCount: 0,
        errorRate: 0,
        throughput: 0,
        lastUpdated: Date.now(),
      };
      this.performanceBuckets.set(bucketName, bucket);
    }

    const duration = transaction.duration || 0;
    bucket.count++;
    bucket.totalDuration += duration;
    bucket.avgDuration = bucket.totalDuration / bucket.count;
    bucket.minDuration = Math.min(bucket.minDuration, duration);
    bucket.maxDuration = Math.max(bucket.maxDuration, duration);

    if (transaction.status === 'error') {
      bucket.errorCount++;
    }
    bucket.errorRate = bucket.errorCount / bucket.count;
    bucket.lastUpdated = Date.now();

    // Calculate throughput (requests per second)
    const timeWindow = 60000; // 1 minute
    const recentTransactions = this.completedTransactions.filter(
      (t) =>
        t.name === transaction.name &&
        t.type === transaction.type &&
        t.endTime &&
        Date.now() - t.endTime < timeWindow
    );
    bucket.throughput = recentTransactions.length / (timeWindow / 1000);

    // Calculate percentiles
    const durations = recentTransactions
      .map((t) => t.duration || 0)
      .sort((a, b) => a - b);

    if (durations.length > 0) {
      bucket.p50 = this.percentile(durations, 50);
      bucket.p90 = this.percentile(durations, 90);
      bucket.p95 = this.percentile(durations, 95);
      bucket.p99 = this.percentile(durations, 99);
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.metricsInterval);
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();

    const metrics: SystemMetrics = {
      timestamp: Date.now(),
      cpu: {
        usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
        user: cpuUsage.user / 1000000,
        system: cpuUsage.system / 1000000,
        idle: 0, // Would need OS-level metrics for accurate idle
      },
      memory: {
        total: 0, // Would need OS-level metrics
        used: memUsage.heapUsed,
        free: memUsage.heapTotal - memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        rss: memUsage.rss,
      },
      eventLoop: {
        latency: this.measureEventLoopLatency(),
        utilization: 0, // Would need more complex measurement
      },
    };

    this.systemMetrics.push(metrics);

    // Keep last 1000 samples
    if (this.systemMetrics.length > 1000) {
      this.systemMetrics = this.systemMetrics.slice(-1000);
    }

    this.emit('metrics', metrics);
  }

  /**
   * Measure event loop latency
   */
  private measureEventLoopLatency(): number {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const end = process.hrtime.bigint();
      const latency = Number(end - start) / 1000000; // Convert to ms
      return latency;
    });
    return 0; // Async, so return 0 for now
  }

  /**
   * Get APM snapshot
   */
  getSnapshot(): APMSnapshot {
    const totalDuration = this.completedTransactions.reduce(
      (sum, t) => sum + (t.duration || 0),
      0
    );

    return {
      timestamp: Date.now(),
      serviceName: this.config.serviceName,
      environment: this.config.environment,
      uptime: Date.now() - this.startTime,
      transactions: {
        total: this.transactionCounts.total,
        successful: this.transactionCounts.successful,
        failed: this.transactionCounts.failed,
        avgDuration:
          this.completedTransactions.length > 0
            ? totalDuration / this.completedTransactions.length
            : 0,
      },
      performance: Object.fromEntries(this.performanceBuckets),
      system: this.systemMetrics[this.systemMetrics.length - 1] || this.getEmptySystemMetrics(),
      activeTransactions: this.activeTransactions.size,
      slowTransactions: this.transactionCounts.slow,
      errorTransactions: this.transactionCounts.failed,
    };
  }

  /**
   * Get empty system metrics
   */
  private getEmptySystemMetrics(): SystemMetrics {
    return {
      timestamp: Date.now(),
      cpu: { usage: 0, user: 0, system: 0, idle: 0 },
      memory: { total: 0, used: 0, free: 0, heapTotal: 0, heapUsed: 0, external: 0, rss: 0 },
      eventLoop: { latency: 0, utilization: 0 },
    };
  }

  /**
   * Get performance buckets
   */
  getPerformanceBuckets(): Map<string, PerformanceBucket> {
    return new Map(this.performanceBuckets);
  }

  /**
   * Get recent transactions
   */
  getRecentTransactions(limit: number = 100): TransactionContext[] {
    return this.completedTransactions.slice(-limit);
  }

  /**
   * Get slow transactions
   */
  getSlowTransactions(limit: number = 50): TransactionContext[] {
    return this.completedTransactions
      .filter((t) => (t.duration || 0) > this.config.slowThreshold)
      .slice(-limit);
  }

  /**
   * Get error transactions
   */
  getErrorTransactions(limit: number = 50): TransactionContext[] {
    return this.completedTransactions
      .filter((t) => t.status === 'error')
      .slice(-limit);
  }

  /**
   * Get system metrics history
   */
  getSystemMetrics(limit: number = 100): SystemMetrics[] {
    return this.systemMetrics.slice(-limit);
  }

  /**
   * Flush data
   */
  async flush(): Promise<void> {
    // In production, would send to APM backend
    this.emit('flush', {
      transactions: this.completedTransactions,
      metrics: this.systemMetrics,
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.completedTransactions = [];
    this.performanceBuckets.clear();
    this.transactionCounts = {
      total: 0,
      successful: 0,
      failed: 0,
      slow: 0,
    };
  }
}

// Singleton instance
let apmService: APMService | null = null;

export function getAPMService(): APMService {
  if (!apmService) {
    apmService = new APMService();
  }
  return apmService;
}

export default APMService;
