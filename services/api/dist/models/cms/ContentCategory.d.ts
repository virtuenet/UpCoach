import { Model, Sequelize, Association, Optional } from 'sequelize';
import { Content } from './Content';
export interface ContentCategoryAttributes {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    icon?: string;
    color?: string;
    order?: number;
    isActive: boolean;
    metadata?: {
        seoTitle?: string;
        seoDescription?: string;
        keywords?: string[];
    };
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ContentCategoryCreationAttributes extends Optional<ContentCategoryAttributes, 'id' | 'description' | 'parentId' | 'icon' | 'color' | 'order' | 'metadata' | 'createdAt' | 'updatedAt'> {
}
export declare class ContentCategory extends Model<ContentCategoryAttributes, ContentCategoryCreationAttributes> implements ContentCategoryAttributes {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    icon?: string;
    color?: string;
    order?: number;
    isActive: boolean;
    metadata?: {
        seoTitle?: string;
        seoDescription?: string;
        keywords?: string[];
    };
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly contents?: Content[];
    readonly parent?: ContentCategory;
    readonly children?: ContentCategory[];
    static associations: {
        contents: Association<ContentCategory, Content>;
        parent: Association<ContentCategory, ContentCategory>;
        children: Association<ContentCategory, ContentCategory>;
    };
    static initialize(sequelize: Sequelize): void;
    static associate(): void;
}
//# sourceMappingURL=ContentCategory.d.ts.map