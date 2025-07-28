import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  Index,
  BeforeCreate,
} from 'sequelize-typescript';

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

@Table({
  tableName: 'cost_tracking',
  timestamps: true,
})
export class CostTracking extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.ENUM(...Object.values(CostCategory)),
    allowNull: false,
  })
  @Index
  category!: CostCategory;

  @Column({
    type: DataType.ENUM(...Object.values(CostType)),
    allowNull: false,
    defaultValue: CostType.VARIABLE,
  })
  type!: CostType;

  @Column({
    type: DataType.ENUM(...Object.values(CostProvider)),
    allowNull: true,
  })
  @Index
  provider?: CostProvider;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amount!: number;

  @Column({
    type: DataType.STRING(3),
    allowNull: false,
    defaultValue: 'USD',
  })
  currency!: string;

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
  @Index
  periodEnd!: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  quantity?: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  unit?: string;

  @Column({
    type: DataType.DECIMAL(10, 4),
    allowNull: true,
  })
  unitCost?: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  invoiceNumber?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  vendorId?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  department?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  project?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  tags?: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isRecurring!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  recurringInterval?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  nextBillingDate?: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isApproved!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  approvedBy?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  approvedAt?: Date;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata?: any;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Hooks
  @BeforeCreate
  static async calculateUnitCost(instance: CostTracking) {
    if (instance.quantity && instance.amount) {
      instance.unitCost = instance.amount / instance.quantity;
    }
  }

  // Calculated properties
  get dailyCost(): number {
    const days = Math.ceil(
      (this.periodEnd.getTime() - this.periodStart.getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    return days > 0 ? this.amount / days : 0;
  }

  get monthlyCost(): number {
    const days = Math.ceil(
      (this.periodEnd.getTime() - this.periodStart.getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    return days > 0 ? (this.amount / days) * 30 : 0;
  }

  get isOverBudget(): boolean {
    // This would be compared against budget data
    return false; // Placeholder
  }
} 