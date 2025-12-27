/**
 * Connection Pool Manager
 * Phase 12 Week 1
 *
 * Manages PostgreSQL connection pooling with PgBouncer integration
 * Provides connection lifecycle management and utilization monitoring
 */

import { Pool, PoolClient, PoolConfig } from 'pg';
import EventEmitter from 'events';

export interface ConnectionPoolConfig {
  min: number;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  maxUses?: number; // Max uses before connection refresh
  allowExitOnIdle?: boolean;
}

export interface PoolMetrics {
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  waitingClients: number;
  utilizationPercent: number;
  peakUtilization: number;
  totalAcquired: number;
  totalReleased: number;
  acquireErrors: number;
  averageAcquireTime: number; // ms
}

export interface ConnectionHealth {
  isHealthy: boolean;
  latency: number; // ms
  activeQueries: number;
  lastError?: Error;
  lastHealthCheck: Date;
}

export class ConnectionPool extends EventEmitter {
  private pool: Pool;
  private metrics: PoolMetrics;
  private acquireTimes: number[] = [];
  private readonly MAX_ACQUIRE_SAMPLES = 100;
  private healthCheckInterval?: NodeJS.Timeout;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  constructor(
    private config: PoolConfig & ConnectionPoolConfig
  ) {
    super();

    // Initialize pool with optimized defaults
    this.pool = new Pool({
      ...config,
      min: config.min || 10,
      max: config.max || 50,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 10000,
      allowExitOnIdle: config.allowExitOnIdle ?? true
    });

    // Initialize metrics
    this.metrics = {
      totalConnections: 0,
      idleConnections: 0,
      activeConnections: 0,
      waitingClients: 0,
      utilizationPercent: 0,
      peakUtilization: 0,
      totalAcquired: 0,
      totalReleased: 0,
      acquireErrors: 0,
      averageAcquireTime: 0
    };

    this.setupEventListeners();
    this.startHealthChecks();
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<PoolClient> {
    const startTime = Date.now();

    try {
      const client = await this.pool.connect();
      const acquireTime = Date.now() - startTime;

      // Track acquisition metrics
      this.trackAcquireTime(acquireTime);
      this.metrics.totalAcquired++;

      this.emit('connection:acquired', { acquireTime });
      this.updateMetrics();

      return client;
    } catch (error) {
      this.metrics.acquireErrors++;
      this.emit('connection:error', error);
      throw error;
    }
  }

  /**
   * Execute query with automatic connection management
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    const client = await this.acquire();

    try {
      const result = await client.query(sql, params);
      return result.rows as T;
    } finally {
      client.release();
      this.metrics.totalReleased++;
    }
  }

  /**
   * Execute transaction with automatic rollback on error
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.acquire();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
      this.metrics.totalReleased++;
    }
  }

  /**
   * Get current pool metrics
   */
  getMetrics(): PoolMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Check pool health
   */
  async checkHealth(): Promise<ConnectionHealth> {
    const startTime = Date.now();

    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT 1 as health_check');
      const latency = Date.now() - startTime;

      // Get active query count
      const activeQueries = await this.getActiveQueryCount(client);

      client.release();

      return {
        isHealthy: true,
        latency,
        activeQueries,
        lastHealthCheck: new Date()
      };
    } catch (error) {
      return {
        isHealthy: false,
        latency: Date.now() - startTime,
        activeQueries: 0,
        lastError: error as Error,
        lastHealthCheck: new Date()
      };
    }
  }

  /**
   * Gracefully drain and close pool
   */
  async close(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    await this.pool.end();
    this.emit('pool:closed');
  }

