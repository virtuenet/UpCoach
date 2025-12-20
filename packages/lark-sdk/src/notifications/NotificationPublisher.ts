/**
 * NotificationPublisher - Send notifications and alerts to Lark
 * Supports various notification types: system alerts, billing, coaching events, etc.
 */

import { LarkClient } from '../client/LarkClient';
import type { InteractiveMessage, CardElement, ReceiveIdType } from '../types';

export type NotificationLevel = 'info' | 'warning' | 'critical' | 'success';
export type NotificationCategory =
  | 'system'
  | 'billing'
  | 'coaching'
  | 'security'
  | 'ml'
  | 'user'
  | 'subscription';

export interface NotificationConfig {
  larkClient: LarkClient;
  defaultChatId?: string;
  defaultReceiveIdType?: ReceiveIdType;
  appName?: string;
  environment?: string;
}

export interface NotificationPayload {
  title: string;
  message: string;
  level?: NotificationLevel;
  category?: NotificationCategory;
  details?: Record<string, string | number | boolean>;
  actions?: Array<{
    label: string;
    url?: string;
    value?: Record<string, unknown>;
  }>;
  timestamp?: Date;
}

export interface BillingAlertPayload {
  type: 'overage' | 'payment_failed' | 'renewal_reminder' | 'subscription_canceled' | 'trial_ending';
  userId?: string;
  userName?: string;
  email?: string;
  amount?: number;
  currency?: string;
  planName?: string;
  daysRemaining?: number;
  failureReason?: string;
}

export interface CoachingEventPayload {
  type: 'new_signup' | 'session_completed' | 'session_no_show' | 'goal_achieved' | 'milestone_reached' | 'coach_onboarded';
  coachName?: string;
  clientName?: string;
  sessionType?: string;
  goalName?: string;
  milestoneName?: string;
  details?: string;
}

export interface SecurityAlertPayload {
  type: 'suspicious_login' | 'rate_limit_exceeded' | 'api_abuse' | 'data_breach_attempt' | 'invalid_token';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  details?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MLAlertPayload {
  type: 'model_drift' | 'prediction_anomaly' | 'high_churn_risk' | 'engagement_drop' | 'quality_degradation';
  modelName?: string;
  metric?: string;
  currentValue?: number;
  threshold?: number;
  affectedUsers?: number;
  recommendation?: string;
}

export class NotificationPublisher {
  private readonly client: LarkClient;
  private readonly defaultChatId: string;
  private readonly defaultReceiveIdType: ReceiveIdType;
  private readonly appName: string;
  private readonly environment: string;

  constructor(config: NotificationConfig) {
    this.client = config.larkClient;
    this.defaultChatId = config.defaultChatId || '';
    this.defaultReceiveIdType = config.defaultReceiveIdType || 'chat_id';
    this.appName = config.appName || 'UpCoach';
    this.environment = config.environment || 'production';
  }

  // ============================================================================
  // Generic Notifications
  // ============================================================================

  /**
   * Send a generic notification
   */
  async send(
    payload: NotificationPayload,
    options?: {
      receiveId?: string;
      receiveIdType?: ReceiveIdType;
    }
  ): Promise<void> {
    const receiveId = options?.receiveId || this.defaultChatId;
    const receiveIdType = options?.receiveIdType || this.defaultReceiveIdType;

    if (!receiveId) {
      throw new Error('No receive ID provided and no default chat ID configured');
    }

    const card = this.buildNotificationCard(payload);
    await this.client.sendCard(receiveId, receiveIdType, card);
  }

  /**
   * Send a simple text notification
   */
  async sendText(
    text: string,
    options?: {
      receiveId?: string;
      receiveIdType?: ReceiveIdType;
    }
  ): Promise<void> {
    const receiveId = options?.receiveId || this.defaultChatId;
    const receiveIdType = options?.receiveIdType || this.defaultReceiveIdType;

    if (!receiveId) {
      throw new Error('No receive ID provided and no default chat ID configured');
    }

    await this.client.sendText(receiveId, receiveIdType, text);
  }

  // ============================================================================
  // Billing Alerts
  // ============================================================================

  /**
   * Send a billing alert
   */
  async sendBillingAlert(
    payload: BillingAlertPayload,
    options?: {
      receiveId?: string;
      receiveIdType?: ReceiveIdType;
    }
  ): Promise<void> {
    const notification = this.buildBillingNotification(payload);
    await this.send(notification, options);
  }

