"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialSnapshot = exports.SnapshotPeriod = void 0;
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
    // Revenue Metrics
    revenue;
    recurringRevenue;
    oneTimeRevenue;
    mrr; // Monthly Recurring Revenue
    arr; // Annual Recurring Revenue
    newMrr;
    expansionMrr;
    contractionMrr;
    churnedMrr;
    netMrrGrowth;
    // Cost Metrics
    totalCosts;
    infrastructureCosts;
    apiCosts;
    personnelCosts;
    marketingCosts;
    operationalCosts;
    // Profit Metrics
    grossProfit;
    netProfit;
    grossMargin;
    netMargin;
    // Customer Metrics
    totalCustomers;
    activeCustomers;
    newCustomers;
    churnedCustomers;
    churnRate;
    avgRevenuePerUser;
    customerAcquisitionCost;
    customerLifetimeValue;
    // Subscription Metrics
    totalSubscriptions;
    newSubscriptions;
    canceledSubscriptions;
    trialSubscriptions;
    trialConversionRate;
    // Transaction Metrics
    totalTransactions;
    successfulTransactions;
    failedTransactions;
    refundedTransactions;
    refundAmount;
    // Unit Economics
    costPerUser;
    revenuePerUser;
    profitPerUser;
    ltvToCacRatio;
    paybackPeriodDays;
    // Metadata
    metadata;
    // Calculated properties
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
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
        primaryKey: true,
    }),
    __metadata("design:type", String)
], FinancialSnapshot.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATEONLY,
        allowNull: false,
    }),
    sequelize_typescript_1.Index,
    __metadata("design:type", Date)
], FinancialSnapshot.prototype, "date", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(SnapshotPeriod)),
        allowNull: false,
    }),
    sequelize_typescript_1.Index,
    __metadata("design:type", String)
], FinancialSnapshot.prototype, "period", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "revenue", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "recurringRevenue", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "oneTimeRevenue", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "mrr", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "arr", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "newMrr", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "expansionMrr", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "contractionMrr", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "churnedMrr", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "netMrrGrowth", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "totalCosts", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "infrastructureCosts", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "apiCosts", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "personnelCosts", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "marketingCosts", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "operationalCosts", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "grossProfit", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "netProfit", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "grossMargin", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "netMargin", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "totalCustomers", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "activeCustomers", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "newCustomers", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "churnedCustomers", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "churnRate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "avgRevenuePerUser", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "customerAcquisitionCost", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "customerLifetimeValue", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "totalSubscriptions", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "newSubscriptions", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "canceledSubscriptions", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "trialSubscriptions", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "trialConversionRate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "totalTransactions", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "successfulTransactions", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "failedTransactions", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "refundedTransactions", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "refundAmount", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "costPerUser", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "revenuePerUser", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "profitPerUser", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "ltvToCacRatio", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    __metadata("design:type", Number)
], FinancialSnapshot.prototype, "paybackPeriodDays", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    __metadata("design:type", Object)
], FinancialSnapshot.prototype, "metadata", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], FinancialSnapshot.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], FinancialSnapshot.prototype, "updatedAt", void 0);
exports.FinancialSnapshot = FinancialSnapshot = __decorate([
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
//# sourceMappingURL=FinancialSnapshot.js.map