/**
 * UpCoachBot - Lark bot for UpCoach system commands and notifications
 * Handles slash commands and provides system status, coach info, sessions, etc.
 */

import { LarkClient } from '../client/LarkClient';
import type {
  BotCommand,
  CommandContext,
  InteractiveMessage,
  MessageReceivedEvent,
  CardElement,
} from '../types';

export interface UpCoachBotConfig {
  larkClient: LarkClient;
  commandPrefix?: string;
  onError?: (error: Error, context: CommandContext) => void;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  services: Array<{
    name: string;
    status: 'up' | 'down' | 'degraded';
    latency?: number;
  }>;
  lastChecked: Date;
}

export interface CoachOverview {
  totalCoaches: number;
  activeCoaches: number;
  pendingOnboarding: number;
  topCoaches: Array<{
    name: string;
    clientCount: number;
    avgRating: number;
  }>;
}

export interface SessionOverview {
  todaySessions: number;
  upcomingSessions: Array<{
    coachName: string;
    clientName: string;
    startTime: Date;
    type: string;
  }>;
  completedToday: number;
  noShowCount: number;
}

export interface ClientOverview {
  totalClients: number;
  newThisWeek: number;
  activeSubscriptions: number;
  recentSignups: Array<{
    name: string;
    email: string;
    signupDate: Date;
    plan: string;
  }>;
}

export interface AlertSummary {
  criticalCount: number;
  warningCount: number;
  recentAlerts: Array<{
    level: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: Date;
    source: string;
  }>;
}

export interface RevenueSummary {
  dailyMRR: number;
  monthlyMRR: number;
  mrrChange: number;
  newSubscriptions: number;
  churnedSubscriptions: number;
  currency: string;
}

export type DataFetcher = {
  getSystemHealth: () => Promise<SystemHealth>;
  getCoachOverview: () => Promise<CoachOverview>;
  getSessionOverview: () => Promise<SessionOverview>;
  getClientOverview: () => Promise<ClientOverview>;
  getAlertSummary: () => Promise<AlertSummary>;
  getRevenueSummary: () => Promise<RevenueSummary>;
};

export class UpCoachBot {
  private readonly client: LarkClient;
  private readonly commandPrefix: string;
  private readonly commands: Map<string, BotCommand> = new Map();
  private readonly onError?: (error: Error, context: CommandContext) => void;
  private dataFetcher?: DataFetcher;

  constructor(config: UpCoachBotConfig) {
    this.client = config.larkClient;
    this.commandPrefix = config.commandPrefix || '/upcoach';
    this.onError = config.onError;

    // Register default commands
    this.registerDefaultCommands();
  }

  /**
   * Set data fetcher for dynamic data
   */
  setDataFetcher(fetcher: DataFetcher): void {
    this.dataFetcher = fetcher;
  }

  /**
   * Register a custom command
   */
  registerCommand(command: BotCommand): void {
    this.commands.set(command.name.toLowerCase(), command);
  }

