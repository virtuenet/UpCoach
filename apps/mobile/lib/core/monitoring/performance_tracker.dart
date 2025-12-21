import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/widgets.dart';

/// Performance tracking for Flutter app
class PerformanceTracker {
  static final PerformanceTracker _instance = PerformanceTracker._internal();
  factory PerformanceTracker() => _instance;
  PerformanceTracker._internal();

  final List<FrameMetrics> _frameMetrics = [];
  final Map<String, NavigationMetrics> _navigationMetrics = {};
  final Map<String, WidgetBuildMetrics> _widgetBuildMetrics = {};

  Timer? _frameTrackingTimer;
  bool _isInitialized = false;
  bool _isTrackingFrames = false;

  int _frameCount = 0;
  int _slowFrameCount = 0;
  int _frozenFrameCount = 0;
  DateTime? _frameTrackingStartTime;

  static const int _maxFrameMetrics = 1000;
  static const Duration _slowFrameThreshold = Duration(milliseconds: 16);
  static const Duration _frozenFrameThreshold = Duration(milliseconds: 700);

  /// Initialize performance tracking
  void initialize() {
    if (_isInitialized) return;

    _isInitialized = true;
    debugPrint('[PerformanceTracker] Initialized');
  }

  /// Dispose
  void dispose() {
    stopFrameTracking();
    _isInitialized = false;
  }

  /// Start tracking frames
  void startFrameTracking() {
    if (_isTrackingFrames) return;

    _isTrackingFrames = true;
    _frameTrackingStartTime = DateTime.now();
    _frameCount = 0;
    _slowFrameCount = 0;
    _frozenFrameCount = 0;

    SchedulerBinding.instance.addTimingsCallback(_onFrameTimings);

    debugPrint('[PerformanceTracker] Frame tracking started');
  }

  /// Stop tracking frames
  void stopFrameTracking() {
    if (!_isTrackingFrames) return;

    _isTrackingFrames = false;
    _frameTrackingTimer?.cancel();

    try {
      SchedulerBinding.instance.removeTimingsCallback(_onFrameTimings);
    } catch (_) {
      // Ignore if callback was already removed
    }

    debugPrint('[PerformanceTracker] Frame tracking stopped');
  }

  void _onFrameTimings(List<FrameTiming> timings) {
    for (final timing in timings) {
      _frameCount++;

      final buildDuration = Duration(
        microseconds: timing.buildDuration.inMicroseconds,
      );
      final rasterDuration = Duration(
        microseconds: timing.rasterDuration.inMicroseconds,
      );
      final totalDuration = Duration(
        microseconds: timing.totalSpan.inMicroseconds,
      );

      if (totalDuration > _slowFrameThreshold) {
        _slowFrameCount++;
      }

      if (totalDuration > _frozenFrameThreshold) {
        _frozenFrameCount++;
        debugPrint('[PerformanceTracker] Frozen frame detected: ${totalDuration.inMilliseconds}ms');
      }

      final metrics = FrameMetrics(
        timestamp: DateTime.now(),
        buildDuration: buildDuration,
        rasterDuration: rasterDuration,
        totalDuration: totalDuration,
        isSlow: totalDuration > _slowFrameThreshold,
        isFrozen: totalDuration > _frozenFrameThreshold,
      );

      _frameMetrics.add(metrics);
      while (_frameMetrics.length > _maxFrameMetrics) {
        _frameMetrics.removeAt(0);
      }
    }
  }

  /// Track navigation timing
  String startNavigation(String routeName) {
    final id = _generateId();
    _navigationMetrics[id] = NavigationMetrics(
      id: id,
      routeName: routeName,
      startTime: DateTime.now(),
    );
    return id;
  }

  /// End navigation timing
  void endNavigation(String id, {bool success = true}) {
    final metrics = _navigationMetrics[id];
    if (metrics == null) return;

    metrics.endTime = DateTime.now();
    metrics.duration = metrics.endTime!.difference(metrics.startTime);
    metrics.success = success;

    if (metrics.duration!.inMilliseconds > 500) {
      debugPrint('[PerformanceTracker] Slow navigation: ${metrics.routeName} took ${metrics.duration!.inMilliseconds}ms');
    }
  }

