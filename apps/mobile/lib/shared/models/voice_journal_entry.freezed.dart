// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'voice_journal_entry.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$VoiceJournalEntry {

 String get id; String get title; String get audioFilePath; String? get transcriptionText; double get confidence; String get emotionalTone; List<String> get tags; String get summary; DateTime get createdAt; DateTime? get updatedAt; int get durationSeconds; int get fileSizeBytes; bool get isTranscribed; bool get isAnalyzed; bool get isFavorite;
/// Create a copy of VoiceJournalEntry
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$VoiceJournalEntryCopyWith<VoiceJournalEntry> get copyWith => _$VoiceJournalEntryCopyWithImpl<VoiceJournalEntry>(this as VoiceJournalEntry, _$identity);

  /// Serializes this VoiceJournalEntry to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is VoiceJournalEntry&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.audioFilePath, audioFilePath) || other.audioFilePath == audioFilePath)&&(identical(other.transcriptionText, transcriptionText) || other.transcriptionText == transcriptionText)&&(identical(other.confidence, confidence) || other.confidence == confidence)&&(identical(other.emotionalTone, emotionalTone) || other.emotionalTone == emotionalTone)&&const DeepCollectionEquality().equals(other.tags, tags)&&(identical(other.summary, summary) || other.summary == summary)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.durationSeconds, durationSeconds) || other.durationSeconds == durationSeconds)&&(identical(other.fileSizeBytes, fileSizeBytes) || other.fileSizeBytes == fileSizeBytes)&&(identical(other.isTranscribed, isTranscribed) || other.isTranscribed == isTranscribed)&&(identical(other.isAnalyzed, isAnalyzed) || other.isAnalyzed == isAnalyzed)&&(identical(other.isFavorite, isFavorite) || other.isFavorite == isFavorite));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,audioFilePath,transcriptionText,confidence,emotionalTone,const DeepCollectionEquality().hash(tags),summary,createdAt,updatedAt,durationSeconds,fileSizeBytes,isTranscribed,isAnalyzed,isFavorite);

@override
String toString() {
  return 'VoiceJournalEntry(id: $id, title: $title, audioFilePath: $audioFilePath, transcriptionText: $transcriptionText, confidence: $confidence, emotionalTone: $emotionalTone, tags: $tags, summary: $summary, createdAt: $createdAt, updatedAt: $updatedAt, durationSeconds: $durationSeconds, fileSizeBytes: $fileSizeBytes, isTranscribed: $isTranscribed, isAnalyzed: $isAnalyzed, isFavorite: $isFavorite)';
}


}

