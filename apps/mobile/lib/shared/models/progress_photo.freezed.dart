// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'progress_photo.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ProgressPhoto {

 String get id; String get imagePath; String? get title; String get category; String? get notes; DateTime get takenAt; DateTime? get createdAt; DateTime? get updatedAt; bool get isFavorite; List<String> get tags;
/// Create a copy of ProgressPhoto
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProgressPhotoCopyWith<ProgressPhoto> get copyWith => _$ProgressPhotoCopyWithImpl<ProgressPhoto>(this as ProgressPhoto, _$identity);

  /// Serializes this ProgressPhoto to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProgressPhoto&&(identical(other.id, id) || other.id == id)&&(identical(other.imagePath, imagePath) || other.imagePath == imagePath)&&(identical(other.title, title) || other.title == title)&&(identical(other.category, category) || other.category == category)&&(identical(other.notes, notes) || other.notes == notes)&&(identical(other.takenAt, takenAt) || other.takenAt == takenAt)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.isFavorite, isFavorite) || other.isFavorite == isFavorite)&&const DeepCollectionEquality().equals(other.tags, tags));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,imagePath,title,category,notes,takenAt,createdAt,updatedAt,isFavorite,const DeepCollectionEquality().hash(tags));

@override
String toString() {
  return 'ProgressPhoto(id: $id, imagePath: $imagePath, title: $title, category: $category, notes: $notes, takenAt: $takenAt, createdAt: $createdAt, updatedAt: $updatedAt, isFavorite: $isFavorite, tags: $tags)';
}


}

/// @nodoc
abstract mixin class $ProgressPhotoCopyWith<$Res>  {
  factory $ProgressPhotoCopyWith(ProgressPhoto value, $Res Function(ProgressPhoto) _then) = _$ProgressPhotoCopyWithImpl;
@useResult
$Res call({
 String id, String imagePath, String? title, String category, String? notes, DateTime takenAt, DateTime? createdAt, DateTime? updatedAt, bool isFavorite, List<String> tags
});




}
/// @nodoc
class _$ProgressPhotoCopyWithImpl<$Res>
    implements $ProgressPhotoCopyWith<$Res> {
  _$ProgressPhotoCopyWithImpl(this._self, this._then);

  final ProgressPhoto _self;
  final $Res Function(ProgressPhoto) _then;

/// Create a copy of ProgressPhoto
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? imagePath = null,Object? title = freezed,Object? category = null,Object? notes = freezed,Object? takenAt = null,Object? createdAt = freezed,Object? updatedAt = freezed,Object? isFavorite = null,Object? tags = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,imagePath: null == imagePath ? _self.imagePath : imagePath // ignore: cast_nullable_to_non_nullable
as String,title: freezed == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String?,category: null == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as String,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,takenAt: null == takenAt ? _self.takenAt : takenAt // ignore: cast_nullable_to_non_nullable
as DateTime,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,isFavorite: null == isFavorite ? _self.isFavorite : isFavorite // ignore: cast_nullable_to_non_nullable
as bool,tags: null == tags ? _self.tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}

}


