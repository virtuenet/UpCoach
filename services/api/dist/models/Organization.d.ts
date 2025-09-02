import { Model, Sequelize, Association } from 'sequelize';
import { User } from './User';
import { Team } from './Team';
export interface OrganizationAttributes {
    id?: number;
    name: string;
    slug: string;
    ownerId?: number;
    logoUrl?: string;
    website?: string;
    industry?: string;
    size?: 'small' | 'medium' | 'large' | 'enterprise';
    subscriptionTier: 'team' | 'business' | 'enterprise';
    billingEmail?: string;
    billingAddress?: any;
    settings?: any;
    metadata?: any;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class Organization extends Model<OrganizationAttributes> implements OrganizationAttributes {
    id: number;
    name: string;
    slug: string;
    ownerId?: number;
    logoUrl?: string;
    website?: string;
    industry?: string;
    size?: 'small' | 'medium' | 'large' | 'enterprise';
    subscriptionTier: 'team' | 'business' | 'enterprise';
    billingEmail?: string;
    billingAddress?: any;
    settings?: any;
    metadata?: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly members?: User[];
    readonly teams?: Team[];
    static associations: {
        members: Association<Organization, User>;
        teams: Association<Organization, Team>;
    };
    static initModel(sequelize: Sequelize): typeof Organization;
    hasFeature(feature: string): boolean;
    canAddMoreMembers(currentCount: number): boolean;
    generateSlug(name: string): string;
}
//# sourceMappingURL=Organization.d.ts.map