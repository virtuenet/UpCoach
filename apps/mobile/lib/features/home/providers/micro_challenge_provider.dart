import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/micro_challenge.dart';
import '../services/micro_challenge_service.dart';

final microChallengesProvider =
    FutureProvider.autoDispose<List<MicroChallenge>>((ref) async {
  final service = ref.watch(microChallengeServiceProvider);
  return service.fetchChallenges();
});

