import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

/**
 * FinancialSnapshot Model
 * Stores daily and monthly financial summaries for quick reporting
 */

export interface FinancialSnapshotAttributes {
  id: string;
  
  // Snapshot Period
  snapshotType: 'daily' | 'monthly' | 'quarterly' | 'yearly';
  snapshotDate: Date;
  periodStart: Date;
  periodEnd: Date;
  
  // Revenue Metrics
  revenue: {
    newRevenue: number;
    recurringRevenue: number;
    expansionRevenue: number;
    contractionRevenue: number;
    churnedRevenue: number;
    totalRevenue: number;
    netRevenue: number; // After refunds
    
    // By Plan Type
    revenueByPlan: Record<string, number>;
    
    // By Payment Method
    revenueByPaymentMethod: Record<string, number>;
    
    // Geographic Distribution
    revenueByCountry: Record<string, number>;
  };
  
  // Subscription Metrics
  subscriptions: {
    newSubscriptions: number;
    activeSubscriptions: number;
    trialingSubscriptions: number;
    canceledSubscriptions: number;
    pausedSubscriptions: number;
    reactivatedSubscriptions: number;
    
    // By Plan
    subscriptionsByPlan: Record<string, number>;
    
    // Trial Conversions
    trialConversions: number;
    trialConversionRate: number;
    
    // Upgrades/Downgrades
    upgrades: number;
    downgrades: number;
  };
  
  // Financial Metrics
  metrics: {
    mrr: number; // Monthly Recurring Revenue
    arr: number; // Annual Recurring Revenue
    arpu: number; // Average Revenue Per User
    ltv: number; // Lifetime Value
    cac: number; // Customer Acquisition Cost
    
    // Growth Metrics
    mrrGrowthRate: number;
    mrrChurnRate: number;
    netMrrChurn: number;
    grossMrrChurn: number;
    
    // Unit Economics
    grossMargin: number;
    grossMarginPercentage: number;
    paybackPeriod: number; // in months
    ltvCacRatio: number;
  };
  
  // Cost Metrics
  costs: {
    infrastructureCosts: number;
    apiServicesCosts: number;
    personnelCosts: number;
    marketingCosts: number;
    developmentCosts: number;
    supportCosts: number;
    otherCosts: number;
    totalCosts: number;
    
    // Cost Breakdown
    costsByCategory: Record<string, number>;
    costsByVendor: Record<string, number>;
    
    // Cost Per User
    costPerUser: number;
    costPerActiveUser: number;
  };
  
  // P&L Summary
  profitLoss: {
    grossRevenue: number;
    netRevenue: number;
    totalCosts: number;
    grossProfit: number;
    grossProfitMargin: number;
    operatingExpenses: number;
    ebitda: number;
    netProfit: number;
    netProfitMargin: number;
  };
  
  // Cash Flow
  cashFlow: {
    startingBalance: number;
    cashInflow: number;
    cashOutflow: number;
    netCashFlow: number;
    endingBalance: number;
    runway: number; // months of runway
  };
  
  // User Metrics
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    churnedUsers: number;
    retentionRate: number;
    
    // Engagement
    avgSessionsPerUser: number;
    avgSessionDuration: number;
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
  };
  
  // Comparison to Previous Period
  comparison?: {
    revenueChange: number;
    revenueChangePercent: number;
    mrrChange: number;
    mrrChangePercent: number;
    userChange: number;
    userChangePercent: number;
    costChange: number;
    costChangePercent: number;
  };
  
  // Data Quality
  dataQuality: {
    completeness: number; // 0-100%
    accuracy: number; // 0-100%
    lastUpdated: Date;
    dataIssues: string[];
  };
  
  // Metadata
  calculatedBy: string;
  calculatedAt: Date;
  isFinalized: boolean;
  notes?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialSnapshotCreationAttributes extends Optional<FinancialSnapshotAttributes, 
  'id' | 'comparison' | 'notes' | 'createdAt' | 'updatedAt'> {}

