import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

/// Service for monitoring and analyzing AI feature performance
class AIMonitoringService {
  static const String _metricsKey = 'ai_performance_metrics';
  static const String _sessionsKey = 'ai_session_analytics';
  static const int _maxMetricsHistory = 1000;
  static const Duration _reportInterval = Duration(hours: 1);
  
  final ApiService _apiService;
  final List<AIPerformanceMetric> _metrics = [];
  final List<AISessionAnalytics> _sessions = [];
  Timer? _reportTimer;
  
  // Performance thresholds
  static const double _targetResponseTime = 2000; // 2 seconds in ms
  static const double _acceptableErrorRate = 0.05; // 5%
  static const double _minSuccessRate = 0.95; // 95%
  
  AIMonitoringService({required ApiService apiService}) : _apiService = apiService {
    _initialize();
  }
  
  Future<void> _initialize() async {
    await _loadMetrics();
    _startPeriodicReporting();
  }
  
  void dispose() {
    _reportTimer?.cancel();
  }
  
  /// Track AI request performance
  Future<void> trackRequest({
    required String requestId,
    required String type,
    required DateTime startTime,
    required DateTime endTime,
    required bool success,
    String? error,
    Map<String, dynamic>? metadata,
  }) async {
    final metric = AIPerformanceMetric(
      id: requestId,
      type: type,
      startTime: startTime,
      endTime: endTime,
      responseTime: endTime.difference(startTime).inMilliseconds,
      success: success,
      error: error,
      metadata: metadata ?? {},
    );
    
    _metrics.add(metric);
    
    // Trim metrics if too many
    if (_metrics.length > _maxMetricsHistory) {
      _metrics.removeRange(0, _metrics.length - _maxMetricsHistory);
    }
    
    // Check for performance issues
    _checkPerformanceThresholds(metric);
    
    await _saveMetrics();
  }
  
  /// Track AI session analytics
  Future<void> trackSession({
    required String sessionId,
    required String userId,
    required int messageCount,
    required Duration sessionDuration,
    required double userSatisfactionScore,
    Map<String, dynamic>? features,
  }) async {
    final analytics = AISessionAnalytics(
      sessionId: sessionId,
      userId: userId,
      startTime: DateTime.now().subtract(sessionDuration),
      endTime: DateTime.now(),
      messageCount: messageCount,
      sessionDuration: sessionDuration,
      userSatisfactionScore: userSatisfactionScore,
      features: features ?? {},
    );
    
    _sessions.add(analytics);
    await _saveSessions();
  }
  
  /// Get performance statistics
  Map<String, dynamic> getPerformanceStats({Duration? period}) {
    final cutoffTime = period != null 
      ? DateTime.now().subtract(period)
      : DateTime.now().subtract(const Duration(days: 1));
    
    final recentMetrics = _metrics.where(
      (m) => m.startTime.isAfter(cutoffTime),
    ).toList();
    
    if (recentMetrics.isEmpty) {
      return {
        'totalRequests': 0,
        'successRate': 0.0,
        'averageResponseTime': 0.0,
        'errorRate': 0.0,
        'performanceScore': 0.0,
      };
    }
    
    final totalRequests = recentMetrics.length;
    final successfulRequests = recentMetrics.where((m) => m.success).length;
    final successRate = successfulRequests / totalRequests;
    
    final responseTimes = recentMetrics.map((m) => m.responseTime).toList();
    final averageResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
    
    final errorRate = 1.0 - successRate;
    
    // Calculate performance score (0-100)
    final responseScore = (1.0 - (averageResponseTime / _targetResponseTime).clamp(0.0, 1.0)) * 50;
    final successScore = successRate * 50;
    final performanceScore = responseScore + successScore;
    
    // Get response time percentiles
    responseTimes.sort();
    final p50 = _getPercentile(responseTimes, 0.5);
    final p95 = _getPercentile(responseTimes, 0.95);
    final p99 = _getPercentile(responseTimes, 0.99);
    
    // Group by request type
    final typeBreakdown = <String, Map<String, dynamic>>{};
    for (final metric in recentMetrics) {
      if (!typeBreakdown.containsKey(metric.type)) {
        typeBreakdown[metric.type] = {
          'count': 0,
          'successCount': 0,
          'totalResponseTime': 0,
          'errors': [],
        };
      }
      
      typeBreakdown[metric.type]!['count']++;
      if (metric.success) {
        typeBreakdown[metric.type]!['successCount']++;
      } else if (metric.error != null) {
        (typeBreakdown[metric.type]!['errors'] as List).add(metric.error);
      }
      typeBreakdown[metric.type]!['totalResponseTime'] += metric.responseTime;
    }
    
    // Calculate type-specific metrics
    final typeMetrics = typeBreakdown.map((type, data) {
      final count = data['count'] as int;
      final successCount = data['successCount'] as int;
      final totalResponseTime = data['totalResponseTime'] as int;
      
      return MapEntry(type, {
        'count': count,
        'successRate': count > 0 ? successCount / count : 0.0,
        'averageResponseTime': count > 0 ? totalResponseTime / count : 0.0,
        'errors': data['errors'],
      });
    });
    
    return {
      'totalRequests': totalRequests,
      'successRate': successRate,
      'averageResponseTime': averageResponseTime,
      'errorRate': errorRate,
      'performanceScore': performanceScore,
      'responseTimePercentiles': {
        'p50': p50,
        'p95': p95,
        'p99': p99,
      },
      'typeBreakdown': typeMetrics,
      'period': period?.inHours ?? 24,
      'calculatedAt': DateTime.now().toIso8601String(),
    };
  }
  
