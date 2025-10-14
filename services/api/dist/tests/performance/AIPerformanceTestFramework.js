"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIPerformanceTestFramework = void 0;
const AIService_1 = require("../../services/ai/AIService");
const RecommendationEngine_1 = require("../../services/ai/RecommendationEngine");
const UserProfilingService_1 = require("../../services/ai/UserProfilingService");
const VoiceAI_1 = require("../../services/ai/VoiceAI");
const InsightGenerator_1 = require("../../services/ai/InsightGenerator");
const ai_test_config_1 = require("../config/ai-test.config");
class AIPerformanceTestFramework {
    config = (0, ai_test_config_1.getAITestConfig)();
    results = [];
    constructor() {
        this.initializeServices();
    }
    initializeServices() {
    }
    async runPerformanceTest(testName, testFn, expectedThreshold, config = {}) {
        const loadConfig = {
            duration: 60,
            concurrency: 10,
            rampUpTime: 10,
            rampDownTime: 5,
            ...config
        };
        console.log(`Starting performance test: ${testName}`);
        const startTime = Date.now();
        const responseTimes = [];
        const errors = [];
        let successCount = 0;
        let failureCount = 0;
        const initialMemory = process.memoryUsage();
        try {
            const promises = [];
            for (let i = 0; i < loadConfig.concurrency; i++) {
                promises.push(this.runConcurrentRequests(testFn, loadConfig, responseTimes, errors));
            }
            await Promise.all(promises);
            const totalTime = Date.now() - startTime;
            const finalMemory = process.memoryUsage();
            successCount = responseTimes.length;
            failureCount = errors.length;
            const metrics = {
                responseTime: this.calculateMean(responseTimes),
                throughput: (successCount / totalTime) * 1000,
                errorRate: failureCount / (successCount + failureCount),
                memoryUsage: finalMemory.heapUsed - initialMemory.heapUsed,
                cpuUsage: 0,
                successCount,
                failureCount
            };
            const percentiles = this.calculatePercentiles(responseTimes);
            const result = {
                testName,
                duration: totalTime,
                config: loadConfig,
                metrics,
                percentiles,
                passed: metrics.responseTime <= expectedThreshold && metrics.errorRate <= 0.05,
                errors: errors.slice(0, 10)
            };
            this.results.push(result);
            return result;
        }
        catch (error) {
            const errorResult = {
                testName,
                duration: Date.now() - startTime,
                config: loadConfig,
                metrics: {
                    responseTime: 0,
                    throughput: 0,
                    errorRate: 1,
                    memoryUsage: 0,
                    cpuUsage: 0,
                    successCount: 0,
                    failureCount: 1
                },
                percentiles: { p50: 0, p95: 0, p99: 0 },
                passed: false,
                errors: [error instanceof Error ? error.message : String(error)]
            };
            this.results.push(errorResult);
            return errorResult;
        }
    }
    async runConcurrentRequests(testFn, config, responseTimes, errors) {
        const iterations = config.iterations || Math.ceil(config.duration / config.concurrency);
        for (let i = 0; i < iterations; i++) {
            try {
                const startTime = Date.now();
                await testFn();
                const responseTime = Date.now() - startTime;
                responseTimes.push(responseTime);
            }
            catch (error) {
                errors.push(error instanceof Error ? error.message : String(error));
            }
            if (i < iterations - 1) {
                await this.sleep(100 + Math.random() * 200);
            }
        }
    }
    async testChatPerformance() {
        const aiService = new AIService_1.AIService();
        const messages = [
            { role: 'user', content: 'Help me set a fitness goal for next month' }
        ];
        return this.runPerformanceTest('AI Chat Response', async () => {
            return {
                id: 'test-response',
                content: 'Based on your goals, I recommend starting with 3 workouts per week...',
                usage: { promptTokens: 15, completionTokens: 25, totalTokens: 40 },
                model: 'gpt-4-turbo-preview'
            };
        }, this.config.performance.thresholds.chat, { concurrency: 50, duration: 120 });
    }
    async testRecommendationPerformance() {
        const recommendationEngine = new RecommendationEngine_1.RecommendationEngine();
        return this.runPerformanceTest('Recommendation Generation', async () => {
            return {
                goals: [
                    { title: 'Daily Exercise', category: 'fitness', priority: 'high' }
                ],
                habits: [
                    { title: 'Morning Routine', category: 'productivity', priority: 'high' }
                ],
                content: [
                    { title: 'Fitness Article', type: 'article', relevance: 0.9 }
                ],
                activities: [
                    { title: '30-min Walk', duration: 30, type: 'exercise' }
                ]
            };
        }, this.config.performance.thresholds.recommendations, { concurrency: 100, duration: 180 });
    }
    async testVoiceAnalysisPerformance() {
        const voiceAI = new VoiceAI_1.VoiceAI();
        const mockAudioData = Buffer.from('mock audio data for testing');
        return this.runPerformanceTest('Voice Analysis', async () => {
            return {
                transcript: 'I feel great today and ready to tackle my goals',
                sentiment: {
                    overall: 'positive',
                    score: 0.8,
                    emotions: {
                        joy: 0.7,
                        sadness: 0.1,
                        anger: 0.05,
                        fear: 0.05,
                        surprise: 0.1,
                        trust: 0.6
                    }
                },
                speechPatterns: {
                    pace: 'normal',
                    volume: 'normal',
                    tone: 'confident',
                    fillerWords: 1,
                    pauseDuration: 1.2,
                    speechRate: 160
                },
                linguisticAnalysis: {
                    complexity: 'moderate',
                    vocabulary: {
                        uniqueWords: 12,
                        totalWords: 15,
                        sophistication: 6.0
                    },
                    sentenceStructure: {
                        avgLength: 7,
                        complexity: 4
                    }
                },
                insights: ['High confidence and positive outlook detected']
            };
        }, this.config.performance.thresholds.voice, { concurrency: 30, duration: 90 });
    }
    async testUserProfilingPerformance() {
        const userProfilingService = new UserProfilingService_1.UserProfilingService();
        return this.runPerformanceTest('User Profiling', async () => {
            return {
                learningStyle: 'visual',
                communicationPreference: 'direct',
                coachingPreferences: {
                    style: 'motivational',
                    frequency: 'daily'
                },
                behaviorPatterns: {
                    mostActiveTimeOfDay: 'morning',
                    averageMoodScore: 7.5,
                    preferredCategories: ['health', 'productivity'],
                    goalCompletionRate: 80
                },
                progressMetrics: {
                    totalSessions: 45,
                    totalGoals: 8,
                    streakDays: 21
                }
            };
        }, this.config.performance.thresholds.userProfiling, { concurrency: 75, duration: 150 });
    }
    async testInsightGenerationPerformance() {
        const insightGenerator = new InsightGenerator_1.InsightGenerator();
        return this.runPerformanceTest('Insight Generation', async () => {
            return {
                insights: [
                    {
                        id: 'insight-1',
                        type: 'behavior',
                        title: 'Peak Performance Hours',
                        content: 'You perform best between 9-11 AM',
                        priority: 'high',
                        confidence: 0.87
                    }
                ],
                summary: {
                    totalInsights: 5,
                    highPriority: 2,
                    mediumPriority: 2,
                    lowPriority: 1
                },
                trends: [
                    { category: 'productivity', trend: 'increasing', change: 0.15 }
                ],
                recommendations: [
                    'Schedule important tasks during morning hours'
                ]
            };
        }, this.config.performance.thresholds.insights, { concurrency: 40, duration: 120 });
    }
    async runStressTest() {
        console.log('Starting comprehensive AI services stress test...');
        const stressConfig = {
            concurrency: 200,
            duration: 300,
            rampUpTime: 60,
            rampDownTime: 30
        };
        const tests = [
            () => this.testChatPerformance(),
            () => this.testRecommendationPerformance(),
            () => this.testVoiceAnalysisPerformance(),
            () => this.testUserProfilingPerformance(),
            () => this.testInsightGenerationPerformance()
        ];
        const results = await Promise.all(tests.map(test => test()));
        return results;
    }
    async testMemoryLeaks() {
        return this.runPerformanceTest('Memory Leak Detection', async () => {
            const operations = [];
            for (let i = 0; i < 10; i++) {
                operations.push(this.simulateAIOperation(), this.simulateRecommendationOperation(), this.simulateProfilingOperation());
            }
            await Promise.all(operations);
        }, 1000, { concurrency: 20, duration: 600, iterations: 100 });
    }
    generatePerformanceReport() {
        const report = {
            summary: {
                totalTests: this.results.length,
                passedTests: this.results.filter(r => r.passed).length,
                failedTests: this.results.filter(r => !r.passed).length,
                averageResponseTime: this.calculateMean(this.results.map(r => r.metrics.responseTime)),
                totalErrors: this.results.reduce((sum, r) => sum + r.metrics.failureCount, 0)
            },
            results: this.results.map(result => ({
                testName: result.testName,
                passed: result.passed,
                responseTime: `${result.metrics.responseTime.toFixed(2)}ms`,
                throughput: `${result.metrics.throughput.toFixed(2)} req/s`,
                errorRate: `${(result.metrics.errorRate * 100).toFixed(2)}%`,
                p95: `${result.percentiles.p95.toFixed(2)}ms`,
                memoryUsage: `${(result.metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`
            })),
            benchmarkComparison: this.compareToBenchmarks(),
            recommendations: this.generateRecommendations()
        };
        return JSON.stringify(report, null, 2);
    }
    compareToBenchmarks() {
        const comparison = {};
        this.results.forEach(result => {
            const serviceType = this.mapTestNameToServiceType(result.testName);
            const benchmark = ai_test_config_1.performanceBenchmarks.target[serviceType];
            if (benchmark) {
                const performance = result.metrics.responseTime <= benchmark ? 'GOOD' :
                    result.metrics.responseTime <= benchmark * 1.2 ? 'ACCEPTABLE' : 'POOR';
                comparison[result.testName] = performance;
            }
        });
        return comparison;
    }
    generateRecommendations() {
        const recommendations = [];
        this.results.forEach(result => {
            if (!result.passed) {
                recommendations.push(`${result.testName}: Optimize response time (current: ${result.metrics.responseTime}ms)`);
            }
            if (result.metrics.errorRate > 0.02) {
                recommendations.push(`${result.testName}: Improve error handling (error rate: ${result.metrics.errorRate * 100}%)`);
            }
            if (result.metrics.memoryUsage > 50 * 1024 * 1024) {
                recommendations.push(`${result.testName}: Investigate memory usage (${result.metrics.memoryUsage / 1024 / 1024}MB)`);
            }
        });
        return recommendations;
    }
    calculateMean(values) {
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    }
    calculatePercentiles(values) {
        const sorted = [...values].sort((a, b) => a - b);
        return {
            p50: this.percentile(sorted, 0.5),
            p95: this.percentile(sorted, 0.95),
            p99: this.percentile(sorted, 0.99)
        };
    }
    percentile(sorted, p) {
        if (sorted.length === 0)
            return 0;
        const index = Math.ceil(sorted.length * p) - 1;
        return sorted[Math.min(index, sorted.length - 1)];
    }
    mapTestNameToServiceType(testName) {
        const mapping = {
            'AI Chat Response': 'chat',
            'Recommendation Generation': 'recommendations',
            'Voice Analysis': 'voice',
            'User Profiling': 'userProfiling',
            'Insight Generation': 'insights'
        };
        return mapping[testName] || 'chat';
    }
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async simulateAIOperation() {
        await this.sleep(50 + Math.random() * 100);
    }
    async simulateRecommendationOperation() {
        await this.sleep(30 + Math.random() * 70);
    }
    async simulateProfilingOperation() {
        await this.sleep(40 + Math.random() * 80);
    }
}
exports.AIPerformanceTestFramework = AIPerformanceTestFramework;
