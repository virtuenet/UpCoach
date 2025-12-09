// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'onboarding_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$OnboardingProfile {

 String? get firstName; String? get lastName; String? get displayName; String? get avatarUrl; String? get phoneNumber; String? get timezone; String? get language; DateTime? get dateOfBirth; String? get gender; String? get location; String? get bio;
/// Create a copy of OnboardingProfile
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OnboardingProfileCopyWith<OnboardingProfile> get copyWith => _$OnboardingProfileCopyWithImpl<OnboardingProfile>(this as OnboardingProfile, _$identity);

  /// Serializes this OnboardingProfile to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OnboardingProfile&&(identical(other.firstName, firstName) || other.firstName == firstName)&&(identical(other.lastName, lastName) || other.lastName == lastName)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.avatarUrl, avatarUrl) || other.avatarUrl == avatarUrl)&&(identical(other.phoneNumber, phoneNumber) || other.phoneNumber == phoneNumber)&&(identical(other.timezone, timezone) || other.timezone == timezone)&&(identical(other.language, language) || other.language == language)&&(identical(other.dateOfBirth, dateOfBirth) || other.dateOfBirth == dateOfBirth)&&(identical(other.gender, gender) || other.gender == gender)&&(identical(other.location, location) || other.location == location)&&(identical(other.bio, bio) || other.bio == bio));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,firstName,lastName,displayName,avatarUrl,phoneNumber,timezone,language,dateOfBirth,gender,location,bio);

@override
String toString() {
  return 'OnboardingProfile(firstName: $firstName, lastName: $lastName, displayName: $displayName, avatarUrl: $avatarUrl, phoneNumber: $phoneNumber, timezone: $timezone, language: $language, dateOfBirth: $dateOfBirth, gender: $gender, location: $location, bio: $bio)';
}


}

/// @nodoc
abstract mixin class $OnboardingProfileCopyWith<$Res>  {
  factory $OnboardingProfileCopyWith(OnboardingProfile value, $Res Function(OnboardingProfile) _then) = _$OnboardingProfileCopyWithImpl;
@useResult
$Res call({
 String? firstName, String? lastName, String? displayName, String? avatarUrl, String? phoneNumber, String? timezone, String? language, DateTime? dateOfBirth, String? gender, String? location, String? bio
});




}
/// @nodoc
class _$OnboardingProfileCopyWithImpl<$Res>
    implements $OnboardingProfileCopyWith<$Res> {
  _$OnboardingProfileCopyWithImpl(this._self, this._then);

  final OnboardingProfile _self;
  final $Res Function(OnboardingProfile) _then;

/// Create a copy of OnboardingProfile
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? firstName = freezed,Object? lastName = freezed,Object? displayName = freezed,Object? avatarUrl = freezed,Object? phoneNumber = freezed,Object? timezone = freezed,Object? language = freezed,Object? dateOfBirth = freezed,Object? gender = freezed,Object? location = freezed,Object? bio = freezed,}) {
  return _then(_self.copyWith(
firstName: freezed == firstName ? _self.firstName : firstName // ignore: cast_nullable_to_non_nullable
as String?,lastName: freezed == lastName ? _self.lastName : lastName // ignore: cast_nullable_to_non_nullable
as String?,displayName: freezed == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String?,avatarUrl: freezed == avatarUrl ? _self.avatarUrl : avatarUrl // ignore: cast_nullable_to_non_nullable
as String?,phoneNumber: freezed == phoneNumber ? _self.phoneNumber : phoneNumber // ignore: cast_nullable_to_non_nullable
as String?,timezone: freezed == timezone ? _self.timezone : timezone // ignore: cast_nullable_to_non_nullable
as String?,language: freezed == language ? _self.language : language // ignore: cast_nullable_to_non_nullable
as String?,dateOfBirth: freezed == dateOfBirth ? _self.dateOfBirth : dateOfBirth // ignore: cast_nullable_to_non_nullable
as DateTime?,gender: freezed == gender ? _self.gender : gender // ignore: cast_nullable_to_non_nullable
as String?,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String?,bio: freezed == bio ? _self.bio : bio // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [OnboardingProfile].
extension OnboardingProfilePatterns on OnboardingProfile {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _OnboardingProfile value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _OnboardingProfile() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _OnboardingProfile value)  $default,){
final _that = this;
switch (_that) {
case _OnboardingProfile():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _OnboardingProfile value)?  $default,){
final _that = this;
switch (_that) {
case _OnboardingProfile() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? firstName,  String? lastName,  String? displayName,  String? avatarUrl,  String? phoneNumber,  String? timezone,  String? language,  DateTime? dateOfBirth,  String? gender,  String? location,  String? bio)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _OnboardingProfile() when $default != null:
return $default(_that.firstName,_that.lastName,_that.displayName,_that.avatarUrl,_that.phoneNumber,_that.timezone,_that.language,_that.dateOfBirth,_that.gender,_that.location,_that.bio);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? firstName,  String? lastName,  String? displayName,  String? avatarUrl,  String? phoneNumber,  String? timezone,  String? language,  DateTime? dateOfBirth,  String? gender,  String? location,  String? bio)  $default,) {final _that = this;
switch (_that) {
case _OnboardingProfile():
return $default(_that.firstName,_that.lastName,_that.displayName,_that.avatarUrl,_that.phoneNumber,_that.timezone,_that.language,_that.dateOfBirth,_that.gender,_that.location,_that.bio);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? firstName,  String? lastName,  String? displayName,  String? avatarUrl,  String? phoneNumber,  String? timezone,  String? language,  DateTime? dateOfBirth,  String? gender,  String? location,  String? bio)?  $default,) {final _that = this;
switch (_that) {
case _OnboardingProfile() when $default != null:
return $default(_that.firstName,_that.lastName,_that.displayName,_that.avatarUrl,_that.phoneNumber,_that.timezone,_that.language,_that.dateOfBirth,_that.gender,_that.location,_that.bio);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _OnboardingProfile implements OnboardingProfile {
  const _OnboardingProfile({this.firstName, this.lastName, this.displayName, this.avatarUrl, this.phoneNumber, this.timezone, this.language, this.dateOfBirth, this.gender, this.location, this.bio});
  factory _OnboardingProfile.fromJson(Map<String, dynamic> json) => _$OnboardingProfileFromJson(json);

@override final  String? firstName;
@override final  String? lastName;
@override final  String? displayName;
@override final  String? avatarUrl;
@override final  String? phoneNumber;
@override final  String? timezone;
@override final  String? language;
@override final  DateTime? dateOfBirth;
@override final  String? gender;
@override final  String? location;
@override final  String? bio;

/// Create a copy of OnboardingProfile
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OnboardingProfileCopyWith<_OnboardingProfile> get copyWith => __$OnboardingProfileCopyWithImpl<_OnboardingProfile>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OnboardingProfileToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _OnboardingProfile&&(identical(other.firstName, firstName) || other.firstName == firstName)&&(identical(other.lastName, lastName) || other.lastName == lastName)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.avatarUrl, avatarUrl) || other.avatarUrl == avatarUrl)&&(identical(other.phoneNumber, phoneNumber) || other.phoneNumber == phoneNumber)&&(identical(other.timezone, timezone) || other.timezone == timezone)&&(identical(other.language, language) || other.language == language)&&(identical(other.dateOfBirth, dateOfBirth) || other.dateOfBirth == dateOfBirth)&&(identical(other.gender, gender) || other.gender == gender)&&(identical(other.location, location) || other.location == location)&&(identical(other.bio, bio) || other.bio == bio));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,firstName,lastName,displayName,avatarUrl,phoneNumber,timezone,language,dateOfBirth,gender,location,bio);

