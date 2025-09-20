"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserActivity = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../config/sequelize");
class UserActivity extends sequelize_1.Model {
    id;
    userId;
    activityType;
    activityData;
    sessionId;
    durationSeconds;
    platform;
    deviceType;
    appVersion;
    user;
    static associate(models) {
        UserActivity.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
}
exports.UserActivity = UserActivity;
UserActivity.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    activityType: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        field: 'activity_type',
    },
    activityData: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        field: 'activity_data',
    },
    sessionId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'session_id',
    },
    durationSeconds: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        field: 'duration_seconds',
    },
    platform: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    deviceType: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
        field: 'device_type',
    },
    appVersion: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
        field: 'app_version',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
        field: 'created_at',
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'UserActivity',
    tableName: 'user_activity_logs',
    timestamps: false,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['activity_type'] },
        { fields: ['created_at'] },
        { fields: ['session_id'] },
    ],
});
//# sourceMappingURL=UserActivity.js.map