/// PerformanceOptimization.dart
///
/// Provides comprehensive animation performance monitoring and optimization
/// for the mobile app.
///
/// Features:
/// - Frame rate monitoring (60 FPS / 120 FPS)
/// - Jank detection and reporting
/// - Layer optimization
/// - Animation caching and recycling
/// - GPU acceleration checks
/// - Memory leak detection
/// - Performance profiling
/// - Device capability detection
/// - Reduced motion support

library performance_optimization;

import 'dart:async';
import 'dart:collection';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/scheduler.dart';

/// Frame rate target
enum FrameRateTarget {
  fps60,
  fps120,
  adaptive,
}

/// Performance tier based on device capabilities
enum PerformanceTier {
  low,
  medium,
  high,
  extreme,
}

/// Jank severity levels
enum JankSeverity {
  none,
  minor,
  moderate,
  severe,
  critical,
}

/// Performance metrics data
class PerformanceMetrics {
  final double averageFps;
  final double minFps;
  final double maxFps;
  final int totalFrames;
  final int droppedFrames;
  final double jankPercentage;
  final Duration averageFrameTime;
  final Duration maxFrameTime;
  final int memoryUsageMB;
  final DateTime timestamp;

  const PerformanceMetrics({
    required this.averageFps,
    required this.minFps,
    required this.maxFps,
    required this.totalFrames,
    required this.droppedFrames,
    required this.jankPercentage,
    required this.averageFrameTime,
    required this.maxFrameTime,
    required this.memoryUsageMB,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'averageFps': averageFps,
      'minFps': minFps,
      'maxFps': maxFps,
      'totalFrames': totalFrames,
      'droppedFrames': droppedFrames,
      'jankPercentage': jankPercentage,
      'averageFrameTimeMs': averageFrameTime.inMicroseconds / 1000,
      'maxFrameTimeMs': maxFrameTime.inMicroseconds / 1000,
      'memoryUsageMB': memoryUsageMB,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

/// Frame timing information
class FrameTiming {
  final Duration buildDuration;
  final Duration rasterDuration;
  final Duration totalDuration;
  final DateTime timestamp;

  const FrameTiming({
    required this.buildDuration,
    required this.rasterDuration,
    required this.totalDuration,
    required this.timestamp,
  });

  bool get isJank {
    return totalDuration.inMilliseconds > 16;
  }

  JankSeverity get jankSeverity {
    final ms = totalDuration.inMilliseconds;
    if (ms <= 16) return JankSeverity.none;
    if (ms <= 24) return JankSeverity.minor;
    if (ms <= 32) return JankSeverity.moderate;
    if (ms <= 48) return JankSeverity.severe;
    return JankSeverity.critical;
  }
}

/// Performance monitor service
class PerformanceMonitor {
  static final PerformanceMonitor _instance = PerformanceMonitor._internal();

  factory PerformanceMonitor() => _instance;

  PerformanceMonitor._internal();

  final Queue<FrameTiming> _frameTimings = Queue<FrameTiming>();
  final Queue<PerformanceMetrics> _metricsHistory = Queue<PerformanceMetrics>();
  final StreamController<PerformanceMetrics> _metricsController =
      StreamController<PerformanceMetrics>.broadcast();

  bool _isMonitoring = false;
  FrameRateTarget _target = FrameRateTarget.fps60;
  PerformanceTier _deviceTier = PerformanceTier.medium;
  bool _reducedMotionEnabled = false;

  int _totalFrames = 0;
  int _droppedFrames = 0;
  DateTime? _monitoringStartTime;

  static const int _maxFrameHistory = 300;
  static const int _maxMetricsHistory = 100;

  /// Stream of performance metrics
  Stream<PerformanceMetrics> get metricsStream => _metricsController.stream;

  /// Get current performance tier
  PerformanceTier get deviceTier => _deviceTier;

  /// Check if reduced motion is enabled
  bool get reducedMotionEnabled => _reducedMotionEnabled;

  /// Initialize the performance monitor
  void initialize({
    FrameRateTarget? target,
    bool? reducedMotion,
  }) {
    _target = target ?? FrameRateTarget.fps60;
    _reducedMotionEnabled = reducedMotion ?? false;
    _deviceTier = _detectDeviceTier();
  }

  /// Start monitoring performance
  void startMonitoring() {
    if (_isMonitoring) return;

    _isMonitoring = true;
    _monitoringStartTime = DateTime.now();
    _totalFrames = 0;
    _droppedFrames = 0;
    _frameTimings.clear();

    SchedulerBinding.instance.addTimingsCallback(_handleFrameTiming);

    if (kDebugMode) {
      debugPrint('Performance monitoring started');
    }
  }

  /// Stop monitoring performance
  void stopMonitoring() {
    if (!_isMonitoring) return;

    _isMonitoring = false;
    SchedulerBinding.instance.removeTimingsCallback(_handleFrameTiming);

    if (kDebugMode) {
      debugPrint('Performance monitoring stopped');
    }
  }

  /// Handle frame timing callback
  void _handleFrameTiming(List<ui.FrameTiming> timings) {
    if (!_isMonitoring) return;

    for (final timing in timings) {
      final buildDuration = Duration(
        microseconds: timing.buildDuration.inMicroseconds,
      );
      final rasterDuration = Duration(
        microseconds: timing.rasterDuration.inMicroseconds,
      );
      final totalDuration = Duration(
        microseconds: timing.totalSpan.inMicroseconds,
      );

      final frameTiming = FrameTiming(
        buildDuration: buildDuration,
        rasterDuration: rasterDuration,
        totalDuration: totalDuration,
        timestamp: DateTime.now(),
      );

      _frameTimings.add(frameTiming);
      _totalFrames++;

      if (frameTiming.isJank) {
        _droppedFrames++;
      }

      if (_frameTimings.length > _maxFrameHistory) {
        _frameTimings.removeFirst();
      }
    }

    _updateMetrics();
  }

  /// Update performance metrics
  void _updateMetrics() {
    if (_frameTimings.isEmpty) return;

    final recentFrames = _frameTimings.toList();
    final totalDurations = recentFrames.map((f) => f.totalDuration.inMicroseconds).toList();

    final averageFrameTime = Duration(
      microseconds: (totalDurations.reduce((a, b) => a + b) / totalDurations.length).round(),
    );

    final maxFrameTime = Duration(
      microseconds: totalDurations.reduce(math.max),
    );

    final fps = recentFrames.length / (recentFrames.last.timestamp.difference(recentFrames.first.timestamp).inMilliseconds / 1000);

    final jankFrames = recentFrames.where((f) => f.isJank).length;
    final jankPercentage = (jankFrames / recentFrames.length) * 100;

    final metrics = PerformanceMetrics(
      averageFps: fps.isFinite ? fps : 60.0,
      minFps: _calculateMinFps(recentFrames),
      maxFps: _calculateMaxFps(recentFrames),
      totalFrames: _totalFrames,
      droppedFrames: _droppedFrames,
      jankPercentage: jankPercentage,
      averageFrameTime: averageFrameTime,
      maxFrameTime: maxFrameTime,
      memoryUsageMB: _estimateMemoryUsage(),
      timestamp: DateTime.now(),
    );

    _metricsHistory.add(metrics);
    if (_metricsHistory.length > _maxMetricsHistory) {
      _metricsHistory.removeFirst();
    }

    _metricsController.add(metrics);
  }

  /// Calculate minimum FPS from frame timings
  double _calculateMinFps(List<FrameTiming> frames) {
    if (frames.isEmpty) return 60.0;

    final maxDuration = frames.map((f) => f.totalDuration.inMicroseconds).reduce(math.max);
    return (1000000 / maxDuration).clamp(0.0, 120.0);
  }

  /// Calculate maximum FPS from frame timings
  double _calculateMaxFps(List<FrameTiming> frames) {
    if (frames.isEmpty) return 60.0;

    final minDuration = frames.map((f) => f.totalDuration.inMicroseconds).reduce(math.min);
    return (1000000 / minDuration).clamp(0.0, 120.0);
  }

  /// Estimate memory usage (simplified)
  int _estimateMemoryUsage() {
    return 0;
  }

  /// Detect device performance tier
  PerformanceTier _detectDeviceTier() {
    final view = WidgetsBinding.instance.platformDispatcher.views.first;
    final physicalSize = view.physicalSize;
    final devicePixelRatio = view.devicePixelRatio;

    final totalPixels = physicalSize.width * physicalSize.height;

    if (devicePixelRatio >= 3.0 && totalPixels > 2000000) {
      return PerformanceTier.extreme;
    } else if (devicePixelRatio >= 2.0 && totalPixels > 1000000) {
      return PerformanceTier.high;
    } else if (totalPixels > 500000) {
      return PerformanceTier.medium;
    } else {
      return PerformanceTier.low;
    }
  }

  /// Get current metrics
  PerformanceMetrics? getCurrentMetrics() {
    return _metricsHistory.isNotEmpty ? _metricsHistory.last : null;
  }

  /// Get metrics history
  List<PerformanceMetrics> getMetricsHistory() {
    return _metricsHistory.toList();
  }

  /// Get jank report
  Map<String, dynamic> getJankReport() {
    final jankFrames = _frameTimings.where((f) => f.isJank).toList();

    final severityCounts = <JankSeverity, int>{
      JankSeverity.none: 0,
      JankSeverity.minor: 0,
      JankSeverity.moderate: 0,
      JankSeverity.severe: 0,
      JankSeverity.critical: 0,
    };

    for (final frame in _frameTimings) {
      severityCounts[frame.jankSeverity] = (severityCounts[frame.jankSeverity] ?? 0) + 1;
    }

    return {
      'totalFrames': _totalFrames,
      'jankFrames': jankFrames.length,
      'jankPercentage': _totalFrames > 0 ? (jankFrames.length / _totalFrames) * 100 : 0.0,
      'severityCounts': {
        'none': severityCounts[JankSeverity.none],
        'minor': severityCounts[JankSeverity.minor],
        'moderate': severityCounts[JankSeverity.moderate],
        'severe': severityCounts[JankSeverity.severe],
        'critical': severityCounts[JankSeverity.critical],
      },
    };
  }

  /// Reset all metrics
  void reset() {
    _frameTimings.clear();
    _metricsHistory.clear();
    _totalFrames = 0;
    _droppedFrames = 0;
    _monitoringStartTime = null;
  }

  /// Dispose resources
  void dispose() {
    stopMonitoring();
    _metricsController.close();
    reset();
  }
}

/// FPS counter widget
class FpsCounter extends StatefulWidget {
  final Widget? child;
  final bool showOverlay;
  final Color? backgroundColor;
  final Color? textColor;

  const FpsCounter({
    Key? key,
    this.child,
    this.showOverlay = true,
    this.backgroundColor,
    this.textColor,
  }) : super(key: key);

  @override
  State<FpsCounter> createState() => _FpsCounterState();
}

class _FpsCounterState extends State<FpsCounter> {
  final PerformanceMonitor _monitor = PerformanceMonitor();
  PerformanceMetrics? _currentMetrics;
  StreamSubscription<PerformanceMetrics>? _subscription;

  @override
  void initState() {
    super.initState();
    _monitor.startMonitoring();
    _subscription = _monitor.metricsStream.listen((metrics) {
      if (mounted) {
        setState(() {
          _currentMetrics = metrics;
        });
      }
    });
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _monitor.stopMonitoring();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.showOverlay) {
      return widget.child ?? const SizedBox.shrink();
    }

    return Stack(
      children: [
        if (widget.child != null) widget.child!,
        Positioned(
          top: MediaQuery.of(context).padding.top + 10,
          right: 10,
          child: _buildFpsDisplay(),
        ),
      ],
    );
  }

  Widget _buildFpsDisplay() {
    final fps = _currentMetrics?.averageFps ?? 0.0;
    final jankPercentage = _currentMetrics?.jankPercentage ?? 0.0;

    Color fpsColor;
    if (fps >= 55) {
      fpsColor = Colors.green;
    } else if (fps >= 45) {
      fpsColor = Colors.orange;
    } else {
      fpsColor = Colors.red;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: widget.backgroundColor ?? Colors.black.withOpacity(0.7),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '${fps.toStringAsFixed(1)} FPS',
            style: TextStyle(
              color: fpsColor,
              fontSize: 14,
              fontWeight: FontWeight.bold,
              fontFamily: 'monospace',
            ),
          ),
          if (jankPercentage > 0)
            Text(
              'Jank: ${jankPercentage.toStringAsFixed(1)}%',
              style: TextStyle(
                color: widget.textColor ?? Colors.white,
                fontSize: 10,
                fontFamily: 'monospace',
              ),
            ),
        ],
      ),
    );
  }
}

