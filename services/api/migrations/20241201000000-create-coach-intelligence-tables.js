'use strict';

/**
 * Migration: Create Coach Intelligence Tables
 * Creates tables for coach memories, user analytics, and KPI/OKR tracking
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create coach_memories table
    await queryInterface.createTable('coach_memories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      avatarId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'avatars',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      sessionId: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Coaching session identifier',
      },
      memoryType: {
        type: Sequelize.ENUM(
          'conversation',
          'insight',
          'goal',
          'pattern',
          'preference',
          'milestone'
        ),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Full content of the memory/conversation',
      },
      summary: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'Concise summary of the memory',
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        comment: 'Keywords and tags for categorization',
      },
      emotionalContext: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          mood: 'neutral',
          sentiment: 0,
          emotionalTrends: [],
        },
      },
      coachingContext: {
        type: Sequelize.JSONB,
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
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      lastReferencedDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      expiryDate: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this memory should be considered expired',
      },
      importance: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: {
          min: 1,
          max: 10,
        },
      },
      relevanceScore: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0.5,
        validate: {
          min: 0,
          max: 1,
        },
      },
      accessCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      relatedMemoryIds: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: [],
      },
      parentMemoryId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'coach_memories',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      childMemoryIds: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: [],
      },
      aiProcessed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      insightsGenerated: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create user_analytics table
    await queryInterface.createTable('user_analytics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      periodType: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly', 'quarterly'),
        allowNull: false,
      },
      periodStart: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      periodEnd: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      engagementMetrics: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          totalSessions: 0,
          totalDuration: 0,
          averageSessionDuration: 0,
          streakCount: 0,
          missedSessions: 0,
          responsiveness: 0.5,
          participationScore: 0.5,
          followThroughRate: 0.5,
        },
      },
      coachingMetrics: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          goalsSet: 0,
          goalsAchieved: 0,
          goalCompletionRate: 0,
          avatarId: '',
          avatarEffectivenessScore: 0.5,
          avatarSwitchCount: 0,
          progressMetrics: {
            skillImprovement: 0.5,
            confidenceIncrease: 0.5,
            stressReduction: 0.5,
            habitFormation: 0.5,
          },
        },
      },
      behavioralData: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          preferredSessionTime: 'morning',
          preferredDuration: 30,
          communicationStyle: 'supportive',
          topicsOfInterest: [],
          challengeAreas: [],
          moodTrends: [],
          learningPreferences: {
            visualLearner: 0.33,
            auditoryLearner: 0.33,
            kinestheticLearner: 0.33,
          },
        },
      },
      kpiMetrics: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          userSatisfactionScore: 7,
          npsScore: 0,
          retentionProbability: 0.7,
          churnRisk: 0.2,
          customKpis: [],
        },
      },
      benchmarkData: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          userPercentile: 50,
          industryBenchmark: 0.5,
          personalBest: 0.5,
        },
      },
      aiInsights: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          strengthAreas: [],
          improvementAreas: [],
          recommendedActions: [],
          predictedOutcomes: [],
          riskFactors: [],
        },
      },
      calculatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      nextCalculationDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: () => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow;
        },
      },
      dataQualityScore: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0.8,
        validate: {
          min: 0,
          max: 1,
        },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create kpi_trackers table
    await queryInterface.createTable('kpi_trackers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      organizationId: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'For enterprise users',
      },
      type: {
        type: Sequelize.ENUM('kpi', 'okr', 'personal_goal', 'team_goal'),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM(
          'financial',
          'professional',
          'personal',
          'health',
          'relationships',
          'skills',
          'custom'
        ),
        allowNull: false,
      },
      objective: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'For OKR type goals',
      },
      keyResults: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      kpiData: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'For KPI type goals',
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      reviewFrequency: {
        type: Sequelize.ENUM('weekly', 'biweekly', 'monthly', 'quarterly'),
        allowNull: false,
        defaultValue: 'weekly',
      },
      lastReviewDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      nextReviewDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      overallProgress: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
      },
      status: {
        type: Sequelize.ENUM(
          'not_started',
          'in_progress',
          'at_risk',
          'completed',
          'failed',
          'paused'
        ),
        allowNull: false,
        defaultValue: 'not_started',
      },
      milestones: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      performanceHistory: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      coachingData: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          coachingFrequency: 'weekly',
          coachingNotes: [],
          actionItems: [],
        },
      },
      analytics: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          averageProgress: 0,
          velocityScore: 0.5,
          consistencyScore: 0.5,
          riskFactors: [],
          successFactors: [],
          recommendations: [],
        },
      },
      collaborators: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium',
      },
      confidentiality: {
        type: Sequelize.ENUM('public', 'team', 'private'),
        allowNull: false,
        defaultValue: 'private',
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create indexes for performance optimization

    // Coach Memories indexes
    await queryInterface.addIndex('coach_memories', ['userId'], {
      name: 'idx_coach_memories_user_id',
    });
    await queryInterface.addIndex('coach_memories', ['avatarId'], {
      name: 'idx_coach_memories_avatar_id',
    });
    await queryInterface.addIndex('coach_memories', ['sessionId'], {
      name: 'idx_coach_memories_session_id',
    });
    await queryInterface.addIndex('coach_memories', ['memoryType'], {
      name: 'idx_coach_memories_type',
    });
    await queryInterface.addIndex('coach_memories', ['conversationDate'], {
      name: 'idx_coach_memories_date',
    });
    await queryInterface.addIndex('coach_memories', ['importance'], {
      name: 'idx_coach_memories_importance',
    });
    await queryInterface.addIndex('coach_memories', ['relevanceScore'], {
      name: 'idx_coach_memories_relevance',
    });
    await queryInterface.addIndex('coach_memories', ['tags'], {
      using: 'GIN',
      name: 'idx_coach_memories_tags',
    });
    await queryInterface.addIndex('coach_memories', ['userId', 'conversationDate'], {
      name: 'idx_coach_memories_user_date',
    });

    // User Analytics indexes
    await queryInterface.addIndex('user_analytics', ['userId'], {
      name: 'idx_user_analytics_user_id',
    });
    await queryInterface.addIndex('user_analytics', ['periodType'], {
      name: 'idx_user_analytics_period_type',
    });
    await queryInterface.addIndex('user_analytics', ['periodStart', 'periodEnd'], {
      name: 'idx_user_analytics_period',
    });
    await queryInterface.addIndex('user_analytics', ['calculatedAt'], {
      name: 'idx_user_analytics_calculated_at',
    });
    await queryInterface.addIndex('user_analytics', ['nextCalculationDate'], {
      name: 'idx_user_analytics_next_calculation',
    });
    await queryInterface.addIndex('user_analytics', ['userId', 'periodType', 'periodStart'], {
      name: 'idx_user_analytics_user_period',
      unique: true,
    });

    // KPI Trackers indexes
    await queryInterface.addIndex('kpi_trackers', ['userId'], {
      name: 'idx_kpi_trackers_user_id',
    });
    await queryInterface.addIndex('kpi_trackers', ['type'], {
      name: 'idx_kpi_trackers_type',
    });
    await queryInterface.addIndex('kpi_trackers', ['category'], {
      name: 'idx_kpi_trackers_category',
    });
    await queryInterface.addIndex('kpi_trackers', ['status'], {
      name: 'idx_kpi_trackers_status',
    });
    await queryInterface.addIndex('kpi_trackers', ['priority'], {
      name: 'idx_kpi_trackers_priority',
    });
    await queryInterface.addIndex('kpi_trackers', ['endDate'], {
      name: 'idx_kpi_trackers_end_date',
    });
    await queryInterface.addIndex('kpi_trackers', ['nextReviewDate'], {
      name: 'idx_kpi_trackers_next_review',
    });
    await queryInterface.addIndex('kpi_trackers', ['userId', 'status'], {
      name: 'idx_kpi_trackers_user_status',
    });
    await queryInterface.addIndex('kpi_trackers', ['tags'], {
      using: 'GIN',
      name: 'idx_kpi_trackers_tags',
    });

    console.log('✅ Coach Intelligence tables created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order to handle foreign key constraints
    await queryInterface.dropTable('kpi_trackers');
    await queryInterface.dropTable('user_analytics');
    await queryInterface.dropTable('coach_memories');

    console.log('❌ Coach Intelligence tables dropped');
  },
};
