import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface ChatMessageAttributes {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: unknown;
  parentMessageId?: string;
  isEdited: boolean;
  editedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatMessageCreationAttributes
  extends Optional<
    ChatMessageAttributes,
    'id' | 'metadata' | 'parentMessageId' | 'isEdited' | 'editedAt' | 'createdAt' | 'updatedAt'
  > {}

export class ChatMessage
  extends Model<ChatMessageAttributes, ChatMessageCreationAttributes>
  implements ChatMessageAttributes
{
  public id!: string;
  public chatId!: string;
  public role!: 'user' | 'assistant' | 'system';
  public content!: string;
  public metadata?: unknown;
  public parentMessageId?: string;
  public isEdited!: boolean;
  public editedAt?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public static associate(models: unknown) {
    ChatMessage.belongsTo(models.Chat, { foreignKey: 'chatId', as: 'chat' });
    ChatMessage.belongsTo(models.ChatMessage, {
      foreignKey: 'parentMessageId',
      as: 'parentMessage',
    });
    ChatMessage.hasMany(models.ChatMessage, { foreignKey: 'parentMessageId', as: 'replies' });
  }

  // Static method declaration for lazy initialization
  static initializeModel: (sequelize: Sequelize) => typeof ChatMessage;
}

// Static method for deferred initialization
ChatMessage.initializeModel = function(sequelizeInstance: Sequelize) {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance required for ChatMessage initialization');
  }

  ChatMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    chatId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chats',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.ENUM('user', 'assistant', 'system'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    parentMessageId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'chat_messages',
        key: 'id',
      },
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize: sequelizeInstance,
    modelName: 'ChatMessage',
    tableName: 'chat_messages',
    timestamps: true,
  }
);

  return ChatMessage;
};

// Comment out immediate initialization to prevent premature execution
// ChatMessage.init(...) will be called via ChatMessage.initializeModel() after database is ready

export default ChatMessage;
