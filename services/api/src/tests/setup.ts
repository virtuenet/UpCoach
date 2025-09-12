// Test environment setup
import { jest, afterEach, afterAll } from '@jest/globals';

// Make jest available globally for tests
(global as any).jest = {
  ...jest,
  genMockFromModule: jest.fn(),
};

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

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock external services
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');
jest.mock('stripe');
jest.mock('ioredis');

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
jest.mock('../services/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    keys: jest.fn(),
    mget: jest.fn(),
    mset: jest.fn(),
  },
}));

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

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(async () => {
  // Close any open handles
  await new Promise(resolve => setTimeout(resolve, 500));
});
