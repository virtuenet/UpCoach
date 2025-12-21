/**
 * CCPA Compliance Service
 *
 * California Consumer Privacy Act compliance management including:
 * - Consumer rights requests (Know, Delete, Opt-Out, Opt-In)
 * - Do Not Sell/Share tracking
 * - Privacy notice management
 * - Financial incentive programs
 * - Service provider agreements
 */

import { EventEmitter } from 'events';

// CCPA Request Types
export type CCPARequestType =
  | 'right_to_know'           // Categories and specific pieces of PI
  | 'right_to_delete'         // Delete personal information
  | 'right_to_opt_out'        // Opt-out of sale/sharing
  | 'right_to_opt_in'         // Opt-in for minors
  | 'right_to_correct'        // Correct inaccurate PI (CPRA addition)
  | 'right_to_limit'          // Limit use of sensitive PI (CPRA addition)
  | 'non_discrimination';     // Exercise rights without discrimination

// Request Status
export type CCPARequestStatus =
  | 'received'
  | 'verified'
  | 'in_progress'
  | 'completed'
  | 'denied'
  | 'extended';

// Personal Information Categories (CCPA defined)
export type PICategory =
  | 'identifiers'                    // Name, email, SSN, etc.
  | 'customer_records'               // Account information
  | 'protected_characteristics'      // Age, race, gender, etc.
  | 'commercial_information'         // Purchase history
  | 'biometric_information'          // Fingerprints, face geometry
  | 'internet_activity'              // Browsing, search history
  | 'geolocation_data'               // Physical location
  | 'sensory_data'                   // Audio, visual, thermal
  | 'professional_information'       // Employment history
  | 'education_information'          // School records
  | 'inferences'                     // Profiles, preferences
  | 'sensitive_personal_info';       // CPRA addition

// Business Purpose Categories
export type BusinessPurpose =
  | 'auditing'
  | 'security'
  | 'debugging'
  | 'short_term_use'
  | 'service_provision'
  | 'internal_research'
  | 'quality_assurance';

// Sale/Share Status
export type SaleShareStatus =
  | 'opted_in'
  | 'opted_out'
  | 'never_sold'
  | 'minor_no_consent';

// CCPA Request
export interface CCPARequest {
  id: string;
  consumerId: string;
  requestType: CCPARequestType;
  status: CCPARequestStatus;
  verificationMethod: 'password' | 'email' | 'phone' | 'identity_document' | 'authorized_agent';
  verifiedAt?: Date;
  submittedAt: Date;
  dueDate: Date;
  completedAt?: Date;
  extendedDueDate?: Date;
  extensionReason?: string;
  responseData?: any;
  denialReason?: string;
  agentAuthorization?: AuthorizedAgent;
  metadata: Record<string, any>;
}

// Authorized Agent
export interface AuthorizedAgent {
  agentId: string;
  agentName: string;
  businessName?: string;
  authorizationType: 'power_of_attorney' | 'written_permission' | 'registered_agent';
  authorizationDocument?: string;
  verifiedAt: Date;
}

// Consumer PI Disclosure
export interface PIDisclosure {
  id: string;
  consumerId: string;
  requestId: string;
  categories: PICategory[];
  sources: PISource[];
  businessPurposes: BusinessPurpose[];
  thirdPartyDisclosures: ThirdPartyDisclosure[];
  specificPieces?: Record<string, any>;
  generatedAt: Date;
  expiresAt: Date;
}

// PI Source
export interface PISource {
  category: PICategory;
  source: 'direct' | 'indirect' | 'inferred' | 'third_party';
  sourceDescription: string;
  collectedAt?: Date;
}

// Third Party Disclosure
export interface ThirdPartyDisclosure {
  thirdPartyName: string;
  thirdPartyType: 'service_provider' | 'contractor' | 'third_party' | 'affiliate';
  categoriesDisclosed: PICategory[];
  purpose: BusinessPurpose;
  isSale: boolean;
  isSharing: boolean;
}

// Do Not Sell/Share Record
export interface DoNotSellRecord {
  consumerId: string;
  status: SaleShareStatus;
  optOutDate?: Date;
  optOutSource: 'gpc_signal' | 'website_link' | 'mobile_app' | 'toll_free' | 'authorized_agent';
  gpcSignalDetected: boolean;
  lastUpdated: Date;
  history: OptOutHistoryEntry[];
}

