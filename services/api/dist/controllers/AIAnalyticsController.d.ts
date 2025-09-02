import { Request, Response } from 'express';
export declare class AIAnalyticsController {
    getAIMetrics(req: Request, _res: Response): Promise<void>;
    getAIInteractions(req: Request, _res: Response): Promise<void>;
    getAIUsageData(req: Request, _res: Response): Promise<void>;
    getAIHealthStatus(req: Request, res: Response): Promise<void>;
    clearAICache(req: Request, res: Response): Promise<void>;
}
export declare const aiAnalyticsController: AIAnalyticsController;
//# sourceMappingURL=AIAnalyticsController.d.ts.map