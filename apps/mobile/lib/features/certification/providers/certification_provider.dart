import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/certification_models.dart';

/// Certification programs state
class CertificationProgramsState {
  final List<CertificationProgram> programs;
  final bool isLoading;
  final String? error;
  final CertificationLevel? selectedLevel;

  const CertificationProgramsState({
    this.programs = const [],
    this.isLoading = false,
    this.error,
    this.selectedLevel,
  });

  CertificationProgramsState copyWith({
    List<CertificationProgram>? programs,
    bool? isLoading,
    String? error,
    CertificationLevel? selectedLevel,
  }) {
    return CertificationProgramsState(
      programs: programs ?? this.programs,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedLevel: selectedLevel ?? this.selectedLevel,
    );
  }

  List<CertificationProgram> get filteredPrograms {
    if (selectedLevel == null) return programs;
    return programs.where((p) => p.level == selectedLevel).toList();
  }
}

/// Certification programs notifier
class CertificationProgramsNotifier extends StateNotifier<AsyncValue<CertificationProgramsState>> {
  CertificationProgramsNotifier() : super(const AsyncValue.loading()) {
    loadPrograms();
  }

  Future<void> loadPrograms() async {
    state = const AsyncValue.loading();

    try {
      // TODO: Replace with actual API call
      await Future.delayed(const Duration(milliseconds: 500));

      final programs = _getMockPrograms();

      state = AsyncValue.data(CertificationProgramsState(
        programs: programs,
      ));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  void setLevelFilter(CertificationLevel? level) {
    state.whenData((data) {
      state = AsyncValue.data(data.copyWith(selectedLevel: level));
    });
  }

  List<CertificationProgram> _getMockPrograms() {
    return [
      CertificationProgram(
        id: 'prog_1',
        name: 'Coaching Fundamentals',
        slug: 'coaching-fundamentals',
        description: 'Master the foundational skills of professional coaching.',
        level: CertificationLevel.foundation,
        tier: CertificationTier.free,
        status: ProgramStatus.active,
        requirements: [
          const ProgramRequirement(
            id: 'req_1',
            type: 'sessions',
            description: 'Complete 10 coaching sessions',
            targetValue: 10,
          ),
          const ProgramRequirement(
            id: 'req_2',
            type: 'rating',
            description: 'Maintain 4.0+ rating',
            targetValue: 40,
          ),
          const ProgramRequirement(
            id: 'req_3',
            type: 'quiz',
            description: 'Pass certification quiz',
            targetValue: 1,
          ),
        ],
        benefits: [
          const ProgramBenefit(
            id: 'ben_1',
            type: 'badge',
            title: 'Foundation Badge',
            description: 'Display your certification badge on your profile',
          ),
          const ProgramBenefit(
            id: 'ben_2',
            type: 'visibility',
            title: 'Verified Coach',
            description: 'Get the verified coach checkmark',
          ),
        ],
        isFree: true,
        hasQuiz: true,
        quizId: 'quiz_1',
        passingScore: 70,
        totalCertified: 1250,
        totalInProgress: 380,
        completionRate: 76.5,
        colorHex: '#48BB78',
        iconName: 'school',
        createdAt: DateTime.now().subtract(const Duration(days: 365)),
        updatedAt: DateTime.now(),
      ),
      CertificationProgram(
        id: 'prog_2',
        name: 'Professional Coach',
        slug: 'professional-coach',
        description: 'Advance your coaching career with professional certification.',
        level: CertificationLevel.professional,
        tier: CertificationTier.basic,
        status: ProgramStatus.active,
        requirements: [
          const ProgramRequirement(
            id: 'req_4',
            type: 'sessions',
            description: 'Complete 50 coaching sessions',
            targetValue: 50,
          ),
          const ProgramRequirement(
            id: 'req_5',
            type: 'rating',
            description: 'Maintain 4.3+ rating',
            targetValue: 43,
          ),
          const ProgramRequirement(
            id: 'req_6',
            type: 'quiz',
            description: 'Pass advanced certification quiz',
            targetValue: 1,
          ),
          const ProgramRequirement(
            id: 'req_7',
            type: 'portfolio',
            description: 'Submit coaching portfolio',
            targetValue: 1,
          ),
        ],
        benefits: [
          const ProgramBenefit(
            id: 'ben_3',
            type: 'badge',
            title: 'Professional Badge',
            description: 'Premium certification badge',
          ),
          const ProgramBenefit(
            id: 'ben_4',
            type: 'feature',
            title: 'Group Sessions',
            description: 'Host group coaching sessions',
          ),
          const ProgramBenefit(
            id: 'ben_5',
            type: 'visibility',
            title: 'Featured Coach',
            description: 'Priority in search results',
          ),
        ],
        isFree: false,
        price: 199,
        hasQuiz: true,
        quizId: 'quiz_2',
        passingScore: 75,
        hasCourse: true,
        courseId: 'course_1',
        validityMonths: 24,
        renewalPrice: 99,
        totalCertified: 450,
        totalInProgress: 120,
        completionRate: 68.2,
        colorHex: '#4299E1',
        iconName: 'workspace_premium',
        createdAt: DateTime.now().subtract(const Duration(days: 300)),
        updatedAt: DateTime.now(),
      ),
      CertificationProgram(
        id: 'prog_3',
        name: 'Master Coach',
        slug: 'master-coach',
        description: 'Achieve mastery in coaching excellence.',
        level: CertificationLevel.master,
        tier: CertificationTier.premium,
        status: ProgramStatus.active,
        requirements: [
          const ProgramRequirement(
            id: 'req_8',
            type: 'sessions',
            description: 'Complete 200 coaching sessions',
            targetValue: 200,
          ),
          const ProgramRequirement(
            id: 'req_9',
            type: 'rating',
            description: 'Maintain 4.5+ rating',
            targetValue: 45,
          ),
          const ProgramRequirement(
            id: 'req_10',
            type: 'course',
            description: 'Complete Master Coach course',
            targetValue: 1,
          ),
          const ProgramRequirement(
            id: 'req_11',
            type: 'quiz',
            description: 'Pass master certification exam',
            targetValue: 1,
          ),
        ],
        benefits: [
          const ProgramBenefit(
            id: 'ben_6',
            type: 'badge',
            title: 'Master Badge',
            description: 'Elite master coach badge',
          ),
          const ProgramBenefit(
            id: 'ben_7',
            type: 'revenue',
            title: 'Revenue Boost',
            description: '10% higher earning potential',
          ),
        ],
        isFree: false,
        price: 499,
        hasQuiz: true,
        hasCourse: true,
        validityMonths: 36,
        totalCertified: 85,
        totalInProgress: 45,
        completionRate: 54.3,
        colorHex: '#9F7AEA',
        iconName: 'military_tech',
        createdAt: DateTime.now().subtract(const Duration(days: 200)),
        updatedAt: DateTime.now(),
      ),
    ];
  }
}

/// My certifications state
class MyCertificationsState {
  final List<CoachCertification> certifications;
  final bool isLoading;
  final String? error;

  const MyCertificationsState({
    this.certifications = const [],
    this.isLoading = false,
    this.error,
  });

  MyCertificationsState copyWith({
    List<CoachCertification>? certifications,
    bool? isLoading,
    String? error,
  }) {
    return MyCertificationsState(
      certifications: certifications ?? this.certifications,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  List<CoachCertification> get activeCertifications =>
      certifications.where((c) => c.status.isActive).toList();

  List<CoachCertification> get completedCertifications =>
      certifications.where((c) => c.status == CertificationStatus.certified).toList();

  CoachCertification? getCertificationForProgram(String programId) {
    try {
      return certifications.firstWhere((c) => c.programId == programId);
    } catch (_) {
      return null;
    }
  }
}

/// My certifications notifier
class MyCertificationsNotifier extends StateNotifier<AsyncValue<MyCertificationsState>> {
  MyCertificationsNotifier() : super(const AsyncValue.loading()) {
    loadCertifications();
  }

  Future<void> loadCertifications() async {
    state = const AsyncValue.loading();

    try {
      // TODO: Replace with actual API call
      await Future.delayed(const Duration(milliseconds: 500));

      final certifications = _getMockCertifications();

      state = AsyncValue.data(MyCertificationsState(
        certifications: certifications,
      ));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> startCertification(String programId) async {
    // TODO: Implement API call
    await Future.delayed(const Duration(milliseconds: 500));
    await loadCertifications();
  }

  Future<void> submitPortfolio(String programId, String portfolioUrl) async {
    // TODO: Implement API call
    await Future.delayed(const Duration(milliseconds: 500));
    await loadCertifications();
  }

  List<CoachCertification> _getMockCertifications() {
    return [
      CoachCertification(
        id: 'cert_1',
        coachId: 'coach_1',
        programId: 'prog_1',
        status: CertificationStatus.inProgress,
        progress: [
          const ProgressItem(
            requirementId: 'req_1',
            requirementType: 'sessions',
            currentValue: 7,
            targetValue: 10,
          ),
          const ProgressItem(
            requirementId: 'req_2',
            requirementType: 'rating',
            currentValue: 42,
            targetValue: 40,
            isCompleted: true,
          ),
          const ProgressItem(
            requirementId: 'req_3',
            requirementType: 'quiz',
            currentValue: 0,
            targetValue: 1,
          ),
        ],
        completionPercentage: 55,
        requirementsMet: 1,
        totalRequirements: 3,
        startedAt: DateTime.now().subtract(const Duration(days: 30)),
        createdAt: DateTime.now().subtract(const Duration(days: 30)),
        updatedAt: DateTime.now(),
      ),
    ];
  }
}

/// Quiz state
class QuizState {
  final CertificationQuiz? quiz;
  final List<QuizQuestion> questions;
  final int currentQuestionIndex;
  final Map<String, dynamic> answers;
  final DateTime? startedAt;
  final DateTime? endsAt;
  final String? attemptId;
  final bool isSubmitting;
  final QuizResult? result;

  const QuizState({
    this.quiz,
    this.questions = const [],
    this.currentQuestionIndex = 0,
    this.answers = const {},
    this.startedAt,
    this.endsAt,
    this.attemptId,
    this.isSubmitting = false,
    this.result,
  });

  QuizState copyWith({
    CertificationQuiz? quiz,
    List<QuizQuestion>? questions,
    int? currentQuestionIndex,
    Map<String, dynamic>? answers,
    DateTime? startedAt,
    DateTime? endsAt,
    String? attemptId,
    bool? isSubmitting,
    QuizResult? result,
  }) {
    return QuizState(
      quiz: quiz ?? this.quiz,
      questions: questions ?? this.questions,
      currentQuestionIndex: currentQuestionIndex ?? this.currentQuestionIndex,
      answers: answers ?? this.answers,
      startedAt: startedAt ?? this.startedAt,
      endsAt: endsAt ?? this.endsAt,
      attemptId: attemptId ?? this.attemptId,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      result: result ?? this.result,
    );
  }

  QuizQuestion? get currentQuestion {
    if (currentQuestionIndex >= questions.length) return null;
    return questions[currentQuestionIndex];
  }

  bool get isLastQuestion => currentQuestionIndex >= questions.length - 1;

  int get answeredCount => answers.length;

  double get progress {
    if (questions.isEmpty) return 0;
    return answeredCount / questions.length;
  }

  Duration? get timeRemaining {
    if (endsAt == null) return null;
    final remaining = endsAt!.difference(DateTime.now());
    return remaining.isNegative ? Duration.zero : remaining;
  }
}

/// Quiz notifier
class QuizNotifier extends StateNotifier<AsyncValue<QuizState>> {
  QuizNotifier() : super(const AsyncValue.data(QuizState()));

  Future<void> startQuiz(String programId) async {
    state = const AsyncValue.loading();

    try {
      // TODO: Replace with actual API call
      await Future.delayed(const Duration(milliseconds: 500));

      final quiz = _getMockQuiz();
      final questions = quiz.questions;

      state = AsyncValue.data(QuizState(
        quiz: quiz,
        questions: questions,
        attemptId: 'attempt_${DateTime.now().millisecondsSinceEpoch}',
        startedAt: DateTime.now(),
        endsAt: quiz.timeLimit != null
            ? DateTime.now().add(Duration(minutes: quiz.timeLimit!))
            : null,
      ));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  void answerQuestion(String questionId, dynamic answer) {
    state.whenData((data) {
      final newAnswers = Map<String, dynamic>.from(data.answers);
      newAnswers[questionId] = answer;
      state = AsyncValue.data(data.copyWith(answers: newAnswers));
    });
  }

  void nextQuestion() {
    state.whenData((data) {
      if (!data.isLastQuestion) {
        state = AsyncValue.data(data.copyWith(
          currentQuestionIndex: data.currentQuestionIndex + 1,
        ));
      }
    });
  }

  void previousQuestion() {
    state.whenData((data) {
      if (data.currentQuestionIndex > 0) {
        state = AsyncValue.data(data.copyWith(
          currentQuestionIndex: data.currentQuestionIndex - 1,
        ));
      }
    });
  }

  void goToQuestion(int index) {
    state.whenData((data) {
      if (index >= 0 && index < data.questions.length) {
        state = AsyncValue.data(data.copyWith(currentQuestionIndex: index));
      }
    });
  }

  Future<void> submitQuiz() async {
    await state.whenData((data) async {
      state = AsyncValue.data(data.copyWith(isSubmitting: true));

      try {
        // TODO: Replace with actual API call
        await Future.delayed(const Duration(seconds: 1));

        final result = QuizResult(
          attemptId: data.attemptId ?? '',
          score: 75,
          totalPoints: 100,
          percentage: 75,
          passed: true,
          timeSpentSeconds: DateTime.now()
              .difference(data.startedAt ?? DateTime.now())
              .inSeconds,
          questionResults: data.questions.map((q) => QuestionResult(
            questionId: q.id,
            isCorrect: true,
            pointsEarned: q.points,
          )).toList(),
        );

        state = AsyncValue.data(data.copyWith(
          isSubmitting: false,
          result: result,
        ));
      } catch (e) {
        state = AsyncValue.data(data.copyWith(isSubmitting: false));
        rethrow;
      }
    });
  }

  void reset() {
    state = const AsyncValue.data(QuizState());
  }

  CertificationQuiz _getMockQuiz() {
    return CertificationQuiz(
      id: 'quiz_1',
      programId: 'prog_1',
      title: 'Coaching Fundamentals Quiz',
      description: 'Test your understanding of coaching fundamentals.',
      instructions: 'Read each question carefully and select the best answer.',
      questions: [
        const QuizQuestion(
          id: 'q_1',
          type: QuestionType.multipleChoice,
          question: 'What is the primary goal of coaching?',
          options: [
            QuestionOption(id: 'o_1', text: 'To give advice'),
            QuestionOption(id: 'o_2', text: 'To help clients discover solutions', isCorrect: true),
            QuestionOption(id: 'o_3', text: 'To fix problems'),
            QuestionOption(id: 'o_4', text: 'To teach skills'),
          ],
          points: 10,
          category: 'fundamentals',
          difficulty: 'easy',
          order: 1,
        ),
        const QuizQuestion(
          id: 'q_2',
          type: QuestionType.multipleSelect,
          question: 'Which are core ICF coaching competencies?',
          options: [
            QuestionOption(id: 'o_5', text: 'Active Listening', isCorrect: true),
            QuestionOption(id: 'o_6', text: 'Powerful Questioning', isCorrect: true),
            QuestionOption(id: 'o_7', text: 'Giving Advice'),
            QuestionOption(id: 'o_8', text: 'Creating Awareness', isCorrect: true),
          ],
          points: 15,
          category: 'competencies',
          difficulty: 'medium',
          order: 2,
        ),
        const QuizQuestion(
          id: 'q_3',
          type: QuestionType.trueFalse,
          question: 'Coaches should maintain confidentiality about client information.',
          options: [
            QuestionOption(id: 'o_9', text: 'True', isCorrect: true),
            QuestionOption(id: 'o_10', text: 'False'),
          ],
          points: 5,
          category: 'ethics',
          difficulty: 'easy',
          order: 3,
        ),
      ],
      totalQuestions: 3,
      totalPoints: 30,
      passingPercentage: 70,
      timeLimit: 15,
      attemptsAllowed: 3,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }
}

/// Providers
final certificationProgramsProvider =
    StateNotifierProvider<CertificationProgramsNotifier, AsyncValue<CertificationProgramsState>>(
        (ref) => CertificationProgramsNotifier());

final myCertificationsProvider =
    StateNotifierProvider<MyCertificationsNotifier, AsyncValue<MyCertificationsState>>(
        (ref) => MyCertificationsNotifier());

final quizProvider = StateNotifierProvider<QuizNotifier, AsyncValue<QuizState>>(
    (ref) => QuizNotifier());

/// Selected program provider
final selectedProgramProvider = StateProvider<CertificationProgram?>((ref) => null);
