"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHIAccessLog = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
class PHIAccessLog extends sequelize_1.Model {
    id;
    userId;
    accessedBy;
    phiType;
    action;
    accessReason;
    ipAddress;
    userAgent;
    sessionId;
    dataFields;
    expiresAt;
    riskLevel;
    complianceFlags;
    auditTrail;
    createdAt;
    updatedAt;
}
exports.PHIAccessLog = PHIAccessLog;
PHIAccessLog.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    accessedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    phiType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    action: {
        type: sequelize_1.DataTypes.ENUM('view', 'create', 'update', 'delete', 'export'),
        allowNull: false,
    },
    accessReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    ipAddress: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    userAgent: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    sessionId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    dataFields: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    expiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    riskLevel: {
        type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'low',
    },
    complianceFlags: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    auditTrail: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
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
    modelName: 'PHIAccessLog',
    tableName: 'phi_access_logs',
    timestamps: true,
});
//# sourceMappingURL=PHIAccessLog.js.map