import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/api_service.dart';
import '../models/daily_pulse.dart';

class DailyPulseService {
  DailyPulseService(this._api);

  final ApiService _api;

  Future<DailyPulse> fetchPulse({String period = 'auto'}) async {
    Response<dynamic> response;
    try {
      response = await _api.get(
        '/api/ai/pulse',
        queryParameters: period == 'auto' ? null : {'period': period},
      );
    } on DioException catch (error) {
      final message = error.error?.toString() ??
          error.message ??
          'Unable to load daily pulse';
      throw Exception(message);
    }

    final data = response.data as Map<String, dynamic>? ?? {};
    final pulseJson = data['pulse'] as Map<String, dynamic>? ?? {};
    return DailyPulse.fromJson(pulseJson);
  }
}

final dailyPulseServiceProvider = Provider<DailyPulseService>((ref) {
  final api = ref.watch(apiServiceProvider);
  return DailyPulseService(api);
});
