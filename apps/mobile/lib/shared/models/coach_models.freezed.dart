// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'coach_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AvailabilitySlot {

 String get start; String get end;
/// Create a copy of AvailabilitySlot
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AvailabilitySlotCopyWith<AvailabilitySlot> get copyWith => _$AvailabilitySlotCopyWithImpl<AvailabilitySlot>(this as AvailabilitySlot, _$identity);

  /// Serializes this AvailabilitySlot to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AvailabilitySlot&&(identical(other.start, start) || other.start == start)&&(identical(other.end, end) || other.end == end));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,start,end);

@override
String toString() {
  return 'AvailabilitySlot(start: $start, end: $end)';
}


}

/// @nodoc
abstract mixin class $AvailabilitySlotCopyWith<$Res>  {
  factory $AvailabilitySlotCopyWith(AvailabilitySlot value, $Res Function(AvailabilitySlot) _then) = _$AvailabilitySlotCopyWithImpl;
@useResult
$Res call({
 String start, String end
});




}
/// @nodoc
class _$AvailabilitySlotCopyWithImpl<$Res>
    implements $AvailabilitySlotCopyWith<$Res> {
  _$AvailabilitySlotCopyWithImpl(this._self, this._then);

  final AvailabilitySlot _self;
  final $Res Function(AvailabilitySlot) _then;

/// Create a copy of AvailabilitySlot
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? start = null,Object? end = null,}) {
  return _then(_self.copyWith(
start: null == start ? _self.start : start // ignore: cast_nullable_to_non_nullable
as String,end: null == end ? _self.end : end // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [AvailabilitySlot].
extension AvailabilitySlotPatterns on AvailabilitySlot {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AvailabilitySlot value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AvailabilitySlot() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AvailabilitySlot value)  $default,){
final _that = this;
switch (_that) {
case _AvailabilitySlot():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AvailabilitySlot value)?  $default,){
final _that = this;
switch (_that) {
case _AvailabilitySlot() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String start,  String end)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AvailabilitySlot() when $default != null:
return $default(_that.start,_that.end);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String start,  String end)  $default,) {final _that = this;
switch (_that) {
case _AvailabilitySlot():
return $default(_that.start,_that.end);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String start,  String end)?  $default,) {final _that = this;
switch (_that) {
case _AvailabilitySlot() when $default != null:
return $default(_that.start,_that.end);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AvailabilitySlot implements AvailabilitySlot {
  const _AvailabilitySlot({required this.start, required this.end});
  factory _AvailabilitySlot.fromJson(Map<String, dynamic> json) => _$AvailabilitySlotFromJson(json);

@override final  String start;
@override final  String end;

/// Create a copy of AvailabilitySlot
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AvailabilitySlotCopyWith<_AvailabilitySlot> get copyWith => __$AvailabilitySlotCopyWithImpl<_AvailabilitySlot>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AvailabilitySlotToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AvailabilitySlot&&(identical(other.start, start) || other.start == start)&&(identical(other.end, end) || other.end == end));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,start,end);

@override
String toString() {
  return 'AvailabilitySlot(start: $start, end: $end)';
}


}

/// @nodoc
abstract mixin class _$AvailabilitySlotCopyWith<$Res> implements $AvailabilitySlotCopyWith<$Res> {
  factory _$AvailabilitySlotCopyWith(_AvailabilitySlot value, $Res Function(_AvailabilitySlot) _then) = __$AvailabilitySlotCopyWithImpl;
@override @useResult
$Res call({
 String start, String end
});




}
/// @nodoc
class __$AvailabilitySlotCopyWithImpl<$Res>
    implements _$AvailabilitySlotCopyWith<$Res> {
  __$AvailabilitySlotCopyWithImpl(this._self, this._then);

  final _AvailabilitySlot _self;
  final $Res Function(_AvailabilitySlot) _then;

/// Create a copy of AvailabilitySlot
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? start = null,Object? end = null,}) {
  return _then(_AvailabilitySlot(
start: null == start ? _self.start : start // ignore: cast_nullable_to_non_nullable
as String,end: null == end ? _self.end : end // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$AvailabilitySchedule {

 List<AvailabilitySlot> get monday; List<AvailabilitySlot> get tuesday; List<AvailabilitySlot> get wednesday; List<AvailabilitySlot> get thursday; List<AvailabilitySlot> get friday; List<AvailabilitySlot> get saturday; List<AvailabilitySlot> get sunday;
/// Create a copy of AvailabilitySchedule
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AvailabilityScheduleCopyWith<AvailabilitySchedule> get copyWith => _$AvailabilityScheduleCopyWithImpl<AvailabilitySchedule>(this as AvailabilitySchedule, _$identity);

  /// Serializes this AvailabilitySchedule to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AvailabilitySchedule&&const DeepCollectionEquality().equals(other.monday, monday)&&const DeepCollectionEquality().equals(other.tuesday, tuesday)&&const DeepCollectionEquality().equals(other.wednesday, wednesday)&&const DeepCollectionEquality().equals(other.thursday, thursday)&&const DeepCollectionEquality().equals(other.friday, friday)&&const DeepCollectionEquality().equals(other.saturday, saturday)&&const DeepCollectionEquality().equals(other.sunday, sunday));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(monday),const DeepCollectionEquality().hash(tuesday),const DeepCollectionEquality().hash(wednesday),const DeepCollectionEquality().hash(thursday),const DeepCollectionEquality().hash(friday),const DeepCollectionEquality().hash(saturday),const DeepCollectionEquality().hash(sunday));

@override
String toString() {
  return 'AvailabilitySchedule(monday: $monday, tuesday: $tuesday, wednesday: $wednesday, thursday: $thursday, friday: $friday, saturday: $saturday, sunday: $sunday)';
}


}

/// @nodoc
abstract mixin class $AvailabilityScheduleCopyWith<$Res>  {
  factory $AvailabilityScheduleCopyWith(AvailabilitySchedule value, $Res Function(AvailabilitySchedule) _then) = _$AvailabilityScheduleCopyWithImpl;
@useResult
$Res call({
 List<AvailabilitySlot> monday, List<AvailabilitySlot> tuesday, List<AvailabilitySlot> wednesday, List<AvailabilitySlot> thursday, List<AvailabilitySlot> friday, List<AvailabilitySlot> saturday, List<AvailabilitySlot> sunday
});




}
/// @nodoc
class _$AvailabilityScheduleCopyWithImpl<$Res>
    implements $AvailabilityScheduleCopyWith<$Res> {
  _$AvailabilityScheduleCopyWithImpl(this._self, this._then);

  final AvailabilitySchedule _self;
  final $Res Function(AvailabilitySchedule) _then;

/// Create a copy of AvailabilitySchedule
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? monday = null,Object? tuesday = null,Object? wednesday = null,Object? thursday = null,Object? friday = null,Object? saturday = null,Object? sunday = null,}) {
  return _then(_self.copyWith(
monday: null == monday ? _self.monday : monday // ignore: cast_nullable_to_non_nullable
as List<AvailabilitySlot>,tuesday: null == tuesday ? _self.tuesday : tuesday // ignore: cast_nullable_to_non_nullable
as List<AvailabilitySlot>,wednesday: null == wednesday ? _self.wednesday : wednesday // ignore: cast_nullable_to_non_nullable
as List<AvailabilitySlot>,thursday: null == thursday ? _self.thursday : thursday // ignore: cast_nullable_to_non_nullable
as List<AvailabilitySlot>,friday: null == friday ? _self.friday : friday // ignore: cast_nullable_to_non_nullable
as List<AvailabilitySlot>,saturday: null == saturday ? _self.saturday : saturday // ignore: cast_nullable_to_non_nullable
as List<AvailabilitySlot>,sunday: null == sunday ? _self.sunday : sunday // ignore: cast_nullable_to_non_nullable
as List<AvailabilitySlot>,
  ));
}

}


/// Adds pattern-matching-related methods to [AvailabilitySchedule].
extension AvailabilitySchedulePatterns on AvailabilitySchedule {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AvailabilitySchedule value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AvailabilitySchedule() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AvailabilitySchedule value)  $default,){
final _that = this;
switch (_that) {
case _AvailabilitySchedule():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AvailabilitySchedule value)?  $default,){
final _that = this;
switch (_that) {
case _AvailabilitySchedule() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<AvailabilitySlot> monday,  List<AvailabilitySlot> tuesday,  List<AvailabilitySlot> wednesday,  List<AvailabilitySlot> thursday,  List<AvailabilitySlot> friday,  List<AvailabilitySlot> saturday,  List<AvailabilitySlot> sunday)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AvailabilitySchedule() when $default != null:
return $default(_that.monday,_that.tuesday,_that.wednesday,_that.thursday,_that.friday,_that.saturday,_that.sunday);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<AvailabilitySlot> monday,  List<AvailabilitySlot> tuesday,  List<AvailabilitySlot> wednesday,  List<AvailabilitySlot> thursday,  List<AvailabilitySlot> friday,  List<AvailabilitySlot> saturday,  List<AvailabilitySlot> sunday)  $default,) {final _that = this;
switch (_that) {
case _AvailabilitySchedule():
return $default(_that.monday,_that.tuesday,_that.wednesday,_that.thursday,_that.friday,_that.saturday,_that.sunday);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<AvailabilitySlot> monday,  List<AvailabilitySlot> tuesday,  List<AvailabilitySlot> wednesday,  List<AvailabilitySlot> thursday,  List<AvailabilitySlot> friday,  List<AvailabilitySlot> saturday,  List<AvailabilitySlot> sunday)?  $default,) {final _that = this;
switch (_that) {
case _AvailabilitySchedule() when $default != null:
return $default(_that.monday,_that.tuesday,_that.wednesday,_that.thursday,_that.friday,_that.saturday,_that.sunday);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AvailabilitySchedule implements AvailabilitySchedule {
  const _AvailabilitySchedule({final  List<AvailabilitySlot> monday = const [], final  List<AvailabilitySlot> tuesday = const [], final  List<AvailabilitySlot> wednesday = const [], final  List<AvailabilitySlot> thursday = const [], final  List<AvailabilitySlot> friday = const [], final  List<AvailabilitySlot> saturday = const [], final  List<AvailabilitySlot> sunday = const []}): _monday = monday,_tuesday = tuesday,_wednesday = wednesday,_thursday = thursday,_friday = friday,_saturday = saturday,_sunday = sunday;
  factory _AvailabilitySchedule.fromJson(Map<String, dynamic> json) => _$AvailabilityScheduleFromJson(json);

 final  List<AvailabilitySlot> _monday;
@override@JsonKey() List<AvailabilitySlot> get monday {
  if (_monday is EqualUnmodifiableListView) return _monday;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_monday);
}

 final  List<AvailabilitySlot> _tuesday;
@override@JsonKey() List<AvailabilitySlot> get tuesday {
  if (_tuesday is EqualUnmodifiableListView) return _tuesday;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_tuesday);
}

 final  List<AvailabilitySlot> _wednesday;
@override@JsonKey() List<AvailabilitySlot> get wednesday {
  if (_wednesday is EqualUnmodifiableListView) return _wednesday;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_wednesday);
}

 final  List<AvailabilitySlot> _thursday;
@override@JsonKey() List<AvailabilitySlot> get thursday {
  if (_thursday is EqualUnmodifiableListView) return _thursday;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_thursday);
}

 final  List<AvailabilitySlot> _friday;
@override@JsonKey() List<AvailabilitySlot> get friday {
  if (_friday is EqualUnmodifiableListView) return _friday;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_friday);
}

 final  List<AvailabilitySlot> _saturday;
@override@JsonKey() List<AvailabilitySlot> get saturday {
  if (_saturday is EqualUnmodifiableListView) return _saturday;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_saturday);
}

 final  List<AvailabilitySlot> _sunday;
@override@JsonKey() List<AvailabilitySlot> get sunday {
  if (_sunday is EqualUnmodifiableListView) return _sunday;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_sunday);
}


/// Create a copy of AvailabilitySchedule
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AvailabilityScheduleCopyWith<_AvailabilitySchedule> get copyWith => __$AvailabilityScheduleCopyWithImpl<_AvailabilitySchedule>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AvailabilityScheduleToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AvailabilitySchedule&&const DeepCollectionEquality().equals(other._monday, _monday)&&const DeepCollectionEquality().equals(other._tuesday, _tuesday)&&const DeepCollectionEquality().equals(other._wednesday, _wednesday)&&const DeepCollectionEquality().equals(other._thursday, _thursday)&&const DeepCollectionEquality().equals(other._friday, _friday)&&const DeepCollectionEquality().equals(other._saturday, _saturday)&&const DeepCollectionEquality().equals(other._sunday, _sunday));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_monday),const DeepCollectionEquality().hash(_tuesday),const DeepCollectionEquality().hash(_wednesday),const DeepCollectionEquality().hash(_thursday),const DeepCollectionEquality().hash(_friday),const DeepCollectionEquality().hash(_saturday),const DeepCollectionEquality().hash(_sunday));

@override
String toString() {
  return 'AvailabilitySchedule(monday: $monday, tuesday: $tuesday, wednesday: $wednesday, thursday: $thursday, friday: $friday, saturday: $saturday, sunday: $sunday)';
}


}

/// @nodoc
abstract mixin class _$AvailabilityScheduleCopyWith<$Res> implements $AvailabilityScheduleCopyWith<$Res> {
  factory _$AvailabilityScheduleCopyWith(_AvailabilitySchedule value, $Res Function(_AvailabilitySchedule) _then) = __$AvailabilityScheduleCopyWithImpl;
@override @useResult
$Res call({
 List<AvailabilitySlot> monday, List<AvailabilitySlot> tuesday, List<AvailabilitySlot> wednesday, List<AvailabilitySlot> thursday, List<AvailabilitySlot> friday, List<AvailabilitySlot> saturday, List<AvailabilitySlot> sunday
});




}
/// @nodoc
class __$AvailabilityScheduleCopyWithImpl<$Res>
    implements _$AvailabilityScheduleCopyWith<$Res> {
  __$AvailabilityScheduleCopyWithImpl(this._self, this._then);

  final _AvailabilitySchedule _self;
  final $Res Function(_AvailabilitySchedule) _then;

/// Create a copy of AvailabilitySchedule
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? monday = null,Object? tuesday = null,Object? wednesday = null,Object? thursday = null,Object? friday = null,Object? saturday = null,Object? sunday = null,}) {
  return _then(_AvailabilitySchedule(
monday: null == monday ? _self._monday : monday // ignore: cast_nullable_to_non_nullable
as List<AvailabilitySlot>,tuesday: null == tuesday ? _self._tuesday : tuesday // ignore: cast_nullable_to_non_nullable
as List<AvailabilitySlot>,wednesday: null == wednesday ? _self._wednesday : wednesday // ignore: cast_nullable_to_non_nullable
as List<AvailabilitySlot>,thursday: null == thursday ? _self._thursday : thursday // ignore: cast_nullable_to_non_nullable
as List<AvailabilitySlot>,friday: null == friday ? _self._friday : friday // ignore: cast_nullable_to_non_nullable
as List<AvailabilitySlot>,saturday: null == saturday ? _self._saturday : saturday // ignore: cast_nullable_to_non_nullable
as List<AvailabilitySlot>,sunday: null == sunday ? _self._sunday : sunday // ignore: cast_nullable_to_non_nullable
as List<AvailabilitySlot>,
  ));
}


}


/// @nodoc
mixin _$Certification {

 String get name; String get issuer; String get date; String? get verificationUrl;
/// Create a copy of Certification
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CertificationCopyWith<Certification> get copyWith => _$CertificationCopyWithImpl<Certification>(this as Certification, _$identity);

  /// Serializes this Certification to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Certification&&(identical(other.name, name) || other.name == name)&&(identical(other.issuer, issuer) || other.issuer == issuer)&&(identical(other.date, date) || other.date == date)&&(identical(other.verificationUrl, verificationUrl) || other.verificationUrl == verificationUrl));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,issuer,date,verificationUrl);

@override
String toString() {
  return 'Certification(name: $name, issuer: $issuer, date: $date, verificationUrl: $verificationUrl)';
}


}

