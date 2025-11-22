module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Root directory
  rootDir: '../',

  // Test patterns
  testMatch: [
    '<rootDir>/testing/unit/**/*.test.{js,ts}',
    '<rootDir>/testing/integration/**/*.test.{js,ts}',
    '<rootDir>/backend/src/**/__tests__/**/*.{js,ts}',
    '<rootDir>/admin-panel/src/**/__tests__/**/*.{js,ts}',
    '<rootDir>/cms-panel/src/**/__tests__/**/*.{js,ts}',
  ],

  // Transform configuration
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          compilerOptions: {
            module: 'CommonJS',
            target: 'ES2020',
            moduleResolution: 'node',
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            resolveJsonModule: true,
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
          },
        },
      },
    ],
    '^.+\\.jsx?$': 'babel-jest',
  },

  // Module resolution
  moduleNameMapping: {
    '^@backend/(.*)$': '<rootDir>/backend/src/$1',
    '^@admin/(.*)$': '<rootDir>/admin-panel/src/$1',
    '^@cms/(.*)$': '<rootDir>/cms-panel/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@testing/(.*)$': '<rootDir>/testing/$1',
  },

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/testing/setup/jest.setup.js',
    '<rootDir>/testing/setup/test-database.setup.js',
    '<rootDir>/testing/setup/mock-services.setup.js',
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/testing/setup/global.setup.js',
  globalTeardown: '<rootDir>/testing/setup/global.teardown.js',

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    // Backend coverage
    'backend/src/**/*.{js,ts}',
    '!backend/src/**/*.d.ts',
    '!backend/src/**/__tests__/**',
    '!backend/src/**/migrations/**',
    '!backend/src/**/seeds/**',

    // Admin panel coverage
    'admin-panel/src/**/*.{js,ts,tsx}',
    '!admin-panel/src/**/*.d.ts',
    '!admin-panel/src/**/__tests__/**',
    '!admin-panel/src/**/*.stories.*',

    // CMS panel coverage
    'cms-panel/src/**/*.{js,ts,tsx}',
    '!cms-panel/src/**/*.d.ts',
    '!cms-panel/src/**/__tests__/**',
    '!cms-panel/src/**/*.stories.*',

    // Exclude common files
    '!**/node_modules/**',
    '!**/build/**',
    '!**/dist/**',
    '!**/coverage/**',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Stricter requirements for critical services
    './backend/src/services/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './backend/src/controllers/financial/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    // UI components - slightly lower threshold
    './admin-panel/src/components/': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'clover', 'json', 'cobertura'],

  // Coverage output directory
  coverageDirectory: 'coverage',

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Projects configuration for multi-package testing
  projects: [
    // Backend API tests
    {
      displayName: 'Backend API',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/backend/src/**/__tests__/**/*.test.{js,ts}',
        '<rootDir>/testing/integration/api/**/*.test.{js,ts}',
      ],
      setupFilesAfterEnv: ['<rootDir>/testing/setup/backend.setup.js'],
      moduleNameMapping: {
        '^@backend/(.*)$': '<rootDir>/backend/src/$1',
      },
    },

    // Financial services tests
    {
      displayName: 'Financial Services',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/backend/src/services/financial/**/*.test.{js,ts}',
        '<rootDir>/testing/unit/financial/**/*.test.{js,ts}',
      ],
      setupFilesAfterEnv: ['<rootDir>/testing/setup/financial.setup.js'],
      testTimeout: 45000, // Extended timeout for financial calculations
    },

    // Admin Panel tests
    {
      displayName: 'Admin Panel',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/admin-panel/src/**/__tests__/**/*.test.{js,ts,tsx}',
        '<rootDir>/testing/unit/admin-panel/**/*.test.{js,ts,tsx}',
      ],
      setupFilesAfterEnv: [
        '<rootDir>/testing/setup/react.setup.js',
        '<rootDir>/testing/setup/admin-panel.setup.js',
      ],
      moduleNameMapping: {
        '^@admin/(.*)$': '<rootDir>/admin-panel/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/admin-panel/tsconfig.json',
          },
        ],
      },
    },

    // CMS Panel tests
    {
      displayName: 'CMS Panel',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/cms-panel/src/**/__tests__/**/*.test.{js,ts,tsx}',
        '<rootDir>/testing/unit/cms-panel/**/*.test.{js,ts,tsx}',
      ],
      setupFilesAfterEnv: [
        '<rootDir>/testing/setup/react.setup.js',
        '<rootDir>/testing/setup/cms-panel.setup.js',
      ],
      moduleNameMapping: {
        '^@cms/(.*)$': '<rootDir>/cms-panel/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/cms-panel/tsconfig.json',
          },
        ],
      },
    },

    // Database integration tests
    {
      displayName: 'Database Integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/testing/integration/database/**/*.test.{js,ts}'],
      setupFilesAfterEnv: ['<rootDir>/testing/setup/database-integration.setup.js'],
      testTimeout: 60000, // Extended timeout for database operations
    },

    // Voice journaling tests
    {
      displayName: 'Voice Journaling',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/testing/unit/voice-journaling/**/*.test.{js,ts}',
        '<rootDir>/backend/src/services/voice-journaling/**/*.test.{js,ts}',
      ],
      setupFilesAfterEnv: ['<rootDir>/testing/setup/voice-journaling.setup.js'],
    },

    // Habit tracking tests
    {
      displayName: 'Habit Tracking',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/testing/unit/habit-tracking/**/*.test.{js,ts}',
        '<rootDir>/backend/src/services/habit-tracking/**/*.test.{js,ts}',
      ],
      setupFilesAfterEnv: ['<rootDir>/testing/setup/habit-tracking.setup.js'],
    },

    // Offline sync tests
    {
      displayName: 'Offline Sync',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/testing/unit/offline-sync/**/*.test.{js,ts}',
        '<rootDir>/backend/src/services/offline-sync/**/*.test.{js,ts}',
      ],
      setupFilesAfterEnv: ['<rootDir>/testing/setup/offline-sync.setup.js'],
    },
  ],

  // Test results processors
  testResultsProcessor: '<rootDir>/testing/processors/test-results-processor.js',

  // Custom reporters
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'UpCoach Enhancement Test Results',
      },
    ],
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
    ['@jest/test-result-processor', '<rootDir>/testing/processors/slack-reporter.js'],
  ],

  // Watch plugins for development
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    '<rootDir>/testing/watch-plugins/coverage-watch.js',
  ],

  // Error handling
  errorOnDeprecated: true,

  // Cache configuration
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/dist/', '/coverage/', '/test-results/'],

  // Module paths to ignore
  modulePathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/dist/', '<rootDir>/coverage/'],

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Max workers for parallel execution
  maxWorkers: '50%',

  // Fail fast
  bail: 0, // Continue running all tests even if some fail

  // Detect open handles for debugging
  detectOpenHandles: true,

  // Force exit after tests complete
  forceExit: true,

  // Custom environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
};
