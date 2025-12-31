// ignore_for_file: avoid_print

import 'dart:async';
import 'dart:collection';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// App startup and performance optimization
/// Manages app initialization, code splitting, caching, and performance monitoring
class AppStartupOptimization {
  static const MethodChannel _channel = MethodChannel('com.upcoach.startup');

  static AppStartupOptimization? _instance;
  static AppStartupOptimization get instance {
    _instance ??= AppStartupOptimization._();
    return _instance!;
  }

  AppStartupOptimization._();

  final Stopwatch _startupStopwatch = Stopwatch();
  final Map<String, Duration> _initializationTimes = {};
  final List<String> _criticalPath = [];
  bool _isInitialized = false;

  /// Initialize app startup optimization
  Future<void> initialize() async {
    if (_isInitialized) return;

    _startupStopwatch.start();
    debugPrint('AppStartupOptimization: Starting initialization...');

    try {
      await _initializeCriticalServices();
      await _initializeNonCriticalServices();

      _startupStopwatch.stop();
      _isInitialized = true;

      debugPrint(
          'AppStartupOptimization: Initialization complete in ${_startupStopwatch.elapsedMilliseconds}ms');
      _printInitializationReport();
    } catch (e) {
      debugPrint('AppStartupOptimization: Initialization error: $e');
      rethrow;
    }
  }

  /// Initialize critical services synchronously
  Future<void> _initializeCriticalServices() async {
    await _measureInitialization('WidgetsFlutterBinding', () async {
      WidgetsFlutterBinding.ensureInitialized();
    });

    _criticalPath.add('WidgetsFlutterBinding');
  }

  /// Initialize non-critical services asynchronously
  Future<void> _initializeNonCriticalServices() async {
    await Future.wait([
      _measureInitialization('ImageCache', () async {
        await ImageCacheManager.instance.prewarm();
      }),
      _measureInitialization('DatabaseConnection', () async {
        await DatabaseOptimization.instance.initialize();
      }),
    ]);
  }

  /// Measure initialization time for a service
  Future<void> _measureInitialization(String serviceName, Future<void> Function() init) async {
    final stopwatch = Stopwatch()..start();
    try {
      await init();
      stopwatch.stop();
      _initializationTimes[serviceName] = stopwatch.elapsed;
      debugPrint('$serviceName initialized in ${stopwatch.elapsedMilliseconds}ms');
    } catch (e) {
      stopwatch.stop();
      debugPrint('$serviceName failed to initialize: $e');
      rethrow;
    }
  }

  /// Print initialization report
  void _printInitializationReport() {
    debugPrint('\n=== Startup Performance Report ===');
    debugPrint('Total startup time: ${_startupStopwatch.elapsedMilliseconds}ms');
    debugPrint('\nInitialization times:');
    _initializationTimes.forEach((service, duration) {
      debugPrint('  $service: ${duration.inMilliseconds}ms');
    });
    debugPrint('\nCritical path: ${_criticalPath.join(' -> ')}');
    debugPrint('===================================\n');
  }

  /// Get startup metrics
  StartupMetrics getMetrics() {
    return StartupMetrics(
      totalStartupTime: _startupStopwatch.elapsed,
      initializationTimes: Map.from(_initializationTimes),
      criticalPath: List.from(_criticalPath),
    );
  }
}

class StartupMetrics {
  final Duration totalStartupTime;
  final Map<String, Duration> initializationTimes;
  final List<String> criticalPath;

  StartupMetrics({
    required this.totalStartupTime,
    required this.initializationTimes,
    required this.criticalPath,
  });
}

/// Deferred Initialization Manager
class DeferredInitializationManager {
  static final Map<String, Future<void> Function()> _deferredTasks = {};
  static final Map<String, bool> _completedTasks = {};

  /// Register deferred task
  static void registerTask(String taskId, Future<void> Function() task) {
    _deferredTasks[taskId] = task;
    _completedTasks[taskId] = false;
  }

  /// Execute deferred task
  static Future<void> executeTask(String taskId) async {
    if (_completedTasks[taskId] == true) {
      debugPrint('Task $taskId already completed');
      return;
    }

    final task = _deferredTasks[taskId];
    if (task == null) {
      debugPrint('Task $taskId not found');
      return;
    }

    try {
      await task();
      _completedTasks[taskId] = true;
      debugPrint('Task $taskId completed');
    } catch (e) {
      debugPrint('Task $taskId failed: $e');
      rethrow;
    }
  }

