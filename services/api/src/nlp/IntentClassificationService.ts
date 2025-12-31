import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

/**
 * Intent Classification Service
 *
 * Production-ready intent classification system for natural language understanding.
 * Supports 30+ intent types with confidence scoring, multi-intent detection,
 * slot filling, and personalized intent models.
 */

// Intent types enum
export enum IntentType {
  // Goal management
  CREATE_GOAL = 'create_goal',
  UPDATE_GOAL = 'update_goal',
  DELETE_GOAL = 'delete_goal',
  VIEW_GOAL = 'view_goal',

  // Habit tracking
  TRACK_HABIT = 'track_habit',
  CREATE_HABIT = 'create_habit',
  UPDATE_HABIT = 'update_habit',
  DELETE_HABIT = 'delete_habit',

  // Progress and analytics
  CHECK_PROGRESS = 'check_progress',
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_HISTORY = 'view_history',
  EXPORT_DATA = 'export_data',

  // Scheduling
  SCHEDULE_SESSION = 'schedule_session',
  CANCEL_APPOINTMENT = 'cancel_appointment',
  RESCHEDULE_APPOINTMENT = 'reschedule',

  // Feedback and support
  REQUEST_FEEDBACK = 'request_feedback',
  ASK_QUESTION = 'ask_question',
  REPORT_ISSUE = 'report_issue',
  REQUEST_SUPPORT = 'request_support',
  GET_HELP = 'get_help',

  // Profile management
  UPDATE_PROFILE = 'update_profile',
  CHANGE_SETTINGS = 'change_settings',

  // Reminders and notifications
  SET_REMINDER = 'set_reminder',

  // Social features
  SHARE_PROGRESS = 'share_progress',
  SEND_MESSAGE = 'send_message',

  // Mood and wellbeing
  TRACK_MOOD = 'track_mood',
  LOG_ACTIVITY = 'log_activity',

  // Session management
  REVIEW_SESSION = 'review_session',
  RATE_COACH = 'rate_coach',

  // Program management
  JOIN_PROGRAM = 'join_program',
  LEAVE_PROGRAM = 'leave_program',

  // Payment and billing
  UPDATE_PAYMENT = 'update_payment',
  VIEW_BILLING = 'view_billing',
  REQUEST_REFUND = 'request_refund',

  // Consultation
  BOOK_CONSULTATION = 'book_consultation',

  // Unknown/fallback
  UNKNOWN = 'unknown',
}

// Slot types for entity extraction
export enum SlotType {
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  DURATION = 'duration',
  PERSON = 'person',
  GOAL_NAME = 'goal_name',
  HABIT_NAME = 'habit_name',
  AMOUNT = 'amount',
  PERCENTAGE = 'percentage',
  MOOD = 'mood',
  ACTIVITY = 'activity',
  LOCATION = 'location',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  RATING = 'rating',
  REASON = 'reason',
}

export interface Slot {
  type: SlotType;
  value: string;
  normalizedValue: any;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
}

export interface Intent {
  type: IntentType;
  confidence: number;
  slots: Slot[];
  rawText: string;
}

export interface ClassificationResult {
  primaryIntent: Intent;
  alternativeIntents: Intent[];
  isMultiIntent: boolean;
  context?: ConversationContext;
  suggestions: IntentType[];
  timestamp: Date;
}

export interface ConversationContext {
  userId: string;
  conversationId: string;
  previousIntents: IntentType[];
  userProfile?: UserProfile;
  timestamp: Date;
}

export interface UserProfile {
  userId: string;
  preferences: Record<string, any>;
  intentHistory: IntentHistoryEntry[];
  personalizedPatterns: IntentPattern[];
}

export interface IntentHistoryEntry {
  intent: IntentType;
  timestamp: Date;
  success: boolean;
  feedback?: number;
}

export interface IntentPattern {
  pattern: RegExp;
  intent: IntentType;
  weight: number;
  examples: string[];
}

export interface TrainingExample {
  text: string;
  intent: IntentType;
  slots: Slot[];
  metadata?: Record<string, any>;
}

interface IntentRule {
  intent: IntentType;
  patterns: RegExp[];
  keywords: { word: string; weight: number }[];
  requiredSlots?: SlotType[];
  contextDependencies?: IntentType[];
  priority: number;
}

interface IntentClassificationConfig {
  confidenceThreshold: number;
  multiIntentThreshold: number;
  maxAlternatives: number;
  enablePersonalization: boolean;
  enableContextAwareness: boolean;
  cacheEnabled: boolean;
  cacheTTL: number;
}

export class IntentClassificationService extends EventEmitter {
  private redis: Redis;
  private intentRules: Map<IntentType, IntentRule>;
  private config: IntentClassificationConfig;
  private trainingData: TrainingExample[];
  private userProfiles: Map<string, UserProfile>;

  constructor(redisClient: Redis, config?: Partial<IntentClassificationConfig>) {
    super();
    this.redis = redisClient;
    this.config = {
      confidenceThreshold: 0.6,
      multiIntentThreshold: 0.5,
      maxAlternatives: 3,
      enablePersonalization: true,
      enableContextAwareness: true,
      cacheEnabled: true,
      cacheTTL: 3600,
      ...config,
    };

    this.intentRules = new Map();
    this.trainingData = [];
    this.userProfiles = new Map();

    this.initializeIntentRules();
    this.loadTrainingData();
  }

