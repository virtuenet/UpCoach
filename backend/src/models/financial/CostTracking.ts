import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

/**
 * CostTracking Model
 * Tracks all operational costs and expenses for financial analysis
 */

export interface CostTrackingAttributes {
  id: string;
  
  // Cost Details
  category: 'infrastructure' | 'api_services' | 'personnel' | 'marketing' | 'development' | 
           'support' | 'legal' | 'accounting' | 'office' | 'other';
  subcategory?: string;
  vendor: string;
  description: string;
  
  // Financial Information
  amount: number;
  currency: string;
  taxAmount: number;
  totalAmount: number;
  
  // Billing Information
  billingPeriod: 'one_time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  billingStartDate: Date;
  billingEndDate?: Date;
  
  // Cost Allocation
  allocationMethod: 'direct' | 'per_user' | 'per_transaction' | 'percentage' | 'custom';
  allocationDetails?: {
    users?: number;
    transactions?: number;
    percentage?: number;
    customFormula?: string;
  };
  
  // Department & Project
  department?: string;
  projectId?: string;
  projectName?: string;
  costCenter?: string;
  
  // Usage Based Costs
  usageMetrics?: {
    unit: string;
    quantity: number;
    unitCost: number;
    totalUnits?: number;
  };
  
  // Budget Information
  budgetId?: string;
  budgetCategory?: string;
  isOverBudget: boolean;
  budgetVariance: number;
  
  // Approval & Tracking
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  approvedBy?: string;
  approvedAt?: Date;
  invoiceNumber?: string;
  invoiceDate?: Date;
  paymentDate?: Date;
  paymentMethod?: string;
  
  // Recurring Cost Information
  isRecurring: boolean;
  recurringId?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  contractValue?: number;
  
  // Cost Optimization
  optimizationPotential?: {
    identified: boolean;
    savingsAmount?: number;
    savingsPercentage?: number;
    recommendations?: string[];
  };
  
