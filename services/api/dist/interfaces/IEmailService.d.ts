/**
 * Email service interfaces and types
 */
export interface EmailOptions {
    to: string | string[];
    subject: string;
    template?: string;
    data?: any;
    html?: string;
    text?: string;
    attachments?: EmailAttachment[];
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string;
    priority?: 'low' | 'normal' | 'high';
}
export interface EmailAttachment {
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
}
export interface EmailProgress {
    status: 'queued' | 'sending' | 'sent' | 'failed';
    progress: number;
    message: string;
    timestamp: Date;
    retryCount?: number;
    error?: string;
}
export interface EmailMetrics {
    sent: number;
    failed: number;
    opened: number;
    clicked: number;
    bounced: number;
    queued: number;
    averageDeliveryTime?: number;
    lastSentAt?: Date;
    lastFailedAt?: Date;
}
export interface EmailCampaign {
    id?: string;
    name: string;
    subject: string;
    template: string;
    recipients: string[];
    data?: any;
    scheduledFor?: Date;
    tags?: string[];
    status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
    metrics?: Partial<EmailMetrics>;
}
/**
 * Email template type definitions
 */
export type EmailTemplateMap = {
    welcome: {
        name: string;
        activationUrl: string;
        expiresIn: string;
    };
    passwordReset: {
        name: string;
        resetUrl: string;
        expiresIn: string;
    };
    emailVerification: {
        name: string;
        verificationUrl: string;
    };
    bookingConfirmation: {
        userName: string;
        coachName: string;
        date: string;
        time: string;
        duration: string;
        sessionType: string;
        meetingUrl?: string;
    };
    bookingCancellation: {
        userName: string;
        coachName: string;
        date: string;
        reason: string;
        refundAmount?: number;
        cancellationFee?: number;
    };
    bookingReminder: {
        userName: string;
        coachName: string;
        date: string;
        time: string;
        meetingUrl: string;
        hoursUntil: number;
    };
    paymentSuccessful: {
        userName: string;
        amount: number;
        currency: string;
        description: string;
        invoiceUrl?: string;
    };
    paymentFailed: {
        userName: string;
        amount: number;
        reason: string;
        retryUrl: string;
    };
    subscriptionRenewal: {
        userName: string;
        planName: string;
        amount: number;
        renewalDate: string;
    };
    teamInvitation: {
        organizationName: string;
        inviterName: string;
        invitationToken: string;
        expiresIn: string;
    };
    notification: {
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message: string;
        actions?: Array<{
            label: string;
            url: string;
        }>;
    };
    weeklyReport: {
        userName: string;
        weekStart: string;
        weekEnd: string;
        metrics: any;
        insights: string[];
    };
    monthlyReport: {
        userName: string;
        month: string;
        year: string;
        metrics: any;
        achievements: string[];
    };
};
/**
 * Main email service interface
 */
export interface IEmailService {
    /**
     * Send an email immediately
     */
    send<T extends keyof EmailTemplateMap = never>(options: T extends never ? EmailOptions : EmailOptions & {
        template: T;
        data: EmailTemplateMap[T];
    }): Promise<boolean>;
    /**
     * Send an email with progress tracking
     */
    sendWithProgress<T extends keyof EmailTemplateMap = never>(options: T extends never ? EmailOptions : EmailOptions & {
        template: T;
        data: EmailTemplateMap[T];
    }): Promise<EmailProgress>;
    /**
     * Queue an email for later sending
     */
    queue<T extends keyof EmailTemplateMap = never>(options: T extends never ? EmailOptions : EmailOptions & {
        template: T;
        data: EmailTemplateMap[T];
    }): Promise<void>;
    /**
     * Queue multiple emails
     */
    queueBulk(emails: EmailOptions[]): Promise<void>;
    /**
     * Get email service metrics
     */
    getMetrics(): EmailMetrics;
    /**
     * Create and schedule an email campaign
     */
    createCampaign(campaign: EmailCampaign): Promise<string>;
    /**
     * Cancel a scheduled campaign
     */
    cancelCampaign(campaignId: string): Promise<boolean>;
    /**
     * Get campaign status
     */
    getCampaignStatus(campaignId: string): Promise<EmailCampaign | null>;
    /**
     * Verify email configuration
     */
    verifyConfiguration(): Promise<boolean>;
    /**
     * Send a test email
     */
    sendTest(to: string): Promise<boolean>;
    /**
     * Process queued emails
     */
    processQueue(): Promise<void>;
    /**
     * Retry failed emails
     */
    retryFailed(): Promise<number>;
    /**
     * Clear the email queue
     */
    clearQueue(): Promise<void>;
    /**
     * Gracefully shutdown the service
     */
    gracefulShutdown(): Promise<void>;
}
/**
 * Email service events
 */
export interface IEmailServiceEvents {
    'email:sent': (options: EmailOptions) => void;
    'email:failed': (options: EmailOptions, error: Error) => void;
    'email:queued': (options: EmailOptions) => void;
    'email:retry': (options: EmailOptions, attempt: number) => void;
    'campaign:started': (campaign: EmailCampaign) => void;
    'campaign:completed': (campaign: EmailCampaign) => void;
    'campaign:failed': (campaign: EmailCampaign, error: Error) => void;
    'metrics:updated': (metrics: EmailMetrics) => void;
}
/**
 * Email retry strategy
 */
export interface IEmailRetryStrategy {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier?: number;
    maxDelay?: number;
    /**
     * Calculate delay for next retry
     */
    getDelay(attempt: number): number;
    /**
     * Determine if should retry based on error
     */
    shouldRetry(error: Error, attempt: number): boolean;
}
/**
 * Default retry strategy implementation
 */
export declare class ExponentialBackoffRetryStrategy implements IEmailRetryStrategy {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
    maxDelay: number;
    constructor(maxRetries?: number, retryDelay?: number, backoffMultiplier?: number, maxDelay?: number);
    getDelay(attempt: number): number;
    shouldRetry(error: Error, attempt: number): boolean;
}
//# sourceMappingURL=IEmailService.d.ts.map