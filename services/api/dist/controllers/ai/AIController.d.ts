import { Request, Response, NextFunction } from 'express';
export declare class AIController {
    getRecommendations(req: Request, _res: Response, next: NextFunction): Promise<void>;
    getOptimalTiming(req: Request, _res: Response, next: NextFunction): Promise<void>;
    getAdaptiveSchedule(req: Request, _res: Response, next: NextFunction): Promise<void>;
    processMessage(req: Request, _res: Response, next: NextFunction): Promise<void>;
    generateSmartResponse(req: Request, _res: Response, next: NextFunction): Promise<void>;
    getPredictions(req: Request, _res: Response, next: NextFunction): Promise<void>;
    predictGoalCompletion(req: Request, _res: Response, next: NextFunction): Promise<void>;
    getInterventionPlan(req: Request, _res: Response, next: NextFunction): Promise<void>;
    createLearningPath(req: Request, _res: Response, next: NextFunction): Promise<void>;
    getLearningPaths(req: Request, _res: Response, next: NextFunction): Promise<void>;
    trackLearningProgress(req: Request, _res: Response, next: NextFunction): Promise<void>;
    getNextModule(req: Request, _res: Response, next: NextFunction): Promise<void>;
    analyzeVoice(req: Request, _res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    getVoiceCoaching(req: Request, _res: Response, next: NextFunction): Promise<void>;
    getVoiceInsights(req: Request, _res: Response, next: NextFunction): Promise<void>;
    compareVoiceSessions(req: Request, _res: Response, next: NextFunction): Promise<void>;
    getInsightReport(req: Request, _res: Response, next: NextFunction): Promise<void>;
    getActiveInsights(req: Request, _res: Response, next: NextFunction): Promise<void>;
    dismissInsight(req: Request, _res: Response, next: NextFunction): Promise<void>;
}
export declare const aiController: AIController;
//# sourceMappingURL=AIController.d.ts.map