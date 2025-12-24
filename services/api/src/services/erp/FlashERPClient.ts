import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

import { RetryPolicy, RetryStrategy } from '../../utils/RetryPolicy';
import { CircuitBreaker } from '../../utils/CircuitBreaker';
import { logger } from '../../utils/logger';
import {
  ERPError,
  ERPErrorCode,
  FlashERPCustomer,
  FlashERPTransaction,
  FlashERPSubscription,
  FlashERPInvoice,
  FlashERPMetrics,
  TestConnectionResponse,
} from '../../types/flasherp';
import { ERPConfiguration } from '../../models/erp/ERPConfiguration';

/**
 * FlashERP HTTP Client
 * Handles all communication with FlashERP API
 */
export class FlashERPClient {
  private client: AxiosInstance;
  private retryPolicy: RetryPolicy;
  private circuitBreaker: CircuitBreaker;
  private config: ERPConfiguration;

  constructor(config: ERPConfiguration) {
    this.config = config;

    // Initialize Axios client
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'UpCoach/1.0',
        Authorization: `Bearer ${config.apiKey}`,
        'X-API-Secret': config.apiSecret,
      },
    });

    // Initialize retry policy (max 4 attempts)
    this.retryPolicy = new RetryPolicy({
      maxAttempts: 4,
      baseDelayMs: 2000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      jitterMs: 1000,
      retryCondition: (error, attempt) => {
        const httpError = error as any;
        if (httpError.response) {
          const status = httpError.response.status;
          // Don't retry 4xx except 429 (rate limit)
          if (status >= 400 && status < 500) {
            return status === 429;
          }
          // Retry 5xx
          return status >= 500;
        }
        // Retry network errors
        return true;
      },
      onRetry: (error, attempt) => {
        logger.warn('FlashERP API retry', {
          attempt,
          error: (error as Error).message,
        });
      },
    });

    // Initialize circuit breaker (5 failures, 60s reset)
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 60000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('FlashERP API request', {
          method: config.method,
          url: config.url,
          params: config.params,
        });
        return config;
      },
      (error) => {
        logger.error('FlashERP API request error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.info('FlashERP API success', {
          method: response.config.method,
          url: response.config.url,
          status: response.status,
        });
        return response;
      },
      (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        logger.error('FlashERP API error', {
          method: error.config?.method,
          url: error.config?.url,
          status,
          message,
        });

        throw this.mapErrorToERPError(error);
      }
    );
  }

  /**
   * Generic request method with retry and circuit breaker
   */
  private async request<T>(
    method: string,
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      const result = await this.retryPolicy.execute(
        async () => {
          const response = await this.client.request<T>({
            method,
            url: path,
            data,
            ...config,
          });
          return response.data;
        },
        RetryStrategy.EXPONENTIAL_BACKOFF
      );
      return result.result;
    });
  }

  /**
   * GET request
   */
  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>('GET', path, undefined, { params });
  }

  /**
   * POST request
   */
  async post<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>('POST', path, data);
  }

  /**
   * PUT request
   */
  async put<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>('PUT', path, data);
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  /**
   * Test connection to FlashERP
   */
  async testConnection(): Promise<TestConnectionResponse> {
    const startTime = Date.now();

    try {
      await this.get('/health');

      return {
        success: true,
        message: 'Connection successful',
        latency: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('FlashERP connection test failed', { error });

      return {
        success: false,
        message: `Connection failed: ${(error as Error).message}`,
        latency: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus() {
    return {
      state: this.circuitBreaker.getState(),
      metrics: this.circuitBreaker.getMetrics(),
    };
  }

  /**
   * Map Axios errors to ERPError
   */
  private mapErrorToERPError(error: any): ERPError {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new ERPError(
        ERPErrorCode.CONNECTION_FAILED,
        'Failed to connect to FlashERP API',
        error
      );
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return new ERPError(ERPErrorCode.TIMEOUT, 'Request timeout', error);
    }

    if (!error.response) {
      return new ERPError(
        ERPErrorCode.NETWORK_ERROR,
        'Network error occurred',
        error
      );
    }

    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 401:
      case 403:
        return new ERPError(
          ERPErrorCode.AUTH_FAILED,
          data?.message || 'Authentication failed',
          data
        );

      case 400:
        return new ERPError(
          ERPErrorCode.VALIDATION_ERROR,
          data?.message || 'Validation error',
          data
        );

      case 404:
        return new ERPError(
          ERPErrorCode.RESOURCE_NOT_FOUND,
          data?.message || 'Resource not found',
          data
        );

      case 409:
        return new ERPError(
          ERPErrorCode.RESOURCE_CONFLICT,
          data?.message || 'Resource conflict',
          data
        );

      case 429:
        return new ERPError(
          ERPErrorCode.RATE_LIMIT_EXCEEDED,
          data?.message || 'Rate limit exceeded',
          data
        );

      case 500:
      case 502:
      case 503:
      case 504:
        return new ERPError(
          ERPErrorCode.SERVER_ERROR,
          data?.message || 'Server error',
          data
        );

      default:
        return new ERPError(
          ERPErrorCode.UNKNOWN_ERROR,
          data?.message || 'Unknown error',
          data
        );
    }
  }

  // ============================================================================
  // Customer API Methods
  // ============================================================================

  async getCustomer(customerId: string): Promise<FlashERPCustomer> {
    return this.get<FlashERPCustomer>(`/customers/${customerId}`);
  }

  async createCustomer(
    data: Partial<FlashERPCustomer>
  ): Promise<FlashERPCustomer> {
    return this.post<FlashERPCustomer>('/customers', data);
  }

  async updateCustomer(
    customerId: string,
    data: Partial<FlashERPCustomer>
  ): Promise<FlashERPCustomer> {
    return this.put<FlashERPCustomer>(`/customers/${customerId}`, data);
  }

  // ============================================================================
  // Transaction API Methods
  // ============================================================================

  async getTransaction(transactionId: string): Promise<FlashERPTransaction> {
    return this.get<FlashERPTransaction>(`/transactions/${transactionId}`);
  }

  async createTransaction(
    data: Partial<FlashERPTransaction>
  ): Promise<FlashERPTransaction> {
    return this.post<FlashERPTransaction>('/transactions', data);
  }

  async updateTransaction(
    transactionId: string,
    data: Partial<FlashERPTransaction>
  ): Promise<FlashERPTransaction> {
    return this.put<FlashERPTransaction>(
      `/transactions/${transactionId}`,
      data
    );
  }

  // ============================================================================
  // Subscription API Methods
  // ============================================================================

  async getSubscription(subscriptionId: string): Promise<FlashERPSubscription> {
    return this.get<FlashERPSubscription>(`/subscriptions/${subscriptionId}`);
  }

  async createSubscription(
    data: Partial<FlashERPSubscription>
  ): Promise<FlashERPSubscription> {
    return this.post<FlashERPSubscription>('/subscriptions', data);
  }

  async updateSubscription(
    subscriptionId: string,
    data: Partial<FlashERPSubscription>
  ): Promise<FlashERPSubscription> {
    return this.put<FlashERPSubscription>(
      `/subscriptions/${subscriptionId}`,
      data
    );
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    return this.delete(`/subscriptions/${subscriptionId}`);
  }

  // ============================================================================
  // Invoice API Methods
  // ============================================================================

  async getInvoice(invoiceId: string): Promise<FlashERPInvoice> {
    return this.get<FlashERPInvoice>(`/invoices/${invoiceId}`);
  }

  async createInvoice(
    data: Partial<FlashERPInvoice>
  ): Promise<FlashERPInvoice> {
    return this.post<FlashERPInvoice>('/invoices', data);
  }

  // ============================================================================
  // Metrics API Methods
  // ============================================================================

  async createMetrics(data: Partial<FlashERPMetrics>): Promise<FlashERPMetrics> {
    return this.post<FlashERPMetrics>('/metrics', data);
  }
}
