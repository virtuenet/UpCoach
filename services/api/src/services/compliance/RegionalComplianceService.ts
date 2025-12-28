/**
 * Regional Compliance Service - Phase 14 Week 4
 * Manages GDPR, CCPA, LGPD, and other regional data protection compliance
 */

import { EventEmitter } from 'events';

export type DataProtectionRegion = 'EU' | 'US-CA' | 'BR' | 'UK' | 'CH' | 'OTHER';

export type ConsentType =
  | 'essential'
  | 'analytics'
  | 'marketing'
  | 'personalization'
  | 'third_party_sharing';

export interface RegionalRequirement {
  region: DataProtectionRegion;
  law: string; // GDPR, CCPA, LGPD, etc.
  requiredConsents: ConsentType[];
  optInRequired: boolean; // True for GDPR, False for CCPA (opt-out)
  dataRetentionMaxDays: number;
  rightToAccess: boolean;
  rightToDelete: boolean;
  rightToPortability: boolean;
  rightToRectification: boolean;
  rightToRestriction: boolean;
  rightToObject: boolean;
  dataBreachNotificationHours: number;
  dpoRequired: boolean; // Data Protection Officer
  privacyPolicyRequired: boolean;
  cookieConsentRequired: boolean;
  minimumAge: number;
  parentalConsentAge: number;
}

export interface UserConsent {
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  explicitConsent: boolean; // True if user explicitly opted in/out
  purpose: string;
  version: string; // Version of privacy policy
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  requestType: 'access' | 'delete' | 'portability' | 'rectification' | 'restriction' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDate: Date;
  completionDate?: Date;
  region: DataProtectionRegion;
  notes?: string;
}

export class RegionalComplianceService extends EventEmitter {
  // Regional requirements based on major data protection laws
  private readonly regionalRequirements: Map<DataProtectionRegion, RegionalRequirement> = new Map([
    [
      'EU',
      {
        region: 'EU',
        law: 'GDPR (General Data Protection Regulation)',
        requiredConsents: ['essential', 'analytics', 'marketing', 'personalization', 'third_party_sharing'],
        optInRequired: true,
        dataRetentionMaxDays: 2555, // 7 years (business records)
        rightToAccess: true,
        rightToDelete: true,
        rightToPortability: true,
        rightToRectification: true,
        rightToRestriction: true,
        rightToObject: true,
        dataBreachNotificationHours: 72,
        dpoRequired: true,
        privacyPolicyRequired: true,
        cookieConsentRequired: true,
        minimumAge: 16,
        parentalConsentAge: 16,
      },
    ],
    [
      'US-CA',
      {
        region: 'US-CA',
        law: 'CCPA (California Consumer Privacy Act)',
        requiredConsents: ['essential', 'analytics', 'marketing', 'third_party_sharing'],
        optInRequired: false, // Opt-out model
        dataRetentionMaxDays: 365, // Reasonable period
        rightToAccess: true,
        rightToDelete: true,
        rightToPortability: true,
        rightToRectification: false,
        rightToRestriction: false,
        rightToObject: true,
        dataBreachNotificationHours: 0, // No specific requirement
        dpoRequired: false,
        privacyPolicyRequired: true,
        cookieConsentRequired: false,
        minimumAge: 13,
        parentalConsentAge: 13,
      },
    ],
    [
      'BR',
      {
        region: 'BR',
        law: 'LGPD (Lei Geral de Proteção de Dados)',
        requiredConsents: ['essential', 'analytics', 'marketing', 'personalization', 'third_party_sharing'],
        optInRequired: true,
        dataRetentionMaxDays: 1825, // 5 years
        rightToAccess: true,
        rightToDelete: true,
        rightToPortability: true,
        rightToRectification: true,
        rightToRestriction: false,
        rightToObject: true,
        dataBreachNotificationHours: 72,
        dpoRequired: true,
        privacyPolicyRequired: true,
        cookieConsentRequired: true,
        minimumAge: 18,
        parentalConsentAge: 18,
      },
    ],
    [
      'UK',
      {
        region: 'UK',
        law: 'UK GDPR (United Kingdom General Data Protection Regulation)',
        requiredConsents: ['essential', 'analytics', 'marketing', 'personalization', 'third_party_sharing'],
        optInRequired: true,
        dataRetentionMaxDays: 2555, // 7 years
        rightToAccess: true,
        rightToDelete: true,
        rightToPortability: true,
        rightToRectification: true,
        rightToRestriction: true,
        rightToObject: true,
        dataBreachNotificationHours: 72,
        dpoRequired: true,
        privacyPolicyRequired: true,
        cookieConsentRequired: true,
        minimumAge: 13,
        parentalConsentAge: 13,
      },
    ],
    [
      'CH',
      {
        region: 'CH',
        law: 'FADP (Swiss Federal Act on Data Protection)',
        requiredConsents: ['essential', 'analytics', 'marketing', 'personalization', 'third_party_sharing'],
        optInRequired: true,
        dataRetentionMaxDays: 1825, // 5 years
        rightToAccess: true,
        rightToDelete: true,
        rightToPortability: true,
        rightToRectification: true,
        rightToRestriction: true,
        rightToObject: true,
        dataBreachNotificationHours: 72,
        dpoRequired: false,
        privacyPolicyRequired: true,
        cookieConsentRequired: true,
        minimumAge: 16,
        parentalConsentAge: 16,
      },
    ],
  ]);

