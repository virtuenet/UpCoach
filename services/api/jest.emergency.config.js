module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,ts}',
    '!src/**/__tests__/**',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 70,
      statements: 70
    }
  },
  // Simplified setup without ts-jest
  moduleFileExtensions: ['js', 'ts'],
  transform: {},
  // Skip TypeScript transformation for emergency testing
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};