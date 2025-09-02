"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Referral = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
class Referral extends sequelize_1.Model {
    // Instance methods
    isExpired() {
        return new Date() > this.expiresAt;
    }
    isActive() {
        return this.status === 'pending' && !this.isExpired();
    }
    canBeUsed(userId) {
        return this.isActive() && this.referrerId !== userId && this.refereeId === null;
    }
    // Class methods
    static async findByCode(code) {
        return Referral.findOne({
            where: { code },
            include: [
                { model: User_1.User, as: 'referrer' },
                { model: User_1.User, as: 'referee' },
            ],
        });
    }
    static async findActiveByUser(userId) {
        return Referral.findOne({
            where: {
                referrerId: userId,
                status: 'pending',
                expiresAt: { [sequelize_2.Op.gt]: new Date() },
            },
        });
    }
    static async getUserStats(userId) {
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
    static async getLeaderboard(period = 'month', limit = 10) {
        let dateFilter = {};
        const now = new Date();
        switch (period) {
            case 'week':
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                dateFilter = { completedAt: { [sequelize_2.Op.gte]: weekAgo } };
                break;
            case 'month':
                const monthAgo = new Date(now);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                dateFilter = { completedAt: { [sequelize_2.Op.gte]: monthAgo } };
                break;
            case 'year':
                const yearAgo = new Date(now);
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                dateFilter = { completedAt: { [sequelize_2.Op.gte]: yearAgo } };
                break;
        }
        const result = await database_1.sequelize.query(`
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
    `, {
            replacements: {
                startDate: dateFilter.completedAt?.[sequelize_2.Op.gte] || new Date(0),
                limit,
            },
            type: sequelize_2.QueryTypes.SELECT,
        });
        return result;
    }
}
exports.Referral = Referral;
// Initialize the model
Referral.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    referrerId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User_1.User,
            key: 'id',
        },
    },
    refereeId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: User_1.User,
            key: 'id',
        },
    },
    code: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [4, 20],
        },
    },
    programId: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'standard',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'completed', 'expired', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
    },
    rewardStatus: {
        type: sequelize_1.DataTypes.ENUM('pending', 'paid', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
    },
    referrerReward: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    refereeReward: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
    completedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    expiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: database_1.sequelize,
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
});
// Define associations
Referral.belongsTo(User_1.User, {
    foreignKey: 'referrerId',
    as: 'referrer',
});
Referral.belongsTo(User_1.User, {
    foreignKey: 'refereeId',
    as: 'referee',
});
// Add to User model associations
User_1.User.hasMany(Referral, {
    foreignKey: 'referrerId',
    as: 'sentReferrals',
});
User_1.User.hasOne(Referral, {
    foreignKey: 'refereeId',
    as: 'receivedReferral',
});
const sequelize_2 = require("sequelize");
exports.default = Referral;
//# sourceMappingURL=Referral.js.map