/// @nodoc
abstract mixin class $CertificationCopyWith<$Res>  {
  factory $CertificationCopyWith(Certification value, $Res Function(Certification) _then) = _$CertificationCopyWithImpl;
@useResult
$Res call({
 String name, String issuer, String date, String? verificationUrl
});




}
/// @nodoc
class _$CertificationCopyWithImpl<$Res>
    implements $CertificationCopyWith<$Res> {
  _$CertificationCopyWithImpl(this._self, this._then);

  final Certification _self;
  final $Res Function(Certification) _then;

/// Create a copy of Certification
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? name = null,Object? issuer = null,Object? date = null,Object? verificationUrl = freezed,}) {
  return _then(_self.copyWith(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,issuer: null == issuer ? _self.issuer : issuer // ignore: cast_nullable_to_non_nullable
as String,date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,verificationUrl: freezed == verificationUrl ? _self.verificationUrl : verificationUrl // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [Certification].
extension CertificationPatterns on Certification {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Certification value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Certification() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Certification value)  $default,){
final _that = this;
switch (_that) {
case _Certification():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Certification value)?  $default,){
final _that = this;
switch (_that) {
case _Certification() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String name,  String issuer,  String date,  String? verificationUrl)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Certification() when $default != null:
return $default(_that.name,_that.issuer,_that.date,_that.verificationUrl);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String name,  String issuer,  String date,  String? verificationUrl)  $default,) {final _that = this;
switch (_that) {
case _Certification():
return $default(_that.name,_that.issuer,_that.date,_that.verificationUrl);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String name,  String issuer,  String date,  String? verificationUrl)?  $default,) {final _that = this;
switch (_that) {
case _Certification() when $default != null:
return $default(_that.name,_that.issuer,_that.date,_that.verificationUrl);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Certification implements Certification {
  const _Certification({required this.name, required this.issuer, required this.date, this.verificationUrl});
  factory _Certification.fromJson(Map<String, dynamic> json) => _$CertificationFromJson(json);

@override final  String name;
@override final  String issuer;
@override final  String date;
@override final  String? verificationUrl;

/// Create a copy of Certification
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CertificationCopyWith<_Certification> get copyWith => __$CertificationCopyWithImpl<_Certification>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CertificationToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Certification&&(identical(other.name, name) || other.name == name)&&(identical(other.issuer, issuer) || other.issuer == issuer)&&(identical(other.date, date) || other.date == date)&&(identical(other.verificationUrl, verificationUrl) || other.verificationUrl == verificationUrl));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,issuer,date,verificationUrl);

@override
String toString() {
  return 'Certification(name: $name, issuer: $issuer, date: $date, verificationUrl: $verificationUrl)';
}


}

/// @nodoc
abstract mixin class _$CertificationCopyWith<$Res> implements $CertificationCopyWith<$Res> {
  factory _$CertificationCopyWith(_Certification value, $Res Function(_Certification) _then) = __$CertificationCopyWithImpl;
@override @useResult
$Res call({
 String name, String issuer, String date, String? verificationUrl
});




}
/// @nodoc
class __$CertificationCopyWithImpl<$Res>
    implements _$CertificationCopyWith<$Res> {
  __$CertificationCopyWithImpl(this._self, this._then);

  final _Certification _self;
  final $Res Function(_Certification) _then;

/// Create a copy of Certification
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? name = null,Object? issuer = null,Object? date = null,Object? verificationUrl = freezed,}) {
  return _then(_Certification(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,issuer: null == issuer ? _self.issuer : issuer // ignore: cast_nullable_to_non_nullable
as String,date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,verificationUrl: freezed == verificationUrl ? _self.verificationUrl : verificationUrl // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$SharedResource {

 String get name; String get url; String get type; DateTime get uploadedAt;
/// Create a copy of SharedResource
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SharedResourceCopyWith<SharedResource> get copyWith => _$SharedResourceCopyWithImpl<SharedResource>(this as SharedResource, _$identity);

  /// Serializes this SharedResource to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SharedResource&&(identical(other.name, name) || other.name == name)&&(identical(other.url, url) || other.url == url)&&(identical(other.type, type) || other.type == type)&&(identical(other.uploadedAt, uploadedAt) || other.uploadedAt == uploadedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,url,type,uploadedAt);

@override
String toString() {
  return 'SharedResource(name: $name, url: $url, type: $type, uploadedAt: $uploadedAt)';
}


}

/// @nodoc
abstract mixin class $SharedResourceCopyWith<$Res>  {
  factory $SharedResourceCopyWith(SharedResource value, $Res Function(SharedResource) _then) = _$SharedResourceCopyWithImpl;
@useResult
$Res call({
 String name, String url, String type, DateTime uploadedAt
});




}
/// @nodoc
class _$SharedResourceCopyWithImpl<$Res>
    implements $SharedResourceCopyWith<$Res> {
  _$SharedResourceCopyWithImpl(this._self, this._then);

  final SharedResource _self;
  final $Res Function(SharedResource) _then;

/// Create a copy of SharedResource
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? name = null,Object? url = null,Object? type = null,Object? uploadedAt = null,}) {
  return _then(_self.copyWith(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,url: null == url ? _self.url : url // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,uploadedAt: null == uploadedAt ? _self.uploadedAt : uploadedAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [SharedResource].
extension SharedResourcePatterns on SharedResource {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SharedResource value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SharedResource() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SharedResource value)  $default,){
final _that = this;
switch (_that) {
case _SharedResource():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SharedResource value)?  $default,){
final _that = this;
switch (_that) {
case _SharedResource() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String name,  String url,  String type,  DateTime uploadedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SharedResource() when $default != null:
return $default(_that.name,_that.url,_that.type,_that.uploadedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String name,  String url,  String type,  DateTime uploadedAt)  $default,) {final _that = this;
switch (_that) {
case _SharedResource():
return $default(_that.name,_that.url,_that.type,_that.uploadedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String name,  String url,  String type,  DateTime uploadedAt)?  $default,) {final _that = this;
switch (_that) {
case _SharedResource() when $default != null:
return $default(_that.name,_that.url,_that.type,_that.uploadedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SharedResource implements SharedResource {
  const _SharedResource({required this.name, required this.url, required this.type, required this.uploadedAt});
  factory _SharedResource.fromJson(Map<String, dynamic> json) => _$SharedResourceFromJson(json);

@override final  String name;
@override final  String url;
@override final  String type;
@override final  DateTime uploadedAt;

/// Create a copy of SharedResource
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SharedResourceCopyWith<_SharedResource> get copyWith => __$SharedResourceCopyWithImpl<_SharedResource>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SharedResourceToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SharedResource&&(identical(other.name, name) || other.name == name)&&(identical(other.url, url) || other.url == url)&&(identical(other.type, type) || other.type == type)&&(identical(other.uploadedAt, uploadedAt) || other.uploadedAt == uploadedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,url,type,uploadedAt);

@override
String toString() {
  return 'SharedResource(name: $name, url: $url, type: $type, uploadedAt: $uploadedAt)';
}


}

/// @nodoc
abstract mixin class _$SharedResourceCopyWith<$Res> implements $SharedResourceCopyWith<$Res> {
  factory _$SharedResourceCopyWith(_SharedResource value, $Res Function(_SharedResource) _then) = __$SharedResourceCopyWithImpl;
@override @useResult
$Res call({
 String name, String url, String type, DateTime uploadedAt
});




}
/// @nodoc
class __$SharedResourceCopyWithImpl<$Res>
    implements _$SharedResourceCopyWith<$Res> {
  __$SharedResourceCopyWithImpl(this._self, this._then);

  final _SharedResource _self;
  final $Res Function(_SharedResource) _then;

/// Create a copy of SharedResource
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? name = null,Object? url = null,Object? type = null,Object? uploadedAt = null,}) {
  return _then(_SharedResource(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,url: null == url ? _self.url : url // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,uploadedAt: null == uploadedAt ? _self.uploadedAt : uploadedAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}


/// @nodoc
mixin _$CoachProfile {

 int get id; int get userId; String get displayName; String? get title; String? get bio; List<String> get specializations; List<Certification> get certifications; int get experienceYears; List<String> get languages; String get timezone;// Availability & Booking
 bool get isAvailable; double? get hourlyRate; String get currency; double get minBookingHours; double get maxBookingHours; AvailabilitySchedule? get availabilitySchedule; int get bookingBufferHours;// Profile Media
 String? get profileImageUrl; String? get coverImageUrl; String? get introVideoUrl; List<String> get galleryImages;// Stats & Rating
 int get totalSessions; int get totalClients; double get averageRating; int get ratingCount; double? get responseTimeHours;// Settings
 bool get isVerified; bool get isFeatured; bool get isActive; bool get acceptsInsurance; List<String> get acceptedPaymentMethods;// Metadata
 List<String> get tags; String? get seoSlug;// Timestamps
 DateTime? get createdAt; DateTime? get updatedAt;// Related data (may be loaded separately)
 List<CoachPackage> get packages; List<CoachReview> get reviews;
/// Create a copy of CoachProfile
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CoachProfileCopyWith<CoachProfile> get copyWith => _$CoachProfileCopyWithImpl<CoachProfile>(this as CoachProfile, _$identity);

  /// Serializes this CoachProfile to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CoachProfile&&(identical(other.id, id) || other.id == id)&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.title, title) || other.title == title)&&(identical(other.bio, bio) || other.bio == bio)&&const DeepCollectionEquality().equals(other.specializations, specializations)&&const DeepCollectionEquality().equals(other.certifications, certifications)&&(identical(other.experienceYears, experienceYears) || other.experienceYears == experienceYears)&&const DeepCollectionEquality().equals(other.languages, languages)&&(identical(other.timezone, timezone) || other.timezone == timezone)&&(identical(other.isAvailable, isAvailable) || other.isAvailable == isAvailable)&&(identical(other.hourlyRate, hourlyRate) || other.hourlyRate == hourlyRate)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.minBookingHours, minBookingHours) || other.minBookingHours == minBookingHours)&&(identical(other.maxBookingHours, maxBookingHours) || other.maxBookingHours == maxBookingHours)&&(identical(other.availabilitySchedule, availabilitySchedule) || other.availabilitySchedule == availabilitySchedule)&&(identical(other.bookingBufferHours, bookingBufferHours) || other.bookingBufferHours == bookingBufferHours)&&(identical(other.profileImageUrl, profileImageUrl) || other.profileImageUrl == profileImageUrl)&&(identical(other.coverImageUrl, coverImageUrl) || other.coverImageUrl == coverImageUrl)&&(identical(other.introVideoUrl, introVideoUrl) || other.introVideoUrl == introVideoUrl)&&const DeepCollectionEquality().equals(other.galleryImages, galleryImages)&&(identical(other.totalSessions, totalSessions) || other.totalSessions == totalSessions)&&(identical(other.totalClients, totalClients) || other.totalClients == totalClients)&&(identical(other.averageRating, averageRating) || other.averageRating == averageRating)&&(identical(other.ratingCount, ratingCount) || other.ratingCount == ratingCount)&&(identical(other.responseTimeHours, responseTimeHours) || other.responseTimeHours == responseTimeHours)&&(identical(other.isVerified, isVerified) || other.isVerified == isVerified)&&(identical(other.isFeatured, isFeatured) || other.isFeatured == isFeatured)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.acceptsInsurance, acceptsInsurance) || other.acceptsInsurance == acceptsInsurance)&&const DeepCollectionEquality().equals(other.acceptedPaymentMethods, acceptedPaymentMethods)&&const DeepCollectionEquality().equals(other.tags, tags)&&(identical(other.seoSlug, seoSlug) || other.seoSlug == seoSlug)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&const DeepCollectionEquality().equals(other.packages, packages)&&const DeepCollectionEquality().equals(other.reviews, reviews));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,userId,displayName,title,bio,const DeepCollectionEquality().hash(specializations),const DeepCollectionEquality().hash(certifications),experienceYears,const DeepCollectionEquality().hash(languages),timezone,isAvailable,hourlyRate,currency,minBookingHours,maxBookingHours,availabilitySchedule,bookingBufferHours,profileImageUrl,coverImageUrl,introVideoUrl,const DeepCollectionEquality().hash(galleryImages),totalSessions,totalClients,averageRating,ratingCount,responseTimeHours,isVerified,isFeatured,isActive,acceptsInsurance,const DeepCollectionEquality().hash(acceptedPaymentMethods),const DeepCollectionEquality().hash(tags),seoSlug,createdAt,updatedAt,const DeepCollectionEquality().hash(packages),const DeepCollectionEquality().hash(reviews)]);

@override
String toString() {
  return 'CoachProfile(id: $id, userId: $userId, displayName: $displayName, title: $title, bio: $bio, specializations: $specializations, certifications: $certifications, experienceYears: $experienceYears, languages: $languages, timezone: $timezone, isAvailable: $isAvailable, hourlyRate: $hourlyRate, currency: $currency, minBookingHours: $minBookingHours, maxBookingHours: $maxBookingHours, availabilitySchedule: $availabilitySchedule, bookingBufferHours: $bookingBufferHours, profileImageUrl: $profileImageUrl, coverImageUrl: $coverImageUrl, introVideoUrl: $introVideoUrl, galleryImages: $galleryImages, totalSessions: $totalSessions, totalClients: $totalClients, averageRating: $averageRating, ratingCount: $ratingCount, responseTimeHours: $responseTimeHours, isVerified: $isVerified, isFeatured: $isFeatured, isActive: $isActive, acceptsInsurance: $acceptsInsurance, acceptedPaymentMethods: $acceptedPaymentMethods, tags: $tags, seoSlug: $seoSlug, createdAt: $createdAt, updatedAt: $updatedAt, packages: $packages, reviews: $reviews)';
}


}

/// @nodoc
abstract mixin class $CoachProfileCopyWith<$Res>  {
  factory $CoachProfileCopyWith(CoachProfile value, $Res Function(CoachProfile) _then) = _$CoachProfileCopyWithImpl;
@useResult
$Res call({
 int id, int userId, String displayName, String? title, String? bio, List<String> specializations, List<Certification> certifications, int experienceYears, List<String> languages, String timezone, bool isAvailable, double? hourlyRate, String currency, double minBookingHours, double maxBookingHours, AvailabilitySchedule? availabilitySchedule, int bookingBufferHours, String? profileImageUrl, String? coverImageUrl, String? introVideoUrl, List<String> galleryImages, int totalSessions, int totalClients, double averageRating, int ratingCount, double? responseTimeHours, bool isVerified, bool isFeatured, bool isActive, bool acceptsInsurance, List<String> acceptedPaymentMethods, List<String> tags, String? seoSlug, DateTime? createdAt, DateTime? updatedAt, List<CoachPackage> packages, List<CoachReview> reviews
});


$AvailabilityScheduleCopyWith<$Res>? get availabilitySchedule;

}
/// @nodoc
class _$CoachProfileCopyWithImpl<$Res>
    implements $CoachProfileCopyWith<$Res> {
  _$CoachProfileCopyWithImpl(this._self, this._then);

  final CoachProfile _self;
  final $Res Function(CoachProfile) _then;

/// Create a copy of CoachProfile
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? userId = null,Object? displayName = null,Object? title = freezed,Object? bio = freezed,Object? specializations = null,Object? certifications = null,Object? experienceYears = null,Object? languages = null,Object? timezone = null,Object? isAvailable = null,Object? hourlyRate = freezed,Object? currency = null,Object? minBookingHours = null,Object? maxBookingHours = null,Object? availabilitySchedule = freezed,Object? bookingBufferHours = null,Object? profileImageUrl = freezed,Object? coverImageUrl = freezed,Object? introVideoUrl = freezed,Object? galleryImages = null,Object? totalSessions = null,Object? totalClients = null,Object? averageRating = null,Object? ratingCount = null,Object? responseTimeHours = freezed,Object? isVerified = null,Object? isFeatured = null,Object? isActive = null,Object? acceptsInsurance = null,Object? acceptedPaymentMethods = null,Object? tags = null,Object? seoSlug = freezed,Object? createdAt = freezed,Object? updatedAt = freezed,Object? packages = null,Object? reviews = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,userId: null == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as int,displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,title: freezed == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String?,bio: freezed == bio ? _self.bio : bio // ignore: cast_nullable_to_non_nullable
as String?,specializations: null == specializations ? _self.specializations : specializations // ignore: cast_nullable_to_non_nullable
as List<String>,certifications: null == certifications ? _self.certifications : certifications // ignore: cast_nullable_to_non_nullable
as List<Certification>,experienceYears: null == experienceYears ? _self.experienceYears : experienceYears // ignore: cast_nullable_to_non_nullable
as int,languages: null == languages ? _self.languages : languages // ignore: cast_nullable_to_non_nullable
as List<String>,timezone: null == timezone ? _self.timezone : timezone // ignore: cast_nullable_to_non_nullable
as String,isAvailable: null == isAvailable ? _self.isAvailable : isAvailable // ignore: cast_nullable_to_non_nullable
as bool,hourlyRate: freezed == hourlyRate ? _self.hourlyRate : hourlyRate // ignore: cast_nullable_to_non_nullable
as double?,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,minBookingHours: null == minBookingHours ? _self.minBookingHours : minBookingHours // ignore: cast_nullable_to_non_nullable
as double,maxBookingHours: null == maxBookingHours ? _self.maxBookingHours : maxBookingHours // ignore: cast_nullable_to_non_nullable
as double,availabilitySchedule: freezed == availabilitySchedule ? _self.availabilitySchedule : availabilitySchedule // ignore: cast_nullable_to_non_nullable
as AvailabilitySchedule?,bookingBufferHours: null == bookingBufferHours ? _self.bookingBufferHours : bookingBufferHours // ignore: cast_nullable_to_non_nullable
as int,profileImageUrl: freezed == profileImageUrl ? _self.profileImageUrl : profileImageUrl // ignore: cast_nullable_to_non_nullable
as String?,coverImageUrl: freezed == coverImageUrl ? _self.coverImageUrl : coverImageUrl // ignore: cast_nullable_to_non_nullable
as String?,introVideoUrl: freezed == introVideoUrl ? _self.introVideoUrl : introVideoUrl // ignore: cast_nullable_to_non_nullable
as String?,galleryImages: null == galleryImages ? _self.galleryImages : galleryImages // ignore: cast_nullable_to_non_nullable
as List<String>,totalSessions: null == totalSessions ? _self.totalSessions : totalSessions // ignore: cast_nullable_to_non_nullable
as int,totalClients: null == totalClients ? _self.totalClients : totalClients // ignore: cast_nullable_to_non_nullable
as int,averageRating: null == averageRating ? _self.averageRating : averageRating // ignore: cast_nullable_to_non_nullable
as double,ratingCount: null == ratingCount ? _self.ratingCount : ratingCount // ignore: cast_nullable_to_non_nullable
as int,responseTimeHours: freezed == responseTimeHours ? _self.responseTimeHours : responseTimeHours // ignore: cast_nullable_to_non_nullable
as double?,isVerified: null == isVerified ? _self.isVerified : isVerified // ignore: cast_nullable_to_non_nullable
as bool,isFeatured: null == isFeatured ? _self.isFeatured : isFeatured // ignore: cast_nullable_to_non_nullable
as bool,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,acceptsInsurance: null == acceptsInsurance ? _self.acceptsInsurance : acceptsInsurance // ignore: cast_nullable_to_non_nullable
as bool,acceptedPaymentMethods: null == acceptedPaymentMethods ? _self.acceptedPaymentMethods : acceptedPaymentMethods // ignore: cast_nullable_to_non_nullable
as List<String>,tags: null == tags ? _self.tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,seoSlug: freezed == seoSlug ? _self.seoSlug : seoSlug // ignore: cast_nullable_to_non_nullable
as String?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,packages: null == packages ? _self.packages : packages // ignore: cast_nullable_to_non_nullable
as List<CoachPackage>,reviews: null == reviews ? _self.reviews : reviews // ignore: cast_nullable_to_non_nullable
as List<CoachReview>,
  ));
}
/// Create a copy of CoachProfile
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$AvailabilityScheduleCopyWith<$Res>? get availabilitySchedule {
    if (_self.availabilitySchedule == null) {
    return null;
  }

  return $AvailabilityScheduleCopyWith<$Res>(_self.availabilitySchedule!, (value) {
    return _then(_self.copyWith(availabilitySchedule: value));
  });
}
}


/// Adds pattern-matching-related methods to [CoachProfile].
extension CoachProfilePatterns on CoachProfile {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CoachProfile value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CoachProfile() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CoachProfile value)  $default,){
final _that = this;
switch (_that) {
case _CoachProfile():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CoachProfile value)?  $default,){
final _that = this;
switch (_that) {
case _CoachProfile() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  int userId,  String displayName,  String? title,  String? bio,  List<String> specializations,  List<Certification> certifications,  int experienceYears,  List<String> languages,  String timezone,  bool isAvailable,  double? hourlyRate,  String currency,  double minBookingHours,  double maxBookingHours,  AvailabilitySchedule? availabilitySchedule,  int bookingBufferHours,  String? profileImageUrl,  String? coverImageUrl,  String? introVideoUrl,  List<String> galleryImages,  int totalSessions,  int totalClients,  double averageRating,  int ratingCount,  double? responseTimeHours,  bool isVerified,  bool isFeatured,  bool isActive,  bool acceptsInsurance,  List<String> acceptedPaymentMethods,  List<String> tags,  String? seoSlug,  DateTime? createdAt,  DateTime? updatedAt,  List<CoachPackage> packages,  List<CoachReview> reviews)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CoachProfile() when $default != null:
return $default(_that.id,_that.userId,_that.displayName,_that.title,_that.bio,_that.specializations,_that.certifications,_that.experienceYears,_that.languages,_that.timezone,_that.isAvailable,_that.hourlyRate,_that.currency,_that.minBookingHours,_that.maxBookingHours,_that.availabilitySchedule,_that.bookingBufferHours,_that.profileImageUrl,_that.coverImageUrl,_that.introVideoUrl,_that.galleryImages,_that.totalSessions,_that.totalClients,_that.averageRating,_that.ratingCount,_that.responseTimeHours,_that.isVerified,_that.isFeatured,_that.isActive,_that.acceptsInsurance,_that.acceptedPaymentMethods,_that.tags,_that.seoSlug,_that.createdAt,_that.updatedAt,_that.packages,_that.reviews);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  int userId,  String displayName,  String? title,  String? bio,  List<String> specializations,  List<Certification> certifications,  int experienceYears,  List<String> languages,  String timezone,  bool isAvailable,  double? hourlyRate,  String currency,  double minBookingHours,  double maxBookingHours,  AvailabilitySchedule? availabilitySchedule,  int bookingBufferHours,  String? profileImageUrl,  String? coverImageUrl,  String? introVideoUrl,  List<String> galleryImages,  int totalSessions,  int totalClients,  double averageRating,  int ratingCount,  double? responseTimeHours,  bool isVerified,  bool isFeatured,  bool isActive,  bool acceptsInsurance,  List<String> acceptedPaymentMethods,  List<String> tags,  String? seoSlug,  DateTime? createdAt,  DateTime? updatedAt,  List<CoachPackage> packages,  List<CoachReview> reviews)  $default,) {final _that = this;
switch (_that) {
case _CoachProfile():
return $default(_that.id,_that.userId,_that.displayName,_that.title,_that.bio,_that.specializations,_that.certifications,_that.experienceYears,_that.languages,_that.timezone,_that.isAvailable,_that.hourlyRate,_that.currency,_that.minBookingHours,_that.maxBookingHours,_that.availabilitySchedule,_that.bookingBufferHours,_that.profileImageUrl,_that.coverImageUrl,_that.introVideoUrl,_that.galleryImages,_that.totalSessions,_that.totalClients,_that.averageRating,_that.ratingCount,_that.responseTimeHours,_that.isVerified,_that.isFeatured,_that.isActive,_that.acceptsInsurance,_that.acceptedPaymentMethods,_that.tags,_that.seoSlug,_that.createdAt,_that.updatedAt,_that.packages,_that.reviews);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  int userId,  String displayName,  String? title,  String? bio,  List<String> specializations,  List<Certification> certifications,  int experienceYears,  List<String> languages,  String timezone,  bool isAvailable,  double? hourlyRate,  String currency,  double minBookingHours,  double maxBookingHours,  AvailabilitySchedule? availabilitySchedule,  int bookingBufferHours,  String? profileImageUrl,  String? coverImageUrl,  String? introVideoUrl,  List<String> galleryImages,  int totalSessions,  int totalClients,  double averageRating,  int ratingCount,  double? responseTimeHours,  bool isVerified,  bool isFeatured,  bool isActive,  bool acceptsInsurance,  List<String> acceptedPaymentMethods,  List<String> tags,  String? seoSlug,  DateTime? createdAt,  DateTime? updatedAt,  List<CoachPackage> packages,  List<CoachReview> reviews)?  $default,) {final _that = this;
switch (_that) {
case _CoachProfile() when $default != null:
return $default(_that.id,_that.userId,_that.displayName,_that.title,_that.bio,_that.specializations,_that.certifications,_that.experienceYears,_that.languages,_that.timezone,_that.isAvailable,_that.hourlyRate,_that.currency,_that.minBookingHours,_that.maxBookingHours,_that.availabilitySchedule,_that.bookingBufferHours,_that.profileImageUrl,_that.coverImageUrl,_that.introVideoUrl,_that.galleryImages,_that.totalSessions,_that.totalClients,_that.averageRating,_that.ratingCount,_that.responseTimeHours,_that.isVerified,_that.isFeatured,_that.isActive,_that.acceptsInsurance,_that.acceptedPaymentMethods,_that.tags,_that.seoSlug,_that.createdAt,_that.updatedAt,_that.packages,_that.reviews);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CoachProfile extends CoachProfile {
  const _CoachProfile({required this.id, required this.userId, required this.displayName, this.title, this.bio, final  List<String> specializations = const [], final  List<Certification> certifications = const [], this.experienceYears = 0, final  List<String> languages = const ['en'], this.timezone = 'UTC', this.isAvailable = true, this.hourlyRate, this.currency = 'USD', this.minBookingHours = 1.0, this.maxBookingHours = 4.0, this.availabilitySchedule, this.bookingBufferHours = 24, this.profileImageUrl, this.coverImageUrl, this.introVideoUrl, final  List<String> galleryImages = const [], this.totalSessions = 0, this.totalClients = 0, this.averageRating = 0.0, this.ratingCount = 0, this.responseTimeHours, this.isVerified = false, this.isFeatured = false, this.isActive = true, this.acceptsInsurance = false, final  List<String> acceptedPaymentMethods = const ['card'], final  List<String> tags = const [], this.seoSlug, this.createdAt, this.updatedAt, final  List<CoachPackage> packages = const [], final  List<CoachReview> reviews = const []}): _specializations = specializations,_certifications = certifications,_languages = languages,_galleryImages = galleryImages,_acceptedPaymentMethods = acceptedPaymentMethods,_tags = tags,_packages = packages,_reviews = reviews,super._();
  factory _CoachProfile.fromJson(Map<String, dynamic> json) => _$CoachProfileFromJson(json);

@override final  int id;
@override final  int userId;
@override final  String displayName;
@override final  String? title;
@override final  String? bio;
 final  List<String> _specializations;
@override@JsonKey() List<String> get specializations {
  if (_specializations is EqualUnmodifiableListView) return _specializations;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_specializations);
}

 final  List<Certification> _certifications;
@override@JsonKey() List<Certification> get certifications {
  if (_certifications is EqualUnmodifiableListView) return _certifications;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_certifications);
}

@override@JsonKey() final  int experienceYears;
 final  List<String> _languages;
@override@JsonKey() List<String> get languages {
  if (_languages is EqualUnmodifiableListView) return _languages;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_languages);
}

@override@JsonKey() final  String timezone;
// Availability & Booking
@override@JsonKey() final  bool isAvailable;
@override final  double? hourlyRate;
@override@JsonKey() final  String currency;
@override@JsonKey() final  double minBookingHours;
@override@JsonKey() final  double maxBookingHours;
@override final  AvailabilitySchedule? availabilitySchedule;
@override@JsonKey() final  int bookingBufferHours;
// Profile Media
@override final  String? profileImageUrl;
@override final  String? coverImageUrl;
@override final  String? introVideoUrl;
 final  List<String> _galleryImages;
@override@JsonKey() List<String> get galleryImages {
  if (_galleryImages is EqualUnmodifiableListView) return _galleryImages;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_galleryImages);
}

// Stats & Rating
@override@JsonKey() final  int totalSessions;
@override@JsonKey() final  int totalClients;
@override@JsonKey() final  double averageRating;
@override@JsonKey() final  int ratingCount;
@override final  double? responseTimeHours;
// Settings
@override@JsonKey() final  bool isVerified;
@override@JsonKey() final  bool isFeatured;
@override@JsonKey() final  bool isActive;
@override@JsonKey() final  bool acceptsInsurance;
 final  List<String> _acceptedPaymentMethods;
@override@JsonKey() List<String> get acceptedPaymentMethods {
  if (_acceptedPaymentMethods is EqualUnmodifiableListView) return _acceptedPaymentMethods;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_acceptedPaymentMethods);
}

// Metadata
 final  List<String> _tags;
// Metadata
@override@JsonKey() List<String> get tags {
  if (_tags is EqualUnmodifiableListView) return _tags;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_tags);
}

@override final  String? seoSlug;
// Timestamps
@override final  DateTime? createdAt;
@override final  DateTime? updatedAt;
// Related data (may be loaded separately)
 final  List<CoachPackage> _packages;
// Related data (may be loaded separately)
@override@JsonKey() List<CoachPackage> get packages {
  if (_packages is EqualUnmodifiableListView) return _packages;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_packages);
}

 final  List<CoachReview> _reviews;
@override@JsonKey() List<CoachReview> get reviews {
  if (_reviews is EqualUnmodifiableListView) return _reviews;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_reviews);
}


