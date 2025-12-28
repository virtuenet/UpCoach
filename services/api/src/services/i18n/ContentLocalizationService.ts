/**
 * Content Localization Service - Phase 14 Week 1
 * Manages localized content (habit templates, goal templates, coaching content)
 */

import { EventEmitter } from 'events';

export interface LocalizedContent {
  id: string;
  contentType: 'habit_template' | 'goal_template' | 'coaching_tip' | 'achievement' | 'article' | 'notification_template';
  referenceId: string; // ID of the underlying content
  locale: string;
  title: string;
  description?: string;
  content?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  status: 'draft' | 'published' | 'archived';
  tags?: string[];
}

export interface ContentTranslationRequest {
  contentId: string;
  sourceLocale: string;
  targetLocales: string[];
  priority: 'high' | 'medium' | 'low';
  requestedBy: string;
  requestedAt: Date;
}

export class ContentLocalizationService extends EventEmitter {
  private localizedContent: Map<string, LocalizedContent[]> = new Map(); // referenceId -> LocalizedContent[]
  private translationRequests: Map<string, ContentTranslationRequest> = new Map();
  private supportedLocales: string[];
  private defaultLocale: string;

  constructor(supportedLocales: string[] = ['en-US', 'es-ES', 'pt-BR', 'fr-FR', 'de-DE', 'ja-JP']) {
    super();
    this.supportedLocales = supportedLocales;
    this.defaultLocale = supportedLocales[0];
  }

