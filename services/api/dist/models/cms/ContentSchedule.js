"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
class ContentSchedule extends sequelize_1.Model {
    contentId;
    scheduleType;
    scheduledFor;
    status;
    metadata;
    createdBy;
    processedAt;
    error;
}
ContentSchedule.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    contentId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'content_articles',
            key: 'id',
        },
    },
    scheduleType: {
        type: sequelize_1.DataTypes.ENUM('publish', 'unpublish', 'update'),
        allowNull: false,
    },
    scheduledFor: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
    },
    createdBy: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    processedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    error: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'ContentSchedule',
    tableName: 'content_schedules',
    timestamps: true,
    indexes: [
        {
            fields: ['scheduledFor', 'status'],
        },
        {
            fields: ['contentId'],
        },
    ],
});
exports.default = ContentSchedule;
//# sourceMappingURL=ContentSchedule.js.map