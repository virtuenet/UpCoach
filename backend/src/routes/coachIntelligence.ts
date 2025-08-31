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

export default router;