  /// Track widget build time
  T trackBuild<T>(String widgetName, T Function() builder) {
    final stopwatch = Stopwatch()..start();
    final result = builder();
    stopwatch.stop();

    final metrics = _widgetBuildMetrics[widgetName];
    if (metrics != null) {
      metrics.buildCount++;
      metrics.buildTimes.add(stopwatch.elapsedMicroseconds.toDouble());
      if (metrics.buildTimes.length > 100) {
        metrics.buildTimes.removeAt(0);
      }
      metrics.lastBuild = DateTime.now();
    } else {
      _widgetBuildMetrics[widgetName] = WidgetBuildMetrics(
        widgetName: widgetName,
        buildCount: 1,
        buildTimes: [stopwatch.elapsedMicroseconds.toDouble()],
        lastBuild: DateTime.now(),
      );
    }

    if (stopwatch.elapsedMicroseconds > 16000) {
      debugPrint('[PerformanceTracker] Slow build: $widgetName took ${stopwatch.elapsedMicroseconds}μs');
    }

    return result;
  }

  /// Get frame rate info
  FrameRateInfo getFrameRateInfo() {
    final duration = _frameTrackingStartTime != null
        ? DateTime.now().difference(_frameTrackingStartTime!)
        : Duration.zero;

    final fps = duration.inSeconds > 0 ? _frameCount / duration.inSeconds : 0.0;

    return FrameRateInfo(
      frameCount: _frameCount,
      slowFrameCount: _slowFrameCount,
      frozenFrameCount: _frozenFrameCount,
      fps: fps,
      slowFrameRate: _frameCount > 0 ? _slowFrameCount / _frameCount : 0,
      frozenFrameRate: _frameCount > 0 ? _frozenFrameCount / _frameCount : 0,
      trackingDuration: duration,
    );
  }

  /// Get recent frame metrics
  List<FrameMetrics> getRecentFrameMetrics({int limit = 100}) {
    return _frameMetrics.reversed.take(limit).toList();
  }

  /// Get navigation metrics
  List<NavigationMetrics> getNavigationMetrics() {
    return _navigationMetrics.values
        .where((m) => m.duration != null)
        .toList()
      ..sort((a, b) => b.startTime.compareTo(a.startTime));
  }

  /// Get widget build metrics
  Map<String, WidgetBuildMetrics> getWidgetBuildMetrics() {
    return Map.from(_widgetBuildMetrics);
  }

  /// Get performance summary
  PerformanceSummary getSummary() {
    final frameInfo = getFrameRateInfo();

    final avgBuildTime = _frameMetrics.isEmpty
        ? Duration.zero
        : Duration(
            microseconds: _frameMetrics
                    .map((m) => m.buildDuration.inMicroseconds)
                    .reduce((a, b) => a + b) ~/
                _frameMetrics.length,
          );

    final avgRasterTime = _frameMetrics.isEmpty
        ? Duration.zero
        : Duration(
            microseconds: _frameMetrics
                    .map((m) => m.rasterDuration.inMicroseconds)
                    .reduce((a, b) => a + b) ~/
                _frameMetrics.length,
          );

    final slowWidgets = _widgetBuildMetrics.entries
        .where((e) => e.value.averageBuildTime > 16000)
        .map((e) => e.key)
        .toList();

    return PerformanceSummary(
      frameRateInfo: frameInfo,
      averageBuildTime: avgBuildTime,
      averageRasterTime: avgRasterTime,
      slowWidgets: slowWidgets,
      navigationCount: _navigationMetrics.values
          .where((m) => m.duration != null)
          .length,
    );
  }

  /// Clear all metrics
  void clear() {
    _frameMetrics.clear();
    _navigationMetrics.clear();
    _widgetBuildMetrics.clear();
    _frameCount = 0;
    _slowFrameCount = 0;
    _frozenFrameCount = 0;
  }

  String _generateId() {
    return '${DateTime.now().millisecondsSinceEpoch}_${_randomString(6)}';
  }

