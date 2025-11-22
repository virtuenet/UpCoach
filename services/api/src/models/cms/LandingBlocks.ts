import {
  Model,
  DataTypes,
  Sequelize,
  Optional,
} from 'sequelize';

type BlockStatus = 'draft' | 'scheduled' | 'published' | 'archived';

const STATUS_VALUES: BlockStatus[] = ['draft', 'scheduled', 'published', 'archived'];

interface BaseBlockAttributes {
  id: string;
  key: string;
  locale: string;
  variant: string;
  status: BlockStatus;
  version: number;
  order: number;
  content: Record<string, unknown>;
  media: Record<string, unknown>[];
  abTestGroup?: string | null;
  scheduleStart?: Date | null;
  scheduleEnd?: Date | null;
  publishedAt?: Date | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  metadata: Record<string, unknown>;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type BaseBlockCreationAttributes = Optional<
  BaseBlockAttributes,
  | 'id'
  | 'variant'
  | 'status'
  | 'version'
  | 'order'
  | 'content'
  | 'media'
  | 'metadata'
  | 'notes'
  | 'createdBy'
  | 'updatedBy'
  | 'abTestGroup'
  | 'scheduleStart'
  | 'scheduleEnd'
  | 'publishedAt'
  | 'createdAt'
  | 'updatedAt'
>;

function buildCommonDefinition() {
  return {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    locale: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'en-US',
    },
    variant: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'default',
    },
    status: {
      type: DataTypes.ENUM(...STATUS_VALUES),
      allowNull: false,
      defaultValue: 'draft',
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    media: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    abTestGroup: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    scheduleStart: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    scheduleEnd: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  };
}

abstract class LandingBlockBase<
  Attributes extends BaseBlockAttributes,
  CreationAttributes extends BaseBlockCreationAttributes
> extends Model<Attributes, CreationAttributes> implements BaseBlockAttributes {
  declare id: string;
  declare key: string;
  declare locale: string;
  declare variant: string;
  declare status: BlockStatus;
  declare version: number;
  declare order: number;
  declare content: Record<string, unknown>;
  declare media: Record<string, unknown>[];
  declare abTestGroup?: string | null;
  declare scheduleStart?: Date | null;
  declare scheduleEnd?: Date | null;
  declare publishedAt?: Date | null;
  declare createdBy?: string | null;
  declare updatedBy?: string | null;
  declare metadata: Record<string, unknown>;
  declare notes?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export interface LandingSectionAttributes extends BaseBlockAttributes {
  sectionType: string;
}

export class LandingSection
  extends LandingBlockBase<LandingSectionAttributes, BaseBlockCreationAttributes>
  implements LandingSectionAttributes {
  declare sectionType: string;

  static initializeModel(sequelize: Sequelize): void {
    LandingSection.init(
      {
        ...buildCommonDefinition(),
        sectionType: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'generic',
        },
      },
      {
        sequelize,
        tableName: 'landing_sections',
        modelName: 'LandingSection',
        indexes: [
          {
            unique: true,
            fields: ['key', 'locale', 'variant'],
            name: 'landing_sections_key_locale_variant_idx',
          },
        ],
      }
    );
  }
}

export interface LandingCtaAttributes extends BaseBlockAttributes {
  ctaStyle: string;
  targetUrl?: string | null;
}

export class LandingCtaBlock
  extends LandingBlockBase<LandingCtaAttributes, BaseBlockCreationAttributes>
  implements LandingCtaAttributes {
  declare ctaStyle: string;
  declare targetUrl?: string | null;

  static initializeModel(sequelize: Sequelize): void {
    LandingCtaBlock.init(
      {
        ...buildCommonDefinition(),
        ctaStyle: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'primary',
        },
        targetUrl: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'landing_cta_blocks',
        modelName: 'LandingCtaBlock',
        indexes: [
          {
            unique: true,
            fields: ['key', 'locale', 'variant'],
            name: 'landing_cta_blocks_key_locale_variant_idx',
          },
        ],
      }
    );
  }
}

export interface LandingPricingTierAttributes extends BaseBlockAttributes {
  planCode?: string | null;
  billingInterval: string;
  currency: string;
}

