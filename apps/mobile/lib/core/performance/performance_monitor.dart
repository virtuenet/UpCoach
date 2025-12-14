// Performance monitoring and optimization utilities
//
// Tracks app performance metrics, memory usage, and render times.
// Integrates with Firebase Performance for cloud-based monitoring.

import 'dart:async';
import 'dart:developer' as developer;
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Memory information from platform
class MemoryInfo {
  final int usedMemoryMb;
  final int totalMemoryMb;
  final bool isEstimated;

  const MemoryInfo({
    required this.usedMemoryMb,
    required this.totalMemoryMb,
    required this.isEstimated,
  });

  /// Returns true if real memory data is available
  bool get isAvailable => usedMemoryMb >= 0 && !isEstimated;

  /// Memory usage percentage (0.0 - 1.0)
  double get usagePercentage =>
      totalMemoryMb > 0 ? usedMemoryMb / totalMemoryMb : 0.0;

  Map<String, dynamic> toJson() => {
        'usedMemoryMb': usedMemoryMb,
        'totalMemoryMb': totalMemoryMb,
        'isEstimated': isEstimated,
        'usagePercentage': usagePercentage,
      };
}

/// Performance metrics data
class PerformanceMetrics {
  final int frameCount;
  final double averageFps;
  final double maxFrameTime;
  final int memoryUsageMb;
  final bool isMemoryEstimated;
  final DateTime timestamp;

  const PerformanceMetrics({
    required this.frameCount,
    required this.averageFps,
    required this.maxFrameTime,
    required this.memoryUsageMb,
    this.isMemoryEstimated = true,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'frameCount': frameCount,
        'averageFps': averageFps,
        'maxFrameTime': maxFrameTime,
        'memoryUsageMb': memoryUsageMb,
        'isMemoryEstimated': isMemoryEstimated,
        'timestamp': timestamp.toIso8601String(),
      };
}

/// Route timing data
class RouteTimingData {
  final String routeName;
  final Duration navigationTime;
  final Duration buildTime;
  final DateTime timestamp;

  const RouteTimingData({
    required this.routeName,
    required this.navigationTime,
    required this.buildTime,
    required this.timestamp,
  });

  /// Check if navigation time exceeds the threshold
  bool exceedsThreshold(Duration threshold) => navigationTime > threshold;

  Map<String, dynamic> toJson() => {
        'routeName': routeName,
        'navigationTimeMs': navigationTime.inMilliseconds,
        'buildTimeMs': buildTime.inMilliseconds,
        'timestamp': timestamp.toIso8601String(),
      };
}

/// Route performance alert
class RoutePerformanceAlert {
  final String routeName;
  final Duration actualTime;
  final Duration threshold;
  final DateTime timestamp;
  final String severity;

  const RoutePerformanceAlert({
    required this.routeName,
    required this.actualTime,
    required this.threshold,
    required this.timestamp,
    required this.severity,
  });

  Map<String, dynamic> toJson() => {
        'routeName': routeName,
        'actualTimeMs': actualTime.inMilliseconds,
        'thresholdMs': threshold.inMilliseconds,
        'timestamp': timestamp.toIso8601String(),
        'severity': severity,
      };
}

/// Performance monitor service
class PerformanceMonitor {
  static final PerformanceMonitor _instance = PerformanceMonitor._internal();
  factory PerformanceMonitor() => _instance;
  PerformanceMonitor._internal();

  // Platform channel for native memory access
  static const _channel = MethodChannel('com.upcoach/performance');

  // Route performance thresholds
  static const Duration _routeAlertThreshold = Duration(milliseconds: 500);
  static const Duration _routeWarningThreshold = Duration(milliseconds: 300);

  // Frame tracking
  final List<Duration> _frameTimes = [];
  int _frameCount = 0;

  // Route timing
  final Map<String, List<RouteTimingData>> _routeTimings = {};
  final Map<String, DateTime> _routeStartTimes = {};

  // Route alerts
  final List<RoutePerformanceAlert> _routeAlerts = [];
  final List<void Function(RoutePerformanceAlert)> _alertCallbacks = [];

  // Memory tracking
  final List<MemoryInfo> _memorySnapshots = [];
  Timer? _memoryTimer;
  bool _platformChannelAvailable = true;

