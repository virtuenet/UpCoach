import { Model, Optional } from 'sequelize';
export interface SOC2IncidentAttributes {
    id: string;
    incidentId: string;
    title: string;
    description: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'investigating' | 'resolved' | 'closed';
    reportedBy: string;
    assignedTo?: string;
    reportedDate: Date;
    detectedDate?: Date;
    resolvedDate?: Date;
    targetResolutionDate?: Date;
    impactAssessment: any;
    rootCause?: string;
    remediationActions: any[];
    lessons?: string;
    impactLevel: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
    affectedSystems: string[];
    communicationLog: any[];
    createdAt: Date;
    updatedAt: Date;
}
interface SOC2IncidentCreationAttributes extends Optional<SOC2IncidentAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class SOC2Incident extends Model<SOC2IncidentAttributes, SOC2IncidentCreationAttributes> implements SOC2IncidentAttributes {
    id: string;
    incidentId: string;
    title: string;
    description: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'investigating' | 'resolved' | 'closed';
    reportedBy: string;
    assignedTo?: string;
    reportedDate: Date;
    detectedDate?: Date;
    resolvedDate?: Date;
    targetResolutionDate?: Date;
    impactAssessment: any;
    rootCause?: string;
    remediationActions: any[];
    lessons?: string;
    impactLevel: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
    affectedSystems: string[];
    communicationLog: any[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export {};
//# sourceMappingURL=SOC2Incident.d.ts.map