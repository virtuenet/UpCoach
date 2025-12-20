/**
 * Bitable Service
 * Service for interacting with Lark Bitable (Base) tables
 */

import { LarkClient } from '../client/LarkClient';
import type {
  CoachPipelineRecord,
  SupportTicketRecord,
  CoachPayoutRecord,
  SessionTrackingRecord,
  ActivityLogRecord,
  LarkBaseConfig,
  BitableFilter,
  BitableSort,
  BitableRecordResponse,
  SyncResult,
  SyncError,
} from './types';

export class BitableService {
  private readonly client: LarkClient;
  private readonly config: LarkBaseConfig;

  constructor(client: LarkClient, config: LarkBaseConfig) {
    this.client = client;
    this.config = config;
  }

  // ============================================================================
  // Coach Pipeline Operations
  // ============================================================================

  /**
   * List coach pipeline records
   */
  async listCoaches(options?: {
    filter?: BitableFilter;
    sort?: BitableSort[];
    pageSize?: number;
    pageToken?: string;
  }): Promise<BitableRecordResponse<CoachPipelineRecord['fields']>> {
    return this.client.listBitableRecords<CoachPipelineRecord['fields']>({
      appToken: this.config.coachPipeline.appToken,
      tableId: this.config.coachPipeline.tableId,
      filter: options?.filter,
      sort: options?.sort,
      pageSize: options?.pageSize,
      pageToken: options?.pageToken,
    });
  }

  /**
   * Get a single coach by ID
   */
  async getCoach(coachId: string): Promise<CoachPipelineRecord | null> {
    const result = await this.listCoaches({
      filter: {
        conditions: [{ field_name: 'coach_id', operator: 'is', value: coachId }],
      },
      pageSize: 1,
    });

    if (result.data.items.length > 0) {
      return {
        record_id: result.data.items[0].record_id,
        fields: result.data.items[0].fields,
      };
    }
    return null;
  }

  /**
   * Create a coach record
   */
  async createCoach(fields: CoachPipelineRecord['fields']): Promise<string> {
    const result = await this.client.createBitableRecord(
      this.config.coachPipeline.appToken,
      this.config.coachPipeline.tableId,
      fields as Record<string, unknown>
    );
    return result.record_id!;
  }

  /**
   * Update a coach record
   */
  async updateCoach(
    recordId: string,
    fields: Partial<CoachPipelineRecord['fields']>
  ): Promise<void> {
    await this.client.updateBitableRecord(
      this.config.coachPipeline.appToken,
      this.config.coachPipeline.tableId,
      recordId,
      fields as Record<string, unknown>
    );
  }

  /**
   * Get coaches by status
   */
  async getCoachesByStatus(
    status: CoachPipelineRecord['fields']['status']
  ): Promise<CoachPipelineRecord[]> {
    const result = await this.listCoaches({
      filter: {
        conditions: [{ field_name: 'status', operator: 'is', value: status }],
      },
    });

    return result.data.items.map((item) => ({
      record_id: item.record_id,
      fields: item.fields,
    }));
  }

  /**
   * Get coaches requiring follow-up
   */
  async getCoachesRequiringFollowUp(): Promise<CoachPipelineRecord[]> {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const result = await this.listCoaches({
      filter: {
        conjunction: 'and',
        conditions: [
          { field_name: 'status', operator: 'is', value: 'active' },
          { field_name: 'last_session_date', operator: 'isLess', value: thirtyDaysAgo },
        ],
      },
    });

    return result.data.items.map((item) => ({
      record_id: item.record_id,
      fields: item.fields,
    }));
  }

  // ============================================================================
  // Support Ticket Operations
  // ============================================================================

  /**
   * List support tickets
   */
  async listTickets(options?: {
    filter?: BitableFilter;
    sort?: BitableSort[];
    pageSize?: number;
    pageToken?: string;
  }): Promise<BitableRecordResponse<SupportTicketRecord['fields']>> {
    return this.client.listBitableRecords<SupportTicketRecord['fields']>({
      appToken: this.config.supportTickets.appToken,
      tableId: this.config.supportTickets.tableId,
      filter: options?.filter,
      sort: options?.sort || [{ field_name: 'created_at', desc: true }],
      pageSize: options?.pageSize,
      pageToken: options?.pageToken,
    });
  }

