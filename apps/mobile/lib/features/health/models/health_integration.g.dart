// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'health_integration.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_OAuthToken _$OAuthTokenFromJson(Map<String, dynamic> json) => _OAuthToken(
  accessToken: json['accessToken'] as String,
  refreshToken: json['refreshToken'] as String?,
  expiresAt: DateTime.parse(json['expiresAt'] as String),
  tokenType: json['tokenType'] as String?,
  scopes: (json['scopes'] as List<dynamic>?)?.map((e) => e as String).toList(),
);

Map<String, dynamic> _$OAuthTokenToJson(_OAuthToken instance) =>
    <String, dynamic>{
      'accessToken': instance.accessToken,
      'refreshToken': instance.refreshToken,
      'expiresAt': instance.expiresAt.toIso8601String(),
      'tokenType': instance.tokenType,
      'scopes': instance.scopes,
    };

_HealthIntegration _$HealthIntegrationFromJson(Map<String, dynamic> json) =>
    _HealthIntegration(
      source: $enumDecode(_$AppHealthDataSourceEnumMap, json['source']),
      displayName: json['displayName'] as String,
      iconAsset: json['iconAsset'] as String,
      category: $enumDecode(_$IntegrationCategoryEnumMap, json['category']),
      status: $enumDecode(_$IntegrationStatusEnumMap, json['status']),
      supportedDataTypes: (json['supportedDataTypes'] as List<dynamic>)
          .map((e) => $enumDecode(_$AppHealthDataTypeEnumMap, e))
          .toList(),
      connectedAt: json['connectedAt'] == null
          ? null
          : DateTime.parse(json['connectedAt'] as String),
      lastSyncAt: json['lastSyncAt'] == null
          ? null
          : DateTime.parse(json['lastSyncAt'] as String),
      deviceName: json['deviceName'] as String?,
      accountEmail: json['accountEmail'] as String?,
      oauthToken: json['oauthToken'] == null
          ? null
          : OAuthToken.fromJson(json['oauthToken'] as Map<String, dynamic>),
      autoSync: json['autoSync'] as bool? ?? true,
      syncIntervalMinutes: (json['syncIntervalMinutes'] as num?)?.toInt() ?? 15,
      backgroundSync: json['backgroundSync'] as bool? ?? true,
      syncToCloud: json['syncToCloud'] as bool? ?? true,
      enabledDataTypes:
          (json['enabledDataTypes'] as List<dynamic>?)
              ?.map((e) => $enumDecode(_$AppHealthDataTypeEnumMap, e))
              .toList() ??
          const [],
      lastErrorMessage: json['lastErrorMessage'] as String?,
      lastErrorAt: json['lastErrorAt'] == null
          ? null
          : DateTime.parse(json['lastErrorAt'] as String),
      totalDataPointsSynced: (json['totalDataPointsSynced'] as num?)?.toInt(),
      oldestDataPoint: json['oldestDataPoint'] == null
          ? null
          : DateTime.parse(json['oldestDataPoint'] as String),
      newestDataPoint: json['newestDataPoint'] == null
          ? null
          : DateTime.parse(json['newestDataPoint'] as String),
    );

Map<String, dynamic> _$HealthIntegrationToJson(_HealthIntegration instance) =>
    <String, dynamic>{
      'source': _$AppHealthDataSourceEnumMap[instance.source]!,
      'displayName': instance.displayName,
      'iconAsset': instance.iconAsset,
      'category': _$IntegrationCategoryEnumMap[instance.category]!,
      'status': _$IntegrationStatusEnumMap[instance.status]!,
      'supportedDataTypes': instance.supportedDataTypes
          .map((e) => _$AppHealthDataTypeEnumMap[e]!)
          .toList(),
      'connectedAt': instance.connectedAt?.toIso8601String(),
      'lastSyncAt': instance.lastSyncAt?.toIso8601String(),
      'deviceName': instance.deviceName,
      'accountEmail': instance.accountEmail,
      'oauthToken': instance.oauthToken,
      'autoSync': instance.autoSync,
      'syncIntervalMinutes': instance.syncIntervalMinutes,
      'backgroundSync': instance.backgroundSync,
      'syncToCloud': instance.syncToCloud,
      'enabledDataTypes': instance.enabledDataTypes
          .map((e) => _$AppHealthDataTypeEnumMap[e]!)
          .toList(),
      'lastErrorMessage': instance.lastErrorMessage,
      'lastErrorAt': instance.lastErrorAt?.toIso8601String(),
      'totalDataPointsSynced': instance.totalDataPointsSynced,
      'oldestDataPoint': instance.oldestDataPoint?.toIso8601String(),
      'newestDataPoint': instance.newestDataPoint?.toIso8601String(),
    };

