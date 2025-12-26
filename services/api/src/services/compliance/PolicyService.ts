import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import * as grayMatter from 'gray-matter';
import { marked } from 'marked';

/**
 * Policy Service
 *
 * Version-controlled policy document management for SOC2 compliance:
 * - Policy document CRUD (Markdown format)
 * - Version history tracking
 * - Policy acceptance workflows
 * - Employee training completion tracking
 * - Automated policy review reminders
 *
 * Policies Managed:
 * - Information Security Policy
 * - Access Control Policy
 * - Incident Response Policy
 * - Business Continuity Policy
 * - Vendor Management Policy
 * - Data Classification Policy
 * - Acceptable Use Policy
 * - Password Policy
 * - Remote Work Policy
 */

export interface Policy {
  id: string;
  name: string;
  version: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface PolicyAcceptance {
  policyId: string;
  userId: string;
  acceptedAt: Date;
  ipAddress: string;
  userAgent?: string;
}

export interface PolicyComplianceStatus {
  policyId: string;
  policyName: string;
  version: string;
  totalUsers: number;
  acceptedCount: number;
  pendingCount: number;
  complianceRate: number;
  lastPublished: Date;
}

export class PolicyService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Create new policy (draft)
   */
  async createPolicy(
    name: string,
    content: string,
    version: string,
    createdBy: string,
    metadata?: Record<string, any>
  ): Promise<Policy> {
    try {
      // Parse frontmatter from markdown
      const parsed = grayMatter(content);
      const frontmatter = parsed.data;

      const query = `
        INSERT INTO compliance_policies (
          name, version, content, status, created_by,
          created_at, updated_at, metadata
        )
        VALUES ($1, $2, $3, 'draft', $4, NOW(), NOW(), $5)
        RETURNING *
      `;
      const result = await this.db.query(query, [
        name,
        version,
        content,
        createdBy,
        JSON.stringify({ ...metadata, frontmatter }),
      ]);

      logger.info('Policy created', {
        policyId: result.rows[0].id,
        name,
        version,
      });

      return this.mapRowToPolicy(result.rows[0]);
    } catch (error) {
      logger.error('Policy creation failed', {
        name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update policy content
   */
  async updatePolicy(
    policyId: string,
    content: string,
    version: string
  ): Promise<Policy> {
    try {
      const query = `
        UPDATE compliance_policies
        SET content = $1, version = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;
      const result = await this.db.query(query, [content, version, policyId]);

      if (result.rows.length === 0) {
        throw new Error(`Policy ${policyId} not found`);
      }

      logger.info('Policy updated', { policyId, version });

      return this.mapRowToPolicy(result.rows[0]);
    } catch (error) {
      logger.error('Policy update failed', {
        policyId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Publish policy (requires employee acceptance)
   */
  async publishPolicy(policyId: string, publishedBy: string): Promise<Policy> {
    try {
      const query = `
        UPDATE compliance_policies
        SET status = 'published', published_at = NOW(), updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      const result = await this.db.query(query, [policyId]);

      if (result.rows.length === 0) {
        throw new Error(`Policy ${policyId} not found`);
      }

      const policy = this.mapRowToPolicy(result.rows[0]);

      // Trigger policy acceptance workflow
      await this.triggerAcceptanceWorkflow(policy);

      logger.info('Policy published', {
        policyId,
        publishedBy,
        version: policy.version,
      });

      return policy;
    } catch (error) {
      logger.error('Policy publish failed', {
        policyId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Archive policy
   */
  async archivePolicy(policyId: string): Promise<void> {
    await this.db.query(
      `UPDATE compliance_policies SET status = 'archived', updated_at = NOW() WHERE id = $1`,
      [policyId]
    );
    logger.info('Policy archived', { policyId });
  }

  /**
   * Track policy acceptance by user
   */
  async trackAcceptance(
    policyId: string,
    userId: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<PolicyAcceptance> {
    try {
      const query = `
        INSERT INTO policy_acceptances (
          policy_id, user_id, accepted_at, ip_address, user_agent
        )
        VALUES ($1, $2, NOW(), $3, $4)
        ON CONFLICT (policy_id, user_id) DO UPDATE
        SET accepted_at = NOW(), ip_address = $3, user_agent = $4
        RETURNING *
      `;
      const result = await this.db.query(query, [
        policyId,
        userId,
        ipAddress,
        userAgent,
      ]);

      logger.info('Policy acceptance tracked', { policyId, userId });

      return {
        policyId: result.rows[0].policy_id,
        userId: result.rows[0].user_id,
        acceptedAt: result.rows[0].accepted_at,
        ipAddress: result.rows[0].ip_address,
        userAgent: result.rows[0].user_agent,
      };
    } catch (error) {
      logger.error('Policy acceptance tracking failed', {
        policyId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get policy compliance status
   */
  async getComplianceStatus(policyId: string): Promise<PolicyComplianceStatus> {
    try {
      const query = `
        WITH policy_info AS (
          SELECT id, name, version, published_at
          FROM compliance_policies
          WHERE id = $1
        ),
        user_count AS (
          SELECT COUNT(*) AS total_users
          FROM users
          WHERE active = true
        ),
        acceptance_count AS (
          SELECT COUNT(*) AS accepted_count
          FROM policy_acceptances
          WHERE policy_id = $1
        )
        SELECT
          p.id AS policy_id,
          p.name AS policy_name,
          p.version,
          u.total_users,
          COALESCE(a.accepted_count, 0) AS accepted_count,
          u.total_users - COALESCE(a.accepted_count, 0) AS pending_count,
          CASE WHEN u.total_users > 0
            THEN (COALESCE(a.accepted_count, 0)::FLOAT / u.total_users::FLOAT) * 100
            ELSE 0
          END AS compliance_rate,
          p.published_at
        FROM policy_info p
        CROSS JOIN user_count u
        LEFT JOIN acceptance_count a ON true
      `;
      const result = await this.db.query(query, [policyId]);

      if (result.rows.length === 0) {
        throw new Error(`Policy ${policyId} not found`);
      }

      const row = result.rows[0];
      return {
        policyId: row.policy_id,
        policyName: row.policy_name,
        version: row.version,
        totalUsers: parseInt(row.total_users),
        acceptedCount: parseInt(row.accepted_count),
        pendingCount: parseInt(row.pending_count),
        complianceRate: parseFloat(row.compliance_rate),
        lastPublished: row.published_at,
      };
    } catch (error) {
      logger.error('Policy compliance status failed', {
        policyId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get all policies
   */
  async getAllPolicies(status?: 'draft' | 'published' | 'archived'): Promise<Policy[]> {
    const query = status
      ? `SELECT * FROM compliance_policies WHERE status = $1 ORDER BY created_at DESC`
      : `SELECT * FROM compliance_policies ORDER BY created_at DESC`;

    const result = status
      ? await this.db.query(query, [status])
      : await this.db.query(query);

    return result.rows.map(this.mapRowToPolicy);
  }

  /**
   * Get policy by ID
   */
  async getPolicy(policyId: string): Promise<Policy | null> {
    const result = await this.db.query(
      `SELECT * FROM compliance_policies WHERE id = $1`,
      [policyId]
    );
    return result.rows.length > 0 ? this.mapRowToPolicy(result.rows[0]) : null;
  }

  /**
   * Get policy version history
   */
  async getVersionHistory(policyName: string): Promise<Policy[]> {
    const query = `
      SELECT * FROM compliance_policies
      WHERE name = $1
      ORDER BY created_at DESC
    `;
    const result = await this.db.query(query, [policyName]);
    return result.rows.map(this.mapRowToPolicy);
  }

  /**
   * Get policies pending acceptance by user
   */
  async getPendingPoliciesForUser(userId: string): Promise<Policy[]> {
    const query = `
      SELECT p.*
      FROM compliance_policies p
      WHERE p.status = 'published'
        AND NOT EXISTS (
          SELECT 1 FROM policy_acceptances pa
          WHERE pa.policy_id = p.id AND pa.user_id = $1
        )
      ORDER BY p.published_at DESC
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows.map(this.mapRowToPolicy);
  }

  /**
   * Render policy as HTML
   */
  async renderPolicyHTML(policyId: string): Promise<string> {
    const policy = await this.getPolicy(policyId);
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }

    const html = marked(policy.content);
    return html as string;
  }

  /**
   * Send policy review reminders
   */
  async sendReviewReminders(): Promise<void> {
    try {
      // Find policies published > 1 year ago
      const query = `
        SELECT * FROM compliance_policies
        WHERE status = 'published'
          AND published_at < NOW() - INTERVAL '1 year'
      `;
      const result = await this.db.query(query);
      const policies = result.rows.map(this.mapRowToPolicy);

      for (const policy of policies) {
        // Send reminder to policy owner
        logger.info('Sending policy review reminder', {
          policyId: policy.id,
          policyName: policy.name,
        });
        // TODO: Integrate with notification service
      }
    } catch (error) {
      logger.error('Failed to send policy review reminders', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Private helper methods
   */

  private async triggerAcceptanceWorkflow(policy: Policy): Promise<void> {
    // Get all active users
    const result = await this.db.query(
      `SELECT id, email FROM users WHERE active = true`
    );
    const users = result.rows;

    logger.info('Triggering policy acceptance workflow', {
      policyId: policy.id,
      userCount: users.length,
    });

    // TODO: Send email notifications to all users
    // TODO: Create in-app notifications
  }

  private mapRowToPolicy(row: any): Policy {
    return {
      id: row.id,
      name: row.name,
      version: row.version,
      content: row.content,
      status: row.status,
      publishedAt: row.published_at,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: row.metadata,
    };
  }
}
