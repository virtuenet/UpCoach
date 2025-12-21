import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/subscription_tier_service.dart';

/// Feature comparison table for subscription tiers
class FeatureComparisonTable extends ConsumerWidget {
  const FeatureComparisonTable({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        border: Border.all(
          color: theme.colorScheme.outline.withOpacity(0.2),
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          // Header
          _buildHeader(context),

          // Feature rows
          ..._featureRows.map((feature) => _buildFeatureRow(
                context,
                feature: feature,
              )),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(11)),
      ),
      child: Row(
        children: [
          const Expanded(
            flex: 2,
            child: Padding(
              padding: EdgeInsets.only(left: 16),
              child: Text(
                'Feature',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          _buildTierHeader(context, 'Free', Colors.grey),
          _buildTierHeader(context, 'Pro', const Color(0xFF3182CE)),
          _buildTierHeader(context, 'Premium', const Color(0xFFD69E2E)),
          _buildTierHeader(context, 'Enterprise', const Color(0xFF6B46C1)),
        ],
      ),
    );
  }

  Widget _buildTierHeader(BuildContext context, String name, Color color) {
    return Expanded(
      child: Center(
        child: Text(
          name,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: color,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureRow(
    BuildContext context, {
    required _FeatureRow feature,
  }) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: theme.colorScheme.outline.withOpacity(0.1),
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.only(left: 16),
              child: Text(
                feature.name,
                style: theme.textTheme.bodySmall,
              ),
            ),
          ),
          _buildFeatureValue(context, feature.free),
          _buildFeatureValue(context, feature.pro),
          _buildFeatureValue(context, feature.premium),
          _buildFeatureValue(context, feature.enterprise),
        ],
      ),
    );
  }

  Widget _buildFeatureValue(BuildContext context, _FeatureValue value) {
    final theme = Theme.of(context);

    Widget child;
    if (identical(value, _FeatureValue.check)) {
      child = Icon(
        Icons.check_circle,
        size: 18,
        color: Colors.green.shade600,
      );
    } else if (identical(value, _FeatureValue.cross)) {
      child = Icon(
        Icons.remove_circle_outline,
        size: 18,
        color: theme.colorScheme.outline.withOpacity(0.5),
      );
    } else if (identical(value, _FeatureValue.partial)) {
      child = Icon(
        Icons.remove,
        size: 18,
        color: Colors.orange,
      );
    } else if (value.text != null) {
      child = Text(
        value.text!,
        style: theme.textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.w500,
        ),
        textAlign: TextAlign.center,
      );
    } else {
      child = const SizedBox.shrink();
    }

    return Expanded(
      child: Center(child: child),
    );
  }

  static final List<_FeatureRow> _featureRows = [
    _FeatureRow(
      name: 'Coaches',
      free: _FeatureValue.text('1'),
      pro: _FeatureValue.text('3'),
      premium: _FeatureValue.text('10'),
      enterprise: _FeatureValue.text('Unlimited'),
    ),
    _FeatureRow(
      name: 'Goals',
      free: _FeatureValue.text('3'),
      pro: _FeatureValue.text('10'),
      premium: _FeatureValue.text('Unlimited'),
      enterprise: _FeatureValue.text('Unlimited'),
    ),
    _FeatureRow(
      name: 'AI Chats/Day',
      free: _FeatureValue.text('5'),
      pro: _FeatureValue.text('25'),
      premium: _FeatureValue.text('100'),
      enterprise: _FeatureValue.text('Unlimited'),
    ),
    _FeatureRow(
      name: 'Voice Journaling',
      free: _FeatureValue.cross,
      pro: _FeatureValue.check,
      premium: _FeatureValue.check,
      enterprise: _FeatureValue.check,
    ),
    _FeatureRow(
      name: 'Progress Photos',
      free: _FeatureValue.cross,
      pro: _FeatureValue.check,
      premium: _FeatureValue.check,
      enterprise: _FeatureValue.check,
    ),
    _FeatureRow(
      name: 'Advanced Analytics',
      free: _FeatureValue.cross,
      pro: _FeatureValue.partial,
      premium: _FeatureValue.check,
      enterprise: _FeatureValue.check,
    ),
    _FeatureRow(
      name: 'Team Features',
      free: _FeatureValue.cross,
      pro: _FeatureValue.cross,
      premium: _FeatureValue.check,
      enterprise: _FeatureValue.check,
    ),
    _FeatureRow(
      name: 'Priority Support',
      free: _FeatureValue.cross,
      pro: _FeatureValue.cross,
      premium: _FeatureValue.check,
      enterprise: _FeatureValue.check,
    ),
    _FeatureRow(
      name: 'Custom Branding',
      free: _FeatureValue.cross,
      pro: _FeatureValue.cross,
      premium: _FeatureValue.cross,
      enterprise: _FeatureValue.check,
    ),
    _FeatureRow(
      name: 'API Access',
      free: _FeatureValue.cross,
      pro: _FeatureValue.cross,
      premium: _FeatureValue.cross,
      enterprise: _FeatureValue.check,
    ),
    _FeatureRow(
      name: 'SSO Integration',
      free: _FeatureValue.cross,
      pro: _FeatureValue.cross,
      premium: _FeatureValue.cross,
      enterprise: _FeatureValue.check,
    ),
  ];
}