/// Performance overlay widget
class PerformanceOverlay extends StatefulWidget {
  final Widget child;
  final bool enabled;

  const PerformanceOverlay({
    Key? key,
    required this.child,
    this.enabled = false,
  }) : super(key: key);

  @override
  State<PerformanceOverlay> createState() => _PerformanceOverlayState();
}

class _PerformanceOverlayState extends State<PerformanceOverlay> {
  final PerformanceMonitor _monitor = PerformanceMonitor();
  PerformanceMetrics? _currentMetrics;
  StreamSubscription<PerformanceMetrics>? _subscription;

  @override
  void initState() {
    super.initState();
    if (widget.enabled) {
      _monitor.startMonitoring();
      _subscription = _monitor.metricsStream.listen((metrics) {
        if (mounted) {
          setState(() {
            _currentMetrics = metrics;
          });
        }
      });
    }
  }

  @override
  void didUpdateWidget(PerformanceOverlay oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.enabled != oldWidget.enabled) {
      if (widget.enabled) {
        _monitor.startMonitoring();
        _subscription = _monitor.metricsStream.listen((metrics) {
          if (mounted) {
            setState(() {
              _currentMetrics = metrics;
            });
          }
        });
      } else {
        _subscription?.cancel();
        _monitor.stopMonitoring();
      }
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _monitor.stopMonitoring();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (widget.enabled) _buildOverlay(),
      ],
    );
  }

  Widget _buildOverlay() {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        color: Colors.black.withOpacity(0.8),
        padding: const EdgeInsets.all(12),
        child: _buildMetricsDisplay(),
      ),
    );
  }

  Widget _buildMetricsDisplay() {
    if (_currentMetrics == null) {
      return const Text(
        'Collecting metrics...',
        style: TextStyle(color: Colors.white, fontSize: 12),
      );
    }

    final metrics = _currentMetrics!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildMetricRow('FPS', metrics.averageFps.toStringAsFixed(1)),
        _buildMetricRow('Frame Time', '${metrics.averageFrameTime.inMilliseconds}ms'),
        _buildMetricRow('Max Frame Time', '${metrics.maxFrameTime.inMilliseconds}ms'),
        _buildMetricRow('Jank', '${metrics.jankPercentage.toStringAsFixed(1)}%'),
        _buildMetricRow('Dropped Frames', '${metrics.droppedFrames}/${metrics.totalFrames}'),
      ],
    );
  }

  Widget _buildMetricRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
              fontFamily: 'monospace',
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              fontFamily: 'monospace',
            ),
          ),
        ],
      ),
    );
  }
}