/// @nodoc
abstract mixin class $VoiceJournalEntryCopyWith<$Res>  {
  factory $VoiceJournalEntryCopyWith(VoiceJournalEntry value, $Res Function(VoiceJournalEntry) _then) = _$VoiceJournalEntryCopyWithImpl;
@useResult
$Res call({
 String id, String title, String audioFilePath, String? transcriptionText, double confidence, String emotionalTone, List<String> tags, String summary, DateTime createdAt, DateTime? updatedAt, int durationSeconds, int fileSizeBytes, bool isTranscribed, bool isAnalyzed, bool isFavorite
});




}
/// @nodoc
class _$VoiceJournalEntryCopyWithImpl<$Res>
    implements $VoiceJournalEntryCopyWith<$Res> {
  _$VoiceJournalEntryCopyWithImpl(this._self, this._then);

  final VoiceJournalEntry _self;
  final $Res Function(VoiceJournalEntry) _then;

/// Create a copy of VoiceJournalEntry
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? title = null,Object? audioFilePath = null,Object? transcriptionText = freezed,Object? confidence = null,Object? emotionalTone = null,Object? tags = null,Object? summary = null,Object? createdAt = null,Object? updatedAt = freezed,Object? durationSeconds = null,Object? fileSizeBytes = null,Object? isTranscribed = null,Object? isAnalyzed = null,Object? isFavorite = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,audioFilePath: null == audioFilePath ? _self.audioFilePath : audioFilePath // ignore: cast_nullable_to_non_nullable
as String,transcriptionText: freezed == transcriptionText ? _self.transcriptionText : transcriptionText // ignore: cast_nullable_to_non_nullable
as String?,confidence: null == confidence ? _self.confidence : confidence // ignore: cast_nullable_to_non_nullable
as double,emotionalTone: null == emotionalTone ? _self.emotionalTone : emotionalTone // ignore: cast_nullable_to_non_nullable
as String,tags: null == tags ? _self.tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,summary: null == summary ? _self.summary : summary // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,durationSeconds: null == durationSeconds ? _self.durationSeconds : durationSeconds // ignore: cast_nullable_to_non_nullable
as int,fileSizeBytes: null == fileSizeBytes ? _self.fileSizeBytes : fileSizeBytes // ignore: cast_nullable_to_non_nullable
as int,isTranscribed: null == isTranscribed ? _self.isTranscribed : isTranscribed // ignore: cast_nullable_to_non_nullable
as bool,isAnalyzed: null == isAnalyzed ? _self.isAnalyzed : isAnalyzed // ignore: cast_nullable_to_non_nullable
as bool,isFavorite: null == isFavorite ? _self.isFavorite : isFavorite // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [VoiceJournalEntry].
extension VoiceJournalEntryPatterns on VoiceJournalEntry {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _VoiceJournalEntry value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _VoiceJournalEntry() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _VoiceJournalEntry value)  $default,){
final _that = this;
switch (_that) {
case _VoiceJournalEntry():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _VoiceJournalEntry value)?  $default,){
final _that = this;
switch (_that) {
case _VoiceJournalEntry() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String title,  String audioFilePath,  String? transcriptionText,  double confidence,  String emotionalTone,  List<String> tags,  String summary,  DateTime createdAt,  DateTime? updatedAt,  int durationSeconds,  int fileSizeBytes,  bool isTranscribed,  bool isAnalyzed,  bool isFavorite)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _VoiceJournalEntry() when $default != null:
return $default(_that.id,_that.title,_that.audioFilePath,_that.transcriptionText,_that.confidence,_that.emotionalTone,_that.tags,_that.summary,_that.createdAt,_that.updatedAt,_that.durationSeconds,_that.fileSizeBytes,_that.isTranscribed,_that.isAnalyzed,_that.isFavorite);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String title,  String audioFilePath,  String? transcriptionText,  double confidence,  String emotionalTone,  List<String> tags,  String summary,  DateTime createdAt,  DateTime? updatedAt,  int durationSeconds,  int fileSizeBytes,  bool isTranscribed,  bool isAnalyzed,  bool isFavorite)  $default,) {final _that = this;
switch (_that) {
case _VoiceJournalEntry():
return $default(_that.id,_that.title,_that.audioFilePath,_that.transcriptionText,_that.confidence,_that.emotionalTone,_that.tags,_that.summary,_that.createdAt,_that.updatedAt,_that.durationSeconds,_that.fileSizeBytes,_that.isTranscribed,_that.isAnalyzed,_that.isFavorite);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String title,  String audioFilePath,  String? transcriptionText,  double confidence,  String emotionalTone,  List<String> tags,  String summary,  DateTime createdAt,  DateTime? updatedAt,  int durationSeconds,  int fileSizeBytes,  bool isTranscribed,  bool isAnalyzed,  bool isFavorite)?  $default,) {final _that = this;
switch (_that) {
case _VoiceJournalEntry() when $default != null:
return $default(_that.id,_that.title,_that.audioFilePath,_that.transcriptionText,_that.confidence,_that.emotionalTone,_that.tags,_that.summary,_that.createdAt,_that.updatedAt,_that.durationSeconds,_that.fileSizeBytes,_that.isTranscribed,_that.isAnalyzed,_that.isFavorite);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _VoiceJournalEntry implements VoiceJournalEntry {
  const _VoiceJournalEntry({required this.id, required this.title, required this.audioFilePath, this.transcriptionText, this.confidence = 0.0, this.emotionalTone = '', final  List<String> tags = const [], this.summary = '', required this.createdAt, this.updatedAt, this.durationSeconds = 0, this.fileSizeBytes = 0, this.isTranscribed = false, this.isAnalyzed = false, this.isFavorite = false}): _tags = tags;
  factory _VoiceJournalEntry.fromJson(Map<String, dynamic> json) => _$VoiceJournalEntryFromJson(json);

@override final  String id;
@override final  String title;
@override final  String audioFilePath;
@override final  String? transcriptionText;
@override@JsonKey() final  double confidence;
@override@JsonKey() final  String emotionalTone;
 final  List<String> _tags;
@override@JsonKey() List<String> get tags {
  if (_tags is EqualUnmodifiableListView) return _tags;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_tags);
}

@override@JsonKey() final  String summary;
@override final  DateTime createdAt;
@override final  DateTime? updatedAt;
@override@JsonKey() final  int durationSeconds;
@override@JsonKey() final  int fileSizeBytes;
@override@JsonKey() final  bool isTranscribed;
@override@JsonKey() final  bool isAnalyzed;
@override@JsonKey() final  bool isFavorite;

/// Create a copy of VoiceJournalEntry
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$VoiceJournalEntryCopyWith<_VoiceJournalEntry> get copyWith => __$VoiceJournalEntryCopyWithImpl<_VoiceJournalEntry>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$VoiceJournalEntryToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _VoiceJournalEntry&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.audioFilePath, audioFilePath) || other.audioFilePath == audioFilePath)&&(identical(other.transcriptionText, transcriptionText) || other.transcriptionText == transcriptionText)&&(identical(other.confidence, confidence) || other.confidence == confidence)&&(identical(other.emotionalTone, emotionalTone) || other.emotionalTone == emotionalTone)&&const DeepCollectionEquality().equals(other._tags, _tags)&&(identical(other.summary, summary) || other.summary == summary)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.durationSeconds, durationSeconds) || other.durationSeconds == durationSeconds)&&(identical(other.fileSizeBytes, fileSizeBytes) || other.fileSizeBytes == fileSizeBytes)&&(identical(other.isTranscribed, isTranscribed) || other.isTranscribed == isTranscribed)&&(identical(other.isAnalyzed, isAnalyzed) || other.isAnalyzed == isAnalyzed)&&(identical(other.isFavorite, isFavorite) || other.isFavorite == isFavorite));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,audioFilePath,transcriptionText,confidence,emotionalTone,const DeepCollectionEquality().hash(_tags),summary,createdAt,updatedAt,durationSeconds,fileSizeBytes,isTranscribed,isAnalyzed,isFavorite);

