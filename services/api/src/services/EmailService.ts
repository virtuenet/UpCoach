/**
 * Email Service for sending financial reports and notifications
 * @author UpCoach Architecture Team
 */

import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    // Use SMTP configuration from environment
    const emailConfig = {
      host: config.email?.host || 'smtp.gmail.com',
      port: config.email?.port || 587,
      secure: config.email?.secure || false,
      auth: {
        user: config.email?.user || process.env.EMAIL_USER,
        pass: config.email?.password || process.env.EMAIL_PASSWORD,
      },
    };

    // Fallback for development/testing
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      logger.warn('Email credentials not configured, using test transporter');

      // Create test account for development
      this.transporter = nodemailer.createTransporter({
        host: 'ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      });
    } else {
      this.transporter = nodemailer.createTransporter(emailConfig);
    }

    // Verify connection
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified successfully');
    } catch (error) {
      logger.error('Email service connection failed:', error);

      // Create fallback transporter for testing
      this.transporter = nodemailer.createTransporter({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
    }
  }

  /**
   * Send email with optional attachments
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const mailOptions = {
        from: config.email?.from || 'UpCoach <noreply@upcoach.ai>',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      logger.error('Failed to send email:', {
        error: (error as Error).message,
        to: options.to,
        subject: options.subject
      });

      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Send financial report email with professional formatting
   */
  async sendFinancialReportEmail(
    recipients: string[],
    reportData: any,
    attachmentPath?: string,
    attachmentFilename?: string
  ): Promise<EmailResult> {
    const subject = `UpCoach Financial Report - ${reportData.period || 'Monthly'}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>UpCoach Financial Report</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 30px 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: white;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        .metric-card {
          background: #f8fafc;
          padding: 20px;
          border-radius: 6px;
          border-left: 4px solid #3b82f6;
          text-align: center;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #1e293b;
          margin: 5px 0;
        }
        .metric-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .insight {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 15px 0;
          border-radius: 0 4px 4px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }
        .cta-button {
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Financial Report</h1>
        <p>Generated on ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
      </div>

      <div class="content">
        <h2>Executive Summary</h2>

        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-label">MRR</div>
            <div class="metric-value">$${(reportData.metrics?.current?.mrr || 0).toLocaleString()}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Customers</div>
            <div class="metric-value">${(reportData.metrics?.current?.totalCustomers || 0).toLocaleString()}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">ARPU</div>
            <div class="metric-value">$${(reportData.metrics?.current?.arpu || 0).toFixed(2)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Growth Rate</div>
            <div class="metric-value">${(reportData.metrics?.current?.mrrChange || 0).toFixed(1)}%</div>
          </div>
        </div>

        <h3>Key Insights</h3>
        ${reportData.insights ? reportData.insights.slice(0, 3).map((insight: string) =>
          `<div class="insight">💡 ${insight}</div>`
        ).join('') : '<div class="insight">📈 Financial performance is being analyzed...</div>'}

        ${attachmentPath ? `
        <p>The complete detailed report is attached to this email. The report includes:</p>
        <ul>
          <li>📊 Comprehensive metrics and KPIs</li>
          <li>📈 Revenue forecasts and trends</li>
          <li>👥 Cohort analysis and customer insights</li>
          <li>💰 Cost optimization recommendations</li>
          <li>🚨 Alerts and action items</li>
        </ul>
        ` : ''}

        <div style="text-align: center;">
          <a href="https://app.upcoach.ai/dashboard/financial" class="cta-button">
            View Live Dashboard
          </a>
        </div>
      </div>

      <div class="footer">
        <p><strong>UpCoach Financial Analytics</strong></p>
        <p>This automated report helps you track your business performance and make data-driven decisions.</p>
        <p>Questions? Contact us at <a href="mailto:support@upcoach.ai">support@upcoach.ai</a></p>
        <p style="margin-top: 20px; opacity: 0.7;">
          You're receiving this because you're subscribed to UpCoach financial reports.<br>
          <a href="#">Unsubscribe</a> | <a href="#">Manage Preferences</a>
        </p>
      </div>
    </body>
    </html>
    `;

    const attachments: any[] = [];
    if (attachmentPath && attachmentFilename) {
      attachments.push({
        filename: attachmentFilename,
        path: attachmentPath
      });
    }

    return await this.sendEmail({
      to: recipients,
      subject,
      html: htmlContent,
      attachments
    });
  }

  /**
   * Send notification email for alerts
   */
  async sendAlertNotification(
    recipients: string[],
    alert: {
      title: string;
      description: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      action?: string;
    }
  ): Promise<EmailResult> {
    const severityEmojis = {
      critical: '🚨',
      high: '⚠️',
      medium: '📢',
      low: '💡'
    };

    const severityColors = {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981'
    };

    const subject = `${severityEmojis[alert.severity]} UpCoach Alert: ${alert.title}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background: ${severityColors[alert.severity]}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">${severityEmojis[alert.severity]} ${alert.title}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">${alert.severity} Priority</p>
        </div>

        <div style="padding: 30px;">
          <p style="font-size: 16px; line-height: 1.5; color: #374151; margin: 0 0 20px 0;">
            ${alert.description}
          </p>

          ${alert.action ? `
          <div style="background: #f3f4f6; border-left: 4px solid ${severityColors[alert.severity]}; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: 500; color: #1f2937;">Recommended Action:</p>
            <p style="margin: 5px 0 0 0; color: #4b5563;">${alert.action}</p>
          </div>
          ` : ''}

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://app.upcoach.ai/dashboard/financial" style="display: inline-block; background: ${severityColors[alert.severity]}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              View Dashboard
            </a>
          </div>
        </div>

        <div style="background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p style="margin: 0;">UpCoach Financial Monitoring • ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
    `;

    return await this.sendEmail({
      to: recipients,
      subject,
      html: htmlContent
    });
  }

  /**
   * Send test email to verify configuration
   */
  async sendTestEmail(to: string): Promise<EmailResult> {
    return await this.sendEmail({
      to,
      subject: '✅ UpCoach Email Service Test',
      html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">🎉 Email Service Working!</h2>
        <p>This is a test email to confirm that the UpCoach email service is configured correctly.</p>
        <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p><strong>✅ SMTP Configuration:</strong> Working</p>
          <p><strong>📧 Email Delivery:</strong> Successful</p>
          <p><strong>🕒 Sent:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          If you received this email, your UpCoach financial reporting system is ready to send automated reports.
        </p>
      </div>
      `
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();