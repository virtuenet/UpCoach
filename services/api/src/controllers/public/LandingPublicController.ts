import { Request, Response } from 'express';
import { cacheGet, cacheSet } from '../../config/redis';
import { LandingBlockService } from '../../services/cms/LandingBlockService';
import { logger } from '../../utils/logger';

const PUBLIC_CACHE_TTL = 60; // seconds

export class LandingPublicController {
  static async hero(req: Request, res: Response) {
    return LandingPublicController.respondWithBlocks('sections', req, res, 1);
  }

  static async sections(req: Request, res: Response) {
    return LandingPublicController.respondWithBlocks('sections', req, res);
  }

  static async cta(req: Request, res: Response) {
    return LandingPublicController.respondWithBlocks('cta-blocks', req, res);
  }

  static async pricing(req: Request, res: Response) {
    return LandingPublicController.respondWithBlocks('pricing-tiers', req, res);
  }

  static async testimonials(req: Request, res: Response) {
    return LandingPublicController.respondWithBlocks('testimonials', req, res);
  }

  static async blogCards(req: Request, res: Response) {
    return LandingPublicController.respondWithBlocks('blog-cards', req, res);
  }

  static async comparisonTables(req: Request, res: Response) {
    return LandingPublicController.respondWithBlocks('comparison-tables', req, res);
  }

  static async mobileStrings(req: Request, res: Response) {
    return LandingPublicController.respondWithBlocks('remote-copy', req, res);
  }

  static async respondWithBlocks(
    blockType: Parameters<typeof LandingBlockService.inferBlockTypeFromParam>[0],
    req: Request,
    res: Response,
    limit?: number
  ) {
    try {
      const locale = typeof req.query.locale === 'string' ? req.query.locale : 'en-US';
      const variant = typeof req.query.variant === 'string' ? req.query.variant : 'default';
      const previewToken = typeof req.query.previewToken === 'string' ? req.query.previewToken : undefined;
      const expectedToken = process.env.CMS_PREVIEW_TOKEN;
      const isPreview = Boolean(previewToken && expectedToken && previewToken === expectedToken);
      const statusFilter =
        typeof req.query.status === 'string'
          ? req.query.status
          : isPreview
            ? 'draft'
            : 'published';
      const resolvedType = LandingBlockService.inferBlockTypeFromParam(blockType);

      const cacheKey = `public:${resolvedType}:${locale}:${variant}:${limit ?? 'all'}`;

      if (!isPreview) {
        const cached = await cacheGet<{ data: unknown[]; locale: string; variant: string }>(cacheKey).catch(() => null);
        if (cached) {
          res.set('X-Cache', 'HIT');
          res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
          return res.json(cached);
        }
      }

      const records = await LandingBlockService.getPublishedForPublic(resolvedType, {
        locale,
        variant,
        limit,
        status: statusFilter,
      });

      const payload = {
        data: records,
        locale,
        variant,
        generatedAt: new Date().toISOString(),
        preview: isPreview,
      };

      if (!isPreview) {
        await cacheSet(cacheKey, payload, PUBLIC_CACHE_TTL).catch(err =>
          logger.warn('Failed to cache landing content response', { err })
        );
        res.set('X-Cache', 'HIT');
        res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
      } else {
        res.set('X-Preview-Mode', 'true');
        res.set('Cache-Control', 'no-store');
      }
      return res.json(payload);
    } catch (error) {
      logger.error('[LandingPublicController] Failed to load landing content', { error, blockType });
      return res.status(500).json({ message: 'Unable to load landing content' });
    }
  }
}