@override
String toString() {
  return 'VoiceJournalEntry(id: $id, title: $title, audioFilePath: $audioFilePath, transcriptionText: $transcriptionText, confidence: $confidence, emotionalTone: $emotionalTone, tags: $tags, summary: $summary, createdAt: $createdAt, updatedAt: $updatedAt, durationSeconds: $durationSeconds, fileSizeBytes: $fileSizeBytes, isTranscribed: $isTranscribed, isAnalyzed: $isAnalyzed, isFavorite: $isFavorite)';
}


}

/// @nodoc
abstract mixin class _$VoiceJournalEntryCopyWith<$Res> implements $VoiceJournalEntryCopyWith<$Res> {
  factory _$VoiceJournalEntryCopyWith(_VoiceJournalEntry value, $Res Function(_VoiceJournalEntry) _then) = __$VoiceJournalEntryCopyWithImpl;
@override @useResult
$Res call({
 String id, String title, String audioFilePath, String? transcriptionText, double confidence, String emotionalTone, List<String> tags, String summary, DateTime createdAt, DateTime? updatedAt, int durationSeconds, int fileSizeBytes, bool isTranscribed, bool isAnalyzed, bool isFavorite
});




}
/// @nodoc
class __$VoiceJournalEntryCopyWithImpl<$Res>
    implements _$VoiceJournalEntryCopyWith<$Res> {
  __$VoiceJournalEntryCopyWithImpl(this._self, this._then);

  final _VoiceJournalEntry _self;
  final $Res Function(_VoiceJournalEntry) _then;

/// Create a copy of VoiceJournalEntry
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? title = null,Object? audioFilePath = null,Object? transcriptionText = freezed,Object? confidence = null,Object? emotionalTone = null,Object? tags = null,Object? summary = null,Object? createdAt = null,Object? updatedAt = freezed,Object? durationSeconds = null,Object? fileSizeBytes = null,Object? isTranscribed = null,Object? isAnalyzed = null,Object? isFavorite = null,}) {
  return _then(_VoiceJournalEntry(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,audioFilePath: null == audioFilePath ? _self.audioFilePath : audioFilePath // ignore: cast_nullable_to_non_nullable
as String,transcriptionText: freezed == transcriptionText ? _self.transcriptionText : transcriptionText // ignore: cast_nullable_to_non_nullable
as String?,confidence: null == confidence ? _self.confidence : confidence // ignore: cast_nullable_to_non_nullable
as double,emotionalTone: null == emotionalTone ? _self.emotionalTone : emotionalTone // ignore: cast_nullable_to_non_nullable
as String,tags: null == tags ? _self._tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,summary: null == summary ? _self.summary : summary // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,durationSeconds: null == durationSeconds ? _self.durationSeconds : durationSeconds // ignore: cast_nullable_to_non_nullable
as int,fileSizeBytes: null == fileSizeBytes ? _self.fileSizeBytes : fileSizeBytes // ignore: cast_nullable_to_non_nullable
as int,isTranscribed: null == isTranscribed ? _self.isTranscribed : isTranscribed // ignore: cast_nullable_to_non_nullable
as bool,isAnalyzed: null == isAnalyzed ? _self.isAnalyzed : isAnalyzed // ignore: cast_nullable_to_non_nullable
as bool,isFavorite: null == isFavorite ? _self.isFavorite : isFavorite // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

/// @nodoc
mixin _$VoiceJournalState {

 List<VoiceJournalEntry> get entries; bool get isLoading; bool get isRecording; bool get isTranscribing; String? get error; VoiceJournalEntry? get currentEntry;
/// Create a copy of VoiceJournalState
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$VoiceJournalStateCopyWith<VoiceJournalState> get copyWith => _$VoiceJournalStateCopyWithImpl<VoiceJournalState>(this as VoiceJournalState, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is VoiceJournalState&&const DeepCollectionEquality().equals(other.entries, entries)&&(identical(other.isLoading, isLoading) || other.isLoading == isLoading)&&(identical(other.isRecording, isRecording) || other.isRecording == isRecording)&&(identical(other.isTranscribing, isTranscribing) || other.isTranscribing == isTranscribing)&&(identical(other.error, error) || other.error == error)&&(identical(other.currentEntry, currentEntry) || other.currentEntry == currentEntry));
}


@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(entries),isLoading,isRecording,isTranscribing,error,currentEntry);

@override
String toString() {
  return 'VoiceJournalState(entries: $entries, isLoading: $isLoading, isRecording: $isRecording, isTranscribing: $isTranscribing, error: $error, currentEntry: $currentEntry)';
}


}

/// @nodoc
abstract mixin class $VoiceJournalStateCopyWith<$Res>  {
  factory $VoiceJournalStateCopyWith(VoiceJournalState value, $Res Function(VoiceJournalState) _then) = _$VoiceJournalStateCopyWithImpl;
@useResult
$Res call({
 List<VoiceJournalEntry> entries, bool isLoading, bool isRecording, bool isTranscribing, String? error, VoiceJournalEntry? currentEntry
});


$VoiceJournalEntryCopyWith<$Res>? get currentEntry;

}
/// @nodoc
class _$VoiceJournalStateCopyWithImpl<$Res>
    implements $VoiceJournalStateCopyWith<$Res> {
  _$VoiceJournalStateCopyWithImpl(this._self, this._then);

  final VoiceJournalState _self;
  final $Res Function(VoiceJournalState) _then;

/// Create a copy of VoiceJournalState
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? entries = null,Object? isLoading = null,Object? isRecording = null,Object? isTranscribing = null,Object? error = freezed,Object? currentEntry = freezed,}) {
  return _then(_self.copyWith(
entries: null == entries ? _self.entries : entries // ignore: cast_nullable_to_non_nullable
as List<VoiceJournalEntry>,isLoading: null == isLoading ? _self.isLoading : isLoading // ignore: cast_nullable_to_non_nullable
as bool,isRecording: null == isRecording ? _self.isRecording : isRecording // ignore: cast_nullable_to_non_nullable
as bool,isTranscribing: null == isTranscribing ? _self.isTranscribing : isTranscribing // ignore: cast_nullable_to_non_nullable
as bool,error: freezed == error ? _self.error : error // ignore: cast_nullable_to_non_nullable
as String?,currentEntry: freezed == currentEntry ? _self.currentEntry : currentEntry // ignore: cast_nullable_to_non_nullable
as VoiceJournalEntry?,
  ));
}
/// Create a copy of VoiceJournalState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$VoiceJournalEntryCopyWith<$Res>? get currentEntry {
    if (_self.currentEntry == null) {
    return null;
  }

  return $VoiceJournalEntryCopyWith<$Res>(_self.currentEntry!, (value) {
    return _then(_self.copyWith(currentEntry: value));
  });
}
}


