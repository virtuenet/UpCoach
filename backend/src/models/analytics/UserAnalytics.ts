import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

/**
 * User Analytics Model
 * Tracks user progress, coaching effectiveness, and behavioral patterns
 * for data-driven coaching insights and reporting
 */

export interface UserAnalyticsAttributes {
  id: string;
  userId: string;
  
  // Time Period
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  periodStart: Date;
  periodEnd: Date;
  
  // Engagement Metrics
  engagementMetrics: {
    totalSessions: number;
    totalDuration: number; // in minutes
    averageSessionDuration: number;
    streakCount: number;
    missedSessions: number;
    
    // Interaction Quality
    responsiveness: number; // 0-1 score
    participationScore: number; // 0-1 score
    followThroughRate: number; // 0-1 completion rate of action items
  };
  
  // Coaching Effectiveness
  coachingMetrics: {
    goalsSet: number;
    goalsAchieved: number;
    goalCompletionRate: number;
    
    // Avatar Performance
    avatarId: string;
    avatarEffectivenessScore: number; // 0-1 score
    avatarSwitchCount: number;
    
    // Progress Tracking
    progressMetrics: {
      skillImprovement: number; // 0-1 score
      confidenceIncrease: number; // 0-1 score
      stressReduction: number; // 0-1 score
      habitFormation: number; // 0-1 score
    };
  };
  
  // Behavioral Patterns
  behavioralData: {
    preferredSessionTime: string; // "morning", "afternoon", "evening"
    preferredDuration: number; // preferred session length in minutes
    communicationStyle: string; // "formal", "casual", "direct", "supportive"
    topicsOfInterest: string[];
    challengeAreas: string[];
    
    // Emotional Patterns
    moodTrends: {
      date: string;
      mood: string;
      sentiment: number;
    }[];
    
    // Learning Patterns
    learningPreferences: {
      visualLearner: number; // 0-1 score
      auditoryLearner: number; // 0-1 score
      kinestheticLearner: number; // 0-1 score
    };
  };
  
  // KPI Tracking
  kpiMetrics: {
    userSatisfactionScore: number; // 1-10
    npsScore: number; // -100 to 100
    retentionProbability: number; // 0-1
    churnRisk: number; // 0-1
    
    // Custom KPIs
    customKpis: {
      name: string;
      value: number;
      target: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }[];
  };
  
  // Comparative Data
  benchmarkData: {
    userPercentile: number; // Where user ranks compared to others
    cohortId?: string; // Comparison group
    industryBenchmark: number;
    personalBest: number;
  };
  
  // Insights & Recommendations
  aiInsights: {
    strengthAreas: string[];
    improvementAreas: string[];
    recommendedActions: string[];
    predictedOutcomes: string[];
    riskFactors: string[];
  };
  
  // Metadata
  calculatedAt: Date;
  nextCalculationDate: Date;
  dataQualityScore: number; // 0-1, how reliable this data is
  
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAnalyticsCreationAttributes 
  extends Optional<UserAnalyticsAttributes, 'id' | 'nextCalculationDate' | 'dataQualityScore' | 'createdAt' | 'updatedAt'> {}

export class UserAnalytics extends Model<UserAnalyticsAttributes, UserAnalyticsCreationAttributes> implements UserAnalyticsAttributes {
  public id!: string;
  public userId!: string;
  
  public periodType!: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  public periodStart!: Date;
  public periodEnd!: Date;
  
  public engagementMetrics!: {
    totalSessions: number;
    totalDuration: number;
    averageSessionDuration: number;
    streakCount: number;
    missedSessions: number;
    responsiveness: number;
    participationScore: number;
    followThroughRate: number;
  };
  
  public coachingMetrics!: {
    goalsSet: number;
    goalsAchieved: number;
    goalCompletionRate: number;
    avatarId: string;
    avatarEffectivenessScore: number;
    avatarSwitchCount: number;
    progressMetrics: {
      skillImprovement: number;
      confidenceIncrease: number;
      stressReduction: number;
      habitFormation: number;
    };
  };
  
  public behavioralData!: {
    preferredSessionTime: string;
    preferredDuration: number;
    communicationStyle: string;
    topicsOfInterest: string[];
    challengeAreas: string[];
    moodTrends: {
      date: string;
      mood: string;
      sentiment: number;
    }[];
    learningPreferences: {
      visualLearner: number;
      auditoryLearner: number;
      kinestheticLearner: number;
    };
  };
  
