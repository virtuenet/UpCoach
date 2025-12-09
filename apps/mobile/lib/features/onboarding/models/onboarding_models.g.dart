// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'onboarding_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_OnboardingProfile _$OnboardingProfileFromJson(Map<String, dynamic> json) =>
    _OnboardingProfile(
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      displayName: json['displayName'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      phoneNumber: json['phoneNumber'] as String?,
      timezone: json['timezone'] as String?,
      language: json['language'] as String?,
      dateOfBirth: json['dateOfBirth'] == null
          ? null
          : DateTime.parse(json['dateOfBirth'] as String),
      gender: json['gender'] as String?,
      location: json['location'] as String?,
      bio: json['bio'] as String?,
    );

Map<String, dynamic> _$OnboardingProfileToJson(_OnboardingProfile instance) =>
    <String, dynamic>{
      'firstName': instance.firstName,
      'lastName': instance.lastName,
      'displayName': instance.displayName,
      'avatarUrl': instance.avatarUrl,
      'phoneNumber': instance.phoneNumber,
      'timezone': instance.timezone,
      'language': instance.language,
      'dateOfBirth': instance.dateOfBirth?.toIso8601String(),
      'gender': instance.gender,
      'location': instance.location,
      'bio': instance.bio,
    };

_OnboardingGoals _$OnboardingGoalsFromJson(Map<String, dynamic> json) =>
    _OnboardingGoals(
      selectedGoals:
          (json['selectedGoals'] as List<dynamic>?)
              ?.map((e) => $enumDecode(_$CoachingGoalEnumMap, e))
              .toList() ??
          const [],
      experienceLevel:
          $enumDecodeNullable(
            _$ExperienceLevelEnumMap,
            json['experienceLevel'],
          ) ??
          ExperienceLevel.beginner,
      primaryGoalDescription: json['primaryGoalDescription'] as String?,
      currentChallenges: json['currentChallenges'] as String?,
      desiredOutcome: json['desiredOutcome'] as String?,
      commitmentLevel: (json['commitmentLevel'] as num?)?.toInt() ?? 3,
      previousCoachingExperience: json['previousCoachingExperience'] as String?,
    );

Map<String, dynamic> _$OnboardingGoalsToJson(_OnboardingGoals instance) =>
    <String, dynamic>{
      'selectedGoals': instance.selectedGoals
          .map((e) => _$CoachingGoalEnumMap[e]!)
          .toList(),
      'experienceLevel': _$ExperienceLevelEnumMap[instance.experienceLevel]!,
      'primaryGoalDescription': instance.primaryGoalDescription,
      'currentChallenges': instance.currentChallenges,
      'desiredOutcome': instance.desiredOutcome,
      'commitmentLevel': instance.commitmentLevel,
      'previousCoachingExperience': instance.previousCoachingExperience,
    };

const _$CoachingGoalEnumMap = {
  CoachingGoal.fitness: 'fitness',
  CoachingGoal.nutrition: 'nutrition',
  CoachingGoal.mentalHealth: 'mental_health',
  CoachingGoal.career: 'career',
  CoachingGoal.relationships: 'relationships',
  CoachingGoal.productivity: 'productivity',
  CoachingGoal.mindfulness: 'mindfulness',
  CoachingGoal.sleep: 'sleep',
  CoachingGoal.stressManagement: 'stress_management',
  CoachingGoal.weightLoss: 'weight_loss',
  CoachingGoal.muscleBuilding: 'muscle_building',
  CoachingGoal.generalWellness: 'general_wellness',
};

const _$ExperienceLevelEnumMap = {
  ExperienceLevel.beginner: 'beginner',
  ExperienceLevel.intermediate: 'intermediate',
  ExperienceLevel.advanced: 'advanced',
};

_CoachPreferences _$CoachPreferencesFromJson(Map<String, dynamic> json) =>
    _CoachPreferences(
      preferredSpecializations:
          (json['preferredSpecializations'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      sessionPreference:
          $enumDecodeNullable(
            _$SessionPreferenceEnumMap,
            json['sessionPreference'],
          ) ??
          SessionPreference.any,
      availabilityPreferences:
          (json['availabilityPreferences'] as List<dynamic>?)
              ?.map((e) => $enumDecode(_$AvailabilityPreferenceEnumMap, e))
              .toList() ??
          const [],
      maxBudgetPerSession: (json['maxBudgetPerSession'] as num?)?.toDouble(),
      currency: json['currency'] as String? ?? 'USD',
      preferredLanguages:
          (json['preferredLanguages'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      genderPreference: json['genderPreference'] as String?,
      requiresCertified: json['requiresCertified'] as bool? ?? false,
    );

Map<String, dynamic> _$CoachPreferencesToJson(
  _CoachPreferences instance,
) => <String, dynamic>{
  'preferredSpecializations': instance.preferredSpecializations,
  'sessionPreference': _$SessionPreferenceEnumMap[instance.sessionPreference]!,
  'availabilityPreferences': instance.availabilityPreferences
      .map((e) => _$AvailabilityPreferenceEnumMap[e]!)
      .toList(),
  'maxBudgetPerSession': instance.maxBudgetPerSession,
  'currency': instance.currency,
  'preferredLanguages': instance.preferredLanguages,
  'genderPreference': instance.genderPreference,
  'requiresCertified': instance.requiresCertified,
};

const _$SessionPreferenceEnumMap = {
  SessionPreference.video: 'video',
  SessionPreference.audio: 'audio',
  SessionPreference.chat: 'chat',
  SessionPreference.any: 'any',
};

const _$AvailabilityPreferenceEnumMap = {
  AvailabilityPreference.morning: 'morning',
  AvailabilityPreference.afternoon: 'afternoon',
  AvailabilityPreference.evening: 'evening',
  AvailabilityPreference.weekend: 'weekend',
  AvailabilityPreference.flexible: 'flexible',
};

_OnboardingData _$OnboardingDataFromJson(Map<String, dynamic> json) =>
    _OnboardingData(
      currentStep:
          $enumDecodeNullable(_$OnboardingStepEnumMap, json['currentStep']) ??
          OnboardingStep.welcome,
      profile: json['profile'] == null
          ? const OnboardingProfile()
          : OnboardingProfile.fromJson(json['profile'] as Map<String, dynamic>),
      goals: json['goals'] == null
          ? const OnboardingGoals()
          : OnboardingGoals.fromJson(json['goals'] as Map<String, dynamic>),
      coachPreferences: json['coachPreferences'] == null
          ? const CoachPreferences()
          : CoachPreferences.fromJson(
              json['coachPreferences'] as Map<String, dynamic>,
            ),
      notificationsEnabled: json['notificationsEnabled'] as bool? ?? false,
      marketingEmailsEnabled: json['marketingEmailsEnabled'] as bool? ?? false,
      completedAt: json['completedAt'] == null
          ? null
          : DateTime.parse(json['completedAt'] as String),
    );

Map<String, dynamic> _$OnboardingDataToJson(_OnboardingData instance) =>
    <String, dynamic>{
      'currentStep': _$OnboardingStepEnumMap[instance.currentStep]!,
      'profile': instance.profile,
      'goals': instance.goals,
      'coachPreferences': instance.coachPreferences,
      'notificationsEnabled': instance.notificationsEnabled,
      'marketingEmailsEnabled': instance.marketingEmailsEnabled,
      'completedAt': instance.completedAt?.toIso8601String(),
    };

const _$OnboardingStepEnumMap = {
  OnboardingStep.welcome: 'welcome',
  OnboardingStep.profileSetup: 'profileSetup',
  OnboardingStep.goalsSelection: 'goalsSelection',
  OnboardingStep.coachMatching: 'coachMatching',
  OnboardingStep.notifications: 'notifications',
  OnboardingStep.completed: 'completed',
};

_RecommendedCoach _$RecommendedCoachFromJson(Map<String, dynamic> json) =>
    _RecommendedCoach(
      id: (json['id'] as num).toInt(),
      displayName: json['displayName'] as String,
      profileImageUrl: json['profileImageUrl'] as String?,
      specializations:
          (json['specializations'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0.0,
      totalSessions: (json['totalSessions'] as num?)?.toInt() ?? 0,
      hourlyRate: (json['hourlyRate'] as num?)?.toDouble(),
      currency: json['currency'] as String? ?? 'USD',
      bio: json['bio'] as String?,
      matchScore: (json['matchScore'] as num?)?.toDouble() ?? 0.0,
    );

Map<String, dynamic> _$RecommendedCoachToJson(_RecommendedCoach instance) =>
    <String, dynamic>{
      'id': instance.id,
      'displayName': instance.displayName,
      'profileImageUrl': instance.profileImageUrl,
      'specializations': instance.specializations,
      'averageRating': instance.averageRating,
      'totalSessions': instance.totalSessions,
      'hourlyRate': instance.hourlyRate,
      'currency': instance.currency,
      'bio': instance.bio,
      'matchScore': instance.matchScore,
    };