  /// Execute all deferred tasks
  static Future<void> executeAllTasks() async {
    for (final taskId in _deferredTasks.keys) {
      if (_completedTasks[taskId] != true) {
        await executeTask(taskId);
      }
    }
  }

  /// Check if task is completed
  static bool isTaskCompleted(String taskId) {
    return _completedTasks[taskId] ?? false;
  }
}

/// Code Splitting Manager
class CodeSplittingManager {
  static final Map<String, Future<void> Function()> _modules = {};
  static final Map<String, bool> _loadedModules = {};

  /// Register module for lazy loading
  static void registerModule(String moduleId, Future<void> Function() loader) {
    _modules[moduleId] = loader;
    _loadedModules[moduleId] = false;
  }

  /// Load module
  static Future<void> loadModule(String moduleId) async {
    if (_loadedModules[moduleId] == true) {
      debugPrint('Module $moduleId already loaded');
      return;
    }

    final loader = _modules[moduleId];
    if (loader == null) {
      debugPrint('Module $moduleId not found');
      return;
    }

    try {
      debugPrint('Loading module $moduleId...');
      await loader();
      _loadedModules[moduleId] = true;
      debugPrint('Module $moduleId loaded successfully');
    } catch (e) {
      debugPrint('Failed to load module $moduleId: $e');
      rethrow;
    }
  }

  /// Preload modules
  static Future<void> preloadModules(List<String> moduleIds) async {
    await Future.wait(moduleIds.map((id) => loadModule(id)));
  }

  /// Check if module is loaded
  static bool isModuleLoaded(String moduleId) {
    return _loadedModules[moduleId] ?? false;
  }
}

/// Image Cache Manager
class ImageCacheManager {
  static ImageCacheManager? _instance;
  static ImageCacheManager get instance {
    _instance ??= ImageCacheManager._();
    return _instance!;
  }

  ImageCacheManager._();

  static const int _maxCacheSize = 100 * 1024 * 1024; // 100 MB
  static const int _maxCacheAge = 7 * 24 * 60 * 60; // 7 days in seconds

  /// Configure image cache
  Future<void> prewarm() async {
    try {
      final imageCache = PaintingBinding.instance.imageCache;
      imageCache.maximumSize = 1000;
      imageCache.maximumSizeBytes = _maxCacheSize;

      debugPrint('ImageCache: Configured with max size $_maxCacheSize bytes');
    } catch (e) {
      debugPrint('Error configuring image cache: $e');
    }
  }

  /// Preload images
  Future<void> preloadImages(BuildContext context, List<String> imageUrls) async {
    try {
      await Future.wait(
        imageUrls.map((url) => precacheImage(NetworkImage(url), context)),
      );
      debugPrint('Preloaded ${imageUrls.length} images');
    } catch (e) {
      debugPrint('Error preloading images: $e');
    }
  }

  /// Clear image cache
  Future<void> clearCache() async {
    try {
      PaintingBinding.instance.imageCache.clear();
      PaintingBinding.instance.imageCache.clearLiveImages();
      debugPrint('Image cache cleared');
    } catch (e) {
      debugPrint('Error clearing image cache: $e');
    }
  }

  /// Get cache info
  ImageCacheInfo getCacheInfo() {
    final cache = PaintingBinding.instance.imageCache;
    return ImageCacheInfo(
      currentSize: cache.currentSize,
      currentSizeBytes: cache.currentSizeBytes,
      maximumSize: cache.maximumSize,
      maximumSizeBytes: cache.maximumSizeBytes,
      liveImageCount: cache.liveImageCount,
      pendingImageCount: cache.pendingImageCount,
    );
  }
}

class ImageCacheInfo {
  final int currentSize;
  final int currentSizeBytes;
  final int maximumSize;
  final int maximumSizeBytes;
  final int liveImageCount;
  final int pendingImageCount;

  ImageCacheInfo({
    required this.currentSize,
    required this.currentSizeBytes,
    required this.maximumSize,
    required this.maximumSizeBytes,
    required this.liveImageCount,
    required this.pendingImageCount,
  });

