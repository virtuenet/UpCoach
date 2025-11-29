import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:upcoach_mobile/core/theme/app_colors.dart';
import 'package:upcoach_mobile/shared/constants/ui_constants.dart';
import 'package:upcoach_mobile/shared/widgets/custom_app_bar.dart';
import 'package:upcoach_mobile/shared/widgets/loading_indicator.dart';
import '../../domain/services/ai_service.dart';
import '../../domain/models/ai_response.dart';

final recommendationsProvider = FutureProvider<List<AIRecommendation>>((ref) async {
  final aiService = ref.watch(aiServiceProvider);
  return await aiService.getRecommendations();
});

final predictionsProvider = FutureProvider<List<AIPrediction>>((ref) async {
  final aiService = ref.watch(aiServiceProvider);
  return await aiService.getPredictions();
});

class RecommendationsScreen extends ConsumerWidget {
  const RecommendationsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recommendationsAsync = ref.watch(recommendationsProvider);
    final predictionsAsync = ref.watch(predictionsProvider);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: CustomAppBar(
          title: 'AI Recommendations',
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Recommendations'),
              Tab(text: 'Predictions'),
            ],
            indicatorColor: AppColors.primary,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.textSecondary,
          ),
        ),
        body: TabBarView(
          children: [
            _buildRecommendationsTab(context, ref, recommendationsAsync),
            _buildPredictionsTab(context, ref, predictionsAsync),
          ],
        ),
      ),
    );
  }

  Widget _buildRecommendationsTab(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<List<AIRecommendation>> recommendationsAsync,
  ) {
    return recommendationsAsync.when(
      loading: () => const Center(child: LoadingIndicator()),
      error: (error, stack) => _buildError(context, error.toString()),
      data: (recommendations) => _buildRecommendationsList(context, ref, recommendations),
    );
  }

  Widget _buildPredictionsTab(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<List<AIPrediction>> predictionsAsync,
  ) {
    return predictionsAsync.when(
      loading: () => const Center(child: LoadingIndicator()),
      error: (error, stack) => _buildError(context, error.toString()),
      data: (predictions) => _buildPredictionsList(context, predictions),
    );
  }

  Widget _buildRecommendationsList(
    BuildContext context,
    WidgetRef ref,
    List<AIRecommendation> recommendations,
  ) {
    if (recommendations.isEmpty) {
      return _buildEmptyRecommendations(context);
    }

    // Group recommendations by type
    final groupedRecommendations = <String, List<AIRecommendation>>{};
    for (final rec in recommendations) {
      groupedRecommendations.putIfAbsent(rec.type, () => []).add(rec);
    }

    return RefreshIndicator(
      onRefresh: () => ref.refresh(recommendationsProvider.future),
      child: ListView.builder(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        itemCount: groupedRecommendations.length,
        itemBuilder: (context, index) {
          final type = groupedRecommendations.keys.elementAt(index);
          final items = groupedRecommendations[type]!;
          
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (index > 0) const SizedBox(height: UIConstants.spacingLG),
              _buildSectionHeader(context, type),
              const SizedBox(height: UIConstants.spacingMD),
              ...items.map((rec) => _RecommendationCard(
                recommendation: rec,
                onTap: () => _handleRecommendationTap(context, rec),
              )).toList(),
            ],
          );
        },
      ),
    );
  }

  Widget _buildPredictionsList(
    BuildContext context,
    List<AIPrediction> predictions,
  ) {
    if (predictions.isEmpty) {
      return _buildEmptyPredictions(context);
    }

    return ListView.builder(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      itemCount: predictions.length,
      itemBuilder: (context, index) {
        final prediction = predictions[index];
        return _PredictionCard(prediction: prediction);
      },
    );
  }

  Widget _buildSectionHeader(BuildContext context, String type) {
    final icon = _getIconForType(type);
    final title = _getTitleForType(type);

    return Row(
      children: [
        Icon(icon, color: AppColors.primary, size: 24),
        const SizedBox(width: UIConstants.spacingSM),
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyRecommendations(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.recommend,
            size: 80,
            color: AppColors.primary.withOpacity(0.3),
          ),
          const SizedBox(height: UIConstants.spacingMD),
          Text(
            'No Recommendations Yet',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Text(
            'Keep tracking your progress to get personalized recommendations',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyPredictions(BuildContext context) {
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
            'No Predictions Available',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: UIConstants.spacingSM),
          Text(
            'We need more data to make accurate predictions',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
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
            'Failed to load recommendations',
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

  IconData _getIconForType(String type) {
    switch (type) {
      case 'goal':
        return Icons.flag;
      case 'habit':
        return Icons.repeat;
      case 'activity':
        return Icons.directions_run;
      case 'wellness':
        return Icons.favorite;
      default:
        return Icons.lightbulb;
    }
  }

  String _getTitleForType(String type) {
    switch (type) {
      case 'goal':
        return 'Recommended Goals';
      case 'habit':
        return 'Habit Suggestions';
      case 'activity':
        return 'Activity Ideas';
      case 'wellness':
        return 'Wellness Tips';
      default:
        return 'Recommendations';
    }
  }

  void _handleRecommendationTap(BuildContext context, AIRecommendation rec) {
    switch (rec.type) {
      case 'goal':
        Navigator.pushNamed(context, '/goals/create', arguments: rec.data);
        break;
      case 'habit':
        Navigator.pushNamed(context, '/habits/create', arguments: rec.data);
        break;
      default:
        // Show details in a modal
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (context) => _RecommendationDetailSheet(recommendation: rec),
        );
    }
  }
}

class _RecommendationCard extends StatelessWidget {
  final AIRecommendation recommendation;
  final VoidCallback onTap;

  const _RecommendationCard({
    Key? key,
    required this.recommendation,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(UIConstants.spacingMD),
          child: Row(
            children: [
              Container(
                width: 8,
                height: 60,
                decoration: BoxDecoration(
                  color: _getPriorityColor(recommendation.priority),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(width: UIConstants.spacingMD),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      recommendation.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: UIConstants.spacingXS),
                    Text(
                      recommendation.description,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (recommendation.tags != null && recommendation.tags!.isNotEmpty) ...[
                      const SizedBox(height: UIConstants.spacingSM),
                      Wrap(
                        spacing: 6,
                        children: recommendation.tags!.map((tag) => Chip(
                          label: Text(tag),
                          labelStyle: const TextStyle(fontSize: 11),
                          backgroundColor: AppColors.primary.withOpacity(0.1),
                          padding: EdgeInsets.zero,
                          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        )).toList(),
                      ),
                    ],
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textSecondary),
            ],
          ),
        ),
      ),
    );
  }

  Color _getPriorityColor(double priority) {
    if (priority > 0.7) return AppColors.error;
    if (priority > 0.4) return AppColors.warning;
    return AppColors.success;
  }
}

class _PredictionCard extends StatelessWidget {
  final AIPrediction prediction;

  const _PredictionCard({
    Key? key,
    required this.prediction,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final icon = _getIconForPrediction(prediction.type);
    final color = _getColorForProbability(prediction.probability);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(UIConstants.radiusLG),
      ),
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _getPredictionTitle(prediction.type),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        prediction.description,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.spacingMD),
            Row(
              children: [
                Expanded(
                  child: LinearProgressIndicator(
                    value: prediction.probability,
                    backgroundColor: AppColors.surface,
                    valueColor: AlwaysStoppedAnimation<Color>(color),
                  ),
                ),
                const SizedBox(width: UIConstants.spacingMD),
                Text(
                  '${(prediction.probability * 100).toInt()}%',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ],
            ),
            if (prediction.factors != null && prediction.factors!.isNotEmpty) ...[
              const SizedBox(height: UIConstants.spacingMD),
              Text(
                'Key Factors:',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: UIConstants.spacingXS),
              ...prediction.factors!.map((factor) => Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Row(
                  children: [
                    const Icon(Icons.circle, size: 6, color: AppColors.textSecondary),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        factor,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
              )).toList(),
            ],
          ],
        ),
      ),
    );
  }

  IconData _getIconForPrediction(String type) {
    switch (type) {
      case 'adherence':
        return Icons.timeline;
      case 'engagement':
        return Icons.trending_up;
      case 'burnout':
        return Icons.warning;
      case 'success':
        return Icons.star;
      default:
        return Icons.insights;
    }
  }

  String _getPredictionTitle(String type) {
    switch (type) {
      case 'adherence':
        return 'Habit Adherence';
      case 'engagement':
        return 'Engagement Level';
      case 'burnout':
        return 'Burnout Risk';
      case 'success':
        return 'Success Probability';
      default:
        return 'Prediction';
    }
  }

  Color _getColorForProbability(double probability) {
    if (probability > 0.7) return AppColors.success;
    if (probability > 0.4) return AppColors.warning;
    return AppColors.error;
  }
}

class _RecommendationDetailSheet extends StatelessWidget {
  final AIRecommendation recommendation;

  const _RecommendationDetailSheet({
    Key? key,
    required this.recommendation,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
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
                recommendation.title,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: UIConstants.spacingMD),
              Text(
                recommendation.description,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: UIConstants.spacingLG),
              ElevatedButton(
                onPressed: () {
                  context.pop();
                  context.go('/ai-coach');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 48),
                ),
                child: const Text('Discuss with AI Coach'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}