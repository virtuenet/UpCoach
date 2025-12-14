import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_service.dart';
import '../presentation/providers/forum_providers.dart';

class ForumService {
  final ApiService _apiService;

  ForumService(this._apiService);

  /// Get all forum categories
  Future<List<ForumCategory>> getCategories() async {
    final response = await _apiService.get('/forum/categories');

    if (response.data['success'] == true) {
      final List<dynamic> categoriesJson = response.data['data'] ?? [];
      return categoriesJson
          .map((json) => ForumCategory(
                id: json['id'] as String,
                name: json['name'] as String,
                description: json['description'] as String? ?? '',
                icon: json['icon'] as String? ?? 'chat',
                threadCount: json['threadCount'] as int? ?? 0,
                memberCount: json['memberCount'] as int? ?? 0,
              ))
          .toList();
    }

    throw Exception(response.data['error'] ?? 'Failed to load categories');
  }

  /// Get threads with optional filtering
  Future<ThreadsResponse> getThreads({
    String? categoryId,
    List<String>? tags,
    String? userId,
    String? query,
    int page = 1,
    int limit = 20,
    String sortBy = 'latest',
  }) async {
    final queryParams = <String, dynamic>{
      'page': page.toString(),
      'limit': limit.toString(),
      'sortBy': sortBy,
    };

    if (categoryId != null) queryParams['categoryId'] = categoryId;
    if (tags != null && tags.isNotEmpty) queryParams['tags'] = tags.join(',');
    if (userId != null) queryParams['userId'] = userId;
    if (query != null && query.isNotEmpty) queryParams['query'] = query;

    final response = await _apiService.get(
      '/forum/threads',
      queryParameters: queryParams,
    );

    if (response.data['success'] == true) {
      final List<dynamic> threadsJson = response.data['data'] ?? [];
      final pagination = response.data['pagination'] as Map<String, dynamic>?;

      final threads = threadsJson.map((json) => _parseThread(json)).toList();

      return ThreadsResponse(
        threads: threads,
        total: pagination?['total'] as int? ?? threads.length,
        pages: pagination?['pages'] as int? ?? 1,
        page: pagination?['page'] as int? ?? page,
        limit: pagination?['limit'] as int? ?? limit,
      );
    }

    throw Exception(response.data['error'] ?? 'Failed to load threads');
  }

  /// Get a single thread by ID
  Future<ForumThread?> getThread(String threadId) async {
    final response = await _apiService.get('/forum/threads/$threadId');

    if (response.data['success'] == true) {
      final threadJson = response.data['data'];
      if (threadJson != null) {
        return _parseThread(threadJson);
      }
    }

    return null;
  }

  /// Create a new thread
  Future<ForumThread> createThread({
    required String categoryId,
    required String title,
    required String content,
    List<String>? tags,
  }) async {
    final response = await _apiService.post(
      '/forum/threads',
      data: {
        'categoryId': categoryId,
        'title': title,
        'content': content,
        if (tags != null && tags.isNotEmpty) 'tags': tags,
      },
    );

    if (response.data['success'] == true) {
      return _parseThread(response.data['data']);
    }

    throw Exception(response.data['error'] ?? 'Failed to create thread');
  }

  /// Create a post/reply in a thread
  Future<ForumPost> createPost({
    required String threadId,
    required String content,
    String? parentId,
  }) async {
    final response = await _apiService.post(
      '/forum/posts',
      data: {
        'threadId': threadId,
        'content': content,
        if (parentId != null) 'parentId': parentId,
      },
    );

    if (response.data['success'] == true) {
      return _parsePost(response.data['data']);
    }

    throw Exception(response.data['error'] ?? 'Failed to create post');
  }

  /// Vote on a post
  Future<int> votePost(String postId, int voteType) async {
    final response = await _apiService.post(
      '/forum/posts/$postId/vote',
      data: {'voteType': voteType},
    );

    if (response.data['success'] == true) {
      return response.data['data']['score'] as int? ?? 0;
    }

    throw Exception(response.data['error'] ?? 'Failed to vote');
  }

  /// Edit a post
  Future<ForumPost> editPost(String postId, String content) async {
    final response = await _apiService.patch(
      '/forum/posts/$postId',
      data: {'content': content},
    );

    if (response.data['success'] == true) {
      return _parsePost(response.data['data']);
    }

    throw Exception(response.data['error'] ?? 'Failed to edit post');
  }

  /// Delete a post
  Future<void> deletePost(String postId) async {
    final response = await _apiService.delete('/forum/posts/$postId');

    if (response.data['success'] != true) {
      throw Exception(response.data['error'] ?? 'Failed to delete post');
    }
  }

