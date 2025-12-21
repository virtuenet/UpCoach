import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

import '../../../../core/providers/entitlements_provider.dart';
import '../widgets/tier_card.dart';
import '../widgets/feature_comparison_table.dart';

/// Paywall screen for displaying subscription options
class PaywallScreen extends ConsumerStatefulWidget {
  /// Optional callback when purchase is successful
  final VoidCallback? onPurchaseSuccess;

  /// Whether to show close button
  final bool showCloseButton;

  /// Title to display on the paywall
  final String? title;

  /// Subtitle to display on the paywall
  final String? subtitle;

  const PaywallScreen({
    super.key,
    this.onPurchaseSuccess,
    this.showCloseButton = true,
    this.title,
    this.subtitle,
  });

  @override
  ConsumerState<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends ConsumerState<PaywallScreen> {
  bool _isAnnual = true;

  @override
  void initState() {
    super.initState();
    // Load offerings when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(offeringsProvider.notifier).loadOfferings();
    });
  }

  @override
  Widget build(BuildContext context) {
    final offeringsState = ref.watch(offeringsProvider);
    final purchaseState = ref.watch(purchaseProvider);
    final entitlements = ref.watch(entitlementsProvider);

    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            // Main content
            CustomScrollView(
              slivers: [
                // Header
                SliverToBoxAdapter(
                  child: _buildHeader(context),
                ),

                // Billing toggle
                SliverToBoxAdapter(
                  child: _buildBillingToggle(context),
                ),

                // Loading state
                if (offeringsState.isLoading)
                  const SliverFillRemaining(
                    child: Center(
                      child: CircularProgressIndicator(),
                    ),
                  ),

                // Error state
                if (offeringsState.errorMessage != null)
                  SliverFillRemaining(
                    child: _buildErrorState(context, offeringsState.errorMessage!),
                  ),

                // Packages
                if (!offeringsState.isLoading && offeringsState.errorMessage == null)
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate(
                        _buildPackageCards(context, offeringsState, entitlements),
                      ),
                    ),
                  ),

                // Feature comparison
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: _buildFeatureSection(context),
                  ),
                ),

                // Restore purchases button
                SliverToBoxAdapter(
                  child: _buildRestoreButton(context, purchaseState),
                ),

                // Terms and conditions
                SliverToBoxAdapter(
                  child: _buildTermsSection(context),
                ),

                // Bottom padding
                const SliverToBoxAdapter(
                  child: SizedBox(height: 40),
                ),
              ],
            ),

            // Close button
            if (widget.showCloseButton)
              Positioned(
                top: 8,
                right: 8,
                child: IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ),

            // Purchase loading overlay
            if (purchaseState.isProcessing)
              Container(
                color: Colors.black54,
                child: const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(color: Colors.white),
                      SizedBox(height: 16),
                      Text(
                        'Processing purchase...',
                        style: TextStyle(color: Colors.white, fontSize: 16),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
      child: Column(
        children: [
          // Icon or image
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.rocket_launch_rounded,
              size: 48,
              color: theme.colorScheme.primary,
            ),
          ),
          const SizedBox(height: 24),

          // Title
          Text(
            widget.title ?? 'Unlock Your Full Potential',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),

          // Subtitle
          Text(
            widget.subtitle ?? 'Choose the plan that fits your coaching journey',
            style: theme.textTheme.bodyLarge?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildBillingToggle(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: _buildToggleOption(
                context,
                label: 'Monthly',
                isSelected: !_isAnnual,
                onTap: () => setState(() => _isAnnual = false),
              ),
            ),
            Expanded(
              child: _buildToggleOption(
                context,
                label: 'Annual',
                isSelected: _isAnnual,
                onTap: () => setState(() => _isAnnual = true),
                badge: 'Save 20%',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildToggleOption(
    BuildContext context, {
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    String? badge,
  }) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? theme.colorScheme.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: TextStyle(
                color: isSelected
                    ? theme.colorScheme.onPrimary
                    : theme.colorScheme.onSurfaceVariant,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
            if (badge != null) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isSelected
                      ? theme.colorScheme.onPrimary.withOpacity(0.2)
                      : theme.colorScheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  badge,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isSelected
                        ? theme.colorScheme.onPrimary
                        : theme.colorScheme.primary,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  List<Widget> _buildPackageCards(
    BuildContext context,
    OfferingsState offeringsState,
    EntitlementsState entitlements,
  ) {
    final packages = _isAnnual
        ? offeringsState.annualPackages
        : offeringsState.monthlyPackages;

    if (packages.isEmpty) {
      return [
        const Padding(
          padding: EdgeInsets.all(32),
          child: Text(
            'No packages available',
            textAlign: TextAlign.center,
          ),
        ),
      ];
    }

    return packages.map((package) {
      final isCurrentPlan = _isPackageCurrentPlan(package, entitlements);
      final isRecommended = _isRecommendedPackage(package);

      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TierCard(
          package: package,
          isCurrentPlan: isCurrentPlan,
          isRecommended: isRecommended,
          onSelect: isCurrentPlan ? null : () => _handlePurchase(package),
        ),
      );
    }).toList();
  }

  bool _isPackageCurrentPlan(Package package, EntitlementsState entitlements) {
    final productId = package.storeProduct.identifier.toLowerCase();

    if (entitlements.currentTier == 'pro' && productId.contains('pro')) {
      return true;
    }
    if (entitlements.currentTier == 'premium' && productId.contains('premium')) {
      return true;
    }
    if (entitlements.currentTier == 'enterprise' && productId.contains('enterprise')) {
      return true;
    }
    return false;
  }

  bool _isRecommendedPackage(Package package) {
    final productId = package.storeProduct.identifier.toLowerCase();
    return productId.contains('premium');
  }

  Widget _buildErrorState(BuildContext context, String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Unable to load subscription options',
              style: Theme.of(context).textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              error,
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                ref.read(offeringsProvider.notifier).loadOfferings(forceRefresh: true);
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Compare Plans',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 16),
        const FeatureComparisonTable(),
      ],
    );
  }

  Widget _buildRestoreButton(BuildContext context, PurchaseState purchaseState) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: TextButton(
        onPressed: purchaseState.isProcessing ? null : _handleRestore,
        child: const Text('Restore Purchases'),
      ),
    );
  }

  Widget _buildTermsSection(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Column(
        children: [
          Text(
            'By subscribing, you agree to our Terms of Service and Privacy Policy. '
            'Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. '
            'You can manage your subscription in your device settings.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextButton(
                onPressed: () {
                  // Open Terms of Service
                },
                child: Text(
                  'Terms',
                  style: theme.textTheme.bodySmall,
                ),
              ),
              Text(
                ' | ',
                style: theme.textTheme.bodySmall,
              ),
              TextButton(
                onPressed: () {
                  // Open Privacy Policy
                },
                child: Text(
                  'Privacy',
                  style: theme.textTheme.bodySmall,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _handlePurchase(Package package) async {
    final success = await ref.read(purchaseProvider.notifier).purchasePackage(package);

    if (success && mounted) {
      widget.onPurchaseSuccess?.call();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Purchase successful! Welcome to your new plan.'),
          backgroundColor: Colors.green,
        ),
      );

      Navigator.of(context).pop();
    } else if (mounted) {
      final purchaseState = ref.read(purchaseProvider);

      if (!purchaseState.isCancelled && purchaseState.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(purchaseState.errorMessage!),
            backgroundColor: Colors.red,
          ),
        );
      }

      // Reset purchase state
      ref.read(purchaseProvider.notifier).reset();
    }
  }

  Future<void> _handleRestore() async {
    final success = await ref.read(purchaseProvider.notifier).restorePurchases();

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Purchases restored successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        final purchaseState = ref.read(purchaseProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(purchaseState.errorMessage ?? 'No purchases to restore'),
            backgroundColor: Colors.orange,
          ),
        );
      }

      // Reset purchase state
      ref.read(purchaseProvider.notifier).reset();
    }
  }
}

/// Show paywall as a modal bottom sheet
Future<void> showPaywallBottomSheet(
  BuildContext context, {
  VoidCallback? onPurchaseSuccess,
  String? title,
  String? subtitle,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Theme.of(context).scaffoldBackgroundColor,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (context) => DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) => PaywallScreen(
        onPurchaseSuccess: onPurchaseSuccess,
        title: title,
        subtitle: subtitle,
      ),
    ),
  );
}
