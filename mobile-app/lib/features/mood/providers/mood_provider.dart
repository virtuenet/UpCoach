import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/mood_service.dart';
import '../../../shared/models/mood_model.dart';

// Mood Service Provider
final moodServiceProvider = Provider<MoodService>((ref) {
  return MoodService();
});

// Mood State
class MoodState {
  final List<MoodModel> moodEntries;
  final bool isLoading;
  final String? error;
  final Map<String, dynamic>? stats;
  final Map<String, dynamic>? insights;
  final DateTime selectedDate;

  const MoodState({
    this.moodEntries = const [],
    this.isLoading = false,
    this.error,
    this.stats,
    this.insights,
    required this.selectedDate,
  });

  MoodState copyWith({
    List<MoodModel>? moodEntries,
    bool? isLoading,
    String? error,
    Map<String, dynamic>? stats,
    Map<String, dynamic>? insights,
    DateTime? selectedDate,
  }) {
    return MoodState(
      moodEntries: moodEntries ?? this.moodEntries,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      stats: stats ?? this.stats,
      insights: insights ?? this.insights,
      selectedDate: selectedDate ?? this.selectedDate,
    );
  }

  MoodModel? get todaysMood {
    final today = DateTime.now();
    try {
      return moodEntries.firstWhere(
        (mood) =>
            mood.timestamp.year == today.year &&
            mood.timestamp.month == today.month &&
            mood.timestamp.day == today.day,
      );
    } catch (e) {
      return null;
    }
  }

  List<MoodModel> get weekMoods {
    final now = DateTime.now();
    final weekStart = now.subtract(Duration(days: now.weekday - 1));
    return moodEntries.where((mood) {
      return mood.timestamp.isAfter(weekStart.subtract(const Duration(days: 1)));
    }).toList()
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
  }

  List<MoodModel> get monthMoods {
    final now = DateTime.now();
    final monthStart = DateTime(now.year, now.month, 1);
    return moodEntries.where((mood) {
      return mood.timestamp.isAfter(monthStart.subtract(const Duration(days: 1)));
    }).toList()
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
  }

  double get averageMoodLevel {
    if (moodEntries.isEmpty) return 3.0;
    final sum = moodEntries.fold<int>(
      0,
      (sum, mood) => sum + mood.level.index + 1,
    );
    return sum / moodEntries.length;
  }
}

// Mood Provider
class MoodNotifier extends StateNotifier<MoodState> {
  final MoodService _moodService;

  MoodNotifier(this._moodService) : super(MoodState(selectedDate: DateTime.now())) {
    loadMoodEntries();
    loadStats();
    loadInsights();
  }

  Future<void> loadMoodEntries({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // Default to last 30 days if no dates provided
      final end = endDate ?? DateTime.now();
      final start = startDate ?? end.subtract(const Duration(days: 30));

      final moodEntries = await _moodService.getMoodEntries(
        startDate: start,
        endDate: end,
      );

      state = state.copyWith(
        moodEntries: moodEntries,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
    }
  }

  Future<void> loadStats() async {
    try {
      final stats = await _moodService.getMoodStats();
      state = state.copyWith(stats: stats);
    } catch (e) {
      // Stats are optional, don't show error
    }
  }

  Future<void> loadInsights() async {
    try {
      final insights = await _moodService.getMoodInsights();
      state = state.copyWith(insights: insights);
    } catch (e) {
      // Insights are optional, don't show error
    }
  }

  Future<void> createMoodEntry({
    required MoodLevel level,
    List<MoodCategory>? categories,
    String? note,
    List<String>? activities,
  }) async {
    try {
      // Create optimistic mood entry
      final tempMood = _moodService.createTemporaryMoodEntry(
        level: level,
        categories: categories,
        note: note,
        activities: activities,
      );

      state = state.copyWith(
        moodEntries: [tempMood, ...state.moodEntries],
      );

      // Create real mood entry
      final mood = await _moodService.createMoodEntry(
        level: level,
        categories: categories,
        note: note,
        activities: activities,
      );

      // Replace temporary mood with real mood
      final updatedMoods = state.moodEntries.map((m) {
        return m.id == tempMood.id ? mood : m;
      }).toList();

      state = state.copyWith(moodEntries: updatedMoods);
      
      // Reload stats and insights
      await loadStats();
      await loadInsights();
    } catch (e) {
      // Remove temporary mood on error
      final updatedMoods = state.moodEntries.where((m) => m.userId != 'temp').toList();
      state = state.copyWith(
        moodEntries: updatedMoods,
        error: e.toString(),
      );
    }
  }

  Future<void> updateMoodEntry({
    required String moodId,
    MoodLevel? level,
    List<MoodCategory>? categories,
    String? note,
    List<String>? activities,
  }) async {
    try {
      final updatedMood = await _moodService.updateMoodEntry(
        moodId: moodId,
        level: level,
        categories: categories,
        note: note,
        activities: activities,
      );

      final updatedMoods = state.moodEntries.map((mood) {
        return mood.id == moodId ? updatedMood : mood;
      }).toList();

      state = state.copyWith(moodEntries: updatedMoods);
      
      // Reload stats and insights
      await loadStats();
      await loadInsights();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> deleteMoodEntry(String moodId) async {
    try {
      await _moodService.deleteMoodEntry(moodId);
      
      final updatedMoods = state.moodEntries.where((m) => m.id != moodId).toList();
      state = state.copyWith(moodEntries: updatedMoods);
      
      // Reload stats and insights
      await loadStats();
      await loadInsights();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  void setSelectedDate(DateTime date) {
    state = state.copyWith(selectedDate: date);
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final moodProvider = StateNotifierProvider<MoodNotifier, MoodState>((ref) {
  final moodService = ref.watch(moodServiceProvider);
  return MoodNotifier(moodService);
}); 