/**
 * Connector SDK
 *
 * Base SDK for building custom connectors with standard interfaces,
 * authentication methods, retry logic, and error handling.
 *
 * Features:
 * - Base connector class for extension
 * - Multiple authentication methods (OAuth 2.0, API Key, Basic Auth, Bearer)
 * - Request builder with automatic retry
 * - Response transformation utilities
 * - Error handling and normalization
 * - Rate limit handling with exponential backoff
 * - Pagination support (cursor-based, offset-based)
 * - Webhook receiver registration
 * - Field mapping utilities
 * - Data validation schemas
 * - Comprehensive logging and telemetry
 */

import { EventEmitter } from 'events';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Redis } from 'ioredis';

export type AuthMethod = 'oauth2' | 'api_key' | 'basic' | 'bearer' | 'custom';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type PaginationType = 'cursor' | 'offset' | 'page' | 'none';

export interface ConnectorConfig {
  id: string;
  name: string;
  baseUrl: string;
  authMethod: AuthMethod;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  rateLimit?: RateLimitConfig;
  headers?: Record<string, string>;
  validateStatus?: (status: number) => boolean;
}

export interface RateLimitConfig {
  maxRequests: number;
  perMilliseconds: number;
  strategy: 'fixed' | 'sliding';
}

export interface AuthCredentials {
  type: AuthMethod;
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  customHeaders?: Record<string, string>;
  expiresAt?: Date;
}

export interface RequestOptions {
  method: HttpMethod;
  endpoint: string;
  params?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  validateResponse?: boolean;
}

export interface ResponseData<T = any> {
  success: boolean;
  data?: T;
  error?: ConnectorError;
  metadata?: {
    statusCode: number;
    headers: Record<string, string>;
    duration: number;
    retries: number;
  };
}

export interface ConnectorError {
  code: string;
  message: string;
  statusCode?: number;
  originalError?: any;
  retryable: boolean;
}

export interface PaginationConfig {
  type: PaginationType;
  pageSize?: number;
  cursorField?: string;
  offsetField?: string;
  limitField?: string;
  pageField?: string;
  totalField?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  nextPage?: number;
  total?: number;
  hasMore: boolean;
}

export interface FieldMapping {
  source: string;
  target: string;
  transform?: (value: any) => any;
  required?: boolean;
  defaultValue?: any;
}

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'email' | 'url';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

export interface WebhookConfig {
  url: string;
  secret: string;
  events: string[];
  headers?: Record<string, string>;
}

export abstract class BaseConnector extends EventEmitter {
  protected config: ConnectorConfig;
  protected credentials: AuthCredentials | null = null;
  protected httpClient: AxiosInstance;
  protected redis: Redis;
  protected rateLimiter: RateLimiter;
  protected requestCount = 0;
  protected errorCount = 0;

