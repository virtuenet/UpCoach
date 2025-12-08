import 'package:flutter_riverpod/flutter_riverpod.dart';

// Forum Categories
class ForumCategory {
  final String id;
  final String name;
  final String description;
  final String icon;
  final int threadCount;
  final int memberCount;

  const ForumCategory({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    this.threadCount = 0,
    this.memberCount = 0,
  });
}

// Forum Thread
class ForumThread {
  final String id;
  final String categoryId;
  final String title;
  final String content;
  final String authorId;
  final String authorName;
  final String? authorAvatar;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final int replyCount;
  final int viewCount;
  final bool isPinned;
  final bool isLocked;
  final List<String> tags;

  const ForumThread({
    required this.id,
    required this.categoryId,
    required this.title,
    required this.content,
    required this.authorId,
    required this.authorName,
    this.authorAvatar,
    required this.createdAt,
    this.updatedAt,
    this.replyCount = 0,
    this.viewCount = 0,
    this.isPinned = false,
    this.isLocked = false,
    this.tags = const [],
  });
}

// Activity Feed Item
class ActivityFeedItem {
  final String id;
  final String type;
  final String userId;
  final String userName;
  final String? userAvatar;
  final String content;
  final DateTime createdAt;
  final Map<String, dynamic>? metadata;

  const ActivityFeedItem({
    required this.id,
    required this.type,
    required this.userId,
    required this.userName,
    this.userAvatar,
    required this.content,
    required this.createdAt,
    this.metadata,
  });
}

// Forum State
class ForumState {
  final List<ForumCategory> categories;
  final List<ForumThread> threads;
  final List<ActivityFeedItem> activityFeed;
  final bool isLoading;
  final String? error;
  final String? selectedCategoryId;

  const ForumState({
    this.categories = const [],
    this.threads = const [],
    this.activityFeed = const [],
    this.isLoading = false,
    this.error,
    this.selectedCategoryId,
  });

  ForumState copyWith({
    List<ForumCategory>? categories,
    List<ForumThread>? threads,
    List<ActivityFeedItem>? activityFeed,
    bool? isLoading,
    String? error,
    String? selectedCategoryId,
  }) {
    return ForumState(
      categories: categories ?? this.categories,
      threads: threads ?? this.threads,
      activityFeed: activityFeed ?? this.activityFeed,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedCategoryId: selectedCategoryId ?? this.selectedCategoryId,
    );
  }
}

// Forum Notifier
class ForumNotifier extends StateNotifier<ForumState> {
  ForumNotifier() : super(const ForumState());

  Future<void> loadCategories() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // TODO: Implement API call
      await Future.delayed(const Duration(milliseconds: 500));
      state = state.copyWith(
        isLoading: false,
        categories: [
          const ForumCategory(
            id: '1',
            name: 'General Discussion',
            description: 'Talk about anything related to personal development',
            icon: 'chat',
            threadCount: 150,
            memberCount: 500,
          ),
          const ForumCategory(
            id: '2',
            name: 'Goal Setting',
            description: 'Share and discuss your goals',
            icon: 'flag',
            threadCount: 89,
            memberCount: 320,
          ),
          const ForumCategory(
            id: '3',
            name: 'Habits & Routines',
            description: 'Build better habits together',
            icon: 'repeat',
            threadCount: 67,
            memberCount: 280,
          ),
        ],
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> loadThreads(String categoryId) async {
    state = state.copyWith(
        isLoading: true, error: null, selectedCategoryId: categoryId);
    try {
      // TODO: Implement API call
      await Future.delayed(const Duration(milliseconds: 500));
      state = state.copyWith(isLoading: false, threads: []);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> loadActivityFeed() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // TODO: Implement API call
      await Future.delayed(const Duration(milliseconds: 500));
      state = state.copyWith(isLoading: false, activityFeed: []);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void selectCategory(String? categoryId) {
    state = state.copyWith(selectedCategoryId: categoryId);
    if (categoryId != null) {
      loadThreads(categoryId);
    }
  }
}

// Providers
final forumProvider = StateNotifierProvider<ForumNotifier, ForumState>((ref) {
  return ForumNotifier();
});

final forumCategoriesProvider =
    FutureProvider<List<ForumCategory>>((ref) async {
  final notifier = ref.watch(forumProvider.notifier);
  await notifier.loadCategories();
  return ref.watch(forumProvider).categories;
});

final forumThreadsProvider = Provider<List<ForumThread>>((ref) {
  return ref.watch(forumProvider).threads;
});

final activityFeedProvider =
    FutureProvider<List<ActivityFeedItem>>((ref) async {
  final notifier = ref.watch(forumProvider.notifier);
  await notifier.loadActivityFeed();
  return ref.watch(forumProvider).activityFeed;
});

final selectedCategoryProvider = Provider<String?>((ref) {
  return ref.watch(forumProvider).selectedCategoryId;
});

final isForumLoadingProvider = Provider<bool>((ref) {
  return ref.watch(forumProvider).isLoading;
});

final forumErrorProvider = Provider<String?>((ref) {
  return ref.watch(forumProvider).error;
});

// Alias providers for community screen compatibility
final latestThreadsProvider = FutureProvider<List<ForumThread>>((ref) async {
  final notifier = ref.watch(forumProvider.notifier);
  await notifier.loadCategories();
  return ref.watch(forumThreadsProvider);
});

// Community Group model
class CommunityGroup {
  final String id;
  final String name;
  final String description;
  final String? imageUrl;
  final String? avatarUrl;
  final int memberCount;
  final int postCount;
  final bool isPrivate;
  final String createdBy;
  final DateTime createdAt;

  const CommunityGroup({
    required this.id,
    required this.name,
    required this.description,
    this.imageUrl,
    this.avatarUrl,
    this.memberCount = 0,
    this.postCount = 0,
    this.isPrivate = false,
    required this.createdBy,
    required this.createdAt,
  });
}

final communityGroupsProvider =
    FutureProvider<List<CommunityGroup>>((ref) async {
  // TODO: Implement API call to fetch community groups
  await Future.delayed(const Duration(milliseconds: 300));
  return [];
});
