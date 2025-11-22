/**
 * Jest Setup - Runs BEFORE test environment is created
 * This ensures mocks are in place before any modules are loaded
 */

console.error('[JEST SETUP] jest.setup.ts is loading...');

import { jest } from '@jest/globals';

// Set test environment variables FIRST
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-long-enough-for-validation';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-that-is-long-enough-for-validation';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/upcoach_test';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.CLAUDE_API_KEY = 'test-claude-key';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.CSRF_SECRET = 'test-csrf-secret-that-is-long-enough-for-validation-and-more-than-64-chars';
process.env.SMTP_HOST = 'smtp.example.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-password';
process.env.SMTP_FROM = 'Test <test@example.com>';
process.env.SMTP_SECURE = 'false';

// Mock external services - must be at top level BEFORE any imports
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');
jest.mock('ioredis');

// Mock pg (PostgreSQL) to prevent actual database connections
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => {
    const mockQuery = jest.fn().mockImplementation(async (queryText: string) => {
      console.error('[PG POOL MOCK] Query called:', queryText.substring(0, 100));

      // Handle SELECT NOW() - connection test
      if (queryText.includes('NOW()')) {
        return {
          rows: [{ now: new Date() }],
          rowCount: 1,
        };
      }

      // Handle SELECT queries (e.g., find existing user)
      if (queryText.trim().toUpperCase().startsWith('SELECT')) {
        // Return empty result for existing user check
        return { rows: [], rowCount: 0 };
      }

      // Handle INSERT queries
      if (queryText.trim().toUpperCase().startsWith('INSERT')) {
        // Return a mock user object for INSERT INTO users
        if (queryText.includes('users')) {
          return {
            rows: [{
              id: 'test-user-id-' + Math.random().toString(36).substring(7),
              email: 'test@example.com',
              password_hash: 'hashed_password',
              name: 'Test User',
              bio: null,
              role: 'user',
              is_active: true,
              is_email_verified: false,
              avatar: null,
              avatar_url: null,
              google_id: null,
              onboarding_completed: false,
              onboarding_completed_at: null,
              onboarding_skipped: false,
              preferences: {},
              last_login_at: null,
              created_at: new Date(),
              updated_at: new Date(),
            }],
            rowCount: 1,
          };
        }
      }

      // Handle UPDATE queries
      if (queryText.trim().toUpperCase().startsWith('UPDATE')) {
        return { rows: [], rowCount: 1 };
      }

      // Default: empty result
      return { rows: [], rowCount: 0 };
    });

    return {
      connect: jest.fn().mockResolvedValue({
        query: mockQuery,
        release: jest.fn(),
      }),
      query: mockQuery,
      end: jest.fn().mockResolvedValue(undefined),
    };
  }),
}));

// Mock nodemailer to prevent SMTP connections
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(async () => ({ messageId: 'test-message-id' })),
    verify: jest.fn((callback?: (error: Error | null) => void) => {
      if (callback) callback(null);
      return Promise.resolve(true);
    }),
  })),
}));

// Note: bcryptjs is NOT mocked for integration tests - we use the real library
// to ensure proper password hashing and comparison

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

// Also mock the AIController file directly
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

// Mock other AI controllers
jest.mock('../controllers/ai/UserProfilingController', () => ({
  UserProfilingController: jest.fn(),
  userProfilingController: {
    getProfile: mockFn,
    getInsights: mockFn,
    getRecommendations: mockFn,
    assessReadiness: mockFn,
    updatePreferences: mockFn,
    refreshProfile: mockFn,
  },
}));

jest.mock('../controllers/ai/LocalLLMController', () => {
  const MockClass = jest.fn();
  const mockController = {
    getStatus: mockFn,
    getAvailableModels: mockFn,
    generateResponse: mockFn,
    initializeModel: mockFn,
    healthCheck: mockFn,
    getMetrics: mockFn,
    processQuery: mockFn,
    loadModel: mockFn,
    unloadModel: mockFn,
  };
  return {
    __esModule: true,
    default: mockController, // Default export should be the controller object
    LocalLLMController: MockClass,
    localLLMController: mockController,
  };
});

// Mock individual model files - Jest will automatically use manual mocks from __mocks__ directories
console.error('[JEST SETUP] Setting up model mocks...');

// User model mock will be loaded from src/models/__mocks__/User.ts automatically
jest.mock('../models/User');

jest.mock('../models/Goal');
jest.mock('../models/Task');
jest.mock('../models/Mood');
jest.mock('../models/Chat');
jest.mock('../models/ChatMessage');
jest.mock('../models/UserProfile');

