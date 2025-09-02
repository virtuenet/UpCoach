"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
class Comment extends sequelize_1.Model {
    id;
    content;
    contentType;
    contentId;
    type;
    status;
    priority;
    position;
    parentId;
    threadId;
    depth;
    mentions;
    attachments;
    reactions;
    isResolved;
    resolvedBy;
    resolvedAt;
    revisionId;
    changesSuggested;
    workflowState;
    reviewerAssigned;
    dueDate;
    authorId;
    createdAt;
    updatedAt;
    editedAt;
    // Static methods for business logic
    static async getCommentThread(threadId) {
        return await Comment.findAll({
            where: {
                threadId,
                status: { [sequelize_1.Op.ne]: 'deleted' },
            },
            order: [['createdAt', 'ASC']],
        });
    }
    static async getCommentsForContent(contentType, contentId, options = {}) {
        const whereClause = {
            contentType,
            contentId,
            status: { [sequelize_1.Op.ne]: 'deleted' },
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
        const commentsWithReplies = await Promise.all(rows.map(async (comment) => {
            const replies = await Comment.findAll({
                where: {
                    threadId: comment.threadId,
                    parentId: comment.id,
                    status: { [sequelize_1.Op.ne]: 'deleted' },
                },
                order: [['createdAt', 'ASC']],
            });
            return { ...comment.toJSON(), replies };
        }));
        return {
            comments: commentsWithReplies,
            total: count,
        };
    }
    static async createThread(data) {
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
    static async replyToComment(parentId, data) {
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
    static extractMentions(content) {
        const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
        const mentions = [];
        let match;
        while ((match = mentionRegex.exec(content)) !== null) {
            mentions.push(match[1]);
        }
        return [...new Set(mentions)]; // Remove duplicates
    }
    static async getUnresolvedComments(contentType, contentId) {
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
    static async getPendingReviews(reviewerId) {
        return await Comment.findAll({
            where: {
                reviewerAssigned: reviewerId,
                workflowState: 'pending_review',
                status: 'active',
            },
            order: [['dueDate', 'ASC']],
        });
    }
    static async getCommentStats(contentType, contentId) {
        const [total, unresolved, suggestions, approvals, revisionRequests] = await Promise.all([
            Comment.count({
                where: { contentType, contentId, status: { [sequelize_1.Op.ne]: 'deleted' } },
            }),
            Comment.count({
                where: { contentType, contentId, isResolved: false, status: 'active' },
            }),
            Comment.count({
                where: { contentType, contentId, type: 'suggestion', status: 'active' },
            }),
            Comment.count({
                where: { contentType, contentId, type: 'approval', status: 'active' },
            }),
            Comment.count({
                where: { contentType, contentId, type: 'revision_request', status: 'active' },
            }),
        ]);
        return { total, unresolved, suggestions, approvals, revisionRequests };
    }
    // Instance methods
    async addReaction(emoji, userId) {
        const reactions = { ...this.reactions };
        if (!reactions[emoji]) {
            reactions[emoji] = [];
        }
        if (!reactions[emoji].includes(userId)) {
            reactions[emoji].push(userId);
            await this.update({ reactions });
        }
    }
    async removeReaction(emoji, userId) {
        const reactions = { ...this.reactions };
        if (reactions[emoji]) {
            reactions[emoji] = reactions[emoji].filter(id => id !== userId);
            if (reactions[emoji].length === 0) {
                delete reactions[emoji];
            }
            await this.update({ reactions });
        }
    }
    async resolve(resolvedBy) {
        await this.update({
            isResolved: true,
            resolvedBy,
            resolvedAt: new Date().toISOString(),
            status: 'resolved',
        });
        // Resolve all replies in the thread
        await Comment.update({
            isResolved: true,
            resolvedBy,
            resolvedAt: new Date().toISOString(),
        }, {
            where: {
                threadId: this.threadId,
                isResolved: false,
            },
        });
    }
    async assignReviewer(reviewerId, dueDate) {
        await this.update({
            reviewerAssigned: reviewerId,
            workflowState: 'pending_review',
            dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days
        });
    }
    async approveChanges(approverId) {
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
    async rejectChanges(reviewerId, reason) {
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
exports.Comment = Comment;
Comment.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [1, 5000],
        },
    },
    contentType: {
        type: sequelize_1.DataTypes.ENUM('article', 'course', 'template'),
        allowNull: false,
    },
    contentId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('comment', 'suggestion', 'approval', 'revision_request'),
        allowNull: false,
        defaultValue: 'comment',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('active', 'resolved', 'hidden', 'deleted'),
        allowNull: false,
        defaultValue: 'active',
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
    },
    position: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    parentId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'comments',
            key: 'id',
        },
    },
    threadId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    depth: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    mentions: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
    },
    attachments: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    reactions: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
    isResolved: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    resolvedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    resolvedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    revisionId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    changesSuggested: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    workflowState: {
        type: sequelize_1.DataTypes.ENUM('pending_review', 'approved', 'rejected', 'needs_changes'),
        allowNull: true,
    },
    reviewerAssigned: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
    },
    dueDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    authorId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    editedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: sequelize_2.sequelize,
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
});
exports.default = Comment;
//# sourceMappingURL=Comment.js.map