@override
String toString() {
  return 'OnboardingProfile(firstName: $firstName, lastName: $lastName, displayName: $displayName, avatarUrl: $avatarUrl, phoneNumber: $phoneNumber, timezone: $timezone, language: $language, dateOfBirth: $dateOfBirth, gender: $gender, location: $location, bio: $bio)';
}


}

/// @nodoc
abstract mixin class _$OnboardingProfileCopyWith<$Res> implements $OnboardingProfileCopyWith<$Res> {
  factory _$OnboardingProfileCopyWith(_OnboardingProfile value, $Res Function(_OnboardingProfile) _then) = __$OnboardingProfileCopyWithImpl;
@override @useResult
$Res call({
 String? firstName, String? lastName, String? displayName, String? avatarUrl, String? phoneNumber, String? timezone, String? language, DateTime? dateOfBirth, String? gender, String? location, String? bio
});




}
/// @nodoc
class __$OnboardingProfileCopyWithImpl<$Res>
    implements _$OnboardingProfileCopyWith<$Res> {
  __$OnboardingProfileCopyWithImpl(this._self, this._then);

  final _OnboardingProfile _self;
  final $Res Function(_OnboardingProfile) _then;

/// Create a copy of OnboardingProfile
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? firstName = freezed,Object? lastName = freezed,Object? displayName = freezed,Object? avatarUrl = freezed,Object? phoneNumber = freezed,Object? timezone = freezed,Object? language = freezed,Object? dateOfBirth = freezed,Object? gender = freezed,Object? location = freezed,Object? bio = freezed,}) {
  return _then(_OnboardingProfile(
firstName: freezed == firstName ? _self.firstName : firstName // ignore: cast_nullable_to_non_nullable
as String?,lastName: freezed == lastName ? _self.lastName : lastName // ignore: cast_nullable_to_non_nullable
as String?,displayName: freezed == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String?,avatarUrl: freezed == avatarUrl ? _self.avatarUrl : avatarUrl // ignore: cast_nullable_to_non_nullable
as String?,phoneNumber: freezed == phoneNumber ? _self.phoneNumber : phoneNumber // ignore: cast_nullable_to_non_nullable
as String?,timezone: freezed == timezone ? _self.timezone : timezone // ignore: cast_nullable_to_non_nullable
as String?,language: freezed == language ? _self.language : language // ignore: cast_nullable_to_non_nullable
as String?,dateOfBirth: freezed == dateOfBirth ? _self.dateOfBirth : dateOfBirth // ignore: cast_nullable_to_non_nullable
as DateTime?,gender: freezed == gender ? _self.gender : gender // ignore: cast_nullable_to_non_nullable
as String?,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String?,bio: freezed == bio ? _self.bio : bio // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$OnboardingGoals {

 List<CoachingGoal> get selectedGoals; ExperienceLevel get experienceLevel; String? get primaryGoalDescription; String? get currentChallenges; String? get desiredOutcome; int get commitmentLevel;// 1-5 scale
 String? get previousCoachingExperience;
/// Create a copy of OnboardingGoals
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OnboardingGoalsCopyWith<OnboardingGoals> get copyWith => _$OnboardingGoalsCopyWithImpl<OnboardingGoals>(this as OnboardingGoals, _$identity);

  /// Serializes this OnboardingGoals to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OnboardingGoals&&const DeepCollectionEquality().equals(other.selectedGoals, selectedGoals)&&(identical(other.experienceLevel, experienceLevel) || other.experienceLevel == experienceLevel)&&(identical(other.primaryGoalDescription, primaryGoalDescription) || other.primaryGoalDescription == primaryGoalDescription)&&(identical(other.currentChallenges, currentChallenges) || other.currentChallenges == currentChallenges)&&(identical(other.desiredOutcome, desiredOutcome) || other.desiredOutcome == desiredOutcome)&&(identical(other.commitmentLevel, commitmentLevel) || other.commitmentLevel == commitmentLevel)&&(identical(other.previousCoachingExperience, previousCoachingExperience) || other.previousCoachingExperience == previousCoachingExperience));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(selectedGoals),experienceLevel,primaryGoalDescription,currentChallenges,desiredOutcome,commitmentLevel,previousCoachingExperience);

@override
String toString() {
  return 'OnboardingGoals(selectedGoals: $selectedGoals, experienceLevel: $experienceLevel, primaryGoalDescription: $primaryGoalDescription, currentChallenges: $currentChallenges, desiredOutcome: $desiredOutcome, commitmentLevel: $commitmentLevel, previousCoachingExperience: $previousCoachingExperience)';
}


}

/// @nodoc
abstract mixin class $OnboardingGoalsCopyWith<$Res>  {
  factory $OnboardingGoalsCopyWith(OnboardingGoals value, $Res Function(OnboardingGoals) _then) = _$OnboardingGoalsCopyWithImpl;
@useResult
$Res call({
 List<CoachingGoal> selectedGoals, ExperienceLevel experienceLevel, String? primaryGoalDescription, String? currentChallenges, String? desiredOutcome, int commitmentLevel, String? previousCoachingExperience
});




}
/// @nodoc
class _$OnboardingGoalsCopyWithImpl<$Res>
    implements $OnboardingGoalsCopyWith<$Res> {
  _$OnboardingGoalsCopyWithImpl(this._self, this._then);

  final OnboardingGoals _self;
  final $Res Function(OnboardingGoals) _then;

/// Create a copy of OnboardingGoals
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? selectedGoals = null,Object? experienceLevel = null,Object? primaryGoalDescription = freezed,Object? currentChallenges = freezed,Object? desiredOutcome = freezed,Object? commitmentLevel = null,Object? previousCoachingExperience = freezed,}) {
  return _then(_self.copyWith(
selectedGoals: null == selectedGoals ? _self.selectedGoals : selectedGoals // ignore: cast_nullable_to_non_nullable
as List<CoachingGoal>,experienceLevel: null == experienceLevel ? _self.experienceLevel : experienceLevel // ignore: cast_nullable_to_non_nullable
as ExperienceLevel,primaryGoalDescription: freezed == primaryGoalDescription ? _self.primaryGoalDescription : primaryGoalDescription // ignore: cast_nullable_to_non_nullable
as String?,currentChallenges: freezed == currentChallenges ? _self.currentChallenges : currentChallenges // ignore: cast_nullable_to_non_nullable
as String?,desiredOutcome: freezed == desiredOutcome ? _self.desiredOutcome : desiredOutcome // ignore: cast_nullable_to_non_nullable
as String?,commitmentLevel: null == commitmentLevel ? _self.commitmentLevel : commitmentLevel // ignore: cast_nullable_to_non_nullable
as int,previousCoachingExperience: freezed == previousCoachingExperience ? _self.previousCoachingExperience : previousCoachingExperience // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [OnboardingGoals].
extension OnboardingGoalsPatterns on OnboardingGoals {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _OnboardingGoals value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _OnboardingGoals() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _OnboardingGoals value)  $default,){
final _that = this;
switch (_that) {
case _OnboardingGoals():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _OnboardingGoals value)?  $default,){
final _that = this;
switch (_that) {
case _OnboardingGoals() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<CoachingGoal> selectedGoals,  ExperienceLevel experienceLevel,  String? primaryGoalDescription,  String? currentChallenges,  String? desiredOutcome,  int commitmentLevel,  String? previousCoachingExperience)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _OnboardingGoals() when $default != null:
return $default(_that.selectedGoals,_that.experienceLevel,_that.primaryGoalDescription,_that.currentChallenges,_that.desiredOutcome,_that.commitmentLevel,_that.previousCoachingExperience);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<CoachingGoal> selectedGoals,  ExperienceLevel experienceLevel,  String? primaryGoalDescription,  String? currentChallenges,  String? desiredOutcome,  int commitmentLevel,  String? previousCoachingExperience)  $default,) {final _that = this;
switch (_that) {
case _OnboardingGoals():
return $default(_that.selectedGoals,_that.experienceLevel,_that.primaryGoalDescription,_that.currentChallenges,_that.desiredOutcome,_that.commitmentLevel,_that.previousCoachingExperience);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<CoachingGoal> selectedGoals,  ExperienceLevel experienceLevel,  String? primaryGoalDescription,  String? currentChallenges,  String? desiredOutcome,  int commitmentLevel,  String? previousCoachingExperience)?  $default,) {final _that = this;
switch (_that) {
case _OnboardingGoals() when $default != null:
return $default(_that.selectedGoals,_that.experienceLevel,_that.primaryGoalDescription,_that.currentChallenges,_that.desiredOutcome,_that.commitmentLevel,_that.previousCoachingExperience);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _OnboardingGoals implements OnboardingGoals {
  const _OnboardingGoals({final  List<CoachingGoal> selectedGoals = const [], this.experienceLevel = ExperienceLevel.beginner, this.primaryGoalDescription, this.currentChallenges, this.desiredOutcome, this.commitmentLevel = 3, this.previousCoachingExperience}): _selectedGoals = selectedGoals;
  factory _OnboardingGoals.fromJson(Map<String, dynamic> json) => _$OnboardingGoalsFromJson(json);

 final  List<CoachingGoal> _selectedGoals;
@override@JsonKey() List<CoachingGoal> get selectedGoals {
  if (_selectedGoals is EqualUnmodifiableListView) return _selectedGoals;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_selectedGoals);
}

@override@JsonKey() final  ExperienceLevel experienceLevel;
@override final  String? primaryGoalDescription;
@override final  String? currentChallenges;
@override final  String? desiredOutcome;
@override@JsonKey() final  int commitmentLevel;
// 1-5 scale
@override final  String? previousCoachingExperience;

/// Create a copy of OnboardingGoals
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OnboardingGoalsCopyWith<_OnboardingGoals> get copyWith => __$OnboardingGoalsCopyWithImpl<_OnboardingGoals>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OnboardingGoalsToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _OnboardingGoals&&const DeepCollectionEquality().equals(other._selectedGoals, _selectedGoals)&&(identical(other.experienceLevel, experienceLevel) || other.experienceLevel == experienceLevel)&&(identical(other.primaryGoalDescription, primaryGoalDescription) || other.primaryGoalDescription == primaryGoalDescription)&&(identical(other.currentChallenges, currentChallenges) || other.currentChallenges == currentChallenges)&&(identical(other.desiredOutcome, desiredOutcome) || other.desiredOutcome == desiredOutcome)&&(identical(other.commitmentLevel, commitmentLevel) || other.commitmentLevel == commitmentLevel)&&(identical(other.previousCoachingExperience, previousCoachingExperience) || other.previousCoachingExperience == previousCoachingExperience));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_selectedGoals),experienceLevel,primaryGoalDescription,currentChallenges,desiredOutcome,commitmentLevel,previousCoachingExperience);

@override
String toString() {
  return 'OnboardingGoals(selectedGoals: $selectedGoals, experienceLevel: $experienceLevel, primaryGoalDescription: $primaryGoalDescription, currentChallenges: $currentChallenges, desiredOutcome: $desiredOutcome, commitmentLevel: $commitmentLevel, previousCoachingExperience: $previousCoachingExperience)';
}


}

