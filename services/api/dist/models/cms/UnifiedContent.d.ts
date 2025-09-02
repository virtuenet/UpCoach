/**
 * Unified Content Model
 * Consolidates Article, Content, ContentArticle, Course, Template, and other CMS models
 * into a single flexible content system with discriminated types
 */
import { Model, Sequelize, Association, Optional } from 'sequelize';
import { User } from '../User';
export type ContentType = 'article' | 'guide' | 'exercise' | 'lesson' | 'tip' | 'course' | 'template' | 'page' | 'faq' | 'announcement';
export type ContentStatus = 'draft' | 'published' | 'scheduled' | 'archived' | 'review' | 'expired';
export type ContentFormat = 'markdown' | 'html' | 'rich-text' | 'video' | 'audio' | 'interactive';
export interface UnifiedContentAttributes {
    id: string;
    type: ContentType;
    format: ContentFormat;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    status: ContentStatus;
    authorId: string;
    categoryId?: string;
    parentId?: string;
    order?: number;
    featuredImageUrl?: string;
    thumbnailUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
    attachments?: Array<{
        id: string;
        url: string;
        type: string;
        name: string;
        size: number;
    }>;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    canonicalUrl?: string;
    publishedAt?: Date;
    scheduledAt?: Date;
    expiresAt?: Date;
    viewCount: number;
    likeCount: number;
    shareCount: number;
    commentCount: number;
    readingTime?: number;
    completionRate?: number;
    avgRating?: number;
    ratingCount?: number;
    isPremium: boolean;
    isPrivate: boolean;
    requiredRoles?: string[];
    requiredTags?: string[];
    courseData?: {
        duration?: number;
        difficulty?: 'beginner' | 'intermediate' | 'advanced';
        prerequisites?: string[];
        objectives?: string[];
        certificateEnabled?: boolean;
        maxEnrollments?: number;
        currentEnrollments?: number;
        modules?: Array<{
            id: string;
            title: string;
            description: string;
            lessonsCount: number;
            duration: number;
        }>;
    };
    templateData?: {
        category?: string;
        variables?: Record<string, any>;
        previewData?: any;
        usageCount?: number;
        lastUsedAt?: Date;
    };
    faqData?: {
        question?: string;
        answer?: string;
        category?: string;
        helpful?: number;
        notHelpful?: number;
    };
    settings?: {
        allowComments?: boolean;
        allowSharing?: boolean;
        showAuthor?: boolean;
        showDate?: boolean;
        showReadingTime?: boolean;
        enableNotifications?: boolean;
        autoTranslate?: boolean;
        customCss?: string;
        customJs?: string;
    };
    version: number;
    versionHistory?: Array<{
        version: number;
        changedBy: string;
        changedAt: Date;
        changes: string;
    }>;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}
export interface UnifiedContentCreationAttributes extends Optional<UnifiedContentAttributes, 'id' | 'format' | 'excerpt' | 'categoryId' | 'parentId' | 'order' | 'featuredImageUrl' | 'thumbnailUrl' | 'videoUrl' | 'audioUrl' | 'attachments' | 'metaTitle' | 'metaDescription' | 'metaKeywords' | 'canonicalUrl' | 'publishedAt' | 'scheduledAt' | 'expiresAt' | 'viewCount' | 'likeCount' | 'shareCount' | 'commentCount' | 'readingTime' | 'completionRate' | 'avgRating' | 'ratingCount' | 'isPremium' | 'isPrivate' | 'requiredRoles' | 'requiredTags' | 'courseData' | 'templateData' | 'faqData' | 'settings' | 'version' | 'versionHistory' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
export declare class UnifiedContent extends Model<UnifiedContentAttributes, UnifiedContentCreationAttributes> implements UnifiedContentAttributes {
    id: string;
    type: ContentType;
    format: ContentFormat;
    title: string;
    slug: string;
    content: string;
    status: ContentStatus;
    authorId: string;
    viewCount: number;
    likeCount: number;
    shareCount: number;
    commentCount: number;
    isPremium: boolean;
    isPrivate: boolean;
    version: number;
    excerpt?: string;
    categoryId?: string;
    parentId?: string;
    order?: number;
    featuredImageUrl?: string;
    thumbnailUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
    attachments?: UnifiedContentAttributes['attachments'];
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    canonicalUrl?: string;
    publishedAt?: Date;
    scheduledAt?: Date;
    expiresAt?: Date;
    readingTime?: number;
    completionRate?: number;
    avgRating?: number;
    ratingCount?: number;
    requiredRoles?: string[];
    requiredTags?: string[];
    courseData?: UnifiedContentAttributes['courseData'];
    templateData?: UnifiedContentAttributes['templateData'];
    faqData?: UnifiedContentAttributes['faqData'];
    settings?: UnifiedContentAttributes['settings'];
    versionHistory?: UnifiedContentAttributes['versionHistory'];
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt: Date | null;
    readonly author?: User;
    readonly category?: any;
    readonly parent?: UnifiedContent;
    readonly children?: UnifiedContent[];
    readonly tags?: any[];
    readonly media?: any[];
    readonly comments?: any[];
    readonly interactions?: any[];
    setTags: (tags: any[]) => Promise<void>;
    getTags: () => Promise<any[]>;
    addTag: (tag: any) => Promise<void>;
    removeTag: (tag: any) => Promise<void>;
    static associations: {
        author: Association<UnifiedContent, User>;
        parent: Association<UnifiedContent, UnifiedContent>;
        children: Association<UnifiedContent, UnifiedContent>;
    };
    /**
     * Generate unique slug
     */
    generateSlug(): Promise<string>;
    /**
     * Calculate reading time
     */
    calculateReadingTime(): number;
    /**
     * Publish content
     */
    publish(): Promise<void>;
    /**
     * Archive content
     */
    archive(): Promise<void>;
    /**
     * Increment view count
     */
    incrementViewCount(): Promise<void>;
    /**
     * Create new version
     */
    createVersion(changedBy: string, changes: string): Promise<void>;
    /**
     * Get published content
     */
    static getPublished(type?: ContentType): Promise<UnifiedContent[]>;
    /**
     * Get featured content
     */
    static getFeatured(limit?: number): Promise<UnifiedContent[]>;
    /**
     * Search content
     */
    static search(query: string, filters?: {
        type?: ContentType;
        status?: ContentStatus;
        category?: string;
        author?: string;
        tags?: string[];
        isPremium?: boolean;
    }): Promise<UnifiedContent[]>;
    /**
     * Get popular content
     */
    static getPopular(limit?: number, type?: ContentType): Promise<UnifiedContent[]>;
    /**
     * Get scheduled content ready for publishing
     */
    static getScheduledForPublishing(): Promise<UnifiedContent[]>;
    /**
     * Get expired content
     */
    static getExpired(): Promise<UnifiedContent[]>;
    /**
     * Initialize the model
     */
    static initialize(sequelize: Sequelize): void;
    /**
     * Set up associations
     */
    static associate(): void;
}
export default UnifiedContent;
//# sourceMappingURL=UnifiedContent.d.ts.map