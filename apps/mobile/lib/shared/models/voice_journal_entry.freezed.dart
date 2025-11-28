// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'voice_journal_entry.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

VoiceJournalEntry _$VoiceJournalEntryFromJson(Map<String, dynamic> json) {
  return _VoiceJournalEntry.fromJson(json);
}

/// @nodoc
mixin _$VoiceJournalEntry {
  String get id => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String get audioFilePath => throw _privateConstructorUsedError;
  String? get transcriptionText => throw _privateConstructorUsedError;
  double get confidence => throw _privateConstructorUsedError;
  String get emotionalTone => throw _privateConstructorUsedError;
  List<String> get tags => throw _privateConstructorUsedError;
  String get summary => throw _privateConstructorUsedError;
  DateTime get createdAt => throw _privateConstructorUsedError;
  DateTime? get updatedAt => throw _privateConstructorUsedError;
  int get durationSeconds => throw _privateConstructorUsedError;
  int get fileSizeBytes => throw _privateConstructorUsedError;
  bool get isTranscribed => throw _privateConstructorUsedError;
  bool get isAnalyzed => throw _privateConstructorUsedError;
  bool get isFavorite => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $VoiceJournalEntryCopyWith<VoiceJournalEntry> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $VoiceJournalEntryCopyWith<$Res> {
  factory $VoiceJournalEntryCopyWith(
          VoiceJournalEntry value, $Res Function(VoiceJournalEntry) then) =
      _$VoiceJournalEntryCopyWithImpl<$Res, VoiceJournalEntry>;
  @useResult
  $Res call(
      {String id,
      String title,
      String audioFilePath,
      String? transcriptionText,
      double confidence,
      String emotionalTone,
      List<String> tags,
      String summary,
      DateTime createdAt,
      DateTime? updatedAt,
      int durationSeconds,
      int fileSizeBytes,
      bool isTranscribed,
      bool isAnalyzed,
      bool isFavorite});
}

/// @nodoc
class _$VoiceJournalEntryCopyWithImpl<$Res, $Val extends VoiceJournalEntry>
    implements $VoiceJournalEntryCopyWith<$Res> {
  _$VoiceJournalEntryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? audioFilePath = null,
    Object? transcriptionText = freezed,
    Object? confidence = null,
    Object? emotionalTone = null,
    Object? tags = null,
    Object? summary = null,
    Object? createdAt = null,
    Object? updatedAt = freezed,
    Object? durationSeconds = null,
    Object? fileSizeBytes = null,
    Object? isTranscribed = null,
    Object? isAnalyzed = null,
    Object? isFavorite = null,
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
      audioFilePath: null == audioFilePath
          ? _value.audioFilePath
          : audioFilePath // ignore: cast_nullable_to_non_nullable
              as String,
      transcriptionText: freezed == transcriptionText
          ? _value.transcriptionText
          : transcriptionText // ignore: cast_nullable_to_non_nullable
              as String?,
      confidence: null == confidence
          ? _value.confidence
          : confidence // ignore: cast_nullable_to_non_nullable
              as double,
      emotionalTone: null == emotionalTone
          ? _value.emotionalTone
          : emotionalTone // ignore: cast_nullable_to_non_nullable
              as String,
      tags: null == tags
          ? _value.tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      summary: null == summary
          ? _value.summary
          : summary // ignore: cast_nullable_to_non_nullable
              as String,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      durationSeconds: null == durationSeconds
          ? _value.durationSeconds
          : durationSeconds // ignore: cast_nullable_to_non_nullable
              as int,
      fileSizeBytes: null == fileSizeBytes
          ? _value.fileSizeBytes
          : fileSizeBytes // ignore: cast_nullable_to_non_nullable
              as int,
      isTranscribed: null == isTranscribed
          ? _value.isTranscribed
          : isTranscribed // ignore: cast_nullable_to_non_nullable
              as bool,
      isAnalyzed: null == isAnalyzed
          ? _value.isAnalyzed
          : isAnalyzed // ignore: cast_nullable_to_non_nullable
              as bool,
      isFavorite: null == isFavorite
          ? _value.isFavorite
          : isFavorite // ignore: cast_nullable_to_non_nullable
              as bool,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$VoiceJournalEntryImplCopyWith<$Res>
    implements $VoiceJournalEntryCopyWith<$Res> {
  factory _$$VoiceJournalEntryImplCopyWith(_$VoiceJournalEntryImpl value,
          $Res Function(_$VoiceJournalEntryImpl) then) =
      __$$VoiceJournalEntryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String title,
      String audioFilePath,
      String? transcriptionText,
      double confidence,
      String emotionalTone,
      List<String> tags,
      String summary,
      DateTime createdAt,
      DateTime? updatedAt,
      int durationSeconds,
      int fileSizeBytes,
      bool isTranscribed,
      bool isAnalyzed,
      bool isFavorite});
}

