import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';
import handlebars from 'handlebars';

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
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private templateCache: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    this.registerHelpers();
  }

  private registerHelpers() {
    handlebars.registerHelper('formatDate', (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    handlebars.registerHelper('formatCurrency', (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    });

    handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    handlebars.registerHelper('lt', (a: any, b: any) => a < b);
    handlebars.registerHelper('gt', (a: any, b: any) => a > b);
    handlebars.registerHelper('lte', (a: any, b: any) => a <= b);
    handlebars.registerHelper('gte', (a: any, b: any) => a >= b);
  }

  private async loadTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    const templatePath = path.join(
      process.cwd(),
      'src',
      'templates',
      'email',
      `${templateName}.hbs`
    );

    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(templateContent);
    
    this.templateCache.set(templateName, template);
    return template;
  }

  public async sendEmail(options: EmailOptions): Promise<void> {
    let html: string;

    if (options.template) {
      const template = await this.loadTemplate(options.template);
      html = template(options.data || {});
    } else if (options.html) {
      html = options.html;
    } else {
      throw new Error('Either template or html must be provided');
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.SMTP_FROM || 'noreply@upcoach.ai',
      to: options.to,
      subject: options.subject,
      html,
      text: options.text,
      attachments: options.attachments,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  public async sendBulkEmails(
    recipients: string[],
    subject: string,
    template: string,
    commonData: any = {}
  ): Promise<void> {
    const chunks = this.chunkArray(recipients, 50); // Send in batches of 50

    for (const chunk of chunks) {
      const promises = chunk.map((recipient) =>
        this.sendEmail({
          to: recipient,
          subject,
          template,
          data: { ...commonData, email: recipient },
        }).catch((error) => {
          console.error(`Failed to send email to ${recipient}:`, error);
        })
      );

      await Promise.all(promises);
      
      // Add delay between batches to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  public async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export default new EmailService();