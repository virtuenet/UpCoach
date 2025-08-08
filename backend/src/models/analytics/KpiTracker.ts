import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../index';

/**
 * KPI/OKR Tracker Model
 * Tracks Key Performance Indicators and Objectives & Key Results
 * for comprehensive performance monitoring and goal achievement
 */

export interface KpiTrackerAttributes {
  id: string;
  userId: string;
  organizationId?: string; // For enterprise users
  
  // Goal Information
  type: 'kpi' | 'okr' | 'personal_goal' | 'team_goal';
  title: string;
  description: string;
  category: 'financial' | 'professional' | 'personal' | 'health' | 'relationships' | 'skills' | 'custom';
  
  // OKR Specific (if type is 'okr')
  objective?: string;
  keyResults: {
    id: string;
    description: string;
    target: number;
    current: number;
    unit: string;
    progress: number; // 0-100%
    status: 'not_started' | 'in_progress' | 'at_risk' | 'completed' | 'failed';
  }[];
  
  // KPI Specific (if type is 'kpi')
  kpiData?: {
    metric: string;
    target: number;
    current: number;
    unit: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  
  // Timeline
  startDate: Date;
  endDate: Date;
  reviewFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  lastReviewDate?: Date;
  nextReviewDate: Date;
  
  // Progress Tracking
  overallProgress: number; // 0-100%
  status: 'not_started' | 'in_progress' | 'at_risk' | 'completed' | 'failed' | 'paused';
  milestones: {
    id: string;
    title: string;
    description: string;
    targetDate: Date;
    completedDate?: Date;
    progress: number; // 0-100%
    status: 'pending' | 'completed' | 'overdue';
  }[];
  
  // Performance Data
  performanceHistory: {
    date: Date;
    value: number;
    note?: string;
    context?: string;
  }[];
  
  // Coaching Integration
  coachingData: {
    avatarId?: string;
    coachingFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    lastCoachingSession?: Date;
    nextCoachingSession?: Date;
    coachingNotes: string[];
    actionItems: {
      id: string;
      description: string;
      dueDate: Date;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      completedDate?: Date;
    }[];
  };
  
  // Analytics & Insights
  analytics: {
    averageProgress: number;
    velocityScore: number; // Rate of progress
    consistencyScore: number; // How consistent the progress is
    predictedCompletionDate?: Date;
    riskFactors: string[];
    successFactors: string[];
    recommendations: string[];
  };
  
  // Collaboration (for team goals)
  collaborators: {
    userId: string;
    role: 'owner' | 'contributor' | 'observer';
    contribution: number; // 0-100%
    lastActivity?: Date;
  }[];
  
  // Metadata
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidentiality: 'public' | 'team' | 'private';
  tags: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface KpiTrackerCreationAttributes 
  extends Optional<KpiTrackerAttributes, 'id' | 'organizationId' | 'objective' | 'kpiData' | 'lastReviewDate' | 'performanceHistory' | 'collaborators' | 'createdAt' | 'updatedAt'> {}

export class KpiTracker extends Model<KpiTrackerAttributes, KpiTrackerCreationAttributes> implements KpiTrackerAttributes {
  public id!: string;
  public userId!: string;
  public organizationId?: string;
  
  public type!: 'kpi' | 'okr' | 'personal_goal' | 'team_goal';
  public title!: string;
  public description!: string;
  public category!: 'financial' | 'professional' | 'personal' | 'health' | 'relationships' | 'skills' | 'custom';
  
  public objective?: string;
  public keyResults!: {
    id: string;
    description: string;
    target: number;
    current: number;
    unit: string;
    progress: number;
    status: 'not_started' | 'in_progress' | 'at_risk' | 'completed' | 'failed';
  }[];
  
  public kpiData?: {
    metric: string;
    target: number;
    current: number;
    unit: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  
  public startDate!: Date;
  public endDate!: Date;
  public reviewFrequency!: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  public lastReviewDate?: Date;
  public nextReviewDate!: Date;
  
  public overallProgress!: number;
  public status!: 'not_started' | 'in_progress' | 'at_risk' | 'completed' | 'failed' | 'paused';
  public milestones!: {
    id: string;
    title: string;
    description: string;
    targetDate: Date;
    completedDate?: Date;
    progress: number;
    status: 'pending' | 'completed' | 'overdue';
  }[];
  
  public performanceHistory!: {
    date: Date;
    value: number;
    note?: string;
    context?: string;
  }[];
  
  public coachingData!: {
    avatarId?: string;
    coachingFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    lastCoachingSession?: Date;
    nextCoachingSession?: Date;
    coachingNotes: string[];
    actionItems: {
      id: string;
      description: string;
      dueDate: Date;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      completedDate?: Date;
    }[];
  };
  
  public analytics!: {
    averageProgress: number;
    velocityScore: number;
    consistencyScore: number;
    predictedCompletionDate?: Date;
    riskFactors: string[];
    successFactors: string[];
    recommendations: string[];
  };
  
  public collaborators!: {
    userId: string;
    role: 'owner' | 'contributor' | 'observer';
    contribution: number;
    lastActivity?: Date;
  }[];
  
  public priority!: 'low' | 'medium' | 'high' | 'critical';
  public confidentiality!: 'public' | 'team' | 'private';
  public tags!: string[];
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  /**
   * Calculate overall progress based on key results or milestones
   */
  public calculateOverallProgress(): number {
    if (this.type === 'okr' && this.keyResults.length > 0) {
      const totalProgress = this.keyResults.reduce((sum, kr) => sum + kr.progress, 0);
      return Math.round(totalProgress / this.keyResults.length);
    }
    
    if (this.milestones.length > 0) {
      const totalProgress = this.milestones.reduce((sum, milestone) => sum + milestone.progress, 0);
      return Math.round(totalProgress / this.milestones.length);
    }
    
    return this.overallProgress;
  }

  /**
   * Determine if the goal is at risk based on timeline and progress
   */
  public isAtRisk(): boolean {
    const now = new Date();
    const totalDuration = this.endDate.getTime() - this.startDate.getTime();
    const elapsed = now.getTime() - this.startDate.getTime();
    const expectedProgress = (elapsed / totalDuration) * 100;
    
    // At risk if progress is significantly behind schedule
    return this.overallProgress < (expectedProgress - 20) && now < this.endDate;
  }

  /**
   * Calculate velocity score based on recent progress
   */
  public calculateVelocityScore(): number {
    if (this.performanceHistory.length < 2) {
      return 0.5; // Default for insufficient data
    }
    
    const recentEntries = this.performanceHistory
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
    
    if (recentEntries.length < 2) return 0.5;
    
    let improvements = 0;
    for (let i = 0; i < recentEntries.length - 1; i++) {
      if (recentEntries[i].value > recentEntries[i + 1].value) {
        improvements++;
      }
    }
    
    return improvements / (recentEntries.length - 1);
  }

  /**
   * Get next upcoming milestone
   */
  public getNextMilestone(): typeof this.milestones[0] | null {
    const upcomingMilestones = this.milestones
      .filter(m => m.status === 'pending')
      .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());
    
    return upcomingMilestones.length > 0 ? upcomingMilestones[0] : null;
  }

  /**
   * Get overdue action items
   */
  public getOverdueActionItems(): typeof this.coachingData.actionItems {
    const now = new Date();
    return this.coachingData.actionItems.filter(
      item => item.status !== 'completed' && 
              item.status !== 'cancelled' && 
              item.dueDate < now
    );
  }

  /**
   * Add a new performance data point
   */
  public addPerformanceData(value: number, note?: string, context?: string): void {
    this.performanceHistory.push({
      date: new Date(),
      value,
      note,
      context,
    });
    
    // Keep only last 100 entries to manage data size
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 100);
    }
    
    // Recalculate analytics
    this.analytics.velocityScore = this.calculateVelocityScore();
    this.overallProgress = this.calculateOverallProgress();
  }
}

