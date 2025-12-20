/**
 * Real-time Safety Detection Service
 *
 * Monitors AI-generated content and user messages in real-time for safety concerns.
 * Provides immediate intervention capabilities for coaching contexts.
 *
 * Features:
 * - Real-time content classification
 * - Crisis detection (suicide, self-harm, abuse)
 * - Content moderation (toxicity, harassment)
 * - Coaching boundary enforcement
 * - Escalation workflows
 * - False positive management
 * - Audit trail for all detections
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

import { eventBus } from '../events/EventBus';
import { eventStore } from '../events/EventStore';
import logger from '../../utils/logger';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type SafetyCategory =
  | 'crisis'
  | 'self_harm'
  | 'violence'
  | 'harassment'
  | 'hate_speech'
  | 'sexual_content'
  | 'medical_advice'
  | 'legal_advice'
  | 'financial_advice'
  | 'coaching_boundary'
  | 'pii_exposure'
  | 'manipulation'
  | 'spam';

export type SafetySeverity = 'low' | 'medium' | 'high' | 'critical';

export type ContentSource = 'user_message' | 'ai_response' | 'coach_message' | 'system_generated';

export type SafetyAction =
  | 'allow'
  | 'flag'
  | 'warn'
  | 'block'
  | 'escalate'
  | 'require_review'
  | 'auto_respond';

export interface SafetyRule {
  id: string;
  name: string;
  category: SafetyCategory;
  severity: SafetySeverity;
  patterns: RegExp[];
  keywords: string[];
  action: SafetyAction;
  autoResponse?: string;
  escalationTarget?: string;
  enabled: boolean;
  metadata?: Record<string, unknown>;
}

export interface SafetyDetection {
  id: string;
  contentId: string;
  userId: string;
  sessionId?: string;
  content: string;
  source: ContentSource;
  detectedAt: number;
  category: SafetyCategory;
  severity: SafetySeverity;
  confidence: number;
  matchedRules: string[];
  matchedPatterns: string[];
  action: SafetyAction;
  actionTaken: boolean;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: number;
  reviewOutcome?: 'confirmed' | 'false_positive' | 'adjusted';
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface SafetyCheckRequest {
  contentId: string;
  userId: string;
  sessionId?: string;
  content: string;
  source: ContentSource;
  context?: {
    conversationHistory?: string[];
    userProfile?: Record<string, unknown>;
    coachId?: string;
  };
}

export interface SafetyCheckResult {
  passed: boolean;
  detections: SafetyDetection[];
  highestSeverity: SafetySeverity | null;
  actions: SafetyAction[];
  autoResponse?: string;
  blockedContent?: boolean;
  requiresEscalation: boolean;
  processingTimeMs: number;
}

export interface SafetyStats {
  totalChecks: number;
  detectionsByCategory: Record<SafetyCategory, number>;
  detectionsBySeverity: Record<SafetySeverity, number>;
  actionsTaken: Record<SafetyAction, number>;
  falsePositiveRate: number;
  averageProcessingTimeMs: number;
  activeEscalations: number;
}

interface EscalationTicket {
  id: string;
  detectionId: string;
  userId: string;
  category: SafetyCategory;
  severity: SafetySeverity;
  content: string;
  createdAt: number;
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: number;
}

// ============================================================================
// Default Safety Rules
// ============================================================================

const DEFAULT_SAFETY_RULES: SafetyRule[] = [
  // Crisis Detection - Critical
  {
    id: 'crisis-suicide',
    name: 'Suicide/Self-Harm Crisis',
    category: 'crisis',
    severity: 'critical',
    patterns: [
      /\b(want to|going to|thinking about)\s+(die|kill myself|end (my|it all))\b/i,
      /\b(suicidal|suicide)\s*(thoughts?|ideation|plan)\b/i,
      /\bdon'?t want to (live|be here|exist)\b/i,
    ],
    keywords: ['suicide', 'kill myself', 'end my life', 'want to die'],
    action: 'escalate',
    autoResponse:
      "I'm really concerned about what you've shared. Your safety matters. Please reach out to a crisis helpline: National Suicide Prevention Lifeline: 988 (US). A human professional can provide the support you need right now.",
    escalationTarget: 'crisis_team',
    enabled: true,
  },
  {
    id: 'crisis-self-harm',
    name: 'Self-Harm Indication',
    category: 'self_harm',
    severity: 'high',
    patterns: [
      /\b(cutting|hurting|harming)\s*(myself|my body)\b/i,
      /\bself[- ]harm\b/i,
      /\b(burn|bruise|scratch)\s*myself\b/i,
    ],
    keywords: ['self-harm', 'cutting myself', 'hurting myself'],
    action: 'escalate',
    autoResponse:
      "I hear that you're going through something difficult. This is beyond what I can help with as an AI coach. Please consider speaking with a mental health professional who can provide proper support.",
    escalationTarget: 'crisis_team',
    enabled: true,
  },

  // Violence Detection
  {
    id: 'violence-threat',
    name: 'Violence Threat',
    category: 'violence',
    severity: 'critical',
    patterns: [
      /\b(going to|want to|will)\s+(hurt|kill|harm|attack)\s+(someone|them|him|her|you)\b/i,
      /\bthreaten(ing)?\s+(to\s+)?(hurt|kill|harm)\b/i,
    ],
    keywords: ['kill you', 'hurt you', 'attack', 'violence'],
    action: 'block',
    escalationTarget: 'security_team',
    enabled: true,
  },
  {
    id: 'violence-domestic',
    name: 'Domestic Violence Indicator',
    category: 'violence',
    severity: 'high',
    patterns: [
      /\bpartner\s+(hits?|beats?|hurts?|abuses?)\s+me\b/i,
      /\b(spouse|husband|wife|boyfriend|girlfriend)\s+(is\s+)?(violent|abusive)\b/i,
      /\bdomestic\s+(violence|abuse)\b/i,
    ],
    keywords: ['domestic violence', 'partner abuse', 'abusive relationship'],
    action: 'escalate',
    autoResponse:
      "I'm concerned about your safety. If you're in immediate danger, please call emergency services. For domestic violence support, please contact the National Domestic Violence Hotline: 1-800-799-7233.",
    escalationTarget: 'support_team',
    enabled: true,
  },

  // Harassment Detection
  {
    id: 'harassment-general',
    name: 'Harassment Language',
    category: 'harassment',
    severity: 'medium',
    patterns: [
      /\b(you'?re?\s+)?(stupid|idiot|moron|dumb)\b/i,
      /\bshut\s+up\b/i,
      /\b(hate|despise)\s+you\b/i,
    ],
    keywords: ['stupid', 'idiot', 'shut up'],
    action: 'warn',
    enabled: true,
  },

  // Coaching Boundary Violations
  {
    id: 'boundary-medical',
    name: 'Medical Advice Boundary',
    category: 'medical_advice',
    severity: 'medium',
    patterns: [
      /\b(should I|can I)\s+(take|stop|change)\s+(my\s+)?medication\b/i,
      /\bdiagnose\s+(me|my)\b/i,
      /\bwhat\s+(medication|drug|pill)\s+should\b/i,
    ],
    keywords: ['medication advice', 'diagnose me', 'prescription'],
    action: 'flag',
    autoResponse:
      "I appreciate you sharing this with me, but medical advice is outside my scope as a coaching AI. Please consult with a qualified healthcare professional for medical questions.",
    enabled: true,
  },
  {
    id: 'boundary-legal',
    name: 'Legal Advice Boundary',
    category: 'legal_advice',
    severity: 'medium',
    patterns: [
      /\b(should I|can I)\s+sue\b/i,
      /\bgive\s+me\s+legal\s+advice\b/i,
      /\bis\s+this\s+legal\b/i,
    ],
    keywords: ['legal advice', 'sue them', 'lawyer'],
    action: 'flag',
    autoResponse:
      "Legal matters require professional legal counsel. I'd recommend consulting with a qualified attorney for advice on legal issues.",
    enabled: true,
  },
  {
    id: 'boundary-financial',
    name: 'Financial Advice Boundary',
    category: 'financial_advice',
    severity: 'low',
    patterns: [
      /\b(should I|where should I)\s+(invest|buy|sell)\s+(stocks?|crypto|bitcoin)\b/i,
      /\bgive\s+me\s+investment\s+advice\b/i,
    ],
    keywords: ['investment advice', 'stock tips', 'financial advice'],
    action: 'flag',
    autoResponse:
      'For investment and financial advice, please consult with a certified financial advisor who can review your complete financial situation.',
    enabled: true,
  },

  // PII Exposure
  {
    id: 'pii-ssn',
    name: 'Social Security Number',
    category: 'pii_exposure',
    severity: 'high',
    patterns: [/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/],
    keywords: [],
    action: 'block',
    enabled: true,
  },
  {
    id: 'pii-credit-card',
    name: 'Credit Card Number',
    category: 'pii_exposure',
    severity: 'high',
    patterns: [/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/],
    keywords: [],
    action: 'block',
    enabled: true,
  },

  // Spam Detection
  {
    id: 'spam-promotion',
    name: 'Spam/Promotional Content',
    category: 'spam',
    severity: 'low',
    patterns: [
      /\b(buy now|click here|limited offer|act now)\b/i,
      /\b(free\s+money|make\s+money\s+fast)\b/i,
    ],
    keywords: ['buy now', 'free money', 'click here'],
    action: 'flag',
    enabled: true,
  },
];

// ============================================================================
// Real-time Safety Detection Service Implementation
// ============================================================================

export class RealtimeSafetyDetection extends EventEmitter {
  private static instance: RealtimeSafetyDetection;

  private rules: Map<string, SafetyRule> = new Map();
  private detections: Map<string, SafetyDetection> = new Map();
  private escalations: Map<string, EscalationTicket> = new Map();
  private userDetectionHistory: Map<string, string[]> = new Map();

  // Configuration
  private readonly maxDetectionsPerUser = 100;
  private readonly cleanupIntervalMs = 3600000; // 1 hour
  private readonly detectionRetentionMs = 86400000 * 7; // 7 days

  // Statistics
  private stats: SafetyStats = {
    totalChecks: 0,
    detectionsByCategory: {} as Record<SafetyCategory, number>,
    detectionsBySeverity: {} as Record<SafetySeverity, number>,
    actionsTaken: {} as Record<SafetyAction, number>,
    falsePositiveRate: 0,
    averageProcessingTimeMs: 0,
    activeEscalations: 0,
  };

  private processingTimes: number[] = [];
  private falsePositives = 0;
  private totalReviewed = 0;

  private cleanupTimer: NodeJS.Timeout | null = null;
  private initialized = false;

  private constructor() {
    super();
    this.loadDefaultRules();
  }

  public static getInstance(): RealtimeSafetyDetection {
    if (!RealtimeSafetyDetection.instance) {
      RealtimeSafetyDetection.instance = new RealtimeSafetyDetection();
    }
    return RealtimeSafetyDetection.instance;
  }

  /**
   * Load default safety rules
   */
  private loadDefaultRules(): void {
    for (const rule of DEFAULT_SAFETY_RULES) {
      this.rules.set(rule.id, rule);
    }
    logger.info(`[SafetyDetection] Loaded ${this.rules.size} default rules`);
  }

  /**
   * Start the safety detection service
   */
  async start(): Promise<void> {
    if (this.initialized) return;

    // Subscribe to content events
    await eventBus.subscribe('ai.stream.chunk', async event => {
      const payload = event.payload as { streamId: string; content: string; userId: string };
      // Check AI-generated content in real-time
      await this.checkContentAsync({
        contentId: payload.streamId,
        userId: payload.userId,
        content: payload.content,
        source: 'ai_response',
      });
    });

    await eventBus.subscribe('chat.message.sent', async event => {
      const payload = event.payload as {
        messageId: string;
        userId: string;
        content: string;
        sessionId?: string;
      };
      await this.checkContentAsync({
        contentId: payload.messageId,
        userId: payload.userId,
        content: payload.content,
        source: 'user_message',
        sessionId: payload.sessionId,
      });
    });

    // Start cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldDetections();
    }, this.cleanupIntervalMs);

    this.initialized = true;
    logger.info('[SafetyDetection] Service started');
  }

  /**
   * Stop the safety detection service
   */
  async stop(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.initialized = false;
    logger.info('[SafetyDetection] Service stopped');
  }

  /**
   * Check content for safety issues (synchronous, blocking)
   */
  async checkContent(request: SafetyCheckRequest): Promise<SafetyCheckResult> {
    const startTime = Date.now();
    this.stats.totalChecks++;

    const detections: SafetyDetection[] = [];
    const actions: Set<SafetyAction> = new Set();
    let highestSeverity: SafetySeverity | null = null;
    let autoResponse: string | undefined;
    let requiresEscalation = false;
    let blockedContent = false;

    const severityOrder: SafetySeverity[] = ['low', 'medium', 'high', 'critical'];

    // Check against all enabled rules
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const { matched, matchedPatterns } = this.matchRule(rule, request.content);

      if (matched) {
        const detection: SafetyDetection = {
          id: uuidv4(),
          contentId: request.contentId,
          userId: request.userId,
          sessionId: request.sessionId,
          content: request.content.substring(0, 500), // Truncate for storage
          source: request.source,
          detectedAt: Date.now(),
          category: rule.category,
          severity: rule.severity,
          confidence: this.calculateConfidence(matchedPatterns.length, rule),
          matchedRules: [rule.id],
          matchedPatterns,
          action: rule.action,
          actionTaken: false,
          reviewed: false,
        };

        detections.push(detection);
        actions.add(rule.action);

        // Track highest severity
        const currentSeverityIndex = highestSeverity
          ? severityOrder.indexOf(highestSeverity)
          : -1;
        const newSeverityIndex = severityOrder.indexOf(rule.severity);
        if (newSeverityIndex > currentSeverityIndex) {
          highestSeverity = rule.severity;
        }

        // Collect auto-responses (use highest severity one)
        if (rule.autoResponse) {
          autoResponse = rule.autoResponse;
        }

        // Check for blocking or escalation
        if (rule.action === 'block') {
          blockedContent = true;
        }
        if (rule.action === 'escalate') {
          requiresEscalation = true;
        }

        // Update statistics
        this.updateStats(detection);
      }
    }

    // Store detections
    for (const detection of detections) {
      this.storeDetection(detection);
    }

    // Handle escalations
    if (requiresEscalation && highestSeverity) {
      const criticalDetection = detections.find(d => d.severity === highestSeverity);
      if (criticalDetection) {
        await this.createEscalation(criticalDetection);
      }
    }

    // Record processing time
    const processingTimeMs = Date.now() - startTime;
    this.updateProcessingTime(processingTimeMs);

    const result: SafetyCheckResult = {
      passed: detections.length === 0 || !blockedContent,
      detections,
      highestSeverity,
      actions: Array.from(actions),
      autoResponse,
      blockedContent,
      requiresEscalation,
      processingTimeMs,
    };

    // Emit event for detections
    if (detections.length > 0) {
      this.emit('safetyDetection', {
        userId: request.userId,
        detections,
        result,
      });

      await eventBus.publish(
        'safety.content.flagged',
        'security',
        {
          userId: request.userId,
          detectionCount: detections.length,
          highestSeverity,
          categories: detections.map(d => d.category),
          actions: Array.from(actions),
        },
        { priority: highestSeverity === 'critical' ? 'critical' : 'high' }
      );
    }

    return result;
  }

  /**
   * Async content check (non-blocking, for streaming)
   */
  private async checkContentAsync(request: SafetyCheckRequest): Promise<void> {
    try {
      const result = await this.checkContent(request);

      if (result.requiresEscalation || result.blockedContent) {
        // Emit immediate alert for critical issues
        await eventBus.publish(
          'safety.alert.immediate',
          'security',
          {
            userId: request.userId,
            contentId: request.contentId,
            severity: result.highestSeverity,
            blocked: result.blockedContent,
          },
          { priority: 'critical' }
        );
      }
    } catch (error) {
      logger.error(`[SafetyDetection] Async check failed: ${error}`);
    }
  }

  /**
   * Match content against a rule
   */
  private matchRule(
    rule: SafetyRule,
    content: string
  ): { matched: boolean; matchedPatterns: string[] } {
    const matchedPatterns: string[] = [];
    const lowerContent = content.toLowerCase();

    // Check patterns
    for (const pattern of rule.patterns) {
      if (pattern.test(content)) {
        matchedPatterns.push(pattern.source);
      }
    }

    // Check keywords
    for (const keyword of rule.keywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        matchedPatterns.push(`keyword:${keyword}`);
      }
    }

    return {
      matched: matchedPatterns.length > 0,
      matchedPatterns,
    };
  }

  /**
   * Calculate detection confidence
   */
  private calculateConfidence(matchCount: number, rule: SafetyRule): number {
    const baseConfidence = 0.6;
    const matchBonus = Math.min(matchCount * 0.1, 0.3);

    // Higher severity rules get slight confidence boost
    const severityBonus: Record<SafetySeverity, number> = {
      low: 0,
      medium: 0.02,
      high: 0.05,
      critical: 0.08,
    };

    return Math.min(baseConfidence + matchBonus + severityBonus[rule.severity], 0.98);
  }

  /**
   * Store a detection
   */
  private storeDetection(detection: SafetyDetection): void {
    this.detections.set(detection.id, detection);

    // Track per-user history
    const userHistory = this.userDetectionHistory.get(detection.userId) || [];
    userHistory.push(detection.id);

    // Limit history size
    if (userHistory.length > this.maxDetectionsPerUser) {
      const removedId = userHistory.shift();
      if (removedId) {
        this.detections.delete(removedId);
      }
    }

    this.userDetectionHistory.set(detection.userId, userHistory);

    // Store in event store for audit
    eventStore.append(
      {
        id: uuidv4(),
        type: 'safety.detection.created',
        category: 'security',
        priority: detection.severity === 'critical' ? 'critical' : 'high',
        payload: detection,
        metadata: {
          timestamp: Date.now(),
          source: 'realtime-safety-detection',
          version: '1.0.0',
        },
      },
      detection.id,
      'safety-detection'
    );
  }

  /**
   * Create an escalation ticket
   */
  private async createEscalation(detection: SafetyDetection): Promise<string> {
    const ticket: EscalationTicket = {
      id: uuidv4(),
      detectionId: detection.id,
      userId: detection.userId,
      category: detection.category,
      severity: detection.severity,
      content: detection.content,
      createdAt: Date.now(),
      status: 'open',
    };

    this.escalations.set(ticket.id, ticket);
    this.stats.activeEscalations++;

    // Emit escalation event
    await eventBus.publish(
      'safety.escalation.created',
      'security',
      {
        ticketId: ticket.id,
        detectionId: detection.id,
        userId: detection.userId,
        category: detection.category,
        severity: detection.severity,
      },
      { priority: 'critical' }
    );

    this.emit('escalation', ticket);

    logger.warn(
      `[SafetyDetection] Escalation created: ${ticket.id} for user ${detection.userId}, category: ${detection.category}`
    );

    return ticket.id;
  }

  /**
   * Update statistics
   */
  private updateStats(detection: SafetyDetection): void {
    // Category stats
    this.stats.detectionsByCategory[detection.category] =
      (this.stats.detectionsByCategory[detection.category] || 0) + 1;

    // Severity stats
    this.stats.detectionsBySeverity[detection.severity] =
      (this.stats.detectionsBySeverity[detection.severity] || 0) + 1;

    // Action stats
    this.stats.actionsTaken[detection.action] =
      (this.stats.actionsTaken[detection.action] || 0) + 1;
  }

  /**
   * Update processing time statistics
   */
  private updateProcessingTime(timeMs: number): void {
    this.processingTimes.push(timeMs);
    if (this.processingTimes.length > 1000) {
      this.processingTimes.shift();
    }
    this.stats.averageProcessingTimeMs =
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
  }

  /**
   * Cleanup old detections
   */
  private cleanupOldDetections(): void {
    const cutoff = Date.now() - this.detectionRetentionMs;
    let cleaned = 0;

    for (const [id, detection] of this.detections.entries()) {
      if (detection.detectedAt < cutoff && detection.reviewed) {
        this.detections.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`[SafetyDetection] Cleaned up ${cleaned} old detections`);
    }
  }

  // ============================================================================
  // Rule Management
  // ============================================================================

  /**
   * Add or update a safety rule
   */
  addRule(rule: SafetyRule): void {
    this.rules.set(rule.id, rule);
    logger.info(`[SafetyDetection] Rule added/updated: ${rule.id}`);
  }

  /**
   * Remove a safety rule
   */
  removeRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      logger.info(`[SafetyDetection] Rule removed: ${ruleId}`);
    }
    return deleted;
  }

  /**
   * Enable or disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    rule.enabled = enabled;
    logger.info(`[SafetyDetection] Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * Get all rules
   */
  getRules(): SafetyRule[] {
    return Array.from(this.rules.values());
  }

  // ============================================================================
  // Detection Review
  // ============================================================================

  /**
   * Review a detection (mark as confirmed or false positive)
   */
  async reviewDetection(
    detectionId: string,
    reviewerId: string,
    outcome: 'confirmed' | 'false_positive' | 'adjusted',
    notes?: string
  ): Promise<boolean> {
    const detection = this.detections.get(detectionId);
    if (!detection) return false;

    detection.reviewed = true;
    detection.reviewedBy = reviewerId;
    detection.reviewedAt = Date.now();
    detection.reviewOutcome = outcome;
    detection.notes = notes;

    // Update false positive tracking
    this.totalReviewed++;
    if (outcome === 'false_positive') {
      this.falsePositives++;
    }
    this.stats.falsePositiveRate = this.falsePositives / this.totalReviewed;

    // Store review event
    await eventStore.append(
      {
        id: uuidv4(),
        type: 'safety.detection.reviewed',
        category: 'security',
        priority: 'normal',
        payload: {
          detectionId,
          reviewerId,
          outcome,
          notes,
        },
        metadata: {
          timestamp: Date.now(),
          source: 'realtime-safety-detection',
          version: '1.0.0',
        },
      },
      detectionId,
      'safety-detection'
    );

    this.emit('detectionReviewed', { detectionId, outcome, reviewerId });

    logger.info(
      `[SafetyDetection] Detection ${detectionId} reviewed by ${reviewerId}: ${outcome}`
    );

    return true;
  }

  // ============================================================================
  // Escalation Management
  // ============================================================================

  /**
   * Get escalation by ID
   */
  getEscalation(ticketId: string): EscalationTicket | undefined {
    return this.escalations.get(ticketId);
  }

  /**
   * Get all open escalations
   */
  getOpenEscalations(): EscalationTicket[] {
    return Array.from(this.escalations.values()).filter(
      e => e.status === 'open' || e.status === 'in_progress'
    );
  }

  /**
   * Assign an escalation to a team member
   */
  async assignEscalation(ticketId: string, assigneeId: string): Promise<boolean> {
    const ticket = this.escalations.get(ticketId);
    if (!ticket) return false;

    ticket.assignedTo = assigneeId;
    ticket.status = 'in_progress';

    await eventBus.publish(
      'safety.escalation.assigned',
      'security',
      {
        ticketId,
        assigneeId,
        userId: ticket.userId,
        category: ticket.category,
      },
      { priority: 'high' }
    );

    return true;
  }

  /**
   * Resolve an escalation
   */
  async resolveEscalation(
    ticketId: string,
    resolution: string,
    dismiss: boolean = false
  ): Promise<boolean> {
    const ticket = this.escalations.get(ticketId);
    if (!ticket) return false;

    ticket.status = dismiss ? 'dismissed' : 'resolved';
    ticket.resolution = resolution;
    ticket.resolvedAt = Date.now();
    this.stats.activeEscalations--;

    await eventBus.publish(
      'safety.escalation.resolved',
      'security',
      {
        ticketId,
        status: ticket.status,
        resolution,
      },
      { priority: 'normal' }
    );

    this.emit('escalationResolved', ticket);

    return true;
  }

  // ============================================================================
  // Query Methods
  // ============================================================================

  /**
   * Get detection by ID
   */
  getDetection(detectionId: string): SafetyDetection | undefined {
    return this.detections.get(detectionId);
  }

  /**
   * Get detections for a user
   */
  getUserDetections(
    userId: string,
    options?: { category?: SafetyCategory; severity?: SafetySeverity; limit?: number }
  ): SafetyDetection[] {
    const detectionIds = this.userDetectionHistory.get(userId) || [];
    let detections = detectionIds
      .map(id => this.detections.get(id))
      .filter((d): d is SafetyDetection => d !== undefined);

    if (options?.category) {
      detections = detections.filter(d => d.category === options.category);
    }

    if (options?.severity) {
      detections = detections.filter(d => d.severity === options.severity);
    }

    if (options?.limit) {
      detections = detections.slice(-options.limit);
    }

    return detections;
  }

  /**
   * Get unreviewed detections
   */
  getUnreviewedDetections(limit: number = 50): SafetyDetection[] {
    return Array.from(this.detections.values())
      .filter(d => !d.reviewed)
      .sort((a, b) => b.detectedAt - a.detectedAt)
      .slice(0, limit);
  }

  /**
   * Get service statistics
   */
  getStats(): SafetyStats {
    return {
      ...this.stats,
      activeEscalations: this.getOpenEscalations().length,
    };
  }

  /**
   * Check if user has recent critical detections
   */
  hasRecentCriticalDetections(userId: string, windowMs: number = 3600000): boolean {
    const cutoff = Date.now() - windowMs;
    const detections = this.getUserDetections(userId, { severity: 'critical' });

    return detections.some(d => d.detectedAt > cutoff);
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const realtimeSafetyDetection = RealtimeSafetyDetection.getInstance();

export function createRealtimeSafetyDetection(): RealtimeSafetyDetection {
  return RealtimeSafetyDetection.getInstance();
}
