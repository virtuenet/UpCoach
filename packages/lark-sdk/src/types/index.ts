/**
 * Lark SDK Types
 * Core type definitions for Lark API integration
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface LarkConfig {
  appId: string;
  appSecret: string;
  encryptKey?: string;
  verificationToken?: string;
  baseUrl?: string;
  timeout?: number;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface TenantAccessToken {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}

export interface AppAccessToken {
  code: number;
  msg: string;
  app_access_token: string;
  expire: number;
}

// ============================================================================
// Message Types
// ============================================================================

export type MessageType = 'text' | 'post' | 'image' | 'interactive' | 'share_chat' | 'share_user' | 'audio' | 'media' | 'file' | 'sticker';

export interface TextMessage {
  text: string;
}

export interface PostMessage {
  title: string;
  content: PostContent[][];
}

export type PostContent =
  | { tag: 'text'; text: string; style?: string[] }
  | { tag: 'a'; text: string; href: string }
  | { tag: 'at'; user_id: string; user_name?: string }
  | { tag: 'img'; image_key: string; width?: number; height?: number };

export interface InteractiveMessage {
  config?: {
    wide_screen_mode?: boolean;
    enable_forward?: boolean;
    update_multi?: boolean;
  };
  header?: {
    title: {
      tag: 'plain_text' | 'lark_md';
      content: string;
    };
    subtitle?: {
      tag: 'plain_text' | 'lark_md';
      content: string;
    };
    template?: 'blue' | 'wathet' | 'turquoise' | 'green' | 'yellow' | 'orange' | 'red' | 'carmine' | 'violet' | 'purple' | 'indigo' | 'grey' | 'default';
    icon?: {
      img_key: string;
    };
  };
  elements?: CardElement[];
}

export type CardElement =
  | DivElement
  | MarkdownElement
  | HrElement
  | ActionElement
  | NoteElement
  | ImageElement;

export interface DivElement {
  tag: 'div';
  text?: {
    tag: 'plain_text' | 'lark_md';
    content: string;
    lines?: number;
  };
  fields?: Array<{
    is_short: boolean;
    text: {
      tag: 'plain_text' | 'lark_md';
      content: string;
    };
  }>;
  extra?: CardElement;
}

export interface MarkdownElement {
  tag: 'markdown';
  content: string;
  href?: Record<string, { url: string; android_url?: string; ios_url?: string; pc_url?: string }>;
}

export interface HrElement {
  tag: 'hr';
}

export interface ActionElement {
  tag: 'action';
  actions: Array<ButtonElement | SelectElement | OverflowElement | DatePickerElement>;
  layout?: 'bisected' | 'trisection' | 'flow';
}

export interface ButtonElement {
  tag: 'button';
  text: {
    tag: 'plain_text' | 'lark_md';
    content: string;
  };
  type?: 'default' | 'primary' | 'danger';
  url?: string;
  multi_url?: {
    url: string;
    android_url?: string;
    ios_url?: string;
    pc_url?: string;
  };
  value?: Record<string, unknown>;
  confirm?: {
    title: { tag: 'plain_text'; content: string };
    text: { tag: 'plain_text'; content: string };
  };
}

export interface SelectElement {
  tag: 'select_static' | 'select_person';
  placeholder?: { tag: 'plain_text'; content: string };
  initial_option?: string;
  options?: Array<{
    value: string;
    text: { tag: 'plain_text'; content: string };
  }>;
  value?: Record<string, unknown>;
}

export interface OverflowElement {
  tag: 'overflow';
  options: Array<{
    value: string;
    text: { tag: 'plain_text'; content: string };
    url?: string;
  }>;
  value?: Record<string, unknown>;
}

export interface DatePickerElement {
  tag: 'date_picker' | 'picker_time' | 'picker_datetime';
  initial_date?: string;
  initial_time?: string;
  initial_datetime?: string;
  placeholder?: { tag: 'plain_text'; content: string };
  value?: Record<string, unknown>;
}

export interface NoteElement {
  tag: 'note';
  elements: Array<{ tag: 'plain_text' | 'lark_md'; content: string } | { tag: 'img'; img_key: string; alt?: { tag: 'plain_text'; content: string } }>;
}

export interface ImageElement {
  tag: 'img';
  img_key: string;
  alt?: { tag: 'plain_text'; content: string };
  title?: { tag: 'plain_text' | 'lark_md'; content: string };
  custom_width?: number;
  compact_width?: boolean;
  mode?: 'fit_horizontal' | 'crop_center';
  preview?: boolean;
}

// ============================================================================
// Send Message Types
// ============================================================================

export type ReceiveIdType = 'open_id' | 'user_id' | 'union_id' | 'email' | 'chat_id';

export interface SendMessageRequest {
  receive_id: string;
  msg_type: MessageType;
  content: string;
  uuid?: string;
}

export interface SendMessageResponse {
  code: number;
  msg: string;
  data?: {
    message_id: string;
    root_id?: string;
    parent_id?: string;
    msg_type: MessageType;
    create_time: string;
    update_time: string;
    deleted: boolean;
    chat_id: string;
    sender: {
      id: string;
      id_type: string;
      sender_type: 'user' | 'app';
      tenant_key?: string;
    };
    body: {
      content: string;
    };
  };
}

// ============================================================================
// Webhook Event Types
// ============================================================================

export interface WebhookEvent {
  schema: string;
  header: {
    event_id: string;
    event_type: string;
    create_time: string;
    token: string;
    app_id: string;
    tenant_key: string;
  };
  event: Record<string, unknown>;
}

export interface MessageReceivedEvent extends WebhookEvent {
  event: {
    sender: {
      sender_id: {
        union_id?: string;
        user_id?: string;
        open_id?: string;
      };
      sender_type: 'user' | 'app';
      tenant_key?: string;
    };
    message: {
      message_id: string;
      root_id?: string;
      parent_id?: string;
      create_time: string;
      update_time: string;
      chat_id: string;
      chat_type: 'p2p' | 'group';
      message_type: MessageType;
      content: string;
      mentions?: Array<{
        key: string;
        id: {
          union_id?: string;
          user_id?: string;
          open_id?: string;
        };
        name: string;
        tenant_key?: string;
      }>;
    };
  };
}

export interface UrlVerificationEvent {
  challenge: string;
  token: string;
  type: 'url_verification';
}

// ============================================================================
// Bot Command Types
// ============================================================================

export interface BotCommand {
  name: string;
  description: string;
  handler: (context: CommandContext) => Promise<string | InteractiveMessage>;
}

export interface CommandContext {
  command: string;
  args: string[];
  rawText: string;
  userId: string;
  chatId: string;
  chatType: 'p2p' | 'group';
  messageId: string;
  tenantKey: string;
}

// ============================================================================
// User Types
// ============================================================================

export interface LarkUser {
  user_id?: string;
  open_id?: string;
  union_id?: string;
  name: string;
  en_name?: string;
  nickname?: string;
  email?: string;
  mobile?: string;
  avatar?: {
    avatar_72: string;
    avatar_240: string;
    avatar_640: string;
    avatar_origin: string;
  };
  status?: {
    is_frozen: boolean;
    is_resigned: boolean;
    is_activated: boolean;
    is_exited: boolean;
    is_unjoin: boolean;
  };
  department_ids?: string[];
  leader_user_id?: string;
  city?: string;
  country?: string;
  work_station?: string;
  join_time?: number;
  employee_no?: string;
  employee_type?: number;
  enterprise_email?: string;
  job_title?: string;
}

// ============================================================================
// Group/Chat Types
// ============================================================================

export interface LarkChat {
  chat_id: string;
  avatar?: string;
  name: string;
  description?: string;
  owner_id: string;
  owner_id_type: string;
  external: boolean;
  tenant_key: string;
  chat_status?: 'normal' | 'dissolved' | 'dismissed';
  i18n_names?: Record<string, string>;
}

// ============================================================================
// Approval Types
// ============================================================================

export interface ApprovalDefinition {
  approval_code: string;
  approval_name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  form: string;
  node_list: ApprovalNode[];
  viewers: ApprovalViewer[];
}

export interface ApprovalNode {
  node_id: string;
  node_name: string;
  node_type: 'AND' | 'OR' | 'CC' | 'START' | 'END';
  approver_user_id_list?: string[];
  approver_open_id_list?: string[];
  approver_role?: string[];
}

export interface ApprovalViewer {
  viewer_type: 'USER' | 'DEPARTMENT' | 'ROLE' | 'NONE';
  viewer_id?: string;
}

export interface ApprovalInstance {
  instance_code: string;
  approval_code: string;
  user_id: string;
  open_id: string;
  department_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED' | 'DELETED';
  form: string;
  task_list: ApprovalTask[];
  timeline: ApprovalTimeline[];
  start_time: string;
  end_time?: string;
}

export interface ApprovalTask {
  task_id: string;
  node_id: string;
  node_name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'TRANSFERRED' | 'DONE';
  user_id: string;
  open_id: string;
  start_time: string;
  end_time?: string;
}

export interface ApprovalTimeline {
  type: 'START' | 'PASS' | 'REJECT' | 'CC' | 'TRANSFER' | 'END';
  create_time: string;
  user_id?: string;
  open_id?: string;
  node_key?: string;
  comment?: string;
}

// ============================================================================
// Bitable (Base) Types
// ============================================================================

export interface BitableApp {
  app_token: string;
  name: string;
  is_advanced: boolean;
  folder_token?: string;
  time_zone?: string;
}

export interface BitableTable {
  table_id: string;
  name: string;
  revision: number;
}

export interface BitableField {
  field_id: string;
  field_name: string;
  type: number;
  property?: Record<string, unknown>;
  is_primary?: boolean;
  is_hidden?: boolean;
  description?: string;
}

export interface BitableRecord {
  record_id: string;
  fields: Record<string, unknown>;
  created_time?: number;
  created_by?: {
    id: string;
    name?: string;
    en_name?: string;
    email?: string;
    avatar_url?: string;
  };
  last_modified_time?: number;
  last_modified_by?: {
    id: string;
    name?: string;
    en_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

// ============================================================================
// API Response Types
// ============================================================================

export interface LarkApiResponse<T = unknown> {
  code: number;
  msg: string;
  data?: T;
}

export interface PaginatedResponse<T> extends LarkApiResponse<{ items: T[]; has_more: boolean; page_token?: string }> {}

// ============================================================================
// Error Types
// ============================================================================

export class LarkApiError extends Error {
  constructor(
    public code: number,
    public larkMessage: string,
    public requestId?: string
  ) {
    super(`Lark API Error [${code}]: ${larkMessage}`);
    this.name = 'LarkApiError';
  }
}

export class LarkWebhookError extends Error {
  constructor(
    message: string,
    public eventType?: string
  ) {
    super(message);
    this.name = 'LarkWebhookError';
  }
}
