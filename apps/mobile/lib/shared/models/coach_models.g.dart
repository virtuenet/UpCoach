// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'coach_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AvailabilitySlot _$AvailabilitySlotFromJson(Map<String, dynamic> json) =>
    _AvailabilitySlot(
      start: json['start'] as String,
      end: json['end'] as String,
    );

Map<String, dynamic> _$AvailabilitySlotToJson(_AvailabilitySlot instance) =>
    <String, dynamic>{'start': instance.start, 'end': instance.end};

_AvailabilitySchedule _$AvailabilityScheduleFromJson(
  Map<String, dynamic> json,
) => _AvailabilitySchedule(
  monday:
      (json['monday'] as List<dynamic>?)
          ?.map((e) => AvailabilitySlot.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  tuesday:
      (json['tuesday'] as List<dynamic>?)
          ?.map((e) => AvailabilitySlot.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  wednesday:
      (json['wednesday'] as List<dynamic>?)
          ?.map((e) => AvailabilitySlot.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  thursday:
      (json['thursday'] as List<dynamic>?)
          ?.map((e) => AvailabilitySlot.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  friday:
      (json['friday'] as List<dynamic>?)
          ?.map((e) => AvailabilitySlot.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  saturday:
      (json['saturday'] as List<dynamic>?)
          ?.map((e) => AvailabilitySlot.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  sunday:
      (json['sunday'] as List<dynamic>?)
          ?.map((e) => AvailabilitySlot.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
);

Map<String, dynamic> _$AvailabilityScheduleToJson(
  _AvailabilitySchedule instance,
) => <String, dynamic>{
  'monday': instance.monday,
  'tuesday': instance.tuesday,
  'wednesday': instance.wednesday,
  'thursday': instance.thursday,
  'friday': instance.friday,
  'saturday': instance.saturday,
  'sunday': instance.sunday,
};

_Certification _$CertificationFromJson(Map<String, dynamic> json) =>
    _Certification(
      name: json['name'] as String,
      issuer: json['issuer'] as String,
      date: json['date'] as String,
      verificationUrl: json['verificationUrl'] as String?,
    );

Map<String, dynamic> _$CertificationToJson(_Certification instance) =>
    <String, dynamic>{
      'name': instance.name,
      'issuer': instance.issuer,
      'date': instance.date,
      'verificationUrl': instance.verificationUrl,
    };

_SharedResource _$SharedResourceFromJson(Map<String, dynamic> json) =>
    _SharedResource(
      name: json['name'] as String,
      url: json['url'] as String,
      type: json['type'] as String,
      uploadedAt: DateTime.parse(json['uploadedAt'] as String),
    );

Map<String, dynamic> _$SharedResourceToJson(_SharedResource instance) =>
    <String, dynamic>{
      'name': instance.name,
      'url': instance.url,
      'type': instance.type,
      'uploadedAt': instance.uploadedAt.toIso8601String(),
    };

_CoachProfile _$CoachProfileFromJson(Map<String, dynamic> json) =>
    _CoachProfile(
      id: (json['id'] as num).toInt(),
      userId: (json['userId'] as num).toInt(),
      displayName: json['displayName'] as String,
      title: json['title'] as String?,
      bio: json['bio'] as String?,
      specializations:
          (json['specializations'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      certifications:
          (json['certifications'] as List<dynamic>?)
              ?.map((e) => Certification.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      experienceYears: (json['experienceYears'] as num?)?.toInt() ?? 0,
      languages:
          (json['languages'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const ['en'],
      timezone: json['timezone'] as String? ?? 'UTC',
      isAvailable: json['isAvailable'] as bool? ?? true,
      hourlyRate: (json['hourlyRate'] as num?)?.toDouble(),
      currency: json['currency'] as String? ?? 'USD',
      minBookingHours: (json['minBookingHours'] as num?)?.toDouble() ?? 1.0,
      maxBookingHours: (json['maxBookingHours'] as num?)?.toDouble() ?? 4.0,
      availabilitySchedule: json['availabilitySchedule'] == null
          ? null
          : AvailabilitySchedule.fromJson(
              json['availabilitySchedule'] as Map<String, dynamic>,
            ),
      bookingBufferHours: (json['bookingBufferHours'] as num?)?.toInt() ?? 24,
      profileImageUrl: json['profileImageUrl'] as String?,
      coverImageUrl: json['coverImageUrl'] as String?,
      introVideoUrl: json['introVideoUrl'] as String?,
      galleryImages:
          (json['galleryImages'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      totalSessions: (json['totalSessions'] as num?)?.toInt() ?? 0,
      totalClients: (json['totalClients'] as num?)?.toInt() ?? 0,
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0.0,
      ratingCount: (json['ratingCount'] as num?)?.toInt() ?? 0,
      responseTimeHours: (json['responseTimeHours'] as num?)?.toDouble(),
      isVerified: json['isVerified'] as bool? ?? false,
      isFeatured: json['isFeatured'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
      acceptsInsurance: json['acceptsInsurance'] as bool? ?? false,
      acceptedPaymentMethods:
          (json['acceptedPaymentMethods'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const ['card'],
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ??
          const [],
      seoSlug: json['seoSlug'] as String?,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
      packages:
          (json['packages'] as List<dynamic>?)
              ?.map((e) => CoachPackage.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      reviews:
          (json['reviews'] as List<dynamic>?)
              ?.map((e) => CoachReview.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$CoachProfileToJson(_CoachProfile instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'displayName': instance.displayName,
      'title': instance.title,
      'bio': instance.bio,
      'specializations': instance.specializations,
      'certifications': instance.certifications,
      'experienceYears': instance.experienceYears,
      'languages': instance.languages,
      'timezone': instance.timezone,
      'isAvailable': instance.isAvailable,
      'hourlyRate': instance.hourlyRate,
      'currency': instance.currency,
      'minBookingHours': instance.minBookingHours,
      'maxBookingHours': instance.maxBookingHours,
      'availabilitySchedule': instance.availabilitySchedule,
      'bookingBufferHours': instance.bookingBufferHours,
      'profileImageUrl': instance.profileImageUrl,
      'coverImageUrl': instance.coverImageUrl,
      'introVideoUrl': instance.introVideoUrl,
      'galleryImages': instance.galleryImages,
      'totalSessions': instance.totalSessions,
      'totalClients': instance.totalClients,
      'averageRating': instance.averageRating,
      'ratingCount': instance.ratingCount,
      'responseTimeHours': instance.responseTimeHours,
      'isVerified': instance.isVerified,
      'isFeatured': instance.isFeatured,
      'isActive': instance.isActive,
      'acceptsInsurance': instance.acceptsInsurance,
      'acceptedPaymentMethods': instance.acceptedPaymentMethods,
      'tags': instance.tags,
      'seoSlug': instance.seoSlug,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'packages': instance.packages,
      'reviews': instance.reviews,
    };

_CoachSession _$CoachSessionFromJson(Map<String, dynamic> json) =>
    _CoachSession(
      id: (json['id'] as num).toInt(),
      coachId: (json['coachId'] as num).toInt(),
      clientId: (json['clientId'] as num).toInt(),
      title: json['title'] as String,
      description: json['description'] as String?,
      sessionType: $enumDecode(_$SessionTypeEnumMap, json['sessionType']),
      status:
          $enumDecodeNullable(_$SessionStatusEnumMap, json['status']) ??
          SessionStatus.pending,
      scheduledAt: DateTime.parse(json['scheduledAt'] as String),
      durationMinutes: (json['durationMinutes'] as num).toInt(),
      actualStartTime: json['actualStartTime'] == null
          ? null
          : DateTime.parse(json['actualStartTime'] as String),
      actualEndTime: json['actualEndTime'] == null
          ? null
          : DateTime.parse(json['actualEndTime'] as String),
      timezone: json['timezone'] as String,
      meetingUrl: json['meetingUrl'] as String?,
      meetingPassword: json['meetingPassword'] as String?,
      locationAddress: json['locationAddress'] as String?,
      hourlyRate: (json['hourlyRate'] as num).toDouble(),
      totalAmount: (json['totalAmount'] as num).toDouble(),
      currency: json['currency'] as String? ?? 'USD',
      paymentStatus:
          $enumDecodeNullable(_$PaymentStatusEnumMap, json['paymentStatus']) ??
          PaymentStatus.pending,
      paymentId: json['paymentId'] as String?,
      coachNotes: json['coachNotes'] as String?,
      clientNotes: json['clientNotes'] as String?,
      sharedResources:
          (json['sharedResources'] as List<dynamic>?)
              ?.map((e) => SharedResource.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      clientRating: (json['clientRating'] as num?)?.toInt(),
      clientFeedback: json['clientFeedback'] as String?,
      coachRating: (json['coachRating'] as num?)?.toInt(),
      coachFeedback: json['coachFeedback'] as String?,
      cancellationReason: json['cancellationReason'] as String?,
      cancelledBy: json['cancelledBy'] as String?,
      cancelledAt: json['cancelledAt'] == null
          ? null
          : DateTime.parse(json['cancelledAt'] as String),
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
      coach: json['coach'] == null
          ? null
          : CoachProfile.fromJson(json['coach'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$CoachSessionToJson(_CoachSession instance) =>
    <String, dynamic>{
      'id': instance.id,
      'coachId': instance.coachId,
      'clientId': instance.clientId,
      'title': instance.title,
      'description': instance.description,
      'sessionType': _$SessionTypeEnumMap[instance.sessionType]!,
      'status': _$SessionStatusEnumMap[instance.status]!,
      'scheduledAt': instance.scheduledAt.toIso8601String(),
      'durationMinutes': instance.durationMinutes,
      'actualStartTime': instance.actualStartTime?.toIso8601String(),
      'actualEndTime': instance.actualEndTime?.toIso8601String(),
      'timezone': instance.timezone,
      'meetingUrl': instance.meetingUrl,
      'meetingPassword': instance.meetingPassword,
      'locationAddress': instance.locationAddress,
      'hourlyRate': instance.hourlyRate,
      'totalAmount': instance.totalAmount,
      'currency': instance.currency,
      'paymentStatus': _$PaymentStatusEnumMap[instance.paymentStatus]!,
      'paymentId': instance.paymentId,
      'coachNotes': instance.coachNotes,
      'clientNotes': instance.clientNotes,
      'sharedResources': instance.sharedResources,
      'clientRating': instance.clientRating,
      'clientFeedback': instance.clientFeedback,
      'coachRating': instance.coachRating,
      'coachFeedback': instance.coachFeedback,
      'cancellationReason': instance.cancellationReason,
      'cancelledBy': instance.cancelledBy,
      'cancelledAt': instance.cancelledAt?.toIso8601String(),
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'coach': instance.coach,
    };

const _$SessionTypeEnumMap = {
  SessionType.video: 'video',
  SessionType.audio: 'audio',
  SessionType.chat: 'chat',
  SessionType.inPerson: 'in-person',
};

const _$SessionStatusEnumMap = {
  SessionStatus.pending: 'pending',
  SessionStatus.confirmed: 'confirmed',
  SessionStatus.inProgress: 'in-progress',
  SessionStatus.completed: 'completed',
  SessionStatus.cancelled: 'cancelled',
};

const _$PaymentStatusEnumMap = {
  PaymentStatus.pending: 'pending',
  PaymentStatus.paid: 'paid',
  PaymentStatus.refunded: 'refunded',
  PaymentStatus.failed: 'failed',
};

_CoachPackage _$CoachPackageFromJson(Map<String, dynamic> json) =>
    _CoachPackage(
      id: (json['id'] as num).toInt(),
      coachId: (json['coachId'] as num).toInt(),
      name: json['name'] as String,
      description: json['description'] as String?,
      sessionCount: (json['sessionCount'] as num).toInt(),
      validityDays: (json['validityDays'] as num).toInt(),
      price: (json['price'] as num).toDouble(),
      currency: json['currency'] as String? ?? 'USD',
      originalPrice: (json['originalPrice'] as num?)?.toDouble(),
      discountPercentage: (json['discountPercentage'] as num?)?.toDouble(),
      maxPurchasesPerClient:
          (json['maxPurchasesPerClient'] as num?)?.toInt() ?? 1,
      totalAvailable: (json['totalAvailable'] as num?)?.toInt(),
      totalSold: (json['totalSold'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$CoachPackageToJson(_CoachPackage instance) =>
    <String, dynamic>{
      'id': instance.id,
      'coachId': instance.coachId,
      'name': instance.name,
      'description': instance.description,
      'sessionCount': instance.sessionCount,
      'validityDays': instance.validityDays,
      'price': instance.price,
      'currency': instance.currency,
      'originalPrice': instance.originalPrice,
      'discountPercentage': instance.discountPercentage,
      'maxPurchasesPerClient': instance.maxPurchasesPerClient,
      'totalAvailable': instance.totalAvailable,
      'totalSold': instance.totalSold,
      'isActive': instance.isActive,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
    };

_ClientCoachPackage _$ClientCoachPackageFromJson(Map<String, dynamic> json) =>
    _ClientCoachPackage(
      id: (json['id'] as num).toInt(),
      packageId: (json['packageId'] as num).toInt(),
      clientId: (json['clientId'] as num).toInt(),
      purchaseDate: DateTime.parse(json['purchaseDate'] as String),
      expiryDate: DateTime.parse(json['expiryDate'] as String),
      sessionsUsed: (json['sessionsUsed'] as num?)?.toInt() ?? 0,
      sessionsRemaining: (json['sessionsRemaining'] as num).toInt(),
      paymentId: json['paymentId'] as String?,
      amountPaid: (json['amountPaid'] as num).toDouble(),
      status:
          $enumDecodeNullable(_$PackageStatusEnumMap, json['status']) ??
          PackageStatus.active,
      package: json['package'] == null
          ? null
          : CoachPackage.fromJson(json['package'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$ClientCoachPackageToJson(_ClientCoachPackage instance) =>
    <String, dynamic>{
      'id': instance.id,
      'packageId': instance.packageId,
      'clientId': instance.clientId,
      'purchaseDate': instance.purchaseDate.toIso8601String(),
      'expiryDate': instance.expiryDate.toIso8601String(),
      'sessionsUsed': instance.sessionsUsed,
      'sessionsRemaining': instance.sessionsRemaining,
      'paymentId': instance.paymentId,
      'amountPaid': instance.amountPaid,
      'status': _$PackageStatusEnumMap[instance.status]!,
      'package': instance.package,
    };

const _$PackageStatusEnumMap = {
  PackageStatus.active: 'active',
  PackageStatus.expired: 'expired',
  PackageStatus.cancelled: 'cancelled',
};

_CoachReview _$CoachReviewFromJson(Map<String, dynamic> json) => _CoachReview(
  id: (json['id'] as num).toInt(),
  coachId: (json['coachId'] as num).toInt(),
  clientId: (json['clientId'] as num).toInt(),
  sessionId: (json['sessionId'] as num?)?.toInt(),
  rating: (json['rating'] as num).toInt(),
  title: json['title'] as String?,
  comment: json['comment'] as String,
  communicationRating: (json['communicationRating'] as num?)?.toInt(),
  knowledgeRating: (json['knowledgeRating'] as num?)?.toInt(),
  helpfulnessRating: (json['helpfulnessRating'] as num?)?.toInt(),
  isVerified: json['isVerified'] as bool? ?? false,
  isFeatured: json['isFeatured'] as bool? ?? false,
  isVisible: json['isVisible'] as bool? ?? true,
  coachResponse: json['coachResponse'] as String?,
  coachResponseAt: json['coachResponseAt'] == null
      ? null
      : DateTime.parse(json['coachResponseAt'] as String),
  helpfulCount: (json['helpfulCount'] as num?)?.toInt() ?? 0,
  unhelpfulCount: (json['unhelpfulCount'] as num?)?.toInt() ?? 0,
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
  updatedAt: json['updatedAt'] == null
      ? null
      : DateTime.parse(json['updatedAt'] as String),
  clientName: json['clientName'] as String?,
  clientProfileImageUrl: json['clientProfileImageUrl'] as String?,
);

Map<String, dynamic> _$CoachReviewToJson(_CoachReview instance) =>
    <String, dynamic>{
      'id': instance.id,
      'coachId': instance.coachId,
      'clientId': instance.clientId,
      'sessionId': instance.sessionId,
      'rating': instance.rating,
      'title': instance.title,
      'comment': instance.comment,
      'communicationRating': instance.communicationRating,
      'knowledgeRating': instance.knowledgeRating,
      'helpfulnessRating': instance.helpfulnessRating,
      'isVerified': instance.isVerified,
      'isFeatured': instance.isFeatured,
      'isVisible': instance.isVisible,
      'coachResponse': instance.coachResponse,
      'coachResponseAt': instance.coachResponseAt?.toIso8601String(),
      'helpfulCount': instance.helpfulCount,
      'unhelpfulCount': instance.unhelpfulCount,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'clientName': instance.clientName,
      'clientProfileImageUrl': instance.clientProfileImageUrl,
    };

_ReviewStats _$ReviewStatsFromJson(Map<String, dynamic> json) => _ReviewStats(
  totalReviews: (json['totalReviews'] as num?)?.toInt() ?? 0,
  averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0.0,
  ratingDistribution:
      (json['ratingDistribution'] as Map<String, dynamic>?)?.map(
        (k, e) => MapEntry(k, (e as num).toInt()),
      ) ??
      const {},
  detailedRatings: json['detailedRatings'] == null
      ? null
      : DetailedRatings.fromJson(
          json['detailedRatings'] as Map<String, dynamic>,
        ),
);

Map<String, dynamic> _$ReviewStatsToJson(_ReviewStats instance) =>
    <String, dynamic>{
      'totalReviews': instance.totalReviews,
      'averageRating': instance.averageRating,
      'ratingDistribution': instance.ratingDistribution,
      'detailedRatings': instance.detailedRatings,
    };

_DetailedRatings _$DetailedRatingsFromJson(Map<String, dynamic> json) =>
    _DetailedRatings(
      communication: (json['communication'] as num?)?.toDouble() ?? 0.0,
      knowledge: (json['knowledge'] as num?)?.toDouble() ?? 0.0,
      helpfulness: (json['helpfulness'] as num?)?.toDouble() ?? 0.0,
    );

Map<String, dynamic> _$DetailedRatingsToJson(_DetailedRatings instance) =>
    <String, dynamic>{
      'communication': instance.communication,
      'knowledge': instance.knowledge,
      'helpfulness': instance.helpfulness,
    };

_TimeSlot _$TimeSlotFromJson(Map<String, dynamic> json) => _TimeSlot(
  startTime: DateTime.parse(json['startTime'] as String),
  endTime: DateTime.parse(json['endTime'] as String),
  isAvailable: json['isAvailable'] as bool? ?? true,
);

Map<String, dynamic> _$TimeSlotToJson(_TimeSlot instance) => <String, dynamic>{
  'startTime': instance.startTime.toIso8601String(),
  'endTime': instance.endTime.toIso8601String(),
  'isAvailable': instance.isAvailable,
};

_BookingRequest _$BookingRequestFromJson(Map<String, dynamic> json) =>
    _BookingRequest(
      coachId: (json['coachId'] as num).toInt(),
      title: json['title'] as String,
      description: json['description'] as String?,
      sessionType: $enumDecode(_$SessionTypeEnumMap, json['sessionType']),
      scheduledAt: DateTime.parse(json['scheduledAt'] as String),
      durationMinutes: (json['durationMinutes'] as num).toInt(),
      timezone: json['timezone'] as String,
      packageId: (json['packageId'] as num?)?.toInt(),
      clientNotes: json['clientNotes'] as String?,
    );

Map<String, dynamic> _$BookingRequestToJson(_BookingRequest instance) =>
    <String, dynamic>{
      'coachId': instance.coachId,
      'title': instance.title,
      'description': instance.description,
      'sessionType': _$SessionTypeEnumMap[instance.sessionType]!,
      'scheduledAt': instance.scheduledAt.toIso8601String(),
      'durationMinutes': instance.durationMinutes,
      'timezone': instance.timezone,
      'packageId': instance.packageId,
      'clientNotes': instance.clientNotes,
    };
