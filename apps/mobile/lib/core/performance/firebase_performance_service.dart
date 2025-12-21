import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_performance/firebase_performance.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'performance_monitor.dart';

/// Check if Firebase is initialized
bool get _isFirebaseInitialized {
  try {
    Firebase.app();
    return true;
  } catch (_) {
    return false;
  }
}

/// Firebase Performance service for comprehensive app performance monitoring
class FirebasePerformanceService {
  static final FirebasePerformanceService _instance =
      FirebasePerformanceService._internal();
  factory FirebasePerformanceService() => _instance;
  FirebasePerformanceService._internal();

  late final FirebasePerformance _performance;
  bool _isInitialized = false;
  bool _isEnabled = true;

  // Active traces map
  final Map<String, Trace> _activeTraces = {};

  // Metric aggregation
  final Map<String, List<int>> _metricHistory = {};
  static const int _maxMetricHistory = 100;

  /// Initialize Firebase Performance
  Future<void> initialize() async {
    if (_isInitialized) return;

    // Check if Firebase is available
    if (!_isFirebaseInitialized) {
      debugPrint('⚠️ Firebase not available - Performance monitoring disabled');
      return;
    }

    try {
      _performance = FirebasePerformance.instance;

      // Enable performance collection
      await _performance.setPerformanceCollectionEnabled(true);

      _isInitialized = true;
      debugPrint('✅ Firebase Performance initialized');
    } catch (e) {
      debugPrint('❌ Failed to initialize Firebase Performance: $e');
    }
  }

  /// Enable or disable performance collection
  Future<void> setEnabled(bool enabled) async {
    _isEnabled = enabled;
    if (_isInitialized) {
      await _performance.setPerformanceCollectionEnabled(enabled);
    }
  }

  // ============================================================================
  // Custom Traces
  // ============================================================================

  /// Start a custom trace
  Future<Trace?> startTrace(String name) async {
    if (!_isInitialized || !_isEnabled) return null;

    try {
      final trace = _performance.newTrace(name);
      await trace.start();
      _activeTraces[name] = trace;
      debugPrint('📊 Trace started: $name');
      return trace;
    } catch (e) {
      debugPrint('❌ Failed to start trace $name: $e');
      return null;
    }
  }

  /// Stop a custom trace
  Future<void> stopTrace(String name) async {
    final trace = _activeTraces.remove(name);
    if (trace != null) {
      await trace.stop();
      debugPrint('📊 Trace stopped: $name');
    }
  }

  /// Set metric on a trace
  void setTraceMetric(String traceName, String metricName, int value) {
    final trace = _activeTraces[traceName];
    if (trace != null) {
      trace.setMetric(metricName, value);

      // Store in history for aggregation
      _metricHistory.putIfAbsent(metricName, () => []).add(value);
      if (_metricHistory[metricName]!.length > _maxMetricHistory) {
        _metricHistory[metricName]!.removeAt(0);
      }
    }
  }

  /// Increment metric on a trace
  void incrementTraceMetric(String traceName, String metricName, int value) {
    final trace = _activeTraces[traceName];
    trace?.incrementMetric(metricName, value);
  }

  /// Set attribute on a trace
  void setTraceAttribute(String traceName, String attrName, String value) {
    final trace = _activeTraces[traceName];
    trace?.putAttribute(attrName, value);
  }

  /// Execute a function with automatic tracing
  Future<T> traceAsync<T>(
    String traceName,
    Future<T> Function() operation, {
    Map<String, String>? attributes,
    Map<String, int>? metrics,
  }) async {
    final trace = await startTrace(traceName);

    // Add attributes
    attributes?.forEach((key, value) {
      trace?.putAttribute(key, value);
    });

    try {
      final result = await operation();

      // Add success metrics
      metrics?.forEach((key, value) {
        trace?.setMetric(key, value);
      });
      trace?.putAttribute('success', 'true');

      return result;
    } catch (e) {
      trace?.putAttribute('success', 'false');
      trace?.putAttribute('error_type', e.runtimeType.toString());
      rethrow;
    } finally {
      await stopTrace(traceName);
    }
  }

  /// Execute a synchronous function with tracing
  T traceSync<T>(
    String traceName,
    T Function() operation, {
    Map<String, String>? attributes,
  }) {
    // For sync operations, we track using developer timeline
    final startTime = DateTime.now();

    try {
      final result = operation();
      final duration = DateTime.now().difference(startTime);

      _recordSyncTrace(traceName, duration, true, attributes);
      return result;
    } catch (e) {
      final duration = DateTime.now().difference(startTime);
      _recordSyncTrace(traceName, duration, false, {
        ...?attributes,
        'error_type': e.runtimeType.toString(),
      });
      rethrow;
    }
  }

