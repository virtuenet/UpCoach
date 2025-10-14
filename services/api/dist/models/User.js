"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const tslib_1 = require("tslib");
const bcrypt = tslib_1.__importStar(require("bcryptjs"));
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../config/sequelize");
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
    profile;
    goals;
    tasks;
    moods;
    chats;
    subscriptions;
    activities;
    async comparePassword(password) {
        return bcrypt.compare(password, this.password);
    }
    static associate(models) {
        User.hasOne(models.UserProfile, { foreignKey: 'userId', as: 'profile' });
        User.hasMany(models.Goal, { foreignKey: 'userId', as: 'goals' });
        User.hasMany(models.Task, { foreignKey: 'userId', as: 'tasks' });
        User.hasMany(models.Mood, { foreignKey: 'userId', as: 'moods' });
        User.hasMany(models.Chat, { foreignKey: 'userId', as: 'chats' });
        User.hasMany(models.Content, { foreignKey: 'authorId', as: 'content' });
        User.hasMany(models.Subscription, { foreignKey: 'userId', as: 'subscriptions' });
        User.hasMany(models.UserActivity, { foreignKey: 'userId', as: 'activities' });
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
                const rounds = parseInt(process.env.BCRYPT_ROUNDS || '14', 10);
                user.password = await bcrypt.hash(user.password, rounds);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const rounds = parseInt(process.env.BCRYPT_ROUNDS || '14', 10);
                user.password = await bcrypt.hash(user.password, rounds);
            }
        },
    },
});
