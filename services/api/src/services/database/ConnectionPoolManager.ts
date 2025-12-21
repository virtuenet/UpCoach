/**
 * Connection Pool Manager
 *
 * Advanced database connection pooling with health monitoring,
 * automatic scaling, and connection lifecycle management.
 */

// Pool configuration
export interface PoolConfig {
  min: number;
  max: number;
  acquireTimeout: number;
  idleTimeout: number;
  evictionInterval: number;
  validateOnBorrow: boolean;
  testQuery: string;
}

// Connection info
export interface ConnectionInfo {
  id: string;
  state: 'idle' | 'acquired' | 'invalid' | 'testing';
  createdAt: number;
  lastUsedAt: number;
  useCount: number;
  lastError: string | null;
}

// Pool statistics
export interface PoolStatistics {
  size: number;
  available: number;
  borrowed: number;
  pending: number;
  totalCreated: number;
  totalDestroyed: number;
  acquireCount: number;
  releaseCount: number;
  timeoutCount: number;
  avgAcquireTime: number;
  avgQueryTime: number;
}

// Pool health
export interface PoolHealth {
  healthy: boolean;
  utilization: number;
  availableConnections: number;
  pendingRequests: number;
  lastHealthCheck: number;
  issues: string[];
}

export class ConnectionPoolManager {
  private config: PoolConfig;
  private connections: Map<string, ConnectionInfo> = new Map();
  private statistics: PoolStatistics;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private evictionInterval: ReturnType<typeof setInterval> | null = null;
  private acquireTimes: number[] = [];
  private queryTimes: number[] = [];

  constructor(config?: Partial<PoolConfig>) {
    this.config = {
      min: 5,
      max: 20,
      acquireTimeout: 30000,
      idleTimeout: 10000,
      evictionInterval: 1000,
      validateOnBorrow: true,
      testQuery: 'SELECT 1',
      ...config,
    };

    this.statistics = {
      size: 0,
      available: 0,
      borrowed: 0,
      pending: 0,
      totalCreated: 0,
      totalDestroyed: 0,
      acquireCount: 0,
      releaseCount: 0,
      timeoutCount: 0,
      avgAcquireTime: 0,
      avgQueryTime: 0,
    };
  }

  /**
   * Initialize pool
   */
  async initialize(): Promise<void> {
    // Create minimum connections
    for (let i = 0; i < this.config.min; i++) {
      await this.createConnection();
    }

    // Start health check
    this.startHealthCheck();

    // Start eviction
    this.startEviction();

    console.log(`Connection pool initialized with ${this.config.min} connections`);
  }

  /**
   * Shutdown pool
   */
  async shutdown(): Promise<void> {
    // Stop intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.evictionInterval) {
      clearInterval(this.evictionInterval);
      this.evictionInterval = null;
    }

    // Destroy all connections
    for (const [id] of this.connections) {
      await this.destroyConnection(id);
    }

