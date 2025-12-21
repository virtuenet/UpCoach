/**
 * API Key Manager Service
 *
 * Secure API key generation, validation, rate limiting,
 * and usage tracking for third-party integrations.
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

// API Key Type
export type APIKeyType = 'public' | 'secret' | 'restricted';

// API Key Status
export type APIKeyStatus = 'active' | 'revoked' | 'expired' | 'suspended';

// API Key Scope
export type APIKeyScope =
  | 'read'
  | 'write'
  | 'admin'
  | 'habits'
  | 'goals'
  | 'analytics'
  | 'coaching'
  | 'payments'
  | 'webhooks';

// API Key
export interface APIKey {
  id: string;
  name: string;
  description?: string;
  userId: string;
  organizationId?: string;
  keyHash: string;
  keyPrefix: string;
  type: APIKeyType;
  scopes: APIKeyScope[];
  status: APIKeyStatus;
  rateLimit: RateLimitConfig;
  ipWhitelist: string[];
  referrerWhitelist: string[];
  allowedOrigins: string[];
  metadata: Record<string, unknown>;
  expiresAt?: number;
  lastUsedAt?: number;
  usageCount: number;
  createdAt: number;
  updatedAt: number;
}

// Rate Limit Configuration
export interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
}

// API Key Usage
export interface APIKeyUsage {
  keyId: string;
  timestamp: number;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  error?: string;
}

// Rate Limit State
interface RateLimitState {
  keyId: string;
  second: { count: number; resetAt: number };
  minute: { count: number; resetAt: number };
  hour: { count: number; resetAt: number };
  day: { count: number; resetAt: number };
}

// Validation Result
export interface APIKeyValidationResult {
  valid: boolean;
  key?: APIKey;
  error?: string;
  remainingRequests?: {
    second: number;
    minute: number;
    hour: number;
    day: number;
  };
}

// API Key Stats
export interface APIKeyStats {
  totalKeys: number;
  activeKeys: number;
  byType: Record<APIKeyType, number>;
  byStatus: Record<APIKeyStatus, number>;
  requestsToday: number;
  errorsToday: number;
  topKeys: Array<{ keyId: string; name: string; requests: number }>;
}

// Configuration
export interface APIKeyManagerConfig {
  keyLength: number;
  hashAlgorithm: string;
  defaultRateLimit: RateLimitConfig;
  enableUsageTracking: boolean;
  maxKeysPerUser: number;
  keyPrefix: string;
}

export class APIKeyManager extends EventEmitter {
  private config: APIKeyManagerConfig;
  private keys: Map<string, APIKey> = new Map();
  private keysByHash: Map<string, string> = new Map(); // hash -> keyId
  private rateLimitStates: Map<string, RateLimitState> = new Map();
  private usageLog: APIKeyUsage[] = [];

  constructor(config?: Partial<APIKeyManagerConfig>) {
    super();
    this.config = {
      keyLength: 32,
      hashAlgorithm: 'sha256',
      defaultRateLimit: {
        requestsPerSecond: 10,
        requestsPerMinute: 100,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        burstLimit: 20,
      },
      enableUsageTracking: true,
      maxKeysPerUser: 10,
      keyPrefix: 'upcoach',
      ...config,
    };

    // Clean up expired rate limit states periodically
    setInterval(() => this.cleanupRateLimitStates(), 60000);
  }

  /**
   * Create a new API key
   */
  createKey(
    userId: string,
    name: string,
    options?: {
      description?: string;
      organizationId?: string;
      type?: APIKeyType;
      scopes?: APIKeyScope[];
      rateLimit?: Partial<RateLimitConfig>;
      ipWhitelist?: string[];
      referrerWhitelist?: string[];
      allowedOrigins?: string[];
      expiresInDays?: number;
      metadata?: Record<string, unknown>;
    }
  ): { key: APIKey; secret: string } {
    // Check max keys per user
    const userKeys = this.getKeysByUser(userId);
    if (userKeys.length >= this.config.maxKeysPerUser) {
      throw new Error(`Maximum API keys per user (${this.config.maxKeysPerUser}) exceeded`);
    }

    // Generate the actual key
    const rawKey = crypto.randomBytes(this.config.keyLength).toString('base64url');
    const keyPrefix = rawKey.substring(0, 8);
    const fullKey = `${this.config.keyPrefix}_${options?.type || 'secret'}_${rawKey}`;

    // Hash the key for storage
    const keyHash = this.hashKey(fullKey);

    const now = Date.now();
    const key: APIKey = {
      id: `apikey_${crypto.randomBytes(12).toString('hex')}`,
      name,
      description: options?.description,
      userId,
      organizationId: options?.organizationId,
      keyHash,
      keyPrefix,
      type: options?.type || 'secret',
      scopes: options?.scopes || ['read'],
      status: 'active',
      rateLimit: {
        ...this.config.defaultRateLimit,
        ...options?.rateLimit,
      },
      ipWhitelist: options?.ipWhitelist || [],
      referrerWhitelist: options?.referrerWhitelist || [],
      allowedOrigins: options?.allowedOrigins || [],
      metadata: options?.metadata || {},
      expiresAt: options?.expiresInDays
        ? now + options.expiresInDays * 24 * 60 * 60 * 1000
        : undefined,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.keys.set(key.id, key);
    this.keysByHash.set(keyHash, key.id);

    this.emit('key-created', { keyId: key.id, userId, name });

    return { key, secret: fullKey };
  }

  /**
   * Validate API key
   */
  validateKey(
    apiKey: string,
    options?: {
      ipAddress?: string;
      referrer?: string;
      origin?: string;
      scope?: APIKeyScope;
    }
  ): APIKeyValidationResult {
    const keyHash = this.hashKey(apiKey);
    const keyId = this.keysByHash.get(keyHash);

    if (!keyId) {
      return { valid: false, error: 'Invalid API key' };
    }

    const key = this.keys.get(keyId);
    if (!key) {
      return { valid: false, error: 'API key not found' };
    }

    // Check status
    if (key.status !== 'active') {
      return { valid: false, error: `API key is ${key.status}` };
    }

    // Check expiration
    if (key.expiresAt && Date.now() > key.expiresAt) {
      key.status = 'expired';
      return { valid: false, error: 'API key has expired' };
    }

    // Check IP whitelist
    if (key.ipWhitelist.length > 0 && options?.ipAddress) {
      if (!this.isIPAllowed(options.ipAddress, key.ipWhitelist)) {
        return { valid: false, error: 'IP address not allowed' };
      }
    }

    // Check referrer whitelist
    if (key.referrerWhitelist.length > 0 && options?.referrer) {
      if (!this.isReferrerAllowed(options.referrer, key.referrerWhitelist)) {
        return { valid: false, error: 'Referrer not allowed' };
      }
    }

    // Check origin
    if (key.allowedOrigins.length > 0 && options?.origin) {
      if (!key.allowedOrigins.includes(options.origin) && !key.allowedOrigins.includes('*')) {
        return { valid: false, error: 'Origin not allowed' };
      }
    }

    // Check scope
    if (options?.scope && !key.scopes.includes(options.scope) && !key.scopes.includes('admin')) {
      return { valid: false, error: `Scope '${options.scope}' not granted` };
    }

    // Check rate limit
    const rateLimitResult = this.checkRateLimit(key);
    if (!rateLimitResult.allowed) {
      return { valid: false, error: rateLimitResult.error };
    }

    // Update usage
    key.lastUsedAt = Date.now();
    key.usageCount++;

    return {
      valid: true,
      key,
      remainingRequests: rateLimitResult.remaining,
    };
  }

  /**
   * Record API key usage
   */
  recordUsage(
    keyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    ipAddress: string,
    userAgent: string,
    error?: string
  ): void {
    if (!this.config.enableUsageTracking) return;

    const usage: APIKeyUsage = {
      keyId,
      timestamp: Date.now(),
      endpoint,
      method,
      statusCode,
      responseTime,
      ipAddress,
      userAgent,
      success: statusCode >= 200 && statusCode < 400,
      error,
    };

    this.usageLog.push(usage);

    // Keep last 100000 entries
    if (this.usageLog.length > 100000) {
      this.usageLog = this.usageLog.slice(-100000);
    }

    this.emit('key-used', usage);
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(key: APIKey): {
    allowed: boolean;
    error?: string;
    remaining?: { second: number; minute: number; hour: number; day: number };
  } {
    const now = Date.now();

    let state = this.rateLimitStates.get(key.id);
    if (!state) {
      state = {
        keyId: key.id,
        second: { count: 0, resetAt: now + 1000 },
        minute: { count: 0, resetAt: now + 60000 },
        hour: { count: 0, resetAt: now + 3600000 },
        day: { count: 0, resetAt: now + 86400000 },
      };
      this.rateLimitStates.set(key.id, state);
    }

    // Reset counters if needed
    if (now >= state.second.resetAt) {
      state.second = { count: 0, resetAt: now + 1000 };
    }
    if (now >= state.minute.resetAt) {
      state.minute = { count: 0, resetAt: now + 60000 };
    }
    if (now >= state.hour.resetAt) {
      state.hour = { count: 0, resetAt: now + 3600000 };
    }
    if (now >= state.day.resetAt) {
      state.day = { count: 0, resetAt: now + 86400000 };
    }

    // Check limits
    if (state.second.count >= key.rateLimit.requestsPerSecond) {
      return { allowed: false, error: 'Rate limit exceeded (per second)' };
    }
    if (state.minute.count >= key.rateLimit.requestsPerMinute) {
      return { allowed: false, error: 'Rate limit exceeded (per minute)' };
    }
    if (state.hour.count >= key.rateLimit.requestsPerHour) {
      return { allowed: false, error: 'Rate limit exceeded (per hour)' };
    }
    if (state.day.count >= key.rateLimit.requestsPerDay) {
      return { allowed: false, error: 'Rate limit exceeded (per day)' };
    }

    // Increment counters
    state.second.count++;
    state.minute.count++;
    state.hour.count++;
    state.day.count++;

    return {
      allowed: true,
      remaining: {
        second: key.rateLimit.requestsPerSecond - state.second.count,
        minute: key.rateLimit.requestsPerMinute - state.minute.count,
        hour: key.rateLimit.requestsPerHour - state.hour.count,
        day: key.rateLimit.requestsPerDay - state.day.count,
      },
    };
  }

  /**
   * Hash API key
   */
  private hashKey(key: string): string {
    return crypto.createHash(this.config.hashAlgorithm).update(key).digest('hex');
  }

  /**
   * Check if IP is allowed
   */
  private isIPAllowed(ip: string, whitelist: string[]): boolean {
    for (const allowed of whitelist) {
      if (allowed === ip) return true;

      // Check CIDR notation
      if (allowed.includes('/')) {
        if (this.isIPInCIDR(ip, allowed)) return true;
      }
    }
    return false;
  }

  /**
   * Check if IP is in CIDR range
   */
  private isIPInCIDR(ip: string, cidr: string): boolean {
    const [range, bits] = cidr.split('/');
    const mask = parseInt(bits, 10);

    const ipParts = ip.split('.').map(Number);
    const rangeParts = range.split('.').map(Number);

    const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const rangeNum = (rangeParts[0] << 24) | (rangeParts[1] << 16) | (rangeParts[2] << 8) | rangeParts[3];

    const maskNum = ~((1 << (32 - mask)) - 1);

    return (ipNum & maskNum) === (rangeNum & maskNum);
  }

  /**
   * Check if referrer is allowed
   */
  private isReferrerAllowed(referrer: string, whitelist: string[]): boolean {
    try {
      const referrerUrl = new URL(referrer);

      for (const allowed of whitelist) {
        if (allowed === '*') return true;

        if (allowed.startsWith('*.')) {
          const domain = allowed.substring(2);
          if (referrerUrl.hostname.endsWith(domain)) return true;
        } else if (referrerUrl.hostname === allowed) {
          return true;
        }
      }
    } catch {
      return false;
    }
    return false;
  }

  /**
   * Get key by ID
   */
  getKey(keyId: string): APIKey | null {
    return this.keys.get(keyId) || null;
  }

  /**
   * Get keys by user
   */
  getKeysByUser(userId: string): APIKey[] {
    return Array.from(this.keys.values())
      .filter((k) => k.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get keys by organization
   */
  getKeysByOrganization(organizationId: string): APIKey[] {
    return Array.from(this.keys.values())
      .filter((k) => k.organizationId === organizationId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Update key
   */
  updateKey(keyId: string, updates: Partial<Pick<APIKey, 'name' | 'description' | 'scopes' | 'rateLimit' | 'ipWhitelist' | 'referrerWhitelist' | 'allowedOrigins' | 'metadata'>>): APIKey | null {
    const key = this.keys.get(keyId);
    if (!key) return null;

    Object.assign(key, updates, { updatedAt: Date.now() });

    this.emit('key-updated', { keyId, updates: Object.keys(updates) });

    return key;
  }

  /**
   * Rotate key (create new key, revoke old)
   */
  rotateKey(keyId: string): { key: APIKey; secret: string } | null {
    const oldKey = this.keys.get(keyId);
    if (!oldKey) return null;

    // Create new key with same settings
    const result = this.createKey(oldKey.userId, `${oldKey.name} (rotated)`, {
      description: oldKey.description,
      organizationId: oldKey.organizationId,
      type: oldKey.type,
      scopes: oldKey.scopes,
      rateLimit: oldKey.rateLimit,
      ipWhitelist: oldKey.ipWhitelist,
      referrerWhitelist: oldKey.referrerWhitelist,
      allowedOrigins: oldKey.allowedOrigins,
      metadata: { ...oldKey.metadata, rotatedFrom: keyId },
    });

    // Revoke old key
    this.revokeKey(keyId, 'Rotated');

    this.emit('key-rotated', { oldKeyId: keyId, newKeyId: result.key.id });

    return result;
  }

  /**
   * Revoke key
   */
  revokeKey(keyId: string, reason?: string): boolean {
    const key = this.keys.get(keyId);
    if (!key) return false;

    key.status = 'revoked';
    key.updatedAt = Date.now();
    key.metadata.revokedReason = reason;
    key.metadata.revokedAt = Date.now();

    // Remove from hash lookup
    this.keysByHash.delete(key.keyHash);

    this.emit('key-revoked', { keyId, reason });

    return true;
  }

  /**
   * Suspend key
   */
  suspendKey(keyId: string, reason?: string): boolean {
    const key = this.keys.get(keyId);
    if (!key || key.status === 'revoked') return false;

    key.status = 'suspended';
    key.updatedAt = Date.now();
    key.metadata.suspendedReason = reason;
    key.metadata.suspendedAt = Date.now();

    this.emit('key-suspended', { keyId, reason });

    return true;
  }

  /**
   * Unsuspend key
   */
  unsuspendKey(keyId: string): boolean {
    const key = this.keys.get(keyId);
    if (!key || key.status !== 'suspended') return false;

    key.status = 'active';
    key.updatedAt = Date.now();
    delete key.metadata.suspendedReason;
    delete key.metadata.suspendedAt;

    this.emit('key-unsuspended', { keyId });

    return true;
  }

  /**
   * Delete key (permanent)
   */
  deleteKey(keyId: string): boolean {
    const key = this.keys.get(keyId);
    if (!key) return false;

    this.keys.delete(keyId);
    this.keysByHash.delete(key.keyHash);
    this.rateLimitStates.delete(keyId);

    this.emit('key-deleted', { keyId });

    return true;
  }

  /**
   * Get key usage
   */
  getKeyUsage(keyId: string, options?: {
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): APIKeyUsage[] {
    let usage = this.usageLog.filter((u) => u.keyId === keyId);

    if (options?.startTime) {
      usage = usage.filter((u) => u.timestamp >= options.startTime!);
    }

    if (options?.endTime) {
      usage = usage.filter((u) => u.timestamp <= options.endTime!);
    }

    usage.sort((a, b) => b.timestamp - a.timestamp);

    return usage.slice(0, options?.limit || 100);
  }

  /**
   * Get usage statistics for a key
   */
  getKeyUsageStats(keyId: string): {
    total: number;
    success: number;
    errors: number;
    avgResponseTime: number;
    requestsByEndpoint: Record<string, number>;
    requestsByHour: number[];
  } {
    const usage = this.usageLog.filter((u) => u.keyId === keyId);

    const requestsByEndpoint: Record<string, number> = {};
    const requestsByHour = new Array(24).fill(0);
    let totalResponseTime = 0;

    for (const u of usage) {
      requestsByEndpoint[u.endpoint] = (requestsByEndpoint[u.endpoint] || 0) + 1;

      const hour = new Date(u.timestamp).getHours();
      requestsByHour[hour]++;

      totalResponseTime += u.responseTime;
    }

    return {
      total: usage.length,
      success: usage.filter((u) => u.success).length,
      errors: usage.filter((u) => !u.success).length,
      avgResponseTime: usage.length > 0 ? totalResponseTime / usage.length : 0,
      requestsByEndpoint,
      requestsByHour,
    };
  }

  /**
   * Get statistics
   */
  getStats(): APIKeyStats {
    const byType: Record<APIKeyType, number> = {
      public: 0,
      secret: 0,
      restricted: 0,
    };

    const byStatus: Record<APIKeyStatus, number> = {
      active: 0,
      revoked: 0,
      expired: 0,
      suspended: 0,
    };

    for (const key of this.keys.values()) {
      byType[key.type]++;
      byStatus[key.status]++;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const todayUsage = this.usageLog.filter((u) => u.timestamp >= todayStart);

    // Top keys by usage
    const keyUsage = new Map<string, number>();
    for (const u of todayUsage) {
      keyUsage.set(u.keyId, (keyUsage.get(u.keyId) || 0) + 1);
    }

    const topKeys = Array.from(keyUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyId, requests]) => {
        const key = this.keys.get(keyId);
        return { keyId, name: key?.name || 'Unknown', requests };
      });

    return {
      totalKeys: this.keys.size,
      activeKeys: byStatus.active,
      byType,
      byStatus,
      requestsToday: todayUsage.length,
      errorsToday: todayUsage.filter((u) => !u.success).length,
      topKeys,
    };
  }

  /**
   * Clean up rate limit states
   */
  private cleanupRateLimitStates(): void {
    const now = Date.now();

    for (const [keyId, state] of this.rateLimitStates) {
      // Remove if all counters have expired
      if (
        now >= state.second.resetAt &&
        now >= state.minute.resetAt &&
        now >= state.hour.resetAt &&
        now >= state.day.resetAt
      ) {
        this.rateLimitStates.delete(keyId);
      }
    }

    // Clean up old usage logs (older than 30 days)
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    this.usageLog = this.usageLog.filter((u) => u.timestamp > thirtyDaysAgo);
  }
}

// Singleton instance
let apiKeyManager: APIKeyManager | null = null;

export function getAPIKeyManager(): APIKeyManager {
  if (!apiKeyManager) {
    apiKeyManager = new APIKeyManager();
  }
  return apiKeyManager;
}

export default APIKeyManager;
