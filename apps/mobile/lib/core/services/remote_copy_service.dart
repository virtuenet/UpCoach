import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/dio_provider.dart';
import '../utils/api_exception.dart';
import '../utils/logger.dart';
import 'offline_service.dart';

class RemoteCopyParams {
  final String namespace;
  final String locale;

  const RemoteCopyParams({
    required this.namespace,
    this.locale = 'en-US',
  });
}

final remoteCopyServiceProvider = Provider<RemoteCopyService>((ref) {
  final dio = ref.watch(dioProvider);
  return RemoteCopyService(dio);
});

final remoteCopyProvider =
    FutureProvider.family<Map<String, String>, RemoteCopyParams>(
        (ref, params) async {
  final service = ref.watch(remoteCopyServiceProvider);
  return service.fetchStringTable(
      namespace: params.namespace, locale: params.locale);
});

class RemoteCopyService {
  RemoteCopyService(this._dio);

  final Dio _dio;
  final OfflineService _offline = OfflineService();

  Future<Map<String, String>> fetchStringTable({
    required String namespace,
    String locale = 'en-US',
    bool forceRefresh = false,
  }) async {
    final cacheKey = 'remote_copy_${namespace}_$locale';

    if (!forceRefresh) {
      final cached = await _offline.getCachedData(cacheKey,
          maxAge: const Duration(hours: 6));
      if (cached != null && cached['entries'] is Map<String, dynamic>) {
        return (cached['entries'] as Map<String, dynamic>).map(
          (key, value) => MapEntry(key, value.toString()),
        );
      }
    }

    try {
      final response = await _dio.get(
        '/public/mobile/strings',
        queryParameters: {
          'locale': locale,
          'variant': 'default',
          'namespace': namespace,
        },
      );

      final entries = <String, String>{};
      final data = response.data['data'] as List<dynamic>? ?? [];

      for (final entry in data) {
        if (entry is Map<String, dynamic>) {
          final key = entry['key'] as String?;
          final value =
              entry['value'] as String? ?? entry['richValue']?.toString();
          if (key != null && value != null) {
            entries[key] = value;
          }
        }
      }

      await _offline.cacheData(cacheKey, {
        'entries': entries,
        'locale': locale,
        'cachedAt': DateTime.now().toIso8601String(),
      });

      return entries;
    } on DioException catch (error) {
      logger.w('Remote copy fetch failed, falling back to cache', error: error);
      final cached = await _offline.getCachedData(cacheKey);
      if (cached != null && cached['entries'] is Map<String, dynamic>) {
        return (cached['entries'] as Map<String, dynamic>).map(
          (key, value) => MapEntry(key, value.toString()),
        );
      }
      throw ApiException.fromDioError(error);
    }
  }
}