  /// Mark a post as the solution
  Future<void> markAsSolution(String postId) async {
    final response = await _apiService.post('/forum/posts/$postId/solution');

    if (response.data['success'] != true) {
      throw Exception(response.data['error'] ?? 'Failed to mark as solution');
    }
  }

  /// Get activity feed
  Future<List<ActivityFeedItem>> getActivityFeed({int limit = 50}) async {
    final response = await _apiService.get(
      '/forum/activity',
      queryParameters: {'limit': limit.toString()},
    );

    if (response.data['success'] == true) {
      final List<dynamic> feedJson = response.data['data'] ?? [];
      return feedJson
          .map((json) => ActivityFeedItem(
                id: json['id'] as String,
                type: json['type'] as String,
                userId: json['userId'] as String,
                userName: json['userName'] as String? ?? 'Unknown',
                userAvatar: json['userAvatar'] as String?,
                content: json['content'] as String? ?? '',
                createdAt: DateTime.parse(
                    json['createdAt'] as String? ?? DateTime.now().toIso8601String()),
                metadata: json['metadata'] as Map<String, dynamic>?,
              ))
          .toList();
    }

    throw Exception(response.data['error'] ?? 'Failed to load activity feed');
  }

  /// Get community groups
  Future<List<CommunityGroup>> getCommunityGroups() async {
    final response = await _apiService.get('/community/groups');

    if (response.data['success'] == true) {
      final List<dynamic> groupsJson = response.data['data'] ?? [];
      return groupsJson
          .map((json) => CommunityGroup(
                id: json['id'] as String,
                name: json['name'] as String,
                description: json['description'] as String? ?? '',
                imageUrl: json['imageUrl'] as String?,
                avatarUrl: json['avatarUrl'] as String?,
                memberCount: json['memberCount'] as int? ?? 0,
                postCount: json['postCount'] as int? ?? 0,
                isPrivate: json['isPrivate'] as bool? ?? false,
                createdBy: json['createdBy'] as String? ?? '',
                createdAt: DateTime.parse(
                    json['createdAt'] as String? ?? DateTime.now().toIso8601String()),
              ))
          .toList();
    }

    throw Exception(response.data['error'] ?? 'Failed to load community groups');
  }

  ForumThread _parseThread(Map<String, dynamic> json) {
    return ForumThread(
      id: json['id'] as String,
      categoryId: json['categoryId'] as String,
      title: json['title'] as String,
      content: json['content'] as String? ?? '',
      authorId: json['authorId'] as String? ?? json['userId'] as String? ?? '',
      authorName: json['authorName'] as String? ??
          json['author']?['name'] as String? ??
          'Unknown',
      authorAvatar:
          json['authorAvatar'] as String? ?? json['author']?['avatar'] as String?,
      createdAt: DateTime.parse(
          json['createdAt'] as String? ?? DateTime.now().toIso8601String()),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
      replyCount: json['replyCount'] as int? ?? json['postCount'] as int? ?? 0,
      viewCount: json['viewCount'] as int? ?? 0,
      isPinned: json['isPinned'] as bool? ?? false,
      isLocked: json['isLocked'] as bool? ?? false,
      tags: (json['tags'] as List<dynamic>?)?.cast<String>() ?? [],
    );
  }

  ForumPost _parsePost(Map<String, dynamic> json) {
    return ForumPost(
      id: json['id'] as String,
      threadId: json['threadId'] as String,
      content: json['content'] as String,
      authorId: json['authorId'] as String? ?? json['userId'] as String? ?? '',
      authorName: json['authorName'] as String? ??
          json['author']?['name'] as String? ??
          'Unknown',
      authorAvatar:
          json['authorAvatar'] as String? ?? json['author']?['avatar'] as String?,
      createdAt: DateTime.parse(
          json['createdAt'] as String? ?? DateTime.now().toIso8601String()),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
      score: json['score'] as int? ?? 0,
      isSolution: json['isSolution'] as bool? ?? false,
      parentId: json['parentId'] as String?,
    );
  }
}

/// Forum post model
class ForumPost {
  final String id;
  final String threadId;
  final String content;
  final String authorId;
  final String authorName;
  final String? authorAvatar;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final int score;
  final bool isSolution;
  final String? parentId;

  const ForumPost({
    required this.id,
    required this.threadId,
    required this.content,
    required this.authorId,
    required this.authorName,
    this.authorAvatar,
    required this.createdAt,
    this.updatedAt,
    this.score = 0,
    this.isSolution = false,
    this.parentId,
  });
}

/// Response model for paginated threads
class ThreadsResponse {
  final List<ForumThread> threads;
  final int total;
  final int pages;
  final int page;
  final int limit;

  const ThreadsResponse({
    required this.threads,
    required this.total,
    required this.pages,
    required this.page,
    required this.limit,
  });
}

/// Provider for ForumService
final forumServiceProvider = Provider<ForumService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return ForumService(apiService);
});
