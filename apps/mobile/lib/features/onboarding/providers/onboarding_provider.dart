import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/onboarding_models.dart';
import '../services/onboarding_service.dart';

// ============================================================================
// Onboarding State
// ============================================================================

class OnboardingState {
  final OnboardingData data;
  final bool isLoading;
  final bool isSaving;
  final String? error;
  final List<RecommendedCoach> recommendedCoaches;
  final bool isLoadingCoaches;

  const OnboardingState({
    this.data = const OnboardingData(),
    this.isLoading = false,
    this.isSaving = false,
    this.error,
    this.recommendedCoaches = const [],
    this.isLoadingCoaches = false,
  });

  OnboardingState copyWith({
    OnboardingData? data,
    bool? isLoading,
    bool? isSaving,
    String? error,
    List<RecommendedCoach>? recommendedCoaches,
    bool? isLoadingCoaches,
    bool clearError = false,
  }) {
    return OnboardingState(
      data: data ?? this.data,
      isLoading: isLoading ?? this.isLoading,
      isSaving: isSaving ?? this.isSaving,
      error: clearError ? null : (error ?? this.error),
      recommendedCoaches: recommendedCoaches ?? this.recommendedCoaches,
      isLoadingCoaches: isLoadingCoaches ?? this.isLoadingCoaches,
    );
  }
}

// ============================================================================
// Onboarding Notifier
// ============================================================================

class OnboardingNotifier extends StateNotifier<OnboardingState> {
  final OnboardingService _service;

  OnboardingNotifier(this._service) : super(const OnboardingState()) {
    _loadSavedProgress();
  }

