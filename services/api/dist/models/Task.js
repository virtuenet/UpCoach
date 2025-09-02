"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../config/sequelize");
class Task extends sequelize_1.Model {
    id;
    userId;
    goalId;
    title;
    description;
    dueDate;
    priority;
    status;
    category;
    tags;
    estimatedTime;
    actualTime;
    isRecurring;
    recurringPattern;
    completedAt;
    // Associations
    static associate(models) {
        Task.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        Task.belongsTo(models.Goal, { foreignKey: 'goalId', as: 'goal' });
    }
}
exports.Task = Task;
Task.init({
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
    goalId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'goals',
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
    dueDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium',
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false,
    },
    category: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    tags: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
    },
    estimatedTime: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    actualTime: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    isRecurring: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    recurringPattern: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    completedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    timestamps: true,
});
//# sourceMappingURL=Task.js.map