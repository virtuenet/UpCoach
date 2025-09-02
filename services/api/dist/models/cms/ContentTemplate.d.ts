import { Model, Optional } from 'sequelize';
export interface ContentTemplateAttributes {
    id: number;
    name: string;
    description?: string;
    category: string;
    structure: any;
    thumbnail?: string;
    isActive: boolean;
    usageCount: number;
    createdBy: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ContentTemplateCreationAttributes extends Optional<ContentTemplateAttributes, 'id' | 'description' | 'thumbnail' | 'isActive' | 'usageCount' | 'createdAt' | 'updatedAt'> {
}
declare class ContentTemplate extends Model<ContentTemplateAttributes, ContentTemplateCreationAttributes> implements ContentTemplateAttributes {
    id: number;
    name: string;
    description?: string;
    category: string;
    structure: any;
    thumbnail?: string;
    isActive: boolean;
    usageCount: number;
    createdBy: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default ContentTemplate;
//# sourceMappingURL=ContentTemplate.d.ts.map