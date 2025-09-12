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
    getVariant(userId: string, experimentId: string, context?: Record<string, any>): Promise<VariantAssignment | null>;
    trackConversion(userId: string, experimentId: string, eventType: string, eventValue?: number, properties?: Record<string, any>): Promise<boolean>;
    getExperimentAnalytics(experimentId: string): Promise<ExperimentAnalytics | null>;
    private generateUserHash;
    private meetsSegmentationCriteria;
    private evaluateSegmentRule;
    private getNestedProperty;
    private calculateStatisticalSignificance;
    private normalCDF;
    private erf;
    private generateRecommendations;
}
export default ABTestingService;
//# sourceMappingURL=ABTestingService.d.ts.map