import { Request, Response, NextFunction } from 'express';
export declare class UserProfilingController {
    getProfile(req: Request, _res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    getInsights(req: Request, _res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    getRecommendations(req: Request, _res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    assessReadiness(req: Request, _res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    updatePreferences(req: Request, _res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    refreshProfile(req: Request, _res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
}
export declare const userProfilingController: UserProfilingController;
//# sourceMappingURL=UserProfilingController.d.ts.map