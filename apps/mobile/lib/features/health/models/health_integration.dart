import 'package:freezed_annotation/freezed_annotation.dart';
import 'health_data_point.dart';

part 'health_integration.freezed.dart';
part 'health_integration.g.dart';

/// Category of health integrations
enum IntegrationCategory {
  platformHealth,
  premiumWearables,
  asianWearables,
  fitnessApps,
  nutritionApps,
  wellnessApps,
  sleepApps,
  medicalDevices,
}

/// Connection status for a health integration
enum IntegrationStatus {
  notConnected,
  connecting,
  connected,
  syncing,
  error,
  permissionDenied,
  unavailable,
}

/// OAuth token for API integrations
@freezed
abstract class OAuthToken with _$OAuthToken {
  const factory OAuthToken({
    required String accessToken,
    String? refreshToken,
    required DateTime expiresAt,
    String? tokenType,
    List<String>? scopes,
  }) = _OAuthToken;

  factory OAuthToken.fromJson(Map<String, dynamic> json) =>
      _$OAuthTokenFromJson(json);
}

/// Represents a health/wearable integration configuration
@freezed
abstract class HealthIntegration with _$HealthIntegration {
  const factory HealthIntegration({
    required AppHealthDataSource source,
    required String displayName,
    required String iconAsset,
    required IntegrationCategory category,
    required IntegrationStatus status,
    required List<AppHealthDataType> supportedDataTypes,

    // Connection details
    DateTime? connectedAt,
    DateTime? lastSyncAt,
    String? deviceName,
    String? accountEmail,

    // OAuth (for third-party integrations)
    OAuthToken? oauthToken,

    // Sync settings
    @Default(true) bool autoSync,
    @Default(15) int syncIntervalMinutes,
    @Default(true) bool backgroundSync,

    // Privacy settings
    @Default(true) bool syncToCloud,
    @Default([]) List<AppHealthDataType> enabledDataTypes,

    // Error details
    String? lastErrorMessage,
    DateTime? lastErrorAt,

    // Stats
    int? totalDataPointsSynced,
    DateTime? oldestDataPoint,
    DateTime? newestDataPoint,
  }) = _HealthIntegration;

  factory HealthIntegration.fromJson(Map<String, dynamic> json) =>
      _$HealthIntegrationFromJson(json);
}

/// Predefined health integrations with their configurations
class HealthIntegrations {
  static const List<HealthIntegration> platformHealth = [
    HealthIntegration(
      source: AppHealthDataSource.appleHealth,
      displayName: 'Apple Health',
      iconAsset: 'assets/icons/health/apple_health.png',
      category: IntegrationCategory.platformHealth,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [
        AppHealthDataType.steps,
        AppHealthDataType.activeEnergyBurned,
        AppHealthDataType.distanceWalkingRunning,
        AppHealthDataType.heartRate,
        AppHealthDataType.restingHeartRate,
        AppHealthDataType.heartRateVariability,
        AppHealthDataType.sleepAsleep,
        AppHealthDataType.sleepDeep,
        AppHealthDataType.sleepREM,
        AppHealthDataType.weight,
        AppHealthDataType.bodyMassIndex,
        AppHealthDataType.bloodOxygen,
        AppHealthDataType.bloodPressureSystolic,
        AppHealthDataType.bloodPressureDiastolic,
        AppHealthDataType.mindfulMinutes,
      ],
    ),
    HealthIntegration(
      source: AppHealthDataSource.googleHealthConnect,
      displayName: 'Google Health Connect',
      iconAsset: 'assets/icons/health/health_connect.png',
      category: IntegrationCategory.platformHealth,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [
        AppHealthDataType.steps,
        AppHealthDataType.activeEnergyBurned,
        AppHealthDataType.distanceWalkingRunning,
        AppHealthDataType.heartRate,
        AppHealthDataType.restingHeartRate,
        AppHealthDataType.sleepAsleep,
        AppHealthDataType.sleepDeep,
        AppHealthDataType.sleepREM,
        AppHealthDataType.weight,
        AppHealthDataType.bloodOxygen,
        AppHealthDataType.dietaryCalories,
        AppHealthDataType.dietaryProtein,
        AppHealthDataType.dietaryCarbs,
      ],
    ),
    HealthIntegration(
      source: AppHealthDataSource.samsungHealth,
      displayName: 'Samsung Health',
      iconAsset: 'assets/icons/health/samsung_health.png',
      category: IntegrationCategory.platformHealth,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [
        AppHealthDataType.steps,
        AppHealthDataType.activeEnergyBurned,
        AppHealthDataType.heartRate,
        AppHealthDataType.sleepAsleep,
        AppHealthDataType.weight,
        AppHealthDataType.bloodPressureSystolic,
        AppHealthDataType.bloodPressureDiastolic,
        AppHealthDataType.bloodOxygen,
        AppHealthDataType.stressLevel,
      ],
    ),
  ];

