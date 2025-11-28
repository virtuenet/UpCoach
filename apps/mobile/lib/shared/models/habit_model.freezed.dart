// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'habit_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Habit _$HabitFromJson(Map<String, dynamic> json) {
  return _Habit.fromJson(json);
}

/// @nodoc
mixin _$Habit {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  HabitType get type => throw _privateConstructorUsedError;
  HabitFrequency get frequency => throw _privateConstructorUsedError;
  HabitCategory get category => throw _privateConstructorUsedError;
  List<String> get tags => throw _privateConstructorUsedError;
  String get icon => throw _privateConstructorUsedError;
  String get color => throw _privateConstructorUsedError;
  int get targetValue => throw _privateConstructorUsedError;
  String get unit => throw _privateConstructorUsedError;
  DateTime get createdAt => throw _privateConstructorUsedError;
  DateTime? get updatedAt => throw _privateConstructorUsedError;
  bool get isActive => throw _privateConstructorUsedError;
  int get currentStreak => throw _privateConstructorUsedError;
  int get longestStreak => throw _privateConstructorUsedError;
  int get totalCompletions => throw _privateConstructorUsedError;
  List<int> get weekdays =>
      throw _privateConstructorUsedError; // For weekly habits: [1,2,3,4,5] = Mon-Fri
  int? get customInterval =>
      throw _privateConstructorUsedError; // For custom frequency
  DateTime? get lastCompletedAt => throw _privateConstructorUsedError;
  DateTime? get startDate => throw _privateConstructorUsedError;
  DateTime? get endDate => throw _privateConstructorUsedError;
  bool get hasReminder => throw _privateConstructorUsedError;
  DateTime? get reminderTime => throw _privateConstructorUsedError;
  String get reminderMessage => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $HabitCopyWith<Habit> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $HabitCopyWith<$Res> {
  factory $HabitCopyWith(Habit value, $Res Function(Habit) then) =
      _$HabitCopyWithImpl<$Res, Habit>;
  @useResult
  $Res call(
      {String id,
      String name,
      String description,
      HabitType type,
      HabitFrequency frequency,
      HabitCategory category,
      List<String> tags,
      String icon,
      String color,
      int targetValue,
      String unit,
      DateTime createdAt,
      DateTime? updatedAt,
      bool isActive,
      int currentStreak,
      int longestStreak,
      int totalCompletions,
      List<int> weekdays,
      int? customInterval,
      DateTime? lastCompletedAt,
      DateTime? startDate,
      DateTime? endDate,
      bool hasReminder,
      DateTime? reminderTime,
      String reminderMessage});
}

/// @nodoc
class _$HabitCopyWithImpl<$Res, $Val extends Habit>
    implements $HabitCopyWith<$Res> {
  _$HabitCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? description = null,
    Object? type = null,
    Object? frequency = null,
    Object? category = null,
    Object? tags = null,
    Object? icon = null,
    Object? color = null,
    Object? targetValue = null,
    Object? unit = null,
    Object? createdAt = null,
    Object? updatedAt = freezed,
    Object? isActive = null,
    Object? currentStreak = null,
    Object? longestStreak = null,
    Object? totalCompletions = null,
    Object? weekdays = null,
    Object? customInterval = freezed,
    Object? lastCompletedAt = freezed,
    Object? startDate = freezed,
    Object? endDate = freezed,
    Object? hasReminder = null,
    Object? reminderTime = freezed,
    Object? reminderMessage = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as HabitType,
      frequency: null == frequency
          ? _value.frequency
          : frequency // ignore: cast_nullable_to_non_nullable
              as HabitFrequency,
      category: null == category
          ? _value.category
          : category // ignore: cast_nullable_to_non_nullable
              as HabitCategory,
      tags: null == tags
          ? _value.tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      icon: null == icon
          ? _value.icon
          : icon // ignore: cast_nullable_to_non_nullable
              as String,
      color: null == color
          ? _value.color
          : color // ignore: cast_nullable_to_non_nullable
              as String,
      targetValue: null == targetValue
          ? _value.targetValue
          : targetValue // ignore: cast_nullable_to_non_nullable
              as int,
      unit: null == unit
          ? _value.unit
          : unit // ignore: cast_nullable_to_non_nullable
              as String,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      isActive: null == isActive
          ? _value.isActive
          : isActive // ignore: cast_nullable_to_non_nullable
              as bool,
      currentStreak: null == currentStreak
          ? _value.currentStreak
          : currentStreak // ignore: cast_nullable_to_non_nullable
              as int,
      longestStreak: null == longestStreak
          ? _value.longestStreak
          : longestStreak // ignore: cast_nullable_to_non_nullable
              as int,
      totalCompletions: null == totalCompletions
          ? _value.totalCompletions
          : totalCompletions // ignore: cast_nullable_to_non_nullable
              as int,
      weekdays: null == weekdays
          ? _value.weekdays
          : weekdays // ignore: cast_nullable_to_non_nullable
              as List<int>,
      customInterval: freezed == customInterval
          ? _value.customInterval
          : customInterval // ignore: cast_nullable_to_non_nullable
              as int?,
      lastCompletedAt: freezed == lastCompletedAt
          ? _value.lastCompletedAt
          : lastCompletedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      startDate: freezed == startDate
          ? _value.startDate
          : startDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      endDate: freezed == endDate
          ? _value.endDate
          : endDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      hasReminder: null == hasReminder
          ? _value.hasReminder
          : hasReminder // ignore: cast_nullable_to_non_nullable
              as bool,
      reminderTime: freezed == reminderTime
          ? _value.reminderTime
          : reminderTime // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      reminderMessage: null == reminderMessage
          ? _value.reminderMessage
          : reminderMessage // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$HabitImplCopyWith<$Res> implements $HabitCopyWith<$Res> {
  factory _$$HabitImplCopyWith(
          _$HabitImpl value, $Res Function(_$HabitImpl) then) =
      __$$HabitImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String name,
      String description,
      HabitType type,
      HabitFrequency frequency,
      HabitCategory category,
      List<String> tags,
      String icon,
      String color,
      int targetValue,
      String unit,
      DateTime createdAt,
      DateTime? updatedAt,
      bool isActive,
      int currentStreak,
      int longestStreak,
      int totalCompletions,
      List<int> weekdays,
      int? customInterval,
      DateTime? lastCompletedAt,
      DateTime? startDate,
      DateTime? endDate,
      bool hasReminder,
      DateTime? reminderTime,
      String reminderMessage});
}

