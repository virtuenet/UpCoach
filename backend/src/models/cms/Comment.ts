import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../index';

export interface CommentAttributes {
  id: string;
  content: string;
  contentType: 'article' | 'course' | 'template';
  contentId: string;
  
  // Comment metadata
  type: 'comment' | 'suggestion' | 'approval' | 'revision_request';
  status: 'active' | 'resolved' | 'hidden' | 'deleted';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Positional data for inline comments
  position?: {
    startOffset: number;
    endOffset: number;
    selectedText: string;
    elementId?: string;
  };

  // Threading
  parentId?: string;
  threadId: string;
  depth: number;

  // Collaboration features
  mentions: string[]; // User IDs mentioned in the comment
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;

  // Reactions and engagement
  reactions: Record<string, string[]>; // emoji -> user IDs
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;

  // Revision tracking
  revisionId?: string;
  changesSuggested?: {
    field: string;
    originalValue: string;
    suggestedValue: string;
    applied: boolean;
  }[];

  // Workflow integration
  workflowState?: 'pending_review' | 'approved' | 'rejected' | 'needs_changes';
  reviewerAssigned?: string;
  dueDate?: string;

  // Relationships
  authorId: string;
  
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
}

export interface CommentCreationAttributes extends Optional<CommentAttributes, 'id' | 'createdAt' | 'updatedAt' | 'threadId' | 'depth' | 'mentions' | 'attachments' | 'reactions' | 'isResolved'> {}

