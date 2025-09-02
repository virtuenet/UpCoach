import { ContentArticle } from '../../models/cms/ContentArticle';
import ContentSchedule from '../../models/cms/ContentSchedule';
interface PublishingOptions {
    notifyAuthor?: boolean;
    notifySubscribers?: boolean;
    socialShare?: boolean;
    validateSEO?: boolean;
}
interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    seoScore: number;
}
export declare class PublishingService {
    private publishingQueue;
    constructor();
    private initializeScheduler;
    processScheduledContent(): Promise<void>;
    private executeScheduledAction;
    publishArticle(articleId: number, options?: PublishingOptions): Promise<ContentArticle>;
    unpublishArticle(articleId: number): Promise<ContentArticle>;
    schedulePublishing(articleId: number, publishDate: Date, userId: number, options?: PublishingOptions): Promise<ContentSchedule>;
    cancelSchedule(articleId: number): Promise<void>;
    validateArticle(article: ContentArticle): Promise<ValidationResult>;
    submitForReview(articleId: number, reviewerId?: number): Promise<ContentArticle>;
    approveArticle(articleId: number, reviewerId: number, comments?: string): Promise<ContentArticle>;
    rejectArticle(articleId: number, reviewerId: number, reason: string): Promise<ContentArticle>;
    private notifyAuthor;
    private notifySubscribers;
    private scheduleSocialSharing;
    private getSubscribers;
    private invalidateArticleCache;
    trackPublishingMetrics(articleId: number): Promise<void>;
}
export {};
//# sourceMappingURL=PublishingService.d.ts.map