import 'dart:async';
import 'dart:collection';
import 'package:flutter/foundation.dart';

/// Application performance monitoring for mobile app
class AppMonitoringService {
  static final AppMonitoringService _instance = AppMonitoringService._internal();
  factory AppMonitoringService() => _instance;
  AppMonitoringService._internal();

  final Map<String, _Transaction> _activeTransactions = {};
  final Queue<_CompletedTransaction> _completedTransactions = Queue();
  final Map<String, _PerformanceMetric> _metrics = {};
  final List<_AppError> _errors = [];

  Timer? _metricsTimer;
  bool _isInitialized = false;

  static const int _maxCompletedTransactions = 100;
  static const int _maxErrors = 50;
  static const Duration _metricsInterval = Duration(seconds: 30);

  /// Initialize monitoring
  Future<void> initialize() async {
    if (_isInitialized) return;

    _isInitialized = true;
    _startMetricsCollection();

    debugPrint('[AppMonitoring] Initialized');
  }

  /// Dispose monitoring
  void dispose() {
    _metricsTimer?.cancel();
    _isInitialized = false;
  }

  /// Start a transaction
  String startTransaction(String name, TransactionType type, {Map<String, dynamic>? tags}) {
    final id = _generateId();
    final transaction = _Transaction(
      id: id,
      name: name,
      type: type,
      startTime: DateTime.now(),
      tags: tags ?? {},
    );

    _activeTransactions[id] = transaction;
    return id;
  }

  /// End a transaction
  void endTransaction(String id, {TransactionStatus status = TransactionStatus.success, String? error}) {
    final transaction = _activeTransactions.remove(id);
    if (transaction == null) return;

    final endTime = DateTime.now();
    final duration = endTime.difference(transaction.startTime);

    final completed = _CompletedTransaction(
      id: transaction.id,
      name: transaction.name,
      type: transaction.type,
      startTime: transaction.startTime,
      endTime: endTime,
      duration: duration,
      status: status,
      tags: transaction.tags,
      error: error,
    );

    _completedTransactions.add(completed);
    while (_completedTransactions.length > _maxCompletedTransactions) {
      _completedTransactions.removeFirst();
    }

    // Update metrics
    _updateMetric(transaction.name, duration);

    // Log slow transactions
    if (duration.inMilliseconds > 1000) {
      debugPrint('[AppMonitoring] Slow transaction: ${transaction.name} took ${duration.inMilliseconds}ms');
    }
  }

  /// Start a span within a transaction
  String startSpan(String transactionId, String name, {String? type}) {
    final transaction = _activeTransactions[transactionId];
    if (transaction == null) return '';

    final spanId = _generateId();
    transaction.spans[spanId] = _Span(
      id: spanId,
      name: name,
      type: type ?? 'custom',
      startTime: DateTime.now(),
    );

    return spanId;
  }

  /// End a span
  void endSpan(String transactionId, String spanId, {SpanStatus status = SpanStatus.ok}) {
    final transaction = _activeTransactions[transactionId];
    if (transaction == null) return;

    final span = transaction.spans[spanId];
    if (span == null) return;

    span.endTime = DateTime.now();
    span.duration = span.endTime!.difference(span.startTime);
    span.status = status;
  }

  /// Record an error
  void recordError(
    dynamic error,
    StackTrace? stackTrace, {
    String? context,
    Map<String, dynamic>? extra,
    ErrorSeverity severity = ErrorSeverity.error,
  }) {
    final appError = _AppError(
      id: _generateId(),
      timestamp: DateTime.now(),
      error: error.toString(),
      stackTrace: stackTrace?.toString(),
      context: context,
      extra: extra,
      severity: severity,
    );

    _errors.add(appError);
    while (_errors.length > _maxErrors) {
      _errors.removeAt(0);
    }

    if (severity == ErrorSeverity.critical) {
      debugPrint('[AppMonitoring] Critical error: ${error.toString()}');
    }
  }

  /// Record a metric
  void recordMetric(String name, double value, {String? unit, Map<String, String>? tags}) {
    final metric = _metrics[name];
    if (metric != null) {
      metric.values.add(value);
      if (metric.values.length > 100) {
        metric.values.removeAt(0);
      }
      metric.lastUpdated = DateTime.now();
    } else {
      _metrics[name] = _PerformanceMetric(
        name: name,
        values: [value],
        unit: unit,
        tags: tags ?? {},
        lastUpdated: DateTime.now(),
      );
    }
  }

  /// Get monitoring snapshot
  MonitoringSnapshot getSnapshot() {
    final recentTransactions = _completedTransactions.toList();
    final avgDuration = recentTransactions.isEmpty
        ? Duration.zero
        : Duration(
            milliseconds: recentTransactions
                    .map((t) => t.duration.inMilliseconds)
                    .reduce((a, b) => a + b) ~/
                recentTransactions.length,
          );

    final errorCount = _errors.where((e) =>
      e.timestamp.isAfter(DateTime.now().subtract(const Duration(hours: 1)))
    ).length;

    return MonitoringSnapshot(
      timestamp: DateTime.now(),
      activeTransactions: _activeTransactions.length,
      completedTransactions: recentTransactions.length,
      averageDuration: avgDuration,
      errorCount: errorCount,
      metrics: Map.from(_metrics.map((k, v) => MapEntry(k, v.average))),
    );
  }

