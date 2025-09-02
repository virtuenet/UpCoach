/**
 * GDPR Compliance Service
 * Implements GDPR requirements for data protection and privacy
 */
export interface ConsentRecord {
    userId: string;
    purpose: ConsentPurpose;
    granted: boolean;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    version: string;
    expiresAt?: Date;
}
export declare enum ConsentPurpose {
    MARKETING = "marketing",
    ANALYTICS = "analytics",
    FUNCTIONAL = "functional",
    NECESSARY = "necessary",
    PERFORMANCE = "performance",
    TARGETING = "targeting",
    SOCIAL_MEDIA = "social_media",
    EMAIL_COMMUNICATIONS = "email_communications",
    DATA_PROCESSING = "data_processing",
    THIRD_PARTY_SHARING = "third_party_sharing"
}
export interface DataPortabilityRequest {
    id: string;
    userId: string;
    requestedAt: Date;
    completedAt?: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    downloadUrl?: string;
    expiresAt?: Date;
    format: 'json' | 'csv' | 'xml';
}
export interface DeletionRequest {
    id: string;
    userId: string;
    requestedAt: Date;
    scheduledFor: Date;
    completedAt?: Date;
    status: 'pending' | 'scheduled' | 'processing' | 'completed' | 'cancelled';
    reason?: string;
    retainData?: string[];
}
export interface DataBreachIncident {
    id: string;
    detectedAt: Date;
    reportedAt?: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedUsers: string[];
    dataTypes: string[];
    description: string;
    containmentActions: string[];
    notificationsSent: boolean;
    regulatorNotified: boolean;
}
declare class GDPRService {
    private static instance;
    private readonly consentVersion;
    private readonly dataRetentionDays;
    private readonly deletionGracePeriod;
    private constructor();
    static getInstance(): GDPRService;
    /**
     * Record user consent
     */
    recordConsent(userId: string, purpose: ConsentPurpose, granted: boolean, ipAddress: string, userAgent: string): Promise<ConsentRecord>;
    /**
     * Get user's consent status
     */
    getConsentStatus(userId: string): Promise<Record<ConsentPurpose, boolean>>;
    /**
     * Request data portability (Right to Data Portability)
     */
    requestDataPortability(userId: string, format?: 'json' | 'csv' | 'xml'): Promise<DataPortabilityRequest>;
    /**
     * Process data export
     */
    private queueDataExport;
    /**
     * Export user data
     */
    private processDataExport;
    /**
     * Collect all user data for export
     */
    private collectUserData;
    /**
     * Create export file in requested format
     */
    private createExportFile;
    /**
     * Request account deletion (Right to Erasure)
     */
    requestDeletion(userId: string, reason?: string, immediate?: boolean): Promise<DeletionRequest>;
    /**
     * Cancel deletion request
     */
    cancelDeletion(userId: string, requestId: string): Promise<boolean>;
    /**
     * Process account deletion
     */
    private processDeletion;
    /**
     * Report data breach
     */
    reportDataBreach(incident: Omit<DataBreachIncident, 'id' | 'detectedAt'>): Promise<DataBreachIncident>;
    /**
     * Get data retention policy
     */
    getDataRetentionPolicy(): Promise<any>;
    /**
     * Automated data retention cleanup
     */
    runDataRetentionCleanup(): Promise<void>;
    /**
     * Generate privacy policy data
     */
    generatePrivacyPolicyData(): Promise<any>;
    /**
     * Helper methods
     */
    private hashIP;
    private onConsentGranted;
    private onConsentRevoked;
    private checkLegalRetentionRequirements;
    private anonymizeUserContent;
    private clearUserCache;
    private logDeletion;
    private notifyDataProtectionAuthority;
    private notifyAffectedUsers;
    private sendDeletionConfirmation;
    private notifyDataExportReady;
    private generateSecureDownloadUrl;
    private encryptFile;
    private createCSVExport;
    private jsonToXML;
    private cleanupCategoryData;
}
export declare const gdprService: GDPRService;
export {};
//# sourceMappingURL=GDPRService.d.ts.map