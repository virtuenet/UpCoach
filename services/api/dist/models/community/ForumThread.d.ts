import { Model, Sequelize } from 'sequelize';
export interface ForumThreadAttributes {
    id: string;
    categoryId: string;
    userId: string;
    title: string;
    content: string;
    tags?: string[];
    views: number;
    replyCount: number;
    lastReplyAt?: Date;
    isPinned: boolean;
    isLocked: boolean;
    isFeatured: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ForumThreadCreationAttributes extends Omit<ForumThreadAttributes, 'id' | 'views' | 'replyCount' | 'createdAt' | 'updatedAt'> {
}
export declare class ForumThread extends Model<ForumThreadAttributes, ForumThreadCreationAttributes> implements ForumThreadAttributes {
    id: string;
    categoryId: string;
    userId: string;
    title: string;
    content: string;
    tags?: string[];
    views: number;
    replyCount: number;
    lastReplyAt?: Date;
    isPinned: boolean;
    isLocked: boolean;
    isFeatured: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly category?: any;
    readonly user?: any;
    readonly posts?: any[];
    static associate(models: any): void;
    incrementViews(): Promise<void>;
}
declare const _default: (sequelize: Sequelize) => typeof ForumThread;
export default _default;
//# sourceMappingURL=ForumThread.d.ts.map