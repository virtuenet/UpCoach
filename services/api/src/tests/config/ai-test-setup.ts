/**
 * AI Services Test Setup
 * Global configuration and mocking setup for AI service testing
 */

import { getAITestConfig } from './ai-test.config';
import { AIMockPatterns, AITestDataFactory, MockDatabaseUtils } from '../utils/AITestUtils';

// Global test configuration
const testConfig = getAITestConfig();

/**
 * Setup global mocks for AI services
 */
function setupAIMocks() {
  // Mock OpenAI with explicit type casting
  const mockOpenAI = {
    OpenAI: function() {
      return {
        chat: {
          completions: {
            create: async (params: any) => ({
              id: `chatcmpl-${Date.now()}`,
              object: 'chat.completion',
              created: Math.floor(Date.now() / 1000),
              model: params.model || 'gpt-4-turbo-preview',
              choices: [{
                index: 0,
                message: {
                  role: 'assistant',
                  content: AIMockPatterns.generateCoachingResponse(
                    params.messages?.[params.messages.length - 1]?.content || 'test',
                    {}
                  ).content
                },
                finish_reason: 'stop'
              }],
              usage: {
                prompt_tokens: params.messages?.length * 10 || 10,
                completion_tokens: 25,
                total_tokens: (params.messages?.length * 10 || 10) + 25
              }
            })
          }
        }
      };
    }
  };

  // Mock Anthropic Claude
  const mockAnthropic = {
    __esModule: true,
    default: function() {
      return {
        messages: {
          create: async (params: any) => ({
            id: `msg_${Date.now()}`,
            type: 'message',
            role: 'assistant',
            content: [{
              type: 'text',
              text: AIMockPatterns.generateCoachingResponse(
                params.messages?.[params.messages.length - 1]?.content || 'test',
                {}
              ).content
            }],
            model: params.model || 'claude-3-sonnet-20240229',
            stop_reason: 'end_turn',
            stop_sequence: null,
            usage: {
              input_tokens: params.messages?.length * 8 || 8,
              output_tokens: 20
            }
          })
        }
      };
    }
  };

  // Mock Redis for caching
  const mockRedis = {
    __esModule: true,
    default: function() {
      return {
        get: () => Promise.resolve(null),
        set: () => Promise.resolve('OK'),
        del: () => Promise.resolve(1),
        exists: () => Promise.resolve(0),
        expire: () => Promise.resolve(1),
        flushdb: () => Promise.resolve('OK')
      };
    }
  };

  // Mock database models
  const mockUser = MockDatabaseUtils.mockUserOperations();
  const mockGoal = MockDatabaseUtils.mockGoalOperations();
  const mockTask = MockDatabaseUtils.mockTaskOperations();
  const mockMood = MockDatabaseUtils.mockMoodOperations();

  const mockModels = {
    User: mockUser,
    Goal: mockGoal,
    Task: mockTask,
    Mood: mockMood,
    UserProfile: {
      findOne: () => Promise.resolve(null),
      findByPk: () => Promise.resolve(null),
      create: (data: any) => Promise.resolve(data),
      update: (data: any) => Promise.resolve([1])
    },
    ChatMessage: {
      findAll: () => Promise.resolve([]),
      create: (data: any) => Promise.resolve(data)
    },
    VoiceJournalEntry: {
      findAll: () => Promise.resolve([]),
      create: (data: any) => Promise.resolve(data)
    }
  };

  // Apply mocks using require.cache manipulation (more reliable than jest.mock)
  const moduleCache = require.cache;
  
  // Override modules in cache
  Object.keys(moduleCache).forEach(key => {
    if (key.includes('openai')) {
      moduleCache[key].exports = mockOpenAI;
    } else if (key.includes('@anthropic-ai/sdk')) {
      moduleCache[key].exports = mockAnthropic;
    } else if (key.includes('ioredis')) {
      moduleCache[key].exports = mockRedis;
    } else if (key.includes('models') && key.includes('index')) {
      moduleCache[key].exports = mockModels;
    }
  });

  // Set up module interception for new requires
  const Module = require('module');
  const originalRequire = Module.prototype.require;

  Module.prototype.require = function(id: string) {
    if (id === 'openai') {
      return mockOpenAI;
    } else if (id === '@anthropic-ai/sdk') {
      return mockAnthropic;
    } else if (id === 'ioredis') {
      return mockRedis;
    } else if (id.includes('../../models')) {
      return mockModels;
    }
    return originalRequire.apply(this, arguments);
  };
}

/**
 * Setup performance monitoring for tests
 */
function setupPerformanceMonitoring() {
  // Add performance markers
  (global as any).performance = (global as any).performance || {
    mark: () => {},
    measure: () => {},
    now: () => Date.now(),
    clearMarks: () => {},
    clearMeasures: () => {},
    getEntriesByName: () => [],
    getEntriesByType: () => []
  };

  // Mock console methods for cleaner test output
  if (!process.env.VERBOSE_TESTS) {
    const originalConsole = global.console;
    global.console = {
      ...originalConsole,
      log: () => {},
      debug: () => {},
      info: () => {},
      warn: originalConsole.warn,
      error: originalConsole.error
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
  const timeouts: { [key: string]: number } = {
    unit: 10000,      // 10 seconds
    integration: 30000, // 30 seconds
    performance: 60000, // 1 minute
    contract: 15000,    // 15 seconds
    scenario: 120000    // 2 minutes
  };

  if (typeof jest !== 'undefined') {
    jest.setTimeout(timeouts[testType] || 10000);
  }
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
  if (typeof expect !== 'undefined') {
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

      toBeWithinResponseTime(received: number, expectedTime: number) {
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
if (typeof beforeAll !== 'undefined') {
  beforeAll(async () => {
    setupAITesting();
  });
}

if (typeof afterAll !== 'undefined') {
  afterAll(async () => {
    // Cleanup after all tests
    if (typeof jest !== 'undefined') {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    }
  });
}

if (typeof beforeEach !== 'undefined') {
  beforeEach(() => {
    // Reset mocks before each test
    if (typeof jest !== 'undefined') {
      jest.clearAllMocks();
    }
  });
}

if (typeof afterEach !== 'undefined') {
  afterEach(() => {
    // Cleanup after each test if needed
    if (testConfig.database.resetBetweenTests) {
      // Reset database state would go here
    }
  });
}

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