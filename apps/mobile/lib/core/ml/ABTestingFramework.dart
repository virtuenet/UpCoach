import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:flutter/foundation.dart';

/// On-device A/B testing and experimentation framework
class ABTestingFramework {
  static final ABTestingFramework _instance = ABTestingFramework._internal();
  factory ABTestingFramework() => _instance;
  ABTestingFramework._internal();

  Database? _database;
  final Map<String, Experiment> _activeExperiments = {};
  final Map<String, String> _userAssignments = {};
  final Random _random = Random();

  /// Initialize A/B testing framework
  Future<void> initialize() async {
    try {
      final dbPath = await getDatabasesPath();
      final path = join(dbPath, 'ab_testing.db');

      _database = await openDatabase(
        path,
        version: 1,
        onCreate: _createDatabase,
      );

      await _loadActiveExperiments();

      debugPrint('ABTestingFramework initialized successfully');
    } catch (e) {
      debugPrint('Error initializing ABTestingFramework: $e');
      rethrow;
    }
  }

  /// Create database schema
  Future<void> _createDatabase(Database db, int version) async {
    await db.execute('''
      CREATE TABLE experiments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        start_date INTEGER,
        end_date INTEGER,
        variants TEXT NOT NULL,
        allocation TEXT NOT NULL,
        targeting TEXT,
        primary_metric TEXT NOT NULL,
        secondary_metrics TEXT,
        guardrail_metrics TEXT,
        mutual_exclusion_group TEXT,
        created_at INTEGER NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE variant_assignments (
        user_id TEXT NOT NULL,
        experiment_id TEXT NOT NULL,
        variant TEXT NOT NULL,
        assigned_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, experiment_id)
      )
    ''');

    await db.execute('''
      CREATE TABLE experiment_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        experiment_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        variant TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        timestamp INTEGER NOT NULL
      )
    ''');

    await db.execute('''
      CREATE INDEX idx_metrics_experiment ON experiment_metrics(experiment_id)
    ''');

    await db.execute('''
      CREATE INDEX idx_metrics_timestamp ON experiment_metrics(timestamp)
    ''');
  }

  /// Load active experiments
  Future<void> _loadActiveExperiments() async {
    try {
      final now = DateTime.now().millisecondsSinceEpoch;

      final results = await _database?.query(
        'experiments',
        where: 'status = ? AND (end_date IS NULL OR end_date > ?)',
        whereArgs: ['active', now],
      );

      for (final row in results ?? []) {
        final experiment = Experiment.fromMap(row);
        _activeExperiments[experiment.id] = experiment;
      }

      debugPrint('Loaded ${_activeExperiments.length} active experiments');
    } catch (e) {
      debugPrint('Error loading active experiments: $e');
    }
  }

  /// Create experiment
  Future<Experiment> createExperiment({
    required String name,
    String? description,
    required List<String> variants,
    required Map<String, double> allocation,
    required String primaryMetric,
    List<String>? secondaryMetrics,
    List<String>? guardrailMetrics,
    UserSegment? targeting,
    String? mutualExclusionGroup,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      // Validate allocation
      final totalAllocation = allocation.values.reduce((a, b) => a + b);
      if ((totalAllocation - 100.0).abs() > 0.01) {
        throw ArgumentError('Total allocation must equal 100%');
      }

      final experiment = Experiment(
        id: _generateExperimentId(name),
        name: name,
        description: description,
        status: ExperimentStatus.active,
        startDate: startDate,
        endDate: endDate,
        variants: variants,
        allocation: allocation,
        targeting: targeting,
        primaryMetric: primaryMetric,
        secondaryMetrics: secondaryMetrics ?? [],
        guardrailMetrics: guardrailMetrics ?? [],
        mutualExclusionGroup: mutualExclusionGroup,
        createdAt: DateTime.now(),
      );

      await _database?.insert('experiments', experiment.toMap());
      _activeExperiments[experiment.id] = experiment;

      debugPrint('Created experiment: ${experiment.name}');
      return experiment;
    } catch (e) {
      debugPrint('Error creating experiment: $e');
      rethrow;
    }
  }

