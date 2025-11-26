import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
  Op,
  QueryTypes,
  Sequelize,
} from 'sequelize';

import { User } from './User';

export class Referral extends Model<InferAttributes<Referral>, InferCreationAttributes<Referral>> {
  declare id: CreationOptional<number>;
  declare referrerId: ForeignKey<User['id']>;
  declare refereeId: ForeignKey<User['id']> | null;
  declare code: string;
  declare programId: string;
  declare status: 'pending' | 'completed' | 'expired' | 'cancelled';
  declare rewardStatus: 'pending' | 'paid' | 'failed';
  declare referrerReward: number | null;
  declare refereeReward: number | null;
  declare metadata: unknown;
  declare completedAt: Date | null;
  declare expiresAt: Date;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare referrer?: NonAttribute<User>;
  declare referee?: NonAttribute<User>;

  // Instance methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isActive(): boolean {
    return this.status === 'pending' && !this.isExpired();
  }

  canBeUsed(userId: string): boolean {
    return this.isActive() && this.referrerId !== userId && this.refereeId === null;
  }

  // Class methods
  static async findByCode(code: string): Promise<Referral | null> {
    return Referral.findOne({
      where: { code },
      include: [
        { model: User, as: 'referrer' },
        { model: User, as: 'referee' },
      ],
    });
  }

  static async findActiveByUser(userId: number): Promise<Referral | null> {
    return Referral.findOne({
      where: {
        referrerId: userId,
        status: 'pending',
        expiresAt: { [Op.gt]: new Date() },
      },
    });
  }

  static async getUserStats(userId: number): Promise<{
    totalReferrals: number;
    completedReferrals: number;
    totalEarnings: number;
    pendingEarnings: number;
  }> {
    const referrals = await Referral.findAll({
      where: { referrerId: userId },
    });

    return {
      totalReferrals: referrals.length,
      completedReferrals: referrals.filter(r => r.status === 'completed').length,
      totalEarnings: referrals
        .filter(r => r.rewardStatus === 'paid')
        .reduce((sum, r) => sum + (r.referrerReward || 0), 0),
      pendingEarnings: referrals
        .filter(r => r.status === 'completed' && r.rewardStatus === 'pending')
        .reduce((sum, r) => sum + (r.referrerReward || 0), 0),
    };
  }

  static async getLeaderboard(
    period: 'week' | 'month' | 'year' | 'all' = 'month',
    limit: number = 10
  ): Promise<
    Array<{
      userId: number;
      userName: string;
      referralCount: number;
      totalEarnings: number;
    }>
  > {
    let dateFilter: { completedAt?: { [Op.gte]: Date } } = {};
    const now = new Date();

    switch (period) {
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = { completedAt: { [Op.gte]: weekAgo } };
        break;
      }
      case 'month': {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = { completedAt: { [Op.gte]: monthAgo } };
        break;
      }
      case 'year': {
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        dateFilter = { completedAt: { [Op.gte]: yearAgo } };
        break;
      }
    }

    const result = await this.sequelize!.query(
      `
      SELECT
        r.referrer_id as "userId",
        u.name as "userName",
        COUNT(r.id) as "referralCount",
        COALESCE(SUM(r.referrer_reward), 0) as "totalEarnings"
      FROM referrals r
      INNER JOIN users u ON u.id = r.referrer_id
      WHERE r.status = 'completed'
        ${period !== 'all' ? 'AND r.completed_at >= :startDate' : ''}
      GROUP BY r.referrer_id, u.name
      ORDER BY "totalEarnings" DESC
      LIMIT :limit
    `,
      {
        replacements: {
          startDate: dateFilter.completedAt?.[Op.gte] || new Date(0),
          limit,
        },
        type: QueryTypes.SELECT,
      }
    );

    return result as Array<{
      userId: number;
      userName: string;
      referralCount: number;
      totalEarnings: number;
    }>;
  }

  // Static method declaration for lazy initialization
  static initializeModel: (sequelize: Sequelize) => typeof Referral;
}

// Static method for deferred initialization
Referral.initializeModel = function(sequelizeInstance: Sequelize) {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance required for Referral initialization');
  }

  return Referral.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      referrerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: User,
          key: 'id',
        },
      },
      refereeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: User,
          key: 'id',
        },
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [4, 20],
        },
      },
      programId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'standard',
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'expired', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      rewardStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      referrerReward: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      refereeReward: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize: sequelizeInstance,
      modelName: 'Referral',
      tableName: 'referrals',
      indexes: [
        {
          fields: ['code'],
          unique: true,
        },
        {
          fields: ['referrer_id'],
        },
        {
          fields: ['referee_id'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['expires_at'],
        },
        {
          fields: ['completed_at'],
        },
      ],
    }
  );
};

// Comment out immediate initialization to prevent premature execution
// Referral.init(...) will be called via Referral.initializeModel() after database is ready


export default Referral;
