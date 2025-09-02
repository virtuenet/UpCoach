import { Model, Optional } from 'sequelize';
export interface ContentInteractionAttributes {
    id: number;
    contentId: number;
    userId: number;
    interactionType: 'view' | 'like' | 'share' | 'save' | 'comment';
    metadata?: any;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ContentInteractionCreationAttributes extends Optional<ContentInteractionAttributes, 'id' | 'metadata' | 'createdAt' | 'updatedAt'> {
}
declare class ContentInteraction extends Model<ContentInteractionAttributes, ContentInteractionCreationAttributes> implements ContentInteractionAttributes {
    id: number;
    contentId: number;
    userId: number;
    interactionType: 'view' | 'like' | 'share' | 'save' | 'comment';
    metadata?: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default ContentInteraction;
//# sourceMappingURL=ContentInteraction.d.ts.map