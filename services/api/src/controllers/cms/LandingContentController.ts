import { Request, Response } from 'express';
import { LandingBlockService } from '../../services/cms/LandingBlockService';
import { logger } from '../../utils/logger';

export class LandingContentController {
  static async list(req: Request, res: Response) {
    try {
      const blockType = LandingBlockService.inferBlockTypeFromParam(req.params.blockType);
      const { status, locale, variant, search, limit, offset, order } = req.query;

      const data = await LandingBlockService.list(blockType, {
        status: typeof status === 'string' ? status : undefined,
        locale: typeof locale === 'string' ? locale : undefined,
        variant: typeof variant === 'string' ? variant : undefined,
        search: typeof search === 'string' ? search : undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        order: order === 'DESC' ? 'DESC' : 'ASC',
      });

      return res.json({
        data: data.rows,
        pagination: {
          total: data.count,
          limit: data.rows.length,
          offset: Number(offset) || 0,
        },
      });
    } catch (error) {
      logger.error('[LandingContentController:list] Failed to fetch blocks', { error });
      return res.status(500).json({ message: 'Failed to fetch landing content blocks' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const blockType = LandingBlockService.inferBlockTypeFromParam(req.params.blockType);
      const payload = {
        ...req.body,
        createdBy: req.user?.id,
        updatedBy: req.user?.id,
      };
      const record = await LandingBlockService.create(blockType, payload);
      return res.status(201).json({ data: record });
    } catch (error) {
      logger.error('[LandingContentController:create] Failed to create block', { error });
      return res.status(400).json({ message: 'Failed to create landing content block' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const blockType = LandingBlockService.inferBlockTypeFromParam(req.params.blockType);
      const { id } = req.params;
      const payload = {
        ...req.body,
        updatedBy: req.user?.id,
      };
      const record = await LandingBlockService.update(blockType, id, payload);
      return res.json({ data: record });
    } catch (error) {
      logger.error('[LandingContentController:update] Failed to update block', { error });
      return res.status(400).json({ message: 'Failed to update landing content block' });
    }
  }

  static async publish(req: Request, res: Response) {
    try {
      const blockType = LandingBlockService.inferBlockTypeFromParam(req.params.blockType);
      const { id } = req.params;
      const { scheduleStart, scheduleEnd } = req.body ?? {};
      const record = await LandingBlockService.publish(blockType, id, {
        scheduleStart: scheduleStart ? new Date(scheduleStart) : undefined,
        scheduleEnd: scheduleEnd ? new Date(scheduleEnd) : undefined,
      });
      return res.json({ data: record });
    } catch (error) {
      logger.error('[LandingContentController:publish] Failed to publish block', { error });
      return res.status(400).json({ message: 'Failed to publish landing content block' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const blockType = LandingBlockService.inferBlockTypeFromParam(req.params.blockType);
      const { id } = req.params;
      await LandingBlockService.delete(blockType, id);
      return res.status(204).send();
    } catch (error) {
      logger.error('[LandingContentController:delete] Failed to delete block', { error });
      return res.status(400).json({ message: 'Failed to delete landing content block' });
    }
  }

  static async approve(req: Request, res: Response) {
    try {
      const blockType = LandingBlockService.inferBlockTypeFromParam(req.params.blockType);
      const { id } = req.params;
      const { notes } = req.body ?? {};
      const record = await LandingBlockService.approveBlock(blockType, id, req.user?.id, notes);
      return res.json({ data: record });
    } catch (error) {
      logger.error('[LandingContentController:approve] Failed to approve block', { error });
      return res.status(400).json({ message: 'Failed to approve landing content block' });
    }
  }
}