  /// Generate experiment ID
  String _generateExperimentId(String name) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final sanitized = name.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '_');
    return '${sanitized}_$timestamp';
  }

  /// Assign user to variant
  Future<String> assignVariant({
    required String experimentId,
    required String userId,
    String? forceVariant,
  }) async {
    try {
      final experiment = _activeExperiments[experimentId];
      if (experiment == null) {
        throw ArgumentError('Experiment not found: $experimentId');
      }

      // Check if already assigned
      final existingAssignment = await _getExistingAssignment(userId, experimentId);
      if (existingAssignment != null) {
        return existingAssignment;
      }

      // Check targeting
      if (experiment.targeting != null) {
        final eligible = await _checkTargeting(userId, experiment.targeting!);
        if (!eligible) {
          return 'control'; // Not eligible, assign to control
        }
      }

      // Check mutual exclusion
      if (experiment.mutualExclusionGroup != null) {
        final hasConflict = await _checkMutualExclusion(
          userId,
          experiment.mutualExclusionGroup!,
        );
        if (hasConflict) {
          return 'control'; // Has conflict, assign to control
        }
      }

      // Assign variant
      String variant;
      if (forceVariant != null && experiment.variants.contains(forceVariant)) {
        variant = forceVariant;
      } else {
        variant = _deterministicAssignment(userId, experimentId, experiment);
      }

      // Save assignment
      await _database?.insert('variant_assignments', {
        'user_id': userId,
        'experiment_id': experimentId,
        'variant': variant,
        'assigned_at': DateTime.now().millisecondsSinceEpoch,
      });

      _userAssignments['$userId:$experimentId'] = variant;

      return variant;
    } catch (e) {
      debugPrint('Error assigning variant: $e');
      return 'control';
    }
  }

  /// Get existing assignment
  Future<String?> _getExistingAssignment(String userId, String experimentId) async {
    final key = '$userId:$experimentId';
    if (_userAssignments.containsKey(key)) {
      return _userAssignments[key];
    }

    final results = await _database?.query(
      'variant_assignments',
      where: 'user_id = ? AND experiment_id = ?',
      whereArgs: [userId, experimentId],
      limit: 1,
    );

    if (results != null && results.isNotEmpty) {
      final variant = results.first['variant'] as String;
      _userAssignments[key] = variant;
      return variant;
    }

    return null;
  }

  /// Deterministic variant assignment using consistent hashing
  String _deterministicAssignment(
    String userId,
    String experimentId,
    Experiment experiment,
  ) {
    // Create hash of user_id + experiment_id
    final input = '$userId:$experimentId';
    final bytes = utf8.encode(input);
    final digest = sha256.convert(bytes);
    final hashValue = digest.bytes.fold<int>(0, (sum, byte) => sum + byte);

    // Map hash to 0-100 range
    final bucket = (hashValue % 10000) / 100.0;

    // Assign based on allocation
    double cumulative = 0;
    for (final variant in experiment.variants) {
      cumulative += experiment.allocation[variant] ?? 0;
      if (bucket < cumulative) {
        return variant;
      }
    }

    return experiment.variants.last;
  }

  /// Check if user matches targeting criteria
  Future<bool> _checkTargeting(String userId, UserSegment segment) async {
    // Simplified targeting check
    // In production, this would check user properties
    return true;
  }

  /// Check mutual exclusion
  Future<bool> _checkMutualExclusion(
    String userId,
    String exclusionGroup,
  ) async {
    final results = await _database?.rawQuery('''
      SELECT va.* FROM variant_assignments va
      JOIN experiments e ON va.experiment_id = e.id
      WHERE va.user_id = ? AND e.mutual_exclusion_group = ? AND va.variant != 'control'
    ''', [userId, exclusionGroup]);

    return results != null && results.isNotEmpty;
  }

  /// Track metric
  Future<void> trackMetric({
    required String experimentId,
    required String userId,
    required String metricName,
    required double value,
  }) async {
    try {
      final variant = await _getExistingAssignment(userId, experimentId);
      if (variant == null) return;

      await _database?.insert('experiment_metrics', {
        'experiment_id': experimentId,
        'user_id': userId,
        'variant': variant,
        'metric_name': metricName,
        'metric_value': value,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      });
    } catch (e) {
      debugPrint('Error tracking metric: $e');
    }
  }

  /// Get experiment results
  Future<ExperimentResults> getExperimentResults(String experimentId) async {
    try {
      final experiment = _activeExperiments[experimentId];
      if (experiment == null) {
        throw ArgumentError('Experiment not found: $experimentId');
      }

      final variantResults = <String, VariantResults>{};

      for (final variant in experiment.variants) {
        // Get primary metric
        final primaryStats = await _getMetricStats(
          experimentId,
          variant,
          experiment.primaryMetric,
        );

        // Get secondary metrics
        final secondaryStats = <String, MetricStats>{};
        for (final metric in experiment.secondaryMetrics) {
          secondaryStats[metric] = await _getMetricStats(
            experimentId,
            variant,
            metric,
          );
        }

        // Get guardrail metrics
        final guardrailStats = <String, MetricStats>{};
        for (final metric in experiment.guardrailMetrics) {
          guardrailStats[metric] = await _getMetricStats(
            experimentId,
            variant,
            metric,
          );
        }

        variantResults[variant] = VariantResults(
          variant: variant,
          sampleSize: primaryStats.sampleSize,
          primaryMetric: primaryStats,
          secondaryMetrics: secondaryStats,
          guardrailMetrics: guardrailStats,
        );
      }

      // Perform statistical analysis
      final analysis = await _performStatisticalAnalysis(
        variantResults,
        experiment.primaryMetric,
      );

      return ExperimentResults(
        experimentId: experimentId,
        experimentName: experiment.name,
        variantResults: variantResults,
        analysis: analysis,
      );
    } catch (e) {
      debugPrint('Error getting experiment results: $e');
      rethrow;
    }
  }

  /// Get metric statistics
  Future<MetricStats> _getMetricStats(
    String experimentId,
    String variant,
    String metricName,
  ) async {
    final results = await _database?.query(
      'experiment_metrics',
      columns: ['metric_value', 'user_id'],
      where: 'experiment_id = ? AND variant = ? AND metric_name = ?',
      whereArgs: [experimentId, variant, metricName],
    );

    if (results == null || results.isEmpty) {
      return MetricStats.empty();
    }

    final values = results.map((r) => r['metric_value'] as double).toList();
    final uniqueUsers = results.map((r) => r['user_id'] as String).toSet().length;

    final mean = values.reduce((a, b) => a + b) / values.length;
    final variance = values
            .map((v) => pow(v - mean, 2))
            .reduce((a, b) => a + b) /
        values.length;
    final std = sqrt(variance);
    final stderr = std / sqrt(values.length);

    return MetricStats(
      metricName: metricName,
      sampleSize: uniqueUsers,
      mean: mean,
      std: std,
      stderr: stderr,
      min: values.reduce(min),
      max: values.reduce(max),
    );
  }

  /// Perform statistical analysis
  Future<StatisticalAnalysis> _performStatisticalAnalysis(
    Map<String, VariantResults> variantResults,
    String primaryMetric,
  ) async {
    try {
      // Assume first variant is control
      final control = variantResults.values.first;
      final comparisons = <String, VariantComparison>{};

      for (final variant in variantResults.values.skip(1)) {
        // Two-sample t-test
        final tTestResult = _twoSampleTTest(
          control.primaryMetric,
          variant.primaryMetric,
        );

        // Calculate confidence interval
        final ci = _confidenceInterval(
          variant.primaryMetric.mean,
          variant.primaryMetric.stderr,
          0.95,
        );

        // Calculate effect size (Cohen's d)
        final effectSize = _cohensD(
          control.primaryMetric.mean,
          variant.primaryMetric.mean,
          control.primaryMetric.std,
          variant.primaryMetric.std,
        );

        // Calculate uplift
        final uplift = ((variant.primaryMetric.mean - control.primaryMetric.mean) /
                control.primaryMetric.mean) *
            100;

        // Determine significance
        final isSignificant = tTestResult['pValue']! < 0.05;
        final hasEffect = effectSize.abs() > 0.2;

        comparisons[variant.variant] = VariantComparison(
          variant: variant.variant,
          controlMean: control.primaryMetric.mean,
          variantMean: variant.primaryMetric.mean,
          uplift: uplift,
          pValue: tTestResult['pValue']!,
          tStatistic: tTestResult['tStatistic']!,
          confidenceInterval: ci,
          effectSize: effectSize,
          isSignificant: isSignificant,
          recommendation: _getRecommendation(isSignificant, hasEffect, uplift),
        );
      }

      // Determine winner
      final winner = _selectWinner(comparisons);

      return StatisticalAnalysis(
        comparisons: comparisons,
        winner: winner,
        confidenceLevel: 0.95,
      );
    } catch (e) {
      debugPrint('Error performing statistical analysis: $e');
      return StatisticalAnalysis.empty();
    }
  }

  /// Two-sample t-test
  Map<String, double> _twoSampleTTest(MetricStats sample1, MetricStats sample2) {
    final n1 = sample1.sampleSize.toDouble();
    final n2 = sample2.sampleSize.toDouble();

    // Pooled standard error
    final pooledSE = sqrt(
      (sample1.std * sample1.std / n1) + (sample2.std * sample2.std / n2),
    );

    // T-statistic
    final tStatistic = (sample2.mean - sample1.mean) / pooledSE;

    // Degrees of freedom
    final df = n1 + n2 - 2;

    // Approximate p-value using normal distribution
    final pValue = 2 * (1 - _normalCDF(tStatistic.abs()));

    return {
      'tStatistic': tStatistic,
      'pValue': pValue,
      'df': df,
    };
  }

  /// Normal cumulative distribution function
  double _normalCDF(double x) {
    // Approximation of normal CDF
    final t = 1 / (1 + 0.2316419 * x.abs());
    final d = 0.3989423 * exp(-x * x / 2);
    final p = d *
        t *
        (0.3193815 +
            t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return x > 0 ? 1 - p : p;
  }

  /// Calculate confidence interval
  Map<String, double> _confidenceInterval(
    double mean,
    double stderr,
    double confidence,
  ) {
    // Z-score for 95% confidence
    final zScore = confidence == 0.95 ? 1.96 : 2.576;
    final margin = zScore * stderr;

    return {
      'lower': mean - margin,
      'upper': mean + margin,
    };
  }

  /// Calculate Cohen's d
  double _cohensD(double mean1, double mean2, double std1, double std2) {
    final pooledStd = sqrt((std1 * std1 + std2 * std2) / 2);
    return (mean2 - mean1) / pooledStd;
  }

  /// Get recommendation
  ExperimentRecommendation _getRecommendation(
    bool isSignificant,
    bool hasEffect,
    double uplift,
  ) {
    if (isSignificant && hasEffect && uplift > 0) {
      return ExperimentRecommendation.ship;
    } else if (isSignificant && uplift < 0) {
      return ExperimentRecommendation.kill;
    } else if (!isSignificant && hasEffect) {
      return ExperimentRecommendation.iterate;
    } else {
      return ExperimentRecommendation.inconclusive;
    }
  }

  /// Select winner
  String? _selectWinner(Map<String, VariantComparison> comparisons) {
    for (final entry in comparisons.entries) {
      if (entry.value.isSignificant &&
          entry.value.effectSize.abs() > 0.2 &&
          entry.value.uplift > 0) {
        return entry.key;
      }
    }
    return null;
  }

  /// Multi-armed bandit with Thompson sampling
  Future<String> thompsonSampling({
    required String experimentId,
    required String userId,
  }) async {
    try {
      final experiment = _activeExperiments[experimentId];
      if (experiment == null) {
        throw ArgumentError('Experiment not found: $experimentId');
      }

      // Get conversion stats for each variant
      final variantScores = <String, double>{};

      for (final variant in experiment.variants) {
        final stats = await _getConversionStats(experimentId, variant);

        // Sample from Beta distribution
        // Beta(successes + 1, failures + 1)
        final alpha = stats['successes']! + 1;
        final beta = stats['failures']! + 1;

        final score = _sampleBeta(alpha, beta);
        variantScores[variant] = score;
      }

      // Select variant with highest score
      final bestVariant = variantScores.entries
          .reduce((a, b) => a.value > b.value ? a : b)
          .key;

      // Save assignment
      await _database?.insert('variant_assignments', {
        'user_id': userId,
        'experiment_id': experimentId,
        'variant': bestVariant,
        'assigned_at': DateTime.now().millisecondsSinceEpoch,
      });

      return bestVariant;
    } catch (e) {
      debugPrint('Error in Thompson sampling: $e');
      return experiment.variants.first;
    }
  }

  /// Get conversion statistics
  Future<Map<String, double>> _getConversionStats(
    String experimentId,
    String variant,
  ) async {
    final results = await _database?.query(
      'experiment_metrics',
      columns: ['metric_value', 'user_id'],
      where: 'experiment_id = ? AND variant = ? AND metric_name = ?',
      whereArgs: [experimentId, variant, 'conversion'],
    );

    final uniqueUsers = results?.map((r) => r['user_id'] as String).toSet() ?? {};
    final conversions = results?.where((r) => (r['metric_value'] as double) > 0).length ?? 0;

    return {
      'successes': conversions.toDouble(),
      'failures': (uniqueUsers.length - conversions).toDouble(),
    };
  }

  /// Sample from Beta distribution
  double _sampleBeta(double alpha, double beta) {
    // Use Gamma distribution to sample from Beta
    final x = _sampleGamma(alpha);
    final y = _sampleGamma(beta);
    return x / (x + y);
  }

  /// Sample from Gamma distribution
  double _sampleGamma(double shape) {
    // Simple approximation using normal distribution
    // For production, use a proper Gamma sampler
    if (shape >= 1) {
      // Marsaglia and Tsang method
      final d = shape - 1.0 / 3.0;
      final c = 1.0 / sqrt(9.0 * d);

      while (true) {
        double x, v;
        do {
          x = _randomNormal();
          v = 1.0 + c * x;
        } while (v <= 0);

        v = v * v * v;
        final u = _random.nextDouble();
        final x2 = x * x;

        if (u < 1 - 0.0331 * x2 * x2) {
          return d * v;
        }

        if (log(u) < 0.5 * x2 + d * (1 - v + log(v))) {
          return d * v;
        }
      }
    } else {
      // Shape < 1, use rejection method
      final sample = _sampleGamma(shape + 1);
      return sample * pow(_random.nextDouble(), 1.0 / shape);
    }
  }

  /// Generate random normal variable
  double _randomNormal() {
    // Box-Muller transform
    final u1 = _random.nextDouble();
    final u2 = _random.nextDouble();
    return sqrt(-2 * log(u1)) * cos(2 * pi * u2);
  }

  /// Calculate sample size needed
  int calculateSampleSize({
    required double baselineRate,
    required double minimumDetectableEffect,
    double alpha = 0.05,
    double power = 0.80,
  }) {
    // Simplified sample size calculation
    final p1 = baselineRate;
    final p2 = baselineRate * (1 + minimumDetectableEffect);

    // Z-scores
    final zAlpha = 1.96; // For alpha = 0.05
    final zBeta = 0.84; // For power = 0.80

    final pooledP = (p1 + p2) / 2;
    final numerator = pow(zAlpha * sqrt(2 * pooledP * (1 - pooledP)) +
            zBeta * sqrt(p1 * (1 - p1) + p2 * (1 - p2)),
        2);
    final denominator = pow(p2 - p1, 2);

    return (numerator / denominator).ceil();
  }

  /// Stop experiment
  Future<void> stopExperiment(String experimentId) async {
    try {
      await _database?.update(
        'experiments',
        {'status': ExperimentStatus.stopped.toString()},
        where: 'id = ?',
        whereArgs: [experimentId],
      );

      _activeExperiments.remove(experimentId);

      debugPrint('Stopped experiment: $experimentId');
    } catch (e) {
      debugPrint('Error stopping experiment: $e');
    }
  }

  /// Archive experiment
  Future<void> archiveExperiment(String experimentId) async {
    try {
      await _database?.update(
        'experiments',
        {'status': ExperimentStatus.archived.toString()},
        where: 'id = ?',
        whereArgs: [experimentId],
      );

      _activeExperiments.remove(experimentId);

      debugPrint('Archived experiment: $experimentId');
    } catch (e) {
      debugPrint('Error archiving experiment: $e');
    }
  }

  /// Get all experiments
  Future<List<Experiment>> getAllExperiments() async {
    try {
      final results = await _database?.query('experiments');
      return results?.map((row) => Experiment.fromMap(row)).toList() ?? [];
    } catch (e) {
      debugPrint('Error getting all experiments: $e');
      return [];
    }
  }

  /// Dispose resources
  void dispose() {
    _database?.close();
  }
}

