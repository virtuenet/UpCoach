import { Router } from 'express';
import { authMiddleware as authenticate } from '../../middleware/auth';
import { db } from '../../services/database';

const router = Router();

// GET /api/v2/sync/changes?since=timestamp
router.get('/changes', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const since = parseInt((req.query.since as string) || '0', 10);

    // Example: aggregate changes from multiple tables (goals, tasks, mood)
    // Real implementation should use per-table updated_at/versioning
    const results = await Promise.all([
      db.query('SELECT id, updated_at, * FROM goals WHERE user_id = $1 AND EXTRACT(EPOCH FROM updated_at)*1000 > $2', [userId, since]),
      db.query('SELECT id, updated_at, * FROM tasks WHERE user_id = $1 AND EXTRACT(EPOCH FROM updated_at)*1000 > $2', [userId, since]),
      db.query('SELECT id, updated_at, * FROM mood_entries WHERE user_id = $1 AND EXTRACT(EPOCH FROM updated_at)*1000 > $2', [userId, since]).catch(() => ({ rows: [] } as unknown)),
    ]);

    const changes: Record<string, unknown>[] = [];
    for (const [idx, name] of ['goals', 'tasks', 'mood_entries'].entries()) {
      for (const row of results[idx].rows) {
        changes.push({
          table_name: name,
          record_id: row.id,
          data: row,
          version: Math.floor(new Date(row.updated_at).getTime()),
        });
      }
    }

    res.json({ success: true, data: changes });
  } catch (e: unknown) {
    res.status(500).json({ success: false, error: e?.message || 'Failed to fetch changes' });
  }
});

// POST /api/v2/sync/operations
router.post('/operations', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const operations = req.body?.operations as unknown[];
    if (!Array.isArray(operations)) {
      return res.status(400).json({ success: false, error: 'operations must be an array' });
    }

    // Apply operations with basic ownership enforcement
    for (const op of operations) {
      const { operation_type, table_name, record_id, data } = op;

      if (!['goals', 'tasks', 'mood_entries'].includes(table_name)) continue;

      if (operation_type === 'create') {
        await db.insert(table_name, { ...data, user_id: userId });
      } else if (operation_type === 'update') {
        await db.update(table_name, { ...data, user_id: userId }, { id: record_id, user_id: userId });
      } else if (operation_type === 'delete') {
        await db.delete(table_name, { id: record_id, user_id: userId });
      }
    }

    res.json({ success: true });
  } catch (e: unknown) {
    res.status(500).json({ success: false, error: e?.message || 'Failed to apply operations' });
  }
});

export default router;


