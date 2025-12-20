/**
 * Approval Workflow Integration
 * Handles Lark approval workflows for coach payouts and refunds
 */

import { LarkClient } from '../client/LarkClient';

// ============================================================================
// Types
// ============================================================================

export interface ApprovalConfig {
  payoutApprovalCode: string;
  refundApprovalCode: string;
  approverHierarchy: {
    payouts: PayoutApprovalTier[];
    refunds: RefundApprovalTier[];
  };
  defaultCurrency: string;
  callbackUrl?: string;
}

export interface PayoutApprovalTier {
  maxAmount: number;
  approverIds: string[];
  approverType: 'or' | 'and'; // 'or' = any one approver, 'and' = all approvers
}

export interface RefundApprovalTier {
  maxAmount: number;
  approverIds: string[];
  approverType: 'or' | 'and';
}

export interface ApprovalRequest {
  approvalCode: string;
  userId: string;
  form: string; // JSON string of form data
  nodeApproverIds?: string[];
  ccUserIds?: string[];
  uuid?: string;
}

export interface ApprovalInstance {
  approvalCode: string;
  approvalName: string;
  instanceCode: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED' | 'DELETED';
  form: Record<string, unknown>[];
  timeline: ApprovalTimeline[];
  createTime: string;
  updateTime: string;
}

export interface ApprovalTimeline {
  type: 'START' | 'PASS' | 'REJECT' | 'CANCEL' | 'DELETE' | 'CC' | 'TRANSFER' | 'ADD' | 'AUTO_PASS' | 'AUTO_REJECT';
  createTime: string;
  userId?: string;
  comment?: string;
  ext?: string;
}

export interface PayoutApprovalData {
  payoutId: string;
  coachId: string;
  coachName: string;
  coachEmail: string;
  amount: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  sessionCount: number;
  platformFee: number;
  netAmount: number;
  paymentMethod: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
  };
  notes?: string;
  requestedBy: string;
  requestedAt: Date;
}

export interface RefundApprovalData {
  refundId: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  originalTransactionId: string;
  originalTransactionDate: Date;
  reason: string;
  reasonCategory: 'dissatisfaction' | 'technical_issue' | 'accidental_purchase' | 'service_not_delivered' | 'other';
  coachId?: string;
  coachName?: string;
  subscriptionId?: string;
  requestedBy: string;
  requestedAt: Date;
}

export interface ApprovalResult {
  success: boolean;
  instanceCode?: string;
  error?: string;
}

export interface ApprovalStatusResult {
  success: boolean;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED' | 'DELETED';
  approvers?: Array<{
    userId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    comment?: string;
    timestamp?: string;
  }>;
  error?: string;
}

// ============================================================================
// Approval Workflow Implementation
// ============================================================================

export class ApprovalWorkflow {
  private readonly client: LarkClient;
  private readonly config: ApprovalConfig;

  constructor(client: LarkClient, config: ApprovalConfig) {
    this.client = client;
    this.config = config;
  }

  // ============================================================================
  // Payout Approval
  // ============================================================================

  /**
   * Submit a payout for approval
   */
  async submitPayoutApproval(data: PayoutApprovalData): Promise<ApprovalResult> {
    try {
      const approvers = this.getPayoutApprovers(data.amount);

      const form = [
        { id: 'payout_id', type: 'text', value: data.payoutId },
        { id: 'coach_name', type: 'text', value: data.coachName },
        { id: 'coach_email', type: 'text', value: data.coachEmail },
        { id: 'gross_amount', type: 'amount', value: `${data.amount}`, currency: data.currency },
        { id: 'platform_fee', type: 'amount', value: `${data.platformFee}`, currency: data.currency },
        { id: 'net_amount', type: 'amount', value: `${data.netAmount}`, currency: data.currency },
        { id: 'period', type: 'text', value: `${data.periodStart.toLocaleDateString()} - ${data.periodEnd.toLocaleDateString()}` },
        { id: 'session_count', type: 'number', value: `${data.sessionCount}` },
        { id: 'payment_method', type: 'text', value: data.paymentMethod },
      ];

      if (data.bankDetails) {
        form.push({
          id: 'bank_details',
          type: 'text',
          value: `${data.bankDetails.bankName || 'N/A'} - ****${(data.bankDetails.accountNumber || '').slice(-4)}`,
        });
      }

      if (data.notes) {
        form.push({ id: 'notes', type: 'textarea', value: data.notes });
      }

      const request: ApprovalRequest = {
        approvalCode: this.config.payoutApprovalCode,
        userId: data.requestedBy,
        form: JSON.stringify(form),
        nodeApproverIds: approvers.map((a) => a.id),
        uuid: `payout_${data.payoutId}_${Date.now()}`,
      };

      const result = await this.client.createApprovalInstance(request);

      return {
        success: true,
        instanceCode: result.data?.instance_code,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit payout approval',
      };
    }
  }