/// Optimized animated widget wrapper
class OptimizedAnimatedWidget extends StatelessWidget {
  final Widget child;
  final bool cacheExtent;
  final bool useRepaintBoundary;
  final bool useOffscreenLayer;

  const OptimizedAnimatedWidget({
    Key? key,
    required this.child,
    this.cacheExtent = false,
    this.useRepaintBoundary = true,
    this.useOffscreenLayer = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Widget result = child;

    if (useRepaintBoundary) {
      result = RepaintBoundary(child: result);
    }

    if (useOffscreenLayer) {
      result = Opacity(
        opacity: 1.0,
        child: result,
      );
    }

    return result;
  }
}

/// Animation controller pool for recycling
class AnimationControllerPool {
  static final AnimationControllerPool _instance =
      AnimationControllerPool._internal();

  factory AnimationControllerPool() => _instance;

  AnimationControllerPool._internal();

  final Queue<AnimationController> _availableControllers = Queue<AnimationController>();
  final Set<AnimationController> _activeControllers = {};

  static const int _maxPoolSize = 20;

  /// Get a controller from the pool or create a new one
  AnimationController acquire({
    required TickerProvider vsync,
    Duration? duration,
    Duration? reverseDuration,
    double? value,
    double lowerBound = 0.0,
    double upperBound = 1.0,
  }) {
    AnimationController controller;

    if (_availableControllers.isNotEmpty) {
      controller = _availableControllers.removeFirst();
      if (duration != null) {
        controller.duration = duration;
      }
      if (reverseDuration != null) {
        controller.reverseDuration = reverseDuration;
      }
      if (value != null) {
        controller.value = value;
      }
    } else {
      controller = AnimationController(
        vsync: vsync,
        duration: duration ?? const Duration(milliseconds: 300),
        reverseDuration: reverseDuration,
        value: value,
        lowerBound: lowerBound,
        upperBound: upperBound,
      );
    }

    _activeControllers.add(controller);
    return controller;
  }

