import { Request, Response } from 'express';
/**
 * Coach Intelligence Controller
 * Handles API endpoints for memory tracking, analytics, and intelligent coaching features
 */
export declare class CoachIntelligenceController {
    private coachIntelligenceService;
    constructor();
    /**
     * Process and store a coaching session
     * POST /api/coach-intelligence/sessions
     */
    processSession(req: Request, _res: Response): Promise<void>;
    /**
     * Get relevant memories for current context
     * GET /api/coach-intelligence/memories/relevant
     */
    getRelevantMemories(req: Request, _res: Response): Promise<void>;
    /**
     * Get coaching recommendations
     * GET /api/coach-intelligence/recommendations/:userId
     */
    getCoachingRecommendations(req: Request, _res: Response): Promise<void>;
    /**
     * Generate weekly report
     * GET /api/coach-intelligence/reports/weekly/:userId
     */
    getWeeklyReport(req: Request, _res: Response): Promise<void>;
    /**
     * Get user analytics
     * GET /api/coach-intelligence/analytics/:userId
     */
    getUserAnalytics(req: Request, _res: Response): Promise<void>;
    /**
     * Get all memories for a user
     * GET /api/coach-intelligence/memories/:userId
     */
    getUserMemories(req: Request, _res: Response): Promise<void>;
    /**
     * Create a new KPI/Goal tracker
     * POST /api/coach-intelligence/kpi-trackers
     */
    createKpiTracker(req: Request, _res: Response): Promise<void>;
    /**
     * Get KPI trackers for a user
     * GET /api/coach-intelligence/kpi-trackers/:userId
     */
    getUserKpiTrackers(req: Request, _res: Response): Promise<void>;
    /**
     * Update KPI tracker progress
     * PATCH /api/coach-intelligence/kpi-trackers/:id/progress
     */
    updateKpiProgress(req: Request, _res: Response): Promise<void>;
    /**
     * Get cohort analytics (for admin panel)
     * GET /api/coach-intelligence/cohort-analytics
     */
    getCohortAnalytics(req: Request, _res: Response): Promise<void>;
    /**
     * Helper method to aggregate string arrays and find most common items
     */
    private aggregateStringArrays;
}
export declare const coachIntelligenceValidation: {
    processSession: import("express-validator").ValidationChain[];
    getRelevantMemories: import("express-validator").ValidationChain[];
    getCoachingRecommendations: import("express-validator").ValidationChain[];
    getWeeklyReport: import("express-validator").ValidationChain[];
    getUserAnalytics: import("express-validator").ValidationChain[];
    getUserMemories: import("express-validator").ValidationChain[];
    createKpiTracker: import("express-validator").ValidationChain[];
    getUserKpiTrackers: import("express-validator").ValidationChain[];
    updateKpiProgress: import("express-validator").ValidationChain[];
};
export default CoachIntelligenceController;
//# sourceMappingURL=CoachIntelligenceController.d.ts.map