  private buildBillingNotification(payload: BillingAlertPayload): NotificationPayload {
    const { type, userName, email, amount, currency, planName, daysRemaining, failureReason } = payload;

    const formatCurrency = (amt: number, curr: string) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(amt);

    switch (type) {
      case 'overage':
        return {
          title: '⚠️ Usage Overage Alert',
          message: `${userName || email} has exceeded their plan limits`,
          level: 'warning',
          category: 'billing',
          details: {
            User: userName || email || 'Unknown',
            Plan: planName || 'Unknown',
            ...(amount && currency ? { 'Overage Amount': formatCurrency(amount, currency) } : {}),
          },
        };

      case 'payment_failed':
        return {
          title: '🔴 Payment Failed',
          message: `Payment failed for ${userName || email}`,
          level: 'critical',
          category: 'billing',
          details: {
            User: userName || email || 'Unknown',
            Plan: planName || 'Unknown',
            ...(amount && currency ? { Amount: formatCurrency(amount, currency) } : {}),
            ...(failureReason ? { Reason: failureReason } : {}),
          },
        };

      case 'renewal_reminder':
        return {
          title: '📅 Subscription Renewal Coming',
          message: `${userName || email}'s subscription renews in ${daysRemaining} days`,
          level: 'info',
          category: 'billing',
          details: {
            User: userName || email || 'Unknown',
            Plan: planName || 'Unknown',
            'Days Remaining': daysRemaining || 0,
            ...(amount && currency ? { 'Renewal Amount': formatCurrency(amount, currency) } : {}),
          },
        };

      case 'subscription_canceled':
        return {
          title: '❌ Subscription Canceled',
          message: `${userName || email} has canceled their subscription`,
          level: 'warning',
          category: 'billing',
          details: {
            User: userName || email || 'Unknown',
            Plan: planName || 'Unknown',
          },
        };

      case 'trial_ending':
        return {
          title: '⏳ Trial Ending Soon',
          message: `${userName || email}'s trial ends in ${daysRemaining} days`,
          level: 'info',
          category: 'billing',
          details: {
            User: userName || email || 'Unknown',
            'Days Remaining': daysRemaining || 0,
          },
        };

      default:
        return {
          title: '📊 Billing Update',
          message: 'A billing event occurred',
          level: 'info',
          category: 'billing',
        };
    }
  }

  // ============================================================================
  // Coaching Events
  // ============================================================================

  /**
   * Send a coaching event notification
   */
  async sendCoachingEvent(
    payload: CoachingEventPayload,
    options?: {
      receiveId?: string;
      receiveIdType?: ReceiveIdType;
    }
  ): Promise<void> {
    const notification = this.buildCoachingNotification(payload);
    await this.send(notification, options);
  }

  private buildCoachingNotification(payload: CoachingEventPayload): NotificationPayload {
    const { type, coachName, clientName, sessionType, goalName, milestoneName, details } = payload;

    switch (type) {
      case 'new_signup':
        return {
          title: '🎉 New Client Signup',
          message: `${clientName} has joined the platform`,
          level: 'success',
          category: 'coaching',
          details: {
            Client: clientName || 'Unknown',
            ...(coachName ? { 'Assigned Coach': coachName } : {}),
            ...(details ? { Details: details } : {}),
          },
        };

      case 'session_completed':
        return {
          title: '✅ Session Completed',
          message: `${coachName} completed a ${sessionType || 'coaching'} session with ${clientName}`,
          level: 'success',
          category: 'coaching',
          details: {
            Coach: coachName || 'Unknown',
            Client: clientName || 'Unknown',
            Type: sessionType || 'Coaching',
          },
        };

      case 'session_no_show':
        return {
          title: '⚠️ Session No-Show',
          message: `${clientName} did not attend their session with ${coachName}`,
          level: 'warning',
          category: 'coaching',
          details: {
            Coach: coachName || 'Unknown',
            Client: clientName || 'Unknown',
            Type: sessionType || 'Coaching',
          },
        };

      case 'goal_achieved':
        return {
          title: '🏆 Goal Achieved',
          message: `${clientName} achieved their goal: ${goalName}`,
          level: 'success',
          category: 'coaching',
          details: {
            Client: clientName || 'Unknown',
            Goal: goalName || 'Unknown',
            ...(coachName ? { Coach: coachName } : {}),
          },
        };

      case 'milestone_reached':
        return {
          title: '🎯 Milestone Reached',
          message: `${clientName} reached a milestone: ${milestoneName}`,
          level: 'success',
          category: 'coaching',
          details: {
            Client: clientName || 'Unknown',
            Milestone: milestoneName || 'Unknown',
          },
        };

      case 'coach_onboarded':
        return {
          title: '👋 New Coach Onboarded',
          message: `${coachName} has completed onboarding`,
          level: 'success',
          category: 'coaching',
          details: {
            Coach: coachName || 'Unknown',
            ...(details ? { Details: details } : {}),
          },
        };

      default:
        return {
          title: '📣 Coaching Update',
          message: 'A coaching event occurred',
          level: 'info',
          category: 'coaching',
        };
    }
  }

  // ============================================================================
  // Security Alerts
  // ============================================================================

  /**
   * Send a security alert
   */
  async sendSecurityAlert(
    payload: SecurityAlertPayload,
    options?: {
      receiveId?: string;
      receiveIdType?: ReceiveIdType;
    }
  ): Promise<void> {
    const notification = this.buildSecurityNotification(payload);
    await this.send(notification, options);
  }

