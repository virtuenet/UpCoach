/**
 * Localized Content Model - Phase 14 Week 3
 * Database schema for storing localized habit templates, goal templates, and coaching tips
 */

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

export type ContentType =
  | 'habit_template'
  | 'goal_template'
  | 'coaching_tip'
  | 'achievement'
  | 'article'
  | 'notification_template'
  | 'onboarding_step'
  | 'help_article';

export type ContentStatus = 'draft' | 'pending_review' | 'published' | 'archived';

export interface LocalizedContentAttributes {
  id: string;
  referenceId: string; // ID of the base content item
  contentType: ContentType;
  locale: string;
  title: string;
  description?: string;
  content: any; // JSON content specific to content type
  metadata?: {
    translatedBy?: 'human' | 'machine' | 'hybrid';
    translationProvider?: string;
    qualityScore?: number;
    reviewedBy?: string;
    reviewedAt?: Date;
    culturalAdaptations?: string[];
    tags?: string[];
  };
  status: ContentStatus;
  version: number;
  isDefault: boolean; // True for the original/source language version
  createdBy?: string;
  updatedBy?: string;
  publishedAt?: Date;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalizedContentCreationAttributes
  extends Optional<
    LocalizedContentAttributes,
    'id' | 'description' | 'metadata' | 'version' | 'isDefault' | 'createdBy' | 'updatedBy' | 'publishedAt' | 'archivedAt' | 'createdAt' | 'updatedAt'
  > {}

export class LocalizedContent
  extends Model<LocalizedContentAttributes, LocalizedContentCreationAttributes>
  implements LocalizedContentAttributes
{
  public id!: string;
  public referenceId!: string;
  public contentType!: ContentType;
  public locale!: string;
  public title!: string;
  public description?: string;
  public content!: any;
  public metadata?: LocalizedContentAttributes['metadata'];
  public status!: ContentStatus;
  public version!: number;
  public isDefault!: boolean;
  public createdBy?: string;
  public updatedBy?: string;
  public publishedAt?: Date;
  public archivedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LocalizedContent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'ID of the base content item (same across all locales)',
    },
    contentType: {
      type: DataTypes.ENUM(
        'habit_template',
        'goal_template',
        'coaching_tip',
        'achievement',
        'article',
        'notification_template',
        'onboarding_step',
        'help_article'
      ),
      allowNull: false,
    },
    locale: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'Locale code (e.g., en-US, es-ES, pt-BR)',
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Localized content specific to content type',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_review', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'True for the original/source language version',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    archivedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'localized_content',
    indexes: [
      {
        fields: ['referenceId', 'locale'],
        unique: true,
        name: 'localized_content_reference_locale_unique',
      },
      {
        fields: ['referenceId'],
        name: 'localized_content_reference_idx',
      },
      {
        fields: ['contentType'],
        name: 'localized_content_type_idx',
      },
      {
        fields: ['locale'],
        name: 'localized_content_locale_idx',
      },
      {
        fields: ['status'],
        name: 'localized_content_status_idx',
      },
      {
        fields: ['contentType', 'locale', 'status'],
        name: 'localized_content_type_locale_status_idx',
      },
    ],
  }
);

/**
 * Content schemas for different content types
 */