  /**
   * Get approvers for a payout amount
   */
  private getPayoutApprovers(amount: number): Array<{ id: string; role: string }> {
    const approvers: Array<{ id: string; role: string }> = [];

    for (const tier of this.config.approverHierarchy.payouts) {
      if (amount <= tier.maxAmount) {
        for (const approverId of tier.approverIds) {
          approvers.push({ id: approverId, role: this.getApproverRole(tier.maxAmount) });
        }
        break;
      }
    }

    // If amount exceeds all tiers, use the highest tier
    if (approvers.length === 0 && this.config.approverHierarchy.payouts.length > 0) {
      const highestTier = this.config.approverHierarchy.payouts[this.config.approverHierarchy.payouts.length - 1];
      for (const approverId of highestTier.approverIds) {
        approvers.push({ id: approverId, role: 'CFO' });
      }
    }

    return approvers;
  }

  /**
   * Get approver role based on tier
   */
  private getApproverRole(maxAmount: number): string {
    if (maxAmount <= 500) return 'Finance Manager';
    if (maxAmount <= 5000) return 'Finance Director';
    return 'CFO';
  }

  // ============================================================================
  // Refund Approval
  // ============================================================================

  /**
   * Submit a refund for approval
   */
  async submitRefundApproval(data: RefundApprovalData): Promise<ApprovalResult> {
    try {
      const approvers = this.getRefundApprovers(data.amount);

      const form = [
        { id: 'refund_id', type: 'text', value: data.refundId },
        { id: 'user_name', type: 'text', value: data.userName },
        { id: 'user_email', type: 'text', value: data.userEmail },
        { id: 'amount', type: 'amount', value: `${data.amount}`, currency: data.currency },
        { id: 'original_transaction_id', type: 'text', value: data.originalTransactionId },
        { id: 'original_transaction_date', type: 'date', value: data.originalTransactionDate.toISOString() },
        { id: 'reason_category', type: 'text', value: this.formatReasonCategory(data.reasonCategory) },
        { id: 'reason', type: 'textarea', value: data.reason },
      ];

      if (data.coachName) {
        form.push({ id: 'related_coach', type: 'text', value: data.coachName });
      }

      if (data.subscriptionId) {
        form.push({ id: 'subscription_id', type: 'text', value: data.subscriptionId });
      }

      const request: ApprovalRequest = {
        approvalCode: this.config.refundApprovalCode,
        userId: data.requestedBy,
        form: JSON.stringify(form),
        nodeApproverIds: approvers.map((a) => a.id),
        uuid: `refund_${data.refundId}_${Date.now()}`,
      };

      const result = await this.client.createApprovalInstance(request);

      return {
        success: true,
        instanceCode: result.data?.instance_code,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit refund approval',
      };
    }
  }

  /**
   * Get approvers for a refund amount
   */
  private getRefundApprovers(amount: number): Array<{ id: string; role: string }> {
    const approvers: Array<{ id: string; role: string }> = [];

    for (const tier of this.config.approverHierarchy.refunds) {
      if (amount <= tier.maxAmount) {
        for (const approverId of tier.approverIds) {
          approvers.push({ id: approverId, role: this.getRefundApproverRole(tier.maxAmount) });
        }
        break;
      }
    }

    if (approvers.length === 0 && this.config.approverHierarchy.refunds.length > 0) {
      const highestTier = this.config.approverHierarchy.refunds[this.config.approverHierarchy.refunds.length - 1];
      for (const approverId of highestTier.approverIds) {
        approvers.push({ id: approverId, role: 'VP Operations' });
      }
    }

    return approvers;
  }

  /**
   * Get refund approver role based on tier
   */
  private getRefundApproverRole(maxAmount: number): string {
    if (maxAmount <= 50) return 'Support Lead';
    if (maxAmount <= 200) return 'Customer Success Director';
    return 'VP Operations';
  }

  /**
   * Format reason category for display
   */
  private formatReasonCategory(category: RefundApprovalData['reasonCategory']): string {
    const categoryLabels: Record<RefundApprovalData['reasonCategory'], string> = {
      dissatisfaction: 'Service Dissatisfaction',
      technical_issue: 'Technical Issue',
      accidental_purchase: 'Accidental Purchase',
      service_not_delivered: 'Service Not Delivered',
      other: 'Other',
    };
    return categoryLabels[category] || category;
  }

