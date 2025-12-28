import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database';

/**
 * Team Attributes
 */
export interface TeamAttributes {
  id: string;
  tenantId: string;
  organizationId?: string;
  name: string;
  description?: string;
  avatar?: string;
  settings: {
    visibility: 'public' | 'private';
    joinApprovalRequired: boolean;
    memberCanInvite: boolean;
  };
  statistics: {
    memberCount: number;
    activeGoals: number;
    completedGoals: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamCreationAttributes
  extends Optional<TeamAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

/**
 * Team Model
 */
export class Team extends Model<TeamAttributes, TeamCreationAttributes> implements TeamAttributes {
  public id!: string;
  public tenantId!: string;
  public organizationId?: string;
  public name!: string;
  public description?: string;
  public avatar?: string;
  public settings!: {
    visibility: 'public' | 'private';
    joinApprovalRequired: boolean;
    memberCanInvite: boolean;
  };
  public statistics!: {
    memberCount: number;
    activeGoals: number;
    completedGoals: number;
  };
  public createdBy!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Team.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        visibility: 'private',
        joinApprovalRequired: true,
        memberCanInvite: false,
      },
    },
    statistics: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        memberCount: 0,
        activeGoals: 0,
        completedGoals: 0,
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
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
    tableName: 'teams',
    timestamps: true,
    indexes: [
      {
        fields: ['tenantId'],
      },
      {
        fields: ['organizationId'],
      },
      {
        fields: ['createdBy'],
      },
    ],
  }
);

export default Team;
