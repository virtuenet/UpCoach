import { Request, Response } from 'express';
export declare class GamificationController {
    getUserStats: (req: Request, _res: Response) => Promise<void>;
    getUserAchievements: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    claimAchievement: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    getUserStreaks: (req: Request, _res: Response) => Promise<void>;
    getChallenges: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    joinChallenge: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    getLeaderboard: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    getRewardStore: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    purchaseReward: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    getUserRewards: (req: Request, _res: Response) => Promise<void>;
    trackActivity: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
    updateStreak: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>> | undefined>))[];
}
export declare const gamificationController: GamificationController;
//# sourceMappingURL=GamificationController.d.ts.map