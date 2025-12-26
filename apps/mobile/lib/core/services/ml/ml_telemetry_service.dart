import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:device_info_plus/device_info_plus.dart';
import 'dart:io';

/// ML Telemetry Service (Phase 9)
///
/// Tracks on-device ML performance and accuracy metrics.
///
/// Metrics Tracked:
/// - Inference latency (ms)
/// - Model confidence scores
/// - Local vs. server routing decisions
/// - Device model and OS version
/// - Prediction accuracy feedback
/// - Battery impact
///
/// Data sent to server for:
/// - Model drift detection
/// - Performance monitoring
/// - Retraining dataset
class MLTelemetryService {
  // Singleton instance
  static final MLTelemetryService _instance = MLTelemetryService._internal();
  factory MLTelemetryService() => _instance;
  MLTelemetryService._internal();

  static const String _apiBaseUrl = 'https://api.upcoach.com';

  SharedPreferences? _prefs;
  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();

  String? _deviceModel;
  String? _osVersion;

  /// Initialize telemetry service
  Future<void> initialize() async {
    print('Initializing ML Telemetry Service...');

    _prefs = await SharedPreferences.getInstance();

    // Get device information
    if (Platform.isIOS) {
      final iosInfo = await _deviceInfo.iosInfo;
      _deviceModel = iosInfo.utsname.machine;
      _osVersion = iosInfo.systemVersion;
    } else if (Platform.isAndroid) {
      final androidInfo = await _deviceInfo.androidInfo;
      _deviceModel = androidInfo.model;
      _osVersion = 'Android ${androidInfo.version.release}';
    }

    print('Device: $_deviceModel, OS: $_osVersion');
    print('✅ ML Telemetry Service initialized');
  }

  /// Log ML inference event
  Future<void> logInference({
    required String modelName,
    required int inferenceTimeMs,
    required double confidence,
    required bool usedLocalModel,
  }) async {
    final event = {
      'modelName': modelName,
      'inferenceTimeMs': inferenceTimeMs,
      'confidence': confidence,
      'usedLocalModel': usedLocalModel,
      'deviceModel': _deviceModel,
      'osVersion': _osVersion,
      'timestamp': DateTime.now().toIso8601String(),
    };

    // Store locally
    await _storeEventLocally('inference', event);

    // Update routing statistics
    await _updateRoutingStats(modelName, usedLocalModel);

    print('📊 Logged inference: $modelName (${usedLocalModel ? "local" : "server"}, ${inferenceTimeMs}ms)');

    // Send to server (batched, async)
    _sendEventsToServer();
  }

  /// Log prediction accuracy feedback
  ///
  /// Compare predicted value vs. actual value for model retraining
  Future<void> logAccuracyFeedback({
    required String predictionId,
    required String modelName,
    required double predictedValue,
    required double actualValue,
    required String modelVersion,
  }) async {
    final feedback = {
      'predictionId': predictionId,
      'modelName': modelName,
      'predictedValue': predictedValue,
      'actualValue': actualValue,
      'modelVersion': modelVersion,
      'error': (predictedValue - actualValue).abs(),
      'timestamp': DateTime.now().toIso8601String(),
    };

    // Store locally
    await _storeEventLocally('accuracy_feedback', feedback);

    print('📊 Logged accuracy feedback: $modelName (error: ${feedback['error']})');

    // Send to server
    _sendEventsToServer();
  }

  /// Get routing statistics
  Future<Map<String, dynamic>> getRoutingStats() async {
    if (_prefs == null) await initialize();

    final models = ['churn_prediction', 'sentiment_analysis', 'goal_success'];

    final stats = <String, dynamic>{};

    for (var model in models) {
      final localCount = _prefs!.getInt('routing_local_$model') ?? 0;
      final serverCount = _prefs!.getInt('routing_server_$model') ?? 0;
      final total = localCount + serverCount;

      stats[model] = {
        'local': localCount,
        'server': serverCount,
        'total': total,
        'localPercentage': total > 0 ? (localCount / total * 100).toStringAsFixed(1) : '0.0',
      };
    }

    return stats;
  }