  // Country to region mapping
  private readonly countryToRegion: Map<string, DataProtectionRegion> = new Map([
    // EU Countries
    ['AT', 'EU'], ['BE', 'EU'], ['BG', 'EU'], ['HR', 'EU'], ['CY', 'EU'],
    ['CZ', 'EU'], ['DK', 'EU'], ['EE', 'EU'], ['FI', 'EU'], ['FR', 'EU'],
    ['DE', 'EU'], ['GR', 'EU'], ['HU', 'EU'], ['IE', 'EU'], ['IT', 'EU'],
    ['LV', 'EU'], ['LT', 'EU'], ['LU', 'EU'], ['MT', 'EU'], ['NL', 'EU'],
    ['PL', 'EU'], ['PT', 'EU'], ['RO', 'EU'], ['SK', 'EU'], ['SI', 'EU'],
    ['ES', 'EU'], ['SE', 'EU'],

    // United Kingdom
    ['GB', 'UK'],

    // Switzerland
    ['CH', 'CH'],

    // Brazil
    ['BR', 'BR'],

    // United States (California)
    // Note: In production, you'd detect state, not just country
  ]);

  constructor() {
    super();
  }

  /**
   * Get regional requirements for a country/region
   */
  getRequirements(countryCode: string, stateCode?: string): RegionalRequirement | null {
    // Special case for California
    if (countryCode === 'US' && stateCode === 'CA') {
      return this.regionalRequirements.get('US-CA') || null;
    }

    const region = this.countryToRegion.get(countryCode);
    if (!region) {
      return null;
    }

    return this.regionalRequirements.get(region) || null;
  }

  /**
   * Get required consent types for a region
   */
  getRequiredConsents(countryCode: string, stateCode?: string): ConsentType[] {
    const requirements = this.getRequirements(countryCode, stateCode);
    return requirements?.requiredConsents || ['essential'];
  }

  /**
   * Check if opt-in consent is required
   */
  isOptInRequired(countryCode: string, stateCode?: string): boolean {
    const requirements = this.getRequirements(countryCode, stateCode);
    return requirements?.optInRequired || false;
  }

  /**
   * Get data retention maximum period
   */
  getDataRetentionDays(countryCode: string, stateCode?: string): number {
    const requirements = this.getRequirements(countryCode, stateCode);
    return requirements?.dataRetentionMaxDays || 365;
  }