    console.log('Connection pool shutdown complete');
  }

  /**
   * Create new connection
   */
  private async createConnection(): Promise<string> {
    const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const info: ConnectionInfo = {
      id,
      state: 'idle',
      createdAt: now,
      lastUsedAt: now,
      useCount: 0,
      lastError: null,
    };

    this.connections.set(id, info);
    this.statistics.totalCreated++;
    this.statistics.size++;
    this.statistics.available++;

    return id;
  }

  /**
   * Destroy connection
   */
  private async destroyConnection(id: string): Promise<void> {
    const info = this.connections.get(id);
    if (!info) return;

    if (info.state === 'idle') {
      this.statistics.available--;
    } else if (info.state === 'acquired') {
      this.statistics.borrowed--;
    }

    this.connections.delete(id);
    this.statistics.totalDestroyed++;
    this.statistics.size--;
  }

  /**
   * Acquire connection
   */
  async acquire(): Promise<string> {
    const startTime = Date.now();
    this.statistics.pending++;

    try {
      // Try to get an idle connection
      for (const [id, info] of this.connections) {
        if (info.state === 'idle') {
          // Validate if required
          if (this.config.validateOnBorrow) {
            const valid = await this.validateConnection(id);
            if (!valid) {
              await this.destroyConnection(id);
              continue;
            }
          }

          // Acquire connection
          info.state = 'acquired';
          info.lastUsedAt = Date.now();
          info.useCount++;

          this.statistics.available--;
          this.statistics.borrowed++;
          this.statistics.acquireCount++;
          this.statistics.pending--;

          const acquireTime = Date.now() - startTime;
          this.trackAcquireTime(acquireTime);

          return id;
        }
      }

      // No idle connections - try to create new one
      if (this.statistics.size < this.config.max) {
        const id = await this.createConnection();
        const info = this.connections.get(id)!;

        info.state = 'acquired';
        info.useCount = 1;

        this.statistics.available--;
        this.statistics.borrowed++;
        this.statistics.acquireCount++;
        this.statistics.pending--;

        const acquireTime = Date.now() - startTime;
        this.trackAcquireTime(acquireTime);

        return id;
      }

      // Wait for a connection to become available
      const waitedId = await this.waitForConnection(startTime);
      return waitedId;
    } catch (error) {
      this.statistics.pending--;
      throw error;
    }
  }

  /**
   * Release connection
   */
  async release(id: string): Promise<void> {
    const info = this.connections.get(id);
    if (!info) return;

    if (info.state === 'acquired') {
      info.state = 'idle';
      info.lastUsedAt = Date.now();

      this.statistics.borrowed--;
      this.statistics.available++;
      this.statistics.releaseCount++;
    }
  }

  /**
   * Validate connection
   */
  private async validateConnection(id: string): Promise<boolean> {
    const info = this.connections.get(id);
    if (!info) return false;

    info.state = 'testing';

    try {
      // In real implementation, execute test query
      await new Promise((resolve) => setTimeout(resolve, 10));
      info.state = 'idle';
      info.lastError = null;
      return true;
    } catch (error) {
      info.state = 'invalid';
      info.lastError = (error as Error).message;
      return false;
    }
  }

  /**
   * Wait for connection with timeout
   */
  private async waitForConnection(startTime: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        const elapsed = Date.now() - startTime;

        if (elapsed > this.config.acquireTimeout) {
          clearInterval(checkInterval);
          this.statistics.timeoutCount++;
          reject(new Error('Connection acquire timeout'));
          return;
        }

        // Try to find an idle connection
        for (const [id, info] of this.connections) {
          if (info.state === 'idle') {
            clearInterval(checkInterval);

            info.state = 'acquired';
            info.lastUsedAt = Date.now();
            info.useCount++;

            this.statistics.available--;
            this.statistics.borrowed++;
            this.statistics.acquireCount++;
            this.statistics.pending--;

            const acquireTime = Date.now() - startTime;
            this.trackAcquireTime(acquireTime);

            resolve(id);
            return;
          }
        }
      }, 50);
    });
  }

  /**
   * Start health check interval
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  /**
   * Start eviction interval
   */
  private startEviction(): void {
    this.evictionInterval = setInterval(() => {
      this.evictIdleConnections();
    }, this.config.evictionInterval);
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    const invalidConnections: string[] = [];

    for (const [id, info] of this.connections) {
      if (info.state === 'idle') {
        const valid = await this.validateConnection(id);
        if (!valid) {
          invalidConnections.push(id);
        }
      }
    }

    // Remove invalid connections
    for (const id of invalidConnections) {
      await this.destroyConnection(id);
    }

    // Ensure minimum connections
    while (this.statistics.size < this.config.min) {
      await this.createConnection();
    }
  }

  /**
   * Evict idle connections
   */
  private async evictIdleConnections(): Promise<void> {
    const now = Date.now();
    const toEvict: string[] = [];

    for (const [id, info] of this.connections) {
      // Only evict if above minimum and idle for too long
      if (
        info.state === 'idle' &&
        this.statistics.size > this.config.min &&
        now - info.lastUsedAt > this.config.idleTimeout
      ) {
        toEvict.push(id);
      }
    }

    for (const id of toEvict) {
      await this.destroyConnection(id);
    }
  }

  /**
   * Track acquire time
   */
  private trackAcquireTime(time: number): void {
    this.acquireTimes.push(time);
    if (this.acquireTimes.length > 100) {
      this.acquireTimes.shift();
    }
    this.statistics.avgAcquireTime =
      this.acquireTimes.reduce((a, b) => a + b, 0) / this.acquireTimes.length;
  }

  /**
   * Track query time
   */
  trackQueryTime(time: number): void {
    this.queryTimes.push(time);
    if (this.queryTimes.length > 100) {
      this.queryTimes.shift();
    }
    this.statistics.avgQueryTime =
      this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
  }

  /**
   * Get pool statistics
   */
  getStatistics(): PoolStatistics {
    return { ...this.statistics };
  }

  /**
   * Get pool health
   */
  getHealth(): PoolHealth {
    const issues: string[] = [];

    // Check utilization
    const utilization =
      this.statistics.size > 0
        ? this.statistics.borrowed / this.statistics.size
        : 0;

    if (utilization > 0.9) {
      issues.push('High pool utilization (>90%)');
    }

    if (this.statistics.pending > this.config.max * 0.5) {
      issues.push('High pending requests');
    }

    if (this.statistics.avgAcquireTime > 1000) {
      issues.push('Slow connection acquisition (>1s)');
    }

    if (this.statistics.timeoutCount > 10) {
      issues.push('Multiple connection timeouts');
    }

    return {
      healthy: issues.length === 0,
      utilization,
      availableConnections: this.statistics.available,
      pendingRequests: this.statistics.pending,
      lastHealthCheck: Date.now(),
      issues,
    };
  }

  /**
   * Get connection info
   */
  getConnectionInfo(id: string): ConnectionInfo | null {
    return this.connections.get(id) || null;
  }

  /**
   * Get all connections info
   */
  getAllConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  /**
   * Resize pool
   */
  async resize(min: number, max: number): Promise<void> {
    this.config.min = min;
    this.config.max = max;

    // Add connections if needed
    while (this.statistics.size < min) {
      await this.createConnection();
    }

    // Remove excess connections
    while (this.statistics.size > max && this.statistics.available > 0) {
      for (const [id, info] of this.connections) {
        if (info.state === 'idle' && this.statistics.size > max) {
          await this.destroyConnection(id);
          break;
        }
      }
    }
  }
}

// Singleton instance
let poolManager: ConnectionPoolManager | null = null;

export function getPoolManager(): ConnectionPoolManager {
  if (!poolManager) {
    poolManager = new ConnectionPoolManager();
  }
  return poolManager;
}

export default ConnectionPoolManager;
