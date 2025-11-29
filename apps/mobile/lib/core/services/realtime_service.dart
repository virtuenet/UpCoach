import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_service.dart';

class RealtimeService {
  RealtimeChannel? _channel;

  void subscribeToEvents() {
    final client = SupabaseService.client;
    _channel ??= client.channel('events');

    // Subscribe to broadcast events using Supabase 2.x API
    _channel!.onBroadcast(
      event: 'goals_updated',
      callback: (payload) {
        // Handle goals updates, trigger UI refresh as needed
      },
    ).subscribe();
  }

  Future<void> dispose() async {
    if (_channel != null) {
      await SupabaseService.client.removeChannel(_channel!);
      _channel = null;
    }
  }
}


