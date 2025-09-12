import { UnifiedContent, ContentType, ContentStatus } from '../../models/cms';
interface ContentOptions {
    notifyAuthor?: boolean;
    notifySubscribers?: boolean;
    socialShare?: boolean;
    validateSEO?: boolean;
    skipCache?: boolean;
}
interface ContentFilter {
    type?: ContentType | ContentType[];
    status?: ContentStatus | ContentStatus[];
    authorId?: string;
    categoryId?: string;
    tags?: string[];
    isPremium?: boolean;
    isPrivate?: boolean;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
}
interface PaginationOptions {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
}
interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    seoScore: number;
    readabilityScore: number;
}
interface ContentAnalytics {
    views: number;
    uniqueViews: number;
    avgReadTime: number;
    completionRate: number;
    engagementRate: number;
    shares: number;
    comments: number;
    likes: number;
}
export declare class UnifiedContentService {
    private static instance;
    private cache;
    private email;
    private scheduledTasks;
    private constructor();
    static getInstance(): UnifiedContentService;
    private initializeScheduler;
    createContent(data: Partial<UnifiedContent>, options?: ContentOptions): Promise<UnifiedContent>;
    getContent(id: string, options?: {
        includeRelations?: boolean;
        skipCache?: boolean;
    }): Promise<UnifiedContent | null>;
    updateContent(id: string, data: Partial<UnifiedContent>, userId: string, options?: ContentOptions): Promise<UnifiedContent>;
    deleteContent(id: string, userId: string): Promise<boolean>;
    publishContent(id: string, options?: ContentOptions): Promise<UnifiedContent>;
    schedulePublishing(id: string, publishDate: Date, options?: ContentOptions): Promise<UnifiedContent>;
    private processScheduledContent;
    private processExpiredContent;
    searchContent(filter?: ContentFilter, pagination?: PaginationOptions): Promise<{
        data: UnifiedContent[];
        total: number;
        pages: number;
    }>;
    getPopularContent(type?: ContentType, limit?: number): Promise<UnifiedContent[]>;
    getRelatedContent(contentId: string, limit?: number): Promise<UnifiedContent[]>;
    trackInteraction(contentId: string, userId: string, type: 'view' | 'like' | 'share' | 'comment' | 'rating', data?: any): Promise<void>;
    getContentAnalytics(contentId: string, dateFrom?: Date, dateTo?: Date): Promise<ContentAnalytics>;
    private updateContentAnalytics;
    validateContent(content: UnifiedContent): Promise<ValidationResult>;
    private attachTags;
    private updateTags;
    private attachMedia;
    private updateMedia;
    private invalidateContentCache;
    private notifyAuthor;
    private notifySubscribers;
    private getSubscribers;
    private scheduleSocialSharing;
}
export declare const getContentService: () => UnifiedContentService;
export default UnifiedContentService;
//# sourceMappingURL=UnifiedContentService.d.ts.map