const _$AppHealthDataSourceEnumMap = {
  AppHealthDataSource.appleHealth: 'appleHealth',
  AppHealthDataSource.googleHealthConnect: 'googleHealthConnect',
  AppHealthDataSource.samsungHealth: 'samsungHealth',
  AppHealthDataSource.huaweiHealth: 'huaweiHealth',
  AppHealthDataSource.fitbit: 'fitbit',
  AppHealthDataSource.garmin: 'garmin',
  AppHealthDataSource.whoop: 'whoop',
  AppHealthDataSource.oura: 'oura',
  AppHealthDataSource.polar: 'polar',
  AppHealthDataSource.suunto: 'suunto',
  AppHealthDataSource.coros: 'coros',
  AppHealthDataSource.withings: 'withings',
  AppHealthDataSource.amazfit: 'amazfit',
  AppHealthDataSource.xiaomi: 'xiaomi',
  AppHealthDataSource.oppo: 'oppo',
  AppHealthDataSource.vivo: 'vivo',
  AppHealthDataSource.huaweiWatch: 'huaweiWatch',
  AppHealthDataSource.honor: 'honor',
  AppHealthDataSource.noise: 'noise',
  AppHealthDataSource.boat: 'boat',
  AppHealthDataSource.fireBoltt: 'fireBoltt',
  AppHealthDataSource.strava: 'strava',
  AppHealthDataSource.peloton: 'peloton',
  AppHealthDataSource.zwift: 'zwift',
  AppHealthDataSource.trainingPeaks: 'trainingPeaks',
  AppHealthDataSource.technogym: 'technogym',
  AppHealthDataSource.myFitnessPal: 'myFitnessPal',
  AppHealthDataSource.cronometer: 'cronometer',
  AppHealthDataSource.noom: 'noom',
  AppHealthDataSource.headspace: 'headspace',
  AppHealthDataSource.calm: 'calm',
  AppHealthDataSource.sleepCycle: 'sleepCycle',
  AppHealthDataSource.dexcom: 'dexcom',
  AppHealthDataSource.freestyleLibre: 'freestyleLibre',
  AppHealthDataSource.manual: 'manual',
  AppHealthDataSource.unknown: 'unknown',
};

const _$IntegrationCategoryEnumMap = {
  IntegrationCategory.platformHealth: 'platformHealth',
  IntegrationCategory.premiumWearables: 'premiumWearables',
  IntegrationCategory.asianWearables: 'asianWearables',
  IntegrationCategory.fitnessApps: 'fitnessApps',
  IntegrationCategory.nutritionApps: 'nutritionApps',
  IntegrationCategory.wellnessApps: 'wellnessApps',
  IntegrationCategory.sleepApps: 'sleepApps',
  IntegrationCategory.medicalDevices: 'medicalDevices',
};

const _$IntegrationStatusEnumMap = {
  IntegrationStatus.notConnected: 'notConnected',
  IntegrationStatus.connecting: 'connecting',
  IntegrationStatus.connected: 'connected',
  IntegrationStatus.syncing: 'syncing',
  IntegrationStatus.error: 'error',
  IntegrationStatus.permissionDenied: 'permissionDenied',
  IntegrationStatus.unavailable: 'unavailable',
};

