import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { CoachProfile } from './CoachProfile';
import { User } from './User';
import { Op } from 'sequelize';
import * as sequelize from 'sequelize';

@Table({
  tableName: 'coach_packages',
  timestamps: true,
})
export class CoachPackage extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => CoachProfile)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  coachId!: number;

  @BelongsTo(() => CoachProfile)
  coach!: CoachProfile;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
  })
  description?: string;

  // Package Details
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionCount!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  validityDays!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  price!: number;

  @Column({
    type: DataType.STRING(3),
    defaultValue: 'USD',
  })
  currency!: string;

  // Savings
  @Column({
    type: DataType.DECIMAL(10, 2),
  })
  originalPrice?: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
  })
  discountPercentage?: number;

  // Limits
  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
  })
  maxPurchasesPerClient!: number;

  @Column({
    type: DataType.INTEGER,
  })
  totalAvailable?: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  totalSold!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive!: boolean;

  @HasMany(() => ClientCoachPackage)
  clientPackages!: ClientCoachPackage[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static calculateDiscounts(instance: CoachPackage) {
    if (instance.originalPrice && instance.price < instance.originalPrice) {
      instance.discountPercentage = Number(
        (((instance.originalPrice - instance.price) / instance.originalPrice) * 100).toFixed(2)
      );
    }
  }

  // Helper methods
  isAvailable(): boolean {
    if (!this.isActive) return false;
    if (this.totalAvailable && this.totalSold >= this.totalAvailable) return false;
    return true;
  }

  getSavingsAmount(): number {
    if (!this.originalPrice) return 0;
    return Number((this.originalPrice - this.price).toFixed(2));
  }

  canBePurchasedBy(clientId: number): Promise<boolean> {
    return ClientCoachPackage.count({
      where: {
        packageId: this.id,
        clientId,
      },
    }).then(count => count < this.maxPurchasesPerClient);
  }

  async recordPurchase(): Promise<void> {
    this.totalSold += 1;
    await this.save();
  }

  // Static methods
  static async getActivePackages(
    coachId: number
  ): Promise<CoachPackage[]> {
    return this.findAll({
      where: {
        coachId,
        isActive: true,
        [Op.or]: [
          { totalAvailable: null },
          { totalSold: { [Op.lt]: sequelize.col('total_available') } },
        ],
      },
      order: [['sessionCount', 'ASC']],
    });
  }

  static async calculateBestValue(
    coachId: number,
    sessionCount: number
  ): Promise<{ regularPrice: number; packagePrice: number; savings: number } | null> {
    const coach = await CoachProfile.findByPk(coachId);
    if (!coach || !coach.hourlyRate) return null;

    const regularPrice = coach.calculateSessionPrice(sessionCount * 60);
    
    // Find best package for the session count
    const packages = await this.findAll({
      where: {
        coachId,
        isActive: true,
        sessionCount: { [Op.gte]: sessionCount },
      },
      order: [['price', 'ASC']],
      limit: 1,
    });

    if (packages.length === 0) {
      return {
        regularPrice,
        packagePrice: regularPrice,
        savings: 0,
      };
    }

    const bestPackage = packages[0];
    const pricePerSession = bestPackage.price / bestPackage.sessionCount;
    const packagePrice = pricePerSession * sessionCount;

    return {
      regularPrice,
      packagePrice: Number(packagePrice.toFixed(2)),
      savings: Number((regularPrice - packagePrice).toFixed(2)),
    };
  }
}

// Client Package Purchases Model
@Table({
  tableName: 'client_coach_packages',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['package_id', 'client_id'],
    },
  ],
})
export class ClientCoachPackage extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => CoachPackage)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  packageId!: number;

  @BelongsTo(() => CoachPackage)
  package!: CoachPackage;

  @ForeignKey(() => User as any)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  clientId!: number;

  @BelongsTo(() => User as any)
  client!: any;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  purchaseDate!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  expiryDate!: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  sessionsUsed!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionsRemaining!: number;

  @Column({
    type: DataType.STRING(255),
  })
  paymentId?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amountPaid!: number;

  @Column({
    type: DataType.ENUM('active', 'expired', 'cancelled'),
    defaultValue: 'active',
  })
  status!: 'active' | 'expired' | 'cancelled';

  // Helper methods
  isValid(): boolean {
    return this.status === 'active' && 
           this.expiryDate > new Date() && 
           this.sessionsRemaining > 0;
  }

  async useSession(): Promise<void> {
    if (!this.isValid()) {
      throw new Error('Package is not valid for use');
    }

    this.sessionsUsed += 1;
    this.sessionsRemaining -= 1;
    
    if (this.sessionsRemaining === 0) {
      this.status = 'expired';
    }

    await this.save();
  }

  async refundSession(): Promise<void> {
    this.sessionsUsed = Math.max(0, this.sessionsUsed - 1);
    this.sessionsRemaining += 1;
    
    if (this.status === 'expired' && this.sessionsRemaining > 0) {
      this.status = 'active';
    }

    await this.save();
  }

  getDaysRemaining(): number {
    const now = new Date();
    const days = Math.floor((this.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }

  // Static methods
  static async getActivePackagesForClient(
    clientId: number
  ): Promise<ClientCoachPackage[]> {
    return this.findAll({
      where: {
        clientId,
        status: 'active',
        expiryDate: { [Op.gt]: new Date() },
        sessionsRemaining: { [Op.gt]: 0 },
      },
      include: [
        {
          model: CoachPackage,
          include: [
            {
              model: CoachProfile,
              include: [{ model: User, attributes: ['id', 'name', 'email'] }],
            },
          ],
        },
      ],
      order: [['expiryDate', 'ASC']],
    });
  }

  static async checkExpiredPackages(): Promise<void> {
    await this.update(
      { status: 'expired' },
      {
        where: {
          status: 'active',
          [Op.or]: [
            { expiryDate: { [Op.lte]: new Date() } },
            { sessionsRemaining: 0 },
          ],
        },
      }
    );
  }
}