  Future<void> _loadSavedProgress() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final savedData = await _service.getSavedProgress();
      if (savedData != null) {
        state = state.copyWith(data: savedData, isLoading: false);
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  // Navigate to specific step
  void goToStep(OnboardingStep step) {
    state = state.copyWith(
      data: state.data.copyWith(currentStep: step),
    );
    _saveProgress();
  }

  // Go to next step
  void nextStep() {
    final currentIndex = state.data.currentStepIndex;
    if (currentIndex < OnboardingStep.values.length - 1) {
      final nextStep = OnboardingStep.values[currentIndex + 1];
      state = state.copyWith(
        data: state.data.copyWith(currentStep: nextStep),
      );
      _saveProgress();
    }
  }

  // Go to previous step
  void previousStep() {
    final currentIndex = state.data.currentStepIndex;
    if (currentIndex > 0) {
      final prevStep = OnboardingStep.values[currentIndex - 1];
      state = state.copyWith(
        data: state.data.copyWith(currentStep: prevStep),
      );
      _saveProgress();
    }
  }

  // Update profile data
  Future<void> updateProfile(OnboardingProfile profile) async {
    state = state.copyWith(
      data: state.data.copyWith(profile: profile),
      isSaving: true,
      clearError: true,
    );

    try {
      await _service.updateProfile(profile);
      await _saveProgress();
      state = state.copyWith(isSaving: false);
    } catch (e) {
      state = state.copyWith(isSaving: false, error: e.toString());
    }
  }

  // Update goals
  Future<void> updateGoals(OnboardingGoals goals) async {
    state = state.copyWith(
      data: state.data.copyWith(goals: goals),
      isSaving: true,
      clearError: true,
    );

    try {
      await _service.updateGoals(goals);
      await _saveProgress();
      state = state.copyWith(isSaving: false);
    } catch (e) {
      state = state.copyWith(isSaving: false, error: e.toString());
    }
  }

  // Update coach preferences
  Future<void> updateCoachPreferences(CoachPreferences preferences) async {
    state = state.copyWith(
      data: state.data.copyWith(coachPreferences: preferences),
      isSaving: true,
      clearError: true,
    );

    try {
      await _service.updateCoachPreferences(preferences);
      await _saveProgress();
      state = state.copyWith(isSaving: false);
    } catch (e) {
      state = state.copyWith(isSaving: false, error: e.toString());
    }
  }

  // Load recommended coaches
  Future<void> loadRecommendedCoaches() async {
    state = state.copyWith(isLoadingCoaches: true, clearError: true);

    try {
      final coaches = await _service.getRecommendedCoaches();
      state = state.copyWith(
        recommendedCoaches: coaches,
        isLoadingCoaches: false,
      );
    } catch (e) {
      state = state.copyWith(isLoadingCoaches: false, error: e.toString());
    }
  }

  // Update notification preferences
  void updateNotifications({
    required bool notificationsEnabled,
    required bool marketingEmailsEnabled,
  }) {
    state = state.copyWith(
      data: state.data.copyWith(
        notificationsEnabled: notificationsEnabled,
        marketingEmailsEnabled: marketingEmailsEnabled,
      ),
    );
    _saveProgress();
  }

  // Complete onboarding
  Future<bool> completeOnboarding() async {
    state = state.copyWith(isSaving: true, clearError: true);

    try {
      final completedData = state.data.copyWith(
        currentStep: OnboardingStep.completed,
        completedAt: DateTime.now(),
      );
      await _service.completeOnboarding(completedData);
      state = state.copyWith(
        data: completedData,
        isSaving: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(isSaving: false, error: e.toString());
      return false;
    }
  }

  // Skip onboarding
  Future<bool> skipOnboarding() async {
    state = state.copyWith(isSaving: true, clearError: true);

    try {
      await _service.skipOnboarding();
      state = state.copyWith(
        data: state.data.copyWith(currentStep: OnboardingStep.completed),
        isSaving: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(isSaving: false, error: e.toString());
      return false;
    }
  }

  // Upload avatar
  Future<String?> uploadAvatar(String filePath) async {
    state = state.copyWith(isSaving: true, clearError: true);

    try {
      final url = await _service.uploadAvatar(filePath);
      state = state.copyWith(
        data: state.data.copyWith(
          profile: state.data.profile.copyWith(avatarUrl: url),
        ),
        isSaving: false,
      );
      return url;
    } catch (e) {
      state = state.copyWith(isSaving: false, error: e.toString());
      return null;
    }
  }

  // Save progress locally
  Future<void> _saveProgress() async {
    try {
      await _service.saveProgress(state.data);
    } catch (_) {
      // Silently fail for local saves
    }
  }

  // Reset onboarding
  Future<void> reset() async {
    await _service.resetOnboarding();
    state = const OnboardingState();
  }

  // Clear error
  void clearError() {
    state = state.copyWith(clearError: true);
  }

  // Toggle goal selection
  void toggleGoal(CoachingGoal goal) {
    final currentGoals =
        List<CoachingGoal>.from(state.data.goals.selectedGoals);
    if (currentGoals.contains(goal)) {
      currentGoals.remove(goal);
    } else {
      currentGoals.add(goal);
    }
    state = state.copyWith(
      data: state.data.copyWith(
        goals: state.data.goals.copyWith(selectedGoals: currentGoals),
      ),
    );
    _saveProgress();
  }

  // Set experience level
  void setExperienceLevel(ExperienceLevel level) {
    state = state.copyWith(
      data: state.data.copyWith(
        goals: state.data.goals.copyWith(experienceLevel: level),
      ),
    );
    _saveProgress();
  }

  // Set commitment level
  void setCommitmentLevel(int level) {
    state = state.copyWith(
      data: state.data.copyWith(
        goals: state.data.goals.copyWith(commitmentLevel: level),
      ),
    );
    _saveProgress();
  }

  // Set session preference
  void setSessionPreference(SessionPreference preference) {
    state = state.copyWith(
      data: state.data.copyWith(
        coachPreferences: state.data.coachPreferences.copyWith(
          sessionPreference: preference,
        ),
      ),
    );
    _saveProgress();
  }

  // Toggle availability preference
  void toggleAvailability(AvailabilityPreference availability) {
    final current = List<AvailabilityPreference>.from(
      state.data.coachPreferences.availabilityPreferences,
    );
    if (current.contains(availability)) {
      current.remove(availability);
    } else {
      current.add(availability);
    }
    state = state.copyWith(
      data: state.data.copyWith(
        coachPreferences: state.data.coachPreferences.copyWith(
          availabilityPreferences: current,
        ),
      ),
    );
    _saveProgress();
  }
}

// ============================================================================
// Providers
// ============================================================================

final onboardingProvider =
    StateNotifierProvider<OnboardingNotifier, OnboardingState>((ref) {
  final service = ref.watch(onboardingServiceProvider);
  return OnboardingNotifier(service);
});

// Provider to check if onboarding is completed
final hasCompletedOnboardingProvider = FutureProvider<bool>((ref) async {
  final service = ref.watch(onboardingServiceProvider);
  return service.hasCompletedOnboarding();
});
