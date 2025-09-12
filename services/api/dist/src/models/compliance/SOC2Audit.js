"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOC2Audit = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
class SOC2Audit extends sequelize_1.Model {
    id;
    auditId;
    auditType;
    period;
    auditor;
    status;
    scope;
    findings;
    recommendations;
    reviewDate;
    findingsCount;
    inappropriateAccess;
    reportUrl;
    createdAt;
    updatedAt;
}
exports.SOC2Audit = SOC2Audit;
SOC2Audit.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    auditId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    auditType: {
        type: sequelize_1.DataTypes.ENUM('type1', 'type2'),
        allowNull: false,
    },
    period: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
    },
    auditor: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('planned', 'in_progress', 'completed', 'issued'),
        allowNull: false,
        defaultValue: 'planned',
    },
    scope: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
    },
    findings: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
    },
    recommendations: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
    },
    reviewDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    findingsCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    inappropriateAccess: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    reportUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'SOC2Audit',
    tableName: 'soc2_audits',
    timestamps: true,
});
//# sourceMappingURL=SOC2Audit.js.map