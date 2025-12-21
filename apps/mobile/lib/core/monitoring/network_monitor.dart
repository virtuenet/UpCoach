import 'dart:async';
import 'package:flutter/foundation.dart';

/// Network monitoring for API calls
class NetworkMonitor {
  static final NetworkMonitor _instance = NetworkMonitor._internal();
  factory NetworkMonitor() => _instance;
  NetworkMonitor._internal();

  final Map<String, NetworkRequest> _activeRequests = {};
  final List<CompletedRequest> _completedRequests = [];
  final Map<String, EndpointMetrics> _endpointMetrics = {};

  StreamController<NetworkEvent>? _eventController;
  Stream<NetworkEvent> get events => _eventController?.stream ?? const Stream.empty();

  bool _isInitialized = false;
  static const int _maxCompletedRequests = 200;

  /// Initialize network monitoring
  void initialize() {
    if (_isInitialized) return;

    _eventController = StreamController<NetworkEvent>.broadcast();
    _isInitialized = true;

    debugPrint('[NetworkMonitor] Initialized');
  }

  /// Dispose
  void dispose() {
    _eventController?.close();
    _isInitialized = false;
  }

  /// Start tracking a request
  String startRequest({
    required String method,
    required String url,
    Map<String, String>? headers,
    dynamic body,
  }) {
    final id = _generateId();
    final request = NetworkRequest(
      id: id,
      method: method,
      url: url,
      headers: headers ?? {},
      body: body,
      startTime: DateTime.now(),
    );

    _activeRequests[id] = request;

    _eventController?.add(NetworkEvent(
      type: NetworkEventType.started,
      requestId: id,
      timestamp: DateTime.now(),
    ));

    return id;
  }

  /// End tracking a request
  void endRequest({
    required String requestId,
    required int statusCode,
    Map<String, String>? responseHeaders,
    dynamic responseBody,
    String? error,
  }) {
    final request = _activeRequests.remove(requestId);
    if (request == null) return;

    final endTime = DateTime.now();
    final duration = endTime.difference(request.startTime);

    final completed = CompletedRequest(
      id: request.id,
      method: request.method,
      url: request.url,
      requestHeaders: request.headers,
      responseHeaders: responseHeaders ?? {},
      statusCode: statusCode,
      startTime: request.startTime,
      endTime: endTime,
      duration: duration,
      error: error,
      requestSize: _estimateSize(request.body),
      responseSize: _estimateSize(responseBody),
    );

    _completedRequests.add(completed);
    while (_completedRequests.length > _maxCompletedRequests) {
      _completedRequests.removeAt(0);
    }

    // Update endpoint metrics
    _updateEndpointMetrics(completed);

    // Emit event
    _eventController?.add(NetworkEvent(
      type: error != null ? NetworkEventType.failed : NetworkEventType.completed,
      requestId: requestId,
      timestamp: endTime,
      statusCode: statusCode,
      duration: duration,
      error: error,
    ));

    // Log slow requests
    if (duration.inMilliseconds > 2000) {
      debugPrint('[NetworkMonitor] Slow request: ${request.method} ${request.url} took ${duration.inMilliseconds}ms');
    }
  }

  /// Get active requests
  List<NetworkRequest> getActiveRequests() {
    return _activeRequests.values.toList();
  }

  /// Get completed requests
  List<CompletedRequest> getCompletedRequests({int? limit}) {
    if (limit != null) {
      return _completedRequests.reversed.take(limit).toList();
    }
    return List.from(_completedRequests);
  }

  /// Get endpoint metrics
  Map<String, EndpointMetrics> getEndpointMetrics() {
    return Map.from(_endpointMetrics);
  }

  /// Get network summary
  NetworkSummary getSummary() {
    final totalRequests = _completedRequests.length;
    final failedRequests = _completedRequests.where((r) => r.error != null || r.statusCode >= 400).length;

    final durations = _completedRequests.map((r) => r.duration.inMilliseconds).toList();
    final avgDuration = durations.isEmpty ? 0 : durations.reduce((a, b) => a + b) ~/ durations.length;

    final totalBytes = _completedRequests.fold<int>(0, (sum, r) => sum + r.responseSize);

    return NetworkSummary(
      totalRequests: totalRequests,
      failedRequests: failedRequests,
      averageDuration: Duration(milliseconds: avgDuration),
      totalBytesTransferred: totalBytes,
      activeRequests: _activeRequests.length,
      errorRate: totalRequests > 0 ? failedRequests / totalRequests : 0,
    );
  }

