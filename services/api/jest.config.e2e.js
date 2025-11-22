/**
 * Jest Configuration for E2E Critical Journey Tests
 *
 * This config is optimized for end-to-end tests of critical user journeys:
 * - Uses real HTTP layer (Supertest)
 * - Uses test database (isolated from production)
 * - Minimal external service mocking
 * - Slower execution but high confidence
 * - Focus on 2-3 critical business flows only
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        types: ['jest', 'node'],
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
      },
    }]
  },

  // Only run E2E critical journey tests
  testRegex: '(/__tests__/e2e-critical/.*\\.test)\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  // Sequential execution for E2E tests
  maxWorkers: 1,
  workerIdleMemoryLimit: '512MB',

  // Enhanced cleanup between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  resetModules: true,

  // Cache optimization
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest-e2e',

  // Longer timeout for E2E tests (database setup, HTTP calls)
  testTimeout: 30000, // 30 seconds

  // Disable memory leak detection
  detectLeaks: false,
  logHeapUsage: false,

  // Setup file for E2E tests (database initialization)
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/e2e-critical/setup.ts'],

  // Module mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Coverage settings
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/__tests__/**',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage-e2e',
  coverageReporters: ['text', 'lcov', 'html'],

  // Global setup
  globals: {
    'ts-jest': {
      useESM: false,
      isolatedModules: true,
    },
  },
};