  /**
   * Get open tickets
   */
  async getOpenTickets(): Promise<SupportTicketRecord[]> {
    const result = await this.listTickets({
      filter: {
        conditions: [
          {
            field_name: 'status',
            operator: 'isNot',
            value: 'closed',
          },
        ],
      },
    });

    return result.data.items.map((item) => ({
      record_id: item.record_id,
      fields: item.fields,
    }));
  }

  /**
   * Get high priority tickets
   */
  async getHighPriorityTickets(): Promise<SupportTicketRecord[]> {
    const result = await this.listTickets({
      filter: {
        conjunction: 'and',
        conditions: [
          {
            field_name: 'priority',
            operator: 'is',
            value: 'high',
          },
          {
            field_name: 'status',
            operator: 'isNot',
            value: 'closed',
          },
        ],
      },
    });

    return result.data.items.map((item) => ({
      record_id: item.record_id,
      fields: item.fields,
    }));
  }

  /**
   * Create a support ticket
   */
  async createTicket(fields: SupportTicketRecord['fields']): Promise<string> {
    const result = await this.client.createBitableRecord(
      this.config.supportTickets.appToken,
      this.config.supportTickets.tableId,
      fields as Record<string, unknown>
    );
    return result.record_id!;
  }

  /**
   * Update a support ticket
   */
  async updateTicket(
    recordId: string,
    fields: Partial<SupportTicketRecord['fields']>
  ): Promise<void> {
    await this.client.updateBitableRecord(
      this.config.supportTickets.appToken,
      this.config.supportTickets.tableId,
      recordId,
      {
        ...fields,
        updated_at: Date.now(),
      } as Record<string, unknown>
    );
  }

  /**
   * Resolve a ticket
   */
  async resolveTicket(recordId: string, resolutionNotes: string): Promise<void> {
    await this.updateTicket(recordId, {
      status: 'resolved',
      resolved_at: Date.now(),
      resolution_notes: resolutionNotes,
    });
  }

  // ============================================================================
  // Coach Payout Operations
  // ============================================================================

  /**
   * List coach payouts
   */
  async listPayouts(options?: {
    filter?: BitableFilter;
    sort?: BitableSort[];
    pageSize?: number;
    pageToken?: string;
  }): Promise<BitableRecordResponse<CoachPayoutRecord['fields']>> {
    return this.client.listBitableRecords<CoachPayoutRecord['fields']>({
      appToken: this.config.coachPayouts.appToken,
      tableId: this.config.coachPayouts.tableId,
      filter: options?.filter,
      sort: options?.sort || [{ field_name: 'period_end', desc: true }],
      pageSize: options?.pageSize,
      pageToken: options?.pageToken,
    });
  }

  /**
   * Get pending payouts
   */
  async getPendingPayouts(): Promise<CoachPayoutRecord[]> {
    const result = await this.listPayouts({
      filter: {
        conditions: [{ field_name: 'status', operator: 'is', value: 'pending' }],
      },
    });

    return result.data.items.map((item) => ({
      record_id: item.record_id,
      fields: item.fields,
    }));
  }

  /**
   * Get payouts pending approval
   */
  async getPayoutsPendingApproval(approvalLevel: string): Promise<CoachPayoutRecord[]> {
    const result = await this.listPayouts({
      filter: {
        conjunction: 'and',
        conditions: [
          { field_name: 'status', operator: 'is', value: 'pending' },
          { field_name: 'approval_level', operator: 'is', value: approvalLevel },
        ],
      },
    });

    return result.data.items.map((item) => ({
      record_id: item.record_id,
      fields: item.fields,
    }));
  }

  /**
   * Create a payout record
   */
  async createPayout(fields: CoachPayoutRecord['fields']): Promise<string> {
    const result = await this.client.createBitableRecord(
      this.config.coachPayouts.appToken,
      this.config.coachPayouts.tableId,
      fields as Record<string, unknown>
    );
    return result.record_id!;
  }

