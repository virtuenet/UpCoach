/**
 * Performance Test Setup
 *
 * Configures performance testing environment with:
 * - Timing utilities
 * - Memory monitoring
 * - Performance thresholds
 * - Test result aggregation
 */

import { performance } from 'perf_hooks';

// Performance thresholds (in milliseconds)
export const PERFORMANCE_THRESHOLDS = {
  // API response times
  FAST_ENDPOINT: 50, // < 50ms for cached/simple queries
  NORMAL_ENDPOINT: 200, // < 200ms for standard queries
  SLOW_ENDPOINT: 1000, // < 1s for complex queries
  BATCH_OPERATION: 5000, // < 5s for batch operations

  // Database queries
  SIMPLE_QUERY: 10, // < 10ms for indexed queries
  COMPLEX_QUERY: 100, // < 100ms for joins/aggregations

  // Memory limits
  MEMORY_LEAK_THRESHOLD: 50 * 1024 * 1024, // 50MB max increase
};

/**
 * Measure function execution time
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number; memory: { before: number; after: number } }> {
  const startMemory = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  const result = await fn();

  const endTime = performance.now();
  const endMemory = process.memoryUsage().heapUsed;
  const duration = endTime - startTime;

  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

  return {
    result,
    duration,
    memory: {
      before: startMemory,
      after: endMemory,
    },
  };
}

/**
 * Assert performance meets threshold
 */
export function assertPerformance(
  name: string,
  actualDuration: number,
  threshold: number
): void {
  if (actualDuration > threshold) {
    throw new Error(
      `Performance threshold exceeded for ${name}: ${actualDuration.toFixed(2)}ms > ${threshold}ms`
    );
  }
  console.log(`[Performance] ✓ ${name} passed: ${actualDuration.toFixed(2)}ms <= ${threshold}ms`);
}

/**
 * Measure concurrent operations
 */
export async function measureConcurrent<T>(
  name: string,
  fn: () => Promise<T>,
  concurrency: number
): Promise<{
  results: T[];
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
}> {
  const startTime = performance.now();
  const durations: number[] = [];

  const promises = Array.from({ length: concurrency }, async () => {
    const opStart = performance.now();
    const result = await fn();
    const opEnd = performance.now();
    durations.push(opEnd - opStart);
    return result;
  });

  const results = await Promise.all(promises);
  const endTime = performance.now();

  const totalDuration = endTime - startTime;
  const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);

  console.log(`[Performance] ${name} (${concurrency} concurrent):`);
  console.log(`  Total: ${totalDuration.toFixed(2)}ms`);
  console.log(`  Average: ${averageDuration.toFixed(2)}ms`);
  console.log(`  Min: ${minDuration.toFixed(2)}ms`);
  console.log(`  Max: ${maxDuration.toFixed(2)}ms`);

  return {
    results,
    totalDuration,
    averageDuration,
    minDuration,
    maxDuration,
  };
}

/**
 * Detect memory leaks
 */
export async function detectMemoryLeak(
  name: string,
  fn: () => Promise<void>,
  iterations: number
): Promise<{ leaked: boolean; increase: number }> {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  const startMemory = process.memoryUsage().heapUsed;

  for (let i = 0; i < iterations; i++) {
    await fn();
  }

  // Force garbage collection again
  if (global.gc) {
    global.gc();
  }

  const endMemory = process.memoryUsage().heapUsed;
  const increase = endMemory - startMemory;
  const leaked = increase > PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD;

  console.log(`[Memory] ${name} after ${iterations} iterations:`);
  console.log(`  Start: ${(startMemory / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  End: ${(endMemory / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  Increase: ${(increase / 1024 / 1024).toFixed(2)}MB`);

  if (leaked) {
    console.warn(`  ⚠️  Possible memory leak detected!`);
  }

  return { leaked, increase };
}

// Jest custom matchers for performance testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeFasterThan(threshold: number): R;
      toNotLeakMemory(): R;
    }
  }
}

expect.extend({
  toBeFasterThan(received: number, threshold: number) {
    const pass = received <= threshold;
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received}ms to be slower than ${threshold}ms`
          : `Expected ${received}ms to be faster than ${threshold}ms`,
    };
  },

  toNotLeakMemory(received: { leaked: boolean; increase: number }) {
    const pass = !received.leaked;
    return {
      pass,
      message: () =>
        pass
          ? `Expected memory leak but none detected`
          : `Memory leak detected: ${(received.increase / 1024 / 1024).toFixed(2)}MB increase`,
    };
  },
});
