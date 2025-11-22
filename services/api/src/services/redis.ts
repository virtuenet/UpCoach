import { createClient, RedisClientType } from 'redis';

import { config } from '../config/environment';
import { logger } from '../utils/logger';

class RedisService {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: config.redisUrl,
      socket: {
        connectTimeout: 5000,
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
      this.isConnected = true;
    });

    this.client.on('error', err => {
      logger.error('Redis client error:', err);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.info('Redis client disconnected');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
      } catch (error) {
        logger.error('Failed to connect to Redis:', error);
        throw error;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.client.quit();
      } catch (error) {
        logger.error('Error disconnecting from Redis:', error);
        throw error;
      }
    }
  }

  // Basic Redis operations
  async get(key: string): Promise<string | null> {
    try {
      await this.ensureConnected();
      return await this.client.get(key);
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      throw error;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      await this.ensureConnected();
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      throw error;
    }
  }

  async setEx(key: string, ttl: number, value: string): Promise<void> {
    try {
      await this.ensureConnected();
      await this.client.setEx(key, ttl, value);
    } catch (error) {
      logger.error(`Redis SETEX error for key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    try {
      await this.ensureConnected();
      return await this.client.del(key);
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      await this.ensureConnected();
      return await this.client.exists(key);
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      throw error;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      await this.ensureConnected();
      return await this.client.incr(key);
    } catch (error) {
      logger.error(`Redis INCR error for key ${key}:`, error);
      throw error;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      await this.ensureConnected();
      return await this.client.decr(key);
    } catch (error) {
      logger.error(`Redis DECR error for key ${key}:`, error);
      throw error;
    }
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    try {
      await this.ensureConnected();
      return await this.client.mGet(keys);
    } catch (error) {
      logger.error(`Redis MGET error for keys ${keys.join(', ')}:`, error);
      throw error;
    }
  }

  async mset(keyValues: Record<string, string>): Promise<string> {
    try {
      await this.ensureConnected();
      return await this.client.mSet(keyValues);
    } catch (error) {
      logger.error(`Redis MSET error:`, error);
      throw error;
    }
  }

  async ping(): Promise<string> {
    try {
      await this.ensureConnected();
      return await this.client.ping();
    } catch (error) {
      logger.error('Redis PING error:', error);
      throw error;
    }
  }

  async quit(): Promise<string> {
    try {
      if (this.isConnected) {
        return await this.client.quit();
      }
      return 'OK';
    } catch (error) {
      logger.error('Redis QUIT error:', error);
      throw error;
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | undefined> {
    try {
      await this.ensureConnected();
      return await this.client.hGet(key, field);
    } catch (error) {
      logger.error(`Redis HGET error for key ${key}, field ${field}:`, error);
      throw error;
    }
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    try {
      await this.ensureConnected();
      return await this.client.hSet(key, field, value);
    } catch (error) {
      logger.error(`Redis HSET error for key ${key}, field ${field}:`, error);
      throw error;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      await this.ensureConnected();
      return await this.client.hGetAll(key);
    } catch (error) {
      logger.error(`Redis HGETALL error for key ${key}:`, error);
      throw error;
    }
  }

  async hdel(key: string, field: string): Promise<number> {
    try {
      await this.ensureConnected();
      return await this.client.hDel(key, field);
    } catch (error) {
      logger.error(`Redis HDEL error for key ${key}, field ${field}:`, error);
      throw error;
    }
  }

  // List operations
  async lpush(key: string, value: string): Promise<number> {
    try {
      await this.ensureConnected();
      return await this.client.lPush(key, value);
    } catch (error) {
      logger.error(`Redis LPUSH error for key ${key}:`, error);
      throw error;
    }
  }

  async rpush(key: string, value: string): Promise<number> {
    try {
      await this.ensureConnected();
      return await this.client.rPush(key, value);
    } catch (error) {
      logger.error(`Redis RPUSH error for key ${key}:`, error);
      throw error;
    }
  }

  async lpop(key: string): Promise<string | null> {
    try {
      await this.ensureConnected();
      return await this.client.lPop(key);
    } catch (error) {
      logger.error(`Redis LPOP error for key ${key}:`, error);
      throw error;
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      await this.ensureConnected();
      return await this.client.rPop(key);
    } catch (error) {
      logger.error(`Redis RPOP error for key ${key}:`, error);
      throw error;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      await this.ensureConnected();
      return await this.client.lRange(key, start, stop);
    } catch (error) {
      logger.error(`Redis LRANGE error for key ${key}:`, error);
      throw error;
    }
  }

  async ltrim(key: string, start: number, stop: number): Promise<string> {
    try {
      await this.ensureConnected();
      return await this.client.lTrim(key, start, stop);
    } catch (error) {
      logger.error(`Redis LTRIM error for key ${key}:`, error);
      throw error;
    }
  }

  // Session management helpers
  async getSession(sessionId: string): Promise<unknown> {
    try {
      const sessionData = await this.get(`session:${sessionId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      logger.error(`Error getting session ${sessionId}:`, error);
      return null;
    }
  }

  async setSession(sessionId: string, data: unknown, ttl: number = 3600): Promise<void> {
    try {
      await this.setEx(`session:${sessionId}`, ttl, JSON.stringify(data));
    } catch (error) {
      logger.error(`Error setting session ${sessionId}:`, error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      await this.del(`session:${sessionId}`);
    } catch (error) {
      logger.error(`Error deleting session ${sessionId}:`, error);
      throw error;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      await this.ensureConnected();
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error(`Redis KEYS error for pattern ${pattern}:`, error);
      throw error;
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  // Set operations
  async sadd(key: string, member: string): Promise<number> {
    try {
      await this.ensureConnected();
      return await this.client.sAdd(key, member);
    } catch (error) {
      logger.error(`Redis SADD error for key ${key}:`, error);
      throw error;
    }
  }

  async srem(key: string, member: string): Promise<number> {
    try {
      await this.ensureConnected();
      return await this.client.sRem(key, member);
    } catch (error) {
      logger.error(`Redis SREM error for key ${key}:`, error);
      throw error;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      await this.ensureConnected();
      return await this.client.sMembers(key);
    } catch (error) {
      logger.error(`Redis SMEMBERS error for key ${key}:`, error);
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      await this.ensureConnected();
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error);
      throw error;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      await this.ensureConnected();
      return await this.client.ttl(key);
    } catch (error) {
      logger.error(`Redis TTL error for key ${key}:`, error);
      throw error;
    }
  }

  async pipeline(): Promise<unknown> {
    try {
      await this.ensureConnected();
      return this.client.multi();
    } catch (error) {
      logger.error('Redis PIPELINE error:', error);
      throw error;
    }
  }

  async flushdb(): Promise<string> {
    try {
      await this.ensureConnected();
      return await this.client.flushDb();
    } catch (error) {
      logger.error('Redis FLUSHDB error:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }

  async healthCheck(): Promise<{ status: string; ping?: string; error?: string; timestamp: Date }> {
    try {
      const ping = await this.ping();
      return {
        status: 'healthy',
        ping,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  // Expose the raw client for advanced operations
  get rawClient(): RedisClientType {
    return this.client;
  }
}

// Create and export Redis service instance
const redisService = new RedisService();

// Auto-connect in non-test environments
if (process.env.NODE_ENV !== 'test') {
  redisService.connect().catch(error => {
    logger.error('Failed to auto-connect to Redis:', error);
  });
}

export { redisService as redis };
export default redisService;
