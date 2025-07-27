import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import upload from '../middleware/upload';
import { userProfilingController } from '../controllers/ai/UserProfilingController';
import { aiController } from '../controllers/ai/AIController';

const router = Router();

// User Profiling Routes
router.get('/profile', authenticate, userProfilingController.getProfile);
router.get('/profile/:userId', authenticate, userProfilingController.getProfile);
router.put('/profile/preferences', authenticate, userProfilingController.updatePreferences);
router.post('/profile/refresh', authenticate, userProfilingController.refreshProfile);

// Profile Insights Routes
router.get('/profile/insights', authenticate, userProfilingController.getInsights);
router.get('/profile/insights/:userId', authenticate, userProfilingController.getInsights);

// Assessment Routes
router.get('/assessment/readiness', authenticate, userProfilingController.assessReadiness);
router.get('/assessment/readiness/:userId', authenticate, userProfilingController.assessReadiness);

// Recommendations Routes
router.get('/recommendations', authenticate, aiController.getRecommendations);
router.get('/recommendations/:userId', authenticate, aiController.getRecommendations);
router.get('/recommendations/timing/:activityType', authenticate, aiController.getOptimalTiming);
router.get('/recommendations/schedule', authenticate, aiController.getAdaptiveSchedule);

// Conversational AI Routes
router.post('/conversation/process', authenticate, aiController.processMessage);
router.post('/conversation/smart-response', authenticate, aiController.generateSmartResponse);

// Predictive Analytics Routes
router.get('/predictions', authenticate, aiController.getPredictions);
router.get('/predictions/:userId', authenticate, aiController.getPredictions);
router.get('/predictions/goal/:goalId', authenticate, aiController.predictGoalCompletion);
router.get('/predictions/intervention/:riskType', authenticate, aiController.getInterventionPlan);

// Adaptive Learning Routes
router.post('/learning/path', authenticate, aiController.createLearningPath);
router.get('/learning/paths', authenticate, aiController.getLearningPaths);
router.post('/learning/path/:pathId/module/:moduleId/progress', authenticate, aiController.trackLearningProgress);
router.get('/learning/path/:pathId/next-module', authenticate, aiController.getNextModule);

// Voice AI Routes
router.post('/voice/analyze', authenticate, upload.single('audio'), aiController.analyzeVoice);
router.post('/voice/coaching', authenticate, aiController.getVoiceCoaching);
router.get('/voice/insights', authenticate, aiController.getVoiceInsights);
router.get('/voice/compare/:sessionId1/:sessionId2', authenticate, aiController.compareVoiceSessions);

// Insight Generation Routes
router.get('/insights/report', authenticate, aiController.getInsightReport);
router.get('/insights/report/:userId', authenticate, aiController.getInsightReport);
router.get('/insights/active', authenticate, aiController.getActiveInsights);
router.post('/insights/:insightId/dismiss', authenticate, aiController.dismissInsight);

export default router;