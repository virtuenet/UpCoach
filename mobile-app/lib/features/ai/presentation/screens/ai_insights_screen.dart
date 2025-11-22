import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:upcoach/core/theme/app_colors.dart';
import 'package:upcoach/shared/widgets/custom_app_bar.dart';
import 'package:upcoach/shared/widgets/loading_indicator.dart';
import '../../domain/services/ai_service.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:upcoach/core/config/secure_config.dart';

final activeInsightsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final aiService = ref.watch(aiServiceProvider);
  return await aiService.getActiveInsights();
});

/// Provider for checking RevenueCat entitlements
final aiInsightsEntitlementProvider = FutureProvider<bool>((ref) async {
  try {
    // Check if RevenueCat is configured
    final rcKey = SecureConfig.instance.revenuecatKeyOptional;
    if (rcKey == null || rcKey.isEmpty) {
      // RevenueCat not configured, allow access (fallback to free tier)
      return true;
    }

    // Check customer info for AI insights entitlement
    final customerInfo = await Purchases.getCustomerInfo();

    // Check for premium entitlement (adjust entitlement identifier as needed)
    // Common patterns: 'premium', 'pro', 'ai_insights', 'upcoach_plus'
    const entitlementIds = ['premium', 'pro', 'ai_insights', 'upcoach_plus'];
    return entitlementIds.any((id) => customerInfo.entitlements.active.containsKey(id));
  } catch (e) {
    // On error, default to allowing access (fail-safe for premium features)
    // In production, you might want to log this error
    return true;
  }
});

class AIInsightsScreen extends ConsumerWidget {
  const AIInsightsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // RevenueCat gating: if user lacks entitlement, show paywall button
    // Keys/products must be configured in runtime env; this is a soft gate
    final entitlementAsync = ref.watch(aiInsightsEntitlementProvider);
    final insightsAsync = ref.watch(activeInsightsProvider);

    return entitlementAsync.when(
      loading: () => const Scaffold(
        body: Center(child: LoadingIndicator()),
      ),
      error: (error, stack) => _buildError(context, 'Failed to check entitlements: $error'),
      data: (hasEntitlement) => Scaffold(
        backgroundColor: AppColors.background,
        appBar: const CustomAppBar(title: 'AI Insights'),
        body: hasEntitlement
            ? insightsAsync.when(
                loading: () => const Center(child: LoadingIndicator()),
                error: (error, stack) => _buildError(context, error.toString()),
                data: (insights) => _buildInsightsList(context, ref, insights),
              )
            : _buildPaywall(context),
      ),
    );
  }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CustomAppBar(title: 'AI Insights'),
      body: hasEntitlement
          ? insightsAsync.when(
        loading: () => const Center(child: LoadingIndicator()),
        error: (error, stack) => _buildError(context, error.toString()),
        data: (insights) => _buildInsightsList(context, ref, insights),
          )
          : _buildPaywall(context),
    );
  }

  Widget _buildPaywall(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.lock, size: 64, color: AppColors.textSecondary),
          const SizedBox(height: 16),
          Text(
            'AI Insights is a premium feature',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          const Text('Unlock with UpCoach Plus to continue'),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () async {
              try {
                // This requires configuration of RevenueCat keys in app startup
                await Purchases.presentPaywall();
              } catch (_) {}
            },
            icon: const Icon(Icons.workspace_premium),
            label: const Text('View Plans'),
          ),
        ],
      ),
    );
  }

  Widget _buildInsightsList(BuildContext context, WidgetRef ref, List<Map<String, dynamic>> insights) {
    if (insights.isEmpty) {
      return _buildEmptyState(context);
    }

    return RefreshIndicator(
      onRefresh: () => ref.refresh(activeInsightsProvider.future),
      child: ListView.builder(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        itemCount: insights.length,
        itemBuilder: (context, index) {
          final insight = insights[index];
          return _InsightCard(
            insight: insight,
            onDismiss: () => _dismissInsight(ref, insight['id']),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.insights,
            size: 80,
            color: AppColors.primary.withOpacity(0.3),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          Text(
            'No Active Insights',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Text(
            'Check back later for personalized insights',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildError(BuildContext context, String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 60,
            color: AppColors.error,
          ),
          const SizedBox(height: UIConstants.spacingMD),
          Text(
            'Failed to load insights',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Text(
            error,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Future<void> _dismissInsight(WidgetRef ref, String insightId) async {
    final aiService = ref.read(aiServiceProvider);
    await aiService.dismissInsight(insightId);
    ref.invalidate(activeInsightsProvider);
  }
}

class _InsightCard extends StatelessWidget {
  final Map<String, dynamic> insight;
  final VoidCallback onDismiss;

  const _InsightCard({
    Key? key,
    required this.insight,
    required this.onDismiss,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final type = insight['type'] ?? 'general';
    final icon = _getIconForType(type);
    final color = _getColorForType(type);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        onTap: () => _showInsightDetails(context),
        child: Padding(
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(UIConstants.spacingSM),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                    ),
                    child: Icon(icon, color: color, size: 24),
                  ),
                  const SizedBox(width: UIConstants.spacingMD),
                  Expanded(
                    child: Text(
                      insight['title'] ?? 'Insight',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: onDismiss,
                    color: AppColors.textSecondary,
                  ),
                ],
              ),
              const SizedBox(height: UIConstants.spacingMD),
              Text(
                insight['description'] ?? '',
                style: Theme.of(context).textTheme.bodyMedium,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if (insight['actionItems'] != null && 
                  (insight['actionItems'] as List).isNotEmpty) ...[
                const SizedBox(height: UIConstants.spacingMD),
                Row(
                  children: [
                    Icon(
                      Icons.lightbulb_outline,
                      size: 16,
                      color: AppColors.warning,
                    ),
                    const SizedBox(width: UIConstants.spacingXS),
                    Text(
                      '${(insight['actionItems'] as List).length} action items',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.warning,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'goal':
        return Icons.flag;
      case 'habit':
        return Icons.repeat;
      case 'wellness':
        return Icons.favorite;
      case 'progress':
        return Icons.trending_up;
      case 'warning':
        return Icons.warning;
      default:
        return Icons.lightbulb;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'goal':
        return AppColors.success;
      case 'habit':
        return AppColors.primary;
      case 'wellness':
        return AppColors.error;
      case 'progress':
        return AppColors.info;
      case 'warning':
        return AppColors.warning;
      default:
        return AppColors.secondary;
    }
  }

  void _showInsightDetails(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          padding: const EdgeInsets.all(UIConstants.spacingLG),
          child: SingleChildScrollView(
            controller: scrollController,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: UIConstants.spacingLG),
                Text(
                  insight['title'] ?? 'Insight',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: UIConstants.spacingMD),
                Text(
                  insight['description'] ?? '',
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                if (insight['actionItems'] != null) ...[
                  const SizedBox(height: UIConstants.spacingLG),
                  Text(
                    'Action Items',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: UIConstants.spacingMD),
                  ...(insight['actionItems'] as List).map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.check_circle_outline, size: 20),
                        const SizedBox(width: UIConstants.spacingSM),
                        Expanded(
                          child: Text(
                            item.toString(),
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ),
                      ],
                    ),
                  )).toList(),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}