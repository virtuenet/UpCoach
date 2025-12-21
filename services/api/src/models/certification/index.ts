/**
 * Certification Models Index
 * Exports all certification-related models
 */

export {
  CertificationProgram,
  CertificationLevel,
  CertificationTier,
  ProgramStatus,
  type ProgramRequirement,
  type ProgramBenefit,
  type CertificationProgramAttributes,
  type CertificationProgramCreationAttributes,
} from './CertificationProgram';

export {
  CoachCertification,
  CertificationStatus,
  type ProgressItem,
  type QuizAttempt,
  type CoachCertificationAttributes,
  type CoachCertificationCreationAttributes,
} from './CoachCertification';

export {
  CertificationQuiz,
  QuestionType,
  QuizStatus,
  type QuestionOption,
  type QuizQuestion,
  type CertificationQuizAttributes,
  type CertificationQuizCreationAttributes,
} from './CertificationQuiz';
