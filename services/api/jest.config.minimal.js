module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],

  // Focus on specific test patterns
  testRegex: '(/__tests__/.*\\.(minimal|unit|integration)\\.(test|spec))\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  // Optimized settings for immediate results
  maxWorkers: 1,
  clearMocks: true,
  resetMocks: true,

  // Reduced coverage requirements for initial pass
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 70,
      statements: 70,
    },
  },

  // Module mapping for essential mocks only
  moduleNameMapper: {
    '^redis$': '<rootDir>/src/tests/__mocks__/redis.js',
    '^ioredis$': '<rootDir>/src/tests/__mocks__/ioredis.js',
    '^winston$': '<rootDir>/src/tests/__mocks__/winston.js',
    '^sequelize$': '<rootDir>/src/tests/__mocks__/sequelize.js',
    '^nodemailer$': '<rootDir>/src/tests/__mocks__/nodemailer.js',
  },

  // Coverage collection focused on core services
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/controllers/**/*.ts',
    'src/utils/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/__tests__/**',
  ],

  coverageDirectory: 'coverage-minimal',
  coverageReporters: ['text', 'lcov'],

  // Essential setup only
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],

  // Timeout settings
  testTimeout: 10000,
};