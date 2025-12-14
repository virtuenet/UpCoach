// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'health_data_point.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AppHealthDataPoint {

 String get id; AppHealthDataType get type; double get value; AppHealthDataUnit get unit; DateTime get timestamp; DateTime get dateFrom; DateTime get dateTo; AppHealthDataSource get source; String? get sourceDeviceName; String? get sourceAppName; Map<String, dynamic>? get metadata; bool get isManualEntry; DateTime? get syncedAt;
/// Create a copy of AppHealthDataPoint
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AppHealthDataPointCopyWith<AppHealthDataPoint> get copyWith => _$AppHealthDataPointCopyWithImpl<AppHealthDataPoint>(this as AppHealthDataPoint, _$identity);

  /// Serializes this AppHealthDataPoint to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AppHealthDataPoint&&(identical(other.id, id) || other.id == id)&&(identical(other.type, type) || other.type == type)&&(identical(other.value, value) || other.value == value)&&(identical(other.unit, unit) || other.unit == unit)&&(identical(other.timestamp, timestamp) || other.timestamp == timestamp)&&(identical(other.dateFrom, dateFrom) || other.dateFrom == dateFrom)&&(identical(other.dateTo, dateTo) || other.dateTo == dateTo)&&(identical(other.source, source) || other.source == source)&&(identical(other.sourceDeviceName, sourceDeviceName) || other.sourceDeviceName == sourceDeviceName)&&(identical(other.sourceAppName, sourceAppName) || other.sourceAppName == sourceAppName)&&const DeepCollectionEquality().equals(other.metadata, metadata)&&(identical(other.isManualEntry, isManualEntry) || other.isManualEntry == isManualEntry)&&(identical(other.syncedAt, syncedAt) || other.syncedAt == syncedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,type,value,unit,timestamp,dateFrom,dateTo,source,sourceDeviceName,sourceAppName,const DeepCollectionEquality().hash(metadata),isManualEntry,syncedAt);

@override
String toString() {
  return 'AppHealthDataPoint(id: $id, type: $type, value: $value, unit: $unit, timestamp: $timestamp, dateFrom: $dateFrom, dateTo: $dateTo, source: $source, sourceDeviceName: $sourceDeviceName, sourceAppName: $sourceAppName, metadata: $metadata, isManualEntry: $isManualEntry, syncedAt: $syncedAt)';
}


}

