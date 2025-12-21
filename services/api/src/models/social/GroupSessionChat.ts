/**
 * Group Session Chat Model
 * Stores chat messages, polls, and Q&A for group sessions
 */

import {
  Model,
  DataTypes,
  Sequelize,
  Optional,
} from 'sequelize';

// ==================== Types ====================

export type ChatMessageType = 'text' | 'poll' | 'announcement' | 'question' | 'answer' | 'system' | 'file' | 'reaction';
export type PollStatus = 'active' | 'closed' | 'cancelled';

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  voterIds: string[];
}

export interface PollData {
  question: string;
  options: PollOption[];
  status: PollStatus;
  allowMultiple: boolean;
  anonymous: boolean;
  showResults: boolean;
  closedAt?: Date;
}

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface GroupSessionChatAttributes {
  id: string;
  sessionId: string;
  userId: string;
  messageType: ChatMessageType;
  content: string;

  // Metadata
  replyToId?: string;
  threadId?: string;

  // Poll data (for poll messages)
  pollData?: PollData;

  // File attachments
  attachments: FileAttachment[];

  // Reactions
  reactions: Reaction[];

  // Moderation
  isPinned: boolean;
  isHighlighted: boolean;
  isHidden: boolean;
  hiddenBy?: string;
  hiddenReason?: string;

  // For Q&A
  isAnswered: boolean;
  answeredBy?: string;
  answeredAt?: Date;
  upvoteCount: number;
  upvoterIds: string[];

  // Timestamps
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupSessionChatCreationAttributes
  extends Optional<
    GroupSessionChatAttributes,
    | 'id'
    | 'attachments'
    | 'reactions'
    | 'isPinned'
    | 'isHighlighted'
    | 'isHidden'
    | 'isAnswered'
    | 'upvoteCount'
    | 'upvoterIds'
    | 'createdAt'
    | 'updatedAt'
  > {}

// ==================== Model ====================

export class GroupSessionChat
  extends Model<GroupSessionChatAttributes, GroupSessionChatCreationAttributes>
  implements GroupSessionChatAttributes
{
  public id!: string;
  public sessionId!: string;
  public userId!: string;
  public messageType!: ChatMessageType;
  public content!: string;

  public replyToId?: string;
  public threadId?: string;

  public pollData?: PollData;
  public attachments!: FileAttachment[];
  public reactions!: Reaction[];

  public isPinned!: boolean;
  public isHighlighted!: boolean;
  public isHidden!: boolean;
  public hiddenBy?: string;
  public hiddenReason?: string;

  public isAnswered!: boolean;
  public answeredBy?: string;
  public answeredAt?: Date;
  public upvoteCount!: number;
  public upvoterIds!: string[];

  public editedAt?: Date;
  public deletedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public get isVisible(): boolean {
    return !this.isHidden && !this.deletedAt;
  }

  public get isPoll(): boolean {
    return this.messageType === 'poll' && !!this.pollData;
  }

  public get isPollActive(): boolean {
    return this.isPoll && this.pollData?.status === 'active';
  }

  public get totalPollVotes(): number {
    if (!this.pollData) return 0;
    return this.pollData.options.reduce((sum, opt) => sum + opt.voteCount, 0);
  }

  public get totalReactions(): number {
    return this.reactions.reduce((sum, r) => sum + r.count, 0);
  }

  public addReaction(emoji: string, userId: string): void {
    const existing = this.reactions.find(r => r.emoji === emoji);
    if (existing) {
      if (!existing.userIds.includes(userId)) {
        existing.count++;
        existing.userIds.push(userId);
      }
    } else {
      this.reactions.push({
        emoji,
        count: 1,
        userIds: [userId],
      });
    }
  }

  public removeReaction(emoji: string, userId: string): void {
    const existing = this.reactions.find(r => r.emoji === emoji);
    if (existing && existing.userIds.includes(userId)) {
      existing.count--;
      existing.userIds = existing.userIds.filter(id => id !== userId);
      if (existing.count === 0) {
        this.reactions = this.reactions.filter(r => r.emoji !== emoji);
      }
    }
  }

  public votePoll(optionId: string, userId: string): boolean {
    if (!this.pollData || this.pollData.status !== 'active') return false;

    // Check if user already voted (unless multiple allowed)
    if (!this.pollData.allowMultiple) {
      const alreadyVoted = this.pollData.options.some(opt =>
        opt.voterIds.includes(userId)
      );
      if (alreadyVoted) return false;
    }

    const option = this.pollData.options.find(opt => opt.id === optionId);
    if (!option || option.voterIds.includes(userId)) return false;

    option.voteCount++;
    option.voterIds.push(userId);
    return true;
  }

  public closePoll(): void {
    if (this.pollData) {
      this.pollData.status = 'closed';
      this.pollData.closedAt = new Date();
    }
  }

  public upvote(userId: string): boolean {
    if (this.upvoterIds.includes(userId)) return false;
    this.upvoteCount++;
    this.upvoterIds.push(userId);
    return true;
  }

  public removeUpvote(userId: string): boolean {
    if (!this.upvoterIds.includes(userId)) return false;
    this.upvoteCount--;
    this.upvoterIds = this.upvoterIds.filter(id => id !== userId);
    return true;
  }

  public toPublicJSON(requestingUserId?: string): Record<string, any> {
    const json: Record<string, any> = {
      id: this.id,
      sessionId: this.sessionId,
      userId: this.userId,
      messageType: this.messageType,
      content: this.content,
      replyToId: this.replyToId,
      threadId: this.threadId,
      attachments: this.attachments,
      reactions: this.reactions,
      isPinned: this.isPinned,
      isHighlighted: this.isHighlighted,
      createdAt: this.createdAt,
      editedAt: this.editedAt,
    };

    // Handle poll data visibility
    if (this.pollData) {
      json.pollData = {
        question: this.pollData.question,
        options: this.pollData.options.map(opt => ({
          id: opt.id,
          text: opt.text,
          voteCount: this.pollData!.showResults ? opt.voteCount : undefined,
          hasVoted: requestingUserId ? opt.voterIds.includes(requestingUserId) : false,
        })),
        status: this.pollData.status,
        allowMultiple: this.pollData.allowMultiple,
        showResults: this.pollData.showResults,
      };
    }

    // Handle Q&A specific fields
    if (this.messageType === 'question') {
      json.isAnswered = this.isAnswered;
      json.upvoteCount = this.upvoteCount;
      json.hasUpvoted = requestingUserId
        ? this.upvoterIds.includes(requestingUserId)
        : false;
    }

    return json;
  }
}

// ==================== Initialization ====================

export function initGroupSessionChat(sequelize: Sequelize): typeof GroupSessionChat {
  GroupSessionChat.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      sessionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'group_sessions',
          key: 'id',
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      messageType: {
        type: DataTypes.ENUM('text', 'poll', 'announcement', 'question', 'answer', 'system', 'file', 'reaction'),
        allowNull: false,
        defaultValue: 'text',
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      replyToId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'group_session_chats',
          key: 'id',
        },
      },
      threadId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      pollData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      attachments: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      reactions: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      isPinned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isHighlighted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isHidden: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hiddenBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      hiddenReason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isAnswered: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      answeredBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      answeredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      upvoteCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      upvoterIds: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      editedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'group_session_chats',
      timestamps: true,
      paranoid: false,
      indexes: [
        { fields: ['sessionId'] },
        { fields: ['userId'] },
        { fields: ['messageType'] },
        { fields: ['sessionId', 'createdAt'] },
        { fields: ['threadId'] },
        { fields: ['isPinned'] },
        { fields: ['isAnswered'] },
      ],
    }
  );

  return GroupSessionChat;
}

export default GroupSessionChat;