export class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
  public id!: string;
  public content!: string;
  public contentType!: 'article' | 'course' | 'template';
  public contentId!: string;
  public type!: 'comment' | 'suggestion' | 'approval' | 'revision_request';
  public status!: 'active' | 'resolved' | 'hidden' | 'deleted';
  public priority!: 'low' | 'medium' | 'high' | 'urgent';
  public position!: CommentAttributes['position'];
  public parentId!: string;
  public threadId!: string;
  public depth!: number;
  public mentions!: string[];
  public attachments!: CommentAttributes['attachments'];
  public reactions!: Record<string, string[]>;
  public isResolved!: boolean;
  public resolvedBy!: string;
  public resolvedAt!: string;
  public revisionId!: string;
  public changesSuggested!: CommentAttributes['changesSuggested'];
  public workflowState!: CommentAttributes['workflowState'];
  public reviewerAssigned!: string;
  public dueDate!: string;
  public authorId!: string;
  public readonly createdAt!: string;
  public readonly updatedAt!: string;
  public editedAt!: string;

  // Static methods for business logic
  static async getCommentThread(threadId: string): Promise<Comment[]> {
    return await Comment.findAll({
      where: {
        threadId,
        status: { [Op.ne as any]: 'deleted' },
      },
      order: [['createdAt', 'ASC']],
    });
  }

  static async getCommentsForContent(contentType: string, contentId: string, options: {
    includeResolved?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ comments: Comment[], total: number }> {
    const whereClause: any = {
      contentType,
      contentId,
      status: { [Op.ne as any]: 'deleted' },
      parentId: null, // Only get top-level comments, replies will be nested
    };

    if (!options.includeResolved) {
      whereClause.isResolved = false;
    }

    const { count, rows } = await Comment.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: options.limit || 50,
      offset: options.offset || 0,
    });

    // Load replies for each comment
    const commentsWithReplies = await Promise.all(
      rows.map(async (comment) => {
        const replies = await Comment.findAll({
          where: {
            threadId: comment.threadId,
            parentId: comment.id,
            status: { [Op.ne as any]: 'deleted' },
          },
          order: [['createdAt', 'ASC']],
        });
        return { ...comment.toJSON(), replies };
      })
    );

    return {
      comments: commentsWithReplies as unknown as Comment[],
      total: count,
    };
  }

  static async createThread(data: {
    contentType: 'article' | 'course' | 'template';
    contentId: string;
    authorId: string;
    content: string;
    type?: 'comment' | 'suggestion' | 'approval' | 'revision_request';
    position?: CommentAttributes['position'];
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<Comment> {
    const comment = await Comment.create({
      ...data,
      type: data.type || 'comment',
      status: 'active',
      priority: data.priority || 'medium',
      threadId: '', // Will be set to comment ID after creation
      depth: 0,
      mentions: Comment.extractMentions(data.content),
      attachments: [],
      reactions: {},
      isResolved: false,
    });

    // Update threadId to be the same as comment ID for top-level comments
    await comment.update({ threadId: comment.id });

    return comment;
  }

  static async replyToComment(parentId: string, data: {
    authorId: string;
    content: string;
    type?: 'comment' | 'suggestion' | 'approval' | 'revision_request';
  }): Promise<Comment> {
    const parentComment = await Comment.findByPk(parentId);
    if (!parentComment) {
      throw new Error('Parent comment not found');
    }

    return await Comment.create({
      content: data.content,
      contentType: parentComment.contentType,
      contentId: parentComment.contentId,
      type: data.type || 'comment',
      status: 'active',
      priority: parentComment.priority,
      parentId,
      threadId: parentComment.threadId,
      depth: parentComment.depth + 1,
      authorId: data.authorId,
      mentions: Comment.extractMentions(data.content),
      attachments: [],
      reactions: {},
      isResolved: false,
    });
  }

  static extractMentions(content: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    
    return [...new Set(mentions)]; // Remove duplicates
  }

  static async getUnresolvedComments(contentType: string, contentId: string): Promise<Comment[]> {
    return await Comment.findAll({
      where: {
        contentType,
        contentId,
        isResolved: false,
        status: 'active',
      },
      order: [['createdAt', 'DESC']],
    });
  }

  static async getPendingReviews(reviewerId: string): Promise<Comment[]> {
    return await Comment.findAll({
      where: {
        reviewerAssigned: reviewerId,
        workflowState: 'pending_review',
        status: 'active',
      },
      order: [['dueDate', 'ASC']],
    });
  }

  static async getCommentStats(contentType: string, contentId: string): Promise<{
    total: number;
    unresolved: number;
    suggestions: number;
    approvals: number;
    revisionRequests: number;
  }> {
    const [total, unresolved, suggestions, approvals, revisionRequests] = await Promise.all([
      Comment.count({
        where: { contentType, contentId, status: { [Op.ne as any]: 'deleted' } }
      }),
      Comment.count({
        where: { contentType, contentId, isResolved: false, status: 'active' }
      }),
      Comment.count({
        where: { contentType, contentId, type: 'suggestion', status: 'active' }
      }),
      Comment.count({
        where: { contentType, contentId, type: 'approval', status: 'active' }
      }),
      Comment.count({
        where: { contentType, contentId, type: 'revision_request', status: 'active' }
      }),
    ]);

    return { total, unresolved, suggestions, approvals, revisionRequests };
  }

  // Instance methods
  async addReaction(emoji: string, userId: string): Promise<void> {
    const reactions = { ...this.reactions };
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }
    
    if (!reactions[emoji].includes(userId)) {
      reactions[emoji].push(userId);
      await this.update({ reactions });
    }
  }

  async removeReaction(emoji: string, userId: string): Promise<void> {
    const reactions = { ...this.reactions };
    if (reactions[emoji]) {
      reactions[emoji] = reactions[emoji].filter(id => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
      await this.update({ reactions });
    }
  }

  async resolve(resolvedBy: string): Promise<void> {
    await this.update({
      isResolved: true,
      resolvedBy,
      resolvedAt: new Date().toISOString(),
      status: 'resolved',
    });

    // Resolve all replies in the thread
    await Comment.update(
      {
        isResolved: true,
        resolvedBy,
        resolvedAt: new Date().toISOString(),
      },
      {
        where: {
          threadId: this.threadId,
          isResolved: false,
        },
      }
    );
  }

  async assignReviewer(reviewerId: string, dueDate?: string): Promise<void> {
    await this.update({
      reviewerAssigned: reviewerId,
      workflowState: 'pending_review',
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days
    });
  }

  async approveChanges(approverId: string): Promise<void> {
    await this.update({
      workflowState: 'approved',
      resolvedBy: approverId,
      resolvedAt: new Date().toISOString(),
    });

    // Apply suggested changes if any
    if (this.changesSuggested) {
      for (const change of this.changesSuggested) {
        change.applied = true;
      }
      await this.update({ changesSuggested: this.changesSuggested });
    }
  }

  async rejectChanges(reviewerId: string, reason?: string): Promise<void> {
    await this.update({
      workflowState: 'rejected',
      resolvedBy: reviewerId,
      resolvedAt: new Date().toISOString(),
    });

    if (reason) {
      // Add a reply with the rejection reason
      await Comment.replyToComment(this.id, {
        authorId: reviewerId,
        content: `Rejected: ${reason}`,
        type: 'comment',
      });
    }
  }
}

Comment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 5000],
      },
    },
    contentType: {
      type: DataTypes.ENUM('article', 'course', 'template'),
      allowNull: false,
    },
    contentId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('comment', 'suggestion', 'approval', 'revision_request'),
      allowNull: false,
      defaultValue: 'comment',
    },
    status: {
      type: DataTypes.ENUM('active', 'resolved', 'hidden', 'deleted'),
      allowNull: false,
      defaultValue: 'active',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium',
    },
    position: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id',
      },
    },
    threadId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    depth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    mentions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    reactions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    isResolved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    resolvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revisionId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    changesSuggested: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    workflowState: {
      type: DataTypes.ENUM('pending_review', 'approved', 'rejected', 'needs_changes'),
      allowNull: true,
    },
    reviewerAssigned: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
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
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'comments',
    indexes: [
      {
        fields: ['contentType', 'contentId'],
      },
      {
        fields: ['threadId'],
      },
      {
        fields: ['parentId'],
      },
      {
        fields: ['authorId'],
      },
      {
        fields: ['isResolved', 'status'],
      },
      {
        fields: ['workflowState'],
      },
      {
        fields: ['reviewerAssigned'],
      },
      {
        fields: ['dueDate'],
      },
      {
        fields: ['mentions'],
        using: 'gin',
      },
    ],
  }
);

export default Comment; 