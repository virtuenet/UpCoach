"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Goal = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../config/sequelize");
class Goal extends sequelize_1.Model {
    id;
    userId;
    title;
    description;
    targetDate;
    category;
    priority;
    status;
    progress;
    milestones;
    reminders;
    isArchived;
    completedAt;
    // Associations
    static associate(models) {
        Goal.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        Goal.hasMany(models.Task, { foreignKey: 'goalId', as: 'tasks' });
    }
}
exports.Goal = Goal;
Goal.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
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
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    targetDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    category: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium',
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('not_started', 'in_progress', 'completed', 'abandoned'),
        defaultValue: 'not_started',
        allowNull: false,
    },
    progress: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        validate: {
            min: 0,
            max: 100,
        },
    },
    milestones: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    reminders: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    isArchived: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    completedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'Goal',
    tableName: 'goals',
    timestamps: true,
});
//# sourceMappingURL=Goal.js.map