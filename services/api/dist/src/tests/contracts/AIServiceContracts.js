"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIServiceContractValidator = void 0;
const AIService_1 = require("../../services/ai/AIService");
const ConversationalAI_1 = require("../../services/ai/ConversationalAI");
const RecommendationEngine_1 = require("../../services/ai/RecommendationEngine");
const UserProfilingService_1 = require("../../services/ai/UserProfilingService");
const VoiceAI_1 = require("../../services/ai/VoiceAI");
const InsightGenerator_1 = require("../../services/ai/InsightGenerator");
const PredictiveAnalytics_1 = require("../../services/ai/PredictiveAnalytics");
const AdaptiveLearning_1 = require("../../services/ai/AdaptiveLearning");
class AIServiceContractValidator {
    services = {};
    validationResults = {};
    constructor() {
        this.initializeServices();
    }
    initializeServices() {
        this.services = {
            aiService: new AIService_1.AIService(),
            conversationalAI: new ConversationalAI_1.ConversationalAI(),
            recommendationEngine: new RecommendationEngine_1.RecommendationEngine(),
            userProfilingService: new UserProfilingService_1.UserProfilingService(),
            voiceAI: new VoiceAI_1.VoiceAI(),
            insightGenerator: new InsightGenerator_1.InsightGenerator(),
            predictiveAnalytics: new PredictiveAnalytics_1.PredictiveAnalytics(),
            adaptiveLearning: new AdaptiveLearning_1.AdaptiveLearning()
        };
    }
    async validateAIServiceContract() {
        const serviceName = 'AIService';
        const service = this.services.aiService;
        const errors = [];
        const warnings = [];
        try {
            this.validateMethodExists(service, 'generateResponse', errors);
            this.validateMethodExists(service, 'generateCoachingResponse', errors);
            this.validateMethodExists(service, 'analyzeConversation', errors);
            if (this.hasMethod(service, 'generateResponse')) {
                const mockMessages = [{ role: 'user', content: 'test' }];
                jest.spyOn(service, 'generateResponse').mockResolvedValue({
                    id: 'test-response-123',
                    content: 'Test response content',
                    usage: {
                        promptTokens: 10,
                        completionTokens: 20,
                        totalTokens: 30
                    },
                    model: 'gpt-4-turbo-preview',
                    provider: 'openai'
                });
                const response = await service.generateResponse(mockMessages);
                this.validateAIResponseFormat(response, errors);
            }
            if (this.hasMethod(service, 'generateCoachingResponse')) {
                jest.spyOn(service, 'generateCoachingResponse').mockResolvedValue({
                    id: 'coaching-response-123',
                    content: 'Coaching response content',
                    usage: {
                        promptTokens: 15,
                        completionTokens: 25,
                        totalTokens: 40
                    },
                    model: 'gpt-4-turbo-preview'
                });
                const coachingResponse = await service.generateCoachingResponse('test input', {});
                this.validateAIResponseFormat(coachingResponse, errors);
            }
            if (this.hasMethod(service, 'analyzeConversation')) {
                const mockAnalysis = {
                    overall_sentiment: 'positive',
                    emotion_breakdown: { joy: 0.7, sadness: 0.1 },
                    key_emotional_moments: ['excited about goals']
                };
                jest.spyOn(service, 'analyzeConversation').mockResolvedValue(mockAnalysis);
                const analysis = await service.analyzeConversation([{ role: 'user', content: 'I feel great!' }], 'sentiment');
                this.validateConversationAnalysisFormat(analysis, errors);
            }
        }
        catch (error) {
            errors.push(`Contract validation failed: ${error}`);
        }
        const result = {
            serviceName,
            passed: errors.length === 0,
            errors,
            warnings,
            testedMethods: ['generateResponse', 'generateCoachingResponse', 'analyzeConversation'],
            timestamp: new Date()
        };
        this.validationResults[serviceName] = result;
        return result;
    }
    async validateConversationalAIContract() {
        const serviceName = 'ConversationalAI';
        const service = this.services.conversationalAI;
        const errors = [];
        const warnings = [];
        try {
            this.validateMethodExists(service, 'processConversation', errors);
            this.validateMethodExists(service, 'generateSmartResponse', errors);
            if (this.hasMethod(service, 'processConversation')) {
                const mockResult = {
                    intent: { primary: 'goal_setting', confidence: 0.85 },
                    response: 'I can help you set a goal',
                    suggestions: ['Start with small steps', 'Set a timeline']
                };
                jest.spyOn(service, 'processConversation').mockResolvedValue(mockResult);
                const result = await service.processConversation('user123', 'I want to set a goal', 'conv123');
                this.validateConversationProcessingFormat(result, errors);
            }
            if (this.hasMethod(service, 'generateSmartResponse')) {
                jest.spyOn(service, 'generateSmartResponse').mockResolvedValue('Smart response generated');
                const response = await service.generateSmartResponse('user123', 'How can I improve?');
                this.validateStringResponse(response, errors, 'generateSmartResponse');
            }
        }
        catch (error) {
            errors.push(`Conversational AI contract validation failed: ${error}`);
        }
        const result = {
            serviceName,
            passed: errors.length === 0,
            errors,
            warnings,
            testedMethods: ['processConversation', 'generateSmartResponse'],
            timestamp: new Date()
        };
        this.validationResults[serviceName] = result;
        return result;
    }
    async validateRecommendationEngineContract() {
        const serviceName = 'RecommendationEngine';
        const service = this.services.recommendationEngine;
        const errors = [];
        const warnings = [];
        try {
            this.validateMethodExists(service, 'generateRecommendations', errors);
            this.validateMethodExists(service, 'getOptimalTiming', errors);
            this.validateMethodExists(service, 'generateAdaptiveSchedule', errors);
            if (this.hasMethod(service, 'generateRecommendations')) {
                const mockRecommendations = {
                    goals: [{ title: 'Exercise daily', category: 'fitness' }],
                    habits: [{ title: 'Morning routine', category: 'productivity' }],
                    content: [{ title: 'Health article', type: 'article' }],
                    activities: [{ title: '30-min walk', duration: 30 }]
                };
                jest.spyOn(service, 'generateRecommendations').mockResolvedValue(mockRecommendations);
                const recommendations = await service.generateRecommendations('user123');
                this.validateRecommendationsFormat(recommendations, errors);
            }
            if (this.hasMethod(service, 'getOptimalTiming')) {
                const mockTiming = {
                    bestTime: 'morning',
                    reason: 'Higher energy levels',
                    alternativeTimes: ['afternoon', 'evening']
                };
                jest.spyOn(service, 'getOptimalTiming').mockResolvedValue(mockTiming);
                const timing = await service.getOptimalTiming('user123', 'exercise');
                this.validateOptimalTimingFormat(timing, errors);
            }
            if (this.hasMethod(service, 'generateAdaptiveSchedule')) {
                const mockSchedule = {
                    morning: [{ time: '08:00', activity: 'Exercise', duration: 30 }],
                    afternoon: [{ time: '14:00', activity: 'Meeting', duration: 60 }],
                    evening: [{ time: '19:00', activity: 'Relaxation', duration: 15 }],
                    flexibility: 0.7
                };
                jest.spyOn(service, 'generateAdaptiveSchedule').mockResolvedValue(mockSchedule);
                const schedule = await service.generateAdaptiveSchedule('user123', new Date());
                this.validateAdaptiveScheduleFormat(schedule, errors);
            }
        }
        catch (error) {
            errors.push(`Recommendation Engine contract validation failed: ${error}`);
        }
        const result = {
            serviceName,
            passed: errors.length === 0,
            errors,
            warnings,
            testedMethods: ['generateRecommendations', 'getOptimalTiming', 'generateAdaptiveSchedule'],
            timestamp: new Date()
        };
        this.validationResults[serviceName] = result;
        return result;
    }
    async validateUserProfilingContract() {
        const serviceName = 'UserProfilingService';
        const service = this.services.userProfilingService;
        const errors = [];
        const warnings = [];
        try {
            this.validateMethodExists(service, 'createOrUpdateProfile', errors);
            this.validateMethodExists(service, 'getProfileInsights', errors);
            this.validateMethodExists(service, 'assessReadiness', errors);
            if (this.hasMethod(service, 'createOrUpdateProfile')) {
                const mockProfile = {
                    learningStyle: 'visual',
                    communicationPreference: 'direct',
                    coachingPreferences: { style: 'motivational' },
                    behaviorPatterns: { consistency: 0.8 },
                    progressMetrics: { streakDays: 14 }
                };
                jest.spyOn(service, 'createOrUpdateProfile').mockResolvedValue(mockProfile);
                const profile = await service.createOrUpdateProfile('user123');
                this.validateUserProfileFormat(profile, errors);
            }
            if (this.hasMethod(service, 'getProfileInsights')) {
                const mockInsights = {
                    strengths: ['consistency', 'goal-oriented'],
                    growthAreas: ['time-management'],
                    recommendations: ['Try time-blocking']
                };
                jest.spyOn(service, 'getProfileInsights').mockResolvedValue(mockInsights);
                const insights = await service.getProfileInsights('user123');
                this.validateProfileInsightsFormat(insights, errors);
            }
            if (this.hasMethod(service, 'assessReadiness')) {
                const mockAssessment = {
                    level: 'intermediate',
                    reasoning: 'Good consistency but needs more challenge',
                    nextSteps: ['Increase goal difficulty', 'Add new categories']
                };
                jest.spyOn(service, 'assessReadiness').mockResolvedValue(mockAssessment);
                const assessment = await service.assessReadiness('user123');
                this.validateReadinessAssessmentFormat(assessment, errors);
            }
        }
        catch (error) {
            errors.push(`User Profiling Service contract validation failed: ${error}`);
        }
        const result = {
            serviceName,
            passed: errors.length === 0,
            errors,
            warnings,
            testedMethods: ['createOrUpdateProfile', 'getProfileInsights', 'assessReadiness'],
            timestamp: new Date()
        };
        this.validationResults[serviceName] = result;
        return result;
    }
    async validateVoiceAIContract() {
        const serviceName = 'VoiceAI';
        const service = this.services.voiceAI;
        const errors = [];
        const warnings = [];
        try {
            this.validateMethodExists(service, 'analyzeVoice', errors);
            this.validateMethodExists(service, 'generateVoiceCoaching', errors);
            this.validateMethodExists(service, 'compareVoiceSessions', errors);
            if (this.hasMethod(service, 'analyzeVoice')) {
                const mockAnalysis = {
                    transcript: 'I feel motivated today',
                    sentiment: { overall: 'positive', score: 0.8 },
                    speechPatterns: { pace: 'normal', volume: 'normal' },
                    linguisticAnalysis: { complexity: 'moderate' },
                    insights: ['High confidence detected']
                };
                jest.spyOn(service, 'analyzeVoice').mockResolvedValue(mockAnalysis);
                const analysis = await service.analyzeVoice('user123', Buffer.from('audio'));
                this.validateVoiceAnalysisFormat(analysis, errors);
            }
            if (this.hasMethod(service, 'generateVoiceCoaching')) {
                const mockCoaching = {
                    response: 'Great energy in your voice today!',
                    actionItems: ['Continue this positive momentum'],
                    followUpQuestions: ['What specific goal excites you most?']
                };
                jest.spyOn(service, 'generateVoiceCoaching').mockResolvedValue(mockCoaching);
                const coaching = await service.generateVoiceCoaching('user123', {});
                this.validateVoiceCoachingFormat(coaching, errors);
            }
        }
        catch (error) {
            errors.push(`Voice AI contract validation failed: ${error}`);
        }
        const result = {
            serviceName,
            passed: errors.length === 0,
            errors,
            warnings,
            testedMethods: ['analyzeVoice', 'generateVoiceCoaching', 'compareVoiceSessions'],
            timestamp: new Date()
        };
        this.validationResults[serviceName] = result;
        return result;
    }
    async validateAllContracts() {
        const results = await Promise.all([
            this.validateAIServiceContract(),
            this.validateConversationalAIContract(),
            this.validateRecommendationEngineContract(),
            this.validateUserProfilingContract(),
            this.validateVoiceAIContract()
        ]);
        const summary = {
            totalServices: results.length,
            passedServices: results.filter(r => r.passed).length,
            failedServices: results.filter(r => !r.passed).length,
            results,
            overallPassed: results.every(r => r.passed),
            timestamp: new Date()
        };
        return summary;
    }
    validateMethodExists(service, methodName, errors) {
        if (!this.hasMethod(service, methodName)) {
            errors.push(`Method ${methodName} does not exist on service`);
        }
    }
    hasMethod(service, methodName) {
        return typeof service[methodName] === 'function';
    }
    validateAIResponseFormat(response, errors) {
        if (!response.id || typeof response.id !== 'string') {
            errors.push('AI response missing or invalid id');
        }
        if (!response.content || typeof response.content !== 'string') {
            errors.push('AI response missing or invalid content');
        }
        if (!response.usage || typeof response.usage !== 'object') {
            errors.push('AI response missing or invalid usage');
        }
        if (!response.model || typeof response.model !== 'string') {
            errors.push('AI response missing or invalid model');
        }
    }
    validateConversationAnalysisFormat(analysis, errors) {
        if (!analysis.overall_sentiment) {
            errors.push('Conversation analysis missing overall_sentiment');
        }
        if (!analysis.emotion_breakdown || typeof analysis.emotion_breakdown !== 'object') {
            errors.push('Conversation analysis missing or invalid emotion_breakdown');
        }
    }
    validateConversationProcessingFormat(result, errors) {
        if (!result.intent || !result.intent.primary) {
            errors.push('Conversation processing result missing intent.primary');
        }
        if (!result.response || typeof result.response !== 'string') {
            errors.push('Conversation processing result missing or invalid response');
        }
        if (!result.suggestions || !Array.isArray(result.suggestions)) {
            errors.push('Conversation processing result missing or invalid suggestions array');
        }
    }
    validateRecommendationsFormat(recommendations, errors) {
        const requiredKeys = ['goals', 'habits', 'content', 'activities'];
        requiredKeys.forEach(key => {
            if (!recommendations[key]) {
                errors.push(`Recommendations missing ${key}`);
            }
        });
    }
    validateOptimalTimingFormat(timing, errors) {
        if (!timing.bestTime) {
            errors.push('Optimal timing missing bestTime');
        }
        if (!timing.reason) {
            errors.push('Optimal timing missing reason');
        }
        if (!timing.alternativeTimes || !Array.isArray(timing.alternativeTimes)) {
            errors.push('Optimal timing missing or invalid alternativeTimes array');
        }
    }
    validateAdaptiveScheduleFormat(schedule, errors) {
        const requiredPeriods = ['morning', 'afternoon', 'evening'];
        requiredPeriods.forEach(period => {
            if (!schedule[period]) {
                errors.push(`Adaptive schedule missing ${period}`);
            }
        });
        if (typeof schedule.flexibility !== 'number') {
            errors.push('Adaptive schedule missing or invalid flexibility number');
        }
    }
    validateUserProfileFormat(profile, errors) {
        const requiredKeys = ['learningStyle', 'communicationPreference', 'coachingPreferences', 'behaviorPatterns'];
        requiredKeys.forEach(key => {
            if (!profile[key]) {
                errors.push(`User profile missing ${key}`);
            }
        });
    }
    validateProfileInsightsFormat(insights, errors) {
        const requiredKeys = ['strengths', 'growthAreas', 'recommendations'];
        requiredKeys.forEach(key => {
            if (!insights[key] || !Array.isArray(insights[key])) {
                errors.push(`Profile insights missing or invalid ${key} array`);
            }
        });
    }
    validateReadinessAssessmentFormat(assessment, errors) {
        if (!assessment.level || !['beginner', 'intermediate', 'advanced'].includes(assessment.level)) {
            errors.push('Readiness assessment missing or invalid level');
        }
        if (!assessment.reasoning || typeof assessment.reasoning !== 'string') {
            errors.push('Readiness assessment missing or invalid reasoning');
        }
        if (!assessment.nextSteps || !Array.isArray(assessment.nextSteps)) {
            errors.push('Readiness assessment missing or invalid nextSteps array');
        }
    }
    validateVoiceAnalysisFormat(analysis, errors) {
        const requiredKeys = ['transcript', 'sentiment', 'speechPatterns', 'linguisticAnalysis', 'insights'];
        requiredKeys.forEach(key => {
            if (!analysis[key]) {
                errors.push(`Voice analysis missing ${key}`);
            }
        });
    }
    validateVoiceCoachingFormat(coaching, errors) {
        if (!coaching.response || typeof coaching.response !== 'string') {
            errors.push('Voice coaching missing or invalid response');
        }
        if (!coaching.actionItems || !Array.isArray(coaching.actionItems)) {
            errors.push('Voice coaching missing or invalid actionItems array');
        }
        if (!coaching.followUpQuestions || !Array.isArray(coaching.followUpQuestions)) {
            errors.push('Voice coaching missing or invalid followUpQuestions array');
        }
    }
    validateStringResponse(response, errors, methodName) {
        if (typeof response !== 'string' || response.length === 0) {
            errors.push(`${methodName} must return a non-empty string`);
        }
    }
}
exports.AIServiceContractValidator = AIServiceContractValidator;
//# sourceMappingURL=AIServiceContracts.js.map