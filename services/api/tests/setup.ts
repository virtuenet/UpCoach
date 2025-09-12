import { Sequelize } from 'sequelize';
import { logger } from '../src/utils/logger';
import { jest, beforeAll, afterEach, afterAll } from '@jest/globals';

// Configure test environment
process.env.NODE_ENV = 'test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Use an in-memory SQLite database for testing
const sequelize = new Sequelize('sqlite::memory:', {
  logging: false, // Disable logging
});

// Import and initialize models dynamically
async function initializeModels() {
  const modelPaths = [
    '../src/models/User',
    '../src/models/Goal',
    '../src/models/Task',
    '../src/models/experiments/Experiment',
    '../src/models/experiments/ExperimentAssignment',
    '../src/models/experiments/ExperimentEvent'
  ];

  for (const modelPath of modelPaths) {
    try {
      const modelModule = await import(modelPath);
      const modelClass = Object.values(modelModule)[0] as any;
      
      if (typeof modelClass === 'function' && modelClass.init) {
        modelClass.init(sequelize);
      }
    } catch (error) {
      console.error(`Failed to initialize model from ${modelPath}:`, error);
    }
  }
}

// Setup before all tests
beforeAll(async () => {
  try {
    // Initialize models
    await initializeModels();

    // Sync all models
    await sequelize.sync({ force: true });

    console.info('Test database initialized');
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }
});

// Cleanup after each test
afterEach(async () => {
  // Clear all mocks
  jest.clearAllMocks();

  // Clear database tables
  const models = sequelize.models;
  for (const modelName in models) {
    if (models.hasOwnProperty(modelName)) {
      await models[modelName].destroy({ truncate: true, cascade: true });
    }
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    // Close database connection
    await sequelize.close();

    // Clear any remaining timers
    jest.clearAllTimers();
  } catch (error) {
    console.error('Error during test cleanup:', error);
  }
});

// Mock external services
jest.mock('../src/services/email/UnifiedEmailService', () => ({
  __esModule: true,
  default: {
    send: jest.fn(),
    queue: jest.fn(),
    sendWithProgress: jest.fn(),
    getMetrics: jest.fn(),
    verifyConfiguration: jest.fn(),
    processQueue: jest.fn(),
    gracefulShutdown: jest.fn(),
  },
}));

jest.mock('../src/services/cache/UnifiedCacheService', () => ({
  getCacheService: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    flush: jest.fn(),
    keys: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
  })),
}));

jest.mock('../src/services/financial/StripeWebhookService', () => ({
  stripeService: {
    createCustomer: jest.fn(),
    createPaymentIntent: jest.fn(),
    createSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
  },
}));

// Helper function to create test user
export async function createTestUser(overrides = {}) {
  const { User } = sequelize.models;
  return User.create({
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedpassword123',
    role: 'user',
    isEmailVerified: true,
    ...overrides,
  });
}

// Helper function to create test coach
export async function createTestCoach(overrides = {}) {
  const user = await createTestUser({
    role: 'coach',
    email: 'coach@example.com',
    name: 'Test Coach',
    ...overrides,
  });

  const { CoachProfile } = sequelize.models;
  const profile = await CoachProfile.create({
    userId: (user as any).id,
    specialization: ['life', 'career'],
    hourlyRate: 100,
    bio: 'Experienced coach',
    availability: {
      monday: ['09:00-17:00'],
      tuesday: ['09:00-17:00'],
      wednesday: ['09:00-17:00'],
      thursday: ['09:00-17:00'],
      friday: ['09:00-17:00'],
    },
    ...overrides,
  });

  return { user, profile };
}

// Helper function to create test subscription
export async function createTestSubscription(userId: number, overrides = {}) {
  const { Subscription } = sequelize.models;
  return Subscription.create({
    userId,
    stripeSubscriptionId: 'sub_test123',
    stripePriceId: 'price_test123',
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    ...overrides,
  });
}

// Helper function to authenticate test user
export function authenticateTestUser(user: any) {
  return {
    headers: {
      authorization: `Bearer test_token_${user.id}`,
    },
  };
}

// Export test utilities
export const testUtils = {
  createTestUser,
  createTestCoach,
  createTestSubscription,
  authenticateTestUser,
};