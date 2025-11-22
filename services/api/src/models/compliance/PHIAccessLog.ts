import { DataTypes, Model, Optional } from 'sequelize';

import { sequelize } from '../../config/sequelize';

export interface PHIAccessLogAttributes {
  id: string;
  userId: string;
  accessedBy: string;
  phiType: string;
  action: 'view' | 'create' | 'update' | 'delete' | 'export';
  accessReason: string;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  dataFields?: string[];
  expiresAt?: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceFlags?: string[];
  auditTrail: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface PHIAccessLogCreationAttributes extends Optional<PHIAccessLogAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class PHIAccessLog extends Model<PHIAccessLogAttributes, PHIAccessLogCreationAttributes>
  implements PHIAccessLogAttributes {
  public id!: string;
  public userId!: string;
  public accessedBy!: string;
  public phiType!: string;
  public action!: 'view' | 'create' | 'update' | 'delete' | 'export';
  public accessReason!: string;
  public ipAddress!: string;
  public userAgent!: string;
  public sessionId?: string;
  public dataFields?: string[];
  public expiresAt?: Date;
  public riskLevel!: 'low' | 'medium' | 'high' | 'critical';
  public complianceFlags?: string[];
  public auditTrail!: unknown;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PHIAccessLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    accessedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    phiType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM('view', 'create', 'update', 'delete', 'export'),
      allowNull: false,
    },
    accessReason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dataFields: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    riskLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'low',
    },
    complianceFlags: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    auditTrail: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'PHIAccessLog',
    tableName: 'phi_access_logs',
    timestamps: true,
  }
);