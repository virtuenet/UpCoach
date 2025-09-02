import { Model, Optional } from 'sequelize';
export interface ContentVersionAttributes {
    id: number;
    contentId: number;
    version: number;
    title: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    metadata?: any;
    changes?: string;
    createdBy: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ContentVersionCreationAttributes extends Optional<ContentVersionAttributes, 'id' | 'version' | 'excerpt' | 'featuredImage' | 'metadata' | 'changes' | 'createdAt' | 'updatedAt'> {
}
declare class ContentVersion extends Model<ContentVersionAttributes, ContentVersionCreationAttributes> implements ContentVersionAttributes {
    id: number;
    contentId: number;
    version: number;
    title: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    metadata?: any;
    changes?: string;
    createdBy: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default ContentVersion;
//# sourceMappingURL=ContentVersion.d.ts.map