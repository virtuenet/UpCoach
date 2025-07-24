import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { FinancialReport } from '../models';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface AlertEmail {
  to: string[];
  subject: string;
  alerts: any[];
  priority: 'low' | 'normal' | 'high';
}

interface ReportEmail {
  to: string[];
  subject: string;
  report: FinancialReport;
  attachments?: string[];
}

export class EmailService {
  private static transporter: nodemailer.Transporter;

  static initialize() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    };

    this.transporter = nodemailer.createTransport(config);
  }

  /**
   * Send financial alert email
   */
  static async sendAlert(alertData: AlertEmail): Promise<void> {
    try {
      const { to, subject, alerts, priority } = alertData;

      const html = this.generateAlertHTML(alerts, priority);
      const text = this.generateAlertText(alerts);

      await this.transporter.sendMail({
        from: '"UpCoach Finance" <finance@upcoach.app>',
        to: to.join(', '),
        subject,
        text,
        html,
        priority: priority === 'high' ? 'high' : 'normal',
      });

      logger.info(`Alert email sent to: ${to.join(', ')}`);
    } catch (error) {
      logger.error('Failed to send alert email:', error);
      throw error;
    }
  }

  /**
   * Send financial report email
   */
  static async sendReport(reportData: ReportEmail): Promise<void> {
    try {
      const { to, subject, report, attachments = [] } = reportData;

      const html = this.generateReportHTML(report);
      const text = this.generateReportText(report);

      const mailOptions: any = {
        from: '"UpCoach Finance" <finance@upcoach.app>',
        to: to.join(', '),
        subject,
        text,
        html,
      };

      // Add attachments if any
      if (attachments.length > 0) {
        mailOptions.attachments = attachments.map(filename => ({
          filename,
          path: `./reports/${filename}`,
        }));
      }

      await this.transporter.sendMail(mailOptions);

      logger.info(`Report email sent to: ${to.join(', ')}`);
    } catch (error) {
      logger.error('Failed to send report email:', error);
      throw error;
    }
  }

  /**
   * Generate HTML for alert emails
   */
  private static generateAlertHTML(alerts: any[], priority: string): string {
    const priorityColors = {
      low: '#3b82f6',
      normal: '#f59e0b',
      high: '#ef4444',
    };

    const color = priorityColors[priority as keyof typeof priorityColors];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Financial Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .alert { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid ${color}; border-radius: 4px; }
          .metric { font-size: 24px; font-weight: bold; color: ${color}; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${priority.toUpperCase()} Financial Alert</h1>
            <p>UpCoach Financial Monitoring System</p>
          </div>
          <div class="content">
            <h2>Alert Details</h2>
            ${alerts.map(alert => `
              <div class="alert">
                <h3>${alert.type.replace(/_/g, ' ')}</h3>
                <p>${alert.message}</p>
                <div class="metric">
                  Current: ${alert.value}${typeof alert.value === 'number' && alert.value < 100 ? '%' : ''}
                  | Threshold: ${alert.threshold}${typeof alert.threshold === 'number' && alert.threshold < 100 ? '%' : ''}
                </div>
              </div>
            `).join('')}
            
            <h3>Recommended Actions</h3>
            <ul>
              ${alerts.map(alert => {
                switch (alert.type) {
                  case 'HIGH_CHURN':
                    return '<li>Review customer feedback and improve retention strategies</li>';
                  case 'LOW_RUNWAY':
                    return '<li>Consider fundraising or reducing burn rate immediately</li>';
                  case 'LOW_LTV_CAC':
                    return '<li>Optimize marketing channels or increase customer lifetime value</li>';
                  case 'LOW_GROSS_MARGIN':
                    return '<li>Review pricing strategy and cost structure</li>';
                  default:
                    return '<li>Review the metric and take appropriate action</li>';
                }
              }).join('')}
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated alert from UpCoach Financial Monitoring System</p>
            <p>Generated at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text for alert emails
   */
  private static generateAlertText(alerts: any[]): string {
    return `
FINANCIAL ALERT - UpCoach

${alerts.map(alert => `
Alert: ${alert.type.replace(/_/g, ' ')}
Message: ${alert.message}
Current Value: ${alert.value}
Threshold: ${alert.threshold}
`).join('\n')}

Generated at: ${new Date().toLocaleString()}
    `.trim();
  }

  /**
   * Generate HTML for report emails
   */
  private static generateReportHTML(report: FinancialReport): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${report.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .metric-card { background: white; padding: 15px; margin: 10px; border-radius: 8px; display: inline-block; width: 200px; text-align: center; }
          .metric-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .metric-label { font-size: 14px; color: #666; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${report.title}</h1>
            <p>${report.description}</p>
            <p>Generated: ${report.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'In Progress'}</p>
          </div>
          <div class="content">
            <h2>Report Summary</h2>
            <p>This automated financial report provides insights into business performance and key metrics.</p>
            
            ${report.data ? `
              <h3>Key Metrics</h3>
              <div style="text-align: center;">
                ${Object.entries(report.data).slice(0, 4).map(([key, value]) => `
                  <div class="metric-card">
                    <div class="metric-value">${typeof value === 'number' ? value.toLocaleString() : value}</div>
                    <div class="metric-label">${key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            <h3>Access Full Report</h3>
            <p>
              <a href="${process.env.ADMIN_URL}/financial/reports/${report.id}" 
                 style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                View Full Report
              </a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated report from UpCoach Financial System</p>
            <p>Report ID: ${report.id}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text for report emails
   */
  private static generateReportText(report: FinancialReport): string {
    return `
${report.title}

${report.description}

Generated: ${report.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'In Progress'}

Access the full report at: ${process.env.ADMIN_URL}/financial/reports/${report.id}

Report ID: ${report.id}
    `.trim();
  }

  /**
   * Send test email
   */
  static async sendTestEmail(to: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: '"UpCoach Finance" <finance@upcoach.app>',
        to,
        subject: 'Test Email - UpCoach Financial System',
        text: 'This is a test email from the UpCoach Financial System.',
        html: '<p>This is a test email from the <strong>UpCoach Financial System</strong>.</p>',
      });

      logger.info(`Test email sent to: ${to}`);
    } catch (error) {
      logger.error('Failed to send test email:', error);
      throw error;
    }
  }
}

// Initialize email service
EmailService.initialize(); 