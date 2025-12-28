import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

/**
 * Organization Attributes
 */
export interface OrganizationAttributes {
  id: string;
  tenantId: string; // For multi-tenant isolation
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  description?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  settings: {
    features: Record<string, boolean>;
    branding: Record<string, any>;
    integrations: Record<string, any>;
  };
  billingInfo?: {
    plan: string;
    status: 'active' | 'trial' | 'suspended';
    billingEmail: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationCreationAttributes
  extends Optional<OrganizationAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

/**
 * Organization Model
 */
export class Organization
  extends Model<OrganizationAttributes, OrganizationCreationAttributes>
  implements OrganizationAttributes
{
  public id!: string;
  public tenantId!: string;
  public name!: string;
  public slug!: string;
  public domain?: string;
  public logo?: string;
  public description?: string;
  public industry?: string;
  public size?: 'small' | 'medium' | 'large' | 'enterprise';
  public settings!: {
    features: Record<string, boolean>;
    branding: Record<string, any>;
    integrations: Record<string, any>;
  };
  public billingInfo?: {
    plan: string;
    status: 'active' | 'trial' | 'suspended';
    billingEmail: string;
  };
  public metadata?: Record<string, any>;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Organization.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    size: {
      type: DataTypes.ENUM('small', 'medium', 'large', 'enterprise'),
      allowNull: true,
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        features: {},
        branding: {},
        integrations: {},
      },
    },
    billingInfo: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'organizations',
    timestamps: true,
    indexes: [
      {
        fields: ['tenantId'],
      },
      {
        fields: ['slug'],
        unique: true,
      },
    ],
  }
);

export default Organization;