  double get usagePercentage =>
      maximumSizeBytes > 0 ? (currentSizeBytes / maximumSizeBytes) * 100 : 0;
}

/// API Response Cache Manager
class APIResponseCacheManager {
  static APIResponseCacheManager? _instance;
  static APIResponseCacheManager get instance {
    _instance ??= APIResponseCacheManager._();
    return _instance!;
  }

  APIResponseCacheManager._();

  final Map<String, CachedResponse> _cache = {};
  static const int _defaultCacheDuration = 5 * 60; // 5 minutes

  /// Get cached response
  CachedResponse? get(String key) {
    final cached = _cache[key];
    if (cached == null) return null;

    if (cached.isExpired) {
      _cache.remove(key);
      return null;
    }

    return cached;
  }

  /// Set cached response
  void set(String key, dynamic data, {Duration? duration}) {
    _cache[key] = CachedResponse(
      data: data,
      timestamp: DateTime.now(),
      duration: duration ?? const Duration(seconds: _defaultCacheDuration),
    );
  }

  /// Remove cached response
  void remove(String key) {
    _cache.remove(key);
  }

  /// Clear all cached responses
  void clear() {
    _cache.clear();
    debugPrint('API response cache cleared');
  }

  /// Clean expired entries
  void cleanExpired() {
    _cache.removeWhere((key, value) => value.isExpired);
    debugPrint('Cleaned expired API cache entries');
  }

  /// Get cache size
  int get size => _cache.length;
}

class CachedResponse {
  final dynamic data;
  final DateTime timestamp;
  final Duration duration;

  CachedResponse({
    required this.data,
    required this.timestamp,
    required this.duration,
  });

  bool get isExpired => DateTime.now().difference(timestamp) > duration;
}

/// Computed Value Cache Manager
class ComputedValueCache<K, V> {
  final Map<K, V> _cache = {};
  final int maxSize;

  ComputedValueCache({this.maxSize = 100});

  /// Get or compute value
  V getOrCompute(K key, V Function() compute) {
    if (_cache.containsKey(key)) {
      return _cache[key] as V;
    }

    final value = compute();
    set(key, value);
    return value;
  }

  /// Set value
  void set(K key, V value) {
    if (_cache.length >= maxSize) {
      final firstKey = _cache.keys.first;
      _cache.remove(firstKey);
    }
    _cache[key] = value;
  }

  /// Get value
  V? get(K key) => _cache[key];

  /// Remove value
  void remove(K key) => _cache.remove(key);

  /// Clear cache
  void clear() => _cache.clear();

  /// Get cache size
  int get size => _cache.length;
}

/// Bundle Optimization Manager
class BundleOptimizationManager {
  static const MethodChannel _channel = MethodChannel('com.upcoach.bundle');

  /// Get bundle info
  static Future<BundleInfo> getBundleInfo() async {
    try {
      final result = await _channel.invokeMethod<Map>('getBundleInfo');
      return BundleInfo.fromMap(Map<String, dynamic>.from(result ?? {}));
    } catch (e) {
      debugPrint('Error getting bundle info: $e');
      return BundleInfo(
        totalSize: 0,
        codeSize: 0,
        assetsSize: 0,
        isOptimized: false,
      );
    }
  }

  /// Optimize bundle
  static Future<bool> optimizeBundle() async {
    try {
      final result = await _channel.invokeMethod<bool>('optimizeBundle');
      return result ?? false;
    } catch (e) {
      debugPrint('Error optimizing bundle: $e');
      return false;
    }
  }
}

class BundleInfo {
  final int totalSize;
  final int codeSize;
  final int assetsSize;
  final bool isOptimized;

  BundleInfo({
    required this.totalSize,
    required this.codeSize,
    required this.assetsSize,
    required this.isOptimized,
  });

  factory BundleInfo.fromMap(Map<String, dynamic> map) {
    return BundleInfo(
      totalSize: map['totalSize'] as int? ?? 0,
      codeSize: map['codeSize'] as int? ?? 0,
      assetsSize: map['assetsSize'] as int? ?? 0,
      isOptimized: map['isOptimized'] as bool? ?? false,
    );
  }
}

