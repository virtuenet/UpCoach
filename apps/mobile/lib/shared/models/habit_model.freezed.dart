// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'habit_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Habit {

 String get id; String get name; String get description; HabitType get type; HabitFrequency get frequency; HabitCategory get category; List<String> get tags; String get icon; String get color; int get targetValue; String get unit; DateTime get createdAt; DateTime? get updatedAt; bool get isActive; int get currentStreak; int get longestStreak; int get totalCompletions; List<int> get weekdays;// For weekly habits: [1,2,3,4,5] = Mon-Fri
 int? get customInterval;// For custom frequency
 DateTime? get lastCompletedAt; DateTime? get startDate; DateTime? get endDate; bool get hasReminder; DateTime? get reminderTime; String get reminderMessage;
/// Create a copy of Habit
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$HabitCopyWith<Habit> get copyWith => _$HabitCopyWithImpl<Habit>(this as Habit, _$identity);

  /// Serializes this Habit to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Habit&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.description, description) || other.description == description)&&(identical(other.type, type) || other.type == type)&&(identical(other.frequency, frequency) || other.frequency == frequency)&&(identical(other.category, category) || other.category == category)&&const DeepCollectionEquality().equals(other.tags, tags)&&(identical(other.icon, icon) || other.icon == icon)&&(identical(other.color, color) || other.color == color)&&(identical(other.targetValue, targetValue) || other.targetValue == targetValue)&&(identical(other.unit, unit) || other.unit == unit)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.currentStreak, currentStreak) || other.currentStreak == currentStreak)&&(identical(other.longestStreak, longestStreak) || other.longestStreak == longestStreak)&&(identical(other.totalCompletions, totalCompletions) || other.totalCompletions == totalCompletions)&&const DeepCollectionEquality().equals(other.weekdays, weekdays)&&(identical(other.customInterval, customInterval) || other.customInterval == customInterval)&&(identical(other.lastCompletedAt, lastCompletedAt) || other.lastCompletedAt == lastCompletedAt)&&(identical(other.startDate, startDate) || other.startDate == startDate)&&(identical(other.endDate, endDate) || other.endDate == endDate)&&(identical(other.hasReminder, hasReminder) || other.hasReminder == hasReminder)&&(identical(other.reminderTime, reminderTime) || other.reminderTime == reminderTime)&&(identical(other.reminderMessage, reminderMessage) || other.reminderMessage == reminderMessage));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,name,description,type,frequency,category,const DeepCollectionEquality().hash(tags),icon,color,targetValue,unit,createdAt,updatedAt,isActive,currentStreak,longestStreak,totalCompletions,const DeepCollectionEquality().hash(weekdays),customInterval,lastCompletedAt,startDate,endDate,hasReminder,reminderTime,reminderMessage]);

@override
String toString() {
  return 'Habit(id: $id, name: $name, description: $description, type: $type, frequency: $frequency, category: $category, tags: $tags, icon: $icon, color: $color, targetValue: $targetValue, unit: $unit, createdAt: $createdAt, updatedAt: $updatedAt, isActive: $isActive, currentStreak: $currentStreak, longestStreak: $longestStreak, totalCompletions: $totalCompletions, weekdays: $weekdays, customInterval: $customInterval, lastCompletedAt: $lastCompletedAt, startDate: $startDate, endDate: $endDate, hasReminder: $hasReminder, reminderTime: $reminderTime, reminderMessage: $reminderMessage)';
}


}