export class LandingPricingTier
  extends LandingBlockBase<LandingPricingTierAttributes, BaseBlockCreationAttributes>
  implements LandingPricingTierAttributes {
  declare planCode?: string | null;
  declare billingInterval: string;
  declare currency: string;

  static initializeModel(sequelize: Sequelize): void {
    LandingPricingTier.init(
      {
        ...buildCommonDefinition(),
        planCode: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        billingInterval: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'monthly',
        },
        currency: {
          type: DataTypes.STRING(5),
          allowNull: false,
          defaultValue: 'USD',
        },
      },
      {
        sequelize,
        tableName: 'landing_pricing_tiers',
        modelName: 'LandingPricingTier',
        indexes: [
          {
            unique: true,
            fields: ['key', 'locale', 'variant'],
            name: 'landing_pricing_tiers_key_locale_variant_idx',
          },
        ],
      }
    );
  }
}

export interface LandingTestimonialAttributes extends BaseBlockAttributes {
  authorName?: string | null;
  authorTitle?: string | null;
  avatarUrl?: string | null;
}

export class LandingTestimonialCard
  extends LandingBlockBase<LandingTestimonialAttributes, BaseBlockCreationAttributes>
  implements LandingTestimonialAttributes {
  declare authorName?: string | null;
  declare authorTitle?: string | null;
  declare avatarUrl?: string | null;

  static initializeModel(sequelize: Sequelize): void {
    LandingTestimonialCard.init(
      {
        ...buildCommonDefinition(),
        authorName: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        authorTitle: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        avatarUrl: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'landing_testimonial_cards',
        modelName: 'LandingTestimonialCard',
        indexes: [
          {
            unique: true,
            fields: ['key', 'locale', 'variant'],
            name: 'landing_testimonial_cards_key_locale_variant_idx',
          },
        ],
      }
    );
  }
}

export interface LandingBlogCardAttributes extends BaseBlockAttributes {
  category?: string | null;
}

export class LandingBlogCard
  extends LandingBlockBase<LandingBlogCardAttributes, BaseBlockCreationAttributes>
  implements LandingBlogCardAttributes {
  declare category?: string | null;

  static initializeModel(sequelize: Sequelize): void {
    LandingBlogCard.init(
      {
        ...buildCommonDefinition(),
        category: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'landing_blog_cards',
        modelName: 'LandingBlogCard',
        indexes: [
          {
            unique: true,
            fields: ['key', 'locale', 'variant'],
            name: 'landing_blog_cards_key_locale_variant_idx',
          },
        ],
      }
    );
  }
}

export interface LandingComparisonTableAttributes extends BaseBlockAttributes {
  layout?: string | null;
}

export class LandingComparisonTable
  extends LandingBlockBase<LandingComparisonTableAttributes, BaseBlockCreationAttributes>
  implements LandingComparisonTableAttributes {
  declare layout?: string | null;

  static initializeModel(sequelize: Sequelize): void {
    LandingComparisonTable.init(
      {
        ...buildCommonDefinition(),
        layout: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'landing_comparison_tables',
        modelName: 'LandingComparisonTable',
        indexes: [
          {
            unique: true,
            fields: ['key', 'locale', 'variant'],
            name: 'landing_comparison_tables_key_locale_variant_idx',
          },
        ],
      }
    );
  }
}

export interface RemoteCopyEntryAttributes extends BaseBlockAttributes {
  namespace: string;
  platform: 'mobile' | 'web' | 'shared';
  value: string;
  richValue: Record<string, unknown>;
}

export class RemoteCopyEntry
  extends LandingBlockBase<RemoteCopyEntryAttributes, BaseBlockCreationAttributes>
  implements RemoteCopyEntryAttributes {
  declare namespace: string;
  declare platform: 'mobile' | 'web' | 'shared';
  declare value: string;
  declare richValue: Record<string, unknown>;

  static initializeModel(sequelize: Sequelize): void {
    RemoteCopyEntry.init(
      {
        ...buildCommonDefinition(),
        namespace: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        platform: {
          type: DataTypes.ENUM('mobile', 'web', 'shared'),
          allowNull: false,
          defaultValue: 'shared',
        },
        value: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: '',
        },
        richValue: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
      },
      {
        sequelize,
        tableName: 'remote_copy_strings',
        modelName: 'RemoteCopyEntry',
        indexes: [
          {
            unique: true,
            fields: ['key', 'locale', 'variant', 'namespace', 'platform'],
            name: 'remote_copy_strings_unique_idx',
          },
        ],
      }
    );
  }
}