  // ============================================================================
  // Approval Status
  // ============================================================================

  /**
   * Get approval status
   */
  async getApprovalStatus(instanceCode: string): Promise<ApprovalStatusResult> {
    try {
      const result = await this.client.getApprovalInstance(instanceCode);
      const instance = result.data;

      const approvers: ApprovalStatusResult['approvers'] = [];

      if (instance?.timeline) {
        for (const event of instance.timeline) {
          if (event.userId && (event.type === 'PASS' || event.type === 'REJECT')) {
            approvers.push({
              userId: event.userId,
              status: event.type === 'PASS' ? 'APPROVED' : 'REJECTED',
              comment: event.comment,
              timestamp: event.createTime,
            });
          }
        }
      }

      return {
        success: true,
        status: instance?.status,
        approvers,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get approval status',
      };
    }
  }

  /**
   * Cancel an approval request
   */
  async cancelApproval(instanceCode: string, userId: string): Promise<ApprovalResult> {
    try {
      await this.client.cancelApprovalInstance(instanceCode, userId);

      return {
        success: true,
        instanceCode,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel approval',
      };
    }
  }

  // ============================================================================
  // Webhook Handlers
  // ============================================================================

  /**
   * Handle approval status change webhook
   */
  async handleApprovalCallback(event: {
    approvalCode: string;
    instanceCode: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED' | 'DELETED';
    operatorId?: string;
    comment?: string;
  }): Promise<{
    type: 'payout' | 'refund';
    instanceCode: string;
    status: string;
    operatorId?: string;
    comment?: string;
  }> {
    const type = event.approvalCode === this.config.payoutApprovalCode ? 'payout' : 'refund';

    return {
      type,
      instanceCode: event.instanceCode,
      status: event.status,
      operatorId: event.operatorId,
      comment: event.comment,
    };
  }

  // ============================================================================
  // Approval Definition Helpers
  // ============================================================================

  /**
   * Get payout approval definition info
   */
  async getPayoutApprovalDefinition(): Promise<{
    code: string;
    name: string;
    tiers: Array<{
      maxAmount: number;
      approvers: string[];
      type: string;
    }>;
  }> {
    return {
      code: this.config.payoutApprovalCode,
      name: 'Coach Payout Approval',
      tiers: this.config.approverHierarchy.payouts.map((tier) => ({
        maxAmount: tier.maxAmount,
        approvers: tier.approverIds,
        type: tier.approverType,
      })),
    };
  }

  /**
   * Get refund approval definition info
   */
  async getRefundApprovalDefinition(): Promise<{
    code: string;
    name: string;
    tiers: Array<{
      maxAmount: number;
      approvers: string[];
      type: string;
    }>;
  }> {
    return {
      code: this.config.refundApprovalCode,
      name: 'Refund Approval',
      tiers: this.config.approverHierarchy.refunds.map((tier) => ({
        maxAmount: tier.maxAmount,
        approvers: tier.approverIds,
        type: tier.approverType,
      })),
    };
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  /**
   * Get pending payouts for approval
   */
  async getPendingPayoutApprovals(userId: string): Promise<ApprovalInstance[]> {
    try {
      const result = await this.client.listApprovalInstances({
        approvalCode: this.config.payoutApprovalCode,
        status: 'PENDING',
      });

      const instances = (result.data?.instance_list || []) as ApprovalInstance[];
      return instances.filter(
        (instance) =>
          instance.status === 'PENDING' &&
          this.isUserApprover(instance, userId)
      );
    } catch {
      return [];
    }
  }

  /**
   * Get pending refunds for approval
   */
  async getPendingRefundApprovals(userId: string): Promise<ApprovalInstance[]> {
    try {
      const result = await this.client.listApprovalInstances({
        approvalCode: this.config.refundApprovalCode,
        status: 'PENDING',
      });

      const instances = (result.data?.instance_list || []) as ApprovalInstance[];
      return instances.filter(
        (instance) =>
          instance.status === 'PENDING' &&
          this.isUserApprover(instance, userId)
      );
    } catch {
      return [];
    }
  }

  /**
   * Check if user is an approver for an instance
   */
  private isUserApprover(instance: ApprovalInstance, userId: string): boolean {
    // This would need to check the actual approval nodes
    // For now, return true as a placeholder
    return instance.userId !== userId;
  }
}

export default ApprovalWorkflow;
