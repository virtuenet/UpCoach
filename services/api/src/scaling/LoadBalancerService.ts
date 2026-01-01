import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import * as http from 'http';
import * as https from 'https';
import { promisify } from 'util';
import * as crypto from 'crypto';

interface Backend {
  id: string;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  weight: number;
  healthy: boolean;
  connections: number;
  maxConnections: number;
  responseTime: number;
  errorRate: number;
  lastHealthCheck?: Date;
  metadata: Record<string, any>;
}

interface LoadBalancerConfig {
  id: string;
  name: string;
  algorithm: 'round-robin' | 'least-connections' | 'weighted-round-robin' | 'ip-hash' | 'least-response-time' | 'random-two-choices' | 'consistent-hash';
  backends: Backend[];
  healthCheck: HealthCheckConfig;
  sessionAffinity?: SessionAffinityConfig;
  circuitBreaker?: CircuitBreakerConfig;
  trafficSplitting?: TrafficSplittingConfig;
  rateLimit?: RateLimitConfig;
  connectionPool?: ConnectionPoolConfig;
}

interface HealthCheckConfig {
  type: 'http' | 'tcp' | 'grpc' | 'script';
  interval: number;
  timeout: number;
  unhealthyThreshold: number;
  healthyThreshold: number;
  path?: string;
  expectedStatus?: number;
  expectedBody?: string;
  script?: string;
}

interface SessionAffinityConfig {
  enabled: boolean;
  type: 'cookie' | 'ip';
  cookieName?: string;
  ttl: number;
}

interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  failureWindowMs: number;
  halfOpenRequests: number;
  resetTimeoutMs: number;
}

interface TrafficSplittingConfig {
  enabled: boolean;
  type: 'blue-green' | 'canary' | 'ab-test' | 'geographic';
  rules: TrafficSplittingRule[];
}

interface TrafficSplittingRule {
  id: string;
  condition?: string;
  backends: string[];
  weights: number[];
}

interface RateLimitConfig {
  enabled: boolean;
  requestsPerSecond: number;
  burstSize: number;
  queueSize: number;
}

interface ConnectionPoolConfig {
  maxConnections: number;
  maxIdleTime: number;
  connectionTimeout: number;
  keepAlive: boolean;
}

interface Session {
  id: string;
  backendId: string;
  createdAt: Date;
  expiresAt: Date;
  requests: number;
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
  successfulRequests?: number;
}

interface BackendMetrics {
  backendId: string;
  timestamp: Date;
  requestCount: number;
  errorCount: number;
  totalResponseTime: number;
  activeConnections: number;
}

interface LoadBalancerMetrics {
  timestamp: Date;
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number;
  requestsPerSecond: number;
  backendMetrics: Map<string, BackendMetrics>;
}

interface RequestContext {
  id: string;
  clientIp: string;
  sessionId?: string;
  path: string;
  method: string;
  headers: Record<string, string>;
  startTime: number;
}

@Injectable()
export class LoadBalancerService extends EventEmitter {
  private readonly logger = new Logger(LoadBalancerService.name);
  private configs: Map<string, LoadBalancerConfig>;
  private backends: Map<string, Backend>;
  private sessions: Map<string, Session>;
  private circuitBreakers: Map<string, CircuitBreakerState>;
  private metrics: Map<string, LoadBalancerMetrics>;
  private roundRobinCounters: Map<string, number>;
  private consistentHashRing: Map<string, string[]>;
  private connectionPools: Map<string, http.Agent | https.Agent>;
  private healthCheckIntervals: Map<string, NodeJS.Timeout>;
  private rateLimitTokens: Map<string, number>;
  private rateLimitLastRefill: Map<string, number>;

  constructor() {
    super();
    this.configs = new Map();
    this.backends = new Map();
    this.sessions = new Map();
    this.circuitBreakers = new Map();
    this.metrics = new Map();
    this.roundRobinCounters = new Map();
    this.consistentHashRing = new Map();
    this.connectionPools = new Map();
    this.healthCheckIntervals = new Map();
    this.rateLimitTokens = new Map();
    this.rateLimitLastRefill = new Map();
  }

