"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceTracker = exports.MockLocalLLMService = exports.performanceAssertions = exports.LocalLLMTestDataFactory = exports.QualityValidator = void 0;
const perf_hooks_1 = require("perf_hooks");
class PerformanceTracker {
    metrics = new Map();
    startTimer(testName) {
        const startTime = perf_hooks_1.performance.now();
        return () => {
            const endTime = perf_hooks_1.performance.now();
            const duration = endTime - startTime;
            if (!this.metrics.has(testName)) {
                this.metrics.set(testName, []);
            }
            this.metrics.get(testName).push(duration);
            return duration;
        };
    }
    getMetrics(testName) {
        return this.metrics.get(testName) || [];
    }
    getP95(testName) {
        const values = this.getMetrics(testName);
        if (values.length === 0)
            return 0;
        const sorted = values.sort((a, b) => a - b);
        const index = Math.ceil(values.length * 0.95) - 1;
        return sorted[index];
    }
    getAverage(testName) {
        const values = this.getMetrics(testName);
        if (values.length === 0)
            return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    clear() {
        this.metrics.clear();
    }
}
exports.PerformanceTracker = PerformanceTracker;
class MockLocalLLMService {
    isLoaded = false;
    currentModel = null;
    responseDelay;
    qualityScore;
    constructor(config = {}) {
        this.responseDelay = config.responseDelay ?? 100;
        this.qualityScore = config.qualityScore ?? 4.2;
    }
    async loadModel(modelName) {
        const startTime = perf_hooks_1.performance.now();
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (modelName.includes('invalid')) {
            return {
                success: false,
                error: 'Model not found'
            };
        }
        this.isLoaded = true;
        this.currentModel = modelName;
        return {
            success: true,
            model: {
                name: modelName,
                quantization: 'Q4_K_M',
                memoryUsage: 3.5 * 1024 * 1024 * 1024,
                loadTime: perf_hooks_1.performance.now() - startTime
            },
            loadTime: perf_hooks_1.performance.now() - startTime
        };
    }
    async generateResponse(messages, options = {}) {
        if (!this.isLoaded) {
            throw new Error('Model not loaded');
        }
        const startTime = perf_hooks_1.performance.now();
        await new Promise(resolve => setTimeout(resolve, this.responseDelay));
        const userMessage = messages[messages.length - 1]?.content || '';
        let response = 'I understand your request. ';
        if (userMessage.toLowerCase().includes('exercise') || userMessage.toLowerCase().includes('fitness')) {
            response += 'Regular exercise is important for physical and mental health. ';
        }
        else if (userMessage.toLowerCase().includes('motivation')) {
            response += 'Staying motivated can be challenging, but setting small, achievable goals helps. ';
        }
        else if (userMessage.toLowerCase().includes('goal')) {
            response += 'Setting SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound) is key to success. ';
        }
        else {
            response += 'Let me help you work through this step by step. ';
        }
        response += 'What specific area would you like to focus on first?';
        return {
            content: response,
            tokensGenerated: Math.floor(response.length / 4),
            qualityScore: this.qualityScore + (Math.random() - 0.5) * 0.5,
            processingTime: perf_hooks_1.performance.now() - startTime,
            model: this.currentModel
        };
    }
    async generateCoachingResponse(prompt, context) {
        const personality = context.personality || 'balanced';
        let response = '';
        switch (personality) {
            case 'motivational':
                response = 'You absolutely can achieve this! I believe in your potential. ';
                break;
            case 'analytical':
                response = 'Let\'s analyze this systematically and create a data-driven approach. ';
                break;
            case 'supportive':
                response = 'I understand this might feel overwhelming. Let\'s take it one step at a time. ';
                break;
            default:
                response = 'I\'m here to help you succeed. ';
        }
        if (prompt.toLowerCase().includes('unmotivated')) {
            response += 'Low motivation is completely normal. What usually helps you feel energized?';
        }
        else {
            response += 'What\'s the most important thing you\'d like to work on right now?';
        }
        return {
            content: response,
            qualityScore: this.qualityScore,
            personality
        };
    }
    isModelLoaded() {
        return this.isLoaded;
    }
    getCurrentModel() {
        return this.currentModel;
    }
    setQualityScore(score) {
        this.qualityScore = score;
    }
    setResponseDelay(delay) {
        this.responseDelay = delay;
    }
}
exports.MockLocalLLMService = MockLocalLLMService;
class QualityValidator {
    static validateResponseStructure(response) {
        return (typeof response === 'object' &&
            typeof response.content === 'string' &&
            response.content.length > 0 &&
            typeof response.tokensGenerated === 'number' &&
            response.tokensGenerated > 0);
    }
    static validateCoachingQuality(response, expectedKeywords) {
        const content = response.toLowerCase();
        return expectedKeywords.some(keyword => content.includes(keyword.toLowerCase()));
    }
    static calculateSimilarityScore(response1, response2) {
        const words1 = new Set(response1.toLowerCase().split(/\s+/));
        const words2 = new Set(response2.toLowerCase().split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
    }
}
exports.QualityValidator = QualityValidator;
class LocalLLMTestDataFactory {
    static createTestMessages(count = 5) {
        const messages = [];
        const userPrompts = [
            'Help me set a fitness goal',
            'I feel unmotivated about exercising',
            'How can I stay consistent with my habits?',
            'I want to improve my productivity',
            'Help me manage stress better'
        ];
        const assistantResponses = [
            'I can help you create a SMART fitness goal...',
            'Low motivation is common. Let\'s find what inspires you...',
            'Consistency comes from building small, sustainable habits...',
            'Productivity improvement starts with understanding your peak hours...',
            'Stress management involves both mental and physical strategies...'
        ];
        for (let i = 0; i < count; i++) {
            if (i % 2 === 0) {
                messages.push({
                    role: 'user',
                    content: userPrompts[i % userPrompts.length]
                });
            }
            else {
                messages.push({
                    role: 'assistant',
                    content: assistantResponses[Math.floor(i / 2) % assistantResponses.length]
                });
            }
        }
        return messages;
    }
    static createDeviceProfile(type) {
        const profiles = {
            'high-end': {
                model: 'iPhone 15 Pro',
                batteryLevel: 85,
                thermalState: 'nominal',
                availableMemory: 8 * 1024 * 1024 * 1024,
                processingPower: 'high'
            },
            'mid-range': {
                model: 'iPhone 12',
                batteryLevel: 50,
                thermalState: 'fair',
                availableMemory: 4 * 1024 * 1024 * 1024,
                processingPower: 'medium'
            },
            'low-end': {
                model: 'iPhone SE',
                batteryLevel: 25,
                thermalState: 'critical',
                availableMemory: 3 * 1024 * 1024 * 1024,
                processingPower: 'low'
            }
        };
        return profiles[type];
    }
}
exports.LocalLLMTestDataFactory = LocalLLMTestDataFactory;
exports.performanceAssertions = {
    expectLatencyUnder(actualMs, thresholdMs, testName) {
        if (actualMs > thresholdMs) {
            throw new Error(`Performance assertion failed for ${testName}: ` +
                `Expected latency under ${thresholdMs}ms, got ${actualMs}ms`);
        }
    },
    expectQualityAbove(actualScore, threshold, testName) {
        if (actualScore < threshold) {
            throw new Error(`Quality assertion failed for ${testName}: ` +
                `Expected quality above ${threshold}, got ${actualScore}`);
        }
    },
    expectMemoryUsageUnder(actualMB, thresholdMB, testName) {
        if (actualMB > thresholdMB) {
            throw new Error(`Memory assertion failed for ${testName}: ` +
                `Expected memory under ${thresholdMB}MB, got ${actualMB}MB`);
        }
    }
};
beforeEach(() => {
    global.localLLMTestState = {
        modelCache: new Map(),
        performanceMetrics: new Map(),
        qualityMetrics: new Map(),
        testStartTime: perf_hooks_1.performance.now()
    };
    global.performanceTracker = new PerformanceTracker();
    global.mockLocalLLMService = MockLocalLLMService;
});
afterEach(() => {
    global.performanceTracker?.clear();
    global.localLLMTestState?.modelCache.clear();
    const testDuration = perf_hooks_1.performance.now() - global.localLLMTestState?.testStartTime;
    if (testDuration > 10000) {
        console.warn(`Long-running test detected: ${testDuration}ms`);
    }
});
process.on('unhandledRejection', (reason, promise) => {
    if (reason && typeof reason === 'object' && 'message' in reason) {
        const message = reason.message;
        if (message.includes('model') || message.includes('inference')) {
            console.error('Local LLM model error:', reason);
            return;
        }
    }
    throw reason;
});
//# sourceMappingURL=local-llm-setup.js.map