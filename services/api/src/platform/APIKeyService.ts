import crypto from 'crypto';
import { EventEmitter } from 'events';

/**
 * API Key Scopes
 */
export type APIKeyScope =
  | 'read:users'
  | 'write:users'
  | 'read:goals'
  | 'write:goals'
  | 'read:habits'
  | 'write:habits'
  | 'read:analytics'
  | 'write:analytics'
  | 'ai:coach'
  | 'webhooks:manage'
  | 'admin:all';

/**
 * API Key Tier with rate limits
 */
export type APIKeyTier = 'free' | 'developer' | 'business' | 'enterprise';

/**
 * API Key Status
 */
export type APIKeyStatus = 'active' | 'revoked' | 'expired' | 'suspended';

/**
 * API Key Configuration
 */
export interface APIKeyConfig {
  tier: APIKeyTier;
  scopes: APIKeyScope[];
  rateLimit: {
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit: number;
  };
  ipWhitelist?: string[];
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * API Key Record
 */
export interface APIKey {
  id: string;
  userId: string;
  organizationId?: string;
  name: string;
  key: string; // Hashed in database
  prefix: string; // First 8 chars for display (e.g., "upcoach_")
  tier: APIKeyTier;
  scopes: APIKeyScope[];
  status: APIKeyStatus;
  rateLimit: {
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit: number;
  };
  ipWhitelist?: string[];
  usageStats: {
    totalRequests: number;
    lastUsedAt?: Date;
    monthlyRequests: number;
    quotaExceeded: number;
  };
  createdAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * API Key Usage Record
 */
export interface APIKeyUsage {
  keyId: string;
  timestamp: Date;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  userAgent: string;
}

/**
 * Rate Limit Configuration by Tier
 */
const TIER_LIMITS: Record<APIKeyTier, { requestsPerHour: number; requestsPerDay: number; burstLimit: number }> = {
  free: {
    requestsPerHour: 100,
    requestsPerDay: 1000,
    burstLimit: 10,
  },
  developer: {
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    burstLimit: 50,
  },
  business: {
    requestsPerHour: 10000,
    requestsPerDay: 100000,
    burstLimit: 200,
  },
  enterprise: {
    requestsPerHour: 100000,
    requestsPerDay: 1000000,
    burstLimit: 1000,
  },
};

/**
 * APIKeyService
 *
 * Manages API key generation, validation, rotation, and revocation.
 * Integrates with rate limiting and usage analytics.
 */
export class APIKeyService extends EventEmitter {
  private static instance: APIKeyService;
  private keys: Map<string, APIKey> = new Map();
  private usageRecords: APIKeyUsage[] = [];
  private keyPrefix = 'upcoach_';

  private constructor() {
    super();
  }

  static getInstance(): APIKeyService {
    if (!APIKeyService.instance) {
      APIKeyService.instance = new APIKeyService();
    }
    return APIKeyService.instance;
  }

  /**
   * Generate API Key
   */
  async generateAPIKey(
    userId: string,
    name: string,
    config: APIKeyConfig
  ): Promise<{ key: APIKey; rawKey: string }> {
    // Generate cryptographically secure API key
    const rawKey = this.keyPrefix + crypto.randomBytes(32).toString('hex');
    const keyHash = this.hashKey(rawKey);

    const apiKey: APIKey = {
      id: crypto.randomUUID(),
      userId,
      organizationId: config.metadata?.organizationId,
      name,
      key: keyHash,
      prefix: rawKey.substring(0, 16) + '...',
      tier: config.tier,
      scopes: config.scopes,
      status: 'active',
      rateLimit: config.rateLimit || TIER_LIMITS[config.tier],
      ipWhitelist: config.ipWhitelist,
      usageStats: {
        totalRequests: 0,
        monthlyRequests: 0,
        quotaExceeded: 0,
      },
      createdAt: new Date(),
      expiresAt: config.expiresAt,
      metadata: config.metadata,
    };

    this.keys.set(apiKey.id, apiKey);

    this.emit('api_key:generated', {
      keyId: apiKey.id,
      userId,
      tier: config.tier,
      scopes: config.scopes,
    });

    return { key: apiKey, rawKey };
  }

  /**
   * Validate API Key
   */
  async validateAPIKey(
    rawKey: string,
    requiredScopes?: APIKeyScope[],
    ipAddress?: string
  ): Promise<{ valid: boolean; key?: APIKey; error?: string }> {
    // Hash the provided key
    const keyHash = this.hashKey(rawKey);

    // Find matching key
    const apiKey = Array.from(this.keys.values()).find(k => k.key === keyHash);

    if (!apiKey) {
      return { valid: false, error: 'Invalid API key' };
    }

    // Check status
    if (apiKey.status !== 'active') {
      return { valid: false, error: `API key is ${apiKey.status}` };
    }

    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      apiKey.status = 'expired';
      return { valid: false, error: 'API key has expired' };
    }

    // Check IP whitelist
    if (apiKey.ipWhitelist && apiKey.ipWhitelist.length > 0 && ipAddress) {
      if (!apiKey.ipWhitelist.includes(ipAddress)) {
        this.emit('api_key:ip_violation', {
          keyId: apiKey.id,
          ipAddress,
          whitelist: apiKey.ipWhitelist,
        });
        return { valid: false, error: 'IP address not whitelisted' };
      }
    }

    // Check scopes
    if (requiredScopes && requiredScopes.length > 0) {
      const hasAllScopes = requiredScopes.every(scope =>
        apiKey.scopes.includes(scope) || apiKey.scopes.includes('admin:all')
      );

      if (!hasAllScopes) {
        return { valid: false, error: 'Insufficient scopes' };
      }
    }

