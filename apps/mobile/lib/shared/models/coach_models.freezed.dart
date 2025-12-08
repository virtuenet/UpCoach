// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'coach_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

AvailabilitySlot _$AvailabilitySlotFromJson(Map<String, dynamic> json) {
  return _AvailabilitySlot.fromJson(json);
}

/// @nodoc
mixin _$AvailabilitySlot {
  String get start => throw _privateConstructorUsedError;
  String get end => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $AvailabilitySlotCopyWith<AvailabilitySlot> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AvailabilitySlotCopyWith<$Res> {
  factory $AvailabilitySlotCopyWith(
          AvailabilitySlot value, $Res Function(AvailabilitySlot) then) =
      _$AvailabilitySlotCopyWithImpl<$Res, AvailabilitySlot>;
  @useResult
  $Res call({String start, String end});
}

/// @nodoc
class _$AvailabilitySlotCopyWithImpl<$Res, $Val extends AvailabilitySlot>
    implements $AvailabilitySlotCopyWith<$Res> {
  _$AvailabilitySlotCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? start = null,
    Object? end = null,
  }) {
    return _then(_value.copyWith(
      start: null == start
          ? _value.start
          : start // ignore: cast_nullable_to_non_nullable
              as String,
      end: null == end
          ? _value.end
          : end // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AvailabilitySlotImplCopyWith<$Res>
    implements $AvailabilitySlotCopyWith<$Res> {
  factory _$$AvailabilitySlotImplCopyWith(_$AvailabilitySlotImpl value,
          $Res Function(_$AvailabilitySlotImpl) then) =
      __$$AvailabilitySlotImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String start, String end});
}

/// @nodoc
class __$$AvailabilitySlotImplCopyWithImpl<$Res>
    extends _$AvailabilitySlotCopyWithImpl<$Res, _$AvailabilitySlotImpl>
    implements _$$AvailabilitySlotImplCopyWith<$Res> {
  __$$AvailabilitySlotImplCopyWithImpl(_$AvailabilitySlotImpl _value,
      $Res Function(_$AvailabilitySlotImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? start = null,
    Object? end = null,
  }) {
    return _then(_$AvailabilitySlotImpl(
      start: null == start
          ? _value.start
          : start // ignore: cast_nullable_to_non_nullable
              as String,
      end: null == end
          ? _value.end
          : end // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AvailabilitySlotImpl implements _AvailabilitySlot {
  const _$AvailabilitySlotImpl({required this.start, required this.end});

  factory _$AvailabilitySlotImpl.fromJson(Map<String, dynamic> json) =>
      _$$AvailabilitySlotImplFromJson(json);

  @override
  final String start;
  @override
  final String end;

  @override
  String toString() {
    return 'AvailabilitySlot(start: $start, end: $end)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AvailabilitySlotImpl &&
            (identical(other.start, start) || other.start == start) &&
            (identical(other.end, end) || other.end == end));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, start, end);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AvailabilitySlotImplCopyWith<_$AvailabilitySlotImpl> get copyWith =>
      __$$AvailabilitySlotImplCopyWithImpl<_$AvailabilitySlotImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AvailabilitySlotImplToJson(
      this,
    );
  }
}

abstract class _AvailabilitySlot implements AvailabilitySlot {
  const factory _AvailabilitySlot(
      {required final String start,
      required final String end}) = _$AvailabilitySlotImpl;

  factory _AvailabilitySlot.fromJson(Map<String, dynamic> json) =
      _$AvailabilitySlotImpl.fromJson;

  @override
  String get start;
  @override
  String get end;
  @override
  @JsonKey(ignore: true)
  _$$AvailabilitySlotImplCopyWith<_$AvailabilitySlotImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

AvailabilitySchedule _$AvailabilityScheduleFromJson(Map<String, dynamic> json) {
  return _AvailabilitySchedule.fromJson(json);
}

/// @nodoc
mixin _$AvailabilitySchedule {
  List<AvailabilitySlot> get monday => throw _privateConstructorUsedError;
  List<AvailabilitySlot> get tuesday => throw _privateConstructorUsedError;
  List<AvailabilitySlot> get wednesday => throw _privateConstructorUsedError;
  List<AvailabilitySlot> get thursday => throw _privateConstructorUsedError;
  List<AvailabilitySlot> get friday => throw _privateConstructorUsedError;
  List<AvailabilitySlot> get saturday => throw _privateConstructorUsedError;
  List<AvailabilitySlot> get sunday => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $AvailabilityScheduleCopyWith<AvailabilitySchedule> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AvailabilityScheduleCopyWith<$Res> {
  factory $AvailabilityScheduleCopyWith(AvailabilitySchedule value,
          $Res Function(AvailabilitySchedule) then) =
      _$AvailabilityScheduleCopyWithImpl<$Res, AvailabilitySchedule>;
  @useResult
  $Res call(
      {List<AvailabilitySlot> monday,
      List<AvailabilitySlot> tuesday,
      List<AvailabilitySlot> wednesday,
      List<AvailabilitySlot> thursday,
      List<AvailabilitySlot> friday,
      List<AvailabilitySlot> saturday,
      List<AvailabilitySlot> sunday});
}

/// @nodoc
class _$AvailabilityScheduleCopyWithImpl<$Res,
        $Val extends AvailabilitySchedule>
    implements $AvailabilityScheduleCopyWith<$Res> {
  _$AvailabilityScheduleCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? monday = null,
    Object? tuesday = null,
    Object? wednesday = null,
    Object? thursday = null,
    Object? friday = null,
    Object? saturday = null,
    Object? sunday = null,
  }) {
    return _then(_value.copyWith(
      monday: null == monday
          ? _value.monday
          : monday // ignore: cast_nullable_to_non_nullable
              as List<AvailabilitySlot>,
      tuesday: null == tuesday
          ? _value.tuesday
          : tuesday // ignore: cast_nullable_to_non_nullable
              as List<AvailabilitySlot>,
      wednesday: null == wednesday
          ? _value.wednesday
          : wednesday // ignore: cast_nullable_to_non_nullable
              as List<AvailabilitySlot>,
      thursday: null == thursday
          ? _value.thursday
          : thursday // ignore: cast_nullable_to_non_nullable
              as List<AvailabilitySlot>,
      friday: null == friday
          ? _value.friday
          : friday // ignore: cast_nullable_to_non_nullable
              as List<AvailabilitySlot>,
      saturday: null == saturday
          ? _value.saturday
          : saturday // ignore: cast_nullable_to_non_nullable
              as List<AvailabilitySlot>,
      sunday: null == sunday
          ? _value.sunday
          : sunday // ignore: cast_nullable_to_non_nullable
              as List<AvailabilitySlot>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AvailabilityScheduleImplCopyWith<$Res>
    implements $AvailabilityScheduleCopyWith<$Res> {
  factory _$$AvailabilityScheduleImplCopyWith(_$AvailabilityScheduleImpl value,
          $Res Function(_$AvailabilityScheduleImpl) then) =
      __$$AvailabilityScheduleImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {List<AvailabilitySlot> monday,
      List<AvailabilitySlot> tuesday,
      List<AvailabilitySlot> wednesday,
      List<AvailabilitySlot> thursday,
      List<AvailabilitySlot> friday,
      List<AvailabilitySlot> saturday,
      List<AvailabilitySlot> sunday});
}

/// @nodoc
class __$$AvailabilityScheduleImplCopyWithImpl<$Res>
    extends _$AvailabilityScheduleCopyWithImpl<$Res, _$AvailabilityScheduleImpl>
    implements _$$AvailabilityScheduleImplCopyWith<$Res> {
  __$$AvailabilityScheduleImplCopyWithImpl(_$AvailabilityScheduleImpl _value,
      $Res Function(_$AvailabilityScheduleImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? monday = null,
    Object? tuesday = null,
    Object? wednesday = null,
    Object? thursday = null,
    Object? friday = null,
    Object? saturday = null,
    Object? sunday = null,
  }) {
    return _then(_$AvailabilityScheduleImpl(
      monday: null == monday
          ? _value._monday
          : monday // ignore: cast_nullable_to_non_nullable
              as List<AvailabilitySlot>,
      tuesday: null == tuesday
          ? _value._tuesday
          : tuesday // ignore: cast_nullable_to_non_nullable
              as List<AvailabilitySlot>,
      wednesday: null == wednesday
          ? _value._wednesday
          : wednesday // ignore: cast_nullable_to_non_nullable
              as List<AvailabilitySlot>,
      thursday: null == thursday
          ? _value._thursday
          : thursday // ignore: cast_nullable_to_non_nullable
              as List<AvailabilitySlot>,
      friday: null == friday
          ? _value._friday
          : friday // ignore: cast_nullable_to_non_nullable
              as List<AvailabilitySlot>,
      saturday: null == saturday
          ? _value._saturday
          : saturday // ignore: cast_nullable_to_non_nullable
              as List<AvailabilitySlot>,
      sunday: null == sunday
          ? _value._sunday
          : sunday // ignore: cast_nullable_to_non_nullable
              as List<AvailabilitySlot>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AvailabilityScheduleImpl implements _AvailabilitySchedule {
  const _$AvailabilityScheduleImpl(
      {final List<AvailabilitySlot> monday = const [],
      final List<AvailabilitySlot> tuesday = const [],
      final List<AvailabilitySlot> wednesday = const [],
      final List<AvailabilitySlot> thursday = const [],
      final List<AvailabilitySlot> friday = const [],
      final List<AvailabilitySlot> saturday = const [],
      final List<AvailabilitySlot> sunday = const []})
      : _monday = monday,
        _tuesday = tuesday,
        _wednesday = wednesday,
        _thursday = thursday,
        _friday = friday,
        _saturday = saturday,
        _sunday = sunday;

  factory _$AvailabilityScheduleImpl.fromJson(Map<String, dynamic> json) =>
      _$$AvailabilityScheduleImplFromJson(json);

  final List<AvailabilitySlot> _monday;
  @override
  @JsonKey()
  List<AvailabilitySlot> get monday {
    if (_monday is EqualUnmodifiableListView) return _monday;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_monday);
  }

  final List<AvailabilitySlot> _tuesday;
  @override
  @JsonKey()
  List<AvailabilitySlot> get tuesday {
    if (_tuesday is EqualUnmodifiableListView) return _tuesday;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_tuesday);
  }

  final List<AvailabilitySlot> _wednesday;
  @override
  @JsonKey()
  List<AvailabilitySlot> get wednesday {
    if (_wednesday is EqualUnmodifiableListView) return _wednesday;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_wednesday);
  }

  final List<AvailabilitySlot> _thursday;
  @override
  @JsonKey()
  List<AvailabilitySlot> get thursday {
    if (_thursday is EqualUnmodifiableListView) return _thursday;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_thursday);
  }

  final List<AvailabilitySlot> _friday;
  @override
  @JsonKey()
  List<AvailabilitySlot> get friday {
    if (_friday is EqualUnmodifiableListView) return _friday;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_friday);
  }

  final List<AvailabilitySlot> _saturday;
  @override
  @JsonKey()
  List<AvailabilitySlot> get saturday {
    if (_saturday is EqualUnmodifiableListView) return _saturday;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_saturday);
  }

  final List<AvailabilitySlot> _sunday;
  @override
  @JsonKey()
  List<AvailabilitySlot> get sunday {
    if (_sunday is EqualUnmodifiableListView) return _sunday;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_sunday);
  }

  @override
  String toString() {
    return 'AvailabilitySchedule(monday: $monday, tuesday: $tuesday, wednesday: $wednesday, thursday: $thursday, friday: $friday, saturday: $saturday, sunday: $sunday)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AvailabilityScheduleImpl &&
            const DeepCollectionEquality().equals(other._monday, _monday) &&
            const DeepCollectionEquality().equals(other._tuesday, _tuesday) &&
            const DeepCollectionEquality()
                .equals(other._wednesday, _wednesday) &&
            const DeepCollectionEquality().equals(other._thursday, _thursday) &&
            const DeepCollectionEquality().equals(other._friday, _friday) &&
            const DeepCollectionEquality().equals(other._saturday, _saturday) &&
            const DeepCollectionEquality().equals(other._sunday, _sunday));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      const DeepCollectionEquality().hash(_monday),
      const DeepCollectionEquality().hash(_tuesday),
      const DeepCollectionEquality().hash(_wednesday),
      const DeepCollectionEquality().hash(_thursday),
      const DeepCollectionEquality().hash(_friday),
      const DeepCollectionEquality().hash(_saturday),
      const DeepCollectionEquality().hash(_sunday));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AvailabilityScheduleImplCopyWith<_$AvailabilityScheduleImpl>
      get copyWith =>
          __$$AvailabilityScheduleImplCopyWithImpl<_$AvailabilityScheduleImpl>(
              this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AvailabilityScheduleImplToJson(
      this,
    );
  }
}

abstract class _AvailabilitySchedule implements AvailabilitySchedule {
  const factory _AvailabilitySchedule(
      {final List<AvailabilitySlot> monday,
      final List<AvailabilitySlot> tuesday,
      final List<AvailabilitySlot> wednesday,
      final List<AvailabilitySlot> thursday,
      final List<AvailabilitySlot> friday,
      final List<AvailabilitySlot> saturday,
      final List<AvailabilitySlot> sunday}) = _$AvailabilityScheduleImpl;

  factory _AvailabilitySchedule.fromJson(Map<String, dynamic> json) =
      _$AvailabilityScheduleImpl.fromJson;

  @override
  List<AvailabilitySlot> get monday;
  @override
  List<AvailabilitySlot> get tuesday;
  @override
  List<AvailabilitySlot> get wednesday;
  @override
  List<AvailabilitySlot> get thursday;
  @override
  List<AvailabilitySlot> get friday;
  @override
  List<AvailabilitySlot> get saturday;
  @override
  List<AvailabilitySlot> get sunday;
  @override
  @JsonKey(ignore: true)
  _$$AvailabilityScheduleImplCopyWith<_$AvailabilityScheduleImpl>
      get copyWith => throw _privateConstructorUsedError;
}

Certification _$CertificationFromJson(Map<String, dynamic> json) {
  return _Certification.fromJson(json);
}

/// @nodoc
mixin _$Certification {
  String get name => throw _privateConstructorUsedError;
  String get issuer => throw _privateConstructorUsedError;
  String get date => throw _privateConstructorUsedError;
  String? get verificationUrl => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CertificationCopyWith<Certification> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CertificationCopyWith<$Res> {
  factory $CertificationCopyWith(
          Certification value, $Res Function(Certification) then) =
      _$CertificationCopyWithImpl<$Res, Certification>;
  @useResult
  $Res call({String name, String issuer, String date, String? verificationUrl});
}

/// @nodoc
class _$CertificationCopyWithImpl<$Res, $Val extends Certification>
    implements $CertificationCopyWith<$Res> {
  _$CertificationCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? issuer = null,
    Object? date = null,
    Object? verificationUrl = freezed,
  }) {
    return _then(_value.copyWith(
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      issuer: null == issuer
          ? _value.issuer
          : issuer // ignore: cast_nullable_to_non_nullable
              as String,
      date: null == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as String,
      verificationUrl: freezed == verificationUrl
          ? _value.verificationUrl
          : verificationUrl // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CertificationImplCopyWith<$Res>
    implements $CertificationCopyWith<$Res> {
  factory _$$CertificationImplCopyWith(
          _$CertificationImpl value, $Res Function(_$CertificationImpl) then) =
      __$$CertificationImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String name, String issuer, String date, String? verificationUrl});
}

/// @nodoc
class __$$CertificationImplCopyWithImpl<$Res>
    extends _$CertificationCopyWithImpl<$Res, _$CertificationImpl>
    implements _$$CertificationImplCopyWith<$Res> {
  __$$CertificationImplCopyWithImpl(
      _$CertificationImpl _value, $Res Function(_$CertificationImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? issuer = null,
    Object? date = null,
    Object? verificationUrl = freezed,
  }) {
    return _then(_$CertificationImpl(
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      issuer: null == issuer
          ? _value.issuer
          : issuer // ignore: cast_nullable_to_non_nullable
              as String,
      date: null == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as String,
      verificationUrl: freezed == verificationUrl
          ? _value.verificationUrl
          : verificationUrl // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CertificationImpl implements _Certification {
  const _$CertificationImpl(
      {required this.name,
      required this.issuer,
      required this.date,
      this.verificationUrl});

  factory _$CertificationImpl.fromJson(Map<String, dynamic> json) =>
      _$$CertificationImplFromJson(json);

  @override
  final String name;
  @override
  final String issuer;
  @override
  final String date;
  @override
  final String? verificationUrl;

  @override
  String toString() {
    return 'Certification(name: $name, issuer: $issuer, date: $date, verificationUrl: $verificationUrl)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CertificationImpl &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.issuer, issuer) || other.issuer == issuer) &&
            (identical(other.date, date) || other.date == date) &&
            (identical(other.verificationUrl, verificationUrl) ||
                other.verificationUrl == verificationUrl));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode =>
      Object.hash(runtimeType, name, issuer, date, verificationUrl);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CertificationImplCopyWith<_$CertificationImpl> get copyWith =>
      __$$CertificationImplCopyWithImpl<_$CertificationImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CertificationImplToJson(
      this,
    );
  }
}

abstract class _Certification implements Certification {
  const factory _Certification(
      {required final String name,
      required final String issuer,
      required final String date,
      final String? verificationUrl}) = _$CertificationImpl;

  factory _Certification.fromJson(Map<String, dynamic> json) =
      _$CertificationImpl.fromJson;

  @override
  String get name;
  @override
  String get issuer;
  @override
  String get date;
  @override
  String? get verificationUrl;
  @override
  @JsonKey(ignore: true)
  _$$CertificationImplCopyWith<_$CertificationImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

SharedResource _$SharedResourceFromJson(Map<String, dynamic> json) {
  return _SharedResource.fromJson(json);
}

/// @nodoc
mixin _$SharedResource {
  String get name => throw _privateConstructorUsedError;
  String get url => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  DateTime get uploadedAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $SharedResourceCopyWith<SharedResource> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SharedResourceCopyWith<$Res> {
  factory $SharedResourceCopyWith(
          SharedResource value, $Res Function(SharedResource) then) =
      _$SharedResourceCopyWithImpl<$Res, SharedResource>;
  @useResult
  $Res call({String name, String url, String type, DateTime uploadedAt});
}

/// @nodoc
class _$SharedResourceCopyWithImpl<$Res, $Val extends SharedResource>
    implements $SharedResourceCopyWith<$Res> {
  _$SharedResourceCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? url = null,
    Object? type = null,
    Object? uploadedAt = null,
  }) {
    return _then(_value.copyWith(
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      url: null == url
          ? _value.url
          : url // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      uploadedAt: null == uploadedAt
          ? _value.uploadedAt
          : uploadedAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$SharedResourceImplCopyWith<$Res>
    implements $SharedResourceCopyWith<$Res> {
  factory _$$SharedResourceImplCopyWith(_$SharedResourceImpl value,
          $Res Function(_$SharedResourceImpl) then) =
      __$$SharedResourceImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String name, String url, String type, DateTime uploadedAt});
}

/// @nodoc
class __$$SharedResourceImplCopyWithImpl<$Res>
    extends _$SharedResourceCopyWithImpl<$Res, _$SharedResourceImpl>
    implements _$$SharedResourceImplCopyWith<$Res> {
  __$$SharedResourceImplCopyWithImpl(
      _$SharedResourceImpl _value, $Res Function(_$SharedResourceImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? url = null,
    Object? type = null,
    Object? uploadedAt = null,
  }) {
    return _then(_$SharedResourceImpl(
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      url: null == url
          ? _value.url
          : url // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      uploadedAt: null == uploadedAt
          ? _value.uploadedAt
          : uploadedAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$SharedResourceImpl implements _SharedResource {
  const _$SharedResourceImpl(
      {required this.name,
      required this.url,
      required this.type,
      required this.uploadedAt});

  factory _$SharedResourceImpl.fromJson(Map<String, dynamic> json) =>
      _$$SharedResourceImplFromJson(json);

  @override
  final String name;
  @override
  final String url;
  @override
  final String type;
  @override
  final DateTime uploadedAt;

  @override
  String toString() {
    return 'SharedResource(name: $name, url: $url, type: $type, uploadedAt: $uploadedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SharedResourceImpl &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.url, url) || other.url == url) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.uploadedAt, uploadedAt) ||
                other.uploadedAt == uploadedAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, name, url, type, uploadedAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$SharedResourceImplCopyWith<_$SharedResourceImpl> get copyWith =>
      __$$SharedResourceImplCopyWithImpl<_$SharedResourceImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$SharedResourceImplToJson(
      this,
    );
  }
}

abstract class _SharedResource implements SharedResource {
  const factory _SharedResource(
      {required final String name,
      required final String url,
      required final String type,
      required final DateTime uploadedAt}) = _$SharedResourceImpl;

  factory _SharedResource.fromJson(Map<String, dynamic> json) =
      _$SharedResourceImpl.fromJson;

  @override
  String get name;
  @override
  String get url;
  @override
  String get type;
  @override
  DateTime get uploadedAt;
  @override
  @JsonKey(ignore: true)
  _$$SharedResourceImplCopyWith<_$SharedResourceImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CoachProfile _$CoachProfileFromJson(Map<String, dynamic> json) {
  return _CoachProfile.fromJson(json);
}

/// @nodoc
mixin _$CoachProfile {
  int get id => throw _privateConstructorUsedError;
  int get userId => throw _privateConstructorUsedError;
  String get displayName => throw _privateConstructorUsedError;
  String? get title => throw _privateConstructorUsedError;
  String? get bio => throw _privateConstructorUsedError;
  List<String> get specializations => throw _privateConstructorUsedError;
  List<Certification> get certifications => throw _privateConstructorUsedError;
  int get experienceYears => throw _privateConstructorUsedError;
  List<String> get languages => throw _privateConstructorUsedError;
  String get timezone =>
      throw _privateConstructorUsedError; // Availability & Booking
  bool get isAvailable => throw _privateConstructorUsedError;
  double? get hourlyRate => throw _privateConstructorUsedError;
  String get currency => throw _privateConstructorUsedError;
  double get minBookingHours => throw _privateConstructorUsedError;
  double get maxBookingHours => throw _privateConstructorUsedError;
  AvailabilitySchedule? get availabilitySchedule =>
      throw _privateConstructorUsedError;
  int get bookingBufferHours =>
      throw _privateConstructorUsedError; // Profile Media
  String? get profileImageUrl => throw _privateConstructorUsedError;
  String? get coverImageUrl => throw _privateConstructorUsedError;
  String? get introVideoUrl => throw _privateConstructorUsedError;
  List<String> get galleryImages =>
      throw _privateConstructorUsedError; // Stats & Rating
  int get totalSessions => throw _privateConstructorUsedError;
  int get totalClients => throw _privateConstructorUsedError;
  double get averageRating => throw _privateConstructorUsedError;
  int get ratingCount => throw _privateConstructorUsedError;
  double? get responseTimeHours =>
      throw _privateConstructorUsedError; // Settings
  bool get isVerified => throw _privateConstructorUsedError;
  bool get isFeatured => throw _privateConstructorUsedError;
  bool get isActive => throw _privateConstructorUsedError;
  bool get acceptsInsurance => throw _privateConstructorUsedError;
  List<String> get acceptedPaymentMethods =>
      throw _privateConstructorUsedError; // Metadata
  List<String> get tags => throw _privateConstructorUsedError;
  String? get seoSlug => throw _privateConstructorUsedError; // Timestamps
  DateTime? get createdAt => throw _privateConstructorUsedError;
  DateTime? get updatedAt =>
      throw _privateConstructorUsedError; // Related data (may be loaded separately)
  List<CoachPackage> get packages => throw _privateConstructorUsedError;
  List<CoachReview> get reviews => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CoachProfileCopyWith<CoachProfile> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CoachProfileCopyWith<$Res> {
  factory $CoachProfileCopyWith(
          CoachProfile value, $Res Function(CoachProfile) then) =
      _$CoachProfileCopyWithImpl<$Res, CoachProfile>;
  @useResult
  $Res call(
      {int id,
      int userId,
      String displayName,
      String? title,
      String? bio,
      List<String> specializations,
      List<Certification> certifications,
      int experienceYears,
      List<String> languages,
      String timezone,
      bool isAvailable,
      double? hourlyRate,
      String currency,
      double minBookingHours,
      double maxBookingHours,
      AvailabilitySchedule? availabilitySchedule,
      int bookingBufferHours,
      String? profileImageUrl,
      String? coverImageUrl,
      String? introVideoUrl,
      List<String> galleryImages,
      int totalSessions,
      int totalClients,
      double averageRating,
      int ratingCount,
      double? responseTimeHours,
      bool isVerified,
      bool isFeatured,
      bool isActive,
      bool acceptsInsurance,
      List<String> acceptedPaymentMethods,
      List<String> tags,
      String? seoSlug,
      DateTime? createdAt,
      DateTime? updatedAt,
      List<CoachPackage> packages,
      List<CoachReview> reviews});

  $AvailabilityScheduleCopyWith<$Res>? get availabilitySchedule;
}

/// @nodoc
class _$CoachProfileCopyWithImpl<$Res, $Val extends CoachProfile>
    implements $CoachProfileCopyWith<$Res> {
  _$CoachProfileCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? displayName = null,
    Object? title = freezed,
    Object? bio = freezed,
    Object? specializations = null,
    Object? certifications = null,
    Object? experienceYears = null,
    Object? languages = null,
    Object? timezone = null,
    Object? isAvailable = null,
    Object? hourlyRate = freezed,
    Object? currency = null,
    Object? minBookingHours = null,
    Object? maxBookingHours = null,
    Object? availabilitySchedule = freezed,
    Object? bookingBufferHours = null,
    Object? profileImageUrl = freezed,
    Object? coverImageUrl = freezed,
    Object? introVideoUrl = freezed,
    Object? galleryImages = null,
    Object? totalSessions = null,
    Object? totalClients = null,
    Object? averageRating = null,
    Object? ratingCount = null,
    Object? responseTimeHours = freezed,
    Object? isVerified = null,
    Object? isFeatured = null,
    Object? isActive = null,
    Object? acceptsInsurance = null,
    Object? acceptedPaymentMethods = null,
    Object? tags = null,
    Object? seoSlug = freezed,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? packages = null,
    Object? reviews = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      userId: null == userId
          ? _value.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as int,
      displayName: null == displayName
          ? _value.displayName
          : displayName // ignore: cast_nullable_to_non_nullable
              as String,
      title: freezed == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String?,
      bio: freezed == bio
          ? _value.bio
          : bio // ignore: cast_nullable_to_non_nullable
              as String?,
      specializations: null == specializations
          ? _value.specializations
          : specializations // ignore: cast_nullable_to_non_nullable
              as List<String>,
      certifications: null == certifications
          ? _value.certifications
          : certifications // ignore: cast_nullable_to_non_nullable
              as List<Certification>,
      experienceYears: null == experienceYears
          ? _value.experienceYears
          : experienceYears // ignore: cast_nullable_to_non_nullable
              as int,
      languages: null == languages
          ? _value.languages
          : languages // ignore: cast_nullable_to_non_nullable
              as List<String>,
      timezone: null == timezone
          ? _value.timezone
          : timezone // ignore: cast_nullable_to_non_nullable
              as String,
      isAvailable: null == isAvailable
          ? _value.isAvailable
          : isAvailable // ignore: cast_nullable_to_non_nullable
              as bool,
      hourlyRate: freezed == hourlyRate
          ? _value.hourlyRate
          : hourlyRate // ignore: cast_nullable_to_non_nullable
              as double?,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      minBookingHours: null == minBookingHours
          ? _value.minBookingHours
          : minBookingHours // ignore: cast_nullable_to_non_nullable
              as double,
      maxBookingHours: null == maxBookingHours
          ? _value.maxBookingHours
          : maxBookingHours // ignore: cast_nullable_to_non_nullable
              as double,
      availabilitySchedule: freezed == availabilitySchedule
          ? _value.availabilitySchedule
          : availabilitySchedule // ignore: cast_nullable_to_non_nullable
              as AvailabilitySchedule?,
      bookingBufferHours: null == bookingBufferHours
          ? _value.bookingBufferHours
          : bookingBufferHours // ignore: cast_nullable_to_non_nullable
              as int,
      profileImageUrl: freezed == profileImageUrl
          ? _value.profileImageUrl
          : profileImageUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      coverImageUrl: freezed == coverImageUrl
          ? _value.coverImageUrl
          : coverImageUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      introVideoUrl: freezed == introVideoUrl
          ? _value.introVideoUrl
          : introVideoUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      galleryImages: null == galleryImages
          ? _value.galleryImages
          : galleryImages // ignore: cast_nullable_to_non_nullable
              as List<String>,
      totalSessions: null == totalSessions
          ? _value.totalSessions
          : totalSessions // ignore: cast_nullable_to_non_nullable
              as int,
      totalClients: null == totalClients
          ? _value.totalClients
          : totalClients // ignore: cast_nullable_to_non_nullable
              as int,
      averageRating: null == averageRating
          ? _value.averageRating
          : averageRating // ignore: cast_nullable_to_non_nullable
              as double,
      ratingCount: null == ratingCount
          ? _value.ratingCount
          : ratingCount // ignore: cast_nullable_to_non_nullable
              as int,
      responseTimeHours: freezed == responseTimeHours
          ? _value.responseTimeHours
          : responseTimeHours // ignore: cast_nullable_to_non_nullable
              as double?,
      isVerified: null == isVerified
          ? _value.isVerified
          : isVerified // ignore: cast_nullable_to_non_nullable
              as bool,
      isFeatured: null == isFeatured
          ? _value.isFeatured
          : isFeatured // ignore: cast_nullable_to_non_nullable
              as bool,
      isActive: null == isActive
          ? _value.isActive
          : isActive // ignore: cast_nullable_to_non_nullable
              as bool,
      acceptsInsurance: null == acceptsInsurance
          ? _value.acceptsInsurance
          : acceptsInsurance // ignore: cast_nullable_to_non_nullable
              as bool,
      acceptedPaymentMethods: null == acceptedPaymentMethods
          ? _value.acceptedPaymentMethods
          : acceptedPaymentMethods // ignore: cast_nullable_to_non_nullable
              as List<String>,
      tags: null == tags
          ? _value.tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      seoSlug: freezed == seoSlug
          ? _value.seoSlug
          : seoSlug // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      packages: null == packages
          ? _value.packages
          : packages // ignore: cast_nullable_to_non_nullable
              as List<CoachPackage>,
      reviews: null == reviews
          ? _value.reviews
          : reviews // ignore: cast_nullable_to_non_nullable
              as List<CoachReview>,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $AvailabilityScheduleCopyWith<$Res>? get availabilitySchedule {
    if (_value.availabilitySchedule == null) {
      return null;
    }

    return $AvailabilityScheduleCopyWith<$Res>(_value.availabilitySchedule!,
        (value) {
      return _then(_value.copyWith(availabilitySchedule: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$CoachProfileImplCopyWith<$Res>
    implements $CoachProfileCopyWith<$Res> {
  factory _$$CoachProfileImplCopyWith(
          _$CoachProfileImpl value, $Res Function(_$CoachProfileImpl) then) =
      __$$CoachProfileImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      int userId,
      String displayName,
      String? title,
      String? bio,
      List<String> specializations,
      List<Certification> certifications,
      int experienceYears,
      List<String> languages,
      String timezone,
      bool isAvailable,
      double? hourlyRate,
      String currency,
      double minBookingHours,
      double maxBookingHours,
      AvailabilitySchedule? availabilitySchedule,
      int bookingBufferHours,
      String? profileImageUrl,
      String? coverImageUrl,
      String? introVideoUrl,
      List<String> galleryImages,
      int totalSessions,
      int totalClients,
      double averageRating,
      int ratingCount,
      double? responseTimeHours,
      bool isVerified,
      bool isFeatured,
      bool isActive,
      bool acceptsInsurance,
      List<String> acceptedPaymentMethods,
      List<String> tags,
      String? seoSlug,
      DateTime? createdAt,
      DateTime? updatedAt,
      List<CoachPackage> packages,
      List<CoachReview> reviews});

  @override
  $AvailabilityScheduleCopyWith<$Res>? get availabilitySchedule;
}

/// @nodoc
class __$$CoachProfileImplCopyWithImpl<$Res>
    extends _$CoachProfileCopyWithImpl<$Res, _$CoachProfileImpl>
    implements _$$CoachProfileImplCopyWith<$Res> {
  __$$CoachProfileImplCopyWithImpl(
      _$CoachProfileImpl _value, $Res Function(_$CoachProfileImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? displayName = null,
    Object? title = freezed,
    Object? bio = freezed,
    Object? specializations = null,
    Object? certifications = null,
    Object? experienceYears = null,
    Object? languages = null,
    Object? timezone = null,
    Object? isAvailable = null,
    Object? hourlyRate = freezed,
    Object? currency = null,
    Object? minBookingHours = null,
    Object? maxBookingHours = null,
    Object? availabilitySchedule = freezed,
    Object? bookingBufferHours = null,
    Object? profileImageUrl = freezed,
    Object? coverImageUrl = freezed,
    Object? introVideoUrl = freezed,
    Object? galleryImages = null,
    Object? totalSessions = null,
    Object? totalClients = null,
    Object? averageRating = null,
    Object? ratingCount = null,
    Object? responseTimeHours = freezed,
    Object? isVerified = null,
    Object? isFeatured = null,
    Object? isActive = null,
    Object? acceptsInsurance = null,
    Object? acceptedPaymentMethods = null,
    Object? tags = null,
    Object? seoSlug = freezed,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? packages = null,
    Object? reviews = null,
  }) {
    return _then(_$CoachProfileImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      userId: null == userId
          ? _value.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as int,
      displayName: null == displayName
          ? _value.displayName
          : displayName // ignore: cast_nullable_to_non_nullable
              as String,
      title: freezed == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String?,
      bio: freezed == bio
          ? _value.bio
          : bio // ignore: cast_nullable_to_non_nullable
              as String?,
      specializations: null == specializations
          ? _value._specializations
          : specializations // ignore: cast_nullable_to_non_nullable
              as List<String>,
      certifications: null == certifications
          ? _value._certifications
          : certifications // ignore: cast_nullable_to_non_nullable
              as List<Certification>,
      experienceYears: null == experienceYears
          ? _value.experienceYears
          : experienceYears // ignore: cast_nullable_to_non_nullable
              as int,
      languages: null == languages
          ? _value._languages
          : languages // ignore: cast_nullable_to_non_nullable
              as List<String>,
      timezone: null == timezone
          ? _value.timezone
          : timezone // ignore: cast_nullable_to_non_nullable
              as String,
      isAvailable: null == isAvailable
          ? _value.isAvailable
          : isAvailable // ignore: cast_nullable_to_non_nullable
              as bool,
      hourlyRate: freezed == hourlyRate
          ? _value.hourlyRate
          : hourlyRate // ignore: cast_nullable_to_non_nullable
              as double?,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      minBookingHours: null == minBookingHours
          ? _value.minBookingHours
          : minBookingHours // ignore: cast_nullable_to_non_nullable
              as double,
      maxBookingHours: null == maxBookingHours
          ? _value.maxBookingHours
          : maxBookingHours // ignore: cast_nullable_to_non_nullable
              as double,
      availabilitySchedule: freezed == availabilitySchedule
          ? _value.availabilitySchedule
          : availabilitySchedule // ignore: cast_nullable_to_non_nullable
              as AvailabilitySchedule?,
      bookingBufferHours: null == bookingBufferHours
          ? _value.bookingBufferHours
          : bookingBufferHours // ignore: cast_nullable_to_non_nullable
              as int,
      profileImageUrl: freezed == profileImageUrl
          ? _value.profileImageUrl
          : profileImageUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      coverImageUrl: freezed == coverImageUrl
          ? _value.coverImageUrl
          : coverImageUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      introVideoUrl: freezed == introVideoUrl
          ? _value.introVideoUrl
          : introVideoUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      galleryImages: null == galleryImages
          ? _value._galleryImages
          : galleryImages // ignore: cast_nullable_to_non_nullable
              as List<String>,
      totalSessions: null == totalSessions
          ? _value.totalSessions
          : totalSessions // ignore: cast_nullable_to_non_nullable
              as int,
      totalClients: null == totalClients
          ? _value.totalClients
          : totalClients // ignore: cast_nullable_to_non_nullable
              as int,
      averageRating: null == averageRating
          ? _value.averageRating
          : averageRating // ignore: cast_nullable_to_non_nullable
              as double,
      ratingCount: null == ratingCount
          ? _value.ratingCount
          : ratingCount // ignore: cast_nullable_to_non_nullable
              as int,
      responseTimeHours: freezed == responseTimeHours
          ? _value.responseTimeHours
          : responseTimeHours // ignore: cast_nullable_to_non_nullable
              as double?,
      isVerified: null == isVerified
          ? _value.isVerified
          : isVerified // ignore: cast_nullable_to_non_nullable
              as bool,
      isFeatured: null == isFeatured
          ? _value.isFeatured
          : isFeatured // ignore: cast_nullable_to_non_nullable
              as bool,
      isActive: null == isActive
          ? _value.isActive
          : isActive // ignore: cast_nullable_to_non_nullable
              as bool,
      acceptsInsurance: null == acceptsInsurance
          ? _value.acceptsInsurance
          : acceptsInsurance // ignore: cast_nullable_to_non_nullable
              as bool,
      acceptedPaymentMethods: null == acceptedPaymentMethods
          ? _value._acceptedPaymentMethods
          : acceptedPaymentMethods // ignore: cast_nullable_to_non_nullable
              as List<String>,
      tags: null == tags
          ? _value._tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      seoSlug: freezed == seoSlug
          ? _value.seoSlug
          : seoSlug // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      packages: null == packages
          ? _value._packages
          : packages // ignore: cast_nullable_to_non_nullable
              as List<CoachPackage>,
      reviews: null == reviews
          ? _value._reviews
          : reviews // ignore: cast_nullable_to_non_nullable
              as List<CoachReview>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CoachProfileImpl extends _CoachProfile {
  const _$CoachProfileImpl(
      {required this.id,
      required this.userId,
      required this.displayName,
      this.title,
      this.bio,
      final List<String> specializations = const [],
      final List<Certification> certifications = const [],
      this.experienceYears = 0,
      final List<String> languages = const ['en'],
      this.timezone = 'UTC',
      this.isAvailable = true,
      this.hourlyRate,
      this.currency = 'USD',
      this.minBookingHours = 1.0,
      this.maxBookingHours = 4.0,
      this.availabilitySchedule,
      this.bookingBufferHours = 24,
      this.profileImageUrl,
      this.coverImageUrl,
      this.introVideoUrl,
      final List<String> galleryImages = const [],
      this.totalSessions = 0,
      this.totalClients = 0,
      this.averageRating = 0.0,
      this.ratingCount = 0,
      this.responseTimeHours,
      this.isVerified = false,
      this.isFeatured = false,
      this.isActive = true,
      this.acceptsInsurance = false,
      final List<String> acceptedPaymentMethods = const ['card'],
      final List<String> tags = const [],
      this.seoSlug,
      this.createdAt,
      this.updatedAt,
      final List<CoachPackage> packages = const [],
      final List<CoachReview> reviews = const []})
      : _specializations = specializations,
        _certifications = certifications,
        _languages = languages,
        _galleryImages = galleryImages,
        _acceptedPaymentMethods = acceptedPaymentMethods,
        _tags = tags,
        _packages = packages,
        _reviews = reviews,
        super._();

  factory _$CoachProfileImpl.fromJson(Map<String, dynamic> json) =>
      _$$CoachProfileImplFromJson(json);

  @override
  final int id;
  @override
  final int userId;
  @override
  final String displayName;
  @override
  final String? title;
  @override
  final String? bio;
  final List<String> _specializations;
  @override
  @JsonKey()
  List<String> get specializations {
    if (_specializations is EqualUnmodifiableListView) return _specializations;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_specializations);
  }

  final List<Certification> _certifications;
  @override
  @JsonKey()
  List<Certification> get certifications {
    if (_certifications is EqualUnmodifiableListView) return _certifications;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_certifications);
  }

  @override
  @JsonKey()
  final int experienceYears;
  final List<String> _languages;
  @override
  @JsonKey()
  List<String> get languages {
    if (_languages is EqualUnmodifiableListView) return _languages;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_languages);
  }

  @override
  @JsonKey()
  final String timezone;
// Availability & Booking
  @override
  @JsonKey()
  final bool isAvailable;
  @override
  final double? hourlyRate;
  @override
  @JsonKey()
  final String currency;
  @override
  @JsonKey()
  final double minBookingHours;
  @override
  @JsonKey()
  final double maxBookingHours;
  @override
  final AvailabilitySchedule? availabilitySchedule;
  @override
  @JsonKey()
  final int bookingBufferHours;
// Profile Media
  @override
  final String? profileImageUrl;
  @override
  final String? coverImageUrl;
  @override
  final String? introVideoUrl;
  final List<String> _galleryImages;
  @override
  @JsonKey()
  List<String> get galleryImages {
    if (_galleryImages is EqualUnmodifiableListView) return _galleryImages;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_galleryImages);
  }

// Stats & Rating
  @override
  @JsonKey()
  final int totalSessions;
  @override
  @JsonKey()
  final int totalClients;
  @override
  @JsonKey()
  final double averageRating;
  @override
  @JsonKey()
  final int ratingCount;
  @override
  final double? responseTimeHours;
// Settings
  @override
  @JsonKey()
  final bool isVerified;
  @override
  @JsonKey()
  final bool isFeatured;
  @override
  @JsonKey()
  final bool isActive;
  @override
  @JsonKey()
  final bool acceptsInsurance;
  final List<String> _acceptedPaymentMethods;
  @override
  @JsonKey()
  List<String> get acceptedPaymentMethods {
    if (_acceptedPaymentMethods is EqualUnmodifiableListView)
      return _acceptedPaymentMethods;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_acceptedPaymentMethods);
  }

// Metadata
  final List<String> _tags;
// Metadata
  @override
  @JsonKey()
  List<String> get tags {
    if (_tags is EqualUnmodifiableListView) return _tags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_tags);
  }

  @override
  final String? seoSlug;
// Timestamps
  @override
  final DateTime? createdAt;
  @override
  final DateTime? updatedAt;
// Related data (may be loaded separately)
  final List<CoachPackage> _packages;
// Related data (may be loaded separately)
  @override
  @JsonKey()
  List<CoachPackage> get packages {
    if (_packages is EqualUnmodifiableListView) return _packages;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_packages);
  }

  final List<CoachReview> _reviews;
  @override
  @JsonKey()
  List<CoachReview> get reviews {
    if (_reviews is EqualUnmodifiableListView) return _reviews;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_reviews);
  }

  @override
  String toString() {
    return 'CoachProfile(id: $id, userId: $userId, displayName: $displayName, title: $title, bio: $bio, specializations: $specializations, certifications: $certifications, experienceYears: $experienceYears, languages: $languages, timezone: $timezone, isAvailable: $isAvailable, hourlyRate: $hourlyRate, currency: $currency, minBookingHours: $minBookingHours, maxBookingHours: $maxBookingHours, availabilitySchedule: $availabilitySchedule, bookingBufferHours: $bookingBufferHours, profileImageUrl: $profileImageUrl, coverImageUrl: $coverImageUrl, introVideoUrl: $introVideoUrl, galleryImages: $galleryImages, totalSessions: $totalSessions, totalClients: $totalClients, averageRating: $averageRating, ratingCount: $ratingCount, responseTimeHours: $responseTimeHours, isVerified: $isVerified, isFeatured: $isFeatured, isActive: $isActive, acceptsInsurance: $acceptsInsurance, acceptedPaymentMethods: $acceptedPaymentMethods, tags: $tags, seoSlug: $seoSlug, createdAt: $createdAt, updatedAt: $updatedAt, packages: $packages, reviews: $reviews)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CoachProfileImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.displayName, displayName) ||
                other.displayName == displayName) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.bio, bio) || other.bio == bio) &&
            const DeepCollectionEquality()
                .equals(other._specializations, _specializations) &&
            const DeepCollectionEquality()
                .equals(other._certifications, _certifications) &&
            (identical(other.experienceYears, experienceYears) ||
                other.experienceYears == experienceYears) &&
            const DeepCollectionEquality()
                .equals(other._languages, _languages) &&
            (identical(other.timezone, timezone) ||
                other.timezone == timezone) &&
            (identical(other.isAvailable, isAvailable) ||
                other.isAvailable == isAvailable) &&
            (identical(other.hourlyRate, hourlyRate) ||
                other.hourlyRate == hourlyRate) &&
            (identical(other.currency, currency) ||
                other.currency == currency) &&
            (identical(other.minBookingHours, minBookingHours) ||
                other.minBookingHours == minBookingHours) &&
            (identical(other.maxBookingHours, maxBookingHours) ||
                other.maxBookingHours == maxBookingHours) &&
            (identical(other.availabilitySchedule, availabilitySchedule) ||
                other.availabilitySchedule == availabilitySchedule) &&
            (identical(other.bookingBufferHours, bookingBufferHours) ||
                other.bookingBufferHours == bookingBufferHours) &&
            (identical(other.profileImageUrl, profileImageUrl) ||
                other.profileImageUrl == profileImageUrl) &&
            (identical(other.coverImageUrl, coverImageUrl) ||
                other.coverImageUrl == coverImageUrl) &&
            (identical(other.introVideoUrl, introVideoUrl) ||
                other.introVideoUrl == introVideoUrl) &&
            const DeepCollectionEquality()
                .equals(other._galleryImages, _galleryImages) &&
            (identical(other.totalSessions, totalSessions) ||
                other.totalSessions == totalSessions) &&
            (identical(other.totalClients, totalClients) ||
                other.totalClients == totalClients) &&
            (identical(other.averageRating, averageRating) ||
                other.averageRating == averageRating) &&
            (identical(other.ratingCount, ratingCount) ||
                other.ratingCount == ratingCount) &&
            (identical(other.responseTimeHours, responseTimeHours) ||
                other.responseTimeHours == responseTimeHours) &&
            (identical(other.isVerified, isVerified) ||
                other.isVerified == isVerified) &&
            (identical(other.isFeatured, isFeatured) ||
                other.isFeatured == isFeatured) &&
            (identical(other.isActive, isActive) ||
                other.isActive == isActive) &&
            (identical(other.acceptsInsurance, acceptsInsurance) ||
                other.acceptsInsurance == acceptsInsurance) &&
            const DeepCollectionEquality().equals(
                other._acceptedPaymentMethods, _acceptedPaymentMethods) &&
            const DeepCollectionEquality().equals(other._tags, _tags) &&
            (identical(other.seoSlug, seoSlug) || other.seoSlug == seoSlug) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            const DeepCollectionEquality().equals(other._packages, _packages) &&
            const DeepCollectionEquality().equals(other._reviews, _reviews));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hashAll([
        runtimeType,
        id,
        userId,
        displayName,
        title,
        bio,
        const DeepCollectionEquality().hash(_specializations),
        const DeepCollectionEquality().hash(_certifications),
        experienceYears,
        const DeepCollectionEquality().hash(_languages),
        timezone,
        isAvailable,
        hourlyRate,
        currency,
        minBookingHours,
        maxBookingHours,
        availabilitySchedule,
        bookingBufferHours,
        profileImageUrl,
        coverImageUrl,
        introVideoUrl,
        const DeepCollectionEquality().hash(_galleryImages),
        totalSessions,
        totalClients,
        averageRating,
        ratingCount,
        responseTimeHours,
        isVerified,
        isFeatured,
        isActive,
        acceptsInsurance,
        const DeepCollectionEquality().hash(_acceptedPaymentMethods),
        const DeepCollectionEquality().hash(_tags),
        seoSlug,
        createdAt,
        updatedAt,
        const DeepCollectionEquality().hash(_packages),
        const DeepCollectionEquality().hash(_reviews)
      ]);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CoachProfileImplCopyWith<_$CoachProfileImpl> get copyWith =>
      __$$CoachProfileImplCopyWithImpl<_$CoachProfileImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CoachProfileImplToJson(
      this,
    );
  }
}

abstract class _CoachProfile extends CoachProfile {
  const factory _CoachProfile(
      {required final int id,
      required final int userId,
      required final String displayName,
      final String? title,
      final String? bio,
      final List<String> specializations,
      final List<Certification> certifications,
      final int experienceYears,
      final List<String> languages,
      final String timezone,
      final bool isAvailable,
      final double? hourlyRate,
      final String currency,
      final double minBookingHours,
      final double maxBookingHours,
      final AvailabilitySchedule? availabilitySchedule,
      final int bookingBufferHours,
      final String? profileImageUrl,
      final String? coverImageUrl,
      final String? introVideoUrl,
      final List<String> galleryImages,
      final int totalSessions,
      final int totalClients,
      final double averageRating,
      final int ratingCount,
      final double? responseTimeHours,
      final bool isVerified,
      final bool isFeatured,
      final bool isActive,
      final bool acceptsInsurance,
      final List<String> acceptedPaymentMethods,
      final List<String> tags,
      final String? seoSlug,
      final DateTime? createdAt,
      final DateTime? updatedAt,
      final List<CoachPackage> packages,
      final List<CoachReview> reviews}) = _$CoachProfileImpl;
  const _CoachProfile._() : super._();

  factory _CoachProfile.fromJson(Map<String, dynamic> json) =
      _$CoachProfileImpl.fromJson;

  @override
  int get id;
  @override
  int get userId;
  @override
  String get displayName;
  @override
  String? get title;
  @override
  String? get bio;
  @override
  List<String> get specializations;
  @override
  List<Certification> get certifications;
  @override
  int get experienceYears;
  @override
  List<String> get languages;
  @override
  String get timezone;
  @override // Availability & Booking
  bool get isAvailable;
  @override
  double? get hourlyRate;
  @override
  String get currency;
  @override
  double get minBookingHours;
  @override
  double get maxBookingHours;
  @override
  AvailabilitySchedule? get availabilitySchedule;
  @override
  int get bookingBufferHours;
  @override // Profile Media
  String? get profileImageUrl;
  @override
  String? get coverImageUrl;
  @override
  String? get introVideoUrl;
  @override
  List<String> get galleryImages;
  @override // Stats & Rating
  int get totalSessions;
  @override
  int get totalClients;
  @override
  double get averageRating;
  @override
  int get ratingCount;
  @override
  double? get responseTimeHours;
  @override // Settings
  bool get isVerified;
  @override
  bool get isFeatured;
  @override
  bool get isActive;
  @override
  bool get acceptsInsurance;
  @override
  List<String> get acceptedPaymentMethods;
  @override // Metadata
  List<String> get tags;
  @override
  String? get seoSlug;
  @override // Timestamps
  DateTime? get createdAt;
  @override
  DateTime? get updatedAt;
  @override // Related data (may be loaded separately)
  List<CoachPackage> get packages;
  @override
  List<CoachReview> get reviews;
  @override
  @JsonKey(ignore: true)
  _$$CoachProfileImplCopyWith<_$CoachProfileImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CoachSession _$CoachSessionFromJson(Map<String, dynamic> json) {
  return _CoachSession.fromJson(json);
}

/// @nodoc
mixin _$CoachSession {
  int get id => throw _privateConstructorUsedError;
  int get coachId => throw _privateConstructorUsedError;
  int get clientId => throw _privateConstructorUsedError; // Session Details
  String get title => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  SessionType get sessionType => throw _privateConstructorUsedError;
  SessionStatus get status => throw _privateConstructorUsedError; // Timing
  DateTime get scheduledAt => throw _privateConstructorUsedError;
  int get durationMinutes => throw _privateConstructorUsedError;
  DateTime? get actualStartTime => throw _privateConstructorUsedError;
  DateTime? get actualEndTime => throw _privateConstructorUsedError;
  String get timezone => throw _privateConstructorUsedError; // Meeting Details
  String? get meetingUrl => throw _privateConstructorUsedError;
  String? get meetingPassword => throw _privateConstructorUsedError;
  String? get locationAddress => throw _privateConstructorUsedError; // Pricing
  double get hourlyRate => throw _privateConstructorUsedError;
  double get totalAmount => throw _privateConstructorUsedError;
  String get currency => throw _privateConstructorUsedError;
  PaymentStatus get paymentStatus => throw _privateConstructorUsedError;
  String? get paymentId =>
      throw _privateConstructorUsedError; // Notes & Resources
  String? get coachNotes => throw _privateConstructorUsedError;
  String? get clientNotes => throw _privateConstructorUsedError;
  List<SharedResource> get sharedResources =>
      throw _privateConstructorUsedError; // Feedback
  int? get clientRating => throw _privateConstructorUsedError;
  String? get clientFeedback => throw _privateConstructorUsedError;
  int? get coachRating => throw _privateConstructorUsedError;
  String? get coachFeedback =>
      throw _privateConstructorUsedError; // Cancellation
  String? get cancellationReason => throw _privateConstructorUsedError;
  String? get cancelledBy => throw _privateConstructorUsedError;
  DateTime? get cancelledAt => throw _privateConstructorUsedError; // Timestamps
  DateTime? get createdAt => throw _privateConstructorUsedError;
  DateTime? get updatedAt => throw _privateConstructorUsedError; // Related data
  CoachProfile? get coach => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CoachSessionCopyWith<CoachSession> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CoachSessionCopyWith<$Res> {
  factory $CoachSessionCopyWith(
          CoachSession value, $Res Function(CoachSession) then) =
      _$CoachSessionCopyWithImpl<$Res, CoachSession>;
  @useResult
  $Res call(
      {int id,
      int coachId,
      int clientId,
      String title,
      String? description,
      SessionType sessionType,
      SessionStatus status,
      DateTime scheduledAt,
      int durationMinutes,
      DateTime? actualStartTime,
      DateTime? actualEndTime,
      String timezone,
      String? meetingUrl,
      String? meetingPassword,
      String? locationAddress,
      double hourlyRate,
      double totalAmount,
      String currency,
      PaymentStatus paymentStatus,
      String? paymentId,
      String? coachNotes,
      String? clientNotes,
      List<SharedResource> sharedResources,
      int? clientRating,
      String? clientFeedback,
      int? coachRating,
      String? coachFeedback,
      String? cancellationReason,
      String? cancelledBy,
      DateTime? cancelledAt,
      DateTime? createdAt,
      DateTime? updatedAt,
      CoachProfile? coach});

  $CoachProfileCopyWith<$Res>? get coach;
}

/// @nodoc
class _$CoachSessionCopyWithImpl<$Res, $Val extends CoachSession>
    implements $CoachSessionCopyWith<$Res> {
  _$CoachSessionCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? coachId = null,
    Object? clientId = null,
    Object? title = null,
    Object? description = freezed,
    Object? sessionType = null,
    Object? status = null,
    Object? scheduledAt = null,
    Object? durationMinutes = null,
    Object? actualStartTime = freezed,
    Object? actualEndTime = freezed,
    Object? timezone = null,
    Object? meetingUrl = freezed,
    Object? meetingPassword = freezed,
    Object? locationAddress = freezed,
    Object? hourlyRate = null,
    Object? totalAmount = null,
    Object? currency = null,
    Object? paymentStatus = null,
    Object? paymentId = freezed,
    Object? coachNotes = freezed,
    Object? clientNotes = freezed,
    Object? sharedResources = null,
    Object? clientRating = freezed,
    Object? clientFeedback = freezed,
    Object? coachRating = freezed,
    Object? coachFeedback = freezed,
    Object? cancellationReason = freezed,
    Object? cancelledBy = freezed,
    Object? cancelledAt = freezed,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? coach = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      coachId: null == coachId
          ? _value.coachId
          : coachId // ignore: cast_nullable_to_non_nullable
              as int,
      clientId: null == clientId
          ? _value.clientId
          : clientId // ignore: cast_nullable_to_non_nullable
              as int,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      sessionType: null == sessionType
          ? _value.sessionType
          : sessionType // ignore: cast_nullable_to_non_nullable
              as SessionType,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as SessionStatus,
      scheduledAt: null == scheduledAt
          ? _value.scheduledAt
          : scheduledAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      durationMinutes: null == durationMinutes
          ? _value.durationMinutes
          : durationMinutes // ignore: cast_nullable_to_non_nullable
              as int,
      actualStartTime: freezed == actualStartTime
          ? _value.actualStartTime
          : actualStartTime // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      actualEndTime: freezed == actualEndTime
          ? _value.actualEndTime
          : actualEndTime // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      timezone: null == timezone
          ? _value.timezone
          : timezone // ignore: cast_nullable_to_non_nullable
              as String,
      meetingUrl: freezed == meetingUrl
          ? _value.meetingUrl
          : meetingUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      meetingPassword: freezed == meetingPassword
          ? _value.meetingPassword
          : meetingPassword // ignore: cast_nullable_to_non_nullable
              as String?,
      locationAddress: freezed == locationAddress
          ? _value.locationAddress
          : locationAddress // ignore: cast_nullable_to_non_nullable
              as String?,
      hourlyRate: null == hourlyRate
          ? _value.hourlyRate
          : hourlyRate // ignore: cast_nullable_to_non_nullable
              as double,
      totalAmount: null == totalAmount
          ? _value.totalAmount
          : totalAmount // ignore: cast_nullable_to_non_nullable
              as double,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      paymentStatus: null == paymentStatus
          ? _value.paymentStatus
          : paymentStatus // ignore: cast_nullable_to_non_nullable
              as PaymentStatus,
      paymentId: freezed == paymentId
          ? _value.paymentId
          : paymentId // ignore: cast_nullable_to_non_nullable
              as String?,
      coachNotes: freezed == coachNotes
          ? _value.coachNotes
          : coachNotes // ignore: cast_nullable_to_non_nullable
              as String?,
      clientNotes: freezed == clientNotes
          ? _value.clientNotes
          : clientNotes // ignore: cast_nullable_to_non_nullable
              as String?,
      sharedResources: null == sharedResources
          ? _value.sharedResources
          : sharedResources // ignore: cast_nullable_to_non_nullable
              as List<SharedResource>,
      clientRating: freezed == clientRating
          ? _value.clientRating
          : clientRating // ignore: cast_nullable_to_non_nullable
              as int?,
      clientFeedback: freezed == clientFeedback
          ? _value.clientFeedback
          : clientFeedback // ignore: cast_nullable_to_non_nullable
              as String?,
      coachRating: freezed == coachRating
          ? _value.coachRating
          : coachRating // ignore: cast_nullable_to_non_nullable
              as int?,
      coachFeedback: freezed == coachFeedback
          ? _value.coachFeedback
          : coachFeedback // ignore: cast_nullable_to_non_nullable
              as String?,
      cancellationReason: freezed == cancellationReason
          ? _value.cancellationReason
          : cancellationReason // ignore: cast_nullable_to_non_nullable
              as String?,
      cancelledBy: freezed == cancelledBy
          ? _value.cancelledBy
          : cancelledBy // ignore: cast_nullable_to_non_nullable
              as String?,
      cancelledAt: freezed == cancelledAt
          ? _value.cancelledAt
          : cancelledAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      coach: freezed == coach
          ? _value.coach
          : coach // ignore: cast_nullable_to_non_nullable
              as CoachProfile?,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $CoachProfileCopyWith<$Res>? get coach {
    if (_value.coach == null) {
      return null;
    }

    return $CoachProfileCopyWith<$Res>(_value.coach!, (value) {
      return _then(_value.copyWith(coach: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$CoachSessionImplCopyWith<$Res>
    implements $CoachSessionCopyWith<$Res> {
  factory _$$CoachSessionImplCopyWith(
          _$CoachSessionImpl value, $Res Function(_$CoachSessionImpl) then) =
      __$$CoachSessionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      int coachId,
      int clientId,
      String title,
      String? description,
      SessionType sessionType,
      SessionStatus status,
      DateTime scheduledAt,
      int durationMinutes,
      DateTime? actualStartTime,
      DateTime? actualEndTime,
      String timezone,
      String? meetingUrl,
      String? meetingPassword,
      String? locationAddress,
      double hourlyRate,
      double totalAmount,
      String currency,
      PaymentStatus paymentStatus,
      String? paymentId,
      String? coachNotes,
      String? clientNotes,
      List<SharedResource> sharedResources,
      int? clientRating,
      String? clientFeedback,
      int? coachRating,
      String? coachFeedback,
      String? cancellationReason,
      String? cancelledBy,
      DateTime? cancelledAt,
      DateTime? createdAt,
      DateTime? updatedAt,
      CoachProfile? coach});

  @override
  $CoachProfileCopyWith<$Res>? get coach;
}

/// @nodoc
class __$$CoachSessionImplCopyWithImpl<$Res>
    extends _$CoachSessionCopyWithImpl<$Res, _$CoachSessionImpl>
    implements _$$CoachSessionImplCopyWith<$Res> {
  __$$CoachSessionImplCopyWithImpl(
      _$CoachSessionImpl _value, $Res Function(_$CoachSessionImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? coachId = null,
    Object? clientId = null,
    Object? title = null,
    Object? description = freezed,
    Object? sessionType = null,
    Object? status = null,
    Object? scheduledAt = null,
    Object? durationMinutes = null,
    Object? actualStartTime = freezed,
    Object? actualEndTime = freezed,
    Object? timezone = null,
    Object? meetingUrl = freezed,
    Object? meetingPassword = freezed,
    Object? locationAddress = freezed,
    Object? hourlyRate = null,
    Object? totalAmount = null,
    Object? currency = null,
    Object? paymentStatus = null,
    Object? paymentId = freezed,
    Object? coachNotes = freezed,
    Object? clientNotes = freezed,
    Object? sharedResources = null,
    Object? clientRating = freezed,
    Object? clientFeedback = freezed,
    Object? coachRating = freezed,
    Object? coachFeedback = freezed,
    Object? cancellationReason = freezed,
    Object? cancelledBy = freezed,
    Object? cancelledAt = freezed,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? coach = freezed,
  }) {
    return _then(_$CoachSessionImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      coachId: null == coachId
          ? _value.coachId
          : coachId // ignore: cast_nullable_to_non_nullable
              as int,
      clientId: null == clientId
          ? _value.clientId
          : clientId // ignore: cast_nullable_to_non_nullable
              as int,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      sessionType: null == sessionType
          ? _value.sessionType
          : sessionType // ignore: cast_nullable_to_non_nullable
              as SessionType,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as SessionStatus,
      scheduledAt: null == scheduledAt
          ? _value.scheduledAt
          : scheduledAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      durationMinutes: null == durationMinutes
          ? _value.durationMinutes
          : durationMinutes // ignore: cast_nullable_to_non_nullable
              as int,
      actualStartTime: freezed == actualStartTime
          ? _value.actualStartTime
          : actualStartTime // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      actualEndTime: freezed == actualEndTime
          ? _value.actualEndTime
          : actualEndTime // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      timezone: null == timezone
          ? _value.timezone
          : timezone // ignore: cast_nullable_to_non_nullable
              as String,
      meetingUrl: freezed == meetingUrl
          ? _value.meetingUrl
          : meetingUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      meetingPassword: freezed == meetingPassword
          ? _value.meetingPassword
          : meetingPassword // ignore: cast_nullable_to_non_nullable
              as String?,
      locationAddress: freezed == locationAddress
          ? _value.locationAddress
          : locationAddress // ignore: cast_nullable_to_non_nullable
              as String?,
      hourlyRate: null == hourlyRate
          ? _value.hourlyRate
          : hourlyRate // ignore: cast_nullable_to_non_nullable
              as double,
      totalAmount: null == totalAmount
          ? _value.totalAmount
          : totalAmount // ignore: cast_nullable_to_non_nullable
              as double,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      paymentStatus: null == paymentStatus
          ? _value.paymentStatus
          : paymentStatus // ignore: cast_nullable_to_non_nullable
              as PaymentStatus,
      paymentId: freezed == paymentId
          ? _value.paymentId
          : paymentId // ignore: cast_nullable_to_non_nullable
              as String?,
      coachNotes: freezed == coachNotes
          ? _value.coachNotes
          : coachNotes // ignore: cast_nullable_to_non_nullable
              as String?,
      clientNotes: freezed == clientNotes
          ? _value.clientNotes
          : clientNotes // ignore: cast_nullable_to_non_nullable
              as String?,
      sharedResources: null == sharedResources
          ? _value._sharedResources
          : sharedResources // ignore: cast_nullable_to_non_nullable
              as List<SharedResource>,
      clientRating: freezed == clientRating
          ? _value.clientRating
          : clientRating // ignore: cast_nullable_to_non_nullable
              as int?,
      clientFeedback: freezed == clientFeedback
          ? _value.clientFeedback
          : clientFeedback // ignore: cast_nullable_to_non_nullable
              as String?,
      coachRating: freezed == coachRating
          ? _value.coachRating
          : coachRating // ignore: cast_nullable_to_non_nullable
              as int?,
      coachFeedback: freezed == coachFeedback
          ? _value.coachFeedback
          : coachFeedback // ignore: cast_nullable_to_non_nullable
              as String?,
      cancellationReason: freezed == cancellationReason
          ? _value.cancellationReason
          : cancellationReason // ignore: cast_nullable_to_non_nullable
              as String?,
      cancelledBy: freezed == cancelledBy
          ? _value.cancelledBy
          : cancelledBy // ignore: cast_nullable_to_non_nullable
              as String?,
      cancelledAt: freezed == cancelledAt
          ? _value.cancelledAt
          : cancelledAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      coach: freezed == coach
          ? _value.coach
          : coach // ignore: cast_nullable_to_non_nullable
              as CoachProfile?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CoachSessionImpl extends _CoachSession {
  const _$CoachSessionImpl(
      {required this.id,
      required this.coachId,
      required this.clientId,
      required this.title,
      this.description,
      required this.sessionType,
      this.status = SessionStatus.pending,
      required this.scheduledAt,
      required this.durationMinutes,
      this.actualStartTime,
      this.actualEndTime,
      required this.timezone,
      this.meetingUrl,
      this.meetingPassword,
      this.locationAddress,
      required this.hourlyRate,
      required this.totalAmount,
      this.currency = 'USD',
      this.paymentStatus = PaymentStatus.pending,
      this.paymentId,
      this.coachNotes,
      this.clientNotes,
      final List<SharedResource> sharedResources = const [],
      this.clientRating,
      this.clientFeedback,
      this.coachRating,
      this.coachFeedback,
      this.cancellationReason,
      this.cancelledBy,
      this.cancelledAt,
      this.createdAt,
      this.updatedAt,
      this.coach})
      : _sharedResources = sharedResources,
        super._();

  factory _$CoachSessionImpl.fromJson(Map<String, dynamic> json) =>
      _$$CoachSessionImplFromJson(json);

  @override
  final int id;
  @override
  final int coachId;
  @override
  final int clientId;
// Session Details
  @override
  final String title;
  @override
  final String? description;
  @override
  final SessionType sessionType;
  @override
  @JsonKey()
  final SessionStatus status;
// Timing
  @override
  final DateTime scheduledAt;
  @override
  final int durationMinutes;
  @override
  final DateTime? actualStartTime;
  @override
  final DateTime? actualEndTime;
  @override
  final String timezone;
// Meeting Details
  @override
  final String? meetingUrl;
  @override
  final String? meetingPassword;
  @override
  final String? locationAddress;
// Pricing
  @override
  final double hourlyRate;
  @override
  final double totalAmount;
  @override
  @JsonKey()
  final String currency;
  @override
  @JsonKey()
  final PaymentStatus paymentStatus;
  @override
  final String? paymentId;
// Notes & Resources
  @override
  final String? coachNotes;
  @override
  final String? clientNotes;
  final List<SharedResource> _sharedResources;
  @override
  @JsonKey()
  List<SharedResource> get sharedResources {
    if (_sharedResources is EqualUnmodifiableListView) return _sharedResources;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_sharedResources);
  }

// Feedback
  @override
  final int? clientRating;
  @override
  final String? clientFeedback;
  @override
  final int? coachRating;
  @override
  final String? coachFeedback;
// Cancellation
  @override
  final String? cancellationReason;
  @override
  final String? cancelledBy;
  @override
  final DateTime? cancelledAt;
// Timestamps
  @override
  final DateTime? createdAt;
  @override
  final DateTime? updatedAt;
// Related data
  @override
  final CoachProfile? coach;

  @override
  String toString() {
    return 'CoachSession(id: $id, coachId: $coachId, clientId: $clientId, title: $title, description: $description, sessionType: $sessionType, status: $status, scheduledAt: $scheduledAt, durationMinutes: $durationMinutes, actualStartTime: $actualStartTime, actualEndTime: $actualEndTime, timezone: $timezone, meetingUrl: $meetingUrl, meetingPassword: $meetingPassword, locationAddress: $locationAddress, hourlyRate: $hourlyRate, totalAmount: $totalAmount, currency: $currency, paymentStatus: $paymentStatus, paymentId: $paymentId, coachNotes: $coachNotes, clientNotes: $clientNotes, sharedResources: $sharedResources, clientRating: $clientRating, clientFeedback: $clientFeedback, coachRating: $coachRating, coachFeedback: $coachFeedback, cancellationReason: $cancellationReason, cancelledBy: $cancelledBy, cancelledAt: $cancelledAt, createdAt: $createdAt, updatedAt: $updatedAt, coach: $coach)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CoachSessionImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.coachId, coachId) || other.coachId == coachId) &&
            (identical(other.clientId, clientId) ||
                other.clientId == clientId) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.sessionType, sessionType) ||
                other.sessionType == sessionType) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.scheduledAt, scheduledAt) ||
                other.scheduledAt == scheduledAt) &&
            (identical(other.durationMinutes, durationMinutes) ||
                other.durationMinutes == durationMinutes) &&
            (identical(other.actualStartTime, actualStartTime) ||
                other.actualStartTime == actualStartTime) &&
            (identical(other.actualEndTime, actualEndTime) ||
                other.actualEndTime == actualEndTime) &&
            (identical(other.timezone, timezone) ||
                other.timezone == timezone) &&
            (identical(other.meetingUrl, meetingUrl) ||
                other.meetingUrl == meetingUrl) &&
            (identical(other.meetingPassword, meetingPassword) ||
                other.meetingPassword == meetingPassword) &&
            (identical(other.locationAddress, locationAddress) ||
                other.locationAddress == locationAddress) &&
            (identical(other.hourlyRate, hourlyRate) ||
                other.hourlyRate == hourlyRate) &&
            (identical(other.totalAmount, totalAmount) ||
                other.totalAmount == totalAmount) &&
            (identical(other.currency, currency) ||
                other.currency == currency) &&
            (identical(other.paymentStatus, paymentStatus) ||
                other.paymentStatus == paymentStatus) &&
            (identical(other.paymentId, paymentId) ||
                other.paymentId == paymentId) &&
            (identical(other.coachNotes, coachNotes) ||
                other.coachNotes == coachNotes) &&
            (identical(other.clientNotes, clientNotes) ||
                other.clientNotes == clientNotes) &&
            const DeepCollectionEquality()
                .equals(other._sharedResources, _sharedResources) &&
            (identical(other.clientRating, clientRating) ||
                other.clientRating == clientRating) &&
            (identical(other.clientFeedback, clientFeedback) ||
                other.clientFeedback == clientFeedback) &&
            (identical(other.coachRating, coachRating) ||
                other.coachRating == coachRating) &&
            (identical(other.coachFeedback, coachFeedback) ||
                other.coachFeedback == coachFeedback) &&
            (identical(other.cancellationReason, cancellationReason) ||
                other.cancellationReason == cancellationReason) &&
            (identical(other.cancelledBy, cancelledBy) ||
                other.cancelledBy == cancelledBy) &&
            (identical(other.cancelledAt, cancelledAt) ||
                other.cancelledAt == cancelledAt) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            (identical(other.coach, coach) || other.coach == coach));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hashAll([
        runtimeType,
        id,
        coachId,
        clientId,
        title,
        description,
        sessionType,
        status,
        scheduledAt,
        durationMinutes,
        actualStartTime,
        actualEndTime,
        timezone,
        meetingUrl,
        meetingPassword,
        locationAddress,
        hourlyRate,
        totalAmount,
        currency,
        paymentStatus,
        paymentId,
        coachNotes,
        clientNotes,
        const DeepCollectionEquality().hash(_sharedResources),
        clientRating,
        clientFeedback,
        coachRating,
        coachFeedback,
        cancellationReason,
        cancelledBy,
        cancelledAt,
        createdAt,
        updatedAt,
        coach
      ]);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CoachSessionImplCopyWith<_$CoachSessionImpl> get copyWith =>
      __$$CoachSessionImplCopyWithImpl<_$CoachSessionImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CoachSessionImplToJson(
      this,
    );
  }
}

abstract class _CoachSession extends CoachSession {
  const factory _CoachSession(
      {required final int id,
      required final int coachId,
      required final int clientId,
      required final String title,
      final String? description,
      required final SessionType sessionType,
      final SessionStatus status,
      required final DateTime scheduledAt,
      required final int durationMinutes,
      final DateTime? actualStartTime,
      final DateTime? actualEndTime,
      required final String timezone,
      final String? meetingUrl,
      final String? meetingPassword,
      final String? locationAddress,
      required final double hourlyRate,
      required final double totalAmount,
      final String currency,
      final PaymentStatus paymentStatus,
      final String? paymentId,
      final String? coachNotes,
      final String? clientNotes,
      final List<SharedResource> sharedResources,
      final int? clientRating,
      final String? clientFeedback,
      final int? coachRating,
      final String? coachFeedback,
      final String? cancellationReason,
      final String? cancelledBy,
      final DateTime? cancelledAt,
      final DateTime? createdAt,
      final DateTime? updatedAt,
      final CoachProfile? coach}) = _$CoachSessionImpl;
  const _CoachSession._() : super._();

  factory _CoachSession.fromJson(Map<String, dynamic> json) =
      _$CoachSessionImpl.fromJson;

  @override
  int get id;
  @override
  int get coachId;
  @override
  int get clientId;
  @override // Session Details
  String get title;
  @override
  String? get description;
  @override
  SessionType get sessionType;
  @override
  SessionStatus get status;
  @override // Timing
  DateTime get scheduledAt;
  @override
  int get durationMinutes;
  @override
  DateTime? get actualStartTime;
  @override
  DateTime? get actualEndTime;
  @override
  String get timezone;
  @override // Meeting Details
  String? get meetingUrl;
  @override
  String? get meetingPassword;
  @override
  String? get locationAddress;
  @override // Pricing
  double get hourlyRate;
  @override
  double get totalAmount;
  @override
  String get currency;
  @override
  PaymentStatus get paymentStatus;
  @override
  String? get paymentId;
  @override // Notes & Resources
  String? get coachNotes;
  @override
  String? get clientNotes;
  @override
  List<SharedResource> get sharedResources;
  @override // Feedback
  int? get clientRating;
  @override
  String? get clientFeedback;
  @override
  int? get coachRating;
  @override
  String? get coachFeedback;
  @override // Cancellation
  String? get cancellationReason;
  @override
  String? get cancelledBy;
  @override
  DateTime? get cancelledAt;
  @override // Timestamps
  DateTime? get createdAt;
  @override
  DateTime? get updatedAt;
  @override // Related data
  CoachProfile? get coach;
  @override
  @JsonKey(ignore: true)
  _$$CoachSessionImplCopyWith<_$CoachSessionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CoachPackage _$CoachPackageFromJson(Map<String, dynamic> json) {
  return _CoachPackage.fromJson(json);
}

/// @nodoc
mixin _$CoachPackage {
  int get id => throw _privateConstructorUsedError;
  int get coachId => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String? get description =>
      throw _privateConstructorUsedError; // Package Details
  int get sessionCount => throw _privateConstructorUsedError;
  int get validityDays => throw _privateConstructorUsedError;
  double get price => throw _privateConstructorUsedError;
  String get currency => throw _privateConstructorUsedError; // Savings
  double? get originalPrice => throw _privateConstructorUsedError;
  double? get discountPercentage =>
      throw _privateConstructorUsedError; // Limits
  int get maxPurchasesPerClient => throw _privateConstructorUsedError;
  int? get totalAvailable => throw _privateConstructorUsedError;
  int get totalSold => throw _privateConstructorUsedError;
  bool get isActive => throw _privateConstructorUsedError; // Timestamps
  DateTime? get createdAt => throw _privateConstructorUsedError;
  DateTime? get updatedAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CoachPackageCopyWith<CoachPackage> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CoachPackageCopyWith<$Res> {
  factory $CoachPackageCopyWith(
          CoachPackage value, $Res Function(CoachPackage) then) =
      _$CoachPackageCopyWithImpl<$Res, CoachPackage>;
  @useResult
  $Res call(
      {int id,
      int coachId,
      String name,
      String? description,
      int sessionCount,
      int validityDays,
      double price,
      String currency,
      double? originalPrice,
      double? discountPercentage,
      int maxPurchasesPerClient,
      int? totalAvailable,
      int totalSold,
      bool isActive,
      DateTime? createdAt,
      DateTime? updatedAt});
}

/// @nodoc
class _$CoachPackageCopyWithImpl<$Res, $Val extends CoachPackage>
    implements $CoachPackageCopyWith<$Res> {
  _$CoachPackageCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? coachId = null,
    Object? name = null,
    Object? description = freezed,
    Object? sessionCount = null,
    Object? validityDays = null,
    Object? price = null,
    Object? currency = null,
    Object? originalPrice = freezed,
    Object? discountPercentage = freezed,
    Object? maxPurchasesPerClient = null,
    Object? totalAvailable = freezed,
    Object? totalSold = null,
    Object? isActive = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      coachId: null == coachId
          ? _value.coachId
          : coachId // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      sessionCount: null == sessionCount
          ? _value.sessionCount
          : sessionCount // ignore: cast_nullable_to_non_nullable
              as int,
      validityDays: null == validityDays
          ? _value.validityDays
          : validityDays // ignore: cast_nullable_to_non_nullable
              as int,
      price: null == price
          ? _value.price
          : price // ignore: cast_nullable_to_non_nullable
              as double,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      originalPrice: freezed == originalPrice
          ? _value.originalPrice
          : originalPrice // ignore: cast_nullable_to_non_nullable
              as double?,
      discountPercentage: freezed == discountPercentage
          ? _value.discountPercentage
          : discountPercentage // ignore: cast_nullable_to_non_nullable
              as double?,
      maxPurchasesPerClient: null == maxPurchasesPerClient
          ? _value.maxPurchasesPerClient
          : maxPurchasesPerClient // ignore: cast_nullable_to_non_nullable
              as int,
      totalAvailable: freezed == totalAvailable
          ? _value.totalAvailable
          : totalAvailable // ignore: cast_nullable_to_non_nullable
              as int?,
      totalSold: null == totalSold
          ? _value.totalSold
          : totalSold // ignore: cast_nullable_to_non_nullable
              as int,
      isActive: null == isActive
          ? _value.isActive
          : isActive // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CoachPackageImplCopyWith<$Res>
    implements $CoachPackageCopyWith<$Res> {
  factory _$$CoachPackageImplCopyWith(
          _$CoachPackageImpl value, $Res Function(_$CoachPackageImpl) then) =
      __$$CoachPackageImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      int coachId,
      String name,
      String? description,
      int sessionCount,
      int validityDays,
      double price,
      String currency,
      double? originalPrice,
      double? discountPercentage,
      int maxPurchasesPerClient,
      int? totalAvailable,
      int totalSold,
      bool isActive,
      DateTime? createdAt,
      DateTime? updatedAt});
}

/// @nodoc
class __$$CoachPackageImplCopyWithImpl<$Res>
    extends _$CoachPackageCopyWithImpl<$Res, _$CoachPackageImpl>
    implements _$$CoachPackageImplCopyWith<$Res> {
  __$$CoachPackageImplCopyWithImpl(
      _$CoachPackageImpl _value, $Res Function(_$CoachPackageImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? coachId = null,
    Object? name = null,
    Object? description = freezed,
    Object? sessionCount = null,
    Object? validityDays = null,
    Object? price = null,
    Object? currency = null,
    Object? originalPrice = freezed,
    Object? discountPercentage = freezed,
    Object? maxPurchasesPerClient = null,
    Object? totalAvailable = freezed,
    Object? totalSold = null,
    Object? isActive = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(_$CoachPackageImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      coachId: null == coachId
          ? _value.coachId
          : coachId // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      sessionCount: null == sessionCount
          ? _value.sessionCount
          : sessionCount // ignore: cast_nullable_to_non_nullable
              as int,
      validityDays: null == validityDays
          ? _value.validityDays
          : validityDays // ignore: cast_nullable_to_non_nullable
              as int,
      price: null == price
          ? _value.price
          : price // ignore: cast_nullable_to_non_nullable
              as double,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      originalPrice: freezed == originalPrice
          ? _value.originalPrice
          : originalPrice // ignore: cast_nullable_to_non_nullable
              as double?,
      discountPercentage: freezed == discountPercentage
          ? _value.discountPercentage
          : discountPercentage // ignore: cast_nullable_to_non_nullable
              as double?,
      maxPurchasesPerClient: null == maxPurchasesPerClient
          ? _value.maxPurchasesPerClient
          : maxPurchasesPerClient // ignore: cast_nullable_to_non_nullable
              as int,
      totalAvailable: freezed == totalAvailable
          ? _value.totalAvailable
          : totalAvailable // ignore: cast_nullable_to_non_nullable
              as int?,
      totalSold: null == totalSold
          ? _value.totalSold
          : totalSold // ignore: cast_nullable_to_non_nullable
              as int,
      isActive: null == isActive
          ? _value.isActive
          : isActive // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CoachPackageImpl extends _CoachPackage {
  const _$CoachPackageImpl(
      {required this.id,
      required this.coachId,
      required this.name,
      this.description,
      required this.sessionCount,
      required this.validityDays,
      required this.price,
      this.currency = 'USD',
      this.originalPrice,
      this.discountPercentage,
      this.maxPurchasesPerClient = 1,
      this.totalAvailable,
      this.totalSold = 0,
      this.isActive = true,
      this.createdAt,
      this.updatedAt})
      : super._();

  factory _$CoachPackageImpl.fromJson(Map<String, dynamic> json) =>
      _$$CoachPackageImplFromJson(json);

  @override
  final int id;
  @override
  final int coachId;
  @override
  final String name;
  @override
  final String? description;
// Package Details
  @override
  final int sessionCount;
  @override
  final int validityDays;
  @override
  final double price;
  @override
  @JsonKey()
  final String currency;
// Savings
  @override
  final double? originalPrice;
  @override
  final double? discountPercentage;
// Limits
  @override
  @JsonKey()
  final int maxPurchasesPerClient;
  @override
  final int? totalAvailable;
  @override
  @JsonKey()
  final int totalSold;
  @override
  @JsonKey()
  final bool isActive;
// Timestamps
  @override
  final DateTime? createdAt;
  @override
  final DateTime? updatedAt;

  @override
  String toString() {
    return 'CoachPackage(id: $id, coachId: $coachId, name: $name, description: $description, sessionCount: $sessionCount, validityDays: $validityDays, price: $price, currency: $currency, originalPrice: $originalPrice, discountPercentage: $discountPercentage, maxPurchasesPerClient: $maxPurchasesPerClient, totalAvailable: $totalAvailable, totalSold: $totalSold, isActive: $isActive, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CoachPackageImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.coachId, coachId) || other.coachId == coachId) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.sessionCount, sessionCount) ||
                other.sessionCount == sessionCount) &&
            (identical(other.validityDays, validityDays) ||
                other.validityDays == validityDays) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.currency, currency) ||
                other.currency == currency) &&
            (identical(other.originalPrice, originalPrice) ||
                other.originalPrice == originalPrice) &&
            (identical(other.discountPercentage, discountPercentage) ||
                other.discountPercentage == discountPercentage) &&
            (identical(other.maxPurchasesPerClient, maxPurchasesPerClient) ||
                other.maxPurchasesPerClient == maxPurchasesPerClient) &&
            (identical(other.totalAvailable, totalAvailable) ||
                other.totalAvailable == totalAvailable) &&
            (identical(other.totalSold, totalSold) ||
                other.totalSold == totalSold) &&
            (identical(other.isActive, isActive) ||
                other.isActive == isActive) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      coachId,
      name,
      description,
      sessionCount,
      validityDays,
      price,
      currency,
      originalPrice,
      discountPercentage,
      maxPurchasesPerClient,
      totalAvailable,
      totalSold,
      isActive,
      createdAt,
      updatedAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CoachPackageImplCopyWith<_$CoachPackageImpl> get copyWith =>
      __$$CoachPackageImplCopyWithImpl<_$CoachPackageImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CoachPackageImplToJson(
      this,
    );
  }
}

abstract class _CoachPackage extends CoachPackage {
  const factory _CoachPackage(
      {required final int id,
      required final int coachId,
      required final String name,
      final String? description,
      required final int sessionCount,
      required final int validityDays,
      required final double price,
      final String currency,
      final double? originalPrice,
      final double? discountPercentage,
      final int maxPurchasesPerClient,
      final int? totalAvailable,
      final int totalSold,
      final bool isActive,
      final DateTime? createdAt,
      final DateTime? updatedAt}) = _$CoachPackageImpl;
  const _CoachPackage._() : super._();

  factory _CoachPackage.fromJson(Map<String, dynamic> json) =
      _$CoachPackageImpl.fromJson;

  @override
  int get id;
  @override
  int get coachId;
  @override
  String get name;
  @override
  String? get description;
  @override // Package Details
  int get sessionCount;
  @override
  int get validityDays;
  @override
  double get price;
  @override
  String get currency;
  @override // Savings
  double? get originalPrice;
  @override
  double? get discountPercentage;
  @override // Limits
  int get maxPurchasesPerClient;
  @override
  int? get totalAvailable;
  @override
  int get totalSold;
  @override
  bool get isActive;
  @override // Timestamps
  DateTime? get createdAt;
  @override
  DateTime? get updatedAt;
  @override
  @JsonKey(ignore: true)
  _$$CoachPackageImplCopyWith<_$CoachPackageImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ClientCoachPackage _$ClientCoachPackageFromJson(Map<String, dynamic> json) {
  return _ClientCoachPackage.fromJson(json);
}

/// @nodoc
mixin _$ClientCoachPackage {
  int get id => throw _privateConstructorUsedError;
  int get packageId => throw _privateConstructorUsedError;
  int get clientId => throw _privateConstructorUsedError;
  DateTime get purchaseDate => throw _privateConstructorUsedError;
  DateTime get expiryDate => throw _privateConstructorUsedError;
  int get sessionsUsed => throw _privateConstructorUsedError;
  int get sessionsRemaining => throw _privateConstructorUsedError;
  String? get paymentId => throw _privateConstructorUsedError;
  double get amountPaid => throw _privateConstructorUsedError;
  PackageStatus get status =>
      throw _privateConstructorUsedError; // Related data
  CoachPackage? get package => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ClientCoachPackageCopyWith<ClientCoachPackage> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ClientCoachPackageCopyWith<$Res> {
  factory $ClientCoachPackageCopyWith(
          ClientCoachPackage value, $Res Function(ClientCoachPackage) then) =
      _$ClientCoachPackageCopyWithImpl<$Res, ClientCoachPackage>;
  @useResult
  $Res call(
      {int id,
      int packageId,
      int clientId,
      DateTime purchaseDate,
      DateTime expiryDate,
      int sessionsUsed,
      int sessionsRemaining,
      String? paymentId,
      double amountPaid,
      PackageStatus status,
      CoachPackage? package});

  $CoachPackageCopyWith<$Res>? get package;
}

/// @nodoc
class _$ClientCoachPackageCopyWithImpl<$Res, $Val extends ClientCoachPackage>
    implements $ClientCoachPackageCopyWith<$Res> {
  _$ClientCoachPackageCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? packageId = null,
    Object? clientId = null,
    Object? purchaseDate = null,
    Object? expiryDate = null,
    Object? sessionsUsed = null,
    Object? sessionsRemaining = null,
    Object? paymentId = freezed,
    Object? amountPaid = null,
    Object? status = null,
    Object? package = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      packageId: null == packageId
          ? _value.packageId
          : packageId // ignore: cast_nullable_to_non_nullable
              as int,
      clientId: null == clientId
          ? _value.clientId
          : clientId // ignore: cast_nullable_to_non_nullable
              as int,
      purchaseDate: null == purchaseDate
          ? _value.purchaseDate
          : purchaseDate // ignore: cast_nullable_to_non_nullable
              as DateTime,
      expiryDate: null == expiryDate
          ? _value.expiryDate
          : expiryDate // ignore: cast_nullable_to_non_nullable
              as DateTime,
      sessionsUsed: null == sessionsUsed
          ? _value.sessionsUsed
          : sessionsUsed // ignore: cast_nullable_to_non_nullable
              as int,
      sessionsRemaining: null == sessionsRemaining
          ? _value.sessionsRemaining
          : sessionsRemaining // ignore: cast_nullable_to_non_nullable
              as int,
      paymentId: freezed == paymentId
          ? _value.paymentId
          : paymentId // ignore: cast_nullable_to_non_nullable
              as String?,
      amountPaid: null == amountPaid
          ? _value.amountPaid
          : amountPaid // ignore: cast_nullable_to_non_nullable
              as double,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as PackageStatus,
      package: freezed == package
          ? _value.package
          : package // ignore: cast_nullable_to_non_nullable
              as CoachPackage?,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $CoachPackageCopyWith<$Res>? get package {
    if (_value.package == null) {
      return null;
    }

    return $CoachPackageCopyWith<$Res>(_value.package!, (value) {
      return _then(_value.copyWith(package: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$ClientCoachPackageImplCopyWith<$Res>
    implements $ClientCoachPackageCopyWith<$Res> {
  factory _$$ClientCoachPackageImplCopyWith(_$ClientCoachPackageImpl value,
          $Res Function(_$ClientCoachPackageImpl) then) =
      __$$ClientCoachPackageImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      int packageId,
      int clientId,
      DateTime purchaseDate,
      DateTime expiryDate,
      int sessionsUsed,
      int sessionsRemaining,
      String? paymentId,
      double amountPaid,
      PackageStatus status,
      CoachPackage? package});

  @override
  $CoachPackageCopyWith<$Res>? get package;
}

/// @nodoc
class __$$ClientCoachPackageImplCopyWithImpl<$Res>
    extends _$ClientCoachPackageCopyWithImpl<$Res, _$ClientCoachPackageImpl>
    implements _$$ClientCoachPackageImplCopyWith<$Res> {
  __$$ClientCoachPackageImplCopyWithImpl(_$ClientCoachPackageImpl _value,
      $Res Function(_$ClientCoachPackageImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? packageId = null,
    Object? clientId = null,
    Object? purchaseDate = null,
    Object? expiryDate = null,
    Object? sessionsUsed = null,
    Object? sessionsRemaining = null,
    Object? paymentId = freezed,
    Object? amountPaid = null,
    Object? status = null,
    Object? package = freezed,
  }) {
    return _then(_$ClientCoachPackageImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      packageId: null == packageId
          ? _value.packageId
          : packageId // ignore: cast_nullable_to_non_nullable
              as int,
      clientId: null == clientId
          ? _value.clientId
          : clientId // ignore: cast_nullable_to_non_nullable
              as int,
      purchaseDate: null == purchaseDate
          ? _value.purchaseDate
          : purchaseDate // ignore: cast_nullable_to_non_nullable
              as DateTime,
      expiryDate: null == expiryDate
          ? _value.expiryDate
          : expiryDate // ignore: cast_nullable_to_non_nullable
              as DateTime,
      sessionsUsed: null == sessionsUsed
          ? _value.sessionsUsed
          : sessionsUsed // ignore: cast_nullable_to_non_nullable
              as int,
      sessionsRemaining: null == sessionsRemaining
          ? _value.sessionsRemaining
          : sessionsRemaining // ignore: cast_nullable_to_non_nullable
              as int,
      paymentId: freezed == paymentId
          ? _value.paymentId
          : paymentId // ignore: cast_nullable_to_non_nullable
              as String?,
      amountPaid: null == amountPaid
          ? _value.amountPaid
          : amountPaid // ignore: cast_nullable_to_non_nullable
              as double,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as PackageStatus,
      package: freezed == package
          ? _value.package
          : package // ignore: cast_nullable_to_non_nullable
              as CoachPackage?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ClientCoachPackageImpl extends _ClientCoachPackage {
  const _$ClientCoachPackageImpl(
      {required this.id,
      required this.packageId,
      required this.clientId,
      required this.purchaseDate,
      required this.expiryDate,
      this.sessionsUsed = 0,
      required this.sessionsRemaining,
      this.paymentId,
      required this.amountPaid,
      this.status = PackageStatus.active,
      this.package})
      : super._();

  factory _$ClientCoachPackageImpl.fromJson(Map<String, dynamic> json) =>
      _$$ClientCoachPackageImplFromJson(json);

  @override
  final int id;
  @override
  final int packageId;
  @override
  final int clientId;
  @override
  final DateTime purchaseDate;
  @override
  final DateTime expiryDate;
  @override
  @JsonKey()
  final int sessionsUsed;
  @override
  final int sessionsRemaining;
  @override
  final String? paymentId;
  @override
  final double amountPaid;
  @override
  @JsonKey()
  final PackageStatus status;
// Related data
  @override
  final CoachPackage? package;

  @override
  String toString() {
    return 'ClientCoachPackage(id: $id, packageId: $packageId, clientId: $clientId, purchaseDate: $purchaseDate, expiryDate: $expiryDate, sessionsUsed: $sessionsUsed, sessionsRemaining: $sessionsRemaining, paymentId: $paymentId, amountPaid: $amountPaid, status: $status, package: $package)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ClientCoachPackageImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.packageId, packageId) ||
                other.packageId == packageId) &&
            (identical(other.clientId, clientId) ||
                other.clientId == clientId) &&
            (identical(other.purchaseDate, purchaseDate) ||
                other.purchaseDate == purchaseDate) &&
            (identical(other.expiryDate, expiryDate) ||
                other.expiryDate == expiryDate) &&
            (identical(other.sessionsUsed, sessionsUsed) ||
                other.sessionsUsed == sessionsUsed) &&
            (identical(other.sessionsRemaining, sessionsRemaining) ||
                other.sessionsRemaining == sessionsRemaining) &&
            (identical(other.paymentId, paymentId) ||
                other.paymentId == paymentId) &&
            (identical(other.amountPaid, amountPaid) ||
                other.amountPaid == amountPaid) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.package, package) || other.package == package));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      packageId,
      clientId,
      purchaseDate,
      expiryDate,
      sessionsUsed,
      sessionsRemaining,
      paymentId,
      amountPaid,
      status,
      package);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ClientCoachPackageImplCopyWith<_$ClientCoachPackageImpl> get copyWith =>
      __$$ClientCoachPackageImplCopyWithImpl<_$ClientCoachPackageImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ClientCoachPackageImplToJson(
      this,
    );
  }
}

abstract class _ClientCoachPackage extends ClientCoachPackage {
  const factory _ClientCoachPackage(
      {required final int id,
      required final int packageId,
      required final int clientId,
      required final DateTime purchaseDate,
      required final DateTime expiryDate,
      final int sessionsUsed,
      required final int sessionsRemaining,
      final String? paymentId,
      required final double amountPaid,
      final PackageStatus status,
      final CoachPackage? package}) = _$ClientCoachPackageImpl;
  const _ClientCoachPackage._() : super._();

  factory _ClientCoachPackage.fromJson(Map<String, dynamic> json) =
      _$ClientCoachPackageImpl.fromJson;

  @override
  int get id;
  @override
  int get packageId;
  @override
  int get clientId;
  @override
  DateTime get purchaseDate;
  @override
  DateTime get expiryDate;
  @override
  int get sessionsUsed;
  @override
  int get sessionsRemaining;
  @override
  String? get paymentId;
  @override
  double get amountPaid;
  @override
  PackageStatus get status;
  @override // Related data
  CoachPackage? get package;
  @override
  @JsonKey(ignore: true)
  _$$ClientCoachPackageImplCopyWith<_$ClientCoachPackageImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CoachReview _$CoachReviewFromJson(Map<String, dynamic> json) {
  return _CoachReview.fromJson(json);
}

/// @nodoc
mixin _$CoachReview {
  int get id => throw _privateConstructorUsedError;
  int get coachId => throw _privateConstructorUsedError;
  int get clientId => throw _privateConstructorUsedError;
  int? get sessionId => throw _privateConstructorUsedError; // Ratings
  int get rating => throw _privateConstructorUsedError;
  String? get title => throw _privateConstructorUsedError;
  String get comment => throw _privateConstructorUsedError; // Detailed Ratings
  int? get communicationRating => throw _privateConstructorUsedError;
  int? get knowledgeRating => throw _privateConstructorUsedError;
  int? get helpfulnessRating =>
      throw _privateConstructorUsedError; // Status Flags
  bool get isVerified => throw _privateConstructorUsedError;
  bool get isFeatured => throw _privateConstructorUsedError;
  bool get isVisible => throw _privateConstructorUsedError; // Coach Response
  String? get coachResponse => throw _privateConstructorUsedError;
  DateTime? get coachResponseAt =>
      throw _privateConstructorUsedError; // Engagement Metrics
  int get helpfulCount => throw _privateConstructorUsedError;
  int get unhelpfulCount => throw _privateConstructorUsedError; // Timestamps
  DateTime? get createdAt => throw _privateConstructorUsedError;
  DateTime? get updatedAt => throw _privateConstructorUsedError; // Related data
  String? get clientName => throw _privateConstructorUsedError;
  String? get clientProfileImageUrl => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CoachReviewCopyWith<CoachReview> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CoachReviewCopyWith<$Res> {
  factory $CoachReviewCopyWith(
          CoachReview value, $Res Function(CoachReview) then) =
      _$CoachReviewCopyWithImpl<$Res, CoachReview>;
  @useResult
  $Res call(
      {int id,
      int coachId,
      int clientId,
      int? sessionId,
      int rating,
      String? title,
      String comment,
      int? communicationRating,
      int? knowledgeRating,
      int? helpfulnessRating,
      bool isVerified,
      bool isFeatured,
      bool isVisible,
      String? coachResponse,
      DateTime? coachResponseAt,
      int helpfulCount,
      int unhelpfulCount,
      DateTime? createdAt,
      DateTime? updatedAt,
      String? clientName,
      String? clientProfileImageUrl});
}

/// @nodoc
class _$CoachReviewCopyWithImpl<$Res, $Val extends CoachReview>
    implements $CoachReviewCopyWith<$Res> {
  _$CoachReviewCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? coachId = null,
    Object? clientId = null,
    Object? sessionId = freezed,
    Object? rating = null,
    Object? title = freezed,
    Object? comment = null,
    Object? communicationRating = freezed,
    Object? knowledgeRating = freezed,
    Object? helpfulnessRating = freezed,
    Object? isVerified = null,
    Object? isFeatured = null,
    Object? isVisible = null,
    Object? coachResponse = freezed,
    Object? coachResponseAt = freezed,
    Object? helpfulCount = null,
    Object? unhelpfulCount = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? clientName = freezed,
    Object? clientProfileImageUrl = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      coachId: null == coachId
          ? _value.coachId
          : coachId // ignore: cast_nullable_to_non_nullable
              as int,
      clientId: null == clientId
          ? _value.clientId
          : clientId // ignore: cast_nullable_to_non_nullable
              as int,
      sessionId: freezed == sessionId
          ? _value.sessionId
          : sessionId // ignore: cast_nullable_to_non_nullable
              as int?,
      rating: null == rating
          ? _value.rating
          : rating // ignore: cast_nullable_to_non_nullable
              as int,
      title: freezed == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String?,
      comment: null == comment
          ? _value.comment
          : comment // ignore: cast_nullable_to_non_nullable
              as String,
      communicationRating: freezed == communicationRating
          ? _value.communicationRating
          : communicationRating // ignore: cast_nullable_to_non_nullable
              as int?,
      knowledgeRating: freezed == knowledgeRating
          ? _value.knowledgeRating
          : knowledgeRating // ignore: cast_nullable_to_non_nullable
              as int?,
      helpfulnessRating: freezed == helpfulnessRating
          ? _value.helpfulnessRating
          : helpfulnessRating // ignore: cast_nullable_to_non_nullable
              as int?,
      isVerified: null == isVerified
          ? _value.isVerified
          : isVerified // ignore: cast_nullable_to_non_nullable
              as bool,
      isFeatured: null == isFeatured
          ? _value.isFeatured
          : isFeatured // ignore: cast_nullable_to_non_nullable
              as bool,
      isVisible: null == isVisible
          ? _value.isVisible
          : isVisible // ignore: cast_nullable_to_non_nullable
              as bool,
      coachResponse: freezed == coachResponse
          ? _value.coachResponse
          : coachResponse // ignore: cast_nullable_to_non_nullable
              as String?,
      coachResponseAt: freezed == coachResponseAt
          ? _value.coachResponseAt
          : coachResponseAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      helpfulCount: null == helpfulCount
          ? _value.helpfulCount
          : helpfulCount // ignore: cast_nullable_to_non_nullable
              as int,
      unhelpfulCount: null == unhelpfulCount
          ? _value.unhelpfulCount
          : unhelpfulCount // ignore: cast_nullable_to_non_nullable
              as int,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      clientName: freezed == clientName
          ? _value.clientName
          : clientName // ignore: cast_nullable_to_non_nullable
              as String?,
      clientProfileImageUrl: freezed == clientProfileImageUrl
          ? _value.clientProfileImageUrl
          : clientProfileImageUrl // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CoachReviewImplCopyWith<$Res>
    implements $CoachReviewCopyWith<$Res> {
  factory _$$CoachReviewImplCopyWith(
          _$CoachReviewImpl value, $Res Function(_$CoachReviewImpl) then) =
      __$$CoachReviewImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      int coachId,
      int clientId,
      int? sessionId,
      int rating,
      String? title,
      String comment,
      int? communicationRating,
      int? knowledgeRating,
      int? helpfulnessRating,
      bool isVerified,
      bool isFeatured,
      bool isVisible,
      String? coachResponse,
      DateTime? coachResponseAt,
      int helpfulCount,
      int unhelpfulCount,
      DateTime? createdAt,
      DateTime? updatedAt,
      String? clientName,
      String? clientProfileImageUrl});
}

/// @nodoc
class __$$CoachReviewImplCopyWithImpl<$Res>
    extends _$CoachReviewCopyWithImpl<$Res, _$CoachReviewImpl>
    implements _$$CoachReviewImplCopyWith<$Res> {
  __$$CoachReviewImplCopyWithImpl(
      _$CoachReviewImpl _value, $Res Function(_$CoachReviewImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? coachId = null,
    Object? clientId = null,
    Object? sessionId = freezed,
    Object? rating = null,
    Object? title = freezed,
    Object? comment = null,
    Object? communicationRating = freezed,
    Object? knowledgeRating = freezed,
    Object? helpfulnessRating = freezed,
    Object? isVerified = null,
    Object? isFeatured = null,
    Object? isVisible = null,
    Object? coachResponse = freezed,
    Object? coachResponseAt = freezed,
    Object? helpfulCount = null,
    Object? unhelpfulCount = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? clientName = freezed,
    Object? clientProfileImageUrl = freezed,
  }) {
    return _then(_$CoachReviewImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      coachId: null == coachId
          ? _value.coachId
          : coachId // ignore: cast_nullable_to_non_nullable
              as int,
      clientId: null == clientId
          ? _value.clientId
          : clientId // ignore: cast_nullable_to_non_nullable
              as int,
      sessionId: freezed == sessionId
          ? _value.sessionId
          : sessionId // ignore: cast_nullable_to_non_nullable
              as int?,
      rating: null == rating
          ? _value.rating
          : rating // ignore: cast_nullable_to_non_nullable
              as int,
      title: freezed == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String?,
      comment: null == comment
          ? _value.comment
          : comment // ignore: cast_nullable_to_non_nullable
              as String,
      communicationRating: freezed == communicationRating
          ? _value.communicationRating
          : communicationRating // ignore: cast_nullable_to_non_nullable
              as int?,
      knowledgeRating: freezed == knowledgeRating
          ? _value.knowledgeRating
          : knowledgeRating // ignore: cast_nullable_to_non_nullable
              as int?,
      helpfulnessRating: freezed == helpfulnessRating
          ? _value.helpfulnessRating
          : helpfulnessRating // ignore: cast_nullable_to_non_nullable
              as int?,
      isVerified: null == isVerified
          ? _value.isVerified
          : isVerified // ignore: cast_nullable_to_non_nullable
              as bool,
      isFeatured: null == isFeatured
          ? _value.isFeatured
          : isFeatured // ignore: cast_nullable_to_non_nullable
              as bool,
      isVisible: null == isVisible
          ? _value.isVisible
          : isVisible // ignore: cast_nullable_to_non_nullable
              as bool,
      coachResponse: freezed == coachResponse
          ? _value.coachResponse
          : coachResponse // ignore: cast_nullable_to_non_nullable
              as String?,
      coachResponseAt: freezed == coachResponseAt
          ? _value.coachResponseAt
          : coachResponseAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      helpfulCount: null == helpfulCount
          ? _value.helpfulCount
          : helpfulCount // ignore: cast_nullable_to_non_nullable
              as int,
      unhelpfulCount: null == unhelpfulCount
          ? _value.unhelpfulCount
          : unhelpfulCount // ignore: cast_nullable_to_non_nullable
              as int,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      clientName: freezed == clientName
          ? _value.clientName
          : clientName // ignore: cast_nullable_to_non_nullable
              as String?,
      clientProfileImageUrl: freezed == clientProfileImageUrl
          ? _value.clientProfileImageUrl
          : clientProfileImageUrl // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CoachReviewImpl extends _CoachReview {
  const _$CoachReviewImpl(
      {required this.id,
      required this.coachId,
      required this.clientId,
      this.sessionId,
      required this.rating,
      this.title,
      required this.comment,
      this.communicationRating,
      this.knowledgeRating,
      this.helpfulnessRating,
      this.isVerified = false,
      this.isFeatured = false,
      this.isVisible = true,
      this.coachResponse,
      this.coachResponseAt,
      this.helpfulCount = 0,
      this.unhelpfulCount = 0,
      this.createdAt,
      this.updatedAt,
      this.clientName,
      this.clientProfileImageUrl})
      : super._();

  factory _$CoachReviewImpl.fromJson(Map<String, dynamic> json) =>
      _$$CoachReviewImplFromJson(json);

  @override
  final int id;
  @override
  final int coachId;
  @override
  final int clientId;
  @override
  final int? sessionId;
// Ratings
  @override
  final int rating;
  @override
  final String? title;
  @override
  final String comment;
// Detailed Ratings
  @override
  final int? communicationRating;
  @override
  final int? knowledgeRating;
  @override
  final int? helpfulnessRating;
// Status Flags
  @override
  @JsonKey()
  final bool isVerified;
  @override
  @JsonKey()
  final bool isFeatured;
  @override
  @JsonKey()
  final bool isVisible;
// Coach Response
  @override
  final String? coachResponse;
  @override
  final DateTime? coachResponseAt;
// Engagement Metrics
  @override
  @JsonKey()
  final int helpfulCount;
  @override
  @JsonKey()
  final int unhelpfulCount;
// Timestamps
  @override
  final DateTime? createdAt;
  @override
  final DateTime? updatedAt;
// Related data
  @override
  final String? clientName;
  @override
  final String? clientProfileImageUrl;

  @override
  String toString() {
    return 'CoachReview(id: $id, coachId: $coachId, clientId: $clientId, sessionId: $sessionId, rating: $rating, title: $title, comment: $comment, communicationRating: $communicationRating, knowledgeRating: $knowledgeRating, helpfulnessRating: $helpfulnessRating, isVerified: $isVerified, isFeatured: $isFeatured, isVisible: $isVisible, coachResponse: $coachResponse, coachResponseAt: $coachResponseAt, helpfulCount: $helpfulCount, unhelpfulCount: $unhelpfulCount, createdAt: $createdAt, updatedAt: $updatedAt, clientName: $clientName, clientProfileImageUrl: $clientProfileImageUrl)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CoachReviewImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.coachId, coachId) || other.coachId == coachId) &&
            (identical(other.clientId, clientId) ||
                other.clientId == clientId) &&
            (identical(other.sessionId, sessionId) ||
                other.sessionId == sessionId) &&
            (identical(other.rating, rating) || other.rating == rating) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.comment, comment) || other.comment == comment) &&
            (identical(other.communicationRating, communicationRating) ||
                other.communicationRating == communicationRating) &&
            (identical(other.knowledgeRating, knowledgeRating) ||
                other.knowledgeRating == knowledgeRating) &&
            (identical(other.helpfulnessRating, helpfulnessRating) ||
                other.helpfulnessRating == helpfulnessRating) &&
            (identical(other.isVerified, isVerified) ||
                other.isVerified == isVerified) &&
            (identical(other.isFeatured, isFeatured) ||
                other.isFeatured == isFeatured) &&
            (identical(other.isVisible, isVisible) ||
                other.isVisible == isVisible) &&
            (identical(other.coachResponse, coachResponse) ||
                other.coachResponse == coachResponse) &&
            (identical(other.coachResponseAt, coachResponseAt) ||
                other.coachResponseAt == coachResponseAt) &&
            (identical(other.helpfulCount, helpfulCount) ||
                other.helpfulCount == helpfulCount) &&
            (identical(other.unhelpfulCount, unhelpfulCount) ||
                other.unhelpfulCount == unhelpfulCount) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            (identical(other.clientName, clientName) ||
                other.clientName == clientName) &&
            (identical(other.clientProfileImageUrl, clientProfileImageUrl) ||
                other.clientProfileImageUrl == clientProfileImageUrl));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hashAll([
        runtimeType,
        id,
        coachId,
        clientId,
        sessionId,
        rating,
        title,
        comment,
        communicationRating,
        knowledgeRating,
        helpfulnessRating,
        isVerified,
        isFeatured,
        isVisible,
        coachResponse,
        coachResponseAt,
        helpfulCount,
        unhelpfulCount,
        createdAt,
        updatedAt,
        clientName,
        clientProfileImageUrl
      ]);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CoachReviewImplCopyWith<_$CoachReviewImpl> get copyWith =>
      __$$CoachReviewImplCopyWithImpl<_$CoachReviewImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CoachReviewImplToJson(
      this,
    );
  }
}

abstract class _CoachReview extends CoachReview {
  const factory _CoachReview(
      {required final int id,
      required final int coachId,
      required final int clientId,
      final int? sessionId,
      required final int rating,
      final String? title,
      required final String comment,
      final int? communicationRating,
      final int? knowledgeRating,
      final int? helpfulnessRating,
      final bool isVerified,
      final bool isFeatured,
      final bool isVisible,
      final String? coachResponse,
      final DateTime? coachResponseAt,
      final int helpfulCount,
      final int unhelpfulCount,
      final DateTime? createdAt,
      final DateTime? updatedAt,
      final String? clientName,
      final String? clientProfileImageUrl}) = _$CoachReviewImpl;
  const _CoachReview._() : super._();

  factory _CoachReview.fromJson(Map<String, dynamic> json) =
      _$CoachReviewImpl.fromJson;

  @override
  int get id;
  @override
  int get coachId;
  @override
  int get clientId;
  @override
  int? get sessionId;
  @override // Ratings
  int get rating;
  @override
  String? get title;
  @override
  String get comment;
  @override // Detailed Ratings
  int? get communicationRating;
  @override
  int? get knowledgeRating;
  @override
  int? get helpfulnessRating;
  @override // Status Flags
  bool get isVerified;
  @override
  bool get isFeatured;
  @override
  bool get isVisible;
  @override // Coach Response
  String? get coachResponse;
  @override
  DateTime? get coachResponseAt;
  @override // Engagement Metrics
  int get helpfulCount;
  @override
  int get unhelpfulCount;
  @override // Timestamps
  DateTime? get createdAt;
  @override
  DateTime? get updatedAt;
  @override // Related data
  String? get clientName;
  @override
  String? get clientProfileImageUrl;
  @override
  @JsonKey(ignore: true)
  _$$CoachReviewImplCopyWith<_$CoachReviewImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ReviewStats _$ReviewStatsFromJson(Map<String, dynamic> json) {
  return _ReviewStats.fromJson(json);
}

/// @nodoc
mixin _$ReviewStats {
  int get totalReviews => throw _privateConstructorUsedError;
  double get averageRating => throw _privateConstructorUsedError;
  Map<String, int> get ratingDistribution => throw _privateConstructorUsedError;
  DetailedRatings? get detailedRatings => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ReviewStatsCopyWith<ReviewStats> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ReviewStatsCopyWith<$Res> {
  factory $ReviewStatsCopyWith(
          ReviewStats value, $Res Function(ReviewStats) then) =
      _$ReviewStatsCopyWithImpl<$Res, ReviewStats>;
  @useResult
  $Res call(
      {int totalReviews,
      double averageRating,
      Map<String, int> ratingDistribution,
      DetailedRatings? detailedRatings});

  $DetailedRatingsCopyWith<$Res>? get detailedRatings;
}

/// @nodoc
class _$ReviewStatsCopyWithImpl<$Res, $Val extends ReviewStats>
    implements $ReviewStatsCopyWith<$Res> {
  _$ReviewStatsCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? totalReviews = null,
    Object? averageRating = null,
    Object? ratingDistribution = null,
    Object? detailedRatings = freezed,
  }) {
    return _then(_value.copyWith(
      totalReviews: null == totalReviews
          ? _value.totalReviews
          : totalReviews // ignore: cast_nullable_to_non_nullable
              as int,
      averageRating: null == averageRating
          ? _value.averageRating
          : averageRating // ignore: cast_nullable_to_non_nullable
              as double,
      ratingDistribution: null == ratingDistribution
          ? _value.ratingDistribution
          : ratingDistribution // ignore: cast_nullable_to_non_nullable
              as Map<String, int>,
      detailedRatings: freezed == detailedRatings
          ? _value.detailedRatings
          : detailedRatings // ignore: cast_nullable_to_non_nullable
              as DetailedRatings?,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $DetailedRatingsCopyWith<$Res>? get detailedRatings {
    if (_value.detailedRatings == null) {
      return null;
    }

    return $DetailedRatingsCopyWith<$Res>(_value.detailedRatings!, (value) {
      return _then(_value.copyWith(detailedRatings: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$ReviewStatsImplCopyWith<$Res>
    implements $ReviewStatsCopyWith<$Res> {
  factory _$$ReviewStatsImplCopyWith(
          _$ReviewStatsImpl value, $Res Function(_$ReviewStatsImpl) then) =
      __$$ReviewStatsImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int totalReviews,
      double averageRating,
      Map<String, int> ratingDistribution,
      DetailedRatings? detailedRatings});

  @override
  $DetailedRatingsCopyWith<$Res>? get detailedRatings;
}

/// @nodoc
class __$$ReviewStatsImplCopyWithImpl<$Res>
    extends _$ReviewStatsCopyWithImpl<$Res, _$ReviewStatsImpl>
    implements _$$ReviewStatsImplCopyWith<$Res> {
  __$$ReviewStatsImplCopyWithImpl(
      _$ReviewStatsImpl _value, $Res Function(_$ReviewStatsImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? totalReviews = null,
    Object? averageRating = null,
    Object? ratingDistribution = null,
    Object? detailedRatings = freezed,
  }) {
    return _then(_$ReviewStatsImpl(
      totalReviews: null == totalReviews
          ? _value.totalReviews
          : totalReviews // ignore: cast_nullable_to_non_nullable
              as int,
      averageRating: null == averageRating
          ? _value.averageRating
          : averageRating // ignore: cast_nullable_to_non_nullable
              as double,
      ratingDistribution: null == ratingDistribution
          ? _value._ratingDistribution
          : ratingDistribution // ignore: cast_nullable_to_non_nullable
              as Map<String, int>,
      detailedRatings: freezed == detailedRatings
          ? _value.detailedRatings
          : detailedRatings // ignore: cast_nullable_to_non_nullable
              as DetailedRatings?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ReviewStatsImpl implements _ReviewStats {
  const _$ReviewStatsImpl(
      {this.totalReviews = 0,
      this.averageRating = 0.0,
      final Map<String, int> ratingDistribution = const {},
      this.detailedRatings})
      : _ratingDistribution = ratingDistribution;

  factory _$ReviewStatsImpl.fromJson(Map<String, dynamic> json) =>
      _$$ReviewStatsImplFromJson(json);

  @override
  @JsonKey()
  final int totalReviews;
  @override
  @JsonKey()
  final double averageRating;
  final Map<String, int> _ratingDistribution;
  @override
  @JsonKey()
  Map<String, int> get ratingDistribution {
    if (_ratingDistribution is EqualUnmodifiableMapView)
      return _ratingDistribution;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_ratingDistribution);
  }

  @override
  final DetailedRatings? detailedRatings;

  @override
  String toString() {
    return 'ReviewStats(totalReviews: $totalReviews, averageRating: $averageRating, ratingDistribution: $ratingDistribution, detailedRatings: $detailedRatings)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ReviewStatsImpl &&
            (identical(other.totalReviews, totalReviews) ||
                other.totalReviews == totalReviews) &&
            (identical(other.averageRating, averageRating) ||
                other.averageRating == averageRating) &&
            const DeepCollectionEquality()
                .equals(other._ratingDistribution, _ratingDistribution) &&
            (identical(other.detailedRatings, detailedRatings) ||
                other.detailedRatings == detailedRatings));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      totalReviews,
      averageRating,
      const DeepCollectionEquality().hash(_ratingDistribution),
      detailedRatings);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ReviewStatsImplCopyWith<_$ReviewStatsImpl> get copyWith =>
      __$$ReviewStatsImplCopyWithImpl<_$ReviewStatsImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ReviewStatsImplToJson(
      this,
    );
  }
}

abstract class _ReviewStats implements ReviewStats {
  const factory _ReviewStats(
      {final int totalReviews,
      final double averageRating,
      final Map<String, int> ratingDistribution,
      final DetailedRatings? detailedRatings}) = _$ReviewStatsImpl;

  factory _ReviewStats.fromJson(Map<String, dynamic> json) =
      _$ReviewStatsImpl.fromJson;

  @override
  int get totalReviews;
  @override
  double get averageRating;
  @override
  Map<String, int> get ratingDistribution;
  @override
  DetailedRatings? get detailedRatings;
  @override
  @JsonKey(ignore: true)
  _$$ReviewStatsImplCopyWith<_$ReviewStatsImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

DetailedRatings _$DetailedRatingsFromJson(Map<String, dynamic> json) {
  return _DetailedRatings.fromJson(json);
}

/// @nodoc
mixin _$DetailedRatings {
  double get communication => throw _privateConstructorUsedError;
  double get knowledge => throw _privateConstructorUsedError;
  double get helpfulness => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $DetailedRatingsCopyWith<DetailedRatings> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $DetailedRatingsCopyWith<$Res> {
  factory $DetailedRatingsCopyWith(
          DetailedRatings value, $Res Function(DetailedRatings) then) =
      _$DetailedRatingsCopyWithImpl<$Res, DetailedRatings>;
  @useResult
  $Res call({double communication, double knowledge, double helpfulness});
}

/// @nodoc
class _$DetailedRatingsCopyWithImpl<$Res, $Val extends DetailedRatings>
    implements $DetailedRatingsCopyWith<$Res> {
  _$DetailedRatingsCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? communication = null,
    Object? knowledge = null,
    Object? helpfulness = null,
  }) {
    return _then(_value.copyWith(
      communication: null == communication
          ? _value.communication
          : communication // ignore: cast_nullable_to_non_nullable
              as double,
      knowledge: null == knowledge
          ? _value.knowledge
          : knowledge // ignore: cast_nullable_to_non_nullable
              as double,
      helpfulness: null == helpfulness
          ? _value.helpfulness
          : helpfulness // ignore: cast_nullable_to_non_nullable
              as double,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$DetailedRatingsImplCopyWith<$Res>
    implements $DetailedRatingsCopyWith<$Res> {
  factory _$$DetailedRatingsImplCopyWith(_$DetailedRatingsImpl value,
          $Res Function(_$DetailedRatingsImpl) then) =
      __$$DetailedRatingsImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({double communication, double knowledge, double helpfulness});
}

/// @nodoc
class __$$DetailedRatingsImplCopyWithImpl<$Res>
    extends _$DetailedRatingsCopyWithImpl<$Res, _$DetailedRatingsImpl>
    implements _$$DetailedRatingsImplCopyWith<$Res> {
  __$$DetailedRatingsImplCopyWithImpl(
      _$DetailedRatingsImpl _value, $Res Function(_$DetailedRatingsImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? communication = null,
    Object? knowledge = null,
    Object? helpfulness = null,
  }) {
    return _then(_$DetailedRatingsImpl(
      communication: null == communication
          ? _value.communication
          : communication // ignore: cast_nullable_to_non_nullable
              as double,
      knowledge: null == knowledge
          ? _value.knowledge
          : knowledge // ignore: cast_nullable_to_non_nullable
              as double,
      helpfulness: null == helpfulness
          ? _value.helpfulness
          : helpfulness // ignore: cast_nullable_to_non_nullable
              as double,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$DetailedRatingsImpl implements _DetailedRatings {
  const _$DetailedRatingsImpl(
      {this.communication = 0.0, this.knowledge = 0.0, this.helpfulness = 0.0});

  factory _$DetailedRatingsImpl.fromJson(Map<String, dynamic> json) =>
      _$$DetailedRatingsImplFromJson(json);

  @override
  @JsonKey()
  final double communication;
  @override
  @JsonKey()
  final double knowledge;
  @override
  @JsonKey()
  final double helpfulness;

  @override
  String toString() {
    return 'DetailedRatings(communication: $communication, knowledge: $knowledge, helpfulness: $helpfulness)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DetailedRatingsImpl &&
            (identical(other.communication, communication) ||
                other.communication == communication) &&
            (identical(other.knowledge, knowledge) ||
                other.knowledge == knowledge) &&
            (identical(other.helpfulness, helpfulness) ||
                other.helpfulness == helpfulness));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode =>
      Object.hash(runtimeType, communication, knowledge, helpfulness);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$DetailedRatingsImplCopyWith<_$DetailedRatingsImpl> get copyWith =>
      __$$DetailedRatingsImplCopyWithImpl<_$DetailedRatingsImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$DetailedRatingsImplToJson(
      this,
    );
  }
}

abstract class _DetailedRatings implements DetailedRatings {
  const factory _DetailedRatings(
      {final double communication,
      final double knowledge,
      final double helpfulness}) = _$DetailedRatingsImpl;

  factory _DetailedRatings.fromJson(Map<String, dynamic> json) =
      _$DetailedRatingsImpl.fromJson;

  @override
  double get communication;
  @override
  double get knowledge;
  @override
  double get helpfulness;
  @override
  @JsonKey(ignore: true)
  _$$DetailedRatingsImplCopyWith<_$DetailedRatingsImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

TimeSlot _$TimeSlotFromJson(Map<String, dynamic> json) {
  return _TimeSlot.fromJson(json);
}

/// @nodoc
mixin _$TimeSlot {
  DateTime get startTime => throw _privateConstructorUsedError;
  DateTime get endTime => throw _privateConstructorUsedError;
  bool get isAvailable => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $TimeSlotCopyWith<TimeSlot> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TimeSlotCopyWith<$Res> {
  factory $TimeSlotCopyWith(TimeSlot value, $Res Function(TimeSlot) then) =
      _$TimeSlotCopyWithImpl<$Res, TimeSlot>;
  @useResult
  $Res call({DateTime startTime, DateTime endTime, bool isAvailable});
}

/// @nodoc
class _$TimeSlotCopyWithImpl<$Res, $Val extends TimeSlot>
    implements $TimeSlotCopyWith<$Res> {
  _$TimeSlotCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? startTime = null,
    Object? endTime = null,
    Object? isAvailable = null,
  }) {
    return _then(_value.copyWith(
      startTime: null == startTime
          ? _value.startTime
          : startTime // ignore: cast_nullable_to_non_nullable
              as DateTime,
      endTime: null == endTime
          ? _value.endTime
          : endTime // ignore: cast_nullable_to_non_nullable
              as DateTime,
      isAvailable: null == isAvailable
          ? _value.isAvailable
          : isAvailable // ignore: cast_nullable_to_non_nullable
              as bool,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$TimeSlotImplCopyWith<$Res>
    implements $TimeSlotCopyWith<$Res> {
  factory _$$TimeSlotImplCopyWith(
          _$TimeSlotImpl value, $Res Function(_$TimeSlotImpl) then) =
      __$$TimeSlotImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({DateTime startTime, DateTime endTime, bool isAvailable});
}

/// @nodoc
class __$$TimeSlotImplCopyWithImpl<$Res>
    extends _$TimeSlotCopyWithImpl<$Res, _$TimeSlotImpl>
    implements _$$TimeSlotImplCopyWith<$Res> {
  __$$TimeSlotImplCopyWithImpl(
      _$TimeSlotImpl _value, $Res Function(_$TimeSlotImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? startTime = null,
    Object? endTime = null,
    Object? isAvailable = null,
  }) {
    return _then(_$TimeSlotImpl(
      startTime: null == startTime
          ? _value.startTime
          : startTime // ignore: cast_nullable_to_non_nullable
              as DateTime,
      endTime: null == endTime
          ? _value.endTime
          : endTime // ignore: cast_nullable_to_non_nullable
              as DateTime,
      isAvailable: null == isAvailable
          ? _value.isAvailable
          : isAvailable // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$TimeSlotImpl implements _TimeSlot {
  const _$TimeSlotImpl(
      {required this.startTime,
      required this.endTime,
      this.isAvailable = true});

  factory _$TimeSlotImpl.fromJson(Map<String, dynamic> json) =>
      _$$TimeSlotImplFromJson(json);

  @override
  final DateTime startTime;
  @override
  final DateTime endTime;
  @override
  @JsonKey()
  final bool isAvailable;

  @override
  String toString() {
    return 'TimeSlot(startTime: $startTime, endTime: $endTime, isAvailable: $isAvailable)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TimeSlotImpl &&
            (identical(other.startTime, startTime) ||
                other.startTime == startTime) &&
            (identical(other.endTime, endTime) || other.endTime == endTime) &&
            (identical(other.isAvailable, isAvailable) ||
                other.isAvailable == isAvailable));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, startTime, endTime, isAvailable);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$TimeSlotImplCopyWith<_$TimeSlotImpl> get copyWith =>
      __$$TimeSlotImplCopyWithImpl<_$TimeSlotImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$TimeSlotImplToJson(
      this,
    );
  }
}

abstract class _TimeSlot implements TimeSlot {
  const factory _TimeSlot(
      {required final DateTime startTime,
      required final DateTime endTime,
      final bool isAvailable}) = _$TimeSlotImpl;

  factory _TimeSlot.fromJson(Map<String, dynamic> json) =
      _$TimeSlotImpl.fromJson;

  @override
  DateTime get startTime;
  @override
  DateTime get endTime;
  @override
  bool get isAvailable;
  @override
  @JsonKey(ignore: true)
  _$$TimeSlotImplCopyWith<_$TimeSlotImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

BookingRequest _$BookingRequestFromJson(Map<String, dynamic> json) {
  return _BookingRequest.fromJson(json);
}

/// @nodoc
mixin _$BookingRequest {
  int get coachId => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  SessionType get sessionType => throw _privateConstructorUsedError;
  DateTime get scheduledAt => throw _privateConstructorUsedError;
  int get durationMinutes => throw _privateConstructorUsedError;
  String get timezone => throw _privateConstructorUsedError;
  int? get packageId => throw _privateConstructorUsedError;
  String? get clientNotes => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $BookingRequestCopyWith<BookingRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BookingRequestCopyWith<$Res> {
  factory $BookingRequestCopyWith(
          BookingRequest value, $Res Function(BookingRequest) then) =
      _$BookingRequestCopyWithImpl<$Res, BookingRequest>;
  @useResult
  $Res call(
      {int coachId,
      String title,
      String? description,
      SessionType sessionType,
      DateTime scheduledAt,
      int durationMinutes,
      String timezone,
      int? packageId,
      String? clientNotes});
}

/// @nodoc
class _$BookingRequestCopyWithImpl<$Res, $Val extends BookingRequest>
    implements $BookingRequestCopyWith<$Res> {
  _$BookingRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? coachId = null,
    Object? title = null,
    Object? description = freezed,
    Object? sessionType = null,
    Object? scheduledAt = null,
    Object? durationMinutes = null,
    Object? timezone = null,
    Object? packageId = freezed,
    Object? clientNotes = freezed,
  }) {
    return _then(_value.copyWith(
      coachId: null == coachId
          ? _value.coachId
          : coachId // ignore: cast_nullable_to_non_nullable
              as int,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      sessionType: null == sessionType
          ? _value.sessionType
          : sessionType // ignore: cast_nullable_to_non_nullable
              as SessionType,
      scheduledAt: null == scheduledAt
          ? _value.scheduledAt
          : scheduledAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      durationMinutes: null == durationMinutes
          ? _value.durationMinutes
          : durationMinutes // ignore: cast_nullable_to_non_nullable
              as int,
      timezone: null == timezone
          ? _value.timezone
          : timezone // ignore: cast_nullable_to_non_nullable
              as String,
      packageId: freezed == packageId
          ? _value.packageId
          : packageId // ignore: cast_nullable_to_non_nullable
              as int?,
      clientNotes: freezed == clientNotes
          ? _value.clientNotes
          : clientNotes // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$BookingRequestImplCopyWith<$Res>
    implements $BookingRequestCopyWith<$Res> {
  factory _$$BookingRequestImplCopyWith(_$BookingRequestImpl value,
          $Res Function(_$BookingRequestImpl) then) =
      __$$BookingRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int coachId,
      String title,
      String? description,
      SessionType sessionType,
      DateTime scheduledAt,
      int durationMinutes,
      String timezone,
      int? packageId,
      String? clientNotes});
}

/// @nodoc
class __$$BookingRequestImplCopyWithImpl<$Res>
    extends _$BookingRequestCopyWithImpl<$Res, _$BookingRequestImpl>
    implements _$$BookingRequestImplCopyWith<$Res> {
  __$$BookingRequestImplCopyWithImpl(
      _$BookingRequestImpl _value, $Res Function(_$BookingRequestImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? coachId = null,
    Object? title = null,
    Object? description = freezed,
    Object? sessionType = null,
    Object? scheduledAt = null,
    Object? durationMinutes = null,
    Object? timezone = null,
    Object? packageId = freezed,
    Object? clientNotes = freezed,
  }) {
    return _then(_$BookingRequestImpl(
      coachId: null == coachId
          ? _value.coachId
          : coachId // ignore: cast_nullable_to_non_nullable
              as int,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      sessionType: null == sessionType
          ? _value.sessionType
          : sessionType // ignore: cast_nullable_to_non_nullable
              as SessionType,
      scheduledAt: null == scheduledAt
          ? _value.scheduledAt
          : scheduledAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      durationMinutes: null == durationMinutes
          ? _value.durationMinutes
          : durationMinutes // ignore: cast_nullable_to_non_nullable
              as int,
      timezone: null == timezone
          ? _value.timezone
          : timezone // ignore: cast_nullable_to_non_nullable
              as String,
      packageId: freezed == packageId
          ? _value.packageId
          : packageId // ignore: cast_nullable_to_non_nullable
              as int?,
      clientNotes: freezed == clientNotes
          ? _value.clientNotes
          : clientNotes // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$BookingRequestImpl implements _BookingRequest {
  const _$BookingRequestImpl(
      {required this.coachId,
      required this.title,
      this.description,
      required this.sessionType,
      required this.scheduledAt,
      required this.durationMinutes,
      required this.timezone,
      this.packageId,
      this.clientNotes});

  factory _$BookingRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$BookingRequestImplFromJson(json);

  @override
  final int coachId;
  @override
  final String title;
  @override
  final String? description;
  @override
  final SessionType sessionType;
  @override
  final DateTime scheduledAt;
  @override
  final int durationMinutes;
  @override
  final String timezone;
  @override
  final int? packageId;
  @override
  final String? clientNotes;

  @override
  String toString() {
    return 'BookingRequest(coachId: $coachId, title: $title, description: $description, sessionType: $sessionType, scheduledAt: $scheduledAt, durationMinutes: $durationMinutes, timezone: $timezone, packageId: $packageId, clientNotes: $clientNotes)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BookingRequestImpl &&
            (identical(other.coachId, coachId) || other.coachId == coachId) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.sessionType, sessionType) ||
                other.sessionType == sessionType) &&
            (identical(other.scheduledAt, scheduledAt) ||
                other.scheduledAt == scheduledAt) &&
            (identical(other.durationMinutes, durationMinutes) ||
                other.durationMinutes == durationMinutes) &&
            (identical(other.timezone, timezone) ||
                other.timezone == timezone) &&
            (identical(other.packageId, packageId) ||
                other.packageId == packageId) &&
            (identical(other.clientNotes, clientNotes) ||
                other.clientNotes == clientNotes));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      coachId,
      title,
      description,
      sessionType,
      scheduledAt,
      durationMinutes,
      timezone,
      packageId,
      clientNotes);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$BookingRequestImplCopyWith<_$BookingRequestImpl> get copyWith =>
      __$$BookingRequestImplCopyWithImpl<_$BookingRequestImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$BookingRequestImplToJson(
      this,
    );
  }
}

abstract class _BookingRequest implements BookingRequest {
  const factory _BookingRequest(
      {required final int coachId,
      required final String title,
      final String? description,
      required final SessionType sessionType,
      required final DateTime scheduledAt,
      required final int durationMinutes,
      required final String timezone,
      final int? packageId,
      final String? clientNotes}) = _$BookingRequestImpl;

  factory _BookingRequest.fromJson(Map<String, dynamic> json) =
      _$BookingRequestImpl.fromJson;

  @override
  int get coachId;
  @override
  String get title;
  @override
  String? get description;
  @override
  SessionType get sessionType;
  @override
  DateTime get scheduledAt;
  @override
  int get durationMinutes;
  @override
  String get timezone;
  @override
  int? get packageId;
  @override
  String? get clientNotes;
  @override
  @JsonKey(ignore: true)
  _$$BookingRequestImplCopyWith<_$BookingRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
