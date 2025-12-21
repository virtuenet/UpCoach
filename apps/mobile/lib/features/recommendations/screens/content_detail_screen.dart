import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/recommendation_models.dart';
import '../providers/recommendations_provider.dart';

/// Detailed view for personalized content
class ContentDetailScreen extends ConsumerStatefulWidget {
  final PersonalizedContent content;

  const ContentDetailScreen({
    super.key,
    required this.content,
  });

  @override
  ConsumerState<ContentDetailScreen> createState() =>
      _ContentDetailScreenState();
}

class _ContentDetailScreenState extends ConsumerState<ContentDetailScreen> {
  bool _isSaved = false;
  bool _isStarted = false;

  @override
  void initState() {
    super.initState();
    _isSaved = widget.content.isSaved;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final content = widget.content;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App Bar with Image
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            backgroundColor: theme.colorScheme.surface,
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.3),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back, color: Colors.white),
              ),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.3),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _isSaved ? Icons.bookmark : Icons.bookmark_border,
                    color: Colors.white,
                  ),
                ),
                onPressed: _toggleSave,
              ),
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.3),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.share, color: Colors.white),
                ),
                onPressed: _shareContent,
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      theme.colorScheme.primary,
                      theme.colorScheme.primary.withOpacity(0.7),
                    ],
                  ),
                ),
                child: Stack(
                  children: [
                    Center(
                      child: Icon(
                        _getContentTypeIcon(content.type),
                        size: 80,
                        color: Colors.white.withOpacity(0.3),
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      child: Container(
                        height: 60,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              theme.colorScheme.surface,
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Content Details
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Type and Category
                  Row(
                    children: [
                      _buildChip(
                        _getContentTypeName(content.type),
                        theme.colorScheme.primary,
                      ),
                      const SizedBox(width: 8),
                      _buildChip(
                        _getCategoryName(content.category),
                        theme.colorScheme.secondary,
                      ),
                      const SizedBox(width: 8),
                      _buildChip(
                        _getDifficultyName(content.difficulty),
                        _getDifficultyColor(content.difficulty),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Title
                  Text(
                    content.title,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Author and Stats
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 16,
                        backgroundColor: theme.colorScheme.primary,
                        child: Text(
                          content.authorName?.substring(0, 1) ?? 'A',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              content.authorName ?? 'Unknown Author',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              '${content.durationMinutes} min',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color:
                                    theme.colorScheme.onSurface.withOpacity(0.6),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (content.rating != null) ...[
                        const Icon(Icons.star, size: 16, color: Colors.amber),
                        const SizedBox(width: 4),
                        Text(
                          content.rating!.toStringAsFixed(1),
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (content.reviewCount != null) ...[
                          Text(
                            ' (${_formatNumber(content.reviewCount!)})',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color:
                                  theme.colorScheme.onSurface.withOpacity(0.6),
                            ),
                          ),
                        ],
                      ],
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Description
                  Text(
                    'About',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    content.description,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.8),
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Progress (if applicable)
                  if (content.progressPercent != null &&
                      content.progressPercent! > 0) ...[
                    _buildProgressSection(content.progressPercent!),
                    const SizedBox(height: 24),
                  ],

                  // Stats
                  _buildStatsSection(content),
                  const SizedBox(height: 24),

                  // Tags
                  if (content.tags?.isNotEmpty ?? false) ...[
                    Text(
                      'Topics',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: content.tags!
                          .map((tag) => Chip(
                                label: Text(tag),
                                backgroundColor: theme.colorScheme.surfaceContainerHighest,
                              ))
                          .toList(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Relevance Score
                  _buildRelevanceSection(content.relevanceScore),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildProgressSection(double progress) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Your Progress',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${progress.toInt()}%',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress / 100,
              minHeight: 8,
              backgroundColor: theme.colorScheme.primary.withOpacity(0.2),
              valueColor:
                  AlwaysStoppedAnimation<Color>(theme.colorScheme.primary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsSection(PersonalizedContent content) {
    final theme = Theme.of(context);
    return Row(
      children: [
        if (content.viewCount != null)
          Expanded(
            child: _buildStatItem(
              Icons.visibility_outlined,
              _formatNumber(content.viewCount!),
              'Views',
            ),
          ),
        if (content.reviewCount != null)
          Expanded(
            child: _buildStatItem(
              Icons.rate_review_outlined,
              _formatNumber(content.reviewCount!),
              'Reviews',
            ),
          ),
        Expanded(
          child: _buildStatItem(
            Icons.schedule,
            '${content.durationMinutes}',
            'Minutes',
          ),
        ),
      ],
    );
  }

  Widget _buildStatItem(IconData icon, String value, String label) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Icon(icon, color: theme.colorScheme.primary),
        const SizedBox(height: 4),
        Text(
          value,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurface.withOpacity(0.6),
          ),
        ),
      ],
    );
  }

  Widget _buildRelevanceSection(double score) {
    final theme = Theme.of(context);
    final percentage = (score * 100).toInt();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primary.withOpacity(0.1),
            theme.colorScheme.secondary.withOpacity(0.1),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.auto_awesome,
              color: theme.colorScheme.primary,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$percentage% Match for You',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Based on your goals and preferences',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    final theme = Theme.of(context);
    final hasProgress = widget.content.progressPercent != null &&
        widget.content.progressPercent! > 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            if (!_isStarted && !hasProgress)
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _toggleSave,
                  icon: Icon(_isSaved ? Icons.bookmark : Icons.bookmark_border),
                  label: Text(_isSaved ? 'Saved' : 'Save'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            if (!_isStarted && !hasProgress) const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton.icon(
                onPressed: _startContent,
                icon: Icon(hasProgress ? Icons.play_arrow : Icons.play_circle),
                label: Text(hasProgress ? 'Continue' : 'Start'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _toggleSave() {
    setState(() {
      _isSaved = !_isSaved;
    });
    ref.read(recommendationsProvider.notifier).saveContent(widget.content.id);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(_isSaved ? 'Saved to your library' : 'Removed from library'),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _shareContent() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Sharing...')),
    );
  }

  void _startContent() {
    setState(() {
      _isStarted = true;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Starting: ${widget.content.title}')),
    );
  }

  IconData _getContentTypeIcon(ContentType type) {
    switch (type) {
      case ContentType.article:
        return Icons.article;
      case ContentType.video:
        return Icons.play_circle;
      case ContentType.course:
        return Icons.school;
      case ContentType.podcast:
        return Icons.headphones;
      case ContentType.worksheet:
        return Icons.assignment;
      case ContentType.exercise:
        return Icons.fitness_center;
      case ContentType.meditation:
        return Icons.self_improvement;
      case ContentType.challenge:
        return Icons.emoji_events;
    }
  }

  String _getContentTypeName(ContentType type) {
    return type.name.substring(0, 1).toUpperCase() + type.name.substring(1);
  }

  String _getCategoryName(ContentCategory category) {
    return category.name.substring(0, 1).toUpperCase() +
        category.name.substring(1);
  }

  String _getDifficultyName(ContentDifficulty difficulty) {
    return difficulty.name.substring(0, 1).toUpperCase() +
        difficulty.name.substring(1);
  }

  Color _getDifficultyColor(ContentDifficulty difficulty) {
    switch (difficulty) {
      case ContentDifficulty.beginner:
        return Colors.green;
      case ContentDifficulty.intermediate:
        return Colors.orange;
      case ContentDifficulty.advanced:
        return Colors.red;
    }
  }

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toString();
  }
}
