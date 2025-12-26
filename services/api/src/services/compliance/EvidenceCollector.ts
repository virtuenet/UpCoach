import { Octokit } from '@octokit/rest';
import {
  CloudTrailClient,
  LookupEventsCommand,
  LookupEventsCommandInput,
} from '@aws-sdk/client-cloudtrail';
import { SentryClient } from '@sentry/node';
import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Evidence Collector
 *
 * Automated evidence collection from external systems for SOC2 compliance:
 * - GitHub: Change management evidence (commits, PRs, code reviews)
 * - AWS CloudTrail: Access control evidence (IAM changes, API calls)
 * - Sentry: Incident response evidence (errors, releases)
 * - CI/CD: Deployment evidence (build logs, test results)
 * - Security Scans: Vulnerability management (npm audit, Snyk)
 *
 * Evidence Types:
 * - Change Management (CC8.1): Code commits, PR approvals, deployment logs
 * - Access Control (CC6.1-6.3): IAM changes, login attempts, permission grants
 * - Incident Response (CC7.3-7.5): Error tracking, incident tickets, resolution time
 * - Vulnerability Management (CC7.1): Security scan results, patch management
 */

export interface Evidence {
  id: string;
  controlId: string;
  evidenceType: string;
  source: string;
  data: any;
  collectedAt: Date;
  metadata?: Record<string, any>;
}

export interface EvidencePackage {
  controlId: string;
  controlName: string;
  evidenceItems: Evidence[];
  generatedAt: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export interface GitHubEvidence {
  commits: any[];
  pullRequests: any[];
  codeReviews: any[];
}

export interface CloudTrailEvidence {
  iamChanges: any[];
  apiCalls: any[];
  securityEvents: any[];
}

export interface SentryEvidence {
  errors: any[];
  releases: any[];
  deployments: any[];
}

export class EvidenceCollector {
  private db: Pool;
  private githubClient: Octokit;
  private cloudTrailClient: CloudTrailClient;
  private sentryClient: any;

  constructor(db: Pool) {
    this.db = db;

    // Initialize GitHub client
    this.githubClient = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // Initialize AWS CloudTrail client
    this.cloudTrailClient = new CloudTrailClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    // Initialize Sentry client
    this.sentryClient = {
      dsn: process.env.SENTRY_DSN,
      organization: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    };
  }

