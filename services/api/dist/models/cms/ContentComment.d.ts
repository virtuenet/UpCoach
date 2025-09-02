import { Model, Optional } from 'sequelize';
export interface ContentCommentAttributes {
    id: number;
    contentId: number;
    userId: number;
    parentId?: number;
    comment: string;
    status: 'pending' | 'approved' | 'rejected' | 'flagged';
    likes: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ContentCommentCreationAttributes extends Optional<ContentCommentAttributes, 'id' | 'parentId' | 'status' | 'likes' | 'createdAt' | 'updatedAt'> {
}
declare class ContentComment extends Model<ContentCommentAttributes, ContentCommentCreationAttributes> implements ContentCommentAttributes {
    id: number;
    contentId: number;
    userId: number;
    parentId?: number;
    comment: string;
    status: 'pending' | 'approved' | 'rejected' | 'flagged';
    likes: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default ContentComment;
//# sourceMappingURL=ContentComment.d.ts.map