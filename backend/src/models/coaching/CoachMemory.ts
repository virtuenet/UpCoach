import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

/**
 * Coach Memory Model
 * Tracks coaching interactions, user insights, and conversation context
 * for personalized and intelligent coaching experiences
 */

export interface CoachMemoryAttributes {
  id: string;
  userId: string;
  avatarId: string;
  sessionId: string;
  
  // Memory Content
  memoryType: 'conversation' | 'insight' | 'goal' | 'pattern' | 'preference' | 'milestone';
  content: string;
  summary: string;
  tags: string[];
  
  // Context Information
  emotionalContext: {
    mood: string;
    sentiment: number; // -1 to 1
    emotionalTrends: string[];
  };
  
  // Coaching Context
  coachingContext: {
    topic: string;
    category: string;
    importance: number; // 1-10
    actionItems: string[];
    followUpNeeded: boolean;
  };
  
  // Temporal Information
  conversationDate: Date;
  lastReferencedDate?: Date;
  expiryDate?: Date;
  
  // Memory Strength & Relevance
  importance: number; // 1-10, how important this memory is
  relevanceScore: number; // 0-1, calculated relevance for current context
  accessCount: number; // How many times this memory has been referenced
  
  // Relationships
  relatedMemoryIds: string[];
  parentMemoryId?: string;
  childMemoryIds: string[];
  
  // AI Processing
  aiProcessed: boolean;
  insightsGenerated: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface CoachMemoryCreationAttributes 
  extends Optional<CoachMemoryAttributes, 'id' | 'lastReferencedDate' | 'expiryDate' | 'relevanceScore' | 'accessCount' | 'relatedMemoryIds' | 'parentMemoryId' | 'childMemoryIds' | 'aiProcessed' | 'insightsGenerated' | 'createdAt' | 'updatedAt'> {}

export class CoachMemory extends Model<CoachMemoryAttributes, CoachMemoryCreationAttributes> implements CoachMemoryAttributes {
  public id!: string;
  public userId!: string;
  public avatarId!: string;
  public sessionId!: string;
  
  public memoryType!: 'conversation' | 'insight' | 'goal' | 'pattern' | 'preference' | 'milestone';
  public content!: string;
  public summary!: string;
  public tags!: string[];
  
  public emotionalContext!: {
    mood: string;
    sentiment: number;
    emotionalTrends: string[];
  };
  
  public coachingContext!: {
    topic: string;
    category: string;
    importance: number;
    actionItems: string[];
    followUpNeeded: boolean;
  };
  
  public conversationDate!: Date;
  public lastReferencedDate?: Date;
  public expiryDate?: Date;
  
  public importance!: number;
  public relevanceScore!: number;
  public accessCount!: number;
  
  public relatedMemoryIds!: string[];
  public parentMemoryId?: string;
  public childMemoryIds!: string[];
  
  public aiProcessed!: boolean;
  public insightsGenerated!: string[];
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Check if this memory is still relevant based on time and access patterns
   */
  public isRelevant(): boolean {
    if (this.expiryDate && new Date() > this.expiryDate) {
      return false;
    }
    
    // High importance memories are always relevant
    if (this.importance >= 8) {
      return true;
    }
    
    // Recent memories are relevant
    const daysSinceConversation = Math.floor(
      (Date.now() - this.conversationDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
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
  public updateRelevanceScore(currentContext: {
    topics: string[];
    mood: string;
    recentGoals: string[];
  }): void {
    let score = 0;
    
    // Topic relevance
    const topicMatches = currentContext.topics.filter(topic => 
      this.tags.includes(topic) || 
      this.coachingContext.topic.toLowerCase().includes(topic.toLowerCase())
    );
    score += (topicMatches.length / Math.max(currentContext.topics.length, 1)) * 0.4;
    
    // Emotional context relevance
    if (this.emotionalContext.mood === currentContext.mood) {
      score += 0.2;
    }
    
    // Goal relevance
    const goalMatches = currentContext.recentGoals.filter(goal =>
      this.coachingContext.actionItems.some(action => 
        action.toLowerCase().includes(goal.toLowerCase())
      )
    );
    score += (goalMatches.length / Math.max(currentContext.recentGoals.length, 1)) * 0.3;
    
    // Recency boost
    const daysSince = Math.floor(
      (Date.now() - this.conversationDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    score += Math.max(0, (30 - daysSince) / 30) * 0.1;
    
    this.relevanceScore = Math.min(1, score);
  }

  /**
   * Increment access count and update last referenced date
   */
  public recordAccess(): void {
    this.accessCount += 1;
    this.lastReferencedDate = new Date();
  }
}

CoachMemory.init(
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
    avatarId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'avatars',
        key: 'id',
      },
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Coaching session identifier',
    },
    memoryType: {
      type: DataTypes.ENUM('conversation', 'insight', 'goal', 'pattern', 'preference', 'milestone'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Full content of the memory/conversation',
    },
    summary: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Concise summary of the memory',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Keywords and tags for categorization',
    },
    emotionalContext: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        mood: 'neutral',
        sentiment: 0,
        emotionalTrends: [],
      },
    },
    coachingContext: {
      type: DataTypes.JSONB,
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
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    lastReferencedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When this memory should be considered expired',
    },
    importance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      validate: {
        min: 1,
        max: 10,
      },
    },
    relevanceScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.5,
      validate: {
        min: 0,
        max: 1,
      },
    },
    accessCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    relatedMemoryIds: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
    },
    parentMemoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'coach_memories',
        key: 'id',
      },
    },
    childMemoryIds: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
    },
    aiProcessed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    insightsGenerated: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
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
  }
);

export default CoachMemory; 