/// Create a copy of CoachProfile
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CoachProfileCopyWith<_CoachProfile> get copyWith => __$CoachProfileCopyWithImpl<_CoachProfile>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CoachProfileToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CoachProfile&&(identical(other.id, id) || other.id == id)&&(identical(other.userId, userId) || other.userId == userId)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.title, title) || other.title == title)&&(identical(other.bio, bio) || other.bio == bio)&&const DeepCollectionEquality().equals(other._specializations, _specializations)&&const DeepCollectionEquality().equals(other._certifications, _certifications)&&(identical(other.experienceYears, experienceYears) || other.experienceYears == experienceYears)&&const DeepCollectionEquality().equals(other._languages, _languages)&&(identical(other.timezone, timezone) || other.timezone == timezone)&&(identical(other.isAvailable, isAvailable) || other.isAvailable == isAvailable)&&(identical(other.hourlyRate, hourlyRate) || other.hourlyRate == hourlyRate)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.minBookingHours, minBookingHours) || other.minBookingHours == minBookingHours)&&(identical(other.maxBookingHours, maxBookingHours) || other.maxBookingHours == maxBookingHours)&&(identical(other.availabilitySchedule, availabilitySchedule) || other.availabilitySchedule == availabilitySchedule)&&(identical(other.bookingBufferHours, bookingBufferHours) || other.bookingBufferHours == bookingBufferHours)&&(identical(other.profileImageUrl, profileImageUrl) || other.profileImageUrl == profileImageUrl)&&(identical(other.coverImageUrl, coverImageUrl) || other.coverImageUrl == coverImageUrl)&&(identical(other.introVideoUrl, introVideoUrl) || other.introVideoUrl == introVideoUrl)&&const DeepCollectionEquality().equals(other._galleryImages, _galleryImages)&&(identical(other.totalSessions, totalSessions) || other.totalSessions == totalSessions)&&(identical(other.totalClients, totalClients) || other.totalClients == totalClients)&&(identical(other.averageRating, averageRating) || other.averageRating == averageRating)&&(identical(other.ratingCount, ratingCount) || other.ratingCount == ratingCount)&&(identical(other.responseTimeHours, responseTimeHours) || other.responseTimeHours == responseTimeHours)&&(identical(other.isVerified, isVerified) || other.isVerified == isVerified)&&(identical(other.isFeatured, isFeatured) || other.isFeatured == isFeatured)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.acceptsInsurance, acceptsInsurance) || other.acceptsInsurance == acceptsInsurance)&&const DeepCollectionEquality().equals(other._acceptedPaymentMethods, _acceptedPaymentMethods)&&const DeepCollectionEquality().equals(other._tags, _tags)&&(identical(other.seoSlug, seoSlug) || other.seoSlug == seoSlug)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&const DeepCollectionEquality().equals(other._packages, _packages)&&const DeepCollectionEquality().equals(other._reviews, _reviews));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,userId,displayName,title,bio,const DeepCollectionEquality().hash(_specializations),const DeepCollectionEquality().hash(_certifications),experienceYears,const DeepCollectionEquality().hash(_languages),timezone,isAvailable,hourlyRate,currency,minBookingHours,maxBookingHours,availabilitySchedule,bookingBufferHours,profileImageUrl,coverImageUrl,introVideoUrl,const DeepCollectionEquality().hash(_galleryImages),totalSessions,totalClients,averageRating,ratingCount,responseTimeHours,isVerified,isFeatured,isActive,acceptsInsurance,const DeepCollectionEquality().hash(_acceptedPaymentMethods),const DeepCollectionEquality().hash(_tags),seoSlug,createdAt,updatedAt,const DeepCollectionEquality().hash(_packages),const DeepCollectionEquality().hash(_reviews)]);

@override
String toString() {
  return 'CoachProfile(id: $id, userId: $userId, displayName: $displayName, title: $title, bio: $bio, specializations: $specializations, certifications: $certifications, experienceYears: $experienceYears, languages: $languages, timezone: $timezone, isAvailable: $isAvailable, hourlyRate: $hourlyRate, currency: $currency, minBookingHours: $minBookingHours, maxBookingHours: $maxBookingHours, availabilitySchedule: $availabilitySchedule, bookingBufferHours: $bookingBufferHours, profileImageUrl: $profileImageUrl, coverImageUrl: $coverImageUrl, introVideoUrl: $introVideoUrl, galleryImages: $galleryImages, totalSessions: $totalSessions, totalClients: $totalClients, averageRating: $averageRating, ratingCount: $ratingCount, responseTimeHours: $responseTimeHours, isVerified: $isVerified, isFeatured: $isFeatured, isActive: $isActive, acceptsInsurance: $acceptsInsurance, acceptedPaymentMethods: $acceptedPaymentMethods, tags: $tags, seoSlug: $seoSlug, createdAt: $createdAt, updatedAt: $updatedAt, packages: $packages, reviews: $reviews)';
}


}

/// @nodoc
abstract mixin class _$CoachProfileCopyWith<$Res> implements $CoachProfileCopyWith<$Res> {
  factory _$CoachProfileCopyWith(_CoachProfile value, $Res Function(_CoachProfile) _then) = __$CoachProfileCopyWithImpl;
@override @useResult
$Res call({
 int id, int userId, String displayName, String? title, String? bio, List<String> specializations, List<Certification> certifications, int experienceYears, List<String> languages, String timezone, bool isAvailable, double? hourlyRate, String currency, double minBookingHours, double maxBookingHours, AvailabilitySchedule? availabilitySchedule, int bookingBufferHours, String? profileImageUrl, String? coverImageUrl, String? introVideoUrl, List<String> galleryImages, int totalSessions, int totalClients, double averageRating, int ratingCount, double? responseTimeHours, bool isVerified, bool isFeatured, bool isActive, bool acceptsInsurance, List<String> acceptedPaymentMethods, List<String> tags, String? seoSlug, DateTime? createdAt, DateTime? updatedAt, List<CoachPackage> packages, List<CoachReview> reviews
});


@override $AvailabilityScheduleCopyWith<$Res>? get availabilitySchedule;

}
/// @nodoc
class __$CoachProfileCopyWithImpl<$Res>
    implements _$CoachProfileCopyWith<$Res> {
  __$CoachProfileCopyWithImpl(this._self, this._then);

  final _CoachProfile _self;
  final $Res Function(_CoachProfile) _then;

/// Create a copy of CoachProfile
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? userId = null,Object? displayName = null,Object? title = freezed,Object? bio = freezed,Object? specializations = null,Object? certifications = null,Object? experienceYears = null,Object? languages = null,Object? timezone = null,Object? isAvailable = null,Object? hourlyRate = freezed,Object? currency = null,Object? minBookingHours = null,Object? maxBookingHours = null,Object? availabilitySchedule = freezed,Object? bookingBufferHours = null,Object? profileImageUrl = freezed,Object? coverImageUrl = freezed,Object? introVideoUrl = freezed,Object? galleryImages = null,Object? totalSessions = null,Object? totalClients = null,Object? averageRating = null,Object? ratingCount = null,Object? responseTimeHours = freezed,Object? isVerified = null,Object? isFeatured = null,Object? isActive = null,Object? acceptsInsurance = null,Object? acceptedPaymentMethods = null,Object? tags = null,Object? seoSlug = freezed,Object? createdAt = freezed,Object? updatedAt = freezed,Object? packages = null,Object? reviews = null,}) {
  return _then(_CoachProfile(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,userId: null == userId ? _self.userId : userId // ignore: cast_nullable_to_non_nullable
as int,displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,title: freezed == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String?,bio: freezed == bio ? _self.bio : bio // ignore: cast_nullable_to_non_nullable
as String?,specializations: null == specializations ? _self._specializations : specializations // ignore: cast_nullable_to_non_nullable
as List<String>,certifications: null == certifications ? _self._certifications : certifications // ignore: cast_nullable_to_non_nullable
as List<Certification>,experienceYears: null == experienceYears ? _self.experienceYears : experienceYears // ignore: cast_nullable_to_non_nullable
as int,languages: null == languages ? _self._languages : languages // ignore: cast_nullable_to_non_nullable
as List<String>,timezone: null == timezone ? _self.timezone : timezone // ignore: cast_nullable_to_non_nullable
as String,isAvailable: null == isAvailable ? _self.isAvailable : isAvailable // ignore: cast_nullable_to_non_nullable
as bool,hourlyRate: freezed == hourlyRate ? _self.hourlyRate : hourlyRate // ignore: cast_nullable_to_non_nullable
as double?,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,minBookingHours: null == minBookingHours ? _self.minBookingHours : minBookingHours // ignore: cast_nullable_to_non_nullable
as double,maxBookingHours: null == maxBookingHours ? _self.maxBookingHours : maxBookingHours // ignore: cast_nullable_to_non_nullable
as double,availabilitySchedule: freezed == availabilitySchedule ? _self.availabilitySchedule : availabilitySchedule // ignore: cast_nullable_to_non_nullable
as AvailabilitySchedule?,bookingBufferHours: null == bookingBufferHours ? _self.bookingBufferHours : bookingBufferHours // ignore: cast_nullable_to_non_nullable
as int,profileImageUrl: freezed == profileImageUrl ? _self.profileImageUrl : profileImageUrl // ignore: cast_nullable_to_non_nullable
as String?,coverImageUrl: freezed == coverImageUrl ? _self.coverImageUrl : coverImageUrl // ignore: cast_nullable_to_non_nullable
as String?,introVideoUrl: freezed == introVideoUrl ? _self.introVideoUrl : introVideoUrl // ignore: cast_nullable_to_non_nullable
as String?,galleryImages: null == galleryImages ? _self._galleryImages : galleryImages // ignore: cast_nullable_to_non_nullable
as List<String>,totalSessions: null == totalSessions ? _self.totalSessions : totalSessions // ignore: cast_nullable_to_non_nullable
as int,totalClients: null == totalClients ? _self.totalClients : totalClients // ignore: cast_nullable_to_non_nullable
as int,averageRating: null == averageRating ? _self.averageRating : averageRating // ignore: cast_nullable_to_non_nullable
as double,ratingCount: null == ratingCount ? _self.ratingCount : ratingCount // ignore: cast_nullable_to_non_nullable
as int,responseTimeHours: freezed == responseTimeHours ? _self.responseTimeHours : responseTimeHours // ignore: cast_nullable_to_non_nullable
as double?,isVerified: null == isVerified ? _self.isVerified : isVerified // ignore: cast_nullable_to_non_nullable
as bool,isFeatured: null == isFeatured ? _self.isFeatured : isFeatured // ignore: cast_nullable_to_non_nullable
as bool,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,acceptsInsurance: null == acceptsInsurance ? _self.acceptsInsurance : acceptsInsurance // ignore: cast_nullable_to_non_nullable
as bool,acceptedPaymentMethods: null == acceptedPaymentMethods ? _self._acceptedPaymentMethods : acceptedPaymentMethods // ignore: cast_nullable_to_non_nullable
as List<String>,tags: null == tags ? _self._tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,seoSlug: freezed == seoSlug ? _self.seoSlug : seoSlug // ignore: cast_nullable_to_non_nullable
as String?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,packages: null == packages ? _self._packages : packages // ignore: cast_nullable_to_non_nullable
as List<CoachPackage>,reviews: null == reviews ? _self._reviews : reviews // ignore: cast_nullable_to_non_nullable
as List<CoachReview>,
  ));
}

/// Create a copy of CoachProfile
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$AvailabilityScheduleCopyWith<$Res>? get availabilitySchedule {
    if (_self.availabilitySchedule == null) {
    return null;
  }

  return $AvailabilityScheduleCopyWith<$Res>(_self.availabilitySchedule!, (value) {
    return _then(_self.copyWith(availabilitySchedule: value));
  });
}
}


