import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../shared/models/habit_model.dart';
import '../providers/habit_provider.dart';
import '../widgets/habit_card.dart';
import '../widgets/habit_stats_overview.dart';
import '../widgets/daily_habits_view.dart';
import 'create_habit_screen.dart';

class HabitsScreen extends ConsumerStatefulWidget {
  const HabitsScreen({super.key});

  @override
  ConsumerState<HabitsScreen> createState() => _HabitsScreenState();
}

class _HabitsScreenState extends ConsumerState<HabitsScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;
  HabitCategory? _selectedCategory;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final habitState = ref.watch(habitProvider);
    final habitNotifier = ref.read(habitProvider.notifier);

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        title: _isSearching
            ? TextField(
                controller: _searchController,
                decoration: const InputDecoration(
                  hintText: 'Search habits...',
                  border: InputBorder.none,
                  hintStyle: TextStyle(color: Colors.white70),
                ),
                style: const TextStyle(color: Colors.white),
                autofocus: true,
                onChanged: (value) {
                  setState(() {});
                },
              )
            : const Text('Habits'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          if (_isSearching)
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () {
                setState(() {
                  _isSearching = false;
                  _searchController.clear();
                });
              },
            )
          else
            IconButton(
              icon: const Icon(Icons.search),
              onPressed: () {
                setState(() {
                  _isSearching = true;
                });
              },
            ),
          PopupMenuButton<String>(
            onSelected: (value) {
              switch (value) {
                case 'categories':
                  _showCategoriesFilter();
                  break;
                case 'analytics':
                  _showAnalytics();
                  break;
                case 'achievements':
                  _showAchievements();
                  break;
                case 'settings':
                  _showSettings();
                  break;
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'categories',
                child: Row(
                  children: [
                    Icon(Icons.category),
                    SizedBox(width: UIConstants.spacingSM),
                    Text('Categories'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'analytics',
                child: Row(
                  children: [
                    Icon(Icons.analytics),
                    SizedBox(width: UIConstants.spacingSM),
                    Text('Analytics'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'achievements',
                child: Row(
                  children: [
                    Icon(Icons.emoji_events),
                    SizedBox(width: UIConstants.spacingSM),
                    Text('Achievements'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'settings',
                child: Row(
                  children: [
                    Icon(Icons.settings),
                    SizedBox(width: UIConstants.spacingSM),
                    Text('Settings'),
                  ],
                ),
              ),
            ],
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Today', icon: Icon(Icons.today)),
            Tab(text: 'All Habits', icon: Icon(Icons.list)),
            Tab(text: 'Statistics', icon: Icon(Icons.bar_chart)),
          ],
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Today Tab
          DailyHabitsView(
            habits: habitNotifier.getHabitsForDate(DateTime.now()),
            completions: habitState.completions,
            onHabitComplete: (habitId, value, notes, duration) {
              habitNotifier.completeHabit(
                habitId,
                value: value,
                notes: notes,
                duration: duration,
              );
            },
            onHabitUndo: (habitId) {
              habitNotifier.undoHabitCompletion(habitId);
            },
          ),

          // All Habits Tab
          Column(
            children: [
              // Category Filter
              if (_selectedCategory != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(UIConstants.spacingMD),
                  color: AppTheme.primaryColor.withOpacity(0.1),
                  child: Row(
                    children: [
                      Text(
                        'Category: ${_getCategoryName(_selectedCategory!)}',
                        style: TextStyle(
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _selectedCategory = null;
                          });
                        },
                        child: const Text('Clear Filter'),
                      ),
                    ],
                  ),
                ),

              // Error Display
              if (habitState.error != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(UIConstants.spacingMD),
                  margin: const EdgeInsets.all(UIConstants.spacingMD),
                  decoration: BoxDecoration(
                    color: Colors.red.shade100,
                    borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                    border: Border.all(color: Colors.red.shade300),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error, color: Colors.red.shade700),
                      const SizedBox(width: UIConstants.spacingSM),
                      Expanded(
                        child: Text(
                          habitState.error!,
                          style: TextStyle(color: Colors.red.shade700),
                        ),
                      ),
                    ],
                  ),
                ),

              // Habits List
              Expanded(
                child: habitState.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _buildHabitsList(habitState, habitNotifier),
              ),
            ],
          ),

          // Statistics Tab
          HabitStatsOverview(
            habits: habitState.habits,
            completions: habitState.completions,
            achievements: habitState.achievements,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.push<bool>(
            context,
            MaterialPageRoute(
              builder: (context) => const CreateHabitScreen(),
            ),
          );
          
          if (result == true) {
            habitNotifier.loadHabits();
          }
        },
        backgroundColor: AppTheme.primaryColor,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildHabitsList(HabitState habitState, HabitNotifier habitNotifier) {
    List<Habit> habits = habitState.habits;

    // Apply search filter
    if (_searchController.text.isNotEmpty) {
      habits = habitNotifier.searchHabits(_searchController.text);
    }

    // Apply category filter
    if (_selectedCategory != null) {
      habits = habits.where((habit) => habit.category == _selectedCategory).toList();
    }

    if (habits.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.track_changes,
              size: 80,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: UIConstants.spacingMD),
            Text(
              _searchController.text.isNotEmpty || _selectedCategory != null
                  ? 'No habits found'
                  : 'No habits yet',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: UIConstants.spacingSM),
            Text(
              _searchController.text.isNotEmpty || _selectedCategory != null
                  ? 'Try adjusting your search or filters'
                  : 'Tap the + button to create your first habit',
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

    return ListView.builder(
      padding: const EdgeInsets.all(UIConstants.spacingMD),
      itemCount: habits.length,
      itemBuilder: (context, index) {
        final habit = habits[index];
        return HabitCard(
          habit: habit,
          completions: habitState.completions
              .where((c) => c.habitId == habit.id)
              .toList(),
          onTap: () => _showHabitDetails(habit),
          onToggle: () => habitNotifier.toggleHabitActive(habit.id),
          onEdit: () => _editHabit(habit),
          onDelete: () => _deleteHabit(habit, habitNotifier),
        );
      },
    );
  }

  void _showCategoriesFilter() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(UIConstants.spacingMD),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Filter by Category',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: HabitCategory.values.map((category) {
                final isSelected = _selectedCategory == category;
                return FilterChip(
                  label: Text(_getCategoryName(category)),
                  selected: isSelected,
                  onSelected: (selected) {
                    setState(() {
                      _selectedCategory = selected ? category : null;
                    });
                    context.pop();
                  },
                  selectedColor: AppTheme.primaryColor.withOpacity(0.2),
                  checkmarkColor: AppTheme.primaryColor,
                );
              }).toList(),
            ),
            const SizedBox(height: UIConstants.spacingMD),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () {
                  setState(() {
                    _selectedCategory = null;
                  });
                  context.pop();
                },
                child: const Text('Clear Filter'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAnalytics() {
    // Navigate to detailed analytics screen
    context.go('/habits/analytics');
  }

  void _showAchievements() {
    // Navigate to achievements screen
    context.go('/habits/achievements');
  }

  void _showSettings() {
    // Navigate to habit settings screen
    context.go('/habits/settings');
  }

  void _showHabitDetails(Habit habit) {
    // Navigate to habit details screen
    context.go('/habits/${habit.id}/details', extra: habit);
  }

  void _editHabit(Habit habit) {
    // Navigate to edit habit screen
    context.go('/habits/${habit.id}/edit', extra: habit);
  }

  void _deleteHabit(Habit habit, HabitNotifier habitNotifier) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Habit'),
        content: Text(
          'Are you sure you want to delete "${habit.name}"? This will also delete all related data including completions and achievements. This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              final success = await habitNotifier.deleteHabit(habit.id);
              context.pop();
              
              if (success) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('${habit.name} deleted successfully'),
                    backgroundColor: Colors.green,
                  ),
                );
              }
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  String _getCategoryName(HabitCategory category) {
    switch (category) {
      case HabitCategory.health:
        return 'Health';
      case HabitCategory.fitness:
        return 'Fitness';
      case HabitCategory.productivity:
        return 'Productivity';
      case HabitCategory.mindfulness:
        return 'Mindfulness';
      case HabitCategory.learning:
        return 'Learning';
      case HabitCategory.social:
        return 'Social';
      case HabitCategory.creative:
        return 'Creative';
      case HabitCategory.financial:
        return 'Financial';
      case HabitCategory.other:
        return 'Other';
    }
  }
} 