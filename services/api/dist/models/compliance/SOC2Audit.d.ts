import { Model, Optional } from 'sequelize';
export interface SOC2AuditAttributes {
    id: string;
    auditId: string;
    auditType: 'type1' | 'type2';
    period: {
        startDate: Date;
        endDate: Date;
    };
    auditor: string;
    status: 'planned' | 'in_progress' | 'completed' | 'issued';
    scope: string[];
    findings: any[];
    recommendations: any[];
    reviewDate?: Date;
    findingsCount: number;
    inappropriateAccess: boolean;
    reportUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
interface SOC2AuditCreationAttributes extends Optional<SOC2AuditAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class SOC2Audit extends Model<SOC2AuditAttributes, SOC2AuditCreationAttributes> implements SOC2AuditAttributes {
    id: string;
    auditId: string;
    auditType: 'type1' | 'type2';
    period: {
        startDate: Date;
        endDate: Date;
    };
    auditor: string;
    status: 'planned' | 'in_progress' | 'completed' | 'issued';
    scope: string[];
    findings: any[];
    recommendations: any[];
    reviewDate?: Date;
    findingsCount: number;
    inappropriateAccess: boolean;
    reportUrl?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export {};
//# sourceMappingURL=SOC2Audit.d.ts.map