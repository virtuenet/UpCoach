/**
 * Certification Quiz Model
 * Quiz engine for certification programs
 */

import {
  DataTypes,
  Model,
  Optional,
  Sequelize,
} from 'sequelize';

/**
 * Question type
 */
export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  MULTIPLE_SELECT = 'multiple_select',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  SCENARIO = 'scenario',
}

/**
 * Quiz status
 */
export enum QuizStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

/**
 * Question option
 */
export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

/**
 * Quiz question
 */
export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  description?: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  points: number;
  timeLimit?: number; // seconds
  category?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
  explanation?: string;
  imageUrl?: string;
  order: number;
  isRequired: boolean;
}

/**
 * Certification Quiz attributes
 */
export interface CertificationQuizAttributes {
  id: string;
  programId: string;
  title: string;
  description?: string;
  instructions?: string;
  status: QuizStatus;

  // Questions
  questions: QuizQuestion[];
  totalQuestions: number;
  totalPoints: number;

  // Settings
  passingScore: number;
  passingPercentage: number;
  timeLimit?: number; // minutes
  attemptsAllowed: number;
  cooldownHours: number;

  // Randomization
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questionsPerAttempt?: number;

  // Display
  showCorrectAnswers: boolean;
  showExplanations: boolean;
  showScore: boolean;
  showProgress: boolean;

  // Proctoring
  requireProctoring: boolean;
  preventTabSwitch: boolean;
  preventCopyPaste: boolean;
  requireFullscreen: boolean;

  // Stats
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  averageTime: number; // seconds

