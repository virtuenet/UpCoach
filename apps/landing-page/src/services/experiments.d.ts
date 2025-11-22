export interface Experiment {
    id: string;
    name: string;
    description: string;
    variants: {
        id: string;
        name: string;
        weight: number;
    }[];
    status: 'draft' | 'running' | 'paused' | 'completed';
    startDate?: Date;
    endDate?: Date;
    targetAudience?: {
        newUsers?: boolean;
        returningUsers?: boolean;
        location?: string[];
        device?: ('mobile' | 'tablet' | 'desktop')[];
    };
}
export declare const experiments: Record<string, Experiment>;
export declare function getVariant(experimentId: string): string;
export declare function trackExperimentView(experimentId: string, variantId: string): void;
export declare function trackExperimentConversion(experimentId: string, conversionType: string, value?: number): void;
export declare function useExperiment(experimentId: string): {
    variant: string;
    trackConversion: (type: string, value?: number) => void;
};
export declare function getActiveExperiments(): Record<string, string>;
export declare function clearExperiments(): void;
export declare function markReturningUser(): void;
//# sourceMappingURL=experiments.d.ts.map