/// @nodoc
abstract mixin class _$OnboardingGoalsCopyWith<$Res> implements $OnboardingGoalsCopyWith<$Res> {
  factory _$OnboardingGoalsCopyWith(_OnboardingGoals value, $Res Function(_OnboardingGoals) _then) = __$OnboardingGoalsCopyWithImpl;
@override @useResult
$Res call({
 List<CoachingGoal> selectedGoals, ExperienceLevel experienceLevel, String? primaryGoalDescription, String? currentChallenges, String? desiredOutcome, int commitmentLevel, String? previousCoachingExperience
});




}
/// @nodoc
class __$OnboardingGoalsCopyWithImpl<$Res>
    implements _$OnboardingGoalsCopyWith<$Res> {
  __$OnboardingGoalsCopyWithImpl(this._self, this._then);

  final _OnboardingGoals _self;
  final $Res Function(_OnboardingGoals) _then;

/// Create a copy of OnboardingGoals
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? selectedGoals = null,Object? experienceLevel = null,Object? primaryGoalDescription = freezed,Object? currentChallenges = freezed,Object? desiredOutcome = freezed,Object? commitmentLevel = null,Object? previousCoachingExperience = freezed,}) {
  return _then(_OnboardingGoals(
selectedGoals: null == selectedGoals ? _self._selectedGoals : selectedGoals // ignore: cast_nullable_to_non_nullable
as List<CoachingGoal>,experienceLevel: null == experienceLevel ? _self.experienceLevel : experienceLevel // ignore: cast_nullable_to_non_nullable
as ExperienceLevel,primaryGoalDescription: freezed == primaryGoalDescription ? _self.primaryGoalDescription : primaryGoalDescription // ignore: cast_nullable_to_non_nullable
as String?,currentChallenges: freezed == currentChallenges ? _self.currentChallenges : currentChallenges // ignore: cast_nullable_to_non_nullable
as String?,desiredOutcome: freezed == desiredOutcome ? _self.desiredOutcome : desiredOutcome // ignore: cast_nullable_to_non_nullable
as String?,commitmentLevel: null == commitmentLevel ? _self.commitmentLevel : commitmentLevel // ignore: cast_nullable_to_non_nullable
as int,previousCoachingExperience: freezed == previousCoachingExperience ? _self.previousCoachingExperience : previousCoachingExperience // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$CoachPreferences {

 List<String> get preferredSpecializations; SessionPreference get sessionPreference; List<AvailabilityPreference> get availabilityPreferences; double? get maxBudgetPerSession; String get currency; List<String> get preferredLanguages; String? get genderPreference; bool get requiresCertified;
/// Create a copy of CoachPreferences
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CoachPreferencesCopyWith<CoachPreferences> get copyWith => _$CoachPreferencesCopyWithImpl<CoachPreferences>(this as CoachPreferences, _$identity);

  /// Serializes this CoachPreferences to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CoachPreferences&&const DeepCollectionEquality().equals(other.preferredSpecializations, preferredSpecializations)&&(identical(other.sessionPreference, sessionPreference) || other.sessionPreference == sessionPreference)&&const DeepCollectionEquality().equals(other.availabilityPreferences, availabilityPreferences)&&(identical(other.maxBudgetPerSession, maxBudgetPerSession) || other.maxBudgetPerSession == maxBudgetPerSession)&&(identical(other.currency, currency) || other.currency == currency)&&const DeepCollectionEquality().equals(other.preferredLanguages, preferredLanguages)&&(identical(other.genderPreference, genderPreference) || other.genderPreference == genderPreference)&&(identical(other.requiresCertified, requiresCertified) || other.requiresCertified == requiresCertified));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(preferredSpecializations),sessionPreference,const DeepCollectionEquality().hash(availabilityPreferences),maxBudgetPerSession,currency,const DeepCollectionEquality().hash(preferredLanguages),genderPreference,requiresCertified);

@override
String toString() {
  return 'CoachPreferences(preferredSpecializations: $preferredSpecializations, sessionPreference: $sessionPreference, availabilityPreferences: $availabilityPreferences, maxBudgetPerSession: $maxBudgetPerSession, currency: $currency, preferredLanguages: $preferredLanguages, genderPreference: $genderPreference, requiresCertified: $requiresCertified)';
}


}

/// @nodoc
abstract mixin class $CoachPreferencesCopyWith<$Res>  {
  factory $CoachPreferencesCopyWith(CoachPreferences value, $Res Function(CoachPreferences) _then) = _$CoachPreferencesCopyWithImpl;
@useResult
$Res call({
 List<String> preferredSpecializations, SessionPreference sessionPreference, List<AvailabilityPreference> availabilityPreferences, double? maxBudgetPerSession, String currency, List<String> preferredLanguages, String? genderPreference, bool requiresCertified
});




}
/// @nodoc
class _$CoachPreferencesCopyWithImpl<$Res>
    implements $CoachPreferencesCopyWith<$Res> {
  _$CoachPreferencesCopyWithImpl(this._self, this._then);

  final CoachPreferences _self;
  final $Res Function(CoachPreferences) _then;

/// Create a copy of CoachPreferences
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? preferredSpecializations = null,Object? sessionPreference = null,Object? availabilityPreferences = null,Object? maxBudgetPerSession = freezed,Object? currency = null,Object? preferredLanguages = null,Object? genderPreference = freezed,Object? requiresCertified = null,}) {
  return _then(_self.copyWith(
preferredSpecializations: null == preferredSpecializations ? _self.preferredSpecializations : preferredSpecializations // ignore: cast_nullable_to_non_nullable
as List<String>,sessionPreference: null == sessionPreference ? _self.sessionPreference : sessionPreference // ignore: cast_nullable_to_non_nullable
as SessionPreference,availabilityPreferences: null == availabilityPreferences ? _self.availabilityPreferences : availabilityPreferences // ignore: cast_nullable_to_non_nullable
as List<AvailabilityPreference>,maxBudgetPerSession: freezed == maxBudgetPerSession ? _self.maxBudgetPerSession : maxBudgetPerSession // ignore: cast_nullable_to_non_nullable
as double?,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,preferredLanguages: null == preferredLanguages ? _self.preferredLanguages : preferredLanguages // ignore: cast_nullable_to_non_nullable
as List<String>,genderPreference: freezed == genderPreference ? _self.genderPreference : genderPreference // ignore: cast_nullable_to_non_nullable
as String?,requiresCertified: null == requiresCertified ? _self.requiresCertified : requiresCertified // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [CoachPreferences].
extension CoachPreferencesPatterns on CoachPreferences {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CoachPreferences value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CoachPreferences() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CoachPreferences value)  $default,){
final _that = this;
switch (_that) {
case _CoachPreferences():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CoachPreferences value)?  $default,){
final _that = this;
switch (_that) {
case _CoachPreferences() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<String> preferredSpecializations,  SessionPreference sessionPreference,  List<AvailabilityPreference> availabilityPreferences,  double? maxBudgetPerSession,  String currency,  List<String> preferredLanguages,  String? genderPreference,  bool requiresCertified)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CoachPreferences() when $default != null:
return $default(_that.preferredSpecializations,_that.sessionPreference,_that.availabilityPreferences,_that.maxBudgetPerSession,_that.currency,_that.preferredLanguages,_that.genderPreference,_that.requiresCertified);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<String> preferredSpecializations,  SessionPreference sessionPreference,  List<AvailabilityPreference> availabilityPreferences,  double? maxBudgetPerSession,  String currency,  List<String> preferredLanguages,  String? genderPreference,  bool requiresCertified)  $default,) {final _that = this;
switch (_that) {
case _CoachPreferences():
return $default(_that.preferredSpecializations,_that.sessionPreference,_that.availabilityPreferences,_that.maxBudgetPerSession,_that.currency,_that.preferredLanguages,_that.genderPreference,_that.requiresCertified);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<String> preferredSpecializations,  SessionPreference sessionPreference,  List<AvailabilityPreference> availabilityPreferences,  double? maxBudgetPerSession,  String currency,  List<String> preferredLanguages,  String? genderPreference,  bool requiresCertified)?  $default,) {final _that = this;
switch (_that) {
case _CoachPreferences() when $default != null:
return $default(_that.preferredSpecializations,_that.sessionPreference,_that.availabilityPreferences,_that.maxBudgetPerSession,_that.currency,_that.preferredLanguages,_that.genderPreference,_that.requiresCertified);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CoachPreferences implements CoachPreferences {
  const _CoachPreferences({final  List<String> preferredSpecializations = const [], this.sessionPreference = SessionPreference.any, final  List<AvailabilityPreference> availabilityPreferences = const [], this.maxBudgetPerSession, this.currency = 'USD', final  List<String> preferredLanguages = const [], this.genderPreference, this.requiresCertified = false}): _preferredSpecializations = preferredSpecializations,_availabilityPreferences = availabilityPreferences,_preferredLanguages = preferredLanguages;
  factory _CoachPreferences.fromJson(Map<String, dynamic> json) => _$CoachPreferencesFromJson(json);

 final  List<String> _preferredSpecializations;
@override@JsonKey() List<String> get preferredSpecializations {
  if (_preferredSpecializations is EqualUnmodifiableListView) return _preferredSpecializations;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_preferredSpecializations);
}

@override@JsonKey() final  SessionPreference sessionPreference;
 final  List<AvailabilityPreference> _availabilityPreferences;
@override@JsonKey() List<AvailabilityPreference> get availabilityPreferences {
  if (_availabilityPreferences is EqualUnmodifiableListView) return _availabilityPreferences;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_availabilityPreferences);
}

@override final  double? maxBudgetPerSession;
@override@JsonKey() final  String currency;
 final  List<String> _preferredLanguages;
@override@JsonKey() List<String> get preferredLanguages {
  if (_preferredLanguages is EqualUnmodifiableListView) return _preferredLanguages;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_preferredLanguages);
}

@override final  String? genderPreference;
@override@JsonKey() final  bool requiresCertified;

/// Create a copy of CoachPreferences
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CoachPreferencesCopyWith<_CoachPreferences> get copyWith => __$CoachPreferencesCopyWithImpl<_CoachPreferences>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CoachPreferencesToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CoachPreferences&&const DeepCollectionEquality().equals(other._preferredSpecializations, _preferredSpecializations)&&(identical(other.sessionPreference, sessionPreference) || other.sessionPreference == sessionPreference)&&const DeepCollectionEquality().equals(other._availabilityPreferences, _availabilityPreferences)&&(identical(other.maxBudgetPerSession, maxBudgetPerSession) || other.maxBudgetPerSession == maxBudgetPerSession)&&(identical(other.currency, currency) || other.currency == currency)&&const DeepCollectionEquality().equals(other._preferredLanguages, _preferredLanguages)&&(identical(other.genderPreference, genderPreference) || other.genderPreference == genderPreference)&&(identical(other.requiresCertified, requiresCertified) || other.requiresCertified == requiresCertified));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_preferredSpecializations),sessionPreference,const DeepCollectionEquality().hash(_availabilityPreferences),maxBudgetPerSession,currency,const DeepCollectionEquality().hash(_preferredLanguages),genderPreference,requiresCertified);