/// Experiment model
class Experiment {
  final String id;
  final String name;
  final String? description;
  final ExperimentStatus status;
  final DateTime? startDate;
  final DateTime? endDate;
  final List<String> variants;
  final Map<String, double> allocation;
  final UserSegment? targeting;
  final String primaryMetric;
  final List<String> secondaryMetrics;
  final List<String> guardrailMetrics;
  final String? mutualExclusionGroup;
  final DateTime createdAt;

  Experiment({
    required this.id,
    required this.name,
    this.description,
    required this.status,
    this.startDate,
    this.endDate,
    required this.variants,
    required this.allocation,
    this.targeting,
    required this.primaryMetric,
    this.secondaryMetrics = const [],
    this.guardrailMetrics = const [],
    this.mutualExclusionGroup,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'status': status.toString(),
      'start_date': startDate?.millisecondsSinceEpoch,
      'end_date': endDate?.millisecondsSinceEpoch,
      'variants': jsonEncode(variants),
      'allocation': jsonEncode(allocation),
      'targeting': targeting != null ? jsonEncode(targeting!.toMap()) : null,
      'primary_metric': primaryMetric,
      'secondary_metrics': jsonEncode(secondaryMetrics),
      'guardrail_metrics': jsonEncode(guardrailMetrics),
      'mutual_exclusion_group': mutualExclusionGroup,
      'created_at': createdAt.millisecondsSinceEpoch,
    };
  }