/// Adds pattern-matching-related methods to [ProgressPhoto].
extension ProgressPhotoPatterns on ProgressPhoto {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProgressPhoto value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProgressPhoto() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProgressPhoto value)  $default,){
final _that = this;
switch (_that) {
case _ProgressPhoto():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProgressPhoto value)?  $default,){
final _that = this;
switch (_that) {
case _ProgressPhoto() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String imagePath,  String? title,  String category,  String? notes,  DateTime takenAt,  DateTime? createdAt,  DateTime? updatedAt,  bool isFavorite,  List<String> tags)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProgressPhoto() when $default != null:
return $default(_that.id,_that.imagePath,_that.title,_that.category,_that.notes,_that.takenAt,_that.createdAt,_that.updatedAt,_that.isFavorite,_that.tags);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String imagePath,  String? title,  String category,  String? notes,  DateTime takenAt,  DateTime? createdAt,  DateTime? updatedAt,  bool isFavorite,  List<String> tags)  $default,) {final _that = this;
switch (_that) {
case _ProgressPhoto():
return $default(_that.id,_that.imagePath,_that.title,_that.category,_that.notes,_that.takenAt,_that.createdAt,_that.updatedAt,_that.isFavorite,_that.tags);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String imagePath,  String? title,  String category,  String? notes,  DateTime takenAt,  DateTime? createdAt,  DateTime? updatedAt,  bool isFavorite,  List<String> tags)?  $default,) {final _that = this;
switch (_that) {
case _ProgressPhoto() when $default != null:
return $default(_that.id,_that.imagePath,_that.title,_that.category,_that.notes,_that.takenAt,_that.createdAt,_that.updatedAt,_that.isFavorite,_that.tags);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ProgressPhoto implements ProgressPhoto {
  const _ProgressPhoto({required this.id, required this.imagePath, this.title, this.category = 'General', this.notes, required this.takenAt, this.createdAt, this.updatedAt, this.isFavorite = false, final  List<String> tags = const []}): _tags = tags;
  factory _ProgressPhoto.fromJson(Map<String, dynamic> json) => _$ProgressPhotoFromJson(json);

@override final  String id;
@override final  String imagePath;
@override final  String? title;
@override@JsonKey() final  String category;
@override final  String? notes;
@override final  DateTime takenAt;
@override final  DateTime? createdAt;
@override final  DateTime? updatedAt;
@override@JsonKey() final  bool isFavorite;
 final  List<String> _tags;
@override@JsonKey() List<String> get tags {
  if (_tags is EqualUnmodifiableListView) return _tags;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_tags);
}


/// Create a copy of ProgressPhoto
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProgressPhotoCopyWith<_ProgressPhoto> get copyWith => __$ProgressPhotoCopyWithImpl<_ProgressPhoto>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ProgressPhotoToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProgressPhoto&&(identical(other.id, id) || other.id == id)&&(identical(other.imagePath, imagePath) || other.imagePath == imagePath)&&(identical(other.title, title) || other.title == title)&&(identical(other.category, category) || other.category == category)&&(identical(other.notes, notes) || other.notes == notes)&&(identical(other.takenAt, takenAt) || other.takenAt == takenAt)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.isFavorite, isFavorite) || other.isFavorite == isFavorite)&&const DeepCollectionEquality().equals(other._tags, _tags));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,imagePath,title,category,notes,takenAt,createdAt,updatedAt,isFavorite,const DeepCollectionEquality().hash(_tags));

@override
String toString() {
  return 'ProgressPhoto(id: $id, imagePath: $imagePath, title: $title, category: $category, notes: $notes, takenAt: $takenAt, createdAt: $createdAt, updatedAt: $updatedAt, isFavorite: $isFavorite, tags: $tags)';
}


}

/// @nodoc
abstract mixin class _$ProgressPhotoCopyWith<$Res> implements $ProgressPhotoCopyWith<$Res> {
  factory _$ProgressPhotoCopyWith(_ProgressPhoto value, $Res Function(_ProgressPhoto) _then) = __$ProgressPhotoCopyWithImpl;
@override @useResult
$Res call({
 String id, String imagePath, String? title, String category, String? notes, DateTime takenAt, DateTime? createdAt, DateTime? updatedAt, bool isFavorite, List<String> tags
});




}
/// @nodoc
class __$ProgressPhotoCopyWithImpl<$Res>
    implements _$ProgressPhotoCopyWith<$Res> {
  __$ProgressPhotoCopyWithImpl(this._self, this._then);

  final _ProgressPhoto _self;
  final $Res Function(_ProgressPhoto) _then;

/// Create a copy of ProgressPhoto
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? imagePath = null,Object? title = freezed,Object? category = null,Object? notes = freezed,Object? takenAt = null,Object? createdAt = freezed,Object? updatedAt = freezed,Object? isFavorite = null,Object? tags = null,}) {
  return _then(_ProgressPhoto(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,imagePath: null == imagePath ? _self.imagePath : imagePath // ignore: cast_nullable_to_non_nullable
as String,title: freezed == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String?,category: null == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as String,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,takenAt: null == takenAt ? _self.takenAt : takenAt // ignore: cast_nullable_to_non_nullable
as DateTime,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,isFavorite: null == isFavorite ? _self.isFavorite : isFavorite // ignore: cast_nullable_to_non_nullable
as bool,tags: null == tags ? _self._tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}


}

/// @nodoc
mixin _$ProgressPhotosState {

 List<ProgressPhoto> get photos; bool get isLoading; bool get isSaving; String? get error; ProgressPhoto? get selectedPhoto;
/// Create a copy of ProgressPhotosState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProgressPhotosStateCopyWith<ProgressPhotosState> get copyWith => _$ProgressPhotosStateCopyWithImpl<ProgressPhotosState>(this as ProgressPhotosState, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProgressPhotosState&&const DeepCollectionEquality().equals(other.photos, photos)&&(identical(other.isLoading, isLoading) || other.isLoading == isLoading)&&(identical(other.isSaving, isSaving) || other.isSaving == isSaving)&&(identical(other.error, error) || other.error == error)&&(identical(other.selectedPhoto, selectedPhoto) || other.selectedPhoto == selectedPhoto));
}


@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(photos),isLoading,isSaving,error,selectedPhoto);

