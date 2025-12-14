// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'health_integration.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$OAuthToken {

 String get accessToken; String? get refreshToken; DateTime get expiresAt; String? get tokenType; List<String>? get scopes;
/// Create a copy of OAuthToken
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OAuthTokenCopyWith<OAuthToken> get copyWith => _$OAuthTokenCopyWithImpl<OAuthToken>(this as OAuthToken, _$identity);

  /// Serializes this OAuthToken to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OAuthToken&&(identical(other.accessToken, accessToken) || other.accessToken == accessToken)&&(identical(other.refreshToken, refreshToken) || other.refreshToken == refreshToken)&&(identical(other.expiresAt, expiresAt) || other.expiresAt == expiresAt)&&(identical(other.tokenType, tokenType) || other.tokenType == tokenType)&&const DeepCollectionEquality().equals(other.scopes, scopes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,accessToken,refreshToken,expiresAt,tokenType,const DeepCollectionEquality().hash(scopes));

@override
String toString() {
  return 'OAuthToken(accessToken: $accessToken, refreshToken: $refreshToken, expiresAt: $expiresAt, tokenType: $tokenType, scopes: $scopes)';
}


}

/// @nodoc
abstract mixin class $OAuthTokenCopyWith<$Res>  {
  factory $OAuthTokenCopyWith(OAuthToken value, $Res Function(OAuthToken) _then) = _$OAuthTokenCopyWithImpl;
@useResult
$Res call({
 String accessToken, String? refreshToken, DateTime expiresAt, String? tokenType, List<String>? scopes
});




}
/// @nodoc
class _$OAuthTokenCopyWithImpl<$Res>
    implements $OAuthTokenCopyWith<$Res> {
  _$OAuthTokenCopyWithImpl(this._self, this._then);

  final OAuthToken _self;
  final $Res Function(OAuthToken) _then;

/// Create a copy of OAuthToken
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? accessToken = null,Object? refreshToken = freezed,Object? expiresAt = null,Object? tokenType = freezed,Object? scopes = freezed,}) {
  return _then(_self.copyWith(
accessToken: null == accessToken ? _self.accessToken : accessToken // ignore: cast_nullable_to_non_nullable
as String,refreshToken: freezed == refreshToken ? _self.refreshToken : refreshToken // ignore: cast_nullable_to_non_nullable
as String?,expiresAt: null == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime,tokenType: freezed == tokenType ? _self.tokenType : tokenType // ignore: cast_nullable_to_non_nullable
as String?,scopes: freezed == scopes ? _self.scopes : scopes // ignore: cast_nullable_to_non_nullable
as List<String>?,
  ));
}

}


/// Adds pattern-matching-related methods to [OAuthToken].
extension OAuthTokenPatterns on OAuthToken {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _OAuthToken value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _OAuthToken() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _OAuthToken value)  $default,){
final _that = this;
switch (_that) {
case _OAuthToken():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _OAuthToken value)?  $default,){
final _that = this;
switch (_that) {
case _OAuthToken() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String accessToken,  String? refreshToken,  DateTime expiresAt,  String? tokenType,  List<String>? scopes)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _OAuthToken() when $default != null:
return $default(_that.accessToken,_that.refreshToken,_that.expiresAt,_that.tokenType,_that.scopes);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String accessToken,  String? refreshToken,  DateTime expiresAt,  String? tokenType,  List<String>? scopes)  $default,) {final _that = this;
switch (_that) {
case _OAuthToken():
return $default(_that.accessToken,_that.refreshToken,_that.expiresAt,_that.tokenType,_that.scopes);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String accessToken,  String? refreshToken,  DateTime expiresAt,  String? tokenType,  List<String>? scopes)?  $default,) {final _that = this;
switch (_that) {
case _OAuthToken() when $default != null:
return $default(_that.accessToken,_that.refreshToken,_that.expiresAt,_that.tokenType,_that.scopes);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _OAuthToken implements OAuthToken {
  const _OAuthToken({required this.accessToken, this.refreshToken, required this.expiresAt, this.tokenType, final  List<String>? scopes}): _scopes = scopes;
  factory _OAuthToken.fromJson(Map<String, dynamic> json) => _$OAuthTokenFromJson(json);

@override final  String accessToken;
@override final  String? refreshToken;
@override final  DateTime expiresAt;
@override final  String? tokenType;
 final  List<String>? _scopes;
@override List<String>? get scopes {
  final value = _scopes;
  if (value == null) return null;
  if (_scopes is EqualUnmodifiableListView) return _scopes;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}


/// Create a copy of OAuthToken
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OAuthTokenCopyWith<_OAuthToken> get copyWith => __$OAuthTokenCopyWithImpl<_OAuthToken>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OAuthTokenToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _OAuthToken&&(identical(other.accessToken, accessToken) || other.accessToken == accessToken)&&(identical(other.refreshToken, refreshToken) || other.refreshToken == refreshToken)&&(identical(other.expiresAt, expiresAt) || other.expiresAt == expiresAt)&&(identical(other.tokenType, tokenType) || other.tokenType == tokenType)&&const DeepCollectionEquality().equals(other._scopes, _scopes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,accessToken,refreshToken,expiresAt,tokenType,const DeepCollectionEquality().hash(_scopes));

@override
String toString() {
  return 'OAuthToken(accessToken: $accessToken, refreshToken: $refreshToken, expiresAt: $expiresAt, tokenType: $tokenType, scopes: $scopes)';
}


}

/// @nodoc
abstract mixin class _$OAuthTokenCopyWith<$Res> implements $OAuthTokenCopyWith<$Res> {
  factory _$OAuthTokenCopyWith(_OAuthToken value, $Res Function(_OAuthToken) _then) = __$OAuthTokenCopyWithImpl;
@override @useResult
$Res call({
 String accessToken, String? refreshToken, DateTime expiresAt, String? tokenType, List<String>? scopes
});




}
/// @nodoc
class __$OAuthTokenCopyWithImpl<$Res>
    implements _$OAuthTokenCopyWith<$Res> {
  __$OAuthTokenCopyWithImpl(this._self, this._then);

  final _OAuthToken _self;
  final $Res Function(_OAuthToken) _then;

/// Create a copy of OAuthToken
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? accessToken = null,Object? refreshToken = freezed,Object? expiresAt = null,Object? tokenType = freezed,Object? scopes = freezed,}) {
  return _then(_OAuthToken(
accessToken: null == accessToken ? _self.accessToken : accessToken // ignore: cast_nullable_to_non_nullable
as String,refreshToken: freezed == refreshToken ? _self.refreshToken : refreshToken // ignore: cast_nullable_to_non_nullable
as String?,expiresAt: null == expiresAt ? _self.expiresAt : expiresAt // ignore: cast_nullable_to_non_nullable
as DateTime,tokenType: freezed == tokenType ? _self.tokenType : tokenType // ignore: cast_nullable_to_non_nullable
as String?,scopes: freezed == scopes ? _self._scopes : scopes // ignore: cast_nullable_to_non_nullable
as List<String>?,
  ));
}


}