  /// Get session analytics
  Map<String, dynamic> getSessionAnalytics({Duration? period}) {
    final cutoffTime = period != null 
      ? DateTime.now().subtract(period)
      : DateTime.now().subtract(const Duration(days: 7));
    
    final recentSessions = _sessions.where(
      (s) => s.startTime.isAfter(cutoffTime),
    ).toList();
    
    if (recentSessions.isEmpty) {
      return {
        'totalSessions': 0,
        'averageSessionDuration': 0.0,
        'averageMessagesPerSession': 0.0,
        'averageSatisfactionScore': 0.0,
        'activeUsers': 0,
      };
    }
    
    final totalSessions = recentSessions.length;
    final uniqueUsers = recentSessions.map((s) => s.userId).toSet().length;
    
    final totalDuration = recentSessions
      .map((s) => s.sessionDuration.inSeconds)
      .reduce((a, b) => a + b);
    final averageSessionDuration = totalDuration / totalSessions;
    
    final totalMessages = recentSessions
      .map((s) => s.messageCount)
      .reduce((a, b) => a + b);
    final averageMessagesPerSession = totalMessages / totalSessions;
    
    final totalSatisfaction = recentSessions
      .map((s) => s.userSatisfactionScore)
      .reduce((a, b) => a + b);
    final averageSatisfactionScore = totalSatisfaction / totalSessions;
    
    // Daily breakdown
    final dailyBreakdown = <String, Map<String, dynamic>>{};
    for (final session in recentSessions) {
      final dateKey = '${session.startTime.year}-${session.startTime.month.toString().padLeft(2, '0')}-${session.startTime.day.toString().padLeft(2, '0')}';
      
      if (!dailyBreakdown.containsKey(dateKey)) {
        dailyBreakdown[dateKey] = {
          'sessions': 0,
          'messages': 0,
          'duration': 0,
          'users': <String>{},
        };
      }
      
      dailyBreakdown[dateKey]!['sessions']++;
      dailyBreakdown[dateKey]!['messages'] += session.messageCount;
      dailyBreakdown[dateKey]!['duration'] += session.sessionDuration.inSeconds;
      (dailyBreakdown[dateKey]!['users'] as Set<String>).add(session.userId);
    }
    
    final dailyMetrics = dailyBreakdown.map((date, data) {
      final users = data['users'] as Set<String>;
      return MapEntry(date, {
        'sessions': data['sessions'],
        'messages': data['messages'],
        'averageDuration': data['duration'] / data['sessions'],
        'activeUsers': users.length,
      });
    });
    
    return {
      'totalSessions': totalSessions,
      'activeUsers': uniqueUsers,
      'averageSessionDuration': averageSessionDuration,
      'averageMessagesPerSession': averageMessagesPerSession,
      'averageSatisfactionScore': averageSatisfactionScore,
      'totalMessages': totalMessages,
      'dailyBreakdown': dailyMetrics,
      'period': period?.inDays ?? 7,
      'calculatedAt': DateTime.now().toIso8601String(),
    };
  }
  
