import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/features/community/services/forum_service.dart';
import 'package:upcoach_mobile/features/community/presentation/providers/forum_providers.dart';

void main() {
  group('Forum Realtime Integration Tests', () {
    group('ForumState', () {
      test('creates initial ForumState correctly', () {
        const state = ForumState();

        expect(state.categories, isEmpty);
        expect(state.threads, isEmpty);
        expect(state.activityFeed, isEmpty);
        expect(state.isLoading, isFalse);
        expect(state.error, isNull);
        expect(state.selectedCategoryId, isNull);
      });

      test('copyWith updates fields correctly', () {
        const state = ForumState();

        final categories = [
          const ForumCategory(
            id: 'cat-001',
            name: 'General Discussion',
            description: 'Talk about anything',
            icon: 'chat',
          ),
        ];

        final updatedState = state.copyWith(
          categories: categories,
          isLoading: true,
          selectedCategoryId: 'cat-001',
        );

        expect(updatedState.categories, hasLength(1));
        expect(updatedState.isLoading, isTrue);
        expect(updatedState.selectedCategoryId, equals('cat-001'));
        // Original state unchanged
        expect(state.categories, isEmpty);
      });

      test('copyWith clears error when set to null', () {
        const state = ForumState(error: 'Previous error');

        final updatedState = state.copyWith(error: null);

        expect(updatedState.error, isNull);
      });
    });

    group('ForumCategory', () {
      test('creates ForumCategory with required fields', () {
        const category = ForumCategory(
          id: 'cat-001',
          name: 'General Discussion',
          description: 'A place to discuss various topics',
          icon: 'chat_bubble',
        );

        expect(category.id, equals('cat-001'));
        expect(category.name, equals('General Discussion'));
        expect(category.description, equals('A place to discuss various topics'));
        expect(category.icon, equals('chat_bubble'));
        expect(category.threadCount, equals(0));
        expect(category.memberCount, equals(0));
      });

      test('creates ForumCategory with all fields', () {
        const category = ForumCategory(
          id: 'cat-002',
          name: 'Fitness Tips',
          description: 'Share and discover fitness tips',
          icon: 'fitness_center',
          threadCount: 150,
          memberCount: 5000,
        );

        expect(category.threadCount, equals(150));
        expect(category.memberCount, equals(5000));
      });
    });

    group('ForumThread', () {
      test('creates ForumThread with required fields', () {
        final thread = ForumThread(
          id: 'thread-001',
          categoryId: 'cat-001',
          title: 'Best morning routines for productivity',
          content: 'What are your best tips for morning routines?',
          authorId: 'user-001',
          authorName: 'John Doe',
          createdAt: DateTime(2024, 1, 15, 9, 30),
        );

        expect(thread.id, equals('thread-001'));
        expect(thread.categoryId, equals('cat-001'));
        expect(thread.title, equals('Best morning routines for productivity'));
        expect(thread.content, equals('What are your best tips for morning routines?'));
        expect(thread.authorId, equals('user-001'));
        expect(thread.authorName, equals('John Doe'));
        expect(thread.replyCount, equals(0));
        expect(thread.viewCount, equals(0));
        expect(thread.isPinned, isFalse);
        expect(thread.isLocked, isFalse);
        expect(thread.tags, isEmpty);
      });

      test('creates ForumThread with all fields', () {
        final thread = ForumThread(
          id: 'thread-002',
          categoryId: 'cat-001',
          title: 'Important Announcement',
          content: 'Welcome to our community!',
          authorId: 'admin-001',
          authorName: 'Admin',
          authorAvatar: 'https://example.com/admin.jpg',
          createdAt: DateTime(2024, 1, 1),
          updatedAt: DateTime(2024, 1, 15),
          replyCount: 42,
          viewCount: 1500,
          isPinned: true,
          isLocked: true,
          tags: ['announcement', 'pinned', 'welcome'],
        );

        expect(thread.authorAvatar, equals('https://example.com/admin.jpg'));
        expect(thread.updatedAt, isNotNull);
        expect(thread.replyCount, equals(42));
        expect(thread.viewCount, equals(1500));
        expect(thread.isPinned, isTrue);
        expect(thread.isLocked, isTrue);
        expect(thread.tags, hasLength(3));
        expect(thread.tags, contains('announcement'));
      });
    });

    group('ForumPost', () {
      test('creates ForumPost with required fields', () {
        final post = ForumPost(
          id: 'post-001',
          threadId: 'thread-001',
          content: 'Great question! I start with meditation.',
          authorId: 'user-002',
          authorName: 'Jane Smith',
          createdAt: DateTime(2024, 1, 15, 10, 0),
        );

        expect(post.id, equals('post-001'));
        expect(post.threadId, equals('thread-001'));
        expect(post.content, equals('Great question! I start with meditation.'));
        expect(post.authorId, equals('user-002'));
        expect(post.authorName, equals('Jane Smith'));
        expect(post.score, equals(0));
        expect(post.isSolution, isFalse);
        expect(post.parentId, isNull);
      });

      test('creates ForumPost as solution', () {
        final post = ForumPost(
          id: 'post-002',
          threadId: 'thread-001',
          content: 'The best approach is to wake up at the same time every day.',
          authorId: 'user-003',
          authorName: 'Expert Coach',
          authorAvatar: 'https://example.com/expert.jpg',
          createdAt: DateTime(2024, 1, 15, 11, 0),
          updatedAt: DateTime(2024, 1, 15, 14, 0),
          score: 25,
          isSolution: true,
        );

        expect(post.authorAvatar, equals('https://example.com/expert.jpg'));
        expect(post.updatedAt, isNotNull);
        expect(post.score, equals(25));
        expect(post.isSolution, isTrue);
      });

      test('creates ForumPost as nested reply', () {
        final post = ForumPost(
          id: 'post-003',
          threadId: 'thread-001',
          content: 'I agree with this advice!',
          authorId: 'user-004',
          authorName: 'Regular User',
          createdAt: DateTime(2024, 1, 15, 12, 0),
          parentId: 'post-002',
          score: 5,
        );

        expect(post.parentId, equals('post-002'));
        expect(post.score, equals(5));
        expect(post.isSolution, isFalse);
      });
    });

    group('ActivityFeedItem', () {
      test('creates ActivityFeedItem correctly', () {
        final item = ActivityFeedItem(
          id: 'activity-001',
          type: 'new_thread',
          userId: 'user-001',
          userName: 'John Doe',
          userAvatar: 'https://example.com/john.jpg',
          content: 'John Doe created a new thread: Best morning routines',
          createdAt: DateTime(2024, 1, 15, 9, 30),
          metadata: {'threadId': 'thread-001'},
        );

        expect(item.id, equals('activity-001'));
        expect(item.type, equals('new_thread'));
        expect(item.userId, equals('user-001'));
        expect(item.userName, equals('John Doe'));
        expect(item.userAvatar, equals('https://example.com/john.jpg'));
        expect(item.content, equals('John Doe created a new thread: Best morning routines'));
        expect(item.metadata, isNotNull);
        expect(item.metadata!['threadId'], equals('thread-001'));
      });

      test('creates ActivityFeedItem for new_post', () {
        final item = ActivityFeedItem(
          id: 'activity-002',
          type: 'new_post',
          userId: 'user-002',
          userName: 'Jane Smith',
          content: 'Jane Smith replied to: Best morning routines',
          createdAt: DateTime(2024, 1, 15, 10, 0),
          metadata: {
            'threadId': 'thread-001',
            'postId': 'post-001',
          },
        );

        expect(item.type, equals('new_post'));
        expect(item.metadata!['postId'], equals('post-001'));
      });

      test('creates ActivityFeedItem for solution_marked', () {
        final item = ActivityFeedItem(
          id: 'activity-003',
          type: 'solution_marked',
          userId: 'user-003',
          userName: 'Expert Coach',
          content: "Expert Coach's answer was marked as solution",
          createdAt: DateTime(2024, 1, 15, 14, 0),
          metadata: {
            'threadId': 'thread-001',
            'postId': 'post-002',
          },
        );

        expect(item.type, equals('solution_marked'));
      });
    });

    group('CommunityGroup', () {
      test('creates CommunityGroup with required fields', () {
        final group = CommunityGroup(
          id: 'group-001',
          name: 'Fitness Enthusiasts',
          description: 'A community for fitness lovers',
          memberCount: 500,
          postCount: 1200,
          isPrivate: false,
          createdBy: 'admin-001',
          createdAt: DateTime(2024, 1, 1),
        );

        expect(group.id, equals('group-001'));
        expect(group.name, equals('Fitness Enthusiasts'));
        expect(group.description, equals('A community for fitness lovers'));
        expect(group.memberCount, equals(500));
        expect(group.postCount, equals(1200));
        expect(group.isPrivate, isFalse);
        expect(group.imageUrl, isNull);
        expect(group.avatarUrl, isNull);
      });

      test('creates private CommunityGroup', () {
        final group = CommunityGroup(
          id: 'group-002',
          name: 'Premium Members Only',
          description: 'Exclusive content for premium members',
          imageUrl: 'https://example.com/cover.jpg',
          avatarUrl: 'https://example.com/avatar.jpg',
          memberCount: 100,
          postCount: 50,
          isPrivate: true,
          createdBy: 'admin-001',
          createdAt: DateTime(2024, 1, 10),
        );

        expect(group.isPrivate, isTrue);
        expect(group.imageUrl, equals('https://example.com/cover.jpg'));
        expect(group.avatarUrl, equals('https://example.com/avatar.jpg'));
      });
    });

    group('ThreadsResponse', () {
      test('creates ThreadsResponse correctly', () {
        final threads = [
          ForumThread(
            id: 'thread-001',
            categoryId: 'cat-001',
            title: 'Test Thread',
            content: 'Content',
            authorId: 'user-001',
            authorName: 'User',
            createdAt: DateTime.now(),
          ),
        ];

        final response = ThreadsResponse(
          threads: threads,
          total: 50,
          pages: 5,
          page: 1,
          limit: 10,
        );

        expect(response.threads, hasLength(1));
        expect(response.total, equals(50));
        expect(response.pages, equals(5));
        expect(response.page, equals(1));
        expect(response.limit, equals(10));
      });

      test('handles empty threads response', () {
        const response = ThreadsResponse(
          threads: [],
          total: 0,
          pages: 0,
          page: 1,
          limit: 20,
        );

        expect(response.threads, isEmpty);
        expect(response.total, equals(0));
        expect(response.pages, equals(0));
      });
    });

    group('Realtime Event Simulation', () {
      test('simulates new thread event', () {
        // Initial state
        var state = const ForumState(
          threads: [],
        );

        // Simulate receiving a new thread via realtime
        final newThread = ForumThread(
          id: 'thread-new',
          categoryId: 'cat-001',
          title: 'Just Posted Thread',
          content: 'This is a new thread from realtime',
          authorId: 'user-001',
          authorName: 'Active User',
          createdAt: DateTime.now(),
        );

        // Update state with new thread at the beginning
        state = state.copyWith(
          threads: [newThread, ...state.threads],
        );

        expect(state.threads, hasLength(1));
        expect(state.threads.first.id, equals('thread-new'));
        expect(state.threads.first.title, equals('Just Posted Thread'));
      });

      test('simulates thread update event', () {
        final existingThread = ForumThread(
          id: 'thread-001',
          categoryId: 'cat-001',
          title: 'Original Title',
          content: 'Original content',
          authorId: 'user-001',
          authorName: 'User',
          createdAt: DateTime(2024, 1, 15),
          replyCount: 5,
          viewCount: 100,
        );

        var state = ForumState(threads: [existingThread]);

        // Simulate receiving an update (new reply added)
        final updatedThread = ForumThread(
          id: 'thread-001',
          categoryId: 'cat-001',
          title: 'Original Title',
          content: 'Original content',
          authorId: 'user-001',
          authorName: 'User',
          createdAt: DateTime(2024, 1, 15),
          updatedAt: DateTime.now(),
          replyCount: 6, // Incremented
          viewCount: 110, // Incremented
        );

        // Update the thread in state
        final updatedThreads = state.threads.map((t) {
          if (t.id == updatedThread.id) {
            return updatedThread;
          }
          return t;
        }).toList();

        state = state.copyWith(threads: updatedThreads);

        expect(state.threads.first.replyCount, equals(6));
        expect(state.threads.first.viewCount, equals(110));
        expect(state.threads.first.updatedAt, isNotNull);
      });

      test('simulates activity feed update', () {
        // Initial state with some activity
        final existingActivity = [
          ActivityFeedItem(
            id: 'activity-001',
            type: 'new_thread',
            userId: 'user-001',
            userName: 'User 1',
            content: 'User 1 created a thread',
            createdAt: DateTime(2024, 1, 15, 9, 0),
          ),
        ];

        var state = ForumState(activityFeed: existingActivity);

        // Simulate new activity from realtime
        final newActivity = ActivityFeedItem(
          id: 'activity-002',
          type: 'new_post',
          userId: 'user-002',
          userName: 'User 2',
          content: 'User 2 replied to a thread',
          createdAt: DateTime(2024, 1, 15, 10, 0),
        );

        // Prepend new activity
        state = state.copyWith(
          activityFeed: [newActivity, ...state.activityFeed],
        );

        expect(state.activityFeed, hasLength(2));
        expect(state.activityFeed.first.id, equals('activity-002'));
      });
    });

    group('Thread Sorting Simulation', () {
      test('sorts threads by latest activity', () {
        final threads = [
          ForumThread(
            id: 'thread-001',
            categoryId: 'cat-001',
            title: 'Old Thread',
            content: 'Content',
            authorId: 'user-001',
            authorName: 'User',
            createdAt: DateTime(2024, 1, 10),
          ),
          ForumThread(
            id: 'thread-002',
            categoryId: 'cat-001',
            title: 'Recent Thread',
            content: 'Content',
            authorId: 'user-001',
            authorName: 'User',
            createdAt: DateTime(2024, 1, 15),
          ),
          ForumThread(
            id: 'thread-003',
            categoryId: 'cat-001',
            title: 'Newest Thread',
            content: 'Content',
            authorId: 'user-001',
            authorName: 'User',
            createdAt: DateTime(2024, 1, 20),
          ),
        ];

        // Sort by latest
        final sortedByLatest = [...threads]
          ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

        expect(sortedByLatest.first.id, equals('thread-003'));
        expect(sortedByLatest.last.id, equals('thread-001'));
      });

      test('sorts threads with pinned first', () {
        final threads = [
          ForumThread(
            id: 'thread-001',
            categoryId: 'cat-001',
            title: 'Regular Thread',
            content: 'Content',
            authorId: 'user-001',
            authorName: 'User',
            createdAt: DateTime(2024, 1, 20),
            isPinned: false,
          ),
          ForumThread(
            id: 'thread-002',
            categoryId: 'cat-001',
            title: 'Pinned Thread',
            content: 'Content',
            authorId: 'admin-001',
            authorName: 'Admin',
            createdAt: DateTime(2024, 1, 10),
            isPinned: true,
          ),
          ForumThread(
            id: 'thread-003',
            categoryId: 'cat-001',
            title: 'Another Regular Thread',
            content: 'Content',
            authorId: 'user-002',
            authorName: 'User 2',
            createdAt: DateTime(2024, 1, 15),
            isPinned: false,
          ),
        ];

        // Sort with pinned first, then by date
        final sortedWithPinned = [...threads]..sort((a, b) {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.createdAt.compareTo(a.createdAt);
          });

        expect(sortedWithPinned.first.isPinned, isTrue);
        expect(sortedWithPinned.first.id, equals('thread-002'));
        // Non-pinned sorted by date
        expect(sortedWithPinned[1].id, equals('thread-001')); // Most recent non-pinned
      });
    });

    group('Thread Filtering Simulation', () {
      test('filters threads by category', () {
        final threads = [
          ForumThread(
            id: 'thread-001',
            categoryId: 'fitness',
            title: 'Fitness Thread',
            content: 'Content',
            authorId: 'user-001',
            authorName: 'User',
            createdAt: DateTime.now(),
          ),
          ForumThread(
            id: 'thread-002',
            categoryId: 'nutrition',
            title: 'Nutrition Thread',
            content: 'Content',
            authorId: 'user-001',
            authorName: 'User',
            createdAt: DateTime.now(),
          ),
          ForumThread(
            id: 'thread-003',
            categoryId: 'fitness',
            title: 'Another Fitness Thread',
            content: 'Content',
            authorId: 'user-002',
            authorName: 'User 2',
            createdAt: DateTime.now(),
          ),
        ];

        final fitnessThreads =
            threads.where((t) => t.categoryId == 'fitness').toList();

        expect(fitnessThreads, hasLength(2));
        expect(fitnessThreads.every((t) => t.categoryId == 'fitness'), isTrue);
      });

      test('filters threads by tags', () {
        final threads = [
          ForumThread(
            id: 'thread-001',
            categoryId: 'cat-001',
            title: 'Running Tips',
            content: 'Content',
            authorId: 'user-001',
            authorName: 'User',
            createdAt: DateTime.now(),
            tags: ['running', 'cardio', 'tips'],
          ),
          ForumThread(
            id: 'thread-002',
            categoryId: 'cat-001',
            title: 'Weight Training',
            content: 'Content',
            authorId: 'user-001',
            authorName: 'User',
            createdAt: DateTime.now(),
            tags: ['weights', 'strength', 'tips'],
          ),
          ForumThread(
            id: 'thread-003',
            categoryId: 'cat-001',
            title: 'Marathon Prep',
            content: 'Content',
            authorId: 'user-002',
            authorName: 'User 2',
            createdAt: DateTime.now(),
            tags: ['running', 'marathon', 'endurance'],
          ),
        ];

        // Filter by 'running' tag
        final runningThreads =
            threads.where((t) => t.tags.contains('running')).toList();

        expect(runningThreads, hasLength(2));
        expect(runningThreads.map((t) => t.id).toList(),
            containsAll(['thread-001', 'thread-003']));
      });

      test('searches threads by query', () {
        final threads = [
          ForumThread(
            id: 'thread-001',
            categoryId: 'cat-001',
            title: 'How to improve sleep quality',
            content: 'Looking for tips on better sleep',
            authorId: 'user-001',
            authorName: 'User',
            createdAt: DateTime.now(),
          ),
          ForumThread(
            id: 'thread-002',
            categoryId: 'cat-001',
            title: 'Best pre-workout meals',
            content: 'What should I eat before training?',
            authorId: 'user-001',
            authorName: 'User',
            createdAt: DateTime.now(),
          ),
          ForumThread(
            id: 'thread-003',
            categoryId: 'cat-001',
            title: 'Sleep tracking apps',
            content: 'Recommendations for sleep trackers',
            authorId: 'user-002',
            authorName: 'User 2',
            createdAt: DateTime.now(),
          ),
        ];

        // Search for 'sleep'
        const query = 'sleep';
        final searchResults = threads.where((t) {
          final titleMatch = t.title.toLowerCase().contains(query.toLowerCase());
          final contentMatch =
              t.content.toLowerCase().contains(query.toLowerCase());
          return titleMatch || contentMatch;
        }).toList();

        expect(searchResults, hasLength(2));
        expect(searchResults.map((t) => t.id).toList(),
            containsAll(['thread-001', 'thread-003']));
      });
    });

    group('Voting Simulation', () {
      test('simulates upvote on post', () {
        var post = ForumPost(
          id: 'post-001',
          threadId: 'thread-001',
          content: 'Great advice!',
          authorId: 'user-002',
          authorName: 'User',
          createdAt: DateTime.now(),
          score: 10,
        );

        // Simulate upvote
        final newScore = post.score + 1;
        post = ForumPost(
          id: post.id,
          threadId: post.threadId,
          content: post.content,
          authorId: post.authorId,
          authorName: post.authorName,
          authorAvatar: post.authorAvatar,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          score: newScore,
          isSolution: post.isSolution,
          parentId: post.parentId,
        );

        expect(post.score, equals(11));
      });

      test('simulates downvote on post', () {
        var post = ForumPost(
          id: 'post-001',
          threadId: 'thread-001',
          content: 'Not helpful advice',
          authorId: 'user-002',
          authorName: 'User',
          createdAt: DateTime.now(),
          score: 5,
        );

        // Simulate downvote
        final newScore = post.score - 1;
        post = ForumPost(
          id: post.id,
          threadId: post.threadId,
          content: post.content,
          authorId: post.authorId,
          authorName: post.authorName,
          createdAt: post.createdAt,
          score: newScore,
          isSolution: post.isSolution,
          parentId: post.parentId,
        );

        expect(post.score, equals(4));
      });
    });

    group('Error Handling Simulation', () {
      test('simulates network error during load', () {
        const state = ForumState();

        // Start loading
        var updatedState = state.copyWith(isLoading: true, error: null);
        expect(updatedState.isLoading, isTrue);
        expect(updatedState.error, isNull);

        // Simulate network error
        updatedState = updatedState.copyWith(
          isLoading: false,
          error: 'Network connection failed. Please check your internet.',
        );

        expect(updatedState.isLoading, isFalse);
        expect(updatedState.error, isNotNull);
        expect(updatedState.error, contains('Network'));
      });

      test('simulates server error during load', () {
        const state = ForumState();

        // Simulate server error
        final updatedState = state.copyWith(
          isLoading: false,
          error: 'Server error: 500 Internal Server Error',
        );

        expect(updatedState.error, contains('500'));
      });

      test('simulates recovery after error', () {
        // Start with error state
        const errorState = ForumState(
          error: 'Previous network error',
          isLoading: false,
        );

        // Retry loading
        var state = errorState.copyWith(isLoading: true, error: null);
        expect(state.isLoading, isTrue);
        expect(state.error, isNull);

        // Successful load
        final categories = [
          const ForumCategory(
            id: 'cat-001',
            name: 'General',
            description: 'General discussion',
            icon: 'chat',
          ),
        ];

        state = state.copyWith(
          isLoading: false,
          categories: categories,
        );

        expect(state.isLoading, isFalse);
        expect(state.error, isNull);
        expect(state.categories, hasLength(1));
      });
    });

    group('Pagination Simulation', () {
      test('simulates loading multiple pages', () {
        // Page 1
        var allThreads = <ForumThread>[];
        const page1Response = ThreadsResponse(
          threads: [],
          total: 50,
          pages: 5,
          page: 1,
          limit: 10,
        );

        // Simulate page 1 threads
        for (int i = 0; i < 10; i++) {
          allThreads.add(ForumThread(
            id: 'thread-00$i',
            categoryId: 'cat-001',
            title: 'Thread $i',
            content: 'Content',
            authorId: 'user-001',
            authorName: 'User',
            createdAt: DateTime.now().subtract(Duration(days: i)),
          ));
        }

        expect(allThreads, hasLength(10));
        expect(page1Response.total, equals(50));
        expect(page1Response.pages, equals(5));

        // Simulate loading page 2
        for (int i = 10; i < 20; i++) {
          allThreads.add(ForumThread(
            id: 'thread-0$i',
            categoryId: 'cat-001',
            title: 'Thread $i',
            content: 'Content',
            authorId: 'user-001',
            authorName: 'User',
            createdAt: DateTime.now().subtract(Duration(days: i)),
          ));
        }

        expect(allThreads, hasLength(20));
      });

      test('determines if more pages available', () {
        const response = ThreadsResponse(
          threads: [],
          total: 50,
          pages: 5,
          page: 2,
          limit: 10,
        );

        final hasMorePages = response.page < response.pages;
        expect(hasMorePages, isTrue);

        const lastPageResponse = ThreadsResponse(
          threads: [],
          total: 50,
          pages: 5,
          page: 5,
          limit: 10,
        );

        final noMorePages = lastPageResponse.page < lastPageResponse.pages;
        expect(noMorePages, isFalse);
      });
    });

    group('Category Selection Flow', () {
      test('simulates category selection and thread loading', () {
        // Initial state
        var state = ForumState(
          categories: [
            const ForumCategory(
              id: 'fitness',
              name: 'Fitness',
              description: 'Fitness discussions',
              icon: 'fitness',
              threadCount: 25,
            ),
            const ForumCategory(
              id: 'nutrition',
              name: 'Nutrition',
              description: 'Nutrition discussions',
              icon: 'restaurant',
              threadCount: 15,
            ),
          ],
        );

        // Select fitness category
        state = state.copyWith(
          selectedCategoryId: 'fitness',
          isLoading: true,
        );

        expect(state.selectedCategoryId, equals('fitness'));
        expect(state.isLoading, isTrue);

        // Load threads for category
        final fitnessThreads = [
          ForumThread(
            id: 'thread-f1',
            categoryId: 'fitness',
            title: 'Workout routines',
            content: 'Content',
            authorId: 'user-001',
            authorName: 'User',
            createdAt: DateTime.now(),
          ),
        ];

        state = state.copyWith(
          isLoading: false,
          threads: fitnessThreads,
        );

        expect(state.isLoading, isFalse);
        expect(state.threads, hasLength(1));
        expect(state.threads.first.categoryId, equals('fitness'));
      });
    });
  });
}
