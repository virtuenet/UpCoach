/**
 * Certification Service
 * Manages certification programs and coach certifications
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CertificationProgram,
  CertificationLevel,
  CertificationTier,
  ProgramStatus,
  ProgramRequirement,
  ProgramBenefit,
} from '../../models/certification/CertificationProgram';
import {
  CoachCertification,
  CertificationStatus,
  ProgressItem,
} from '../../models/certification/CoachCertification';

/**
 * Create program input
 */
export interface CreateProgramInput {
  name: string;
  description: string;
  level: CertificationLevel;
  tier: CertificationTier;
  requirements: ProgramRequirement[];
  benefits: ProgramBenefit[];
  price?: number;
  validityMonths?: number;
  hasQuiz?: boolean;
  hasCourse?: boolean;
}

/**
 * Program filters
 */
export interface ProgramFilters {
  level?: CertificationLevel;
  tier?: CertificationTier;
  status?: ProgramStatus;
  isFree?: boolean;
}

/**
 * Certification Service
 */
export class CertificationService {
  /**
   * Create a new certification program
   */
  async createProgram(input: CreateProgramInput): Promise<CertificationProgram> {
    const program = await CertificationProgram.create({
      id: uuidv4(),
      name: input.name,
      description: input.description,
      level: input.level,
      tier: input.tier,
      requirements: input.requirements,
      benefits: input.benefits,
      isFree: !input.price || input.price === 0,
      price: input.price,
      validityMonths: input.validityMonths,
      hasQuiz: input.hasQuiz ?? false,
      hasCourse: input.hasCourse ?? false,
      status: ProgramStatus.DRAFT,
    } as CertificationProgram);

    return program;
  }

  /**
   * Get all active certification programs
   */
  async getPrograms(filters?: ProgramFilters): Promise<CertificationProgram[]> {
    const where: Record<string, unknown> = {
      status: filters?.status ?? ProgramStatus.ACTIVE,
    };

    if (filters?.level) where.level = filters.level;
    if (filters?.tier) where.tier = filters.tier;
    if (filters?.isFree !== undefined) where.isFree = filters.isFree;

    return CertificationProgram.findAll({
      where,
      order: [['displayOrder', 'ASC'], ['level', 'ASC']],
    });
  }

  /**
   * Get program by ID
   */
  async getProgram(programId: string): Promise<CertificationProgram | null> {
    return CertificationProgram.findByPk(programId);
  }

  /**
   * Get program by slug
   */
  async getProgramBySlug(slug: string): Promise<CertificationProgram | null> {
    return CertificationProgram.findOne({ where: { slug } });
  }

  /**
   * Start certification for a coach
   */
  async startCertification(
    coachId: string,
    programId: string,
    paymentId?: string
  ): Promise<CoachCertification> {
    const program = await this.getProgram(programId);
    if (!program) {
      throw new Error('Program not found');
    }

    // Check if already started
    const existing = await CoachCertification.findOne({
      where: { coachId, programId },
    });

    if (existing) {
      if (existing.status === CertificationStatus.CERTIFIED) {
        throw new Error('Already certified for this program');
      }
      if (existing.status === CertificationStatus.IN_PROGRESS) {
        return existing;
      }
    }

    // Initialize progress items
    const progress: ProgressItem[] = program.requirements.map(req => ({
      requirementId: req.id,
      requirementType: req.type,
      currentValue: 0,
      targetValue: req.targetValue,
      isCompleted: false,
    }));

    const certification = await CoachCertification.create({
      id: uuidv4(),
      coachId,
      programId,
      status: CertificationStatus.IN_PROGRESS,
      progress,
      totalRequirements: program.requirements.length,
      startedAt: new Date(),
      paymentId,
      paymentStatus: paymentId ? 'completed' : undefined,
    } as CoachCertification);

    // Update program stats
    await program.increment('totalInProgress');

    return certification;
  }

  /**
   * Get coach's certification for a program
   */
  async getCoachCertification(
    coachId: string,
    programId: string
  ): Promise<CoachCertification | null> {
    return CoachCertification.findOne({
      where: { coachId, programId },
    });
  }