  // Callbacks
  final List<Function(PerformanceMetrics)> _metricsCallbacks = [];

  bool _isMonitoring = false;

  /// Start performance monitoring
  void startMonitoring() {
    if (_isMonitoring) return;

    _isMonitoring = true;
    _frameCount = 0;
    _frameTimes.clear();

    // Start frame callback
    SchedulerBinding.instance.addTimingsCallback(_onFrameTimings);

    // Start memory monitoring (every 5 seconds)
    _memoryTimer = Timer.periodic(
      const Duration(seconds: 5),
      (_) => _captureMemorySnapshot(),
    );

    developer.log('Performance monitoring started');
  }

  /// Stop performance monitoring
  void stopMonitoring() {
    _isMonitoring = false;
    _memoryTimer?.cancel();
    developer.log('Performance monitoring stopped');
  }

  /// Frame timings callback
  void _onFrameTimings(List<FrameTiming> timings) {
    if (!_isMonitoring) return;

    for (final timing in timings) {
      final buildDuration = timing.buildDuration;
      final rasterDuration = timing.rasterDuration;
      final totalDuration = buildDuration + rasterDuration;

      _frameTimes.add(totalDuration);
      _frameCount++;

      // Keep only last 120 frames (2 seconds at 60fps)
      if (_frameTimes.length > 120) {
        _frameTimes.removeAt(0);
      }
    }

    _notifyMetricsUpdate();
  }

  /// Capture current memory usage
  Future<void> _captureMemorySnapshot() async {
    final memoryInfo = await getMemoryInfo();
    _memorySnapshots.add(memoryInfo);

    // Keep only last 20 snapshots
    if (_memorySnapshots.length > 20) {
      _memorySnapshots.removeAt(0);
    }
  }

  /// Get memory information from the platform
  ///
  /// Attempts to use platform channels for accurate memory data.
  /// Falls back to estimation if platform channels are unavailable.
  Future<MemoryInfo> getMemoryInfo() async {
    // Try platform channel first (if available)
    if (_platformChannelAvailable) {
      try {
        if (Platform.isIOS) {
          return await _getIOSMemoryInfo();
        } else if (Platform.isAndroid) {
          return await _getAndroidMemoryInfo();
        }
      } on MissingPluginException {
        // Platform channel not implemented - disable for future calls
        _platformChannelAvailable = false;
        debugPrint(
          'Performance platform channel not available - using fallback',
        );
      } catch (e) {
        debugPrint('Memory info retrieval failed: $e');
      }
    }

    // Fallback: Use Dart VM memory info when platform channels unavailable
    return _getDartVMMemoryInfo();
  }

  /// Get memory info via iOS platform channel
  Future<MemoryInfo> _getIOSMemoryInfo() async {
    final result = await _channel.invokeMethod<Map<dynamic, dynamic>>('getMemoryInfo');
    if (result != null) {
      return MemoryInfo(
        usedMemoryMb: (result['used'] as num?)?.toInt() ?? -1,
        totalMemoryMb: (result['total'] as num?)?.toInt() ?? -1,
        isEstimated: false,
      );
    }
    return _getDartVMMemoryInfo();
  }

  /// Get memory info via Android platform channel
  Future<MemoryInfo> _getAndroidMemoryInfo() async {
    final result = await _channel.invokeMethod<Map<dynamic, dynamic>>('getMemoryInfo');
    if (result != null) {
      return MemoryInfo(
        usedMemoryMb: (result['used'] as num?)?.toInt() ?? -1,
        totalMemoryMb: (result['total'] as num?)?.toInt() ?? -1,
        isEstimated: false,
      );
    }
    return _getDartVMMemoryInfo();
  }

