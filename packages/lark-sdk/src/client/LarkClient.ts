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

  // ============================================================================
  // Extended Bitable API (for BitableService)
  // ============================================================================

  /**
   * List records from a Bitable table with advanced options
   */
  async listBitableRecords<T = Record<string, unknown>>(options: {
    appToken: string;
    tableId: string;
    filter?: {
      conjunction?: 'and' | 'or';
      conditions?: Array<{
        field_name: string;
        operator: string;
        value?: unknown;
      }>;
    };
    sort?: Array<{ field_name: string; desc?: boolean }>;
    pageSize?: number;
    pageToken?: string;
  }): Promise<{
    code: number;
    msg: string;
    data: {
      has_more: boolean;
      page_token?: string;
      total: number;
      items: Array<{ record_id: string; fields: T }>;
    };
  }> {
    const params = new URLSearchParams();
    if (options.pageSize) params.set('page_size', String(options.pageSize));
    if (options.pageToken) params.set('page_token', options.pageToken);
    if (options.filter) params.set('filter', JSON.stringify(options.filter));
    if (options.sort) params.set('sort', JSON.stringify(options.sort));

    const response = await this.request<{
      has_more: boolean;
      page_token?: string;
      total: number;
      items: Array<{ record_id: string; fields: T }>;
    }>(
      'GET',
      `/bitable/v1/apps/${options.appToken}/tables/${options.tableId}/records?${params.toString()}`
    );

    return {
      code: 0,
      msg: 'success',
      data: response.data!,
    };
  }

  /**
   * Create a record in a Bitable table (extended version with options object)
   */
  async createBitableRecordEx(options: {
    appToken: string;
    tableId: string;
    fields: Record<string, unknown>;
  }): Promise<{
    code: number;
    msg: string;
    data: {
      record: { record_id: string; fields: Record<string, unknown> };
    };
  }> {
    const response = await this.request<{ record: { record_id: string; fields: Record<string, unknown> } }>(
      'POST',
      `/bitable/v1/apps/${options.appToken}/tables/${options.tableId}/records`,
      { fields: options.fields }
    );

    return {
      code: 0,
      msg: 'success',
      data: response.data!,
    };
  }

  /**
   * Update a record in a Bitable table (extended version with options object)
   */
  async updateBitableRecordEx(options: {
    appToken: string;
    tableId: string;
    recordId: string;
    fields: Record<string, unknown>;
  }): Promise<{
    code: number;
    msg: string;
    data: {
      record: { record_id: string; fields: Record<string, unknown> };
    };
  }> {
    const response = await this.request<{ record: { record_id: string; fields: Record<string, unknown> } }>(
      'PUT',
      `/bitable/v1/apps/${options.appToken}/tables/${options.tableId}/records/${options.recordId}`,
      { fields: options.fields }
    );

    return {
      code: 0,
      msg: 'success',
      data: response.data!,
    };
  }

  // ============================================================================
  // Task API
  // ============================================================================

  /**
   * Create a task
   */
  async createTask(task: {
    summary: string;
    description?: string;
    due?: {
      date?: string;
      timestamp?: string;
      is_all_day?: boolean;
      timezone?: string;
    };
    origin?: {
      platform_i18n_name?: { zh_cn?: string; en_us?: string };
      href?: { url?: string; title?: string };
    };
    extra?: string;
    members?: Array<{ id?: string; type?: 'user'; role?: 'assignee' | 'follower' }>;
    tasklists?: Array<{ tasklist_guid?: string; section_guid?: string }>;
    reminders?: Array<{ relative_fire_minute: number }>;
    start?: { timestamp?: string; is_all_day?: boolean; timezone?: string };
    [key: string]: unknown;
  }): Promise<{
    code: number;
    msg: string;
    data?: {
      task?: {
        guid: string;
        summary: string;
        [key: string]: unknown;
      };
    };
  }> {
    const response = await this.request<{ task?: { guid: string; summary: string } }>(
      'POST',
      '/task/v2/tasks',
      task
    );

    return {
      code: 0,
      msg: 'success',
      data: response.data,
    };
  }

  /**
   * Get a task by ID
   */
  async getTask(taskId: string): Promise<{
    code: number;
    msg: string;
    data?: {
      task?: {
        guid: string;
        summary: string;
        [key: string]: unknown;
      };
    };
  }> {
    const response = await this.request<{ task?: { guid: string; summary: string } }>(
      'GET',
      `/task/v2/tasks/${taskId}`
    );

    return {
      code: 0,
      msg: 'success',
      data: response.data,
    };
  }

  /**
   * Update a task
   */
  async updateTask(
    taskId: string,
    updates: Partial<{
      summary: string;
      description: string;
      due: { timestamp?: string; is_all_day?: boolean };
      completed_at: string;
      [key: string]: unknown;
    }>
  ): Promise<{
    code: number;
    msg: string;
    data?: {
      task?: {
        guid: string;
        summary: string;
        [key: string]: unknown;
      };
    };
  }> {
    const response = await this.request<{ task?: { guid: string; summary: string } }>(
      'PATCH',
      `/task/v2/tasks/${taskId}`,
      updates
    );

    return {
      code: 0,
      msg: 'success',
      data: response.data,
    };
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string): Promise<void> {
    await this.request('POST', `/task/v2/tasks/${taskId}/complete`);
  }

  // ============================================================================
  // Approval API
  // ============================================================================

  /**
   * Create an approval instance
   */
  async createApprovalInstance(request: {
    approvalCode: string;
    userId: string;
    form: string;
    nodeApproverIds?: string[];
    ccUserIds?: string[];
    uuid?: string;
  }): Promise<{
    code: number;
    msg: string;
    data?: {
      instance_code: string;
    };
  }> {
    const response = await this.request<{ instance_code: string }>(
      'POST',
      '/approval/v4/instances',
      {
        approval_code: request.approvalCode,
        user_id: request.userId,
        form: request.form,
        node_approver_user_id_list: request.nodeApproverIds,
        cc_user_id_list: request.ccUserIds,
        uuid: request.uuid,
      }
    );

    return {
      code: 0,
      msg: 'success',
      data: response.data,
    };
  }

  /**
   * Get approval instance details
   */
  async getApprovalInstance(instanceCode: string): Promise<{
    code: number;
    msg: string;
    data?: {
      approval_code: string;
      approval_name: string;
      instance_code: string;
      user_id: string;
      status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED' | 'DELETED';
      form: Record<string, unknown>[];
      timeline: Array<{
        type: string;
        createTime: string;
        userId?: string;
        comment?: string;
        ext?: string;
      }>;
      create_time: string;
      update_time: string;
    };
  }> {
    const response = await this.request<{
      approval_code: string;
      approval_name: string;
      instance_code: string;
      user_id: string;
      status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED' | 'DELETED';
      form: Record<string, unknown>[];
      timeline: Array<{
        type: string;
        createTime: string;
        userId?: string;
        comment?: string;
        ext?: string;
      }>;
      create_time: string;
      update_time: string;
    }>(
      'GET',
      `/approval/v4/instances/${instanceCode}`
    );

    return {
      code: 0,
      msg: 'success',
      data: response.data,
    };
  }

  /**
   * Cancel an approval instance
   */
  async cancelApprovalInstance(instanceCode: string, userId: string): Promise<void> {
    await this.request(
      'POST',
      `/approval/v4/instances/${instanceCode}/cancel`,
      { user_id: userId }
    );
  }

  /**
   * List approval instances
   */
  async listApprovalInstances(options: {
    approvalCode: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED' | 'DELETED';
    pageSize?: number;
    pageToken?: string;
  }): Promise<{
    code: number;
    msg: string;
    data?: {
      instance_list: Array<{
        approvalCode: string;
        approvalName: string;
        instanceCode: string;
        userId: string;
        status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED' | 'DELETED';
        form: Record<string, unknown>[];
        timeline: Array<{
          type: string;
          createTime: string;
          userId?: string;
          comment?: string;
        }>;
        createTime: string;
        updateTime: string;
      }>;
      has_more: boolean;
      page_token?: string;
    };
  }> {
    const params = new URLSearchParams({
      approval_code: options.approvalCode,
    });
    if (options.status) params.set('status', options.status);
    if (options.pageSize) params.set('page_size', String(options.pageSize));
    if (options.pageToken) params.set('page_token', options.pageToken);

    const response = await this.request<{
      instance_list: Array<{
        approvalCode: string;
        approvalName: string;
        instanceCode: string;
        userId: string;
        status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED' | 'DELETED';
        form: Record<string, unknown>[];
        timeline: Array<{
          type: string;
          createTime: string;
          userId?: string;
          comment?: string;
        }>;
        createTime: string;
        updateTime: string;
      }>;
      has_more: boolean;
      page_token?: string;
    }>(
      'GET',
      `/approval/v4/instances?${params.toString()}`
    );

    return {
      code: 0,
      msg: 'success',
      data: response.data,
    };
  }
}
