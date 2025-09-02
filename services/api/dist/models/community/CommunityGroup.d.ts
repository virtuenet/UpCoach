import { Model, Sequelize } from 'sequelize';
export interface CommunityGroupAttributes {
    id: string;
    name: string;
    slug: string;
    description?: string;
    category?: string;
    tags?: string[];
    coverImage?: string;
    avatarUrl?: string;
    isPrivate: boolean;
    requiresApproval: boolean;
    memberCount: number;
    postCount: number;
    rules?: string;
    welcomeMessage?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CommunityGroupCreationAttributes extends Omit<CommunityGroupAttributes, 'id' | 'memberCount' | 'postCount' | 'createdAt' | 'updatedAt'> {
}
export declare class CommunityGroup extends Model<CommunityGroupAttributes, CommunityGroupCreationAttributes> implements CommunityGroupAttributes {
    id: string;
    name: string;
    slug: string;
    description?: string;
    category?: string;
    tags?: string[];
    coverImage?: string;
    avatarUrl?: string;
    isPrivate: boolean;
    requiresApproval: boolean;
    memberCount: number;
    postCount: number;
    rules?: string;
    welcomeMessage?: string;
    createdBy: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly creator?: any;
    readonly members?: any[];
    readonly posts?: any[];
    static associate(models: any): void;
}
declare const _default: (sequelize: Sequelize) => typeof CommunityGroup;
export default _default;
//# sourceMappingURL=CommunityGroup.d.ts.map