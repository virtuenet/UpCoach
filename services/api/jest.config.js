module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
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
    '^oauth4webapi$': '<rootDir>/src/tests/__mocks__/oauth4webapi.js'
  }
};