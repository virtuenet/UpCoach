"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostTracking = exports.CostProvider = exports.CostType = exports.CostCategory = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
var CostCategory;
(function (CostCategory) {
    CostCategory["INFRASTRUCTURE"] = "infrastructure";
    CostCategory["API_SERVICES"] = "api_services";
    CostCategory["PERSONNEL"] = "personnel";
    CostCategory["MARKETING"] = "marketing";
    CostCategory["OPERATIONS"] = "operations";
    CostCategory["DEVELOPMENT"] = "development";
    CostCategory["LEGAL"] = "legal";
    CostCategory["OTHER"] = "other";
})(CostCategory || (exports.CostCategory = CostCategory = {}));
var CostType;
(function (CostType) {
    CostType["FIXED"] = "fixed";
    CostType["VARIABLE"] = "variable";
    CostType["ONE_TIME"] = "one_time";
})(CostType || (exports.CostType = CostType = {}));
var CostProvider;
(function (CostProvider) {
    CostProvider["AWS"] = "aws";
    CostProvider["GOOGLE_CLOUD"] = "google_cloud";
    CostProvider["AZURE"] = "azure";
    CostProvider["OPENAI"] = "openai";
    CostProvider["STRIPE"] = "stripe";
    CostProvider["TWILIO"] = "twilio";
    CostProvider["SENDGRID"] = "sendgrid";
    CostProvider["OTHER"] = "other";
})(CostProvider || (exports.CostProvider = CostProvider = {}));
let CostTracking = class CostTracking extends sequelize_typescript_1.Model {
    category;
    type;
    provider;
    name;
    description;
    amount;
    currency;
    periodStart;
    periodEnd;
    quantity;
    unit;
    unitCost;
    invoiceNumber;
    vendorId;
    department;
    project;
    tags;
    isRecurring;
    recurringInterval;
    nextBillingDate;
    isApproved;
    approvedBy;
    approvedAt;
    metadata;
    static async calculateUnitCost(instance) {
        if (instance.quantity && instance.amount) {
            instance.unitCost = instance.amount / instance.quantity;
        }
    }
    get dailyCost() {
        const days = Math.ceil((this.periodEnd.getTime() - this.periodStart.getTime()) / (1000 * 60 * 60 * 24));
        return days > 0 ? this.amount / days : 0;
    }
    get monthlyCost() {
        const days = Math.ceil((this.periodEnd.getTime() - this.periodStart.getTime()) / (1000 * 60 * 60 * 24));
        return days > 0 ? (this.amount / days) * 30 : 0;
    }
    get isOverBudget() {
        return false;
    }
};
exports.CostTracking = CostTracking;
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
        primaryKey: true,
    }),
    tslib_1.__metadata("design:type", String)
], CostTracking.prototype, "id", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(CostCategory)),
        allowNull: false,
    }),
    sequelize_typescript_1.Index,
    tslib_1.__metadata("design:type", String)
], CostTracking.prototype, "category", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(CostType)),
        allowNull: false,
        defaultValue: CostType.VARIABLE,
    }),
    tslib_1.__metadata("design:type", String)
], CostTracking.prototype, "type", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(CostProvider)),
        allowNull: true,
    }),
    sequelize_typescript_1.Index,
    tslib_1.__metadata("design:type", String)
], CostTracking.prototype, "provider", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", String)
], CostTracking.prototype, "name", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", String)
], CostTracking.prototype, "description", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Number)
], CostTracking.prototype, "amount", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
    }),
    tslib_1.__metadata("design:type", String)
], CostTracking.prototype, "currency", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: false,
    }),
    sequelize_typescript_1.Index,
    tslib_1.__metadata("design:type", Date)
], CostTracking.prototype, "periodStart", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: false,
    }),
    sequelize_typescript_1.Index,
    tslib_1.__metadata("design:type", Date)
], CostTracking.prototype, "periodEnd", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Number)
], CostTracking.prototype, "quantity", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", String)
], CostTracking.prototype, "unit", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 4),
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Number)
], CostTracking.prototype, "unitCost", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", String)
], CostTracking.prototype, "invoiceNumber", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", String)
], CostTracking.prototype, "vendorId", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", String)
], CostTracking.prototype, "department", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", String)
], CostTracking.prototype, "project", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Array)
], CostTracking.prototype, "tags", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    }),
    tslib_1.__metadata("design:type", Boolean)
], CostTracking.prototype, "isRecurring", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", String)
], CostTracking.prototype, "recurringInterval", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Date)
], CostTracking.prototype, "nextBillingDate", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    }),
    tslib_1.__metadata("design:type", Boolean)
], CostTracking.prototype, "isApproved", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", String)
], CostTracking.prototype, "approvedBy", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Date)
], CostTracking.prototype, "approvedAt", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Object)
], CostTracking.prototype, "metadata", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], CostTracking.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], CostTracking.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BeforeCreate,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], CostTracking, "calculateUnitCost", null);
exports.CostTracking = CostTracking = tslib_1.__decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'cost_tracking',
        timestamps: true,
    })
], CostTracking);
