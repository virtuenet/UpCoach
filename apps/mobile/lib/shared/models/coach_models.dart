import 'package:freezed_annotation/freezed_annotation.dart';

part 'coach_models.freezed.dart';
part 'coach_models.g.dart';

// ============================================================================
// Enums
// ============================================================================

enum SessionType {
  @JsonValue('video')
  video,
  @JsonValue('audio')
  audio,
  @JsonValue('chat')
  chat,
  @JsonValue('in-person')
  inPerson,
}

enum SessionStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('confirmed')
  confirmed,
  @JsonValue('in-progress')
  inProgress,
  @JsonValue('completed')
  completed,
  @JsonValue('cancelled')
  cancelled,
}

enum PaymentStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('paid')
  paid,
  @JsonValue('refunded')
  refunded,
  @JsonValue('failed')
  failed,
}

enum PackageStatus {
  @JsonValue('active')
  active,
  @JsonValue('expired')
  expired,
  @JsonValue('cancelled')
  cancelled,
}

// ============================================================================
// Supporting Models
// ============================================================================

@freezed
abstract class AvailabilitySlot with _$AvailabilitySlot {
  const factory AvailabilitySlot({
    required String start,
    required String end,
  }) = _AvailabilitySlot;

  factory AvailabilitySlot.fromJson(Map<String, dynamic> json) =>
      _$AvailabilitySlotFromJson(json);
}

@freezed
abstract class AvailabilitySchedule with _$AvailabilitySchedule {
  const factory AvailabilitySchedule({
    @Default([]) List<AvailabilitySlot> monday,
    @Default([]) List<AvailabilitySlot> tuesday,
    @Default([]) List<AvailabilitySlot> wednesday,
    @Default([]) List<AvailabilitySlot> thursday,
    @Default([]) List<AvailabilitySlot> friday,
    @Default([]) List<AvailabilitySlot> saturday,
    @Default([]) List<AvailabilitySlot> sunday,
  }) = _AvailabilitySchedule;

  factory AvailabilitySchedule.fromJson(Map<String, dynamic> json) =>
      _$AvailabilityScheduleFromJson(json);
}

@freezed
abstract class Certification with _$Certification {
  const factory Certification({
    required String name,
    required String issuer,
    required String date,
    String? verificationUrl,
  }) = _Certification;

  factory Certification.fromJson(Map<String, dynamic> json) =>
      _$CertificationFromJson(json);
}

@freezed
abstract class SharedResource with _$SharedResource {
  const factory SharedResource({
    required String name,
    required String url,
    required String type,
    required DateTime uploadedAt,
  }) = _SharedResource;

  factory SharedResource.fromJson(Map<String, dynamic> json) =>
      _$SharedResourceFromJson(json);
}

// ============================================================================
// Coach Profile Model
// ============================================================================

@freezed
abstract class CoachProfile with _$CoachProfile {
  const CoachProfile._();

  const factory CoachProfile({
    required int id,
    required int userId,
    required String displayName,
    String? title,
    String? bio,
    @Default([]) List<String> specializations,
    @Default([]) List<Certification> certifications,
    @Default(0) int experienceYears,
    @Default(['en']) List<String> languages,
    @Default('UTC') String timezone,

    // Availability & Booking
    @Default(true) bool isAvailable,
    double? hourlyRate,
    @Default('USD') String currency,
    @Default(1.0) double minBookingHours,
    @Default(4.0) double maxBookingHours,
    AvailabilitySchedule? availabilitySchedule,
    @Default(24) int bookingBufferHours,

    // Profile Media
    String? profileImageUrl,
    String? coverImageUrl,
    String? introVideoUrl,
    @Default([]) List<String> galleryImages,

    // Stats & Rating
    @Default(0) int totalSessions,
    @Default(0) int totalClients,
    @Default(0.0) double averageRating,
    @Default(0) int ratingCount,
    double? responseTimeHours,

    // Settings
    @Default(false) bool isVerified,
    @Default(false) bool isFeatured,
    @Default(true) bool isActive,
    @Default(false) bool acceptsInsurance,
    @Default(['card']) List<String> acceptedPaymentMethods,

    // Metadata
    @Default([]) List<String> tags,
    String? seoSlug,

    // Timestamps
    DateTime? createdAt,
    DateTime? updatedAt,

    // Related data (may be loaded separately)
    @Default([]) List<CoachPackage> packages,
    @Default([]) List<CoachReview> reviews,
  }) = _CoachProfile;

