import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:health/health.dart';
import 'package:permission_handler/permission_handler.dart';

/// Health data type
enum HealthDataCategory {
  activity,
  workout,
  vitals,
  sleep,
  nutrition,
  mindfulness,
}

/// Workout type
enum WorkoutType {
  running,
  walking,
  cycling,
  swimming,
  yoga,
  strength,
  hiit,
  other,
}

/// Health data point
class HealthDataPoint {
  final HealthDataCategory category;
  final HealthDataType type;
  final dynamic value;
  final String unit;
  final DateTime timestamp;
  final DateTime? endTime;
  final Map<String, dynamic>? metadata;

  const HealthDataPoint({
    required this.category,
    required this.type,
    required this.value,
    required this.unit,
    required this.timestamp,
    this.endTime,
    this.metadata,
  });
}

/// Workout session
class WorkoutSession {
  final String id;
  final WorkoutType type;
  final DateTime startTime;
  final DateTime endTime;
  final int durationMinutes;
  final double? distance;
  final double? calories;
  final double? averageHeartRate;
  final Map<String, dynamic>? metadata;

  const WorkoutSession({
    required this.id,
    required this.type,
    required this.startTime,
    required this.endTime,
    required this.durationMinutes,
    this.distance,
    this.calories,
    this.averageHeartRate,
    this.metadata,
  });
}

/// Sleep session
class SleepSession {
  final DateTime bedTime;
  final DateTime wakeTime;
  final int totalMinutes;
  final int deepSleepMinutes;
  final int lightSleepMinutes;
  final int remSleepMinutes;
  final int awakeMinutes;
  final double quality;

  const SleepSession({
    required this.bedTime,
    required this.wakeTime,
    required this.totalMinutes,
    this.deepSleepMinutes = 0,
    this.lightSleepMinutes = 0,
    this.remSleepMinutes = 0,
    this.awakeMinutes = 0,
    this.quality = 0.0,
  });
}

/// Activity summary
class ActivitySummary {
  final DateTime date;
  final int steps;
  final double distance;
  final double caloriesBurned;
  final int activeMinutes;
  final int floors;
  final double? averageHeartRate;

  const ActivitySummary({
    required this.date,
    required this.steps,
    required this.distance,
    required this.caloriesBurned,
    required this.activeMinutes,
    this.floors = 0,
    this.averageHeartRate,
  });
}

/// Health sync configuration
class HealthSyncConfig {
  final bool syncActivity;
  final bool syncWorkouts;
  final bool syncVitals;
  final bool syncSleep;
  final bool syncNutrition;
  final Duration syncInterval;
  final bool backgroundSync;

  const HealthSyncConfig({
    this.syncActivity = true,
    this.syncWorkouts = true,
    this.syncVitals = true,
    this.syncSleep = true,
    this.syncNutrition = false,
    this.syncInterval = const Duration(hours: 1),
    this.backgroundSync = true,
  });
}

/// Service for syncing health data from platform APIs
class HealthPlatformSync {
  final Health _health;
  final HealthSyncConfig config;

  bool _initialized = false;
  DateTime? _lastSyncTime;
  Timer? _syncTimer;

  final StreamController<HealthDataPoint> _dataStreamController =
      StreamController<HealthDataPoint>.broadcast();
  final StreamController<ActivitySummary> _activityStreamController =
      StreamController<ActivitySummary>.broadcast();
  final StreamController<WorkoutSession> _workoutStreamController =
      StreamController<WorkoutSession>.broadcast();
  final StreamController<SleepSession> _sleepStreamController =
      StreamController<SleepSession>.broadcast();

  HealthPlatformSync({
    Health? health,
    this.config = const HealthSyncConfig(),
  }) : _health = health ?? Health();

  // ============================================================================
  // Initialization & Permissions
  // ============================================================================