  async initialize(): Promise<void> {
    await this.loadDefaultConfigurations();
    this.startHealthChecks();
    this.startMetricsCollection();
    this.startSessionCleanup();
    this.logger.log('Load balancer service initialized');
  }

  private async loadDefaultConfigurations(): Promise<void> {
    const defaultConfig: LoadBalancerConfig = {
      id: 'lb-api',
      name: 'API Load Balancer',
      algorithm: 'least-connections',
      backends: [
        {
          id: 'api-1',
          host: '10.0.1.10',
          port: 3000,
          protocol: 'http',
          weight: 1,
          healthy: true,
          connections: 0,
          maxConnections: 1000,
          responseTime: 0,
          errorRate: 0,
          metadata: { zone: 'us-east-1a' },
        },
        {
          id: 'api-2',
          host: '10.0.1.11',
          port: 3000,
          protocol: 'http',
          weight: 1,
          healthy: true,
          connections: 0,
          maxConnections: 1000,
          responseTime: 0,
          errorRate: 0,
          metadata: { zone: 'us-east-1b' },
        },
        {
          id: 'api-3',
          host: '10.0.1.12',
          port: 3000,
          protocol: 'http',
          weight: 2,
          healthy: true,
          connections: 0,
          maxConnections: 1000,
          responseTime: 0,
          errorRate: 0,
          metadata: { zone: 'us-east-1c' },
        },
      ],
      healthCheck: {
        type: 'http',
        interval: 10000,
        timeout: 5000,
        unhealthyThreshold: 3,
        healthyThreshold: 2,
        path: '/health',
        expectedStatus: 200,
      },
      sessionAffinity: {
        enabled: true,
        type: 'cookie',
        cookieName: 'session_id',
        ttl: 3600000,
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 0.5,
        failureWindowMs: 60000,
        halfOpenRequests: 3,
        resetTimeoutMs: 30000,
      },
      trafficSplitting: {
        enabled: false,
        type: 'canary',
        rules: [],
      },
      rateLimit: {
        enabled: true,
        requestsPerSecond: 1000,
        burstSize: 100,
        queueSize: 100,
      },
      connectionPool: {
        maxConnections: 1000,
        maxIdleTime: 30000,
        connectionTimeout: 30000,
        keepAlive: true,
      },
    };

    this.configs.set(defaultConfig.id, defaultConfig);
    defaultConfig.backends.forEach(backend => {
      this.backends.set(backend.id, backend);
      this.circuitBreakers.set(backend.id, {
        state: 'closed',
        failures: 0,
      });
      this.initializeConnectionPool(backend);
    });

    this.logger.log(`Loaded load balancer configuration: ${defaultConfig.name}`);
  }

  private initializeConnectionPool(backend: Backend): void {
    const poolConfig = this.configs.get('lb-api')?.connectionPool;
    if (!poolConfig) {
      return;
    }

    const agent = backend.protocol === 'https'
      ? new https.Agent({
          keepAlive: poolConfig.keepAlive,
          maxSockets: poolConfig.maxConnections,
          timeout: poolConfig.connectionTimeout,
        })
      : new http.Agent({
          keepAlive: poolConfig.keepAlive,
          maxSockets: poolConfig.maxConnections,
          timeout: poolConfig.connectionTimeout,
        });

    this.connectionPools.set(backend.id, agent);
  }

  private startHealthChecks(): void {
    this.configs.forEach((config, configId) => {
      const interval = setInterval(async () => {
        await this.performHealthChecks(configId);
      }, config.healthCheck.interval);

      this.healthCheckIntervals.set(configId, interval);
    });
  }

