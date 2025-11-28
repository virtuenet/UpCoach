import { Router } from 'express';

import { aiController } from '../controllers/ai';
import { dailyPulseController } from '../controllers/ai/DailyPulseController';
import { companionChatController } from '../controllers/ai/CompanionChatController';
import { userProfilingController } from '../controllers/ai/UserProfilingController';
import { localLLMController } from '../controllers/ai/LocalLLMController';
import { authenticate } from '../middleware/auth';
import { createRateLimiter, intelligentRateLimiter } from '../middleware/rateLimiter';
import {
  validateConversationInput,
  validateVoiceInput,
  validateLearningPathInput,
  validateGeneralAIInput,
  sanitizeParams
} from '../middleware/aiInputValidation';
import upload from '../middleware/upload';

const router = Router();

// AI-specific rate limiter - more restrictive for AI endpoints
const aiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 AI requests per 15 minutes per user
  message: 'AI service rate limit exceeded. Please wait before making more requests.',
  useFingerprint: true,
});

// Local LLM specific rate limiter - more generous for local processing
const localLLMRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // 100 local LLM requests per 5 minutes
  message: 'Local LLM rate limit exceeded. Please wait before making more requests.',
  useFingerprint: true,
});

// Conversational AI rate limiter - very restrictive for chat endpoints
const conversationRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes  
  max: 20, // 20 conversation messages per 5 minutes
  message: 'Too many conversation requests. Please wait before sending more messages.',
  useFingerprint: true,
});

// Voice processing rate limiter - expensive operations
const voiceRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 voice analyses per hour
  message: 'Voice processing limit reached. Please wait before uploading more audio.',
  useFingerprint: true,
});

// User Profiling Routes
router.get('/profile', authenticate, aiRateLimiter, userProfilingController.getProfile);
router.get('/profile/:userId', authenticate, aiRateLimiter, userProfilingController.getProfile);
router.put('/profile/preferences', authenticate, aiRateLimiter, userProfilingController.updatePreferences);
router.post('/profile/refresh', authenticate, aiRateLimiter, userProfilingController.refreshProfile);

// Profile Insights Routes
router.get('/profile/insights', authenticate, aiRateLimiter, userProfilingController.getInsights);
router.get('/profile/insights/:userId', authenticate, aiRateLimiter, userProfilingController.getInsights);

// Assessment Routes
router.get('/assessment/readiness', authenticate, aiRateLimiter, userProfilingController.assessReadiness);
router.get('/assessment/readiness/:userId', authenticate, aiRateLimiter, userProfilingController.assessReadiness);

// Recommendations Routes
router.get('/recommendations', authenticate, aiRateLimiter, aiController.getRecommendations);
router.get('/recommendations/:userId', authenticate, aiRateLimiter, aiController.getRecommendations);
router.get('/recommendations/timing/:activityType', authenticate, aiRateLimiter, sanitizeParams, aiController.getOptimalTiming);
router.get('/recommendations/schedule', authenticate, aiRateLimiter, aiController.getAdaptiveSchedule);

// Conversational AI Routes (with stricter limits and input validation)
router.post('/conversation/process', authenticate, conversationRateLimiter, validateConversationInput, aiController.processMessage);
router.post('/conversation/smart-response', authenticate, conversationRateLimiter, validateConversationInput, aiController.generateSmartResponse);

// Predictive Analytics Routes
router.get('/predictions', authenticate, aiRateLimiter, aiController.getPredictions);
router.get('/predictions/:userId', authenticate, aiRateLimiter, sanitizeParams, aiController.getPredictions);
router.get('/predictions/goal/:goalId', authenticate, aiRateLimiter, sanitizeParams, aiController.predictGoalCompletion);
router.get('/predictions/intervention/:riskType', authenticate, aiRateLimiter, sanitizeParams, aiController.getInterventionPlan);

