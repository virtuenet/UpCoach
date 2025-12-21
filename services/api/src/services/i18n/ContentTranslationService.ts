/**
 * Content Translation Service
 *
 * Handles dynamic content translation for user-generated content:
 * - Coach profiles and descriptions
 * - Goal and habit templates
 * - Notification templates
 * - Email templates
 * - Achievement descriptions
 * - Dynamic UI content
 */

import { EventEmitter } from 'events';

// Types
export type ContentType =
  | 'coach_profile'
  | 'coach_bio'
  | 'goal_template'
  | 'habit_template'
  | 'notification_template'
  | 'email_template'
  | 'achievement_description'
  | 'badge_description'
  | 'challenge_description'
  | 'faq_answer'
  | 'help_article'
  | 'announcement'
  | 'marketing_copy';

export type TranslationQuality = 'machine' | 'human_reviewed' | 'professional';

export interface ContentItem {
  id: string;
  type: ContentType;
  sourceLocale: string;
  sourceText: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface ContentTranslation {
  id: string;
  contentId: string;
  locale: string;
  translatedText: string;
  quality: TranslationQuality;
  translatedAt: Date;
  translatedBy?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  isApproved: boolean;
  machineTranslationProvider?: string;
  confidenceScore?: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranslationRequest {
  contentId: string;
  sourceText: string;
  sourceLocale: string;
  targetLocales: string[];
  contentType: ContentType;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  context?: string;
  glossaryTerms?: Record<string, string>;
  requestedBy?: string;
}

export interface TranslationJob {
  id: string;
  request: TranslationRequest;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'partially_completed';
  progress: number;
  completedLocales: string[];
  failedLocales: string[];
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  createdAt: Date;
}

export interface GlossaryTerm {
  id: string;
  sourceLocale: string;
  sourceTerm: string;
  translations: Record<string, string>;
  category?: string;
  notes?: string;
  caseSensitive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranslationMemory {
  id: string;
  sourceLocale: string;
  sourceText: string;
  targetLocale: string;
  translatedText: string;
  contentType: ContentType;
  usageCount: number;
  lastUsedAt: Date;
  createdAt: Date;
}

export interface ContentTranslationConfig {
  enableMachineTranslation: boolean;
  machineTranslationProvider: 'google' | 'deepl' | 'azure' | 'openai';
  autoTranslateThreshold: number; // confidence score for auto-approval
  supportedLocales: string[];
  maxBatchSize: number;
  translationMemoryEnabled: boolean;
  glossaryEnabled: boolean;
}

export interface TranslationStats {
  totalContent: number;
  translatedContent: Record<string, number>;
  pendingTranslations: Record<string, number>;
  machineTranslated: number;
  humanReviewed: number;
  averageConfidenceScore: number;
  translationMemoryHits: number;
  glossaryTermsUsed: number;
}

// Singleton instance
let instance: ContentTranslationService | null = null;

/**
 * Content Translation Service implementation
 */
export class ContentTranslationService extends EventEmitter {
  private config: ContentTranslationConfig;
  private content: Map<string, ContentItem> = new Map();
  private translations: Map<string, ContentTranslation> = new Map();
  private jobs: Map<string, TranslationJob> = new Map();
  private glossary: Map<string, GlossaryTerm> = new Map();
  private translationMemory: Map<string, TranslationMemory> = new Map();

  constructor(config: Partial<ContentTranslationConfig> = {}) {
    super();
    this.config = {
      enableMachineTranslation: true,
      machineTranslationProvider: 'openai',
      autoTranslateThreshold: 0.9,
      supportedLocales: ['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'ko', 'ar', 'hi'],
      maxBatchSize: 50,
      translationMemoryEnabled: true,
      glossaryEnabled: true,
      ...config,
    };

    this.initializeDefaultGlossary();
  }

  /**
   * Initialize default glossary terms
   */
  private initializeDefaultGlossary(): void {
    const defaultTerms: Omit<GlossaryTerm, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        sourceLocale: 'en',
        sourceTerm: 'UpCoach',
        translations: { es: 'UpCoach', fr: 'UpCoach', de: 'UpCoach', ja: 'UpCoach', zh: 'UpCoach' },
        category: 'brand',
        caseSensitive: true,
      },
      {
        sourceLocale: 'en',
        sourceTerm: 'habit',
        translations: { es: 'hábito', fr: 'habitude', de: 'Gewohnheit', ja: '習慣', zh: '习惯', ko: '습관', ar: 'عادة' },
        category: 'core',
        caseSensitive: false,
      },
      {
        sourceLocale: 'en',
        sourceTerm: 'goal',
        translations: { es: 'meta', fr: 'objectif', de: 'Ziel', ja: '目標', zh: '目标', ko: '목표', ar: 'هدف' },
        category: 'core',
        caseSensitive: false,
      },
      {
        sourceLocale: 'en',
        sourceTerm: 'streak',
        translations: { es: 'racha', fr: 'série', de: 'Serie', ja: '連続記録', zh: '连续', ko: '연속', ar: 'سلسلة' },
        category: 'gamification',
        caseSensitive: false,
      },
      {
        sourceLocale: 'en',
        sourceTerm: 'coach',
        translations: { es: 'entrenador', fr: 'coach', de: 'Coach', ja: 'コーチ', zh: '教练', ko: '코치', ar: 'مدرب' },
        category: 'core',
        caseSensitive: false,
      },
      {
        sourceLocale: 'en',
        sourceTerm: 'milestone',
        translations: { es: 'hito', fr: 'jalon', de: 'Meilenstein', ja: 'マイルストーン', zh: '里程碑', ko: '이정표', ar: 'معلم' },
        category: 'goals',
        caseSensitive: false,
      },
      {
        sourceLocale: 'en',
        sourceTerm: 'achievement',
        translations: { es: 'logro', fr: 'réalisation', de: 'Erfolg', ja: '達成', zh: '成就', ko: '업적', ar: 'إنجاز' },
        category: 'gamification',
        caseSensitive: false,
      },
      {
        sourceLocale: 'en',
        sourceTerm: 'badge',
        translations: { es: 'insignia', fr: 'badge', de: 'Abzeichen', ja: 'バッジ', zh: '徽章', ko: '배지', ar: 'شارة' },
        category: 'gamification',
        caseSensitive: false,
      },
      {
        sourceLocale: 'en',
        sourceTerm: 'points',
        translations: { es: 'puntos', fr: 'points', de: 'Punkte', ja: 'ポイント', zh: '积分', ko: '포인트', ar: 'نقاط' },
        category: 'gamification',
        caseSensitive: false,
      },
      {
        sourceLocale: 'en',
        sourceTerm: 'level',
        translations: { es: 'nivel', fr: 'niveau', de: 'Stufe', ja: 'レベル', zh: '等级', ko: '레벨', ar: 'مستوى' },
        category: 'gamification',
        caseSensitive: false,
      },
    ];

    for (const term of defaultTerms) {
      const id = this.generateId();
      this.glossary.set(id, {
        ...term,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Register content for translation
   */
  async registerContent(
    type: ContentType,
    sourceText: string,
    sourceLocale: string = 'en',
    metadata?: Record<string, any>,
    createdBy?: string
  ): Promise<ContentItem> {
    const id = this.generateId();
    const content: ContentItem = {
      id,
      type,
      sourceLocale,
      sourceText,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
    };

    this.content.set(id, content);
    this.emit('content:registered', content);

    return content;
  }

  /**
   * Update content source
   */
  async updateContent(
    contentId: string,
    sourceText: string,
    invalidateTranslations: boolean = true
  ): Promise<ContentItem> {
    const content = this.content.get(contentId);
    if (!content) {
      throw new Error(`Content not found: ${contentId}`);
    }

    content.sourceText = sourceText;
    content.updatedAt = new Date();

    this.content.set(contentId, content);

    if (invalidateTranslations) {
      // Mark existing translations as outdated
      for (const [key, translation] of this.translations) {
        if (translation.contentId === contentId) {
          translation.isApproved = false;
          translation.updatedAt = new Date();
          this.translations.set(key, translation);
        }
      }
    }

    this.emit('content:updated', content);
    return content;
  }

  /**
   * Get content
   */
  async getContent(contentId: string): Promise<ContentItem | null> {
    return this.content.get(contentId) || null;
  }

  /**
   * List content by type
   */
  async listContent(type?: ContentType): Promise<ContentItem[]> {
    const items = Array.from(this.content.values());
    return type ? items.filter(c => c.type === type) : items;
  }

  /**
   * Request translation for content
   */
  async requestTranslation(request: TranslationRequest): Promise<TranslationJob> {
    const job: TranslationJob = {
      id: this.generateId(),
      request,
      status: 'pending',
      progress: 0,
      completedLocales: [],
      failedLocales: [],
      createdAt: new Date(),
    };

    this.jobs.set(job.id, job);
    this.emit('job:created', job);

    // Start processing asynchronously
    this.processTranslationJob(job.id).catch(error => {
      console.error('Translation job error:', error);
    });

    return job;
  }

  /**
   * Process translation job
   */
  private async processTranslationJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'in_progress';
    job.startedAt = new Date();
    this.jobs.set(jobId, job);
    this.emit('job:started', job);

    const { request } = job;
    const totalLocales = request.targetLocales.length;

    for (let i = 0; i < request.targetLocales.length; i++) {
      const targetLocale = request.targetLocales[i];

      try {
        // Check translation memory first
        let translatedText: string | null = null;
        let quality: TranslationQuality = 'machine';
        let confidenceScore = 0;

        if (this.config.translationMemoryEnabled) {
          const memoryMatch = await this.findTranslationMemory(
            request.sourceText,
            request.sourceLocale,
            targetLocale,
            request.contentType
          );

          if (memoryMatch) {
            translatedText = memoryMatch.translatedText;
            quality = 'human_reviewed';
            confidenceScore = 0.95;
          }
        }

        // Use machine translation if no memory match
        if (!translatedText && this.config.enableMachineTranslation) {
          const result = await this.machineTranslate(
            request.sourceText,
            request.sourceLocale,
            targetLocale,
            request.context,
            request.glossaryTerms
          );

          translatedText = result.text;
          confidenceScore = result.confidence;
        }

        if (translatedText) {
          // Apply glossary terms
          if (this.config.glossaryEnabled) {
            translatedText = await this.applyGlossary(
              translatedText,
              request.sourceLocale,
              targetLocale
            );
          }

          // Save translation
          await this.setTranslation(
            request.contentId,
            targetLocale,
            translatedText,
            quality,
            confidenceScore
          );

          job.completedLocales.push(targetLocale);
        } else {
          job.failedLocales.push(targetLocale);
        }
      } catch (error) {
        console.error(`Translation failed for ${targetLocale}:`, error);
        job.failedLocales.push(targetLocale);
      }

      job.progress = ((i + 1) / totalLocales) * 100;
      this.jobs.set(jobId, job);
      this.emit('job:progress', job);
    }

    // Complete job
    job.completedAt = new Date();
    job.status = job.failedLocales.length === 0
      ? 'completed'
      : job.completedLocales.length === 0
        ? 'failed'
        : 'partially_completed';

    this.jobs.set(jobId, job);
    this.emit('job:completed', job);
  }

  /**
   * Machine translation (simulated)
   */
  private async machineTranslate(
    text: string,
    sourceLocale: string,
    targetLocale: string,
    context?: string,
    glossaryTerms?: Record<string, string>
  ): Promise<{ text: string; confidence: number }> {
    // In production, this would call actual translation API
    // For demo, we'll provide mock translations

    const mockTranslations: Record<string, Record<string, string>> = {
      es: {
        'Welcome to your coaching journey': 'Bienvenido a tu viaje de coaching',
        'Track your habits daily': 'Rastrea tus hábitos diariamente',
        'Set and achieve your goals': 'Establece y alcanza tus metas',
        'Your streak is growing': 'Tu racha está creciendo',
        'Great job completing your habit': 'Excelente trabajo completando tu hábito',
        'You earned a new badge': 'Ganaste una nueva insignia',
        'Level up your skills': 'Mejora tus habilidades',
      },
      fr: {
        'Welcome to your coaching journey': 'Bienvenue dans votre parcours de coaching',
        'Track your habits daily': 'Suivez vos habitudes quotidiennement',
        'Set and achieve your goals': 'Définissez et atteignez vos objectifs',
        'Your streak is growing': 'Votre série augmente',
        'Great job completing your habit': 'Excellent travail pour avoir terminé votre habitude',
        'You earned a new badge': 'Vous avez gagné un nouveau badge',
        'Level up your skills': 'Améliorez vos compétences',
      },
      de: {
        'Welcome to your coaching journey': 'Willkommen auf Ihrer Coaching-Reise',
        'Track your habits daily': 'Verfolgen Sie Ihre Gewohnheiten täglich',
        'Set and achieve your goals': 'Setzen und erreichen Sie Ihre Ziele',
        'Your streak is growing': 'Ihre Serie wächst',
        'Great job completing your habit': 'Tolle Arbeit beim Abschließen Ihrer Gewohnheit',
        'You earned a new badge': 'Sie haben ein neues Abzeichen verdient',
        'Level up your skills': 'Verbessern Sie Ihre Fähigkeiten',
      },
      ja: {
        'Welcome to your coaching journey': 'コーチングの旅へようこそ',
        'Track your habits daily': '毎日の習慣を追跡しましょう',
        'Set and achieve your goals': '目標を設定して達成しましょう',
        'Your streak is growing': '連続記録が伸びています',
        'Great job completing your habit': '習慣を完了できました、素晴らしい！',
        'You earned a new badge': '新しいバッジを獲得しました',
        'Level up your skills': 'スキルをレベルアップしましょう',
      },
      zh: {
        'Welcome to your coaching journey': '欢迎开始您的教练之旅',
        'Track your habits daily': '每天跟踪您的习惯',
        'Set and achieve your goals': '设定并实现您的目标',
        'Your streak is growing': '您的连续记录在增长',
        'Great job completing your habit': '完成习惯做得很好',
        'You earned a new badge': '您获得了一个新徽章',
        'Level up your skills': '提升您的技能',
      },
    };

    const baseLocale = targetLocale.split('-')[0];
    const translations = mockTranslations[baseLocale];

    if (translations && translations[text]) {
      return { text: translations[text], confidence: 0.92 };
    }

    // For texts not in our mock data, return a placeholder
    return {
      text: `[${targetLocale}] ${text}`,
      confidence: 0.75,
    };
  }

  /**
   * Find matching translation memory
   */
  private async findTranslationMemory(
    sourceText: string,
    sourceLocale: string,
    targetLocale: string,
    contentType: ContentType
  ): Promise<TranslationMemory | null> {
    const normalizedSource = sourceText.toLowerCase().trim();

    for (const memory of this.translationMemory.values()) {
      if (
        memory.sourceLocale === sourceLocale &&
        memory.targetLocale === targetLocale &&
        memory.sourceText.toLowerCase().trim() === normalizedSource
      ) {
        // Update usage
        memory.usageCount++;
        memory.lastUsedAt = new Date();
        return memory;
      }
    }

    return null;
  }

  /**
   * Apply glossary terms to translation
   */
  private async applyGlossary(
    translatedText: string,
    sourceLocale: string,
    targetLocale: string
  ): Promise<string> {
    let result = translatedText;
    const baseTarget = targetLocale.split('-')[0];

    for (const term of this.glossary.values()) {
      if (term.sourceLocale === sourceLocale && term.translations[baseTarget]) {
        const targetTerm = term.translations[baseTarget];

        if (term.caseSensitive) {
          result = result.split(term.sourceTerm).join(targetTerm);
        } else {
          const regex = new RegExp(term.sourceTerm, 'gi');
          result = result.replace(regex, targetTerm);
        }
      }
    }

    return result;
  }

  /**
   * Set translation for content
   */
  async setTranslation(
    contentId: string,
    locale: string,
    translatedText: string,
    quality: TranslationQuality = 'machine',
    confidenceScore?: number,
    translatedBy?: string
  ): Promise<ContentTranslation> {
    const key = `${contentId}:${locale}`;
    const existing = this.translations.get(key);

    const translation: ContentTranslation = {
      id: existing?.id || this.generateId(),
      contentId,
      locale,
      translatedText,
      quality,
      translatedAt: new Date(),
      translatedBy,
      isApproved: quality === 'professional' || (confidenceScore && confidenceScore >= this.config.autoTranslateThreshold),
      machineTranslationProvider: quality === 'machine' ? this.config.machineTranslationProvider : undefined,
      confidenceScore,
      version: (existing?.version || 0) + 1,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    this.translations.set(key, translation);

    // Add to translation memory
    if (this.config.translationMemoryEnabled && (quality === 'human_reviewed' || quality === 'professional')) {
      const content = this.content.get(contentId);
      if (content) {
        await this.addToTranslationMemory(
          content.sourceLocale,
          content.sourceText,
          locale,
          translatedText,
          content.type
        );
      }
    }

    this.emit('translation:set', translation);
    return translation;
  }

  /**
   * Get translation for content
   */
  async getTranslation(
    contentId: string,
    locale: string,
    fallbackToSource: boolean = true
  ): Promise<string | null> {
    const key = `${contentId}:${locale}`;
    const translation = this.translations.get(key);

    if (translation) {
      return translation.translatedText;
    }

    // Try base locale
    const baseLocale = locale.split('-')[0];
    if (baseLocale !== locale) {
      const baseKey = `${contentId}:${baseLocale}`;
      const baseTranslation = this.translations.get(baseKey);
      if (baseTranslation) {
        return baseTranslation.translatedText;
      }
    }

    // Fall back to source
    if (fallbackToSource) {
      const content = this.content.get(contentId);
      return content?.sourceText || null;
    }

    return null;
  }

  /**
   * Get all translations for content
   */
  async getTranslations(contentId: string): Promise<Record<string, ContentTranslation>> {
    const result: Record<string, ContentTranslation> = {};

    for (const [key, translation] of this.translations) {
      if (translation.contentId === contentId) {
        result[translation.locale] = translation;
      }
    }

    return result;
  }

  /**
   * Review translation
   */
  async reviewTranslation(
    contentId: string,
    locale: string,
    approved: boolean,
    reviewedBy: string,
    correctedText?: string
  ): Promise<ContentTranslation> {
    const key = `${contentId}:${locale}`;
    const translation = this.translations.get(key);

    if (!translation) {
      throw new Error(`Translation not found: ${contentId} for ${locale}`);
    }

    if (correctedText) {
      translation.translatedText = correctedText;
      translation.quality = 'human_reviewed';
    }

    translation.isApproved = approved;
    translation.reviewedBy = reviewedBy;
    translation.reviewedAt = new Date();
    translation.updatedAt = new Date();

    this.translations.set(key, translation);

    // Update translation memory
    if (approved && this.config.translationMemoryEnabled) {
      const content = this.content.get(contentId);
      if (content) {
        await this.addToTranslationMemory(
          content.sourceLocale,
          content.sourceText,
          locale,
          translation.translatedText,
          content.type
        );
      }
    }

    this.emit('translation:reviewed', translation);
    return translation;
  }

  /**
   * Add to translation memory
   */
  private async addToTranslationMemory(
    sourceLocale: string,
    sourceText: string,
    targetLocale: string,
    translatedText: string,
    contentType: ContentType
  ): Promise<TranslationMemory> {
    const key = `${sourceLocale}:${targetLocale}:${sourceText.toLowerCase().trim()}`;
    const existing = this.translationMemory.get(key);

    const memory: TranslationMemory = {
      id: existing?.id || this.generateId(),
      sourceLocale,
      sourceText,
      targetLocale,
      translatedText,
      contentType,
      usageCount: (existing?.usageCount || 0) + 1,
      lastUsedAt: new Date(),
      createdAt: existing?.createdAt || new Date(),
    };

    this.translationMemory.set(key, memory);
    return memory;
  }

  /**
   * Add glossary term
   */
  async addGlossaryTerm(
    sourceTerm: string,
    sourceLocale: string,
    translations: Record<string, string>,
    options: {
      category?: string;
      notes?: string;
      caseSensitive?: boolean;
    } = {}
  ): Promise<GlossaryTerm> {
    const id = this.generateId();
    const term: GlossaryTerm = {
      id,
      sourceLocale,
      sourceTerm,
      translations,
      category: options.category,
      notes: options.notes,
      caseSensitive: options.caseSensitive ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.glossary.set(id, term);
    this.emit('glossary:added', term);

    return term;
  }

  /**
   * Update glossary term
   */
  async updateGlossaryTerm(
    termId: string,
    updates: Partial<Omit<GlossaryTerm, 'id' | 'createdAt'>>
  ): Promise<GlossaryTerm> {
    const term = this.glossary.get(termId);
    if (!term) {
      throw new Error(`Glossary term not found: ${termId}`);
    }

    const updated: GlossaryTerm = {
      ...term,
      ...updates,
      id: term.id,
      createdAt: term.createdAt,
      updatedAt: new Date(),
    };

    this.glossary.set(termId, updated);
    this.emit('glossary:updated', updated);

    return updated;
  }

  /**
   * Get glossary terms
   */
  async getGlossaryTerms(category?: string): Promise<GlossaryTerm[]> {
    const terms = Array.from(this.glossary.values());
    return category ? terms.filter(t => t.category === category) : terms;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<TranslationJob | null> {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get pending jobs
   */
  async getPendingJobs(): Promise<TranslationJob[]> {
    return Array.from(this.jobs.values())
      .filter(j => j.status === 'pending' || j.status === 'in_progress');
  }

  /**
   * Get translation statistics
   */
  async getStats(): Promise<TranslationStats> {
    const totalContent = this.content.size;
    const translatedContent: Record<string, number> = {};
    const pendingTranslations: Record<string, number> = {};

    for (const locale of this.config.supportedLocales) {
      translatedContent[locale] = 0;
      pendingTranslations[locale] = 0;
    }

    let machineTranslated = 0;
    let humanReviewed = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;

    for (const translation of this.translations.values()) {
      if (translation.isApproved) {
        translatedContent[translation.locale]++;
      } else {
        pendingTranslations[translation.locale]++;
      }

      if (translation.quality === 'machine') {
        machineTranslated++;
      } else {
        humanReviewed++;
      }

      if (translation.confidenceScore !== undefined) {
        totalConfidence += translation.confidenceScore;
        confidenceCount++;
      }
    }

    let tmHits = 0;
    for (const memory of this.translationMemory.values()) {
      tmHits += memory.usageCount;
    }

    return {
      totalContent,
      translatedContent,
      pendingTranslations,
      machineTranslated,
      humanReviewed,
      averageConfidenceScore: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
      translationMemoryHits: tmHits,
      glossaryTermsUsed: this.glossary.size,
    };
  }

  /**
   * Get missing translations for locale
   */
  async getMissingTranslations(locale: string): Promise<ContentItem[]> {
    const missing: ContentItem[] = [];

    for (const content of this.content.values()) {
      const key = `${content.id}:${locale}`;
      const translation = this.translations.get(key);

      if (!translation || !translation.isApproved) {
        missing.push(content);
      }
    }

    return missing;
  }

  /**
   * Bulk translate content
   */
  async bulkTranslate(
    contentIds: string[],
    targetLocales: string[],
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<TranslationJob[]> {
    const jobs: TranslationJob[] = [];

    for (const contentId of contentIds) {
      const content = this.content.get(contentId);
      if (!content) continue;

      const job = await this.requestTranslation({
        contentId,
        sourceText: content.sourceText,
        sourceLocale: content.sourceLocale,
        targetLocales,
        contentType: content.type,
        priority,
      });

      jobs.push(job);
    }

    return jobs;
  }

  /**
   * Export translations
   */
  async exportTranslations(
    contentType?: ContentType,
    locale?: string
  ): Promise<Record<string, Record<string, string>>> {
    const result: Record<string, Record<string, string>> = {};

    for (const content of this.content.values()) {
      if (contentType && content.type !== contentType) continue;

      result[content.id] = {
        source: content.sourceText,
        sourceLocale: content.sourceLocale,
        type: content.type,
      };

      const translations = await this.getTranslations(content.id);
      for (const [loc, translation] of Object.entries(translations)) {
        if (locale && loc !== locale) continue;
        result[content.id][loc] = translation.translatedText;
      }
    }

    return result;
  }

  /**
   * Get supported locales
   */
  getSupportedLocales(): string[] {
    return [...this.config.supportedLocales];
  }
}

/**
 * Get singleton instance
 */
export function getContentTranslationService(config?: Partial<ContentTranslationConfig>): ContentTranslationService {
  if (!instance) {
    instance = new ContentTranslationService(config);
  }
  return instance;
}

/**
 * Reset singleton (for testing)
 */
export function resetContentTranslationService(): void {
  instance = null;
}
