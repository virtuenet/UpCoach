/// Performance monitoring and optimization utilities
///
/// Tracks app performance metrics, memory usage, and render times.

import 'dart:async';
import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';

/// Performance metrics data
class PerformanceMetrics {
  final int frameCount;
  final double averageFps;
  final double maxFrameTime;
  final int memoryUsageMb;
  final DateTime timestamp;

  const PerformanceMetrics({
    required this.frameCount,
    required this.averageFps,
    required this.maxFrameTime,
    required this.memoryUsageMb,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'frameCount': frameCount,
        'averageFps': averageFps,
        'maxFrameTime': maxFrameTime,
        'memoryUsageMb': memoryUsageMb,
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
}

/// Performance monitor service
class PerformanceMonitor {
  static final PerformanceMonitor _instance = PerformanceMonitor._internal();
  factory PerformanceMonitor() => _instance;
  PerformanceMonitor._internal();

  // Frame tracking
  final List<Duration> _frameTimes = [];
  int _frameCount = 0;
  DateTime? _lastFrameTime;

  // Route timing
  final Map<String, List<RouteTimingData>> _routeTimings = {};
  final Map<String, DateTime> _routeStartTimes = {};

  // Memory tracking
  final List<int> _memorySnapshots = [];
  Timer? _memoryTimer;

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
  void _captureMemorySnapshot() {
    // Note: Actual memory tracking requires platform-specific implementation
    // This is a placeholder that would integrate with platform channels
    final estimatedMemoryMb = _estimateMemoryUsage();
    _memorySnapshots.add(estimatedMemoryMb);

    // Keep only last 20 snapshots
    if (_memorySnapshots.length > 20) {
      _memorySnapshots.removeAt(0);
    }
  }

  /// Estimate memory usage (placeholder)
  int _estimateMemoryUsage() {
    // In production, this would call platform-specific APIs
    // For now, return a placeholder value
    return 50; // MB
  }

  /// Get current performance metrics
  PerformanceMetrics getMetrics() {
    final avgFps = _calculateAverageFps();
    final maxFrameTime = _calculateMaxFrameTime();
    final memoryUsage = _memorySnapshots.isNotEmpty
        ? _memorySnapshots.last
        : _estimateMemoryUsage();

    return PerformanceMetrics(
      frameCount: _frameCount,
      averageFps: avgFps,
      maxFrameTime: maxFrameTime,
      memoryUsageMb: memoryUsage,
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

    developer.log(
      'Route timing - $routeName: ${navigationTime.inMilliseconds}ms',
    );
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

    return {
      'currentMetrics': metrics.toJson(),
      'routeStats': routeStats,
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

    if (metrics.memoryUsageMb > 150) {
      warnings.add('High memory usage: ${metrics.memoryUsageMb}MB');
    }

    return warnings;
  }

  /// Dispose resources
  void dispose() {
    stopMonitoring();
    _frameTimes.clear();
    _routeTimings.clear();
    _routeStartTimes.clear();
    _memorySnapshots.clear();
    _metricsCallbacks.clear();
  }
}

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
