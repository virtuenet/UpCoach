// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'ai_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

AIResponse _$AIResponseFromJson(Map<String, dynamic> json) {
  return _AIResponse.fromJson(json);
}

/// @nodoc
mixin _$AIResponse {
  String get content => throw _privateConstructorUsedError;
  String get sessionId => throw _privateConstructorUsedError;
  String get role => throw _privateConstructorUsedError;
  Map<String, dynamic>? get metadata => throw _privateConstructorUsedError;
  DateTime? get timestamp => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $AIResponseCopyWith<AIResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AIResponseCopyWith<$Res> {
  factory $AIResponseCopyWith(
          AIResponse value, $Res Function(AIResponse) then) =
      _$AIResponseCopyWithImpl<$Res, AIResponse>;
  @useResult
  $Res call(
      {String content,
      String sessionId,
      String role,
      Map<String, dynamic>? metadata,
      DateTime? timestamp});
}

/// @nodoc
class _$AIResponseCopyWithImpl<$Res, $Val extends AIResponse>
    implements $AIResponseCopyWith<$Res> {
  _$AIResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? content = null,
    Object? sessionId = null,
    Object? role = null,
    Object? metadata = freezed,
    Object? timestamp = freezed,
  }) {
    return _then(_value.copyWith(
      content: null == content
          ? _value.content
          : content // ignore: cast_nullable_to_non_nullable
              as String,
      sessionId: null == sessionId
          ? _value.sessionId
          : sessionId // ignore: cast_nullable_to_non_nullable
              as String,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String,
      metadata: freezed == metadata
          ? _value.metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      timestamp: freezed == timestamp
          ? _value.timestamp
          : timestamp // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AIResponseImplCopyWith<$Res>
    implements $AIResponseCopyWith<$Res> {
  factory _$$AIResponseImplCopyWith(
          _$AIResponseImpl value, $Res Function(_$AIResponseImpl) then) =
      __$$AIResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String content,
      String sessionId,
      String role,
      Map<String, dynamic>? metadata,
      DateTime? timestamp});
}

/// @nodoc
class __$$AIResponseImplCopyWithImpl<$Res>
    extends _$AIResponseCopyWithImpl<$Res, _$AIResponseImpl>
    implements _$$AIResponseImplCopyWith<$Res> {
  __$$AIResponseImplCopyWithImpl(
      _$AIResponseImpl _value, $Res Function(_$AIResponseImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? content = null,
    Object? sessionId = null,
    Object? role = null,
    Object? metadata = freezed,
    Object? timestamp = freezed,
  }) {
    return _then(_$AIResponseImpl(
      content: null == content
          ? _value.content
          : content // ignore: cast_nullable_to_non_nullable
              as String,
      sessionId: null == sessionId
          ? _value.sessionId
          : sessionId // ignore: cast_nullable_to_non_nullable
              as String,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String,
      metadata: freezed == metadata
          ? _value._metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      timestamp: freezed == timestamp
          ? _value.timestamp
          : timestamp // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AIResponseImpl implements _AIResponse {
  const _$AIResponseImpl(
      {required this.content,
      required this.sessionId,
      this.role = 'assistant',
      final Map<String, dynamic>? metadata,
      this.timestamp})
      : _metadata = metadata;

  factory _$AIResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$AIResponseImplFromJson(json);

  @override
  final String content;
  @override
  final String sessionId;
  @override
  @JsonKey()
  final String role;
  final Map<String, dynamic>? _metadata;
  @override
  Map<String, dynamic>? get metadata {
    final value = _metadata;
    if (value == null) return null;
    if (_metadata is EqualUnmodifiableMapView) return _metadata;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  final DateTime? timestamp;

  @override
  String toString() {
    return 'AIResponse(content: $content, sessionId: $sessionId, role: $role, metadata: $metadata, timestamp: $timestamp)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AIResponseImpl &&
            (identical(other.content, content) || other.content == content) &&
            (identical(other.sessionId, sessionId) ||
                other.sessionId == sessionId) &&
            (identical(other.role, role) || other.role == role) &&
            const DeepCollectionEquality().equals(other._metadata, _metadata) &&
            (identical(other.timestamp, timestamp) ||
                other.timestamp == timestamp));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, content, sessionId, role,
      const DeepCollectionEquality().hash(_metadata), timestamp);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AIResponseImplCopyWith<_$AIResponseImpl> get copyWith =>
      __$$AIResponseImplCopyWithImpl<_$AIResponseImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AIResponseImplToJson(
      this,
    );
  }
}

abstract class _AIResponse implements AIResponse {
  const factory _AIResponse(
      {required final String content,
      required final String sessionId,
      final String role,
      final Map<String, dynamic>? metadata,
      final DateTime? timestamp}) = _$AIResponseImpl;

  factory _AIResponse.fromJson(Map<String, dynamic> json) =
      _$AIResponseImpl.fromJson;

  @override
  String get content;
  @override
  String get sessionId;
  @override
  String get role;
  @override
  Map<String, dynamic>? get metadata;
  @override
  DateTime? get timestamp;
  @override
  @JsonKey(ignore: true)
  _$$AIResponseImplCopyWith<_$AIResponseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

AIRecommendation _$AIRecommendationFromJson(Map<String, dynamic> json) {
  return _AIRecommendation.fromJson(json);
}

/// @nodoc
mixin _$AIRecommendation {
  String get id => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  double get priority => throw _privateConstructorUsedError;
  List<String>? get tags => throw _privateConstructorUsedError;
  Map<String, dynamic>? get data => throw _privateConstructorUsedError;
  DateTime? get createdAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $AIRecommendationCopyWith<AIRecommendation> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AIRecommendationCopyWith<$Res> {
  factory $AIRecommendationCopyWith(
          AIRecommendation value, $Res Function(AIRecommendation) then) =
      _$AIRecommendationCopyWithImpl<$Res, AIRecommendation>;
  @useResult
  $Res call(
      {String id,
      String type,
      String title,
      String description,
      double priority,
      List<String>? tags,
      Map<String, dynamic>? data,
      DateTime? createdAt});
}

/// @nodoc
class _$AIRecommendationCopyWithImpl<$Res, $Val extends AIRecommendation>
    implements $AIRecommendationCopyWith<$Res> {
  _$AIRecommendationCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? title = null,
    Object? description = null,
    Object? priority = null,
    Object? tags = freezed,
    Object? data = freezed,
    Object? createdAt = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      priority: null == priority
          ? _value.priority
          : priority // ignore: cast_nullable_to_non_nullable
              as double,
      tags: freezed == tags
          ? _value.tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      data: freezed == data
          ? _value.data
          : data // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AIRecommendationImplCopyWith<$Res>
    implements $AIRecommendationCopyWith<$Res> {
  factory _$$AIRecommendationImplCopyWith(_$AIRecommendationImpl value,
          $Res Function(_$AIRecommendationImpl) then) =
      __$$AIRecommendationImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String type,
      String title,
      String description,
      double priority,
      List<String>? tags,
      Map<String, dynamic>? data,
      DateTime? createdAt});
}

/// @nodoc
class __$$AIRecommendationImplCopyWithImpl<$Res>
    extends _$AIRecommendationCopyWithImpl<$Res, _$AIRecommendationImpl>
    implements _$$AIRecommendationImplCopyWith<$Res> {
  __$$AIRecommendationImplCopyWithImpl(_$AIRecommendationImpl _value,
      $Res Function(_$AIRecommendationImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? title = null,
    Object? description = null,
    Object? priority = null,
    Object? tags = freezed,
    Object? data = freezed,
    Object? createdAt = freezed,
  }) {
    return _then(_$AIRecommendationImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      priority: null == priority
          ? _value.priority
          : priority // ignore: cast_nullable_to_non_nullable
              as double,
      tags: freezed == tags
          ? _value._tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      data: freezed == data
          ? _value._data
          : data // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AIRecommendationImpl implements _AIRecommendation {
  const _$AIRecommendationImpl(
      {required this.id,
      required this.type,
      required this.title,
      required this.description,
      required this.priority,
      final List<String>? tags,
      final Map<String, dynamic>? data,
      this.createdAt})
      : _tags = tags,
        _data = data;

  factory _$AIRecommendationImpl.fromJson(Map<String, dynamic> json) =>
      _$$AIRecommendationImplFromJson(json);

  @override
  final String id;
  @override
  final String type;
  @override
  final String title;
  @override
  final String description;
  @override
  final double priority;
  final List<String>? _tags;
  @override
  List<String>? get tags {
    final value = _tags;
    if (value == null) return null;
    if (_tags is EqualUnmodifiableListView) return _tags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  final Map<String, dynamic>? _data;
  @override
  Map<String, dynamic>? get data {
    final value = _data;
    if (value == null) return null;
    if (_data is EqualUnmodifiableMapView) return _data;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  final DateTime? createdAt;

  @override
  String toString() {
    return 'AIRecommendation(id: $id, type: $type, title: $title, description: $description, priority: $priority, tags: $tags, data: $data, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AIRecommendationImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.priority, priority) ||
                other.priority == priority) &&
            const DeepCollectionEquality().equals(other._tags, _tags) &&
            const DeepCollectionEquality().equals(other._data, _data) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      type,
      title,
      description,
      priority,
      const DeepCollectionEquality().hash(_tags),
      const DeepCollectionEquality().hash(_data),
      createdAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AIRecommendationImplCopyWith<_$AIRecommendationImpl> get copyWith =>
      __$$AIRecommendationImplCopyWithImpl<_$AIRecommendationImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AIRecommendationImplToJson(
      this,
    );
  }
}

abstract class _AIRecommendation implements AIRecommendation {
  const factory _AIRecommendation(
      {required final String id,
      required final String type,
      required final String title,
      required final String description,
      required final double priority,
      final List<String>? tags,
      final Map<String, dynamic>? data,
      final DateTime? createdAt}) = _$AIRecommendationImpl;

  factory _AIRecommendation.fromJson(Map<String, dynamic> json) =
      _$AIRecommendationImpl.fromJson;

  @override
  String get id;
  @override
  String get type;
  @override
  String get title;
  @override
  String get description;
  @override
  double get priority;
  @override
  List<String>? get tags;
  @override
  Map<String, dynamic>? get data;
  @override
  DateTime? get createdAt;
  @override
  @JsonKey(ignore: true)
  _$$AIRecommendationImplCopyWith<_$AIRecommendationImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

AIPrediction _$AIPredictionFromJson(Map<String, dynamic> json) {
  return _AIPrediction.fromJson(json);
}

/// @nodoc
mixin _$AIPrediction {
  String get type => throw _privateConstructorUsedError;
  double get probability => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  DateTime? get predictedDate => throw _privateConstructorUsedError;
  List<String>? get factors => throw _privateConstructorUsedError;
  Map<String, dynamic>? get metadata => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $AIPredictionCopyWith<AIPrediction> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AIPredictionCopyWith<$Res> {
  factory $AIPredictionCopyWith(
          AIPrediction value, $Res Function(AIPrediction) then) =
      _$AIPredictionCopyWithImpl<$Res, AIPrediction>;
  @useResult
  $Res call(
      {String type,
      double probability,
      String description,
      DateTime? predictedDate,
      List<String>? factors,
      Map<String, dynamic>? metadata});
}

/// @nodoc
class _$AIPredictionCopyWithImpl<$Res, $Val extends AIPrediction>
    implements $AIPredictionCopyWith<$Res> {
  _$AIPredictionCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? type = null,
    Object? probability = null,
    Object? description = null,
    Object? predictedDate = freezed,
    Object? factors = freezed,
    Object? metadata = freezed,
  }) {
    return _then(_value.copyWith(
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      probability: null == probability
          ? _value.probability
          : probability // ignore: cast_nullable_to_non_nullable
              as double,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      predictedDate: freezed == predictedDate
          ? _value.predictedDate
          : predictedDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      factors: freezed == factors
          ? _value.factors
          : factors // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      metadata: freezed == metadata
          ? _value.metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AIPredictionImplCopyWith<$Res>
    implements $AIPredictionCopyWith<$Res> {
  factory _$$AIPredictionImplCopyWith(
          _$AIPredictionImpl value, $Res Function(_$AIPredictionImpl) then) =
      __$$AIPredictionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String type,
      double probability,
      String description,
      DateTime? predictedDate,
      List<String>? factors,
      Map<String, dynamic>? metadata});
}

/// @nodoc
class __$$AIPredictionImplCopyWithImpl<$Res>
    extends _$AIPredictionCopyWithImpl<$Res, _$AIPredictionImpl>
    implements _$$AIPredictionImplCopyWith<$Res> {
  __$$AIPredictionImplCopyWithImpl(
      _$AIPredictionImpl _value, $Res Function(_$AIPredictionImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? type = null,
    Object? probability = null,
    Object? description = null,
    Object? predictedDate = freezed,
    Object? factors = freezed,
    Object? metadata = freezed,
  }) {
    return _then(_$AIPredictionImpl(
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      probability: null == probability
          ? _value.probability
          : probability // ignore: cast_nullable_to_non_nullable
              as double,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      predictedDate: freezed == predictedDate
          ? _value.predictedDate
          : predictedDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      factors: freezed == factors
          ? _value._factors
          : factors // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      metadata: freezed == metadata
          ? _value._metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AIPredictionImpl implements _AIPrediction {
  const _$AIPredictionImpl(
      {required this.type,
      required this.probability,
      required this.description,
      this.predictedDate,
      final List<String>? factors,
      final Map<String, dynamic>? metadata})
      : _factors = factors,
        _metadata = metadata;

  factory _$AIPredictionImpl.fromJson(Map<String, dynamic> json) =>
      _$$AIPredictionImplFromJson(json);

  @override
  final String type;
  @override
  final double probability;
  @override
  final String description;
  @override
  final DateTime? predictedDate;
  final List<String>? _factors;
  @override
  List<String>? get factors {
    final value = _factors;
    if (value == null) return null;
    if (_factors is EqualUnmodifiableListView) return _factors;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  final Map<String, dynamic>? _metadata;
  @override
  Map<String, dynamic>? get metadata {
    final value = _metadata;
    if (value == null) return null;
    if (_metadata is EqualUnmodifiableMapView) return _metadata;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  String toString() {
    return 'AIPrediction(type: $type, probability: $probability, description: $description, predictedDate: $predictedDate, factors: $factors, metadata: $metadata)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AIPredictionImpl &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.probability, probability) ||
                other.probability == probability) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.predictedDate, predictedDate) ||
                other.predictedDate == predictedDate) &&
            const DeepCollectionEquality().equals(other._factors, _factors) &&
            const DeepCollectionEquality().equals(other._metadata, _metadata));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      type,
      probability,
      description,
      predictedDate,
      const DeepCollectionEquality().hash(_factors),
      const DeepCollectionEquality().hash(_metadata));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AIPredictionImplCopyWith<_$AIPredictionImpl> get copyWith =>
      __$$AIPredictionImplCopyWithImpl<_$AIPredictionImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AIPredictionImplToJson(
      this,
    );
  }
}

abstract class _AIPrediction implements AIPrediction {
  const factory _AIPrediction(
      {required final String type,
      required final double probability,
      required final String description,
      final DateTime? predictedDate,
      final List<String>? factors,
      final Map<String, dynamic>? metadata}) = _$AIPredictionImpl;

  factory _AIPrediction.fromJson(Map<String, dynamic> json) =
      _$AIPredictionImpl.fromJson;

  @override
  String get type;
  @override
  double get probability;
  @override
  String get description;
  @override
  DateTime? get predictedDate;
  @override
  List<String>? get factors;
  @override
  Map<String, dynamic>? get metadata;
  @override
  @JsonKey(ignore: true)
  _$$AIPredictionImplCopyWith<_$AIPredictionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

VoiceAnalysis _$VoiceAnalysisFromJson(Map<String, dynamic> json) {
  return _VoiceAnalysis.fromJson(json);
}

/// @nodoc
mixin _$VoiceAnalysis {
  String get sessionId => throw _privateConstructorUsedError;
  Map<String, double> get emotions => throw _privateConstructorUsedError;
  double get stressLevel => throw _privateConstructorUsedError;
  double get energyLevel => throw _privateConstructorUsedError;
  double get clarity => throw _privateConstructorUsedError;
  String? get mood => throw _privateConstructorUsedError;
  List<String>? get insights => throw _privateConstructorUsedError;
  DateTime? get analyzedAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $VoiceAnalysisCopyWith<VoiceAnalysis> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $VoiceAnalysisCopyWith<$Res> {
  factory $VoiceAnalysisCopyWith(
          VoiceAnalysis value, $Res Function(VoiceAnalysis) then) =
      _$VoiceAnalysisCopyWithImpl<$Res, VoiceAnalysis>;
  @useResult
  $Res call(
      {String sessionId,
      Map<String, double> emotions,
      double stressLevel,
      double energyLevel,
      double clarity,
      String? mood,
      List<String>? insights,
      DateTime? analyzedAt});
}

/// @nodoc
class _$VoiceAnalysisCopyWithImpl<$Res, $Val extends VoiceAnalysis>
    implements $VoiceAnalysisCopyWith<$Res> {
  _$VoiceAnalysisCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? sessionId = null,
    Object? emotions = null,
    Object? stressLevel = null,
    Object? energyLevel = null,
    Object? clarity = null,
    Object? mood = freezed,
    Object? insights = freezed,
    Object? analyzedAt = freezed,
  }) {
    return _then(_value.copyWith(
      sessionId: null == sessionId
          ? _value.sessionId
          : sessionId // ignore: cast_nullable_to_non_nullable
              as String,
      emotions: null == emotions
          ? _value.emotions
          : emotions // ignore: cast_nullable_to_non_nullable
              as Map<String, double>,
      stressLevel: null == stressLevel
          ? _value.stressLevel
          : stressLevel // ignore: cast_nullable_to_non_nullable
              as double,
      energyLevel: null == energyLevel
          ? _value.energyLevel
          : energyLevel // ignore: cast_nullable_to_non_nullable
              as double,
      clarity: null == clarity
          ? _value.clarity
          : clarity // ignore: cast_nullable_to_non_nullable
              as double,
      mood: freezed == mood
          ? _value.mood
          : mood // ignore: cast_nullable_to_non_nullable
              as String?,
      insights: freezed == insights
          ? _value.insights
          : insights // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      analyzedAt: freezed == analyzedAt
          ? _value.analyzedAt
          : analyzedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$VoiceAnalysisImplCopyWith<$Res>
    implements $VoiceAnalysisCopyWith<$Res> {
  factory _$$VoiceAnalysisImplCopyWith(
          _$VoiceAnalysisImpl value, $Res Function(_$VoiceAnalysisImpl) then) =
      __$$VoiceAnalysisImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String sessionId,
      Map<String, double> emotions,
      double stressLevel,
      double energyLevel,
      double clarity,
      String? mood,
      List<String>? insights,
      DateTime? analyzedAt});
}

/// @nodoc
class __$$VoiceAnalysisImplCopyWithImpl<$Res>
    extends _$VoiceAnalysisCopyWithImpl<$Res, _$VoiceAnalysisImpl>
    implements _$$VoiceAnalysisImplCopyWith<$Res> {
  __$$VoiceAnalysisImplCopyWithImpl(
      _$VoiceAnalysisImpl _value, $Res Function(_$VoiceAnalysisImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? sessionId = null,
    Object? emotions = null,
    Object? stressLevel = null,
    Object? energyLevel = null,
    Object? clarity = null,
    Object? mood = freezed,
    Object? insights = freezed,
    Object? analyzedAt = freezed,
  }) {
    return _then(_$VoiceAnalysisImpl(
      sessionId: null == sessionId
          ? _value.sessionId
          : sessionId // ignore: cast_nullable_to_non_nullable
              as String,
      emotions: null == emotions
          ? _value._emotions
          : emotions // ignore: cast_nullable_to_non_nullable
              as Map<String, double>,
      stressLevel: null == stressLevel
          ? _value.stressLevel
          : stressLevel // ignore: cast_nullable_to_non_nullable
              as double,
      energyLevel: null == energyLevel
          ? _value.energyLevel
          : energyLevel // ignore: cast_nullable_to_non_nullable
              as double,
      clarity: null == clarity
          ? _value.clarity
          : clarity // ignore: cast_nullable_to_non_nullable
              as double,
      mood: freezed == mood
          ? _value.mood
          : mood // ignore: cast_nullable_to_non_nullable
              as String?,
      insights: freezed == insights
          ? _value._insights
          : insights // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      analyzedAt: freezed == analyzedAt
          ? _value.analyzedAt
          : analyzedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$VoiceAnalysisImpl implements _VoiceAnalysis {
  const _$VoiceAnalysisImpl(
      {required this.sessionId,
      required final Map<String, double> emotions,
      required this.stressLevel,
      required this.energyLevel,
      required this.clarity,
      this.mood,
      final List<String>? insights,
      this.analyzedAt})
      : _emotions = emotions,
        _insights = insights;

  factory _$VoiceAnalysisImpl.fromJson(Map<String, dynamic> json) =>
      _$$VoiceAnalysisImplFromJson(json);

  @override
  final String sessionId;
  final Map<String, double> _emotions;
  @override
  Map<String, double> get emotions {
    if (_emotions is EqualUnmodifiableMapView) return _emotions;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_emotions);
  }

  @override
  final double stressLevel;
  @override
  final double energyLevel;
  @override
  final double clarity;
  @override
  final String? mood;
  final List<String>? _insights;
  @override
  List<String>? get insights {
    final value = _insights;
    if (value == null) return null;
    if (_insights is EqualUnmodifiableListView) return _insights;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  @override
  final DateTime? analyzedAt;

  @override
  String toString() {
    return 'VoiceAnalysis(sessionId: $sessionId, emotions: $emotions, stressLevel: $stressLevel, energyLevel: $energyLevel, clarity: $clarity, mood: $mood, insights: $insights, analyzedAt: $analyzedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$VoiceAnalysisImpl &&
            (identical(other.sessionId, sessionId) ||
                other.sessionId == sessionId) &&
            const DeepCollectionEquality().equals(other._emotions, _emotions) &&
            (identical(other.stressLevel, stressLevel) ||
                other.stressLevel == stressLevel) &&
            (identical(other.energyLevel, energyLevel) ||
                other.energyLevel == energyLevel) &&
            (identical(other.clarity, clarity) || other.clarity == clarity) &&
            (identical(other.mood, mood) || other.mood == mood) &&
            const DeepCollectionEquality().equals(other._insights, _insights) &&
            (identical(other.analyzedAt, analyzedAt) ||
                other.analyzedAt == analyzedAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      sessionId,
      const DeepCollectionEquality().hash(_emotions),
      stressLevel,
      energyLevel,
      clarity,
      mood,
      const DeepCollectionEquality().hash(_insights),
      analyzedAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$VoiceAnalysisImplCopyWith<_$VoiceAnalysisImpl> get copyWith =>
      __$$VoiceAnalysisImplCopyWithImpl<_$VoiceAnalysisImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$VoiceAnalysisImplToJson(
      this,
    );
  }
}

abstract class _VoiceAnalysis implements VoiceAnalysis {
  const factory _VoiceAnalysis(
      {required final String sessionId,
      required final Map<String, double> emotions,
      required final double stressLevel,
      required final double energyLevel,
      required final double clarity,
      final String? mood,
      final List<String>? insights,
      final DateTime? analyzedAt}) = _$VoiceAnalysisImpl;

  factory _VoiceAnalysis.fromJson(Map<String, dynamic> json) =
      _$VoiceAnalysisImpl.fromJson;

  @override
  String get sessionId;
  @override
  Map<String, double> get emotions;
  @override
  double get stressLevel;
  @override
  double get energyLevel;
  @override
  double get clarity;
  @override
  String? get mood;
  @override
  List<String>? get insights;
  @override
  DateTime? get analyzedAt;
  @override
  @JsonKey(ignore: true)
  _$$VoiceAnalysisImplCopyWith<_$VoiceAnalysisImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

LearningPath _$LearningPathFromJson(Map<String, dynamic> json) {
  return _LearningPath.fromJson(json);
}

/// @nodoc
mixin _$LearningPath {
  String get id => throw _privateConstructorUsedError;
  String get topic => throw _privateConstructorUsedError;
  List<LearningModule> get modules => throw _privateConstructorUsedError;
  double get progress => throw _privateConstructorUsedError;
  String get difficulty => throw _privateConstructorUsedError;
  int? get estimatedDays => throw _privateConstructorUsedError;
  DateTime? get startedAt => throw _privateConstructorUsedError;
  DateTime? get completedAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $LearningPathCopyWith<LearningPath> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $LearningPathCopyWith<$Res> {
  factory $LearningPathCopyWith(
          LearningPath value, $Res Function(LearningPath) then) =
      _$LearningPathCopyWithImpl<$Res, LearningPath>;
  @useResult
  $Res call(
      {String id,
      String topic,
      List<LearningModule> modules,
      double progress,
      String difficulty,
      int? estimatedDays,
      DateTime? startedAt,
      DateTime? completedAt});
}

/// @nodoc
class _$LearningPathCopyWithImpl<$Res, $Val extends LearningPath>
    implements $LearningPathCopyWith<$Res> {
  _$LearningPathCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? topic = null,
    Object? modules = null,
    Object? progress = null,
    Object? difficulty = null,
    Object? estimatedDays = freezed,
    Object? startedAt = freezed,
    Object? completedAt = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      topic: null == topic
          ? _value.topic
          : topic // ignore: cast_nullable_to_non_nullable
              as String,
      modules: null == modules
          ? _value.modules
          : modules // ignore: cast_nullable_to_non_nullable
              as List<LearningModule>,
      progress: null == progress
          ? _value.progress
          : progress // ignore: cast_nullable_to_non_nullable
              as double,
      difficulty: null == difficulty
          ? _value.difficulty
          : difficulty // ignore: cast_nullable_to_non_nullable
              as String,
      estimatedDays: freezed == estimatedDays
          ? _value.estimatedDays
          : estimatedDays // ignore: cast_nullable_to_non_nullable
              as int?,
      startedAt: freezed == startedAt
          ? _value.startedAt
          : startedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      completedAt: freezed == completedAt
          ? _value.completedAt
          : completedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$LearningPathImplCopyWith<$Res>
    implements $LearningPathCopyWith<$Res> {
  factory _$$LearningPathImplCopyWith(
          _$LearningPathImpl value, $Res Function(_$LearningPathImpl) then) =
      __$$LearningPathImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String topic,
      List<LearningModule> modules,
      double progress,
      String difficulty,
      int? estimatedDays,
      DateTime? startedAt,
      DateTime? completedAt});
}

/// @nodoc
class __$$LearningPathImplCopyWithImpl<$Res>
    extends _$LearningPathCopyWithImpl<$Res, _$LearningPathImpl>
    implements _$$LearningPathImplCopyWith<$Res> {
  __$$LearningPathImplCopyWithImpl(
      _$LearningPathImpl _value, $Res Function(_$LearningPathImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? topic = null,
    Object? modules = null,
    Object? progress = null,
    Object? difficulty = null,
    Object? estimatedDays = freezed,
    Object? startedAt = freezed,
    Object? completedAt = freezed,
  }) {
    return _then(_$LearningPathImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      topic: null == topic
          ? _value.topic
          : topic // ignore: cast_nullable_to_non_nullable
              as String,
      modules: null == modules
          ? _value._modules
          : modules // ignore: cast_nullable_to_non_nullable
              as List<LearningModule>,
      progress: null == progress
          ? _value.progress
          : progress // ignore: cast_nullable_to_non_nullable
              as double,
      difficulty: null == difficulty
          ? _value.difficulty
          : difficulty // ignore: cast_nullable_to_non_nullable
              as String,
      estimatedDays: freezed == estimatedDays
          ? _value.estimatedDays
          : estimatedDays // ignore: cast_nullable_to_non_nullable
              as int?,
      startedAt: freezed == startedAt
          ? _value.startedAt
          : startedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      completedAt: freezed == completedAt
          ? _value.completedAt
          : completedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$LearningPathImpl implements _LearningPath {
  const _$LearningPathImpl(
      {required this.id,
      required this.topic,
      required final List<LearningModule> modules,
      required this.progress,
      required this.difficulty,
      this.estimatedDays,
      this.startedAt,
      this.completedAt})
      : _modules = modules;

  factory _$LearningPathImpl.fromJson(Map<String, dynamic> json) =>
      _$$LearningPathImplFromJson(json);

  @override
  final String id;
  @override
  final String topic;
  final List<LearningModule> _modules;
  @override
  List<LearningModule> get modules {
    if (_modules is EqualUnmodifiableListView) return _modules;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_modules);
  }

  @override
  final double progress;
  @override
  final String difficulty;
  @override
  final int? estimatedDays;
  @override
  final DateTime? startedAt;
  @override
  final DateTime? completedAt;

  @override
  String toString() {
    return 'LearningPath(id: $id, topic: $topic, modules: $modules, progress: $progress, difficulty: $difficulty, estimatedDays: $estimatedDays, startedAt: $startedAt, completedAt: $completedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$LearningPathImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.topic, topic) || other.topic == topic) &&
            const DeepCollectionEquality().equals(other._modules, _modules) &&
            (identical(other.progress, progress) ||
                other.progress == progress) &&
            (identical(other.difficulty, difficulty) ||
                other.difficulty == difficulty) &&
            (identical(other.estimatedDays, estimatedDays) ||
                other.estimatedDays == estimatedDays) &&
            (identical(other.startedAt, startedAt) ||
                other.startedAt == startedAt) &&
            (identical(other.completedAt, completedAt) ||
                other.completedAt == completedAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      topic,
      const DeepCollectionEquality().hash(_modules),
      progress,
      difficulty,
      estimatedDays,
      startedAt,
      completedAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$LearningPathImplCopyWith<_$LearningPathImpl> get copyWith =>
      __$$LearningPathImplCopyWithImpl<_$LearningPathImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$LearningPathImplToJson(
      this,
    );
  }
}

abstract class _LearningPath implements LearningPath {
  const factory _LearningPath(
      {required final String id,
      required final String topic,
      required final List<LearningModule> modules,
      required final double progress,
      required final String difficulty,
      final int? estimatedDays,
      final DateTime? startedAt,
      final DateTime? completedAt}) = _$LearningPathImpl;

  factory _LearningPath.fromJson(Map<String, dynamic> json) =
      _$LearningPathImpl.fromJson;

  @override
  String get id;
  @override
  String get topic;
  @override
  List<LearningModule> get modules;
  @override
  double get progress;
  @override
  String get difficulty;
  @override
  int? get estimatedDays;
  @override
  DateTime? get startedAt;
  @override
  DateTime? get completedAt;
  @override
  @JsonKey(ignore: true)
  _$$LearningPathImplCopyWith<_$LearningPathImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

LearningModule _$LearningModuleFromJson(Map<String, dynamic> json) {
  return _LearningModule.fromJson(json);
}

/// @nodoc
mixin _$LearningModule {
  String get id => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  int get order => throw _privateConstructorUsedError;
  bool get completed => throw _privateConstructorUsedError;
  double? get score => throw _privateConstructorUsedError;
  int? get timeSpent => throw _privateConstructorUsedError;
  Map<String, dynamic>? get content => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $LearningModuleCopyWith<LearningModule> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $LearningModuleCopyWith<$Res> {
  factory $LearningModuleCopyWith(
          LearningModule value, $Res Function(LearningModule) then) =
      _$LearningModuleCopyWithImpl<$Res, LearningModule>;
  @useResult
  $Res call(
      {String id,
      String title,
      String description,
      String type,
      int order,
      bool completed,
      double? score,
      int? timeSpent,
      Map<String, dynamic>? content});
}

/// @nodoc
class _$LearningModuleCopyWithImpl<$Res, $Val extends LearningModule>
    implements $LearningModuleCopyWith<$Res> {
  _$LearningModuleCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? description = null,
    Object? type = null,
    Object? order = null,
    Object? completed = null,
    Object? score = freezed,
    Object? timeSpent = freezed,
    Object? content = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      order: null == order
          ? _value.order
          : order // ignore: cast_nullable_to_non_nullable
              as int,
      completed: null == completed
          ? _value.completed
          : completed // ignore: cast_nullable_to_non_nullable
              as bool,
      score: freezed == score
          ? _value.score
          : score // ignore: cast_nullable_to_non_nullable
              as double?,
      timeSpent: freezed == timeSpent
          ? _value.timeSpent
          : timeSpent // ignore: cast_nullable_to_non_nullable
              as int?,
      content: freezed == content
          ? _value.content
          : content // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$LearningModuleImplCopyWith<$Res>
    implements $LearningModuleCopyWith<$Res> {
  factory _$$LearningModuleImplCopyWith(_$LearningModuleImpl value,
          $Res Function(_$LearningModuleImpl) then) =
      __$$LearningModuleImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String title,
      String description,
      String type,
      int order,
      bool completed,
      double? score,
      int? timeSpent,
      Map<String, dynamic>? content});
}

/// @nodoc
class __$$LearningModuleImplCopyWithImpl<$Res>
    extends _$LearningModuleCopyWithImpl<$Res, _$LearningModuleImpl>
    implements _$$LearningModuleImplCopyWith<$Res> {
  __$$LearningModuleImplCopyWithImpl(
      _$LearningModuleImpl _value, $Res Function(_$LearningModuleImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? description = null,
    Object? type = null,
    Object? order = null,
    Object? completed = null,
    Object? score = freezed,
    Object? timeSpent = freezed,
    Object? content = freezed,
  }) {
    return _then(_$LearningModuleImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      order: null == order
          ? _value.order
          : order // ignore: cast_nullable_to_non_nullable
              as int,
      completed: null == completed
          ? _value.completed
          : completed // ignore: cast_nullable_to_non_nullable
              as bool,
      score: freezed == score
          ? _value.score
          : score // ignore: cast_nullable_to_non_nullable
              as double?,
      timeSpent: freezed == timeSpent
          ? _value.timeSpent
          : timeSpent // ignore: cast_nullable_to_non_nullable
              as int?,
      content: freezed == content
          ? _value._content
          : content // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$LearningModuleImpl implements _LearningModule {
  const _$LearningModuleImpl(
      {required this.id,
      required this.title,
      required this.description,
      required this.type,
      required this.order,
      required this.completed,
      this.score,
      this.timeSpent,
      final Map<String, dynamic>? content})
      : _content = content;

  factory _$LearningModuleImpl.fromJson(Map<String, dynamic> json) =>
      _$$LearningModuleImplFromJson(json);

  @override
  final String id;
  @override
  final String title;
  @override
  final String description;
  @override
  final String type;
  @override
  final int order;
  @override
  final bool completed;
  @override
  final double? score;
  @override
  final int? timeSpent;
  final Map<String, dynamic>? _content;
  @override
  Map<String, dynamic>? get content {
    final value = _content;
    if (value == null) return null;
    if (_content is EqualUnmodifiableMapView) return _content;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  String toString() {
    return 'LearningModule(id: $id, title: $title, description: $description, type: $type, order: $order, completed: $completed, score: $score, timeSpent: $timeSpent, content: $content)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$LearningModuleImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.order, order) || other.order == order) &&
            (identical(other.completed, completed) ||
                other.completed == completed) &&
            (identical(other.score, score) || other.score == score) &&
            (identical(other.timeSpent, timeSpent) ||
                other.timeSpent == timeSpent) &&
            const DeepCollectionEquality().equals(other._content, _content));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      title,
      description,
      type,
      order,
      completed,
      score,
      timeSpent,
      const DeepCollectionEquality().hash(_content));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$LearningModuleImplCopyWith<_$LearningModuleImpl> get copyWith =>
      __$$LearningModuleImplCopyWithImpl<_$LearningModuleImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$LearningModuleImplToJson(
      this,
    );
  }
}

abstract class _LearningModule implements LearningModule {
  const factory _LearningModule(
      {required final String id,
      required final String title,
      required final String description,
      required final String type,
      required final int order,
      required final bool completed,
      final double? score,
      final int? timeSpent,
      final Map<String, dynamic>? content}) = _$LearningModuleImpl;

  factory _LearningModule.fromJson(Map<String, dynamic> json) =
      _$LearningModuleImpl.fromJson;

  @override
  String get id;
  @override
  String get title;
  @override
  String get description;
  @override
  String get type;
  @override
  int get order;
  @override
  bool get completed;
  @override
  double? get score;
  @override
  int? get timeSpent;
  @override
  Map<String, dynamic>? get content;
  @override
  @JsonKey(ignore: true)
  _$$LearningModuleImplCopyWith<_$LearningModuleImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
