import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:flutter/foundation.dart';

/// Production ML monitoring and observability system
class ModelMonitoring {
  static final ModelMonitoring _instance = ModelMonitoring._internal();
  factory ModelMonitoring() => _instance;
  ModelMonitoring._internal();

  Database? _database;
  final Map<String, CircularBuffer<double>> _metrics = {};
  final Map<String, DistributionTracker> _distributions = {};
  final List<Alert> _activeAlerts = [];
  final StreamController<Alert> _alertController = StreamController.broadcast();

  Stream<Alert> get alertStream => _alertController.stream;

  /// Initialize monitoring system
  Future<void> initialize() async {
    try {
      final dbPath = await getDatabasesPath();
      final path = join(dbPath, 'ml_monitoring.db');

      _database = await openDatabase(
        path,
        version: 1,
        onCreate: _createDatabase,
      );

      // Initialize metric buffers
      _initializeMetrics();

      debugPrint('ModelMonitoring initialized successfully');
    } catch (e) {
      debugPrint('Error initializing ModelMonitoring: $e');
      rethrow;
    }
  }

  /// Create database schema
  Future<void> _createDatabase(Database db, int version) async {
    await db.execute('''
      CREATE TABLE metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        model_version TEXT,
        metadata TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        severity TEXT NOT NULL,
        alert_type TEXT NOT NULL,
        message TEXT NOT NULL,
        metric_name TEXT,
        metric_value REAL,
        threshold REAL,
        acknowledged INTEGER DEFAULT 0,
        resolved INTEGER DEFAULT 0
      )
    ''');

    await db.execute('''
      CREATE TABLE inference_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        model_version TEXT NOT NULL,
        input_hash TEXT NOT NULL,
        output TEXT NOT NULL,
        latency_ms REAL NOT NULL,
        confidence REAL,
        error TEXT
      )
    ''');

    await db.execute('''
      CREATE INDEX idx_metrics_timestamp ON metrics(timestamp)
    ''');

    await db.execute('''
      CREATE INDEX idx_alerts_timestamp ON alerts(timestamp)
    ''');

    await db.execute('''
      CREATE INDEX idx_inference_timestamp ON inference_logs(timestamp)
    ''');
  }

  /// Initialize metric buffers
  void _initializeMetrics() {
    final metricNames = [
      'latency_ms',
      'throughput',
      'error_rate',
      'cpu_usage',
      'memory_usage',
      'battery_drain',
      'accuracy',
      'confidence',
      'data_quality_score',
    ];

    for (final name in metricNames) {
      _metrics[name] = CircularBuffer<double>(10000);
    }
  }

  /// Record inference with full logging
  Future<void> recordInference({
    required String modelVersion,
    required Map<String, dynamic> input,
    required Map<String, dynamic> output,
    required double latencyMs,
    double? confidence,
    String? error,
  }) async {
    try {
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final inputHash = _hashInput(input);

      // Log inference
      await _database?.insert('inference_logs', {
        'timestamp': timestamp,
        'model_version': modelVersion,
        'input_hash': inputHash,
        'output': jsonEncode(output),
        'latency_ms': latencyMs,
        'confidence': confidence,
        'error': error,
      });

      // Update metrics
      _metrics['latency_ms']?.add(latencyMs);
      if (confidence != null) {
        _metrics['confidence']?.add(confidence);
      }

      // Check for anomalies
      _checkLatencyAnomaly(latencyMs);

      // Update throughput
      _updateThroughput();

      debugPrint('Recorded inference: latency=${latencyMs}ms, confidence=$confidence');
    } catch (e) {
      debugPrint('Error recording inference: $e');
    }
  }

  /// Hash input for logging (privacy-preserving)
  String _hashInput(Map<String, dynamic> input) {
    final inputStr = jsonEncode(input);
    final bytes = utf8.encode(inputStr);
    int hash = 0;
    for (final byte in bytes) {
      hash = ((hash << 5) - hash + byte) & 0xFFFFFFFF;
    }
    return hash.toRadixString(16);
  }

  /// Update throughput metric
  void _updateThroughput() {
    final now = DateTime.now().millisecondsSinceEpoch;
    final oneSecondAgo = now - 1000;

    // Count inferences in last second
    _database
        ?.query(
      'inference_logs',
      where: 'timestamp > ?',
      whereArgs: [oneSecondAgo],
    )
        .then((results) {
      final throughput = results.length.toDouble();
      _metrics['throughput']?.add(throughput);
    });
  }

