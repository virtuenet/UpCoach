import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock dependencies before importing RedisService
jest.mock('redis');
jest.mock('../../config/environment');
jest.mock('../../utils/logger');

// Import the redis service instance
import redisService from '../../services/redis';

describe('RedisService', () => {
  let mockRedisClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Redis client
    mockRedisClient = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      quit: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      keys: jest.fn(),
      mget: jest.fn(),
      mset: jest.fn(),
      hGet: jest.fn(),
      hSet: jest.fn(),
      hDel: jest.fn(),
      hGetAll: jest.fn(),
      lPush: jest.fn(),
      rPush: jest.fn(),
      lPop: jest.fn(),
      rPop: jest.fn(),
      lRange: jest.fn(),
      sAdd: jest.fn(),
      sRem: jest.fn(),
      sMembers: jest.fn(),
      incr: jest.fn(),
      decr: jest.fn(),
      flushDb: jest.fn(),
      ping: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      isReady: true,
    };

    // Mock createClient
    const { createClient } = require('redis');
    createClient.mockReturnValue(mockRedisClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    test('should connect to Redis successfully', async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);

      await redisService.connect();

      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    test('should handle connection errors', async () => {
      const connectionError = new Error('Connection failed');
      mockRedisClient.connect.mockRejectedValue(connectionError);

      await expect(redisService.connect()).rejects.toThrow('Connection failed');
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    test('should disconnect from Redis', async () => {
      mockRedisClient.disconnect.mockResolvedValue(undefined);

      await redisService.disconnect();

      expect(mockRedisClient.disconnect).toHaveBeenCalled();
    });

    test('should check if Redis is ready', () => {
      const isReady = redisService.isReady();

      expect(typeof isReady).toBe('boolean');
    });
  });

  describe('Basic Operations', () => {
    test('should get value by key', async () => {
      const key = 'test-key';
      const expectedValue = 'test-value';
      mockRedisClient.get.mockResolvedValue(expectedValue);

      const result = await redisService.get(key);

      expect(result).toBe(expectedValue);
      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
    });

    test('should set key-value pair', async () => {
      const key = 'test-key';
      const value = 'test-value';
      mockRedisClient.set.mockResolvedValue('OK');

      await redisService.set(key, value);

      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value);
    });

    test('should set key-value pair with expiration', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 3600;
      mockRedisClient.setEx.mockResolvedValue('OK');

      await redisService.set(key, value, ttl);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(key, ttl, value);
    });

    test('should delete key', async () => {
      const key = 'test-key';
      mockRedisClient.del.mockResolvedValue(1);

      const result = await redisService.del(key);

      expect(result).toBe(1);
      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
    });

    test('should check if key exists', async () => {
      const key = 'test-key';
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await redisService.exists(key);

      expect(result).toBe(1);
      expect(mockRedisClient.exists).toHaveBeenCalledWith(key);
    });

    test('should set expiration for key', async () => {
      const key = 'test-key';
      const ttl = 3600;
      mockRedisClient.expire.mockResolvedValue(1);

      const result = await redisService.expire(key, ttl);

      expect(result).toBe(true);
      expect(mockRedisClient.expire).toHaveBeenCalledWith(key, ttl);
    });

    test('should get TTL for key', async () => {
      const key = 'test-key';
      const ttl = 3600;
      mockRedisClient.ttl.mockResolvedValue(ttl);

      const result = await redisService.ttl(key);

      expect(result).toBe(ttl);
      expect(mockRedisClient.ttl).toHaveBeenCalledWith(key);
    });
  });

  describe('Advanced Operations', () => {
    test('should get multiple keys', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = ['value1', 'value2', 'value3'];
      mockRedisClient.mget.mockResolvedValue(values);

      const result = await redisService.mget(keys);

      expect(result).toEqual(values);
      expect(mockRedisClient.mget).toHaveBeenCalledWith(keys);
    });

    test('should set multiple key-value pairs', async () => {
      const keyValues = { key1: 'value1', key2: 'value2' };
      mockRedisClient.mset.mockResolvedValue('OK');

      const result = await redisService.mset(keyValues);

      expect(result).toBe('OK');
      expect(mockRedisClient.mset).toHaveBeenCalledWith(keyValues);
    });

    test('should increment counter', async () => {
      const key = 'counter';
      mockRedisClient.incr.mockResolvedValue(1);

      const result = await redisService.incr(key);

      expect(result).toBe(1);
      expect(mockRedisClient.incr).toHaveBeenCalledWith(key);
    });

    test('should decrement counter', async () => {
      const key = 'counter';
      mockRedisClient.decr.mockResolvedValue(0);

      const result = await redisService.decr(key);

      expect(result).toBe(0);
      expect(mockRedisClient.decr).toHaveBeenCalledWith(key);
    });
  });

  describe('Hash Operations', () => {
    test('should get hash field', async () => {
      const key = 'test-hash';
      const field = 'field1';
      const value = 'value1';
      mockRedisClient.hget.mockResolvedValue(value);

      const result = await redisService.hget(key, field);

      expect(result).toBe(value);
      expect(mockRedisClient.hget).toHaveBeenCalledWith(key, field);
    });

    test('should set hash field', async () => {
      const key = 'test-hash';
      const field = 'field1';
      const value = 'value1';
      mockRedisClient.hset.mockResolvedValue(1);

      const result = await redisService.hset(key, field, value);

      expect(result).toBe(1);
      expect(mockRedisClient.hset).toHaveBeenCalledWith(key, field, value);
    });

    test('should get all hash fields', async () => {
      const key = 'test-hash';
      const hash = { field1: 'value1', field2: 'value2' };
      mockRedisClient.hgetall.mockResolvedValue(hash);

      const result = await redisService.hgetall(key);

      expect(result).toEqual(hash);
      expect(mockRedisClient.hgetall).toHaveBeenCalledWith(key);
    });

    test('should delete hash field', async () => {
      const key = 'test-hash';
      const field = 'field1';
      mockRedisClient.hdel.mockResolvedValue(1);

      const result = await redisService.hdel(key, field);

      expect(result).toBe(1);
      expect(mockRedisClient.hdel).toHaveBeenCalledWith(key, field);
    });
  });

  describe('List Operations', () => {
    test('should push to left of list', async () => {
      const key = 'test-list';
      const value = 'value1';
      mockRedisClient.lpush.mockResolvedValue(1);

      const result = await redisService.lpush(key, value);

      expect(result).toBe(1);
      expect(mockRedisClient.lpush).toHaveBeenCalledWith(key, value);
    });

    test('should push to right of list', async () => {
      const key = 'test-list';
      const value = 'value1';
      mockRedisClient.rpush.mockResolvedValue(1);

      const result = await redisService.rpush(key, value);

      expect(result).toBe(1);
      expect(mockRedisClient.rpush).toHaveBeenCalledWith(key, value);
    });

    test('should pop from left of list', async () => {
      const key = 'test-list';
      const value = 'value1';
      mockRedisClient.lpop.mockResolvedValue(value);

      const result = await redisService.lpop(key);

      expect(result).toBe(value);
      expect(mockRedisClient.lpop).toHaveBeenCalledWith(key);
    });

    test('should get range from list', async () => {
      const key = 'test-list';
      const start = 0;
      const stop = -1;
      const values = ['value1', 'value2', 'value3'];
      mockRedisClient.lrange.mockResolvedValue(values);

      const result = await redisService.lrange(key, start, stop);

      expect(result).toEqual(values);
      expect(mockRedisClient.lrange).toHaveBeenCalledWith(key, start, stop);
    });
  });

  describe('Set Operations', () => {
    test('should add to set', async () => {
      const key = 'test-set';
      const member = 'member1';
      mockRedisClient.sadd.mockResolvedValue(1);

      const result = await redisService.sadd(key, member);

      expect(result).toBe(1);
      expect(mockRedisClient.sadd).toHaveBeenCalledWith(key, member);
    });

    test('should remove from set', async () => {
      const key = 'test-set';
      const member = 'member1';
      mockRedisClient.srem.mockResolvedValue(1);

      const result = await redisService.srem(key, member);

      expect(result).toBe(1);
      expect(mockRedisClient.srem).toHaveBeenCalledWith(key, member);
    });

    test('should get all set members', async () => {
      const key = 'test-set';
      const members = ['member1', 'member2', 'member3'];
      mockRedisClient.smembers.mockResolvedValue(members);

      const result = await redisService.smembers(key);

      expect(result).toEqual(members);
      expect(mockRedisClient.smembers).toHaveBeenCalledWith(key);
    });
  });

  describe('Utility Operations', () => {
    test('should get keys matching pattern', async () => {
      const pattern = 'test:*';
      const keys = ['test:key1', 'test:key2'];
      mockRedisClient.keys.mockResolvedValue(keys);

      const result = await redisService.keys(pattern);

      expect(result).toEqual(keys);
      expect(mockRedisClient.keys).toHaveBeenCalledWith(pattern);
    });

    test('should flush database', async () => {
      mockRedisClient.flushdb.mockResolvedValue('OK');

      const result = await redisService.flushdb();

      expect(result).toBe('OK');
      expect(mockRedisClient.flushdb).toHaveBeenCalled();
    });

    test('should ping Redis', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await redisService.ping();

      expect(result).toBe('PONG');
      expect(mockRedisClient.ping).toHaveBeenCalled();
    });
  });

  describe('Health Check', () => {
    test('should perform health check successfully', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await redisService.healthCheck();

      expect(result).toEqual({
        status: 'healthy',
        ping: 'PONG',
        timestamp: expect.any(Date),
      });
    });

    test('should detect unhealthy Redis', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Connection lost'));

      const result = await redisService.healthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe('Connection lost');
    });
  });

  describe('Error Handling', () => {
    test('should handle Redis errors gracefully', async () => {
      const error = new Error('Redis error');
      mockRedisClient.get.mockRejectedValue(error);

      await expect(redisService.get('test-key')).rejects.toThrow('Redis error');
    });

    test('should handle connection timeout', async () => {
      const timeoutError = new Error('Connection timeout');
      mockRedisClient.connect.mockRejectedValue(timeoutError);

      await expect(redisService.connect()).rejects.toThrow('Connection timeout');
    });
  });
});