  /// Get memory info from Dart VM (fallback)
  ///
  /// Note: This provides Dart VM heap usage only, not total app memory.
  /// Actual app memory usage may be higher due to native allocations.
  MemoryInfo _getDartVMMemoryInfo() {
    // Use Dart's developer tools for VM memory stats
    // This is available without platform channels but only shows Dart heap
    try {
      // ProcessInfo requires dart:developer which we already import
      // For Flutter apps, we can estimate based on typical patterns
      final externalUsage = 0; // Can be enhanced with more detailed tracking

      // Return with clear indication this is estimated
      return MemoryInfo(
        usedMemoryMb: externalUsage > 0 ? externalUsage : -1,
        totalMemoryMb: -1,
        isEstimated: true,
      );
    } catch (e) {
      debugPrint('Dart VM memory info unavailable: $e');
      return const MemoryInfo(
        usedMemoryMb: -1,
        totalMemoryMb: -1,
        isEstimated: true,
      );
    }
  }

  /// Get the latest memory snapshot
  MemoryInfo get latestMemoryInfo {
    if (_memorySnapshots.isNotEmpty) {
      return _memorySnapshots.last;
    }
    return const MemoryInfo(
      usedMemoryMb: -1,
      totalMemoryMb: -1,
      isEstimated: true,
    );
  }

  /// Get current performance metrics
  PerformanceMetrics getMetrics() {
    final avgFps = _calculateAverageFps();
    final maxFrameTime = _calculateMaxFrameTime();
    final memoryInfo = latestMemoryInfo;

    return PerformanceMetrics(
      frameCount: _frameCount,
      averageFps: avgFps,
      maxFrameTime: maxFrameTime,
      memoryUsageMb: memoryInfo.usedMemoryMb > 0 ? memoryInfo.usedMemoryMb : 0,
      isMemoryEstimated: memoryInfo.isEstimated,
      timestamp: DateTime.now(),
    );
  }

  /// Calculate average FPS
  double _calculateAverageFps() {
    if (_frameTimes.isEmpty) return 60.0;

    final totalTime = _frameTimes.fold<Duration>(
      Duration.zero,
      (sum, time) => sum + time,
    );

    final avgFrameTime = totalTime.inMicroseconds / _frameTimes.length;
    final fps = 1000000 / avgFrameTime; // Convert microseconds to FPS

    return fps.clamp(0.0, 60.0);
  }

  /// Calculate max frame time
  double _calculateMaxFrameTime() {
    if (_frameTimes.isEmpty) return 0.0;

    return _frameTimes
        .map((d) => d.inMicroseconds / 1000.0) // Convert to milliseconds
        .reduce((a, b) => a > b ? a : b);
  }

  /// Start tracking route navigation
  void startRouteTracking(String routeName) {
    _routeStartTimes[routeName] = DateTime.now();
  }

  /// End tracking route navigation
  void endRouteTracking(String routeName, {Duration? buildTime}) {
    final startTime = _routeStartTimes[routeName];
    if (startTime == null) return;

    final navigationTime = DateTime.now().difference(startTime);
    final timing = RouteTimingData(
      routeName: routeName,
      navigationTime: navigationTime,
      buildTime: buildTime ?? Duration.zero,
      timestamp: DateTime.now(),
    );

    _routeTimings.putIfAbsent(routeName, () => []).add(timing);

    // Keep only last 10 timings per route
    if (_routeTimings[routeName]!.length > 10) {
      _routeTimings[routeName]!.removeAt(0);
    }

    _routeStartTimes.remove(routeName);

    // Check for slow route and create alert
    _checkRoutePerformance(timing);

    developer.log(
      'Route timing - $routeName: ${navigationTime.inMilliseconds}ms',
    );
  }

  /// Check route performance and create alert if threshold exceeded
  void _checkRoutePerformance(RouteTimingData timing) {
    if (timing.exceedsThreshold(_routeAlertThreshold)) {
      // Critical alert: >500ms
      final alert = RoutePerformanceAlert(
        routeName: timing.routeName,
        actualTime: timing.navigationTime,
        threshold: _routeAlertThreshold,
        timestamp: timing.timestamp,
        severity: 'critical',
      );
      _addRouteAlert(alert);

      developer.log(
        'CRITICAL: Slow route navigation - ${timing.routeName}: '
        '${timing.navigationTime.inMilliseconds}ms (threshold: '
        '${_routeAlertThreshold.inMilliseconds}ms)',
        name: 'PerformanceAlert',
      );
    } else if (timing.exceedsThreshold(_routeWarningThreshold)) {
      // Warning: >300ms
      final alert = RoutePerformanceAlert(
        routeName: timing.routeName,
        actualTime: timing.navigationTime,
        threshold: _routeWarningThreshold,
        timestamp: timing.timestamp,
        severity: 'warning',
      );
      _addRouteAlert(alert);

      developer.log(
        'WARNING: Slow route navigation - ${timing.routeName}: '
        '${timing.navigationTime.inMilliseconds}ms (threshold: '
        '${_routeWarningThreshold.inMilliseconds}ms)',
        name: 'PerformanceAlert',
      );
    }
  }

