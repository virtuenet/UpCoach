import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../../config/database';

export enum SnapshotPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export class FinancialSnapshot extends Model<
  InferAttributes<FinancialSnapshot>,
  InferCreationAttributes<FinancialSnapshot>
> {
  declare id: CreationOptional<string>;
  declare date: Date;
  declare period: SnapshotPeriod;

  // Revenue Metrics
  declare revenue: number;
  declare recurringRevenue: number;
  declare oneTimeRevenue: number;
  declare mrr: number;
  declare arr: number;
  declare newMrr: number;
  declare expansionMrr: number;
  declare contractionMrr: number;
  declare churnedMrr: number;
  declare netMrrGrowth: number;

  // Cost Metrics
  declare totalCosts: number;
  declare infrastructureCosts: number;
  declare apiCosts: number;
  declare personnelCosts: number;
  declare marketingCosts: number;
  declare operationalCosts: number;

  // Profit Metrics
  declare grossProfit: number;
  declare netProfit: number;
  declare grossMargin: number;
  declare netMargin: number;

  // Customer Metrics
  declare totalCustomers: number;
  declare activeCustomers: number;
  declare newCustomers: number;
  declare churnedCustomers: number;
  declare churnRate: number;
  declare avgRevenuePerUser: number;
  declare customerAcquisitionCost: number;
  declare customerLifetimeValue: number;

  // Subscription Metrics
  declare totalSubscriptions: number;
  declare newSubscriptions: number;
  declare canceledSubscriptions: number;
  declare trialSubscriptions: number;
  declare trialConversionRate: number;

  // Transaction Metrics
  declare totalTransactions: number;
  declare successfulTransactions: number;
  declare failedTransactions: number;
  declare refundedTransactions: number;
  declare refundAmount: number;

  // Unit Economics
  declare costPerUser: number;
  declare revenuePerUser: number;
  declare profitPerUser: number;
  declare ltvToCacRatio: number;
  declare paybackPeriodDays: number;

  // Metadata
  declare metadata: unknown;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Calculated properties
  get mrrGrowthRate(): number {
    if (this.mrr === 0) return 0;
    return (this.netMrrGrowth / this.mrr) * 100;
  }

  get operatingMargin(): number {
    if (this.revenue === 0) return 0;
    return ((this.revenue - this.operationalCosts) / this.revenue) * 100;
  }

  get isHealthy(): boolean {
    return this.netProfit > 0 && this.churnRate < 10 && this.ltvToCacRatio > 3;
  }
}

// Initialize model
// Initialize model - skip in test environment to prevent "No Sequelize instance passed" errors
// Jest mocks will handle model initialization in tests
if (process.env.NODE_ENV !== 'test') {
FinancialSnapshot.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    period: {
      type: DataTypes.ENUM(...Object.values(SnapshotPeriod)),
      allowNull: false,
    },

    // Revenue Metrics
    revenue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    recurringRevenue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    oneTimeRevenue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    mrr: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    arr: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    newMrr: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    expansionMrr: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    contractionMrr: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    churnedMrr: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    netMrrGrowth: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // Cost Metrics
    totalCosts: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    infrastructureCosts: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    apiCosts: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    personnelCosts: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    marketingCosts: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    operationalCosts: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // Profit Metrics
    grossProfit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    netProfit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    grossMargin: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    netMargin: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // Customer Metrics
    totalCustomers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    activeCustomers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    newCustomers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    churnedCustomers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    churnRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    avgRevenuePerUser: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    customerAcquisitionCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    customerLifetimeValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // Subscription Metrics
    totalSubscriptions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    newSubscriptions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    canceledSubscriptions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    trialSubscriptions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    trialConversionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // Transaction Metrics
    totalTransactions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    successfulTransactions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    failedTransactions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    refundedTransactions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    refundAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // Unit Economics
    costPerUser: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    revenuePerUser: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    profitPerUser: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    ltvToCacRatio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    paybackPeriodDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    sequelize,
    modelName: 'FinancialSnapshot',
    tableName: 'financial_snapshots',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['date', 'period'],
      },
      {
        fields: ['date'],
      },
      {
        fields: ['period'],
      },
    ],
  }
);
}

export default FinancialSnapshot;
