"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueAnalytics = exports.ForecastModel = exports.AnalyticsPeriod = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
var AnalyticsPeriod;
(function (AnalyticsPeriod) {
    AnalyticsPeriod["DAILY"] = "daily";
    AnalyticsPeriod["WEEKLY"] = "weekly";
    AnalyticsPeriod["MONTHLY"] = "monthly";
    AnalyticsPeriod["QUARTERLY"] = "quarterly";
    AnalyticsPeriod["YEARLY"] = "yearly";
})(AnalyticsPeriod || (exports.AnalyticsPeriod = AnalyticsPeriod = {}));
var ForecastModel;
(function (ForecastModel) {
    ForecastModel["LINEAR"] = "linear";
    ForecastModel["EXPONENTIAL"] = "exponential";
    ForecastModel["ARIMA"] = "arima";
    ForecastModel["PROPHET"] = "prophet";
    ForecastModel["ENSEMBLE"] = "ensemble";
})(ForecastModel || (exports.ForecastModel = ForecastModel = {}));
let RevenueAnalytics = class RevenueAnalytics extends sequelize_typescript_1.Model {
    period;
    periodStart;
    periodEnd;
    cohortMonth;
    cohortSize;
    monthsSinceStart;
    retentionRate;
    cohortRevenue;
    cumulativeCohortRevenue;
    revenueBySegment;
    customerSegments;
    expansionRevenue;
    expansionCount;
    contractionRevenue;
    contractionCount;
    forecastModel;
    forecastedRevenue;
    forecastLowerBound;
    forecastUpperBound;
    forecastConfidence;
    forecastAccuracy;
    churnPrediction;
    averageLtv;
    ltvBySegment;
    ltvDistribution;
    featureImpact;
    seasonalityFactors;
    hasAnomaly;
    anomalyDetails;
    metadata;
    get netExpansionRevenue() {
        return this.expansionRevenue - this.contractionRevenue;
    }
    get expansionRate() {
        if (this.cohortRevenue === 0)
            return 0;
        return (this.expansionRevenue / this.cohortRevenue) * 100;
    }
    get contractionRate() {
        if (this.cohortRevenue === 0)
            return 0;
        return (this.contractionRevenue / this.cohortRevenue) * 100;
    }
    get isForecastReliable() {
        return (this.forecastConfidence || 0) > 80 && (this.forecastAccuracy || 0) > 85;
    }
};
exports.RevenueAnalytics = RevenueAnalytics;
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
        primaryKey: true,
    }),
    tslib_1.__metadata("design:type", String)
], RevenueAnalytics.prototype, "id", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(AnalyticsPeriod)),
        allowNull: false,
    }),
    sequelize_typescript_1.Index,
    tslib_1.__metadata("design:type", String)
], RevenueAnalytics.prototype, "period", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: false,
    }),
    sequelize_typescript_1.Index,
    tslib_1.__metadata("design:type", Date)
], RevenueAnalytics.prototype, "periodStart", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: false,
    }),
    tslib_1.__metadata("design:type", Date)
], RevenueAnalytics.prototype, "periodEnd", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
    }),
    sequelize_typescript_1.Index,
    tslib_1.__metadata("design:type", String)
], RevenueAnalytics.prototype, "cohortMonth", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], RevenueAnalytics.prototype, "cohortSize", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], RevenueAnalytics.prototype, "monthsSinceStart", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], RevenueAnalytics.prototype, "retentionRate", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], RevenueAnalytics.prototype, "cohortRevenue", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], RevenueAnalytics.prototype, "cumulativeCohortRevenue", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Object)
], RevenueAnalytics.prototype, "revenueBySegment", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Object)
], RevenueAnalytics.prototype, "customerSegments", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], RevenueAnalytics.prototype, "expansionRevenue", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], RevenueAnalytics.prototype, "expansionCount", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], RevenueAnalytics.prototype, "contractionRevenue", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], RevenueAnalytics.prototype, "contractionCount", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(ForecastModel)),
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", String)
], RevenueAnalytics.prototype, "forecastModel", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Number)
], RevenueAnalytics.prototype, "forecastedRevenue", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Number)
], RevenueAnalytics.prototype, "forecastLowerBound", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2),
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Number)
], RevenueAnalytics.prototype, "forecastUpperBound", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Number)
], RevenueAnalytics.prototype, "forecastConfidence", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(5, 2),
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Number)
], RevenueAnalytics.prototype, "forecastAccuracy", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Object)
], RevenueAnalytics.prototype, "churnPrediction", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    }),
    tslib_1.__metadata("design:type", Number)
], RevenueAnalytics.prototype, "averageLtv", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Object)
], RevenueAnalytics.prototype, "ltvBySegment", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Object)
], RevenueAnalytics.prototype, "ltvDistribution", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Array)
], RevenueAnalytics.prototype, "featureImpact", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Object)
], RevenueAnalytics.prototype, "seasonalityFactors", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    }),
    tslib_1.__metadata("design:type", Boolean)
], RevenueAnalytics.prototype, "hasAnomaly", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Object)
], RevenueAnalytics.prototype, "anomalyDetails", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    tslib_1.__metadata("design:type", Object)
], RevenueAnalytics.prototype, "metadata", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.CreatedAt,
    tslib_1.__metadata("design:type", Date)
], RevenueAnalytics.prototype, "createdAt", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.UpdatedAt,
    tslib_1.__metadata("design:type", Date)
], RevenueAnalytics.prototype, "updatedAt", void 0);
exports.RevenueAnalytics = RevenueAnalytics = tslib_1.__decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'revenue_analytics',
        timestamps: true,
    })
], RevenueAnalytics);
