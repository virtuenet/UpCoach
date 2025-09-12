import { Request, Response } from 'express';
export declare class AdvancedAnalyticsController {
    createCohort: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    getCohortRetention: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    compareCohorts: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    createFunnel: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    getFunnelAnalytics: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    trackActivity: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    trackFunnelStep: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    getFeatureAdoption: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    getUserLifecycleStage: (req: Request, _res: Response) => Promise<void>;
    getRevenueAnalytics: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    getCohorts: (_req: Request, _res: Response) => Promise<void>;
    getFunnels: (_req: Request, _res: Response) => Promise<void>;
}
export declare const advancedAnalyticsController: AdvancedAnalyticsController;
//# sourceMappingURL=AdvancedAnalyticsController.d.ts.map