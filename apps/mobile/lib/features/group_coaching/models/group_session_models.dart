import 'package:freezed_annotation/freezed_annotation.dart';

part 'group_session_models.freezed.dart';
part 'group_session_models.g.dart';

/// Session type enum
enum SessionType {
  @JsonValue('workshop')
  workshop,
  @JsonValue('masterclass')
  masterclass,
  @JsonValue('q_and_a')
  qAndA,
  @JsonValue('support_group')
  supportGroup,
  @JsonValue('training')
  training;

  String get displayName {
    switch (this) {
      case SessionType.workshop:
        return 'Workshop';
      case SessionType.masterclass:
        return 'Masterclass';
      case SessionType.qAndA:
        return 'Q&A Session';
      case SessionType.supportGroup:
        return 'Support Group';
      case SessionType.training:
        return 'Training';
    }
  }
}

/// Session status enum
enum SessionStatus {
  @JsonValue('draft')
  draft,
  @JsonValue('scheduled')
  scheduled,
  @JsonValue('live')
  live,
  @JsonValue('completed')
  completed,
  @JsonValue('cancelled')
  cancelled;

  String get displayName {
    switch (this) {
      case SessionStatus.draft:
        return 'Draft';
      case SessionStatus.scheduled:
        return 'Scheduled';
      case SessionStatus.live:
        return 'Live Now';
      case SessionStatus.completed:
        return 'Completed';
      case SessionStatus.cancelled:
        return 'Cancelled';
    }
  }

  bool get isActive => this == SessionStatus.scheduled || this == SessionStatus.live;
}

/// Participant status enum
enum ParticipantStatus {
  @JsonValue('registered')
  registered,
  @JsonValue('waitlisted')
  waitlisted,
  @JsonValue('confirmed')
  confirmed,
  @JsonValue('attended')
  attended,
  @JsonValue('no_show')
  noShow,
  @JsonValue('cancelled')
  cancelled;
}

/// Chat message type enum
enum ChatMessageType {
  @JsonValue('text')
  text,
  @JsonValue('poll')
  poll,
  @JsonValue('announcement')
  announcement,
  @JsonValue('question')
  question,
  @JsonValue('answer')
  answer,
  @JsonValue('system')
  system,
}

/// Group session model
@freezed
class GroupSession with _$GroupSession {
  const factory GroupSession({
    required String id,
    required String coachId,
    required String title,
    required String description,
    required SessionType sessionType,
    required String category,
    @Default([]) List<String> tags,
    required DateTime scheduledAt,
    required int durationMinutes,
    @Default('UTC') String timezone,
    @Default(20) int maxParticipants,
    @Default(0) int currentParticipants,
    @Default(false) bool isFree,
    double? price,
    @Default('USD') String currency,
    double? earlyBirdPrice,
    DateTime? earlyBirdDeadline,
    @Default(SessionStatus.scheduled) SessionStatus status,
    String? coverImageUrl,
    String? prerequisites,
    @Default([]) List<String> learningObjectives,
    String? meetingUrl,
    @Default(true) bool chatEnabled,
    @Default(true) bool pollsEnabled,
    @Default(true) bool qnaEnabled,
    double? averageRating,
    @Default(0) int ratingCount,
    // Coach info (populated on fetch)
    String? coachName,
    String? coachAvatarUrl,
    String? coachBio,
  }) = _GroupSession;

  const GroupSession._();

  factory GroupSession.fromJson(Map<String, dynamic> json) =>
      _$GroupSessionFromJson(json);

  bool get isUpcoming => status == SessionStatus.scheduled && scheduledAt.isAfter(DateTime.now());
  bool get isLive => status == SessionStatus.live;
  bool get isFull => currentParticipants >= maxParticipants;
  int get spotsLeft => maxParticipants - currentParticipants;

  DateTime get endTime => scheduledAt.add(Duration(minutes: durationMinutes));

