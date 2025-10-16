import 'dart:async';
import 'dart:collection';
import 'dart:isolate';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Performance optimization manager for UpCoach mobile app
class PerformanceManager {
  static final PerformanceManager _instance = PerformanceManager._internal();
  factory PerformanceManager() => _instance;
  PerformanceManager._internal();

  // Performance metrics tracking
  final Map<String, double> _performanceMetrics = {};
  final Map<String, List<double>> _performanceHistory = {};
  final Queue<String> _recentOperations = Queue();

  // Memory management
  Timer? _memoryCleanupTimer;
  final Map<String, WeakReference> _cachedWidgets = {};

  // Frame rate monitoring
  int _frameCount = 0;
  double _averageFrameTime = 16.67; // Target 60 FPS
  DateTime _lastFrameTime = DateTime.now();

  // Image and asset optimization
  final Map<String, ImageProvider> _imageCache = {};
  static const int _maxImageCacheSize = 50;

  /// Initialize performance monitoring
  void initialize() {
    _setupFrameRateMonitoring();
    _setupMemoryManagement();
    _setupPerformanceLogging();

    if (kDebugMode) {
      print('PerformanceManager initialized');
    }
  }

  /// Setup frame rate monitoring
  void _setupFrameRateMonitoring() {
    WidgetsBinding.instance.addPostFrameCallback((timeStamp) {
      _trackFrameRate();
    });
  }

  /// Track frame rate performance
  void _trackFrameRate() {
    final now = DateTime.now();
    final frameDuration = now.difference(_lastFrameTime).inMicroseconds / 1000.0;

    _frameCount++;
    _averageFrameTime = (_averageFrameTime * 0.9) + (frameDuration * 0.1);
    _lastFrameTime = now;

    // Log performance issues
    if (frameDuration > 20.0) { // Slower than 50 FPS
      _logPerformanceIssue('frame_drop', frameDuration);
    }

    // Continue monitoring
    WidgetsBinding.instance.addPostFrameCallback((timeStamp) {
      _trackFrameRate();
    });
  }

  /// Setup automatic memory management
  void _setupMemoryManagement() {
    _memoryCleanupTimer = Timer.periodic(const Duration(minutes: 5), (timer) {
      _performMemoryCleanup();
    });
  }

  /// Setup performance logging
  void _setupPerformanceLogging() {
    // Log performance metrics every minute in debug mode
    if (kDebugMode) {
      Timer.periodic(const Duration(minutes: 1), (timer) {
        _logPerformanceMetrics();
      });
    }
  }

  /// Optimize widget performance with caching
  Widget optimizeWidget(String key, Widget Function() builder) {
    final weakRef = _cachedWidgets[key];

    if (weakRef?.target != null) {
      return weakRef!.target as Widget;
    }

    final widget = builder();
    _cachedWidgets[key] = WeakReference(widget);

    // Limit cache size
    if (_cachedWidgets.length > 100) {
      _cleanupWidgetCache();
    }

    return widget;
  }

  /// Optimize image loading with caching and compression
  ImageProvider optimizeImage(String imageUrl, {
    double? width,
    double? height,
    int? quality = 85,
  }) {
    final cacheKey = '$imageUrl:${width ?? 0}:${height ?? 0}:$quality';

    if (_imageCache.containsKey(cacheKey)) {
      return _imageCache[cacheKey]!;
    }

    ImageProvider provider;

    if (imageUrl.startsWith('http')) {
      provider = NetworkImage(imageUrl);
    } else if (imageUrl.startsWith('assets/')) {
      provider = AssetImage(imageUrl);
    } else {
      provider = FileImage(Uri.parse(imageUrl).toFilePath() as dynamic);
    }

    // Add to cache
    _imageCache[cacheKey] = provider;

    // Limit cache size
    if (_imageCache.length > _maxImageCacheSize) {
      _cleanupImageCache();
    }

    return provider;
  }

  /// Optimize list performance with pagination and lazy loading
  Widget optimizeListView({
    required int itemCount,
    required Widget Function(BuildContext, int) itemBuilder,
    ScrollController? controller,
    bool shrinkWrap = false,
    EdgeInsets? padding,
    double? itemExtent,
  }) {
    return ListView.builder(
      controller: controller,
      shrinkWrap: shrinkWrap,
      padding: padding,
      itemExtent: itemExtent,
      itemCount: itemCount,
      cacheExtent: 250.0, // Optimize cache extent
      addAutomaticKeepAlives: false, // Reduce memory usage
      addRepaintBoundaries: true, // Optimize repainting
      addSemanticIndexes: false, // Reduce overhead
      itemBuilder: (context, index) {
        return RepaintBoundary(
          child: itemBuilder(context, index),
        );
      },
    );
  }

