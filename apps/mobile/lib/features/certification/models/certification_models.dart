import 'package:freezed_annotation/freezed_annotation.dart';

part 'certification_models.freezed.dart';
part 'certification_models.g.dart';

/// Certification level enum
enum CertificationLevel {
  foundation,
  professional,
  master,
  expert;

  String get displayName {
    switch (this) {
      case CertificationLevel.foundation:
        return 'Foundation';
      case CertificationLevel.professional:
        return 'Professional';
      case CertificationLevel.master:
        return 'Master';
      case CertificationLevel.expert:
        return 'Expert';
    }
  }

  int get minSessions {
    switch (this) {
      case CertificationLevel.foundation:
        return 10;
      case CertificationLevel.professional:
        return 50;
      case CertificationLevel.master:
        return 200;
      case CertificationLevel.expert:
        return 500;
    }
  }

  double get minRating {
    switch (this) {
      case CertificationLevel.foundation:
        return 4.0;
      case CertificationLevel.professional:
        return 4.3;
      case CertificationLevel.master:
        return 4.5;
      case CertificationLevel.expert:
        return 4.7;
    }
  }
}

/// Certification tier enum
enum CertificationTier {
  free,
  basic,
  premium,
  elite;

  String get displayName => name[0].toUpperCase() + name.substring(1);
}

/// Program status enum
enum ProgramStatus {
  draft,
  active,
  archived;
}

/// Certification status enum
enum CertificationStatus {
  notStarted,
  inProgress,
  pendingReview,
  certified,
  expired,
  revoked,
  suspended;

  String get displayName {
    switch (this) {
      case CertificationStatus.notStarted:
        return 'Not Started';
      case CertificationStatus.inProgress:
        return 'In Progress';
      case CertificationStatus.pendingReview:
        return 'Pending Review';
      case CertificationStatus.certified:
        return 'Certified';
      case CertificationStatus.expired:
        return 'Expired';
      case CertificationStatus.revoked:
        return 'Revoked';
      case CertificationStatus.suspended:
        return 'Suspended';
    }
  }

  bool get isActive =>
      this == CertificationStatus.inProgress ||
      this == CertificationStatus.pendingReview ||
      this == CertificationStatus.certified;
}

/// Question type enum
enum QuestionType {
  multipleChoice,
  multipleSelect,
  trueFalse,
  shortAnswer,
  scenario;
}

/// Program requirement model
@freezed
class ProgramRequirement with _$ProgramRequirement {
  const factory ProgramRequirement({
    required String id,
    required String type,
    required String description,
    required int targetValue,
    @Default(0) int currentValue,
    @Default(false) bool isCompleted,
    DateTime? completedAt,
  }) = _ProgramRequirement;

  factory ProgramRequirement.fromJson(Map<String, dynamic> json) =>
      _$ProgramRequirementFromJson(json);
}

/// Program benefit model
@freezed
class ProgramBenefit with _$ProgramBenefit {
  const factory ProgramBenefit({
    required String id,
    required String type,
    required String title,
    required String description,
    String? value,
  }) = _ProgramBenefit;

  factory ProgramBenefit.fromJson(Map<String, dynamic> json) =>
      _$ProgramBenefitFromJson(json);
}

/// Certification program model
@freezed
class CertificationProgram with _$CertificationProgram {
  const CertificationProgram._();

