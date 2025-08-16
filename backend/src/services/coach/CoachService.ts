import { CoachProfile } from '../../models/CoachProfile';
import { CoachSession, SessionStatus, SessionType } from '../../models/CoachSession';
import { CoachReview } from '../../models/CoachReview';
import { CoachPackage, ClientCoachPackage } from '../../models/CoachPackage';
import { User } from '../../models/User';
import { Transaction, Op, Sequelize } from 'sequelize';
import { sequelize } from '../../models';
import { logger } from '../../utils/logger';
import emailService from '../email/UnifiedEmailService';
import { stripeService } from '../payment/StripeService';
import { analyticsService } from '../analytics/AnalyticsService';
import { getCacheService } from '../cache/UnifiedCacheService';

interface CoachSearchFilters {
  specialization?: string;
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
  language?: string;
  isAvailable?: boolean;
  search?: string;
  timezone?: string;
  hasVideo?: boolean;
  sortBy?: 'rating' | 'price' | 'experience' | 'sessions';
  order?: 'ASC' | 'DESC';
}

interface BookingRequest {
  coachId: number;
  clientId: number;
  sessionType: SessionType;
  scheduledAt: Date;
  durationMinutes: number;
  title: string;
  description?: string;
  timezone: string;
  packageId?: number;
}

interface AvailabilitySlot {
  date: Date;
  startTime: string;
  endTime: string;
  available: boolean;
}

export class CoachService {
  // Search and Discovery
  async searchCoaches(
    filters: CoachSearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    coaches: CoachProfile[];
    total: number;
    pages: number;
  }> {
    try {
      // Build where clause
      const where: any = {
        isActive: true,
      };

      if (filters.specialization) {
        where.specializations = { 
          [Op.contains]: [filters.specialization] 
        };
      }

      if (filters.minRating !== undefined) {
        where.averageRating = { 
          [Op.gte]: filters.minRating 
        };
      }

      if (filters.maxPrice !== undefined || filters.minPrice !== undefined) {
        where.hourlyRate = {};
        if (filters.maxPrice !== undefined) {
          where.hourlyRate[Op.lte] = filters.maxPrice;
        }
        if (filters.minPrice !== undefined) {
          where.hourlyRate[Op.gte] = filters.minPrice;
        }
      }

      if (filters.language) {
        where.languages = { 
          [Op.contains]: [filters.language] 
        };
      }

      if (filters.isAvailable !== undefined) {
        where.isAvailable = filters.isAvailable;
      }

      if (filters.timezone) {
        where.timezone = filters.timezone;
      }

      if (filters.hasVideo) {
        where.introVideoUrl = { 
          [Op.not]: null 
        };
      }

      if (filters.search) {
        where[Op.or] = [
          { displayName: { [Op.iLike]: `%${filters.search}%` } },
          { bio: { [Op.iLike]: `%${filters.search}%` } },
          { title: { [Op.iLike]: `%${filters.search}%` } },
          { tags: { [Op.contains]: [filters.search.toLowerCase()] } },
        ];
      }

      // Build order clause
      let order: any[] = [];
      switch (filters.sortBy) {
        case 'rating':
          order = [['averageRating', filters.order || 'DESC']];
          break;
        case 'price':
          order = [['hourlyRate', filters.order || 'ASC']];
          break;
        case 'experience':
          order = [['experienceYears', filters.order || 'DESC']];
          break;
        case 'sessions':
          order = [['totalSessions', filters.order || 'DESC']];
          break;
        default:
          order = [
            ['isFeatured', 'DESC'],
            ['averageRating', 'DESC'],
            ['totalSessions', 'DESC'],
          ];
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await CoachProfile.findAndCountAll({
        where,
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email'],
          },
        ],
        order,
        limit,
        offset,
        distinct: true,
      });

      // Cache popular searches
      const cacheKey = `coach-search:${JSON.stringify(filters)}:${page}:${limit}`;
      await getCacheService().set(cacheKey, { coaches: rows, total: count }, 300); // 5 min cache

      return {
        coaches: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error('Failed to search coaches', { error, filters });
      throw error;
    }
  }

  // Get coach details with full information
  async getCoachDetails(coachId: number): Promise<CoachProfile | null> {
    try {
      const coach = await CoachProfile.findByPk(coachId, {
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email', 'profileImageUrl'],
          },
          {
            model: CoachPackage,
            where: { isActive: true },
            required: false,
          },
        ],
      });

