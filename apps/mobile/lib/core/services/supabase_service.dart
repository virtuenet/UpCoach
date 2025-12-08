import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/app_constants.dart';

class SupabaseService {
  static bool _initialized = false;

  static SupabaseClient get client => Supabase.instance.client;

  static Future<void> initialize() async {
    if (_initialized) return;
    await Supabase.initialize(
      url: AppConstants.supabaseUrl,
      anonKey: AppConstants.supabaseAnonKey,
      realtimeClientOptions: const RealtimeClientOptions(eventsPerSecond: 5),
    );
    _initialized = true;
  }
}
