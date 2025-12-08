import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_constants.dart';
import '../../../shared/models/coach_models.dart';

class CoachBookingService {
  final ApiService _apiService;

  CoachBookingService(this._apiService);

  // ============================================================================
  // Coach Profile Endpoints
  // ============================================================================

  /// Get all available coaches with optional filters
  Future<List<CoachProfile>> getCoaches({
    String? specialization,
    double? minRating,
    double? maxPrice,
    String? language,
    bool? isAvailable,
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };

      if (specialization != null) {
        queryParams['specialization'] = specialization;
      }
      if (minRating != null) queryParams['minRating'] = minRating;
      if (maxPrice != null) queryParams['maxPrice'] = maxPrice;
      if (language != null) queryParams['language'] = language;
      if (isAvailable != null) queryParams['isAvailable'] = isAvailable;
      if (search != null) queryParams['search'] = search;

      final response = await _apiService.get(
        ApiConstants.coachProfiles,
        queryParameters: queryParams,
      );

      final data = response.data as Map<String, dynamic>;
      final coaches = (data['coaches'] as List?)
              ?.map(
                  (json) => CoachProfile.fromJson(json as Map<String, dynamic>))
              .toList() ??
          [];

      return coaches;
    } catch (e) {
      debugPrint('Error fetching coaches: $e');
      rethrow;
    }
  }

  /// Get featured coaches for marketplace home
  Future<List<CoachProfile>> getFeaturedCoaches() async {
    try {
      final response = await _apiService.get(ApiConstants.coachFeatured);
      final data = response.data as Map<String, dynamic>;
      final coaches = (data['coaches'] as List?)
              ?.map(
                  (json) => CoachProfile.fromJson(json as Map<String, dynamic>))
              .toList() ??
          [];
      return coaches;
    } catch (e) {
      debugPrint('Error fetching featured coaches: $e');
      rethrow;
    }
  }

  /// Get a single coach profile by ID
  Future<CoachProfile> getCoachProfile(int coachId) async {
    try {
      final response =
          await _apiService.get('${ApiConstants.coachProfiles}/$coachId');
      final data = response.data as Map<String, dynamic>;
      return CoachProfile.fromJson(data['coach'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error fetching coach profile: $e');
      rethrow;
    }
  }

  /// Get coach availability for a specific date range
  Future<List<TimeSlot>> getCoachAvailability(
    int coachId, {
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      final response = await _apiService.get(
        '${ApiConstants.coachProfiles}/$coachId/availability',
        queryParameters: {
          'startDate': startDate.toIso8601String(),
          'endDate': endDate.toIso8601String(),
        },
      );
      final data = response.data as Map<String, dynamic>;
      final slots = (data['slots'] as List?)
              ?.map((json) => TimeSlot.fromJson(json as Map<String, dynamic>))
              .toList() ??
          [];
      return slots;
    } catch (e) {
      debugPrint('Error fetching availability: $e');
      rethrow;
    }
  }

  // ============================================================================
  // Coach Package Endpoints
  // ============================================================================

  /// Get all packages for a coach
  Future<List<CoachPackage>> getCoachPackages(int coachId) async {
    try {
      final response = await _apiService.get(
        ApiConstants.coachPackages,
        queryParameters: {'coachId': coachId},
      );
      final data = response.data as Map<String, dynamic>;
      final packages = (data['packages'] as List?)
              ?.map(
                  (json) => CoachPackage.fromJson(json as Map<String, dynamic>))
              .toList() ??
          [];
      return packages;
    } catch (e) {
      debugPrint('Error fetching coach packages: $e');
      rethrow;
    }
  }

  /// Purchase a coach package
  Future<ClientCoachPackage> purchasePackage(int packageId) async {
    try {
      final response = await _apiService.post(
        '${ApiConstants.coachPackages}/$packageId/purchase',
      );
      final data = response.data as Map<String, dynamic>;
      return ClientCoachPackage.fromJson(
          data['clientPackage'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error purchasing package: $e');
      rethrow;
    }
  }

  /// Get user's purchased packages
  Future<List<ClientCoachPackage>> getMyPackages() async {
    try {
      final response = await _apiService.get(ApiConstants.coachMyPackages);
      final data = response.data as Map<String, dynamic>;
      final packages = (data['packages'] as List?)
              ?.map((json) =>
                  ClientCoachPackage.fromJson(json as Map<String, dynamic>))
              .toList() ??
          [];
      return packages;
    } catch (e) {
      debugPrint('Error fetching my packages: $e');
      rethrow;
    }
  }

  // ============================================================================
  // Session Booking Endpoints
  // ============================================================================

  /// Book a new session
  Future<CoachSession> bookSession(BookingRequest request) async {
    try {
      final response = await _apiService.post(
        ApiConstants.coachSessions,
        data: request.toJson(),
      );
      final data = response.data as Map<String, dynamic>;
      return CoachSession.fromJson(data['session'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error booking session: $e');
      rethrow;
    }
  }

  /// Get user's sessions
  Future<List<CoachSession>> getMySessions({
    SessionStatus? status,
    bool? upcoming,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (status != null) queryParams['status'] = status.name;
      if (upcoming != null) queryParams['upcoming'] = upcoming;

      final response = await _apiService.get(
        ApiConstants.coachMySessions,
        queryParameters: queryParams,
      );
      final data = response.data as Map<String, dynamic>;
      final sessions = (data['sessions'] as List?)
              ?.map(
                  (json) => CoachSession.fromJson(json as Map<String, dynamic>))
              .toList() ??
          [];
      return sessions;
    } catch (e) {
      debugPrint('Error fetching my sessions: $e');
      rethrow;
    }
  }

  /// Get a single session by ID
  Future<CoachSession> getSession(int sessionId) async {
    try {
      final response =
          await _apiService.get('${ApiConstants.coachSessions}/$sessionId');
      final data = response.data as Map<String, dynamic>;
      return CoachSession.fromJson(data['session'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error fetching session: $e');
      rethrow;
    }
  }

  /// Cancel a session
  Future<CoachSession> cancelSession(int sessionId, {String? reason}) async {
    try {
      final response = await _apiService.post(
        '${ApiConstants.coachSessions}/$sessionId/cancel',
        data: {'reason': reason},
      );
      final data = response.data as Map<String, dynamic>;
      return CoachSession.fromJson(data['session'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error cancelling session: $e');
      rethrow;
    }
  }

  /// Reschedule a session
  Future<CoachSession> rescheduleSession(
    int sessionId, {
    required DateTime newScheduledAt,
  }) async {
    try {
      final response = await _apiService.patch(
        '${ApiConstants.coachSessions}/$sessionId/reschedule',
        data: {'scheduledAt': newScheduledAt.toIso8601String()},
      );
      final data = response.data as Map<String, dynamic>;
      return CoachSession.fromJson(data['session'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error rescheduling session: $e');
      rethrow;
    }
  }

  /// Add notes to a session
  Future<CoachSession> addSessionNotes(int sessionId, String notes) async {
    try {
      final response = await _apiService.patch(
        '${ApiConstants.coachSessions}/$sessionId/notes',
        data: {'clientNotes': notes},
      );
      final data = response.data as Map<String, dynamic>;
      return CoachSession.fromJson(data['session'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error adding session notes: $e');
      rethrow;
    }
  }

  /// Rate a completed session
  Future<CoachSession> rateSession(
    int sessionId, {
    required int rating,
    String? feedback,
  }) async {
    try {
      final response = await _apiService.post(
        '${ApiConstants.coachSessions}/$sessionId/rate',
        data: {
          'rating': rating,
          'feedback': feedback,
        },
      );
      final data = response.data as Map<String, dynamic>;
      return CoachSession.fromJson(data['session'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error rating session: $e');
      rethrow;
    }
  }

  // ============================================================================
  // Review Endpoints
  // ============================================================================

  /// Get reviews for a coach
  Future<CoachReviewsResult> getCoachReviews(
    int coachId, {
    String? sortBy,
    int? minRating,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (sortBy != null) queryParams['sortBy'] = sortBy;
      if (minRating != null) queryParams['minRating'] = minRating;

      final response = await _apiService.get(
        '${ApiConstants.coachReviews}/$coachId',
        queryParameters: queryParams,
      );
      final data = response.data as Map<String, dynamic>;
      final reviews = (data['reviews'] as List?)
              ?.map(
                  (json) => CoachReview.fromJson(json as Map<String, dynamic>))
              .toList() ??
          [];
      final total = data['total'] as int? ?? 0;

      return CoachReviewsResult(reviews: reviews, total: total);
    } catch (e) {
      debugPrint('Error fetching coach reviews: $e');
      rethrow;
    }
  }

  /// Get review statistics for a coach
  Future<ReviewStats> getReviewStats(int coachId) async {
    try {
      final response = await _apiService.get(
        '${ApiConstants.coachReviews}/$coachId/stats',
      );
      final data = response.data as Map<String, dynamic>;
      return ReviewStats.fromJson(data['stats'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error fetching review stats: $e');
      rethrow;
    }
  }

  /// Submit a review for a coach
  Future<CoachReview> submitReview({
    required int coachId,
    int? sessionId,
    required int rating,
    String? title,
    required String comment,
    int? communicationRating,
    int? knowledgeRating,
    int? helpfulnessRating,
  }) async {
    try {
      final response = await _apiService.post(
        ApiConstants.coachReviews,
        data: {
          'coachId': coachId,
          'sessionId': sessionId,
          'rating': rating,
          'title': title,
          'comment': comment,
          'communicationRating': communicationRating,
          'knowledgeRating': knowledgeRating,
          'helpfulnessRating': helpfulnessRating,
        },
      );
      final data = response.data as Map<String, dynamic>;
      return CoachReview.fromJson(data['review'] as Map<String, dynamic>);
    } catch (e) {
      debugPrint('Error submitting review: $e');
      rethrow;
    }
  }

  /// Mark a review as helpful
  Future<void> markReviewHelpful(int reviewId,
      {required bool isHelpful}) async {
    try {
      await _apiService.post(
        '${ApiConstants.coachReviews}/$reviewId/${isHelpful ? 'helpful' : 'unhelpful'}',
      );
    } catch (e) {
      debugPrint('Error marking review: $e');
      rethrow;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /// Get all available specializations
  Future<List<String>> getSpecializations() async {
    try {
      final response = await _apiService.get(ApiConstants.coachSpecializations);
      final data = response.data as Map<String, dynamic>;
      return List<String>.from(data['specializations'] as List? ?? []);
    } catch (e) {
      debugPrint('Error fetching specializations: $e');
      rethrow;
    }
  }

  /// Check if user has already reviewed a coach
  Future<bool> hasReviewedCoach(int coachId) async {
    try {
      final response = await _apiService.get(
        '${ApiConstants.coachReviews}/$coachId/check',
      );
      final data = response.data as Map<String, dynamic>;
      return data['hasReviewed'] as bool? ?? false;
    } catch (e) {
      debugPrint('Error checking review status: $e');
      return false;
    }
  }
}

// Provider for CoachBookingService
final coachBookingServiceProvider = Provider<CoachBookingService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return CoachBookingService(apiService);
});
