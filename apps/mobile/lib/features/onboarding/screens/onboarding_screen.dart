import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';
import '../providers/onboarding_provider.dart';
import 'welcome_step.dart';
import 'profile_setup_step.dart';
import 'goals_selection_step.dart';
import 'coach_matching_step.dart';
import 'notifications_step.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _goToPage(int page) {
    _pageController.animateToPage(
      page,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(onboardingProvider);
    final notifier = ref.read(onboardingProvider.notifier);

    // Listen for step changes and animate to the correct page
    ref.listen<OnboardingState>(onboardingProvider, (previous, next) {
      if (previous?.data.currentStep != next.data.currentStep) {
        final pageIndex = next.data.currentStepIndex;
        if (pageIndex < 5) {
          // Exclude 'completed' step
          _goToPage(pageIndex);
        }
      }

      // Navigate to home when onboarding is completed
      if (next.data.isCompleted) {
        context.go('/home');
      }
    });

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Progress indicator and skip button
            Padding(
              padding: const EdgeInsets.all(UIConstants.spacingMD),
              child: Row(
                children: [
                  // Back button (only show after welcome)
                  if (state.data.currentStepIndex > 0)
                    IconButton(
                      icon: const Icon(Icons.arrow_back),
                      onPressed: () => notifier.previousStep(),
                    )
                  else
                    const SizedBox(width: 48),

                  // Progress indicator
                  Expanded(
                    child: _ProgressIndicator(
                      progress: state.data.progressPercentage,
                      currentStep: state.data.currentStepIndex,
                      totalSteps: state.data.totalSteps,
                    ),
                  ),

                  // Skip button
                  TextButton(
                    onPressed: state.isSaving
                        ? null
                        : () => _showSkipDialog(context, notifier),
                    child: const Text('Skip'),
                  ),
                ],
              ),
            ),

            // Page content
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  WelcomeStep(
                    onNext: () => notifier.nextStep(),
                  ),
                  ProfileSetupStep(
                    profile: state.data.profile,
                    isSaving: state.isSaving,
                    onSave: (profile) async {
                      await notifier.updateProfile(profile);
                      notifier.nextStep();
                    },
                    onUploadAvatar: (path) => notifier.uploadAvatar(path),
                  ),
                  GoalsSelectionStep(
                    goals: state.data.goals,
                    isSaving: state.isSaving,
                    onToggleGoal: notifier.toggleGoal,
                    onSetExperienceLevel: notifier.setExperienceLevel,
                    onSetCommitmentLevel: notifier.setCommitmentLevel,
                    onNext: () async {
                      await notifier.updateGoals(state.data.goals);
                      notifier.nextStep();
                    },
                  ),
                  CoachMatchingStep(
                    preferences: state.data.coachPreferences,
                    recommendedCoaches: state.recommendedCoaches,
                    isLoadingCoaches: state.isLoadingCoaches,
                    isSaving: state.isSaving,
                    onSetSessionPreference: notifier.setSessionPreference,
                    onToggleAvailability: notifier.toggleAvailability,
                    onLoadCoaches: () => notifier.loadRecommendedCoaches(),
                    onNext: () async {
                      await notifier.updateCoachPreferences(
                        state.data.coachPreferences,
                      );
                      notifier.nextStep();
                    },
                  ),
                  NotificationsStep(
                    notificationsEnabled: state.data.notificationsEnabled,
                    marketingEmailsEnabled: state.data.marketingEmailsEnabled,
                    isSaving: state.isSaving,
                    onUpdateNotifications: notifier.updateNotifications,
                    onComplete: () async {
                      final success = await notifier.completeOnboarding();
                      if (!context.mounted) return;
                      if (success) {
                        context.go('/home');
                      }
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showSkipDialog(BuildContext context, OnboardingNotifier notifier) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Skip Onboarding?'),
        content: const Text(
          'You can always complete your profile and preferences later in Settings. '
          'However, personalized coach recommendations work better with a complete profile.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Continue Setup'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await notifier.skipOnboarding();
              if (!context.mounted) return;
              if (success) {
                context.go('/home');
              }
            },
            child: Text(
              'Skip',
              style: TextStyle(color: AppTheme.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProgressIndicator extends StatelessWidget {
  final double progress;
  final int currentStep;
  final int totalSteps;

  const _ProgressIndicator({
    required this.progress,
    required this.currentStep,
    required this.totalSteps,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          'Step ${currentStep + 1} of $totalSteps',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.textSecondary,
              ),
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: Colors.grey.withValues(alpha: 0.2),
            valueColor: AlwaysStoppedAnimation(AppTheme.primaryColor),
            minHeight: 6,
          ),
        ),
      ],
    );
  }
}
