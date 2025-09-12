"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOC2Incident = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
class SOC2Incident extends sequelize_1.Model {
    id;
    incidentId;
    title;
    description;
    category;
    severity;
    status;
    reportedBy;
    assignedTo;
    reportedDate;
    detectedDate;
    resolvedDate;
    targetResolutionDate;
    impactAssessment;
    rootCause;
    remediationActions;
    lessons;
    impactLevel;
    affectedSystems;
    communicationLog;
    createdAt;
    updatedAt;
}
exports.SOC2Incident = SOC2Incident;
SOC2Incident.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    incidentId: {
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
    category: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    severity: {
        type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('open', 'investigating', 'resolved', 'closed'),
        allowNull: false,
        defaultValue: 'open',
    },
    reportedBy: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    assignedTo: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    reportedDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    detectedDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    resolvedDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    targetResolutionDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    impactAssessment: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
    },
    rootCause: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    remediationActions: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
    },
    lessons: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    impactLevel: {
        type: sequelize_1.DataTypes.ENUM('none', 'minimal', 'moderate', 'significant', 'severe'),
        allowNull: false,
        defaultValue: 'minimal',
    },
    affectedSystems: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
    },
    communicationLog: {
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
    modelName: 'SOC2Incident',
    tableName: 'soc2_incidents',
    timestamps: true,
});
//# sourceMappingURL=SOC2Incident.js.map