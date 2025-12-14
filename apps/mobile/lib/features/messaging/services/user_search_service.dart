import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/providers/dio_provider.dart';
import '../../../core/utils/api_exception.dart';
import '../../../core/utils/logger.dart';

part 'user_search_service.g.dart';

/// Represents a searchable user contact
class UserContact {
  final String id;
  final String displayName;
  final String? email;
  final String? avatarUrl;
  final bool isOnline;
  final String? role;
  final bool isCoach;

  const UserContact({
    required this.id,
    required this.displayName,
    this.email,
    this.avatarUrl,
    this.isOnline = false,
    this.role,
    this.isCoach = false,
  });

  factory UserContact.fromJson(Map<String, dynamic> json) {
    return UserContact(
      id: json['id'] as String,
      displayName: json['display_name'] as String? ??
          json['name'] as String? ??
          json['email'] as String? ??
          'Unknown',
      email: json['email'] as String?,
      avatarUrl: json['avatar_url'] as String? ?? json['avatarUrl'] as String?,
      isOnline: json['is_online'] as bool? ?? json['isOnline'] as bool? ?? false,
      role: json['role'] as String?,
      isCoach: json['is_coach'] as bool? ?? json['isCoach'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'display_name': displayName,
        'email': email,
        'avatar_url': avatarUrl,
        'is_online': isOnline,
        'role': role,
        'is_coach': isCoach,
      };
}

/// Service for searching users to start conversations with
@riverpod
UserSearchService userSearchService(Ref ref) {
  final dio = ref.watch(dioProvider);
  return UserSearchService(dio);
}

class UserSearchService {
  final Dio _dio;
  static const String _baseEndpoint = '/users';

  /// Debounce duration for search queries
  static const Duration _debounceDuration = Duration(milliseconds: 300);

  /// Cache for recent search results
  final Map<String, List<UserContact>> _searchCache = {};

  /// Debounce timer
  Timer? _debounceTimer;

  UserSearchService(this._dio);

  /// Search for users by name or email
  ///
  /// [query] - Search term (min 2 characters)
  /// [limit] - Maximum results to return (default 20)
  /// [excludeCurrentUser] - Exclude the authenticated user from results
  /// [coachesOnly] - Only return coaches
  Future<List<UserContact>> searchUsers({
    required String query,
    int limit = 20,
    bool excludeCurrentUser = true,
    bool coachesOnly = false,
  }) async {
    // Validate query length
    if (query.length < 2) {
      return [];
    }

    // Check cache first
    final cacheKey = '${query.toLowerCase()}_${limit}_$coachesOnly';
    if (_searchCache.containsKey(cacheKey)) {
      debugPrint('UserSearchService: Cache hit for "$query"');
      return _searchCache[cacheKey]!;
    }

    try {
      final response = await _dio.get(
        '$_baseEndpoint/search',
        queryParameters: {
          'q': query,
          'limit': limit,
          if (excludeCurrentUser) 'exclude_self': true,
          if (coachesOnly) 'coaches_only': true,
        },
      );

      final List<dynamic> data = response.data['data'] ?? [];
      final results = data.map((json) => UserContact.fromJson(json)).toList();

      // Cache results for 5 minutes
      _searchCache[cacheKey] = results;
      Future.delayed(const Duration(minutes: 5), () {
        _searchCache.remove(cacheKey);
      });

      return results;
    } on DioException catch (e) {
      logger.e('Failed to search users', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  /// Search users with debouncing (for use with text input)
  ///
  /// Returns a Future that completes after debounce delay.
  /// Useful for real-time search as user types.
  Future<List<UserContact>> searchUsersDebounced({
    required String query,
    int limit = 20,
    bool excludeCurrentUser = true,
    bool coachesOnly = false,
  }) async {
    // Cancel previous debounce timer
    _debounceTimer?.cancel();

    // Create completer for this search
    final completer = Completer<List<UserContact>>();

    _debounceTimer = Timer(_debounceDuration, () async {
      try {
        final results = await searchUsers(
          query: query,
          limit: limit,
          excludeCurrentUser: excludeCurrentUser,
          coachesOnly: coachesOnly,
        );
        completer.complete(results);
      } catch (e) {
        completer.completeError(e);
      }
    });

    return completer.future;
  }

  /// Get suggested contacts (coaches, recent conversations)
  Future<List<UserContact>> getSuggestedContacts({int limit = 10}) async {
    try {
      final response = await _dio.get(
        '$_baseEndpoint/suggested',
        queryParameters: {'limit': limit},
      );

      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((json) => UserContact.fromJson(json)).toList();
    } on DioException catch (e) {
      logger.e('Failed to get suggested contacts', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  /// Get user's connected coaches
  Future<List<UserContact>> getMyCoaches() async {
    try {
      final response = await _dio.get('$_baseEndpoint/my-coaches');

      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((json) => UserContact.fromJson(json)).toList();
    } on DioException catch (e) {
      logger.e('Failed to get coaches', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  /// Get user's clients (for coaches)
  Future<List<UserContact>> getMyClients() async {
    try {
      final response = await _dio.get('$_baseEndpoint/my-clients');

      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((json) => UserContact.fromJson(json)).toList();
    } on DioException catch (e) {
      logger.e('Failed to get clients', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  /// Clear search cache
  void clearCache() {
    _searchCache.clear();
  }

  /// Dispose resources
  void dispose() {
    _debounceTimer?.cancel();
    _searchCache.clear();
  }
}