  /**
   * Initialize intent classification rules
   */
  private initializeIntentRules(): void {
    // Goal management intents
    this.addIntentRule({
      intent: IntentType.CREATE_GOAL,
      patterns: [
        /\b(create|add|set|start|new)\s+(a\s+)?(goal|target|objective)\b/i,
        /\bI\s+want\s+to\s+(achieve|accomplish|reach)\b/i,
        /\b(help\s+me|assist\s+me)\s+(with\s+)?(creating|setting|making)\s+a\s+goal\b/i,
      ],
      keywords: [
        { word: 'create', weight: 1.5 },
        { word: 'goal', weight: 2.0 },
        { word: 'new', weight: 1.2 },
        { word: 'add', weight: 1.3 },
        { word: 'set', weight: 1.4 },
      ],
      requiredSlots: [SlotType.GOAL_NAME],
      priority: 10,
    });

    this.addIntentRule({
      intent: IntentType.UPDATE_GOAL,
      patterns: [
        /\b(update|modify|change|edit|adjust)\s+(my\s+)?goal\b/i,
        /\b(revise|alter)\s+(my\s+)?(goal|target|objective)\b/i,
      ],
      keywords: [
        { word: 'update', weight: 1.8 },
        { word: 'modify', weight: 1.6 },
        { word: 'change', weight: 1.5 },
        { word: 'goal', weight: 2.0 },
      ],
      priority: 9,
    });

    this.addIntentRule({
      intent: IntentType.DELETE_GOAL,
      patterns: [
        /\b(delete|remove|cancel|drop)\s+(my\s+)?goal\b/i,
        /\b(get\s+rid\s+of|abandon)\s+(my\s+)?(goal|target)\b/i,
      ],
      keywords: [
        { word: 'delete', weight: 2.0 },
        { word: 'remove', weight: 1.8 },
        { word: 'cancel', weight: 1.6 },
        { word: 'goal', weight: 2.0 },
      ],
      priority: 9,
    });

    // Habit tracking intents
    this.addIntentRule({
      intent: IntentType.TRACK_HABIT,
      patterns: [
        /\b(log|track|record|mark|complete)\s+(my\s+)?(habit|routine|task)\b/i,
        /\bI\s+(did|completed|finished)\s+(my\s+)?(habit|routine|exercise)\b/i,
        /\b(check\s+off|tick|done)\s+(my\s+)?(habit|task)\b/i,
      ],
      keywords: [
        { word: 'log', weight: 1.5 },
        { word: 'track', weight: 1.8 },
        { word: 'habit', weight: 2.0 },
        { word: 'complete', weight: 1.6 },
        { word: 'did', weight: 1.3 },
      ],
      requiredSlots: [SlotType.HABIT_NAME],
      priority: 10,
    });

    this.addIntentRule({
      intent: IntentType.CREATE_HABIT,
      patterns: [
        /\b(create|add|start|new)\s+(a\s+)?(habit|routine|practice)\b/i,
        /\bI\s+want\s+to\s+(build|develop|form)\s+a\s+(habit|routine)\b/i,
      ],
      keywords: [
        { word: 'create', weight: 1.5 },
        { word: 'habit', weight: 2.0 },
        { word: 'new', weight: 1.2 },
        { word: 'routine', weight: 1.8 },
      ],
      priority: 10,
    });

    // Progress and analytics intents
    this.addIntentRule({
      intent: IntentType.CHECK_PROGRESS,
      patterns: [
        /\b(check|show|view|see|display)\s+(my\s+)?(progress|advancement|development)\b/i,
        /\bhow\s+(am\s+I|have\s+I)\s+(doing|progressing|advancing)\b/i,
        /\b(where\s+am\s+I|what's\s+my\s+progress)\b/i,
      ],
      keywords: [
        { word: 'progress', weight: 2.0 },
        { word: 'check', weight: 1.5 },
        { word: 'show', weight: 1.4 },
        { word: 'how', weight: 1.3 },
      ],
      priority: 8,
    });

    this.addIntentRule({
      intent: IntentType.VIEW_ANALYTICS,
      patterns: [
        /\b(show|view|display|see)\s+(my\s+)?(analytics|statistics|stats|metrics|data)\b/i,
        /\b(performance|results)\s+(data|report|analytics)\b/i,
      ],
      keywords: [
        { word: 'analytics', weight: 2.0 },
        { word: 'statistics', weight: 1.8 },
        { word: 'stats', weight: 1.8 },
        { word: 'metrics', weight: 1.6 },
      ],
      priority: 8,
    });

    this.addIntentRule({
      intent: IntentType.VIEW_HISTORY,
      patterns: [
        /\b(show|view|see|display)\s+(my\s+)?(history|past|previous)\b/i,
        /\b(look\s+back|review)\s+(my\s+)?(history|records|activity)\b/i,
      ],
      keywords: [
        { word: 'history', weight: 2.0 },
        { word: 'past', weight: 1.5 },
        { word: 'previous', weight: 1.4 },
      ],
      priority: 7,
    });

    this.addIntentRule({
      intent: IntentType.EXPORT_DATA,
      patterns: [
        /\b(export|download|save|backup)\s+(my\s+)?(data|information|records)\b/i,
        /\bget\s+(a\s+)?(copy|export)\s+of\s+my\s+(data|records)\b/i,
      ],
      keywords: [
        { word: 'export', weight: 2.0 },
        { word: 'download', weight: 1.8 },
        { word: 'data', weight: 1.6 },
      ],
      priority: 7,
    });

    // Scheduling intents
    this.addIntentRule({
      intent: IntentType.SCHEDULE_SESSION,
      patterns: [
        /\b(schedule|book|arrange|set\s+up)\s+(a\s+)?(session|meeting|appointment|call)\b/i,
        /\bI\s+(want|need)\s+to\s+(schedule|book)\s+(a\s+)?(session|meeting)\b/i,
        /\b(meet\s+with|talk\s+to|speak\s+with)\s+(my\s+)?(coach|mentor)\b/i,
      ],
      keywords: [
        { word: 'schedule', weight: 2.0 },
        { word: 'book', weight: 1.8 },
        { word: 'session', weight: 1.9 },
        { word: 'appointment', weight: 1.8 },
      ],
      requiredSlots: [SlotType.DATETIME],
      priority: 10,
    });

    this.addIntentRule({
      intent: IntentType.CANCEL_APPOINTMENT,
      patterns: [
        /\b(cancel|delete|remove)\s+(my\s+)?(session|meeting|appointment)\b/i,
        /\bI\s+(can't|cannot)\s+(make|attend)\s+(my\s+)?(session|appointment)\b/i,
      ],
      keywords: [
        { word: 'cancel', weight: 2.0 },
        { word: 'appointment', weight: 1.8 },
        { word: 'session', weight: 1.7 },
      ],
      priority: 9,
    });

    this.addIntentRule({
      intent: IntentType.RESCHEDULE_APPOINTMENT,
      patterns: [
        /\b(reschedule|move|change)\s+(my\s+)?(session|meeting|appointment)\b/i,
        /\b(find\s+)?(another|different)\s+(time|date)\s+for\s+(my\s+)?(session|appointment)\b/i,
      ],
      keywords: [
        { word: 'reschedule', weight: 2.0 },
        { word: 'move', weight: 1.5 },
        { word: 'change', weight: 1.4 },
        { word: 'appointment', weight: 1.7 },
      ],
      requiredSlots: [SlotType.DATETIME],
      priority: 9,
    });

    // Feedback and support intents
    this.addIntentRule({
      intent: IntentType.REQUEST_FEEDBACK,
      patterns: [
        /\b(get|request|ask\s+for|need)\s+(some\s+)?(feedback|input|advice|opinion)\b/i,
        /\bI\s+would\s+like\s+(some\s+)?(feedback|advice)\b/i,
      ],
      keywords: [
        { word: 'feedback', weight: 2.0 },
        { word: 'advice', weight: 1.7 },
        { word: 'request', weight: 1.4 },
      ],
      priority: 8,
    });

    this.addIntentRule({
      intent: IntentType.ASK_QUESTION,
      patterns: [
        /\b(what|how|why|when|where|who|which)\b/i,
        /\b(can\s+you|could\s+you)\s+(tell|explain|help|show)\b/i,
        /\bI\s+(have\s+a\s+question|wonder|am\s+curious)\b/i,
      ],
      keywords: [
        { word: 'what', weight: 1.5 },
        { word: 'how', weight: 1.5 },
        { word: 'why', weight: 1.4 },
        { word: 'question', weight: 1.8 },
      ],
      priority: 6,
    });

    this.addIntentRule({
      intent: IntentType.REPORT_ISSUE,
      patterns: [
        /\b(report|submit)\s+(a|an)?\s+(issue|problem|bug|error)\b/i,
        /\b(something|it)\s+(is|isn't)\s+(working|broken|wrong)\b/i,
        /\bI\s+(found|encountered|have)\s+(a|an)\s+(issue|problem|bug)\b/i,
      ],
      keywords: [
        { word: 'report', weight: 1.8 },
        { word: 'issue', weight: 2.0 },
        { word: 'problem', weight: 1.8 },
        { word: 'bug', weight: 1.9 },
        { word: 'error', weight: 1.7 },
      ],
      priority: 9,
    });

    this.addIntentRule({
      intent: IntentType.REQUEST_SUPPORT,
      patterns: [
        /\b(need|request|get)\s+(help|support|assistance)\b/i,
        /\b(can\s+someone|could\s+someone)\s+help\s+me\b/i,
      ],
      keywords: [
        { word: 'support', weight: 2.0 },
        { word: 'help', weight: 1.8 },
        { word: 'assistance', weight: 1.7 },
      ],
      priority: 8,
    });

    this.addIntentRule({
      intent: IntentType.GET_HELP,
      patterns: [
        /\bhelp\b/i,
        /\bI\s+(need|want)\s+help\b/i,
        /\b(assist|guide)\s+me\b/i,
      ],
      keywords: [
        { word: 'help', weight: 2.0 },
        { word: 'assist', weight: 1.6 },
      ],
      priority: 7,
    });

    // Profile and settings intents
    this.addIntentRule({
      intent: IntentType.UPDATE_PROFILE,
      patterns: [
        /\b(update|edit|change|modify)\s+(my\s+)?(profile|account|information)\b/i,
        /\b(change|update)\s+(my\s+)?(name|email|phone|photo)\b/i,
      ],
      keywords: [
        { word: 'update', weight: 1.7 },
        { word: 'profile', weight: 2.0 },
        { word: 'account', weight: 1.6 },
      ],
      priority: 8,
    });

    this.addIntentRule({
      intent: IntentType.CHANGE_SETTINGS,
      patterns: [
        /\b(change|update|modify|adjust)\s+(my\s+)?(settings|preferences|options)\b/i,
        /\b(turn\s+on|turn\s+off|enable|disable)\s+(notifications|reminders)\b/i,
      ],
      keywords: [
        { word: 'settings', weight: 2.0 },
        { word: 'preferences', weight: 1.8 },
        { word: 'change', weight: 1.4 },
      ],
      priority: 7,
    });

    // Reminder intent
    this.addIntentRule({
      intent: IntentType.SET_REMINDER,
      patterns: [
        /\b(set|create|add)\s+(a\s+)?(reminder|alert|notification)\b/i,
        /\b(remind|notify)\s+me\b/i,
      ],
      keywords: [
        { word: 'reminder', weight: 2.0 },
        { word: 'remind', weight: 1.9 },
        { word: 'alert', weight: 1.7 },
      ],
      requiredSlots: [SlotType.DATETIME],
      priority: 9,
    });

    // Social intents
    this.addIntentRule({
      intent: IntentType.SHARE_PROGRESS,
      patterns: [
        /\b(share|post|publish)\s+(my\s+)?(progress|achievement|success)\b/i,
        /\bI\s+want\s+to\s+share\b/i,
      ],
      keywords: [
        { word: 'share', weight: 2.0 },
        { word: 'progress', weight: 1.7 },
        { word: 'post', weight: 1.5 },
      ],
      priority: 7,
    });

    this.addIntentRule({
      intent: IntentType.SEND_MESSAGE,
      patterns: [
        /\b(send|write)\s+(a\s+)?(message|email|note)\b/i,
        /\b(contact|message|reach\s+out\s+to)\s+(my\s+)?(coach|mentor)\b/i,
      ],
      keywords: [
        { word: 'send', weight: 1.6 },
        { word: 'message', weight: 2.0 },
        { word: 'email', weight: 1.7 },
      ],
      priority: 8,
    });

    // Mood and wellbeing intents
    this.addIntentRule({
      intent: IntentType.TRACK_MOOD,
      patterns: [
        /\b(log|track|record)\s+(my\s+)?(mood|feeling|emotion)\b/i,
        /\bI\s+(feel|am\s+feeling)\s+(happy|sad|anxious|stressed|great|terrible)\b/i,
      ],
      keywords: [
        { word: 'mood', weight: 2.0 },
        { word: 'feeling', weight: 1.8 },
        { word: 'emotion', weight: 1.7 },
        { word: 'feel', weight: 1.5 },
      ],
      requiredSlots: [SlotType.MOOD],
      priority: 8,
    });

    this.addIntentRule({
      intent: IntentType.LOG_ACTIVITY,
      patterns: [
        /\b(log|track|record)\s+(an?\s+)?(activity|workout|exercise|task)\b/i,
        /\bI\s+(did|completed|finished)\s+(a|an|my)\s+(activity|workout|exercise)\b/i,
      ],
      keywords: [
        { word: 'log', weight: 1.7 },
        { word: 'activity', weight: 2.0 },
        { word: 'workout', weight: 1.8 },
      ],
      requiredSlots: [SlotType.ACTIVITY],
      priority: 8,
    });

    // Session management intents
    this.addIntentRule({
      intent: IntentType.REVIEW_SESSION,
      patterns: [
        /\b(review|look\s+at|see)\s+(my\s+)?(session|meeting)\b/i,
        /\b(session|meeting)\s+(notes|summary|details)\b/i,
      ],
      keywords: [
        { word: 'review', weight: 1.7 },
        { word: 'session', weight: 2.0 },
        { word: 'notes', weight: 1.6 },
      ],
      priority: 7,
    });

    this.addIntentRule({
      intent: IntentType.RATE_COACH,
      patterns: [
        /\b(rate|review|evaluate)\s+(my\s+)?(coach|mentor|trainer)\b/i,
        /\b(give|leave|provide)\s+(a\s+)?(rating|review|feedback)\s+for\s+(my\s+)?coach\b/i,
      ],
      keywords: [
        { word: 'rate', weight: 2.0 },
        { word: 'review', weight: 1.8 },
        { word: 'coach', weight: 1.9 },
      ],
      requiredSlots: [SlotType.RATING],
      priority: 8,
    });

    // Program management intents
    this.addIntentRule({
      intent: IntentType.JOIN_PROGRAM,
      patterns: [
        /\b(join|enroll\s+in|sign\s+up\s+for)\s+(a|the)\s+(program|course|class)\b/i,
        /\bI\s+want\s+to\s+(join|enroll\s+in)\b/i,
      ],
      keywords: [
        { word: 'join', weight: 2.0 },
        { word: 'enroll', weight: 1.9 },
        { word: 'program', weight: 1.8 },
      ],
      priority: 8,
    });

    this.addIntentRule({
      intent: IntentType.LEAVE_PROGRAM,
      patterns: [
        /\b(leave|quit|exit|unenroll\s+from)\s+(the|my)\s+(program|course|class)\b/i,
        /\bI\s+want\s+to\s+(leave|quit|cancel)\b/i,
      ],
      keywords: [
        { word: 'leave', weight: 2.0 },
        { word: 'quit', weight: 1.9 },
        { word: 'program', weight: 1.7 },
      ],
      priority: 8,
    });

    // Payment and billing intents
    this.addIntentRule({
      intent: IntentType.UPDATE_PAYMENT,
      patterns: [
        /\b(update|change|modify)\s+(my\s+)?(payment|credit\s+card|billing)\b/i,
        /\b(add|remove)\s+(a\s+)?(payment\s+method|credit\s+card)\b/i,
      ],
      keywords: [
        { word: 'payment', weight: 2.0 },
        { word: 'billing', weight: 1.8 },
        { word: 'card', weight: 1.6 },
      ],
      priority: 9,
    });

    this.addIntentRule({
      intent: IntentType.VIEW_BILLING,
      patterns: [
        /\b(view|see|show|check)\s+(my\s+)?(billing|invoice|receipt|payment\s+history)\b/i,
        /\b(how\s+much|what)\s+(do\s+I|did\s+I)\s+(owe|pay|spend)\b/i,
      ],
      keywords: [
        { word: 'billing', weight: 2.0 },
        { word: 'invoice', weight: 1.9 },
        { word: 'payment', weight: 1.7 },
      ],
      priority: 7,
    });

    this.addIntentRule({
      intent: IntentType.REQUEST_REFUND,
      patterns: [
        /\b(request|get|need)\s+(a\s+)?(refund|reimbursement)\b/i,
        /\bI\s+want\s+(my\s+)?(money\s+back|a\s+refund)\b/i,
      ],
      keywords: [
        { word: 'refund', weight: 2.0 },
        { word: 'money', weight: 1.5 },
        { word: 'back', weight: 1.3 },
      ],
      priority: 9,
    });

    // Consultation intent
    this.addIntentRule({
      intent: IntentType.BOOK_CONSULTATION,
      patterns: [
        /\b(book|schedule|arrange)\s+(a\s+)?(consultation|discovery\s+call|intro\s+call)\b/i,
        /\bI\s+want\s+to\s+(book|schedule)\s+a\s+consultation\b/i,
      ],
      keywords: [
        { word: 'consultation', weight: 2.0 },
        { word: 'book', weight: 1.7 },
        { word: 'discovery', weight: 1.6 },
      ],
      priority: 9,
    });

    this.emit('rulesInitialized', { ruleCount: this.intentRules.size });
  }

  /**
   * Add an intent rule
   */
  private addIntentRule(rule: IntentRule): void {
    this.intentRules.set(rule.intent, rule);
  }

  /**
   * Load training data (mock implementation - would load from database in production)
   */
  private async loadTrainingData(): Promise<void> {
    this.trainingData = [
      {
        text: 'I want to create a new goal to run a marathon',
        intent: IntentType.CREATE_GOAL,
        slots: [
          {
            type: SlotType.GOAL_NAME,
            value: 'run a marathon',
            normalizedValue: 'run a marathon',
            confidence: 0.95,
            position: { start: 32, end: 46 },
          },
        ],
      },
      {
        text: 'Log my morning workout',
        intent: IntentType.LOG_ACTIVITY,
        slots: [
          {
            type: SlotType.ACTIVITY,
            value: 'morning workout',
            normalizedValue: 'morning workout',
            confidence: 0.92,
            position: { start: 7, end: 22 },
          },
        ],
      },
      // More training examples would be added here
    ];

    this.emit('trainingDataLoaded', { exampleCount: this.trainingData.length });
  }

  /**
   * Classify user intent from text
   */
  public async classifyIntent(
    text: string,
    context?: ConversationContext
  ): Promise<ClassificationResult> {
    const startTime = Date.now();

    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = await this.getCachedClassification(text, context?.userId);
      if (cached) {
        this.emit('cacheHit', { text, userId: context?.userId });
        return cached;
      }
    }

    // Normalize text
    const normalizedText = this.normalizeText(text);

    // Extract slots (entities)
    const slots = await this.extractSlots(normalizedText);

    // Calculate scores for all intents
    const intentScores = this.calculateIntentScores(normalizedText, slots, context);

    // Sort by confidence
    const sortedIntents = Array.from(intentScores.entries())
      .map(([intentType, score]) => ({
        type: intentType,
        confidence: score,
        slots: this.filterSlotsForIntent(slots, intentType),
        rawText: text,
      }))
      .sort((a, b) => b.confidence - a.confidence);

    // Determine primary and alternative intents
    const primaryIntent = sortedIntents[0] || {
      type: IntentType.UNKNOWN,
      confidence: 0,
      slots: [],
      rawText: text,
    };

    const alternativeIntents = sortedIntents
      .slice(1)
      .filter((intent) => intent.confidence >= this.config.multiIntentThreshold)
      .slice(0, this.config.maxAlternatives);

    const isMultiIntent = alternativeIntents.length > 0;

    // Get intent suggestions
    const suggestions = await this.suggestNextIntents(
      primaryIntent.type,
      context
    );

    const result: ClassificationResult = {
      primaryIntent,
      alternativeIntents,
      isMultiIntent,
      context,
      suggestions,
      timestamp: new Date(),
    };

    // Cache result
    if (this.config.cacheEnabled) {
      await this.cacheClassification(text, context?.userId, result);
    }

    // Track history
    if (context?.userId) {
      await this.trackIntentHistory(context.userId, primaryIntent.type);
    }

    const duration = Date.now() - startTime;
    this.emit('intentClassified', {
      intent: primaryIntent.type,
      confidence: primaryIntent.confidence,
      duration,
    });

    return result;
  }

  /**
   * Calculate intent scores
   */
  private calculateIntentScores(
    text: string,
    slots: Slot[],
    context?: ConversationContext
  ): Map<IntentType, number> {
    const scores = new Map<IntentType, number>();

    for (const [intentType, rule] of this.intentRules.entries()) {
      let score = 0;

      // Pattern matching
      for (const pattern of rule.patterns) {
        if (pattern.test(text)) {
          score += 0.4;
          break;
        }
      }

      // Keyword matching
      const keywordScore = this.calculateKeywordScore(text, rule.keywords);
      score += keywordScore * 0.3;

      // Slot matching
      if (rule.requiredSlots) {
        const slotTypes = slots.map((s) => s.type);
        const hasRequiredSlots = rule.requiredSlots.every((required) =>
          slotTypes.includes(required)
        );
        if (hasRequiredSlots) {
          score += 0.2;
        }
      }

      // Context-aware scoring
      if (this.config.enableContextAwareness && context) {
        const contextScore = this.calculateContextScore(
          intentType,
          rule,
          context
        );
        score += contextScore * 0.1;
      }

      // Personalization
      if (this.config.enablePersonalization && context?.userId) {
        const personalizationScore = this.calculatePersonalizationScore(
          intentType,
          context.userId
        );
        score += personalizationScore * 0.1;
      }

      // Priority adjustment
      score *= rule.priority / 10;

      scores.set(intentType, Math.min(score, 1.0));
    }

    return scores;
  }

  /**
   * Calculate keyword score
   */
  private calculateKeywordScore(
    text: string,
    keywords: { word: string; weight: number }[]
  ): number {
    const words = text.toLowerCase().split(/\s+/);
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const { word, weight } of keywords) {
      maxPossibleScore += weight;
      if (words.includes(word.toLowerCase())) {
        totalScore += weight;
      }
    }

    return maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
  }

  /**
   * Calculate context score
   */
  private calculateContextScore(
    intentType: IntentType,
    rule: IntentRule,
    context: ConversationContext
  ): number {
    if (!context.previousIntents || context.previousIntents.length === 0) {
      return 0;
    }

    // Check if intent follows logically from previous intents
    const previousIntent = context.previousIntents[context.previousIntents.length - 1];

    if (rule.contextDependencies?.includes(previousIntent)) {
      return 1.0;
    }

    // Penalize if same intent was just used
    if (previousIntent === intentType) {
      return -0.2;
    }

    return 0;
  }

  /**
   * Calculate personalization score
   */
  private calculatePersonalizationScore(
    intentType: IntentType,
    userId: string
  ): number {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return 0;
    }

    // Calculate frequency of this intent in user's history
    const intentCount = profile.intentHistory.filter(
      (entry) => entry.intent === intentType
    ).length;
    const totalIntents = profile.intentHistory.length;

    if (totalIntents === 0) {
      return 0;
    }

    const frequency = intentCount / totalIntents;

    // Bonus for frequently used intents
    return frequency > 0.1 ? frequency * 0.5 : 0;
  }