/// @nodoc
abstract mixin class $HabitCopyWith<$Res>  {
  factory $HabitCopyWith(Habit value, $Res Function(Habit) _then) = _$HabitCopyWithImpl;
@useResult
$Res call({
 String id, String name, String description, HabitType type, HabitFrequency frequency, HabitCategory category, List<String> tags, String icon, String color, int targetValue, String unit, DateTime createdAt, DateTime? updatedAt, bool isActive, int currentStreak, int longestStreak, int totalCompletions, List<int> weekdays, int? customInterval, DateTime? lastCompletedAt, DateTime? startDate, DateTime? endDate, bool hasReminder, DateTime? reminderTime, String reminderMessage
});




}
/// @nodoc
class _$HabitCopyWithImpl<$Res>
    implements $HabitCopyWith<$Res> {
  _$HabitCopyWithImpl(this._self, this._then);

  final Habit _self;
  final $Res Function(Habit) _then;

/// Create a copy of Habit
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? description = null,Object? type = null,Object? frequency = null,Object? category = null,Object? tags = null,Object? icon = null,Object? color = null,Object? targetValue = null,Object? unit = null,Object? createdAt = null,Object? updatedAt = freezed,Object? isActive = null,Object? currentStreak = null,Object? longestStreak = null,Object? totalCompletions = null,Object? weekdays = null,Object? customInterval = freezed,Object? lastCompletedAt = freezed,Object? startDate = freezed,Object? endDate = freezed,Object? hasReminder = null,Object? reminderTime = freezed,Object? reminderMessage = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as HabitType,frequency: null == frequency ? _self.frequency : frequency // ignore: cast_nullable_to_non_nullable
as HabitFrequency,category: null == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as HabitCategory,tags: null == tags ? _self.tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,icon: null == icon ? _self.icon : icon // ignore: cast_nullable_to_non_nullable
as String,color: null == color ? _self.color : color // ignore: cast_nullable_to_non_nullable
as String,targetValue: null == targetValue ? _self.targetValue : targetValue // ignore: cast_nullable_to_non_nullable
as int,unit: null == unit ? _self.unit : unit // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,currentStreak: null == currentStreak ? _self.currentStreak : currentStreak // ignore: cast_nullable_to_non_nullable
as int,longestStreak: null == longestStreak ? _self.longestStreak : longestStreak // ignore: cast_nullable_to_non_nullable
as int,totalCompletions: null == totalCompletions ? _self.totalCompletions : totalCompletions // ignore: cast_nullable_to_non_nullable
as int,weekdays: null == weekdays ? _self.weekdays : weekdays // ignore: cast_nullable_to_non_nullable
as List<int>,customInterval: freezed == customInterval ? _self.customInterval : customInterval // ignore: cast_nullable_to_non_nullable
as int?,lastCompletedAt: freezed == lastCompletedAt ? _self.lastCompletedAt : lastCompletedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,startDate: freezed == startDate ? _self.startDate : startDate // ignore: cast_nullable_to_non_nullable
as DateTime?,endDate: freezed == endDate ? _self.endDate : endDate // ignore: cast_nullable_to_non_nullable
as DateTime?,hasReminder: null == hasReminder ? _self.hasReminder : hasReminder // ignore: cast_nullable_to_non_nullable
as bool,reminderTime: freezed == reminderTime ? _self.reminderTime : reminderTime // ignore: cast_nullable_to_non_nullable
as DateTime?,reminderMessage: null == reminderMessage ? _self.reminderMessage : reminderMessage // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [Habit].
extension HabitPatterns on Habit {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Habit value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Habit() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Habit value)  $default,){
final _that = this;
switch (_that) {
case _Habit():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Habit value)?  $default,){
final _that = this;
switch (_that) {
case _Habit() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String name,  String description,  HabitType type,  HabitFrequency frequency,  HabitCategory category,  List<String> tags,  String icon,  String color,  int targetValue,  String unit,  DateTime createdAt,  DateTime? updatedAt,  bool isActive,  int currentStreak,  int longestStreak,  int totalCompletions,  List<int> weekdays,  int? customInterval,  DateTime? lastCompletedAt,  DateTime? startDate,  DateTime? endDate,  bool hasReminder,  DateTime? reminderTime,  String reminderMessage)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Habit() when $default != null:
return $default(_that.id,_that.name,_that.description,_that.type,_that.frequency,_that.category,_that.tags,_that.icon,_that.color,_that.targetValue,_that.unit,_that.createdAt,_that.updatedAt,_that.isActive,_that.currentStreak,_that.longestStreak,_that.totalCompletions,_that.weekdays,_that.customInterval,_that.lastCompletedAt,_that.startDate,_that.endDate,_that.hasReminder,_that.reminderTime,_that.reminderMessage);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String name,  String description,  HabitType type,  HabitFrequency frequency,  HabitCategory category,  List<String> tags,  String icon,  String color,  int targetValue,  String unit,  DateTime createdAt,  DateTime? updatedAt,  bool isActive,  int currentStreak,  int longestStreak,  int totalCompletions,  List<int> weekdays,  int? customInterval,  DateTime? lastCompletedAt,  DateTime? startDate,  DateTime? endDate,  bool hasReminder,  DateTime? reminderTime,  String reminderMessage)  $default,) {final _that = this;
switch (_that) {
case _Habit():
return $default(_that.id,_that.name,_that.description,_that.type,_that.frequency,_that.category,_that.tags,_that.icon,_that.color,_that.targetValue,_that.unit,_that.createdAt,_that.updatedAt,_that.isActive,_that.currentStreak,_that.longestStreak,_that.totalCompletions,_that.weekdays,_that.customInterval,_that.lastCompletedAt,_that.startDate,_that.endDate,_that.hasReminder,_that.reminderTime,_that.reminderMessage);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String name,  String description,  HabitType type,  HabitFrequency frequency,  HabitCategory category,  List<String> tags,  String icon,  String color,  int targetValue,  String unit,  DateTime createdAt,  DateTime? updatedAt,  bool isActive,  int currentStreak,  int longestStreak,  int totalCompletions,  List<int> weekdays,  int? customInterval,  DateTime? lastCompletedAt,  DateTime? startDate,  DateTime? endDate,  bool hasReminder,  DateTime? reminderTime,  String reminderMessage)?  $default,) {final _that = this;
switch (_that) {
case _Habit() when $default != null:
return $default(_that.id,_that.name,_that.description,_that.type,_that.frequency,_that.category,_that.tags,_that.icon,_that.color,_that.targetValue,_that.unit,_that.createdAt,_that.updatedAt,_that.isActive,_that.currentStreak,_that.longestStreak,_that.totalCompletions,_that.weekdays,_that.customInterval,_that.lastCompletedAt,_that.startDate,_that.endDate,_that.hasReminder,_that.reminderTime,_that.reminderMessage);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Habit implements Habit {
  const _Habit({required this.id, required this.name, required this.description, this.type = HabitType.simple, this.frequency = HabitFrequency.daily, this.category = HabitCategory.other, final  List<String> tags = const [], this.icon = '', this.color = '#4A90E2', this.targetValue = 1, this.unit = '', required this.createdAt, this.updatedAt, this.isActive = true, this.currentStreak = 0, this.longestStreak = 0, this.totalCompletions = 0, final  List<int> weekdays = const [], this.customInterval, this.lastCompletedAt, this.startDate, this.endDate, this.hasReminder = false, this.reminderTime, this.reminderMessage = ''}): _tags = tags,_weekdays = weekdays;
  factory _Habit.fromJson(Map<String, dynamic> json) => _$HabitFromJson(json);

@override final  String id;
@override final  String name;
@override final  String description;
@override@JsonKey() final  HabitType type;
@override@JsonKey() final  HabitFrequency frequency;
@override@JsonKey() final  HabitCategory category;
 final  List<String> _tags;
@override@JsonKey() List<String> get tags {
  if (_tags is EqualUnmodifiableListView) return _tags;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_tags);
}

@override@JsonKey() final  String icon;
@override@JsonKey() final  String color;
@override@JsonKey() final  int targetValue;
@override@JsonKey() final  String unit;
@override final  DateTime createdAt;
@override final  DateTime? updatedAt;
@override@JsonKey() final  bool isActive;
@override@JsonKey() final  int currentStreak;
@override@JsonKey() final  int longestStreak;
@override@JsonKey() final  int totalCompletions;
 final  List<int> _weekdays;
@override@JsonKey() List<int> get weekdays {
  if (_weekdays is EqualUnmodifiableListView) return _weekdays;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_weekdays);
}

// For weekly habits: [1,2,3,4,5] = Mon-Fri
@override final  int? customInterval;
// For custom frequency
@override final  DateTime? lastCompletedAt;
@override final  DateTime? startDate;
@override final  DateTime? endDate;
@override@JsonKey() final  bool hasReminder;
@override final  DateTime? reminderTime;
@override@JsonKey() final  String reminderMessage;

/// Create a copy of Habit
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$HabitCopyWith<_Habit> get copyWith => __$HabitCopyWithImpl<_Habit>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$HabitToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Habit&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.description, description) || other.description == description)&&(identical(other.type, type) || other.type == type)&&(identical(other.frequency, frequency) || other.frequency == frequency)&&(identical(other.category, category) || other.category == category)&&const DeepCollectionEquality().equals(other._tags, _tags)&&(identical(other.icon, icon) || other.icon == icon)&&(identical(other.color, color) || other.color == color)&&(identical(other.targetValue, targetValue) || other.targetValue == targetValue)&&(identical(other.unit, unit) || other.unit == unit)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.currentStreak, currentStreak) || other.currentStreak == currentStreak)&&(identical(other.longestStreak, longestStreak) || other.longestStreak == longestStreak)&&(identical(other.totalCompletions, totalCompletions) || other.totalCompletions == totalCompletions)&&const DeepCollectionEquality().equals(other._weekdays, _weekdays)&&(identical(other.customInterval, customInterval) || other.customInterval == customInterval)&&(identical(other.lastCompletedAt, lastCompletedAt) || other.lastCompletedAt == lastCompletedAt)&&(identical(other.startDate, startDate) || other.startDate == startDate)&&(identical(other.endDate, endDate) || other.endDate == endDate)&&(identical(other.hasReminder, hasReminder) || other.hasReminder == hasReminder)&&(identical(other.reminderTime, reminderTime) || other.reminderTime == reminderTime)&&(identical(other.reminderMessage, reminderMessage) || other.reminderMessage == reminderMessage));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,name,description,type,frequency,category,const DeepCollectionEquality().hash(_tags),icon,color,targetValue,unit,createdAt,updatedAt,isActive,currentStreak,longestStreak,totalCompletions,const DeepCollectionEquality().hash(_weekdays),customInterval,lastCompletedAt,startDate,endDate,hasReminder,reminderTime,reminderMessage]);

