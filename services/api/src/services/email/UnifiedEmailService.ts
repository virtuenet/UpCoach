/**
 * Unified Email Service - Combines all email functionality
 * Merges EmailService.ts, email/EmailService.ts, and EmailAutomationService.ts
 */

import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

import handlebars from 'handlebars';
import { createTransport, Transporter } from 'nodemailer';


import { FinancialReport } from '../../models';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';
import { UnifiedCacheService, getCacheService } from '../cache/UnifiedCacheService';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  data?: unknown;
  html?: string;
  text?: string;
  attachments?: unknown[];
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
  data?: unknown;
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

export class UnifiedEmailService {
  private transporter!: Transporter;
  private templateCache: Map<string, handlebars.TemplateDelegate> = new Map();
  private metrics: EmailMetrics = {
    sent: 0,
    failed: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
  };
  private queuedEmails: EmailOptions[] = [];
  private isProcessing = false;
  private cache: UnifiedCacheService;
  private queueProcessInterval?: NodeJS.Timeout;

  constructor() {
    this.cache = getCacheService();
    this.initializeTransporter();
    this.registerHelpers();
    this.startQueueProcessor();
  }

  private initializeTransporter() {
    const config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    this.transporter = createTransport(config);

    // Verify connection
    this.transporter.verify(error => {
      if (error) {
        logger.error('Email service initialization failed:', error);
      } else {
        logger.info('Email service ready');
      }
    });
  }

