import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

import '../models/health_data_point.dart';
import '../models/health_integration.dart';
import 'health_service.dart';

/// Provider for the HealthDataAggregator
final healthDataAggregatorProvider = Provider<HealthDataAggregator>((ref) {
  final healthService = ref.watch(healthServiceProvider);
  return HealthDataAggregator(healthService: healthService);
});

/// Aggregates and stores health data from multiple sources locally
/// Implements privacy-first architecture - all data stays on device by default
class HealthDataAggregator {
  final HealthService healthService;

  HealthDataAggregator({required this.healthService});

  Database? _database;
  static const String _dbName = 'health_data.db';
  static const int _dbVersion = 1;

  // Storage keys
  static const String _settingsKey = 'health_privacy_settings';
  static const String _integrationsKey = 'health_integrations';

  /// Initialize the aggregator and local database
  Future<void> initialize() async {
    await _initDatabase();
    await healthService.initialize();
  }

  /// Initialize SQLite database for health data storage
  Future<void> _initDatabase() async {
    if (_database != null) return;

    final dbPath = await getDatabasesPath();
    final path = join(dbPath, _dbName);

    _database = await openDatabase(
      path,
      version: _dbVersion,
      onCreate: (db, version) async {
        // Health data points table
        await db.execute('''
          CREATE TABLE health_data_points (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            value REAL NOT NULL,
            unit TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            date_from INTEGER NOT NULL,
            date_to INTEGER NOT NULL,
            source TEXT NOT NULL,
            source_device_name TEXT,
            source_app_name TEXT,
            metadata TEXT,
            is_manual_entry INTEGER DEFAULT 0,
            synced_at INTEGER,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
          )
        ''');

        // Daily stats table for quick access
        await db.execute('''
          CREATE TABLE daily_stats (
            date TEXT PRIMARY KEY,
            stats_json TEXT NOT NULL,
            sources TEXT,
            last_updated INTEGER
          )
        ''');

        // Readiness scores table
        await db.execute('''
          CREATE TABLE readiness_scores (
            date TEXT PRIMARY KEY,
            overall_score INTEGER NOT NULL,
            sleep_score INTEGER,
            recovery_score INTEGER,
            activity_score INTEGER,
            stress_score INTEGER,
            hrv_score INTEGER,
            recommendation TEXT,
            habit_recommendations TEXT,
            activity_recommendations TEXT,
            data_sources TEXT,
            confidence_level REAL,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
          )
        ''');

        // Create indexes for common queries
        await db.execute(
          'CREATE INDEX idx_health_data_timestamp ON health_data_points(timestamp)',
        );
        await db.execute(
          'CREATE INDEX idx_health_data_type ON health_data_points(type)',
        );
        await db.execute(
          'CREATE INDEX idx_health_data_source ON health_data_points(source)',
        );
      },
    );
  }

