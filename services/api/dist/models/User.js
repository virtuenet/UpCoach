"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../config/sequelize");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class User extends sequelize_1.Model {
    id;
    email;
    password;
    name;
    role;
    avatar;
    bio;
    googleId;
    organizationId;
    isActive;
    emailVerified;
    onboardingCompleted;
    onboardingCompletedAt;
    onboardingSkipped;
    lastLoginAt;
    // Association properties
    profile;
    goals;
    tasks;
    moods;
    chats;
    // Instance methods
    async comparePassword(password) {
        return bcryptjs_1.default.compare(password, this.password);
    }
    // Associations
    static associate(models) {
        // User has one profile
        User.hasOne(models.UserProfile, { foreignKey: 'userId', as: 'profile' });
        // User has many goals
        User.hasMany(models.Goal, { foreignKey: 'userId', as: 'goals' });
        // User has many tasks
        User.hasMany(models.Task, { foreignKey: 'userId', as: 'tasks' });
        // User has many moods
        User.hasMany(models.Mood, { foreignKey: 'userId', as: 'moods' });
        // User has many chats
        User.hasMany(models.Chat, { foreignKey: 'userId', as: 'chats' });
        // User has many content (as author)
        User.hasMany(models.Content, { foreignKey: 'authorId', as: 'content' });
    }
}
exports.User = User;
User.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('user', 'admin', 'coach'),
        defaultValue: 'user',
        allowNull: false,
    },
    avatar: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    bio: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    googleId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },
    emailVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    onboardingCompleted: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
    },
    onboardingCompletedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    onboardingSkipped: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
    },
    lastLoginAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                // Use bcrypt rounds from config or default to 14 for security
                const rounds = parseInt(process.env.BCRYPT_ROUNDS || '14', 10);
                user.password = await bcryptjs_1.default.hash(user.password, rounds);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                // Use bcrypt rounds from config or default to 14 for security
                const rounds = parseInt(process.env.BCRYPT_ROUNDS || '14', 10);
                user.password = await bcryptjs_1.default.hash(user.password, rounds);
            }
        },
    },
});
//# sourceMappingURL=User.js.map