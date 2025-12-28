/**
 * Machine Translation Service - Phase 14 Week 3
 * Integrates with external translation APIs for automated translation
 */

import { EventEmitter } from 'events';
import axios from 'axios';

export interface TranslationRequest {
  text: string;
  sourceLocale: string;
  targetLocale: string;
  context?: string;
  glossary?: Record<string, string>;
  formality?: 'formal' | 'informal';
}

export interface TranslationResult {
  text: string;
  sourceLocale: string;
  targetLocale: string;
  provider: string;
  confidence: number;
  alternatives?: string[];
  detectedSourceLocale?: string;
  timestamp: Date;
}

export interface TranslationQuality {
  score: number; // 0-100
  issues: Array<{
    type: 'placeholder_mismatch' | 'length_exceeded' | 'formality_mismatch' | 'cultural_issue' | 'terminology_inconsistency';
    severity: 'low' | 'medium' | 'high';
    message: string;
  }>;
  suggestions: string[];
}

export interface TranslationProvider {
  name: 'google' | 'deepl' | 'azure' | 'aws';
  apiKey: string;
  enabled: boolean;
  priority: number; // Lower number = higher priority
  supportedLocales: string[];
}

export interface MachineTranslationConfig {
  providers: TranslationProvider[];
  enableQualityCheck: boolean;
  enableCache: boolean;
  cacheExpiryHours: number;
  maxRetries: number;
  fallbackToOtherProviders: boolean;
}

interface CachedTranslation {
  result: TranslationResult;
  cachedAt: Date;
}

export class MachineTranslationService extends EventEmitter {
  private config: MachineTranslationConfig;
  private cache: Map<string, CachedTranslation> = new Map();
  private glossary: Map<string, Map<string, string>> = new Map(); // sourceLocale -> targetLocale -> translations

  constructor(config: MachineTranslationConfig) {
    super();
    this.config = config;
    this.initializeGlossary();
  }

  /**
   * Initialize product-specific glossary
   */
  private initializeGlossary(): void {
    // English to Spanish
    this.addGlossaryEntry('en', 'es', 'UpCoach', 'UpCoach');
    this.addGlossaryEntry('en', 'es', 'habit', 'hábito');
    this.addGlossaryEntry('en', 'es', 'goal', 'objetivo');
    this.addGlossaryEntry('en', 'es', 'coach', 'coach');
    this.addGlossaryEntry('en', 'es', 'streak', 'racha');
    this.addGlossaryEntry('en', 'es', 'achievement', 'logro');

    // English to Portuguese (Brazil)
    this.addGlossaryEntry('en', 'pt-BR', 'UpCoach', 'UpCoach');
    this.addGlossaryEntry('en', 'pt-BR', 'habit', 'hábito');
    this.addGlossaryEntry('en', 'pt-BR', 'goal', 'meta');
    this.addGlossaryEntry('en', 'pt-BR', 'coach', 'coach');
    this.addGlossaryEntry('en', 'pt-BR', 'streak', 'sequência');
    this.addGlossaryEntry('en', 'pt-BR', 'achievement', 'conquista');

    // English to French
    this.addGlossaryEntry('en', 'fr', 'UpCoach', 'UpCoach');
    this.addGlossaryEntry('en', 'fr', 'habit', 'habitude');
    this.addGlossaryEntry('en', 'fr', 'goal', 'objectif');
    this.addGlossaryEntry('en', 'fr', 'coach', 'coach');
    this.addGlossaryEntry('en', 'fr', 'streak', 'série');
    this.addGlossaryEntry('en', 'fr', 'achievement', 'accomplissement');

    // English to German
    this.addGlossaryEntry('en', 'de', 'UpCoach', 'UpCoach');
    this.addGlossaryEntry('en', 'de', 'habit', 'Gewohnheit');
    this.addGlossaryEntry('en', 'de', 'goal', 'Ziel');
    this.addGlossaryEntry('en', 'de', 'coach', 'Coach');
    this.addGlossaryEntry('en', 'de', 'streak', 'Serie');
    this.addGlossaryEntry('en', 'de', 'achievement', 'Errungenschaft');

    // English to Japanese
    this.addGlossaryEntry('en', 'ja', 'UpCoach', 'UpCoach');
    this.addGlossaryEntry('en', 'ja', 'habit', '習慣');
    this.addGlossaryEntry('en', 'ja', 'goal', '目標');
    this.addGlossaryEntry('en', 'ja', 'coach', 'コーチ');
    this.addGlossaryEntry('en', 'ja', 'streak', '連続');
    this.addGlossaryEntry('en', 'ja', 'achievement', '実績');
  }

