import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/progress_highlight.dart';
import '../services/progress_highlight_service.dart';

final progressHighlightsProvider =
    FutureProvider.autoDispose<List<ProgressHighlight>>((ref) async {
  final service = ref.watch(progressHighlightServiceProvider);
  return service.fetchHighlights();
});

