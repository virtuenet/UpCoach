export interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    categoryId: string;
    authorId: string;
    status: 'draft' | 'published' | 'archived';
    publishedAt: string | null;
    featuredImage: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string[];
    readTime: number;
    viewCount: number;
    shareCount: number;
    likeCount: number;
    metadata: {
        wordCount: number;
        version: number;
        lastEditedBy?: string;
        sources?: string[];
        difficulty?: 'beginner' | 'intermediate' | 'advanced';
    };
    settings: {
        allowComments: boolean;
        enableNotifications: boolean;
        isFeatured: boolean;
        isTemplate: boolean;
    };
    analytics: {
        avgReadTime: number;
        bounceRate: number;
        completionRate: number;
        engagementScore: number;
    };
    createdAt: string;
    updatedAt: string;
    category?: {
        id: string;
        name: string;
        slug: string;
    };
    author?: {
        id: string;
        fullName: string;
    };
}
export interface GetArticlesParams {
    search?: string;
    status?: string;
    category?: string;
    author?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
export interface CreateArticleData {
    title: string;
    excerpt: string;
    content: string;
    categoryId: string;
    status?: 'draft' | 'published';
    featuredImage?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    settings?: {
        allowComments?: boolean;
        enableNotifications?: boolean;
        isFeatured?: boolean;
        isTemplate?: boolean;
    };
    publishingSchedule?: {
        scheduledPublishAt?: string | null;
        timezone?: string;
        autoPublish?: boolean;
    };
}
export interface ArticlesResponse {
    data: Article[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
    };
}
export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    level: number;
    path: string;
    isActive: boolean;
}
export declare const contentApi: {
    getArticles: (params?: GetArticlesParams) => Promise<ArticlesResponse>;
    getArticle: (id: string, trackView?: boolean) => Promise<Article>;
    createArticle: (data: CreateArticleData) => Promise<Article>;
    updateArticle: (id: string, data: Partial<CreateArticleData>) => Promise<Article>;
    deleteArticle: (id: string) => Promise<void>;
    publishArticle: (id: string) => Promise<Article>;
    archiveArticle: (id: string) => Promise<Article>;
    searchArticles: (query: string, filters?: {
        category?: string;
        status?: string;
        author?: string;
        tags?: string[];
    }) => Promise<Article[]>;
    getPopularArticles: (limit?: number, timeframe?: string) => Promise<Article[]>;
    getArticleAnalytics: (id: string) => Promise<{
        article: {
            id: string;
            title: string;
            status: string;
            publishedAt: string | null;
        };
        analytics: {
            totalViews: number;
            uniqueUsers: number;
            averageReadTime: number;
            completionRate: number;
            engagementScore: number;
            topReferrers: string[];
            deviceBreakdown: Record<string, number>;
            locationBreakdown: Record<string, number>;
        };
    }>;
    getCategories: () => Promise<Category[]>;
    createCategory: (data: {
        name: string;
        description?: string;
        parentId?: string;
    }) => Promise<Category>;
};
//# sourceMappingURL=content.d.ts.map