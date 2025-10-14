"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceJournalEntry = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../config/sequelize");
class VoiceJournalEntry extends sequelize_1.Model {
    id;
    userId;
    title;
    audioPath;
    duration;
    transcription;
    notes;
    tags;
    mood;
    emotions;
    isProcessing;
    processedAt;
    processingError;
    metadata;
    isFavorite;
    isArchived;
    syncedAt;
    deviceId;
    user;
    static associate(models) {
        VoiceJournalEntry.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
}
exports.VoiceJournalEntry = VoiceJournalEntry;
VoiceJournalEntry.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    title: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    audioPath: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
    },
    duration: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
        comment: 'Duration in seconds',
    },
    transcription: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    tags: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        defaultValue: [],
        allowNull: false,
    },
    mood: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    emotions: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        comment: 'Emotion analysis results from voice',
    },
    isProcessing: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    processedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    processingError: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    isFavorite: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    isArchived: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    syncedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    deviceId: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'VoiceJournalEntry',
    tableName: 'VoiceJournalEntries',
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            fields: ['userId'],
        },
        {
            fields: ['createdAt'],
        },
        {
            fields: ['mood'],
        },
        {
            fields: ['isProcessing'],
        },
        {
            fields: ['isFavorite'],
        },
        {
            fields: ['isArchived'],
        },
        {
            fields: ['tags'],
            using: 'GIN',
        },
        {
            name: 'voice_journal_search_idx',
            fields: ['title', 'transcription'],
            type: 'FULLTEXT',
        },
    ],
});
exports.default = VoiceJournalEntry;
