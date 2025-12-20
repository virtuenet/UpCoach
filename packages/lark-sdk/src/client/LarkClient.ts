/**
 * LarkClient - Core HTTP client for Lark Open Platform API
 * Handles authentication, token management, and API requests
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import type {
  LarkConfig,
  TenantAccessToken,
  LarkApiResponse,
  LarkApiError as LarkApiErrorType,
  SendMessageRequest,
  SendMessageResponse,
  ReceiveIdType,
  LarkUser,
  LarkChat,
  BitableApp,
  BitableTable,
  BitableRecord,
  PaginatedResponse,
} from '../types';
import { LarkApiError } from '../types';

const DEFAULT_BASE_URL = 'https://open.larksuite.com/open-apis';
const DEFAULT_TIMEOUT = 30000;

export class LarkClient {
  private readonly config: Required<LarkConfig>;
  private readonly httpClient: AxiosInstance;
  private tenantAccessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: LarkConfig) {
    this.config = {
      appId: config.appId,
      appSecret: config.appSecret,
      encryptKey: config.encryptKey || '',
      verificationToken: config.verificationToken || '',
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      timeout: config.timeout || DEFAULT_TIMEOUT,
    };

    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error: AxiosError<LarkApiResponse>) => {
        if (error.response?.data) {
          const { code, msg } = error.response.data;
          throw new LarkApiError(
            code || error.response.status,
            msg || error.message,
            error.response.headers['x-request-id'] as string
          );
        }
        throw error;
      }
    );
  }

  // ============================================================================
  // Authentication
  // ============================================================================

  /**
   * Get tenant access token (automatically refreshes if expired)
   */
  async getTenantAccessToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid (with 5 min buffer)
    if (this.tenantAccessToken && this.tokenExpiry > now + 300000) {
      return this.tenantAccessToken;
    }

    const response = await this.httpClient.post<TenantAccessToken>(
      '/auth/v3/tenant_access_token/internal',
      {
        app_id: this.config.appId,
        app_secret: this.config.appSecret,
      }
    );

    if (response.data.code !== 0) {
      throw new LarkApiError(response.data.code, response.data.msg);
    }

    this.tenantAccessToken = response.data.tenant_access_token;
    this.tokenExpiry = now + (response.data.expire * 1000);

    return this.tenantAccessToken;
  }

  /**
   * Make authenticated API request
   */
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<LarkApiResponse<T>> {
    const token = await this.getTenantAccessToken();

    const response = await this.httpClient.request<LarkApiResponse<T>>({
      method,
      url: path,
      data,
      ...config,
      headers: {
        ...config?.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.code !== 0) {
      throw new LarkApiError(
        response.data.code,
        response.data.msg,
        response.headers['x-request-id'] as string
      );
    }

    return response.data;
  }

  // ============================================================================
  // Messaging API
  // ============================================================================

  /**
   * Send a message to a user or chat
   */
  async sendMessage(
    receiveId: string,
    receiveIdType: ReceiveIdType,
    msgType: SendMessageRequest['msg_type'],
    content: string | object
  ): Promise<SendMessageResponse['data']> {
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

    const response = await this.request<SendMessageResponse['data']>(
      'POST',
      `/im/v1/messages?receive_id_type=${receiveIdType}`,
      {
        receive_id: receiveId,
        msg_type: msgType,
        content: contentStr,
      }
    );

    return response.data;
  }

  /**
   * Send a text message
   */
  async sendText(
    receiveId: string,
    receiveIdType: ReceiveIdType,
    text: string
  ): Promise<SendMessageResponse['data']> {
    return this.sendMessage(receiveId, receiveIdType, 'text', { text });
  }

  /**
   * Send an interactive card message
   */
  async sendCard(
    receiveId: string,
    receiveIdType: ReceiveIdType,
    card: object
  ): Promise<SendMessageResponse['data']> {
    return this.sendMessage(receiveId, receiveIdType, 'interactive', card);
  }

  /**
   * Reply to a message
   */
  async replyMessage(
    messageId: string,
    msgType: SendMessageRequest['msg_type'],
    content: string | object
  ): Promise<SendMessageResponse['data']> {
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

    const response = await this.request<SendMessageResponse['data']>(
      'POST',
      `/im/v1/messages/${messageId}/reply`,
      {
        msg_type: msgType,
        content: contentStr,
      }
    );

    return response.data;
  }

  /**
   * Update an interactive card message
   */
  async updateCard(messageId: string, card: object): Promise<void> {
    await this.request('PATCH', `/im/v1/messages/${messageId}`, {
      content: JSON.stringify(card),
    });
  }

  // ============================================================================
  // User API
  // ============================================================================

  /**
   * Get user info by ID
   */
  async getUser(
    userId: string,
    userIdType: 'open_id' | 'user_id' | 'union_id' = 'open_id'
  ): Promise<LarkUser> {
    const response = await this.request<{ user: LarkUser }>(
      'GET',
      `/contact/v3/users/${userId}?user_id_type=${userIdType}`
    );

    return response.data!.user;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<LarkUser | null> {
    const response = await this.request<{ user_list: Array<{ user: LarkUser; user_id: string }> }>(
      'POST',
      '/contact/v3/users/batch_get_id?user_id_type=open_id',
      { emails: [email] }
    );

    const userList = response.data?.user_list;
    if (userList && userList.length > 0) {
      return userList[0].user;
    }

    return null;
  }

  // ============================================================================
  // Chat/Group API
  // ============================================================================

  /**
   * Get chat info
   */
  async getChat(chatId: string): Promise<LarkChat> {
    const response = await this.request<LarkChat>('GET', `/im/v1/chats/${chatId}`);
    return response.data!;
  }

  /**
   * List all chats the bot is in
   */
  async listChats(pageSize = 100, pageToken?: string): Promise<PaginatedResponse<LarkChat>['data']> {
    const params = new URLSearchParams({ page_size: String(pageSize) });
    if (pageToken) params.set('page_token', pageToken);

    const response = await this.request<{ items: LarkChat[]; has_more: boolean; page_token?: string }>(
      'GET',
      `/im/v1/chats?${params.toString()}`
    );

    return response.data!;
  }

  /**
   * Get members of a chat
   */
  async getChatMembers(
    chatId: string,
    pageSize = 100,
    pageToken?: string
  ): Promise<PaginatedResponse<{ member_id: string; member_id_type: string; name: string }>['data']> {
    const params = new URLSearchParams({ page_size: String(pageSize) });
    if (pageToken) params.set('page_token', pageToken);

    const response = await this.request<{ items: Array<{ member_id: string; member_id_type: string; name: string }>; has_more: boolean; page_token?: string }>(
      'GET',
      `/im/v1/chats/${chatId}/members?${params.toString()}`
    );

    return response.data!;
  }

  // ============================================================================
  // Bitable (Base) API
  // ============================================================================

  /**
   * Get Bitable app info
   */
  async getBitableApp(appToken: string): Promise<BitableApp> {
    const response = await this.request<{ app: BitableApp }>(
      'GET',
      `/bitable/v1/apps/${appToken}`
    );
    return response.data!.app;
  }

  /**
   * List tables in a Bitable app
   */
  async listBitableTables(appToken: string): Promise<BitableTable[]> {
    const response = await this.request<{ items: BitableTable[] }>(
      'GET',
      `/bitable/v1/apps/${appToken}/tables`
    );
    return response.data!.items;
  }

  /**
   * Get records from a Bitable table
   */
  async getBitableRecords(
    appToken: string,
    tableId: string,
    options?: {
      view_id?: string;
      filter?: string;
      sort?: string;
      field_names?: string[];
      page_size?: number;
      page_token?: string;
    }
  ): Promise<PaginatedResponse<BitableRecord>['data']> {
    const params = new URLSearchParams();
    if (options?.view_id) params.set('view_id', options.view_id);
    if (options?.filter) params.set('filter', options.filter);
    if (options?.sort) params.set('sort', options.sort);
    if (options?.field_names) params.set('field_names', JSON.stringify(options.field_names));
    if (options?.page_size) params.set('page_size', String(options.page_size));
    if (options?.page_token) params.set('page_token', options.page_token);

    const response = await this.request<{ items: BitableRecord[]; has_more: boolean; page_token?: string }>(
      'GET',
      `/bitable/v1/apps/${appToken}/tables/${tableId}/records?${params.toString()}`
    );

    return response.data!;
  }

  /**
   * Create a record in a Bitable table
   */
  async createBitableRecord(
    appToken: string,
    tableId: string,
    fields: Record<string, unknown>
  ): Promise<BitableRecord> {
    const response = await this.request<{ record: BitableRecord }>(
      'POST',
      `/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
      { fields }
    );
    return response.data!.record;
  }

  /**
   * Update a record in a Bitable table
   */
  async updateBitableRecord(
    appToken: string,
    tableId: string,
    recordId: string,
    fields: Record<string, unknown>
  ): Promise<BitableRecord> {
    const response = await this.request<{ record: BitableRecord }>(
      'PUT',
      `/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
      { fields }
    );
    return response.data!.record;
  }

  /**
   * Delete a record from a Bitable table
   */
  async deleteBitableRecord(
    appToken: string,
    tableId: string,
    recordId: string
  ): Promise<void> {
    await this.request(
      'DELETE',
      `/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`
    );
  }

  // ============================================================================
  // Webhook Verification
  // ============================================================================

  /**
   * Get verification token for webhook setup
   */
  getVerificationToken(): string {
    return this.config.verificationToken;
  }

  /**
   * Get encrypt key for webhook decryption
   */
  getEncryptKey(): string {
    return this.config.encryptKey;
  }

  /**
   * Get app ID
   */
  getAppId(): string {
    return this.config.appId;
  }
}
