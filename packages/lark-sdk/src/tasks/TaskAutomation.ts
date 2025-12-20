/**
 * Task Automation
 * Automatically creates Lark tasks based on UpCoach events
 */

import { LarkClient } from '../client/LarkClient';
import { NotificationPublisher } from '../notifications/NotificationPublisher';

// ============================================================================
// Types
// ============================================================================

export interface TaskConfig {
  defaultAssignees: {
    hrManager?: string;
    supportLead?: string;
    coachSuccess?: string;
    customerSuccess?: string;
    finance?: string;
  };
  taskGroupId?: string;
  notificationChatId?: string;
}

export interface LarkTask {
  summary: string;
  description?: string;
  due?: {
    date?: string;
    timestamp?: string;
    is_all_day?: boolean;
    timezone?: string;
  };
  origin?: {
    platform_i18n_name?: {
      zh_cn?: string;
      en_us?: string;
    };
    href?: {
      url?: string;
      title?: string;
    };
  };
  extra?: string;
  completed_at?: string;
  members?: Array<{
    id?: string;
    type?: 'user';
    role?: 'assignee' | 'follower';
  }>;
  repeat_rule?: string;
  custom_complete?: {
    pc?: {
      href?: string;
      tip?: {
        zh_cn?: string;
        en_us?: string;
      };
    };
    ios?: {
      href?: string;
      tip?: {
        zh_cn?: string;
        en_us?: string;
      };
    };
    android?: {
      href?: string;
      tip?: {
        zh_cn?: string;
        en_us?: string;
      };
    };
  };
  tasklists?: Array<{
    tasklist_guid?: string;
    section_guid?: string;
  }>;
  client_token?: string;
  start?: {
    timestamp?: string;
    is_all_day?: boolean;
    timezone?: string;
  };
  reminders?: Array<{
    relative_fire_minute: number;
  }>;
  mode?: number;
  is_milestone?: boolean;
  custom_fields?: Array<{
    guid: string;
    text_value?: string;
    number_value?: string;
    member_value?: Array<{
      id: string;
      type: string;
    }>;
    datetime_value?: string;
    single_select_value?: string;
    multi_select_value?: string[];
  }>;
  docx_source?: {
    token: string;
    block_id: string;
  };
}

export interface TaskCreationResult {
  success: boolean;
  taskId?: string;
  error?: string;
}

export interface EventPayload {
  eventType: string;
  data: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Event Types
// ============================================================================

export interface CoachSignupEvent {
  coachId: string;
  coachName: string;
  email: string;
  specializations: string[];
  signupDate: Date;
}

export interface ClientComplaintEvent {
  ticketId: string;
  clientId: string;
  clientName: string;
  coachId?: string;
  coachName?: string;
  category: string;
  priority: string;
  subject: string;
  description: string;
}

export interface SessionNoShowEvent {
  sessionId: string;
  coachId: string;
  coachName: string;
  clientId: string;
  clientName: string;
  scheduledAt: Date;
  sessionType: string;
}

export interface SubscriptionCancellationEvent {
  subscriptionId: string;
  userId: string;
  userName: string;
  email: string;
  plan: string;
  reason?: string;
  cancelledAt: Date;
  effectiveDate: Date;
}

export interface PayoutPendingEvent {
  payoutId: string;
  coachId: string;
  coachName: string;
  amount: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  sessionCount: number;
}

export interface MilestoneReachedEvent {
  userId: string;
  userName: string;
  userType: 'coach' | 'client';
  milestoneType: 'sessions' | 'revenue' | 'clients' | 'goals';
  milestoneValue: number;
  achievedAt: Date;
}

export interface GoalAchievedEvent {
  goalId: string;
  clientId: string;
  clientName: string;
  coachId: string;
  coachName: string;
  goalTitle: string;
  completedAt: Date;
}

// ============================================================================
// Task Automation Implementation
// ============================================================================

export class TaskAutomation {
  private readonly client: LarkClient;
  private readonly notifier: NotificationPublisher;
  private readonly config: TaskConfig;

