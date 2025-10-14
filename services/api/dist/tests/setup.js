"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockAdminUser = exports.mockUser = void 0;
const globals_1 = require("@jest/globals");
globals_1.jest.mock('openai');
globals_1.jest.mock('@anthropic-ai/sdk');
globals_1.jest.mock('ioredis');
globals_1.jest.mock('../models/User');
globals_1.jest.mock('../models/Goal');
globals_1.jest.mock('../models/Task');
globals_1.jest.mock('../models/Mood');
globals_1.jest.mock('../models/Chat');
globals_1.jest.mock('../models/ChatMessage');
globals_1.jest.mock('../models/UserProfile');
globals_1.jest.mock('../models/experiments/Experiment');
globals_1.jest.mock('../models/experiments/ExperimentAssignment');
globals_1.jest.mock('../models/experiments/ExperimentEvent');
process.env.NODE_ENV = 'test';
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
const originalConsole = global.console;
if (!process.env.VERBOSE_TESTS) {
    const mockFn = () => { };
    global.console = {
        ...console,
        log: mockFn,
        debug: mockFn,
        info: mockFn,
        warn: originalConsole.warn,
        error: originalConsole.error,
    };
}
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
globals_1.jest.mock('../config/sequelize', () => ({
    sequelize: {
        authenticate: globals_1.jest.fn(),
        sync: globals_1.jest.fn(),
        getDialect: globals_1.jest.fn(() => 'postgres'),
        getDatabaseName: globals_1.jest.fn(() => 'test_db'),
        query: globals_1.jest.fn(),
        transaction: globals_1.jest.fn(),
        close: globals_1.jest.fn(),
        define: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock('../config/database', () => ({
    sequelize: {
        authenticate: globals_1.jest.fn(),
        sync: globals_1.jest.fn(),
        getDialect: globals_1.jest.fn(() => 'postgres'),
        getDatabaseName: globals_1.jest.fn(() => 'test_db'),
        query: globals_1.jest.fn(),
        transaction: globals_1.jest.fn(),
        close: globals_1.jest.fn(),
        define: globals_1.jest.fn(),
    },
    initializeDatabase: globals_1.jest.fn(),
    closeDatabase: globals_1.jest.fn(),
    query: globals_1.jest.fn(),
    transaction: globals_1.jest.fn(),
}));
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
(0, globals_1.afterEach)(() => {
    globals_1.jest.clearAllMocks();
    globals_1.jest.clearAllTimers();
});
(0, globals_1.afterAll)(async () => {
    if (originalConsole) {
        global.console = originalConsole;
    }
    globals_1.jest.clearAllMocks();
    globals_1.jest.restoreAllMocks();
    globals_1.jest.clearAllTimers();
    globals_1.jest.resetModules();
    await new Promise(resolve => setImmediate(resolve));
    if (global.gc) {
        global.gc();
    }
    console.log('🧹 Test cleanup completed');
});