  private async performHealthChecks(configId: string): Promise<void> {
    const config = this.configs.get(configId);
    if (!config) {
      return;
    }

    for (const backend of config.backends) {
      try {
        const healthy = await this.checkBackendHealth(backend, config.healthCheck);

        if (healthy && !backend.healthy) {
          backend.healthy = true;
          this.logger.log(`Backend ${backend.id} is now healthy`);
          this.emit('backend-healthy', { backendId: backend.id });
        } else if (!healthy && backend.healthy) {
          backend.healthy = false;
          this.logger.warn(`Backend ${backend.id} is now unhealthy`);
          this.emit('backend-unhealthy', { backendId: backend.id });
        }

        backend.lastHealthCheck = new Date();
        this.backends.set(backend.id, backend);
      } catch (error) {
        this.logger.error(`Health check failed for backend ${backend.id}`, error);
      }
    }
  }

  private async checkBackendHealth(
    backend: Backend,
    healthCheck: HealthCheckConfig
  ): Promise<boolean> {
    switch (healthCheck.type) {
      case 'http':
        return await this.httpHealthCheck(backend, healthCheck);
      case 'tcp':
        return await this.tcpHealthCheck(backend);
      case 'grpc':
        return await this.grpcHealthCheck(backend);
      case 'script':
        return await this.scriptHealthCheck(backend, healthCheck);
      default:
        return true;
    }
  }

