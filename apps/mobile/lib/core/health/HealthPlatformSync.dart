import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:health/health.dart';
import 'package:permission_handler/permission_handler.dart';

/// Health data type
enum HealthDataType {
  steps,
  heartRate,
  activeEnergyBurned,
  sleepInBed,
  sleepAsleep,
  workoutMinutes,
  distance,
  weight,
}

/// Health platform
enum HealthPlatform {
  healthKit, // iOS
  googleFit, // Android
  unknown,
}

/// Health data point
class HealthDataPoint {
  final HealthDataType type;
  final double value;
  final DateTime dateFrom;
  final DateTime dateTo;
  final String unit;
  final HealthPlatform platform;

  const HealthDataPoint({
    required this.type,
    required this.value,
    required this.dateFrom,
    required this.dateTo,
    required this.unit,
    required this.platform,
  });

  Map<String, dynamic> toJson() {
    return {
      'type': type.name,
      'value': value,
      'dateFrom': dateFrom.toIso8601String(),
      'dateTo': dateTo.toIso8601String(),
      'unit': unit,
      'platform': platform.name,
    };
  }
}

/// Sync configuration
class HealthSyncConfig {
  final bool autoSync;
  final Duration syncInterval;
  final List<HealthDataType> enabledTypes;

  const HealthSyncConfig({
    this.autoSync = true,
    this.syncInterval = const Duration(hours: 1),
    this.enabledTypes = const [
      HealthDataType.steps,
      HealthDataType.heartRate,
      HealthDataType.activeEnergyBurned,
      HealthDataType.sleepInBed,
    ],
  });
}

/// Service for syncing health data from HealthKit (iOS) and Google Fit (Android)
class HealthPlatformSync {
  final Health _health;
  final HealthSyncConfig config;

  Timer? _syncTimer;
  bool _isInitialized = false;
  HealthPlatform _platform = HealthPlatform.unknown;

  final StreamController<HealthDataPoint> _dataStreamController =
      StreamController<HealthDataPoint>.broadcast();

  HealthPlatformSync({
    Health? health,
    this.config = const HealthSyncConfig(),
  }) : _health = health ?? Health();

  // ============================================================================
  // Getters
  // ============================================================================

  bool get isInitialized => _isInitialized;
  HealthPlatform get platform => _platform;
  Stream<HealthDataPoint> get onDataReceived => _dataStreamController.stream;

  // ============================================================================
  // Initialization
  // ============================================================================