  /// Check for latency anomalies
  void _checkLatencyAnomaly(double latencyMs) {
    final buffer = _metrics['latency_ms'];
    if (buffer == null || buffer.length < 30) return;

    final stats = _calculateStats(buffer.toList());
    final zScore = (latencyMs - stats['mean']!) / stats['std']!;

    if (zScore.abs() > 3.0) {
      _createAlert(
        severity: AlertSeverity.high,
        alertType: AlertType.anomaly,
        message: 'Latency anomaly detected: ${latencyMs.toStringAsFixed(2)}ms (z-score: ${zScore.toStringAsFixed(2)})',
        metricName: 'latency_ms',
        metricValue: latencyMs,
        threshold: stats['mean']! + 3 * stats['std']!,
      );
    }

    // Threshold-based alert
    if (latencyMs > 100) {
      _createAlert(
        severity: AlertSeverity.medium,
        alertType: AlertType.threshold,
        message: 'High latency detected: ${latencyMs.toStringAsFixed(2)}ms',
        metricName: 'latency_ms',
        metricValue: latencyMs,
        threshold: 100,
      );
    }
  }

  /// Record performance metrics
  Future<void> recordMetric({
    required String metricName,
    required double value,
    String? modelVersion,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final timestamp = DateTime.now().millisecondsSinceEpoch;

      await _database?.insert('metrics', {
        'timestamp': timestamp,
        'metric_name': metricName,
        'metric_value': value,
        'model_version': modelVersion,
        'metadata': metadata != null ? jsonEncode(metadata) : null,
      });

      _metrics[metricName]?.add(value);

      // Check thresholds
      _checkThresholds(metricName, value);
    } catch (e) {
      debugPrint('Error recording metric: $e');
    }
  }

  /// Check metric thresholds
  void _checkThresholds(String metricName, double value) {
    final thresholds = {
      'error_rate': 5.0,
      'accuracy': 90.0, // Should be above
      'cpu_usage': 80.0,
      'memory_usage': 85.0,
      'data_quality_score': 80.0, // Should be above
    };

    if (!thresholds.containsKey(metricName)) return;

    final threshold = thresholds[metricName]!;
    bool violated = false;
    String message = '';

    if (metricName == 'accuracy' || metricName == 'data_quality_score') {
      // These should be above threshold
      if (value < threshold) {
        violated = true;
        message = '$metricName below threshold: ${value.toStringAsFixed(2)}% < $threshold%';
      }
    } else {
      // These should be below threshold
      if (value > threshold) {
        violated = true;
        message = '$metricName above threshold: ${value.toStringAsFixed(2)}% > $threshold%';
      }
    }

    if (violated) {
      _createAlert(
        severity: AlertSeverity.high,
        alertType: AlertType.threshold,
        message: message,
        metricName: metricName,
        metricValue: value,
        threshold: threshold,
      );
    }
  }

  /// Get performance statistics
  Future<PerformanceStats> getPerformanceStats({
    Duration? window,
  }) async {
    try {
      final windowMs = window?.inMilliseconds ?? 3600000; // Default 1 hour
      final now = DateTime.now().millisecondsSinceEpoch;
      final startTime = now - windowMs;

      // Get latency stats
      final latencyMetrics = await _getMetricsInWindow('latency_ms', startTime, now);
      final latencyStats = _calculatePercentiles(latencyMetrics);

      // Get throughput
      final throughputMetrics = await _getMetricsInWindow('throughput', startTime, now);
      final avgThroughput = throughputMetrics.isEmpty
          ? 0.0
          : throughputMetrics.reduce((a, b) => a + b) / throughputMetrics.length;

      // Get error rate
      final errorRate = await _calculateErrorRate(startTime, now);

      // Get resource usage
      final cpuMetrics = await _getMetricsInWindow('cpu_usage', startTime, now);
      final avgCpu = cpuMetrics.isEmpty
          ? 0.0
          : cpuMetrics.reduce((a, b) => a + b) / cpuMetrics.length;

      final memoryMetrics = await _getMetricsInWindow('memory_usage', startTime, now);
      final avgMemory = memoryMetrics.isEmpty
          ? 0.0
          : memoryMetrics.reduce((a, b) => a + b) / memoryMetrics.length;

      final batteryMetrics = await _getMetricsInWindow('battery_drain', startTime, now);
      final avgBattery = batteryMetrics.isEmpty
          ? 0.0
          : batteryMetrics.reduce((a, b) => a + b) / batteryMetrics.length;

      // Get model version distribution
      final versionDist = await _getModelVersionDistribution(startTime, now);

      return PerformanceStats(
        p50Latency: latencyStats['p50'] ?? 0,
        p95Latency: latencyStats['p95'] ?? 0,
        p99Latency: latencyStats['p99'] ?? 0,
        maxLatency: latencyStats['max'] ?? 0,
        avgThroughput: avgThroughput,
        errorRate: errorRate,
        cpuUsage: avgCpu,
        memoryUsage: avgMemory,
        batteryDrain: avgBattery,
        modelVersionDistribution: versionDist,
      );
    } catch (e) {
      debugPrint('Error getting performance stats: $e');
      return PerformanceStats.empty();
    }
  }

