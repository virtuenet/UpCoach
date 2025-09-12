import { Request, Response } from 'express';
export declare class CoachController {
    searchCoaches: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    getCoachDetails: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    getCoachAvailability: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    bookSession: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    processPayment: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    submitReview: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    getCoachPackages: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    purchasePackage: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    getCoachDashboard: (req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getClientSessions: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    adminGetCoaches: (req: Request, _res: Response) => Promise<void>;
    adminGetSessions: (req: Request, _res: Response) => Promise<void>;
    adminGetReviews: (req: Request, _res: Response) => Promise<void>;
    adminGetStats: (req: Request, _res: Response) => Promise<void>;
    adminUpdateCoachStatus: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    adminVerifyCoach: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    adminFeatureCoach: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    adminDeleteReview: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    cancelSession: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
}
export declare const coachController: CoachController;
//# sourceMappingURL=CoachController.d.ts.map