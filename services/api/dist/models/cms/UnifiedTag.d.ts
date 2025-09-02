/**
 * Unified Tag Model
 * Consolidates ContentTag and other tag models
 */
import { Model, Sequelize, Optional } from 'sequelize';
export interface UnifiedTagAttributes {
    id: string;
    name: string;
    slug: string;
    type: 'content' | 'skill' | 'topic' | 'general';
    color?: string;
    icon?: string;
    description?: string;
    usageCount: number;
    isActive: boolean;
    metadata?: {
        synonyms?: string[];
        relatedTags?: string[];
        priority?: number;
    };
    createdAt?: Date;
    updatedAt?: Date;
}
export interface UnifiedTagCreationAttributes extends Optional<UnifiedTagAttributes, 'id' | 'color' | 'icon' | 'description' | 'usageCount' | 'isActive' | 'metadata' | 'createdAt' | 'updatedAt'> {
}
export declare class UnifiedTag extends Model<UnifiedTagAttributes, UnifiedTagCreationAttributes> implements UnifiedTagAttributes {
    id: string;
    name: string;
    slug: string;
    type: 'content' | 'skill' | 'topic' | 'general';
    color?: string;
    icon?: string;
    description?: string;
    usageCount: number;
    isActive: boolean;
    metadata?: UnifiedTagAttributes['metadata'];
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initialize(sequelize: Sequelize): void;
}
export default UnifiedTag;
//# sourceMappingURL=UnifiedTag.d.ts.map