import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Sequelize,
} from 'sequelize';

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

export class RevenueAnalytics extends Model<
  InferAttributes<RevenueAnalytics>,
  InferCreationAttributes<RevenueAnalytics>
> {
  declare id: CreationOptional<string>;
  declare period: AnalyticsPeriod;
  declare periodStart: Date;
  declare periodEnd: Date;

  // Cohort Analysis
  declare cohortMonth: string; // Format: YYYY-MM
  declare cohortSize: number;
  declare monthsSinceStart: number;
  declare retentionRate: number;
  declare cohortRevenue: number;
  declare cumulativeCohortRevenue: number;

  // Revenue Segmentation
  declare revenueBySegment: {
    plan?: Record<string, number>;
    country?: Record<string, number>;
    acquisition?: Record<string, number>;
    industry?: Record<string, number>;
  } | null;

  // Customer Segments
  declare customerSegments: {
    highValue?: { count: number; revenue: number };
    mediumValue?: { count: number; revenue: number };
    lowValue?: { count: number; revenue: number };
    atRisk?: { count: number; revenue: number };
  } | null;

  // Expansion & Contraction
  declare expansionRevenue: number;
  declare expansionCount: number;
  declare contractionRevenue: number;
  declare contractionCount: number;

  // Forecasting
  declare forecastModel: ForecastModel | null;
  declare forecastedRevenue: number | null;
  declare forecastLowerBound: number | null;
  declare forecastUpperBound: number | null;
  declare forecastConfidence: number | null;
  declare forecastAccuracy: number | null;

  // Churn Prediction
  declare churnPrediction: {
    predictedChurnCount?: number;
    predictedChurnRevenue?: number;
    riskFactors?: string[];
    preventionRecommendations?: string[];
  } | null;

  // LTV Analysis
  declare averageLtv: number;
  declare ltvBySegment: Record<string, number> | null;
  declare ltvDistribution: {
    percentile25?: number;
    median?: number;
    percentile75?: number;
    percentile90?: number;
  } | null;

  // Feature Impact
  declare featureImpact: {
    feature: string;
    revenueImpact: number;
    userCount: number;
    adoptionRate: number;
  }[] | null;

  // Seasonality
  declare seasonalityFactors: {
    dayOfWeek?: Record<string, number>;
    monthOfYear?: Record<string, number>;
    holidays?: Record<string, number>;
  } | null;

  // Anomalies
  declare hasAnomaly: boolean;
  declare anomalyDetails: {
    type?: string;
    severity?: string;
    description?: string;
    impact?: number;
  } | null;

  // Metadata
  declare metadata: unknown;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

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
    return (this.forecastConfidence || 0) > 80 && (this.forecastAccuracy || 0) > 85;
  }

  // Static method declaration for lazy initialization
  static initializeModel: (sequelize: Sequelize) => typeof RevenueAnalytics;
}

// Static method for deferred initialization
RevenueAnalytics.initializeModel = function(sequelizeInstance: Sequelize) {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance required for RevenueAnalytics initialization');
  }

  return RevenueAnalytics.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      period: {
        type: DataTypes.ENUM(...Object.values(AnalyticsPeriod)),
        allowNull: false,
      },
      periodStart: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      periodEnd: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      // Cohort Analysis
      cohortMonth: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cohortSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      monthsSinceStart: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      retentionRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      cohortRevenue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      cumulativeCohortRevenue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      // Revenue Segmentation
      revenueBySegment: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      // Customer Segments
      customerSegments: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      // Expansion & Contraction
      expansionRevenue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      expansionCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      contractionRevenue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      contractionCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      // Forecasting
      forecastModel: {
        type: DataTypes.ENUM(...Object.values(ForecastModel)),
        allowNull: true,
      },
      forecastedRevenue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      forecastLowerBound: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      forecastUpperBound: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      forecastConfidence: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      forecastAccuracy: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      // Churn Prediction
      churnPrediction: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      // LTV Analysis
      averageLtv: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      ltvBySegment: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      ltvDistribution: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      // Feature Impact
      featureImpact: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      // Seasonality
      seasonalityFactors: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      // Anomalies
      hasAnomaly: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      anomalyDetails: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      // Metadata
      metadata: {
        type: DataTypes.JSONB,
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
      sequelize: sequelizeInstance,
      modelName: 'RevenueAnalytics',
      tableName: 'revenue_analytics',
      timestamps: true,
      indexes: [
        {
          fields: ['period'],
        },
        {
          fields: ['periodStart'],
        },
        {
          fields: ['cohortMonth'],
        },
      ],
    }
  );
};

// Comment out immediate initialization to prevent premature execution
// RevenueAnalytics.init(...) will be called via RevenueAnalytics.initializeModel() after database is ready

export default RevenueAnalytics;
