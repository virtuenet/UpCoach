// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'ai_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AIResponse {

 String get content; String get sessionId; String get role; Map<String, dynamic>? get metadata; DateTime? get timestamp;
/// Create a copy of AIResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AIResponseCopyWith<AIResponse> get copyWith => _$AIResponseCopyWithImpl<AIResponse>(this as AIResponse, _$identity);

  /// Serializes this AIResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AIResponse&&(identical(other.content, content) || other.content == content)&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&(identical(other.role, role) || other.role == role)&&const DeepCollectionEquality().equals(other.metadata, metadata)&&(identical(other.timestamp, timestamp) || other.timestamp == timestamp));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,content,sessionId,role,const DeepCollectionEquality().hash(metadata),timestamp);

@override
String toString() {
  return 'AIResponse(content: $content, sessionId: $sessionId, role: $role, metadata: $metadata, timestamp: $timestamp)';
}


}

/// @nodoc
abstract mixin class $AIResponseCopyWith<$Res>  {
  factory $AIResponseCopyWith(AIResponse value, $Res Function(AIResponse) _then) = _$AIResponseCopyWithImpl;
@useResult
$Res call({
 String content, String sessionId, String role, Map<String, dynamic>? metadata, DateTime? timestamp
});




}
/// @nodoc
class _$AIResponseCopyWithImpl<$Res>
    implements $AIResponseCopyWith<$Res> {
  _$AIResponseCopyWithImpl(this._self, this._then);

  final AIResponse _self;
  final $Res Function(AIResponse) _then;

/// Create a copy of AIResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? content = null,Object? sessionId = null,Object? role = null,Object? metadata = freezed,Object? timestamp = freezed,}) {
  return _then(_self.copyWith(
content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as String,sessionId: null == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as String,role: null == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String,metadata: freezed == metadata ? _self.metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,timestamp: freezed == timestamp ? _self.timestamp : timestamp // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [AIResponse].
extension AIResponsePatterns on AIResponse {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AIResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AIResponse() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AIResponse value)  $default,){
final _that = this;
switch (_that) {
case _AIResponse():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AIResponse value)?  $default,){
final _that = this;
switch (_that) {
case _AIResponse() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String content,  String sessionId,  String role,  Map<String, dynamic>? metadata,  DateTime? timestamp)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AIResponse() when $default != null:
return $default(_that.content,_that.sessionId,_that.role,_that.metadata,_that.timestamp);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String content,  String sessionId,  String role,  Map<String, dynamic>? metadata,  DateTime? timestamp)  $default,) {final _that = this;
switch (_that) {
case _AIResponse():
return $default(_that.content,_that.sessionId,_that.role,_that.metadata,_that.timestamp);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String content,  String sessionId,  String role,  Map<String, dynamic>? metadata,  DateTime? timestamp)?  $default,) {final _that = this;
switch (_that) {
case _AIResponse() when $default != null:
return $default(_that.content,_that.sessionId,_that.role,_that.metadata,_that.timestamp);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AIResponse implements AIResponse {
  const _AIResponse({required this.content, required this.sessionId, this.role = 'assistant', final  Map<String, dynamic>? metadata, this.timestamp}): _metadata = metadata;
  factory _AIResponse.fromJson(Map<String, dynamic> json) => _$AIResponseFromJson(json);

@override final  String content;
@override final  String sessionId;
@override@JsonKey() final  String role;
 final  Map<String, dynamic>? _metadata;
@override Map<String, dynamic>? get metadata {
  final value = _metadata;
  if (value == null) return null;
  if (_metadata is EqualUnmodifiableMapView) return _metadata;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

@override final  DateTime? timestamp;

/// Create a copy of AIResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AIResponseCopyWith<_AIResponse> get copyWith => __$AIResponseCopyWithImpl<_AIResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AIResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AIResponse&&(identical(other.content, content) || other.content == content)&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&(identical(other.role, role) || other.role == role)&&const DeepCollectionEquality().equals(other._metadata, _metadata)&&(identical(other.timestamp, timestamp) || other.timestamp == timestamp));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,content,sessionId,role,const DeepCollectionEquality().hash(_metadata),timestamp);

@override
String toString() {
  return 'AIResponse(content: $content, sessionId: $sessionId, role: $role, metadata: $metadata, timestamp: $timestamp)';
}


}

/// @nodoc
abstract mixin class _$AIResponseCopyWith<$Res> implements $AIResponseCopyWith<$Res> {
  factory _$AIResponseCopyWith(_AIResponse value, $Res Function(_AIResponse) _then) = __$AIResponseCopyWithImpl;
@override @useResult
$Res call({
 String content, String sessionId, String role, Map<String, dynamic>? metadata, DateTime? timestamp
});




}
/// @nodoc
class __$AIResponseCopyWithImpl<$Res>
    implements _$AIResponseCopyWith<$Res> {
  __$AIResponseCopyWithImpl(this._self, this._then);

  final _AIResponse _self;
  final $Res Function(_AIResponse) _then;

/// Create a copy of AIResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? content = null,Object? sessionId = null,Object? role = null,Object? metadata = freezed,Object? timestamp = freezed,}) {
  return _then(_AIResponse(
content: null == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as String,sessionId: null == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as String,role: null == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String,metadata: freezed == metadata ? _self._metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,timestamp: freezed == timestamp ? _self.timestamp : timestamp // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$AIRecommendation {

 String get id; String get type; String get title; String get description; double get priority; List<String>? get tags; Map<String, dynamic>? get data; DateTime? get createdAt;
/// Create a copy of AIRecommendation
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AIRecommendationCopyWith<AIRecommendation> get copyWith => _$AIRecommendationCopyWithImpl<AIRecommendation>(this as AIRecommendation, _$identity);

  /// Serializes this AIRecommendation to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AIRecommendation&&(identical(other.id, id) || other.id == id)&&(identical(other.type, type) || other.type == type)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.priority, priority) || other.priority == priority)&&const DeepCollectionEquality().equals(other.tags, tags)&&const DeepCollectionEquality().equals(other.data, data)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,type,title,description,priority,const DeepCollectionEquality().hash(tags),const DeepCollectionEquality().hash(data),createdAt);

@override
String toString() {
  return 'AIRecommendation(id: $id, type: $type, title: $title, description: $description, priority: $priority, tags: $tags, data: $data, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class $AIRecommendationCopyWith<$Res>  {
  factory $AIRecommendationCopyWith(AIRecommendation value, $Res Function(AIRecommendation) _then) = _$AIRecommendationCopyWithImpl;
@useResult
$Res call({
 String id, String type, String title, String description, double priority, List<String>? tags, Map<String, dynamic>? data, DateTime? createdAt
});




}
/// @nodoc
class _$AIRecommendationCopyWithImpl<$Res>
    implements $AIRecommendationCopyWith<$Res> {
  _$AIRecommendationCopyWithImpl(this._self, this._then);

  final AIRecommendation _self;
  final $Res Function(AIRecommendation) _then;

/// Create a copy of AIRecommendation
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? type = null,Object? title = null,Object? description = null,Object? priority = null,Object? tags = freezed,Object? data = freezed,Object? createdAt = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,priority: null == priority ? _self.priority : priority // ignore: cast_nullable_to_non_nullable
as double,tags: freezed == tags ? _self.tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>?,data: freezed == data ? _self.data : data // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [AIRecommendation].
extension AIRecommendationPatterns on AIRecommendation {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AIRecommendation value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AIRecommendation() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AIRecommendation value)  $default,){
final _that = this;
switch (_that) {
case _AIRecommendation():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AIRecommendation value)?  $default,){
final _that = this;
switch (_that) {
case _AIRecommendation() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String type,  String title,  String description,  double priority,  List<String>? tags,  Map<String, dynamic>? data,  DateTime? createdAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AIRecommendation() when $default != null:
return $default(_that.id,_that.type,_that.title,_that.description,_that.priority,_that.tags,_that.data,_that.createdAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String type,  String title,  String description,  double priority,  List<String>? tags,  Map<String, dynamic>? data,  DateTime? createdAt)  $default,) {final _that = this;
switch (_that) {
case _AIRecommendation():
return $default(_that.id,_that.type,_that.title,_that.description,_that.priority,_that.tags,_that.data,_that.createdAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String type,  String title,  String description,  double priority,  List<String>? tags,  Map<String, dynamic>? data,  DateTime? createdAt)?  $default,) {final _that = this;
switch (_that) {
case _AIRecommendation() when $default != null:
return $default(_that.id,_that.type,_that.title,_that.description,_that.priority,_that.tags,_that.data,_that.createdAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AIRecommendation implements AIRecommendation {
  const _AIRecommendation({required this.id, required this.type, required this.title, required this.description, required this.priority, final  List<String>? tags, final  Map<String, dynamic>? data, this.createdAt}): _tags = tags,_data = data;
  factory _AIRecommendation.fromJson(Map<String, dynamic> json) => _$AIRecommendationFromJson(json);

@override final  String id;
@override final  String type;
@override final  String title;
@override final  String description;
@override final  double priority;
 final  List<String>? _tags;
@override List<String>? get tags {
  final value = _tags;
  if (value == null) return null;
  if (_tags is EqualUnmodifiableListView) return _tags;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

 final  Map<String, dynamic>? _data;
@override Map<String, dynamic>? get data {
  final value = _data;
  if (value == null) return null;
  if (_data is EqualUnmodifiableMapView) return _data;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}

@override final  DateTime? createdAt;

/// Create a copy of AIRecommendation
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AIRecommendationCopyWith<_AIRecommendation> get copyWith => __$AIRecommendationCopyWithImpl<_AIRecommendation>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AIRecommendationToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AIRecommendation&&(identical(other.id, id) || other.id == id)&&(identical(other.type, type) || other.type == type)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.priority, priority) || other.priority == priority)&&const DeepCollectionEquality().equals(other._tags, _tags)&&const DeepCollectionEquality().equals(other._data, _data)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,type,title,description,priority,const DeepCollectionEquality().hash(_tags),const DeepCollectionEquality().hash(_data),createdAt);

@override
String toString() {
  return 'AIRecommendation(id: $id, type: $type, title: $title, description: $description, priority: $priority, tags: $tags, data: $data, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class _$AIRecommendationCopyWith<$Res> implements $AIRecommendationCopyWith<$Res> {
  factory _$AIRecommendationCopyWith(_AIRecommendation value, $Res Function(_AIRecommendation) _then) = __$AIRecommendationCopyWithImpl;
@override @useResult
$Res call({
 String id, String type, String title, String description, double priority, List<String>? tags, Map<String, dynamic>? data, DateTime? createdAt
});




}
/// @nodoc
class __$AIRecommendationCopyWithImpl<$Res>
    implements _$AIRecommendationCopyWith<$Res> {
  __$AIRecommendationCopyWithImpl(this._self, this._then);

  final _AIRecommendation _self;
  final $Res Function(_AIRecommendation) _then;

/// Create a copy of AIRecommendation
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? type = null,Object? title = null,Object? description = null,Object? priority = null,Object? tags = freezed,Object? data = freezed,Object? createdAt = freezed,}) {
  return _then(_AIRecommendation(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,priority: null == priority ? _self.priority : priority // ignore: cast_nullable_to_non_nullable
as double,tags: freezed == tags ? _self._tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>?,data: freezed == data ? _self._data : data // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$AIPrediction {

 String get type; double get probability; String get description; DateTime? get predictedDate; List<String>? get factors; Map<String, dynamic>? get metadata;
/// Create a copy of AIPrediction
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AIPredictionCopyWith<AIPrediction> get copyWith => _$AIPredictionCopyWithImpl<AIPrediction>(this as AIPrediction, _$identity);

  /// Serializes this AIPrediction to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AIPrediction&&(identical(other.type, type) || other.type == type)&&(identical(other.probability, probability) || other.probability == probability)&&(identical(other.description, description) || other.description == description)&&(identical(other.predictedDate, predictedDate) || other.predictedDate == predictedDate)&&const DeepCollectionEquality().equals(other.factors, factors)&&const DeepCollectionEquality().equals(other.metadata, metadata));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,type,probability,description,predictedDate,const DeepCollectionEquality().hash(factors),const DeepCollectionEquality().hash(metadata));

@override
String toString() {
  return 'AIPrediction(type: $type, probability: $probability, description: $description, predictedDate: $predictedDate, factors: $factors, metadata: $metadata)';
}


}

/// @nodoc
abstract mixin class $AIPredictionCopyWith<$Res>  {
  factory $AIPredictionCopyWith(AIPrediction value, $Res Function(AIPrediction) _then) = _$AIPredictionCopyWithImpl;
@useResult
$Res call({
 String type, double probability, String description, DateTime? predictedDate, List<String>? factors, Map<String, dynamic>? metadata
});




}
/// @nodoc
class _$AIPredictionCopyWithImpl<$Res>
    implements $AIPredictionCopyWith<$Res> {
  _$AIPredictionCopyWithImpl(this._self, this._then);

  final AIPrediction _self;
  final $Res Function(AIPrediction) _then;

/// Create a copy of AIPrediction
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? type = null,Object? probability = null,Object? description = null,Object? predictedDate = freezed,Object? factors = freezed,Object? metadata = freezed,}) {
  return _then(_self.copyWith(
type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,probability: null == probability ? _self.probability : probability // ignore: cast_nullable_to_non_nullable
as double,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,predictedDate: freezed == predictedDate ? _self.predictedDate : predictedDate // ignore: cast_nullable_to_non_nullable
as DateTime?,factors: freezed == factors ? _self.factors : factors // ignore: cast_nullable_to_non_nullable
as List<String>?,metadata: freezed == metadata ? _self.metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,
  ));
}

}


/// Adds pattern-matching-related methods to [AIPrediction].
extension AIPredictionPatterns on AIPrediction {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AIPrediction value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AIPrediction() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AIPrediction value)  $default,){
final _that = this;
switch (_that) {
case _AIPrediction():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AIPrediction value)?  $default,){
final _that = this;
switch (_that) {
case _AIPrediction() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String type,  double probability,  String description,  DateTime? predictedDate,  List<String>? factors,  Map<String, dynamic>? metadata)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AIPrediction() when $default != null:
return $default(_that.type,_that.probability,_that.description,_that.predictedDate,_that.factors,_that.metadata);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String type,  double probability,  String description,  DateTime? predictedDate,  List<String>? factors,  Map<String, dynamic>? metadata)  $default,) {final _that = this;
switch (_that) {
case _AIPrediction():
return $default(_that.type,_that.probability,_that.description,_that.predictedDate,_that.factors,_that.metadata);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String type,  double probability,  String description,  DateTime? predictedDate,  List<String>? factors,  Map<String, dynamic>? metadata)?  $default,) {final _that = this;
switch (_that) {
case _AIPrediction() when $default != null:
return $default(_that.type,_that.probability,_that.description,_that.predictedDate,_that.factors,_that.metadata);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AIPrediction implements AIPrediction {
  const _AIPrediction({required this.type, required this.probability, required this.description, this.predictedDate, final  List<String>? factors, final  Map<String, dynamic>? metadata}): _factors = factors,_metadata = metadata;
  factory _AIPrediction.fromJson(Map<String, dynamic> json) => _$AIPredictionFromJson(json);

@override final  String type;
@override final  double probability;
@override final  String description;
@override final  DateTime? predictedDate;
 final  List<String>? _factors;
@override List<String>? get factors {
  final value = _factors;
  if (value == null) return null;
  if (_factors is EqualUnmodifiableListView) return _factors;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

 final  Map<String, dynamic>? _metadata;
@override Map<String, dynamic>? get metadata {
  final value = _metadata;
  if (value == null) return null;
  if (_metadata is EqualUnmodifiableMapView) return _metadata;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}


/// Create a copy of AIPrediction
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AIPredictionCopyWith<_AIPrediction> get copyWith => __$AIPredictionCopyWithImpl<_AIPrediction>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AIPredictionToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AIPrediction&&(identical(other.type, type) || other.type == type)&&(identical(other.probability, probability) || other.probability == probability)&&(identical(other.description, description) || other.description == description)&&(identical(other.predictedDate, predictedDate) || other.predictedDate == predictedDate)&&const DeepCollectionEquality().equals(other._factors, _factors)&&const DeepCollectionEquality().equals(other._metadata, _metadata));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,type,probability,description,predictedDate,const DeepCollectionEquality().hash(_factors),const DeepCollectionEquality().hash(_metadata));

@override
String toString() {
  return 'AIPrediction(type: $type, probability: $probability, description: $description, predictedDate: $predictedDate, factors: $factors, metadata: $metadata)';
}


}

/// @nodoc
abstract mixin class _$AIPredictionCopyWith<$Res> implements $AIPredictionCopyWith<$Res> {
  factory _$AIPredictionCopyWith(_AIPrediction value, $Res Function(_AIPrediction) _then) = __$AIPredictionCopyWithImpl;
@override @useResult
$Res call({
 String type, double probability, String description, DateTime? predictedDate, List<String>? factors, Map<String, dynamic>? metadata
});




}
/// @nodoc
class __$AIPredictionCopyWithImpl<$Res>
    implements _$AIPredictionCopyWith<$Res> {
  __$AIPredictionCopyWithImpl(this._self, this._then);

  final _AIPrediction _self;
  final $Res Function(_AIPrediction) _then;

/// Create a copy of AIPrediction
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? type = null,Object? probability = null,Object? description = null,Object? predictedDate = freezed,Object? factors = freezed,Object? metadata = freezed,}) {
  return _then(_AIPrediction(
type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,probability: null == probability ? _self.probability : probability // ignore: cast_nullable_to_non_nullable
as double,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,predictedDate: freezed == predictedDate ? _self.predictedDate : predictedDate // ignore: cast_nullable_to_non_nullable
as DateTime?,factors: freezed == factors ? _self._factors : factors // ignore: cast_nullable_to_non_nullable
as List<String>?,metadata: freezed == metadata ? _self._metadata : metadata // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,
  ));
}


}


/// @nodoc
mixin _$VoiceAnalysis {

 String get sessionId; Map<String, double> get emotions; double get stressLevel; double get energyLevel; double get clarity; String? get mood; List<String>? get insights; DateTime? get analyzedAt;
/// Create a copy of VoiceAnalysis
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$VoiceAnalysisCopyWith<VoiceAnalysis> get copyWith => _$VoiceAnalysisCopyWithImpl<VoiceAnalysis>(this as VoiceAnalysis, _$identity);

  /// Serializes this VoiceAnalysis to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is VoiceAnalysis&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&const DeepCollectionEquality().equals(other.emotions, emotions)&&(identical(other.stressLevel, stressLevel) || other.stressLevel == stressLevel)&&(identical(other.energyLevel, energyLevel) || other.energyLevel == energyLevel)&&(identical(other.clarity, clarity) || other.clarity == clarity)&&(identical(other.mood, mood) || other.mood == mood)&&const DeepCollectionEquality().equals(other.insights, insights)&&(identical(other.analyzedAt, analyzedAt) || other.analyzedAt == analyzedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,sessionId,const DeepCollectionEquality().hash(emotions),stressLevel,energyLevel,clarity,mood,const DeepCollectionEquality().hash(insights),analyzedAt);

@override
String toString() {
  return 'VoiceAnalysis(sessionId: $sessionId, emotions: $emotions, stressLevel: $stressLevel, energyLevel: $energyLevel, clarity: $clarity, mood: $mood, insights: $insights, analyzedAt: $analyzedAt)';
}


}

/// @nodoc
abstract mixin class $VoiceAnalysisCopyWith<$Res>  {
  factory $VoiceAnalysisCopyWith(VoiceAnalysis value, $Res Function(VoiceAnalysis) _then) = _$VoiceAnalysisCopyWithImpl;
@useResult
$Res call({
 String sessionId, Map<String, double> emotions, double stressLevel, double energyLevel, double clarity, String? mood, List<String>? insights, DateTime? analyzedAt
});




}
/// @nodoc
class _$VoiceAnalysisCopyWithImpl<$Res>
    implements $VoiceAnalysisCopyWith<$Res> {
  _$VoiceAnalysisCopyWithImpl(this._self, this._then);

  final VoiceAnalysis _self;
  final $Res Function(VoiceAnalysis) _then;

/// Create a copy of VoiceAnalysis
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? sessionId = null,Object? emotions = null,Object? stressLevel = null,Object? energyLevel = null,Object? clarity = null,Object? mood = freezed,Object? insights = freezed,Object? analyzedAt = freezed,}) {
  return _then(_self.copyWith(
sessionId: null == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as String,emotions: null == emotions ? _self.emotions : emotions // ignore: cast_nullable_to_non_nullable
as Map<String, double>,stressLevel: null == stressLevel ? _self.stressLevel : stressLevel // ignore: cast_nullable_to_non_nullable
as double,energyLevel: null == energyLevel ? _self.energyLevel : energyLevel // ignore: cast_nullable_to_non_nullable
as double,clarity: null == clarity ? _self.clarity : clarity // ignore: cast_nullable_to_non_nullable
as double,mood: freezed == mood ? _self.mood : mood // ignore: cast_nullable_to_non_nullable
as String?,insights: freezed == insights ? _self.insights : insights // ignore: cast_nullable_to_non_nullable
as List<String>?,analyzedAt: freezed == analyzedAt ? _self.analyzedAt : analyzedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [VoiceAnalysis].
extension VoiceAnalysisPatterns on VoiceAnalysis {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _VoiceAnalysis value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _VoiceAnalysis() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _VoiceAnalysis value)  $default,){
final _that = this;
switch (_that) {
case _VoiceAnalysis():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _VoiceAnalysis value)?  $default,){
final _that = this;
switch (_that) {
case _VoiceAnalysis() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String sessionId,  Map<String, double> emotions,  double stressLevel,  double energyLevel,  double clarity,  String? mood,  List<String>? insights,  DateTime? analyzedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _VoiceAnalysis() when $default != null:
return $default(_that.sessionId,_that.emotions,_that.stressLevel,_that.energyLevel,_that.clarity,_that.mood,_that.insights,_that.analyzedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String sessionId,  Map<String, double> emotions,  double stressLevel,  double energyLevel,  double clarity,  String? mood,  List<String>? insights,  DateTime? analyzedAt)  $default,) {final _that = this;
switch (_that) {
case _VoiceAnalysis():
return $default(_that.sessionId,_that.emotions,_that.stressLevel,_that.energyLevel,_that.clarity,_that.mood,_that.insights,_that.analyzedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String sessionId,  Map<String, double> emotions,  double stressLevel,  double energyLevel,  double clarity,  String? mood,  List<String>? insights,  DateTime? analyzedAt)?  $default,) {final _that = this;
switch (_that) {
case _VoiceAnalysis() when $default != null:
return $default(_that.sessionId,_that.emotions,_that.stressLevel,_that.energyLevel,_that.clarity,_that.mood,_that.insights,_that.analyzedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _VoiceAnalysis implements VoiceAnalysis {
  const _VoiceAnalysis({required this.sessionId, required final  Map<String, double> emotions, required this.stressLevel, required this.energyLevel, required this.clarity, this.mood, final  List<String>? insights, this.analyzedAt}): _emotions = emotions,_insights = insights;
  factory _VoiceAnalysis.fromJson(Map<String, dynamic> json) => _$VoiceAnalysisFromJson(json);

@override final  String sessionId;
 final  Map<String, double> _emotions;
@override Map<String, double> get emotions {
  if (_emotions is EqualUnmodifiableMapView) return _emotions;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_emotions);
}

@override final  double stressLevel;
@override final  double energyLevel;
@override final  double clarity;
@override final  String? mood;
 final  List<String>? _insights;
@override List<String>? get insights {
  final value = _insights;
  if (value == null) return null;
  if (_insights is EqualUnmodifiableListView) return _insights;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(value);
}

@override final  DateTime? analyzedAt;

/// Create a copy of VoiceAnalysis
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$VoiceAnalysisCopyWith<_VoiceAnalysis> get copyWith => __$VoiceAnalysisCopyWithImpl<_VoiceAnalysis>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$VoiceAnalysisToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _VoiceAnalysis&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&const DeepCollectionEquality().equals(other._emotions, _emotions)&&(identical(other.stressLevel, stressLevel) || other.stressLevel == stressLevel)&&(identical(other.energyLevel, energyLevel) || other.energyLevel == energyLevel)&&(identical(other.clarity, clarity) || other.clarity == clarity)&&(identical(other.mood, mood) || other.mood == mood)&&const DeepCollectionEquality().equals(other._insights, _insights)&&(identical(other.analyzedAt, analyzedAt) || other.analyzedAt == analyzedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,sessionId,const DeepCollectionEquality().hash(_emotions),stressLevel,energyLevel,clarity,mood,const DeepCollectionEquality().hash(_insights),analyzedAt);

@override
String toString() {
  return 'VoiceAnalysis(sessionId: $sessionId, emotions: $emotions, stressLevel: $stressLevel, energyLevel: $energyLevel, clarity: $clarity, mood: $mood, insights: $insights, analyzedAt: $analyzedAt)';
}


}

/// @nodoc
abstract mixin class _$VoiceAnalysisCopyWith<$Res> implements $VoiceAnalysisCopyWith<$Res> {
  factory _$VoiceAnalysisCopyWith(_VoiceAnalysis value, $Res Function(_VoiceAnalysis) _then) = __$VoiceAnalysisCopyWithImpl;
@override @useResult
$Res call({
 String sessionId, Map<String, double> emotions, double stressLevel, double energyLevel, double clarity, String? mood, List<String>? insights, DateTime? analyzedAt
});




}
/// @nodoc
class __$VoiceAnalysisCopyWithImpl<$Res>
    implements _$VoiceAnalysisCopyWith<$Res> {
  __$VoiceAnalysisCopyWithImpl(this._self, this._then);

  final _VoiceAnalysis _self;
  final $Res Function(_VoiceAnalysis) _then;

/// Create a copy of VoiceAnalysis
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? sessionId = null,Object? emotions = null,Object? stressLevel = null,Object? energyLevel = null,Object? clarity = null,Object? mood = freezed,Object? insights = freezed,Object? analyzedAt = freezed,}) {
  return _then(_VoiceAnalysis(
sessionId: null == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as String,emotions: null == emotions ? _self._emotions : emotions // ignore: cast_nullable_to_non_nullable
as Map<String, double>,stressLevel: null == stressLevel ? _self.stressLevel : stressLevel // ignore: cast_nullable_to_non_nullable
as double,energyLevel: null == energyLevel ? _self.energyLevel : energyLevel // ignore: cast_nullable_to_non_nullable
as double,clarity: null == clarity ? _self.clarity : clarity // ignore: cast_nullable_to_non_nullable
as double,mood: freezed == mood ? _self.mood : mood // ignore: cast_nullable_to_non_nullable
as String?,insights: freezed == insights ? _self._insights : insights // ignore: cast_nullable_to_non_nullable
as List<String>?,analyzedAt: freezed == analyzedAt ? _self.analyzedAt : analyzedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$LearningPath {

 String get id; String get topic; List<LearningModule> get modules; double get progress; String get difficulty; int? get estimatedDays; DateTime? get startedAt; DateTime? get completedAt;
/// Create a copy of LearningPath
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LearningPathCopyWith<LearningPath> get copyWith => _$LearningPathCopyWithImpl<LearningPath>(this as LearningPath, _$identity);

  /// Serializes this LearningPath to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is LearningPath&&(identical(other.id, id) || other.id == id)&&(identical(other.topic, topic) || other.topic == topic)&&const DeepCollectionEquality().equals(other.modules, modules)&&(identical(other.progress, progress) || other.progress == progress)&&(identical(other.difficulty, difficulty) || other.difficulty == difficulty)&&(identical(other.estimatedDays, estimatedDays) || other.estimatedDays == estimatedDays)&&(identical(other.startedAt, startedAt) || other.startedAt == startedAt)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,topic,const DeepCollectionEquality().hash(modules),progress,difficulty,estimatedDays,startedAt,completedAt);

@override
String toString() {
  return 'LearningPath(id: $id, topic: $topic, modules: $modules, progress: $progress, difficulty: $difficulty, estimatedDays: $estimatedDays, startedAt: $startedAt, completedAt: $completedAt)';
}


}

/// @nodoc
abstract mixin class $LearningPathCopyWith<$Res>  {
  factory $LearningPathCopyWith(LearningPath value, $Res Function(LearningPath) _then) = _$LearningPathCopyWithImpl;
@useResult
$Res call({
 String id, String topic, List<LearningModule> modules, double progress, String difficulty, int? estimatedDays, DateTime? startedAt, DateTime? completedAt
});




}
/// @nodoc
class _$LearningPathCopyWithImpl<$Res>
    implements $LearningPathCopyWith<$Res> {
  _$LearningPathCopyWithImpl(this._self, this._then);

  final LearningPath _self;
  final $Res Function(LearningPath) _then;

/// Create a copy of LearningPath
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? topic = null,Object? modules = null,Object? progress = null,Object? difficulty = null,Object? estimatedDays = freezed,Object? startedAt = freezed,Object? completedAt = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,topic: null == topic ? _self.topic : topic // ignore: cast_nullable_to_non_nullable
as String,modules: null == modules ? _self.modules : modules // ignore: cast_nullable_to_non_nullable
as List<LearningModule>,progress: null == progress ? _self.progress : progress // ignore: cast_nullable_to_non_nullable
as double,difficulty: null == difficulty ? _self.difficulty : difficulty // ignore: cast_nullable_to_non_nullable
as String,estimatedDays: freezed == estimatedDays ? _self.estimatedDays : estimatedDays // ignore: cast_nullable_to_non_nullable
as int?,startedAt: freezed == startedAt ? _self.startedAt : startedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [LearningPath].
extension LearningPathPatterns on LearningPath {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _LearningPath value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LearningPath() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _LearningPath value)  $default,){
final _that = this;
switch (_that) {
case _LearningPath():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _LearningPath value)?  $default,){
final _that = this;
switch (_that) {
case _LearningPath() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String topic,  List<LearningModule> modules,  double progress,  String difficulty,  int? estimatedDays,  DateTime? startedAt,  DateTime? completedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LearningPath() when $default != null:
return $default(_that.id,_that.topic,_that.modules,_that.progress,_that.difficulty,_that.estimatedDays,_that.startedAt,_that.completedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String topic,  List<LearningModule> modules,  double progress,  String difficulty,  int? estimatedDays,  DateTime? startedAt,  DateTime? completedAt)  $default,) {final _that = this;
switch (_that) {
case _LearningPath():
return $default(_that.id,_that.topic,_that.modules,_that.progress,_that.difficulty,_that.estimatedDays,_that.startedAt,_that.completedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String topic,  List<LearningModule> modules,  double progress,  String difficulty,  int? estimatedDays,  DateTime? startedAt,  DateTime? completedAt)?  $default,) {final _that = this;
switch (_that) {
case _LearningPath() when $default != null:
return $default(_that.id,_that.topic,_that.modules,_that.progress,_that.difficulty,_that.estimatedDays,_that.startedAt,_that.completedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _LearningPath implements LearningPath {
  const _LearningPath({required this.id, required this.topic, required final  List<LearningModule> modules, required this.progress, required this.difficulty, this.estimatedDays, this.startedAt, this.completedAt}): _modules = modules;
  factory _LearningPath.fromJson(Map<String, dynamic> json) => _$LearningPathFromJson(json);

@override final  String id;
@override final  String topic;
 final  List<LearningModule> _modules;
@override List<LearningModule> get modules {
  if (_modules is EqualUnmodifiableListView) return _modules;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_modules);
}

@override final  double progress;
@override final  String difficulty;
@override final  int? estimatedDays;
@override final  DateTime? startedAt;
@override final  DateTime? completedAt;

/// Create a copy of LearningPath
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LearningPathCopyWith<_LearningPath> get copyWith => __$LearningPathCopyWithImpl<_LearningPath>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$LearningPathToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _LearningPath&&(identical(other.id, id) || other.id == id)&&(identical(other.topic, topic) || other.topic == topic)&&const DeepCollectionEquality().equals(other._modules, _modules)&&(identical(other.progress, progress) || other.progress == progress)&&(identical(other.difficulty, difficulty) || other.difficulty == difficulty)&&(identical(other.estimatedDays, estimatedDays) || other.estimatedDays == estimatedDays)&&(identical(other.startedAt, startedAt) || other.startedAt == startedAt)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,topic,const DeepCollectionEquality().hash(_modules),progress,difficulty,estimatedDays,startedAt,completedAt);

@override
String toString() {
  return 'LearningPath(id: $id, topic: $topic, modules: $modules, progress: $progress, difficulty: $difficulty, estimatedDays: $estimatedDays, startedAt: $startedAt, completedAt: $completedAt)';
}


}

/// @nodoc
abstract mixin class _$LearningPathCopyWith<$Res> implements $LearningPathCopyWith<$Res> {
  factory _$LearningPathCopyWith(_LearningPath value, $Res Function(_LearningPath) _then) = __$LearningPathCopyWithImpl;
@override @useResult
$Res call({
 String id, String topic, List<LearningModule> modules, double progress, String difficulty, int? estimatedDays, DateTime? startedAt, DateTime? completedAt
});




}
/// @nodoc
class __$LearningPathCopyWithImpl<$Res>
    implements _$LearningPathCopyWith<$Res> {
  __$LearningPathCopyWithImpl(this._self, this._then);

  final _LearningPath _self;
  final $Res Function(_LearningPath) _then;

/// Create a copy of LearningPath
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? topic = null,Object? modules = null,Object? progress = null,Object? difficulty = null,Object? estimatedDays = freezed,Object? startedAt = freezed,Object? completedAt = freezed,}) {
  return _then(_LearningPath(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,topic: null == topic ? _self.topic : topic // ignore: cast_nullable_to_non_nullable
as String,modules: null == modules ? _self._modules : modules // ignore: cast_nullable_to_non_nullable
as List<LearningModule>,progress: null == progress ? _self.progress : progress // ignore: cast_nullable_to_non_nullable
as double,difficulty: null == difficulty ? _self.difficulty : difficulty // ignore: cast_nullable_to_non_nullable
as String,estimatedDays: freezed == estimatedDays ? _self.estimatedDays : estimatedDays // ignore: cast_nullable_to_non_nullable
as int?,startedAt: freezed == startedAt ? _self.startedAt : startedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$LearningModule {

 String get id; String get title; String get description; String get type; int get order; bool get completed; double? get score; int? get timeSpent; Map<String, dynamic>? get content;
/// Create a copy of LearningModule
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LearningModuleCopyWith<LearningModule> get copyWith => _$LearningModuleCopyWithImpl<LearningModule>(this as LearningModule, _$identity);

  /// Serializes this LearningModule to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is LearningModule&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.type, type) || other.type == type)&&(identical(other.order, order) || other.order == order)&&(identical(other.completed, completed) || other.completed == completed)&&(identical(other.score, score) || other.score == score)&&(identical(other.timeSpent, timeSpent) || other.timeSpent == timeSpent)&&const DeepCollectionEquality().equals(other.content, content));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,description,type,order,completed,score,timeSpent,const DeepCollectionEquality().hash(content));

@override
String toString() {
  return 'LearningModule(id: $id, title: $title, description: $description, type: $type, order: $order, completed: $completed, score: $score, timeSpent: $timeSpent, content: $content)';
}


}

/// @nodoc
abstract mixin class $LearningModuleCopyWith<$Res>  {
  factory $LearningModuleCopyWith(LearningModule value, $Res Function(LearningModule) _then) = _$LearningModuleCopyWithImpl;
@useResult
$Res call({
 String id, String title, String description, String type, int order, bool completed, double? score, int? timeSpent, Map<String, dynamic>? content
});




}
/// @nodoc
class _$LearningModuleCopyWithImpl<$Res>
    implements $LearningModuleCopyWith<$Res> {
  _$LearningModuleCopyWithImpl(this._self, this._then);

  final LearningModule _self;
  final $Res Function(LearningModule) _then;

/// Create a copy of LearningModule
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? title = null,Object? description = null,Object? type = null,Object? order = null,Object? completed = null,Object? score = freezed,Object? timeSpent = freezed,Object? content = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,order: null == order ? _self.order : order // ignore: cast_nullable_to_non_nullable
as int,completed: null == completed ? _self.completed : completed // ignore: cast_nullable_to_non_nullable
as bool,score: freezed == score ? _self.score : score // ignore: cast_nullable_to_non_nullable
as double?,timeSpent: freezed == timeSpent ? _self.timeSpent : timeSpent // ignore: cast_nullable_to_non_nullable
as int?,content: freezed == content ? _self.content : content // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,
  ));
}

}


/// Adds pattern-matching-related methods to [LearningModule].
extension LearningModulePatterns on LearningModule {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _LearningModule value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LearningModule() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _LearningModule value)  $default,){
final _that = this;
switch (_that) {
case _LearningModule():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _LearningModule value)?  $default,){
final _that = this;
switch (_that) {
case _LearningModule() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String title,  String description,  String type,  int order,  bool completed,  double? score,  int? timeSpent,  Map<String, dynamic>? content)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LearningModule() when $default != null:
return $default(_that.id,_that.title,_that.description,_that.type,_that.order,_that.completed,_that.score,_that.timeSpent,_that.content);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String title,  String description,  String type,  int order,  bool completed,  double? score,  int? timeSpent,  Map<String, dynamic>? content)  $default,) {final _that = this;
switch (_that) {
case _LearningModule():
return $default(_that.id,_that.title,_that.description,_that.type,_that.order,_that.completed,_that.score,_that.timeSpent,_that.content);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String title,  String description,  String type,  int order,  bool completed,  double? score,  int? timeSpent,  Map<String, dynamic>? content)?  $default,) {final _that = this;
switch (_that) {
case _LearningModule() when $default != null:
return $default(_that.id,_that.title,_that.description,_that.type,_that.order,_that.completed,_that.score,_that.timeSpent,_that.content);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _LearningModule implements LearningModule {
  const _LearningModule({required this.id, required this.title, required this.description, required this.type, required this.order, required this.completed, this.score, this.timeSpent, final  Map<String, dynamic>? content}): _content = content;
  factory _LearningModule.fromJson(Map<String, dynamic> json) => _$LearningModuleFromJson(json);

@override final  String id;
@override final  String title;
@override final  String description;
@override final  String type;
@override final  int order;
@override final  bool completed;
@override final  double? score;
@override final  int? timeSpent;
 final  Map<String, dynamic>? _content;
@override Map<String, dynamic>? get content {
  final value = _content;
  if (value == null) return null;
  if (_content is EqualUnmodifiableMapView) return _content;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(value);
}


/// Create a copy of LearningModule
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LearningModuleCopyWith<_LearningModule> get copyWith => __$LearningModuleCopyWithImpl<_LearningModule>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$LearningModuleToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _LearningModule&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.type, type) || other.type == type)&&(identical(other.order, order) || other.order == order)&&(identical(other.completed, completed) || other.completed == completed)&&(identical(other.score, score) || other.score == score)&&(identical(other.timeSpent, timeSpent) || other.timeSpent == timeSpent)&&const DeepCollectionEquality().equals(other._content, _content));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,description,type,order,completed,score,timeSpent,const DeepCollectionEquality().hash(_content));

@override
String toString() {
  return 'LearningModule(id: $id, title: $title, description: $description, type: $type, order: $order, completed: $completed, score: $score, timeSpent: $timeSpent, content: $content)';
}


}

/// @nodoc
abstract mixin class _$LearningModuleCopyWith<$Res> implements $LearningModuleCopyWith<$Res> {
  factory _$LearningModuleCopyWith(_LearningModule value, $Res Function(_LearningModule) _then) = __$LearningModuleCopyWithImpl;
@override @useResult
$Res call({
 String id, String title, String description, String type, int order, bool completed, double? score, int? timeSpent, Map<String, dynamic>? content
});




}
/// @nodoc
class __$LearningModuleCopyWithImpl<$Res>
    implements _$LearningModuleCopyWith<$Res> {
  __$LearningModuleCopyWithImpl(this._self, this._then);

  final _LearningModule _self;
  final $Res Function(_LearningModule) _then;

/// Create a copy of LearningModule
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? title = null,Object? description = null,Object? type = null,Object? order = null,Object? completed = null,Object? score = freezed,Object? timeSpent = freezed,Object? content = freezed,}) {
  return _then(_LearningModule(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,order: null == order ? _self.order : order // ignore: cast_nullable_to_non_nullable
as int,completed: null == completed ? _self.completed : completed // ignore: cast_nullable_to_non_nullable
as bool,score: freezed == score ? _self.score : score // ignore: cast_nullable_to_non_nullable
as double?,timeSpent: freezed == timeSpent ? _self.timeSpent : timeSpent // ignore: cast_nullable_to_non_nullable
as int?,content: freezed == content ? _self._content : content // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>?,
  ));
}


}

// dart format on