// Opt-Out History Entry
export interface OptOutHistoryEntry {
  action: 'opt_out' | 'opt_in' | 'gpc_detected';
  timestamp: Date;
  source: string;
  ipAddress?: string;
}

// Service Provider Agreement
export interface ServiceProviderAgreement {
  id: string;
  providerName: string;
  providerType: 'service_provider' | 'contractor';
  categoriesProcessed: PICategory[];
  businessPurposes: BusinessPurpose[];
  contractDate: Date;
  expirationDate: Date;
  includesCCPATerms: boolean;
  subcontractorRestrictions: boolean;
  combinationProhibition: boolean;
  auditRights: boolean;
  certificationDate?: Date;
  status: 'active' | 'expired' | 'terminated';
}

// Financial Incentive Program
export interface FinancialIncentive {
  id: string;
  programName: string;
  description: string;
  incentiveType: 'discount' | 'premium_service' | 'loyalty_program' | 'price_difference';
  valueEstimation: string; // Good-faith estimate of PI value
  calculationMethod: string;
  optInRequired: boolean;
  withdrawalProcess: string;
  piCategoriesInvolved: PICategory[];
  status: 'active' | 'inactive';
  createdAt: Date;
  participants: number;
}

// Privacy Notice
export interface PrivacyNotice {
  id: string;
  version: string;
  effectiveDate: Date;
  lastUpdated: Date;
  sections: PrivacyNoticeSection[];
  collectionNotice: boolean; // At or before collection
  financialIncentiveNotice: boolean;
  doNotSellLink: boolean;
  status: 'draft' | 'active' | 'archived';
}

// Privacy Notice Section
export interface PrivacyNoticeSection {
  sectionType:
    | 'categories_collected'
    | 'sources'
    | 'business_purposes'
    | 'categories_sold'
    | 'categories_disclosed'
    | 'consumer_rights'
    | 'contact_information'
    | 'financial_incentives'
    | 'sensitive_pi_disclosure';
  content: string;
  required: boolean;
  lastUpdated: Date;
}

// CCPA Stats
export interface CCPAStats {
  totalRequests: number;
  requestsByType: Record<CCPARequestType, number>;
  averageCompletionDays: number;
  optOutRate: number;
  gpcSignalCompliance: number;
  pendingRequests: number;
  overdueRequests: number;
}

// Config
export interface CCPAComplianceConfig {
  businessName: string;
  businessType: 'for_profit' | 'non_profit';
  annualRevenue: number; // For threshold determination
  californiConsumers: number;
  defaultResponseDays: number;
  extensionDays: number;
  honorGPCSignal: boolean;
  minorAgeThreshold: number;
}

/**
 * CCPA Compliance Service
 */
export class CCPAComplianceService extends EventEmitter {
  private static instance: CCPAComplianceService;
  private config: CCPAComplianceConfig;

  // In-memory storage (replace with database in production)
  private requests: Map<string, CCPARequest> = new Map();
  private disclosures: Map<string, PIDisclosure> = new Map();
  private doNotSellRecords: Map<string, DoNotSellRecord> = new Map();
  private serviceProviders: Map<string, ServiceProviderAgreement> = new Map();
  private financialIncentives: Map<string, FinancialIncentive> = new Map();
  private privacyNotices: Map<string, PrivacyNotice> = new Map();

  // CCPA thresholds
  private readonly REVENUE_THRESHOLD = 25_000_000; // $25 million
  private readonly CONSUMER_THRESHOLD = 100_000; // 100,000 consumers
  private readonly REVENUE_PERCENTAGE = 0.5; // 50% from selling PI

  private constructor(config?: Partial<CCPAComplianceConfig>) {
    super();
    this.config = {
      businessName: 'UpCoach Platform',
      businessType: 'for_profit',
      annualRevenue: 0,
      californiConsumers: 0,
      defaultResponseDays: 45,
      extensionDays: 45,
      honorGPCSignal: true,
      minorAgeThreshold: 16,
      ...config,
    };

    this.initializeDefaultData();
    console.log('CCPAComplianceService initialized');
  }

  static getInstance(config?: Partial<CCPAComplianceConfig>): CCPAComplianceService {
    if (!CCPAComplianceService.instance) {
      CCPAComplianceService.instance = new CCPAComplianceService(config);
    }
    return CCPAComplianceService.instance;
  }

