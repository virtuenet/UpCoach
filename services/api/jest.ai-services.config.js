/**
 * Jest Configuration for AI Services Testing
 * Specialized configuration for comprehensive AI service test automation
 */

module.exports = {
  // Basic Jest configuration
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/src/tests/services/ai/**/*.test.ts',
    '**/src/tests/integration/AI*.test.ts',
    '**/src/tests/performance/AI*.test.ts',
    '**/src/tests/contracts/AI*.test.ts',
    '**/src/tests/scenarios/AI*.test.ts'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.ts',
    '<rootDir>/src/tests/config/ai-test-setup.ts'
  ],
  
  // Module path mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/services/ai/**/*.ts',
    'src/controllers/ai/**/*.ts',
    'src/routes/ai*.ts',
    '!src/services/ai/**/*.d.ts',
    '!src/services/ai/**/index.ts',
    '!src/tests/**/*',
    '!src/**/*.interface.ts'
  ],
  
  coverageDirectory: 'coverage/ai-services',
  
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'clover',
    'json'
  ],
  
  // Coverage thresholds for AI services
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    // Service-specific thresholds
    './src/services/ai/AIService.ts': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    },
    './src/services/ai/ConversationalAI.ts': {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    './src/services/ai/RecommendationEngine.ts': {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    './src/services/ai/UserProfilingService.ts': {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    './src/services/ai/VoiceAI.ts': {
      statements: 75,
      branches: 70,
      functions: 75,
      lines: 75
    }
  },
  
  // Test timeout for AI operations (increased for API calls)
  testTimeout: 30000,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/src/tests/config/ai-global-setup.ts',
  globalTeardown: '<rootDir>/src/tests/config/ai-global-teardown.ts',
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '\\.d\\.ts$'
  ],
  
  // Watch mode configuration
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],
  
  // Error reporting
  errorOnDeprecated: true,
  verbose: true,
  
  // Parallel execution configuration
  maxWorkers: '50%', // Use half of available CPU cores
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest-ai',
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/ai-services/html-report',
        filename: 'ai-services-test-report.html',
        pageTitle: 'UpCoach AI Services Test Report',
        overwrite: true,
        expand: true,
        hideIcon: false,
        testCommand: 'npm run test:ai'
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './coverage/ai-services',
        outputName: 'ai-services-junit.xml',
        suiteName: 'AI Services Test Suite',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ]
  ],
  
  // Mock configuration for AI services
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Global variables for AI testing
  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'es2020',
        module: 'commonjs',
        lib: ['es2020'],
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        skipLibCheck: true,
        strictPropertyInitialization: false
      }
    },
    AI_TESTING_MODE: true,
    MOCK_AI_RESPONSES: true,
    PERFORMANCE_TESTING: false,
    CONTRACT_TESTING: false
  },
  
  // Environment variables for testing
  setupFiles: ['<rootDir>/src/tests/config/env-setup.ts'],
  
  // Custom test matchers
  testRunner: 'jest-circus/runner',
  
  // Snapshot configuration
  snapshotSerializers: [
    '<rootDir>/src/tests/utils/ai-response-serializer.ts'
  ],
  
  // Test result processor
  testResultsProcessor: '<rootDir>/src/tests/config/ai-test-processor.ts',
  
  // Performance budget for AI tests
  slowTestThreshold: 5, // 5 seconds for slow test warning
  
  // Project-specific configuration
  projects: [
    // Unit tests
    {
      displayName: 'AI Services - Unit Tests',
      testMatch: ['<rootDir>/src/tests/services/ai/**/*.test.ts'],
      globals: {
        ...module.exports.globals,
        TEST_TYPE: 'unit'
      }
    },
    
    // Integration tests
    {
      displayName: 'AI Services - Integration Tests',
      testMatch: ['<rootDir>/src/tests/integration/AI*.test.ts'],
      globals: {
        ...module.exports.globals,
        TEST_TYPE: 'integration',
        MOCK_AI_RESPONSES: false
      },
      testTimeout: 60000 // 1 minute for integration tests
    },
    
    // Performance tests
    {
      displayName: 'AI Services - Performance Tests',
      testMatch: ['<rootDir>/src/tests/performance/AI*.test.ts'],
      globals: {
        ...module.exports.globals,
        TEST_TYPE: 'performance',
        PERFORMANCE_TESTING: true,
        MOCK_AI_RESPONSES: true
      },
      testTimeout: 120000 // 2 minutes for performance tests
    },
    
    // Contract tests
    {
      displayName: 'AI Services - Contract Tests',
      testMatch: ['<rootDir>/src/tests/contracts/AI*.test.ts'],
      globals: {
        ...module.exports.globals,
        TEST_TYPE: 'contract',
        CONTRACT_TESTING: true,
        MOCK_AI_RESPONSES: true
      }
    },
    
    // Scenario tests (E2E)
    {
      displayName: 'AI Services - Scenario Tests',
      testMatch: ['<rootDir>/src/tests/scenarios/AI*.test.ts'],
      globals: {
        ...module.exports.globals,
        TEST_TYPE: 'scenario',
        MOCK_AI_RESPONSES: false
      },
      testTimeout: 180000 // 3 minutes for scenario tests
    }
  ]
};