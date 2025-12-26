import { createClient, RedisClientType } from 'redis';
import { logger } from '../../utils/logger';

/**
 * Tenant Redis Client
 *
 * Provides Redis namespace isolation for multi-tenant data:
 * - Automatic key prefixing per tenant
 * - Connection pooling
 * - Tenant-specific TTL policies
 * - Cache invalidation strategies
 *
 * Key Format: `tenant:{tenantId}:{namespace}:{key}`
 * Example: `tenant:acme-corp:sessions:user-123`
 */

export interface TenantCacheConfig {
  defaultTTL?: number; // seconds
  maxRetries?: number;
  retryDelay?: number;
}

export class TenantRedisClient {
  private client: RedisClientType;
  private tenantId: string;
  private defaultTTL: number;
  private keyPrefix: string;

  constructor(tenantId: string, config: TenantCacheConfig = {}) {
    this.tenantId = tenantId;
    this.defaultTTL = config.defaultTTL || 3600; // 1 hour default
    this.keyPrefix = `tenant:${tenantId}:`;

    // Create Redis client
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > (config.maxRetries || 10)) {
            logger.error('Redis max retries exceeded', { tenantId });
            return new Error('Max retries exceeded');
          }
          return Math.min(retries * 50, config.retryDelay || 1000);
        },
      },
    });

    // Setup event listeners
    this.client.on('error', (err) => {
      logger.error('Redis client error', {
        tenantId,
        error: err.message,
      });
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected', { tenantId });
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready', { tenantId });
    });

    this.client.on('reconnecting', () => {
      logger.warn('Redis client reconnecting', { tenantId });
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  /**
   * Set value with automatic tenant namespacing
   */
  async set(
    namespace: string,
    key: string,
    value: string | object,
    ttl?: number
  ): Promise<void> {
    await this.connect();

    const fullKey = this.buildKey(namespace, key);
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
    const expiry = ttl || this.defaultTTL;

    await this.client.setEx(fullKey, expiry, serializedValue);

    logger.debug('Redis SET', {
      tenantId: this.tenantId,
      key: fullKey,
      ttl: expiry,
    });
  }

  /**
   * Get value from cache
   */
  async get<T = string>(namespace: string, key: string): Promise<T | null> {
    await this.connect();

    const fullKey = this.buildKey(namespace, key);
    const value = await this.client.get(fullKey);

    if (!value) {
      return null;
    }

    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  /**
   * Delete key
   */
  async delete(namespace: string, key: string): Promise<void> {
    await this.connect();

    const fullKey = this.buildKey(namespace, key);
    await this.client.del(fullKey);

    logger.debug('Redis DEL', {
      tenantId: this.tenantId,
      key: fullKey,
    });
  }

  /**
   * Check if key exists
   */
  async exists(namespace: string, key: string): Promise<boolean> {
    await this.connect();

    const fullKey = this.buildKey(namespace, key);
    const exists = await this.client.exists(fullKey);

    return exists === 1;
  }

  /**
   * Increment counter
   */
  async increment(namespace: string, key: string, by: number = 1): Promise<number> {
    await this.connect();

    const fullKey = this.buildKey(namespace, key);
    const newValue = await this.client.incrBy(fullKey, by);

    return newValue;
  }

  /**
   * Decrement counter
   */
  async decrement(namespace: string, key: string, by: number = 1): Promise<number> {
    await this.connect();

    const fullKey = this.buildKey(namespace, key);
    const newValue = await this.client.decrBy(fullKey, by);

    return newValue;
  }

  /**
   * Set expiry on existing key
   */
  async expire(namespace: string, key: string, ttl: number): Promise<void> {
    await this.connect();

    const fullKey = this.buildKey(namespace, key);
    await this.client.expire(fullKey, ttl);
  }

  /**
   * Get TTL of key
   */
  async ttl(namespace: string, key: string): Promise<number> {
    await this.connect();

    const fullKey = this.buildKey(namespace, key);
    return await this.client.ttl(fullKey);
  }

  /**
   * Add value to set
   */
  async sAdd(namespace: string, key: string, ...members: string[]): Promise<number> {
    await this.connect();

    const fullKey = this.buildKey(namespace, key);
    return await this.client.sAdd(fullKey, members);
  }

  /**
   * Remove value from set
   */
  async sRem(namespace: string, key: string, ...members: string[]): Promise<number> {
    await this.connect();

    const fullKey = this.buildKey(namespace, key);
    return await this.client.sRem(fullKey, members);
  }

  /**
   * Get all members of set
   */
  async sMembers(namespace: string, key: string): Promise<string[]> {
    await this.connect();

    const fullKey = this.buildKey(namespace, key);
    return await this.client.sMembers(fullKey);
  }

  /**
   * Check if member exists in set
   */
  async sIsMember(namespace: string, key: string, member: string): Promise<boolean> {
    await this.connect();

    const fullKey = this.buildKey(namespace, key);
    return await this.client.sIsMember(fullKey, member);
  }

  /**
   * Add value to sorted set
   */
  async zAdd(
    namespace: string,
    key: string,
    score: number,
    member: string
  ): Promise<number> {
    await this.connect();

    const fullKey = this.buildKey(namespace, key);
    return await this.client.zAdd(fullKey, { score, value: member });
  }

  /**
   * Get sorted set range by score
   */
  async zRangeByScore(
    namespace: string,
    key: string,
    min: number,
    max: number
  ): Promise<string[]> {
    await this.connect();

    const fullKey = this.buildKey(namespace, key);
    return await this.client.zRangeByScore(fullKey, min, max);
  }

  /**
   * Push to list (left)
   */
  async lPush(namespace: string, key: string, ...values: string[]): Promise<number> {
    await this.connect();

    const fullKey = this.buildKey(namespace, key);
    return await this.client.lPush(fullKey, values);
  }

  /**
   * Pop from list (right)
   */
  async rPop(namespace: string, key: string): Promise<string | null> {
    await this.connect();

    const fullKey = this.buildKey(namespace, key);
    return await this.client.rPop(fullKey);
  }

  /**
   * Get list range
   */
  async lRange(namespace: string, key: string, start: number, stop: number): Promise<string[]> {
    await this.connect();

    const fullKey = this.buildKey(namespace, key);
    return await this.client.lRange(fullKey, start, stop);
  }

  /**
   * Delete all keys for this tenant in a namespace
   */
  async flushNamespace(namespace: string): Promise<void> {
    await this.connect();

    const pattern = `${this.keyPrefix}${namespace}:*`;
    const keys = await this.scanKeys(pattern);

    if (keys.length > 0) {
      await this.client.del(keys);

      logger.info('Redis namespace flushed', {
        tenantId: this.tenantId,
        namespace,
        keysDeleted: keys.length,
      });
    }
  }

  /**
   * Delete all keys for this tenant (use with caution!)
   */
  async flushTenant(): Promise<void> {
    await this.connect();

    const pattern = `${this.keyPrefix}*`;
    const keys = await this.scanKeys(pattern);

    if (keys.length > 0) {
      await this.client.del(keys);

      logger.warn('Redis tenant flushed', {
        tenantId: this.tenantId,
        keysDeleted: keys.length,
      });
    }
  }

  /**
   * Get all keys matching pattern using SCAN (cursor-based)
   */
  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = 0;

    do {
      const result = await this.client.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });

      cursor = result.cursor;
      keys.push(...result.keys);
    } while (cursor !== 0);

    return keys;
  }

  /**
   * Build full Redis key with tenant namespace
   */
  private buildKey(namespace: string, key: string): string {
    return `${this.keyPrefix}${namespace}:${key}`;
  }

  /**
   * Publish message to Redis pub/sub channel (tenant-scoped)
   */
  async publish(channel: string, message: string | object): Promise<number> {
    await this.connect();

    const fullChannel = `${this.keyPrefix}${channel}`;
    const serializedMessage = typeof message === 'object' ? JSON.stringify(message) : message;

    return await this.client.publish(fullChannel, serializedMessage);
  }

  /**
   * Subscribe to Redis pub/sub channel (tenant-scoped)
   */
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.connect();

    const fullChannel = `${this.keyPrefix}${channel}`;

    await this.client.subscribe(fullChannel, (message) => {
      callback(message);
    });

    logger.info('Subscribed to Redis channel', {
      tenantId: this.tenantId,
      channel: fullChannel,
    });
  }

  /**
   * Unsubscribe from Redis pub/sub channel
   */
  async unsubscribe(channel: string): Promise<void> {
    await this.connect();

    const fullChannel = `${this.keyPrefix}${channel}`;
    await this.client.unsubscribe(fullChannel);

    logger.info('Unsubscribed from Redis channel', {
      tenantId: this.tenantId,
      channel: fullChannel,
    });
  }
}

/**
 * Tenant Redis Client Factory
 */
export class TenantRedisClientFactory {
  private static instances: Map<string, TenantRedisClient> = new Map();

  /**
   * Get or create Redis client for tenant
   */
  static getClient(tenantId: string, config?: TenantCacheConfig): TenantRedisClient {
    if (!this.instances.has(tenantId)) {
      const client = new TenantRedisClient(tenantId, config);
      this.instances.set(tenantId, client);
    }

    return this.instances.get(tenantId)!;
  }

  /**
   * Disconnect and remove client for tenant
   */
  static async removeClient(tenantId: string): Promise<void> {
    const client = this.instances.get(tenantId);

    if (client) {
      await client.disconnect();
      this.instances.delete(tenantId);
    }
  }

  /**
   * Disconnect all clients
   */
  static async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.instances.values()).map((client) =>
      client.disconnect()
    );

    await Promise.all(disconnectPromises);
    this.instances.clear();

    logger.info('All tenant Redis clients disconnected');
  }
}