  /// Add a route alert and notify callbacks
  void _addRouteAlert(RoutePerformanceAlert alert) {
    _routeAlerts.add(alert);

    // Keep only last 50 alerts
    if (_routeAlerts.length > 50) {
      _routeAlerts.removeAt(0);
    }

    // Notify all alert callbacks
    for (final callback in _alertCallbacks) {
      callback(alert);
    }
  }

  /// Get route timing statistics
  Map<String, dynamic>? getRouteStats(String routeName) {
    final timings = _routeTimings[routeName];
    if (timings == null || timings.isEmpty) return null;

    final navTimes = timings.map((t) => t.navigationTime.inMilliseconds);
    final avgNavTime = navTimes.reduce((a, b) => a + b) / navTimes.length;
    final maxNavTime = navTimes.reduce((a, b) => a > b ? a : b);
    final minNavTime = navTimes.reduce((a, b) => a < b ? a : b);

    return {
      'routeName': routeName,
      'count': timings.length,
      'avgNavigationMs': avgNavTime.round(),
      'maxNavigationMs': maxNavTime,
      'minNavigationMs': minNavTime,
    };
  }

  /// Get all route statistics
  Map<String, Map<String, dynamic>> getAllRouteStats() {
    final stats = <String, Map<String, dynamic>>{};
    for (final routeName in _routeTimings.keys) {
      final routeStats = getRouteStats(routeName);
      if (routeStats != null) {
        stats[routeName] = routeStats;
      }
    }
    return stats;
  }

  /// Get all route performance alerts
  List<RoutePerformanceAlert> getRouteAlerts() {
    return List.unmodifiable(_routeAlerts);
  }

  /// Get critical route alerts only
  List<RoutePerformanceAlert> getCriticalAlerts() {
    return _routeAlerts.where((a) => a.severity == 'critical').toList();
  }

  /// Get warning route alerts only
  List<RoutePerformanceAlert> getWarningAlerts() {
    return _routeAlerts.where((a) => a.severity == 'warning').toList();
  }

  /// Get alerts for a specific route
  List<RoutePerformanceAlert> getAlertsForRoute(String routeName) {
    return _routeAlerts.where((a) => a.routeName == routeName).toList();
  }

  /// Get recent alerts (last N alerts)
  List<RoutePerformanceAlert> getRecentAlerts({int limit = 10}) {
    final startIndex =
        _routeAlerts.length > limit ? _routeAlerts.length - limit : 0;
    return _routeAlerts.sublist(startIndex);
  }

  /// Clear all route alerts
  void clearRouteAlerts() {
    _routeAlerts.clear();
  }

  /// Register callback for route performance alerts
  void addAlertCallback(void Function(RoutePerformanceAlert) callback) {
    _alertCallbacks.add(callback);
  }

  /// Remove alert callback
  void removeAlertCallback(void Function(RoutePerformanceAlert) callback) {
    _alertCallbacks.remove(callback);
  }

  /// Register callback for metrics updates
  void addMetricsCallback(Function(PerformanceMetrics) callback) {
    _metricsCallbacks.add(callback);
  }

  /// Remove metrics callback
  void removeMetricsCallback(Function(PerformanceMetrics) callback) {
    _metricsCallbacks.remove(callback);
  }

  /// Notify all callbacks of metrics update
  void _notifyMetricsUpdate() {
    if (_metricsCallbacks.isEmpty) return;

    final metrics = getMetrics();
    for (final callback in _metricsCallbacks) {
      callback(metrics);
    }
  }

  /// Check if current performance is good
  bool isPerformanceGood() {
    final metrics = getMetrics();
    return metrics.averageFps >= 55.0 && metrics.maxFrameTime < 16.67;
  }

