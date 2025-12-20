/**
 * Bidirectional Sync Engine
 * Handles synchronization between UpCoach and Lark
 */

import { LarkClient } from '../client/LarkClient';
import { BitableService } from '../bitable/BitableService';
import type {
  LarkBaseConfig,
  SyncResult,
  SyncError,
  SyncMapping,
  ConflictResolution,
  CoachPipelineRecord,
  SupportTicketRecord,
  CoachPayoutRecord,
} from '../bitable/types';

// ============================================================================
// Types
// ============================================================================

export interface SyncEngineConfig {
  larkClient: LarkClient;
  baseConfig: LarkBaseConfig;
  conflictStrategy: 'upcoach_wins' | 'lark_wins' | 'newest_wins';
  syncInterval?: number; // in milliseconds
  batchSize?: number;
  onSyncComplete?: (result: SyncResult) => void;
  onConflict?: (conflict: ConflictInfo) => ConflictResolution;
  onError?: (error: SyncError) => void;
}

export interface ConflictInfo {
  tableName: string;
  upcoachRecord: Record<string, unknown>;
  larkRecord: Record<string, unknown>;
  upcoachUpdatedAt: Date;
  larkUpdatedAt: Date;
  conflictingFields: string[];
}

export interface SyncState {
  lastSyncTime: Date | null;
  isRunning: boolean;
  currentTable: string | null;
  progress: number;
  errors: SyncError[];
}

export interface DataProvider {
  // Coach data
  getCoaches(): Promise<CoachData[]>;
  updateCoach(id: string, data: Partial<CoachData>): Promise<void>;
  createCoach(data: CoachData): Promise<string>;

  // Ticket data
  getTickets(): Promise<TicketData[]>;
  updateTicket(id: string, data: Partial<TicketData>): Promise<void>;
  createTicket(data: TicketData): Promise<string>;

  // Payout data
  getPayouts(): Promise<PayoutData[]>;
  updatePayout(id: string, data: Partial<PayoutData>): Promise<void>;
  createPayout(data: PayoutData): Promise<string>;

  // Sync tracking
  getSyncMappings(tableName: string): Promise<SyncMapping[]>;
  saveSyncMapping(mapping: SyncMapping): Promise<void>;
  updateSyncMapping(upcoachId: string, larkRecordId: string, checksum: string): Promise<void>;
}

export interface CoachData {
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
  updatedAt: Date;
}

export interface TicketData {
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
}

export interface PayoutData {
  id: string;
  coachId: string;
  coachName: string;
  periodStart: Date;
  periodEnd: Date;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  status: string;
  approvalLevel: string;
  approvedBy?: string;
  approvedAt?: Date;
  paymentMethod: string;
  paymentReference?: string;
  paidAt?: Date;
  sessionCount: number;
  notes?: string;
  updatedAt: Date;
}

// ============================================================================
// Sync Engine Implementation
// ============================================================================

export class SyncEngine {
  private readonly client: LarkClient;
  private readonly bitableService: BitableService;
  private readonly config: SyncEngineConfig;
  private readonly batchSize: number;
  private state: SyncState;
  private syncTimer: NodeJS.Timeout | null = null;
  private dataProvider: DataProvider | null = null;

  constructor(config: SyncEngineConfig) {
    this.config = config;
    this.client = config.larkClient;
    this.bitableService = new BitableService(config.larkClient, config.baseConfig);
    this.batchSize = config.batchSize || 100;
    this.state = {
      lastSyncTime: null,
      isRunning: false,
      currentTable: null,
      progress: 0,
      errors: [],
    };
  }

