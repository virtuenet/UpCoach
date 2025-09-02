"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockAdminUser = exports.mockUser = void 0;
// Test environment setup
const globals_1 = require("@jest/globals");
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
    log: globals_1.jest.fn(),
    debug: globals_1.jest.fn(),
    info: globals_1.jest.fn(),
    warn: globals_1.jest.fn(),
    error: globals_1.jest.fn(),
};
// Mock external services
globals_1.jest.mock('openai');
globals_1.jest.mock('@anthropic-ai/sdk');
globals_1.jest.mock('stripe');
globals_1.jest.mock('ioredis');
// Mock individual model files to prevent initialization
globals_1.jest.mock('../models/User');
globals_1.jest.mock('../models/Goal');
globals_1.jest.mock('../models/Task');
globals_1.jest.mock('../models/Mood');
globals_1.jest.mock('../models/Chat');
globals_1.jest.mock('../models/ChatMessage');
globals_1.jest.mock('../models/UserProfile');
globals_1.jest.mock('../services/redis', () => ({
    redis: {
        get: globals_1.jest.fn(),
        set: globals_1.jest.fn(),
        del: globals_1.jest.fn(),
        expire: globals_1.jest.fn(),
        ttl: globals_1.jest.fn(),
        keys: globals_1.jest.fn(),
        mget: globals_1.jest.fn(),
        mset: globals_1.jest.fn(),
    },
}));
// Mock database models
globals_1.jest.mock('../models', () => ({
    sequelize: {
        authenticate: globals_1.jest.fn(),
        sync: globals_1.jest.fn(),
    },
    User: {
        findByPk: globals_1.jest.fn(),
        findOne: globals_1.jest.fn(),
        findAll: globals_1.jest.fn(),
        create: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        destroy: globals_1.jest.fn(),
    },
    UserProfile: {
        findOne: globals_1.jest.fn(),
        create: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
    },
    Recommendation: {
        findAll: globals_1.jest.fn(),
        create: globals_1.jest.fn(),
        bulkCreate: globals_1.jest.fn(),
    },
    ChatMessage: {
        findAll: globals_1.jest.fn(),
        findByPk: globals_1.jest.fn(),
        create: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        destroy: globals_1.jest.fn(),
    },
    Chat: {
        findAll: globals_1.jest.fn(),
        findByPk: globals_1.jest.fn(),
        create: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        destroy: globals_1.jest.fn(),
    },
    Goal: {
        findAll: globals_1.jest.fn(),
        findByPk: globals_1.jest.fn(),
        create: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        destroy: globals_1.jest.fn(),
    },
}));
// Global test utilities
exports.mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
};
exports.mockAdminUser = {
    id: 'admin-user-123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
};
// Clear all mocks after each test
(0, globals_1.afterEach)(() => {
    globals_1.jest.clearAllMocks();
});
// Clean up after all tests
(0, globals_1.afterAll)(async () => {
    // Close any open handles
    await new Promise(resolve => setTimeout(resolve, 500));
});
//# sourceMappingURL=setup.js.map