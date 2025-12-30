import 'dart:async';

class OptimisticUIController {
  Future<T> execute<T>({
    required Future<T> Function() apiCall,
    required void Function() optimisticUpdate,
    required void Function() rollback,
    Duration timeout = const Duration(seconds: 30),
  }) async {
    // Apply optimistic update
    optimisticUpdate();

    try {
      // Execute API call
      final result = await apiCall().timeout(timeout);
      return result;
    } catch (e) {
      // Rollback on error
      rollback();
      rethrow;
    }
  }
}
