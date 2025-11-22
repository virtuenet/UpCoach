/**
 * Budget Model for Financial Planning and Cost Control
 */

import { Model, DataTypes, Optional, Association } from 'sequelize';
import { sequelize } from '../../config/sequelize';
import { CostCategory } from './CostTracking';

export enum BudgetPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export interface BudgetAttributes {
  id: string;
  organizationId?: string;
  category: CostCategory;
  period: BudgetPeriod;
  year: number;
  month?: number; // 1-12, required for monthly budgets
  quarter?: number; // 1-4, required for quarterly budgets
  budgetedAmount: number;
  currency: string;
  isActive: boolean;
  notes?: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BudgetCreationAttributes
  extends Optional<
    BudgetAttributes,
    'id' | 'organizationId' | 'month' | 'quarter' | 'notes' | 'createdAt' | 'updatedAt'
  > {}

export class Budget extends Model<BudgetAttributes, BudgetCreationAttributes> implements BudgetAttributes {
  public id!: string;
  public organizationId?: string;
  public category!: CostCategory;
  public period!: BudgetPeriod;
  public year!: number;
  public month?: number;
  public quarter?: number;
  public budgetedAmount!: number;
  public currency!: string;
  public isActive!: boolean;
  public notes?: string;
  public createdBy!: string;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // associations
  public static associations: {
    // Add associations here when needed
  };

  /**
   * Get budget for a specific category and time period
   */
  static async getBudgetForPeriod(
    category: CostCategory,
    year: number,
    month?: number,
    quarter?: number,
    organizationId?: string
  ): Promise<Budget | null> {
    const where: unknown = {
      category,
      year,
      isActive: true,
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (month) {
      where.period = BudgetPeriod.MONTHLY;
      where.month = month;
    } else if (quarter) {
      where.period = BudgetPeriod.QUARTERLY;
      where.quarter = quarter;
    } else {
      where.period = BudgetPeriod.YEARLY;
    }

    return Budget.findOne({ where });
  }

  /**
   * Get all active budgets for an organization
   */
  static async getActiveBudgets(organizationId?: string): Promise<Budget[]> {
    const where: unknown = { isActive: true };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    return Budget.findAll({
      where,
      order: [['category', 'ASC'], ['period', 'ASC']],
    });
  }

  /**
   * Calculate budget utilization percentage
   */
  async getBudgetUtilization(actualSpent: number): Promise<{
    utilizationPercentage: number;
    remainingBudget: number;
    isOverBudget: boolean;
  }> {
    const utilizationPercentage = (actualSpent / this.budgetedAmount) * 100;
    const remainingBudget = this.budgetedAmount - actualSpent;
    const isOverBudget = actualSpent > this.budgetedAmount;

    return {
      utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
      remainingBudget: Math.round(remainingBudget * 100) / 100,
      isOverBudget,
    };
  }

  /**
   * Get budget period description
   */
  getPeriodDescription(): string {
    switch (this.period) {
      case BudgetPeriod.MONTHLY:
        return `${this.year}-${String(this.month).padStart(2, '0')}`;
      case BudgetPeriod.QUARTERLY:
        return `${this.year} Q${this.quarter}`;
      case BudgetPeriod.YEARLY:
        return String(this.year);
      default:
        return 'Unknown period';
    }
  }
}

Budget.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id',
      },
    },
    category: {
      type: DataTypes.ENUM(...Object.values(CostCategory)),
      allowNull: false,
    },
    period: {
      type: DataTypes.ENUM(...Object.values(BudgetPeriod)),
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2020,
        max: 2100,
      },
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 12,
      },
    },
    quarter: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 4,
      },
    },
    budgetedAmount: {
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
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Budget',
    tableName: 'budgets',
    timestamps: true,
    indexes: [
      {
        fields: ['category', 'period', 'year', 'month', 'quarter'],
        unique: true,
        where: {
          isActive: true,
        },
      },
      {
        fields: ['organizationId'],
      },
      {
        fields: ['createdBy'],
      },
    ],
    validate: {
      periodValidation() {
        if (this.period === BudgetPeriod.MONTHLY && !this.month) {
          throw new Error('Month is required for monthly budgets');
        }
        if (this.period === BudgetPeriod.QUARTERLY && !this.quarter) {
          throw new Error('Quarter is required for quarterly budgets');
        }
        if (this.period === BudgetPeriod.YEARLY && (this.month || this.quarter)) {
          throw new Error('Month and quarter should not be set for yearly budgets');
        }
      },
    },
  }
);

export default Budget;