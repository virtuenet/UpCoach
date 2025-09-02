"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOC2Control = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
class SOC2Control extends sequelize_1.Model {
    id;
    controlId;
    criteria;
    category;
    description;
    implementation;
    status;
    riskLevel;
    owner;
    reviewDate;
    nextReviewDate;
    testingFrequency;
    testing;
    remediationRequired;
    findings;
    evidence;
    createdAt;
    updatedAt;
}
exports.SOC2Control = SOC2Control;
SOC2Control.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    controlId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    criteria: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    category: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    implementation: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('draft', 'implemented', 'testing', 'active', 'remediation_required'),
        allowNull: false,
        defaultValue: 'draft',
    },
    riskLevel: {
        type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'low',
    },
    owner: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    reviewDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    nextReviewDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    testingFrequency: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    testing: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    remediationRequired: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    findings: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
    },
    evidence: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
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
    modelName: 'SOC2Control',
    tableName: 'soc2_controls',
    timestamps: true,
});
//# sourceMappingURL=SOC2Control.js.map