/// @nodoc
abstract mixin class $AppHealthDataPointCopyWith<$Res>  {
  factory $AppHealthDataPointCopyWith(AppHealthDataPoint value, $Res Function(AppHealthDataPoint) _then) = _$AppHealthDataPointCopyWithImpl;
@useResult
$Res call({
 String id, AppHealthDataType type, double value, AppHealthDataUnit unit, DateTime timestamp, DateTime dateFrom, DateTime dateTo, AppHealthDataSource source, String? sourceDeviceName, String? sourceAppName, Map<String, dynamic>? metadata, bool isManualEntry, DateTime? syncedAt
});




}
/// @nodoc
class _$AppHealthDataPointCopyWithImpl<$Res>
    implements $AppHealthDataPointCopyWith<$Res> {
  _$AppHealthDataPointCopyWithImpl(this._self, this._then);

  final AppHealthDataPoint _self;
  final $Res Function(AppHealthDataPoint) _then;

/// Create a copy of AppHealthDataPoint
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? type = null,Object? value = null,Object? unit = null,Object? timestamp = null,Object? dateFrom = null,Object? dateTo = null,Object? source = null,Object? sourceDeviceName = freezed,Object? sourceAppName = freezed,Object? metadata = freezed,Object? isManualEntry = null,Object? syncedAt = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as AppHealthDataType,value: null == value ? _self.value : value // ignore: cast_nullable_to_non_nullable
as double,unit: null == unit ? _self.unit : unit // ignore: cast_nullable_to_non_nullable
as AppHealthDataUnit,timestamp: null == timestamp ? _self.timestamp : timestamp // ignore: cast_nullable_to_non_nullable
as DateTime,dateFrom: null == dateFrom ? _self.dateFrom : dateFrom // ignore: cast_nullable_to_non_nullable
as DateTime,dateTo: null == dateTo ? _self.dateTo : dateTo // ignore: cast_nullable_to_non_nullable
as DateTime,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as AppHealthDataSource,sourceDeviceName: freezed == sourceDeviceName ? _self.sourceDeviceName : sourceDeviceName // ignore: cast_nullable_to_non_nullable
as String?,sourceAppName: freezed == sourceAppName ? _self.sourceAppName : sourceAppName // ignore: cast_nullable_to_non_nullable
as String?,metadata: freezed == metadata ? _self.metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,isManualEntry: null == isManualEntry ? _self.isManualEntry : isManualEntry // ignore: cast_nullable_to_non_nullable
as bool,syncedAt: freezed == syncedAt ? _self.syncedAt : syncedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [AppHealthDataPoint].
extension AppHealthDataPointPatterns on AppHealthDataPoint {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AppHealthDataPoint value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AppHealthDataPoint() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AppHealthDataPoint value)  $default,){
final _that = this;
switch (_that) {
case _AppHealthDataPoint():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AppHealthDataPoint value)?  $default,){
final _that = this;
switch (_that) {
case _AppHealthDataPoint() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  AppHealthDataType type,  double value,  AppHealthDataUnit unit,  DateTime timestamp,  DateTime dateFrom,  DateTime dateTo,  AppHealthDataSource source,  String? sourceDeviceName,  String? sourceAppName,  Map<String, dynamic>? metadata,  bool isManualEntry,  DateTime? syncedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AppHealthDataPoint() when $default != null:
return $default(_that.id,_that.type,_that.value,_that.unit,_that.timestamp,_that.dateFrom,_that.dateTo,_that.source,_that.sourceDeviceName,_that.sourceAppName,_that.metadata,_that.isManualEntry,_that.syncedAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  AppHealthDataType type,  double value,  AppHealthDataUnit unit,  DateTime timestamp,  DateTime dateFrom,  DateTime dateTo,  AppHealthDataSource source,  String? sourceDeviceName,  String? sourceAppName,  Map<String, dynamic>? metadata,  bool isManualEntry,  DateTime? syncedAt)  $default,) {final _that = this;
switch (_that) {
case _AppHealthDataPoint():
return $default(_that.id,_that.type,_that.value,_that.unit,_that.timestamp,_that.dateFrom,_that.dateTo,_that.source,_that.sourceDeviceName,_that.sourceAppName,_that.metadata,_that.isManualEntry,_that.syncedAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  AppHealthDataType type,  double value,  AppHealthDataUnit unit,  DateTime timestamp,  DateTime dateFrom,  DateTime dateTo,  AppHealthDataSource source,  String? sourceDeviceName,  String? sourceAppName,  Map<String, dynamic>? metadata,  bool isManualEntry,  DateTime? syncedAt)?  $default,) {final _that = this;
switch (_that) {
case _AppHealthDataPoint() when $default != null:
return $default(_that.id,_that.type,_that.value,_that.unit,_that.timestamp,_that.dateFrom,_that.dateTo,_that.source,_that.sourceDeviceName,_that.sourceAppName,_that.metadata,_that.isManualEntry,_that.syncedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AppHealthDataPoint implements AppHealthDataPoint {
  const _AppHealthDataPoint({required this.id, required this.type, required this.value, required this.unit, required this.timestamp, required this.dateFrom, required this.dateTo, required this.source, this.sourceDeviceName, this.sourceAppName, final  Map<String, dynamic>? metadata, this.isManualEntry = false, this.syncedAt}): _metadata = metadata;
  factory _AppHealthDataPoint.fromJson(Map<String, dynamic> json) => _$AppHealthDataPointFromJson(json);

@override final  String id;
@override final  AppHealthDataType type;
@override final  double value;
@override final  AppHealthDataUnit unit;
@override final  DateTime timestamp;
@override final  DateTime dateFrom;
@override final  DateTime dateTo;
@override final  AppHealthDataSource source;
@override final  String? sourceDeviceName;
@override final  String? sourceAppName;
 final  Map<String, dynamic>? _metadata;
@override Map<String, dynamic>? get metadata {
  final value = _metadata;
  if (value == null) return null;
  if (_metadata is EqualUnmodifiableMapView) return _metadata;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

@override@JsonKey() final  bool isManualEntry;
@override final  DateTime? syncedAt;

/// Create a copy of AppHealthDataPoint
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AppHealthDataPointCopyWith<_AppHealthDataPoint> get copyWith => __$AppHealthDataPointCopyWithImpl<_AppHealthDataPoint>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AppHealthDataPointToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AppHealthDataPoint&&(identical(other.id, id) || other.id == id)&&(identical(other.type, type) || other.type == type)&&(identical(other.value, value) || other.value == value)&&(identical(other.unit, unit) || other.unit == unit)&&(identical(other.timestamp, timestamp) || other.timestamp == timestamp)&&(identical(other.dateFrom, dateFrom) || other.dateFrom == dateFrom)&&(identical(other.dateTo, dateTo) || other.dateTo == dateTo)&&(identical(other.source, source) || other.source == source)&&(identical(other.sourceDeviceName, sourceDeviceName) || other.sourceDeviceName == sourceDeviceName)&&(identical(other.sourceAppName, sourceAppName) || other.sourceAppName == sourceAppName)&&const DeepCollectionEquality().equals(other._metadata, _metadata)&&(identical(other.isManualEntry, isManualEntry) || other.isManualEntry == isManualEntry)&&(identical(other.syncedAt, syncedAt) || other.syncedAt == syncedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,type,value,unit,timestamp,dateFrom,dateTo,source,sourceDeviceName,sourceAppName,const DeepCollectionEquality().hash(_metadata),isManualEntry,syncedAt);

@override
String toString() {
  return 'AppHealthDataPoint(id: $id, type: $type, value: $value, unit: $unit, timestamp: $timestamp, dateFrom: $dateFrom, dateTo: $dateTo, source: $source, sourceDeviceName: $sourceDeviceName, sourceAppName: $sourceAppName, metadata: $metadata, isManualEntry: $isManualEntry, syncedAt: $syncedAt)';
}


}

/// @nodoc
abstract mixin class _$AppHealthDataPointCopyWith<$Res> implements $AppHealthDataPointCopyWith<$Res> {
  factory _$AppHealthDataPointCopyWith(_AppHealthDataPoint value, $Res Function(_AppHealthDataPoint) _then) = __$AppHealthDataPointCopyWithImpl;
@override @useResult
$Res call({
 String id, AppHealthDataType type, double value, AppHealthDataUnit unit, DateTime timestamp, DateTime dateFrom, DateTime dateTo, AppHealthDataSource source, String? sourceDeviceName, String? sourceAppName, Map<String, dynamic>? metadata, bool isManualEntry, DateTime? syncedAt
});




}
/// @nodoc
class __$AppHealthDataPointCopyWithImpl<$Res>
    implements _$AppHealthDataPointCopyWith<$Res> {
  __$AppHealthDataPointCopyWithImpl(this._self, this._then);

  final _AppHealthDataPoint _self;
  final $Res Function(_AppHealthDataPoint) _then;

/// Create a copy of AppHealthDataPoint
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? type = null,Object? value = null,Object? unit = null,Object? timestamp = null,Object? dateFrom = null,Object? dateTo = null,Object? source = null,Object? sourceDeviceName = freezed,Object? sourceAppName = freezed,Object? metadata = freezed,Object? isManualEntry = null,Object? syncedAt = freezed,}) {
  return _then(_AppHealthDataPoint(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as AppHealthDataType,value: null == value ? _self.value : value // ignore: cast_nullable_to_non_nullable
as double,unit: null == unit ? _self.unit : unit // ignore: cast_nullable_to_non_nullable
as AppHealthDataUnit,timestamp: null == timestamp ? _self.timestamp : timestamp // ignore: cast_nullable_to_non_nullable
as DateTime,dateFrom: null == dateFrom ? _self.dateFrom : dateFrom // ignore: cast_nullable_to_non_nullable
as DateTime,dateTo: null == dateTo ? _self.dateTo : dateTo // ignore: cast_nullable_to_non_nullable
as DateTime,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as AppHealthDataSource,sourceDeviceName: freezed == sourceDeviceName ? _self.sourceDeviceName : sourceDeviceName // ignore: cast_nullable_to_non_nullable
as String?,sourceAppName: freezed == sourceAppName ? _self.sourceAppName : sourceAppName // ignore: cast_nullable_to_non_nullable
as String?,metadata: freezed == metadata ? _self._metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,isManualEntry: null == isManualEntry ? _self.isManualEntry : isManualEntry // ignore: cast_nullable_to_non_nullable
as bool,syncedAt: freezed == syncedAt ? _self.syncedAt : syncedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$HealthStats {

 DateTime get date; Duration get period;// Activity
 int? get steps; double? get activeCalories; double? get distanceKm; int? get flightsClimbed; int? get activeMinutes; int? get workoutMinutes;// Heart
 double? get averageHeartRate; double? get restingHeartRate; double? get heartRateVariability; double? get minHeartRate; double? get maxHeartRate;// Sleep
 int? get sleepDurationMinutes; int? get deepSleepMinutes; int? get remSleepMinutes; int? get lightSleepMinutes; int? get awakeMinutes; double? get sleepEfficiency;// Body
 double? get weight; double? get bodyFatPercentage; double? get bmi;// Vitals
 double? get bloodOxygen; int? get bloodPressureSystolic; int? get bloodPressureDiastolic;// Wellness Scores
 int? get recoveryScore; int? get readinessScore; int? get strainScore; int? get stressLevel; double? get bodyBattery;// Nutrition
 int? get caloriesConsumed; int? get proteinGrams; int? get carbsGrams; int? get fatGrams; double? get waterLiters;// Mindfulness
 int? get mindfulMinutes;// Metadata
 List<AppHealthDataSource>? get sources; DateTime? get lastSyncedAt;
/// Create a copy of HealthStats
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$HealthStatsCopyWith<HealthStats> get copyWith => _$HealthStatsCopyWithImpl<HealthStats>(this as HealthStats, _$identity);

  /// Serializes this HealthStats to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is HealthStats&&(identical(other.date, date) || other.date == date)&&(identical(other.period, period) || other.period == period)&&(identical(other.steps, steps) || other.steps == steps)&&(identical(other.activeCalories, activeCalories) || other.activeCalories == activeCalories)&&(identical(other.distanceKm, distanceKm) || other.distanceKm == distanceKm)&&(identical(other.flightsClimbed, flightsClimbed) || other.flightsClimbed == flightsClimbed)&&(identical(other.activeMinutes, activeMinutes) || other.activeMinutes == activeMinutes)&&(identical(other.workoutMinutes, workoutMinutes) || other.workoutMinutes == workoutMinutes)&&(identical(other.averageHeartRate, averageHeartRate) || other.averageHeartRate == averageHeartRate)&&(identical(other.restingHeartRate, restingHeartRate) || other.restingHeartRate == restingHeartRate)&&(identical(other.heartRateVariability, heartRateVariability) || other.heartRateVariability == heartRateVariability)&&(identical(other.minHeartRate, minHeartRate) || other.minHeartRate == minHeartRate)&&(identical(other.maxHeartRate, maxHeartRate) || other.maxHeartRate == maxHeartRate)&&(identical(other.sleepDurationMinutes, sleepDurationMinutes) || other.sleepDurationMinutes == sleepDurationMinutes)&&(identical(other.deepSleepMinutes, deepSleepMinutes) || other.deepSleepMinutes == deepSleepMinutes)&&(identical(other.remSleepMinutes, remSleepMinutes) || other.remSleepMinutes == remSleepMinutes)&&(identical(other.lightSleepMinutes, lightSleepMinutes) || other.lightSleepMinutes == lightSleepMinutes)&&(identical(other.awakeMinutes, awakeMinutes) || other.awakeMinutes == awakeMinutes)&&(identical(other.sleepEfficiency, sleepEfficiency) || other.sleepEfficiency == sleepEfficiency)&&(identical(other.weight, weight) || other.weight == weight)&&(identical(other.bodyFatPercentage, bodyFatPercentage) || other.bodyFatPercentage == bodyFatPercentage)&&(identical(other.bmi, bmi) || other.bmi == bmi)&&(identical(other.bloodOxygen, bloodOxygen) || other.bloodOxygen == bloodOxygen)&&(identical(other.bloodPressureSystolic, bloodPressureSystolic) || other.bloodPressureSystolic == bloodPressureSystolic)&&(identical(other.bloodPressureDiastolic, bloodPressureDiastolic) || other.bloodPressureDiastolic == bloodPressureDiastolic)&&(identical(other.recoveryScore, recoveryScore) || other.recoveryScore == recoveryScore)&&(identical(other.readinessScore, readinessScore) || other.readinessScore == readinessScore)&&(identical(other.strainScore, strainScore) || other.strainScore == strainScore)&&(identical(other.stressLevel, stressLevel) || other.stressLevel == stressLevel)&&(identical(other.bodyBattery, bodyBattery) || other.bodyBattery == bodyBattery)&&(identical(other.caloriesConsumed, caloriesConsumed) || other.caloriesConsumed == caloriesConsumed)&&(identical(other.proteinGrams, proteinGrams) || other.proteinGrams == proteinGrams)&&(identical(other.carbsGrams, carbsGrams) || other.carbsGrams == carbsGrams)&&(identical(other.fatGrams, fatGrams) || other.fatGrams == fatGrams)&&(identical(other.waterLiters, waterLiters) || other.waterLiters == waterLiters)&&(identical(other.mindfulMinutes, mindfulMinutes) || other.mindfulMinutes == mindfulMinutes)&&const DeepCollectionEquality().equals(other.sources, sources)&&(identical(other.lastSyncedAt, lastSyncedAt) || other.lastSyncedAt == lastSyncedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,date,period,steps,activeCalories,distanceKm,flightsClimbed,activeMinutes,workoutMinutes,averageHeartRate,restingHeartRate,heartRateVariability,minHeartRate,maxHeartRate,sleepDurationMinutes,deepSleepMinutes,remSleepMinutes,lightSleepMinutes,awakeMinutes,sleepEfficiency,weight,bodyFatPercentage,bmi,bloodOxygen,bloodPressureSystolic,bloodPressureDiastolic,recoveryScore,readinessScore,strainScore,stressLevel,bodyBattery,caloriesConsumed,proteinGrams,carbsGrams,fatGrams,waterLiters,mindfulMinutes,const DeepCollectionEquality().hash(sources),lastSyncedAt]);

@override
String toString() {
  return 'HealthStats(date: $date, period: $period, steps: $steps, activeCalories: $activeCalories, distanceKm: $distanceKm, flightsClimbed: $flightsClimbed, activeMinutes: $activeMinutes, workoutMinutes: $workoutMinutes, averageHeartRate: $averageHeartRate, restingHeartRate: $restingHeartRate, heartRateVariability: $heartRateVariability, minHeartRate: $minHeartRate, maxHeartRate: $maxHeartRate, sleepDurationMinutes: $sleepDurationMinutes, deepSleepMinutes: $deepSleepMinutes, remSleepMinutes: $remSleepMinutes, lightSleepMinutes: $lightSleepMinutes, awakeMinutes: $awakeMinutes, sleepEfficiency: $sleepEfficiency, weight: $weight, bodyFatPercentage: $bodyFatPercentage, bmi: $bmi, bloodOxygen: $bloodOxygen, bloodPressureSystolic: $bloodPressureSystolic, bloodPressureDiastolic: $bloodPressureDiastolic, recoveryScore: $recoveryScore, readinessScore: $readinessScore, strainScore: $strainScore, stressLevel: $stressLevel, bodyBattery: $bodyBattery, caloriesConsumed: $caloriesConsumed, proteinGrams: $proteinGrams, carbsGrams: $carbsGrams, fatGrams: $fatGrams, waterLiters: $waterLiters, mindfulMinutes: $mindfulMinutes, sources: $sources, lastSyncedAt: $lastSyncedAt)';
}


}

/// @nodoc
abstract mixin class $HealthStatsCopyWith<$Res>  {
  factory $HealthStatsCopyWith(HealthStats value, $Res Function(HealthStats) _then) = _$HealthStatsCopyWithImpl;
@useResult
$Res call({
 DateTime date, Duration period, int? steps, double? activeCalories, double? distanceKm, int? flightsClimbed, int? activeMinutes, int? workoutMinutes, double? averageHeartRate, double? restingHeartRate, double? heartRateVariability, double? minHeartRate, double? maxHeartRate, int? sleepDurationMinutes, int? deepSleepMinutes, int? remSleepMinutes, int? lightSleepMinutes, int? awakeMinutes, double? sleepEfficiency, double? weight, double? bodyFatPercentage, double? bmi, double? bloodOxygen, int? bloodPressureSystolic, int? bloodPressureDiastolic, int? recoveryScore, int? readinessScore, int? strainScore, int? stressLevel, double? bodyBattery, int? caloriesConsumed, int? proteinGrams, int? carbsGrams, int? fatGrams, double? waterLiters, int? mindfulMinutes, List<AppHealthDataSource>? sources, DateTime? lastSyncedAt
});




}
/// @nodoc
class _$HealthStatsCopyWithImpl<$Res>
    implements $HealthStatsCopyWith<$Res> {
  _$HealthStatsCopyWithImpl(this._self, this._then);

  final HealthStats _self;
  final $Res Function(HealthStats) _then;

/// Create a copy of HealthStats
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? date = null,Object? period = null,Object? steps = freezed,Object? activeCalories = freezed,Object? distanceKm = freezed,Object? flightsClimbed = freezed,Object? activeMinutes = freezed,Object? workoutMinutes = freezed,Object? averageHeartRate = freezed,Object? restingHeartRate = freezed,Object? heartRateVariability = freezed,Object? minHeartRate = freezed,Object? maxHeartRate = freezed,Object? sleepDurationMinutes = freezed,Object? deepSleepMinutes = freezed,Object? remSleepMinutes = freezed,Object? lightSleepMinutes = freezed,Object? awakeMinutes = freezed,Object? sleepEfficiency = freezed,Object? weight = freezed,Object? bodyFatPercentage = freezed,Object? bmi = freezed,Object? bloodOxygen = freezed,Object? bloodPressureSystolic = freezed,Object? bloodPressureDiastolic = freezed,Object? recoveryScore = freezed,Object? readinessScore = freezed,Object? strainScore = freezed,Object? stressLevel = freezed,Object? bodyBattery = freezed,Object? caloriesConsumed = freezed,Object? proteinGrams = freezed,Object? carbsGrams = freezed,Object? fatGrams = freezed,Object? waterLiters = freezed,Object? mindfulMinutes = freezed,Object? sources = freezed,Object? lastSyncedAt = freezed,}) {
  return _then(_self.copyWith(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as DateTime,period: null == period ? _self.period : period // ignore: cast_nullable_to_non_nullable
as Duration,steps: freezed == steps ? _self.steps : steps // ignore: cast_nullable_to_non_nullable
as int?,activeCalories: freezed == activeCalories ? _self.activeCalories : activeCalories // ignore: cast_nullable_to_non_nullable
as double?,distanceKm: freezed == distanceKm ? _self.distanceKm : distanceKm // ignore: cast_nullable_to_non_nullable
as double?,flightsClimbed: freezed == flightsClimbed ? _self.flightsClimbed : flightsClimbed // ignore: cast_nullable_to_non_nullable
as int?,activeMinutes: freezed == activeMinutes ? _self.activeMinutes : activeMinutes // ignore: cast_nullable_to_non_nullable
as int?,workoutMinutes: freezed == workoutMinutes ? _self.workoutMinutes : workoutMinutes // ignore: cast_nullable_to_non_nullable
as int?,averageHeartRate: freezed == averageHeartRate ? _self.averageHeartRate : averageHeartRate // ignore: cast_nullable_to_non_nullable
as double?,restingHeartRate: freezed == restingHeartRate ? _self.restingHeartRate : restingHeartRate // ignore: cast_nullable_to_non_nullable
as double?,heartRateVariability: freezed == heartRateVariability ? _self.heartRateVariability : heartRateVariability // ignore: cast_nullable_to_non_nullable
as double?,minHeartRate: freezed == minHeartRate ? _self.minHeartRate : minHeartRate // ignore: cast_nullable_to_non_nullable
as double?,maxHeartRate: freezed == maxHeartRate ? _self.maxHeartRate : maxHeartRate // ignore: cast_nullable_to_non_nullable
as double?,sleepDurationMinutes: freezed == sleepDurationMinutes ? _self.sleepDurationMinutes : sleepDurationMinutes // ignore: cast_nullable_to_non_nullable
as int?,deepSleepMinutes: freezed == deepSleepMinutes ? _self.deepSleepMinutes : deepSleepMinutes // ignore: cast_nullable_to_non_nullable
as int?,remSleepMinutes: freezed == remSleepMinutes ? _self.remSleepMinutes : remSleepMinutes // ignore: cast_nullable_to_non_nullable
as int?,lightSleepMinutes: freezed == lightSleepMinutes ? _self.lightSleepMinutes : lightSleepMinutes // ignore: cast_nullable_to_non_nullable
as int?,awakeMinutes: freezed == awakeMinutes ? _self.awakeMinutes : awakeMinutes // ignore: cast_nullable_to_non_nullable
as int?,sleepEfficiency: freezed == sleepEfficiency ? _self.sleepEfficiency : sleepEfficiency // ignore: cast_nullable_to_non_nullable
as double?,weight: freezed == weight ? _self.weight : weight // ignore: cast_nullable_to_non_nullable
as double?,bodyFatPercentage: freezed == bodyFatPercentage ? _self.bodyFatPercentage : bodyFatPercentage // ignore: cast_nullable_to_non_nullable
as double?,bmi: freezed == bmi ? _self.bmi : bmi // ignore: cast_nullable_to_non_nullable
as double?,bloodOxygen: freezed == bloodOxygen ? _self.bloodOxygen : bloodOxygen // ignore: cast_nullable_to_non_nullable
as double?,bloodPressureSystolic: freezed == bloodPressureSystolic ? _self.bloodPressureSystolic : bloodPressureSystolic // ignore: cast_nullable_to_non_nullable
as int?,bloodPressureDiastolic: freezed == bloodPressureDiastolic ? _self.bloodPressureDiastolic : bloodPressureDiastolic // ignore: cast_nullable_to_non_nullable
as int?,recoveryScore: freezed == recoveryScore ? _self.recoveryScore : recoveryScore // ignore: cast_nullable_to_non_nullable
as int?,readinessScore: freezed == readinessScore ? _self.readinessScore : readinessScore // ignore: cast_nullable_to_non_nullable
as int?,strainScore: freezed == strainScore ? _self.strainScore : strainScore // ignore: cast_nullable_to_non_nullable
as int?,stressLevel: freezed == stressLevel ? _self.stressLevel : stressLevel // ignore: cast_nullable_to_non_nullable
as int?,bodyBattery: freezed == bodyBattery ? _self.bodyBattery : bodyBattery // ignore: cast_nullable_to_non_nullable
as double?,caloriesConsumed: freezed == caloriesConsumed ? _self.caloriesConsumed : caloriesConsumed // ignore: cast_nullable_to_non_nullable
as int?,proteinGrams: freezed == proteinGrams ? _self.proteinGrams : proteinGrams // ignore: cast_nullable_to_non_nullable
as int?,carbsGrams: freezed == carbsGrams ? _self.carbsGrams : carbsGrams // ignore: cast_nullable_to_non_nullable
as int?,fatGrams: freezed == fatGrams ? _self.fatGrams : fatGrams // ignore: cast_nullable_to_non_nullable
as int?,waterLiters: freezed == waterLiters ? _self.waterLiters : waterLiters // ignore: cast_nullable_to_non_nullable
as double?,mindfulMinutes: freezed == mindfulMinutes ? _self.mindfulMinutes : mindfulMinutes // ignore: cast_nullable_to_non_nullable
as int?,sources: freezed == sources ? _self.sources : sources // ignore: cast_nullable_to_non_nullable
as List<AppHealthDataSource>?,lastSyncedAt: freezed == lastSyncedAt ? _self.lastSyncedAt : lastSyncedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [HealthStats].
extension HealthStatsPatterns on HealthStats {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _HealthStats value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _HealthStats() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _HealthStats value)  $default,){
final _that = this;
switch (_that) {
case _HealthStats():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _HealthStats value)?  $default,){
final _that = this;
switch (_that) {
case _HealthStats() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( DateTime date,  Duration period,  int? steps,  double? activeCalories,  double? distanceKm,  int? flightsClimbed,  int? activeMinutes,  int? workoutMinutes,  double? averageHeartRate,  double? restingHeartRate,  double? heartRateVariability,  double? minHeartRate,  double? maxHeartRate,  int? sleepDurationMinutes,  int? deepSleepMinutes,  int? remSleepMinutes,  int? lightSleepMinutes,  int? awakeMinutes,  double? sleepEfficiency,  double? weight,  double? bodyFatPercentage,  double? bmi,  double? bloodOxygen,  int? bloodPressureSystolic,  int? bloodPressureDiastolic,  int? recoveryScore,  int? readinessScore,  int? strainScore,  int? stressLevel,  double? bodyBattery,  int? caloriesConsumed,  int? proteinGrams,  int? carbsGrams,  int? fatGrams,  double? waterLiters,  int? mindfulMinutes,  List<AppHealthDataSource>? sources,  DateTime? lastSyncedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _HealthStats() when $default != null:
return $default(_that.date,_that.period,_that.steps,_that.activeCalories,_that.distanceKm,_that.flightsClimbed,_that.activeMinutes,_that.workoutMinutes,_that.averageHeartRate,_that.restingHeartRate,_that.heartRateVariability,_that.minHeartRate,_that.maxHeartRate,_that.sleepDurationMinutes,_that.deepSleepMinutes,_that.remSleepMinutes,_that.lightSleepMinutes,_that.awakeMinutes,_that.sleepEfficiency,_that.weight,_that.bodyFatPercentage,_that.bmi,_that.bloodOxygen,_that.bloodPressureSystolic,_that.bloodPressureDiastolic,_that.recoveryScore,_that.readinessScore,_that.strainScore,_that.stressLevel,_that.bodyBattery,_that.caloriesConsumed,_that.proteinGrams,_that.carbsGrams,_that.fatGrams,_that.waterLiters,_that.mindfulMinutes,_that.sources,_that.lastSyncedAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( DateTime date,  Duration period,  int? steps,  double? activeCalories,  double? distanceKm,  int? flightsClimbed,  int? activeMinutes,  int? workoutMinutes,  double? averageHeartRate,  double? restingHeartRate,  double? heartRateVariability,  double? minHeartRate,  double? maxHeartRate,  int? sleepDurationMinutes,  int? deepSleepMinutes,  int? remSleepMinutes,  int? lightSleepMinutes,  int? awakeMinutes,  double? sleepEfficiency,  double? weight,  double? bodyFatPercentage,  double? bmi,  double? bloodOxygen,  int? bloodPressureSystolic,  int? bloodPressureDiastolic,  int? recoveryScore,  int? readinessScore,  int? strainScore,  int? stressLevel,  double? bodyBattery,  int? caloriesConsumed,  int? proteinGrams,  int? carbsGrams,  int? fatGrams,  double? waterLiters,  int? mindfulMinutes,  List<AppHealthDataSource>? sources,  DateTime? lastSyncedAt)  $default,) {final _that = this;
switch (_that) {
case _HealthStats():
return $default(_that.date,_that.period,_that.steps,_that.activeCalories,_that.distanceKm,_that.flightsClimbed,_that.activeMinutes,_that.workoutMinutes,_that.averageHeartRate,_that.restingHeartRate,_that.heartRateVariability,_that.minHeartRate,_that.maxHeartRate,_that.sleepDurationMinutes,_that.deepSleepMinutes,_that.remSleepMinutes,_that.lightSleepMinutes,_that.awakeMinutes,_that.sleepEfficiency,_that.weight,_that.bodyFatPercentage,_that.bmi,_that.bloodOxygen,_that.bloodPressureSystolic,_that.bloodPressureDiastolic,_that.recoveryScore,_that.readinessScore,_that.strainScore,_that.stressLevel,_that.bodyBattery,_that.caloriesConsumed,_that.proteinGrams,_that.carbsGrams,_that.fatGrams,_that.waterLiters,_that.mindfulMinutes,_that.sources,_that.lastSyncedAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( DateTime date,  Duration period,  int? steps,  double? activeCalories,  double? distanceKm,  int? flightsClimbed,  int? activeMinutes,  int? workoutMinutes,  double? averageHeartRate,  double? restingHeartRate,  double? heartRateVariability,  double? minHeartRate,  double? maxHeartRate,  int? sleepDurationMinutes,  int? deepSleepMinutes,  int? remSleepMinutes,  int? lightSleepMinutes,  int? awakeMinutes,  double? sleepEfficiency,  double? weight,  double? bodyFatPercentage,  double? bmi,  double? bloodOxygen,  int? bloodPressureSystolic,  int? bloodPressureDiastolic,  int? recoveryScore,  int? readinessScore,  int? strainScore,  int? stressLevel,  double? bodyBattery,  int? caloriesConsumed,  int? proteinGrams,  int? carbsGrams,  int? fatGrams,  double? waterLiters,  int? mindfulMinutes,  List<AppHealthDataSource>? sources,  DateTime? lastSyncedAt)?  $default,) {final _that = this;
switch (_that) {
case _HealthStats() when $default != null:
return $default(_that.date,_that.period,_that.steps,_that.activeCalories,_that.distanceKm,_that.flightsClimbed,_that.activeMinutes,_that.workoutMinutes,_that.averageHeartRate,_that.restingHeartRate,_that.heartRateVariability,_that.minHeartRate,_that.maxHeartRate,_that.sleepDurationMinutes,_that.deepSleepMinutes,_that.remSleepMinutes,_that.lightSleepMinutes,_that.awakeMinutes,_that.sleepEfficiency,_that.weight,_that.bodyFatPercentage,_that.bmi,_that.bloodOxygen,_that.bloodPressureSystolic,_that.bloodPressureDiastolic,_that.recoveryScore,_that.readinessScore,_that.strainScore,_that.stressLevel,_that.bodyBattery,_that.caloriesConsumed,_that.proteinGrams,_that.carbsGrams,_that.fatGrams,_that.waterLiters,_that.mindfulMinutes,_that.sources,_that.lastSyncedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _HealthStats implements HealthStats {
  const _HealthStats({required this.date, required this.period, this.steps, this.activeCalories, this.distanceKm, this.flightsClimbed, this.activeMinutes, this.workoutMinutes, this.averageHeartRate, this.restingHeartRate, this.heartRateVariability, this.minHeartRate, this.maxHeartRate, this.sleepDurationMinutes, this.deepSleepMinutes, this.remSleepMinutes, this.lightSleepMinutes, this.awakeMinutes, this.sleepEfficiency, this.weight, this.bodyFatPercentage, this.bmi, this.bloodOxygen, this.bloodPressureSystolic, this.bloodPressureDiastolic, this.recoveryScore, this.readinessScore, this.strainScore, this.stressLevel, this.bodyBattery, this.caloriesConsumed, this.proteinGrams, this.carbsGrams, this.fatGrams, this.waterLiters, this.mindfulMinutes, final  List<AppHealthDataSource>? sources, this.lastSyncedAt}): _sources = sources;
  factory _HealthStats.fromJson(Map<String, dynamic> json) => _$HealthStatsFromJson(json);

@override final  DateTime date;
@override final  Duration period;
// Activity
@override final  int? steps;
@override final  double? activeCalories;
@override final  double? distanceKm;
@override final  int? flightsClimbed;
@override final  int? activeMinutes;
@override final  int? workoutMinutes;
// Heart
@override final  double? averageHeartRate;
@override final  double? restingHeartRate;
@override final  double? heartRateVariability;
@override final  double? minHeartRate;
@override final  double? maxHeartRate;
// Sleep
@override final  int? sleepDurationMinutes;
@override final  int? deepSleepMinutes;
@override final  int? remSleepMinutes;
@override final  int? lightSleepMinutes;
@override final  int? awakeMinutes;
@override final  double? sleepEfficiency;
// Body
@override final  double? weight;
@override final  double? bodyFatPercentage;
@override final  double? bmi;
// Vitals
@override final  double? bloodOxygen;
@override final  int? bloodPressureSystolic;
@override final  int? bloodPressureDiastolic;
// Wellness Scores
@override final  int? recoveryScore;
@override final  int? readinessScore;
@override final  int? strainScore;
@override final  int? stressLevel;
@override final  double? bodyBattery;
// Nutrition
@override final  int? caloriesConsumed;
@override final  int? proteinGrams;
@override final  int? carbsGrams;
@override final  int? fatGrams;
@override final  double? waterLiters;
// Mindfulness
@override final  int? mindfulMinutes;
// Metadata
 final  List<AppHealthDataSource>? _sources;
// Metadata
@override List<AppHealthDataSource>? get sources {
  final value = _sources;
  if (value == null) return null;
  if (_sources is EqualUnmodifiableListView) return _sources;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

@override final  DateTime? lastSyncedAt;

/// Create a copy of HealthStats
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$HealthStatsCopyWith<_HealthStats> get copyWith => __$HealthStatsCopyWithImpl<_HealthStats>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$HealthStatsToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _HealthStats&&(identical(other.date, date) || other.date == date)&&(identical(other.period, period) || other.period == period)&&(identical(other.steps, steps) || other.steps == steps)&&(identical(other.activeCalories, activeCalories) || other.activeCalories == activeCalories)&&(identical(other.distanceKm, distanceKm) || other.distanceKm == distanceKm)&&(identical(other.flightsClimbed, flightsClimbed) || other.flightsClimbed == flightsClimbed)&&(identical(other.activeMinutes, activeMinutes) || other.activeMinutes == activeMinutes)&&(identical(other.workoutMinutes, workoutMinutes) || other.workoutMinutes == workoutMinutes)&&(identical(other.averageHeartRate, averageHeartRate) || other.averageHeartRate == averageHeartRate)&&(identical(other.restingHeartRate, restingHeartRate) || other.restingHeartRate == restingHeartRate)&&(identical(other.heartRateVariability, heartRateVariability) || other.heartRateVariability == heartRateVariability)&&(identical(other.minHeartRate, minHeartRate) || other.minHeartRate == minHeartRate)&&(identical(other.maxHeartRate, maxHeartRate) || other.maxHeartRate == maxHeartRate)&&(identical(other.sleepDurationMinutes, sleepDurationMinutes) || other.sleepDurationMinutes == sleepDurationMinutes)&&(identical(other.deepSleepMinutes, deepSleepMinutes) || other.deepSleepMinutes == deepSleepMinutes)&&(identical(other.remSleepMinutes, remSleepMinutes) || other.remSleepMinutes == remSleepMinutes)&&(identical(other.lightSleepMinutes, lightSleepMinutes) || other.lightSleepMinutes == lightSleepMinutes)&&(identical(other.awakeMinutes, awakeMinutes) || other.awakeMinutes == awakeMinutes)&&(identical(other.sleepEfficiency, sleepEfficiency) || other.sleepEfficiency == sleepEfficiency)&&(identical(other.weight, weight) || other.weight == weight)&&(identical(other.bodyFatPercentage, bodyFatPercentage) || other.bodyFatPercentage == bodyFatPercentage)&&(identical(other.bmi, bmi) || other.bmi == bmi)&&(identical(other.bloodOxygen, bloodOxygen) || other.bloodOxygen == bloodOxygen)&&(identical(other.bloodPressureSystolic, bloodPressureSystolic) || other.bloodPressureSystolic == bloodPressureSystolic)&&(identical(other.bloodPressureDiastolic, bloodPressureDiastolic) || other.bloodPressureDiastolic == bloodPressureDiastolic)&&(identical(other.recoveryScore, recoveryScore) || other.recoveryScore == recoveryScore)&&(identical(other.readinessScore, readinessScore) || other.readinessScore == readinessScore)&&(identical(other.strainScore, strainScore) || other.strainScore == strainScore)&&(identical(other.stressLevel, stressLevel) || other.stressLevel == stressLevel)&&(identical(other.bodyBattery, bodyBattery) || other.bodyBattery == bodyBattery)&&(identical(other.caloriesConsumed, caloriesConsumed) || other.caloriesConsumed == caloriesConsumed)&&(identical(other.proteinGrams, proteinGrams) || other.proteinGrams == proteinGrams)&&(identical(other.carbsGrams, carbsGrams) || other.carbsGrams == carbsGrams)&&(identical(other.fatGrams, fatGrams) || other.fatGrams == fatGrams)&&(identical(other.waterLiters, waterLiters) || other.waterLiters == waterLiters)&&(identical(other.mindfulMinutes, mindfulMinutes) || other.mindfulMinutes == mindfulMinutes)&&const DeepCollectionEquality().equals(other._sources, _sources)&&(identical(other.lastSyncedAt, lastSyncedAt) || other.lastSyncedAt == lastSyncedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,date,period,steps,activeCalories,distanceKm,flightsClimbed,activeMinutes,workoutMinutes,averageHeartRate,restingHeartRate,heartRateVariability,minHeartRate,maxHeartRate,sleepDurationMinutes,deepSleepMinutes,remSleepMinutes,lightSleepMinutes,awakeMinutes,sleepEfficiency,weight,bodyFatPercentage,bmi,bloodOxygen,bloodPressureSystolic,bloodPressureDiastolic,recoveryScore,readinessScore,strainScore,stressLevel,bodyBattery,caloriesConsumed,proteinGrams,carbsGrams,fatGrams,waterLiters,mindfulMinutes,const DeepCollectionEquality().hash(_sources),lastSyncedAt]);

@override
String toString() {
  return 'HealthStats(date: $date, period: $period, steps: $steps, activeCalories: $activeCalories, distanceKm: $distanceKm, flightsClimbed: $flightsClimbed, activeMinutes: $activeMinutes, workoutMinutes: $workoutMinutes, averageHeartRate: $averageHeartRate, restingHeartRate: $restingHeartRate, heartRateVariability: $heartRateVariability, minHeartRate: $minHeartRate, maxHeartRate: $maxHeartRate, sleepDurationMinutes: $sleepDurationMinutes, deepSleepMinutes: $deepSleepMinutes, remSleepMinutes: $remSleepMinutes, lightSleepMinutes: $lightSleepMinutes, awakeMinutes: $awakeMinutes, sleepEfficiency: $sleepEfficiency, weight: $weight, bodyFatPercentage: $bodyFatPercentage, bmi: $bmi, bloodOxygen: $bloodOxygen, bloodPressureSystolic: $bloodPressureSystolic, bloodPressureDiastolic: $bloodPressureDiastolic, recoveryScore: $recoveryScore, readinessScore: $readinessScore, strainScore: $strainScore, stressLevel: $stressLevel, bodyBattery: $bodyBattery, caloriesConsumed: $caloriesConsumed, proteinGrams: $proteinGrams, carbsGrams: $carbsGrams, fatGrams: $fatGrams, waterLiters: $waterLiters, mindfulMinutes: $mindfulMinutes, sources: $sources, lastSyncedAt: $lastSyncedAt)';
}


}

/// @nodoc
abstract mixin class _$HealthStatsCopyWith<$Res> implements $HealthStatsCopyWith<$Res> {
  factory _$HealthStatsCopyWith(_HealthStats value, $Res Function(_HealthStats) _then) = __$HealthStatsCopyWithImpl;
@override @useResult
$Res call({
 DateTime date, Duration period, int? steps, double? activeCalories, double? distanceKm, int? flightsClimbed, int? activeMinutes, int? workoutMinutes, double? averageHeartRate, double? restingHeartRate, double? heartRateVariability, double? minHeartRate, double? maxHeartRate, int? sleepDurationMinutes, int? deepSleepMinutes, int? remSleepMinutes, int? lightSleepMinutes, int? awakeMinutes, double? sleepEfficiency, double? weight, double? bodyFatPercentage, double? bmi, double? bloodOxygen, int? bloodPressureSystolic, int? bloodPressureDiastolic, int? recoveryScore, int? readinessScore, int? strainScore, int? stressLevel, double? bodyBattery, int? caloriesConsumed, int? proteinGrams, int? carbsGrams, int? fatGrams, double? waterLiters, int? mindfulMinutes, List<AppHealthDataSource>? sources, DateTime? lastSyncedAt
});




}
/// @nodoc
class __$HealthStatsCopyWithImpl<$Res>
    implements _$HealthStatsCopyWith<$Res> {
  __$HealthStatsCopyWithImpl(this._self, this._then);

  final _HealthStats _self;
  final $Res Function(_HealthStats) _then;

/// Create a copy of HealthStats
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? date = null,Object? period = null,Object? steps = freezed,Object? activeCalories = freezed,Object? distanceKm = freezed,Object? flightsClimbed = freezed,Object? activeMinutes = freezed,Object? workoutMinutes = freezed,Object? averageHeartRate = freezed,Object? restingHeartRate = freezed,Object? heartRateVariability = freezed,Object? minHeartRate = freezed,Object? maxHeartRate = freezed,Object? sleepDurationMinutes = freezed,Object? deepSleepMinutes = freezed,Object? remSleepMinutes = freezed,Object? lightSleepMinutes = freezed,Object? awakeMinutes = freezed,Object? sleepEfficiency = freezed,Object? weight = freezed,Object? bodyFatPercentage = freezed,Object? bmi = freezed,Object? bloodOxygen = freezed,Object? bloodPressureSystolic = freezed,Object? bloodPressureDiastolic = freezed,Object? recoveryScore = freezed,Object? readinessScore = freezed,Object? strainScore = freezed,Object? stressLevel = freezed,Object? bodyBattery = freezed,Object? caloriesConsumed = freezed,Object? proteinGrams = freezed,Object? carbsGrams = freezed,Object? fatGrams = freezed,Object? waterLiters = freezed,Object? mindfulMinutes = freezed,Object? sources = freezed,Object? lastSyncedAt = freezed,}) {
  return _then(_HealthStats(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as DateTime,period: null == period ? _self.period : period // ignore: cast_nullable_to_non_nullable
as Duration,steps: freezed == steps ? _self.steps : steps // ignore: cast_nullable_to_non_nullable
as int?,activeCalories: freezed == activeCalories ? _self.activeCalories : activeCalories // ignore: cast_nullable_to_non_nullable
as double?,distanceKm: freezed == distanceKm ? _self.distanceKm : distanceKm // ignore: cast_nullable_to_non_nullable
as double?,flightsClimbed: freezed == flightsClimbed ? _self.flightsClimbed : flightsClimbed // ignore: cast_nullable_to_non_nullable
as int?,activeMinutes: freezed == activeMinutes ? _self.activeMinutes : activeMinutes // ignore: cast_nullable_to_non_nullable
as int?,workoutMinutes: freezed == workoutMinutes ? _self.workoutMinutes : workoutMinutes // ignore: cast_nullable_to_non_nullable
as int?,averageHeartRate: freezed == averageHeartRate ? _self.averageHeartRate : averageHeartRate // ignore: cast_nullable_to_non_nullable
as double?,restingHeartRate: freezed == restingHeartRate ? _self.restingHeartRate : restingHeartRate // ignore: cast_nullable_to_non_nullable
as double?,heartRateVariability: freezed == heartRateVariability ? _self.heartRateVariability : heartRateVariability // ignore: cast_nullable_to_non_nullable
as double?,minHeartRate: freezed == minHeartRate ? _self.minHeartRate : minHeartRate // ignore: cast_nullable_to_non_nullable
as double?,maxHeartRate: freezed == maxHeartRate ? _self.maxHeartRate : maxHeartRate // ignore: cast_nullable_to_non_nullable
as double?,sleepDurationMinutes: freezed == sleepDurationMinutes ? _self.sleepDurationMinutes : sleepDurationMinutes // ignore: cast_nullable_to_non_nullable
as int?,deepSleepMinutes: freezed == deepSleepMinutes ? _self.deepSleepMinutes : deepSleepMinutes // ignore: cast_nullable_to_non_nullable
as int?,remSleepMinutes: freezed == remSleepMinutes ? _self.remSleepMinutes : remSleepMinutes // ignore: cast_nullable_to_non_nullable
as int?,lightSleepMinutes: freezed == lightSleepMinutes ? _self.lightSleepMinutes : lightSleepMinutes // ignore: cast_nullable_to_non_nullable
as int?,awakeMinutes: freezed == awakeMinutes ? _self.awakeMinutes : awakeMinutes // ignore: cast_nullable_to_non_nullable
as int?,sleepEfficiency: freezed == sleepEfficiency ? _self.sleepEfficiency : sleepEfficiency // ignore: cast_nullable_to_non_nullable
as double?,weight: freezed == weight ? _self.weight : weight // ignore: cast_nullable_to_non_nullable
as double?,bodyFatPercentage: freezed == bodyFatPercentage ? _self.bodyFatPercentage : bodyFatPercentage // ignore: cast_nullable_to_non_nullable
as double?,bmi: freezed == bmi ? _self.bmi : bmi // ignore: cast_nullable_to_non_nullable
as double?,bloodOxygen: freezed == bloodOxygen ? _self.bloodOxygen : bloodOxygen // ignore: cast_nullable_to_non_nullable
as double?,bloodPressureSystolic: freezed == bloodPressureSystolic ? _self.bloodPressureSystolic : bloodPressureSystolic // ignore: cast_nullable_to_non_nullable
as int?,bloodPressureDiastolic: freezed == bloodPressureDiastolic ? _self.bloodPressureDiastolic : bloodPressureDiastolic // ignore: cast_nullable_to_non_nullable
as int?,recoveryScore: freezed == recoveryScore ? _self.recoveryScore : recoveryScore // ignore: cast_nullable_to_non_nullable
as int?,readinessScore: freezed == readinessScore ? _self.readinessScore : readinessScore // ignore: cast_nullable_to_non_nullable
as int?,strainScore: freezed == strainScore ? _self.strainScore : strainScore // ignore: cast_nullable_to_non_nullable
as int?,stressLevel: freezed == stressLevel ? _self.stressLevel : stressLevel // ignore: cast_nullable_to_non_nullable
as int?,bodyBattery: freezed == bodyBattery ? _self.bodyBattery : bodyBattery // ignore: cast_nullable_to_non_nullable
as double?,caloriesConsumed: freezed == caloriesConsumed ? _self.caloriesConsumed : caloriesConsumed // ignore: cast_nullable_to_non_nullable
as int?,proteinGrams: freezed == proteinGrams ? _self.proteinGrams : proteinGrams // ignore: cast_nullable_to_non_nullable
as int?,carbsGrams: freezed == carbsGrams ? _self.carbsGrams : carbsGrams // ignore: cast_nullable_to_non_nullable
as int?,fatGrams: freezed == fatGrams ? _self.fatGrams : fatGrams // ignore: cast_nullable_to_non_nullable
as int?,waterLiters: freezed == waterLiters ? _self.waterLiters : waterLiters // ignore: cast_nullable_to_non_nullable
as double?,mindfulMinutes: freezed == mindfulMinutes ? _self.mindfulMinutes : mindfulMinutes // ignore: cast_nullable_to_non_nullable
as int?,sources: freezed == sources ? _self._sources : sources // ignore: cast_nullable_to_non_nullable
as List<AppHealthDataSource>?,lastSyncedAt: freezed == lastSyncedAt ? _self.lastSyncedAt : lastSyncedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$DailyReadinessScore {

 DateTime get date; int get overallScore; String get recommendation;// Component scores (0-100)
 int? get sleepScore; int? get recoveryScore; int? get activityScore; int? get stressScore; int? get hrvScore;// Recommendations
 List<String> get habitRecommendations; List<String> get activityRecommendations;// Data sources used
 List<AppHealthDataSource> get dataSourcesUsed;// Confidence level (0-1) based on available data
 double get confidenceLevel;
/// Create a copy of DailyReadinessScore
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DailyReadinessScoreCopyWith<DailyReadinessScore> get copyWith => _$DailyReadinessScoreCopyWithImpl<DailyReadinessScore>(this as DailyReadinessScore, _$identity);

  /// Serializes this DailyReadinessScore to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DailyReadinessScore&&(identical(other.date, date) || other.date == date)&&(identical(other.overallScore, overallScore) || other.overallScore == overallScore)&&(identical(other.recommendation, recommendation) || other.recommendation == recommendation)&&(identical(other.sleepScore, sleepScore) || other.sleepScore == sleepScore)&&(identical(other.recoveryScore, recoveryScore) || other.recoveryScore == recoveryScore)&&(identical(other.activityScore, activityScore) || other.activityScore == activityScore)&&(identical(other.stressScore, stressScore) || other.stressScore == stressScore)&&(identical(other.hrvScore, hrvScore) || other.hrvScore == hrvScore)&&const DeepCollectionEquality().equals(other.habitRecommendations, habitRecommendations)&&const DeepCollectionEquality().equals(other.activityRecommendations, activityRecommendations)&&const DeepCollectionEquality().equals(other.dataSourcesUsed, dataSourcesUsed)&&(identical(other.confidenceLevel, confidenceLevel) || other.confidenceLevel == confidenceLevel));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,date,overallScore,recommendation,sleepScore,recoveryScore,activityScore,stressScore,hrvScore,const DeepCollectionEquality().hash(habitRecommendations),const DeepCollectionEquality().hash(activityRecommendations),const DeepCollectionEquality().hash(dataSourcesUsed),confidenceLevel);

@override
String toString() {
  return 'DailyReadinessScore(date: $date, overallScore: $overallScore, recommendation: $recommendation, sleepScore: $sleepScore, recoveryScore: $recoveryScore, activityScore: $activityScore, stressScore: $stressScore, hrvScore: $hrvScore, habitRecommendations: $habitRecommendations, activityRecommendations: $activityRecommendations, dataSourcesUsed: $dataSourcesUsed, confidenceLevel: $confidenceLevel)';
}


}

/// @nodoc
abstract mixin class $DailyReadinessScoreCopyWith<$Res>  {
  factory $DailyReadinessScoreCopyWith(DailyReadinessScore value, $Res Function(DailyReadinessScore) _then) = _$DailyReadinessScoreCopyWithImpl;
@useResult
$Res call({
 DateTime date, int overallScore, String recommendation, int? sleepScore, int? recoveryScore, int? activityScore, int? stressScore, int? hrvScore, List<String> habitRecommendations, List<String> activityRecommendations, List<AppHealthDataSource> dataSourcesUsed, double confidenceLevel
});




}
/// @nodoc
class _$DailyReadinessScoreCopyWithImpl<$Res>
    implements $DailyReadinessScoreCopyWith<$Res> {
  _$DailyReadinessScoreCopyWithImpl(this._self, this._then);

  final DailyReadinessScore _self;
  final $Res Function(DailyReadinessScore) _then;

/// Create a copy of DailyReadinessScore
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? date = null,Object? overallScore = null,Object? recommendation = null,Object? sleepScore = freezed,Object? recoveryScore = freezed,Object? activityScore = freezed,Object? stressScore = freezed,Object? hrvScore = freezed,Object? habitRecommendations = null,Object? activityRecommendations = null,Object? dataSourcesUsed = null,Object? confidenceLevel = null,}) {
  return _then(_self.copyWith(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as DateTime,overallScore: null == overallScore ? _self.overallScore : overallScore // ignore: cast_nullable_to_non_nullable
as int,recommendation: null == recommendation ? _self.recommendation : recommendation // ignore: cast_nullable_to_non_nullable
as String,sleepScore: freezed == sleepScore ? _self.sleepScore : sleepScore // ignore: cast_nullable_to_non_nullable
as int?,recoveryScore: freezed == recoveryScore ? _self.recoveryScore : recoveryScore // ignore: cast_nullable_to_non_nullable
as int?,activityScore: freezed == activityScore ? _self.activityScore : activityScore // ignore: cast_nullable_to_non_nullable
as int?,stressScore: freezed == stressScore ? _self.stressScore : stressScore // ignore: cast_nullable_to_non_nullable
as int?,hrvScore: freezed == hrvScore ? _self.hrvScore : hrvScore // ignore: cast_nullable_to_non_nullable
as int?,habitRecommendations: null == habitRecommendations ? _self.habitRecommendations : habitRecommendations // ignore: cast_nullable_to_non_nullable
as List<String>,activityRecommendations: null == activityRecommendations ? _self.activityRecommendations : activityRecommendations // ignore: cast_nullable_to_non_nullable
as List<String>,dataSourcesUsed: null == dataSourcesUsed ? _self.dataSourcesUsed : dataSourcesUsed // ignore: cast_nullable_to_non_nullable
as List<AppHealthDataSource>,confidenceLevel: null == confidenceLevel ? _self.confidenceLevel : confidenceLevel // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

}


/// Adds pattern-matching-related methods to [DailyReadinessScore].
extension DailyReadinessScorePatterns on DailyReadinessScore {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DailyReadinessScore value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DailyReadinessScore() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DailyReadinessScore value)  $default,){
final _that = this;
switch (_that) {
case _DailyReadinessScore():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DailyReadinessScore value)?  $default,){
final _that = this;
switch (_that) {
case _DailyReadinessScore() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( DateTime date,  int overallScore,  String recommendation,  int? sleepScore,  int? recoveryScore,  int? activityScore,  int? stressScore,  int? hrvScore,  List<String> habitRecommendations,  List<String> activityRecommendations,  List<AppHealthDataSource> dataSourcesUsed,  double confidenceLevel)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DailyReadinessScore() when $default != null:
return $default(_that.date,_that.overallScore,_that.recommendation,_that.sleepScore,_that.recoveryScore,_that.activityScore,_that.stressScore,_that.hrvScore,_that.habitRecommendations,_that.activityRecommendations,_that.dataSourcesUsed,_that.confidenceLevel);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( DateTime date,  int overallScore,  String recommendation,  int? sleepScore,  int? recoveryScore,  int? activityScore,  int? stressScore,  int? hrvScore,  List<String> habitRecommendations,  List<String> activityRecommendations,  List<AppHealthDataSource> dataSourcesUsed,  double confidenceLevel)  $default,) {final _that = this;
switch (_that) {
case _DailyReadinessScore():
return $default(_that.date,_that.overallScore,_that.recommendation,_that.sleepScore,_that.recoveryScore,_that.activityScore,_that.stressScore,_that.hrvScore,_that.habitRecommendations,_that.activityRecommendations,_that.dataSourcesUsed,_that.confidenceLevel);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( DateTime date,  int overallScore,  String recommendation,  int? sleepScore,  int? recoveryScore,  int? activityScore,  int? stressScore,  int? hrvScore,  List<String> habitRecommendations,  List<String> activityRecommendations,  List<AppHealthDataSource> dataSourcesUsed,  double confidenceLevel)?  $default,) {final _that = this;
switch (_that) {
case _DailyReadinessScore() when $default != null:
return $default(_that.date,_that.overallScore,_that.recommendation,_that.sleepScore,_that.recoveryScore,_that.activityScore,_that.stressScore,_that.hrvScore,_that.habitRecommendations,_that.activityRecommendations,_that.dataSourcesUsed,_that.confidenceLevel);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DailyReadinessScore implements DailyReadinessScore {
  const _DailyReadinessScore({required this.date, required this.overallScore, required this.recommendation, this.sleepScore, this.recoveryScore, this.activityScore, this.stressScore, this.hrvScore, final  List<String> habitRecommendations = const [], final  List<String> activityRecommendations = const [], final  List<AppHealthDataSource> dataSourcesUsed = const [], this.confidenceLevel = 0.5}): _habitRecommendations = habitRecommendations,_activityRecommendations = activityRecommendations,_dataSourcesUsed = dataSourcesUsed;
  factory _DailyReadinessScore.fromJson(Map<String, dynamic> json) => _$DailyReadinessScoreFromJson(json);

@override final  DateTime date;
@override final  int overallScore;
@override final  String recommendation;
// Component scores (0-100)
@override final  int? sleepScore;
@override final  int? recoveryScore;
@override final  int? activityScore;
@override final  int? stressScore;
@override final  int? hrvScore;
// Recommendations
 final  List<String> _habitRecommendations;
// Recommendations
@override@JsonKey() List<String> get habitRecommendations {
  if (_habitRecommendations is EqualUnmodifiableListView) return _habitRecommendations;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_habitRecommendations);
}

 final  List<String> _activityRecommendations;
@override@JsonKey() List<String> get activityRecommendations {
  if (_activityRecommendations is EqualUnmodifiableListView) return _activityRecommendations;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_activityRecommendations);
}

// Data sources used
 final  List<AppHealthDataSource> _dataSourcesUsed;
// Data sources used
@override@JsonKey() List<AppHealthDataSource> get dataSourcesUsed {
  if (_dataSourcesUsed is EqualUnmodifiableListView) return _dataSourcesUsed;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_dataSourcesUsed);
}

// Confidence level (0-1) based on available data
@override@JsonKey() final  double confidenceLevel;

/// Create a copy of DailyReadinessScore
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DailyReadinessScoreCopyWith<_DailyReadinessScore> get copyWith => __$DailyReadinessScoreCopyWithImpl<_DailyReadinessScore>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DailyReadinessScoreToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _DailyReadinessScore&&(identical(other.date, date) || other.date == date)&&(identical(other.overallScore, overallScore) || other.overallScore == overallScore)&&(identical(other.recommendation, recommendation) || other.recommendation == recommendation)&&(identical(other.sleepScore, sleepScore) || other.sleepScore == sleepScore)&&(identical(other.recoveryScore, recoveryScore) || other.recoveryScore == recoveryScore)&&(identical(other.activityScore, activityScore) || other.activityScore == activityScore)&&(identical(other.stressScore, stressScore) || other.stressScore == stressScore)&&(identical(other.hrvScore, hrvScore) || other.hrvScore == hrvScore)&&const DeepCollectionEquality().equals(other._habitRecommendations, _habitRecommendations)&&const DeepCollectionEquality().equals(other._activityRecommendations, _activityRecommendations)&&const DeepCollectionEquality().equals(other._dataSourcesUsed, _dataSourcesUsed)&&(identical(other.confidenceLevel, confidenceLevel) || other.confidenceLevel == confidenceLevel));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,date,overallScore,recommendation,sleepScore,recoveryScore,activityScore,stressScore,hrvScore,const DeepCollectionEquality().hash(_habitRecommendations),const DeepCollectionEquality().hash(_activityRecommendations),const DeepCollectionEquality().hash(_dataSourcesUsed),confidenceLevel);

@override
String toString() {
  return 'DailyReadinessScore(date: $date, overallScore: $overallScore, recommendation: $recommendation, sleepScore: $sleepScore, recoveryScore: $recoveryScore, activityScore: $activityScore, stressScore: $stressScore, hrvScore: $hrvScore, habitRecommendations: $habitRecommendations, activityRecommendations: $activityRecommendations, dataSourcesUsed: $dataSourcesUsed, confidenceLevel: $confidenceLevel)';
}


}

/// @nodoc
abstract mixin class _$DailyReadinessScoreCopyWith<$Res> implements $DailyReadinessScoreCopyWith<$Res> {
  factory _$DailyReadinessScoreCopyWith(_DailyReadinessScore value, $Res Function(_DailyReadinessScore) _then) = __$DailyReadinessScoreCopyWithImpl;
@override @useResult
$Res call({
 DateTime date, int overallScore, String recommendation, int? sleepScore, int? recoveryScore, int? activityScore, int? stressScore, int? hrvScore, List<String> habitRecommendations, List<String> activityRecommendations, List<AppHealthDataSource> dataSourcesUsed, double confidenceLevel
});




}
/// @nodoc
class __$DailyReadinessScoreCopyWithImpl<$Res>
    implements _$DailyReadinessScoreCopyWith<$Res> {
  __$DailyReadinessScoreCopyWithImpl(this._self, this._then);

  final _DailyReadinessScore _self;
  final $Res Function(_DailyReadinessScore) _then;

/// Create a copy of DailyReadinessScore
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? date = null,Object? overallScore = null,Object? recommendation = null,Object? sleepScore = freezed,Object? recoveryScore = freezed,Object? activityScore = freezed,Object? stressScore = freezed,Object? hrvScore = freezed,Object? habitRecommendations = null,Object? activityRecommendations = null,Object? dataSourcesUsed = null,Object? confidenceLevel = null,}) {
  return _then(_DailyReadinessScore(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as DateTime,overallScore: null == overallScore ? _self.overallScore : overallScore // ignore: cast_nullable_to_non_nullable
as int,recommendation: null == recommendation ? _self.recommendation : recommendation // ignore: cast_nullable_to_non_nullable
as String,sleepScore: freezed == sleepScore ? _self.sleepScore : sleepScore // ignore: cast_nullable_to_non_nullable
as int?,recoveryScore: freezed == recoveryScore ? _self.recoveryScore : recoveryScore // ignore: cast_nullable_to_non_nullable
as int?,activityScore: freezed == activityScore ? _self.activityScore : activityScore // ignore: cast_nullable_to_non_nullable
as int?,stressScore: freezed == stressScore ? _self.stressScore : stressScore // ignore: cast_nullable_to_non_nullable
as int?,hrvScore: freezed == hrvScore ? _self.hrvScore : hrvScore // ignore: cast_nullable_to_non_nullable
as int?,habitRecommendations: null == habitRecommendations ? _self._habitRecommendations : habitRecommendations // ignore: cast_nullable_to_non_nullable
as List<String>,activityRecommendations: null == activityRecommendations ? _self._activityRecommendations : activityRecommendations // ignore: cast_nullable_to_non_nullable
as List<String>,dataSourcesUsed: null == dataSourcesUsed ? _self._dataSourcesUsed : dataSourcesUsed // ignore: cast_nullable_to_non_nullable
as List<AppHealthDataSource>,confidenceLevel: null == confidenceLevel ? _self.confidenceLevel : confidenceLevel // ignore: cast_nullable_to_non_nullable
as double,
  ));
}


}

// dart format on
