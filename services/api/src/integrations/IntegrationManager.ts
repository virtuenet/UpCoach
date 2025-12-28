/**
 * IntegrationManager
 *
 * Manages all third-party integrations including:
 * - Calendar: Google Calendar, Outlook, iCal
 * - Fitness: Apple Health, Google Fit, Fitbit
 * - Productivity: Notion, Trello, Todoist, Slack
 *
 * This consolidates integration logic for Week 2 implementation.
 */

import { EventEmitter } from 'events';

export type IntegrationType =
  | 'google_calendar'
  | 'outlook'
  | 'apple_health'
  | 'google_fit'
  | 'fitbit'
  | 'notion'
  | 'trello'
  | 'slack';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'syncing';

export interface Integration {
  id: string;
  userId: string;
  type: IntegrationType;
  status: IntegrationStatus;
  config: Record<string, any>;
  credentials: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  };
  lastSyncAt?: Date;
  syncFrequency?: 'realtime' | 'hourly' | 'daily';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class IntegrationManager extends EventEmitter {
  private static instance: IntegrationManager;
  private integrations: Map<string, Integration> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager();
    }
    return IntegrationManager.instance;
  }

  async connectIntegration(
    userId: string,
    type: IntegrationType,
    credentials: any
  ): Promise<Integration> {
    const integration: Integration = {
      id: `${userId}_${type}`,
      userId,
      type,
      status: 'connected',
      config: {},
      credentials,
      syncFrequency: 'daily',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.integrations.set(integration.id, integration);
    this.emit('integration:connected', { userId, type });

    return integration;
  }

  async sync(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) throw new Error('Integration not found');

    integration.status = 'syncing';
    integration.lastSyncAt = new Date();

    // Integration-specific sync logic would go here

    integration.status = 'connected';
    this.emit('integration:synced', { integrationId });
  }

  async getUserIntegrations(userId: string): Promise<Integration[]> {
    return Array.from(this.integrations.values()).filter(i => i.userId === userId);
  }

  async disconnect(integrationId: string): Promise<void> {
    this.integrations.delete(integrationId);
    this.emit('integration:disconnected', { integrationId });
  }
}

export const integrationManager = IntegrationManager.getInstance();
