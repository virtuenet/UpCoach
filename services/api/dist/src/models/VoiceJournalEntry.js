"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceJournalEntry = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class VoiceJournalEntry extends sequelize_1.Model {
    id;
    title;
    transcriptionText;
    audioFilePath;
    duration;
    summary;
    tags;
    emotionalTone;
    isTranscribed;
    isAnalyzed;
    isFavorite;
    userId;
    createdAt;
    updatedAt;
}
exports.VoiceJournalEntry = VoiceJournalEntry;
VoiceJournalEntry.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 255],
        },
    },
    transcriptionText: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    audioFilePath: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    duration: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
        },
    },
    summary: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    tags: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
    },
    emotionalTone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            isIn: [['positive', 'negative', 'neutral', 'mixed']],
        },
    },
    isTranscribed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    isAnalyzed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    isFavorite: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
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
    sequelize: database_1.sequelize,
    modelName: 'VoiceJournalEntry',
    tableName: 'voice_journal_entries',
    timestamps: true,
    indexes: [
        {
            fields: ['userId'],
        },
        {
            fields: ['userId', 'createdAt'],
        },
        {
            fields: ['userId', 'isFavorite'],
        },
        {
            fields: ['userId', 'isTranscribed'],
        },
        {
            fields: ['userId', 'isAnalyzed'],
        },
    ],
});
exports.default = VoiceJournalEntry;
//# sourceMappingURL=VoiceJournalEntry.js.map