  /**
   * Set data provider for accessing UpCoach data
   */
  setDataProvider(provider: DataProvider): void {
    this.dataProvider = provider;
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Start automatic sync at configured interval
   */
  startAutoSync(): void {
    if (this.syncTimer) {
      this.stopAutoSync();
    }

    const interval = this.config.syncInterval || 5 * 60 * 1000; // Default 5 minutes

    this.syncTimer = setInterval(() => {
      this.syncAll().catch((error) => {
        console.error('Auto-sync failed:', error);
      });
    }, interval);

    // Run initial sync
    this.syncAll().catch((error) => {
      console.error('Initial sync failed:', error);
    });
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Run full sync of all tables
   */
  async syncAll(): Promise<SyncResult> {
    if (this.state.isRunning) {
      return {
        success: false,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        errors: [{ operation: 'create', error: 'Sync already in progress' }],
        syncedAt: new Date(),
        duration: 0,
      };
    }

    if (!this.dataProvider) {
      return {
        success: false,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        errors: [{ operation: 'create', error: 'Data provider not configured' }],
        syncedAt: new Date(),
        duration: 0,
      };
    }

    const startTime = Date.now();
    this.state.isRunning = true;
    this.state.errors = [];

    const results: SyncResult[] = [];

    try {
      // Sync coaches (UpCoach → Lark for technical data)
      this.state.currentTable = 'coaches';
      this.state.progress = 0;
      results.push(await this.syncCoaches());

      // Sync tickets (bidirectional)
      this.state.currentTable = 'tickets';
      this.state.progress = 33;
      results.push(await this.syncTickets());

      // Sync payouts (UpCoach → Lark)
      this.state.currentTable = 'payouts';
      this.state.progress = 66;
      results.push(await this.syncPayouts());

      this.state.progress = 100;
    } finally {
      this.state.isRunning = false;
      this.state.currentTable = null;
      this.state.lastSyncTime = new Date();
    }

    const combinedResult: SyncResult = {
      success: results.every((r) => r.success),
      recordsCreated: results.reduce((sum, r) => sum + r.recordsCreated, 0),
      recordsUpdated: results.reduce((sum, r) => sum + r.recordsUpdated, 0),
      recordsDeleted: results.reduce((sum, r) => sum + r.recordsDeleted, 0),
      errors: results.flatMap((r) => r.errors),
      syncedAt: new Date(),
      duration: Date.now() - startTime,
    };

    this.state.errors = combinedResult.errors;

    if (this.config.onSyncComplete) {
      this.config.onSyncComplete(combinedResult);
    }

    return combinedResult;
  }

  /**
   * Sync coaches from UpCoach to Lark
   */
  async syncCoaches(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: SyncError[] = [];
    let recordsCreated = 0;
    let recordsUpdated = 0;

    if (!this.dataProvider) {
      return {
        success: false,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        errors: [{ operation: 'create', error: 'Data provider not configured' }],
        syncedAt: new Date(),
        duration: 0,
      };
    }

    try {
      const coaches = await this.dataProvider.getCoaches();
      const mappings = await this.dataProvider.getSyncMappings('coaches');
      const mappingMap = new Map(mappings.map((m) => [m.upcoachId, m]));

      for (const coach of coaches) {
        try {
          const mapping = mappingMap.get(coach.id);
          const checksum = this.calculateChecksum(coach);

          // Check if record needs sync
          if (mapping && mapping.checksum === checksum) {
            continue; // No changes
          }

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

          if (mapping) {
            // Update existing record
            await this.bitableService.updateCoach(mapping.larkRecordId, fields);
            await this.dataProvider.updateSyncMapping(coach.id, mapping.larkRecordId, checksum);
            recordsUpdated++;
          } else {
            // Create new record
            const recordId = await this.bitableService.createCoach(fields);
            await this.dataProvider.saveSyncMapping({
              upcoachId: coach.id,
              larkRecordId: recordId,
              tableName: 'coaches',
              lastSyncedAt: new Date(),
              syncDirection: 'upcoach_to_lark',
              checksum,
            });
            recordsCreated++;
          }
        } catch (error) {
          const syncError: SyncError = {
            upcoachId: coach.id,
            operation: 'update',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          errors.push(syncError);
          if (this.config.onError) {
            this.config.onError(syncError);
          }
        }
      }
    } catch (error) {
      errors.push({
        operation: 'create',
        error: error instanceof Error ? error.message : 'Failed to sync coaches',
      });
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
   * Sync tickets bidirectionally
   */
  async syncTickets(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: SyncError[] = [];
    let recordsCreated = 0;
    let recordsUpdated = 0;

    if (!this.dataProvider) {
      return {
        success: false,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        errors: [{ operation: 'create', error: 'Data provider not configured' }],
        syncedAt: new Date(),
        duration: 0,
      };
    }

    try {
      // Get data from both sources
      const upcoachTickets = await this.dataProvider.getTickets();
      const larkTicketsResult = await this.bitableService.listTickets({ pageSize: 500 });
      const larkTickets = larkTicketsResult.data.items;
      const mappings = await this.dataProvider.getSyncMappings('tickets');

      const upcoachMap = new Map(upcoachTickets.map((t) => [t.id, t]));
      const larkMap = new Map(larkTickets.map((t) => [t.fields.ticket_id, t]));
      const mappingMap = new Map(mappings.map((m) => [m.upcoachId, m]));

      // Sync UpCoach → Lark
      for (const ticket of upcoachTickets) {
        try {
          const larkTicket = larkMap.get(ticket.id);
          const mapping = mappingMap.get(ticket.id);
          const checksum = this.calculateChecksum(ticket);

          if (mapping && mapping.checksum === checksum) {
            continue; // No changes from UpCoach side
          }

          // Handle conflict if Lark has different data
          if (larkTicket && mapping) {
            const larkUpdatedAt = new Date(larkTicket.fields.updated_at);

            if (larkUpdatedAt > mapping.lastSyncedAt) {
              // Potential conflict
              const resolution = this.resolveConflict(
                ticket as unknown as Record<string, unknown>,
                larkTicket.fields as unknown as Record<string, unknown>,
                'tickets'
              );
              if (resolution.strategy === 'lark_wins') {
                // Update UpCoach from Lark
                await this.dataProvider.updateTicket(ticket.id, {
                  status: larkTicket.fields.status,
                  priority: larkTicket.fields.priority,
                  assignedTo: larkTicket.fields.assigned_to,
                  resolutionNotes: larkTicket.fields.resolution_notes,
                });
                recordsUpdated++;
                continue;
              }
            }
          }

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

          if (larkTicket) {
            await this.bitableService.updateTicket(larkTicket.record_id, fields);
            await this.dataProvider.updateSyncMapping(ticket.id, larkTicket.record_id, checksum);
            recordsUpdated++;
          } else {
            const recordId = await this.bitableService.createTicket(fields);
            await this.dataProvider.saveSyncMapping({
              upcoachId: ticket.id,
              larkRecordId: recordId,
              tableName: 'tickets',
              lastSyncedAt: new Date(),
              syncDirection: 'bidirectional',
              checksum,
            });
            recordsCreated++;
          }
        } catch (error) {
          const syncError: SyncError = {
            upcoachId: ticket.id,
            operation: 'update',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          errors.push(syncError);
          if (this.config.onError) {
            this.config.onError(syncError);
          }
        }
      }

      // Sync Lark → UpCoach (for new tickets created in Lark)
      for (const larkTicket of larkTickets) {
        if (!upcoachMap.has(larkTicket.fields.ticket_id)) {
          try {
            // New ticket from Lark
            const ticketData: TicketData = {
              id: larkTicket.fields.ticket_id,
              clientName: larkTicket.fields.client_name,
              clientEmail: larkTicket.fields.client_email,
              category: larkTicket.fields.category,
              priority: larkTicket.fields.priority,
              status: larkTicket.fields.status,
              subject: larkTicket.fields.subject,
              description: larkTicket.fields.description,
              assignedTo: larkTicket.fields.assigned_to,
              relatedCoachId: larkTicket.fields.related_coach_id,
              relatedCoachName: larkTicket.fields.related_coach_name,
              createdAt: new Date(larkTicket.fields.created_at),
              updatedAt: new Date(larkTicket.fields.updated_at),
              resolvedAt: larkTicket.fields.resolved_at ? new Date(larkTicket.fields.resolved_at) : undefined,
              resolutionNotes: larkTicket.fields.resolution_notes,
            };

            await this.dataProvider.createTicket(ticketData);
            await this.dataProvider.saveSyncMapping({
              upcoachId: larkTicket.fields.ticket_id,
              larkRecordId: larkTicket.record_id,
              tableName: 'tickets',
              lastSyncedAt: new Date(),
              syncDirection: 'bidirectional',
              checksum: this.calculateChecksum(ticketData),
            });
            recordsCreated++;
          } catch (error) {
            const syncError: SyncError = {
              larkRecordId: larkTicket.record_id,
              operation: 'create',
              error: error instanceof Error ? error.message : 'Unknown error',
            };
            errors.push(syncError);
          }
        }
      }
    } catch (error) {
      errors.push({
        operation: 'create',
        error: error instanceof Error ? error.message : 'Failed to sync tickets',
      });
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
   * Sync payouts from UpCoach to Lark
   */
  async syncPayouts(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: SyncError[] = [];
    let recordsCreated = 0;
    let recordsUpdated = 0;

    if (!this.dataProvider) {
      return {
        success: false,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        errors: [{ operation: 'create', error: 'Data provider not configured' }],
        syncedAt: new Date(),
        duration: 0,
      };
    }

    try {
      const payouts = await this.dataProvider.getPayouts();
      const mappings = await this.dataProvider.getSyncMappings('payouts');
      const mappingMap = new Map(mappings.map((m) => [m.upcoachId, m]));

      for (const payout of payouts) {
        try {
          const mapping = mappingMap.get(payout.id);
          const checksum = this.calculateChecksum(payout);

          if (mapping && mapping.checksum === checksum) {
            continue;
          }

          const fields: CoachPayoutRecord['fields'] = {
            payout_id: payout.id,
            coach_id: payout.coachId,
            coach_name: payout.coachName,
            period_start: payout.periodStart.getTime(),
            period_end: payout.periodEnd.getTime(),
            gross_amount: payout.grossAmount,
            platform_fee: payout.platformFee,
            net_amount: payout.netAmount,
            currency: payout.currency,
            status: payout.status as CoachPayoutRecord['fields']['status'],
            approval_level: payout.approvalLevel as CoachPayoutRecord['fields']['approval_level'],
            approved_by: payout.approvedBy,
            approved_at: payout.approvedAt?.getTime(),
            payment_method: payout.paymentMethod as CoachPayoutRecord['fields']['payment_method'],
            payment_reference: payout.paymentReference,
            paid_at: payout.paidAt?.getTime(),
            session_count: payout.sessionCount,
            notes: payout.notes,
          };

          if (mapping) {
            await this.bitableService.updatePayout(mapping.larkRecordId, fields);
            await this.dataProvider.updateSyncMapping(payout.id, mapping.larkRecordId, checksum);
            recordsUpdated++;
          } else {
            const recordId = await this.bitableService.createPayout(fields);
            await this.dataProvider.saveSyncMapping({
              upcoachId: payout.id,
              larkRecordId: recordId,
              tableName: 'payouts',
              lastSyncedAt: new Date(),
              syncDirection: 'upcoach_to_lark',
              checksum,
            });
            recordsCreated++;
          }
        } catch (error) {
          const syncError: SyncError = {
            upcoachId: payout.id,
            operation: 'update',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          errors.push(syncError);
          if (this.config.onError) {
            this.config.onError(syncError);
          }
        }
      }
    } catch (error) {
      errors.push({
        operation: 'create',
        error: error instanceof Error ? error.message : 'Failed to sync payouts',
      });
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
   * Calculate checksum for change detection
   */
  private calculateChecksum(data: CoachData | TicketData | PayoutData): string {
    const sorted = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < sorted.length; i++) {
      const char = sorted.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Resolve sync conflict
   */
  private resolveConflict(
    upcoachRecord: Record<string, unknown>,
    larkRecord: Record<string, unknown>,
    tableName: string
  ): ConflictResolution {
    // If custom handler is provided, use it
    if (this.config.onConflict) {
      const upcoachUpdatedAt = upcoachRecord.updatedAt as Date || new Date(0);
      const larkUpdatedAt = larkRecord.updated_at ? new Date(larkRecord.updated_at as number) : new Date(0);

      return this.config.onConflict({
        tableName,
        upcoachRecord,
        larkRecord,
        upcoachUpdatedAt,
        larkUpdatedAt,
        conflictingFields: this.findConflictingFields(upcoachRecord, larkRecord),
      });
    }

    // Default conflict resolution based on strategy
    switch (this.config.conflictStrategy) {
      case 'lark_wins':
        return { strategy: 'lark_wins' };
      case 'newest_wins':
        const upcoachTime = (upcoachRecord.updatedAt as Date)?.getTime() || 0;
        const larkTime = (larkRecord.updated_at as number) || 0;
        return { strategy: upcoachTime > larkTime ? 'upcoach_wins' : 'lark_wins' };
      case 'upcoach_wins':
      default:
        return { strategy: 'upcoach_wins' };
    }
  }

  /**
   * Find fields that have different values
   */
  private findConflictingFields(
    upcoachRecord: Record<string, unknown>,
    larkRecord: Record<string, unknown>
  ): string[] {
    const conflicts: string[] = [];
    const fieldMapping: Record<string, string> = {
      status: 'status',
      priority: 'priority',
      assignedTo: 'assigned_to',
      resolutionNotes: 'resolution_notes',
    };

    for (const [upcoachField, larkField] of Object.entries(fieldMapping)) {
      if (upcoachRecord[upcoachField] !== larkRecord[larkField]) {
        conflicts.push(upcoachField);
      }
    }

    return conflicts;
  }
}

export default SyncEngine;
