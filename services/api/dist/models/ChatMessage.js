"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../config/sequelize");
class ChatMessage extends sequelize_1.Model {
    id;
    chatId;
    role;
    content;
    metadata;
    parentMessageId;
    isEdited;
    editedAt;
    // Associations
    static associate(models) {
        ChatMessage.belongsTo(models.Chat, { foreignKey: 'chatId', as: 'chat' });
        ChatMessage.belongsTo(models.ChatMessage, {
            foreignKey: 'parentMessageId',
            as: 'parentMessage',
        });
        ChatMessage.hasMany(models.ChatMessage, { foreignKey: 'parentMessageId', as: 'replies' });
    }
}
exports.ChatMessage = ChatMessage;
ChatMessage.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    chatId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'chats',
            key: 'id',
        },
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('user', 'assistant', 'system'),
        allowNull: false,
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    parentMessageId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'chat_messages',
            key: 'id',
        },
    },
    isEdited: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    editedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'ChatMessage',
    tableName: 'chat_messages',
    timestamps: true,
});
//# sourceMappingURL=ChatMessage.js.map