      if (!coach) {
        return null;
      }

      // Get recent reviews
      const recentReviews = await CoachReview.getCoachReviews(coachId, {
        limit: 5,
        sortBy: 'recent',
      });

      // Get stats
      const stats = await CoachReview.getReviewStats(coachId);

      // Attach additional data
      (coach as any).recentReviews = recentReviews.reviews;
      (coach as any).reviewStats = stats;

      return coach;
    } catch (error) {
      logger.error('Failed to get coach details', { error, coachId });
      throw error;
    }
  }

  // Check coach availability
  async getCoachAvailability(
    coachId: number,
    startDate: Date,
    endDate: Date
  ): Promise<AvailabilitySlot[]> {
    try {
      const coach = await CoachProfile.findByPk(coachId);
      if (!coach || !coach.isAvailable) {
        return [];
      }

      const slots: AvailabilitySlot[] = [];
      const current = new Date(startDate);

      while (current <= endDate) {
        const dayOfWeek = current.toLocaleLowerCase() as keyof typeof coach.availabilitySchedule;
        const daySlots = coach.availabilitySchedule[dayOfWeek] || [];

        for (const slot of daySlots) {
          const slotDate = new Date(current);
          const [startHour, startMinute] = slot.start.split(':').map(Number);
          const [endHour, endMinute] = slot.end.split(':').map(Number);
          
          slotDate.setHours(startHour, startMinute, 0, 0);
          
          // Check if slot is in the future and respects booking buffer
          const bufferTime = new Date();
          bufferTime.setHours(bufferTime.getHours() + coach.bookingBufferHours);
          
          if (slotDate > bufferTime) {
            // Check for conflicts
            const hasConflict = await CoachSession.checkConflicts(
              coachId,
              slotDate,
              60 // Default 1 hour slots
            );

            slots.push({
              date: new Date(slotDate),
              startTime: slot.start,
              endTime: slot.end,
              available: !hasConflict,
            });
          }
        }

        current.setDate(current.getDate() + 1);
      }

      return slots;
    } catch (error) {
      logger.error('Failed to get coach availability', { error, coachId });
      throw error;
    }
  }

  // Book a session
  async bookSession(
    booking: BookingRequest,
    transaction?: Transaction
  ): Promise<CoachSession> {
    try {
      // Validate coach exists and is available
      const coach = await CoachProfile.findByPk(booking.coachId);
      if (!coach || !coach.isAvailable) {
        throw new Error('Coach is not available for booking');
      }

      // Check availability
      const isAvailable = coach.isAvailableAt(booking.scheduledAt);
      if (!isAvailable) {
        throw new Error('Coach is not available at the requested time');
      }

      // Check for conflicts
      const hasConflict = await CoachSession.checkConflicts(
        booking.coachId,
        booking.scheduledAt,
        booking.durationMinutes
      );
      if (hasConflict) {
        throw new Error('Time slot is already booked');
      }

      // Check if using package
      let clientPackage: ClientCoachPackage | null = null;
      if (booking.packageId) {
        clientPackage = await ClientCoachPackage.findOne({
          where: {
            id: booking.packageId,
            clientId: booking.clientId,
            status: 'active',
          },
          include: [CoachPackage],
        });

        if (!clientPackage || !clientPackage.isValid()) {
          throw new Error('Invalid or expired package');
        }

        if (clientPackage.package.coachId !== booking.coachId) {
          throw new Error('Package is not valid for this coach');
        }
      }

      // Calculate pricing
      const hourlyRate = coach.hourlyRate || 0;
      const hours = booking.durationMinutes / 60;
      const totalAmount = clientPackage ? 0 : hourlyRate * hours; // Free if using package

      // Create session
      const session = await CoachSession.create(
        {
          coachId: booking.coachId,
          clientId: booking.clientId,
          title: booking.title,
          description: booking.description,
          sessionType: booking.sessionType,
          status: SessionStatus.PENDING,
          scheduledAt: booking.scheduledAt,
          durationMinutes: booking.durationMinutes,
          timezone: booking.timezone,
          hourlyRate,
          totalAmount,
          currency: coach.currency,
          paymentStatus: clientPackage ? 'paid' : 'pending',
        },
        { transaction }
      );

      // Use package session if applicable
      if (clientPackage) {
        await clientPackage.useSession();
        session.metadata = { packageId: booking.packageId };
        await session.save({ transaction });
      }

      // Send confirmation emails
      await this.sendBookingConfirmationEmails(session, coach);

      // Track analytics
      await analyticsService.trackConversion(
        booking.clientId,
        'session_booked',
        totalAmount,
        coach.currency,
        {
          coachId: booking.coachId,
          sessionType: booking.sessionType,
          usingPackage: !!clientPackage,
        }
      );

      logger.info('Session booked successfully', {
        sessionId: session.id,
        coachId: booking.coachId,
        clientId: booking.clientId,
      });

      return session;
    } catch (error) {
      logger.error('Failed to book session', { error, booking });
      throw error;
    }
  }

  // Process session payment
  async processSessionPayment(
    sessionId: number,
    paymentMethodId: string
  ): Promise<void> {
    try {
      const session = await CoachSession.findByPk(sessionId, {
        include: [CoachProfile, User],
      });

      if (!session) {
        throw new Error('Session not found');
      }

      if (session.paymentStatus === 'paid') {
        throw new Error('Session already paid');
      }

      // Process payment through Stripe
      const payment = await stripeService.createPaymentIntent({
        amount: Math.round(session.totalAmount * 100), // Convert to cents
        currency: session.currency.toLowerCase(),
        customer: await this.getOrCreateStripeCustomer(session.clientId),
        payment_method: paymentMethodId,
        metadata: {
          sessionId: session.id.toString(),
          coachId: session.coachId.toString(),
          clientId: session.clientId.toString(),
        },
        confirm: true,
      });

      // Update session payment status
      session.paymentStatus = 'paid';
      session.paymentId = payment.id;
      session.status = SessionStatus.CONFIRMED;
      await session.save();

      // Send payment confirmation
      await this.sendPaymentConfirmationEmails(session);

      logger.info('Session payment processed', {
        sessionId,
        paymentId: payment.id,
      });
    } catch (error) {
      logger.error('Failed to process session payment', { error, sessionId });
      throw error;
    }
  }

  // Submit a review
  async submitReview(
    sessionId: number,
    clientId: number,
    reviewData: {
      rating: number;
      title?: string;
      comment: string;
      communicationRating?: number;
      knowledgeRating?: number;
      helpfulnessRating?: number;
    }
  ): Promise<CoachReview> {
    try {
      const session = await CoachSession.findByPk(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.clientId !== clientId) {
        throw new Error('Unauthorized to review this session');
      }

      if (session.status !== SessionStatus.COMPLETED) {
        throw new Error('Can only review completed sessions');
      }

      // Check if already reviewed
      const existingReview = await CoachReview.findOne({
        where: {
          sessionId,
          clientId,
        },
      });

      if (existingReview) {
        throw new Error('Session already reviewed');
      }

      // Create review
      const review = await CoachReview.create({
        coachId: session.coachId,
        clientId,
        sessionId,
        ...reviewData,
        isVerified: true, // Verified because they completed a session
      });

      // Update session with rating
      session.clientRating = reviewData.rating;
      session.clientFeedback = reviewData.comment;
      await session.save();

      logger.info('Review submitted', {
        reviewId: review.id,
        sessionId,
        rating: reviewData.rating,
      });

      return review;
    } catch (error) {
      logger.error('Failed to submit review', { error, sessionId, clientId });
      throw error;
    }
  }

  // Purchase a package
  async purchasePackage(
    packageId: number,
    clientId: number,
    paymentMethodId: string
  ): Promise<ClientCoachPackage> {
    try {
      const pkg = await CoachPackage.findByPk(packageId, {
        include: [CoachProfile],
      });

      if (!pkg || !pkg.isAvailable()) {
        throw new Error('Package not available');
      }

      // Check purchase limit
      const canPurchase = await pkg.canBePurchasedBy(clientId);
      if (!canPurchase) {
        throw new Error('Purchase limit reached for this package');
      }

      // Process payment
      const payment = await stripeService.createPaymentIntent({
        amount: Math.round(pkg.price * 100),
        currency: pkg.currency.toLowerCase(),
        customer: await this.getOrCreateStripeCustomer(clientId),
        payment_method: paymentMethodId,
        metadata: {
          packageId: packageId.toString(),
          clientId: clientId.toString(),
        },
        confirm: true,
      });

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + pkg.validityDays);

      // Create client package
      const clientPackage = await ClientCoachPackage.create({
        packageId,
        clientId,
        expiryDate,
        sessionsRemaining: pkg.sessionCount,
        paymentId: payment.id,
        amountPaid: pkg.price,
        status: 'active',
      });

      // Update package sold count
      await pkg.recordPurchase();

      // Send confirmation email
      await this.sendPackagePurchaseEmail(clientPackage, pkg);

      // Track analytics
      await analyticsService.trackRevenue(
        clientId,
        pkg.price,
        pkg.currency,
        'package_purchase',
        {
          packageId,
          coachId: pkg.coachId,
          sessionCount: pkg.sessionCount,
        }
      );

      logger.info('Package purchased', {
        packageId,
        clientId,
        paymentId: payment.id,
      });

      return clientPackage;
    } catch (error) {
      logger.error('Failed to purchase package', { error, packageId, clientId });
      throw error;
    }
  }

  // Get coach packages
  async getCoachPackages(coachId: number): Promise<CoachPackage[]> {
    try {
      return await CoachPackage.getActivePackages(coachId);
    } catch (error) {
      logger.error('Failed to get coach packages', { error, coachId });
      throw error;
    }
  }

  // Get client sessions
  async getClientSessions(
    clientId: number,
    status?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    sessions: CoachSession[];
    total: number;
    pages: number;
  }> {
    try {
      const where: any = { clientId };
      if (status) {
        where.status = status;
      }

      const offset = (page - 1) * limit;
      const { count, rows } = await CoachSession.findAndCountAll({
        where,
        include: [
          {
            model: CoachProfile,
            include: [{ model: User, attributes: ['id', 'name', 'email'] }],
          },
        ],
        order: [['scheduledAt', 'DESC']],
        limit,
        offset,
      });

      return {
        sessions: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error('Failed to get client sessions', { error, clientId });
      throw error;
    }
  }

  // Cancel session
  async cancelSession(
    sessionId: number,
    userId: number,
    userRole: string,
    reason?: string
  ): Promise<void> {
    try {
      const session = await CoachSession.findByPk(sessionId, {
        include: [CoachProfile],
      });

      if (!session) {
        throw new Error('Session not found');
      }

      // Determine who is cancelling
      let cancelledBy: 'coach' | 'client' | 'system';
      if (userRole === 'admin') {
        cancelledBy = 'system';
      } else if (session.coach.userId === userId) {
        cancelledBy = 'coach';
      } else if (session.clientId === userId) {
        cancelledBy = 'client';
      } else {
        throw new Error('Unauthorized to cancel this session');
      }

      await session.cancel(cancelledBy, reason);

      // Send cancellation emails
      await this.sendCancellationEmails(session, cancelledBy, reason);

      logger.info('Session cancelled', {
        sessionId,
        cancelledBy,
        reason,
      });
    } catch (error) {
      logger.error('Failed to cancel session', { error, sessionId });
      throw error;
    }
  }

  // Get marketplace stats for admin
  async getMarketplaceStats(): Promise<any> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());

      // Get basic counts
      const [totalCoaches, verifiedCoaches, totalSessions, upcomingSessions] = await Promise.all([
        CoachProfile.count({ where: { isActive: true } }),
        CoachProfile.count({ where: { isActive: true, isVerified: true } }),
        CoachSession.count(),
        CoachSession.count({
          where: {
            scheduledAt: { [Op.gte]: now },
            status: { [Op.in]: ['pending', 'confirmed'] },
          },
        }),
      ]);

      // Get revenue stats
      const revenueStats = await CoachSession.findAll({
        where: {
          paymentStatus: 'paid',
        },
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'totalRevenue'],
          [Sequelize.fn('SUM', 
            Sequelize.literal(
              `CASE WHEN created_at >= '${startOfMonth.toISOString()}' THEN total_amount ELSE 0 END`
            )
          ), 'monthlyRevenue'],
        ],
        raw: true,
      });

      // Get average rating
      const ratingStats = await CoachProfile.findAll({
        where: {
          ratingCount: { [Op.gt]: 0 },
        },
        attributes: [
          [Sequelize.fn('AVG', Sequelize.col('average_rating')), 'averageRating'],
          [Sequelize.fn('SUM', Sequelize.col('rating_count')), 'totalReviews'],
        ],
        raw: true,
      });

      // Get sessions over time (last 30 days)
      const sessionsOverTime = await this.getSessionsOverTime(30);

      // Get revenue by coach (top 10)
      const revenueByCoach = await CoachSession.findAll({
        where: {
          paymentStatus: 'paid',
        },
        attributes: [
          'coachId',
          [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'revenue'],
        ],
        include: [
          {
            model: CoachProfile,
            attributes: ['displayName'],
          },
        ],
        group: ['coachId', 'coach.id', 'coach.display_name'],
        order: [[Sequelize.literal('revenue'), 'DESC']],
        limit: 10,
        raw: true,
        nest: true,
      });

      // Get session types distribution
      const sessionTypes = await CoachSession.findAll({
        attributes: [
          'sessionType',
          [Sequelize.fn('COUNT', '*'), 'value'],
        ],
        group: ['sessionType'],
        raw: true,
      });

      // Get top specializations
      const topSpecializations = await sequelize.query(`
        SELECT 
          unnest(specializations) as specialization,
          COUNT(*) as count
        FROM coach_profiles
        WHERE is_active = true
        GROUP BY specialization
        ORDER BY count DESC
        LIMIT 10
      `, { type: Sequelize.QueryTypes.SELECT });

      return {
        totalCoaches,
        verifiedCoaches,
        totalSessions,
        upcomingSessions,
        totalRevenue: Number(revenueStats[0]?.totalRevenue || 0),
        monthlyRevenue: Number(revenueStats[0]?.monthlyRevenue || 0),
        averageRating: Number(ratingStats[0]?.averageRating || 0),
        totalReviews: Number(ratingStats[0]?.totalReviews || 0),
        sessionsOverTime,
        revenueByCoach: revenueByCoach.map(item => ({
          coach: item.coach.displayName,
          revenue: Number(item.revenue),
        })),
        sessionTypes: sessionTypes.map(item => ({
          name: item.sessionType,
          value: Number(item.value),
        })),
        topSpecializations,
      };
    } catch (error) {
      logger.error('Failed to get marketplace stats', { error });
      throw error;
    }
  }

  private async getSessionsOverTime(days: number): Promise<any[]> {
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await CoachSession.count({
        where: {
          createdAt: {
            [Op.gte]: date,
            [Op.lt]: nextDate,
          },
        },
      });

      data.push({
        date: date.toISOString().split('T')[0],
        sessions: count,
      });
    }

    return data;
  }

  // Get coach dashboard stats
  async getCoachDashboard(coachId: number): Promise<{
    profile: CoachProfile;
    stats: {
      totalSessions: number;
      upcomingSessions: number;
      totalEarnings: number;
      pendingEarnings: number;
      averageRating: number;
      totalReviews: number;
    };
    upcomingSessions: CoachSession[];
    recentReviews: CoachReview[];
    activePackages: CoachPackage[];
  }> {
    try {
      const [profile, upcomingSessions, earnings, recentReviews, activePackages] = await Promise.all([
        CoachProfile.findByPk(coachId, { include: [User] }),
        CoachSession.getUpcomingSessions(coachId, 'coach'),
        this.calculateCoachEarnings(coachId),
        CoachReview.getCoachReviews(coachId, { limit: 5, sortBy: 'recent' }),
        CoachPackage.getActivePackages(coachId),
      ]);

      if (!profile) {
        throw new Error('Coach profile not found');
      }

      return {
        profile,
        stats: {
          totalSessions: profile.totalSessions,
          upcomingSessions: upcomingSessions.length,
          totalEarnings: earnings.total,
          pendingEarnings: earnings.pending,
          averageRating: profile.averageRating,
          totalReviews: profile.ratingCount,
        },
        upcomingSessions: upcomingSessions.slice(0, 5),
        recentReviews: recentReviews.reviews,
        activePackages,
      };
    } catch (error) {
      logger.error('Failed to get coach dashboard', { error, coachId });
      throw error;
    }
  }

  // Private helper methods
  private async calculateCoachEarnings(
    coachId: number
  ): Promise<{ total: number; pending: number }> {
    const sessions = await CoachSession.findAll({
      where: { coachId },
      attributes: [
        [Sequelize.fn('SUM', Sequelize.literal(
          `CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END`
        )), 'totalPaid'],
        [Sequelize.fn('SUM', Sequelize.literal(
          `CASE WHEN payment_status = 'pending' AND status IN ('confirmed', 'completed') THEN total_amount ELSE 0 END`
        )), 'totalPending'],
      ],
      raw: true,
    });

    const result = sessions[0] as any;
    return {
      total: Number(result.totalPaid || 0),
      pending: Number(result.totalPending || 0),
    };
  }

  private async getOrCreateStripeCustomer(userId: number): Promise<string> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create Stripe customer
    const customer = await stripeService.createCustomer({
      email: user.email,
      name: user.name,
      metadata: {
        userId: userId.toString(),
      },
    });

    // Save customer ID
    user.stripeCustomerId = customer.id;
    await user.save();

    return customer.id;
  }

  private async sendBookingConfirmationEmails(
    session: CoachSession,
    coach: CoachProfile
  ): Promise<void> {
    const client = await User.findByPk(session.clientId);
    const coachUser = await User.findByPk(coach.userId);

    if (client) {
      await emailService.sendEmail({
        to: client.email,
        subject: 'Session Booking Confirmation',
        template: 'session-booking-client',
        data: {
          clientName: client.name,
          coachName: coach.displayName,
          sessionTitle: session.title,
          scheduledAt: session.scheduledAt,
          duration: session.durationMinutes,
          sessionType: session.sessionType,
          totalAmount: session.totalAmount,
          currency: session.currency,
        },
      });
    }

    if (coachUser) {
      await emailService.sendEmail({
        to: coachUser.email,
        subject: 'New Session Booking',
        template: 'session-booking-coach',
        data: {
          coachName: coach.displayName,
          clientName: client?.name || 'Client',
          sessionTitle: session.title,
          scheduledAt: session.scheduledAt,
          duration: session.durationMinutes,
          sessionType: session.sessionType,
        },
      });
    }
  }

  private async sendPaymentConfirmationEmails(
    session: CoachSession
  ): Promise<void> {
    const client = await User.findByPk(session.clientId);
    
    if (client) {
      await emailService.sendEmail({
        to: client.email,
        subject: 'Payment Confirmation',
        template: 'payment-confirmation',
        data: {
          clientName: client.name,
          amount: session.totalAmount,
          currency: session.currency,
          sessionTitle: session.title,
          scheduledAt: session.scheduledAt,
        },
      });
    }
  }

  private async sendPackagePurchaseEmail(
    clientPackage: ClientCoachPackage,
    pkg: CoachPackage
  ): Promise<void> {
    const client = await User.findByPk(clientPackage.clientId);
    
    if (client) {
      await emailService.sendEmail({
        to: client.email,
        subject: 'Package Purchase Confirmation',
        template: 'package-purchase',
        data: {
          clientName: client.name,
          packageName: pkg.name,
          sessionCount: pkg.sessionCount,
          validityDays: pkg.validityDays,
          expiryDate: clientPackage.expiryDate,
          amount: pkg.price,
          currency: pkg.currency,
        },
      });
    }
  }

  private async sendCancellationEmails(
    session: CoachSession,
    cancelledBy: 'coach' | 'client' | 'system',
    reason?: string
  ): Promise<void> {
    const [client, coach] = await Promise.all([
      User.findByPk(session.clientId),
      CoachProfile.findByPk(session.coachId, { include: [User] }),
    ]);

    const coachUser = coach?.user;

    // Send to client
    if (client && cancelledBy !== 'client') {
      await emailService.sendEmail({
        to: client.email,
        subject: 'Session Cancelled',
        template: 'session-cancellation',
        data: {
          recipientName: client.name,
          sessionTitle: session.title,
          scheduledAt: session.scheduledAt,
          cancelledBy: cancelledBy === 'coach' ? coach?.displayName : 'UpCoach Support',
          reason,
          refundInfo: session.paymentStatus === 'paid' ? 'A full refund will be processed within 5-7 business days.' : null,
        },
      });
    }

    // Send to coach
    if (coachUser && cancelledBy !== 'coach') {
      await emailService.sendEmail({
        to: coachUser.email,
        subject: 'Session Cancelled',
        template: 'session-cancellation',
        data: {
          recipientName: coach.displayName,
          sessionTitle: session.title,
          scheduledAt: session.scheduledAt,
          cancelledBy: cancelledBy === 'client' ? client?.name : 'UpCoach Support',
          reason,
        },
      });
    }
  }
}

export const coachService = new CoachService();