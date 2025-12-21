/**
 * Health Check Service
 *
 * Comprehensive health checking for all system components
 * including database, cache, external services, and dependencies.
 */

import { EventEmitter } from 'events';

// Health status
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

// Component check result
export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  latency: number;
  message: string;
  lastCheck: number;
  details?: Record<string, unknown>;
}

// System health result
export interface SystemHealth {
  status: HealthStatus;
  timestamp: number;
  uptime: number;
  version: string;
  components: ComponentHealth[];
  checks: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

// Readiness check
export interface ReadinessCheck {
  ready: boolean;
  components: {
    name: string;
    ready: boolean;
    message: string;
  }[];
}

// Liveness check
export interface LivenessCheck {
  alive: boolean;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  pid: number;
}

// Health check config
export interface HealthCheckConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  unhealthyThreshold: number;
  degradedThreshold: number;
  version: string;
}

// Check function type
export type CheckFunction = () => Promise<{
  status: HealthStatus;
  latency: number;
  message: string;
  details?: Record<string, unknown>;
}>;

export class HealthCheckService extends EventEmitter {
  private config: HealthCheckConfig;
  private checks: Map<string, CheckFunction> = new Map();
  private lastResults: Map<string, ComponentHealth> = new Map();
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private startTime: number;
  private consecutiveFailures: Map<string, number> = new Map();

  constructor(config?: Partial<HealthCheckConfig>) {
    super();
    this.config = {
      enabled: true,
      interval: 30000,
      timeout: 5000,
      unhealthyThreshold: 3,
      degradedThreshold: 1,
      version: process.env.npm_package_version || '1.0.0',
      ...config,
    };
    this.startTime = Date.now();

    // Register default checks
    this.registerDefaultChecks();
  }