@override
String toString() {
  return 'Habit(id: $id, name: $name, description: $description, type: $type, frequency: $frequency, category: $category, tags: $tags, icon: $icon, color: $color, targetValue: $targetValue, unit: $unit, createdAt: $createdAt, updatedAt: $updatedAt, isActive: $isActive, currentStreak: $currentStreak, longestStreak: $longestStreak, totalCompletions: $totalCompletions, weekdays: $weekdays, customInterval: $customInterval, lastCompletedAt: $lastCompletedAt, startDate: $startDate, endDate: $endDate, hasReminder: $hasReminder, reminderTime: $reminderTime, reminderMessage: $reminderMessage)';
}


}

/// @nodoc
abstract mixin class _$HabitCopyWith<$Res> implements $HabitCopyWith<$Res> {
  factory _$HabitCopyWith(_Habit value, $Res Function(_Habit) _then) = __$HabitCopyWithImpl;
@override @useResult
$Res call({
 String id, String name, String description, HabitType type, HabitFrequency frequency, HabitCategory category, List<String> tags, String icon, String color, int targetValue, String unit, DateTime createdAt, DateTime? updatedAt, bool isActive, int currentStreak, int longestStreak, int totalCompletions, List<int> weekdays, int? customInterval, DateTime? lastCompletedAt, DateTime? startDate, DateTime? endDate, bool hasReminder, DateTime? reminderTime, String reminderMessage
});




}
/// @nodoc
class __$HabitCopyWithImpl<$Res>
    implements _$HabitCopyWith<$Res> {
  __$HabitCopyWithImpl(this._self, this._then);

  final _Habit _self;
  final $Res Function(_Habit) _then;

/// Create a copy of Habit
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? description = null,Object? type = null,Object? frequency = null,Object? category = null,Object? tags = null,Object? icon = null,Object? color = null,Object? targetValue = null,Object? unit = null,Object? createdAt = null,Object? updatedAt = freezed,Object? isActive = null,Object? currentStreak = null,Object? longestStreak = null,Object? totalCompletions = null,Object? weekdays = null,Object? customInterval = freezed,Object? lastCompletedAt = freezed,Object? startDate = freezed,Object? endDate = freezed,Object? hasReminder = null,Object? reminderTime = freezed,Object? reminderMessage = null,}) {
  return _then(_Habit(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as HabitType,frequency: null == frequency ? _self.frequency : frequency // ignore: cast_nullable_to_non_nullable
as HabitFrequency,category: null == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as HabitCategory,tags: null == tags ? _self._tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,icon: null == icon ? _self.icon : icon // ignore: cast_nullable_to_non_nullable
as String,color: null == color ? _self.color : color // ignore: cast_nullable_to_non_nullable
as String,targetValue: null == targetValue ? _self.targetValue : targetValue // ignore: cast_nullable_to_non_nullable
as int,unit: null == unit ? _self.unit : unit // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,currentStreak: null == currentStreak ? _self.currentStreak : currentStreak // ignore: cast_nullable_to_non_nullable
as int,longestStreak: null == longestStreak ? _self.longestStreak : longestStreak // ignore: cast_nullable_to_non_nullable
as int,totalCompletions: null == totalCompletions ? _self.totalCompletions : totalCompletions // ignore: cast_nullable_to_non_nullable
as int,weekdays: null == weekdays ? _self._weekdays : weekdays // ignore: cast_nullable_to_non_nullable
as List<int>,customInterval: freezed == customInterval ? _self.customInterval : customInterval // ignore: cast_nullable_to_non_nullable
as int?,lastCompletedAt: freezed == lastCompletedAt ? _self.lastCompletedAt : lastCompletedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,startDate: freezed == startDate ? _self.startDate : startDate // ignore: cast_nullable_to_non_nullable
as DateTime?,endDate: freezed == endDate ? _self.endDate : endDate // ignore: cast_nullable_to_non_nullable
as DateTime?,hasReminder: null == hasReminder ? _self.hasReminder : hasReminder // ignore: cast_nullable_to_non_nullable
as bool,reminderTime: freezed == reminderTime ? _self.reminderTime : reminderTime // ignore: cast_nullable_to_non_nullable
as DateTime?,reminderMessage: null == reminderMessage ? _self.reminderMessage : reminderMessage // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$HabitCompletion {

 String get id; String get habitId; DateTime get completedAt; int get value; String get notes; int? get duration;// In minutes for time-based habits
 DateTime get createdAt;
/// Create a copy of HabitCompletion
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$HabitCompletionCopyWith<HabitCompletion> get copyWith => _$HabitCompletionCopyWithImpl<HabitCompletion>(this as HabitCompletion, _$identity);

  /// Serializes this HabitCompletion to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is HabitCompletion&&(identical(other.id, id) || other.id == id)&&(identical(other.habitId, habitId) || other.habitId == habitId)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt)&&(identical(other.value, value) || other.value == value)&&(identical(other.notes, notes) || other.notes == notes)&&(identical(other.duration, duration) || other.duration == duration)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,habitId,completedAt,value,notes,duration,createdAt);

@override
String toString() {
  return 'HabitCompletion(id: $id, habitId: $habitId, completedAt: $completedAt, value: $value, notes: $notes, duration: $duration, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class $HabitCompletionCopyWith<$Res>  {
  factory $HabitCompletionCopyWith(HabitCompletion value, $Res Function(HabitCompletion) _then) = _$HabitCompletionCopyWithImpl;
@useResult
$Res call({
 String id, String habitId, DateTime completedAt, int value, String notes, int? duration, DateTime createdAt
});




}
/// @nodoc
class _$HabitCompletionCopyWithImpl<$Res>
    implements $HabitCompletionCopyWith<$Res> {
  _$HabitCompletionCopyWithImpl(this._self, this._then);

  final HabitCompletion _self;
  final $Res Function(HabitCompletion) _then;

/// Create a copy of HabitCompletion
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? habitId = null,Object? completedAt = null,Object? value = null,Object? notes = null,Object? duration = freezed,Object? createdAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,habitId: null == habitId ? _self.habitId : habitId // ignore: cast_nullable_to_non_nullable
as String,completedAt: null == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime,value: null == value ? _self.value : value // ignore: cast_nullable_to_non_nullable
as int,notes: null == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String,duration: freezed == duration ? _self.duration : duration // ignore: cast_nullable_to_non_nullable
as int?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [HabitCompletion].
extension HabitCompletionPatterns on HabitCompletion {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _HabitCompletion value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _HabitCompletion() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _HabitCompletion value)  $default,){
final _that = this;
switch (_that) {
case _HabitCompletion():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _HabitCompletion value)?  $default,){
final _that = this;
switch (_that) {
case _HabitCompletion() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String habitId,  DateTime completedAt,  int value,  String notes,  int? duration,  DateTime createdAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _HabitCompletion() when $default != null:
return $default(_that.id,_that.habitId,_that.completedAt,_that.value,_that.notes,_that.duration,_that.createdAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String habitId,  DateTime completedAt,  int value,  String notes,  int? duration,  DateTime createdAt)  $default,) {final _that = this;
switch (_that) {
case _HabitCompletion():
return $default(_that.id,_that.habitId,_that.completedAt,_that.value,_that.notes,_that.duration,_that.createdAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String habitId,  DateTime completedAt,  int value,  String notes,  int? duration,  DateTime createdAt)?  $default,) {final _that = this;
switch (_that) {
case _HabitCompletion() when $default != null:
return $default(_that.id,_that.habitId,_that.completedAt,_that.value,_that.notes,_that.duration,_that.createdAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _HabitCompletion implements HabitCompletion {
  const _HabitCompletion({required this.id, required this.habitId, required this.completedAt, this.value = 1, this.notes = '', this.duration, required this.createdAt});
  factory _HabitCompletion.fromJson(Map<String, dynamic> json) => _$HabitCompletionFromJson(json);

@override final  String id;
@override final  String habitId;
@override final  DateTime completedAt;
@override@JsonKey() final  int value;
@override@JsonKey() final  String notes;
@override final  int? duration;
// In minutes for time-based habits
@override final  DateTime createdAt;

/// Create a copy of HabitCompletion
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$HabitCompletionCopyWith<_HabitCompletion> get copyWith => __$HabitCompletionCopyWithImpl<_HabitCompletion>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$HabitCompletionToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _HabitCompletion&&(identical(other.id, id) || other.id == id)&&(identical(other.habitId, habitId) || other.habitId == habitId)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt)&&(identical(other.value, value) || other.value == value)&&(identical(other.notes, notes) || other.notes == notes)&&(identical(other.duration, duration) || other.duration == duration)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,habitId,completedAt,value,notes,duration,createdAt);

@override
String toString() {
  return 'HabitCompletion(id: $id, habitId: $habitId, completedAt: $completedAt, value: $value, notes: $notes, duration: $duration, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class _$HabitCompletionCopyWith<$Res> implements $HabitCompletionCopyWith<$Res> {
  factory _$HabitCompletionCopyWith(_HabitCompletion value, $Res Function(_HabitCompletion) _then) = __$HabitCompletionCopyWithImpl;
@override @useResult
$Res call({
 String id, String habitId, DateTime completedAt, int value, String notes, int? duration, DateTime createdAt
});




}
/// @nodoc
class __$HabitCompletionCopyWithImpl<$Res>
    implements _$HabitCompletionCopyWith<$Res> {
  __$HabitCompletionCopyWithImpl(this._self, this._then);

  final _HabitCompletion _self;
  final $Res Function(_HabitCompletion) _then;

/// Create a copy of HabitCompletion
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? habitId = null,Object? completedAt = null,Object? value = null,Object? notes = null,Object? duration = freezed,Object? createdAt = null,}) {
  return _then(_HabitCompletion(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,habitId: null == habitId ? _self.habitId : habitId // ignore: cast_nullable_to_non_nullable
as String,completedAt: null == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime,value: null == value ? _self.value : value // ignore: cast_nullable_to_non_nullable
as int,notes: null == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String,duration: freezed == duration ? _self.duration : duration // ignore: cast_nullable_to_non_nullable
as int?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}


/// @nodoc
mixin _$HabitStreak {

 String get id; String get habitId; DateTime get startDate; DateTime? get endDate; int get length; bool get isActive; DateTime get createdAt;
/// Create a copy of HabitStreak
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$HabitStreakCopyWith<HabitStreak> get copyWith => _$HabitStreakCopyWithImpl<HabitStreak>(this as HabitStreak, _$identity);

  /// Serializes this HabitStreak to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is HabitStreak&&(identical(other.id, id) || other.id == id)&&(identical(other.habitId, habitId) || other.habitId == habitId)&&(identical(other.startDate, startDate) || other.startDate == startDate)&&(identical(other.endDate, endDate) || other.endDate == endDate)&&(identical(other.length, length) || other.length == length)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,habitId,startDate,endDate,length,isActive,createdAt);

@override
String toString() {
  return 'HabitStreak(id: $id, habitId: $habitId, startDate: $startDate, endDate: $endDate, length: $length, isActive: $isActive, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class $HabitStreakCopyWith<$Res>  {
  factory $HabitStreakCopyWith(HabitStreak value, $Res Function(HabitStreak) _then) = _$HabitStreakCopyWithImpl;
@useResult
$Res call({
 String id, String habitId, DateTime startDate, DateTime? endDate, int length, bool isActive, DateTime createdAt
});




}
/// @nodoc
class _$HabitStreakCopyWithImpl<$Res>
    implements $HabitStreakCopyWith<$Res> {
  _$HabitStreakCopyWithImpl(this._self, this._then);

  final HabitStreak _self;
  final $Res Function(HabitStreak) _then;

/// Create a copy of HabitStreak
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? habitId = null,Object? startDate = null,Object? endDate = freezed,Object? length = null,Object? isActive = null,Object? createdAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,habitId: null == habitId ? _self.habitId : habitId // ignore: cast_nullable_to_non_nullable
as String,startDate: null == startDate ? _self.startDate : startDate // ignore: cast_nullable_to_non_nullable
as DateTime,endDate: freezed == endDate ? _self.endDate : endDate // ignore: cast_nullable_to_non_nullable
as DateTime?,length: null == length ? _self.length : length // ignore: cast_nullable_to_non_nullable
as int,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [HabitStreak].
extension HabitStreakPatterns on HabitStreak {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _HabitStreak value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _HabitStreak() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _HabitStreak value)  $default,){
final _that = this;
switch (_that) {
case _HabitStreak():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _HabitStreak value)?  $default,){
final _that = this;
switch (_that) {
case _HabitStreak() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String habitId,  DateTime startDate,  DateTime? endDate,  int length,  bool isActive,  DateTime createdAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _HabitStreak() when $default != null:
return $default(_that.id,_that.habitId,_that.startDate,_that.endDate,_that.length,_that.isActive,_that.createdAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String habitId,  DateTime startDate,  DateTime? endDate,  int length,  bool isActive,  DateTime createdAt)  $default,) {final _that = this;
switch (_that) {
case _HabitStreak():
return $default(_that.id,_that.habitId,_that.startDate,_that.endDate,_that.length,_that.isActive,_that.createdAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String habitId,  DateTime startDate,  DateTime? endDate,  int length,  bool isActive,  DateTime createdAt)?  $default,) {final _that = this;
switch (_that) {
case _HabitStreak() when $default != null:
return $default(_that.id,_that.habitId,_that.startDate,_that.endDate,_that.length,_that.isActive,_that.createdAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _HabitStreak implements HabitStreak {
  const _HabitStreak({required this.id, required this.habitId, required this.startDate, this.endDate, this.length = 1, this.isActive = false, required this.createdAt});
  factory _HabitStreak.fromJson(Map<String, dynamic> json) => _$HabitStreakFromJson(json);

@override final  String id;
@override final  String habitId;
@override final  DateTime startDate;
@override final  DateTime? endDate;
@override@JsonKey() final  int length;
@override@JsonKey() final  bool isActive;
@override final  DateTime createdAt;

/// Create a copy of HabitStreak
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$HabitStreakCopyWith<_HabitStreak> get copyWith => __$HabitStreakCopyWithImpl<_HabitStreak>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$HabitStreakToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _HabitStreak&&(identical(other.id, id) || other.id == id)&&(identical(other.habitId, habitId) || other.habitId == habitId)&&(identical(other.startDate, startDate) || other.startDate == startDate)&&(identical(other.endDate, endDate) || other.endDate == endDate)&&(identical(other.length, length) || other.length == length)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,habitId,startDate,endDate,length,isActive,createdAt);

@override
String toString() {
  return 'HabitStreak(id: $id, habitId: $habitId, startDate: $startDate, endDate: $endDate, length: $length, isActive: $isActive, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class _$HabitStreakCopyWith<$Res> implements $HabitStreakCopyWith<$Res> {
  factory _$HabitStreakCopyWith(_HabitStreak value, $Res Function(_HabitStreak) _then) = __$HabitStreakCopyWithImpl;
@override @useResult
$Res call({
 String id, String habitId, DateTime startDate, DateTime? endDate, int length, bool isActive, DateTime createdAt
});




}
/// @nodoc
class __$HabitStreakCopyWithImpl<$Res>
    implements _$HabitStreakCopyWith<$Res> {
  __$HabitStreakCopyWithImpl(this._self, this._then);

  final _HabitStreak _self;
  final $Res Function(_HabitStreak) _then;

/// Create a copy of HabitStreak
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? habitId = null,Object? startDate = null,Object? endDate = freezed,Object? length = null,Object? isActive = null,Object? createdAt = null,}) {
  return _then(_HabitStreak(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,habitId: null == habitId ? _self.habitId : habitId // ignore: cast_nullable_to_non_nullable
as String,startDate: null == startDate ? _self.startDate : startDate // ignore: cast_nullable_to_non_nullable
as DateTime,endDate: freezed == endDate ? _self.endDate : endDate // ignore: cast_nullable_to_non_nullable
as DateTime?,length: null == length ? _self.length : length // ignore: cast_nullable_to_non_nullable
as int,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}


/// @nodoc
mixin _$HabitAchievement {

 String get id; String get habitId; String get type;// 'streak', 'completion', 'consistency'
 String get title; String get description; int get threshold; DateTime get unlockedAt; String get icon; bool get isShown;
/// Create a copy of HabitAchievement
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$HabitAchievementCopyWith<HabitAchievement> get copyWith => _$HabitAchievementCopyWithImpl<HabitAchievement>(this as HabitAchievement, _$identity);

  /// Serializes this HabitAchievement to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is HabitAchievement&&(identical(other.id, id) || other.id == id)&&(identical(other.habitId, habitId) || other.habitId == habitId)&&(identical(other.type, type) || other.type == type)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.threshold, threshold) || other.threshold == threshold)&&(identical(other.unlockedAt, unlockedAt) || other.unlockedAt == unlockedAt)&&(identical(other.icon, icon) || other.icon == icon)&&(identical(other.isShown, isShown) || other.isShown == isShown));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,habitId,type,title,description,threshold,unlockedAt,icon,isShown);

@override
String toString() {
  return 'HabitAchievement(id: $id, habitId: $habitId, type: $type, title: $title, description: $description, threshold: $threshold, unlockedAt: $unlockedAt, icon: $icon, isShown: $isShown)';
}


}

/// @nodoc
abstract mixin class $HabitAchievementCopyWith<$Res>  {
  factory $HabitAchievementCopyWith(HabitAchievement value, $Res Function(HabitAchievement) _then) = _$HabitAchievementCopyWithImpl;
@useResult
$Res call({
 String id, String habitId, String type, String title, String description, int threshold, DateTime unlockedAt, String icon, bool isShown
});




}
/// @nodoc
class _$HabitAchievementCopyWithImpl<$Res>
    implements $HabitAchievementCopyWith<$Res> {
  _$HabitAchievementCopyWithImpl(this._self, this._then);

  final HabitAchievement _self;
  final $Res Function(HabitAchievement) _then;

/// Create a copy of HabitAchievement
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? habitId = null,Object? type = null,Object? title = null,Object? description = null,Object? threshold = null,Object? unlockedAt = null,Object? icon = null,Object? isShown = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,habitId: null == habitId ? _self.habitId : habitId // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,threshold: null == threshold ? _self.threshold : threshold // ignore: cast_nullable_to_non_nullable
as int,unlockedAt: null == unlockedAt ? _self.unlockedAt : unlockedAt // ignore: cast_nullable_to_non_nullable
as DateTime,icon: null == icon ? _self.icon : icon // ignore: cast_nullable_to_non_nullable
as String,isShown: null == isShown ? _self.isShown : isShown // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [HabitAchievement].
extension HabitAchievementPatterns on HabitAchievement {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _HabitAchievement value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _HabitAchievement() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _HabitAchievement value)  $default,){
final _that = this;
switch (_that) {
case _HabitAchievement():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _HabitAchievement value)?  $default,){
final _that = this;
switch (_that) {
case _HabitAchievement() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String habitId,  String type,  String title,  String description,  int threshold,  DateTime unlockedAt,  String icon,  bool isShown)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _HabitAchievement() when $default != null:
return $default(_that.id,_that.habitId,_that.type,_that.title,_that.description,_that.threshold,_that.unlockedAt,_that.icon,_that.isShown);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String habitId,  String type,  String title,  String description,  int threshold,  DateTime unlockedAt,  String icon,  bool isShown)  $default,) {final _that = this;
switch (_that) {
case _HabitAchievement():
return $default(_that.id,_that.habitId,_that.type,_that.title,_that.description,_that.threshold,_that.unlockedAt,_that.icon,_that.isShown);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String habitId,  String type,  String title,  String description,  int threshold,  DateTime unlockedAt,  String icon,  bool isShown)?  $default,) {final _that = this;
switch (_that) {
case _HabitAchievement() when $default != null:
return $default(_that.id,_that.habitId,_that.type,_that.title,_that.description,_that.threshold,_that.unlockedAt,_that.icon,_that.isShown);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _HabitAchievement implements HabitAchievement {
  const _HabitAchievement({required this.id, required this.habitId, required this.type, required this.title, required this.description, required this.threshold, required this.unlockedAt, this.icon = '', this.isShown = false});
  factory _HabitAchievement.fromJson(Map<String, dynamic> json) => _$HabitAchievementFromJson(json);

@override final  String id;
@override final  String habitId;
@override final  String type;
// 'streak', 'completion', 'consistency'
@override final  String title;
@override final  String description;
@override final  int threshold;
@override final  DateTime unlockedAt;
@override@JsonKey() final  String icon;
@override@JsonKey() final  bool isShown;

/// Create a copy of HabitAchievement
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$HabitAchievementCopyWith<_HabitAchievement> get copyWith => __$HabitAchievementCopyWithImpl<_HabitAchievement>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$HabitAchievementToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _HabitAchievement&&(identical(other.id, id) || other.id == id)&&(identical(other.habitId, habitId) || other.habitId == habitId)&&(identical(other.type, type) || other.type == type)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.threshold, threshold) || other.threshold == threshold)&&(identical(other.unlockedAt, unlockedAt) || other.unlockedAt == unlockedAt)&&(identical(other.icon, icon) || other.icon == icon)&&(identical(other.isShown, isShown) || other.isShown == isShown));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,habitId,type,title,description,threshold,unlockedAt,icon,isShown);

@override
String toString() {
  return 'HabitAchievement(id: $id, habitId: $habitId, type: $type, title: $title, description: $description, threshold: $threshold, unlockedAt: $unlockedAt, icon: $icon, isShown: $isShown)';
}


}

/// @nodoc
abstract mixin class _$HabitAchievementCopyWith<$Res> implements $HabitAchievementCopyWith<$Res> {
  factory _$HabitAchievementCopyWith(_HabitAchievement value, $Res Function(_HabitAchievement) _then) = __$HabitAchievementCopyWithImpl;
@override @useResult
$Res call({
 String id, String habitId, String type, String title, String description, int threshold, DateTime unlockedAt, String icon, bool isShown
});




}
/// @nodoc
class __$HabitAchievementCopyWithImpl<$Res>
    implements _$HabitAchievementCopyWith<$Res> {
  __$HabitAchievementCopyWithImpl(this._self, this._then);

  final _HabitAchievement _self;
  final $Res Function(_HabitAchievement) _then;

/// Create a copy of HabitAchievement
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? habitId = null,Object? type = null,Object? title = null,Object? description = null,Object? threshold = null,Object? unlockedAt = null,Object? icon = null,Object? isShown = null,}) {
  return _then(_HabitAchievement(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,habitId: null == habitId ? _self.habitId : habitId // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,threshold: null == threshold ? _self.threshold : threshold // ignore: cast_nullable_to_non_nullable
as int,unlockedAt: null == unlockedAt ? _self.unlockedAt : unlockedAt // ignore: cast_nullable_to_non_nullable
as DateTime,icon: null == icon ? _self.icon : icon // ignore: cast_nullable_to_non_nullable
as String,isShown: null == isShown ? _self.isShown : isShown // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

/// @nodoc
mixin _$HabitState {

 List<Habit> get habits; List<HabitCompletion> get completions; List<HabitStreak> get streaks; List<HabitAchievement> get achievements; bool get isLoading; bool get isSaving; String? get error; Habit? get selectedHabit; DateTime? get selectedDate;
/// Create a copy of HabitState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$HabitStateCopyWith<HabitState> get copyWith => _$HabitStateCopyWithImpl<HabitState>(this as HabitState, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is HabitState&&const DeepCollectionEquality().equals(other.habits, habits)&&const DeepCollectionEquality().equals(other.completions, completions)&&const DeepCollectionEquality().equals(other.streaks, streaks)&&const DeepCollectionEquality().equals(other.achievements, achievements)&&(identical(other.isLoading, isLoading) || other.isLoading == isLoading)&&(identical(other.isSaving, isSaving) || other.isSaving == isSaving)&&(identical(other.error, error) || other.error == error)&&(identical(other.selectedHabit, selectedHabit) || other.selectedHabit == selectedHabit)&&(identical(other.selectedDate, selectedDate) || other.selectedDate == selectedDate));
}


@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(habits),const DeepCollectionEquality().hash(completions),const DeepCollectionEquality().hash(streaks),const DeepCollectionEquality().hash(achievements),isLoading,isSaving,error,selectedHabit,selectedDate);

@override
String toString() {
  return 'HabitState(habits: $habits, completions: $completions, streaks: $streaks, achievements: $achievements, isLoading: $isLoading, isSaving: $isSaving, error: $error, selectedHabit: $selectedHabit, selectedDate: $selectedDate)';
}


}

/// @nodoc
abstract mixin class $HabitStateCopyWith<$Res>  {
  factory $HabitStateCopyWith(HabitState value, $Res Function(HabitState) _then) = _$HabitStateCopyWithImpl;
@useResult
$Res call({
 List<Habit> habits, List<HabitCompletion> completions, List<HabitStreak> streaks, List<HabitAchievement> achievements, bool isLoading, bool isSaving, String? error, Habit? selectedHabit, DateTime? selectedDate
});


$HabitCopyWith<$Res>? get selectedHabit;

}
/// @nodoc
class _$HabitStateCopyWithImpl<$Res>
    implements $HabitStateCopyWith<$Res> {
  _$HabitStateCopyWithImpl(this._self, this._then);

  final HabitState _self;
  final $Res Function(HabitState) _then;

/// Create a copy of HabitState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? habits = null,Object? completions = null,Object? streaks = null,Object? achievements = null,Object? isLoading = null,Object? isSaving = null,Object? error = freezed,Object? selectedHabit = freezed,Object? selectedDate = freezed,}) {
  return _then(_self.copyWith(
habits: null == habits ? _self.habits : habits // ignore: cast_nullable_to_non_nullable
as List<Habit>,completions: null == completions ? _self.completions : completions // ignore: cast_nullable_to_non_nullable
as List<HabitCompletion>,streaks: null == streaks ? _self.streaks : streaks // ignore: cast_nullable_to_non_nullable
as List<HabitStreak>,achievements: null == achievements ? _self.achievements : achievements // ignore: cast_nullable_to_non_nullable
as List<HabitAchievement>,isLoading: null == isLoading ? _self.isLoading : isLoading // ignore: cast_nullable_to_non_nullable
as bool,isSaving: null == isSaving ? _self.isSaving : isSaving // ignore: cast_nullable_to_non_nullable
as bool,error: freezed == error ? _self.error : error // ignore: cast_nullable_to_non_nullable
as String?,selectedHabit: freezed == selectedHabit ? _self.selectedHabit : selectedHabit // ignore: cast_nullable_to_non_nullable
as Habit?,selectedDate: freezed == selectedDate ? _self.selectedDate : selectedDate // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}
/// Create a copy of HabitState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$HabitCopyWith<$Res>? get selectedHabit {
    if (_self.selectedHabit == null) {
    return null;
  }

  return $HabitCopyWith<$Res>(_self.selectedHabit!, (value) {
    return _then(_self.copyWith(selectedHabit: value));
  });
}
}


/// Adds pattern-matching-related methods to [HabitState].
extension HabitStatePatterns on HabitState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _HabitState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _HabitState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _HabitState value)  $default,){
final _that = this;
switch (_that) {
case _HabitState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _HabitState value)?  $default,){
final _that = this;
switch (_that) {
case _HabitState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<Habit> habits,  List<HabitCompletion> completions,  List<HabitStreak> streaks,  List<HabitAchievement> achievements,  bool isLoading,  bool isSaving,  String? error,  Habit? selectedHabit,  DateTime? selectedDate)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _HabitState() when $default != null:
return $default(_that.habits,_that.completions,_that.streaks,_that.achievements,_that.isLoading,_that.isSaving,_that.error,_that.selectedHabit,_that.selectedDate);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<Habit> habits,  List<HabitCompletion> completions,  List<HabitStreak> streaks,  List<HabitAchievement> achievements,  bool isLoading,  bool isSaving,  String? error,  Habit? selectedHabit,  DateTime? selectedDate)  $default,) {final _that = this;
switch (_that) {
case _HabitState():
return $default(_that.habits,_that.completions,_that.streaks,_that.achievements,_that.isLoading,_that.isSaving,_that.error,_that.selectedHabit,_that.selectedDate);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<Habit> habits,  List<HabitCompletion> completions,  List<HabitStreak> streaks,  List<HabitAchievement> achievements,  bool isLoading,  bool isSaving,  String? error,  Habit? selectedHabit,  DateTime? selectedDate)?  $default,) {final _that = this;
switch (_that) {
case _HabitState() when $default != null:
return $default(_that.habits,_that.completions,_that.streaks,_that.achievements,_that.isLoading,_that.isSaving,_that.error,_that.selectedHabit,_that.selectedDate);case _:
  return null;

}
}

}

/// @nodoc


class _HabitState implements HabitState {
  const _HabitState({final  List<Habit> habits = const [], final  List<HabitCompletion> completions = const [], final  List<HabitStreak> streaks = const [], final  List<HabitAchievement> achievements = const [], this.isLoading = false, this.isSaving = false, this.error, this.selectedHabit, this.selectedDate}): _habits = habits,_completions = completions,_streaks = streaks,_achievements = achievements;
  

 final  List<Habit> _habits;
@override@JsonKey() List<Habit> get habits {
  if (_habits is EqualUnmodifiableListView) return _habits;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_habits);
}

 final  List<HabitCompletion> _completions;
@override@JsonKey() List<HabitCompletion> get completions {
  if (_completions is EqualUnmodifiableListView) return _completions;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_completions);
}

 final  List<HabitStreak> _streaks;
@override@JsonKey() List<HabitStreak> get streaks {
  if (_streaks is EqualUnmodifiableListView) return _streaks;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_streaks);
}

 final  List<HabitAchievement> _achievements;
@override@JsonKey() List<HabitAchievement> get achievements {
  if (_achievements is EqualUnmodifiableListView) return _achievements;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_achievements);
}

@override@JsonKey() final  bool isLoading;
@override@JsonKey() final  bool isSaving;
@override final  String? error;
@override final  Habit? selectedHabit;
@override final  DateTime? selectedDate;

/// Create a copy of HabitState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$HabitStateCopyWith<_HabitState> get copyWith => __$HabitStateCopyWithImpl<_HabitState>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _HabitState&&const DeepCollectionEquality().equals(other._habits, _habits)&&const DeepCollectionEquality().equals(other._completions, _completions)&&const DeepCollectionEquality().equals(other._streaks, _streaks)&&const DeepCollectionEquality().equals(other._achievements, _achievements)&&(identical(other.isLoading, isLoading) || other.isLoading == isLoading)&&(identical(other.isSaving, isSaving) || other.isSaving == isSaving)&&(identical(other.error, error) || other.error == error)&&(identical(other.selectedHabit, selectedHabit) || other.selectedHabit == selectedHabit)&&(identical(other.selectedDate, selectedDate) || other.selectedDate == selectedDate));
}


@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_habits),const DeepCollectionEquality().hash(_completions),const DeepCollectionEquality().hash(_streaks),const DeepCollectionEquality().hash(_achievements),isLoading,isSaving,error,selectedHabit,selectedDate);

@override
String toString() {
  return 'HabitState(habits: $habits, completions: $completions, streaks: $streaks, achievements: $achievements, isLoading: $isLoading, isSaving: $isSaving, error: $error, selectedHabit: $selectedHabit, selectedDate: $selectedDate)';
}


}

/// @nodoc
abstract mixin class _$HabitStateCopyWith<$Res> implements $HabitStateCopyWith<$Res> {
  factory _$HabitStateCopyWith(_HabitState value, $Res Function(_HabitState) _then) = __$HabitStateCopyWithImpl;
@override @useResult
$Res call({
 List<Habit> habits, List<HabitCompletion> completions, List<HabitStreak> streaks, List<HabitAchievement> achievements, bool isLoading, bool isSaving, String? error, Habit? selectedHabit, DateTime? selectedDate
});


@override $HabitCopyWith<$Res>? get selectedHabit;

}
/// @nodoc
class __$HabitStateCopyWithImpl<$Res>
    implements _$HabitStateCopyWith<$Res> {
  __$HabitStateCopyWithImpl(this._self, this._then);

  final _HabitState _self;
  final $Res Function(_HabitState) _then;

/// Create a copy of HabitState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? habits = null,Object? completions = null,Object? streaks = null,Object? achievements = null,Object? isLoading = null,Object? isSaving = null,Object? error = freezed,Object? selectedHabit = freezed,Object? selectedDate = freezed,}) {
  return _then(_HabitState(
habits: null == habits ? _self._habits : habits // ignore: cast_nullable_to_non_nullable
as List<Habit>,completions: null == completions ? _self._completions : completions // ignore: cast_nullable_to_non_nullable
as List<HabitCompletion>,streaks: null == streaks ? _self._streaks : streaks // ignore: cast_nullable_to_non_nullable
as List<HabitStreak>,achievements: null == achievements ? _self._achievements : achievements // ignore: cast_nullable_to_non_nullable
as List<HabitAchievement>,isLoading: null == isLoading ? _self.isLoading : isLoading // ignore: cast_nullable_to_non_nullable
as bool,isSaving: null == isSaving ? _self.isSaving : isSaving // ignore: cast_nullable_to_non_nullable
as bool,error: freezed == error ? _self.error : error // ignore: cast_nullable_to_non_nullable
as String?,selectedHabit: freezed == selectedHabit ? _self.selectedHabit : selectedHabit // ignore: cast_nullable_to_non_nullable
as Habit?,selectedDate: freezed == selectedDate ? _self.selectedDate : selectedDate // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

/// Create a copy of HabitState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$HabitCopyWith<$Res>? get selectedHabit {
    if (_self.selectedHabit == null) {
    return null;
  }

  return $HabitCopyWith<$Res>(_self.selectedHabit!, (value) {
    return _then(_self.copyWith(selectedHabit: value));
  });
}
}

// dart format on
