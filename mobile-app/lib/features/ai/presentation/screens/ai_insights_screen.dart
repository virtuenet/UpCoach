import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:upcoach/core/theme/app_colors.dart';
import 'package:upcoach/shared/widgets/custom_app_bar.dart';
import 'package:upcoach/shared/widgets/loading_indicator.dart';
import '../../domain/services/ai_service.dart';

final activeInsightsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final aiService = ref.watch(aiServiceProvider);
  return await aiService.getActiveInsights();
});

class AIInsightsScreen extends ConsumerWidget {
  const AIInsightsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final insightsAsync = ref.watch(activeInsightsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CustomAppBar(title: 'AI Insights'),
      body: insightsAsync.when(
        loading: () => const Center(child: LoadingIndicator()),
        error: (error, stack) => _buildError(context, error.toString()),
        data: (insights) => _buildInsightsList(context, ref, insights),
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
        padding: const EdgeInsets.all(16),
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
          const SizedBox(height: 16),
          Text(
            'No Active Insights',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
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
          const SizedBox(height: 16),
          Text(
            'Failed to load insights',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
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
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _showInsightDetails(context),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(icon, color: color, size: 24),
                  ),
                  const SizedBox(width: 12),
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
              const SizedBox(height: 12),
              Text(
                insight['description'] ?? '',
                style: Theme.of(context).textTheme.bodyMedium,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if (insight['actionItems'] != null && 
                  (insight['actionItems'] as List).isNotEmpty) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(
                      Icons.lightbulb_outline,
                      size: 16,
                      color: AppColors.warning,
                    ),
                    const SizedBox(width: 4),
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
          padding: const EdgeInsets.all(24),
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
                const SizedBox(height: 24),
                Text(
                  insight['title'] ?? 'Insight',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 16),
                Text(
                  insight['description'] ?? '',
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                if (insight['actionItems'] != null) ...[
                  const SizedBox(height: 24),
                  Text(
                    'Action Items',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  ...(insight['actionItems'] as List).map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.check_circle_outline, size: 20),
                        const SizedBox(width: 8),
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