/// @nodoc
mixin _$CoachSession {

 int get id; int get coachId; int get clientId;// Session Details
 String get title; String? get description; SessionType get sessionType; SessionStatus get status;// Timing
 DateTime get scheduledAt; int get durationMinutes; DateTime? get actualStartTime; DateTime? get actualEndTime; String get timezone;// Meeting Details
 String? get meetingUrl; String? get meetingPassword; String? get locationAddress;// Pricing
 double get hourlyRate; double get totalAmount; String get currency; PaymentStatus get paymentStatus; String? get paymentId;// Notes & Resources
 String? get coachNotes; String? get clientNotes; List<SharedResource> get sharedResources;// Feedback
 int? get clientRating; String? get clientFeedback; int? get coachRating; String? get coachFeedback;// Cancellation
 String? get cancellationReason; String? get cancelledBy; DateTime? get cancelledAt;// Timestamps
 DateTime? get createdAt; DateTime? get updatedAt;// Related data
 CoachProfile? get coach;
/// Create a copy of CoachSession
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CoachSessionCopyWith<CoachSession> get copyWith => _$CoachSessionCopyWithImpl<CoachSession>(this as CoachSession, _$identity);

  /// Serializes this CoachSession to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CoachSession&&(identical(other.id, id) || other.id == id)&&(identical(other.coachId, coachId) || other.coachId == coachId)&&(identical(other.clientId, clientId) || other.clientId == clientId)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.sessionType, sessionType) || other.sessionType == sessionType)&&(identical(other.status, status) || other.status == status)&&(identical(other.scheduledAt, scheduledAt) || other.scheduledAt == scheduledAt)&&(identical(other.durationMinutes, durationMinutes) || other.durationMinutes == durationMinutes)&&(identical(other.actualStartTime, actualStartTime) || other.actualStartTime == actualStartTime)&&(identical(other.actualEndTime, actualEndTime) || other.actualEndTime == actualEndTime)&&(identical(other.timezone, timezone) || other.timezone == timezone)&&(identical(other.meetingUrl, meetingUrl) || other.meetingUrl == meetingUrl)&&(identical(other.meetingPassword, meetingPassword) || other.meetingPassword == meetingPassword)&&(identical(other.locationAddress, locationAddress) || other.locationAddress == locationAddress)&&(identical(other.hourlyRate, hourlyRate) || other.hourlyRate == hourlyRate)&&(identical(other.totalAmount, totalAmount) || other.totalAmount == totalAmount)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.paymentStatus, paymentStatus) || other.paymentStatus == paymentStatus)&&(identical(other.paymentId, paymentId) || other.paymentId == paymentId)&&(identical(other.coachNotes, coachNotes) || other.coachNotes == coachNotes)&&(identical(other.clientNotes, clientNotes) || other.clientNotes == clientNotes)&&const DeepCollectionEquality().equals(other.sharedResources, sharedResources)&&(identical(other.clientRating, clientRating) || other.clientRating == clientRating)&&(identical(other.clientFeedback, clientFeedback) || other.clientFeedback == clientFeedback)&&(identical(other.coachRating, coachRating) || other.coachRating == coachRating)&&(identical(other.coachFeedback, coachFeedback) || other.coachFeedback == coachFeedback)&&(identical(other.cancellationReason, cancellationReason) || other.cancellationReason == cancellationReason)&&(identical(other.cancelledBy, cancelledBy) || other.cancelledBy == cancelledBy)&&(identical(other.cancelledAt, cancelledAt) || other.cancelledAt == cancelledAt)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.coach, coach) || other.coach == coach));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,coachId,clientId,title,description,sessionType,status,scheduledAt,durationMinutes,actualStartTime,actualEndTime,timezone,meetingUrl,meetingPassword,locationAddress,hourlyRate,totalAmount,currency,paymentStatus,paymentId,coachNotes,clientNotes,const DeepCollectionEquality().hash(sharedResources),clientRating,clientFeedback,coachRating,coachFeedback,cancellationReason,cancelledBy,cancelledAt,createdAt,updatedAt,coach]);

@override
String toString() {
  return 'CoachSession(id: $id, coachId: $coachId, clientId: $clientId, title: $title, description: $description, sessionType: $sessionType, status: $status, scheduledAt: $scheduledAt, durationMinutes: $durationMinutes, actualStartTime: $actualStartTime, actualEndTime: $actualEndTime, timezone: $timezone, meetingUrl: $meetingUrl, meetingPassword: $meetingPassword, locationAddress: $locationAddress, hourlyRate: $hourlyRate, totalAmount: $totalAmount, currency: $currency, paymentStatus: $paymentStatus, paymentId: $paymentId, coachNotes: $coachNotes, clientNotes: $clientNotes, sharedResources: $sharedResources, clientRating: $clientRating, clientFeedback: $clientFeedback, coachRating: $coachRating, coachFeedback: $coachFeedback, cancellationReason: $cancellationReason, cancelledBy: $cancelledBy, cancelledAt: $cancelledAt, createdAt: $createdAt, updatedAt: $updatedAt, coach: $coach)';
}


}

/// @nodoc
abstract mixin class $CoachSessionCopyWith<$Res>  {
  factory $CoachSessionCopyWith(CoachSession value, $Res Function(CoachSession) _then) = _$CoachSessionCopyWithImpl;
@useResult
$Res call({
 int id, int coachId, int clientId, String title, String? description, SessionType sessionType, SessionStatus status, DateTime scheduledAt, int durationMinutes, DateTime? actualStartTime, DateTime? actualEndTime, String timezone, String? meetingUrl, String? meetingPassword, String? locationAddress, double hourlyRate, double totalAmount, String currency, PaymentStatus paymentStatus, String? paymentId, String? coachNotes, String? clientNotes, List<SharedResource> sharedResources, int? clientRating, String? clientFeedback, int? coachRating, String? coachFeedback, String? cancellationReason, String? cancelledBy, DateTime? cancelledAt, DateTime? createdAt, DateTime? updatedAt, CoachProfile? coach
});


$CoachProfileCopyWith<$Res>? get coach;

}
/// @nodoc
class _$CoachSessionCopyWithImpl<$Res>
    implements $CoachSessionCopyWith<$Res> {
  _$CoachSessionCopyWithImpl(this._self, this._then);

  final CoachSession _self;
  final $Res Function(CoachSession) _then;

/// Create a copy of CoachSession
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? coachId = null,Object? clientId = null,Object? title = null,Object? description = freezed,Object? sessionType = null,Object? status = null,Object? scheduledAt = null,Object? durationMinutes = null,Object? actualStartTime = freezed,Object? actualEndTime = freezed,Object? timezone = null,Object? meetingUrl = freezed,Object? meetingPassword = freezed,Object? locationAddress = freezed,Object? hourlyRate = null,Object? totalAmount = null,Object? currency = null,Object? paymentStatus = null,Object? paymentId = freezed,Object? coachNotes = freezed,Object? clientNotes = freezed,Object? sharedResources = null,Object? clientRating = freezed,Object? clientFeedback = freezed,Object? coachRating = freezed,Object? coachFeedback = freezed,Object? cancellationReason = freezed,Object? cancelledBy = freezed,Object? cancelledAt = freezed,Object? createdAt = freezed,Object? updatedAt = freezed,Object? coach = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,coachId: null == coachId ? _self.coachId : coachId // ignore: cast_nullable_to_non_nullable
as int,clientId: null == clientId ? _self.clientId : clientId // ignore: cast_nullable_to_non_nullable
as int,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,sessionType: null == sessionType ? _self.sessionType : sessionType // ignore: cast_nullable_to_non_nullable
as SessionType,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as SessionStatus,scheduledAt: null == scheduledAt ? _self.scheduledAt : scheduledAt // ignore: cast_nullable_to_non_nullable
as DateTime,durationMinutes: null == durationMinutes ? _self.durationMinutes : durationMinutes // ignore: cast_nullable_to_non_nullable
as int,actualStartTime: freezed == actualStartTime ? _self.actualStartTime : actualStartTime // ignore: cast_nullable_to_non_nullable
as DateTime?,actualEndTime: freezed == actualEndTime ? _self.actualEndTime : actualEndTime // ignore: cast_nullable_to_non_nullable
as DateTime?,timezone: null == timezone ? _self.timezone : timezone // ignore: cast_nullable_to_non_nullable
as String,meetingUrl: freezed == meetingUrl ? _self.meetingUrl : meetingUrl // ignore: cast_nullable_to_non_nullable
as String?,meetingPassword: freezed == meetingPassword ? _self.meetingPassword : meetingPassword // ignore: cast_nullable_to_non_nullable
as String?,locationAddress: freezed == locationAddress ? _self.locationAddress : locationAddress // ignore: cast_nullable_to_non_nullable
as String?,hourlyRate: null == hourlyRate ? _self.hourlyRate : hourlyRate // ignore: cast_nullable_to_non_nullable
as double,totalAmount: null == totalAmount ? _self.totalAmount : totalAmount // ignore: cast_nullable_to_non_nullable
as double,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,paymentStatus: null == paymentStatus ? _self.paymentStatus : paymentStatus // ignore: cast_nullable_to_non_nullable
as PaymentStatus,paymentId: freezed == paymentId ? _self.paymentId : paymentId // ignore: cast_nullable_to_non_nullable
as String?,coachNotes: freezed == coachNotes ? _self.coachNotes : coachNotes // ignore: cast_nullable_to_non_nullable
as String?,clientNotes: freezed == clientNotes ? _self.clientNotes : clientNotes // ignore: cast_nullable_to_non_nullable
as String?,sharedResources: null == sharedResources ? _self.sharedResources : sharedResources // ignore: cast_nullable_to_non_nullable
as List<SharedResource>,clientRating: freezed == clientRating ? _self.clientRating : clientRating // ignore: cast_nullable_to_non_nullable
as int?,clientFeedback: freezed == clientFeedback ? _self.clientFeedback : clientFeedback // ignore: cast_nullable_to_non_nullable
as String?,coachRating: freezed == coachRating ? _self.coachRating : coachRating // ignore: cast_nullable_to_non_nullable
as int?,coachFeedback: freezed == coachFeedback ? _self.coachFeedback : coachFeedback // ignore: cast_nullable_to_non_nullable
as String?,cancellationReason: freezed == cancellationReason ? _self.cancellationReason : cancellationReason // ignore: cast_nullable_to_non_nullable
as String?,cancelledBy: freezed == cancelledBy ? _self.cancelledBy : cancelledBy // ignore: cast_nullable_to_non_nullable
as String?,cancelledAt: freezed == cancelledAt ? _self.cancelledAt : cancelledAt // ignore: cast_nullable_to_non_nullable
as DateTime?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,coach: freezed == coach ? _self.coach : coach // ignore: cast_nullable_to_non_nullable
as CoachProfile?,
  ));
}
/// Create a copy of CoachSession
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CoachProfileCopyWith<$Res>? get coach {
    if (_self.coach == null) {
    return null;
  }

  return $CoachProfileCopyWith<$Res>(_self.coach!, (value) {
    return _then(_self.copyWith(coach: value));
  });
}
}


/// Adds pattern-matching-related methods to [CoachSession].
extension CoachSessionPatterns on CoachSession {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CoachSession value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CoachSession() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CoachSession value)  $default,){
final _that = this;
switch (_that) {
case _CoachSession():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CoachSession value)?  $default,){
final _that = this;
switch (_that) {
case _CoachSession() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  int coachId,  int clientId,  String title,  String? description,  SessionType sessionType,  SessionStatus status,  DateTime scheduledAt,  int durationMinutes,  DateTime? actualStartTime,  DateTime? actualEndTime,  String timezone,  String? meetingUrl,  String? meetingPassword,  String? locationAddress,  double hourlyRate,  double totalAmount,  String currency,  PaymentStatus paymentStatus,  String? paymentId,  String? coachNotes,  String? clientNotes,  List<SharedResource> sharedResources,  int? clientRating,  String? clientFeedback,  int? coachRating,  String? coachFeedback,  String? cancellationReason,  String? cancelledBy,  DateTime? cancelledAt,  DateTime? createdAt,  DateTime? updatedAt,  CoachProfile? coach)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CoachSession() when $default != null:
return $default(_that.id,_that.coachId,_that.clientId,_that.title,_that.description,_that.sessionType,_that.status,_that.scheduledAt,_that.durationMinutes,_that.actualStartTime,_that.actualEndTime,_that.timezone,_that.meetingUrl,_that.meetingPassword,_that.locationAddress,_that.hourlyRate,_that.totalAmount,_that.currency,_that.paymentStatus,_that.paymentId,_that.coachNotes,_that.clientNotes,_that.sharedResources,_that.clientRating,_that.clientFeedback,_that.coachRating,_that.coachFeedback,_that.cancellationReason,_that.cancelledBy,_that.cancelledAt,_that.createdAt,_that.updatedAt,_that.coach);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  int coachId,  int clientId,  String title,  String? description,  SessionType sessionType,  SessionStatus status,  DateTime scheduledAt,  int durationMinutes,  DateTime? actualStartTime,  DateTime? actualEndTime,  String timezone,  String? meetingUrl,  String? meetingPassword,  String? locationAddress,  double hourlyRate,  double totalAmount,  String currency,  PaymentStatus paymentStatus,  String? paymentId,  String? coachNotes,  String? clientNotes,  List<SharedResource> sharedResources,  int? clientRating,  String? clientFeedback,  int? coachRating,  String? coachFeedback,  String? cancellationReason,  String? cancelledBy,  DateTime? cancelledAt,  DateTime? createdAt,  DateTime? updatedAt,  CoachProfile? coach)  $default,) {final _that = this;
switch (_that) {
case _CoachSession():
return $default(_that.id,_that.coachId,_that.clientId,_that.title,_that.description,_that.sessionType,_that.status,_that.scheduledAt,_that.durationMinutes,_that.actualStartTime,_that.actualEndTime,_that.timezone,_that.meetingUrl,_that.meetingPassword,_that.locationAddress,_that.hourlyRate,_that.totalAmount,_that.currency,_that.paymentStatus,_that.paymentId,_that.coachNotes,_that.clientNotes,_that.sharedResources,_that.clientRating,_that.clientFeedback,_that.coachRating,_that.coachFeedback,_that.cancellationReason,_that.cancelledBy,_that.cancelledAt,_that.createdAt,_that.updatedAt,_that.coach);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  int coachId,  int clientId,  String title,  String? description,  SessionType sessionType,  SessionStatus status,  DateTime scheduledAt,  int durationMinutes,  DateTime? actualStartTime,  DateTime? actualEndTime,  String timezone,  String? meetingUrl,  String? meetingPassword,  String? locationAddress,  double hourlyRate,  double totalAmount,  String currency,  PaymentStatus paymentStatus,  String? paymentId,  String? coachNotes,  String? clientNotes,  List<SharedResource> sharedResources,  int? clientRating,  String? clientFeedback,  int? coachRating,  String? coachFeedback,  String? cancellationReason,  String? cancelledBy,  DateTime? cancelledAt,  DateTime? createdAt,  DateTime? updatedAt,  CoachProfile? coach)?  $default,) {final _that = this;
switch (_that) {
case _CoachSession() when $default != null:
return $default(_that.id,_that.coachId,_that.clientId,_that.title,_that.description,_that.sessionType,_that.status,_that.scheduledAt,_that.durationMinutes,_that.actualStartTime,_that.actualEndTime,_that.timezone,_that.meetingUrl,_that.meetingPassword,_that.locationAddress,_that.hourlyRate,_that.totalAmount,_that.currency,_that.paymentStatus,_that.paymentId,_that.coachNotes,_that.clientNotes,_that.sharedResources,_that.clientRating,_that.clientFeedback,_that.coachRating,_that.coachFeedback,_that.cancellationReason,_that.cancelledBy,_that.cancelledAt,_that.createdAt,_that.updatedAt,_that.coach);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CoachSession extends CoachSession {
  const _CoachSession({required this.id, required this.coachId, required this.clientId, required this.title, this.description, required this.sessionType, this.status = SessionStatus.pending, required this.scheduledAt, required this.durationMinutes, this.actualStartTime, this.actualEndTime, required this.timezone, this.meetingUrl, this.meetingPassword, this.locationAddress, required this.hourlyRate, required this.totalAmount, this.currency = 'USD', this.paymentStatus = PaymentStatus.pending, this.paymentId, this.coachNotes, this.clientNotes, final  List<SharedResource> sharedResources = const [], this.clientRating, this.clientFeedback, this.coachRating, this.coachFeedback, this.cancellationReason, this.cancelledBy, this.cancelledAt, this.createdAt, this.updatedAt, this.coach}): _sharedResources = sharedResources,super._();
  factory _CoachSession.fromJson(Map<String, dynamic> json) => _$CoachSessionFromJson(json);

@override final  int id;
@override final  int coachId;
@override final  int clientId;
// Session Details
@override final  String title;
@override final  String? description;
@override final  SessionType sessionType;
@override@JsonKey() final  SessionStatus status;
// Timing
@override final  DateTime scheduledAt;
@override final  int durationMinutes;
@override final  DateTime? actualStartTime;
@override final  DateTime? actualEndTime;
@override final  String timezone;
// Meeting Details
@override final  String? meetingUrl;
@override final  String? meetingPassword;
@override final  String? locationAddress;
// Pricing
@override final  double hourlyRate;
@override final  double totalAmount;
@override@JsonKey() final  String currency;
@override@JsonKey() final  PaymentStatus paymentStatus;
@override final  String? paymentId;
// Notes & Resources
@override final  String? coachNotes;
@override final  String? clientNotes;
 final  List<SharedResource> _sharedResources;
@override@JsonKey() List<SharedResource> get sharedResources {
  if (_sharedResources is EqualUnmodifiableListView) return _sharedResources;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_sharedResources);
}

// Feedback
@override final  int? clientRating;
@override final  String? clientFeedback;
@override final  int? coachRating;
@override final  String? coachFeedback;
// Cancellation
@override final  String? cancellationReason;
@override final  String? cancelledBy;
@override final  DateTime? cancelledAt;
// Timestamps
@override final  DateTime? createdAt;
@override final  DateTime? updatedAt;
// Related data
@override final  CoachProfile? coach;

/// Create a copy of CoachSession
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CoachSessionCopyWith<_CoachSession> get copyWith => __$CoachSessionCopyWithImpl<_CoachSession>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CoachSessionToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CoachSession&&(identical(other.id, id) || other.id == id)&&(identical(other.coachId, coachId) || other.coachId == coachId)&&(identical(other.clientId, clientId) || other.clientId == clientId)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.sessionType, sessionType) || other.sessionType == sessionType)&&(identical(other.status, status) || other.status == status)&&(identical(other.scheduledAt, scheduledAt) || other.scheduledAt == scheduledAt)&&(identical(other.durationMinutes, durationMinutes) || other.durationMinutes == durationMinutes)&&(identical(other.actualStartTime, actualStartTime) || other.actualStartTime == actualStartTime)&&(identical(other.actualEndTime, actualEndTime) || other.actualEndTime == actualEndTime)&&(identical(other.timezone, timezone) || other.timezone == timezone)&&(identical(other.meetingUrl, meetingUrl) || other.meetingUrl == meetingUrl)&&(identical(other.meetingPassword, meetingPassword) || other.meetingPassword == meetingPassword)&&(identical(other.locationAddress, locationAddress) || other.locationAddress == locationAddress)&&(identical(other.hourlyRate, hourlyRate) || other.hourlyRate == hourlyRate)&&(identical(other.totalAmount, totalAmount) || other.totalAmount == totalAmount)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.paymentStatus, paymentStatus) || other.paymentStatus == paymentStatus)&&(identical(other.paymentId, paymentId) || other.paymentId == paymentId)&&(identical(other.coachNotes, coachNotes) || other.coachNotes == coachNotes)&&(identical(other.clientNotes, clientNotes) || other.clientNotes == clientNotes)&&const DeepCollectionEquality().equals(other._sharedResources, _sharedResources)&&(identical(other.clientRating, clientRating) || other.clientRating == clientRating)&&(identical(other.clientFeedback, clientFeedback) || other.clientFeedback == clientFeedback)&&(identical(other.coachRating, coachRating) || other.coachRating == coachRating)&&(identical(other.coachFeedback, coachFeedback) || other.coachFeedback == coachFeedback)&&(identical(other.cancellationReason, cancellationReason) || other.cancellationReason == cancellationReason)&&(identical(other.cancelledBy, cancelledBy) || other.cancelledBy == cancelledBy)&&(identical(other.cancelledAt, cancelledAt) || other.cancelledAt == cancelledAt)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.coach, coach) || other.coach == coach));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,coachId,clientId,title,description,sessionType,status,scheduledAt,durationMinutes,actualStartTime,actualEndTime,timezone,meetingUrl,meetingPassword,locationAddress,hourlyRate,totalAmount,currency,paymentStatus,paymentId,coachNotes,clientNotes,const DeepCollectionEquality().hash(_sharedResources),clientRating,clientFeedback,coachRating,coachFeedback,cancellationReason,cancelledBy,cancelledAt,createdAt,updatedAt,coach]);

