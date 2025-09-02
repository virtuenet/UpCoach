import { Model, Optional, BelongsToGetAssociationMixin } from 'sequelize';
import { User } from '../User';
import { ContentCategory } from './ContentCategory';
import ContentVersion from './ContentVersion';
import ContentComment from './ContentComment';
import ContentInteraction from './ContentInteraction';
export interface ArticleContent {
    format: 'markdown' | 'html' | 'structured';
    body: string;
    sections?: Array<{
        id: string;
        type: string;
        title?: string;
        content: any;
    }>;
}
export interface ContentArticleAttributes {
    id: number;
    slug: string;
    title: string;
    summary?: string;
    content: string | ArticleContent;
    authorId: number;
    categoryId: number;
    featuredImage?: string;
    tags: string[];
    status: 'draft' | 'review' | 'published' | 'archived';
    visibility: 'public' | 'members' | 'premium';
    publishDate?: Date;
    readTime?: number;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    allowComments: boolean;
    isPinned: boolean;
    lastModifiedBy?: number;
    metadata?: any;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ContentArticleCreationAttributes extends Optional<ContentArticleAttributes, 'id' | 'summary' | 'featuredImage' | 'tags' | 'status' | 'visibility' | 'publishDate' | 'readTime' | 'viewCount' | 'likeCount' | 'commentCount' | 'shareCount' | 'seoTitle' | 'seoDescription' | 'seoKeywords' | 'allowComments' | 'isPinned' | 'lastModifiedBy' | 'metadata' | 'createdAt' | 'updatedAt'> {
}
export declare class ContentArticle extends Model<ContentArticleAttributes, ContentArticleCreationAttributes> implements ContentArticleAttributes {
    id: number;
    slug: string;
    title: string;
    summary?: string;
    content: string | ArticleContent;
    authorId: number;
    categoryId: number;
    featuredImage?: string;
    tags: string[];
    status: 'draft' | 'review' | 'published' | 'archived';
    visibility: 'public' | 'members' | 'premium';
    publishDate?: Date;
    readTime?: number;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    allowComments: boolean;
    isPinned: boolean;
    lastModifiedBy?: number;
    metadata?: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly author?: User;
    readonly category?: ContentCategory;
    readonly versions?: ContentVersion[];
    readonly comments?: ContentComment[];
    readonly interactions?: ContentInteraction[];
    getAuthor: BelongsToGetAssociationMixin<User>;
    createVersion(userId: number, changeSummary?: string): Promise<ContentVersion>;
    canEdit(userId: number, userRole?: string): boolean;
    calculateReadTime(): Promise<number>;
    isPublished(): boolean;
    incrementViewCount(): Promise<void>;
    canPublish(userRole?: string): boolean;
    publish(): Promise<void>;
    unpublish(): Promise<void>;
    static associate(models: any): void;
}
export default ContentArticle;
//# sourceMappingURL=ContentArticle.d.ts.map