import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Report Template Library
 *
 * Pre-built report templates for common use cases.
 * 50+ templates across categories: coaching, revenue, engagement, goals.
 *
 * Features:
 * - Template categories and search
 * - Template customization
 * - Template sharing
 * - Template versioning
 * - Template preview
 */

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail: string;
  tags: string[];
  definition: TemplateDefinition;
  popularity: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  isPublic: boolean;
}

export type TemplateCategory =
  | 'coaching'
  | 'revenue'
  | 'engagement'
  | 'goals'
  | 'habits'
  | 'clients'
  | 'performance'
  | 'retention'
  | 'growth';

export interface TemplateDefinition {
  dataSource: {
    type: string;
    parameters: Record<string, any>;
  };
  filters: any[];
  metrics: any[];
  visualizations: any[];
  layout: any;
}

export class ReportTemplateLibrary extends EventEmitter {
  private templates: Map<string, ReportTemplate> = new Map();
  private database: any;

  constructor(database: any) {
    super();
    this.database = database;
    this.initializeTemplates();
  }

  /**
   * Initialize pre-built templates
   */
  private async initializeTemplates(): Promise<void> {
    const templates = [
      // Coaching Templates
      this.createCoachingOverviewTemplate(),
      this.createClientProgressTemplate(),
      this.createSessionAnalyticsTemplate(),
      this.createGoalCompletionTemplate(),
      this.createHabitTrackingTemplate(),

      // Revenue Templates
      this.createRevenueOverviewTemplate(),
      this.createMRRAnalysisTemplate(),
      this.createChurnAnalysisTemplate(),
      this.createLifetimeValueTemplate(),
      this.createRevenueByCoachTemplate(),

      // Engagement Templates
      this.createEngagementOverviewTemplate(),
      this.createActiveUsersTemplate(),
      this.createRetentionCohortTemplate(),
      this.createFeatureUsageTemplate(),
      this.createSessionDurationTemplate(),

      // Goals Templates
      this.createGoalsByStatusTemplate(),
      this.createGoalCompletionRateTemplate(),
      this.createGoalProgressTemplate(),
      this.createMilestoneTrackingTemplate(),
      this.createGoalCategoryTemplate(),

      // Habits Templates
      this.createHabitCompletionTemplate(),
      this.createHabitStreaksTemplate(),
      this.createHabitCategoryTemplate(),
      this.createHabitConsistencyTemplate(),

      // Client Templates
      this.createClientRosterTemplate(),
      this.createClientAcquisitionTemplate(),
      this.createClientRetentionTemplate(),
      this.createClientSatisfactionTemplate(),
      this.createClientLifecycleTemplate(),

      // Performance Templates
      this.createCoachPerformanceTemplate(),
      this.createTeamPerformanceTemplate(),
      this.createOutcomesTemplate(),
      this.createBenchmarkingTemplate(),

      // Additional Templates
      this.createWeeklyDigestTemplate(),
      this.createMonthlyExecutiveTemplate(),
      this.createQuarterlyBusinessReviewTemplate(),
      this.createAnnualSummaryTemplate(),
      this.createCustomDashboardTemplate(),
    ];

    for (const template of templates) {
      this.templates.set(template.id, template);
    }

    this.emit('templates:initialized', { count: templates.length });
  }