  private registerHelpers() {
    // Date formatting
    handlebars.registerHelper('formatDate', (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    // Currency formatting
    handlebars.registerHelper('formatCurrency', (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    });

    // Percentage formatting
    handlebars.registerHelper('formatPercent', (value: number) => {
      return `${(value * 100).toFixed(2)}%`;
    });

    // Conditional helpers
    handlebars.registerHelper('ifEquals', function (this: unknown, arg1: unknown, arg2: unknown, options: unknown) {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    });

    handlebars.registerHelper(
      'ifGreaterThan',
      function (this: unknown, arg1: number, arg2: number, options: unknown) {
        return arg1 > arg2 ? options.fn(this) : options.inverse(this);
      }
    );
  }

  /**
   * Load and compile email template
   */
  private async loadTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
    // Check cache
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      const templatePath = path.join(__dirname, '../../templates/emails', `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const compiled = handlebars.compile(templateContent);

      // Cache compiled template
      this.templateCache.set(templateName, compiled);

      return compiled;
    } catch (error) {
      logger.error(`Failed to load email template ${templateName}:`, error);
      throw new Error(`Email template ${templateName} not found`);
    }
  }

  /**
   * Send an email
   */
  async send(options: EmailOptions): Promise<boolean> {
    try {
      let html = options.html;
      let text = options.text;

      // If template is provided, compile it
      if (options.template && options.data) {
        const template = await this.loadTemplate(options.template);
        html = template(options.data);

        // Generate text version from HTML if not provided
        if (!text) {
          text = this.htmlToText(html);
        }
      }

      // Add tracking pixel for open tracking
      if (html && process.env.EMAIL_TRACKING_ENABLED === 'true') {
        const trackingId = this.generateTrackingId(options.to);
        html += `<img src="${process.env.API_URL}/api/email/track/${trackingId}" width="1" height="1" />`;
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'UpCoach <noreply@upcoach.com>',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html,
        text,
        attachments: options.attachments,
        cc: options.cc,
        bcc: options.bcc,
        replyTo: options.replyTo,
        priority: options.priority,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.metrics.sent++;
      logger.info('Email sent successfully:', {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject,
      });

      return true;
    } catch (error) {
      this.metrics.failed++;
      logger.error('Failed to send email:', error);

      // Add to retry queue if it's a temporary failure
      if (this.isTemporaryFailure(error)) {
        this.queuedEmails.push(options);
      }

      return false;
    }
  }

  /**
   * Send email to queue for batch processing
   */
  async queue(options: EmailOptions): Promise<void> {
    this.queuedEmails.push(options);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process queued emails
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queuedEmails.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queuedEmails.length > 0) {
      const email = this.queuedEmails.shift()!;

      try {
        await this.send(email);

        // Rate limiting - wait between emails
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error('Failed to process queued email:', error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Start queue processor interval
   */
  private startQueueProcessor(): void {
    this.queueProcessInterval = setInterval(() => {
      if (this.queuedEmails.length > 0) {
        this.processQueue();
      }
    }, 30000); // Process every 30 seconds
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user: User): Promise<boolean> {
    return this.send({
      to: user.email,
      subject: 'Welcome to UpCoach!',
      template: 'welcome',
      data: {
        name: user.name,
        email: user.email,
        activationUrl: `${process.env.APP_URL}/activate/${user.id}`,
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user: User, resetToken: string): Promise<boolean> {
    return this.send({
      to: user.email,
      subject: 'Reset Your Password',
      template: 'password-reset',
      data: {
        name: user.name,
        resetUrl: `${process.env.APP_URL}/reset-password/${resetToken}`,
        expiresIn: '1 hour',
      },
      priority: 'high',
    });
  }

  /**
   * Send financial alert email
   */
  async sendFinancialAlert(alert: {
    to: string[];
    subject: string;
    alerts: unknown[];
    priority?: 'low' | 'normal' | 'high';
  }): Promise<boolean> {
    const priorityColors = {
      low: '#4CAF50',
      normal: '#FF9800',
      high: '#F44336',
    };

    return this.send({
      to: alert.to,
      subject: alert.subject,
      template: 'financial-alert',
      data: {
        alerts: alert.alerts,
        priority: alert.priority || 'normal',
        priorityColor: priorityColors[alert.priority || 'normal'],
        timestamp: new Date(),
      },
      priority: alert.priority,
    });
  }

  /**
   * Send financial report email
   */
  async sendFinancialReport(report: {
    to: string[];
    subject: string;
    report: FinancialReport;
    attachments?: string[];
  }): Promise<boolean> {
    return this.send({
      to: report.to,
      subject: report.subject,
      template: 'financial-report',
      data: {
        report: report.report,
        generatedAt: new Date(),
      },
      attachments: report.attachments?.map(filepath => ({
        filename: path.basename(filepath),
        path: filepath,
      })),
    });
  }

  /**
   * Send campaign email to multiple recipients
   */
  async sendCampaign(campaign: EmailCampaign): Promise<{
    successful: number;
    failed: number;
  }> {
    let successful = 0;
    let failed = 0;

    // Cache campaign data for performance
    const cacheKey = `campaign:${campaign.name}`;
    await this.cache.set(cacheKey, campaign, { ttl: 3600 });

    // Process in batches
    const batchSize = 50;
    for (let i = 0; i < campaign.recipients.length; i += batchSize) {
      const batch = campaign.recipients.slice(i, i + batchSize);

      const promises = batch.map(recipient =>
        this.send({
          to: recipient,
          subject: campaign.subject,
          template: campaign.template,
          data: {
            ...campaign.data,
            recipientEmail: recipient,
            campaignName: campaign.name,
          },
        })
      );

      const results = await Promise.allSettled(promises);

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          successful++;
        } else {
          failed++;
        }
      });

      // Rate limiting between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info(`Campaign ${campaign.name} completed:`, {
      successful,
      failed,
      total: campaign.recipients.length,
    });

    return { successful, failed };
  }

  /**
   * Send automated email based on trigger
   */
  async sendAutomatedEmail(trigger: string, userId: number, data?: unknown): Promise<boolean> {
    // Map triggers to templates
    const triggerTemplates: Record<string, any> = {
      goal_completed: 'goal-completion',
      streak_milestone: 'streak-achievement',
      subscription_expired: 'subscription-reminder',
      weekly_summary: 'weekly-summary',
      inactivity_7days: 're-engagement',
    };

    const template = triggerTemplates[trigger];
    if (!template) {
      logger.warn(`No template found for trigger: ${trigger}`);
      return false;
    }

    // Get user data
    const user = await User.findByPk(userId);
    if (!user) {
      logger.error(`User not found: ${userId}`);
      return false;
    }

    return this.send({
      to: user.email,
      subject: this.getAutomatedSubject(trigger, data),
      template,
      data: {
        user,
        ...data,
      },
    });
  }

  /**
   * Get automated email subject based on trigger
   */
  private getAutomatedSubject(trigger: string, data?: unknown): string {
    const subjects: Record<string, any> = {
      goal_completed: `🎉 Congratulations! You've completed your goal`,
      streak_milestone: `🔥 Amazing! ${data?.days || 0} day streak`,
      subscription_expired: 'Your UpCoach subscription has expired',
      weekly_summary: 'Your Weekly UpCoach Summary',
      inactivity_7days: 'We miss you! Come back to UpCoach',
    };

    return subjects[trigger] || 'Update from UpCoach';
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace nbsp
      .replace(/&amp;/g, '&') // Replace amp
      .replace(/&lt;/g, '<') // Replace lt
      .replace(/&gt;/g, '>') // Replace gt
      .replace(/&quot;/g, '"') // Replace quot
      .replace(/&#39;/g, "'") // Replace apostrophe
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Generate secure tracking ID for email
   */
  private generateTrackingId(recipient: string | string[]): string {
    const recipientStr = Array.isArray(recipient) ? recipient[0] : recipient;
    const timestamp = Date.now();
    const secret = process.env.EMAIL_TRACKING_SECRET || crypto.randomBytes(32).toString('hex');

    // Create a cryptographically secure hash
    const hash = crypto
      .createHmac('sha256', secret)
      .update(`${recipientStr}:${timestamp}`)
      .digest('hex');

    // Store the mapping in cache for reverse lookup
    const trackingData = { email: recipientStr, timestamp, hash };
    this.cache.set(`email:tracking:${hash}`, trackingData, { ttl: 86400 }); // 24 hours TTL

    return hash;
  }

  /**
   * Check if error is temporary
   */
  private isTemporaryFailure(error: unknown): boolean {
    const temporaryErrors = ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'ENETUNREACH', 'EHOSTUNREACH'];

    return temporaryErrors.includes(error.code);
  }

  /**
   * Track email open securely
   */
  async trackOpen(trackingId: string): Promise<void> {
    try {
      // Validate tracking ID format (should be a hex string)
      if (!/^[a-f0-9]{64}$/i.test(trackingId)) {
        logger.warn('Invalid tracking ID format');
        return;
      }

      // Retrieve tracking data from cache
      const trackingData = await this.cache.get<{
        email: string;
        timestamp: number;
        hash: string;
      }>(`email:tracking:${trackingId}`);

      if (!trackingData) {
        logger.warn('Tracking ID not found or expired');
        return;
      }

      this.metrics.opened++;

      logger.info('Email opened:', {
        email: trackingData.email,
        timestamp: new Date(trackingData.timestamp),
      });
    } catch (error) {
      logger.error('Failed to track email open:', error);
    }
  }

  /**
   * Track email click securely
   */
  async trackClick(trackingId: string, url: string): Promise<void> {
    try {
      // Validate tracking ID format
      if (!/^[a-f0-9]{64}$/i.test(trackingId)) {
        logger.warn('Invalid tracking ID format');
        return;
      }

      // Validate URL to prevent open redirect vulnerabilities
      try {
        const urlObj = new URL(url);
        const allowedDomains = (process.env.ALLOWED_REDIRECT_DOMAINS || 'localhost,upcoach.ai')
          .split(',')
          .map(d => d.trim());

        if (!allowedDomains.some(domain => urlObj.hostname.endsWith(domain))) {
          logger.warn('Attempted redirect to unauthorized domain:', urlObj.hostname);
          return;
        }
      } catch (_urlError) {
        logger.warn('Invalid URL provided:', url);
        return;
      }

      // Retrieve tracking data from cache
      const trackingData = await this.cache.get<{
        email: string;
        timestamp: number;
        hash: string;
      }>(`email:tracking:${trackingId}`);

      if (!trackingData) {
        logger.warn('Tracking ID not found or expired');
        return;
      }

      this.metrics.clicked++;

      logger.info('Email link clicked:', {
        email: trackingData.email,
        url,
        timestamp: new Date(trackingData.timestamp),
      });
    } catch (error) {
      logger.error('Failed to track email click:', error);
    }
  }

  /**
   * Get email metrics
   */
  getMetrics(): EmailMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear template cache
   */
  clearTemplateCache(): void {
    this.templateCache.clear();
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('Email service test failed:', error);
      return false;
    }
  }

  /**
   * Gracefully shutdown the service
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down UnifiedEmailService...');

    // Stop queue processor
    if (this.queueProcessInterval) {
      clearInterval(this.queueProcessInterval);
      this.queueProcessInterval = undefined;
    }

    // Process remaining queued emails with timeout
    if (this.queuedEmails.length > 0) {
      logger.info(`Processing ${this.queuedEmails.length} remaining emails...`);
      const timeout = setTimeout(() => {
        logger.warn('Email queue processing timeout during shutdown');
      }, 5000);

      try {
        await this.processQueue();
      } finally {
        clearTimeout(timeout);
      }
    }

    // Close transporter connection
    if (this.transporter) {
      try {
        this.transporter.close();
      } catch (error) {
        logger.error('Error closing email transporter:', error);
      }
    }

    // Clear template cache
    this.templateCache.clear();

    logger.info('UnifiedEmailService shutdown complete');
  }
}

// Export singleton instance
export const emailService = new UnifiedEmailService();

// Export for backward compatibility
export default emailService;