// Mock CMS models that use sequelize.literal
jest.mock('../models/cms/ContentArticle');
jest.mock('../models/cms/ContentCategory');
jest.mock('../models/cms/ContentComment');
jest.mock('../models/cms/ContentInteraction');
jest.mock('../models/cms/ContentVersion');

// Mock financial models that use Sequelize
jest.mock('../models/financial/CostTracking');
jest.mock('../models/financial/RevenueAnalytics');
jest.mock('../models/financial/FinancialSnapshot');

// Mock coach content routes - not loaded by setupTestRoutes but mocked to prevent import errors
// if other code tries to import it
jest.mock('../routes/coachContent', () => ({ default: jest.fn() }));

jest.mock('../controllers/cms/CoachContentController', () => ({
  default: {
    createContent: mockFn,
    updateContent: mockFn,
    deleteContent: mockFn,
    getContent: mockFn,
    listContent: mockFn,
  },
}));

// Mock forum routes - not loaded by setupTestRoutes but mocked to prevent import errors
jest.mock('../routes/forum', () => ({ default: jest.fn() }));

jest.mock('../services/community/ForumService', () => ({
  ForumService: jest.fn(),
}));

jest.mock('../controllers/community/ForumController', () => ({
  default: {
    getCategories: mockFn,
    createThread: mockFn,
    getThreads: mockFn,
    createPost: mockFn,
    getPosts: mockFn,
  },
}));

// No need to mock individual routes anymore - setupTestRoutes only loads auth routes
// Other routes won't be imported at all

// Mock database service using manual mock from __mocks__/database.ts
console.error('[JEST SETUP] Setting up database mock (using manual mock)...');
jest.mock('../services/database');

// Mock redis service using manual mock from __mocks__/redis.ts
console.error('[JEST SETUP] Setting up redis mock (using manual mock)...');
jest.mock('../services/redis');

// Mock email service to prevent email sending and SMTP connections
jest.mock('../services/email/UnifiedEmailService', () => ({
  emailService: {
    sendPasswordResetEmail: jest.fn(async () => ({ success: true })),
    sendVerificationEmail: jest.fn(async () => ({ success: true })),
    sendWelcomeEmail: jest.fn(async () => ({ success: true })),
    sendEmail: jest.fn(async () => ({ success: true })),
  },
}));

// Mock DataDog service to prevent StatsD connections
jest.mock('../services/monitoring/DataDogService', () => ({
  dataDogService: {
    initialize: jest.fn(),
    requestTracing: jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
    incrementMetric: jest.fn(),
    gauge: jest.fn(),
    histogram: jest.fn(),
    timing: jest.fn(),
    set: jest.fn(),
  },
}));

// Mock CSRF middleware to allow test requests without CSRF tokens
jest.mock('../middleware/csrf', () => ({
  configureCsrf: jest.fn(() => {}), // No-op function that does nothing
  csrfProtection: jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
  csrfMiddleware: jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
}));

// Mock setupRoutes to use test-specific route setup (only auth routes)
// This bypasses loading problematic routes while allowing auth testing
jest.mock('../routes/index', () => {
  const { setupTestRoutes } = require('./testSetupRoutes');
  return {
    setupRoutes: setupTestRoutes,
  };
});

// Mock Sequelize configuration
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
    literal: jest.fn((val) => ({ val })),
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
    literal: jest.fn((val) => ({ val })),
  },
  initializeDatabase: jest.fn(),
  closeDatabase: jest.fn(),
  query: jest.fn(),
  transaction: jest.fn(),
}));

// Mock database models - this is for when code imports from '../models' index file
jest.mock('../models', () => {
  // Re-use the User mock defined above by requiring it after jest.mock has been set up
  let UserMock;
  try {
    console.error('[JEST SETUP] Attempting to load User mock from requireMock...');
    UserMock = jest.requireMock('../models/User').User;
    console.error('[JEST SETUP] User mock loaded successfully, type:', typeof UserMock);
    console.error('[JEST SETUP] UserMock.create type:', typeof UserMock?.create);
  } catch (e) {
    console.error('[JEST SETUP] Failed to load User mock, using fallback. Error:', (e as Error).message);
    // Fallback if require fails
    UserMock = {
      findByPk: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    };
  }

  return {
    sequelize: {
      authenticate: jest.fn(),
      sync: jest.fn(),
    },
    User: UserMock,
    UserProfile: {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    Goal: {
      findAll: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    },
  };
});