  constructor(config: ConnectorConfig) {
    super();
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: this.config.headers || {},
      validateStatus: this.config.validateStatus || ((status) => status >= 200 && status < 300),
    });

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 10,
    });

    if (this.config.rateLimit) {
      this.rateLimiter = new RateLimiter(this.config.rateLimit, this.redis);
    }

    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    this.httpClient.interceptors.request.use(
      async (config) => {
        if (this.rateLimiter) {
          await this.rateLimiter.waitForToken(this.config.id);
        }

        await this.addAuthentication(config);

        this.emit('request:start', { url: config.url, method: config.method });
        return config;
      },
      (error) => {
        this.emit('request:error', error);
        return Promise.reject(error);
      }
    );

    this.httpClient.interceptors.response.use(
      (response) => {
        this.emit('request:success', {
          url: response.config.url,
          status: response.status,
          duration: response.config.metadata?.duration,
        });
        return response;
      },
      async (error) => {
        return this.handleResponseError(error);
      }
    );
  }

  /**
   * Add authentication to request
   */
  private async addAuthentication(config: AxiosRequestConfig): Promise<void> {
    if (!this.credentials) return;

    switch (this.credentials.type) {
      case 'oauth2':
        if (this.credentials.expiresAt && new Date() >= this.credentials.expiresAt) {
          await this.refreshAccessToken();
        }
        if (this.credentials.accessToken) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${this.credentials.accessToken}`;
        }
        break;

      case 'bearer':
        if (this.credentials.accessToken) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${this.credentials.accessToken}`;
        }
        break;

      case 'api_key':
        if (this.credentials.apiKey) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `ApiKey ${this.credentials.apiKey}`;
        }
        break;

      case 'basic':
        if (this.credentials.username && this.credentials.password) {
          const encoded = Buffer.from(
            `${this.credentials.username}:${this.credentials.password}`
          ).toString('base64');
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Basic ${encoded}`;
        }
        break;

      case 'custom':
        if (this.credentials.customHeaders) {
          config.headers = { ...config.headers, ...this.credentials.customHeaders };
        }
        break;
    }
  }

  /**
   * Handle response errors
   */
  private async handleResponseError(error: AxiosError): Promise<any> {
    this.errorCount++;

    const statusCode = error.response?.status;
    const isRetryable = this.isRetryableError(statusCode);

    if (statusCode === 429) {
      const retryAfter = this.getRetryAfter(error.response);
      await this.delay(retryAfter);
      return this.httpClient.request(error.config!);
    }

    if (statusCode === 401 && this.credentials?.type === 'oauth2') {
      try {
        await this.refreshAccessToken();
        return this.httpClient.request(error.config!);
      } catch (refreshError) {
        this.emit('auth:failed', refreshError);
      }
    }

    this.emit('request:error', {
      url: error.config?.url,
      status: statusCode,
      message: error.message,
      retryable: isRetryable,
    });

    return Promise.reject(this.normalizeError(error));
  }

  /**
   * Connect to the service
   */
  async connect(credentials: AuthCredentials): Promise<boolean> {
    try {
      this.credentials = credentials;
      const isValid = await this.validateConnection();

      if (isValid) {
        this.emit('connected', { connectorId: this.config.id });
        return true;
      }

      throw new Error('Connection validation failed');
    } catch (error) {
      this.emit('connection:failed', error);
      throw this.normalizeError(error);
    }
  }

  /**
   * Disconnect from the service
   */
  async disconnect(): Promise<void> {
    this.credentials = null;
    await this.redis.quit();
    this.emit('disconnected', { connectorId: this.config.id });
  }

  /**
   * Validate connection
   */
  abstract validateConnection(): Promise<boolean>;

  /**
   * Refresh OAuth access token
   */
  protected async refreshAccessToken(): Promise<void> {
    if (!this.credentials?.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.emit('auth:refreshing');
    throw new Error('Token refresh must be implemented by specific connector');
  }

  /**
   * Execute a request
   */
  async execute<T = any>(options: RequestOptions): Promise<ResponseData<T>> {
    const startTime = Date.now();
    let retries = 0;
    const maxRetries = options.retries ?? this.config.maxRetries ?? 3;

    while (retries <= maxRetries) {
      try {
        this.requestCount++;

        const response = await this.httpClient.request<T>({
          method: options.method,
          url: options.endpoint,
          params: options.params,
          data: options.body,
          headers: options.headers,
          timeout: options.timeout || this.config.timeout,
        });

        const duration = Date.now() - startTime;

        if (options.validateResponse !== false) {
          await this.validateResponse(response.data);
        }

        return {
          success: true,
          data: response.data,
          metadata: {
            statusCode: response.status,
            headers: response.headers as Record<string, string>,
            duration,
            retries,
          },
        };
      } catch (error) {
        retries++;

        const connectorError = this.normalizeError(error);

        if (retries > maxRetries || !connectorError.retryable) {
          return {
            success: false,
            error: connectorError,
            metadata: {
              statusCode: connectorError.statusCode || 0,
              headers: {},
              duration: Date.now() - startTime,
              retries: retries - 1,
            },
          };
        }

        const delay = this.calculateBackoff(retries, this.config.retryDelay || 1000);
        await this.delay(delay);
      }
    }

    return {
      success: false,
      error: {
        code: 'MAX_RETRIES_EXCEEDED',
        message: 'Maximum retry attempts exceeded',
        retryable: false,
      },
      metadata: {
        statusCode: 0,
        headers: {},
        duration: Date.now() - startTime,
        retries: maxRetries,
      },
    };
  }

  /**
   * Fetch paginated data
   */
  async *fetchPaginated<T>(
    options: RequestOptions,
    paginationConfig: PaginationConfig
  ): AsyncGenerator<T[], void, unknown> {
    let hasMore = true;
    let cursor: string | undefined;
    let page = 1;
    let offset = 0;

    while (hasMore) {
      const params = { ...options.params };

      switch (paginationConfig.type) {
        case 'cursor':
          if (cursor && paginationConfig.cursorField) {
            params[paginationConfig.cursorField] = cursor;
          }
          if (paginationConfig.pageSize && paginationConfig.limitField) {
            params[paginationConfig.limitField] = paginationConfig.pageSize;
          }
          break;

        case 'offset':
          if (paginationConfig.offsetField) {
            params[paginationConfig.offsetField] = offset;
          }
          if (paginationConfig.pageSize && paginationConfig.limitField) {
            params[paginationConfig.limitField] = paginationConfig.pageSize;
          }
          break;

        case 'page':
          if (paginationConfig.pageField) {
            params[paginationConfig.pageField] = page;
          }
          if (paginationConfig.pageSize && paginationConfig.limitField) {
            params[paginationConfig.limitField] = paginationConfig.pageSize;
          }
          break;
      }

      const response = await this.execute<any>({ ...options, params });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch data');
      }

      const result = this.extractPaginationData<T>(response.data, paginationConfig);

      if (result.items.length > 0) {
        yield result.items;
      }

      hasMore = result.hasMore;
      cursor = result.nextCursor;
      page = result.nextPage || page + 1;
      offset += paginationConfig.pageSize || 100;

      if (!hasMore || result.items.length === 0) {
        break;
      }
    }
  }

  /**
   * Extract pagination data from response
   */
  private extractPaginationData<T>(
    data: any,
    config: PaginationConfig
  ): PaginatedResponse<T> {
    let items: T[] = Array.isArray(data) ? data : data.items || data.results || data.data || [];
    let hasMore = false;
    let nextCursor: string | undefined;
    let nextPage: number | undefined;
    let total: number | undefined;

    switch (config.type) {
      case 'cursor':
        nextCursor = config.cursorField ? data[config.cursorField] : undefined;
        hasMore = !!nextCursor;
        break;

      case 'offset':
        total = config.totalField ? data[config.totalField] : undefined;
        hasMore = total ? items.length > 0 && items.length >= (config.pageSize || 100) : items.length > 0;
        break;

      case 'page':
        nextPage = data.nextPage || data.next_page;
        total = config.totalField ? data[config.totalField] : undefined;
        hasMore = !!nextPage || items.length >= (config.pageSize || 100);
        break;

      case 'none':
        hasMore = false;
        break;
    }

    return { items, nextCursor, nextPage, total, hasMore };
  }

  /**
   * Map fields from source to target schema
   */
  mapFields<T extends Record<string, any>, R extends Record<string, any>>(
    source: T,
    mappings: FieldMapping[]
  ): R {
    const result: any = {};

    for (const mapping of mappings) {
      let value = this.getNestedValue(source, mapping.source);

      if (value === undefined || value === null) {
        if (mapping.required) {
          throw new Error(`Required field missing: ${mapping.source}`);
        }
        value = mapping.defaultValue;
      }

      if (value !== undefined && mapping.transform) {
        value = mapping.transform(value);
      }

      if (value !== undefined) {
        this.setNestedValue(result, mapping.target, value);
      }
    }

    return result as R;
  }

  /**
   * Validate data against schema
   */
  validateData(data: any, rules: ValidationRule[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = this.getNestedValue(data, rule.field);

      if (value === undefined || value === null) {
        if (rule.required) {
          errors.push(`Field '${rule.field}' is required`);
        }
        continue;
      }

      const typeValid = this.validateType(value, rule.type);
      if (!typeValid) {
        errors.push(`Field '${rule.field}' must be of type ${rule.type}`);
        continue;
      }

      if (rule.min !== undefined) {
        if (
          (typeof value === 'number' && value < rule.min) ||
          (typeof value === 'string' && value.length < rule.min) ||
          (Array.isArray(value) && value.length < rule.min)
        ) {
          errors.push(`Field '${rule.field}' must be at least ${rule.min}`);
        }
      }

      if (rule.max !== undefined) {
        if (
          (typeof value === 'number' && value > rule.max) ||
          (typeof value === 'string' && value.length > rule.max) ||
          (Array.isArray(value) && value.length > rule.max)
        ) {
          errors.push(`Field '${rule.field}' must not exceed ${rule.max}`);
        }
      }

      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(`Field '${rule.field}' does not match required pattern`);
      }

      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`Field '${rule.field}' must be one of: ${rule.enum.join(', ')}`);
      }

      if (rule.custom) {
        const customResult = rule.custom(value);
        if (typeof customResult === 'string') {
          errors.push(customResult);
        } else if (!customResult) {
          errors.push(`Field '${rule.field}' failed custom validation`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate type
   */
  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && !Array.isArray(value) && value !== null;
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'url':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      default:
        return true;
    }
  }

  /**
   * Register webhook
   */
  async registerWebhook(config: WebhookConfig): Promise<{ id: string; url: string }> {
    throw new Error('Webhook registration must be implemented by specific connector');
  }

  /**
   * Unregister webhook
   */
  async unregisterWebhook(webhookId: string): Promise<void> {
    throw new Error('Webhook unregistration must be implemented by specific connector');
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Transform response data
   */
  protected transformResponse<T>(data: any, transformer?: (data: any) => T): T {
    if (transformer) {
      return transformer(data);
    }
    return data as T;
  }

  /**
   * Validate response data
   */
  protected async validateResponse(data: any): Promise<void> {
    return;
  }

  /**
   * Normalize error
   */
  protected normalizeError(error: any): ConnectorError {
    if (error.isAxiosError) {
      const axiosError = error as AxiosError;
      return {
        code: axiosError.code || 'UNKNOWN_ERROR',
        message: axiosError.message,
        statusCode: axiosError.response?.status,
        originalError: axiosError.response?.data,
        retryable: this.isRetryableError(axiosError.response?.status),
      };
    }

    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      retryable: false,
      originalError: error,
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(statusCode?: number): boolean {
    if (!statusCode) return true;
    return statusCode >= 500 || statusCode === 429 || statusCode === 408;
  }

  /**
   * Get retry-after header value
   */
  private getRetryAfter(response?: AxiosResponse): number {
    const retryAfter = response?.headers['retry-after'];
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        return seconds * 1000;
      }
    }
    return 5000;
  }

  /**
   * Calculate exponential backoff
   */
  private calculateBackoff(attempt: number, baseDelay: number): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, 30000);
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value in object
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get connector statistics
   */
  getStats(): {
    requestCount: number;
    errorCount: number;
    successRate: number;
  } {
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      successRate:
        this.requestCount > 0
          ? ((this.requestCount - this.errorCount) / this.requestCount) * 100
          : 100,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.requestCount = 0;
    this.errorCount = 0;
  }
}

/**
 * Rate Limiter
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private redis: Redis;

  constructor(config: RateLimitConfig, redis: Redis) {
    this.config = config;
    this.redis = redis;
  }

  async waitForToken(key: string): Promise<void> {
    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / this.config.perMilliseconds)}`;

    while (true) {
      const count = await this.redis.incr(windowKey);

      if (count === 1) {
        await this.redis.pexpire(windowKey, this.config.perMilliseconds);
      }

      if (count <= this.config.maxRequests) {
        return;
      }

      await this.delay(100);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Example Connector Implementation
 */
export class ExampleConnector extends BaseConnector {
  constructor() {
    super({
      id: 'example',
      name: 'Example Connector',
      baseUrl: 'https://api.example.com',
      authMethod: 'oauth2',
      timeout: 30000,
      maxRetries: 3,
      rateLimit: {
        maxRequests: 100,
        perMilliseconds: 60000,
        strategy: 'sliding',
      },
    });
  }

  async validateConnection(): Promise<boolean> {
    const response = await this.execute({
      method: 'GET',
      endpoint: '/v1/me',
    });

    return response.success;
  }

  async getUser(userId: string): Promise<any> {
    const response = await this.execute({
      method: 'GET',
      endpoint: `/v1/users/${userId}`,
    });

    return response.data;
  }

  async createUser(userData: any): Promise<any> {
    const validation = this.validateData(userData, [
      { field: 'email', type: 'email', required: true },
      { field: 'name', type: 'string', required: true, min: 2, max: 100 },
    ]);

    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const response = await this.execute({
      method: 'POST',
      endpoint: '/v1/users',
      body: userData,
    });

    return response.data;
  }

  async listUsers(): Promise<any[]> {
    const allUsers: any[] = [];

    for await (const batch of this.fetchPaginated(
      {
        method: 'GET',
        endpoint: '/v1/users',
      },
      {
        type: 'cursor',
        cursorField: 'next_cursor',
        limitField: 'limit',
        pageSize: 100,
      }
    )) {
      allUsers.push(...batch);
    }

    return allUsers;
  }
}

export default BaseConnector;