export const ContentSchemas = {
  habit_template: {
    name: 'string (required)',
    description: 'string',
    category: 'string',
    icon: 'string',
    defaultFrequency: 'string (daily, weekly, monthly)',
    defaultGoal: 'number',
    tips: 'string[]',
    commonChallenges: 'string[]',
    motivationalQuotes: 'string[]',
  },

  goal_template: {
    name: 'string (required)',
    description: 'string',
    category: 'string',
    icon: 'string',
    timeframe: 'string (short_term, medium_term, long_term)',
    milestones: 'Array<{ title: string, description: string }>',
    suggestedHabits: 'string[]',
    tips: 'string[]',
  },

  coaching_tip: {
    title: 'string (required)',
    content: 'string (required)',
    category: 'string',
    applicableGoals: 'string[]',
    applicableHabits: 'string[]',
    difficulty: 'string (beginner, intermediate, advanced)',
    estimatedReadTime: 'number (minutes)',
  },

  achievement: {
    name: 'string (required)',
    description: 'string',
    icon: 'string',
    category: 'string',
    congratulationMessage: 'string',
    shareMessage: 'string',
  },

  article: {
    title: 'string (required)',
    excerpt: 'string',
    content: 'string (markdown)',
    author: 'string',
    category: 'string',
    tags: 'string[]',
    estimatedReadTime: 'number (minutes)',
    relatedArticles: 'string[]',
  },

  notification_template: {
    subject: 'string',
    body: 'string (required)',
    actionText: 'string',
    actionUrl: 'string',
    category: 'string (reminder, achievement, milestone, tip)',
  },

  onboarding_step: {
    title: 'string (required)',
    description: 'string',
    stepNumber: 'number',
    ctaText: 'string',
    skipText: 'string',
  },

  help_article: {
    title: 'string (required)',
    content: 'string (markdown)',
    category: 'string',
    keywords: 'string[]',
    relatedArticles: 'string[]',
  },
};

/**
 * Helper functions for content management
 */
export class LocalizedContentHelper {
  /**
   * Create new localized content
   */
  static async create(
    referenceId: string,
    contentType: ContentType,
    locale: string,
    data: {
      title: string;
      description?: string;
      content: any;
      metadata?: LocalizedContentAttributes['metadata'];
      status?: ContentStatus;
      isDefault?: boolean;
      createdBy?: string;
    }
  ): Promise<LocalizedContent> {
    return await LocalizedContent.create({
      referenceId,
      contentType,
      locale,
      title: data.title,
      description: data.description,
      content: data.content,
      metadata: data.metadata,
      status: data.status || 'draft',
      version: 1,
      isDefault: data.isDefault || false,
      createdBy: data.createdBy,
    });
  }

  /**
   * Get localized content by reference ID and locale
   */
  static async getByReferenceAndLocale(
    referenceId: string,
    locale: string
  ): Promise<LocalizedContent | null> {
    return await LocalizedContent.findOne({
      where: {
        referenceId,
        locale,
      },
    });
  }

  /**
   * Get all locales for a reference ID
   */
  static async getAllLocales(referenceId: string): Promise<LocalizedContent[]> {
    return await LocalizedContent.findAll({
      where: {
        referenceId,
      },
      order: [
        ['isDefault', 'DESC'],
        ['locale', 'ASC'],
      ],
    });
  }