class _FeatureRow {
  final String name;
  final _FeatureValue free;
  final _FeatureValue pro;
  final _FeatureValue premium;
  final _FeatureValue enterprise;

  const _FeatureRow({
    required this.name,
    required this.free,
    required this.pro,
    required this.premium,
    required this.enterprise,
  });
}

class _FeatureValue {
  final String? text;

  const _FeatureValue._(this.text);

  static const check = _FeatureValue._(null);
  static const cross = _FeatureValue._(null);
  static const partial = _FeatureValue._(null);

  factory _FeatureValue.text(String value) => _FeatureValue._(value);

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! _FeatureValue) return false;
    // Check identity for special values
    if (identical(this, check) || identical(other, check)) {
      return identical(this, other);
    }
    if (identical(this, cross) || identical(other, cross)) {
      return identical(this, other);
    }
    if (identical(this, partial) || identical(other, partial)) {
      return identical(this, other);
    }
    return text == other.text;
  }

  @override
  int get hashCode => text.hashCode;
}

/// Simplified feature list for a single tier
class TierFeatureList extends StatelessWidget {
  final String tierName;
  final List<String> features;
  final List<String>? highlightedFeatures;
  final Color? accentColor;

  const TierFeatureList({
    super.key,
    required this.tierName,
    required this.features,
    this.highlightedFeatures,
    this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = accentColor ?? theme.colorScheme.primary;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: features.map((feature) {
        final isHighlighted = highlightedFeatures?.contains(feature) ?? false;

        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            children: [
              Icon(
                isHighlighted ? Icons.star : Icons.check_circle,
                size: 18,
                color: isHighlighted ? Colors.amber : color,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  feature,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: isHighlighted ? FontWeight.w600 : null,
                  ),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

/// Upgrade prompt widget
class UpgradePrompt extends StatelessWidget {
  final String feature;
  final String requiredTier;
  final VoidCallback? onUpgrade;
  final String? customMessage;

  const UpgradePrompt({
    super.key,
    required this.feature,
    required this.requiredTier,
    this.onUpgrade,
    this.customMessage,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: theme.colorScheme.primary.withOpacity(0.3),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.lock_outline,
            size: 32,
            color: theme.colorScheme.primary,
          ),
          const SizedBox(height: 12),
          Text(
            customMessage ?? '$feature requires $requiredTier or higher',
            style: theme.textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: onUpgrade,
            child: const Text('Upgrade Now'),
          ),
        ],
      ),
    );
  }
}

/// Feature gate widget - shows content or upgrade prompt
class FeatureGate extends ConsumerWidget {
  final String featureName;
  final String requiredTier;
  final Widget child;
  final Widget? lockedWidget;
  final VoidCallback? onUpgrade;

  const FeatureGate({
    super.key,
    required this.featureName,
    required this.requiredTier,
    required this.child,
    this.lockedWidget,
    this.onUpgrade,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasAccess = ref.watch(hasFeatureAccessProvider(featureName));

    return hasAccess.when(
      data: (hasFeature) {
        if (hasFeature) {
          return child;
        }
        return lockedWidget ??
            UpgradePrompt(
              feature: featureName,
              requiredTier: requiredTier,
              onUpgrade: onUpgrade,
            );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => child, // Show feature on error (fail open)
    );
  }
}

/// Provider for checking feature access
final hasFeatureAccessProvider = FutureProvider.family<bool, String>((ref, featureName) async {
  final tierService = ref.watch(subscriptionTierServiceProvider);
  return tierService.hasFeatureAccess(featureName);
});
