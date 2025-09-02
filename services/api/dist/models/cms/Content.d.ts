import { Model, Sequelize, Association, Optional } from 'sequelize';
import { User } from '../User';
import { ContentCategory } from './ContentCategory';
import { ContentTag } from './ContentTag';
import { ContentMedia } from './ContentMedia';
export interface ContentAttributes {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    type: 'article' | 'guide' | 'exercise' | 'lesson' | 'tip';
    status: 'draft' | 'published' | 'scheduled' | 'archived';
    categoryId?: string;
    authorId: string;
    featuredImageUrl?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    publishedAt?: Date;
    scheduledAt?: Date;
    readingTime?: number;
    viewCount: number;
    likeCount: number;
    shareCount: number;
    isPremium: boolean;
    order?: number;
    settings?: {
        allowComments?: boolean;
        showAuthor?: boolean;
        showDate?: boolean;
        showReadingTime?: boolean;
    };
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ContentCreationAttributes extends Optional<ContentAttributes, 'id' | 'excerpt' | 'categoryId' | 'featuredImageUrl' | 'metaTitle' | 'metaDescription' | 'metaKeywords' | 'publishedAt' | 'scheduledAt' | 'readingTime' | 'viewCount' | 'likeCount' | 'shareCount' | 'order' | 'settings' | 'createdAt' | 'updatedAt'> {
}
export declare class Content extends Model<ContentAttributes, ContentCreationAttributes> implements ContentAttributes {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    type: 'article' | 'guide' | 'exercise' | 'lesson' | 'tip';
    status: 'draft' | 'published' | 'scheduled' | 'archived';
    categoryId?: string;
    authorId: string;
    featuredImageUrl?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    publishedAt?: Date;
    scheduledAt?: Date;
    readingTime?: number;
    viewCount: number;
    likeCount: number;
    shareCount: number;
    isPremium: boolean;
    order?: number;
    settings?: {
        allowComments?: boolean;
        showAuthor?: boolean;
        showDate?: boolean;
        showReadingTime?: boolean;
    };
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly author?: User;
    readonly category?: ContentCategory;
    readonly tags?: ContentTag[];
    readonly media?: ContentMedia[];
    setTags: (tags: ContentTag[]) => Promise<void>;
    getTags: () => Promise<ContentTag[]>;
    addTag: (tag: ContentTag) => Promise<void>;
    removeTag: (tag: ContentTag) => Promise<void>;
    static associations: {
        author: Association<Content, User>;
        category: Association<Content, ContentCategory>;
        tags: Association<Content, ContentTag>;
        media: Association<Content, ContentMedia>;
    };
    static initialize(sequelize: Sequelize): void;
    static associate(): void;
}
//# sourceMappingURL=Content.d.ts.map