/**
 * FlashERP Integration Type Definitions
 */

import {
  SyncStatus,
  SyncSystem,
  SyncEntityType,
  SyncDirection,
} from '../models/erp/ERPSync';
import { HealthStatus, SyncStatusEnum } from '../models/erp/ERPConfiguration';

// ============================================================================
// FlashERP API Types
// ============================================================================

export interface FlashERPCustomer {
  id: string;
  email: string;
  name: string;
  stripeCustomerId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FlashERPTransaction {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  type: 'payment' | 'refund' | 'adjustment';
  paymentMethod?: string;
  description?: string;
  upcoachReference: string;
  stripeTransactionId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FlashERPSubscription {
  id: string;
  customerId: string;
  plan: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  billingInterval: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canceledAt?: string;
  upcoachReference: string;
  stripeSubscriptionId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FlashERPInvoice {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate: string;
  paidAt?: string;
  upcoachReference: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FlashERPMetrics {
  revenue: number;
  costs: number;
  profit: number;
  mrr: number;
  arr: number;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  periodStart: string;
  periodEnd: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Sync Result Types
// ============================================================================

export interface SyncResult {
  success: boolean;
  syncId?: string;
  targetId?: string;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  duration?: number;
  timestamp: Date;
}

export interface BatchSyncResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results: SyncResult[];
  duration: number;
  timestamp: Date;
}

export interface SyncStats {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  averageDuration: number;
  totalDuration: number;
}

export interface RetryStats {
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  remaining: number;
}

export interface ReconciliationReport {
  timestamp: Date;
  totalRecords: number;
  matched: number;
  missing: number;
  discrepancies: number;
  details: {
    entity_type: SyncEntityType;
    upcoach_count: number;
    flasherp_count: number;
    missing_in_flasherp: string[];
    missing_in_upcoach: string[];
    discrepancies: Array<{
      upcoach_id: string;
      flasherp_id: string;
      field: string;
      upcoach_value: unknown;
      flasherp_value: unknown;
    }>;
  }[];
}

// ============================================================================
// Health Check Types
// ============================================================================

export interface HealthCheckResult {
  healthy: boolean;
  status: HealthStatus;
  latency?: number;
  message?: string;
  timestamp: Date;
  details?: {
    apiReachable: boolean;
    authValid: boolean;
    lastSuccessfulSync?: Date;
    failureRate?: number;
  };
}

export interface ERPStatus {
  enabled: boolean;
  healthStatus: HealthStatus;
  lastSyncStatus?: SyncStatusEnum;
  lastFullSync?: Date;
  nextScheduledSync?: Date;
  syncInterval: number;
  pendingSyncs: number;
  failedSyncs: number;
  configuration?: {
    baseURL: string;
    apiKeyMasked: string;
    webhooksEnabled: boolean;
    autoSyncEnabled: boolean;
    syncScope: string[];
  };
}

export interface ERPMetrics {
  syncMetrics: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    successRate: number;
    averageDuration: number;
  };
  entityMetrics: Array<{
    entityType: SyncEntityType;
    total: number;
    synced: number;
    failed: number;
    lastSyncAt?: Date;
  }>;
  errorMetrics: Array<{
    errorCode: string;
    count: number;
    lastOccurrence: Date;
  }>;
  healthHistory: Array<{
    timestamp: Date;
    status: HealthStatus;
    latency?: number;
  }>;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateCustomerRequest {
  email: string;
  name: string;
  stripeCustomerId?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateTransactionRequest {
  customerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  type: 'payment' | 'refund' | 'adjustment';
  paymentMethod?: string;
  description?: string;
  upcoachReference: string;
  stripeTransactionId?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateSubscriptionRequest {
  customerId: string;
  plan: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  billingInterval: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  upcoachReference: string;
  stripeSubscriptionId?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateInvoiceRequest {
  customerId: string;
  amount: number;
  currency: string;
  dueDate: string;
  upcoachReference: string;
  metadata?: Record<string, unknown>;
}

export interface CreateMetricsRequest {
  revenue: number;
  costs: number;
  profit: number;
  mrr: number;
  arr: number;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  periodStart: string;
  periodEnd: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface WebhookEvent {
  id: string;
  type: string;
  data: unknown;
  timestamp: string;
}

export interface FlashERPWebhookEvent extends WebhookEvent {
  type:
    | 'invoice.created'
    | 'invoice.updated'
    | 'invoice.paid'
    | 'payment.failed'
    | 'customer.updated'
    | 'sync.completed';
}

// ============================================================================
// Error Types
// ============================================================================

export enum ERPErrorCode {
  // Network errors
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',

  // Authentication errors
  AUTH_FAILED = 'AUTH_FAILED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  INVALID_API_SECRET = 'INVALID_API_SECRET',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // Server errors
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  // Sync errors
  SYNC_FAILED = 'SYNC_FAILED',
  DUPLICATE_SYNC = 'DUPLICATE_SYNC',
  SYNC_CONFLICT = 'SYNC_CONFLICT',

  // Configuration errors
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  CONFIG_DISABLED = 'CONFIG_DISABLED',
  CONFIG_INVALID = 'CONFIG_INVALID',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class ERPError extends Error {
  constructor(
    public code: ERPErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ERPError';
  }
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface SyncHistoryItem {
  id: string;
  sourceType: SyncEntityType;
  sourceId: string;
  targetId?: string;
  syncStatus: SyncStatus;
  syncDirection: SyncDirection;
  errorMessage?: string;
  errorCode?: string;
  lastSyncAttempt?: Date;
  lastSyncSuccess?: Date;
  retryCount: number;
  syncDuration?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  status: string;
  duration?: number;
  errorMessage?: string;
  performedBy?: string;
  ipAddress?: string;
  createdAt: Date;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ERPConfigurationInput {
  apiKey: string;
  apiSecret: string;
  baseURL?: string;
  webhookSecret?: string;
  isEnabled?: boolean;
  syncInterval?: number;
  enableAutoSync?: boolean;
  enableWebhooks?: boolean;
  syncScope?: {
    transactions?: boolean;
    subscriptions?: boolean;
    customers?: boolean;
    invoices?: boolean;
    financialReports?: boolean;
  };
}

export interface ERPConfigurationResponse {
  id: string;
  apiKeyMasked: string;
  baseURL: string;
  isEnabled: boolean;
  syncInterval: number;
  enableAutoSync: boolean;
  enableWebhooks: boolean;
  syncScope: {
    transactions: boolean;
    subscriptions: boolean;
    customers: boolean;
    invoices: boolean;
    financialReports: boolean;
  };
  lastFullSync?: Date;
  lastSyncStatus?: SyncStatusEnum;
  healthStatus: HealthStatus;
  healthCheckAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  latency?: number;
  timestamp: Date;
}
