import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';
import '../models/onboarding_models.dart';

class CoachMatchingStep extends StatefulWidget {
  final CoachPreferences preferences;
  final List<RecommendedCoach> recommendedCoaches;
  final bool isLoadingCoaches;
  final bool isSaving;
  final void Function(SessionPreference) onSetSessionPreference;
  final void Function(AvailabilityPreference) onToggleAvailability;
  final VoidCallback onLoadCoaches;
  final VoidCallback onNext;

  const CoachMatchingStep({
    super.key,
    required this.preferences,
    required this.recommendedCoaches,
    required this.isLoadingCoaches,
    required this.isSaving,
    required this.onSetSessionPreference,
    required this.onToggleAvailability,
    required this.onLoadCoaches,
    required this.onNext,
  });

  @override
  State<CoachMatchingStep> createState() => _CoachMatchingStepState();
}

class _CoachMatchingStepState extends State<CoachMatchingStep> {
  @override
  void initState() {
    super.initState();
    // Load recommended coaches when this step is displayed
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onLoadCoaches();
    });
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(UIConstants.spacingLG),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title
          Text(
            'Coach Preferences',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Text(
            'Help us find your ideal coach by sharing your preferences.',
            style: TextStyle(color: AppTheme.textSecondary),
          ),

          const SizedBox(height: UIConstants.spacingXL),

          // Session type preference
          Text(
            'Preferred session type',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: UIConstants.spacingMD),

          Wrap(
            spacing: UIConstants.spacingSM,
            runSpacing: UIConstants.spacingSM,
            children: SessionPreference.values.map((pref) {
              final isSelected = widget.preferences.sessionPreference == pref;
              return _SessionTypeChip(
                preference: pref,
                isSelected: isSelected,
                onTap: () => widget.onSetSessionPreference(pref),
              );
            }).toList(),
          ),

          const SizedBox(height: UIConstants.spacingXL),

          // Availability preferences
          Text(
            'When are you available?',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Text(
            'Select all that apply',
            style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
          ),
          const SizedBox(height: UIConstants.spacingMD),

          Wrap(
            spacing: UIConstants.spacingSM,
            runSpacing: UIConstants.spacingSM,
            children: AvailabilityPreference.values.map((avail) {
              final isSelected =
                  widget.preferences.availabilityPreferences.contains(avail);
              return _AvailabilityChip(
                availability: avail,
                isSelected: isSelected,
                onTap: () => widget.onToggleAvailability(avail),
              );
            }).toList(),
          ),

          const SizedBox(height: UIConstants.spacingXL),

          // Recommended coaches preview
          Text(
            'Recommended for you',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Text(
            'Based on your goals and preferences',
            style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
          ),
          const SizedBox(height: UIConstants.spacingMD),

          if (widget.isLoadingCoaches)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(),
              ),
            )
          else if (widget.recommendedCoaches.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(UIConstants.spacingMD),
                child: Column(
                  children: [
                    Icon(
                      Icons.search,
                      size: 48,
                      color: AppTheme.textSecondary.withValues(alpha: 0.5),
                    ),
                    const SizedBox(height: UIConstants.spacingSM),
                    Text(
                      'Finding the best coaches for you...',
                      style: TextStyle(color: AppTheme.textSecondary),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: UIConstants.spacingSM),
                    TextButton(
                      onPressed: widget.onLoadCoaches,
                      child: const Text('Refresh'),
                    ),
                  ],
                ),
              ),
            )
          else
            SizedBox(
              height: 180,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: widget.recommendedCoaches.length,
                separatorBuilder: (_, __) =>
                    const SizedBox(width: UIConstants.spacingMD),
                itemBuilder: (context, index) {
                  final coach = widget.recommendedCoaches[index];
                  return _RecommendedCoachCard(coach: coach);
                },
              ),
            ),

          const SizedBox(height: UIConstants.spacingXL),

          // Continue button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: widget.isSaving ? null : widget.onNext,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: widget.isSaving
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

          const SizedBox(height: UIConstants.spacingMD),

          Center(
            child: Text(
              'You can browse more coaches after setup',
              style: TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 12,
              ),
            ),
          ),

          const SizedBox(height: UIConstants.spacingLG),
        ],
      ),
    );
  }
}