/// @nodoc
mixin _$HealthIntegration {

 AppHealthDataSource get source; String get displayName; String get iconAsset; IntegrationCategory get category; IntegrationStatus get status; List<AppHealthDataType> get supportedDataTypes;// Connection details
 DateTime? get connectedAt; DateTime? get lastSyncAt; String? get deviceName; String? get accountEmail;// OAuth (for third-party integrations)
 OAuthToken? get oauthToken;// Sync settings
 bool get autoSync; int get syncIntervalMinutes; bool get backgroundSync;// Privacy settings
 bool get syncToCloud; List<AppHealthDataType> get enabledDataTypes;// Error details
 String? get lastErrorMessage; DateTime? get lastErrorAt;// Stats
 int? get totalDataPointsSynced; DateTime? get oldestDataPoint; DateTime? get newestDataPoint;
/// Create a copy of HealthIntegration
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$HealthIntegrationCopyWith<HealthIntegration> get copyWith => _$HealthIntegrationCopyWithImpl<HealthIntegration>(this as HealthIntegration, _$identity);

  /// Serializes this HealthIntegration to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is HealthIntegration&&(identical(other.source, source) || other.source == source)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.iconAsset, iconAsset) || other.iconAsset == iconAsset)&&(identical(other.category, category) || other.category == category)&&(identical(other.status, status) || other.status == status)&&const DeepCollectionEquality().equals(other.supportedDataTypes, supportedDataTypes)&&(identical(other.connectedAt, connectedAt) || other.connectedAt == connectedAt)&&(identical(other.lastSyncAt, lastSyncAt) || other.lastSyncAt == lastSyncAt)&&(identical(other.deviceName, deviceName) || other.deviceName == deviceName)&&(identical(other.accountEmail, accountEmail) || other.accountEmail == accountEmail)&&(identical(other.oauthToken, oauthToken) || other.oauthToken == oauthToken)&&(identical(other.autoSync, autoSync) || other.autoSync == autoSync)&&(identical(other.syncIntervalMinutes, syncIntervalMinutes) || other.syncIntervalMinutes == syncIntervalMinutes)&&(identical(other.backgroundSync, backgroundSync) || other.backgroundSync == backgroundSync)&&(identical(other.syncToCloud, syncToCloud) || other.syncToCloud == syncToCloud)&&const DeepCollectionEquality().equals(other.enabledDataTypes, enabledDataTypes)&&(identical(other.lastErrorMessage, lastErrorMessage) || other.lastErrorMessage == lastErrorMessage)&&(identical(other.lastErrorAt, lastErrorAt) || other.lastErrorAt == lastErrorAt)&&(identical(other.totalDataPointsSynced, totalDataPointsSynced) || other.totalDataPointsSynced == totalDataPointsSynced)&&(identical(other.oldestDataPoint, oldestDataPoint) || other.oldestDataPoint == oldestDataPoint)&&(identical(other.newestDataPoint, newestDataPoint) || other.newestDataPoint == newestDataPoint));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,source,displayName,iconAsset,category,status,const DeepCollectionEquality().hash(supportedDataTypes),connectedAt,lastSyncAt,deviceName,accountEmail,oauthToken,autoSync,syncIntervalMinutes,backgroundSync,syncToCloud,const DeepCollectionEquality().hash(enabledDataTypes),lastErrorMessage,lastErrorAt,totalDataPointsSynced,oldestDataPoint,newestDataPoint]);

@override
String toString() {
  return 'HealthIntegration(source: $source, displayName: $displayName, iconAsset: $iconAsset, category: $category, status: $status, supportedDataTypes: $supportedDataTypes, connectedAt: $connectedAt, lastSyncAt: $lastSyncAt, deviceName: $deviceName, accountEmail: $accountEmail, oauthToken: $oauthToken, autoSync: $autoSync, syncIntervalMinutes: $syncIntervalMinutes, backgroundSync: $backgroundSync, syncToCloud: $syncToCloud, enabledDataTypes: $enabledDataTypes, lastErrorMessage: $lastErrorMessage, lastErrorAt: $lastErrorAt, totalDataPointsSynced: $totalDataPointsSynced, oldestDataPoint: $oldestDataPoint, newestDataPoint: $newestDataPoint)';
}


}

