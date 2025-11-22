/**
 * Comprehensive Jest Configuration for A+ Testing Standards
 * Supports all test types: unit, integration, contract, performance, security
 * Includes coverage requirements and quality gates
 */

const path = require('path');

module.exports = {
  // Use multiple projects for different test types
  projects: [
    {
      displayName: 'Backend Unit Tests',
      testMatch: [
        '<rootDir>/services/api/src/**/*.test.ts',
        '<rootDir>/services/api/src/**/*.spec.ts',
      ],
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/services/api/src/tests/setup.ts'],
      collectCoverageFrom: [
        'services/api/src/**/*.ts',
        '!services/api/src/**/*.d.ts',
        '!services/api/src/index.ts',
        '!services/api/src/tests/**',
        '!services/api/src/**/*.test.ts',
        '!services/api/src/**/*.spec.ts',
        '!services/api/src/migrations/**',
      ],
      coverageDirectory: '<rootDir>/coverage/backend-unit',
      coverageThreshold: {
        global: {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        './services/api/src/services/': {
          branches: 95,
          functions: 98,
          lines: 98,
          statements: 98,
        },
        './services/api/src/controllers/': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },
      maxWorkers: 1,
      detectOpenHandles: true,
    },
    
    {
      displayName: 'Backend Integration Tests',
      testMatch: [
        '<rootDir>/services/api/src/__tests__/**/*.integration.test.ts',
      ],
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/services/api/src/tests/setup.ts'],
      maxWorkers: 1,
      slowTestThreshold: 30,
      collectCoverageFrom: [
        'services/api/src/controllers/**/*.ts',
        'services/api/src/routes/**/*.ts',
        'services/api/src/middleware/**/*.ts',
      ],
      coverageDirectory: '<rootDir>/coverage/backend-integration',
      coverageThreshold: {
        global: {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },

    {
      displayName: 'Contract Tests',
      testMatch: [
        '<rootDir>/packages/test-contracts/src/**/*.test.ts',
      ],
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/packages/test-contracts/src/setup.ts'],
      collectCoverageFrom: [
        'packages/test-contracts/src/**/*.ts',
        '!packages/test-contracts/src/**/*.d.ts',
        '!packages/test-contracts/src/setup.ts',
      ],
      coverageDirectory: '<rootDir>/coverage/contract-tests',
      coverageThreshold: {
        global: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },

    {
      displayName: 'Cross-Platform Integration Tests',
      testMatch: [
        '<rootDir>/tests/integration/**/*.spec.ts',
        '<rootDir>/tests/integration/**/*.test.ts',
      ],
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],
      maxWorkers: 1, // Run integration tests sequentially
      slowTestThreshold: 60,
      collectCoverageFrom: [
        'services/api/src/routes/**/*.ts',
        'services/api/src/controllers/**/*.ts',
        'apps/*/src/components/**/*.{ts,tsx}',
        'apps/*/src/pages/**/*.{ts,tsx}',
      ],
      coverageDirectory: '<rootDir>/coverage/integration',
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },

    {
      displayName: 'Performance Tests',
      testMatch: [
        '<rootDir>/tests/performance/**/*.test.ts',
      ],
      preset: 'ts-jest',
      testEnvironment: 'node',
      maxWorkers: 1,
      setupFilesAfterEnv: ['<rootDir>/tests/performance/setup.ts'],
      collectCoverageFrom: [],
    },

    {
      displayName: 'Security Tests',
      testMatch: [
        '<rootDir>/tests/security/**/*.test.ts',
      ],
      preset: 'ts-jest',
      testEnvironment: 'node',
      maxWorkers: 1,
      setupFilesAfterEnv: ['<rootDir>/tests/security/setup.ts'],
      collectCoverageFrom: [],
    },

    {
      displayName: 'Frontend Unit Tests - Admin Panel',
      testMatch: [
        '<rootDir>/apps/admin-panel/src/**/*.test.ts',
        '<rootDir>/apps/admin-panel/src/**/*.test.tsx',
      ],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/apps/admin-panel/src/test/setup.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: '<rootDir>/apps/admin-panel/tsconfig.json',
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/apps/admin-panel/src/$1',
      },
      collectCoverageFrom: [
        'apps/admin-panel/src/**/*.{ts,tsx}',
        '!apps/admin-panel/src/**/*.d.ts',
        '!apps/admin-panel/src/**/*.test.{ts,tsx}',
        '!apps/admin-panel/src/test/**',
      ],
      coverageDirectory: '<rootDir>/coverage/admin-panel',
      coverageThreshold: {
        global: {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },

    {
      displayName: 'Frontend Unit Tests - CMS Panel',
      testMatch: [
        '<rootDir>/apps/cms-panel/src/**/*.test.ts',
        '<rootDir>/apps/cms-panel/src/**/*.test.tsx',
      ],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/apps/cms-panel/src/test/setup.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: '<rootDir>/apps/cms-panel/tsconfig.json',
        }],
      },
      collectCoverageFrom: [
        'apps/cms-panel/src/**/*.{ts,tsx}',
        '!apps/cms-panel/src/**/*.d.ts',
        '!apps/cms-panel/src/**/*.test.{ts,tsx}',
        '!apps/cms-panel/src/test/**',
      ],
      coverageDirectory: '<rootDir>/coverage/cms-panel',
      coverageThreshold: {
        global: {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },

    {
      displayName: 'Frontend Unit Tests - Landing Page',
      testMatch: [
        '<rootDir>/apps/landing-page/src/**/*.test.ts',
        '<rootDir>/apps/landing-page/src/**/*.test.tsx',
      ],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/apps/landing-page/src/tests/setup.tsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: '<rootDir>/apps/landing-page/tsconfig.json',
        }],
      },
      collectCoverageFrom: [
        'apps/landing-page/src/**/*.{ts,tsx}',
        '!apps/landing-page/src/**/*.d.ts',
        '!apps/landing-page/src/**/*.test.{ts,tsx}',
        '!apps/landing-page/src/tests/**',
        '!apps/landing-page/src/app/layout.tsx', // Next.js specific
        '!apps/landing-page/src/app/page.tsx',
      ],
      coverageDirectory: '<rootDir>/coverage/landing-page',
      coverageThreshold: {
        global: {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },
    },
  ],

  // Global configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    'apps/**/*.{ts,tsx,js,jsx}',
    'services/**/*.{ts,tsx,js,jsx}',
    'packages/**/*.{ts,tsx,js,jsx}',
    '!**/*.d.ts',
    '!**/*.test.{ts,tsx,js,jsx}',
    '!**/*.spec.{ts,tsx,js,jsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/build/**',
  ],

  // Global coverage directory and thresholds
  coverageDirectory: '<rootDir>/coverage/combined',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json-summary'],

  // Combined coverage threshold (A+ standards)
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },

  // Test result processing
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'UpCoach Test Report',
        logoImgPath: undefined,
        inlineSource: true,
      },
    ],
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: false,
        suiteNameTemplate: '{displayName}: {filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
    [
      './scripts/test-notifier.js',
      {
        slackWebhook: process.env.SLACK_WEBHOOK_URL,
        emailRecipients: process.env.TEST_EMAIL_RECIPIENTS?.split(',') || [],
      },
    ],
  ],

  // Global settings
  verbose: process.env.CI ? false : true,
  silent: false,
  bail: process.env.CI ? 1 : 0,
  detectOpenHandles: true,
  maxWorkers: process.env.CI ? 2 : '50%',
  
  // Error handling
  errorOnDeprecated: true,
  testFailureExitCode: 1,

  // Cache configuration
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test execution settings
  testTimeout: 30000,
  slowTestThreshold: 10,

  // Watch mode settings (for local development)
  watchman: true,
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    'jest-watch-select-projects',
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/tests/global-setup.ts',
  globalTeardown: '<rootDir>/tests/global-teardown.ts',

  // Custom matchers and utilities
  setupFilesAfterEnv: ['<rootDir>/tests/jest-setup.ts'],

  // Snapshot configuration
  updateSnapshot: process.env.UPDATE_SNAPSHOTS === 'true',

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        isolatedModules: true,
      },
    ],
  },

  // Module mapping for monorepo packages
  moduleNameMapper: {
    '^@upcoach/(.*)$': '<rootDir>/packages/$1/src',
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Test environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    JWT_SECRET: 'test-jwt-secret-for-testing-only',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/upcoach_test',
  },

  // Notification settings
  notify: !process.env.CI,
  notifyMode: 'failure-change',

  // Performance monitoring
  logHeapUsage: process.env.CI,
  detectLeaks: process.env.NODE_ENV === 'test',

  // Custom test result processor
  testResultsProcessor: '<rootDir>/scripts/generate-test-report.js',

  // Quality gates configuration
  passWithNoTests: false,
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '\\.snap$',
    '/visual-tests/',
    '/shared/',
  ],

  // File watching configuration
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/visual-tests/',
    '/services/api/dist/',
  ],
  
  // Module path ignore patterns to prevent naming collisions
  modulePathIgnorePatterns: [
    '<rootDir>/visual-tests/',
    '<rootDir>/shared/',
    '<rootDir>/services/api/dist/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
  ],
  
  // Limit Jest search roots to avoid conflicts
  roots: [
    '<rootDir>/services/',
    '<rootDir>/apps/',
    '<rootDir>/packages/',
    '<rootDir>/tests/',
  ],
};