  factory CoachProfile.fromJson(Map<String, dynamic> json) =>
      _$CoachProfileFromJson(json);

  // Helper methods
  String get formattedHourlyRate {
    if (hourlyRate == null) return 'Contact for pricing';
    return '\$${hourlyRate!.toStringAsFixed(0)}/hr';
  }

  String get formattedRating {
    if (ratingCount == 0) return 'No reviews yet';
    return '${averageRating.toStringAsFixed(1)} ($ratingCount reviews)';
  }

  double calculateSessionPrice(int durationMinutes) {
    if (hourlyRate == null) return 0;
    final hours = durationMinutes / 60;
    return double.parse((hourlyRate! * hours).toStringAsFixed(2));
  }

  bool isAvailableOnDay(String day) {
    if (availabilitySchedule == null) return false;
    List<AvailabilitySlot> slots;
    switch (day.toLowerCase()) {
      case 'monday':
        slots = availabilitySchedule!.monday;
        break;
      case 'tuesday':
        slots = availabilitySchedule!.tuesday;
        break;
      case 'wednesday':
        slots = availabilitySchedule!.wednesday;
        break;
      case 'thursday':
        slots = availabilitySchedule!.thursday;
        break;
      case 'friday':
        slots = availabilitySchedule!.friday;
        break;
      case 'saturday':
        slots = availabilitySchedule!.saturday;
        break;
      case 'sunday':
        slots = availabilitySchedule!.sunday;
        break;
      default:
        slots = <AvailabilitySlot>[];
    }
    return slots.isNotEmpty;
  }
}

// ============================================================================
// Coach Session Model
// ============================================================================

@freezed
abstract class CoachSession with _$CoachSession {
  const CoachSession._();

  const factory CoachSession({
    required int id,
    required int coachId,
    required int clientId,

    // Session Details
    required String title,
    String? description,
    required SessionType sessionType,
    @Default(SessionStatus.pending) SessionStatus status,

    // Timing
    required DateTime scheduledAt,
    required int durationMinutes,
    DateTime? actualStartTime,
    DateTime? actualEndTime,
    required String timezone,

    // Meeting Details
    String? meetingUrl,
    String? meetingPassword,
    String? locationAddress,

    // Pricing
    required double hourlyRate,
    required double totalAmount,
    @Default('USD') String currency,
    @Default(PaymentStatus.pending) PaymentStatus paymentStatus,
    String? paymentId,

    // Notes & Resources
    String? coachNotes,
    String? clientNotes,
    @Default([]) List<SharedResource> sharedResources,

    // Feedback
    int? clientRating,
    String? clientFeedback,
    int? coachRating,
    String? coachFeedback,

    // Cancellation
    String? cancellationReason,
    String? cancelledBy,
    DateTime? cancelledAt,

    // Timestamps
    DateTime? createdAt,
    DateTime? updatedAt,

    // Related data
    CoachProfile? coach,
  }) = _CoachSession;

  factory CoachSession.fromJson(Map<String, dynamic> json) =>
      _$CoachSessionFromJson(json);

  // Helper methods
  bool get canBeCancelled {
    if (status == SessionStatus.completed ||
        status == SessionStatus.cancelled) {
      return false;
    }
    final hoursUntilSession = scheduledAt.difference(DateTime.now()).inHours;
    return hoursUntilSession >= 24;
  }

  bool get canBeRescheduled {
    if (status != SessionStatus.pending && status != SessionStatus.confirmed) {
      return false;
    }
    final hoursUntilSession = scheduledAt.difference(DateTime.now()).inHours;
    return hoursUntilSession >= 48;
  }

  bool get isUpcoming {
    return scheduledAt.isAfter(DateTime.now()) &&
        (status == SessionStatus.pending || status == SessionStatus.confirmed);
  }

  bool get isPast {
    return scheduledAt.isBefore(DateTime.now()) ||
        status == SessionStatus.completed;
  }

