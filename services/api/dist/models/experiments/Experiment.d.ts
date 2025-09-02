import { Model, Optional } from 'sequelize';
export interface ExperimentAttributes {
    id: string;
    name: string;
    description: string;
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
    variants: ExperimentVariant[];
    trafficAllocation: number;
    startDate: Date;
    endDate?: Date;
    targetMetric: string;
    successCriteria: SuccessCriteria;
    segmentation?: SegmentationRules;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ExperimentVariant {
    id: string;
    name: string;
    description: string;
    allocation: number;
    configuration: Record<string, any>;
    isControl: boolean;
}
export interface SuccessCriteria {
    primaryMetric: string;
    minimumDetectableEffect: number;
    confidenceLevel: number;
    statisticalPower: number;
    minimumSampleSize: number;
}
export interface SegmentationRules {
    includeRules: SegmentRule[];
    excludeRules: SegmentRule[];
}
export interface SegmentRule {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
    value: any;
}
interface ExperimentCreationAttributes extends Optional<ExperimentAttributes, 'id' | 'createdAt' | 'updatedAt' | 'endDate'> {
}
declare class Experiment extends Model<ExperimentAttributes, ExperimentCreationAttributes> implements ExperimentAttributes {
    id: string;
    name: string;
    description: string;
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
    variants: ExperimentVariant[];
    trafficAllocation: number;
    startDate: Date;
    endDate?: Date;
    targetMetric: string;
    successCriteria: SuccessCriteria;
    segmentation?: SegmentationRules;
    createdBy: string;
    updatedBy: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    isActive(): boolean;
    getVariantByAllocation(hash: number): ExperimentVariant | null;
    validateVariantAllocations(): boolean;
}
export { Experiment };
//# sourceMappingURL=Experiment.d.ts.map