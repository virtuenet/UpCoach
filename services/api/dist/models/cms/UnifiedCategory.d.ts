/**
 * Unified Category Model
 * Consolidates Category, ContentCategory, and related category models
 */
import { Model, Sequelize, Optional } from 'sequelize';
export interface UnifiedCategoryAttributes {
    id: string;
    name: string;
    slug: string;
    description?: string;
    type: 'content' | 'course' | 'product' | 'general';
    parentId?: string;
    icon?: string;
    image?: string;
    color?: string;
    order?: number;
    isActive: boolean;
    metadata?: {
        contentCount?: number;
        viewCount?: number;
        seoTitle?: string;
        seoDescription?: string;
        keywords?: string[];
    };
    createdAt?: Date;
    updatedAt?: Date;
}
export interface UnifiedCategoryCreationAttributes extends Optional<UnifiedCategoryAttributes, 'id' | 'description' | 'parentId' | 'icon' | 'image' | 'color' | 'order' | 'isActive' | 'metadata' | 'createdAt' | 'updatedAt'> {
}
export declare class UnifiedCategory extends Model<UnifiedCategoryAttributes, UnifiedCategoryCreationAttributes> implements UnifiedCategoryAttributes {
    id: string;
    name: string;
    slug: string;
    description?: string;
    type: 'content' | 'course' | 'product' | 'general';
    parentId?: string;
    icon?: string;
    image?: string;
    color?: string;
    order?: number;
    isActive: boolean;
    metadata?: UnifiedCategoryAttributes['metadata'];
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly parent?: UnifiedCategory;
    readonly children?: UnifiedCategory[];
    static initialize(sequelize: Sequelize): void;
    static associate(): void;
}
export default UnifiedCategory;
//# sourceMappingURL=UnifiedCategory.d.ts.map