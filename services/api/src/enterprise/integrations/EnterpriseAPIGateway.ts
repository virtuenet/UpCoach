import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export enum RateLimitTier {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  UNLIMITED = 'unlimited'
}

export interface APIKey {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  tier: RateLimitTier;
  status: 'active' | 'inactive' | 'revoked';
  scopes: string[];
  rateLimit: {
    requestsPerHour: number;
    requestsPerDay: number;
    requestsPerMonth: number;
  };
  usage: {
    totalRequests: number;
    lastRequestAt?: Date;
    currentHourRequests: number;
    currentDayRequests: number;
    currentMonthRequests: number;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    lastUsedAt?: Date;
    expiresAt?: Date;
  };
}

export interface RequestLog {
  id: string;
  apiKeyId: string;
  organizationId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  error?: string;
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: {
    hour: number;
    day: number;
    month: number;
  };
  resetAt: {
    hour: Date;
    day: Date;
    month: Date;
  };
}

export interface APIMetrics {
  organizationId: string;
  period: 'hour' | 'day' | 'week' | 'month';
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  errorRate: number;
}

class EnterpriseAPIGateway extends EventEmitter {
  private redis: Redis;
  private apiKeys: Map<string, APIKey>;
  private readonly CACHE_PREFIX = 'api:gateway:';
  private readonly RATE_LIMIT_PREFIX = 'rate:limit:';
  private readonly LOG_PREFIX = 'api:log:';

  private readonly TIER_LIMITS: Record<RateLimitTier, { hour: number; day: number; month: number }> = {
    [RateLimitTier.FREE]: { hour: 100, day: 1000, month: 10000 },
    [RateLimitTier.STARTER]: { hour: 1000, day: 10000, month: 100000 },
    [RateLimitTier.PROFESSIONAL]: { hour: 5000, day: 50000, month: 500000 },
    [RateLimitTier.ENTERPRISE]: { hour: 20000, day: 200000, month: 2000000 },
    [RateLimitTier.UNLIMITED]: { hour: Infinity, day: Infinity, month: Infinity }
  };

