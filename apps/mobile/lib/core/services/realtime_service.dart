import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_service.dart';

class RealtimeService {
  RealtimeChannel? _channel;

  void subscribeToEvents() {
    final client = SupabaseService.client;
    _channel ??= client.channel('events');
    _channel!.on(RealtimeListenTypes.broadcast, ChannelFilter(event: 'goals_updated'), (payload, [ref]) {
      // Handle goals updates, trigger UI refresh as needed
    }).subscribe();
  }

  Future<void> dispose() async {
    if (_channel != null) {
      await SupabaseService.client.removeChannel(_channel!);
      _channel = null;
    }
  }
}