  /// Get performance metrics for a specific operation
  PerformanceMetrics? getPerformanceMetrics(String name) {
    final metric = _metrics[name];
    if (metric == null || metric.values.isEmpty) return null;

    final sorted = List<double>.from(metric.values)..sort();
    final count = sorted.length;

    return PerformanceMetrics(
      name: name,
      count: count,
      avg: metric.average,
      min: sorted.first,
      max: sorted.last,
      p50: sorted[(count * 0.5).floor()],
      p90: sorted[(count * 0.9).floor().clamp(0, count - 1)],
      p95: sorted[(count * 0.95).floor().clamp(0, count - 1)],
      p99: sorted[(count * 0.99).floor().clamp(0, count - 1)],
    );
  }

  /// Get recent errors
  List<AppErrorInfo> getRecentErrors({int limit = 20}) {
    return _errors.reversed
        .take(limit)
        .map((e) => AppErrorInfo(
              id: e.id,
              timestamp: e.timestamp,
              error: e.error,
              context: e.context,
              severity: e.severity,
            ))
        .toList();
  }

  void _updateMetric(String name, Duration duration) {
    final key = 'transaction:$name';
    final metric = _metrics[key];

    if (metric != null) {
      metric.values.add(duration.inMilliseconds.toDouble());
      if (metric.values.length > 100) {
        metric.values.removeAt(0);
      }
      metric.lastUpdated = DateTime.now();
    } else {
      _metrics[key] = _PerformanceMetric(
        name: key,
        values: [duration.inMilliseconds.toDouble()],
        unit: 'ms',
        tags: {},
        lastUpdated: DateTime.now(),
      );
    }
  }

  void _startMetricsCollection() {
    _metricsTimer = Timer.periodic(_metricsInterval, (_) {
      _collectSystemMetrics();
    });
  }

  void _collectSystemMetrics() {
    // Memory metrics would be collected here in a real implementation
    // For now, we just log the collection
    debugPrint('[AppMonitoring] Collecting system metrics...');
  }

  String _generateId() {
    return '${DateTime.now().millisecondsSinceEpoch}_${_randomString(8)}';
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

/// Transaction types
enum TransactionType {
  navigation,
  apiCall,
  userAction,
  backgroundTask,
  aiInference,
  cache,
  database,
}

/// Transaction status
enum TransactionStatus {
  success,
  error,
  timeout,
  cancelled,
}

/// Span status
enum SpanStatus {
  ok,
  error,
  timeout,
}

/// Error severity
enum ErrorSeverity {
  info,
  warning,
  error,
  critical,
}

/// Monitoring snapshot
class MonitoringSnapshot {
  final DateTime timestamp;
  final int activeTransactions;
  final int completedTransactions;
  final Duration averageDuration;
  final int errorCount;
  final Map<String, double> metrics;

  MonitoringSnapshot({
    required this.timestamp,
    required this.activeTransactions,
    required this.completedTransactions,
    required this.averageDuration,
    required this.errorCount,
    required this.metrics,
  });
}

/// Performance metrics for an operation
class PerformanceMetrics {
  final String name;
  final int count;
  final double avg;
  final double min;
  final double max;
  final double p50;
  final double p90;
  final double p95;
  final double p99;

  PerformanceMetrics({
    required this.name,
    required this.count,
    required this.avg,
    required this.min,
    required this.max,
    required this.p50,
    required this.p90,
    required this.p95,
    required this.p99,
  });
}

/// App error info
class AppErrorInfo {
  final String id;
  final DateTime timestamp;
  final String error;
  final String? context;
  final ErrorSeverity severity;

  AppErrorInfo({
    required this.id,
    required this.timestamp,
    required this.error,
    this.context,
    required this.severity,
  });
}

// Internal classes
class _Transaction {
  final String id;
  final String name;
  final TransactionType type;
  final DateTime startTime;
  final Map<String, dynamic> tags;
  final Map<String, _Span> spans = {};

  _Transaction({
    required this.id,
    required this.name,
    required this.type,
    required this.startTime,
    required this.tags,
  });
}

class _CompletedTransaction {
  final String id;
  final String name;
  final TransactionType type;
  final DateTime startTime;
  final DateTime endTime;
  final Duration duration;
  final TransactionStatus status;
  final Map<String, dynamic> tags;
  final String? error;

  _CompletedTransaction({
    required this.id,
    required this.name,
    required this.type,
    required this.startTime,
    required this.endTime,
    required this.duration,
    required this.status,
    required this.tags,
    this.error,
  });
}

class _Span {
  final String id;
  final String name;
  final String type;
  final DateTime startTime;
  DateTime? endTime;
  Duration? duration;
  SpanStatus status = SpanStatus.ok;

  _Span({
    required this.id,
    required this.name,
    required this.type,
    required this.startTime,
  });
}

class _PerformanceMetric {
  final String name;
  final List<double> values;
  final String? unit;
  final Map<String, String> tags;
  DateTime lastUpdated;

  _PerformanceMetric({
    required this.name,
    required this.values,
    this.unit,
    required this.tags,
    required this.lastUpdated,
  });

  double get average => values.isEmpty ? 0 : values.reduce((a, b) => a + b) / values.length;
}

class _AppError {
  final String id;
  final DateTime timestamp;
  final String error;
  final String? stackTrace;
  final String? context;
  final Map<String, dynamic>? extra;
  final ErrorSeverity severity;

  _AppError({
    required this.id,
    required this.timestamp,
    required this.error,
    this.stackTrace,
    this.context,
    this.extra,
    required this.severity,
  });
}