const _$AppHealthDataTypeEnumMap = {
  AppHealthDataType.steps: 'steps',
  AppHealthDataType.activeEnergyBurned: 'activeEnergyBurned',
  AppHealthDataType.distanceWalkingRunning: 'distanceWalkingRunning',
  AppHealthDataType.flightsClimbed: 'flightsClimbed',
  AppHealthDataType.moveMinutes: 'moveMinutes',
  AppHealthDataType.workoutMinutes: 'workoutMinutes',
  AppHealthDataType.heartRate: 'heartRate',
  AppHealthDataType.restingHeartRate: 'restingHeartRate',
  AppHealthDataType.heartRateVariability: 'heartRateVariability',
  AppHealthDataType.sleepAsleep: 'sleepAsleep',
  AppHealthDataType.sleepAwake: 'sleepAwake',
  AppHealthDataType.sleepDeep: 'sleepDeep',
  AppHealthDataType.sleepREM: 'sleepREM',
  AppHealthDataType.sleepLight: 'sleepLight',
  AppHealthDataType.sleepDuration: 'sleepDuration',
  AppHealthDataType.weight: 'weight',
  AppHealthDataType.bodyMassIndex: 'bodyMassIndex',
  AppHealthDataType.bodyFatPercentage: 'bodyFatPercentage',
  AppHealthDataType.leanBodyMass: 'leanBodyMass',
  AppHealthDataType.height: 'height',
  AppHealthDataType.bloodPressureSystolic: 'bloodPressureSystolic',
  AppHealthDataType.bloodPressureDiastolic: 'bloodPressureDiastolic',
  AppHealthDataType.bloodOxygen: 'bloodOxygen',
  AppHealthDataType.respiratoryRate: 'respiratoryRate',
  AppHealthDataType.bodyTemperature: 'bodyTemperature',
  AppHealthDataType.dietaryCalories: 'dietaryCalories',
  AppHealthDataType.dietaryProtein: 'dietaryProtein',
  AppHealthDataType.dietaryCarbs: 'dietaryCarbs',
  AppHealthDataType.dietaryFat: 'dietaryFat',
  AppHealthDataType.dietaryWater: 'dietaryWater',
  AppHealthDataType.mindfulMinutes: 'mindfulMinutes',
  AppHealthDataType.vo2Max: 'vo2Max',
  AppHealthDataType.recoveryScore: 'recoveryScore',
  AppHealthDataType.strainScore: 'strainScore',
  AppHealthDataType.readinessScore: 'readinessScore',
  AppHealthDataType.trainingLoad: 'trainingLoad',
  AppHealthDataType.bodyBattery: 'bodyBattery',
  AppHealthDataType.stressLevel: 'stressLevel',
};

_HealthPrivacySettings _$HealthPrivacySettingsFromJson(
  Map<String, dynamic> json,
) => _HealthPrivacySettings(
  onDeviceOnly: json['onDeviceOnly'] as bool? ?? true,
  backgroundSyncEnabled: json['backgroundSyncEnabled'] as bool? ?? true,
  syncIntervalMinutes: (json['syncIntervalMinutes'] as num?)?.toInt() ?? 15,
  wifiOnlySync: json['wifiOnlySync'] as bool? ?? false,
  dataRetentionDays: (json['dataRetentionDays'] as num?)?.toInt() ?? 90,
  allowedDataTypes:
      (json['allowedDataTypes'] as List<dynamic>?)
          ?.map((e) => $enumDecode(_$AppHealthDataTypeEnumMap, e))
          .toList() ??
      const [],
  cloudSyncAllowedTypes:
      (json['cloudSyncAllowedTypes'] as List<dynamic>?)
          ?.map((e) => $enumDecode(_$AppHealthDataTypeEnumMap, e))
          .toList() ??
      const [],
  showHealthNotifications: json['showHealthNotifications'] as bool? ?? true,
  useForAiCoaching: json['useForAiCoaching'] as bool? ?? true,
);

Map<String, dynamic> _$HealthPrivacySettingsToJson(
  _HealthPrivacySettings instance,
) => <String, dynamic>{
  'onDeviceOnly': instance.onDeviceOnly,
  'backgroundSyncEnabled': instance.backgroundSyncEnabled,
  'syncIntervalMinutes': instance.syncIntervalMinutes,
  'wifiOnlySync': instance.wifiOnlySync,
  'dataRetentionDays': instance.dataRetentionDays,
  'allowedDataTypes': instance.allowedDataTypes
      .map((e) => _$AppHealthDataTypeEnumMap[e]!)
      .toList(),
  'cloudSyncAllowedTypes': instance.cloudSyncAllowedTypes
      .map((e) => _$AppHealthDataTypeEnumMap[e]!)
      .toList(),
  'showHealthNotifications': instance.showHealthNotifications,
  'useForAiCoaching': instance.useForAiCoaching,
};
