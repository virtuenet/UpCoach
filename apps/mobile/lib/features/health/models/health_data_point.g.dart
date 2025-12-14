// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'health_data_point.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AppHealthDataPoint _$AppHealthDataPointFromJson(Map<String, dynamic> json) =>
    _AppHealthDataPoint(
      id: json['id'] as String,
      type: $enumDecode(_$AppHealthDataTypeEnumMap, json['type']),
      value: (json['value'] as num).toDouble(),
      unit: $enumDecode(_$AppHealthDataUnitEnumMap, json['unit']),
      timestamp: DateTime.parse(json['timestamp'] as String),
      dateFrom: DateTime.parse(json['dateFrom'] as String),
      dateTo: DateTime.parse(json['dateTo'] as String),
      source: $enumDecode(_$AppHealthDataSourceEnumMap, json['source']),
      sourceDeviceName: json['sourceDeviceName'] as String?,
      sourceAppName: json['sourceAppName'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      isManualEntry: json['isManualEntry'] as bool? ?? false,
      syncedAt: json['syncedAt'] == null
          ? null
          : DateTime.parse(json['syncedAt'] as String),
    );

Map<String, dynamic> _$AppHealthDataPointToJson(_AppHealthDataPoint instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': _$AppHealthDataTypeEnumMap[instance.type]!,
      'value': instance.value,
      'unit': _$AppHealthDataUnitEnumMap[instance.unit]!,
      'timestamp': instance.timestamp.toIso8601String(),
      'dateFrom': instance.dateFrom.toIso8601String(),
      'dateTo': instance.dateTo.toIso8601String(),
      'source': _$AppHealthDataSourceEnumMap[instance.source]!,
      'sourceDeviceName': instance.sourceDeviceName,
      'sourceAppName': instance.sourceAppName,
      'metadata': instance.metadata,
      'isManualEntry': instance.isManualEntry,
      'syncedAt': instance.syncedAt?.toIso8601String(),
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

const _$AppHealthDataUnitEnumMap = {
  AppHealthDataUnit.count: 'count',
  AppHealthDataUnit.kilocalorie: 'kilocalorie',
  AppHealthDataUnit.meter: 'meter',
  AppHealthDataUnit.kilogram: 'kilogram',
  AppHealthDataUnit.percent: 'percent',
  AppHealthDataUnit.beatsPerMinute: 'beatsPerMinute',
  AppHealthDataUnit.millisecond: 'millisecond',
  AppHealthDataUnit.minute: 'minute',
  AppHealthDataUnit.hour: 'hour',
  AppHealthDataUnit.liter: 'liter',
  AppHealthDataUnit.gram: 'gram',
  AppHealthDataUnit.milligramPerDeciliter: 'milligramPerDeciliter',
  AppHealthDataUnit.mmHg: 'mmHg',
  AppHealthDataUnit.celsius: 'celsius',
  AppHealthDataUnit.noUnit: 'noUnit',
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

_HealthStats _$HealthStatsFromJson(Map<String, dynamic> json) => _HealthStats(
  date: DateTime.parse(json['date'] as String),
  period: Duration(microseconds: (json['period'] as num).toInt()),
  steps: (json['steps'] as num?)?.toInt(),
  activeCalories: (json['activeCalories'] as num?)?.toDouble(),
  distanceKm: (json['distanceKm'] as num?)?.toDouble(),
  flightsClimbed: (json['flightsClimbed'] as num?)?.toInt(),
  activeMinutes: (json['activeMinutes'] as num?)?.toInt(),
  workoutMinutes: (json['workoutMinutes'] as num?)?.toInt(),
  averageHeartRate: (json['averageHeartRate'] as num?)?.toDouble(),
  restingHeartRate: (json['restingHeartRate'] as num?)?.toDouble(),
  heartRateVariability: (json['heartRateVariability'] as num?)?.toDouble(),
  minHeartRate: (json['minHeartRate'] as num?)?.toDouble(),
  maxHeartRate: (json['maxHeartRate'] as num?)?.toDouble(),
  sleepDurationMinutes: (json['sleepDurationMinutes'] as num?)?.toInt(),
  deepSleepMinutes: (json['deepSleepMinutes'] as num?)?.toInt(),
  remSleepMinutes: (json['remSleepMinutes'] as num?)?.toInt(),
  lightSleepMinutes: (json['lightSleepMinutes'] as num?)?.toInt(),
  awakeMinutes: (json['awakeMinutes'] as num?)?.toInt(),
  sleepEfficiency: (json['sleepEfficiency'] as num?)?.toDouble(),
  weight: (json['weight'] as num?)?.toDouble(),
  bodyFatPercentage: (json['bodyFatPercentage'] as num?)?.toDouble(),
  bmi: (json['bmi'] as num?)?.toDouble(),
  bloodOxygen: (json['bloodOxygen'] as num?)?.toDouble(),
  bloodPressureSystolic: (json['bloodPressureSystolic'] as num?)?.toInt(),
  bloodPressureDiastolic: (json['bloodPressureDiastolic'] as num?)?.toInt(),
  recoveryScore: (json['recoveryScore'] as num?)?.toInt(),
  readinessScore: (json['readinessScore'] as num?)?.toInt(),
  strainScore: (json['strainScore'] as num?)?.toInt(),
  stressLevel: (json['stressLevel'] as num?)?.toInt(),
  bodyBattery: (json['bodyBattery'] as num?)?.toDouble(),
  caloriesConsumed: (json['caloriesConsumed'] as num?)?.toInt(),
  proteinGrams: (json['proteinGrams'] as num?)?.toInt(),
  carbsGrams: (json['carbsGrams'] as num?)?.toInt(),
  fatGrams: (json['fatGrams'] as num?)?.toInt(),
  waterLiters: (json['waterLiters'] as num?)?.toDouble(),
  mindfulMinutes: (json['mindfulMinutes'] as num?)?.toInt(),
  sources: (json['sources'] as List<dynamic>?)
      ?.map((e) => $enumDecode(_$AppHealthDataSourceEnumMap, e))
      .toList(),
  lastSyncedAt: json['lastSyncedAt'] == null
      ? null
      : DateTime.parse(json['lastSyncedAt'] as String),
);

Map<String, dynamic> _$HealthStatsToJson(_HealthStats instance) =>
    <String, dynamic>{
      'date': instance.date.toIso8601String(),
      'period': instance.period.inMicroseconds,
      'steps': instance.steps,
      'activeCalories': instance.activeCalories,
      'distanceKm': instance.distanceKm,
      'flightsClimbed': instance.flightsClimbed,
      'activeMinutes': instance.activeMinutes,
      'workoutMinutes': instance.workoutMinutes,
      'averageHeartRate': instance.averageHeartRate,
      'restingHeartRate': instance.restingHeartRate,
      'heartRateVariability': instance.heartRateVariability,
      'minHeartRate': instance.minHeartRate,
      'maxHeartRate': instance.maxHeartRate,
      'sleepDurationMinutes': instance.sleepDurationMinutes,
      'deepSleepMinutes': instance.deepSleepMinutes,
      'remSleepMinutes': instance.remSleepMinutes,
      'lightSleepMinutes': instance.lightSleepMinutes,
      'awakeMinutes': instance.awakeMinutes,
      'sleepEfficiency': instance.sleepEfficiency,
      'weight': instance.weight,
      'bodyFatPercentage': instance.bodyFatPercentage,
      'bmi': instance.bmi,
      'bloodOxygen': instance.bloodOxygen,
      'bloodPressureSystolic': instance.bloodPressureSystolic,
      'bloodPressureDiastolic': instance.bloodPressureDiastolic,
      'recoveryScore': instance.recoveryScore,
      'readinessScore': instance.readinessScore,
      'strainScore': instance.strainScore,
      'stressLevel': instance.stressLevel,
      'bodyBattery': instance.bodyBattery,
      'caloriesConsumed': instance.caloriesConsumed,
      'proteinGrams': instance.proteinGrams,
      'carbsGrams': instance.carbsGrams,
      'fatGrams': instance.fatGrams,
      'waterLiters': instance.waterLiters,
      'mindfulMinutes': instance.mindfulMinutes,
      'sources': instance.sources
          ?.map((e) => _$AppHealthDataSourceEnumMap[e]!)
          .toList(),
      'lastSyncedAt': instance.lastSyncedAt?.toIso8601String(),
    };

_DailyReadinessScore _$DailyReadinessScoreFromJson(Map<String, dynamic> json) =>
    _DailyReadinessScore(
      date: DateTime.parse(json['date'] as String),
      overallScore: (json['overallScore'] as num).toInt(),
      recommendation: json['recommendation'] as String,
      sleepScore: (json['sleepScore'] as num?)?.toInt(),
      recoveryScore: (json['recoveryScore'] as num?)?.toInt(),
      activityScore: (json['activityScore'] as num?)?.toInt(),
      stressScore: (json['stressScore'] as num?)?.toInt(),
      hrvScore: (json['hrvScore'] as num?)?.toInt(),
      habitRecommendations:
          (json['habitRecommendations'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      activityRecommendations:
          (json['activityRecommendations'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      dataSourcesUsed:
          (json['dataSourcesUsed'] as List<dynamic>?)
              ?.map((e) => $enumDecode(_$AppHealthDataSourceEnumMap, e))
              .toList() ??
          const [],
      confidenceLevel: (json['confidenceLevel'] as num?)?.toDouble() ?? 0.5,
    );

Map<String, dynamic> _$DailyReadinessScoreToJson(
  _DailyReadinessScore instance,
) => <String, dynamic>{
  'date': instance.date.toIso8601String(),
  'overallScore': instance.overallScore,
  'recommendation': instance.recommendation,
  'sleepScore': instance.sleepScore,
  'recoveryScore': instance.recoveryScore,
  'activityScore': instance.activityScore,
  'stressScore': instance.stressScore,
  'hrvScore': instance.hrvScore,
  'habitRecommendations': instance.habitRecommendations,
  'activityRecommendations': instance.activityRecommendations,
  'dataSourcesUsed': instance.dataSourcesUsed
      .map((e) => _$AppHealthDataSourceEnumMap[e]!)
      .toList(),
  'confidenceLevel': instance.confidenceLevel,
};
