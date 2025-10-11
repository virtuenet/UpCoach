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
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  // Memory optimization settings
  maxWorkers: 1, // Prevent memory issues from parallel execution
  workerIdleMemoryLimit: '512MB',

  // Enhanced cleanup settings
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  resetModules: true, // Reset module registry between tests

  // Cache optimization
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',

  // Timeout settings
  testTimeout: 15000, // 15 seconds default timeout

  // Memory leak detection helpers
  detectLeaks: process.env.NODE_ENV === 'test',
  logHeapUsage: process.env.VERBOSE_TESTS === 'true',

  // Cleanup after tests
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],

  // Module mapping to handle problematic dependencies
  moduleNameMapper: {
    '^openid-client$': '<rootDir>/src/tests/__mocks__/openid-client.js',
    '^oauth4webapi$': '<rootDir>/src/tests/__mocks__/oauth4webapi.js',
    '^bcryptjs$': '<rootDir>/src/tests/__mocks__/bcryptjs.js',
    '^redis$': '<rootDir>/src/tests/__mocks__/redis.js',
    '^ioredis$': '<rootDir>/src/tests/__mocks__/ioredis.js',
    '^winston$': '<rootDir>/src/tests/__mocks__/winston.js',
    '^sequelize$': '<rootDir>/src/tests/__mocks__/sequelize.js',
    '^nodemailer$': '<rootDir>/src/tests/__mocks__/nodemailer.js',
    '^jsonwebtoken$': '<rootDir>/src/tests/__mocks__/jsonwebtoken.js',
    '^@anthropic-ai/sdk$': '<rootDir>/src/tests/__mocks__/anthropic.js',
    '^openai$': '<rootDir>/src/tests/__mocks__/openai.js',
    '^pg-types$': '<rootDir>/src/tests/__mocks__/pg-types.js',
    '^pg-connection-string$': '<rootDir>/src/tests/__mocks__/pg-connection-string.js',
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
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },

  // Global setup
  globals: {
    'ts-jest': {
      useESM: false,
      isolatedModules: true,
    },
  },
};