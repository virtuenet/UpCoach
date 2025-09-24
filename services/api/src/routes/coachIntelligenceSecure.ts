import { Router } from 'express';

import CoachIntelligenceController, {
  coachIntelligenceValidation,
} from '../controllers/CoachIntelligenceController';
import { authMiddleware, requireRole, requireOwnership } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

/**
 * SECURE Coach Intelligence Routes
 * Handles routing for memory tracking, analytics, and intelligent coaching features
 * WITH COMPREHENSIVE AUTHENTICATION AND AUTHORIZATION
 */

const router = Router();
const coachIntelligenceController = new CoachIntelligenceController();

// Apply authentication and rate limiting to all routes
router.use(authMiddleware);
router.use(apiLimiter);

// ========================================
// COACHING SESSION MANAGEMENT
// ========================================

/**
 * Process a coaching session and store in memory
 * POST /api/coach-intelligence/sessions
 * Requires: Authentication, Coach or Admin role
 */
router.post(
  '/sessions',
  requireRole(['coach', 'admin']),
  coachIntelligenceValidation.processSession,
  coachIntelligenceController.processSession.bind(coachIntelligenceController)
);

// ========================================
// MEMORY MANAGEMENT
// ========================================

/**
 * Get relevant memories for current coaching context
 * GET /api/coach-intelligence/memories/relevant/:userId
 * Requires: Authentication, Resource ownership or Admin
 */
router.get(
  '/memories/relevant/:userId',
  requireOwnership('userId'),
  coachIntelligenceValidation.getRelevantMemories,
  coachIntelligenceController.getRelevantMemories.bind(coachIntelligenceController)
);

/**
 * Get all memories for a user with filtering and pagination
 * GET /api/coach-intelligence/memories/:userId
 * Requires: Authentication, Resource ownership or Admin
 */
router.get(
  '/memories/:userId',
  requireOwnership('userId'),
  coachIntelligenceValidation.getUserMemories,
  coachIntelligenceController.getUserMemories.bind(coachIntelligenceController)
);

// ========================================
// ANALYTICS & INSIGHTS
// ========================================

/**
 * Get user analytics for different time periods
 * GET /api/coach-intelligence/analytics/:userId
 * Requires: Authentication, Resource ownership or Admin
 */
router.get(
  '/analytics/:userId',
  requireOwnership('userId'),
  coachIntelligenceValidation.getUserAnalytics,
  coachIntelligenceController.getUserAnalytics.bind(coachIntelligenceController)
);

/**
 * Get cohort analytics (admin panel feature)
 * GET /api/coach-intelligence/cohort-analytics
 * Requires: Authentication, Admin role only
 */
router.get(
  '/cohort-analytics',
  requireRole('admin'),
  coachIntelligenceController.getCohortAnalytics.bind(coachIntelligenceController)
);

// ========================================
// COACHING RECOMMENDATIONS
// ========================================

/**
 * Get intelligent coaching recommendations
 * GET /api/coach-intelligence/recommendations/:userId
 * Requires: Authentication, Resource ownership or Coach/Admin
 */
router.get(
  '/recommendations/:userId',
  requireOwnership('userId'),
  coachIntelligenceValidation.getCoachingRecommendations,
  coachIntelligenceController.getCoachingRecommendations.bind(coachIntelligenceController)
);

// ========================================
// REPORTING
// ========================================

/**
 * Generate weekly coaching report
 * GET /api/coach-intelligence/reports/weekly/:userId
 * Requires: Authentication, Resource ownership or Coach/Admin
 */
router.get(
  '/reports/weekly/:userId',
  requireOwnership('userId'),
  coachIntelligenceValidation.getWeeklyReport,
  coachIntelligenceController.getWeeklyReport.bind(coachIntelligenceController)
);

// ========================================
// KPI/OKR TRACKING
// ========================================

/**
 * Create a new KPI/Goal tracker
 * POST /api/coach-intelligence/kpi-trackers
 * Requires: Authentication, User or Admin role
 */
router.post(
  '/kpi-trackers',
  requireRole(['user', 'coach', 'admin']),
  coachIntelligenceValidation.createKpiTracker,
  coachIntelligenceController.createKpiTracker.bind(coachIntelligenceController)
);

/**
 * Get KPI trackers for a user
 * GET /api/coach-intelligence/kpi-trackers/:userId
 * Requires: Authentication, Resource ownership or Admin
 */
