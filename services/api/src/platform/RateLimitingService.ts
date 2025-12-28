import { EventEmitter } from 'events';

/**
 * Rate Limit Window
 */
export type RateLimitWindow = 'second' | 'minute' | 'hour' | 'day';

/**
 * Rate Limit Configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Window size in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Only count failed requests
  skipFailedRequests?: boolean; // Only count successful requests
  keyGenerator?: (identifier: string) => string; // Custom key generator
}

/**
 * Rate Limit Record
 */
interface RateLimitRecord {
  identifier: string;
  requests: Array<{ timestamp: Date; success: boolean }>;
  blocked: number;
  firstRequestAt: Date;
  lastRequestAt: Date;
}

/**
 * Rate Limit Result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // Seconds until reset
}

/**
 * RateLimitingService
 *
 * Provides flexible rate limiting with multiple strategies:
 * - Fixed window
 * - Sliding window
 * - Token bucket
 * - Leaky bucket
 */
export class RateLimitingService extends EventEmitter {
  private static instance: RateLimitingService;
  private records: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    super();
    // Cleanup old records every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanupOldRecords(), 5 * 60 * 1000);
  }

  static getInstance(): RateLimitingService {
    if (!RateLimitingService.instance) {
      RateLimitingService.instance = new RateLimitingService();
    }
    return RateLimitingService.instance;
  }

  /**
   * Check Fixed Window Rate Limit
   */
  async checkFixedWindow(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier;
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    let record = this.records.get(key);
    if (!record) {
      record = {
        identifier: key,
        requests: [],
        blocked: 0,
        firstRequestAt: now,
        lastRequestAt: now,
      };
      this.records.set(key, record);
    }

    // Remove requests outside the window
    record.requests = record.requests.filter(r => r.timestamp >= windowStart);

    // Count requests based on configuration
    const requestCount = this.countRequests(record.requests, config);

    const allowed = requestCount < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - requestCount);
    const resetAt = new Date(now.getTime() + config.windowMs);
    const retryAfter = Math.ceil(config.windowMs / 1000);

    if (!allowed) {
      record.blocked++;
      this.emit('rate_limit:exceeded', {
        identifier: key,
        limit: config.maxRequests,
        windowMs: config.windowMs,
        blocked: record.blocked,
      });
    }

    return { allowed, limit: config.maxRequests, remaining, resetAt, retryAfter };
  }

  /**
   * Check Sliding Window Rate Limit
   */
  async checkSlidingWindow(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier;
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    let record = this.records.get(key);
    if (!record) {
      record = {
        identifier: key,
        requests: [],
        blocked: 0,
        firstRequestAt: now,
        lastRequestAt: now,
      };
      this.records.set(key, identifier);
    }

    // Remove requests outside the sliding window
    record.requests = record.requests.filter(r => r.timestamp >= windowStart);

    const requestCount = this.countRequests(record.requests, config);

    const allowed = requestCount < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - requestCount);

    // Calculate reset time (when the oldest request expires)
    const oldestRequest = record.requests[0];
    const resetAt = oldestRequest
      ? new Date(oldestRequest.timestamp.getTime() + config.windowMs)
      : new Date(now.getTime() + config.windowMs);

    const retryAfter = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);

    if (!allowed) {
      record.blocked++;
      this.emit('rate_limit:exceeded', {
        identifier: key,
        limit: config.maxRequests,
        windowMs: config.windowMs,
        blocked: record.blocked,
        strategy: 'sliding_window',
      });
    }

    return { allowed, limit: config.maxRequests, remaining, resetAt, retryAfter };
  }

  /**
   * Record Request
   */
  async recordRequest(
    identifier: string,
    success: boolean = true,
    keyGenerator?: (identifier: string) => string
  ): Promise<void> {
    const key = keyGenerator ? keyGenerator(identifier) : identifier;
    const now = new Date();

    let record = this.records.get(key);
    if (!record) {
      record = {
        identifier: key,
        requests: [],
        blocked: 0,
        firstRequestAt: now,
        lastRequestAt: now,
      };
      this.records.set(key, record);
    }

    record.requests.push({ timestamp: now, success });
    record.lastRequestAt = now;

    this.emit('rate_limit:request_recorded', {
      identifier: key,
      success,
      totalRequests: record.requests.length,
    });
  }

  /**
   * Token Bucket Rate Limiting
   */
  private tokenBuckets: Map<
    string,
    { tokens: number; lastRefill: Date; capacity: number; refillRate: number }
  > = new Map();

  async checkTokenBucket(
    identifier: string,
    capacity: number,
    refillRate: number // Tokens per second
  ): Promise<RateLimitResult> {
    const now = new Date();
    let bucket = this.tokenBuckets.get(identifier);

    if (!bucket) {
      bucket = {
        tokens: capacity,
        lastRefill: now,
        capacity,
        refillRate,
      };
      this.tokenBuckets.set(identifier, bucket);
    }

    // Refill tokens
    const timeSinceRefill = (now.getTime() - bucket.lastRefill.getTime()) / 1000;
    const tokensToAdd = timeSinceRefill * refillRate;
    bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    const allowed = bucket.tokens >= 1;
    if (allowed) {
      bucket.tokens -= 1;
    }

    const remaining = Math.floor(bucket.tokens);
    const resetAt = new Date(now.getTime() + ((1 - (bucket.tokens % 1)) / refillRate) * 1000);
    const retryAfter = allowed ? 0 : Math.ceil((1 - bucket.tokens) / refillRate);

    if (!allowed) {
      this.emit('rate_limit:exceeded', {
        identifier,
        strategy: 'token_bucket',
        capacity,
        refillRate,
      });
    }

    return { allowed, limit: capacity, remaining, resetAt, retryAfter };
  }

  /**
   * Leaky Bucket Rate Limiting
   */
  private leakyBuckets: Map<
    string,
    { queue: Date[]; capacity: number; leakRate: number; lastLeak: Date }
  > = new Map();

  async checkLeakyBucket(
    identifier: string,
    capacity: number,
    leakRate: number // Requests per second
  ): Promise<RateLimitResult> {
    const now = new Date();
    let bucket = this.leakyBuckets.get(identifier);

    if (!bucket) {
      bucket = {
        queue: [],
        capacity,
        leakRate,
        lastLeak: now,
      };
      this.leakyBuckets.set(identifier, bucket);
    }

    // Leak requests
    const timeSinceLeak = (now.getTime() - bucket.lastLeak.getTime()) / 1000;
    const requestsToLeak = Math.floor(timeSinceLeak * leakRate);
    bucket.queue = bucket.queue.slice(requestsToLeak);
    bucket.lastLeak = now;

    const allowed = bucket.queue.length < capacity;
    if (allowed) {
      bucket.queue.push(now);
    }

    const remaining = Math.max(0, capacity - bucket.queue.length);
    const resetAt = new Date(now.getTime() + (bucket.queue.length / leakRate) * 1000);
    const retryAfter = allowed ? 0 : Math.ceil((bucket.queue.length - capacity + 1) / leakRate);

    if (!allowed) {
      this.emit('rate_limit:exceeded', {
        identifier,
        strategy: 'leaky_bucket',
        capacity,
        leakRate,
        queueSize: bucket.queue.length,
      });
    }

    return { allowed, limit: capacity, remaining, resetAt, retryAfter };
  }

  /**
   * Get Rate Limit Statistics
   */
  async getStatistics(identifier: string): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    blocked: number;
    firstRequestAt?: Date;
    lastRequestAt?: Date;
  } | null> {
    const record = this.records.get(identifier);
    if (!record) {
      return null;
    }

    const totalRequests = record.requests.length;
    const successfulRequests = record.requests.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      blocked: record.blocked,
      firstRequestAt: record.firstRequestAt,
      lastRequestAt: record.lastRequestAt,
    };
  }

  /**
   * Reset Rate Limit
   */
  async reset(identifier: string): Promise<void> {
    this.records.delete(identifier);
    this.tokenBuckets.delete(identifier);
    this.leakyBuckets.delete(identifier);

    this.emit('rate_limit:reset', { identifier });
  }

  /**
   * Count Requests Based on Configuration
   */
  private countRequests(
    requests: Array<{ timestamp: Date; success: boolean }>,
    config: RateLimitConfig
  ): number {
    if (config.skipSuccessfulRequests) {
      return requests.filter(r => !r.success).length;
    }
    if (config.skipFailedRequests) {
      return requests.filter(r => r.success).length;
    }
    return requests.length;
  }

  /**
   * Cleanup Old Records
   */
  private cleanupOldRecords(): void {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    let cleaned = 0;
    this.records.forEach((record, key) => {
      if (now.getTime() - record.lastRequestAt.getTime() > maxAge) {
        this.records.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      this.emit('rate_limit:cleanup', {
        timestamp: now,
        recordsCleaned: cleaned,
        remainingRecords: this.records.size,
      });
    }
  }

  /**
   * Destroy Service
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.records.clear();
    this.tokenBuckets.clear();
    this.leakyBuckets.clear();
  }
}

export const rateLimitingService = RateLimitingService.getInstance();
