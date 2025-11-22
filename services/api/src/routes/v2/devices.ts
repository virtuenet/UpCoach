import { Router } from 'express';
import { authMiddleware as authenticate } from '../../middleware/auth';
import { db } from '../../services/database';

const router = Router();

// Register device token
router.post('/register', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { token, platform } = req.body || {};
    if (!token || !platform) {
      return res.status(400).json({ success: false, error: 'token and platform are required' });
    }

    await db.query(
      `INSERT INTO devices (user_id, platform, token) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, token) DO UPDATE SET updated_at = NOW(), last_seen = NOW(), platform = EXCLUDED.platform`,
      [userId, platform, token]
    );

    res.json({ success: true });
  } catch (e: unknown) {
    res.status(500).json({ success: false, error: e?.message || 'Failed to register device' });
  }
});

// Update device token (rotation)
router.put('/token', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldToken, newToken } = req.body || {};
    if (!oldToken || !newToken) {
      return res.status(400).json({ success: false, error: 'oldToken and newToken are required' });
    }

    const result = await db.query(
      `UPDATE devices SET token = $1, updated_at = NOW() WHERE user_id = $2 AND token = $3 RETURNING id`,
      [newToken, userId, oldToken]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    res.json({ success: true });
  } catch (e: unknown) {
    res.status(500).json({ success: false, error: e?.message || 'Failed to update token' });
  }
});

export default router;


