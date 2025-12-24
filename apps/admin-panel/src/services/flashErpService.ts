/**
 * FlashERP Service
 * Handles all FlashERP integration API calls for the admin panel.
 */

import { apiClient } from './api';

// Types matching the API response structures

export interface ERPConfiguration {
  id: string;
  organizationId: string | null;
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
  lastFullSync: string | null;
  lastSyncStatus: 'success' | 'partial' | 'failed' | null;
  healthStatus: 'healthy' | 'degraded' | 'down';
  healthCheckAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  apiKeyMasked?: string;
  apiSecretMasked?: string;
  webhookSecretMasked?: string;
}

export interface ERPSync {
  id: string;
  sourceSystem: 'upcoach' | 'flasherp';
  sourceId: string;
  sourceType: 'transaction' | 'subscription' | 'customer' | 'invoice';
  targetSystem: 'upcoach' | 'flasherp';
  targetId: string | null;
  targetType: 'transaction' | 'subscription' | 'customer' | 'invoice';
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed' | 'skipped';
  syncDirection: 'upcoach_to_flasherp' | 'flasherp_to_upcoach' | 'bidirectional';
  errorMessage: string | null;
  errorCode: string | null;
  lastSyncAttempt: string | null;
  lastSyncSuccess: string | null;
  retryCount: number;
  nextRetryAt: string | null;
  syncDuration: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ERPAuditLog {
  id: string;
  action: 'sync' | 'webhook_received' | 'config_updated' | 'manual_sync' | 'health_check';
  entityType: 'transaction' | 'subscription' | 'customer' | 'invoice' | 'configuration';
  entityId: string | null;
  erpSyncId: string | null;
  status: 'initiated' | 'success' | 'failed';
  requestPayload: Record<string, unknown> | null;
  responsePayload: Record<string, unknown> | null;
  errorDetails: Record<string, unknown> | null;
  duration: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  performedBy: string | null;
  requestId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  syncId?: string;
  skipped?: boolean;
  duration: number;
  timestamp: string;
}

export interface SyncStats {
  total: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  duration: number;
  timestamp: string;
}

export interface ERPStatus {
  enabled: boolean;
  healthStatus: 'healthy' | 'degraded' | 'down';
  lastFullSync: string | null;
  lastSyncStatus: 'success' | 'partial' | 'failed' | null;
  scheduler: {
    running: boolean;
    jobs: string[];
  };
  stats: {
    recentSyncs: number;
    failedSyncs: number;
    pendingRetries: number;
  };
}

export interface ERPMetrics {
  last24h: {
    total: number;
    success: number;
    failed: number;
  };
  last7d: {
    total: number;
    success: number;
    failed: number;
  };
  pending: number;
  retryQueue: number;
}

export interface UpdateERPConfigInput {
  apiKey?: string;
  apiSecret?: string;
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

export interface TestConnectionResult {
  success: boolean;
  message: string;
  latency?: number;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: string;
  action?: string;
  sourceType?: string;
}

export interface Paginated Response<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class FlashErpService {
  // ============================================================================
  // Configuration Management
  // ============================================================================

  /**
   * Get FlashERP configuration
   */
  async getConfig(): Promise<ERPConfiguration> {
    const response = await apiClient.get('/erp/config');
    return response.data;
  }

  /**
   * Update FlashERP configuration
   */
  async updateConfig(config: UpdateERPConfigInput): Promise<ERPConfiguration> {
    const response = await apiClient.put('/erp/config', config);
    return response.data;
  }

  /**
   * Delete FlashERP configuration
   */
  async deleteConfig(): Promise<{ message: string }> {
    const response = await apiClient.delete('/erp/config');
    return response.data;
  }

  /**
   * Test connection to FlashERP
   */
  async testConnection(): Promise<TestConnectionResult> {
    const response = await apiClient.post('/erp/config/test');
    return response.data;
  }

  // ============================================================================
  // Sync Operations
  // ============================================================================

  /**
   * Sync a single transaction
   */
  async syncTransaction(id: string): Promise<SyncResult> {
    const response = await apiClient.post(`/erp/sync/transaction/${id}`);
    return response.data;
  }

  /**
   * Sync a single subscription
   */
  async syncSubscription(id: string): Promise<SyncResult> {
    const response = await apiClient.post(`/erp/sync/subscription/${id}`);
    return response.data;
  }

  /**
   * Sync a single customer
   */
  async syncCustomer(userId: string): Promise<SyncResult> {
    const response = await apiClient.post(`/erp/sync/customer/${userId}`);
    return response.data;
  }

  /**
   * Trigger full sync
   */
  async triggerFullSync(): Promise<{ message: string; status: string }> {
    const response = await apiClient.post('/erp/sync/full');
    return response.data;
  }

  /**
   * Trigger reconciliation
   */
  async triggerReconciliation(): Promise<any> {
    const response = await apiClient.post('/erp/sync/reconcile');
    return response.data;
  }

  // ============================================================================
  // Status & Monitoring
  // ============================================================================

  /**
   * Get ERP status
   */
  async getStatus(): Promise<ERPStatus> {
    const response = await apiClient.get('/erp/status');
    return response.data;
  }

  /**
   * Get sync history (paginated)
   */
  async getSyncHistory(params: PaginationParams = {}): Promise<PaginatedResponse<ERPSync>> {
    const response = await apiClient.get('/erp/sync-history', { params });
    return response.data;
  }

  /**
   * Get audit logs (paginated)
   */
  async getAuditLogs(params: PaginationParams = {}): Promise<PaginatedResponse<ERPAuditLog>> {
    const response = await apiClient.get('/erp/audit-logs', { params });
    return response.data;
  }

  /**
   * Get sync metrics
   */
  async getMetrics(): Promise<ERPMetrics> {
    const response = await apiClient.get('/erp/metrics');
    return response.data;
  }

  // ============================================================================
  // Retry Operations
  // ============================================================================

  /**
   * Retry a failed sync
   */
  async retrySyncRecord(syncId: string): Promise<{ message: string; sync: ERPSync }> {
    const response = await apiClient.post(`/erp/retry/${syncId}`);
    return response.data;
  }

  /**
   * Skip a sync record
   */
  async skipSyncRecord(syncId: string): Promise<{ message: string; sync: ERPSync }> {
    const response = await apiClient.post(`/erp/skip/${syncId}`);
    return response.data;
  }
}

// Export singleton instance
export const flashErpService = new FlashErpService();