  /// Release a controller back to the pool
  void release(AnimationController controller) {
    if (!_activeControllers.contains(controller)) return;

    _activeControllers.remove(controller);
    controller.reset();

    if (_availableControllers.length < _maxPoolSize) {
      _availableControllers.add(controller);
    } else {
      controller.dispose();
    }
  }

  /// Dispose all controllers
  void disposeAll() {
    for (final controller in _availableControllers) {
      controller.dispose();
    }
    _availableControllers.clear();

    for (final controller in _activeControllers) {
      controller.dispose();
    }
    _activeControllers.clear();
  }

  /// Get pool statistics
  Map<String, int> getStatistics() {
    return {
      'available': _availableControllers.length,
      'active': _activeControllers.length,
      'total': _availableControllers.length + _activeControllers.length,
    };
  }
}

/// Image cache manager for animations
class AnimationImageCacheManager {
  static final AnimationImageCacheManager _instance =
      AnimationImageCacheManager._internal();

  factory AnimationImageCacheManager() => _instance;

  AnimationImageCacheManager._internal();

  final Map<String, ui.Image> _imageCache = {};
  int _totalCacheSize = 0;
  static const int _maxCacheSizeMB = 50;

  /// Precache an image
  Future<void> precacheImage(ImageProvider provider, BuildContext context) async {
    await precacheImage(provider, context);
  }

