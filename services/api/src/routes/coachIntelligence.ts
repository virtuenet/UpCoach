import { Router } from 'express';

import CoachIntelligenceController, {
  coachIntelligenceValidation,
} from '../controllers/CoachIntelligenceController';

/**
 * Coach Intelligence Routes
 * Handles routing for memory tracking, analytics, and intelligent coaching features
 */

const router = Router();
const coachIntelligenceController = new CoachIntelligenceController();

// ========================================
// COACHING SESSION MANAGEMENT
// ========================================

/**
 * Process a coaching session and store in memory
 * POST /api/coach-intelligence/sessions
 */
router.post(
  '/sessions',
  coachIntelligenceValidation.processSession,
  coachIntelligenceController.processSession.bind(coachIntelligenceController)
);

// ========================================
// MEMORY MANAGEMENT
// ========================================

/**
 * Get relevant memories for current coaching context
 * GET /api/coach-intelligence/memories/relevant/:userId
 */
router.get(
  '/memories/relevant/:userId',
  coachIntelligenceValidation.getRelevantMemories,
  coachIntelligenceController.getRelevantMemories.bind(coachIntelligenceController)
);

/**
 * Get all memories for a user with filtering and pagination
 * GET /api/coach-intelligence/memories/:userId
 */
router.get(
  '/memories/:userId',
  coachIntelligenceValidation.getUserMemories,
  coachIntelligenceController.getUserMemories.bind(coachIntelligenceController)
);

// ========================================
// ANALYTICS & INSIGHTS
// ========================================

/**
 * Get user analytics for different time periods
 * GET /api/coach-intelligence/analytics/:userId
 */
router.get(
  '/analytics/:userId',
  coachIntelligenceValidation.getUserAnalytics,
  coachIntelligenceController.getUserAnalytics.bind(coachIntelligenceController)
);

/**
 * Get cohort analytics (admin panel feature)
 * GET /api/coach-intelligence/cohort-analytics
 */
router.get(
  '/cohort-analytics',
  coachIntelligenceController.getCohortAnalytics.bind(coachIntelligenceController)
);

// ========================================
// COACHING RECOMMENDATIONS
// ========================================

/**
 * Get intelligent coaching recommendations
 * GET /api/coach-intelligence/recommendations/:userId
 */
router.get(
  '/recommendations/:userId',
  coachIntelligenceValidation.getCoachingRecommendations,
  coachIntelligenceController.getCoachingRecommendations.bind(coachIntelligenceController)
);

// ========================================
// REPORTING
// ========================================

/**
 * Generate weekly coaching report
 * GET /api/coach-intelligence/reports/weekly/:userId
 */
router.get(
  '/reports/weekly/:userId',
  coachIntelligenceValidation.getWeeklyReport,
  coachIntelligenceController.getWeeklyReport.bind(coachIntelligenceController)
);

// ========================================
// KPI/OKR TRACKING
// ========================================

/**
 * Create a new KPI/Goal tracker
 * POST /api/coach-intelligence/kpi-trackers
 */
router.post(
  '/kpi-trackers',
  coachIntelligenceValidation.createKpiTracker,
  coachIntelligenceController.createKpiTracker.bind(coachIntelligenceController)
);

/**
 * Get KPI trackers for a user
 * GET /api/coach-intelligence/kpi-trackers/:userId
 */
router.get(
  '/kpi-trackers/:userId',
  coachIntelligenceValidation.getUserKpiTrackers,
  coachIntelligenceController.getUserKpiTrackers.bind(coachIntelligenceController)
);

/**
 * Update KPI tracker progress
 * PATCH /api/coach-intelligence/kpi-trackers/:id/progress
 */
router.patch(
  '/kpi-trackers/:id/progress',
  coachIntelligenceValidation.updateKpiProgress,
  coachIntelligenceController.updateKpiProgress.bind(coachIntelligenceController)
);

// ========================================
// ENHANCED COACH INTELLIGENCE FEATURES
// ========================================

/**
 * Calculate user engagement score
 * GET /api/coach-intelligence/engagement/:userId
 */
router.get(
  '/engagement/:userId',
  coachIntelligenceValidation.getEngagementScore,
  coachIntelligenceController.getEngagementScore.bind(coachIntelligenceController)
);

/**
 * Calculate missed sessions for user
 * GET /api/coach-intelligence/missed-sessions/:userId
 */
router.get(
  '/missed-sessions/:userId',
  coachIntelligenceValidation.getMissedSessions,
  coachIntelligenceController.getMissedSessions.bind(coachIntelligenceController)
);

/**
 * Get missed sessions analytics (admin panel)
 * GET /api/coach-intelligence/missed-sessions/analytics
 */
router.get(
  '/missed-sessions/analytics',
  coachIntelligenceController.getMissedSessionsAnalytics.bind(coachIntelligenceController)
);

/**
 * Predict users at risk of missing sessions
 * GET /api/coach-intelligence/predict-at-risk-users
 */
router.get(
  '/predict-at-risk-users',
  coachIntelligenceController.predictAtRiskUsers.bind(coachIntelligenceController)
);

/**
 * Set user session expectations
 * POST /api/coach-intelligence/session-expectations/:userId
 */
router.post(
  '/session-expectations/:userId',
  coachIntelligenceValidation.setSessionExpectations,
  coachIntelligenceController.setSessionExpectations.bind(coachIntelligenceController)
);

/**
 * Track custom KPI for user
 * POST /api/coach-intelligence/track-kpi/:userId
 */
router.post(
  '/track-kpi/:userId',
  coachIntelligenceValidation.trackCustomKPI,
  coachIntelligenceController.trackCustomKPI.bind(coachIntelligenceController)
);

/**
 * Generate KPI report for user
 * GET /api/coach-intelligence/kpi-report/:userId
 */
router.get(
  '/kpi-report/:userId',
  coachIntelligenceValidation.generateKPIReport,
  coachIntelligenceController.generateKPIReport.bind(coachIntelligenceController)
);

/**
 * Predict user success probability
 * GET /api/coach-intelligence/predict-success/:userId
 */
router.get(
  '/predict-success/:userId',
  coachIntelligenceValidation.predictUserSuccess,
  coachIntelligenceController.predictUserSuccess.bind(coachIntelligenceController)
);

/**
 * Generate behavior insights for user
 * GET /api/coach-intelligence/behavior-insights/:userId
 */
router.get(
  '/behavior-insights/:userId',
  coachIntelligenceValidation.getBehaviorInsights,
  coachIntelligenceController.getBehaviorInsights.bind(coachIntelligenceController)
);

export default router;
