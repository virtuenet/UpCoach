import { Model, DataTypes, Sequelize, Association } from 'sequelize';
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

export class Organization extends Model<OrganizationAttributes> implements OrganizationAttributes {
  declare id: number;
  public name!: string;
  public slug!: string;
  public ownerId?: number;
  public logoUrl?: string;
  public website?: string;
  public industry?: string;
  public size?: 'small' | 'medium' | 'large' | 'enterprise';
  public subscriptionTier!: 'team' | 'business' | 'enterprise';
  public billingEmail?: string;
  public billingAddress?: any;
  public settings?: any;
  public metadata?: any;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public readonly members?: User[];
  public readonly teams?: Team[];

  public static associations: {
    members: Association<Organization, User>;
    teams: Association<Organization, Team>;
  };

  public static initModel(sequelize: Sequelize): typeof Organization {
    Organization.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        ownerId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'owner_id',
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        logoUrl: {
          type: DataTypes.STRING(500),
          field: 'logo_url',
        },
        website: {
          type: DataTypes.STRING(500),
        },
        industry: {
          type: DataTypes.STRING(100),
        },
        size: {
          type: DataTypes.ENUM('small', 'medium', 'large', 'enterprise'),
        },
        subscriptionTier: {
          type: DataTypes.ENUM('team', 'business', 'enterprise'),
          allowNull: false,
          defaultValue: 'team',
          field: 'subscription_tier',
        },
        billingEmail: {
          type: DataTypes.STRING(255),
          field: 'billing_email',
        },
        billingAddress: {
          type: DataTypes.JSONB,
          field: 'billing_address',
        },
        settings: {
          type: DataTypes.JSONB,
          defaultValue: {},
        },
        metadata: {
          type: DataTypes.JSONB,
          defaultValue: {},
        },
      },
      {
        sequelize,
        modelName: 'Organization',
        tableName: 'organizations',
        underscored: true,
        timestamps: true,
      }
    );

    return Organization;
  }

  // Instance methods
  public hasFeature(feature: string): boolean {
    const tierFeatures: Record<string, string[]> = {
      team: ['basic_teams', 'shared_goals', 'basic_analytics'],
      business: ['unlimited_teams', 'advanced_analytics', 'api_access', 'custom_branding'],
      enterprise: [
        'sso',
        'audit_logs',
        'unlimited_teams',
        'dedicated_support',
        'custom_integrations',
      ],
    };

    const features = tierFeatures[this.subscriptionTier] || [];
    const customFeatures = this.settings?.features || [];

    return features.includes(feature) || customFeatures.includes(feature);
  }

  public canAddMoreMembers(currentCount: number): boolean {
    const limits: Record<string, number> = {
      team: 10,
      business: 100,
      enterprise: -1, // unlimited
    };

    const limit = limits[this.subscriptionTier] || 10;
    return limit === -1 || currentCount < limit;
  }

  public generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