  /**
   * Extract slots (entities) from text
   */
  private async extractSlots(text: string): Promise<Slot[]> {
    const slots: Slot[] = [];

    // Date and time extraction
    slots.push(...this.extractDateTimeSlots(text));

    // Email extraction
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    let match;
    while ((match = emailRegex.exec(text)) !== null) {
      slots.push({
        type: SlotType.EMAIL,
        value: match[0],
        normalizedValue: match[0].toLowerCase(),
        confidence: 0.95,
        position: { start: match.index, end: emailRegex.lastIndex },
      });
    }

    // Phone number extraction
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    while ((match = phoneRegex.exec(text)) !== null) {
      slots.push({
        type: SlotType.PHONE,
        value: match[0],
        normalizedValue: match[0].replace(/[-.]/, ''),
        confidence: 0.9,
        position: { start: match.index, end: phoneRegex.lastIndex },
      });
    }

    // URL extraction
    const urlRegex = /https?:\/\/[^\s]+/g;
    while ((match = urlRegex.exec(text)) !== null) {
      slots.push({
        type: SlotType.URL,
        value: match[0],
        normalizedValue: match[0],
        confidence: 0.95,
        position: { start: match.index, end: urlRegex.lastIndex },
      });
    }

    // Number extraction
    const numberRegex = /\b\d+(\.\d+)?\b/g;
    while ((match = numberRegex.exec(text)) !== null) {
      slots.push({
        type: SlotType.AMOUNT,
        value: match[0],
        normalizedValue: parseFloat(match[0]),
        confidence: 0.85,
        position: { start: match.index, end: numberRegex.lastIndex },
      });
    }

    // Percentage extraction
    const percentRegex = /\b\d+(\.\d+)?%/g;
    while ((match = percentRegex.exec(text)) !== null) {
      slots.push({
        type: SlotType.PERCENTAGE,
        value: match[0],
        normalizedValue: parseFloat(match[0].replace('%', '')) / 100,
        confidence: 0.9,
        position: { start: match.index, end: percentRegex.lastIndex },
      });
    }

    // Mood extraction
    const moodKeywords = ['happy', 'sad', 'anxious', 'stressed', 'great', 'terrible', 'okay', 'fine', 'angry', 'excited'];
    for (const mood of moodKeywords) {
      const moodRegex = new RegExp(`\\b${mood}\\b`, 'gi');
      while ((match = moodRegex.exec(text)) !== null) {
        slots.push({
          type: SlotType.MOOD,
          value: match[0],
          normalizedValue: mood,
          confidence: 0.8,
          position: { start: match.index, end: moodRegex.lastIndex },
        });
      }
    }

    // Rating extraction (1-5 stars, out of 10, etc.)
    const ratingRegex = /\b([1-5])\s*(?:stars?|\/5)\b|\b(\d+)\s*(?:out of|\/)\s*10\b/gi;
    while ((match = ratingRegex.exec(text)) !== null) {
      const rating = match[1] ? parseInt(match[1]) : parseInt(match[2]) / 2;
      slots.push({
        type: SlotType.RATING,
        value: match[0],
        normalizedValue: rating,
        confidence: 0.9,
        position: { start: match.index, end: ratingRegex.lastIndex },
      });
    }

    return slots;
  }

