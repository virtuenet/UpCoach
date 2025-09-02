import { Model, Sequelize, Association, Optional } from 'sequelize';
import { Content } from './Content';
export interface ContentTagAttributes {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    isActive: boolean;
    usageCount: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ContentTagCreationAttributes extends Optional<ContentTagAttributes, 'id' | 'description' | 'color' | 'usageCount' | 'createdAt' | 'updatedAt'> {
}
export declare class ContentTag extends Model<ContentTagAttributes, ContentTagCreationAttributes> implements ContentTagAttributes {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    isActive: boolean;
    usageCount: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly contents?: Content[];
    static associations: {
        contents: Association<ContentTag, Content>;
    };
    static initialize(sequelize: Sequelize): void;
    static associate(): void;
}
//# sourceMappingURL=ContentTag.d.ts.map