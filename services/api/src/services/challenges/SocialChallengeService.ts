/**
 * Social Challenge Service
 * Manages challenge lifecycle and participation
 */

import { v4 as uuidv4 } from 'uuid';
import {
  SocialChallenge,
  ChallengeType,
  ChallengeCategory,
  ChallengeStatus,
  ScoringType,
  ChallengeRequirement,
  ChallengePrize,
  ChallengeMilestone,
} from '../../models/challenges/SocialChallenge';
import {
  ChallengeParticipant,
  ParticipantStatus,
} from '../../models/challenges/ChallengeParticipant';
import {
  ChallengeTeam,
  TeamStatus,
} from '../../models/challenges/ChallengeTeam';

/**
 * Create challenge input
 */
export interface CreateChallengeInput {
  creatorId: string;
  coachId?: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  type: ChallengeType;
  category: ChallengeCategory;
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
  requirements: ChallengeRequirement[];
  scoringType?: ScoringType;
  prizes?: ChallengePrize[];
  milestones?: ChallengeMilestone[];
  maxParticipants?: number;
  minTeamSize?: number;
  maxTeamSize?: number;
  isPublic?: boolean;
  inviteOnly?: boolean;
}

/**
 * Challenge filters
 */
export interface ChallengeFilters {
  type?: ChallengeType;
  category?: ChallengeCategory;
  status?: ChallengeStatus;
  isPublic?: boolean;
  isFeatured?: boolean;
  creatorId?: string;
  search?: string;
}

/**
 * Join result
 */
export interface JoinResult {
  success: boolean;
  participant?: ChallengeParticipant;
  team?: ChallengeTeam;
  error?: string;
}

/**
 * Social Challenge Service
 */
export class SocialChallengeService {
  /**
   * Create a new challenge
   */
  async createChallenge(input: CreateChallengeInput): Promise<SocialChallenge> {
    const challenge = await SocialChallenge.create({
      id: uuidv4(),
      creatorId: input.creatorId,
      coachId: input.coachId,
      title: input.title,
      description: input.description,
      coverImageUrl: input.coverImageUrl,
      type: input.type,
      category: input.category,
      startDate: input.startDate,
      endDate: input.endDate,
      registrationDeadline: input.registrationDeadline,
      requirements: input.requirements,
      scoringType: input.scoringType || ScoringType.POINTS,
      prizes: input.prizes || [],
      milestones: input.milestones || [],
      maxParticipants: input.maxParticipants,
      minTeamSize: input.minTeamSize,
      maxTeamSize: input.maxTeamSize,
      isPublic: input.isPublic ?? true,
      inviteOnly: input.inviteOnly ?? false,
      status: ChallengeStatus.DRAFT,
    } as SocialChallenge);

    // Generate invite code for private challenges
    if (input.inviteOnly) {
      challenge.generateInviteCode();
      await challenge.save();
    }

    return challenge;
  }

  /**
   * Get challenge by ID
   */
  async getChallenge(challengeId: string): Promise<SocialChallenge | null> {
    return SocialChallenge.findByPk(challengeId);
  }