router.get(
  '/kpi-trackers/:userId',
  requireOwnership('userId'),
  coachIntelligenceValidation.getUserKpiTrackers,
  coachIntelligenceController.getUserKpiTrackers.bind(coachIntelligenceController)
);

/**
 * Update KPI tracker progress
 * PATCH /api/coach-intelligence/kpi-trackers/:id/progress
 * Requires: Authentication, Resource ownership
 */
router.patch(
  '/kpi-trackers/:id/progress',
  requireOwnership('id'),
  coachIntelligenceValidation.updateKpiProgress,
  coachIntelligenceController.updateKpiProgress.bind(coachIntelligenceController)
);

// ========================================
// ENHANCED COACH INTELLIGENCE FEATURES
// ========================================

/**
 * Calculate user engagement score
 * GET /api/coach-intelligence/engagement/:userId
 * Requires: Authentication, Resource ownership or Admin
 */
router.get(
  '/engagement/:userId',
  requireOwnership('userId'),
  coachIntelligenceValidation.getEngagementScore,
  coachIntelligenceController.getEngagementScore.bind(coachIntelligenceController)
);

/**
 * Calculate missed sessions for user
 * GET /api/coach-intelligence/missed-sessions/:userId
 * Requires: Authentication, Resource ownership or Admin
 */
router.get(
  '/missed-sessions/:userId',
  requireOwnership('userId'),
  coachIntelligenceValidation.getMissedSessions,
  coachIntelligenceController.getMissedSessions.bind(coachIntelligenceController)
);

/**
 * Get missed sessions analytics (admin panel)
 * GET /api/coach-intelligence/missed-sessions/analytics
 * Requires: Authentication, Coach or Admin role
 */
router.get(
  '/missed-sessions/analytics',
  requireRole(['coach', 'admin']),
  coachIntelligenceController.getMissedSessionsAnalytics.bind(coachIntelligenceController)
);

/**
 * Predict users at risk of missing sessions
 * GET /api/coach-intelligence/predict-at-risk-users
 * Requires: Authentication, Coach or Admin role
 */
router.get(
  '/predict-at-risk-users',
  requireRole(['coach', 'admin']),
  coachIntelligenceController.predictAtRiskUsers.bind(coachIntelligenceController)
);

/**
 * Set user session expectations
 * POST /api/coach-intelligence/session-expectations/:userId
 * Requires: Authentication, Resource ownership or Coach/Admin
 */
router.post(
  '/session-expectations/:userId',
  requireOwnership('userId'),
  coachIntelligenceValidation.setSessionExpectations,
  coachIntelligenceController.setSessionExpectations.bind(coachIntelligenceController)
);

/**
 * Track custom KPI for user
 * POST /api/coach-intelligence/track-kpi/:userId
 * Requires: Authentication, Resource ownership or Admin
 */
router.post(
  '/track-kpi/:userId',
  requireOwnership('userId'),
  coachIntelligenceValidation.trackCustomKPI,
  coachIntelligenceController.trackCustomKPI.bind(coachIntelligenceController)
);

/**
 * Generate KPI report for user
 * GET /api/coach-intelligence/kpi-report/:userId
 * Requires: Authentication, Resource ownership or Admin
 */
router.get(
  '/kpi-report/:userId',
  requireOwnership('userId'),
  coachIntelligenceValidation.generateKPIReport,
  coachIntelligenceController.generateKPIReport.bind(coachIntelligenceController)
);

/**
 * Predict user success probability
 * GET /api/coach-intelligence/predict-success/:userId
 * Requires: Authentication, Resource ownership or Coach/Admin
 */
router.get(
  '/predict-success/:userId',
  requireOwnership('userId'),
  coachIntelligenceValidation.predictUserSuccess,
  coachIntelligenceController.predictUserSuccess.bind(coachIntelligenceController)
);

/**
 * Generate behavior insights for user
 * GET /api/coach-intelligence/behavior-insights/:userId
 * Requires: Authentication, Resource ownership or Admin
 */
router.get(
  '/behavior-insights/:userId',
  requireOwnership('userId'),
  coachIntelligenceValidation.getBehaviorInsights,
  coachIntelligenceController.getBehaviorInsights.bind(coachIntelligenceController)
);

export default router;