/// @nodoc
abstract mixin class $HealthIntegrationCopyWith<$Res>  {
  factory $HealthIntegrationCopyWith(HealthIntegration value, $Res Function(HealthIntegration) _then) = _$HealthIntegrationCopyWithImpl;
@useResult
$Res call({
 AppHealthDataSource source, String displayName, String iconAsset, IntegrationCategory category, IntegrationStatus status, List<AppHealthDataType> supportedDataTypes, DateTime? connectedAt, DateTime? lastSyncAt, String? deviceName, String? accountEmail, OAuthToken? oauthToken, bool autoSync, int syncIntervalMinutes, bool backgroundSync, bool syncToCloud, List<AppHealthDataType> enabledDataTypes, String? lastErrorMessage, DateTime? lastErrorAt, int? totalDataPointsSynced, DateTime? oldestDataPoint, DateTime? newestDataPoint
});


$OAuthTokenCopyWith<$Res>? get oauthToken;

}
/// @nodoc
class _$HealthIntegrationCopyWithImpl<$Res>
    implements $HealthIntegrationCopyWith<$Res> {
  _$HealthIntegrationCopyWithImpl(this._self, this._then);

  final HealthIntegration _self;
  final $Res Function(HealthIntegration) _then;

/// Create a copy of HealthIntegration
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? source = null,Object? displayName = null,Object? iconAsset = null,Object? category = null,Object? status = null,Object? supportedDataTypes = null,Object? connectedAt = freezed,Object? lastSyncAt = freezed,Object? deviceName = freezed,Object? accountEmail = freezed,Object? oauthToken = freezed,Object? autoSync = null,Object? syncIntervalMinutes = null,Object? backgroundSync = null,Object? syncToCloud = null,Object? enabledDataTypes = null,Object? lastErrorMessage = freezed,Object? lastErrorAt = freezed,Object? totalDataPointsSynced = freezed,Object? oldestDataPoint = freezed,Object? newestDataPoint = freezed,}) {
  return _then(_self.copyWith(
source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as AppHealthDataSource,displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,iconAsset: null == iconAsset ? _self.iconAsset : iconAsset // ignore: cast_nullable_to_non_nullable
as String,category: null == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as IntegrationCategory,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as IntegrationStatus,supportedDataTypes: null == supportedDataTypes ? _self.supportedDataTypes : supportedDataTypes // ignore: cast_nullable_to_non_nullable
as List<AppHealthDataType>,connectedAt: freezed == connectedAt ? _self.connectedAt : connectedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,lastSyncAt: freezed == lastSyncAt ? _self.lastSyncAt : lastSyncAt // ignore: cast_nullable_to_non_nullable
as DateTime?,deviceName: freezed == deviceName ? _self.deviceName : deviceName // ignore: cast_nullable_to_non_nullable
as String?,accountEmail: freezed == accountEmail ? _self.accountEmail : accountEmail // ignore: cast_nullable_to_non_nullable
as String?,oauthToken: freezed == oauthToken ? _self.oauthToken : oauthToken // ignore: cast_nullable_to_non_nullable
as OAuthToken?,autoSync: null == autoSync ? _self.autoSync : autoSync // ignore: cast_nullable_to_non_nullable
as bool,syncIntervalMinutes: null == syncIntervalMinutes ? _self.syncIntervalMinutes : syncIntervalMinutes // ignore: cast_nullable_to_non_nullable
as int,backgroundSync: null == backgroundSync ? _self.backgroundSync : backgroundSync // ignore: cast_nullable_to_non_nullable
as bool,syncToCloud: null == syncToCloud ? _self.syncToCloud : syncToCloud // ignore: cast_nullable_to_non_nullable
as bool,enabledDataTypes: null == enabledDataTypes ? _self.enabledDataTypes : enabledDataTypes // ignore: cast_nullable_to_non_nullable
as List<AppHealthDataType>,lastErrorMessage: freezed == lastErrorMessage ? _self.lastErrorMessage : lastErrorMessage // ignore: cast_nullable_to_non_nullable
as String?,lastErrorAt: freezed == lastErrorAt ? _self.lastErrorAt : lastErrorAt // ignore: cast_nullable_to_non_nullable
as DateTime?,totalDataPointsSynced: freezed == totalDataPointsSynced ? _self.totalDataPointsSynced : totalDataPointsSynced // ignore: cast_nullable_to_non_nullable
as int?,oldestDataPoint: freezed == oldestDataPoint ? _self.oldestDataPoint : oldestDataPoint // ignore: cast_nullable_to_non_nullable
as DateTime?,newestDataPoint: freezed == newestDataPoint ? _self.newestDataPoint : newestDataPoint // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}
/// Create a copy of HealthIntegration
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OAuthTokenCopyWith<$Res>? get oauthToken {
    if (_self.oauthToken == null) {
    return null;
  }

  return $OAuthTokenCopyWith<$Res>(_self.oauthToken!, (value) {
    return _then(_self.copyWith(oauthToken: value));
  });
}
}


/// Adds pattern-matching-related methods to [HealthIntegration].
extension HealthIntegrationPatterns on HealthIntegration {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _HealthIntegration value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _HealthIntegration() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _HealthIntegration value)  $default,){
final _that = this;
switch (_that) {
case _HealthIntegration():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _HealthIntegration value)?  $default,){
final _that = this;
switch (_that) {
case _HealthIntegration() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( AppHealthDataSource source,  String displayName,  String iconAsset,  IntegrationCategory category,  IntegrationStatus status,  List<AppHealthDataType> supportedDataTypes,  DateTime? connectedAt,  DateTime? lastSyncAt,  String? deviceName,  String? accountEmail,  OAuthToken? oauthToken,  bool autoSync,  int syncIntervalMinutes,  bool backgroundSync,  bool syncToCloud,  List<AppHealthDataType> enabledDataTypes,  String? lastErrorMessage,  DateTime? lastErrorAt,  int? totalDataPointsSynced,  DateTime? oldestDataPoint,  DateTime? newestDataPoint)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _HealthIntegration() when $default != null:
return $default(_that.source,_that.displayName,_that.iconAsset,_that.category,_that.status,_that.supportedDataTypes,_that.connectedAt,_that.lastSyncAt,_that.deviceName,_that.accountEmail,_that.oauthToken,_that.autoSync,_that.syncIntervalMinutes,_that.backgroundSync,_that.syncToCloud,_that.enabledDataTypes,_that.lastErrorMessage,_that.lastErrorAt,_that.totalDataPointsSynced,_that.oldestDataPoint,_that.newestDataPoint);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( AppHealthDataSource source,  String displayName,  String iconAsset,  IntegrationCategory category,  IntegrationStatus status,  List<AppHealthDataType> supportedDataTypes,  DateTime? connectedAt,  DateTime? lastSyncAt,  String? deviceName,  String? accountEmail,  OAuthToken? oauthToken,  bool autoSync,  int syncIntervalMinutes,  bool backgroundSync,  bool syncToCloud,  List<AppHealthDataType> enabledDataTypes,  String? lastErrorMessage,  DateTime? lastErrorAt,  int? totalDataPointsSynced,  DateTime? oldestDataPoint,  DateTime? newestDataPoint)  $default,) {final _that = this;
switch (_that) {
case _HealthIntegration():
return $default(_that.source,_that.displayName,_that.iconAsset,_that.category,_that.status,_that.supportedDataTypes,_that.connectedAt,_that.lastSyncAt,_that.deviceName,_that.accountEmail,_that.oauthToken,_that.autoSync,_that.syncIntervalMinutes,_that.backgroundSync,_that.syncToCloud,_that.enabledDataTypes,_that.lastErrorMessage,_that.lastErrorAt,_that.totalDataPointsSynced,_that.oldestDataPoint,_that.newestDataPoint);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( AppHealthDataSource source,  String displayName,  String iconAsset,  IntegrationCategory category,  IntegrationStatus status,  List<AppHealthDataType> supportedDataTypes,  DateTime? connectedAt,  DateTime? lastSyncAt,  String? deviceName,  String? accountEmail,  OAuthToken? oauthToken,  bool autoSync,  int syncIntervalMinutes,  bool backgroundSync,  bool syncToCloud,  List<AppHealthDataType> enabledDataTypes,  String? lastErrorMessage,  DateTime? lastErrorAt,  int? totalDataPointsSynced,  DateTime? oldestDataPoint,  DateTime? newestDataPoint)?  $default,) {final _that = this;
switch (_that) {
case _HealthIntegration() when $default != null:
return $default(_that.source,_that.displayName,_that.iconAsset,_that.category,_that.status,_that.supportedDataTypes,_that.connectedAt,_that.lastSyncAt,_that.deviceName,_that.accountEmail,_that.oauthToken,_that.autoSync,_that.syncIntervalMinutes,_that.backgroundSync,_that.syncToCloud,_that.enabledDataTypes,_that.lastErrorMessage,_that.lastErrorAt,_that.totalDataPointsSynced,_that.oldestDataPoint,_that.newestDataPoint);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _HealthIntegration implements HealthIntegration {
  const _HealthIntegration({required this.source, required this.displayName, required this.iconAsset, required this.category, required this.status, required final  List<AppHealthDataType> supportedDataTypes, this.connectedAt, this.lastSyncAt, this.deviceName, this.accountEmail, this.oauthToken, this.autoSync = true, this.syncIntervalMinutes = 15, this.backgroundSync = true, this.syncToCloud = true, final  List<AppHealthDataType> enabledDataTypes = const [], this.lastErrorMessage, this.lastErrorAt, this.totalDataPointsSynced, this.oldestDataPoint, this.newestDataPoint}): _supportedDataTypes = supportedDataTypes,_enabledDataTypes = enabledDataTypes;
  factory _HealthIntegration.fromJson(Map<String, dynamic> json) => _$HealthIntegrationFromJson(json);

@override final  AppHealthDataSource source;
@override final  String displayName;
@override final  String iconAsset;
@override final  IntegrationCategory category;
@override final  IntegrationStatus status;
 final  List<AppHealthDataType> _supportedDataTypes;
@override List<AppHealthDataType> get supportedDataTypes {
  if (_supportedDataTypes is EqualUnmodifiableListView) return _supportedDataTypes;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_supportedDataTypes);
}

// Connection details
@override final  DateTime? connectedAt;
@override final  DateTime? lastSyncAt;
@override final  String? deviceName;
@override final  String? accountEmail;
// OAuth (for third-party integrations)
@override final  OAuthToken? oauthToken;
// Sync settings
@override@JsonKey() final  bool autoSync;
@override@JsonKey() final  int syncIntervalMinutes;
@override@JsonKey() final  bool backgroundSync;
// Privacy settings
@override@JsonKey() final  bool syncToCloud;
 final  List<AppHealthDataType> _enabledDataTypes;
@override@JsonKey() List<AppHealthDataType> get enabledDataTypes {
  if (_enabledDataTypes is EqualUnmodifiableListView) return _enabledDataTypes;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_enabledDataTypes);
}

// Error details
@override final  String? lastErrorMessage;
@override final  DateTime? lastErrorAt;
// Stats
@override final  int? totalDataPointsSynced;
@override final  DateTime? oldestDataPoint;
@override final  DateTime? newestDataPoint;

/// Create a copy of HealthIntegration
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$HealthIntegrationCopyWith<_HealthIntegration> get copyWith => __$HealthIntegrationCopyWithImpl<_HealthIntegration>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$HealthIntegrationToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _HealthIntegration&&(identical(other.source, source) || other.source == source)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.iconAsset, iconAsset) || other.iconAsset == iconAsset)&&(identical(other.category, category) || other.category == category)&&(identical(other.status, status) || other.status == status)&&const DeepCollectionEquality().equals(other._supportedDataTypes, _supportedDataTypes)&&(identical(other.connectedAt, connectedAt) || other.connectedAt == connectedAt)&&(identical(other.lastSyncAt, lastSyncAt) || other.lastSyncAt == lastSyncAt)&&(identical(other.deviceName, deviceName) || other.deviceName == deviceName)&&(identical(other.accountEmail, accountEmail) || other.accountEmail == accountEmail)&&(identical(other.oauthToken, oauthToken) || other.oauthToken == oauthToken)&&(identical(other.autoSync, autoSync) || other.autoSync == autoSync)&&(identical(other.syncIntervalMinutes, syncIntervalMinutes) || other.syncIntervalMinutes == syncIntervalMinutes)&&(identical(other.backgroundSync, backgroundSync) || other.backgroundSync == backgroundSync)&&(identical(other.syncToCloud, syncToCloud) || other.syncToCloud == syncToCloud)&&const DeepCollectionEquality().equals(other._enabledDataTypes, _enabledDataTypes)&&(identical(other.lastErrorMessage, lastErrorMessage) || other.lastErrorMessage == lastErrorMessage)&&(identical(other.lastErrorAt, lastErrorAt) || other.lastErrorAt == lastErrorAt)&&(identical(other.totalDataPointsSynced, totalDataPointsSynced) || other.totalDataPointsSynced == totalDataPointsSynced)&&(identical(other.oldestDataPoint, oldestDataPoint) || other.oldestDataPoint == oldestDataPoint)&&(identical(other.newestDataPoint, newestDataPoint) || other.newestDataPoint == newestDataPoint));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,source,displayName,iconAsset,category,status,const DeepCollectionEquality().hash(_supportedDataTypes),connectedAt,lastSyncAt,deviceName,accountEmail,oauthToken,autoSync,syncIntervalMinutes,backgroundSync,syncToCloud,const DeepCollectionEquality().hash(_enabledDataTypes),lastErrorMessage,lastErrorAt,totalDataPointsSynced,oldestDataPoint,newestDataPoint]);

