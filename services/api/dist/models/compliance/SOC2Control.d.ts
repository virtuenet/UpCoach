import { Model, Optional } from 'sequelize';
export interface SOC2ControlAttributes {
    id: string;
    controlId: string;
    criteria: string;
    category: string;
    description: string;
    implementation: string;
    status: 'draft' | 'implemented' | 'testing' | 'active' | 'remediation_required';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    owner: string;
    reviewDate: Date;
    nextReviewDate: Date;
    testingFrequency: string;
    testing?: {
        lastTestDate?: Date;
        testResult?: string;
        testEvidence?: string;
        testNotes?: string;
    };
    remediationRequired: boolean;
    findings?: any[];
    evidence?: any[];
    createdAt: Date;
    updatedAt: Date;
}
interface SOC2ControlCreationAttributes extends Optional<SOC2ControlAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class SOC2Control extends Model<SOC2ControlAttributes, SOC2ControlCreationAttributes> implements SOC2ControlAttributes {
    id: string;
    controlId: string;
    criteria: string;
    category: string;
    description: string;
    implementation: string;
    status: 'draft' | 'implemented' | 'testing' | 'active' | 'remediation_required';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    owner: string;
    reviewDate: Date;
    nextReviewDate: Date;
    testingFrequency: string;
    testing?: {
        lastTestDate?: Date;
        testResult?: string;
        testEvidence?: string;
        testNotes?: string;
    };
    remediationRequired: boolean;
    findings?: any[];
    evidence?: any[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export {};
//# sourceMappingURL=SOC2Control.d.ts.map