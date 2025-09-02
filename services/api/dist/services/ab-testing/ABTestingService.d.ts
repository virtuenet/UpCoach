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
export declare class ABTestingService {
    private static readonly HASH_SEED;
    /**
     * Get variant assignment for a user in an experiment
     */
    getVariant(userId: string, experimentId: string, context?: Record<string, any>): Promise<VariantAssignment | null>;
    /**
     * Track conversion event for experiment
     */
    trackConversion(userId: string, experimentId: string, eventType: string, eventValue?: number, properties?: Record<string, any>): Promise<boolean>;
    /**
     * Get experiment analytics
     */
    getExperimentAnalytics(experimentId: string): Promise<ExperimentAnalytics | null>;
    /**
     * Generate user hash for consistent assignment
     */
    private generateUserHash;
    /**
     * Check if user meets segmentation criteria
     */
    private meetsSegmentationCriteria;
    /**
     * Evaluate a single segmentation rule
     */
    private evaluateSegmentRule;
    /**
     * Get nested property from object
     */
    private getNestedProperty;
    /**
     * Calculate statistical significance using z-test for proportions
     */
    private calculateStatisticalSignificance;
    /**
     * Cumulative distribution function for standard normal distribution
     */
    private normalCDF;
    /**
     * Error function approximation
     */
    private erf;
    /**
     * Generate recommendations based on experiment results
     */
    private generateRecommendations;
}
export default ABTestingService;
//# sourceMappingURL=ABTestingService.d.ts.map