import { Router } from 'express';
import { authMiddleware as authenticate } from '../../middleware/auth';
import { db } from '../../services/database';

const router = Router();

// GET org branding config
router.get('/orgs/:id/branding', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT settings->>\'branding\' as branding FROM organizations WHERE id = $1', [id]);
    const branding = result.rows[0]?.branding ? JSON.parse(result.rows[0].branding) : {};
    res.json({ success: true, data: branding });
  } catch (e: unknown) {
    res.status(500).json({ success: false, error: e?.message || 'Failed to load branding' });
  }
});

export default router;


