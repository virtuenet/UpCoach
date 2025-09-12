import { User } from '../../models/User';
import { FinancialReport } from '../../models';
export interface EmailOptions {
    to: string | string[];
    subject: string;
    template?: string;
    data?: any;
    html?: string;
    text?: string;
    attachments?: any[];
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string;
    priority?: 'low' | 'normal' | 'high';
}
export interface EmailCampaign {
    name: string;
    subject: string;
    template: string;
    recipients: string[];
    data?: any;
    scheduledFor?: Date;
    tags?: string[];
}
export interface EmailMetrics {
    sent: number;
    failed: number;
    opened: number;
    clicked: number;
    bounced: number;
}
export declare class UnifiedEmailService {
    private transporter;
    private templateCache;
    private metrics;
    private queuedEmails;
    private isProcessing;
    private cache;
    private queueProcessInterval?;
    constructor();
    private initializeTransporter;
    private registerHelpers;
    private loadTemplate;
    send(options: EmailOptions): Promise<boolean>;
    queue(options: EmailOptions): Promise<void>;
    private processQueue;
    private startQueueProcessor;
    sendWelcomeEmail(user: User): Promise<boolean>;
    sendPasswordResetEmail(user: User, resetToken: string): Promise<boolean>;
    sendFinancialAlert(alert: {
        to: string[];
        subject: string;
        alerts: any[];
        priority?: 'low' | 'normal' | 'high';
    }): Promise<boolean>;
    sendFinancialReport(report: {
        to: string[];
        subject: string;
        report: FinancialReport;
        attachments?: string[];
    }): Promise<boolean>;
    sendCampaign(campaign: EmailCampaign): Promise<{
        successful: number;
        failed: number;
    }>;
    sendAutomatedEmail(trigger: string, userId: number, data?: any): Promise<boolean>;
    private getAutomatedSubject;
    private htmlToText;
    private generateTrackingId;
    private isTemporaryFailure;
    trackOpen(trackingId: string): Promise<void>;
    trackClick(trackingId: string, url: string): Promise<void>;
    getMetrics(): EmailMetrics;
    clearTemplateCache(): void;
    testConnection(): Promise<boolean>;
    shutdown(): Promise<void>;
}
export declare const emailService: UnifiedEmailService;
export default emailService;
//# sourceMappingURL=UnifiedEmailService.d.ts.map