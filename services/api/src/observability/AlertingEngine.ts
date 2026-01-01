import { EventEmitter } from 'events';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { WebClient } from '@slack/web-api';
import { CronJob } from 'cron';
import * as yaml from 'js-yaml';
import * as fs from 'fs/promises';

interface AlertRule {
  name: string;
  description?: string;
  condition: string;
  duration: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: AlertChannel[];
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  groupBy?: string[];
  throttle?: number;
  enabled?: boolean;
}

interface ThresholdCondition {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'between';
  value: number | [number, number];
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  window?: number;
}

interface CompositeCondition {
  type: 'AND' | 'OR';
  conditions: Array<ThresholdCondition | CompositeCondition>;
}

interface AnomalyDetectionConfig {
  metric: string;
  method: 'zscore' | 'iqr' | 'isolation-forest' | 'moving-average';
  sensitivity: number;
  window: number;
  seasonality?: number;
}

type AlertChannel = 'email' | 'sms' | 'slack' | 'pagerduty' | 'webhook';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  to: string[];
}

interface SMSConfig {
  accountSid: string;
  authToken: string;
  from: string;
  to: string[];
}

interface SlackConfig {
  token: string;
  channel: string;
  username?: string;
  iconEmoji?: string;
}

interface PagerDutyConfig {
  apiKey: string;
  serviceKey: string;
  escalationPolicy?: string;
}

interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT';
  headers?: Record<string, string>;
  auth?: {
    type: 'basic' | 'bearer';
    credentials: string;
  };
}

interface EscalationPolicy {
  name: string;
  levels: Array<{
    channels: AlertChannel[];
    timeout: number;
    targets: string[];
  }>;
}

interface OnCallSchedule {
  name: string;
  timezone: string;
  rotations: Array<{
    type: 'daily' | 'weekly' | 'custom';
    users: string[];
    startTime: string;
    duration: number;
  }>;
  overrides: Array<{
    user: string;
    start: number;
    end: number;
  }>;
}

interface Alert {
  id: string;
  rule: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'firing' | 'resolved' | 'acknowledged' | 'silenced';
  startTime: number;
  endTime?: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  resolvedAt?: number;
  resolvedBy?: string;
  message: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  value?: number;
  escalationLevel: number;
  notificationsSent: string[];
}

interface AlertMetrics {
  totalAlerts: number;
  firingAlerts: number;
  resolvedAlerts: number;
  acknowledgedAlerts: number;
  alertsByRule: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  meanTimeToResolve: number;
  meanTimeToAcknowledge: number;
}

export class AlertingEngine extends EventEmitter {
  private rules: Map<string, AlertRule>;
  private alerts: Map<string, Alert>;
  private escalationPolicies: Map<string, EscalationPolicy>;
  private onCallSchedules: Map<string, OnCallSchedule>;
  private emailClient: nodemailer.Transporter | null = null;
  private smsClient: twilio.Twilio | null = null;
  private slackClient: WebClient | null = null;
  private pagerDutyConfig: PagerDutyConfig | null = null;
  private webhookConfigs: Map<string, WebhookConfig>;
  private checkJobs: Map<string, CronJob>;
  private alertHistory: Alert[];
  private maxHistorySize: number = 10000;
  private silencedAlerts: Map<string, number>;
  private throttleTracker: Map<string, number>;
  private metricCache: Map<string, Array<{ timestamp: number; value: number }>>;
  private anomalyDetectors: Map<string, AnomalyDetectionConfig>;

