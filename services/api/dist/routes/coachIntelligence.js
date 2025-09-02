"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CoachIntelligenceController_1 = __importStar(require("../controllers/CoachIntelligenceController"));
/**
 * Coach Intelligence Routes
 * Handles routing for memory tracking, analytics, and intelligent coaching features
 */
const router = (0, express_1.Router)();
const coachIntelligenceController = new CoachIntelligenceController_1.default();
// ========================================
// COACHING SESSION MANAGEMENT
// ========================================
/**
 * Process a coaching session and store in memory
 * POST /api/coach-intelligence/sessions
 */
router.post('/sessions', CoachIntelligenceController_1.coachIntelligenceValidation.processSession, coachIntelligenceController.processSession.bind(coachIntelligenceController));
// ========================================
// MEMORY MANAGEMENT
// ========================================
/**
 * Get relevant memories for current coaching context
 * GET /api/coach-intelligence/memories/relevant/:userId
 */
router.get('/memories/relevant/:userId', CoachIntelligenceController_1.coachIntelligenceValidation.getRelevantMemories, coachIntelligenceController.getRelevantMemories.bind(coachIntelligenceController));
/**
 * Get all memories for a user with filtering and pagination
 * GET /api/coach-intelligence/memories/:userId
 */
router.get('/memories/:userId', CoachIntelligenceController_1.coachIntelligenceValidation.getUserMemories, coachIntelligenceController.getUserMemories.bind(coachIntelligenceController));
// ========================================
// ANALYTICS & INSIGHTS
// ========================================
/**
 * Get user analytics for different time periods
 * GET /api/coach-intelligence/analytics/:userId
 */
router.get('/analytics/:userId', CoachIntelligenceController_1.coachIntelligenceValidation.getUserAnalytics, coachIntelligenceController.getUserAnalytics.bind(coachIntelligenceController));
/**
 * Get cohort analytics (admin panel feature)
 * GET /api/coach-intelligence/cohort-analytics
 */
router.get('/cohort-analytics', coachIntelligenceController.getCohortAnalytics.bind(coachIntelligenceController));
// ========================================
// COACHING RECOMMENDATIONS
// ========================================
/**
 * Get intelligent coaching recommendations
 * GET /api/coach-intelligence/recommendations/:userId
 */
router.get('/recommendations/:userId', CoachIntelligenceController_1.coachIntelligenceValidation.getCoachingRecommendations, coachIntelligenceController.getCoachingRecommendations.bind(coachIntelligenceController));
// ========================================
// REPORTING
// ========================================
/**
 * Generate weekly coaching report
 * GET /api/coach-intelligence/reports/weekly/:userId
 */
router.get('/reports/weekly/:userId', CoachIntelligenceController_1.coachIntelligenceValidation.getWeeklyReport, coachIntelligenceController.getWeeklyReport.bind(coachIntelligenceController));
// ========================================
// KPI/OKR TRACKING
// ========================================
/**
 * Create a new KPI/Goal tracker
 * POST /api/coach-intelligence/kpi-trackers
 */
router.post('/kpi-trackers', CoachIntelligenceController_1.coachIntelligenceValidation.createKpiTracker, coachIntelligenceController.createKpiTracker.bind(coachIntelligenceController));
/**
 * Get KPI trackers for a user
 * GET /api/coach-intelligence/kpi-trackers/:userId
 */
router.get('/kpi-trackers/:userId', CoachIntelligenceController_1.coachIntelligenceValidation.getUserKpiTrackers, coachIntelligenceController.getUserKpiTrackers.bind(coachIntelligenceController));
/**
 * Update KPI tracker progress
 * PATCH /api/coach-intelligence/kpi-trackers/:id/progress
 */
router.patch('/kpi-trackers/:id/progress', CoachIntelligenceController_1.coachIntelligenceValidation.updateKpiProgress, coachIntelligenceController.updateKpiProgress.bind(coachIntelligenceController));
exports.default = router;
//# sourceMappingURL=coachIntelligence.js.map