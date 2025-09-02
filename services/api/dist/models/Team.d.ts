import { Model, Sequelize, Association } from 'sequelize';
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
export declare class Team extends Model<TeamAttributes> implements TeamAttributes {
    id: number;
    organizationId: number;
    name: string;
    description?: string;
    department?: string;
    managerId?: number;
    settings?: any;
    isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly organization?: Organization;
    readonly manager?: User;
    readonly members?: User[];
    static associations: {
        organization: Association<Team, Organization>;
        manager: Association<Team, User>;
        members: Association<Team, User>;
    };
    static initModel(sequelize: Sequelize): typeof Team;
}
//# sourceMappingURL=Team.d.ts.map