  String _randomString(int length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final buffer = StringBuffer();
    for (var i = 0; i < length; i++) {
      buffer.write(chars[(DateTime.now().microsecond + i) % chars.length]);
    }
    return buffer.toString();
  }
}

/// Frame metrics
class FrameMetrics {
  final DateTime timestamp;
  final Duration buildDuration;
  final Duration rasterDuration;
  final Duration totalDuration;
  final bool isSlow;
  final bool isFrozen;

  FrameMetrics({
    required this.timestamp,
    required this.buildDuration,
    required this.rasterDuration,
    required this.totalDuration,
    required this.isSlow,
    required this.isFrozen,
  });
}

/// Navigation metrics
class NavigationMetrics {
  final String id;
  final String routeName;
  final DateTime startTime;
  DateTime? endTime;
  Duration? duration;
  bool success = true;

  NavigationMetrics({
    required this.id,
    required this.routeName,
    required this.startTime,
  });
}

/// Widget build metrics
class WidgetBuildMetrics {
  final String widgetName;
  int buildCount;
  final List<double> buildTimes;
  DateTime lastBuild;

  WidgetBuildMetrics({
    required this.widgetName,
    required this.buildCount,
    required this.buildTimes,
    required this.lastBuild,
  });

  double get averageBuildTime =>
      buildTimes.isEmpty ? 0 : buildTimes.reduce((a, b) => a + b) / buildTimes.length;

  double get maxBuildTime =>
      buildTimes.isEmpty ? 0 : buildTimes.reduce((a, b) => a > b ? a : b);
}

/// Frame rate info
class FrameRateInfo {
  final int frameCount;
  final int slowFrameCount;
  final int frozenFrameCount;
  final double fps;
  final double slowFrameRate;
  final double frozenFrameRate;
  final Duration trackingDuration;

  FrameRateInfo({
    required this.frameCount,
    required this.slowFrameCount,
    required this.frozenFrameCount,
    required this.fps,
    required this.slowFrameRate,
    required this.frozenFrameRate,
    required this.trackingDuration,
  });
}

/// Performance summary
class PerformanceSummary {
  final FrameRateInfo frameRateInfo;
  final Duration averageBuildTime;
  final Duration averageRasterTime;
  final List<String> slowWidgets;
  final int navigationCount;

  PerformanceSummary({
    required this.frameRateInfo,
    required this.averageBuildTime,
    required this.averageRasterTime,
    required this.slowWidgets,
    required this.navigationCount,
  });
}

/// Performance monitor widget overlay
class PerformanceOverlay extends StatefulWidget {
  final Widget child;
  final bool enabled;

  const PerformanceOverlay({
    super.key,
    required this.child,
    this.enabled = false,
  });

  @override
  State<PerformanceOverlay> createState() => _PerformanceOverlayState();
}

class _PerformanceOverlayState extends State<PerformanceOverlay> {
  Timer? _updateTimer;
  FrameRateInfo? _frameInfo;

  @override
  void initState() {
    super.initState();
    if (widget.enabled) {
      PerformanceTracker().startFrameTracking();
      _startUpdateTimer();
    }
  }

  @override
  void dispose() {
    _updateTimer?.cancel();
    super.dispose();
  }

  void _startUpdateTimer() {
    _updateTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {
          _frameInfo = PerformanceTracker().getFrameRateInfo();
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled || _frameInfo == null) {
      return widget.child;
    }

    return Stack(
      children: [
        widget.child,
        Positioned(
          top: 50,
          right: 10,
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.7),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${_frameInfo!.fps.toStringAsFixed(1)} FPS',
                  style: TextStyle(
                    color: _frameInfo!.fps >= 55 ? Colors.green : Colors.red,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                Text(
                  'Slow: ${(_frameInfo!.slowFrameRate * 100).toStringAsFixed(1)}%',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                  ),
                ),
                if (_frameInfo!.frozenFrameCount > 0)
                  Text(
                    'Frozen: ${_frameInfo!.frozenFrameCount}',
                    style: const TextStyle(
                      color: Colors.orange,
                      fontSize: 10,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