/// @nodoc
class __$$VoiceJournalEntryImplCopyWithImpl<$Res>
    extends _$VoiceJournalEntryCopyWithImpl<$Res, _$VoiceJournalEntryImpl>
    implements _$$VoiceJournalEntryImplCopyWith<$Res> {
  __$$VoiceJournalEntryImplCopyWithImpl(_$VoiceJournalEntryImpl _value,
      $Res Function(_$VoiceJournalEntryImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? audioFilePath = null,
    Object? transcriptionText = freezed,
    Object? confidence = null,
    Object? emotionalTone = null,
    Object? tags = null,
    Object? summary = null,
    Object? createdAt = null,
    Object? updatedAt = freezed,
    Object? durationSeconds = null,
    Object? fileSizeBytes = null,
    Object? isTranscribed = null,
    Object? isAnalyzed = null,
    Object? isFavorite = null,
  }) {
    return _then(_$VoiceJournalEntryImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      audioFilePath: null == audioFilePath
          ? _value.audioFilePath
          : audioFilePath // ignore: cast_nullable_to_non_nullable
              as String,
      transcriptionText: freezed == transcriptionText
          ? _value.transcriptionText
          : transcriptionText // ignore: cast_nullable_to_non_nullable
              as String?,
      confidence: null == confidence
          ? _value.confidence
          : confidence // ignore: cast_nullable_to_non_nullable
              as double,
      emotionalTone: null == emotionalTone
          ? _value.emotionalTone
          : emotionalTone // ignore: cast_nullable_to_non_nullable
              as String,
      tags: null == tags
          ? _value._tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      summary: null == summary
          ? _value.summary
          : summary // ignore: cast_nullable_to_non_nullable
              as String,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      durationSeconds: null == durationSeconds
          ? _value.durationSeconds
          : durationSeconds // ignore: cast_nullable_to_non_nullable
              as int,
      fileSizeBytes: null == fileSizeBytes
          ? _value.fileSizeBytes
          : fileSizeBytes // ignore: cast_nullable_to_non_nullable
              as int,
      isTranscribed: null == isTranscribed
          ? _value.isTranscribed
          : isTranscribed // ignore: cast_nullable_to_non_nullable
              as bool,
      isAnalyzed: null == isAnalyzed
          ? _value.isAnalyzed
          : isAnalyzed // ignore: cast_nullable_to_non_nullable
              as bool,
      isFavorite: null == isFavorite
          ? _value.isFavorite
          : isFavorite // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$VoiceJournalEntryImpl implements _VoiceJournalEntry {
  const _$VoiceJournalEntryImpl(
      {required this.id,
      required this.title,
      required this.audioFilePath,
      this.transcriptionText,
      this.confidence = 0.0,
      this.emotionalTone = '',
      final List<String> tags = const [],
      this.summary = '',
      required this.createdAt,
      this.updatedAt,
      this.durationSeconds = 0,
      this.fileSizeBytes = 0,
      this.isTranscribed = false,
      this.isAnalyzed = false,
      this.isFavorite = false})
      : _tags = tags;

  factory _$VoiceJournalEntryImpl.fromJson(Map<String, dynamic> json) =>
      _$$VoiceJournalEntryImplFromJson(json);

  @override
  final String id;
  @override
  final String title;
  @override
  final String audioFilePath;
  @override
  final String? transcriptionText;
  @override
  @JsonKey()
  final double confidence;
  @override
  @JsonKey()
  final String emotionalTone;
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
  final String summary;
  @override
  final DateTime createdAt;
  @override
  final DateTime? updatedAt;
  @override
  @JsonKey()
  final int durationSeconds;
  @override
  @JsonKey()
  final int fileSizeBytes;
  @override
  @JsonKey()
  final bool isTranscribed;
  @override
  @JsonKey()
  final bool isAnalyzed;
  @override
  @JsonKey()
  final bool isFavorite;

  @override
  String toString() {
    return 'VoiceJournalEntry(id: $id, title: $title, audioFilePath: $audioFilePath, transcriptionText: $transcriptionText, confidence: $confidence, emotionalTone: $emotionalTone, tags: $tags, summary: $summary, createdAt: $createdAt, updatedAt: $updatedAt, durationSeconds: $durationSeconds, fileSizeBytes: $fileSizeBytes, isTranscribed: $isTranscribed, isAnalyzed: $isAnalyzed, isFavorite: $isFavorite)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$VoiceJournalEntryImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.audioFilePath, audioFilePath) ||
                other.audioFilePath == audioFilePath) &&
            (identical(other.transcriptionText, transcriptionText) ||
                other.transcriptionText == transcriptionText) &&
            (identical(other.confidence, confidence) ||
                other.confidence == confidence) &&
            (identical(other.emotionalTone, emotionalTone) ||
                other.emotionalTone == emotionalTone) &&
            const DeepCollectionEquality().equals(other._tags, _tags) &&
            (identical(other.summary, summary) || other.summary == summary) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            (identical(other.durationSeconds, durationSeconds) ||
                other.durationSeconds == durationSeconds) &&
            (identical(other.fileSizeBytes, fileSizeBytes) ||
                other.fileSizeBytes == fileSizeBytes) &&
            (identical(other.isTranscribed, isTranscribed) ||
                other.isTranscribed == isTranscribed) &&
            (identical(other.isAnalyzed, isAnalyzed) ||
                other.isAnalyzed == isAnalyzed) &&
            (identical(other.isFavorite, isFavorite) ||
                other.isFavorite == isFavorite));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      title,
      audioFilePath,
      transcriptionText,
      confidence,
      emotionalTone,
      const DeepCollectionEquality().hash(_tags),
      summary,
      createdAt,
      updatedAt,
      durationSeconds,
      fileSizeBytes,
      isTranscribed,
      isAnalyzed,
      isFavorite);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$VoiceJournalEntryImplCopyWith<_$VoiceJournalEntryImpl> get copyWith =>
      __$$VoiceJournalEntryImplCopyWithImpl<_$VoiceJournalEntryImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$VoiceJournalEntryImplToJson(
      this,
    );
  }
}

