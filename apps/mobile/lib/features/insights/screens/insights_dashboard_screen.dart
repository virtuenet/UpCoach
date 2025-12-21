import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/insight_models.dart';
import '../providers/insights_provider.dart';
import '../widgets/index.dart';

/// Main insights dashboard screen
class InsightsDashboardScreen extends ConsumerWidget {
  const InsightsDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(insightsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Progress Insights'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            onSelected: (period) {
              ref.read(insightsProvider.notifier).setPeriod(period);
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'week', child: Text('This Week')),
              const PopupMenuItem(value: 'month', child: Text('This Month')),
              const PopupMenuItem(value: 'quarter', child: Text('This Quarter')),
              const PopupMenuItem(value: 'year', child: Text('This Year')),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.read(insightsProvider.notifier).loadInsights();
            },
          ),
        ],
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: theme.colorScheme.error,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Error loading insights',
                        style: theme.textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () {
                          ref.read(insightsProvider.notifier).loadInsights();
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () async {
                    await ref.read(insightsProvider.notifier).loadInsights();
                  },
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Overall Progress Score
                        if (state.dashboard?.summary != null)
                          OverallScoreCard(summary: state.dashboard!.summary),

                        const SizedBox(height: 20),

                        // High Priority Insights
                        _buildSectionHeader(
                          context,
                          'Key Insights',
                          Icons.lightbulb,
                        ),
                        const SizedBox(height: 12),
                        ...(state.dashboard?.insights
                                .where((i) => !i.isDismissed)
                                .take(3)
                                .map((insight) => Padding(
                                      padding: const EdgeInsets.only(bottom: 12),
                                      child: InsightCard(
                                        insight: insight,
                                        onDismiss: () {
                                          ref
                                              .read(insightsProvider.notifier)
                                              .dismissInsight(insight.id);
                                        },
                                        onAction: () {
                                          // Handle action navigation
                                          if (insight.actionRoute != null) {
                                            Navigator.pushNamed(
                                              context,
                                              insight.actionRoute!,
                                            );
                                          }
                                        },
                                      ),
                                    )) ??
                            []),

                        const SizedBox(height: 20),

                        // Weekly Performance
                        if (state.dashboard?.weeklyPerformance != null) ...[
                          _buildSectionHeader(
                            context,
                            'Weekly Performance',
                            Icons.calendar_today,
                          ),
                          const SizedBox(height: 12),
                          WeeklyPerformanceCard(
                            performance: state.dashboard!.weeklyPerformance,
                          ),
                          const SizedBox(height: 20),
                        ],

                        // Metric Trends
                        if ((state.dashboard?.trends ?? []).isNotEmpty) ...[
                          _buildSectionHeader(
                            context,
                            'Trends',
                            Icons.trending_up,
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            height: 160,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: state.dashboard!.trends.length,
                              itemBuilder: (context, index) {
                                return Padding(
                                  padding: EdgeInsets.only(
                                    right: index < state.dashboard!.trends.length - 1
                                        ? 12
                                        : 0,
                                  ),
                                  child: MetricTrendCard(
                                    trend: state.dashboard!.trends[index],
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],

                        // Goal Progress
                        if ((state.dashboard?.goals ?? []).isNotEmpty) ...[
                          _buildSectionHeader(
                            context,
                            'Goal Progress',
                            Icons.flag,
                          ),
                          const SizedBox(height: 12),
                          ...state.dashboard!.goals.map((goal) => Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: GoalProgressCard(goal: goal),
                              )),
                          const SizedBox(height: 20),
                        ],

                        // Recent Achievements
                        if ((state.dashboard?.recentAchievements ?? []).isNotEmpty) ...[
                          _buildSectionHeader(
                            context,
                            'Achievements',
                            Icons.emoji_events,
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            height: 140,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: state.dashboard!.recentAchievements.length,
                              itemBuilder: (context, index) {
                                return Padding(
                                  padding: EdgeInsets.only(
                                    right: index <
                                            state.dashboard!.recentAchievements.length - 1
                                        ? 12
                                        : 0,
                                  ),
                                  child: AchievementCard(
                                    achievement: state.dashboard!.recentAchievements[index],
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],

                        // Coaching Tips
                        if ((state.dashboard?.coachingTips ?? []).isNotEmpty) ...[
                          _buildSectionHeader(
                            context,
                            'Coaching Tips',
                            Icons.psychology,
                          ),
                          const SizedBox(height: 12),
                          ...state.dashboard!.coachingTips
                              .where((t) => !t.isDismissed)
                              .take(2)
                              .map((tip) => Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: CoachingTipCard(
                                      tip: tip,
                                      onDismiss: () {
                                        ref
                                            .read(insightsProvider.notifier)
                                            .dismissTip(tip.id);
                                      },
                                    ),
                                  )),
                        ],

                        // Comparison Summary
                        if (state.dashboard?.comparison != null) ...[
                          const SizedBox(height: 8),
                          ComparisonCard(
                            comparison: state.dashboard!.comparison,
                          ),
                        ],

                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildSectionHeader(
    BuildContext context,
    String title,
    IconData icon,
  ) {
    final theme = Theme.of(context);

    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: theme.colorScheme.primary,
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
