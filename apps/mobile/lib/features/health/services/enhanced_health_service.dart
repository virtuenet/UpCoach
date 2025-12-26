import 'package:health/health.dart';

/// Enhanced Health Integration Service (Phase 10)
///
/// Deep integration with Apple Health and Google Health Connect
///
/// New Metrics:
/// - Sleep data correlation (sleep quality → mood/productivity)
/// - Heart Rate Variability (HRV) stress detection
/// - Mindful minutes tracking
/// - Nutrition (calories, macros)
/// - Workout routes (GPS-tracked exercise)
///
/// Bi-directional Sync:
/// - Read health data from Health apps
/// - Write habit completion data back to Health apps
class EnhancedHealthService {
  static final EnhancedHealthService _instance = EnhancedHealthService._internal();
  factory EnhancedHealthService() => _instance;
  EnhancedHealthService._internal();

  final Health _health = Health();
  bool _isAuthorized = false;

  /// Health data types to request permission for
  static final List<HealthDataType> _readTypes = [
    // Sleep
    HealthDataType.SLEEP_ASLEEP,
    HealthDataType.SLEEP_AWAKE,
    HealthDataType.SLEEP_DEEP,
    HealthDataType.SLEEP_REM,
    
    // Heart
    HealthDataType.HEART_RATE,
    HealthDataType.HEART_RATE_VARIABILITY_SDNN,
    
    // Activity
    HealthDataType.STEPS,
    HealthDataType.ACTIVE_ENERGY_BURNED,
    HealthDataType.WORKOUT,
    
    // Mindfulness
    HealthDataType.MINDFULNESS,
    
    // Nutrition
    HealthDataType.NUTRITION,
    HealthDataType.WATER,
  ];

  static final List<HealthDataType> _writeTypes = [
    HealthDataType.MINDFULNESS,
    HealthDataType.WATER,
    HealthDataType.NUTRITION,
  ];

  /// Initialize and request health permissions
  Future<bool> initialize() async {
    print('Initializing Enhanced Health Service...');

    try {
      _isAuthorized = await _health.requestAuthorization(
        _readTypes,
        permissions: _writeTypes,
      );

      if (_isAuthorized) {
        print('✅ Health permissions granted');
        print('   Read: ${_readTypes.length} types');
        print('   Write: ${_writeTypes.length} types');
      } else {
        print('⚠️  Health permissions denied');
      }

      return _isAuthorized;
    } catch (e) {
      print('❌ Failed to initialize health service: $e');
      return false;
    }
  }

  /// Analyze sleep quality and correlate with mood/productivity
  Future<SleepAnalysis?> analyzeSleepQuality(DateTime date) async {
    if (!_isAuthorized) {
      print('⚠️  Health not authorized');
      return null;
    }

    final midnight = DateTime(date.year, date.month, date.day);
    final nextMidnight = midnight.add(const Duration(days: 1));

    try {
      final sleepData = await _health.getHealthDataFromTypes(
        midnight.subtract(const Duration(hours: 12)), // Include evening sleep
        nextMidnight,
        [
          HealthDataType.SLEEP_ASLEEP,
          HealthDataType.SLEEP_DEEP,
          HealthDataType.SLEEP_REM,
        ],
      );

      if (sleepData.isEmpty) {
        return null;
      }

      // Calculate sleep metrics
      int totalMinutes = 0;
      int deepSleepMinutes = 0;
      int remSleepMinutes = 0;

      for (var data in sleepData) {
        final duration = data.dateTo.difference(data.dateFrom).inMinutes;

        if (data.type == HealthDataType.SLEEP_ASLEEP) {
          totalMinutes += duration;
        } else if (data.type == HealthDataType.SLEEP_DEEP) {
          deepSleepMinutes += duration;
        } else if (data.type == HealthDataType.SLEEP_REM) {
          remSleepMinutes += duration;
        }
      }

      // Calculate sleep quality score (0-100)
      final sleepQualityScore = _calculateSleepQuality(
        totalMinutes,
        deepSleepMinutes,
        remSleepMinutes,
      );

      return SleepAnalysis(
        date: date,
        totalMinutes: totalMinutes,
        deepSleepMinutes: deepSleepMinutes,
        remSleepMinutes: remSleepMinutes,
        sleepQualityScore: sleepQualityScore,
        sleepEfficiency: totalMinutes > 0 ? (deepSleepMinutes + remSleepMinutes) / totalMinutes : 0,
      );
    } catch (e) {
      print('❌ Failed to analyze sleep: $e');
      return null;
    }
  }

  /// Get Heart Rate Variability (HRV) for stress detection
  Future<HRVAnalysis?> analyzeHRV(DateTime date) async {
    if (!_isAuthorized) return null;

    final start = DateTime(date.year, date.month, date.day);
    final end = start.add(const Duration(days: 1));

    try {
      final hrvData = await _health.getHealthDataFromTypes(
        start,
        end,
        [HealthDataType.HEART_RATE_VARIABILITY_SDNN],
      );

      if (hrvData.isEmpty) {
        return null;
      }

      final hrvValues = hrvData
          .map((d) => (d.value as num).toDouble())
          .toList();

      final averageHRV = hrvValues.reduce((a, b) => a + b) / hrvValues.length;

      // HRV interpretation (in milliseconds)
      // High HRV (>60ms) = Low stress, good recovery
      // Medium HRV (40-60ms) = Moderate stress
      // Low HRV (<40ms) = High stress, poor recovery
      final stressLevel = _interpretHRV(averageHRV);

      return HRVAnalysis(
        date: date,
        averageHRV: averageHRV,
        minHRV: hrvValues.reduce((a, b) => a < b ? a : b),
        maxHRV: hrvValues.reduce((a, b) => a > b ? a : b),
        stressLevel: stressLevel,
        sampleCount: hrvValues.length,
      );
    } catch (e) {
      print('❌ Failed to analyze HRV: $e');
      return null;
    }
  }

