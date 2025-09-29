import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before importing RedisService
jest.mock('redis');
jest.mock('../../config/environment', () => ({
  config: {
    redisUrl: 'redis://localhost:6379'
  }
}));
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  }
}));

describe('RedisService', () => {
  let mockRedisClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Redis client
    mockRedisClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      setEx: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue(0),
      incr: jest.fn().mockResolvedValue(1),
      ping: jest.fn().mockResolvedValue('PONG'),
      on: jest.fn(),
      off: jest.fn(),
    };

    // Mock createClient
    const { createClient } = require('redis');
    createClient.mockReturnValue(mockRedisClient);
  });

  test('should import RedisService without errors', async () => {
    const redisService = await import('../../services/redis');
    expect(redisService.default).toBeDefined();
  });

  test('should handle basic Redis operations', async () => {
    const redisService = await import('../../services/redis');
    const redis = redisService.default;

    // Test basic get operation
    mockRedisClient.get.mockResolvedValue('test-value');
    const result = await redis.get('test-key');
    expect(result).toBe('test-value');
  });

  test('should handle Redis connection', async () => {
    const redisService = await import('../../services/redis');
    const redis = redisService.default;

    await redis.connect();
    expect(mockRedisClient.connect).toHaveBeenCalled();
  });

  test('should handle Redis ping', async () => {
    const redisService = await import('../../services/redis');
    const redis = redisService.default;

    const result = await redis.ping();
    expect(result).toBe('PONG');
    expect(mockRedisClient.ping).toHaveBeenCalled();
  });
});