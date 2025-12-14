import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:health/health.dart' as health_pkg;
import 'package:shared_preferences/shared_preferences.dart';

import '../models/health_data_point.dart';

/// Provider for the HealthService singleton
final healthServiceProvider = Provider<HealthService>((ref) {
  return HealthService();
});

/// Service for interacting with Apple Health (iOS) and Google Health Connect (Android)
class HealthService {
  static final HealthService _instance = HealthService._internal();
  factory HealthService() => _instance;
  HealthService._internal();

  final health_pkg.Health _health = health_pkg.Health();
  bool _isInitialized = false;
  bool _hasPermissions = false;

  // Storage keys
  static const String _permissionGrantedKey = 'health_permission_granted';
  static const String _lastSyncKey = 'health_last_sync';

  /// All health data types we want to read
  static const List<health_pkg.HealthDataType> _allReadTypes = [
    // Activity
    health_pkg.HealthDataType.STEPS,
    health_pkg.HealthDataType.ACTIVE_ENERGY_BURNED,
    health_pkg.HealthDataType.DISTANCE_WALKING_RUNNING,
    health_pkg.HealthDataType.FLIGHTS_CLIMBED,
    health_pkg.HealthDataType.WORKOUT,

    // Heart
    health_pkg.HealthDataType.HEART_RATE,
    health_pkg.HealthDataType.RESTING_HEART_RATE,
    health_pkg.HealthDataType.HEART_RATE_VARIABILITY_SDNN,

    // Sleep
    health_pkg.HealthDataType.SLEEP_ASLEEP,
    health_pkg.HealthDataType.SLEEP_AWAKE,
    health_pkg.HealthDataType.SLEEP_DEEP,
    health_pkg.HealthDataType.SLEEP_REM,
    health_pkg.HealthDataType.SLEEP_LIGHT,
    health_pkg.HealthDataType.SLEEP_SESSION,

    // Body
    health_pkg.HealthDataType.WEIGHT,
    health_pkg.HealthDataType.BODY_MASS_INDEX,
    health_pkg.HealthDataType.BODY_FAT_PERCENTAGE,
    health_pkg.HealthDataType.HEIGHT,

    // Vitals
    health_pkg.HealthDataType.BLOOD_PRESSURE_SYSTOLIC,
    health_pkg.HealthDataType.BLOOD_PRESSURE_DIASTOLIC,
    health_pkg.HealthDataType.BLOOD_OXYGEN,
    health_pkg.HealthDataType.RESPIRATORY_RATE,
    health_pkg.HealthDataType.BODY_TEMPERATURE,

    // Nutrition
    health_pkg.HealthDataType.DIETARY_ENERGY_CONSUMED,
    health_pkg.HealthDataType.DIETARY_PROTEIN_CONSUMED,
    health_pkg.HealthDataType.DIETARY_CARBS_CONSUMED,
    health_pkg.HealthDataType.DIETARY_FATS_CONSUMED,
    health_pkg.HealthDataType.WATER,

    // Mindfulness
    health_pkg.HealthDataType.MINDFULNESS,
  ];

  /// Initialize the health service
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // Configure Health API
      await _health.configure();
      _isInitialized = true;

      // Check if we have stored permission
      final prefs = await SharedPreferences.getInstance();
      _hasPermissions = prefs.getBool(_permissionGrantedKey) ?? false;

