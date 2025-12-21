import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/group_session_models.dart';
import '../providers/group_session_provider.dart';
import '../widgets/session_card.dart';

/// Session Discovery Screen
/// Allows users to browse and discover group coaching sessions
class SessionDiscoveryScreen extends ConsumerStatefulWidget {
  const SessionDiscoveryScreen({super.key});

  @override
  ConsumerState<SessionDiscoveryScreen> createState() => _SessionDiscoveryScreenState();
}

class _SessionDiscoveryScreenState extends ConsumerState<SessionDiscoveryScreen> {
  final ScrollController _scrollController = ScrollController();
  String _selectedCategory = 'All';
  SessionType? _selectedType;
  bool? _filterFree;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    // Load sessions on init
    Future.microtask(() {
      ref.read(groupSessionListProvider.notifier).loadSessions(refresh: true);
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      ref.read(groupSessionListProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(groupSessionListProvider);
    final categories = ref.watch(sessionCategoriesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Group Sessions'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilters,
          ),
        ],
      ),
      body: Column(
        children: [
          // Category chips
          SizedBox(
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: categories.length,
              itemBuilder: (context, index) {
                final category = categories[index];
                final isSelected = category == _selectedCategory;

                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(category),
                    selected: isSelected,
                    onSelected: (_) {
                      setState(() => _selectedCategory = category);
                      ref.read(groupSessionListProvider.notifier).setFilter(
                        category: category == 'All' ? null : category,
                      );
                    },
                  ),
                );
              },
            ),
          ),

          // Active filters
          if (_selectedType != null || _filterFree != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  if (_selectedType != null)
                    Chip(
                      label: Text(_selectedType!.displayName),
                      onDeleted: () {
                        setState(() => _selectedType = null);
                        ref.read(groupSessionListProvider.notifier).setFilter();
                      },
                    ),
                  if (_filterFree != null)
                    Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: Chip(
                        label: Text(_filterFree! ? 'Free' : 'Paid'),
                        onDeleted: () {
                          setState(() => _filterFree = null);
                          ref.read(groupSessionListProvider.notifier).setFilter();
                        },
                      ),
                    ),
                ],
              ),
            ),

          // Sessions list
          Expanded(
            child: state.isLoading && state.sessions.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : state.error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('Error: ${state.error}'),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: () {
                                ref.read(groupSessionListProvider.notifier).loadSessions(refresh: true);
                              },
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () async {
                          await ref.read(groupSessionListProvider.notifier).loadSessions(refresh: true);
                        },
                        child: ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.all(16),
                          itemCount: state.sessions.length + (state.hasMore ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index >= state.sessions.length) {
                              return const Center(
                                child: Padding(
                                  padding: EdgeInsets.all(16),
                                  child: CircularProgressIndicator(),
                                ),
                              );
                            }

                            final session = state.sessions[index];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: SessionCard(
                                session: session,
                                onTap: () => _navigateToSession(session),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  void _showFilters() {
    showModalBottomSheet(
      context: context,
      builder: (context) => _FiltersSheet(
        selectedType: _selectedType,
        filterFree: _filterFree,
        onApply: (type, free) {
          setState(() {
            _selectedType = type;
            _filterFree = free;
          });
          ref.read(groupSessionListProvider.notifier).setFilter(
            type: type,
            isFree: free,
          );
          Navigator.pop(context);
        },
      ),
    );
  }

  void _navigateToSession(GroupSession session) {
    Navigator.pushNamed(context, '/group-session/${session.id}');
  }
}

/// Filters bottom sheet
class _FiltersSheet extends StatefulWidget {
  final SessionType? selectedType;
  final bool? filterFree;
  final void Function(SessionType? type, bool? free) onApply;

  const _FiltersSheet({
    this.selectedType,
    this.filterFree,
    required this.onApply,
  });

  @override
  State<_FiltersSheet> createState() => _FiltersSheetState();
}

class _FiltersSheetState extends State<_FiltersSheet> {
  SessionType? _type;
  bool? _free;

  @override
  void initState() {
    super.initState();
    _type = widget.selectedType;
    _free = widget.filterFree;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Filters',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          // Session type
          const Text('Session Type'),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(
                label: const Text('All'),
                selected: _type == null,
                onSelected: (_) => setState(() => _type = null),
              ),
              ...SessionType.values.map((type) => ChoiceChip(
                label: Text(type.displayName),
                selected: _type == type,
                onSelected: (_) => setState(() => _type = type),
              )),
            ],
          ),

          const SizedBox(height: 16),

          // Price filter
          const Text('Price'),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(
                label: const Text('All'),
                selected: _free == null,
                onSelected: (_) => setState(() => _free = null),
              ),
              ChoiceChip(
                label: const Text('Free'),
                selected: _free == true,
                onSelected: (_) => setState(() => _free = true),
              ),
              ChoiceChip(
                label: const Text('Paid'),
                selected: _free == false,
                onSelected: (_) => setState(() => _free = false),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Apply button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => widget.onApply(_type, _free),
              child: const Text('Apply Filters'),
            ),
          ),

          const SizedBox(height: 8),

          // Clear button
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () => widget.onApply(null, null),
              child: const Text('Clear All'),
            ),
          ),
        ],
      ),
    );
  }
}
