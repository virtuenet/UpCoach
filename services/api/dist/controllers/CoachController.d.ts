import { Request, Response } from 'express';
export declare class CoachController {
    searchCoaches: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    getCoachDetails: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    getCoachAvailability: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    bookSession: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    processPayment: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    submitReview: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    getCoachPackages: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    purchasePackage: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    getCoachDashboard: (req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>;
    getClientSessions: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    adminGetCoaches: (req: Request, _res: Response) => Promise<void>;
    adminGetSessions: (req: Request, _res: Response) => Promise<void>;
    adminGetReviews: (req: Request, _res: Response) => Promise<void>;
    adminGetStats: (req: Request, _res: Response) => Promise<void>;
    adminUpdateCoachStatus: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    adminVerifyCoach: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    adminFeatureCoach: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    adminDeleteReview: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    cancelSession: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
}
export declare const coachController: CoachController;
//# sourceMappingURL=CoachController.d.ts.map