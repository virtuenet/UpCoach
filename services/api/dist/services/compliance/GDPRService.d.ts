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
    recordConsent(userId: string, purpose: ConsentPurpose, granted: boolean, ipAddress: string, userAgent: string): Promise<ConsentRecord>;
    getConsentStatus(userId: string): Promise<Record<ConsentPurpose, boolean>>;
    requestDataPortability(userId: string, format?: 'json' | 'csv' | 'xml'): Promise<DataPortabilityRequest>;
    private queueDataExport;
    private processDataExport;
    private collectUserData;
    private createExportFile;
    requestDeletion(userId: string, reason?: string, immediate?: boolean): Promise<DeletionRequest>;
    cancelDeletion(userId: string, requestId: string): Promise<boolean>;
    private processDeletion;
    reportDataBreach(incident: Omit<DataBreachIncident, 'id' | 'detectedAt'>): Promise<DataBreachIncident>;
    getDataRetentionPolicy(): Promise<any>;
    runDataRetentionCleanup(): Promise<void>;
    generatePrivacyPolicyData(): Promise<any>;
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