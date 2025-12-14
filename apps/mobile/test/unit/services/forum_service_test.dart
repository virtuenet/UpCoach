import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/features/community/services/forum_service.dart';
import 'package:upcoach_mobile/features/community/presentation/providers/forum_providers.dart';

void main() {
  group('ForumPost', () {
    test('creates ForumPost with required fields', () {
      final post = ForumPost(
        id: 'post-001',
        threadId: 'thread-001',
        content: 'This is a test post content',
        authorId: 'user-001',
        authorName: 'John Doe',
        createdAt: DateTime(2024, 1, 15, 10, 30),
      );

      expect(post.id, equals('post-001'));
      expect(post.threadId, equals('thread-001'));
      expect(post.content, equals('This is a test post content'));
      expect(post.authorId, equals('user-001'));
      expect(post.authorName, equals('John Doe'));
      expect(post.authorAvatar, isNull);
      expect(post.score, equals(0));
      expect(post.isSolution, isFalse);
      expect(post.parentId, isNull);
    });

    test('creates ForumPost with all fields', () {
      final post = ForumPost(
        id: 'post-001',
        threadId: 'thread-001',
        content: 'This is a solution post',
        authorId: 'user-001',
        authorName: 'Jane Doe',
        authorAvatar: 'https://example.com/avatar.jpg',
        createdAt: DateTime(2024, 1, 15, 10, 30),
        updatedAt: DateTime(2024, 1, 15, 11, 0),
        score: 42,
        isSolution: true,
        parentId: 'parent-post-001',
      );

      expect(post.authorAvatar, equals('https://example.com/avatar.jpg'));
      expect(post.score, equals(42));
      expect(post.isSolution, isTrue);
      expect(post.parentId, equals('parent-post-001'));
      expect(post.updatedAt, isNotNull);
    });
  });

  group('ThreadsResponse', () {
    test('creates ThreadsResponse correctly', () {
      final threads = [
        ForumThread(
          id: 'thread-001',
          categoryId: 'cat-001',
          title: 'Test Thread',
          content: 'Thread content',
          authorId: 'user-001',
          authorName: 'John',
          createdAt: DateTime.now(),
          replyCount: 5,
          viewCount: 100,
        ),
      ];

      final response = ThreadsResponse(
        threads: threads,
        total: 50,
        pages: 5,
        page: 1,
        limit: 10,
      );

      expect(response.threads.length, equals(1));
      expect(response.total, equals(50));
      expect(response.pages, equals(5));
      expect(response.page, equals(1));
      expect(response.limit, equals(10));
    });

    test('handles empty threads list', () {
      final response = ThreadsResponse(
        threads: [],
        total: 0,
        pages: 0,
        page: 1,
        limit: 10,
      );

      expect(response.threads, isEmpty);
      expect(response.total, equals(0));
    });
  });

  group('ForumThread', () {
    test('creates ForumThread with required fields', () {
      final thread = ForumThread(
        id: 'thread-001',
        categoryId: 'cat-001',
        title: 'Test Thread Title',
        content: 'This is the thread content',
        authorId: 'user-001',
        authorName: 'John Doe',
        createdAt: DateTime(2024, 1, 15),
        replyCount: 10,
        viewCount: 150,
      );

      expect(thread.id, equals('thread-001'));
      expect(thread.categoryId, equals('cat-001'));
      expect(thread.title, equals('Test Thread Title'));
      expect(thread.content, equals('This is the thread content'));
      expect(thread.authorId, equals('user-001'));
      expect(thread.authorName, equals('John Doe'));
      expect(thread.replyCount, equals(10));
      expect(thread.viewCount, equals(150));
      expect(thread.isPinned, isFalse);
      expect(thread.isLocked, isFalse);
      expect(thread.tags, isEmpty);
    });

    test('creates ForumThread with all fields', () {
      final thread = ForumThread(
        id: 'thread-002',
        categoryId: 'cat-001',
        title: 'Pinned Thread',
        content: 'Important announcement',
        authorId: 'admin-001',
        authorName: 'Admin',
        authorAvatar: 'https://example.com/admin.jpg',
        createdAt: DateTime(2024, 1, 10),
        updatedAt: DateTime(2024, 1, 15),
        replyCount: 25,
        viewCount: 500,
        isPinned: true,
        isLocked: true,
        tags: ['announcement', 'important'],
      );

      expect(thread.isPinned, isTrue);
      expect(thread.isLocked, isTrue);
      expect(thread.tags, contains('announcement'));
      expect(thread.tags, contains('important'));
      expect(thread.authorAvatar, equals('https://example.com/admin.jpg'));
      expect(thread.updatedAt, isNotNull);
    });
  });

  group('ForumCategory', () {
    test('creates ForumCategory correctly', () {
      final category = ForumCategory(
        id: 'cat-001',
        name: 'General Discussion',
        description: 'Talk about anything',
        icon: 'chat',
        threadCount: 100,
        memberCount: 500,
      );

      expect(category.id, equals('cat-001'));
      expect(category.name, equals('General Discussion'));
      expect(category.description, equals('Talk about anything'));
      expect(category.icon, equals('chat'));
      expect(category.threadCount, equals(100));
      expect(category.memberCount, equals(500));
    });

    test('creates ForumCategory with default values', () {
      final category = ForumCategory(
        id: 'cat-002',
        name: 'Questions',
        description: '',
        icon: 'help',
        threadCount: 0,
        memberCount: 0,
      );

      expect(category.description, equals(''));
      expect(category.threadCount, equals(0));
      expect(category.memberCount, equals(0));
    });
  });

  group('ActivityFeedItem', () {
    test('creates ActivityFeedItem correctly', () {
      final item = ActivityFeedItem(
        id: 'activity-001',
        type: 'new_post',
        userId: 'user-001',
        userName: 'John Doe',
        userAvatar: 'https://example.com/avatar.jpg',
        content: 'John posted a new reply',
        createdAt: DateTime(2024, 1, 15, 14, 30),
        metadata: {'threadId': 'thread-001', 'postId': 'post-001'},
      );

      expect(item.id, equals('activity-001'));
      expect(item.type, equals('new_post'));
      expect(item.userId, equals('user-001'));
      expect(item.userName, equals('John Doe'));
      expect(item.userAvatar, equals('https://example.com/avatar.jpg'));
      expect(item.content, equals('John posted a new reply'));
      expect(item.metadata, isNotNull);
      expect(item.metadata!['threadId'], equals('thread-001'));
    });

    test('creates ActivityFeedItem without optional fields', () {
      final item = ActivityFeedItem(
        id: 'activity-002',
        type: 'new_thread',
        userId: 'user-002',
        userName: 'Jane',
        content: 'Jane created a new thread',
        createdAt: DateTime.now(),
      );

      expect(item.userAvatar, isNull);
      expect(item.metadata, isNull);
    });
  });

  group('CommunityGroup', () {
    test('creates CommunityGroup correctly', () {
      final group = CommunityGroup(
        id: 'group-001',
        name: 'Fitness Enthusiasts',
        description: 'A group for fitness lovers',
        imageUrl: 'https://example.com/cover.jpg',
        avatarUrl: 'https://example.com/avatar.jpg',
        memberCount: 250,
        postCount: 1000,
        isPrivate: false,
        createdBy: 'admin-001',
        createdAt: DateTime(2024, 1, 1),
      );

      expect(group.id, equals('group-001'));
      expect(group.name, equals('Fitness Enthusiasts'));
      expect(group.description, equals('A group for fitness lovers'));
      expect(group.imageUrl, equals('https://example.com/cover.jpg'));
      expect(group.avatarUrl, equals('https://example.com/avatar.jpg'));
      expect(group.memberCount, equals(250));
      expect(group.postCount, equals(1000));
      expect(group.isPrivate, isFalse);
      expect(group.createdBy, equals('admin-001'));
    });

    test('creates private CommunityGroup', () {
      final group = CommunityGroup(
        id: 'group-002',
        name: 'VIP Members',
        description: 'Exclusive group',
        memberCount: 10,
        postCount: 50,
        isPrivate: true,
        createdBy: 'admin-001',
        createdAt: DateTime.now(),
      );

      expect(group.isPrivate, isTrue);
      expect(group.imageUrl, isNull);
      expect(group.avatarUrl, isNull);
    });
  });

  group('Forum thread parsing', () {
    test('parses thread JSON with all fields', () {
      final json = {
        'id': 'thread-001',
        'categoryId': 'cat-001',
        'title': 'How to improve sleep?',
        'content': 'I need tips for better sleep quality',
        'authorId': 'user-001',
        'authorName': 'Sleep Seeker',
        'authorAvatar': 'https://example.com/avatar.jpg',
        'createdAt': '2024-01-15T10:00:00.000Z',
        'updatedAt': '2024-01-15T12:00:00.000Z',
        'replyCount': 15,
        'viewCount': 200,
        'isPinned': false,
        'isLocked': false,
        'tags': ['sleep', 'health', 'tips'],
      };

      // Simulate parsing logic
      final thread = ForumThread(
        id: json['id'] as String,
        categoryId: json['categoryId'] as String,
        title: json['title'] as String,
        content: json['content'] as String,
        authorId: json['authorId'] as String,
        authorName: json['authorName'] as String,
        authorAvatar: json['authorAvatar'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
        updatedAt: DateTime.parse(json['updatedAt'] as String),
        replyCount: json['replyCount'] as int,
        viewCount: json['viewCount'] as int,
        isPinned: json['isPinned'] as bool,
        isLocked: json['isLocked'] as bool,
        tags: (json['tags'] as List).cast<String>(),
      );

      expect(thread.id, equals('thread-001'));
      expect(thread.title, equals('How to improve sleep?'));
      expect(thread.tags.length, equals(3));
      expect(thread.tags, contains('sleep'));
    });
  });

  group('Forum post parsing', () {
    test('parses post JSON correctly', () {
      final json = {
        'id': 'post-001',
        'threadId': 'thread-001',
        'content': 'Try melatonin supplements',
        'authorId': 'user-002',
        'authorName': 'Health Expert',
        'authorAvatar': 'https://example.com/expert.jpg',
        'createdAt': '2024-01-15T11:00:00.000Z',
        'score': 25,
        'isSolution': true,
        'parentId': null,
      };

      // Simulate parsing logic
      final post = ForumPost(
        id: json['id'] as String,
        threadId: json['threadId'] as String,
        content: json['content'] as String,
        authorId: json['authorId'] as String,
        authorName: json['authorName'] as String,
        authorAvatar: json['authorAvatar'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
        score: json['score'] as int,
        isSolution: json['isSolution'] as bool,
        parentId: json['parentId'] as String?,
      );

      expect(post.id, equals('post-001'));
      expect(post.content, equals('Try melatonin supplements'));
      expect(post.score, equals(25));
      expect(post.isSolution, isTrue);
      expect(post.parentId, isNull);
    });

    test('parses nested reply post', () {
      final json = {
        'id': 'post-002',
        'threadId': 'thread-001',
        'content': 'Great suggestion!',
        'authorId': 'user-001',
        'authorName': 'Sleep Seeker',
        'createdAt': '2024-01-15T12:00:00.000Z',
        'score': 5,
        'isSolution': false,
        'parentId': 'post-001',
      };

      final post = ForumPost(
        id: json['id'] as String,
        threadId: json['threadId'] as String,
        content: json['content'] as String,
        authorId: json['authorId'] as String,
        authorName: json['authorName'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
        score: json['score'] as int,
        isSolution: json['isSolution'] as bool,
        parentId: json['parentId'] as String?,
      );

      expect(post.parentId, equals('post-001'));
      expect(post.isSolution, isFalse);
    });
  });
}
