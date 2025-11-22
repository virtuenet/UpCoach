import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Unmock the redis service - jest.setup.ts mocks it globally but we want the real implementation
jest.unmock('../../services/redis');

// Redis package is automatically mocked via jest.config.js moduleNameMapper
// which points to src/tests/__mocks__/redis.js

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

// Import after mocks are set up
import redisService from '../../services/redis';

describe('RedisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the connection state
    (redisService as any).isConnected = false;
  });

  test('should import RedisService without errors', () => {
    expect(redisService).toBeDefined();
  });

  test('should handle basic Redis operations', async () => {
    // Access the mock client through the service
    const mockClient = redisService.rawClient as any;
    // Override the get method for this specific test
    mockClient.get.mockResolvedValueOnce('test-value');
    const result = await redisService.get('test-key');
    expect(result).toBe('test-value');
    expect(mockClient.get).toHaveBeenCalledWith('test-key');
  });

  test('should handle Redis connection', async () => {
    const mockClient = redisService.rawClient as any;
    await redisService.connect();
    expect(mockClient.connect).toHaveBeenCalled();
  });

  test('should handle Redis ping', async () => {
    const mockClient = redisService.rawClient as any;
    const result = await redisService.ping();
    expect(result).toBe('PONG');
    expect(mockClient.ping).toHaveBeenCalled();
  });
});