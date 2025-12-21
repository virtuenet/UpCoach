/**
 * Security Services Index
 *
 * Centralized exports for authentication, authorization, session management,
 * API key handling, and other security-related services.
 */

// MFA Service
export {
  MFAService,
  getMFAService,
  type MFAMethod,
  type MFAStatus,
  type TOTPConfig,
  type WebAuthnCredential,
  type UserMFASettings,
  type TrustedDevice,
  type MFAChallenge,
  type WebAuthnRegistrationOptions,
  type WebAuthnAuthOptions,
  type MFAServiceConfig,
  type MFAStats,
} from './MFAService';

// Session Manager
export {
  SessionManager,
  getSessionManager,
  type SessionStatus,
  type DeviceType,
  type DeviceFingerprint,
  type Session,
  type SessionLocation,
  type SessionActivity,
  type SuspiciousActivityAlert,
  type SuspiciousActivityType,
  type SessionManagerConfig,
  type SessionStats,
} from './SessionManager';

// RBAC Service
export {
  RBACService,
  getRBACService,
  type PermissionAction,
  type ResourceType,
  type Permission,
  type PermissionCondition,
  type Role,
  type UserRoleAssignment,
  type ResourcePolicy,
  type AccessRequest,
  type AccessDecision,
  type RBACStats,
} from './RBACService';

// API Key Manager
export {
  APIKeyManager,
  getAPIKeyManager,
  type APIKeyType,
  type APIKeyStatus,
  type APIKeyScope,
  type APIKey,
  type RateLimitConfig,
  type APIKeyUsage,
  type APIKeyValidationResult,
  type APIKeyStats,
  type APIKeyManagerConfig,
} from './APIKeyManager';

// Encryption Service
export {
  EncryptionService,
  getEncryptionService,
  type EncryptionAlgorithm,
  type KeyType,
  type EncryptionKey,
  type EncryptedData,
  type EncryptionOptions,
  type FieldEncryptionConfig,
  type EncryptionStats,
  type EncryptionServiceConfig,
} from './EncryptionService';

// PII Redaction Service
export {
  PIIRedactionService,
  getPIIRedactionService,
  type PIIType,
  type RedactionStrategy,
  type PIIMatch,
  type RedactionResult,
  type PIIPattern,
  type RedactionConfig,
  type PIIRedactionConfig,
  type RedactionStats,
} from './PIIRedactionService';

// Consent Management Service
export {
  ConsentManagementService,
  getConsentManagementService,
  type ConsentType,
  type ConsentStatus,
  type ConsentSource,
  type ConsentRecord,
  type ConsentPreferences,
  type ConsentPurpose,
  type ConsentRequest,
  type ConsentProof,
  type ConsentAuditEntry,
  type ConsentStats,
  type ConsentManagementConfig,
} from './ConsentManagementService';

// Data Retention Service
export {
  DataRetentionService,
  getDataRetentionService,
  type DataCategory,
  type RetentionAction,
  type LegalHoldStatus,
  type RetentionPolicy,
  type DataItem,
  type LegalHold,
  type DeletionRequest,
  type ArchiveJob,
  type RetentionStats,
  type DataRetentionConfig,
} from './DataRetentionService';

// Threat Detection Service
export {
  ThreatDetectionService,
  getThreatDetectionService,
  type ThreatType,
  type ThreatSeverity,
  type ThreatStatus,
  type ThreatEvent,
  type ThreatIndicator,
  type IPReputation,
  type RateLimitState,
  type BehavioralBaseline,
  type ThreatRule,
  type RuleCondition,
  type RuleAction,
  type ThreatDetectionStats,
  type ThreatDetectionConfig,
} from './ThreatDetectionService';

// Security Audit Service
export {
  SecurityAuditService,
  getSecurityAuditService,
  type AuditEventType,
  type AuditSeverity,
  type AuditEvent,
  type AuditActor,
  type AuditTarget,
  type AuditContext,
  type AuditQuery,
  type AuditReport,
  type AuditStats,
  type RetentionPolicy as AuditRetentionPolicy,
  type SecurityAuditConfig,
} from './SecurityAuditService';

// Initialize all security services
export function initializeSecurity(): {
  mfa: InstanceType<typeof MFAService>;
  sessions: InstanceType<typeof SessionManager>;
  rbac: InstanceType<typeof RBACService>;
  apiKeys: InstanceType<typeof APIKeyManager>;
  encryption: InstanceType<typeof EncryptionService>;
  piiRedaction: InstanceType<typeof PIIRedactionService>;
  consent: InstanceType<typeof ConsentManagementService>;
  dataRetention: InstanceType<typeof DataRetentionService>;
  threatDetection: InstanceType<typeof ThreatDetectionService>;
  securityAudit: InstanceType<typeof SecurityAuditService>;
} {
  const { getMFAService } = require('./MFAService');
  const { getSessionManager } = require('./SessionManager');
  const { getRBACService } = require('./RBACService');
  const { getAPIKeyManager } = require('./APIKeyManager');
  const { getEncryptionService } = require('./EncryptionService');
  const { getPIIRedactionService } = require('./PIIRedactionService');
  const { getConsentManagementService } = require('./ConsentManagementService');
  const { getDataRetentionService } = require('./DataRetentionService');
  const { getThreatDetectionService } = require('./ThreatDetectionService');
  const { getSecurityAuditService } = require('./SecurityAuditService');

  const mfa = getMFAService();
  const sessions = getSessionManager();
  const rbac = getRBACService();
  const apiKeys = getAPIKeyManager();
  const encryption = getEncryptionService();
  const piiRedaction = getPIIRedactionService();
  const consent = getConsentManagementService();
  const dataRetention = getDataRetentionService();
  const threatDetection = getThreatDetectionService();
  const securityAudit = getSecurityAuditService();

  console.log('Security services initialized');

  return {
    mfa,
    sessions,
    rbac,
    apiKeys,
    encryption,
    piiRedaction,
    consent,
    dataRetention,
    threatDetection,
    securityAudit,
  };
}
