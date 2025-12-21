import 'package:flutter/material.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

/// Card widget for displaying a subscription tier/package
class TierCard extends StatelessWidget {
  /// The RevenueCat package to display
  final Package package;

  /// Whether this is the user's current plan
  final bool isCurrentPlan;

  /// Whether this plan is recommended
  final bool isRecommended;

  /// Callback when the user selects this plan
  final VoidCallback? onSelect;

  const TierCard({
    super.key,
    required this.package,
    this.isCurrentPlan = false,
    this.isRecommended = false,
    this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tierInfo = _getTierInfo();

    return Card(
      elevation: isRecommended ? 4 : 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: isRecommended
            ? BorderSide(color: theme.colorScheme.primary, width: 2)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: onSelect,
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            // Main content
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header row
                  Row(
                    children: [
                      // Icon
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: tierInfo.color.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          tierInfo.icon,
                          color: tierInfo.color,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Title and subtitle
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              tierInfo.name,
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              tierInfo.tagline,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Price
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            package.storeProduct.priceString,
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                          Text(
                            _getPricePeriod(),
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Features list
                  ...tierInfo.features.map((feature) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          children: [
                            Icon(
                              Icons.check_circle,
                              size: 18,
                              color: tierInfo.color,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                feature,
                                style: theme.textTheme.bodyMedium,
                              ),
                            ),
                          ],
                        ),
                      )),

                  const SizedBox(height: 16),

                  // CTA button
                  SizedBox(
                    width: double.infinity,
                    child: _buildButton(context, tierInfo),
                  ),
                ],
              ),
            ),

            // Recommended badge
            if (isRecommended)
              Positioned(
                top: 0,
                right: 20,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary,
                    borderRadius: const BorderRadius.vertical(
                      bottom: Radius.circular(8),
                    ),
                  ),
                  child: Text(
                    'MOST POPULAR',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),

            // Current plan indicator
            if (isCurrentPlan)
              Positioned(
                top: 0,
                left: 20,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.green,
                    borderRadius: const BorderRadius.vertical(
                      bottom: Radius.circular(8),
                    ),
                  ),
                  child: Text(
                    'CURRENT PLAN',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildButton(BuildContext context, _TierInfo tierInfo) {
    final theme = Theme.of(context);

    if (isCurrentPlan) {
      return OutlinedButton(
        onPressed: null,
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text('Current Plan'),
      );
    }

    if (isRecommended) {
      return ElevatedButton(
        onPressed: onSelect,
        style: ElevatedButton.styleFrom(
          backgroundColor: theme.colorScheme.primary,
          foregroundColor: theme.colorScheme.onPrimary,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text('Get Started'),
      );
    }

    return OutlinedButton(
      onPressed: onSelect,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      child: const Text('Choose Plan'),
    );
  }

  String _getPricePeriod() {
    switch (package.packageType) {
      case PackageType.monthly:
        return '/month';
      case PackageType.annual:
        return '/year';
      case PackageType.weekly:
        return '/week';
      case PackageType.lifetime:
        return 'one-time';
      default:
        return '';
    }
  }

  _TierInfo _getTierInfo() {
    final productId = package.storeProduct.identifier.toLowerCase();

    if (productId.contains('enterprise')) {
      return _TierInfo(
        name: 'Enterprise',
        tagline: 'For organizations & teams',
        icon: Icons.business_rounded,
        color: const Color(0xFF6B46C1),
        features: [
          'Everything in Premium',
          'Custom branding',
          'API access',
          'SSO integration',
          'Dedicated support',
          'Unlimited team members',
        ],
      );
    } else if (productId.contains('premium')) {
      return _TierInfo(
        name: 'Premium',
        tagline: 'For serious coaches',
        icon: Icons.star_rounded,
        color: const Color(0xFFD69E2E),
        features: [
          'Everything in Pro',
          'Team features',
          'Priority support',
          'Advanced analytics',
          'Up to 10 coaches',
          'Unlimited goals',
        ],
      );
    } else {
      return _TierInfo(
        name: 'Pro',
        tagline: 'Perfect for individuals',
        icon: Icons.rocket_launch_rounded,
        color: const Color(0xFF3182CE),
        features: [
          'Voice journaling',
          'Progress photos',
          'Basic analytics',
          'Up to 3 coaches',
          '10 active goals',
          '25 AI chats/day',
        ],
      );
    }
  }
}

class _TierInfo {
  final String name;
  final String tagline;
  final IconData icon;
  final Color color;
  final List<String> features;

  _TierInfo({
    required this.name,
    required this.tagline,
    required this.icon,
    required this.color,
    required this.features,
  });
}

/// Compact tier card for displaying in lists
class CompactTierCard extends StatelessWidget {
  final Package package;
  final bool isSelected;
  final VoidCallback? onTap;

  const CompactTierCard({
    super.key,
    required this.package,
    this.isSelected = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tierName = _getTierName();

    return Card(
      elevation: isSelected ? 2 : 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected
              ? theme.colorScheme.primary
              : theme.colorScheme.outline.withOpacity(0.3),
          width: isSelected ? 2 : 1,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Selection indicator
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isSelected
                        ? theme.colorScheme.primary
                        : theme.colorScheme.outline,
                    width: 2,
                  ),
                  color: isSelected ? theme.colorScheme.primary : null,
                ),
                child: isSelected
                    ? Icon(
                        Icons.check,
                        size: 16,
                        color: theme.colorScheme.onPrimary,
                      )
                    : null,
              ),
              const SizedBox(width: 16),

              // Plan info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tierName,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      _getDescription(),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),

              // Price
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    package.storeProduct.priceString,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    _getPeriod(),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getTierName() {
    final productId = package.storeProduct.identifier.toLowerCase();
    if (productId.contains('enterprise')) return 'Enterprise';
    if (productId.contains('premium')) return 'Premium';
    return 'Pro';
  }

  String _getDescription() {
    final productId = package.storeProduct.identifier.toLowerCase();
    if (productId.contains('enterprise')) return 'For organizations';
    if (productId.contains('premium')) return 'Advanced features';
    return 'Essential tools';
  }

  String _getPeriod() {
    switch (package.packageType) {
      case PackageType.monthly:
        return '/mo';
      case PackageType.annual:
        return '/yr';
      default:
        return '';
    }
  }
}
