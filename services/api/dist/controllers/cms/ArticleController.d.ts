import { Request, Response } from 'express';
export declare class ArticleController {
    static getArticles(req: Request, _res: Response): Promise<void>;
    static getArticle(req: Request, _res: Response): Promise<void>;
    static createArticle(req: Request, _res: Response): Promise<void>;
    static updateArticle(req: Request, _res: Response): Promise<void>;
    static deleteArticle(req: Request, _res: Response): Promise<void>;
    static publishArticle(req: Request, _res: Response): Promise<void>;
    static archiveArticle(req: Request, _res: Response): Promise<void>;
    static getPopularArticles(req: Request, _res: Response): Promise<void>;
    static searchArticles(req: Request, _res: Response): Promise<void>;
    static getArticleAnalytics(req: Request, _res: Response): Promise<void>;
    private static getDeviceType;
}
export default ArticleController;
//# sourceMappingURL=ArticleController.d.ts.map