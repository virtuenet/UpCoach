/**
 * Lark Bitable (Base) Types
 * Schema definitions for UpCoach business data in Lark Base
 */

// ============================================================================
// Coach Pipeline Schema
// ============================================================================

export interface CoachPipelineRecord {
  record_id?: string;
  fields: {
    coach_id: string;
    coach_name: string;
    email: string;
    status: 'pending' | 'onboarding' | 'active' | 'inactive' | 'suspended';
    specializations: string[];
    monthly_revenue: number;
    client_count: number;
    avg_rating: number;
    onboarding_date: number; // Unix timestamp
    last_session_date?: number;
    profile_complete: boolean;
    verification_status: 'pending' | 'verified' | 'rejected';
    notes?: string;
    assigned_success_manager?: string;
    upcoach_profile_url?: string;
  };
}

export interface CoachPipelineSchema {
  app_token: string;
  table_id: string;
  fields: {
    coach_id: { type: 'text'; is_primary: true };
    coach_name: { type: 'text' };
    email: { type: 'text' };
    status: { type: 'singleSelect'; options: string[] };
    specializations: { type: 'multiSelect'; options: string[] };
    monthly_revenue: { type: 'number'; formatter: 'currency' };
    client_count: { type: 'number' };
    avg_rating: { type: 'number'; formatter: 'rating' };
    onboarding_date: { type: 'dateTime' };
    last_session_date: { type: 'dateTime' };
    profile_complete: { type: 'checkbox' };
    verification_status: { type: 'singleSelect'; options: string[] };
    notes: { type: 'text'; multiline: true };
    assigned_success_manager: { type: 'person' };
    upcoach_profile_url: { type: 'url' };
  };
}

// ============================================================================
// Support Ticket Schema
// ============================================================================

export interface SupportTicketRecord {
  record_id?: string;
  fields: {
    ticket_id: string;
    client_name: string;
    client_email: string;
    category: 'app_issue' | 'payment' | 'coaching' | 'account' | 'feature_request' | 'other';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed';
    subject: string;
    description: string;
    assigned_to?: string;
    related_coach_id?: string;
    related_coach_name?: string;
    created_at: number;
    updated_at: number;
    resolved_at?: number;
    resolution_notes?: string;
    satisfaction_rating?: number;
    upcoach_ticket_url?: string;
  };
}

export interface SupportTicketSchema {
  app_token: string;
  table_id: string;
  fields: {
    ticket_id: { type: 'text'; is_primary: true };
    client_name: { type: 'text' };
    client_email: { type: 'text' };
    category: { type: 'singleSelect'; options: string[] };
    priority: { type: 'singleSelect'; options: string[] };
    status: { type: 'singleSelect'; options: string[] };
    subject: { type: 'text' };
    description: { type: 'text'; multiline: true };
    assigned_to: { type: 'person' };
    related_coach_id: { type: 'text' };
    related_coach_name: { type: 'text' };
    created_at: { type: 'dateTime' };
    updated_at: { type: 'dateTime' };
    resolved_at: { type: 'dateTime' };
    resolution_notes: { type: 'text'; multiline: true };
    satisfaction_rating: { type: 'number'; formatter: 'rating' };
    upcoach_ticket_url: { type: 'url' };
  };
}

// ============================================================================
// Coach Payout Schema
// ============================================================================

export interface CoachPayoutRecord {
  record_id?: string;
  fields: {
    payout_id: string;
    coach_id: string;
    coach_name: string;
    period_start: number;
    period_end: number;
    gross_amount: number;
    platform_fee: number;
    net_amount: number;
    currency: string;
    status: 'pending' | 'approved' | 'processing' | 'paid' | 'failed' | 'cancelled';
    approval_level: 'none' | 'manager' | 'director' | 'cfo';
    approved_by?: string;
    approved_at?: number;
    payment_method: 'bank_transfer' | 'paypal' | 'stripe' | 'wise';
    payment_reference?: string;
    paid_at?: number;
    session_count: number;
    notes?: string;
    upcoach_payout_url?: string;
  };
}

export interface CoachPayoutSchema {
  app_token: string;
  table_id: string;
  fields: {
    payout_id: { type: 'text'; is_primary: true };
    coach_id: { type: 'text' };
    coach_name: { type: 'text' };
    period_start: { type: 'dateTime' };
    period_end: { type: 'dateTime' };
    gross_amount: { type: 'number'; formatter: 'currency' };
    platform_fee: { type: 'number'; formatter: 'currency' };
    net_amount: { type: 'number'; formatter: 'currency' };
    currency: { type: 'text' };
    status: { type: 'singleSelect'; options: string[] };
    approval_level: { type: 'singleSelect'; options: string[] };
    approved_by: { type: 'person' };
    approved_at: { type: 'dateTime' };
    payment_method: { type: 'singleSelect'; options: string[] };
    payment_reference: { type: 'text' };
    paid_at: { type: 'dateTime' };
    session_count: { type: 'number' };
    notes: { type: 'text'; multiline: true };
    upcoach_payout_url: { type: 'url' };
  };
}