  /// Get metrics within time window
  Future<List<double>> _getMetricsInWindow(
    String metricName,
    int startTime,
    int endTime,
  ) async {
    final results = await _database?.query(
      'metrics',
      columns: ['metric_value'],
      where: 'metric_name = ? AND timestamp >= ? AND timestamp <= ?',
      whereArgs: [metricName, startTime, endTime],
    );

    return results?.map((row) => row['metric_value'] as double).toList() ?? [];
  }

  /// Calculate error rate
  Future<double> _calculateErrorRate(int startTime, int endTime) async {
    final total = await _database?.query(
      'inference_logs',
      where: 'timestamp >= ? AND timestamp <= ?',
      whereArgs: [startTime, endTime],
    );

    final errors = await _database?.query(
      'inference_logs',
      where: 'timestamp >= ? AND timestamp <= ? AND error IS NOT NULL',
      whereArgs: [startTime, endTime],
    );

    if (total == null || total.isEmpty) return 0.0;

    return (errors?.length ?? 0) * 100.0 / total.length;
  }

  /// Get model version distribution
  Future<Map<String, int>> _getModelVersionDistribution(
    int startTime,
    int endTime,
  ) async {
    final results = await _database?.query(
      'inference_logs',
      columns: ['model_version'],
      where: 'timestamp >= ? AND timestamp <= ?',
      whereArgs: [startTime, endTime],
    );

    final distribution = <String, int>{};
    for (final row in results ?? []) {
      final version = row['model_version'] as String;
      distribution[version] = (distribution[version] ?? 0) + 1;
    }

    return distribution;
  }

  /// Calculate percentiles
  Map<String, double> _calculatePercentiles(List<double> values) {
    if (values.isEmpty) {
      return {'p50': 0, 'p95': 0, 'p99': 0, 'max': 0};
    }

    final sorted = List<double>.from(values)..sort();
    final p50Index = (sorted.length * 0.50).floor();
    final p95Index = (sorted.length * 0.95).floor();
    final p99Index = (sorted.length * 0.99).floor();

    return {
      'p50': sorted[p50Index.clamp(0, sorted.length - 1)],
      'p95': sorted[p95Index.clamp(0, sorted.length - 1)],
      'p99': sorted[p99Index.clamp(0, sorted.length - 1)],
      'max': sorted.last,
    };
  }

  /// Monitor input data quality
  Future<DataQualityReport> monitorDataQuality({
    required Map<String, dynamic> input,
    required Map<String, FeatureStats> trainingStats,
  }) async {
    try {
      final violations = <String>[];
      final warnings = <String>[];
      int totalChecks = 0;
      int passedChecks = 0;

      // Type validation
      for (final entry in input.entries) {
        totalChecks++;
        if (entry.value == null) {
          violations.add('Missing feature: ${entry.key}');
        } else {
          passedChecks++;
        }
      }

      // Distribution monitoring
      final oodFeatures = <String>[];
      for (final entry in input.entries) {
        if (entry.value is! num) continue;

        final value = (entry.value as num).toDouble();
        final stats = trainingStats[entry.key];

        if (stats != null) {
          totalChecks++;

          // Z-score calculation
          final zScore = (value - stats.mean) / stats.std;

          if (zScore.abs() > 3.0) {
            oodFeatures.add(entry.key);
            warnings.add('OOD feature ${entry.key}: z-score=${zScore.toStringAsFixed(2)}');
          } else {
            passedChecks++;
          }

          // Range validation
          if (stats.min != null && value < stats.min!) {
            violations.add('Feature ${entry.key} below min: $value < ${stats.min}');
          } else if (stats.max != null && value > stats.max!) {
            violations.add('Feature ${entry.key} above max: $value > ${stats.max}');
          }
        }
      }

      // Calculate quality score
      final qualityScore = totalChecks > 0 ? (passedChecks * 100.0 / totalChecks) : 100.0;

      // Update distribution tracker
      for (final entry in input.entries) {
        if (entry.value is num) {
          final tracker = _distributions.putIfAbsent(
            entry.key,
            () => DistributionTracker(),
          );
          tracker.addValue((entry.value as num).toDouble());
        }
      }

      // Record metric
      await recordMetric(
        metricName: 'data_quality_score',
        value: qualityScore,
      );

      return DataQualityReport(
        qualityScore: qualityScore,
        violations: violations,
        warnings: warnings,
        oodFeatures: oodFeatures,
        totalChecks: totalChecks,
        passedChecks: passedChecks,
      );
    } catch (e) {
      debugPrint('Error monitoring data quality: $e');
      return DataQualityReport.empty();
    }
  }

