import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/coach_models.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/coach_booking_provider.dart';

class CoachReviewsScreen extends ConsumerStatefulWidget {
  final int coachId;
  final String? coachName;

  const CoachReviewsScreen({
    super.key,
    required this.coachId,
    this.coachName,
  });

  @override
  ConsumerState<CoachReviewsScreen> createState() => _CoachReviewsScreenState();
}

class _CoachReviewsScreenState extends ConsumerState<CoachReviewsScreen> {
  String _sortBy = 'recent';
  int? _filterRating;

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(coachDetailProvider(widget.coachId));

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.coachName != null
            ? '${widget.coachName}\'s Reviews'
            : 'Reviews'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.sort),
            onSelected: (value) {
              setState(() => _sortBy = value);
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'recent',
                child: Row(
                  children: [
                    if (_sortBy == 'recent')
                      const Icon(Icons.check, size: 18, color: AppColors.primary),
                    const SizedBox(width: 8),
                    const Text('Most Recent'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'highest',
                child: Row(
                  children: [
                    if (_sortBy == 'highest')
                      const Icon(Icons.check, size: 18, color: AppColors.primary),
                    const SizedBox(width: 8),
                    const Text('Highest Rated'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'lowest',
                child: Row(
                  children: [
                    if (_sortBy == 'lowest')
                      const Icon(Icons.check, size: 18, color: AppColors.primary),
                    const SizedBox(width: 8),
                    const Text('Lowest Rated'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Stats summary
          if (state.reviewStats != null) _buildStatsSummary(state.reviewStats!),

          // Rating filter
          _buildRatingFilter(),

          const Divider(height: 1),

          // Reviews list
          Expanded(
            child: state.isLoadingReviews && state.reviews.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : _buildReviewsList(state),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsSummary(ReviewStats stats) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.grey[50],
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    stats.averageRating.toStringAsFixed(1),
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(width: 4),
                  const Padding(
                    padding: EdgeInsets.only(bottom: 4),
                    child: Icon(Icons.star, color: Colors.amber, size: 24),
                  ),
                ],
              ),
              Text(
                '${stats.totalReviews} reviews',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
              ),
            ],
          ),
          const SizedBox(width: 24),
          Expanded(
            child: Column(
              children: [5, 4, 3, 2, 1].map((rating) {
                final count = stats.ratingDistribution['$rating'] ?? 0;
                final percentage =
                    stats.totalReviews > 0 ? count / stats.totalReviews : 0.0;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 12,
                        child: Text(
                          '$rating',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.star, size: 12, color: Colors.amber),
                      const SizedBox(width: 8),
                      Expanded(
                        child: LinearProgressIndicator(
                          value: percentage,
                          backgroundColor: Colors.grey[300],
                          valueColor: const AlwaysStoppedAnimation<Color>(
                              Colors.amber),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 30,
                        child: Text(
                          '$count',
                          style: Theme.of(context).textTheme.bodySmall,
                          textAlign: TextAlign.end,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRatingFilter() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          FilterChip(
            label: const Text('All'),
            selected: _filterRating == null,
            onSelected: (selected) {
              setState(() => _filterRating = null);
            },
          ),
          const SizedBox(width: 8),
          ...[5, 4, 3, 2, 1].map((rating) {
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('$rating'),
                    const SizedBox(width: 4),
                    const Icon(Icons.star, size: 14, color: Colors.amber),
                  ],
                ),
                selected: _filterRating == rating,
                onSelected: (selected) {
                  setState(() => _filterRating = selected ? rating : null);
                },
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildReviewsList(CoachDetailState state) {
    var reviews = state.reviews;

    // Apply filter
    if (_filterRating != null) {
      reviews = reviews.where((r) => r.rating == _filterRating).toList();
    }

    // Apply sort
    switch (_sortBy) {
      case 'highest':
        reviews.sort((a, b) => b.rating.compareTo(a.rating));
        break;
      case 'lowest':
        reviews.sort((a, b) => a.rating.compareTo(b.rating));
        break;
      case 'recent':
      default:
        reviews.sort((a, b) =>
            (b.createdAt ?? DateTime.now()).compareTo(a.createdAt ?? DateTime.now()));
    }

    if (reviews.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.rate_review, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              _filterRating != null ? 'No $_filterRating-star reviews' : 'No reviews yet',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ],
        ),
      );
    }

    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollEndNotification &&
            notification.metrics.extentAfter < 200) {
          ref.read(coachDetailProvider(widget.coachId).notifier).loadMoreReviews();
        }
        return false;
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: reviews.length + (state.isLoadingReviews ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == reviews.length) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(),
              ),
            );
          }
          return _ReviewItem(review: reviews[index]);
        },
      ),
    );
  }
}

class _ReviewItem extends StatelessWidget {
  final CoachReview review;

  const _ReviewItem({required this.review});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundImage: review.clientProfileImageUrl != null
                      ? NetworkImage(review.clientProfileImageUrl!)
                      : null,
                  child: review.clientProfileImageUrl == null
                      ? Text(
                          (review.clientName ?? 'A').substring(0, 1),
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        )
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        review.clientName ?? 'Anonymous',
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      Row(
                        children: [
                          ...List.generate(5, (index) {
                            return Icon(
                              index < review.rating
                                  ? Icons.star
                                  : Icons.star_border,
                              size: 16,
                              color: Colors.amber,
                            );
                          }),
                          const SizedBox(width: 8),
                          Text(
                            review.timeAgo,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: Colors.grey[600],
                                ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                if (review.isVerified)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.verified, size: 14, color: Colors.green),
                        SizedBox(width: 4),
                        Text(
                          'Verified',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.green,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            if (review.title != null) ...[
              const SizedBox(height: 12),
              Text(
                review.title!,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ],
            const SizedBox(height: 8),
            Text(
              review.comment,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            // Detailed ratings
            if (review.communicationRating != null ||
                review.knowledgeRating != null ||
                review.helpfulnessRating != null) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 16,
                runSpacing: 8,
                children: [
                  if (review.communicationRating != null)
                    _DetailedRating(
                      label: 'Communication',
                      rating: review.communicationRating!,
                    ),
                  if (review.knowledgeRating != null)
                    _DetailedRating(
                      label: 'Knowledge',
                      rating: review.knowledgeRating!,
                    ),
                  if (review.helpfulnessRating != null)
                    _DetailedRating(
                      label: 'Helpfulness',
                      rating: review.helpfulnessRating!,
                    ),
                ],
              ),
            ],
            // Coach response
            if (review.coachResponse != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.reply, size: 16, color: AppColors.primary),
                        const SizedBox(width: 8),
                        Text(
                          'Coach Response',
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(review.coachResponse!),
                  ],
                ),
              ),
            ],
            // Helpful buttons
            const SizedBox(height: 12),
            Row(
              children: [
                Text(
                  'Was this helpful?',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                ),
                const SizedBox(width: 12),
                OutlinedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.thumb_up_outlined, size: 16),
                  label: Text('${review.helpfulCount}'),
                  style: OutlinedButton.styleFrom(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.thumb_down_outlined, size: 16),
                  label: Text('${review.unhelpfulCount}'),
                  style: OutlinedButton.styleFrom(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailedRating extends StatelessWidget {
  final String label;
  final int rating;

  const _DetailedRating({
    required this.label,
    required this.rating,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          '$label:',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[600],
              ),
        ),
        const SizedBox(width: 4),
        ...List.generate(5, (index) {
          return Icon(
            index < rating ? Icons.star : Icons.star_border,
            size: 14,
            color: Colors.amber,
          );
        }),
      ],
    );
  }
}
