import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  Index,
} from 'sequelize-typescript';

export enum AnalyticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum ForecastModel {
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  ARIMA = 'arima',
  PROPHET = 'prophet',
  ENSEMBLE = 'ensemble',
}

@Table({
  tableName: 'revenue_analytics',
  timestamps: true,
})
export class RevenueAnalytics extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.ENUM(...Object.values(AnalyticsPeriod)),
    allowNull: false,
  })
  @Index
  period!: AnalyticsPeriod;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  @Index
  periodStart!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  periodEnd!: Date;

  // Cohort Analysis
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  @Index
  cohortMonth!: string; // Format: YYYY-MM

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  cohortSize!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  monthsSinceStart!: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
  })
  retentionRate!: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  })
  cohortRevenue!: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  })
  cumulativeCohortRevenue!: number;

  // Revenue Segmentation
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  revenueBySegment?: {
    plan?: Record<string, number>;
    country?: Record<string, number>;
    acquisition?: Record<string, number>;
    industry?: Record<string, number>;
  };

  // Customer Segments
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  customerSegments?: {
    highValue?: { count: number; revenue: number };
    mediumValue?: { count: number; revenue: number };
    lowValue?: { count: number; revenue: number };
    atRisk?: { count: number; revenue: number };
  };

  // Expansion & Contraction
  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  })
  expansionRevenue!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  expansionCount!: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  })
  contractionRevenue!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  contractionCount!: number;

  // Forecasting
  @Column({
    type: DataType.ENUM(...Object.values(ForecastModel)),
    allowNull: true,
  })
  forecastModel?: ForecastModel;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
  })
  forecastedRevenue?: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
  })
  forecastLowerBound?: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
  })
  forecastUpperBound?: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  forecastConfidence?: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  forecastAccuracy?: number;

  // Churn Prediction
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  churnPrediction?: {
    predictedChurnCount?: number;
    predictedChurnRevenue?: number;
    riskFactors?: string[];
    preventionRecommendations?: string[];
  };

  // LTV Analysis
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  averageLtv!: number;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  ltvBySegment?: Record<string, number>;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  ltvDistribution?: {
    percentile25?: number;
    median?: number;
    percentile75?: number;
    percentile90?: number;
  };

  // Feature Impact
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  featureImpact?: {
    feature: string;
    revenueImpact: number;
    userCount: number;
    adoptionRate: number;
  }[];

  // Seasonality
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  seasonalityFactors?: {
    dayOfWeek?: Record<string, number>;
    monthOfYear?: Record<string, number>;
    holidays?: Record<string, number>;
  };

  // Anomalies
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  hasAnomaly!: boolean;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  anomalyDetails?: {
    type?: string;
    severity?: string;
    description?: string;
    impact?: number;
  };

  // Metadata
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata?: any;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Calculated properties
  get netExpansionRevenue(): number {
    return this.expansionRevenue - this.contractionRevenue;
  }

  get expansionRate(): number {
    if (this.cohortRevenue === 0) return 0;
    return (this.expansionRevenue / this.cohortRevenue) * 100;
  }

  get contractionRate(): number {
    if (this.cohortRevenue === 0) return 0;
    return (this.contractionRevenue / this.cohortRevenue) * 100;
  }

  get isForecastReliable(): boolean {
    return (this.forecastConfidence || 0) > 80 && 
           (this.forecastAccuracy || 0) > 85;
  }
} 