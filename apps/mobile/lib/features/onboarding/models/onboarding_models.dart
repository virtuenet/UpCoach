import 'package:freezed_annotation/freezed_annotation.dart';

part 'onboarding_models.freezed.dart';
part 'onboarding_models.g.dart';

// ============================================================================
// Enums
// ============================================================================

enum OnboardingStep {
  welcome,
  profileSetup,
  goalsSelection,
  coachMatching,
  notifications,
  completed,
}

enum CoachingGoal {
  @JsonValue('fitness')
  fitness,
  @JsonValue('nutrition')
  nutrition,
  @JsonValue('mental_health')
  mentalHealth,
  @JsonValue('career')
  career,
  @JsonValue('relationships')
  relationships,
  @JsonValue('productivity')
  productivity,
  @JsonValue('mindfulness')
  mindfulness,
  @JsonValue('sleep')
  sleep,
  @JsonValue('stress_management')
  stressManagement,
  @JsonValue('weight_loss')
  weightLoss,
  @JsonValue('muscle_building')
  muscleBuilding,
  @JsonValue('general_wellness')
  generalWellness,
}

enum ExperienceLevel {
  @JsonValue('beginner')
  beginner,
  @JsonValue('intermediate')
  intermediate,
  @JsonValue('advanced')
  advanced,
}

enum SessionPreference {
  @JsonValue('video')
  video,
  @JsonValue('audio')
  audio,
  @JsonValue('chat')
  chat,
  @JsonValue('any')
  any,
}

enum AvailabilityPreference {
  @JsonValue('morning')
  morning,
  @JsonValue('afternoon')
  afternoon,
  @JsonValue('evening')
  evening,
  @JsonValue('weekend')
  weekend,
  @JsonValue('flexible')
  flexible,
}

// ============================================================================
// Models
// ============================================================================

@freezed
class OnboardingProfile with _$OnboardingProfile {
  const factory OnboardingProfile({
    String? firstName,
    String? lastName,
    String? displayName,
    String? avatarUrl,
    String? phoneNumber,
    String? timezone,
    String? language,
    DateTime? dateOfBirth,
    String? gender,
    String? location,
    String? bio,
  }) = _OnboardingProfile;

  factory OnboardingProfile.fromJson(Map<String, dynamic> json) =>
      _$OnboardingProfileFromJson(json);
}

@freezed
class OnboardingGoals with _$OnboardingGoals {
  const factory OnboardingGoals({
    @Default([]) List<CoachingGoal> selectedGoals,
    @Default(ExperienceLevel.beginner) ExperienceLevel experienceLevel,
    String? primaryGoalDescription,
    String? currentChallenges,
    String? desiredOutcome,
    @Default(3) int commitmentLevel, // 1-5 scale
    String? previousCoachingExperience,
  }) = _OnboardingGoals;

  factory OnboardingGoals.fromJson(Map<String, dynamic> json) =>
      _$OnboardingGoalsFromJson(json);
}

@freezed
class CoachPreferences with _$CoachPreferences {
  const factory CoachPreferences({
    @Default([]) List<String> preferredSpecializations,
    @Default(SessionPreference.any) SessionPreference sessionPreference,
    @Default([]) List<AvailabilityPreference> availabilityPreferences,
    double? maxBudgetPerSession,
    @Default('USD') String currency,
    @Default([]) List<String> preferredLanguages,
    String? genderPreference,
    @Default(false) bool requiresCertified,
  }) = _CoachPreferences;

  factory CoachPreferences.fromJson(Map<String, dynamic> json) =>
      _$CoachPreferencesFromJson(json);
}

@freezed
class OnboardingData with _$OnboardingData {
  const OnboardingData._();

  const factory OnboardingData({
    @Default(OnboardingStep.welcome) OnboardingStep currentStep,
    @Default(OnboardingProfile()) OnboardingProfile profile,
    @Default(OnboardingGoals()) OnboardingGoals goals,
    @Default(CoachPreferences()) CoachPreferences coachPreferences,
    @Default(false) bool notificationsEnabled,
    @Default(false) bool marketingEmailsEnabled,
    DateTime? completedAt,
  }) = _OnboardingData;

