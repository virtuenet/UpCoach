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
  testRegex: '(/__tests__/(integration|e2e)/.*|(\\.|/)(integration|e2e)\\.test)\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  // Memory optimization settings
  maxWorkers: 1,
  workerIdleMemoryLimit: '512MB',

  // Enhanced cleanup settings
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false, // Don't reset mocks for integration tests
  resetModules: false, // Don't reset modules for integration tests

  // Cache optimization
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest-integration',

  // Timeout settings - longer for integration tests
  testTimeout: 30000, // 30 seconds for integration tests

  // NO memory leak detection for integration tests (it's causing issues)
  detectLeaks: false,
  logHeapUsage: false,

  // Setup file for integration tests
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup-integration.ts'],

  // NO module mapping - use real dependencies for integration tests
  // This allows real Sequelize, Redis, etc. to be used
  moduleNameMapper: {
    // Only mock external services that we don't control
    '^@anthropic-ai/sdk$': '<rootDir>/src/tests/__mocks__/anthropic.js',
    '^openai$': '<rootDir>/src/tests/__mocks__/openai.js',
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
  coverageDirectory: 'coverage-integration',
  coverageReporters: ['text', 'lcov', 'html'],

  // Global setup
  globals: {
    'ts-jest': {
      useESM: false,
      isolatedModules: true,
    },
  },
};
