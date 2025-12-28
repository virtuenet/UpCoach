import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

export interface DashboardAttributes {
  id: string;
  tenantId: string;
  userId?: string;
  name: string;
  description?: string;
  type: 'user' | 'coach' | 'organization' | 'admin';
  widgets: any[];
  isPublic: boolean;
  settings: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardCreationAttributes
  extends Optional<DashboardAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Dashboard
  extends Model<DashboardAttributes, DashboardCreationAttributes>
  implements DashboardAttributes
{
  public id!: string;
  public tenantId!: string;
  public userId?: string;
  public name!: string;
  public description?: string;
  public type!: 'user' | 'coach' | 'organization' | 'admin';
  public widgets!: any[];
  public isPublic!: boolean;
  public settings!: Record<string, any>;
  public createdBy!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Dashboard.init(
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
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('user', 'coach', 'organization', 'admin'),
      allowNull: false,
    },
    widgets: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
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
    tableName: 'dashboards',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['userId'] },
      { fields: ['type'] },
    ],
  }
);

export default Dashboard;
