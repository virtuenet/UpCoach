import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

export interface AggregatedMetricAttributes {
  id: string;
  tenantId: string;
  metricName: string;
  metricValue: number;
  dimensions: Record<string, any>;
  timeBucket: Date;
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  createdAt: Date;
}

export interface AggregatedMetricCreationAttributes
  extends Optional<AggregatedMetricAttributes, 'id' | 'createdAt'> {}

export class AggregatedMetric
  extends Model<AggregatedMetricAttributes, AggregatedMetricCreationAttributes>
  implements AggregatedMetricAttributes
{
  public id!: string;
  public tenantId!: string;
  public metricName!: string;
  public metricValue!: number;
  public dimensions!: Record<string, any>;
  public timeBucket!: Date;
  public granularity!: 'hourly' | 'daily' | 'weekly' | 'monthly';
  public createdAt!: Date;
}

AggregatedMetric.init(
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
    metricName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    metricValue: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
    },
    dimensions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    timeBucket: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    granularity: {
      type: DataTypes.ENUM('hourly', 'daily', 'weekly', 'monthly'),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'aggregated_metrics',
    timestamps: false,
    indexes: [
      { fields: ['tenantId', 'metricName', 'timeBucket'] },
      { fields: ['granularity', 'timeBucket'] },
    ],
  }
);

export default AggregatedMetric;
