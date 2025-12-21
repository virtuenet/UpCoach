/**
 * Challenge Models Index
 * Exports all challenge-related models
 */

export {
  SocialChallenge,
  ChallengeType,
  ChallengeCategory,
  ChallengeStatus,
  ScoringType,
  type ChallengeRequirement,
  type ChallengePrize,
  type ChallengeMilestone,
  type SocialChallengeAttributes,
  type SocialChallengeCreationAttributes,
} from './SocialChallenge';

export {
  ChallengeParticipant,
  ParticipantStatus,
  type ProgressEntry,
  type MilestoneAchievement,
  type ChallengeParticipantAttributes,
  type ChallengeParticipantCreationAttributes,
} from './ChallengeParticipant';

export {
  ChallengeTeam,
  TeamStatus,
  type TeamMember,
  type ChallengeTeamAttributes,
  type ChallengeTeamCreationAttributes,
} from './ChallengeTeam';