  // Metadata
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificationQuizCreationAttributes
  extends Optional<
    CertificationQuizAttributes,
    | 'id'
    | 'status'
    | 'questions'
    | 'totalQuestions'
    | 'totalPoints'
    | 'passingScore'
    | 'passingPercentage'
    | 'attemptsAllowed'
    | 'cooldownHours'
    | 'shuffleQuestions'
    | 'shuffleOptions'
    | 'showCorrectAnswers'
    | 'showExplanations'
    | 'showScore'
    | 'showProgress'
    | 'requireProctoring'
    | 'preventTabSwitch'
    | 'preventCopyPaste'
    | 'requireFullscreen'
    | 'totalAttempts'
    | 'averageScore'
    | 'passRate'
    | 'averageTime'
    | 'createdAt'
    | 'updatedAt'
  > {}

/**
 * Certification Quiz Model
 */
export class CertificationQuiz extends Model<
  CertificationQuizAttributes,
  CertificationQuizCreationAttributes
> {
  public id!: string;
  public programId!: string;
  public title!: string;
  public description?: string;
  public instructions?: string;
  public status!: QuizStatus;

  public questions!: QuizQuestion[];
  public totalQuestions!: number;
  public totalPoints!: number;

  public passingScore!: number;
  public passingPercentage!: number;
  public timeLimit?: number;
  public attemptsAllowed!: number;
  public cooldownHours!: number;

  public shuffleQuestions!: boolean;
  public shuffleOptions!: boolean;
  public questionsPerAttempt?: number;

  public showCorrectAnswers!: boolean;
  public showExplanations!: boolean;
  public showScore!: boolean;
  public showProgress!: boolean;

  public requireProctoring!: boolean;
  public preventTabSwitch!: boolean;
  public preventCopyPaste!: boolean;
  public requireFullscreen!: boolean;

  public totalAttempts!: number;
  public averageScore!: number;
  public passRate!: number;
  public averageTime!: number;

  public metadata?: Record<string, unknown>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Get questions for an attempt (with optional shuffle and limit)
   */
  public getQuestionsForAttempt(): QuizQuestion[] {
    let questions = [...this.questions];

    // Shuffle questions if enabled
    if (this.shuffleQuestions) {
      questions = this.shuffleArray(questions);
    }

    // Limit questions if configured
    if (this.questionsPerAttempt && this.questionsPerAttempt < questions.length) {
      questions = questions.slice(0, this.questionsPerAttempt);
    }

    // Shuffle options within each question if enabled
    if (this.shuffleOptions) {
      questions = questions.map(q => ({
        ...q,
        options: q.options ? this.shuffleArray([...q.options]) : undefined,
      }));
    }

    // Remove correct answer info for client
    return questions.map(q => ({
      ...q,
      options: q.options?.map(o => ({
        ...o,
        isCorrect: undefined,
        explanation: undefined,
      } as QuestionOption)),
      correctAnswer: undefined,
      explanation: undefined,
    }));
  }

  /**
   * Grade quiz answers
   */
  public gradeAnswers(answers: Map<string, string | string[]>): {
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    questionResults: Array<{
      questionId: string;
      isCorrect: boolean;
      pointsEarned: number;
      correctAnswer?: string | string[];
      explanation?: string;
    }>;
  } {
    let score = 0;
    let totalPoints = 0;
    const questionResults: Array<{
      questionId: string;
      isCorrect: boolean;
      pointsEarned: number;
      correctAnswer?: string | string[];
      explanation?: string;
    }> = [];

    for (const question of this.questions) {
      totalPoints += question.points;
      const userAnswer = answers.get(question.id);
      let isCorrect = false;
      let pointsEarned = 0;

      switch (question.type) {
        case QuestionType.MULTIPLE_CHOICE:
        case QuestionType.TRUE_FALSE: {
          const correctOption = question.options?.find(o => o.isCorrect);
          isCorrect = userAnswer === correctOption?.id;
          pointsEarned = isCorrect ? question.points : 0;
          break;
        }

        case QuestionType.MULTIPLE_SELECT: {
          const correctOptions = question.options?.filter(o => o.isCorrect).map(o => o.id) || [];
          const userOptions = Array.isArray(userAnswer) ? userAnswer : [];

          // Partial credit: points * (correct selections - wrong selections) / total correct
          const correctSelections = userOptions.filter(o => correctOptions.includes(o)).length;
          const wrongSelections = userOptions.filter(o => !correctOptions.includes(o)).length;

          if (correctSelections === correctOptions.length && wrongSelections === 0) {
            isCorrect = true;
            pointsEarned = question.points;
          } else if (correctSelections > wrongSelections) {
            pointsEarned = Math.round(question.points * (correctSelections - wrongSelections) / correctOptions.length);
          }
          break;
        }

        case QuestionType.SHORT_ANSWER: {
          // Case-insensitive comparison
          const normalizedAnswer = (userAnswer as string)?.toLowerCase().trim();
          const normalizedCorrect = question.correctAnswer?.toLowerCase().trim();
          isCorrect = normalizedAnswer === normalizedCorrect;
          pointsEarned = isCorrect ? question.points : 0;
          break;
        }

        case QuestionType.SCENARIO: {
          // Scenario questions typically have multiple choice options
          const correctOption = question.options?.find(o => o.isCorrect);
          isCorrect = userAnswer === correctOption?.id;
          pointsEarned = isCorrect ? question.points : 0;
          break;
        }
      }

      score += pointsEarned;

      questionResults.push({
        questionId: question.id,
        isCorrect,
        pointsEarned,
        correctAnswer: this.showCorrectAnswers
          ? (question.options?.filter(o => o.isCorrect).map(o => o.id) || question.correctAnswer)
          : undefined,
        explanation: this.showExplanations ? question.explanation : undefined,
      });
    }

    const percentage = Math.round((score / totalPoints) * 100);
    const passed = percentage >= this.passingPercentage;

    return {
      score,
      totalPoints,
      percentage,
      passed,
      questionResults,
    };
  }

  /**
   * Update statistics
   */
  public updateStats(score: number, timeSpent: number, passed: boolean): void {
    const oldTotal = this.totalAttempts;
    const newTotal = oldTotal + 1;

    // Update average score
    this.averageScore = ((this.averageScore * oldTotal) + score) / newTotal;

    // Update average time
    this.averageTime = ((this.averageTime * oldTotal) + timeSpent) / newTotal;

    // Update pass rate
    const oldPasses = Math.round(this.passRate * oldTotal / 100);
    const newPasses = oldPasses + (passed ? 1 : 0);
    this.passRate = Math.round((newPasses / newTotal) * 100);

    this.totalAttempts = newTotal;
  }

  /**
   * Fisher-Yates shuffle
   */
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Initialize model
   */
  public static initModel(sequelize: Sequelize): typeof CertificationQuiz {
    CertificationQuiz.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        programId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'program_id',
        },
        title: {
          type: DataTypes.STRING(200),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        instructions: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM(...Object.values(QuizStatus)),
          allowNull: false,
          defaultValue: QuizStatus.DRAFT,
        },
        questions: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
        },
        totalQuestions: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'total_questions',
        },
        totalPoints: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'total_points',
        },
        passingScore: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 70,
          field: 'passing_score',
        },
        passingPercentage: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 70,
          field: 'passing_percentage',
        },
        timeLimit: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'time_limit',
        },
        attemptsAllowed: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 3,
          field: 'attempts_allowed',
        },
        cooldownHours: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 24,
          field: 'cooldown_hours',
        },
        shuffleQuestions: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'shuffle_questions',
        },
        shuffleOptions: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'shuffle_options',
        },
        questionsPerAttempt: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'questions_per_attempt',
        },
        showCorrectAnswers: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'show_correct_answers',
        },
        showExplanations: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'show_explanations',
        },
        showScore: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'show_score',
        },
        showProgress: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'show_progress',
        },
        requireProctoring: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'require_proctoring',
        },
        preventTabSwitch: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'prevent_tab_switch',
        },
        preventCopyPaste: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'prevent_copy_paste',
        },
        requireFullscreen: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'require_fullscreen',
        },
        totalAttempts: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'total_attempts',
        },
        averageScore: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0,
          field: 'average_score',
        },
        passRate: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0,
          field: 'pass_rate',
        },
        averageTime: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
          field: 'average_time',
        },
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: 'created_at',
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: 'updated_at',
        },
      },
      {
        sequelize,
        tableName: 'certification_quizzes',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['program_id'] },
          { fields: ['status'] },
        ],
        hooks: {
          beforeValidate: (quiz) => {
            if (quiz.questions) {
              quiz.totalQuestions = quiz.questions.length;
              quiz.totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
            }
          },
        },
      }
    );

    return CertificationQuiz;
  }
}

export default CertificationQuiz;
