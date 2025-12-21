import 'package:freezed_annotation/freezed_annotation.dart';

part 'recommendation_models.freezed.dart';
part 'recommendation_models.g.dart';

/// Recommendation type categories
enum RecommendationType {
  habit,
  goal,
  engagement,
  coach,
  content,
  challenge,
  wellness,
  learning,
}

/// Recommendation priority levels
enum RecommendationPriority {
  critical,
  high,
  medium,
  low,
}

/// Reason categories for recommendations
enum RecommendationReason {
  streakAtRisk,
  goalDeadlineApproaching,
  lowEngagement,
  skillGap,
  coachMatch,
  popularContent,
  personalizedFit,
  challengeOpportunity,
  wellnessImprovement,
  habitOptimization,
}

/// Content type categories
enum ContentType {
  article,
  video,
  course,
  podcast,
  worksheet,
  exercise,
  meditation,
  challenge,
}

/// Content categories
enum ContentCategory {
  productivity,
  mindfulness,
  fitness,
  nutrition,
  sleep,
  stress,
  relationships,
  career,
  finance,
  personal,
}

/// Content difficulty levels
enum ContentDifficulty {
  beginner,
  intermediate,
  advanced,
}

/// Recommendation action types
enum RecommendationAction {
  view,
  click,
  dismiss,
  complete,
  save,
  share,
}

/// Main recommendation model
@freezed
class Recommendation with _$Recommendation {
  const factory Recommendation({
    required String id,
    required RecommendationType type,
    required RecommendationPriority priority,
    required String title,
    required String description,
    required List<RecommendationReason> reasons,
    required double score,
    String? imageUrl,
    String? actionUrl,
    String? actionLabel,
    Map<String, dynamic>? metadata,
    DateTime? expiresAt,
    @Default(false) bool isDismissed,
    DateTime? createdAt,
  }) = _Recommendation;

  factory Recommendation.fromJson(Map<String, dynamic> json) =>
      _$RecommendationFromJson(json);
}

/// Personalized content item
@freezed
class PersonalizedContent with _$PersonalizedContent {
  const factory PersonalizedContent({
    required String id,
    required String title,
    required String description,
    required ContentType type,
    required ContentCategory category,
    required ContentDifficulty difficulty,
    required double relevanceScore,
    required int durationMinutes,
    String? thumbnailUrl,
    String? authorName,
    String? authorImageUrl,
    double? rating,
    int? reviewCount,
    int? viewCount,
    @Default(false) bool isCompleted,
    @Default(false) bool isSaved,
    double? progressPercent,
    List<String>? tags,
    DateTime? publishedAt,
  }) = _PersonalizedContent;

  factory PersonalizedContent.fromJson(Map<String, dynamic> json) =>
      _$PersonalizedContentFromJson(json);
}

/// Content feed with different sections
@freezed
class ContentFeed with _$ContentFeed {
  const factory ContentFeed({
    required List<PersonalizedContent> featured,
    required List<PersonalizedContent> forYou,
    required List<PersonalizedContent> trending,
    required List<PersonalizedContent> continueLearning,
    required List<PersonalizedContent> basedOnGoals,
    required List<PersonalizedContent> newReleases,
    DateTime? lastUpdated,
  }) = _ContentFeed;

  factory ContentFeed.fromJson(Map<String, dynamic> json) =>
      _$ContentFeedFromJson(json);
}

/// User recommendation preferences
@freezed
class RecommendationPreferences with _$RecommendationPreferences {
  const factory RecommendationPreferences({
    @Default([]) List<ContentCategory> preferredCategories,
    @Default([]) List<ContentType> preferredTypes,
    @Default(ContentDifficulty.intermediate) ContentDifficulty preferredDifficulty,
    @Default(true) bool showHabitRecommendations,
    @Default(true) bool showGoalRecommendations,
    @Default(true) bool showContentRecommendations,
    @Default(true) bool showCoachRecommendations,
    @Default(true) bool showChallengeRecommendations,
    @Default(30) int maxDailyRecommendations,
  }) = _RecommendationPreferences;

  factory RecommendationPreferences.fromJson(Map<String, dynamic> json) =>
      _$RecommendationPreferencesFromJson(json);
}

/// Recommendation interaction record
@freezed
class RecommendationInteraction with _$RecommendationInteraction {
  const factory RecommendationInteraction({
    required String recommendationId,
    required RecommendationAction action,
    required DateTime timestamp,
    Map<String, dynamic>? metadata,
  }) = _RecommendationInteraction;

  factory RecommendationInteraction.fromJson(Map<String, dynamic> json) =>
      _$RecommendationInteractionFromJson(json);
}

/// Coach recommendation with matching details
@freezed
class CoachRecommendation with _$CoachRecommendation {
  const factory CoachRecommendation({
    required String coachId,
    required String name,
    required String specialty,
    required double matchScore,
    required List<String> matchReasons,
    String? imageUrl,
    double? rating,
    int? sessionCount,
    int? clientCount,
    String? bio,
    List<String>? certifications,
    double? hourlyRate,
    @Default(false) bool isAvailable,
  }) = _CoachRecommendation;

  factory CoachRecommendation.fromJson(Map<String, dynamic> json) =>
      _$CoachRecommendationFromJson(json);
}

/// Challenge recommendation
@freezed
class ChallengeRecommendation with _$ChallengeRecommendation {
  const factory ChallengeRecommendation({
    required String challengeId,
    required String title,
    required String description,
    required double matchScore,
    required int participantCount,
    required DateTime startDate,
    required DateTime endDate,
    String? imageUrl,
    String? category,
    List<String>? prizes,
    @Default(false) bool isJoined,
  }) = _ChallengeRecommendation;

  factory ChallengeRecommendation.fromJson(Map<String, dynamic> json) =>
      _$ChallengeRecommendationFromJson(json);
}

/// Recommendations dashboard summary
@freezed
class RecommendationsDashboard with _$RecommendationsDashboard {
  const factory RecommendationsDashboard({
    required List<Recommendation> topRecommendations,
    required List<CoachRecommendation> coachMatches,
    required List<ChallengeRecommendation> suggestedChallenges,
    required ContentFeed contentFeed,
    required RecommendationPreferences preferences,
    int? totalRecommendations,
    int? actedOnToday,
    DateTime? lastUpdated,
  }) = _RecommendationsDashboard;

  factory RecommendationsDashboard.fromJson(Map<String, dynamic> json) =>
      _$RecommendationsDashboardFromJson(json);
}