      debugPrint(
          'HealthService initialized. Has permissions: $_hasPermissions');
    } catch (e) {
      debugPrint('Error initializing HealthService: $e');
      rethrow;
    }
  }

  /// Check if Health API is available on this device
  Future<bool> isHealthAvailable() async {
    if (Platform.isIOS) {
      return true; // HealthKit is always available on iOS
    } else if (Platform.isAndroid) {
      // Check if Health Connect is installed
      final status = await _health.getHealthConnectSdkStatus();
      return status == health_pkg.HealthConnectSdkStatus.sdkAvailable;
    }
    return false;
  }

  /// Get the platform-specific health service name
  String get platformHealthName {
    if (Platform.isIOS) return 'Apple Health';
    if (Platform.isAndroid) return 'Health Connect';
    return 'Health Service';
  }

  /// Get the health data source for the current platform
  AppHealthDataSource get platformSource {
    if (Platform.isIOS) return AppHealthDataSource.appleHealth;
    if (Platform.isAndroid) return AppHealthDataSource.googleHealthConnect;
    return AppHealthDataSource.unknown;
  }

  /// Request permission to access health data
  Future<bool> requestPermissions(
      {List<health_pkg.HealthDataType>? types}) async {
    try {
      final typesToRequest = types ?? _allReadTypes;

      // Request authorization
      final authorized = await _health.requestAuthorization(
        typesToRequest,
        permissions:
            typesToRequest.map((_) => health_pkg.HealthDataAccess.READ).toList(),
      );

      if (authorized) {
        // Store that we have permissions
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool(_permissionGrantedKey, true);
        _hasPermissions = true;
      }

      return authorized;
    } catch (e) {
      debugPrint('Error requesting health permissions: $e');
      return false;
    }
  }

  /// Check if we have permissions for health data
  Future<bool> hasPermissions() async {
    if (!_hasPermissions) {
      final prefs = await SharedPreferences.getInstance();
      _hasPermissions = prefs.getBool(_permissionGrantedKey) ?? false;
    }
    return _hasPermissions;
  }

  /// Revoke all health permissions (disconnect)
  Future<void> revokePermissions() async {
    try {
      await _health.revokePermissions();
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_permissionGrantedKey, false);
      _hasPermissions = false;
    } catch (e) {
      debugPrint('Error revoking health permissions: $e');
    }
  }

  /// Fetch health data for a date range
  Future<List<AppHealthDataPoint>> fetchHealthData({
    required DateTime startDate,
    required DateTime endDate,
    List<health_pkg.HealthDataType>? types,
  }) async {
    if (!_hasPermissions) {
      throw Exception('Health permissions not granted');
    }

    try {
      final typesToFetch = types ?? _allReadTypes;
      final healthData = await _health.getHealthDataFromTypes(
        types: typesToFetch,
        startTime: startDate,
        endTime: endDate,
      );

      // Convert to our model
      return healthData.map((point) => _convertHealthDataPoint(point)).toList();
    } catch (e) {
      debugPrint('Error fetching health data: $e');
      rethrow;
    }
  }

  /// Fetch today's health summary
  Future<HealthStats> fetchTodayStats() async {
    final now = DateTime.now();
    final startOfDay = DateTime(now.year, now.month, now.day);
    final endOfDay = startOfDay.add(const Duration(days: 1));

    return fetchStatsForDateRange(startDate: startOfDay, endDate: endOfDay);
  }

  /// Fetch health stats for a date range
  Future<HealthStats> fetchStatsForDateRange({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    if (!_hasPermissions) {
      throw Exception('Health permissions not granted');
    }

    try {
      // Fetch aggregated data
      final steps = await _health.getTotalStepsInInterval(startDate, endDate);

      // Fetch individual data points for averaging
      final dataPoints = await fetchHealthData(
        startDate: startDate,
        endDate: endDate,
      );

      // Calculate averages and totals
      final heartRates = dataPoints
          .where((p) => p.type == AppHealthDataType.heartRate)
          .map((p) => p.value)
          .toList();

      final sleepData = dataPoints
          .where((p) =>
              p.type == AppHealthDataType.sleepAsleep ||
              p.type == AppHealthDataType.sleepDeep ||
              p.type == AppHealthDataType.sleepREM ||
              p.type == AppHealthDataType.sleepLight)
          .toList();

      double? avgHeartRate;
      if (heartRates.isNotEmpty) {
        avgHeartRate = heartRates.reduce((a, b) => a + b) / heartRates.length;
      }

      int? totalSleepMinutes;
      int? deepSleepMinutes;
      int? remSleepMinutes;
      int? lightSleepMinutes;

      for (final sleep in sleepData) {
        final minutes = sleep.dateTo.difference(sleep.dateFrom).inMinutes;
        totalSleepMinutes = (totalSleepMinutes ?? 0) + minutes;

        switch (sleep.type) {
          case AppHealthDataType.sleepDeep:
            deepSleepMinutes = (deepSleepMinutes ?? 0) + minutes;
          case AppHealthDataType.sleepREM:
            remSleepMinutes = (remSleepMinutes ?? 0) + minutes;
          case AppHealthDataType.sleepLight:
            lightSleepMinutes = (lightSleepMinutes ?? 0) + minutes;
          default:
            break;
        }
      }

      // Get latest weight
      final weightData = dataPoints
          .where((p) => p.type == AppHealthDataType.weight)
          .toList();
      double? weight;
      if (weightData.isNotEmpty) {
        weight = weightData.last.value;
      }

      return HealthStats(
        date: startDate,
        period: endDate.difference(startDate),
        steps: steps,
        averageHeartRate: avgHeartRate,
        sleepDurationMinutes: totalSleepMinutes,
        deepSleepMinutes: deepSleepMinutes,
        remSleepMinutes: remSleepMinutes,
        lightSleepMinutes: lightSleepMinutes,
        weight: weight,
        sources: [platformSource],
        lastSyncedAt: DateTime.now(),
      );
    } catch (e) {
      debugPrint('Error fetching health stats: $e');
      rethrow;
    }
  }

  /// Fetch health stats for the past N days
  Future<List<HealthStats>> fetchStatsForPastDays(int days) async {
    final stats = <HealthStats>[];
    final now = DateTime.now();

    for (int i = 0; i < days; i++) {
      final date = now.subtract(Duration(days: i));
      final startOfDay = DateTime(date.year, date.month, date.day);
      final endOfDay = startOfDay.add(const Duration(days: 1));

      try {
        final dayStats = await fetchStatsForDateRange(
          startDate: startOfDay,
          endDate: endOfDay,
        );
        stats.add(dayStats);
      } catch (e) {
        debugPrint('Error fetching stats for day $i: $e');
      }
    }

    return stats;
  }

  /// Update last sync timestamp
  Future<void> updateLastSync() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_lastSyncKey, DateTime.now().toIso8601String());
  }

  /// Get last sync timestamp
  Future<DateTime?> getLastSync() async {
    final prefs = await SharedPreferences.getInstance();
    final lastSyncStr = prefs.getString(_lastSyncKey);
    if (lastSyncStr != null) {
      return DateTime.parse(lastSyncStr);
    }
    return null;
  }

  /// Convert platform HealthDataPoint to our model
  AppHealthDataPoint _convertHealthDataPoint(
      health_pkg.HealthDataPoint platformPoint) {
    return AppHealthDataPoint(
      id: platformPoint.uuid,
      type: _mapHealthDataType(platformPoint.type),
      value: platformPoint.value is health_pkg.NumericHealthValue
          ? (platformPoint.value as health_pkg.NumericHealthValue)
              .numericValue
              .toDouble()
          : 0,
      unit: _mapHealthDataUnit(platformPoint.unit),
      timestamp: platformPoint.dateFrom,
      dateFrom: platformPoint.dateFrom,
      dateTo: platformPoint.dateTo,
      source: platformSource,
      sourceDeviceName: platformPoint.sourceId,
      sourceAppName: platformPoint.sourceName,
      syncedAt: DateTime.now(),
    );
  }

  /// Map platform HealthDataType to our enum
  AppHealthDataType _mapHealthDataType(health_pkg.HealthDataType platformType) {
    switch (platformType) {
      case health_pkg.HealthDataType.STEPS:
        return AppHealthDataType.steps;
      case health_pkg.HealthDataType.ACTIVE_ENERGY_BURNED:
        return AppHealthDataType.activeEnergyBurned;
      case health_pkg.HealthDataType.DISTANCE_WALKING_RUNNING:
        return AppHealthDataType.distanceWalkingRunning;
      case health_pkg.HealthDataType.FLIGHTS_CLIMBED:
        return AppHealthDataType.flightsClimbed;
      case health_pkg.HealthDataType.HEART_RATE:
        return AppHealthDataType.heartRate;
      case health_pkg.HealthDataType.RESTING_HEART_RATE:
        return AppHealthDataType.restingHeartRate;
      case health_pkg.HealthDataType.HEART_RATE_VARIABILITY_SDNN:
        return AppHealthDataType.heartRateVariability;
      case health_pkg.HealthDataType.SLEEP_ASLEEP:
        return AppHealthDataType.sleepAsleep;
      case health_pkg.HealthDataType.SLEEP_AWAKE:
        return AppHealthDataType.sleepAwake;
      case health_pkg.HealthDataType.SLEEP_DEEP:
        return AppHealthDataType.sleepDeep;
      case health_pkg.HealthDataType.SLEEP_REM:
        return AppHealthDataType.sleepREM;
      case health_pkg.HealthDataType.SLEEP_LIGHT:
        return AppHealthDataType.sleepLight;
      case health_pkg.HealthDataType.WEIGHT:
        return AppHealthDataType.weight;
      case health_pkg.HealthDataType.BODY_MASS_INDEX:
        return AppHealthDataType.bodyMassIndex;
      case health_pkg.HealthDataType.BODY_FAT_PERCENTAGE:
        return AppHealthDataType.bodyFatPercentage;
      case health_pkg.HealthDataType.BLOOD_PRESSURE_SYSTOLIC:
        return AppHealthDataType.bloodPressureSystolic;
      case health_pkg.HealthDataType.BLOOD_PRESSURE_DIASTOLIC:
        return AppHealthDataType.bloodPressureDiastolic;
      case health_pkg.HealthDataType.BLOOD_OXYGEN:
        return AppHealthDataType.bloodOxygen;
      case health_pkg.HealthDataType.MINDFULNESS:
        return AppHealthDataType.mindfulMinutes;
      default:
        return AppHealthDataType.steps; // Default fallback
    }
  }

  /// Map platform HealthDataUnit to our enum
  AppHealthDataUnit _mapHealthDataUnit(health_pkg.HealthDataUnit platformUnit) {
    switch (platformUnit) {
      case health_pkg.HealthDataUnit.COUNT:
        return AppHealthDataUnit.count;
      case health_pkg.HealthDataUnit.KILOCALORIE:
        return AppHealthDataUnit.kilocalorie;
      case health_pkg.HealthDataUnit.METER:
        return AppHealthDataUnit.meter;
      case health_pkg.HealthDataUnit.KILOGRAM:
        return AppHealthDataUnit.kilogram;
      case health_pkg.HealthDataUnit.PERCENT:
        return AppHealthDataUnit.percent;
      case health_pkg.HealthDataUnit.BEATS_PER_MINUTE:
        return AppHealthDataUnit.beatsPerMinute;
      case health_pkg.HealthDataUnit.MILLISECOND:
        return AppHealthDataUnit.millisecond;
      case health_pkg.HealthDataUnit.MINUTE:
        return AppHealthDataUnit.minute;
      case health_pkg.HealthDataUnit.LITER:
        return AppHealthDataUnit.liter;
      case health_pkg.HealthDataUnit.GRAM:
        return AppHealthDataUnit.gram;
      case health_pkg.HealthDataUnit.DEGREE_CELSIUS:
        return AppHealthDataUnit.celsius;
      default:
        return AppHealthDataUnit.noUnit;
    }
  }
}
