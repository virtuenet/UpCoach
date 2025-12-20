/**
 * LarkService - API service for Lark integration
 * Provides data fetching for UpCoach bot commands and notifications
 */

import { Op } from 'sequelize';

import { logger } from '../../utils/logger';
import {
  LarkClient,
  UpCoachBot,
  NotificationPublisher,
  LarkWebhookHandler,
  type DataFetcher,
  type SystemHealth,
  type CoachOverview,
  type SessionOverview,
  type ClientOverview,
  type AlertSummary,
  type RevenueSummary,
  type LarkConfig,
  type MessageReceivedEvent,
  type WebhookRequest,
  type WebhookResponse,
} from '@upcoach/lark-sdk';

export interface LarkServiceConfig {
  appId: string;
  appSecret: string;
  encryptKey?: string;
  verificationToken?: string;
  defaultChatId?: string;
  environment?: string;
}

export class LarkService implements DataFetcher {
  private readonly client: LarkClient;
  private readonly bot: UpCoachBot;
  private readonly publisher: NotificationPublisher;
  private readonly webhookHandler: LarkWebhookHandler;
  private readonly config: LarkServiceConfig;

  constructor(config: LarkServiceConfig) {
    this.config = config;

    // Initialize Lark client
    this.client = new LarkClient({
      appId: config.appId,
      appSecret: config.appSecret,
      encryptKey: config.encryptKey,
      verificationToken: config.verificationToken,
    });

    // Initialize bot with data fetcher
    this.bot = new UpCoachBot({
      larkClient: this.client,
      commandPrefix: '/upcoach',
      onError: (error, context) => {
        logger.error('UpCoach bot error', {
          error: error.message,
          command: context.command,
          userId: context.userId,
          chatId: context.chatId,
        });
      },
    });
    this.bot.setDataFetcher(this);

    // Initialize notification publisher
    this.publisher = new NotificationPublisher({
      larkClient: this.client,
      defaultChatId: config.defaultChatId,
      appName: 'UpCoach',
      environment: config.environment || 'production',
    });

    // Initialize webhook handler
    this.webhookHandler = new LarkWebhookHandler({
      verificationToken: config.verificationToken || '',
      encryptKey: config.encryptKey,
    });

    // Register message handler
    this.webhookHandler.onMessage(async (event: MessageReceivedEvent) => {
      await this.bot.handleMessage(event);
    });

    logger.info('LarkService initialized', {
      appId: config.appId,
      environment: config.environment,
    });
  }

  // ============================================================================
  // Webhook Handling
  // ============================================================================

  /**
   * Handle incoming webhook request
   */
  async handleWebhook(request: WebhookRequest): Promise<WebhookResponse> {
    return this.webhookHandler.handle(request);
  }

  // ============================================================================
  // Data Fetcher Implementation
  // ============================================================================

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    // In a real implementation, this would check actual services
    // For now, return mock data that shows the structure
    const services: Array<{ name: string; status: 'up' | 'down' | 'degraded'; latency: number }> = [
      { name: 'API Server', status: 'up', latency: 45 },
      { name: 'Database', status: 'up', latency: 12 },
      { name: 'Redis Cache', status: 'up', latency: 3 },
      { name: 'AI Service', status: 'up', latency: 250 },
      { name: 'Storage', status: 'up', latency: 85 },
    ];

    const hasDownServices = services.some((s) => s.status === 'down');
    const hasDegradedServices = services.some((s) => s.status === 'degraded');

