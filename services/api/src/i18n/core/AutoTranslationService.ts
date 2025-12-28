import { EventEmitter } from 'events';
import OpenAI from 'openai';

// Auto Translation Service - AI-powered automatic translation (~550 LOC)

export enum TranslationQuality {
  MACHINE = 'machine',
  REVIEWED = 'reviewed',
  PROFESSIONAL = 'professional',
  CERTIFIED = 'certified',
}

interface TranslationContext {
  type: 'ui' | 'content' | 'legal' | 'marketing' | 'coaching';
  description?: string;
  audience?: string;
  tone?: 'formal' | 'informal' | 'technical' | 'friendly';
}

interface TranslationResult {
  original: string;
  translated: string;
  sourceLanguage: string;
  targetLanguage: string;
  quality: TranslationQuality;
  confidence: number;
  provider: string;
  timestamp: Date;
}

interface TranslationMemoryEntry {
  source: string;
  target: string;
  sourceLanguage: string;
  targetLanguage: string;
  quality: TranslationQuality;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class AutoTranslationService extends EventEmitter {
  private openai: OpenAI;
  private translationMemory: Map<string, TranslationMemoryEntry> = new Map();
  private glossary: Map<string, Map<string, string>> = new Map(); // term -> language -> translation

  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.initializeGlossary();
  }