@override
String toString() {
  return 'CoachPreferences(preferredSpecializations: $preferredSpecializations, sessionPreference: $sessionPreference, availabilityPreferences: $availabilityPreferences, maxBudgetPerSession: $maxBudgetPerSession, currency: $currency, preferredLanguages: $preferredLanguages, genderPreference: $genderPreference, requiresCertified: $requiresCertified)';
}


}

/// @nodoc
abstract mixin class _$CoachPreferencesCopyWith<$Res> implements $CoachPreferencesCopyWith<$Res> {
  factory _$CoachPreferencesCopyWith(_CoachPreferences value, $Res Function(_CoachPreferences) _then) = __$CoachPreferencesCopyWithImpl;
@override @useResult
$Res call({
 List<String> preferredSpecializations, SessionPreference sessionPreference, List<AvailabilityPreference> availabilityPreferences, double? maxBudgetPerSession, String currency, List<String> preferredLanguages, String? genderPreference, bool requiresCertified
});




}
/// @nodoc
class __$CoachPreferencesCopyWithImpl<$Res>
    implements _$CoachPreferencesCopyWith<$Res> {
  __$CoachPreferencesCopyWithImpl(this._self, this._then);

  final _CoachPreferences _self;
  final $Res Function(_CoachPreferences) _then;

/// Create a copy of CoachPreferences
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? preferredSpecializations = null,Object? sessionPreference = null,Object? availabilityPreferences = null,Object? maxBudgetPerSession = freezed,Object? currency = null,Object? preferredLanguages = null,Object? genderPreference = freezed,Object? requiresCertified = null,}) {
  return _then(_CoachPreferences(
preferredSpecializations: null == preferredSpecializations ? _self._preferredSpecializations : preferredSpecializations // ignore: cast_nullable_to_non_nullable
as List<String>,sessionPreference: null == sessionPreference ? _self.sessionPreference : sessionPreference // ignore: cast_nullable_to_non_nullable
as SessionPreference,availabilityPreferences: null == availabilityPreferences ? _self._availabilityPreferences : availabilityPreferences // ignore: cast_nullable_to_non_nullable
as List<AvailabilityPreference>,maxBudgetPerSession: freezed == maxBudgetPerSession ? _self.maxBudgetPerSession : maxBudgetPerSession // ignore: cast_nullable_to_non_nullable
as double?,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,preferredLanguages: null == preferredLanguages ? _self._preferredLanguages : preferredLanguages // ignore: cast_nullable_to_non_nullable
as List<String>,genderPreference: freezed == genderPreference ? _self.genderPreference : genderPreference // ignore: cast_nullable_to_non_nullable
as String?,requiresCertified: null == requiresCertified ? _self.requiresCertified : requiresCertified // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}


/// @nodoc
mixin _$OnboardingData {

 OnboardingStep get currentStep; OnboardingProfile get profile; OnboardingGoals get goals; CoachPreferences get coachPreferences; bool get notificationsEnabled; bool get marketingEmailsEnabled; DateTime? get completedAt;
/// Create a copy of OnboardingData
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OnboardingDataCopyWith<OnboardingData> get copyWith => _$OnboardingDataCopyWithImpl<OnboardingData>(this as OnboardingData, _$identity);

  /// Serializes this OnboardingData to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OnboardingData&&(identical(other.currentStep, currentStep) || other.currentStep == currentStep)&&(identical(other.profile, profile) || other.profile == profile)&&(identical(other.goals, goals) || other.goals == goals)&&(identical(other.coachPreferences, coachPreferences) || other.coachPreferences == coachPreferences)&&(identical(other.notificationsEnabled, notificationsEnabled) || other.notificationsEnabled == notificationsEnabled)&&(identical(other.marketingEmailsEnabled, marketingEmailsEnabled) || other.marketingEmailsEnabled == marketingEmailsEnabled)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,currentStep,profile,goals,coachPreferences,notificationsEnabled,marketingEmailsEnabled,completedAt);

@override
String toString() {
  return 'OnboardingData(currentStep: $currentStep, profile: $profile, goals: $goals, coachPreferences: $coachPreferences, notificationsEnabled: $notificationsEnabled, marketingEmailsEnabled: $marketingEmailsEnabled, completedAt: $completedAt)';
}


}

/// @nodoc
abstract mixin class $OnboardingDataCopyWith<$Res>  {
  factory $OnboardingDataCopyWith(OnboardingData value, $Res Function(OnboardingData) _then) = _$OnboardingDataCopyWithImpl;
@useResult
$Res call({
 OnboardingStep currentStep, OnboardingProfile profile, OnboardingGoals goals, CoachPreferences coachPreferences, bool notificationsEnabled, bool marketingEmailsEnabled, DateTime? completedAt
});


$OnboardingProfileCopyWith<$Res> get profile;$OnboardingGoalsCopyWith<$Res> get goals;$CoachPreferencesCopyWith<$Res> get coachPreferences;

}
/// @nodoc
class _$OnboardingDataCopyWithImpl<$Res>
    implements $OnboardingDataCopyWith<$Res> {
  _$OnboardingDataCopyWithImpl(this._self, this._then);

  final OnboardingData _self;
  final $Res Function(OnboardingData) _then;

/// Create a copy of OnboardingData
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? currentStep = null,Object? profile = null,Object? goals = null,Object? coachPreferences = null,Object? notificationsEnabled = null,Object? marketingEmailsEnabled = null,Object? completedAt = freezed,}) {
  return _then(_self.copyWith(
currentStep: null == currentStep ? _self.currentStep : currentStep // ignore: cast_nullable_to_non_nullable
as OnboardingStep,profile: null == profile ? _self.profile : profile // ignore: cast_nullable_to_non_nullable
as OnboardingProfile,goals: null == goals ? _self.goals : goals // ignore: cast_nullable_to_non_nullable
as OnboardingGoals,coachPreferences: null == coachPreferences ? _self.coachPreferences : coachPreferences // ignore: cast_nullable_to_non_nullable
as CoachPreferences,notificationsEnabled: null == notificationsEnabled ? _self.notificationsEnabled : notificationsEnabled // ignore: cast_nullable_to_non_nullable
as bool,marketingEmailsEnabled: null == marketingEmailsEnabled ? _self.marketingEmailsEnabled : marketingEmailsEnabled // ignore: cast_nullable_to_non_nullable
as bool,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}
/// Create a copy of OnboardingData
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OnboardingProfileCopyWith<$Res> get profile {
  
  return $OnboardingProfileCopyWith<$Res>(_self.profile, (value) {
    return _then(_self.copyWith(profile: value));
  });
}/// Create a copy of OnboardingData
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OnboardingGoalsCopyWith<$Res> get goals {
  
  return $OnboardingGoalsCopyWith<$Res>(_self.goals, (value) {
    return _then(_self.copyWith(goals: value));
  });
}/// Create a copy of OnboardingData
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CoachPreferencesCopyWith<$Res> get coachPreferences {
  
  return $CoachPreferencesCopyWith<$Res>(_self.coachPreferences, (value) {
    return _then(_self.copyWith(coachPreferences: value));
  });
}
}


/// Adds pattern-matching-related methods to [OnboardingData].
extension OnboardingDataPatterns on OnboardingData {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _OnboardingData value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _OnboardingData() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _OnboardingData value)  $default,){
final _that = this;
switch (_that) {
case _OnboardingData():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _OnboardingData value)?  $default,){
final _that = this;
switch (_that) {
case _OnboardingData() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( OnboardingStep currentStep,  OnboardingProfile profile,  OnboardingGoals goals,  CoachPreferences coachPreferences,  bool notificationsEnabled,  bool marketingEmailsEnabled,  DateTime? completedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _OnboardingData() when $default != null:
return $default(_that.currentStep,_that.profile,_that.goals,_that.coachPreferences,_that.notificationsEnabled,_that.marketingEmailsEnabled,_that.completedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( OnboardingStep currentStep,  OnboardingProfile profile,  OnboardingGoals goals,  CoachPreferences coachPreferences,  bool notificationsEnabled,  bool marketingEmailsEnabled,  DateTime? completedAt)  $default,) {final _that = this;
switch (_that) {
case _OnboardingData():
return $default(_that.currentStep,_that.profile,_that.goals,_that.coachPreferences,_that.notificationsEnabled,_that.marketingEmailsEnabled,_that.completedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( OnboardingStep currentStep,  OnboardingProfile profile,  OnboardingGoals goals,  CoachPreferences coachPreferences,  bool notificationsEnabled,  bool marketingEmailsEnabled,  DateTime? completedAt)?  $default,) {final _that = this;
switch (_that) {
case _OnboardingData() when $default != null:
return $default(_that.currentStep,_that.profile,_that.goals,_that.coachPreferences,_that.notificationsEnabled,_that.marketingEmailsEnabled,_that.completedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _OnboardingData extends OnboardingData {
  const _OnboardingData({this.currentStep = OnboardingStep.welcome, this.profile = const OnboardingProfile(), this.goals = const OnboardingGoals(), this.coachPreferences = const CoachPreferences(), this.notificationsEnabled = false, this.marketingEmailsEnabled = false, this.completedAt}): super._();
  factory _OnboardingData.fromJson(Map<String, dynamic> json) => _$OnboardingDataFromJson(json);

@override@JsonKey() final  OnboardingStep currentStep;
@override@JsonKey() final  OnboardingProfile profile;
@override@JsonKey() final  OnboardingGoals goals;
@override@JsonKey() final  CoachPreferences coachPreferences;
@override@JsonKey() final  bool notificationsEnabled;
@override@JsonKey() final  bool marketingEmailsEnabled;
@override final  DateTime? completedAt;

/// Create a copy of OnboardingData
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OnboardingDataCopyWith<_OnboardingData> get copyWith => __$OnboardingDataCopyWithImpl<_OnboardingData>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OnboardingDataToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _OnboardingData&&(identical(other.currentStep, currentStep) || other.currentStep == currentStep)&&(identical(other.profile, profile) || other.profile == profile)&&(identical(other.goals, goals) || other.goals == goals)&&(identical(other.coachPreferences, coachPreferences) || other.coachPreferences == coachPreferences)&&(identical(other.notificationsEnabled, notificationsEnabled) || other.notificationsEnabled == notificationsEnabled)&&(identical(other.marketingEmailsEnabled, marketingEmailsEnabled) || other.marketingEmailsEnabled == marketingEmailsEnabled)&&(identical(other.completedAt, completedAt) || other.completedAt == completedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,currentStep,profile,goals,coachPreferences,notificationsEnabled,marketingEmailsEnabled,completedAt);

@override
String toString() {
  return 'OnboardingData(currentStep: $currentStep, profile: $profile, goals: $goals, coachPreferences: $coachPreferences, notificationsEnabled: $notificationsEnabled, marketingEmailsEnabled: $marketingEmailsEnabled, completedAt: $completedAt)';
}


}

/// @nodoc
abstract mixin class _$OnboardingDataCopyWith<$Res> implements $OnboardingDataCopyWith<$Res> {
  factory _$OnboardingDataCopyWith(_OnboardingData value, $Res Function(_OnboardingData) _then) = __$OnboardingDataCopyWithImpl;
@override @useResult
$Res call({
 OnboardingStep currentStep, OnboardingProfile profile, OnboardingGoals goals, CoachPreferences coachPreferences, bool notificationsEnabled, bool marketingEmailsEnabled, DateTime? completedAt
});


@override $OnboardingProfileCopyWith<$Res> get profile;@override $OnboardingGoalsCopyWith<$Res> get goals;@override $CoachPreferencesCopyWith<$Res> get coachPreferences;

}
/// @nodoc
class __$OnboardingDataCopyWithImpl<$Res>
    implements _$OnboardingDataCopyWith<$Res> {
  __$OnboardingDataCopyWithImpl(this._self, this._then);

  final _OnboardingData _self;
  final $Res Function(_OnboardingData) _then;

/// Create a copy of OnboardingData
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? currentStep = null,Object? profile = null,Object? goals = null,Object? coachPreferences = null,Object? notificationsEnabled = null,Object? marketingEmailsEnabled = null,Object? completedAt = freezed,}) {
  return _then(_OnboardingData(
currentStep: null == currentStep ? _self.currentStep : currentStep // ignore: cast_nullable_to_non_nullable
as OnboardingStep,profile: null == profile ? _self.profile : profile // ignore: cast_nullable_to_non_nullable
as OnboardingProfile,goals: null == goals ? _self.goals : goals // ignore: cast_nullable_to_non_nullable
as OnboardingGoals,coachPreferences: null == coachPreferences ? _self.coachPreferences : coachPreferences // ignore: cast_nullable_to_non_nullable
as CoachPreferences,notificationsEnabled: null == notificationsEnabled ? _self.notificationsEnabled : notificationsEnabled // ignore: cast_nullable_to_non_nullable
as bool,marketingEmailsEnabled: null == marketingEmailsEnabled ? _self.marketingEmailsEnabled : marketingEmailsEnabled // ignore: cast_nullable_to_non_nullable
as bool,completedAt: freezed == completedAt ? _self.completedAt : completedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

/// Create a copy of OnboardingData
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OnboardingProfileCopyWith<$Res> get profile {
  
  return $OnboardingProfileCopyWith<$Res>(_self.profile, (value) {
    return _then(_self.copyWith(profile: value));
  });
}/// Create a copy of OnboardingData
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OnboardingGoalsCopyWith<$Res> get goals {
  
  return $OnboardingGoalsCopyWith<$Res>(_self.goals, (value) {
    return _then(_self.copyWith(goals: value));
  });
}/// Create a copy of OnboardingData
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CoachPreferencesCopyWith<$Res> get coachPreferences {
  
  return $CoachPreferencesCopyWith<$Res>(_self.coachPreferences, (value) {
    return _then(_self.copyWith(coachPreferences: value));
  });
}
}


/// @nodoc
mixin _$RecommendedCoach {

 int get id; String get displayName; String? get profileImageUrl; List<String> get specializations; double get averageRating; int get totalSessions; double? get hourlyRate; String get currency; String? get bio; double get matchScore;
/// Create a copy of RecommendedCoach
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RecommendedCoachCopyWith<RecommendedCoach> get copyWith => _$RecommendedCoachCopyWithImpl<RecommendedCoach>(this as RecommendedCoach, _$identity);

  /// Serializes this RecommendedCoach to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RecommendedCoach&&(identical(other.id, id) || other.id == id)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.profileImageUrl, profileImageUrl) || other.profileImageUrl == profileImageUrl)&&const DeepCollectionEquality().equals(other.specializations, specializations)&&(identical(other.averageRating, averageRating) || other.averageRating == averageRating)&&(identical(other.totalSessions, totalSessions) || other.totalSessions == totalSessions)&&(identical(other.hourlyRate, hourlyRate) || other.hourlyRate == hourlyRate)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.bio, bio) || other.bio == bio)&&(identical(other.matchScore, matchScore) || other.matchScore == matchScore));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,displayName,profileImageUrl,const DeepCollectionEquality().hash(specializations),averageRating,totalSessions,hourlyRate,currency,bio,matchScore);

@override
String toString() {
  return 'RecommendedCoach(id: $id, displayName: $displayName, profileImageUrl: $profileImageUrl, specializations: $specializations, averageRating: $averageRating, totalSessions: $totalSessions, hourlyRate: $hourlyRate, currency: $currency, bio: $bio, matchScore: $matchScore)';
}


}

/// @nodoc
abstract mixin class $RecommendedCoachCopyWith<$Res>  {
  factory $RecommendedCoachCopyWith(RecommendedCoach value, $Res Function(RecommendedCoach) _then) = _$RecommendedCoachCopyWithImpl;
@useResult
$Res call({
 int id, String displayName, String? profileImageUrl, List<String> specializations, double averageRating, int totalSessions, double? hourlyRate, String currency, String? bio, double matchScore
});




}
/// @nodoc
class _$RecommendedCoachCopyWithImpl<$Res>
    implements $RecommendedCoachCopyWith<$Res> {
  _$RecommendedCoachCopyWithImpl(this._self, this._then);

  final RecommendedCoach _self;
  final $Res Function(RecommendedCoach) _then;

/// Create a copy of RecommendedCoach
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? displayName = null,Object? profileImageUrl = freezed,Object? specializations = null,Object? averageRating = null,Object? totalSessions = null,Object? hourlyRate = freezed,Object? currency = null,Object? bio = freezed,Object? matchScore = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,profileImageUrl: freezed == profileImageUrl ? _self.profileImageUrl : profileImageUrl // ignore: cast_nullable_to_non_nullable
as String?,specializations: null == specializations ? _self.specializations : specializations // ignore: cast_nullable_to_non_nullable
as List<String>,averageRating: null == averageRating ? _self.averageRating : averageRating // ignore: cast_nullable_to_non_nullable
as double,totalSessions: null == totalSessions ? _self.totalSessions : totalSessions // ignore: cast_nullable_to_non_nullable
as int,hourlyRate: freezed == hourlyRate ? _self.hourlyRate : hourlyRate // ignore: cast_nullable_to_non_nullable
as double?,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,bio: freezed == bio ? _self.bio : bio // ignore: cast_nullable_to_non_nullable
as String?,matchScore: null == matchScore ? _self.matchScore : matchScore // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

}


/// Adds pattern-matching-related methods to [RecommendedCoach].
extension RecommendedCoachPatterns on RecommendedCoach {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _RecommendedCoach value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _RecommendedCoach() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _RecommendedCoach value)  $default,){
final _that = this;
switch (_that) {
case _RecommendedCoach():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _RecommendedCoach value)?  $default,){
final _that = this;
switch (_that) {
case _RecommendedCoach() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  String displayName,  String? profileImageUrl,  List<String> specializations,  double averageRating,  int totalSessions,  double? hourlyRate,  String currency,  String? bio,  double matchScore)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _RecommendedCoach() when $default != null:
return $default(_that.id,_that.displayName,_that.profileImageUrl,_that.specializations,_that.averageRating,_that.totalSessions,_that.hourlyRate,_that.currency,_that.bio,_that.matchScore);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  String displayName,  String? profileImageUrl,  List<String> specializations,  double averageRating,  int totalSessions,  double? hourlyRate,  String currency,  String? bio,  double matchScore)  $default,) {final _that = this;
switch (_that) {
case _RecommendedCoach():
return $default(_that.id,_that.displayName,_that.profileImageUrl,_that.specializations,_that.averageRating,_that.totalSessions,_that.hourlyRate,_that.currency,_that.bio,_that.matchScore);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  String displayName,  String? profileImageUrl,  List<String> specializations,  double averageRating,  int totalSessions,  double? hourlyRate,  String currency,  String? bio,  double matchScore)?  $default,) {final _that = this;
switch (_that) {
case _RecommendedCoach() when $default != null:
return $default(_that.id,_that.displayName,_that.profileImageUrl,_that.specializations,_that.averageRating,_that.totalSessions,_that.hourlyRate,_that.currency,_that.bio,_that.matchScore);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _RecommendedCoach implements RecommendedCoach {
  const _RecommendedCoach({required this.id, required this.displayName, this.profileImageUrl, final  List<String> specializations = const [], this.averageRating = 0.0, this.totalSessions = 0, this.hourlyRate, this.currency = 'USD', this.bio, this.matchScore = 0.0}): _specializations = specializations;
  factory _RecommendedCoach.fromJson(Map<String, dynamic> json) => _$RecommendedCoachFromJson(json);

@override final  int id;
@override final  String displayName;
@override final  String? profileImageUrl;
 final  List<String> _specializations;
@override@JsonKey() List<String> get specializations {
  if (_specializations is EqualUnmodifiableListView) return _specializations;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_specializations);
}

@override@JsonKey() final  double averageRating;
@override@JsonKey() final  int totalSessions;
@override final  double? hourlyRate;
@override@JsonKey() final  String currency;
@override final  String? bio;
@override@JsonKey() final  double matchScore;

/// Create a copy of RecommendedCoach
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RecommendedCoachCopyWith<_RecommendedCoach> get copyWith => __$RecommendedCoachCopyWithImpl<_RecommendedCoach>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RecommendedCoachToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _RecommendedCoach&&(identical(other.id, id) || other.id == id)&&(identical(other.displayName, displayName) || other.displayName == displayName)&&(identical(other.profileImageUrl, profileImageUrl) || other.profileImageUrl == profileImageUrl)&&const DeepCollectionEquality().equals(other._specializations, _specializations)&&(identical(other.averageRating, averageRating) || other.averageRating == averageRating)&&(identical(other.totalSessions, totalSessions) || other.totalSessions == totalSessions)&&(identical(other.hourlyRate, hourlyRate) || other.hourlyRate == hourlyRate)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.bio, bio) || other.bio == bio)&&(identical(other.matchScore, matchScore) || other.matchScore == matchScore));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,displayName,profileImageUrl,const DeepCollectionEquality().hash(_specializations),averageRating,totalSessions,hourlyRate,currency,bio,matchScore);

@override
String toString() {
  return 'RecommendedCoach(id: $id, displayName: $displayName, profileImageUrl: $profileImageUrl, specializations: $specializations, averageRating: $averageRating, totalSessions: $totalSessions, hourlyRate: $hourlyRate, currency: $currency, bio: $bio, matchScore: $matchScore)';
}


}

/// @nodoc
abstract mixin class _$RecommendedCoachCopyWith<$Res> implements $RecommendedCoachCopyWith<$Res> {
  factory _$RecommendedCoachCopyWith(_RecommendedCoach value, $Res Function(_RecommendedCoach) _then) = __$RecommendedCoachCopyWithImpl;
@override @useResult
$Res call({
 int id, String displayName, String? profileImageUrl, List<String> specializations, double averageRating, int totalSessions, double? hourlyRate, String currency, String? bio, double matchScore
});




}
/// @nodoc
class __$RecommendedCoachCopyWithImpl<$Res>
    implements _$RecommendedCoachCopyWith<$Res> {
  __$RecommendedCoachCopyWithImpl(this._self, this._then);

  final _RecommendedCoach _self;
  final $Res Function(_RecommendedCoach) _then;

/// Create a copy of RecommendedCoach
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? displayName = null,Object? profileImageUrl = freezed,Object? specializations = null,Object? averageRating = null,Object? totalSessions = null,Object? hourlyRate = freezed,Object? currency = null,Object? bio = freezed,Object? matchScore = null,}) {
  return _then(_RecommendedCoach(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,displayName: null == displayName ? _self.displayName : displayName // ignore: cast_nullable_to_non_nullable
as String,profileImageUrl: freezed == profileImageUrl ? _self.profileImageUrl : profileImageUrl // ignore: cast_nullable_to_non_nullable
as String?,specializations: null == specializations ? _self._specializations : specializations // ignore: cast_nullable_to_non_nullable
as List<String>,averageRating: null == averageRating ? _self.averageRating : averageRating // ignore: cast_nullable_to_non_nullable
as double,totalSessions: null == totalSessions ? _self.totalSessions : totalSessions // ignore: cast_nullable_to_non_nullable
as int,hourlyRate: freezed == hourlyRate ? _self.hourlyRate : hourlyRate // ignore: cast_nullable_to_non_nullable
as double?,currency: null == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String,bio: freezed == bio ? _self.bio : bio // ignore: cast_nullable_to_non_nullable
as String?,matchScore: null == matchScore ? _self.matchScore : matchScore // ignore: cast_nullable_to_non_nullable
as double,
  ));
}


}

// dart format on