/// Network Optimization Manager
class NetworkOptimizationManager {
  static const MethodChannel _channel = MethodChannel('com.upcoach.network');

  static final Queue<NetworkRequest> _requestQueue = Queue<NetworkRequest>();
  static final Set<String> _activeRequests = {};
  static const int _maxConcurrentRequests = 6;

  /// Enqueue network request
  static Future<T> enqueueRequest<T>(NetworkRequest<T> request) async {
    if (_activeRequests.length >= _maxConcurrentRequests) {
      _requestQueue.add(request);
      await request.completer.future;
      return request.completer.future as Future<T>;
    }

    return _executeRequest(request);
  }

  /// Execute network request
  static Future<T> _executeRequest<T>(NetworkRequest<T> request) async {
    _activeRequests.add(request.id);

    try {
      final result = await request.execute();
      request.completer.complete(result);
      return result;
    } catch (e) {
      request.completer.completeError(e);
      rethrow;
    } finally {
      _activeRequests.remove(request.id);
      _processQueue();
    }
  }

  /// Process request queue
  static void _processQueue() {
    while (_requestQueue.isNotEmpty && _activeRequests.length < _maxConcurrentRequests) {
      final request = _requestQueue.removeFirst();
      _executeRequest(request);
    }
  }

  /// Enable HTTP/2
  static Future<bool> enableHTTP2() async {
    try {
      final result = await _channel.invokeMethod<bool>('enableHTTP2');
      return result ?? false;
    } catch (e) {
      debugPrint('Error enabling HTTP/2: $e');
      return false;
    }
  }

  /// Setup compression
  static Future<bool> setupCompression({
    bool enableGzip = true,
    bool enableBrotli = true,
  }) async {
    try {
      final result = await _channel.invokeMethod<bool>('setupCompression', {
        'enableGzip': enableGzip,
        'enableBrotli': enableBrotli,
      });
      return result ?? false;
    } catch (e) {
      debugPrint('Error setting up compression: $e');
      return false;
    }
  }

  /// Prefetch resources
  static Future<void> prefetchResources(List<String> urls) async {
    try {
      await _channel.invokeMethod('prefetchResources', {'urls': urls});
      debugPrint('Prefetched ${urls.length} resources');
    } catch (e) {
      debugPrint('Error prefetching resources: $e');
    }
  }
}

class NetworkRequest<T> {
  final String id;
  final Future<T> Function() execute;
  final Completer<T> completer = Completer<T>();
  final RequestPriority priority;

  NetworkRequest({
    required this.id,
    required this.execute,
    this.priority = RequestPriority.normal,
  });
}

enum RequestPriority {
  low,
  normal,
  high,
}

/// Memory Optimization Manager
class MemoryOptimizationManager {
  static const MethodChannel _channel = MethodChannel('com.upcoach.memory');

  /// Detect memory leaks
  static Future<List<MemoryLeak>> detectMemoryLeaks() async {
    try {
      final result = await _channel.invokeMethod<List>('detectMemoryLeaks');
      return (result ?? [])
          .map((item) => MemoryLeak.fromMap(Map<String, dynamic>.from(item as Map)))
          .toList();
    } catch (e) {
      debugPrint('Error detecting memory leaks: $e');
      return [];
    }
  }

  /// Get memory usage
  static Future<MemoryUsage> getMemoryUsage() async {
    try {
      final result = await _channel.invokeMethod<Map>('getMemoryUsage');
      return MemoryUsage.fromMap(Map<String, dynamic>.from(result ?? {}));
    } catch (e) {
      debugPrint('Error getting memory usage: $e');
      return MemoryUsage(
        used: 0,
        available: 0,
        total: 0,
        usagePercentage: 0,
      );
    }
  }

  /// Optimize memory
  static Future<void> optimizeMemory() async {
    try {
      await _channel.invokeMethod('optimizeMemory');

      PaintingBinding.instance.imageCache.clear();
      PaintingBinding.instance.imageCache.clearLiveImages();

      debugPrint('Memory optimized');
    } catch (e) {
      debugPrint('Error optimizing memory: $e');
    }
  }

  /// Create weak reference
  static WeakReference<T> createWeakReference<T extends Object>(T object) {
    return WeakReference<T>(object);
  }
}

