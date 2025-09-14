/** @type {import('jest').Config} */
module.exports = {
  displayName: 'Admin Panel Accessibility Tests',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupA11y.ts'],
  testMatch: [
    '<rootDir>/src/**/*.a11y.test.{js,ts,tsx}',
    '<rootDir>/src/tests/a11y/**/*.test.{js,ts,tsx}'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  collectCoverageFrom: [
    'src/pages/**/*.{ts,tsx}',
    'src/components/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage/a11y',
  testTimeout: 30000,
  // Accessibility-specific configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
};