"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mood = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../config/sequelize");
class Mood extends sequelize_1.Model {
    id;
    userId;
    mood;
    moodScore;
    notes;
    activities;
    emotions;
    physicalSymptoms;
    sleepQuality;
    stressLevel;
    energyLevel;
    location;
    weather;
    // Associations
    static associate(models) {
        Mood.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
}
exports.Mood = Mood;
Mood.init({
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
    mood: {
        type: sequelize_1.DataTypes.ENUM('great', 'good', 'okay', 'bad', 'terrible'),
        allowNull: false,
    },
    moodScore: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5,
        },
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    activities: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
    },
    emotions: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
    },
    physicalSymptoms: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
    },
    sleepQuality: {
        type: sequelize_1.DataTypes.ENUM('excellent', 'good', 'fair', 'poor', 'terrible'),
        allowNull: true,
    },
    stressLevel: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 10,
        },
    },
    energyLevel: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 10,
        },
    },
    location: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    weather: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'Mood',
    tableName: 'moods',
    timestamps: true,
});
//# sourceMappingURL=Mood.js.map