  /**
   * Get challenges with filters
   */
  async getChallenges(filters?: ChallengeFilters): Promise<SocialChallenge[]> {
    const where: Record<string, unknown> = {};

    if (filters?.type) where.type = filters.type;
    if (filters?.category) where.category = filters.category;
    if (filters?.status) where.status = filters.status;
    if (filters?.isPublic !== undefined) where.isPublic = filters.isPublic;
    if (filters?.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
    if (filters?.creatorId) where.creatorId = filters.creatorId;

    return SocialChallenge.findAll({
      where,
      order: [
        ['isFeatured', 'DESC'],
        ['startDate', 'ASC'],
      ],
    });
  }

  /**
   * Get active challenges
   */
  async getActiveChallenges(): Promise<SocialChallenge[]> {
    const now = new Date();

    return SocialChallenge.findAll({
      where: {
        status: ChallengeStatus.ACTIVE,
        isPublic: true,
      },
      order: [
        ['isFeatured', 'DESC'],
        ['totalParticipants', 'DESC'],
      ],
    });
  }

  /**
   * Get upcoming challenges
   */
  async getUpcomingChallenges(): Promise<SocialChallenge[]> {
    return SocialChallenge.findAll({
      where: {
        status: ChallengeStatus.UPCOMING,
        isPublic: true,
      },
      order: [['startDate', 'ASC']],
    });
  }

  /**
   * Publish challenge
   */
  async publishChallenge(challengeId: string): Promise<SocialChallenge> {
    const challenge = await this.getChallenge(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    const now = new Date();
    if (now >= challenge.startDate) {
      challenge.status = ChallengeStatus.ACTIVE;
    } else {
      challenge.status = ChallengeStatus.UPCOMING;
    }

    await challenge.save();
    return challenge;
  }

  /**
   * Start challenge (when start date arrives)
   */
  async startChallenge(challengeId: string): Promise<SocialChallenge> {
    const challenge = await this.getChallenge(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    challenge.status = ChallengeStatus.ACTIVE;

    // Activate all registered participants
    await ChallengeParticipant.update(
      { status: ParticipantStatus.ACTIVE },
      { where: { challengeId, status: ParticipantStatus.REGISTERED } }
    );

    // Activate all teams
    await ChallengeTeam.update(
      { status: TeamStatus.ACTIVE },
      { where: { challengeId, status: TeamStatus.FORMING } }
    );

    await challenge.save();
    return challenge;
  }

  /**
   * End challenge
   */
  async endChallenge(challengeId: string): Promise<SocialChallenge> {
    const challenge = await this.getChallenge(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    challenge.status = ChallengeStatus.COMPLETED;
    await challenge.save();

    // Update team statuses
    await ChallengeTeam.update(
      { status: TeamStatus.COMPLETED },
      { where: { challengeId, status: TeamStatus.ACTIVE } }
    );

    return challenge;
  }

  /**
   * Join challenge as individual
   */
  async joinChallenge(
    challengeId: string,
    userId: string,
    inviteCode?: string
  ): Promise<JoinResult> {
    const challenge = await this.getChallenge(challengeId);
    if (!challenge) {
      return { success: false, error: 'Challenge not found' };
    }

    // Check registration open
    if (!challenge.isRegistrationOpen) {
      return { success: false, error: 'Registration is closed' };
    }

    // Check invite code for private challenges
    if (challenge.inviteOnly && challenge.inviteCode !== inviteCode) {
      return { success: false, error: 'Invalid invite code' };
    }

    // Check if already participating
    const existing = await ChallengeParticipant.findOne({
      where: { challengeId, userId },
    });
    if (existing) {
      return { success: false, error: 'Already participating' };
    }

    // Create participant
    const participant = await ChallengeParticipant.create({
      id: uuidv4(),
      challengeId,
      userId,
      status: challenge.status === ChallengeStatus.ACTIVE
        ? ParticipantStatus.ACTIVE
        : ParticipantStatus.REGISTERED,
      progress: challenge.requirements.map(req => ({
        requirementId: req.id,
        currentValue: 0,
        targetValue: req.targetValue,
        pointsEarned: 0,
        lastUpdated: new Date(),
      })),
    } as ChallengeParticipant);

    // Update challenge stats
    await challenge.increment('totalParticipants');

    return { success: true, participant };
  }

  /**
   * Join or create team
   */
  async joinTeam(
    challengeId: string,
    userId: string,
    teamId?: string,
    inviteCode?: string
  ): Promise<JoinResult> {
    const challenge = await this.getChallenge(challengeId);
    if (!challenge) {
      return { success: false, error: 'Challenge not found' };
    }

    if (challenge.type !== ChallengeType.TEAM) {
      return { success: false, error: 'Not a team challenge' };
    }

    let team: ChallengeTeam | null = null;

    if (teamId) {
      // Join existing team
      team = await ChallengeTeam.findByPk(teamId);
      if (!team) {
        return { success: false, error: 'Team not found' };
      }

      if (team.inviteCode && team.inviteCode !== inviteCode) {
        return { success: false, error: 'Invalid team invite code' };
      }

      if (team.isFull) {
        return { success: false, error: 'Team is full' };
      }

      if (!team.addMember(userId)) {
        return { success: false, error: 'Could not join team' };
      }

      await team.save();
    }

    // Join as individual with team
    const result = await this.joinChallenge(challengeId, userId);
    if (!result.success) {
      return result;
    }

    if (team) {
      result.participant!.teamId = team.id;
      await result.participant!.save();
      result.team = team;
    }

    return result;
  }

  /**
   * Create team
   */
  async createTeam(
    challengeId: string,
    captainId: string,
    teamName: string,
    description?: string,
    isPublic: boolean = true
  ): Promise<ChallengeTeam> {
    const challenge = await this.getChallenge(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (challenge.type !== ChallengeType.TEAM) {
      throw new Error('Not a team challenge');
    }

    const team = await ChallengeTeam.create({
      id: uuidv4(),
      challengeId,
      name: teamName,
      description,
      captainId,
      status: TeamStatus.FORMING,
      maxMembers: challenge.maxTeamSize,
      isPublic,
    } as ChallengeTeam);

    // Add captain as member
    team.addMember(captainId, 'captain');
    team.generateInviteCode();
    await team.save();

    // Join challenge for captain
    await this.joinTeam(challengeId, captainId, team.id);

    // Update challenge stats
    await challenge.increment('totalTeams');

    return team;
  }

  /**
   * Leave challenge
   */
  async leaveChallenge(challengeId: string, userId: string): Promise<boolean> {
    const participant = await ChallengeParticipant.findOne({
      where: { challengeId, userId },
    });

    if (!participant) {
      return false;
    }

    participant.status = ParticipantStatus.WITHDRAWN;
    participant.withdrawnAt = new Date();
    await participant.save();

    // If in a team, remove from team
    if (participant.teamId) {
      const team = await ChallengeTeam.findByPk(participant.teamId);
      if (team) {
        team.removeMember(userId);
        await team.save();
      }
    }

    // Update challenge stats
    const challenge = await this.getChallenge(challengeId);
    if (challenge) {
      await challenge.decrement('totalParticipants');
    }

    return true;
  }

  /**
   * Record progress
   */
  async recordProgress(
    challengeId: string,
    userId: string,
    requirementId: string,
    value: number
  ): Promise<ChallengeParticipant> {
    const participant = await ChallengeParticipant.findOne({
      where: { challengeId, userId },
    });

    if (!participant) {
      throw new Error('Participant not found');
    }

    const challenge = await this.getChallenge(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    const requirement = challenge.requirements.find(r => r.id === requirementId);
    if (!requirement) {
      throw new Error('Requirement not found');
    }

    // Update progress
    participant.updateProgress(
      requirementId,
      value,
      requirement.targetValue,
      requirement.pointsPerCompletion,
      requirement.maxPoints
    );

    // Check milestones
    for (const milestone of challenge.milestones) {
      if (
        participant.totalScore >= milestone.targetValue &&
        !participant.milestonesAchieved.some(m => m.milestoneId === milestone.id)
      ) {
        participant.achieveMilestone(milestone.id);
      }
    }

    await participant.save();

    // Update team score if in team
    if (participant.teamId) {
      const team = await ChallengeTeam.findByPk(participant.teamId);
      if (team) {
        team.updateMemberContribution(
          userId,
          participant.totalScore,
          participant.currentStreak
        );
        await team.save();
      }
    }

    // Check completion
    if (participant.completionPercentage >= 100) {
      await challenge.increment('totalCompletions');
    }

    return participant;
  }

  /**
   * Send cheer to participant
   */
  async sendCheer(
    challengeId: string,
    fromUserId: string,
    toUserId: string
  ): Promise<void> {
    const [sender, recipient] = await Promise.all([
      ChallengeParticipant.findOne({ where: { challengeId, userId: fromUserId } }),
      ChallengeParticipant.findOne({ where: { challengeId, userId: toUserId } }),
    ]);

    if (!sender || !recipient) {
      throw new Error('Participant not found');
    }

    await sender.increment('cheersGiven');
    await recipient.increment('cheersReceived');

    // Award bonus points for encouragement
    recipient.totalScore += 5; // Small bonus for receiving cheer
    await recipient.save();
  }

  /**
   * Get user's challenges
   */
  async getUserChallenges(userId: string): Promise<{
    active: SocialChallenge[];
    upcoming: SocialChallenge[];
    completed: SocialChallenge[];
  }> {
    const participations = await ChallengeParticipant.findAll({
      where: { userId },
    });

    const challengeIds = participations.map(p => p.challengeId);

    const challenges = await SocialChallenge.findAll({
      where: { id: challengeIds },
    });

    return {
      active: challenges.filter(c => c.status === ChallengeStatus.ACTIVE),
      upcoming: challenges.filter(c => c.status === ChallengeStatus.UPCOMING),
      completed: challenges.filter(c => c.status === ChallengeStatus.COMPLETED),
    };
  }
}

/**
 * Create social challenge service instance
 */
export function createSocialChallengeService(): SocialChallengeService {
  return new SocialChallengeService();
}

export default SocialChallengeService;