@override
String toString() {
  return 'CoachSession(id: $id, coachId: $coachId, clientId: $clientId, title: $title, description: $description, sessionType: $sessionType, status: $status, scheduledAt: $scheduledAt, durationMinutes: $durationMinutes, actualStartTime: $actualStartTime, actualEndTime: $actualEndTime, timezone: $timezone, meetingUrl: $meetingUrl, meetingPassword: $meetingPassword, locationAddress: $locationAddress, hourlyRate: $hourlyRate, totalAmount: $totalAmount, currency: $currency, paymentStatus: $paymentStatus, paymentId: $paymentId, coachNotes: $coachNotes, clientNotes: $clientNotes, sharedResources: $sharedResources, clientRating: $clientRating, clientFeedback: $clientFeedback, coachRating: $coachRating, coachFeedback: $coachFeedback, cancellationReason: $cancellationReason, cancelledBy: $cancelledBy, cancelledAt: $cancelledAt, createdAt: $createdAt, updatedAt: $updatedAt, coach: $coach)';
}


}

/// @nodoc
abstract mixin class _$CoachSessionCopyWith<$Res> implements $CoachSessionCopyWith<$Res> {
  factory _$CoachSessionCopyWith(_CoachSession value, $Res Function(_CoachSession) _then) = __$CoachSessionCopyWithImpl;
@override @useResult
$Res call({
 int id, int coachId, int clientId, String title, String? description, SessionType sessionType, SessionStatus status, DateTime scheduledAt, int durationMinutes, DateTime? actualStartTime, DateTime? actualEndTime, String timezone, String? meetingUrl, String? meetingPassword, String? locationAddress, double hourlyRate, double totalAmount, String currency, PaymentStatus paymentStatus, String? paymentId, String? coachNotes, String? clientNotes, List<SharedResource> sharedResources, int? clientRating, String? clientFeedback, int? coachRating, String? coachFeedback, String? cancellationReason, String? cancelledBy, DateTime? cancelledAt, DateTime? createdAt, DateTime? updatedAt, CoachProfile? coach
});


@override $CoachProfileCopyWith<$Res>? get coach;

}
/// @nodoc
class __$CoachSessionCopyWithImpl<$Res>
    implements _$CoachSessionCopyWith<$Res> {
  __$CoachSessionCopyWithImpl(this._self, this._then);

  final _CoachSession _self;
  final $Res Function(_CoachSession) _then;

/// Create a copy of CoachSession
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? coachId = null,Object? clientId = null,Object? title = null,Object? description = freezed,Object? sessionType = null,Object? status = null,Object? scheduledAt = null,Object? durationMinutes = null,Object? actualStartTime = freezed,Object? actualEndTime = freezed,Object? timezone = null,Object? meetingUrl = freezed,Object? meetingPassword = freezed,Object? locationAddress = freezed,Object? hourlyRate = null,Object? totalAmount = null,Object? currency = null,Object? paymentStatus = null,Object? paymentId = freezed,Object? coachNotes = freezed,Object? clientNotes = freezed,Object? sharedResources = null,Object? clientRating = freezed,Object? clientFeedback = freezed,Object? coachRating = freezed,Object? coachFeedback = freezed,Object? cancellationReason = freezed,Object? cancelledBy = freezed,Object? cancelledAt = freezed,Object? createdAt = freezed,Object? updatedAt = freezed,Object? coach = freezed,}) {
  return _then(_CoachSession(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,coachId: null == coachId ? _self.coachId : coachId // ignore: cast_nullable_to_non_nullable
as int,clientId: null == clientId ? _self.clientId : clientId // ignore: cast_nullable_to_non_nullable
as int,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,sessionType: null == sessionType ? _self.sessionType : sessionType // ignore: cast_nullable_to_non_nullable
as SessionType,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as SessionStatus,scheduledAt: null == scheduledAt ? _self.scheduledAt : scheduledAt // ignore: cast_nullable_to_non_nullable
as DateTime,durationMinutes: null == durationMinutes ? _self.durationMinutes : durationMinutes // ignore: cast_nullable_to_non_nullable
as int,actualStartTime: freezed == actualStartTime ? _self.actualStartTime : actualStartTime // ignore: cast_nullable_to_non_nullable
as DateTime?,actualEndTime: freezed == actualEndTime ? _self.actualEndTime : actualEndTime // ignore: cast_nullable_to_non_nullable
as DateTime?,timezone: null == timezone ? _self.timezone : timezone // ignore: cast_nullable_to_non_nullable
as String,meetingUrl: freezed == meetingUrl ? _self.meetingUrl : meetingUrl // ignore: cast_nullable_to_non_nullable
as String?,meetingPassword: freezed == meetingPassword ? _self.meetingPassword : meetingPassword // ignore: cast_nullable_to_non_nullable
as String?,locationAddress: freezed == locationAddress ? _self.locationAddress : locationAddress // ignore: cast_nullable_to_non_nullable
as String?,hourlyRate: null == hourlyRate ? _self.hourlyRate : hourlyRate // ignore: cast_nullable_to_non_nullable
as double,totalAmount: null == totalAmount ? _self.totalAmount : totalAmount // ignore: cast_nullable_to_non_nullable
as double,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,paymentStatus: null == paymentStatus ? _self.paymentStatus : paymentStatus // ignore: cast_nullable_to_non_nullable
as PaymentStatus,paymentId: freezed == paymentId ? _self.paymentId : paymentId // ignore: cast_nullable_to_non_nullable
as String?,coachNotes: freezed == coachNotes ? _self.coachNotes : coachNotes // ignore: cast_nullable_to_non_nullable
as String?,clientNotes: freezed == clientNotes ? _self.clientNotes : clientNotes // ignore: cast_nullable_to_non_nullable
as String?,sharedResources: null == sharedResources ? _self._sharedResources : sharedResources // ignore: cast_nullable_to_non_nullable
as List<SharedResource>,clientRating: freezed == clientRating ? _self.clientRating : clientRating // ignore: cast_nullable_to_non_nullable
as int?,clientFeedback: freezed == clientFeedback ? _self.clientFeedback : clientFeedback // ignore: cast_nullable_to_non_nullable
as String?,coachRating: freezed == coachRating ? _self.coachRating : coachRating // ignore: cast_nullable_to_non_nullable
as int?,coachFeedback: freezed == coachFeedback ? _self.coachFeedback : coachFeedback // ignore: cast_nullable_to_non_nullable
as String?,cancellationReason: freezed == cancellationReason ? _self.cancellationReason : cancellationReason // ignore: cast_nullable_to_non_nullable
as String?,cancelledBy: freezed == cancelledBy ? _self.cancelledBy : cancelledBy // ignore: cast_nullable_to_non_nullable
as String?,cancelledAt: freezed == cancelledAt ? _self.cancelledAt : cancelledAt // ignore: cast_nullable_to_non_nullable
as DateTime?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,coach: freezed == coach ? _self.coach : coach // ignore: cast_nullable_to_non_nullable
as CoachProfile?,
  ));
}

/// Create a copy of CoachSession
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CoachProfileCopyWith<$Res>? get coach {
    if (_self.coach == null) {
    return null;
  }

  return $CoachProfileCopyWith<$Res>(_self.coach!, (value) {
    return _then(_self.copyWith(coach: value));
  });
}
}