  /**
   * Extract date and time slots
   */
  private extractDateTimeSlots(text: string): Slot[] {
    const slots: Slot[] = [];

    // Relative dates
    const relativeDatePatterns = [
      { pattern: /\btoday\b/i, offset: 0 },
      { pattern: /\btomorrow\b/i, offset: 1 },
      { pattern: /\byesterday\b/i, offset: -1 },
      { pattern: /\bnext week\b/i, offset: 7 },
      { pattern: /\blast week\b/i, offset: -7 },
      { pattern: /\bin (\d+) days?\b/i, offset: null },
    ];

    for (const { pattern, offset } of relativeDatePatterns) {
      const match = pattern.exec(text);
      if (match) {
        const actualOffset = offset !== null ? offset : parseInt(match[1]);
        const date = new Date();
        date.setDate(date.getDate() + actualOffset);

        slots.push({
          type: SlotType.DATE,
          value: match[0],
          normalizedValue: date.toISOString().split('T')[0],
          confidence: 0.9,
          position: { start: match.index, end: pattern.lastIndex },
        });
      }
    }

    // Time patterns
    const timePatterns = [
      /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/gi,
      /\bat\s+(\d{1,2})\s*(am|pm)\b/gi,
    ];

    for (const pattern of timePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        slots.push({
          type: SlotType.TIME,
          value: match[0],
          normalizedValue: match[0],
          confidence: 0.85,
          position: { start: match.index, end: pattern.lastIndex },
        });
      }
    }

