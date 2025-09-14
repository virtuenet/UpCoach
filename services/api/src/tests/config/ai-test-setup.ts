/**
 * AI Services Test Setup
 * Global configuration and mocking setup for AI service testing
 */

import { jest } from '@jest/globals';
import { getAITestConfig } from './ai-test.config';
import { AIMockPatterns, AITestDataFactory, MockDatabaseUtils } from '../utils/AITestUtils';

// Global test configuration
const testConfig = getAITestConfig();

/**
 * Setup global mocks for AI services
 */
function setupAIMocks() {
  // Mock OpenAI
  jest.mock('openai', () => ({
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockImplementation(async (params: any) => ({
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: (params as any).model || 'gpt-4-turbo-preview',
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: AIMockPatterns.generateCoachingResponse(
                  (params as any).messages?.[(params as any).messages.length - 1]?.content || 'test',
                  {}
                ).content
              },
              finish_reason: 'stop'
            }],
            usage: {
              prompt_tokens: (params as any).messages?.length * 10 || 10,
              completion_tokens: 25,
              total_tokens: ((params as any).messages?.length * 10 || 10) + 25
            }
          }))
        }
      }
    }))
  }));

  // Mock Anthropic Claude
  jest.mock('@anthropic-ai/sdk', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockImplementation(async (params: any) => ({
          id: `msg_${Date.now()}`,
          type: 'message',
          role: 'assistant',
          content: [{
            type: 'text',
            text: AIMockPatterns.generateCoachingResponse(
              (params as any).messages?.[(params as any).messages.length - 1]?.content || 'test',
              {}
            ).content
          }],
          model: (params as any).model || 'claude-3-sonnet-20240229',
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: {
            input_tokens: (params as any).messages?.length * 8 || 8,
            output_tokens: 20
          }
        }))
      }
    }))
  }));

  // Mock Redis for caching
  jest.mock('ioredis', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      get: jest.fn().mockResolvedValue(null as any),
      set: jest.fn().mockResolvedValue('OK' as any),
      del: jest.fn().mockResolvedValue(1 as any),
      exists: jest.fn().mockResolvedValue(0 as any),
      expire: jest.fn().mockResolvedValue(1 as any),
      flushdb: jest.fn().mockResolvedValue('OK' as any)
    }) as any)
  }));

  // Mock database models
  const mockUser = MockDatabaseUtils.mockUserOperations();
  const mockGoal = MockDatabaseUtils.mockGoalOperations();
  const mockTask = MockDatabaseUtils.mockTaskOperations();
  const mockMood = MockDatabaseUtils.mockMoodOperations();

  jest.mock('../../models', () => ({
    User: mockUser,
    Goal: mockGoal,
    Task: mockTask,
    Mood: mockMood,
    UserProfile: {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    ChatMessage: {
      findAll: jest.fn().mockResolvedValue([] as any),
      create: jest.fn() as any
    },
    VoiceJournalEntry: {
      findAll: jest.fn().mockResolvedValue([] as any),
      create: jest.fn() as any
    }
  }));
}

/**
 * Setup performance monitoring for tests
 */
function setupPerformanceMonitoring() {
  // Add performance markers
  global.performance = global.performance || {
    mark: jest.fn(),
    measure: jest.fn(),
    now: () => Date.now(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    getEntriesByName: jest.fn().mockReturnValue([]),
    getEntriesByType: jest.fn().mockReturnValue([])
  } as any;

  // Mock console methods for cleaner test output
  if (!process.env.VERBOSE_TESTS) {
    global.console = {
      ...console,
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: console.warn, // Keep warnings
      error: console.error // Keep errors
    };
  }
}

/**
 * Setup error handling for tests
 */
function setupErrorHandling() {
  // Handle unhandled promise rejections in tests
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Handle uncaught exceptions in tests
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });
}

/**
 * Setup test data factories
 */
function setupTestDataFactories() {
  // Make test data factories globally available
  (global as any).AITestDataFactory = AITestDataFactory;
  (global as any).AIMockPatterns = AIMockPatterns;
  (global as any).MockDatabaseUtils = MockDatabaseUtils;
}

/**
 * Setup timeout configurations
 */
function setupTimeouts() {
  // Set default timeout based on test type
  const testType = process.env.TEST_TYPE || 'unit';
  const timeouts = {
    unit: 10000,      // 10 seconds
    integration: 30000, // 30 seconds
    performance: 60000, // 1 minute
    contract: 15000,    // 15 seconds
    scenario: 120000    // 2 minutes
  };

  jest.setTimeout(timeouts[testType as keyof typeof timeouts] || 10000);
}

/**
 * Setup environment variables for testing
 */
function setupEnvironment() {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.AI_TESTING_MODE = 'true';
  process.env.MOCK_AI_RESPONSES = process.env.MOCK_AI_RESPONSES || 'true';
  
  // Mock API keys for testing
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.CLAUDE_API_KEY = 'test-claude-key';
  
  // Database configuration
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/upcoach_test';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
}

/**
 * Setup custom Jest matchers for AI testing
 */
function setupCustomMatchers() {
  expect.extend({
    toBeValidAIResponse(received) {
      const pass = (
        received &&
        typeof received.id === 'string' &&
        typeof received.content === 'string' &&
        received.content.length > 0 &&
        received.usage &&
        typeof received.usage.totalTokens === 'number' &&
        received.usage.totalTokens > 0
      );

      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid AI response`,
        pass
      };
    },

    toBeWithinResponseTime(received, expectedTime) {
      const pass = received <= expectedTime;
      return {
        message: () => `expected response time ${received}ms to be within ${expectedTime}ms`,
        pass
      };
    },

    toHaveValidRecommendations(received) {
      const pass = (
        received &&
        Array.isArray(received.goals) &&
        Array.isArray(received.habits) &&
        Array.isArray(received.content) &&
        Array.isArray(received.activities)
      );

      return {
        message: () => `expected ${JSON.stringify(received)} to have valid recommendation structure`,
        pass
      };
    },

    toHaveValidUserProfile(received) {
      const pass = (
        received &&
        typeof received.learningStyle === 'string' &&
        typeof received.communicationPreference === 'string' &&
        received.coachingPreferences &&
        received.behaviorPatterns
      );

      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid user profile`,
        pass
      };
    },

    toHaveValidVoiceAnalysis(received) {
      const pass = (
        received &&
        typeof received.transcript === 'string' &&
        received.sentiment &&
        received.speechPatterns &&
        received.linguisticAnalysis &&
        Array.isArray(received.insights)
      );

      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid voice analysis`,
        pass
      };
    }
  });
}

/**
 * Main setup function
 */
function setupAITesting() {
  console.log('🤖 Setting up AI Services testing environment...');
  
  setupEnvironment();
  setupAIMocks();
  setupPerformanceMonitoring();
  setupErrorHandling();
  setupTestDataFactories();
  setupTimeouts();
  setupCustomMatchers();
  
  console.log('✅ AI Services testing environment ready');
}

// Global setup and teardown hooks
beforeAll(async () => {
  setupAITesting();
});

afterAll(async () => {
  // Cleanup after all tests
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test if needed
  if (testConfig.database.resetBetweenTests) {
    // Reset database state would go here
  }
});

// Export for use in individual test files
export {
  setupAITesting,
  testConfig,
  AITestDataFactory,
  AIMockPatterns,
  MockDatabaseUtils
};

// Type augmentation for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidAIResponse(): R;
      toBeWithinResponseTime(expectedTime: number): R;
      toHaveValidRecommendations(): R;
      toHaveValidUserProfile(): R;
      toHaveValidVoiceAnalysis(): R;
    }
  }
}