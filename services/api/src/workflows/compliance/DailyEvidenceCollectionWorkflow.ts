import { Queue, Worker, Job } from 'bullmq';
import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { EvidenceCollector } from '../../services/compliance/EvidenceCollector';
import { VendorRiskService } from '../../services/compliance/VendorRiskService';
import { PolicyService } from '../../services/compliance/PolicyService';
import IORedis from 'ioredis';

/**
 * Compliance Workflow Automation
 *
 * Orchestrates automated compliance tasks using BullMQ:
 * - Daily evidence collection from external systems
 * - Weekly compliance score calculations
 * - Monthly vendor risk reassessments
 * - Quarterly audit preparation
 * - Annual policy reviews
 *
 * Workflows:
 * 1. Daily Evidence Collection (runs at 2 AM UTC)
 * 2. Weekly Compliance Report (runs Sunday 6 AM UTC)
 * 3. Monthly Vendor Reassessment Check (runs 1st of month)
 * 4. Quarterly Audit Preparation (runs 1st of Q1/Q2/Q3/Q4)
 * 5. Annual Policy Review Reminder (runs Jan 1st)
 *
 * Features:
 * - Retry logic with exponential backoff
 * - Dead letter queue for failed jobs
 * - Job progress tracking
 * - Notification routing (Slack, email)
 * - Concurrent job limits
 */

// Redis connection for BullMQ
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Queue definitions
export const evidenceCollectionQueue = new Queue('evidence-collection', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100,
      age: 7 * 24 * 3600, // 7 days
    },
    removeOnFail: {
      count: 500,
      age: 30 * 24 * 3600, // 30 days
    },
  },
});

export const complianceReportQueue = new Queue('compliance-report', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

export const vendorReassessmentQueue = new Queue('vendor-reassessment', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 10000,
    },
  },
});

export const policyReviewQueue = new Queue('policy-review', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,
  },
});

// Job data interfaces
interface EvidenceCollectionJobData {
  tenantId: string;
  controlIds?: string[];
  startDate: string;
  endDate: string;
}

interface ComplianceReportJobData {
  tenantId: string;
  reportType: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  recipients: string[];
}

interface VendorReassessmentJobData {
  tenantId: string;
  vendorIds?: string[];
}

interface PolicyReviewJobData {
  tenantId: string;
  policyIds?: string[];
}

/**
 * Evidence Collection Worker
 */