@override
String toString() {
  return 'HealthIntegration(source: $source, displayName: $displayName, iconAsset: $iconAsset, category: $category, status: $status, supportedDataTypes: $supportedDataTypes, connectedAt: $connectedAt, lastSyncAt: $lastSyncAt, deviceName: $deviceName, accountEmail: $accountEmail, oauthToken: $oauthToken, autoSync: $autoSync, syncIntervalMinutes: $syncIntervalMinutes, backgroundSync: $backgroundSync, syncToCloud: $syncToCloud, enabledDataTypes: $enabledDataTypes, lastErrorMessage: $lastErrorMessage, lastErrorAt: $lastErrorAt, totalDataPointsSynced: $totalDataPointsSynced, oldestDataPoint: $oldestDataPoint, newestDataPoint: $newestDataPoint)';
}


}

/// @nodoc
abstract mixin class _$HealthIntegrationCopyWith<$Res> implements $HealthIntegrationCopyWith<$Res> {
  factory _$HealthIntegrationCopyWith(_HealthIntegration value, $Res Function(_HealthIntegration) _then) = __$HealthIntegrationCopyWithImpl;
@override @useResult
$Res call({
 AppHealthDataSource source, String displayName, String iconAsset, IntegrationCategory category, IntegrationStatus status, List<AppHealthDataType> supportedDataTypes, DateTime? connectedAt, DateTime? lastSyncAt, String? deviceName, String? accountEmail, OAuthToken? oauthToken, bool autoSync, int syncIntervalMinutes, bool backgroundSync, bool syncToCloud, List<AppHealthDataType> enabledDataTypes, String? lastErrorMessage, DateTime? lastErrorAt, int? totalDataPointsSynced, DateTime? oldestDataPoint, DateTime? newestDataPoint
});


@override $OAuthTokenCopyWith<$Res>? get oauthToken;

}
/// @nodoc
class __$HealthIntegrationCopyWithImpl<$Res>
    implements _$HealthIntegrationCopyWith<$Res> {
  __$HealthIntegrationCopyWithImpl(this._self, this._then);

  final _HealthIntegration _self;
  final $Res Function(_HealthIntegration) _then;

/// Create a copy of HealthIntegration
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? source = null,Object? displayName = null,Object? iconAsset = null,Object? category = null,Object? status = null,Object? supportedDataTypes = null,Object? connectedAt = freezed,Object? lastSyncAt = freezed,Object? deviceName = freezed,Object? accountEmail = freezed,Object? oauthToken = freezed,Object? autoSync = null,Object? syncIntervalMinutes = null,Object? backgroundSync = null,Object? syncToCloud = null,Object? enabledDataTypes = null,Object? lastErrorMessage = freezed,Object? lastErrorAt = freezed,Object? totalDataPointsSynced = freezed,Object? oldestDataPoint = freezed,Object? newestDataPoint = freezed,}) {
  return _then(_HealthIntegration(
source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as AppHealthDataSource,displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,iconAsset: null == iconAsset ? _self.iconAsset : iconAsset // ignore: cast_nullable_to_non_nullable
as String,category: null == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as IntegrationCategory,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as IntegrationStatus,supportedDataTypes: null == supportedDataTypes ? _self._supportedDataTypes : supportedDataTypes // ignore: cast_nullable_to_non_nullable
as List<AppHealthDataType>,connectedAt: freezed == connectedAt ? _self.connectedAt : connectedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,lastSyncAt: freezed == lastSyncAt ? _self.lastSyncAt : lastSyncAt // ignore: cast_nullable_to_non_nullable
as DateTime?,deviceName: freezed == deviceName ? _self.deviceName : deviceName // ignore: cast_nullable_to_non_nullable
as String?,accountEmail: freezed == accountEmail ? _self.accountEmail : accountEmail // ignore: cast_nullable_to_non_nullable
as String?,oauthToken: freezed == oauthToken ? _self.oauthToken : oauthToken // ignore: cast_nullable_to_non_nullable
as OAuthToken?,autoSync: null == autoSync ? _self.autoSync : autoSync // ignore: cast_nullable_to_non_nullable
as bool,syncIntervalMinutes: null == syncIntervalMinutes ? _self.syncIntervalMinutes : syncIntervalMinutes // ignore: cast_nullable_to_non_nullable
as int,backgroundSync: null == backgroundSync ? _self.backgroundSync : backgroundSync // ignore: cast_nullable_to_non_nullable
as bool,syncToCloud: null == syncToCloud ? _self.syncToCloud : syncToCloud // ignore: cast_nullable_to_non_nullable
as bool,enabledDataTypes: null == enabledDataTypes ? _self._enabledDataTypes : enabledDataTypes // ignore: cast_nullable_to_non_nullable
as List<AppHealthDataType>,lastErrorMessage: freezed == lastErrorMessage ? _self.lastErrorMessage : lastErrorMessage // ignore: cast_nullable_to_non_nullable
as String?,lastErrorAt: freezed == lastErrorAt ? _self.lastErrorAt : lastErrorAt // ignore: cast_nullable_to_non_nullable
as DateTime?,totalDataPointsSynced: freezed == totalDataPointsSynced ? _self.totalDataPointsSynced : totalDataPointsSynced // ignore: cast_nullable_to_non_nullable
as int?,oldestDataPoint: freezed == oldestDataPoint ? _self.oldestDataPoint : oldestDataPoint // ignore: cast_nullable_to_non_nullable
as DateTime?,newestDataPoint: freezed == newestDataPoint ? _self.newestDataPoint : newestDataPoint // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

/// Create a copy of HealthIntegration
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OAuthTokenCopyWith<$Res>? get oauthToken {
    if (_self.oauthToken == null) {
    return null;
  }

  return $OAuthTokenCopyWith<$Res>(_self.oauthToken!, (value) {
    return _then(_self.copyWith(oauthToken: value));
  });
}
}


/// @nodoc
mixin _$HealthPrivacySettings {

/// Process all health data on-device only (never sync to cloud)
 bool get onDeviceOnly;/// Enable background sync
 bool get backgroundSyncEnabled;/// Sync frequency in minutes
 int get syncIntervalMinutes;/// Only sync on WiFi
 bool get wifiOnlySync;/// Data retention period in days (0 = forever)
 int get dataRetentionDays;/// Which data types are allowed to be collected
 List<AppHealthDataType> get allowedDataTypes;/// Which data types can be synced to cloud (if onDeviceOnly is false)
 List<AppHealthDataType> get cloudSyncAllowedTypes;/// Show health insights in notifications
 bool get showHealthNotifications;/// Use health data for AI coaching
 bool get useForAiCoaching;
/// Create a copy of HealthPrivacySettings
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$HealthPrivacySettingsCopyWith<HealthPrivacySettings> get copyWith => _$HealthPrivacySettingsCopyWithImpl<HealthPrivacySettings>(this as HealthPrivacySettings, _$identity);

  /// Serializes this HealthPrivacySettings to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is HealthPrivacySettings&&(identical(other.onDeviceOnly, onDeviceOnly) || other.onDeviceOnly == onDeviceOnly)&&(identical(other.backgroundSyncEnabled, backgroundSyncEnabled) || other.backgroundSyncEnabled == backgroundSyncEnabled)&&(identical(other.syncIntervalMinutes, syncIntervalMinutes) || other.syncIntervalMinutes == syncIntervalMinutes)&&(identical(other.wifiOnlySync, wifiOnlySync) || other.wifiOnlySync == wifiOnlySync)&&(identical(other.dataRetentionDays, dataRetentionDays) || other.dataRetentionDays == dataRetentionDays)&&const DeepCollectionEquality().equals(other.allowedDataTypes, allowedDataTypes)&&const DeepCollectionEquality().equals(other.cloudSyncAllowedTypes, cloudSyncAllowedTypes)&&(identical(other.showHealthNotifications, showHealthNotifications) || other.showHealthNotifications == showHealthNotifications)&&(identical(other.useForAiCoaching, useForAiCoaching) || other.useForAiCoaching == useForAiCoaching));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,onDeviceOnly,backgroundSyncEnabled,syncIntervalMinutes,wifiOnlySync,dataRetentionDays,const DeepCollectionEquality().hash(allowedDataTypes),const DeepCollectionEquality().hash(cloudSyncAllowedTypes),showHealthNotifications,useForAiCoaching);

@override
String toString() {
  return 'HealthPrivacySettings(onDeviceOnly: $onDeviceOnly, backgroundSyncEnabled: $backgroundSyncEnabled, syncIntervalMinutes: $syncIntervalMinutes, wifiOnlySync: $wifiOnlySync, dataRetentionDays: $dataRetentionDays, allowedDataTypes: $allowedDataTypes, cloudSyncAllowedTypes: $cloudSyncAllowedTypes, showHealthNotifications: $showHealthNotifications, useForAiCoaching: $useForAiCoaching)';
}


}

/// @nodoc
abstract mixin class $HealthPrivacySettingsCopyWith<$Res>  {
  factory $HealthPrivacySettingsCopyWith(HealthPrivacySettings value, $Res Function(HealthPrivacySettings) _then) = _$HealthPrivacySettingsCopyWithImpl;
@useResult
$Res call({
 bool onDeviceOnly, bool backgroundSyncEnabled, int syncIntervalMinutes, bool wifiOnlySync, int dataRetentionDays, List<AppHealthDataType> allowedDataTypes, List<AppHealthDataType> cloudSyncAllowedTypes, bool showHealthNotifications, bool useForAiCoaching
});




}
/// @nodoc
class _$HealthPrivacySettingsCopyWithImpl<$Res>
    implements $HealthPrivacySettingsCopyWith<$Res> {
  _$HealthPrivacySettingsCopyWithImpl(this._self, this._then);

  final HealthPrivacySettings _self;
  final $Res Function(HealthPrivacySettings) _then;

/// Create a copy of HealthPrivacySettings
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? onDeviceOnly = null,Object? backgroundSyncEnabled = null,Object? syncIntervalMinutes = null,Object? wifiOnlySync = null,Object? dataRetentionDays = null,Object? allowedDataTypes = null,Object? cloudSyncAllowedTypes = null,Object? showHealthNotifications = null,Object? useForAiCoaching = null,}) {
  return _then(_self.copyWith(
onDeviceOnly: null == onDeviceOnly ? _self.onDeviceOnly : onDeviceOnly // ignore: cast_nullable_to_non_nullable
as bool,backgroundSyncEnabled: null == backgroundSyncEnabled ? _self.backgroundSyncEnabled : backgroundSyncEnabled // ignore: cast_nullable_to_non_nullable
as bool,syncIntervalMinutes: null == syncIntervalMinutes ? _self.syncIntervalMinutes : syncIntervalMinutes // ignore: cast_nullable_to_non_nullable
as int,wifiOnlySync: null == wifiOnlySync ? _self.wifiOnlySync : wifiOnlySync // ignore: cast_nullable_to_non_nullable
as bool,dataRetentionDays: null == dataRetentionDays ? _self.dataRetentionDays : dataRetentionDays // ignore: cast_nullable_to_non_nullable
as int,allowedDataTypes: null == allowedDataTypes ? _self.allowedDataTypes : allowedDataTypes // ignore: cast_nullable_to_non_nullable
as List<AppHealthDataType>,cloudSyncAllowedTypes: null == cloudSyncAllowedTypes ? _self.cloudSyncAllowedTypes : cloudSyncAllowedTypes // ignore: cast_nullable_to_non_nullable
as List<AppHealthDataType>,showHealthNotifications: null == showHealthNotifications ? _self.showHealthNotifications : showHealthNotifications // ignore: cast_nullable_to_non_nullable
as bool,useForAiCoaching: null == useForAiCoaching ? _self.useForAiCoaching : useForAiCoaching // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [HealthPrivacySettings].
extension HealthPrivacySettingsPatterns on HealthPrivacySettings {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _HealthPrivacySettings value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _HealthPrivacySettings() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _HealthPrivacySettings value)  $default,){
final _that = this;
switch (_that) {
case _HealthPrivacySettings():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _HealthPrivacySettings value)?  $default,){
final _that = this;
switch (_that) {
case _HealthPrivacySettings() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( bool onDeviceOnly,  bool backgroundSyncEnabled,  int syncIntervalMinutes,  bool wifiOnlySync,  int dataRetentionDays,  List<AppHealthDataType> allowedDataTypes,  List<AppHealthDataType> cloudSyncAllowedTypes,  bool showHealthNotifications,  bool useForAiCoaching)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _HealthPrivacySettings() when $default != null:
return $default(_that.onDeviceOnly,_that.backgroundSyncEnabled,_that.syncIntervalMinutes,_that.wifiOnlySync,_that.dataRetentionDays,_that.allowedDataTypes,_that.cloudSyncAllowedTypes,_that.showHealthNotifications,_that.useForAiCoaching);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( bool onDeviceOnly,  bool backgroundSyncEnabled,  int syncIntervalMinutes,  bool wifiOnlySync,  int dataRetentionDays,  List<AppHealthDataType> allowedDataTypes,  List<AppHealthDataType> cloudSyncAllowedTypes,  bool showHealthNotifications,  bool useForAiCoaching)  $default,) {final _that = this;
switch (_that) {
case _HealthPrivacySettings():
return $default(_that.onDeviceOnly,_that.backgroundSyncEnabled,_that.syncIntervalMinutes,_that.wifiOnlySync,_that.dataRetentionDays,_that.allowedDataTypes,_that.cloudSyncAllowedTypes,_that.showHealthNotifications,_that.useForAiCoaching);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( bool onDeviceOnly,  bool backgroundSyncEnabled,  int syncIntervalMinutes,  bool wifiOnlySync,  int dataRetentionDays,  List<AppHealthDataType> allowedDataTypes,  List<AppHealthDataType> cloudSyncAllowedTypes,  bool showHealthNotifications,  bool useForAiCoaching)?  $default,) {final _that = this;
switch (_that) {
case _HealthPrivacySettings() when $default != null:
return $default(_that.onDeviceOnly,_that.backgroundSyncEnabled,_that.syncIntervalMinutes,_that.wifiOnlySync,_that.dataRetentionDays,_that.allowedDataTypes,_that.cloudSyncAllowedTypes,_that.showHealthNotifications,_that.useForAiCoaching);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _HealthPrivacySettings implements HealthPrivacySettings {
  const _HealthPrivacySettings({this.onDeviceOnly = true, this.backgroundSyncEnabled = true, this.syncIntervalMinutes = 15, this.wifiOnlySync = false, this.dataRetentionDays = 90, final  List<AppHealthDataType> allowedDataTypes = const [], final  List<AppHealthDataType> cloudSyncAllowedTypes = const [], this.showHealthNotifications = true, this.useForAiCoaching = true}): _allowedDataTypes = allowedDataTypes,_cloudSyncAllowedTypes = cloudSyncAllowedTypes;
  factory _HealthPrivacySettings.fromJson(Map<String, dynamic> json) => _$HealthPrivacySettingsFromJson(json);

/// Process all health data on-device only (never sync to cloud)
@override@JsonKey() final  bool onDeviceOnly;
/// Enable background sync
@override@JsonKey() final  bool backgroundSyncEnabled;
/// Sync frequency in minutes
@override@JsonKey() final  int syncIntervalMinutes;
/// Only sync on WiFi
@override@JsonKey() final  bool wifiOnlySync;
/// Data retention period in days (0 = forever)
@override@JsonKey() final  int dataRetentionDays;
/// Which data types are allowed to be collected
 final  List<AppHealthDataType> _allowedDataTypes;
/// Which data types are allowed to be collected
@override@JsonKey() List<AppHealthDataType> get allowedDataTypes {
  if (_allowedDataTypes is EqualUnmodifiableListView) return _allowedDataTypes;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_allowedDataTypes);
}

/// Which data types can be synced to cloud (if onDeviceOnly is false)
 final  List<AppHealthDataType> _cloudSyncAllowedTypes;
/// Which data types can be synced to cloud (if onDeviceOnly is false)
@override@JsonKey() List<AppHealthDataType> get cloudSyncAllowedTypes {
  if (_cloudSyncAllowedTypes is EqualUnmodifiableListView) return _cloudSyncAllowedTypes;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_cloudSyncAllowedTypes);
}

/// Show health insights in notifications
@override@JsonKey() final  bool showHealthNotifications;
/// Use health data for AI coaching
@override@JsonKey() final  bool useForAiCoaching;

/// Create a copy of HealthPrivacySettings
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$HealthPrivacySettingsCopyWith<_HealthPrivacySettings> get copyWith => __$HealthPrivacySettingsCopyWithImpl<_HealthPrivacySettings>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$HealthPrivacySettingsToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _HealthPrivacySettings&&(identical(other.onDeviceOnly, onDeviceOnly) || other.onDeviceOnly == onDeviceOnly)&&(identical(other.backgroundSyncEnabled, backgroundSyncEnabled) || other.backgroundSyncEnabled == backgroundSyncEnabled)&&(identical(other.syncIntervalMinutes, syncIntervalMinutes) || other.syncIntervalMinutes == syncIntervalMinutes)&&(identical(other.wifiOnlySync, wifiOnlySync) || other.wifiOnlySync == wifiOnlySync)&&(identical(other.dataRetentionDays, dataRetentionDays) || other.dataRetentionDays == dataRetentionDays)&&const DeepCollectionEquality().equals(other._allowedDataTypes, _allowedDataTypes)&&const DeepCollectionEquality().equals(other._cloudSyncAllowedTypes, _cloudSyncAllowedTypes)&&(identical(other.showHealthNotifications, showHealthNotifications) || other.showHealthNotifications == showHealthNotifications)&&(identical(other.useForAiCoaching, useForAiCoaching) || other.useForAiCoaching == useForAiCoaching));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,onDeviceOnly,backgroundSyncEnabled,syncIntervalMinutes,wifiOnlySync,dataRetentionDays,const DeepCollectionEquality().hash(_allowedDataTypes),const DeepCollectionEquality().hash(_cloudSyncAllowedTypes),showHealthNotifications,useForAiCoaching);

@override
String toString() {
  return 'HealthPrivacySettings(onDeviceOnly: $onDeviceOnly, backgroundSyncEnabled: $backgroundSyncEnabled, syncIntervalMinutes: $syncIntervalMinutes, wifiOnlySync: $wifiOnlySync, dataRetentionDays: $dataRetentionDays, allowedDataTypes: $allowedDataTypes, cloudSyncAllowedTypes: $cloudSyncAllowedTypes, showHealthNotifications: $showHealthNotifications, useForAiCoaching: $useForAiCoaching)';
}


}

/// @nodoc
abstract mixin class _$HealthPrivacySettingsCopyWith<$Res> implements $HealthPrivacySettingsCopyWith<$Res> {
  factory _$HealthPrivacySettingsCopyWith(_HealthPrivacySettings value, $Res Function(_HealthPrivacySettings) _then) = __$HealthPrivacySettingsCopyWithImpl;
@override @useResult
$Res call({
 bool onDeviceOnly, bool backgroundSyncEnabled, int syncIntervalMinutes, bool wifiOnlySync, int dataRetentionDays, List<AppHealthDataType> allowedDataTypes, List<AppHealthDataType> cloudSyncAllowedTypes, bool showHealthNotifications, bool useForAiCoaching
});




}
/// @nodoc
class __$HealthPrivacySettingsCopyWithImpl<$Res>
    implements _$HealthPrivacySettingsCopyWith<$Res> {
  __$HealthPrivacySettingsCopyWithImpl(this._self, this._then);

  final _HealthPrivacySettings _self;
  final $Res Function(_HealthPrivacySettings) _then;

/// Create a copy of HealthPrivacySettings
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? onDeviceOnly = null,Object? backgroundSyncEnabled = null,Object? syncIntervalMinutes = null,Object? wifiOnlySync = null,Object? dataRetentionDays = null,Object? allowedDataTypes = null,Object? cloudSyncAllowedTypes = null,Object? showHealthNotifications = null,Object? useForAiCoaching = null,}) {
  return _then(_HealthPrivacySettings(
onDeviceOnly: null == onDeviceOnly ? _self.onDeviceOnly : onDeviceOnly // ignore: cast_nullable_to_non_nullable
as bool,backgroundSyncEnabled: null == backgroundSyncEnabled ? _self.backgroundSyncEnabled : backgroundSyncEnabled // ignore: cast_nullable_to_non_nullable
as bool,syncIntervalMinutes: null == syncIntervalMinutes ? _self.syncIntervalMinutes : syncIntervalMinutes // ignore: cast_nullable_to_non_nullable
as int,wifiOnlySync: null == wifiOnlySync ? _self.wifiOnlySync : wifiOnlySync // ignore: cast_nullable_to_non_nullable
as bool,dataRetentionDays: null == dataRetentionDays ? _self.dataRetentionDays : dataRetentionDays // ignore: cast_nullable_to_non_nullable
as int,allowedDataTypes: null == allowedDataTypes ? _self._allowedDataTypes : allowedDataTypes // ignore: cast_nullable_to_non_nullable
as List<AppHealthDataType>,cloudSyncAllowedTypes: null == cloudSyncAllowedTypes ? _self._cloudSyncAllowedTypes : cloudSyncAllowedTypes // ignore: cast_nullable_to_non_nullable
as List<AppHealthDataType>,showHealthNotifications: null == showHealthNotifications ? _self.showHealthNotifications : showHealthNotifications // ignore: cast_nullable_to_non_nullable
as bool,useForAiCoaching: null == useForAiCoaching ? _self.useForAiCoaching : useForAiCoaching // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

// dart format on
