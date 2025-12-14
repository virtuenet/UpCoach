import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/coach_models.dart';
import '../services/coach_booking_service.dart';

// ============================================================================
// Coach List State
// ============================================================================

class CoachListState {
  final List<CoachProfile> coaches;
  final List<CoachProfile> featuredCoaches;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final int currentPage;
  final bool hasMore;
  final CoachFilters filters;

  const CoachListState({
    this.coaches = const [],
    this.featuredCoaches = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.currentPage = 1,
    this.hasMore = true,
    this.filters = const CoachFilters(),
  });

  CoachListState copyWith({
    List<CoachProfile>? coaches,
    List<CoachProfile>? featuredCoaches,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    int? currentPage,
    bool? hasMore,
    CoachFilters? filters,
  }) {
    return CoachListState(
      coaches: coaches ?? this.coaches,
      featuredCoaches: featuredCoaches ?? this.featuredCoaches,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error,
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
      filters: filters ?? this.filters,
    );
  }
}

class CoachFilters {
  final String? specialization;
  final double? minRating;
  final double? maxPrice;
  final String? language;
  final bool? isAvailable;
  final String? search;

  const CoachFilters({
    this.specialization,
    this.minRating,
    this.maxPrice,
    this.language,
    this.isAvailable,
    this.search,
  });

  CoachFilters copyWith({
    String? specialization,
    double? minRating,
    double? maxPrice,
    String? language,
    bool? isAvailable,
    String? search,
    bool clearSpecialization = false,
    bool clearMinRating = false,
    bool clearMaxPrice = false,
    bool clearLanguage = false,
    bool clearIsAvailable = false,
    bool clearSearch = false,
  }) {
    return CoachFilters(
      specialization:
          clearSpecialization ? null : (specialization ?? this.specialization),
      minRating: clearMinRating ? null : (minRating ?? this.minRating),
      maxPrice: clearMaxPrice ? null : (maxPrice ?? this.maxPrice),
      language: clearLanguage ? null : (language ?? this.language),
      isAvailable: clearIsAvailable ? null : (isAvailable ?? this.isAvailable),
      search: clearSearch ? null : (search ?? this.search),
    );
  }

  bool get hasFilters =>
      specialization != null ||
      minRating != null ||
      maxPrice != null ||
      language != null ||
      isAvailable != null ||
      search != null;
}

class CoachListNotifier extends Notifier<CoachListState> {
  late final CoachBookingService _service;

  @override
  CoachListState build() {
    _service = ref.watch(coachBookingServiceProvider);
    loadCoaches();
    loadFeaturedCoaches();
    return const CoachListState();
  }

