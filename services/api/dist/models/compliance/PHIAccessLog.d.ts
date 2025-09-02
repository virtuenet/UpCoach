import { Model, Optional } from 'sequelize';
export interface PHIAccessLogAttributes {
    id: string;
    userId: string;
    accessedBy: string;
    phiType: string;
    action: 'view' | 'create' | 'update' | 'delete' | 'export';
    accessReason: string;
    ipAddress: string;
    userAgent: string;
    sessionId?: string;
    dataFields?: string[];
    expiresAt?: Date;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    complianceFlags?: string[];
    auditTrail: any;
    createdAt: Date;
    updatedAt: Date;
}
interface PHIAccessLogCreationAttributes extends Optional<PHIAccessLogAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class PHIAccessLog extends Model<PHIAccessLogAttributes, PHIAccessLogCreationAttributes> implements PHIAccessLogAttributes {
    id: string;
    userId: string;
    accessedBy: string;
    phiType: string;
    action: 'view' | 'create' | 'update' | 'delete' | 'export';
    accessReason: string;
    ipAddress: string;
    userAgent: string;
    sessionId?: string;
    dataFields?: string[];
    expiresAt?: Date;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    complianceFlags?: string[];
    auditTrail: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export {};
//# sourceMappingURL=PHIAccessLog.d.ts.map