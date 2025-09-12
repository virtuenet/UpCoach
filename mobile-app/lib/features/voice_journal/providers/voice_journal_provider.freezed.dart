// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'voice_journal_provider.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$VoiceJournalState {
  List<VoiceJournalEntry> get entries => throw _privateConstructorUsedError;
  bool get isLoading => throw _privateConstructorUsedError;
  bool get isRecording => throw _privateConstructorUsedError;
  bool get isTranscribing => throw _privateConstructorUsedError;
  bool get isAnalyzing => throw _privateConstructorUsedError;
  bool get isProcessing => throw _privateConstructorUsedError;
  VoiceJournalEntry? get currentEntry => throw _privateConstructorUsedError;
  String? get error => throw _privateConstructorUsedError;
  String? get searchQuery => throw _privateConstructorUsedError;
  List<String> get availableTags => throw _privateConstructorUsedError;
  Map<String, dynamic> get analytics => throw _privateConstructorUsedError;
  Map<String, int> get categoryStats => throw _privateConstructorUsedError;
  Duration get totalRecordingTime => throw _privateConstructorUsedError;
  double get recordingProgress => throw _privateConstructorUsedError;
  bool get isCloudSyncEnabled => throw _privateConstructorUsedError;
  bool get isSyncing => throw _privateConstructorUsedError;
  DateTime? get lastSyncTime => throw _privateConstructorUsedError;

  /// Create a copy of VoiceJournalState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
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
      bool isAnalyzing,
      bool isProcessing,
      VoiceJournalEntry? currentEntry,
      String? error,
      String? searchQuery,
      List<String> availableTags,
      Map<String, dynamic> analytics,
      Map<String, int> categoryStats,
      Duration totalRecordingTime,
      double recordingProgress,
      bool isCloudSyncEnabled,
      bool isSyncing,
      DateTime? lastSyncTime});

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

  /// Create a copy of VoiceJournalState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? entries = null,
    Object? isLoading = null,
    Object? isRecording = null,
    Object? isTranscribing = null,
    Object? isAnalyzing = null,
    Object? isProcessing = null,
    Object? currentEntry = freezed,
    Object? error = freezed,
    Object? searchQuery = freezed,
    Object? availableTags = null,
    Object? analytics = null,
    Object? categoryStats = null,
    Object? totalRecordingTime = null,
    Object? recordingProgress = null,
    Object? isCloudSyncEnabled = null,
    Object? isSyncing = null,
    Object? lastSyncTime = freezed,
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
      isAnalyzing: null == isAnalyzing
          ? _value.isAnalyzing
          : isAnalyzing // ignore: cast_nullable_to_non_nullable
              as bool,
      isProcessing: null == isProcessing
          ? _value.isProcessing
          : isProcessing // ignore: cast_nullable_to_non_nullable
              as bool,
      currentEntry: freezed == currentEntry
          ? _value.currentEntry
          : currentEntry // ignore: cast_nullable_to_non_nullable
              as VoiceJournalEntry?,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
      searchQuery: freezed == searchQuery
          ? _value.searchQuery
          : searchQuery // ignore: cast_nullable_to_non_nullable
              as String?,
      availableTags: null == availableTags
          ? _value.availableTags
          : availableTags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      analytics: null == analytics
          ? _value.analytics
          : analytics // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      categoryStats: null == categoryStats
          ? _value.categoryStats
          : categoryStats // ignore: cast_nullable_to_non_nullable
              as Map<String, int>,
      totalRecordingTime: null == totalRecordingTime
          ? _value.totalRecordingTime
          : totalRecordingTime // ignore: cast_nullable_to_non_nullable
              as Duration,
      recordingProgress: null == recordingProgress
          ? _value.recordingProgress
          : recordingProgress // ignore: cast_nullable_to_non_nullable
              as double,
      isCloudSyncEnabled: null == isCloudSyncEnabled
          ? _value.isCloudSyncEnabled
          : isCloudSyncEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      isSyncing: null == isSyncing
          ? _value.isSyncing
          : isSyncing // ignore: cast_nullable_to_non_nullable
              as bool,
      lastSyncTime: freezed == lastSyncTime
          ? _value.lastSyncTime
          : lastSyncTime // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }

  /// Create a copy of VoiceJournalState
  /// with the given fields replaced by the non-null parameter values.
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
      bool isAnalyzing,
      bool isProcessing,
      VoiceJournalEntry? currentEntry,
      String? error,
      String? searchQuery,
      List<String> availableTags,
      Map<String, dynamic> analytics,
      Map<String, int> categoryStats,
      Duration totalRecordingTime,
      double recordingProgress,
      bool isCloudSyncEnabled,
      bool isSyncing,
      DateTime? lastSyncTime});

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

  /// Create a copy of VoiceJournalState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? entries = null,
    Object? isLoading = null,
    Object? isRecording = null,
    Object? isTranscribing = null,
    Object? isAnalyzing = null,
    Object? isProcessing = null,
    Object? currentEntry = freezed,
    Object? error = freezed,
    Object? searchQuery = freezed,
    Object? availableTags = null,
    Object? analytics = null,
    Object? categoryStats = null,
    Object? totalRecordingTime = null,
    Object? recordingProgress = null,
    Object? isCloudSyncEnabled = null,
    Object? isSyncing = null,
    Object? lastSyncTime = freezed,
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
      isAnalyzing: null == isAnalyzing
          ? _value.isAnalyzing
          : isAnalyzing // ignore: cast_nullable_to_non_nullable
              as bool,
      isProcessing: null == isProcessing
          ? _value.isProcessing
          : isProcessing // ignore: cast_nullable_to_non_nullable
              as bool,
      currentEntry: freezed == currentEntry
          ? _value.currentEntry
          : currentEntry // ignore: cast_nullable_to_non_nullable
              as VoiceJournalEntry?,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
      searchQuery: freezed == searchQuery
          ? _value.searchQuery
          : searchQuery // ignore: cast_nullable_to_non_nullable
              as String?,
      availableTags: null == availableTags
          ? _value._availableTags
          : availableTags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      analytics: null == analytics
          ? _value._analytics
          : analytics // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      categoryStats: null == categoryStats
          ? _value._categoryStats
          : categoryStats // ignore: cast_nullable_to_non_nullable
              as Map<String, int>,
      totalRecordingTime: null == totalRecordingTime
          ? _value.totalRecordingTime
          : totalRecordingTime // ignore: cast_nullable_to_non_nullable
              as Duration,
      recordingProgress: null == recordingProgress
          ? _value.recordingProgress
          : recordingProgress // ignore: cast_nullable_to_non_nullable
              as double,
      isCloudSyncEnabled: null == isCloudSyncEnabled
          ? _value.isCloudSyncEnabled
          : isCloudSyncEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      isSyncing: null == isSyncing
          ? _value.isSyncing
          : isSyncing // ignore: cast_nullable_to_non_nullable
              as bool,
      lastSyncTime: freezed == lastSyncTime
          ? _value.lastSyncTime
          : lastSyncTime // ignore: cast_nullable_to_non_nullable
              as DateTime?,
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
      this.isAnalyzing = false,
      this.isProcessing = false,
      this.currentEntry,
      this.error,
      this.searchQuery,
      final List<String> availableTags = const [],
      final Map<String, dynamic> analytics = const {},
      final Map<String, int> categoryStats = const {},
      this.totalRecordingTime = Duration.zero,
      this.recordingProgress = 0,
      this.isCloudSyncEnabled = false,
      this.isSyncing = false,
      this.lastSyncTime})
      : _entries = entries,
        _availableTags = availableTags,
        _analytics = analytics,
        _categoryStats = categoryStats;

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
  @JsonKey()
  final bool isAnalyzing;
  @override
  @JsonKey()
  final bool isProcessing;
  @override
  final VoiceJournalEntry? currentEntry;
  @override
  final String? error;
  @override
  final String? searchQuery;
  final List<String> _availableTags;
  @override
  @JsonKey()
  List<String> get availableTags {
    if (_availableTags is EqualUnmodifiableListView) return _availableTags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_availableTags);
  }

  final Map<String, dynamic> _analytics;
  @override
  @JsonKey()
  Map<String, dynamic> get analytics {
    if (_analytics is EqualUnmodifiableMapView) return _analytics;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_analytics);
  }

  final Map<String, int> _categoryStats;
  @override
  @JsonKey()
  Map<String, int> get categoryStats {
    if (_categoryStats is EqualUnmodifiableMapView) return _categoryStats;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_categoryStats);
  }

  @override
  @JsonKey()
  final Duration totalRecordingTime;
  @override
  @JsonKey()
  final double recordingProgress;
  @override
  @JsonKey()
  final bool isCloudSyncEnabled;
  @override
  @JsonKey()
  final bool isSyncing;
  @override
  final DateTime? lastSyncTime;

  @override
  String toString() {
    return 'VoiceJournalState(entries: $entries, isLoading: $isLoading, isRecording: $isRecording, isTranscribing: $isTranscribing, isAnalyzing: $isAnalyzing, isProcessing: $isProcessing, currentEntry: $currentEntry, error: $error, searchQuery: $searchQuery, availableTags: $availableTags, analytics: $analytics, categoryStats: $categoryStats, totalRecordingTime: $totalRecordingTime, recordingProgress: $recordingProgress, isCloudSyncEnabled: $isCloudSyncEnabled, isSyncing: $isSyncing, lastSyncTime: $lastSyncTime)';
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
            (identical(other.isAnalyzing, isAnalyzing) ||
                other.isAnalyzing == isAnalyzing) &&
            (identical(other.isProcessing, isProcessing) ||
                other.isProcessing == isProcessing) &&
            (identical(other.currentEntry, currentEntry) ||
                other.currentEntry == currentEntry) &&
            (identical(other.error, error) || other.error == error) &&
            (identical(other.searchQuery, searchQuery) ||
                other.searchQuery == searchQuery) &&
            const DeepCollectionEquality()
                .equals(other._availableTags, _availableTags) &&
            const DeepCollectionEquality()
                .equals(other._analytics, _analytics) &&
            const DeepCollectionEquality()
                .equals(other._categoryStats, _categoryStats) &&
            (identical(other.totalRecordingTime, totalRecordingTime) ||
                other.totalRecordingTime == totalRecordingTime) &&
            (identical(other.recordingProgress, recordingProgress) ||
                other.recordingProgress == recordingProgress) &&
            (identical(other.isCloudSyncEnabled, isCloudSyncEnabled) ||
                other.isCloudSyncEnabled == isCloudSyncEnabled) &&
            (identical(other.isSyncing, isSyncing) ||
                other.isSyncing == isSyncing) &&
            (identical(other.lastSyncTime, lastSyncTime) ||
                other.lastSyncTime == lastSyncTime));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      const DeepCollectionEquality().hash(_entries),
      isLoading,
      isRecording,
      isTranscribing,
      isAnalyzing,
      isProcessing,
      currentEntry,
      error,
      searchQuery,
      const DeepCollectionEquality().hash(_availableTags),
      const DeepCollectionEquality().hash(_analytics),
      const DeepCollectionEquality().hash(_categoryStats),
      totalRecordingTime,
      recordingProgress,
      isCloudSyncEnabled,
      isSyncing,
      lastSyncTime);

  /// Create a copy of VoiceJournalState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
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
      final bool isAnalyzing,
      final bool isProcessing,
      final VoiceJournalEntry? currentEntry,
      final String? error,
      final String? searchQuery,
      final List<String> availableTags,
      final Map<String, dynamic> analytics,
      final Map<String, int> categoryStats,
      final Duration totalRecordingTime,
      final double recordingProgress,
      final bool isCloudSyncEnabled,
      final bool isSyncing,
      final DateTime? lastSyncTime}) = _$VoiceJournalStateImpl;

  @override
  List<VoiceJournalEntry> get entries;
  @override
  bool get isLoading;
  @override
  bool get isRecording;
  @override
  bool get isTranscribing;
  @override
  bool get isAnalyzing;
  @override
  bool get isProcessing;
  @override
  VoiceJournalEntry? get currentEntry;
  @override
  String? get error;
  @override
  String? get searchQuery;
  @override
  List<String> get availableTags;
  @override
  Map<String, dynamic> get analytics;
  @override
  Map<String, int> get categoryStats;
  @override
  Duration get totalRecordingTime;
  @override
  double get recordingProgress;
  @override
  bool get isCloudSyncEnabled;
  @override
  bool get isSyncing;
  @override
  DateTime? get lastSyncTime;

  /// Create a copy of VoiceJournalState
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$VoiceJournalStateImplCopyWith<_$VoiceJournalStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