  constructor(client: LarkClient, config: TaskConfig) {
    this.client = client;
    this.config = config;
    this.notifier = new NotificationPublisher({
      larkClient: client,
      defaultChatId: config.notificationChatId,
    });
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle new coach signup
   */
  async onCoachSignup(event: CoachSignupEvent): Promise<TaskCreationResult> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // 3 days to complete onboarding

    const task = await this.createTask({
      summary: `Complete onboarding for new coach: ${event.coachName}`,
      description: `New coach signup requires onboarding:\n\n` +
        `**Coach:** ${event.coachName}\n` +
        `**Email:** ${event.email}\n` +
        `**Specializations:** ${event.specializations.join(', ')}\n` +
        `**Signup Date:** ${event.signupDate.toISOString()}\n\n` +
        `Onboarding checklist:\n` +
        `- [ ] Verify credentials\n` +
        `- [ ] Review profile\n` +
        `- [ ] Schedule welcome call\n` +
        `- [ ] Send platform guide\n` +
        `- [ ] Activate account`,
      assigneeId: this.config.defaultAssignees.hrManager,
      dueDate,
      priority: 'medium',
      tags: ['onboarding', 'coach'],
    });

    // Send notification
    await this.notifier.sendCoachingEvent({
      type: 'coach_onboarded',
      coachName: event.coachName,
      details: `New coach ${event.coachName} has signed up and requires onboarding.`,
    });

    return task;
  }

  /**
   * Handle client complaint
   */
  async onClientComplaint(event: ClientComplaintEvent): Promise<TaskCreationResult> {
    const dueDate = new Date();
    // Set due date based on priority
    switch (event.priority) {
      case 'urgent':
        dueDate.setHours(dueDate.getHours() + 4);
        break;
      case 'high':
        dueDate.setDate(dueDate.getDate() + 1);
        break;
      case 'medium':
        dueDate.setDate(dueDate.getDate() + 2);
        break;
      default:
        dueDate.setDate(dueDate.getDate() + 5);
    }

    const task = await this.createTask({
      summary: `[${event.priority.toUpperCase()}] Review complaint: ${event.subject}`,
      description: `Client complaint requires review:\n\n` +
        `**Ticket ID:** ${event.ticketId}\n` +
        `**Client:** ${event.clientName}\n` +
        `**Category:** ${event.category}\n` +
        `**Priority:** ${event.priority}\n` +
        (event.coachName ? `**Related Coach:** ${event.coachName}\n` : '') +
        `\n**Description:**\n${event.description}\n\n` +
        `Please review and respond to the client.`,
      assigneeId: this.config.defaultAssignees.supportLead,
      dueDate,
      priority: event.priority as 'low' | 'medium' | 'high' | 'urgent',
      tags: ['support', 'complaint', event.category],
    });

    return task;
  }

  /**
   * Handle session no-show
   */
  async onSessionNoShow(event: SessionNoShowEvent): Promise<TaskCreationResult> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1); // Follow up within 24 hours

    const task = await this.createTask({
      summary: `Follow up on session no-show: ${event.clientName}`,
      description: `A coaching session was marked as no-show:\n\n` +
        `**Session ID:** ${event.sessionId}\n` +
        `**Client:** ${event.clientName}\n` +
        `**Coach:** ${event.coachName}\n` +
        `**Scheduled Time:** ${event.scheduledAt.toISOString()}\n` +
        `**Session Type:** ${event.sessionType}\n\n` +
        `Action items:\n` +
        `- [ ] Contact client to understand reason\n` +
        `- [ ] Reschedule if appropriate\n` +
        `- [ ] Update session status\n` +
        `- [ ] Notify coach of outcome`,
      assigneeId: this.config.defaultAssignees.coachSuccess,
      dueDate,
      priority: 'medium',
      tags: ['session', 'no-show', 'follow-up'],
    });

    // Send notification
    await this.notifier.sendCoachingEvent({
      type: 'session_no_show',
      clientName: event.clientName,
      coachName: event.coachName,
      details: `Session no-show for ${event.clientName} with coach ${event.coachName}. Follow-up task created.`,
    });