  /**
   * Add glossary entry
   */
  addGlossaryEntry(sourceLocale: string, targetLocale: string, source: string, target: string): void {
    const sourceKey = `${sourceLocale}->${targetLocale}`;

    if (!this.glossary.has(sourceKey)) {
      this.glossary.set(sourceKey, new Map());
    }

    this.glossary.get(sourceKey)!.set(source, target);
  }

  /**
   * Get glossary for locale pair
   */
  private getGlossary(sourceLocale: string, targetLocale: string): Map<string, string> | undefined {
    return this.glossary.get(`${sourceLocale}->${targetLocale}`);
  }

  /**
   * Translate text using configured providers
   */
  async translate(request: TranslationRequest): Promise<TranslationResult> {
    // Check cache first
    if (this.config.enableCache) {
      const cached = this.getFromCache(request);
      if (cached) {
        this.emit('translation:cache_hit', request);
        return cached.result;
      }
    }

    // Get active providers sorted by priority
    const providers = this.config.providers
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);

    if (providers.length === 0) {
      throw new Error('No translation providers configured');
    }

    let lastError: Error | null = null;

    // Try each provider in order
    for (const provider of providers) {
      // Check if provider supports the target locale
      if (!this.isLocaleSupported(provider, request.targetLocale)) {
        continue;
      }

      try {
        const result = await this.translateWithProvider(provider, request);

        // Cache successful translation
        if (this.config.enableCache) {
          this.cacheTranslation(request, result);
        }

        this.emit('translation:success', { provider: provider.name, request, result });
        return result;
      } catch (error) {
        lastError = error as Error;
        this.emit('translation:provider_error', { provider: provider.name, error });

        if (!this.config.fallbackToOtherProviders) {
          throw error;
        }
      }
    }