export class FinancialSnapshot extends Model<FinancialSnapshotAttributes, FinancialSnapshotCreationAttributes> 
  implements FinancialSnapshotAttributes {
  
  public id!: string;
  
  public snapshotType!: 'daily' | 'monthly' | 'quarterly' | 'yearly';
  public snapshotDate!: Date;
  public periodStart!: Date;
  public periodEnd!: Date;
  
  public revenue!: {
    newRevenue: number;
    recurringRevenue: number;
    expansionRevenue: number;
    contractionRevenue: number;
    churnedRevenue: number;
    totalRevenue: number;
    netRevenue: number;
    revenueByPlan: Record<string, number>;
    revenueByPaymentMethod: Record<string, number>;
    revenueByCountry: Record<string, number>;
  };
  
  public subscriptions!: {
    newSubscriptions: number;
    activeSubscriptions: number;
    trialingSubscriptions: number;
    canceledSubscriptions: number;
    pausedSubscriptions: number;
    reactivatedSubscriptions: number;
    subscriptionsByPlan: Record<string, number>;
    trialConversions: number;
    trialConversionRate: number;
    upgrades: number;
    downgrades: number;
  };
  
  public metrics!: {
    mrr: number;
    arr: number;
    arpu: number;
    ltv: number;
    cac: number;
    mrrGrowthRate: number;
    mrrChurnRate: number;
    netMrrChurn: number;
    grossMrrChurn: number;
    grossMargin: number;
    grossMarginPercentage: number;
    paybackPeriod: number;
    ltvCacRatio: number;
  };
  
  public costs!: {
    infrastructureCosts: number;
    apiServicesCosts: number;
    personnelCosts: number;
    marketingCosts: number;
    developmentCosts: number;
    supportCosts: number;
    otherCosts: number;
    totalCosts: number;
    costsByCategory: Record<string, number>;
    costsByVendor: Record<string, number>;
    costPerUser: number;
    costPerActiveUser: number;
  };
  
  public profitLoss!: {
    grossRevenue: number;
    netRevenue: number;
    totalCosts: number;
    grossProfit: number;
    grossProfitMargin: number;
    operatingExpenses: number;
    ebitda: number;
    netProfit: number;
    netProfitMargin: number;
  };
  
  public cashFlow!: {
    startingBalance: number;
    cashInflow: number;
    cashOutflow: number;
    netCashFlow: number;
    endingBalance: number;
    runway: number;
  };
  
  public userMetrics!: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    churnedUsers: number;
    retentionRate: number;
    avgSessionsPerUser: number;
    avgSessionDuration: number;
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
  };
  
  public comparison?: {
    revenueChange: number;
    revenueChangePercent: number;
    mrrChange: number;
    mrrChangePercent: number;
    userChange: number;
    userChangePercent: number;
    costChange: number;
    costChangePercent: number;
  };
  
  public dataQuality!: {
    completeness: number;
    accuracy: number;
    lastUpdated: Date;
    dataIssues: string[];
  };
  
  public calculatedBy!: string;
  public calculatedAt!: Date;
  public isFinalized!: boolean;
  public notes?: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Check if snapshot is healthy (positive metrics)
   */
  public isHealthy(): boolean {
    return (
      this.metrics.mrrGrowthRate > 0 &&
      this.metrics.netMrrChurn < 5 &&
      this.profitLoss.grossMargin > 0 &&
      this.cashFlow.runway > 12
    );
  }

  /**
   * Get burn multiple (efficiency metric)
   */
  public getBurnMultiple(): number {
    const netNewArr = this.metrics.arr * (this.metrics.mrrGrowthRate / 100);
    const netBurn = this.cashFlow.cashOutflow - this.cashFlow.cashInflow;
    
    if (netNewArr === 0) return Infinity;
    return netBurn / netNewArr;
  }

  /**
   * Calculate Rule of 40 score
   */
  public getRuleOf40Score(): number {
    const growthRate = this.metrics.mrrGrowthRate;
    const profitMargin = this.profitLoss.netProfitMargin;
    return growthRate + profitMargin;
  }

  /**
   * Static method to get latest snapshot
   */
  static async getLatest(type: string): Promise<FinancialSnapshot | null> {
    return this.findOne({
      where: {
        snapshotType: type,
        isFinalized: true,
      },
      order: [['snapshotDate', 'DESC']],
    });
  }

  /**
   * Static method to get snapshots for a period
   */
  static async getForPeriod(
    startDate: Date,
    endDate: Date,
    type: string
  ): Promise<FinancialSnapshot[]> {
    return this.findAll({
      where: {
        snapshotType: type,
        snapshotDate: {
          [sequelize.Op.between]: [startDate, endDate],
        },
        isFinalized: true,
      },
      order: [['snapshotDate', 'ASC']],
    });
  }

  /**
   * Static method to calculate trends
   */
  static async calculateTrends(periods: number = 12): Promise<any> {
    const snapshots = await this.findAll({
      where: {
        snapshotType: 'monthly',
        isFinalized: true,
      },
      order: [['snapshotDate', 'DESC']],
      limit: periods,
    });
    
    if (snapshots.length < 2) return null;
    
    // Calculate various trends
    const trends = {
      mrrTrend: snapshots.map(s => ({ date: s.snapshotDate, value: s.metrics.mrr })),
      revenueTrend: snapshots.map(s => ({ date: s.snapshotDate, value: s.revenue.totalRevenue })),
      userTrend: snapshots.map(s => ({ date: s.snapshotDate, value: s.userMetrics.activeUsers })),
      marginTrend: snapshots.map(s => ({ date: s.snapshotDate, value: s.profitLoss.grossMarginPercentage })),
    };
    
    return trends;
  }
}

FinancialSnapshot.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    snapshotType: {
      type: DataTypes.ENUM('daily', 'monthly', 'quarterly', 'yearly'),
      allowNull: false,
    },
    snapshotDate: {
      type: DataTypes.DATE,
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
    revenue: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    subscriptions: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    metrics: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    costs: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    profitLoss: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    cashFlow: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    userMetrics: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    comparison: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    dataQuality: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    calculatedBy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    calculatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isFinalized: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'financial_snapshots',
    modelName: 'FinancialSnapshot',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['snapshotType', 'snapshotDate'],
        name: 'idx_financial_snapshots_unique',
      },
      {
        fields: ['snapshotType'],
        name: 'idx_financial_snapshots_type',
      },
      {
        fields: ['snapshotDate'],
        name: 'idx_financial_snapshots_date',
      },
      {
        fields: ['isFinalized'],
        name: 'idx_financial_snapshots_finalized',
      },
      {
        fields: ['periodStart', 'periodEnd'],
        name: 'idx_financial_snapshots_period',
      },
      {
        fields: [sequelize.literal("(metrics->>'mrr')::numeric")],
        name: 'idx_financial_snapshots_mrr',
      },
      {
        fields: [sequelize.literal("(revenue->>'totalRevenue')::numeric")],
        name: 'idx_financial_snapshots_revenue',
      },
    ],
  }
);

export default FinancialSnapshot; 