KpiTracker.init(
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
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'For enterprise users',
    },
    type: {
      type: DataTypes.ENUM('kpi', 'okr', 'personal_goal', 'team_goal'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('financial', 'professional', 'personal', 'health', 'relationships', 'skills', 'custom'),
      allowNull: false,
    },
    objective: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'For OKR type goals',
    },
    keyResults: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    kpiData: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'For KPI type goals',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    reviewFrequency: {
      type: DataTypes.ENUM('weekly', 'biweekly', 'monthly', 'quarterly'),
      allowNull: false,
      defaultValue: 'weekly',
    },
    lastReviewDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextReviewDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    overallProgress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'at_risk', 'completed', 'failed', 'paused'),
      allowNull: false,
      defaultValue: 'not_started',
    },
    milestones: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    performanceHistory: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    coachingData: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        coachingFrequency: 'weekly',
        coachingNotes: [],
        actionItems: [],
      },
    },
    analytics: {
      type: DataTypes.JSONB,
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
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium',
    },
    confidentiality: {
      type: DataTypes.ENUM('public', 'team', 'private'),
      allowNull: false,
      defaultValue: 'private',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
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
    tableName: 'kpi_trackers',
    modelName: 'KpiTracker',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
        name: 'idx_kpi_trackers_user_id',
      },
      {
        fields: ['type'],
        name: 'idx_kpi_trackers_type',
      },
      {
        fields: ['category'],
        name: 'idx_kpi_trackers_category',
      },
      {
        fields: ['status'],
        name: 'idx_kpi_trackers_status',
      },
      {
        fields: ['priority'],
        name: 'idx_kpi_trackers_priority',
      },
      {
        fields: ['endDate'],
        name: 'idx_kpi_trackers_end_date',
      },
      {
        fields: ['nextReviewDate'],
        name: 'idx_kpi_trackers_next_review',
      },
      {
        fields: ['userId', 'status'],
        name: 'idx_kpi_trackers_user_status',
      },
      {
        fields: ['tags'],
        using: 'GIN',
        name: 'idx_kpi_trackers_tags',
      },
    ],
  }
);

export default KpiTracker; 