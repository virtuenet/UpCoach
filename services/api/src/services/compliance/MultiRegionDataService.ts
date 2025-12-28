/**
 * Multi-Region Data Service - Phase 14 Week 4
 * Manages data residency requirements and cross-region data transfers
 */

import { EventEmitter } from 'events';

export type DataRegion = 'US-EAST' | 'US-WEST' | 'EU-CENTRAL' | 'EU-WEST' | 'APAC' | 'LATAM';

export interface DataResidencyRule {
  region: DataRegion;
  countries: string[];
  allowedTransferRegions: DataRegion[];
  requiresUserConsent: boolean;
  storageLocation: string;
  backupLocation: string;
  requiresEncryption: boolean;
  requiresLocalStorage: boolean; // Data must stay in region
  transferMechanism?: 'SCC' | 'BCR' | 'Adequacy' | 'DPA'; // Standard Contractual Clauses, Binding Corporate Rules, etc.
}

export interface DataTransferRequest {
  id: string;
  userId: string;
  fromRegion: DataRegion;
  toRegion: DataRegion;
  dataType: string;
  purpose: string;
  requestDate: Date;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  userConsentGiven: boolean;
  legalBasis: string;
}

export interface RegionalStorageMetadata {
  userId: string;
  primaryRegion: DataRegion;
  replicationRegions: DataRegion[];
  lastSync: Date;
  dataLocation: {
    profile: DataRegion;
    habits: DataRegion;
    goals: DataRegion;
    analytics: DataRegion;
    financialData: DataRegion;
  };
}

export class MultiRegionDataService extends EventEmitter {
  // Data residency rules for each region
  private readonly dataResidencyRules: Map<DataRegion, DataResidencyRule> = new Map([
    [
      'EU-CENTRAL',
      {
        region: 'EU-CENTRAL',
        countries: ['DE', 'AT', 'CH', 'PL', 'CZ', 'SK', 'HU'],
        allowedTransferRegions: ['EU-WEST'], // Can transfer within EU
        requiresUserConsent: false, // Within EU
        storageLocation: 'eu-central-1', // AWS Frankfurt
        backupLocation: 'eu-west-1', // AWS Ireland
        requiresEncryption: true,
        requiresLocalStorage: true, // GDPR data localization
        transferMechanism: 'Adequacy',
      },
    ],
    [
      'EU-WEST',
      {
        region: 'EU-WEST',
        countries: ['GB', 'IE', 'FR', 'ES', 'PT', 'IT', 'NL', 'BE'],
        allowedTransferRegions: ['EU-CENTRAL'],
        requiresUserConsent: false,
        storageLocation: 'eu-west-1', // AWS Ireland
        backupLocation: 'eu-central-1', // AWS Frankfurt
        requiresEncryption: true,
        requiresLocalStorage: true,
        transferMechanism: 'Adequacy',
      },
    ],
    [
      'US-EAST',
      {
        region: 'US-EAST',
        countries: ['US'],
        allowedTransferRegions: ['US-WEST'],
        requiresUserConsent: false, // Domestic transfer
        storageLocation: 'us-east-1', // AWS N. Virginia
        backupLocation: 'us-west-2', // AWS Oregon
        requiresEncryption: true,
        requiresLocalStorage: false,
      },
    ],
    [
      'US-WEST',
      {
        region: 'US-WEST',
        countries: ['US', 'CA'],
        allowedTransferRegions: ['US-EAST'],
        requiresUserConsent: false,
        storageLocation: 'us-west-2', // AWS Oregon
        backupLocation: 'us-east-1', // AWS N. Virginia
        requiresEncryption: true,
        requiresLocalStorage: false,
      },
    ],
    [
      'APAC',
      {
        region: 'APAC',
        countries: ['JP', 'KR', 'SG', 'AU', 'NZ', 'IN', 'CN', 'HK'],
        allowedTransferRegions: [],
        requiresUserConsent: true,
        storageLocation: 'ap-southeast-1', // AWS Singapore
        backupLocation: 'ap-northeast-1', // AWS Tokyo
        requiresEncryption: true,
        requiresLocalStorage: true, // China, India have strict data localization
        transferMechanism: 'SCC',
      },
    ],
    [
      'LATAM',
      {
        region: 'LATAM',
        countries: ['BR', 'AR', 'MX', 'CL', 'CO'],
        allowedTransferRegions: [],
        requiresUserConsent: true,
        storageLocation: 'sa-east-1', // AWS São Paulo
        backupLocation: 'us-east-1', // AWS N. Virginia
        requiresEncryption: true,
        requiresLocalStorage: true, // LGPD requires local storage
        transferMechanism: 'SCC',
      },
    ],
  ]);