  private buildSecurityNotification(payload: SecurityAlertPayload): NotificationPayload {
    const { type, userId, ipAddress, userAgent, endpoint, details, severity } = payload;

    const levelMap: Record<string, NotificationLevel> = {
      low: 'info',
      medium: 'warning',
      high: 'critical',
      critical: 'critical',
    };

    const titleMap: Record<string, string> = {
      suspicious_login: '🔐 Suspicious Login Detected',
      rate_limit_exceeded: '🚦 Rate Limit Exceeded',
      api_abuse: '🚨 API Abuse Detected',
      data_breach_attempt: '🛡️ Data Breach Attempt',
      invalid_token: '🔑 Invalid Token Used',
    };

    return {
      title: titleMap[type] || '🔒 Security Alert',
      message: details || `Security event: ${type}`,
      level: levelMap[severity],
      category: 'security',
      details: {
        Type: type,
        Severity: severity.toUpperCase(),
        ...(userId ? { 'User ID': userId } : {}),
        ...(ipAddress ? { 'IP Address': ipAddress } : {}),
        ...(endpoint ? { Endpoint: endpoint } : {}),
        ...(userAgent ? { 'User Agent': userAgent.slice(0, 50) + '...' } : {}),
      },
    };
  }

  // ============================================================================
  // ML Alerts
  // ============================================================================

  /**
   * Send an ML/AI alert
   */
  async sendMLAlert(
    payload: MLAlertPayload,
    options?: {
      receiveId?: string;
      receiveIdType?: ReceiveIdType;
    }
  ): Promise<void> {
    const notification = this.buildMLNotification(payload);
    await this.send(notification, options);
  }

  private buildMLNotification(payload: MLAlertPayload): NotificationPayload {
    const { type, modelName, metric, currentValue, threshold, affectedUsers, recommendation } = payload;

    const titleMap: Record<string, string> = {
      model_drift: '📊 Model Drift Detected',
      prediction_anomaly: '🔮 Prediction Anomaly',
      high_churn_risk: '⚠️ High Churn Risk Detected',
      engagement_drop: '📉 Engagement Drop',
      quality_degradation: '🎯 Quality Degradation',
    };

    const levelMap: Record<string, NotificationLevel> = {
      model_drift: 'warning',
      prediction_anomaly: 'warning',
      high_churn_risk: 'critical',
      engagement_drop: 'warning',
      quality_degradation: 'critical',
    };

    return {
      title: titleMap[type] || '🤖 ML Alert',
      message: recommendation || `ML event detected: ${type}`,
      level: levelMap[type] || 'warning',
      category: 'ml',
      details: {
        Type: type,
        ...(modelName ? { Model: modelName } : {}),
        ...(metric ? { Metric: metric } : {}),
        ...(currentValue !== undefined ? { 'Current Value': currentValue } : {}),
        ...(threshold !== undefined ? { Threshold: threshold } : {}),
        ...(affectedUsers !== undefined ? { 'Affected Users': affectedUsers } : {}),
      },
    };
  }

  // ============================================================================
  // Card Builders
  // ============================================================================

  private buildNotificationCard(payload: NotificationPayload): InteractiveMessage {
    const { title, message, level = 'info', category, details, actions, timestamp } = payload;

    const templateMap: Record<NotificationLevel, NonNullable<NonNullable<InteractiveMessage['header']>['template']>> = {
      info: 'blue',
      warning: 'yellow',
      critical: 'red',
      success: 'green',
    };

    const elements: CardElement[] = [
      {
        tag: 'markdown',
        content: message,
      } as CardElement,
    ];

    // Add details if provided
    if (details && Object.keys(details).length > 0) {
      elements.push({ tag: 'hr' } as CardElement);
      const detailsText = Object.entries(details)
        .map(([key, value]) => `**${key}:** ${value}`)
        .join('\n');
      elements.push({
        tag: 'markdown',
        content: detailsText,
      } as CardElement);
    }

    // Add actions if provided
    if (actions && actions.length > 0) {
      elements.push({ tag: 'hr' } as CardElement);
      elements.push({
        tag: 'action',
        actions: actions.map((action) => ({
          tag: 'button' as const,
          text: { tag: 'plain_text' as const, content: action.label },
          type: 'primary' as const,
          ...(action.url ? { url: action.url } : {}),
          ...(action.value ? { value: action.value } : {}),
        })),
      } as CardElement);
    }

    // Add footer with timestamp and environment
    const footerParts: string[] = [];
    if (category) footerParts.push(category.toUpperCase());
    footerParts.push(this.environment);
    footerParts.push((timestamp || new Date()).toLocaleString());

    elements.push({
      tag: 'note',
      elements: [
        { tag: 'plain_text', content: `${this.appName} | ${footerParts.join(' | ')}` },
      ],
    } as CardElement);

    return {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: title },
        template: templateMap[level],
      },
      elements,
    };
  }

  /**
   * Get the Lark client instance
   */
  getLarkClient(): LarkClient {
    return this.client;
  }
}