  void _recordSyncTrace(
    String name,
    Duration duration,
    bool success,
    Map<String, String>? attributes,
  ) {
    debugPrint(
        '📊 Sync trace: $name - ${duration.inMilliseconds}ms - success: $success');

    // Store metric for aggregation
    final history = _metricHistory.putIfAbsent('${name}_duration_ms', () => []);
    history.add(duration.inMilliseconds);
  }

  // ============================================================================
  // HTTP Metric Monitoring
  // ============================================================================

  /// Create an HTTP metric for network request monitoring
  Future<HttpMetric?> startHttpMetric(
    String url,
    HttpMethod method,
  ) async {
    if (!_isInitialized || !_isEnabled) return null;

    try {
      final httpMetric = _performance.newHttpMetric(url, method);
      await httpMetric.start();
      return httpMetric;
    } catch (e) {
      debugPrint('❌ Failed to start HTTP metric: $e');
      return null;
    }
  }

  /// Stop an HTTP metric with response details
  Future<void> stopHttpMetric(
    HttpMetric? metric, {
    int? responseCode,
    int? responsePayloadSize,
    int? requestPayloadSize,
    String? contentType,
  }) async {
    if (metric == null) return;

    try {
      metric.httpResponseCode = responseCode;
      metric.responsePayloadSize = responsePayloadSize;
      metric.requestPayloadSize = requestPayloadSize;
      if (contentType != null) {
        metric.responseContentType = contentType;
      }
      await metric.stop();
    } catch (e) {
      debugPrint('❌ Failed to stop HTTP metric: $e');
    }
  }

  // ============================================================================
  // Screen Performance Tracking
  // ============================================================================

  final Map<String, DateTime> _screenStartTimes = {};
  final Map<String, List<int>> _screenLoadTimes = {};

  /// Start tracking screen render time
  void startScreenTrace(String screenName) {
    _screenStartTimes[screenName] = DateTime.now();
    startTrace('screen_$screenName');
  }

  /// End screen trace and record load time
  Future<void> endScreenTrace(String screenName) async {
    final startTime = _screenStartTimes.remove(screenName);
    if (startTime != null) {
      final loadTime = DateTime.now().difference(startTime).inMilliseconds;

      _screenLoadTimes.putIfAbsent(screenName, () => []).add(loadTime);

      // Keep only last 20 load times per screen
      if (_screenLoadTimes[screenName]!.length > 20) {
        _screenLoadTimes[screenName]!.removeAt(0);
      }

      // Set metric on trace before stopping
      setTraceMetric('screen_$screenName', 'load_time_ms', loadTime);
    }

    await stopTrace('screen_$screenName');
  }

  /// Get average screen load time
  double? getAverageScreenLoadTime(String screenName) {
    final times = _screenLoadTimes[screenName];
    if (times == null || times.isEmpty) return null;

    return times.reduce((a, b) => a + b) / times.length;
  }

  /// Get all screen performance stats
  Map<String, Map<String, dynamic>> getScreenPerformanceStats() {
    final stats = <String, Map<String, dynamic>>{};

    for (final entry in _screenLoadTimes.entries) {
      final times = entry.value;
      if (times.isEmpty) continue;

      final avg = times.reduce((a, b) => a + b) / times.length;
      final max = times.reduce((a, b) => a > b ? a : b);
      final min = times.reduce((a, b) => a < b ? a : b);

      stats[entry.key] = {
        'average_ms': avg.round(),
        'max_ms': max,
        'min_ms': min,
        'sample_count': times.length,
      };
    }

    return stats;
  }

  // ============================================================================
  // App Startup Performance
  // ============================================================================

  DateTime? _appStartTime;
  DateTime? _firstFrameTime;
  DateTime? _homeScreenReadyTime;

  /// Mark app start time
  void markAppStart() {
    _appStartTime = DateTime.now();
  }

  /// Mark first frame rendered
  void markFirstFrame() {
    _firstFrameTime = DateTime.now();

    if (_appStartTime != null) {
      final timeToFirstFrame =
          _firstFrameTime!.difference(_appStartTime!).inMilliseconds;
      debugPrint('📊 Time to first frame: ${timeToFirstFrame}ms');

      // Log as trace
      _logStartupMetric('time_to_first_frame_ms', timeToFirstFrame);
    }
  }