  /// Optimize expensive computations with isolates
  static Future<T> computeInIsolate<T>(
    ComputeCallback<dynamic, T> callback,
    dynamic message, {
    String? debugLabel,
  }) async {
    final stopwatch = Stopwatch()..start();

    try {
      final result = await compute(callback, message, debugLabel: debugLabel);

      if (kDebugMode && stopwatch.elapsedMilliseconds > 100) {
        print('Expensive computation: ${debugLabel ?? 'Unknown'} took ${stopwatch.elapsedMilliseconds}ms');
      }

      return result;
    } finally {
      stopwatch.stop();
    }
  }

  /// Debounce function calls to improve performance
  static Timer? _debounceTimer;
  static void debounce(Duration delay, VoidCallback callback) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(delay, callback);
  }

  /// Throttle function calls to limit execution frequency
  static DateTime? _lastThrottleTime;
  static void throttle(Duration interval, VoidCallback callback) {
    final now = DateTime.now();

    if (_lastThrottleTime == null ||
        now.difference(_lastThrottleTime!) >= interval) {
      _lastThrottleTime = now;
      callback();
    }
  }

  /// Measure and track operation performance
  Future<T> measureOperation<T>(
    String operationName,
    Future<T> Function() operation,
  ) async {
    final stopwatch = Stopwatch()..start();

    try {
      final result = await operation();

      stopwatch.stop();
      final duration = stopwatch.elapsedMilliseconds.toDouble();

      _trackPerformanceMetric(operationName, duration);

      return result;
    } catch (error) {
      stopwatch.stop();
      _logPerformanceIssue('operation_error',
          stopwatch.elapsedMilliseconds.toDouble(),
          details: error.toString());
      rethrow;
    }
  }

  /// Optimize state management updates
  void optimizeStateUpdate(VoidCallback update) {
    // Use post-frame callback to avoid unnecessary rebuilds
    WidgetsBinding.instance.addPostFrameCallback((_) {
      update();
    });
  }

  /// Batch state updates to reduce rebuilds
  Timer? _batchUpdateTimer;
  final List<VoidCallback> _pendingUpdates = [];

  void batchStateUpdate(VoidCallback update) {
    _pendingUpdates.add(update);

    _batchUpdateTimer?.cancel();
    _batchUpdateTimer = Timer(const Duration(milliseconds: 16), () {
      for (final update in _pendingUpdates) {
        update();
      }
      _pendingUpdates.clear();
    });
  }

  /// Memory optimization utilities
  void _performMemoryCleanup() {
    // Clean up widget cache
    _cleanupWidgetCache();

    // Clean up image cache
    _cleanupImageCache();

    // Force garbage collection in debug mode
    if (kDebugMode) {
      // Note: There's no direct way to force GC in Flutter,
      // but we can clear our own caches
      print('Performing memory cleanup');
    }
  }

  void _cleanupWidgetCache() {
    final keysToRemove = <String>[];

    for (final entry in _cachedWidgets.entries) {
      if (entry.value.target == null) {
        keysToRemove.add(entry.key);
      }
    }

    for (final key in keysToRemove) {
      _cachedWidgets.remove(key);
    }
  }

  void _cleanupImageCache() {
    if (_imageCache.length > _maxImageCacheSize) {
      final entriesToRemove = _imageCache.length - _maxImageCacheSize;
      final keys = _imageCache.keys.take(entriesToRemove).toList();

      for (final key in keys) {
        _imageCache.remove(key);
      }
    }
  }

  /// Performance tracking
  void _trackPerformanceMetric(String name, double value) {
    _performanceMetrics[name] = value;

    if (!_performanceHistory.containsKey(name)) {
      _performanceHistory[name] = <double>[];
    }

    _performanceHistory[name]!.add(value);

    // Keep only last 100 measurements
    if (_performanceHistory[name]!.length > 100) {
      _performanceHistory[name]!.removeAt(0);
    }

    _recentOperations.add('$name: ${value.toStringAsFixed(2)}ms');
    if (_recentOperations.length > 20) {
      _recentOperations.removeFirst();
    }
  }

  void _logPerformanceIssue(String issue, double value, {String? details}) {
    if (kDebugMode) {
      print('Performance Issue: $issue - ${value.toStringAsFixed(2)}ms');
      if (details != null) {
        print('Details: $details');
      }
    }

    // In production, send to analytics
    _sendToAnalytics('performance_issue', {
      'issue': issue,
      'value': value,
      'details': details,
    });
  }

  void _logPerformanceMetrics() {
    if (kDebugMode) {
      print('=== Performance Metrics ===');
      print('Average Frame Time: ${_averageFrameTime.toStringAsFixed(2)}ms');
      print('Frame Count: $_frameCount');
      print('Cached Widgets: ${_cachedWidgets.length}');
      print('Cached Images: ${_imageCache.length}');

      for (final entry in _performanceMetrics.entries) {
        print('${entry.key}: ${entry.value.toStringAsFixed(2)}ms');
      }

      print('Recent Operations:');
      for (final op in _recentOperations) {
        print('  $op');
      }
      print('==========================');
    }
  }

  /// Analytics integration
  void _sendToAnalytics(String event, Map<String, dynamic> data) {
    // Implement analytics integration here
    // For example, Firebase Analytics, Mixpanel, etc.
  }

  /// Get performance statistics
  Map<String, dynamic> getPerformanceStats() {
    return {
      'averageFrameTime': _averageFrameTime,
      'frameCount': _frameCount,
      'cachedWidgets': _cachedWidgets.length,
      'cachedImages': _imageCache.length,
      'performanceMetrics': Map.from(_performanceMetrics),
      'recentOperations': _recentOperations.toList(),
    };
  }

  /// Dispose resources
  void dispose() {
    _memoryCleanupTimer?.cancel();
    _batchUpdateTimer?.cancel();
    _debounceTimer?.cancel();

    _cachedWidgets.clear();
    _imageCache.clear();
    _performanceMetrics.clear();
    _performanceHistory.clear();
    _recentOperations.clear();
  }
}