  /// Store a health data point locally
  Future<void> storeDataPoint(AppHealthDataPoint point) async {
    await _initDatabase();

    await _database!.insert(
      'health_data_points',
      {
        'id': point.id,
        'type': point.type.name,
        'value': point.value,
        'unit': point.unit.name,
        'timestamp': point.timestamp.millisecondsSinceEpoch,
        'date_from': point.dateFrom.millisecondsSinceEpoch,
        'date_to': point.dateTo.millisecondsSinceEpoch,
        'source': point.source.name,
        'source_device_name': point.sourceDeviceName,
        'source_app_name': point.sourceAppName,
        'metadata': point.metadata != null ? jsonEncode(point.metadata) : null,
        'is_manual_entry': point.isManualEntry ? 1 : 0,
        'synced_at': point.syncedAt?.millisecondsSinceEpoch,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Store multiple health data points
  Future<void> storeDataPoints(List<AppHealthDataPoint> points) async {
    await _initDatabase();

    final batch = _database!.batch();
    for (final point in points) {
      batch.insert(
        'health_data_points',
        {
          'id': point.id,
          'type': point.type.name,
          'value': point.value,
          'unit': point.unit.name,
          'timestamp': point.timestamp.millisecondsSinceEpoch,
          'date_from': point.dateFrom.millisecondsSinceEpoch,
          'date_to': point.dateTo.millisecondsSinceEpoch,
          'source': point.source.name,
          'source_device_name': point.sourceDeviceName,
          'source_app_name': point.sourceAppName,
          'metadata':
              point.metadata != null ? jsonEncode(point.metadata) : null,
          'is_manual_entry': point.isManualEntry ? 1 : 0,
          'synced_at': point.syncedAt?.millisecondsSinceEpoch,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  /// Query health data points
  Future<List<AppHealthDataPoint>> queryDataPoints({
    DateTime? startDate,
    DateTime? endDate,
    List<AppHealthDataType>? types,
    List<AppHealthDataSource>? sources,
    int? limit,
    int? offset,
  }) async {
    await _initDatabase();

    String whereClause = '1=1';
    final whereArgs = <dynamic>[];

    if (startDate != null) {
      whereClause += ' AND timestamp >= ?';
      whereArgs.add(startDate.millisecondsSinceEpoch);
    }

    if (endDate != null) {
      whereClause += ' AND timestamp <= ?';
      whereArgs.add(endDate.millisecondsSinceEpoch);
    }

    if (types != null && types.isNotEmpty) {
      final typeNames = types.map((t) => "'${t.name}'").join(',');
      whereClause += ' AND type IN ($typeNames)';
    }

    if (sources != null && sources.isNotEmpty) {
      final sourceNames = sources.map((s) => "'${s.name}'").join(',');
      whereClause += ' AND source IN ($sourceNames)';
    }

    final results = await _database!.query(
      'health_data_points',
      where: whereClause,
      whereArgs: whereArgs.isEmpty ? null : whereArgs,
      orderBy: 'timestamp DESC',
      limit: limit,
      offset: offset,
    );

    return results.map((row) => _rowToDataPoint(row)).toList();
  }

  /// Get aggregated stats for a date
  Future<HealthStats?> getDailyStats(DateTime date) async {
    await _initDatabase();

    final dateStr = _formatDate(date);
    final results = await _database!.query(
      'daily_stats',
      where: 'date = ?',
      whereArgs: [dateStr],
    );

    if (results.isEmpty) return null;

    final row = results.first;
    return HealthStats.fromJson(jsonDecode(row['stats_json'] as String));
  }

  /// Store daily stats
  Future<void> storeDailyStats(HealthStats stats) async {
    await _initDatabase();

    final dateStr = _formatDate(stats.date);
    await _database!.insert(
      'daily_stats',
      {
        'date': dateStr,
        'stats_json': jsonEncode(stats.toJson()),
        'sources': stats.sources?.map((s) => s.name).join(','),
        'last_updated': DateTime.now().millisecondsSinceEpoch,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Get readiness score for a date
  Future<DailyReadinessScore?> getReadinessScore(DateTime date) async {
    await _initDatabase();

    final dateStr = _formatDate(date);
    final results = await _database!.query(
      'readiness_scores',
      where: 'date = ?',
      whereArgs: [dateStr],
    );

    if (results.isEmpty) return null;

    final row = results.first;
    return DailyReadinessScore(
      date: date,
      overallScore: row['overall_score'] as int,
      recommendation: row['recommendation'] as String,
      sleepScore: row['sleep_score'] as int?,
      recoveryScore: row['recovery_score'] as int?,
      activityScore: row['activity_score'] as int?,
      stressScore: row['stress_score'] as int?,
      hrvScore: row['hrv_score'] as int?,
      habitRecommendations: row['habit_recommendations'] != null
          ? (jsonDecode(row['habit_recommendations'] as String) as List)
              .cast<String>()
          : [],
      activityRecommendations: row['activity_recommendations'] != null
          ? (jsonDecode(row['activity_recommendations'] as String) as List)
              .cast<String>()
          : [],
      confidenceLevel: row['confidence_level'] as double? ?? 0.5,
    );
  }

  /// Store readiness score
  Future<void> storeReadinessScore(DailyReadinessScore score) async {
    await _initDatabase();

    final dateStr = _formatDate(score.date);
    await _database!.insert(
      'readiness_scores',
      {
        'date': dateStr,
        'overall_score': score.overallScore,
        'sleep_score': score.sleepScore,
        'recovery_score': score.recoveryScore,
        'activity_score': score.activityScore,
        'stress_score': score.stressScore,
        'hrv_score': score.hrvScore,
        'recommendation': score.recommendation,
        'habit_recommendations': jsonEncode(score.habitRecommendations),
        'activity_recommendations': jsonEncode(score.activityRecommendations),
        'data_sources': score.dataSourcesUsed.map((s) => s.name).join(','),
        'confidence_level': score.confidenceLevel,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Calculate and store readiness score based on available data
  Future<DailyReadinessScore> calculateReadinessScore(DateTime date) async {
    final stats = await getDailyStats(date);
    final previousDayStats =
        await getDailyStats(date.subtract(const Duration(days: 1)));

    int overallScore = 50; // Default baseline
    String recommendation = 'Moderate activity recommended';
    final habitRecommendations = <String>[];
    final activityRecommendations = <String>[];
    final dataSourcesUsed = <AppHealthDataSource>[];
    double confidenceLevel = 0.3;

    int? sleepScore;
    int? recoveryScore;
    int? activityScore;
    int? hrvScore;

    if (stats != null) {
      dataSourcesUsed.addAll(stats.sources ?? []);

      // Calculate sleep score
      if (stats.sleepDurationMinutes != null) {
        final sleepHours = stats.sleepDurationMinutes! / 60;
        if (sleepHours >= 7 && sleepHours <= 9) {
          sleepScore = 90;
        } else if (sleepHours >= 6) {
          sleepScore = 70;
        } else {
          sleepScore = 40;
        }
        confidenceLevel += 0.2;
      }

      // Calculate recovery score from HRV if available
      if (stats.recoveryScore != null) {
        recoveryScore = stats.recoveryScore;
        confidenceLevel += 0.15;
      }

      // Calculate activity score
      if (stats.steps != null) {
        if (stats.steps! >= 10000) {
          activityScore = 100;
        } else if (stats.steps! >= 7500) {
          activityScore = 80;
        } else if (stats.steps! >= 5000) {
          activityScore = 60;
        } else {
          activityScore = 40;
        }
        confidenceLevel += 0.15;
      }

      // Calculate HRV score if available
      if (stats.heartRateVariability != null && previousDayStats != null) {
        final hrvChange = stats.heartRateVariability! -
            (previousDayStats.heartRateVariability ?? 0);
        if (hrvChange > 5) {
          hrvScore = 90;
        } else if (hrvChange > 0) {
          hrvScore = 70;
        } else if (hrvChange > -5) {
          hrvScore = 50;
        } else {
          hrvScore = 30;
        }
        confidenceLevel += 0.15;
      }

      // Calculate overall score
      final scores = [sleepScore, recoveryScore, activityScore, hrvScore]
          .whereType<int>()
          .toList();

      if (scores.isNotEmpty) {
        overallScore = (scores.reduce((a, b) => a + b) / scores.length).round();
      }

      // Generate recommendations
      if (overallScore >= 80) {
        recommendation = "Great day for challenging goals!";
        habitRecommendations.add("Perfect time for your hardest habits");
        activityRecommendations.add("High-intensity workout recommended");
      } else if (overallScore >= 60) {
        recommendation = "Good for moderate activity";
        habitRecommendations.add("Focus on consistent habit completion");
        activityRecommendations.add("Moderate workout or active recovery");
      } else {
        recommendation = "Consider lighter activities today";
        habitRecommendations.add("Prioritize essential habits only");
        activityRecommendations.add("Rest day or light stretching");
      }

      // Sleep-specific recommendations
      if (sleepScore != null && sleepScore < 60) {
        habitRecommendations.add("Earlier bedtime tonight recommended");
      }
    }

    final readinessScore = DailyReadinessScore(
      date: date,
      overallScore: overallScore,
      recommendation: recommendation,
      sleepScore: sleepScore,
      recoveryScore: recoveryScore,
      activityScore: activityScore,
      hrvScore: hrvScore,
      habitRecommendations: habitRecommendations,
      activityRecommendations: activityRecommendations,
      dataSourcesUsed: dataSourcesUsed,
      confidenceLevel: confidenceLevel.clamp(0.0, 1.0),
    );

    await storeReadinessScore(readinessScore);
    return readinessScore;
  }

  /// Sync health data from all connected sources
  Future<void> syncAllSources() async {
    try {
      // Sync from platform health (Apple Health / Health Connect)
      if (await healthService.hasPermissions()) {
        final now = DateTime.now();
        final lastSync = await healthService.getLastSync();
        final startDate = lastSync ?? now.subtract(const Duration(days: 7));

        final dataPoints = await healthService.fetchHealthData(
          startDate: startDate,
          endDate: now,
        );

        await storeDataPoints(dataPoints);

        // Update daily stats
        final todayStats = await healthService.fetchTodayStats();
        await storeDailyStats(todayStats);

        // Calculate readiness score
        await calculateReadinessScore(now);

        await healthService.updateLastSync();

        debugPrint(
          'Synced ${dataPoints.length} data points from ${healthService.platformHealthName}',
        );
      }
    } catch (e) {
      debugPrint('Error syncing health data: $e');
      rethrow;
    }
  }

  /// Delete all health data (for privacy/account deletion)
  Future<void> deleteAllData() async {
    await _initDatabase();

    await _database!.delete('health_data_points');
    await _database!.delete('daily_stats');
    await _database!.delete('readiness_scores');

    debugPrint('All health data deleted');
  }

  /// Delete data older than retention period
  Future<void> cleanupOldData(int retentionDays) async {
    if (retentionDays <= 0) return;

    await _initDatabase();

    final cutoffDate = DateTime.now().subtract(Duration(days: retentionDays));
    final cutoffMs = cutoffDate.millisecondsSinceEpoch;

    await _database!.delete(
      'health_data_points',
      where: 'timestamp < ?',
      whereArgs: [cutoffMs],
    );

    final cutoffDateStr = _formatDate(cutoffDate);
    await _database!.delete(
      'daily_stats',
      where: 'date < ?',
      whereArgs: [cutoffDateStr],
    );

    await _database!.delete(
      'readiness_scores',
      where: 'date < ?',
      whereArgs: [cutoffDateStr],
    );

    debugPrint('Cleaned up data older than $retentionDays days');
  }

  /// Get storage statistics
  Future<Map<String, dynamic>> getStorageStats() async {
    await _initDatabase();

    final dataPointCount = Sqflite.firstIntValue(
      await _database!.rawQuery('SELECT COUNT(*) FROM health_data_points'),
    );

    final dailyStatsCount = Sqflite.firstIntValue(
      await _database!.rawQuery('SELECT COUNT(*) FROM daily_stats'),
    );

    final oldestPoint = await _database!.rawQuery(
      'SELECT MIN(timestamp) as oldest FROM health_data_points',
    );

    final newestPoint = await _database!.rawQuery(
      'SELECT MAX(timestamp) as newest FROM health_data_points',
    );

    return {
      'dataPointCount': dataPointCount ?? 0,
      'dailyStatsCount': dailyStatsCount ?? 0,
      'oldestDataPoint': oldestPoint.first['oldest'] != null
          ? DateTime.fromMillisecondsSinceEpoch(
              oldestPoint.first['oldest'] as int)
          : null,
      'newestDataPoint': newestPoint.first['newest'] != null
          ? DateTime.fromMillisecondsSinceEpoch(
              newestPoint.first['newest'] as int)
          : null,
    };
  }

  /// Save privacy settings
  Future<void> savePrivacySettings(HealthPrivacySettings settings) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_settingsKey, jsonEncode(settings.toJson()));
  }

  /// Load privacy settings
  Future<HealthPrivacySettings> loadPrivacySettings() async {
    final prefs = await SharedPreferences.getInstance();
    final settingsJson = prefs.getString(_settingsKey);

    if (settingsJson != null) {
      return HealthPrivacySettings.fromJson(jsonDecode(settingsJson));
    }

    return const HealthPrivacySettings();
  }

  /// Save integration statuses
  Future<void> saveIntegrations(List<HealthIntegration> integrations) async {
    final prefs = await SharedPreferences.getInstance();
    final integrationsJson =
        integrations.map((i) => jsonEncode(i.toJson())).toList();
    await prefs.setStringList(_integrationsKey, integrationsJson);
  }

  /// Load integration statuses
  Future<List<HealthIntegration>> loadIntegrations() async {
    final prefs = await SharedPreferences.getInstance();
    final integrationsJson = prefs.getStringList(_integrationsKey);

    if (integrationsJson != null) {
      return integrationsJson
          .map((json) => HealthIntegration.fromJson(jsonDecode(json)))
          .toList();
    }

    return HealthIntegrations.all;
  }

  // Helper methods

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  AppHealthDataPoint _rowToDataPoint(Map<String, dynamic> row) {
    return AppHealthDataPoint(
      id: row['id'] as String,
      type: AppHealthDataType.values.firstWhere(
        (t) => t.name == row['type'],
        orElse: () => AppHealthDataType.steps,
      ),
      value: row['value'] as double,
      unit: AppHealthDataUnit.values.firstWhere(
        (u) => u.name == row['unit'],
        orElse: () => AppHealthDataUnit.count,
      ),
      timestamp:
          DateTime.fromMillisecondsSinceEpoch(row['timestamp'] as int),
      dateFrom:
          DateTime.fromMillisecondsSinceEpoch(row['date_from'] as int),
      dateTo: DateTime.fromMillisecondsSinceEpoch(row['date_to'] as int),
      source: AppHealthDataSource.values.firstWhere(
        (s) => s.name == row['source'],
        orElse: () => AppHealthDataSource.unknown,
      ),
      sourceDeviceName: row['source_device_name'] as String?,
      sourceAppName: row['source_app_name'] as String?,
      metadata: row['metadata'] != null
          ? jsonDecode(row['metadata'] as String)
          : null,
      isManualEntry: (row['is_manual_entry'] as int) == 1,
      syncedAt: row['synced_at'] != null
          ? DateTime.fromMillisecondsSinceEpoch(row['synced_at'] as int)
          : null,
    );
  }
}