  constructor(config: {
    email?: EmailConfig;
    sms?: SMSConfig;
    slack?: SlackConfig;
    pagerduty?: PagerDutyConfig;
    webhooks?: Record<string, WebhookConfig>;
  }) {
    super();

    this.rules = new Map();
    this.alerts = new Map();
    this.escalationPolicies = new Map();
    this.onCallSchedules = new Map();
    this.webhookConfigs = new Map();
    this.checkJobs = new Map();
    this.alertHistory = [];
    this.silencedAlerts = new Map();
    this.throttleTracker = new Map();
    this.metricCache = new Map();
    this.anomalyDetectors = new Map();

    if (config.email) {
      this.emailClient = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: config.email.auth,
      });
    }

    if (config.sms) {
      this.smsClient = twilio(config.sms.accountSid, config.sms.authToken);
    }

    if (config.slack) {
      this.slackClient = new WebClient(config.slack.token);
    }

    if (config.pagerduty) {
      this.pagerDutyConfig = config.pagerduty;
    }

    if (config.webhooks) {
      Object.entries(config.webhooks).forEach(([name, cfg]) => {
        this.webhookConfigs.set(name, cfg);
      });
    }

    this.setupPeriodicCleanup();
  }

  private setupPeriodicCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const oneDayAgo = now - 86400000;

      this.alertHistory = this.alertHistory.filter(
        (alert) => alert.startTime > oneDayAgo
      );

      if (this.alertHistory.length > this.maxHistorySize) {
        this.alertHistory = this.alertHistory.slice(-this.maxHistorySize);
      }

      Array.from(this.silencedAlerts.entries()).forEach(([alertId, until]) => {
        if (now > until) {
          this.silencedAlerts.delete(alertId);
        }
      });

      Array.from(this.throttleTracker.entries()).forEach(([key, lastSent]) => {
        if (now - lastSent > 3600000) {
          this.throttleTracker.delete(key);
        }
      });
    }, 300000);
  }

  public async loadRulesFromFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const rules = yaml.load(content) as AlertRule[];

      for (const rule of rules) {
        this.addRule(rule);
      }
    } catch (error) {
      console.error('Failed to load alert rules:', error);
      throw error;
    }
  }

  public addRule(rule: AlertRule): void {
    if (rule.enabled === false) {
      return;
    }

    this.rules.set(rule.name, rule);

    const cronPattern = this.durationToCron(rule.duration);
    const job = new CronJob(cronPattern, () => {
      this.evaluateRule(rule).catch((error) => {
        console.error(`Failed to evaluate rule ${rule.name}:`, error);
      });
    });

    this.checkJobs.set(rule.name, job);
    job.start();

    this.emit('rule_added', rule);
  }

  private durationToCron(durationMs: number): string {
    const seconds = Math.floor(durationMs / 1000);

    if (seconds < 60) {
      return `*/${seconds} * * * * *`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `*/${minutes} * * * *`;
    }

    return '0 * * * *';
  }

  public removeRule(ruleName: string): void {
    this.rules.delete(ruleName);

    const job = this.checkJobs.get(ruleName);
    if (job) {
      job.stop();
      this.checkJobs.delete(ruleName);
    }

    this.emit('rule_removed', ruleName);
  }

  public updateRule(ruleName: string, updates: Partial<AlertRule>): void {
    const rule = this.rules.get(ruleName);
    if (!rule) {
      throw new Error(`Rule ${ruleName} not found`);
    }

    const updatedRule = { ...rule, ...updates };
    this.removeRule(ruleName);
    this.addRule(updatedRule);

    this.emit('rule_updated', updatedRule);
  }

  private async evaluateRule(rule: AlertRule): Promise<void> {
    try {
      const conditionMet = await this.evaluateCondition(rule.condition);

      if (conditionMet) {
        await this.fireAlert(rule);
      } else {
        await this.resolveAlert(rule.name);
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.name}:`, error);
    }
  }

  private async evaluateCondition(condition: string): Promise<boolean> {
    try {
      const parsedCondition = this.parseCondition(condition);

      if ('type' in parsedCondition) {
        return this.evaluateCompositeCondition(parsedCondition as CompositeCondition);
      } else {
        return this.evaluateThresholdCondition(parsedCondition as ThresholdCondition);
      }
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  private parseCondition(condition: string): ThresholdCondition | CompositeCondition {
    if (condition.includes('AND') || condition.includes('OR')) {
      const type = condition.includes('AND') ? 'AND' : 'OR';
      const parts = condition.split(new RegExp(`\\s+${type}\\s+`));

      return {
        type,
        conditions: parts.map((part) => this.parseCondition(part.trim())),
      };
    }

    const match = condition.match(/(\w+)\s*(>|<|>=|<=|==|!=|between)\s*(.+)/);
    if (!match) {
      throw new Error(`Invalid condition: ${condition}`);
    }

    const [, metric, operator, valueStr] = match;

    let value: number | [number, number];
    if (operator === 'between') {
      const [min, max] = valueStr.split(/\s+and\s+/).map((v) => parseFloat(v.trim()));
      value = [min, max];
    } else {
      value = parseFloat(valueStr.trim());
    }

    return {
      metric: metric.trim(),
      operator: operator as ThresholdCondition['operator'],
      value,
    };
  }

  private async evaluateThresholdCondition(condition: ThresholdCondition): Promise<boolean> {
    const metricValue = await this.getMetricValue(condition.metric, condition.aggregation);

    switch (condition.operator) {
      case '>':
        return metricValue > (condition.value as number);
      case '<':
        return metricValue < (condition.value as number);
      case '>=':
        return metricValue >= (condition.value as number);
      case '<=':
        return metricValue <= (condition.value as number);
      case '==':
        return metricValue === (condition.value as number);
      case '!=':
        return metricValue !== (condition.value as number);
      case 'between':
        const [min, max] = condition.value as [number, number];
        return metricValue >= min && metricValue <= max;
      default:
        return false;
    }
  }

  private async evaluateCompositeCondition(condition: CompositeCondition): Promise<boolean> {
    const results = await Promise.all(
      condition.conditions.map((c) => {
        if ('type' in c) {
          return this.evaluateCompositeCondition(c as CompositeCondition);
        } else {
          return this.evaluateThresholdCondition(c as ThresholdCondition);
        }
      })
    );

    if (condition.type === 'AND') {
      return results.every((r) => r);
    } else {
      return results.some((r) => r);
    }
  }

  private async getMetricValue(metric: string, aggregation: string = 'avg'): Promise<number> {
    const cached = this.metricCache.get(metric);
    if (!cached || cached.length === 0) {
      return 0;
    }

    const values = cached.map((d) => d.value);

    switch (aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      default:
        return values[values.length - 1];
    }
  }

  public recordMetric(metric: string, value: number): void {
    const data = this.metricCache.get(metric) || [];
    data.push({ timestamp: Date.now(), value });

    const oneHourAgo = Date.now() - 3600000;
    const filtered = data.filter((d) => d.timestamp > oneHourAgo);

    this.metricCache.set(metric, filtered);
  }

  private async fireAlert(rule: AlertRule): Promise<void> {
    const existingAlert = Array.from(this.alerts.values()).find(
      (a) => a.rule === rule.name && a.status === 'firing'
    );

    if (existingAlert) {
      return;
    }

    if (this.isThrottled(rule.name, rule.throttle)) {
      return;
    }

    const alert: Alert = {
      id: this.generateAlertId(),
      rule: rule.name,
      severity: rule.severity,
      status: 'firing',
      startTime: Date.now(),
      message: rule.description || `Alert ${rule.name} is firing`,
      labels: rule.labels || {},
      annotations: rule.annotations || {},
      escalationLevel: 0,
      notificationsSent: [],
    };

    this.alerts.set(alert.id, alert);
    this.alertHistory.push(alert);

    await this.sendNotifications(alert, rule.channels);

    this.emit('alert_fired', alert);

    if (rule.severity === 'critical' || rule.severity === 'high') {
      this.scheduleEscalation(alert, rule);
    }
  }

  private isThrottled(ruleName: string, throttleMs?: number): boolean {
    if (!throttleMs) return false;

    const lastSent = this.throttleTracker.get(ruleName);
    if (!lastSent) {
      this.throttleTracker.set(ruleName, Date.now());
      return false;
    }

    const elapsed = Date.now() - lastSent;
    if (elapsed < throttleMs) {
      return true;
    }

    this.throttleTracker.set(ruleName, Date.now());
    return false;
  }

  private async resolveAlert(ruleName: string): Promise<void> {
    const alert = Array.from(this.alerts.values()).find(
      (a) => a.rule === ruleName && a.status === 'firing'
    );

    if (!alert) return;

    alert.status = 'resolved';
    alert.endTime = Date.now();
    alert.resolvedAt = Date.now();

    const rule = this.rules.get(ruleName);
    if (rule) {
      await this.sendNotifications(alert, rule.channels, 'resolved');
    }

    this.emit('alert_resolved', alert);

    setTimeout(() => {
      this.alerts.delete(alert.id);
    }, 300000);
  }

  public acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    if (alert.status !== 'firing') {
      throw new Error(`Alert ${alertId} is not firing`);
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = Date.now();
    alert.acknowledgedBy = acknowledgedBy;

    this.emit('alert_acknowledged', alert);
  }

  public silenceAlert(alertId: string, durationMs: number): void {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.status = 'silenced';
    this.silencedAlerts.set(alertId, Date.now() + durationMs);

    this.emit('alert_silenced', alert);

    setTimeout(() => {
      if (this.alerts.has(alertId)) {
        const a = this.alerts.get(alertId)!;
        if (a.status === 'silenced') {
          a.status = 'firing';
        }
      }
      this.silencedAlerts.delete(alertId);
    }, durationMs);
  }

  private async sendNotifications(
    alert: Alert,
    channels: AlertChannel[],
    type: 'firing' | 'resolved' = 'firing'
  ): Promise<void> {
    const promises = channels.map((channel) => {
      switch (channel) {
        case 'email':
          return this.sendEmailNotification(alert, type);
        case 'sms':
          return this.sendSMSNotification(alert, type);
        case 'slack':
          return this.sendSlackNotification(alert, type);
        case 'pagerduty':
          return this.sendPagerDutyNotification(alert, type);
        case 'webhook':
          return this.sendWebhookNotification(alert, type);
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(promises);

    alert.notificationsSent.push(...channels);
  }

  private async sendEmailNotification(alert: Alert, type: 'firing' | 'resolved'): Promise<void> {
    if (!this.emailClient) return;

    const subject = `[${alert.severity.toUpperCase()}] ${type === 'firing' ? 'FIRING' : 'RESOLVED'}: ${alert.rule}`;
    const html = this.generateEmailHTML(alert, type);

    try {
      await this.emailClient.sendMail({
        from: process.env.ALERT_EMAIL_FROM || 'alerts@upcoach.com',
        to: process.env.ALERT_EMAIL_TO || 'ops@upcoach.com',
        subject,
        html,
      });
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  private generateEmailHTML(alert: Alert, type: 'firing' | 'resolved'): string {
    const statusColor = type === 'firing' ? '#f44336' : '#4caf50';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${statusColor}; color: white; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; background: #f5f5f5; margin-top: 20px; border-radius: 5px; }
            .label { font-weight: bold; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${type === 'firing' ? '🔥 Alert Firing' : '✅ Alert Resolved'}</h1>
              <h2>${alert.rule}</h2>
            </div>
            <div class="content">
              <p><span class="label">Severity:</span> ${alert.severity.toUpperCase()}</p>
              <p><span class="label">Status:</span> ${alert.status.toUpperCase()}</p>
              <p><span class="label">Message:</span> ${alert.message}</p>
              <p><span class="label">Started:</span> ${new Date(alert.startTime).toISOString()}</p>
              ${alert.endTime ? `<p><span class="label">Ended:</span> ${new Date(alert.endTime).toISOString()}</p>` : ''}
              ${alert.value !== undefined ? `<p><span class="label">Value:</span> ${alert.value}</p>` : ''}
              ${Object.keys(alert.labels).length > 0 ? `
                <p><span class="label">Labels:</span></p>
                <ul>
                  ${Object.entries(alert.labels).map(([k, v]) => `<li>${k}: ${v}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
            <div class="footer">
              <p>This is an automated alert from UpCoach Observability System</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private async sendSMSNotification(alert: Alert, type: 'firing' | 'resolved'): Promise<void> {
    if (!this.smsClient) return;

    const message = `[${alert.severity.toUpperCase()}] ${type === 'firing' ? 'FIRING' : 'RESOLVED'}: ${alert.rule} - ${alert.message}`;

    try {
      await this.smsClient.messages.create({
        body: message,
        from: process.env.TWILIO_FROM || '',
        to: process.env.ALERT_SMS_TO || '',
      });
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
    }
  }

  private async sendSlackNotification(alert: Alert, type: 'firing' | 'resolved'): Promise<void> {
    if (!this.slackClient) return;

    const color = type === 'firing' ? 'danger' : 'good';
    const emoji = type === 'firing' ? ':fire:' : ':white_check_mark:';

    try {
      await this.slackClient.chat.postMessage({
        channel: process.env.SLACK_ALERT_CHANNEL || '#alerts',
        text: `${emoji} Alert ${type}`,
        attachments: [
          {
            color,
            title: alert.rule,
            text: alert.message,
            fields: [
              {
                title: 'Severity',
                value: alert.severity.toUpperCase(),
                short: true,
              },
              {
                title: 'Status',
                value: alert.status.toUpperCase(),
                short: true,
              },
              {
                title: 'Started',
                value: new Date(alert.startTime).toISOString(),
                short: true,
              },
              ...(alert.endTime
                ? [
                    {
                      title: 'Ended',
                      value: new Date(alert.endTime).toISOString(),
                      short: true,
                    },
                  ]
                : []),
            ],
          },
        ],
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  private async sendPagerDutyNotification(alert: Alert, type: 'firing' | 'resolved'): Promise<void> {
    if (!this.pagerDutyConfig) return;

    const event = {
      routing_key: this.pagerDutyConfig.serviceKey,
      event_action: type === 'firing' ? 'trigger' : 'resolve',
      dedup_key: alert.id,
      payload: {
        summary: alert.message,
        severity: alert.severity,
        source: 'UpCoach Observability',
        timestamp: new Date(alert.startTime).toISOString(),
        custom_details: {
          rule: alert.rule,
          labels: alert.labels,
          annotations: alert.annotations,
        },
      },
    };

    try {
      const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`PagerDuty API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send PagerDuty notification:', error);
    }
  }

  private async sendWebhookNotification(alert: Alert, type: 'firing' | 'resolved'): Promise<void> {
    const webhookConfig = this.webhookConfigs.get('default');
    if (!webhookConfig) return;

    const payload = {
      alert,
      type,
      timestamp: Date.now(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...webhookConfig.headers,
    };

    if (webhookConfig.auth) {
      if (webhookConfig.auth.type === 'basic') {
        headers['Authorization'] = `Basic ${webhookConfig.auth.credentials}`;
      } else if (webhookConfig.auth.type === 'bearer') {
        headers['Authorization'] = `Bearer ${webhookConfig.auth.credentials}`;
      }
    }

    try {
      const response = await fetch(webhookConfig.url, {
        method: webhookConfig.method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  private scheduleEscalation(alert: Alert, rule: AlertRule): void {
    const escalationPolicy = this.escalationPolicies.get(rule.name);
    if (!escalationPolicy) return;

    const escalate = async (level: number) => {
      if (level >= escalationPolicy.levels.length) return;

      const currentAlert = this.alerts.get(alert.id);
      if (!currentAlert || currentAlert.status !== 'firing') return;

      const policyLevel = escalationPolicy.levels[level];
      await this.sendNotifications(alert, policyLevel.channels);

      alert.escalationLevel = level;

      setTimeout(() => {
        escalate(level + 1);
      }, policyLevel.timeout);
    };

    setTimeout(() => {
      escalate(0);
    }, 300000);
  }

  public addEscalationPolicy(policy: EscalationPolicy): void {
    this.escalationPolicies.set(policy.name, policy);
  }

  public addOnCallSchedule(schedule: OnCallSchedule): void {
    this.onCallSchedules.set(schedule.name, schedule);
  }

  public getOnCallUser(scheduleName: string): string | null {
    const schedule = this.onCallSchedules.get(scheduleName);
    if (!schedule) return null;

    const now = Date.now();

    for (const override of schedule.overrides) {
      if (now >= override.start && now <= override.end) {
        return override.user;
      }
    }

    for (const rotation of schedule.rotations) {
      const user = this.getUserFromRotation(rotation, now);
      if (user) return user;
    }

    return null;
  }

  private getUserFromRotation(
    rotation: OnCallSchedule['rotations'][0],
    timestamp: number
  ): string | null {
    if (rotation.users.length === 0) return null;

    const startTime = new Date(rotation.startTime).getTime();
    const elapsed = timestamp - startTime;
    const rotationIndex = Math.floor(elapsed / rotation.duration) % rotation.users.length;

    return rotation.users[rotationIndex];
  }

  public detectAnomaly(config: AnomalyDetectionConfig): void {
    this.anomalyDetectors.set(config.metric, config);

    const job = new CronJob('*/5 * * * *', () => {
      this.checkAnomaly(config).catch((error) => {
        console.error(`Failed to check anomaly for ${config.metric}:`, error);
      });
    });

    this.checkJobs.set(`anomaly_${config.metric}`, job);
    job.start();
  }

  private async checkAnomaly(config: AnomalyDetectionConfig): Promise<void> {
    const data = this.metricCache.get(config.metric);
    if (!data || data.length < config.window) return;

    const recent = data.slice(-config.window);
    const values = recent.map((d) => d.value);

    let isAnomaly = false;

    switch (config.method) {
      case 'zscore':
        isAnomaly = this.detectAnomalyZScore(values, config.sensitivity);
        break;
      case 'iqr':
        isAnomaly = this.detectAnomalyIQR(values, config.sensitivity);
        break;
      case 'moving-average':
        isAnomaly = this.detectAnomalyMovingAverage(values, config.sensitivity);
        break;
    }

    if (isAnomaly) {
      this.emit('anomaly_detected', {
        metric: config.metric,
        method: config.method,
        value: values[values.length - 1],
        timestamp: Date.now(),
      });
    }
  }

  private detectAnomalyZScore(values: number[], threshold: number): boolean {
    if (values.length < 2) return false;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const latestValue = values[values.length - 1];
    const zScore = Math.abs((latestValue - mean) / stdDev);

    return zScore > threshold;
  }

  private detectAnomalyIQR(values: number[], multiplier: number): boolean {
    if (values.length < 4) return false;

    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);

    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;

    const latestValue = values[values.length - 1];

    return latestValue < lowerBound || latestValue > upperBound;
  }

  private detectAnomalyMovingAverage(values: number[], threshold: number): boolean {
    if (values.length < 2) return false;

    const windowSize = Math.min(10, Math.floor(values.length / 2));
    const historical = values.slice(0, -1);
    const movingAvg = historical.slice(-windowSize).reduce((a, b) => a + b, 0) / windowSize;

    const latestValue = values[values.length - 1];
    const deviation = Math.abs(latestValue - movingAvg) / movingAvg;

    return deviation > threshold;
  }

  public getAlerts(filter?: {
    status?: Alert['status'];
    severity?: Alert['severity'];
    rule?: string;
  }): Alert[] {
    let alerts = Array.from(this.alerts.values());

    if (filter) {
      if (filter.status) {
        alerts = alerts.filter((a) => a.status === filter.status);
      }
      if (filter.severity) {
        alerts = alerts.filter((a) => a.severity === filter.severity);
      }
      if (filter.rule) {
        alerts = alerts.filter((a) => a.rule === filter.rule);
      }
    }

    return alerts;
  }

  public getAlertMetrics(): AlertMetrics {
    const alerts = Array.from(this.alerts.values());
    const history = this.alertHistory;

    const totalAlerts = alerts.length;
    const firingAlerts = alerts.filter((a) => a.status === 'firing').length;
    const resolvedAlerts = alerts.filter((a) => a.status === 'resolved').length;
    const acknowledgedAlerts = alerts.filter((a) => a.status === 'acknowledged').length;

    const alertsByRule: Record<string, number> = {};
    const alertsBySeverity: Record<string, number> = {};

    alerts.forEach((alert) => {
      alertsByRule[alert.rule] = (alertsByRule[alert.rule] || 0) + 1;
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
    });

    const resolvedWithTimes = history.filter((a) => a.resolvedAt && a.startTime);
    const meanTimeToResolve =
      resolvedWithTimes.length > 0
        ? resolvedWithTimes.reduce((sum, a) => sum + (a.resolvedAt! - a.startTime), 0) /
          resolvedWithTimes.length
        : 0;

    const acknowledgedWithTimes = history.filter((a) => a.acknowledgedAt && a.startTime);
    const meanTimeToAcknowledge =
      acknowledgedWithTimes.length > 0
        ? acknowledgedWithTimes.reduce((sum, a) => sum + (a.acknowledgedAt! - a.startTime), 0) /
          acknowledgedWithTimes.length
        : 0;

    return {
      totalAlerts,
      firingAlerts,
      resolvedAlerts,
      acknowledgedAlerts,
      alertsByRule,
      alertsBySeverity,
      meanTimeToResolve,
      meanTimeToAcknowledge,
    };
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  public testRule(ruleName: string): Promise<boolean> {
    const rule = this.rules.get(ruleName);
    if (!rule) {
      throw new Error(`Rule ${ruleName} not found`);
    }

    return this.evaluateCondition(rule.condition);
  }

  public shutdown(): void {
    this.checkJobs.forEach((job) => job.stop());
    this.checkJobs.clear();
    this.removeAllListeners();
  }
}

export default AlertingEngine;
