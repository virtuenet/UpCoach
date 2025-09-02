import { Model, Optional } from 'sequelize';
export interface CategoryAttributes {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    level: number;
    path: string;
    iconUrl: string | null;
    colorCode: string | null;
    isActive: boolean;
    sortOrder: number;
    metadata: {
        articlesCount: number;
        coursesCount: number;
        totalViews: number;
        isPopular: boolean;
        isFeatured: boolean;
    };
    seo: {
        title: string | null;
        description: string | null;
        keywords: string[];
    };
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
export interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'slug' | 'description' | 'parentId' | 'level' | 'path' | 'iconUrl' | 'colorCode' | 'isActive' | 'sortOrder' | 'metadata' | 'seo' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
export declare class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    level: number;
    path: string;
    iconUrl: string | null;
    colorCode: string | null;
    isActive: boolean;
    sortOrder: number;
    metadata: CategoryAttributes['metadata'];
    seo: CategoryAttributes['seo'];
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt: Date | null;
    generateSlug(): Promise<string>;
    generatePath(): Promise<string>;
    updateMetadata(): Promise<void>;
    getChildren(): Promise<Category[]>;
    getParent(): Promise<Category | null>;
    getAllDescendants(): Promise<Category[]>;
    getAncestors(): Promise<Category[]>;
    getBreadcrumb(): Promise<{
        id: string;
        name: string;
        slug: string;
    }[]>;
    static getRootCategories(): Promise<Category[]>;
    static getTreeStructure(): Promise<any[]>;
    static getPopular(limit?: number): Promise<Category[]>;
    static getFeatured(): Promise<Category[]>;
    static searchCategories(query: string): Promise<Category[]>;
    static findBySlug(slug: string): Promise<Category | null>;
    static getByLevel(level: number): Promise<Category[]>;
    static reorderCategories(categoryIds: string[]): Promise<void>;
}
export default Category;
//# sourceMappingURL=Category.d.ts.map