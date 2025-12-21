/**
 * Coach Certification Model
 * Tracks coach's certification progress and status
 */

import {
  DataTypes,
  Model,
  Optional,
  Sequelize,
} from 'sequelize';

/**
 * Certification status
 */
export enum CertificationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PENDING_REVIEW = 'pending_review',
  CERTIFIED = 'certified',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  SUSPENDED = 'suspended',
}

/**
 * Progress item
 */
export interface ProgressItem {
  requirementId: string;
  requirementType: string;
  currentValue: number;
  targetValue: number;
  isCompleted: boolean;
  completedAt?: Date;
  evidence?: string[];
  notes?: string;
}

/**
 * Quiz attempt
 */
export interface QuizAttempt {
  attemptId: string;
  attemptNumber: number;
  score: number;
  passed: boolean;
  answeredAt: Date;
  timeSpentSeconds: number;
}

/**
 * Coach Certification attributes
 */
export interface CoachCertificationAttributes {
  id: string;
  coachId: string;
  programId: string;
  status: CertificationStatus;

  // Progress tracking
  progress: ProgressItem[];
  completionPercentage: number;
  requirementsMet: number;
  totalRequirements: number;

  // Quiz
  quizAttempts: QuizAttempt[];
  quizPassed: boolean;
  bestQuizScore?: number;
  lastQuizAttemptAt?: Date;

  // Course
  courseCompleted: boolean;
  courseProgress: number;
  courseCompletedAt?: Date;

  // Portfolio
  portfolioSubmitted: boolean;
  portfolioUrl?: string;
  portfolioApprovedAt?: Date;
  portfolioFeedback?: string;

  // Certification dates
  startedAt?: Date;
  certifiedAt?: Date;
  expiresAt?: Date;
  renewedAt?: Date;

  // Certificate
  certificateNumber?: string;
  certificateUrl?: string;
  digitalBadgeUrl?: string;

  // Payment
  paymentId?: string;
  paymentStatus?: string;
  amountPaid?: number;

  // Verification
  verificationCode?: string;
  verificationUrl?: string;
  isVerified: boolean;

  // Admin
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  revokedBy?: string;
  revokedAt?: Date;
  revokeReason?: string;

  // Metadata
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoachCertificationCreationAttributes
  extends Optional<
    CoachCertificationAttributes,
    | 'id'
    | 'status'
    | 'progress'
    | 'completionPercentage'
    | 'requirementsMet'
    | 'totalRequirements'
    | 'quizAttempts'
    | 'quizPassed'
    | 'courseCompleted'
    | 'courseProgress'
    | 'portfolioSubmitted'
    | 'isVerified'
    | 'createdAt'
    | 'updatedAt'
  > {}

/**
 * Coach Certification Model
 */
export class CoachCertification extends Model<
  CoachCertificationAttributes,
  CoachCertificationCreationAttributes
> {
  public id!: string;
  public coachId!: string;
  public programId!: string;
  public status!: CertificationStatus;

  public progress!: ProgressItem[];
  public completionPercentage!: number;
  public requirementsMet!: number;
  public totalRequirements!: number;

  public quizAttempts!: QuizAttempt[];
  public quizPassed!: boolean;
  public bestQuizScore?: number;
  public lastQuizAttemptAt?: Date;

  public courseCompleted!: boolean;
  public courseProgress!: number;
  public courseCompletedAt?: Date;

  public portfolioSubmitted!: boolean;
  public portfolioUrl?: string;
  public portfolioApprovedAt?: Date;
  public portfolioFeedback?: string;

  public startedAt?: Date;
  public certifiedAt?: Date;
  public expiresAt?: Date;
  public renewedAt?: Date;

  public certificateNumber?: string;
  public certificateUrl?: string;
  public digitalBadgeUrl?: string;

  public paymentId?: string;
  public paymentStatus?: string;
  public amountPaid?: number;

  public verificationCode?: string;
  public verificationUrl?: string;
  public isVerified!: boolean;

  public reviewedBy?: string;
  public reviewedAt?: Date;
  public reviewNotes?: string;
  public revokedBy?: string;
  public revokedAt?: Date;
  public revokeReason?: string;

  public metadata?: Record<string, unknown>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Update progress for a requirement
   */
  public updateProgress(
    requirementId: string,
    value: number,
    targetValue: number
  ): void {
    const existing = this.progress.find(p => p.requirementId === requirementId);

    if (existing) {
      existing.currentValue = value;
      existing.targetValue = targetValue;
      existing.isCompleted = value >= targetValue;
      if (existing.isCompleted && !existing.completedAt) {
        existing.completedAt = new Date();
      }
    } else {
      this.progress.push({
        requirementId,
        requirementType: 'unknown',
        currentValue: value,
        targetValue,
        isCompleted: value >= targetValue,
        completedAt: value >= targetValue ? new Date() : undefined,
      });
    }

    this.recalculateCompletion();
  }

  /**
   * Recalculate completion percentage
   */
  public recalculateCompletion(): void {
    if (this.progress.length === 0) {
      this.completionPercentage = 0;
      this.requirementsMet = 0;
      return;
    }

    let totalProgress = 0;
    let metCount = 0;

    for (const item of this.progress) {
      const progress = Math.min(item.currentValue / item.targetValue, 1);
      totalProgress += progress;
      if (item.isCompleted) metCount++;
    }

    this.completionPercentage = Math.round((totalProgress / this.progress.length) * 100);
    this.requirementsMet = metCount;
  }

  /**
   * Record quiz attempt
   */
  public recordQuizAttempt(score: number, passingScore: number, timeSpentSeconds: number): QuizAttempt {
    const attempt: QuizAttempt = {
      attemptId: `attempt_${Date.now()}`,
      attemptNumber: this.quizAttempts.length + 1,
      score,
      passed: score >= passingScore,
      answeredAt: new Date(),
      timeSpentSeconds,
    };

    this.quizAttempts.push(attempt);
    this.lastQuizAttemptAt = attempt.answeredAt;

    if (attempt.passed) {
      this.quizPassed = true;
    }

    if (!this.bestQuizScore || score > this.bestQuizScore) {
      this.bestQuizScore = score;
    }

    return attempt;
  }

  /**
   * Check if certification is expired
   */
  public get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  /**
   * Check if certification can be renewed
   */
  public get canRenew(): boolean {
    if (this.status !== CertificationStatus.CERTIFIED &&
        this.status !== CertificationStatus.EXPIRED) {
      return false;
    }
    if (!this.expiresAt) return false;

    // Can renew 30 days before expiration or up to 90 days after
    const now = new Date();
    const thirtyDaysBefore = new Date(this.expiresAt);
    thirtyDaysBefore.setDate(thirtyDaysBefore.getDate() - 30);
    const ninetyDaysAfter = new Date(this.expiresAt);
    ninetyDaysAfter.setDate(ninetyDaysAfter.getDate() + 90);

    return now >= thirtyDaysBefore && now <= ninetyDaysAfter;
  }

  /**
   * Generate verification code
   */
  public generateVerificationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'UC-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.verificationCode = code;
    return code;
  }

