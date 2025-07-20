import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

/**
 * RevenueAnalytics Model
 * Advanced revenue analytics, forecasting, and cohort analysis
 */

export interface RevenueAnalyticsAttributes {
  id: string;
  
  // Analysis Type
  analysisType: 'forecast' | 'cohort' | 'segment' | 'product' | 'channel' | 'geographic';
  analysisName: string;
  description: string;
  
  // Time Period
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  
  // Cohort Analysis (if type is 'cohort')
  cohortData?: {
    cohortMonth: string;
    cohortSize: number;
    retentionRates: number[]; // Month 0, 1, 2, etc.
    revenueByMonth: number[];
    ltv: number;
    paybackPeriod: number;
    
    // Cohort Metrics
    avgRevenuePerUser: number[];
    churnRates: number[];
    expansionRevenue: number[];
  };
  
  // Revenue Forecast (if type is 'forecast')
  forecastData?: {
    method: 'linear' | 'exponential' | 'seasonal' | 'ml_based';
    historicalPeriods: number;
    forecastPeriods: number;
    
    // Predictions
    predictions: {
      date: Date;
      predictedRevenue: number;
      lowerBound: number; // Confidence interval
      upperBound: number;
      confidenceLevel: number; // e.g., 0.95 for 95%
    }[];
    
    // Model Metrics
    accuracy: number;
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
    r2Score: number;
    
    // Factors
    seasonalityFactors?: number[];
    trendComponent?: number;
    assumptions?: string[];
  };
  
  // Segment Analysis (if type is 'segment')
  segmentData?: {
    segmentBy: 'plan' | 'industry' | 'company_size' | 'user_type' | 'custom';
    segments: {
      name: string;
      revenue: number;
      userCount: number;
      arpu: number;
      growthRate: number;
      churnRate: number;
      ltv: number;
      contribution: number; // % of total revenue
    }[];
  };
  
  // Product Analysis (if type is 'product')
  productData?: {
    products: {
      id: string;
      name: string;
      revenue: number;
      unitsSold: number;
      avgPrice: number;
      growthRate: number;
      attachRate: number; // % of users with this product
      crossSellRate: number;
    }[];
  };
  
  // Channel Analysis (if type is 'channel')
  channelData?: {
    channels: {
      name: string;
      revenue: number;
      conversions: number;
      conversionRate: number;
      cac: number;
      ltv: number;
      roi: number;
    }[];
  };
  
  // Geographic Analysis (if type is 'geographic')
  geographicData?: {
    regions: {
      country: string;
      region: string;
      revenue: number;
      userCount: number;
      arpu: number;
      growthRate: number;
      marketShare: number;
      taxRate: number;
      netRevenue: number;
    }[];
  };
  
  // Key Insights
  insights: {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    risks: string[];
    opportunities: string[];
  };
  
  // Performance Metrics
  metrics: {
    totalRevenue: number;
    growthRate: number;
    avgOrderValue: number;
    conversionRate: number;
    retentionRate: number;
    expansionRate: number;
    netRevenueRetention: number;
  };
  
  // Data Quality
  dataQuality: {
    completeness: number;
    sampleSize: number;
    confidenceScore: number;
    dataIssues: string[];
  };
  