  /**
   * Update a payout record
   */
  async updatePayout(
    recordId: string,
    fields: Partial<CoachPayoutRecord['fields']>
  ): Promise<void> {
    await this.client.updateBitableRecord(
      this.config.coachPayouts.appToken,
      this.config.coachPayouts.tableId,
      recordId,
      fields as Record<string, unknown>
    );
  }

  /**
   * Approve a payout
   */
  async approvePayout(recordId: string, approvedBy: string): Promise<void> {
    await this.updatePayout(recordId, {
      status: 'approved',
      approved_by: approvedBy,
      approved_at: Date.now(),
    });
  }

  /**
   * Mark payout as paid
   */
  async markPayoutPaid(recordId: string, paymentReference: string): Promise<void> {
    await this.updatePayout(recordId, {
      status: 'paid',
      payment_reference: paymentReference,
      paid_at: Date.now(),
    });
  }

  // ============================================================================
  // Session Tracking Operations
  // ============================================================================

  /**
   * List sessions
   */
  async listSessions(options?: {
    filter?: BitableFilter;
    sort?: BitableSort[];
    pageSize?: number;
    pageToken?: string;
  }): Promise<BitableRecordResponse<SessionTrackingRecord['fields']>> {
    return this.client.listBitableRecords<SessionTrackingRecord['fields']>({
      appToken: this.config.sessionTracking.appToken,
      tableId: this.config.sessionTracking.tableId,
      filter: options?.filter,
      sort: options?.sort || [{ field_name: 'scheduled_at', desc: true }],
      pageSize: options?.pageSize,
      pageToken: options?.pageToken,
    });
  }

  /**
   * Get today's sessions
   */
  async getTodaysSessions(): Promise<SessionTrackingRecord[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.listSessions({
      filter: {
        conjunction: 'and',
        conditions: [
          { field_name: 'scheduled_at', operator: 'isGreaterEqual', value: startOfDay.getTime() },
          { field_name: 'scheduled_at', operator: 'isLessEqual', value: endOfDay.getTime() },
        ],
      },
      sort: [{ field_name: 'scheduled_at', desc: false }],
    });

    return result.data.items.map((item) => ({
      record_id: item.record_id,
      fields: item.fields,
    }));
  }

  /**
   * Get no-show sessions (for follow-up)
   */
  async getNoShowSessions(daysBack: number = 7): Promise<SessionTrackingRecord[]> {
    const since = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    const result = await this.listSessions({
      filter: {
        conjunction: 'and',
        conditions: [
          { field_name: 'status', operator: 'is', value: 'no_show' },
          { field_name: 'scheduled_at', operator: 'isGreaterEqual', value: since },
        ],
      },
    });

    return result.data.items.map((item) => ({
      record_id: item.record_id,
      fields: item.fields,
    }));
  }

  /**
   * Create a session record
   */
  async createSession(fields: SessionTrackingRecord['fields']): Promise<string> {
    const result = await this.client.createBitableRecord(
      this.config.sessionTracking.appToken,
      this.config.sessionTracking.tableId,
      fields as Record<string, unknown>
    );
    return result.record_id!;
  }

  /**
   * Update a session record
   */
  async updateSession(
    recordId: string,
    fields: Partial<SessionTrackingRecord['fields']>
  ): Promise<void> {
    await this.client.updateBitableRecord(
      this.config.sessionTracking.appToken,
      this.config.sessionTracking.tableId,
      recordId,
      fields as Record<string, unknown>
    );
  }

  // ============================================================================
  // Activity Log Operations
  // ============================================================================

  /**
   * Log an activity
   */
  async logActivity(fields: ActivityLogRecord['fields']): Promise<string> {
    const result = await this.client.createBitableRecord(
      this.config.activityLog.appToken,
      this.config.activityLog.tableId,
      {
        ...fields,
        occurred_at: fields.occurred_at || Date.now(),
      } as Record<string, unknown>
    );
    return result.record_id!;
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit: number = 50): Promise<ActivityLogRecord[]> {
    const result = await this.client.listBitableRecords<ActivityLogRecord['fields']>({
      appToken: this.config.activityLog.appToken,
      tableId: this.config.activityLog.tableId,
      sort: [{ field_name: 'occurred_at', desc: true }],
      pageSize: limit,
    });

    return result.data.items.map((item) => ({
      record_id: item.record_id,
      fields: item.fields,
    }));
  }

