import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';
import '../models/onboarding_models.dart';

class GoalsSelectionStep extends StatelessWidget {
  final OnboardingGoals goals;
  final bool isSaving;
  final void Function(CoachingGoal) onToggleGoal;
  final void Function(ExperienceLevel) onSetExperienceLevel;
  final void Function(int) onSetCommitmentLevel;
  final VoidCallback onNext;

  const GoalsSelectionStep({
    super.key,
    required this.goals,
    required this.isSaving,
    required this.onToggleGoal,
    required this.onSetExperienceLevel,
    required this.onSetCommitmentLevel,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(UIConstants.spacingLG),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title
          Text(
            'What are your goals?',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Text(
            'Select all that apply. This helps us match you with the right coach.',
            style: TextStyle(color: AppTheme.textSecondary),
          ),

          const SizedBox(height: UIConstants.spacingLG),

          // Goals grid
          Wrap(
            spacing: UIConstants.spacingSM,
            runSpacing: UIConstants.spacingSM,
            children: CoachingGoal.values.map((goal) {
              final isSelected = goals.selectedGoals.contains(goal);
              return _GoalChip(
                goal: goal,
                isSelected: isSelected,
                onTap: () => onToggleGoal(goal),
              );
            }).toList(),
          ),

          if (goals.selectedGoals.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: UIConstants.spacingSM),
              child: Text(
                'Please select at least one goal',
                style: TextStyle(
                  color: Colors.red.shade700,
                  fontSize: 12,
                ),
              ),
            ),

          const SizedBox(height: UIConstants.spacingXL),

          // Experience level
          Text(
            'Your coaching experience',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: UIConstants.spacingMD),

          ...ExperienceLevel.values.map((level) {
            final isSelected = goals.experienceLevel == level;
            return Padding(
              padding: const EdgeInsets.only(bottom: UIConstants.spacingSM),
              child: _ExperienceLevelCard(
                level: level,
                isSelected: isSelected,
                onTap: () => onSetExperienceLevel(level),
              ),
            );
          }),

          const SizedBox(height: UIConstants.spacingLG),

          // Commitment level
          Text(
            'Your commitment level',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Text(
            'How dedicated are you to achieving your goals?',
            style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
          ),
          const SizedBox(height: UIConstants.spacingMD),

          _CommitmentSlider(
            value: goals.commitmentLevel,
            onChanged: onSetCommitmentLevel,
          ),

          const SizedBox(height: UIConstants.spacingXL),

          // Continue button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed:
                  isSaving || goals.selectedGoals.isEmpty ? null : onNext,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: isSaving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'Continue',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
            ),
          ),

          const SizedBox(height: UIConstants.spacingLG),
        ],
      ),
    );
  }
}

class _GoalChip extends StatelessWidget {
  final CoachingGoal goal;
  final bool isSelected;
  final VoidCallback onTap;

  const _GoalChip({
    required this.goal,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryColor.withValues(alpha: 0.1)
              : Colors.grey.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : Colors.transparent,
            width: 2,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(goal.icon, style: const TextStyle(fontSize: 18)),
            const SizedBox(width: 8),
            Text(
              goal.displayName,
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected ? AppTheme.primaryColor : null,
              ),
            ),
            if (isSelected) ...[
              const SizedBox(width: 4),
              Icon(
                Icons.check_circle,
                size: 16,
                color: AppTheme.primaryColor,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ExperienceLevelCard extends StatelessWidget {
  final ExperienceLevel level;
  final bool isSelected;
  final VoidCallback onTap;

  const _ExperienceLevelCard({
    required this.level,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryColor.withValues(alpha: 0.1)
              : Colors.grey.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? AppTheme.primaryColor
                : Colors.grey.withValues(alpha: 0.3),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 24,
              height: 24,
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? AppTheme.primaryColor : Colors.grey,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? Center(
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    )
                  : null,
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    level.displayName,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: isSelected ? AppTheme.primaryColor : null,
                    ),
                  ),
                  Text(
                    level.description,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CommitmentSlider extends StatelessWidget {
  final int value;
  final void Function(int) onChanged;

  const _CommitmentSlider({
    required this.value,
    required this.onChanged,
  });

  String _getCommitmentLabel(int level) {
    switch (level) {
      case 1:
        return 'Casual';
      case 2:
        return 'Moderate';
      case 3:
        return 'Committed';
      case 4:
        return 'Dedicated';
      case 5:
        return 'All-in';
      default:
        return 'Committed';
    }
  }

  String _getCommitmentDescription(int level) {
    switch (level) {
      case 1:
        return '1-2 sessions per month';
      case 2:
        return '1 session per week';
      case 3:
        return '2-3 sessions per week';
      case 4:
        return '4-5 sessions per week';
      case 5:
        return 'Daily check-ins';
      default:
        return '2-3 sessions per week';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              _getCommitmentLabel(value),
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
            ),
            Text(
              _getCommitmentDescription(value),
              style: TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 13,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SliderTheme(
          data: SliderTheme.of(context).copyWith(
            activeTrackColor: AppTheme.primaryColor,
            inactiveTrackColor: AppTheme.primaryColor.withValues(alpha: 0.2),
            thumbColor: AppTheme.primaryColor,
            overlayColor: AppTheme.primaryColor.withValues(alpha: 0.2),
          ),
          child: Slider(
            value: value.toDouble(),
            min: 1,
            max: 5,
            divisions: 4,
            onChanged: (v) => onChanged(v.toInt()),
          ),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Casual',
                style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
            Text('All-in',
                style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
          ],
        ),
      ],
    );
  }
}