  // Metadata
  tags: string[];
  notes?: string;
  attachments?: string[];
  metadata?: Record<string, any>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface CostTrackingCreationAttributes extends Optional<CostTrackingAttributes, 
  'id' | 'subcategory' | 'billingEndDate' | 'allocationDetails' | 'department' | 
  'projectId' | 'projectName' | 'costCenter' | 'usageMetrics' | 'budgetId' | 
  'budgetCategory' | 'approvedBy' | 'approvedAt' | 'invoiceNumber' | 'invoiceDate' |
  'paymentDate' | 'paymentMethod' | 'recurringId' | 'contractStartDate' | 'contractEndDate' |
  'contractValue' | 'optimizationPotential' | 'notes' | 'attachments' | 'metadata' |
  'createdAt' | 'updatedAt'> {}

export class CostTracking extends Model<CostTrackingAttributes, CostTrackingCreationAttributes> 
  implements CostTrackingAttributes {
  
  public id!: string;
  
  public category!: 'infrastructure' | 'api_services' | 'personnel' | 'marketing' | 'development' | 
                   'support' | 'legal' | 'accounting' | 'office' | 'other';
  public subcategory?: string;
  public vendor!: string;
  public description!: string;
  
  public amount!: number;
  public currency!: string;
  public taxAmount!: number;
  public totalAmount!: number;
  
  public billingPeriod!: 'one_time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  public billingStartDate!: Date;
  public billingEndDate?: Date;
  
  public allocationMethod!: 'direct' | 'per_user' | 'per_transaction' | 'percentage' | 'custom';
  public allocationDetails?: {
    users?: number;
    transactions?: number;
    percentage?: number;
    customFormula?: string;
  };
  
  public department?: string;
  public projectId?: string;
  public projectName?: string;
  public costCenter?: string;
  
  public usageMetrics?: {
    unit: string;
    quantity: number;
    unitCost: number;
    totalUnits?: number;
  };
  
  public budgetId?: string;
  public budgetCategory?: string;
  public isOverBudget!: boolean;
  public budgetVariance!: number;
  
  public status!: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  public approvedBy?: string;
  public approvedAt?: Date;
  public invoiceNumber?: string;
  public invoiceDate?: Date;
  public paymentDate?: Date;
  public paymentMethod?: string;
  
  public isRecurring!: boolean;
  public recurringId?: string;
  public contractStartDate?: Date;
  public contractEndDate?: Date;
  public contractValue?: number;
  
  public optimizationPotential?: {
    identified: boolean;
    savingsAmount?: number;
    savingsPercentage?: number;
    recommendations?: string[];
  };
  
  public tags!: string[];
  public notes?: string;
  public attachments?: string[];
  public metadata?: Record<string, any>;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Calculate cost per user for this expense
   */
  public async calculateCostPerUser(): Promise<number> {
    if (this.allocationMethod === 'per_user' && this.allocationDetails?.users) {
      return this.totalAmount / this.allocationDetails.users;
    }
    
    // Get total active users from database
    const activeUsers = 1000; // This would be fetched from User model
    return this.totalAmount / activeUsers;
  }

  /**
   * Get monthly cost for recurring expenses
   */
  public getMonthlyCost(): number {
    if (!this.isRecurring) return 0;
    
    switch (this.billingPeriod) {
      case 'monthly':
        return this.totalAmount;
      case 'quarterly':
        return this.totalAmount / 3;
      case 'yearly':
        return this.totalAmount / 12;
      case 'weekly':
        return this.totalAmount * 4.33; // Average weeks per month
      case 'daily':
        return this.totalAmount * 30;
      case 'hourly':
        return this.totalAmount * 24 * 30;
      default:
        return 0;
    }
  }

  /**
   * Get annual cost
   */
  public getAnnualCost(): number {
    return this.getMonthlyCost() * 12;
  }

  /**
   * Check if cost is within budget
   */
  public isWithinBudget(): boolean {
    return !this.isOverBudget && this.budgetVariance >= 0;
  }

  /**
   * Calculate days until contract renewal
   */
  public getDaysUntilRenewal(): number | null {
    if (!this.contractEndDate) return null;
    
    const now = new Date();
    const diffTime = this.contractEndDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Static method to get total costs by category
   */
  static async getCostsByCategory(startDate: Date, endDate: Date): Promise<Record<string, number>> {
    const costs = await this.findAll({
      attributes: [
        'category',
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'total'],
      ],
      where: {
        billingStartDate: {
          [sequelize.Op.between]: [startDate, endDate],
        },
        status: ['approved', 'paid'],
      },
      group: ['category'],
    });
    
    return costs.reduce((acc, cost) => {
      acc[cost.category] = parseFloat(cost.getDataValue('total') || '0');
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Static method to calculate burn rate
   */
  static async calculateBurnRate(months: number = 3): Promise<number> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    const totalCosts = await this.sum('totalAmount', {
      where: {
        billingStartDate: {
          [sequelize.Op.between]: [startDate, endDate],
        },
        status: ['approved', 'paid'],
      },
    });
    
    return (totalCosts || 0) / months;
  }

  /**
   * Static method to identify cost optimization opportunities
   */
  static async findOptimizationOpportunities(): Promise<CostTracking[]> {
    return this.findAll({
      where: {
        [sequelize.Op.or]: [
          { 'optimizationPotential.identified': true },
          { isOverBudget: true },
          {
            budgetVariance: {
              [sequelize.Op.lt]: -0.1, // 10% over budget
            },
          },
        ],
      },
      order: [['totalAmount', 'DESC']],
    });
  }
}

CostTracking.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    category: {
      type: DataTypes.ENUM('infrastructure', 'api_services', 'personnel', 'marketing', 
                          'development', 'support', 'legal', 'accounting', 'office', 'other'),
      allowNull: false,
    },
    subcategory: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vendor: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    billingPeriod: {
      type: DataTypes.ENUM('one_time', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
      allowNull: false,
    },
    billingStartDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    billingEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    allocationMethod: {
      type: DataTypes.ENUM('direct', 'per_user', 'per_transaction', 'percentage', 'custom'),
      allowNull: false,
      defaultValue: 'direct',
    },
    allocationDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    projectName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    costCenter: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    usageMetrics: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    budgetId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    budgetCategory: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isOverBudget: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    budgetVariance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    invoiceDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    recurringId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Links recurring costs together',
    },
    contractStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    contractEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    contractValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    optimizationPotential: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    sequelize,
    tableName: 'cost_tracking',
    modelName: 'CostTracking',
    timestamps: true,
    indexes: [
      {
        fields: ['category'],
        name: 'idx_cost_tracking_category',
      },
      {
        fields: ['vendor'],
        name: 'idx_cost_tracking_vendor',
      },
      {
        fields: ['status'],
        name: 'idx_cost_tracking_status',
      },
      {
        fields: ['billingStartDate'],
        name: 'idx_cost_tracking_billing_start',
      },
      {
        fields: ['department'],
        name: 'idx_cost_tracking_department',
      },
      {
        fields: ['isRecurring'],
        name: 'idx_cost_tracking_recurring',
      },
      {
        fields: ['recurringId'],
        name: 'idx_cost_tracking_recurring_id',
      },
      {
        fields: ['isOverBudget'],
        name: 'idx_cost_tracking_over_budget',
      },
      {
        fields: ['category', 'status'],
        name: 'idx_cost_tracking_category_status',
      },
      {
        fields: ['tags'],
        using: 'GIN',
        name: 'idx_cost_tracking_tags',
      },
    ],
  }
);

export default CostTracking; 