  /// Mark home screen ready (fully interactive)
  void markHomeScreenReady() {
    _homeScreenReadyTime = DateTime.now();

    if (_appStartTime != null) {
      final timeToInteractive =
          _homeScreenReadyTime!.difference(_appStartTime!).inMilliseconds;
      debugPrint('📊 Time to interactive: ${timeToInteractive}ms');

      // Log as trace
      _logStartupMetric('time_to_interactive_ms', timeToInteractive);
    }
  }

  void _logStartupMetric(String name, int value) {
    _metricHistory.putIfAbsent(name, () => []).add(value);
  }

  /// Get startup metrics
  Map<String, int?> getStartupMetrics() {
    return {
      'time_to_first_frame_ms': _firstFrameTime != null && _appStartTime != null
          ? _firstFrameTime!.difference(_appStartTime!).inMilliseconds
          : null,
      'time_to_interactive_ms':
          _homeScreenReadyTime != null && _appStartTime != null
              ? _homeScreenReadyTime!.difference(_appStartTime!).inMilliseconds
              : null,
    };
  }

  // ============================================================================
  // API Performance Tracking
  // ============================================================================

  final Map<String, List<int>> _apiResponseTimes = {};
  final Map<String, List<bool>> _apiSuccessRates = {};

  /// Track API call performance
  Future<T> trackApiCall<T>(
    String endpoint,
    Future<T> Function() apiCall, {
    String method = 'GET',
  }) async {
    final startTime = DateTime.now();
    bool success = true;

    try {
      final result = await apiCall();
      return result;
    } catch (e) {
      success = false;
      rethrow;
    } finally {
      final duration = DateTime.now().difference(startTime).inMilliseconds;

      // Record response time
      _apiResponseTimes.putIfAbsent(endpoint, () => []).add(duration);
      if (_apiResponseTimes[endpoint]!.length > 50) {
        _apiResponseTimes[endpoint]!.removeAt(0);
      }

      // Record success/failure
      _apiSuccessRates.putIfAbsent(endpoint, () => []).add(success);
      if (_apiSuccessRates[endpoint]!.length > 50) {
        _apiSuccessRates[endpoint]!.removeAt(0);
      }

      debugPrint(
          '📊 API: $method $endpoint - ${duration}ms - ${success ? 'success' : 'failed'}');
    }
  }

  /// Get API performance stats for an endpoint
  Map<String, dynamic>? getApiStats(String endpoint) {
    final times = _apiResponseTimes[endpoint];
    final successes = _apiSuccessRates[endpoint];

    if (times == null || times.isEmpty) return null;

    final avgTime = times.reduce((a, b) => a + b) / times.length;
    final maxTime = times.reduce((a, b) => a > b ? a : b);
    final minTime = times.reduce((a, b) => a < b ? a : b);
    final successRate = successes != null && successes.isNotEmpty
        ? successes.where((s) => s).length / successes.length
        : null;

    return {
      'endpoint': endpoint,
      'avg_response_ms': avgTime.round(),
      'max_response_ms': maxTime,
      'min_response_ms': minTime,
      'sample_count': times.length,
      'success_rate': successRate,
    };
  }

  /// Get all API performance stats
  Map<String, Map<String, dynamic>> getAllApiStats() {
    final stats = <String, Map<String, dynamic>>{};
    for (final endpoint in _apiResponseTimes.keys) {
      final endpointStats = getApiStats(endpoint);
      if (endpointStats != null) {
        stats[endpoint] = endpointStats;
      }
    }
    return stats;
  }

  // ============================================================================
  // Database Performance
  // ============================================================================

  final Map<String, List<int>> _dbQueryTimes = {};

  /// Track database query performance
  Future<T> trackDatabaseQuery<T>(
    String queryName,
    Future<T> Function() query,
  ) async {
    final startTime = DateTime.now();

    try {
      final result = await query();
      return result;
    } finally {
      final duration = DateTime.now().difference(startTime).inMilliseconds;

      _dbQueryTimes.putIfAbsent(queryName, () => []).add(duration);
      if (_dbQueryTimes[queryName]!.length > 50) {
        _dbQueryTimes[queryName]!.removeAt(0);
      }

      if (duration > 100) {
        debugPrint('⚠️ Slow query: $queryName - ${duration}ms');
      }
    }
  }

