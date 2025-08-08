import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from './index';

export interface ChatAttributes {
  id: string;
  userId: string;
  title?: string;
  type: 'general' | 'goal' | 'task' | 'mood' | 'coaching';
  context?: any;
  isActive: boolean;
  lastMessageAt?: Date;
  messageCount: number;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatCreationAttributes extends Optional<ChatAttributes, 'id' | 'title' | 'type' | 'context' | 'isActive' | 'lastMessageAt' | 'messageCount' | 'metadata' | 'createdAt' | 'updatedAt'> {}

export class Chat extends Model<ChatAttributes, ChatCreationAttributes> implements ChatAttributes {
  public id!: string;
  public userId!: string;
  public title?: string;
  public type!: 'general' | 'goal' | 'task' | 'mood' | 'coaching';
  public context?: any;
  public isActive!: boolean;
  public lastMessageAt?: Date;
  public messageCount!: number;
  public metadata?: any;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public static associate(models: any) {
    Chat.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Chat.hasMany(models.ChatMessage, { foreignKey: 'chatId', as: 'messages' });
  }
}

Chat.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('general', 'goal', 'task', 'mood', 'coaching'),
      defaultValue: 'general',
      allowNull: false,
    },
    context: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    messageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Chat',
    tableName: 'chats',
    timestamps: true,
  }
);