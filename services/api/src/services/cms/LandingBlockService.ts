import { Op } from 'sequelize';
import {
  LandingSection,
  LandingCtaBlock,
  LandingPricingTier,
  LandingTestimonialCard,
  LandingBlogCard,
  LandingComparisonTable,
  RemoteCopyEntry,
} from '../../models/cms/LandingBlocks';
import { logger } from '../../utils/logger';
import { assertBlockSchema } from './schemaValidator';
import { AllBlockTypes, LandingBlockType, RemoteCopyType } from './types';

const BLOCK_MODEL_MAP: Record<
  LandingBlockType,
  typeof LandingSection | typeof LandingCtaBlock | typeof LandingPricingTier | typeof LandingTestimonialCard | typeof LandingBlogCard | typeof LandingComparisonTable
> = {
  'sections': LandingSection,
  'cta-blocks': LandingCtaBlock,
  'pricing-tiers': LandingPricingTier,
  'testimonials': LandingTestimonialCard,
  'blog-cards': LandingBlogCard,
  'comparison-tables': LandingComparisonTable,
};

interface ListFilters {
  status?: string;
  locale?: string;
  variant?: string;
  search?: string;
  limit?: number;
  offset?: number;
  order?: 'ASC' | 'DESC';
}

interface BlockPayload {
  key: string;
  locale: string;
  variant?: string;
  status?: string;
  order?: number;
  content?: Record<string, unknown>;
  media?: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
  abTestGroup?: string | null;
  scheduleStart?: Date | null;
  scheduleEnd?: Date | null;
  notes?: string | null;
  [key: string]: unknown;
}

interface RemoteCopyPayload extends BlockPayload {
  namespace: string;
  value: string;
  platform?: 'mobile' | 'web' | 'shared';
  richValue?: Record<string, unknown>;
}

export class LandingBlockService {
  private static resolveModel(blockType: BlockType) {
    const Model = BLOCK_MODEL_MAP[blockType];
    if (!Model) {
      throw new Error(`Unsupported landing block type: ${blockType}`);
    }
    return Model;
  }

