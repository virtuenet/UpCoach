import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

/**
 * Entity Extraction Service
 *
 * Production-ready named entity recognition and extraction system.
 * Supports multiple entity types with linking, disambiguation, and
 * co-reference resolution.
 */

// Entity types enum
export enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  LOCATION = 'location',
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  DURATION = 'duration',
  NUMBER = 'number',
  MONEY = 'money',
  PERCENTAGE = 'percentage',
  GOAL = 'goal',
  HABIT = 'habit',
  SKILL = 'skill',
  EMOTION = 'emotion',
  ACTIVITY = 'activity',
  EVENT = 'event',
  PRODUCT = 'product',
  SERVICE = 'service',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
}

export interface Entity {
  id: string;
  type: EntityType;
  text: string;
  normalizedValue: any;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
  metadata?: Record<string, any>;
  linkedEntity?: LinkedEntity;
  relationships?: EntityRelationship[];
}

export interface LinkedEntity {
  id: string;
  type: EntityType;
  canonicalName: string;
  description?: string;
  attributes?: Record<string, any>;
  source: string;
}

export interface EntityRelationship {
  type: RelationType;
  sourceEntityId: string;
  targetEntityId: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export enum RelationType {
  HAS = 'has',
  BELONGS_TO = 'belongs_to',
  CREATED_BY = 'created_by',
  ASSIGNED_TO = 'assigned_to',
  RELATED_TO = 'related_to',
  PART_OF = 'part_of',
  LOCATED_IN = 'located_in',
  WORKS_FOR = 'works_for',
  MANAGES = 'manages',
  DEPENDS_ON = 'depends_on',
}

export interface ExtractionResult {
  entities: Entity[];
  relationships: EntityRelationship[];
  coreferences: CoreferenceChain[];
  temporalExpressions: TemporalExpression[];
  text: string;
  timestamp: Date;
}

export interface CoreferenceChain {
  id: string;
  mentions: CoreferenceMention[];
  canonicalMention: CoreferenceMention;
}

export interface CoreferenceMention {
  text: string;
  entityType: EntityType;
  position: {
    start: number;
    end: number;
  };
}

export interface TemporalExpression {
  text: string;
  normalizedValue: Date | { start: Date; end: Date };
  type: 'absolute' | 'relative' | 'duration';
  position: {
    start: number;
    end: number;
  };
}

interface EntityPattern {
  type: EntityType;
  patterns: RegExp[];
  validator?: (match: string) => boolean;
  normalizer?: (match: string) => any;
  priority: number;
}

interface KnowledgeBase {
  persons: Map<string, LinkedEntity>;
  organizations: Map<string, LinkedEntity>;
  locations: Map<string, LinkedEntity>;
  skills: Map<string, LinkedEntity>;
  emotions: Map<string, LinkedEntity>;
  activities: Map<string, LinkedEntity>;
}

interface EntityExtractionConfig {
  enableLinking: boolean;
  enableDisambiguation: boolean;
  enableCoreference: boolean;
  enableRelationExtraction: boolean;
  cacheEnabled: boolean;
  cacheTTL: number;
  confidenceThreshold: number;
}

export class EntityExtractionService extends EventEmitter {
  private redis: Redis;
  private config: EntityExtractionConfig;
  private entityPatterns: EntityPattern[];
  private knowledgeBase: KnowledgeBase;
  private gazetteers: Map<EntityType, Set<string>>;

  constructor(redisClient: Redis, config?: Partial<EntityExtractionConfig>) {
    super();
    this.redis = redisClient;
    this.config = {
      enableLinking: true,
      enableDisambiguation: true,
      enableCoreference: true,
      enableRelationExtraction: true,
      cacheEnabled: true,
      cacheTTL: 3600,
      confidenceThreshold: 0.5,
      ...config,
    };

    this.entityPatterns = [];
    this.knowledgeBase = {
      persons: new Map(),
      organizations: new Map(),
      locations: new Map(),
      skills: new Map(),
      emotions: new Map(),
      activities: new Map(),
    };
    this.gazetteers = new Map();

    this.initializeEntityPatterns();
    this.initializeKnowledgeBase();
    this.initializeGazetteers();
  }

