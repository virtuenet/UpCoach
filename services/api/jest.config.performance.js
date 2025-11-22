/**
 * Jest Configuration for Performance Tests
 *
 * Performance tests measure:
 * - Response time benchmarks
 * - Memory usage patterns
 * - Concurrent request handling
 * - Database query performance
 * - Cache hit/miss ratios
 */

const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  testMatch: ['**/__tests__/performance/**/*.test.ts'],
  testRegex: undefined, // Override baseConfig testRegex
  testTimeout: 60000, // 60s timeout for performance tests
  maxWorkers: 1, // Run performance tests sequentially for accurate measurements
  bail: false, // Run all performance tests even if some fail
  collectCoverage: false, // Don't collect coverage for performance tests
  coverageDirectory: 'coverage-performance',
  reporters: ['default'],
  // Custom environment for performance testing
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/performance/setup.ts'],
};