  /**
   * Store localized content
   */
  async storeLocalizedContent(content: Omit<LocalizedContent, 'id' | 'createdAt' | 'updatedAt'>): Promise<LocalizedContent> {
    const localizedContent: LocalizedContent = {
      ...content,
      id: `${content.referenceId}-${content.locale}-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to map
    const existing = this.localizedContent.get(content.referenceId) || [];
    const filtered = existing.filter(c => c.locale !== content.locale);
    this.localizedContent.set(content.referenceId, [...filtered, localizedContent]);

    this.emit('content:stored', localizedContent);

    return localizedContent;
  }

  /**
   * Get localized content by reference ID and locale
   */
  async getLocalizedContent(
    referenceId: string,
    locale: string
  ): Promise<LocalizedContent | null> {
    const contents = this.localizedContent.get(referenceId) || [];

    // Try exact match
    let content = contents.find(c => c.locale === locale && c.status === 'published');

    // Try base language match (e.g., 'en' for 'en-US')
    if (!content) {
      const baseLocale = locale.split('-')[0];
      content = contents.find(
        c => c.locale.startsWith(baseLocale) && c.status === 'published'
      );
    }

    // Fallback to default locale
    if (!content) {
      content = contents.find(
        c => c.locale === this.defaultLocale && c.status === 'published'
      );
    }

    return content || null;
  }

  /**
   * Get all localizations for a content item
   */
  async getAllLocalizations(referenceId: string): Promise<LocalizedContent[]> {
    return this.localizedContent.get(referenceId) || [];
  }

  /**
   * Request translation for content
   */
  async requestTranslation(request: Omit<ContentTranslationRequest, 'requestedAt'>): Promise<ContentTranslationRequest> {
    const translationRequest: ContentTranslationRequest = {
      ...request,
      requestedAt: new Date(),
    };

    this.translationRequests.set(request.contentId, translationRequest);
    this.emit('translation:requested', translationRequest);

    return translationRequest;
  }

  /**
   * Get translation requests by status
   */
  async getTranslationRequests(priority?: ContentTranslationRequest['priority']): Promise<ContentTranslationRequest[]> {
    const requests = Array.from(this.translationRequests.values());

    if (priority) {
      return requests.filter(r => r.priority === priority);
    }

    return requests;
  }

  /**
   * Get localization coverage for content type
   */
  async getLocalizationCoverage(contentType: LocalizedContent['contentType']): Promise<{
    locale: string;
    total: number;
    published: number;
    draft: number;
    archived: number;
    coverage: number; // percentage
  }[]> {
    const coverage: Map<string, {
      total: number;
      published: number;
      draft: number;
      archived: number;
    }> = new Map();

    // Count by locale
    for (const contents of this.localizedContent.values()) {
      for (const content of contents) {
        if (content.contentType === contentType) {
          const stats = coverage.get(content.locale) || {
            total: 0,
            published: 0,
            draft: 0,
            archived: 0,
          };

          stats.total++;
          stats[content.status]++;
          coverage.set(content.locale, stats);
        }
      }
    }

    // Get total items (from default locale)
    const defaultStats = coverage.get(this.defaultLocale);
    const totalItems = defaultStats?.total || 0;

    // Calculate coverage percentages
    return this.supportedLocales.map(locale => {
      const stats = coverage.get(locale) || {
        total: 0,
        published: 0,
        draft: 0,
        archived: 0,
      };

      return {
        locale,
        ...stats,
        coverage: totalItems > 0 ? (stats.published / totalItems) * 100 : 0,
      };
    });
  }

  /**
   * Get missing translations
   */
  async getMissingTranslations(contentType: LocalizedContent['contentType']): Promise<{
    referenceId: string;
    missingLocales: string[];
  }[]> {
    const allReferenceIds = new Set<string>();
    const localesByReferenceId = new Map<string, Set<string>>();

    // Collect all reference IDs and their locales
    for (const [referenceId, contents] of this.localizedContent.entries()) {
      const typeContents = contents.filter(c => c.contentType === contentType);

      if (typeContents.length > 0) {
        allReferenceIds.add(referenceId);
        const locales = new Set(
          typeContents
            .filter(c => c.status === 'published')
            .map(c => c.locale)
        );
        localesByReferenceId.set(referenceId, locales);
      }
    }

    // Find missing locales for each reference ID
    const missing: {
      referenceId: string;
      missingLocales: string[];
    }[] = [];

    for (const referenceId of allReferenceIds) {
      const existingLocales = localesByReferenceId.get(referenceId) || new Set();
      const missingLocales = this.supportedLocales.filter(
        locale => !existingLocales.has(locale)
      );

      if (missingLocales.length > 0) {
        missing.push({
          referenceId,
          missingLocales,
        });
      }
    }

    return missing;
  }

  /**
   * Bulk create habit templates (localized)
   */
  async bulkCreateHabitTemplates(templates: Array<{
    referenceId: string;
    localizations: Array<{
      locale: string;
      title: string;
      description: string;
    }>;
  }>): Promise<LocalizedContent[]> {
    const created: LocalizedContent[] = [];

    for (const template of templates) {
      for (const localization of template.localizations) {
        const content = await this.storeLocalizedContent({
          contentType: 'habit_template',
          referenceId: template.referenceId,
          locale: localization.locale,
          title: localization.title,
          description: localization.description,
          status: 'published',
        });
        created.push(content);
      }
    }

    return created;
  }

  /**
   * Bulk create goal templates (localized)
   */
  async bulkCreateGoalTemplates(templates: Array<{
    referenceId: string;
    localizations: Array<{
      locale: string;
      title: string;
      description: string;
    }>;
  }>): Promise<LocalizedContent[]> {
    const created: LocalizedContent[] = [];

    for (const template of templates) {
      for (const localization of template.localizations) {
        const content = await this.storeLocalizedContent({
          contentType: 'goal_template',
          referenceId: template.referenceId,
          locale: localization.locale,
          title: localization.title,
          description: localization.description,
          status: 'published',
        });
        created.push(content);
      }
    }

    return created;
  }

  /**
   * Bulk create coaching tips (localized)
   */
  async bulkCreateCoachingTips(tips: Array<{
    referenceId: string;
    localizations: Array<{
      locale: string;
      title: string;
      content: string;
    }>;
  }>): Promise<LocalizedContent[]> {
    const created: LocalizedContent[] = [];

    for (const tip of tips) {
      for (const localization of tip.localizations) {
        const content = await this.storeLocalizedContent({
          contentType: 'coaching_tip',
          referenceId: tip.referenceId,
          locale: localization.locale,
          title: localization.title,
          content: localization.content,
          status: 'published',
        });
        created.push(content);
      }
    }

    return created;
  }

  /**
   * Get habit templates by locale
   */
  async getHabitTemplates(locale: string): Promise<LocalizedContent[]> {
    const templates: LocalizedContent[] = [];

    for (const contents of this.localizedContent.values()) {
      const habitTemplates = contents.filter(
        c => c.contentType === 'habit_template'
      );

      for (const template of habitTemplates) {
        const localized = await this.getLocalizedContent(
          template.referenceId,
          locale
        );
        if (localized && !templates.some(t => t.referenceId === localized.referenceId)) {
          templates.push(localized);
        }
      }
    }

    return templates;
  }

  /**
   * Get goal templates by locale
   */
  async getGoalTemplates(locale: string): Promise<LocalizedContent[]> {
    const templates: LocalizedContent[] = [];

    for (const contents of this.localizedContent.values()) {
      const goalTemplates = contents.filter(
        c => c.contentType === 'goal_template'
      );

      for (const template of goalTemplates) {
        const localized = await this.getLocalizedContent(
          template.referenceId,
          locale
        );
        if (localized && !templates.some(t => t.referenceId === localized.referenceId)) {
          templates.push(localized);
        }
      }
    }

    return templates;
  }

  /**
   * Get coaching tips by locale
   */
  async getCoachingTips(locale: string): Promise<LocalizedContent[]> {
    const tips: LocalizedContent[] = [];

    for (const contents of this.localizedContent.values()) {
      const coachingTips = contents.filter(
        c => c.contentType === 'coaching_tip'
      );

      for (const tip of coachingTips) {
        const localized = await this.getLocalizedContent(
          tip.referenceId,
          locale
        );
        if (localized && !tips.some(t => t.referenceId === localized.referenceId)) {
          tips.push(localized);
        }
      }
    }

    return tips;
  }

  /**
   * Update localized content
   */
  async updateLocalizedContent(
    id: string,
    updates: Partial<Omit<LocalizedContent, 'id' | 'createdAt'>>
  ): Promise<LocalizedContent | null> {
    for (const [referenceId, contents] of this.localizedContent.entries()) {
      const index = contents.findIndex(c => c.id === id);

      if (index !== -1) {
        const updated: LocalizedContent = {
          ...contents[index],
          ...updates,
          updatedAt: new Date(),
        };

        contents[index] = updated;
        this.localizedContent.set(referenceId, contents);
        this.emit('content:updated', updated);

        return updated;
      }
    }

    return null;
  }

  /**
   * Delete localized content
   */
  async deleteLocalizedContent(id: string): Promise<boolean> {
    for (const [referenceId, contents] of this.localizedContent.entries()) {
      const index = contents.findIndex(c => c.id === id);

      if (index !== -1) {
        const deleted = contents.splice(index, 1)[0];
        this.localizedContent.set(referenceId, contents);
        this.emit('content:deleted', deleted);

        return true;
      }
    }

    return false;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalContent: number;
    byContentType: Record<LocalizedContent['contentType'], number>;
    byLocale: Record<string, number>;
    byStatus: Record<LocalizedContent['status'], number>;
    averageCoverage: number;
  } {
    let totalContent = 0;
    const byContentType: Record<string, number> = {};
    const byLocale: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const contents of this.localizedContent.values()) {
      for (const content of contents) {
        totalContent++;
        byContentType[content.contentType] = (byContentType[content.contentType] || 0) + 1;
        byLocale[content.locale] = (byLocale[content.locale] || 0) + 1;
        byStatus[content.status] = (byStatus[content.status] || 0) + 1;
      }
    }

    // Calculate average coverage
    const defaultLocaleCount = byLocale[this.defaultLocale] || 0;
    let totalCoverage = 0;

    for (const locale of this.supportedLocales) {
      const count = byLocale[locale] || 0;
      const coverage = defaultLocaleCount > 0 ? (count / defaultLocaleCount) * 100 : 0;
      totalCoverage += coverage;
    }

    const averageCoverage = this.supportedLocales.length > 0
      ? totalCoverage / this.supportedLocales.length
      : 0;

    return {
      totalContent,
      byContentType: byContentType as Record<LocalizedContent['contentType'], number>,
      byLocale,
      byStatus: byStatus as Record<LocalizedContent['status'], number>,
      averageCoverage,
    };
  }
}

// Singleton instance
export const contentLocalizationService = new ContentLocalizationService();