  factory OnboardingData.fromJson(Map<String, dynamic> json) =>
      _$OnboardingDataFromJson(json);

  bool get isCompleted => currentStep == OnboardingStep.completed;

  double get progressPercentage {
    switch (currentStep) {
      case OnboardingStep.welcome:
        return 0.0;
      case OnboardingStep.profileSetup:
        return 0.2;
      case OnboardingStep.goalsSelection:
        return 0.4;
      case OnboardingStep.coachMatching:
        return 0.6;
      case OnboardingStep.notifications:
        return 0.8;
      case OnboardingStep.completed:
        return 1.0;
    }
  }

  int get currentStepIndex {
    return OnboardingStep.values.indexOf(currentStep);
  }

  int get totalSteps => OnboardingStep.values.length - 1; // Exclude 'completed'
}

@freezed
class RecommendedCoach with _$RecommendedCoach {
  const factory RecommendedCoach({
    required int id,
    required String displayName,
    String? profileImageUrl,
    @Default([]) List<String> specializations,
    @Default(0.0) double averageRating,
    @Default(0) int totalSessions,
    double? hourlyRate,
    @Default('USD') String currency,
    String? bio,
    @Default(0.0)
    double matchScore, // 0-100 how well they match user preferences
  }) = _RecommendedCoach;

  factory RecommendedCoach.fromJson(Map<String, dynamic> json) =>
      _$RecommendedCoachFromJson(json);
}

// ============================================================================
// Goal Display Helpers
// ============================================================================

extension CoachingGoalExtension on CoachingGoal {
  String get displayName {
    switch (this) {
      case CoachingGoal.fitness:
        return 'Fitness';
      case CoachingGoal.nutrition:
        return 'Nutrition';
      case CoachingGoal.mentalHealth:
        return 'Mental Health';
      case CoachingGoal.career:
        return 'Career Growth';
      case CoachingGoal.relationships:
        return 'Relationships';
      case CoachingGoal.productivity:
        return 'Productivity';
      case CoachingGoal.mindfulness:
        return 'Mindfulness';
      case CoachingGoal.sleep:
        return 'Sleep';
      case CoachingGoal.stressManagement:
        return 'Stress Management';
      case CoachingGoal.weightLoss:
        return 'Weight Loss';
      case CoachingGoal.muscleBuilding:
        return 'Muscle Building';
      case CoachingGoal.generalWellness:
        return 'General Wellness';
    }
  }

  String get icon {
    switch (this) {
      case CoachingGoal.fitness:
        return '💪';
      case CoachingGoal.nutrition:
        return '🥗';
      case CoachingGoal.mentalHealth:
        return '🧠';
      case CoachingGoal.career:
        return '💼';
      case CoachingGoal.relationships:
        return '❤️';
      case CoachingGoal.productivity:
        return '📈';
      case CoachingGoal.mindfulness:
        return '🧘';
      case CoachingGoal.sleep:
        return '😴';
      case CoachingGoal.stressManagement:
        return '🌿';
      case CoachingGoal.weightLoss:
        return '⚖️';
      case CoachingGoal.muscleBuilding:
        return '🏋️';
      case CoachingGoal.generalWellness:
        return '🌟';
    }
  }
}

extension ExperienceLevelExtension on ExperienceLevel {
  String get displayName {
    switch (this) {
      case ExperienceLevel.beginner:
        return 'Beginner';
      case ExperienceLevel.intermediate:
        return 'Intermediate';
      case ExperienceLevel.advanced:
        return 'Advanced';
    }
  }

  String get description {
    switch (this) {
      case ExperienceLevel.beginner:
        return 'New to coaching, looking for guidance';
      case ExperienceLevel.intermediate:
        return 'Some experience, ready to level up';
      case ExperienceLevel.advanced:
        return 'Experienced, seeking expert coaching';
    }
  }
}
