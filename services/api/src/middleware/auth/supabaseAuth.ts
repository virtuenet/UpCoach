import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../../services/supabase/SupabaseClient';

/**
 * Middleware that authenticates requests using a Supabase JWT.
 * If successful, it sets req.user with { id, email, role: 'user' }.
 * Note: This does not replace existing JWT auth; use where Supabase tokens are expected.
 */
export async function supabaseAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      res.status(401).json({ success: false, error: 'Invalid Supabase token' });
      return;
    }

    req.user = {
      id: data.user.id,
      email: data.user.email || 'user@upcoach.ai',
      role: 'user',
    };

    next();
  } catch (e) {
    res.status(500).json({ success: false, error: 'Supabase auth error' });
  }
}


