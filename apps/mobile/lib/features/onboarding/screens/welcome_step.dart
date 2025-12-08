import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/constants/ui_constants.dart';

class WelcomeStep extends StatelessWidget {
  final VoidCallback onNext;

  const WelcomeStep({
    super.key,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(UIConstants.spacingLG),
      child: Column(
        children: [
          const Spacer(),

          // Logo/Illustration
          Container(
            width: 150,
            height: 150,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.psychology,
              size: 80,
              color: AppTheme.primaryColor,
            ),
          ),

          const SizedBox(height: UIConstants.spacingXL),

          // Welcome text
          Text(
            'Welcome to UpCoach',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: UIConstants.spacingMD),

          Text(
            'Your personal coaching journey starts here. '
            'Let\'s set up your profile to match you with the perfect coach.',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppTheme.textSecondary,
                ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: UIConstants.spacingXL),

          // Features list
          _FeatureItem(
            icon: Icons.person_search,
            title: 'Personalized Matching',
            description: 'Find coaches who align with your goals',
          ),
          const SizedBox(height: UIConstants.spacingMD),
          _FeatureItem(
            icon: Icons.video_call,
            title: 'Flexible Sessions',
            description: 'Video, audio, or chat - your choice',
          ),
          const SizedBox(height: UIConstants.spacingMD),
          _FeatureItem(
            icon: Icons.trending_up,
            title: 'Track Progress',
            description: 'Monitor your growth and achievements',
          ),

          const Spacer(),

          // Get Started button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onNext,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'Get Started',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ),

          const SizedBox(height: UIConstants.spacingMD),
        ],
      ),
    );
  }
}

class _FeatureItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _FeatureItem({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: AppTheme.primaryColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppTheme.primaryColor),
        ),
        const SizedBox(width: UIConstants.spacingMD),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
              Text(
                description,
                style: TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
