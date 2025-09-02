import { Model, Sequelize } from 'sequelize';
export interface ForumPostAttributes {
    id: string;
    threadId: string;
    userId: string;
    parentId?: string;
    content: string;
    isSolution: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    editCount: number;
    lastEditedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ForumPostCreationAttributes extends Omit<ForumPostAttributes, 'id' | 'isSolution' | 'isDeleted' | 'editCount' | 'createdAt' | 'updatedAt'> {
}
export declare class ForumPost extends Model<ForumPostAttributes, ForumPostCreationAttributes> implements ForumPostAttributes {
    id: string;
    threadId: string;
    userId: string;
    parentId?: string;
    content: string;
    isSolution: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    editCount: number;
    lastEditedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    voteScore?: number;
    userVote?: number;
    readonly thread?: any;
    readonly user?: any;
    readonly parent?: any;
    readonly replies?: any[];
    readonly votes?: any[];
    static associate(models: any): void;
}
declare const _default: (sequelize: Sequelize) => typeof ForumPost;
export default _default;
//# sourceMappingURL=ForumPost.d.ts.map