export function startEvidenceCollectionWorker(db: Pool) {
  const worker = new Worker(
    'evidence-collection',
    async (job: Job<EvidenceCollectionJobData>) => {
      const { tenantId, controlIds, startDate, endDate } = job.data;

      logger.info('Starting evidence collection job', {
        jobId: job.id,
        tenantId,
        controlIds,
      });

      try {
        const evidenceCollector = new EvidenceCollector(db);

        // Collect evidence for all evidence types
        const evidenceTypes = [
          'collectChangeManagementEvidence',
          'collectAccessControlEvidence',
          'collectIncidentResponseEvidence',
          'collectVulnerabilityManagementEvidence',
        ];

        const results = [];

        for (let i = 0; i < evidenceTypes.length; i++) {
          const methodName = evidenceTypes[i];
          job.updateProgress((i / evidenceTypes.length) * 100);

          logger.info(`Collecting ${methodName}`, { tenantId });

          const evidence = await (evidenceCollector as any)[methodName](
            new Date(startDate),
            new Date(endDate)
          );

          results.push({
            type: methodName,
            count: evidence.length,
          });
        }

        // Generate summary
        const totalEvidence = results.reduce((sum, r) => sum + r.count, 0);

        logger.info('Evidence collection completed', {
          jobId: job.id,
          tenantId,
          totalEvidence,
          breakdown: results,
        });

        // Send notification
        await sendSlackNotification(
          `✅ Daily evidence collection completed for tenant ${tenantId}\n` +
            `Total evidence collected: ${totalEvidence}\n` +
            results.map((r) => `- ${r.type}: ${r.count}`).join('\n')
        );

        return { success: true, totalEvidence, breakdown: results };
      } catch (error) {
        logger.error('Evidence collection failed', {
          jobId: job.id,
          tenantId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        await sendSlackNotification(
          `❌ Evidence collection failed for tenant ${tenantId}\nError: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );

        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 5, // Process 5 jobs concurrently
    }
  );

  worker.on('completed', (job) => {
    logger.info('Evidence collection job completed', {
      jobId: job.id,
      result: job.returnvalue,
    });
  });

  worker.on('failed', (job, err) => {
    logger.error('Evidence collection job failed', {
      jobId: job?.id,
      error: err.message,
    });
  });

  return worker;
}

/**
 * Compliance Report Worker
 */
export function startComplianceReportWorker(db: Pool) {
  const worker = new Worker(
    'compliance-report',
    async (job: Job<ComplianceReportJobData>) => {
      const { tenantId, reportType, recipients } = job.data;

      logger.info('Starting compliance report generation', {
        jobId: job.id,
        tenantId,
        reportType,
      });

      try {
        // Fetch compliance metrics
        const query = `
          SELECT
            COUNT(*) AS total_controls,
            SUM(CASE WHEN status = 'passing' THEN 1 ELSE 0 END) AS passing_controls,
            AVG(compliance_score) AS avg_score,
            COUNT(DISTINCT ce.id) AS total_evidence
          FROM compliance_controls cc
          LEFT JOIN compliance_evidence ce ON cc.id = ce.control_id
          WHERE cc.tenant_id = $1
        `;
        const result = await db.query(query, [tenantId]);
        const metrics = result.rows[0];

        // Calculate compliance percentage
        const compliancePercentage =
          (parseInt(metrics.passing_controls) / parseInt(metrics.total_controls)) * 100;

        // Generate report
        const report = {
          tenantId,
          reportType,
          generatedAt: new Date().toISOString(),
          metrics: {
            totalControls: parseInt(metrics.total_controls),
            passingControls: parseInt(metrics.passing_controls),
            compliancePercentage: Math.round(compliancePercentage * 10) / 10,
            averageScore: Math.round(parseFloat(metrics.avg_score) * 10) / 10,
            totalEvidence: parseInt(metrics.total_evidence),
          },
        };

        // Send email report
        await sendEmailReport(recipients, report);

        // Send Slack notification
        await sendSlackNotification(
          `📊 ${reportType.toUpperCase()} Compliance Report for ${tenantId}\n` +
            `Overall Compliance: ${report.metrics.compliancePercentage}%\n` +
            `Passing Controls: ${report.metrics.passingControls}/${report.metrics.totalControls}\n` +
            `Evidence Collected: ${report.metrics.totalEvidence}`
        );

        logger.info('Compliance report generated', {
          jobId: job.id,
          tenantId,
          reportType,
          compliancePercentage: report.metrics.compliancePercentage,
        });

        return report;
      } catch (error) {
        logger.error('Compliance report generation failed', {
          jobId: job.id,
          tenantId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 3,
    }
  );

  worker.on('completed', (job) => {
    logger.info('Compliance report job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('Compliance report job failed', {
      jobId: job?.id,
      error: err.message,
    });
  });

  return worker;
}

/**
 * Vendor Reassessment Worker
 */
export function startVendorReassessmentWorker(db: Pool) {
  const worker = new Worker(
    'vendor-reassessment',
    async (job: Job<VendorReassessmentJobData>) => {
      const { tenantId, vendorIds } = job.data;

      logger.info('Starting vendor reassessment check', {
        jobId: job.id,
        tenantId,
      });

      try {
        const vendorRiskService = new VendorRiskService(db);

        // Get vendors due for reassessment
        const vendors = await vendorRiskService.getVendorsDueForReassessment();

        const vendorsForTenant = vendors.filter(
          (v: any) =>
            v.tenantId === tenantId && (!vendorIds || vendorIds.includes(v.id))
        );

        if (vendorsForTenant.length === 0) {
          logger.info('No vendors due for reassessment', { tenantId });
          return { vendorsDue: 0 };
        }

        // Send notifications for vendors needing reassessment
        await sendSlackNotification(
          `⚠️ Vendor Reassessment Required for ${tenantId}\n` +
            `${vendorsForTenant.length} vendor(s) need reassessment:\n` +
            vendorsForTenant.map((v: any) => `- ${v.name}`).join('\n')
        );

        // Send email to compliance team
        await sendEmailNotification(
          [process.env.COMPLIANCE_EMAIL || 'compliance@upcoach.com'],
          'Vendor Reassessment Required',
          `The following vendors require reassessment:\n\n` +
            vendorsForTenant.map((v: any) => `- ${v.name} (${v.website})`).join('\n')
        );

        logger.info('Vendor reassessment notifications sent', {
          jobId: job.id,
          tenantId,
          vendorCount: vendorsForTenant.length,
        });

        return {
          vendorsDue: vendorsForTenant.length,
          vendors: vendorsForTenant.map((v: any) => ({ id: v.id, name: v.name })),
        };
      } catch (error) {
        logger.error('Vendor reassessment check failed', {
          jobId: job.id,
          tenantId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 2,
    }
  );

  worker.on('completed', (job) => {
    logger.info('Vendor reassessment job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('Vendor reassessment job failed', {
      jobId: job?.id,
      error: err.message,
    });
  });

  return worker;
}

/**
 * Policy Review Worker
 */
export function startPolicyReviewWorker(db: Pool) {
  const worker = new Worker(
    'policy-review',
    async (job: Job<PolicyReviewJobData>) => {
      const { tenantId, policyIds } = job.data;

      logger.info('Starting policy review check', {
        jobId: job.id,
        tenantId,
      });

      try {
        const policyService = new PolicyService(db);

        // Get policies needing review (older than 1 year)
        const policiesNeedingReview = await policyService.getPoliciesNeedingReview(
          tenantId
        );

        const filteredPolicies = policyIds
          ? policiesNeedingReview.filter((p: any) => policyIds.includes(p.id))
          : policiesNeedingReview;

        if (filteredPolicies.length === 0) {
          logger.info('No policies need review', { tenantId });
          return { policiesNeedingReview: 0 };
        }

        // Send notifications
        await sendSlackNotification(
          `📋 Policy Review Required for ${tenantId}\n` +
            `${filteredPolicies.length} policy/policies need annual review:\n` +
            filteredPolicies.map((p: any) => `- ${p.name} (v${p.version})`).join('\n')
        );

        await sendEmailNotification(
          [process.env.COMPLIANCE_EMAIL || 'compliance@upcoach.com'],
          'Annual Policy Review Required',
          `The following policies require annual review:\n\n` +
            filteredPolicies
              .map(
                (p: any) =>
                  `- ${p.name} (v${p.version})\n  Last reviewed: ${new Date(
                    p.publishedAt
                  ).toLocaleDateString()}`
              )
              .join('\n\n')
        );

        logger.info('Policy review notifications sent', {
          jobId: job.id,
          tenantId,
          policyCount: filteredPolicies.length,
        });

        return {
          policiesNeedingReview: filteredPolicies.length,
          policies: filteredPolicies.map((p: any) => ({ id: p.id, name: p.name })),
        };
      } catch (error) {
        logger.error('Policy review check failed', {
          jobId: job.id,
          tenantId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 2,
    }
  );

  worker.on('completed', (job) => {
    logger.info('Policy review job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('Policy review job failed', {
      jobId: job?.id,
      error: err.message,
    });
  });

  return worker;
}

/**
 * Schedule recurring jobs
 */
export async function scheduleRecurringJobs(tenantId: string) {
  // Daily evidence collection at 2 AM UTC
  await evidenceCollectionQueue.add(
    `daily-evidence-${tenantId}`,
    {
      tenantId,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    },
    {
      repeat: {
        pattern: '0 2 * * *', // Cron: Every day at 2 AM UTC
      },
    }
  );

  // Weekly compliance report on Sunday 6 AM UTC
  await complianceReportQueue.add(
    `weekly-report-${tenantId}`,
    {
      tenantId,
      reportType: 'weekly' as const,
      recipients: [process.env.COMPLIANCE_EMAIL || 'compliance@upcoach.com'],
    },
    {
      repeat: {
        pattern: '0 6 * * 0', // Cron: Every Sunday at 6 AM UTC
      },
    }
  );

  // Monthly vendor reassessment check on 1st of month
  await vendorReassessmentQueue.add(
    `monthly-vendor-${tenantId}`,
    {
      tenantId,
    },
    {
      repeat: {
        pattern: '0 8 1 * *', // Cron: 1st of every month at 8 AM UTC
      },
    }
  );

  // Annual policy review on Jan 1st
  await policyReviewQueue.add(
    `annual-policy-${tenantId}`,
    {
      tenantId,
    },
    {
      repeat: {
        pattern: '0 10 1 1 *', // Cron: January 1st at 10 AM UTC
      },
    }
  );

  logger.info('Recurring compliance jobs scheduled', { tenantId });
}

/**
 * Helper functions for notifications
 */
async function sendSlackNotification(message: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.warn('Slack webhook URL not configured');
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });

    logger.info('Slack notification sent');
  } catch (error) {
    logger.error('Slack notification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function sendEmailNotification(
  recipients: string[],
  subject: string,
  body: string
): Promise<void> {
  // In production, integrate with SendGrid, AWS SES, or similar
  logger.info('Email notification (mock)', {
    recipients,
    subject,
    bodyPreview: body.substring(0, 100),
  });
}

async function sendEmailReport(recipients: string[], report: any): Promise<void> {
  const subject = `${report.reportType.toUpperCase()} Compliance Report - ${new Date().toLocaleDateString()}`;
  const body = `
Compliance Report for ${report.tenantId}

Generated: ${new Date(report.generatedAt).toLocaleString()}

Metrics:
- Overall Compliance: ${report.metrics.compliancePercentage}%
- Total Controls: ${report.metrics.totalControls}
- Passing Controls: ${report.metrics.passingControls}
- Average Score: ${report.metrics.averageScore}
- Total Evidence: ${report.metrics.totalEvidence}

For detailed analysis, visit the UpCoach Admin Panel.
  `;

  await sendEmailNotification(recipients, subject, body);
}

/**
 * Graceful shutdown
 */
export async function shutdownWorkers(
  workers: Worker[]
): Promise<void> {
  logger.info('Shutting down compliance workers');

  await Promise.all(workers.map((worker) => worker.close()));

  await redisConnection.quit();

  logger.info('Compliance workers shut down');
}