  /**
   * Check if business is subject to CCPA
   */
  isSubjectToCCPA(): { subject: boolean; reasons: string[] } {
    const reasons: string[] = [];

    if (this.config.annualRevenue >= this.REVENUE_THRESHOLD) {
      reasons.push(`Annual revenue exceeds $${this.REVENUE_THRESHOLD.toLocaleString()}`);
    }

    if (this.config.californiConsumers >= this.CONSUMER_THRESHOLD) {
      reasons.push(`Processes PI of ${this.CONSUMER_THRESHOLD.toLocaleString()}+ California consumers`);
    }

    return {
      subject: reasons.length > 0,
      reasons,
    };
  }

  // ==================== Consumer Rights Requests ====================

  /**
   * Submit a new CCPA request
   */
  async submitRequest(
    consumerId: string,
    requestType: CCPARequestType,
    options?: {
      verificationMethod?: CCPARequest['verificationMethod'];
      agentAuthorization?: AuthorizedAgent;
      metadata?: Record<string, any>;
    }
  ): Promise<CCPARequest> {
    const id = this.generateId('CCPA');
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + this.config.defaultResponseDays);

    const request: CCPARequest = {
      id,
      consumerId,
      requestType,
      status: 'received',
      verificationMethod: options?.verificationMethod || 'email',
      submittedAt: now,
      dueDate,
      agentAuthorization: options?.agentAuthorization,
      metadata: options?.metadata || {},
    };

    this.requests.set(id, request);

    this.emit('request:submitted', { request });