  Future<bool> initialize() async {
    if (_isInitialized) return true;

    try {
      _platform = _detectPlatform();

      // Request permissions
      final hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        debugPrint('Health permissions not granted');
        return false;
      }

      _isInitialized = true;

      // Start auto-sync if enabled
      if (config.autoSync) {
        startAutoSync();
      }

      debugPrint('HealthPlatformSync initialized for ${_platform.name}');
      return true;
    } catch (e) {
      debugPrint('Error initializing HealthPlatformSync: $e');
      return false;
    }
  }

  HealthPlatform _detectPlatform() {
    if (Platform.isIOS) {
      return HealthPlatform.healthKit;
    } else if (Platform.isAndroid) {
      return HealthPlatform.googleFit;
    }
    return HealthPlatform.unknown;
  }

  // ============================================================================
  // Permissions
  // ============================================================================

  Future<bool> requestPermissions() async {
    try {
      // Map our types to Health plugin types
      final types = config.enabledTypes.map(_mapToHealthType).toList();

      final permissions = types.map((type) => HealthDataAccess.READ).toList();

      final granted = await _health.requestAuthorization(types, permissions: permissions);

      debugPrint('Health permissions granted: $granted');
      return granted;
    } catch (e) {
      debugPrint('Error requesting health permissions: $e');
      return false;
    }
  }

  Future<bool> hasPermissions() async {
    try {
      final types = config.enabledTypes.map(_mapToHealthType).toList();
      return await _health.hasPermissions(types) ?? false;
    } catch (e) {
      debugPrint('Error checking health permissions: $e');
      return false;
    }
  }

  HealthDataType _mapToHealthType(HealthDataType type) {
    // This maps to the Health plugin's HealthDataType
    switch (type) {
      case HealthDataType.steps:
        return HealthDataType.steps;
      case HealthDataType.heartRate:
        return HealthDataType.heartRate;
      case HealthDataType.activeEnergyBurned:
        return HealthDataType.activeEnergyBurned;
      case HealthDataType.sleepInBed:
        return HealthDataType.sleepInBed;
      case HealthDataType.sleepAsleep:
        return HealthDataType.sleepAsleep;
      case HealthDataType.workoutMinutes:
        return HealthDataType.workoutMinutes;
      case HealthDataType.distance:
        return HealthDataType.distance;
      case HealthDataType.weight:
        return HealthDataType.weight;
    }
  }

  // ============================================================================
  // Data Sync
  // ============================================================================

  Future<List<HealthDataPoint>> syncHealthData({
    DateTime? startDate,
    DateTime? endDate,
    List<HealthDataType>? types,
  }) async {
    if (!_isInitialized) {
      throw StateError('HealthPlatformSync not initialized');
    }

    final start = startDate ?? DateTime.now().subtract(const Duration(days: 1));
    final end = endDate ?? DateTime.now();
    final dataTypes = types ?? config.enabledTypes;

    final allDataPoints = <HealthDataPoint>[];

    for (final type in dataTypes) {
      final dataPoints = await _fetchDataForType(type, start, end);
      allDataPoints.addAll(dataPoints);

      // Emit data points to stream
      for (final point in dataPoints) {
        _dataStreamController.add(point);
      }
    }

    debugPrint('Synced ${allDataPoints.length} health data points');
    return allDataPoints;
  }

  Future<List<HealthDataPoint>> _fetchDataForType(
    HealthDataType type,
    DateTime start,
    DateTime end,
  ) async {
    try {
      final healthType = _mapToHealthType(type);
      final healthDataPoints = await _health.getHealthDataFromTypes(
        start,
        end,
        [healthType],
      );

      return healthDataPoints.map((point) {
        return HealthDataPoint(
          type: type,
          value: point.value.toDouble(),
          dateFrom: point.dateFrom,
          dateTo: point.dateTo,
          unit: point.unit.name,
          platform: _platform,
        );
      }).toList();
    } catch (e) {
      debugPrint('Error fetching data for $type: $e');
      return [];
    }
  }

  // ============================================================================
  // Specific Data Queries
  // ============================================================================

  Future<int> getTodaySteps() async {
    final today = DateTime.now();
    final midnight = DateTime(today.year, today.month, today.day);

    final dataPoints = await _fetchDataForType(
      HealthDataType.steps,
      midnight,
      today,
    );

    return dataPoints.fold<int>(
      0,
      (sum, point) => sum + point.value.toInt(),
    );
  }

  Future<double> getTodayActiveCalories() async {
    final today = DateTime.now();
    final midnight = DateTime(today.year, today.month, today.day);

    final dataPoints = await _fetchDataForType(
      HealthDataType.activeEnergyBurned,
      midnight,
      today,
    );

    return dataPoints.fold<double>(
      0.0,
      (sum, point) => sum + point.value,
    );
  }

  Future<double> getAverageHeartRate({Duration period = const Duration(hours: 24)}) async {
    final end = DateTime.now();
    final start = end.subtract(period);

    final dataPoints = await _fetchDataForType(
      HealthDataType.heartRate,
      start,
      end,
    );

    if (dataPoints.isEmpty) return 0.0;

    final sum = dataPoints.fold<double>(
      0.0,
      (sum, point) => sum + point.value,
    );

    return sum / dataPoints.length;
  }

  Future<Duration> getSleepDuration({DateTime? date}) async {
    final targetDate = date ?? DateTime.now();
    final midnight = DateTime(targetDate.year, targetDate.month, targetDate.day);
    final nextMidnight = midnight.add(const Duration(days: 1));

    final dataPoints = await _fetchDataForType(
      HealthDataType.sleepAsleep,
      midnight,
      nextMidnight,
    );

    final totalMinutes = dataPoints.fold<int>(
      0,
      (sum, point) => sum + point.value.toInt(),
    );

    return Duration(minutes: totalMinutes);
  }

  Future<double> getWeeklyDistance() async {
    final end = DateTime.now();
    final start = end.subtract(const Duration(days: 7));

    final dataPoints = await _fetchDataForType(
      HealthDataType.distance,
      start,
      end,
    );

    return dataPoints.fold<double>(
      0.0,
      (sum, point) => sum + point.value,
    );
  }

  // ============================================================================
  // Auto Sync
  // ============================================================================

  void startAutoSync() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(config.syncInterval, (_) {
      syncHealthData();
    });
    debugPrint('Auto-sync started with interval: ${config.syncInterval}');
  }

  void stopAutoSync() {
    _syncTimer?.cancel();
    _syncTimer = null;
    debugPrint('Auto-sync stopped');
  }

  // ============================================================================
  // Background Sync
  // ============================================================================

  Future<void> enableBackgroundSync() async {
    if (Platform.isIOS) {
      // iOS: Configure HealthKit background delivery
      // This would typically be done through platform channels
      debugPrint('Enabling HealthKit background delivery');
    } else if (Platform.isAndroid) {
      // Android: Configure Google Fit background sync
      // This would typically be done through platform channels
      debugPrint('Enabling Google Fit background sync');
    }
  }

  Future<void> disableBackgroundSync() async {
    if (Platform.isIOS) {
      debugPrint('Disabling HealthKit background delivery');
    } else if (Platform.isAndroid) {
      debugPrint('Disabling Google Fit background sync');
    }
  }

  // ============================================================================
  // Write Data (if needed)
  // ============================================================================

  Future<bool> writeSteps(int steps, DateTime dateTime) async {
    try {
      final success = await _health.writeHealthData(
        steps.toDouble(),
        HealthDataType.steps as HealthDataType,
        dateTime,
        dateTime,
      );

      debugPrint('Write steps success: $success');
      return success;
    } catch (e) {
      debugPrint('Error writing steps: $e');
      return false;
    }
  }

  Future<bool> writeWorkout({
    required DateTime startTime,
    required DateTime endTime,
    required int totalEnergyBurned,
    required double totalDistance,
  }) async {
    try {
      final success = await _health.writeWorkoutData(
        HealthWorkoutActivityType.WALKING,
        startTime,
        endTime,
        totalEnergyBurned: totalEnergyBurned,
        totalDistance: totalDistance.toInt(),
      );

      debugPrint('Write workout success: $success');
      return success;
    } catch (e) {
      debugPrint('Error writing workout: $e');
      return false;
    }
  }

  // ============================================================================
  // Data Aggregation
  // ============================================================================

  Future<Map<DateTime, double>> getAggregatedStepsByDay({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    final dataPoints = await _fetchDataForType(
      HealthDataType.steps,
      startDate,
      endDate,
    );

    final aggregated = <DateTime, double>{};

    for (final point in dataPoints) {
      final day = DateTime(
        point.dateFrom.year,
        point.dateFrom.month,
        point.dateFrom.day,
      );

      aggregated[day] = (aggregated[day] ?? 0.0) + point.value;
    }

    return aggregated;
  }

  Future<Map<String, dynamic>> getHealthSummary({DateTime? date}) async {
    final targetDate = date ?? DateTime.now();
    final midnight = DateTime(targetDate.year, targetDate.month, targetDate.day);

    final steps = await getTodaySteps();
    final calories = await getTodayActiveCalories();
    final heartRate = await getAverageHeartRate(period: const Duration(hours: 24));
    final sleep = await getSleepDuration(date: targetDate);

    return {
      'date': targetDate.toIso8601String(),
      'steps': steps,
      'activeCalories': calories,
      'averageHeartRate': heartRate,
      'sleepDuration': sleep.inMinutes,
      'platform': _platform.name,
    };
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  void dispose() {
    _syncTimer?.cancel();
    _dataStreamController.close();
  }
}
