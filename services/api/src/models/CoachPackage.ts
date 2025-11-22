import { Op } from 'sequelize';
import * as sequelize from 'sequelize';
import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
} from 'sequelize';
import { sequelize as sequelizeInstance } from '../config/database';

import type { CoachProfile } from './CoachProfile';
import { User } from './User';

export class CoachPackage extends Model<
  InferAttributes<CoachPackage>,
  InferCreationAttributes<CoachPackage>
> {
  declare id: CreationOptional<number>;
  declare coachId: ForeignKey<number>;

  declare name: string;
  declare description: string | null;

  // Package Details
  declare sessionCount: number;
  declare validityDays: number;
  declare price: number;
  declare currency: string;

  // Savings
  declare originalPrice: number | null;
  declare discountPercentage: number | null;

  // Limits
  declare maxPurchasesPerClient: number;
  declare totalAvailable: number | null;
  declare totalSold: number;
  declare isActive: boolean;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare coach?: NonAttribute<CoachProfile>;
  declare clientPackages?: NonAttribute<ClientCoachPackage[]>;

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
  static async getActivePackages(coachId: number): Promise<CoachPackage[]> {
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
    const { CoachProfile: CoachProfileModel } = require('./CoachProfile');
    const coach = await CoachProfileModel.findByPk(coachId);
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

// Initialize model
// Initialize model - skip in test environment to prevent "No Sequelize instance passed" errors
// Jest mocks will handle model initialization in tests
if (process.env.NODE_ENV !== 'test') {
CoachPackage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    coachId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'coach_profiles',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Package Details
    sessionCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    validityDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    // Savings
    originalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    // Limits
    maxPurchasesPerClient: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    totalAvailable: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    totalSold: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    modelName: 'CoachPackage',
    tableName: 'coach_packages',
    timestamps: true,
    hooks: {
      beforeCreate: (instance: CoachPackage) => {
        if (instance.originalPrice && instance.price < instance.originalPrice) {
          instance.discountPercentage = Number(
            (((instance.originalPrice - instance.price) / instance.originalPrice) * 100).toFixed(2)
          );
        }
      },
      beforeUpdate: (instance: CoachPackage) => {
        if (instance.originalPrice && instance.price < instance.originalPrice) {
          instance.discountPercentage = Number(
            (((instance.originalPrice - instance.price) / instance.originalPrice) * 100).toFixed(2)
          );
        }
      },
    },
  }
);
}

// Define associations - skip in test environment
if (process.env.NODE_ENV !== 'test') {
CoachPackage.belongsTo(require('./CoachProfile').CoachProfile, {
  foreignKey: 'coachId',
  as: 'coach',
});

// Client Package Purchases Model
export class ClientCoachPackage extends Model<
  InferAttributes<ClientCoachPackage>,
  InferCreationAttributes<ClientCoachPackage>
> {
  declare id: CreationOptional<number>;
  declare packageId: ForeignKey<number>;
  declare clientId: ForeignKey<number>;

  declare purchaseDate: Date;
  declare expiryDate: Date;
  declare sessionsUsed: number;
  declare sessionsRemaining: number;
  declare paymentId: string | null;
  declare amountPaid: number;
  declare status: 'active' | 'expired' | 'cancelled';

  // Associations
  declare package?: NonAttribute<CoachPackage>;
  declare client?: NonAttribute<User>;

  // Helper methods
  isValid(): boolean {
    return this.status === 'active' && this.expiryDate > new Date() && this.sessionsRemaining > 0;
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
  static async getActivePackagesForClient(clientId: number): Promise<ClientCoachPackage[]> {
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
              model: require('./CoachProfile').CoachProfile,
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
          [Op.or]: [{ expiryDate: { [Op.lte]: new Date() } }, { sessionsRemaining: 0 }],
        },
      }
    );
  }
}

// Initialize ClientCoachPackage model
ClientCoachPackage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    packageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'coach_packages',
        key: 'id',
      },
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    purchaseDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    sessionsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    sessionsRemaining: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    paymentId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    amountPaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled'),
      defaultValue: 'active',
    },
  },
  {
    sequelize: sequelizeInstance,
    modelName: 'ClientCoachPackage',
    tableName: 'client_coach_packages',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['package_id', 'client_id'],
      },
    ],
  }
);

// Define ClientCoachPackage associations
ClientCoachPackage.belongsTo(CoachPackage, {
  foreignKey: 'packageId',
  as: 'package',
});

ClientCoachPackage.belongsTo(User, {
  foreignKey: 'clientId',
  as: 'client',
});

// Define reverse association
CoachPackage.hasMany(ClientCoachPackage, {
  foreignKey: 'packageId',
  as: 'clientPackages',
});
}

export default CoachPackage;
