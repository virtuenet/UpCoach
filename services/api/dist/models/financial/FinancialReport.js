"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialReport = exports.ReportFormat = exports.ReportStatus = exports.ReportType = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
var ReportType;
(function (ReportType) {
    ReportType["DAILY_SUMMARY"] = "daily_summary";
    ReportType["WEEKLY_BUSINESS_REVIEW"] = "weekly_business_review";
    ReportType["MONTHLY_P_AND_L"] = "monthly_p_and_l";
    ReportType["QUARTERLY_INVESTOR"] = "quarterly_investor";
    ReportType["CUSTOM"] = "custom";
})(ReportType || (exports.ReportType = ReportType = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING"] = "pending";
    ReportStatus["GENERATING"] = "generating";
    ReportStatus["COMPLETED"] = "completed";
    ReportStatus["FAILED"] = "failed";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var ReportFormat;
(function (ReportFormat) {
    ReportFormat["JSON"] = "json";
    ReportFormat["PDF"] = "pdf";
    ReportFormat["EXCEL"] = "excel";
    ReportFormat["CSV"] = "csv";
})(ReportFormat || (exports.ReportFormat = ReportFormat = {}));
class FinancialReport extends sequelize_1.Model {
    id;
    type;
    title;
    description;
    status;
    format;
    scheduledFor;
    generatedAt;
    parameters;
    data;
    error;
    recipients;
    fileUrl;
    /**
     * Helper method to check if report is ready
     */
    isReady() {
        return this.status === ReportStatus.COMPLETED;
    }
    /**
     * Helper method to check if report failed
     */
    hasFailed() {
        return this.status === ReportStatus.FAILED;
    }
    /**
     * Get formatted report data
     */
    getFormattedData() {
        if (!this.data)
            return null;
        switch (this.format) {
            case ReportFormat.JSON:
                return this.data;
            case ReportFormat.PDF:
            case ReportFormat.EXCEL:
            case ReportFormat.CSV:
                // These would be generated from the data
                return {
                    fileUrl: this.fileUrl,
                    data: this.data,
                };
            default:
                return this.data;
        }
    }
}
exports.FinancialReport = FinancialReport;
FinancialReport.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(ReportType)),
        allowNull: false,
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(ReportStatus)),
        allowNull: false,
        defaultValue: ReportStatus.PENDING,
    },
    format: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(ReportFormat)),
        allowNull: false,
        defaultValue: ReportFormat.JSON,
    },
    scheduledFor: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    generatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    parameters: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    data: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    error: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    recipients: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
    },
    fileUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'FinancialReport',
    tableName: 'financial_reports',
    timestamps: true,
    indexes: [
        {
            fields: ['type'],
        },
        {
            fields: ['status'],
        },
        {
            fields: ['scheduledFor'],
        },
        {
            fields: ['createdAt'],
        },
    ],
});
exports.default = FinancialReport;
//# sourceMappingURL=FinancialReport.js.map