  /// Check performance thresholds and trigger alerts
  void _checkPerformanceThresholds(AIPerformanceMetric metric) {
    // Check response time
    if (metric.responseTime > _targetResponseTime * 2) {
      _triggerAlert(
        'Slow AI Response',
        'Response time ${metric.responseTime}ms exceeds threshold',
        AlertSeverity.warning,
        {'metric': metric.toJson()},
      );
    }
    
    // Check error rate over last 100 requests
    final recentMetrics = _metrics.length > 100 
      ? _metrics.sublist(_metrics.length - 100)
      : _metrics;
    
    final recentErrors = recentMetrics.where((m) => !m.success).length;
    final errorRate = recentMetrics.isNotEmpty ? recentErrors / recentMetrics.length : 0.0;
    
    if (errorRate > _acceptableErrorRate) {
      _triggerAlert(
        'High Error Rate',
        'Error rate ${(errorRate * 100).toStringAsFixed(1)}% exceeds threshold',
        AlertSeverity.high,
        {'errorRate': errorRate, 'threshold': _acceptableErrorRate},
      );
    }
  }
  
  /// Trigger performance alert
  void _triggerAlert(
    String title,
    String message,
    AlertSeverity severity,
    Map<String, dynamic> context,
  ) {
    // Log alert
    debugPrint('[AI Monitor Alert] $severity: $title - $message');
    
    // In production, send to monitoring service
    if (!kDebugMode) {
      _sendAlertToBackend(title, message, severity, context);
    }
  }
  
  /// Send alert to backend monitoring
  Future<void> _sendAlertToBackend(
    String title,
    String message,
    AlertSeverity severity,
    Map<String, dynamic> context,
  ) async {
    try {
      await _apiService.post(
        '/api/monitoring/alerts',
        data: {
          'service': 'ai_features',
          'title': title,
          'message': message,
          'severity': severity.toString(),
          'context': context,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      debugPrint('Failed to send alert: $e');
    }
  }
  
  /// Start periodic reporting
  void _startPeriodicReporting() {
    _reportTimer = Timer.periodic(_reportInterval, (_) {
      _sendPerformanceReport();
    });
  }
  
  /// Send performance report to backend
  Future<void> _sendPerformanceReport() async {
    final performanceStats = getPerformanceStats(period: _reportInterval);
    final sessionAnalytics = getSessionAnalytics(period: const Duration(days: 1));
    
    try {
      await _apiService.post(
        '/api/monitoring/ai-performance',
        data: {
          'performance': performanceStats,
          'sessions': sessionAnalytics,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      debugPrint('Failed to send performance report: $e');
    }
  }
  
  /// Get percentile from sorted list
  double _getPercentile(List<int> sortedValues, double percentile) {
    if (sortedValues.isEmpty) return 0.0;
    
    final index = (sortedValues.length * percentile).floor();
    return sortedValues[index.clamp(0, sortedValues.length - 1)].toDouble();
  }
  
  /// Load metrics from storage
  Future<void> _loadMetrics() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final metricsJson = prefs.getString(_metricsKey);
      
      if (metricsJson != null) {
        final metricsList = jsonDecode(metricsJson) as List;
        _metrics.clear();
        _metrics.addAll(
          metricsList.map((json) => AIPerformanceMetric.fromJson(json)),
        );
      }
    } catch (e) {
      debugPrint('Error loading metrics: $e');
    }
  }
  
  /// Save metrics to storage
  Future<void> _saveMetrics() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      // Keep only recent metrics to avoid storage bloat
      final recentMetrics = _metrics.length > 100 
        ? _metrics.sublist(_metrics.length - 100)
        : _metrics;
      
      final metricsJson = jsonEncode(
        recentMetrics.map((m) => m.toJson()).toList(),
      );
      await prefs.setString(_metricsKey, metricsJson);
    } catch (e) {
      debugPrint('Error saving metrics: $e');
    }
  }
  
  /// Save sessions to storage
  Future<void> _saveSessions() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      // Keep only recent sessions
      final recentSessions = _sessions.length > 50 
        ? _sessions.sublist(_sessions.length - 50)
        : _sessions;
      