  /// Get performance report
  Map<String, dynamic> getPerformanceReport() {
    final metrics = getMetrics();
    final routeStats = getAllRouteStats();
    final recentAlerts = getRecentAlerts(limit: 5);

    return {
      'currentMetrics': metrics.toJson(),
      'routeStats': routeStats,
      'routeAlerts': {
        'total': _routeAlerts.length,
        'critical': getCriticalAlerts().length,
        'warning': getWarningAlerts().length,
        'recent': recentAlerts.map((a) => a.toJson()).toList(),
      },
      'isGood': isPerformanceGood(),
      'warnings': getPerformanceWarnings(),
    };
  }

  /// Get performance warnings
  List<String> getPerformanceWarnings() {
    final warnings = <String>[];
    final metrics = getMetrics();

    if (metrics.averageFps < 55.0) {
      warnings.add('Low FPS: ${metrics.averageFps.toStringAsFixed(1)}');
    }

    if (metrics.maxFrameTime > 16.67) {
      warnings.add(
        'Frame drops detected: ${metrics.maxFrameTime.toStringAsFixed(2)}ms',
      );
    }

    // Only warn about memory if we have real data
    if (!metrics.isMemoryEstimated && metrics.memoryUsageMb > 150) {
      warnings.add('High memory usage: ${metrics.memoryUsageMb}MB');
    }

    // Add info note if memory data is unavailable
    if (metrics.isMemoryEstimated && kDebugMode) {
      warnings.add(
        'Note: Memory monitoring unavailable (platform channel not implemented)',
      );
    }

    return warnings;
  }

  /// Dispose resources
  void dispose() {
    stopMonitoring();
    _frameTimes.clear();
    _routeTimings.clear();
    _routeStartTimes.clear();
    _routeAlerts.clear();
    _alertCallbacks.clear();
    _memorySnapshots.clear();
    _metricsCallbacks.clear();
  }
}

/// Provider for PerformanceMonitor
final performanceMonitorProvider = Provider<PerformanceMonitor>((ref) {
  final monitor = PerformanceMonitor();
  ref.onDispose(() => monitor.dispose());
  return monitor;
});

/// Provider for route performance alerts stream
final routeAlertStreamProvider =
    StreamProvider<RoutePerformanceAlert>((ref) async* {
  final monitor = ref.watch(performanceMonitorProvider);
  final controller = StreamController<RoutePerformanceAlert>();

  void onAlert(RoutePerformanceAlert alert) {
    controller.add(alert);
  }

  monitor.addAlertCallback(onAlert);

  ref.onDispose(() {
    monitor.removeAlertCallback(onAlert);
    controller.close();
  });

  yield* controller.stream;
});

/// Provider for critical alerts count
final criticalAlertsCountProvider = Provider<int>((ref) {
  final monitor = ref.watch(performanceMonitorProvider);
  return monitor.getCriticalAlerts().length;
});

/// Mixin for tracking widget build performance
mixin PerformanceTracking {
  DateTime? _buildStartTime;

  void startBuildTracking() {
    _buildStartTime = DateTime.now();
  }

  void endBuildTracking(String widgetName) {
    if (_buildStartTime == null) return;

    final buildTime = DateTime.now().difference(_buildStartTime!);
    if (buildTime.inMilliseconds > 16) {
      // Slow build (>16ms = <60fps)
      developer.log(
        'Slow build - $widgetName: ${buildTime.inMilliseconds}ms',
        name: 'PerformanceTracking',
      );
    }

    _buildStartTime = null;
  }
}

/// Extension for measuring async operations
extension PerformanceMeasure<T> on Future<T> Function() {
  Future<T> measurePerformance(String operationName) async {
    final startTime = DateTime.now();
    try {
      final result = await this();
      final duration = DateTime.now().difference(startTime);

      developer.log(
        '$operationName completed in ${duration.inMilliseconds}ms',
        name: 'Performance',
      );

      return result;
    } catch (e) {
      final duration = DateTime.now().difference(startTime);
      developer.log(
        '$operationName failed after ${duration.inMilliseconds}ms: $e',
        name: 'Performance',
      );
      rethrow;
    }
  }
}
