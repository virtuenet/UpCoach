import { DataTypes, Model, Optional } from 'sequelize';

import { sequelize } from '../../config/sequelize';

export interface SystemMetricsAttributes {
  id: string;
  metricDate: Date;
  systemName: string;
  uptime: number;
  downtime: number;
  incidents: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
  performanceMetrics: unknown;
  securityMetrics: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface SystemMetricsCreationAttributes extends Optional<SystemMetricsAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class SystemMetrics extends Model<SystemMetricsAttributes, SystemMetricsCreationAttributes>
  implements SystemMetricsAttributes {
  public id!: string;
  public metricDate!: Date;
  public systemName!: string;
  public uptime!: number;
  public downtime!: number;
  public incidents!: number;
  public responseTime!: number;
  public throughput!: number;
  public errorRate!: number;
  public availability!: number;
  public performanceMetrics!: unknown;
  public securityMetrics!: unknown;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SystemMetrics.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    metricDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    systemName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uptime: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    downtime: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    incidents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    responseTime: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    throughput: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    errorRate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    availability: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    performanceMetrics: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    securityMetrics: {
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
    modelName: 'SystemMetrics',
    tableName: 'system_metrics',
    timestamps: true,
  }
);