  /// Monitor model quality
  Future<ModelQualityReport> monitorModelQuality({
    required List<LabeledSample> labeledSamples,
    required List<double> predictions,
  }) async {
    try {
      if (labeledSamples.length != predictions.length) {
        throw ArgumentError('Samples and predictions length mismatch');
      }

      // Calculate accuracy
      int correct = 0;
      for (int i = 0; i < labeledSamples.length; i++) {
        if ((predictions[i] > 0.5 ? 1 : 0) == labeledSamples[i].label) {
          correct++;
        }
      }
      final accuracy = (correct * 100.0) / labeledSamples.length;

      // Confidence calibration
      final calibration = _calculateCalibration(labeledSamples, predictions);

      // Prediction distribution
      final predStats = _calculateStats(predictions);

      // Record accuracy
      await recordMetric(metricName: 'accuracy', value: accuracy);

      return ModelQualityReport(
        accuracy: accuracy,
        calibrationError: calibration['error']!,
        predictionMean: predStats['mean']!,
        predictionStd: predStats['std']!,
        sampleCount: labeledSamples.length,
      );
    } catch (e) {
      debugPrint('Error monitoring model quality: $e');
      return ModelQualityReport.empty();
    }
  }

  /// Calculate confidence calibration
  Map<String, double> _calculateCalibration(
    List<LabeledSample> samples,
    List<double> predictions,
  ) {
    const numBins = 10;
    final bins = List.generate(numBins, (_) => <int>[]);
    final binAccuracies = List<double>.filled(numBins, 0);

    // Assign predictions to bins
    for (int i = 0; i < predictions.length; i++) {
      final binIndex = (predictions[i] * numBins).floor().clamp(0, numBins - 1);
      bins[binIndex].add(i);
    }

    // Calculate accuracy per bin
    double totalError = 0;
    int totalSamples = 0;

    for (int b = 0; b < numBins; b++) {
      if (bins[b].isEmpty) continue;

      int correct = 0;
      double avgConfidence = 0;

      for (final idx in bins[b]) {
        avgConfidence += predictions[idx];
        if ((predictions[idx] > 0.5 ? 1 : 0) == samples[idx].label) {
          correct++;
        }
      }

      avgConfidence /= bins[b].length;
      final accuracy = correct / bins[b].length;
      final error = (avgConfidence - accuracy).abs();

      totalError += error * bins[b].length;
      totalSamples += bins[b].length;
    }

    final calibrationError = totalSamples > 0 ? totalError / totalSamples : 0.0;

    return {'error': calibrationError};
  }

  /// Detect prediction drift using KS test
  Future<DriftReport> detectPredictionDrift({
    required List<double> trainingPredictions,
    required List<double> productionPredictions,
  }) async {
    try {
      final ksStatistic = _kolmogorovSmirnovTest(
        trainingPredictions,
        productionPredictions,
      );

      // Critical value for 95% confidence (approximate)
      final n1 = trainingPredictions.length;
      final n2 = productionPredictions.length;
      final criticalValue = 1.36 * sqrt((n1 + n2) / (n1 * n2));

      final isDrifted = ksStatistic > criticalValue;

      if (isDrifted) {
        _createAlert(
          severity: AlertSeverity.high,
          alertType: AlertType.drift,
          message: 'Prediction drift detected: KS=${ksStatistic.toStringAsFixed(4)}',
          metricName: 'prediction_drift',
          metricValue: ksStatistic,
          threshold: criticalValue,
        );
      }

      return DriftReport(
        isDrifted: isDrifted,
        ksStatistic: ksStatistic,
        criticalValue: criticalValue,
        pValue: _ksTestPValue(ksStatistic, n1, n2),
      );
    } catch (e) {
      debugPrint('Error detecting prediction drift: $e');
      return DriftReport.empty();
    }
  }