// ============================================================================
// Session Tracking Schema
// ============================================================================

export interface SessionTrackingRecord {
  record_id?: string;
  fields: {
    session_id: string;
    coach_id: string;
    coach_name: string;
    client_id: string;
    client_name: string;
    scheduled_at: number;
    duration_minutes: number;
    status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'no_show' | 'cancelled' | 'rescheduled';
    session_type: 'one_on_one' | 'group' | 'workshop' | 'assessment';
    topic?: string;
    notes?: string;
    rating?: number;
    feedback?: string;
    follow_up_required: boolean;
    upcoach_session_url?: string;
  };
}

// ============================================================================
// Activity Log Schema
// ============================================================================

export interface ActivityLogRecord {
  record_id?: string;
  fields: {
    activity_id: string;
    activity_type: 'coach_signup' | 'client_signup' | 'session_completed' | 'payment_received' | 'subscription_changed' | 'goal_achieved' | 'milestone_reached' | 'alert_triggered';
    actor_type: 'coach' | 'client' | 'admin' | 'system';
    actor_id: string;
    actor_name: string;
    description: string;
    metadata?: string; // JSON string
    occurred_at: number;
    importance: 'low' | 'medium' | 'high';
  };
}

// ============================================================================
// Bitable API Types
// ============================================================================

export interface BitableListRecordsRequest {
  app_token: string;
  table_id: string;
  view_id?: string;
  filter?: BitableFilter;
  sort?: BitableSort[];
  field_names?: string[];
  text_field_as_array?: boolean;
  page_token?: string;
  page_size?: number;
}

export interface BitableFilter {
  conjunction?: 'and' | 'or';
  conditions?: BitableCondition[];
  children?: BitableFilter[];
}

export interface BitableCondition {
  field_name: string;
  operator: 'is' | 'isNot' | 'contains' | 'doesNotContain' | 'isEmpty' | 'isNotEmpty' | 'isGreater' | 'isLess' | 'isGreaterEqual' | 'isLessEqual';
  value?: string | number | boolean | string[];
}

export interface BitableSort {
  field_name: string;
  desc?: boolean;
}

export interface BitableRecordResponse<T> {
  code: number;
  msg: string;
  data: {
    has_more: boolean;
    page_token?: string;
    total: number;
    items: Array<{
      record_id: string;
      fields: T;
    }>;
  };
}

export interface BitableCreateRecordRequest<T> {
  app_token: string;
  table_id: string;
  fields: T;
}

export interface BitableUpdateRecordRequest<T> {
  app_token: string;
  table_id: string;
  record_id: string;
  fields: Partial<T>;
}

export interface BitableBatchCreateRequest<T> {
  app_token: string;
  table_id: string;
  records: Array<{ fields: T }>;
}

export interface BitableBatchUpdateRequest<T> {
  app_token: string;
  table_id: string;
  records: Array<{ record_id: string; fields: Partial<T> }>;
}

// ============================================================================
// Schema Configuration
// ============================================================================

export interface LarkBaseConfig {
  coachPipeline: {
    appToken: string;
    tableId: string;
  };
  supportTickets: {
    appToken: string;
    tableId: string;
  };
  coachPayouts: {
    appToken: string;
    tableId: string;
  };
  sessionTracking: {
    appToken: string;
    tableId: string;
  };
  activityLog: {
    appToken: string;
    tableId: string;
  };
}

// ============================================================================
// Sync Types
// ============================================================================

export interface SyncResult {
  success: boolean;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  errors: SyncError[];
  syncedAt: Date;
  duration: number;
}

export interface SyncError {
  recordId?: string;
  upcoachId?: string;
  larkRecordId?: string;
  operation: 'create' | 'update' | 'delete';
  error: string;
  details?: Record<string, unknown>;
}

export interface SyncMapping {
  upcoachId: string;
  larkRecordId: string;
  tableName: string;
  lastSyncedAt: Date;
  syncDirection: 'upcoach_to_lark' | 'lark_to_upcoach' | 'bidirectional';
  checksum?: string;
}

export interface ConflictResolution {
  strategy: 'upcoach_wins' | 'lark_wins' | 'newest_wins' | 'manual';
  resolvedValue?: Record<string, unknown>;
  resolvedBy?: string;
  resolvedAt?: Date;
}