  /**
   * Get connection pool statistics from database
   */
  async getPoolStats(): Promise<{
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    maxConnections: number;
  }> {
    const client = await this.acquire();

    try {
      const result = await client.query(`
        SELECT
          (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as total_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active') as active_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle') as idle_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
      `);

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get slow query report
   */
  async getSlowQueries(
    thresholdMs: number = 1000,
    limit: number = 10
  ): Promise<Array<{
    query: string;
    duration: number;
    state: string;
    waitEvent?: string;
  }>> {
    const client = await this.acquire();

    try {
      const result = await client.query(`
        SELECT
          query,
          EXTRACT(EPOCH FROM (now() - query_start)) * 1000 as duration_ms,
          state,
          wait_event_type || ':' || wait_event as wait_event
        FROM pg_stat_activity
        WHERE
          datname = current_database()
          AND state = 'active'
          AND query NOT LIKE '%pg_stat_activity%'
          AND EXTRACT(EPOCH FROM (now() - query_start)) * 1000 > $1
        ORDER BY duration_ms DESC
        LIMIT $2
      `, [thresholdMs, limit]);

      return result.rows.map(row => ({
        query: row.query,
        duration: parseFloat(row.duration_ms),
        state: row.state,
        waitEvent: row.wait_event
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Kill long-running queries
   */
  async killLongRunningQueries(thresholdMs: number = 60000): Promise<number> {
    const client = await this.acquire();

    try {
      const result = await client.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE
          datname = current_database()
          AND state = 'active'
          AND pid != pg_backend_pid()
          AND EXTRACT(EPOCH FROM (now() - query_start)) * 1000 > $1
      `, [thresholdMs]);

      const killedCount = result.rowCount || 0;
      this.emit('queries:killed', { count: killedCount, threshold: thresholdMs });

      return killedCount;
    } finally {
      client.release();
    }
  }

  /**
   * Setup event listeners for pool monitoring
   */
  private setupEventListeners(): void {
    this.pool.on('connect', () => {
      this.metrics.totalConnections++;
      this.emit('connection:created');
    });

    this.pool.on('remove', () => {
      this.metrics.totalConnections--;
      this.emit('connection:removed');
    });

    this.pool.on('error', (err) => {
      this.emit('pool:error', err);
    });
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      const health = await this.checkHealth();

      if (!health.isHealthy) {
        this.emit('health:unhealthy', health);
      } else if (health.latency > 500) {
        this.emit('health:slow', health);
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Update pool metrics
   */
  private updateMetrics(): void {
    this.metrics.totalConnections = this.pool.totalCount;
    this.metrics.idleConnections = this.pool.idleCount;
    this.metrics.activeConnections = this.pool.totalCount - this.pool.idleCount;
    this.metrics.waitingClients = this.pool.waitingCount;

    const maxConnections = this.config.max || 50;
    this.metrics.utilizationPercent = Math.round(
      (this.metrics.activeConnections / maxConnections) * 100
    );

    if (this.metrics.utilizationPercent > this.metrics.peakUtilization) {
      this.metrics.peakUtilization = this.metrics.utilizationPercent;
    }

    this.metrics.averageAcquireTime = this.calculateAverageAcquireTime();

    // Emit warning if utilization is high
    if (this.metrics.utilizationPercent > 80) {
      this.emit('pool:high_utilization', this.metrics);
    }
  }

  /**
   * Track connection acquire time
   */
  private trackAcquireTime(time: number): void {
    this.acquireTimes.push(time);

    if (this.acquireTimes.length > this.MAX_ACQUIRE_SAMPLES) {
      this.acquireTimes.shift();
    }
  }

  /**
   * Calculate average acquire time
   */
  private calculateAverageAcquireTime(): number {
    if (this.acquireTimes.length === 0) return 0;

    const sum = this.acquireTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.acquireTimes.length);
  }

  /**
   * Get active query count
   */
  private async getActiveQueryCount(client: PoolClient): Promise<number> {
    try {
      const result = await client.query(`
        SELECT count(*) as count
        FROM pg_stat_activity
        WHERE datname = current_database() AND state = 'active'
      `);

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      return 0;
    }
  }
}

/**
 * Singleton pool manager for application-wide connection pooling
 */
export class PoolManager {
  private static instance: ConnectionPool;

  static initialize(config: PoolConfig & ConnectionPoolConfig): void {
    if (this.instance) {
      throw new Error('Pool already initialized');
    }

    this.instance = new ConnectionPool(config);
  }

  static getInstance(): ConnectionPool {
    if (!this.instance) {
      throw new Error('Pool not initialized. Call PoolManager.initialize() first');
    }

    return this.instance;
  }

  static async close(): Promise<void> {
    if (this.instance) {
      await this.instance.close();
    }
  }
}
