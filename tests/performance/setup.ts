/**
 * Performance Tests Setup
 * Configures Jest for load testing and performance monitoring
 */

import { jest } from '@jest/globals';

// Set test environment for performance testing
process.env.NODE_ENV = 'test';
process.env.PERFORMANCE_TESTING = 'true';

// Extend timeout for performance tests
jest.setTimeout(300000); // 5 minutes

// Mock performance monitoring APIs
global.performance = {
  ...global.performance,
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(),
  getEntriesByType: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  now: jest.fn(() => Date.now()),
};

// Global utilities for performance testing
export const measurePerformance = (name: string, fn: () => Promise<any>) => {
  return async () => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
  };
};

export const performanceThresholds = {
  apiResponse: 1000, // 1 second
  databaseQuery: 500, // 500ms
  pageLoad: 3000, // 3 seconds
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  performance.clearMarks();
  performance.clearMeasures();
});

export default {};