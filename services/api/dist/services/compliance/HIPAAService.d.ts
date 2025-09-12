export interface PHIAccessLog {
    id: string;
    userId: string;
    accessedBy: string;
    patientId: string;
    action: 'view' | 'create' | 'update' | 'delete' | 'export' | 'share';
    resource: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    justification?: string;
    authorized: boolean;
    sessionId: string;
}
export interface PHIEncryption {
    algorithm: 'AES-256-GCM' | 'AES-256-CBC';
    keyId: string;
    iv: string;
    authTag?: string;
    encryptedAt: Date;
}
export interface BusinessAssociateAgreement {
    id: string;
    organizationName: string;
    contactEmail: string;
    signedAt: Date;
    expiresAt: Date;
    status: 'active' | 'expired' | 'terminated';
    permissions: string[];
    restrictions: string[];
}
export interface PHIDisclosure {
    id: string;
    patientId: string;
    disclosedTo: string;
    purpose: string;
    dataTypes: string[];
    disclosedAt: Date;
    authorizedBy: string;
    legalBasis: string;
    expiresAt?: Date;
}
export interface SecurityRiskAssessment {
    id: string;
    assessmentDate: Date;
    conductedBy: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    vulnerabilities: Array<{
        type: string;
        severity: string;
        mitigation: string;
        status: 'identified' | 'mitigated' | 'accepted';
    }>;
    nextAssessmentDate: Date;
}
export interface PHIBreachNotification {
    id: string;
    discoveredAt: Date;
    reportedAt: Date;
    affectedRecords: number;
    breachType: string;
    description: string;
    containmentMeasures: string[];
    notificationsSent: {
        patients: boolean;
        hhs: boolean;
        media: boolean;
    };
    investigationStatus: 'ongoing' | 'completed';
}
declare class HIPAAService {
    private static instance;
    private readonly encryptionAlgorithm;
    private readonly sessionTimeout;
    private readonly maxLoginAttempts;
    private readonly auditRetentionYears;
    private encryptionKey;
    private constructor();
    static getInstance(): HIPAAService;
    encryptPHI(data: string): {
        encrypted: string;
        encryption: PHIEncryption;
    };
    decryptPHI(encryptedData: string, encryption: PHIEncryption): string;
    logPHIAccess(accessLog: Omit<PHIAccessLog, 'id' | 'timestamp'>): Promise<PHIAccessLog>;
    validatePassword(password: string): {
        valid: boolean;
        errors: string[];
    };
    createSecureSession(userId: string, ipAddress: string, userAgent: string): Promise<{
        sessionId: string;
        expiresAt: Date;
    }>;
    validateSession(sessionId: string): Promise<{
        valid: boolean;
        userId?: string;
        renewed?: boolean;
    }>;
    terminateSession(sessionId: string): Promise<void>;
    recordBAA(agreement: Omit<BusinessAssociateAgreement, 'id' | 'signedAt' | 'status'>): Promise<BusinessAssociateAgreement>;
    recordDisclosure(disclosure: Omit<PHIDisclosure, 'id' | 'disclosedAt'>): Promise<PHIDisclosure>;
    getDisclosureHistory(patientId: string, startDate?: Date, endDate?: Date): Promise<PHIDisclosure[]>;
    conductRiskAssessment(conductedBy: string): Promise<SecurityRiskAssessment>;
    reportPHIBreach(breach: Omit<PHIBreachNotification, 'id' | 'discoveredAt' | 'reportedAt'>): Promise<PHIBreachNotification>;
    generateComplianceReport(): Promise<any>;
    checkMinimumNecessary(userId: string, patientId: string, requestedData: string[]): Promise<{
        allowed: string[];
        denied: string[];
    }>;
    deidentifyPHI(data: any): any;
    private hashIP;
    private detectSuspiciousAccess;
    private identifyVulnerabilities;
    private getLatestRiskAssessment;
    private getTrainingStatus;
    private getAccessControlStatus;
    private getIncidentResponsePlan;
    private getRecentBreaches;
    private getUpcomingAudits;
    private getBAAStatus;
    private isAccessAllowed;
}
export declare const hipaaService: HIPAAService;
export {};
//# sourceMappingURL=HIPAAService.d.ts.map