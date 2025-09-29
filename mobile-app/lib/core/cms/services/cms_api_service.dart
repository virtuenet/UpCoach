import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/api_service.dart';
import '../../services/offline_sync_service.dart';
import '../models/cms_content.dart';
import '../models/cms_workflow.dart';
import 'cms_cache_service.dart';

class CMSApiService {
  final ApiService _apiService;
  final CMSCacheService _cacheService;
  final OfflineSyncService _syncService;

  CMSApiService({
    required ApiService apiService,
    required CMSCacheService cacheService,
    required OfflineSyncService syncService,
  })  : _apiService = apiService,
        _cacheService = cacheService,
        _syncService = syncService;

  // Content Management
  Future<List<CMSContent>> getContent({
    ContentType? type,
    ContentStatus? status,
    Map<String, dynamic>? filters,
    int page = 1,
    int limit = 20,
    bool forceRefresh = false,
  }) async {
    try {
      // Check cache first
      if (!forceRefresh) {
        final cached = await _cacheService.getCachedContent(
          type: type,
          status: status,
          filters: filters,
          page: page,
        );
        if (cached != null && cached.isNotEmpty) {
          return cached;
        }
      }

      // Fetch from API
      final response = await _apiService.get(
        '/api/cms/content',
        queryParameters: {
          if (type != null) 'type': type.name,
          if (status != null) 'status': status.name,
          'page': page,
          'limit': limit,
          ...?filters,
        },
      );

      final content = (response.data['data'] as List)
          .map((json) => CMSContent.fromJson(json))
          .toList();

      // Cache for offline use
      await _cacheService.cacheContent(content,
        type: type,
        status: status,
        filters: filters,
        page: page,
      );

      return content;
    } catch (e) {
      // Fallback to cached content if offline
      if (!await _syncService.isOnline()) {
        final cached = await _cacheService.getCachedContent(
          type: type,
          status: status,
          filters: filters,
          page: page,
        );
        if (cached != null && cached.isNotEmpty) {
          return cached;
        }
      }
      throw CMSException('Failed to fetch content: $e');
    }
  }

  Future<CMSContent> getContentById(String contentId) async {
    try {
      // Check cache first
      final cached = await _cacheService.getCachedContentById(contentId);
      if (cached != null) {
        // Check if cache is still valid
        if (cached.cachedAt != null &&
            DateTime.now().difference(cached.cachedAt!).inHours < 1) {
          return cached;
        }
      }

      // Fetch from API
      final response = await _apiService.get('/api/cms/content/$contentId');
      final content = CMSContent.fromJson(response.data);

      // Cache for offline use
      await _cacheService.cacheContentById(content);

      return content;
    } catch (e) {
      // Fallback to cached content if offline
      if (!await _syncService.isOnline()) {
        final cached = await _cacheService.getCachedContentById(contentId);
        if (cached != null) return cached;
      }
      throw CMSException('Failed to fetch content: $e');
    }
  }

  Future<CMSContent> createContent(CMSContent content) async {
    try {
      if (await _syncService.isOnline()) {
        final response = await _apiService.post(
          '/api/cms/content',
          data: content.toJson(),
        );
        return CMSContent.fromJson(response.data);
      } else {
        // Queue for later sync
        await _syncService.addPendingOperation(
          type: 'create',
          entity: 'cms_content',
          data: content.toJson(),
        );

        // Return with temporary ID for optimistic update
        return content.copyWith(
          id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
          status: ContentStatus.draft,
        );
      }
    } catch (e) {
      throw CMSException('Failed to create content: $e');
    }
  }