  private async httpHealthCheck(
    backend: Backend,
    healthCheck: HealthCheckConfig
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const client = backend.protocol === 'https' ? https : http;
      const path = healthCheck.path || '/health';

      const req = client.request({
        host: backend.host,
        port: backend.port,
        path,
        method: 'GET',
        timeout: healthCheck.timeout,
        agent: this.connectionPools.get(backend.id),
      }, (res) => {
        const expectedStatus = healthCheck.expectedStatus || 200;
        const healthy = res.statusCode === expectedStatus;

        if (healthCheck.expectedBody) {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            resolve(healthy && body.includes(healthCheck.expectedBody!));
          });
        } else {
          resolve(healthy);
        }
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  private async tcpHealthCheck(backend: Backend): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new (require('net').Socket)();

      socket.setTimeout(5000);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => resolve(false));
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(backend.port, backend.host);
    });
  }

  private async grpcHealthCheck(backend: Backend): Promise<boolean> {
    return true;
  }

  private async scriptHealthCheck(
    backend: Backend,
    healthCheck: HealthCheckConfig
  ): Promise<boolean> {
    return true;
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.collectMetrics();
    }, 60000);
  }

  private collectMetrics(): void {
    this.configs.forEach((config, configId) => {
      const backendMetrics = new Map<string, BackendMetrics>();

      config.backends.forEach(backend => {
        const metrics: BackendMetrics = {
          backendId: backend.id,
          timestamp: new Date(),
          requestCount: 0,
          errorCount: 0,
          totalResponseTime: backend.responseTime,
          activeConnections: backend.connections,
        };

        backendMetrics.set(backend.id, metrics);
      });

      const lbMetrics: LoadBalancerMetrics = {
        timestamp: new Date(),
        totalRequests: 0,
        totalErrors: 0,
        averageResponseTime: 0,
        requestsPerSecond: 0,
        backendMetrics,
      };

      this.metrics.set(configId, lbMetrics);
    });
  }

  private startSessionCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const expiredSessions: string[] = [];

      this.sessions.forEach((session, sessionId) => {
        if (session.expiresAt.getTime() < now) {
          expiredSessions.push(sessionId);
        }
      });

      expiredSessions.forEach(sessionId => {
        this.sessions.delete(sessionId);
      });

      if (expiredSessions.length > 0) {
        this.logger.log(`Cleaned up ${expiredSessions.length} expired sessions`);
      }
    }, 60000);
  }

  async routeRequest(
    configId: string,
    context: RequestContext
  ): Promise<{ backend: Backend; sessionId?: string }> {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Load balancer configuration ${configId} not found`);
    }

    if (config.rateLimit?.enabled) {
      const allowed = await this.checkRateLimit(configId, config.rateLimit);
      if (!allowed) {
        throw new Error('Rate limit exceeded');
      }
    }

    let backend: Backend | null = null;

    if (config.sessionAffinity?.enabled) {
      backend = await this.getBackendFromSession(context, config);
    }

    if (!backend) {
      if (config.trafficSplitting?.enabled) {
        backend = await this.selectBackendWithTrafficSplitting(config, context);
      } else {
        backend = await this.selectBackend(config, context);
      }
    }

    if (!backend) {
      throw new Error('No healthy backend available');
    }

    const sessionId = config.sessionAffinity?.enabled
      ? await this.createOrUpdateSession(context, backend, config)
      : undefined;

    backend.connections++;
    this.backends.set(backend.id, backend);

    return { backend, sessionId };
  }

  private async checkRateLimit(
    configId: string,
    rateLimit: RateLimitConfig
  ): Promise<boolean> {
    const now = Date.now();
    const lastRefill = this.rateLimitLastRefill.get(configId) || now;
    const tokens = this.rateLimitTokens.get(configId) || rateLimit.requestsPerSecond;

    const timePassed = (now - lastRefill) / 1000;
    const tokensToAdd = timePassed * rateLimit.requestsPerSecond;
    const newTokens = Math.min(
      tokens + tokensToAdd,
      rateLimit.requestsPerSecond + rateLimit.burstSize
    );

    if (newTokens >= 1) {
      this.rateLimitTokens.set(configId, newTokens - 1);
      this.rateLimitLastRefill.set(configId, now);
      return true;
    }

    return false;
  }

  private async getBackendFromSession(
    context: RequestContext,
    config: LoadBalancerConfig
  ): Promise<Backend | null> {
    if (!config.sessionAffinity) {
      return null;
    }

    let sessionId: string | undefined;

    if (config.sessionAffinity.type === 'cookie' && context.sessionId) {
      sessionId = context.sessionId;
    } else if (config.sessionAffinity.type === 'ip') {
      sessionId = crypto.createHash('md5').update(context.clientIp).digest('hex');
    }

    if (!sessionId) {
      return null;
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const backend = this.backends.get(session.backendId);
    if (!backend || !backend.healthy) {
      this.sessions.delete(sessionId);
      return null;
    }

    return backend;
  }

  private async createOrUpdateSession(
    context: RequestContext,
    backend: Backend,
    config: LoadBalancerConfig
  ): Promise<string> {
    if (!config.sessionAffinity) {
      return '';
    }

    let sessionId: string;

    if (config.sessionAffinity.type === 'cookie') {
      sessionId = context.sessionId || crypto.randomBytes(16).toString('hex');
    } else {
      sessionId = crypto.createHash('md5').update(context.clientIp).digest('hex');
    }

    const existingSession = this.sessions.get(sessionId);
    if (existingSession) {
      existingSession.expiresAt = new Date(Date.now() + config.sessionAffinity.ttl);
      existingSession.requests++;
      this.sessions.set(sessionId, existingSession);
    } else {
      const session: Session = {
        id: sessionId,
        backendId: backend.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + config.sessionAffinity.ttl),
        requests: 1,
      };
      this.sessions.set(sessionId, session);
    }

    return sessionId;
  }

  private async selectBackendWithTrafficSplitting(
    config: LoadBalancerConfig,
    context: RequestContext
  ): Promise<Backend | null> {
    if (!config.trafficSplitting || config.trafficSplitting.rules.length === 0) {
      return this.selectBackend(config, context);
    }

    for (const rule of config.trafficSplitting.rules) {
      if (rule.condition && !this.evaluateCondition(rule.condition, context)) {
        continue;
      }

      const random = Math.random() * 100;
      let cumulative = 0;

      for (let i = 0; i < rule.backends.length; i++) {
        cumulative += rule.weights[i];
        if (random <= cumulative) {
          const backend = this.backends.get(rule.backends[i]);
          if (backend && backend.healthy && !this.isCircuitOpen(backend)) {
            return backend;
          }
        }
      }
    }

    return this.selectBackend(config, context);
  }

  private evaluateCondition(condition: string, context: RequestContext): boolean {
    return true;
  }

  private async selectBackend(
    config: LoadBalancerConfig,
    context: RequestContext
  ): Promise<Backend | null> {
    const healthyBackends = config.backends.filter(
      b => b.healthy && !this.isCircuitOpen(b)
    );

    if (healthyBackends.length === 0) {
      return null;
    }

    switch (config.algorithm) {
      case 'round-robin':
        return this.selectRoundRobin(config.id, healthyBackends);
      case 'least-connections':
        return this.selectLeastConnections(healthyBackends);
      case 'weighted-round-robin':
        return this.selectWeightedRoundRobin(config.id, healthyBackends);
      case 'ip-hash':
        return this.selectIpHash(context.clientIp, healthyBackends);
      case 'least-response-time':
        return this.selectLeastResponseTime(healthyBackends);
      case 'random-two-choices':
        return this.selectRandomTwoChoices(healthyBackends);
      case 'consistent-hash':
        return this.selectConsistentHash(config.id, context.path, healthyBackends);
      default:
        return healthyBackends[0];
    }
  }

  private selectRoundRobin(configId: string, backends: Backend[]): Backend {
    const counter = this.roundRobinCounters.get(configId) || 0;
    const backend = backends[counter % backends.length];
    this.roundRobinCounters.set(configId, counter + 1);
    return backend;
  }

  private selectLeastConnections(backends: Backend[]): Backend {
    return backends.reduce((prev, curr) =>
      curr.connections < prev.connections ? curr : prev
    );
  }

  private selectWeightedRoundRobin(configId: string, backends: Backend[]): Backend {
    const totalWeight = backends.reduce((sum, b) => sum + b.weight, 0);
    const counter = this.roundRobinCounters.get(configId) || 0;
    let random = (counter % totalWeight);

    for (const backend of backends) {
      if (random < backend.weight) {
        this.roundRobinCounters.set(configId, counter + 1);
        return backend;
      }
      random -= backend.weight;
    }

    return backends[0];
  }

  private selectIpHash(clientIp: string, backends: Backend[]): Backend {
    const hash = crypto.createHash('md5').update(clientIp).digest('hex');
    const index = parseInt(hash.substring(0, 8), 16) % backends.length;
    return backends[index];
  }

  private selectLeastResponseTime(backends: Backend[]): Backend {
    return backends.reduce((prev, curr) =>
      curr.responseTime < prev.responseTime ? curr : prev
    );
  }

  private selectRandomTwoChoices(backends: Backend[]): Backend {
    if (backends.length === 1) {
      return backends[0];
    }

    const index1 = Math.floor(Math.random() * backends.length);
    let index2 = Math.floor(Math.random() * backends.length);
    while (index2 === index1) {
      index2 = Math.floor(Math.random() * backends.length);
    }

    const backend1 = backends[index1];
    const backend2 = backends[index2];

    return backend1.connections <= backend2.connections ? backend1 : backend2;
  }

  private selectConsistentHash(
    configId: string,
    key: string,
    backends: Backend[]
  ): Backend {
    let ring = this.consistentHashRing.get(configId);

    if (!ring) {
      ring = this.buildConsistentHashRing(backends);
      this.consistentHashRing.set(configId, ring);
    }

    const hash = crypto.createHash('md5').update(key).digest('hex');
    const hashInt = parseInt(hash.substring(0, 8), 16);

    const ringKeys = ring.map(item => parseInt(item.split(':')[0], 16));
    const sortedKeys = ringKeys.sort((a, b) => a - b);

    for (const ringKey of sortedKeys) {
      if (hashInt <= ringKey) {
        const backendId = ring.find(item => item.startsWith(ringKey.toString(16)))?.split(':')[1];
        if (backendId) {
          const backend = backends.find(b => b.id === backendId);
          if (backend) {
            return backend;
          }
        }
      }
    }

    const backendId = ring[0].split(':')[1];
    return backends.find(b => b.id === backendId) || backends[0];
  }

  private buildConsistentHashRing(backends: Backend[]): string[] {
    const ring: string[] = [];
    const virtualNodes = 150;

    backends.forEach(backend => {
      for (let i = 0; i < virtualNodes; i++) {
        const hash = crypto.createHash('md5')
          .update(`${backend.id}:${i}`)
          .digest('hex');
        ring.push(`${hash}:${backend.id}`);
      }
    });

    return ring.sort();
  }

  private isCircuitOpen(backend: Backend): boolean {
    const config = this.configs.get('lb-api');
    if (!config?.circuitBreaker?.enabled) {
      return false;
    }

    const state = this.circuitBreakers.get(backend.id);
    if (!state) {
      return false;
    }

    if (state.state === 'open') {
      const cbConfig = config.circuitBreaker;
      if (state.nextAttemptTime && Date.now() >= state.nextAttemptTime.getTime()) {
        state.state = 'half-open';
        state.successfulRequests = 0;
        this.circuitBreakers.set(backend.id, state);
        this.logger.log(`Circuit breaker for ${backend.id} is now half-open`);
        return false;
      }
      return true;
    }

    return false;
  }

  async recordRequestResult(
    backend: Backend,
    success: boolean,
    responseTime: number
  ): Promise<void> {
    backend.connections = Math.max(0, backend.connections - 1);
    backend.responseTime = (backend.responseTime + responseTime) / 2;
    this.backends.set(backend.id, backend);

    const config = this.configs.get('lb-api');
    if (!config?.circuitBreaker?.enabled) {
      return;
    }

    const state = this.circuitBreakers.get(backend.id);
    if (!state) {
      return;
    }

    const cbConfig = config.circuitBreaker;

    if (success) {
      if (state.state === 'half-open') {
        state.successfulRequests = (state.successfulRequests || 0) + 1;
        if (state.successfulRequests >= cbConfig.halfOpenRequests) {
          state.state = 'closed';
          state.failures = 0;
          this.logger.log(`Circuit breaker for ${backend.id} is now closed`);
        }
      } else if (state.state === 'closed') {
        state.failures = Math.max(0, state.failures - 1);
      }
    } else {
      state.failures++;
      state.lastFailureTime = new Date();

      if (state.state === 'closed' || state.state === 'half-open') {
        const recentFailures = this.getRecentFailures(backend.id, cbConfig.failureWindowMs);
        const errorRate = recentFailures / Math.max(1, backend.connections || 1);

        if (errorRate >= cbConfig.failureThreshold || state.state === 'half-open') {
          state.state = 'open';
          state.nextAttemptTime = new Date(Date.now() + cbConfig.resetTimeoutMs);
          this.logger.warn(`Circuit breaker for ${backend.id} is now open`);
          this.emit('circuit-breaker-open', { backendId: backend.id });
        }
      }
    }

    this.circuitBreakers.set(backend.id, state);
  }

  private getRecentFailures(backendId: string, windowMs: number): number {
    const state = this.circuitBreakers.get(backendId);
    if (!state || !state.lastFailureTime) {
      return 0;
    }

    const timeSinceLastFailure = Date.now() - state.lastFailureTime.getTime();
    if (timeSinceLastFailure > windowMs) {
      return 0;
    }

    return state.failures;
  }

  async enableTrafficSplitting(
    configId: string,
    type: 'blue-green' | 'canary' | 'ab-test',
    rules: TrafficSplittingRule[]
  ): Promise<void> {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Configuration ${configId} not found`);
    }

    config.trafficSplitting = {
      enabled: true,
      type,
      rules,
    };

    this.configs.set(configId, config);
    this.logger.log(`Enabled ${type} traffic splitting for ${configId}`);
  }

  async performCanaryDeployment(
    configId: string,
    canaryBackendId: string,
    stages: number[]
  ): Promise<void> {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Configuration ${configId} not found`);
    }

    const stableBackends = config.backends
      .filter(b => b.id !== canaryBackendId)
      .map(b => b.id);

    for (const percentage of stages) {
      const rule: TrafficSplittingRule = {
        id: `canary-${Date.now()}`,
        backends: [canaryBackendId, ...stableBackends],
        weights: [percentage, 100 - percentage],
      };

      await this.enableTrafficSplitting(configId, 'canary', [rule]);

      this.logger.log(`Canary deployment: ${percentage}% traffic to ${canaryBackendId}`);

      await this.sleep(300000);

      const canaryBackend = this.backends.get(canaryBackendId);
      if (canaryBackend && canaryBackend.errorRate > 5) {
        this.logger.error(`Canary deployment failed: high error rate on ${canaryBackendId}`);
        await this.enableTrafficSplitting(configId, 'canary', []);
        return;
      }
    }

    await this.enableTrafficSplitting(configId, 'canary', []);
    this.logger.log(`Canary deployment completed successfully for ${canaryBackendId}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async performBlueGreenDeployment(
    configId: string,
    greenBackendIds: string[]
  ): Promise<void> {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Configuration ${configId} not found`);
    }

    const blueBackends = config.backends
      .filter(b => !greenBackendIds.includes(b.id))
      .map(b => b.id);

    const switchRule: TrafficSplittingRule = {
      id: `blue-green-${Date.now()}`,
      backends: [...greenBackendIds, ...blueBackends],
      weights: [100, 0],
    };

    await this.enableTrafficSplitting(configId, 'blue-green', [switchRule]);
    this.logger.log(`Blue-green deployment: switched to green backends ${greenBackendIds.join(', ')}`);
  }

  async addBackend(configId: string, backend: Backend): Promise<void> {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Configuration ${configId} not found`);
    }

    config.backends.push(backend);
    this.backends.set(backend.id, backend);
    this.circuitBreakers.set(backend.id, {
      state: 'closed',
      failures: 0,
    });
    this.initializeConnectionPool(backend);

    this.configs.set(configId, config);
    this.logger.log(`Added backend ${backend.id} to ${configId}`);
  }

  async removeBackend(configId: string, backendId: string): Promise<void> {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Configuration ${configId} not found`);
    }

    config.backends = config.backends.filter(b => b.id !== backendId);
    this.backends.delete(backendId);
    this.circuitBreakers.delete(backendId);

    const agent = this.connectionPools.get(backendId);
    if (agent) {
      agent.destroy();
      this.connectionPools.delete(backendId);
    }

    this.configs.set(configId, config);
    this.logger.log(`Removed backend ${backendId} from ${configId}`);
  }

  async drainBackend(backendId: string, timeoutMs: number = 300000): Promise<void> {
    const backend = this.backends.get(backendId);
    if (!backend) {
      throw new Error(`Backend ${backendId} not found`);
    }

    backend.healthy = false;
    this.backends.set(backendId, backend);

    this.logger.log(`Draining backend ${backendId}...`);

    const startTime = Date.now();
    while (backend.connections > 0 && Date.now() - startTime < timeoutMs) {
      await this.sleep(1000);
    }

    if (backend.connections > 0) {
      this.logger.warn(`Backend ${backendId} still has ${backend.connections} active connections after timeout`);
    } else {
      this.logger.log(`Backend ${backendId} drained successfully`);
    }
  }

  getBackends(configId: string): Backend[] {
    const config = this.configs.get(configId);
    return config?.backends || [];
  }

  getBackendById(backendId: string): Backend | undefined {
    return this.backends.get(backendId);
  }

  getMetrics(configId: string): LoadBalancerMetrics | undefined {
    return this.metrics.get(configId);
  }

  getCircuitBreakerState(backendId: string): CircuitBreakerState | undefined {
    return this.circuitBreakers.get(backendId);
  }

  getSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  async updateBackendWeight(backendId: string, weight: number): Promise<void> {
    const backend = this.backends.get(backendId);
    if (!backend) {
      throw new Error(`Backend ${backendId} not found`);
    }

    backend.weight = weight;
    this.backends.set(backendId, backend);
    this.logger.log(`Updated weight for backend ${backendId} to ${weight}`);
  }

  async shutdown(): Promise<void> {
    this.healthCheckIntervals.forEach(interval => clearInterval(interval));
    this.healthCheckIntervals.clear();

    this.connectionPools.forEach(agent => agent.destroy());
    this.connectionPools.clear();

    this.logger.log('Load balancer service shut down');
  }
}