  double get currentPrice {
    if (isFree) return 0;
    if (earlyBirdPrice != null && earlyBirdDeadline != null && DateTime.now().isBefore(earlyBirdDeadline!)) {
      return earlyBirdPrice!;
    }
    return price ?? 0;
  }

  String get priceDisplay {
    if (isFree) return 'Free';
    return '\$${currentPrice.toStringAsFixed(2)}';
  }

  String get durationDisplay {
    if (durationMinutes < 60) return '${durationMinutes}min';
    final hours = durationMinutes ~/ 60;
    final mins = durationMinutes % 60;
    if (mins == 0) return '${hours}h';
    return '${hours}h ${mins}m';
  }
}

/// Group session participant
@freezed
class GroupSessionParticipant with _$GroupSessionParticipant {
  const factory GroupSessionParticipant({
    required String id,
    required String sessionId,
    required String userId,
    required ParticipantStatus status,
    required DateTime registeredAt,
    DateTime? joinedAt,
    @Default(0) int attendanceMinutes,
    @Default(0.0) double attendancePercentage,
    int? rating,
    String? feedback,
    // User info (populated on fetch)
    String? userName,
    String? userAvatarUrl,
  }) = _GroupSessionParticipant;

  factory GroupSessionParticipant.fromJson(Map<String, dynamic> json) =>
      _$GroupSessionParticipantFromJson(json);
}

/// Chat message model
@freezed
class ChatMessage with _$ChatMessage {
  const factory ChatMessage({
    required String id,
    required String sessionId,
    required String userId,
    required ChatMessageType messageType,
    required String content,
    String? replyToId,
    PollData? pollData,
    @Default([]) List<ChatReaction> reactions,
    @Default(false) bool isPinned,
    @Default(false) bool isHighlighted,
    @Default(false) bool isAnswered,
    @Default(0) int upvoteCount,
    @Default(false) bool hasUpvoted,
    required DateTime createdAt,
    DateTime? editedAt,
    // User info (populated on fetch)
    String? userName,
    String? userAvatarUrl,
  }) = _ChatMessage;

  factory ChatMessage.fromJson(Map<String, dynamic> json) =>
      _$ChatMessageFromJson(json);
}

/// Poll data
@freezed
class PollData with _$PollData {
  const factory PollData({
    required String question,
    required List<PollOption> options,
    @Default('active') String status,
    @Default(false) bool allowMultiple,
    @Default(false) bool anonymous,
    @Default(true) bool showResults,
    DateTime? closedAt,
  }) = _PollData;

  const PollData._();

  factory PollData.fromJson(Map<String, dynamic> json) =>
      _$PollDataFromJson(json);

  bool get isActive => status == 'active';
  int get totalVotes => options.fold(0, (sum, opt) => sum + opt.voteCount);
}

/// Poll option
@freezed
class PollOption with _$PollOption {
  const factory PollOption({
    required String id,
    required String text,
    @Default(0) int voteCount,
    @Default(false) bool hasVoted,
  }) = _PollOption;

  factory PollOption.fromJson(Map<String, dynamic> json) =>
      _$PollOptionFromJson(json);
}

/// Chat reaction
@freezed
class ChatReaction with _$ChatReaction {
  const factory ChatReaction({
    required String emoji,
    required int count,
    @Default(false) bool hasReacted,
  }) = _ChatReaction;

  factory ChatReaction.fromJson(Map<String, dynamic> json) =>
      _$ChatReactionFromJson(json);
}

/// Registration result
@freezed
class RegistrationResult with _$RegistrationResult {
  const factory RegistrationResult({
    required bool success,
    GroupSessionParticipant? participant,
    String? error,
    @Default(false) bool waitlisted,
    @Default(false) bool requiresPayment,
    double? paymentAmount,
  }) = _RegistrationResult;

  factory RegistrationResult.fromJson(Map<String, dynamic> json) =>
      _$RegistrationResultFromJson(json);
}