  /**
   * Collect change management evidence (CC8.1)
   */
  async collectChangeManagementEvidence(
    startDate: Date,
    endDate: Date
  ): Promise<Evidence[]> {
    try {
      logger.info('Collecting change management evidence', { startDate, endDate });

      const evidence: Evidence[] = [];

      // Collect GitHub commits
      const commits = await this.collectGitHubCommits(startDate, endDate);
      evidence.push({
        id: `github-commits-${Date.now()}`,
        controlId: 'CC8.1',
        evidenceType: 'change_management',
        source: 'github',
        data: { commits },
        collectedAt: new Date(),
        metadata: {
          totalCommits: commits.length,
          period: { startDate, endDate },
        },
      });

      // Collect GitHub pull requests
      const pullRequests = await this.collectGitHubPullRequests(startDate, endDate);
      evidence.push({
        id: `github-prs-${Date.now()}`,
        controlId: 'CC8.1',
        evidenceType: 'change_management',
        source: 'github',
        data: { pullRequests },
        collectedAt: new Date(),
        metadata: {
          totalPRs: pullRequests.length,
          mergedPRs: pullRequests.filter((pr: any) => pr.merged_at).length,
        },
      });

      // Collect CI/CD deployment logs
      const deployments = await this.collectDeploymentLogs(startDate, endDate);
      evidence.push({
        id: `deployments-${Date.now()}`,
        controlId: 'CC8.1',
        evidenceType: 'change_management',
        source: 'cicd',
        data: { deployments },
        collectedAt: new Date(),
        metadata: {
          totalDeployments: deployments.length,
          successfulDeployments: deployments.filter((d: any) => d.status === 'success')
            .length,
        },
      });

      // Persist evidence
      for (const item of evidence) {
        await this.persistEvidence(item);
      }

      logger.info('Change management evidence collected', {
        totalItems: evidence.length,
      });

      return evidence;
    } catch (error) {
      logger.error('Change management evidence collection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Collect access control evidence (CC6.1-6.3)
   */
  async collectAccessControlEvidence(
    startDate: Date,
    endDate: Date
  ): Promise<Evidence[]> {
    try {
      logger.info('Collecting access control evidence', { startDate, endDate });

      const evidence: Evidence[] = [];

      // Collect AWS CloudTrail IAM changes
      const iamChanges = await this.collectCloudTrailIAMChanges(startDate, endDate);
      evidence.push({
        id: `cloudtrail-iam-${Date.now()}`,
        controlId: 'CC6.1',
        evidenceType: 'access_control',
        source: 'aws_cloudtrail',
        data: { iamChanges },
        collectedAt: new Date(),
        metadata: {
          totalChanges: iamChanges.length,
          period: { startDate, endDate },
        },
      });

      // Collect user login attempts
      const loginAttempts = await this.collectLoginAttempts(startDate, endDate);
      evidence.push({
        id: `logins-${Date.now()}`,
        controlId: 'CC6.2',
        evidenceType: 'access_control',
        source: 'auth_logs',
        data: { loginAttempts },
        collectedAt: new Date(),
        metadata: {
          totalAttempts: loginAttempts.length,
          failedAttempts: loginAttempts.filter((l: any) => !l.success).length,
        },
      });

      // Collect permission grants/revocations
      const permissionChanges = await this.collectPermissionChanges(startDate, endDate);
      evidence.push({
        id: `permissions-${Date.now()}`,
        controlId: 'CC6.3',
        evidenceType: 'access_control',
        source: 'database',
        data: { permissionChanges },
        collectedAt: new Date(),
        metadata: {
          totalChanges: permissionChanges.length,
        },
      });

      // Persist evidence
      for (const item of evidence) {
        await this.persistEvidence(item);
      }

      logger.info('Access control evidence collected', {
        totalItems: evidence.length,
      });

      return evidence;
    } catch (error) {
      logger.error('Access control evidence collection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Collect incident response evidence (CC7.3-7.5)
   */
  async collectIncidentResponseEvidence(
    startDate: Date,
    endDate: Date
  ): Promise<Evidence[]> {
    try {
      logger.info('Collecting incident response evidence', { startDate, endDate });

      const evidence: Evidence[] = [];

      // Collect Sentry errors
      const errors = await this.collectSentryErrors(startDate, endDate);
      evidence.push({
        id: `sentry-errors-${Date.now()}`,
        controlId: 'CC7.3',
        evidenceType: 'incident_response',
        source: 'sentry',
        data: { errors },
        collectedAt: new Date(),
        metadata: {
          totalErrors: errors.length,
          criticalErrors: errors.filter((e: any) => e.level === 'fatal').length,
        },
      });

      // Collect incident tickets
      const incidents = await this.collectIncidentTickets(startDate, endDate);
      evidence.push({
        id: `incidents-${Date.now()}`,
        controlId: 'CC7.4',
        evidenceType: 'incident_response',
        source: 'database',
        data: { incidents },
        collectedAt: new Date(),
        metadata: {
          totalIncidents: incidents.length,
          resolvedIncidents: incidents.filter((i: any) => i.resolved_at).length,
        },
      });

      // Persist evidence
      for (const item of evidence) {
        await this.persistEvidence(item);
      }

      logger.info('Incident response evidence collected', {
        totalItems: evidence.length,
      });

      return evidence;
    } catch (error) {
      logger.error('Incident response evidence collection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Collect vulnerability management evidence (CC7.1)
   */
  async collectVulnerabilityManagementEvidence(): Promise<Evidence[]> {
    try {
      logger.info('Collecting vulnerability management evidence');

      const evidence: Evidence[] = [];

      // Run npm audit
      const npmAuditResults = await this.runNpmAudit();
      evidence.push({
        id: `npm-audit-${Date.now()}`,
        controlId: 'CC7.1',
        evidenceType: 'vulnerability_management',
        source: 'npm_audit',
        data: npmAuditResults,
        collectedAt: new Date(),
        metadata: {
          totalVulnerabilities: npmAuditResults.vulnerabilities?.total || 0,
          criticalVulnerabilities: npmAuditResults.vulnerabilities?.critical || 0,
        },
      });

      // Collect dependency update history
      const dependencyUpdates = await this.collectDependencyUpdates();
      evidence.push({
        id: `dependency-updates-${Date.now()}`,
        controlId: 'CC7.1',
        evidenceType: 'vulnerability_management',
        source: 'github',
        data: { dependencyUpdates },
        collectedAt: new Date(),
        metadata: {
          totalUpdates: dependencyUpdates.length,
        },
      });

      // Persist evidence
      for (const item of evidence) {
        await this.persistEvidence(item);
      }

      logger.info('Vulnerability management evidence collected', {
        totalItems: evidence.length,
      });

      return evidence;
    } catch (error) {
      logger.error('Vulnerability management evidence collection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate evidence package for control
   */
  async generateEvidencePackage(
    controlId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EvidencePackage> {
    try {
      const query = `
        SELECT * FROM compliance_evidence
        WHERE control_id = $1
          AND collected_at >= $2
          AND collected_at <= $3
        ORDER BY collected_at DESC
      `;
      const result = await this.db.query(query, [controlId, startDate, endDate]);

      const evidenceItems: Evidence[] = result.rows.map((row) => ({
        id: row.id,
        controlId: row.control_id,
        evidenceType: row.evidence_type,
        source: row.source,
        data: row.data,
        collectedAt: row.collected_at,
        metadata: row.metadata,
      }));

      return {
        controlId,
        controlName: this.getControlName(controlId),
        evidenceItems,
        generatedAt: new Date(),
        period: { startDate, endDate },
      };
    } catch (error) {
      logger.error('Evidence package generation failed', {
        controlId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private async collectGitHubCommits(startDate: Date, endDate: Date): Promise<any[]> {
    const owner = process.env.GITHUB_REPO_OWNER || '';
    const repo = process.env.GITHUB_REPO_NAME || '';

    const { data: commits } = await this.githubClient.repos.listCommits({
      owner,
      repo,
      since: startDate.toISOString(),
      until: endDate.toISOString(),
      per_page: 100,
    });

    return commits.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author?.name,
      date: commit.commit.author?.date,
      url: commit.html_url,
    }));
  }

  private async collectGitHubPullRequests(startDate: Date, endDate: Date): Promise<any[]> {
    const owner = process.env.GITHUB_REPO_OWNER || '';
    const repo = process.env.GITHUB_REPO_NAME || '';

    const { data: pullRequests } = await this.githubClient.pulls.list({
      owner,
      repo,
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
    });

    return pullRequests
      .filter((pr) => {
        const updatedAt = new Date(pr.updated_at);
        return updatedAt >= startDate && updatedAt <= endDate;
      })
      .map((pr) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        merged_at: pr.merged_at,
        created_at: pr.created_at,
        url: pr.html_url,
      }));
  }

  private async collectDeploymentLogs(startDate: Date, endDate: Date): Promise<any[]> {
    // Mock implementation - integrate with actual CI/CD system
    return [];
  }

  private async collectCloudTrailIAMChanges(
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const input: LookupEventsCommandInput = {
      StartTime: startDate,
      EndTime: endDate,
      LookupAttributes: [
        {
          AttributeKey: 'EventName',
          AttributeValue: 'CreateUser',
        },
      ],
      MaxResults: 50,
    };

    const command = new LookupEventsCommand(input);
    const response = await this.cloudTrailClient.send(command);

    return (response.Events || []).map((event) => ({
      eventId: event.EventId,
      eventName: event.EventName,
      eventTime: event.EventTime,
      username: event.Username,
      resources: event.Resources,
    }));
  }

  private async collectLoginAttempts(startDate: Date, endDate: Date): Promise<any[]> {
    const query = `
      SELECT * FROM audit_logs
      WHERE event_type = 'user.login'
        AND created_at >= $1
        AND created_at <= $2
      ORDER BY created_at DESC
      LIMIT 1000
    `;
    const result = await this.db.query(query, [startDate, endDate]);
    return result.rows;
  }

  private async collectPermissionChanges(startDate: Date, endDate: Date): Promise<any[]> {
    const query = `
      SELECT * FROM audit_logs
      WHERE event_type IN ('permission.granted', 'permission.revoked', 'role.assigned')
        AND created_at >= $1
        AND created_at <= $2
      ORDER BY created_at DESC
    `;
    const result = await this.db.query(query, [startDate, endDate]);
    return result.rows;
  }

  private async collectSentryErrors(startDate: Date, endDate: Date): Promise<any[]> {
    // Mock implementation - integrate with Sentry API
    return [];
  }

  private async collectIncidentTickets(startDate: Date, endDate: Date): Promise<any[]> {
    const query = `
      SELECT * FROM incidents
      WHERE created_at >= $1
        AND created_at <= $2
      ORDER BY created_at DESC
    `;
    const result = await this.db.query(query, [startDate, endDate]);
    return result.rows;
  }

  private async runNpmAudit(): Promise<any> {
    // Mock implementation - run actual npm audit
    return {
      vulnerabilities: {
        total: 0,
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
      },
    };
  }

  private async collectDependencyUpdates(): Promise<any[]> {
    // Mock implementation - track dependency updates from package.json commits
    return [];
  }

  private async persistEvidence(evidence: Evidence): Promise<void> {
    const query = `
      INSERT INTO compliance_evidence (
        id, control_id, evidence_type, source, data, collected_at, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await this.db.query(query, [
      evidence.id,
      evidence.controlId,
      evidence.evidenceType,
      evidence.source,
      JSON.stringify(evidence.data),
      evidence.collectedAt,
      JSON.stringify(evidence.metadata || {}),
    ]);
  }

  private getControlName(controlId: string): string {
    const controlNames: Record<string, string> = {
      'CC6.1': 'Logical and Physical Access Controls',
      'CC6.2': 'Prior to Issuing System Credentials',
      'CC6.3': 'Removes Access',
      'CC7.1': 'Detects and Responds to Security Incidents',
      'CC7.3': 'Evaluates Security Events',
      'CC7.4': 'Responds to Security Incidents',
      'CC7.5': 'Identifies and Responds to Unusual Activity',
      'CC8.1': 'Manages Changes',
    };
    return controlNames[controlId] || controlId;
  }
}