/// @nodoc
mixin _$CoachPackage {

 int get id; int get coachId; String get name; String? get description;// Package Details
 int get sessionCount; int get validityDays; double get price; String get currency;// Savings
 double? get originalPrice; double? get discountPercentage;// Limits
 int get maxPurchasesPerClient; int? get totalAvailable; int get totalSold; bool get isActive;// Timestamps
 DateTime? get createdAt; DateTime? get updatedAt;
/// Create a copy of CoachPackage
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CoachPackageCopyWith<CoachPackage> get copyWith => _$CoachPackageCopyWithImpl<CoachPackage>(this as CoachPackage, _$identity);

  /// Serializes this CoachPackage to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CoachPackage&&(identical(other.id, id) || other.id == id)&&(identical(other.coachId, coachId) || other.coachId == coachId)&&(identical(other.name, name) || other.name == name)&&(identical(other.description, description) || other.description == description)&&(identical(other.sessionCount, sessionCount) || other.sessionCount == sessionCount)&&(identical(other.validityDays, validityDays) || other.validityDays == validityDays)&&(identical(other.price, price) || other.price == price)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.originalPrice, originalPrice) || other.originalPrice == originalPrice)&&(identical(other.discountPercentage, discountPercentage) || other.discountPercentage == discountPercentage)&&(identical(other.maxPurchasesPerClient, maxPurchasesPerClient) || other.maxPurchasesPerClient == maxPurchasesPerClient)&&(identical(other.totalAvailable, totalAvailable) || other.totalAvailable == totalAvailable)&&(identical(other.totalSold, totalSold) || other.totalSold == totalSold)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,coachId,name,description,sessionCount,validityDays,price,currency,originalPrice,discountPercentage,maxPurchasesPerClient,totalAvailable,totalSold,isActive,createdAt,updatedAt);

@override
String toString() {
  return 'CoachPackage(id: $id, coachId: $coachId, name: $name, description: $description, sessionCount: $sessionCount, validityDays: $validityDays, price: $price, currency: $currency, originalPrice: $originalPrice, discountPercentage: $discountPercentage, maxPurchasesPerClient: $maxPurchasesPerClient, totalAvailable: $totalAvailable, totalSold: $totalSold, isActive: $isActive, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $CoachPackageCopyWith<$Res>  {
  factory $CoachPackageCopyWith(CoachPackage value, $Res Function(CoachPackage) _then) = _$CoachPackageCopyWithImpl;
@useResult
$Res call({
 int id, int coachId, String name, String? description, int sessionCount, int validityDays, double price, String currency, double? originalPrice, double? discountPercentage, int maxPurchasesPerClient, int? totalAvailable, int totalSold, bool isActive, DateTime? createdAt, DateTime? updatedAt
});




}
/// @nodoc
class _$CoachPackageCopyWithImpl<$Res>
    implements $CoachPackageCopyWith<$Res> {
  _$CoachPackageCopyWithImpl(this._self, this._then);

  final CoachPackage _self;
  final $Res Function(CoachPackage) _then;

/// Create a copy of CoachPackage
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? coachId = null,Object? name = null,Object? description = freezed,Object? sessionCount = null,Object? validityDays = null,Object? price = null,Object? currency = null,Object? originalPrice = freezed,Object? discountPercentage = freezed,Object? maxPurchasesPerClient = null,Object? totalAvailable = freezed,Object? totalSold = null,Object? isActive = null,Object? createdAt = freezed,Object? updatedAt = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,coachId: null == coachId ? _self.coachId : coachId // ignore: cast_nullable_to_non_nullable
as int,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,sessionCount: null == sessionCount ? _self.sessionCount : sessionCount // ignore: cast_nullable_to_non_nullable
as int,validityDays: null == validityDays ? _self.validityDays : validityDays // ignore: cast_nullable_to_non_nullable
as int,price: null == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as double,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,originalPrice: freezed == originalPrice ? _self.originalPrice : originalPrice // ignore: cast_nullable_to_non_nullable
as double?,discountPercentage: freezed == discountPercentage ? _self.discountPercentage : discountPercentage // ignore: cast_nullable_to_non_nullable
as double?,maxPurchasesPerClient: null == maxPurchasesPerClient ? _self.maxPurchasesPerClient : maxPurchasesPerClient // ignore: cast_nullable_to_non_nullable
as int,totalAvailable: freezed == totalAvailable ? _self.totalAvailable : totalAvailable // ignore: cast_nullable_to_non_nullable
as int?,totalSold: null == totalSold ? _self.totalSold : totalSold // ignore: cast_nullable_to_non_nullable
as int,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [CoachPackage].
extension CoachPackagePatterns on CoachPackage {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CoachPackage value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CoachPackage() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CoachPackage value)  $default,){
final _that = this;
switch (_that) {
case _CoachPackage():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CoachPackage value)?  $default,){
final _that = this;
switch (_that) {
case _CoachPackage() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  int coachId,  String name,  String? description,  int sessionCount,  int validityDays,  double price,  String currency,  double? originalPrice,  double? discountPercentage,  int maxPurchasesPerClient,  int? totalAvailable,  int totalSold,  bool isActive,  DateTime? createdAt,  DateTime? updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CoachPackage() when $default != null:
return $default(_that.id,_that.coachId,_that.name,_that.description,_that.sessionCount,_that.validityDays,_that.price,_that.currency,_that.originalPrice,_that.discountPercentage,_that.maxPurchasesPerClient,_that.totalAvailable,_that.totalSold,_that.isActive,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  int coachId,  String name,  String? description,  int sessionCount,  int validityDays,  double price,  String currency,  double? originalPrice,  double? discountPercentage,  int maxPurchasesPerClient,  int? totalAvailable,  int totalSold,  bool isActive,  DateTime? createdAt,  DateTime? updatedAt)  $default,) {final _that = this;
switch (_that) {
case _CoachPackage():
return $default(_that.id,_that.coachId,_that.name,_that.description,_that.sessionCount,_that.validityDays,_that.price,_that.currency,_that.originalPrice,_that.discountPercentage,_that.maxPurchasesPerClient,_that.totalAvailable,_that.totalSold,_that.isActive,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  int coachId,  String name,  String? description,  int sessionCount,  int validityDays,  double price,  String currency,  double? originalPrice,  double? discountPercentage,  int maxPurchasesPerClient,  int? totalAvailable,  int totalSold,  bool isActive,  DateTime? createdAt,  DateTime? updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _CoachPackage() when $default != null:
return $default(_that.id,_that.coachId,_that.name,_that.description,_that.sessionCount,_that.validityDays,_that.price,_that.currency,_that.originalPrice,_that.discountPercentage,_that.maxPurchasesPerClient,_that.totalAvailable,_that.totalSold,_that.isActive,_that.createdAt,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CoachPackage extends CoachPackage {
  const _CoachPackage({required this.id, required this.coachId, required this.name, this.description, required this.sessionCount, required this.validityDays, required this.price, this.currency = 'USD', this.originalPrice, this.discountPercentage, this.maxPurchasesPerClient = 1, this.totalAvailable, this.totalSold = 0, this.isActive = true, this.createdAt, this.updatedAt}): super._();
  factory _CoachPackage.fromJson(Map<String, dynamic> json) => _$CoachPackageFromJson(json);

@override final  int id;
@override final  int coachId;
@override final  String name;
@override final  String? description;
// Package Details
@override final  int sessionCount;
@override final  int validityDays;
@override final  double price;
@override@JsonKey() final  String currency;
// Savings
@override final  double? originalPrice;
@override final  double? discountPercentage;
// Limits
@override@JsonKey() final  int maxPurchasesPerClient;
@override final  int? totalAvailable;
@override@JsonKey() final  int totalSold;
@override@JsonKey() final  bool isActive;
// Timestamps
@override final  DateTime? createdAt;
@override final  DateTime? updatedAt;

/// Create a copy of CoachPackage
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CoachPackageCopyWith<_CoachPackage> get copyWith => __$CoachPackageCopyWithImpl<_CoachPackage>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CoachPackageToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CoachPackage&&(identical(other.id, id) || other.id == id)&&(identical(other.coachId, coachId) || other.coachId == coachId)&&(identical(other.name, name) || other.name == name)&&(identical(other.description, description) || other.description == description)&&(identical(other.sessionCount, sessionCount) || other.sessionCount == sessionCount)&&(identical(other.validityDays, validityDays) || other.validityDays == validityDays)&&(identical(other.price, price) || other.price == price)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.originalPrice, originalPrice) || other.originalPrice == originalPrice)&&(identical(other.discountPercentage, discountPercentage) || other.discountPercentage == discountPercentage)&&(identical(other.maxPurchasesPerClient, maxPurchasesPerClient) || other.maxPurchasesPerClient == maxPurchasesPerClient)&&(identical(other.totalAvailable, totalAvailable) || other.totalAvailable == totalAvailable)&&(identical(other.totalSold, totalSold) || other.totalSold == totalSold)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,coachId,name,description,sessionCount,validityDays,price,currency,originalPrice,discountPercentage,maxPurchasesPerClient,totalAvailable,totalSold,isActive,createdAt,updatedAt);

@override
String toString() {
  return 'CoachPackage(id: $id, coachId: $coachId, name: $name, description: $description, sessionCount: $sessionCount, validityDays: $validityDays, price: $price, currency: $currency, originalPrice: $originalPrice, discountPercentage: $discountPercentage, maxPurchasesPerClient: $maxPurchasesPerClient, totalAvailable: $totalAvailable, totalSold: $totalSold, isActive: $isActive, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$CoachPackageCopyWith<$Res> implements $CoachPackageCopyWith<$Res> {
  factory _$CoachPackageCopyWith(_CoachPackage value, $Res Function(_CoachPackage) _then) = __$CoachPackageCopyWithImpl;
@override @useResult
$Res call({
 int id, int coachId, String name, String? description, int sessionCount, int validityDays, double price, String currency, double? originalPrice, double? discountPercentage, int maxPurchasesPerClient, int? totalAvailable, int totalSold, bool isActive, DateTime? createdAt, DateTime? updatedAt
});




}
/// @nodoc
class __$CoachPackageCopyWithImpl<$Res>
    implements _$CoachPackageCopyWith<$Res> {
  __$CoachPackageCopyWithImpl(this._self, this._then);

  final _CoachPackage _self;
  final $Res Function(_CoachPackage) _then;

/// Create a copy of CoachPackage
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? coachId = null,Object? name = null,Object? description = freezed,Object? sessionCount = null,Object? validityDays = null,Object? price = null,Object? currency = null,Object? originalPrice = freezed,Object? discountPercentage = freezed,Object? maxPurchasesPerClient = null,Object? totalAvailable = freezed,Object? totalSold = null,Object? isActive = null,Object? createdAt = freezed,Object? updatedAt = freezed,}) {
  return _then(_CoachPackage(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,coachId: null == coachId ? _self.coachId : coachId // ignore: cast_nullable_to_non_nullable
as int,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,sessionCount: null == sessionCount ? _self.sessionCount : sessionCount // ignore: cast_nullable_to_non_nullable
as int,validityDays: null == validityDays ? _self.validityDays : validityDays // ignore: cast_nullable_to_non_nullable
as int,price: null == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as double,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,originalPrice: freezed == originalPrice ? _self.originalPrice : originalPrice // ignore: cast_nullable_to_non_nullable
as double?,discountPercentage: freezed == discountPercentage ? _self.discountPercentage : discountPercentage // ignore: cast_nullable_to_non_nullable
as double?,maxPurchasesPerClient: null == maxPurchasesPerClient ? _self.maxPurchasesPerClient : maxPurchasesPerClient // ignore: cast_nullable_to_non_nullable
as int,totalAvailable: freezed == totalAvailable ? _self.totalAvailable : totalAvailable // ignore: cast_nullable_to_non_nullable
as int?,totalSold: null == totalSold ? _self.totalSold : totalSold // ignore: cast_nullable_to_non_nullable
as int,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}


/// @nodoc
mixin _$ClientCoachPackage {

 int get id; int get packageId; int get clientId; DateTime get purchaseDate; DateTime get expiryDate; int get sessionsUsed; int get sessionsRemaining; String? get paymentId; double get amountPaid; PackageStatus get status;// Related data
 CoachPackage? get package;
/// Create a copy of ClientCoachPackage
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ClientCoachPackageCopyWith<ClientCoachPackage> get copyWith => _$ClientCoachPackageCopyWithImpl<ClientCoachPackage>(this as ClientCoachPackage, _$identity);

  /// Serializes this ClientCoachPackage to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ClientCoachPackage&&(identical(other.id, id) || other.id == id)&&(identical(other.packageId, packageId) || other.packageId == packageId)&&(identical(other.clientId, clientId) || other.clientId == clientId)&&(identical(other.purchaseDate, purchaseDate) || other.purchaseDate == purchaseDate)&&(identical(other.expiryDate, expiryDate) || other.expiryDate == expiryDate)&&(identical(other.sessionsUsed, sessionsUsed) || other.sessionsUsed == sessionsUsed)&&(identical(other.sessionsRemaining, sessionsRemaining) || other.sessionsRemaining == sessionsRemaining)&&(identical(other.paymentId, paymentId) || other.paymentId == paymentId)&&(identical(other.amountPaid, amountPaid) || other.amountPaid == amountPaid)&&(identical(other.status, status) || other.status == status)&&(identical(other.package, package) || other.package == package));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,packageId,clientId,purchaseDate,expiryDate,sessionsUsed,sessionsRemaining,paymentId,amountPaid,status,package);

@override
String toString() {
  return 'ClientCoachPackage(id: $id, packageId: $packageId, clientId: $clientId, purchaseDate: $purchaseDate, expiryDate: $expiryDate, sessionsUsed: $sessionsUsed, sessionsRemaining: $sessionsRemaining, paymentId: $paymentId, amountPaid: $amountPaid, status: $status, package: $package)';
}


}

/// @nodoc
abstract mixin class $ClientCoachPackageCopyWith<$Res>  {
  factory $ClientCoachPackageCopyWith(ClientCoachPackage value, $Res Function(ClientCoachPackage) _then) = _$ClientCoachPackageCopyWithImpl;
@useResult
$Res call({
 int id, int packageId, int clientId, DateTime purchaseDate, DateTime expiryDate, int sessionsUsed, int sessionsRemaining, String? paymentId, double amountPaid, PackageStatus status, CoachPackage? package
});


$CoachPackageCopyWith<$Res>? get package;

}
/// @nodoc
class _$ClientCoachPackageCopyWithImpl<$Res>
    implements $ClientCoachPackageCopyWith<$Res> {
  _$ClientCoachPackageCopyWithImpl(this._self, this._then);

  final ClientCoachPackage _self;
  final $Res Function(ClientCoachPackage) _then;

/// Create a copy of ClientCoachPackage
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? packageId = null,Object? clientId = null,Object? purchaseDate = null,Object? expiryDate = null,Object? sessionsUsed = null,Object? sessionsRemaining = null,Object? paymentId = freezed,Object? amountPaid = null,Object? status = null,Object? package = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,packageId: null == packageId ? _self.packageId : packageId // ignore: cast_nullable_to_non_nullable
as int,clientId: null == clientId ? _self.clientId : clientId // ignore: cast_nullable_to_non_nullable
as int,purchaseDate: null == purchaseDate ? _self.purchaseDate : purchaseDate // ignore: cast_nullable_to_non_nullable
as DateTime,expiryDate: null == expiryDate ? _self.expiryDate : expiryDate // ignore: cast_nullable_to_non_nullable
as DateTime,sessionsUsed: null == sessionsUsed ? _self.sessionsUsed : sessionsUsed // ignore: cast_nullable_to_non_nullable
as int,sessionsRemaining: null == sessionsRemaining ? _self.sessionsRemaining : sessionsRemaining // ignore: cast_nullable_to_non_nullable
as int,paymentId: freezed == paymentId ? _self.paymentId : paymentId // ignore: cast_nullable_to_non_nullable
as String?,amountPaid: null == amountPaid ? _self.amountPaid : amountPaid // ignore: cast_nullable_to_non_nullable
as double,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as PackageStatus,package: freezed == package ? _self.package : package // ignore: cast_nullable_to_non_nullable
as CoachPackage?,
  ));
}
/// Create a copy of ClientCoachPackage
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CoachPackageCopyWith<$Res>? get package {
    if (_self.package == null) {
    return null;
  }

  return $CoachPackageCopyWith<$Res>(_self.package!, (value) {
    return _then(_self.copyWith(package: value));
  });
}
}


/// Adds pattern-matching-related methods to [ClientCoachPackage].
extension ClientCoachPackagePatterns on ClientCoachPackage {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ClientCoachPackage value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ClientCoachPackage() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ClientCoachPackage value)  $default,){
final _that = this;
switch (_that) {
case _ClientCoachPackage():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ClientCoachPackage value)?  $default,){
final _that = this;
switch (_that) {
case _ClientCoachPackage() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  int packageId,  int clientId,  DateTime purchaseDate,  DateTime expiryDate,  int sessionsUsed,  int sessionsRemaining,  String? paymentId,  double amountPaid,  PackageStatus status,  CoachPackage? package)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ClientCoachPackage() when $default != null:
return $default(_that.id,_that.packageId,_that.clientId,_that.purchaseDate,_that.expiryDate,_that.sessionsUsed,_that.sessionsRemaining,_that.paymentId,_that.amountPaid,_that.status,_that.package);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  int packageId,  int clientId,  DateTime purchaseDate,  DateTime expiryDate,  int sessionsUsed,  int sessionsRemaining,  String? paymentId,  double amountPaid,  PackageStatus status,  CoachPackage? package)  $default,) {final _that = this;
switch (_that) {
case _ClientCoachPackage():
return $default(_that.id,_that.packageId,_that.clientId,_that.purchaseDate,_that.expiryDate,_that.sessionsUsed,_that.sessionsRemaining,_that.paymentId,_that.amountPaid,_that.status,_that.package);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  int packageId,  int clientId,  DateTime purchaseDate,  DateTime expiryDate,  int sessionsUsed,  int sessionsRemaining,  String? paymentId,  double amountPaid,  PackageStatus status,  CoachPackage? package)?  $default,) {final _that = this;
switch (_that) {
case _ClientCoachPackage() when $default != null:
return $default(_that.id,_that.packageId,_that.clientId,_that.purchaseDate,_that.expiryDate,_that.sessionsUsed,_that.sessionsRemaining,_that.paymentId,_that.amountPaid,_that.status,_that.package);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ClientCoachPackage extends ClientCoachPackage {
  const _ClientCoachPackage({required this.id, required this.packageId, required this.clientId, required this.purchaseDate, required this.expiryDate, this.sessionsUsed = 0, required this.sessionsRemaining, this.paymentId, required this.amountPaid, this.status = PackageStatus.active, this.package}): super._();
  factory _ClientCoachPackage.fromJson(Map<String, dynamic> json) => _$ClientCoachPackageFromJson(json);

@override final  int id;
@override final  int packageId;
@override final  int clientId;
@override final  DateTime purchaseDate;
@override final  DateTime expiryDate;
@override@JsonKey() final  int sessionsUsed;
@override final  int sessionsRemaining;
@override final  String? paymentId;
@override final  double amountPaid;
@override@JsonKey() final  PackageStatus status;
// Related data
@override final  CoachPackage? package;

/// Create a copy of ClientCoachPackage
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ClientCoachPackageCopyWith<_ClientCoachPackage> get copyWith => __$ClientCoachPackageCopyWithImpl<_ClientCoachPackage>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ClientCoachPackageToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ClientCoachPackage&&(identical(other.id, id) || other.id == id)&&(identical(other.packageId, packageId) || other.packageId == packageId)&&(identical(other.clientId, clientId) || other.clientId == clientId)&&(identical(other.purchaseDate, purchaseDate) || other.purchaseDate == purchaseDate)&&(identical(other.expiryDate, expiryDate) || other.expiryDate == expiryDate)&&(identical(other.sessionsUsed, sessionsUsed) || other.sessionsUsed == sessionsUsed)&&(identical(other.sessionsRemaining, sessionsRemaining) || other.sessionsRemaining == sessionsRemaining)&&(identical(other.paymentId, paymentId) || other.paymentId == paymentId)&&(identical(other.amountPaid, amountPaid) || other.amountPaid == amountPaid)&&(identical(other.status, status) || other.status == status)&&(identical(other.package, package) || other.package == package));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,packageId,clientId,purchaseDate,expiryDate,sessionsUsed,sessionsRemaining,paymentId,amountPaid,status,package);

@override
String toString() {
  return 'ClientCoachPackage(id: $id, packageId: $packageId, clientId: $clientId, purchaseDate: $purchaseDate, expiryDate: $expiryDate, sessionsUsed: $sessionsUsed, sessionsRemaining: $sessionsRemaining, paymentId: $paymentId, amountPaid: $amountPaid, status: $status, package: $package)';
}


}

/// @nodoc
abstract mixin class _$ClientCoachPackageCopyWith<$Res> implements $ClientCoachPackageCopyWith<$Res> {
  factory _$ClientCoachPackageCopyWith(_ClientCoachPackage value, $Res Function(_ClientCoachPackage) _then) = __$ClientCoachPackageCopyWithImpl;
@override @useResult
$Res call({
 int id, int packageId, int clientId, DateTime purchaseDate, DateTime expiryDate, int sessionsUsed, int sessionsRemaining, String? paymentId, double amountPaid, PackageStatus status, CoachPackage? package
});


@override $CoachPackageCopyWith<$Res>? get package;

}
/// @nodoc
class __$ClientCoachPackageCopyWithImpl<$Res>
    implements _$ClientCoachPackageCopyWith<$Res> {
  __$ClientCoachPackageCopyWithImpl(this._self, this._then);

  final _ClientCoachPackage _self;
  final $Res Function(_ClientCoachPackage) _then;

/// Create a copy of ClientCoachPackage
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? packageId = null,Object? clientId = null,Object? purchaseDate = null,Object? expiryDate = null,Object? sessionsUsed = null,Object? sessionsRemaining = null,Object? paymentId = freezed,Object? amountPaid = null,Object? status = null,Object? package = freezed,}) {
  return _then(_ClientCoachPackage(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,packageId: null == packageId ? _self.packageId : packageId // ignore: cast_nullable_to_non_nullable
as int,clientId: null == clientId ? _self.clientId : clientId // ignore: cast_nullable_to_non_nullable
as int,purchaseDate: null == purchaseDate ? _self.purchaseDate : purchaseDate // ignore: cast_nullable_to_non_nullable
as DateTime,expiryDate: null == expiryDate ? _self.expiryDate : expiryDate // ignore: cast_nullable_to_non_nullable
as DateTime,sessionsUsed: null == sessionsUsed ? _self.sessionsUsed : sessionsUsed // ignore: cast_nullable_to_non_nullable
as int,sessionsRemaining: null == sessionsRemaining ? _self.sessionsRemaining : sessionsRemaining // ignore: cast_nullable_to_non_nullable
as int,paymentId: freezed == paymentId ? _self.paymentId : paymentId // ignore: cast_nullable_to_non_nullable
as String?,amountPaid: null == amountPaid ? _self.amountPaid : amountPaid // ignore: cast_nullable_to_non_nullable
as double,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as PackageStatus,package: freezed == package ? _self.package : package // ignore: cast_nullable_to_non_nullable
as CoachPackage?,
  ));
}

/// Create a copy of ClientCoachPackage
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CoachPackageCopyWith<$Res>? get package {
    if (_self.package == null) {
    return null;
  }

  return $CoachPackageCopyWith<$Res>(_self.package!, (value) {
    return _then(_self.copyWith(package: value));
  });
}
}


/// @nodoc
mixin _$CoachReview {

 int get id; int get coachId; int get clientId; int? get sessionId;// Ratings
 int get rating; String? get title; String get comment;// Detailed Ratings
 int? get communicationRating; int? get knowledgeRating; int? get helpfulnessRating;// Status Flags
 bool get isVerified; bool get isFeatured; bool get isVisible;// Coach Response
 String? get coachResponse; DateTime? get coachResponseAt;// Engagement Metrics
 int get helpfulCount; int get unhelpfulCount;// Timestamps
 DateTime? get createdAt; DateTime? get updatedAt;// Related data
 String? get clientName; String? get clientProfileImageUrl;
/// Create a copy of CoachReview
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CoachReviewCopyWith<CoachReview> get copyWith => _$CoachReviewCopyWithImpl<CoachReview>(this as CoachReview, _$identity);

  /// Serializes this CoachReview to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CoachReview&&(identical(other.id, id) || other.id == id)&&(identical(other.coachId, coachId) || other.coachId == coachId)&&(identical(other.clientId, clientId) || other.clientId == clientId)&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.title, title) || other.title == title)&&(identical(other.comment, comment) || other.comment == comment)&&(identical(other.communicationRating, communicationRating) || other.communicationRating == communicationRating)&&(identical(other.knowledgeRating, knowledgeRating) || other.knowledgeRating == knowledgeRating)&&(identical(other.helpfulnessRating, helpfulnessRating) || other.helpfulnessRating == helpfulnessRating)&&(identical(other.isVerified, isVerified) || other.isVerified == isVerified)&&(identical(other.isFeatured, isFeatured) || other.isFeatured == isFeatured)&&(identical(other.isVisible, isVisible) || other.isVisible == isVisible)&&(identical(other.coachResponse, coachResponse) || other.coachResponse == coachResponse)&&(identical(other.coachResponseAt, coachResponseAt) || other.coachResponseAt == coachResponseAt)&&(identical(other.helpfulCount, helpfulCount) || other.helpfulCount == helpfulCount)&&(identical(other.unhelpfulCount, unhelpfulCount) || other.unhelpfulCount == unhelpfulCount)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.clientName, clientName) || other.clientName == clientName)&&(identical(other.clientProfileImageUrl, clientProfileImageUrl) || other.clientProfileImageUrl == clientProfileImageUrl));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,coachId,clientId,sessionId,rating,title,comment,communicationRating,knowledgeRating,helpfulnessRating,isVerified,isFeatured,isVisible,coachResponse,coachResponseAt,helpfulCount,unhelpfulCount,createdAt,updatedAt,clientName,clientProfileImageUrl]);

@override
String toString() {
  return 'CoachReview(id: $id, coachId: $coachId, clientId: $clientId, sessionId: $sessionId, rating: $rating, title: $title, comment: $comment, communicationRating: $communicationRating, knowledgeRating: $knowledgeRating, helpfulnessRating: $helpfulnessRating, isVerified: $isVerified, isFeatured: $isFeatured, isVisible: $isVisible, coachResponse: $coachResponse, coachResponseAt: $coachResponseAt, helpfulCount: $helpfulCount, unhelpfulCount: $unhelpfulCount, createdAt: $createdAt, updatedAt: $updatedAt, clientName: $clientName, clientProfileImageUrl: $clientProfileImageUrl)';
}


}

