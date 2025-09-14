"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const sequelize_1 = require("sequelize");
dotenv.config({ path: path_1.default.resolve(__dirname, '../../../../.env.test') });
const Goal_1 = require("../../models/Goal");
const User_1 = require("../../models/User");
const Task_1 = require("../../models/Task");
const sequelize = new sequelize_1.Sequelize('sqlite::memory:', {
    logging: false,
    dialect: 'sqlite'
});
exports.sequelize = sequelize;
const goalAttributes = {
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    userId: { type: sequelize_1.DataTypes.UUID, allowNull: false },
    title: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    targetDate: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    category: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    priority: { type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium', allowNull: false },
    status: { type: sequelize_1.DataTypes.ENUM('not_started', 'in_progress', 'completed', 'abandoned'), defaultValue: 'not_started', allowNull: false },
    progress: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    milestones: { type: sequelize_1.DataTypes.JSON, allowNull: true },
    reminders: { type: sequelize_1.DataTypes.JSON, allowNull: true },
    isArchived: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    completedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true }
};
const userAttributes = {
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    email: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
    password: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    role: { type: sequelize_1.DataTypes.ENUM('user', 'admin', 'coach'), defaultValue: 'user', allowNull: false },
    avatar: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    bio: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    googleId: { type: sequelize_1.DataTypes.STRING, allowNull: true, unique: true },
    organizationId: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    isActive: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
    emailVerified: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    onboardingCompleted: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: true },
    onboardingCompletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    onboardingSkipped: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: true },
    lastLoginAt: { type: sequelize_1.DataTypes.DATE, allowNull: true }
};
const taskAttributes = {
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    userId: { type: sequelize_1.DataTypes.UUID, allowNull: false },
    goalId: { type: sequelize_1.DataTypes.UUID, allowNull: true },
    title: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    dueDate: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    priority: { type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium', allowNull: false },
    status: { type: sequelize_1.DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'), defaultValue: 'pending', allowNull: false },
    category: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    tags: { type: sequelize_1.DataTypes.JSON, allowNull: true, defaultValue: [] },
    estimatedTime: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    actualTime: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    isRecurring: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    recurringPattern: { type: sequelize_1.DataTypes.JSON, allowNull: true },
    completedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true }
};
Goal_1.Goal.init(goalAttributes, {
    sequelize,
    modelName: 'Goal',
    tableName: 'goals',
    timestamps: true
});
User_1.User.init(userAttributes, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true
});
Task_1.Task.init(taskAttributes, {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    timestamps: true
});
Goal_1.Goal.associate({ User: User_1.User, Task: Task_1.Task });
User_1.User.associate({ Goal: Goal_1.Goal, Task: Task_1.Task });
Task_1.Task.associate({ Goal: Goal_1.Goal, User: User_1.User });
beforeAll(async () => {
    await sequelize.sync({ force: true });
});
afterAll(async () => {
    await sequelize.close();
});
//# sourceMappingURL=ai-test-setup.js.map