  /**
   * Get activities by type
   */
  async getActivitiesByType(
    activityType: ActivityLogRecord['fields']['activity_type'],
    limit: number = 50
  ): Promise<ActivityLogRecord[]> {
    const result = await this.client.listBitableRecords<ActivityLogRecord['fields']>({
      appToken: this.config.activityLog.appToken,
      tableId: this.config.activityLog.tableId,
      filter: {
        conditions: [{ field_name: 'activity_type', operator: 'is', value: activityType }],
      },
      sort: [{ field_name: 'occurred_at', desc: true }],
      pageSize: limit,
    });

    return result.data.items.map((item) => ({
      record_id: item.record_id,
      fields: item.fields,
    }));
  }

  // ============================================================================
  // Dashboard Aggregations
  // ============================================================================

  /**
   * Get coach pipeline summary
   */
  async getCoachPipelineSummary(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    pendingOnboarding: number;
    activeCoaches: number;
    averageRating: number;
  }> {
    const allCoaches = await this.listCoaches({ pageSize: 500 });

    const byStatus: Record<string, number> = {};
    let totalRating = 0;
    let ratingCount = 0;

    for (const coach of allCoaches.data.items) {
      const status = coach.fields.status;
      byStatus[status] = (byStatus[status] || 0) + 1;

      if (coach.fields.avg_rating > 0) {
        totalRating += coach.fields.avg_rating;
        ratingCount++;
      }
    }

    return {
      total: allCoaches.data.total,
      byStatus,
      pendingOnboarding: byStatus['onboarding'] || 0,
      activeCoaches: byStatus['active'] || 0,
      averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
    };
  }

  /**
   * Get support ticket summary
   */
  async getSupportTicketSummary(): Promise<{
    total: number;
    open: number;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
    averageResolutionTime: number;
  }> {
    const allTickets = await this.listTickets({ pageSize: 500 });

    const byPriority: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let openCount = 0;
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    for (const ticket of allTickets.data.items) {
      const priority = ticket.fields.priority;
      const category = ticket.fields.category;
      const status = ticket.fields.status;

      byPriority[priority] = (byPriority[priority] || 0) + 1;
      byCategory[category] = (byCategory[category] || 0) + 1;

      if (status !== 'closed' && status !== 'resolved') {
        openCount++;
      }

      if (ticket.fields.resolved_at && ticket.fields.created_at) {
        totalResolutionTime += ticket.fields.resolved_at - ticket.fields.created_at;
        resolvedCount++;
      }
    }

    return {
      total: allTickets.data.total,
      open: openCount,
      byPriority,
      byCategory,
      averageResolutionTime: resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0,
    };
  }

  /**
   * Get payout summary
   */
  async getPayoutSummary(): Promise<{
    pending: number;
    pendingAmount: number;
    approved: number;
    approvedAmount: number;
    paidThisMonth: number;
    paidAmountThisMonth: number;
  }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const allPayouts = await this.listPayouts({ pageSize: 500 });

    let pending = 0;
    let pendingAmount = 0;
    let approved = 0;
    let approvedAmount = 0;
    let paidThisMonth = 0;
    let paidAmountThisMonth = 0;

    for (const payout of allPayouts.data.items) {
      const status = payout.fields.status;
      const amount = payout.fields.net_amount;

      if (status === 'pending') {
        pending++;
        pendingAmount += amount;
      } else if (status === 'approved') {
        approved++;
        approvedAmount += amount;
      } else if (status === 'paid' && payout.fields.paid_at && payout.fields.paid_at >= startOfMonth.getTime()) {
        paidThisMonth++;
        paidAmountThisMonth += amount;
      }
    }

