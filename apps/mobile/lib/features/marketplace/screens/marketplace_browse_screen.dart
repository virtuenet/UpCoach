import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/models/coach_models.dart';
import '../../../core/theme/app_colors.dart';
import '../providers/coach_booking_provider.dart';

class MarketplaceBrowseScreen extends ConsumerStatefulWidget {
  const MarketplaceBrowseScreen({super.key});

  @override
  ConsumerState<MarketplaceBrowseScreen> createState() =>
      _MarketplaceBrowseScreenState();
}

class _MarketplaceBrowseScreenState
    extends ConsumerState<MarketplaceBrowseScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(coachListProvider.notifier).loadMoreCoaches();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(coachListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Coach Marketplace'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () => context.push('/marketplace/my-sessions'),
            tooltip: 'My Sessions',
          ),
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () => _showFilters(context),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(coachListProvider.notifier).loadCoaches(refresh: true),
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            SliverToBoxAdapter(
              child: Column(
                children: [
                  _buildSearchBar(),
                  if (state.featuredCoaches.isNotEmpty)
                    _buildFeaturedSection(state.featuredCoaches),
                  if (state.filters.hasFilters)
                    _buildActiveFilters(state.filters),
                ],
              ),
            ),
            if (state.isLoading && state.coaches.isEmpty)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
            else if (state.error != null && state.coaches.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Error: ${state.error}'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => ref
                            .read(coachListProvider.notifier)
                            .loadCoaches(refresh: true),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              )
            else if (state.coaches.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.search_off, size: 64, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        'No coaches found',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Try adjusting your filters',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.grey[600],
                            ),
                      ),
                    ],
                  ),
                ),
              )
            else ...[
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverToBoxAdapter(
                  child: Text(
                    'All Coaches',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      if (index >= state.coaches.length) {
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: CircularProgressIndicator(),
                          ),
                        );
                      }
                      return _CoachCard(coach: state.coaches[index]);
                    },
                    childCount:
                        state.coaches.length + (state.isLoadingMore ? 1 : 0),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Search coaches by name, specialty...',
          prefixIcon: const Icon(Icons.search),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    ref.read(coachListProvider.notifier).search('');
                  },
                )
              : null,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          filled: true,
          fillColor: Colors.grey[100],
        ),
        onSubmitted: (value) {
          ref.read(coachListProvider.notifier).search(value);
        },
        onChanged: (value) {
          setState(() {});
        },
      ),
    );
  }

  Widget _buildFeaturedSection(List<CoachProfile> featured) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Featured Coaches',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 200,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: featured.length,
            itemBuilder: (context, index) {
              return Padding(
                padding: EdgeInsets.only(
                    right: index < featured.length - 1 ? 12 : 0),
                child: _FeaturedCoachCard(coach: featured[index]),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildActiveFilters(CoachFilters filters) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Active Filters',
                style: Theme.of(context).textTheme.titleSmall,
              ),
              TextButton(
                onPressed: () =>
                    ref.read(coachListProvider.notifier).clearFilters(),
                child: const Text('Clear All'),
              ),
            ],
          ),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (filters.specialization != null)
                _FilterChip(
                  label: filters.specialization!,
                  onRemove: () {
                    final newFilters =
                        filters.copyWith(clearSpecialization: true);
                    ref.read(coachListProvider.notifier).setFilters(newFilters);
                  },
                ),
              if (filters.minRating != null)
                _FilterChip(
                  label: '${filters.minRating}+ stars',
                  onRemove: () {
                    final newFilters = filters.copyWith(clearMinRating: true);
                    ref.read(coachListProvider.notifier).setFilters(newFilters);
                  },
                ),
              if (filters.maxPrice != null)
                _FilterChip(
                  label: 'Under \$${filters.maxPrice!.toInt()}',
                  onRemove: () {
                    final newFilters = filters.copyWith(clearMaxPrice: true);
                    ref.read(coachListProvider.notifier).setFilters(newFilters);
                  },
                ),
              if (filters.language != null)
                _FilterChip(
                  label: filters.language!,
                  onRemove: () {
                    final newFilters = filters.copyWith(clearLanguage: true);
                    ref.read(coachListProvider.notifier).setFilters(newFilters);
                  },
                ),
            ],
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  void _showFilters(BuildContext context) {
    final state = ref.read(coachListProvider);
    var tempFilters = state.filters;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.5,
          maxChildSize: 0.9,
          expand: false,
          builder: (context, scrollController) => Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Filters',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    TextButton(
                      onPressed: () {
                        setState(() => tempFilters = const CoachFilters());
                      },
                      child: const Text('Reset'),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Specialization filter
                    Text(
                      'Specialization',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Consumer(
                      builder: (context, ref, _) {
                        final specializations =
                            ref.watch(specializationsProvider);
                        return specializations.when(
                          data: (specs) => Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: specs.map((spec) {
                              final isSelected =
                                  tempFilters.specialization == spec;
                              return ChoiceChip(
                                label: Text(spec),
                                selected: isSelected,
                                onSelected: (selected) {
                                  setState(() {
                                    tempFilters = tempFilters.copyWith(
                                      specialization: selected ? spec : null,
                                      clearSpecialization: !selected,
                                    );
                                  });
                                },
                              );
                            }).toList(),
                          ),
                          loading: () => const CircularProgressIndicator(),
                          error: (_, _) => const Text('Failed to load'),
                        );
                      },
                    ),
                    const SizedBox(height: 24),

                    // Rating filter
                    Text(
                      'Minimum Rating',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: [4.0, 4.5, 4.8].map((rating) {
                        final isSelected = tempFilters.minRating == rating;
                        return ChoiceChip(
                          label: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('$rating'),
                              const Icon(Icons.star,
                                  size: 14, color: Colors.amber),
                            ],
                          ),
                          selected: isSelected,
                          onSelected: (selected) {
                            setState(() {
                              tempFilters = tempFilters.copyWith(
                                minRating: selected ? rating : null,
                                clearMinRating: !selected,
                              );
                            });
                          },
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),

                    // Price filter
                    Text(
                      'Maximum Price (per hour)',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: [50.0, 100.0, 200.0, 500.0].map((price) {
                        final isSelected = tempFilters.maxPrice == price;
                        return ChoiceChip(
                          label: Text('\$${price.toInt()}'),
                          selected: isSelected,
                          onSelected: (selected) {
                            setState(() {
                              tempFilters = tempFilters.copyWith(
                                maxPrice: selected ? price : null,
                                clearMaxPrice: !selected,
                              );
                            });
                          },
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      ref
                          .read(coachListProvider.notifier)
                          .setFilters(tempFilters);
                      Navigator.pop(context);
                    },
                    child: const Text('Apply Filters'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeaturedCoachCard extends StatelessWidget {
  final CoachProfile coach;

  const _FeaturedCoachCard({required this.coach});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/marketplace/coach/${coach.id}'),
      child: Container(
        width: 160,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius:
                      const BorderRadius.vertical(top: Radius.circular(12)),
                  child: coach.profileImageUrl != null
                      ? Image.network(
                          coach.profileImageUrl!,
                          height: 100,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        )
                      : Container(
                          height: 100,
                          color: AppColors.primary.withValues(alpha: 0.2),
                          child: Center(
                            child: Text(
                              coach.displayName.substring(0, 1),
                              style: const TextStyle(
                                  fontSize: 40, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                ),
                if (coach.isVerified)
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.verified,
                          color: Colors.blue, size: 16),
                    ),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    coach.displayName,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.star, size: 14, color: Colors.amber),
                      const SizedBox(width: 4),
                      Text(
                        coach.averageRating.toStringAsFixed(1),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const Spacer(),
                      Text(
                        coach.formattedHourlyRate,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CoachCard extends StatelessWidget {
  final CoachProfile coach;

  const _CoachCard({required this.coach});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => context.push('/marketplace/coach/${coach.id}'),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Hero(
                tag: 'coach_avatar_${coach.id}',
                child: CircleAvatar(
                  radius: 30,
                  backgroundImage: coach.profileImageUrl != null
                      ? NetworkImage(coach.profileImageUrl!)
                      : null,
                  child: coach.profileImageUrl == null
                      ? Text(
                          coach.displayName.substring(0, 1).toUpperCase(),
                          style: const TextStyle(fontSize: 24),
                        )
                      : null,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            coach.displayName,
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ),
                        if (coach.isVerified)
                          const Icon(Icons.verified,
                              color: Colors.blue, size: 18),
                      ],
                    ),
                    if (coach.title != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        coach.title!,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey[600],
                            ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 8),
                    if (coach.specializations.isNotEmpty)
                      Wrap(
                        spacing: 4,
                        runSpacing: 4,
                        children: coach.specializations.take(3).map((spec) {
                          return Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              spec,
                              style: TextStyle(
                                fontSize: 10,
                                color: AppColors.primary,
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.star, size: 16, color: Colors.amber),
                        const SizedBox(width: 4),
                        Text(
                          coach.formattedRating,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const Spacer(),
                        Text(
                          coach.formattedHourlyRate,
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primary,
                                  ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final VoidCallback onRemove;

  const _FilterChip({required this.label, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Text(label),
      onDeleted: onRemove,
      deleteIcon: const Icon(Icons.close, size: 16),
      backgroundColor: AppColors.primary.withValues(alpha: 0.1),
      labelStyle: TextStyle(color: AppColors.primary),
    );
  }
}