    return {
      status: hasDownServices ? 'unhealthy' : hasDegradedServices ? 'degraded' : 'healthy',
      uptime: Math.floor(process.uptime()),
      services,
      lastChecked: new Date(),
    };
  }

  /**
   * Get coach overview
   */
  async getCoachOverview(): Promise<CoachOverview> {
    // In a real implementation, this would query the database
    // Placeholder structure showing expected data
    try {
      // TODO: Replace with actual database queries
      // const coaches = await Coach.findAll({ where: { isActive: true } });
      // const pendingCoaches = await Coach.count({ where: { status: 'pending_onboarding' } });

      return {
        totalCoaches: 42,
        activeCoaches: 38,
        pendingOnboarding: 4,
        topCoaches: [
          { name: 'Sarah Johnson', clientCount: 25, avgRating: 4.9 },
          { name: 'Michael Chen', clientCount: 22, avgRating: 4.8 },
          { name: 'Emily Davis', clientCount: 20, avgRating: 4.8 },
          { name: 'James Wilson', clientCount: 18, avgRating: 4.7 },
          { name: 'Lisa Anderson', clientCount: 16, avgRating: 4.7 },
        ],
      };
    } catch (error) {
      logger.error('Failed to fetch coach overview', { error });
      throw error;
    }
  }

  /**
   * Get today's session overview
   */
  async getSessionOverview(): Promise<SessionOverview> {
    try {
      // TODO: Replace with actual database queries
      // const today = new Date();
      // const sessions = await Session.findAll({
      //   where: { date: { [Op.gte]: startOfDay(today), [Op.lt]: endOfDay(today) } }
      // });

      const now = new Date();

      return {
        todaySessions: 28,
        upcomingSessions: [
          {
            coachName: 'Sarah Johnson',
            clientName: 'John Doe',
            startTime: new Date(now.getTime() + 30 * 60000),
            type: 'Career',
          },
          {
            coachName: 'Michael Chen',
            clientName: 'Jane Smith',
            startTime: new Date(now.getTime() + 60 * 60000),
            type: 'Life',
          },
          {
            coachName: 'Emily Davis',
            clientName: 'Bob Wilson',
            startTime: new Date(now.getTime() + 90 * 60000),
            type: 'Fitness',
          },
        ],
        completedToday: 15,
        noShowCount: 2,
      };
    } catch (error) {
      logger.error('Failed to fetch session overview', { error });
      throw error;
    }
  }

  /**
   * Get client overview
   */
  async getClientOverview(): Promise<ClientOverview> {
    try {
      // TODO: Replace with actual database queries
      // const clients = await User.count({ where: { role: 'client' } });
      // const newThisWeek = await User.count({
      //   where: { role: 'client', createdAt: { [Op.gte]: subDays(new Date(), 7) } }
      // });

      const now = new Date();

      return {
        totalClients: 523,
        newThisWeek: 18,
        activeSubscriptions: 412,
        recentSignups: [
          {
            name: 'Alice Brown',
            email: 'alice@example.com',
            signupDate: new Date(now.getTime() - 2 * 60 * 60000),
            plan: 'PRO',
          },
          {
            name: 'Charlie Davis',
            email: 'charlie@example.com',
            signupDate: new Date(now.getTime() - 5 * 60 * 60000),
            plan: 'BASIC',
          },
          {
            name: 'Diana Evans',
            email: 'diana@example.com',
            signupDate: new Date(now.getTime() - 8 * 60 * 60000),
            plan: 'FREE',
          },
        ],
      };
    } catch (error) {
      logger.error('Failed to fetch client overview', { error });
      throw error;
    }
  }

  /**
   * Get alert summary
   */
  async getAlertSummary(): Promise<AlertSummary> {
    try {
      // TODO: Replace with actual alert/monitoring queries
      // const alerts = await Alert.findAll({
      //   where: { createdAt: { [Op.gte]: subHours(new Date(), 24) } },
      //   order: [['createdAt', 'DESC']],
      //   limit: 10,
      // });

      const now = new Date();

      return {
        criticalCount: 0,
        warningCount: 2,
        recentAlerts: [
          {
            level: 'warning',
            message: 'High API latency detected (>500ms)',
            timestamp: new Date(now.getTime() - 30 * 60000),
            source: 'API Monitor',
          },
          {
            level: 'info',
            message: 'New model deployment completed',
            timestamp: new Date(now.getTime() - 2 * 60 * 60000),
            source: 'ML Pipeline',
          },
        ],
      };
    } catch (error) {
      logger.error('Failed to fetch alert summary', { error });
      throw error;
    }
  }

  /**
   * Get revenue summary
   */
  async getRevenueSummary(): Promise<RevenueSummary> {
    try {
      // TODO: Replace with actual financial queries
      // This would integrate with the FinancialService

      return {
        dailyMRR: 2450.0,
        monthlyMRR: 73500.0,
        mrrChange: 3.2,
        newSubscriptions: 8,
        churnedSubscriptions: 2,
        currency: 'USD',
      };
    } catch (error) {
      logger.error('Failed to fetch revenue summary', { error });
      throw error;
    }
  }

  // ============================================================================
  // Notification Methods
  // ============================================================================

  /**
   * Get the notification publisher for sending alerts
   */
  getNotificationPublisher(): NotificationPublisher {
    return this.publisher;
  }

  /**
   * Get the Lark client for direct API access
   */
  getLarkClient(): LarkClient {
    return this.client;
  }

  /**
   * Get the bot instance
   */
  getBot(): UpCoachBot {
    return this.bot;
  }
}

// ============================================================================
// Singleton Instance Management
// ============================================================================

let larkServiceInstance: LarkService | null = null;

/**
 * Initialize the Lark service singleton
 */
export function initializeLarkService(config: LarkServiceConfig): LarkService {
  if (!larkServiceInstance) {
    larkServiceInstance = new LarkService(config);
  }
  return larkServiceInstance;
}

/**
 * Get the Lark service singleton instance
 */
export function getLarkService(): LarkService | null {
  return larkServiceInstance;
}

/**
 * Check if Lark service is configured
 */
export function isLarkConfigured(): boolean {
  return !!(process.env.LARK_APP_ID && process.env.LARK_APP_SECRET);
}
