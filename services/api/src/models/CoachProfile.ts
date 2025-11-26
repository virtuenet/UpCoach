import { Op, Sequelize } from 'sequelize';
import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
} from 'sequelize';

import { CoachPackage } from './CoachPackage';
import type { CoachReview } from './CoachReview';
import type { CoachSession } from './CoachSession';
import { User } from './User';
import { IUser } from './interfaces';

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

export class CoachProfile extends Model<
  InferAttributes<CoachProfile>,
  InferCreationAttributes<CoachProfile>
> {
  declare id: CreationOptional<number>;
  declare userId: ForeignKey<number>;

  declare displayName: string;
  declare title: string | null;
  declare bio: string | null;
  declare specializations: string[];
  declare certifications: Certification[];
  declare experienceYears: number;
  declare languages: string[];
  declare timezone: string;

  // Availability & Booking
  declare isAvailable: boolean;
  declare hourlyRate: number | null;
  declare currency: string;
  declare minBookingHours: number;
  declare maxBookingHours: number;
  declare availabilitySchedule: AvailabilitySchedule;
  declare bookingBufferHours: number;

  // Profile Media
  declare profileImageUrl: string | null;
  declare coverImageUrl: string | null;
  declare introVideoUrl: string | null;
  declare galleryImages: string[];

  // Stats & Rating
  declare totalSessions: number;
  declare totalClients: number;
  declare averageRating: number;
  declare ratingCount: number;
  declare responseTimeHours: number | null;

  // Settings
  declare isVerified: boolean;
  declare isFeatured: boolean;
  declare isActive: boolean;
  declare acceptsInsurance: boolean;
  declare acceptedPaymentMethods: string[];

  // Metadata
  declare tags: string[];
  declare seoSlug: string | null;
  declare metadata: unknown;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<IUser>;
  declare sessions?: NonAttribute<CoachSession[]>;
  declare reviews?: NonAttribute<CoachReview[]>;
  declare packages?: NonAttribute<CoachPackage[]>;

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

  // Static method declaration for lazy initialization
  static initializeModel: (sequelize: Sequelize) => typeof CoachProfile;
}

// Static method for deferred initialization
CoachProfile.initializeModel = function(sequelizeInstance: Sequelize) {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance required for CoachProfile initialization');
  }

  CoachProfile.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    displayName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    specializations: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
    },
    certifications: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    experienceYears: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    languages: {
      type: DataTypes.ARRAY(DataTypes.STRING(10)),
      defaultValue: ['en'],
    },
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'UTC',
    },
    // Availability & Booking
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    hourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    minBookingHours: {
      type: DataTypes.DECIMAL(3, 1),
      defaultValue: 1.0,
    },
    maxBookingHours: {
      type: DataTypes.DECIMAL(3, 1),
      defaultValue: 4.0,
    },
    availabilitySchedule: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    bookingBufferHours: {
      type: DataTypes.INTEGER,
      defaultValue: 24,
    },
    // Profile Media
    profileImageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    coverImageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    introVideoUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    galleryImages: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    // Stats & Rating
    totalSessions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalClients: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.0,
    },
    ratingCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    responseTimeHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    // Settings
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    acceptsInsurance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    acceptedPaymentMethods: {
      type: DataTypes.JSONB,
      defaultValue: ['card'],
    },
    // Metadata
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
    },
    seoSlug: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
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
    sequelize: sequelizeInstance,
    modelName: 'CoachProfile',
    tableName: 'coach_profiles',
    timestamps: true,
    hooks: {
      beforeCreate: (instance: CoachProfile) => {
        if (!instance.seoSlug && instance.displayName) {
          instance.seoSlug = instance.displayName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

          // Add random suffix to ensure uniqueness
          instance.seoSlug += '-' + Math.random().toString(36).substr(2, 5);
        }
      },
      beforeUpdate: (instance: CoachProfile) => {
        if (!instance.seoSlug && instance.displayName) {
          instance.seoSlug = instance.displayName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

          // Add random suffix to ensure uniqueness
          instance.seoSlug += '-' + Math.random().toString(36).substr(2, 5);
        }
      },
    },
  }
);

  // Define associations
  // Conditionally set up associations if models are available
  if (sequelizeInstance.models.User) {
    CoachProfile.belongsTo(sequelizeInstance.models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  }

  if (sequelizeInstance.models.CoachSession) {
    CoachProfile.hasMany(sequelizeInstance.models.CoachSession, {
      foreignKey: 'coachId',
      as: 'sessions',
    });
  }

  if (sequelizeInstance.models.CoachReview) {
    CoachProfile.hasMany(sequelizeInstance.models.CoachReview, {
      foreignKey: 'coachId',
      as: 'reviews',
    });
  }

  if (sequelizeInstance.models.CoachPackage) {
    CoachProfile.hasMany(sequelizeInstance.models.CoachPackage, {
      foreignKey: 'coachId',
      as: 'packages',
    });
  }

  return CoachProfile;
};

// Comment out immediate initialization to prevent premature execution
// CoachProfile.init(...) will be called via CoachProfile.initializeModel() after database is ready

export default CoachProfile;
