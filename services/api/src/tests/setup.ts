// Import Jest globals first
import { jest, beforeEach, afterEach, afterAll } from '@jest/globals';
import { Pool } from 'pg';
import { DatabaseService } from '../services/database';

// Mock external services - must be at top level
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');
jest.mock('ioredis');

// Mock AIController to prevent model imports at module load time
const mockFn = () => Promise.resolve({ success: true });

// Mock the AI controller index file (which routes import from)
jest.mock('../controllers/ai', () => ({
  aiController: {
    getRecommendations: mockFn,
    getOptimalTiming: mockFn,
    getAdaptiveSchedule: mockFn,
    processMessage: mockFn,
    generateSmartResponse: mockFn,
    createLearningPath: mockFn,
    getLearningPaths: mockFn,
    trackLearningProgress: mockFn,
    getNextModule: mockFn,
    analyzeVoice: mockFn,
    getVoiceCoaching: mockFn,
    getVoiceInsights: mockFn,
    compareVoiceSessions: mockFn,
    getActiveInsights: mockFn,
    dismissInsight: mockFn,
    getInsightReport: mockFn,
    predictGoalCompletion: mockFn,
    getBehaviorPatterns: mockFn,
    getEngagementMetrics: mockFn,
    getPredictions: mockFn,
    getSuccessFactors: mockFn,
    getInterventionPlan: mockFn,
    getCoachingStrategy: mockFn,
    getPersonalizedContent: mockFn,
    updatePersonalization: mockFn,
    getPersonalizationPreferences: mockFn,
    hybridGenerate: mockFn,
    getRoutingDecision: mockFn,
    trackAnalyticsEvent: mockFn,
  },
}));

// Also mock the AIController file directly in case it's imported directly
jest.mock('../controllers/ai/AIController', () => ({
  aiController: {
    getRecommendations: mockFn,
    getOptimalTiming: mockFn,
    getAdaptiveSchedule: mockFn,
    processMessage: mockFn,
    generateSmartResponse: mockFn,
    createLearningPath: mockFn,
    getLearningPaths: mockFn,
    trackLearningProgress: mockFn,
    getNextModule: mockFn,
    analyzeVoice: mockFn,
    getVoiceCoaching: mockFn,
    getVoiceInsights: mockFn,
    compareVoiceSessions: mockFn,
    getActiveInsights: mockFn,
    dismissInsight: mockFn,
    getInsightReport: mockFn,
    predictGoalCompletion: mockFn,
    getBehaviorPatterns: mockFn,
    getEngagementMetrics: mockFn,
    getPredictions: mockFn,
    getSuccessFactors: mockFn,
    getInterventionPlan: mockFn,
    getCoachingStrategy: mockFn,
    getPersonalizedContent: mockFn,
    updatePersonalization: mockFn,
    getPersonalizationPreferences: mockFn,
    hybridGenerate: mockFn,
    getRoutingDecision: mockFn,
    trackAnalyticsEvent: mockFn,
  },
}));

// Mock individual model files to prevent initialization
jest.mock('../models/User');
jest.mock('../models/Goal');
jest.mock('../models/Task');
jest.mock('../models/Mood');
jest.mock('../models/Chat');
jest.mock('../models/ChatMessage');
jest.mock('../models/UserProfile');
jest.mock('../models/experiments/Experiment');
jest.mock('../models/experiments/ExperimentAssignment');
jest.mock('../models/experiments/ExperimentEvent');
// Mock converted Model.init() models
jest.mock('../models/AIInteraction');
jest.mock('../models/AIFeedback');
jest.mock('../models/CoachSession');
jest.mock('../models/CoachProfile');
jest.mock('../models/CoachPackage');
jest.mock('../models/CoachReview');
jest.mock('../models/financial/RevenueAnalytics');
jest.mock('../models/financial/CostTracking');
jest.mock('../models/financial/FinancialSnapshot');

// Set test environment
process.env.NODE_ENV = 'test';

// Only set test secrets if we're in test environment
if (process.env.NODE_ENV === 'test') {
  process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-that-is-long-enough-for-validation';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/upcoach_test';
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.CLAUDE_API_KEY = 'test-claude-key';
  process.env.REDIS_HOST = 'localhost';
  process.env.REDIS_PORT = '6379';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.CSRF_SECRET = 'test-csrf-secret-that-is-long-enough-for-validation-and-more-than-64-chars';
}

// Store original console for cleanup
const originalConsole = global.console;

// Mock console methods to reduce noise (only if VERBOSE_TESTS is not set)
if (!process.env.VERBOSE_TESTS) {
  const mockFn = () => {};
  global.console = {
    ...console,
    log: mockFn as unknown,
    debug: mockFn as unknown,
    info: mockFn as unknown,
    warn: originalConsole.warn, // Keep warnings and errors
    error: originalConsole.error,
  };
}

// Use manual mock from __mocks__/redis.ts
jest.mock('../services/redis');

// Mock Sequelize configuration first - this is critical for model initialization
jest.mock('../config/sequelize', () => ({
  sequelize: {
    authenticate: jest.fn(),
    sync: jest.fn(),
    getDialect: jest.fn(() => 'postgres'),
    getDatabaseName: jest.fn(() => 'test_db'),
    query: jest.fn(),
    transaction: jest.fn(),
    close: jest.fn(),
    define: jest.fn(),
  },
}));

// Mock database config
jest.mock('../config/database', () => ({
  sequelize: {
    authenticate: jest.fn(),
    sync: jest.fn(),
    getDialect: jest.fn(() => 'postgres'),
    getDatabaseName: jest.fn(() => 'test_db'),
    query: jest.fn(),
    transaction: jest.fn(),
    close: jest.fn(),
    define: jest.fn(),
  },
  initializeDatabase: jest.fn(),
  closeDatabase: jest.fn(),
  query: jest.fn(),
  transaction: jest.fn(),
}));

// Mock database models
jest.mock('../models', () => ({
  sequelize: {
    authenticate: jest.fn(),
    sync: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  UserProfile: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  Recommendation: {
    findAll: jest.fn(),
    create: jest.fn(),
    bulkCreate: jest.fn(),
  },
  ChatMessage: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  Chat: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  Goal: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

// Global test utilities
export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockAdminUser = {
  id: 'admin-user-123',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Inject mocked Pool before each test
beforeEach(() => {
  // Create a mocked Pool instance
  const mockPool = new Pool();

  // Inject it into DatabaseService
  DatabaseService.injectPool(mockPool);

  console.error('[TEST SETUP] Injected mocked Pool into DatabaseService');
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  // Clear any pending timers
  jest.clearAllTimers();

  // Reset DatabaseService
  DatabaseService.reset();
});

// Clean up after all tests
afterAll(async () => {
  // Restore original console
  if (originalConsole) {
    global.console = originalConsole;
  }
  
  // Clear all Jest mocks and timers
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.clearAllTimers();
  
  // Reset modules to prevent memory leaks
  jest.resetModules();
  
  // Clear any pending promises
  await new Promise(resolve => setImmediate(resolve));
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  console.log('🧹 Test cleanup completed');
});
