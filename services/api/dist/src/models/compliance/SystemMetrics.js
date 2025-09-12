"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemMetrics = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
class SystemMetrics extends sequelize_1.Model {
    id;
    metricDate;
    systemName;
    uptime;
    downtime;
    incidents;
    responseTime;
    throughput;
    errorRate;
    availability;
    performanceMetrics;
    securityMetrics;
    createdAt;
    updatedAt;
}
exports.SystemMetrics = SystemMetrics;
SystemMetrics.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    metricDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    systemName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    uptime: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    downtime: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    incidents: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    responseTime: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    throughput: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    errorRate: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    availability: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    performanceMetrics: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
    },
    securityMetrics: {
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
    modelName: 'SystemMetrics',
    tableName: 'system_metrics',
    timestamps: true,
});
//# sourceMappingURL=SystemMetrics.js.map