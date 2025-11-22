import { Request, Response } from 'express';
import { db } from '../services/database';

export class MarketplaceController {
  static async listCoaches(req: Request, res: Response) {
    try {
      const q = (req.query.q as string) || '';
      const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 50);
      const offset = Math.max(parseInt((req.query.offset as string) || '0', 10), 0);

      const result = await db.query(
        `SELECT id, display_name, title, bio, languages, average_rating, rating_count, hourly_rate, currency, profile_image_url
         FROM coach_profiles
         WHERE is_active = true AND (display_name ILIKE $1 OR coalesce(bio,'') ILIKE $1)
         ORDER BY average_rating DESC NULLS LAST, total_sessions DESC NULLS LAST
         LIMIT $2 OFFSET $3`,
        [q ? `%${q}%` : '%%', limit, offset]
      );

      res.json({ success: true, data: result.rows });
    } catch (e: unknown) {
      res.status(500).json({ success: false, error: e?.message || 'Failed to list coaches' });
    }
  }

  static async getCoach(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await db.query(
        `SELECT id, display_name, title, bio, specializations, certifications, experience_years, languages, timezone,
                average_rating, rating_count, hourly_rate, currency, profile_image_url, intro_video_url
         FROM coach_profiles WHERE id = $1 AND is_active = true`,
        [id]
      );
      if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, data: result.rows[0] });
    } catch (e: unknown) {
      res.status(500).json({ success: false, error: e?.message || 'Failed to fetch coach' });
    }
  }
}


