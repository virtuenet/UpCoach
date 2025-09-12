import { Request, Response } from 'express';
export declare class CoachIntelligenceController {
    private coachIntelligenceService;
    constructor();
    processSession(req: Request, _res: Response): Promise<void>;
    getRelevantMemories(req: Request, _res: Response): Promise<void>;
    getCoachingRecommendations(req: Request, _res: Response): Promise<void>;
    getWeeklyReport(req: Request, _res: Response): Promise<void>;
    getUserAnalytics(req: Request, _res: Response): Promise<void>;
    getUserMemories(req: Request, _res: Response): Promise<void>;
    createKpiTracker(req: Request, _res: Response): Promise<void>;
    getUserKpiTrackers(req: Request, _res: Response): Promise<void>;
    updateKpiProgress(req: Request, _res: Response): Promise<void>;
    getCohortAnalytics(req: Request, _res: Response): Promise<void>;
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