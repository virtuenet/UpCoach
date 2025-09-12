import { Request, Response } from 'express';
export declare class CoachContentController {
    getDashboard(req: Request, _res: Response): Promise<void>;
    getArticles(req: Request, _res: Response): Promise<void>;
    createArticle(req: Request, _res: Response): Promise<void>;
    updateArticle(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    submitForReview(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    scheduleArticle(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getArticleAnalytics(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    uploadMedia(req: Request, _res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getMediaLibrary(req: Request, _res: Response): Promise<void>;
    getCategories(req: Request, res: Response): Promise<void>;
    getPerformanceOverview(req: Request, _res: Response): Promise<void>;
}
declare const _default: CoachContentController;
export default _default;
//# sourceMappingURL=CoachContentController.d.ts.map