  Future<bool> initialize() async {
    if (_initialized) return true;

    try {
      // Request permissions
      final hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        debugPrint('Health permissions not granted');
        return false;
      }

      // Configure platform-specific settings
      await _configurePlatform();

      // Start periodic sync if enabled
      if (config.backgroundSync) {
        _startPeriodicSync();
      }

      _initialized = true;
      debugPrint('HealthPlatformSync initialized');
      return true;
    } catch (e) {
      debugPrint('Error initializing health sync: $e');
      return false;
    }
  }

  Future<void> _configurePlatform() async {
    if (Platform.isIOS) {
      // Configure HealthKit
      debugPrint('Configuring HealthKit');
    } else if (Platform.isAndroid) {
      // Configure Google Fit
      debugPrint('Configuring Google Fit');
    }
  }

  Future<bool> requestPermissions() async {
    try {
      final types = _getRequiredDataTypes();
      final permissions = types.map((type) => HealthDataAccess.READ).toList();

      final granted = await _health.requestAuthorization(types, permissions: permissions);
      
      // Also request platform-specific permissions
      if (Platform.isAndroid) {
        await Permission.activityRecognition.request();
        await Permission.location.request();
      }

      return granted;
    } catch (e) {
      debugPrint('Error requesting health permissions: $e');
      return false;
    }
  }

  List<HealthDataType> _getRequiredDataTypes() {
    final types = <HealthDataType>[];

    if (config.syncActivity) {
      types.addAll([
        HealthDataType.STEPS,
        HealthDataType.DISTANCE_DELTA,
        HealthDataType.ACTIVE_ENERGY_BURNED,
        HealthDataType.MOVE_MINUTES,
        HealthDataType.FLIGHTS_CLIMBED,
      ]);
    }

    if (config.syncVitals) {
      types.addAll([
        HealthDataType.HEART_RATE,
        HealthDataType.RESTING_HEART_RATE,
        HealthDataType.BLOOD_PRESSURE_SYSTOLIC,
        HealthDataType.BLOOD_PRESSURE_DIASTOLIC,
        HealthDataType.BLOOD_OXYGEN,
      ]);
    }

    if (config.syncWorkouts) {
      types.add(HealthDataType.WORKOUT);
    }

    if (config.syncSleep) {
      types.add(HealthDataType.SLEEP_ASLEEP);
    }

    if (config.syncNutrition) {
      types.addAll([
        HealthDataType.WATER,
        HealthDataType.NUTRITION,
      ]);
    }

    return types;
  }

  Future<bool> hasPermissions() async {
    try {
      final types = _getRequiredDataTypes();
      final hasPermissions = await _health.hasPermissions(types);
      return hasPermissions ?? false;
    } catch (e) {
      debugPrint('Error checking permissions: $e');
      return false;
    }
  }

  // ============================================================================
  // Activity Data Synchronization
  // ============================================================================

  Future<ActivitySummary?> getTodaysActivity() async {
    final now = DateTime.now();
    final startOfDay = DateTime(now.year, now.month, now.day);
    
    return await getActivityForDate(startOfDay);
  }

  Future<ActivitySummary?> getActivityForDate(DateTime date) async {
    try {
      final endOfDay = DateTime(date.year, date.month, date.day, 23, 59, 59);

      // Fetch steps
      final steps = await _fetchSum(HealthDataType.STEPS, date, endOfDay);

      // Fetch distance
      final distance = await _fetchSum(HealthDataType.DISTANCE_DELTA, date, endOfDay);

      // Fetch calories
      final calories = await _fetchSum(HealthDataType.ACTIVE_ENERGY_BURNED, date, endOfDay);

      // Fetch active minutes
      final activeMinutes = await _fetchSum(HealthDataType.MOVE_MINUTES, date, endOfDay);

      // Fetch floors
      final floors = await _fetchSum(HealthDataType.FLIGHTS_CLIMBED, date, endOfDay);

      // Fetch average heart rate
      final avgHeartRate = await _fetchAverage(HealthDataType.HEART_RATE, date, endOfDay);

      final summary = ActivitySummary(
        date: date,
        steps: steps.toInt(),
        distance: distance,
        caloriesBurned: calories,
        activeMinutes: activeMinutes.toInt(),
        floors: floors.toInt(),
        averageHeartRate: avgHeartRate,
      );

      _activityStreamController.add(summary);
      return summary;
    } catch (e) {
      debugPrint('Error fetching activity data: $e');
      return null;
    }
  }

  Future<List<ActivitySummary>> getActivityHistory({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    final summaries = <ActivitySummary>[];
    var currentDate = startDate;

    while (currentDate.isBefore(endDate) || currentDate.isAtSameMomentAs(endDate)) {
      final summary = await getActivityForDate(currentDate);
      if (summary != null) {
        summaries.add(summary);
      }
      currentDate = currentDate.add(const Duration(days: 1));
    }

    return summaries;
  }

  // ============================================================================
  // Workout Tracking
  // ============================================================================

  Future<List<WorkoutSession>> getTodaysWorkouts() async {
    final now = DateTime.now();
    final startOfDay = DateTime(now.year, now.month, now.day);
    final endOfDay = DateTime(now.year, now.month, now.day, 23, 59, 59);

    return await getWorkouts(startOfDay, endOfDay);
  }

  Future<List<WorkoutSession>> getWorkouts(DateTime start, DateTime end) async {
    try {
      final workoutData = await _health.getHealthDataFromTypes(
        start,
        end,
        [HealthDataType.WORKOUT],
      );

      final workouts = <WorkoutSession>[];
      
      for (final data in workoutData) {
        final workout = WorkoutSession(
          id: data.uuid,
          type: _mapWorkoutType(data.workoutActivityType),
          startTime: data.dateFrom,
          endTime: data.dateTo,
          durationMinutes: data.dateTo.difference(data.dateFrom).inMinutes,
          distance: data.value as double?,
          calories: null, // Would need separate query
          averageHeartRate: null, // Would need separate query
          metadata: data.metadata,
        );

        workouts.add(workout);
        _workoutStreamController.add(workout);
      }

      return workouts;
    } catch (e) {
      debugPrint('Error fetching workouts: $e');
      return [];
    }
  }

  Future<bool> writeWorkout({
    required WorkoutType type,
    required DateTime startTime,
    required DateTime endTime,
    double? distance,
    double? calories,
  }) async {
    try {
      final success = await _health.writeWorkoutData(
        _mapToHealthWorkoutType(type),
        startTime,
        endTime,
        totalDistance: distance?.toInt(),
        totalEnergyBurned: calories?.toInt(),
      );

      return success;
    } catch (e) {
      debugPrint('Error writing workout: $e');
      return false;
    }
  }

  WorkoutType _mapWorkoutType(HealthWorkoutActivityType? type) {
    if (type == null) return WorkoutType.other;

    switch (type) {
      case HealthWorkoutActivityType.RUNNING:
        return WorkoutType.running;
      case HealthWorkoutActivityType.WALKING:
        return WorkoutType.walking;
      case HealthWorkoutActivityType.CYCLING:
        return WorkoutType.cycling;
      case HealthWorkoutActivityType.SWIMMING:
        return WorkoutType.swimming;
      case HealthWorkoutActivityType.YOGA:
        return WorkoutType.yoga;
      case HealthWorkoutActivityType.STRENGTH_TRAINING:
        return WorkoutType.strength;
      case HealthWorkoutActivityType.HIGH_INTENSITY_INTERVAL_TRAINING:
        return WorkoutType.hiit;
      default:
        return WorkoutType.other;
    }
  }

  HealthWorkoutActivityType _mapToHealthWorkoutType(WorkoutType type) {
    switch (type) {
      case WorkoutType.running:
        return HealthWorkoutActivityType.RUNNING;
      case WorkoutType.walking:
        return HealthWorkoutActivityType.WALKING;
      case WorkoutType.cycling:
        return HealthWorkoutActivityType.CYCLING;
      case WorkoutType.swimming:
        return HealthWorkoutActivityType.SWIMMING;
      case WorkoutType.yoga:
        return HealthWorkoutActivityType.YOGA;
      case WorkoutType.strength:
        return HealthWorkoutActivityType.STRENGTH_TRAINING;
      case WorkoutType.hiit:
        return HealthWorkoutActivityType.HIGH_INTENSITY_INTERVAL_TRAINING;
      case WorkoutType.other:
        return HealthWorkoutActivityType.OTHER;
    }
  }

  // ============================================================================
  // Heart Rate Monitoring
  // ============================================================================

  Future<double?> getCurrentHeartRate() async {
    try {
      final now = DateTime.now();
      final fiveMinutesAgo = now.subtract(const Duration(minutes: 5));

      final heartRateData = await _health.getHealthDataFromTypes(
        fiveMinutesAgo,
        now,
        [HealthDataType.HEART_RATE],
      );

      if (heartRateData.isEmpty) return null;

      // Get most recent reading
      final latestReading = heartRateData.last;
      return latestReading.value as double?;
    } catch (e) {
      debugPrint('Error fetching heart rate: $e');
      return null;
    }
  }

  Future<double?> getRestingHeartRate() async {
    try {
      final now = DateTime.now();
      final yesterday = now.subtract(const Duration(days: 1));

      final data = await _health.getHealthDataFromTypes(
        yesterday,
        now,
        [HealthDataType.RESTING_HEART_RATE],
      );

      if (data.isEmpty) return null;

      return data.last.value as double?;
    } catch (e) {
      debugPrint('Error fetching resting heart rate: $e');
      return null;
    }
  }

  // ============================================================================
  // Sleep Tracking
  // ============================================================================

  Future<SleepSession?> getLastNightSleep() async {
    try {
      final now = DateTime.now();
      final yesterday = now.subtract(const Duration(days: 1));

      final sleepData = await _health.getHealthDataFromTypes(
        yesterday,
        now,
        [HealthDataType.SLEEP_ASLEEP],
      );

      if (sleepData.isEmpty) return null;

      // Aggregate sleep data
      DateTime? bedTime;
      DateTime? wakeTime;
      int totalMinutes = 0;

      for (final data in sleepData) {
        if (bedTime == null || data.dateFrom.isBefore(bedTime)) {
          bedTime = data.dateFrom;
        }
        if (wakeTime == null || data.dateTo.isAfter(wakeTime)) {
          wakeTime = data.dateTo;
        }
        totalMinutes += data.dateTo.difference(data.dateFrom).inMinutes;
      }

      if (bedTime == null || wakeTime == null) return null;

      final session = SleepSession(
        bedTime: bedTime,
        wakeTime: wakeTime,
        totalMinutes: totalMinutes,
        quality: _calculateSleepQuality(totalMinutes),
      );

      _sleepStreamController.add(session);
      return session;
    } catch (e) {
      debugPrint('Error fetching sleep data: $e');
      return null;
    }
  }

  double _calculateSleepQuality(int totalMinutes) {
    // Simple quality calculation based on duration
    // Optimal sleep is 7-9 hours
    if (totalMinutes >= 420 && totalMinutes <= 540) {
      return 1.0;
    } else if (totalMinutes < 420) {
      return (totalMinutes / 420).clamp(0.0, 1.0);
    } else {
      return (540 / totalMinutes).clamp(0.0, 1.0);
    }
  }

  // ============================================================================
  // Data Aggregation Helpers
  // ============================================================================

  Future<double> _fetchSum(HealthDataType type, DateTime start, DateTime end) async {
    try {
      final data = await _health.getHealthDataFromTypes(start, end, [type]);
      return data.fold(0.0, (sum, point) => sum + (point.value as num).toDouble());
    } catch (e) {
      debugPrint('Error fetching sum for $type: $e');
      return 0.0;
    }
  }

  Future<double?> _fetchAverage(HealthDataType type, DateTime start, DateTime end) async {
    try {
      final data = await _health.getHealthDataFromTypes(start, end, [type]);
      if (data.isEmpty) return null;

      final sum = data.fold(0.0, (sum, point) => sum + (point.value as num).toDouble());
      return sum / data.length;
    } catch (e) {
      debugPrint('Error fetching average for $type: $e');
      return null;
    }
  }

  // ============================================================================
  // Periodic Sync
  // ============================================================================

  void _startPeriodicSync() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(config.syncInterval, (_) => syncAll());
  }

  void stopPeriodicSync() {
    _syncTimer?.cancel();
    _syncTimer = null;
  }

  Future<void> syncAll() async {
    try {
      if (!_initialized) {
        await initialize();
      }

      if (config.syncActivity) {
        await getTodaysActivity();
      }

      if (config.syncWorkouts) {
        await getTodaysWorkouts();
      }

      if (config.syncSleep) {
        await getLastNightSleep();
      }

      _lastSyncTime = DateTime.now();
      debugPrint('Health data sync completed');
    } catch (e) {
      debugPrint('Error during health sync: $e');
    }
  }

  // ============================================================================
  // Streams
  // ============================================================================

  Stream<HealthDataPoint> get dataStream => _dataStreamController.stream;
  Stream<ActivitySummary> get activityStream => _activityStreamController.stream;
  Stream<WorkoutSession> get workoutStream => _workoutStreamController.stream;
  Stream<SleepSession> get sleepStream => _sleepStreamController.stream;

  // ============================================================================
  // State
  // ============================================================================

  bool get isInitialized => _initialized;
  DateTime? get lastSyncTime => _lastSyncTime;

  // ============================================================================
  // Cleanup
  // ============================================================================

  void dispose() {
    _syncTimer?.cancel();
    _dataStreamController.close();
    _activityStreamController.close();
    _workoutStreamController.close();
    _sleepStreamController.close();
  }
}