  /// Get mindful minutes tracked
  Future<int> getMindfulMinutes(DateTime date) async {
    if (!_isAuthorized) return 0;

    final start = DateTime(date.year, date.month, date.day);
    final end = start.add(const Duration(days: 1));

    try {
      final mindfulData = await _health.getHealthDataFromTypes(
        start,
        end,
        [HealthDataType.MINDFULNESS],
      );

      int totalMinutes = 0;
      for (var data in mindfulData) {
        totalMinutes += data.dateTo.difference(data.dateFrom).inMinutes;
      }

      return totalMinutes;
    } catch (e) {
      print('❌ Failed to get mindful minutes: $e');
      return 0;
    }
  }

  /// Write habit completion as mindfulness session
  ///
  /// Bi-directional sync: Write UpCoach habit data to Health app
  Future<bool> writeHabitCompletion({
    required String habitName,
    required int durationMinutes,
  }) async {
    if (!_isAuthorized) {
      print('⚠️  Cannot write to health - not authorized');
      return false;
    }

    try {
      final endTime = DateTime.now();
      final startTime = endTime.subtract(Duration(minutes: durationMinutes));

      final success = await _health.writeHealthData(
        value: durationMinutes.toDouble(),
        type: HealthDataType.MINDFULNESS,
        startTime: startTime,
        endTime: endTime,
      );

      if (success) {
        print('✅ Wrote habit completion to Health: $habitName ($durationMinutes min)');
      } else {
        print('⚠️  Failed to write habit to Health');
      }

      return success;
    } catch (e) {
      print('❌ Error writing habit to health: $e');
      return false;
    }
  }

  /// Write water intake to Health
  Future<bool> writeWaterIntake({
    required double milliliters,
  }) async {
    if (!_isAuthorized) return false;

    try {
      final success = await _health.writeHealthData(
        value: milliliters,
        type: HealthDataType.WATER,
        startTime: DateTime.now(),
        endTime: DateTime.now(),
      );

      if (success) {
        print('✅ Wrote water intake to Health: ${milliliters}ml');
      }

      return success;
    } catch (e) {
      print('❌ Error writing water to health: $e');
      return false;
    }
  }

  /// Calculate sleep quality score (0-100)
  double _calculateSleepQuality(int total, int deep, int rem) {
    if (total == 0) return 0;

    // Ideal sleep: 7-9 hours total, 15-25% deep, 20-25% REM
    final totalScore = _scoreInRange(total, 420, 540); // 7-9 hours
    final deepPercentage = (deep / total) * 100;
    final deepScore = _scoreInRange(deepPercentage, 15, 25);
    final remPercentage = (rem / total) * 100;
    final remScore = _scoreInRange(remPercentage, 20, 25);

    // Weighted average
    return (totalScore * 0.5) + (deepScore * 0.25) + (remScore * 0.25);
  }

  /// Score value within ideal range (0-100)
  double _scoreInRange(double value, double min, double max) {
    if (value >= min && value <= max) {
      return 100.0;
    } else if (value < min) {
      return (value / min) * 100;
    } else {
      final excess = value - max;
      final penalty = excess / max;
      return (100 - (penalty * 50)).clamp(0, 100);
    }
  }

  /// Interpret HRV value as stress level
  String _interpretHRV(double hrv) {
    if (hrv >= 60) {
      return 'Low Stress';
    } else if (hrv >= 40) {
      return 'Moderate Stress';
    } else {
      return 'High Stress';
    }
  }
}

/// Sleep analysis model
class SleepAnalysis {
  final DateTime date;
  final int totalMinutes;
  final int deepSleepMinutes;
  final int remSleepMinutes;
  final double sleepQualityScore;
  final double sleepEfficiency;

  SleepAnalysis({
    required this.date,
    required this.totalMinutes,
    required this.deepSleepMinutes,
    required this.remSleepMinutes,
    required this.sleepQualityScore,
    required this.sleepEfficiency,
  });

  double get totalHours => totalMinutes / 60;
  double get deepSleepHours => deepSleepMinutes / 60;
  double get remSleepHours => remSleepMinutes / 60;

  String get qualityLabel {
    if (sleepQualityScore >= 80) return 'Excellent';
    if (sleepQualityScore >= 60) return 'Good';
    if (sleepQualityScore >= 40) return 'Fair';
    return 'Poor';
  }
}

/// HRV analysis model
class HRVAnalysis {
  final DateTime date;
  final double averageHRV;
  final double minHRV;
  final double maxHRV;
  final String stressLevel;
  final int sampleCount;

  HRVAnalysis({
    required this.date,
    required this.averageHRV,
    required this.minHRV,
    required this.maxHRV,
    required this.stressLevel,
    required this.sampleCount,
  });

  bool get isHighStress => stressLevel == 'High Stress';
  bool get isLowStress => stressLevel == 'Low Stress';
}
