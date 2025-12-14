import 'package:freezed_annotation/freezed_annotation.dart';

part 'health_data_point.freezed.dart';
part 'health_data_point.g.dart';

/// Types of health data that can be collected from wearables and health apps
/// Prefixed with 'App' to avoid conflicts with the health package
enum AppHealthDataType {
  // Activity
  steps,
  activeEnergyBurned,
  distanceWalkingRunning,
  flightsClimbed,
  moveMinutes,
  workoutMinutes,

  // Heart
  heartRate,
  restingHeartRate,
  heartRateVariability,

  // Sleep
  sleepAsleep,
  sleepAwake,
  sleepDeep,
  sleepREM,
  sleepLight,
  sleepDuration,

  // Body
  weight,
  bodyMassIndex,
  bodyFatPercentage,
  leanBodyMass,
  height,

  // Vitals
  bloodPressureSystolic,
  bloodPressureDiastolic,
  bloodOxygen,
  respiratoryRate,
  bodyTemperature,

  // Nutrition
  dietaryCalories,
  dietaryProtein,
  dietaryCarbs,
  dietaryFat,
  dietaryWater,

  // Mindfulness
  mindfulMinutes,

  // Fitness Metrics (from Garmin, Whoop, etc.)
  vo2Max,
  recoveryScore,
  strainScore,
  readinessScore,
  trainingLoad,
  bodyBattery,
  stressLevel,
}

/// Unit of measurement for health data
/// Prefixed with 'App' to avoid conflicts with the health package
enum AppHealthDataUnit {
  count,
  kilocalorie,
  meter,
  kilogram,
  percent,
  beatsPerMinute,
  millisecond,
  minute,
  hour,
  liter,
  gram,
  milligramPerDeciliter,
  mmHg,
  celsius,
  noUnit,
}

/// Source of health data (platform or third-party integration)
/// Prefixed with 'App' to avoid conflicts with the health package
enum AppHealthDataSource {
  // Platform Health Services
  appleHealth,
  googleHealthConnect,
  samsungHealth,
  huaweiHealth,

  // Premium Wearables
  fitbit,
  garmin,
  whoop,
  oura,
  polar,
  suunto,
  coros,
  withings,
  amazfit,

  // Asian Market Wearables
  xiaomi,
  oppo,
  vivo,
  huaweiWatch,
  honor,
  noise,
  boat,
  fireBoltt,

  // Fitness Apps
  strava,
  peloton,
  zwift,
  trainingPeaks,
  technogym,

  // Nutrition Apps
  myFitnessPal,
  cronometer,
  noom,

  // Mental Health Apps
  headspace,
  calm,

  // Sleep Apps
  sleepCycle,

  // Medical Devices
  dexcom,
  freestyleLibre,

  // Manual Entry
  manual,

  // Unknown
  unknown,
}

/// Represents a single health data point
@freezed
abstract class AppHealthDataPoint with _$AppHealthDataPoint {
  const factory AppHealthDataPoint({
    required String id,
    required AppHealthDataType type,
    required double value,
    required AppHealthDataUnit unit,
    required DateTime timestamp,
    required DateTime dateFrom,
    required DateTime dateTo,
    required AppHealthDataSource source,
    String? sourceDeviceName,
    String? sourceAppName,
    Map<String, dynamic>? metadata,
    @Default(false) bool isManualEntry,
    DateTime? syncedAt,
  }) = _AppHealthDataPoint;

  factory AppHealthDataPoint.fromJson(Map<String, dynamic> json) =>
      _$AppHealthDataPointFromJson(json);
}

/// Aggregated health statistics for a time period
@freezed
abstract class HealthStats with _$HealthStats {
  const factory HealthStats({
    required DateTime date,
    required Duration period,

    // Activity
    int? steps,
    double? activeCalories,
    double? distanceKm,
    int? flightsClimbed,
    int? activeMinutes,
    int? workoutMinutes,

    // Heart
    double? averageHeartRate,
    double? restingHeartRate,
    double? heartRateVariability,
    double? minHeartRate,
    double? maxHeartRate,

    // Sleep
    int? sleepDurationMinutes,
    int? deepSleepMinutes,
    int? remSleepMinutes,
    int? lightSleepMinutes,
    int? awakeMinutes,
    double? sleepEfficiency,

    // Body
    double? weight,
    double? bodyFatPercentage,
    double? bmi,

    // Vitals
    double? bloodOxygen,
    int? bloodPressureSystolic,
    int? bloodPressureDiastolic,

    // Wellness Scores
    int? recoveryScore,
    int? readinessScore,
    int? strainScore,
    int? stressLevel,
    double? bodyBattery,

    // Nutrition
    int? caloriesConsumed,
    int? proteinGrams,
    int? carbsGrams,
    int? fatGrams,
    double? waterLiters,

    // Mindfulness
    int? mindfulMinutes,

    // Metadata
    List<AppHealthDataSource>? sources,
    DateTime? lastSyncedAt,
  }) = _HealthStats;

  factory HealthStats.fromJson(Map<String, dynamic> json) =>
      _$HealthStatsFromJson(json);
}

/// Daily readiness score computed from multiple health metrics
@freezed
abstract class DailyReadinessScore with _$DailyReadinessScore {
  const factory DailyReadinessScore({
    required DateTime date,
    required int overallScore,
    required String recommendation,

    // Component scores (0-100)
    int? sleepScore,
    int? recoveryScore,
    int? activityScore,
    int? stressScore,
    int? hrvScore,

    // Recommendations
    @Default([]) List<String> habitRecommendations,
    @Default([]) List<String> activityRecommendations,

    // Data sources used
    @Default([]) List<AppHealthDataSource> dataSourcesUsed,

    // Confidence level (0-1) based on available data
    @Default(0.5) double confidenceLevel,
  }) = _DailyReadinessScore;

  factory DailyReadinessScore.fromJson(Map<String, dynamic> json) =>
      _$DailyReadinessScoreFromJson(json);
}