      final sessionsJson = jsonEncode(
        recentSessions.map((s) => s.toJson()).toList(),
      );
      await prefs.setString(_sessionsKey, sessionsJson);
    } catch (e) {
      debugPrint('Error saving sessions: $e');
    }
  }
  
  /// Export metrics for analysis
  Map<String, dynamic> exportMetrics({Duration? period}) {
    final cutoffTime = period != null 
      ? DateTime.now().subtract(period)
      : null;
    
    final filteredMetrics = cutoffTime != null
      ? _metrics.where((m) => m.startTime.isAfter(cutoffTime)).toList()
      : _metrics;
    
    final filteredSessions = cutoffTime != null
      ? _sessions.where((s) => s.startTime.isAfter(cutoffTime)).toList()
      : _sessions;
    
    return {
      'metrics': filteredMetrics.map((m) => m.toJson()).toList(),
      'sessions': filteredSessions.map((s) => s.toJson()).toList(),
      'exportedAt': DateTime.now().toIso8601String(),
      'period': period?.inHours,
    };
  }
  
  /// Clear all metrics
  Future<void> clearMetrics() async {
    _metrics.clear();
    _sessions.clear();
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_metricsKey);
    await prefs.remove(_sessionsKey);
  }
}

/// Performance metric for AI requests
class AIPerformanceMetric {
  final String id;
  final String type;
  final DateTime startTime;
  final DateTime endTime;
  final int responseTime; // in milliseconds
  final bool success;
  final String? error;
  final Map<String, dynamic> metadata;
  
  AIPerformanceMetric({
    required this.id,
    required this.type,
    required this.startTime,
    required this.endTime,
    required this.responseTime,
    required this.success,
    this.error,
    required this.metadata,
  });
  
  Map<String, dynamic> toJson() => {
    'id': id,
    'type': type,
    'startTime': startTime.toIso8601String(),
    'endTime': endTime.toIso8601String(),
    'responseTime': responseTime,
    'success': success,
    'error': error,
    'metadata': metadata,
  };
  
  factory AIPerformanceMetric.fromJson(Map<String, dynamic> json) => AIPerformanceMetric(
    id: json['id'],
    type: json['type'],
    startTime: DateTime.parse(json['startTime']),
    endTime: DateTime.parse(json['endTime']),
    responseTime: json['responseTime'],
    success: json['success'],
    error: json['error'],
    metadata: json['metadata'] ?? {},
  );
}

/// Session analytics for AI interactions
class AISessionAnalytics {
  final String sessionId;
  final String userId;
  final DateTime startTime;
  final DateTime endTime;
  final int messageCount;
  final Duration sessionDuration;
  final double userSatisfactionScore;
  final Map<String, dynamic> features;
  
  AISessionAnalytics({
    required this.sessionId,
    required this.userId,
    required this.startTime,
    required this.endTime,
    required this.messageCount,
    required this.sessionDuration,
    required this.userSatisfactionScore,
    required this.features,
  });
  
  Map<String, dynamic> toJson() => {
    'sessionId': sessionId,
    'userId': userId,
    'startTime': startTime.toIso8601String(),
    'endTime': endTime.toIso8601String(),
    'messageCount': messageCount,
    'sessionDuration': sessionDuration.inSeconds,
    'userSatisfactionScore': userSatisfactionScore,
    'features': features,
  };
  
  factory AISessionAnalytics.fromJson(Map<String, dynamic> json) => AISessionAnalytics(
    sessionId: json['sessionId'],
    userId: json['userId'],
    startTime: DateTime.parse(json['startTime']),
    endTime: DateTime.parse(json['endTime']),
    messageCount: json['messageCount'],
    sessionDuration: Duration(seconds: json['sessionDuration']),
    userSatisfactionScore: json['userSatisfactionScore'].toDouble(),
    features: json['features'] ?? {},
  );
}

/// Alert severity levels
enum AlertSeverity {
  low,
  medium,
  warning,
  high,
  critical,
}

/// Provider for AI monitoring service
final aiMonitoringServiceProvider = Provider<AIMonitoringService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AIMonitoringService(apiService: apiService);
});