  /// Get database query stats
  Map<String, Map<String, dynamic>> getDatabaseStats() {
    final stats = <String, Map<String, dynamic>>{};

    for (final entry in _dbQueryTimes.entries) {
      final times = entry.value;
      if (times.isEmpty) continue;

      final avg = times.reduce((a, b) => a + b) / times.length;
      final max = times.reduce((a, b) => a > b ? a : b);

      stats[entry.key] = {
        'avg_ms': avg.round(),
        'max_ms': max,
        'sample_count': times.length,
        'slow_queries': times.where((t) => t > 100).length,
      };
    }

    return stats;
  }

  // ============================================================================
  // Performance Report
  // ============================================================================

  /// Get comprehensive performance report
  Map<String, dynamic> getPerformanceReport() {
    final localMonitor = PerformanceMonitor();

    return {
      'startup': getStartupMetrics(),
      'screens': getScreenPerformanceStats(),
      'api': getAllApiStats(),
      'database': getDatabaseStats(),
      'frame_metrics': localMonitor.getMetrics().toJson(),
      'route_stats': localMonitor.getAllRouteStats(),
      'warnings': localMonitor.getPerformanceWarnings(),
      'is_performance_good': localMonitor.isPerformanceGood(),
    };
  }

  /// Clear all collected metrics
  void clearMetrics() {
    _metricHistory.clear();
    _screenLoadTimes.clear();
    _apiResponseTimes.clear();
    _apiSuccessRates.clear();
    _dbQueryTimes.clear();
  }

  /// Dispose resources
  void dispose() {
    // Stop all active traces
    for (final traceName in _activeTraces.keys.toList()) {
      stopTrace(traceName);
    }
    clearMetrics();
  }
}

/// Dio interceptor for automatic HTTP performance tracking
class PerformanceInterceptor extends Interceptor {
  final FirebasePerformanceService _performanceService;
  final Map<RequestOptions, HttpMetric?> _metrics = {};

  PerformanceInterceptor(this._performanceService);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final method = _mapDioMethod(options.method);
    final metric = await _performanceService.startHttpMetric(
      options.uri.toString(),
      method,
    );
    _metrics[options] = metric;

    handler.next(options);
  }

  @override
  void onResponse(
    Response response,
    ResponseInterceptorHandler handler,
  ) async {
    final metric = _metrics.remove(response.requestOptions);
    await _performanceService.stopHttpMetric(
      metric,
      responseCode: response.statusCode,
      responsePayloadSize: response.data?.toString().length,
      requestPayloadSize: response.requestOptions.data?.toString().length,
      contentType: response.headers.value('content-type'),
    );

    handler.next(response);
  }

  @override
  void onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final metric = _metrics.remove(err.requestOptions);
    await _performanceService.stopHttpMetric(
      metric,
      responseCode: err.response?.statusCode ?? 0,
    );

    handler.next(err);
  }

  HttpMethod _mapDioMethod(String method) {
    switch (method.toUpperCase()) {
      case 'GET':
        return HttpMethod.Get;
      case 'POST':
        return HttpMethod.Post;
      case 'PUT':
        return HttpMethod.Put;
      case 'DELETE':
        return HttpMethod.Delete;
      case 'PATCH':
        return HttpMethod.Patch;
      case 'HEAD':
        return HttpMethod.Head;
      case 'OPTIONS':
        return HttpMethod.Options;
      default:
        return HttpMethod.Get;
    }
  }
}

/// Provider for FirebasePerformanceService
final firebasePerformanceServiceProvider =
    Provider<FirebasePerformanceService>((ref) {
  return FirebasePerformanceService();
});

/// Helper class for screen performance tracking in StatefulWidgets
/// Use this in your screen's State class:
/// ```dart
/// class _MyScreenState extends State<MyScreen> {
///   late final ScreenPerformanceTracker _perfTracker;
///
///   @override
///   void initState() {
///     super.initState();
///     _perfTracker = ScreenPerformanceTracker('MyScreen');
///     _perfTracker.startTrace();
///   }
///
///   @override
///   void didChangeDependencies() {
///     super.didChangeDependencies();
///     _perfTracker.endTraceOnNextFrame();
///   }
/// }
/// ```
class ScreenPerformanceTracker {
  final String screenName;
  bool _traceEnded = false;

  ScreenPerformanceTracker(this.screenName);

  void startTrace() {
    FirebasePerformanceService().startScreenTrace(screenName);
  }

  void endTraceOnNextFrame() {
    if (_traceEnded) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_traceEnded) {
        FirebasePerformanceService().endScreenTrace(screenName);
        _traceEnded = true;
      }
    });
  }

  void endTrace() {
    if (!_traceEnded) {
      FirebasePerformanceService().endScreenTrace(screenName);
      _traceEnded = true;
    }
  }
}
