import { Request, Response } from 'express';
/**
 * ArticleController
 * Handles CRUD operations for articles and content management
 */
export declare class ArticleController {
    /**
     * Get all articles with filtering and pagination
     */
    static getArticles(req: Request, _res: Response): Promise<void>;
    /**
     * Get a single article by ID or slug
     */
    static getArticle(req: Request, _res: Response): Promise<void>;
    /**
     * Create a new article
     */
    static createArticle(req: Request, _res: Response): Promise<void>;
    /**
     * Update an existing article
     */
    static updateArticle(req: Request, _res: Response): Promise<void>;
    /**
     * Delete an article
     */
    static deleteArticle(req: Request, _res: Response): Promise<void>;
    /**
     * Publish an article
     */
    static publishArticle(req: Request, _res: Response): Promise<void>;
    /**
     * Archive an article
     */
    static archiveArticle(req: Request, _res: Response): Promise<void>;
    /**
     * Get popular articles
     */
    static getPopularArticles(req: Request, _res: Response): Promise<void>;
    /**
     * Search articles
     */
    static searchArticles(req: Request, _res: Response): Promise<void>;
    /**
     * Get article analytics
     */
    static getArticleAnalytics(req: Request, _res: Response): Promise<void>;
    /**
     * Helper method to determine device type from user agent
     */
    private static getDeviceType;
}
export default ArticleController;
//# sourceMappingURL=ArticleController.d.ts.map