  factory Experiment.fromMap(Map<String, dynamic> map) {
    return Experiment(
      id: map['id'] as String,
      name: map['name'] as String,
      description: map['description'] as String?,
      status: ExperimentStatus.values.firstWhere(
        (e) => e.toString() == map['status'],
        orElse: () => ExperimentStatus.draft,
      ),
      startDate: map['start_date'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['start_date'] as int)
          : null,
      endDate: map['end_date'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['end_date'] as int)
          : null,
      variants: List<String>.from(jsonDecode(map['variants'] as String)),
      allocation: Map<String, double>.from(jsonDecode(map['allocation'] as String)),
      targeting: map['targeting'] != null
          ? UserSegment.fromMap(jsonDecode(map['targeting'] as String))
          : null,
      primaryMetric: map['primary_metric'] as String,
      secondaryMetrics: List<String>.from(jsonDecode(map['secondary_metrics'] as String)),
      guardrailMetrics: List<String>.from(jsonDecode(map['guardrail_metrics'] as String)),
      mutualExclusionGroup: map['mutual_exclusion_group'] as String?,
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['created_at'] as int),
    );
  }
}

/// User segment for targeting
class UserSegment {
  final String? segment;
  final Map<String, dynamic>? properties;

  UserSegment({this.segment, this.properties});