  /// Get inference performance metrics
  Future<Map<String, dynamic>> getPerformanceMetrics({
    required String modelName,
    int days = 7,
  }) async {
    if (_prefs == null) await initialize();

    // Retrieve stored events
    final events = await _getStoredEvents('inference', days);

    // Filter by model
    final modelEvents = events.where((e) => e['modelName'] == modelName).toList();

    if (modelEvents.isEmpty) {
      return {
        'modelName': modelName,
        'sampleSize': 0,
      };
    }

    final latencies = modelEvents.map((e) => e['inferenceTimeMs'] as int).toList();
    final confidences = modelEvents.map((e) => e['confidence'] as double).toList();

    latencies.sort();
    confidences.sort();

    return {
      'modelName': modelName,
      'sampleSize': modelEvents.length,
      'latency': {
        'mean': latencies.reduce((a, b) => a + b) / latencies.length,
        'p50': _percentile(latencies, 50),
        'p95': _percentile(latencies, 95),
        'p99': _percentile(latencies, 99),
        'min': latencies.first,
        'max': latencies.last,
      },
      'confidence': {
        'mean': confidences.reduce((a, b) => a + b) / confidences.length,
        'min': confidences.first,
        'max': confidences.last,
      },
    };
  }

  /// Update routing statistics (internal)
  Future<void> _updateRoutingStats(String modelName, bool usedLocal) async {
    if (_prefs == null) await initialize();

    final key = usedLocal ? 'routing_local_$modelName' : 'routing_server_$modelName';
    final count = _prefs!.getInt(key) ?? 0;
    await _prefs!.setInt(key, count + 1);
  }

  /// Store event locally for batch sending
  Future<void> _storeEventLocally(String eventType, Map<String, dynamic> event) async {
    if (_prefs == null) await initialize();

    final key = 'ml_events_$eventType';
    final eventsJson = _prefs!.getString(key) ?? '[]';
    final events = jsonDecode(eventsJson) as List;

    events.add(event);

    // Keep last 100 events
    if (events.length > 100) {
      events.removeRange(0, events.length - 100);
    }

    await _prefs!.setString(key, jsonEncode(events));
  }

  /// Get stored events (internal)
  Future<List<Map<String, dynamic>>> _getStoredEvents(String eventType, int days) async {
    if (_prefs == null) await initialize();

    final key = 'ml_events_$eventType';
    final eventsJson = _prefs!.getString(key) ?? '[]';
    final events = (jsonDecode(eventsJson) as List).cast<Map<String, dynamic>>();

    // Filter by time range
    final cutoff = DateTime.now().subtract(Duration(days: days));

    return events.where((e) {
      final timestamp = DateTime.parse(e['timestamp'] as String);
      return timestamp.isAfter(cutoff);
    }).toList();
  }

  /// Send events to server (batched, async)
  void _sendEventsToServer() async {
    try {
      // Get all pending events
      final inferenceEvents = await _getStoredEvents('inference', 7);
      final feedbackEvents = await _getStoredEvents('accuracy_feedback', 7);

      if (inferenceEvents.isEmpty && feedbackEvents.isEmpty) return;

      final payload = {
        'inference': inferenceEvents,
        'accuracy_feedback': feedbackEvents,
        'deviceModel': _deviceModel,
        'osVersion': _osVersion,
      };

      // Send to server
      final response = await http.post(
        Uri.parse('$_apiBaseUrl/api/v1/ml/telemetry'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      if (response.statusCode == 200) {
        print('📤 Sent ${inferenceEvents.length + feedbackEvents.length} telemetry events to server');

        // Clear sent events
        await _prefs!.remove('ml_events_inference');
        await _prefs!.remove('ml_events_accuracy_feedback');
      } else {
        print('⚠️  Failed to send telemetry: ${response.statusCode}');
      }
    } catch (e) {
      print('⚠️  Failed to send telemetry: $e');
      // Events remain stored for retry
    }
  }

  /// Calculate percentile
  int _percentile(List<int> sorted, int percentile) {
    final index = (percentile / 100 * sorted.length).ceil() - 1;
    return sorted[index.clamp(0, sorted.length - 1)];
  }

  /// Reset all telemetry data
  Future<void> reset() async {
    if (_prefs == null) await initialize();

    await _prefs!.remove('ml_events_inference');
    await _prefs!.remove('ml_events_accuracy_feedback');

    final models = ['churn_prediction', 'sentiment_analysis', 'goal_success'];
    for (var model in models) {
      await _prefs!.remove('routing_local_$model');
      await _prefs!.remove('routing_server_$model');
    }

    print('✅ Telemetry data reset');
  }
}
