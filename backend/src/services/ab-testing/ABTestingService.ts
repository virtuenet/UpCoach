import crypto from 'crypto';
import { Experiment } from '../../models/experiments/Experiment';
import { ExperimentAssignment } from '../../models/experiments/ExperimentAssignment';
import { ExperimentEvent } from '../../models/experiments/ExperimentEvent';
import { User } from '../../models/User';

export interface VariantAssignment {
  experimentId: string;
  experimentName: string;
  variantId: string;
  variantName: string;
  configuration: Record<string, any>;
  isControl: boolean;
  assignedAt: Date;
}

export interface ExperimentAnalytics {
  experimentId: string;
  experimentName: string;
  status: string;
  startDate: Date;
  endDate?: Date;
  variants: VariantAnalytics[];
  statisticalSignificance?: StatisticalSignificance;
  recommendations: string[];
}

export interface VariantAnalytics {
  variantId: string;
  variantName: string;
  isControl: boolean;
  allocation: number;
  totalUsers: number;
  conversionRate: number;
  conversions: number;
  metrics: Record<string, any>;
}

export interface StatisticalSignificance {
  isSignificant: boolean;
  confidenceLevel: number;
  pValue: number;
  effect: number;
  recommendedAction: 'continue' | 'stop' | 'extend' | 'inconclusive';
}

export class ABTestingService {
  private static readonly HASH_SEED = 'upcoach-ab-testing';

  /**
   * Get variant assignment for a user in an experiment
   */
  async getVariant(userId: string, experimentId: string, context?: Record<string, any>): Promise<VariantAssignment | null> {
    try {
      // Check if user already has an assignment
      const existingAssignment = await ExperimentAssignment.getAssignment(experimentId, userId);
      if (existingAssignment && !existingAssignment.isExcluded) {
        const experiment = await Experiment.findByPk(experimentId);
        if (!experiment) return null;

        const variant = experiment.variants.find(v => v.id === existingAssignment.variantId);
        if (!variant) return null;

        return {
          experimentId,
          experimentName: experiment.name,
          variantId: variant.id,
          variantName: variant.name,
          configuration: variant.configuration,
          isControl: variant.isControl,
          assignedAt: existingAssignment.assignedAt,
        };
      }

      // Get experiment details
      const experiment = await Experiment.findByPk(experimentId);
      if (!experiment || !experiment.isActive()) {
        return null;
      }

      // Check if user meets segmentation criteria
      const user = await User.findByPk(userId);
      if (!user) return null;

      if (!this.meetsSegmentationCriteria(user, experiment.segmentation)) {
        await ExperimentAssignment.excludeUser(experimentId, userId, 'segmentation_criteria');
        return null;
      }

      // Check traffic allocation
      const userHash = this.generateUserHash(userId, experimentId);
      const trafficHash = userHash % 100;
      
      if (trafficHash >= experiment.trafficAllocation) {
        await ExperimentAssignment.excludeUser(experimentId, userId, 'traffic_allocation');
        return null;
      }

      // Assign variant based on hash
      const variantHash = userHash % 100;
      const variant = experiment.getVariantByAllocation(variantHash);
      
      if (!variant) {
        await ExperimentAssignment.excludeUser(experimentId, userId, 'allocation_error');
        return null;
      }

      // Create assignment record
      await ExperimentAssignment.createAssignment(experimentId, userId, variant.id, context);

      // Track assignment event
      await ExperimentEvent.trackEvent(
        experimentId,
        userId,
        variant.id,
        'experiment_assignment',
        undefined,
        { context }
      );

      return {
        experimentId,
        experimentName: experiment.name,
        variantId: variant.id,
        variantName: variant.name,
        configuration: variant.configuration,
        isControl: variant.isControl,
        assignedAt: new Date(),
      };
    } catch (error) {
      console.error('Error getting variant assignment:', error);
      return null;
    }
  }