  bool get canJoinCall {
    if (status != SessionStatus.confirmed) return false;
    // Allow joining 15 minutes before scheduled time until session end
    final now = DateTime.now();
    final joinableStart = scheduledAt.subtract(const Duration(minutes: 15));
    final sessionEnd = scheduledAt.add(Duration(minutes: durationMinutes));
    return now.isAfter(joinableStart) && now.isBefore(sessionEnd);
  }

  String get formattedDuration {
    final hours = durationMinutes ~/ 60;
    final minutes = durationMinutes % 60;
    if (hours > 0 && minutes > 0) {
      return '${hours}h ${minutes}m';
    } else if (hours > 0) {
      return '${hours}h';
    } else {
      return '${minutes}m';
    }
  }

  String get formattedPrice {
    return '\$${totalAmount.toStringAsFixed(2)}';
  }

  String get sessionTypeLabel {
    switch (sessionType) {
      case SessionType.video:
        return 'Video Call';
      case SessionType.audio:
        return 'Audio Call';
      case SessionType.chat:
        return 'Chat Session';
      case SessionType.inPerson:
        return 'In-Person';
    }
  }

  String get statusLabel {
    switch (status) {
      case SessionStatus.pending:
        return 'Pending';
      case SessionStatus.confirmed:
        return 'Confirmed';
      case SessionStatus.inProgress:
        return 'In Progress';
      case SessionStatus.completed:
        return 'Completed';
      case SessionStatus.cancelled:
        return 'Cancelled';
    }
  }
}

// ============================================================================
// Coach Package Model
// ============================================================================

@freezed
abstract class CoachPackage with _$CoachPackage {
  const CoachPackage._();

