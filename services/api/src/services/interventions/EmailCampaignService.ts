import { Pool } from 'pg';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { InterventionEvent, DeliveryResult } from './InterventionDeliveryService';
import { logger } from '../../utils/logger';

/**
 * Email Campaign Service
 *
 * Sends intervention emails via AWS SES
 * Supports templates and personalization
 */

export class EmailCampaignService {
  private db: Pool;
  private sesClient: SESClient;
  private fromEmail: string;

  constructor(db: Pool) {
    this.db = db;
    this.fromEmail = process.env.SES_FROM_EMAIL || 'noreply@upcoach.app';

    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Send tips email
   */
  async sendTipsEmail(event: InterventionEvent): Promise<DeliveryResult> {
    try {
      const user = await this.getUserEmail(event.userId);

      if (!user || !user.email) {
        return {
          userId: event.userId,
          interventionType: event.interventionType,
          channel: 'email',
          status: 'skipped',
          error: 'No email address found',
        };
      }

      if (!user.emailEnabled) {
        return {
          userId: event.userId,
          interventionType: event.interventionType,
          channel: 'email',
          status: 'skipped',
          error: 'User has disabled email notifications',
        };
      }

      const emailHtml = this.getTipsEmailTemplate(user.name, event);

      await this.sendEmail({
        to: user.email,
        subject: '💡 Tips to Boost Your Habit Success',
        htmlBody: emailHtml,
        textBody: this.htmlToText(emailHtml),
      });

      logger.info('Tips email sent', { userId: event.userId, email: user.email });

      return {
        userId: event.userId,
        interventionType: event.interventionType,
        channel: 'email',
        status: 'sent',
        deliveredAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to send tips email', { error });
      return {
        userId: event.userId,
        interventionType: event.interventionType,
        channel: 'email',
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Send reengagement email
   */
  async sendReengagementEmail(event: InterventionEvent): Promise<DeliveryResult> {
    try {
      const user = await this.getUserEmail(event.userId);

      if (!user || !user.email) {
        return {
          userId: event.userId,
          interventionType: event.interventionType,
          channel: 'email',
          status: 'skipped',
          error: 'No email address found',
        };
      }

      if (!user.emailEnabled) {
        return {
          userId: event.userId,
          interventionType: event.interventionType,
          channel: 'email',
          status: 'skipped',
          error: 'User has disabled email notifications',
        };
      }

      const emailHtml = this.getReengagementEmailTemplate(user.name, event);

      await this.sendEmail({
        to: user.email,
        subject: '👋 We Miss You at UpCoach!',
        htmlBody: emailHtml,
        textBody: this.htmlToText(emailHtml),
      });

      logger.info('Reengagement email sent', { userId: event.userId, email: user.email });

      return {
        userId: event.userId,
        interventionType: event.interventionType,
        channel: 'email',
        status: 'sent',
        deliveredAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to send reengagement email', { error });
      return {
        userId: event.userId,
        interventionType: event.interventionType,
        channel: 'email',
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Send email via SES
   */
  private async sendEmail(params: {
    to: string;
    subject: string;
    htmlBody: string;
    textBody: string;
  }): Promise<void> {
    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [params.to],
      },
      Message: {
        Subject: {
          Data: params.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: params.htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: params.textBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    await this.sesClient.send(command);
  }

  /**
   * Get user email and preferences
   */
  private async getUserEmail(userId: string): Promise<{
    email: string;
    name: string;
    emailEnabled: boolean;
  } | null> {
    const query = `
      SELECT
        email,
        name,
        notification_preferences->>'email_enabled' as email_enabled
      FROM users
      WHERE id = $1
    `;

    const result = await this.db.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      email: row.email,
      name: row.name,
      emailEnabled: row.email_enabled !== 'false', // Default true
    };
  }

  /**
   * Tips email template
   */
  private getTipsEmailTemplate(userName: string, event: InterventionEvent): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tips to Boost Your Habit Success</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">💡 Tips From Your Coach</h1>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 16px;">Hi ${userName},</p>

          <p style="font-size: 16px;">We've noticed your engagement has dipped recently, and we want to help you get back on track! Here are some proven strategies:</p>

          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #4F46E5; font-size: 20px; margin-top: 0;">🎯 Quick Wins</h2>

            <ul style="padding-left: 20px;">
              <li style="margin-bottom: 10px;"><strong>Start Small:</strong> Reduce your habit to just 2 minutes to rebuild momentum</li>
              <li style="margin-bottom: 10px;"><strong>Link to Existing Habits:</strong> Stack your new habit after something you already do daily</li>
              <li style="margin-bottom: 10px;"><strong>Make It Obvious:</strong> Set visual reminders in places you frequent</li>
              <li style="margin-bottom: 10px;"><strong>Track Your Progress:</strong> Seeing your streak grow is incredibly motivating</li>
            </ul>
          </div>

          <p style="font-size: 16px;">Remember, consistency beats perfection. Even a 1% improvement each day compounds to remarkable results over time.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://upcoach.app/dashboard" style="background: #4F46E5; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Open UpCoach</a>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">You've got this! 💪</p>

          <p style="font-size: 14px; color: #666;">The UpCoach Team</p>
        </div>

        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>Don't want these emails? <a href="https://upcoach.app/settings/notifications" style="color: #4F46E5;">Update your preferences</a></p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Reengagement email template
   */
  private getReengagementEmailTemplate(userName: string, event: InterventionEvent): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>We Miss You!</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 32px;">👋</h1>
          <h2 style="margin: 10px 0 0 0; font-size: 24px;">We Miss You!</h2>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 16px;">Hi ${userName},</p>

          <p style="font-size: 16px;">It's been a while since we last saw you on UpCoach. Your journey toward better habits is still waiting for you!</p>

          <div style="background: #FEF3C7; padding: 20px; border-left: 4px solid #F59E0B; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;"><strong>Did you know?</strong> People who return after a break are 3x more likely to achieve their long-term goals compared to those who never restart.</p>
          </div>

          <h3 style="color: #4F46E5; font-size: 20px;">Your Progress is Safe</h3>
          <p style="font-size: 16px;">All your habits, goals, and progress are exactly where you left them. Pick up right where you stopped and continue building the life you want.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://upcoach.app/dashboard" style="background: #4F46E5; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Continue My Journey</a>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">Every expert was once a beginner who refused to give up. Let's do this together!</p>

          <p style="font-size: 14px; color: #666;">The UpCoach Team</p>
        </div>

        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>Don't want these emails? <a href="https://upcoach.app/settings/notifications" style="color: #4F46E5;">Update your preferences</a></p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Convert HTML to plain text (simple implementation)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*<\/style>/gm, '')
      .replace(/<script[^>]*>.*<\/script>/gm, '')
      .replace(/<[^>]+>/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