  Future<void> loadCoaches({bool refresh = false}) async {
    if (state.isLoading) return;

    state = state.copyWith(
      isLoading: true,
      error: null,
      currentPage: refresh ? 1 : state.currentPage,
      coaches: refresh ? [] : state.coaches,
    );

    try {
      final coaches = await _service.getCoaches(
        page: 1,
        specialization: state.filters.specialization,
        minRating: state.filters.minRating,
        maxPrice: state.filters.maxPrice,
        language: state.filters.language,
        isAvailable: state.filters.isAvailable,
        search: state.filters.search,
      );

      state = state.copyWith(
        coaches: coaches,
        isLoading: false,
        currentPage: 1,
        hasMore: coaches.length >= 20,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> loadMoreCoaches() async {
    if (state.isLoadingMore || !state.hasMore) return;

    state = state.copyWith(isLoadingMore: true);

    try {
      final nextPage = state.currentPage + 1;
      final moreCoaches = await _service.getCoaches(
        page: nextPage,
        specialization: state.filters.specialization,
        minRating: state.filters.minRating,
        maxPrice: state.filters.maxPrice,
        language: state.filters.language,
        isAvailable: state.filters.isAvailable,
        search: state.filters.search,
      );

      state = state.copyWith(
        coaches: [...state.coaches, ...moreCoaches],
        isLoadingMore: false,
        currentPage: nextPage,
        hasMore: moreCoaches.length >= 20,
      );
    } catch (e) {
      state = state.copyWith(
        isLoadingMore: false,
        error: e.toString(),
      );
    }
  }

  Future<void> loadFeaturedCoaches() async {
    try {
      final featured = await _service.getFeaturedCoaches();
      state = state.copyWith(featuredCoaches: featured);
    } catch (e) {
      debugPrint('Error loading featured coaches: $e');
    }
  }

  void setFilters(CoachFilters filters) {
    state = state.copyWith(filters: filters);
    loadCoaches(refresh: true);
  }

  void clearFilters() {
    state = state.copyWith(filters: const CoachFilters());
    loadCoaches(refresh: true);
  }

  void search(String query) {
    final newFilters = state.filters.copyWith(
        search: query.isEmpty ? null : query, clearSearch: query.isEmpty);
    state = state.copyWith(filters: newFilters);
    loadCoaches(refresh: true);
  }
}

// ============================================================================
// Coach Detail State
// ============================================================================

class CoachDetailState {
  final CoachProfile? coach;
  final List<CoachPackage> packages;
  final List<CoachReview> reviews;
  final ReviewStats? reviewStats;
  final List<TimeSlot> availability;
  final bool isLoading;
  final bool isLoadingReviews;
  final String? error;
  final int reviewsPage;
  final int totalReviews;

  const CoachDetailState({
    this.coach,
    this.packages = const [],
    this.reviews = const [],
    this.reviewStats,
    this.availability = const [],
    this.isLoading = false,
    this.isLoadingReviews = false,
    this.error,
    this.reviewsPage = 1,
    this.totalReviews = 0,
  });

  CoachDetailState copyWith({
    CoachProfile? coach,
    List<CoachPackage>? packages,
    List<CoachReview>? reviews,
    ReviewStats? reviewStats,
    List<TimeSlot>? availability,
    bool? isLoading,
    bool? isLoadingReviews,
    String? error,
    int? reviewsPage,
    int? totalReviews,
  }) {
    return CoachDetailState(
      coach: coach ?? this.coach,
      packages: packages ?? this.packages,
      reviews: reviews ?? this.reviews,
      reviewStats: reviewStats ?? this.reviewStats,
      availability: availability ?? this.availability,
      isLoading: isLoading ?? this.isLoading,
      isLoadingReviews: isLoadingReviews ?? this.isLoadingReviews,
      error: error,
      reviewsPage: reviewsPage ?? this.reviewsPage,
      totalReviews: totalReviews ?? this.totalReviews,
    );
  }
}

class CoachDetailNotifier extends Notifier<CoachDetailState> {
  CoachDetailNotifier(this._coachId);

  final int _coachId;
  late final CoachBookingService _service;

  int get coachId => _coachId;

  @override
  CoachDetailState build() {
    _service = ref.watch(coachBookingServiceProvider);
    loadCoachDetail();
    return const CoachDetailState();
  }

  Future<void> loadCoachDetail() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // Load all data in parallel
      final results = await Future.wait([
        _service.getCoachProfile(coachId),
        _service.getCoachPackages(coachId),
        _service.getCoachReviews(coachId),
        _service.getReviewStats(coachId),
      ]);

      final coach = results[0] as CoachProfile;
      final packages = results[1] as List<CoachPackage>;
      final reviewsResult = results[2] as CoachReviewsResult;
      final reviewStats = results[3] as ReviewStats;

      state = state.copyWith(
        coach: coach,
        packages: packages,
        reviews: reviewsResult.reviews,
        totalReviews: reviewsResult.total,
        reviewStats: reviewStats,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> loadAvailability(DateTime startDate, DateTime endDate) async {
    try {
      final slots = await _service.getCoachAvailability(
        coachId,
        startDate: startDate,
        endDate: endDate,
      );
      state = state.copyWith(availability: slots);
    } catch (e) {
      debugPrint('Error loading availability: $e');
    }
  }

  Future<void> loadMoreReviews() async {
    if (state.isLoadingReviews) return;
    if (state.reviews.length >= state.totalReviews) return;

    state = state.copyWith(isLoadingReviews: true);

    try {
      final nextPage = state.reviewsPage + 1;
      final result = await _service.getCoachReviews(coachId, page: nextPage);

      state = state.copyWith(
        reviews: [...state.reviews, ...result.reviews],
        reviewsPage: nextPage,
        isLoadingReviews: false,
      );
    } catch (e) {
      state = state.copyWith(isLoadingReviews: false);
    }
  }
}

// ============================================================================
// Session Booking State
// ============================================================================

class SessionBookingState {
  final CoachProfile? coach;
  final SessionType? selectedSessionType;
  final DateTime? selectedDate;
  final TimeSlot? selectedTimeSlot;
  final int durationMinutes;
  final CoachPackage? selectedPackage;
  final String? clientNotes;
  final bool isBooking;
  final String? error;
  final CoachSession? bookedSession;

  const SessionBookingState({
    this.coach,
    this.selectedSessionType,
    this.selectedDate,
    this.selectedTimeSlot,
    this.durationMinutes = 60,
    this.selectedPackage,
    this.clientNotes,
    this.isBooking = false,
    this.error,
    this.bookedSession,
  });

  SessionBookingState copyWith({
    CoachProfile? coach,
    SessionType? selectedSessionType,
    DateTime? selectedDate,
    TimeSlot? selectedTimeSlot,
    int? durationMinutes,
    CoachPackage? selectedPackage,
    String? clientNotes,
    bool? isBooking,
    String? error,
    CoachSession? bookedSession,
    bool clearSessionType = false,
    bool clearDate = false,
    bool clearTimeSlot = false,
    bool clearPackage = false,
    bool clearNotes = false,
    bool clearError = false,
  }) {
    return SessionBookingState(
      coach: coach ?? this.coach,
      selectedSessionType: clearSessionType
          ? null
          : (selectedSessionType ?? this.selectedSessionType),
      selectedDate: clearDate ? null : (selectedDate ?? this.selectedDate),
      selectedTimeSlot:
          clearTimeSlot ? null : (selectedTimeSlot ?? this.selectedTimeSlot),
      durationMinutes: durationMinutes ?? this.durationMinutes,
      selectedPackage:
          clearPackage ? null : (selectedPackage ?? this.selectedPackage),
      clientNotes: clearNotes ? null : (clientNotes ?? this.clientNotes),
      isBooking: isBooking ?? this.isBooking,
      error: clearError ? null : (error ?? this.error),
      bookedSession: bookedSession ?? this.bookedSession,
    );
  }

  bool get canBook =>
      coach != null &&
      selectedSessionType != null &&
      selectedDate != null &&
      selectedTimeSlot != null;

  double get totalPrice {
    if (coach == null) return 0;
    if (selectedPackage != null) {
      return selectedPackage!.price / selectedPackage!.sessionCount;
    }
    return coach!.calculateSessionPrice(durationMinutes);
  }
}

class SessionBookingNotifier extends Notifier<SessionBookingState> {
  late final CoachBookingService _service;

  @override
  SessionBookingState build() {
    _service = ref.watch(coachBookingServiceProvider);
    return const SessionBookingState();
  }

  void setCoach(CoachProfile coach) {
    state = state.copyWith(coach: coach);
  }

  void setSessionType(SessionType type) {
    state = state.copyWith(selectedSessionType: type);
  }

  void setDate(DateTime date) {
    state = state.copyWith(selectedDate: date, clearTimeSlot: true);
  }

  void setTimeSlot(TimeSlot slot) {
    state = state.copyWith(selectedTimeSlot: slot);
  }

  void setDuration(int minutes) {
    state = state.copyWith(durationMinutes: minutes);
  }

  void setPackage(CoachPackage? package) {
    if (package == null) {
      state = state.copyWith(clearPackage: true);
    } else {
      state = state.copyWith(selectedPackage: package);
    }
  }

  void setClientNotes(String notes) {
    state = state.copyWith(clientNotes: notes);
  }

  void reset() {
    state = const SessionBookingState();
  }

  Future<bool> bookSession() async {
    if (!state.canBook) return false;

    state = state.copyWith(isBooking: true, clearError: true);

    try {
      final request = BookingRequest(
        coachId: state.coach!.id,
        title: 'Coaching Session with ${state.coach!.displayName}',
        sessionType: state.selectedSessionType!,
        scheduledAt: DateTime(
          state.selectedDate!.year,
          state.selectedDate!.month,
          state.selectedDate!.day,
          state.selectedTimeSlot!.startTime.hour,
          state.selectedTimeSlot!.startTime.minute,
        ),
        durationMinutes: state.durationMinutes,
        timezone: DateTime.now().timeZoneName,
        packageId: state.selectedPackage?.id,
        clientNotes: state.clientNotes,
      );

      final session = await _service.bookSession(request);
      state = state.copyWith(
        isBooking: false,
        bookedSession: session,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isBooking: false,
        error: e.toString(),
      );
      return false;
    }
  }
}

// ============================================================================
// My Sessions State
// ============================================================================

class MySessionsState {
  final List<CoachSession> upcomingSessions;
  final List<CoachSession> pastSessions;
  final List<ClientCoachPackage> myPackages;
  final bool isLoading;
  final String? error;

  const MySessionsState({
    this.upcomingSessions = const [],
    this.pastSessions = const [],
    this.myPackages = const [],
    this.isLoading = false,
    this.error,
  });

  MySessionsState copyWith({
    List<CoachSession>? upcomingSessions,
    List<CoachSession>? pastSessions,
    List<ClientCoachPackage>? myPackages,
    bool? isLoading,
    String? error,
  }) {
    return MySessionsState(
      upcomingSessions: upcomingSessions ?? this.upcomingSessions,
      pastSessions: pastSessions ?? this.pastSessions,
      myPackages: myPackages ?? this.myPackages,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class MySessionsNotifier extends Notifier<MySessionsState> {
  late final CoachBookingService _service;

  @override
  MySessionsState build() {
    _service = ref.watch(coachBookingServiceProvider);
    loadData();
    return const MySessionsState();
  }

  Future<void> loadData() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final results = await Future.wait([
        _service.getMySessions(upcoming: true),
        _service.getMySessions(upcoming: false),
        _service.getMyPackages(),
      ]);

      state = state.copyWith(
        upcomingSessions: results[0] as List<CoachSession>,
        pastSessions: results[1] as List<CoachSession>,
        myPackages: results[2] as List<ClientCoachPackage>,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<bool> cancelSession(int sessionId, {String? reason}) async {
    try {
      await _service.cancelSession(sessionId, reason: reason);
      await loadData();
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> rateSession(int sessionId, int rating,
      {String? feedback}) async {
    try {
      await _service.rateSession(sessionId, rating: rating, feedback: feedback);
      await loadData();
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> rescheduleSession(int sessionId,
      {required DateTime newScheduledAt}) async {
    try {
      await _service.rescheduleSession(sessionId,
          newScheduledAt: newScheduledAt);
      await loadData();
      return true;
    } catch (e) {
      return false;
    }
  }
}

// ============================================================================
// Providers
// ============================================================================

final coachListProvider =
    NotifierProvider<CoachListNotifier, CoachListState>(CoachListNotifier.new);

final coachDetailProvider =
    NotifierProvider.family<CoachDetailNotifier, CoachDetailState, int>(
        (coachId) => CoachDetailNotifier(coachId));

final sessionBookingProvider =
    NotifierProvider<SessionBookingNotifier, SessionBookingState>(
        SessionBookingNotifier.new);

final mySessionsProvider =
    NotifierProvider<MySessionsNotifier, MySessionsState>(
        MySessionsNotifier.new);

// Specializations provider
final specializationsProvider = FutureProvider<List<String>>((ref) async {
  final service = ref.watch(coachBookingServiceProvider);
  return service.getSpecializations();
});