  /// Kolmogorov-Smirnov test
  double _kolmogorovSmirnovTest(List<double> sample1, List<double> sample2) {
    final sorted1 = List<double>.from(sample1)..sort();
    final sorted2 = List<double>.from(sample2)..sort();

    double maxDiff = 0;
    int i = 0, j = 0;

    while (i < sorted1.length && j < sorted2.length) {
      final cdf1 = (i + 1) / sorted1.length;
      final cdf2 = (j + 1) / sorted2.length;
      final diff = (cdf1 - cdf2).abs();

      if (diff > maxDiff) {
        maxDiff = diff;
      }

      if (sorted1[i] < sorted2[j]) {
        i++;
      } else {
        j++;
      }
    }

    return maxDiff;
  }

  /// Approximate p-value for KS test
  double _ksTestPValue(double ksStatistic, int n1, int n2) {
    final ne = (n1 * n2) / (n1 + n2);
    final lambda = ksStatistic * sqrt(ne);

    // Approximation for p-value
    return 2 * exp(-2 * lambda * lambda);
  }

  /// Detect bias in predictions
  Future<BiasReport> detectBias({
    required List<LabeledSample> samples,
    required List<double> predictions,
    required String sensitiveAttribute,
  }) async {
    try {
      // Group by sensitive attribute
      final groups = <String, List<int>>{};
      for (int i = 0; i < samples.length; i++) {
        final value = samples[i].attributes[sensitiveAttribute]?.toString() ?? 'unknown';
        groups.putIfAbsent(value, () => []).add(i);
      }

      final metrics = <String, BiasMetrics>{};

      for (final entry in groups.entries) {
        final groupIndices = entry.value;

        // Calculate positive prediction rate
        int positives = 0;
        int truePositives = 0;
        int falsePositives = 0;
        int actualPositives = 0;

        for (final idx in groupIndices) {
          final predicted = predictions[idx] > 0.5 ? 1 : 0;
          final actual = samples[idx].label;

          if (predicted == 1) positives++;
          if (actual == 1) actualPositives++;
          if (predicted == 1 && actual == 1) truePositives++;
          if (predicted == 1 && actual == 0) falsePositives++;
        }

        final positivePredictionRate = positives / groupIndices.length;
        final truePositiveRate = actualPositives > 0
            ? truePositives / actualPositives
            : 0.0;

        metrics[entry.key] = BiasMetrics(
          groupSize: groupIndices.length,
          positivePredictionRate: positivePredictionRate,
          truePositiveRate: truePositiveRate,
        );
      }

      // Calculate demographic parity (max difference in positive rates)
      final rates = metrics.values.map((m) => m.positivePredictionRate).toList();
      final demographicParity = rates.isEmpty ? 0.0 : rates.reduce(max) - rates.reduce(min);

      // Calculate equalized odds (max difference in TPR)
      final tprs = metrics.values.map((m) => m.truePositiveRate).toList();
      final equalizedOdds = tprs.isEmpty ? 0.0 : tprs.reduce(max) - tprs.reduce(min);

      return BiasReport(
        groupMetrics: metrics,
        demographicParity: demographicParity,
        equalizedOdds: equalizedOdds,
      );
    } catch (e) {
      debugPrint('Error detecting bias: $e');
      return BiasReport.empty();
    }
  }