class MemoryLeak {
  final String className;
  final int instanceCount;
  final int memorySize;

  MemoryLeak({
    required this.className,
    required this.instanceCount,
    required this.memorySize,
  });

  factory MemoryLeak.fromMap(Map<String, dynamic> map) {
    return MemoryLeak(
      className: map['className'] as String? ?? '',
      instanceCount: map['instanceCount'] as int? ?? 0,
      memorySize: map['memorySize'] as int? ?? 0,
    );
  }
}

class MemoryUsage {
  final int used;
  final int available;
  final int total;
  final double usagePercentage;

  MemoryUsage({
    required this.used,
    required this.available,
    required this.total,
    required this.usagePercentage,
  });

  factory MemoryUsage.fromMap(Map<String, dynamic> map) {
    final used = map['used'] as int? ?? 0;
    final total = map['total'] as int? ?? 0;
    return MemoryUsage(
      used: used,
      available: map['available'] as int? ?? 0,
      total: total,
      usagePercentage: total > 0 ? (used / total) * 100 : 0,
    );
  }
}

/// Database Optimization Manager
class DatabaseOptimization {
  static const MethodChannel _channel = MethodChannel('com.upcoach.database');

  static DatabaseOptimization? _instance;
  static DatabaseOptimization get instance {
    _instance ??= DatabaseOptimization._();
    return _instance!;
  }

  DatabaseOptimization._();

  /// Initialize database
  Future<void> initialize() async {
    try {
      await _channel.invokeMethod('initialize');
      debugPrint('Database initialized');
    } catch (e) {
      debugPrint('Error initializing database: $e');
    }
  }

  /// Optimize queries
  Future<void> optimizeQueries() async {
    try {
      await _channel.invokeMethod('optimizeQueries');
      debugPrint('Database queries optimized');
    } catch (e) {
      debugPrint('Error optimizing queries: $e');
    }
  }

  /// Create indexes
  Future<void> createIndexes(List<String> tables) async {
    try {
      await _channel.invokeMethod('createIndexes', {'tables': tables});
      debugPrint('Database indexes created for ${tables.length} tables');
    } catch (e) {
      debugPrint('Error creating indexes: $e');
    }
  }

  /// Vacuum database
  Future<void> vacuum() async {
    try {
      await _channel.invokeMethod('vacuum');
      debugPrint('Database vacuumed');
    } catch (e) {
      debugPrint('Error vacuuming database: $e');
    }
  }

  /// Batch operations
  Future<void> executeBatch(List<Map<String, dynamic>> operations) async {
    try {
      await _channel.invokeMethod('executeBatch', {'operations': operations});
      debugPrint('Executed ${operations.length} batch operations');
    } catch (e) {
      debugPrint('Error executing batch operations: $e');
    }
  }

  /// Get database size
  Future<int> getDatabaseSize() async {
    try {
      final size = await _channel.invokeMethod<int>('getDatabaseSize');
      return size ?? 0;
    } catch (e) {
      debugPrint('Error getting database size: $e');
      return 0;
    }
  }
}

/// Performance Monitoring Manager
class PerformanceMonitoringManager {
  static const MethodChannel _channel = MethodChannel('com.upcoach.performance');

  static final Map<String, PerformanceMetric> _metrics = {};
  static final StreamController<PerformanceReport> _reportController =
      StreamController<PerformanceReport>.broadcast();

  /// Start monitoring
  static Future<void> startMonitoring() async {
    try {
      await _channel.invokeMethod('startMonitoring');
      debugPrint('Performance monitoring started');
    } catch (e) {
      debugPrint('Error starting performance monitoring: $e');
    }
  }

  /// Stop monitoring
  static Future<void> stopMonitoring() async {
    try {
      await _channel.invokeMethod('stopMonitoring');
      debugPrint('Performance monitoring stopped');
    } catch (e) {
      debugPrint('Error stopping performance monitoring: $e');
    }
  }

  /// Track metric
  static void trackMetric(String name, double value) {
    final metric = _metrics[name] ??
        PerformanceMetric(
          name: name,
          values: [],
          timestamps: [],
        );

    metric.values.add(value);
    metric.timestamps.add(DateTime.now());

    _metrics[name] = metric;
  }

