"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOC2Assessment = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
class SOC2Assessment extends sequelize_1.Model {
    id;
    assessmentId;
    title;
    description;
    assessmentType;
    scope;
    status;
    startDate;
    endDate;
    assessor;
    riskRating;
    findings;
    recommendations;
    nextReviewDate;
    evidence;
    createdAt;
    updatedAt;
}
exports.SOC2Assessment = SOC2Assessment;
SOC2Assessment.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    assessmentId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    assessmentType: {
        type: sequelize_1.DataTypes.ENUM('internal', 'external', 'third_party'),
        allowNull: false,
    },
    scope: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('planned', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'planned',
    },
    startDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    endDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    assessor: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    riskRating: {
        type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'low',
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
    nextReviewDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    evidence: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
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
    modelName: 'SOC2Assessment',
    tableName: 'soc2_assessments',
    timestamps: true,
});
//# sourceMappingURL=SOC2Assessment.js.map