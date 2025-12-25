import { Pool } from 'pg';
import { kafkaConsumer } from '../../infrastructure/kafka/KafkaConsumer';
import { KafkaTopic } from '../../infrastructure/kafka/topics';
import { PushNotificationTriggerService } from './PushNotificationTrigger';
import { InAppPromptService } from './InAppPromptService';
import { EmailCampaignService } from './EmailCampaignService';
import { logger } from '../../utils/logger';

/**
 * Intervention Delivery Service
 *
 * Consumes intervention events from Kafka and routes to delivery channels
 * Tracks delivery status and user responses
 */

export interface InterventionEvent {
  userId: string;
  interventionType: string;
  ruleName: string;
  metadata: {
    churnProbability?: number;
    riskTier?: string;
    features?: any;
  };
  timestamp: string;
}

export interface DeliveryResult {
  userId: string;
  interventionType: string;
  channel: 'push' | 'email' | 'in_app';
  status: 'sent' | 'failed' | 'skipped';
  deliveredAt?: Date;
  error?: string;
}

export class InterventionDeliveryService {
  private db: Pool;
  private pushService: PushNotificationTriggerService;
  private inAppService: InAppPromptService;
  private emailService: EmailCampaignService;

  constructor(
    db: Pool,
    pushService: PushNotificationTriggerService,
    inAppService: InAppPromptService,
    emailService: EmailCampaignService
  ) {
    this.db = db;
    this.pushService = pushService;
    this.inAppService = inAppService;
    this.emailService = emailService;
  }

  /**
   * Start consuming intervention events
   */
  async start(): Promise<void> {
    await kafkaConsumer.connect();

    kafkaConsumer.registerHandler(KafkaTopic.INTERVENTION_TRIGGERED, async (payload) => {
      await this.handleInterventionEvent(payload.value);
    });

    await kafkaConsumer.subscribe([KafkaTopic.INTERVENTION_TRIGGERED]);

    logger.info('Intervention Delivery Service started');
  }

  /**
   * Handle intervention event from Kafka
   */
  private async handleInterventionEvent(event: InterventionEvent): Promise<void> {
    const startTime = Date.now();

    try {
      logger.info('Processing intervention event', {
        userId: event.userId,
        interventionType: event.interventionType,
        ruleName: event.ruleName,
      });

      // Route to appropriate delivery channel(s)
      const deliveryResults = await this.routeIntervention(event);

      // Log delivery results
      await this.logDelivery(event, deliveryResults);

      const latencyMs = Date.now() - startTime;

      logger.info('Intervention delivered successfully', {
        userId: event.userId,
        interventionType: event.interventionType,
        channels: deliveryResults.map(r => r.channel),
        latencyMs,
      });
    } catch (error) {
      logger.error('Failed to deliver intervention', {
        userId: event.userId,
        interventionType: event.interventionType,
        error,
      });
    }
  }

  /**
   * Route intervention to appropriate delivery channel(s)
   */
  private async routeIntervention(event: InterventionEvent): Promise<DeliveryResult[]> {
    const results: DeliveryResult[] = [];

    switch (event.interventionType) {
      case 'motivational_push':
        results.push(await this.pushService.sendMotivationalPush(event));
        break;

      case 'in_app_coaching_prompt':
        results.push(await this.inAppService.createCoachingPrompt(event));
        break;

      case 'email_tips':
        results.push(await this.emailService.sendTipsEmail(event));
        break;

      case 'goal_coaching_prompt':
        results.push(await this.inAppService.createGoalCoachingPrompt(event));
        results.push(await this.pushService.sendGoalReminderPush(event));
        break;

      case 'reengagement_email':
        results.push(await this.emailService.sendReengagementEmail(event));
        break;

      default:
        logger.warn('Unknown intervention type', { interventionType: event.interventionType });
        results.push({
          userId: event.userId,
          interventionType: event.interventionType,
          channel: 'push',
          status: 'skipped',
          error: 'Unknown intervention type',
        });
    }

    return results;
  }

  /**
   * Log delivery results to database
   */
  private async logDelivery(
    event: InterventionEvent,
    results: DeliveryResult[]
  ): Promise<void> {
    for (const result of results) {
      const query = `
        INSERT INTO intervention_deliveries (
          user_id,
          intervention_type,
          rule_name,
          channel,
          status,
          delivered_at,
          error,
          metadata,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `;

      await this.db.query(query, [
        result.userId,
        result.interventionType,
        event.ruleName,
        result.channel,
        result.status,
        result.deliveredAt || null,
        result.error || null,
        JSON.stringify(event.metadata),
      ]);
    }
  }

  /**
   * Get user's intervention preferences
   */
  private async getUserPreferences(userId: string): Promise<{
    allowPush: boolean;
    allowEmail: boolean;
    allowInApp: boolean;
  }> {
    const query = `
      SELECT
        notification_preferences->>'push_enabled' as allow_push,
        notification_preferences->>'email_enabled' as allow_email,
        notification_preferences->>'in_app_enabled' as allow_in_app
      FROM users
      WHERE id = $1
    `;

    const result = await this.db.query(query, [userId]);
    const prefs = result.rows[0];

    return {
      allowPush: prefs?.allow_push !== 'false', // Default true
      allowEmail: prefs?.allow_email !== 'false',
      allowInApp: prefs?.allow_in_app !== 'false',
    };
  }

  /**
   * Record user response to intervention
   */
  async recordResponse(
    userId: string,
    interventionId: string,
    response: 'clicked' | 'dismissed' | 'ignored'
  ): Promise<void> {
    const query = `
      UPDATE intervention_deliveries
      SET
        user_response = $1,
        responded_at = NOW(),
        updated_at = NOW()
      WHERE id = $2 AND user_id = $3
    `;

    await this.db.query(query, [response, interventionId, userId]);

    logger.info('Intervention response recorded', {
      userId,
      interventionId,
      response,
    });
  }

  /**
   * Get intervention effectiveness metrics
   */
  async getEffectivenessMetrics(timeWindowHours: number = 24): Promise<any> {
    const query = `
      SELECT
        intervention_type,
        channel,
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE status = 'sent') as successful_deliveries,
        COUNT(*) FILTER (WHERE user_response = 'clicked') as clicks,
        COUNT(*) FILTER (WHERE user_response = 'dismissed') as dismissals,
        COUNT(*) FILTER (WHERE user_response = 'ignored') as ignored,
        COALESCE(
          CAST(COUNT(*) FILTER (WHERE user_response = 'clicked') AS FLOAT) /
          NULLIF(COUNT(*) FILTER (WHERE status = 'sent'), 0) * 100,
          0
        ) as click_through_rate
      FROM intervention_deliveries
      WHERE created_at >= NOW() - INTERVAL '${timeWindowHours} hours'
      GROUP BY intervention_type, channel
      ORDER BY total_sent DESC
    `;

    const result = await this.db.query(query);

    return {
      timeWindowHours,
      metrics: result.rows,
      generatedAt: new Date(),
    };
  }

  /**
   * Stop consuming events
   */
  async stop(): Promise<void> {
    await kafkaConsumer.disconnect();
    logger.info('Intervention Delivery Service stopped');
  }
}