  /// Create alert
  void _createAlert({
    required AlertSeverity severity,
    required AlertType alertType,
    required String message,
    String? metricName,
    double? metricValue,
    double? threshold,
  }) {
    // Check for duplicate alerts within 1 hour
    final now = DateTime.now();
    final oneHourAgo = now.subtract(const Duration(hours: 1));

    final duplicate = _activeAlerts.any((alert) =>
        alert.alertType == alertType &&
        alert.metricName == metricName &&
        alert.timestamp.isAfter(oneHourAgo));

    if (duplicate) return;

    final alert = Alert(
      id: DateTime.now().millisecondsSinceEpoch,
      timestamp: now,
      severity: severity,
      alertType: alertType,
      message: message,
      metricName: metricName,
      metricValue: metricValue,
      threshold: threshold,
    );

    _activeAlerts.add(alert);
    _alertController.add(alert);

    // Persist to database
    _database?.insert('alerts', {
      'timestamp': alert.timestamp.millisecondsSinceEpoch,
      'severity': alert.severity.toString(),
      'alert_type': alert.alertType.toString(),
      'message': alert.message,
      'metric_name': alert.metricName,
      'metric_value': alert.metricValue,
      'threshold': alert.threshold,
    });

    debugPrint('Alert created: ${alert.severity} - ${alert.message}');
  }

  /// Get active alerts
  List<Alert> getActiveAlerts({AlertSeverity? minSeverity}) {
    if (minSeverity == null) return List.from(_activeAlerts);

    final severityOrder = {
      AlertSeverity.critical: 3,
      AlertSeverity.high: 2,
      AlertSeverity.medium: 1,
      AlertSeverity.low: 0,
    };

    final minLevel = severityOrder[minSeverity] ?? 0;

    return _activeAlerts
        .where((alert) => (severityOrder[alert.severity] ?? 0) >= minLevel)
        .toList()
      ..sort((a, b) {
        final aLevel = severityOrder[a.severity] ?? 0;
        final bLevel = severityOrder[b.severity] ?? 0;
        return bLevel.compareTo(aLevel);
      });
  }

  /// Acknowledge alert
  Future<void> acknowledgeAlert(int alertId) async {
    _activeAlerts.removeWhere((alert) => alert.id == alertId);

    await _database?.update(
      'alerts',
      {'acknowledged': 1},
      where: 'id = ?',
      whereArgs: [alertId],
    );
  }

  /// Calculate statistics
  Map<String, double> _calculateStats(List<double> values) {
    if (values.isEmpty) {
      return {'mean': 0, 'std': 0, 'min': 0, 'max': 0};
    }

    final mean = values.reduce((a, b) => a + b) / values.length;
    final variance = values.map((v) => pow(v - mean, 2)).reduce((a, b) => a + b) / values.length;
    final std = sqrt(variance);

    return {
      'mean': mean,
      'std': std,
      'min': values.reduce(min),
      'max': values.reduce(max),
    };
  }

  /// Clean up old data
  Future<void> cleanupOldData({Duration retention = const Duration(days: 30)}) async {
    try {
      final cutoff = DateTime.now()
          .subtract(retention)
          .millisecondsSinceEpoch;

      await _database?.delete('metrics', where: 'timestamp < ?', whereArgs: [cutoff]);
      await _database?.delete('inference_logs', where: 'timestamp < ?', whereArgs: [cutoff]);
      await _database?.delete('alerts', where: 'timestamp < ? AND acknowledged = 1', whereArgs: [cutoff]);

      debugPrint('Cleaned up data older than $retention');
    } catch (e) {
      debugPrint('Error cleaning up old data: $e');
    }
  }

  /// Dispose resources
  void dispose() {
    _alertController.close();
    _database?.close();
  }
}

/// Circular buffer for time series data
class CircularBuffer<T> {
  final int capacity;
  final List<T> _buffer;
  int _head = 0;
  int _size = 0;

  CircularBuffer(this.capacity) : _buffer = List<T>.filled(capacity, null as T, growable: false);

  void add(T value) {
    _buffer[_head] = value;
    _head = (_head + 1) % capacity;
    if (_size < capacity) _size++;
  }

  int get length => _size;

  List<T> toList() {
    if (_size < capacity) {
      return _buffer.sublist(0, _size);
    }
    return [..._buffer.sublist(_head), ..._buffer.sublist(0, _head)];
  }
}

/// Distribution tracker
class DistributionTracker {
  final List<double> _values = [];
  double _sum = 0;
  double _sumSquares = 0;

  void addValue(double value) {
    _values.add(value);
    _sum += value;
    _sumSquares += value * value;

    if (_values.length > 10000) {
      final removed = _values.removeAt(0);
      _sum -= removed;
      _sumSquares -= removed * removed;
    }
  }

  double get mean => _values.isEmpty ? 0 : _sum / _values.length;

  double get std {
    if (_values.isEmpty) return 0;
    final variance = (_sumSquares / _values.length) - pow(mean, 2);
    return sqrt(variance.clamp(0, double.infinity));
  }

