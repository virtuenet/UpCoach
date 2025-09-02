/**
 * SOC2 Compliance Service
 * Implements SOC2 Trust Service Criteria monitoring and reporting
 */
import { SOC2Control } from '../../models/compliance';
export declare enum TrustServiceCriteria {
    SECURITY = "security",
    AVAILABILITY = "availability",
    PROCESSING_INTEGRITY = "processing_integrity",
    CONFIDENTIALITY = "confidentiality",
    PRIVACY = "privacy"
}
export interface SystemAvailability {
    id: string;
    timestamp: Date;
    service: string;
    uptime: number;
    downtime: number;
    incidents: number;
    slaTarget: number;
    slaMet: boolean;
    month: string;
    year: number;
}
export interface ChangeManagement {
    id: string;
    changeId: string;
    requestedBy: string;
    approvedBy: string;
    implementedBy: string;
    type: 'infrastructure' | 'application' | 'security' | 'process';
    description: string;
    riskAssessment: string;
    testingRequired: boolean;
    testingCompleted: boolean;
    rollbackPlan: string;
    implementedAt: Date;
    status: 'pending' | 'approved' | 'implemented' | 'rolled_back';
    impactLevel: 'low' | 'medium' | 'high';
}
export interface VulnerabilityManagement {
    id: string;
    vulnerabilityId: string;
    discoveredAt: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    cvssScore?: number;
    affectedSystems: string[];
    description: string;
    remediation: string;
    status: 'open' | 'in_progress' | 'mitigated' | 'accepted';
    targetResolutionDate: Date;
    actualResolutionDate?: Date;
    assignedTo: string;
}
export interface AccessReview {
    id: string;
    reviewDate: Date;
    reviewedBy: string;
    scope: string;
    usersReviewed: number;
    privilegedAccountsReviewed: number;
    inappropriateAccess: Array<{
        userId: string;
        access: string;
        action: 'revoked' | 'modified' | 'retained';
    }>;
    findingsCount: number;
    nextReviewDate: Date;
}
export interface IncidentManagement {
    id: string;
    incidentId: string;
    reportedAt: Date;
    reportedBy: string;
    type: 'security' | 'availability' | 'integrity' | 'confidentiality' | 'privacy';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: string;
    rootCause?: string;
    containmentActions: string[];
    resolutionActions: string[];
    lessonsLearned?: string;
    resolvedAt?: Date;
    status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
}
export interface DataClassification {
    id: string;
    dataType: string;
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
    owner: string;
    location: string[];
    encryptionRequired: boolean;
    encryptionImplemented: boolean;
    retentionPeriod: string;
    disposalMethod: string;
    lastReviewDate: Date;
    nextReviewDate: Date;
}
export interface VendorManagement {
    id: string;
    vendorName: string;
    serviceProvided: string;
    riskRating: 'low' | 'medium' | 'high';
    dueDiligenceCompleted: boolean;
    contractStartDate: Date;
    contractEndDate: Date;
    slasDefined: boolean;
    securityReviewDate: Date;
    nextReviewDate: Date;
    dataShared: string[];
    subprocessors: string[];
    incidents: number;
}
declare class SOC2Service {
    private static instance;
    private readonly controlReviewFrequencyDays;
    private readonly slaTarget;
    private constructor();
    static getInstance(): SOC2Service;
    /**
     * Initialize SOC2 controls
     */
    initializeControls(): Promise<void>;
    /**
     * Create or update a control
     */
    createOrUpdateControl(control: Partial<SOC2Control>): Promise<SOC2Control>;
    /**
     * Test a control
     */
    testControl(controlId: string, testedBy: string, result: 'pass' | 'fail' | 'partial', findings?: string, evidence?: string[]): Promise<SOC2Control>;
    /**
     * Record system availability metrics
     */
    recordAvailability(service: string, month: string, year: number, metrics: {
        uptime: number;
        downtime: number;
        incidents: number;
    }): Promise<SystemAvailability>;
    /**
     * Track change management
     */
    recordChange(change: Omit<ChangeManagement, 'id' | 'changeId'>): Promise<ChangeManagement>;
    /**
     * Track vulnerability management
     */
    recordVulnerability(vulnerability: Omit<VulnerabilityManagement, 'id' | 'vulnerabilityId'>): Promise<VulnerabilityManagement>;
    /**
     * Conduct access review
     */
    conductAccessReview(reviewedBy: string, scope: string): Promise<AccessReview>;
    /**
     * Record incident
     */
    recordIncident(incident: Omit<IncidentManagement, 'id' | 'incidentId' | 'reportedAt'>): Promise<IncidentManagement>;
    /**
     * Classify data
     */
    classifyData(classification: Omit<DataClassification, 'id' | 'lastReviewDate' | 'nextReviewDate'>): Promise<DataClassification>;
    /**
     * Manage vendor
     */
    recordVendor(vendor: Omit<VendorManagement, 'id'>): Promise<VendorManagement>;
    /**
     * Generate SOC2 compliance dashboard data
     */
    generateDashboard(): Promise<any>;
    /**
     * Generate SOC2 Type 2 report data
     */
    generateType2Report(startDate: Date, endDate: Date): Promise<any>;
    /**
     * Helper methods
     */
    private getDefaultControls;
    private getControlsStatus;
    private getAvailabilityMetrics;
    private getIncidentMetrics;
    private getVulnerabilityMetrics;
    private getChangeMetrics;
    private getVendorMetrics;
    private getAccessReviewMetrics;
    private calculateOverallCompliance;
    private getCriteriaStatus;
    private calculateAverageMTTR;
    private getUpcomingAudits;
    private getRecentFindings;
    private getInfrastructureDescription;
    private getSoftwareDescription;
    private getPeopleDescription;
    private getDataDescription;
    private getProcessDescription;
    private getControlsTestingResults;
    private getCommonCriteria;
    private getExceptions;
    private getManagementResponse;
    private generateAuditOpinion;
}
export declare const soc2Service: SOC2Service;
export {};
//# sourceMappingURL=SOC2Service.d.ts.map