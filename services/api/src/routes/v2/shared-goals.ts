import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { db } from '../../services/database';

const router = Router();

// Share a goal with organization
router.post('/:goalId/share', authMiddleware, async (req, res) => {
  try {
    const { goalId } = req.params;
    const orgId = parseInt(req.user?.organizationId || req.body.orgId, 10);
    const userId = req.user?.id;
    if (!orgId) {
      return res.status(400).json({ success: false, message: 'Organization ID required' });
    }
    const inserted = await db.insert('shared_goals', {
      goal_id: goalId,
      org_id: orgId,
      shared_by: userId,
    });
    res.json({ success: true, data: inserted });
  } catch (e: unknown) {
    res.status(500).json({ success: false, message: e?.message || 'Failed to share goal' });
  }
});

// Unshare a goal
router.delete('/:goalId/share', authMiddleware, async (req, res) => {
  try {
    const { goalId } = req.params;
    const orgId = parseInt(req.user?.organizationId || req.body.orgId, 10);
    if (!orgId) {
      return res.status(400).json({ success: false, message: 'Organization ID required' });
    }
    const deleted = await db.delete('shared_goals', { goal_id: goalId, org_id: orgId });
    res.json({ success: true, data: { deleted } });
  } catch (e: unknown) {
    res.status(500).json({ success: false, message: e?.message || 'Failed to unshare goal' });
  }
});

// List shared goals for org (current user)
router.get('/org', authMiddleware, async (req, res) => {
  try {
    const orgId = parseInt(req.user?.organizationId || (req.query.orgId as string), 10);
    if (!orgId) {
      return res.status(400).json({ success: false, message: 'Organization ID required' });
    }
    const rows = await db.query(
      `SELECT sg.id, sg.goal_id, g.title, g.status, g.progress, g.updated_at
       FROM shared_goals sg
       JOIN goals g ON g.id = sg.goal_id
       WHERE sg.org_id = $1
       ORDER BY g.updated_at DESC
       LIMIT 100`,
      [orgId]
    );
    res.json({ success: true, data: rows.rows });
  } catch (e: unknown) {
    res.status(500).json({ success: false, message: e?.message || 'Failed to list shared goals' });
  }
});

export default router;