@override
String toString() {
  return 'ProgressPhotosState(photos: $photos, isLoading: $isLoading, isSaving: $isSaving, error: $error, selectedPhoto: $selectedPhoto)';
}


}

/// @nodoc
abstract mixin class $ProgressPhotosStateCopyWith<$Res>  {
  factory $ProgressPhotosStateCopyWith(ProgressPhotosState value, $Res Function(ProgressPhotosState) _then) = _$ProgressPhotosStateCopyWithImpl;
@useResult
$Res call({
 List<ProgressPhoto> photos, bool isLoading, bool isSaving, String? error, ProgressPhoto? selectedPhoto
});


$ProgressPhotoCopyWith<$Res>? get selectedPhoto;

}
/// @nodoc
class _$ProgressPhotosStateCopyWithImpl<$Res>
    implements $ProgressPhotosStateCopyWith<$Res> {
  _$ProgressPhotosStateCopyWithImpl(this._self, this._then);

  final ProgressPhotosState _self;
  final $Res Function(ProgressPhotosState) _then;

/// Create a copy of ProgressPhotosState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? photos = null,Object? isLoading = null,Object? isSaving = null,Object? error = freezed,Object? selectedPhoto = freezed,}) {
  return _then(_self.copyWith(
photos: null == photos ? _self.photos : photos // ignore: cast_nullable_to_non_nullable
as List<ProgressPhoto>,isLoading: null == isLoading ? _self.isLoading : isLoading // ignore: cast_nullable_to_non_nullable
as bool,isSaving: null == isSaving ? _self.isSaving : isSaving // ignore: cast_nullable_to_non_nullable
as bool,error: freezed == error ? _self.error : error // ignore: cast_nullable_to_non_nullable
as String?,selectedPhoto: freezed == selectedPhoto ? _self.selectedPhoto : selectedPhoto // ignore: cast_nullable_to_non_nullable
as ProgressPhoto?,
  ));
}
/// Create a copy of ProgressPhotosState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProgressPhotoCopyWith<$Res>? get selectedPhoto {
    if (_self.selectedPhoto == null) {
    return null;
  }

  return $ProgressPhotoCopyWith<$Res>(_self.selectedPhoto!, (value) {
    return _then(_self.copyWith(selectedPhoto: value));
  });
}
}


/// Adds pattern-matching-related methods to [ProgressPhotosState].
extension ProgressPhotosStatePatterns on ProgressPhotosState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProgressPhotosState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProgressPhotosState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProgressPhotosState value)  $default,){
final _that = this;
switch (_that) {
case _ProgressPhotosState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProgressPhotosState value)?  $default,){
final _that = this;
switch (_that) {
case _ProgressPhotosState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<ProgressPhoto> photos,  bool isLoading,  bool isSaving,  String? error,  ProgressPhoto? selectedPhoto)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProgressPhotosState() when $default != null:
return $default(_that.photos,_that.isLoading,_that.isSaving,_that.error,_that.selectedPhoto);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<ProgressPhoto> photos,  bool isLoading,  bool isSaving,  String? error,  ProgressPhoto? selectedPhoto)  $default,) {final _that = this;
switch (_that) {
case _ProgressPhotosState():
return $default(_that.photos,_that.isLoading,_that.isSaving,_that.error,_that.selectedPhoto);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<ProgressPhoto> photos,  bool isLoading,  bool isSaving,  String? error,  ProgressPhoto? selectedPhoto)?  $default,) {final _that = this;
switch (_that) {
case _ProgressPhotosState() when $default != null:
return $default(_that.photos,_that.isLoading,_that.isSaving,_that.error,_that.selectedPhoto);case _:
  return null;

}
}

}

