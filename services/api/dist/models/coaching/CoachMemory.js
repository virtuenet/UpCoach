"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachMemory = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
class CoachMemory extends sequelize_1.Model {
    id;
    userId;
    avatarId;
    sessionId;
    memoryType;
    content;
    summary;
    tags;
    emotionalContext;
    coachingContext;
    conversationDate;
    lastReferencedDate;
    expiryDate;
    importance;
    relevanceScore;
    accessCount;
    relatedMemoryIds;
    parentMemoryId;
    childMemoryIds;
    aiProcessed;
    insightsGenerated;
    /**
     * Check if this memory is still relevant based on time and access patterns
     */
    isRelevant() {
        if (this.expiryDate && new Date() > this.expiryDate) {
            return false;
        }
        // High importance memories are always relevant
        if (this.importance >= 8) {
            return true;
        }
        // Recent memories are relevant
        const daysSinceConversation = Math.floor((Date.now() - this.conversationDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceConversation <= 7) {
            return true;
        }
        // Frequently accessed memories are relevant
        if (this.accessCount >= 5) {
            return true;
        }
        // Check relevance score
        return this.relevanceScore >= 0.6;
    }
    /**
     * Update relevance score based on current context
     */
    updateRelevanceScore(currentContext) {
        let score = 0;
        // Topic relevance
        const topicMatches = currentContext.topics.filter(topic => this.tags.includes(topic) ||
            this.coachingContext.topic.toLowerCase().includes(topic.toLowerCase()));
        score += (topicMatches.length / Math.max(currentContext.topics.length, 1)) * 0.4;
        // Emotional context relevance
        if (this.emotionalContext.mood === currentContext.mood) {
            score += 0.2;
        }
        // Goal relevance
        const goalMatches = currentContext.recentGoals.filter(goal => this.coachingContext.actionItems.some(action => action.toLowerCase().includes(goal.toLowerCase())));
        score += (goalMatches.length / Math.max(currentContext.recentGoals.length, 1)) * 0.3;
        // Recency boost
        const daysSince = Math.floor((Date.now() - this.conversationDate.getTime()) / (1000 * 60 * 60 * 24));
        score += Math.max(0, (30 - daysSince) / 30) * 0.1;
        this.relevanceScore = Math.min(1, score);
    }
    /**
     * Increment access count and update last referenced date
     */
    recordAccess() {
        this.accessCount += 1;
        this.lastReferencedDate = new Date();
    }
}
exports.CoachMemory = CoachMemory;
CoachMemory.init({
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
    avatarId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'avatars',
            key: 'id',
        },
    },
    sessionId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        comment: 'Coaching session identifier',
    },
    memoryType: {
        type: sequelize_1.DataTypes.ENUM('conversation', 'insight', 'goal', 'pattern', 'preference', 'milestone'),
        allowNull: false,
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        comment: 'Full content of the memory/conversation',
    },
    summary: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
        comment: 'Concise summary of the memory',
    },
    tags: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        defaultValue: [],
        comment: 'Keywords and tags for categorization',
    },
    emotionalContext: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            mood: 'neutral',
            sentiment: 0,
            emotionalTrends: [],
        },
    },
    coachingContext: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            topic: '',
            category: 'general',
            importance: 5,
            actionItems: [],
            followUpNeeded: false,
        },
    },
    conversationDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    lastReferencedDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    expiryDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        comment: 'When this memory should be considered expired',
    },
    importance: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: {
            min: 1,
            max: 10,
        },
    },
    relevanceScore: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.5,
        validate: {
            min: 0,
            max: 1,
        },
    },
    accessCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    relatedMemoryIds: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.UUID),
        defaultValue: [],
    },
    parentMemoryId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'coach_memories',
            key: 'id',
        },
    },
    childMemoryIds: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.UUID),
        defaultValue: [],
    },
    aiProcessed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    insightsGenerated: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        defaultValue: [],
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
}, {
    sequelize: sequelize_2.sequelize,
    tableName: 'coach_memories',
    modelName: 'CoachMemory',
    timestamps: true,
    indexes: [
        {
            fields: ['userId'],
            name: 'idx_coach_memories_user_id',
        },
        {
            fields: ['avatarId'],
            name: 'idx_coach_memories_avatar_id',
        },
        {
            fields: ['sessionId'],
            name: 'idx_coach_memories_session_id',
        },
        {
            fields: ['memoryType'],
            name: 'idx_coach_memories_type',
        },
        {
            fields: ['conversationDate'],
            name: 'idx_coach_memories_date',
        },
        {
            fields: ['importance'],
            name: 'idx_coach_memories_importance',
        },
        {
            fields: ['relevanceScore'],
            name: 'idx_coach_memories_relevance',
        },
        {
            fields: ['tags'],
            using: 'GIN',
            name: 'idx_coach_memories_tags',
        },
        {
            fields: ['userId', 'conversationDate'],
            name: 'idx_coach_memories_user_date',
        },
    ],
});
exports.default = CoachMemory;
//# sourceMappingURL=CoachMemory.js.map