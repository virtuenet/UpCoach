import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/api_service.dart';
import '../models/progress_highlight.dart';

class ProgressHighlightService {
  ProgressHighlightService(this._api);

  final ApiService _api;

  Future<List<ProgressHighlight>> fetchHighlights() async {
    final response = await _api.get('/api/progress/highlights');
    final data = response.data['data'] as List<dynamic>? ?? [];
    return data
        .map((item) => ProgressHighlight.fromJson(item as Map<String, dynamic>))
        .toList();
  }
}

final progressHighlightServiceProvider = Provider<ProgressHighlightService>((ref) {
  final api = ref.watch(apiServiceProvider);
  return ProgressHighlightService(api);
});

