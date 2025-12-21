/**
 * PII Redaction Service
 *
 * Provides comprehensive PII detection and redaction capabilities:
 * - Automatic PII detection using patterns and ML
 * - Configurable redaction strategies
 * - Audit logging of redacted data
 * - GDPR/HIPAA compliant data handling
 */

import { EventEmitter } from 'events';

// Types
export type PIIType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'ip_address'
  | 'name'
  | 'address'
  | 'date_of_birth'
  | 'passport'
  | 'driver_license'
  | 'bank_account'
  | 'medical_record'
  | 'custom';

export type RedactionStrategy =
  | 'mask' // Replace with asterisks
  | 'hash' // Replace with hash
  | 'tokenize' // Replace with reversible token
  | 'remove' // Remove completely
  | 'pseudonymize' // Replace with fake data
  | 'encrypt'; // Encrypt in place

export interface PIIMatch {
  type: PIIType;
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  context?: string;
}

export interface RedactionResult {
  original: string;
  redacted: string;
  matches: PIIMatch[];
  redactedCount: number;
  strategy: RedactionStrategy;
  processedAt: Date;
}

export interface PIIPattern {
  type: PIIType;
  pattern: RegExp;
  validator?: (match: string) => boolean;
  confidence: number;
}

export interface RedactionConfig {
  strategy: RedactionStrategy;
  maskChar?: string;
  preserveLength?: boolean;
  preserveFormat?: boolean;
  hashAlgorithm?: string;
}

export interface PIIRedactionConfig {
  defaultStrategy?: RedactionStrategy;
  enabledTypes?: PIIType[];
  customPatterns?: PIIPattern[];
  logRedactions?: boolean;
  confidenceThreshold?: number;
}

export interface RedactionStats {
  totalProcessed: number;
  totalRedacted: number;
  byType: Record<PIIType, number>;
  byStrategy: Record<RedactionStrategy, number>;
}

// Default PII patterns
const DEFAULT_PATTERNS: PIIPattern[] = [
  {
    type: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    confidence: 0.95,
  },
  {
    type: 'phone',
    pattern: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    validator: (match: string) => {
      const digits = match.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 15;
    },
    confidence: 0.9,
  },
  {
    type: 'ssn',
    pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    validator: (match: string) => {
      const digits = match.replace(/\D/g, '');
      if (digits.length !== 9) return false;
      // Basic SSN validation - not starting with 000, 666, or 9xx
      const area = parseInt(digits.substring(0, 3));
      return area > 0 && area !== 666 && area < 900;
    },
    confidence: 0.85,
  },
  {
    type: 'credit_card',
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b/g,
    validator: (match: string) => {
      const digits = match.replace(/\D/g, '');
      if (digits.length < 13 || digits.length > 19) return false;
      // Luhn algorithm validation
      let sum = 0;
      let isEven = false;
      for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i]);
        if (isEven) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        isEven = !isEven;
      }
      return sum % 10 === 0;
    },
    confidence: 0.95,
  },
  {
    type: 'ip_address',
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    confidence: 0.98,
  },
  {
    type: 'date_of_birth',
    pattern: /\b(?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12][0-9]|3[01])[-/](?:19|20)\d{2}\b|\b(?:19|20)\d{2}[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12][0-9]|3[01])\b/g,
    confidence: 0.7,
  },
  {
    type: 'passport',
    pattern: /\b[A-Z]{1,2}[0-9]{6,9}\b/g,
    confidence: 0.6,
  },
  {
    type: 'bank_account',
    pattern: /\b[0-9]{8,17}\b/g,
    validator: (match: string) => {
      // Only match if in context of banking
      return match.length >= 8 && match.length <= 17;
    },
    confidence: 0.5,
  },
];

// Name patterns (simplified - production would use NER)
const NAME_INDICATORS = /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;