  /// Get requests by status code
  Map<int, int> getRequestsByStatusCode() {
    final result = <int, int>{};
    for (final request in _completedRequests) {
      result[request.statusCode] = (result[request.statusCode] ?? 0) + 1;
    }
    return result;
  }

  /// Clear all data
  void clear() {
    _activeRequests.clear();
    _completedRequests.clear();
    _endpointMetrics.clear();
  }

  void _updateEndpointMetrics(CompletedRequest request) {
    final endpoint = _normalizeEndpoint(request.url);
    final key = '${request.method}:$endpoint';

    final metrics = _endpointMetrics[key];
    if (metrics != null) {
      metrics.requestCount++;
      metrics.durations.add(request.duration.inMilliseconds.toDouble());
      if (metrics.durations.length > 100) {
        metrics.durations.removeAt(0);
      }
      if (request.error != null || request.statusCode >= 400) {
        metrics.errorCount++;
      }
      metrics.lastRequest = request.endTime;
    } else {
      _endpointMetrics[key] = EndpointMetrics(
        endpoint: endpoint,
        method: request.method,
        requestCount: 1,
        errorCount: request.error != null || request.statusCode >= 400 ? 1 : 0,
        durations: [request.duration.inMilliseconds.toDouble()],
        lastRequest: request.endTime,
      );
    }
  }

  String _normalizeEndpoint(String url) {
    try {
      final uri = Uri.parse(url);
      // Replace UUID-like segments with placeholder
      final normalizedPath = uri.path.replaceAllMapped(
        RegExp(r'[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}'),
        (match) => ':id',
      ).replaceAllMapped(
        RegExp(r'/\d+'),
        (match) => '/:id',
      );
      return normalizedPath;
    } catch (_) {
      return url;
    }
  }

  int _estimateSize(dynamic data) {
    if (data == null) return 0;
    if (data is String) return data.length;
    if (data is List<int>) return data.length;
    return data.toString().length;
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

/// Active network request
class NetworkRequest {
  final String id;
  final String method;
  final String url;
  final Map<String, String> headers;
  final dynamic body;
  final DateTime startTime;

  NetworkRequest({
    required this.id,
    required this.method,
    required this.url,
    required this.headers,
    this.body,
    required this.startTime,
  });
}

/// Completed network request
class CompletedRequest {
  final String id;
  final String method;
  final String url;
  final Map<String, String> requestHeaders;
  final Map<String, String> responseHeaders;
  final int statusCode;
  final DateTime startTime;
  final DateTime endTime;
  final Duration duration;
  final String? error;
  final int requestSize;
  final int responseSize;

  CompletedRequest({
    required this.id,
    required this.method,
    required this.url,
    required this.requestHeaders,
    required this.responseHeaders,
    required this.statusCode,
    required this.startTime,
    required this.endTime,
    required this.duration,
    this.error,
    required this.requestSize,
    required this.responseSize,
  });

  bool get isSuccess => statusCode >= 200 && statusCode < 300;
  bool get isError => statusCode >= 400 || error != null;
}

/// Endpoint metrics
class EndpointMetrics {
  final String endpoint;
  final String method;
  int requestCount;
  int errorCount;
  final List<double> durations;
  DateTime lastRequest;

  EndpointMetrics({
    required this.endpoint,
    required this.method,
    required this.requestCount,
    required this.errorCount,
    required this.durations,
    required this.lastRequest,
  });

  double get averageDuration =>
      durations.isEmpty ? 0 : durations.reduce((a, b) => a + b) / durations.length;

  double get errorRate => requestCount > 0 ? errorCount / requestCount : 0;

  double get p95Duration {
    if (durations.isEmpty) return 0;
    final sorted = List<double>.from(durations)..sort();
    final index = (sorted.length * 0.95).floor().clamp(0, sorted.length - 1);
    return sorted[index];
  }
}

/// Network summary
class NetworkSummary {
  final int totalRequests;
  final int failedRequests;
  final Duration averageDuration;
  final int totalBytesTransferred;
  final int activeRequests;
  final double errorRate;

  NetworkSummary({
    required this.totalRequests,
    required this.failedRequests,
    required this.averageDuration,
    required this.totalBytesTransferred,
    required this.activeRequests,
    required this.errorRate,
  });
}

/// Network event types
enum NetworkEventType {
  started,
  completed,
  failed,
}

/// Network event
class NetworkEvent {
  final NetworkEventType type;
  final String requestId;
  final DateTime timestamp;
  final int? statusCode;
  final Duration? duration;
  final String? error;

  NetworkEvent({
    required this.type,
    required this.requestId,
    required this.timestamp,
    this.statusCode,
    this.duration,
    this.error,
  });
}
