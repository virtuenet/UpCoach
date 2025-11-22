/**
 * Jest Configuration for API Contract Tests
 *
 * Contract tests validate the HTTP API layer:
 * - Request/response schemas
 * - HTTP status codes
 * - Error handling
 * - Input validation
 * - Authentication/authorization contracts
 *
 * These tests focus on API contracts, not business logic.
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

  // Only run API contract tests
  testRegex: '(/__tests__/contracts/.*\\.test)\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  // Memory optimization
  maxWorkers: 1,
  workerIdleMemoryLimit: '512MB',

  // Enhanced cleanup
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,

  // Cache optimization
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest-contract',

  // Timeout settings
  testTimeout: 10000,

  // Disable memory leak detection
  detectLeaks: false,
  logHeapUsage: false,

  // Coverage settings
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/__tests__/**',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage-contract',
  coverageReporters: ['text', 'lcov', 'html'],

  // Global setup
  globals: {
    'ts-jest': {
      useESM: false,
      isolatedModules: true,
    },
  },
};
