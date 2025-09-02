import { Request, Response } from 'express';
export declare class AdvancedAnalyticsController {
    createCohort: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    getCohortRetention: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    compareCohorts: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    createFunnel: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    getFunnelAnalytics: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    trackActivity: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    trackFunnelStep: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    getFeatureAdoption: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    getUserLifecycleStage: (req: Request, _res: Response) => Promise<void>;
    getRevenueAnalytics: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    getCohorts: (_req: Request, _res: Response) => Promise<void>;
    getFunnels: (_req: Request, _res: Response) => Promise<void>;
}
export declare const advancedAnalyticsController: AdvancedAnalyticsController;
//# sourceMappingURL=AdvancedAnalyticsController.d.ts.map