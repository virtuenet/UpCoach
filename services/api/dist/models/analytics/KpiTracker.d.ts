import { Model, Optional } from 'sequelize';
/**
 * KPI/OKR Tracker Model
 * Tracks Key Performance Indicators and Objectives & Key Results
 * for comprehensive performance monitoring and goal achievement
 */
export interface KpiTrackerAttributes {
    id: string;
    userId: string;
    organizationId?: string;
    type: 'kpi' | 'okr' | 'personal_goal' | 'team_goal';
    title: string;
    description: string;
    category: 'financial' | 'professional' | 'personal' | 'health' | 'relationships' | 'skills' | 'custom';
    objective?: string;
    keyResults: {
        id: string;
        description: string;
        target: number;
        current: number;
        unit: string;
        progress: number;
        status: 'not_started' | 'in_progress' | 'at_risk' | 'completed' | 'failed';
    }[];
    kpiData?: {
        metric: string;
        target: number;
        current: number;
        unit: string;
        trend: 'increasing' | 'decreasing' | 'stable';
        frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    };
    startDate: Date;
    endDate: Date;
    reviewFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
    lastReviewDate?: Date;
    nextReviewDate: Date;
    overallProgress: number;
    status: 'not_started' | 'in_progress' | 'at_risk' | 'completed' | 'failed' | 'paused';
    milestones: {
        id: string;
        title: string;
        description: string;
        targetDate: Date;
        completedDate?: Date;
        progress: number;
        status: 'pending' | 'completed' | 'overdue';
    }[];
    performanceHistory: {
        date: Date;
        value: number;
        note?: string;
        context?: string;
    }[];
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
    analytics: {
        averageProgress: number;
        velocityScore: number;
        consistencyScore: number;
        predictedCompletionDate?: Date;
        riskFactors: string[];
        successFactors: string[];
        recommendations: string[];
    };
    collaborators: {
        userId: string;
        role: 'owner' | 'contributor' | 'observer';
        contribution: number;
        lastActivity?: Date;
    }[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    confidentiality: 'public' | 'team' | 'private';
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface KpiTrackerCreationAttributes extends Optional<KpiTrackerAttributes, 'id' | 'organizationId' | 'objective' | 'kpiData' | 'lastReviewDate' | 'performanceHistory' | 'collaborators' | 'createdAt' | 'updatedAt'> {
}
export declare class KpiTracker extends Model<KpiTrackerAttributes, KpiTrackerCreationAttributes> implements KpiTrackerAttributes {
    id: string;
    userId: string;
    organizationId?: string;
    type: 'kpi' | 'okr' | 'personal_goal' | 'team_goal';
    title: string;
    description: string;
    category: 'financial' | 'professional' | 'personal' | 'health' | 'relationships' | 'skills' | 'custom';
    objective?: string;
    keyResults: {
        id: string;
        description: string;
        target: number;
        current: number;
        unit: string;
        progress: number;
        status: 'not_started' | 'in_progress' | 'at_risk' | 'completed' | 'failed';
    }[];
    kpiData?: {
        metric: string;
        target: number;
        current: number;
        unit: string;
        trend: 'increasing' | 'decreasing' | 'stable';
        frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    };
    startDate: Date;
    endDate: Date;
    reviewFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
    lastReviewDate?: Date;
    nextReviewDate: Date;
    overallProgress: number;
    status: 'not_started' | 'in_progress' | 'at_risk' | 'completed' | 'failed' | 'paused';
    milestones: {
        id: string;
        title: string;
        description: string;
        targetDate: Date;
        completedDate?: Date;
        progress: number;
        status: 'pending' | 'completed' | 'overdue';
    }[];
    performanceHistory: {
        date: Date;
        value: number;
        note?: string;
        context?: string;
    }[];
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
    analytics: {
        averageProgress: number;
        velocityScore: number;
        consistencyScore: number;
        predictedCompletionDate?: Date;
        riskFactors: string[];
        successFactors: string[];
        recommendations: string[];
    };
    collaborators: {
        userId: string;
        role: 'owner' | 'contributor' | 'observer';
        contribution: number;
        lastActivity?: Date;
    }[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    confidentiality: 'public' | 'team' | 'private';
    tags: string[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
    /**
     * Calculate overall progress based on key results or milestones
     */
    calculateOverallProgress(): number;
    /**
     * Determine if the goal is at risk based on timeline and progress
     */
    isAtRisk(): boolean;
    /**
     * Calculate velocity score based on recent progress
     */
    calculateVelocityScore(): number;
    /**
     * Get next upcoming milestone
     */
    getNextMilestone(): (typeof this.milestones)[0] | null;
    /**
     * Get overdue action items
     */
    getOverdueActionItems(): typeof this.coachingData.actionItems;
    /**
     * Add a new performance data point
     */
    addPerformanceData(value: number, note?: string, context?: string): void;
}
export default KpiTracker;
//# sourceMappingURL=KpiTracker.d.ts.map