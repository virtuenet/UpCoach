import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../../config/database';

export enum CostCategory {
  INFRASTRUCTURE = 'infrastructure',
  API_SERVICES = 'api_services',
  PERSONNEL = 'personnel',
  MARKETING = 'marketing',
  OPERATIONS = 'operations',
  DEVELOPMENT = 'development',
  LEGAL = 'legal',
  OTHER = 'other',
}

export enum CostType {
  FIXED = 'fixed',
  VARIABLE = 'variable',
  ONE_TIME = 'one_time',
}

export enum CostProvider {
  AWS = 'aws',
  GOOGLE_CLOUD = 'google_cloud',
  AZURE = 'azure',
  OPENAI = 'openai',
  STRIPE = 'stripe',
  TWILIO = 'twilio',
  SENDGRID = 'sendgrid',
  OTHER = 'other',
}

export class CostTracking extends Model<
  InferAttributes<CostTracking>,
  InferCreationAttributes<CostTracking>
> {
  declare id: CreationOptional<string>;
  declare category: CostCategory;
  declare type: CostType;
  declare provider: CostProvider | null;
  declare name: string;
  declare description: string | null;
  declare amount: number;
  declare currency: string;
  declare periodStart: Date;
  declare periodEnd: Date;
  declare quantity: number | null;
  declare unit: string | null;
  declare unitCost: number | null;
  declare invoiceNumber: string | null;
  declare vendorId: string | null;
  declare department: string | null;
  declare project: string | null;
  declare tags: string[] | null;
  declare isRecurring: boolean;
  declare recurringInterval: string | null;
  declare nextBillingDate: Date | null;
  declare isApproved: boolean;
  declare approvedBy: string | null;
  declare approvedAt: Date | null;
  declare metadata: unknown;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Calculated properties
  get dailyCost(): number {
    const days = Math.ceil(
      (this.periodEnd.getTime() - this.periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 ? this.amount / days : 0;
  }

  get monthlyCost(): number {
    const days = Math.ceil(
      (this.periodEnd.getTime() - this.periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 ? (this.amount / days) * 30 : 0;
  }

  get isOverBudget(): boolean {
    // This would be compared against budget data
    return false; // Placeholder
  }
}

// Initialize model
// Initialize model - skip in test environment to prevent "No Sequelize instance passed" errors
// Jest mocks will handle model initialization in tests
if (process.env.NODE_ENV !== 'test') {
CostTracking.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    category: {
      type: DataTypes.ENUM(...Object.values(CostCategory)),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(CostType)),
      allowNull: false,
      defaultValue: CostType.VARIABLE,
    },
    provider: {
      type: DataTypes.ENUM(...Object.values(CostProvider)),
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    periodStart: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    periodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vendorId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    project: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    recurringInterval: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nextBillingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    approvedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
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
    modelName: 'CostTracking',
    tableName: 'cost_tracking',
    timestamps: true,
    indexes: [
      {
        fields: ['category'],
      },
      {
        fields: ['provider'],
      },
      {
        fields: ['period_start'],
      },
      {
        fields: ['period_end'],
      },
    ],
    hooks: {
      beforeCreate: async (instance: CostTracking) => {
        if (instance.quantity && instance.amount) {
          instance.unitCost = instance.amount / instance.quantity;
        }
      },
    },
  }
);
}

export default CostTracking;
