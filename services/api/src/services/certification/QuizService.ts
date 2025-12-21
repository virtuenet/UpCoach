/**
 * Quiz Service
 * Manages certification quizzes and attempts
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CertificationQuiz,
  QuestionType,
  QuizStatus,
  QuizQuestion,
  QuestionOption,
} from '../../models/certification/CertificationQuiz';
import {
  CoachCertification,
  QuizAttempt,
} from '../../models/certification/CoachCertification';

/**
 * Create quiz input
 */
export interface CreateQuizInput {
  programId: string;
  title: string;
  description?: string;
  instructions?: string;
  questions: Omit<QuizQuestion, 'id' | 'order'>[];
  passingPercentage?: number;
  timeLimit?: number;
  attemptsAllowed?: number;
}

/**
 * Start attempt result
 */
export interface StartAttemptResult {
  attemptId: string;
  questions: QuizQuestion[];
  timeLimit?: number;
  startedAt: Date;
  endsAt?: Date;
}

/**
 * Submit answer input
 */
export interface SubmitAnswersInput {
  attemptId: string;
  answers: Map<string, string | string[]>;
  timeSpentSeconds: number;
}

/**
 * Quiz result
 */
export interface QuizResult {
  attemptId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  questionResults: Array<{
    questionId: string;
    isCorrect: boolean;
    pointsEarned: number;
    correctAnswer?: string | string[];
    explanation?: string;
  }>;
}

/**
 * In-memory attempt tracking
 */
interface ActiveAttempt {
  attemptId: string;
  quizId: string;
  coachId: string;
  questions: QuizQuestion[];
  startedAt: Date;
  endsAt?: Date;
}

/**
 * Quiz Service
 */
export class QuizService {
  private activeAttempts: Map<string, ActiveAttempt> = new Map();

  /**
   * Create a new quiz
   */
  async createQuiz(input: CreateQuizInput): Promise<CertificationQuiz> {
    // Add IDs and order to questions
    const questions: QuizQuestion[] = input.questions.map((q, index) => ({
      ...q,
      id: uuidv4(),
      order: index + 1,
      options: q.options?.map(o => ({
        ...o,
        id: uuidv4(),
      })),
    }));

    const quiz = await CertificationQuiz.create({
      id: uuidv4(),
      programId: input.programId,
      title: input.title,
      description: input.description,
      instructions: input.instructions,
      questions,
      passingPercentage: input.passingPercentage ?? 70,
      timeLimit: input.timeLimit,
      attemptsAllowed: input.attemptsAllowed ?? 3,
      status: QuizStatus.DRAFT,
    } as CertificationQuiz);

    return quiz;
  }

  /**
   * Get quiz by ID
   */
  async getQuiz(quizId: string): Promise<CertificationQuiz | null> {
    return CertificationQuiz.findByPk(quizId);
  }

  /**
   * Get quiz for a program
   */
  async getQuizForProgram(programId: string): Promise<CertificationQuiz | null> {
    return CertificationQuiz.findOne({
      where: { programId, status: QuizStatus.ACTIVE },
    });
  }