/// Adds pattern-matching-related methods to [VoiceJournalState].
extension VoiceJournalStatePatterns on VoiceJournalState {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _VoiceJournalState value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _VoiceJournalState() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _VoiceJournalState value)  $default,){
final _that = this;
switch (_that) {
case _VoiceJournalState():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _VoiceJournalState value)?  $default,){
final _that = this;
switch (_that) {
case _VoiceJournalState() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<VoiceJournalEntry> entries,  bool isLoading,  bool isRecording,  bool isTranscribing,  String? error,  VoiceJournalEntry? currentEntry)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _VoiceJournalState() when $default != null:
return $default(_that.entries,_that.isLoading,_that.isRecording,_that.isTranscribing,_that.error,_that.currentEntry);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<VoiceJournalEntry> entries,  bool isLoading,  bool isRecording,  bool isTranscribing,  String? error,  VoiceJournalEntry? currentEntry)  $default,) {final _that = this;
switch (_that) {
case _VoiceJournalState():
return $default(_that.entries,_that.isLoading,_that.isRecording,_that.isTranscribing,_that.error,_that.currentEntry);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<VoiceJournalEntry> entries,  bool isLoading,  bool isRecording,  bool isTranscribing,  String? error,  VoiceJournalEntry? currentEntry)?  $default,) {final _that = this;
switch (_that) {
case _VoiceJournalState() when $default != null:
return $default(_that.entries,_that.isLoading,_that.isRecording,_that.isTranscribing,_that.error,_that.currentEntry);case _:
  return null;

}
}

}

