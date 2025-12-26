import axios, { AxiosInstance } from 'axios';
import { Pool } from 'pg';
import { logger } from '../utils/logger';

/**
 * Zapier Integration Service
 *
 * Integrates UpCoach with Zapier for connecting to 2,000+ apps:
 * - Webhook triggers for UpCoach events
 * - Actions for creating/updating UpCoach data
 * - Polling triggers for new data
 * - Authentication via API key
 *
 * Zapier Platform:
 * - REST Hooks (webhook subscriptions)
 * - Polling triggers (new habits, goals, check-ins)
 * - Create/Update actions
 * - Search actions
 *
 * Example Zaps:
 * - "New habit check-in" → Send Slack notification
 * - "New goal created" → Create Notion page
 * - "Goal completed" → Send email via Gmail
 */

export interface ZapierTrigger {
  id: string;
  event: string;
  targetUrl: string;
  subscriptionId: string;
  createdAt: Date;
}

export interface ZapierEvent {
  event: string;
  timestamp: string;
  data: any;
  metadata?: Record<string, any>;
}

export class ZapierService {
  private db: Pool;
  private apiClient: AxiosInstance;

  constructor(db: Pool) {
    this.db = db;
    this.apiClient = axios.create({
      baseURL: 'https://hooks.zapier.com',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Subscribe to REST Hook (Zapier trigger)
   */
  async subscribe(
    event: string,
    targetUrl: string,
    apiKey: string
  ): Promise<ZapierTrigger> {
    try {
      // Validate API key and get tenant
      const tenant = await this.validateApiKey(apiKey);

      // Create subscription
      const query = `
        INSERT INTO zapier_subscriptions (
          tenant_id, event, target_url, created_at
        )
        VALUES ($1, $2, $3, NOW())
        RETURNING id, event, target_url, created_at
      `;
      const result = await this.db.query(query, [tenant.id, event, targetUrl]);

      const subscription = {
        id: result.rows[0].id,
        event: result.rows[0].event,
        targetUrl: result.rows[0].target_url,
        subscriptionId: result.rows[0].id,
        createdAt: result.rows[0].created_at,
      };

      logger.info('Zapier subscription created', {
        tenantId: tenant.id,
        event,
        subscriptionId: subscription.id,
      });

      return subscription;
    } catch (error) {
      logger.error('Zapier subscription failed', {
        event,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Unsubscribe from REST Hook
   */
  async unsubscribe(subscriptionId: string, apiKey: string): Promise<void> {
    const tenant = await this.validateApiKey(apiKey);

    await this.db.query(
      `DELETE FROM zapier_subscriptions WHERE id = $1 AND tenant_id = $2`,
      [subscriptionId, tenant.id]
    );

    logger.info('Zapier subscription deleted', {
      tenantId: tenant.id,
      subscriptionId,
    });
  }

  /**
   * Trigger webhook for subscribers
   */
  async triggerWebhook(event: string, data: any, tenantId: string): Promise<void> {
    try {
      // Get all subscriptions for this event and tenant
      const subscriptions = await this.getSubscriptions(event, tenantId);

      if (subscriptions.length === 0) {
        logger.debug('No Zapier subscriptions for event', { event, tenantId });
        return;
      }

      // Build webhook payload
      const payload: ZapierEvent = {
        event,
        timestamp: new Date().toISOString(),
        data,
        metadata: {
          tenantId,
        },
      };

      // Send webhooks in parallel
      const webhookPromises = subscriptions.map((sub) =>
        this.sendWebhook(sub.target_url, payload)
      );

      await Promise.allSettled(webhookPromises);

      logger.info('Zapier webhooks triggered', {
        event,
        tenantId,
        count: subscriptions.length,
      });
    } catch (error) {
      logger.error('Zapier webhook trigger failed', {
        event,
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Polling trigger: Get new habits
   */
  async pollNewHabits(apiKey: string, since?: string): Promise<any[]> {
    const tenant = await this.validateApiKey(apiKey);

    const query = `
      SELECT * FROM habits
      WHERE tenant_id = $1
        ${since ? `AND created_at > $2` : ''}
      ORDER BY created_at DESC
      LIMIT 100
    `;
    const params = since ? [tenant.id, since] : [tenant.id];
    const result = await this.db.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      frequency: row.frequency,
      userId: row.user_id,
      createdAt: row.created_at,
    }));
  }

  /**
   * Polling trigger: Get new goals
   */
  async pollNewGoals(apiKey: string, since?: string): Promise<any[]> {
    const tenant = await this.validateApiKey(apiKey);

    const query = `
      SELECT * FROM goals
      WHERE tenant_id = $1
        ${since ? `AND created_at > $2` : ''}
      ORDER BY created_at DESC
      LIMIT 100
    `;
    const params = since ? [tenant.id, since] : [tenant.id];
    const result = await this.db.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      targetDate: row.target_date,
      userId: row.user_id,
      createdAt: row.created_at,
    }));
  }

  /**
   * Action: Create habit
   */
  async createHabit(
    apiKey: string,
    habitData: {
      userId: string;
      name: string;
      description?: string;
      frequency: string;
    }
  ): Promise<any> {
    const tenant = await this.validateApiKey(apiKey);

    const query = `
      INSERT INTO habits (tenant_id, user_id, name, description, frequency, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const result = await this.db.query(query, [
      tenant.id,
      habitData.userId,
      habitData.name,
      habitData.description,
      habitData.frequency,
    ]);

    logger.info('Habit created via Zapier', {
      tenantId: tenant.id,
      habitId: result.rows[0].id,
    });

    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      frequency: result.rows[0].frequency,
    };
  }

  /**
   * Action: Create goal
   */
  async createGoal(
    apiKey: string,
    goalData: {
      userId: string;
      title: string;
      description?: string;
      targetDate?: string;
    }
  ): Promise<any> {
    const tenant = await this.validateApiKey(apiKey);

    const query = `
      INSERT INTO goals (tenant_id, user_id, title, description, target_date, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const result = await this.db.query(query, [
      tenant.id,
      goalData.userId,
      goalData.title,
      goalData.description,
      goalData.targetDate,
    ]);

    logger.info('Goal created via Zapier', {
      tenantId: tenant.id,
      goalId: result.rows[0].id,
    });

    return {
      id: result.rows[0].id,
      title: result.rows[0].title,
      description: result.rows[0].description,
      targetDate: result.rows[0].target_date,
    };
  }

  /**
   * Search: Find user by email
   */
  async searchUserByEmail(apiKey: string, email: string): Promise<any | null> {
    const tenant = await this.validateApiKey(apiKey);

    const query = `
      SELECT * FROM users
      WHERE tenant_id = $1 AND email = $2
    `;
    const result = await this.db.query(query, [tenant.id, email]);

    if (result.rows.length === 0) {
      return null;
    }

    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      firstName: result.rows[0].first_name,
      lastName: result.rows[0].last_name,
      createdAt: result.rows[0].created_at,
    };
  }

  /**
   * Private helper methods
   */

  private async validateApiKey(apiKey: string): Promise<{ id: string }> {
    const query = `
      SELECT tenant_id FROM api_keys
      WHERE key_hash = $1 AND active = true
    `;
    const result = await this.db.query(query, [apiKey]);

    if (result.rows.length === 0) {
      throw new Error('Invalid API key');
    }

    return { id: result.rows[0].tenant_id };
  }

  private async getSubscriptions(
    event: string,
    tenantId: string
  ): Promise<Array<{ target_url: string }>> {
    const query = `
      SELECT target_url FROM zapier_subscriptions
      WHERE event = $1 AND tenant_id = $2
    `;
    const result = await this.db.query(query, [event, tenantId]);
    return result.rows;
  }

  private async sendWebhook(targetUrl: string, payload: ZapierEvent): Promise<void> {
    try {
      await this.apiClient.post(targetUrl, payload);
      logger.debug('Zapier webhook sent', { targetUrl });
    } catch (error) {
      logger.error('Zapier webhook failed', {
        targetUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
