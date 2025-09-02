/**
 * Unified Email Service - Combines all email functionality
 * Merges EmailService.ts, email/EmailService.ts, and EmailAutomationService.ts
 */
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
    /**
     * Load and compile email template
     */
    private loadTemplate;
    /**
     * Send an email
     */
    send(options: EmailOptions): Promise<boolean>;
    /**
     * Send email to queue for batch processing
     */
    queue(options: EmailOptions): Promise<void>;
    /**
     * Process queued emails
     */
    private processQueue;
    /**
     * Start queue processor interval
     */
    private startQueueProcessor;
    /**
     * Send welcome email
     */
    sendWelcomeEmail(user: User): Promise<boolean>;
    /**
     * Send password reset email
     */
    sendPasswordResetEmail(user: User, resetToken: string): Promise<boolean>;
    /**
     * Send financial alert email
     */
    sendFinancialAlert(alert: {
        to: string[];
        subject: string;
        alerts: any[];
        priority?: 'low' | 'normal' | 'high';
    }): Promise<boolean>;
    /**
     * Send financial report email
     */
    sendFinancialReport(report: {
        to: string[];
        subject: string;
        report: FinancialReport;
        attachments?: string[];
    }): Promise<boolean>;
    /**
     * Send campaign email to multiple recipients
     */
    sendCampaign(campaign: EmailCampaign): Promise<{
        successful: number;
        failed: number;
    }>;
    /**
     * Send automated email based on trigger
     */
    sendAutomatedEmail(trigger: string, userId: number, data?: any): Promise<boolean>;
    /**
     * Get automated email subject based on trigger
     */
    private getAutomatedSubject;
    /**
     * Convert HTML to plain text
     */
    private htmlToText;
    /**
     * Generate secure tracking ID for email
     */
    private generateTrackingId;
    /**
     * Check if error is temporary
     */
    private isTemporaryFailure;
    /**
     * Track email open securely
     */
    trackOpen(trackingId: string): Promise<void>;
    /**
     * Track email click securely
     */
    trackClick(trackingId: string, url: string): Promise<void>;
    /**
     * Get email metrics
     */
    getMetrics(): EmailMetrics;
    /**
     * Clear template cache
     */
    clearTemplateCache(): void;
    /**
     * Test email configuration
     */
    testConnection(): Promise<boolean>;
    /**
     * Gracefully shutdown the service
     */
    shutdown(): Promise<void>;
}
export declare const emailService: UnifiedEmailService;
export default emailService;
//# sourceMappingURL=UnifiedEmailService.d.ts.map