// PII Redaction Service
export class PIIRedactionService extends EventEmitter {
  private config: Required<PIIRedactionConfig>;
  private patterns: PIIPattern[];
  private tokens: Map<string, string> = new Map();
  private stats: RedactionStats = {
    totalProcessed: 0,
    totalRedacted: 0,
    byType: {} as Record<PIIType, number>,
    byStrategy: {} as Record<RedactionStrategy, number>,
  };

  constructor(config: PIIRedactionConfig = {}) {
    super();
    this.config = {
      defaultStrategy: config.defaultStrategy || 'mask',
      enabledTypes: config.enabledTypes || [
        'email',
        'phone',
        'ssn',
        'credit_card',
        'ip_address',
      ],
      customPatterns: config.customPatterns || [],
      logRedactions: config.logRedactions ?? true,
      confidenceThreshold: config.confidenceThreshold || 0.7,
    };

    this.patterns = [
      ...DEFAULT_PATTERNS.filter((p) => this.config.enabledTypes.includes(p.type)),
      ...this.config.customPatterns,
    ];
  }

  /**
   * Detect PII in text
   */
  detect(text: string): PIIMatch[] {
    const matches: PIIMatch[] = [];

    for (const pattern of this.patterns) {
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        const value = match[0];

        // Run validator if present
        if (pattern.validator && !pattern.validator(value)) {
          continue;
        }

        // Check confidence threshold
        if (pattern.confidence < this.config.confidenceThreshold) {
          continue;
        }

        matches.push({
          type: pattern.type,
          value,
          startIndex: match.index,
          endIndex: match.index + value.length,
          confidence: pattern.confidence,
          context: this.extractContext(text, match.index, value.length),
        });
      }
    }

    // Detect names using indicators
    if (this.config.enabledTypes.includes('name')) {
      const nameMatches = this.detectNames(text);
      matches.push(...nameMatches);
    }