  /**
   * Generate certificate number
   */
  public generateCertificateNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    this.certificateNumber = `UC${year}${random}`;
    return this.certificateNumber;
  }

  /**
   * Initialize model
   */
  public static initModel(sequelize: Sequelize): typeof CoachCertification {
    CoachCertification.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        coachId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'coach_id',
        },
        programId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'program_id',
        },
        status: {
          type: DataTypes.ENUM(...Object.values(CertificationStatus)),
          allowNull: false,
          defaultValue: CertificationStatus.NOT_STARTED,
        },
        progress: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
        },
        completionPercentage: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'completion_percentage',
        },
        requirementsMet: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'requirements_met',
        },
        totalRequirements: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'total_requirements',
        },
        quizAttempts: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
          field: 'quiz_attempts',
        },
        quizPassed: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'quiz_passed',
        },
        bestQuizScore: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'best_quiz_score',
        },
        lastQuizAttemptAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'last_quiz_attempt_at',
        },
        courseCompleted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'course_completed',
        },
        courseProgress: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'course_progress',
        },
        courseCompletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'course_completed_at',
        },
        portfolioSubmitted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'portfolio_submitted',
        },
        portfolioUrl: {
          type: DataTypes.STRING(500),
          allowNull: true,
          field: 'portfolio_url',
        },
        portfolioApprovedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'portfolio_approved_at',
        },
        portfolioFeedback: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'portfolio_feedback',
        },
        startedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'started_at',
        },
        certifiedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'certified_at',
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'expires_at',
        },
        renewedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'renewed_at',
        },
        certificateNumber: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
          field: 'certificate_number',
        },
        certificateUrl: {
          type: DataTypes.STRING(500),
          allowNull: true,
          field: 'certificate_url',
        },
        digitalBadgeUrl: {
          type: DataTypes.STRING(500),
          allowNull: true,
          field: 'digital_badge_url',
        },
        paymentId: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: 'payment_id',
        },
        paymentStatus: {
          type: DataTypes.STRING(20),
          allowNull: true,
          field: 'payment_status',
        },
        amountPaid: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
          field: 'amount_paid',
        },
        verificationCode: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
          field: 'verification_code',
        },
        verificationUrl: {
          type: DataTypes.STRING(500),
          allowNull: true,
          field: 'verification_url',
        },
        isVerified: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'is_verified',
        },
        reviewedBy: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'reviewed_by',
        },
        reviewedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'reviewed_at',
        },
        reviewNotes: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'review_notes',
        },
        revokedBy: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'revoked_by',
        },
        revokedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'revoked_at',
        },
        revokeReason: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'revoke_reason',
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
        tableName: 'coach_certifications',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['coach_id'] },
          { fields: ['program_id'] },
          { fields: ['status'] },
          { fields: ['coach_id', 'program_id'], unique: true },
          { fields: ['certificate_number'], unique: true },
          { fields: ['verification_code'], unique: true },
          { fields: ['certified_at'] },
          { fields: ['expires_at'] },
        ],
      }
    );

    return CoachCertification;
  }
}

export default CoachCertification;
