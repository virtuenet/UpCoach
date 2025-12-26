import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Phase 8: AI-Powered Coaching Assistant & Personalization Engine
 * Database Migration
 *
 * Creates tables for:
 * - user_profiles (personalization embeddings)
 * - recommendations (goal/habit recommendations)
 * - interventions (smart intervention system)
 * - conversations (AI coaching chat)
 * - mood_entries (sentiment tracking)
 * - milestones (automated goal breakdown)
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  /**
   * User Profiles Table
   * Stores user embeddings and personalization data
   */
  await queryInterface.createTable('user_profiles', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      unique: true,
    },
    embedding: {
      type: DataTypes.JSONB, // 128-dimensional User2Vec embedding
      allowNull: false,
      comment: '128-dimensional user embedding vector',
    },
    personality_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'MBTI, Big Five, or other personality classification',
    },
    coaching_tone_preference: {
      type: DataTypes.ENUM('supportive', 'challenging', 'analytical'),
      allowNull: false,
      defaultValue: 'supportive',
    },
    optimal_checkin_times: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      defaultValue: [7, 8, 9, 19, 20],
      comment: 'Hours of day when user is most active',
    },
    engagement_score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 50.0,
      comment: 'Engagement score 0-100',
    },
    churn_risk_score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.5,
      comment: 'Churn probability 0-1',
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex('user_profiles', ['user_id']);
  await queryInterface.addIndex('user_profiles', ['churn_risk_score']);
  await queryInterface.addIndex('user_profiles', ['engagement_score']);

  /**
   * Recommendations Table
   * Stores personalized goal/habit/content recommendations
   */
  await queryInterface.createTable('recommendations', {
    id: {
      type: DataTypes.STRING(100),
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    item_type: {
      type: DataTypes.ENUM('goal', 'habit', 'content', 'resource'),
      allowNull: false,
    },
    item_id: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Reference to recommended item (category, name, etc)',
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'Recommendation confidence score 0-1',
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Human-readable recommendation reason',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional context about recommendation',
    },
    clicked: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    dismissed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex('recommendations', ['user_id']);
  await queryInterface.addIndex('recommendations', ['item_type']);
  await queryInterface.addIndex('recommendations', ['created_at']);
  await queryInterface.addIndex('recommendations', ['clicked', 'dismissed']);

  /**
   * Interventions Table
   * Stores smart intervention triggers and deliveries
   */
  await queryInterface.createTable('interventions', {
    id: {
      type: DataTypes.STRING(100),
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    trigger_event: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Event that triggered intervention (e.g., missed_checkins_3x)',
    },
    intervention_type: {
      type: DataTypes.ENUM('push_notification', 'email', 'in_app', 'sms'),
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Personalized intervention message',
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    response_action: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'User response: clicked, dismissed, completed',
    },
    effective: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      comment: 'Did intervention achieve desired outcome',
    },
    ab_test_variant: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'A/B test variant identifier',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Rule ID, CTA, and other context',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex('interventions', ['user_id']);
  await queryInterface.addIndex('interventions', ['trigger_event']);
  await queryInterface.addIndex('interventions', ['intervention_type']);
  await queryInterface.addIndex('interventions', ['created_at']);
  await queryInterface.addIndex('interventions', ['effective']);

  /**
   * Conversations Table
   * Stores AI coaching chat conversations
   */
  await queryInterface.createTable('conversations', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    messages: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of chat messages with role, content, timestamp',
    },
    context: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Conversation context (goals, mood, energy, tone)',
    },
    intent: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Last detected user intent',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex('conversations', ['user_id']);
  await queryInterface.addIndex('conversations', ['created_at']);
  await queryInterface.addIndex('conversations', ['updated_at']);

  /**
   * Mood Entries Table
   * Stores sentiment analysis and emotion tracking
   */
  await queryInterface.createTable('mood_entries', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    mood: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'User-selected mood (happy, sad, anxious, etc)',
    },
    sentiment_score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'Sentiment score -1 (negative) to 1 (positive)',
    },
    emotions: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Emotion scores: joy, sadness, anger, fear, surprise, disgust, neutral',
    },
    journal_entry: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional journal entry text',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex('mood_entries', ['user_id']);
  await queryInterface.addIndex('mood_entries', ['created_at']);
  await queryInterface.addIndex('mood_entries', ['sentiment_score']);
  await queryInterface.addIndex('mood_entries', ['mood']);

  /**
   * Milestones Table (if not exists)
   * Stores auto-generated goal milestones
   */
  const tables = await queryInterface.showAllTables();

  if (!tables.includes('milestones')) {
    await queryInterface.createTable('milestones', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      goal_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'goals',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Display order (1, 2, 3...)',
      },
      estimated_duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Estimated days to complete',
      },
      target_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metrics: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Measurable metrics for milestone',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.addIndex('milestones', ['goal_id']);
    await queryInterface.addIndex('milestones', ['order']);
    await queryInterface.addIndex('milestones', ['completed_at']);
  }

  console.log('Phase 8 AI tables created successfully');
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('milestones');
  await queryInterface.dropTable('mood_entries');
  await queryInterface.dropTable('conversations');
  await queryInterface.dropTable('interventions');
  await queryInterface.dropTable('recommendations');
  await queryInterface.dropTable('user_profiles');

  console.log('Phase 8 AI tables dropped successfully');
}
