import { Model, DataTypes, Optional } from 'sequelize';

import { sequelize } from '../../config/sequelize';

export enum SyncScopeEntity {
  TRANSACTIONS = 'transactions',
  SUBSCRIPTIONS = 'subscriptions',
  CUSTOMERS = 'customers',
  INVOICES = 'invoices',
  FINANCIAL_REPORTS = 'financialReports',
}

export enum SyncStatusEnum {
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  DOWN = 'down',
}

export interface SyncScope {
  transactions: boolean;
  subscriptions: boolean;
  customers: boolean;
  invoices: boolean;
  financialReports: boolean;
}

export interface ERPConfigurationAttributes {
  id: string;
  organizationId?: string;
  apiKey: string;
  apiKeyHash: string;
  apiSecret: string;
  baseURL: string;
  webhookSecret?: string;
  isEnabled: boolean;
  syncInterval: number;
  enableAutoSync: boolean;
  enableWebhooks: boolean;
  syncScope: SyncScope;
  lastFullSync?: Date;
  lastSyncStatus?: SyncStatusEnum;
  healthStatus: HealthStatus;
  healthCheckAt?: Date;
  metadata?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface ERPConfigurationCreationAttributes
  extends Optional<
    ERPConfigurationAttributes,
    | 'id'
    | 'organizationId'
    | 'webhookSecret'
    | 'lastFullSync'
    | 'lastSyncStatus'
    | 'healthCheckAt'
    | 'metadata'
    | 'createdAt'
    | 'updatedAt'
    | 'createdBy'
    | 'updatedBy'
  > {}

export class ERPConfiguration
  extends Model<ERPConfigurationAttributes, ERPConfigurationCreationAttributes>
  implements ERPConfigurationAttributes
{
  public id!: string;
  public organizationId?: string;
  public apiKey!: string;
  public apiKeyHash!: string;
  public apiSecret!: string;
  public baseURL!: string;
  public webhookSecret?: string;
  public isEnabled!: boolean;
  public syncInterval!: number;
  public enableAutoSync!: boolean;
  public enableWebhooks!: boolean;
  public syncScope!: SyncScope;
  public lastFullSync?: Date;
  public lastSyncStatus?: SyncStatusEnum;
  public healthStatus!: HealthStatus;
  public healthCheckAt?: Date;
  public metadata?: unknown;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  public createdBy?: string;
  public updatedBy?: string;

  /**
   * Check if configuration is ready for sync
   */
  public isReadyForSync(): boolean {
    return (
      this.isEnabled &&
      this.healthStatus !== HealthStatus.DOWN &&
      !!this.apiKey &&
      !!this.apiSecret
    );
  }

  /**
   * Check if auto sync is due
   */
  public isAutoSyncDue(): boolean {
    if (!this.enableAutoSync || !this.isEnabled) return false;
    if (!this.lastFullSync) return true;

    const now = new Date();
    const lastSync = new Date(this.lastFullSync);
    const diff = (now.getTime() - lastSync.getTime()) / 1000; // Convert to seconds

    return diff >= this.syncInterval;
  }

  /**
   * Get masked API key for display
   */
  public getMaskedApiKey(): string {
    if (!this.apiKey) return '';
    if (this.apiKey.length <= 8) return '****';
    return `${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}`;
  }

  /**
   * Get sync scope summary
   */
  public getSyncScopeSummary(): string[] {
    const enabled: string[] = [];
    if (this.syncScope.transactions) enabled.push('Transactions');
    if (this.syncScope.subscriptions) enabled.push('Subscriptions');
    if (this.syncScope.customers) enabled.push('Customers');
    if (this.syncScope.invoices) enabled.push('Invoices');
    if (this.syncScope.financialReports) enabled.push('Financial Reports');
    return enabled;
  }

  /**
   * Get time until next auto sync
   */
  public getTimeUntilNextSync(): number {
    if (!this.lastFullSync) return 0;

    const now = new Date();
    const lastSync = new Date(this.lastFullSync);
    const elapsed = (now.getTime() - lastSync.getTime()) / 1000;
    const remaining = this.syncInterval - elapsed;

    return remaining > 0 ? remaining : 0;
  }
}

ERPConfiguration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'For multi-tenant support',
    },
    apiKey: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Encrypted at rest',
    },
    apiKeyHash: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Hash for validation',
    },
    apiSecret: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Encrypted at rest',
    },
    baseURL: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'https://api.flasherp.com/v1',
    },
    webhookSecret: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    syncInterval: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3600,
      comment: 'Sync interval in seconds',
    },
    enableAutoSync: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    enableWebhooks: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    syncScope: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        transactions: true,
        subscriptions: true,
        customers: true,
        invoices: true,
        financialReports: false,
      },
    },
    lastFullSync: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastSyncStatus: {
      type: DataTypes.ENUM(...Object.values(SyncStatusEnum)),
      allowNull: true,
    },
    healthStatus: {
      type: DataTypes.ENUM(...Object.values(HealthStatus)),
      allowNull: false,
      defaultValue: HealthStatus.HEALTHY,
    },
    healthCheckAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'erp_configurations',
    indexes: [
      {
        fields: ['organizationId'],
        name: 'erp_configurations_organization',
      },
      {
        fields: ['isEnabled'],
        name: 'erp_configurations_enabled',
      },
      {
        fields: ['healthStatus'],
        name: 'erp_configurations_health',
      },
    ],
  }
);