  /**
   * Check if user has granted all required consents
   */
  hasRequiredConsents(
    userConsents: UserConsent[],
    countryCode: string,
    stateCode?: string
  ): boolean {
    const requiredConsents = this.getRequiredConsents(countryCode, stateCode);
    const isOptInRequired = this.isOptInRequired(countryCode, stateCode);

    // Essential consent is always required
    const hasEssential = userConsents.some(
      c => c.consentType === 'essential' && c.granted
    );

    if (!hasEssential) {
      return false;
    }

    // For opt-in regions (GDPR), all non-essential consents must be explicitly granted or denied
    if (isOptInRequired) {
      for (const consentType of requiredConsents) {
        if (consentType === 'essential') continue;

        const consent = userConsents.find(c => c.consentType === consentType);
        if (!consent || !consent.explicitConsent) {
          return false; // Missing explicit consent
        }
      }
    }

    return true;
  }

  /**
   * Validate consent record
   */
  validateConsent(consent: UserConsent, countryCode: string, stateCode?: string): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const requirements = this.getRequirements(countryCode, stateCode);

    // Check if explicit consent is required
    if (requirements?.optInRequired && !consent.explicitConsent) {
      issues.push('Explicit consent is required in this region');
    }

    // Check if consent is not too old
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
    const age = Date.now() - consent.timestamp.getTime();

    if (age > maxAge) {
      issues.push('Consent is older than 1 year and should be refreshed');
    }

    // Check if required fields are present
    if (!consent.purpose) {
      issues.push('Consent purpose is required');
    }