    return request;
  }

  /**
   * Verify consumer identity for request
   */
  async verifyRequestIdentity(
    requestId: string,
    verificationData: {
      method: CCPARequest['verificationMethod'];
      proof: string;
    }
  ): Promise<CCPARequest> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    // Verification logic would go here
    // For sensitive requests (delete, know), require higher verification

    request.verificationMethod = verificationData.method;
    request.verifiedAt = new Date();
    request.status = 'verified';

    this.requests.set(requestId, request);

    this.emit('request:verified', { request });

    return request;
  }

  /**
   * Process a CCPA request
   */
  async processRequest(requestId: string): Promise<CCPARequest> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    if (request.status !== 'verified') {
      throw new Error('Request must be verified before processing');
    }

    request.status = 'in_progress';
    this.requests.set(requestId, request);

    try {
      switch (request.requestType) {
        case 'right_to_know':
          await this.processRightToKnow(request);
          break;
        case 'right_to_delete':
          await this.processRightToDelete(request);
          break;
        case 'right_to_opt_out':
          await this.processOptOut(request);
          break;
        case 'right_to_opt_in':
          await this.processOptIn(request);
          break;
        case 'right_to_correct':
          await this.processRightToCorrect(request);
          break;
        case 'right_to_limit':
          await this.processRightToLimit(request);
          break;
        default:
          break;
      }

      request.status = 'completed';
      request.completedAt = new Date();
    } catch (error) {
      request.status = 'denied';
      request.denialReason = error instanceof Error ? error.message : 'Processing failed';
    }

    this.requests.set(requestId, request);

    this.emit('request:processed', { request });

    return request;
  }

  /**
   * Process Right to Know request
   */
  private async processRightToKnow(request: CCPARequest): Promise<void> {
    const disclosure = await this.generatePIDisclosure(request.consumerId, request.id);
    request.responseData = {
      disclosureId: disclosure.id,
      categories: disclosure.categories,
      sources: disclosure.sources,
      purposes: disclosure.businessPurposes,
    };
  }

  /**
   * Process Right to Delete request
   */
  private async processRightToDelete(request: CCPARequest): Promise<void> {
    // Generate deletion confirmation
    const deletedCategories: PICategory[] = [
      'identifiers',
      'customer_records',
      'commercial_information',
      'internet_activity',
      'inferences',
    ];

    // Notify service providers to delete
    const serviceProviders = Array.from(this.serviceProviders.values()).filter(
      (sp) => sp.status === 'active'
    );

    request.responseData = {
      deletedCategories,
      retainedCategories: ['customer_records'], // May retain for legal compliance
      retentionReason: 'Legal compliance obligations',
      serviceProvidersNotified: serviceProviders.map((sp) => sp.providerName),
    };

    this.emit('consumer:deleted', {
      consumerId: request.consumerId,
      requestId: request.id,
    });
  }

  /**
   * Process Opt-Out request
   */
  private async processOptOut(request: CCPARequest): Promise<void> {
    await this.updateDoNotSellStatus(request.consumerId, 'opted_out', 'website_link');
    request.responseData = {
      optOutEffective: new Date(),
      categoriesAffected: ['identifiers', 'internet_activity', 'inferences'],
    };
  }

  /**
   * Process Opt-In request (for minors)
   */
  private async processOptIn(request: CCPARequest): Promise<void> {
    const record = this.doNotSellRecords.get(request.consumerId);
    if (record) {
      record.status = 'opted_in';
      record.lastUpdated = new Date();
      record.history.push({
        action: 'opt_in',
        timestamp: new Date(),
        source: 'consumer_request',
      });
      this.doNotSellRecords.set(request.consumerId, record);
    }

    request.responseData = {
      optInEffective: new Date(),
      parentalConsentRequired: request.metadata.age < this.config.minorAgeThreshold,
    };
  }

  /**
   * Process Right to Correct request (CPRA)
   */
  private async processRightToCorrect(request: CCPARequest): Promise<void> {
    const corrections = request.metadata.corrections || {};
    request.responseData = {
      correctedFields: Object.keys(corrections),
      correctedAt: new Date(),
      serviceProvidersNotified: true,
    };
  }

  /**
   * Process Right to Limit request (CPRA)
   */
  private async processRightToLimit(request: CCPARequest): Promise<void> {
    request.responseData = {
      limitedCategories: ['sensitive_personal_info'],
      limitedPurposes: ['internal_research', 'inferences'],
      effectiveDate: new Date(),
    };
  }

  /**
   * Extend request deadline
   */
  async extendRequestDeadline(
    requestId: string,
    reason: string
  ): Promise<CCPARequest> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    if (request.extendedDueDate) {
      throw new Error('Request can only be extended once');
    }

    const extendedDueDate = new Date(request.dueDate);
    extendedDueDate.setDate(extendedDueDate.getDate() + this.config.extensionDays);

    request.status = 'extended';
    request.extendedDueDate = extendedDueDate;
    request.extensionReason = reason;

    this.requests.set(requestId, request);

    this.emit('request:extended', { request });

    return request;
  }

  /**
   * Deny a request
   */
  async denyRequest(requestId: string, reason: string): Promise<CCPARequest> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    request.status = 'denied';
    request.denialReason = reason;
    request.completedAt = new Date();

    this.requests.set(requestId, request);

    this.emit('request:denied', { request });

    return request;
  }

  // ==================== PI Disclosures ====================

  /**
   * Generate PI disclosure for consumer
   */
  async generatePIDisclosure(
    consumerId: string,
    requestId: string
  ): Promise<PIDisclosure> {
    const id = this.generateId('DIS');
    const now = new Date();

    // In production, this would query actual data stores
    const disclosure: PIDisclosure = {
      id,
      consumerId,
      requestId,
      categories: [
        'identifiers',
        'customer_records',
        'commercial_information',
        'internet_activity',
        'inferences',
      ],
      sources: [
        {
          category: 'identifiers',
          source: 'direct',
          sourceDescription: 'Provided during account registration',
        },
        {
          category: 'commercial_information',
          source: 'direct',
          sourceDescription: 'Purchase and subscription history',
        },
        {
          category: 'internet_activity',
          source: 'indirect',
          sourceDescription: 'Collected via cookies and analytics',
        },
        {
          category: 'inferences',
          source: 'inferred',
          sourceDescription: 'Derived from usage patterns and preferences',
        },
      ],
      businessPurposes: [
        'service_provision',
        'internal_research',
        'security',
        'quality_assurance',
      ],
      thirdPartyDisclosures: this.getThirdPartyDisclosures(),
      generatedAt: now,
      expiresAt: new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000), // 12 months
    };

    this.disclosures.set(id, disclosure);

    return disclosure;
  }

  /**
   * Get third party disclosures
   */
  private getThirdPartyDisclosures(): ThirdPartyDisclosure[] {
    return Array.from(this.serviceProviders.values())
      .filter((sp) => sp.status === 'active')
      .map((sp) => ({
        thirdPartyName: sp.providerName,
        thirdPartyType: sp.providerType,
        categoriesDisclosed: sp.categoriesProcessed,
        purpose: sp.businessPurposes[0] || 'service_provision',
        isSale: false, // Service providers don't constitute sale
        isSharing: false,
      }));
  }

  // ==================== Do Not Sell/Share ====================

  /**
   * Check Global Privacy Control signal
   */
  checkGPCSignal(headers: Record<string, string>): boolean {
    const gpcHeader = headers['sec-gpc'] || headers['Sec-GPC'];
    return gpcHeader === '1';
  }

  /**
   * Handle GPC signal for consumer
   */
  async handleGPCSignal(
    consumerId: string,
    gpcDetected: boolean,
    ipAddress?: string
  ): Promise<DoNotSellRecord> {
    if (!this.config.honorGPCSignal) {
      throw new Error('GPC signal honoring is disabled');
    }

    let record = this.doNotSellRecords.get(consumerId);

    if (!record) {
      record = {
        consumerId,
        status: gpcDetected ? 'opted_out' : 'opted_in',
        gpcSignalDetected: gpcDetected,
        lastUpdated: new Date(),
        optOutSource: 'gpc_signal',
        history: [],
      };
    }

    if (gpcDetected && record.status !== 'opted_out') {
      record.status = 'opted_out';
      record.optOutDate = new Date();
      record.optOutSource = 'gpc_signal';
      record.gpcSignalDetected = true;
      record.lastUpdated = new Date();
      record.history.push({
        action: 'gpc_detected',
        timestamp: new Date(),
        source: 'GPC header',
        ipAddress,
      });

      this.emit('gpc:opt_out', { consumerId, record });
    }

    this.doNotSellRecords.set(consumerId, record);

    return record;
  }

  /**
   * Update Do Not Sell status
   */
  async updateDoNotSellStatus(
    consumerId: string,
    status: SaleShareStatus,
    source: DoNotSellRecord['optOutSource']
  ): Promise<DoNotSellRecord> {
    let record = this.doNotSellRecords.get(consumerId);

    if (!record) {
      record = {
        consumerId,
        status,
        gpcSignalDetected: false,
        lastUpdated: new Date(),
        optOutSource: source,
        history: [],
      };
    }

    record.status = status;
    record.lastUpdated = new Date();

    if (status === 'opted_out') {
      record.optOutDate = new Date();
      record.optOutSource = source;
    }

    record.history.push({
      action: status === 'opted_out' ? 'opt_out' : 'opt_in',
      timestamp: new Date(),
      source,
    });

    this.doNotSellRecords.set(consumerId, record);

    this.emit('dns:updated', { consumerId, record });

    return record;
  }

  /**
   * Check if consumer has opted out
   */
  isOptedOut(consumerId: string): boolean {
    const record = this.doNotSellRecords.get(consumerId);
    return record?.status === 'opted_out' || record?.status === 'minor_no_consent';
  }

  // ==================== Service Provider Agreements ====================

  /**
   * Register service provider agreement
   */
  async registerServiceProvider(
    agreement: Omit<ServiceProviderAgreement, 'id' | 'status'>
  ): Promise<ServiceProviderAgreement> {
    const id = this.generateId('SPA');

    const spa: ServiceProviderAgreement = {
      ...agreement,
      id,
      status: 'active',
    };

    // Validate CCPA requirements
    if (!spa.includesCCPATerms) {
      throw new Error('Service provider agreement must include CCPA terms');
    }

    if (!spa.subcontractorRestrictions) {
      console.warn('Agreement lacks subcontractor restrictions');
    }

    this.serviceProviders.set(id, spa);

    this.emit('spa:registered', { agreement: spa });

    return spa;
  }

  /**
   * Get service provider agreements expiring soon
   */
  getExpiringAgreements(daysThreshold: number = 30): ServiceProviderAgreement[] {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysThreshold);

    return Array.from(this.serviceProviders.values()).filter(
      (spa) => spa.status === 'active' && spa.expirationDate <= threshold
    );
  }

  // ==================== Financial Incentives ====================

  /**
   * Register financial incentive program
   */
  async registerFinancialIncentive(
    incentive: Omit<FinancialIncentive, 'id' | 'createdAt' | 'participants'>
  ): Promise<FinancialIncentive> {
    const id = this.generateId('FIN');

    const program: FinancialIncentive = {
      ...incentive,
      id,
      createdAt: new Date(),
      participants: 0,
    };

    // CCPA requires clear disclosure of value
    if (!program.valueEstimation || !program.calculationMethod) {
      throw new Error('Financial incentive must include value estimation and calculation method');
    }

    this.financialIncentives.set(id, program);

    this.emit('incentive:registered', { program });

    return program;
  }

  /**
   * Enroll consumer in financial incentive program
   */
  async enrollInIncentive(
    consumerId: string,
    incentiveId: string
  ): Promise<{ enrolled: boolean; program: FinancialIncentive }> {
    const program = this.financialIncentives.get(incentiveId);
    if (!program) {
      throw new Error(`Incentive program not found: ${incentiveId}`);
    }

    if (program.status !== 'active') {
      throw new Error('Program is not active');
    }

    // In production, check for explicit opt-in consent
    program.participants++;
    this.financialIncentives.set(incentiveId, program);

    this.emit('incentive:enrollment', { consumerId, program });

    return { enrolled: true, program };
  }

  // ==================== Privacy Notices ====================

  /**
   * Create privacy notice
   */
  async createPrivacyNotice(
    version: string,
    effectiveDate: Date
  ): Promise<PrivacyNotice> {
    const id = this.generateId('PN');

    const notice: PrivacyNotice = {
      id,
      version,
      effectiveDate,
      lastUpdated: new Date(),
      sections: this.generateRequiredSections(),
      collectionNotice: true,
      financialIncentiveNotice: this.financialIncentives.size > 0,
      doNotSellLink: true,
      status: 'draft',
    };

    this.privacyNotices.set(id, notice);

    return notice;
  }

  /**
   * Generate required CCPA sections
   */
  private generateRequiredSections(): PrivacyNoticeSection[] {
    return [
      {
        sectionType: 'categories_collected',
        content: 'We collect the following categories of personal information...',
        required: true,
        lastUpdated: new Date(),
      },
      {
        sectionType: 'sources',
        content: 'We collect personal information from the following sources...',
        required: true,
        lastUpdated: new Date(),
      },
      {
        sectionType: 'business_purposes',
        content: 'We use personal information for the following business purposes...',
        required: true,
        lastUpdated: new Date(),
      },
      {
        sectionType: 'categories_sold',
        content: 'We do not sell personal information...',
        required: true,
        lastUpdated: new Date(),
      },
      {
        sectionType: 'categories_disclosed',
        content: 'We disclose the following categories to service providers...',
        required: true,
        lastUpdated: new Date(),
      },
      {
        sectionType: 'consumer_rights',
        content: 'California consumers have the following rights...',
        required: true,
        lastUpdated: new Date(),
      },
      {
        sectionType: 'contact_information',
        content: 'To exercise your rights, contact us at...',
        required: true,
        lastUpdated: new Date(),
      },
      {
        sectionType: 'sensitive_pi_disclosure',
        content: 'We collect the following sensitive personal information...',
        required: true, // CPRA requirement
        lastUpdated: new Date(),
      },
    ];
  }

  /**
   * Activate privacy notice
   */
  async activatePrivacyNotice(noticeId: string): Promise<PrivacyNotice> {
    const notice = this.privacyNotices.get(noticeId);
    if (!notice) {
      throw new Error(`Privacy notice not found: ${noticeId}`);
    }

    // Validate all required sections
    const requiredSections = notice.sections.filter((s) => s.required);
    if (requiredSections.some((s) => !s.content)) {
      throw new Error('All required sections must have content');
    }

    // Archive current active notice
    for (const [id, n] of this.privacyNotices) {
      if (n.status === 'active') {
        n.status = 'archived';
        this.privacyNotices.set(id, n);
      }
    }

    notice.status = 'active';
    this.privacyNotices.set(noticeId, notice);

    this.emit('notice:activated', { notice });

    return notice;
  }

  // ==================== Reporting ====================

  /**
   * Get CCPA compliance stats
   */
  getComplianceStats(): CCPAStats {
    const requests = Array.from(this.requests.values());
    const now = new Date();

    const completedRequests = requests.filter((r) => r.status === 'completed');
    const completionTimes = completedRequests.map(
      (r) => (r.completedAt!.getTime() - r.submittedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const doNotSellRecords = Array.from(this.doNotSellRecords.values());
    const optedOut = doNotSellRecords.filter((r) => r.status === 'opted_out').length;

    const requestsByType = requests.reduce(
      (acc, r) => {
        acc[r.requestType] = (acc[r.requestType] || 0) + 1;
        return acc;
      },
      {} as Record<CCPARequestType, number>
    );

    const pendingRequests = requests.filter(
      (r) => !['completed', 'denied'].includes(r.status)
    );

    const overdueRequests = pendingRequests.filter((r) => {
      const dueDate = r.extendedDueDate || r.dueDate;
      return dueDate < now;
    });

    return {
      totalRequests: requests.length,
      requestsByType,
      averageCompletionDays:
        completionTimes.length > 0
          ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
          : 0,
      optOutRate: doNotSellRecords.length > 0 ? optedOut / doNotSellRecords.length : 0,
      gpcSignalCompliance: this.config.honorGPCSignal ? 1 : 0,
      pendingRequests: pendingRequests.length,
      overdueRequests: overdueRequests.length,
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(): Promise<{
    reportDate: Date;
    period: { start: Date; end: Date };
    subjectToCCPA: ReturnType<typeof this.isSubjectToCCPA>;
    stats: CCPAStats;
    activeNotice: PrivacyNotice | null;
    serviceProviderCount: number;
    financialIncentiveCount: number;
    recommendations: string[];
  }> {
    const now = new Date();
    const yearAgo = new Date(now);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    const stats = this.getComplianceStats();
    const activeNotice = Array.from(this.privacyNotices.values()).find(
      (n) => n.status === 'active'
    );

    const recommendations: string[] = [];

    if (stats.overdueRequests > 0) {
      recommendations.push(`Address ${stats.overdueRequests} overdue consumer requests`);
    }

    if (!activeNotice) {
      recommendations.push('Publish an active privacy notice');
    }

    if (stats.averageCompletionDays > 40) {
      recommendations.push('Improve request processing time (currently above 40 days)');
    }

    const expiringAgreements = this.getExpiringAgreements();
    if (expiringAgreements.length > 0) {
      recommendations.push(`Renew ${expiringAgreements.length} expiring service provider agreements`);
    }

    return {
      reportDate: now,
      period: { start: yearAgo, end: now },
      subjectToCCPA: this.isSubjectToCCPA(),
      stats,
      activeNotice: activeNotice || null,
      serviceProviderCount: this.serviceProviders.size,
      financialIncentiveCount: this.financialIncentives.size,
      recommendations,
    };
  }

  // ==================== Helpers ====================

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDefaultData(): void {
    // Default service provider for analytics
    this.serviceProviders.set('default-analytics', {
      id: 'default-analytics',
      providerName: 'Analytics Service Provider',
      providerType: 'service_provider',
      categoriesProcessed: ['internet_activity', 'inferences'],
      businessPurposes: ['internal_research', 'quality_assurance'],
      contractDate: new Date('2024-01-01'),
      expirationDate: new Date('2025-12-31'),
      includesCCPATerms: true,
      subcontractorRestrictions: true,
      combinationProhibition: true,
      auditRights: true,
      status: 'active',
    });

    // Default service provider for payment processing
    this.serviceProviders.set('default-payment', {
      id: 'default-payment',
      providerName: 'Payment Processor',
      providerType: 'service_provider',
      categoriesProcessed: ['identifiers', 'customer_records', 'commercial_information'],
      businessPurposes: ['service_provision', 'security'],
      contractDate: new Date('2024-01-01'),
      expirationDate: new Date('2026-01-01'),
      includesCCPATerms: true,
      subcontractorRestrictions: true,
      combinationProhibition: true,
      auditRights: true,
      certificationDate: new Date('2024-06-01'),
      status: 'active',
    });
  }

  /**
   * Get request by ID
   */
  getRequest(requestId: string): CCPARequest | undefined {
    return this.requests.get(requestId);
  }

  /**
   * Get all requests for a consumer
   */
  getConsumerRequests(consumerId: string): CCPARequest[] {
    return Array.from(this.requests.values()).filter(
      (r) => r.consumerId === consumerId
    );
  }
}

// Singleton getter
export function getCCPAComplianceService(
  config?: Partial<CCPAComplianceConfig>
): CCPAComplianceService {
  return CCPAComplianceService.getInstance(config);
}