  /// Get metric
  static PerformanceMetric? getMetric(String name) {
    return _metrics[name];
  }

  /// Generate report
  static PerformanceReport generateReport() {
    final now = DateTime.now();
    return PerformanceReport(
      timestamp: now,
      metrics: Map.from(_metrics),
      startupTime: AppStartupOptimization.instance.getMetrics().totalStartupTime,
      memoryUsage: 0,
      fps: _calculateAverageFPS(),
    );
  }

  /// Calculate average FPS
  static double _calculateAverageFPS() {
    final fpsMetric = _metrics['fps'];
    if (fpsMetric == null || fpsMetric.values.isEmpty) {
      return 60.0;
    }
    return fpsMetric.values.reduce((a, b) => a + b) / fpsMetric.values.length;
  }

  /// Stream of performance reports
  static Stream<PerformanceReport> get reportStream => _reportController.stream;

  /// Track startup time
  static Future<void> trackStartupTime() async {
    try {
      final result = await _channel.invokeMethod<int>('trackStartupTime');
      if (result != null) {
        trackMetric('startupTime', result.toDouble());
      }
    } catch (e) {
      debugPrint('Error tracking startup time: $e');
    }
  }

  /// Track memory usage
  static Future<void> trackMemoryUsage() async {
    try {
      final usage = await MemoryOptimizationManager.getMemoryUsage();
      trackMetric('memoryUsage', usage.used.toDouble());
    } catch (e) {
      debugPrint('Error tracking memory usage: $e');
    }
  }

  /// Track FPS
  static void trackFPS(double fps) {
    trackMetric('fps', fps);
  }

  /// Track network request
  static void trackNetworkRequest(String url, Duration duration) {
    trackMetric('networkRequest_$url', duration.inMilliseconds.toDouble());
  }

  /// Track database query
  static void trackDatabaseQuery(String query, Duration duration) {
    trackMetric('databaseQuery', duration.inMilliseconds.toDouble());
  }

  /// Custom metrics dashboard
  static Map<String, dynamic> getMetricsDashboard() {
    return {
      'totalMetrics': _metrics.length,
      'metrics': _metrics.map((key, value) => MapEntry(key, {
            'name': value.name,
            'count': value.values.length,
            'average': value.average,
            'min': value.min,
            'max': value.max,
            'latest': value.latest,
          })),
    };
  }
}

class PerformanceMetric {
  final String name;
  final List<double> values;
  final List<DateTime> timestamps;

  PerformanceMetric({
    required this.name,
    required this.values,
    required this.timestamps,
  });

  double get average => values.isEmpty ? 0 : values.reduce((a, b) => a + b) / values.length;
  double get min => values.isEmpty ? 0 : values.reduce((a, b) => a < b ? a : b);
  double get max => values.isEmpty ? 0 : values.reduce((a, b) => a > b ? a : b);
  double get latest => values.isEmpty ? 0 : values.last;
}

class PerformanceReport {
  final DateTime timestamp;
  final Map<String, PerformanceMetric> metrics;
  final Duration startupTime;
  final int memoryUsage;
  final double fps;

  PerformanceReport({
    required this.timestamp,
    required this.metrics,
    required this.startupTime,
    required this.memoryUsage,
    required this.fps,
  });
}

/// Build Optimization Configuration
class BuildOptimizationConfig {
  static const Map<String, dynamic> releaseConfig = {
    'treeShaking': true,
    'minification': true,
    'obfuscation': true,
    'splitDebugInfo': true,
    'targetPlatform': ['android-arm64', 'ios-arm64'],
    'optimization': 'speed',
  };

  static const Map<String, dynamic> profileConfig = {
    'treeShaking': true,
    'minification': false,
    'obfuscation': false,
    'splitDebugInfo': false,
    'targetPlatform': ['android-arm64', 'ios-arm64'],
    'optimization': 'balanced',
  };

  static const Map<String, dynamic> debugConfig = {
    'treeShaking': false,
    'minification': false,
    'obfuscation': false,
    'splitDebugInfo': false,
    'targetPlatform': ['android-arm64', 'ios-arm64'],
    'optimization': 'none',
  };

