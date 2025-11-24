import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/streak_guardian.dart';
import '../services/streak_guardian_service.dart';

final streakGuardiansProvider =
    FutureProvider.autoDispose<List<StreakGuardian>>((ref) async {
  final service = ref.watch(streakGuardianServiceProvider);
  return service.fetchGuardians();
});

