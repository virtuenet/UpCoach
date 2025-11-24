import { Op } from 'sequelize';

import { StreakGuardianLink } from '../../models/StreakGuardianLink';
import { User } from '../../models/User';
import { logger } from '../../utils/logger';
import { NotificationService } from '../NotificationService';
import { userDayContextService } from '../ai/UserDayContextService';

interface GuardianSummary {
  id: string;
  status: string;
  guardian: {
    id: string;
    name: string;
    email: string;
  };
  lastAlertAt?: string;
  snoozedUntil?: string;
}

class StreakGuardianService {
  private notificationService = NotificationService.getInstance();

  async listGuardians(userId: string): Promise<GuardianSummary[]> {
    const links = await StreakGuardianLink.findAll({
      where: {
        [Op.or]: [{ ownerUserId: userId }, { guardianUserId: userId }],
      },
      include: [
        {
          model: User,
          as: 'guardian',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    return links.map(link => {
      const partner =
        link.ownerUserId === userId ? (link as any).guardian : (link as any).owner;

      return {
        id: link.id,
        status: link.status,
        guardian: {
          id: partner?.id,
          name: partner?.name,
          email: partner?.email,
        },
        lastAlertAt: link.lastAlertAt?.toISOString(),
        snoozedUntil: link.snoozedUntil?.toISOString(),
      };
    });
  }

  async inviteGuardian(ownerId: string, guardianEmail: string): Promise<GuardianSummary> {
    const guardian = await User.findOne({ where: { email: guardianEmail.toLowerCase() } });
    if (!guardian) {
      throw new Error('Guardian not found');
    }
    if (guardian.id === ownerId) {
      throw new Error('You cannot invite yourself');
    }

    const [link] = await StreakGuardianLink.findOrCreate({
      where: {
        ownerUserId: ownerId,
        guardianUserId: guardian.id,
      },
      defaults: {
        status: 'pending',
      },
    });

    await this.notificationService.showInfo(
      guardian.id,
      'You have a new streak guardian invite waiting for you.',
      true
    );

    return {
      id: link.id,
      status: link.status,
      guardian: {
        id: guardian.id,
        name: guardian.name,
        email: guardian.email,
      },
      lastAlertAt: link.lastAlertAt?.toISOString(),
      snoozedUntil: link.snoozedUntil?.toISOString(),
    };
  }

  async respondToInvite(guardianId: string, ownerId: string, accept: boolean): Promise<void> {
    const link = await StreakGuardianLink.findOne({
      where: {
        ownerUserId: ownerId,
        guardianUserId: guardianId,
      },
    });

    if (!link) {
      throw new Error('Invite not found');
    }

    await link.update({
      status: accept ? 'accepted' : 'blocked',
    });

    await this.notificationService.showInfo(
      ownerId,
      accept
        ? 'Your streak buddy accepted the invite!'
        : 'Your streak buddy declined the invite.',
      true
    );
  }

  async removeGuardian(userId: string, guardianId: string): Promise<void> {
    await StreakGuardianLink.destroy({
      where: {
        [Op.or]: [
          { ownerUserId: userId, guardianUserId: guardianId },
          { ownerUserId: guardianId, guardianUserId: userId },
        ],
      },
    });
  }

  async sendCheer(fromUserId: string, linkId: string, message: string): Promise<void> {
    const link = await StreakGuardianLink.findByPk(linkId);
    if (!link || link.status !== 'accepted') {
      throw new Error('Guardian link not found');
    }

    const targetUserId = link.ownerUserId === fromUserId ? link.guardianUserId : link.ownerUserId;
    await this.notificationService.showInfo(targetUserId, message, false);
  }

  async scanForAtRiskUsers(): Promise<void> {
    const acceptedLinks = await StreakGuardianLink.findAll({
      where: { status: 'accepted' },
    });

    for (const link of acceptedLinks) {
      try {
        const context = await userDayContextService.build(link.ownerUserId);
        const isAtRisk =
          context.overdueTasks >= 3 ||
          (context.habitTrend.slice(-1)[0]?.completionRate ?? 1) < 0.4;

        if (isAtRisk) {
          await this.notificationService.showWarning(link.guardianUserId, 'Your partner may need encouragement today.');
          await link.update({ lastAlertAt: new Date() });
        }
      } catch (error) {
        logger.warn('Failed to process guardian risk scan', { error, linkId: link.id });
      }
    }
  }
}

export const streakGuardianService = new StreakGuardianService();