/// @nodoc


class _ProgressPhotosState implements ProgressPhotosState {
  const _ProgressPhotosState({final  List<ProgressPhoto> photos = const [], this.isLoading = false, this.isSaving = false, this.error, this.selectedPhoto}): _photos = photos;
  

 final  List<ProgressPhoto> _photos;
@override@JsonKey() List<ProgressPhoto> get photos {
  if (_photos is EqualUnmodifiableListView) return _photos;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_photos);
}

@override@JsonKey() final  bool isLoading;
@override@JsonKey() final  bool isSaving;
@override final  String? error;
@override final  ProgressPhoto? selectedPhoto;

/// Create a copy of ProgressPhotosState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProgressPhotosStateCopyWith<_ProgressPhotosState> get copyWith => __$ProgressPhotosStateCopyWithImpl<_ProgressPhotosState>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProgressPhotosState&&const DeepCollectionEquality().equals(other._photos, _photos)&&(identical(other.isLoading, isLoading) || other.isLoading == isLoading)&&(identical(other.isSaving, isSaving) || other.isSaving == isSaving)&&(identical(other.error, error) || other.error == error)&&(identical(other.selectedPhoto, selectedPhoto) || other.selectedPhoto == selectedPhoto));
}


@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_photos),isLoading,isSaving,error,selectedPhoto);

@override
String toString() {
  return 'ProgressPhotosState(photos: $photos, isLoading: $isLoading, isSaving: $isSaving, error: $error, selectedPhoto: $selectedPhoto)';
}


}

/// @nodoc
abstract mixin class _$ProgressPhotosStateCopyWith<$Res> implements $ProgressPhotosStateCopyWith<$Res> {
  factory _$ProgressPhotosStateCopyWith(_ProgressPhotosState value, $Res Function(_ProgressPhotosState) _then) = __$ProgressPhotosStateCopyWithImpl;
@override @useResult
$Res call({
 List<ProgressPhoto> photos, bool isLoading, bool isSaving, String? error, ProgressPhoto? selectedPhoto
});


@override $ProgressPhotoCopyWith<$Res>? get selectedPhoto;

}
/// @nodoc
class __$ProgressPhotosStateCopyWithImpl<$Res>
    implements _$ProgressPhotosStateCopyWith<$Res> {
  __$ProgressPhotosStateCopyWithImpl(this._self, this._then);

  final _ProgressPhotosState _self;
  final $Res Function(_ProgressPhotosState) _then;

/// Create a copy of ProgressPhotosState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? photos = null,Object? isLoading = null,Object? isSaving = null,Object? error = freezed,Object? selectedPhoto = freezed,}) {
  return _then(_ProgressPhotosState(
photos: null == photos ? _self._photos : photos // ignore: cast_nullable_to_non_nullable
as List<ProgressPhoto>,isLoading: null == isLoading ? _self.isLoading : isLoading // ignore: cast_nullable_to_non_nullable
as bool,isSaving: null == isSaving ? _self.isSaving : isSaving // ignore: cast_nullable_to_non_nullable
as bool,error: freezed == error ? _self.error : error // ignore: cast_nullable_to_non_nullable
as String?,selectedPhoto: freezed == selectedPhoto ? _self.selectedPhoto : selectedPhoto // ignore: cast_nullable_to_non_nullable
as ProgressPhoto?,
  ));
}

/// Create a copy of ProgressPhotosState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProgressPhotoCopyWith<$Res>? get selectedPhoto {
    if (_self.selectedPhoto == null) {
    return null;
  }

  return $ProgressPhotoCopyWith<$Res>(_self.selectedPhoto!, (value) {
    return _then(_self.copyWith(selectedPhoto: value));
  });
}
}

// dart format on
