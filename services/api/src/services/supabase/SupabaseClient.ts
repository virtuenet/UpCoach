import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../../config/environment';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = config.supabase.url;
  // Prefer service role key for server-side operations (storage, admin ops)
  const serviceRoleKey = config.supabase.serviceRoleKey || config.supabase.anonKey;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase is not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}


