"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AIController_1 = require("../controllers/ai/AIController");
const UserProfilingController_1 = require("../controllers/ai/UserProfilingController");
const LocalLLMController_1 = require("../controllers/ai/LocalLLMController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const aiInputValidation_1 = require("../middleware/aiInputValidation");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = (0, express_1.Router)();
const aiRateLimiter = (0, rateLimiter_1.createRateLimiter)({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'AI service rate limit exceeded. Please wait before making more requests.',
    useFingerprint: true,
});
const localLLMRateLimiter = (0, rateLimiter_1.createRateLimiter)({
    windowMs: 5 * 60 * 1000,
    max: 100,
    message: 'Local LLM rate limit exceeded. Please wait before making more requests.',
    useFingerprint: true,
});
const conversationRateLimiter = (0, rateLimiter_1.createRateLimiter)({
    windowMs: 5 * 60 * 1000,
    max: 20,
    message: 'Too many conversation requests. Please wait before sending more messages.',
    useFingerprint: true,
});
const voiceRateLimiter = (0, rateLimiter_1.createRateLimiter)({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Voice processing limit reached. Please wait before uploading more audio.',
    useFingerprint: true,
});
router.get('/profile', auth_1.authenticate, aiRateLimiter, UserProfilingController_1.userProfilingController.getProfile);
router.get('/profile/:userId', auth_1.authenticate, aiRateLimiter, UserProfilingController_1.userProfilingController.getProfile);
router.put('/profile/preferences', auth_1.authenticate, aiRateLimiter, UserProfilingController_1.userProfilingController.updatePreferences);
router.post('/profile/refresh', auth_1.authenticate, aiRateLimiter, UserProfilingController_1.userProfilingController.refreshProfile);
router.get('/profile/insights', auth_1.authenticate, aiRateLimiter, UserProfilingController_1.userProfilingController.getInsights);
router.get('/profile/insights/:userId', auth_1.authenticate, aiRateLimiter, UserProfilingController_1.userProfilingController.getInsights);
router.get('/assessment/readiness', auth_1.authenticate, aiRateLimiter, UserProfilingController_1.userProfilingController.assessReadiness);
router.get('/assessment/readiness/:userId', auth_1.authenticate, aiRateLimiter, UserProfilingController_1.userProfilingController.assessReadiness);
router.get('/recommendations', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.getRecommendations);
router.get('/recommendations/:userId', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.getRecommendations);
router.get('/recommendations/timing/:activityType', auth_1.authenticate, aiRateLimiter, aiInputValidation_1.sanitizeParams, AIController_1.aiController.getOptimalTiming);
router.get('/recommendations/schedule', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.getAdaptiveSchedule);
router.post('/conversation/process', auth_1.authenticate, conversationRateLimiter, aiInputValidation_1.validateConversationInput, AIController_1.aiController.processMessage);
router.post('/conversation/smart-response', auth_1.authenticate, conversationRateLimiter, aiInputValidation_1.validateConversationInput, AIController_1.aiController.generateSmartResponse);
router.get('/predictions', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.getPredictions);
router.get('/predictions/:userId', auth_1.authenticate, aiRateLimiter, aiInputValidation_1.sanitizeParams, AIController_1.aiController.getPredictions);
router.get('/predictions/goal/:goalId', auth_1.authenticate, aiRateLimiter, aiInputValidation_1.sanitizeParams, AIController_1.aiController.predictGoalCompletion);
router.get('/predictions/intervention/:riskType', auth_1.authenticate, aiRateLimiter, aiInputValidation_1.sanitizeParams, AIController_1.aiController.getInterventionPlan);
router.post('/learning/path', auth_1.authenticate, aiRateLimiter, aiInputValidation_1.validateLearningPathInput, AIController_1.aiController.createLearningPath);
router.get('/learning/paths', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.getLearningPaths);
router.post('/learning/path/:pathId/module/:moduleId/progress', auth_1.authenticate, aiRateLimiter, aiInputValidation_1.sanitizeParams, aiInputValidation_1.validateGeneralAIInput, AIController_1.aiController.trackLearningProgress);
router.get('/learning/path/:pathId/next-module', auth_1.authenticate, aiRateLimiter, aiInputValidation_1.sanitizeParams, AIController_1.aiController.getNextModule);
router.post('/voice/analyze', auth_1.authenticate, voiceRateLimiter, aiInputValidation_1.validateVoiceInput, upload_1.default.single('audio'), AIController_1.aiController.analyzeVoice);
router.post('/voice/coaching', auth_1.authenticate, voiceRateLimiter, aiInputValidation_1.validateGeneralAIInput, AIController_1.aiController.getVoiceCoaching);
router.get('/voice/insights', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.getVoiceInsights);
router.get('/voice/compare/:sessionId1/:sessionId2', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.compareVoiceSessions);
router.get('/insights/report', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.getInsightReport);
router.get('/insights/report/:userId', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.getInsightReport);
router.get('/insights/active', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.getActiveInsights);
router.post('/insights/:insightId/dismiss', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.dismissInsight);
router.get('/local-llm/status', auth_1.authenticate, localLLMRateLimiter, LocalLLMController_1.localLLMController.getStatus);
router.get('/local-llm/models', auth_1.authenticate, localLLMRateLimiter, LocalLLMController_1.localLLMController.getAvailableModels);
router.post('/local-llm/generate', auth_1.authenticate, localLLMRateLimiter, aiInputValidation_1.validateConversationInput, LocalLLMController_1.localLLMController.generateResponse);
router.post('/local-llm/initialize', auth_1.authenticate, aiRateLimiter, LocalLLMController_1.localLLMController.initializeModel);
router.get('/local-llm/health', LocalLLMController_1.localLLMController.healthCheck);
router.get('/local-llm/metrics', auth_1.authenticate, localLLMRateLimiter, LocalLLMController_1.localLLMController.getMetrics);
router.post('/hybrid/generate', auth_1.authenticate, aiRateLimiter, aiInputValidation_1.validateConversationInput, AIController_1.aiController.hybridGenerate);
router.get('/hybrid/routing-decision', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.getRoutingDecision);
router.get('/personalization/preferences', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.getPersonalizationPreferences);
router.post('/personalization/update', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.updatePersonalization);
router.get('/personalization/content-recommendations', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.getPersonalizedContent);
router.get('/personalization/coaching-strategy', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.getCoachingStrategy);
router.get('/analytics/behavior-patterns', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.getBehaviorPatterns);
router.get('/analytics/engagement-metrics', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.getEngagementMetrics);
router.get('/analytics/success-factors', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.getSuccessFactors);
router.post('/analytics/track-event', auth_1.authenticate, aiRateLimiter, AIController_1.aiController.trackAnalyticsEvent);
exports.default = router;
//# sourceMappingURL=ai.js.map