  const factory CertificationProgram({
    required String id,
    required String name,
    required String slug,
    required String description,
    required CertificationLevel level,
    required CertificationTier tier,
    required ProgramStatus status,
    required List<ProgramRequirement> requirements,
    required List<ProgramBenefit> benefits,
    String? badgeImageUrl,
    String? certificateTemplateUrl,
    @Default(false) bool isFree,
    double? price,
    @Default('USD') String currency,
    int? validityMonths,
    double? renewalPrice,
    @Default(false) bool hasQuiz,
    String? quizId,
    int? passingScore,
    @Default(false) bool hasCourse,
    String? courseId,
    String? courseUrl,
    @Default(0) int displayOrder,
    @Default(false) bool isHighlighted,
    String? colorHex,
    String? iconName,
    @Default(0) int totalCertified,
    @Default(0) int totalInProgress,
    @Default(0.0) double completionRate,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _CertificationProgram;

  factory CertificationProgram.fromJson(Map<String, dynamic> json) =>
      _$CertificationProgramFromJson(json);

  String get priceDisplay {
    if (isFree) return 'Free';
    if (price == null) return 'Contact Us';
    return '\$${price!.toStringAsFixed(0)}';
  }

  int get totalRequirements => requirements.length;
}

/// Progress item model
@freezed
class ProgressItem with _$ProgressItem {
  const factory ProgressItem({
    required String requirementId,
    required String requirementType,
    required int currentValue,
    required int targetValue,
    @Default(false) bool isCompleted,
    DateTime? completedAt,
    List<String>? evidence,
    String? notes,
  }) = _ProgressItem;

  factory ProgressItem.fromJson(Map<String, dynamic> json) =>
      _$ProgressItemFromJson(json);
}

/// Quiz attempt model
@freezed
class QuizAttempt with _$QuizAttempt {
  const factory QuizAttempt({
    required String attemptId,
    required int attemptNumber,
    required int score,
    required bool passed,
    required DateTime answeredAt,
    required int timeSpentSeconds,
  }) = _QuizAttempt;

  factory QuizAttempt.fromJson(Map<String, dynamic> json) =>
      _$QuizAttemptFromJson(json);
}

/// Coach certification model
@freezed
class CoachCertification with _$CoachCertification {
  const CoachCertification._();

  const factory CoachCertification({
    required String id,
    required String coachId,
    required String programId,
    required CertificationStatus status,
    required List<ProgressItem> progress,
    @Default(0) int completionPercentage,
    @Default(0) int requirementsMet,
    @Default(0) int totalRequirements,
    @Default([]) List<QuizAttempt> quizAttempts,
    @Default(false) bool quizPassed,
    int? bestQuizScore,
    DateTime? lastQuizAttemptAt,
    @Default(false) bool courseCompleted,
    @Default(0) int courseProgress,
    DateTime? courseCompletedAt,
    @Default(false) bool portfolioSubmitted,
    String? portfolioUrl,
    DateTime? portfolioApprovedAt,
    String? portfolioFeedback,
    DateTime? startedAt,
    DateTime? certifiedAt,
    DateTime? expiresAt,
    DateTime? renewedAt,
    String? certificateNumber,
    String? certificateUrl,
    String? digitalBadgeUrl,
    String? verificationCode,
    String? verificationUrl,
    @Default(false) bool isVerified,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _CoachCertification;

  factory CoachCertification.fromJson(Map<String, dynamic> json) =>
      _$CoachCertificationFromJson(json);

  bool get isExpired {
    if (expiresAt == null) return false;
    return DateTime.now().isAfter(expiresAt!);
  }

  bool get canRenew {
    if (status != CertificationStatus.certified &&
        status != CertificationStatus.expired) {
      return false;
    }
    if (expiresAt == null) return false;

    final now = DateTime.now();
    final thirtyDaysBefore = expiresAt!.subtract(const Duration(days: 30));
    final ninetyDaysAfter = expiresAt!.add(const Duration(days: 90));

    return now.isAfter(thirtyDaysBefore) && now.isBefore(ninetyDaysAfter);
  }

  String get progressDisplay => '$completionPercentage%';

  String get requirementsDisplay => '$requirementsMet/$totalRequirements';
}

/// Question option model
@freezed
class QuestionOption with _$QuestionOption {
  const factory QuestionOption({
    required String id,
    required String text,
    @Default(false) bool isCorrect,
    String? explanation,
  }) = _QuestionOption;

  factory QuestionOption.fromJson(Map<String, dynamic> json) =>
      _$QuestionOptionFromJson(json);
}

/// Quiz question model
@freezed
class QuizQuestion with _$QuizQuestion {
  const factory QuizQuestion({
    required String id,
    required QuestionType type,
    required String question,
    String? description,
    List<QuestionOption>? options,
    String? correctAnswer,
    required int points,
    int? timeLimit,
    String? category,
    @Default('medium') String difficulty,
    String? hint,
    String? explanation,
    String? imageUrl,
    required int order,
    @Default(true) bool isRequired,
  }) = _QuizQuestion;

  factory QuizQuestion.fromJson(Map<String, dynamic> json) =>
      _$QuizQuestionFromJson(json);
}

/// Certification quiz model
@freezed
class CertificationQuiz with _$CertificationQuiz {
  const CertificationQuiz._();

  const factory CertificationQuiz({
    required String id,
    required String programId,
    required String title,
    String? description,
    String? instructions,
    required List<QuizQuestion> questions,
    @Default(0) int totalQuestions,
    @Default(0) int totalPoints,
    @Default(70) int passingScore,
    @Default(70) int passingPercentage,
    int? timeLimit,
    @Default(3) int attemptsAllowed,
    @Default(24) int cooldownHours,
    @Default(true) bool shuffleQuestions,
    @Default(true) bool shuffleOptions,
    int? questionsPerAttempt,
    @Default(true) bool showCorrectAnswers,
    @Default(true) bool showExplanations,
    @Default(true) bool showScore,
    @Default(true) bool showProgress,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _CertificationQuiz;

  factory CertificationQuiz.fromJson(Map<String, dynamic> json) =>
      _$CertificationQuizFromJson(json);

  String get timeLimitDisplay {
    if (timeLimit == null) return 'No limit';
    if (timeLimit! < 60) return '$timeLimit minutes';
    return '${(timeLimit! / 60).floor()} hours';
  }
}

/// Quiz result model
@freezed
class QuizResult with _$QuizResult {
  const factory QuizResult({
    required String attemptId,
    required int score,
    required int totalPoints,
    required int percentage,
    required bool passed,
    required int timeSpentSeconds,
    required List<QuestionResult> questionResults,
  }) = _QuizResult;

  factory QuizResult.fromJson(Map<String, dynamic> json) =>
      _$QuizResultFromJson(json);
}

/// Question result model
@freezed
class QuestionResult with _$QuestionResult {
  const factory QuestionResult({
    required String questionId,
    required bool isCorrect,
    required int pointsEarned,
    String? correctAnswer,
    String? explanation,
  }) = _QuestionResult;

  factory QuestionResult.fromJson(Map<String, dynamic> json) =>
      _$QuestionResultFromJson(json);
}