  Map<String, dynamic> toMap() {
    return {
      'segment': segment,
      'properties': properties,
    };
  }

  factory UserSegment.fromMap(Map<String, dynamic> map) {
    return UserSegment(
      segment: map['segment'] as String?,
      properties: map['properties'] as Map<String, dynamic>?,
    );
  }
}

/// Experiment status
enum ExperimentStatus {
  draft,
  active,
  stopped,
  archived,
}

/// Metric statistics
class MetricStats {
  final String metricName;
  final int sampleSize;
  final double mean;
  final double std;
  final double stderr;
  final double min;
  final double max;

  MetricStats({
    required this.metricName,
    required this.sampleSize,
    required this.mean,
    required this.std,
    required this.stderr,
    required this.min,
    required this.max,
  });

  factory MetricStats.empty() => MetricStats(
        metricName: '',
        sampleSize: 0,
        mean: 0,
        std: 0,
        stderr: 0,
        min: 0,
        max: 0,
      );
}

/// Variant results
class VariantResults {
  final String variant;
  final int sampleSize;
  final MetricStats primaryMetric;
  final Map<String, MetricStats> secondaryMetrics;
  final Map<String, MetricStats> guardrailMetrics;

  VariantResults({
    required this.variant,
    required this.sampleSize,
    required this.primaryMetric,
    required this.secondaryMetrics,
    required this.guardrailMetrics,
  });
}

