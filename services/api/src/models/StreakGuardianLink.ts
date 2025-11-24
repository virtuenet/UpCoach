import { Model, DataTypes, Optional } from 'sequelize';

import { sequelize } from '../config/sequelize';

export type GuardianStatus = 'pending' | 'accepted' | 'blocked';

export interface StreakGuardianAttributes {
  id: string;
  ownerUserId: string;
  guardianUserId: string;
  status: GuardianStatus;
  lastAlertAt?: Date;
  snoozedUntil?: Date;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

type StreakGuardianCreation = Optional<
  StreakGuardianAttributes,
  'id' | 'status' | 'metadata' | 'lastAlertAt' | 'snoozedUntil'
>;

export class StreakGuardianLink
  extends Model<StreakGuardianAttributes, StreakGuardianCreation>
  implements StreakGuardianAttributes
{
  declare id: string;
  declare ownerUserId: string;
  declare guardianUserId: string;
  declare status: GuardianStatus;
  declare lastAlertAt?: Date;
  declare snoozedUntil?: Date;
  declare metadata?: Record<string, unknown>;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

StreakGuardianLink.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ownerUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    guardianUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'blocked'),
      defaultValue: 'pending',
      allowNull: false,
    },
    lastAlertAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    snoozedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
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
    sequelize,
    modelName: 'StreakGuardianLink',
    tableName: 'streak_guardian_links',
    indexes: [
      {
        unique: true,
        fields: ['ownerUserId', 'guardianUserId'],
        name: 'guardian_owner_guardian_idx',
      },
    ],
  }
);

