import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/api_service.dart';
import '../models/micro_challenge.dart';

class MicroChallengeService {
  MicroChallengeService(this._api);

  final ApiService _api;

  Future<List<MicroChallenge>> fetchChallenges({int limit = 4}) async {
    try {
      final response = await _api.get(
        '/api/gamification/micro-challenges',
        queryParameters: {'limit': limit},
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      final rawList = data['data'] as List<dynamic>? ?? [];
      return rawList
          .map((item) => MicroChallenge.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (error) {
      throw Exception(error.error?.toString() ??
          error.message ??
          'Unable to load challenges');
    }
  }

  Future<void> completeChallenge(String challengeId) async {
    try {
      await _api
          .post('/api/gamification/micro-challenges/$challengeId/complete');
    } on DioException catch (error) {
      throw Exception(
          error.error?.toString() ?? 'Unable to complete challenge');
    }
  }
}

final microChallengeServiceProvider = Provider<MicroChallengeService>((ref) {
  final api = ref.watch(apiServiceProvider);
  return MicroChallengeService(api);
});