  /// Get config for build mode
  static Map<String, dynamic> getConfig(String buildMode) {
    switch (buildMode.toLowerCase()) {
      case 'release':
        return releaseConfig;
      case 'profile':
        return profileConfig;
      case 'debug':
      default:
        return debugConfig;
    }
  }
}

/// Asset Optimization Manager
class AssetOptimizationManager {
  static const MethodChannel _channel = MethodChannel('com.upcoach.assets');

  /// Optimize images
  static Future<void> optimizeImages({
    required List<String> imagePaths,
    int quality = 85,
  }) async {
    try {
      await _channel.invokeMethod('optimizeImages', {
        'imagePaths': imagePaths,
        'quality': quality,
      });
      debugPrint('Optimized ${imagePaths.length} images');
    } catch (e) {
      debugPrint('Error optimizing images: $e');
    }
  }

  /// Compress assets
  static Future<void> compressAssets(List<String> assetPaths) async {
    try {
      await _channel.invokeMethod('compressAssets', {
        'assetPaths': assetPaths,
      });
      debugPrint('Compressed ${assetPaths.length} assets');
    } catch (e) {
      debugPrint('Error compressing assets: $e');
    }
  }

  /// Get asset size
  static Future<int> getAssetSize(String assetPath) async {
    try {
      final size = await _channel.invokeMethod<int>('getAssetSize', {
        'assetPath': assetPath,
      });
      return size ?? 0;
    } catch (e) {
      debugPrint('Error getting asset size: $e');
      return 0;
    }
  }
}

/// Isolate Manager for parallel processing
class IsolateManager {
  static final Map<String, SendPort> _isolates = {};

  /// Spawn isolate
  static Future<void> spawnIsolate(String id, void Function(dynamic) entryPoint) async {
    try {
      final receivePort = ReceivePort();
      await Isolate.spawn(entryPoint, receivePort.sendPort);

      receivePort.listen((message) {
        if (message is SendPort) {
          _isolates[id] = message;
        }
      });

      debugPrint('Isolate $id spawned');
    } catch (e) {
      debugPrint('Error spawning isolate: $e');
    }
  }

  /// Send message to isolate
  static void sendMessage(String id, dynamic message) {
    final sendPort = _isolates[id];
    if (sendPort == null) {
      debugPrint('Isolate $id not found');
      return;
    }

    sendPort.send(message);
  }

  /// Kill isolate
  static void killIsolate(String id) {
    _isolates.remove(id);
    debugPrint('Isolate $id killed');
  }
}

/// Startup Timeline Tracker
class StartupTimelineTracker {
  static final List<TimelineEvent> _events = [];

  /// Record event
  static void recordEvent(String name, {String? details}) {
    _events.add(TimelineEvent(
      name: name,
      timestamp: DateTime.now(),
      details: details,
    ));
  }

  /// Get timeline
  static List<TimelineEvent> getTimeline() {
    return List.from(_events);
  }

  /// Print timeline
  static void printTimeline() {
    debugPrint('\n=== Startup Timeline ===');
    for (var i = 0; i < _events.length; i++) {
      final event = _events[i];
      final duration = i > 0 ? event.timestamp.difference(_events[i - 1].timestamp) : Duration.zero;
      debugPrint('${event.name}: +${duration.inMilliseconds}ms${event.details != null ? " (${event.details})" : ""}');
    }
    debugPrint('========================\n');
  }

  /// Clear timeline
  static void clearTimeline() {
    _events.clear();
  }
}

class TimelineEvent {
  final String name;
  final DateTime timestamp;
  final String? details;

  TimelineEvent({
    required this.name,
    required this.timestamp,
    this.details,
  });
}

/// Service Locator for dependency injection
class ServiceLocator {
  static final Map<Type, dynamic> _services = {};

  /// Register service
  static void register<T>(T service) {
    _services[T] = service;
  }

  /// Get service
  static T get<T>() {
    final service = _services[T];
    if (service == null) {
      throw Exception('Service of type $T not found');
    }
    return service as T;
  }

  /// Check if service is registered
  static bool has<T>() {
    return _services.containsKey(T);
  }

  /// Unregister service
  static void unregister<T>() {
    _services.remove(T);
  }

  /// Clear all services
  static void clear() {
    _services.clear();
  }
}
