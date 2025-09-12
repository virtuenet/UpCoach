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
export interface IEmailService {
    send<T extends keyof EmailTemplateMap = never>(options: T extends never ? EmailOptions : EmailOptions & {
        template: T;
        data: EmailTemplateMap[T];
    }): Promise<boolean>;
    sendWithProgress<T extends keyof EmailTemplateMap = never>(options: T extends never ? EmailOptions : EmailOptions & {
        template: T;
        data: EmailTemplateMap[T];
    }): Promise<EmailProgress>;
    queue<T extends keyof EmailTemplateMap = never>(options: T extends never ? EmailOptions : EmailOptions & {
        template: T;
        data: EmailTemplateMap[T];
    }): Promise<void>;
    queueBulk(emails: EmailOptions[]): Promise<void>;
    getMetrics(): EmailMetrics;
    createCampaign(campaign: EmailCampaign): Promise<string>;
    cancelCampaign(campaignId: string): Promise<boolean>;
    getCampaignStatus(campaignId: string): Promise<EmailCampaign | null>;
    verifyConfiguration(): Promise<boolean>;
    sendTest(to: string): Promise<boolean>;
    processQueue(): Promise<void>;
    retryFailed(): Promise<number>;
    clearQueue(): Promise<void>;
    gracefulShutdown(): Promise<void>;
}
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
export interface IEmailRetryStrategy {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier?: number;
    maxDelay?: number;
    getDelay(attempt: number): number;
    shouldRetry(error: Error, attempt: number): boolean;
}
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