abstract class _VoiceJournalEntry implements VoiceJournalEntry {
  const factory _VoiceJournalEntry(
      {required final String id,
      required final String title,
      required final String audioFilePath,
      final String? transcriptionText,
      final double confidence,
      final String emotionalTone,
      final List<String> tags,
      final String summary,
      required final DateTime createdAt,
      final DateTime? updatedAt,
      final int durationSeconds,
      final int fileSizeBytes,
      final bool isTranscribed,
      final bool isAnalyzed,
      final bool isFavorite}) = _$VoiceJournalEntryImpl;

  factory _VoiceJournalEntry.fromJson(Map<String, dynamic> json) =
      _$VoiceJournalEntryImpl.fromJson;

  @override
  String get id;
  @override
  String get title;
  @override
  String get audioFilePath;
  @override
  String? get transcriptionText;
  @override
  double get confidence;
  @override
  String get emotionalTone;
  @override
  List<String> get tags;
  @override
  String get summary;
  @override
  DateTime get createdAt;
  @override
  DateTime? get updatedAt;
  @override
  int get durationSeconds;
  @override
  int get fileSizeBytes;
  @override
  bool get isTranscribed;
  @override
  bool get isAnalyzed;
  @override
  bool get isFavorite;
  @override
  @JsonKey(ignore: true)
  _$$VoiceJournalEntryImplCopyWith<_$VoiceJournalEntryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
mixin _$VoiceJournalState {
  List<VoiceJournalEntry> get entries => throw _privateConstructorUsedError;
  bool get isLoading => throw _privateConstructorUsedError;
  bool get isRecording => throw _privateConstructorUsedError;
  bool get isTranscribing => throw _privateConstructorUsedError;
  String? get error => throw _privateConstructorUsedError;
  VoiceJournalEntry? get currentEntry => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $VoiceJournalStateCopyWith<VoiceJournalState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $VoiceJournalStateCopyWith<$Res> {
  factory $VoiceJournalStateCopyWith(
          VoiceJournalState value, $Res Function(VoiceJournalState) then) =
      _$VoiceJournalStateCopyWithImpl<$Res, VoiceJournalState>;
  @useResult
  $Res call(
      {List<VoiceJournalEntry> entries,
      bool isLoading,
      bool isRecording,
      bool isTranscribing,
      String? error,
      VoiceJournalEntry? currentEntry});

  $VoiceJournalEntryCopyWith<$Res>? get currentEntry;
}

/// @nodoc
class _$VoiceJournalStateCopyWithImpl<$Res, $Val extends VoiceJournalState>
    implements $VoiceJournalStateCopyWith<$Res> {
  _$VoiceJournalStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? entries = null,
    Object? isLoading = null,
    Object? isRecording = null,
    Object? isTranscribing = null,
    Object? error = freezed,
    Object? currentEntry = freezed,
  }) {
    return _then(_value.copyWith(
      entries: null == entries
          ? _value.entries
          : entries // ignore: cast_nullable_to_non_nullable
              as List<VoiceJournalEntry>,
      isLoading: null == isLoading
          ? _value.isLoading
          : isLoading // ignore: cast_nullable_to_non_nullable
              as bool,
      isRecording: null == isRecording
          ? _value.isRecording
          : isRecording // ignore: cast_nullable_to_non_nullable
              as bool,
      isTranscribing: null == isTranscribing
          ? _value.isTranscribing
          : isTranscribing // ignore: cast_nullable_to_non_nullable
              as bool,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
      currentEntry: freezed == currentEntry
          ? _value.currentEntry
          : currentEntry // ignore: cast_nullable_to_non_nullable
              as VoiceJournalEntry?,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $VoiceJournalEntryCopyWith<$Res>? get currentEntry {
    if (_value.currentEntry == null) {
      return null;
    }

    return $VoiceJournalEntryCopyWith<$Res>(_value.currentEntry!, (value) {
      return _then(_value.copyWith(currentEntry: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$VoiceJournalStateImplCopyWith<$Res>
    implements $VoiceJournalStateCopyWith<$Res> {
  factory _$$VoiceJournalStateImplCopyWith(_$VoiceJournalStateImpl value,
          $Res Function(_$VoiceJournalStateImpl) then) =
      __$$VoiceJournalStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {List<VoiceJournalEntry> entries,
      bool isLoading,
      bool isRecording,
      bool isTranscribing,
      String? error,
      VoiceJournalEntry? currentEntry});

  @override
  $VoiceJournalEntryCopyWith<$Res>? get currentEntry;
}

/// @nodoc
class __$$VoiceJournalStateImplCopyWithImpl<$Res>
    extends _$VoiceJournalStateCopyWithImpl<$Res, _$VoiceJournalStateImpl>
    implements _$$VoiceJournalStateImplCopyWith<$Res> {
  __$$VoiceJournalStateImplCopyWithImpl(_$VoiceJournalStateImpl _value,
      $Res Function(_$VoiceJournalStateImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? entries = null,
    Object? isLoading = null,
    Object? isRecording = null,
    Object? isTranscribing = null,
    Object? error = freezed,
    Object? currentEntry = freezed,
  }) {
    return _then(_$VoiceJournalStateImpl(
      entries: null == entries
          ? _value._entries
          : entries // ignore: cast_nullable_to_non_nullable
              as List<VoiceJournalEntry>,
      isLoading: null == isLoading
          ? _value.isLoading
          : isLoading // ignore: cast_nullable_to_non_nullable
              as bool,
      isRecording: null == isRecording
          ? _value.isRecording
          : isRecording // ignore: cast_nullable_to_non_nullable
              as bool,
      isTranscribing: null == isTranscribing
          ? _value.isTranscribing
          : isTranscribing // ignore: cast_nullable_to_non_nullable
              as bool,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
      currentEntry: freezed == currentEntry
          ? _value.currentEntry
          : currentEntry // ignore: cast_nullable_to_non_nullable
              as VoiceJournalEntry?,
    ));
  }
}

/// @nodoc

class _$VoiceJournalStateImpl implements _VoiceJournalState {
  const _$VoiceJournalStateImpl(
      {final List<VoiceJournalEntry> entries = const [],
      this.isLoading = false,
      this.isRecording = false,
      this.isTranscribing = false,
      this.error,
      this.currentEntry})
      : _entries = entries;

  final List<VoiceJournalEntry> _entries;
  @override
  @JsonKey()
  List<VoiceJournalEntry> get entries {
    if (_entries is EqualUnmodifiableListView) return _entries;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_entries);
  }

  @override
  @JsonKey()
  final bool isLoading;
  @override
  @JsonKey()
  final bool isRecording;
  @override
  @JsonKey()
  final bool isTranscribing;
  @override
  final String? error;
  @override
  final VoiceJournalEntry? currentEntry;

  @override
  String toString() {
    return 'VoiceJournalState(entries: $entries, isLoading: $isLoading, isRecording: $isRecording, isTranscribing: $isTranscribing, error: $error, currentEntry: $currentEntry)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$VoiceJournalStateImpl &&
            const DeepCollectionEquality().equals(other._entries, _entries) &&
            (identical(other.isLoading, isLoading) ||
                other.isLoading == isLoading) &&
            (identical(other.isRecording, isRecording) ||
                other.isRecording == isRecording) &&
            (identical(other.isTranscribing, isTranscribing) ||
                other.isTranscribing == isTranscribing) &&
            (identical(other.error, error) || other.error == error) &&
            (identical(other.currentEntry, currentEntry) ||
                other.currentEntry == currentEntry));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      const DeepCollectionEquality().hash(_entries),
      isLoading,
      isRecording,
      isTranscribing,
      error,
      currentEntry);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$VoiceJournalStateImplCopyWith<_$VoiceJournalStateImpl> get copyWith =>
      __$$VoiceJournalStateImplCopyWithImpl<_$VoiceJournalStateImpl>(
          this, _$identity);
}

abstract class _VoiceJournalState implements VoiceJournalState {
  const factory _VoiceJournalState(
      {final List<VoiceJournalEntry> entries,
      final bool isLoading,
      final bool isRecording,
      final bool isTranscribing,
      final String? error,
      final VoiceJournalEntry? currentEntry}) = _$VoiceJournalStateImpl;

  @override
  List<VoiceJournalEntry> get entries;
  @override
  bool get isLoading;
  @override
  bool get isRecording;
  @override
  bool get isTranscribing;
  @override
  String? get error;
  @override
  VoiceJournalEntry? get currentEntry;
  @override
  @JsonKey(ignore: true)
  _$$VoiceJournalStateImplCopyWith<_$VoiceJournalStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
