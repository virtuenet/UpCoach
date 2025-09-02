import { Model, Optional } from 'sequelize';
export interface SOC2AssessmentAttributes {
    id: string;
    assessmentId: string;
    title: string;
    description: string;
    assessmentType: 'internal' | 'external' | 'third_party';
    scope: string[];
    status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
    startDate: Date;
    endDate?: Date;
    assessor: string;
    riskRating: 'low' | 'medium' | 'high' | 'critical';
    findings: any[];
    recommendations: any[];
    nextReviewDate?: Date;
    evidence: any[];
    createdAt: Date;
    updatedAt: Date;
}
interface SOC2AssessmentCreationAttributes extends Optional<SOC2AssessmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class SOC2Assessment extends Model<SOC2AssessmentAttributes, SOC2AssessmentCreationAttributes> implements SOC2AssessmentAttributes {
    id: string;
    assessmentId: string;
    title: string;
    description: string;
    assessmentType: 'internal' | 'external' | 'third_party';
    scope: string[];
    status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
    startDate: Date;
    endDate?: Date;
    assessor: string;
    riskRating: 'low' | 'medium' | 'high' | 'critical';
    findings: any[];
    recommendations: any[];
    nextReviewDate?: Date;
    evidence: any[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export {};
//# sourceMappingURL=SOC2Assessment.d.ts.map