    if (!consent.version) {
      issues.push('Privacy policy version is required');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Check if user can process data subject request
   */
  canProcessRequest(
    requestType: DataSubjectRequest['requestType'],
    countryCode: string,
    stateCode?: string
  ): boolean {
    const requirements = this.getRequirements(countryCode, stateCode);

    if (!requirements) {
      return false;
    }

    switch (requestType) {
      case 'access':
        return requirements.rightToAccess;
      case 'delete':
        return requirements.rightToDelete;
      case 'portability':
        return requirements.rightToPortability;
      case 'rectification':
        return requirements.rightToRectification;
      case 'restriction':
        return requirements.rightToRestriction;
      case 'objection':
        return requirements.rightToObject;
      default:
        return false;
    }
  }

  /**
   * Get response deadline for data subject request (in days)
   */
  getResponseDeadline(countryCode: string, stateCode?: string): number {
    const requirements = this.getRequirements(countryCode, stateCode);

    if (!requirements) {
      return 30; // Default
    }

    // GDPR: 30 days
    if (requirements.region === 'EU' || requirements.region === 'UK') {
      return 30;
    }

    // CCPA: 45 days
    if (requirements.region === 'US-CA') {
      return 45;
    }

    // LGPD: 15 days
    if (requirements.region === 'BR') {
      return 15;
    }

    return 30;
  }

  /**
   * Check if data breach notification is required
   */
  isDataBreachNotificationRequired(
    affectedUsers: number,
    countryCode: string,
    stateCode?: string
  ): boolean {
    const requirements = this.getRequirements(countryCode, stateCode);

    if (!requirements) {
      return affectedUsers > 500; // Conservative default
    }

    // GDPR/UK GDPR: Always required if personal data is compromised
    if (requirements.region === 'EU' || requirements.region === 'UK') {
      return true;
    }

    // CCPA: Required if affects 500+ California residents
    if (requirements.region === 'US-CA') {
      return affectedUsers >= 500;
    }

    // LGPD: Always required
    if (requirements.region === 'BR') {
      return true;
    }

    return affectedUsers > 500;
  }

  /**
   * Get data breach notification deadline (in hours)
   */
  getDataBreachNotificationDeadline(countryCode: string, stateCode?: string): number {
    const requirements = this.getRequirements(countryCode, stateCode);
    return requirements?.dataBreachNotificationHours || 72;
  }

  /**
   * Check if DPO (Data Protection Officer) is required
   */
  isDPORequired(countryCode: string, stateCode?: string): boolean {
    const requirements = this.getRequirements(countryCode, stateCode);
    return requirements?.dpoRequired || false;
  }

  /**
   * Check if cookie consent banner is required
   */
  isCookieConsentRequired(countryCode: string, stateCode?: string): boolean {
    const requirements = this.getRequirements(countryCode, stateCode);
    return requirements?.cookieConsentRequired || false;
  }

  /**
   * Get minimum age for service usage
   */
  getMinimumAge(countryCode: string, stateCode?: string): number {
    const requirements = this.getRequirements(countryCode, stateCode);
    return requirements?.minimumAge || 13;
  }

  /**
   * Check if parental consent is required for user age
   */
  isParentalConsentRequired(
    userAge: number,
    countryCode: string,
    stateCode?: string
  ): boolean {
    const requirements = this.getRequirements(countryCode, stateCode);
    const parentalConsentAge = requirements?.parentalConsentAge || 13;
    return userAge < parentalConsentAge;
  }

  /**
   * Generate compliance checklist for a region
   */
  getComplianceChecklist(countryCode: string, stateCode?: string): {
    law: string;
    items: Array<{ requirement: string; required: boolean; description: string }>;
  } {
    const requirements = this.getRequirements(countryCode, stateCode);

    if (!requirements) {
      return {
        law: 'No specific regulation',
        items: [
          {
            requirement: 'Privacy Policy',
            required: true,
            description: 'Maintain a clear privacy policy',
          },
        ],
      };
    }

    const items: Array<{ requirement: string; required: boolean; description: string }> = [];

    items.push({
      requirement: 'Privacy Policy',
      required: requirements.privacyPolicyRequired,
      description: 'Publish comprehensive privacy policy',
    });

    items.push({
      requirement: 'Cookie Consent',
      required: requirements.cookieConsentRequired,
      description: 'Implement cookie consent banner',
    });

    items.push({
      requirement: 'Data Protection Officer',
      required: requirements.dpoRequired,
      description: 'Appoint a Data Protection Officer',
    });

    items.push({
      requirement: 'Consent Management',
      required: requirements.optInRequired,
      description: requirements.optInRequired
        ? 'Obtain explicit opt-in consent for data processing'
        : 'Provide opt-out mechanism for data sharing',
    });

    items.push({
      requirement: 'Data Retention Policy',
      required: true,
      description: `Implement ${requirements.dataRetentionMaxDays}-day retention limit`,
    });

    items.push({
      requirement: 'Right to Access',
      required: requirements.rightToAccess,
      description: 'Provide user data export functionality',
    });

    items.push({
      requirement: 'Right to Delete',
      required: requirements.rightToDelete,
      description: 'Implement account deletion functionality',
    });

    items.push({
      requirement: 'Right to Portability',
      required: requirements.rightToPortability,
      description: 'Enable data export in machine-readable format',
    });

    items.push({
      requirement: 'Data Breach Response',
      required: requirements.dataBreachNotificationHours > 0,
      description: `Notify within ${requirements.dataBreachNotificationHours} hours of breach`,
    });

    items.push({
      requirement: 'Age Verification',
      required: true,
      description: `Verify users are at least ${requirements.minimumAge} years old`,
    });

    return {
      law: requirements.law,
      items,
    };
  }

  /**
   * Get all supported regions
   */
  getSupportedRegions(): DataProtectionRegion[] {
    return Array.from(this.regionalRequirements.keys());
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    supportedRegions: number;
    supportedCountries: number;
    strictestRetentionDays: number;
    fastestBreachNotificationHours: number;
  } {
    const requirements = Array.from(this.regionalRequirements.values());

    return {
      supportedRegions: this.regionalRequirements.size,
      supportedCountries: this.countryToRegion.size,
      strictestRetentionDays: Math.min(...requirements.map(r => r.dataRetentionMaxDays)),
      fastestBreachNotificationHours: Math.min(
        ...requirements.map(r => r.dataBreachNotificationHours).filter(h => h > 0)
      ),
    };
  }
}

// Singleton instance
export const regionalComplianceService = new RegionalComplianceService();