  static async list(blockType: AllBlockTypes, filters: ListFilters = {}) {
    const where: Record<string, unknown> = {};
    const { status, locale, variant, search } = filters;

    if (status) where.status = status;
    if (locale) where.locale = locale;
    if (variant) where.variant = variant;
    if (search) {
      where[Op.or] = [
        { key: { [Op.iLike]: `%${search}%` } },
        { notes: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const pagination = {
      limit: filters.limit ?? 50,
      offset: filters.offset ?? 0,
      order: [['order', filters.order ?? 'ASC']],
    } as const;

    if (blockType === 'remote-copy') {
      return RemoteCopyEntry.findAndCountAll({
        where,
        ...pagination,
      });
    }

    const Model = this.resolveModel(blockType);
    return Model.findAndCountAll({
      where,
      ...pagination,
    });
  }

  static async create(blockType: AllBlockTypes, payload: BlockPayload | RemoteCopyPayload) {
    if (blockType === 'remote-copy') {
      assertBlockSchema('remote-copy', payload);
      return RemoteCopyEntry.create(payload as RemoteCopyPayload);
    }

    const Model = this.resolveModel(blockType);
    const normalizedPayload: BlockPayload = {
      ...(payload as BlockPayload),
      content: (payload as BlockPayload).content ?? {},
    };
    assertBlockSchema(blockType, normalizedPayload.content);
    return Model.create(normalizedPayload);
  }

  static async update(blockType: AllBlockTypes, id: string, payload: Partial<BlockPayload | RemoteCopyPayload>) {
    const record = await this.findById(blockType, id);
    if (!record) {
      throw new Error(`Block ${id} not found for type ${blockType}`);
    }

    if (blockType === 'remote-copy') {
      const merged = {
        namespace: (payload as Partial<RemoteCopyPayload>).namespace ?? record.getDataValue('namespace'),
        key: (payload as Partial<RemoteCopyPayload>).key ?? record.getDataValue('key'),
        locale: (payload as Partial<RemoteCopyPayload>).locale ?? record.getDataValue('locale'),
        variant: (payload as Partial<RemoteCopyPayload>).variant ?? record.getDataValue('variant'),
        platform: (payload as Partial<RemoteCopyPayload>).platform ?? record.getDataValue('platform'),
        value: (payload as Partial<RemoteCopyPayload>).value ?? record.getDataValue('value'),
        richValue: (payload as Partial<RemoteCopyPayload>).richValue ?? record.getDataValue('richValue'),
      };
      assertBlockSchema('remote-copy', merged);
      return record.update(payload);
    }

    const mergedContent = {
      ...(record.getDataValue('content') ?? {}),
      ...((payload as Partial<BlockPayload>).content ?? {}),
    };
    assertBlockSchema(blockType, mergedContent);
    return record.update(payload);
  }

  static async delete(blockType: AllBlockTypes, id: string) {
    const record = await this.findById(blockType, id);
    if (!record) {
      throw new Error(`Block ${id} not found for type ${blockType}`);
    }
    await record.destroy();
  }

  static async publish(blockType: AllBlockTypes, id: string, schedule?: { scheduleStart?: Date; scheduleEnd?: Date }) {
    const record = await this.findById(blockType, id);
    if (!record) {
      throw new Error(`Block ${id} not found for type ${blockType}`);
    }

    return record.update({
      status: 'published',
      publishedAt: new Date(),
      scheduleStart: schedule?.scheduleStart ?? null,
      scheduleEnd: schedule?.scheduleEnd ?? null,
    });
  }

  static async approveBlock(
    blockType: AllBlockTypes,
    id: string,
    approverId: string | undefined,
    notes?: string
  ) {
    const record = await this.findById(blockType, id);
    if (!record) {
      throw new Error(`Block ${id} not found for type ${blockType}`);
    }

    const metadata = {
      ...(record.getDataValue('metadata') as Record<string, unknown> ?? {}),
      approvals: [
        ...((record.getDataValue('metadata') as Record<string, unknown>?)?['approvals'] as unknown[]? ?? []),
        {
          approvedBy: approverId,
          notes,
          approvedAt: new Date().toISOString(),
        },
      ],
    };

    return record.update({
      metadata,
      status: 'scheduled',
    });
  }

  private static async findById(blockType: AllBlockTypes, id: string) {
    if (blockType === 'remote-copy') {
      return RemoteCopyEntry.findByPk(id);
    }
    const Model = this.resolveModel(blockType as BlockType);
    return Model.findByPk(id);
  }

  static inferBlockTypeFromParam(param: string): AllBlockTypes {
    switch (param) {
      case 'sections':
      case 'cta-blocks':
      case 'pricing-tiers':
      case 'testimonials':
      case 'blog-cards':
      case 'comparison-tables':
        return param;
      case 'remote-copy':
        return 'remote-copy';
      default:
        logger.warn(`Received unsupported block type param "${param}", defaulting to sections`);
        return 'sections';
    }
  }

  static async getPublishedForPublic(
    blockType: AllBlockTypes,
    filters: { locale?: string; variant?: string; limit?: number; status?: string } = {}
  ) {
    const where: Record<string, unknown> = {
      status: filters.status ?? 'published',
    };
    if (filters.locale) {
      where.locale = filters.locale;
    }
    if (filters.variant) {
      where.variant = filters.variant;
    }

    const queryOptions = {
      where,
      order: [['order', 'ASC']],
      limit: filters.limit ?? 50,
    };

    if (blockType === 'remote-copy') {
      return RemoteCopyEntry.findAll(queryOptions);
    }

    const Model = this.resolveModel(blockType);
    return Model.findAll(queryOptions);
  }
}