  // Country to region mapping
  private readonly countryToRegion: Map<string, DataRegion> = new Map([
    // EU Central
    ['DE', 'EU-CENTRAL'],
    ['AT', 'EU-CENTRAL'],
    ['CH', 'EU-CENTRAL'],
    ['PL', 'EU-CENTRAL'],
    ['CZ', 'EU-CENTRAL'],
    ['SK', 'EU-CENTRAL'],
    ['HU', 'EU-CENTRAL'],

    // EU West
    ['GB', 'EU-WEST'],
    ['IE', 'EU-WEST'],
    ['FR', 'EU-WEST'],
    ['ES', 'EU-WEST'],
    ['PT', 'EU-WEST'],
    ['IT', 'EU-WEST'],
    ['NL', 'EU-WEST'],
    ['BE', 'EU-WEST'],
    ['DK', 'EU-WEST'],
    ['SE', 'EU-WEST'],
    ['NO', 'EU-WEST'],
    ['FI', 'EU-WEST'],

    // US
    ['US', 'US-EAST'],
    ['CA', 'US-WEST'],

    // APAC
    ['JP', 'APAC'],
    ['KR', 'APAC'],
    ['SG', 'APAC'],
    ['AU', 'APAC'],
    ['NZ', 'APAC'],
    ['IN', 'APAC'],
    ['CN', 'APAC'],
    ['HK', 'APAC'],
    ['TW', 'APAC'],
    ['TH', 'APAC'],
    ['VN', 'APAC'],
    ['PH', 'APAC'],
    ['ID', 'APAC'],

    // LATAM
    ['BR', 'LATAM'],
    ['AR', 'LATAM'],
    ['MX', 'LATAM'],
    ['CL', 'LATAM'],
    ['CO', 'LATAM'],
    ['PE', 'LATAM'],
    ['VE', 'LATAM'],
  ]);

  constructor() {
    super();
  }

  /**
   * Get data region for a country
   */
  getDataRegion(countryCode: string): DataRegion | null {
    return this.countryToRegion.get(countryCode.toUpperCase()) || null;
  }

  /**
   * Get data residency rules for a region
   */
  getDataResidencyRules(region: DataRegion): DataResidencyRule | null {
    return this.dataResidencyRules.get(region) || null;
  }

  /**
   * Get storage location for user based on country
   */
  getStorageLocation(countryCode: string): {
    primary: string;
    backup: string;
    region: DataRegion;
  } | null {
    const region = this.getDataRegion(countryCode);

    if (!region) {
      return null;
    }

    const rules = this.getDataResidencyRules(region);

    if (!rules) {
      return null;
    }

    return {
      primary: rules.storageLocation,
      backup: rules.backupLocation,
      region,
    };
  }

  /**
   * Check if data transfer is allowed between regions
   */
  isTransferAllowed(fromRegion: DataRegion, toRegion: DataRegion): boolean {
    if (fromRegion === toRegion) {
      return true;
    }

    const rules = this.getDataResidencyRules(fromRegion);

    if (!rules) {
      return false;
    }

    return rules.allowedTransferRegions.includes(toRegion);
  }

  /**
   * Check if user consent is required for transfer
   */
  isConsentRequiredForTransfer(fromRegion: DataRegion, toRegion: DataRegion): boolean {
    if (fromRegion === toRegion) {
      return false;
    }

    const fromRules = this.getDataResidencyRules(fromRegion);

    if (!fromRules) {
      return true; // Conservative default
    }

    // If transfer is not allowed at all, consent won't help
    if (!this.isTransferAllowed(fromRegion, toRegion)) {
      return true; // Will need special approval
    }

    return fromRules.requiresUserConsent;
  }