    return {
      pending,
      pendingAmount,
      approved,
      approvedAmount,
      paidThisMonth,
      paidAmountThisMonth,
    };
  }

  // ============================================================================
  // Sync Operations
  // ============================================================================

  /**
   * Sync coaches from UpCoach to Lark
   */
  async syncCoachesToLark(
    coaches: Array<{
      id: string;
      name: string;
      email: string;
      status: string;
      specializations: string[];
      monthlyRevenue: number;
      clientCount: number;
      avgRating: number;
      onboardingDate: Date;
      lastSessionDate?: Date;
      profileComplete: boolean;
      verificationStatus: string;
    }>
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: SyncError[] = [];
    let recordsCreated = 0;
    let recordsUpdated = 0;

    for (const coach of coaches) {
      try {
        const existingCoach = await this.getCoach(coach.id);

        const fields: CoachPipelineRecord['fields'] = {
          coach_id: coach.id,
          coach_name: coach.name,
          email: coach.email,
          status: coach.status as CoachPipelineRecord['fields']['status'],
          specializations: coach.specializations,
          monthly_revenue: coach.monthlyRevenue,
          client_count: coach.clientCount,
          avg_rating: coach.avgRating,
          onboarding_date: coach.onboardingDate.getTime(),
          last_session_date: coach.lastSessionDate?.getTime(),
          profile_complete: coach.profileComplete,
          verification_status: coach.verificationStatus as CoachPipelineRecord['fields']['verification_status'],
        };

        if (existingCoach) {
          await this.updateCoach(existingCoach.record_id!, fields);
          recordsUpdated++;
        } else {
          await this.createCoach(fields);
          recordsCreated++;
        }
      } catch (error) {
        errors.push({
          upcoachId: coach.id,
          operation: 'create',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: errors.length === 0,
      recordsCreated,
      recordsUpdated,
      recordsDeleted: 0,
      errors,
      syncedAt: new Date(),
      duration: Date.now() - startTime,
    };
  }

  /**
   * Sync tickets from UpCoach to Lark
   */
  async syncTicketsToLark(
    tickets: Array<{
      id: string;
      clientName: string;
      clientEmail: string;
      category: string;
      priority: string;
      status: string;
      subject: string;
      description: string;
      assignedTo?: string;
      relatedCoachId?: string;
      relatedCoachName?: string;
      createdAt: Date;
      updatedAt: Date;
      resolvedAt?: Date;
      resolutionNotes?: string;
    }>
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: SyncError[] = [];
    let recordsCreated = 0;
    let recordsUpdated = 0;

    for (const ticket of tickets) {
      try {
        const result = await this.listTickets({
          filter: {
            conditions: [{ field_name: 'ticket_id', operator: 'is', value: ticket.id }],
          },
          pageSize: 1,
        });

        const fields: SupportTicketRecord['fields'] = {
          ticket_id: ticket.id,
          client_name: ticket.clientName,
          client_email: ticket.clientEmail,
          category: ticket.category as SupportTicketRecord['fields']['category'],
          priority: ticket.priority as SupportTicketRecord['fields']['priority'],
          status: ticket.status as SupportTicketRecord['fields']['status'],
          subject: ticket.subject,
          description: ticket.description,
          assigned_to: ticket.assignedTo,
          related_coach_id: ticket.relatedCoachId,
          related_coach_name: ticket.relatedCoachName,
          created_at: ticket.createdAt.getTime(),
          updated_at: ticket.updatedAt.getTime(),
          resolved_at: ticket.resolvedAt?.getTime(),
          resolution_notes: ticket.resolutionNotes,
        };

        if (result.data.items.length > 0) {
          await this.updateTicket(result.data.items[0].record_id, fields);
          recordsUpdated++;
        } else {
          await this.createTicket(fields);
          recordsCreated++;
        }
      } catch (error) {
        errors.push({
          upcoachId: ticket.id,
          operation: 'create',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: errors.length === 0,
      recordsCreated,
      recordsUpdated,
      recordsDeleted: 0,
      errors,
      syncedAt: new Date(),
      duration: Date.now() - startTime,
    };
  }
}

export default BitableService;