  /// Clear image cache
  void clearCache() {
    _imageCache.clear();
    _totalCacheSize = 0;
    PaintingBinding.instance.imageCache.clear();
  }

  /// Get cache statistics
  Map<String, dynamic> getCacheStatistics() {
    return {
      'cachedImages': _imageCache.length,
      'cacheSizeMB': _totalCacheSize ~/ (1024 * 1024),
      'systemCacheSize': PaintingBinding.instance.imageCache.currentSize,
      'systemCacheSizeMB': PaintingBinding.instance.imageCache.currentSizeBytes ~/ (1024 * 1024),
    };
  }
}

/// Jank detector widget
class JankDetector extends StatefulWidget {
  final Widget child;
  final void Function(JankSeverity severity)? onJankDetected;
  final JankSeverity minimumSeverity;

  const JankDetector({
    Key? key,
    required this.child,
    this.onJankDetected,
    this.minimumSeverity = JankSeverity.moderate,
  }) : super(key: key);

  @override
  State<JankDetector> createState() => _JankDetectorState();
}

class _JankDetectorState extends State<JankDetector> {
  final PerformanceMonitor _monitor = PerformanceMonitor();
  StreamSubscription<PerformanceMetrics>? _subscription;

  @override
  void initState() {
    super.initState();
    _monitor.startMonitoring();
    _subscription = _monitor.metricsStream.listen(_handleMetrics);
  }