    return task;
  }

  /**
   * Handle subscription cancellation
   */
  async onSubscriptionCancellation(event: SubscriptionCancellationEvent): Promise<TaskCreationResult> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2); // 2 days for retention outreach

    const task = await this.createTask({
      summary: `Retention outreach: ${event.userName} cancelled ${event.plan}`,
      description: `A subscription has been cancelled:\n\n` +
        `**User:** ${event.userName}\n` +
        `**Email:** ${event.email}\n` +
        `**Plan:** ${event.plan}\n` +
        `**Cancelled At:** ${event.cancelledAt.toISOString()}\n` +
        `**Effective Date:** ${event.effectiveDate.toISOString()}\n` +
        (event.reason ? `**Reason:** ${event.reason}\n` : '') +
        `\nRetention actions:\n` +
        `- [ ] Review user's history and usage\n` +
        `- [ ] Identify potential win-back offers\n` +
        `- [ ] Send personalized outreach email\n` +
        `- [ ] Schedule call if appropriate\n` +
        `- [ ] Document outcome`,
      assigneeId: this.config.defaultAssignees.customerSuccess,
      dueDate,
      priority: 'high',
      tags: ['retention', 'cancellation', event.plan],
    });

    // Send billing alert
    await this.notifier.sendBillingAlert({
      type: 'subscription_canceled',
      userId: event.userId,
      userName: event.userName,
      email: event.email,
      planName: event.plan,
    });

    return task;
  }

  /**
   * Handle payout pending
   */
  async onPayoutPending(event: PayoutPendingEvent): Promise<TaskCreationResult> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // Process within 3 days

    const task = await this.createTask({
      summary: `Process payout for ${event.coachName}: ${event.currency} ${event.amount.toFixed(2)}`,
      description: `Coach payout requires processing:\n\n` +
        `**Payout ID:** ${event.payoutId}\n` +
        `**Coach:** ${event.coachName}\n` +
        `**Amount:** ${event.currency} ${event.amount.toFixed(2)}\n` +
        `**Period:** ${event.periodStart.toISOString()} - ${event.periodEnd.toISOString()}\n` +
        `**Sessions:** ${event.sessionCount}\n\n` +
        `Processing steps:\n` +
        `- [ ] Verify session count\n` +
        `- [ ] Confirm payment details\n` +
        `- [ ] Process payment\n` +
        `- [ ] Update payout status\n` +
        `- [ ] Notify coach`,
      assigneeId: this.config.defaultAssignees.finance,
      dueDate,
      priority: 'high',
      tags: ['finance', 'payout'],
    });

    return task;
  }

  /**
   * Handle milestone reached
   */
  async onMilestoneReached(event: MilestoneReachedEvent): Promise<TaskCreationResult> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);

    const milestoneDescriptions: Record<string, string> = {
      sessions: `completed ${event.milestoneValue} coaching sessions`,
      revenue: `reached ${event.milestoneValue} in revenue`,
      clients: `reached ${event.milestoneValue} clients`,
      goals: `helped clients achieve ${event.milestoneValue} goals`,
    };

    const task = await this.createTask({
      summary: `Success check-in: ${event.userName} ${milestoneDescriptions[event.milestoneType]}`,
      description: `A ${event.userType} has reached a milestone:\n\n` +
        `**${event.userType === 'coach' ? 'Coach' : 'Client'}:** ${event.userName}\n` +
        `**Milestone:** ${milestoneDescriptions[event.milestoneType]}\n` +
        `**Achieved At:** ${event.achievedAt.toISOString()}\n\n` +
        `Check-in actions:\n` +
        `- [ ] Send congratulations message\n` +
        `- [ ] Review for potential case study\n` +
        `- [ ] Identify upsell opportunities\n` +
        `- [ ] Update success metrics`,
      assigneeId: event.userType === 'coach'
        ? this.config.defaultAssignees.coachSuccess
        : this.config.defaultAssignees.customerSuccess,
      dueDate,
      priority: 'low',
      tags: ['success', 'milestone', event.milestoneType],
    });

    // Send coaching event
    await this.notifier.sendCoachingEvent({
      type: 'milestone_reached',
      ...(event.userType === 'coach'
        ? { coachName: event.userName }
        : { clientName: event.userName }),
      milestoneName: `${event.userName} ${milestoneDescriptions[event.milestoneType]}!`,
    });

    return task;
  }

  /**
   * Handle goal achieved
   */
  async onGoalAchieved(event: GoalAchievedEvent): Promise<TaskCreationResult> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const task = await this.createTask({
      summary: `Celebrate goal completion: ${event.clientName} - ${event.goalTitle}`,
      description: `A client has achieved their goal:\n\n` +
        `**Client:** ${event.clientName}\n` +
        `**Coach:** ${event.coachName}\n` +
        `**Goal:** ${event.goalTitle}\n` +
        `**Completed At:** ${event.completedAt.toISOString()}\n\n` +
        `Follow-up actions:\n` +
        `- [ ] Send congratulations to client\n` +
        `- [ ] Recognize coach's contribution\n` +
        `- [ ] Request testimonial/review\n` +
        `- [ ] Suggest next goal`,
      assigneeId: this.config.defaultAssignees.customerSuccess,
      dueDate,
      priority: 'low',
      tags: ['success', 'goal', 'celebration'],
    });

    return task;
  }

  // ============================================================================
  // Generic Event Handler
  // ============================================================================

  /**
   * Handle any event based on type
   */
  async handleEvent(event: EventPayload): Promise<TaskCreationResult> {
    switch (event.eventType) {
      case 'coach_signup':
        return this.onCoachSignup(event.data as unknown as CoachSignupEvent);
      case 'client_complaint':
        return this.onClientComplaint(event.data as unknown as ClientComplaintEvent);
      case 'session_no_show':
        return this.onSessionNoShow(event.data as unknown as SessionNoShowEvent);
      case 'subscription_cancellation':
        return this.onSubscriptionCancellation(event.data as unknown as SubscriptionCancellationEvent);
      case 'payout_pending':
        return this.onPayoutPending(event.data as unknown as PayoutPendingEvent);
      case 'milestone_reached':
        return this.onMilestoneReached(event.data as unknown as MilestoneReachedEvent);
      case 'goal_achieved':
        return this.onGoalAchieved(event.data as unknown as GoalAchievedEvent);
      default:
        return {
          success: false,
          error: `Unknown event type: ${event.eventType}`,
        };
    }
  }

  // ============================================================================
  // Task Creation Helper
  // ============================================================================

  /**
   * Create a task in Lark
   */
  private async createTask(params: {
    summary: string;
    description?: string;
    assigneeId?: string;
    dueDate?: Date;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    tags?: string[];
  }): Promise<TaskCreationResult> {
    try {
      const task: LarkTask = {
        summary: params.summary,
        description: params.description,
      };

      if (params.dueDate) {
        task.due = {
          timestamp: params.dueDate.getTime().toString(),
          is_all_day: false,
          timezone: 'UTC',
        };
      }

      if (params.assigneeId) {
        task.members = [
          {
            id: params.assigneeId,
            type: 'user',
            role: 'assignee',
          },
        ];
      }

      if (this.config.taskGroupId) {
        task.tasklists = [
          {
            tasklist_guid: this.config.taskGroupId,
          },
        ];
      }

      // Add origin for linking back to UpCoach
      task.origin = {
        platform_i18n_name: {
          en_us: 'UpCoach',
          zh_cn: 'UpCoach',
        },
      };

      // Add extra metadata including priority and tags
      task.extra = JSON.stringify({
        priority: params.priority || 'medium',
        tags: params.tags || [],
        source: 'task_automation',
        createdAt: new Date().toISOString(),
      });

      // Set reminder 1 hour before due
      if (params.dueDate) {
        task.reminders = [
          { relative_fire_minute: 60 },
        ];
      }

      const result = await this.client.createTask(task as Parameters<typeof this.client.createTask>[0]);

      return {
        success: true,
        taskId: result.data?.task?.guid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create task',
      };
    }
  }
}

export default TaskAutomation;
