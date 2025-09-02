/**
 * Unified Content Service
 * Consolidates all CMS-related services into a single, efficient service
 */
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
    /**
     * Create new content
     */
    createContent(data: Partial<UnifiedContent>, options?: ContentOptions): Promise<UnifiedContent>;
    /**
     * Get content by ID
     */
    getContent(id: string, options?: {
        includeRelations?: boolean;
        skipCache?: boolean;
    }): Promise<UnifiedContent | null>;
    /**
     * Update content
     */
    updateContent(id: string, data: Partial<UnifiedContent>, userId: string, options?: ContentOptions): Promise<UnifiedContent>;
    /**
     * Delete content (soft delete)
     */
    deleteContent(id: string, userId: string): Promise<boolean>;
    /**
     * Publish content
     */
    publishContent(id: string, options?: ContentOptions): Promise<UnifiedContent>;
    /**
     * Schedule content publishing
     */
    schedulePublishing(id: string, publishDate: Date, options?: ContentOptions): Promise<UnifiedContent>;
    /**
     * Process scheduled content
     */
    private processScheduledContent;
    /**
     * Process expired content
     */
    private processExpiredContent;
    /**
     * Search content with filters
     */
    searchContent(filter?: ContentFilter, pagination?: PaginationOptions): Promise<{
        data: UnifiedContent[];
        total: number;
        pages: number;
    }>;
    /**
     * Get popular content
     */
    getPopularContent(type?: ContentType, limit?: number): Promise<UnifiedContent[]>;
    /**
     * Get related content
     */
    getRelatedContent(contentId: string, limit?: number): Promise<UnifiedContent[]>;
    /**
     * Track content interaction
     */
    trackInteraction(contentId: string, userId: string, type: 'view' | 'like' | 'share' | 'comment' | 'rating', data?: any): Promise<void>;
    /**
     * Get content analytics
     */
    getContentAnalytics(contentId: string, dateFrom?: Date, dateTo?: Date): Promise<ContentAnalytics>;
    /**
     * Update content analytics (batch job)
     */
    private updateContentAnalytics;
    /**
     * Validate content
     */
    validateContent(content: UnifiedContent): Promise<ValidationResult>;
    /**
     * Attach tags to content
     */
    private attachTags;
    /**
     * Update tags for content
     */
    private updateTags;
    /**
     * Attach media to content
     */
    private attachMedia;
    /**
     * Update media for content
     */
    private updateMedia;
    /**
     * Invalidate content cache
     */
    private invalidateContentCache;
    /**
     * Notify author about content changes
     */
    private notifyAuthor;
    /**
     * Notify subscribers about new content
     */
    private notifySubscribers;
    /**
     * Get subscribers for a category
     */
    private getSubscribers;
    /**
     * Schedule social media sharing
     */
    private scheduleSocialSharing;
}
export declare const getContentService: () => UnifiedContentService;
export default UnifiedContentService;
//# sourceMappingURL=UnifiedContentService.d.ts.map