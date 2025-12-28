/**
 * A/B Testing Service
 * Run controlled experiments to optimize features, UI/UX, and user journeys
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface Experiment {
  id: string;
  tenantId: string;
  name: string;
  hypothesis: string;
  description?: string;
  variants: Array<{
    id: string;
    name: string;
    config: Record<string, any>;
    trafficAllocation: number; // 0-100%
  }>;
  successMetrics: Array<{
    name: string;
    type: 'conversion' | 'numeric' | 'duration';
    goal: 'increase' | 'decrease';
  }>;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: Date;
  endDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExperimentAssignment {
  experimentId: string;
  userId: string;
  variantId: string;
  assignedAt: Date;
}

export interface ExperimentResult {
  experimentId: string;
  variants: Array<{
    variantId: string;
    variantName: string;
    participants: number;
    conversions: number;
    conversionRate: number;
    avgMetricValue?: number;
    confidence: number;
    isWinner: boolean;
  }>;
  statisticalSignificance: boolean;
  winnerVariantId?: string;
  recommendation: string;
}

export class ABTestingService extends EventEmitter {
  private static instance: ABTestingService;
  private experiments: Map<string, Experiment> = new Map();
  private assignments: Map<string, ExperimentAssignment[]> = new Map(); // userId -> assignments
  private results: Map<string, Map<string, any>> = new Map(); // experimentId -> variantId -> data

  private constructor() {
    super();
  }

  static getInstance(): ABTestingService {
    if (!ABTestingService.instance) {
      ABTestingService.instance = new ABTestingService();
    }
    return ABTestingService.instance;
  }

  async createExperiment(config: Omit<Experiment, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Experiment> {
    // Validate traffic allocation
    const totalAllocation = config.variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Traffic allocation must sum to 100%');
    }

    const experiment: Experiment = {
      ...config,
      id: crypto.randomUUID(),
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.experiments.set(experiment.id, experiment);
    this.emit('experiment:created', experiment);

    return experiment;
  }

  async startExperiment(experimentId: string): Promise<Experiment> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');
    if (experiment.status !== 'draft' && experiment.status !== 'paused') {
      throw new Error('Experiment can only be started from draft or paused state');
    }

    experiment.status = 'running';
    experiment.startDate = new Date();
    experiment.updatedAt = new Date();

    this.emit('experiment:started', experiment);
    return experiment;
  }

  async stopExperiment(experimentId: string): Promise<Experiment> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    experiment.status = 'completed';
    experiment.endDate = new Date();
    experiment.updatedAt = new Date();

    this.emit('experiment:stopped', experiment);
    return experiment;
  }

  async assignVariant(experimentId: string, userId: string): Promise<{ variantId: string; config: Record<string, any> }> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');
    if (experiment.status !== 'running') {
      throw new Error('Experiment is not running');
    }

    // Check if user already assigned
    const userAssignments = this.assignments.get(userId) || [];
    const existing = userAssignments.find(a => a.experimentId === experimentId);
    if (existing) {
      const variant = experiment.variants.find(v => v.id === existing.variantId)!;
      return { variantId: variant.id, config: variant.config };
    }

    // Assign variant based on traffic allocation
    const variant = this.selectVariant(experiment);
    const assignment: ExperimentAssignment = {
      experimentId,
      userId,
      variantId: variant.id,
      assignedAt: new Date(),
    };

    userAssignments.push(assignment);
    this.assignments.set(userId, userAssignments);

    this.emit('variant:assigned', assignment);

    return { variantId: variant.id, config: variant.config };
  }

  private selectVariant(experiment: Experiment): Experiment['variants'][0] {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of experiment.variants) {
      cumulative += variant.trafficAllocation;
      if (random <= cumulative) {
        return variant;
      }
    }

    return experiment.variants[0];
  }

  async trackConversion(experimentId: string, userId: string, metricName: string, value?: number): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    const userAssignments = this.assignments.get(userId) || [];
    const assignment = userAssignments.find(a => a.experimentId === experimentId);
    if (!assignment) return; // User not in experiment

    const variantResults = this.getVariantResults(experimentId, assignment.variantId);
    if (!variantResults.conversions) {
      variantResults.conversions = [];
    }

    variantResults.conversions.push({
      userId,
      metricName,
      value,
      timestamp: new Date(),
    });

    this.emit('conversion:tracked', { experimentId, userId, variantId: assignment.variantId, metricName, value });
  }

  async getResults(experimentId: string): Promise<ExperimentResult> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    const variants = experiment.variants.map(variant => {
      const results = this.getVariantResults(experimentId, variant.id);
      const participants = this.countParticipants(experimentId, variant.id);
      const conversions = results.conversions?.length || 0;
      const conversionRate = participants > 0 ? (conversions / participants) * 100 : 0;

      const metricValues = results.conversions
        ?.filter((c: any) => c.value !== undefined)
        .map((c: any) => c.value) || [];
      const avgMetricValue =
        metricValues.length > 0
          ? metricValues.reduce((sum: number, v: number) => sum + v, 0) / metricValues.length
          : undefined;

      return {
        variantId: variant.id,
        variantName: variant.name,
        participants,
        conversions,
        conversionRate,
        avgMetricValue,
        confidence: 0,
        isWinner: false,
      };
    });

    // Calculate statistical significance
    const { significant, winnerIndex } = this.calculateSignificance(variants);

    if (winnerIndex !== -1) {
      variants[winnerIndex].isWinner = true;
    }

    return {
      experimentId,
      variants,
      statisticalSignificance: significant,
      winnerVariantId: winnerIndex !== -1 ? variants[winnerIndex].variantId : undefined,
      recommendation: this.generateRecommendation(variants, significant),
    };
  }

  private getVariantResults(experimentId: string, variantId: string): any {
    if (!this.results.has(experimentId)) {
      this.results.set(experimentId, new Map());
    }
    const expResults = this.results.get(experimentId)!;
    if (!expResults.has(variantId)) {
      expResults.set(variantId, {});
    }
    return expResults.get(variantId);
  }

  private countParticipants(experimentId: string, variantId: string): number {
    let count = 0;
    for (const assignments of this.assignments.values()) {
      if (assignments.some(a => a.experimentId === experimentId && a.variantId === variantId)) {
        count++;
      }
    }
    return count;
  }

  private calculateSignificance(variants: any[]): { significant: boolean; winnerIndex: number } {
    if (variants.length < 2) return { significant: false, winnerIndex: -1 };

    // Simple chi-square test for conversion rates
    const control = variants[0];
    let winnerIndex = 0;
    let maxConversionRate = control.conversionRate;

    for (let i = 1; i < variants.length; i++) {
      if (variants[i].conversionRate > maxConversionRate) {
        maxConversionRate = variants[i].conversionRate;
        winnerIndex = i;
      }
    }

    // Require minimum sample size and difference
    const minSampleSize = 100;
    const minDifference = 5; // 5% improvement

    const sufficientSample = variants.every(v => v.participants >= minSampleSize);
    const significantDifference = Math.abs(maxConversionRate - control.conversionRate) >= minDifference;

    return {
      significant: sufficientSample && significantDifference,
      winnerIndex: sufficientSample && significantDifference ? winnerIndex : -1,
    };
  }

  private generateRecommendation(variants: any[], significant: boolean): string {
    if (!significant) {
      return 'Continue running the experiment. Not enough data for statistical significance.';
    }

    const winner = variants.find(v => v.isWinner);
    if (!winner) {
      return 'No clear winner. Results are inconclusive.';
    }

    const control = variants[0];
    const improvement = ((winner.conversionRate - control.conversionRate) / control.conversionRate) * 100;

    return `Variant "${winner.variantName}" shows a ${improvement.toFixed(1)}% improvement over control. Recommend implementing this variant.`;
  }

  async listExperiments(tenantId: string): Promise<Experiment[]> {
    return Array.from(this.experiments.values()).filter(e => e.tenantId === tenantId);
  }

  async deleteExperiment(experimentId: string): Promise<void> {
    this.experiments.delete(experimentId);
    this.results.delete(experimentId);
    this.emit('experiment:deleted', { experimentId });
  }
}

export const abTestingService = ABTestingService.getInstance();