/// Widget that automatically optimizes its children
class OptimizedWidget extends StatelessWidget {
  final Widget child;
  final String? cacheKey;
  final bool repaintBoundary;
  final bool keepAlive;

  const OptimizedWidget({
    Key? key,
    required this.child,
    this.cacheKey,
    this.repaintBoundary = true,
    this.keepAlive = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Widget widget = child;

    if (repaintBoundary) {
      widget = RepaintBoundary(child: widget);
    }

    if (keepAlive) {
      widget = AutomaticKeepAliveClientMixin as Widget;
    }

    if (cacheKey != null) {
      return PerformanceManager().optimizeWidget(cacheKey!, () => widget);
    }

    return widget;
  }
}

/// Mixin for widgets that need to stay alive
mixin AutomaticKeepAliveClientMixin<T extends StatefulWidget> on State<T> {
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return widget.build(context);
  }
}

/// Performance monitoring widget
class PerformanceMonitor extends StatefulWidget {
  final Widget child;
  final bool enabled;

  const PerformanceMonitor({
    Key? key,
    required this.child,
    this.enabled = kDebugMode,
  }) : super(key: key);

  @override
  State<PerformanceMonitor> createState() => _PerformanceMonitorState();
}

class _PerformanceMonitorState extends State<PerformanceMonitor> {
  late Timer _updateTimer;
  Map<String, dynamic> _stats = {};

  @override
  void initState() {
    super.initState();

    if (widget.enabled) {
      _updateTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() {
          _stats = PerformanceManager().getPerformanceStats();
        });
      });
    }
  }

  @override
  void dispose() {
    _updateTimer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled) {
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
              color: Colors.black54,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'FPS: ${(1000 / _stats['averageFrameTime']?.toDouble() ?? 60).toStringAsFixed(1)}',
                  style: const TextStyle(color: Colors.white, fontSize: 10),
                ),
                Text(
                  'Widgets: ${_stats['cachedWidgets'] ?? 0}',
                  style: const TextStyle(color: Colors.white, fontSize: 10),
                ),
                Text(
                  'Images: ${_stats['cachedImages'] ?? 0}',
                  style: const TextStyle(color: Colors.white, fontSize: 10),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}