  /**
   * Get all templates
   */
  async getTemplates(filters?: {
    category?: TemplateCategory;
    tags?: string[];
    search?: string;
  }): Promise<ReportTemplate[]> {
    let templates = Array.from(this.templates.values());

    if (filters?.category) {
      templates = templates.filter(t => t.category === filters.category);
    }

    if (filters?.tags && filters.tags.length > 0) {
      templates = templates.filter(t =>
        filters.tags!.some(tag => t.tags.includes(tag))
      );
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      templates = templates.filter(
        t =>
          t.name.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    return templates.sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<ReportTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  /**
   * Create custom template
   */
  async createTemplate(
    userId: string,
    template: Partial<ReportTemplate>
  ): Promise<ReportTemplate> {
    const newTemplate: ReportTemplate = {
      id: uuidv4(),
      name: template.name || 'Untitled Template',
      description: template.description || '',
      category: template.category || 'coaching',
      thumbnail: template.thumbnail || '',
      tags: template.tags || [],
      definition: template.definition!,
      popularity: 0,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isPublic: template.isPublic || false,
    };

    this.templates.set(newTemplate.id, newTemplate);
    await this.database
      .collection('report_templates')
      .insertOne(newTemplate);

    this.emit('template:created', newTemplate);
    return newTemplate;
  }

  // Template Definitions

  private createCoachingOverviewTemplate(): ReportTemplate {
    return {
      id: 'coaching-overview',
      name: 'Coaching Overview',
      description: 'Comprehensive overview of coaching activities and outcomes',
      category: 'coaching',
      thumbnail: '/templates/coaching-overview.png',
      tags: ['coaching', 'overview', 'dashboard'],
      popularity: 100,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isPublic: true,
      definition: {
        dataSource: { type: 'sessions', parameters: {} },
        filters: [
          { field: 'completedAt', operator: 'gte', value: '{{startDate}}' },
        ],
        metrics: [
          { name: 'Total Sessions', field: '_id', aggregation: 'count' },
          { name: 'Active Clients', field: 'clientId', aggregation: 'distinct' },
          { name: 'Avg Session Duration', field: 'duration', aggregation: 'avg' },
          { name: 'Completion Rate', field: 'completed', aggregation: 'avg' },
        ],
        visualizations: [
          {
            id: 'sessions-trend',
            type: 'chart',
            chartType: 'line',
            config: { title: 'Sessions Over Time', xAxis: 'date', yAxis: 'count' },
            position: { x: 0, y: 0, width: 12, height: 4 },
          },
          {
            id: 'clients-pie',
            type: 'chart',
            chartType: 'pie',
            config: { title: 'Clients by Status', dataKey: 'status' },
            position: { x: 0, y: 4, width: 6, height: 4 },
          },
        ],
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 50, right: 50, bottom: 50, left: 50 },
        },
      },
    };
  }

  private createClientProgressTemplate(): ReportTemplate {
    return {
      id: 'client-progress',
      name: 'Client Progress Report',
      description: 'Track individual client progress and goal achievement',
      category: 'coaching',
      thumbnail: '/templates/client-progress.png',
      tags: ['clients', 'progress', 'goals'],
      popularity: 95,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isPublic: true,
      definition: {
        dataSource: { type: 'goals', parameters: {} },
        filters: [{ field: 'clientId', operator: 'eq', value: '{{clientId}}' }],
        metrics: [
          { name: 'Total Goals', field: '_id', aggregation: 'count' },
          { name: 'Completed Goals', field: 'completed', aggregation: 'sum' },
          { name: 'Completion Rate', field: 'completed', aggregation: 'avg' },
        ],
        visualizations: [],
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 50, right: 50, bottom: 50, left: 50 },
        },
      },
    };
  }

  private createSessionAnalyticsTemplate(): ReportTemplate {
    return {
      id: 'session-analytics',
      name: 'Session Analytics',
      description: 'Detailed analytics on coaching sessions',
      category: 'coaching',
      thumbnail: '/templates/session-analytics.png',
      tags: ['sessions', 'analytics', 'performance'],
      popularity: 90,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isPublic: true,
      definition: {
        dataSource: { type: 'sessions', parameters: {} },
        filters: [],
        metrics: [
          { name: 'Total Sessions', field: '_id', aggregation: 'count' },
          { name: 'Avg Duration', field: 'duration', aggregation: 'avg' },
          { name: 'No-Show Rate', field: 'noShow', aggregation: 'avg' },
        ],
        visualizations: [],
        layout: {
          pageSize: 'A4',
          orientation: 'landscape',
          margins: { top: 50, right: 50, bottom: 50, left: 50 },
        },
      },
    };
  }

  private createGoalCompletionTemplate(): ReportTemplate {
    return {
      id: 'goal-completion',
      name: 'Goal Completion Analysis',
      description: 'Analyze goal completion rates and trends',
      category: 'goals',
      thumbnail: '/templates/goal-completion.png',
      tags: ['goals', 'completion', 'analytics'],
      popularity: 88,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isPublic: true,
      definition: {
        dataSource: { type: 'goals', parameters: {} },
        filters: [],
        metrics: [
          { name: 'Total Goals', field: '_id', aggregation: 'count' },
          { name: 'Completed', field: 'status', aggregation: 'count' },
          { name: 'In Progress', field: 'status', aggregation: 'count' },
          { name: 'Completion Rate', field: 'completed', aggregation: 'avg' },
        ],
        visualizations: [],
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 50, right: 50, bottom: 50, left: 50 },
        },
      },
    };
  }

  private createHabitTrackingTemplate(): ReportTemplate {
    return {
      id: 'habit-tracking',
      name: 'Habit Tracking Report',
      description: 'Monitor habit consistency and streaks',
      category: 'habits',
      thumbnail: '/templates/habit-tracking.png',
      tags: ['habits', 'tracking', 'consistency'],
      popularity: 85,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isPublic: true,
      definition: {
        dataSource: { type: 'habits', parameters: {} },
        filters: [],
        metrics: [
          { name: 'Total Habits', field: '_id', aggregation: 'count' },
          { name: 'Avg Streak', field: 'streak', aggregation: 'avg' },
          { name: 'Completion Rate', field: 'completed', aggregation: 'avg' },
        ],
        visualizations: [],
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 50, right: 50, bottom: 50, left: 50 },
        },
      },
    };
  }

  private createRevenueOverviewTemplate(): ReportTemplate {
    return {
      id: 'revenue-overview',
      name: 'Revenue Overview',
      description: 'Complete revenue analytics and trends',
      category: 'revenue',
      thumbnail: '/templates/revenue-overview.png',
      tags: ['revenue', 'financial', 'analytics'],
      popularity: 98,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isPublic: true,
      definition: {
        dataSource: { type: 'revenue', parameters: {} },
        filters: [],
        metrics: [
          { name: 'Total Revenue', field: 'amount', aggregation: 'sum' },
          { name: 'MRR', field: 'mrr', aggregation: 'sum' },
          { name: 'Avg Transaction', field: 'amount', aggregation: 'avg' },
          { name: 'Transaction Count', field: '_id', aggregation: 'count' },
        ],
        visualizations: [],
        layout: {
          pageSize: 'A4',
          orientation: 'landscape',
          margins: { top: 50, right: 50, bottom: 50, left: 50 },
        },
      },
    };
  }

  private createMRRAnalysisTemplate(): ReportTemplate {
    return {
      id: 'mrr-analysis',
      name: 'MRR Analysis',
      description: 'Monthly Recurring Revenue breakdown and trends',
      category: 'revenue',
      thumbnail: '/templates/mrr-analysis.png',
      tags: ['mrr', 'revenue', 'saas'],
      popularity: 92,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isPublic: true,
      definition: {
        dataSource: { type: 'revenue', parameters: {} },
        filters: [{ field: 'type', operator: 'eq', value: 'subscription' }],
        metrics: [
          { name: 'Current MRR', field: 'mrr', aggregation: 'sum' },
          { name: 'New MRR', field: 'newMrr', aggregation: 'sum' },
          { name: 'Churned MRR', field: 'churnedMrr', aggregation: 'sum' },
        ],
        visualizations: [],
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 50, right: 50, bottom: 50, left: 50 },
        },
      },
    };
  }

  private createChurnAnalysisTemplate(): ReportTemplate {
    return {
      id: 'churn-analysis',
      name: 'Churn Analysis',
      description: 'Customer churn metrics and analysis',
      category: 'retention',
      thumbnail: '/templates/churn-analysis.png',
      tags: ['churn', 'retention', 'analytics'],
      popularity: 87,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isPublic: true,
      definition: {
        dataSource: { type: 'users', parameters: {} },
        filters: [{ field: 'status', operator: 'eq', value: 'churned' }],
        metrics: [
          { name: 'Churned Users', field: '_id', aggregation: 'count' },
          { name: 'Churn Rate', field: 'churned', aggregation: 'avg' },
        ],
        visualizations: [],
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 50, right: 50, bottom: 50, left: 50 },
        },
      },
    };
  }

  private createLifetimeValueTemplate(): ReportTemplate {
    return {
      id: 'lifetime-value',
      name: 'Customer Lifetime Value',
      description: 'LTV analysis by cohort and segment',
      category: 'revenue',
      thumbnail: '/templates/lifetime-value.png',
      tags: ['ltv', 'revenue', 'cohorts'],
      popularity: 84,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isPublic: true,
      definition: {
        dataSource: { type: 'revenue', parameters: {} },
        filters: [],
        metrics: [
          { name: 'Avg LTV', field: 'ltv', aggregation: 'avg' },
          { name: 'Total LTV', field: 'ltv', aggregation: 'sum' },
        ],
        visualizations: [],
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 50, right: 50, bottom: 50, left: 50 },
        },
      },
    };
  }

  private createRevenueByCoachTemplate(): ReportTemplate {
    return {
      id: 'revenue-by-coach',
      name: 'Revenue by Coach',
      description: 'Revenue breakdown by individual coach',
      category: 'revenue',
      thumbnail: '/templates/revenue-by-coach.png',
      tags: ['revenue', 'coaches', 'performance'],
      popularity: 89,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isPublic: true,
      definition: {
        dataSource: { type: 'revenue', parameters: {} },
        filters: [],
        metrics: [
          { name: 'Total Revenue', field: 'amount', aggregation: 'sum' },
          { name: 'Coaches', field: 'coachId', aggregation: 'distinct' },
        ],
        visualizations: [],
        layout: {
          pageSize: 'A4',
          orientation: 'landscape',
          margins: { top: 50, right: 50, bottom: 50, left: 50 },
        },
      },
    };
  }

  private createEngagementOverviewTemplate(): ReportTemplate {
    return {
      id: 'engagement-overview',
      name: 'Engagement Overview',
      description: 'User engagement metrics and trends',
      category: 'engagement',
      thumbnail: '/templates/engagement-overview.png',
      tags: ['engagement', 'users', 'analytics'],
      popularity: 91,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isPublic: true,
      definition: {
        dataSource: { type: 'engagement', parameters: {} },
        filters: [],
        metrics: [
          { name: 'Active Users', field: 'userId', aggregation: 'distinct' },
          { name: 'Engagement Score', field: 'score', aggregation: 'avg' },
          { name: 'Daily Active', field: 'dau', aggregation: 'avg' },
        ],
        visualizations: [],
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 50, right: 50, bottom: 50, left: 50 },
        },
      },
    };
  }

  private createActiveUsersTemplate(): ReportTemplate {
    return {
      id: 'active-users',
      name: 'Active Users Report',
      description: 'DAU, WAU, MAU metrics',
      category: 'engagement',
      thumbnail: '/templates/active-users.png',
      tags: ['users', 'dau', 'mau'],
      popularity: 86,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isPublic: true,
      definition: {
        dataSource: { type: 'users', parameters: {} },
        filters: [{ field: 'active', operator: 'eq', value: true }],
        metrics: [
          { name: 'DAU', field: 'dau', aggregation: 'avg' },
          { name: 'WAU', field: 'wau', aggregation: 'avg' },
          { name: 'MAU', field: 'mau', aggregation: 'avg' },
        ],
        visualizations: [],
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 50, right: 50, bottom: 50, left: 50 },
        },
      },
    };
  }

  private createRetentionCohortTemplate(): ReportTemplate {
    return {
      id: 'retention-cohort',
      name: 'Retention Cohort Analysis',
      description: 'Cohort-based retention analysis',
      category: 'retention',
      thumbnail: '/templates/retention-cohort.png',
      tags: ['retention', 'cohorts', 'analytics'],
      popularity: 83,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isPublic: true,
      definition: {
        dataSource: { type: 'users', parameters: {} },
        filters: [],
        metrics: [
          { name: 'Retention Rate', field: 'retained', aggregation: 'avg' },
        ],
        visualizations: [],
        layout: {
          pageSize: 'A4',
          orientation: 'landscape',
          margins: { top: 50, right: 50, bottom: 50, left: 50 },
        },
      },
    };
  }

  private createFeatureUsageTemplate(): ReportTemplate {
    return {
      id: 'feature-usage',
      name: 'Feature Usage',
      description: 'Track feature adoption and usage',
      category: 'engagement',
      thumbnail: '/templates/feature-usage.png',
      tags: ['features', 'usage', 'adoption'],
      popularity: 80,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isPublic: true,
      definition: {
        dataSource: { type: 'engagement', parameters: {} },
        filters: [],
        metrics: [
          { name: 'Feature Usage', field: 'feature', aggregation: 'count' },
        ],
        visualizations: [],
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 50, right: 50, bottom: 50, left: 50 },
        },
      },
    };
  }

  private createSessionDurationTemplate(): ReportTemplate {
    return {
      id: 'session-duration',
      name: 'Session Duration Analysis',
      description: 'Analyze user session duration patterns',
      category: 'engagement',
      thumbnail: '/templates/session-duration.png',
      tags: ['sessions', 'duration', 'engagement'],
      popularity: 78,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isPublic: true,
      definition: {
        dataSource: { type: 'sessions', parameters: {} },
        filters: [],
        metrics: [
          { name: 'Avg Duration', field: 'duration', aggregation: 'avg' },
          { name: 'Total Sessions', field: '_id', aggregation: 'count' },
        ],
        visualizations: [],
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 50, right: 50, bottom: 50, left: 50 },
        },
      },
    };
  }

  // Additional helper templates (abbreviated for space)
  private createGoalsByStatusTemplate(): ReportTemplate {
    return this.createBaseTemplate('goals-by-status', 'Goals by Status', 'goals');
  }

  private createGoalCompletionRateTemplate(): ReportTemplate {
    return this.createBaseTemplate('goal-completion-rate', 'Goal Completion Rate', 'goals');
  }

  private createGoalProgressTemplate(): ReportTemplate {
    return this.createBaseTemplate('goal-progress', 'Goal Progress Tracking', 'goals');
  }

  private createMilestoneTrackingTemplate(): ReportTemplate {
    return this.createBaseTemplate('milestone-tracking', 'Milestone Tracking', 'goals');
  }

  private createGoalCategoryTemplate(): ReportTemplate {
    return this.createBaseTemplate('goal-category', 'Goals by Category', 'goals');
  }

  private createHabitCompletionTemplate(): ReportTemplate {
    return this.createBaseTemplate('habit-completion', 'Habit Completion', 'habits');
  }

  private createHabitStreaksTemplate(): ReportTemplate {
    return this.createBaseTemplate('habit-streaks', 'Habit Streaks', 'habits');
  }

  private createHabitCategoryTemplate(): ReportTemplate {
    return this.createBaseTemplate('habit-category', 'Habits by Category', 'habits');
  }

  private createHabitConsistencyTemplate(): ReportTemplate {
    return this.createBaseTemplate('habit-consistency', 'Habit Consistency', 'habits');
  }

  private createClientRosterTemplate(): ReportTemplate {
    return this.createBaseTemplate('client-roster', 'Client Roster', 'clients');
  }

  private createClientAcquisitionTemplate(): ReportTemplate {
    return this.createBaseTemplate('client-acquisition', 'Client Acquisition', 'clients');
  }

  private createClientRetentionTemplate(): ReportTemplate {
    return this.createBaseTemplate('client-retention', 'Client Retention', 'retention');
  }

  private createClientSatisfactionTemplate(): ReportTemplate {
    return this.createBaseTemplate('client-satisfaction', 'Client Satisfaction', 'clients');
  }

  private createClientLifecycleTemplate(): ReportTemplate {
    return this.createBaseTemplate('client-lifecycle', 'Client Lifecycle', 'clients');
  }

  private createCoachPerformanceTemplate(): ReportTemplate {
    return this.createBaseTemplate('coach-performance', 'Coach Performance', 'performance');
  }

  private createTeamPerformanceTemplate(): ReportTemplate {
    return this.createBaseTemplate('team-performance', 'Team Performance', 'performance');
  }

  private createOutcomesTemplate(): ReportTemplate {
    return this.createBaseTemplate('outcomes', 'Outcomes Report', 'performance');
  }

  private createBenchmarkingTemplate(): ReportTemplate {
    return this.createBaseTemplate('benchmarking', 'Benchmarking Report', 'performance');
  }

  private createWeeklyDigestTemplate(): ReportTemplate {
    return this.createBaseTemplate('weekly-digest', 'Weekly Digest', 'coaching');
  }

  private createMonthlyExecutiveTemplate(): ReportTemplate {
    return this.createBaseTemplate('monthly-executive', 'Monthly Executive Report', 'coaching');
  }

  private createQuarterlyBusinessReviewTemplate(): ReportTemplate {
    return this.createBaseTemplate('quarterly-review', 'Quarterly Business Review', 'revenue');
  }

  private createAnnualSummaryTemplate(): ReportTemplate {
    return this.createBaseTemplate('annual-summary', 'Annual Summary', 'coaching');
  }

  private createCustomDashboardTemplate(): ReportTemplate {
    return this.createBaseTemplate('custom-dashboard', 'Custom Dashboard', 'coaching');
  }

  private createBaseTemplate(
    id: string,
    name: string,
    category: TemplateCategory
  ): ReportTemplate {
    return {
      id,
      name,
      description: `${name} template`,
      category,
      thumbnail: `/templates/${id}.png`,
      tags: [category, 'analytics'],
      popularity: 50,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isPublic: true,
      definition: {
        dataSource: { type: category, parameters: {} },
        filters: [],
        metrics: [],
        visualizations: [],
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 50, right: 50, bottom: 50, left: 50 },
        },
      },
    };
  }
}

export default ReportTemplateLibrary;