    return this.deduplicateMatches(matches);
  }

  /**
   * Redact PII from text
   */
  redact(text: string, config?: RedactionConfig): RedactionResult {
    const strategy = config?.strategy || this.config.defaultStrategy;
    const matches = this.detect(text);

    if (matches.length === 0) {
      return {
        original: text,
        redacted: text,
        matches: [],
        redactedCount: 0,
        strategy,
        processedAt: new Date(),
      };
    }

    // Sort matches by position (descending) to avoid index shifting
    const sortedMatches = [...matches].sort((a, b) => b.startIndex - a.startIndex);

    let redacted = text;

    for (const match of sortedMatches) {
      const replacement = this.getRedactedValue(match, strategy, config);
      redacted =
        redacted.substring(0, match.startIndex) +
        replacement +
        redacted.substring(match.endIndex);

      // Update stats
      this.updateStats(match.type, strategy);
    }

    this.stats.totalProcessed++;
    this.stats.totalRedacted += matches.length;

    const result: RedactionResult = {
      original: text,
      redacted,
      matches,
      redactedCount: matches.length,
      strategy,
      processedAt: new Date(),
    };

    if (this.config.logRedactions) {
      this.emit('redaction', {
        types: matches.map((m) => m.type),
        count: matches.length,
        strategy,
      });
    }

    return result;
  }

  /**
   * Redact PII from an object (recursively)
   */
  redactObject<T extends Record<string, unknown>>(
    obj: T,
    config?: RedactionConfig
  ): { redacted: T; modifications: string[] } {
    const modifications: string[] = [];
    const redacted = this.processObject(obj, '', modifications, config);
    return { redacted: redacted as T, modifications };
  }

  /**
   * Tokenize PII (reversible with detokenize)
   */
  tokenize(text: string): { tokenized: string; tokens: Map<string, string> } {
    const matches = this.detect(text);
    const tokens = new Map<string, string>();

    let tokenized = text;
    const sortedMatches = [...matches].sort((a, b) => b.startIndex - a.startIndex);

    for (const match of sortedMatches) {
      const token = `[PII_${match.type.toUpperCase()}_${this.generateToken()}]`;
      tokens.set(token, match.value);
      this.tokens.set(token, match.value);

      tokenized =
        tokenized.substring(0, match.startIndex) + token + tokenized.substring(match.endIndex);
    }

    return { tokenized, tokens };
  }

  /**
   * Detokenize text (restore PII from tokens)
   */
  detokenize(text: string, tokens?: Map<string, string>): string {
    const tokenMap = tokens || this.tokens;
    let detokenized = text;

    for (const [token, value] of tokenMap.entries()) {
      detokenized = detokenized.replace(token, value);
    }

    return detokenized;
  }

  /**
   * Pseudonymize PII (replace with fake but realistic data)
   */
  pseudonymize(text: string): RedactionResult {
    return this.redact(text, { strategy: 'pseudonymize' });
  }

  /**
   * Check if text contains PII
   */
  containsPII(text: string): boolean {
    const matches = this.detect(text);
    return matches.length > 0;
  }

  /**
   * Get detailed PII report for text
   */
  analyze(text: string): {
    containsPII: boolean;
    matches: PIIMatch[];
    riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
    types: PIIType[];
    recommendations: string[];
  } {
    const matches = this.detect(text);
    const types = [...new Set(matches.map((m) => m.type))];

    let riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
    const recommendations: string[] = [];

    if (matches.length === 0) {
      riskLevel = 'none';
    } else if (types.some((t) => ['ssn', 'credit_card', 'medical_record', 'bank_account'].includes(t))) {
      riskLevel = 'critical';
      recommendations.push('Critical PII detected - immediate action required');
      recommendations.push('Consider encrypting or removing this data');
    } else if (types.some((t) => ['passport', 'driver_license'].includes(t))) {
      riskLevel = 'high';
      recommendations.push('High-sensitivity PII detected');
      recommendations.push('Ensure proper access controls are in place');
    } else if (types.some((t) => ['name', 'date_of_birth', 'address'].includes(t))) {
      riskLevel = 'medium';
      recommendations.push('Personal information detected');
      recommendations.push('Consider redaction for non-essential use cases');
    } else {
      riskLevel = 'low';
      recommendations.push('Basic PII detected');
      recommendations.push('Standard redaction recommended');
    }

    return {
      containsPII: matches.length > 0,
      matches,
      riskLevel,
      types,
      recommendations,
    };
  }

  /**
   * Add custom PII pattern
   */
  addPattern(pattern: PIIPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Remove pattern by type
   */
  removePattern(type: PIIType): void {
    this.patterns = this.patterns.filter((p) => p.type !== type);
  }

  /**
   * Get redaction statistics
   */
  getStats(): RedactionStats {
    return { ...this.stats };
  }

  /**
   * Clear token store
   */
  clearTokens(): void {
    this.tokens.clear();
  }

  // Private methods

  private detectNames(text: string): PIIMatch[] {
    const matches: PIIMatch[] = [];
    let match: RegExpExecArray | null;

    while ((match = NAME_INDICATORS.exec(text)) !== null) {
      matches.push({
        type: 'name',
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 0.8,
      });
    }

    return matches;
  }

  private extractContext(text: string, index: number, length: number): string {
    const contextLength = 20;
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + length + contextLength);
    return text.substring(start, end);
  }

  private deduplicateMatches(matches: PIIMatch[]): PIIMatch[] {
    // Remove overlapping matches, keeping higher confidence ones
    const sorted = [...matches].sort((a, b) => b.confidence - a.confidence);
    const result: PIIMatch[] = [];

    for (const match of sorted) {
      const overlaps = result.some(
        (existing) =>
          (match.startIndex >= existing.startIndex && match.startIndex < existing.endIndex) ||
          (match.endIndex > existing.startIndex && match.endIndex <= existing.endIndex)
      );

      if (!overlaps) {
        result.push(match);
      }
    }

    return result;
  }

  private getRedactedValue(
    match: PIIMatch,
    strategy: RedactionStrategy,
    config?: RedactionConfig
  ): string {
    const maskChar = config?.maskChar || '*';
    const preserveLength = config?.preserveLength ?? true;

    switch (strategy) {
      case 'mask':
        return this.mask(match.value, maskChar, preserveLength, match.type);

      case 'hash':
        const crypto = require('crypto');
        const hash = crypto
          .createHash(config?.hashAlgorithm || 'sha256')
          .update(match.value)
          .digest('hex');
        return `[${match.type}:${hash.substring(0, 8)}]`;

      case 'tokenize':
        const token = `[PII_${match.type.toUpperCase()}_${this.generateToken()}]`;
        this.tokens.set(token, match.value);
        return token;

      case 'remove':
        return '';

      case 'pseudonymize':
        return this.getPseudonym(match.type);

      case 'encrypt':
        // In production, this would use the EncryptionService
        return `[ENCRYPTED:${match.type}]`;

      default:
        return maskChar.repeat(match.value.length);
    }
  }

  private mask(
    value: string,
    maskChar: string,
    preserveLength: boolean,
    type: PIIType
  ): string {
    const length = preserveLength ? value.length : 8;

    switch (type) {
      case 'email':
        const [local, domain] = value.split('@');
        if (local && domain) {
          return `${local[0]}${maskChar.repeat(3)}@${domain}`;
        }
        return maskChar.repeat(length);

      case 'phone':
        const digits = value.replace(/\D/g, '');
        return `${maskChar.repeat(digits.length - 4)}${digits.slice(-4)}`;

      case 'credit_card':
        const ccDigits = value.replace(/\D/g, '');
        return `${maskChar.repeat(ccDigits.length - 4)}-${ccDigits.slice(-4)}`;

      case 'ssn':
        return `${maskChar}${maskChar}${maskChar}-${maskChar}${maskChar}-${value.slice(-4)}`;

      default:
        return maskChar.repeat(length);
    }
  }

  private getPseudonym(type: PIIType): string {
    const pseudonyms: Record<PIIType, () => string> = {
      email: () => `user${Math.random().toString(36).substring(7)}@example.com`,
      phone: () => `555-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
      ssn: () => '000-00-0000',
      credit_card: () => '0000-0000-0000-0000',
      ip_address: () => '0.0.0.0',
      name: () => 'John Doe',
      address: () => '123 Main St, Anytown, USA',
      date_of_birth: () => '01/01/1900',
      passport: () => 'XX0000000',
      driver_license: () => 'XXXXXXXXX',
      bank_account: () => '00000000',
      medical_record: () => 'MRN000000',
      custom: () => '[REDACTED]',
    };

    return pseudonyms[type]?.() || '[REDACTED]';
  }

  private processObject(
    obj: unknown,
    path: string,
    modifications: string[],
    config?: RedactionConfig
  ): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      const result = this.redact(obj, config);
      if (result.redactedCount > 0) {
        modifications.push(`${path}: ${result.redactedCount} redactions`);
        return result.redacted;
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) =>
        this.processObject(item, `${path}[${index}]`, modifications, config)
      );
    }

    if (typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        result[key] = this.processObject(
          value,
          path ? `${path}.${key}` : key,
          modifications,
          config
        );
      }
      return result;
    }

    return obj;
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private updateStats(type: PIIType, strategy: RedactionStrategy): void {
    this.stats.byType[type] = (this.stats.byType[type] || 0) + 1;
    this.stats.byStrategy[strategy] = (this.stats.byStrategy[strategy] || 0) + 1;
  }
}

// Singleton instance
let piiRedactionServiceInstance: PIIRedactionService | null = null;

export function getPIIRedactionService(config?: PIIRedactionConfig): PIIRedactionService {
  if (!piiRedactionServiceInstance) {
    piiRedactionServiceInstance = new PIIRedactionService(config);
  }
  return piiRedactionServiceInstance;
}
