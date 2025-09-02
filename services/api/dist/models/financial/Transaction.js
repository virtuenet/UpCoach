"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = exports.PaymentMethod = exports.TransactionType = exports.TransactionStatus = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["COMPLETED"] = "completed";
    TransactionStatus["FAILED"] = "failed";
    TransactionStatus["REFUNDED"] = "refunded";
    TransactionStatus["PARTIALLY_REFUNDED"] = "partially_refunded";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["PAYMENT"] = "payment";
    TransactionType["REFUND"] = "refund";
    TransactionType["ADJUSTMENT"] = "adjustment";
    TransactionType["CHARGEBACK"] = "chargeback";
    TransactionType["PAYOUT"] = "payout";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CARD"] = "card";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["PAYPAL"] = "paypal";
    PaymentMethod["CRYPTO"] = "crypto";
    PaymentMethod["OTHER"] = "other";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
class Transaction extends sequelize_1.Model {
    id;
    userId;
    subscriptionId;
    stripeTransactionId;
    type;
    status;
    amount;
    currency;
    paymentMethod;
    description;
    metadata;
    stripeInvoiceId;
    stripeChargeId;
    stripeRefundId;
    failureReason;
    refundedAmount;
    fee;
    net;
    // Associations
    user;
    subscription;
    static associations;
    // Calculated properties
    get isRefundable() {
        return (this.status === TransactionStatus.COMPLETED &&
            this.type === TransactionType.PAYMENT &&
            (!this.refundedAmount || this.refundedAmount < this.amount));
    }
    get remainingRefundableAmount() {
        if (!this.isRefundable)
            return 0;
        return this.amount - (this.refundedAmount || 0);
    }
    get netAmount() {
        if (this.net !== undefined)
            return this.net;
        return this.amount - (this.fee || 0);
    }
    static associate(models) {
        Transaction.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        Transaction.belongsTo(models.Subscription, {
            foreignKey: 'subscriptionId',
            as: 'subscription',
        });
    }
}
exports.Transaction = Transaction;
Transaction.init({
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
    subscriptionId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'subscriptions',
            key: 'id',
        },
    },
    stripeTransactionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(TransactionType)),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(TransactionStatus)),
        allowNull: false,
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
    paymentMethod: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(PaymentMethod)),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    stripeInvoiceId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    stripeChargeId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    stripeRefundId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    failureReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    refundedAmount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
    },
    fee: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    net: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['subscriptionId'] },
        { fields: ['stripeTransactionId'] },
        { fields: ['type'] },
        { fields: ['status'] },
    ],
});
//# sourceMappingURL=Transaction.js.map