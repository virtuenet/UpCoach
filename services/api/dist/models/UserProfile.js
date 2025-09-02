"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfile = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class UserProfile extends sequelize_1.Model {
    id;
    userId;
    age;
    occupation;
    timezone;
    coachingStyle;
    sessionFrequency;
    commitmentLevel;
    learningStyle;
    communicationPreference;
    personalityType;
    aiPersonalization;
    coachingPreferences;
    behaviorPatterns;
    progressMetrics;
    strengths;
    growthAreas;
    motivators;
    obstacles;
    preferences;
    metadata;
}
exports.UserProfile = UserProfile;
UserProfile.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    age: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    occupation: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    timezone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        defaultValue: 'UTC',
    },
    coachingStyle: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    sessionFrequency: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    commitmentLevel: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    learningStyle: {
        type: sequelize_1.DataTypes.ENUM('visual', 'auditory', 'kinesthetic', 'reading', 'balanced'),
        defaultValue: 'balanced',
    },
    communicationPreference: {
        type: sequelize_1.DataTypes.ENUM('supportive', 'direct', 'analytical', 'motivational', 'empathetic'),
        defaultValue: 'supportive',
    },
    personalityType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    aiPersonalization: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
    },
    coachingPreferences: {
        type: sequelize_1.DataTypes.JSONB,
        defaultValue: {
            preferredMethods: ['goal', 'habit', 'reflection'],
            sessionFrequency: 'weekly',
            sessionDuration: 30,
            preferredTimes: ['morning', 'evening'],
            focusAreas: ['productivity', 'wellbeing'],
        },
    },
    behaviorPatterns: {
        type: sequelize_1.DataTypes.JSONB,
        defaultValue: {
            avgSessionDuration: 0,
            completionRate: 0,
            engagementLevel: 0,
            preferredTopics: [],
            responseTime: 0,
            consistencyScore: 0,
        },
    },
    progressMetrics: {
        type: sequelize_1.DataTypes.JSONB,
        defaultValue: {
            totalGoalsSet: 0,
            goalsCompleted: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalSessions: 0,
            accountAge: 0,
            lastActiveDate: new Date(),
        },
    },
    strengths: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        defaultValue: [],
    },
    growthAreas: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        defaultValue: [],
    },
    motivators: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        defaultValue: [],
    },
    obstacles: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        defaultValue: [],
    },
    preferences: {
        type: sequelize_1.DataTypes.JSONB,
        defaultValue: {},
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        defaultValue: {},
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'UserProfile',
    tableName: 'user_profiles',
    timestamps: true,
    indexes: [
        {
            fields: ['userId'],
            unique: true,
        },
        {
            fields: ['learningStyle'],
        },
        {
            fields: ['communicationPreference'],
        },
    ],
});
exports.default = UserProfile;
//# sourceMappingURL=UserProfile.js.map