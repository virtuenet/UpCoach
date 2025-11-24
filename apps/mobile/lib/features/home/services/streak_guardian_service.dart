import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/api_service.dart';
import '../models/streak_guardian.dart';

class StreakGuardianService {
  StreakGuardianService(this._api);

  final ApiService _api;

  Future<List<StreakGuardian>> fetchGuardians() async {
    try {
      final response = await _api.get('/api/gamification/guardians');
      final data = response.data as Map<String, dynamic>? ?? {};
      final items = data['data'] as List<dynamic>? ?? [];
      return items
          .map((item) => StreakGuardian.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (error) {
      throw Exception(error.error?.toString() ?? 'Unable to load guardians');
    }
  }

  Future<void> sendCheer(String linkId, String message) async {
    try {
      await _api.post('/api/gamification/guardians/$linkId/cheer', data: {'message': message});
    } on DioException catch (error) {
      throw Exception(error.error?.toString() ?? 'Unable to send cheer');
    }
  }
}

final streakGuardianServiceProvider = Provider<StreakGuardianService>((ref) {
  final api = ref.watch(apiServiceProvider);
  return StreakGuardianService(api);
});

