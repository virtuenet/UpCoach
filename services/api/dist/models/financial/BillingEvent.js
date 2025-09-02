"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingEvent = exports.BillingEventSource = exports.BillingEventType = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
var BillingEventType;
(function (BillingEventType) {
    BillingEventType["SUBSCRIPTION_CREATED"] = "subscription_created";
    BillingEventType["SUBSCRIPTION_UPDATED"] = "subscription_updated";
    BillingEventType["SUBSCRIPTION_CANCELED"] = "subscription_canceled";
    BillingEventType["SUBSCRIPTION_REACTIVATED"] = "subscription_reactivated";
    BillingEventType["PAYMENT_SUCCEEDED"] = "payment_succeeded";
    BillingEventType["PAYMENT_FAILED"] = "payment_failed";
    BillingEventType["PAYMENT_RETRY"] = "payment_retry";
    BillingEventType["REFUND_ISSUED"] = "refund_issued";
    BillingEventType["CHARGEBACK_CREATED"] = "chargeback_created";
    BillingEventType["TRIAL_STARTED"] = "trial_started";
    BillingEventType["TRIAL_ENDED"] = "trial_ended";
    BillingEventType["PLAN_CHANGED"] = "plan_changed";
    BillingEventType["DISCOUNT_APPLIED"] = "discount_applied";
    BillingEventType["DISCOUNT_REMOVED"] = "discount_removed";
    BillingEventType["INVOICE_CREATED"] = "invoice_created";
    BillingEventType["INVOICE_SENT"] = "invoice_sent";
    BillingEventType["INVOICE_PAID"] = "invoice_paid";
    BillingEventType["CREDIT_APPLIED"] = "credit_applied";
    BillingEventType["DUNNING_STARTED"] = "dunning_started";
    BillingEventType["DUNNING_RESOLVED"] = "dunning_resolved";
})(BillingEventType || (exports.BillingEventType = BillingEventType = {}));
var BillingEventSource;
(function (BillingEventSource) {
    BillingEventSource["STRIPE_WEBHOOK"] = "stripe_webhook";
    BillingEventSource["ADMIN_ACTION"] = "admin_action";
    BillingEventSource["SYSTEM_AUTOMATION"] = "system_automation";
    BillingEventSource["USER_ACTION"] = "user_action";
    BillingEventSource["API_CALL"] = "api_call";
})(BillingEventSource || (exports.BillingEventSource = BillingEventSource = {}));
class BillingEvent extends sequelize_1.Model {
    id;
    eventType;
    source;
    userId;
    subscriptionId;
    transactionId;
    stripeEventId;
    description;
    amount;
    currency;
    previousValue;
    newValue;
    eventData;
    ipAddress;
    userAgent;
    performedBy;
    isProcessed;
    processedAt;
    processingError;
    retryCount;
    metadata;
    // Associations
    user;
    subscription;
    transaction;
    static associations;
    // Calculated properties
    get isMonetaryEvent() {
        return [
            BillingEventType.PAYMENT_SUCCEEDED,
            BillingEventType.PAYMENT_FAILED,
            BillingEventType.REFUND_ISSUED,
            BillingEventType.CHARGEBACK_CREATED,
            BillingEventType.CREDIT_APPLIED,
        ].includes(this.eventType);
    }
    get requiresAction() {
        return ([
            BillingEventType.PAYMENT_FAILED,
            BillingEventType.CHARGEBACK_CREATED,
            BillingEventType.DUNNING_STARTED,
        ].includes(this.eventType) && !this.isProcessed);
    }
    get severity() {
        switch (this.eventType) {
            case BillingEventType.PAYMENT_FAILED:
            case BillingEventType.CHARGEBACK_CREATED:
                return 'high';
            case BillingEventType.SUBSCRIPTION_CANCELED:
            case BillingEventType.DUNNING_STARTED:
                return 'medium';
            default:
                return 'low';
        }
    }
    static associate(models) {
        BillingEvent.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        BillingEvent.belongsTo(models.Subscription, {
            foreignKey: 'subscriptionId',
            as: 'subscription',
        });
        BillingEvent.belongsTo(models.Transaction, { foreignKey: 'transactionId', as: 'transaction' });
    }
}
exports.BillingEvent = BillingEvent;
BillingEvent.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    eventType: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(BillingEventType)),
        allowNull: false,
    },
    source: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(BillingEventSource)),
        allowNull: false,
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
    transactionId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'transactions',
            key: 'id',
        },
    },
    stripeEventId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    currency: {
        type: sequelize_1.DataTypes.STRING(3),
        allowNull: true,
    },
    previousValue: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    newValue: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    eventData: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    ipAddress: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    userAgent: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    performedBy: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    isProcessed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    processedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    processingError: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    retryCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'BillingEvent',
    tableName: 'billing_events',
    timestamps: true,
    indexes: [
        { fields: ['eventType'] },
        { fields: ['source'] },
        { fields: ['userId'] },
        { fields: ['subscriptionId'] },
    ],
});
//# sourceMappingURL=BillingEvent.js.map