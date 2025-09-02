import { Model, Sequelize } from 'sequelize';
export interface ForumCategoryAttributes {
    id: string;
    name: string;
    description?: string;
    slug: string;
    icon?: string;
    color?: string;
    orderIndex: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ForumCategoryCreationAttributes extends Omit<ForumCategoryAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class ForumCategory extends Model<ForumCategoryAttributes, ForumCategoryCreationAttributes> implements ForumCategoryAttributes {
    id: string;
    name: string;
    description?: string;
    slug: string;
    icon?: string;
    color?: string;
    orderIndex: number;
    isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly threads?: any[];
    static associate(models: any): void;
}
declare const _default: (sequelize: Sequelize) => typeof ForumCategory;
export default _default;
//# sourceMappingURL=ForumCategory.d.ts.map