  /**
   * Register default health checks
   */
  private registerDefaultChecks(): void {
    // Memory check
    this.registerCheck('memory', async () => {
      const usage = process.memoryUsage();
      const heapPercentage = (usage.heapUsed / usage.heapTotal) * 100;

      let status: HealthStatus = 'healthy';
      let message = `Heap usage: ${heapPercentage.toFixed(1)}%`;

      if (heapPercentage > 90) {
        status = 'unhealthy';
        message = `Critical heap usage: ${heapPercentage.toFixed(1)}%`;
      } else if (heapPercentage > 80) {
        status = 'degraded';
        message = `High heap usage: ${heapPercentage.toFixed(1)}%`;
      }

      return {
        status,
        latency: 0,
        message,
        details: {
          heapUsed: usage.heapUsed,
          heapTotal: usage.heapTotal,
          external: usage.external,
          rss: usage.rss,
        },
      };
    });

    // Event loop check
    this.registerCheck('event-loop', async () => {
      const start = process.hrtime.bigint();
      await new Promise((resolve) => setImmediate(resolve));
      const end = process.hrtime.bigint();
      const latency = Number(end - start) / 1000000;

      let status: HealthStatus = 'healthy';
      let message = `Event loop latency: ${latency.toFixed(2)}ms`;

      if (latency > 100) {
        status = 'unhealthy';
        message = `Critical event loop latency: ${latency.toFixed(2)}ms`;
      } else if (latency > 50) {
        status = 'degraded';
        message = `High event loop latency: ${latency.toFixed(2)}ms`;
      }

      return { status, latency, message };
    });

    // Database check (placeholder - would be implemented with actual DB)
    this.registerCheck('database', async () => {
      const start = Date.now();
      try {
        // Simulate database ping
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
        const latency = Date.now() - start;

        return {
          status: 'healthy' as HealthStatus,
          latency,
          message: `Database responding in ${latency}ms`,
          details: {
            connections: Math.floor(Math.random() * 10) + 5,
            activeQueries: Math.floor(Math.random() * 3),
          },
        };
      } catch (error) {
        return {
          status: 'unhealthy' as HealthStatus,
          latency: Date.now() - start,
          message: `Database error: ${(error as Error).message}`,
        };
      }
    });

    // Redis check (placeholder)
    this.registerCheck('redis', async () => {
      const start = Date.now();
      try {
        // Simulate Redis ping
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 5));
        const latency = Date.now() - start;

        return {
          status: 'healthy' as HealthStatus,
          latency,
          message: `Redis responding in ${latency}ms`,
          details: {
            connectedClients: Math.floor(Math.random() * 20) + 10,
            usedMemory: '128MB',
          },
        };
      } catch (error) {
        return {
          status: 'unhealthy' as HealthStatus,
          latency: Date.now() - start,
          message: `Redis error: ${(error as Error).message}`,
        };
      }
    });

    // External API check (placeholder)
    this.registerCheck('external-apis', async () => {
      const start = Date.now();
      const services = ['stripe', 'openai', 'agora'];
      const results: Record<string, boolean> = {};

      for (const service of services) {
        // Simulate check
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
        results[service] = Math.random() > 0.05; // 95% success rate
      }

      const latency = Date.now() - start;
      const allHealthy = Object.values(results).every((v) => v);
      const anyFailed = Object.values(results).some((v) => !v);

      let status: HealthStatus = 'healthy';
      let message = 'All external APIs available';

      if (!allHealthy) {
        const failedServices = Object.entries(results)
          .filter(([, v]) => !v)
          .map(([k]) => k);

        if (failedServices.length === services.length) {
          status = 'unhealthy';
          message = 'All external APIs unavailable';
        } else {
          status = 'degraded';
          message = `Some APIs unavailable: ${failedServices.join(', ')}`;
        }
      }

      return { status, latency, message, details: results };
    });
  }

  /**
   * Register a health check
   */
  registerCheck(name: string, check: CheckFunction): void {
    this.checks.set(name, check);
    this.consecutiveFailures.set(name, 0);
  }

  /**
   * Unregister a health check
   */
  unregisterCheck(name: string): void {
    this.checks.delete(name);
    this.lastResults.delete(name);
    this.consecutiveFailures.delete(name);
  }

  /**
   * Start periodic health checks
   */
  start(): void {
    if (!this.config.enabled) return;

    this.checkInterval = setInterval(() => {
      this.runAllChecks();
    }, this.config.interval);

    // Run initial check
    this.runAllChecks();
  }

  /**
   * Stop periodic health checks
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Run all health checks
   */
  async runAllChecks(): Promise<SystemHealth> {
    const results: ComponentHealth[] = [];
    const checks = { total: 0, healthy: 0, degraded: 0, unhealthy: 0 };

    for (const [name, check] of this.checks) {
      checks.total++;
      const result = await this.runCheck(name, check);
      results.push(result);

      switch (result.status) {
        case 'healthy':
          checks.healthy++;
          break;
        case 'degraded':
          checks.degraded++;
          break;
        case 'unhealthy':
          checks.unhealthy++;
          break;
      }
    }

    // Determine overall status
    let status: HealthStatus = 'healthy';
    if (checks.unhealthy > 0) {
      status = 'unhealthy';
    } else if (checks.degraded > 0) {
      status = 'degraded';
    }

    const health: SystemHealth = {
      status,
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      version: this.config.version,
      components: results,
      checks,
    };

    this.emit('health', health);

    if (status === 'unhealthy') {
      this.emit('unhealthy', health);
    } else if (status === 'degraded') {
      this.emit('degraded', health);
    }

    return health;
  }

  /**
   * Run a single health check
   */
  private async runCheck(name: string, check: CheckFunction): Promise<ComponentHealth> {
    const lastCheck = Date.now();

    try {
      const result = await Promise.race([
        check(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), this.config.timeout)
        ),
      ]);

      // Reset consecutive failures on success
      if (result.status === 'healthy') {
        this.consecutiveFailures.set(name, 0);
      } else {
        this.consecutiveFailures.set(
          name,
          (this.consecutiveFailures.get(name) || 0) + 1
        );
      }

      const componentHealth: ComponentHealth = {
        name,
        status: result.status,
        latency: result.latency,
        message: result.message,
        lastCheck,
        details: result.details,
      };

      this.lastResults.set(name, componentHealth);
      return componentHealth;
    } catch (error) {
      const failures = (this.consecutiveFailures.get(name) || 0) + 1;
      this.consecutiveFailures.set(name, failures);

      let status: HealthStatus = 'unhealthy';
      if (failures < this.config.unhealthyThreshold) {
        status = 'degraded';
      }

      const componentHealth: ComponentHealth = {
        name,
        status,
        latency: Date.now() - lastCheck,
        message: `Check failed: ${(error as Error).message}`,
        lastCheck,
        details: {
          consecutiveFailures: failures,
        },
      };

      this.lastResults.set(name, componentHealth);
      return componentHealth;
    }
  }

  /**
   * Get current health status
   */
  async getHealth(): Promise<SystemHealth> {
    return this.runAllChecks();
  }

  /**
   * Get cached health status
   */
  getCachedHealth(): SystemHealth {
    const results = Array.from(this.lastResults.values());
    const checks = { total: 0, healthy: 0, degraded: 0, unhealthy: 0 };

    for (const result of results) {
      checks.total++;
      switch (result.status) {
        case 'healthy':
          checks.healthy++;
          break;
        case 'degraded':
          checks.degraded++;
          break;
        case 'unhealthy':
          checks.unhealthy++;
          break;
      }
    }

    let status: HealthStatus = 'healthy';
    if (checks.unhealthy > 0) {
      status = 'unhealthy';
    } else if (checks.degraded > 0) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      version: this.config.version,
      components: results,
      checks,
    };
  }

  /**
   * Get readiness status
   */
  async getReadiness(): Promise<ReadinessCheck> {
    const criticalChecks = ['database', 'redis'];
    const components: ReadinessCheck['components'] = [];
    let ready = true;

    for (const name of criticalChecks) {
      const check = this.checks.get(name);
      if (!check) {
        components.push({
          name,
          ready: false,
          message: 'Check not registered',
        });
        ready = false;
        continue;
      }

      try {
        const result = await check();
        const isReady = result.status === 'healthy' || result.status === 'degraded';
        components.push({
          name,
          ready: isReady,
          message: result.message,
        });
        if (!isReady) {
          ready = false;
        }
      } catch (error) {
        components.push({
          name,
          ready: false,
          message: (error as Error).message,
        });
        ready = false;
      }
    }

    return { ready, components };
  }

  /**
   * Get liveness status
   */
  getLiveness(): LivenessCheck {
    const memUsage = process.memoryUsage();

    return {
      alive: true,
      uptime: Date.now() - this.startTime,
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      },
      pid: process.pid,
    };
  }

  /**
   * Check specific component
   */
  async checkComponent(name: string): Promise<ComponentHealth | null> {
    const check = this.checks.get(name);
    if (!check) return null;

    return this.runCheck(name, check);
  }

  /**
   * Get component names
   */
  getComponentNames(): string[] {
    return Array.from(this.checks.keys());
  }

  /**
   * Get uptime
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }
}

// Singleton instance
let healthCheckService: HealthCheckService | null = null;

export function getHealthCheckService(): HealthCheckService {
  if (!healthCheckService) {
    healthCheckService = new HealthCheckService();
  }
  return healthCheckService;
}

export default HealthCheckService;