  List<double> get values => List.from(_values);
}

/// Performance statistics
class PerformanceStats {
  final double p50Latency;
  final double p95Latency;
  final double p99Latency;
  final double maxLatency;
  final double avgThroughput;
  final double errorRate;
  final double cpuUsage;
  final double memoryUsage;
  final double batteryDrain;
  final Map<String, int> modelVersionDistribution;

  PerformanceStats({
    required this.p50Latency,
    required this.p95Latency,
    required this.p99Latency,
    required this.maxLatency,
    required this.avgThroughput,
    required this.errorRate,
    required this.cpuUsage,
    required this.memoryUsage,
    required this.batteryDrain,
    required this.modelVersionDistribution,
  });

  factory PerformanceStats.empty() => PerformanceStats(
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0,
        maxLatency: 0,
        avgThroughput: 0,
        errorRate: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        batteryDrain: 0,
        modelVersionDistribution: {},
      );
}

/// Data quality report
class DataQualityReport {
  final double qualityScore;
  final List<String> violations;
  final List<String> warnings;
  final List<String> oodFeatures;
  final int totalChecks;
  final int passedChecks;

  DataQualityReport({
    required this.qualityScore,
    required this.violations,
    required this.warnings,
    required this.oodFeatures,
    required this.totalChecks,
    required this.passedChecks,
  });

  factory DataQualityReport.empty() => DataQualityReport(
        qualityScore: 0,
        violations: [],
        warnings: [],
        oodFeatures: [],
        totalChecks: 0,
        passedChecks: 0,
      );
}

/// Model quality report
class ModelQualityReport {
  final double accuracy;
  final double calibrationError;
  final double predictionMean;
  final double predictionStd;
  final int sampleCount;

  ModelQualityReport({
    required this.accuracy,
    required this.calibrationError,
    required this.predictionMean,
    required this.predictionStd,
    required this.sampleCount,
  });

  factory ModelQualityReport.empty() => ModelQualityReport(
        accuracy: 0,
        calibrationError: 0,
        predictionMean: 0,
        predictionStd: 0,
        sampleCount: 0,
      );
}

/// Drift report
class DriftReport {
  final bool isDrifted;
  final double ksStatistic;
  final double criticalValue;
  final double pValue;

  DriftReport({
    required this.isDrifted,
    required this.ksStatistic,
    required this.criticalValue,
    required this.pValue,
  });

  factory DriftReport.empty() => DriftReport(
        isDrifted: false,
        ksStatistic: 0,
        criticalValue: 0,
        pValue: 1,
      );
}

/// Bias report
class BiasReport {
  final Map<String, BiasMetrics> groupMetrics;
  final double demographicParity;
  final double equalizedOdds;

  BiasReport({
    required this.groupMetrics,
    required this.demographicParity,
    required this.equalizedOdds,
  });

  factory BiasReport.empty() => BiasReport(
        groupMetrics: {},
        demographicParity: 0,
        equalizedOdds: 0,
      );
}

/// Bias metrics per group
class BiasMetrics {
  final int groupSize;
  final double positivePredictionRate;
  final double truePositiveRate;

  BiasMetrics({
    required this.groupSize,
    required this.positivePredictionRate,
    required this.truePositiveRate,
  });
}

/// Feature statistics
class FeatureStats {
  final double mean;
  final double std;
  final double? min;
  final double? max;

  FeatureStats({
    required this.mean,
    required this.std,
    this.min,
    this.max,
  });
}

/// Labeled sample for quality monitoring
class LabeledSample {
  final Map<String, dynamic> features;
  final int label;
  final Map<String, dynamic> attributes;

  LabeledSample({
    required this.features,
    required this.label,
    this.attributes = const {},
  });
}

/// Alert model
class Alert {
  final int id;
  final DateTime timestamp;
  final AlertSeverity severity;
  final AlertType alertType;
  final String message;
  final String? metricName;
  final double? metricValue;
  final double? threshold;

  Alert({
    required this.id,
    required this.timestamp,
    required this.severity,
    required this.alertType,
    required this.message,
    this.metricName,
    this.metricValue,
    this.threshold,
  });
}

/// Alert severity levels
enum AlertSeverity {
  critical,
  high,
  medium,
  low,
}

/// Alert types
enum AlertType {
  threshold,
  anomaly,
  drift,
  quality,
}
