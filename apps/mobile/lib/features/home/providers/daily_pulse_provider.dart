import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/daily_pulse.dart';
import '../services/daily_pulse_service.dart';

final dailyPulseProvider = FutureProvider.autoDispose<DailyPulse>((ref) async {
  final service = ref.watch(dailyPulseServiceProvider);
  final period = DateTime.now().hour >= 18 ? 'evening' : 'morning';
  final pulse = await service.fetchPulse(period: period);
  return pulse;
});

