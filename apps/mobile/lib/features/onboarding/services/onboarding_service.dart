import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/storage/secure_storage.dart';
import '../models/onboarding_models.dart';

class OnboardingService {
  final ApiService _apiService;
  final SecureStorage _storage;

  static const String _onboardingDataKey = 'onboarding_data';
  static const String _onboardingCompletedKey = 'onboarding_completed';

  OnboardingService(this._apiService) : _storage = SecureStorage();

  // Check if user has completed onboarding
  Future<bool> hasCompletedOnboarding() async {
    try {
      // First check local storage
      final completed = await _storage.read(_onboardingCompletedKey);
      if (completed == 'true') return true;

      // Then check with server
      final response = await _apiService.get(ApiConstants.onboardingStatus);
      final data = response.data as Map<String, dynamic>?;
      final isCompleted = data?['is_completed'] as bool? ?? false;

      if (isCompleted) {
        await _storage.write(_onboardingCompletedKey, 'true');
      }

      return isCompleted;
    } catch (e) {
      // Default to checking local storage only
      final completed = await _storage.read(_onboardingCompletedKey);
      return completed == 'true';
    }
  }

  // Get saved onboarding progress
  Future<OnboardingData?> getSavedProgress() async {
    try {
      final savedData = await _storage.read(_onboardingDataKey);
      if (savedData != null) {
        return OnboardingData.fromJson(jsonDecode(savedData));
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Save onboarding progress locally
  Future<void> saveProgress(OnboardingData data) async {
    await _storage.write(_onboardingDataKey, jsonEncode(data.toJson()));
  }

  // Update profile information
  Future<void> updateProfile(OnboardingProfile profile) async {
    await _apiService.patch(
      ApiConstants.onboardingProfile,
      data: {
        'first_name': profile.firstName,
        'last_name': profile.lastName,
        'display_name': profile.displayName,
        'avatar_url': profile.avatarUrl,
        'phone_number': profile.phoneNumber,
        'timezone': profile.timezone,
        'language': profile.language,
        'date_of_birth': profile.dateOfBirth?.toIso8601String(),
        'gender': profile.gender,
        'location': profile.location,
        'bio': profile.bio,
      },
    );
  }

  // Update coaching goals
  Future<void> updateGoals(OnboardingGoals goals) async {
    await _apiService.patch(
      ApiConstants.onboardingGoals,
      data: {
        'selected_goals': goals.selectedGoals.map((g) => g.name).toList(),
        'experience_level': goals.experienceLevel.name,
        'primary_goal_description': goals.primaryGoalDescription,
        'current_challenges': goals.currentChallenges,
        'desired_outcome': goals.desiredOutcome,
        'commitment_level': goals.commitmentLevel,
        'previous_coaching_experience': goals.previousCoachingExperience,
      },
    );
  }

  // Update coach preferences
  Future<void> updateCoachPreferences(CoachPreferences preferences) async {
    await _apiService.patch(
      ApiConstants.onboardingPreferences,
      data: {
        'preferred_specializations': preferences.preferredSpecializations,
        'session_preference': preferences.sessionPreference.name,
        'availability_preferences':
            preferences.availabilityPreferences.map((a) => a.name).toList(),
        'max_budget_per_session': preferences.maxBudgetPerSession,
        'currency': preferences.currency,
        'preferred_languages': preferences.preferredLanguages,
        'gender_preference': preferences.genderPreference,
        'requires_certified': preferences.requiresCertified,
      },
    );
  }

  // Get recommended coaches based on user preferences
  Future<List<RecommendedCoach>> getRecommendedCoaches() async {
    try {
      final response =
          await _apiService.get(ApiConstants.onboardingRecommendedCoaches);
      final data = response.data as Map<String, dynamic>?;
      final List<dynamic> coachesJson = data?['coaches'] ?? [];
      return coachesJson
          .map(
              (json) => RecommendedCoach.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  // Complete onboarding
  Future<void> completeOnboarding(OnboardingData data) async {
    await _apiService.post(
      ApiConstants.onboardingComplete,
      data: {
        'profile': data.profile.toJson(),
        'goals': data.goals.toJson(),
        'coach_preferences': data.coachPreferences.toJson(),
        'notifications_enabled': data.notificationsEnabled,
        'marketing_emails_enabled': data.marketingEmailsEnabled,
      },
    );

    // Mark as completed locally
    await _storage.write(_onboardingCompletedKey, 'true');
    // Clear the progress data
    await _storage.deleteKey(_onboardingDataKey);
  }

  // Update notification preferences
  Future<void> updateNotificationPreferences({
    required bool notificationsEnabled,
    required bool marketingEmailsEnabled,
  }) async {
    await _apiService.patch(
      ApiConstants.onboardingNotifications,
      data: {
        'notifications_enabled': notificationsEnabled,
        'marketing_emails_enabled': marketingEmailsEnabled,
      },
    );
  }

  // Skip onboarding (mark as completed without full setup)
  Future<void> skipOnboarding() async {
    try {
      await _apiService.post(ApiConstants.onboardingSkip, data: {});
    } catch (_) {
      // Even if API fails, mark locally as completed
    }
    await _storage.write(_onboardingCompletedKey, 'true');
    await _storage.deleteKey(_onboardingDataKey);
  }

  // Reset onboarding (for testing or re-onboarding)
  Future<void> resetOnboarding() async {
    await _storage.deleteKey(_onboardingCompletedKey);
    await _storage.deleteKey(_onboardingDataKey);
  }

  // Upload avatar image
  Future<String> uploadAvatar(String filePath) async {
    final formData = FormData.fromMap({
      'avatar': await MultipartFile.fromFile(filePath, filename: 'avatar.jpg'),
    });

    final response = await _apiService.post(
      ApiConstants.uploadAvatar,
      data: formData,
      options: Options(
        contentType: 'multipart/form-data',
      ),
    );

    final data = response.data as Map<String, dynamic>?;
    return data?['url'] as String? ?? '';
  }
}

// Provider
final onboardingServiceProvider = Provider<OnboardingService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return OnboardingService(apiService);
});