    throw lastError || new Error('All translation providers failed');
  }

  /**
   * Translate with specific provider
   */
  private async translateWithProvider(
    provider: TranslationProvider,
    request: TranslationRequest
  ): Promise<TranslationResult> {
    switch (provider.name) {
      case 'google':
        return await this.translateWithGoogle(provider, request);
      case 'deepl':
        return await this.translateWithDeepL(provider, request);
      case 'azure':
        return await this.translateWithAzure(provider, request);
      case 'aws':
        return await this.translateWithAWS(provider, request);
      default:
        throw new Error(`Unknown provider: ${provider.name}`);
    }
  }

  /**
   * Translate using Google Cloud Translation API
   */
  private async translateWithGoogle(
    provider: TranslationProvider,
    request: TranslationRequest
  ): Promise<TranslationResult> {
    const response = await axios.post(
      'https://translation.googleapis.com/language/translate/v2',
      {
        q: request.text,
        source: this.normalizeLocaleForGoogle(request.sourceLocale),
        target: this.normalizeLocaleForGoogle(request.targetLocale),
        format: 'text',
      },
      {
        params: { key: provider.apiKey },
      }
    );

    const translation = response.data.data.translations[0];

    return {
      text: translation.translatedText,
      sourceLocale: request.sourceLocale,
      targetLocale: request.targetLocale,
      provider: 'google',
      confidence: 85, // Google doesn't provide confidence scores
      detectedSourceLocale: translation.detectedSourceLanguage,
      timestamp: new Date(),
    };
  }

  /**
   * Translate using DeepL API
   */
  private async translateWithDeepL(
    provider: TranslationProvider,
    request: TranslationRequest
  ): Promise<TranslationResult> {
    const response = await axios.post(
      'https://api-free.deepl.com/v2/translate',
      null,
      {
        params: {
          auth_key: provider.apiKey,
          text: request.text,
          source_lang: this.normalizeLocaleForDeepL(request.sourceLocale),
          target_lang: this.normalizeLocaleForDeepL(request.targetLocale),
          formality: request.formality === 'formal' ? 'more' : request.formality === 'informal' ? 'less' : 'default',
        },
      }
    );

    const translation = response.data.translations[0];

    return {
      text: translation.text,
      sourceLocale: request.sourceLocale,
      targetLocale: request.targetLocale,
      provider: 'deepl',
      confidence: 90, // DeepL typically has high quality
      detectedSourceLocale: translation.detected_source_language?.toLowerCase(),
      timestamp: new Date(),
    };
  }

  /**
   * Translate using Azure Translator API
   */
  private async translateWithAzure(
    provider: TranslationProvider,
    request: TranslationRequest
  ): Promise<TranslationResult> {
    const response = await axios.post(
      'https://api.cognitive.microsofttranslator.com/translate',
      [{ text: request.text }],
      {
        params: {
          'api-version': '3.0',
          from: this.normalizeLocaleForAzure(request.sourceLocale),
          to: this.normalizeLocaleForAzure(request.targetLocale),
        },
        headers: {
          'Ocp-Apim-Subscription-Key': provider.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const translation = response.data[0].translations[0];

    return {
      text: translation.text,
      sourceLocale: request.sourceLocale,
      targetLocale: request.targetLocale,
      provider: 'azure',
      confidence: Math.round((translation.confidence || 0.85) * 100),
      timestamp: new Date(),
    };
  }

  /**
   * Translate using AWS Translate
   */
  private async translateWithAWS(
    provider: TranslationProvider,
    request: TranslationRequest
  ): Promise<TranslationResult> {
    // Note: AWS SDK requires additional setup, this is a simplified example
    const response = await axios.post(
      'https://translate.amazonaws.com/',
      {
        Text: request.text,
        SourceLanguageCode: this.normalizeLocaleForAWS(request.sourceLocale),
        TargetLanguageCode: this.normalizeLocaleForAWS(request.targetLocale),
      },
      {
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSShineFrontendService_20170701.TranslateText',
        },
      }
    );

    return {
      text: response.data.TranslatedText,
      sourceLocale: request.sourceLocale,
      targetLocale: request.targetLocale,
      provider: 'aws',
      confidence: 80,
      detectedSourceLocale: response.data.SourceLanguageCode,
      timestamp: new Date(),
    };
  }

  /**
   * Validate translation quality
   */
  validateQuality(original: string, translation: string, sourceLocale: string, targetLocale: string): TranslationQuality {
    const issues: TranslationQuality['issues'] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check placeholder consistency
    const placeholderRegex = /\{\{[\w.]+\}\}/g;
    const originalPlaceholders = original.match(placeholderRegex) || [];
    const translatedPlaceholders = translation.match(placeholderRegex) || [];

    if (originalPlaceholders.length !== translatedPlaceholders.length) {
      issues.push({
        type: 'placeholder_mismatch',
        severity: 'high',
        message: `Placeholder count mismatch: ${originalPlaceholders.length} in source vs ${translatedPlaceholders.length} in translation`,
      });
      score -= 30;
    }

    // Check for missing placeholders
    const missingPlaceholders = originalPlaceholders.filter(
      p => !translatedPlaceholders.includes(p)
    );

    if (missingPlaceholders.length > 0) {
      issues.push({
        type: 'placeholder_mismatch',
        severity: 'high',
        message: `Missing placeholders: ${missingPlaceholders.join(', ')}`,
      });
      score -= 20;
    }

    // Check relative length
    const lengthRatio = translation.length / original.length;

    // Different languages have different typical expansion rates
    const expectedRatios: Record<string, { min: number; max: number }> = {
      'es': { min: 0.9, max: 1.3 },
      'pt-BR': { min: 0.9, max: 1.3 },
      'fr': { min: 1.0, max: 1.4 },
      'de': { min: 1.0, max: 1.5 },
      'ja': { min: 0.5, max: 1.0 },
    };

    const targetLangCode = targetLocale.split('-')[0];
    const expected = expectedRatios[targetLangCode];

    if (expected && (lengthRatio < expected.min || lengthRatio > expected.max)) {
      issues.push({
        type: 'length_exceeded',
        severity: 'medium',
        message: `Translation length ratio (${lengthRatio.toFixed(2)}) is outside expected range (${expected.min}-${expected.max})`,
      });
      score -= 10;
      suggestions.push('Review translation for completeness and conciseness');
    }

    // Check glossary terms
    const glossary = this.getGlossary(sourceLocale, targetLocale);
    if (glossary) {
      for (const [sourceTerm, targetTerm] of glossary.entries()) {
        const sourceRegex = new RegExp(`\\b${sourceTerm}\\b`, 'gi');
        const targetRegex = new RegExp(`\\b${targetTerm}\\b`, 'gi');

        if (sourceRegex.test(original) && !targetRegex.test(translation)) {
          issues.push({
            type: 'terminology_inconsistency',
            severity: 'medium',
            message: `Expected term "${targetTerm}" not found in translation (source contains "${sourceTerm}")`,
          });
          score -= 15;
          suggestions.push(`Use "${targetTerm}" for "${sourceTerm}"`);
        }
      }
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  }

  /**
   * Batch translate multiple texts
   */
  async batchTranslate(
    texts: string[],
    sourceLocale: string,
    targetLocale: string,
    options?: { concurrency?: number }
  ): Promise<TranslationResult[]> {
    const concurrency = options?.concurrency || 5;
    const results: TranslationResult[] = [];

    // Process in batches
    for (let i = 0; i < texts.length; i += concurrency) {
      const batch = texts.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(text =>
          this.translate({ text, sourceLocale, targetLocale })
        )
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get translation from cache
   */
  private getFromCache(request: TranslationRequest): CachedTranslation | null {
    const key = this.getCacheKey(request);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check expiry
    const expiryMs = this.config.cacheExpiryHours * 60 * 60 * 1000;
    const age = Date.now() - cached.cachedAt.getTime();

    if (age > expiryMs) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Cache translation
   */
  private cacheTranslation(request: TranslationRequest, result: TranslationResult): void {
    const key = this.getCacheKey(request);
    this.cache.set(key, {
      result,
      cachedAt: new Date(),
    });
  }

  /**
   * Generate cache key
   */
  private getCacheKey(request: TranslationRequest): string {
    return `${request.sourceLocale}:${request.targetLocale}:${request.text}`;
  }

  /**
   * Check if locale is supported by provider
   */
  private isLocaleSupported(provider: TranslationProvider, locale: string): boolean {
    if (provider.supportedLocales.length === 0) {
      return true; // No restriction
    }

    const normalizedLocale = locale.toLowerCase();
    const baseLocale = normalizedLocale.split('-')[0];

    return provider.supportedLocales.some(
      supported =>
        supported.toLowerCase() === normalizedLocale ||
        supported.toLowerCase() === baseLocale
    );
  }

  /**
   * Normalize locale for Google Translate (uses ISO 639-1)
   */
  private normalizeLocaleForGoogle(locale: string): string {
    const mapping: Record<string, string> = {
      'en-US': 'en',
      'es-ES': 'es',
      'pt-BR': 'pt',
      'fr-FR': 'fr',
      'de-DE': 'de',
      'ja-JP': 'ja',
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
    };

    return mapping[locale] || locale.split('-')[0];
  }

  /**
   * Normalize locale for DeepL
   */
  private normalizeLocaleForDeepL(locale: string): string {
    const mapping: Record<string, string> = {
      'en-US': 'EN',
      'es-ES': 'ES',
      'pt-BR': 'PT-BR',
      'fr-FR': 'FR',
      'de-DE': 'DE',
      'ja-JP': 'JA',
    };

    return mapping[locale] || locale.toUpperCase();
  }

  /**
   * Normalize locale for Azure
   */
  private normalizeLocaleForAzure(locale: string): string {
    return locale.toLowerCase();
  }

  /**
   * Normalize locale for AWS
   */
  private normalizeLocaleForAWS(locale: string): string {
    return locale.split('-')[0];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.emit('cache:cleared');
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    cacheSize: number;
    activeProviders: number;
    glossaryEntries: number;
  } {
    let glossaryCount = 0;
    for (const entries of this.glossary.values()) {
      glossaryCount += entries.size;
    }

    return {
      cacheSize: this.cache.size,
      activeProviders: this.config.providers.filter(p => p.enabled).length,
      glossaryEntries: glossaryCount,
    };
  }
}

// Default configuration for machine translation
export const defaultMachineTranslationConfig: MachineTranslationConfig = {
  providers: [
    {
      name: 'deepl',
      apiKey: process.env.DEEPL_API_KEY || '',
      enabled: false,
      priority: 1,
      supportedLocales: ['en', 'es', 'pt', 'fr', 'de', 'ja'],
    },
    {
      name: 'google',
      apiKey: process.env.GOOGLE_TRANSLATE_API_KEY || '',
      enabled: false,
      priority: 2,
      supportedLocales: [],
    },
  ],
  enableQualityCheck: true,
  enableCache: true,
  cacheExpiryHours: 24,
  maxRetries: 3,
  fallbackToOtherProviders: true,
};

// Singleton instance
export const machineTranslationService = new MachineTranslationService(
  defaultMachineTranslationConfig
);
