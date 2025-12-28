/**
 * Cohort Analysis Engine
 * Analyze user behavior patterns across different user segments and time cohorts
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { analyticsDataPipeline } from './AnalyticsDataPipeline';

export interface CohortCriteria {
  signupDateRange?: [Date, Date];
  subscriptionTier?: string[];
  behaviors?: string[];
  demographics?: Record<string, any>;
  customConditions?: Array<{
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=';
    value: any;
  }>;
}

export interface Cohort {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  criteria: CohortCriteria;
  userCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RetentionCurve {
  cohortId: string;
  timeframe: 'weekly' | 'monthly';
  periods: Array<{
    period: number; // 0, 1, 2, 3, etc.
    label: string; // "Week 0", "Week 1", etc.
    retainedUsers: number;
    retentionRate: number; // percentage
  }>;
  totalUsers: number;
}

export interface AdoptionMetrics {
  cohortId: string;
  featureName: string;
  adoptionRate: number; // percentage
  timeToAdopt: number; // average days
  activeUsers: number;
  totalUsers: number;
}

export interface LTVData {
  cohortId: string;
  averageLTV: number;
  medianLTV: number;
  ltvByPeriod: Array<{
    period: number;
    cumulativeLTV: number;
  }>;
  totalRevenue: number;
  totalUsers: number;
}

export class CohortAnalysisEngine extends EventEmitter {
  private static instance: CohortAnalysisEngine;
  private cohorts: Map<string, Cohort> = new Map();
  private cohortUsers: Map<string, Set<string>> = new Map(); // cohortId -> userIds

  private constructor() {
    super();
  }

  static getInstance(): CohortAnalysisEngine {
    if (!CohortAnalysisEngine.instance) {
      CohortAnalysisEngine.instance = new CohortAnalysisEngine();
    }
    return CohortAnalysisEngine.instance;
  }

  async createCohort(definition: {
    tenantId: string;
    name: string;
    description?: string;
    criteria: CohortCriteria;
    createdBy: string;
  }): Promise<Cohort> {
    const cohort: Cohort = {
      id: crypto.randomUUID(),
      ...definition,
      userCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Calculate initial user count
    const users = await this.calculateCohortUsers(cohort);
    cohort.userCount = users.size;

    this.cohorts.set(cohort.id, cohort);
    this.cohortUsers.set(cohort.id, users);
    this.emit('cohort:created', cohort);

    return cohort;
  }

  async updateCohort(
    cohortId: string,
    updates: Partial<Pick<Cohort, 'name' | 'description' | 'criteria'>>
  ): Promise<Cohort> {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) throw new Error('Cohort not found');

    Object.assign(cohort, updates, { updatedAt: new Date() });

    // Recalculate users if criteria changed
    if (updates.criteria) {
      const users = await this.calculateCohortUsers(cohort);
      cohort.userCount = users.size;
      this.cohortUsers.set(cohortId, users);
    }

    this.emit('cohort:updated', cohort);
    return cohort;
  }

  async deleteCohort(cohortId: string): Promise<void> {
    this.cohorts.delete(cohortId);
    this.cohortUsers.delete(cohortId);
    this.emit('cohort:deleted', { cohortId });
  }

  async getCohort(cohortId: string): Promise<Cohort> {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) throw new Error('Cohort not found');
    return cohort;
  }

  async listCohorts(tenantId: string): Promise<Cohort[]> {
    return Array.from(this.cohorts.values()).filter(c => c.tenantId === tenantId);
  }

  async analyzeRetention(cohortId: string, timeframe: 'weekly' | 'monthly'): Promise<RetentionCurve> {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) throw new Error('Cohort not found');

    const users = this.cohortUsers.get(cohortId) || new Set();
    const totalUsers = users.size;

    // Calculate retention for each period
    const periods: RetentionCurve['periods'] = [];
    const maxPeriods = timeframe === 'weekly' ? 12 : 6; // 12 weeks or 6 months

    const cohortStartDate = cohort.criteria.signupDateRange?.[0] || cohort.createdAt;

    for (let period = 0; period <= maxPeriods; period++) {
      const periodStart = new Date(cohortStartDate);
      const periodEnd = new Date(cohortStartDate);

      if (timeframe === 'weekly') {
        periodStart.setDate(periodStart.getDate() + period * 7);
        periodEnd.setDate(periodEnd.getDate() + (period + 1) * 7);
      } else {
        periodStart.setMonth(periodStart.getMonth() + period);
        periodEnd.setMonth(periodEnd.getMonth() + period + 1);
      }

      // Count users active in this period
      const activeUsers = await this.countActiveUsers(
        cohort.tenantId,
        Array.from(users),
        periodStart,
        periodEnd
      );

      periods.push({
        period,
        label: timeframe === 'weekly' ? `Week ${period}` : `Month ${period}`,
        retainedUsers: activeUsers,
        retentionRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      });
    }

    return {
      cohortId,
      timeframe,
      periods,
      totalUsers,
    };
  }

  async trackFeatureAdoption(cohortId: string, featureName: string): Promise<AdoptionMetrics> {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) throw new Error('Cohort not found');

    const users = this.cohortUsers.get(cohortId) || new Set();
    const totalUsers = users.size;

    // Query feature usage events
    const result = await analyticsDataPipeline.query({
      tenantId: cohort.tenantId,
      startDate: cohort.createdAt,
      endDate: new Date(),
      eventTypes: ['feature.used'],
      filters: { featureName },
    });

    const usageEvents = result.events || [];
    const activeUsers = new Set(usageEvents.map(e => e.userId).filter(Boolean));

    // Calculate time to adopt
    const adoptionTimes: number[] = [];
    const userFirstUse = new Map<string, Date>();

    usageEvents.forEach(event => {
      if (!event.userId) return;
      const existingFirst = userFirstUse.get(event.userId);
      if (!existingFirst || event.timestamp < existingFirst) {
        userFirstUse.set(event.userId, event.timestamp);
      }
    });

    userFirstUse.forEach((firstUse, userId) => {
      // Calculate days from cohort start to first use
      const days = (firstUse.getTime() - cohort.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      adoptionTimes.push(days);
    });

    const avgTimeToAdopt =
      adoptionTimes.length > 0
        ? adoptionTimes.reduce((sum, t) => sum + t, 0) / adoptionTimes.length
        : 0;

    return {
      cohortId,
      featureName,
      adoptionRate: totalUsers > 0 ? (activeUsers.size / totalUsers) * 100 : 0,
      timeToAdopt: avgTimeToAdopt,
      activeUsers: activeUsers.size,
      totalUsers,
    };
  }

  async analyzeLTV(cohortId: string): Promise<LTVData> {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) throw new Error('Cohort not found');

    const users = this.cohortUsers.get(cohortId) || new Set();

    // Query payment events
    const result = await analyticsDataPipeline.query({
      tenantId: cohort.tenantId,
      startDate: cohort.createdAt,
      endDate: new Date(),
      eventTypes: ['payment.succeeded'],
    });

    const paymentEvents = (result.events || []).filter(e => users.has(e.userId || ''));

    // Calculate LTV per user
    const userRevenue = new Map<string, number>();
    paymentEvents.forEach(event => {
      if (!event.userId) return;
      const amount = event.eventData.amount as number;
      userRevenue.set(event.userId, (userRevenue.get(event.userId) || 0) + amount);
    });

    const ltvValues = Array.from(userRevenue.values());
    const totalRevenue = ltvValues.reduce((sum, ltv) => sum + ltv, 0);
    const averageLTV = ltvValues.length > 0 ? totalRevenue / ltvValues.length : 0;

    // Calculate median LTV
    const sortedLTV = [...ltvValues].sort((a, b) => a - b);
    const medianLTV =
      sortedLTV.length > 0
        ? sortedLTV.length % 2 === 0
          ? (sortedLTV[sortedLTV.length / 2 - 1] + sortedLTV[sortedLTV.length / 2]) / 2
          : sortedLTV[Math.floor(sortedLTV.length / 2)]
        : 0;

    // Calculate LTV by period (monthly)
    const ltvByPeriod: LTVData['ltvByPeriod'] = [];
    const maxMonths = 12;

    for (let month = 0; month < maxMonths; month++) {
      const periodStart = new Date(cohort.createdAt);
      const periodEnd = new Date(cohort.createdAt);
      periodStart.setMonth(periodStart.getMonth() + month);
      periodEnd.setMonth(periodEnd.getMonth() + month + 1);

      const periodPayments = paymentEvents.filter(
        e => e.timestamp >= periodStart && e.timestamp < periodEnd
      );
      const periodRevenue = periodPayments.reduce(
        (sum, e) => sum + (e.eventData.amount as number),
        0
      );

      const cumulativeLTV =
        ltvByPeriod.length > 0
          ? ltvByPeriod[ltvByPeriod.length - 1].cumulativeLTV + periodRevenue
          : periodRevenue;

      ltvByPeriod.push({
        period: month,
        cumulativeLTV,
      });
    }

    return {
      cohortId,
      averageLTV,
      medianLTV,
      ltvByPeriod,
      totalRevenue,
      totalUsers: users.size,
    };
  }

  private async calculateCohortUsers(cohort: Cohort): Promise<Set<string>> {
    const { criteria } = cohort;
    const users = new Set<string>();

    // Query user signup events
    const result = await analyticsDataPipeline.query({
      tenantId: cohort.tenantId,
      startDate: criteria.signupDateRange?.[0] || new Date(0),
      endDate: criteria.signupDateRange?.[1] || new Date(),
      eventTypes: ['user.signup'],
    });

    (result.events || []).forEach(event => {
      if (event.userId) {
        // Apply additional filters
        let matches = true;

        if (criteria.subscriptionTier) {
          const userTier = event.eventData.subscriptionTier;
          matches = matches && criteria.subscriptionTier.includes(userTier);
        }

        if (criteria.customConditions) {
          for (const condition of criteria.customConditions) {
            const value = event.eventData[condition.field];
            matches = matches && this.evaluateCondition(value, condition.operator, condition.value);
          }
        }

        if (matches) {
          users.add(event.userId);
        }
      }
    });

    return users;
  }

  private evaluateCondition(value: any, operator: string, threshold: any): boolean {
    switch (operator) {
      case '=':
        return value === threshold;
      case '!=':
        return value !== threshold;
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      default:
        return false;
    }
  }

  private async countActiveUsers(
    tenantId: string,
    userIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await analyticsDataPipeline.query({
      tenantId,
      startDate,
      endDate,
      eventTypes: ['user.login'],
    });

    const activeUserIds = new Set(
      (result.events || [])
        .filter(e => userIds.includes(e.userId || ''))
        .map(e => e.userId)
        .filter(Boolean)
    );

    return activeUserIds.size;
  }

  async compareCohorts(cohortIds: string[]): Promise<{
    cohorts: Cohort[];
    comparison: {
      retentionRates: Array<{
        cohortId: string;
        cohortName: string;
        retentionByPeriod: number[];
      }>;
      ltvComparison: Array<{
        cohortId: string;
        cohortName: string;
        averageLTV: number;
      }>;
    };
  }> {
    const cohorts = cohortIds.map(id => this.cohorts.get(id)).filter(Boolean) as Cohort[];

    const retentionRates: any[] = [];
    const ltvComparison: any[] = [];

    for (const cohort of cohorts) {
      // Get retention
      const retention = await this.analyzeRetention(cohort.id, 'monthly');
      retentionRates.push({
        cohortId: cohort.id,
        cohortName: cohort.name,
        retentionByPeriod: retention.periods.map(p => p.retentionRate),
      });

      // Get LTV
      const ltv = await this.analyzeLTV(cohort.id);
      ltvComparison.push({
        cohortId: cohort.id,
        cohortName: cohort.name,
        averageLTV: ltv.averageLTV,
      });
    }

    return {
      cohorts,
      comparison: {
        retentionRates,
        ltvComparison,
      },
    };
  }
}

export const cohortAnalysisEngine = CohortAnalysisEngine.getInstance();