  public kpiMetrics!: {
    userSatisfactionScore: number;
    npsScore: number;
    retentionProbability: number;
    churnRisk: number;
    customKpis: {
      name: string;
      value: number;
      target: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }[];
  };
  
  public benchmarkData!: {
    userPercentile: number;
    cohortId?: string;
    industryBenchmark: number;
    personalBest: number;
  };
  
  public aiInsights!: {
    strengthAreas: string[];
    improvementAreas: string[];
    recommendedActions: string[];
    predictedOutcomes: string[];
    riskFactors: string[];
  };
  
  public calculatedAt!: Date;
  public nextCalculationDate!: Date;
  public dataQualityScore!: number;
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  /**
   * Calculate overall health score for the user
   */
  public getOverallHealthScore(): number {
    const engagement = this.engagementMetrics.participationScore * 0.3;
    const coaching = this.coachingMetrics.goalCompletionRate * 0.4;
    const satisfaction = (this.kpiMetrics.userSatisfactionScore / 10) * 0.3;
    
    return Math.round((engagement + coaching + satisfaction) * 100);
  }

  /**
   * Get trending direction for key metrics
   */
  public getTrendingDirection(): 'up' | 'down' | 'stable' {
    const trends = this.kpiMetrics.customKpis.map(kpi => kpi.trend);
    const upCount = trends.filter(t => t === 'increasing').length;
    const downCount = trends.filter(t => t === 'decreasing').length;
    
    if (upCount > downCount) return 'up';
    if (downCount > upCount) return 'down';
    return 'stable';
  }

  /**
   * Check if user is at risk of churning
   */
  public isAtRisk(): boolean {
    return this.kpiMetrics.churnRisk > 0.7 || 
           this.kpiMetrics.userSatisfactionScore < 5 ||
           this.engagementMetrics.followThroughRate < 0.3;
  }

  /**
   * Get personalized recommendations based on analytics
   */
  public getPersonalizedRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Engagement recommendations
    if (this.engagementMetrics.averageSessionDuration < 15) {
      recommendations.push('Consider shorter, more focused coaching sessions to improve engagement');
    }
    
    if (this.engagementMetrics.missedSessions > 2) {
      recommendations.push('Implement session reminders and flexible scheduling');
    }
    
    // Progress recommendations
    if (this.coachingMetrics.goalCompletionRate < 0.5) {
      recommendations.push('Break down goals into smaller, more achievable milestones');
    }
    
    if (this.coachingMetrics.avatarEffectivenessScore < 0.6) {
      recommendations.push('Consider switching to a different coaching avatar style');
    }
    
    // Behavioral recommendations
    if (this.behavioralData.challengeAreas.length > 3) {
      recommendations.push('Focus on addressing 1-2 primary challenge areas for better results');
    }
    
    return [...recommendations, ...this.aiInsights.recommendedActions];
  }
}

UserAnalytics.init(
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
    periodType: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly'),
      allowNull: false,
    },
    periodStart: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    periodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    engagementMetrics: {
      type: DataTypes.JSONB,
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
      type: DataTypes.JSONB,
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
      type: DataTypes.JSONB,
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
      type: DataTypes.JSONB,
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
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        userPercentile: 50,
        industryBenchmark: 0.5,
        personalBest: 0.5,
      },
    },
    aiInsights: {
      type: DataTypes.JSONB,
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
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    nextCalculationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      },
    },
    dataQualityScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.8,
      validate: {
        min: 0,
        max: 1,
      },
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
    tableName: 'user_analytics',
    modelName: 'UserAnalytics',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
        name: 'idx_user_analytics_user_id',
      },
      {
        fields: ['periodType'],
        name: 'idx_user_analytics_period_type',
      },
      {
        fields: ['periodStart', 'periodEnd'],
        name: 'idx_user_analytics_period',
      },
      {
        fields: ['calculatedAt'],
        name: 'idx_user_analytics_calculated_at',
      },
      {
        fields: ['nextCalculationDate'],
        name: 'idx_user_analytics_next_calculation',
      },
      {
        fields: ['userId', 'periodType', 'periodStart'],
        name: 'idx_user_analytics_user_period',
        unique: true,
      },
    ],
  }
);

export default UserAnalytics; 