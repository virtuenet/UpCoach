import 'package:freezed_annotation/freezed_annotation.dart';

part 'challenge_models.freezed.dart';
part 'challenge_models.g.dart';

/// Challenge type
enum ChallengeType {
  @JsonValue('individual')
  individual,
  @JsonValue('team')
  team,
  @JsonValue('community')
  community,
}

/// Challenge category
enum ChallengeCategory {
  @JsonValue('habits')
  habits,
  @JsonValue('fitness')
  fitness,
  @JsonValue('mindfulness')
  mindfulness,
  @JsonValue('learning')
  learning,
  @JsonValue('productivity')
  productivity,
  @JsonValue('wellness')
  wellness,
  @JsonValue('social')
  social,
  @JsonValue('custom')
  custom,
}

/// Challenge status
enum ChallengeStatus {
  @JsonValue('draft')
  draft,
  @JsonValue('upcoming')
  upcoming,
  @JsonValue('active')
  active,
  @JsonValue('completed')
  completed,
  @JsonValue('cancelled')
  cancelled,
}

/// Scoring type
enum ScoringType {
  @JsonValue('points')
  points,
  @JsonValue('completion')
  completion,
  @JsonValue('streak')
  streak,
  @JsonValue('time')
  time,
}

/// Participant status
enum ParticipantStatus {
  @JsonValue('registered')
  registered,
  @JsonValue('active')
  active,
  @JsonValue('completed')
  completed,
  @JsonValue('withdrawn')
  withdrawn,
  @JsonValue('disqualified')
  disqualified,
}

/// Team status
enum TeamStatus {
  @JsonValue('forming')
  forming,
  @JsonValue('active')
  active,
  @JsonValue('completed')
  completed,
  @JsonValue('disbanded')
  disbanded,
}

/// Challenge requirement
@freezed
class ChallengeRequirement with _$ChallengeRequirement {
  const factory ChallengeRequirement({
    required String id,
    required String type,
    required String description,
    required int targetValue,
    required String unit,
    @Default(10) int pointsPerCompletion,
    int? maxPoints,
    String? habitId,
    Map<String, dynamic>? metadata,
  }) = _ChallengeRequirement;

  factory ChallengeRequirement.fromJson(Map<String, dynamic> json) =>
      _$ChallengeRequirementFromJson(json);
}

/// Challenge prize
@freezed
class ChallengePrize with _$ChallengePrize {
  const factory ChallengePrize({
    required String id,
    required int rank,
    required String title,
    required String description,
    required String type,
    String? imageUrl,
    int? coinAmount,
    String? badgeId,
    Map<String, dynamic>? metadata,
  }) = _ChallengePrize;

  factory ChallengePrize.fromJson(Map<String, dynamic> json) =>
      _$ChallengePrizeFromJson(json);
}

/// Challenge milestone
@freezed
class ChallengeMilestone with _$ChallengeMilestone {
  const factory ChallengeMilestone({
    required String id,
    required String title,
    required String description,
    required int targetValue,
    required int bonusPoints,
    String? badgeId,
    String? iconUrl,
  }) = _ChallengeMilestone;

  factory ChallengeMilestone.fromJson(Map<String, dynamic> json) =>
      _$ChallengeMilestoneFromJson(json);
}

/// Progress entry
@freezed
class ProgressEntry with _$ProgressEntry {
  const factory ProgressEntry({
    required String requirementId,
    required int currentValue,
    required int targetValue,
    required int pointsEarned,
    required DateTime lastUpdated,
  }) = _ProgressEntry;

  factory ProgressEntry.fromJson(Map<String, dynamic> json) =>
      _$ProgressEntryFromJson(json);
}

/// Milestone achievement
@freezed
class MilestoneAchievement with _$MilestoneAchievement {
  const factory MilestoneAchievement({
    required String milestoneId,
    required DateTime achievedAt,
  }) = _MilestoneAchievement;

