"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const upload_1 = __importDefault(require("../middleware/upload"));
const UserProfilingController_1 = require("../controllers/ai/UserProfilingController");
const AIController_1 = require("../controllers/ai/AIController");
const router = (0, express_1.Router)();
// User Profiling Routes
router.get('/profile', auth_1.authenticate, UserProfilingController_1.userProfilingController.getProfile);
router.get('/profile/:userId', auth_1.authenticate, UserProfilingController_1.userProfilingController.getProfile);
router.put('/profile/preferences', auth_1.authenticate, UserProfilingController_1.userProfilingController.updatePreferences);
router.post('/profile/refresh', auth_1.authenticate, UserProfilingController_1.userProfilingController.refreshProfile);
// Profile Insights Routes
router.get('/profile/insights', auth_1.authenticate, UserProfilingController_1.userProfilingController.getInsights);
router.get('/profile/insights/:userId', auth_1.authenticate, UserProfilingController_1.userProfilingController.getInsights);
// Assessment Routes
router.get('/assessment/readiness', auth_1.authenticate, UserProfilingController_1.userProfilingController.assessReadiness);
router.get('/assessment/readiness/:userId', auth_1.authenticate, UserProfilingController_1.userProfilingController.assessReadiness);
// Recommendations Routes
router.get('/recommendations', auth_1.authenticate, AIController_1.aiController.getRecommendations);
router.get('/recommendations/:userId', auth_1.authenticate, AIController_1.aiController.getRecommendations);
router.get('/recommendations/timing/:activityType', auth_1.authenticate, AIController_1.aiController.getOptimalTiming);
router.get('/recommendations/schedule', auth_1.authenticate, AIController_1.aiController.getAdaptiveSchedule);
// Conversational AI Routes
router.post('/conversation/process', auth_1.authenticate, AIController_1.aiController.processMessage);
router.post('/conversation/smart-response', auth_1.authenticate, AIController_1.aiController.generateSmartResponse);
// Predictive Analytics Routes
router.get('/predictions', auth_1.authenticate, AIController_1.aiController.getPredictions);
router.get('/predictions/:userId', auth_1.authenticate, AIController_1.aiController.getPredictions);
router.get('/predictions/goal/:goalId', auth_1.authenticate, AIController_1.aiController.predictGoalCompletion);
router.get('/predictions/intervention/:riskType', auth_1.authenticate, AIController_1.aiController.getInterventionPlan);
// Adaptive Learning Routes
router.post('/learning/path', auth_1.authenticate, AIController_1.aiController.createLearningPath);
router.get('/learning/paths', auth_1.authenticate, AIController_1.aiController.getLearningPaths);
router.post('/learning/path/:pathId/module/:moduleId/progress', auth_1.authenticate, AIController_1.aiController.trackLearningProgress);
router.get('/learning/path/:pathId/next-module', auth_1.authenticate, AIController_1.aiController.getNextModule);
// Voice AI Routes
router.post('/voice/analyze', auth_1.authenticate, upload_1.default.single('audio'), AIController_1.aiController.analyzeVoice);
router.post('/voice/coaching', auth_1.authenticate, AIController_1.aiController.getVoiceCoaching);
router.get('/voice/insights', auth_1.authenticate, AIController_1.aiController.getVoiceInsights);
router.get('/voice/compare/:sessionId1/:sessionId2', auth_1.authenticate, AIController_1.aiController.compareVoiceSessions);
// Insight Generation Routes
router.get('/insights/report', auth_1.authenticate, AIController_1.aiController.getInsightReport);
router.get('/insights/report/:userId', auth_1.authenticate, AIController_1.aiController.getInsightReport);
router.get('/insights/active', auth_1.authenticate, AIController_1.aiController.getActiveInsights);
router.post('/insights/:insightId/dismiss', auth_1.authenticate, AIController_1.aiController.dismissInsight);
exports.default = router;
//# sourceMappingURL=ai.js.map