  /**
   * Initialize entity extraction patterns
   */
  private initializeEntityPatterns(): void {
    // Email pattern
    this.entityPatterns.push({
      type: EntityType.EMAIL,
      patterns: [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g],
      validator: (match) => match.includes('@') && match.includes('.'),
      normalizer: (match) => match.toLowerCase(),
      priority: 10,
    });

    // Phone number pattern
    this.entityPatterns.push({
      type: EntityType.PHONE,
      patterns: [
        /\b(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g,
        /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      ],
      normalizer: (match) => match.replace(/[-.()\s]/g, ''),
      priority: 9,
    });

    // URL pattern
    this.entityPatterns.push({
      type: EntityType.URL,
      patterns: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g,
      ],
      priority: 10,
    });

    // Date patterns
    this.entityPatterns.push({
      type: EntityType.DATE,
      patterns: [
        /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g,
        /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
        /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
        /\b(today|tomorrow|yesterday)\b/gi,
        /\bnext\s+(week|month|year|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi,
        /\blast\s+(week|month|year|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi,
      ],
      normalizer: (match) => this.normalizeDate(match),
      priority: 8,
    });

    // Time patterns
    this.entityPatterns.push({
      type: EntityType.TIME,
      patterns: [
        /\b(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?\b/g,
        /\bat\s+(\d{1,2})\s*(am|pm|AM|PM)\b/gi,
        /\b(morning|afternoon|evening|night|noon|midnight)\b/gi,
      ],
      normalizer: (match) => this.normalizeTime(match),
      priority: 8,
    });

    // Duration patterns
    this.entityPatterns.push({
      type: EntityType.DURATION,
      patterns: [
        /\b(\d+)\s*(minutes?|mins?|hours?|hrs?|days?|weeks?|months?|years?)\b/gi,
      ],
      normalizer: (match) => this.normalizeDuration(match),
      priority: 7,
    });

    // Money patterns
    this.entityPatterns.push({
      type: EntityType.MONEY,
      patterns: [
        /\$\s*\d+(?:,\d{3})*(?:\.\d{2})?/g,
        /\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD|EUR|GBP)\b/gi,
      ],
      normalizer: (match) => this.normalizeMoney(match),
      priority: 9,
    });

    // Percentage patterns
    this.entityPatterns.push({
      type: EntityType.PERCENTAGE,
      patterns: [/\b\d+(?:\.\d+)?%/g, /\b\d+(?:\.\d+)?\s*percent\b/gi],
      normalizer: (match) => parseFloat(match.replace(/[%percent]/gi, '')) / 100,
      priority: 8,
    });

    // Number patterns
    this.entityPatterns.push({
      type: EntityType.NUMBER,
      patterns: [/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g],
      normalizer: (match) => parseFloat(match.replace(/,/g, '')),
      priority: 5,
    });

    // Person name patterns (capitalized words)
    this.entityPatterns.push({
      type: EntityType.PERSON,
      patterns: [
        /\b(?:Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g,
        /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
      ],
      validator: (match) => this.isLikelyPersonName(match),
      priority: 6,
    });

    // Location patterns
    this.entityPatterns.push({
      type: EntityType.LOCATION,
      patterns: [
        /\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
        /\bat\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      ],
      validator: (match) => this.isLikelyLocation(match),
      priority: 5,
    });

    // Organization patterns
    this.entityPatterns.push({
      type: EntityType.ORGANIZATION,
      patterns: [
        /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Inc\.?|LLC|Corp\.?|Ltd\.?|Company|Organization)\b/g,
      ],
      priority: 7,
    });

    // Emotion patterns
    this.entityPatterns.push({
      type: EntityType.EMOTION,
      patterns: [
        /\b(happy|sad|angry|frustrated|excited|anxious|stressed|calm|peaceful|worried|confident|nervous|joyful|depressed|motivated|discouraged|hopeful|hopeless|grateful|resentful)\b/gi,
      ],
      normalizer: (match) => match.toLowerCase(),
      priority: 7,
    });

    // Activity patterns
    this.entityPatterns.push({
      type: EntityType.ACTIVITY,
      patterns: [
        /\b(running|walking|swimming|cycling|yoga|meditation|reading|writing|studying|working|exercising|training|practicing)\b/gi,
      ],
      normalizer: (match) => match.toLowerCase(),
      priority: 6,
    });

    // Skill patterns
    this.entityPatterns.push({
      type: EntityType.SKILL,
      patterns: [
        /\b(leadership|communication|problem-solving|teamwork|creativity|adaptability|critical thinking|time management|emotional intelligence|decision making)\b/gi,
      ],
      normalizer: (match) => match.toLowerCase(),
      priority: 6,
    });

    this.emit('patternsInitialized', { patternCount: this.entityPatterns.length });
  }

  /**
   * Initialize knowledge base with common entities
   */
  private initializeKnowledgeBase(): void {
    // Common emotions
    const emotions = ['happy', 'sad', 'angry', 'anxious', 'excited', 'calm', 'stressed'];
    emotions.forEach((emotion) => {
      this.knowledgeBase.emotions.set(emotion, {
        id: `emotion-${emotion}`,
        type: EntityType.EMOTION,
        canonicalName: emotion,
        description: `Emotion: ${emotion}`,
        source: 'builtin',
      });
    });

    // Common activities
    const activities = ['running', 'walking', 'yoga', 'meditation', 'reading', 'writing'];
    activities.forEach((activity) => {
      this.knowledgeBase.activities.set(activity, {
        id: `activity-${activity}`,
        type: EntityType.ACTIVITY,
        canonicalName: activity,
        description: `Activity: ${activity}`,
        source: 'builtin',
      });
    });

    // Common skills
    const skills = ['leadership', 'communication', 'teamwork', 'creativity'];
    skills.forEach((skill) => {
      this.knowledgeBase.skills.set(skill, {
        id: `skill-${skill}`,
        type: EntityType.SKILL,
        canonicalName: skill,
        description: `Skill: ${skill}`,
        source: 'builtin',
      });
    });

    this.emit('knowledgeBaseInitialized', {
      emotions: this.knowledgeBase.emotions.size,
      activities: this.knowledgeBase.activities.size,
      skills: this.knowledgeBase.skills.size,
    });
  }

  /**
   * Initialize gazetteers (dictionaries of known entities)
   */
  private initializeGazetteers(): void {
    // Common first names
    this.gazetteers.set(
      EntityType.PERSON,
      new Set([
        'john',
        'jane',
        'michael',
        'sarah',
        'david',
        'emily',
        'james',
        'mary',
        'robert',
        'jennifer',
      ])
    );

    // Common cities
    this.gazetteers.set(
      EntityType.LOCATION,
      new Set([
        'new york',
        'london',
        'paris',
        'tokyo',
        'sydney',
        'san francisco',
        'los angeles',
        'chicago',
        'boston',
        'seattle',
      ])
    );

    // Common organizations
    this.gazetteers.set(
      EntityType.ORGANIZATION,
      new Set(['google', 'microsoft', 'apple', 'amazon', 'facebook', 'netflix'])
    );
  }

  /**
   * Extract entities from text
   */
  public async extractEntities(text: string): Promise<ExtractionResult> {
    const startTime = Date.now();

    // Check cache
    if (this.config.cacheEnabled) {
      const cached = await this.getCachedExtraction(text);
      if (cached) {
        this.emit('cacheHit', { text });
        return cached;
      }
    }

    // Extract all entities using patterns
    const entities = await this.extractWithPatterns(text);

    // Extract relationships if enabled
    let relationships: EntityRelationship[] = [];
    if (this.config.enableRelationExtraction) {
      relationships = await this.extractRelationships(text, entities);
    }

    // Resolve coreferences if enabled
    let coreferences: CoreferenceChain[] = [];
    if (this.config.enableCoreference) {
      coreferences = await this.resolveCoreferences(text, entities);
    }

    // Extract temporal expressions
    const temporalExpressions = await this.extractTemporalExpressions(text);

    // Link entities to knowledge base if enabled
    if (this.config.enableLinking) {
      await this.linkEntities(entities);
    }

    // Disambiguate entities if enabled
    if (this.config.enableDisambiguation) {
      await this.disambiguateEntities(entities);
    }

    const result: ExtractionResult = {
      entities: entities.filter((e) => e.confidence >= this.config.confidenceThreshold),
      relationships,
      coreferences,
      temporalExpressions,
      text,
      timestamp: new Date(),
    };

    // Cache result
    if (this.config.cacheEnabled) {
      await this.cacheExtraction(text, result);
    }

    const duration = Date.now() - startTime;
    this.emit('entitiesExtracted', {
      entityCount: result.entities.length,
      duration,
    });

    return result;
  }

  /**
   * Extract entities using pattern matching
   */
  private async extractWithPatterns(text: string): Promise<Entity[]> {
    const entities: Entity[] = [];
    const seenPositions = new Set<string>();

    // Sort patterns by priority
    const sortedPatterns = [...this.entityPatterns].sort(
      (a, b) => b.priority - a.priority
    );

    for (const pattern of sortedPatterns) {
      for (const regex of pattern.patterns) {
        let match;
        const globalRegex = new RegExp(regex.source, regex.flags);

        while ((match = globalRegex.exec(text)) !== null) {
          const positionKey = `${match.index}-${globalRegex.lastIndex}`;

          // Skip if this position was already matched by higher priority pattern
          if (seenPositions.has(positionKey)) {
            continue;
          }

          const matchText = match[0];

          // Validate if validator exists
          if (pattern.validator && !pattern.validator(matchText)) {
            continue;
          }

          seenPositions.add(positionKey);

          entities.push({
            id: uuidv4(),
            type: pattern.type,
            text: matchText,
            normalizedValue: pattern.normalizer
              ? pattern.normalizer(matchText)
              : matchText,
            confidence: this.calculateConfidence(pattern.type, matchText),
            position: {
              start: match.index,
              end: globalRegex.lastIndex,
            },
          });
        }
      }
    }

    return entities;
  }

  /**
   * Extract relationships between entities
   */
  private async extractRelationships(
    text: string,
    entities: Entity[]
  ): Promise<EntityRelationship[]> {
    const relationships: EntityRelationship[] = [];

    // Define relationship patterns
    const relationshipPatterns = [
      {
        pattern: /(.+)\s+(?:has|owns|possesses)\s+(.+)/i,
        type: RelationType.HAS,
      },
      {
        pattern: /(.+)\s+(?:belongs to|is part of)\s+(.+)/i,
        type: RelationType.BELONGS_TO,
      },
      {
        pattern: /(.+)\s+(?:created by|made by|developed by)\s+(.+)/i,
        type: RelationType.CREATED_BY,
      },
      {
        pattern: /(.+)\s+(?:assigned to|delegated to)\s+(.+)/i,
        type: RelationType.ASSIGNED_TO,
      },
      {
        pattern: /(.+)\s+(?:works for|employed by)\s+(.+)/i,
        type: RelationType.WORKS_FOR,
      },
      {
        pattern: /(.+)\s+(?:manages|supervises|leads)\s+(.+)/i,
        type: RelationType.MANAGES,
      },
    ];

    for (const { pattern, type } of relationshipPatterns) {
      const match = pattern.exec(text);
      if (match) {
        const sourceText = match[1].trim();
        const targetText = match[2].trim();

        const sourceEntity = entities.find((e) => sourceText.includes(e.text));
        const targetEntity = entities.find((e) => targetText.includes(e.text));

        if (sourceEntity && targetEntity) {
          relationships.push({
            type,
            sourceEntityId: sourceEntity.id,
            targetEntityId: targetEntity.id,
            confidence: 0.7,
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Resolve coreferences (pronouns to entities)
   */
  private async resolveCoreferences(
    text: string,
    entities: Entity[]
  ): Promise<CoreferenceChain[]> {
    const chains: CoreferenceChain[] = [];

    // Find pronouns
    const pronounPatterns = [
      /\b(he|him|his)\b/gi,
      /\b(she|her|hers)\b/gi,
      /\b(they|them|their|theirs)\b/gi,
      /\b(it|its)\b/gi,
    ];

    const personEntities = entities.filter((e) => e.type === EntityType.PERSON);

    for (const entity of personEntities) {
      const mentions: CoreferenceMention[] = [
        {
          text: entity.text,
          entityType: entity.type,
          position: entity.position,
        },
      ];

      // Find pronouns after this entity
      for (const pattern of pronounPatterns) {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);

        while ((match = regex.exec(text)) !== null) {
          if (match.index > entity.position.end) {
            mentions.push({
              text: match[0],
              entityType: EntityType.PERSON,
              position: {
                start: match.index,
                end: regex.lastIndex,
              },
            });
          }
        }
      }

      if (mentions.length > 1) {
        chains.push({
          id: uuidv4(),
          mentions,
          canonicalMention: mentions[0],
        });
      }
    }

    return chains;
  }

  /**
   * Extract temporal expressions
   */
  private async extractTemporalExpressions(
    text: string
  ): Promise<TemporalExpression[]> {
    const expressions: TemporalExpression[] = [];

    // Relative dates
    const relativeDatePatterns = [
      { pattern: /\btoday\b/i, offset: 0, type: 'relative' as const },
      { pattern: /\btomorrow\b/i, offset: 1, type: 'relative' as const },
      { pattern: /\byesterday\b/i, offset: -1, type: 'relative' as const },
      { pattern: /\bnext week\b/i, offset: 7, type: 'relative' as const },
      { pattern: /\blast week\b/i, offset: -7, type: 'relative' as const },
    ];

    for (const { pattern, offset, type } of relativeDatePatterns) {
      const match = pattern.exec(text);
      if (match) {
        const date = new Date();
        date.setDate(date.getDate() + offset);

        expressions.push({
          text: match[0],
          normalizedValue: date,
          type,
          position: {
            start: match.index,
            end: pattern.lastIndex,
          },
        });
      }
    }

    return expressions;
  }

  /**
   * Link entities to knowledge base
   */
  private async linkEntities(entities: Entity[]): Promise<void> {
    for (const entity of entities) {
      const normalizedText = entity.text.toLowerCase();

      let linkedEntity: LinkedEntity | undefined;

      switch (entity.type) {
        case EntityType.EMOTION:
          linkedEntity = this.knowledgeBase.emotions.get(normalizedText);
          break;
        case EntityType.ACTIVITY:
          linkedEntity = this.knowledgeBase.activities.get(normalizedText);
          break;
        case EntityType.SKILL:
          linkedEntity = this.knowledgeBase.skills.get(normalizedText);
          break;
        case EntityType.PERSON:
          linkedEntity = this.knowledgeBase.persons.get(normalizedText);
          break;
        case EntityType.ORGANIZATION:
          linkedEntity = this.knowledgeBase.organizations.get(normalizedText);
          break;
        case EntityType.LOCATION:
          linkedEntity = this.knowledgeBase.locations.get(normalizedText);
          break;
      }

      if (linkedEntity) {
        entity.linkedEntity = linkedEntity;
        entity.confidence = Math.min(entity.confidence + 0.1, 1.0);
      }
    }
  }

  /**
   * Disambiguate entities with same text but different types
   */
  private async disambiguateEntities(entities: Entity[]): Promise<void> {
    // Group entities by text
    const entityGroups = new Map<string, Entity[]>();

    for (const entity of entities) {
      const key = entity.text.toLowerCase();
      if (!entityGroups.has(key)) {
        entityGroups.set(key, []);
      }
      entityGroups.get(key)!.push(entity);
    }

    // Disambiguate groups with multiple entities
    for (const [text, group] of entityGroups.entries()) {
      if (group.length <= 1) {
        continue;
      }

      // Sort by confidence
      group.sort((a, b) => b.confidence - a.confidence);

      // Keep highest confidence, reduce others
      for (let i = 1; i < group.length; i++) {
        group[i].confidence *= 0.5;
      }
    }
  }

  /**
   * Calculate confidence score for entity
   */
  private calculateConfidence(type: EntityType, text: string): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence for gazetteer matches
    const gazetteer = this.gazetteers.get(type);
    if (gazetteer?.has(text.toLowerCase())) {
      confidence += 0.2;
    }

    // Increase confidence for certain types
    switch (type) {
      case EntityType.EMAIL:
      case EntityType.URL:
      case EntityType.PHONE:
        confidence = 0.95;
        break;
      case EntityType.DATE:
      case EntityType.TIME:
      case EntityType.MONEY:
        confidence = 0.9;
        break;
      case EntityType.PERCENTAGE:
      case EntityType.NUMBER:
        confidence = 0.85;
        break;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Normalize date text to ISO format
   */
  private normalizeDate(text: string): string {
    const lowerText = text.toLowerCase();

    if (lowerText === 'today') {
      return new Date().toISOString().split('T')[0];
    } else if (lowerText === 'tomorrow') {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return date.toISOString().split('T')[0];
    } else if (lowerText === 'yesterday') {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      return date.toISOString().split('T')[0];
    }

    // Try to parse as standard date
    const date = new Date(text);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    return text;
  }

  /**
   * Normalize time text to 24-hour format
   */
  private normalizeTime(text: string): string {
    const match = /(\d{1,2}):?(\d{2})?\s*(am|pm)?/i.exec(text);
    if (!match) {
      return text;
    }

    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const meridiem = match[3]?.toLowerCase();

    if (meridiem === 'pm' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Normalize duration to minutes
   */
  private normalizeDuration(text: string): number {
    const match = /(\d+)\s*(minutes?|mins?|hours?|hrs?|days?|weeks?|months?|years?)/i.exec(
      text
    );
    if (!match) {
      return 0;
    }

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    const multipliers: Record<string, number> = {
      minute: 1,
      minutes: 1,
      min: 1,
      mins: 1,
      hour: 60,
      hours: 60,
      hr: 60,
      hrs: 60,
      day: 1440,
      days: 1440,
      week: 10080,
      weeks: 10080,
      month: 43200,
      months: 43200,
      year: 525600,
      years: 525600,
    };

    return value * (multipliers[unit] || 1);
  }

  /**
   * Normalize money to numeric value
   */
  private normalizeMoney(text: string): { amount: number; currency: string } {
    const cleaned = text.replace(/[$,\s]/g, '');
    const match = /([\d.]+)\s*(dollars?|USD|EUR|GBP)?/i.exec(cleaned);

    if (!match) {
      return { amount: 0, currency: 'USD' };
    }

    return {
      amount: parseFloat(match[1]),
      currency: match[2]?.toUpperCase() || 'USD',
    };
  }

  /**
   * Check if text is likely a person name
   */
  private isLikelyPersonName(text: string): boolean {
    // Check gazetteer
    const firstName = text.split(/\s+/)[0].toLowerCase();
    const gazetteer = this.gazetteers.get(EntityType.PERSON);
    if (gazetteer?.has(firstName)) {
      return true;
    }

    // Check for title
    if (/^(Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?)\s+/i.test(text)) {
      return true;
    }

    // Heuristic: 2 capitalized words
    const words = text.split(/\s+/);
    return words.length >= 2 && words.every((w) => /^[A-Z][a-z]+$/.test(w));
  }

  /**
   * Check if text is likely a location
   */
  private isLikelyLocation(text: string): boolean {
    const normalized = text.toLowerCase();
    const gazetteer = this.gazetteers.get(EntityType.LOCATION);
    return gazetteer?.has(normalized) || false;
  }

  /**
   * Get cached extraction
   */
  private async getCachedExtraction(text: string): Promise<ExtractionResult | null> {
    const key = `entity:cache:${this.hashText(text)}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Cache extraction result
   */
  private async cacheExtraction(
    text: string,
    result: ExtractionResult
  ): Promise<void> {
    const key = `entity:cache:${this.hashText(text)}`;
    await this.redis.setex(key, this.config.cacheTTL, JSON.stringify(result));
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
   * Add custom entity to knowledge base
   */
  public async addToKnowledgeBase(entity: LinkedEntity): Promise<void> {
    switch (entity.type) {
      case EntityType.PERSON:
        this.knowledgeBase.persons.set(entity.canonicalName.toLowerCase(), entity);
        break;
      case EntityType.ORGANIZATION:
        this.knowledgeBase.organizations.set(
          entity.canonicalName.toLowerCase(),
          entity
        );
        break;
      case EntityType.LOCATION:
        this.knowledgeBase.locations.set(entity.canonicalName.toLowerCase(), entity);
        break;
      case EntityType.SKILL:
        this.knowledgeBase.skills.set(entity.canonicalName.toLowerCase(), entity);
        break;
      case EntityType.EMOTION:
        this.knowledgeBase.emotions.set(entity.canonicalName.toLowerCase(), entity);
        break;
      case EntityType.ACTIVITY:
        this.knowledgeBase.activities.set(entity.canonicalName.toLowerCase(), entity);
        break;
    }

    // Store in Redis
    const key = `entity:kb:${entity.type}:${entity.id}`;
    await this.redis.set(key, JSON.stringify(entity));

    this.emit('entityAddedToKB', { entity });
  }

  /**
   * Train custom entity recognizer
   */
  public async trainCustomEntity(
    type: EntityType,
    examples: string[]
  ): Promise<void> {
    // Create pattern from examples
    const escapedExamples = examples.map((ex) =>
      ex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const pattern = new RegExp(`\\b(${escapedExamples.join('|')})\\b`, 'gi');

    this.entityPatterns.push({
      type,
      patterns: [pattern],
      priority: 8,
    });

    // Add to gazetteer
    const gazetteer = this.gazetteers.get(type) || new Set();
    examples.forEach((ex) => gazetteer.add(ex.toLowerCase()));
    this.gazetteers.set(type, gazetteer);

    this.emit('customEntityTrained', { type, exampleCount: examples.length });
  }

  /**
   * Get entity statistics
   */
  public getStatistics(): any {
    return {
      patterns: this.entityPatterns.length,
      knowledgeBase: {
        persons: this.knowledgeBase.persons.size,
        organizations: this.knowledgeBase.organizations.size,
        locations: this.knowledgeBase.locations.size,
        skills: this.knowledgeBase.skills.size,
        emotions: this.knowledgeBase.emotions.size,
        activities: this.knowledgeBase.activities.size,
      },
      gazetteers: Array.from(this.gazetteers.entries()).map(([type, set]) => ({
        type,
        size: set.size,
      })),
    };
  }
}