  /**
   * Validate data transfer request
   */
  validateTransferRequest(request: DataTransferRequest): {
    valid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if transfer is allowed
    if (!this.isTransferAllowed(request.fromRegion, request.toRegion)) {
      issues.push(
        `Data transfer from ${request.fromRegion} to ${request.toRegion} is not permitted without special authorization`
      );
    }

    // Check consent requirement
    if (this.isConsentRequiredForTransfer(request.fromRegion, request.toRegion)) {
      if (!request.userConsentGiven) {
        issues.push('User consent is required for this data transfer');
      }

      recommendations.push(
        'Ensure user is informed about the transfer and its implications'
      );
    }

    // Check legal basis
    const fromRules = this.getDataResidencyRules(request.fromRegion);
    if (fromRules?.transferMechanism) {
      recommendations.push(
        `Use ${fromRules.transferMechanism} as legal mechanism for transfer`
      );

      if (!request.legalBasis) {
        issues.push('Legal basis for transfer must be documented');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Get recommended replication regions for disaster recovery
   */
  getReplicationRegions(primaryRegion: DataRegion): DataRegion[] {
    const rules = this.getDataResidencyRules(primaryRegion);

    if (!rules) {
      return [];
    }

    // Only replicate to allowed transfer regions
    return rules.allowedTransferRegions.filter(region => {
      const targetRules = this.getDataResidencyRules(region);
      // Ensure target region also allows receiving data
      return targetRules?.allowedTransferRegions.includes(primaryRegion);
    });
  }

  /**
   * Check if local storage is required
   */
  requiresLocalStorage(countryCode: string): boolean {
    const region = this.getDataRegion(countryCode);

    if (!region) {
      return false;
    }

    const rules = this.getDataResidencyRules(region);
    return rules?.requiresLocalStorage || false;
  }

  /**
   * Get encryption requirements
   */
  getEncryptionRequirements(countryCode: string): {
    required: boolean;
    atRest: boolean;
    inTransit: boolean;
    keyManagement: string;
  } {
    const region = this.getDataRegion(countryCode);

    if (!region) {
      return {
        required: true,
        atRest: true,
        inTransit: true,
        keyManagement: 'AES-256',
      };
    }

    const rules = this.getDataResidencyRules(region);

    return {
      required: rules?.requiresEncryption || true,
      atRest: true, // Always encrypt at rest
      inTransit: true, // Always encrypt in transit
      keyManagement: 'AES-256', // Industry standard
    };
  }

  /**
   * Generate data residency report
   */
  generateResidencyReport(userId: string, metadata: RegionalStorageMetadata): {
    compliant: boolean;
    primaryRegion: DataRegion;
    dataLocations: Array<{
      dataType: string;
      region: DataRegion;
      location: string;
      compliant: boolean;
      issue?: string;
    }>;
    transferHistory: Array<{
      from: DataRegion;
      to: DataRegion;
      allowed: boolean;
      consentRequired: boolean;
      consentGiven: boolean;
    }>;
  } {
    const primaryRegion = metadata.primaryRegion;
    const primaryRules = this.getDataResidencyRules(primaryRegion);

    const dataLocations: Array<{
      dataType: string;
      region: DataRegion;
      location: string;
      compliant: boolean;
      issue?: string;
    }> = [];

    // Check each data type location
    for (const [dataType, region] of Object.entries(metadata.dataLocation)) {
      const rules = this.getDataResidencyRules(region);
      const location = rules?.storageLocation || 'unknown';

      let compliant = true;
      let issue: string | undefined;

      // Check if data is in correct region
      if (region !== primaryRegion) {
        if (!this.isTransferAllowed(primaryRegion, region)) {
          compliant = false;
          issue = `${dataType} should be stored in ${primaryRegion} but found in ${region}`;
        }
      }

      dataLocations.push({
        dataType,
        region,
        location,
        compliant,
        issue,
      });
    }

    // Check replication compliance
    const transferHistory: Array<{
      from: DataRegion;
      to: DataRegion;
      allowed: boolean;
      consentRequired: boolean;
      consentGiven: boolean;
    }> = [];

    for (const replicationRegion of metadata.replicationRegions) {
      transferHistory.push({
        from: primaryRegion,
        to: replicationRegion,
        allowed: this.isTransferAllowed(primaryRegion, replicationRegion),
        consentRequired: this.isConsentRequiredForTransfer(primaryRegion, replicationRegion),
        consentGiven: true, // Would check actual consent records
      });
    }

    const compliant =
      dataLocations.every(d => d.compliant) &&
      transferHistory.every(t => t.allowed && (!t.consentRequired || t.consentGiven));

    return {
      compliant,
      primaryRegion,
      dataLocations,
      transferHistory,
    };
  }

  /**
   * Get data retention requirements for region
   */
  getDataRetentionRequirements(region: DataRegion): {
    maxRetentionDays: number;
    purgePolicy: string;
    backupRetentionDays: number;
  } {
    // Different regions have different requirements
    const regionRequirements: Record<DataRegion, {
      maxRetentionDays: number;
      purgePolicy: string;
      backupRetentionDays: number;
    }> = {
      'EU-CENTRAL': {
        maxRetentionDays: 2555, // 7 years (GDPR)
        purgePolicy: 'automatic',
        backupRetentionDays: 90,
      },
      'EU-WEST': {
        maxRetentionDays: 2555, // 7 years (GDPR)
        purgePolicy: 'automatic',
        backupRetentionDays: 90,
      },
      'US-EAST': {
        maxRetentionDays: 2555, // 7 years (business records)
        purgePolicy: 'manual',
        backupRetentionDays: 180,
      },
      'US-WEST': {
        maxRetentionDays: 365, // 1 year (CCPA reasonable period)
        purgePolicy: 'automatic',
        backupRetentionDays: 90,
      },
      'APAC': {
        maxRetentionDays: 1825, // 5 years (varies by country)
        purgePolicy: 'manual',
        backupRetentionDays: 90,
      },
      'LATAM': {
        maxRetentionDays: 1825, // 5 years (LGPD)
        purgePolicy: 'automatic',
        backupRetentionDays: 90,
      },
    };

    return regionRequirements[region] || {
      maxRetentionDays: 365,
      purgePolicy: 'manual',
      backupRetentionDays: 90,
    };
  }

  /**
   * Calculate data transfer cost estimate
   */
  estimateTransferCost(
    dataSize: number, // in GB
    fromRegion: DataRegion,
    toRegion: DataRegion
  ): {
    allowed: boolean;
    estimatedCost: number;
    currency: string;
    breakdown: {
      egress: number;
      ingress: number;
      processing: number;
    };
  } {
    if (!this.isTransferAllowed(fromRegion, toRegion)) {
      return {
        allowed: false,
        estimatedCost: 0,
        currency: 'USD',
        breakdown: { egress: 0, ingress: 0, processing: 0 },
      };
    }

    // Simplified AWS data transfer pricing (approximate)
    const egressCostPerGB = 0.09; // Inter-region egress
    const ingressCost = 0; // Ingress is free
    const processingCostPerGB = 0.01; // Encryption/decryption

    const egress = dataSize * egressCostPerGB;
    const ingress = 0;
    const processing = dataSize * processingCostPerGB;

    return {
      allowed: true,
      estimatedCost: egress + ingress + processing,
      currency: 'USD',
      breakdown: {
        egress,
        ingress,
        processing,
      },
    };
  }

  /**
   * Get all supported regions
   */
  getSupportedRegions(): DataRegion[] {
    return Array.from(this.dataResidencyRules.keys());
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    supportedRegions: number;
    supportedCountries: number;
    regionsWithLocalStorageRequirement: number;
    crossRegionTransfersAllowed: number;
  } {
    const regions = this.getSupportedRegions();

    let crossRegionTransfersAllowed = 0;
    for (const region of regions) {
      const rules = this.getDataResidencyRules(region);
      if (rules && rules.allowedTransferRegions.length > 0) {
        crossRegionTransfersAllowed++;
      }
    }

    const regionsWithLocalStorageRequirement = regions.filter(region => {
      const rules = this.getDataResidencyRules(region);
      return rules?.requiresLocalStorage;
    }).length;

    return {
      supportedRegions: regions.length,
      supportedCountries: this.countryToRegion.size,
      regionsWithLocalStorageRequirement,
      crossRegionTransfersAllowed,
    };
  }
}

// Singleton instance
export const multiRegionDataService = new MultiRegionDataService();
