/**
 * Compliance Services Index
 *
 * Centralized exports for GDPR, HIPAA, and CCPA compliance services.
 * These services handle regulatory requirements, data subject requests,
 * audit logging, and compliance reporting.
 */

// GDPR Compliance Service
export {
  GDPRComplianceService,
  getGDPRComplianceService,
  type DSARType,
  type DSARStatus,
  type LawfulBasis,
  type DataSubjectRequest,
  type ProcessingRecord,
  type DPIA,
  type DPIARisk,
  type DataBreach,
  type BreachNotification,
  type GDPRStats,
  type GDPRComplianceConfig,
} from './GDPRComplianceService';

// HIPAA Compliance Service
export {
  HIPAAComplianceService,
  getHIPAAComplianceService,
  type PHICategory,
  type AccessType,
  type IncidentSeverity,
  type PHIAccessLog,
  type AccessControl,
  type BusinessAssociateAgreement,
  type SecurityIncident,
  type RiskAssessment,
  type TrainingRecord,
  type HIPAAStats,
  type HIPAAComplianceConfig,
} from './HIPAAComplianceService';

// CCPA Compliance Service
export {
  CCPAComplianceService,
  getCCPAComplianceService,
  type CCPARequestType,
  type CCPARequestStatus,
  type PICategory,
  type BusinessPurpose,
  type SaleShareStatus,
  type CCPARequest,
  type AuthorizedAgent,
  type PIDisclosure,
  type PISource,
  type ThirdPartyDisclosure,
  type DoNotSellRecord,
  type OptOutHistoryEntry,
  type ServiceProviderAgreement,
  type FinancialIncentive,
  type PrivacyNotice,
  type PrivacyNoticeSection,
  type CCPAStats,
  type CCPAComplianceConfig,
} from './CCPAComplianceService';

// Initialize all compliance services
export function initializeCompliance(): {
  gdpr: InstanceType<typeof GDPRComplianceService>;
  hipaa: InstanceType<typeof HIPAAComplianceService>;
  ccpa: InstanceType<typeof CCPAComplianceService>;
} {
  const gdpr = getGDPRComplianceService();
  const hipaa = getHIPAAComplianceService();
  const ccpa = getCCPAComplianceService();

  console.log('Compliance services initialized');

  return { gdpr, hipaa, ccpa };
}

// Unified compliance check
export interface ComplianceCheckResult {
  gdpr: {
    compliant: boolean;
    issues: string[];
    stats: GDPRStats;
  };
  hipaa: {
    compliant: boolean;
    issues: string[];
    stats: HIPAAStats;
  };
  ccpa: {
    compliant: boolean;
    issues: string[];
    stats: CCPAStats;
  };
  overallCompliant: boolean;
  recommendations: string[];
}

/**
 * Run comprehensive compliance check across all frameworks
 */
export async function runComplianceCheck(): Promise<ComplianceCheckResult> {
  const gdpr = getGDPRComplianceService();
  const hipaa = getHIPAAComplianceService();
  const ccpa = getCCPAComplianceService();

  const gdprStats = gdpr.getComplianceStats();
  const hipaaStats = hipaa.getComplianceStats();
  const ccpaStats = ccpa.getComplianceStats();

  const gdprIssues: string[] = [];
  const hipaaIssues: string[] = [];
  const ccpaIssues: string[] = [];
  const recommendations: string[] = [];

  // GDPR checks
  if (gdprStats.overdueDSARs > 0) {
    gdprIssues.push(`${gdprStats.overdueDSARs} overdue data subject requests`);
    recommendations.push('Address overdue GDPR data subject requests immediately');
  }
  if (gdprStats.breachesPending > 0) {
    gdprIssues.push(`${gdprStats.breachesPending} pending data breach notifications`);
    recommendations.push('Complete pending breach notifications within 72 hours');
  }

  // HIPAA checks
  if (hipaaStats.overdueIncidents > 0) {
    hipaaIssues.push(`${hipaaStats.overdueIncidents} unresolved security incidents`);
    recommendations.push('Resolve outstanding HIPAA security incidents');
  }
  if (hipaaStats.expiredTraining > 0) {
    hipaaIssues.push(`${hipaaStats.expiredTraining} employees with expired training`);
    recommendations.push('Schedule HIPAA training for employees with expired certifications');
  }

  // CCPA checks
  if (ccpaStats.overdueRequests > 0) {
    ccpaIssues.push(`${ccpaStats.overdueRequests} overdue consumer requests`);
    recommendations.push('Process overdue CCPA consumer requests');
  }
  if (ccpaStats.gpcSignalCompliance < 1) {
    ccpaIssues.push('GPC signal not being honored');
    recommendations.push('Enable Global Privacy Control signal handling');
  }

  const gdprCompliant = gdprIssues.length === 0;
  const hipaaCompliant = hipaaIssues.length === 0;
  const ccpaCompliant = ccpaIssues.length === 0;

  return {
    gdpr: {
      compliant: gdprCompliant,
      issues: gdprIssues,
      stats: gdprStats,
    },
    hipaa: {
      compliant: hipaaCompliant,
      issues: hipaaIssues,
      stats: hipaaStats,
    },
    ccpa: {
      compliant: ccpaCompliant,
      issues: ccpaIssues,
      stats: ccpaStats,
    },
    overallCompliant: gdprCompliant && hipaaCompliant && ccpaCompliant,
    recommendations,
  };
}

// Type guard for GDPRStats
import type { GDPRStats } from './GDPRComplianceService';
import type { HIPAAStats } from './HIPAAComplianceService';
import type { CCPAStats } from './CCPAComplianceService';