  static const List<HealthIntegration> premiumWearables = [
    HealthIntegration(
      source: AppHealthDataSource.fitbit,
      displayName: 'Fitbit',
      iconAsset: 'assets/icons/health/fitbit.png',
      category: IntegrationCategory.premiumWearables,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [
        AppHealthDataType.steps,
        AppHealthDataType.activeEnergyBurned,
        AppHealthDataType.heartRate,
        AppHealthDataType.restingHeartRate,
        AppHealthDataType.heartRateVariability,
        AppHealthDataType.sleepAsleep,
        AppHealthDataType.sleepDeep,
        AppHealthDataType.sleepREM,
        AppHealthDataType.sleepLight,
        AppHealthDataType.bloodOxygen,
        AppHealthDataType.stressLevel,
      ],
    ),
    HealthIntegration(
      source: AppHealthDataSource.garmin,
      displayName: 'Garmin',
      iconAsset: 'assets/icons/health/garmin.png',
      category: IntegrationCategory.premiumWearables,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [
        AppHealthDataType.steps,
        AppHealthDataType.activeEnergyBurned,
        AppHealthDataType.heartRate,
        AppHealthDataType.restingHeartRate,
        AppHealthDataType.heartRateVariability,
        AppHealthDataType.sleepAsleep,
        AppHealthDataType.sleepDeep,
        AppHealthDataType.sleepREM,
        AppHealthDataType.vo2Max,
        AppHealthDataType.bodyBattery,
        AppHealthDataType.stressLevel,
        AppHealthDataType.trainingLoad,
      ],
    ),
    HealthIntegration(
      source: AppHealthDataSource.whoop,
      displayName: 'Whoop',
      iconAsset: 'assets/icons/health/whoop.png',
      category: IntegrationCategory.premiumWearables,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [
        AppHealthDataType.heartRate,
        AppHealthDataType.heartRateVariability,
        AppHealthDataType.sleepAsleep,
        AppHealthDataType.sleepDeep,
        AppHealthDataType.sleepREM,
        AppHealthDataType.recoveryScore,
        AppHealthDataType.strainScore,
      ],
    ),
    HealthIntegration(
      source: AppHealthDataSource.oura,
      displayName: 'Oura Ring',
      iconAsset: 'assets/icons/health/oura.png',
      category: IntegrationCategory.premiumWearables,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [
        AppHealthDataType.steps,
        AppHealthDataType.heartRate,
        AppHealthDataType.restingHeartRate,
        AppHealthDataType.heartRateVariability,
        AppHealthDataType.sleepAsleep,
        AppHealthDataType.sleepDeep,
        AppHealthDataType.sleepREM,
        AppHealthDataType.sleepLight,
        AppHealthDataType.bloodOxygen,
        AppHealthDataType.bodyTemperature,
        AppHealthDataType.readinessScore,
      ],
    ),
    HealthIntegration(
      source: AppHealthDataSource.polar,
      displayName: 'Polar',
      iconAsset: 'assets/icons/health/polar.png',
      category: IntegrationCategory.premiumWearables,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [
        AppHealthDataType.heartRate,
        AppHealthDataType.restingHeartRate,
        AppHealthDataType.heartRateVariability,
        AppHealthDataType.sleepAsleep,
        AppHealthDataType.trainingLoad,
        AppHealthDataType.recoveryScore,
      ],
    ),
    HealthIntegration(
      source: AppHealthDataSource.withings,
      displayName: 'Withings',
      iconAsset: 'assets/icons/health/withings.png',
      category: IntegrationCategory.premiumWearables,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [
        AppHealthDataType.weight,
        AppHealthDataType.bodyFatPercentage,
        AppHealthDataType.bodyMassIndex,
        AppHealthDataType.leanBodyMass,
        AppHealthDataType.bloodPressureSystolic,
        AppHealthDataType.bloodPressureDiastolic,
        AppHealthDataType.heartRate,
        AppHealthDataType.sleepAsleep,
        AppHealthDataType.bloodOxygen,
        AppHealthDataType.bodyTemperature,
      ],
    ),
  ];

  static const List<HealthIntegration> fitnessApps = [
    HealthIntegration(
      source: AppHealthDataSource.strava,
      displayName: 'Strava',
      iconAsset: 'assets/icons/health/strava.png',
      category: IntegrationCategory.fitnessApps,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [
        AppHealthDataType.activeEnergyBurned,
        AppHealthDataType.distanceWalkingRunning,
        AppHealthDataType.heartRate,
        AppHealthDataType.workoutMinutes,
      ],
    ),
    HealthIntegration(
      source: AppHealthDataSource.peloton,
      displayName: 'Peloton',
      iconAsset: 'assets/icons/health/peloton.png',
      category: IntegrationCategory.fitnessApps,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [
        AppHealthDataType.activeEnergyBurned,
        AppHealthDataType.heartRate,
        AppHealthDataType.workoutMinutes,
      ],
    ),
    HealthIntegration(
      source: AppHealthDataSource.technogym,
      displayName: 'Technogym',
      iconAsset: 'assets/icons/health/technogym.png',
      category: IntegrationCategory.fitnessApps,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [
        AppHealthDataType.activeEnergyBurned,
        AppHealthDataType.heartRate,
        AppHealthDataType.workoutMinutes,
        AppHealthDataType.distanceWalkingRunning,
      ],
    ),
  ];