/// @nodoc
abstract mixin class $CoachReviewCopyWith<$Res>  {
  factory $CoachReviewCopyWith(CoachReview value, $Res Function(CoachReview) _then) = _$CoachReviewCopyWithImpl;
@useResult
$Res call({
 int id, int coachId, int clientId, int? sessionId, int rating, String? title, String comment, int? communicationRating, int? knowledgeRating, int? helpfulnessRating, bool isVerified, bool isFeatured, bool isVisible, String? coachResponse, DateTime? coachResponseAt, int helpfulCount, int unhelpfulCount, DateTime? createdAt, DateTime? updatedAt, String? clientName, String? clientProfileImageUrl
});




}
/// @nodoc
class _$CoachReviewCopyWithImpl<$Res>
    implements $CoachReviewCopyWith<$Res> {
  _$CoachReviewCopyWithImpl(this._self, this._then);

  final CoachReview _self;
  final $Res Function(CoachReview) _then;

/// Create a copy of CoachReview
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? coachId = null,Object? clientId = null,Object? sessionId = freezed,Object? rating = null,Object? title = freezed,Object? comment = null,Object? communicationRating = freezed,Object? knowledgeRating = freezed,Object? helpfulnessRating = freezed,Object? isVerified = null,Object? isFeatured = null,Object? isVisible = null,Object? coachResponse = freezed,Object? coachResponseAt = freezed,Object? helpfulCount = null,Object? unhelpfulCount = null,Object? createdAt = freezed,Object? updatedAt = freezed,Object? clientName = freezed,Object? clientProfileImageUrl = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,coachId: null == coachId ? _self.coachId : coachId // ignore: cast_nullable_to_non_nullable
as int,clientId: null == clientId ? _self.clientId : clientId // ignore: cast_nullable_to_non_nullable
as int,sessionId: freezed == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as int?,rating: null == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int,title: freezed == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String?,comment: null == comment ? _self.comment : comment // ignore: cast_nullable_to_non_nullable
as String,communicationRating: freezed == communicationRating ? _self.communicationRating : communicationRating // ignore: cast_nullable_to_non_nullable
as int?,knowledgeRating: freezed == knowledgeRating ? _self.knowledgeRating : knowledgeRating // ignore: cast_nullable_to_non_nullable
as int?,helpfulnessRating: freezed == helpfulnessRating ? _self.helpfulnessRating : helpfulnessRating // ignore: cast_nullable_to_non_nullable
as int?,isVerified: null == isVerified ? _self.isVerified : isVerified // ignore: cast_nullable_to_non_nullable
as bool,isFeatured: null == isFeatured ? _self.isFeatured : isFeatured // ignore: cast_nullable_to_non_nullable
as bool,isVisible: null == isVisible ? _self.isVisible : isVisible // ignore: cast_nullable_to_non_nullable
as bool,coachResponse: freezed == coachResponse ? _self.coachResponse : coachResponse // ignore: cast_nullable_to_non_nullable
as String?,coachResponseAt: freezed == coachResponseAt ? _self.coachResponseAt : coachResponseAt // ignore: cast_nullable_to_non_nullable
as DateTime?,helpfulCount: null == helpfulCount ? _self.helpfulCount : helpfulCount // ignore: cast_nullable_to_non_nullable
as int,unhelpfulCount: null == unhelpfulCount ? _self.unhelpfulCount : unhelpfulCount // ignore: cast_nullable_to_non_nullable
as int,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,clientName: freezed == clientName ? _self.clientName : clientName // ignore: cast_nullable_to_non_nullable
as String?,clientProfileImageUrl: freezed == clientProfileImageUrl ? _self.clientProfileImageUrl : clientProfileImageUrl // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [CoachReview].
extension CoachReviewPatterns on CoachReview {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CoachReview value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CoachReview() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CoachReview value)  $default,){
final _that = this;
switch (_that) {
case _CoachReview():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CoachReview value)?  $default,){
final _that = this;
switch (_that) {
case _CoachReview() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  int coachId,  int clientId,  int? sessionId,  int rating,  String? title,  String comment,  int? communicationRating,  int? knowledgeRating,  int? helpfulnessRating,  bool isVerified,  bool isFeatured,  bool isVisible,  String? coachResponse,  DateTime? coachResponseAt,  int helpfulCount,  int unhelpfulCount,  DateTime? createdAt,  DateTime? updatedAt,  String? clientName,  String? clientProfileImageUrl)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CoachReview() when $default != null:
return $default(_that.id,_that.coachId,_that.clientId,_that.sessionId,_that.rating,_that.title,_that.comment,_that.communicationRating,_that.knowledgeRating,_that.helpfulnessRating,_that.isVerified,_that.isFeatured,_that.isVisible,_that.coachResponse,_that.coachResponseAt,_that.helpfulCount,_that.unhelpfulCount,_that.createdAt,_that.updatedAt,_that.clientName,_that.clientProfileImageUrl);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  int coachId,  int clientId,  int? sessionId,  int rating,  String? title,  String comment,  int? communicationRating,  int? knowledgeRating,  int? helpfulnessRating,  bool isVerified,  bool isFeatured,  bool isVisible,  String? coachResponse,  DateTime? coachResponseAt,  int helpfulCount,  int unhelpfulCount,  DateTime? createdAt,  DateTime? updatedAt,  String? clientName,  String? clientProfileImageUrl)  $default,) {final _that = this;
switch (_that) {
case _CoachReview():
return $default(_that.id,_that.coachId,_that.clientId,_that.sessionId,_that.rating,_that.title,_that.comment,_that.communicationRating,_that.knowledgeRating,_that.helpfulnessRating,_that.isVerified,_that.isFeatured,_that.isVisible,_that.coachResponse,_that.coachResponseAt,_that.helpfulCount,_that.unhelpfulCount,_that.createdAt,_that.updatedAt,_that.clientName,_that.clientProfileImageUrl);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  int coachId,  int clientId,  int? sessionId,  int rating,  String? title,  String comment,  int? communicationRating,  int? knowledgeRating,  int? helpfulnessRating,  bool isVerified,  bool isFeatured,  bool isVisible,  String? coachResponse,  DateTime? coachResponseAt,  int helpfulCount,  int unhelpfulCount,  DateTime? createdAt,  DateTime? updatedAt,  String? clientName,  String? clientProfileImageUrl)?  $default,) {final _that = this;
switch (_that) {
case _CoachReview() when $default != null:
return $default(_that.id,_that.coachId,_that.clientId,_that.sessionId,_that.rating,_that.title,_that.comment,_that.communicationRating,_that.knowledgeRating,_that.helpfulnessRating,_that.isVerified,_that.isFeatured,_that.isVisible,_that.coachResponse,_that.coachResponseAt,_that.helpfulCount,_that.unhelpfulCount,_that.createdAt,_that.updatedAt,_that.clientName,_that.clientProfileImageUrl);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CoachReview extends CoachReview {
  const _CoachReview({required this.id, required this.coachId, required this.clientId, this.sessionId, required this.rating, this.title, required this.comment, this.communicationRating, this.knowledgeRating, this.helpfulnessRating, this.isVerified = false, this.isFeatured = false, this.isVisible = true, this.coachResponse, this.coachResponseAt, this.helpfulCount = 0, this.unhelpfulCount = 0, this.createdAt, this.updatedAt, this.clientName, this.clientProfileImageUrl}): super._();
  factory _CoachReview.fromJson(Map<String, dynamic> json) => _$CoachReviewFromJson(json);

@override final  int id;
@override final  int coachId;
@override final  int clientId;
@override final  int? sessionId;
// Ratings
@override final  int rating;
@override final  String? title;
@override final  String comment;
// Detailed Ratings
@override final  int? communicationRating;
@override final  int? knowledgeRating;
@override final  int? helpfulnessRating;
// Status Flags
@override@JsonKey() final  bool isVerified;
@override@JsonKey() final  bool isFeatured;
@override@JsonKey() final  bool isVisible;
// Coach Response
@override final  String? coachResponse;
@override final  DateTime? coachResponseAt;
// Engagement Metrics
@override@JsonKey() final  int helpfulCount;
@override@JsonKey() final  int unhelpfulCount;
// Timestamps
@override final  DateTime? createdAt;
@override final  DateTime? updatedAt;
// Related data
@override final  String? clientName;
@override final  String? clientProfileImageUrl;

/// Create a copy of CoachReview
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CoachReviewCopyWith<_CoachReview> get copyWith => __$CoachReviewCopyWithImpl<_CoachReview>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CoachReviewToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CoachReview&&(identical(other.id, id) || other.id == id)&&(identical(other.coachId, coachId) || other.coachId == coachId)&&(identical(other.clientId, clientId) || other.clientId == clientId)&&(identical(other.sessionId, sessionId) || other.sessionId == sessionId)&&(identical(other.rating, rating) || other.rating == rating)&&(identical(other.title, title) || other.title == title)&&(identical(other.comment, comment) || other.comment == comment)&&(identical(other.communicationRating, communicationRating) || other.communicationRating == communicationRating)&&(identical(other.knowledgeRating, knowledgeRating) || other.knowledgeRating == knowledgeRating)&&(identical(other.helpfulnessRating, helpfulnessRating) || other.helpfulnessRating == helpfulnessRating)&&(identical(other.isVerified, isVerified) || other.isVerified == isVerified)&&(identical(other.isFeatured, isFeatured) || other.isFeatured == isFeatured)&&(identical(other.isVisible, isVisible) || other.isVisible == isVisible)&&(identical(other.coachResponse, coachResponse) || other.coachResponse == coachResponse)&&(identical(other.coachResponseAt, coachResponseAt) || other.coachResponseAt == coachResponseAt)&&(identical(other.helpfulCount, helpfulCount) || other.helpfulCount == helpfulCount)&&(identical(other.unhelpfulCount, unhelpfulCount) || other.unhelpfulCount == unhelpfulCount)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.clientName, clientName) || other.clientName == clientName)&&(identical(other.clientProfileImageUrl, clientProfileImageUrl) || other.clientProfileImageUrl == clientProfileImageUrl));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,coachId,clientId,sessionId,rating,title,comment,communicationRating,knowledgeRating,helpfulnessRating,isVerified,isFeatured,isVisible,coachResponse,coachResponseAt,helpfulCount,unhelpfulCount,createdAt,updatedAt,clientName,clientProfileImageUrl]);

@override
String toString() {
  return 'CoachReview(id: $id, coachId: $coachId, clientId: $clientId, sessionId: $sessionId, rating: $rating, title: $title, comment: $comment, communicationRating: $communicationRating, knowledgeRating: $knowledgeRating, helpfulnessRating: $helpfulnessRating, isVerified: $isVerified, isFeatured: $isFeatured, isVisible: $isVisible, coachResponse: $coachResponse, coachResponseAt: $coachResponseAt, helpfulCount: $helpfulCount, unhelpfulCount: $unhelpfulCount, createdAt: $createdAt, updatedAt: $updatedAt, clientName: $clientName, clientProfileImageUrl: $clientProfileImageUrl)';
}


}

/// @nodoc
abstract mixin class _$CoachReviewCopyWith<$Res> implements $CoachReviewCopyWith<$Res> {
  factory _$CoachReviewCopyWith(_CoachReview value, $Res Function(_CoachReview) _then) = __$CoachReviewCopyWithImpl;
@override @useResult
$Res call({
 int id, int coachId, int clientId, int? sessionId, int rating, String? title, String comment, int? communicationRating, int? knowledgeRating, int? helpfulnessRating, bool isVerified, bool isFeatured, bool isVisible, String? coachResponse, DateTime? coachResponseAt, int helpfulCount, int unhelpfulCount, DateTime? createdAt, DateTime? updatedAt, String? clientName, String? clientProfileImageUrl
});




}
/// @nodoc
class __$CoachReviewCopyWithImpl<$Res>
    implements _$CoachReviewCopyWith<$Res> {
  __$CoachReviewCopyWithImpl(this._self, this._then);

  final _CoachReview _self;
  final $Res Function(_CoachReview) _then;

/// Create a copy of CoachReview
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? coachId = null,Object? clientId = null,Object? sessionId = freezed,Object? rating = null,Object? title = freezed,Object? comment = null,Object? communicationRating = freezed,Object? knowledgeRating = freezed,Object? helpfulnessRating = freezed,Object? isVerified = null,Object? isFeatured = null,Object? isVisible = null,Object? coachResponse = freezed,Object? coachResponseAt = freezed,Object? helpfulCount = null,Object? unhelpfulCount = null,Object? createdAt = freezed,Object? updatedAt = freezed,Object? clientName = freezed,Object? clientProfileImageUrl = freezed,}) {
  return _then(_CoachReview(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,coachId: null == coachId ? _self.coachId : coachId // ignore: cast_nullable_to_non_nullable
as int,clientId: null == clientId ? _self.clientId : clientId // ignore: cast_nullable_to_non_nullable
as int,sessionId: freezed == sessionId ? _self.sessionId : sessionId // ignore: cast_nullable_to_non_nullable
as int?,rating: null == rating ? _self.rating : rating // ignore: cast_nullable_to_non_nullable
as int,title: freezed == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String?,comment: null == comment ? _self.comment : comment // ignore: cast_nullable_to_non_nullable
as String,communicationRating: freezed == communicationRating ? _self.communicationRating : communicationRating // ignore: cast_nullable_to_non_nullable
as int?,knowledgeRating: freezed == knowledgeRating ? _self.knowledgeRating : knowledgeRating // ignore: cast_nullable_to_non_nullable
as int?,helpfulnessRating: freezed == helpfulnessRating ? _self.helpfulnessRating : helpfulnessRating // ignore: cast_nullable_to_non_nullable
as int?,isVerified: null == isVerified ? _self.isVerified : isVerified // ignore: cast_nullable_to_non_nullable
as bool,isFeatured: null == isFeatured ? _self.isFeatured : isFeatured // ignore: cast_nullable_to_non_nullable
as bool,isVisible: null == isVisible ? _self.isVisible : isVisible // ignore: cast_nullable_to_non_nullable
as bool,coachResponse: freezed == coachResponse ? _self.coachResponse : coachResponse // ignore: cast_nullable_to_non_nullable
as String?,coachResponseAt: freezed == coachResponseAt ? _self.coachResponseAt : coachResponseAt // ignore: cast_nullable_to_non_nullable
as DateTime?,helpfulCount: null == helpfulCount ? _self.helpfulCount : helpfulCount // ignore: cast_nullable_to_non_nullable
as int,unhelpfulCount: null == unhelpfulCount ? _self.unhelpfulCount : unhelpfulCount // ignore: cast_nullable_to_non_nullable
as int,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,clientName: freezed == clientName ? _self.clientName : clientName // ignore: cast_nullable_to_non_nullable
as String?,clientProfileImageUrl: freezed == clientProfileImageUrl ? _self.clientProfileImageUrl : clientProfileImageUrl // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$ReviewStats {

 int get totalReviews; double get averageRating; Map<String, int> get ratingDistribution; DetailedRatings? get detailedRatings;
/// Create a copy of ReviewStats
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ReviewStatsCopyWith<ReviewStats> get copyWith => _$ReviewStatsCopyWithImpl<ReviewStats>(this as ReviewStats, _$identity);

  /// Serializes this ReviewStats to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ReviewStats&&(identical(other.totalReviews, totalReviews) || other.totalReviews == totalReviews)&&(identical(other.averageRating, averageRating) || other.averageRating == averageRating)&&const DeepCollectionEquality().equals(other.ratingDistribution, ratingDistribution)&&(identical(other.detailedRatings, detailedRatings) || other.detailedRatings == detailedRatings));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,totalReviews,averageRating,const DeepCollectionEquality().hash(ratingDistribution),detailedRatings);

@override
String toString() {
  return 'ReviewStats(totalReviews: $totalReviews, averageRating: $averageRating, ratingDistribution: $ratingDistribution, detailedRatings: $detailedRatings)';
}


}

/// @nodoc
abstract mixin class $ReviewStatsCopyWith<$Res>  {
  factory $ReviewStatsCopyWith(ReviewStats value, $Res Function(ReviewStats) _then) = _$ReviewStatsCopyWithImpl;
@useResult
$Res call({
 int totalReviews, double averageRating, Map<String, int> ratingDistribution, DetailedRatings? detailedRatings
});


$DetailedRatingsCopyWith<$Res>? get detailedRatings;

}
/// @nodoc
class _$ReviewStatsCopyWithImpl<$Res>
    implements $ReviewStatsCopyWith<$Res> {
  _$ReviewStatsCopyWithImpl(this._self, this._then);

  final ReviewStats _self;
  final $Res Function(ReviewStats) _then;

/// Create a copy of ReviewStats
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? totalReviews = null,Object? averageRating = null,Object? ratingDistribution = null,Object? detailedRatings = freezed,}) {
  return _then(_self.copyWith(
totalReviews: null == totalReviews ? _self.totalReviews : totalReviews // ignore: cast_nullable_to_non_nullable
as int,averageRating: null == averageRating ? _self.averageRating : averageRating // ignore: cast_nullable_to_non_nullable
as double,ratingDistribution: null == ratingDistribution ? _self.ratingDistribution : ratingDistribution // ignore: cast_nullable_to_non_nullable
as Map<String, int>,detailedRatings: freezed == detailedRatings ? _self.detailedRatings : detailedRatings // ignore: cast_nullable_to_non_nullable
as DetailedRatings?,
  ));
}
/// Create a copy of ReviewStats
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DetailedRatingsCopyWith<$Res>? get detailedRatings {
    if (_self.detailedRatings == null) {
    return null;
  }

  return $DetailedRatingsCopyWith<$Res>(_self.detailedRatings!, (value) {
    return _then(_self.copyWith(detailedRatings: value));
  });
}
}


/// Adds pattern-matching-related methods to [ReviewStats].
extension ReviewStatsPatterns on ReviewStats {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ReviewStats value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ReviewStats() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ReviewStats value)  $default,){
final _that = this;
switch (_that) {
case _ReviewStats():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ReviewStats value)?  $default,){
final _that = this;
switch (_that) {
case _ReviewStats() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int totalReviews,  double averageRating,  Map<String, int> ratingDistribution,  DetailedRatings? detailedRatings)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ReviewStats() when $default != null:
return $default(_that.totalReviews,_that.averageRating,_that.ratingDistribution,_that.detailedRatings);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int totalReviews,  double averageRating,  Map<String, int> ratingDistribution,  DetailedRatings? detailedRatings)  $default,) {final _that = this;
switch (_that) {
case _ReviewStats():
return $default(_that.totalReviews,_that.averageRating,_that.ratingDistribution,_that.detailedRatings);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int totalReviews,  double averageRating,  Map<String, int> ratingDistribution,  DetailedRatings? detailedRatings)?  $default,) {final _that = this;
switch (_that) {
case _ReviewStats() when $default != null:
return $default(_that.totalReviews,_that.averageRating,_that.ratingDistribution,_that.detailedRatings);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ReviewStats implements ReviewStats {
  const _ReviewStats({this.totalReviews = 0, this.averageRating = 0.0, final  Map<String, int> ratingDistribution = const {}, this.detailedRatings}): _ratingDistribution = ratingDistribution;
  factory _ReviewStats.fromJson(Map<String, dynamic> json) => _$ReviewStatsFromJson(json);

@override@JsonKey() final  int totalReviews;
@override@JsonKey() final  double averageRating;
 final  Map<String, int> _ratingDistribution;
@override@JsonKey() Map<String, int> get ratingDistribution {
  if (_ratingDistribution is EqualUnmodifiableMapView) return _ratingDistribution;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_ratingDistribution);
}

@override final  DetailedRatings? detailedRatings;

/// Create a copy of ReviewStats
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ReviewStatsCopyWith<_ReviewStats> get copyWith => __$ReviewStatsCopyWithImpl<_ReviewStats>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ReviewStatsToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ReviewStats&&(identical(other.totalReviews, totalReviews) || other.totalReviews == totalReviews)&&(identical(other.averageRating, averageRating) || other.averageRating == averageRating)&&const DeepCollectionEquality().equals(other._ratingDistribution, _ratingDistribution)&&(identical(other.detailedRatings, detailedRatings) || other.detailedRatings == detailedRatings));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,totalReviews,averageRating,const DeepCollectionEquality().hash(_ratingDistribution),detailedRatings);

@override
String toString() {
  return 'ReviewStats(totalReviews: $totalReviews, averageRating: $averageRating, ratingDistribution: $ratingDistribution, detailedRatings: $detailedRatings)';
}


}

/// @nodoc
abstract mixin class _$ReviewStatsCopyWith<$Res> implements $ReviewStatsCopyWith<$Res> {
  factory _$ReviewStatsCopyWith(_ReviewStats value, $Res Function(_ReviewStats) _then) = __$ReviewStatsCopyWithImpl;
@override @useResult
$Res call({
 int totalReviews, double averageRating, Map<String, int> ratingDistribution, DetailedRatings? detailedRatings
});


@override $DetailedRatingsCopyWith<$Res>? get detailedRatings;

}
/// @nodoc
class __$ReviewStatsCopyWithImpl<$Res>
    implements _$ReviewStatsCopyWith<$Res> {
  __$ReviewStatsCopyWithImpl(this._self, this._then);

  final _ReviewStats _self;
  final $Res Function(_ReviewStats) _then;

/// Create a copy of ReviewStats
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? totalReviews = null,Object? averageRating = null,Object? ratingDistribution = null,Object? detailedRatings = freezed,}) {
  return _then(_ReviewStats(
totalReviews: null == totalReviews ? _self.totalReviews : totalReviews // ignore: cast_nullable_to_non_nullable
as int,averageRating: null == averageRating ? _self.averageRating : averageRating // ignore: cast_nullable_to_non_nullable
as double,ratingDistribution: null == ratingDistribution ? _self._ratingDistribution : ratingDistribution // ignore: cast_nullable_to_non_nullable
as Map<String, int>,detailedRatings: freezed == detailedRatings ? _self.detailedRatings : detailedRatings // ignore: cast_nullable_to_non_nullable
as DetailedRatings?,
  ));
}

