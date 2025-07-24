import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:syncfusion_flutter_charts/charts.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/voice_journal_provider.dart';

class VoiceJournalStatistics extends ConsumerWidget {
  const VoiceJournalStatistics({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final voiceJournalState = ref.watch(voiceJournalProvider);
    final statistics = ref.read(voiceJournalProvider.notifier).getStatistics();
    
    if (voiceJournalState.entries.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.analytics_outlined,
              size: 80,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              'No statistics available',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Start recording voice journals to see your statistics',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Overview Cards
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  title: 'Total Entries',
                  value: statistics['totalEntries'].toString(),
                  icon: Icons.mic,
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  title: 'Total Minutes',
                  value: statistics['totalDurationMinutes'].toString(),
                  icon: Icons.access_time,
                  color: AppTheme.secondaryColor,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  title: 'Transcribed',
                  value: statistics['transcribedEntries'].toString(),
                  icon: Icons.transcribe,
                  color: Colors.green,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  title: 'Favorites',
                  value: statistics['favoriteEntries'].toString(),
                  icon: Icons.favorite,
                  color: Colors.red,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Transcription Accuracy
          if (statistics['transcribedEntries'] > 0) ...[
            const Text(
              'Transcription Quality',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _TranscriptionQualityCard(
              averageConfidence: statistics['averageConfidence'],
            ),
            const SizedBox(height: 24),
          ],
          
          // Weekly Activity Chart
          const Text(
            'Weekly Activity',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          _WeeklyActivityChart(entries: voiceJournalState.entries),
          
          const SizedBox(height: 24),
          
          // Monthly Breakdown
          const Text(
            'Monthly Breakdown',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          _MonthlyBreakdown(entries: voiceJournalState.entries),
          
          const SizedBox(height: 24),
          
          // Recent Activity
          const Text(
            'Recent Activity',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          _RecentActivity(entries: voiceJournalState.entries),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 24),
              const Spacer(),
              Text(
                value,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade700,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _TranscriptionQualityCard extends StatelessWidget {
  final double averageConfidence;

  const _TranscriptionQualityCard({
    required this.averageConfidence,
  });

  @override
  Widget build(BuildContext context) {
    final percentage = (averageConfidence * 100).round();
    final qualityText = percentage >= 90 
        ? 'Excellent' 
        : percentage >= 80 
            ? 'Good' 
            : percentage >= 70 
                ? 'Fair' 
                : 'Needs Improvement';
    
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.psychology, color: Colors.blue.shade700),
              const SizedBox(width: 8),
              Text(
                'Average Transcription Accuracy',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.blue.shade700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                '$percentage%',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue.shade700,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      qualityText,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.blue.shade700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    LinearProgressIndicator(
                      value: averageConfidence,
                      backgroundColor: Colors.blue.shade100,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.blue.shade700),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            percentage >= 80 
                ? 'Your recordings have excellent audio quality for transcription!'
                : 'Tip: Record in a quiet environment for better transcription accuracy.',
            style: TextStyle(
              fontSize: 14,
              color: Colors.blue.shade600,
            ),
          ),
        ],
      ),
    );
  }
}

class _WeeklyActivityChart extends StatelessWidget {
  final List entries;

  const _WeeklyActivityChart({required this.entries});

  @override
  Widget build(BuildContext context) {
    // Generate last 7 days data
    final now = DateTime.now();
    final weekData = List.generate(7, (index) {
      final date = now.subtract(Duration(days: 6 - index));
      final dayEntries = entries.where((entry) {
        final entryDate = entry.createdAt;
        return entryDate.year == date.year &&
               entryDate.month == date.month &&
               entryDate.day == date.day;
      }).length;
      
      return ChartData(
        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][date.weekday - 1],
        dayEntries,
      );
    });

    return Container(
      height: 200,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: SfCartesianChart(
        primaryXAxis: CategoryAxis(),
        primaryYAxis: NumericAxis(minimum: 0),
        series: <ChartSeries>[
          ColumnSeries<ChartData, String>(
            dataSource: weekData,
            xValueMapper: (ChartData data, _) => data.x,
            yValueMapper: (ChartData data, _) => data.y,
            color: AppTheme.primaryColor,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(4),
              topRight: Radius.circular(4),
            ),
          )
        ],
      ),
    );
  }
}

class _MonthlyBreakdown extends StatelessWidget {
  final List entries;

  const _MonthlyBreakdown({required this.entries});

  @override
  Widget build(BuildContext context) {
    // Calculate monthly stats
    final now = DateTime.now();
    final thisMonth = entries.where((entry) {
      return entry.createdAt.year == now.year && entry.createdAt.month == now.month;
    }).length;
    
    final lastMonth = entries.where((entry) {
      final lastMonthDate = DateTime(now.year, now.month - 1);
      return entry.createdAt.year == lastMonthDate.year && 
             entry.createdAt.month == lastMonthDate.month;
    }).length;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  children: [
                    Text(
                      thisMonth.toString(),
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                    const Text(
                      'This Month',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: 1,
                height: 40,
                color: Colors.grey.shade300,
              ),
              Expanded(
                child: Column(
                  children: [
                    Text(
                      lastMonth.toString(),
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey,
                      ),
                    ),
                    const Text(
                      'Last Month',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (lastMonth > 0)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  thisMonth > lastMonth ? Icons.trending_up : 
                  thisMonth < lastMonth ? Icons.trending_down : Icons.trending_flat,
                  color: thisMonth > lastMonth ? Colors.green : 
                         thisMonth < lastMonth ? Colors.red : Colors.grey,
                ),
                const SizedBox(width: 8),
                Text(
                  thisMonth > lastMonth 
                      ? '+${((thisMonth - lastMonth) / lastMonth * 100).round()}% from last month'
                      : thisMonth < lastMonth 
                          ? '${((thisMonth - lastMonth) / lastMonth * 100).round()}% from last month'
                          : 'Same as last month',
                  style: TextStyle(
                    color: thisMonth > lastMonth ? Colors.green : 
                           thisMonth < lastMonth ? Colors.red : Colors.grey,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _RecentActivity extends StatelessWidget {
  final List entries;

  const _RecentActivity({required this.entries});

  @override
  Widget build(BuildContext context) {
    final recentEntries = entries.take(5).toList();
    
    if (recentEntries.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: const Center(
          child: Text(
            'No recent activity',
            style: TextStyle(color: Colors.grey),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: recentEntries.map((entry) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppTheme.primaryColor,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        entry.title,
                        style: const TextStyle(
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        _formatRelativeTime(entry.createdAt),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                if (entry.isTranscribed)
                  Icon(
                    Icons.transcribe,
                    size: 16,
                    color: Colors.green.shade600,
                  ),
                if (entry.isFavorite)
                  const Icon(
                    Icons.favorite,
                    size: 16,
                    color: Colors.red,
                  ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  String _formatRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inDays}d ago';
    }
  }
}

class ChartData {
  ChartData(this.x, this.y);
  final String x;
  final int y;
} 