/// @nodoc


class _VoiceJournalState implements VoiceJournalState {
  const _VoiceJournalState({final  List<VoiceJournalEntry> entries = const [], this.isLoading = false, this.isRecording = false, this.isTranscribing = false, this.error, this.currentEntry}): _entries = entries;
  

 final  List<VoiceJournalEntry> _entries;
@override@JsonKey() List<VoiceJournalEntry> get entries {
  if (_entries is EqualUnmodifiableListView) return _entries;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_entries);
}

@override@JsonKey() final  bool isLoading;
@override@JsonKey() final  bool isRecording;
@override@JsonKey() final  bool isTranscribing;
@override final  String? error;
@override final  VoiceJournalEntry? currentEntry;

/// Create a copy of VoiceJournalState
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$VoiceJournalStateCopyWith<_VoiceJournalState> get copyWith => __$VoiceJournalStateCopyWithImpl<_VoiceJournalState>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _VoiceJournalState&&const DeepCollectionEquality().equals(other._entries, _entries)&&(identical(other.isLoading, isLoading) || other.isLoading == isLoading)&&(identical(other.isRecording, isRecording) || other.isRecording == isRecording)&&(identical(other.isTranscribing, isTranscribing) || other.isTranscribing == isTranscribing)&&(identical(other.error, error) || other.error == error)&&(identical(other.currentEntry, currentEntry) || other.currentEntry == currentEntry));
}


@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_entries),isLoading,isRecording,isTranscribing,error,currentEntry);

@override
String toString() {
  return 'VoiceJournalState(entries: $entries, isLoading: $isLoading, isRecording: $isRecording, isTranscribing: $isTranscribing, error: $error, currentEntry: $currentEntry)';
}


}

/// @nodoc
abstract mixin class _$VoiceJournalStateCopyWith<$Res> implements $VoiceJournalStateCopyWith<$Res> {
  factory _$VoiceJournalStateCopyWith(_VoiceJournalState value, $Res Function(_VoiceJournalState) _then) = __$VoiceJournalStateCopyWithImpl;
@override @useResult
$Res call({
 List<VoiceJournalEntry> entries, bool isLoading, bool isRecording, bool isTranscribing, String? error, VoiceJournalEntry? currentEntry
});


@override $VoiceJournalEntryCopyWith<$Res>? get currentEntry;

}
/// @nodoc
class __$VoiceJournalStateCopyWithImpl<$Res>
    implements _$VoiceJournalStateCopyWith<$Res> {
  __$VoiceJournalStateCopyWithImpl(this._self, this._then);

  final _VoiceJournalState _self;
  final $Res Function(_VoiceJournalState) _then;

/// Create a copy of VoiceJournalState
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? entries = null,Object? isLoading = null,Object? isRecording = null,Object? isTranscribing = null,Object? error = freezed,Object? currentEntry = freezed,}) {
  return _then(_VoiceJournalState(
entries: null == entries ? _self._entries : entries // ignore: cast_nullable_to_non_nullable
as List<VoiceJournalEntry>,isLoading: null == isLoading ? _self.isLoading : isLoading // ignore: cast_nullable_to_non_nullable
as bool,isRecording: null == isRecording ? _self.isRecording : isRecording // ignore: cast_nullable_to_non_nullable
as bool,isTranscribing: null == isTranscribing ? _self.isTranscribing : isTranscribing // ignore: cast_nullable_to_non_nullable
as bool,error: freezed == error ? _self.error : error // ignore: cast_nullable_to_non_nullable
as String?,currentEntry: freezed == currentEntry ? _self.currentEntry : currentEntry // ignore: cast_nullable_to_non_nullable
as VoiceJournalEntry?,
  ));
}

/// Create a copy of VoiceJournalState
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$VoiceJournalEntryCopyWith<$Res>? get currentEntry {
    if (_self.currentEntry == null) {
    return null;
  }

  return $VoiceJournalEntryCopyWith<$Res>(_self.currentEntry!, (value) {
    return _then(_self.copyWith(currentEntry: value));
  });
}
}

// dart format on