  const factory CoachPackage({
    required int id,
    required int coachId,
    required String name,
    String? description,

    // Package Details
    required int sessionCount,
    required int validityDays,
    required double price,
    @Default('USD') String currency,

    // Savings
    double? originalPrice,
    double? discountPercentage,

    // Limits
    @Default(1) int maxPurchasesPerClient,
    int? totalAvailable,
    @Default(0) int totalSold,
    @Default(true) bool isActive,

    // Timestamps
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _CoachPackage;

  factory CoachPackage.fromJson(Map<String, dynamic> json) =>
      _$CoachPackageFromJson(json);

  // Helper methods
  bool get isAvailable {
    if (!isActive) return false;
    if (totalAvailable != null && totalSold >= totalAvailable!) return false;
    return true;
  }

  double get savingsAmount {
    if (originalPrice == null) return 0;
    return double.parse((originalPrice! - price).toStringAsFixed(2));
  }

  String get formattedPrice {
    return '\$${price.toStringAsFixed(2)}';
  }

  String get formattedOriginalPrice {
    if (originalPrice == null) return '';
    return '\$${originalPrice!.toStringAsFixed(2)}';
  }

  String get formattedDiscount {
    if (discountPercentage == null) return '';
    return '${discountPercentage!.toStringAsFixed(0)}% off';
  }

  String get pricePerSession {
    final perSession = price / sessionCount;
    return '\$${perSession.toStringAsFixed(2)}/session';
  }

  String get validityDescription {
    if (validityDays == 30) return '1 month';
    if (validityDays == 60) return '2 months';
    if (validityDays == 90) return '3 months';
    if (validityDays == 180) return '6 months';
    if (validityDays == 365) return '1 year';
    return '$validityDays days';
  }
}

// ============================================================================
// Client Coach Package Model (Purchased Package)
// ============================================================================

@freezed
abstract class ClientCoachPackage with _$ClientCoachPackage {
  const ClientCoachPackage._();

  const factory ClientCoachPackage({
    required int id,
    required int packageId,
    required int clientId,
    required DateTime purchaseDate,
    required DateTime expiryDate,
    @Default(0) int sessionsUsed,
    required int sessionsRemaining,
    String? paymentId,
    required double amountPaid,
    @Default(PackageStatus.active) PackageStatus status,

    // Related data
    CoachPackage? package,
  }) = _ClientCoachPackage;

  factory ClientCoachPackage.fromJson(Map<String, dynamic> json) =>
      _$ClientCoachPackageFromJson(json);

  // Helper methods
  bool get isValid {
    return status == PackageStatus.active &&
        expiryDate.isAfter(DateTime.now()) &&
        sessionsRemaining > 0;
  }

  int get daysRemaining {
    final now = DateTime.now();
    final days = expiryDate.difference(now).inDays;
    return days > 0 ? days : 0;
  }

  double get usagePercentage {
    final total = sessionsUsed + sessionsRemaining;
    if (total == 0) return 0;
    return sessionsUsed / total;
  }
}

// ============================================================================
// Coach Review Model
// ============================================================================

@freezed
abstract class CoachReview with _$CoachReview {
  const CoachReview._();

  const factory CoachReview({
    required int id,
    required int coachId,
    required int clientId,
    int? sessionId,

    // Ratings
    required int rating,
    String? title,
    required String comment,

    // Detailed Ratings
    int? communicationRating,
    int? knowledgeRating,
    int? helpfulnessRating,

    // Status Flags
    @Default(false) bool isVerified,
    @Default(false) bool isFeatured,
    @Default(true) bool isVisible,

    // Coach Response
    String? coachResponse,
    DateTime? coachResponseAt,

    // Engagement Metrics
    @Default(0) int helpfulCount,
    @Default(0) int unhelpfulCount,

    // Timestamps
    DateTime? createdAt,
    DateTime? updatedAt,

    // Related data
    String? clientName,
    String? clientProfileImageUrl,
  }) = _CoachReview;

  factory CoachReview.fromJson(Map<String, dynamic> json) =>
      _$CoachReviewFromJson(json);

  // Helper methods
  String get timeAgo {
    if (createdAt == null) return '';
    final now = DateTime.now();
    final difference = now.difference(createdAt!);

    if (difference.inDays > 365) {
      final years = (difference.inDays / 365).floor();
      return '$years year${years > 1 ? 's' : ''} ago';
    } else if (difference.inDays > 30) {
      final months = (difference.inDays / 30).floor();
      return '$months month${months > 1 ? 's' : ''} ago';
    } else if (difference.inDays > 0) {
      return '${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago';
    } else {
      return 'Just now';
    }
  }

  double get averageDetailedRating {
    final ratings = [communicationRating, knowledgeRating, helpfulnessRating]
        .where((r) => r != null)
        .map((r) => r!)
        .toList();
    if (ratings.isEmpty) return rating.toDouble();
    return ratings.reduce((a, b) => a + b) / ratings.length;
  }
}

// ============================================================================
// Review Stats Model
// ============================================================================

@freezed
abstract class ReviewStats with _$ReviewStats {
  const factory ReviewStats({
    @Default(0) int totalReviews,
    @Default(0.0) double averageRating,
    @Default({}) Map<String, int> ratingDistribution,
    DetailedRatings? detailedRatings,
  }) = _ReviewStats;

  factory ReviewStats.fromJson(Map<String, dynamic> json) =>
      _$ReviewStatsFromJson(json);
}

@freezed
abstract class DetailedRatings with _$DetailedRatings {
  const factory DetailedRatings({
    @Default(0.0) double communication,
    @Default(0.0) double knowledge,
    @Default(0.0) double helpfulness,
  }) = _DetailedRatings;

  factory DetailedRatings.fromJson(Map<String, dynamic> json) =>
      _$DetailedRatingsFromJson(json);
}

// ============================================================================
// Coach Reviews Result (for paginated reviews)
// ============================================================================

class CoachReviewsResult {
  final List<CoachReview> reviews;
  final int total;

  const CoachReviewsResult({
    required this.reviews,
    required this.total,
  });
}

// ============================================================================
// Time Slot Model (for booking)
// ============================================================================

@freezed
abstract class TimeSlot with _$TimeSlot {
  const factory TimeSlot({
    required DateTime startTime,
    required DateTime endTime,
    @Default(true) bool isAvailable,
  }) = _TimeSlot;

  factory TimeSlot.fromJson(Map<String, dynamic> json) =>
      _$TimeSlotFromJson(json);
}

// ============================================================================
// Booking Request Model
// ============================================================================

@freezed
abstract class BookingRequest with _$BookingRequest {
  const factory BookingRequest({
    required int coachId,
    required String title,
    String? description,
    required SessionType sessionType,
    required DateTime scheduledAt,
    required int durationMinutes,
    required String timezone,
    int? packageId,
    String? clientNotes,
  }) = _BookingRequest;

  factory BookingRequest.fromJson(Map<String, dynamic> json) =>
      _$BookingRequestFromJson(json);
}