  static const List<HealthIntegration> nutritionApps = [
    HealthIntegration(
      source: AppHealthDataSource.myFitnessPal,
      displayName: 'MyFitnessPal',
      iconAsset: 'assets/icons/health/myfitnesspal.png',
      category: IntegrationCategory.nutritionApps,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [
        AppHealthDataType.dietaryCalories,
        AppHealthDataType.dietaryProtein,
        AppHealthDataType.dietaryCarbs,
        AppHealthDataType.dietaryFat,
        AppHealthDataType.dietaryWater,
      ],
    ),
    HealthIntegration(
      source: AppHealthDataSource.cronometer,
      displayName: 'Cronometer',
      iconAsset: 'assets/icons/health/cronometer.png',
      category: IntegrationCategory.nutritionApps,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [
        AppHealthDataType.dietaryCalories,
        AppHealthDataType.dietaryProtein,
        AppHealthDataType.dietaryCarbs,
        AppHealthDataType.dietaryFat,
        AppHealthDataType.dietaryWater,
      ],
    ),
  ];

  static const List<HealthIntegration> wellnessApps = [
    HealthIntegration(
      source: AppHealthDataSource.headspace,
      displayName: 'Headspace',
      iconAsset: 'assets/icons/health/headspace.png',
      category: IntegrationCategory.wellnessApps,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [
        AppHealthDataType.mindfulMinutes,
      ],
    ),
    HealthIntegration(
      source: AppHealthDataSource.calm,
      displayName: 'Calm',
      iconAsset: 'assets/icons/health/calm.png',
      category: IntegrationCategory.wellnessApps,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [
        AppHealthDataType.mindfulMinutes,
        AppHealthDataType.sleepDuration,
      ],
    ),
  ];

  static const List<HealthIntegration> medicalDevices = [
    HealthIntegration(
      source: AppHealthDataSource.dexcom,
      displayName: 'Dexcom CGM',
      iconAsset: 'assets/icons/health/dexcom.png',
      category: IntegrationCategory.medicalDevices,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [],
    ),
    HealthIntegration(
      source: AppHealthDataSource.freestyleLibre,
      displayName: 'Freestyle Libre',
      iconAsset: 'assets/icons/health/freestyle_libre.png',
      category: IntegrationCategory.medicalDevices,
      status: IntegrationStatus.notConnected,
      supportedDataTypes: [],
    ),
  ];

  /// Get all available integrations
  static List<HealthIntegration> get all => [
        ...platformHealth,
        ...premiumWearables,
        ...fitnessApps,
        ...nutritionApps,
        ...wellnessApps,
        ...medicalDevices,
      ];

  /// Get integrations by category
  static List<HealthIntegration> byCategory(IntegrationCategory category) {
    return all.where((i) => i.category == category).toList();
  }

  /// Get integration by source
  static HealthIntegration? bySource(AppHealthDataSource source) {
    try {
      return all.firstWhere((i) => i.source == source);
    } catch (_) {
      return null;
    }
  }
}

/// User's health integration settings and privacy preferences
@freezed
abstract class HealthPrivacySettings with _$HealthPrivacySettings {
  const factory HealthPrivacySettings({
    /// Process all health data on-device only (never sync to cloud)
    @Default(true) bool onDeviceOnly,

    /// Enable background sync
    @Default(true) bool backgroundSyncEnabled,

    /// Sync frequency in minutes
    @Default(15) int syncIntervalMinutes,

    /// Only sync on WiFi
    @Default(false) bool wifiOnlySync,

    /// Data retention period in days (0 = forever)
    @Default(90) int dataRetentionDays,

    /// Which data types are allowed to be collected
    @Default([]) List<AppHealthDataType> allowedDataTypes,

    /// Which data types can be synced to cloud (if onDeviceOnly is false)
    @Default([]) List<AppHealthDataType> cloudSyncAllowedTypes,

    /// Show health insights in notifications
    @Default(true) bool showHealthNotifications,

    /// Use health data for AI coaching
    @Default(true) bool useForAiCoaching,
  }) = _HealthPrivacySettings;

  factory HealthPrivacySettings.fromJson(Map<String, dynamic> json) =>
      _$HealthPrivacySettingsFromJson(json);
}
