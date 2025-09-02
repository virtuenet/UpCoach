"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Team = void 0;
const sequelize_1 = require("sequelize");
class Team extends sequelize_1.Model {
    organizationId;
    name;
    description;
    department;
    managerId;
    settings;
    isActive;
    // Associations
    organization;
    manager;
    members;
    static associations;
    static initModel(sequelize) {
        Team.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            organizationId: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'organizations',
                    key: 'id',
                },
                field: 'organization_id',
            },
            name: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
            },
            department: {
                type: sequelize_1.DataTypes.STRING(100),
            },
            managerId: {
                type: sequelize_1.DataTypes.INTEGER,
                references: {
                    model: 'users',
                    key: 'id',
                },
                field: 'manager_id',
            },
            settings: {
                type: sequelize_1.DataTypes.JSONB,
                defaultValue: {},
            },
            isActive: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: true,
                field: 'is_active',
            },
        }, {
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
        });
        return Team;
    }
}
exports.Team = Team;
//# sourceMappingURL=Team.js.map