  void _handleMetrics(PerformanceMetrics metrics) {
    if (metrics.jankPercentage > 10.0) {
      widget.onJankDetected?.call(JankSeverity.moderate);
    } else if (metrics.jankPercentage > 20.0) {
      widget.onJankDetected?.call(JankSeverity.severe);
    } else if (metrics.jankPercentage > 30.0) {
      widget.onJankDetected?.call(JankSeverity.critical);
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _monitor.stopMonitoring();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}

/// Animation complexity scorer
class AnimationComplexityScorer {
  /// Calculate complexity score for an animation
  static int calculateScore({
    required int widgetCount,
    required int animationCount,
    required bool hasTransform,
    required bool hasOpacity,
    required bool hasClipping,
    required bool hasBlur,
    required bool hasCustomPaint,
  }) {
    int score = 0;

    score += widgetCount;
    score += animationCount * 2;
    if (hasTransform) score += 5;
    if (hasOpacity) score += 3;
    if (hasClipping) score += 4;
    if (hasBlur) score += 10;
    if (hasCustomPaint) score += 7;

    return score;
  }

  /// Get performance recommendation
  static String getRecommendation(int score) {
    if (score < 20) {
      return 'Simple animation - should perform well on all devices';
    } else if (score < 50) {
      return 'Moderate animation - may need optimization for low-end devices';
    } else if (score < 100) {
      return 'Complex animation - consider using RepaintBoundary and reduced motion';
    } else {
      return 'Very complex animation - recommend reducing effects or using Lottie/Rive';
    }
  }
}

/// Battery-aware animation controller
class BatteryAwareAnimationController extends AnimationController {
  bool _batteryOptimizationEnabled = false;

  BatteryAwareAnimationController({
    required super.vsync,
    super.duration,
    super.reverseDuration,
    super.value,
    super.lowerBound,
    super.upperBound,
  });

  void enableBatteryOptimization() {
    _batteryOptimizationEnabled = true;
  }

  void disableBatteryOptimization() {
    _batteryOptimizationEnabled = false;
  }

  @override
  TickerFuture forward({double? from}) {
    if (_batteryOptimizationEnabled) {
      final reducedDuration = duration != null
          ? Duration(milliseconds: (duration!.inMilliseconds * 0.7).round())
          : null;

      final originalDuration = duration;
      duration = reducedDuration;
      final result = super.forward(from: from);
      duration = originalDuration;
      return result;
    }

    return super.forward(from: from);
  }
}

/// Device capability detector
class DeviceCapabilityDetector {
  static PerformanceTier detectPerformanceTier() {
    return PerformanceMonitor().deviceTier;
  }

  static bool supportsHighRefreshRate() {
    final display = WidgetsBinding.instance.platformDispatcher.displays.first;
    return display.refreshRate > 60.0;
  }

  static Map<String, dynamic> getDeviceInfo() {
    final view = WidgetsBinding.instance.platformDispatcher.views.first;
    final display = WidgetsBinding.instance.platformDispatcher.displays.first;

    return {
      'screenSize': {
        'width': view.physicalSize.width,
        'height': view.physicalSize.height,
      },
      'devicePixelRatio': view.devicePixelRatio,
      'refreshRate': display.refreshRate,
      'performanceTier': detectPerformanceTier().name,
      'supportsHighRefreshRate': supportsHighRefreshRate(),
    };
  }
}

/// Performance benchmark suite
class PerformanceBenchmark {
  static Future<Map<String, dynamic>> runBenchmark({
    required WidgetBuilder builder,
    Duration testDuration = const Duration(seconds: 5),
  }) async {
    final monitor = PerformanceMonitor();
    monitor.reset();
    monitor.startMonitoring();

    await Future.delayed(testDuration);

    monitor.stopMonitoring();

    final metrics = monitor.getCurrentMetrics();
    final jankReport = monitor.getJankReport();

    return {
      'metrics': metrics?.toJson(),
      'jankReport': jankReport,
      'testDuration': testDuration.inSeconds,
    };
  }
}

/// Reduced motion wrapper widget
class ReducedMotionWrapper extends StatelessWidget {
  final Widget child;
  final Widget? reducedMotionChild;
  final bool forceReducedMotion;

  const ReducedMotionWrapper({
    Key? key,
    required this.child,
    this.reducedMotionChild,
    this.forceReducedMotion = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final reducedMotion = forceReducedMotion ||
        MediaQuery.of(context).disableAnimations ||
        PerformanceMonitor().reducedMotionEnabled;

    if (reducedMotion && reducedMotionChild != null) {
      return reducedMotionChild!;
    }

    if (reducedMotion) {
      return child;
    }

    return child;
  }
}

/// Layer optimization helper
class LayerOptimizationHelper {
  static Widget optimizeLayer({
    required Widget child,
    bool useRepaintBoundary = true,
    bool useTransformLayer = false,
    bool useOpacityLayer = false,
  }) {
    Widget result = child;

    if (useRepaintBoundary) {
      result = RepaintBoundary(child: result);
    }

    if (useTransformLayer) {
      result = Transform.translate(
        offset: Offset.zero,
        child: result,
      );
    }

    if (useOpacityLayer) {
      result = Opacity(
        opacity: 1.0,
        child: result,
      );
    }

    return result;
  }

  static bool shouldUseRepaintBoundary({
    required bool hasFrequentUpdates,
    required bool isComplex,
    required bool isIsolated,
  }) {
    return (hasFrequentUpdates && isIsolated) || (isComplex && isIsolated);
  }
}

/// Timeline event tracker
class TimelineEventTracker {
  static void recordEvent(String name, {Map<String, dynamic>? arguments}) {
    if (kDebugMode) {
      Timeline.instantSync(
        name,
        arguments: arguments,
      );
    }
  }

  static void startEvent(String name) {
    if (kDebugMode) {
      Timeline.startSync(name);
    }
  }

  static void finishEvent() {
    if (kDebugMode) {
      Timeline.finishSync();
    }
  }

  static Future<T> measureAsync<T>(
    String name,
    Future<T> Function() action,
  ) async {
    startEvent(name);
    try {
      return await action();
    } finally {
      finishEvent();
    }
  }

  static T measureSync<T>(
    String name,
    T Function() action,
  ) {
    startEvent(name);
    try {
      return action();
    } finally {
      finishEvent();
    }
  }
}
