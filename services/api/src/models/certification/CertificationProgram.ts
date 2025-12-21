/**
 * Certification Program Model
 * Defines certification programs for coaches
 */

import {
  DataTypes,
  Model,
  Optional,
  Sequelize,
} from 'sequelize';

/**
 * Certification levels
 */
export enum CertificationLevel {
  FOUNDATION = 'foundation',
  PROFESSIONAL = 'professional',
  MASTER = 'master',
  EXPERT = 'expert',
}

/**
 * Certification tier
 */
export enum CertificationTier {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ELITE = 'elite',
}

/**
 * Program status
 */
export enum ProgramStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

/**
 * Requirement type
 */
export interface ProgramRequirement {
  id: string;
  type: 'sessions' | 'rating' | 'quiz' | 'portfolio' | 'course' | 'endorsements' | 'tenure';
  description: string;
  targetValue: number;
  currentValue?: number;
  isCompleted?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Benefit type
 */
export interface ProgramBenefit {
  id: string;
  type: 'badge' | 'feature' | 'revenue' | 'visibility' | 'support';
  title: string;
  description: string;
  value?: string | number;
}

/**
 * Certification Program attributes
 */
export interface CertificationProgramAttributes {
  id: string;
  name: string;
  slug: string;
  description: string;
  level: CertificationLevel;
  tier: CertificationTier;
  status: ProgramStatus;

  // Requirements
  requirements: ProgramRequirement[];
  totalRequirements: number;

  // Benefits
  benefits: ProgramBenefit[];
  badgeImageUrl?: string;
  certificateTemplateUrl?: string;

  // Pricing
  isFree: boolean;
  price?: number;
  currency: string;

  // Validity
  validityMonths?: number;
  renewalPrice?: number;
  renewalRequirements?: ProgramRequirement[];

  // Quiz settings
  hasQuiz: boolean;
  quizId?: string;
  passingScore?: number;

  // Course settings
  hasCourse: boolean;
  courseId?: string;
  courseUrl?: string;

  // Display
  displayOrder: number;
  isHighlighted: boolean;
  colorHex?: string;
  iconName?: string;

  // Stats
  totalCertified: number;
  totalInProgress: number;
  completionRate: number;

  // Metadata
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificationProgramCreationAttributes
  extends Optional<
    CertificationProgramAttributes,
    | 'id'
    | 'slug'
    | 'status'
    | 'totalRequirements'
    | 'isFree'
    | 'currency'
    | 'hasQuiz'
    | 'hasCourse'
    | 'displayOrder'
    | 'isHighlighted'
    | 'totalCertified'
    | 'totalInProgress'
    | 'completionRate'
    | 'createdAt'
    | 'updatedAt'
  > {}

/**
 * Certification Program Model
 */
export class CertificationProgram extends Model<
  CertificationProgramAttributes,
  CertificationProgramCreationAttributes
> {
  public id!: string;
  public name!: string;
  public slug!: string;
  public description!: string;
  public level!: CertificationLevel;
  public tier!: CertificationTier;
  public status!: ProgramStatus;

  public requirements!: ProgramRequirement[];
  public totalRequirements!: number;
  public benefits!: ProgramBenefit[];
  public badgeImageUrl?: string;
  public certificateTemplateUrl?: string;

  public isFree!: boolean;
  public price?: number;
  public currency!: string;

  public validityMonths?: number;
  public renewalPrice?: number;
  public renewalRequirements?: ProgramRequirement[];

  public hasQuiz!: boolean;
  public quizId?: string;
  public passingScore?: number;

  public hasCourse!: boolean;
  public courseId?: string;
  public courseUrl?: string;

  public displayOrder!: number;
  public isHighlighted!: boolean;
  public colorHex?: string;
  public iconName?: string;

  public totalCertified!: number;
  public totalInProgress!: number;
  public completionRate!: number;

  public metadata?: Record<string, unknown>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Check if user meets requirements
   */
  public checkRequirementsMet(userProgress: Map<string, number>): {
    met: boolean;
    completedCount: number;
    details: ProgramRequirement[];
  } {
    const details = this.requirements.map(req => ({
      ...req,
      currentValue: userProgress.get(req.id) || 0,
      isCompleted: (userProgress.get(req.id) || 0) >= req.targetValue,
    }));

    const completedCount = details.filter(r => r.isCompleted).length;

    return {
      met: completedCount === this.totalRequirements,
      completedCount,
      details,
    };
  }

  /**
   * Calculate completion percentage
   */
  public calculateProgress(userProgress: Map<string, number>): number {
    if (this.requirements.length === 0) return 100;

    let totalProgress = 0;
    for (const req of this.requirements) {
      const current = userProgress.get(req.id) || 0;
      const progress = Math.min(current / req.targetValue, 1);
      totalProgress += progress;
    }

    return Math.round((totalProgress / this.requirements.length) * 100);
  }

  /**
   * Get level display info
   */
  public static getLevelInfo(level: CertificationLevel): {
    name: string;
    minSessions: number;
    minRating: number;
  } {
    switch (level) {
      case CertificationLevel.FOUNDATION:
        return { name: 'Foundation', minSessions: 10, minRating: 4.0 };
      case CertificationLevel.PROFESSIONAL:
        return { name: 'Professional', minSessions: 50, minRating: 4.3 };
      case CertificationLevel.MASTER:
        return { name: 'Master', minSessions: 200, minRating: 4.5 };
      case CertificationLevel.EXPERT:
        return { name: 'Expert', minSessions: 500, minRating: 4.7 };
    }
  }

  /**
   * Initialize model
   */
  public static initModel(sequelize: Sequelize): typeof CertificationProgram {
    CertificationProgram.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        level: {
          type: DataTypes.ENUM(...Object.values(CertificationLevel)),
          allowNull: false,
        },
        tier: {
          type: DataTypes.ENUM(...Object.values(CertificationTier)),
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM(...Object.values(ProgramStatus)),
          allowNull: false,
          defaultValue: ProgramStatus.DRAFT,
        },
        requirements: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
        },
        totalRequirements: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        benefits: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
        },
        badgeImageUrl: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        certificateTemplateUrl: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        isFree: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },
        currency: {
          type: DataTypes.STRING(3),
          allowNull: false,
          defaultValue: 'USD',
        },
        validityMonths: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        renewalPrice: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },
        renewalRequirements: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        hasQuiz: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        quizId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        passingScore: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        hasCourse: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        courseId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        courseUrl: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        displayOrder: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        isHighlighted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        colorHex: {
          type: DataTypes.STRING(7),
          allowNull: true,
        },
        iconName: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        totalCertified: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        totalInProgress: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        completionRate: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0,
        },
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'certification_programs',
        timestamps: true,
        indexes: [
          { fields: ['slug'], unique: true },
          { fields: ['level'] },
          { fields: ['tier'] },
          { fields: ['status'] },
          { fields: ['display_order'] },
          { fields: ['is_highlighted'] },
        ],
        hooks: {
          beforeValidate: (program) => {
            // Generate slug from name
            if (!program.slug && program.name) {
              program.slug = program.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            }
            // Update total requirements
            if (program.requirements) {
              program.totalRequirements = program.requirements.length;
            }
          },
        },
      }
    );

    return CertificationProgram;
  }
}

export default CertificationProgram;