  private initializeGlossary(): void {
    // Technical terms that should be translated consistently
    const coachingTerms = new Map<string, string>([
      ['en', 'coaching'],
      ['es', 'coaching'],
      ['fr', 'coaching'],
      ['de', 'Coaching'],
      ['pt', 'coaching'],
      ['ja', 'コーチング'],
      ['zh_CN', '教练'],
      ['ar', 'التدريب'],
    ]);

    const goalTerms = new Map<string, string>([
      ['en', 'goal'],
      ['es', 'objetivo'],
      ['fr', 'objectif'],
      ['de', 'Ziel'],
      ['pt', 'objetivo'],
      ['ja', '目標'],
      ['zh_CN', '目标'],
      ['ar', 'هدف'],
    ]);

    this.glossary.set('coaching', coachingTerms);
    this.glossary.set('goal', goalTerms);
  }

  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'en',
    quality: TranslationQuality = TranslationQuality.MACHINE,
    context?: TranslationContext
  ): Promise<TranslationResult> {
    console.log(`[AutoTranslationService] Translating to ${targetLanguage} (${quality})`);

    // Check translation memory first
    const cached = await this.checkTranslationMemory(text, sourceLanguage, targetLanguage);
    if (cached && cached.quality >= quality) {
      console.log(`[AutoTranslationService] Found in translation memory`);
      return {
        original: text,
        translated: cached.target,
        sourceLanguage,
        targetLanguage,
        quality: cached.quality,
        confidence: 1.0,
        provider: 'memory',
        timestamp: new Date(),
      };
    }

    let translation: string;
    let confidence: number;
    let provider: string;

    if (quality === TranslationQuality.MACHINE) {
      // Fast machine translation
      const result = await this.machineTranslate(text, sourceLanguage, targetLanguage);
      translation = result.translation;
      confidence = result.confidence;
      provider = 'machine';
    } else if (quality === TranslationQuality.REVIEWED) {
      // AI-powered high-quality translation
      const result = await this.aiTranslate(text, sourceLanguage, targetLanguage, context);
      translation = result.translation;
      confidence = result.confidence;
      provider = 'gpt-4';

      // Quality check
      const qualityScore = await this.assessQuality(translation, text, context);
      if (qualityScore < 0.8) {
        console.log(`[AutoTranslationService] Quality too low (${qualityScore}), retrying...`);
        const retry = await this.aiTranslate(text, sourceLanguage, targetLanguage, context);
        translation = retry.translation;
        confidence = retry.confidence;
      }
    } else {
      // Professional/Certified requires human translator
      console.log(`[AutoTranslationService] Requesting human translation (${quality})`);
      translation = await this.requestHumanTranslation(text, sourceLanguage, targetLanguage, quality);
      confidence = 1.0;
      provider = 'human';
    }

    // Apply glossary terms
    translation = this.applyGlossary(translation, targetLanguage);

    // Save to translation memory
    await this.saveToTranslationMemory(text, translation, sourceLanguage, targetLanguage, quality);

    const result: TranslationResult = {
      original: text,
      translated: translation,
      sourceLanguage,
      targetLanguage,
      quality,
      confidence,
      provider,
      timestamp: new Date(),
    };

    this.emit('translation:completed', result);

    return result;
  }

  private async machineTranslate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<{ translation: string; confidence: number }> {
    // Simulate machine translation (in production, use Google Translate API)
    console.log(`[AutoTranslationService] Machine translating from ${sourceLanguage} to ${targetLanguage}`);

    // Simple word-by-word translation simulation
    const translation = `[${targetLanguage.toUpperCase()}] ${text}`;

    return {
      translation,
      confidence: 0.85,
    };
  }

  private async aiTranslate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    context?: TranslationContext
  ): Promise<{ translation: string; confidence: number }> {
    console.log(`[AutoTranslationService] AI translating from ${sourceLanguage} to ${targetLanguage}`);

    const prompt = this.buildTranslationPrompt(text, sourceLanguage, targetLanguage, context);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const translation = completion.choices[0].message.content || text;

    return {
      translation: translation.trim(),
      confidence: 0.95,
    };
  }

  private buildTranslationPrompt(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    context?: TranslationContext
  ): string {
    const contextInfo = context
      ? `
Context Type: ${context.type}
Tone: ${context.tone || 'neutral'}
Audience: ${context.audience || 'general'}
${context.description ? `Description: ${context.description}` : ''}`
      : '';

    return `Translate the following text from ${sourceLanguage} to ${targetLanguage}.

${contextInfo}

Requirements:
- Maintain the original tone and style
- Ensure cultural appropriateness for ${targetLanguage} speakers
- Preserve technical accuracy
- Keep formatting (line breaks, punctuation)
- Use natural, idiomatic expressions in ${targetLanguage}

Source text:
"${text}"

Provide ONLY the translated text, without any explanations or notes.

Translation:`;
  }

  private async assessQuality(
    translation: string,
    original: string,
    context?: TranslationContext
  ): Promise<number> {
    // Simple quality assessment (in production, use more sophisticated metrics)
    // Check for common issues:
    // 1. Translation is not empty
    // 2. Translation is different from original
    // 3. Length is reasonable (within 50-200% of original)

    if (!translation || translation.trim().length === 0) return 0;
    if (translation === original) return 0.5;

    const lengthRatio = translation.length / original.length;
    if (lengthRatio < 0.5 || lengthRatio > 2.0) return 0.6;

    // All checks passed
    return 0.9;
  }

  private async requestHumanTranslation(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    quality: TranslationQuality
  ): Promise<string> {
    // In production, this would integrate with a professional translation service
    console.log(`[AutoTranslationService] Human translation requested (${quality})`);

    // For now, return a placeholder
    return `[HUMAN_TRANSLATION_PENDING] ${text}`;
  }

  private applyGlossary(translation: string, targetLanguage: string): string {
    // Apply glossary terms to ensure consistency
    this.glossary.forEach((translations, term) => {
      const targetTerm = translations.get(targetLanguage);
      if (targetTerm) {
        // Simple replacement (in production, use more sophisticated matching)
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        translation = translation.replace(regex, targetTerm);
      }
    });

    return translation;
  }

  private async checkTranslationMemory(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationMemoryEntry | null> {
    const key = this.getMemoryKey(text, sourceLanguage, targetLanguage);
    const entry = this.translationMemory.get(key);

    if (entry) {
      entry.usageCount++;
      entry.updatedAt = new Date();
      return entry;
    }

    return null;
  }

  private async saveToTranslationMemory(
    source: string,
    target: string,
    sourceLanguage: string,
    targetLanguage: string,
    quality: TranslationQuality
  ): Promise<void> {
    const key = this.getMemoryKey(source, sourceLanguage, targetLanguage);

    const entry: TranslationMemoryEntry = {
      source,
      target,
      sourceLanguage,
      targetLanguage,
      quality,
      usageCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.translationMemory.set(key, entry);
    console.log(`[AutoTranslationService] Saved to translation memory (total: ${this.translationMemory.size})`);
  }

  private getMemoryKey(text: string, sourceLanguage: string, targetLanguage: string): string {
    return `${sourceLanguage}:${targetLanguage}:${text.toLowerCase().trim()}`;
  }

  async batchTranslate(
    texts: string[],
    targetLanguage: string,
    sourceLanguage: string = 'en',
    quality: TranslationQuality = TranslationQuality.MACHINE,
    context?: TranslationContext
  ): Promise<TranslationResult[]> {
    console.log(`[AutoTranslationService] Batch translating ${texts.length} texts`);

    const results = await Promise.all(
      texts.map((text) => this.translate(text, targetLanguage, sourceLanguage, quality, context))
    );

    return results;
  }

  getTranslationMemoryStats(): {
    totalEntries: number;
    byLanguagePair: Map<string, number>;
    byQuality: Map<TranslationQuality, number>;
  } {
    const byLanguagePair = new Map<string, number>();
    const byQuality = new Map<TranslationQuality, number>();

    this.translationMemory.forEach((entry) => {
      const pair = `${entry.sourceLanguage}-${entry.targetLanguage}`;
      byLanguagePair.set(pair, (byLanguagePair.get(pair) || 0) + 1);
      byQuality.set(entry.quality, (byQuality.get(entry.quality) || 0) + 1);
    });

    return {
      totalEntries: this.translationMemory.size,
      byLanguagePair,
      byQuality,
    };
  }
}

export const autoTranslationService = new AutoTranslationService();
