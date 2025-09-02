"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../config/sequelize");
class Chat extends sequelize_1.Model {
    id;
    userId;
    title;
    type;
    context;
    isActive;
    lastMessageAt;
    messageCount;
    metadata;
    // Associations
    static associate(models) {
        Chat.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        Chat.hasMany(models.ChatMessage, { foreignKey: 'chatId', as: 'messages' });
    }
}
exports.Chat = Chat;
Chat.init({
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
        allowNull: true,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('general', 'goal', 'task', 'mood', 'coaching'),
        defaultValue: 'general',
        allowNull: false,
    },
    context: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },
    lastMessageAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    messageCount: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'Chat',
    tableName: 'chats',
    timestamps: true,
});
//# sourceMappingURL=Chat.js.map