  factory MilestoneAchievement.fromJson(Map<String, dynamic> json) =>
      _$MilestoneAchievementFromJson(json);
}

/// Team member
@freezed
class TeamMember with _$TeamMember {
  const factory TeamMember({
    required String odolserId,
    required String role,
    required DateTime joinedAt,
    @Default(0) int contribution,
    @Default(0) int streak,
  }) = _TeamMember;

  factory TeamMember.fromJson(Map<String, dynamic> json) =>
      _$TeamMemberFromJson(json);
}

/// Social challenge
@freezed
class SocialChallenge with _$SocialChallenge {
  const factory SocialChallenge({
    required String id,
    required String creatorId,
    String? coachId,
    required String title,
    required String description,
    String? coverImageUrl,
    required ChallengeType type,
    required ChallengeCategory category,
    required DateTime startDate,
    required DateTime endDate,
    DateTime? registrationDeadline,
    required List<ChallengeRequirement> requirements,
    @Default(ScoringType.points) ScoringType scoringType,
    @Default([]) List<ChallengePrize> prizes,
    @Default([]) List<ChallengeMilestone> milestones,
    int? maxParticipants,
    int? minTeamSize,
    int? maxTeamSize,
    @Default(true) bool isPublic,
    @Default(false) bool inviteOnly,
    String? inviteCode,
    @Default(false) bool isFeatured,
    @Default(ChallengeStatus.draft) ChallengeStatus status,
    @Default(0) int totalParticipants,
    @Default(0) int totalTeams,
    @Default(0) int totalCompletions,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _SocialChallenge;

  factory SocialChallenge.fromJson(Map<String, dynamic> json) =>
      _$SocialChallengeFromJson(json);
}

/// Challenge participant
@freezed
class ChallengeParticipant with _$ChallengeParticipant {
  const factory ChallengeParticipant({
    required String id,
    required String challengeId,
    required String odolserId,
    String? teamId,
    required ParticipantStatus status,
    @Default([]) List<ProgressEntry> progress,
    @Default(0) int totalScore,
    @Default(0) double completionPercentage,
    int? rank,
    int? previousRank,
    @Default(0) int rankChange,
    @Default(0) int currentStreak,
    @Default(0) int longestStreak,
    DateTime? lastActivityDate,
    @Default([]) List<MilestoneAchievement> milestonesAchieved,
    @Default(0) int cheersReceived,
    @Default(0) int cheersGiven,
    DateTime? withdrawnAt,
    required DateTime joinedAt,
  }) = _ChallengeParticipant;

  factory ChallengeParticipant.fromJson(Map<String, dynamic> json) =>
      _$ChallengeParticipantFromJson(json);
}

/// Challenge team
@freezed
class ChallengeTeam with _$ChallengeTeam {
  const factory ChallengeTeam({
    required String id,
    required String challengeId,
    required String name,
    String? description,
    String? avatarUrl,
    required String captainId,
    required TeamStatus status,
    @Default([]) List<TeamMember> members,
    int? maxMembers,
    @Default(true) bool isPublic,
    String? inviteCode,
    @Default(0) int totalScore,
    @Default(0) double completionPercentage,
    @Default(0) int combinedStreak,
    int? rank,
    int? previousRank,
    @Default(0) int rankChange,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _ChallengeTeam;

  factory ChallengeTeam.fromJson(Map<String, dynamic> json) =>
      _$ChallengeTeamFromJson(json);
}

/// Leaderboard entry
@freezed
class LeaderboardEntry with _$LeaderboardEntry {
  const factory LeaderboardEntry({
    required int rank,
    int? previousRank,
    @Default(0) int rankChange,
    String? userId,
    String? teamId,
    required String displayName,
    String? avatarUrl,
    required int score,
    required double completionPercentage,
    @Default(0) int streak,
    @Default(false) bool isCurrentUser,
  }) = _LeaderboardEntry;

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) =>
      _$LeaderboardEntryFromJson(json);
}

/// Leaderboard snapshot
@freezed
class LeaderboardSnapshot with _$LeaderboardSnapshot {
  const factory LeaderboardSnapshot({
    required String challengeId,
    required DateTime updatedAt,
    required int totalParticipants,
    required List<LeaderboardEntry> entries,
    LeaderboardEntry? userRank,
  }) = _LeaderboardSnapshot;

  factory LeaderboardSnapshot.fromJson(Map<String, dynamic> json) =>
      _$LeaderboardSnapshotFromJson(json);
}

/// Progress summary
@freezed
class ProgressSummary with _$ProgressSummary {
  const factory ProgressSummary({
    required String challengeId,
    required String userId,
    required int totalScore,
    required double completionPercentage,
    int? rank,
    @Default(0) int streak,
    required List<RequirementProgress> requirements,
    required List<MilestoneProgress> milestones,
    @Default([]) List<ActivityEntry> recentActivity,
  }) = _ProgressSummary;

  factory ProgressSummary.fromJson(Map<String, dynamic> json) =>
      _$ProgressSummaryFromJson(json);
}

/// Requirement progress
@freezed
class RequirementProgress with _$RequirementProgress {
  const factory RequirementProgress({
    required String requirementId,
    required String description,
    required int currentValue,
    required int targetValue,
    required double percentage,
    required int pointsEarned,
  }) = _RequirementProgress;

  factory RequirementProgress.fromJson(Map<String, dynamic> json) =>
      _$RequirementProgressFromJson(json);
}

/// Milestone progress
@freezed
class MilestoneProgress with _$MilestoneProgress {
  const factory MilestoneProgress({
    required String milestoneId,
    required String title,
    required bool achieved,
    DateTime? achievedAt,
  }) = _MilestoneProgress;

  factory MilestoneProgress.fromJson(Map<String, dynamic> json) =>
      _$MilestoneProgressFromJson(json);
}

/// Activity entry
@freezed
class ActivityEntry with _$ActivityEntry {
  const factory ActivityEntry({
    required DateTime timestamp,
    required String description,
    required int points,
  }) = _ActivityEntry;

  factory ActivityEntry.fromJson(Map<String, dynamic> json) =>
      _$ActivityEntryFromJson(json);
}

/// Extension for challenge helpers
extension SocialChallengeX on SocialChallenge {
  bool get isRegistrationOpen {
    final now = DateTime.now();
    final deadline = registrationDeadline ?? startDate;
    return status != ChallengeStatus.cancelled &&
        status != ChallengeStatus.completed &&
        now.isBefore(deadline) &&
        (maxParticipants == null || totalParticipants < maxParticipants!);
  }

  bool get isActive => status == ChallengeStatus.active;
  bool get isUpcoming => status == ChallengeStatus.upcoming;
  bool get isCompleted => status == ChallengeStatus.completed;

  Duration get duration => endDate.difference(startDate);

  int get daysRemaining {
    final now = DateTime.now();
    if (now.isAfter(endDate)) return 0;
    return endDate.difference(now).inDays;
  }

  int get daysUntilStart {
    final now = DateTime.now();
    if (now.isAfter(startDate)) return 0;
    return startDate.difference(now).inDays;
  }
}

/// Extension for participant helpers
extension ChallengeParticipantX on ChallengeParticipant {
  bool get isActive => status == ParticipantStatus.active;
  bool get isCompleted => status == ParticipantStatus.completed;
  bool get hasWithdrawn => status == ParticipantStatus.withdrawn;

  String get rankChangeDisplay {
    if (rankChange == 0) return '-';
    if (rankChange > 0) return '+$rankChange';
    return '$rankChange';
  }
}

/// Extension for team helpers
extension ChallengeTeamX on ChallengeTeam {
  bool get isFull => maxMembers != null && members.length >= maxMembers!;
  int get memberCount => members.length;

  bool get isActive => status == TeamStatus.active;
  bool get isForming => status == TeamStatus.forming;
}