  /**
   * Track conversion event for experiment
   */
  async trackConversion(
    userId: string,
    experimentId: string,
    eventType: string,
    eventValue?: number,
    properties?: Record<string, any>
  ): Promise<boolean> {
    try {
      const assignment = await ExperimentAssignment.getAssignment(experimentId, userId);
      if (!assignment || assignment.isExcluded) {
        return false;
      }

      await ExperimentEvent.trackEvent(
        experimentId,
        userId,
        assignment.variantId,
        eventType,
        eventValue,
        properties
      );

      return true;
    } catch (error) {
      console.error('Error tracking conversion:', error);
      return false;
    }
  }

  /**
   * Get experiment analytics
   */
  async getExperimentAnalytics(experimentId: string): Promise<ExperimentAnalytics | null> {
    try {
      const experiment = await Experiment.findByPk(experimentId);
      if (!experiment) return null;

      const variantAnalytics: VariantAnalytics[] = [];
      
      for (const variant of experiment.variants) {
        const assignments = await ExperimentAssignment.findAll({
          where: {
            experimentId,
            variantId: variant.id,
            isExcluded: false,
          },
        });

        const totalUsers = assignments.length;
        
        // Get conversion metrics for primary metric
        const conversionMetrics = await ExperimentEvent.getConversionRate(
          experimentId,
          variant.id,
          experiment.successCriteria.primaryMetric,
          experiment.startDate,
          experiment.endDate
        );

        variantAnalytics.push({
          variantId: variant.id,
          variantName: variant.name,
          isControl: variant.isControl,
          allocation: variant.allocation,
          totalUsers,
          conversionRate: conversionMetrics.conversionRate,
          conversions: conversionMetrics.conversions,
          metrics: {
            primaryMetric: conversionMetrics,
          },
        });
      }

      // Calculate statistical significance
      const statisticalSignificance = await this.calculateStatisticalSignificance(
        experiment,
        variantAnalytics
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(experiment, variantAnalytics, statisticalSignificance);

      return {
        experimentId,
        experimentName: experiment.name,
        status: experiment.status,
        startDate: experiment.startDate,
        endDate: experiment.endDate,
        variants: variantAnalytics,
        statisticalSignificance,
        recommendations,
      };
    } catch (error) {
      console.error('Error getting experiment analytics:', error);
      return null;
    }
  }

  /**
   * Generate user hash for consistent assignment
   */
  private generateUserHash(userId: string, experimentId: string): number {
    const input = `${userId}-${experimentId}-${ABTestingService.HASH_SEED}`;
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }

  /**
   * Check if user meets segmentation criteria
   */
  private meetsSegmentationCriteria(user: any, segmentation?: any): boolean {
    if (!segmentation) return true;

    // Check include rules
    if (segmentation.includeRules && segmentation.includeRules.length > 0) {
      const meetsIncludeRules = segmentation.includeRules.every((rule: any) => 
        this.evaluateSegmentRule(user, rule)
      );
      if (!meetsIncludeRules) return false;
    }

    // Check exclude rules
    if (segmentation.excludeRules && segmentation.excludeRules.length > 0) {
      const meetsExcludeRules = segmentation.excludeRules.some((rule: any) => 
        this.evaluateSegmentRule(user, rule)
      );
      if (meetsExcludeRules) return false;
    }

    return true;
  }

  /**
   * Evaluate a single segmentation rule
   */
  private evaluateSegmentRule(user: any, rule: any): boolean {
    const userValue = this.getNestedProperty(user, rule.field);
    
    switch (rule.operator) {
      case 'equals':
        return userValue === rule.value;
      case 'not_equals':
        return userValue !== rule.value;
      case 'contains':
        return typeof userValue === 'string' && userValue.includes(rule.value);
      case 'greater_than':
        return Number(userValue) > Number(rule.value);
      case 'less_than':
        return Number(userValue) < Number(rule.value);
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(userValue);
      case 'not_in':
        return Array.isArray(rule.value) && !rule.value.includes(userValue);
      default:
        return false;
    }
  }

  /**
   * Get nested property from object
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Calculate statistical significance using z-test for proportions
   */
  private async calculateStatisticalSignificance(
    experiment: Experiment,
    variants: VariantAnalytics[]
  ): Promise<StatisticalSignificance> {
    const controlVariant = variants.find(v => v.isControl);
    const testVariants = variants.filter(v => !v.isControl);
    
    if (!controlVariant || testVariants.length === 0) {
      return {
        isSignificant: false,
        confidenceLevel: 0,
        pValue: 1,
        effect: 0,
        recommendedAction: 'inconclusive',
      };
    }

    // Use the best performing test variant for comparison
    const bestTestVariant = testVariants.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    );

    // Calculate z-score for two-proportion test
    const p1 = controlVariant.conversionRate;
    const n1 = controlVariant.totalUsers;
    const p2 = bestTestVariant.conversionRate;
    const n2 = bestTestVariant.totalUsers;

    if (n1 < experiment.successCriteria.minimumSampleSize || 
        n2 < experiment.successCriteria.minimumSampleSize) {
      return {
        isSignificant: false,
        confidenceLevel: 0,
        pValue: 1,
        effect: ((p2 - p1) / p1) * 100,
        recommendedAction: 'continue',
      };
    }

    const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    const zScore = (p2 - p1) / se;
    
    // Calculate p-value (two-tailed test)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    
    const confidenceLevel = experiment.successCriteria.confidenceLevel;
    const alpha = (100 - confidenceLevel) / 100;
    const isSignificant = pValue < alpha;
    
    const effect = ((p2 - p1) / p1) * 100; // Percentage change
    const meetsMinimumEffect = Math.abs(effect) >= experiment.successCriteria.minimumDetectableEffect;

    let recommendedAction: 'continue' | 'stop' | 'extend' | 'inconclusive' = 'continue';
    if (isSignificant && meetsMinimumEffect) {
      recommendedAction = 'stop';
    } else if (!isSignificant && effect > 0) {
      recommendedAction = 'extend';
    } else if (effect < 0 && pValue < 0.1) {
      recommendedAction = 'stop';
    }

    return {
      isSignificant,
      confidenceLevel: (1 - pValue) * 100,
      pValue,
      effect,
      recommendedAction,
    };
  }

