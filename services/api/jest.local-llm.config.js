/**
 * Local LLM Testing Configuration for UpCoach
 * Specialized Jest configuration for testing local LLM implementation
 */

module.exports = {
  displayName: 'Local LLM Services',
  testMatch: [
    '<rootDir>/src/tests/**/*local*llm*.test.ts',
    '<rootDir>/src/tests/**/Local*.test.ts',
    '<rootDir>/src/tests/**/Hybrid*.test.ts',
    '<rootDir>/src/tests/services/ai/**/*.local.test.ts'
  ],
  
  // Extended timeout for model loading and inference
  testTimeout: 120000, // 2 minutes for model operations
  
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/config/ai-test-setup.ts',
    '<rootDir>/src/tests/config/local-llm-setup.ts'
  ],
  
  // Environment variables for local LLM testing
  testEnvironment: 'node',
  
  // Transform TypeScript files
  preset: 'ts-jest',
  
  // Module path mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1'
  },
  
  // Coverage configuration for local LLM services
  collectCoverage: true,
  collectCoverageFrom: [
    'src/services/ai/LocalLLMService.ts',
    'src/services/ai/HybridDecisionEngine.ts',
    'src/services/ai/ModelManager.ts',
    'src/security/LocalAISecurityService.ts',
    'src/controllers/**/Local*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**'
  ],
  
  // Strict coverage thresholds for local LLM features
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/services/ai/LocalLLMService.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    'src/services/ai/HybridDecisionEngine.ts': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/security/LocalAISecurityService.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // Performance and quality thresholds
  globals: {
    'ts-jest': {
      tsconfig: {
        compilerOptions: {
          module: 'commonjs',
          target: 'es2020',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true
        }
      }
    },
    // Performance thresholds for local LLM operations
    PERFORMANCE_THRESHOLDS: {
      LOCAL_INFERENCE_MS: 200,      // P95 inference latency
      HYBRID_DECISION_MS: 50,       // Routing decision time
      MODEL_LOADING_MS: 30000,      // Model initialization
      MEMORY_USAGE_MB: 2048,        // Maximum memory usage
      CONCURRENT_REQUESTS: 50       // Maximum concurrent processing
    },
    // Quality thresholds
    QUALITY_THRESHOLDS: {
      MIN_RESPONSE_QUALITY: 4.0,    // Minimum quality score (1-5)
      LOCAL_VS_CLOUD_RATIO: 0.85,   // Local quality vs cloud (85%+)
      CONSISTENCY_THRESHOLD: 0.9,   // Response consistency
      COHERENCE_SCORE: 0.8          // Response coherence
    },
    // Test configuration
    TEST_CONFIG: {
      USE_REAL_MODELS: process.env.NODE_ENV !== 'test',
      MODEL_PATH: process.env.TEST_MODEL_PATH || './models/test',
      GPU_ACCELERATION: process.env.ENABLE_GPU_TESTING === 'true',
      PARALLEL_TESTING: process.env.PARALLEL_TESTS !== 'false'
    }
  },
  
  // Custom reporters for local LLM testing
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Local LLM Test Report',
      outputPath: 'coverage/local-llm-test-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true
    }],
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'local-llm-junit.xml',
      suiteName: 'Local LLM Tests'
    }]
  ],
  
  // Test setup and teardown
  globalSetup: '<rootDir>/src/tests/config/local-llm-global-setup.ts',
  globalTeardown: '<rootDir>/src/tests/config/local-llm-global-teardown.ts',
  
  // Cache configuration for model loading
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache/local-llm',
  
  // Verbose output for debugging
  verbose: process.env.VERBOSE_TESTS === 'true',
  
  // Custom test sequence for model dependency
  testSequencer: '<rootDir>/src/tests/config/LocalLLMTestSequencer.js',
  
  // Memory management for large models
  maxWorkers: process.env.CI ? 2 : '50%',
  workerIdleMemoryLimit: '1GB'
};