  Future<CMSContent> updateContent(String contentId, CMSContent content) async {
    try {
      if (await _syncService.isOnline()) {
        final response = await _apiService.patch(
          '/api/cms/content/$contentId',
          data: content.toJson(),
        );
        final updated = CMSContent.fromJson(response.data);

        // Update cache
        await _cacheService.cacheContentById(updated);

        return updated;
      } else {
        // Queue for later sync
        await _syncService.addPendingOperation(
          type: 'update',
          entity: 'cms_content',
          data: {
            'id': contentId,
            ...content.toJson(),
          },
        );

        // Update local cache optimistically
        await _cacheService.cacheContentById(content);

        return content;
      }
    } catch (e) {
      throw CMSException('Failed to update content: $e');
    }
  }

  Future<void> deleteContent(String contentId) async {
    try {
      if (await _syncService.isOnline()) {
        await _apiService.delete('/api/cms/content/$contentId');
      } else {
        // Queue for later sync
        await _syncService.addPendingOperation(
          type: 'delete',
          entity: 'cms_content',
          data: {'id': contentId},
        );
      }

      // Remove from cache
      await _cacheService.removeContentById(contentId);
    } catch (e) {
      throw CMSException('Failed to delete content: $e');
    }
  }

  // Workflow Management
  Future<List<CMSWorkflow>> getWorkflows({
    WorkflowStatus? status,
    bool myApprovals = false,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/api/cms/workflows',
        queryParameters: {
          if (status != null) 'status': status.name,
          if (myApprovals) 'my_approvals': true,
          'page': page,
          'limit': limit,
        },
      );

      return (response.data['data'] as List)
          .map((json) => CMSWorkflow.fromJson(json))
          .toList();
    } catch (e) {
      throw CMSException('Failed to fetch workflows: $e');
    }
  }

  Future<CMSWorkflow> approveWorkflow({
    required String workflowId,
    required bool approved,
    String? comments,
  }) async {
    try {
      final response = await _apiService.post(
        '/api/cms/workflows/$workflowId/approve',
        data: {
          'approved': approved,
          'comments': comments,
        },
      );
      return CMSWorkflow.fromJson(response.data);
    } catch (e) {
      throw CMSException('Failed to process workflow approval: $e');
    }
  }

  // Media Management
  Future<String> uploadMedia(String filePath, {
    MediaType? type,
    Map<String, dynamic>? metadata,
    Function(int, int)? onProgress,
  }) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath),
        if (type != null) 'type': type.name,
        if (metadata != null) 'metadata': jsonEncode(metadata),
      });

      final response = await _apiService.post(
        '/api/cms/media/upload',
        data: formData,
        options: Options(
          headers: {'Content-Type': 'multipart/form-data'},
        ),
      );

      return response.data['url'];
    } catch (e) {
      throw CMSException('Failed to upload media: $e');
    }
  }

  // Analytics
  Future<ContentAnalytics> getContentAnalytics({
    String? contentId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final response = await _apiService.get(
        '/api/cms/analytics',
        queryParameters: {
          if (contentId != null) 'content_id': contentId,
          if (startDate != null) 'start_date': startDate.toIso8601String(),
          if (endDate != null) 'end_date': endDate.toIso8601String(),
        },
      );

      return ContentAnalytics.fromJson(response.data);
    } catch (e) {
      throw CMSException('Failed to fetch analytics: $e');
    }
  }

  // Search
  Future<List<CMSContent>> searchContent({
    required String query,
    ContentType? type,
    Map<String, dynamic>? filters,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/api/cms/content/search',
        queryParameters: {
          'q': query,
          if (type != null) 'type': type.name,
          'page': page,
          'limit': limit,
          ...?filters,
        },
      );

      return (response.data['data'] as List)
          .map((json) => CMSContent.fromJson(json))
          .toList();
    } catch (e) {
      // Fallback to local search if offline
      if (!await _syncService.isOnline()) {
        return await _cacheService.searchCachedContent(query, type: type);
      }
      throw CMSException('Failed to search content: $e');
    }
  }

  // Bulk Operations
  Future<void> bulkUpdateContent(List<String> contentIds, Map<String, dynamic> updates) async {
    try {
      await _apiService.post(
        '/api/cms/content/bulk-update',
        data: {
          'content_ids': contentIds,
          'updates': updates,
        },
      );

      // Clear cache for affected content
      for (final contentId in contentIds) {
        await _cacheService.removeContentById(contentId);
      }
    } catch (e) {
      throw CMSException('Failed to bulk update content: $e');
    }
  }

  // Templates
  Future<List<ContentTemplate>> getTemplates({
    ContentType? type,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/api/cms/templates',
        queryParameters: {
          if (type != null) 'type': type.name,
          'page': page,
          'limit': limit,
        },
      );

      return (response.data['data'] as List)
          .map((json) => ContentTemplate.fromJson(json))
          .toList();
    } catch (e) {
      throw CMSException('Failed to fetch templates: $e');
    }
  }

  Future<CMSContent> createContentFromTemplate(String templateId, Map<String, dynamic> variables) async {
    try {
      final response = await _apiService.post(
        '/api/cms/templates/$templateId/create',
        data: variables,
      );
      return CMSContent.fromJson(response.data);
    } catch (e) {
      throw CMSException('Failed to create content from template: $e');
    }
  }
}

