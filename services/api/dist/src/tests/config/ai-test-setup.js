"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockDatabaseUtils = exports.AIMockPatterns = exports.AITestDataFactory = exports.testConfig = void 0;
exports.setupAITesting = setupAITesting;
const ai_test_config_1 = require("./ai-test.config");
const AITestUtils_1 = require("../utils/AITestUtils");
Object.defineProperty(exports, "AIMockPatterns", { enumerable: true, get: function () { return AITestUtils_1.AIMockPatterns; } });
Object.defineProperty(exports, "AITestDataFactory", { enumerable: true, get: function () { return AITestUtils_1.AITestDataFactory; } });
Object.defineProperty(exports, "MockDatabaseUtils", { enumerable: true, get: function () { return AITestUtils_1.MockDatabaseUtils; } });
const testConfig = (0, ai_test_config_1.getAITestConfig)();
exports.testConfig = testConfig;
function setupAIMocks() {
    const mockOpenAI = {
        OpenAI: function () {
            return {
                chat: {
                    completions: {
                        create: async (params) => ({
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
                        })
                    }
                }
            };
        }
    };
    const mockAnthropic = {
        __esModule: true,
        default: function () {
            return {
                messages: {
                    create: async (params) => ({
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
                    })
                }
            };
        }
    };
    const mockRedis = {
        __esModule: true,
        default: function () {
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
    const mockUser = AITestUtils_1.MockDatabaseUtils.mockUserOperations();
    const mockGoal = AITestUtils_1.MockDatabaseUtils.mockGoalOperations();
    const mockTask = AITestUtils_1.MockDatabaseUtils.mockTaskOperations();
    const mockMood = AITestUtils_1.MockDatabaseUtils.mockMoodOperations();
    const mockModels = {
        User: mockUser,
        Goal: mockGoal,
        Task: mockTask,
        Mood: mockMood,
        UserProfile: {
            findOne: () => Promise.resolve(null),
            findByPk: () => Promise.resolve(null),
            create: (data) => Promise.resolve(data),
            update: (data) => Promise.resolve([1])
        },
        ChatMessage: {
            findAll: () => Promise.resolve([]),
            create: (data) => Promise.resolve(data)
        },
        VoiceJournalEntry: {
            findAll: () => Promise.resolve([]),
            create: (data) => Promise.resolve(data)
        }
    };
    const moduleCache = require.cache;
    Object.keys(moduleCache).forEach(key => {
        if (key.includes('openai')) {
            moduleCache[key].exports = mockOpenAI;
        }
        else if (key.includes('@anthropic-ai/sdk')) {
            moduleCache[key].exports = mockAnthropic;
        }
        else if (key.includes('ioredis')) {
            moduleCache[key].exports = mockRedis;
        }
        else if (key.includes('models') && key.includes('index')) {
            moduleCache[key].exports = mockModels;
        }
    });
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    Module.prototype.require = function (id) {
        if (id === 'openai') {
            return mockOpenAI;
        }
        else if (id === '@anthropic-ai/sdk') {
            return mockAnthropic;
        }
        else if (id === 'ioredis') {
            return mockRedis;
        }
        else if (id.includes('../../models')) {
            return mockModels;
        }
        return originalRequire.apply(this, arguments);
    };
}
function setupPerformanceMonitoring() {
    global.performance = global.performance || {
        mark: () => { },
        measure: () => { },
        now: () => Date.now(),
        clearMarks: () => { },
        clearMeasures: () => { },
        getEntriesByName: () => [],
        getEntriesByType: () => []
    };
    if (!process.env.VERBOSE_TESTS) {
        const originalConsole = global.console;
        global.console = {
            ...originalConsole,
            log: () => { },
            debug: () => { },
            info: () => { },
            warn: originalConsole.warn,
            error: originalConsole.error
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
    if (typeof jest !== 'undefined') {
        jest.setTimeout(timeouts[testType] || 10000);
    }
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
    if (typeof expect !== 'undefined') {
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
if (typeof beforeAll !== 'undefined') {
    beforeAll(async () => {
        setupAITesting();
    });
}
if (typeof afterAll !== 'undefined') {
    afterAll(async () => {
        if (typeof jest !== 'undefined') {
            jest.clearAllMocks();
            jest.restoreAllMocks();
        }
    });
}
if (typeof beforeEach !== 'undefined') {
    beforeEach(() => {
        if (typeof jest !== 'undefined') {
            jest.clearAllMocks();
        }
    });
}
if (typeof afterEach !== 'undefined') {
    afterEach(() => {
        if (testConfig.database.resetBetweenTests) {
        }
    });
}
//# sourceMappingURL=ai-test-setup.js.map