// Adaptive Learning Routes
router.post('/learning/path', authenticate, aiRateLimiter, validateLearningPathInput, aiController.createLearningPath);
router.get('/learning/paths', authenticate, aiRateLimiter, aiController.getLearningPaths);
router.post(
  '/learning/path/:pathId/module/:moduleId/progress',
  authenticate,
  aiRateLimiter,
  sanitizeParams,
  validateGeneralAIInput,
  aiController.trackLearningProgress
);
router.get('/learning/path/:pathId/next-module', authenticate, aiRateLimiter, sanitizeParams, aiController.getNextModule);

// Voice AI Routes (with specialized voice rate limiter and validation)
router.post('/voice/analyze', authenticate, voiceRateLimiter, validateVoiceInput, upload.single('audio'), aiController.analyzeVoice);
router.post('/voice/coaching', authenticate, voiceRateLimiter, validateGeneralAIInput, aiController.getVoiceCoaching);
router.get('/voice/insights', authenticate, aiRateLimiter, aiController.getVoiceInsights);
router.get(
  '/voice/compare/:sessionId1/:sessionId2',
  authenticate,
  aiRateLimiter,
  aiController.compareVoiceSessions
);

// Insight Generation Routes
router.get('/insights/report', authenticate, aiRateLimiter, aiController.getInsightReport);
router.get('/insights/report/:userId', authenticate, aiRateLimiter, aiController.getInsightReport);
router.get('/insights/active', authenticate, aiRateLimiter, aiController.getActiveInsights);
router.post('/insights/:insightId/dismiss', authenticate, aiRateLimiter, aiController.dismissInsight);

// Local LLM Routes
router.get('/local-llm/status', authenticate, localLLMRateLimiter, localLLMController.getStatus);
router.get('/local-llm/models', authenticate, localLLMRateLimiter, localLLMController.getAvailableModels);
router.post('/local-llm/generate', authenticate, localLLMRateLimiter, validateConversationInput, localLLMController.processQuery);
router.post('/local-llm/initialize', authenticate, aiRateLimiter, localLLMController.initializeModel);
router.get('/local-llm/health', localLLMController.healthCheck);
router.get('/local-llm/metrics', authenticate, localLLMRateLimiter, localLLMController.getMetrics);

// Daily Pulse Routes
router.get('/pulse', authenticate, aiRateLimiter, (req, res, next) => dailyPulseController.getPulse(req, res, next));
router.post('/pulse/broadcast', authenticate, aiRateLimiter, (req, res, next) =>
  dailyPulseController.broadcast(req, res, next)
);

// Companion chat routes
router.get('/companion/history', authenticate, aiRateLimiter, (req, res, next) =>
  companionChatController.history(req, res, next)
);
router.post('/companion/message', authenticate, conversationRateLimiter, companionChatController.sendMessage);
router.delete('/companion/history', authenticate, aiRateLimiter, (req, res, next) =>
  companionChatController.reset(req, res, next)
);

// Hybrid AI Routes (local + cloud fallback)
router.post('/hybrid/generate', authenticate, aiRateLimiter, validateConversationInput, aiController.hybridGenerate);
router.get('/hybrid/routing-decision', authenticate, aiRateLimiter, aiController.getRoutingDecision);

// Real-time Personalization Routes
router.get('/personalization/preferences', authenticate, aiRateLimiter, aiController.getPersonalizationPreferences);
router.post('/personalization/update', authenticate, aiRateLimiter, aiController.updatePersonalization);
router.get('/personalization/content-recommendations', authenticate, aiRateLimiter, aiController.getPersonalizedContent);
router.get('/personalization/coaching-strategy', authenticate, aiRateLimiter, aiController.getCoachingStrategy);

// Advanced Analytics Routes
router.get('/analytics/behavior-patterns', authenticate, aiRateLimiter, aiController.getBehaviorPatterns);
router.get('/analytics/engagement-metrics', authenticate, aiRateLimiter, aiController.getEngagementMetrics);
router.get('/analytics/success-factors', authenticate, aiRateLimiter, aiController.getSuccessFactors);
router.post('/analytics/track-event', authenticate, aiRateLimiter, aiController.trackAnalyticsEvent);

export default router;
