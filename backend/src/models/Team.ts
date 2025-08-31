import { Model, DataTypes, Sequelize, Association } from 'sequelize';
import { User } from './User';
import { Organization } from './Organization';

export interface TeamAttributes {
  id?: number;
  organizationId: number;
  name: string;
  description?: string;
  department?: string;
  managerId?: number;
  settings?: any;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Team extends Model<TeamAttributes> implements TeamAttributes {
  declare id: number;
  public organizationId!: number;
  public name!: string;
  public description?: string;
  public department?: string;
  public managerId?: number;
  public settings?: any;
  public isActive!: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public readonly organization?: Organization;
  public readonly manager?: User;
  public readonly members?: User[];

  public static associations: {
    organization: Association<Team, Organization>;
    manager: Association<Team, User>;
    members: Association<Team, User>;
  };

  public static initModel(sequelize: Sequelize): typeof Team {
    Team.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        organizationId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'organizations',
            key: 'id',
          },
          field: 'organization_id',
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
        },
        department: {
          type: DataTypes.STRING(100),
        },
        managerId: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id',
          },
          field: 'manager_id',
        },
        settings: {
          type: DataTypes.JSONB,
          defaultValue: {},
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          field: 'is_active',
        },
      },
      {
        sequelize,
        modelName: 'Team',
        tableName: 'teams',
        underscored: true,
        timestamps: true,
        indexes: [
          {
            unique: true,
            fields: ['organization_id', 'name'],
          },
        ],
      }
    );

    return Team;
  }
}
