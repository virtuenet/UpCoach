import { getSupabaseClient } from '../supabase/SupabaseClient';

export class RealtimeService {
  static async broadcast(event: string, payload: Record<string, any>): Promise<void> {
    const supabase = getSupabaseClient();
    // Using Broadcast channel for simple fan-out; consumers can subscribe from clients
    await supabase.channel('events').send({ type: 'broadcast', event, payload });
  }
}


