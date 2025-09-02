"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = exports.BillingInterval = exports.SubscriptionPlan = exports.SubscriptionStatus = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["PAST_DUE"] = "past_due";
    SubscriptionStatus["CANCELED"] = "canceled";
    SubscriptionStatus["INCOMPLETE"] = "incomplete";
    SubscriptionStatus["INCOMPLETE_EXPIRED"] = "incomplete_expired";
    SubscriptionStatus["TRIALING"] = "trialing";
    SubscriptionStatus["PAUSED"] = "paused";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var SubscriptionPlan;
(function (SubscriptionPlan) {
    SubscriptionPlan["FREE"] = "free";
    SubscriptionPlan["BASIC"] = "basic";
    SubscriptionPlan["PRO"] = "pro";
    SubscriptionPlan["TEAM"] = "team";
    SubscriptionPlan["ENTERPRISE"] = "enterprise";
})(SubscriptionPlan || (exports.SubscriptionPlan = SubscriptionPlan = {}));
var BillingInterval;
(function (BillingInterval) {
    BillingInterval["MONTHLY"] = "monthly";
    BillingInterval["QUARTERLY"] = "quarterly";
    BillingInterval["YEARLY"] = "yearly";
})(BillingInterval || (exports.BillingInterval = BillingInterval = {}));
class Subscription extends sequelize_1.Model {
    id;
    userId;
    stripeSubscriptionId;
    stripeCustomerId;
    plan;
    status;
    billingInterval;
    amount;
    currency;
    trialStartDate;
    trialEndDate;
    currentPeriodStart;
    currentPeriodEnd;
    canceledAt;
    cancelReason;
    discountPercentage;
    discountValidUntil;
    metadata;
    // Associations
    user;
    transactions;
    static associations;
    // Calculated properties
    get isActive() {
        return this.status === SubscriptionStatus.ACTIVE || this.status === SubscriptionStatus.TRIALING;
    }
    get isTrialing() {
        return this.status === SubscriptionStatus.TRIALING;
    }
    get hasTrial() {
        return !!this.trialEndDate;
    }
    get daysUntilTrialEnd() {
        if (!this.trialEndDate || this.status !== SubscriptionStatus.TRIALING) {
            return null;
        }
        const now = new Date();
        const diff = this.trialEndDate.getTime() - now.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
    get daysUntilRenewal() {
        if (!this.isActive || !this.currentPeriodEnd) {
            return null;
        }
        const now = new Date();
        const diff = this.currentPeriodEnd.getTime() - now.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
    get monthlyAmount() {
        switch (this.billingInterval) {
            case BillingInterval.MONTHLY:
                return this.amount;
            case BillingInterval.QUARTERLY:
                return Math.round(this.amount / 3);
            case BillingInterval.YEARLY:
                return Math.round(this.amount / 12);
            default:
                return this.amount;
        }
    }
    get annualAmount() {
        switch (this.billingInterval) {
            case BillingInterval.MONTHLY:
                return this.amount * 12;
            case BillingInterval.QUARTERLY:
                return this.amount * 4;
            case BillingInterval.YEARLY:
                return this.amount;
            default:
                return this.amount * 12;
        }
    }
    get effectiveAmount() {
        if (this.discountPercentage && this.discountValidUntil) {
            const now = new Date();
            if (now <= this.discountValidUntil) {
                return this.amount * (1 - this.discountPercentage / 100);
            }
        }
        return this.amount;
    }
    get planFeatures() {
        switch (this.plan) {
            case SubscriptionPlan.FREE:
                return {
                    maxCoaches: 1,
                    maxGoals: 3,
                    maxChatsPerDay: 5,
                    hasVoiceJournaling: false,
                    hasProgressPhotos: false,
                    hasAdvancedAnalytics: false,
                    hasTeamFeatures: false,
                    hasPrioritySupport: false,
                    hasCustomBranding: false,
                    hasApiAccess: false,
                };
            case SubscriptionPlan.BASIC:
                return {
                    maxCoaches: 3,
                    maxGoals: 10,
                    maxChatsPerDay: 50,
                    hasVoiceJournaling: true,
                    hasProgressPhotos: true,
                    hasAdvancedAnalytics: false,
                    hasTeamFeatures: false,
                    hasPrioritySupport: false,
                    hasCustomBranding: false,
                    hasApiAccess: false,
                };
            case SubscriptionPlan.PRO:
                return {
                    maxCoaches: -1, // unlimited
                    maxGoals: -1,
                    maxChatsPerDay: -1,
                    hasVoiceJournaling: true,
                    hasProgressPhotos: true,
                    hasAdvancedAnalytics: true,
                    hasTeamFeatures: false,
                    hasPrioritySupport: true,
                    hasCustomBranding: false,
                    hasApiAccess: true,
                };
            case SubscriptionPlan.TEAM:
                return {
                    maxCoaches: -1,
                    maxGoals: -1,
                    maxChatsPerDay: -1,
                    hasVoiceJournaling: true,
                    hasProgressPhotos: true,
                    hasAdvancedAnalytics: true,
                    hasTeamFeatures: true,
                    hasPrioritySupport: true,
                    hasCustomBranding: true,
                    hasApiAccess: true,
                };
            case SubscriptionPlan.ENTERPRISE:
                return {
                    maxCoaches: -1,
                    maxGoals: -1,
                    maxChatsPerDay: -1,
                    hasVoiceJournaling: true,
                    hasProgressPhotos: true,
                    hasAdvancedAnalytics: true,
                    hasTeamFeatures: true,
                    hasPrioritySupport: true,
                    hasCustomBranding: true,
                    hasApiAccess: true,
                };
            default:
                return this.planFeatures; // TypeScript exhaustiveness check
        }
    }
    static associate(models) {
        Subscription.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        Subscription.hasMany(models.Transaction, { foreignKey: 'subscriptionId', as: 'transactions' });
    }
}
exports.Subscription = Subscription;
Subscription.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    stripeSubscriptionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    stripeCustomerId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    plan: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(SubscriptionPlan)),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(SubscriptionStatus)),
        allowNull: false,
        defaultValue: SubscriptionStatus.INCOMPLETE,
    },
    billingInterval: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(BillingInterval)),
        allowNull: false,
        defaultValue: BillingInterval.MONTHLY,
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    currency: {
        type: sequelize_1.DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'usd',
    },
    trialStartDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    trialEndDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    currentPeriodStart: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    currentPeriodEnd: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    canceledAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    cancelReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    discountPercentage: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
            min: 0,
            max: 100,
        },
    },
    discountValidUntil: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'Subscription',
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['stripeSubscriptionId'] },
        { fields: ['plan'] },
        { fields: ['status'] },
    ],
    hooks: {
        beforeUpdate: (subscription) => {
            if (subscription.changed('status') &&
                subscription.status === SubscriptionStatus.CANCELED &&
                !subscription.canceledAt) {
                subscription.canceledAt = new Date();
            }
        },
    },
});
//# sourceMappingURL=Subscription.js.map