  // Metadata
  createdBy: string;
  isPublished: boolean;
  publishedAt?: Date;
  tags: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface RevenueAnalyticsCreationAttributes extends Optional<RevenueAnalyticsAttributes, 
  'id' | 'cohortData' | 'forecastData' | 'segmentData' | 'productData' | 'channelData' |
  'geographicData' | 'publishedAt' | 'createdAt' | 'updatedAt'> {}

export class RevenueAnalytics extends Model<RevenueAnalyticsAttributes, RevenueAnalyticsCreationAttributes> 
  implements RevenueAnalyticsAttributes {
  
  public id!: string;
  
  public analysisType!: 'forecast' | 'cohort' | 'segment' | 'product' | 'channel' | 'geographic';
  public analysisName!: string;
  public description!: string;
  
  public periodType!: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  public startDate!: Date;
  public endDate!: Date;
  
  public cohortData?: {
    cohortMonth: string;
    cohortSize: number;
    retentionRates: number[];
    revenueByMonth: number[];
    ltv: number;
    paybackPeriod: number;
    avgRevenuePerUser: number[];
    churnRates: number[];
    expansionRevenue: number[];
  };
  
  public forecastData?: {
    method: 'linear' | 'exponential' | 'seasonal' | 'ml_based';
    historicalPeriods: number;
    forecastPeriods: number;
    predictions: {
      date: Date;
      predictedRevenue: number;
      lowerBound: number;
      upperBound: number;
      confidenceLevel: number;
    }[];
    accuracy: number;
    mape: number;
    rmse: number;
    r2Score: number;
    seasonalityFactors?: number[];
    trendComponent?: number;
    assumptions?: string[];
  };
  
  public segmentData?: {
    segmentBy: 'plan' | 'industry' | 'company_size' | 'user_type' | 'custom';
    segments: {
      name: string;
      revenue: number;
      userCount: number;
      arpu: number;
      growthRate: number;
      churnRate: number;
      ltv: number;
      contribution: number;
    }[];
  };
  
  public productData?: {
    products: {
      id: string;
      name: string;
      revenue: number;
      unitsSold: number;
      avgPrice: number;
      growthRate: number;
      attachRate: number;
      crossSellRate: number;
    }[];
  };
  
  public channelData?: {
    channels: {
      name: string;
      revenue: number;
      conversions: number;
      conversionRate: number;
      cac: number;
      ltv: number;
      roi: number;
    }[];
  };
  
  public geographicData?: {
    regions: {
      country: string;
      region: string;
      revenue: number;
      userCount: number;
      arpu: number;
      growthRate: number;
      marketShare: number;
      taxRate: number;
      netRevenue: number;
    }[];
  };
  
  public insights!: {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    risks: string[];
    opportunities: string[];
  };
  
  public metrics!: {
    totalRevenue: number;
    growthRate: number;
    avgOrderValue: number;
    conversionRate: number;
    retentionRate: number;
    expansionRate: number;
    netRevenueRetention: number;
  };
  
  public dataQuality!: {
    completeness: number;
    sampleSize: number;
    confidenceScore: number;
    dataIssues: string[];
  };
  
  public createdBy!: string;
  public isPublished!: boolean;
  public publishedAt?: Date;
  public tags!: string[];
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Get forecast accuracy status
   */
  public getForecastAccuracyStatus(): 'excellent' | 'good' | 'fair' | 'poor' {
    if (!this.forecastData) return 'poor';
    
    const accuracy = this.forecastData.accuracy;
    if (accuracy >= 0.95) return 'excellent';
    if (accuracy >= 0.85) return 'good';
    if (accuracy >= 0.70) return 'fair';
    return 'poor';
  }

  /**
   * Calculate cohort lifetime value
   */
  public calculateCohortLTV(): number | null {
    if (!this.cohortData) return null;
    
    const totalRevenue = this.cohortData.revenueByMonth.reduce((sum, rev) => sum + rev, 0);
    return totalRevenue / this.cohortData.cohortSize;
  }

  /**
   * Get best performing segment
   */
  public getBestSegment(): any | null {
    if (!this.segmentData) return null;
    
    return this.segmentData.segments.reduce((best, segment) => {
      const score = segment.ltv * segment.growthRate / (segment.churnRate || 1);
      const bestScore = best.ltv * best.growthRate / (best.churnRate || 1);
      return score > bestScore ? segment : best;
    });
  }

  /**
   * Static method to get latest forecast
   */
  static async getLatestForecast(): Promise<RevenueAnalytics | null> {
    return this.findOne({
      where: {
        analysisType: 'forecast',
        isPublished: true,
      },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Static method to get cohort analysis by month
   */
  static async getCohortAnalysis(cohortMonth: string): Promise<RevenueAnalytics | null> {
    return this.findOne({
      where: {
        analysisType: 'cohort',
        [sequelize.Op.and]: [
          sequelize.literal(`cohort_data->>'cohortMonth' = '${cohortMonth}'`),
        ],
      },
    });
  }

  /**
   * Static method to generate revenue forecast
   */
  static async generateForecast(months: number = 6): Promise<any> {
    // This would integrate with forecasting algorithms
    // Placeholder for actual implementation
    const historicalData = await sequelize.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(amount - refunded_amount) as revenue
      FROM transactions
      WHERE status = 'completed'
        AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month
    `);
    
    // Apply forecasting algorithm (simplified linear regression)
    // In production, this would use more sophisticated methods
    return {
      method: 'linear',
      predictions: [],
      accuracy: 0.85,
    };
  }
}

RevenueAnalytics.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    analysisType: {
      type: DataTypes.ENUM('forecast', 'cohort', 'segment', 'product', 'channel', 'geographic'),
      allowNull: false,
    },
    analysisName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    periodType: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    cohortData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    forecastData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    segmentData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    productData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    channelData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    geographicData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    insights: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    metrics: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    dataQuality: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'revenue_analytics',
    modelName: 'RevenueAnalytics',
    timestamps: true,
    indexes: [
      {
        fields: ['analysisType'],
        name: 'idx_revenue_analytics_type',
      },
      {
        fields: ['isPublished'],
        name: 'idx_revenue_analytics_published',
      },
      {
        fields: ['startDate', 'endDate'],
        name: 'idx_revenue_analytics_period',
      },
      {
        fields: ['createdBy'],
        name: 'idx_revenue_analytics_creator',
      },
      {
        fields: ['tags'],
        using: 'GIN',
        name: 'idx_revenue_analytics_tags',
      },
      {
        fields: [sequelize.literal("(metrics->>'totalRevenue')::numeric")],
        name: 'idx_revenue_analytics_revenue',
      },
    ],
  }
);

export default RevenueAnalytics; 