  /**
   * Get all certifications for a coach
   */
  async getCoachCertifications(coachId: string): Promise<CoachCertification[]> {
    return CoachCertification.findAll({
      where: { coachId },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Update certification progress
   */
  async updateProgress(
    coachId: string,
    programId: string,
    requirementId: string,
    value: number
  ): Promise<CoachCertification> {
    const certification = await this.getCoachCertification(coachId, programId);
    if (!certification) {
      throw new Error('Certification not found');
    }

    const program = await this.getProgram(programId);
    if (!program) {
      throw new Error('Program not found');
    }

    const requirement = program.requirements.find(r => r.id === requirementId);
    if (!requirement) {
      throw new Error('Requirement not found');
    }

    certification.updateProgress(requirementId, value, requirement.targetValue);
    await certification.save();

    // Check if all requirements met
    if (certification.completionPercentage === 100) {
      await this.checkCompletionEligibility(certification, program);
    }

    return certification;
  }

  /**
   * Check if coach is eligible for certification completion
   */
  private async checkCompletionEligibility(
    certification: CoachCertification,
    program: CertificationProgram
  ): Promise<void> {
    let isEligible = certification.requirementsMet === certification.totalRequirements;

    // Check quiz requirement
    if (program.hasQuiz && !certification.quizPassed) {
      isEligible = false;
    }

    // Check course requirement
    if (program.hasCourse && !certification.courseCompleted) {
      isEligible = false;
    }

    // Check portfolio if required
    const portfolioReq = program.requirements.find(r => r.type === 'portfolio');
    if (portfolioReq && !certification.portfolioApprovedAt) {
      isEligible = false;
    }

    if (isEligible) {
      certification.status = CertificationStatus.PENDING_REVIEW;
      await certification.save();
    }
  }

  /**
   * Complete certification (admin action)
   */
  async completeCertification(
    certificationId: string,
    reviewerId: string,
    notes?: string
  ): Promise<CoachCertification> {
    const certification = await CoachCertification.findByPk(certificationId);
    if (!certification) {
      throw new Error('Certification not found');
    }

    const program = await this.getProgram(certification.programId);
    if (!program) {
      throw new Error('Program not found');
    }

    // Generate certificate
    certification.status = CertificationStatus.CERTIFIED;
    certification.certifiedAt = new Date();
    certification.reviewedBy = reviewerId;
    certification.reviewedAt = new Date();
    certification.reviewNotes = notes;
    certification.isVerified = true;
    certification.generateCertificateNumber();
    certification.generateVerificationCode();

    // Set expiration if program has validity period
    if (program.validityMonths) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + program.validityMonths);
      certification.expiresAt = expiresAt;
    }

    // Generate verification URL
    certification.verificationUrl = `https://upcoach.com/verify/${certification.verificationCode}`;

    await certification.save();

    // Update program stats
    await program.increment('totalCertified');
    await program.decrement('totalInProgress');

    // Calculate new completion rate
    const completedCount = await CoachCertification.count({
      where: {
        programId: program.id,
        status: CertificationStatus.CERTIFIED,
      },
    });
    const totalStarted = await CoachCertification.count({
      where: { programId: program.id },
    });
    if (totalStarted > 0) {
      program.completionRate = (completedCount / totalStarted) * 100;
      await program.save();
    }

    return certification;
  }

  /**
   * Submit portfolio for review
   */
  async submitPortfolio(
    coachId: string,
    programId: string,
    portfolioUrl: string
  ): Promise<CoachCertification> {
    const certification = await this.getCoachCertification(coachId, programId);
    if (!certification) {
      throw new Error('Certification not found');
    }

    certification.portfolioSubmitted = true;
    certification.portfolioUrl = portfolioUrl;
    await certification.save();

    return certification;
  }

  /**
   * Approve portfolio (admin action)
   */
  async approvePortfolio(
    certificationId: string,
    reviewerId: string,
    feedback?: string
  ): Promise<CoachCertification> {
    const certification = await CoachCertification.findByPk(certificationId);
    if (!certification) {
      throw new Error('Certification not found');
    }

    certification.portfolioApprovedAt = new Date();
    certification.portfolioFeedback = feedback;
    certification.reviewedBy = reviewerId;
    await certification.save();

    // Update portfolio requirement progress
    const program = await this.getProgram(certification.programId);
    if (program) {
      const portfolioReq = program.requirements.find(r => r.type === 'portfolio');
      if (portfolioReq) {
        certification.updateProgress(portfolioReq.id, 1, 1);
        await certification.save();
        await this.checkCompletionEligibility(certification, program);
      }
    }

    return certification;
  }

  /**
   * Renew certification
   */
  async renewCertification(
    certificationId: string,
    paymentId?: string
  ): Promise<CoachCertification> {
    const certification = await CoachCertification.findByPk(certificationId);
    if (!certification) {
      throw new Error('Certification not found');
    }

    if (!certification.canRenew) {
      throw new Error('Certification cannot be renewed at this time');
    }

    const program = await this.getProgram(certification.programId);
    if (!program) {
      throw new Error('Program not found');
    }

    // Extend expiration
    const expiresAt = new Date();
    if (certification.expiresAt && certification.expiresAt > new Date()) {
      // Extend from current expiration
      expiresAt.setTime(certification.expiresAt.getTime());
    }
    expiresAt.setMonth(expiresAt.getMonth() + (program.validityMonths || 12));

    certification.status = CertificationStatus.CERTIFIED;
    certification.expiresAt = expiresAt;
    certification.renewedAt = new Date();
    if (paymentId) {
      certification.paymentId = paymentId;
      certification.amountPaid = (certification.amountPaid || 0) + (program.renewalPrice || 0);
    }

    await certification.save();

    return certification;
  }

  /**
   * Revoke certification
   */
  async revokeCertification(
    certificationId: string,
    revokedBy: string,
    reason: string
  ): Promise<CoachCertification> {
    const certification = await CoachCertification.findByPk(certificationId);
    if (!certification) {
      throw new Error('Certification not found');
    }

    certification.status = CertificationStatus.REVOKED;
    certification.revokedBy = revokedBy;
    certification.revokedAt = new Date();
    certification.revokeReason = reason;

    await certification.save();

    // Update program stats
    const program = await this.getProgram(certification.programId);
    if (program) {
      await program.decrement('totalCertified');
    }

    return certification;
  }

  /**
   * Verify certification
   */
  async verifyCertification(
    verificationCode: string
  ): Promise<{
    valid: boolean;
    certification?: CoachCertification;
    program?: CertificationProgram;
  }> {
    const certification = await CoachCertification.findOne({
      where: { verificationCode },
    });

    if (!certification) {
      return { valid: false };
    }

    if (certification.status !== CertificationStatus.CERTIFIED) {
      return { valid: false, certification };
    }

    if (certification.isExpired) {
      return { valid: false, certification };
    }

    const program = await this.getProgram(certification.programId);

    return {
      valid: true,
      certification,
      program: program || undefined,
    };
  }

  /**
   * Get certification statistics for a program
   */
  async getProgramStats(programId: string): Promise<{
    totalCertified: number;
    totalInProgress: number;
    totalPending: number;
    completionRate: number;
    averageCompletionTime: number;
  }> {
    const [certified, inProgress, pending] = await Promise.all([
      CoachCertification.count({
        where: { programId, status: CertificationStatus.CERTIFIED },
      }),
      CoachCertification.count({
        where: { programId, status: CertificationStatus.IN_PROGRESS },
      }),
      CoachCertification.count({
        where: { programId, status: CertificationStatus.PENDING_REVIEW },
      }),
    ]);

    const total = certified + inProgress + pending;
    const completionRate = total > 0 ? (certified / total) * 100 : 0;

    // Calculate average completion time
    const completedCerts = await CoachCertification.findAll({
      where: { programId, status: CertificationStatus.CERTIFIED },
      attributes: ['startedAt', 'certifiedAt'],
    });

    let avgTime = 0;
    if (completedCerts.length > 0) {
      const totalDays = completedCerts.reduce((sum, cert) => {
        if (cert.startedAt && cert.certifiedAt) {
          const days = (cert.certifiedAt.getTime() - cert.startedAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }
        return sum;
      }, 0);
      avgTime = totalDays / completedCerts.length;
    }

    return {
      totalCertified: certified,
      totalInProgress: inProgress,
      totalPending: pending,
      completionRate,
      averageCompletionTime: Math.round(avgTime),
    };
  }
}

/**
 * Create certification service instance
 */
export function createCertificationService(): CertificationService {
  return new CertificationService();
}

export default CertificationService;