class _SessionTypeChip extends StatelessWidget {
  final SessionPreference preference;
  final bool isSelected;
  final VoidCallback onTap;

  const _SessionTypeChip({
    required this.preference,
    required this.isSelected,
    required this.onTap,
  });

  IconData _getIcon() {
    switch (preference) {
      case SessionPreference.video:
        return Icons.videocam;
      case SessionPreference.audio:
        return Icons.call;
      case SessionPreference.chat:
        return Icons.chat;
      case SessionPreference.any:
        return Icons.all_inclusive;
    }
  }

  String _getLabel() {
    switch (preference) {
      case SessionPreference.video:
        return 'Video';
      case SessionPreference.audio:
        return 'Audio';
      case SessionPreference.chat:
        return 'Chat';
      case SessionPreference.any:
        return 'Any';
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryColor.withValues(alpha: 0.1)
              : Colors.grey.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : Colors.transparent,
            width: 2,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _getIcon(),
              size: 20,
              color:
                  isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
            ),
            const SizedBox(width: 8),
            Text(
              _getLabel(),
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected ? AppTheme.primaryColor : null,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AvailabilityChip extends StatelessWidget {
  final AvailabilityPreference availability;
  final bool isSelected;
  final VoidCallback onTap;

  const _AvailabilityChip({
    required this.availability,
    required this.isSelected,
    required this.onTap,
  });

  String _getLabel() {
    switch (availability) {
      case AvailabilityPreference.morning:
        return 'Morning';
      case AvailabilityPreference.afternoon:
        return 'Afternoon';
      case AvailabilityPreference.evening:
        return 'Evening';
      case AvailabilityPreference.weekend:
        return 'Weekends';
      case AvailabilityPreference.flexible:
        return 'Flexible';
    }
  }

  String _getTimeHint() {
    switch (availability) {
      case AvailabilityPreference.morning:
        return '6am-12pm';
      case AvailabilityPreference.afternoon:
        return '12pm-5pm';
      case AvailabilityPreference.evening:
        return '5pm-10pm';
      case AvailabilityPreference.weekend:
        return 'Sat-Sun';
      case AvailabilityPreference.flexible:
        return 'Anytime';
    }
  }

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
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : Colors.transparent,
            width: 2,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _getLabel(),
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected ? AppTheme.primaryColor : null,
              ),
            ),
            Text(
              _getTimeHint(),
              style: TextStyle(
                fontSize: 10,
                color: isSelected
                    ? AppTheme.primaryColor.withValues(alpha: 0.7)
                    : AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RecommendedCoachCard extends StatelessWidget {
  final RecommendedCoach coach;

  const _RecommendedCoachCard({required this.coach});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: 160,
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Avatar
            CircleAvatar(
              radius: 32,
              backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.1),
              backgroundImage: coach.profileImageUrl != null
                  ? NetworkImage(coach.profileImageUrl!)
                  : null,
              child: coach.profileImageUrl == null
                  ? Text(
                      coach.displayName.isNotEmpty
                          ? coach.displayName[0].toUpperCase()
                          : 'C',
                      style: TextStyle(
                        fontSize: 24,
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.bold,
                      ),
                    )
                  : null,
            ),

            const SizedBox(height: UIConstants.spacingSM),

            // Name
            Text(
              coach.displayName,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),

            // Specialization
            if (coach.specializations.isNotEmpty)
              Text(
                coach.specializations.first,
                style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),

            const Spacer(),

            // Rating
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.star, size: 14, color: Colors.amber),
                const SizedBox(width: 4),
                Text(
                  coach.averageRating.toStringAsFixed(1),
                  style: const TextStyle(fontSize: 12),
                ),
                Text(
                  ' (${coach.totalSessions})',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),

            // Match score
            if (coach.matchScore > 0)
              Container(
                margin: const EdgeInsets.only(top: 8),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.green.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${coach.matchScore.toInt()}% match',
                  style: const TextStyle(
                    fontSize: 10,
                    color: Colors.green,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
