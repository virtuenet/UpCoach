import { Model, Optional } from 'sequelize';
export interface ArticleAttributes {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    categoryId: string;
    authorId: string;
    status: 'draft' | 'published' | 'archived';
    publishedAt: Date | null;
    featuredImage: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string[] | null;
    readTime: number;
    viewCount: number;
    shareCount: number;
    likeCount: number;
    metadata: {
        wordCount: number;
        lastEditedBy?: string;
        version: number;
        sources?: string[];
        difficulty?: 'beginner' | 'intermediate' | 'advanced';
        estimatedReadTime?: number;
    };
    settings: {
        allowComments: boolean;
        enableNotifications: boolean;
        isFeatured: boolean;
        isTemplate: boolean;
        templateCategory?: string;
    };
    publishingSchedule: {
        scheduledPublishAt: Date | null;
        timezone: string;
        autoPublish: boolean;
    };
    analytics: {
        avgReadTime: number;
        bounceRate: number;
        completionRate: number;
        engagementScore: number;
    };
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
export interface ArticleCreationAttributes extends Optional<ArticleAttributes, 'id' | 'slug' | 'viewCount' | 'shareCount' | 'likeCount' | 'readTime' | 'publishedAt' | 'featuredImage' | 'seoTitle' | 'seoDescription' | 'seoKeywords' | 'metadata' | 'settings' | 'publishingSchedule' | 'analytics' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
export declare class Article extends Model<ArticleAttributes, ArticleCreationAttributes> implements ArticleAttributes {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    categoryId: string;
    authorId: string;
    status: 'draft' | 'published' | 'archived';
    publishedAt: Date | null;
    featuredImage: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string[] | null;
    readTime: number;
    viewCount: number;
    shareCount: number;
    likeCount: number;
    metadata: ArticleAttributes['metadata'];
    settings: ArticleAttributes['settings'];
    publishingSchedule: ArticleAttributes['publishingSchedule'];
    analytics: ArticleAttributes['analytics'];
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt: Date | null;
    generateSlug(): Promise<string>;
    calculateReadTime(): Promise<number>;
    updateAnalytics(analytics: Partial<ArticleAttributes['analytics']>): Promise<void>;
    incrementViewCount(): Promise<void>;
    publish(): Promise<void>;
    archive(): Promise<void>;
    static getPublished(): Promise<Article[]>;
    static getFeatured(): Promise<Article[]>;
    static searchArticles(query: string, filters?: {
        category?: string;
        status?: string;
        author?: string;
        tags?: string[];
    }): Promise<Article[]>;
    static getPopular(limit?: number): Promise<Article[]>;
    static getByCategory(categoryId: string): Promise<Article[]>;
    static getDrafts(authorId?: string): Promise<Article[]>;
    static getScheduledForPublishing(): Promise<Article[]>;
}
export default Article;
//# sourceMappingURL=Article.d.ts.map