/// Create a copy of ReviewStats
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DetailedRatingsCopyWith<$Res>? get detailedRatings {
    if (_self.detailedRatings == null) {
    return null;
  }

  return $DetailedRatingsCopyWith<$Res>(_self.detailedRatings!, (value) {
    return _then(_self.copyWith(detailedRatings: value));
  });
}
}


/// @nodoc
mixin _$DetailedRatings {

 double get communication; double get knowledge; double get helpfulness;
/// Create a copy of DetailedRatings
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DetailedRatingsCopyWith<DetailedRatings> get copyWith => _$DetailedRatingsCopyWithImpl<DetailedRatings>(this as DetailedRatings, _$identity);

  /// Serializes this DetailedRatings to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DetailedRatings&&(identical(other.communication, communication) || other.communication == communication)&&(identical(other.knowledge, knowledge) || other.knowledge == knowledge)&&(identical(other.helpfulness, helpfulness) || other.helpfulness == helpfulness));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,communication,knowledge,helpfulness);

@override
String toString() {
  return 'DetailedRatings(communication: $communication, knowledge: $knowledge, helpfulness: $helpfulness)';
}


}

/// @nodoc
abstract mixin class $DetailedRatingsCopyWith<$Res>  {
  factory $DetailedRatingsCopyWith(DetailedRatings value, $Res Function(DetailedRatings) _then) = _$DetailedRatingsCopyWithImpl;
@useResult
$Res call({
 double communication, double knowledge, double helpfulness
});




}
/// @nodoc
class _$DetailedRatingsCopyWithImpl<$Res>
    implements $DetailedRatingsCopyWith<$Res> {
  _$DetailedRatingsCopyWithImpl(this._self, this._then);

  final DetailedRatings _self;
  final $Res Function(DetailedRatings) _then;

/// Create a copy of DetailedRatings
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? communication = null,Object? knowledge = null,Object? helpfulness = null,}) {
  return _then(_self.copyWith(
communication: null == communication ? _self.communication : communication // ignore: cast_nullable_to_non_nullable
as double,knowledge: null == knowledge ? _self.knowledge : knowledge // ignore: cast_nullable_to_non_nullable
as double,helpfulness: null == helpfulness ? _self.helpfulness : helpfulness // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

}


/// Adds pattern-matching-related methods to [DetailedRatings].
extension DetailedRatingsPatterns on DetailedRatings {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DetailedRatings value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DetailedRatings() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DetailedRatings value)  $default,){
final _that = this;
switch (_that) {
case _DetailedRatings():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DetailedRatings value)?  $default,){
final _that = this;
switch (_that) {
case _DetailedRatings() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( double communication,  double knowledge,  double helpfulness)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DetailedRatings() when $default != null:
return $default(_that.communication,_that.knowledge,_that.helpfulness);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( double communication,  double knowledge,  double helpfulness)  $default,) {final _that = this;
switch (_that) {
case _DetailedRatings():
return $default(_that.communication,_that.knowledge,_that.helpfulness);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( double communication,  double knowledge,  double helpfulness)?  $default,) {final _that = this;
switch (_that) {
case _DetailedRatings() when $default != null:
return $default(_that.communication,_that.knowledge,_that.helpfulness);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DetailedRatings implements DetailedRatings {
  const _DetailedRatings({this.communication = 0.0, this.knowledge = 0.0, this.helpfulness = 0.0});
  factory _DetailedRatings.fromJson(Map<String, dynamic> json) => _$DetailedRatingsFromJson(json);

@override@JsonKey() final  double communication;
@override@JsonKey() final  double knowledge;
@override@JsonKey() final  double helpfulness;

/// Create a copy of DetailedRatings
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DetailedRatingsCopyWith<_DetailedRatings> get copyWith => __$DetailedRatingsCopyWithImpl<_DetailedRatings>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DetailedRatingsToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _DetailedRatings&&(identical(other.communication, communication) || other.communication == communication)&&(identical(other.knowledge, knowledge) || other.knowledge == knowledge)&&(identical(other.helpfulness, helpfulness) || other.helpfulness == helpfulness));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,communication,knowledge,helpfulness);

@override
String toString() {
  return 'DetailedRatings(communication: $communication, knowledge: $knowledge, helpfulness: $helpfulness)';
}


}

/// @nodoc
abstract mixin class _$DetailedRatingsCopyWith<$Res> implements $DetailedRatingsCopyWith<$Res> {
  factory _$DetailedRatingsCopyWith(_DetailedRatings value, $Res Function(_DetailedRatings) _then) = __$DetailedRatingsCopyWithImpl;
@override @useResult
$Res call({
 double communication, double knowledge, double helpfulness
});




}
/// @nodoc
class __$DetailedRatingsCopyWithImpl<$Res>
    implements _$DetailedRatingsCopyWith<$Res> {
  __$DetailedRatingsCopyWithImpl(this._self, this._then);

  final _DetailedRatings _self;
  final $Res Function(_DetailedRatings) _then;

/// Create a copy of DetailedRatings
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? communication = null,Object? knowledge = null,Object? helpfulness = null,}) {
  return _then(_DetailedRatings(
communication: null == communication ? _self.communication : communication // ignore: cast_nullable_to_non_nullable
as double,knowledge: null == knowledge ? _self.knowledge : knowledge // ignore: cast_nullable_to_non_nullable
as double,helpfulness: null == helpfulness ? _self.helpfulness : helpfulness // ignore: cast_nullable_to_non_nullable
as double,
  ));
}


}


/// @nodoc
mixin _$TimeSlot {

 DateTime get startTime; DateTime get endTime; bool get isAvailable;
/// Create a copy of TimeSlot
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TimeSlotCopyWith<TimeSlot> get copyWith => _$TimeSlotCopyWithImpl<TimeSlot>(this as TimeSlot, _$identity);

  /// Serializes this TimeSlot to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TimeSlot&&(identical(other.startTime, startTime) || other.startTime == startTime)&&(identical(other.endTime, endTime) || other.endTime == endTime)&&(identical(other.isAvailable, isAvailable) || other.isAvailable == isAvailable));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,startTime,endTime,isAvailable);

@override
String toString() {
  return 'TimeSlot(startTime: $startTime, endTime: $endTime, isAvailable: $isAvailable)';
}


}

/// @nodoc
abstract mixin class $TimeSlotCopyWith<$Res>  {
  factory $TimeSlotCopyWith(TimeSlot value, $Res Function(TimeSlot) _then) = _$TimeSlotCopyWithImpl;
@useResult
$Res call({
 DateTime startTime, DateTime endTime, bool isAvailable
});




}
/// @nodoc
class _$TimeSlotCopyWithImpl<$Res>
    implements $TimeSlotCopyWith<$Res> {
  _$TimeSlotCopyWithImpl(this._self, this._then);

  final TimeSlot _self;
  final $Res Function(TimeSlot) _then;

/// Create a copy of TimeSlot
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? startTime = null,Object? endTime = null,Object? isAvailable = null,}) {
  return _then(_self.copyWith(
startTime: null == startTime ? _self.startTime : startTime // ignore: cast_nullable_to_non_nullable
as DateTime,endTime: null == endTime ? _self.endTime : endTime // ignore: cast_nullable_to_non_nullable
as DateTime,isAvailable: null == isAvailable ? _self.isAvailable : isAvailable // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [TimeSlot].
extension TimeSlotPatterns on TimeSlot {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _TimeSlot value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _TimeSlot() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _TimeSlot value)  $default,){
final _that = this;
switch (_that) {
case _TimeSlot():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _TimeSlot value)?  $default,){
final _that = this;
switch (_that) {
case _TimeSlot() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( DateTime startTime,  DateTime endTime,  bool isAvailable)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _TimeSlot() when $default != null:
return $default(_that.startTime,_that.endTime,_that.isAvailable);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( DateTime startTime,  DateTime endTime,  bool isAvailable)  $default,) {final _that = this;
switch (_that) {
case _TimeSlot():
return $default(_that.startTime,_that.endTime,_that.isAvailable);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( DateTime startTime,  DateTime endTime,  bool isAvailable)?  $default,) {final _that = this;
switch (_that) {
case _TimeSlot() when $default != null:
return $default(_that.startTime,_that.endTime,_that.isAvailable);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _TimeSlot implements TimeSlot {
  const _TimeSlot({required this.startTime, required this.endTime, this.isAvailable = true});
  factory _TimeSlot.fromJson(Map<String, dynamic> json) => _$TimeSlotFromJson(json);

@override final  DateTime startTime;
@override final  DateTime endTime;
@override@JsonKey() final  bool isAvailable;

/// Create a copy of TimeSlot
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TimeSlotCopyWith<_TimeSlot> get copyWith => __$TimeSlotCopyWithImpl<_TimeSlot>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$TimeSlotToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _TimeSlot&&(identical(other.startTime, startTime) || other.startTime == startTime)&&(identical(other.endTime, endTime) || other.endTime == endTime)&&(identical(other.isAvailable, isAvailable) || other.isAvailable == isAvailable));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,startTime,endTime,isAvailable);

@override
String toString() {
  return 'TimeSlot(startTime: $startTime, endTime: $endTime, isAvailable: $isAvailable)';
}


}

/// @nodoc
abstract mixin class _$TimeSlotCopyWith<$Res> implements $TimeSlotCopyWith<$Res> {
  factory _$TimeSlotCopyWith(_TimeSlot value, $Res Function(_TimeSlot) _then) = __$TimeSlotCopyWithImpl;
@override @useResult
$Res call({
 DateTime startTime, DateTime endTime, bool isAvailable
});




}
/// @nodoc
class __$TimeSlotCopyWithImpl<$Res>
    implements _$TimeSlotCopyWith<$Res> {
  __$TimeSlotCopyWithImpl(this._self, this._then);

  final _TimeSlot _self;
  final $Res Function(_TimeSlot) _then;

/// Create a copy of TimeSlot
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? startTime = null,Object? endTime = null,Object? isAvailable = null,}) {
  return _then(_TimeSlot(
startTime: null == startTime ? _self.startTime : startTime // ignore: cast_nullable_to_non_nullable
as DateTime,endTime: null == endTime ? _self.endTime : endTime // ignore: cast_nullable_to_non_nullable
as DateTime,isAvailable: null == isAvailable ? _self.isAvailable : isAvailable // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$BookingRequest {

 int get coachId; String get title; String? get description; SessionType get sessionType; DateTime get scheduledAt; int get durationMinutes; String get timezone; int? get packageId; String? get clientNotes;
/// Create a copy of BookingRequest
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$BookingRequestCopyWith<BookingRequest> get copyWith => _$BookingRequestCopyWithImpl<BookingRequest>(this as BookingRequest, _$identity);

  /// Serializes this BookingRequest to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is BookingRequest&&(identical(other.coachId, coachId) || other.coachId == coachId)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.sessionType, sessionType) || other.sessionType == sessionType)&&(identical(other.scheduledAt, scheduledAt) || other.scheduledAt == scheduledAt)&&(identical(other.durationMinutes, durationMinutes) || other.durationMinutes == durationMinutes)&&(identical(other.timezone, timezone) || other.timezone == timezone)&&(identical(other.packageId, packageId) || other.packageId == packageId)&&(identical(other.clientNotes, clientNotes) || other.clientNotes == clientNotes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,coachId,title,description,sessionType,scheduledAt,durationMinutes,timezone,packageId,clientNotes);

@override
String toString() {
  return 'BookingRequest(coachId: $coachId, title: $title, description: $description, sessionType: $sessionType, scheduledAt: $scheduledAt, durationMinutes: $durationMinutes, timezone: $timezone, packageId: $packageId, clientNotes: $clientNotes)';
}


}

/// @nodoc
abstract mixin class $BookingRequestCopyWith<$Res>  {
  factory $BookingRequestCopyWith(BookingRequest value, $Res Function(BookingRequest) _then) = _$BookingRequestCopyWithImpl;
@useResult
$Res call({
 int coachId, String title, String? description, SessionType sessionType, DateTime scheduledAt, int durationMinutes, String timezone, int? packageId, String? clientNotes
});




}
/// @nodoc
class _$BookingRequestCopyWithImpl<$Res>
    implements $BookingRequestCopyWith<$Res> {
  _$BookingRequestCopyWithImpl(this._self, this._then);

  final BookingRequest _self;
  final $Res Function(BookingRequest) _then;

/// Create a copy of BookingRequest
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? coachId = null,Object? title = null,Object? description = freezed,Object? sessionType = null,Object? scheduledAt = null,Object? durationMinutes = null,Object? timezone = null,Object? packageId = freezed,Object? clientNotes = freezed,}) {
  return _then(_self.copyWith(
coachId: null == coachId ? _self.coachId : coachId // ignore: cast_nullable_to_non_nullable
as int,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,sessionType: null == sessionType ? _self.sessionType : sessionType // ignore: cast_nullable_to_non_nullable
as SessionType,scheduledAt: null == scheduledAt ? _self.scheduledAt : scheduledAt // ignore: cast_nullable_to_non_nullable
as DateTime,durationMinutes: null == durationMinutes ? _self.durationMinutes : durationMinutes // ignore: cast_nullable_to_non_nullable
as int,timezone: null == timezone ? _self.timezone : timezone // ignore: cast_nullable_to_non_nullable
as String,packageId: freezed == packageId ? _self.packageId : packageId // ignore: cast_nullable_to_non_nullable
as int?,clientNotes: freezed == clientNotes ? _self.clientNotes : clientNotes // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [BookingRequest].
extension BookingRequestPatterns on BookingRequest {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _BookingRequest value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _BookingRequest() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _BookingRequest value)  $default,){
final _that = this;
switch (_that) {
case _BookingRequest():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _BookingRequest value)?  $default,){
final _that = this;
switch (_that) {
case _BookingRequest() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int coachId,  String title,  String? description,  SessionType sessionType,  DateTime scheduledAt,  int durationMinutes,  String timezone,  int? packageId,  String? clientNotes)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _BookingRequest() when $default != null:
return $default(_that.coachId,_that.title,_that.description,_that.sessionType,_that.scheduledAt,_that.durationMinutes,_that.timezone,_that.packageId,_that.clientNotes);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int coachId,  String title,  String? description,  SessionType sessionType,  DateTime scheduledAt,  int durationMinutes,  String timezone,  int? packageId,  String? clientNotes)  $default,) {final _that = this;
switch (_that) {
case _BookingRequest():
return $default(_that.coachId,_that.title,_that.description,_that.sessionType,_that.scheduledAt,_that.durationMinutes,_that.timezone,_that.packageId,_that.clientNotes);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int coachId,  String title,  String? description,  SessionType sessionType,  DateTime scheduledAt,  int durationMinutes,  String timezone,  int? packageId,  String? clientNotes)?  $default,) {final _that = this;
switch (_that) {
case _BookingRequest() when $default != null:
return $default(_that.coachId,_that.title,_that.description,_that.sessionType,_that.scheduledAt,_that.durationMinutes,_that.timezone,_that.packageId,_that.clientNotes);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _BookingRequest implements BookingRequest {
  const _BookingRequest({required this.coachId, required this.title, this.description, required this.sessionType, required this.scheduledAt, required this.durationMinutes, required this.timezone, this.packageId, this.clientNotes});
  factory _BookingRequest.fromJson(Map<String, dynamic> json) => _$BookingRequestFromJson(json);

@override final  int coachId;
@override final  String title;
@override final  String? description;
@override final  SessionType sessionType;
@override final  DateTime scheduledAt;
@override final  int durationMinutes;
@override final  String timezone;
@override final  int? packageId;
@override final  String? clientNotes;

/// Create a copy of BookingRequest
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$BookingRequestCopyWith<_BookingRequest> get copyWith => __$BookingRequestCopyWithImpl<_BookingRequest>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$BookingRequestToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _BookingRequest&&(identical(other.coachId, coachId) || other.coachId == coachId)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.sessionType, sessionType) || other.sessionType == sessionType)&&(identical(other.scheduledAt, scheduledAt) || other.scheduledAt == scheduledAt)&&(identical(other.durationMinutes, durationMinutes) || other.durationMinutes == durationMinutes)&&(identical(other.timezone, timezone) || other.timezone == timezone)&&(identical(other.packageId, packageId) || other.packageId == packageId)&&(identical(other.clientNotes, clientNotes) || other.clientNotes == clientNotes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,coachId,title,description,sessionType,scheduledAt,durationMinutes,timezone,packageId,clientNotes);

@override
String toString() {
  return 'BookingRequest(coachId: $coachId, title: $title, description: $description, sessionType: $sessionType, scheduledAt: $scheduledAt, durationMinutes: $durationMinutes, timezone: $timezone, packageId: $packageId, clientNotes: $clientNotes)';
}


}

/// @nodoc
abstract mixin class _$BookingRequestCopyWith<$Res> implements $BookingRequestCopyWith<$Res> {
  factory _$BookingRequestCopyWith(_BookingRequest value, $Res Function(_BookingRequest) _then) = __$BookingRequestCopyWithImpl;
@override @useResult
$Res call({
 int coachId, String title, String? description, SessionType sessionType, DateTime scheduledAt, int durationMinutes, String timezone, int? packageId, String? clientNotes
});




}
/// @nodoc
class __$BookingRequestCopyWithImpl<$Res>
    implements _$BookingRequestCopyWith<$Res> {
  __$BookingRequestCopyWithImpl(this._self, this._then);

  final _BookingRequest _self;
  final $Res Function(_BookingRequest) _then;

/// Create a copy of BookingRequest
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? coachId = null,Object? title = null,Object? description = freezed,Object? sessionType = null,Object? scheduledAt = null,Object? durationMinutes = null,Object? timezone = null,Object? packageId = freezed,Object? clientNotes = freezed,}) {
  return _then(_BookingRequest(
coachId: null == coachId ? _self.coachId : coachId // ignore: cast_nullable_to_non_nullable
as int,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,sessionType: null == sessionType ? _self.sessionType : sessionType // ignore: cast_nullable_to_non_nullable
as SessionType,scheduledAt: null == scheduledAt ? _self.scheduledAt : scheduledAt // ignore: cast_nullable_to_non_nullable
as DateTime,durationMinutes: null == durationMinutes ? _self.durationMinutes : durationMinutes // ignore: cast_nullable_to_non_nullable
as int,timezone: null == timezone ? _self.timezone : timezone // ignore: cast_nullable_to_non_nullable
as String,packageId: freezed == packageId ? _self.packageId : packageId // ignore: cast_nullable_to_non_nullable
as int?,clientNotes: freezed == clientNotes ? _self.clientNotes : clientNotes // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
