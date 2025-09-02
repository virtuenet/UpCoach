import { Request, Response } from 'express';
export declare class GamificationController {
    getUserStats: (req: Request, _res: Response) => Promise<void>;
    getUserAchievements: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    claimAchievement: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    getUserStreaks: (req: Request, _res: Response) => Promise<void>;
    getChallenges: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    joinChallenge: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    getLeaderboard: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    getRewardStore: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    purchaseReward: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    getUserRewards: (req: Request, _res: Response) => Promise<void>;
    trackActivity: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
    updateStreak: (import("express-validator").ValidationChain | ((req: Request, _res: Response) => Promise<Response<any, Record<string, any>>>))[];
}
export declare const gamificationController: GamificationController;
//# sourceMappingURL=GamificationController.d.ts.map