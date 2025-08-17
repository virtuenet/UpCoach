import { sequelize } from '../src/models';
import { logger } from '../src/utils/logger';

// Increase timeout for database operations
jest.setTimeout(30000);

// Suppress console logs during tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Suppress logs
  logger.silent = true;
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  
  try {
    // Ensure database connection
    await sequelize.authenticate();
    
    // Sync database schema (force: true drops existing tables)
    await sequelize.sync({ force: true });
    
    console.info('Test database initialized');
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }
});

// Clean up after each test
afterEach(async () => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear database tables (but keep schema)
  const tables = Object.keys(sequelize.models);
  for (const table of tables) {
    try {
      await sequelize.models[table].destroy({ truncate: true, cascade: true });
    } catch (error) {
      // Some tables might not support truncate, try delete instead
      await sequelize.models[table].destroy({ where: {} });
    }
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    // Close database connection
    await sequelize.close();
    
    // Clear any remaining timers
    jest.clearAllTimers();
    
    // Force exit if needed
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error('Error during test cleanup:', error);
    process.exit(1);
  }
});

// Mock external services
jest.mock('../src/services/email/UnifiedEmailService', () => ({
  __esModule: true,
  default: {
    send: jest.fn().mockResolvedValue(true),
    queue: jest.fn().mockResolvedValue(undefined),
    sendWithProgress: jest.fn().mockResolvedValue({
      status: 'sent',
      progress: 100,
      message: 'Email sent successfully',
      timestamp: new Date(),
    }),
    getMetrics: jest.fn().mockReturnValue({
      sent: 0,
      failed: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      queued: 0,
    }),
    verifyConfiguration: jest.fn().mockResolvedValue(true),
    processQueue: jest.fn().mockResolvedValue(undefined),
    gracefulShutdown: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../src/services/cache/UnifiedCacheService', () => ({
  getCacheService: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(true),
    flush: jest.fn().mockResolvedValue(undefined),
    keys: jest.fn().mockResolvedValue([]),
    exists: jest.fn().mockResolvedValue(false),
    expire: jest.fn().mockResolvedValue(true),
  }),
}));

jest.mock('../src/services/payment/StripeService', () => ({
  stripeService: {
    createCustomer: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
    createPaymentIntent: jest.fn().mockResolvedValue({ 
      id: 'pi_test123',
      client_secret: 'secret_test123',
    }),
    createSubscription: jest.fn().mockResolvedValue({
      id: 'sub_test123',
      status: 'active',
    }),
    cancelSubscription: jest.fn().mockResolvedValue({
      id: 'sub_test123',
      status: 'canceled',
    }),
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
    userId: user.id,
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