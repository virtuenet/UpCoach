import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { tenantContextMiddleware } from '../middleware/tenantContext';
import {
  deltaSyncService,
  BatchSyncRequest,
  DeltaSyncRequest,
} from '../services/sync/DeltaSyncService';

const router = Router();

/**
 * @route POST /api/sync/batch
 * @description Process a batch of sync operations from the client
 * @access Protected
 */
router.post(
  '/batch',
  authMiddleware,
  tenantContextMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const batchRequest = req.body as BatchSyncRequest;

      if (!batchRequest.operations || !Array.isArray(batchRequest.operations)) {
        return res.status(400).json({ error: 'Invalid request: operations array required' });
      }

      const response = await deltaSyncService.processBatchSync(userId, batchRequest);

      return res.json(response);
    } catch (error) {
      console.error('Batch sync error:', error);
      return res.status(500).json({
        error: 'Batch sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @route POST /api/sync/delta
 * @description Get changes since a given timestamp or cursor
 * @access Protected
 */
router.post(
  '/delta',
  authMiddleware,
  tenantContextMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const deltaRequest = req.body as DeltaSyncRequest;

      if (!deltaRequest.entityType) {
        return res.status(400).json({ error: 'Invalid request: entityType required' });
      }

      const response = await deltaSyncService.getDeltaChanges(userId, deltaRequest);

      return res.json(response);
    } catch (error) {
      console.error('Delta sync error:', error);
      return res.status(500).json({
        error: 'Delta sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @route GET /api/sync/status
 * @description Get sync status for the current user
 * @access Protected
 */
router.get(
  '/status',
  authMiddleware,
  tenantContextMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const status = await deltaSyncService.getSyncStatus(userId);

      return res.json(status);
    } catch (error) {
      console.error('Sync status error:', error);
      return res.status(500).json({
        error: 'Failed to get sync status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @route POST /api/sync/full
 * @description Perform a full sync for specified entity types
 * @access Protected
 */
router.post(
  '/full',
  authMiddleware,
  tenantContextMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { entityTypes } = req.body as { entityTypes?: string[] };
      const typesToSync = entityTypes || ['goal', 'habit', 'task', 'mood', 'progress'];

      const results: Record<
        string,
        { entities: unknown[]; count: number; serverTimestamp: string }
      > = {};

      for (const entityType of typesToSync) {
        const response = await deltaSyncService.getDeltaChanges(userId, {
          entityType,
          limit: 10000, // Large limit for full sync
          includeDeleted: true,
        });

        results[entityType] = {
          entities: response.entities,
          count: response.entities.length,
          serverTimestamp: response.serverTimestamp,
        };
      }

      return res.json({
        success: true,
        results,
        serverTimestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Full sync error:', error);
      return res.status(500).json({
        error: 'Full sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @route POST /api/sync/push
 * @description Push local changes to server (client-to-server sync)
 * @access Protected
 */
router.post(
  '/push',
  authMiddleware,
  tenantContextMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { operations, clientTimestamp } = req.body as {
        operations: BatchSyncRequest['operations'];
        clientTimestamp: string;
      };

      if (!operations || !Array.isArray(operations)) {
        return res.status(400).json({ error: 'Invalid request: operations array required' });
      }

      const response = await deltaSyncService.processBatchSync(userId, {
        operations,
        clientTimestamp: clientTimestamp || new Date().toISOString(),
      });

      return res.json({
        success: response.success,
        results: response.results,
        serverTimestamp: response.serverTimestamp,
        conflicts: response.results
          .filter((r) => r.conflict)
          .map((r) => r.conflict),
      });
    } catch (error) {
      console.error('Sync push error:', error);
      return res.status(500).json({
        error: 'Sync push failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @route POST /api/sync/pull
 * @description Pull server changes (server-to-client sync)
 * @access Protected
 */
router.post(
  '/pull',
  authMiddleware,
  tenantContextMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { entityTypes, since, cursors, limit = 100 } = req.body as {
        entityTypes?: string[];
        since?: string;
        cursors?: Record<string, string>;
        limit?: number;
      };

      const typesToSync = entityTypes || ['goal', 'habit', 'task', 'mood', 'progress'];
      const results: Record<string, unknown> = {};
      const newCursors: Record<string, string | undefined> = {};

      for (const entityType of typesToSync) {
        const response = await deltaSyncService.getDeltaChanges(userId, {
          entityType,
          since,
          cursor: cursors?.[entityType],
          limit,
          includeDeleted: true,
        });

        results[entityType] = {
          entities: response.entities,
          hasMore: response.hasMore,
          count: response.entities.length,
        };
        newCursors[entityType] = response.nextCursor;
      }

      return res.json({
        success: true,
        results,
        cursors: newCursors,
        serverTimestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Sync pull error:', error);
      return res.status(500).json({
        error: 'Sync pull failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @route POST /api/sync/resolve-conflict
 * @description Resolve a sync conflict manually
 * @access Protected
 */
router.post(
  '/resolve-conflict',
  authMiddleware,
  tenantContextMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { entityType, entityId, resolution, resolvedData } = req.body as {
        entityType: string;
        entityId: string;
        resolution: 'useLocal' | 'useServer' | 'useMerged';
        resolvedData?: Record<string, unknown>;
      };

      if (!entityType || !entityId || !resolution) {
        return res.status(400).json({
          error: 'Invalid request: entityType, entityId, and resolution required',
        });
      }

      if (resolution === 'useMerged' && !resolvedData) {
        return res.status(400).json({
          error: 'Invalid request: resolvedData required for merged resolution',
        });
      }

      // Apply the resolution
      const response = await deltaSyncService.processBatchSync(userId, {
        operations: [
          {
            id: `conflict-resolution-${Date.now()}`,
            type: 'update',
            entityType,
            entityId,
            data: resolvedData,
            timestamp: new Date().toISOString(),
          },
        ],
        clientTimestamp: new Date().toISOString(),
      });

      return res.json({
        success: response.success,
        result: response.results[0],
        serverTimestamp: response.serverTimestamp,
      });
    } catch (error) {
      console.error('Conflict resolution error:', error);
      return res.status(500).json({
        error: 'Conflict resolution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
