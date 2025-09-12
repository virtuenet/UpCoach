import { Request, Response, NextFunction } from 'express';
export declare class UserProfilingController {
    getProfile(req: Request, _res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getInsights(req: Request, _res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getRecommendations(req: Request, _res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    assessReadiness(req: Request, _res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    updatePreferences(req: Request, _res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    refreshProfile(req: Request, _res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const userProfilingController: UserProfilingController;
//# sourceMappingURL=UserProfilingController.d.ts.map