/// @nodoc
class __$$HabitImplCopyWithImpl<$Res>
    extends _$HabitCopyWithImpl<$Res, _$HabitImpl>
    implements _$$HabitImplCopyWith<$Res> {
  __$$HabitImplCopyWithImpl(
      _$HabitImpl _value, $Res Function(_$HabitImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? description = null,
    Object? type = null,
    Object? frequency = null,
    Object? category = null,
    Object? tags = null,
    Object? icon = null,
    Object? color = null,
    Object? targetValue = null,
    Object? unit = null,
    Object? createdAt = null,
    Object? updatedAt = freezed,
    Object? isActive = null,
    Object? currentStreak = null,
    Object? longestStreak = null,
    Object? totalCompletions = null,
    Object? weekdays = null,
    Object? customInterval = freezed,
    Object? lastCompletedAt = freezed,
    Object? startDate = freezed,
    Object? endDate = freezed,
    Object? hasReminder = null,
    Object? reminderTime = freezed,
    Object? reminderMessage = null,
  }) {
    return _then(_$HabitImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as HabitType,
      frequency: null == frequency
          ? _value.frequency
          : frequency // ignore: cast_nullable_to_non_nullable
              as HabitFrequency,
      category: null == category
          ? _value.category
          : category // ignore: cast_nullable_to_non_nullable
              as HabitCategory,
      tags: null == tags
          ? _value._tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      icon: null == icon
          ? _value.icon
          : icon // ignore: cast_nullable_to_non_nullable
              as String,
      color: null == color
          ? _value.color
          : color // ignore: cast_nullable_to_non_nullable
              as String,
      targetValue: null == targetValue
          ? _value.targetValue
          : targetValue // ignore: cast_nullable_to_non_nullable
              as int,
      unit: null == unit
          ? _value.unit
          : unit // ignore: cast_nullable_to_non_nullable
              as String,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      isActive: null == isActive
          ? _value.isActive
          : isActive // ignore: cast_nullable_to_non_nullable
              as bool,
      currentStreak: null == currentStreak
          ? _value.currentStreak
          : currentStreak // ignore: cast_nullable_to_non_nullable
              as int,
      longestStreak: null == longestStreak
          ? _value.longestStreak
          : longestStreak // ignore: cast_nullable_to_non_nullable
              as int,
      totalCompletions: null == totalCompletions
          ? _value.totalCompletions
          : totalCompletions // ignore: cast_nullable_to_non_nullable
              as int,
      weekdays: null == weekdays
          ? _value._weekdays
          : weekdays // ignore: cast_nullable_to_non_nullable
              as List<int>,
      customInterval: freezed == customInterval
          ? _value.customInterval
          : customInterval // ignore: cast_nullable_to_non_nullable
              as int?,
      lastCompletedAt: freezed == lastCompletedAt
          ? _value.lastCompletedAt
          : lastCompletedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      startDate: freezed == startDate
          ? _value.startDate
          : startDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      endDate: freezed == endDate
          ? _value.endDate
          : endDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      hasReminder: null == hasReminder
          ? _value.hasReminder
          : hasReminder // ignore: cast_nullable_to_non_nullable
              as bool,
      reminderTime: freezed == reminderTime
          ? _value.reminderTime
          : reminderTime // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      reminderMessage: null == reminderMessage
          ? _value.reminderMessage
          : reminderMessage // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$HabitImpl implements _Habit {
  const _$HabitImpl(
      {required this.id,
      required this.name,
      required this.description,
      this.type = HabitType.simple,
      this.frequency = HabitFrequency.daily,
      this.category = HabitCategory.other,
      final List<String> tags = const [],
      this.icon = '',
      this.color = '#4A90E2',
      this.targetValue = 1,
      this.unit = '',
      required this.createdAt,
      this.updatedAt,
      this.isActive = true,
      this.currentStreak = 0,
      this.longestStreak = 0,
      this.totalCompletions = 0,
      final List<int> weekdays = const [],
      this.customInterval = null,
      this.lastCompletedAt = null,
      this.startDate = null,
      this.endDate = null,
      this.hasReminder = false,
      this.reminderTime = null,
      this.reminderMessage = ''})
      : _tags = tags,
        _weekdays = weekdays;

  factory _$HabitImpl.fromJson(Map<String, dynamic> json) =>
      _$$HabitImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String description;
  @override
  @JsonKey()
  final HabitType type;
  @override
  @JsonKey()
  final HabitFrequency frequency;
  @override
  @JsonKey()
  final HabitCategory category;
  final List<String> _tags;
  @override
  @JsonKey()
  List<String> get tags {
    if (_tags is EqualUnmodifiableListView) return _tags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_tags);
  }

  @override
  @JsonKey()
  final String icon;
  @override
  @JsonKey()
  final String color;
  @override
  @JsonKey()
  final int targetValue;
  @override
  @JsonKey()
  final String unit;
  @override
  final DateTime createdAt;
  @override
  final DateTime? updatedAt;
  @override
  @JsonKey()
  final bool isActive;
  @override
  @JsonKey()
  final int currentStreak;
  @override
  @JsonKey()
  final int longestStreak;
  @override
  @JsonKey()
  final int totalCompletions;
  final List<int> _weekdays;
  @override
  @JsonKey()
  List<int> get weekdays {
    if (_weekdays is EqualUnmodifiableListView) return _weekdays;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_weekdays);
  }

// For weekly habits: [1,2,3,4,5] = Mon-Fri
  @override
  @JsonKey()
  final int? customInterval;
// For custom frequency
  @override
  @JsonKey()
  final DateTime? lastCompletedAt;
  @override
  @JsonKey()
  final DateTime? startDate;
  @override
  @JsonKey()
  final DateTime? endDate;
  @override
  @JsonKey()
  final bool hasReminder;
  @override
  @JsonKey()
  final DateTime? reminderTime;
  @override
  @JsonKey()
  final String reminderMessage;

  @override
  String toString() {
    return 'Habit(id: $id, name: $name, description: $description, type: $type, frequency: $frequency, category: $category, tags: $tags, icon: $icon, color: $color, targetValue: $targetValue, unit: $unit, createdAt: $createdAt, updatedAt: $updatedAt, isActive: $isActive, currentStreak: $currentStreak, longestStreak: $longestStreak, totalCompletions: $totalCompletions, weekdays: $weekdays, customInterval: $customInterval, lastCompletedAt: $lastCompletedAt, startDate: $startDate, endDate: $endDate, hasReminder: $hasReminder, reminderTime: $reminderTime, reminderMessage: $reminderMessage)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$HabitImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.frequency, frequency) ||
                other.frequency == frequency) &&
            (identical(other.category, category) ||
                other.category == category) &&
            const DeepCollectionEquality().equals(other._tags, _tags) &&
            (identical(other.icon, icon) || other.icon == icon) &&
            (identical(other.color, color) || other.color == color) &&
            (identical(other.targetValue, targetValue) ||
                other.targetValue == targetValue) &&
            (identical(other.unit, unit) || other.unit == unit) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            (identical(other.isActive, isActive) ||
                other.isActive == isActive) &&
            (identical(other.currentStreak, currentStreak) ||
                other.currentStreak == currentStreak) &&
            (identical(other.longestStreak, longestStreak) ||
                other.longestStreak == longestStreak) &&
            (identical(other.totalCompletions, totalCompletions) ||
                other.totalCompletions == totalCompletions) &&
            const DeepCollectionEquality().equals(other._weekdays, _weekdays) &&
            (identical(other.customInterval, customInterval) ||
                other.customInterval == customInterval) &&
            (identical(other.lastCompletedAt, lastCompletedAt) ||
                other.lastCompletedAt == lastCompletedAt) &&
            (identical(other.startDate, startDate) ||
                other.startDate == startDate) &&
            (identical(other.endDate, endDate) || other.endDate == endDate) &&
            (identical(other.hasReminder, hasReminder) ||
                other.hasReminder == hasReminder) &&
            (identical(other.reminderTime, reminderTime) ||
                other.reminderTime == reminderTime) &&
            (identical(other.reminderMessage, reminderMessage) ||
                other.reminderMessage == reminderMessage));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hashAll([
        runtimeType,
        id,
        name,
        description,
        type,
        frequency,
        category,
        const DeepCollectionEquality().hash(_tags),
        icon,
        color,
        targetValue,
        unit,
        createdAt,
        updatedAt,
        isActive,
        currentStreak,
        longestStreak,
        totalCompletions,
        const DeepCollectionEquality().hash(_weekdays),
        customInterval,
        lastCompletedAt,
        startDate,
        endDate,
        hasReminder,
        reminderTime,
        reminderMessage
      ]);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$HabitImplCopyWith<_$HabitImpl> get copyWith =>
      __$$HabitImplCopyWithImpl<_$HabitImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$HabitImplToJson(
      this,
    );
  }
}

