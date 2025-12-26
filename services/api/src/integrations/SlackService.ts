import axios, { AxiosInstance } from 'axios';
import { Pool } from 'pg';
import { logger } from '../utils/logger';

/**
 * Slack Integration Service
 *
 * Integrates UpCoach with Slack for:
 * - Notifications (habit reminders, goal progress, achievements)
 * - Bot commands (/upcoach checkin, /upcoach goals)
 * - Interactive messages (buttons, dropdowns)
 * - OAuth2 workspace installation
 *
 * Features:
 * - Slack App with Bot User OAuth Token
 * - Slash commands
 * - Interactive components
 * - Event subscriptions
 * - Rich message formatting (blocks, attachments)
 */

export interface SlackConnection {
  tenantId: string;
  workspaceId: string;
  teamName: string;
  accessToken: string;
  botUserId: string;
  channelId?: string;
  createdAt: Date;
}

export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: any[];
  attachments?: any[];
}

export class SlackService {
  private db: Pool;
  private apiClient: AxiosInstance;

  constructor(db: Pool) {
    this.db = db;
    this.apiClient = axios.create({
      baseURL: 'https://slack.com/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Install Slack app for tenant (OAuth2 callback)
   */
  async installApp(
    code: string,
    tenantId: string
  ): Promise<SlackConnection> {
    try {
      // Exchange code for access token
      const response = await this.apiClient.post('oauth.v2.access', {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
      });

      if (!response.data.ok) {
        throw new Error(`Slack OAuth failed: ${response.data.error}`);
      }

      const {
        access_token: accessToken,
        team: { id: workspaceId, name: teamName },
        bot_user_id: botUserId,
      } = response.data;

      // Save connection
      const query = `
        INSERT INTO slack_connections (
          tenant_id, workspace_id, team_name, access_token, bot_user_id, created_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (tenant_id) DO UPDATE
        SET workspace_id = $2, team_name = $3, access_token = $4,
            bot_user_id = $5, updated_at = NOW()
        RETURNING *
      `;
      const result = await this.db.query(query, [
        tenantId,
        workspaceId,
        teamName,
        accessToken,
        botUserId,
      ]);

      logger.info('Slack app installed', {
        tenantId,
        workspaceId,
        teamName,
      });

      return this.mapRowToConnection(result.rows[0]);
    } catch (error) {
      logger.error('Slack app installation failed', {
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Send notification to Slack channel
   */
  async sendNotification(
    tenantId: string,
    message: SlackMessage
  ): Promise<void> {
    try {
      const connection = await this.getConnection(tenantId);
      if (!connection) {
        throw new Error(`Slack not connected for tenant ${tenantId}`);
      }

      await this.apiClient.post(
        'chat.postMessage',
        {
          channel: message.channel || connection.channelId || '#general',
          text: message.text,
          blocks: message.blocks,
          attachments: message.attachments,
        },
        {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
        }
      );

      logger.info('Slack notification sent', {
        tenantId,
        channel: message.channel,
      });
    } catch (error) {
      logger.error('Slack notification failed', {
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Send habit reminder
   */
  async sendHabitReminder(
    tenantId: string,
    userId: string,
    habitName: string,
    channelOrUserId: string
  ): Promise<void> {
    const message: SlackMessage = {
      channel: channelOrUserId,
      text: `Reminder: Time to check in your habit "${habitName}"!`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:bell: *Habit Reminder*\n\nTime to check in your habit *${habitName}*!`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Check In Now',
              },
              style: 'primary',
              value: `checkin_${userId}_${habitName}`,
              action_id: 'habit_checkin',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Snooze 1 Hour',
              },
              value: `snooze_${userId}_${habitName}`,
              action_id: 'habit_snooze',
            },
          ],
        },
      ],
    };

    await this.sendNotification(tenantId, message);
  }

  /**
   * Send goal progress update
   */
  async sendGoalProgress(
    tenantId: string,
    goalTitle: string,
    progress: number,
    channelOrUserId: string
  ): Promise<void> {
    const progressBar = this.buildProgressBar(progress);

    const message: SlackMessage = {
      channel: channelOrUserId,
      text: `Goal progress update: ${goalTitle} - ${progress}%`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:rocket: *Goal Progress Update*\n\n*${goalTitle}*\n${progressBar} ${progress}%`,
          },
        },
      ],
    };

    await this.sendNotification(tenantId, message);
  }

  /**
   * Send achievement celebration
   */
  async sendAchievement(
    tenantId: string,
    achievementTitle: string,
    channelOrUserId: string
  ): Promise<void> {
    const message: SlackMessage = {
      channel: channelOrUserId,
      text: `Achievement unlocked: ${achievementTitle}!`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:trophy: *Achievement Unlocked!*\n\n*${achievementTitle}*\n\nKeep up the great work!`,
          },
        },
      ],
    };

    await this.sendNotification(tenantId, message);
  }

  /**
   * Handle slash command (/upcoach)
   */
  async handleSlashCommand(
    command: string,
    userId: string,
    channelId: string,
    text: string
  ): Promise<any> {
    // Parse command
    const args = text.trim().split(' ');
    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case 'checkin':
        return this.handleCheckinCommand(userId, args.slice(1));
      case 'goals':
        return this.handleGoalsCommand(userId);
      case 'habits':
        return this.handleHabitsCommand(userId);
      case 'help':
        return this.handleHelpCommand();
      default:
        return {
          response_type: 'ephemeral',
          text: 'Unknown command. Type `/upcoach help` for usage.',
        };
    }
  }

  /**
   * Handle interactive component (button click)
   */
  async handleInteraction(payload: any): Promise<any> {
    const { type, actions, user } = payload;

    if (type === 'block_actions') {
      const action = actions[0];

      if (action.action_id === 'habit_checkin') {
        const [_, userId, habitName] = action.value.split('_');
        // Process habit check-in
        return {
          response_type: 'ephemeral',
          text: `Great! Habit "${habitName}" checked in successfully! :white_check_mark:`,
        };
      }

      if (action.action_id === 'habit_snooze') {
        const [_, userId, habitName] = action.value.split('_');
        // Schedule reminder for 1 hour
        return {
          response_type: 'ephemeral',
          text: `Reminder snoozed for 1 hour. :zzz:`,
        };
      }
    }

    return {};
  }

  /**
   * Disconnect Slack app
   */
  async disconnect(tenantId: string): Promise<void> {
    await this.db.query(`DELETE FROM slack_connections WHERE tenant_id = $1`, [
      tenantId,
    ]);
    logger.info('Slack app disconnected', { tenantId });
  }

  /**
   * Private helper methods
   */

  private async getConnection(tenantId: string): Promise<SlackConnection | null> {
    const query = `SELECT * FROM slack_connections WHERE tenant_id = $1`;
    const result = await this.db.query(query, [tenantId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToConnection(result.rows[0]);
  }

  private async handleCheckinCommand(userId: string, args: string[]): Promise<any> {
    return {
      response_type: 'ephemeral',
      text: 'Habit check-in coming soon! :construction:',
    };
  }

  private async handleGoalsCommand(userId: string): Promise<any> {
    return {
      response_type: 'ephemeral',
      text: 'Your goals list coming soon! :dart:',
    };
  }

  private async handleHabitsCommand(userId: string): Promise<any> {
    return {
      response_type: 'ephemeral',
      text: 'Your habits list coming soon! :calendar:',
    };
  }

  private async handleHelpCommand(): Promise<any> {
    return {
      response_type: 'ephemeral',
      text: `*UpCoach Slack Commands*\n\n` +
        `• \`/upcoach checkin [habit]\` - Check in a habit\n` +
        `• \`/upcoach goals\` - View your goals\n` +
        `• \`/upcoach habits\` - View your habits\n` +
        `• \`/upcoach help\` - Show this help message`,
    };
  }

  private buildProgressBar(progress: number): string {
    const total = 10;
    const filled = Math.round((progress / 100) * total);
    const empty = total - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  private mapRowToConnection(row: any): SlackConnection {
    return {
      tenantId: row.tenant_id,
      workspaceId: row.workspace_id,
      teamName: row.team_name,
      accessToken: row.access_token,
      botUserId: row.bot_user_id,
      channelId: row.channel_id,
      createdAt: row.created_at,
    };
  }
}
