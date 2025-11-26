import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface ChatAttributes {
  id: string;
  userId: string;
  title?: string;
  type: 'general' | 'goal' | 'task' | 'mood' | 'coaching';
  context?: unknown;
  isActive: boolean;
  lastMessageAt?: Date;
  messageCount: number;
  metadata?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatCreationAttributes
  extends Optional<
    ChatAttributes,
    | 'id'
    | 'title'
    | 'type'
    | 'context'
    | 'isActive'
    | 'lastMessageAt'
    | 'messageCount'
    | 'metadata'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class Chat extends Model<ChatAttributes, ChatCreationAttributes> implements ChatAttributes {
  public id!: string;
  public userId!: string;
  public title?: string;
  public type!: 'general' | 'goal' | 'task' | 'mood' | 'coaching';
  public context?: unknown;
  public isActive!: boolean;
  public lastMessageAt?: Date;
  public messageCount!: number;
  public metadata?: unknown;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public static associate(models: unknown) {
    Chat.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Chat.hasMany(models.ChatMessage, { foreignKey: 'chatId', as: 'messages' });
  }

  // Static method declaration for lazy initialization
  static initializeModel: (sequelize: Sequelize) => typeof Chat;
}

// Static method for deferred initialization
Chat.initializeModel = function(sequelizeInstance: Sequelize) {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance required for Chat initialization');
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
    sequelize: sequelizeInstance,
    modelName: 'Chat',
    tableName: 'chats',
    timestamps: true,
  }
);

  return Chat;
};

// Comment out immediate initialization to prevent premature execution
// Chat.init(...) will be called via Chat.initializeModel() after database is ready

export default Chat;
