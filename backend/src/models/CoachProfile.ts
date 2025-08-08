import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { User } from './User';
import { CoachSession } from './CoachSession';
import { CoachReview } from './CoachReview';
import { CoachPackage } from './CoachPackage';
import { Op } from 'sequelize';

interface AvailabilitySchedule {
  monday?: { start: string; end: string }[];
  tuesday?: { start: string; end: string }[];
  wednesday?: { start: string; end: string }[];
  thursday?: { start: string; end: string }[];
  friday?: { start: string; end: string }[];
  saturday?: { start: string; end: string }[];
  sunday?: { start: string; end: string }[];
}

interface Certification {
  name: string;
  issuer: string;
  date: string;
  verificationUrl?: string;
}

@Table({
  tableName: 'coach_profiles',
  timestamps: true,
})
export class CoachProfile extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    unique: true,
    allowNull: false,
  })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  displayName!: string;

  @Column({
    type: DataType.STRING(255),
  })
  title?: string;

  @Column({
    type: DataType.TEXT,
  })
  bio?: string;

  @Column({
    type: DataType.ARRAY(DataType.TEXT),
    defaultValue: [],
  })
  specializations!: string[];

  @Column({
    type: DataType.JSONB,
    defaultValue: [],
  })
  certifications!: Certification[];

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  experienceYears!: number;

  @Column({
    type: DataType.ARRAY(DataType.STRING(10)),
    defaultValue: ['en'],
  })
  languages!: string[];

  @Column({
    type: DataType.STRING(50),
    defaultValue: 'UTC',
  })
  timezone!: string;

  // Availability & Booking
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isAvailable!: boolean;

  @Column({
    type: DataType.DECIMAL(10, 2),
  })
  hourlyRate?: number;

  @Column({
    type: DataType.STRING(3),
    defaultValue: 'USD',
  })
  currency!: string;

  @Column({
    type: DataType.DECIMAL(3, 1),
    defaultValue: 1.0,
  })
  minBookingHours!: number;

  @Column({
    type: DataType.DECIMAL(3, 1),
    defaultValue: 4.0,
  })
  maxBookingHours!: number;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  availabilitySchedule!: AvailabilitySchedule;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 24,
  })
  bookingBufferHours!: number;

  // Profile Media
  @Column({
    type: DataType.TEXT,
  })
  profileImageUrl?: string;

  @Column({
    type: DataType.TEXT,
  })
  coverImageUrl?: string;

  @Column({
    type: DataType.TEXT,
  })
  introVideoUrl?: string;

  @Column({
    type: DataType.JSONB,
    defaultValue: [],
  })
  galleryImages!: string[];

  // Stats & Rating
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  totalSessions!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  totalClients!: number;

  @Column({
    type: DataType.DECIMAL(3, 2),
    defaultValue: 0.00,
  })
  averageRating!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  ratingCount!: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
  })
  responseTimeHours?: number;

  // Settings
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isVerified!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isFeatured!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  acceptsInsurance!: boolean;

  @Column({
    type: DataType.JSONB,
    defaultValue: ['card'],
  })
  acceptedPaymentMethods!: string[];

  // Metadata
  @Column({
    type: DataType.ARRAY(DataType.TEXT),
    defaultValue: [],
  })
  tags!: string[];

  @Column({
    type: DataType.STRING(255),
    unique: true,
  })
  seoSlug?: string;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  metadata!: any;

  @HasMany(() => CoachSession)
  sessions!: CoachSession[];

  @HasMany(() => CoachReview)
  reviews!: CoachReview[];

  @HasMany(() => CoachPackage)
  packages!: CoachPackage[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static generateSeoSlug(instance: CoachProfile) {
    if (!instance.seoSlug && instance.displayName) {
      instance.seoSlug = instance.displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Add random suffix to ensure uniqueness
      instance.seoSlug += '-' + Math.random().toString(36).substr(2, 5);
    }
  }

  // Helper methods
  isAvailableAt(date: Date): boolean {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = days[date.getDay()] as keyof AvailabilitySchedule;
    const timeSlots = this.availabilitySchedule[dayOfWeek];
    
    if (!timeSlots || timeSlots.length === 0) {
      return false;
    }

    const time = date.toTimeString().slice(0, 5); // HH:MM format
    
    return timeSlots.some(slot => {
      return time >= slot.start && time <= slot.end;
    });
  }

  getNextAvailableSlot(duration: number = 60): Date | null {
    const now = new Date();
    const bufferTime = new Date(now.getTime() + this.bookingBufferHours * 60 * 60 * 1000);
    
    // Check next 30 days
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(bufferTime);
      checkDate.setDate(checkDate.getDate() + i);
      
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = days[checkDate.getDay()] as keyof AvailabilitySchedule;
      const timeSlots = this.availabilitySchedule[dayOfWeek];
      
      if (timeSlots && timeSlots.length > 0) {
        for (const slot of timeSlots) {
          const slotStart = new Date(checkDate);
          const [hours, minutes] = slot.start.split(':').map(Number);
          slotStart.setHours(hours, minutes, 0, 0);
          
          if (slotStart > bufferTime) {
            return slotStart;
          }
        }
      }
    }
    
    return null;
  }

  calculateSessionPrice(durationMinutes: number): number {
    if (!this.hourlyRate) return 0;
    const hours = durationMinutes / 60;
    return Number((this.hourlyRate * hours).toFixed(2));
  }

  // Static methods for search
  static async searchCoaches(filters: {
    specialization?: string;
    minRating?: number;
    maxPrice?: number;
    language?: string;
    isAvailable?: boolean;
    search?: string;
  }) {
    const where: any = {
      isActive: true,
    };

    if (filters.specialization) {
      where.specializations = { [Op.contains]: [filters.specialization] };
    }

    if (filters.minRating) {
      where.averageRating = { [Op.gte]: filters.minRating };
    }

    if (filters.maxPrice) {
      where.hourlyRate = { [Op.lte]: filters.maxPrice };
    }

    if (filters.language) {
      where.languages = { [Op.contains]: [filters.language] };
    }

    if (filters.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable;
    }

    if (filters.search) {
      where[Op.or] = [
        { displayName: { [Op.iLike]: `%${filters.search}%` } },
        { bio: { [Op.iLike]: `%${filters.search}%` } },
        { title: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    return this.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [
        ['isFeatured', 'DESC'],
        ['averageRating', 'DESC'],
        ['totalSessions', 'DESC'],
      ],
    });
  }
}