  /**
   * Cumulative distribution function for standard normal distribution
   */
  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Generate recommendations based on experiment results
   */
  private generateRecommendations(
    experiment: Experiment,
    variants: VariantAnalytics[],
    significance: StatisticalSignificance
  ): string[] {
    const recommendations: string[] = [];

    if (significance.recommendedAction === 'stop') {
      if (significance.effect > 0) {
        const winningVariant = variants.find(v => !v.isControl && v.conversionRate === Math.max(...variants.filter(v => !v.isControl).map(v => v.conversionRate)));
        recommendations.push(`Experiment shows significant improvement. Implement ${winningVariant?.variantName} variant.`);
      } else {
        recommendations.push('Experiment shows significant decrease. Stick with control variant.');
      }
    } else if (significance.recommendedAction === 'extend') {
      recommendations.push('Results are promising but not yet significant. Consider extending the experiment.');
    } else if (significance.recommendedAction === 'continue') {
      recommendations.push('Continue running the experiment to gather more data.');
    } else {
      recommendations.push('Results are inconclusive. Consider redesigning the experiment.');
    }

    // Sample size recommendations
    const minSampleSize = experiment.successCriteria.minimumSampleSize;
    const maxUsers = Math.max(...variants.map(v => v.totalUsers));
    if (maxUsers < minSampleSize) {
      const remaining = minSampleSize - maxUsers;
      recommendations.push(`Need ${remaining} more users per variant to reach minimum sample size.`);
    }

    return recommendations;
  }
}

export default ABTestingService; 