  /**
   * Update quiz
   */
  async updateQuiz(
    quizId: string,
    updates: Partial<CreateQuizInput>
  ): Promise<CertificationQuiz> {
    const quiz = await this.getQuiz(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    if (updates.questions) {
      quiz.questions = updates.questions.map((q, index) => ({
        ...q,
        id: q.id || uuidv4(),
        order: index + 1,
        options: q.options?.map(o => ({
          ...o,
          id: o.id || uuidv4(),
        })),
      })) as QuizQuestion[];
    }

    if (updates.title) quiz.title = updates.title;
    if (updates.description) quiz.description = updates.description;
    if (updates.instructions) quiz.instructions = updates.instructions;
    if (updates.passingPercentage) quiz.passingPercentage = updates.passingPercentage;
    if (updates.timeLimit !== undefined) quiz.timeLimit = updates.timeLimit;
    if (updates.attemptsAllowed) quiz.attemptsAllowed = updates.attemptsAllowed;

    await quiz.save();
    return quiz;
  }

  /**
   * Add question to quiz
   */
  async addQuestion(
    quizId: string,
    question: Omit<QuizQuestion, 'id' | 'order'>
  ): Promise<CertificationQuiz> {
    const quiz = await this.getQuiz(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    const newQuestion: QuizQuestion = {
      ...question,
      id: uuidv4(),
      order: quiz.questions.length + 1,
      options: question.options?.map(o => ({
        ...o,
        id: uuidv4(),
      })),
    };

    quiz.questions.push(newQuestion);
    await quiz.save();

    return quiz;
  }

  /**
   * Remove question from quiz
   */
  async removeQuestion(quizId: string, questionId: string): Promise<CertificationQuiz> {
    const quiz = await this.getQuiz(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    quiz.questions = quiz.questions.filter(q => q.id !== questionId);

    // Reorder remaining questions
    quiz.questions.forEach((q, index) => {
      q.order = index + 1;
    });

    await quiz.save();
    return quiz;
  }

  /**
   * Activate quiz
   */
  async activateQuiz(quizId: string): Promise<CertificationQuiz> {
    const quiz = await this.getQuiz(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    if (quiz.questions.length === 0) {
      throw new Error('Quiz must have at least one question');
    }

    quiz.status = QuizStatus.ACTIVE;
    await quiz.save();

    return quiz;
  }

  /**
   * Check if coach can attempt quiz
   */
  async canAttemptQuiz(
    coachId: string,
    programId: string
  ): Promise<{
    canAttempt: boolean;
    reason?: string;
    attemptsRemaining?: number;
    nextAttemptAt?: Date;
  }> {
    const quiz = await this.getQuizForProgram(programId);
    if (!quiz) {
      return { canAttempt: false, reason: 'Quiz not found' };
    }

    const certification = await CoachCertification.findOne({
      where: { coachId, programId },
    });

    if (!certification) {
      return { canAttempt: false, reason: 'Certification not started' };
    }

    if (certification.quizPassed) {
      return { canAttempt: false, reason: 'Quiz already passed' };
    }

    const attemptCount = certification.quizAttempts.length;
    const attemptsRemaining = quiz.attemptsAllowed - attemptCount;

    if (attemptsRemaining <= 0) {
      return {
        canAttempt: false,
        reason: 'Maximum attempts reached',
        attemptsRemaining: 0,
      };
    }

    // Check cooldown
    if (certification.lastQuizAttemptAt) {
      const cooldownEnd = new Date(certification.lastQuizAttemptAt);
      cooldownEnd.setHours(cooldownEnd.getHours() + quiz.cooldownHours);

      if (new Date() < cooldownEnd) {
        return {
          canAttempt: false,
          reason: 'Cooldown period not over',
          attemptsRemaining,
          nextAttemptAt: cooldownEnd,
        };
      }
    }

    return { canAttempt: true, attemptsRemaining };
  }

  /**
   * Start quiz attempt
   */
  async startAttempt(coachId: string, programId: string): Promise<StartAttemptResult> {
    const canAttempt = await this.canAttemptQuiz(coachId, programId);
    if (!canAttempt.canAttempt) {
      throw new Error(canAttempt.reason || 'Cannot attempt quiz');
    }

    const quiz = await this.getQuizForProgram(programId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    const attemptId = uuidv4();
    const questions = quiz.getQuestionsForAttempt();
    const startedAt = new Date();

    let endsAt: Date | undefined;
    if (quiz.timeLimit) {
      endsAt = new Date(startedAt);
      endsAt.setMinutes(endsAt.getMinutes() + quiz.timeLimit);
    }

    // Store active attempt
    this.activeAttempts.set(attemptId, {
      attemptId,
      quizId: quiz.id,
      coachId,
      questions: quiz.questions, // Store original questions with answers
      startedAt,
      endsAt,
    });

    return {
      attemptId,
      questions, // Questions without answers
      timeLimit: quiz.timeLimit,
      startedAt,
      endsAt,
    };
  }

  /**
   * Submit quiz answers
   */
  async submitAnswers(
    coachId: string,
    programId: string,
    input: SubmitAnswersInput
  ): Promise<QuizResult> {
    const activeAttempt = this.activeAttempts.get(input.attemptId);
    if (!activeAttempt) {
      throw new Error('Attempt not found or expired');
    }

    if (activeAttempt.coachId !== coachId) {
      throw new Error('Unauthorized');
    }

    // Check if time expired
    if (activeAttempt.endsAt && new Date() > activeAttempt.endsAt) {
      this.activeAttempts.delete(input.attemptId);
      throw new Error('Time expired');
    }

    const quiz = await CertificationQuiz.findByPk(activeAttempt.quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    // Grade the quiz using original questions
    const tempQuiz = quiz;
    tempQuiz.questions = activeAttempt.questions;
    const result = tempQuiz.gradeAnswers(input.answers);

    // Get certification
    const certification = await CoachCertification.findOne({
      where: { coachId, programId },
    });

    if (!certification) {
      throw new Error('Certification not found');
    }

    // Record attempt
    const attempt = certification.recordQuizAttempt(
      result.score,
      quiz.passingPercentage,
      input.timeSpentSeconds
    );

    await certification.save();

    // Update quiz stats
    quiz.updateStats(result.percentage, input.timeSpentSeconds, result.passed);
    await quiz.save();

    // Clean up active attempt
    this.activeAttempts.delete(input.attemptId);

    return {
      attemptId: attempt.attemptId,
      ...result,
      timeSpentSeconds: input.timeSpentSeconds,
    };
  }

  /**
   * Get quiz attempts for a coach
   */
  async getAttempts(coachId: string, programId: string): Promise<QuizAttempt[]> {
    const certification = await CoachCertification.findOne({
      where: { coachId, programId },
    });

    return certification?.quizAttempts || [];
  }

  /**
   * Generate sample questions for a category
   */
  generateSampleQuestions(
    category: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Omit<QuizQuestion, 'id' | 'order'>[] {
    const questions: Omit<QuizQuestion, 'id' | 'order'>[] = [];

    // Sample coaching questions
    const coachingQuestions = [
      {
        type: QuestionType.MULTIPLE_CHOICE,
        question: 'What is the primary goal of coaching?',
        options: [
          { id: '1', text: 'To give advice and tell clients what to do', isCorrect: false },
          { id: '2', text: 'To help clients discover their own solutions', isCorrect: true },
          { id: '3', text: 'To fix clients\' problems', isCorrect: false },
          { id: '4', text: 'To teach new skills', isCorrect: false },
        ] as QuestionOption[],
        points: 10,
        category: 'fundamentals',
        difficulty: 'easy' as const,
        explanation: 'Coaching is about empowering clients to find their own solutions through powerful questions and active listening.',
        isRequired: true,
      },
      {
        type: QuestionType.MULTIPLE_SELECT,
        question: 'Which of the following are core coaching competencies according to ICF?',
        options: [
          { id: '1', text: 'Active Listening', isCorrect: true },
          { id: '2', text: 'Powerful Questioning', isCorrect: true },
          { id: '3', text: 'Giving Advice', isCorrect: false },
          { id: '4', text: 'Creating Awareness', isCorrect: true },
        ] as QuestionOption[],
        points: 15,
        category: 'competencies',
        difficulty: 'medium' as const,
        explanation: 'ICF core competencies include Active Listening, Powerful Questioning, and Creating Awareness. Giving advice is not a coaching competency.',
        isRequired: true,
      },
      {
        type: QuestionType.SCENARIO,
        question: 'A client says "I just can\'t seem to get motivated." What is the best coaching response?',
        description: 'Choose the response that best demonstrates coaching competencies.',
        options: [
          { id: '1', text: '"You should try setting smaller goals."', isCorrect: false },
          { id: '2', text: '"What does motivation look like for you?"', isCorrect: true },
          { id: '3', text: '"Have you tried making a to-do list?"', isCorrect: false },
          { id: '4', text: '"Tell me about a time when you felt motivated."', isCorrect: true },
        ] as QuestionOption[],
        points: 20,
        category: 'practice',
        difficulty: 'hard' as const,
        explanation: 'The best responses explore the client\'s perspective through questions rather than offering solutions.',
        isRequired: true,
      },
      {
        type: QuestionType.TRUE_FALSE,
        question: 'A coach should maintain confidentiality about all client information.',
        options: [
          { id: '1', text: 'True', isCorrect: true },
          { id: '2', text: 'False', isCorrect: false },
        ] as QuestionOption[],
        points: 5,
        category: 'ethics',
        difficulty: 'easy' as const,
        explanation: 'Confidentiality is a fundamental ethical requirement in coaching.',
        isRequired: true,
      },
    ];

    // Filter by difficulty if specified
    questions.push(
      ...coachingQuestions.filter(q => q.difficulty === difficulty || difficulty === 'medium')
    );

    return questions;
  }
}

/**
 * Create quiz service instance
 */
export function createQuizService(): QuizService {
  return new QuizService();
}

export default QuizService;