/// Variant comparison
class VariantComparison {
  final String variant;
  final double controlMean;
  final double variantMean;
  final double uplift;
  final double pValue;
  final double tStatistic;
  final Map<String, double> confidenceInterval;
  final double effectSize;
  final bool isSignificant;
  final ExperimentRecommendation recommendation;

  VariantComparison({
    required this.variant,
    required this.controlMean,
    required this.variantMean,
    required this.uplift,
    required this.pValue,
    required this.tStatistic,
    required this.confidenceInterval,
    required this.effectSize,
    required this.isSignificant,
    required this.recommendation,
  });
}

/// Statistical analysis
class StatisticalAnalysis {
  final Map<String, VariantComparison> comparisons;
  final String? winner;
  final double confidenceLevel;

  StatisticalAnalysis({
    required this.comparisons,
    this.winner,
    required this.confidenceLevel,
  });

  factory StatisticalAnalysis.empty() => StatisticalAnalysis(
        comparisons: {},
        winner: null,
        confidenceLevel: 0.95,
      );
}

/// Experiment results
class ExperimentResults {
  final String experimentId;
  final String experimentName;
  final Map<String, VariantResults> variantResults;
  final StatisticalAnalysis analysis;

  ExperimentResults({
    required this.experimentId,
    required this.experimentName,
    required this.variantResults,
    required this.analysis,
  });
}

/// Experiment recommendation
enum ExperimentRecommendation {
  ship,
  iterate,
  kill,
  inconclusive,
}