    return { valid: true, key: apiKey };
  }

  /**
   * Rotate API Key
   */
  async rotateAPIKey(keyId: string): Promise<{ key: APIKey; rawKey: string }> {
    const existingKey = this.keys.get(keyId);
    if (!existingKey) {
      throw new Error('API key not found');
    }

    // Generate new key
    const rawKey = this.keyPrefix + crypto.randomBytes(32).toString('hex');
    const keyHash = this.hashKey(rawKey);

    // Update key
    existingKey.key = keyHash;
    existingKey.prefix = rawKey.substring(0, 16) + '...';

    this.emit('api_key:rotated', {
      keyId: existingKey.id,
      userId: existingKey.userId,
    });

    return { key: existingKey, rawKey };
  }

  /**
   * Revoke API Key
   */
  async revokeAPIKey(keyId: string, reason?: string): Promise<void> {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    apiKey.status = 'revoked';
    apiKey.revokedAt = new Date();
    if (reason) {
      apiKey.metadata = { ...apiKey.metadata, revocationReason: reason };
    }

    this.emit('api_key:revoked', {
      keyId: apiKey.id,
      userId: apiKey.userId,
      reason,
    });
  }

  /**
   * Update API Key Scopes
   */
  async updateScopes(keyId: string, scopes: APIKeyScope[]): Promise<APIKey> {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    const oldScopes = [...apiKey.scopes];
    apiKey.scopes = scopes;

    this.emit('api_key:scopes_updated', {
      keyId: apiKey.id,
      oldScopes,
      newScopes: scopes,
    });

    return apiKey;
  }

  /**
   * Update API Key Tier
   */
  async updateTier(keyId: string, tier: APIKeyTier): Promise<APIKey> {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    const oldTier = apiKey.tier;
    apiKey.tier = tier;
    apiKey.rateLimit = TIER_LIMITS[tier];

    this.emit('api_key:tier_updated', {
      keyId: apiKey.id,
      oldTier,
      newTier: tier,
    });

    return apiKey;
  }

  /**
   * Record API Usage
   */
  async recordUsage(keyId: string, usage: Omit<APIKeyUsage, 'keyId'>): Promise<void> {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      return;
    }

    // Update usage stats
    apiKey.usageStats.totalRequests++;
    apiKey.usageStats.lastUsedAt = new Date();
    apiKey.usageStats.monthlyRequests++;

    // Store usage record
    this.usageRecords.push({
      keyId,
      ...usage,
    });

    // Emit usage event
    this.emit('api_key:usage', {
      keyId,
      endpoint: usage.endpoint,
      statusCode: usage.statusCode,
      responseTime: usage.responseTime,
    });

    // Trim old usage records (keep last 10,000)
    if (this.usageRecords.length > 10000) {
      this.usageRecords = this.usageRecords.slice(-10000);
    }
  }

  /**
   * Get API Key Usage Analytics
   */
  async getUsageAnalytics(
    keyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
    dailyUsage: Array<{ date: string; count: number }>;
  }> {
    const records = this.usageRecords.filter(
      r => r.keyId === keyId && r.timestamp >= startDate && r.timestamp <= endDate
    );

    const totalRequests = records.length;
    const successfulRequests = records.filter(r => r.statusCode >= 200 && r.statusCode < 300).length;
    const failedRequests = totalRequests - successfulRequests;

    const averageResponseTime = records.length > 0
      ? records.reduce((sum, r) => sum + r.responseTime, 0) / records.length
      : 0;

    // Top endpoints
    const endpointCounts = new Map<string, number>();
    records.forEach(r => {
      endpointCounts.set(r.endpoint, (endpointCounts.get(r.endpoint) || 0) + 1);
    });
    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Daily usage
    const dailyCounts = new Map<string, number>();
    records.forEach(r => {
      const date = r.timestamp.toISOString().split('T')[0];
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    });
    const dailyUsage = Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      topEndpoints,
      dailyUsage,
    };
  }

  /**
   * Get User API Keys
   */
  async getUserAPIKeys(userId: string): Promise<APIKey[]> {
    return Array.from(this.keys.values()).filter(k => k.userId === userId);
  }

  /**
   * Get Organization API Keys
   */
  async getOrganizationAPIKeys(organizationId: string): Promise<APIKey[]> {
    return Array.from(this.keys.values()).filter(k => k.organizationId === organizationId);
  }

  /**
   * Hash API Key
   */
  private hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  /**
   * Check Rate Limit
   */
  async checkRateLimit(keyId: string): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt: Date;
  }> {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const hourlyRequests = this.usageRecords.filter(
      r => r.keyId === keyId && r.timestamp >= hourAgo
    ).length;

    const allowed = hourlyRequests < apiKey.rateLimit.requestsPerHour;
    const remaining = Math.max(0, apiKey.rateLimit.requestsPerHour - hourlyRequests);
    const resetAt = new Date(now.getTime() + 60 * 60 * 1000);

    if (!allowed) {
      apiKey.usageStats.quotaExceeded++;
      this.emit('api_key:rate_limit_exceeded', {
        keyId,
        userId: apiKey.userId,
        limit: apiKey.rateLimit.requestsPerHour,
      });
    }

    return { allowed, limit: apiKey.rateLimit.requestsPerHour, remaining, resetAt };
  }

  /**
   * Reset Monthly Usage
   */
  async resetMonthlyUsage(): Promise<void> {
    this.keys.forEach(key => {
      key.usageStats.monthlyRequests = 0;
    });

    this.emit('api_key:monthly_reset', {
      timestamp: new Date(),
      keysReset: this.keys.size,
    });
  }
}

export const apiKeyService = APIKeyService.getInstance();
