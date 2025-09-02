"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiTracker = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
class KpiTracker extends sequelize_1.Model {
    id;
    userId;
    organizationId;
    type;
    title;
    description;
    category;
    objective;
    keyResults;
    kpiData;
    startDate;
    endDate;
    reviewFrequency;
    lastReviewDate;
    nextReviewDate;
    overallProgress;
    status;
    milestones;
    performanceHistory;
    coachingData;
    analytics;
    collaborators;
    priority;
    confidentiality;
    tags;
    /**
     * Calculate overall progress based on key results or milestones
     */
    calculateOverallProgress() {
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
    isAtRisk() {
        const now = new Date();
        const totalDuration = this.endDate.getTime() - this.startDate.getTime();
        const elapsed = now.getTime() - this.startDate.getTime();
        const expectedProgress = (elapsed / totalDuration) * 100;
        // At risk if progress is significantly behind schedule
        return this.overallProgress < expectedProgress - 20 && now < this.endDate;
    }
    /**
     * Calculate velocity score based on recent progress
     */
    calculateVelocityScore() {
        if (this.performanceHistory.length < 2) {
            return 0.5; // Default for insufficient data
        }
        const recentEntries = this.performanceHistory
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 5);
        if (recentEntries.length < 2)
            return 0.5;
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
    getNextMilestone() {
        const upcomingMilestones = this.milestones
            .filter(m => m.status === 'pending')
            .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());
        return upcomingMilestones.length > 0 ? upcomingMilestones[0] : null;
    }
    /**
     * Get overdue action items
     */
    getOverdueActionItems() {
        const now = new Date();
        return this.coachingData.actionItems.filter(item => item.status !== 'completed' && item.status !== 'cancelled' && item.dueDate < now);
    }
    /**
     * Add a new performance data point
     */
    addPerformanceData(value, note, context) {
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
exports.KpiTracker = KpiTracker;
KpiTracker.init({
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
    organizationId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        comment: 'For enterprise users',
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('kpi', 'okr', 'personal_goal', 'team_goal'),
        allowNull: false,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    category: {
        type: sequelize_1.DataTypes.ENUM('financial', 'professional', 'personal', 'health', 'relationships', 'skills', 'custom'),
        allowNull: false,
    },
    objective: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        comment: 'For OKR type goals',
    },
    keyResults: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    kpiData: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        comment: 'For KPI type goals',
    },
    startDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    endDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    reviewFrequency: {
        type: sequelize_1.DataTypes.ENUM('weekly', 'biweekly', 'monthly', 'quarterly'),
        allowNull: false,
        defaultValue: 'weekly',
    },
    lastReviewDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    nextReviewDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    overallProgress: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100,
        },
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('not_started', 'in_progress', 'at_risk', 'completed', 'failed', 'paused'),
        allowNull: false,
        defaultValue: 'not_started',
    },
    milestones: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    performanceHistory: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    coachingData: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            coachingFrequency: 'weekly',
            coachingNotes: [],
            actionItems: [],
        },
    },
    analytics: {
        type: sequelize_1.DataTypes.JSONB,
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
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium',
    },
    confidentiality: {
        type: sequelize_1.DataTypes.ENUM('public', 'team', 'private'),
        allowNull: false,
        defaultValue: 'private',
    },
    tags: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: false,
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
});
exports.default = KpiTracker;
//# sourceMappingURL=KpiTracker.js.map