  /**
   * Get published content by type and locale
   */
  static async getPublishedByTypeAndLocale(
    contentType: ContentType,
    locale: string
  ): Promise<LocalizedContent[]> {
    return await LocalizedContent.findAll({
      where: {
        contentType,
        locale,
        status: 'published',
      },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get default (source) content
   */
  static async getDefault(referenceId: string): Promise<LocalizedContent | null> {
    return await LocalizedContent.findOne({
      where: {
        referenceId,
        isDefault: true,
      },
    });
  }

  /**
   * Update content
   */
  static async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      content?: any;
      metadata?: LocalizedContentAttributes['metadata'];
      status?: ContentStatus;
      updatedBy?: string;
    }
  ): Promise<LocalizedContent | null> {
    const content = await LocalizedContent.findByPk(id);

    if (!content) {
      return null;
    }

    // Increment version if content changed
    if (data.content && JSON.stringify(data.content) !== JSON.stringify(content.content)) {
      content.version += 1;
    }

    await content.update({
      ...data,
      version: content.version,
    });

    return content;
  }

  /**
   * Publish content
   */
  static async publish(id: string, publishedBy?: string): Promise<LocalizedContent | null> {
    const content = await LocalizedContent.findByPk(id);

    if (!content) {
      return null;
    }

    await content.update({
      status: 'published',
      publishedAt: new Date(),
      updatedBy: publishedBy,
    });

    return content;
  }

  /**
   * Archive content
   */
  static async archive(id: string, archivedBy?: string): Promise<LocalizedContent | null> {
    const content = await LocalizedContent.findByPk(id);

    if (!content) {
      return null;
    }

    await content.update({
      status: 'archived',
      archivedAt: new Date(),
      updatedBy: archivedBy,
    });

    return content;
  }

  /**
   * Get missing localizations
   */
  static async getMissingLocalizations(
    referenceId: string,
    targetLocales: string[]
  ): Promise<string[]> {
    const existingLocales = await LocalizedContent.findAll({
      where: {
        referenceId,
      },
      attributes: ['locale'],
    });

    const existing = existingLocales.map(l => l.locale);
    return targetLocales.filter(locale => !existing.includes(locale));
  }

  /**
   * Get localization coverage statistics
   */
  static async getLocalizationCoverage(
    contentType: ContentType,
    targetLocales: string[]
  ): Promise<{
    totalItems: number;
    localeCoverage: Record<string, { count: number; percentage: number }>;
    missingTranslations: number;
  }> {
    // Get all unique reference IDs for this content type
    const allContent = await LocalizedContent.findAll({
      where: {
        contentType,
        isDefault: true,
      },
      attributes: ['referenceId'],
    });

    const totalItems = allContent.length;
    const localeCoverage: Record<string, { count: number; percentage: number }> = {};

    // Calculate coverage for each locale
    for (const locale of targetLocales) {
      const localeContent = await LocalizedContent.count({
        where: {
          contentType,
          locale,
          status: 'published',
        },
      });

      localeCoverage[locale] = {
        count: localeContent,
        percentage: totalItems > 0 ? (localeContent / totalItems) * 100 : 0,
      };
    }

    // Calculate total missing translations
    const expectedTranslations = totalItems * targetLocales.length;
    const actualTranslations = Object.values(localeCoverage).reduce(
      (sum, { count }) => sum + count,
      0
    );
    const missingTranslations = expectedTranslations - actualTranslations;

    return {
      totalItems,
      localeCoverage,
      missingTranslations,
    };
  }

  /**
   * Duplicate content to new locale
   */
  static async duplicateToLocale(
    sourceId: string,
    targetLocale: string,
    createdBy?: string
  ): Promise<LocalizedContent> {
    const source = await LocalizedContent.findByPk(sourceId);

    if (!source) {
      throw new Error('Source content not found');
    }

    // Check if target locale already exists
    const existing = await LocalizedContent.findOne({
      where: {
        referenceId: source.referenceId,
        locale: targetLocale,
      },
    });

    if (existing) {
      throw new Error(`Content already exists for locale ${targetLocale}`);
    }

    // Create new localized version
    return await LocalizedContent.create({
      referenceId: source.referenceId,
      contentType: source.contentType,
      locale: targetLocale,
      title: source.title, // Will need translation
      description: source.description, // Will need translation
      content: source.content, // Will need translation
      metadata: {
        ...source.metadata,
        translatedBy: 'human',
        qualityScore: 0,
      },
      status: 'draft',
      version: 1,
      isDefault: false,
      createdBy,
    });
  }

  /**
   * Search localized content
   */
  static async search(params: {
    contentType?: ContentType;
    locale?: string;
    status?: ContentStatus;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ rows: LocalizedContent[]; count: number }> {
    const where: any = {};

    if (params.contentType) {
      where.contentType = params.contentType;
    }

    if (params.locale) {
      where.locale = params.locale;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.searchTerm) {
      where[sequelize.Op.or] = [
        { title: { [sequelize.Op.iLike]: `%${params.searchTerm}%` } },
        { description: { [sequelize.Op.iLike]: `%${params.searchTerm}%` } },
      ];
    }

    return await LocalizedContent.findAndCountAll({
      where,
      limit: params.limit || 50,
      offset: params.offset || 0,
      order: [['updatedAt', 'DESC']],
    });
  }
}

export default LocalizedContent;
