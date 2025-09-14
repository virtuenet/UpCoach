"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockDatabaseUtils = exports.AIMockPatterns = exports.AITestDataFactory = exports.testConfig = void 0;
exports.setupAITesting = setupAITesting;
const globals_1 = require("@jest/globals");
const ai_test_config_1 = require("./ai-test.config");
const AITestUtils_1 = require("../utils/AITestUtils");
Object.defineProperty(exports, "AIMockPatterns", { enumerable: true, get: function () { return AITestUtils_1.AIMockPatterns; } });
Object.defineProperty(exports, "AITestDataFactory", { enumerable: true, get: function () { return AITestUtils_1.AITestDataFactory; } });
Object.defineProperty(exports, "MockDatabaseUtils", { enumerable: true, get: function () { return AITestUtils_1.MockDatabaseUtils; } });
const testConfig = (0, ai_test_config_1.getAITestConfig)();
exports.testConfig = testConfig;
function setupAIMocks() {
    globals_1.jest.mock('openai', () => ({
        OpenAI: globals_1.jest.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: globals_1.jest.fn().mockImplementation(async (params) => ({
                        id: `chatcmpl-${Date.now()}`,
                        object: 'chat.completion',
                        created: Math.floor(Date.now() / 1000),
                        model: params.model || 'gpt-4-turbo-preview',
                        choices: [{
                                index: 0,
                                message: {
                                    role: 'assistant',
                                    content: AITestUtils_1.AIMockPatterns.generateCoachingResponse(params.messages?.[params.messages.length - 1]?.content || 'test', {}).content
                                },
                                finish_reason: 'stop'
                            }],
                        usage: {
                            prompt_tokens: params.messages?.length * 10 || 10,
                            completion_tokens: 25,
                            total_tokens: (params.messages?.length * 10 || 10) + 25
                        }
                    }))
                }
            }
        }))
    }));
    globals_1.jest.mock('@anthropic-ai/sdk', () => ({
        __esModule: true,
        default: globals_1.jest.fn().mockImplementation(() => ({
            messages: {
                create: globals_1.jest.fn().mockImplementation(async (params) => ({
                    id: `msg_${Date.now()}`,
                    type: 'message',
                    role: 'assistant',
                    content: [{
                            type: 'text',
                            text: AITestUtils_1.AIMockPatterns.generateCoachingResponse(params.messages?.[params.messages.length - 1]?.content || 'test', {}).content
                        }],
                    model: params.model || 'claude-3-sonnet-20240229',
                    stop_reason: 'end_turn',
                    stop_sequence: null,
                    usage: {
                        input_tokens: params.messages?.length * 8 || 8,
                        output_tokens: 20
                    }
                }))
            }
        }))
    }));
    globals_1.jest.mock('ioredis', () => ({
        __esModule: true,
        default: globals_1.jest.fn().mockImplementation(() => ({
            get: globals_1.jest.fn().mockResolvedValue(null),
            set: globals_1.jest.fn().mockResolvedValue('OK'),
            del: globals_1.jest.fn().mockResolvedValue(1),
            exists: globals_1.jest.fn().mockResolvedValue(0),
            expire: globals_1.jest.fn().mockResolvedValue(1),
            flushdb: globals_1.jest.fn().mockResolvedValue('OK')
        }))
    }));
    const mockUser = AITestUtils_1.MockDatabaseUtils.mockUserOperations();
    const mockGoal = AITestUtils_1.MockDatabaseUtils.mockGoalOperations();
    const mockTask = AITestUtils_1.MockDatabaseUtils.mockTaskOperations();
    const mockMood = AITestUtils_1.MockDatabaseUtils.mockMoodOperations();
    globals_1.jest.mock('../../models', () => ({
        User: mockUser,
        Goal: mockGoal,
        Task: mockTask,
        Mood: mockMood,
        UserProfile: {
            findOne: globals_1.jest.fn(),
            findByPk: globals_1.jest.fn(),
            create: globals_1.jest.fn(),
            update: globals_1.jest.fn()
        },
        ChatMessage: {
            findAll: globals_1.jest.fn().mockResolvedValue([]),
            create: globals_1.jest.fn()
        },
        VoiceJournalEntry: {
            findAll: globals_1.jest.fn().mockResolvedValue([]),
            create: globals_1.jest.fn()
        }
    }));
}
function setupPerformanceMonitoring() {
    global.performance = global.performance || {
        mark: globals_1.jest.fn(),
        measure: globals_1.jest.fn(),
        now: () => Date.now(),
        clearMarks: globals_1.jest.fn(),
        clearMeasures: globals_1.jest.fn(),
        getEntriesByName: globals_1.jest.fn().mockReturnValue([]),
        getEntriesByType: globals_1.jest.fn().mockReturnValue([])
    };
    if (!process.env.VERBOSE_TESTS) {
        global.console = {
            ...console,
            log: globals_1.jest.fn(),
            debug: globals_1.jest.fn(),
            info: globals_1.jest.fn(),
            warn: console.warn,
            error: console.error
        };
    }
}
function setupErrorHandling() {
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
    });
}
function setupTestDataFactories() {
    global.AITestDataFactory = AITestUtils_1.AITestDataFactory;
    global.AIMockPatterns = AITestUtils_1.AIMockPatterns;
    global.MockDatabaseUtils = AITestUtils_1.MockDatabaseUtils;
}
function setupTimeouts() {
    const testType = process.env.TEST_TYPE || 'unit';
    const timeouts = {
        unit: 10000,
        integration: 30000,
        performance: 60000,
        contract: 15000,
        scenario: 120000
    };
    globals_1.jest.setTimeout(timeouts[testType] || 10000);
}
function setupEnvironment() {
    process.env.NODE_ENV = 'test';
    process.env.AI_TESTING_MODE = 'true';
    process.env.MOCK_AI_RESPONSES = process.env.MOCK_AI_RESPONSES || 'true';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.CLAUDE_API_KEY = 'test-claude-key';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/upcoach_test';
    process.env.REDIS_URL = 'redis://localhost:6379/1';
}
function setupCustomMatchers() {
    expect.extend({
        toBeValidAIResponse(received) {
            const pass = (received &&
                typeof received.id === 'string' &&
                typeof received.content === 'string' &&
                received.content.length > 0 &&
                received.usage &&
                typeof received.usage.totalTokens === 'number' &&
                received.usage.totalTokens > 0);
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
            const pass = (received &&
                Array.isArray(received.goals) &&
                Array.isArray(received.habits) &&
                Array.isArray(received.content) &&
                Array.isArray(received.activities));
            return {
                message: () => `expected ${JSON.stringify(received)} to have valid recommendation structure`,
                pass
            };
        },
        toHaveValidUserProfile(received) {
            const pass = (received &&
                typeof received.learningStyle === 'string' &&
                typeof received.communicationPreference === 'string' &&
                received.coachingPreferences &&
                received.behaviorPatterns);
            return {
                message: () => `expected ${JSON.stringify(received)} to be a valid user profile`,
                pass
            };
        },
        toHaveValidVoiceAnalysis(received) {
            const pass = (received &&
                typeof received.transcript === 'string' &&
                received.sentiment &&
                received.speechPatterns &&
                received.linguisticAnalysis &&
                Array.isArray(received.insights));
            return {
                message: () => `expected ${JSON.stringify(received)} to be a valid voice analysis`,
                pass
            };
        }
    });
}
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
beforeAll(async () => {
    setupAITesting();
});
afterAll(async () => {
    globals_1.jest.clearAllMocks();
    globals_1.jest.restoreAllMocks();
});
beforeEach(() => {
    globals_1.jest.clearAllMocks();
});
afterEach(() => {
    if (testConfig.database.resetBetweenTests) {
    }
});
//# sourceMappingURL=ai-test-setup.js.map