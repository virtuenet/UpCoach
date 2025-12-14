import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/forum_service.dart';

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
class ForumNotifier extends Notifier<ForumState> {
  late ForumService _forumService;

  @override
  ForumState build() {
    _forumService = ref.watch(forumServiceProvider);
    return const ForumState();
  }

  Future<void> loadCategories() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final categories = await _forumService.getCategories();
      state = state.copyWith(
        isLoading: false,
        categories: categories,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> loadThreads(String categoryId) async {
    state = state.copyWith(
        isLoading: true, error: null, selectedCategoryId: categoryId);
    try {
      final response = await _forumService.getThreads(categoryId: categoryId);
      state = state.copyWith(isLoading: false, threads: response.threads);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> loadActivityFeed() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final activityFeed = await _forumService.getActivityFeed();
      state = state.copyWith(isLoading: false, activityFeed: activityFeed);
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
final forumProvider = NotifierProvider<ForumNotifier, ForumState>(ForumNotifier.new);

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
  final forumService = ref.watch(forumServiceProvider);
  return forumService.getCommunityGroups();
});
