/**
 * Certification Services Index
 * Exports all certification-related services
 */

export {
  CertificationService,
  createCertificationService,
  type CreateProgramInput,
  type ProgramFilters,
} from './CertificationService';

export {
  QuizService,
  createQuizService,
  type CreateQuizInput,
  type StartAttemptResult,
  type SubmitAnswersInput,
  type QuizResult,
} from './QuizService';

export {
  CertificateGenerator,
  createCertificateGenerator,
  type CertificateData,
  type BadgeData,
  type CertificateTemplate,
  type TemplateElement,
} from './CertificateGenerator';