  /**
   * Handle incoming message event
   */
  async handleMessage(event: MessageReceivedEvent): Promise<void> {
    const { message, sender } = event.event;

    // Only handle text messages
    if (message.message_type !== 'text') {
      return;
    }

    // Parse message content
    let content: { text: string };
    try {
      content = JSON.parse(message.content);
    } catch {
      return;
    }

    const text = content.text.trim();

    // Check if message starts with command prefix
    if (!text.toLowerCase().startsWith(this.commandPrefix)) {
      return;
    }

    // Parse command and arguments
    const parts = text.slice(this.commandPrefix.length).trim().split(/\s+/);
    const commandName = parts[0]?.toLowerCase() || 'help';
    const args = parts.slice(1);

    const context: CommandContext = {
      command: commandName,
      args,
      rawText: text,
      userId: sender.sender_id.open_id || sender.sender_id.user_id || '',
      chatId: message.chat_id,
      chatType: message.chat_type,
      messageId: message.message_id,
      tenantKey: sender.tenant_key || '',
    };

    try {
      const command = this.commands.get(commandName);
      if (!command) {
        await this.sendHelpMessage(context);
        return;
      }

      const response = await command.handler(context);

      if (typeof response === 'string') {
        await this.client.replyMessage(message.message_id, 'text', { text: response });
      } else {
        await this.client.replyMessage(message.message_id, 'interactive', response);
      }
    } catch (error) {
      if (this.onError) {
        this.onError(error as Error, context);
      }
      await this.client.replyMessage(message.message_id, 'text', {
        text: `Error executing command: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Register default UpCoach commands
   */
  private registerDefaultCommands(): void {
    // Help command
    this.registerCommand({
      name: 'help',
      description: 'Show available commands',
      handler: async () => this.buildHelpCard(),
    });

    // Status command
    this.registerCommand({
      name: 'status',
      description: 'Show system health status',
      handler: async () => {
        if (!this.dataFetcher) {
          return 'Data fetcher not configured. Please set up the data fetcher.';
        }
        const health = await this.dataFetcher.getSystemHealth();
        return this.buildStatusCard(health);
      },
    });

    // Coaches command
    this.registerCommand({
      name: 'coaches',
      description: 'Show coach overview',
      handler: async () => {
        if (!this.dataFetcher) {
          return 'Data fetcher not configured. Please set up the data fetcher.';
        }
        const overview = await this.dataFetcher.getCoachOverview();
        return this.buildCoachesCard(overview);
      },
    });

    // Sessions command
    this.registerCommand({
      name: 'sessions',
      description: "Show today's sessions",
      handler: async () => {
        if (!this.dataFetcher) {
          return 'Data fetcher not configured. Please set up the data fetcher.';
        }
        const sessions = await this.dataFetcher.getSessionOverview();
        return this.buildSessionsCard(sessions);
      },
    });

    // Clients command
    this.registerCommand({
      name: 'clients',
      description: 'Show client overview and recent signups',
      handler: async () => {
        if (!this.dataFetcher) {
          return 'Data fetcher not configured. Please set up the data fetcher.';
        }
        const clients = await this.dataFetcher.getClientOverview();
        return this.buildClientsCard(clients);
      },
    });

    // Alerts command
    this.registerCommand({
      name: 'alerts',
      description: 'Show ML/Security alerts',
      handler: async () => {
        if (!this.dataFetcher) {
          return 'Data fetcher not configured. Please set up the data fetcher.';
        }
        const alerts = await this.dataFetcher.getAlertSummary();
        return this.buildAlertsCard(alerts);
      },
    });

    // Revenue command
    this.registerCommand({
      name: 'revenue',
      description: 'Show daily MRR summary',
      handler: async () => {
        if (!this.dataFetcher) {
          return 'Data fetcher not configured. Please set up the data fetcher.';
        }
        const revenue = await this.dataFetcher.getRevenueSummary();
        return this.buildRevenueCard(revenue);
      },
    });
  }

  /**
   * Send help message for unknown commands
   */
  private async sendHelpMessage(context: CommandContext): Promise<void> {
    const helpCard = this.buildHelpCard();
    await this.client.replyMessage(context.messageId, 'interactive', helpCard);
  }

  /**
   * Build help card
   */
  private buildHelpCard(): InteractiveMessage {
    const commandList = Array.from(this.commands.values())
      .map((cmd) => `**${this.commandPrefix} ${cmd.name}** - ${cmd.description}`)
      .join('\n');

    return {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: 'UpCoach Bot Commands' },
        template: 'blue',
      },
      elements: [
        {
          tag: 'markdown',
          content: commandList,
        } as CardElement,
        { tag: 'hr' } as CardElement,
        {
          tag: 'note',
          elements: [
            { tag: 'plain_text', content: 'Type any command to get started!' },
          ],
        } as CardElement,
      ],
    };
  }

  /**
   * Build system status card
   */
  private buildStatusCard(health: SystemHealth): InteractiveMessage {
    const statusEmoji = health.status === 'healthy' ? '🟢' : health.status === 'degraded' ? '🟡' : '🔴';
    const uptimeHours = Math.floor(health.uptime / 3600);
    const uptimeMins = Math.floor((health.uptime % 3600) / 60);

    const serviceStatus = health.services
      .map((s) => {
        const emoji = s.status === 'up' ? '✅' : s.status === 'degraded' ? '⚠️' : '❌';
        const latency = s.latency ? ` (${s.latency}ms)` : '';
        return `${emoji} **${s.name}**${latency}`;
      })
      .join('\n');

    return {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: `${statusEmoji} System Status` },
        template: health.status === 'healthy' ? 'green' : health.status === 'degraded' ? 'yellow' : 'red',
      },
      elements: [
        {
          tag: 'div',
          fields: [
            { is_short: true, text: { tag: 'lark_md', content: `**Status:** ${health.status.toUpperCase()}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**Uptime:** ${uptimeHours}h ${uptimeMins}m` } },
          ],
        } as CardElement,
        { tag: 'hr' } as CardElement,
        {
          tag: 'markdown',
          content: `**Services:**\n${serviceStatus}`,
        } as CardElement,
        {
          tag: 'note',
          elements: [
            { tag: 'plain_text', content: `Last checked: ${health.lastChecked.toLocaleString()}` },
          ],
        } as CardElement,
      ],
    };
  }

  /**
   * Build coaches overview card
   */
  private buildCoachesCard(overview: CoachOverview): InteractiveMessage {
    const topCoachesText = overview.topCoaches
      .slice(0, 5)
      .map((c, i) => `${i + 1}. **${c.name}** - ${c.clientCount} clients (⭐ ${c.avgRating.toFixed(1)})`)
      .join('\n');

    return {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: '👨‍🏫 Coach Overview' },
        template: 'blue',
      },
      elements: [
        {
          tag: 'div',
          fields: [
            { is_short: true, text: { tag: 'lark_md', content: `**Total Coaches:** ${overview.totalCoaches}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**Active:** ${overview.activeCoaches}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**Pending Onboarding:** ${overview.pendingOnboarding}` } },
          ],
        } as CardElement,
        { tag: 'hr' } as CardElement,
        {
          tag: 'markdown',
          content: `**Top Coaches:**\n${topCoachesText || 'No coaches yet'}`,
        } as CardElement,
      ],
    };
  }

  /**
   * Build sessions overview card
   */
  private buildSessionsCard(sessions: SessionOverview): InteractiveMessage {
    const upcomingText = sessions.upcomingSessions
      .slice(0, 5)
      .map((s) => {
        const time = s.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `• **${time}** - ${s.coachName} with ${s.clientName} (${s.type})`;
      })
      .join('\n');

    return {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: "📅 Today's Sessions" },
        template: 'turquoise',
      },
      elements: [
        {
          tag: 'div',
          fields: [
            { is_short: true, text: { tag: 'lark_md', content: `**Total Today:** ${sessions.todaySessions}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**Completed:** ${sessions.completedToday}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**No-shows:** ${sessions.noShowCount}` } },
          ],
        } as CardElement,
        { tag: 'hr' } as CardElement,
        {
          tag: 'markdown',
          content: `**Upcoming Sessions:**\n${upcomingText || 'No upcoming sessions'}`,
        } as CardElement,
      ],
    };
  }

  /**
   * Build clients overview card
   */
  private buildClientsCard(clients: ClientOverview): InteractiveMessage {
    const recentText = clients.recentSignups
      .slice(0, 5)
      .map((c) => {
        const date = c.signupDate.toLocaleDateString();
        return `• **${c.name}** (${c.plan}) - ${date}`;
      })
      .join('\n');

    return {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: '👥 Client Overview' },
        template: 'purple',
      },
      elements: [
        {
          tag: 'div',
          fields: [
            { is_short: true, text: { tag: 'lark_md', content: `**Total Clients:** ${clients.totalClients}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**New This Week:** ${clients.newThisWeek}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**Active Subs:** ${clients.activeSubscriptions}` } },
          ],
        } as CardElement,
        { tag: 'hr' } as CardElement,
        {
          tag: 'markdown',
          content: `**Recent Signups:**\n${recentText || 'No recent signups'}`,
        } as CardElement,
      ],
    };
  }

  /**
   * Build alerts card
   */
  private buildAlertsCard(alerts: AlertSummary): InteractiveMessage {
    const alertText = alerts.recentAlerts
      .slice(0, 10)
      .map((a) => {
        const emoji = a.level === 'critical' ? '🔴' : a.level === 'warning' ? '🟡' : 'ℹ️';
        const time = a.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${emoji} **[${time}]** ${a.message} _(${a.source})_`;
      })
      .join('\n');

    const headerTemplate = alerts.criticalCount > 0 ? 'red' : alerts.warningCount > 0 ? 'yellow' : 'green';

    return {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: '🚨 System Alerts' },
        template: headerTemplate,
      },
      elements: [
        {
          tag: 'div',
          fields: [
            { is_short: true, text: { tag: 'lark_md', content: `**Critical:** ${alerts.criticalCount}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**Warning:** ${alerts.warningCount}` } },
          ],
        } as CardElement,
        { tag: 'hr' } as CardElement,
        {
          tag: 'markdown',
          content: alertText || '✅ No recent alerts',
        } as CardElement,
      ],
    };
  }

  /**
   * Build revenue summary card
   */
  private buildRevenueCard(revenue: RevenueSummary): InteractiveMessage {
    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: revenue.currency,
      }).format(amount);

    const changeEmoji = revenue.mrrChange >= 0 ? '📈' : '📉';
    const changeText = `${revenue.mrrChange >= 0 ? '+' : ''}${revenue.mrrChange.toFixed(1)}%`;

    return {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: '💰 Revenue Summary' },
        template: 'green',
      },
      elements: [
        {
          tag: 'div',
          fields: [
            { is_short: true, text: { tag: 'lark_md', content: `**Daily MRR:** ${formatCurrency(revenue.dailyMRR)}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**Monthly MRR:** ${formatCurrency(revenue.monthlyMRR)}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**MRR Change:** ${changeEmoji} ${changeText}` } },
          ],
        } as CardElement,
        { tag: 'hr' } as CardElement,
        {
          tag: 'div',
          fields: [
            { is_short: true, text: { tag: 'lark_md', content: `**New Subs:** +${revenue.newSubscriptions}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**Churned:** -${revenue.churnedSubscriptions}` } },
          ],
        } as CardElement,
      ],
    };
  }

  /**
   * Get the Lark client instance
   */
  getLarkClient(): LarkClient {
    return this.client;
  }
}