  constructor(redis: Redis) {
    super();
    this.redis = redis;
    this.apiKeys = new Map();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadAPIKeysFromCache();
      this.emit('gateway:initialized');
    } catch (error) {
      this.emit('gateway:error', { error: 'Failed to initialize gateway', details: error });
      throw error;
    }
  }

  private async loadAPIKeysFromCache(): Promise<void> {
    const keys = await this.redis.keys(`${this.CACHE_PREFIX}key:*`);

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const apiKey = JSON.parse(data);
        this.apiKeys.set(apiKey.key, apiKey);
      }
    }
  }

  public async createAPIKey(
    organizationId: string,
    name: string,
    tier: RateLimitTier,
    scopes: string[],
    createdBy: string,
    expiresAt?: Date
  ): Promise<APIKey> {
    const key = this.generateAPIKey();
    const limits = this.TIER_LIMITS[tier];

    const apiKey: APIKey = {
      id: crypto.randomUUID(),
      organizationId,
      key,
      name,
      tier,
      status: 'active',
      scopes,
      rateLimit: {
        requestsPerHour: limits.hour,
        requestsPerDay: limits.day,
        requestsPerMonth: limits.month
      },
      usage: {
        totalRequests: 0,
        currentHourRequests: 0,
        currentDayRequests: 0,
        currentMonthRequests: 0
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        expiresAt
      }
    };

    this.apiKeys.set(key, apiKey);
    await this.saveAPIKeyToCache(apiKey);

    this.emit('apikey:created', { apiKeyId: apiKey.id, organizationId });
    return apiKey;
  }

  private generateAPIKey(): string {
    const prefix = 'upcoach_live_';
    const randomBytes = crypto.randomBytes(32);
    const key = randomBytes.toString('base64url');
    return `${prefix}${key}`;
  }

  public async revokeAPIKey(keyOrId: string): Promise<void> {
    const apiKey = this.apiKeys.get(keyOrId) ||
      Array.from(this.apiKeys.values()).find(k => k.id === keyOrId);

    if (!apiKey) {
      throw new Error('API key not found');
    }

    apiKey.status = 'revoked';
    apiKey.metadata.updatedAt = new Date();

    await this.saveAPIKeyToCache(apiKey);
    this.emit('apikey:revoked', { apiKeyId: apiKey.id });
  }

  public async updateAPIKey(keyOrId: string, updates: Partial<Pick<APIKey, 'name' | 'tier' | 'scopes' | 'status'>>): Promise<APIKey> {
    const apiKey = this.apiKeys.get(keyOrId) ||
      Array.from(this.apiKeys.values()).find(k => k.id === keyOrId);

    if (!apiKey) {
      throw new Error('API key not found');
    }

    if (updates.tier) {
      const limits = this.TIER_LIMITS[updates.tier];
      apiKey.rateLimit = {
        requestsPerHour: limits.hour,
        requestsPerDay: limits.day,
        requestsPerMonth: limits.month
      };
    }

    Object.assign(apiKey, updates);
    apiKey.metadata.updatedAt = new Date();

    await this.saveAPIKeyToCache(apiKey);
    this.emit('apikey:updated', { apiKeyId: apiKey.id });
    return apiKey;
  }

  public async validateAPIKey(key: string): Promise<APIKey> {
    const apiKey = this.apiKeys.get(key);

    if (!apiKey) {
      throw new Error('Invalid API key');
    }

    if (apiKey.status !== 'active') {
      throw new Error(`API key is ${apiKey.status}`);
    }

    if (apiKey.metadata.expiresAt && new Date() > apiKey.metadata.expiresAt) {
      throw new Error('API key has expired');
    }

    return apiKey;
  }

  public async checkRateLimit(apiKey: APIKey): Promise<RateLimitStatus> {
    const now = new Date();
    const hour = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    const day = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    const month = `${now.getFullYear()}-${now.getMonth()}`;

    const hourKey = `${this.RATE_LIMIT_PREFIX}${apiKey.id}:hour:${hour}`;
    const dayKey = `${this.RATE_LIMIT_PREFIX}${apiKey.id}:day:${day}`;
    const monthKey = `${this.RATE_LIMIT_PREFIX}${apiKey.id}:month:${month}`;

    const [hourCount, dayCount, monthCount] = await Promise.all([
      this.redis.get(hourKey),
      this.redis.get(dayKey),
      this.redis.get(monthKey)
    ]);

    const currentHour = parseInt(hourCount || '0');
    const currentDay = parseInt(dayCount || '0');
    const currentMonth = parseInt(monthCount || '0');

    const allowed =
      currentHour < apiKey.rateLimit.requestsPerHour &&
      currentDay < apiKey.rateLimit.requestsPerDay &&
      currentMonth < apiKey.rateLimit.requestsPerMonth;

    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);

    const nextDay = new Date(now);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);

    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);

    return {
      allowed,
      remaining: {
        hour: Math.max(0, apiKey.rateLimit.requestsPerHour - currentHour),
        day: Math.max(0, apiKey.rateLimit.requestsPerDay - currentDay),
        month: Math.max(0, apiKey.rateLimit.requestsPerMonth - currentMonth)
      },
      resetAt: {
        hour: nextHour,
        day: nextDay,
        month: nextMonth
      }
    };
  }

  public async incrementRateLimit(apiKey: APIKey): Promise<void> {
    const now = new Date();
    const hour = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    const day = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    const month = `${now.getFullYear()}-${now.getMonth()}`;

    const hourKey = `${this.RATE_LIMIT_PREFIX}${apiKey.id}:hour:${hour}`;
    const dayKey = `${this.RATE_LIMIT_PREFIX}${apiKey.id}:day:${day}`;
    const monthKey = `${this.RATE_LIMIT_PREFIX}${apiKey.id}:month:${month}`;

    const pipeline = this.redis.pipeline();

    pipeline.incr(hourKey);
    pipeline.expire(hourKey, 3600); // 1 hour

    pipeline.incr(dayKey);
    pipeline.expire(dayKey, 86400); // 1 day

    pipeline.incr(monthKey);
    pipeline.expire(monthKey, 2592000); // 30 days

    await pipeline.exec();

    apiKey.usage.totalRequests++;
    apiKey.usage.lastRequestAt = now;
    apiKey.metadata.lastUsedAt = now;

    await this.saveAPIKeyToCache(apiKey);
  }

  public async logRequest(log: Omit<RequestLog, 'id' | 'timestamp'>): Promise<void> {
    const requestLog: RequestLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    const logKey = `${this.LOG_PREFIX}${requestLog.organizationId}:${Date.now()}`;
    await this.redis.setex(logKey, 2592000, JSON.stringify(requestLog)); // 30 days retention

    this.emit('request:logged', requestLog);
  }

  public async getRequestLogs(
    organizationId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<RequestLog[]> {
    const pattern = `${this.LOG_PREFIX}${organizationId}:*`;
    const keys = await this.redis.keys(pattern);

    const logs: RequestLog[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const log = JSON.parse(data);

        if (options.startDate && new Date(log.timestamp) < options.startDate) continue;
        if (options.endDate && new Date(log.timestamp) > options.endDate) continue;

        logs.push(log);
      }
    }

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const offset = options.offset || 0;
    const limit = options.limit || 100;

    return logs.slice(offset, offset + limit);
  }

  public async getAPIMetrics(
    organizationId: string,
    period: 'hour' | 'day' | 'week' | 'month'
  ): Promise<APIMetrics> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'hour':
        startDate = new Date(now.getTime() - 3600000);
        break;
      case 'day':
        startDate = new Date(now.getTime() - 86400000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 604800000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 2592000000);
        break;
    }

    const logs = await this.getRequestLogs(organizationId, { startDate, endDate: now, limit: 10000 });

    const totalRequests = logs.length;
    const successfulRequests = logs.filter(l => l.statusCode >= 200 && l.statusCode < 300).length;
    const failedRequests = logs.filter(l => l.statusCode >= 400).length;

    const responseTimes = logs.map(l => l.responseTime).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0;
    const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
    const p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;

    const endpointCounts = new Map<string, number>();
    logs.forEach(log => {
      const count = endpointCounts.get(log.endpoint) || 0;
      endpointCounts.set(log.endpoint, count + 1);
    });

    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;

    return {
      organizationId,
      period,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      topEndpoints,
      errorRate
    };
  }

  public middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const apiKey = req.headers['x-api-key'] as string;

      if (!apiKey) {
        return res.status(401).json({ error: 'API key is required' });
      }

      try {
        const validatedKey = await this.validateAPIKey(apiKey);

        const endpoint = req.path;
        const requiredScope = this.getRequiredScope(endpoint);

        if (requiredScope && !validatedKey.scopes.includes(requiredScope) && !validatedKey.scopes.includes('*')) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const rateLimitStatus = await this.checkRateLimit(validatedKey);

        res.setHeader('X-RateLimit-Limit-Hour', validatedKey.rateLimit.requestsPerHour.toString());
        res.setHeader('X-RateLimit-Remaining-Hour', rateLimitStatus.remaining.hour.toString());
        res.setHeader('X-RateLimit-Reset-Hour', rateLimitStatus.resetAt.hour.toISOString());

        if (!rateLimitStatus.allowed) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            resetAt: rateLimitStatus.resetAt
          });
        }

        await this.incrementRateLimit(validatedKey);

        (req as any).apiKey = validatedKey;
        (req as any).organizationId = validatedKey.organizationId;

        const originalSend = res.send;
        res.send = function(data: any) {
          const responseTime = Date.now() - startTime;

          const requestSize = req.headers['content-length'] ? parseInt(req.headers['content-length']) : 0;
          const responseSize = Buffer.byteLength(JSON.stringify(data));

          (async () => {
            await this.logRequest({
              apiKeyId: validatedKey.id,
              organizationId: validatedKey.organizationId,
              endpoint: req.path,
              method: req.method,
              statusCode: res.statusCode,
              responseTime,
              requestSize,
              responseSize,
              ipAddress: req.ip || '',
              userAgent: req.headers['user-agent'] || '',
              error: res.statusCode >= 400 ? data.error : undefined
            });
          })();

          return originalSend.call(this, data);
        }.bind(this);

        next();
      } catch (error) {
        this.emit('middleware:error', { error, apiKey });
        return res.status(401).json({ error: error instanceof Error ? error.message : 'Invalid API key' });
      }
    };
  }

  private getRequiredScope(endpoint: string): string | null {
    const scopeMap: Record<string, string> = {
      '/users': 'users:read',
      '/organizations': 'organizations:read',
      '/coaching': 'coaching:read',
      '/analytics': 'analytics:read',
      '/integrations': 'integrations:manage'
    };

    for (const [path, scope] of Object.entries(scopeMap)) {
      if (endpoint.startsWith(path)) {
        return scope;
      }
    }

    return null;
  }

  private async saveAPIKeyToCache(apiKey: APIKey): Promise<void> {
    await this.redis.set(
      `${this.CACHE_PREFIX}key:${apiKey.key}`,
      JSON.stringify(apiKey)
    );
  }

  public getAPIKey(keyOrId: string): APIKey | undefined {
    return this.apiKeys.get(keyOrId) ||
      Array.from(this.apiKeys.values()).find(k => k.id === keyOrId);
  }

  public getAPIKeysByOrganization(organizationId: string): APIKey[] {
    return Array.from(this.apiKeys.values())
      .filter(key => key.organizationId === organizationId);
  }

  public async shutdown(): Promise<void> {
    this.removeAllListeners();
    this.emit('gateway:shutdown');
  }
}

export default EnterpriseAPIGateway;