    // Absolute dates (MM/DD/YYYY, DD-MM-YYYY, etc.)
    const dateRegex = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g;
    let match;
    while ((match = dateRegex.exec(text)) !== null) {
      slots.push({
        type: SlotType.DATE,
        value: match[0],
        normalizedValue: match[0],
        confidence: 0.9,
        position: { start: match.index, end: dateRegex.lastIndex },
      });
    }

    // Duration
    const durationRegex = /\b(\d+)\s*(minutes?|hours?|days?|weeks?|months?)\b/gi;
    while ((match = durationRegex.exec(text)) !== null) {
      slots.push({
        type: SlotType.DURATION,
        value: match[0],
        normalizedValue: match[0],
        confidence: 0.85,
        position: { start: match.index, end: durationRegex.lastIndex },
      });
    }

    return slots;
  }

  /**
   * Filter slots relevant to an intent
   */
  private filterSlotsForIntent(slots: Slot[], intentType: IntentType): Slot[] {
    const rule = this.intentRules.get(intentType);
    if (!rule?.requiredSlots) {
      return slots;
    }

    return slots.filter((slot) => rule.requiredSlots?.includes(slot.type));
  }

  /**
   * Normalize text for processing
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Suggest next likely intents based on context
   */
  private async suggestNextIntents(
    currentIntent: IntentType,
    context?: ConversationContext
  ): Promise<IntentType[]> {
    // Define intent sequences
    const intentSequences: Record<IntentType, IntentType[]> = {
      [IntentType.CREATE_GOAL]: [
        IntentType.SET_REMINDER,
        IntentType.SCHEDULE_SESSION,
        IntentType.CREATE_HABIT,
      ],
      [IntentType.TRACK_HABIT]: [
        IntentType.CHECK_PROGRESS,
        IntentType.TRACK_MOOD,
        IntentType.LOG_ACTIVITY,
      ],
      [IntentType.CHECK_PROGRESS]: [
        IntentType.VIEW_ANALYTICS,
        IntentType.SHARE_PROGRESS,
        IntentType.SCHEDULE_SESSION,
      ],
      [IntentType.SCHEDULE_SESSION]: [
        IntentType.SET_REMINDER,
        IntentType.SEND_MESSAGE,
      ],
      [IntentType.CANCEL_APPOINTMENT]: [
        IntentType.RESCHEDULE_APPOINTMENT,
        IntentType.SEND_MESSAGE,
      ],
      // Add more sequences as needed
    };

    return intentSequences[currentIntent] || [];
  }

  /**
   * Track intent in user's history
   */
  private async trackIntentHistory(
    userId: string,
    intent: IntentType
  ): Promise<void> {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = {
        userId,
        preferences: {},
        intentHistory: [],
        personalizedPatterns: [],
      };
      this.userProfiles.set(userId, profile);
    }

    profile.intentHistory.push({
      intent,
      timestamp: new Date(),
      success: true,
    });

    // Keep only last 100 entries
    if (profile.intentHistory.length > 100) {
      profile.intentHistory = profile.intentHistory.slice(-100);
    }

    // Store in Redis
    const key = `intent:history:${userId}`;
    await this.redis.lpush(key, JSON.stringify({ intent, timestamp: new Date() }));
    await this.redis.ltrim(key, 0, 99);
    await this.redis.expire(key, 86400 * 30); // 30 days

    this.emit('intentTracked', { userId, intent });
  }

  /**
   * Get cached classification
   */
  private async getCachedClassification(
    text: string,
    userId?: string
  ): Promise<ClassificationResult | null> {
    const key = `intent:cache:${userId || 'anonymous'}:${this.hashText(text)}`;
    const cached = await this.redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  /**
   * Cache classification result
   */
  private async cacheClassification(
    text: string,
    userId: string | undefined,
    result: ClassificationResult
  ): Promise<void> {
    const key = `intent:cache:${userId || 'anonymous'}:${this.hashText(text)}`;
    await this.redis.setex(
      key,
      this.config.cacheTTL,
      JSON.stringify(result)
    );
  }

  /**
   * Hash text for cache key
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Add training example
   */
  public async addTrainingExample(example: TrainingExample): Promise<void> {
    this.trainingData.push(example);

    // Store in database (would be PostgreSQL in production)
    const key = `intent:training:${uuidv4()}`;
    await this.redis.set(key, JSON.stringify(example));

    this.emit('trainingExampleAdded', { example });
  }

  /**
   * Improve intent model based on feedback
   */
  public async improveModel(
    text: string,
    correctIntent: IntentType,
    predictedIntent: IntentType
  ): Promise<void> {
    // Add as training example
    await this.addTrainingExample({
      text,
      intent: correctIntent,
      slots: [],
      metadata: {
        predictedIntent,
        correctionTimestamp: new Date(),
      },
    });

    this.emit('modelImproved', { text, correctIntent, predictedIntent });
  }

  /**
   * Get intent statistics
   */
  public async getIntentStatistics(userId?: string): Promise<any> {
    if (!userId) {
      return {
        totalIntents: this.intentRules.size,
        trainingExamples: this.trainingData.length,
      };
    }

    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return null;
    }

    const intentCounts = profile.intentHistory.reduce((acc, entry) => {
      acc[entry.intent] = (acc[entry.intent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalIntents: profile.intentHistory.length,
      uniqueIntents: Object.keys(intentCounts).length,
      mostFrequent: Object.entries(intentCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
      successRate:
        profile.intentHistory.filter((e) => e.success).length /
        profile.intentHistory.length,
    };
  }

  /**
   * Predict next intent
   */
  public async predictNextIntent(
    context: ConversationContext
  ): Promise<{ intent: IntentType; confidence: number }[]> {
    if (!context.previousIntents || context.previousIntents.length === 0) {
      return [];
    }

    const lastIntent = context.previousIntents[context.previousIntents.length - 1];
    const suggestions = await this.suggestNextIntents(lastIntent, context);

    return suggestions.map((intent, index) => ({
      intent,
      confidence: 1.0 - index * 0.2,
    }));
  }

  /**
   * Handle unknown intent
   */
  public async handleUnknownIntent(
    text: string,
    context?: ConversationContext
  ): Promise<string> {
    // Log for analysis
    const key = `intent:unknown:${uuidv4()}`;
    await this.redis.lpush(
      'intent:unknown:queue',
      JSON.stringify({
        id: key,
        text,
        context,
        timestamp: new Date(),
      })
    );

    this.emit('unknownIntent', { text, context });

    return "I'm not sure what you're asking for. Could you rephrase that?";
  }
}