class CMSException implements Exception {
  final String message;
  CMSException(this.message);

  @override
  String toString() => 'CMSException: $message';
}

class ContentAnalytics {
  final int totalViews;
  final int uniqueViews;
  final double avgTimeSpent;
  final double engagementRate;
  final Map<String, int> viewsByDay;
  final Map<String, int> sharesByPlatform;
  final List<TopContent> topContent;

  ContentAnalytics({
    required this.totalViews,
    required this.uniqueViews,
    required this.avgTimeSpent,
    required this.engagementRate,
    required this.viewsByDay,
    required this.sharesByPlatform,
    required this.topContent,
  });

  factory ContentAnalytics.fromJson(Map<String, dynamic> json) {
    return ContentAnalytics(
      totalViews: json['total_views'] ?? 0,
      uniqueViews: json['unique_views'] ?? 0,
      avgTimeSpent: (json['avg_time_spent'] ?? 0).toDouble(),
      engagementRate: (json['engagement_rate'] ?? 0).toDouble(),
      viewsByDay: Map<String, int>.from(json['views_by_day'] ?? {}),
      sharesByPlatform: Map<String, int>.from(json['shares_by_platform'] ?? {}),
      topContent: (json['top_content'] as List? ?? [])
          .map((item) => TopContent.fromJson(item))
          .toList(),
    );
  }
}

class TopContent {
  final String id;
  final String title;
  final int views;
  final double engagementRate;

  TopContent({
    required this.id,
    required this.title,
    required this.views,
    required this.engagementRate,
  });

  factory TopContent.fromJson(Map<String, dynamic> json) {
    return TopContent(
      id: json['id'],
      title: json['title'],
      views: json['views'] ?? 0,
      engagementRate: (json['engagement_rate'] ?? 0).toDouble(),
    );
  }
}

class ContentTemplate {
  final String id;
  final String name;
  final String description;
  final ContentType type;
  final Map<String, dynamic> structure;
  final List<String> variables;

  ContentTemplate({
    required this.id,
    required this.name,
    required this.description,
    required this.type,
    required this.structure,
    required this.variables,
  });

  factory ContentTemplate.fromJson(Map<String, dynamic> json) {
    return ContentTemplate(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      type: ContentType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => ContentType.article,
      ),
      structure: json['structure'] ?? {},
      variables: List<String>.from(json['variables'] ?? []),
    );
  }
}

// Provider
final cmsApiServiceProvider = Provider<CMSApiService>((ref) {
  final apiService = ref.read(apiServiceProvider);
  final cacheService = ref.read(cmsCacheServiceProvider);
  final syncService = ref.read(offlineSyncServiceProvider);

  return CMSApiService(
    apiService: apiService,
    cacheService: cacheService,
    syncService: syncService,
  );
});