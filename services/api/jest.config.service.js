/**
 * Jest Configuration for Service-Level Tests
 *
 * This config is optimized for fast service-level integration tests:
 * - No HTTP layer (no app initialization)
 * - No database (mocked repositories)
 * - No external services (all mocked)
 * - Fast execution
 * - No memory leak detection (causes issues)
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

  // Only run service-level integration tests
  testRegex: '(/__tests__/service-integration/.*\\.test)\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  // Memory optimization
  maxWorkers: 1,
  workerIdleMemoryLimit: '512MB',

  // Enhanced cleanup
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  resetModules: false, // Keep modules loaded for faster tests

  // Cache optimization
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest-service',

  // Timeout settings
  testTimeout: 10000, // 10 seconds for service tests

  // DISABLE memory leak detection - it causes false positives
  detectLeaks: false,
  logHeapUsage: false,

  // NO setup file needed for service tests
  // setupFilesAfterEnv: [],

  // NO module mapping - service tests don't load full app
  moduleNameMapper: {},

  // Coverage settings
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/__tests__/**',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage-service',
  coverageReporters: ['text', 'lcov', 'html'],

  // Global setup
  globals: {
    'ts-jest': {
      useESM: false,
      isolatedModules: true,
    },
  },
};