abstract class _Habit implements Habit {
  const factory _Habit(
      {required final String id,
      required final String name,
      required final String description,
      final HabitType type,
      final HabitFrequency frequency,
      final HabitCategory category,
      final List<String> tags,
      final String icon,
      final String color,
      final int targetValue,
      final String unit,
      required final DateTime createdAt,
      final DateTime? updatedAt,
      final bool isActive,
      final int currentStreak,
      final int longestStreak,
      final int totalCompletions,
      final List<int> weekdays,
      final int? customInterval,
      final DateTime? lastCompletedAt,
      final DateTime? startDate,
      final DateTime? endDate,
      final bool hasReminder,
      final DateTime? reminderTime,
      final String reminderMessage}) = _$HabitImpl;

  factory _Habit.fromJson(Map<String, dynamic> json) = _$HabitImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get description;
  @override
  HabitType get type;
  @override
  HabitFrequency get frequency;
  @override
  HabitCategory get category;
  @override
  List<String> get tags;
  @override
  String get icon;
  @override
  String get color;
  @override
  int get targetValue;
  @override
  String get unit;
  @override
  DateTime get createdAt;
  @override
  DateTime? get updatedAt;
  @override
  bool get isActive;
  @override
  int get currentStreak;
  @override
  int get longestStreak;
  @override
  int get totalCompletions;
  @override
  List<int> get weekdays;
  @override // For weekly habits: [1,2,3,4,5] = Mon-Fri
  int? get customInterval;
  @override // For custom frequency
  DateTime? get lastCompletedAt;
  @override
  DateTime? get startDate;
  @override
  DateTime? get endDate;
  @override
  bool get hasReminder;
  @override
  DateTime? get reminderTime;
  @override
  String get reminderMessage;
  @override
  @JsonKey(ignore: true)
  _$$HabitImplCopyWith<_$HabitImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

HabitCompletion _$HabitCompletionFromJson(Map<String, dynamic> json) {
  return _HabitCompletion.fromJson(json);
}

/// @nodoc
mixin _$HabitCompletion {
  String get id => throw _privateConstructorUsedError;
  String get habitId => throw _privateConstructorUsedError;
  DateTime get completedAt => throw _privateConstructorUsedError;
  int get value => throw _privateConstructorUsedError;
  String get notes => throw _privateConstructorUsedError;
  int? get duration =>
      throw _privateConstructorUsedError; // In minutes for time-based habits
  DateTime get createdAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $HabitCompletionCopyWith<HabitCompletion> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $HabitCompletionCopyWith<$Res> {
  factory $HabitCompletionCopyWith(
          HabitCompletion value, $Res Function(HabitCompletion) then) =
      _$HabitCompletionCopyWithImpl<$Res, HabitCompletion>;
  @useResult
  $Res call(
      {String id,
      String habitId,
      DateTime completedAt,
      int value,
      String notes,
      int? duration,
      DateTime createdAt});
}

/// @nodoc
class _$HabitCompletionCopyWithImpl<$Res, $Val extends HabitCompletion>
    implements $HabitCompletionCopyWith<$Res> {
  _$HabitCompletionCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? habitId = null,
    Object? completedAt = null,
    Object? value = null,
    Object? notes = null,
    Object? duration = freezed,
    Object? createdAt = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      habitId: null == habitId
          ? _value.habitId
          : habitId // ignore: cast_nullable_to_non_nullable
              as String,
      completedAt: null == completedAt
          ? _value.completedAt
          : completedAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      value: null == value
          ? _value.value
          : value // ignore: cast_nullable_to_non_nullable
              as int,
      notes: null == notes
          ? _value.notes
          : notes // ignore: cast_nullable_to_non_nullable
              as String,
      duration: freezed == duration
          ? _value.duration
          : duration // ignore: cast_nullable_to_non_nullable
              as int?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$HabitCompletionImplCopyWith<$Res>
    implements $HabitCompletionCopyWith<$Res> {
  factory _$$HabitCompletionImplCopyWith(_$HabitCompletionImpl value,
          $Res Function(_$HabitCompletionImpl) then) =
      __$$HabitCompletionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String habitId,
      DateTime completedAt,
      int value,
      String notes,
      int? duration,
      DateTime createdAt});
}

/// @nodoc
class __$$HabitCompletionImplCopyWithImpl<$Res>
    extends _$HabitCompletionCopyWithImpl<$Res, _$HabitCompletionImpl>
    implements _$$HabitCompletionImplCopyWith<$Res> {
  __$$HabitCompletionImplCopyWithImpl(
      _$HabitCompletionImpl _value, $Res Function(_$HabitCompletionImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? habitId = null,
    Object? completedAt = null,
    Object? value = null,
    Object? notes = null,
    Object? duration = freezed,
    Object? createdAt = null,
  }) {
    return _then(_$HabitCompletionImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      habitId: null == habitId
          ? _value.habitId
          : habitId // ignore: cast_nullable_to_non_nullable
              as String,
      completedAt: null == completedAt
          ? _value.completedAt
          : completedAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      value: null == value
          ? _value.value
          : value // ignore: cast_nullable_to_non_nullable
              as int,
      notes: null == notes
          ? _value.notes
          : notes // ignore: cast_nullable_to_non_nullable
              as String,
      duration: freezed == duration
          ? _value.duration
          : duration // ignore: cast_nullable_to_non_nullable
              as int?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$HabitCompletionImpl implements _HabitCompletion {
  const _$HabitCompletionImpl(
      {required this.id,
      required this.habitId,
      required this.completedAt,
      this.value = 1,
      this.notes = '',
      this.duration = null,
      required this.createdAt});

  factory _$HabitCompletionImpl.fromJson(Map<String, dynamic> json) =>
      _$$HabitCompletionImplFromJson(json);

  @override
  final String id;
  @override
  final String habitId;
  @override
  final DateTime completedAt;
  @override
  @JsonKey()
  final int value;
  @override
  @JsonKey()
  final String notes;
  @override
  @JsonKey()
  final int? duration;
// In minutes for time-based habits
  @override
  final DateTime createdAt;

  @override
  String toString() {
    return 'HabitCompletion(id: $id, habitId: $habitId, completedAt: $completedAt, value: $value, notes: $notes, duration: $duration, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$HabitCompletionImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.habitId, habitId) || other.habitId == habitId) &&
            (identical(other.completedAt, completedAt) ||
                other.completedAt == completedAt) &&
            (identical(other.value, value) || other.value == value) &&
            (identical(other.notes, notes) || other.notes == notes) &&
            (identical(other.duration, duration) ||
                other.duration == duration) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType, id, habitId, completedAt, value, notes, duration, createdAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$HabitCompletionImplCopyWith<_$HabitCompletionImpl> get copyWith =>
      __$$HabitCompletionImplCopyWithImpl<_$HabitCompletionImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$HabitCompletionImplToJson(
      this,
    );
  }
}

abstract class _HabitCompletion implements HabitCompletion {
  const factory _HabitCompletion(
      {required final String id,
      required final String habitId,
      required final DateTime completedAt,
      final int value,
      final String notes,
      final int? duration,
      required final DateTime createdAt}) = _$HabitCompletionImpl;

  factory _HabitCompletion.fromJson(Map<String, dynamic> json) =
      _$HabitCompletionImpl.fromJson;

  @override
  String get id;
  @override
  String get habitId;
  @override
  DateTime get completedAt;
  @override
  int get value;
  @override
  String get notes;
  @override
  int? get duration;
  @override // In minutes for time-based habits
  DateTime get createdAt;
  @override
  @JsonKey(ignore: true)
  _$$HabitCompletionImplCopyWith<_$HabitCompletionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

HabitStreak _$HabitStreakFromJson(Map<String, dynamic> json) {
  return _HabitStreak.fromJson(json);
}

/// @nodoc
mixin _$HabitStreak {
  String get id => throw _privateConstructorUsedError;
  String get habitId => throw _privateConstructorUsedError;
  DateTime get startDate => throw _privateConstructorUsedError;
  DateTime? get endDate => throw _privateConstructorUsedError;
  int get length => throw _privateConstructorUsedError;
  bool get isActive => throw _privateConstructorUsedError;
  DateTime get createdAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $HabitStreakCopyWith<HabitStreak> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $HabitStreakCopyWith<$Res> {
  factory $HabitStreakCopyWith(
          HabitStreak value, $Res Function(HabitStreak) then) =
      _$HabitStreakCopyWithImpl<$Res, HabitStreak>;
  @useResult
  $Res call(
      {String id,
      String habitId,
      DateTime startDate,
      DateTime? endDate,
      int length,
      bool isActive,
      DateTime createdAt});
}

/// @nodoc
class _$HabitStreakCopyWithImpl<$Res, $Val extends HabitStreak>
    implements $HabitStreakCopyWith<$Res> {
  _$HabitStreakCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? habitId = null,
    Object? startDate = null,
    Object? endDate = freezed,
    Object? length = null,
    Object? isActive = null,
    Object? createdAt = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      habitId: null == habitId
          ? _value.habitId
          : habitId // ignore: cast_nullable_to_non_nullable
              as String,
      startDate: null == startDate
          ? _value.startDate
          : startDate // ignore: cast_nullable_to_non_nullable
              as DateTime,
      endDate: freezed == endDate
          ? _value.endDate
          : endDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      length: null == length
          ? _value.length
          : length // ignore: cast_nullable_to_non_nullable
              as int,
      isActive: null == isActive
          ? _value.isActive
          : isActive // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$HabitStreakImplCopyWith<$Res>
    implements $HabitStreakCopyWith<$Res> {
  factory _$$HabitStreakImplCopyWith(
          _$HabitStreakImpl value, $Res Function(_$HabitStreakImpl) then) =
      __$$HabitStreakImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String habitId,
      DateTime startDate,
      DateTime? endDate,
      int length,
      bool isActive,
      DateTime createdAt});
}

/// @nodoc
class __$$HabitStreakImplCopyWithImpl<$Res>
    extends _$HabitStreakCopyWithImpl<$Res, _$HabitStreakImpl>
    implements _$$HabitStreakImplCopyWith<$Res> {
  __$$HabitStreakImplCopyWithImpl(
      _$HabitStreakImpl _value, $Res Function(_$HabitStreakImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? habitId = null,
    Object? startDate = null,
    Object? endDate = freezed,
    Object? length = null,
    Object? isActive = null,
    Object? createdAt = null,
  }) {
    return _then(_$HabitStreakImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      habitId: null == habitId
          ? _value.habitId
          : habitId // ignore: cast_nullable_to_non_nullable
              as String,
      startDate: null == startDate
          ? _value.startDate
          : startDate // ignore: cast_nullable_to_non_nullable
              as DateTime,
      endDate: freezed == endDate
          ? _value.endDate
          : endDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      length: null == length
          ? _value.length
          : length // ignore: cast_nullable_to_non_nullable
              as int,
      isActive: null == isActive
          ? _value.isActive
          : isActive // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$HabitStreakImpl implements _HabitStreak {
  const _$HabitStreakImpl(
      {required this.id,
      required this.habitId,
      required this.startDate,
      this.endDate,
      this.length = 1,
      this.isActive = false,
      required this.createdAt});

  factory _$HabitStreakImpl.fromJson(Map<String, dynamic> json) =>
      _$$HabitStreakImplFromJson(json);

  @override
  final String id;
  @override
  final String habitId;
  @override
  final DateTime startDate;
  @override
  final DateTime? endDate;
  @override
  @JsonKey()
  final int length;
  @override
  @JsonKey()
  final bool isActive;
  @override
  final DateTime createdAt;

  @override
  String toString() {
    return 'HabitStreak(id: $id, habitId: $habitId, startDate: $startDate, endDate: $endDate, length: $length, isActive: $isActive, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$HabitStreakImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.habitId, habitId) || other.habitId == habitId) &&
            (identical(other.startDate, startDate) ||
                other.startDate == startDate) &&
            (identical(other.endDate, endDate) || other.endDate == endDate) &&
            (identical(other.length, length) || other.length == length) &&
            (identical(other.isActive, isActive) ||
                other.isActive == isActive) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, habitId, startDate, endDate,
      length, isActive, createdAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$HabitStreakImplCopyWith<_$HabitStreakImpl> get copyWith =>
      __$$HabitStreakImplCopyWithImpl<_$HabitStreakImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$HabitStreakImplToJson(
      this,
    );
  }
}

abstract class _HabitStreak implements HabitStreak {
  const factory _HabitStreak(
      {required final String id,
      required final String habitId,
      required final DateTime startDate,
      final DateTime? endDate,
      final int length,
      final bool isActive,
      required final DateTime createdAt}) = _$HabitStreakImpl;

  factory _HabitStreak.fromJson(Map<String, dynamic> json) =
      _$HabitStreakImpl.fromJson;

  @override
  String get id;
  @override
  String get habitId;
  @override
  DateTime get startDate;
  @override
  DateTime? get endDate;
  @override
  int get length;
  @override
  bool get isActive;
  @override
  DateTime get createdAt;
  @override
  @JsonKey(ignore: true)
  _$$HabitStreakImplCopyWith<_$HabitStreakImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

HabitAchievement _$HabitAchievementFromJson(Map<String, dynamic> json) {
  return _HabitAchievement.fromJson(json);
}

/// @nodoc
mixin _$HabitAchievement {
  String get id => throw _privateConstructorUsedError;
  String get habitId => throw _privateConstructorUsedError;
  String get type =>
      throw _privateConstructorUsedError; // 'streak', 'completion', 'consistency'
  String get title => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  int get threshold => throw _privateConstructorUsedError;
  DateTime get unlockedAt => throw _privateConstructorUsedError;
  String get icon => throw _privateConstructorUsedError;
  bool get isShown => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $HabitAchievementCopyWith<HabitAchievement> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $HabitAchievementCopyWith<$Res> {
  factory $HabitAchievementCopyWith(
          HabitAchievement value, $Res Function(HabitAchievement) then) =
      _$HabitAchievementCopyWithImpl<$Res, HabitAchievement>;
  @useResult
  $Res call(
      {String id,
      String habitId,
      String type,
      String title,
      String description,
      int threshold,
      DateTime unlockedAt,
      String icon,
      bool isShown});
}

/// @nodoc
class _$HabitAchievementCopyWithImpl<$Res, $Val extends HabitAchievement>
    implements $HabitAchievementCopyWith<$Res> {
  _$HabitAchievementCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? habitId = null,
    Object? type = null,
    Object? title = null,
    Object? description = null,
    Object? threshold = null,
    Object? unlockedAt = null,
    Object? icon = null,
    Object? isShown = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      habitId: null == habitId
          ? _value.habitId
          : habitId // ignore: cast_nullable_to_non_nullable
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
      threshold: null == threshold
          ? _value.threshold
          : threshold // ignore: cast_nullable_to_non_nullable
              as int,
      unlockedAt: null == unlockedAt
          ? _value.unlockedAt
          : unlockedAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      icon: null == icon
          ? _value.icon
          : icon // ignore: cast_nullable_to_non_nullable
              as String,
      isShown: null == isShown
          ? _value.isShown
          : isShown // ignore: cast_nullable_to_non_nullable
              as bool,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$HabitAchievementImplCopyWith<$Res>
    implements $HabitAchievementCopyWith<$Res> {
  factory _$$HabitAchievementImplCopyWith(_$HabitAchievementImpl value,
          $Res Function(_$HabitAchievementImpl) then) =
      __$$HabitAchievementImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String habitId,
      String type,
      String title,
      String description,
      int threshold,
      DateTime unlockedAt,
      String icon,
      bool isShown});
}

/// @nodoc
class __$$HabitAchievementImplCopyWithImpl<$Res>
    extends _$HabitAchievementCopyWithImpl<$Res, _$HabitAchievementImpl>
    implements _$$HabitAchievementImplCopyWith<$Res> {
  __$$HabitAchievementImplCopyWithImpl(_$HabitAchievementImpl _value,
      $Res Function(_$HabitAchievementImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? habitId = null,
    Object? type = null,
    Object? title = null,
    Object? description = null,
    Object? threshold = null,
    Object? unlockedAt = null,
    Object? icon = null,
    Object? isShown = null,
  }) {
    return _then(_$HabitAchievementImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      habitId: null == habitId
          ? _value.habitId
          : habitId // ignore: cast_nullable_to_non_nullable
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
      threshold: null == threshold
          ? _value.threshold
          : threshold // ignore: cast_nullable_to_non_nullable
              as int,
      unlockedAt: null == unlockedAt
          ? _value.unlockedAt
          : unlockedAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      icon: null == icon
          ? _value.icon
          : icon // ignore: cast_nullable_to_non_nullable
              as String,
      isShown: null == isShown
          ? _value.isShown
          : isShown // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$HabitAchievementImpl implements _HabitAchievement {
  const _$HabitAchievementImpl(
      {required this.id,
      required this.habitId,
      required this.type,
      required this.title,
      required this.description,
      required this.threshold,
      required this.unlockedAt,
      this.icon = '',
      this.isShown = false});

  factory _$HabitAchievementImpl.fromJson(Map<String, dynamic> json) =>
      _$$HabitAchievementImplFromJson(json);

  @override
  final String id;
  @override
  final String habitId;
  @override
  final String type;
// 'streak', 'completion', 'consistency'
  @override
  final String title;
  @override
  final String description;
  @override
  final int threshold;
  @override
  final DateTime unlockedAt;
  @override
  @JsonKey()
  final String icon;
  @override
  @JsonKey()
  final bool isShown;

  @override
  String toString() {
    return 'HabitAchievement(id: $id, habitId: $habitId, type: $type, title: $title, description: $description, threshold: $threshold, unlockedAt: $unlockedAt, icon: $icon, isShown: $isShown)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$HabitAchievementImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.habitId, habitId) || other.habitId == habitId) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.threshold, threshold) ||
                other.threshold == threshold) &&
            (identical(other.unlockedAt, unlockedAt) ||
                other.unlockedAt == unlockedAt) &&
            (identical(other.icon, icon) || other.icon == icon) &&
            (identical(other.isShown, isShown) || other.isShown == isShown));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, habitId, type, title,
      description, threshold, unlockedAt, icon, isShown);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$HabitAchievementImplCopyWith<_$HabitAchievementImpl> get copyWith =>
      __$$HabitAchievementImplCopyWithImpl<_$HabitAchievementImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$HabitAchievementImplToJson(
      this,
    );
  }
}

abstract class _HabitAchievement implements HabitAchievement {
  const factory _HabitAchievement(
      {required final String id,
      required final String habitId,
      required final String type,
      required final String title,
      required final String description,
      required final int threshold,
      required final DateTime unlockedAt,
      final String icon,
      final bool isShown}) = _$HabitAchievementImpl;

  factory _HabitAchievement.fromJson(Map<String, dynamic> json) =
      _$HabitAchievementImpl.fromJson;

  @override
  String get id;
  @override
  String get habitId;
  @override
  String get type;
  @override // 'streak', 'completion', 'consistency'
  String get title;
  @override
  String get description;
  @override
  int get threshold;
  @override
  DateTime get unlockedAt;
  @override
  String get icon;
  @override
  bool get isShown;
  @override
  @JsonKey(ignore: true)
  _$$HabitAchievementImplCopyWith<_$HabitAchievementImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
mixin _$HabitState {
  List<Habit> get habits => throw _privateConstructorUsedError;
  List<HabitCompletion> get completions => throw _privateConstructorUsedError;
  List<HabitStreak> get streaks => throw _privateConstructorUsedError;
  List<HabitAchievement> get achievements => throw _privateConstructorUsedError;
  bool get isLoading => throw _privateConstructorUsedError;
  bool get isSaving => throw _privateConstructorUsedError;
  String? get error => throw _privateConstructorUsedError;
  Habit? get selectedHabit => throw _privateConstructorUsedError;
  DateTime? get selectedDate => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $HabitStateCopyWith<HabitState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $HabitStateCopyWith<$Res> {
  factory $HabitStateCopyWith(
          HabitState value, $Res Function(HabitState) then) =
      _$HabitStateCopyWithImpl<$Res, HabitState>;
  @useResult
  $Res call(
      {List<Habit> habits,
      List<HabitCompletion> completions,
      List<HabitStreak> streaks,
      List<HabitAchievement> achievements,
      bool isLoading,
      bool isSaving,
      String? error,
      Habit? selectedHabit,
      DateTime? selectedDate});

  $HabitCopyWith<$Res>? get selectedHabit;
}

/// @nodoc
class _$HabitStateCopyWithImpl<$Res, $Val extends HabitState>
    implements $HabitStateCopyWith<$Res> {
  _$HabitStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? habits = null,
    Object? completions = null,
    Object? streaks = null,
    Object? achievements = null,
    Object? isLoading = null,
    Object? isSaving = null,
    Object? error = freezed,
    Object? selectedHabit = freezed,
    Object? selectedDate = freezed,
  }) {
    return _then(_value.copyWith(
      habits: null == habits
          ? _value.habits
          : habits // ignore: cast_nullable_to_non_nullable
              as List<Habit>,
      completions: null == completions
          ? _value.completions
          : completions // ignore: cast_nullable_to_non_nullable
              as List<HabitCompletion>,
      streaks: null == streaks
          ? _value.streaks
          : streaks // ignore: cast_nullable_to_non_nullable
              as List<HabitStreak>,
      achievements: null == achievements
          ? _value.achievements
          : achievements // ignore: cast_nullable_to_non_nullable
              as List<HabitAchievement>,
      isLoading: null == isLoading
          ? _value.isLoading
          : isLoading // ignore: cast_nullable_to_non_nullable
              as bool,
      isSaving: null == isSaving
          ? _value.isSaving
          : isSaving // ignore: cast_nullable_to_non_nullable
              as bool,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
      selectedHabit: freezed == selectedHabit
          ? _value.selectedHabit
          : selectedHabit // ignore: cast_nullable_to_non_nullable
              as Habit?,
      selectedDate: freezed == selectedDate
          ? _value.selectedDate
          : selectedDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $HabitCopyWith<$Res>? get selectedHabit {
    if (_value.selectedHabit == null) {
      return null;
    }

    return $HabitCopyWith<$Res>(_value.selectedHabit!, (value) {
      return _then(_value.copyWith(selectedHabit: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$HabitStateImplCopyWith<$Res>
    implements $HabitStateCopyWith<$Res> {
  factory _$$HabitStateImplCopyWith(
          _$HabitStateImpl value, $Res Function(_$HabitStateImpl) then) =
      __$$HabitStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {List<Habit> habits,
      List<HabitCompletion> completions,
      List<HabitStreak> streaks,
      List<HabitAchievement> achievements,
      bool isLoading,
      bool isSaving,
      String? error,
      Habit? selectedHabit,
      DateTime? selectedDate});

  @override
  $HabitCopyWith<$Res>? get selectedHabit;
}

/// @nodoc
class __$$HabitStateImplCopyWithImpl<$Res>
    extends _$HabitStateCopyWithImpl<$Res, _$HabitStateImpl>
    implements _$$HabitStateImplCopyWith<$Res> {
  __$$HabitStateImplCopyWithImpl(
      _$HabitStateImpl _value, $Res Function(_$HabitStateImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? habits = null,
    Object? completions = null,
    Object? streaks = null,
    Object? achievements = null,
    Object? isLoading = null,
    Object? isSaving = null,
    Object? error = freezed,
    Object? selectedHabit = freezed,
    Object? selectedDate = freezed,
  }) {
    return _then(_$HabitStateImpl(
      habits: null == habits
          ? _value._habits
          : habits // ignore: cast_nullable_to_non_nullable
              as List<Habit>,
      completions: null == completions
          ? _value._completions
          : completions // ignore: cast_nullable_to_non_nullable
              as List<HabitCompletion>,
      streaks: null == streaks
          ? _value._streaks
          : streaks // ignore: cast_nullable_to_non_nullable
              as List<HabitStreak>,
      achievements: null == achievements
          ? _value._achievements
          : achievements // ignore: cast_nullable_to_non_nullable
              as List<HabitAchievement>,
      isLoading: null == isLoading
          ? _value.isLoading
          : isLoading // ignore: cast_nullable_to_non_nullable
              as bool,
      isSaving: null == isSaving
          ? _value.isSaving
          : isSaving // ignore: cast_nullable_to_non_nullable
              as bool,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
      selectedHabit: freezed == selectedHabit
          ? _value.selectedHabit
          : selectedHabit // ignore: cast_nullable_to_non_nullable
              as Habit?,
      selectedDate: freezed == selectedDate
          ? _value.selectedDate
          : selectedDate // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc

class _$HabitStateImpl implements _HabitState {
  const _$HabitStateImpl(
      {final List<Habit> habits = const [],
      final List<HabitCompletion> completions = const [],
      final List<HabitStreak> streaks = const [],
      final List<HabitAchievement> achievements = const [],
      this.isLoading = false,
      this.isSaving = false,
      this.error,
      this.selectedHabit,
      this.selectedDate = null})
      : _habits = habits,
        _completions = completions,
        _streaks = streaks,
        _achievements = achievements;

  final List<Habit> _habits;
  @override
  @JsonKey()
  List<Habit> get habits {
    if (_habits is EqualUnmodifiableListView) return _habits;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_habits);
  }

  final List<HabitCompletion> _completions;
  @override
  @JsonKey()
  List<HabitCompletion> get completions {
    if (_completions is EqualUnmodifiableListView) return _completions;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_completions);
  }

  final List<HabitStreak> _streaks;
  @override
  @JsonKey()
  List<HabitStreak> get streaks {
    if (_streaks is EqualUnmodifiableListView) return _streaks;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_streaks);
  }

  final List<HabitAchievement> _achievements;
  @override
  @JsonKey()
  List<HabitAchievement> get achievements {
    if (_achievements is EqualUnmodifiableListView) return _achievements;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_achievements);
  }

  @override
  @JsonKey()
  final bool isLoading;
  @override
  @JsonKey()
  final bool isSaving;
  @override
  final String? error;
  @override
  final Habit? selectedHabit;
  @override
  @JsonKey()
  final DateTime? selectedDate;

  @override
  String toString() {
    return 'HabitState(habits: $habits, completions: $completions, streaks: $streaks, achievements: $achievements, isLoading: $isLoading, isSaving: $isSaving, error: $error, selectedHabit: $selectedHabit, selectedDate: $selectedDate)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$HabitStateImpl &&
            const DeepCollectionEquality().equals(other._habits, _habits) &&
            const DeepCollectionEquality()
                .equals(other._completions, _completions) &&
            const DeepCollectionEquality().equals(other._streaks, _streaks) &&
            const DeepCollectionEquality()
                .equals(other._achievements, _achievements) &&
            (identical(other.isLoading, isLoading) ||
                other.isLoading == isLoading) &&
            (identical(other.isSaving, isSaving) ||
                other.isSaving == isSaving) &&
            (identical(other.error, error) || other.error == error) &&
            (identical(other.selectedHabit, selectedHabit) ||
                other.selectedHabit == selectedHabit) &&
            (identical(other.selectedDate, selectedDate) ||
                other.selectedDate == selectedDate));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      const DeepCollectionEquality().hash(_habits),
      const DeepCollectionEquality().hash(_completions),
      const DeepCollectionEquality().hash(_streaks),
      const DeepCollectionEquality().hash(_achievements),
      isLoading,
      isSaving,
      error,
      selectedHabit,
      selectedDate);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$HabitStateImplCopyWith<_$HabitStateImpl> get copyWith =>
      __$$HabitStateImplCopyWithImpl<_$HabitStateImpl>(this, _$identity);
}

abstract class _HabitState implements HabitState {
  const factory _HabitState(
      {final List<Habit> habits,
      final List<HabitCompletion> completions,
      final List<HabitStreak> streaks,
      final List<HabitAchievement> achievements,
      final bool isLoading,
      final bool isSaving,
      final String? error,
      final Habit? selectedHabit,
      final DateTime? selectedDate}) = _$HabitStateImpl;

  @override
  List<Habit> get habits;
  @override
  List<HabitCompletion> get completions;
  @override
  List<HabitStreak> get streaks;
  @override
  List<HabitAchievement> get achievements;
  @override
  bool get isLoading;
  @override
  bool get isSaving;
  @override
  String? get error;
  @override
  Habit? get selectedHabit;
  @override
  DateTime? get selectedDate;
  @override
  @JsonKey(ignore: true)
  _$$HabitStateImplCopyWith<_$HabitStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
