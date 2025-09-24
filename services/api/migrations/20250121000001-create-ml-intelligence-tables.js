'use strict';

/**
 * Migration: Create ML Intelligence Tables
 * Creates comprehensive database schema for ML features and coach intelligence
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ==================== Core ML Tables ====================

    // User NPS Scores
    await queryInterface.createTable('user_nps_scores', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      score: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: false,
        validate: {
          min: 0,
          max: 10,
        },
      },
      category: {
        type: Sequelize.ENUM('promoter', 'passive', 'detractor'),
        allowNull: false,
      },
      confidence: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.5,
      },
      factors: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Contributing factors to NPS score',
      },
      trend: {
        type: Sequelize.ENUM('improving', 'stable', 'declining'),
        allowNull: true,
      },
      calculated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for NPS scores
    await queryInterface.addIndex('user_nps_scores', ['user_id', 'calculated_at']);
    await queryInterface.addIndex('user_nps_scores', ['category']);

    // User Skill Assessments
    await queryInterface.createTable('user_skill_assessments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      skill_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      skill_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      skill_category: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      current_level: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: 0,
          max: 100,
        },
      },
      previous_level: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      improvement_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Percentage improvement rate',
      },
      learning_velocity: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Speed of skill acquisition',
      },
      confidence_level: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 10,
        },
      },
      projected_mastery_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      assessment_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      context: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional context for assessment',
      },
      recommendations: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for skill assessments
    await queryInterface.addIndex('user_skill_assessments', ['user_id', 'skill_id', 'assessment_date']);
    await queryInterface.addIndex('user_skill_assessments', ['skill_category']);
    await queryInterface.addIndex('user_skill_assessments', ['current_level']);

    // Goal Success Predictions
    await queryInterface.createTable('goal_success_predictions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      goal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'goals',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      probability: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        validate: {
          min: 0,
          max: 1,
        },
      },
      risk_level: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
      },
      estimated_completion_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      confidence_lower: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        comment: 'Lower bound of confidence interval',
      },
      confidence_upper: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        comment: 'Upper bound of confidence interval',
      },
      risk_factors: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      success_factors: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      recommended_actions: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      prediction_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      model_version: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for goal predictions
    await queryInterface.addIndex('goal_success_predictions', ['goal_id', 'prediction_date']);
    await queryInterface.addIndex('goal_success_predictions', ['user_id', 'risk_level']);
    await queryInterface.addIndex('goal_success_predictions', ['probability']);

    // User Behavioral Patterns
    await queryInterface.createTable('user_behavioral_patterns', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      pattern_type: {
        type: Sequelize.ENUM('positive', 'negative', 'neutral'),
        allowNull: false,
      },
      pattern_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      frequency: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'How often this pattern occurs',
      },
      impact_score: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        comment: 'Impact on overall performance (0-1)',
      },
      triggers: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Identified triggers for this pattern',
      },
      time_tendency: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Time-based tendencies (time of day, day of week)',
      },
      recommendations: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      detected_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      valid_until: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for behavioral patterns
    await queryInterface.addIndex('user_behavioral_patterns', ['user_id', 'pattern_type']);
    await queryInterface.addIndex('user_behavioral_patterns', ['detected_at']);

    // Personalized Insights
    await queryInterface.createTable('personalized_insights', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      insight_type: {
        type: Sequelize.ENUM('behavioral', 'goal', 'skill', 'engagement', 'health', 'motivation'),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      importance: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        validate: {
          min: 0,
          max: 1,
        },
      },
      urgency: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        validate: {
          min: 0,
          max: 1,
        },
      },
      is_actionable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      recommendations: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      supporting_data: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_actioned: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      generated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      valid_until: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for insights
    await queryInterface.addIndex('personalized_insights', ['user_id', 'insight_type']);
    await queryInterface.addIndex('personalized_insights', ['importance', 'urgency']);
    await queryInterface.addIndex('personalized_insights', ['generated_at']);
    await queryInterface.addIndex('personalized_insights', ['is_read', 'is_actioned']);

    // Coaching Recommendations
    await queryInterface.createTable('coaching_recommendations', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      recommendation_type: {
        type: Sequelize.ENUM('approach', 'technique', 'content', 'schedule', 'goal_adjustment'),
        allowNull: false,
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 10,
        },
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      rationale: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      expected_outcome: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      implementation_steps: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      timeline: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      resources: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      success_criteria: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      alternative_options: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      contraindications: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      is_accepted: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      acceptance_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      feedback: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      generated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for recommendations
    await queryInterface.addIndex('coaching_recommendations', ['user_id', 'recommendation_type']);
    await queryInterface.addIndex('coaching_recommendations', ['priority']);
    await queryInterface.addIndex('coaching_recommendations', ['is_accepted']);

    // User Percentiles
    await queryInterface.createTable('user_percentiles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      metric_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      metric_value: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
      },
      percentile: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: 0,
          max: 100,
        },
      },
      cohort: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Comparison cohort',
      },
      ranking: {
        type: Sequelize.ENUM('top', 'above_average', 'average', 'below_average', 'bottom'),
        allowNull: false,
      },
      benchmarks: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'p25, p50, p75, p90 benchmarks',
      },
      improvement_potential: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      calculated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for percentiles
    await queryInterface.addIndex('user_percentiles', ['user_id', 'metric_name']);
    await queryInterface.addIndex('user_percentiles', ['percentile']);
    await queryInterface.addIndex('user_percentiles', ['ranking']);

    // Behavioral Anomalies
    await queryInterface.createTable('behavioral_anomalies', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      anomaly_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      severity: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      detected_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      metrics: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Metrics that triggered the anomaly',
      },
      possible_causes: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      recommended_actions: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      requires_intervention: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_resolved: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      resolution_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for anomalies
    await queryInterface.addIndex('behavioral_anomalies', ['user_id', 'severity']);
    await queryInterface.addIndex('behavioral_anomalies', ['detected_at']);
    await queryInterface.addIndex('behavioral_anomalies', ['is_resolved']);

    // ==================== ML Model Management Tables ====================

    // ML Models Registry
    await queryInterface.createTable('ml_models', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      model_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      model_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      version: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('training', 'testing', 'active', 'deprecated', 'failed'),
        allowNull: false,
        defaultValue: 'training',
      },
      accuracy: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: true,
      },
      training_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deployment_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      config: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Model configuration and hyperparameters',
      },
      metrics: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Performance metrics',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Model Drift Monitoring
    await queryInterface.createTable('model_drift_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      model_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ml_models',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      drift_score: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: false,
      },
      drift_detected: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      baseline_distribution: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      current_distribution: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      checked_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      action_taken: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // ==================== Privacy and Compliance Tables ====================

    // ML Consent Tracking
    await queryInterface.createTable('ml_user_consent', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      ml_features_consent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      data_analysis_consent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      personalization_consent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      third_party_sharing_consent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      consent_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      consent_version: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: '1.0.0',
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Feature Store for Caching
    await queryInterface.createTable('ml_feature_store', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      feature_set: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      features: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      feature_names: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      generated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for feature store
    await queryInterface.addIndex('ml_feature_store', ['user_id', 'feature_set']);
    await queryInterface.addIndex('ml_feature_store', ['expires_at']);

    console.log('ML Intelligence tables created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order to handle foreign key constraints
    await queryInterface.dropTable('ml_feature_store');
    await queryInterface.dropTable('ml_user_consent');
    await queryInterface.dropTable('model_drift_logs');
    await queryInterface.dropTable('ml_models');
    await queryInterface.dropTable('behavioral_anomalies');
    await queryInterface.dropTable('user_percentiles');
    await queryInterface.dropTable('coaching_recommendations');
    await queryInterface.dropTable('personalized_insights');
    await queryInterface.dropTable('user_behavioral_patterns');
    await queryInterface.dropTable('goal_success_predictions');
    await queryInterface.dropTable('user_skill_assessments');
    await queryInterface.dropTable('user_nps_scores');

    console.log('ML Intelligence tables dropped successfully');
  }
};