"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialSnapshot = exports.SnapshotPeriod = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
var SnapshotPeriod;
(function (SnapshotPeriod) {
    SnapshotPeriod["DAILY"] = "daily";
    SnapshotPeriod["WEEKLY"] = "weekly";
    SnapshotPeriod["MONTHLY"] = "monthly";
    SnapshotPeriod["QUARTERLY"] = "quarterly";
    SnapshotPeriod["YEARLY"] = "yearly";
})(SnapshotPeriod || (exports.SnapshotPeriod = SnapshotPeriod = {}));
let FinancialSnapshot = class FinancialSnapshot extends sequelize_typescript_1.Model {
    date;
    period;
    revenue;
    recurringRevenue;
    oneTimeRevenue;
    mrr;
    arr;
    newMrr;
    expansionMrr;
    contractionMrr;
    churnedMrr;
    netMrrGrowth;
    totalCosts;
    infrastructureCosts;
    apiCosts;
    personnelCosts;
    marketingCosts;
    operationalCosts;
    grossProfit;
    netProfit;
    grossMargin;
    netMargin;
    totalCustomers;
    activeCustomers;
    newCustomers;
    churnedCustomers;
    churnRate;
    avgRevenuePerUser;
    customerAcquisitionCost;
    customerLifetimeValue;
    totalSubscriptions;
    newSubscriptions;
    canceledSubscriptions;
    trialSubscriptions;
    trialConversionRate;
    totalTransactions;
    successfulTransactions;
    failedTransactions;
    refundedTransactions;
    refundAmount;
    costPerUser;
    revenuePerUser;
    profitPerUser;
    ltvToCacRatio;
    paybackPeriodDays;
    metadata;
    get mrrGrowthRate() {
        if (this.mrr === 0)
            return 0;
        return (this.netMrrGrowth / this.mrr) * 100;
    }
    get operatingMargin() {
        if (this.revenue === 0)
            return 0;
        return ((this.revenue - this.operationalCosts) / this.revenue) * 100;
    }
    get isHealthy() {
        return this.netProfit > 0 && this.churnRate < 10 && this.ltvToCacRatio > 3;
    }
};
exports.FinancialSnapshot = FinancialSnapshot;
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
        primaryKey: true,
    }),
    tslib_1.__metadata("design:type", String)
], FinancialSnapshot.prototype, "id", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATEONLY,
        allowNull: false,
    }),
    sequelize_typescript_1.Index,
    tslib_1.__metadata("design:type", Date)
], FinancialSnapshot.prototype, "date", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(SnapshotPeriod)),
        allowNull: false,
    }),
    sequelize_typescript_1.Index,
    tslib_1.__metadata("design:type", String)
], FinancialSnapshot.prototype, "period", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "revenue", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "recurringRevenue", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "oneTimeRevenue", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "mrr", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "arr", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "newMrr", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "expansionMrr", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "contractionMrr", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "churnedMrr", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "netMrrGrowth", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "totalCosts", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "infrastructureCosts", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "apiCosts", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "personnelCosts", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "marketingCosts", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "operationalCosts", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "grossProfit", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "netProfit", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "grossMargin", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "netMargin", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "totalCustomers", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "activeCustomers", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "newCustomers", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "churnedCustomers", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "churnRate", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "avgRevenuePerUser", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "customerAcquisitionCost", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "customerLifetimeValue", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "totalSubscriptions", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "newSubscriptions", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "canceledSubscriptions", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "trialSubscriptions", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "trialConversionRate", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "totalTransactions", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "successfulTransactions", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "failedTransactions", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "refundedTransactions", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "refundAmount", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "costPerUser", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "revenuePerUser", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "profitPerUser", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "ltvToCacRatio", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], FinancialSnapshot.prototype, "paybackPeriodDays", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Object)
], FinancialSnapshot.prototype, "metadata", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], FinancialSnapshot.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], FinancialSnapshot.prototype, "updatedAt", void 0);
exports.FinancialSnapshot = FinancialSnapshot = tslib_1.__decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'financial_snapshots',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['date', 'period'],
            },
        ],
    })
], FinancialSnapshot);
