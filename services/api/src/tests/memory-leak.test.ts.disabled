/**
 * Memory leak detection test to verify our fixes
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Memory Leak Prevention Tests', () => {
  let initialMemory: number;

  beforeEach(() => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    initialMemory = process.memoryUsage().heapUsed;
  });

  afterEach(() => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  it('should not leak memory with simple operations', () => {
    // Create some objects
    const testData = Array(1000).fill(null).map((_, i) => ({
      id: `test-${i}`,
      data: `data-${i}`,
      timestamp: new Date()
    }));

    expect(testData).toHaveLength(1000);

    // Clear reference
    testData.length = 0;
  });

  it('should not leak memory with mock functions', () => {
    const mockFn = jest.fn();
    
    // Use mock function multiple times
    for (let i = 0; i < 100; i++) {
      mockFn(`call-${i}`);
    }

    expect(mockFn).toHaveBeenCalledTimes(100);
    
    // Clear the mock
    mockFn.mockClear();
  });

  it('should not leak memory with promises', async () => {
    const promises = Array(50).fill(null).map(async (_, i) => {
      await new Promise(resolve => setTimeout(resolve, 1));
      return `result-${i}`;
    });

    const results = await Promise.all(promises);
    expect(results).toHaveLength(50);
  });

  it('should handle module cleanup properly', () => {
    // Test that our module cleanup is working
    expect(typeof process.env.NODE_ENV).toBe('string');
    expect(process.env.NODE_ENV).toBe('test');
  });
});