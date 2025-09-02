import { Request, Response } from 'express';
export declare class CoachContentController {
    getDashboard(req: Request, _res: Response): Promise<void>;
    getArticles(req: Request, _res: Response): Promise<void>;
    createArticle(req: Request, _res: Response): Promise<void>;
    updateArticle(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    submitForReview(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    scheduleArticle(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    getArticleAnalytics(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    uploadMedia(req: Request, _res: Response): Promise<Response<any, Record<string, any>>>;
    getMediaLibrary(req: Request, _res: Response): Promise<void>;
    getCategories(req: Request, res: Response): Promise<void>;
    getPerformanceOverview(req: Request, _res: Response): Promise<void>;
}
declare const _default: CoachContentController;
export default _default;
//# sourceMappingURL=CoachContentController.d.ts.map