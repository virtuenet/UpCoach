import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import mjml2html from 'mjml';
import Handlebars from 'handlebars';

/**
 * Email Template Service
 *
 * Manages tenant-specific email templates using MJML:
 * - Welcome emails
 * - Password reset
 * - Habit reminders
 * - Weekly summaries
 * - Invoice receipts
 *
 * Features:
 * - MJML to HTML compilation
 * - Handlebars template variables
 * - Template versioning
 * - Preview generation
 */

export interface EmailTemplate {
  id: string;
  tenantId: string;
  templateType: string;
  name: string;
  subject: string;
  mjmlContent: string;
  htmlContent: string;
  variables: string[];
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateRenderData {
  templateType: string;
  variables: Record<string, any>;
  tenantId: string;
}

export class EmailTemplateService {
  private db: Pool;
  private handlebars: typeof Handlebars;

  constructor(db: Pool) {
    this.db = db;
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  /**
   * Create or update email template
   */
  async saveTemplate(
    tenantId: string,
    templateType: string,
    name: string,
    subject: string,
    mjmlContent: string
  ): Promise<EmailTemplate> {
    try {
      // Compile MJML to HTML
      const { html, errors } = mjml2html(mjmlContent, {
        validationLevel: 'soft',
      });

      if (errors.length > 0) {
        logger.warn('MJML compilation warnings', { errors });
      }

      // Extract variables from MJML content
      const variables = this.extractVariables(mjmlContent);

      // Check if template exists
      const existingQuery = `
        SELECT * FROM email_templates
        WHERE tenant_id = $1 AND template_type = $2
      `;
      const existingResult = await this.db.query(existingQuery, [tenantId, templateType]);

      let result;

      if (existingResult.rows.length > 0) {
        // Update existing template
        const updateQuery = `
          UPDATE email_templates
          SET name = $1, subject = $2, mjml_content = $3,
              html_content = $4, variables = $5,
              version = version + 1, updated_at = NOW()
          WHERE tenant_id = $6 AND template_type = $7
          RETURNING *
        `;
        result = await this.db.query(updateQuery, [
          name,
          subject,
          mjmlContent,
          html,
          JSON.stringify(variables),
          tenantId,
          templateType,
        ]);
      } else {
        // Insert new template
        const insertQuery = `
          INSERT INTO email_templates (
            tenant_id, template_type, name, subject,
            mjml_content, html_content, variables,
            version, is_active, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 1, true, NOW(), NOW())
          RETURNING *
        `;
        result = await this.db.query(insertQuery, [
          tenantId,
          templateType,
          name,
          subject,
          mjmlContent,
          html,
          JSON.stringify(variables),
        ]);
      }

      const template = this.mapToTemplate(result.rows[0]);

      logger.info('Email template saved', {
        tenantId,
        templateType,
        version: template.version,
      });

      return template;
    } catch (error) {
      logger.error('Failed to save email template', {
        tenantId,
        templateType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get template by type
   */
  async getTemplate(tenantId: string, templateType: string): Promise<EmailTemplate | null> {
    const query = `
      SELECT * FROM email_templates
      WHERE tenant_id = $1 AND template_type = $2 AND is_active = true
    `;
    const result = await this.db.query(query, [tenantId, templateType]);

    if (result.rows.length === 0) {
      // Fall back to default template
      return this.getDefaultTemplate(templateType);
    }

    return this.mapToTemplate(result.rows[0]);
  }

  /**
   * Render email template with variables
   */
  async renderTemplate(data: TemplateRenderData): Promise<{ subject: string; html: string }> {
    try {
      const template = await this.getTemplate(data.tenantId, data.templateType);

      if (!template) {
        throw new Error(`Template not found: ${data.templateType}`);
      }

      // Compile subject template
      const subjectTemplate = this.handlebars.compile(template.subject);
      const renderedSubject = subjectTemplate(data.variables);

      // Compile HTML template
      const htmlTemplate = this.handlebars.compile(template.htmlContent);
      const renderedHtml = htmlTemplate(data.variables);

      logger.info('Email template rendered', {
        tenantId: data.tenantId,
        templateType: data.templateType,
      });

      return {
        subject: renderedSubject,
        html: renderedHtml,
      };
    } catch (error) {
      logger.error('Template rendering failed', {
        tenantId: data.tenantId,
        templateType: data.templateType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get all templates for tenant
   */
  async getTemplatesByTenant(tenantId: string): Promise<EmailTemplate[]> {
    const query = `
      SELECT * FROM email_templates
      WHERE tenant_id = $1
      ORDER BY template_type, created_at DESC
    `;
    const result = await this.db.query(query, [tenantId]);

    return result.rows.map(row => this.mapToTemplate(row));
  }

  /**
   * Delete template
   */
  async deleteTemplate(tenantId: string, templateType: string): Promise<void> {
    const query = `
      UPDATE email_templates
      SET is_active = false, updated_at = NOW()
      WHERE tenant_id = $1 AND template_type = $2
    `;
    await this.db.query(query, [tenantId, templateType]);

    logger.info('Email template deleted', { tenantId, templateType });
  }

  /**
   * Generate preview HTML
   */
  async previewTemplate(
    tenantId: string,
    templateType: string,
    sampleVariables: Record<string, any>
  ): Promise<string> {
    const { html } = await this.renderTemplate({
      templateType,
      variables: sampleVariables,
      tenantId,
    });

    return html;
  }

  /**
   * Get default template for type
   */
  private async getDefaultTemplate(templateType: string): Promise<EmailTemplate | null> {
    const query = `
      SELECT * FROM email_templates
      WHERE tenant_id IS NULL AND template_type = $1 AND is_active = true
    `;
    const result = await this.db.query(query, [templateType]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToTemplate(result.rows[0]);
  }

  /**
   * Extract Handlebars variables from MJML content
   */
  private extractVariables(mjmlContent: string): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variableRegex.exec(mjmlContent)) !== null) {
      // Extract variable name (remove helpers and whitespace)
      const varName = match[1].trim().split(' ')[0];
      variables.add(varName);
    }

    return Array.from(variables);
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // Format date helper
    this.handlebars.registerHelper('formatDate', (date: string, format: string) => {
      const d = new Date(date);
      if (format === 'short') {
        return d.toLocaleDateString();
      } else if (format === 'long') {
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      return d.toISOString();
    });

    // Currency helper
    this.handlebars.registerHelper('currency', (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    });

    // Uppercase helper
    this.handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // Lowercase helper
    this.handlebars.registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });

    // Pluralize helper
    this.handlebars.registerHelper('pluralize', (count: number, singular: string, plural: string) => {
      return count === 1 ? singular : plural;
    });

    // Conditional equality helper
    this.handlebars.registerHelper('eq', (a: any, b: any) => {
      return a === b;
    });
  }

  /**
   * Map database row to EmailTemplate
   */
  private mapToTemplate(row: any): EmailTemplate {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      templateType: row.template_type,
      name: row.name,
      subject: row.subject,
      mjmlContent: row.mjml_content,
      htmlContent: row.html_content,
      variables: typeof row.variables === 'string'
        ? JSON.parse(row.variables)
        : row.variables,
      version: row.version,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Create default templates for new tenant
   */
  async createDefaultTemplates(tenantId: string, brandingConfig: {
    primaryColor: string;
    companyName: string;
    logoUrl?: string;
  }): Promise<void> {
    const templates = [
      {
        type: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to {{companyName}}!',
        mjml: this.getWelcomeTemplateMJML(brandingConfig),
      },
      {
        type: 'password_reset',
        name: 'Password Reset',
        subject: 'Reset Your Password',
        mjml: this.getPasswordResetTemplateMJML(brandingConfig),
      },
      {
        type: 'habit_reminder',
        name: 'Habit Reminder',
        subject: 'Time to check in: {{habitName}}',
        mjml: this.getHabitReminderTemplateMJML(brandingConfig),
      },
    ];

    for (const template of templates) {
      await this.saveTemplate(
        tenantId,
        template.type,
        template.name,
        template.subject,
        template.mjml
      );
    }

    logger.info('Default email templates created', { tenantId });
  }

  /**
   * Welcome email MJML template
   */
  private getWelcomeTemplateMJML(branding: any): string {
    return `
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
      <mj-text color="#333333" font-size="14px" line-height="20px" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="#ffffff" padding="20px">
      <mj-column>
        <mj-image src="${branding.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" width="150px" />
        <mj-text font-size="24px" font-weight="bold" color="${branding.primaryColor}">
          Welcome, {{userName}}!
        </mj-text>
        <mj-text>
          Thank you for joining {{companyName}}. We're excited to help you achieve your goals!
        </mj-text>
        <mj-button background-color="${branding.primaryColor}" href="{{dashboardUrl}}">
          Get Started
        </mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
    `.trim();
  }

  /**
   * Password reset MJML template
   */
  private getPasswordResetTemplateMJML(branding: any): string {
    return `
<mjml>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="#ffffff" padding="20px">
      <mj-column>
        <mj-text font-size="20px" font-weight="bold">
          Reset Your Password
        </mj-text>
        <mj-text>
          Click the button below to reset your password. This link expires in 1 hour.
        </mj-text>
        <mj-button background-color="${branding.primaryColor}" href="{{resetUrl}}">
          Reset Password
        </mj-button>
        <mj-text color="#999999" font-size="12px">
          If you didn't request this, please ignore this email.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
    `.trim();
  }

  /**
   * Habit reminder MJML template
   */
  private getHabitReminderTemplateMJML(branding: any): string {
    return `
<mjml>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="#ffffff" padding="20px">
      <mj-column>
        <mj-text font-size="20px" font-weight="bold" color="${branding.primaryColor}">
          Don't forget: {{habitName}}
        </mj-text>
        <mj-text>
          You're on a {{streakDays}}-day streak! Keep it going!
        </mj-text>
        <mj-button background-color="${branding.primaryColor}" href="{{checkInUrl}}">
          Check In Now
        </mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
    `.trim();
  }
}
