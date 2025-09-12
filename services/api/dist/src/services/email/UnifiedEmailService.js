"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.UnifiedEmailService = void 0;
const crypto = __importStar(require("crypto"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
const nodemailer_1 = require("nodemailer");
const User_1 = require("../../models/User");
const logger_1 = require("../../utils/logger");
const UnifiedCacheService_1 = require("../cache/UnifiedCacheService");
class UnifiedEmailService {
    transporter;
    templateCache = new Map();
    metrics = {
        sent: 0,
        failed: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
    };
    queuedEmails = [];
    isProcessing = false;
    cache;
    queueProcessInterval;
    constructor() {
        this.cache = (0, UnifiedCacheService_1.getCacheService)();
        this.initializeTransporter();
        this.registerHelpers();
        this.startQueueProcessor();
    }
    initializeTransporter() {
        const config = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        };
        this.transporter = (0, nodemailer_1.createTransport)(config);
        this.transporter.verify(error => {
            if (error) {
                logger_1.logger.error('Email service initialization failed:', error);
            }
            else {
                logger_1.logger.info('Email service ready');
            }
        });
    }
    registerHelpers() {
        handlebars_1.default.registerHelper('formatDate', (date) => {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        });
        handlebars_1.default.registerHelper('formatCurrency', (amount) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(amount);
        });
        handlebars_1.default.registerHelper('formatPercent', (value) => {
            return `${(value * 100).toFixed(2)}%`;
        });
        handlebars_1.default.registerHelper('ifEquals', function (arg1, arg2, options) {
            return arg1 === arg2 ? options.fn(this) : options.inverse(this);
        });
        handlebars_1.default.registerHelper('ifGreaterThan', function (arg1, arg2, options) {
            return arg1 > arg2 ? options.fn(this) : options.inverse(this);
        });
    }
    async loadTemplate(templateName) {
        if (this.templateCache.has(templateName)) {
            return this.templateCache.get(templateName);
        }
        try {
            const templatePath = path_1.default.join(__dirname, '../../templates/emails', `${templateName}.hbs`);
            const templateContent = await fs_1.promises.readFile(templatePath, 'utf-8');
            const compiled = handlebars_1.default.compile(templateContent);
            this.templateCache.set(templateName, compiled);
            return compiled;
        }
        catch (error) {
            logger_1.logger.error(`Failed to load email template ${templateName}:`, error);
            throw new Error(`Email template ${templateName} not found`);
        }
    }
    async send(options) {
        try {
            let html = options.html;
            let text = options.text;
            if (options.template && options.data) {
                const template = await this.loadTemplate(options.template);
                html = template(options.data);
                if (!text) {
                    text = this.htmlToText(html);
                }
            }
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
            logger_1.logger.info('Email sent successfully:', {
                messageId: info.messageId,
                to: options.to,
                subject: options.subject,
            });
            return true;
        }
        catch (error) {
            this.metrics.failed++;
            logger_1.logger.error('Failed to send email:', error);
            if (this.isTemporaryFailure(error)) {
                this.queuedEmails.push(options);
            }
            return false;
        }
    }
    async queue(options) {
        this.queuedEmails.push(options);
        if (!this.isProcessing) {
            this.processQueue();
        }
    }
    async processQueue() {
        if (this.isProcessing || this.queuedEmails.length === 0) {
            return;
        }
        this.isProcessing = true;
        while (this.queuedEmails.length > 0) {
            const email = this.queuedEmails.shift();
            try {
                await this.send(email);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            catch (error) {
                logger_1.logger.error('Failed to process queued email:', error);
            }
        }
        this.isProcessing = false;
    }
    startQueueProcessor() {
        this.queueProcessInterval = setInterval(() => {
            if (this.queuedEmails.length > 0) {
                this.processQueue();
            }
        }, 30000);
    }
    async sendWelcomeEmail(user) {
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
    async sendPasswordResetEmail(user, resetToken) {
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
    async sendFinancialAlert(alert) {
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
    async sendFinancialReport(report) {
        return this.send({
            to: report.to,
            subject: report.subject,
            template: 'financial-report',
            data: {
                report: report.report,
                generatedAt: new Date(),
            },
            attachments: report.attachments?.map(filepath => ({
                filename: path_1.default.basename(filepath),
                path: filepath,
            })),
        });
    }
    async sendCampaign(campaign) {
        let successful = 0;
        let failed = 0;
        const cacheKey = `campaign:${campaign.name}`;
        await this.cache.set(cacheKey, campaign, { ttl: 3600 });
        const batchSize = 50;
        for (let i = 0; i < campaign.recipients.length; i += batchSize) {
            const batch = campaign.recipients.slice(i, i + batchSize);
            const promises = batch.map(recipient => this.send({
                to: recipient,
                subject: campaign.subject,
                template: campaign.template,
                data: {
                    ...campaign.data,
                    recipientEmail: recipient,
                    campaignName: campaign.name,
                },
            }));
            const results = await Promise.allSettled(promises);
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    successful++;
                }
                else {
                    failed++;
                }
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        logger_1.logger.info(`Campaign ${campaign.name} completed:`, {
            successful,
            failed,
            total: campaign.recipients.length,
        });
        return { successful, failed };
    }
    async sendAutomatedEmail(trigger, userId, data) {
        const triggerTemplates = {
            goal_completed: 'goal-completion',
            streak_milestone: 'streak-achievement',
            subscription_expired: 'subscription-reminder',
            weekly_summary: 'weekly-summary',
            inactivity_7days: 're-engagement',
        };
        const template = triggerTemplates[trigger];
        if (!template) {
            logger_1.logger.warn(`No template found for trigger: ${trigger}`);
            return false;
        }
        const user = await User_1.User.findByPk(userId);
        if (!user) {
            logger_1.logger.error(`User not found: ${userId}`);
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
    getAutomatedSubject(trigger, data) {
        const subjects = {
            goal_completed: `🎉 Congratulations! You've completed your goal`,
            streak_milestone: `🔥 Amazing! ${data?.days || 0} day streak`,
            subscription_expired: 'Your UpCoach subscription has expired',
            weekly_summary: 'Your Weekly UpCoach Summary',
            inactivity_7days: 'We miss you! Come back to UpCoach',
        };
        return subjects[trigger] || 'Update from UpCoach';
    }
    htmlToText(html) {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    }
    generateTrackingId(recipient) {
        const recipientStr = Array.isArray(recipient) ? recipient[0] : recipient;
        const timestamp = Date.now();
        const secret = process.env.EMAIL_TRACKING_SECRET || crypto.randomBytes(32).toString('hex');
        const hash = crypto
            .createHmac('sha256', secret)
            .update(`${recipientStr}:${timestamp}`)
            .digest('hex');
        const trackingData = { email: recipientStr, timestamp, hash };
        this.cache.set(`email:tracking:${hash}`, trackingData, { ttl: 86400 });
        return hash;
    }
    isTemporaryFailure(error) {
        const temporaryErrors = ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'ENETUNREACH', 'EHOSTUNREACH'];
        return temporaryErrors.includes(error.code);
    }
    async trackOpen(trackingId) {
        try {
            if (!/^[a-f0-9]{64}$/i.test(trackingId)) {
                logger_1.logger.warn('Invalid tracking ID format');
                return;
            }
            const trackingData = await this.cache.get(`email:tracking:${trackingId}`);
            if (!trackingData) {
                logger_1.logger.warn('Tracking ID not found or expired');
                return;
            }
            this.metrics.opened++;
            logger_1.logger.info('Email opened:', {
                email: trackingData.email,
                timestamp: new Date(trackingData.timestamp),
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to track email open:', error);
        }
    }
    async trackClick(trackingId, url) {
        try {
            if (!/^[a-f0-9]{64}$/i.test(trackingId)) {
                logger_1.logger.warn('Invalid tracking ID format');
                return;
            }
            try {
                const urlObj = new URL(url);
                const allowedDomains = (process.env.ALLOWED_REDIRECT_DOMAINS || 'localhost,upcoach.ai')
                    .split(',')
                    .map(d => d.trim());
                if (!allowedDomains.some(domain => urlObj.hostname.endsWith(domain))) {
                    logger_1.logger.warn('Attempted redirect to unauthorized domain:', urlObj.hostname);
                    return;
                }
            }
            catch (_urlError) {
                logger_1.logger.warn('Invalid URL provided:', url);
                return;
            }
            const trackingData = await this.cache.get(`email:tracking:${trackingId}`);
            if (!trackingData) {
                logger_1.logger.warn('Tracking ID not found or expired');
                return;
            }
            this.metrics.clicked++;
            logger_1.logger.info('Email link clicked:', {
                email: trackingData.email,
                url,
                timestamp: new Date(trackingData.timestamp),
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to track email click:', error);
        }
    }
    getMetrics() {
        return { ...this.metrics };
    }
    clearTemplateCache() {
        this.templateCache.clear();
    }
    async testConnection() {
        try {
            await this.transporter.verify();
            return true;
        }
        catch (error) {
            logger_1.logger.error('Email service test failed:', error);
            return false;
        }
    }
    async shutdown() {
        logger_1.logger.info('Shutting down UnifiedEmailService...');
        if (this.queueProcessInterval) {
            clearInterval(this.queueProcessInterval);
            this.queueProcessInterval = undefined;
        }
        if (this.queuedEmails.length > 0) {
            logger_1.logger.info(`Processing ${this.queuedEmails.length} remaining emails...`);
            const timeout = setTimeout(() => {
                logger_1.logger.warn('Email queue processing timeout during shutdown');
            }, 5000);
            try {
                await this.processQueue();
            }
            finally {
                clearTimeout(timeout);
            }
        }
        if (this.transporter) {
            try {
                this.transporter.close();
            }
            catch (error) {
                logger_1.logger.error('Error closing email transporter:', error);
            }
        }
        this.templateCache.clear();
        logger_1.logger.info('UnifiedEmailService shutdown complete');
    }
}
exports.UnifiedEmailService = UnifiedEmailService;
exports.emailService = new UnifiedEmailService();
exports.default = exports.emailService;
//# sourceMappingURL=UnifiedEmailService.js.map